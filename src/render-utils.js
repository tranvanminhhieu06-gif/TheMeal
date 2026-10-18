// Hàm dùng chung khi render trang từ nội dung (content) — escape, link an toàn, highlight, token.
const cfg = require('./config');

const BASE = process.env.BASE_PATH || '';
const u = path => {
  if (!path) return BASE ? `${BASE}/` : '/';
  if (/^(https?:|#|tel:|mailto:|data:|\/\/)/.test(path)) return path;
  return BASE + (path.startsWith('/') ? path : `/${path}`);
};
const abs = path => cfg.siteUrl + u(path);
const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vnd = n => Number(n || 0).toLocaleString('vi-VN').replace(/,/g, '.') + '₫';

// Link do admin nhập: chỉ cho http(s), mailto, tel, #anchor và đường dẫn nội bộ.
function href(h) {
  h = String(h || '').trim();
  if (!h) return '#';
  if (/^(https?:\/\/|mailto:|tel:|#)/i.test(h)) return h;
  if (h.startsWith('/') && !h.startsWith('//')) return u(h);
  return '#';
}
// Ảnh/video: đường dẫn nội bộ (/img, /uploads…) hoặc http(s).
function media(src) {
  src = String(src || '').trim();
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/') && !src.startsWith('//')) return u(src);
  return '';
}
const HEX = /^#[0-9a-f]{6}$/i;
const color = (c, fallback = '') => (HEX.test(String(c || '')) ? c : fallback);

// Màu tối hay sáng (để chọn chữ trắng/đen trên nền tuỳ chỉnh)
function isDark(hex) {
  if (!HEX.test(hex)) return false;
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.35;
}
// Trộn màu với trắng (t=0..1) để tạo tông nhạt từ màu chính
function mix(hex, withHex, t) {
  if (!HEX.test(hex)) return hex;
  const a = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const b = [1, 3, 5].map(i => parseInt(withHex.slice(i, i + 2), 16));
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/* ---------- Bộ lọc HTML cho khối "Văn bản" (richtext) ---------- */
const ALLOWED = new Set(['p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'hr']);
const VOID = new Set(['br', 'hr']);
function sanitize(html) {
  html = String(html || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|template|noscript|textarea|select|svg|math)\b[\s\S]*?<\/\1\s*>/gi, '');
  let out = '';
  const open = [];
  const re = /<\/?([a-zA-Z0-9]+)([^>]*)>/g;
  let last = 0, m;
  const text = s => s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&(?!(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
  while ((m = re.exec(html))) {
    out += text(html.slice(last, m.index));
    last = re.lastIndex;
    let tag = m[1].toLowerCase();
    if (tag === 'strong') tag = 'b';
    if (tag === 'em') tag = 'i';
    if (tag === 'div') tag = 'p';
    if (!ALLOWED.has(tag)) continue;
    const closing = m[0][1] === '/';
    if (VOID.has(tag)) { if (!closing) out += `<${tag}>`; continue; }
    if (closing) {
      const i = open.lastIndexOf(tag);
      if (i === -1) continue;
      while (open.length > i) out += `</${open.pop()}>`;
      continue;
    }
    if (tag === 'a') {
      const h = (m[2].match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i) || [])[2] ?? '';
      const safe = href(h.replace(/&amp;/g, '&'));
      const ext = /^https?:/i.test(safe);
      out += `<a href="${esc(safe)}"${ext ? ' target="_blank" rel="noopener"' : ''}>`;
    } else out += `<${tag}>`;
    open.push(tag);
  }
  out += text(html.slice(last));
  while (open.length) out += `</${open.pop()}>`;
  return out;
}

module.exports = { u, abs, esc, vnd, href, media, color, isDark, mix, sanitize, HEX };
