const cfg = require('./config');
const { icon } = require('./icons');
const { products, bySlug, publicProduct } = require('./products');

const DEV = process.env.NODE_ENV !== 'production';
const BASE = process.env.BASE_PATH || '';
const u = path => {
  if (!path) return BASE ? `${BASE}/` : '/';
  if (path.startsWith('http') || path.startsWith('#') || path.startsWith('tel:') || path.startsWith('mailto:') || path.startsWith('data:')) return path;
  if (path.startsWith('//')) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${clean}`;
};
// URL tuyệt đối (canonical, og, JSON-LD, sitemap) — luôn gồm BASE_PATH.
const abs = path => cfg.siteUrl + u(path);

const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vnd = n => Number(n).toLocaleString('vi-VN').replace(/,/g, '.') + '₫';
const todo = (label = 'Cần bổ sung') => `<span class="todo">${esc(label)}</span>`;
const verify = flag => (flag && DEV ? ' ' + todo('cần xác nhận') : '');
const C = cfg.company;

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */
function layout({ title, desc, path = '/', body, jsonld = [], ogImage = '/img/og-default.jpg', bodyClass = '', noindex = false }) {
  const fullTitle = title ? `${title} | the.Meal` : 'the.Meal — Nhẫn & cân thông minh chăm sóc sức khoẻ';
  const url = abs(path);
  const description = desc || 'the.Meal — hệ sinh thái thiết bị chăm sóc sức khoẻ cho người Việt: nhẫn thông minh Meal Ring Active, Active Pro và cân thông minh Meal Fit Insight. Đồng bộ app the Meal, AI gợi ý cá nhân hoá.';
  const navItems = [
    [u('/'), 'Trang chủ'], [u('/san-pham'), 'Sản phẩm'], [u('/#he-sinh-thai'), 'App the Meal'],
    [u('/hop-tac'), 'Hợp tác đại lý'], [u('/tin-tuc'), 'Tin tức'], [u('/lien-he'), 'Liên hệ']
  ];
  const orgLd = {
    '@context': 'https://schema.org', '@type': 'Organization', name: C.name, url: abs('/'),
    email: C.email, telephone: C.hotlineRaw, address: { '@type': 'PostalAddress', streetAddress: C.address, addressCountry: 'VN' },
    sameAs: C.socials.map(x => x.url)
  };
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website"><meta property="og:locale" content="vi_VN"><meta property="og:site_name" content="the.Meal">
<meta property="og:title" content="${esc(fullTitle)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(abs(ogImage))}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0B1C3A">
<link rel="icon" href="${u('/favicon.svg')}" type="image/svg+xml">
<link rel="preload" href="${u('/fonts/be-vietnam-pro-vietnamese-800-normal.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${u('/css/style.css')}">
<script type="application/ld+json">${JSON.stringify([orgLd, ...jsonld]).replace(/</g, '\\u003c')}</script>
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Bỏ qua đến nội dung chính</a>
<div class="topbar"><div class="wrap">
  <span>${icon('phone')} Hotline tư vấn: <a href="tel:${C.hotlineRaw}">${C.hotline}</a></span>
  <span>${icon('package')} Thanh toán khi nhận hàng (COD)</span>
  <span>${icon('shield')} Chứng nhận CE · FCC · RoHS</span>
</div></div>
<header class="header" id="top">
  <div class="wrap">
    <a class="logo" href="${u('/')}" aria-label="The.Meal — trang chủ">The<b>.</b>Meal</a>
    <nav class="nav" id="nav" aria-label="Điều hướng chính">
      ${navItems.map(([h, t]) => `<a href="${h}"${(h === u(path) || (path === '/' && h === u('/'))) ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
    </nav>
    <div class="h-actions">
      <a class="icon-btn" href="${u('/gio-hang')}" aria-label="Giỏ hàng">${icon('cart')}<span class="cart-count" data-cart-count data-n="0">0</span></a>
      <a class="btn btn-primary" href="${u('/san-pham')}" style="min-height:44px;padding:10px 20px">Mua ngay</a>
      <button class="icon-btn menu-btn" id="menuBtn" aria-controls="nav" aria-expanded="false" aria-label="Mở menu">${icon('menu')}</button>
    </div>
  </div>
</header>
<main id="main">
${body}
</main>
${footer()}
<div class="fab" aria-label="Liên hệ nhanh">
  <a class="zalo" href="${esc(C.zalo)}" target="_blank" rel="noopener" aria-label="Chat Zalo với the.Meal">Zalo</a>
  <a class="call" href="tel:${C.hotlineRaw}" aria-label="Gọi hotline ${C.hotline}">${icon('phone')}</a>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script>
window.__BASE__=${JSON.stringify(BASE)};
window.__ORDER_ENDPOINT__=${JSON.stringify(cfg.orderEndpoint || '')};
window.__PRODUCTS__=${JSON.stringify(products.map(p => {
  const pub = publicProduct(p);
  pub.image = u(pub.image);
  return pub;
})).replace(/</g, '\\u003c')};
</script>
<script src="${u('/js/app.js')}" defer></script>
</body>
</html>`;
}

function footer() {
  const social = C.socials.filter((x, i, a) => a.findIndex(y => y.icon === x.icon) === i).map(x => [x.url, x.icon, x.label]);
  return `<footer class="footer">
  <div class="wrap">
    <div class="f-grid">
      <div>
        <a class="logo" href="${u('/')}" style="font-size:28px">The<b>.</b>Meal</a>
        <p style="margin-top:14px">Hệ sinh thái chăm sóc sức khoẻ chủ động &amp; toàn diện dành cho người Việt — ăn đúng, vận động đủ, ngủ sâu và sống khoẻ mỗi ngày.</p>
        <div class="socials">${social.map(([h, i, l]) => `<a href="${esc(h)}" target="_blank" rel="noopener" aria-label="${l}">${icon(i)}</a>`).join('')}</div>
      </div>
      <div>
        <h3>Sản phẩm</h3>
        <ul>${products.map(p => `<li><a href="${u('/san-pham/' + p.slug)}">${p.name}</a></li>`).join('')}
        <li><a href="${u('/#chon-size')}">Hướng dẫn chọn size</a></li><li><a href="${u('/hop-tac')}">Hợp tác đại lý</a></li></ul>
      </div>
      <div>
        <h3>Chính sách</h3>
        <ul>${POLICIES.map(p => `<li><a href="${u('/chinh-sach/' + p.slug)}">${p.title}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h3>Liên hệ</h3>
        <ul>
          <li>${C.name}</li>
          <li>${esc(C.address)}</li>
          <li><a href="tel:${C.hotlineRaw}">Hotline: ${C.hotline}</a></li>
          <li><a href="mailto:${C.email}">${C.email}</a></li>
          <li>MST: ${C.taxCode ? esc(C.taxCode) : todo()}</li>
        </ul>
      </div>
    </div>
    <div class="f-bottom">
      <span>© ${new Date().getFullYear()} ${C.name}. Mọi quyền được bảo lưu.</span>
      <span>Sản phẩm không phải thiết bị y tế, không thay thế chẩn đoán của bác sĩ.</span>
    </div>
  </div>
</footer>`;
}

/* ------------------------------------------------------------------ */
/* Partials                                                            */
/* ------------------------------------------------------------------ */
function productCard(p, headingTag = 'h3') {
  const needsOptions = p.sizes.length > 0;
  return `<article class="p-card reveal${p.featured ? ' featured' : ''}">
    <div class="p-media${p.dark ? '' : ' light'}">
      ${p.badge ? `<span class="badge${p.featured ? '' : ' dark'}">${esc(p.badge)}</span>` : ''}
      <img src="${u(p.image)}" alt="${esc(p.gallery[0].alt)}" width="720" height="720" loading="lazy">
    </div>
    <div class="p-body">
      <span class="p-cat">${esc(p.category)}</span>
      <${headingTag} class="p-name"><a href="${u('/san-pham/' + p.slug)}">${esc(p.name)}</a></${headingTag}>
      <p class="p-tag">${esc(p.tagline)}</p>
      <ul class="p-specs">${p.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
      <div class="p-foot">
        <span class="price">${vnd(p.price)}</span>
        ${needsOptions
          ? `<a class="btn btn-dark" href="${u('/san-pham/' + p.slug)}#chon-tuy-chon">Chọn size ${icon('arrow')}</a>`
          : `<button class="btn btn-primary" data-quick-add="${p.id}" data-color="${p.colors[0].id}">${icon('cart')} Thêm vào giỏ</button>`}
      </div>
    </div>
  </article>`;
}

function compareTable() {
  const a = bySlug['meal-ring-active'], b = bySlug['meal-ring-active-pro'];
  const rows = [
    ['Giá', vnd(a.price), vnd(b.price)],
    ['Chất liệu', 'Thép không gỉ', 'Hợp kim titan'],
    ['Trọng lượng', '2.7g', '3g'],
    ['Chip / cảm biến', 'Tiêu chuẩn', 'Nordic nRF54L15 · GOODiX + 6 trục'],
    ['Nhịp tim · SpO₂ · Giấc ngủ · HRV', '<span class="yes">✓ Có</span>', '<span class="yes">✓ Có</span>'],
    ['Nhiệt độ cơ thể · Vận động', '<span class="yes">✓ Có</span>', '<span class="yes">✓ Có</span>'],
    ['AI phân tích & gợi ý', 'Gợi ý cải thiện thói quen', 'Phân tích toàn diện, khuyến nghị dinh dưỡng & cảnh báo sớm'],
    ['Chống nước · Pin', '5ATM · 5–7 ngày', '5ATM · 5–7 ngày'],
    ['Phù hợp', 'Bắt đầu sống khoẻ, thích gọn nhẹ', 'Theo dõi toàn diện, quà tặng cao cấp']
  ];
  return `<div class="compare-wrap reveal"><table class="compare">
    <caption class="sr-only">So sánh Meal Ring Active và Meal Ring Active Pro</caption>
    <thead><tr><th scope="col">Tiêu chí</th><th scope="col">Meal Ring Active</th><th scope="col" class="pro">Meal Ring Active Pro</th></tr></thead>
    <tbody>${rows.map(r => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td><td class="pro">${r[2]}</td></tr>`).join('')}
    <tr><th scope="row"></th><td><a class="link" href="${u('/san-pham/' + a.slug)}">Xem Active ${icon('arrow')}</a></td><td class="pro"><a class="link" href="${u('/san-pham/' + b.slug)}">Xem Active Pro ${icon('arrow')}</a></td></tr>
    </tbody></table></div>`;
}

const SIZE_TABLE = [['7', '17.9', '55'], ['8', '18.3', '57.5'], ['9', '19.2', '60'], ['10', '20.0', '62.8'], ['11', '20.9', '65.4'], ['12', '21.6', '67.8']];
function sizeGuide(compact = false) {
  const steps = [
    ['Chuẩn bị dây đo', 'Một dải giấy hoặc sợi dây không co giãn, quấn quanh ngón tay bạn muốn đeo nhẫn.'],
    ['Quấn vừa khít', 'Ôm vừa khít ngón tay — không quá chặt, không quá lỏng.'],
    ['Đánh dấu điểm giao', 'Đánh dấu nơi hai đầu giấy (hoặc dây) giao nhau.'],
    ['Đo chiều dài', 'Trải phẳng, đo từ đầu đến điểm đánh dấu — đó là chu vi ngón tay.']
  ];
  return `<div class="split" style="align-items:start">
    <div>
      ${compact ? '' : `<span class="eyebrow">Hướng dẫn chọn size</span><h2 class="h2">Đo size nhẫn tại nhà <span class="hl">trong 2 phút.</span></h2>`}
      <ol class="steps">${steps.map(s => `<li><div><b>${s[0]}</b><br><span class="muted">${s[1]}</span></div></li>`).join('')}</ol>
      <p class="hint">${icon('alert')} Nên đo 2–3 lần và lấy trung bình; đo ở vị trí to nhất của ngón tay để dễ đeo/tháo.</p>
      <div class="size-pics">${[1, 2, 3, 4].map(i => `<img src="${u(`/img/size-${i}.webp`)}" alt="Bước ${i}: ${steps[i - 1][0]}" width="320" height="316" loading="lazy" style="border-radius:12px">`).join('')}</div>
    </div>
    <div>
      <table class="size-table">
        <caption class="sr-only">Bảng quy đổi size nhẫn</caption>
        <thead><tr><th scope="col">Size nhẫn</th><th scope="col">Đường kính trong (mm)</th><th scope="col">Chu vi ngón tay (mm)</th></tr></thead>
        <tbody>${SIZE_TABLE.map(r => `<tr><td><b>Size ${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody>
      </table>
      <p class="hint" style="margin-top:12px">Chu vi = độ dài dây đo được ở bước 4. Nếu nằm giữa hai size, hãy chọn size lớn hơn hoặc gọi <a href="tel:${C.hotlineRaw}" class="link" style="min-height:0">${C.hotline}</a> để được tư vấn.</p>
    </div>
  </div>`;
}

function certs() {
  const list = [
    ['CE', 'CE-RED', 'Chứng nhận thiết bị vô tuyến đạt chuẩn để lưu hành tại châu Âu.'],
    ['FCC', 'FCC', 'Không gây nhiễu sóng vượt mức theo tiêu chuẩn Hoa Kỳ.'],
    ['RoHS', 'RoHS', 'Hạn chế các chất độc hại (thuỷ ngân, chì…) trong thiết bị điện tử.'],
    ['ISO', 'ISO 9001', 'Hệ thống quản lý chất lượng (cân Meal Fit Insight).']
  ];
  return list.map(c => `<div class="cert reveal"><div class="seal" aria-hidden="true">${c[0]}</div><h3>${c[1]}</h3><p>${c[2]}</p></div>`).join('');
}

const FAQS = [
  ['Meal Ring Active và Active Pro khác nhau thế nào?', 'Cả hai cùng đo nhịp tim, SpO₂, giấc ngủ, HRV, nhiệt độ cơ thể và vận động 24/7. Active Pro làm từ hợp kim titan, dùng chip Nordic nRF54L15 cùng cảm biến GOODiX + 6 trục, và được AI phân tích toàn diện hơn: khuyến nghị dinh dưỡng, lối sống và cảnh báo sớm khi có dấu hiệu bất thường.'],
  ['Nhẫn có chống nước không? Pin dùng được bao lâu?', 'Cả hai phiên bản đạt chuẩn chống nước 5ATM (~50m), có thể đeo khi rửa tay, tắm hay đi mưa. Mỗi lần sạc dùng được khoảng 5–7 ngày tuỳ tần suất đo.'],
  ['Làm sao để chọn đúng size nhẫn?', `Nhẫn có size 7 đến 12. Bạn có thể tự đo chu vi ngón tay bằng một dải giấy và đối chiếu bảng quy đổi ở mục <a href="${u('/#chon-size')}">Hướng dẫn chọn size</a>, hoặc gọi hotline để được tư vấn.`],
  ['Thiết bị dùng với ứng dụng nào?', 'Nhẫn Meal Ring và cân Meal Fit Insight đồng bộ qua Bluetooth với ứng dụng the Meal trên Android và iOS. Mọi chỉ số được gom về một nơi, AI chấm điểm và gợi ý hành động mỗi ngày.'],
  ['Cả gia đình có dùng chung cân Meal Fit Insight được không?', 'Được. Cân tự bật và nhận diện người dùng, hỗ trợ nhiều thành viên. Tải trọng tối đa 180kg.'],
  ['Kết quả đo có thay thế được thiết bị y tế không?', 'Không. Sản phẩm giúp bạn theo dõi xu hướng sức khoẻ; mọi gợi ý từ AI chỉ mang tính tham khảo, không thay thế tư vấn dinh dưỡng hoặc chẩn đoán y khoa.'],
  ['Tôi là chủ phòng tập / nhà thuốc / cửa hàng healthy, có thể hợp tác phân phối không?', `Có. the.Meal tìm kiếm đối tác phân phối và tích hợp giải pháp trọn gói (thiết bị + app + khoá học). Đăng ký tại trang <a href="${u('/hop-tac')}">Hợp tác đại lý</a>, đội ngũ sẽ liên hệ và gửi chính sách hợp tác chi tiết.`],
  ['Tôi có thể thanh toán bằng cách nào?', 'Bạn có thể thanh toán khi nhận hàng (COD) hoặc chuyển khoản ngân hàng. Sau khi đặt, nhân viên the.Meal sẽ gọi xác nhận đơn.']
];
function faq() {
  return `<div class="faq">${FAQS.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${f[0]}</summary><div class="ans">${f[1]}</div></details>`).join('')}</div>`;
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */
function home() {
  const A = bySlug['meal-ring-active'], P = bySlug['meal-ring-active-pro'], S = bySlug['meal-fit-insight'];
  const chip = (cls, ic, b, s) => `<div class="chip-float ${cls}" aria-hidden="true"><span class="ic">${icon(ic)}</span><span><b>${b}</b><small>${s}</small></span></div>`;
  const slide = (p, theme, { eyebrow, title, lead, chips, h = 'h2', note }) => `
  <div class="slide slide--${theme}${theme === 'navy' ? ' on-dark' : ''}" role="group" aria-roledescription="slide" aria-label="${esc(p.name)}" data-theme="${theme}">
    <div class="wrap">
      <div>
        <span class="eyebrow">${eyebrow}</span>
        <${h} class="h-display">${title}</${h}>
        <p class="lead">${lead}</p>
        <div class="price-row"><span class="price">${vnd(p.price)}</span><span class="price-note">${note}</span></div>
        <div class="hero-ctas">
          <a class="btn btn-primary" href="${u('/san-pham/' + p.slug)}">Mua ${esc(p.name)} ${icon('arrow')}</a>
          <a class="link" href="${u('/san-pham/' + p.slug)}#thong-tin">Xem thông số</a>
        </div>
        <div class="trust-mini">
          <span>${icon('shield')} CE · FCC · RoHS</span><span>${icon('package')} Thanh toán COD</span><span>${icon('phone')} Tư vấn ${C.hotline}</span>
        </div>
      </div>
      <div class="visual">
        <span class="ring-dash" aria-hidden="true"></span>
        <div class="orb"><img src="${u(p.image)}" alt="${esc(p.gallery[0].alt)}" width="720" height="720"${h === 'h1' ? ' fetchpriority="high"' : ' loading="lazy"'}></div>
        ${chips.map(c => chip(...c)).join('')}
      </div>
    </div>
  </div>`;

  const body = `
<section class="hero" aria-roledescription="carousel" aria-label="Sản phẩm nổi bật" id="hero">
  <div class="slides" id="slides" aria-live="off">
    ${slide(A, 'cream', { h: 'h1', eyebrow: 'Meal Ring Active · Nhẫn thông minh',
      title: 'Hiểu cơ thể mình, <span class="hl">ngay trên ngón tay.</span>',
      lead: 'Đo nhịp tim, SpO₂, giấc ngủ, HRV và thân nhiệt liên tục 24/7 — nặng chỉ 2.7g, chống nước 5ATM, pin 5–7 ngày.',
      note: 'Size 7–12 · Đen / Bạc',
      chips: [['cf-1', 'heart', 'Nhịp tim', 'Liên tục 24/7'], ['cf-2', 'moon', 'Giấc ngủ', 'Chấm điểm mỗi đêm'], ['cf-3', 'droplet', 'SpO₂', 'Oxy trong máu']] })}
    ${slide(P, 'navy', { eyebrow: 'Meal Ring Active Pro · Cao cấp',
      title: 'Theo dõi sâu hơn. <span class="hl">Cảnh báo sớm hơn.</span>',
      lead: 'Hợp kim titan 3g, chip Nordic nRF54L15 và AI the Meal phân tích toàn diện — khuyến nghị dinh dưỡng, lối sống mỗi ngày.',
      note: 'Bản titan · Size 7–12',
      chips: [['cf-1', 'sparkles', 'AI hỗ trợ', 'Gợi ý cá nhân hoá'], ['cf-2', 'activity', 'HRV', 'Cân bằng căng thẳng'], ['cf-3', 'thermometer', 'Thân nhiệt', 'Theo dõi xu hướng']] })}
    ${slide(S, 'mint', { eyebrow: 'Meal Fit Insight · Cân thông minh',
      title: 'Một bước lên cân, <span class="hl">đọc vị 40+ chỉ số.</span>',
      lead: '8 điện cực công nghệ BIA đo mỡ nội tạng, cơ bắp, nước, tuổi sinh học… và đồng bộ tức thì với app the Meal.',
      note: 'Tải tối đa 180kg · Cả gia đình',
      chips: [['cf-1', 'gauge', '40+ chỉ số', 'Thành phần cơ thể'], ['cf-2', 'users', 'Nhiều thành viên', 'Tự nhận diện'], ['cf-3', 'bluetooth', 'Bluetooth 5.0', 'Đồng bộ tức thì']] })}
  </div>
  <div class="hero-ctrl">
    <button class="pause-btn" id="heroPause" aria-label="Tạm dừng trình chiếu">${icon('pause')}</button>
    ${[A, P, S].map((p, i) => `<button class="dot" data-go="${i}" aria-label="Xem ${esc(p.name)}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('')}
  </div>
</section>

<div class="trust-strip"><div class="wrap">
  <div class="ts"><span class="ic">${icon('shield')}</span><span><b>Chứng nhận quốc tế</b>CE-RED · FCC · RoHS</span></div>
  <div class="ts"><span class="ic">${icon('sparkles')}</span><span><b>AI the Meal</b>Gợi ý cá nhân hoá mỗi ngày</span></div>
  <div class="ts"><span class="ic">${icon('package')}</span><span><b>Thanh toán COD</b>Nhận hàng rồi trả tiền</span></div>
  <div class="ts"><span class="ic">${icon('phone')}</span><span><b>Tư vấn tận tâm</b>Hotline ${C.hotline}</span></div>
</div></div>

<section class="section section--white" id="van-de">
  <div class="wrap">
    <div class="sec-head center">
      <span class="eyebrow">Dành cho người bận rộn</span>
      <h2 class="h2">Muốn sống khoẻ chủ động, <span class="hl">nhưng không có thời gian?</span></h2>
      <p class="lead">Eat clean, tập gym, yoga, chạy bộ… bạn đã cố gắng. the.Meal giúp mọi nỗ lực đó được đo lường, được đồng hành và có cơ sở khoa học.</p>
    </div>
    <div class="grid g-3">
      ${[['hourglass', 'Không có thời gian theo dõi cơ thể', 'Lịch làm việc kín, khó ghi chép giấc ngủ, vận động, cân nặng mỗi ngày.', 'Nhẫn đo tự động 24/7, cân đọc 40+ chỉ số trong một bước — mọi thứ tự đồng bộ về app, không cần nhập tay.'],
         ['repeat', 'Thử nhiều cách nhưng dễ bỏ cuộc', 'Thiếu người đồng hành nên khó duy trì thói quen lâu dài.', 'App the Meal gợi ý micro-habit mỗi tuần, đo lại kết quả và cập nhật Điểm Sức Khoẻ để bạn thấy mình tiến bộ.'],
         ['book', 'Thiếu kiến thức khoa học', 'Thông tin trên mạng nhiều nhưng khó biết điều gì đúng với cơ thể mình.', 'AI diễn giải chỉ số thành lời khuyên dễ hiểu, cùng kho kiến thức dinh dưỡng & thể chất từ cộng đồng the Meal.']]
        .map(c => `<article class="pain reveal"><span class="pain-ic">${icon(c[0])}</span><h3>${c[1]}</h3><p class="muted">${c[2]}</p><div class="fix">${icon('checkCircle')}<span>${c[3]}</span></div></article>`).join('')}
    </div>
  </div>
</section>

<section class="section" id="san-pham">
  <div class="wrap">
    <div class="sec-head center">
      <span class="eyebrow">Hệ sinh thái thiết bị the.Meal</span>
      <h2 class="h2">Chọn thiết bị <span class="hl">phù hợp với bạn</span></h2>
      <p class="lead">Hai dòng nhẫn thông minh theo dõi 24/7 và một chiếc cân phân tích thành phần cơ thể — cùng chuẩn hoá dữ liệu trên một ứng dụng duy nhất.</p>
    </div>
    <div class="grid g-3">${products.map(p => productCard(p)).join('')}</div>
  </div>
</section>

<section class="section section--white" id="chi-so">
  <div class="wrap split">
    <div>
      <span class="eyebrow">Meal Ring theo dõi 24/7</span>
      <h2 class="h2">6 chỉ số quan trọng, <span class="hl">đo tự động không bỏ sót.</span></h2>
      <p class="lead">Chỉ cần đeo nhẫn — Meal Ring ghi nhận liên tục cả ngày lẫn đêm và đồng bộ về app, không cần nhập tay.</p>
      <div class="grid g-2" style="gap:14px;margin-top:28px">
        ${P.metrics.map((m, i) => `<div class="metric reveal"><span class="num">0${i + 1}</span><div><h3>${m[0]}</h3><p>${m[1]}</p></div></div>`).join('')}
      </div>
    </div>
    <div class="split-media reveal" style="max-width:420px;justify-self:center;border-radius:32px">
      <video src="${u('/img/ring-measure.mp4')}" poster="${u('/img/ring-measure-poster.jpg')}" autoplay muted loop playsinline preload="metadata" aria-label="Video nhẫn Meal Ring đang đo trên ngón tay" style="width:100%;aspect-ratio:9/16;object-fit:cover"></video>
    </div>
  </div>
</section>

<section class="section section--navy on-dark" id="he-sinh-thai">
  <div class="wrap">
    <div class="sec-head center">
      <span class="eyebrow">Ứng dụng the Meal</span>
      <h2 class="h2">Một vòng lặp khép kín, <span class="hl">cải thiện mỗi ngày.</span></h2>
      <p class="lead">the Meal biến chỉ số từ thiết bị thành insight dễ hiểu và một hành động nhỏ mỗi ngày — rồi đo lại kết quả, liên tục cải thiện.</p>
    </div>
    <div class="loop">
      ${[['Bước 1', 'Ghi nhận', 'Thiết bị đo chỉ số cơ thể liên tục, tự động đồng bộ về app.'],
         ['Bước 2', 'Phân tích', 'AI chuẩn hoá dữ liệu thành biểu đồ trực quan và Điểm Sức Khoẻ theo ngày, tuần, tháng.'],
         ['Bước 3', 'Tư vấn', 'Gợi ý & cảnh báo cá nhân hoá, dễ hiểu, đúng lúc bạn cần.'],
         ['Bước 4', 'Hành động', 'Micro-habit & kế hoạch mỗi tuần, đo lại kết quả và bắt đầu chu kỳ mới.']]
        .map(s => `<div class="loop-step reveal"><span class="k">${s[0]}</span><h3>${s[1]}</h3><p>${s[2]}</p></div>`).join('')}
    </div>
    <div class="phones" tabindex="0" aria-label="Ảnh màn hình ứng dụng the Meal">
      ${[['app-sleep', 'Điểm giấc ngủ'], ['app-hrv', 'Biến thiên nhịp tim'], ['app-ai', 'AI đánh giá tổng quan'], ['app-next', 'Gợi ý bước tiếp theo'], ['app-spo2', 'SpO₂ trong ngày'], ['app-family', 'Sức khoẻ cả nhà']]
        .map(([f, c]) => `<figure class="phone reveal"><img src="${u(`/img/${f}.webp`)}" alt="Màn hình app the Meal: ${c}" width="560" height="1200" loading="lazy"><figcaption>${c}</figcaption></figure>`).join('')}
    </div>
    <p class="center" style="color:#9FB0CC;font-size:14px;margin-top:20px">Mọi gợi ý từ AI chỉ mang tính tham khảo, không thay thế tư vấn dinh dưỡng hoặc y khoa chuyên môn.</p>
  </div>
</section>

<section class="section section--white" id="kien-thuc">
  <div class="wrap split">
    <div>
      <span class="eyebrow">Thiết bị + App + Kiến thức</span>
      <h2 class="h2">Không chỉ đo — <span class="hl">hiểu và làm đúng.</span></h2>
      <p class="lead">Nâng cao kiến thức dinh dưỡng và thể chất cùng các kênh nội dung và cộng đồng của the Meal: video, sách, mẹo ăn uống và nhóm thảo luận cùng hàng nghìn người cùng mục tiêu.</p>
      <a class="btn btn-primary" href="${C.socials[2].url}" target="_blank" rel="noopener">${icon('youtube')} Xem kênh YouTube the Meal</a>
    </div>
    <ul class="channels">
      ${[...C.socials.filter(x => x.icon === 'youtube'), ...C.communities].map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener"><span class="ic">${icon(x.icon)}</span><span><b>${esc(x.label)}</b><small>${esc(x.note || 'YouTube')}</small></span>${icon('arrow')}</a></li>`).join('')}
    </ul>
  </div>
</section>

<section class="section" id="so-sanh">
  <div class="wrap">
    <div class="sec-head center">
      <span class="eyebrow">So sánh nhanh</span>
      <h2 class="h2">Active hay Active Pro?</h2>
      <p class="lead">Cùng đo đầy đủ 6 chỉ số 24/7. Khác biệt nằm ở chất liệu, chip cảm biến và độ sâu phân tích của AI.</p>
    </div>
    ${compareTable()}
  </div>
</section>

<section class="section section--mint" id="can-thong-minh">
  <div class="wrap split rev">
    <div class="split-media reveal"><img src="${u('/img/scale-stand.webp')}" alt="Người dùng đứng trên cân Meal Fit Insight" width="1000" height="1000" loading="lazy"></div>
    <div>
      <span class="eyebrow">Meal Fit Insight · Cân thông minh</span>
      <h2 class="h2">Thành phần cơ thể, <span class="hl">chính xác &amp; khoa học.</span></h2>
      <p class="lead">${esc(S.summary)}</p>
      <ul class="check-list">${S.benefits.map(b => `<li>${icon('checkCircle')}<span>${esc(b)}</span></li>`).join('')}</ul>
      <div class="price-row" style="margin-bottom:20px"><span class="price">${vnd(S.price)}</span><span class="price-note">Model CF586 · Màu đen</span></div>
      <div class="hero-ctas">
        <button class="btn btn-primary" data-quick-add="${S.id}" data-color="den">${icon('cart')} Thêm vào giỏ</button>
        <a class="link" href="${u('/san-pham/' + S.slug)}">Xem chi tiết ${icon('arrow')}</a>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow">Nhật ký the.Meal</span>
      <h2 class="h2">Đeo mọi lúc, <span class="hl">đo mọi nơi.</span></h2>
    </div>
    <div class="life">
      <figure class="reveal"><img src="${u('/img/life-badminton.webp')}" alt="Chơi cầu lông khi đeo nhẫn Meal Ring màu bạc" loading="lazy"><figcaption>Khi chơi thể thao</figcaption></figure>
      <figure class="reveal"><img src="${u('/img/life-bottle.webp')}" alt="Đeo nhẫn màu đen khi tập luyện" loading="lazy"><figcaption>Tập luyện</figcaption></figure>
      <figure class="reveal"><img src="${u('/img/scale-room.webp')}" alt="Đo thành phần cơ thể tại phòng khách" loading="lazy"><figcaption>Tại nhà</figcaption></figure>
      <figure class="reveal"><img src="${u('/img/life-wrist.webp')}" alt="Nhẫn màu bạc trên tay" loading="lazy"><figcaption>Đi làm</figcaption></figure>
      <figure class="reveal"><img src="${u('/img/scale-handle.webp')}" alt="Cầm tay cầm điện cực của cân" loading="lazy"><figcaption>Đo 8 điện cực</figcaption></figure>
    </div>
  </div>
</section>

<section class="section section--white" id="chon-size">
  <div class="wrap">${sizeGuide()}</div>
</section>

<section class="section" id="chung-nhan">
  <div class="wrap">
    <div class="sec-head center">
      <span class="eyebrow">An tâm sử dụng</span>
      <h2 class="h2">Đạt chuẩn chứng nhận quốc tế</h2>
    </div>
    <div class="grid g-4">${certs()}</div>
  </div>
</section>

<section class="section section--white" id="danh-gia">
  <div class="wrap">
    <div class="sec-head center">
      <span class="eyebrow">Khách hàng nói gì</span>
      <h2 class="h2">Đánh giá từ người dùng thật</h2>
    </div>
    <div class="empty">
      ${icon('star')}
      <h3 class="h3">Đánh giá đang được cập nhật</h3>
      <p class="muted">Chúng tôi chỉ đăng phản hồi thật từ khách hàng đã mua. ${DEV ? todo('Gửi đánh giá + ảnh khách hàng để hiển thị tại đây') : ''}</p>
    </div>
  </div>
</section>

<section class="section section--navy on-dark" id="doi-tac">
  <div class="wrap split">
    <div>
      <span class="eyebrow">Dành cho doanh nghiệp &amp; đối tác</span>
      <h2 class="h2">Mở rộng danh mục kinh doanh với <span class="hl">giải pháp sức khoẻ trọn gói.</span></h2>
      <p class="lead">Thiết bị + App + Khoá học đồng bộ trong một hệ sinh thái — dành cho nhà phân phối, phòng tập Gym/Yoga, nhà thuốc, cửa hàng healthy và chuyên gia dinh dưỡng có cộng đồng riêng.</p>
      <div class="hero-ctas"><a class="btn btn-primary" href="${u('/hop-tac')}">Đăng ký làm đối tác ${icon('arrow')}</a><a class="link" href="${u('/hop-tac#chinh-sach')}">Xem quyền lợi</a></div>
    </div>
    <ul class="p-specs partner-chips">${PARTNER_TYPES.map(t => `<li>${icon(t[0])}${t[1]}</li>`).join('')}</ul>
  </div>
</section>

<section class="section" id="faq">
  <div class="wrap">
    <div class="sec-head center">
      <span class="eyebrow">Câu hỏi thường gặp</span>
      <h2 class="h2">Bạn còn băn khoăn?</h2>
    </div>
    ${faq()}
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="final on-dark reveal">
      <div>
        <span class="eyebrow">Bắt đầu hành trình sống khoẻ</span>
        <h2 class="h2" style="margin-top:12px">Ăn đúng, vận động đủ, ngủ sâu — <span class="hl">bắt đầu từ hôm nay.</span></h2>
        <p class="lead">Đặt hàng online, thanh toán khi nhận hàng. Nhân viên the.Meal sẽ gọi xác nhận và tư vấn size miễn phí.</p>
        <div class="hero-ctas"><a class="btn btn-primary" href="${u('/san-pham')}">Chọn sản phẩm ${icon('arrow')}</a><a class="btn btn-ghost" href="tel:${C.hotlineRaw}">${icon('phone')} ${C.hotline}</a></div>
      </div>
      <div class="mini-prods" aria-hidden="true">
        <img src="${u('/img/ring-active.webp')}" alt="" loading="lazy"><img src="${u('/img/ring-pro.webp')}" alt="" loading="lazy"><img src="${u('/img/scale.webp')}" alt="" loading="lazy" style="background:#fff">
      </div>
    </div>
  </div>
</section>`;
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1].replace(/<[^>]+>/g, '') } })) };
  return layout({ path: '/', body, jsonld: [faqLd, ...products.map(productLd)] });
}

function productLd(p) {
  return {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.summary,
    image: p.gallery.filter(g => g.src).map(g => abs(g.src)), brand: { '@type': 'Brand', name: 'the.Meal' }, sku: p.id,
    offers: { '@type': 'Offer', priceCurrency: 'VND', price: p.price, availability: 'https://schema.org/InStock', url: abs(`/san-pham/${p.slug}`) }
  };
}

function productList() {
  const body = `
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${u('/')}">Trang chủ</a></li><li aria-current="page">Sản phẩm</li></ol></nav>
  <div class="page-head sec-head">
    <span class="eyebrow">Cửa hàng the.Meal</span>
    <h1 class="h1">Thiết bị chăm sóc sức khoẻ</h1>
    <p class="lead">Nhẫn thông minh và cân thông minh — đồng bộ một ứng dụng the Meal, AI gợi ý cá nhân hoá mỗi ngày.</p>
  </div>
  <div class="grid g-3" style="margin-bottom:72px">${products.map(p => productCard(p, 'h2')).join('')}</div>
  <div class="sec-head"><h2 class="h2">So sánh hai phiên bản nhẫn</h2></div>
  ${compareTable()}
  <div style="height:96px"></div>
</div>`;
  return layout({ title: 'Sản phẩm', path: '/san-pham', body, desc: 'Mua nhẫn thông minh Meal Ring Active, Meal Ring Active Pro và cân thông minh Meal Fit Insight chính hãng the.Meal. Thanh toán COD.' });
}

function productPage(p) {
  const others = products.filter(o => o.id !== p.id);
  const isRing = p.sizes.length > 0;
  const connectSteps = [
    'Tải app the Meal trên CH Play hoặc App Store và cập nhật phiên bản mới nhất.',
    'Bật Bluetooth, cho phép the Meal kết nối với thiết bị ở gần.',
    'Mở app → nút Action Hub (giữa thanh điều hướng) → chọn "Cân nặng" → "Đo bằng cân thông minh".',
    'Chọn "Bắt đầu kết nối", đứng lên cân để kích hoạt và chọn đúng cân.',
    'Giữ nguyên tư thế đến khi số cân ổn định và cân đo xong các chỉ số cơ thể.',
    'Xem báo cáo, lưu lại — dữ liệu nằm ở mục "Sức khỏe" → "Cơ thể".'
  ];
  const ringSteps = ['Tải app the Meal (Android/iOS) và bật Bluetooth.', 'Ghép nối (Pair BLE) nhẫn với app — chỉ mất vài giây.', 'Đeo nhẫn 24/7: dữ liệu tự động đồng bộ mỗi ngày.', 'Xem insight, điểm sức khoẻ và gợi ý hành động trong app.'];
  const body = `
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${u('/')}">Trang chủ</a></li><li><a href="${u('/san-pham')}">Sản phẩm</a></li><li aria-current="page">${esc(p.name)}</li></ol></nav>
  <div class="pd">
    <div class="gallery" data-gallery>
      <div class="g-main${p.dark ? '' : ' light'}" id="gMain"><img src="${u(p.gallery[0].src)}" alt="${esc(p.gallery[0].alt)}" width="720" height="720" fetchpriority="high"></div>
      <div class="g-thumbs" role="group" aria-label="Ảnh sản phẩm">
        ${p.gallery.map((g, i) => `<button type="button" aria-pressed="${i === 0}" aria-label="Xem ảnh ${i + 1}: ${esc(g.alt)}" ${g.video ? `data-video="${u(g.video)}" data-poster="${u(g.poster)}"` : `data-src="${u(g.src)}"`} data-alt="${esc(g.alt)}"><img src="${u(g.video ? g.poster : g.src)}" alt="" loading="lazy" width="76" height="76"></button>`).join('')}
      </div>
    </div>
    <div class="pd-info" id="chon-tuy-chon">
      <span class="eyebrow">${esc(p.category)}</span>
      <h1>${esc(p.name)}</h1>
      <p class="lead" style="font-weight:600;color:var(--navy)">${esc(p.tagline)}</p>
      <div class="price-row" style="margin:6px 0 14px"><span class="price">${vnd(p.price)}</span><span class="price-note">Đã gồm VAT ${DEV ? todo('xác nhận') : ''}</span></div>
      <p class="muted">${esc(p.summary)}</p>
      <ul class="p-specs">${p.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>

      <form id="buyForm" data-id="${p.id}" novalidate>
        <div class="opt">
          <div class="opt-label" id="lblColor">Màu sắc: <span data-color-name style="font-weight:600;margin-right:auto;margin-left:6px">${esc(p.colors[0].name)}</span></div>
          <div class="swatches" role="radiogroup" aria-labelledby="lblColor">
            ${p.colors.map((c, i) => `<button type="button" class="swatch" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-color="${c.id}" data-name="${esc(c.name)}"><i style="background:${c.hex}"></i>${esc(c.name)}</button>`).join('')}
          </div>
        </div>
        ${isRing ? `<div class="opt field" id="sizeField">
          <div class="opt-label"><span id="lblSize">Chọn size nhẫn <span class="req" aria-hidden="true">*</span></span><a href="#tab-size" data-open-tab="size">Hướng dẫn chọn size</a></div>
          <div class="sizes" role="radiogroup" aria-labelledby="lblSize" aria-describedby="sizeErr">
            ${p.sizes.map((s, i) => `<button type="button" class="size-btn" role="radio" aria-checked="false" tabindex="${i === 0 ? 0 : -1}" data-size="${s}">${s}</button>`).join('')}
          </div>
          <p class="err" id="sizeErr" role="alert">${icon('alert')} Vui lòng chọn size nhẫn để tiếp tục. Chưa chắc size? Xem hướng dẫn đo bên dưới.</p>
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
        <span>${icon('phone')} Tư vấn ${C.hotline}</span>
        <span>${icon('refresh')} Hỗ trợ đổi size ${DEV ? todo('xác nhận chính sách') : ''}</span>
      </div>
    </div>
  </div>

  <div class="tabs" id="thong-tin">
    <div class="tablist" role="tablist" aria-label="Thông tin sản phẩm">
      <button role="tab" id="t-overview" aria-controls="tab-overview" aria-selected="true" data-tab="overview">Tổng quan</button>
      <button role="tab" id="t-specs" aria-controls="tab-specs" aria-selected="false" tabindex="-1" data-tab="specs">Thông số kỹ thuật</button>
      ${isRing ? `<button role="tab" id="t-size" aria-controls="tab-size" aria-selected="false" tabindex="-1" data-tab="size">Chọn size</button>` : ''}
      <button role="tab" id="t-guide" aria-controls="tab-guide" aria-selected="false" tabindex="-1" data-tab="guide">Hướng dẫn kết nối</button>
    </div>
    <div class="tabpanel" role="tabpanel" id="tab-overview" aria-labelledby="t-overview">
      <div class="split" style="align-items:start">
        <div>
          <h2 class="h3">Các chỉ số đo lường</h2>
          <div class="grid g-2" style="gap:12px">${p.metrics.map((m, i) => `<div class="metric"><span class="num">0${i + 1}</span><div><h3>${m[0]}</h3><p>${m[1]}</p></div></div>`).join('')}</div>
        </div>
        <div>
          <h2 class="h3">Lợi ích chính</h2>
          <ul class="check-list">${p.benefits.map(b => `<li>${icon('checkCircle')}<span>${esc(b)}</span></li>`).join('')}</ul>
          <h2 class="h3">Dành cho</h2>
          <ul class="p-specs">${p.forWho.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
        </div>
      </div>
    </div>
    <div class="tabpanel" role="tabpanel" id="tab-specs" aria-labelledby="t-specs" hidden>
      <table class="spec-table" style="max-width:720px"><caption class="sr-only">Thông số kỹ thuật ${esc(p.name)}</caption>
      <tbody>${p.specs.map(s => `<tr><th scope="row">${s[0]}</th><td>${esc(s[1])}${verify(s[2])}</td></tr>`).join('')}</tbody></table>
    </div>
    ${isRing ? `<div class="tabpanel" role="tabpanel" id="tab-size" aria-labelledby="t-size" hidden>${sizeGuide(true)}</div>` : ''}
    <div class="tabpanel" role="tabpanel" id="tab-guide" aria-labelledby="t-guide" hidden>
      <ol class="steps" style="max-width:720px">${(isRing ? ringSteps : connectSteps).map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>
    </div>
  </div>

  <section class="section" style="padding-top:24px">
    <h2 class="h2">Có thể bạn quan tâm</h2>
    <div class="grid g-2" style="margin-top:24px">${others.map(o => productCard(o)).join('')}</div>
  </section>
</div>
<div class="sticky-buy" id="stickyBuy" aria-hidden="true">
  <div><div style="font-size:13px;font-weight:600">${esc(p.name)}</div><span class="price">${vnd(p.price)}</span></div>
  <a class="btn btn-primary" href="#chon-tuy-chon" tabindex="-1">Mua ngay</a>
</div>`;
  return layout({ title: `${p.name} — ${p.tagline}`, path: `/san-pham/${p.slug}`, body, desc: `${p.name} giá ${vnd(p.price)}. ${p.summary}`.slice(0, 160), ogImage: `/img/og-${p.slug}.jpg`, jsonld: [productLd(p)], bodyClass: 'has-sticky' });
}

function cartPage() {
  const body = `
<div class="wrap">
  <div class="page-head"><h1 class="h1">Giỏ hàng</h1></div>
  <div class="stepper" aria-label="Tiến trình đặt hàng"><span class="on"><i>1</i>Giỏ hàng</span><span class="sep"></span><span><i>2</i>Thông tin &amp; thanh toán</span><span class="sep"></span><span><i>3</i>Hoàn tất</span></div>
  <div id="cartRoot" class="cart-layout" aria-live="polite"><p class="muted">Đang tải giỏ hàng…</p></div>
</div>`;
  return layout({ title: 'Giỏ hàng', path: '/gio-hang', body, noindex: true });
}

function checkoutPage() {
  const shipText = cfg.shippingFee == null ? 'Xác nhận khi gọi chốt đơn' : (cfg.shippingFee === 0 ? 'Miễn phí' : vnd(cfg.shippingFee));
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
      <p class="hint center" style="margin:0">Bằng việc đặt hàng, bạn đồng ý với <a href="${u('/chinh-sach/bao-mat')}">Chính sách bảo mật</a> của the.Meal.</p>
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
}

function successPage(order) {
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
    : `<div class="bank" style="grid-template-columns:1fr"><p style="margin:0">Nhân viên the.Meal sẽ gửi thông tin chuyển khoản khi gọi xác nhận đơn. ${DEV ? todo('Cấu hình BANK_BIN, BANK_ACCOUNT, BANK_HOLDER để hiện mã QR') : ''}</p></div>`);
  const body = `
<div class="wrap"><div class="success">
  <div class="stepper" style="justify-content:center" aria-label="Tiến trình đặt hàng"><span class="done"><i>${icon('check')}</i>Giỏ hàng</span><span class="sep"></span><span class="done"><i>${icon('check')}</i>Thông tin</span><span class="sep"></span><span class="on"><i>3</i>Hoàn tất</span></div>
  <div class="tick">${icon('check')}</div>
  <h1 class="h1">Cảm ơn ${esc(order.customer.name)}, đơn hàng đã được ghi nhận!</h1>
  <p class="lead" style="margin-inline:auto">Mã đơn <b>${order.code}</b>. Nhân viên the.Meal sẽ gọi <b>${esc(order.customer.phone)}</b> để xác nhận trong giờ làm việc.</p>
  <div class="order-box">
    <h2 class="h3">Chi tiết đơn hàng</h2>
    ${order.items.map(it => `<div class="mini-line"><img src="${u(it.image)}" alt=""><div><b>${esc(it.name)}</b><br>${esc(it.colorName)}${it.size ? ' · Size ' + esc(it.size) : ''} · SL ${it.qty}</div><b>${vnd(it.price * it.qty)}</b></div>`).join('')}
    <div class="sum-row total"><span>Tổng cộng</span><span>${vnd(order.total)}</span></div>
    <p class="hint">Thanh toán: ${order.payment === 'bank' ? 'Chuyển khoản ngân hàng' : 'Thanh toán khi nhận hàng (COD)'}${order.shipping == null ? ' · Phí vận chuyển sẽ được xác nhận qua điện thoại.' : ''}</p>
    ${bankBlock}
  </div>
  <div class="hero-ctas" style="justify-content:center;margin-top:28px"><a class="btn btn-primary" href="${u('/')}">Về trang chủ</a><a class="link" href="tel:${C.hotlineRaw}">${icon('phone')} Cần hỗ trợ? ${C.hotline}</a></div>
</div></div>
<script>try{localStorage.removeItem('themeal_cart')}catch(e){}</script>`;
  return layout({ title: 'Đặt hàng thành công', path: '/dat-hang/thanh-cong', body, noindex: true });
}

function contactPage() {
  const body = `
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${u('/')}">Trang chủ</a></li><li aria-current="page">Liên hệ</li></ol></nav>
  <div class="page-head sec-head"><span class="eyebrow">Liên hệ</span><h1 class="h1">Chúng tôi luôn sẵn sàng tư vấn</h1>
  <p class="lead">Cần chọn size, so sánh sản phẩm hay mua số lượng lớn làm quà tặng doanh nghiệp? Để lại thông tin — the.Meal sẽ gọi lại cho bạn.</p></div>
  <div class="split" style="align-items:start;padding-bottom:96px">
    <div class="contact-card">
      <ul class="info-list">
        <li><span class="ic">${icon('pin')}</span><div><small>Địa chỉ</small>${esc(C.address)}</div></li>
        <li><span class="ic">${icon('phone')}</span><div><small>Hotline</small><a href="tel:${C.hotlineRaw}">${C.hotline}</a></div></li>
        <li><span class="ic">${icon('mail')}</span><div><small>Email</small><a href="mailto:${C.email}">${C.email}</a></div></li>
        <li><span class="ic">${icon('facebook')}</span><div><small>Fanpage</small><a href="${C.facebook}" target="_blank" rel="noopener">facebook.com/themeal.vn</a></div></li>
        <li><span class="ic">${icon('globe')}</span><div><small>Website</small><a href="${C.websiteUrl}" target="_blank" rel="noopener">${C.website}</a></div></li>
        <li><span class="ic">${icon('clock')}</span><div><small>Giờ làm việc</small>${DEV ? todo() : 'Thứ 2 – Thứ 7'}</div></li>
      </ul>
      <h2 class="h3" style="margin-top:28px">Kênh chính thức &amp; cộng đồng</h2>
      <ul class="channels">${[...C.socials, ...C.communities].map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener"><span class="ic">${icon(x.icon)}</span><span><b>${esc(x.label)}</b><small>${esc(x.note || ({ facebook: 'Facebook', youtube: 'YouTube', tiktok: 'TikTok', threads: 'Threads' })[x.icon])}</small></span>${icon('arrow')}</a></li>`).join('')}</ul>
      <iframe title="Bản đồ văn phòng the.Meal" src="${C.mapEmbed}" style="width:100%;height:260px;border:0;border-radius:14px;margin-top:24px" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>
    <form id="contactForm" class="form contact-card" data-lead-form data-type="contact" novalidate>
      <h2 class="h3" style="margin:0">Gửi yêu cầu tư vấn</h2>
      <div class="field"><label for="c-name">Họ và tên <span class="req" aria-hidden="true">*</span></label><input class="input" id="c-name" name="name" autocomplete="name" required><p class="err">${icon('alert')} Vui lòng nhập họ tên.</p></div>
      <div class="field"><label for="c-phone">Số điện thoại <span class="req" aria-hidden="true">*</span></label><input class="input" id="c-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required><p class="err">${icon('alert')} Nhập số điện thoại gồm 10 số, ví dụ 0912 345 678.</p></div>
      <div class="field"><label for="c-product">Sản phẩm quan tâm</label><select class="select" id="c-product" name="product"><option value="">— Chọn sản phẩm —</option>${products.map(p => `<option>${p.name}</option>`).join('')}<option>Quà tặng doanh nghiệp</option></select></div>
      <div class="field"><label for="c-msg">Nội dung</label><textarea class="textarea" id="c-msg" name="message"></textarea></div>
      <p class="form-alert" role="alert"></p>
      <button class="btn btn-primary btn-block" type="submit">Gửi yêu cầu tư vấn</button>
    </form>
  </div>
</div>`;
  return layout({ title: 'Liên hệ', path: '/lien-he', body });
}

function newsPage() {
  const body = `
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${u('/')}">Trang chủ</a></li><li aria-current="page">Tin tức</li></ol></nav>
  <div class="page-head sec-head"><span class="eyebrow">Tin tức &amp; kiến thức</span><h1 class="h1">Sống khoẻ mỗi ngày</h1></div>
  <div class="empty" style="margin-bottom:96px">${icon('news')}<h2 class="h3">Bài viết đang được chuẩn bị</h2>
  <p class="muted">Kiến thức về giấc ngủ, HRV, thành phần cơ thể và cách dùng thiết bị the.Meal sẽ sớm có tại đây.</p>
  <a class="btn btn-primary" href="${u('/san-pham')}">Khám phá sản phẩm</a></div>
</div>`;
  return layout({ title: 'Tin tức', path: '/tin-tuc', body });
}

const PARTNER_TYPES = [
  ['building', 'Chủ doanh nghiệp'], ['package', 'Nhà phân phối'], ['dumbbell', 'Phòng tập Gym / Yoga'],
  ['pill', 'Nhà thuốc'], ['leaf', 'Cửa hàng thực phẩm healthy'], ['users', 'HLV / Chuyên gia dinh dưỡng']
];
function partnerPage() {
  const body = `
<section class="section section--navy on-dark" style="padding-bottom:72px">
  <div class="wrap split">
    <div>
      <nav class="crumbs" aria-label="Breadcrumb" style="padding:0 0 18px"><ol><li><a href="${u('/')}" style="color:#C9D2E3">Trang chủ</a></li><li aria-current="page" style="color:#fff">Hợp tác đại lý</li></ol></nav>
      <span class="eyebrow">Chương trình đối tác the.Meal</span>
      <h1 class="h-display" style="margin-top:12px">Giải pháp sức khoẻ <span class="hl">trọn gói</span> cho mô hình kinh doanh của bạn.</h1>
      <p class="lead">Thiết bị thông minh + App the Meal + Khoá học dinh dưỡng/thể chất — đồng bộ trong một hệ sinh thái, sẵn sàng để bạn phân phối hoặc tích hợp vào dịch vụ hiện có.</p>
      <div class="hero-ctas"><a class="btn btn-primary" href="#dang-ky">Đăng ký tư vấn hợp tác ${icon('arrow')}</a><a class="btn btn-ghost" href="tel:${C.hotlineRaw}">${icon('phone')} ${C.hotline}</a></div>
    </div>
    <div class="partner-visual" aria-hidden="true">
      <img src="${u('/img/ring-pro.webp')}" alt="" width="360" height="360"><img src="${u('/img/scale.webp')}" alt="" width="360" height="360"><img src="${u('/img/app-ai.webp')}" alt="" width="360" height="720">
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="sec-head center"><span class="eyebrow">Ai có thể hợp tác</span><h2 class="h2">Phù hợp với nhiều mô hình kinh doanh</h2></div>
    <div class="grid g-3">
      ${[['building', 'Chủ doanh nghiệp', 'Quà tặng sức khoẻ cho nhân viên, khách hàng; chương trình phúc lợi chủ động.'],
         ['package', 'Nhà phân phối', 'Bổ sung dòng thiết bị sức khoẻ thông minh có app và nội dung đi kèm.'],
         ['dumbbell', 'Phòng tập Gym / Yoga', 'Đo thành phần cơ thể cho hội viên, theo dõi tiến trình tập luyện bằng dữ liệu.'],
         ['pill', 'Nhà thuốc', 'Mở rộng danh mục chăm sóc sức khoẻ chủ động bên cạnh dược phẩm.'],
         ['leaf', 'Cửa hàng thực phẩm healthy', 'Kết hợp dinh dưỡng và thiết bị đo lường — bán chéo, tăng giá trị đơn hàng.'],
         ['users', 'HLV / Chuyên gia dinh dưỡng', 'Theo dõi học viên từ xa bằng dữ liệu thật, đồng hành sát hơn với cộng đồng của bạn.']]
        .map(c => `<article class="metric reveal" style="flex-direction:column"><span class="pain-ic">${icon(c[0])}</span><h3>${c[1]}</h3><p>${c[2]}</p></article>`).join('')}
    </div>
  </div>
</section>

<section class="section section--white" id="chinh-sach">
  <div class="wrap">
    <div class="sec-head center"><span class="eyebrow">Quyền lợi đối tác</span><h2 class="h2">Minh bạch, đồng bộ, <span class="hl">có hệ thống hỗ trợ.</span></h2></div>
    <div class="grid g-3">
      <div class="cert reveal"><span class="pain-ic">${icon('layers')}</span><h3>Giải pháp trọn gói</h3><p>Thiết bị (Meal Ring Active, Active Pro, Meal Fit Insight) + App the Meal + Khoá học — một hệ sinh thái khép kín, không phải ghép nhiều nhà cung cấp.</p></div>
      <div class="cert reveal"><span class="pain-ic">${icon('file')}</span><h3>Chính sách rõ ràng</h3><p>Chính sách chiết khấu, thời hạn dịch vụ và điều khoản hợp đồng được gửi bằng văn bản trước khi ký. ${DEV ? todo('Bổ sung bảng chính sách/chiết khấu') : ''}</p></div>
      <div class="cert reveal"><span class="pain-ic">${icon('headset')}</span><h3>Vận hành &amp; hỗ trợ</h3><p>Đồng hành từ tư vấn, đào tạo sản phẩm đến triển khai cho khách hàng của bạn. ${DEV ? todo('Xác nhận các hạng mục hỗ trợ cụ thể') : ''}</p></div>
    </div>
    <h2 class="h3 center" style="margin:56px 0 20px">Quy trình hợp tác</h2>
    <ol class="flow">
      ${[['Đăng ký', 'Gửi thông tin qua form bên dưới.'], ['Tư vấn', 'the.Meal liên hệ, tìm hiểu mô hình và gửi chính sách.'], ['Ký hợp đồng', 'Thống nhất điều khoản, thời hạn và quyền lợi.'], ['Triển khai', 'Nhận hàng, đào tạo và bắt đầu kinh doanh.']]
        .map((x, i) => `<li class="reveal"><span class="n">${i + 1}</span><b>${x[0]}</b><span class="muted">${x[1]}</span></li>`).join('')}
    </ol>
  </div>
</section>

<section class="section" id="dang-ky">
  <div class="wrap split" style="align-items:start">
    <div>
      <span class="eyebrow">Đăng ký đối tác</span>
      <h2 class="h2">Trao đổi cùng đội ngũ the.Meal</h2>
      <p class="lead">Để lại thông tin, chúng tôi sẽ liên hệ trong giờ làm việc để tư vấn mô hình hợp tác phù hợp.</p>
      <ul class="info-list" style="margin-top:24px">
        <li><span class="ic">${icon('phone')}</span><div><small>Hotline hợp tác</small><a href="tel:${C.hotlineRaw}">${C.hotline}</a></div></li>
        <li><span class="ic">${icon('mail')}</span><div><small>Email</small><a href="mailto:${C.email}">${C.email}</a></div></li>
        <li><span class="ic">${icon('facebook')}</span><div><small>Fanpage giải pháp</small><a href="https://web.facebook.com/themealsolution" target="_blank" rel="noopener">The Meal - Giải pháp chăm sóc sức khoẻ</a></div></li>
      </ul>
    </div>
    <form class="form contact-card" data-lead-form data-type="partner" novalidate>
      <div class="row-2">
        <div class="field"><label for="p-name">Họ và tên <span class="req" aria-hidden="true">*</span></label><input class="input" id="p-name" name="name" autocomplete="name" required><p class="err">${icon('alert')} Vui lòng nhập họ tên.</p></div>
        <div class="field"><label for="p-phone">Số điện thoại <span class="req" aria-hidden="true">*</span></label><input class="input" id="p-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required><p class="err">${icon('alert')} Nhập số điện thoại gồm 10 số, ví dụ 0912 345 678.</p></div>
      </div>
      <div class="field"><label for="p-email">Email <span class="hint">(không bắt buộc)</span></label><input class="input" id="p-email" name="email" type="email" autocomplete="email"><p class="err">${icon('alert')} Email chưa đúng định dạng, ví dụ ten@congty.vn.</p></div>
      <div class="field"><label for="p-company">Tên doanh nghiệp / thương hiệu</label><input class="input" id="p-company" name="company" autocomplete="organization"></div>
      <div class="row-2">
        <div class="field"><label for="p-type">Loại hình</label><select class="select" id="p-type" name="bizType"><option value="">— Chọn loại hình —</option>${PARTNER_TYPES.map(t => `<option>${t[1]}</option>`).join('')}<option>Khác</option></select></div>
        <div class="field"><label for="p-prov">Tỉnh / Thành phố</label><input class="input" id="p-prov" name="province" autocomplete="address-level1"></div>
      </div>
      <div class="field"><label for="p-msg">Nhu cầu hợp tác</label><textarea class="textarea" id="p-msg" name="message" placeholder="Quy mô, số điểm bán/hội viên, sản phẩm quan tâm…"></textarea></div>
      <p class="form-alert" role="alert"></p>
      <button class="btn btn-primary btn-block" type="submit">Gửi đăng ký hợp tác</button>
    </form>
  </div>
</section>`;
  return layout({ title: 'Hợp tác đại lý & đối tác', path: '/hop-tac', body, desc: 'Trở thành đối tác phân phối the.Meal: giải pháp sức khoẻ trọn gói thiết bị + app + khoá học cho nhà phân phối, phòng gym/yoga, nhà thuốc, cửa hàng healthy, chuyên gia dinh dưỡng.' });
}

const POLICIES = [
  { slug: 'bao-hanh', title: 'Chính sách bảo hành' },
  { slug: 'doi-tra', title: 'Đổi trả & đổi size' },
  { slug: 'van-chuyen', title: 'Vận chuyển & giao nhận' },
  { slug: 'thanh-toan', title: 'Hình thức thanh toán' },
  { slug: 'bao-mat', title: 'Chính sách bảo mật' }
];
const POLICY_BODY = {
  'thanh-toan': `<p>the.Meal hỗ trợ hai hình thức thanh toán:</p><ul><li><b>Thanh toán khi nhận hàng (COD):</b> bạn kiểm tra hàng và thanh toán cho nhân viên giao hàng.</li><li><b>Chuyển khoản ngân hàng:</b> thông tin tài khoản và mã QR hiển thị ngay sau khi đặt hàng. Vui lòng ghi đúng mã đơn trong nội dung chuyển khoản.</li></ul>`,
  'bao-mat': `<p>the.Meal chỉ thu thập thông tin cần thiết để xử lý đơn hàng (họ tên, số điện thoại, địa chỉ, email nếu có) và không chia sẻ cho bên thứ ba ngoài đơn vị vận chuyển.</p><p>Dữ liệu sức khoẻ trên ứng dụng the Meal được quản lý theo điều khoản riêng của ứng dụng.</p>`
};
function policyPage(slug) {
  const p = POLICIES.find(x => x.slug === slug);
  if (!p) return null;
  const content = POLICY_BODY[slug] || `<p>${todo('Nội dung chính sách đang chờ the.Meal cung cấp')}</p><p>Trong thời gian chờ, vui lòng liên hệ hotline <a href="tel:${C.hotlineRaw}">${C.hotline}</a> để được hỗ trợ.</p>`;
  const body = `<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${u('/')}">Trang chủ</a></li><li aria-current="page">${p.title}</li></ol></nav>
  <article class="prose"><h1 class="h1">${p.title}</h1>${content}</article></div>`;
  return layout({ title: p.title, path: `/chinh-sach/${slug}`, body });
}

function notFound(title = 'Không tìm thấy trang', msg = 'Trang bạn tìm có thể đã được đổi tên hoặc không tồn tại.') {
  const body = `<div class="wrap"><div class="success"><h1 class="h1">${esc(title)}</h1><p class="lead" style="margin-inline:auto">${esc(msg)}</p>
  <div class="hero-ctas" style="justify-content:center"><a class="btn btn-primary" href="${u('/')}">Về trang chủ</a><a class="link" href="${u('/san-pham')}">Xem sản phẩm ${icon('arrow')}</a></div></div></div>`;
  return layout({ title, body, noindex: true });
}

function adminPage(orders, leads = []) {
  const statuses = ['Mới', 'Đã xác nhận', 'Đang giao', 'Hoàn tất', 'Huỷ'];
  const rows = orders.slice().reverse().map(o => `<tr>
    <td><b>${o.code}</b><br><small>${new Date(o.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</small></td>
    <td>${esc(o.customer.name)}<br><a href="tel:${esc(o.customer.phone)}">${esc(o.customer.phone)}</a><br><small>${esc(o.customer.address)}, ${esc(o.customer.province)}</small>${o.customer.note ? `<br><small><i>${esc(o.customer.note)}</i></small>` : ''}</td>
    <td>${o.items.map(i => `${esc(i.name)} · ${esc(i.colorName)}${i.size ? ' · S' + esc(i.size) : ''} × ${i.qty}`).join('<br>')}</td>
    <td><b>${vnd(o.total)}</b><br><small>${o.payment === 'bank' ? 'Chuyển khoản' : 'COD'}</small></td>
    <td><form method="post" action="/admin/orders/${o.code}/status"><select class="select" name="status" style="min-height:40px" onchange="this.form.submit()">${statuses.map(s => `<option${s === o.status ? ' selected' : ''}>${s}</option>`).join('')}</select></form></td>
  </tr>`).join('');
  const body = `<div class="wrap" style="padding:32px 20px 96px"><h1 class="h1">Quản lý đơn hàng</h1><p class="muted">${orders.length} đơn · <a href="/admin/orders.csv">Tải CSV</a></p>
  <div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng</th><th>Trạng thái</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="5">Chưa có đơn hàng nào.</td></tr>'}</tbody></table></div>
  <h2 class="h2" style="margin-top:48px">Yêu cầu tư vấn &amp; đăng ký đối tác</h2>
  <div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>Ngày</th><th>Loại</th><th>Liên hệ</th><th>Doanh nghiệp / quan tâm</th><th>Nội dung</th></tr></thead><tbody>
  ${leads.slice().reverse().map(l => `<tr><td>${new Date(l.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</td><td><span class="status">${l.type === 'partner' ? 'Đối tác' : 'Tư vấn'}</span></td><td>${esc(l.name)}<br><a href="tel:${esc(l.phone)}">${esc(l.phone)}</a><br>${esc(l.email || '')}</td><td>${esc([l.company, l.bizType, l.province, l.product].filter(Boolean).join(' · '))}</td><td>${esc(l.message)}</td></tr>`).join('') || '<tr><td colspan="5">Chưa có yêu cầu nào.</td></tr>'}
  </tbody></table></div></div>`;
  return layout({ title: 'Quản trị', path: '/admin', body, noindex: true });
}

module.exports = { partnerPage, home, productList, productPage, cartPage, checkoutPage, successPage, contactPage, newsPage, policyPage, notFound, adminPage, POLICIES, vnd, esc, abs };
