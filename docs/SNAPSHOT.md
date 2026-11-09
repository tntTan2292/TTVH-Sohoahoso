# SNAPSHOT – Đang làm tới đâu

> **Mỗi phiên làm việc (người hay AI) đọc file này ĐẦU TIÊN và CẬP NHẬT nó TRƯỚC KHI DỪNG**, kể cả khi dừng giữa chừng.
> Mở chat mới mà không biết đang làm gì → dán nội dung file này vào, hoặc nói "đọc `docs/SNAPSHOT.md` rồi làm tiếp".
> Giữ ngắn gọn: chỉ trạng thái hiện tại. Lịch sử đã xong chuyển sang `CHANGELOG.md`.

---

## 1. Trạng thái hệ thống
| Mục | Giá trị |
|---|---|
| Cập nhật lúc | 09/11/2026 — phiên Claude Code (viết tài liệu) |
| Nhánh / commit | `main` @ `ef54be3` (đã đẩy lên GitHub `tntTan2292/TTVH-Sohoahoso`) |
| Bản đang chạy | Apps Script **phiên bản 13** trên link chính `…MlRA/exec`; link phụ `…NIQ/exec` còn ở phiên bản 12 |
| Mã trên Apps Script khớp repo? | Có (bản 13 = `ef54be3`) |
| Mock | `node tools/test_mock.js` → **188 đạt, 0 lỗi** |
| Kiểm thử trên Sheet thật | **Chưa đầy đủ** (xem `HUONG_DAN_TRIEN_KHAI.md` mục E) |

## 2. Việc đang làm (dở dang)
> Ghi rõ: đang sửa gì, file nào, đã xong bước nào, còn bước nào. Nếu không có gì dở → ghi "Không".

- **Việc:** Viết bộ tài liệu chống mất chức năng (`docs/CHUC_NANG.md`, `docs/API.md`, `docs/SNAPSHOT.md`, `AGENTS.md`, `CLAUDE.md`, `CHANGELOG.md`).
- **Đã xong:** tạo đủ các file trên.
- **Còn lại:** chủ dự án đọc lại, commit + đẩy lên GitHub; (đề xuất) viết `tools/kiem_tra_giao_dien.js` tự kiểm tra các `id`/`call()` trong `CHUC_NANG.md` còn trong `Index.html`.

## 3. Việc tiếp theo (theo thứ tự ưu tiên)
1. Commit tài liệu và đẩy lên GitHub.
2. Viết `tools/kiem_tra_giao_dien.js` (chống mất chức năng ở giao diện — nơi hay bị mất nhất).
3. Kiểm thử trên Sheet thật theo bảng kiểm tra cuối `docs/CHUC_NANG.md` với 4 tài khoản.
4. Chuyển link phụ `…NIQ` lên phiên bản mới hoặc ngừng dùng.

## 4. Lỗi / chức năng bị mất đã biết (chưa sửa)
> Mỗi dòng: mô tả · mã chức năng (F-xx) · phát hiện ngày nào · ai phát hiện.

- (chưa ghi nhận — chủ dự án bổ sung các chức năng từng bị mất ở đây)

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
