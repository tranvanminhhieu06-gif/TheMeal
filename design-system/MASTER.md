# the.Meal — Design System (MASTER)

Nguồn sự thật cho toàn bộ giao diện website thương mại điện tử the.Meal.
Token được hiện thực trong `public/css/style.css` (khối `:root`).

## 1. Màu sắc (bảng màu chính do khách hàng cung cấp)

| Vai trò | Token | Hex | Dùng cho |
|---|---|---|---|
| Brand / CTA | `--green` | `#4BCE97` | Nền nút chính, nhấn, icon, viền active. **Không dùng làm màu chữ trên nền sáng** (1.89:1 – trượt WCAG) |
| Ink | `--navy` | `#0B1C3A` | Chữ chính, nền section tối, chữ trên nút xanh |
| Canvas | `--cream` | `#FAF9F6` | Nền trang |
| Green ink (phái sinh) | `--green-ink` | `#147A56` | Chữ xanh trên nền sáng (5.05:1 trên cream, 4.85:1 trên green-50 – đạt AA) |
| Green soft (phái sinh) | `--green-50` | `#E8F8F1` | Nền chip, badge, khối nhấn nhẹ |
| Surface | `--white` | `#FFFFFF` | Thẻ sản phẩm, form |
| Muted text | `--slate` | `#4A5568` | Chữ phụ (≥ 7:1 trên cream) |
| Line | `--line` | `#E6E3DC` | Viền, đường kẻ |
| Danger | `--red` | `#C2410C` | Lỗi form |

Cặp tương phản đã kiểm (design-critique):
- navy / cream **16.07:1** · navy / green **8.52:1** · green / navy **8.52:1** · white / green-ink **5.32:1** · green-ink / cream **5.05:1** · green-ink / green-50 **4.85:1**

## 2. Typography
- Font: **Be Vietnam Pro** (hỗ trợ tiếng Việt đầy đủ) — 400/500/600/700/800.
- Scale (clamp, mobile → desktop): Display 40→64 · H1 32→48 · H2 28→40 · H3 20→24 · Body 16 · Small 14 · Eyebrow 13 (uppercase, letter-spacing .14em).
- Line-height: tiêu đề 1.1–1.2, thân 1.6. Input ≥ 16px (chống auto-zoom iOS).

## 3. Spacing, bo góc, đổ bóng
- Spacing 4-pt: 4 8 12 16 24 32 48 64 96.
- Radius: 10 (input) · 16 (card) · 28 (khối lớn) · 999 (pill/nút).
- Shadow: `--sh-1` card nhẹ, `--sh-2` hover/nổi.

## 4. Component chính
- **Nút chính**: nền green, chữ navy, cao ≥ 48px, pill. Một nút chính mỗi viewport.
- **Nút phụ**: viền navy, nền trong suốt. **Link phụ**: chữ green-ink gạch chân khi hover.
- **Thẻ sản phẩm**: ảnh vuông nền trắng → tên → tagline → giá → nút "Thêm vào giỏ".
- **Chip chỉ số** (học theo ảnh báo giá): số thứ tự trong ô vuông bo xanh + tên + mô tả ngắn.
- **Form**: 1 cột, nhãn phía trên, lỗi ngay dưới ô (icon + chữ, không chỉ màu).

## 5. Chuyển động
- 150–250ms ease-out cho hover/focus; reveal khi cuộn 400ms; tôn trọng `prefers-reduced-motion`.
- Slider banner tự chạy 6s, có nút tạm dừng, dừng khi focus/hover.

## 6. Banner (hero)
3 slide HTML/CSS dùng ảnh thật:
1. **Meal Ring Active** — nền cream, vòng tròn sản phẩm + chip chỉ số nổi.
2. **Meal Ring Active Pro** — nền navy (điểm nhấn Von Restorff cho bản cao cấp).
3. **Meal Fit Insight** — nền xanh nhạt, cân + app.
Chữ nằm trong vùng an toàn 70% trung tâm; mobile xếp dọc (ảnh trên, chữ dưới).

## 7. Anti-pattern cần tránh
- Chữ #4BCE97 trên nền sáng · emoji làm icon · đánh giá/khách hàng giả · nhiều CTA chính cạnh tranh · khẩn cấp giả ("chỉ còn 2 sản phẩm").
