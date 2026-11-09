# SNAPSHOT – Đang làm tới đâu

> **Mỗi phiên làm việc (người hay AI) đọc file này ĐẦU TIÊN và CẬP NHẬT nó TRƯỚC KHI DỪNG**, kể cả khi dừng giữa chừng.
> Mở chat mới mà không biết đang làm gì → dán nội dung file này vào, hoặc nói "đọc `docs/SNAPSHOT.md` rồi làm tiếp".
> Giữ ngắn gọn: chỉ trạng thái hiện tại. Lịch sử đã xong chuyển sang `CHANGELOG.md`.

---

## 1. Trạng thái hệ thống
| Mục | Giá trị |
|---|---|
| Cập nhật lúc | 09/11/2026 — Opus: thêm `docs/CHUAN_PROMPT.md` (chuẩn viết prompt) |
| Nhánh / commit | `main`, đã đẩy lên GitHub `tntTan2292/TTVH-Sohoahoso` (xem `git log -1`) |
| Bản đang chạy | Apps Script **phiên bản 13** trên link chính `…MlRA/exec`; link phụ `…NIQ/exec` còn ở phiên bản 12 |
| Mã trên Apps Script khớp repo? | **Không** — repo có thêm F-QL-10, P2 `ghiLo` + bảng nhiều hộp (`Code.gs` và `Index.html`), chưa triển khai. Bản 13 = `ef54be3` |
| Mock | `node tools/test_mock.js` → **220 đạt, 0 lỗi**; `node tools/kiem_tra_giao_dien.js` → 0 lỗi |
| Kiểm thử trên Sheet thật | **Chưa đầy đủ** (xem `HUONG_DAN_TRIEN_KHAI.md` mục E) |

## 2. Việc đang làm (dở dang)
> Ghi rõ: đang sửa gì, **ai làm (Opus/Sonnet/Antigravity — xem `docs/PHAN_CONG.md`)**, file nào, đã xong bước nào, còn bước nào. Nếu không có gì dở → ghi "Không".

### 2a. CHUẨN HÓA QUY TRÌNH BÁO CÁO — bỏ nhập trùng (việc lớn, giao Sonnet)
- **Vấn đề:** báo cáo có quá nhiều thao tác nhập trùng (mỗi hộp gõ lại mã + số liệu ở Scan/Tách/OCR, chỉ 1 hộp mỗi lần gửi, nhận 2 tầng, 2 ô trang/tờ, form Nhập hộ là bản sao…), tốn thời gian.
- **Prompt giao việc:** `docs/prompts/PROMPT_SONNET_CHUAN_HOA_BAO_CAO.md` (đã liệt kê 10 điểm trùng D1–D10, ràng buộc, câu hỏi không được tự quyết).
- **Cách làm:** 2 giai đoạn. GĐ1: viết `docs/DE_XUAT_CHUAN_HOA_BAO_CAO.md` (đếm thao tác trước/sau, đề xuất P1, P2…) rồi **dừng chờ chủ dự án duyệt**. GĐ2: làm từng đề xuất đã duyệt, mỗi đề xuất một commit.
- **Phân công** (`docs/PHAN_CONG.md`): GĐ1 đề xuất + GĐ2 code → **Sonnet**; đề xuất đụng cách tính số liệu/API → **Opus review** trước khi chủ dự án duyệt; phần đẹp giao diện của form mới → **Antigravity** sau khi Sonnet xong; trước triển khai → **Opus review GO/NO-GO**.
- **Trạng thái:** ☑ GĐ1 xong (Sonnet, 09/11/2026): `docs/DE_XUAT_CHUAN_HOA_BAO_CAO.md` — đề xuất P1–P7, câu hỏi Q1–Q7, chưa sửa dòng mã nào, **không tự chuyển GĐ2** · ☑ Opus review đề xuất (09/11/2026): **ĐẠT CÓ ĐIỀU KIỆN**, 4 yêu cầu R1–R4 ghi ở mục 7 của file đề xuất (R1 chặn: lô phải chỉ đọc NhatKy 1 lần; R2 chỉ gửi `soTo`; R3 gộp P1 vào P2; R4 `idLo` bắt buộc). Thứ tự: P0 → P2(+P1) → P4 → P6 → P5 → P7a → P3 · ☑ chủ dự án trả lời Q1–Q5 (09/11/2026, ghi ở mục 8 file đề xuất: giữ Nhận hộp + tick/gõ tay; bỏ Số trang; KHÔNG điền sẵn (bỏ P5); cho tick OCR; 10 hộp/lần, ghi phần đúng; **mã hồ sơ là thông tin chính**) · ☐ **Đợt 1 – Sonnet** (☑ P0 · ☑ P2(+P1) xong, chưa triển khai · ☐ P4 · ☐ P3) · ☐ Sonnet viết prompt Antigravity (nếu không có điểm phải dừng, `CHUAN_PROMPT.md` 3a) · ☐ Antigravity làm đẹp Đợt 1 · ☐ Opus review TỔNG THỂ Đợt 1 (một lần) · ☐ chủ dự án thử link thật · ☐ Đợt 2 (P6, P7a) · ☐ GĐ2 (ghi P nào xong ở đây) · ☐ Antigravity làm đẹp · ☐ Opus review trước triển khai
- **Phiên tiếp theo:** đọc prompt trên rồi làm từ bước đang ☐ đầu tiên.

### 2b. F-QL-10 — tick "Scan kèm Tách" ở form Nhập hộ
- **Đã xong trong mã** (commit `07618a0`, mock 190/0, thử giao diện bằng mock).
- **Còn lại (chủ dự án làm):** dán `Index.html` lên Apps Script → Triển khai phiên bản mới trên link `…MlRA` (Quản lý triển khai → ✏️ → Phiên bản mới); thử thật: Tổ trưởng → Quản lý ca → Nhập hộ → Scan, tick, gửi → Nhật ký có 2 dòng SCAN + TACH loại NHẬP HỘ. Có thể gộp vào lần triển khai sau khi chuẩn hóa.

## 3. Việc tiếp theo (theo thứ tự ưu tiên)
1. **Chuẩn hóa quy trình báo cáo** (mục 2a) — giao Sonnet bằng prompt trong `docs/prompts/`.
2. Triển khai F-QL-10 lên Apps Script và thử thật (mục 2b).
3. ~~Viết `tools/kiem_tra_giao_dien.js`~~ — xong (P0).
4. Kiểm thử trên Sheet thật theo bảng kiểm tra cuối `docs/CHUC_NANG.md` với 4 tài khoản.
5. Chuyển link phụ `…NIQ` lên phiên bản mới hoặc ngừng dùng.

## 4. Lỗi / chức năng bị mất đã biết (chưa sửa)
> Mỗi dòng: mô tả · mã chức năng (F-xx) · phát hiện ngày nào · ai phát hiện.

- Tick "Scan kèm Tách" thiếu ở form Nhập hộ · F-QL-10 · 09/11/2026 · chủ dự án báo → **đã sửa trong mã, chưa triển khai**.

## 5. Quyết định đang chờ chủ dự án
- **Chuẩn hóa báo cáo Q8:** Mã hồ sơ có bắt buộc khi hộp chưa xong không? (Đợt 1 mặc định: không bắt buộc, hiển thị nổi bật, nhắc khi trống.)
- Hộp đã trả có còn được Tách file không.
- Số 571 trang "Tách file" ngày 05/11 ca tối (đã chuyển sang Tách) — cần Lãnh đạo xác nhận.
- Các file `PROMPT_*.md` ở gốc đã **cũ** (ví dụ ghi Quản lý chỉ có 2 khâu) — giữ làm lưu trữ hay chuyển vào `docs/prompts-cu/`.

---

## Mẫu cập nhật nhanh khi dừng giữa chừng
```
Cập nhật lúc: <ngày giờ> — <Opus | Sonnet | Antigravity | chủ dự án>
Đang làm: <việc>, mã chức năng <F-xx>
File đã sửa: <danh sách>   (đã commit? có/không — commit <mã>)
Đã xong: <các bước>
Còn lại: <các bước>
Mock: <x đạt / y lỗi>
Lưu ý cho phiên sau: <điều không được quên>
```
