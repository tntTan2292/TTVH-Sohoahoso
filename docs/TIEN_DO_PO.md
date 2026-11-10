# Tiến độ yêu cầu của chủ dự án (đánh số cố định)

> Chủ dự án theo dõi bằng số thứ tự trong bảng này (yêu cầu 10/11/2026). **Không đổi số của mục đã có; yêu cầu mới thêm số tiếp theo.**
> Xong một mục: cập nhật cột Trạng thái và báo chủ dự án "**Mục N đã xong**". "Xong" = đã triển khai và dùng được trên link chính; xong trong mã thì chỉ báo là "xong trong mã, chờ triển khai".
> Chi tiết kỹ thuật ở `docs/SNAPSHOT.md` và `docs/prompts/PROMPT_NANG_CAP_SAU_TRIEN_KHAI.md`.

| # | Yêu cầu | Mã | Trạng thái |
|---|---|---|---|
| 1 | Có nhóm thì chỉ báo cáo theo nhóm | A1 | ✅ Xong (chủ dự án xác nhận 10/11) |
| 2 | Chuyển báo cáo cá nhân sang nhóm, ca Sáng 10/11 | A2 | ✅ Xong (chủ dự án xác nhận 10/11) |
| 3 | Tổ trưởng/Tổ phó quản lý tổ viên, ADMIN có nút Mở khóa | A3 | ✅ Xong (chủ dự án xác nhận 10/11) |
| 4 | Sửa lỗi "nhận X hộp" lệch giữa người cùng nhóm | F-DB-06 | ✅ Xong (chủ dự án xác nhận 10/11) |
| 5 | Danh mục Đơn vị, chọn từ danh sách | B1 | ✅ Xong (chủ dự án xác nhận 10/11) |
| 6 | Gộp đơn vị trùng tên | B2 | ✅ Xong (chủ dự án xác nhận 10/11) |
| 7 | Import nhân sự từ Excel | B3 | ✅ Xong (chủ dự án xác nhận 10/11) |
| 8 | Ô "Nhận từ TTLT" ở khung Ca trong ngày | F-DB-03 | ✅ Xong (chủ dự án xác nhận 10/11) |
| 9 | ADMIN xóa tài khoản tạo nhầm | B5 | ✅ Xong (chủ dự án xác nhận 10/11) |
| 10 | Xóa người giả "Thử nghiệm 01–11" | B5b | ✅ Xong (chủ dự án xác nhận 10/11) |
| 11 | Ban chỉ đạo: vai trò Lãnh đạo, hiện chức vụ, import được | B5c | ✅ Xong (chủ dự án xác nhận 10/11) |
| 12 | Bộ lọc Đơn vị/Vai trò/Trạng thái ở danh sách nhân sự | B5d | ✅ Xong (chủ dự án xác nhận 10/11) |
| 13 | Khôi phục số 0 đầu Mã HRM | F-NS-11, E2 | ⚠️ Đã lên link chính (phiên bản 26) nhưng CHƯA bấm Xem trước/Áp dụng; chờ chủ dự án đồng ý |
| 14 | Một hộp dù viết `2.1.87` hay `02.01.87` | H1 | 🟢 Đã lên link chính (phiên bản 26); chờ chủ dự án xác nhận |
| 15 | Sắp thứ tự người ở màn hình đăng nhập | B5e | ✅ Xong (chủ dự án xác nhận 10/11) |
| 16 | Đăng nhập chọn Đơn vị trước, nhớ người lần trước | B4 | 🟢 Opus review ĐẠT (10/11/2026), chờ chủ dự án đẩy code và thử trên link |
| 17 | Màn hình chờ và chống bấm lặp | T1 | 🟢 Opus review ĐẠT (10/11/2026), chờ chủ dự án đẩy code và thử trên link |
| 18 | Đo tốc độ, đề xuất tối ưu | T2 | 🟢 Opus review ĐẠT (10/11/2026; bộ đo + bảng đề xuất, chưa tối ưu); chờ chủ dự án đẩy code, rồi ADMIN đo số thật |
| 19 | Tab Đối soát hộp | H2 | 🟢 Opus review ĐẠT (10/11/2026), chờ chủ dự án đẩy code và thử trên link |
| 20 | Bấm ô số liệu ra danh sách chi tiết | C0 | 🟢 Opus review ĐẠT (10/11/2026), chờ chủ dự án đẩy code và thử trên link |
| 21 | Tự đổi mã về dạng chuẩn, sửa mã cũ | H3 | ⬜ Chưa làm |
| 22 | Biểu đồ tiến độ hằng ngày 30 ngày | C1 | 🟢 Opus review ĐẠT (10/11/2026), chờ chủ dự án đẩy code và thử trên link |
| 23 | Giao diện điện thoại | C2 | 🟢 Opus review ĐẠT (10/11/2026), chờ chủ dự án đẩy code và thử trên link |
| 24 | F5 không bị đăng xuất (đóng tab thì đăng nhập lại) | F5 | 🟢 Opus review ĐẠT (10/11/2026), chờ chủ dự án đẩy code và thử F5 trong khung Apps Script thật |
| 25 | Làm lại diện mạo: đăng nhập, bỏ ô tìm kiếm thừa, font, màu đậm hơn, có hiệu ứng | C3 | ⏸ Có phiếu, chủ dự án tạm hoãn (10/11) |
| 26 | Gán kết quả 02–08/11 cho từng người theo tên trên bảng cũ (ô 2 tên là nhóm) | DK1 | 🟢 Opus review ĐẠT (10/11/2026, `f8fd221`, `3c43bfb`; mock 518/0), chờ chủ dự án đẩy code, nạp dữ liệu; người phụ trách ca điền phiếu xác nhận |
| 27 | Tổ trưởng/Tổ phó thêm được tổ viên mới (làm xong mới đẩy code một lần) | F-NS-12b | 🟢 Opus review ĐẠT (10/11/2026, `848b751`; mock 550/0), chờ chủ dự án đẩy code và thử trên link |
