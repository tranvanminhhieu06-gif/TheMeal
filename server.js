// the.Meal storefront — Node.js + Express
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cfg = require('./src/config');
const views = require('./src/views');
const store = require('./src/store');
const blocks = require('./src/blocks');

const app = express();
const PORT = process.env.PORT || 3000;
const STATIC_BASE = process.env.BASE_PATH || '/TheMeal';
const DATA_DIR = store.DATA;
const ORDERS = path.join(DATA_DIR, 'orders.json');
const CONTACTS = path.join(DATA_DIR, 'contacts.json');
const UPLOADS = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

const readJson = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return []; } };
const writeJson = (f, d) => { const tmp = f + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(d, null, 2)); fs.renameSync(tmp, f); };
const smallJson = express.json({ limit: '20kb' });
const bigJson = express.json({ limit: '4mb' });

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN' });
  next();
});
app.use((req, res, next) => {
  // Cho phép xem thử bản build tĩnh (có BASE_PATH) ngay trên server local.
  if (req.url === STATIC_BASE) return res.redirect(301, STATIC_BASE + '/');
  if (req.url.startsWith(STATIC_BASE + '/')) req.url = req.url.slice(STATIC_BASE.length);
  next();
});
const maxAge = process.env.NODE_ENV === 'production' ? '7d' : 0;
app.use(express.static(path.join(__dirname, 'public'), { maxAge }));
app.use('/uploads', express.static(UPLOADS, { maxAge }));

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

const html = (res, s, code = 200) => res.status(code).type('html').send(s);
const live = () => store.published();
const findProduct = (c, slug) => c.products.find(p => p.slug === slug);
const findPage = (c, p) => c.pages.find(x => x.path === p);
const findPost = (c, slug, all) => (c.posts || []).find(x => x.slug === slug && (all || !x.hidden));
const findEvent = (c, slug, all) => (c.events || []).find(x => x.slug === slug && (all || !x.hidden));

/* ---------- Lượt xem bài viết (data/views.json, ghi gộp mỗi 5 giây) ---------- */
const VIEWS_FILE = path.join(DATA_DIR, 'views.json');
let viewCounts = (() => { try { return JSON.parse(fs.readFileSync(VIEWS_FILE, 'utf8')); } catch { return {}; } })();
let viewsTimer = null;
function countView(req, slug) {
  if (/bot|crawl|spider|preview|facebookexternalhit|zalo/i.test(req.headers['user-agent'] || '')) return;
  viewCounts[slug] = (viewCounts[slug] || 0) + 1;
  if (!viewsTimer) viewsTimer = setTimeout(() => { viewsTimer = null; try { writeJson(VIEWS_FILE, viewCounts); } catch (e) { console.error(e); } }, 5000);
}

/* ---------- Trang chức năng ---------- */
app.get('/gio-hang', (req, res) => html(res, views.cartPage(live())));
app.get('/thanh-toan', (req, res) => html(res, views.checkoutPage(live())));
app.get('/dat-hang/thanh-cong', (req, res) => {
  const o = readJson(ORDERS).find(x => x.code === String(req.query.code || '') && x.token === String(req.query.t || ''));
  html(res, views.successPage(live(), o), o ? 200 : 404);
});

/* ---------- SEO ---------- */
app.get('/robots.txt', (req, res) => res.type('text').send(`User-agent: *\nDisallow: /admin\nDisallow: /gio-hang\nDisallow: /thanh-toan\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`));
app.get('/sitemap.xml', (req, res) => {
  const c = live();
  const urls = [...c.pages.filter(p => !p.noindex).map(p => p.path), ...c.products.map(p => '/san-pham/' + p.slug),
    ...(c.posts || []).filter(p => !p.hidden).map(p => '/tin-tuc/' + p.slug), ...(c.events || []).filter(e => !e.hidden).map(e => '/su-kien/' + e.slug)];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${views.esc(cfg.siteUrl + u)}</loc></url>`).join('')}</urlset>`);
});

/* ---------- API ---------- */
app.get('/api/products', (req, res) => res.json(live().products.map(views.publicProduct)));

const PHONE_RE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const clean = (s, max = 200) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

app.post('/api/orders', smallJson, rateLimit(6), async (req, res) => {
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

  // Giá luôn lấy từ dữ liệu sản phẩm đang đăng, không tin giá từ trình duyệt.
  const products = live().products;
  const items = [];
  for (const it of Array.isArray(b.items) ? b.items.slice(0, 20) : []) {
    const p = products.find(x => x.id === it.id);
    const qty = Math.min(10, Math.max(1, parseInt(it.qty, 10) || 0));
    const color = p && (p.colors || []).find(x => x.id === it.color);
    const sizes = p ? blocks.sizesOf(p) : [];
    const sizeOk = p && (sizes.length === 0 || sizes.includes(String(it.size)));
    if (!p || !color || !sizeOk) { errors.items = 'Giỏ hàng có sản phẩm không hợp lệ, vui lòng kiểm tra lại.'; break; }
    items.push({ id: p.id, name: p.name, image: p.image, price: Number(p.price), qty, color: color.id, colorName: color.name, size: sizes.length ? String(it.size) : null });
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

app.post('/api/contact', smallJson, rateLimit(5), (req, res) => {
  const b = req.body || {};
  const entry = { type: ['partner', 'event'].includes(b.type) ? b.type : 'contact', event: b.type === 'event' ? clean(b.event, 160) : undefined, name: clean(b.name, 80), phone: clean(b.phone, 20).replace(/[\s.-]/g, ''), email: clean(b.email, 120),
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
    : `${contact.type === 'partner' ? '🤝 Đăng ký đối tác' : contact.type === 'event' ? '🎟 Đăng ký sự kiện: ' + contact.event : '📩 Yêu cầu tư vấn'}\n${contact.name} - ${contact.phone} ${contact.email}\n${[contact.company, contact.bizType, contact.province, contact.product].filter(Boolean).join(' · ')}\n${contact.message}`;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text }) });
}

/* ---------- Admin (Basic Auth) ---------- */
// Sai mật khẩu quá 10 lần / 15 phút theo IP thì khoá tạm, chống dò mật khẩu.
const authFails = new Map();
function adminAuth(req, res, next) {
  const { user, pass } = cfg.admin;
  if (!user || !pass) return res.status(503).type('text').send('Trang quản trị chưa bật. Đặt ADMIN_USER và ADMIN_PASS trong biến môi trường.');
  const now = Date.now();
  const fails = (authFails.get(req.ip) || []).filter(t => now - t < 15 * 60_000);
  if (fails.length >= 10) return res.status(429).type('text').send('Sai mật khẩu quá nhiều lần, thử lại sau 15 phút.');
  const header = req.headers.authorization || '';
  if (header.startsWith('Basic ')) {
    const [u, ...rest] = Buffer.from(header.slice(6), 'base64').toString().split(':');
    const p = rest.join(':');
    const ok = crypto.timingSafeEqual(crypto.createHash('sha256').update(u + ':' + p).digest(), crypto.createHash('sha256').update(user + ':' + pass).digest());
    if (ok) { authFails.delete(req.ip); return next(); }
    fails.push(now); authFails.set(req.ip, fails);
  }
  res.set('WWW-Authenticate', 'Basic realm="Quan tri website", charset="UTF-8"').status(401).send('Cần đăng nhập');
}
// Chặn gửi lệnh quản trị từ trang khác (CSRF): bắt buộc header riêng + cùng nguồn.
function sameOrigin(req, res, next) {
  const origin = req.headers.origin;
  if (req.headers['x-cms'] !== '1' || (origin && new URL(origin).host !== req.headers.host)) return res.status(403).json({ errors: ['Yêu cầu không hợp lệ.'] });
  next();
}
const ok = (res, r) => (r && r.ok === false ? res.status(400).json(r) : res.json(r || { ok: true }));

app.use('/admin', adminAuth);
app.get('/admin', (req, res) => html(res, views.adminShell(live())));

app.get('/admin/api/bootstrap', (req, res) => {
  res.json({ schema: blocks.schema(), draft: store.draft(), hasDraft: store.hasDraft(), history: store.history(), media: listMedia(), user: cfg.admin.user });
});
app.put('/admin/api/draft', sameOrigin, bigJson, (req, res) => ok(res, store.saveDraft(store.normalize(req.body))));
app.post('/admin/api/publish', sameOrigin, (req, res) => ok(res, store.publish()));
app.post('/admin/api/discard', sameOrigin, (req, res) => { store.discardDraft(); res.json({ ok: true, draft: store.draft() }); });
app.get('/admin/api/history', (req, res) => res.json(store.history()));
app.post('/admin/api/restore/:id', sameOrigin, (req, res) => { const r = store.restore(req.params.id); if (r.ok) r.draft = store.draft(); ok(res, r); });
app.post('/admin/api/reset', sameOrigin, (req, res) => { const r = store.saveDraft(store.makeDefault()); if (r.ok) r.draft = store.draft(); ok(res, r); });

// Xem trước bản nháp (cùng đường dẫn /admin nên trình duyệt tự gửi đăng nhập)
app.get('/admin/preview', (req, res) => {
  const c = store.draft();
  const p = String(req.query.path || '/').split('#')[0].replace(/\/+$/, '') || '/';
  const m = p.match(/^\/san-pham\/([^/]+)$/);
  const prod = m && findProduct(c, m[1]);
  if (prod) return html(res, views.productPage(c, prod, { preview: true }));
  const pm = p.match(/^\/tin-tuc\/([^/]+)$/), em = p.match(/^\/su-kien\/([^/]+)$/);
  const post = pm && findPost(c, pm[1], true), ev = em && findEvent(c, em[1], true);
  if (post) return html(res, views.postPage(c, post, { preview: true, views: viewCounts }));
  if (ev) return html(res, views.eventPage(c, ev, { preview: true }));
  const pg = findPage(c, p);
  if (pg) return html(res, views.page(c, pg, { preview: true, views: viewCounts }));
  html(res, views.notFound(c, 'Trang này không có trong bản nháp', `Đường dẫn ${p} chưa có trang nào.`), 404);
});

// Thư viện ảnh: ảnh có sẵn (/img) + ảnh tải lên (/uploads)
const MEDIA_EXT = /\.(webp|jpe?g|png|gif|mp4)$/i;
function listMedia() {
  const read = (dir, prefix, removable) => {
    try {
      return fs.readdirSync(dir).filter(f => MEDIA_EXT.test(f)).map(f => {
        const st = fs.statSync(path.join(dir, f));
        return { src: prefix + f, size: st.size, time: st.mtimeMs, removable, video: /\.mp4$/i.test(f) };
      });
    } catch { return []; }
  };
  return [...read(UPLOADS, '/uploads/', true).sort((a, b) => b.time - a.time), ...read(path.join(__dirname, 'public', 'img'), '/img/', false)];
}
app.get('/admin/api/media', (req, res) => res.json(listMedia()));

const UPLOAD_TYPES = {
  'image/jpeg': { ext: '.jpg', max: 10, magic: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: '.png', max: 10, magic: b => b.slice(0, 4).toString('hex') === '89504e47' },
  'image/webp': { ext: '.webp', max: 10, magic: b => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP' },
  'image/gif': { ext: '.gif', max: 10, magic: b => b.slice(0, 4).toString() === 'GIF8' },
  'video/mp4': { ext: '.mp4', max: 60, magic: b => b.slice(4, 8).toString() === 'ftyp' }
};
app.post('/admin/api/upload', sameOrigin, express.raw({ type: Object.keys(UPLOAD_TYPES), limit: '60mb' }), (req, res) => {
  const t = UPLOAD_TYPES[(req.headers['content-type'] || '').split(';')[0]];
  const buf = req.body;
  if (!t || !Buffer.isBuffer(buf) || !buf.length) return res.status(400).json({ errors: ['Chỉ nhận ảnh JPG, PNG, WEBP, GIF hoặc video MP4.'] });
  if (buf.length > t.max * 1024 * 1024) return res.status(400).json({ errors: [`Tệp quá lớn (tối đa ${t.max}MB).`] });
  if (!t.magic(buf)) return res.status(400).json({ errors: ['Nội dung tệp không khớp định dạng.'] });
  const base = String(req.query.name || 'anh').replace(/\.[^.]*$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'anh';
  const name = `${base}-${Date.now().toString(36)}${t.ext}`;
  fs.writeFileSync(path.join(UPLOADS, name), buf);
  res.status(201).json({ ok: true, src: '/uploads/' + name, size: buf.length });
});
app.delete('/admin/api/media/:file', sameOrigin, (req, res) => {
  const f = path.basename(req.params.file);
  if (!MEDIA_EXT.test(f)) return res.status(400).json({ errors: ['Tệp không hợp lệ.'] });
  try { fs.unlinkSync(path.join(UPLOADS, f)); res.json({ ok: true }); } catch { res.status(404).json({ errors: ['Không tìm thấy tệp.'] }); }
});

// Đơn hàng & liên hệ
const STATUSES = ['Mới', 'Đã xác nhận', 'Đang giao', 'Hoàn tất', 'Huỷ'];
app.get('/admin/api/orders', (req, res) => res.json({ orders: readJson(ORDERS), leads: readJson(CONTACTS), statuses: STATUSES }));
app.post('/admin/api/orders/:code/status', sameOrigin, smallJson, (req, res) => {
  const all = readJson(ORDERS); const o = all.find(x => x.code === req.params.code);
  if (!o || !STATUSES.includes((req.body || {}).status)) return res.status(400).json({ errors: ['Không cập nhật được trạng thái.'] });
  o.status = req.body.status; writeJson(ORDERS, all); res.json({ ok: true });
});
app.get('/admin/orders.csv', (req, res) => {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['Mã', 'Ngày', 'Trạng thái', 'Họ tên', 'SĐT', 'Email', 'Tỉnh/TP', 'Địa chỉ', 'Sản phẩm', 'Tổng', 'Thanh toán', 'Ghi chú'].map(q).join(',')];
  for (const o of readJson(ORDERS)) lines.push([o.code, o.createdAt, o.status, o.customer.name, o.customer.phone, o.customer.email, o.customer.province, o.customer.address,
    o.items.map(i => `${i.name} ${i.colorName}${i.size ? ' S' + i.size : ''} x${i.qty}`).join('; '), o.total, o.payment, o.customer.note].map(q).join(','));
  res.type('text/csv').attachment('don-hang.csv').send('﻿' + lines.join('\n'));
});

/* ---------- Trang nội dung (dựng từ khối) ---------- */
app.get('/tin-tuc/:slug', (req, res, next) => {
  const c = live(), p = findPost(c, req.params.slug);
  if (!p) return next();
  countView(req, p.slug);
  html(res, views.postPage(c, p, { views: viewCounts }));
});
app.get('/su-kien/:slug', (req, res, next) => {
  const c = live(), e = findEvent(c, req.params.slug);
  return e ? html(res, views.eventPage(c, e)) : next();
});
app.get('/san-pham/:slug', (req, res, next) => {
  const c = live(), p = findProduct(c, req.params.slug);
  return p ? html(res, views.productPage(c, p)) : next();
});
app.get('*', (req, res, next) => {
  const c = live();
  const p = req.path.replace(/\/+$/, '') || '/';
  const pg = findPage(c, p);
  if (!pg) return next();
  if (req.path !== p && req.path !== '/') return res.redirect(301, p);
  html(res, views.page(c, pg, { views: viewCounts }));
});

app.use((req, res) => html(res, views.notFound(live()), 404));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === 'entity.too.large') return res.status(413).json({ errors: ['Dữ liệu gửi lên quá lớn.'] });
  res.status(500).type('html').send(views.notFound(live(), 'Có lỗi xảy ra', 'Hệ thống đang gặp sự cố, vui lòng thử lại hoặc gọi hotline.'));
});

app.listen(PORT, '0.0.0.0', () => console.log(`Website đang chạy tại http://localhost:${PORT}`));
