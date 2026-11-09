---
name: update-code-sohoa
description: Dùng khi chủ dự án nói "UpdateCodeSohoa", "cập nhật code lên Apps Script/link", "triển khai phiên bản mới" hoặc "deploy" dự án Báo cáo ca Số hóa hồ sơ. Đưa apps-script/Code.gs, Index.html, appsscript.json ở main lên Apps Script và tạo phiên bản mới cho link chính, giữ nguyên link.
---

# UpdateCodeSohoa – triển khai mã lên Apps Script

Làm bằng **Claude in Chrome** (Chrome thật, đã đăng nhập Google), không dùng trình duyệt tích hợp. Chủ dự án không phải thao tác. URL trình soạn và link `/exec` đọc từ `deploy.local.md` ở gốc repo (chỉ trên máy, **không chép vào skill, không commit**).
Tiết kiệm quota: đọc trang bằng `javascript_tool` / `get_page_text`; chỉ chụp màn hình khi phải bấm nút theo tọa độ.

## Điểm phải DỪNG (báo chủ dự án, không tự xử lý)
1. `docs/SNAPSHOT.md` không ghi Opus **GO** cho đợt sắp triển khai.
2. `git status` bẩn, hoặc `main` chưa push.
3. `node tools/test_mock.js` hoặc `node tools/kiem_tra_giao_dien.js` còn lỗi.
4. Bản trên Apps Script **khác** bản đã triển khai lần trước, hoặc có file lạ (có người sửa tay) → liệt kê khác biệt, **không ghi đè**.
5. Gặp trang đăng nhập Google → nhờ chủ dự án đăng nhập.
6. Trình soạn mở dự án khác, hoặc không thấy bản triển khai kết thúc `…MlRA`.
7. Claude in Chrome chưa kết nối → báo, không chuyển sang cách khác.

## A. Kiểm tra trước
1. `git status` sạch, `git log origin/main..` rỗng.
2. `node tools/test_mock.js` (0 lỗi) và `node tools/kiem_tra_giao_dien.js` (0 lỗi).
3. Đọc SNAPSHOT: có GO của Opus cho đợt này.
4. Ghi lại commit `main` hiện tại và "commit bản đang chạy" (SNAPSHOT mục 1).

## B. Đối chiếu bản trên Apps Script
Mở URL trình soạn (đợi ~3 giây). Đọc từng file qua Monaco và tính băm (bỏ `\r`). **Công cụ chặn in chuỗi hex băm** ("BLOCKED: Base64") → nhúng băm mong đợi vào mã và chỉ in `true/false`; tên model là `file_1.js` (Code.gs), `file_2.html` (Index.html), `file_0.json` (manifest):
```js
async function sha(t){var b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t.replace(/\r/g,'')));return Array.from(new Uint8Array(b)).map(function(x){return ('0'+x.toString(16)).slice(-2)}).join('')}
var out={}; for (var m of monaco.editor.getModels()){ out[m.uri.path]=await sha(m.getValue()); } out
```
So với `git show <commit bản đang chạy>:apps-script/<file>` (tính băm cùng cách, ví dụ `sha256sum` sau khi bỏ `\r`). Khác hoặc có file lạ → DỪNG. Riêng `appsscript.json`: Apps Script tự định dạng lại (xuống dòng) nên băm có thể khác dù nội dung giống; so bằng `JSON.parse` + so sánh nội dung, và **không ghi đè manifest** nếu repo không đổi nó.

## C. Đẩy mã
1. Nạp nội dung file ở `main`: chạy server Python cục bộ `127.0.0.1:8765` (chỉ phục vụ `Code.gs`, `Index.html`, thêm header `Access-Control-Allow-Origin: *` và `Access-Control-Allow-Private-Network: true`), rồi trong trang `window.__nd[f] = await (await fetch('http://127.0.0.1:8765/'+f)).text()` và so băm với `main` **trước** `setValue` (đã chạy được, trang không chặn). Tắt server ngay sau khi xong, **chỉ** tiến trình đang nghe cổng 8765 (`Get-NetTCPConnection -LocalPort 8765`), không `taskkill` cả python.
2. `model.setValue(noiDung)` cho `file_1.js` và `file_2.html`, rồi Ctrl+S.
3. **Tải lại trang** (navigate lại URL trình soạn), đợi 3,5 giây, đọc lại model và tính băm: phải **trùng** bản ở `main`. Không trùng → dừng.

## D. Triển khai phiên bản mới (giữ link)
1. Nút **Triển khai** (góc trên phải) → mục **thứ hai** "Quản lý các tùy chọn triển khai" (mục đầu "Tùy chọn triển khai mới" là **sai**: nếu lỡ mở thì bấm Hủy). Có 2 bản đang hoạt động đều "Chưa có tên": xác nhận bản có ID kết thúc `…MlRA` (đọc `document.body.innerText`, chỉ in 5 ký tự cuối) → ✏️ (bút chì; **cạnh nó là biểu tượng Lưu trữ, không bấm**) → Phiên bản: **Phiên bản mới** → mô tả (ô nhập: dùng `find` + `form_input`, gõ phím trực tiếp không vào; mô tả không dấu để tránh lỗi gõ) → Triển khai → Xong.
2. Ghi **số phiên bản mới N** và **phiên bản cũ**.
3. **Không** "Triển khai mới", **không** Lưu trữ, không đụng `…NIQ`, không chạy `setup`, không sửa Google Sheet.
4. Mở link `/exec` bằng `navigate`: tiêu đề "Số hóa hồ sơ - Báo cáo ca", chụp thu nhỏ thấy màn hình đăng nhập. Không đăng nhập vào ứng dụng. Nội dung ứng dụng nằm trong iframe khác miền nên không đọc được bằng JS.

## E. Quay lui
Quản lý các tùy chọn triển khai → `…MlRA` → ✏️ → chọn **phiên bản cũ** → Triển khai. Ghi vào SNAPSHOT.

## F. Ghi tài liệu và báo cáo
- SNAPSHOT mục 1 ("Bản đang chạy" = phiên bản N, commit, ngày; "khớp repo" = Có) và mục 2; `CHANGELOG.md` ("Triển khai phiên bản N (commit …)"); `HUONG_DAN_TRIEN_KHAI.md` dòng Trạng thái. Không ghi URL `/exec` hay ID dự án.
- Báo cáo kênh B: phiên bản cũ → mới, kết quả đối chiếu B, băm C.3, kiểm D.4, cách quay lui, việc chủ dự án thử tiếp. Ghi "chưa xác minh" cho điều không tự kiểm được.

> Đã chạy thật lần đầu ngày 09/11/2026 (lên phiên bản 17). Số phiên bản hiện tại đọc ở hộp thoại Quản lý triển khai, không tin số ghi trong SNAPSHOT (lần này SNAPSHOT ghi 13, thực tế 16).
