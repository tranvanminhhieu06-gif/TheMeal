# Nhận đơn hàng từ GitHub Pages vào Google Sheet

GitHub Pages chỉ phục vụ file tĩnh, không chạy được `server.js`. Bản tĩnh gửi đơn hàng và form liên hệ tới một Web App Google Apps Script, Web App này ghi vào Google Sheet và (tuỳ chọn) gửi email báo đơn mới.

Chưa cấu hình bước này thì bản tĩnh **không nhận đơn online**: khách bấm "Đặt hàng" sẽ thấy thông báo chưa gửi được kèm hotline/Zalo (không còn báo "đặt hàng thành công" giả nữa).

## Cài đặt (khoảng 5 phút)

1. Tạo một Google Sheet mới, ví dụ "the.Meal — Đơn hàng".
2. Trong Sheet: **Tiện ích mở rộng → Apps Script**.
3. Xoá code mẫu, dán toàn bộ nội dung `Code.gs` vào. Điền `NOTIFY_EMAIL` nếu muốn nhận mail báo đơn mới.
4. Bấm **Triển khai → Tùy chọn triển khai mới**:
   - Loại: **Ứng dụng web**
   - Thực thi dưới danh nghĩa: **Tôi**
   - Ai có quyền truy cập: **Bất kỳ ai**
5. Cấp quyền khi Google hỏi, rồi sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).
6. Mở `src/config.js`, dán URL vào dòng `orderEndpoint: env.ORDER_ENDPOINT || 'DÁN_URL_VÀO_ĐÂY'`.
7. Build lại rồi đẩy lên GitHub:
   ```bash
   npm run build
   ```

Các tab "Don hang" và "Lien he" sẽ tự được tạo khi có đơn/liên hệ đầu tiên.

## Trang quản trị `/admin` (không cần chạy server)
Trang `https://phinfit.com/admin` đọc đơn hàng, yêu cầu tư vấn từ Sheet và cho đổi trạng thái đơn, tải CSV.

1. Trong Apps Script: **Cài đặt dự án (biểu tượng bánh răng) → Thuộc tính tập lệnh → Thêm thuộc tính**.
2. Tên: `ADMIN_KEY`, giá trị: một mật khẩu dài, khó đoán (ít nhất 12 ký tự). **Không** ghi mật khẩu vào `Code.gs` vì repo công khai.
3. Nếu đã triển khai từ trước: **Triển khai → Quản lý triển khai → Chỉnh sửa → Phiên bản mới** để cập nhật code.
4. Mở `/admin`, nhập mật khẩu. Tick "Ghi nhớ trên máy này" chỉ trên máy riêng của bạn.

Sai mật khẩu quá 10 lần trong 15 phút thì trang quản trị bị khoá tạm 15 phút. Đổi mật khẩu: sửa giá trị `ADMIN_KEY`, có hiệu lực ngay.

## Lưu ý
- Sửa `Code.gs` xong phải **Triển khai → Quản lý triển khai → Chỉnh sửa → Phiên bản mới** thì thay đổi mới có hiệu lực (URL giữ nguyên).
- Đổi giá, màu hoặc size trong `src/products.js` thì sửa `PRODUCTS` trong `Code.gs` cho khớp, vì giá trong Sheet được tính lại từ đó.
- Kiểm tra nhanh: mở URL Web App trên trình duyệt phải thấy `{"ok":true,...}`.
