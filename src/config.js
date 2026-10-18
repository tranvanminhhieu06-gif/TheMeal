// Cấu hình cửa hàng. Các giá trị TODO: bổ sung khi có thông tin chính thức.
// Có thể ghi đè bằng biến môi trường hoặc file .env ở thư mục gốc app (xem .env.example).
// Hosting LiteSpeed/cPanel không luôn chuyển SetEnv cho Node, nên đọc thêm .env; biến môi trường thật vẫn được ưu tiên.
try { process.loadEnvFile(require('path').join(__dirname, '..', '.env')); } catch { /* không có .env hoặc Node < 20.12 */ }
const env = process.env;

module.exports = {
  siteName: 'Thiết bị thông minh 5.0',
  siteUrl: env.SITE_URL || 'https://phinfit.com',
  // URL nhận đơn hàng & form liên hệ khi chạy bản tĩnh (GitHub Pages).
  // Dán URL Web App của Google Apps Script (xem scripts/google-apps-script/README.md).
  // Để trống => bản tĩnh KHÔNG nhận đơn online, khách được hướng dẫn gọi/Zalo.
  orderEndpoint: env.ORDER_ENDPOINT || '',
  company: {
    name: 'Công ty Cổ phần the Meal VN',
    taxCode: env.TAX_CODE || '',                       // TODO: Mã số thuế
    address: 'Lô 12 DV09 KĐT Tây Nam Linh Đàm, phường Hoàng Liệt, Hà Nội',
    hotline: '0338 725 103',
    hotlineRaw: '0338725103',
    email: 'marketing@themeal.vn',
    website: 'themeal.vn',
    websiteUrl: 'https://www.themeal.vn/',
    facebook: 'https://facebook.com/themeal.vn',
    zalo: env.ZALO_URL || 'https://zalo.me/0338725103', // TODO: xác nhận số Zalo OA
    socials: [
      { icon: 'facebook', label: 'Fanpage the Meal', url: 'https://www.facebook.com/themeal.vn' },
      { icon: 'facebook', label: 'The Meal - Giải pháp chăm sóc sức khoẻ', url: 'https://web.facebook.com/themealsolution' },
      { icon: 'youtube', label: 'YouTube the Meal', url: 'https://www.youtube.com/@theMealvn' },
      { icon: 'youtube', label: 'YouTube the Meal - Books', url: 'https://www.youtube.com/@theMeal-Books' },
      { icon: 'tiktok', label: 'TikTok the Meal', url: 'https://www.tiktok.com/@themeal.vn' },
      { icon: 'threads', label: 'Threads the Meal', url: 'https://www.threads.com/@themeal.vietnam' }
    ],
    communities: [
      { icon: 'users', label: 'The Meal Wellness - Ăn Khỏe, Sống Đẹp', note: 'Nhóm Facebook', url: 'https://www.facebook.com/groups/themeal.vn' },
      { icon: 'users', label: 'SUY THẬN ĂN GÌ ?', note: 'Nhóm Facebook', url: 'https://www.facebook.com/groups/suythanangi' },
      { icon: 'tiktok', label: 'Ăn không nhầm', note: 'TikTok', url: 'https://www.tiktok.com/@ankhongnham' },
      { icon: 'tiktok', label: 'Ăn Ngon Giữ Dáng', note: 'TikTok', url: 'https://www.tiktok.com/@n.ngon.gi.dng' }
    ],
    mapEmbed: 'https://www.google.com/maps?q=KĐT+Tây+Nam+Linh+Đàm,+Hoàng+Liệt,+Hà+Nội&output=embed'
  },
  // Phí vận chuyển: null = "Nhân viên xác nhận khi gọi chốt đơn". Đặt số (VND) để tính cố định.
  shippingFee: env.SHIPPING_FEE ? Number(env.SHIPPING_FEE) : null,
  freeShipFrom: env.FREESHIP_FROM ? Number(env.FREESHIP_FROM) : null,
  // Chuyển khoản (VietQR). Để trống => ẩn mã QR, hiển thị hướng dẫn liên hệ.
  bank: {
    bin: env.BANK_BIN || '',            // VD: 970436 (Vietcombank)
    name: env.BANK_NAME || '',          // VD: Vietcombank
    account: env.BANK_ACCOUNT || '',
    holder: env.BANK_HOLDER || ''
  },
  admin: { user: env.ADMIN_USER || '', pass: env.ADMIN_PASS || '' },
  telegram: { token: env.TELEGRAM_BOT_TOKEN || '', chatId: env.TELEGRAM_CHAT_ID || '' }
};
