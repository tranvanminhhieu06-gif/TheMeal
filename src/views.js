// Giao diện các trang. Nội dung (chữ, khối, sản phẩm, màu) lấy từ content do trang quản trị chỉnh (src/store.js).
const fs = require('fs');
const path = require('path');
const cfg = require('./config');
const { icon } = require('./icons');
const { u, abs, esc, vnd, color, mix } = require('./render-utils');
const B = require('./blocks');

const { T, HL, RICH, L, IMG, list, rawPhone, productCard, sizeGuideHtml, sizesOf } = B;
let C = null;
const co = () => C.site.company;

// Đặt nội dung hiện hành rồi render (đồng bộ, an toàn với một luồng Node)
function withContent(content, fn) { C = content; B.use(content); return fn(); }

function publicProduct(p) {
  return { id: p.id, slug: p.slug, name: p.name, price: Number(p.price), image: IMG(p.image), dark: !!p.dark, colors: list(p.colors), sizes: sizesOf(p), category: p.category };
}

function themeCss() {
  const t = C.theme || {};
  const p = color(t.primary, '#4BCE97'), ink = color(t.primaryInk, '#147A56'), d = color(t.dark, '#0B1C3A'), bg = color(t.bg, '#FAF9F6');
  const isDefP = p.toLowerCase() === '#4bce97', isDefD = d.toLowerCase() === '#0b1c3a';
  return `:root{--green:${p};--green-ink:${ink};--green-50:${isDefP ? '#E8F8F1' : mix(p, '#ffffff', 0.88)};--green-100:${isDefP ? '#CFF1E2' : mix(p, '#ffffff', 0.76)};--navy:${d};--navy-80:${isDefD ? '#24324F' : mix(d, '#ffffff', 0.12)};--cream:${bg}}`;
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */
function layout({ title, desc, path = '/', body, jsonld = [], ogImage = '/img/og-default.jpg', bodyClass = '', noindex = false, preview = false }) {
  const S = C.site;
  const fullTitle = title ? `${title} | ${S.name}` : `${S.name} — ${S.tagline}`;
  const url = abs(path);
  const description = desc || S.description;
  const orgLd = {
    '@context': 'https://schema.org', '@type': 'Organization', name: co().name, url: abs('/'),
    email: co().email, telephone: rawPhone(co().hotline), address: { '@type': 'PostalAddress', streetAddress: co().address, addressCountry: 'VN' },
    sameAs: list(S.socials).map(x => x.url).filter(Boolean)
  };
  const current = h => { const x = String(h || ''); return x === path || (x.split('#')[0] === path && !x.includes('#')); };
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
${noindex || preview ? '<meta name="robots" content="noindex">' : ''}
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website"><meta property="og:locale" content="vi_VN"><meta property="og:site_name" content="${esc(S.name)}">
<meta property="og:title" content="${esc(fullTitle)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(/^https?:/.test(ogImage) ? ogImage : abs(ogImage))}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${esc(color((C.theme || {}).dark, '#0B1C3A'))}">
<link rel="icon" href="${u('/favicon.svg')}" type="image/svg+xml">
<link rel="preload" href="${u('/fonts/be-vietnam-pro-vietnamese-800-normal.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${u('/css/style.css')}">
<style>${themeCss()}</style>
<script type="application/ld+json">${JSON.stringify([orgLd, ...jsonld]).replace(/</g, '\\u003c')}</script>
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Bỏ qua đến nội dung chính</a>
${list(S.topbar).length ? `<div class="topbar"><div class="wrap">
  ${list(S.topbar).map(x => `<span>${icon(x.icon)} ${T(x.text)}${x.linkText ? ` <a href="${L(x.href)}">${T(x.linkText)}</a>` : ''}</span>`).join('\n  ')}
</div></div>` : ''}
<header class="header" id="top">
  <div class="wrap">
    <a class="logo" href="${u('/')}" aria-label="${esc(S.name)} — trang chủ">${T(S.logoText)}${S.logoAccent ? ` <b>${T(S.logoAccent)}</b>` : ''}</a>
    <nav class="nav" id="nav" aria-label="Điều hướng chính">
      ${list(S.nav).map(n => `<a href="${L(n.href)}"${current(n.href) ? ' aria-current="page"' : ''}>${T(n.label)}</a>`).join('')}
    </nav>
    <div class="h-actions">
      <a class="icon-btn" href="${u('/gio-hang')}" aria-label="Giỏ hàng">${icon('cart')}<span class="cart-count" data-cart-count data-n="0">0</span></a>
      ${S.headerCta && S.headerCta.label ? `<a class="btn btn-primary" href="${L(S.headerCta.href)}" style="min-height:44px;padding:10px 20px">${T(S.headerCta.label)}</a>` : ''}
      <button class="icon-btn menu-btn" id="menuBtn" aria-controls="nav" aria-expanded="false" aria-label="Mở menu">${icon('menu')}</button>
    </div>
  </div>
</header>
<main id="main">
${body}
</main>
${footer()}
${S.fab !== false ? `<div class="fab" aria-label="Liên hệ nhanh">
  ${co().zalo ? `<a class="zalo" href="${L(co().zalo)}" target="_blank" rel="noopener" aria-label="Chat Zalo">Zalo</a>` : ''}
  ${co().hotline ? `<a class="call" href="tel:${esc(rawPhone(co().hotline))}" aria-label="Gọi hotline ${esc(co().hotline)}">${icon('phone')}</a>` : ''}
</div>` : ''}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script>
window.__BASE__=${JSON.stringify(process.env.BASE_PATH || '')};
window.__ORDER_ENDPOINT__=${JSON.stringify(cfg.orderEndpoint || '')};
window.__PRODUCTS__=${JSON.stringify(list(C.products).map(publicProduct)).replace(/</g, '\\u003c')};
</script>
<script src="${u('/js/app.js')}" defer></script>
${preview ? previewBar() : ''}
</body>
</html>`;
}

// Bản xem trước: thanh báo + giữ điều hướng trong chế độ xem trước, chặn gửi form thật.
function previewBar() {
  return `<div class="preview-bar" role="status">Bản xem trước — chưa đăng lên website</div>
<script>
document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(!a)return;var url=new URL(a.href,location.href);
if(url.origin!==location.origin||url.pathname.indexOf('/admin')===0||(url.pathname===location.pathname&&url.hash))return;
e.preventDefault();location.href='/admin/preview?path='+encodeURIComponent(url.pathname)+url.hash;},true);
document.addEventListener('submit',function(e){e.preventDefault();e.stopImmediatePropagation();alert('Đang ở chế độ xem trước — form không được gửi.');},true);
</script>`;
}

function footer() {
  const S = C.site, F = S.footer || {}, c = co();
  const seen = new Set();
  const social = list(S.socials).filter(x => x.url && !seen.has(x.icon) && seen.add(x.icon));
  return `<footer class="footer">
  <div class="wrap">
    <div class="f-grid">
      <div>
        <a class="logo" href="${u('/')}" style="font-size:28px">${T(S.logoText)}${S.logoAccent ? ` <b>${T(S.logoAccent)}</b>` : ''}</a>
        ${F.about ? `<p style="margin-top:14px">${T(F.about)}</p>` : ''}
        <div class="socials">${social.map(x => `<a href="${L(x.url)}" target="_blank" rel="noopener" aria-label="${esc(x.label)}">${icon(x.icon)}</a>`).join('')}</div>
      </div>
      <div>
        <h3>Sản phẩm</h3>
        <ul>${list(C.products).map(p => `<li><a href="${u('/san-pham/' + p.slug)}">${T(p.name)}</a></li>`).join('')}
        ${list(F.productLinks).map(x => `<li><a href="${L(x.href)}">${T(x.label)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h3>Chính sách</h3>
        <ul>${list(F.policyLinks).map(x => `<li><a href="${L(x.href)}">${T(x.label)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h3>Liên hệ</h3>
        <ul>
          ${c.name ? `<li>${T(c.name)}</li>` : ''}
          ${c.address ? `<li>${T(c.address)}</li>` : ''}
          ${c.hotline ? `<li><a href="tel:${esc(rawPhone(c.hotline))}">Hotline: ${T(c.hotline)}</a></li>` : ''}
          ${c.email ? `<li><a href="mailto:${esc(c.email)}">${T(c.email)}</a></li>` : ''}
          ${c.taxCode ? `<li>MST: ${T(c.taxCode)}</li>` : ''}
        </ul>
      </div>
    </div>
    <div class="f-bottom">
      <span>© ${new Date().getFullYear()} ${T(c.name)}. Mọi quyền được bảo lưu.</span>
      ${F.bottomNote ? `<span>${T(F.bottomNote)}</span>` : ''}
    </div>
  </div>
</footer>`;
}

/* ------------------------------------------------------------------ */
/* Trang dựng từ khối                                                  */
/* ------------------------------------------------------------------ */
function productLd(p) {
  return {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.summary,
    image: list(p.gallery).filter(g => g.src).map(g => abs(g.src)), brand: { '@type': 'Brand', name: C.site.name }, sku: p.id,
    offers: { '@type': 'Offer', priceCurrency: 'VND', price: Number(p.price), availability: 'https://schema.org/InStock', url: abs(`/san-pham/${p.slug}`) }
  };
}

function page(content, pg, { preview = false, views = {} } = {}) {
  return withContent(content, () => {
    B.useViews(views);
    const blocks = list(pg.blocks).filter(b => b && !b.hidden);
    const faqs = blocks.filter(b => b.type === 'faq').flatMap(b => list(b.items));
    const jsonld = [];
    if (faqs.length) jsonld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: RICH(f.a).replace(/<[^>]+>/g, '') } })) });
    if (blocks.some(b => b.type === 'products')) jsonld.push(...list(C.products).map(productLd));
    const body = B.renderBlocks(pg) || `<div class="wrap" style="padding:96px 0"><p class="muted center">Trang chưa có nội dung.</p></div>`;
    return layout({ title: pg.path === '/' ? pg.title : (pg.title || ''), desc: pg.desc, path: pg.path, body, jsonld, noindex: !!pg.noindex, preview });
  });
}

function productPage(content, p, { preview = false } = {}) {
  return withContent(content, () => {
    const others = list(C.products).filter(o => o.id !== p.id).slice(0, 3);
    const sizes = sizesOf(p);
    const isRing = sizes.length > 0;
    const gallery = list(p.gallery).filter(g => g.src).length ? list(p.gallery).filter(g => g.src) : [{ src: p.image, alt: p.name }];
    const colors = list(p.colors);
    const body = `
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${u('/')}">Trang chủ</a></li><li><a href="${u('/san-pham')}">Sản phẩm</a></li><li aria-current="page">${T(p.name)}</li></ol></nav>
  <div class="pd">
    <div class="gallery" data-gallery>
      <div class="g-main${p.dark ? '' : ' light'}" id="gMain"><img src="${IMG(gallery[0].src)}" alt="${esc(gallery[0].alt)}" width="720" height="720" fetchpriority="high"></div>
      <div class="g-thumbs" role="group" aria-label="Ảnh sản phẩm">
        ${gallery.map((g, i) => `<button type="button" aria-pressed="${i === 0}" aria-label="Xem ảnh ${i + 1}: ${esc(g.alt)}" data-src="${IMG(g.src)}" data-alt="${esc(g.alt)}"><img src="${IMG(g.src)}" alt="" loading="lazy" width="76" height="76"></button>`).join('')}
      </div>
    </div>
    <div class="pd-info" id="chon-tuy-chon">
      <span class="eyebrow">${T(p.category)}</span>
      <h1>${T(p.name)}</h1>
      <p class="lead" style="font-weight:600;color:var(--navy)">${T(p.tagline)}</p>
      <div class="price-row" style="margin:6px 0 14px"><span class="price">${vnd(p.price)}</span>${p.priceNote ? `<span class="price-note">${T(p.priceNote)}</span>` : ''}</div>
      <p class="muted">${T(p.summary)}</p>
      <ul class="p-specs">${list(p.highlights).map(h => `<li>${T(h.text)}</li>`).join('')}</ul>

      <form id="buyForm" data-id="${esc(p.id)}" novalidate>
        <div class="opt">
          <div class="opt-label" id="lblColor">Màu sắc: <span data-color-name style="font-weight:600;margin-right:auto;margin-left:6px">${T((colors[0] || {}).name)}</span></div>
          <div class="swatches" role="radiogroup" aria-labelledby="lblColor">
            ${colors.map((c, i) => `<button type="button" class="swatch" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-color="${esc(c.id)}" data-name="${esc(c.name)}"><i style="background:${esc(color(c.hex, '#cccccc'))}"></i>${T(c.name)}</button>`).join('')}
          </div>
        </div>
        ${isRing ? `<div class="opt field" id="sizeField">
          <div class="opt-label"><span id="lblSize">Chọn size <span class="req" aria-hidden="true">*</span></span><a href="#tab-size" data-open-tab="size">Hướng dẫn chọn size</a></div>
          <div class="sizes" role="radiogroup" aria-labelledby="lblSize" aria-describedby="sizeErr">
            ${sizes.map((s, i) => `<button type="button" class="size-btn" role="radio" aria-checked="false" tabindex="${i === 0 ? 0 : -1}" data-size="${esc(s)}">${T(s)}</button>`).join('')}
          </div>
          <p class="err" id="sizeErr" role="alert">${icon('alert')} Vui lòng chọn size để tiếp tục. Chưa chắc size? Xem hướng dẫn đo bên dưới.</p>
        </div>` : ''}
        <div class="opt">
          <div class="opt-label"><label for="qty">Số lượng</label></div>
          <div class="qty"><button type="button" data-qty="-1" aria-label="Giảm số lượng">−</button><input id="qty" type="number" inputmode="numeric" min="1" max="10" value="1"><button type="button" data-qty="1" aria-label="Tăng số lượng">+</button></div>
        </div>
        <div class="buy-row">
          <button type="submit" class="btn btn-primary" data-action="buy">Mua ngay ${icon('arrow')}</button>
          <button type="button" class="btn btn-ghost" data-action="add">${icon('cart')} Thêm vào giỏ</button>
        </div>
      </form>
      <div class="assure">
        <span>${icon('package')} Thanh toán khi nhận hàng</span>
        <span>${icon('shield')} Chứng nhận CE · FCC · RoHS</span>
        ${co().hotline ? `<span>${icon('phone')} Tư vấn ${T(co().hotline)}</span>` : ''}
        ${isRing ? `<span>${icon('refresh')} Hỗ trợ đổi size</span>` : ''}
      </div>
    </div>
  </div>

  <div class="tabs" id="thong-tin">
    <div class="tablist" role="tablist" aria-label="Thông tin sản phẩm">
      <button role="tab" id="t-overview" aria-controls="tab-overview" aria-selected="true" data-tab="overview">Tổng quan</button>
      <button role="tab" id="t-specs" aria-controls="tab-specs" aria-selected="false" tabindex="-1" data-tab="specs">Thông số kỹ thuật</button>
      ${isRing ? `<button role="tab" id="t-size" aria-controls="tab-size" aria-selected="false" tabindex="-1" data-tab="size">Chọn size</button>` : ''}
      ${list(p.guide).length ? `<button role="tab" id="t-guide" aria-controls="tab-guide" aria-selected="false" tabindex="-1" data-tab="guide">Hướng dẫn kết nối</button>` : ''}
    </div>
    <div class="tabpanel" role="tabpanel" id="tab-overview" aria-labelledby="t-overview">
      <div class="split" style="align-items:start">
        <div>
          ${list(p.metrics).length ? `<h2 class="h3">Các chỉ số đo lường</h2>
          <div class="grid g-2" style="gap:12px">${list(p.metrics).map((m, i) => `<div class="metric"><span class="num">${String(i + 1).padStart(2, '0')}</span><div><h3>${T(m.title)}</h3><p>${T(m.text)}</p></div></div>`).join('')}</div>` : ''}
        </div>
        <div>
          ${list(p.benefits).length ? `<h2 class="h3">Lợi ích chính</h2>
          <ul class="check-list">${list(p.benefits).map(b => `<li>${icon('checkCircle')}<span>${T(b.text)}</span></li>`).join('')}</ul>` : ''}
          ${list(p.forWho).length ? `<h2 class="h3">Dành cho</h2>
          <ul class="p-specs">${list(p.forWho).map(f => `<li>${T(f.text)}</li>`).join('')}</ul>` : ''}
        </div>
      </div>
    </div>
    <div class="tabpanel" role="tabpanel" id="tab-specs" aria-labelledby="t-specs" hidden>
      <table class="spec-table" style="max-width:720px"><caption class="sr-only">Thông số kỹ thuật ${T(p.name)}</caption>
      <tbody>${list(p.specs).map(s => `<tr><th scope="row">${T(s.label)}</th><td>${T(s.value)}</td></tr>`).join('')}</tbody></table>
    </div>
    ${isRing ? `<div class="tabpanel" role="tabpanel" id="tab-size" aria-labelledby="t-size" hidden>${sizeGuideHtml({}, true)}</div>` : ''}
    ${list(p.guide).length ? `<div class="tabpanel" role="tabpanel" id="tab-guide" aria-labelledby="t-guide" hidden>
      <ol class="steps" style="max-width:720px">${list(p.guide).map(s => `<li><span>${T(s.text)}</span></li>`).join('')}</ol>
    </div>` : ''}
  </div>

  ${others.length ? `<section class="section" style="padding-top:24px">
    <h2 class="h2">Có thể bạn quan tâm</h2>
    <div class="grid g-${Math.min(3, Math.max(2, others.length))}" style="margin-top:24px">${others.map(o => productCard(o)).join('')}</div>
  </section>` : ''}
</div>
<div class="sticky-buy" id="stickyBuy" aria-hidden="true">
  <div><div style="font-size:13px;font-weight:600">${T(p.name)}</div><span class="price">${vnd(p.price)}</span></div>
  <a class="btn btn-primary" href="#chon-tuy-chon" tabindex="-1">Mua ngay</a>
</div>`;
    // Ảnh chia sẻ riêng nếu có public/img/og-<slug>.jpg, không thì dùng ảnh sản phẩm
    const og = fs.existsSync(path.join(__dirname, '..', 'public', 'img', `og-${p.slug}.jpg`)) ? `/img/og-${p.slug}.jpg` : (p.image || '/img/og-default.jpg');
    return layout({ title: `${p.name} — ${p.tagline}`, path: `/san-pham/${p.slug}`, body, desc: `${p.name} giá ${vnd(p.price)}. ${p.summary || ''}`.slice(0, 160), ogImage: og, jsonld: [productLd(p)], bodyClass: 'has-sticky', preview });
  });
}

/* ------------------------------------------------------------------ */
/* Bài viết & sự kiện                                                  */
/* ------------------------------------------------------------------ */
const crumbs3 = (href, label, title) => `<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${u('/')}">Trang chủ</a></li><li><a href="${u(href)}">${label}</a></li><li aria-current="page">${T(title)}</li></ol></nav>`;
const faqLdOf = blocks => {
  const faqs = blocks.filter(b => b.type === 'faq' && !b.hidden).flatMap(b => list(b.items));
  return faqs.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: RICH(f.a).replace(/<[^>]+>/g, '') } })) }] : [];
};

function postPage(content, p, { preview = false, views = {} } = {}) {
  return withContent(content, () => {
    B.useViews(views);
    const related = B.published(C.posts).filter(x => x.slug !== p.slug).sort((a, b) => (B.slugOf(b.category) === B.slugOf(p.category)) - (B.slugOf(a.category) === B.slugOf(p.category)) || B.byDateDesc(a, b)).slice(0, 3);
    const body = `
<div class="wrap">
  ${crumbs3('/tin-tuc', 'Tin tức', p.title)}
  <header class="article-head">
    ${p.category ? `<span class="eyebrow">${T(p.category)}</span>` : ''}
    <h1 class="h1">${T(p.title)}</h1>
    <p class="article-meta">${p.date ? `<span>${icon('calendar')} ${B.dateVi(p.date, false)}</span>` : ''}${p.author ? `<span>bởi <b>${T(p.author)}</b></span>` : ''}<span>${icon('eye')} ${(views[p.slug] || 0).toLocaleString('vi-VN')} lượt xem</span></p>
    ${p.excerpt ? `<p class="lead">${T(p.excerpt)}</p>` : ''}
  </header>
  ${p.cover ? `<figure class="article-cover"><img src="${IMG(p.cover)}" alt="${esc(p.title)}" fetchpriority="high"></figure>` : ''}
</div>
${B.renderBlocks(p)}
${related.length ? `<section class="section section--white"><div class="wrap"><div class="sec-head"><h2 class="h2">Bài viết liên quan</h2></div><div class="grid g-3">${related.map(x => B.postCard(x, true)).join('')}</div></div></section>` : ''}`;
    const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.excerpt || '', datePublished: p.date || undefined, author: p.author ? { '@type': 'Person', name: p.author } : undefined, image: p.cover ? [abs(p.cover)] : undefined, mainEntityOfPage: abs('/tin-tuc/' + p.slug) };
    return layout({ title: p.title, desc: p.excerpt, path: '/tin-tuc/' + p.slug, body, ogImage: p.cover || '/img/og-default.jpg', jsonld: [ld, ...faqLdOf(list(p.blocks))], preview });
  });
}

function eventPage(content, e, { preview = false } = {}) {
  return withContent(content, () => {
    const free = !(Number(e.price) > 0);
    const reg = e.registerUrl
      ? `<a class="btn btn-primary" href="${L(e.registerUrl)}"${/^https?:/i.test(e.registerUrl) ? ' target="_blank" rel="noopener"' : ''}>Đăng ký tham gia ${icon('arrow')}</a>`
      : `<a class="btn btn-primary" href="#dang-ky">Đăng ký tham gia ${icon('arrow')}</a>`;
    const meta = [e.date && ['calendar', 'Ngày', B.dateVi(e.date)], e.time && ['clock', 'Giờ', T(e.time)], e.duration && ['hourglass', 'Thời lượng', T(e.duration)], e.location && ['pin', 'Địa điểm', T(e.location)]].filter(Boolean);
    const form = e.registerUrl ? '' : `
<section class="section section--white" id="dang-ky"><div class="wrap split split--top">
  <div><span class="eyebrow">Đăng ký</span><h2 class="h2">Giữ chỗ cho *${T(e.title)}*</h2>
    <p class="lead">Để lại thông tin, chúng tôi sẽ gọi xác nhận và gửi hướng dẫn tham gia.</p></div>
  <form class="form contact-card" data-lead-form data-type="event" novalidate>
    <input type="hidden" name="event" value="${esc(e.title)}${e.date ? ' (' + esc(B.dateVi(e.date, false)) + ')' : ''}">
    <div class="row-2">
      <div class="field"><label for="ev-name">Họ và tên <span class="req" aria-hidden="true">*</span></label><input class="input" id="ev-name" name="name" autocomplete="name" required><p class="err">${icon('alert')} Vui lòng nhập họ tên.</p></div>
      <div class="field"><label for="ev-phone">Số điện thoại <span class="req" aria-hidden="true">*</span></label><input class="input" id="ev-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required><p class="err">${icon('alert')} Nhập số điện thoại gồm 10 số, ví dụ 0912 345 678.</p></div>
    </div>
    <div class="field"><label for="ev-email">Email <span class="hint">(không bắt buộc)</span></label><input class="input" id="ev-email" name="email" type="email" autocomplete="email"><p class="err">${icon('alert')} Email chưa đúng định dạng.</p></div>
    <div class="field"><label for="ev-msg">Ghi chú</label><textarea class="textarea" id="ev-msg" name="message" placeholder="Số người tham gia, câu hỏi cho ban tổ chức…"></textarea></div>
    <p class="form-alert" role="alert"></p>
    <button class="btn btn-primary btn-block" type="submit">Gửi đăng ký</button>
  </form>
</div></section>`.replace(/\*([^*]+)\*/, '<span class="hl">$1</span>');
    const body = `
<div class="wrap">
  ${crumbs3('/su-kien', 'Sự kiện', e.title)}
  <div class="pd ev-detail">
    <div class="ev-detail-media">${e.image ? `<img src="${IMG(e.image)}" alt="${esc(e.title)}" fetchpriority="high">` : `<span class="art art-${B.slugOf(e.category).length % 3}" aria-hidden="true"><i></i><i></i><i></i></span>`}
      ${free ? '<span class="ev-free">Miễn phí</span>' : ''}</div>
    <div class="pd-info">
      ${e.category ? `<span class="eyebrow">${T(e.category)}</span>` : ''}
      <h1>${T(e.title)}</h1>
      ${e.excerpt ? `<p class="lead">${T(e.excerpt)}</p>` : ''}
      <ul class="info-list">${meta.map(([ic, k, v]) => `<li><span class="ic">${icon(ic)}</span><div><small>${k}</small>${v}</div></li>`).join('')}</ul>
      <div class="price-row" style="margin:18px 0"><span class="price">${free ? 'Miễn phí' : vnd(e.price)}</span>${!free && e.priceUnit ? `<span class="price-note">${T(e.priceUnit)}</span>` : ''}</div>
      <div class="hero-ctas">${reg}</div>
    </div>
  </div>
</div>
${B.renderBlocks(e)}
${form}`;
    const ld = { '@context': 'https://schema.org', '@type': 'Event', name: e.title, description: e.excerpt || '', startDate: e.date || undefined, image: e.image ? [abs(e.image)] : undefined,
      location: e.location ? { '@type': 'Place', name: e.location, address: e.location } : undefined,
      offers: { '@type': 'Offer', price: Number(e.price) || 0, priceCurrency: 'VND', url: abs('/su-kien/' + e.slug) } };
    return layout({ title: e.title, desc: e.excerpt, path: '/su-kien/' + e.slug, body, ogImage: e.image || '/img/og-default.jpg', jsonld: [ld], preview });
  });
}

/* ------------------------------------------------------------------ */
/* Trang chức năng (giỏ hàng, thanh toán…)                             */
/* ------------------------------------------------------------------ */
function cartPage(content) {
  return withContent(content, () => layout({ title: 'Giỏ hàng', path: '/gio-hang', noindex: true, body: `
<div class="wrap">
  <div class="page-head"><h1 class="h1">Giỏ hàng</h1></div>
  <div class="stepper" aria-label="Tiến trình đặt hàng"><span class="on"><i>1</i>Giỏ hàng</span><span class="sep"></span><span><i>2</i>Thông tin &amp; thanh toán</span><span class="sep"></span><span><i>3</i>Hoàn tất</span></div>
  <div id="cartRoot" class="cart-layout" aria-live="polite"><p class="muted">Đang tải giỏ hàng…</p></div>
</div>` }));
}

function checkoutPage(content) {
  return withContent(content, () => {
    const shipText = cfg.shippingFee == null ? 'Xác nhận khi gọi chốt đơn' : (cfg.shippingFee === 0 ? 'Miễn phí' : vnd(cfg.shippingFee));
    const privacy = list(C.site.footer.policyLinks).find(x => /bao-mat/.test(x.href)) || { href: '/chinh-sach/bao-mat', label: 'Chính sách bảo mật' };
    const body = `
<div class="wrap">
  <div class="page-head"><h1 class="h1">Thông tin đặt hàng</h1></div>
  <div class="stepper" aria-label="Tiến trình đặt hàng"><span class="done"><i>${icon('check')}</i>Giỏ hàng</span><span class="sep"></span><span class="on"><i>2</i>Thông tin &amp; thanh toán</span><span class="sep"></span><span><i>3</i>Hoàn tất</span></div>
  <div class="cart-layout">
    <form id="checkoutForm" class="form contact-card" novalidate>
      <h2 class="h3" style="margin:0">Người nhận</h2>
      <div class="field"><label for="name">Họ và tên <span class="req" aria-hidden="true">*</span></label>
        <input class="input" id="name" name="name" autocomplete="name" required aria-describedby="name-err">
        <p class="err" id="name-err">${icon('alert')} Vui lòng nhập họ tên người nhận hàng.</p></div>
      <div class="row-2">
        <div class="field"><label for="phone">Số điện thoại <span class="req" aria-hidden="true">*</span></label>
          <input class="input" id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required aria-describedby="phone-hint phone-err">
          <span class="hint" id="phone-hint">Để nhân viên gọi xác nhận đơn.</span>
          <p class="err" id="phone-err">${icon('alert')} Nhập số điện thoại Việt Nam gồm 10 số, ví dụ 0912 345 678.</p></div>
        <div class="field"><label for="email">Email <span class="hint">(không bắt buộc)</span></label>
          <input class="input" id="email" name="email" type="email" autocomplete="email" aria-describedby="email-err">
          <p class="err" id="email-err">${icon('alert')} Email chưa đúng định dạng, ví dụ ten@gmail.com.</p></div>
      </div>
      <div class="field"><label for="province">Tỉnh / Thành phố <span class="req" aria-hidden="true">*</span></label>
        <input class="input" id="province" name="province" autocomplete="address-level1" required aria-describedby="province-err">
        <p class="err" id="province-err">${icon('alert')} Vui lòng nhập tỉnh/thành phố.</p></div>
      <div class="field"><label for="address">Địa chỉ nhận hàng <span class="req" aria-hidden="true">*</span></label>
        <input class="input" id="address" name="address" autocomplete="street-address" placeholder="Số nhà, đường, phường/xã" required aria-describedby="address-err">
        <p class="err" id="address-err">${icon('alert')} Vui lòng nhập địa chỉ cụ thể để giao hàng.</p></div>
      <div class="field"><label for="note">Ghi chú <span class="hint">(không bắt buộc)</span></label>
        <textarea class="textarea" id="note" name="note" placeholder="Thời gian nhận hàng, cần tư vấn size…"></textarea></div>
      <fieldset class="field" style="border:0;padding:0;margin:0"><legend>Phương thức thanh toán</legend>
        <div class="grid" style="gap:10px;margin-top:6px">
          <label class="radio-card"><input type="radio" name="payment" value="cod" checked><span><b>Thanh toán khi nhận hàng (COD)</b><span>Kiểm tra hàng rồi trả tiền cho nhân viên giao hàng.</span></span></label>
          <label class="radio-card"><input type="radio" name="payment" value="bank"><span><b>Chuyển khoản ngân hàng</b><span>Nhận thông tin tài khoản / mã QR ngay sau khi đặt.</span></span></label>
        </div>
      </fieldset>
      <p class="form-alert" id="formAlert" role="alert"></p>
      <button class="btn btn-primary btn-block" type="submit" id="placeBtn">Đặt hàng ${icon('arrow')}</button>
      <p class="hint center" style="margin:0">Bằng việc đặt hàng, bạn đồng ý với <a href="${L(privacy.href)}">${T(privacy.label)}</a> của chúng tôi.</p>
    </form>
    <aside class="summary" aria-labelledby="sumTitle">
      <h2 id="sumTitle">Đơn hàng của bạn</h2>
      <div id="miniCart"></div>
      <div class="sum-row"><span>Tạm tính</span><span data-subtotal>—</span></div>
      <div class="sum-row"><span>Phí vận chuyển</span><span>${shipText}</span></div>
      <div class="sum-row total"><span>Tổng cộng</span><span data-total>—</span></div>
      <a class="link" href="${u('/gio-hang')}">← Sửa giỏ hàng</a>
    </aside>
  </div>
</div>`;
    return layout({ title: 'Thanh toán', path: '/thanh-toan', body, noindex: true });
  });
}

function successPage(content, order) {
  return withContent(content, () => {
    if (!order) {
      const body = `<div class="wrap" id="staticSuccess"><div class="success"><h1 class="h1">Đang tải thông tin đơn hàng…</h1><div class="hero-ctas" style="justify-content:center;margin-top:28px"><a class="btn btn-primary" href="${u('/')}">Về trang chủ</a></div></div></div>`;
      return layout({ title: 'Đặt hàng thành công', path: '/dat-hang/thanh-cong', body, noindex: true });
    }
    const b = cfg.bank;
    const hasBank = b.bin && b.account;
    const qr = hasBank ? `https://img.vietqr.io/image/${encodeURIComponent(b.bin)}-${encodeURIComponent(b.account)}-compact2.png?amount=${order.total}&addInfo=${encodeURIComponent(order.code)}&accountName=${encodeURIComponent(b.holder)}` : '';
    const bankBlock = order.payment !== 'bank' ? '' : (hasBank
      ? `<div class="bank"><img src="${qr}" alt="Mã QR chuyển khoản cho đơn ${order.code}" width="200" height="200"><div>
        <p style="margin:0 0 6px"><b>Ngân hàng:</b> ${esc(b.name)}</p><p style="margin:0 0 6px"><b>Số tài khoản:</b> ${esc(b.account)}</p>
        <p style="margin:0 0 6px"><b>Chủ tài khoản:</b> ${esc(b.holder)}</p><p style="margin:0 0 6px"><b>Số tiền:</b> ${vnd(order.total)}</p>
        <p style="margin:0"><b>Nội dung:</b> ${order.code}</p></div></div>`
      : `<div class="bank" style="grid-template-columns:1fr"><p style="margin:0">Nhân viên sẽ gửi thông tin chuyển khoản khi gọi xác nhận đơn.</p></div>`);
    const body = `
<div class="wrap"><div class="success">
  <div class="stepper" style="justify-content:center" aria-label="Tiến trình đặt hàng"><span class="done"><i>${icon('check')}</i>Giỏ hàng</span><span class="sep"></span><span class="done"><i>${icon('check')}</i>Thông tin</span><span class="sep"></span><span class="on"><i>3</i>Hoàn tất</span></div>
  <div class="tick">${icon('check')}</div>
  <h1 class="h1">Cảm ơn ${esc(order.customer.name)}, đơn hàng đã được ghi nhận!</h1>
  <p class="lead" style="margin-inline:auto">Mã đơn <b>${order.code}</b>. Nhân viên sẽ gọi <b>${esc(order.customer.phone)}</b> để xác nhận trong giờ làm việc.</p>
  <div class="order-box">
    <h2 class="h3">Chi tiết đơn hàng</h2>
    ${order.items.map(it => `<div class="mini-line"><img src="${IMG(it.image)}" alt=""><div><b>${esc(it.name)}</b><br>${esc(it.colorName)}${it.size ? ' · Size ' + esc(it.size) : ''} · SL ${it.qty}</div><b>${vnd(it.price * it.qty)}</b></div>`).join('')}
    <div class="sum-row total"><span>Tổng cộng</span><span>${vnd(order.total)}</span></div>
    <p class="hint">Thanh toán: ${order.payment === 'bank' ? 'Chuyển khoản ngân hàng' : 'Thanh toán khi nhận hàng (COD)'}${order.shipping == null ? ' · Phí vận chuyển sẽ được xác nhận qua điện thoại.' : ''}</p>
    ${bankBlock}
  </div>
  <div class="hero-ctas" style="justify-content:center;margin-top:28px"><a class="btn btn-primary" href="${u('/')}">Về trang chủ</a>${co().hotline ? `<a class="link" href="tel:${esc(rawPhone(co().hotline))}">${icon('phone')} Cần hỗ trợ? ${T(co().hotline)}</a>` : ''}</div>
</div></div>
<script>try{localStorage.removeItem('themeal_cart')}catch(e){}</script>`;
    return layout({ title: 'Đặt hàng thành công', path: '/dat-hang/thanh-cong', body, noindex: true });
  });
}

function notFound(content, title = 'Không tìm thấy trang', msg = 'Trang bạn tìm có thể đã được đổi tên hoặc không tồn tại.') {
  return withContent(content, () => {
    const body = `<div class="wrap"><div class="success"><h1 class="h1">${esc(title)}</h1><p class="lead" style="margin-inline:auto">${esc(msg)}</p>
  <div class="hero-ctas" style="justify-content:center"><a class="btn btn-primary" href="${u('/')}">Về trang chủ</a><a class="link" href="${u('/san-pham')}">Xem sản phẩm ${icon('arrow')}</a></div></div></div>`;
    return layout({ title, body, noindex: true });
  });
}

/* ------------------------------------------------------------------ */
/* Trang quản trị                                                      */
/* ------------------------------------------------------------------ */
// Bản server: khung trang, phần còn lại do public/js/cms.js dựng.
function adminShell(content) {
  const S = content.site;
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Quản trị | ${esc(S.name)}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/cms.css">
</head>
<body class="cms">
<div id="cms"><p class="cms-loading">Đang tải trang quản trị…</p></div>
<script src="/js/cms.js" defer></script>
</body>
</html>`;
}

// Bản tĩnh (GitHub Pages): đọc/ghi Google Sheet qua Apps Script (public/js/admin.js).
function staticAdminPage(content) {
  const S = content.site;
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Quản trị | ${esc(S.name)}</title>
<link rel="icon" href="${u('/favicon.svg')}" type="image/svg+xml">
<link rel="stylesheet" href="${u('/css/style.css')}">
</head>
<body class="admin">
<header class="admin-bar"><div class="wrap">
  <a class="logo" href="${u('/')}">${esc(S.logoText)} <b>${esc(S.logoAccent)}</b></a>
  <span class="admin-tag">Quản trị</span>
  <button class="btn btn-ghost" type="button" data-admin-logout hidden>Đăng xuất</button>
</div></header>
<main id="main" class="wrap admin-main">
  <section data-admin-login hidden>
    <form class="admin-login" novalidate>
      <h1 class="h2">Đăng nhập quản trị</h1>
      <p class="muted">Nhập mật khẩu quản trị (ADMIN_KEY đã đặt trong Google Apps Script).</p>
      <div class="field"><label for="admin-key">Mật khẩu</label><input class="input" id="admin-key" type="password" autocomplete="current-password" required></div>
      <label class="admin-remember"><input type="checkbox" id="admin-remember"> Ghi nhớ trên máy này</label>
      <div class="form-alert" role="alert" data-admin-error></div>
      <button class="btn btn-primary btn-block" type="submit">Đăng nhập</button>
    </form>
  </section>
  <section data-admin-setup hidden>
    <h1 class="h2">Chưa kết nối Google Sheet</h1>
    <p class="muted">Bản tĩnh chưa có <code>orderEndpoint</code> trong <code>src/config.js</code>, nên chưa có đơn hàng nào để quản lý. Làm theo <code>scripts/google-apps-script/README.md</code> rồi build lại.</p>
  </section>
  <section data-admin-app hidden>
    <div class="admin-head">
      <div><h1 class="h2">Đơn hàng</h1><p class="muted" data-admin-summary></p></div>
      <div class="admin-tools">
        <input class="input" type="search" placeholder="Tìm mã đơn, tên, SĐT…" data-admin-search aria-label="Tìm đơn hàng">
        <select class="select" data-admin-filter aria-label="Lọc theo trạng thái"><option value="">Tất cả trạng thái</option></select>
        <button class="btn btn-ghost" type="button" data-admin-refresh>Tải lại</button>
        <button class="btn btn-dark" type="button" data-admin-csv>Tải CSV</button>
      </div>
    </div>
    <div class="form-alert" role="alert" data-admin-msg></div>
    <div class="admin-scroll"><table class="admin-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng</th><th>Trạng thái</th></tr></thead><tbody data-admin-orders></tbody></table></div>
    <h2 class="h2" style="margin-top:48px">Yêu cầu tư vấn &amp; đăng ký đối tác</h2>
    <div class="admin-scroll"><table class="admin-table"><thead><tr><th>Ngày</th><th>Loại</th><th>Liên hệ</th><th>Doanh nghiệp / quan tâm</th><th>Nội dung</th></tr></thead><tbody data-admin-leads></tbody></table></div>
  </section>
</main>
<script>window.__ORDER_ENDPOINT__=${JSON.stringify(cfg.orderEndpoint || '')};</script>
<script src="${u('/js/admin.js')}" defer></script>
</body>
</html>`;
}

module.exports = { page, postPage, eventPage, productPage, cartPage, checkoutPage, successPage, notFound, adminShell, staticAdminPage, publicProduct, vnd, esc, abs, u };
