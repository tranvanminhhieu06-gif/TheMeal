// Thư viện khối: mỗi loại khối có danh sách trường (để trang quản trị dựng form) và hàm render ra HTML.
// Render chạy đồng bộ với nội dung hiện hành đặt qua use(content).
const { icon } = require('./icons');
const { u, esc, vnd, href, media, color, isDark, sanitize } = require('./render-utils');

let C = null;                     // nội dung đang render
const use = c => { C = c; };
const content = () => C;

/* ---------- Helpers ---------- */
const co = () => C.site.company;
const rawPhone = s => String(s || '').replace(/[^\d+]/g, '');
const productOf = id => (C.products || []).find(p => p.id === id || p.slug === id);
// Token trong chữ: {hotline} {hotlineRaw} {email} {gia:slug}
const tokens = s => s.replace(/\{(hotline|hotlineRaw|email|gia:([a-z0-9-]+))\}/g, (m, k, slug) => {
  if (k === 'hotline') return esc(co().hotline);
  if (k === 'hotlineRaw') return esc(rawPhone(co().hotline));
  if (k === 'email') return esc(co().email);
  const p = productOf(slug);
  return p ? vnd(p.price) : '';
});
const T = s => tokens(esc(s));                                         // chữ thường
const HL = s => T(s).replace(/\*([^*]+)\*/g, '<span class="hl">$1</span>'); // *chữ* tô màu nhấn
const RICH = s => tokens(sanitize(s));                                 // HTML đã lọc
const L = h => esc(href(String(h || '').replace(/\{(hotline|hotlineRaw|email)\}/g, (m, k) => (k === 'email' ? co().email : k === 'hotline' ? co().hotline : rawPhone(co().hotline)))));
const ext = h => (/^https?:/i.test(String(h || '')) ? ' target="_blank" rel="noopener"' : '');
const IMG = s => esc(media(s));
const list = a => (Array.isArray(a) ? a : []);
const ICONS = 'youtube tiktok threads handshake building dumbbell pill leaf book file headset layers hourglass repeat heart droplet moon activity footprints thermometer sparkles clock cart phone check checkCircle shield truck refresh arrow mail pin globe facebook battery waves scale users bone gauge alert star bluetooth chip ruler package bell news'.split(' ');

function buttons(items, cls = 'hero-ctas') {
  const html = list(items).filter(b => b && (b.label || b.icon)).map(b => {
    const ic = b.icon ? icon(b.icon) : '';
    const label = T(b.label);
    const p = b.addToCart && productOf(b.addToCart);
    if (p) return `<button class="btn btn-${esc(b.style || 'primary')}" data-quick-add="${esc(p.id)}" data-color="${esc((p.colors[0] || {}).id || '')}">${ic} ${label}</button>`;
    const inner = b.icon === 'arrow' ? `${label} ${ic}` : `${ic}${ic ? ' ' : ''}${label}`;
    if (b.style === 'link') return `<a class="link" href="${L(b.href)}"${ext(b.href)}>${inner}</a>`;
    return `<a class="btn btn-${esc(b.style || 'primary')}" href="${L(b.href)}"${ext(b.href)}>${inner}</a>`;
  }).join('');
  return html ? `<div class="${cls}">${html}</div>` : '';
}

function head(b, tag = 'h2') {
  if (!b.eyebrow && !b.title && !b.lead) return '';
  return `<div class="sec-head${b.align === 'center' ? ' center' : ''}">
      ${b.eyebrow ? `<span class="eyebrow">${T(b.eyebrow)}</span>` : ''}
      ${b.title ? `<${tag} class="h2">${HL(b.title)}</${tag}>` : ''}
      ${b.lead ? `<p class="lead">${T(b.lead)}</p>` : ''}
    </div>`;
}

// Nền của khối → class/style cho <section>
function bgOf(b) {
  const t = C.theme || {};
  switch (b.bg) {
    case 'white': return { cls: ' section--white', style: '', dark: false };
    case 'mint': return { cls: ' section--mint', style: '', dark: false };
    case 'navy': return { cls: ' section--navy on-dark', style: '', dark: true };
    case 'primary': { const d = isDark(color(t.primary, '#4BCE97')); return { cls: d ? ' on-dark' : '', style: 'background:var(--green);', dark: d }; }
    case 'custom': { const c = color(b.bgColor, '#FFFFFF'); const d = isDark(c); return { cls: d ? ' on-dark' : '', style: `background:${c};${d ? 'color:#fff;' : ''}`, dark: d }; }
    default: return { cls: '', style: '', dark: false };
  }
}
function section(b, inner, { wrap = 'wrap', extraStyle = '' } = {}) {
  const bg = bgOf(b);
  const style = bg.style + (b.tight ? 'padding-top:0;' : '') + extraStyle;
  const id = b.anchor && /^[a-z0-9-]+$/i.test(b.anchor) ? ` id="${esc(b.anchor)}"` : '';
  return `<section class="section${bg.cls}"${id}${style ? ` style="${style}"` : ''}>${wrap ? `<div class="${wrap}">${inner}</div>` : inner}</section>`;
}
function crumbs(title, dark) {
  const s = dark ? [' style="color:#C9D2E3"', ' style="color:#fff"'] : ['', ''];
  return `<nav class="crumbs" aria-label="Breadcrumb"${dark ? ' style="padding:0 0 18px"' : ''}><ol><li><a href="${u('/')}"${s[0]}>Trang chủ</a></li><li aria-current="page"${s[1]}>${T(title)}</li></ol></nav>`;
}

/* ---------- Partials dùng chung với views ---------- */
function productCard(p, headingTag = 'h3') {
  const needsOptions = sizesOf(p).length > 0;
  const g0 = list(p.gallery)[0] || {};
  return `<article class="p-card reveal${p.featured ? ' featured' : ''}">
    <div class="p-media${p.dark ? '' : ' light'}">
      ${p.badge ? `<span class="badge${p.featured ? '' : ' dark'}">${T(p.badge)}</span>` : ''}
      <img src="${IMG(p.image)}" alt="${esc(g0.alt || p.name)}" width="720" height="720" loading="lazy">
    </div>
    <div class="p-body">
      <span class="p-cat">${T(p.category)}</span>
      <${headingTag} class="p-name"><a href="${u('/san-pham/' + p.slug)}">${T(p.name)}</a></${headingTag}>
      <p class="p-tag">${T(p.tagline)}</p>
      <ul class="p-specs">${list(p.highlights).map(h => `<li>${T(h.text)}</li>`).join('')}</ul>
      <div class="p-foot">
        <span class="price">${vnd(p.price)}</span>
        ${needsOptions
          ? `<a class="btn btn-dark" href="${u('/san-pham/' + p.slug)}#chon-tuy-chon">Chọn size ${icon('arrow')}</a>`
          : `<button class="btn btn-primary" data-quick-add="${esc(p.id)}" data-color="${esc((p.colors[0] || {}).id || '')}">${icon('cart')} Thêm vào giỏ</button>`}
      </div>
    </div>
  </article>`;
}
const sizesOf = p => String(p.sizes || '').split(',').map(s => s.trim()).filter(Boolean);

function sizeGuideHtml(b, compact) {
  const g = C.sizeGuide || {};
  const steps = list(g.steps);
  return `<div class="split" style="align-items:start">
    <div>
      ${compact ? '' : `${b.eyebrow ? `<span class="eyebrow">${T(b.eyebrow)}</span>` : ''}${b.title ? `<h2 class="h2">${HL(b.title)}</h2>` : ''}${b.lead ? `<p class="lead">${T(b.lead)}</p>` : ''}`}
      <ol class="steps">${steps.map(s => `<li><div><b>${T(s.title)}</b><br><span class="muted">${T(s.text)}</span></div></li>`).join('')}</ol>
      ${g.hint ? `<p class="hint">${icon('alert')} ${T(g.hint)}</p>` : ''}
      <div class="size-pics">${list(g.images).map(im => `<img src="${IMG(im.src)}" alt="${esc(im.alt)}" width="320" height="316" loading="lazy" style="border-radius:12px">`).join('')}</div>
    </div>
    <div>
      <table class="size-table">
        <caption class="sr-only">Bảng quy đổi size nhẫn</caption>
        <thead><tr><th scope="col">Size nhẫn</th><th scope="col">Đường kính trong (mm)</th><th scope="col">Chu vi ngón tay (mm)</th></tr></thead>
        <tbody>${list(g.rows).map(r => `<tr><td><b>Size ${T(r.size)}</b></td><td>${T(r.diameter)}</td><td>${T(r.circumference)}</td></tr>`).join('')}</tbody>
      </table>
      ${g.note ? `<p class="hint" style="margin-top:12px">${T(g.note)}</p>` : ''}
    </div>
  </div>`;
}

function contactInfoList(full) {
  const c = co();
  const items = [
    full && c.address && ['pin', 'Địa chỉ', T(c.address)],
    c.hotline && ['phone', full ? 'Hotline' : 'Hotline hợp tác', `<a href="tel:${esc(rawPhone(c.hotline))}">${T(c.hotline)}</a>`],
    c.email && ['mail', 'Email', `<a href="mailto:${esc(c.email)}">${T(c.email)}</a>`],
    c.facebook && ['facebook', 'Fanpage', `<a href="${L(c.facebook)}" target="_blank" rel="noopener">${T(c.facebook.replace(/^https?:\/\/(www\.)?/, ''))}</a>`],
    full && c.websiteUrl && ['globe', 'Website', `<a href="${L(c.websiteUrl)}" target="_blank" rel="noopener">${T(c.website || c.websiteUrl)}</a>`],
    full && c.hours && ['clock', 'Giờ làm việc', T(c.hours)]
  ].filter(Boolean);
  return `<ul class="info-list"${full ? '' : ' style="margin-top:24px"'}>${items.map(([ic, k, v]) => `<li><span class="ic">${icon(ic)}</span><div><small>${k}</small>${v}</div></li>`).join('')}</ul>`;
}
const NET = { facebook: 'Facebook', youtube: 'YouTube', tiktok: 'TikTok', threads: 'Threads' };
const channelList = items => `<ul class="channels">${items.map(x => `<li><a href="${L(x.url || x.href)}" target="_blank" rel="noopener"><span class="ic">${icon(x.icon)}</span><span><b>${T(x.label || x.title)}</b><small>${T(x.note || x.text || NET[x.icon] || '')}</small></span>${icon('arrow')}</a></li>`).join('')}</ul>`;

/* ---------- Trường form dùng lại ---------- */
const F = {
  eyebrow: { key: 'eyebrow', label: 'Dòng nhỏ phía trên', type: 'text' },
  title: { key: 'title', label: 'Tiêu đề', type: 'text', hint: 'Bọc chữ trong *dấu sao* để tô màu nhấn.' },
  lead: { key: 'lead', label: 'Mô tả ngắn', type: 'textarea' },
  align: { key: 'align', label: 'Căn tiêu đề', type: 'select', options: [['center', 'Giữa'], ['left', 'Trái']] },
  buttons: { key: 'buttons', label: 'Nút bấm', type: 'list', itemLabel: 'label', fields: [
    { key: 'label', label: 'Chữ trên nút', type: 'text' },
    { key: 'href', label: 'Liên kết', type: 'link', hint: 'VD: /san-pham, #dang-ky, https://…, tel:{hotlineRaw}' },
    { key: 'style', label: 'Kiểu nút', type: 'select', options: [['primary', 'Màu chính'], ['dark', 'Tối'], ['ghost', 'Viền'], ['link', 'Dạng liên kết']] },
    { key: 'icon', label: 'Biểu tượng', type: 'icon' },
    { key: 'addToCart', label: 'Thêm vào giỏ sản phẩm', type: 'product', hint: 'Chọn sản phẩm để nút thành "Thêm vào giỏ" (bỏ qua liên kết).' }
  ], newItem: { label: 'Nút mới', href: '/san-pham', style: 'primary', icon: 'arrow', addToCart: '' } },
  note: { key: 'note', label: 'Ghi chú cuối khối', type: 'textarea' }
};
const HEAD = [F.eyebrow, F.title, F.lead, F.align];

/* ---------- Các loại khối ---------- */
const TYPES = {
  hero: {
    label: 'Banner trình chiếu', desc: 'Banner lớn đầu trang, nhiều slide tự chuyển, có ảnh sản phẩm, giá và nút mua.', section: false,
    fields: [
      { key: 'slides', label: 'Các slide', type: 'list', itemLabel: 'eyebrow', fields: [
        { key: 'theme', label: 'Nền slide', type: 'select', options: [['cream', 'Kem sáng'], ['navy', 'Tối'], ['mint', 'Xanh nhạt']] },
        { key: 'productId', label: 'Sản phẩm (hiện giá & ảnh)', type: 'product' },
        F.eyebrow, F.title, F.lead,
        { key: 'note', label: 'Ghi chú cạnh giá', type: 'text' },
        { key: 'image', label: 'Ảnh', type: 'image', hint: 'Để trống để dùng ảnh sản phẩm.' },
        F.buttons,
        { key: 'chips', label: 'Nhãn nổi quanh ảnh (tối đa 3)', type: 'list', itemLabel: 'title', max: 3, fields: [
          { key: 'icon', label: 'Biểu tượng', type: 'icon' }, { key: 'title', label: 'Chữ đậm', type: 'text' }, { key: 'text', label: 'Chữ nhỏ', type: 'text' }],
          newItem: { icon: 'heart', title: 'Nhãn', text: 'Mô tả' } }
      ], newItem: { theme: 'cream', productId: '', eyebrow: 'Dòng nhỏ', title: 'Tiêu đề *nổi bật*', lead: 'Mô tả ngắn.', note: '', image: '/img/ring-active.webp', buttons: [], chips: [] } },
      { key: 'trust', label: 'Dòng cam kết dưới nút', type: 'list', itemLabel: 'text', fields: [{ key: 'icon', label: 'Biểu tượng', type: 'icon' }, { key: 'text', label: 'Chữ', type: 'text' }], newItem: { icon: 'shield', text: 'Cam kết' } }
    ],
    make: () => ({ slides: [{ theme: 'cream', productId: '', eyebrow: 'Dòng nhỏ', title: 'Tiêu đề *nổi bật*', lead: 'Mô tả ngắn cho banner.', note: '', image: '/img/ring-active.webp', buttons: [{ label: 'Xem sản phẩm', href: '/san-pham', style: 'primary', icon: 'arrow', addToCart: '' }], chips: [] }], trust: [] }),
    render(b, ctx) {
      const slides = list(b.slides);
      if (!slides.length) return '';
      const one = (s, i) => {
        const p = s.productId && productOf(s.productId);
        const theme = ['cream', 'navy', 'mint'].includes(s.theme) ? s.theme : 'cream';
        const h = ctx.index === 0 && i === 0 ? 'h1' : 'h2';
        const img = s.image || (p && p.image) || '';
        const alt = (p && (list(p.gallery)[0] || {}).alt) || s.eyebrow || '';
        return `<div class="slide slide--${theme}${theme === 'navy' ? ' on-dark' : ''}" role="group" aria-roledescription="slide" aria-label="${esc(p ? p.name : (s.eyebrow || 'Slide ' + (i + 1)))}" data-theme="${theme}">
    <div class="wrap">
      <div>
        ${s.eyebrow ? `<span class="eyebrow">${T(s.eyebrow)}</span>` : ''}
        <${h} class="h-display">${HL(s.title)}</${h}>
        ${s.lead ? `<p class="lead">${T(s.lead)}</p>` : ''}
        ${p ? `<div class="price-row"><span class="price">${vnd(p.price)}</span><span class="price-note">${T(s.note)}</span></div>` : (s.note ? `<p class="price-note">${T(s.note)}</p>` : '')}
        ${buttons(s.buttons)}
        ${list(b.trust).length ? `<div class="trust-mini">${list(b.trust).map(t => `<span>${icon(t.icon)} ${T(t.text)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="visual">
        <span class="ring-dash" aria-hidden="true"></span>
        ${img ? `<div class="orb"><img src="${IMG(img)}" alt="${esc(alt)}" width="720" height="720"${h === 'h1' ? ' fetchpriority="high"' : ' loading="lazy"'}></div>` : ''}
        ${list(s.chips).slice(0, 3).map((c, n) => `<div class="chip-float cf-${n + 1}" aria-hidden="true"><span class="ic">${icon(c.icon)}</span><span><b>${T(c.title)}</b><small>${T(c.text)}</small></span></div>`).join('')}
      </div>
    </div>
  </div>`;
      };
      return `<section class="hero" aria-roledescription="carousel" aria-label="Nổi bật" id="hero">
  <div class="slides" id="slides" aria-live="off">${slides.map(one).join('')}</div>
  ${slides.length > 1 ? `<div class="hero-ctrl">
    <button class="pause-btn" id="heroPause" aria-label="Tạm dừng trình chiếu">${icon('pause')}</button>
    ${slides.map((s, i) => `<button class="dot" data-go="${i}" aria-label="Xem slide ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('')}
  </div>` : ''}
</section>`;
    }
  },

  trust: {
    label: 'Dải cam kết', desc: 'Một hàng 3–4 cam kết ngắn có biểu tượng (chứng nhận, COD, hotline…).', section: false,
    fields: [{ key: 'items', label: 'Các mục', type: 'list', itemLabel: 'title', fields: [{ key: 'icon', label: 'Biểu tượng', type: 'icon' }, { key: 'title', label: 'Chữ đậm', type: 'text' }, { key: 'text', label: 'Chữ nhỏ', type: 'text' }], newItem: { icon: 'shield', title: 'Cam kết', text: 'Mô tả' } }],
    make: () => ({ items: [{ icon: 'shield', title: 'Chính hãng', text: 'Bảo hành đầy đủ' }, { icon: 'package', title: 'Thanh toán COD', text: 'Nhận hàng rồi trả tiền' }, { icon: 'phone', title: 'Tư vấn', text: 'Hotline {hotline}' }] }),
    render: b => `<div class="trust-strip"><div class="wrap">${list(b.items).map(x => `<div class="ts"><span class="ic">${icon(x.icon)}</span><span><b>${T(x.title)}</b>${T(x.text)}</span></div>`).join('')}</div></div>`
  },

  features: {
    label: 'Thẻ tính năng', desc: 'Lưới thẻ có biểu tượng/số/con dấu: vấn đề–giải pháp, lợi ích, chứng nhận…', section: true,
    fields: [...HEAD,
      { key: 'style', label: 'Kiểu thẻ', type: 'select', options: [['pain', 'Vấn đề + giải pháp'], ['iconcard', 'Biểu tượng + chữ'], ['numbered', 'Đánh số'], ['cert', 'Con dấu / chứng nhận']] },
      { key: 'columns', label: 'Số cột', type: 'select', options: [['2', '2 cột'], ['3', '3 cột'], ['4', '4 cột']] },
      { key: 'items', label: 'Các thẻ', type: 'list', itemLabel: 'title', fields: [
        { key: 'icon', label: 'Biểu tượng', type: 'icon' },
        { key: 'seal', label: 'Chữ trong con dấu', type: 'text', hint: 'Chỉ dùng cho kiểu "Con dấu"; để trống sẽ dùng biểu tượng.' },
        { key: 'title', label: 'Tiêu đề', type: 'text' }, { key: 'text', label: 'Nội dung', type: 'textarea' },
        { key: 'fix', label: 'Dòng giải pháp (dấu ✓)', type: 'textarea', hint: 'Chỉ hiện ở kiểu "Vấn đề + giải pháp".' }
      ], newItem: { icon: 'sparkles', seal: '', title: 'Tiêu đề thẻ', text: 'Nội dung thẻ.', fix: '' } },
      F.note],
    make: () => ({ align: 'center', style: 'iconcard', columns: '3', eyebrow: '', title: 'Tiêu đề khối', lead: '', note: '', items: [1, 2, 3].map(i => ({ icon: 'sparkles', seal: '', title: 'Tính năng ' + i, text: 'Mô tả ngắn.', fix: '' })) }),
    render(b) {
      const cols = ['2', '3', '4'].includes(String(b.columns)) ? b.columns : '3';
      const card = (x, i) => {
        const ic = `<span class="pain-ic">${icon(x.icon || 'sparkles')}</span>`;
        switch (b.style) {
          case 'pain': return `<article class="pain reveal">${ic}<h3>${T(x.title)}</h3><p class="muted">${T(x.text)}</p>${x.fix ? `<div class="fix">${icon('checkCircle')}<span>${T(x.fix)}</span></div>` : ''}</article>`;
          case 'numbered': return `<div class="metric reveal"><span class="num">${String(i + 1).padStart(2, '0')}</span><div><h3>${T(x.title)}</h3><p>${T(x.text)}</p></div></div>`;
          case 'cert': return `<div class="cert reveal">${x.seal ? `<div class="seal" aria-hidden="true">${T(x.seal)}</div>` : ic}<h3>${T(x.title)}</h3><p>${T(x.text)}</p></div>`;
          default: return `<article class="metric reveal" style="flex-direction:column">${ic}<h3>${T(x.title)}</h3><p>${T(x.text)}</p></article>`;
        }
      };
      return section(b, `${head(b)}<div class="grid g-${cols}">${list(b.items).map(card).join('')}</div>${b.note ? `<p class="block-note center">${T(b.note)}</p>` : ''}`);
    }
  },

  products: {
    label: 'Lưới sản phẩm', desc: 'Thẻ sản phẩm có giá và nút mua. Chọn sản phẩm cụ thể hoặc hiện tất cả.', section: true,
    fields: [...HEAD,
      { key: 'productIds', label: 'Sản phẩm hiển thị', type: 'products', hint: 'Không chọn = hiện tất cả sản phẩm.' },
      { key: 'columns', label: 'Số cột', type: 'select', options: [['2', '2 cột'], ['3', '3 cột'], ['4', '4 cột']] }],
    make: () => ({ align: 'center', eyebrow: '', title: 'Sản phẩm *nổi bật*', lead: '', productIds: [], columns: '3' }),
    render(b) {
      const ids = list(b.productIds);
      const ps = ids.length ? ids.map(productOf).filter(Boolean) : list(C.products);
      const cols = ['2', '3', '4'].includes(String(b.columns)) ? b.columns : '3';
      return section(b, `${head(b)}<div class="grid g-${cols}">${ps.map(p => productCard(p, b.title ? 'h3' : 'h2')).join('')}</div>`);
    }
  },

  mediaText: {
    label: 'Chữ + ảnh/video', desc: 'Hai cột: tiêu đề, mô tả, danh sách, nút bấm và ảnh/video/cụm ảnh. Dùng được làm banner đầu trang.', section: true,
    fields: [F.eyebrow, F.title, F.lead,
      { key: 'display', label: 'Tiêu đề cỡ lớn (H1, làm banner đầu trang)', type: 'bool' },
      { key: 'crumbs', label: 'Hiện đường dẫn "Trang chủ / …"', type: 'bool' },
      { key: 'list', label: 'Danh sách', type: 'list', itemLabel: 'title', fields: [
        { key: 'icon', label: 'Biểu tượng', type: 'icon', hint: 'Dùng cho kiểu "Nhãn" và "Liên kết".' }, { key: 'title', label: 'Chữ', type: 'text' },
        { key: 'text', label: 'Chữ phụ', type: 'text' }, { key: 'href', label: 'Liên kết', type: 'link', hint: 'Dùng cho kiểu "Liên kết".' }],
        newItem: { icon: 'checkCircle', title: 'Mục mới', text: '', href: '' } },
      { key: 'listStyle', label: 'Kiểu danh sách', type: 'select', options: [['check', 'Dấu ✓'], ['numbered', 'Thẻ đánh số'], ['chips', 'Nhãn có biểu tượng'], ['links', 'Liên kết có biểu tượng'], ['plain', 'Gạch đầu dòng']] },
      { key: 'listPlace', label: 'Vị trí danh sách', type: 'select', options: [['text', 'Dưới mô tả'], ['side', 'Cột bên cạnh (thay cho ảnh)']] },
      { key: 'productId', label: 'Hiện giá sản phẩm', type: 'product' },
      { key: 'priceNote', label: 'Ghi chú cạnh giá', type: 'text' },
      F.buttons,
      { key: 'mediaType', label: 'Cột hình ảnh', type: 'select', options: [['image', 'Một ảnh'], ['video', 'Video'], ['collage', 'Cụm ảnh'], ['none', 'Không có']] },
      { key: 'image', label: 'Ảnh', type: 'image', showIf: { key: 'mediaType', in: ['image'] } },
      { key: 'video', label: 'Video (.mp4)', type: 'video', showIf: { key: 'mediaType', in: ['video'] } },
      { key: 'poster', label: 'Ảnh chờ của video', type: 'image', showIf: { key: 'mediaType', in: ['video'] } },
      { key: 'images', label: 'Cụm ảnh (3 ảnh)', type: 'list', itemLabel: 'src', max: 4, showIf: { key: 'mediaType', in: ['collage'] }, fields: [{ key: 'src', label: 'Ảnh', type: 'image' }], newItem: { src: '/img/ring-pro.webp', caption: '', alt: '' } },
      { key: 'mediaAlt', label: 'Mô tả ảnh/video (cho người khiếm thị)', type: 'text', showIf: { key: 'mediaType', in: ['image', 'video'] } },
      { key: 'mediaShape', label: 'Khung ảnh', type: 'select', options: [['square', 'Vuông/tự nhiên'], ['tall', 'Dọc (điện thoại 9:16)']], showIf: { key: 'mediaType', in: ['image', 'video'] } },
      { key: 'side', label: 'Ảnh nằm bên', type: 'select', options: [['right', 'Phải'], ['left', 'Trái']] }],
    make: () => ({ eyebrow: 'Dòng nhỏ', title: 'Tiêu đề *nổi bật*', lead: 'Mô tả ngắn.', display: false, crumbs: false, list: [], listStyle: 'check', listPlace: 'text', productId: '', priceNote: '', buttons: [], mediaType: 'image', image: '/img/scale-stand.webp', video: '', poster: '', images: [], mediaAlt: '', mediaShape: 'square', side: 'right' }),
    render(b, ctx) {
      const dark = bgOf(b).dark;
      const items = list(b.list);
      const listHtml = !items.length ? '' : ({
        check: () => `<ul class="check-list">${items.map(x => `<li>${icon('checkCircle')}<span>${T(x.title)}${x.text ? ` — ${T(x.text)}` : ''}</span></li>`).join('')}</ul>`,
        numbered: () => `<div class="grid g-2" style="gap:14px;margin-top:28px">${items.map((x, i) => `<div class="metric reveal"><span class="num">${String(i + 1).padStart(2, '0')}</span><div><h3>${T(x.title)}</h3><p>${T(x.text)}</p></div></div>`).join('')}</div>`,
        chips: () => `<ul class="p-specs partner-chips">${items.map(x => `<li>${icon(x.icon)}${T(x.title)}</li>`).join('')}</ul>`,
        links: () => channelList(items),
        plain: () => `<ul class="p-specs">${items.map(x => `<li>${T(x.title)}</li>`).join('')}</ul>`
      }[b.listStyle] || (() => ''))();
      const p = b.productId && productOf(b.productId);
      const titleTag = b.display ? 'h1' : 'h2';
      const text = `<div>
        ${b.crumbs ? crumbs(ctx.page.title || b.title.replace(/\*/g, ''), dark) : ''}
        ${b.eyebrow ? `<span class="eyebrow">${T(b.eyebrow)}</span>` : ''}
        ${b.title ? `<${titleTag} class="${b.display ? 'h-display' : 'h2'}"${b.display ? ' style="margin-top:12px"' : ''}>${HL(b.title)}</${titleTag}>` : ''}
        ${b.lead ? `<p class="lead">${T(b.lead)}</p>` : ''}
        ${b.listPlace !== 'side' ? listHtml : ''}
        ${p ? `<div class="price-row" style="margin-bottom:20px"><span class="price">${vnd(p.price)}</span><span class="price-note">${T(b.priceNote)}</span></div>` : ''}
        ${buttons(b.buttons)}
      </div>`;
      const tall = b.mediaShape === 'tall';
      const box = tall ? ' style="max-width:420px;justify-self:center;border-radius:32px"' : '';
      let mediaHtml = '';
      if (b.listPlace === 'side' && listHtml) mediaHtml = listHtml;
      else if (b.mediaType === 'image' && b.image) mediaHtml = `<div class="split-media reveal"${box}><img src="${IMG(b.image)}" alt="${esc(b.mediaAlt)}" width="1000" height="1000" loading="lazy"${tall ? ' style="width:100%;aspect-ratio:9/16;object-fit:cover"' : ''}></div>`;
      else if (b.mediaType === 'video' && b.video) mediaHtml = `<div class="split-media reveal"${box}><video src="${IMG(b.video)}"${b.poster ? ` poster="${IMG(b.poster)}"` : ''} autoplay muted loop playsinline preload="metadata" aria-label="${esc(b.mediaAlt)}" style="width:100%;${tall ? 'aspect-ratio:9/16;' : ''}object-fit:cover"></video></div>`;
      else if (b.mediaType === 'collage' && list(b.images).length) mediaHtml = `<div class="partner-visual" aria-hidden="true">${list(b.images).map(im => `<img src="${IMG(im.src)}" alt="" width="360" height="360" loading="lazy">`).join('')}</div>`;
      if (!mediaHtml) return section(b, text);
      const left = b.side === 'left';
      return section(b, left ? mediaHtml + text : text + mediaHtml, { wrap: `wrap split${left ? ' rev' : ''}` });
    }
  },

  steps: {
    label: 'Các bước / quy trình', desc: 'Chuỗi bước thực hiện: dạng thẻ "Bước 1, 2…" hoặc dạng số tròn.', section: true,
    fields: [...HEAD,
      { key: 'style', label: 'Kiểu', type: 'select', options: [['loop', 'Thẻ có nhãn bước'], ['flow', 'Số tròn']] },
      { key: 'items', label: 'Các bước', type: 'list', itemLabel: 'title', fields: [{ key: 'kicker', label: 'Nhãn nhỏ (VD: Bước 1)', type: 'text' }, { key: 'title', label: 'Tiêu đề', type: 'text' }, { key: 'text', label: 'Nội dung', type: 'textarea' }], newItem: { kicker: 'Bước', title: 'Bước mới', text: 'Mô tả.' } },
      F.note],
    make: () => ({ align: 'center', style: 'flow', eyebrow: '', title: 'Quy trình', lead: '', note: '', items: [1, 2, 3].map(i => ({ kicker: 'Bước ' + i, title: 'Bước ' + i, text: 'Mô tả bước.' })) }),
    render(b) {
      const items = list(b.items);
      const body = b.style === 'loop'
        ? `<div class="loop">${items.map(s => `<div class="loop-step reveal">${s.kicker ? `<span class="k">${T(s.kicker)}</span>` : ''}<h3>${T(s.title)}</h3><p>${T(s.text)}</p></div>`).join('')}</div>`
        : `<ol class="flow">${items.map((s, i) => `<li class="reveal"><span class="n">${i + 1}</span><b>${T(s.title)}</b><span class="muted">${T(s.text)}</span></li>`).join('')}</ol>`;
      return section(b, `${head(b)}${body}${b.note ? `<p class="block-note center">${T(b.note)}</p>` : ''}`);
    }
  },

  gallery: {
    label: 'Bộ ảnh', desc: 'Nhiều ảnh có chú thích: ảnh màn hình điện thoại, lưới ghép hoặc lưới đều.', section: true,
    fields: [...HEAD,
      { key: 'style', label: 'Kiểu', type: 'select', options: [['grid', 'Lưới đều'], ['mosaic', 'Lưới ghép (5 ảnh đẹp nhất)'], ['phones', 'Màn hình điện thoại (cuộn ngang)']] },
      { key: 'images', label: 'Ảnh', type: 'list', itemLabel: 'caption', fields: [{ key: 'src', label: 'Ảnh', type: 'image' }, { key: 'caption', label: 'Chú thích', type: 'text' }, { key: 'alt', label: 'Mô tả ảnh (cho người khiếm thị)', type: 'text' }], newItem: { src: '/img/life-wrist.webp', caption: '', alt: '' } },
      F.note],
    make: () => ({ align: 'center', style: 'grid', eyebrow: '', title: 'Bộ ảnh', lead: '', note: '', images: ['life-wrist', 'life-bottle', 'scale-room'].map(f => ({ src: `/img/${f}.webp`, caption: '', alt: '' })) }),
    render(b) {
      const ims = list(b.images).filter(i => i.src);
      const fig = (cls, w, h) => im => `<figure class="${cls}"><img src="${IMG(im.src)}" alt="${esc(im.alt || im.caption)}"${w ? ` width="${w}" height="${h}"` : ''} loading="lazy">${im.caption ? `<figcaption>${T(im.caption)}</figcaption>` : ''}</figure>`;
      const body = b.style === 'phones' ? `<div class="phones" tabindex="0" aria-label="${esc(b.title || 'Bộ ảnh')}">${ims.map(fig('phone reveal', 560, 1200)).join('')}</div>`
        : b.style === 'mosaic' ? `<div class="life">${ims.map(fig('reveal')).join('')}</div>`
        : `<div class="grid g-3 gal-grid">${ims.map(fig('reveal')).join('')}</div>`;
      return section(b, `${head(b)}${body}${b.note ? `<p class="block-note center">${T(b.note)}</p>` : ''}`);
    }
  },

  compare: {
    label: 'Bảng so sánh', desc: 'Bảng so sánh 2 cột (VD: hai phiên bản sản phẩm). Gõ {gia:mã-sản-phẩm} để tự hiện giá.', section: true,
    fields: [...HEAD,
      { key: 'colA', label: 'Tên cột 1', type: 'text' }, { key: 'colB', label: 'Tên cột 2 (cột nổi bật)', type: 'text' },
      { key: 'rows', label: 'Các dòng', type: 'list', itemLabel: 'label', fields: [{ key: 'label', label: 'Tiêu chí', type: 'text' }, { key: 'a', label: 'Cột 1', type: 'text', hint: 'Bắt đầu bằng ✓ để hiện dấu tích xanh.' }, { key: 'b', label: 'Cột 2', type: 'text' }], newItem: { label: 'Tiêu chí', a: '', b: '' } },
      { key: 'linkA', label: 'Liên kết dưới cột 1', type: 'group', fields: [{ key: 'label', label: 'Chữ', type: 'text' }, { key: 'href', label: 'Liên kết', type: 'link' }] },
      { key: 'linkB', label: 'Liên kết dưới cột 2', type: 'group', fields: [{ key: 'label', label: 'Chữ', type: 'text' }, { key: 'href', label: 'Liên kết', type: 'link' }] }],
    make: () => ({ align: 'center', eyebrow: '', title: 'So sánh', lead: '', colA: 'Phiên bản A', colB: 'Phiên bản B', rows: [{ label: 'Giá', a: '', b: '' }], linkA: { label: '', href: '' }, linkB: { label: '', href: '' } }),
    render(b) {
      const cell = v => (/^\s*✓/.test(v || '') ? `<span class="yes">${T(v)}</span>` : T(v));
      const la = b.linkA || {}, lb = b.linkB || {};
      return section(b, `${head(b)}<div class="compare-wrap reveal"><table class="compare">
    <caption class="sr-only">So sánh ${T(b.colA)} và ${T(b.colB)}</caption>
    <thead><tr><th scope="col">Tiêu chí</th><th scope="col">${T(b.colA)}</th><th scope="col" class="pro">${T(b.colB)}</th></tr></thead>
    <tbody>${list(b.rows).map(r => `<tr><th scope="row">${T(r.label)}</th><td>${cell(r.a)}</td><td class="pro">${cell(r.b)}</td></tr>`).join('')}
    ${la.label || lb.label ? `<tr><th scope="row"></th><td>${la.label ? `<a class="link" href="${L(la.href)}">${T(la.label)} ${icon('arrow')}</a>` : ''}</td><td class="pro">${lb.label ? `<a class="link" href="${L(lb.href)}">${T(lb.label)} ${icon('arrow')}</a>` : ''}</td></tr>` : ''}
    </tbody></table></div>`);
    }
  },

  sizeGuide: {
    label: 'Hướng dẫn chọn size', desc: 'Các bước đo size nhẫn và bảng quy đổi. Nội dung sửa ở Cài đặt → Hướng dẫn chọn size.', section: true,
    fields: [F.eyebrow, F.title, F.lead],
    make: () => ({ eyebrow: 'Hướng dẫn chọn size', title: 'Đo size nhẫn tại nhà *trong 2 phút.*', lead: '' }),
    render: b => section(b, sizeGuideHtml(b, false))
  },

  faq: {
    label: 'Câu hỏi thường gặp', desc: 'Danh sách hỏi–đáp mở/đóng được; tự thêm dữ liệu FAQ cho Google.', section: true,
    fields: [...HEAD, { key: 'items', label: 'Câu hỏi', type: 'list', itemLabel: 'q', fields: [{ key: 'q', label: 'Câu hỏi', type: 'text' }, { key: 'a', label: 'Trả lời', type: 'richtext' }], newItem: { q: 'Câu hỏi mới?', a: '<p>Câu trả lời.</p>' } }],
    make: () => ({ align: 'center', eyebrow: 'Câu hỏi thường gặp', title: 'Bạn còn băn khoăn?', lead: '', items: [{ q: 'Câu hỏi?', a: '<p>Câu trả lời.</p>' }] }),
    render: b => section(b, `${head(b)}<div class="faq">${list(b.items).map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${T(f.q)}</summary><div class="ans">${RICH(f.a)}</div></details>`).join('')}</div>`)
  },

  reviews: {
    label: 'Đánh giá khách hàng', desc: 'Thẻ đánh giá có sao, tên, ảnh. Khi chưa có đánh giá sẽ hiện thông báo chờ.', section: true,
    fields: [...HEAD,
      { key: 'items', label: 'Đánh giá', type: 'list', itemLabel: 'name', fields: [
        { key: 'name', label: 'Tên khách', type: 'text' }, { key: 'info', label: 'Thông tin thêm (VD: Hà Nội · Active Pro)', type: 'text' },
        { key: 'rating', label: 'Số sao (1–5)', type: 'number', min: 1, max: 5 }, { key: 'text', label: 'Nội dung', type: 'textarea' }, { key: 'avatar', label: 'Ảnh đại diện', type: 'image' }],
        newItem: { name: 'Tên khách', info: '', rating: 5, text: 'Nội dung đánh giá.', avatar: '' } },
      { key: 'emptyTitle', label: 'Tiêu đề khi chưa có đánh giá', type: 'text' }, { key: 'emptyText', label: 'Nội dung khi chưa có đánh giá', type: 'textarea' }],
    make: () => ({ align: 'center', eyebrow: 'Khách hàng nói gì', title: 'Đánh giá từ người dùng thật', lead: '', items: [], emptyTitle: 'Đánh giá đang được cập nhật', emptyText: '' }),
    render(b) {
      const items = list(b.items);
      const body = items.length
        ? `<div class="grid g-3">${items.map(r => {
          const n = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
          return `<figure class="review reveal"><div class="stars" aria-label="${n} trên 5 sao">${'★'.repeat(n)}<span aria-hidden="true">${'★'.repeat(5 - n)}</span></div>
            <blockquote>${T(r.text)}</blockquote>
            <figcaption>${r.avatar ? `<img src="${IMG(r.avatar)}" alt="" width="48" height="48" loading="lazy">` : `<span class="avatar" aria-hidden="true">${T(String(r.name || '?').trim().charAt(0))}</span>`}<span><b>${T(r.name)}</b>${r.info ? `<small>${T(r.info)}</small>` : ''}</span></figcaption></figure>`;
        }).join('')}</div>`
        : `<div class="empty">${icon('star')}<h3 class="h3">${T(b.emptyTitle)}</h3>${b.emptyText ? `<p class="muted">${T(b.emptyText)}</p>` : ''}</div>`;
      return section(b, head(b) + body);
    }
  },

  cta: {
    label: 'Kêu gọi hành động', desc: 'Khung tối nổi bật với tiêu đề, nút bấm và ảnh tròn — thường đặt cuối trang.', section: true,
    fields: [F.eyebrow, F.title, F.lead, F.buttons, { key: 'images', label: 'Ảnh tròn', type: 'list', itemLabel: 'src', max: 4, fields: [{ key: 'src', label: 'Ảnh', type: 'image' }], newItem: { src: '/img/ring-active.webp', caption: '', alt: '' } }],
    make: () => ({ tight: true, eyebrow: '', title: 'Bắt đầu *ngay hôm nay.*', lead: '', buttons: [{ label: 'Chọn sản phẩm', href: '/san-pham', style: 'primary', icon: 'arrow', addToCart: '' }], images: [] }),
    render: b => section(b, `<div class="final on-dark reveal">
      <div>
        ${b.eyebrow ? `<span class="eyebrow">${T(b.eyebrow)}</span>` : ''}
        ${b.title ? `<h2 class="h2" style="margin-top:12px">${HL(b.title)}</h2>` : ''}
        ${b.lead ? `<p class="lead">${T(b.lead)}</p>` : ''}
        ${buttons(b.buttons)}
      </div>
      ${list(b.images).length ? `<div class="mini-prods" aria-hidden="true">${list(b.images).map(im => `<img src="${IMG(im.src)}" alt="" loading="lazy">`).join('')}</div>` : ''}
    </div>`)
  },

  richtext: {
    label: 'Văn bản', desc: 'Đoạn văn tự do có in đậm, tiêu đề, danh sách, liên kết — dùng cho chính sách, giới thiệu, bài viết.', section: true,
    fields: [{ key: 'html', label: 'Nội dung', type: 'richtext' }],
    make: () => ({ html: '<p>Nội dung văn bản.</p>' }),
    render: b => section(b, `<article class="prose" style="padding:0">${RICH(b.html)}</article>`)
  },

  pageHeader: {
    label: 'Tiêu đề trang', desc: 'Đường dẫn "Trang chủ / …" và tiêu đề lớn (H1) cho trang con.', section: false,
    fields: [{ key: 'crumbs', label: 'Hiện đường dẫn "Trang chủ / …"', type: 'bool' }, F.eyebrow, { ...F.title, label: 'Tiêu đề (H1)' }, F.lead],
    make: () => ({ crumbs: true, eyebrow: '', title: 'Tiêu đề trang', lead: '' }),
    render: (b, ctx) => `<div class="wrap">${b.crumbs ? crumbs(ctx.page.title || String(b.title || '').replace(/\*/g, '')) : ''}
  <div class="page-head sec-head">${b.eyebrow ? `<span class="eyebrow">${T(b.eyebrow)}</span>` : ''}<h1 class="h1">${HL(b.title)}</h1>${b.lead ? `<p class="lead">${T(b.lead)}</p>` : ''}</div></div>`
  },

  notice: {
    label: 'Thông báo', desc: 'Khung thông báo có biểu tượng và nút (VD: "Bài viết đang được chuẩn bị").', section: true,
    fields: [{ key: 'icon', label: 'Biểu tượng', type: 'icon' }, { key: 'title', label: 'Tiêu đề', type: 'text' }, { key: 'text', label: 'Nội dung', type: 'textarea' }, F.buttons],
    make: () => ({ icon: 'bell', title: 'Thông báo', text: 'Nội dung thông báo.', buttons: [] }),
    render: b => section(b, `<div class="empty">${icon(b.icon || 'bell')}<h2 class="h3">${T(b.title)}</h2>${b.text ? `<p class="muted">${T(b.text)}</p>` : ''}${buttons(b.buttons)}</div>`)
  },

  video: {
    label: 'Video', desc: 'Nhúng video YouTube hoặc video .mp4 đã tải lên.', section: true,
    fields: [...HEAD, { key: 'url', label: 'Link YouTube hoặc video .mp4', type: 'video', hint: 'VD: https://www.youtube.com/watch?v=… hoặc /uploads/abc.mp4' }],
    make: () => ({ align: 'center', eyebrow: '', title: 'Video', lead: '', url: '' }),
    render(b) {
      const url = String(b.url || '');
      const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
      const player = yt
        ? `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="${esc(b.title || 'Video')}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
        : (media(url) ? `<video src="${IMG(url)}" controls preload="metadata"></video>` : '');
      return player ? section(b, `${head(b)}<div class="video-embed reveal">${player}</div>`) : '';
    }
  },

  contactForm: {
    label: 'Form liên hệ', desc: 'Form gửi yêu cầu tư vấn hoặc đăng ký đối tác, kèm thông tin liên hệ. Dữ liệu vào mục Liên hệ trong quản trị.', section: true,
    fields: [
      { key: 'formType', label: 'Loại form', type: 'select', options: [['contact', 'Yêu cầu tư vấn'], ['partner', 'Đăng ký đối tác']] },
      { key: 'variant', label: 'Bố cục', type: 'select', options: [['card', 'Thẻ thông tin đầy đủ + bản đồ'], ['text', 'Tiêu đề + liên hệ ngắn']] },
      F.eyebrow, F.title, F.lead,
      { key: 'formTitle', label: 'Tiêu đề trên form', type: 'text' }, { key: 'button', label: 'Chữ nút gửi', type: 'text' }],
    make: () => ({ formType: 'contact', variant: 'text', eyebrow: 'Liên hệ', title: 'Để lại thông tin', lead: 'Chúng tôi sẽ gọi lại cho bạn.', formTitle: '', button: 'Gửi yêu cầu' }),
    render(b, ctx) {
      const partner = b.formType === 'partner';
      const k = `f${ctx.index}`;
      const field = (id, label, input, req, err) => `<div class="field"><label for="${k}-${id}">${label}${req ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>${input}${err ? `<p class="err">${icon('alert')} ${err}</p>` : ''}</div>`;
      const form = `<form class="form contact-card" data-lead-form data-type="${partner ? 'partner' : 'contact'}" novalidate>
      ${b.formTitle ? `<h2 class="h3" style="margin:0">${T(b.formTitle)}</h2>` : ''}
      <div class="row-2">
        ${field('name', 'Họ và tên', `<input class="input" id="${k}-name" name="name" autocomplete="name" required>`, true, 'Vui lòng nhập họ tên.')}
        ${field('phone', 'Số điện thoại', `<input class="input" id="${k}-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required>`, true, 'Nhập số điện thoại gồm 10 số, ví dụ 0912 345 678.')}
      </div>
      ${partner ? `${field('email', 'Email <span class="hint">(không bắt buộc)</span>', `<input class="input" id="${k}-email" name="email" type="email" autocomplete="email">`, false, 'Email chưa đúng định dạng, ví dụ ten@congty.vn.')}
      ${field('company', 'Tên doanh nghiệp / thương hiệu', `<input class="input" id="${k}-company" name="company" autocomplete="organization">`)}
      <div class="row-2">
        ${field('type', 'Loại hình', `<select class="select" id="${k}-type" name="bizType"><option value="">— Chọn loại hình —</option>${['Chủ doanh nghiệp', 'Nhà phân phối', 'Phòng tập Gym / Yoga', 'Nhà thuốc', 'Cửa hàng thực phẩm healthy', 'HLV / Chuyên gia dinh dưỡng', 'Khác'].map(t => `<option>${t}</option>`).join('')}</select>`)}
        ${field('prov', 'Tỉnh / Thành phố', `<input class="input" id="${k}-prov" name="province" autocomplete="address-level1">`)}
      </div>
      ${field('msg', 'Nhu cầu hợp tác', `<textarea class="textarea" id="${k}-msg" name="message" placeholder="Quy mô, số điểm bán/hội viên, sản phẩm quan tâm…"></textarea>`)}`
      : `${field('product', 'Sản phẩm quan tâm', `<select class="select" id="${k}-product" name="product"><option value="">— Chọn sản phẩm —</option>${list(C.products).map(p => `<option>${T(p.name)}</option>`).join('')}<option>Quà tặng doanh nghiệp</option></select>`)}
      ${field('msg', 'Nội dung', `<textarea class="textarea" id="${k}-msg" name="message"></textarea>`)}`}
      <p class="form-alert" role="alert"></p>
      <button class="btn btn-primary btn-block" type="submit">${T(b.button || 'Gửi')}</button>
    </form>`;
      const c = co();
      const left = b.variant === 'card'
        ? `<div class="contact-card">${contactInfoList(true)}
      <h2 class="h3" style="margin-top:28px">Kênh chính thức &amp; cộng đồng</h2>
      ${channelList([...list(C.site.socials), ...list(C.site.communities)])}
      ${c.mapEmbed && /^https:\/\//.test(c.mapEmbed) ? `<iframe title="Bản đồ" src="${esc(c.mapEmbed)}" style="width:100%;height:260px;border:0;border-radius:14px;margin-top:24px" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>` : ''}</div>`
        : `<div>${b.eyebrow ? `<span class="eyebrow">${T(b.eyebrow)}</span>` : ''}${b.title ? `<h2 class="h2">${HL(b.title)}</h2>` : ''}${b.lead ? `<p class="lead">${T(b.lead)}</p>` : ''}${contactInfoList(false)}</div>`;
      return section(b, left + form, { wrap: 'wrap split split--top' });
    }
  }
};

// Trường chung cho mọi khối dạng section (nền, id, khoảng cách)
const SECTION_FIELDS = [
  { key: 'bg', label: 'Màu nền khối', type: 'select', options: [['', 'Mặc định (nền trang)'], ['white', 'Trắng'], ['mint', 'Màu chính nhạt'], ['navy', 'Tối'], ['primary', 'Màu chính'], ['custom', 'Màu tuỳ chọn…']] },
  { key: 'bgColor', label: 'Màu nền tuỳ chọn', type: 'color', showIf: { key: 'bg', in: ['custom'] } },
  { key: 'tight', label: 'Bỏ khoảng trống phía trên', type: 'bool' },
  { key: 'anchor', label: 'Mã neo (để link tới, VD: chon-size)', type: 'text', hint: 'Link tới khối bằng /duong-dan#ma-neo. Chỉ chữ thường không dấu, số, gạch nối.' }
];

function renderBlocks(page) {
  return list(page.blocks).filter(b => b && !b.hidden && TYPES[b.type]).map((b, index) => {
    try { return TYPES[b.type].render(b, { page, index }); } catch (e) { console.error('Lỗi render khối', b.type, b.id, e); return ''; }
  }).join('\n');
}

/* ---------- Form cho sản phẩm, trang, cài đặt, màu ---------- */
const textList = (key, label, itemName) => ({ key, label, type: 'list', itemLabel: 'text', fields: [{ key: 'text', label: itemName, type: 'text' }], newItem: { text: '' } });
const linkList = (key, label) => ({ key, label, type: 'list', itemLabel: 'label', fields: [{ key: 'label', label: 'Chữ', type: 'text' }, { key: 'href', label: 'Liên kết', type: 'link' }], newItem: { label: 'Liên kết', href: '/' } });
const PRODUCT_FIELDS = [
  { key: 'name', label: 'Tên sản phẩm', type: 'text' },
  { key: 'slug', label: 'Đường dẫn (/san-pham/…)', type: 'text', hint: 'Chữ thường không dấu, số, gạch nối. Đổi đường dẫn làm link cũ không còn vào được.' },
  { key: 'category', label: 'Danh mục', type: 'text' }, { key: 'tagline', label: 'Câu mô tả ngắn', type: 'text' },
  { key: 'price', label: 'Giá (đồng)', type: 'number', min: 0 }, { key: 'priceNote', label: 'Ghi chú cạnh giá', type: 'text' },
  { key: 'badge', label: 'Nhãn góc ảnh (VD: Bán chạy)', type: 'text' },
  { key: 'featured', label: 'Thẻ nổi bật (viền màu chính)', type: 'bool' }, { key: 'dark', label: 'Nền ảnh tối', type: 'bool' },
  { key: 'image', label: 'Ảnh chính', type: 'image' },
  { key: 'gallery', label: 'Bộ ảnh trang chi tiết', type: 'list', itemLabel: 'alt', fields: [{ key: 'src', label: 'Ảnh', type: 'image' }, { key: 'alt', label: 'Mô tả ảnh', type: 'text' }], newItem: { src: '', alt: '' } },
  { key: 'colors', label: 'Màu sắc', type: 'list', itemLabel: 'name', fields: [{ key: 'name', label: 'Tên màu', type: 'text' }, { key: 'hex', label: 'Màu hiển thị', type: 'color' }], newItem: { id: '', name: 'Màu mới', hex: '#1d1d20' } },
  { key: 'sizes', label: 'Các size (cách nhau dấu phẩy)', type: 'text', hint: 'VD: 7, 8, 9. Để trống nếu sản phẩm không có size.' },
  { key: 'summary', label: 'Giới thiệu', type: 'textarea' },
  textList('highlights', 'Điểm nổi bật (nhãn nhỏ)', 'Nội dung'),
  { key: 'metrics', label: 'Chỉ số đo lường', type: 'list', itemLabel: 'title', fields: [{ key: 'title', label: 'Tên chỉ số', type: 'text' }, { key: 'text', label: 'Mô tả', type: 'text' }], newItem: { title: 'Chỉ số', text: '' } },
  textList('benefits', 'Lợi ích chính', 'Lợi ích'), textList('forWho', 'Dành cho', 'Đối tượng'),
  { key: 'specs', label: 'Thông số kỹ thuật', type: 'list', itemLabel: 'label', fields: [{ key: 'label', label: 'Thông số', type: 'text' }, { key: 'value', label: 'Giá trị', type: 'text' }], newItem: { label: 'Thông số', value: '' } },
  textList('guide', 'Hướng dẫn kết nối (các bước)', 'Bước')
];
const PAGE_FIELDS = [
  { key: 'title', label: 'Tên trang (hiện trên tab trình duyệt)', type: 'text', hint: 'Trang chủ để trống sẽ dùng "Tên website — Khẩu hiệu".' },
  { key: 'path', label: 'Đường dẫn', type: 'text', hint: 'VD: /khuyen-mai. Chữ thường không dấu, số, gạch nối.' },
  { key: 'desc', label: 'Mô tả cho Google (SEO)', type: 'textarea', hint: 'Khoảng 120–160 ký tự.' },
  { key: 'noindex', label: 'Ẩn khỏi Google', type: 'bool' }
];
const SITE_FIELDS = [
  { key: 'name', label: 'Tên website', type: 'text' }, { key: 'tagline', label: 'Khẩu hiệu (tiêu đề trang chủ)', type: 'text' },
  { key: 'description', label: 'Mô tả mặc định cho Google', type: 'textarea' },
  { key: 'logoText', label: 'Logo — chữ chính', type: 'text' }, { key: 'logoAccent', label: 'Logo — chữ màu nhấn', type: 'text' },
  { key: 'topbar', label: 'Thanh thông tin trên cùng', type: 'list', itemLabel: 'text', fields: [{ key: 'icon', label: 'Biểu tượng', type: 'icon' }, { key: 'text', label: 'Chữ', type: 'text' }, { key: 'linkText', label: 'Chữ liên kết (tuỳ chọn)', type: 'text' }, { key: 'href', label: 'Liên kết', type: 'link' }], newItem: { icon: 'bell', text: 'Thông tin', linkText: '', href: '' } },
  linkList('nav', 'Menu chính'),
  { key: 'headerCta', label: 'Nút trên menu', type: 'group', fields: [{ key: 'label', label: 'Chữ (để trống để ẩn)', type: 'text' }, { key: 'href', label: 'Liên kết', type: 'link' }] },
  { key: 'company', label: 'Thông tin liên hệ', type: 'group', fields: [
    { key: 'name', label: 'Tên công ty', type: 'text' }, { key: 'address', label: 'Địa chỉ', type: 'text' }, { key: 'hotline', label: 'Hotline', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' }, { key: 'taxCode', label: 'Mã số thuế', type: 'text' }, { key: 'hours', label: 'Giờ làm việc', type: 'text' },
    { key: 'zalo', label: 'Link Zalo', type: 'text' }, { key: 'facebook', label: 'Link Fanpage', type: 'text' },
    { key: 'website', label: 'Website (chữ hiển thị)', type: 'text' }, { key: 'websiteUrl', label: 'Website (link)', type: 'text' },
    { key: 'mapEmbed', label: 'Link nhúng Google Maps', type: 'text', hint: 'Google Maps → Chia sẻ → Nhúng bản đồ → copy phần src="…".' }] },
  { key: 'socials', label: 'Mạng xã hội', type: 'list', itemLabel: 'label', fields: [{ key: 'icon', label: 'Biểu tượng', type: 'icon' }, { key: 'label', label: 'Tên', type: 'text' }, { key: 'url', label: 'Link', type: 'text' }], newItem: { icon: 'facebook', label: 'Fanpage', url: 'https://' } },
  { key: 'communities', label: 'Cộng đồng', type: 'list', itemLabel: 'label', fields: [{ key: 'icon', label: 'Biểu tượng', type: 'icon' }, { key: 'label', label: 'Tên', type: 'text' }, { key: 'note', label: 'Ghi chú (VD: Nhóm Facebook)', type: 'text' }, { key: 'url', label: 'Link', type: 'text' }], newItem: { icon: 'users', label: 'Nhóm', note: '', url: 'https://' } },
  { key: 'footer', label: 'Chân trang', type: 'group', fields: [{ key: 'about', label: 'Giới thiệu ngắn', type: 'textarea' }, linkList('productLinks', 'Liên kết thêm ở cột Sản phẩm'), linkList('policyLinks', 'Cột Chính sách'), { key: 'bottomNote', label: 'Dòng ghi chú cuối', type: 'text' }] },
  { key: 'fab', label: 'Hiện nút Zalo / Gọi nổi góc màn hình', type: 'bool' }
];
const SIZE_FIELDS = [
  { key: 'steps', label: 'Các bước đo', type: 'list', itemLabel: 'title', fields: [{ key: 'title', label: 'Tiêu đề', type: 'text' }, { key: 'text', label: 'Nội dung', type: 'textarea' }], newItem: { title: 'Bước', text: '' } },
  { key: 'hint', label: 'Lưu ý', type: 'textarea' },
  { key: 'images', label: 'Ảnh minh hoạ', type: 'list', itemLabel: 'alt', fields: [{ key: 'src', label: 'Ảnh', type: 'image' }, { key: 'alt', label: 'Mô tả ảnh', type: 'text' }], newItem: { src: '', alt: '' } },
  { key: 'rows', label: 'Bảng quy đổi', type: 'list', itemLabel: 'size', fields: [{ key: 'size', label: 'Size', type: 'text' }, { key: 'diameter', label: 'Đường kính trong (mm)', type: 'text' }, { key: 'circumference', label: 'Chu vi ngón tay (mm)', type: 'text' }], newItem: { size: '', diameter: '', circumference: '' } },
  { key: 'note', label: 'Ghi chú dưới bảng', type: 'textarea' }
];
const THEME_FIELDS = [
  { key: 'primary', label: 'Màu chính (nút bấm, điểm nhấn)', type: 'color' },
  { key: 'primaryInk', label: 'Màu chữ nhấn trên nền sáng', type: 'color', hint: 'Nên đậm hơn màu chính để chữ dễ đọc.' },
  { key: 'dark', label: 'Màu tối (chữ chính, nền tối)', type: 'color' },
  { key: 'bg', label: 'Màu nền trang', type: 'color' }
];

// Mô tả cho trang quản trị (không gửi hàm render)
function schema() {
  return {
    blocks: Object.fromEntries(Object.entries(TYPES).map(([k, t]) => [k, { label: t.label, desc: t.desc, section: t.section, fields: t.section ? [...t.fields, ...SECTION_FIELDS] : t.fields, make: t.make() }])),
    product: PRODUCT_FIELDS, page: PAGE_FIELDS, site: SITE_FIELDS, sizeGuide: SIZE_FIELDS, theme: THEME_FIELDS,
    icons: ICONS
  };
}

module.exports = { use, content, TYPES, renderBlocks, schema, productCard, sizeGuideHtml, sizesOf, productOf, T, HL, RICH, L, IMG, buttons, rawPhone, list, channelList };
