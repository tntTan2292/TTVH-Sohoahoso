### Prompt cho Antigravity (Gemini)
DỰ ÁN: Báo cáo ca Số hóa hồ sơ
VIỆC: F-DB-14, F-DB-15 – thiết kế giao diện Dashboard chia tab con

Đọc: AGENTS.md → docs/SNAPSHOT.md → docs/CHUC_NANG.md (mục F-DB-14, F-DB-15).

Đề bài: Dashboard vừa được chia thành 5 tab con (thanh `#dTabs`: Tổng quan, Theo ngày, Ca – Nhóm, Nhân sự, Nhật ký nhập) và có tab Nhân sự mới (thống kê từng người theo khoảng ngày). Chức năng đã chạy nhưng giao diện mới ở mức dùng được. Hãy tự thiết kế để Dashboard đẹp, dễ quan sát, dùng tốt trên điện thoại 360px và máy tính. Bạn tự quyết cách trình bày.

Giữ nguyên (không đổi tên/xóa): các `id`, hàm JS, `call('...')` và trường dữ liệu đã có (xem F-DB-01…15 trong `docs/CHUC_NANG.md`).
Chỉ sửa HTML/CSS trong apps-script/Index.html, sửa tại chỗ. KHÔNG sửa Code.gs. KHÔNG viết lại cả file.
Cần thêm dữ liệu hoặc logic từ máy chủ: dừng, báo lại, không tự làm.

KHÔNG mở trình duyệt, KHÔNG tìm kiếm web, KHÔNG chụp màn hình, KHÔNG chạy dev server hay preview. Chỉ đọc và sửa file trong thư mục dự án. Không đọc lại cả `Index.html` nhiều lần: tìm đúng đoạn cần sửa bằng tìm kiếm rồi sửa tại chỗ. Kiểm tra duy nhất được phép: `node tools/test_mock.js` và `node tools/kiem_tra_giao_dien.js`.

Xong: commit, push, cập nhật SNAPSHOT. Báo cáo kênh B: khối đã đổi (mô tả bằng lời), id/hàm đã giữ, kết quả 2 lệnh kiểm tra.
