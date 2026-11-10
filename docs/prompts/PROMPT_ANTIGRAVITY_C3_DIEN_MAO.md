# Phiếu C3 (mục 25): Diện mạo đăng nhập và toàn hệ thống

Người làm: Antigravity. Chỉ sửa `apps-script/Index.html`. Opus viết 10/11/2026.

**Lý do:** chủ dự án xem bản thật, chức năng ổn nhưng chê: đăng nhập xấu, ô tìm kiếm thừa sau khi đã chọn, chữ xấu, màu nhợt, không có hiệu ứng. Mã hiện chỉ có đúng 1 `@keyframes` (vòng quay chờ), nền `#f8fafc`, bóng đổ 4–8%: đúng như chủ dự án nói.

**Cấm:** đổi `id`, hàm JS, `call()`, logic. Riêng màn đăng nhập được đổi HTML bao ngoài. Các màn khác chỉ đổi màu, bóng, hiệu ứng, KHÔNG đổi kích thước và bố cục (giữ nguyên C2 cho 360px).

## A. Màn đăng nhập (`#vLogin`) và đổi PIN (`#vPin`)
1. **Khung:** `#vLogin` thành cả màn hình: `position:fixed; inset:0; overflow-y:auto; display:flex; align-items:center; justify-content:center; padding:24px 16px`, nền `linear-gradient(135deg,#0b1f4b 0%,#1e40af 55%,#6d28d9 100%)`. Bỏ `class="card"` và style nội dòng của `#vLogin`. Bên trong thêm `<div class="lg-the">` chứa toàn bộ form: nền trắng, rộng tối đa 420px, bo 20px, bóng `0 24px 60px rgba(2,6,23,.45)`. Giữ lớp `.hide` hoạt động (`.hide` đã có `!important`). `#vPin` làm cùng kiểu.
2. **Đầu thẻ:** logo gradient có quầng sáng nhẹ, tiêu đề 24px đậm 800 "Số hóa hồ sơ" (viết hoa đúng tiếng Việt, không "Số Hóa Hồ Sơ"), dòng phụ "Bưu điện TP Huế · Báo cáo ca", rồi `#loginInfo`.
3. **Ô tìm kiếm:** đưa `#lgSearch` xuống DƯỚI danh sách tên, gói trong `<details class="lg-tim"><summary>Không thấy tên? Tìm theo tên hoặc mã</summary>…</details>`. Mặc định đóng. Không thêm JS. Bỏ nhãn "Tìm kiếm tên hoặc mã HRM".
4. **Nhãn bước:** bỏ chữ IN HOA và dấu gạch "Bước 1 –". Thay bằng số trong vòng tròn nhỏ màu `#1e40af` + chữ thường đậm 600 cỡ 14: "① Đơn vị của bạn", "② Chạm vào tên", "③ Mã PIN".
5. **Thẻ tên `.lg-nguoi`:** MỘT dòng, tên bên trái, mã bên phải chữ nhỏ (`display:flex; justify-content:space-between; align-items:center`), cao 46px, bỏ dấu ngoặc bằng CSS không được thì giữ. Nền trắng, viền `#dbe3f0`. Rê chuột: viền xanh, nhích sang phải 2px. Đang chọn: nền `linear-gradient(90deg,#1e40af,#6d28d9)`, chữ trắng.
6. **Danh sách `.lg-nguoi-box`:** thanh cuộn mảnh 6px bo tròn, cao tối đa đủ 5 dòng trọn vẹn, không có dòng bị cắt ngang ở mép dưới bằng cách đặt chiều cao = 5 dòng + khoảng cách.
7. **Ô PIN `#lgPin`:** `::placeholder` cỡ 14px, `letter-spacing:0`, đậm 500, màu `#94a3b8`; đổi chữ gợi ý thành "Nhập 4–6 chữ số". Khi có số thì giữ chữ lớn giãn cách.
8. **Nút `#lgBtn`:** cao 50px, gradient như thẻ đang chọn, bóng màu `0 10px 24px rgba(30,64,175,.4)`, rê chuột nổi 1px, có vệt sáng lướt qua, nhấn thu `scale(.98)`.
9. **Ô ghi chú cuối thẻ:** chữ 12px, nền trong, không viền, căn giữa.

## B. Màu toàn hệ thống (sửa biến trong `:root`, sửa cả khối tối)
- Nền sáng: `--bg:#eaf0fb`, `--card-sub:#f3f6fc`, `--line:#d8e1f0`, `--mut:#55657e`.
- Chính: `--pri:#1e40af`, `--pri-hover:#1e3a8a`, `--pri-sub:#e6edff`.
- Khâu (đủ tương phản với chữ trắng): `--col-scan:#1d4ed8`, `--col-tach:#0f766e`, `--col-ocr:#6d28d9`, `--col-nhan:#b45309`, `--col-tra:#be123c`.
- Bóng: `--shadow-sm:0 2px 6px rgba(15,23,42,.08)`, `--shadow:0 8px 20px rgba(15,23,42,.10)`, `--shadow-md:0 16px 36px rgba(15,23,42,.14)`.
- Khối tối: giữ tối, tăng độ bão hòa tương ứng, chữ vẫn đọc rõ.

## C. Khối "điều hành" (MỘT khối CSS thêm ngay trước `</style>`, chỉ màu, bóng, hiệu ứng)
- Thanh đầu trang (chứa `#hName`): nền gradient như màn đăng nhập, chữ trắng, nút `#btnOut` viền trắng mờ.
- `.tabs button.on` và tab con `.dtabs` đang chọn: nền gradient, chữ trắng, bóng màu.
- `.kpi-scan`, `.kpi-tach`, `.kpi-ocr` (và nhận, trả nếu có lớp): nền gradient đậm theo màu khâu, số và nhãn trắng, bỏ viền trên.
- `.card`: không viền, dùng `--shadow`. Tiêu đề bảng `th`: nền `--pri-sub`, chữ `--pri`. Dòng bảng rê chuột đổi nền.
- `.chip.ok`, `.warn`, `.bad`: màu đặc hơn.

## D. Hiệu ứng (tất cả đặt trong `@media (prefers-reduced-motion: no-preference)`)
- `lgVao`: thẻ đăng nhập trồi lên + hiện dần, 450ms.
- `noiLen`: `.card`, `.kpi`, `.tile` hiện dần + trồi 10px, 300ms, `animation-fill-mode:backwards`, lệch nhịp 40ms bằng `:nth-child` cho 6 phần tử đầu.
- Rê chuột `.card`, `.kpi`, `.tile`: nổi 2px, tăng bóng, `transition:.2s`.
- Mọi `button`: nhấn `scale(.97)`, `transition:.15s`.
- Ô nhập khi focus: quầng `0 0 0 3px rgba(30,64,175,.2)`.
- `.chip.ok` của ca đang mở: nhịp sáng nhẹ 2 giây (nếu không tách riêng được thì bỏ).
- Chữ "Đang tải…" trong `.empty-state`: nhấp nháy mờ nhẹ.
- Chỉ animate `opacity`, `transform`, `box-shadow`. Tối đa 500ms (trừ nhịp sáng). Không đặt `transform` lên `.wrap`, `#vApp`, `#busy`, `#modalCT` (làm hỏng `position:fixed`).

## E. Font (chỉ làm khi prompt ghi "Font: CÓ")
Thêm trong `<head>` thẻ `<link>` Google Fonts `Be Vietnam Pro` các độ đậm 400;500;600;700;800 với `display=swap`, đặt `"Be Vietnam Pro"` đứng đầu `font` của `body` (giữ nguyên các font dự phòng). Sửa dòng thư viện ngoài trong `AGENTS.md`, ghi ngoại lệ: font này từ Google Fonts, chủ dự án đồng ý ngày 10/11/2026. Prompt ghi "Font: KHÔNG" thì bỏ qua cả mục E.

## Kiểm tra và báo cáo
`node tools/test_mock.js` và `node tools/kiem_tra_giao_dien.js`: 0 lỗi, số kiểm tra không giảm. `git diff --stat`: `Index.html` không xóa hàng trăm dòng. Thêm một dòng `CHANGELOG.md`, cập nhật `docs/TIEN_DO_PO.md` mục 25 và `docs/SNAPSHOT.md`. Một commit `C3: dien mao dang nhap va he thong`, push. Không có thay đổi logic thì không cần Opus review lại; chủ dự án nghiệm thu trên link.
