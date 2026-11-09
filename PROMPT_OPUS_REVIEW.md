# Prompt giao cho Opus: review tổng thể trước khi triển khai

> Dán phần bên dưới vào Opus, đính kèm: `apps-script/Code.gs`, `apps-script/Index.html`, `HUONG_DAN_TRIEN_KHAI.md`, `tools/build_khoi_tao.py`. Không cần các file khác trong `tools/` (là script vá tạm).

---

## Vai trò
Bạn là kỹ sư review cấp cao. Hãy review **toàn bộ hệ thống "Báo cáo ca Số hóa hồ sơ"** của Bưu điện TP Huế và cho kết luận **GO / NO-GO** trước khi giao cho tổ vận hành dùng thật. Đây là hệ thống nội bộ nhỏ (khoảng 30 người, 3 ca/ngày, 175.000 tờ hồ sơ), nhưng số liệu được Lãnh đạo dùng để báo cáo, nên **đúng số liệu, đúng phân quyền và truy vết được** quan trọng hơn giao diện.

## Hệ thống là gì
- **Google Apps Script Web App**, gắn với 1 Google Sheet làm CSDL. Triển khai: thực thi với tư cách chủ file, truy cập "Bất kỳ ai" (không đăng nhập Google).
- `Code.gs`: backend (một hàm vào duy nhất `api(token, action, payload)`, cộng `doGet`, `login`, `dsLogin`).
- `Index.html`: giao diện một file (Chart.js từ cdnjs).
- Các tab Sheet: `NhanSu`, `PhanCa` (lịch TCHC từ 02/11), `PhanNhom`, `NhatKy` (nhật ký báo cáo, chỉ thêm dòng), `ChotCa`, `DauKy` (số lũy kế trước khi chạy hệ thống), `LogHeThong` (nhật ký thao tác).

## Nghiệp vụ
- 3 khâu: **Scan → Tách file PDF → OCR**; mỗi khâu mục tiêu **175.000 tờ** (1 trang tính như 1 tờ). Hộp → bộ hồ sơ → hồ sơ → tờ. Mỗi hộp 6–10 hồ sơ.
- 3 ca/ngày: Sáng 07:30–11:30, Chiều 13:00–17:00, Tối 18:00–21:00. Làm theo **cặp (nhóm)**, mỗi ca khoảng 6 người.
- **Vai trò**: `TOVIEN`, `TOTRUONG`, `TOPHO`, `LANHDAO` (chỉ xem), `ADMIN`.
- **Tổ viên** chỉ báo cáo: Nhận hộp (từ Tổ trưởng/Tổ phó), Scan, Tách file, OCR. Mỗi cặp một người nhập, công chia 50/50.
- **Tổ trưởng/Tổ phó (Quản lý)** chỉ báo cáo: Nhận từ Trung tâm Lưu trữ, Trả hộp; phân nhóm đầu ca; chốt/mở khóa ca; **nhập hộ** số liệu cho thành viên quên PIN (tab Quản lý ca).
- **ADMIN**: toàn quyền, gồm quản lý nhân sự, sửa/xóa/khôi phục bản ghi, tạo dữ liệu mẫu, reset dữ liệu, xem nhật ký hệ thống.
- Ca tự khóa nhập sau giờ kết thúc 60 phút; Quản lý/ADMIN bổ sung được sau khóa qua "nhập hộ".
- Dashboard theo 4 khu vực: ĐẦU CA, CUỐI CA, KẾT THÚC NGÀY, CHI TIẾT; có widget tiến độ tổng thể (tờ đã làm / 175.000, TB tờ/ngày và tờ/ca tính từ 02/11 theo số ca TCHC phân công, ngày dự kiến xong).
- Mọi thay đổi phải truy vết được (ai, giờ nào, ca nào, giá trị cũ → mới).

## Cần review những gì (theo thứ tự ưu tiên)
1. **Phân quyền và bảo mật**: mọi `case` trong `api()` có chặn đúng vai trò chưa; có đường nào để tổ viên gọi hành động của quản lý, hoặc quản lý gọi hành động của ADMIN; kiểm tra phía máy chủ khi UI chỉ ẩn nút. Xử lý token (`CacheService`, 6 giờ), PIN (băm SHA-256 + salt), khóa sau 5 lần sai, lộ thông tin ở `dsLogin` (công khai), brute-force PIN 4–6 số, XSS qua dữ liệu người nhập (mã hộp, ghi chú, tên) khi render HTML, injection vào Sheet (công thức `=`), lộ PIN tạm trong tab `NhanSu`.
2. **Đúng số liệu**: logic `dash_` (đếm hộp "xong" theo lần `HetHop` đầu tiên, tồn đầu ca/cuối ngày, `chuaScan/chuaTach/chuaOcr`, quy đổi `dv = so tờ nếu >0 ngược lại số trang`, cộng `DauKy`, chia công 50/50, người-giờ). Hộp làm dở qua nhiều ca, báo trùng, sửa/xóa/khôi phục bản ghi, bản ghi `THỬ NGHIỆM`, hộp chưa có trong danh sách nhận, hộp trả trước khi scan. Tính TB/ngày và ngày dự kiến xong từ `PhanCa` (đếm ca đã kết thúc) có hợp lý không, có chia cho 0 hoặc lệch múi giờ không.
3. **Toàn vẹn dữ liệu và đồng thời**: nhiều người ghi cùng lúc (chỉ `ghi_` có `LockService`; `setCell_` kiểu đọc rồi ghi theo số dòng, `rewrite_`, `deleteRow` theo số dòng có thể lệch khi có người khác thêm dòng); `appendRow` với định dạng văn bản (mã HRM `000...`, ngày `yyyy-MM-dd`, mã hộp dạng `208.18.17` dễ bị Sheets ép thành số/ngày); `ID` bản ghi trùng; xóa mềm (`Huy`).
4. **Hiệu năng khi dữ liệu lớn**: mỗi lần gọi đọc cả sheet (`read_`), `log_` đọc `NhanSu` mỗi lần ghi nhật ký, `dash_` đọc nhiều lần. Ước lượng khi `NhatKy` đạt 50.000–200.000 dòng và 5 ca/ngày liên tục vài tháng: có vượt giới hạn 6 phút/lần chạy hay chậm không, đề xuất cách giảm (cache, đọc một lần, lưu tổng hợp).
5. **Thời gian và khóa ca**: `now_`, `caWin_`, `caState_` (mở sớm 15 phút, khóa sau 60 phút, ca tối), ca chồng nhau (chiều/tối 17:45–18:00), chốt/mở khóa (`ChotCa` lấy dòng cuối), múi giờ của script và của Sheet.
6. **Giao diện (`Index.html`)**: lỗi JS có thể xảy ra, trạng thái rỗng/lỗi, nút gửi trùng khi bấm nhiều lần, dữ liệu cũ khi đổi tab, dark mode, màn hình 360px. (Giao diện sẽ được thiết kế lại sau bởi công cụ khác; chỉ cần chỉ ra lỗi chức năng.)
7. **Đối chiếu yêu cầu**: liệt kê yêu cầu ở mục Nghiệp vụ chưa được đáp ứng hoặc đáp ứng sai.
8. **Vận hành và triển khai**: hướng dẫn `HUONG_DAN_TRIEN_KHAI.md` còn đúng không; sao lưu, khôi phục; cách đổi PIN/khóa tài khoản; cách cập nhật phân ca tháng sau từ file Excel của TCHC (`build_khoi_tao.py` có đủ tin cậy không).

## Giới hạn và rủi ro đã biết (xin xác nhận hoặc bác bỏ, đừng bỏ qua)
- **Chưa chạy thử trên Apps Script thật**: mới kiểm tra cú pháp bằng Node và chạy thử `dash_` với dữ liệu giả. Chưa kiểm thử đăng nhập, khóa ca, phân quyền, nhập hộ, xóa/khôi phục, nhật ký trên môi trường thật.
- Đăng nhập chỉ bằng **tên + PIN**; kiểm tra Gmail của Tổ trưởng/Tổ phó/ADMIN trong `login` thực tế **không có tác dụng** vì triển khai ở chế độ ẩn danh (`Session.getActiveUser()` rỗng).
- PIN tạm lưu **dạng chữ thường** ở cột `PinTam` cho tới khi người dùng đổi.
- `dsLogin()` công khai danh sách tên người đang trong ca và danh sách quản lý.
- Số `DauKy` (Scan 20.602, Tách 5.781, OCR 3.140) cộng tay từ file Excel cũ; trong đó có 571 trang ghi "Tách file" nằm trong số Scan của ngày 05/11 ca tối, cần Lãnh đạo xác nhận.
- Đơn vị: 1 trang ≈ 1 tờ (quy ước), `dv` lấy số tờ nếu có nhập, không thì số trang.
- Tổ trưởng/Tổ phó cũng làm trong cặp theo lịch, nên phần việc của họ phải báo qua khung "Nhập hộ" (chọn chính họ).
- `Index.html` còn hàm thừa `loadBs` (không còn được gọi).
- Cột `NgayCa` của `LogHeThong` suy ra từ giờ hiện tại, không phải từ ca của bản ghi; các dòng nhật ký cũ (nếu có) chỉ có 4 cột.
- Thư mục `tools/` có nhiều script vá và file phục hồi tạm (`Index_recovered.html`, `patch_*.py`); **chỉ coi `apps-script/` là mã nguồn chính thức**.

## Cách trả lời
1. **Kết luận GO / NO-GO** và 3–5 dòng lý do.
2. **Danh sách phát hiện**, xếp theo mức: `Chặn` (không được triển khai nếu chưa sửa) / `Quan trọng` / `Nhỏ`. Mỗi mục gồm: file và hàm (hoặc số dòng), mô tả lỗi, **kịch bản gây lỗi cụ thể** (đầu vào hoặc trạng thái → kết quả sai), cách sửa đề xuất (đoạn mã ngắn nếu được).
3. **Kế hoạch kiểm thử trước khi giao** (khoảng 15–20 bước, theo từng vai trò), kèm kết quả mong đợi.
4. **Việc nên làm sau triển khai** (giám sát, sao lưu, giới hạn dữ liệu).
Không viết lại toàn bộ code; chỉ nêu những chỗ cần sửa. Nếu không chắc một điểm vì thiếu dữ liệu hoặc không chạy được mã, hãy ghi rõ "chưa xác minh".
