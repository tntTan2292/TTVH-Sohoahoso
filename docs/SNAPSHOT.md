# SNAPSHOT – Đang làm tới đâu

> **Mỗi phiên làm việc (người hay AI) đọc file này ĐẦU TIÊN và CẬP NHẬT nó TRƯỚC KHI DỪNG**, kể cả khi dừng giữa chừng.
> Mở chat mới mà không biết đang làm gì → dán nội dung file này vào, hoặc nói "đọc `docs/SNAPSHOT.md` rồi làm tiếp".
> Giữ ngắn gọn: chỉ trạng thái hiện tại. Lịch sử đã xong chuyển sang `CHANGELOG.md`.

---

## 1. Trạng thái hệ thống
| Mục | Giá trị |
|---|---|
| Cập nhật lúc | 09/11/2026 — phiên Claude Code (Opus): tài liệu, F-QL-10, prompt chuẩn hóa |
| Nhánh / commit | `main` @ `07618a0` + commit prompt chuẩn hóa (đã đẩy lên GitHub `tntTan2292/TTVH-Sohoahoso`) |
| Bản đang chạy | Apps Script **phiên bản 13** trên link chính `…MlRA/exec`; link phụ `…NIQ/exec` còn ở phiên bản 12 |
| Mã trên Apps Script khớp repo? | **Không** — repo có thêm F-QL-10 (`Index.html`), chưa triển khai. Bản 13 = `ef54be3` |
| Mock | `node tools/test_mock.js` → **190 đạt, 0 lỗi** |
| Kiểm thử trên Sheet thật | **Chưa đầy đủ** (xem `HUONG_DAN_TRIEN_KHAI.md` mục E) |

## 2. Việc đang làm (dở dang)
> Ghi rõ: đang sửa gì, file nào, đã xong bước nào, còn bước nào. Nếu không có gì dở → ghi "Không".

### 2a. CHUẨN HÓA QUY TRÌNH BÁO CÁO — bỏ nhập trùng (việc lớn, giao Sonnet)
- **Vấn đề:** báo cáo có quá nhiều thao tác nhập trùng (mỗi hộp gõ lại mã + số liệu ở Scan/Tách/OCR, chỉ 1 hộp mỗi lần gửi, nhận 2 tầng, 2 ô trang/tờ, form Nhập hộ là bản sao…), tốn thời gian.
- **Prompt giao việc:** `docs/prompts/PROMPT_SONNET_CHUAN_HOA_BAO_CAO.md` (đã liệt kê 10 điểm trùng D1–D10, ràng buộc, câu hỏi không được tự quyết).
- **Cách làm:** 2 giai đoạn. GĐ1: viết `docs/DE_XUAT_CHUAN_HOA_BAO_CAO.md` (đếm thao tác trước/sau, đề xuất P1, P2…) rồi **dừng chờ chủ dự án duyệt**. GĐ2: làm từng đề xuất đã duyệt, mỗi đề xuất một commit.
- **Trạng thái:** ☐ GĐ1 chưa bắt đầu · ☐ đề xuất đã duyệt · ☐ GĐ2 (ghi P nào xong ở đây)
- **Phiên tiếp theo:** đọc prompt trên rồi làm từ bước đang ☐ đầu tiên.

### 2b. F-QL-10 — tick "Scan kèm Tách" ở form Nhập hộ
- **Đã xong trong mã** (commit `07618a0`, mock 190/0, thử giao diện bằng mock).
- **Còn lại (chủ dự án làm):** dán `Index.html` lên Apps Script → Triển khai phiên bản mới trên link `…MlRA` (Quản lý triển khai → ✏️ → Phiên bản mới); thử thật: Tổ trưởng → Quản lý ca → Nhập hộ → Scan, tick, gửi → Nhật ký có 2 dòng SCAN + TACH loại NHẬP HỘ. Có thể gộp vào lần triển khai sau khi chuẩn hóa.

## 3. Việc tiếp theo (theo thứ tự ưu tiên)
1. **Chuẩn hóa quy trình báo cáo** (mục 2a) — giao Sonnet bằng prompt trong `docs/prompts/`.
2. Triển khai F-QL-10 lên Apps Script và thử thật (mục 2b).
3. Viết `tools/kiem_tra_giao_dien.js` (chống mất chức năng ở giao diện — nơi hay bị mất nhất).
4. Kiểm thử trên Sheet thật theo bảng kiểm tra cuối `docs/CHUC_NANG.md` với 4 tài khoản.
5. Chuyển link phụ `…NIQ` lên phiên bản mới hoặc ngừng dùng.

## 4. Lỗi / chức năng bị mất đã biết (chưa sửa)
> Mỗi dòng: mô tả · mã chức năng (F-xx) · phát hiện ngày nào · ai phát hiện.

- Tick "Scan kèm Tách" thiếu ở form Nhập hộ · F-QL-10 · 09/11/2026 · chủ dự án báo → **đã sửa trong mã, chưa triển khai**.

## 5. Quyết định đang chờ chủ dự án
- Hộp đã trả có còn được Tách file không.
- Số 571 trang "Tách file" ngày 05/11 ca tối (đã chuyển sang Tách) — cần Lãnh đạo xác nhận.
- Các file `PROMPT_*.md` ở gốc đã **cũ** (ví dụ ghi Quản lý chỉ có 2 khâu) — giữ làm lưu trữ hay chuyển vào `docs/prompts-cu/`.

---

## Mẫu cập nhật nhanh khi dừng giữa chừng
```
Cập nhật lúc: <ngày giờ> — <người/công cụ>
Đang làm: <việc>, mã chức năng <F-xx>
File đã sửa: <danh sách>   (đã commit? có/không — commit <mã>)
Đã xong: <các bước>
Còn lại: <các bước>
Mock: <x đạt / y lỗi>
Lưu ý cho phiên sau: <điều không được quên>
```
