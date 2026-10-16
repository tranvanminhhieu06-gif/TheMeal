# the.Meal — Website thương mại điện tử

Website bán **Meal Ring Active**, **Meal Ring Active Pro** và **Meal Fit Insight**. Viết bằng Node.js + Express, chỉ phụ thuộc một gói là `express`.

## Chạy thử trên máy
```bash
npm install
npm start            # http://localhost:3000
# hoặc: npm run dev  (tự khởi động lại khi sửa code)
```
Để bật trang quản trị: `ADMIN_USER=admin ADMIN_PASS=123456 npm start` rồi mở `/admin`.

## Cấu trúc
```
server.js              Express: các trang, API đặt hàng/liên hệ, admin, sitemap
src/config.js          Thông tin công ty, ngân hàng, phí ship  ← sửa ở đây
src/products.js        Dữ liệu 3 sản phẩm (giá, màu, size, thông số, ảnh)
src/views.js           Giao diện các trang (HTML render phía server, chuẩn SEO)
src/icons.js           Bộ icon SVG
public/css/style.css   Design system + toàn bộ giao diện
public/js/app.js       Giỏ hàng, slider, form, tab… (JS thuần, không thư viện)
public/img, fonts      Ảnh sản phẩm đã tối ưu WebP + font Be Vietnam Pro tự host
data/                  orders.json, contacts.json (tự tạo khi có đơn)
design-system/         MASTER.md — quy tắc màu, chữ, component
```

## Tính năng
- Trang chủ (banner 3 slide, sản phẩm, 6 chỉ số, app the Meal, so sánh Active/Pro, cân, size, chứng nhận, FAQ)
- Danh sách sản phẩm và chi tiết sản phẩm (chọn màu, size, số lượng; tab thông số, hướng dẫn chọn size, hướng dẫn kết nối)
- Giỏ hàng lưu trong trình duyệt → đặt hàng COD hoặc chuyển khoản (có mã VietQR nếu cấu hình ngân hàng)
- Server tính lại giá khi nhận đơn, không tin giá phía trình duyệt; có giới hạn tần suất gửi đơn
- Trang `/admin`: xem đơn, đổi trạng thái, xuất CSV. Có thể báo đơn mới qua Telegram
- SEO: meta/OG, JSON-LD Product/FAQ/Organization, `sitemap.xml`, `robots.txt`
- Chuẩn truy cập: tương phản AA, dùng được bằng bàn phím, nút ≥44px, tôn trọng `prefers-reduced-motion`

## Deploy lên Render
1. Đưa thư mục này lên GitHub.
2. Trên Render chọn New → Web Service. Build command: `npm install`, start command: `npm start`.
3. Khai báo biến môi trường theo `.env.example`.
4. Lưu ý: ổ đĩa của Render gói Free sẽ bị xoá khi deploy lại. Để giữ đơn hàng lâu dài, cần gắn Persistent Disk vào thư mục `data/` hoặc bật thông báo Telegram.

## Bản tĩnh trên GitHub Pages
Trang đang chạy tại https://tranvanminhhieu06-gif.github.io/TheMeal/
```bash
npm run build        # xuất HTML tĩnh ra thư mục gốc với BASE_PATH=/TheMeal
```
Đổi repo hoặc gắn domain riêng: đặt `BASE_PATH` và `SITE_URL` khi build (xem `scripts/build-static.js`).
Bản tĩnh không có server nên đơn hàng/liên hệ được gửi tới Google Apps Script → Google Sheet: làm theo `scripts/google-apps-script/README.md`, rồi dán URL vào `orderEndpoint` trong `src/config.js`.

## Còn cần bổ sung
Các chỗ đang thiếu dữ liệu hiện bằng nhãn cam (chỉ hiện khi `NODE_ENV` khác `production`):
mã số thuế, giờ làm việc, nội dung chính sách bảo hành/đổi trả/vận chuyển, đánh giá khách hàng, thông tin ngân hàng, chất liệu Active (thép hay titan), màu Active Pro, thời lượng pin của cân (90 hay 120 ngày).
