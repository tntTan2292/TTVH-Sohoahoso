# Phiếu DK1 (mục 26): Kết quả 02–08/11 theo từng người

Người làm: Sonnet. Opus review bắt buộc (đụng số liệu và ghi Sheet thật). Opus viết 10/11/2026.

**Quyết định của chủ dự án (10/11/2026):**
- Lấy người theo tên trên Google Sheet "BÁO CÁO SẢN LƯỢNG SỐ HOÁ". Tên trên Sheet khác lịch TCHC thì **ưu tiên Sheet** (người làm có thể đã đổi ca).
- Ô hai tên là một nhóm, chia đều. Ô một tên tạm tính 100%; người phụ trách ca sẽ điền thêm người làm cùng, khi đó nhập lại.
- "Võ Thị Kim Chung" là Võ Thị Thùy Chung. Ô 102 tờ không tên để "Chưa rõ người", không chia.
- Dòng `DauKy` Tách 766 tờ ngày 08/11 chuyển từ ca Tối sang ca Ngày (không có ca Tối hôm đó).

**Dữ liệu:** `TaiLieu/DK1_DauKyNguoi.tsv` (61 dòng, đã kiểm tổng Scan 20.031, Tách 6.352, OCR 3.140). Cột: `Ngay, Ca, Buoc, SoTo, ThanhVien, Gio, TenGoc, Nguon, GhiChu`. `ThanhVien` là Mã HRM cách nhau dấu phẩy; `Gio` là giờ công từng người, cùng thứ tự: ca Tối 3; ca Ngày 4 hoặc 8 theo lịch; có tên trên Sheet mà không có lịch thì 4. File này không lên Git; **mock dùng tên, mã giả**.

**Bất biến:** `DauKy` và `NhatKy` không đổi ngoài đúng dòng 766 tờ. `dash_` không đổi: mock so trước/sau khi có đầy đủ `DauKyNguoi`, chỉ khác đúng phần ca của dòng 766 tờ.

## 1. Tab mới `DauKyNguoi`
Thêm vào `TAB`, cột như file. Tự tạo khi ghi (giống `donViTab_`). `ThanhVien`, `Gio`, `Ngay` phải định dạng `@` trước khi ghi (cùng loại lỗi `00109101,00109102` và `8,8` bị Sheets đổi thành số).

## 2. Action ghi `nhapDauKyNguoi { dong, apDung, xacNhan }` (chỉ ADMIN)
- Đầu hàm `memoClear_('DauKy')` và `memoClear_('NhanSu')` (bài học E1/E2).
- Kiểm từng dòng: `Ngay` trong `NGAY_BAT_DAU`…`DAU_KY_DEN`; `Ca` là Ngày hoặc Tối; `Buoc` là SCAN/TACH/OCR; `SoTo` nguyên dương; số phần tử `Gio` = số phần tử `ThanhVien`; mã có trong `NhanSu` **so khớp bỏ số 0 đầu**; `ThanhVien` trống chỉ khi `TenGoc` là "Chưa rõ người".
- Đối chiếu tổng theo (Ngay, Ca, Buoc) với `DauKy` đang có, coi dòng 766 tờ là ca Ngày. Lệch dòng nào báo dòng đó.
- Không `apDung`: trả bảng đối chiếu và danh sách lỗi, không ghi.
- `apDung`: cần `xacNhan:'DAUKY'`, còn lỗi thì từ chối. Sao lưu `DauKyNguoi` cũ (nếu có), thay toàn bộ, chuyển ca dòng 766 tờ nếu còn ở Tối (chạy lại không sinh lỗi), `log_`, `memoClear_` các tab đã ghi.

## 3. `thongKeNhanSu_`
- Cộng thêm các dòng `DauKyNguoi` trong khoảng ngày, dùng `congCaNhan_` (`To`, `DV` = `SoTo`; `Hs`, `Trang`, `Hop` = 0).
- Khóa ca dạng `ngay|Ca`. Ca "Ngày" không có trong `CA`: giờ phải lấy từ cột `Gio`, không qua `CA[...]`. Mỗi người, mỗi (ngày, ca) tính giờ một lần dù có nhiều dòng.
- `soCa`: ca Ngày 8 giờ tính 2, còn lại tính 1.
- Mã đọc ra cũng so khớp bỏ số 0 đầu với `NhanSu` (F-NS-11 có thể đổi dạng mã sau này).
- Dòng "Chưa rõ người" không vào `nguoi`, không vào `tong`; trả riêng `chuaRo { scanDV, tachDV, ocrDV }`.
- Trả thêm cờ `coDauKyNguoi` khi khoảng ngày có dữ liệu này.

## 4. Giao diện (khung thô, chỉ `Index.html`)
- Tab Dữ liệu: khung dán TSV `#dkDan`, nút Xem trước và Áp dụng (hỏi gõ `DAUKY`), bảng đối chiếu.
- Tab Nhân sự: khi `coDauKyNguoi`, thay ghi chú cũ bằng: "Số 02–08/11 lấy theo tên trên bảng cũ, đang chờ người phụ trách xác nhận; giai đoạn này không có số hồ sơ, số hộp." Có `chuaRo` thì thêm một dòng số tờ chưa rõ người. Dữ liệu người nhập qua `esc()`.

## 5. Kiểm tra và tài liệu
Thêm mock: ô hai tên chia đều; người có nhiều dòng cùng ca chỉ tính giờ một lần; ca Ngày không gây lỗi; chưa rõ người không vào tổng; tổng lệch thì từ chối; thiếu `xacNhan` từ chối; chạy lại không cộng dồn; tổ viên bị từ chối; mã khác số 0 đầu vẫn khớp; `dash_` như bất biến; khoảng ngày không chạm 02–08/11 thì `thongKeNhanSu_` giống hệt bản trước. Cập nhật `CHUC_NANG`, `API`, `CHANGELOG`, `SNAPSHOT`, mục 26 `TIEN_DO_PO`.

**DỪNG sau khi xong trong mã.** Không triển khai, không ghi Sheet thật, không viết prompt Antigravity. Báo cáo kênh B cho Opus.
