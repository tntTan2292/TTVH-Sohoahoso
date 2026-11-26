# Phiếu Sonnet: F-FILE-01 đợt 2 – Tách file và OCR chỉ tính FILE (mục 36)

Người nhận: **Sonnet**. Gốc: commit `c85cade` (đợt 1, Opus làm: tính file từ ca Tối 26/11, form chỉ nhập Số file, ô ⚙ Số quy đổi). Đọc trước: `docs/DE_XUAT_TINH_THEO_FILE.md`, dòng `F-FILE-01` trong `docs/CHUC_NANG.md`.

## Quyết định chủ dự án (26/11/2026, chat với Opus)
- **Q1.** Bỏ hẳn định nghĩa trang/tờ khỏi khâu **Tách file** và **OCR**: mọi chỗ hiển thị, nhập, sửa, xuất của hai khâu này chỉ còn đơn vị **file** (số file = số hồ sơ). Scan giữ nguyên tờ.
- **Q2.** Số liệu cá nhân/nhóm cũ (trước mốc) **để yên theo báo cáo**: không sửa Sheet, không tính lại, không quy đổi; vẫn cộng như đang cộng.
- **Q3.** Tổng quan (vòng tiến độ) **Tách file = 102.995 file = 100%**: không vượt quá mục tiêu khi có báo cáo Tách mới (lấy `min(tachFileCu + file mới, mucTieuFile)`); đã đủ 100% thì không hiện "Còn lại / Dự kiến xong".
- **Q4.** Tổng quan **OCR = số OCR đã làm lũy kế đến hết ca Tối 26/11/2026** (đúng con số đang hiện ở chế độ "tạm tính") **÷ 102.995**, cộng thêm file OCR báo cáo từ ca Sáng 27/11. Số này phải **chốt cố định** (không trôi khi sửa bản ghi cũ) và bỏ chip "Tạm tính".

## Việc (một việc một commit)
**A. Chốt số OCR (Q4)** – tập lệnh chạy một lần theo `docs/CHUAN_PROMPT.md` mục 3c, không action, không giao diện: `xemChotOcrQuyDoi()` (chỉ đọc, in số) và `apDungChotOcrQuyDoi()` (ghi `ocrFileCu` vào `QUY_DOI_FILE`, log `QUY_DOI_FILE`). Giá trị = phần OCR **trước mốc** (đầu kỳ + bản ghi trước ca Tối 26/11, đơn vị như đã báo cáo) – để cộng file ca Tối 26/11 trở đi thì đúng bằng "lũy kế đến hết ca Tối 26/11 + file sau đó", không đếm trùng. Chạy trong khóa, đọc thẳng Sheet (không qua đệm). Chủ dự án chạy sau 21:00 ngày 26/11.

**B. Tổng quan (Q3)** trong `dash_`: Tách chặn ở mục tiêu; hiển thị theo Q3.

**C. Bỏ tờ/trang ở Tách/OCR (Q1)** – rà toàn bộ (`grep -n "tờ\|trang"` trong `Index.html`, `SoTrang\|SoTo` trong `Code.gs`):
- Biểu đồ ngày/ca (`c4`, `c5`, `c6`), bảng nhóm, cá nhân, tab Nhân sự, khu "Ai nhập", tab Nhật ký Dashboard, chi tiết ô số liệu: Tách/OCR ghi "file", Scan ghi "tờ"; tiêu đề kiểu "tờ / ngày" đổi thành "Scan: tờ · Tách, OCR: file".
- **Năng suất:** không cộng tờ với file. Tách tờ/giờ (Scan) và file/giờ (Tách+OCR) riêng; sắp xếp không dựa trên tổng trộn.
- Form **sửa bản ghi** (`#eTrang`, `#eTo` – ẩn, không xóa id) và `suaBanGhi_`: Tách/OCR chỉ sửa Số file.
- CSV Đối soát: cột "Tách (file)", "OCR (file)".
- Không đổi số liệu Scan, không đổi dữ liệu cũ (Q2).

## Ràng buộc
- Không đổi cột Sheet, không xóa/đổi tên action, hàm, `id` cũ. Nếu đổi tên trường kết quả `dash_` thì giữ trường cũ (thêm trường mới).
- Mock: số kiểm tra không giảm; thêm kiểm tra cho A (xem trước không ghi; áp dụng ghi đúng số, chạy lại cho cùng số), B (Tách không vượt 100%), năng suất tách riêng. So `dash_` với `c85cade` trên các ngày trước 26/11: Scan **giống hệt**.
- Mức kiểm tra **L2** (đụng `dash_` dùng ở nhiều màn hình).
- Đây là **điểm phải dừng số 2** (`CHUAN_PROMPT.md` mục 3a: đổi cách tính Dashboard) → xong thì **không** viết prompt Antigravity; dừng, báo Opus review.

## Xong
Cập nhật `docs/CHUC_NANG.md` (dòng F-FILE-01), `docs/API.md`, CHANGELOG, SNAPSHOT, `docs/TIEN_DO_PO.md` mục 36. Commit, push. Báo cáo kênh B, kèm hướng dẫn chủ dự án chạy `xemChotOcrQuyDoi` → `apDungChotOcrQuyDoi`.
