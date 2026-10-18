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

## Quản trị nội dung (`/admin`)
Đăng nhập bằng `ADMIN_USER` / `ADMIN_PASS`. Mọi trang được dựng từ **khối** chỉnh được, không cần sửa code:
- **Trang & khối:** thêm/sửa/xoá/ẩn khối, kéo thả đổi thứ tự, màu nền từng khối; thêm trang mới với đường dẫn tuỳ chọn.
- **Sản phẩm:** tên, giá, ảnh, màu, size, thông số… Đơn hàng luôn tính theo giá đang đăng.
- **Màu sắc:** bảng màu toàn website (có bộ màu mẫu). **Cài đặt chung:** logo, menu, liên hệ, mạng xã hội, chân trang, bảng size.
- **Thư viện ảnh:** tải ảnh/video lên `data/uploads/`. **Lịch sử:** 30 lần đăng gần nhất, khôi phục vào nháp.
- Mọi thay đổi tự lưu vào **bản nháp** (`data/content-draft.json`), xem trước ngay bên phải; chỉ khi bấm **Đăng lên website** mới ghi vào `data/content.json`.

Chưa đăng lần nào thì website dùng nội dung gốc trong `src/content-default.js`. Trong ô chữ: `*chữ*` để tô màu nhấn; `{hotline}`, `{email}`, `{gia:ma-san-pham}` tự chèn hotline, email, giá.
Sao lưu `data/` (gồm `content.json`, `history/`, `uploads/`, đơn hàng) định kỳ.

## Deploy lên hosting cPanel (Setup Node.js App) — phinfit.com
Chạy `server.js` trực tiếp: đơn hàng lưu trong `data/` trên hosting, không cần Google Sheet.

1. **Lấy code về hosting:** cPanel → **Git™ Version Control** → Create → Clone URL `https://github.com/tranvanminhhieu06-gif/TheMeal.git`, Repository Path `phinfit-app`.
   Thư mục app phải **khác** document root của domain (`phinfit.com`), nếu không Apache sẽ trả file HTML tĩnh thay vì chạy server.
2. **Tạo app:** cPanel → **Setup Node.js App** → Create Application:
   - Node.js version: 20 (hoặc ≥ 18) · Application mode: Production
   - Application root: `phinfit-app` · Application URL: `phinfit.com` · Startup file: `server.js`
   - Environment variables: `NODE_ENV=production`, `SITE_URL=https://phinfit.com`, `ADMIN_USER`, `ADMIN_PASS` (mật khẩu mạnh), tuỳ chọn `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`, `BANK_*` (xem `.env.example`)
   Nếu app không nhận biến (vd. `/admin` vẫn báo "chưa bật" — LiteSpeed không chuyển `SetEnv`), tạo file `phinfit-app/.env` theo mẫu `.env.example` (file này không lên GitHub, Update from Remote không ghi đè).
3. Bấm **Run NPM Install**, rồi **Restart**. (Thông báo lỗi "check availability of application has failed… text/html; charset=utf-8" là báo nhầm, app vẫn chạy.)
4. **DNS** (iNET): bản ghi `A` cho `@` → IP hosting (cPanel → Shared IP Address), `CNAME` cho `www` → `phinfit.com`.
5. **HTTPS:** cPanel → **SSL/TLS Status** → Run AutoSSL sau khi DNS đã trỏ về.

Cập nhật code: push lên GitHub → cPanel Git™ Version Control → Manage → **Update from Remote** → Setup Node.js App → **Restart**.
Sao lưu định kỳ `phinfit-app/data/` (orders.json, contacts.json) — đây là toàn bộ đơn hàng.

## Deploy lên Render
1. Đưa thư mục này lên GitHub.
2. Trên Render chọn New → Web Service. Build command: `npm install`, start command: `npm start`.
3. Khai báo biến môi trường theo `.env.example`.
4. Lưu ý: ổ đĩa của Render gói Free sẽ bị xoá khi deploy lại. Để giữ đơn hàng lâu dài, cần gắn Persistent Disk vào thư mục `data/` hoặc bật thông báo Telegram.

## Bản tĩnh trên GitHub Pages
Trang chạy tại https://phinfit.com/ (domain riêng, file `CNAME`).
```bash
npm run build        # xuất HTML tĩnh ra thư mục gốc cho https://phinfit.com (BASE_PATH rỗng)
```
Quay lại địa chỉ github.io: build với `BASE_PATH=/TheMeal SITE_URL=https://tranvanminhhieu06-gif.github.io` và xoá file `CNAME`.

DNS cho phinfit.com (tại nhà cung cấp tên miền):
- 4 bản ghi `A` cho `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- 1 bản ghi `CNAME` cho `www` → `tranvanminhhieu06-gif.github.io`
- Trên GitHub: Settings → Pages → Custom domain = `phinfit.com`, bật **Enforce HTTPS** khi chứng chỉ sẵn sàng.
Bản tĩnh không có server nên đơn hàng/liên hệ được gửi tới Google Apps Script → Google Sheet: làm theo `scripts/google-apps-script/README.md`, rồi dán URL vào `orderEndpoint` trong `src/config.js`.
Quản lý đơn trên bản tĩnh: mở `/admin` (https://phinfit.com/admin), đăng nhập bằng `ADMIN_KEY` đặt trong Apps Script.

## Còn cần bổ sung
Các chỗ đang thiếu dữ liệu hiện bằng nhãn cam (chỉ hiện khi `NODE_ENV` khác `production`):
mã số thuế, giờ làm việc, nội dung chính sách bảo hành/đổi trả/vận chuyển, đánh giá khách hàng, thông tin ngân hàng, chất liệu Active (thép hay titan), màu Active Pro, thời lượng pin của cân (90 hay 120 ngày).
