# Phiếu giao việc: sửa lỗi mã hộp bị Google Sheets đổi thành ngày

> Opus viết 10/11/2026. Developer: **Claude Code (Sonnet)**. Mức kiểm tra: **L2** (đụng hàm ghi dùng chung). Ưu tiên 1: đang làm hỏng dữ liệu thật.
> Căn cứ: SNAPSHOT mục 4 (dòng "LỖI DỮ LIỆU – ƯU TIÊN 1"), ảnh của chủ dự án.

## Hiện tượng
Bảng "Chi tiết từng lần báo cáo": dòng **Nhận hộp** của hộp `02.01.85`, `02.01.84` hiện mã hộp là `Wed Jan 02 1985 07:00:00 GMT+0700 (Giờ Đông Dương)`. Dòng Scan/Tách cùng hộp hiện đúng `02.01.85`.

## Nguyên nhân (Opus đã xác minh)
- `append_` (Code.gs, dùng cho Scan/Tách/OCR) đặt number format `@` cho các cột văn bản của dòng trước khi `setValues`.
- `appendMany_` (Code.gs ~dòng 695; gọi ở `ghi_` nhánh NHAN/NHAN_NHOM/TRA và ở `taoMau_`) **không** đặt `@` → ô chưa sẵn định dạng văn bản bị Sheets tự đổi `02.01.85` thành Date.
- `read_` trả về đối tượng Date → `s_()` thành chuỗi "Wed Jan 02 1985…" → không khớp với mã của dòng Scan → sai gợi ý hộp, cảnh báo "chưa có trong danh sách đã nhận", sai số Nhận/Tồn trên Dashboard.

## Việc cần làm
1. **Chặn lỗi mới:** `appendMany_` đặt định dạng `@` cho các cột văn bản của khối dòng sắp ghi, giống `append_` (một lần cho cả khối, không lặp từng ô). Dùng **một** danh sách cột văn bản chung cho cả hai hàm (hiện `append_` có danh sách riêng bên trong hàm khác với `TEXT_COLS` toàn cục → gộp/thống nhất, đảm bảo có `MaHop`, `MaHoSo`, `Ngay`, `Ca`, `Nhom`, `MaHRM`, `NguoiNhap`, `ThanhVien`, `ID`).
2. **Đọc đúng dữ liệu đã hỏng (không ghi Sheet):** trong `read_`, nếu `MaHop` (và `MaHoSo`) là đối tượng Date thì đổi về chuỗi `dd.MM.yy` theo múi giờ `TZ` (ví dụ Date 02/01/1985 → `02.01.85`). Ghi chú trong mã: giả định mã gốc dạng `dd.mm.yy`.
3. **Sửa dữ liệu đã hỏng trên Sheet:** viết hàm `suaMaHopNgay()` **chỉ chủ Sheet chạy từ trình soạn** (dùng `ownerOnly_`), quét `NhatKy` cột `MaHop`/`MaHoSo` là Date → ghi lại chuỗi `dd.MM.yy` dạng văn bản (`@`), sao lưu các dòng sẽ sửa trước (cơ chế sao lưu sẵn có), ghi `log_`, trả về số ô đã sửa. **KHÔNG tự chạy hàm này** trên Sheet thật; ghi hướng dẫn chạy vào báo cáo và `HUONG_DAN_TRIEN_KHAI.md`.
4. **Mock:** thêm kiểm thử: (a) mock Sheet tự đổi chuỗi dạng `dd.mm.yy` thành Date khi ô không có định dạng `@` (giả lập hành vi Sheets) → Nhận hộp `02.01.85` qua `ghi` phải lưu đúng chuỗi; (b) dòng có `MaHop` là Date đọc ra `02.01.85`, khớp dòng Scan, `hopGoiY`/`dash_` đếm đúng; (c) `suaMaHopNgay` sửa đúng số ô, chạy lần 2 không sửa gì.
5. Kiểm tra: `node tools/test_mock.js` 0 lỗi (số kiểm tra tăng), `node tools/kiem_tra_giao_dien.js` 0 lỗi.

## Triển khai
Opus cho **GO triển khai ngay** khi bước 5 đạt (lỗi đang làm hỏng dữ liệu thật; thay đổi nhỏ, không đổi giao diện, không đổi cột). Triển khai bằng skill `update-code-sohoa`. Sau đó Opus xem lại trong lần review tổng thể kế tiếp.

## Không được
- Không đổi cột Sheet, không đổi giao diện, không đụng logic `dash_` ngoài việc đọc đúng mã hộp.
- Không chạy `suaMaHopNgay`, `setup` hay sửa tay Sheet thật.

## Báo cáo (kênh B)
Thay đổi, kết quả kiểm tra, phiên bản đã triển khai, **hướng dẫn 3 dòng cho chủ dự án chạy `suaMaHopNgay`** (mở trình soạn → chọn hàm → Chạy → xem số ô đã sửa).
