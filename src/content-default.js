// Nội dung mặc định của website (dùng khi chưa đăng bản nào từ trang quản trị).
// Chữ trong *dấu sao* được tô màu nhấn. Token: {hotline} {hotlineRaw} {email} {gia:slug}.
const cfg = require('./config');
const { products: SEED } = require('./products');
const C = cfg.company;

const RING_GUIDE = ['Tải app the Meal (Android/iOS) và bật Bluetooth.', 'Ghép nối (Pair BLE) nhẫn với app — chỉ mất vài giây.', 'Đeo nhẫn 24/7: dữ liệu tự động đồng bộ mỗi ngày.', 'Xem insight, điểm sức khoẻ và gợi ý hành động trong app.'];
const SCALE_GUIDE = [
  'Tải app the Meal trên CH Play hoặc App Store và cập nhật phiên bản mới nhất.',
  'Bật Bluetooth, cho phép the Meal kết nối với thiết bị ở gần.',
  'Mở app → nút Action Hub (giữa thanh điều hướng) → chọn "Cân nặng" → "Đo bằng cân thông minh".',
  'Chọn "Bắt đầu kết nối", đứng lên cân để kích hoạt và chọn đúng cân.',
  'Giữ nguyên tư thế đến khi số cân ổn định và cân đo xong các chỉ số cơ thể.',
  'Xem báo cáo, lưu lại — dữ liệu nằm ở mục "Sức khỏe" → "Cơ thể".'
];

const products = SEED.map(p => ({
  id: p.id, slug: p.slug, name: p.name, category: p.category, tagline: p.tagline, price: p.price,
  badge: p.badge || '', featured: !!p.featured, dark: !!p.dark, image: p.image,
  gallery: p.gallery.map(g => ({ src: g.src, alt: g.alt })),
  colors: p.colors.map(c => ({ ...c })), sizes: p.sizes.join(', '),
  summary: p.summary, highlights: p.highlights.map(text => ({ text })),
  metrics: p.metrics.map(([title, text]) => ({ title, text })),
  benefits: p.benefits.map(text => ({ text })), forWho: p.forWho.map(text => ({ text })),
  specs: p.specs.map(([label, value]) => ({ label, value })),
  guide: (p.sizes.length ? RING_GUIDE : SCALE_GUIDE).map(text => ({ text })),
  priceNote: 'Đã gồm VAT'
}));
const P = Object.fromEntries(products.map(p => [p.id, p]));

const btn = (label, hrefValue, style = 'primary', icon = '', extra = {}) => ({ label, href: hrefValue, style, icon, ...extra });
const youtube = C.socials.find(s => s.icon === 'youtube');
const PARTNER_TYPES = [['building', 'Chủ doanh nghiệp'], ['package', 'Nhà phân phối'], ['dumbbell', 'Phòng tập Gym / Yoga'], ['pill', 'Nhà thuốc'], ['leaf', 'Cửa hàng thực phẩm healthy'], ['users', 'HLV / Chuyên gia dinh dưỡng']];
const compareRows = () => [
            ['Giá', '{gia:meal-ring-active}', '{gia:meal-ring-active-pro}'], ['Chất liệu', 'Thép không gỉ', 'Hợp kim titan'], ['Trọng lượng', '2.7g', '3g'],
            ['Chip / cảm biến', 'Tiêu chuẩn', 'Nordic nRF54L15 · GOODiX + 6 trục'], ['Nhịp tim · SpO₂ · Giấc ngủ · HRV', '✓ Có', '✓ Có'],
            ['Nhiệt độ cơ thể · Vận động', '✓ Có', '✓ Có'], ['AI phân tích & gợi ý', 'Gợi ý cải thiện thói quen', 'Phân tích toàn diện, khuyến nghị dinh dưỡng & cảnh báo sớm'],
            ['Chống nước · Pin', '5ATM · 5–7 ngày', '5ATM · 5–7 ngày'], ['Phù hợp', 'Bắt đầu sống khoẻ, thích gọn nhẹ', 'Theo dõi toàn diện, quà tặng cao cấp']
          ].map(([label, a, b]) => ({ label, a, b }));
const policy = (slug, title, html) => ({
  id: 'policy-' + slug, path: '/chinh-sach/' + slug, title, desc: '', blocks: [
    { id: slug + '-head', type: 'pageHeader', crumbs: true, eyebrow: '', title, lead: '' },
    { id: slug + '-body', type: 'richtext', tight: true, html }
  ]
});
const PENDING = '<p>Nội dung chính sách đang được cập nhật.</p><p>Trong thời gian chờ, vui lòng liên hệ hotline <a href="tel:{hotlineRaw}">{hotline}</a> để được hỗ trợ.</p>';

module.exports = () => ({
  version: 1,
  theme: { primary: '#4BCE97', primaryInk: '#147A56', dark: '#0B1C3A', bg: '#FAF9F6' },
  site: {
    name: cfg.siteName,
    tagline: 'Nhẫn & cân chăm sóc sức khoẻ',
    description: `${cfg.siteName} — hệ sinh thái thiết bị chăm sóc sức khoẻ cho người Việt: nhẫn thông minh Meal Ring Active, Active Pro và cân thông minh Meal Fit Insight. Đồng bộ app the Meal, AI gợi ý cá nhân hoá.`,
    logoText: 'Thiết bị thông minh', logoAccent: '5.0',
    topbar: [
      { icon: 'phone', text: 'Hotline tư vấn:', linkText: '{hotline}', href: 'tel:{hotlineRaw}' },
      { icon: 'package', text: 'Thanh toán khi nhận hàng (COD)', linkText: '', href: '' },
      { icon: 'shield', text: 'Chứng nhận CE · FCC · RoHS', linkText: '', href: '' }
    ],
    nav: [
      { label: 'Trang chủ', href: '/' }, { label: 'Sản phẩm', href: '/san-pham' }, { label: 'App the Meal', href: '/#he-sinh-thai' },
      { label: 'Hợp tác đại lý', href: '/hop-tac' }, { label: 'Tin tức', href: '/tin-tuc' }, { label: 'Liên hệ', href: '/lien-he' }
    ],
    headerCta: { label: 'Mua ngay', href: '/san-pham' },
    company: {
      name: C.name, address: C.address, hotline: C.hotline, email: C.email, taxCode: C.taxCode || '',
      hours: 'Thứ 2 – Thứ 7', zalo: C.zalo, facebook: C.facebook, website: C.website, websiteUrl: C.websiteUrl, mapEmbed: C.mapEmbed
    },
    socials: C.socials.map(s => ({ icon: s.icon, label: s.label, url: s.url, note: '' })),
    communities: C.communities.map(s => ({ icon: s.icon, label: s.label, url: s.url, note: s.note || '' })),
    footer: {
      about: 'Hệ sinh thái chăm sóc sức khoẻ chủ động & toàn diện dành cho người Việt — ăn đúng, vận động đủ, ngủ sâu và sống khoẻ mỗi ngày.',
      productLinks: [{ label: 'Hướng dẫn chọn size', href: '/#chon-size' }, { label: 'Hợp tác đại lý', href: '/hop-tac' }],
      policyLinks: [
        { label: 'Chính sách bảo hành', href: '/chinh-sach/bao-hanh' }, { label: 'Đổi trả & đổi size', href: '/chinh-sach/doi-tra' },
        { label: 'Vận chuyển & giao nhận', href: '/chinh-sach/van-chuyen' }, { label: 'Hình thức thanh toán', href: '/chinh-sach/thanh-toan' },
        { label: 'Chính sách bảo mật', href: '/chinh-sach/bao-mat' }
      ],
      bottomNote: 'Sản phẩm không phải thiết bị y tế, không thay thế chẩn đoán của bác sĩ.'
    },
    fab: true
  },
  sizeGuide: {
    steps: [
      { title: 'Chuẩn bị dây đo', text: 'Một dải giấy hoặc sợi dây không co giãn, quấn quanh ngón tay bạn muốn đeo nhẫn.' },
      { title: 'Quấn vừa khít', text: 'Ôm vừa khít ngón tay — không quá chặt, không quá lỏng.' },
      { title: 'Đánh dấu điểm giao', text: 'Đánh dấu nơi hai đầu giấy (hoặc dây) giao nhau.' },
      { title: 'Đo chiều dài', text: 'Trải phẳng, đo từ đầu đến điểm đánh dấu — đó là chu vi ngón tay.' }
    ],
    hint: 'Nên đo 2–3 lần và lấy trung bình; đo ở vị trí to nhất của ngón tay để dễ đeo/tháo.',
    images: [1, 2, 3, 4].map(i => ({ src: `/img/size-${i}.webp`, alt: `Bước ${i} đo size nhẫn` })),
    rows: [['7', '17.9', '55'], ['8', '18.3', '57.5'], ['9', '19.2', '60'], ['10', '20.0', '62.8'], ['11', '20.9', '65.4'], ['12', '21.6', '67.8']]
      .map(([size, diameter, circumference]) => ({ size, diameter, circumference })),
    note: 'Chu vi = độ dài dây đo được ở bước 4. Nếu nằm giữa hai size, hãy chọn size lớn hơn hoặc gọi {hotline} để được tư vấn.'
  },
  products,
  pages: [
    {
      id: 'home', path: '/', title: '', desc: '', system: true, blocks: [
        {
          id: 'home-hero', type: 'hero',
          slides: [
            { theme: 'cream', productId: 'meal-ring-active', eyebrow: 'Meal Ring Active · Nhẫn thông minh', title: 'Hiểu cơ thể mình, *ngay trên ngón tay.*',
              lead: 'Đo nhịp tim, SpO₂, giấc ngủ, HRV và thân nhiệt liên tục 24/7 — nặng chỉ 2.7g, chống nước 5ATM, pin 5–7 ngày.', note: 'Size 7–12 · Đen / Bạc', image: '',
              buttons: [btn('Mua Meal Ring Active', '/san-pham/meal-ring-active', 'primary', 'arrow'), btn('Xem thông số', '/san-pham/meal-ring-active#thong-tin', 'link')],
              chips: [{ icon: 'heart', title: 'Nhịp tim', text: 'Liên tục 24/7' }, { icon: 'moon', title: 'Giấc ngủ', text: 'Chấm điểm mỗi đêm' }, { icon: 'droplet', title: 'SpO₂', text: 'Oxy trong máu' }] },
            { theme: 'navy', productId: 'meal-ring-active-pro', eyebrow: 'Meal Ring Active Pro · Cao cấp', title: 'Theo dõi sâu hơn. *Cảnh báo sớm hơn.*',
              lead: 'Hợp kim titan 3g, chip Nordic nRF54L15 và AI the Meal phân tích toàn diện — khuyến nghị dinh dưỡng, lối sống mỗi ngày.', note: 'Bản titan · Size 7–12', image: '',
              buttons: [btn('Mua Meal Ring Active Pro', '/san-pham/meal-ring-active-pro', 'primary', 'arrow'), btn('Xem thông số', '/san-pham/meal-ring-active-pro#thong-tin', 'link')],
              chips: [{ icon: 'sparkles', title: 'AI hỗ trợ', text: 'Gợi ý cá nhân hoá' }, { icon: 'activity', title: 'HRV', text: 'Cân bằng căng thẳng' }, { icon: 'thermometer', title: 'Thân nhiệt', text: 'Theo dõi xu hướng' }] },
            { theme: 'mint', productId: 'meal-fit-insight', eyebrow: 'Meal Fit Insight · Cân thông minh', title: 'Một bước lên cân, *đọc vị 40+ chỉ số.*',
              lead: '8 điện cực công nghệ BIA đo mỡ nội tạng, cơ bắp, nước, tuổi sinh học… và đồng bộ tức thì với app the Meal.', note: 'Tải tối đa 180kg · Cả gia đình', image: '',
              buttons: [btn('Mua Meal Fit Insight', '/san-pham/meal-fit-insight', 'primary', 'arrow'), btn('Xem thông số', '/san-pham/meal-fit-insight#thong-tin', 'link')],
              chips: [{ icon: 'gauge', title: '40+ chỉ số', text: 'Thành phần cơ thể' }, { icon: 'users', title: 'Nhiều thành viên', text: 'Tự nhận diện' }, { icon: 'bluetooth', title: 'Bluetooth 5.0', text: 'Đồng bộ tức thì' }] }
          ],
          trust: [{ icon: 'shield', text: 'CE · FCC · RoHS' }, { icon: 'package', text: 'Thanh toán COD' }, { icon: 'phone', text: 'Tư vấn {hotline}' }]
        },
        { id: 'home-trust', type: 'trust', items: [
          { icon: 'shield', title: 'Chứng nhận quốc tế', text: 'CE-RED · FCC · RoHS' }, { icon: 'sparkles', title: 'AI the Meal', text: 'Gợi ý cá nhân hoá mỗi ngày' },
          { icon: 'package', title: 'Thanh toán COD', text: 'Nhận hàng rồi trả tiền' }, { icon: 'phone', title: 'Tư vấn tận tâm', text: 'Hotline {hotline}' }] },
        { id: 'home-pain', type: 'features', bg: 'white', anchor: 'van-de', align: 'center', style: 'pain', columns: 3,
          eyebrow: 'Dành cho người bận rộn', title: 'Muốn sống khoẻ chủ động, *nhưng không có thời gian?*',
          lead: 'Eat clean, tập gym, yoga, chạy bộ… bạn đã cố gắng. the.Meal giúp mọi nỗ lực đó được đo lường, được đồng hành và có cơ sở khoa học.',
          items: [
            { icon: 'hourglass', seal: '', title: 'Không có thời gian theo dõi cơ thể', text: 'Lịch làm việc kín, khó ghi chép giấc ngủ, vận động, cân nặng mỗi ngày.', fix: 'Nhẫn đo tự động 24/7, cân đọc 40+ chỉ số trong một bước — mọi thứ tự đồng bộ về app, không cần nhập tay.' },
            { icon: 'repeat', seal: '', title: 'Thử nhiều cách nhưng dễ bỏ cuộc', text: 'Thiếu người đồng hành nên khó duy trì thói quen lâu dài.', fix: 'App the Meal gợi ý micro-habit mỗi tuần, đo lại kết quả và cập nhật Điểm Sức Khoẻ để bạn thấy mình tiến bộ.' },
            { icon: 'book', seal: '', title: 'Thiếu kiến thức khoa học', text: 'Thông tin trên mạng nhiều nhưng khó biết điều gì đúng với cơ thể mình.', fix: 'AI diễn giải chỉ số thành lời khuyên dễ hiểu, cùng kho kiến thức dinh dưỡng & thể chất từ cộng đồng the Meal.' }] },
        { id: 'home-products', type: 'products', anchor: 'san-pham', align: 'center', columns: 3, productIds: [],
          eyebrow: 'Hệ sinh thái thiết bị the.Meal', title: 'Chọn thiết bị *phù hợp với bạn*',
          lead: 'Hai dòng nhẫn thông minh theo dõi 24/7 và một chiếc cân phân tích thành phần cơ thể — cùng chuẩn hoá dữ liệu trên một ứng dụng duy nhất.' },
        { id: 'home-metrics', type: 'mediaText', bg: 'white', anchor: 'chi-so', side: 'right',
          eyebrow: 'Meal Ring theo dõi 24/7', title: '6 chỉ số quan trọng, *đo tự động không bỏ sót.*',
          lead: 'Chỉ cần đeo nhẫn — Meal Ring ghi nhận liên tục cả ngày lẫn đêm và đồng bộ về app, không cần nhập tay.',
          listStyle: 'numbered', listPlace: 'text', list: P['meal-ring-active-pro'].metrics.map(m => ({ icon: '', title: m.title, text: m.text, href: '' })),
          mediaType: 'video', image: '', video: '/img/ring-measure.mp4', poster: '/img/ring-measure-poster.jpg', images: [], mediaShape: 'tall', mediaAlt: 'Video nhẫn Meal Ring đang đo trên ngón tay', buttons: [] },
        { id: 'home-loop', type: 'steps', bg: 'navy', anchor: 'he-sinh-thai', align: 'center', style: 'loop',
          eyebrow: 'Ứng dụng the Meal', title: 'Một vòng lặp khép kín, *cải thiện mỗi ngày.*',
          lead: 'the Meal biến chỉ số từ thiết bị thành insight dễ hiểu và một hành động nhỏ mỗi ngày — rồi đo lại kết quả, liên tục cải thiện.',
          items: [
            { kicker: 'Bước 1', title: 'Ghi nhận', text: 'Thiết bị đo chỉ số cơ thể liên tục, tự động đồng bộ về app.' },
            { kicker: 'Bước 2', title: 'Phân tích', text: 'AI chuẩn hoá dữ liệu thành biểu đồ trực quan và Điểm Sức Khoẻ theo ngày, tuần, tháng.' },
            { kicker: 'Bước 3', title: 'Tư vấn', text: 'Gợi ý & cảnh báo cá nhân hoá, dễ hiểu, đúng lúc bạn cần.' },
            { kicker: 'Bước 4', title: 'Hành động', text: 'Micro-habit & kế hoạch mỗi tuần, đo lại kết quả và bắt đầu chu kỳ mới.' }] },
        { id: 'home-phones', type: 'gallery', bg: 'navy', tight: true, style: 'phones', align: 'center', eyebrow: '', title: '', lead: '',
          images: [['app-sleep', 'Điểm giấc ngủ'], ['app-hrv', 'Biến thiên nhịp tim'], ['app-ai', 'AI đánh giá tổng quan'], ['app-next', 'Gợi ý bước tiếp theo'], ['app-spo2', 'SpO₂ trong ngày'], ['app-family', 'Sức khoẻ cả nhà']]
            .map(([f, c]) => ({ src: `/img/${f}.webp`, caption: c, alt: `Màn hình app the Meal: ${c}` })),
          note: 'Mọi gợi ý từ AI chỉ mang tính tham khảo, không thay thế tư vấn dinh dưỡng hoặc y khoa chuyên môn.' },
        { id: 'home-knowledge', type: 'mediaText', bg: 'white', anchor: 'kien-thuc', side: 'right',
          eyebrow: 'Thiết bị + App + Kiến thức', title: 'Không chỉ đo — *hiểu và làm đúng.*',
          lead: 'Nâng cao kiến thức dinh dưỡng và thể chất cùng các kênh nội dung và cộng đồng của the Meal: video, sách, mẹo ăn uống và nhóm thảo luận cùng hàng nghìn người cùng mục tiêu.',
          buttons: [btn('Xem kênh YouTube the Meal', youtube ? youtube.url : '#', 'primary', 'youtube')],
          listStyle: 'links', listPlace: 'side',
          list: [...C.socials.filter(x => x.icon === 'youtube').map(x => ({ ...x, note: 'YouTube' })), ...C.communities].map(x => ({ icon: x.icon, title: x.label, text: x.note || '', href: x.url })),
          mediaType: 'none', image: '', video: '', poster: '', images: [], mediaShape: 'square', mediaAlt: '' },
        { id: 'home-compare', type: 'compare', anchor: 'so-sanh', align: 'center',
          eyebrow: 'So sánh nhanh', title: 'Active hay Active Pro?', lead: 'Cùng đo đầy đủ 6 chỉ số 24/7. Khác biệt nằm ở chất liệu, chip cảm biến và độ sâu phân tích của AI.',
          colA: 'Meal Ring Active', colB: 'Meal Ring Active Pro',
          rows: compareRows(),
          linkA: { label: 'Xem Active', href: '/san-pham/meal-ring-active' }, linkB: { label: 'Xem Active Pro', href: '/san-pham/meal-ring-active-pro' } },
        { id: 'home-scale', type: 'mediaText', bg: 'mint', anchor: 'can-thong-minh', side: 'left',
          eyebrow: 'Meal Fit Insight · Cân thông minh', title: 'Thành phần cơ thể, *chính xác & khoa học.*', lead: P['meal-fit-insight'].summary,
          listStyle: 'check', listPlace: 'text', list: P['meal-fit-insight'].benefits.map(b => ({ icon: '', title: b.text, text: '', href: '' })),
          productId: 'meal-fit-insight', priceNote: 'Model CF586 · Màu đen',
          buttons: [btn('Thêm vào giỏ', '', 'primary', 'cart', { addToCart: 'meal-fit-insight' }), btn('Xem chi tiết', '/san-pham/meal-fit-insight', 'link', 'arrow')],
          mediaType: 'image', image: '/img/scale-stand.webp', video: '', poster: '', images: [], mediaShape: 'square', mediaAlt: 'Người dùng đứng trên cân Meal Fit Insight' },
        { id: 'home-life', type: 'gallery', style: 'mosaic', align: 'left', eyebrow: 'Nhật ký the.Meal', title: 'Đeo mọi lúc, *đo mọi nơi.*', lead: '', note: '',
          images: [['life-badminton', 'Khi chơi thể thao', 'Chơi cầu lông khi đeo nhẫn Meal Ring màu bạc'], ['life-bottle', 'Tập luyện', 'Đeo nhẫn màu đen khi tập luyện'],
            ['scale-room', 'Tại nhà', 'Đo thành phần cơ thể tại phòng khách'], ['life-wrist', 'Đi làm', 'Nhẫn màu bạc trên tay'], ['scale-handle', 'Đo 8 điện cực', 'Cầm tay cầm điện cực của cân']]
            .map(([f, caption, alt]) => ({ src: `/img/${f}.webp`, caption, alt })) },
        { id: 'home-size', type: 'sizeGuide', bg: 'white', anchor: 'chon-size', eyebrow: 'Hướng dẫn chọn size', title: 'Đo size nhẫn tại nhà *trong 2 phút.*' },
        { id: 'home-certs', type: 'features', anchor: 'chung-nhan', align: 'center', style: 'cert', columns: 4, eyebrow: 'An tâm sử dụng', title: 'Đạt chuẩn chứng nhận quốc tế', lead: '',
          items: [['CE', 'CE-RED', 'Chứng nhận thiết bị vô tuyến đạt chuẩn để lưu hành tại châu Âu.'], ['FCC', 'FCC', 'Không gây nhiễu sóng vượt mức theo tiêu chuẩn Hoa Kỳ.'],
            ['RoHS', 'RoHS', 'Hạn chế các chất độc hại (thuỷ ngân, chì…) trong thiết bị điện tử.'], ['ISO', 'ISO 9001', 'Hệ thống quản lý chất lượng (cân Meal Fit Insight).']]
            .map(([seal, title, text]) => ({ icon: '', seal, title, text, fix: '' })) },
        { id: 'home-reviews', type: 'reviews', bg: 'white', anchor: 'danh-gia', align: 'center', eyebrow: 'Khách hàng nói gì', title: 'Đánh giá từ người dùng thật', lead: '', items: [],
          emptyTitle: 'Đánh giá đang được cập nhật', emptyText: 'Chúng tôi chỉ đăng phản hồi thật từ khách hàng đã mua.' },
        { id: 'home-partner', type: 'mediaText', bg: 'navy', anchor: 'doi-tac', side: 'right',
          eyebrow: 'Dành cho doanh nghiệp & đối tác', title: 'Mở rộng danh mục kinh doanh với *giải pháp sức khoẻ trọn gói.*',
          lead: 'Thiết bị + App + Khoá học đồng bộ trong một hệ sinh thái — dành cho nhà phân phối, phòng tập Gym/Yoga, nhà thuốc, cửa hàng healthy và chuyên gia dinh dưỡng có cộng đồng riêng.',
          buttons: [btn('Đăng ký làm đối tác', '/hop-tac', 'primary', 'arrow'), btn('Xem quyền lợi', '/hop-tac#chinh-sach', 'link')],
          listStyle: 'chips', listPlace: 'side', list: PARTNER_TYPES.map(([icon, title]) => ({ icon, title, text: '', href: '' })),
          mediaType: 'none', image: '', video: '', poster: '', images: [], mediaShape: 'square', mediaAlt: '' },
        { id: 'home-faq', type: 'faq', anchor: 'faq', align: 'center', eyebrow: 'Câu hỏi thường gặp', title: 'Bạn còn băn khoăn?', lead: '',
          items: [
            ['Meal Ring Active và Active Pro khác nhau thế nào?', 'Cả hai cùng đo nhịp tim, SpO₂, giấc ngủ, HRV, nhiệt độ cơ thể và vận động 24/7. Active Pro làm từ hợp kim titan, dùng chip Nordic nRF54L15 cùng cảm biến GOODiX + 6 trục, và được AI phân tích toàn diện hơn: khuyến nghị dinh dưỡng, lối sống và cảnh báo sớm khi có dấu hiệu bất thường.'],
            ['Nhẫn có chống nước không? Pin dùng được bao lâu?', 'Cả hai phiên bản đạt chuẩn chống nước 5ATM (~50m), có thể đeo khi rửa tay, tắm hay đi mưa. Mỗi lần sạc dùng được khoảng 5–7 ngày tuỳ tần suất đo.'],
            ['Làm sao để chọn đúng size nhẫn?', 'Nhẫn có size 7 đến 12. Bạn có thể tự đo chu vi ngón tay bằng một dải giấy và đối chiếu bảng quy đổi ở mục <a href="/#chon-size">Hướng dẫn chọn size</a>, hoặc gọi hotline để được tư vấn.'],
            ['Thiết bị dùng với ứng dụng nào?', 'Nhẫn Meal Ring và cân Meal Fit Insight đồng bộ qua Bluetooth với ứng dụng the Meal trên Android và iOS. Mọi chỉ số được gom về một nơi, AI chấm điểm và gợi ý hành động mỗi ngày.'],
            ['Cả gia đình có dùng chung cân Meal Fit Insight được không?', 'Được. Cân tự bật và nhận diện người dùng, hỗ trợ nhiều thành viên. Tải trọng tối đa 180kg.'],
            ['Kết quả đo có thay thế được thiết bị y tế không?', 'Không. Sản phẩm giúp bạn theo dõi xu hướng sức khoẻ; mọi gợi ý từ AI chỉ mang tính tham khảo, không thay thế tư vấn dinh dưỡng hoặc chẩn đoán y khoa.'],
            ['Tôi là chủ phòng tập / nhà thuốc / cửa hàng healthy, có thể hợp tác phân phối không?', 'Có. the.Meal tìm kiếm đối tác phân phối và tích hợp giải pháp trọn gói (thiết bị + app + khoá học). Đăng ký tại trang <a href="/hop-tac">Hợp tác đại lý</a>, đội ngũ sẽ liên hệ và gửi chính sách hợp tác chi tiết.'],
            ['Tôi có thể thanh toán bằng cách nào?', 'Bạn có thể thanh toán khi nhận hàng (COD) hoặc chuyển khoản ngân hàng. Sau khi đặt, nhân viên the.Meal sẽ gọi xác nhận đơn.']
          ].map(([q, a]) => ({ q, a })) },
        { id: 'home-cta', type: 'cta', tight: true,
          eyebrow: 'Bắt đầu hành trình sống khoẻ', title: 'Ăn đúng, vận động đủ, ngủ sâu — *bắt đầu từ hôm nay.*',
          lead: 'Đặt hàng online, thanh toán khi nhận hàng. Nhân viên the.Meal sẽ gọi xác nhận và tư vấn size miễn phí.',
          buttons: [btn('Chọn sản phẩm', '/san-pham', 'primary', 'arrow'), btn('{hotline}', 'tel:{hotlineRaw}', 'ghost', 'phone')],
          images: ['/img/ring-active.webp', '/img/ring-pro.webp', '/img/scale.webp'].map(src => ({ src, caption: '', alt: '' })) }
      ]
    },
    {
      id: 'products', path: '/san-pham', title: 'Sản phẩm', system: true,
      desc: 'Mua nhẫn thông minh Meal Ring Active, Meal Ring Active Pro và cân thông minh Meal Fit Insight chính hãng the.Meal. Thanh toán COD.',
      blocks: [
        { id: 'products-head', type: 'pageHeader', crumbs: true, eyebrow: 'Cửa hàng the.Meal', title: 'Thiết bị chăm sóc sức khoẻ', lead: 'Nhẫn thông minh và cân thông minh — đồng bộ một ứng dụng the Meal, AI gợi ý cá nhân hoá mỗi ngày.' },
        { id: 'products-grid', type: 'products', tight: true, align: 'left', columns: 3, productIds: [], eyebrow: '', title: '', lead: '' },
        { id: 'products-compare', type: 'compare', tight: true, align: 'left', eyebrow: '', title: 'So sánh hai phiên bản nhẫn', lead: '', colA: 'Meal Ring Active', colB: 'Meal Ring Active Pro',
          rows: compareRows(), linkA: { label: 'Xem Active', href: '/san-pham/meal-ring-active' }, linkB: { label: 'Xem Active Pro', href: '/san-pham/meal-ring-active-pro' } }
      ]
    },
    {
      id: 'partner', path: '/hop-tac', title: 'Hợp tác đại lý & đối tác',
      desc: 'Trở thành đối tác phân phối the.Meal: giải pháp sức khoẻ trọn gói thiết bị + app + khoá học cho nhà phân phối, phòng gym/yoga, nhà thuốc, cửa hàng healthy, chuyên gia dinh dưỡng.',
      blocks: [
        { id: 'partner-hero', type: 'mediaText', bg: 'navy', side: 'right', display: true, crumbs: true,
          eyebrow: 'Chương trình đối tác the.Meal', title: 'Giải pháp sức khoẻ *trọn gói* cho mô hình kinh doanh của bạn.',
          lead: 'Thiết bị thông minh + App the Meal + Khoá học dinh dưỡng/thể chất — đồng bộ trong một hệ sinh thái, sẵn sàng để bạn phân phối hoặc tích hợp vào dịch vụ hiện có.',
          buttons: [btn('Đăng ký tư vấn hợp tác', '#dang-ky', 'primary', 'arrow'), btn('{hotline}', 'tel:{hotlineRaw}', 'ghost', 'phone')],
          listStyle: 'check', listPlace: 'text', list: [],
          mediaType: 'collage', image: '', video: '', poster: '', mediaShape: 'square', mediaAlt: '',
          images: ['/img/ring-pro.webp', '/img/scale.webp', '/img/app-ai.webp'].map(src => ({ src, caption: '', alt: '' })) },
        { id: 'partner-who', type: 'features', align: 'center', style: 'iconcard', columns: 3, eyebrow: 'Ai có thể hợp tác', title: 'Phù hợp với nhiều mô hình kinh doanh', lead: '',
          items: [['building', 'Chủ doanh nghiệp', 'Quà tặng sức khoẻ cho nhân viên, khách hàng; chương trình phúc lợi chủ động.'],
            ['package', 'Nhà phân phối', 'Bổ sung dòng thiết bị sức khoẻ thông minh có app và nội dung đi kèm.'],
            ['dumbbell', 'Phòng tập Gym / Yoga', 'Đo thành phần cơ thể cho hội viên, theo dõi tiến trình tập luyện bằng dữ liệu.'],
            ['pill', 'Nhà thuốc', 'Mở rộng danh mục chăm sóc sức khoẻ chủ động bên cạnh dược phẩm.'],
            ['leaf', 'Cửa hàng thực phẩm healthy', 'Kết hợp dinh dưỡng và thiết bị đo lường — bán chéo, tăng giá trị đơn hàng.'],
            ['users', 'HLV / Chuyên gia dinh dưỡng', 'Theo dõi học viên từ xa bằng dữ liệu thật, đồng hành sát hơn với cộng đồng của bạn.']]
            .map(([icon, title, text]) => ({ icon, seal: '', title, text, fix: '' })) },
        { id: 'partner-benefits', type: 'features', bg: 'white', anchor: 'chinh-sach', align: 'center', style: 'cert', columns: 3,
          eyebrow: 'Quyền lợi đối tác', title: 'Minh bạch, đồng bộ, *có hệ thống hỗ trợ.*', lead: '',
          items: [['layers', 'Giải pháp trọn gói', 'Thiết bị (Meal Ring Active, Active Pro, Meal Fit Insight) + App the Meal + Khoá học — một hệ sinh thái khép kín, không phải ghép nhiều nhà cung cấp.'],
            ['file', 'Chính sách rõ ràng', 'Chính sách chiết khấu, thời hạn dịch vụ và điều khoản hợp đồng được gửi bằng văn bản trước khi ký.'],
            ['headset', 'Vận hành & hỗ trợ', 'Đồng hành từ tư vấn, đào tạo sản phẩm đến triển khai cho khách hàng của bạn.']]
            .map(([icon, title, text]) => ({ icon, seal: '', title, text, fix: '' })) },
        { id: 'partner-flow', type: 'steps', bg: 'white', tight: true, align: 'center', style: 'flow', eyebrow: '', title: 'Quy trình hợp tác', lead: '',
          items: [['Đăng ký', 'Gửi thông tin qua form bên dưới.'], ['Tư vấn', 'the.Meal liên hệ, tìm hiểu mô hình và gửi chính sách.'], ['Ký hợp đồng', 'Thống nhất điều khoản, thời hạn và quyền lợi.'], ['Triển khai', 'Nhận hàng, đào tạo và bắt đầu kinh doanh.']]
            .map(([title, text]) => ({ kicker: '', title, text })) },
        { id: 'partner-form', type: 'contactForm', anchor: 'dang-ky', variant: 'text', formType: 'partner',
          eyebrow: 'Đăng ký đối tác', title: 'Trao đổi cùng đội ngũ the.Meal', lead: 'Để lại thông tin, chúng tôi sẽ liên hệ trong giờ làm việc để tư vấn mô hình hợp tác phù hợp.',
          formTitle: '', button: 'Gửi đăng ký hợp tác' }
      ]
    },
    {
      id: 'contact', path: '/lien-he', title: 'Liên hệ', desc: '', blocks: [
        { id: 'contact-head', type: 'pageHeader', crumbs: true, eyebrow: 'Liên hệ', title: 'Chúng tôi luôn sẵn sàng tư vấn',
          lead: 'Cần chọn size, so sánh sản phẩm hay mua số lượng lớn làm quà tặng doanh nghiệp? Để lại thông tin — the.Meal sẽ gọi lại cho bạn.' },
        { id: 'contact-form', type: 'contactForm', tight: true, variant: 'card', formType: 'contact', eyebrow: '', title: '', lead: '', formTitle: 'Gửi yêu cầu tư vấn', button: 'Gửi yêu cầu tư vấn' }
      ]
    },
    {
      id: 'news', path: '/tin-tuc', title: 'Tin tức', desc: '', blocks: [
        { id: 'news-head', type: 'pageHeader', crumbs: true, eyebrow: 'Tin tức & kiến thức', title: 'Sống khoẻ mỗi ngày', lead: '' },
        { id: 'news-empty', type: 'notice', tight: true, icon: 'news', title: 'Bài viết đang được chuẩn bị',
          text: 'Kiến thức về giấc ngủ, HRV, thành phần cơ thể và cách dùng thiết bị the.Meal sẽ sớm có tại đây.', buttons: [btn('Khám phá sản phẩm', '/san-pham')] }
      ]
    },
    policy('bao-hanh', 'Chính sách bảo hành', PENDING),
    policy('doi-tra', 'Đổi trả & đổi size', PENDING),
    policy('van-chuyen', 'Vận chuyển & giao nhận', PENDING),
    policy('thanh-toan', 'Hình thức thanh toán', '<p>the.Meal hỗ trợ hai hình thức thanh toán:</p><ul><li><b>Thanh toán khi nhận hàng (COD):</b> bạn kiểm tra hàng và thanh toán cho nhân viên giao hàng.</li><li><b>Chuyển khoản ngân hàng:</b> thông tin tài khoản và mã QR hiển thị ngay sau khi đặt hàng. Vui lòng ghi đúng mã đơn trong nội dung chuyển khoản.</li></ul>'),
    policy('bao-mat', 'Chính sách bảo mật', '<p>the.Meal chỉ thu thập thông tin cần thiết để xử lý đơn hàng (họ tên, số điện thoại, địa chỉ, email nếu có) và không chia sẻ cho bên thứ ba ngoài đơn vị vận chuyển.</p><p>Dữ liệu sức khoẻ trên ứng dụng the Meal được quản lý theo điều khoản riêng của ứng dụng.</p>')
  ]
});
