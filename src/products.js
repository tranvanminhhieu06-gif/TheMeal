// Dữ liệu sản phẩm — nguồn: ảnh báo giá + "Báo giá thiết bị chăm sóc sức khoẻ.pdf" + HDSD cân.
// Mục đánh dấu verify:true cần khách hàng xác nhận (tài liệu ghi khác nhau).
const RING_COLORS = [
  { id: 'den', name: 'Đen nhám', hex: '#1d1d20' },
  { id: 'bac', name: 'Bạc ánh kim', hex: '#cfd3d8' }
];
const RING_SIZES = ['7', '8', '9', '10', '11', '12'];

const products = [
  {
    id: 'meal-ring-active',
    slug: 'meal-ring-active',
    name: 'Meal Ring Active',
    category: 'Nhẫn thông minh',
    tagline: 'Nhỏ gọn, theo dõi sức khoẻ 24/7.',
    price: 1590000,
    badge: 'Bán chạy',
    image: '/img/ring-active.webp',
    dark: true,
    gallery: [
      { src: '/img/ring-active.webp', alt: 'Nhẫn Meal Ring Active màu đen nhám, mặt trong có cảm biến' },
      { src: '/img/life-bottle.webp', alt: 'Người dùng đeo nhẫn màu đen khi tập luyện' }
    ],
    colors: RING_COLORS,
    sizes: RING_SIZES,
    summary: 'Nhẫn nhỏ gọn theo dõi sức khoẻ liên tục 24/7. Kết hợp cùng AI the Meal, thiết bị giúp bạn hiểu cơ thể và cải thiện lối sống mỗi ngày.',
    highlights: ['2.7g', '5ATM', 'Pin 5–7 ngày', 'Size 7–12'],
    metrics: [
      ['Nhịp tim', 'Liên tục & khi nghỉ'], ['SpO₂', 'Nồng độ oxy máu'], ['Giấc ngủ', 'Cơ cấu & điểm ngủ'],
      ['Vận động', 'Bước chân & calo'], ['Căng thẳng / HRV', 'Biến thiên nhịp tim'], ['Nhiệt độ cơ thể', 'Theo dõi xu hướng']
    ],
    benefits: [
      'Theo dõi nhịp tim, giấc ngủ, vận động hằng ngày',
      'AI phân tích dữ liệu, gợi ý cải thiện thói quen',
      'Rung khi nhận thông báo',
      'Đồng bộ tự động với app the Meal'
    ],
    forWho: ['Sống khoẻ chủ động', 'Thể thao', 'Văn phòng', 'Phụ nữ', 'Người thích thiết bị nhỏ gọn, không màn hình'],
    specs: [
      ['Chất liệu', 'Thép không gỉ', true],
      ['Trọng lượng', '2.7g'],
      ['Chống nước', '5ATM (~50m)'],
      ['Thời gian dùng pin', '5–7 ngày'],
      ['Kích cỡ', 'Size 7 – 12'],
      ['Màu sắc', 'Đen nhám, Bạc ánh kim'],
      ['Kết nối', 'Bluetooth BLE · app the Meal (Android/iOS)'],
      ['Chứng nhận', 'CE-RED · FCC · RoHS']
    ]
  },
  {
    id: 'meal-ring-active-pro',
    slug: 'meal-ring-active-pro',
    name: 'Meal Ring Active Pro',
    category: 'Nhẫn thông minh · Cao cấp',
    tagline: 'Hiểu cơ thể sâu hơn mỗi ngày.',
    price: 2990000,
    badge: 'Cao cấp',
    featured: true,
    image: '/img/ring-pro.webp',
    dark: true,
    gallery: [
      { src: '/img/ring-pro.webp', alt: 'Nhẫn Meal Ring Active Pro hợp kim titan màu bạc' },
      { src: '/img/life-badminton.webp', alt: 'Người chơi cầu lông đeo nhẫn màu bạc' },
      { src: '/img/life-wrist.webp', alt: 'Nhẫn màu bạc trên tay người dùng' },
      { src: '/img/life-car.webp', alt: 'Đeo nhẫn khi lái xe' }
    ],
    colors: RING_COLORS,
    sizes: RING_SIZES,
    summary: 'Không chỉ là thiết bị theo dõi — Active Pro phân tích toàn diện, đưa ra khuyến nghị dinh dưỡng & lối sống, và cảnh báo sớm khi có dấu hiệu bất thường. Bản hợp kim titan cao cấp — pin bền hơn, phân tích sâu hơn.',
    highlights: ['Hợp kim titan', '3g', 'Chip Nordic nRF54L15', 'Size 7–12'],
    metrics: [
      ['Nhịp tim & SpO₂', 'Theo dõi liên tục'], ['Giấc ngủ', 'Chấm điểm mỗi đêm'], ['Căng thẳng & HRV', 'Cân bằng cảm xúc'],
      ['Vận động & Calo', 'Bước chân, năng lượng'], ['Nhiệt độ cơ thể', 'Theo dõi xu hướng'], ['AI hỗ trợ', 'Gợi ý cá nhân hoá']
    ],
    benefits: [
      'Phân tích toàn diện, cảnh báo sớm dấu hiệu bất thường',
      'Khuyến nghị dinh dưỡng & lối sống cá nhân hoá bằng AI',
      'Chip Nordic nRF54L15 + cảm biến GOODiX, gia tốc 6 trục',
      'Theo dõi sức khoẻ cả gia đình trên một app'
    ],
    forWho: ['Sống khoẻ chủ động', 'Thể thao', 'Content creator', 'Cần theo dõi sức khoẻ toàn diện', 'Quà tặng ý nghĩa'],
    specs: [
      ['Chất liệu', 'Hợp kim titan'],
      ['Trọng lượng', '3g'],
      ['Chip', 'Nordic nRF54L15'],
      ['Cảm biến', 'GOODiX + gia tốc 6 trục'],
      ['Chống nước', '5ATM (~50m)'],
      ['Thời gian dùng pin', '5–7 ngày'],
      ['Kích cỡ', 'Size 7 – 12'],
      ['Màu sắc', 'Đen nhám, Bạc ánh kim', true],
      ['Kết nối', 'Bluetooth BLE · app the Meal (Android/iOS)'],
      ['Chứng nhận', 'CE-RED · FCC · RoHS']
    ]
  },
  {
    id: 'meal-fit-insight',
    slug: 'meal-fit-insight',
    name: 'Meal Fit Insight',
    category: 'Cân thông minh',
    tagline: 'Một bước lên cân — đọc vị hơn 40 chỉ số cơ thể.',
    price: 1890000,
    badge: '8 điện cực',
    image: '/img/scale.webp',
    dark: false,
    gallery: [
      { src: '/img/scale.webp', alt: 'Cân Meal Fit Insight màu đen cùng app the Meal trên điện thoại' },
      { src: '/img/scale-stand.webp', alt: 'Người dùng đứng trên cân Meal Fit Insight' },
      { src: '/img/scale-handle.webp', alt: 'Cầm tay cầm điện cực để đo toàn thân' },
      { src: '/img/scale-app.webp', alt: 'Xem kết quả đo trên app khi đứng trên cân' },
      { src: '/img/scale-room.webp', alt: 'Đo thành phần cơ thể tại phòng khách' }
    ],
    colors: [{ id: 'den', name: 'Đen', hex: '#111318' }],
    sizes: [],
    summary: 'Cân thông minh 8 điện cực ứng dụng công nghệ phân tích trở kháng sinh học (BIA) cho kết quả thành phần cơ thể chính xác cao — đồng bộ tức thì với app the Meal, theo dõi tiến triển vóc dáng trực quan.',
    highlights: ['8 điện cực', '40+ chỉ số', 'Tải 180kg', 'Bluetooth'],
    metrics: [
      ['Cân nặng & BMI', 'Chuẩn từng gram'], ['Mỡ & nội tạng', 'Phân tích chuyên sâu'], ['Cơ bắp & xương', 'Sức mạnh nền tảng'],
      ['Nước cơ thể', 'Cân bằng thể chất'], ['Tuổi sinh học', 'Tuổi thật cơ thể'], ['Nhịp tim', 'Đo khi nghỉ ngay trên cân']
    ],
    benefits: [
      'Phân tích hơn 40 chỉ số: BMI, BMR, mỡ, mỡ nội tạng, cơ, nước, protein, xương…',
      '8 điện cực qua tay & chân, phân tích riêng 4 vùng cơ thể và thân người',
      'Tự bật & nhận diện người dùng — dùng chung cho cả gia đình',
      'Màn hình LED ẩn, mặt kính cường lực chống trượt, dễ vệ sinh'
    ],
    forWho: ['Gia đình', 'Người tập gym & giảm cân', 'Theo dõi vóc dáng', 'Người cao tuổi'],
    specs: [
      ['Model', 'CF586 (BLE)'],
      ['Điện cực', '8 điện cực (tay & chân)'],
      ['Chỉ số đo', '40+ chỉ số thành phần cơ thể'],
      ['Tải tối đa', '180kg / 396lb'],
      ['Kích thước', '340 × 320mm'],
      ['Chất liệu', 'Kính cường lực ITO + ABS'],
      ['Pin', 'Pin sạc 400mAh lithium — dùng đến 90 ngày', true],
      ['Kết nối', 'Bluetooth 5.0 · app the Meal (Android/iOS)'],
      ['Màu sắc', 'Đen'],
      ['Chứng nhận', 'CE · RoHS · FCC · ISO9001']
    ]
  }
];

const bySlug = Object.fromEntries(products.map(p => [p.slug, p]));
function publicProduct(p) {
  return { id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.image, dark: p.dark,
    colors: p.colors, sizes: p.sizes, category: p.category };
}
module.exports = { products, bySlug, publicProduct };
