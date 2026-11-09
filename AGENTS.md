# Quy tắc cho mọi AI và người sửa dự án này

Dự án: **Báo cáo ca Số hóa hồ sơ – Bưu điện TP Huế** (Google Apps Script Web App + Google Sheet). Tổng quan: `README.md`.

## Đọc trước khi làm (theo thứ tự)
1. `docs/SNAPSHOT.md` — đang làm tới đâu, việc dở dang, việc tiếp theo.
2. `docs/CHUC_NANG.md` — mọi chức năng đang có. **Không được làm mất dòng nào.**
3. `docs/API.md` — hợp đồng giữa `Index.html` và `Code.gs`.
4. `HUONG_DAN_TRIEN_KHAI.md` — triển khai, vận hành, nghiệp vụ chi tiết.
5. `docs/PHAN_CONG.md` — **ai làm gì**: Opus = CTO điều phối, review, chỉ code việc khó; Sonnet = code; Antigravity (Gemini Flash 3.8) = giao diện, không sửa `Code.gs`. Nhận phải việc không đúng vai → dừng, ghi SNAPSHOT, báo chủ dự án.
6. `docs/CHUAN_PROMPT.md` — chuẩn viết prompt và chuẩn báo cáo. **Opus đọc trước khi viết bất kỳ prompt nào.** Sonnet/Antigravity báo cáo theo **kênh B** (mục 7). Việc trong prompt khác việc trong SNAPSHOT → dừng và báo.

Prompt giao việc **đang dùng** nằm ở `docs/prompts/` (SNAPSHOT ghi prompt nào đang chạy). Các file `PROMPT_*.md` ở gốc là prompt **cũ**, có chỗ đã sai so với hiện tại. Khi mâu thuẫn, tin `docs/` và mã nguồn.

## Mã nguồn chính thức
Chỉ `apps-script/Code.gs`, `apps-script/Index.html`, `apps-script/appsscript.json`. Các file trong `tools/` ngoài `build_khoi_tao.py`, `test_mock.js`, `kiem_tra_giao_dien.js` là script vá tạm, **không dùng làm nguồn**.

## Quy tắc chống mất chức năng
1. **Sửa từng phần, không viết lại cả file.** Cấm "thiết kế lại toàn bộ `Index.html`" bằng cách sinh file mới từ đầu. Đổi giao diện = sửa CSS/HTML tại chỗ, giữ nguyên hàm JS và `id`.
2. **Không xóa, không đổi tên** hàm, `id` phần tử, action, trường dữ liệu có trong `docs/CHUC_NANG.md` / `docs/API.md` nếu chưa được chủ dự án đồng ý. Nếu buộc phải đổi: sửa cả `Code.gs` + `Index.html` + tài liệu trong cùng commit.
3. **Một việc một commit**, ghi mã chức năng: ví dụ `F-BC-08: sửa ghi kèm Tách khi Scan lỗi`.
4. Trước khi sửa: `git status` phải sạch (hoặc biết rõ thay đổi đang dở là gì). Việc lớn: tạo nhánh mới, không sửa thẳng `main`.
5. Sau khi sửa, bắt buộc:
   - `node tools/test_mock.js` → `0 lỗi`, **số kiểm tra không giảm**. Thêm chức năng backend = thêm kiểm tra vào mock.
   - `node --check` cho `Code.gs` (chép sang `.js` tạm) và cho khối `<script>` của `Index.html`.
   - Xem `git diff --stat`: nếu `Index.html` bị xóa hàng trăm dòng mà việc chỉ là sửa nhỏ → **dừng lại, kiểm tra**.
   - Đi lại bảng kiểm tra cuối `docs/CHUC_NANG.md` cho các phần liên quan.
6. Thêm chức năng mới → thêm dòng vào `docs/CHUC_NANG.md` (và `docs/API.md` nếu có action/trường mới) **trong cùng commit**.
7. **Trước khi dừng (kể cả dừng giữa chừng): cập nhật `docs/SNAPSHOT.md`** theo mẫu ở cuối file đó, rồi commit.
8. Xong một việc: ghi một dòng vào `CHANGELOG.md`.

## Bảo mật
- Không đưa lên Git: file Excel/TSV (tên, Mã HRM, PIN tạm), `backup/`, `TaiLieu/` (đã có trong `.gitignore`).
- Không in PIN, `PinTam`, `PinHash` ra màn hình hay báo cáo.
- Không tự triển khai Apps Script hoặc sửa Google Sheet thật nếu chưa được yêu cầu.

## Phong cách mã
- `Code.gs`: `function`, `const/let`, hàm nội bộ có `_` cuối, thông báo lỗi tiếng Việt có dấu (`throw 'chuỗi'`).
- `Index.html`: một file HTML + CSS + JS, ES5 (`var`, `function`), dữ liệu người nhập luôn qua `esc()`, thư viện ngoài chỉ từ `cdnjs.cloudflare.com` (Chart.js 4.4.1).
- Giao diện tiếng Việt, số định dạng `vi-VN`.
