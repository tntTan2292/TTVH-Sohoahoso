# Đề xuất F-FILE-01: Tách file và OCR tính theo SỐ FILE (26/11/2026)

**Yêu cầu chủ dự án (26/11/2026):** theo quy định, Tách file và OCR tính theo **số file**, không tính theo trang/tờ như Scan.
- Tách file (đã xong): quy đổi toàn bộ về **102.995 file**.
- Mục tiêu Tách file và OCR = **102.995 file**. Tiến độ OCR = số file OCR đã báo cáo / 102.995.
- OCR: tạm lấy số hiện tại (đang là tờ) chia 102.995 để ra %; Quản lý điều chỉnh lại sau.
- Từ tối 26/11: báo cáo cá nhân, báo cáo hộ, báo cáo nhóm của khâu Tách file và OCR nhập **Số file** thay cho Trang/Tờ, có ghi chú "khâu OCR chỉ báo cáo số file thực hiện".
- Scan giữ nguyên: tính theo tờ, mục tiêu 175.000 tờ.

## Hiện trạng (mã nguồn)
- `Code.gs`: mỗi bản ghi tính `dv = SoTo > 0 ? SoTo : SoTrang` cho cả 3 khâu (`nhatKyRows_`, dòng ~1732). Tiến độ 3 khâu cùng chia `MUC_TIEU_TO = 175000` (dòng ~1995). Số đầu kỳ 02–08/11 (tab `DauKy`, `DauKyNguoi`) đều là tờ.
- `Index.html`: form báo cáo cá nhân (`fTrang`/`fTo`), báo cáo hộ (`hoTrang`/`hoTo`), báo cáo theo lô (`data-k="to"`), sửa bản ghi (`eTrang`/`eTo`), Dashboard (vòng tiến độ, ca, ngày, biểu đồ, tab Nhân sự, xuất Đối soát) đều ghi chữ "tờ" cho cả 3 khâu.

## Phương án
### Dữ liệu (`Code.gs`)
1. **Cột mới `SoFile`** thêm vào **cuối** tab `NhatKy` (tự thêm cột cho Sheet cũ như cách đã làm với `ThuTu` ở `NhanSu`). Không đổi cột cũ, không sửa dữ liệu cũ.
2. Khâu TACH/OCR: bản ghi **có `SoFile`** → tính theo file. Bản ghi cũ (không có `SoFile`) giữ nguyên tờ trong lịch sử, **không cộng** vào tổng file (đã được thay bằng số quy đổi ở mục 3).
3. **Số quy đổi do Quản lý chỉnh** (lưu `ScriptProperties`, khóa `QUY_DOI_FILE`, ghi `LogHeThong` mỗi lần đổi):
   - `mucTieuFile` = 102.995
   - `tachFileCu` = 102.995 (Tách file trước khi đổi cách tính)
   - `ocrFileCu` = để trống → **tạm** dùng tổng tờ OCR cũ (đầu kỳ + bản ghi cũ); Quản lý nhập số file thật khi có.
   - Action mới `luuQuyDoiFile` (chỉ TOTRUONG/TOPHO/ADMIN), trả kèm trong dữ liệu Dashboard.
4. Tiến độ: Tách = `tachFileCu` + file Tách mới; OCR = `ocrFileCu` (hoặc tờ cũ tạm) + file OCR mới; cả hai chia `mucTieuFile`. Scan không đổi.
5. Kiểm tra nhập: TACH/OCR bắt buộc `SoFile ≥ 1`, không bắt Trang/Tờ. Scan giữ như cũ. Ô "Scan kèm Tách file" phải nhập thêm Số file.

### Giao diện (`Index.html`, sửa tại chỗ, giữ hàm và `id` cũ)
6. Form cá nhân / hộ / theo lô / sửa bản ghi: khi khâu là Tách file hoặc OCR → ẩn Số trang, Số tờ; hiện **Số file**; dòng ghi chú đỏ: *"Khâu Tách file và OCR chỉ báo cáo SỐ FILE thực hiện"*.
7. Dashboard: vòng tiến độ Tách/OCR ghi "file", mục tiêu 102.995 file; Scan vẫn "tờ / 175.000". Có ô Quản lý chỉnh số quy đổi.
8. Các bảng ca / ngày / nhân sự / biểu đồ: cột Tách, OCR ghi đơn vị "file" (từ ngày đổi); ngày trước đó ghi chú "trước 26/11 là tờ". Năng suất "tờ/giờ" chỉ còn tính Scan (cộng tờ với file là sai).

### Kiểm tra
- `tools/test_mock.js`: thêm kiểm tra tiến độ theo file, bắt `SoFile` cho TACH/OCR, `luuQuyDoiFile` chặn Tổ viên; 0 lỗi, số kiểm tra không giảm.
- Cập nhật `docs/CHUC_NANG.md`, `docs/API.md`, `CHANGELOG.md`, `docs/SNAPSHOT.md`, `docs/TIEN_DO_PO.md` (mục 36).

### Chia đợt để kịp tối nay
- **Đợt gấp (tối 26/11):** mục 1–7 (nhập số file + tiến độ đúng + Quản lý chỉnh số).
- **Đợt sau:** mục 8 (đổi đơn vị toàn bộ bảng/biểu đồ, năng suất, xuất Excel).
