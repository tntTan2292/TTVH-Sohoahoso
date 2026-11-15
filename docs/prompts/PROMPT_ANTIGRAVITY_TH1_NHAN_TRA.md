### Prompt cho Antigravity (Gemini)
DỰ ÁN: Báo cáo ca Số hóa hồ sơ
VIỆC: TH1 – làm đẹp giao diện Nhận từ TTLT / Trả cho TTLT (F-TH-01, F-TH-02, F-TH-03; mục 33–35)

Đọc: AGENTS.md → docs/SNAPSHOT.md → docs/CHUC_NANG.md (dòng F-TH-01, F-TH-02, F-TH-03, F-DB-17).

Mục tiêu giao diện (khổ 360px và máy tính):
1. **Tab Dashboard → Đối soát hộp:** bảng có hai cột **Nhận từ TTLT** và **Trả cho TTLT** (ngày · ca, dòng nhỏ tên người, dòng nhỏ ghi chú). Dòng có class `.ds-do` (thiếu Nhận / Tách xong chưa Trả / Đã trả thiếu Nhận / Trả khi chưa Tách xong) phải **đỏ nổi bật nhưng vẫn đọc được chữ**, cả giao diện sáng và tối; chip trạng thái (`DS_CHIP`: `ok`, `bad`, `warn`, `chip-mut`) rõ ràng. Trên điện thoại bảng đã là thẻ (`table-card-mobile` + `data-label`): ô trống "–" mờ, ô có ghi chú không tràn.
2. **Cột tick + thanh nút (chỉ Quản lý):** cột đầu có ô tick (`input[data-thc]`, tick tất cả `#dsChonHet`); phía trên bảng thanh `#dsThBar` có hai nút **Ghi Nhận từ TTLT (n)** (`#thGhiNhan`) và **Ghi Trả cho TTLT (m)** (`#thGhiTra`), nút `disabled` khi n/m = 0 phải nhìn thấy là đang tắt. Ô tick đủ lớn để chạm trên điện thoại. Cột này ẩn khi in (`noprint`).
3. **Hộp chọn ngày/ca `#modalTH`** (cùng phong cách hộp xác nhận `#modalXN`, class `xn-box`, `xn-nd`, `xn-nut`): ngày (`#thdNgay`), ca (`#thdCa`), nhãn ngày `#thdNgayLb` (đổi chữ theo Nhận/Trả), ghi chú (`#thdGhiChu`), lỗi (`#thdLoi`), hai nút `#thdHuy` / `#thdDongY`. Điện thoại: hai nút một hàng chia đôi, hộp không tràn màn hình.
3b. **Chip lọc "Cần xử lý"** (`data-dtt="CAN_XU_LY"`, nút thứ hai sau "Tất cả" trong `.ds-dem`): nhóm mọi dòng đỏ, số đếm lớn nhất thường là số cần chú ý nhất; khi `.on` phải rõ; nên có sắc đỏ nhẹ (khác các chip trạng thái thường) để người dùng thấy đó là chip quan trọng.
4. **Thông báo kết quả `#dsMsg`** (dưới khung chọn ngày của Đối soát): dùng lại kiểu `.msg ok/warn/err` đã có; có thể dài (liệt kê tối đa 6 hộp bị bỏ vì ngày vô lý), không tràn ngang trên 360px.
5. **Thanh cảnh báo đỏ ở tab Quản lý ca `#thQl`** (`.msg.err.th-canhbao`, có chữ đậm số hộp và **một** nút `#thNhan` "Xem hộp cần xử lý" mở Đối soát với chip Cần xử lý): nhìn là thấy ngay đầu tab, không che nút khác; điện thoại nút xuống dòng gọn.
6. **Form Nhận từ TT Lưu trữ / Trả hộp:** nút **"Điền tất cả hộp gợi ý (N)"** (`#fDien`, trong `#fDienBox`) nằm gọn dưới ô mã hộp, không quá nổi hơn nút Gửi.

Giữ nguyên (không đổi tên/xóa): hàm `dashDsBang`, `dsNhanTra`, `dsLoc`, `dsCsv`, `thBang`, `thHoi`, `thGhi`, `thCan`, `thChon`, `thQuanLy`, `thMoDoiSoat`, `hoiXacNhan`; biến `DS_TT`, `DS_CHIP`, `DS_DO`, `TH_CHON`, `TH_DANG`; mọi `id`/`data-*` ở trên (`data-thc`, `data-dtt`, `data-label`); các `call('...')`.
Chỉ sửa CSS (và class/HTML tĩnh nếu cần) trong apps-script/Index.html, sửa tại chỗ. KHÔNG sửa Code.gs. Không đụng logic JS.
KHÔNG viết lại cả file. KHÔNG đổi tên hàm JS, id, call('...'), trường dữ liệu.
Cần thêm dữ liệu hoặc logic từ máy chủ: dừng, báo lại, không tự làm.

KHÔNG mở trình duyệt, KHÔNG tìm kiếm web, KHÔNG chụp màn hình, KHÔNG chạy dev server hay preview. Chỉ đọc và sửa file trong thư mục dự án. Không đọc lại cả Index.html nhiều lần: tìm đúng đoạn rồi sửa tại chỗ.

Kiểm tra (duy nhất): node tools/test_mock.js (0 lỗi) và node tools/kiem_tra_giao_dien.js (0 lỗi); git diff --stat không xóa hàng loạt dòng Index.html.
Xong: commit, push, cập nhật SNAPSHOT. Báo cáo kênh B: khối đã đổi (mô tả bằng lời), id/hàm đã giữ, kết quả 2 lệnh kiểm tra.
