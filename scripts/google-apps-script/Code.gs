/**
 * the.Meal — nhận đơn hàng & form liên hệ từ bản tĩnh (GitHub Pages) vào Google Sheet.
 * Cách cài: xem README.md cùng thư mục.
 *
 * Giá được tính lại ở đây theo PRODUCTS, không tin giá gửi từ trình duyệt.
 * Khi đổi giá/màu/size trong src/products.js, nhớ sửa PRODUCTS bên dưới cho khớp.
 */

const NOTIFY_EMAIL = '';            // Email nhận báo đơn mới, VD: 'marketing@themeal.vn'. Để trống = không gửi mail.
const SHEET_ORDERS = 'Don hang';
const SHEET_CONTACTS = 'Lien he';

const PRODUCTS = {
  'meal-ring-active':     { name: 'Meal Ring Active',     price: 1590000, colors: { den: 'Đen nhám', bac: 'Bạc ánh kim' }, sizes: ['7', '8', '9', '10', '11', '12'] },
  'meal-ring-active-pro': { name: 'Meal Ring Active Pro', price: 2990000, colors: { den: 'Đen nhám', bac: 'Bạc ánh kim' }, sizes: ['7', '8', '9', '10', '11', '12'] },
  'meal-fit-insight':     { name: 'Meal Fit Insight',     price: 1890000, colors: { den: 'Đen' }, sizes: [] }
};

const PHONE_RE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function doGet() {
  return json({ ok: true, service: 'the.Meal orders' });
}

function doPost(e) {
  let body;
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json({ ok: false, error: 'Dữ liệu không hợp lệ.' }); }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (body.type === 'admin') return json(handleAdmin(body));
    return json(body.type === 'order' ? handleOrder(body) : handleLead(body));
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'Hệ thống đang bận, vui lòng thử lại sau ít phút.' });
  } finally {
    lock.releaseLock();
  }
}

function handleOrder(b) {
  const c = b.customer || {};
  const customer = {
    name: clean(c.name, 80), phone: clean(c.phone, 20).replace(/[\s.-]/g, ''), email: clean(c.email, 120),
    province: clean(c.province, 80), address: clean(c.address, 200), note: clean(c.note, 500)
  };
  const errors = {};
  if (customer.name.length < 2) errors.name = 'Vui lòng nhập họ tên người nhận hàng.';
  if (!PHONE_RE.test(customer.phone)) errors.phone = 'Số điện thoại chưa đúng.';
  if (customer.email && !EMAIL_RE.test(customer.email)) errors.email = 'Email chưa đúng định dạng.';
  if (!customer.province) errors.province = 'Vui lòng nhập tỉnh/thành phố.';
  if (customer.address.length < 5) errors.address = 'Vui lòng nhập địa chỉ cụ thể.';

  const items = [];
  (Array.isArray(b.items) ? b.items.slice(0, 20) : []).forEach(function (it) {
    const p = PRODUCTS[it.id];
    const qty = Math.min(10, Math.max(1, parseInt(it.qty, 10) || 0));
    const colorName = p && p.colors[it.color];
    const sizeOk = p && (p.sizes.length === 0 || p.sizes.indexOf(String(it.size)) !== -1);
    if (!p || !colorName || !sizeOk) { errors.items = 'Giỏ hàng có sản phẩm không hợp lệ, vui lòng kiểm tra lại.'; return; }
    items.push({ name: p.name, price: p.price, qty: qty, colorName: colorName, size: p.sizes.length ? String(it.size) : '' });
  });
  if (!items.length && !errors.items) errors.items = 'Giỏ hàng đang trống.';
  if (Object.keys(errors).length) return { ok: false, errors: errors };
  if (tooMany(customer.phone)) return { ok: false, error: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.' };

  const subtotal = items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
  const code = 'TM' + Date.now().toString(36).toUpperCase().slice(-6) + (10 + Math.floor(Math.random() * 90));
  const payment = b.payment === 'bank' ? 'Chuyển khoản' : 'COD';
  const itemsText = items.map(function (i) { return i.name + ' · ' + i.colorName + (i.size ? ' · Size ' + i.size : '') + ' × ' + i.qty; }).join('\n');

  sheet(SHEET_ORDERS, ['Thời gian', 'Mã đơn', 'Trạng thái', 'Họ tên', 'SĐT', 'Email', 'Tỉnh/TP', 'Địa chỉ', 'Ghi chú', 'Sản phẩm', 'Tạm tính (₫)', 'Thanh toán', 'Trang'])
    .appendRow([new Date(), code, 'Mới', safe(customer.name), "'" + customer.phone, safe(customer.email), safe(customer.province), safe(customer.address), safe(customer.note), safe(itemsText), subtotal, payment, safe(clean(b.page, 300))]);

  notify('[the.Meal] Đơn mới ' + code + ' — ' + customer.name,
    'Mã đơn: ' + code + '\nKhách: ' + customer.name + ' — ' + customer.phone + '\nĐịa chỉ: ' + customer.address + ', ' + customer.province +
    '\nThanh toán: ' + payment + '\n\n' + itemsText + '\n\nTạm tính: ' + subtotal.toLocaleString('vi-VN') + '₫' + (customer.note ? '\nGhi chú: ' + customer.note : ''));

  return { ok: true, code: code, subtotal: subtotal, total: subtotal };
}

function handleLead(b) {
  const e = {
    type: b.type === 'partner' ? 'Hợp tác' : 'Liên hệ', name: clean(b.name, 80), phone: clean(b.phone, 20).replace(/[\s.-]/g, ''), email: clean(b.email, 120),
    company: clean(b.company, 120), bizType: clean(b.bizType, 80), province: clean(b.province, 80), product: clean(b.product, 80), message: clean(b.message, 1000)
  };
  const errors = {};
  if (e.name.length < 2) errors.name = 'Vui lòng nhập họ tên.';
  if (!PHONE_RE.test(e.phone)) errors.phone = 'Số điện thoại chưa đúng.';
  if (e.email && !EMAIL_RE.test(e.email)) errors.email = 'Email chưa đúng định dạng.';
  if (Object.keys(errors).length) return { ok: false, errors: errors };
  if (tooMany(e.phone)) return { ok: false, error: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.' };

  sheet(SHEET_CONTACTS, ['Thời gian', 'Loại', 'Họ tên', 'SĐT', 'Email', 'Công ty', 'Loại hình', 'Tỉnh/TP', 'Sản phẩm quan tâm', 'Nội dung', 'Trang'])
    .appendRow([new Date(), e.type, safe(e.name), "'" + e.phone, safe(e.email), safe(e.company), safe(e.bizType), safe(e.province), safe(e.product), safe(e.message), safe(clean(b.page, 300))]);

  notify('[the.Meal] ' + e.type + ' mới — ' + e.name, e.type + '\n' + e.name + ' — ' + e.phone + (e.email ? '\n' + e.email : '') + (e.company ? '\nCông ty: ' + e.company : '') + (e.message ? '\n\n' + e.message : ''));
  return { ok: true };
}

/* ---------- Trang quản trị tĩnh (/admin) ----------
 * Mật khẩu đặt ở Project Settings → Script properties → ADMIN_KEY (không ghi vào file này vì repo công khai).
 * Sai quá 10 lần / 15 phút thì khoá tạm, chống dò mật khẩu.
 */
const ORDER_STATUSES = ['Mới', 'Đã xác nhận', 'Đang giao', 'Hoàn tất', 'Huỷ'];

function handleAdmin(b) {
  const key = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!key) return { ok: false, error: 'Chưa đặt ADMIN_KEY trong Script properties của Apps Script.' };
  const cache = CacheService.getScriptCache(), fails = Number(cache.get('admin_fail') || 0);
  if (fails >= 10) return { ok: false, error: 'Sai mật khẩu quá nhiều lần, thử lại sau 15 phút.' };
  if (String(b.key || '') !== key) { cache.put('admin_fail', String(fails + 1), 900); return { ok: false, auth: false, error: 'Sai mật khẩu quản trị.' }; }

  if (b.action === 'status') {
    if (ORDER_STATUSES.indexOf(b.status) === -1) return { ok: false, error: 'Trạng thái không hợp lệ.' };
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ORDERS);
    const codes = sh ? sh.getRange(1, 2, sh.getLastRow(), 1).getValues() : [];
    for (let i = 1; i < codes.length; i++) {
      if (codes[i][0] === b.code) { sh.getRange(i + 1, 3).setValue(b.status); return { ok: true }; }
    }
    return { ok: false, error: 'Không tìm thấy đơn ' + b.code + '.' };
  }
  return {
    ok: true,
    orders: rows(SHEET_ORDERS, ['createdAt', 'code', 'status', 'name', 'phone', 'email', 'province', 'address', 'note', 'items', 'total', 'payment', 'page']),
    leads: rows(SHEET_CONTACTS, ['createdAt', 'type', 'name', 'phone', 'email', 'company', 'bizType', 'province', 'product', 'message', 'page'])
  };
}
function rows(name, keys) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, keys.length).getValues().map(function (r) {
    const o = {};
    keys.forEach(function (k, i) { o[k] = r[i] instanceof Date ? r[i].toISOString() : r[i]; });
    return o;
  });
}

/* ---------- helpers ---------- */
function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function clean(s, max) {
  return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 200);
}
// Chặn chèn công thức vào Sheet (ô bắt đầu bằng = + - @)
function safe(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function sheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); sh.setFrozenRows(1); sh.getRange(1, 1, 1, headers.length).setFontWeight('bold'); }
  return sh;
}
// Tối đa 5 lần gửi / 10 phút cho mỗi số điện thoại
function tooMany(phone) {
  const cache = CacheService.getScriptCache(), k = 'n_' + phone, n = Number(cache.get(k) || 0);
  if (n >= 5) return true;
  cache.put(k, String(n + 1), 600);
  return false;
}
function notify(subject, text) {
  if (!NOTIFY_EMAIL) return;
  try { MailApp.sendEmail(NOTIFY_EMAIL, subject, text); } catch (err) { console.error(err); }
}
