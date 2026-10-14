// the.Meal storefront — Node.js + Express
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cfg = require('./src/config');
const views = require('./src/views');
const { products, bySlug } = require('./src/products');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS = path.join(DATA_DIR, 'orders.json');
const CONTACTS = path.join(DATA_DIR, 'contacts.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

const readJson = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return []; } };
const writeJson = (f, d) => { const tmp = f + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(d, null, 2)); fs.renameSync(tmp, f); };

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN' });
  next();
});
app.use((req, res, next) => {
  if (req.url === '/project20') return res.redirect(301, '/project20/');
  if (req.url.startsWith('/project20/')) req.url = req.url.slice(10);
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0 }));

/* ---------- Simple in-memory rate limit for POST APIs ---------- */
const hits = new Map();
function rateLimit(max = 8, windowMs = 60_000) {
  return (req, res, next) => {
    const k = req.ip + req.path, now = Date.now();
    const arr = (hits.get(k) || []).filter(t => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.' });
    arr.push(now); hits.set(k, arr); next();
  };
}

/* ---------- Pages ---------- */
const html = (res, s, code = 200) => res.status(code).type('html').send(s);
app.get('/', (req, res) => html(res, views.home()));
app.get('/san-pham', (req, res) => html(res, views.productList()));
app.get('/san-pham/:slug', (req, res) => {
  const p = bySlug[req.params.slug];
  return p ? html(res, views.productPage(p)) : html(res, views.notFound(), 404);
});
app.get('/gio-hang', (req, res) => html(res, views.cartPage()));
app.get('/thanh-toan', (req, res) => html(res, views.checkoutPage()));
app.get('/dat-hang/thanh-cong', (req, res) => {
  const o = readJson(ORDERS).find(x => x.code === String(req.query.code || '') && x.token === String(req.query.t || ''));
  html(res, views.successPage(o), o ? 200 : 404);
});
app.get('/lien-he', (req, res) => html(res, views.contactPage()));
app.get('/hop-tac', (req, res) => html(res, views.partnerPage()));
app.get('/tin-tuc', (req, res) => html(res, views.newsPage()));
app.get('/chinh-sach/:slug', (req, res) => {
  const page = views.policyPage(req.params.slug);
  return page ? html(res, page) : html(res, views.notFound(), 404);
});

/* ---------- SEO ---------- */
app.get('/robots.txt', (req, res) => res.type('text').send(`User-agent: *\nDisallow: /admin\nDisallow: /gio-hang\nDisallow: /thanh-toan\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`));
app.get('/sitemap.xml', (req, res) => {
  const urls = ['/', '/san-pham', '/hop-tac', ...products.map(p => '/san-pham/' + p.slug), '/lien-he', '/tin-tuc', ...views.POLICIES.map(p => '/chinh-sach/' + p.slug)];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${cfg.siteUrl}${u}</loc></url>`).join('')}</urlset>`);
});

/* ---------- API ---------- */
app.get('/api/products', (req, res) => res.json(products.map(p => ({ id: p.id, name: p.name, price: p.price, image: p.image, colors: p.colors, sizes: p.sizes }))));

const PHONE_RE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const clean = (s, max = 200) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

app.post('/api/orders', rateLimit(6), async (req, res) => {
  const b = req.body || {};
  const c = b.customer || {};
  const customer = {
    name: clean(c.name, 80), phone: clean(c.phone, 20).replace(/[\s.-]/g, ''), email: clean(c.email, 120),
    province: clean(c.province, 80), address: clean(c.address, 200), note: clean(c.note, 500)
  };
  const errors = {};
  if (customer.name.length < 2) errors.name = 'Vui lòng nhập họ tên người nhận hàng.';
  if (!PHONE_RE.test(customer.phone)) errors.phone = 'Số điện thoại chưa đúng.';
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) errors.email = 'Email chưa đúng định dạng.';
  if (!customer.province) errors.province = 'Vui lòng nhập tỉnh/thành phố.';
  if (customer.address.length < 5) errors.address = 'Vui lòng nhập địa chỉ cụ thể.';
  const payment = b.payment === 'bank' ? 'bank' : 'cod';

  const items = [];
  for (const it of Array.isArray(b.items) ? b.items.slice(0, 20) : []) {
    const p = products.find(x => x.id === it.id);
    const qty = Math.min(10, Math.max(1, parseInt(it.qty, 10) || 0));
    const color = p && p.colors.find(x => x.id === it.color);
    const sizeOk = p && (p.sizes.length === 0 || p.sizes.includes(String(it.size)));
    if (!p || !color || !sizeOk) { errors.items = 'Giỏ hàng có sản phẩm không hợp lệ, vui lòng kiểm tra lại.'; break; }
    items.push({ id: p.id, name: p.name, image: p.image, price: p.price, qty, color: color.id, colorName: color.name, size: p.sizes.length ? String(it.size) : null });
  }
  if (!items.length && !errors.items) errors.items = 'Giỏ hàng đang trống.';
  if (Object.keys(errors).length) return res.status(400).json({ errors });

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  let shipping = cfg.shippingFee;
  if (shipping != null && cfg.freeShipFrom != null && subtotal >= cfg.freeShipFrom) shipping = 0;
  const order = {
    code: 'TM' + Date.now().toString(36).toUpperCase().slice(-6) + crypto.randomInt(10, 99),
    token: crypto.randomBytes(8).toString('hex'),
    createdAt: new Date().toISOString(), status: 'Mới', customer, items, payment,
    subtotal, shipping, total: subtotal + (shipping || 0)
  };
  const all = readJson(ORDERS); all.push(order); writeJson(ORDERS, all);
  notifyTelegram(order).catch(() => {});
  res.status(201).json({ code: order.code, redirect: `/dat-hang/thanh-cong?code=${order.code}&t=${order.token}` });
});

app.post('/api/contact', rateLimit(5), (req, res) => {
  const b = req.body || {};
  const entry = { type: b.type === 'partner' ? 'partner' : 'contact', name: clean(b.name, 80), phone: clean(b.phone, 20).replace(/[\s.-]/g, ''), email: clean(b.email, 120),
    company: clean(b.company, 120), bizType: clean(b.bizType, 80), province: clean(b.province, 80), product: clean(b.product, 80), message: clean(b.message, 1000), createdAt: new Date().toISOString() };
  const errors = {};
  if (entry.name.length < 2) errors.name = 'Vui lòng nhập họ tên.';
  if (!PHONE_RE.test(entry.phone)) errors.phone = 'Số điện thoại chưa đúng.';
  if (entry.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) errors.email = 'Email chưa đúng định dạng.';
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  const all = readJson(CONTACTS); all.push(entry); writeJson(CONTACTS, all);
  notifyTelegram(null, entry).catch(() => {});
  res.status(201).json({ ok: true });
});

async function notifyTelegram(order, contact) {
  const { token, chatId } = cfg.telegram;
  if (!token || !chatId) return;
  const text = order
    ? `🛒 Đơn mới ${order.code}\n${order.customer.name} - ${order.customer.phone}\n${order.customer.address}, ${order.customer.province}\n` +
      order.items.map(i => `• ${i.name} ${i.colorName}${i.size ? ' S' + i.size : ''} x${i.qty}`).join('\n') +
      `\nTổng: ${views.vnd(order.total)} (${order.payment === 'bank' ? 'CK' : 'COD'})`
    : `${contact.type === 'partner' ? '🤝 Đăng ký đối tác' : '📩 Yêu cầu tư vấn'}\n${contact.name} - ${contact.phone} ${contact.email}\n${[contact.company, contact.bizType, contact.province, contact.product].filter(Boolean).join(' · ')}\n${contact.message}`;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text }) });
}

/* ---------- Admin (Basic Auth) ---------- */
function adminAuth(req, res, next) {
  const { user, pass } = cfg.admin;
  if (!user || !pass) return res.status(503).type('text').send('Trang quản trị chưa bật. Đặt ADMIN_USER và ADMIN_PASS trong biến môi trường.');
  const [u, p] = Buffer.from((req.headers.authorization || '').replace(/^Basic /, ''), 'base64').toString().split(':');
  const ok = u && p && crypto.timingSafeEqual(Buffer.from(crypto.createHash('sha256').update(u + ':' + p).digest()), Buffer.from(crypto.createHash('sha256').update(user + ':' + pass).digest()));
  if (!ok) return res.set('WWW-Authenticate', 'Basic realm="the.Meal admin"').status(401).send('Cần đăng nhập');
  next();
}
app.get('/admin', adminAuth, (req, res) => html(res, views.adminPage(readJson(ORDERS), readJson(CONTACTS))));
app.post('/admin/orders/:code/status', adminAuth, (req, res) => {
  const all = readJson(ORDERS); const o = all.find(x => x.code === req.params.code);
  if (o && ['Mới', 'Đã xác nhận', 'Đang giao', 'Hoàn tất', 'Huỷ'].includes(req.body.status)) { o.status = req.body.status; writeJson(ORDERS, all); }
  res.redirect('/admin');
});
app.get('/admin/orders.csv', adminAuth, (req, res) => {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['Mã', 'Ngày', 'Trạng thái', 'Họ tên', 'SĐT', 'Email', 'Tỉnh/TP', 'Địa chỉ', 'Sản phẩm', 'Tổng', 'Thanh toán', 'Ghi chú'].map(q).join(',')];
  for (const o of readJson(ORDERS)) lines.push([o.code, o.createdAt, o.status, o.customer.name, o.customer.phone, o.customer.email, o.customer.province, o.customer.address,
    o.items.map(i => `${i.name} ${i.colorName}${i.size ? ' S' + i.size : ''} x${i.qty}`).join('; '), o.total, o.payment, o.customer.note].map(q).join(','));
  res.type('text/csv').attachment('don-hang-themeal.csv').send('﻿' + lines.join('\n'));
});

app.use((req, res) => html(res, views.notFound(), 404));
app.use((err, req, res, next) => { console.error(err); res.status(500).type('html').send(views.notFound('Có lỗi xảy ra', 'Hệ thống đang gặp sự cố, vui lòng thử lại hoặc gọi hotline 0338 725 103.')); });

app.listen(PORT, '0.0.0.0', () => console.log(`the.Meal đang chạy tại http://localhost:${PORT}`));
