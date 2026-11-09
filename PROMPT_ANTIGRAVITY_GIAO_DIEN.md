# Prompt giao cho Antigravity: làm lại giao diện

> Dán phần dưới dòng `---` vào Antigravity. Đính kèm `apps-script/Index.html` và `apps-script/Code.gs` (Code.gs chỉ để đọc).

---

## Nhiệm vụ
Thiết kế lại giao diện file `Index.html` (Google Apps Script Web App, một file HTML + CSS + JS nội tuyến) cho **đẹp, rõ ràng, chia khu vực rõ**, dùng tốt trên điện thoại (360px) và máy tính, có dark mode (`prefers-color-scheme`). Hệ thống: báo cáo ca số hóa hồ sơ, 3 khâu **Scan → Tách file → OCR**, mục tiêu 175.000 tờ mỗi khâu, 3 ca/ngày (Sáng, Chiều, Tối).

## Quy tắc làm việc (bắt buộc)
- **Không mở trình duyệt, không tìm kiếm web, không chụp màn hình, không chạy dev server.** Chỉ đọc và sửa file cục bộ.
- **Chỉ sửa `Index.html`.** Không sửa `Code.gs`.
- **Giữ nguyên**: tên hàm JS, các `id` phần tử, hàm `call(action, payload)`, `login`, `dsLogin`, tên action và cấu trúc dữ liệu máy chủ trả về (xem `Code.gs`, hàm `api` và `dash_`). Chỉ đổi cấu trúc HTML/CSS và cách trình bày.
- Một file duy nhất, thư viện ngoài chỉ nạp từ `cdnjs.cloudflare.com` (đang dùng Chart.js 4.4.1).
- Tiếng Việt có dấu, số định dạng `vi-VN`. Hạn chế đọc lại cả file nhiều lần để tiết kiệm lượt dùng.
- Kiểm tra duy nhất được phép: cú pháp JS (ví dụ `node --check` trên phần script đã tách).

## Các TAB cần thiết kế
1. **Đăng nhập / đổi PIN lần đầu**: chọn tên (nhóm "Đang trong ca" và "Quản lý / Xem") + PIN.
2. **Báo cáo** (hai giao diện khác nhau theo vai trò, không gộp):
   - **Tổ viên**: 4 bước **Nhận hộp / Scan / Tách file / OCR**.
   - **Quản lý và Quản trị**: 2 bước **Nhận từ TT Lưu trữ / Trả hộp**.
   - Cả hai: khung **hiển thị ca** nổi bật ("Ghi vào: Ca Chiều 13:00–17:00 · ngày …", có ô chọn ca nếu nhiều ca cùng mở, cảnh báo nếu không có ca nào), thẻ trạng thái ca (nhóm, thành viên, giờ khóa), nhật ký ca, widget tiến độ gọn. Nút lớn, nhập số nhanh một tay.
3. **Quản lý ca** (Tổ trưởng, Tổ phó, Quản trị): nhân sự trong ca, phân nhóm theo cặp ("Tự ghép cặp"), chốt/mở khóa ca, cấp PIN, khung **"Nhập số liệu hộ thành viên"** (chọn khâu, nhóm, người được nhập hộ).
4. **Nhân sự** (Quản trị): danh sách + form thêm/sửa, cấp PIN mới.
5. **Dữ liệu** (Quản trị): bảng bản ghi báo cáo theo ngày, sửa/xóa/khôi phục (bản ghi đã xóa hiện mờ, gạch ngang), tạo dữ liệu mẫu, các nút xóa dữ liệu (xác nhận rõ ràng).
6. **Nhật ký** (Quản trị): bộ lọc + bảng (thời gian, người, vai trò, thuộc ca, hành động, chi tiết).
7. **Dashboard** (quan trọng nhất, cho Lãnh đạo), 4 khu vực tách bạch, mỗi khu một màu và tiêu đề lớn:
   - **Widget tiến độ tổng thể** ở đầu: 3 vòng Scan / Tách / OCR so với 175.000 tờ, tờ còn lại, TB tờ/ngày và tờ/ca, ngày dự kiến xong, hộp tồn.
   - **ĐẦU CA**: 3 thẻ ca (nhân sự, hộp tồn, chưa scan, chờ tách, chờ OCR, trạng thái) + 2 biểu đồ.
   - **CUỐI CA**: 3 thẻ ca (tờ scan/tách/OCR, hộp nhận/trả, người đã báo cáo, đã chốt chưa) + biểu đồ sản lượng.
   - **KẾT THÚC NGÀY**: tổng kết ngày + biểu đồ nhận–trả–tồn và sản lượng 10 ngày.
   - **CHI TIẾT**: bảng theo nhóm (năng suất tờ/người-giờ) và theo cá nhân.
   Lãnh đạo nhìn 5 giây phải biết: tiến độ tổng thể, hôm nay đang ở đâu, ca nào đã xong/đã chốt.

## Phong cách
Sạch, hiện đại, kiểu dashboard điều hành: thẻ bo góc, số lớn, màu nhất quán theo khâu (Scan xanh dương, Tách xanh ngọc, OCR tím), cam/đỏ chỉ để cảnh báo. Biểu tượng SVG nội tuyến. Có trạng thái rỗng, đang tải, lỗi.

## Kết quả
File `Index.html` mới chạy được trong Apps Script. Kèm danh sách thay đổi tối đa 10 dòng.
