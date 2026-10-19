// Lưu nội dung website: bản đã đăng (content.json), bản nháp (content-draft.json) và lịch sử (history/).
const fs = require('fs');
const path = require('path');
const makeDefault = require('./content-default');

const DATA = path.join(__dirname, '..', 'data');
const PUB = path.join(DATA, 'content.json');
const DRAFT = path.join(DATA, 'content-draft.json');
const HIST = path.join(DATA, 'history');
const KEEP = 30;
const MAX_BYTES = 3 * 1024 * 1024;

// Đường dẫn trang do admin đặt không được trùng các route hệ thống.
const RESERVED = /^\/(admin|api|css|js|img|fonts|uploads|gio-hang|thanh-toan|dat-hang|robots\.txt|sitemap\.xml|favicon\.svg)(\/|$)/;
const PATH_RE = /^\/([a-z0-9]+(-[a-z0-9]+)*)(\/[a-z0-9]+(-[a-z0-9]+)*)*$/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

let cache = { mtime: 0, data: null };

function readJson(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } }
function writeJson(f, d) {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const tmp = f + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(d));
  fs.renameSync(tmp, f);
}

// Bổ sung các khoá mới (khi code thêm tính năng) vào nội dung đã lưu từ phiên bản cũ.
function normalize(c) {
  const d = makeDefault();
  if (!c || typeof c !== 'object') return d;
  const out = { ...d, ...c };
  out.theme = { ...d.theme, ...(c.theme || {}) };
  out.site = { ...d.site, ...(c.site || {}) };
  out.site.company = { ...d.site.company, ...((c.site || {}).company || {}) };
  out.site.footer = { ...d.site.footer, ...((c.site || {}).footer || {}) };
  out.sizeGuide = { ...d.sizeGuide, ...(c.sizeGuide || {}) };
  if (!Array.isArray(out.products)) out.products = d.products;
  if (!Array.isArray(out.pages)) out.pages = d.pages;
  if (!Array.isArray(out.posts)) out.posts = d.posts;
  if (!Array.isArray(out.events)) out.events = d.events;
  return out;
}

function published() {
  let st = null;
  try { st = fs.statSync(PUB); } catch { /* chưa đăng lần nào */ }
  const mtime = st ? st.mtimeMs : -1;
  if (cache.data && cache.mtime === mtime) return cache.data;
  cache = { mtime, data: normalize(st ? readJson(PUB) : null) };
  return cache.data;
}
const hasDraft = () => fs.existsSync(DRAFT);
const draft = () => (hasDraft() ? normalize(readJson(DRAFT)) : published());

// Kiểm tra trước khi lưu; trả về danh sách lỗi (rỗng = hợp lệ).
function validate(c) {
  const errors = [];
  if (!c || typeof c !== 'object' || !Array.isArray(c.pages) || !Array.isArray(c.products) || typeof c.site !== 'object') return ['Dữ liệu không đúng cấu trúc.'];
  if (Buffer.byteLength(JSON.stringify(c)) > MAX_BYTES) errors.push('Nội dung quá lớn (tối đa 3MB).');
  const paths = new Set();
  for (const p of c.pages) {
    if (!p || typeof p !== 'object' || !Array.isArray(p.blocks)) { errors.push('Có trang bị lỗi cấu trúc.'); continue; }
    if (p.path !== '/' && (!PATH_RE.test(p.path || '') || RESERVED.test(p.path))) errors.push(`Đường dẫn trang "${p.path}" không hợp lệ (chỉ chữ thường không dấu, số, gạch nối; không trùng đường dẫn hệ thống).`);
    if (/^\/san-pham\/[^/]+$/.test(p.path || '')) errors.push(`Đường dẫn "${p.path}" trùng dạng trang chi tiết sản phẩm.`);
    if (paths.has(p.path)) errors.push(`Hai trang trùng đường dẫn "${p.path}".`);
    paths.add(p.path);
  }
  if (!paths.has('/')) errors.push('Không được xoá trang chủ.');
  for (const p of paths) if (/^\/(tin-tuc|su-kien)\/[^/]+$/.test(p)) errors.push(`Đường dẫn "${p}" trùng dạng trang bài viết/sự kiện.`);
  const ids = new Set(), slugs = new Set();
  for (const p of c.products) {
    if (!p || !SLUG_RE.test(p.id || '') || !SLUG_RE.test(p.slug || '')) { errors.push(`Sản phẩm "${(p && p.name) || '?'}" có mã/đường dẫn không hợp lệ.`); continue; }
    if (ids.has(p.id)) errors.push(`Trùng mã sản phẩm "${p.id}".`);
    if (slugs.has(p.slug)) errors.push(`Trùng đường dẫn sản phẩm "${p.slug}".`);
    if (!(Number(p.price) >= 0)) errors.push(`Giá của "${p.name}" không hợp lệ.`);
    if (!Array.isArray(p.colors) || !p.colors.length) errors.push(`"${p.name}" cần ít nhất một màu.`);
    ids.add(p.id); slugs.add(p.slug);
  }
  // Bài viết (/tin-tuc/…) và sự kiện (/su-kien/…)
  for (const [list, noun] of [[c.posts, 'Bài viết'], [c.events, 'Sự kiện']]) {
    if (!Array.isArray(list)) { errors.push(noun + ' bị lỗi cấu trúc.'); continue; }
    const seen = new Set();
    for (const x of list) {
      if (!x || !SLUG_RE.test(x.slug || '')) { errors.push(`${noun} "${(x && x.title) || '?'}" có đường dẫn không hợp lệ (chữ thường không dấu, số, gạch nối).`); continue; }
      if (seen.has(x.slug)) errors.push(`Hai ${noun.toLowerCase()} trùng đường dẫn "${x.slug}".`);
      if (!Array.isArray(x.blocks)) errors.push(`${noun} "${x.title}" bị lỗi cấu trúc.`);
      seen.add(x.slug);
    }
  }
  return errors;
}

function saveDraft(c) {
  const errors = validate(c);
  if (errors.length) return { ok: false, errors };
  writeJson(DRAFT, c);
  return { ok: true };
}

function publish() {
  const next = draft();
  const errors = validate(next);
  if (errors.length) return { ok: false, errors };
  // Lưu bản đang chạy vào lịch sử (lần đăng đầu: lưu nội dung gốc) để luôn khôi phục được
  fs.mkdirSync(HIST, { recursive: true });
  const snap = path.join(HIST, new Date().toISOString().replace(/[:.]/g, '-') + '.json');
  if (fs.existsSync(PUB)) fs.copyFileSync(PUB, snap); else writeJson(snap, makeDefault());
  const old = fs.readdirSync(HIST).filter(f => f.endsWith('.json')).sort();
  for (const f of old.slice(0, Math.max(0, old.length - KEEP))) fs.unlinkSync(path.join(HIST, f));
  writeJson(PUB, next);
  if (hasDraft()) fs.unlinkSync(DRAFT);
  return { ok: true };
}

function discardDraft() { if (hasDraft()) fs.unlinkSync(DRAFT); }

function history() {
  try {
    return fs.readdirSync(HIST).filter(f => f.endsWith('.json')).sort().reverse().map(f => {
      const iso = f.replace('.json', '').replace(/^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, '$1:$2:$3.$4Z');
      return { id: f.replace('.json', ''), time: iso, size: fs.statSync(path.join(HIST, f)).size };
    });
  } catch { return []; }
}

function restore(id) {
  if (!/^[0-9TZ-]+$/.test(String(id))) return { ok: false, errors: ['Phiên bản không hợp lệ.'] };
  const c = readJson(path.join(HIST, id + '.json'));
  if (!c) return { ok: false, errors: ['Không tìm thấy phiên bản này.'] };
  return saveDraft(normalize(c));
}

module.exports = { published, draft, hasDraft, saveDraft, publish, discardDraft, history, restore, validate, normalize, makeDefault, DATA, SLUG_RE };
