### Prompt cho Antigravity (Gemini)
DỰ ÁN: Báo cáo ca Số hóa hồ sơ
VIỆC: Đợt 1 chuẩn hóa báo cáo (SNAPSHOT 2a) – làm đẹp "Bảng báo cáo nhiều hộp" (F-BC-18, F-BC-19, F-QL-11)

Đọc: AGENTS.md → docs/SNAPSHOT.md (mục 2a) → docs/CHUC_NANG.md (F-BC-18, F-BC-19, F-QL-11). Chạy `git pull` trước.

Mục tiêu giao diện: khối bảng nhiều hộp ở tab Báo cáo và form Nhập hộ (Quản lý ca) dễ dùng một tay trên điện thoại 360px: mỗi hộp là một thẻ gọn (mã hộp, mã hồ sơ, số hồ sơ + số tờ cạnh nhau, xong hộp); thanh tick Scan / Tách / OCR gọn, rõ OCR là tick chủ động; chip "hộp gợi ý" dễ chạm; nút "Thêm hộp", "Gửi báo cáo" lớn; kết quả ✔/✕ từng hộp dễ đọc; thông báo lỗi đỏ ngay tại thẻ.
Chỉ sửa CSS (`.lo-*`) và markup bên trong các chuỗi HTML của hàm `loRenderBox`, `loModeHtml`, `loGui` trong apps-script/Index.html. KHÔNG sửa Code.gs. KHÔNG viết lại cả file. KHÔNG đổi tên hàm `lo*`, `id` (`fLoBox`, `fLoRes`, `hoLoBox`, `hoLoRes`, `fSend`, `hoSend`), thuộc tính `data-i`, `data-k`, `data-kh`, `data-act`, `data-m`, `data-h`, hay `call('…')`. Dữ liệu người nhập luôn qua `esc()`; ES5.
Không đụng: form một hộp cũ (`buildForm` nhánh cũ, `renderHo` nhánh cũ), `Code.gs`, `dash_`.

KHÔNG mở trình duyệt, KHÔNG tìm kiếm web, KHÔNG chụp màn hình, KHÔNG chạy dev server hay preview. Chỉ đọc và sửa file trong thư mục dự án. Không đọc lại cả `Index.html` nhiều lần: tìm đúng đoạn cần sửa bằng tìm kiếm rồi sửa tại chỗ. Kiểm tra duy nhất được phép: `node tools/test_mock.js` và `node tools/kiem_tra_giao_dien.js`.

Xong: `git diff --stat` (Index.html không bị xóa hàng trăm dòng), commit "Giao diện đợt 1: bảng nhiều hộp", push, ghi SNAPSHOT 2a. Báo cáo kênh B: các khối đã đổi, không cần ảnh chụp.
