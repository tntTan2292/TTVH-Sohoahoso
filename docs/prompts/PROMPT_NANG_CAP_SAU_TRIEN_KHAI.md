# Phiếu giao việc: nâng cấp sau triển khai chính thức (10/11/2026)

> Opus viết 10/11/2026 theo phản ánh của chủ dự án sau ca Tối 09/11 và ca Sáng 10/11.
> **Hệ thống đang chạy chính thức cho toàn tổ.** Bắt buộc: không đổi link (`…MlRA`), không đổi cột các tab đang có, mọi sửa dữ liệu thật phải **xem trước → chủ dự án duyệt → sao lưu → ghi log**. Mỗi đợt triển khai bằng skill `update-code-sohoa` sau khi Opus review.

## Opus đã khoanh nguyên nhân (đọc mã, 10/11/2026)
| # | Phản ánh | Nguyên nhân trong mã |
|---|---|---|
| V1 | Nhóm báo cáo chung nhưng "Hộp nhận" từng người khác nhau | `ghi_` (Code.gs ~452): khâu `NHAN_NHOM` cho `kieuNhan = 'CANHAN'` **kể cả khi người đó đã có nhóm** → ghi `Nhom` rỗng, `ThanhVien` = 1 người. Giao diện vẫn hiện nút "Cá nhân" khi đã có nhóm. Nhập hộ (`renderHo`) cũng cho chọn "Cá nhân" với người đã có nhóm. |
| V2 | Quản lý "mất" quản lý tài khoản tổ viên | Không mất: khối "Quản lý tài khoản ca" (`#qlNs`, `#qlRs`, `#qlUk`) nằm **cuối tab Quản lý ca, chỉ hiện sau khi chọn một ca** → khó thấy. **Chưa có** sửa thông tin tổ viên cho TT/TP. Tab Nhân sự (ADMIN) **không có nút Mở khóa**. |
| V3 | Đơn vị trùng ("Trung tâm Kinh doanh" xuất hiện 2 lần ở Đăng nhập) | Ô `#nsDv` gõ tay; `dsLogin` nhóm theo chuỗi `DonVi` → khác khoảng trắng/hoa-thường/dạng Unicode là thành 2 đơn vị. Không có danh mục đơn vị. |
| V4 | Muốn tạo nhân sự bằng import Excel | Chưa có. |
| V5 | Dashboard thiếu tiến trình hằng ngày | `dash_.series` chỉ 10 ngày; Tổng quan chưa có biểu đồ tiến độ từng ngày của 3 khâu từ đầu dự án. |
| V6 | Điện thoại khó dùng | Thanh tab con Dashboard tràn, bảng phải kéo ngang, biểu đồ chật. |

## Quyết định mặc định (Opus chốt; chủ dự án đổi được — ghi vào SNAPSHOT mục 5 nếu đổi)
- **QĐ1 (V1):** Có nhóm trong ca → **chỉ báo cáo theo nhóm** (cả tự báo, nhập hộ, gửi theo lô). Chỉ báo cáo cá nhân khi **chưa được phân nhóm** trong ca đó. Áp dụng cho mọi khâu `NHAN_NHOM/SCAN/TACH/OCR`.
- **QĐ2 (V2):** TT/TP quản lý **tổ viên** (vai trò `TOVIEN`): xem danh sách, **cấp lại PIN, mở khóa, sửa họ tên / chức vụ / đơn vị / trạng thái hoạt động**. **Không** đổi vai trò, **không** tạo mới, không đụng tài khoản quản lý/lãnh đạo/ADMIN. ADMIN quản lý mọi tài khoản (thêm mở khóa vào tab Nhân sự).
- **QĐ3 (V3):** Có **danh mục Đơn vị**; tạo nhân sự **chỉ chọn đơn vị từ danh mục**; đơn vị chưa có thì ADMIN tạo trước.
- **QĐ4 (V4):** Import: chỉ ADMIN; mã HRM **đã có thì bỏ qua và báo** (không ghi đè); vai trò qua import chỉ `TOVIEN/TOTRUONG/TOPHO` (không tạo ADMIN/LANHDAO); có dòng lỗi thì **không ghi gì**.
- **QĐ5 (V5):** "Nhanh/chậm" so với **TB tờ/ngày của toàn dự án** và đường **TB 7 ngày**; tối đa 30 ngày gần nhất, chọn được trang trước.

---

## ĐỢT A – KHẨN (Claude Code (Sonnet)) · có điểm phải dừng (phân quyền + sửa dữ liệu thật) → Opus review trước triển khai
**A1. Khóa báo cáo cá nhân khi đã có nhóm (QĐ1).**
- Máy chủ `ghi_` (đường thường và `boSung`): nếu người làm (`u.ma` hoặc `nguoiHo`) **có nhóm** trong ngày/ca đó (`nhomOf_`) thì **bắt buộc** ghi theo nhóm đó: `kieuNhan = 'CANHAN'` → từ chối với thông báo rõ ("Bạn đã thuộc Nhóm X trong ca … – báo cáo theo nhóm"); nhập hộ có `nguoiHo` thuộc nhóm mà `nhom` để trống/khác → từ chối. `ghiLo_` kế thừa vì gọi `ghi_`.
- Giao diện: có nhóm → ẩn nút "Cá nhân" (chỉ hiện "Nhóm X: thành viên"); chưa có nhóm → chỉ "Cá nhân". Nhập hộ: chọn người đã có nhóm → tự chọn nhóm, khóa ô nhóm.
- Mock: có nhóm gửi CANHAN bị chặn; chưa nhóm gửi được; nhập hộ đúng/sai nhóm; `dash_` cùng dữ liệu hợp lệ không đổi.

**A2. Công cụ chuẩn hóa dữ liệu cá nhân → nhóm (ADMIN), rồi áp dụng cho ca Sáng 10/11/2026.**
- Action ghi mới `chuanHoaNhom` (chỉ ADMIN), payload `{ ngay, ca, apDung }`. Quét `NhatKy` (không hủy) ngày/ca đó, khâu `NHAN_NHOM/SCAN/TACH/OCR`, `Nhom` rỗng mà người trong `ThanhVien` **thuộc một nhóm** trong `PhanNhom` ngày/ca đó → đề xuất đổi `Nhom` = nhóm, `ThanhVien` = thành viên nhóm. Nếu sau khi đổi có **dòng trùng** (cùng nhóm, cùng khâu, cùng hộp) → đề xuất **hủy mềm** dòng trùng (giữ dòng có số liệu đầy đủ/sớm nhất; số liệu khác nhau thì **không tự quyết**, liệt kê để chủ dự án chọn).
- `apDung: false` → chỉ trả **bảng xem trước** (dòng, giờ, khâu, hộp, người, cũ → mới, lý do). `apDung: true` → sao lưu dòng bị đổi (`saoLuuDong_`), sửa, `log_` từng dòng cũ → mới.
- Giao diện: tab Dữ liệu (ADMIN) thêm khung "Chuẩn hóa báo cáo theo nhóm": chọn ngày, ca → Xem trước → Áp dụng (xác nhận gõ `XOA`-kiểu `NHOM`).
- **Dữ liệu thật ca Sáng 10/11:** sau khi triển khai, Sonnet dùng Claude in Chrome chạy **Xem trước** (không áp dụng), chép bảng xem trước vào báo cáo và SNAPSHOT, **DỪNG chờ chủ dự án duyệt**; chủ dự án duyệt mới bấm Áp dụng. So Dashboard ca Sáng trước/sau và ghi lại.

**A3. Quản lý tài khoản tổ viên dễ thấy (QĐ2).**
- TT/TP có tab **"Nhân sự"** riêng (cùng tab với ADMIN, nhưng chỉ thấy tổ viên): ô tìm, danh sách (tên, mã, đơn vị, trạng thái khóa/hoạt động), nút **Cấp PIN**, **Mở khóa**, **Sửa** (họ tên, chức vụ, đơn vị, hoạt động). ADMIN: thêm nút **Mở khóa** vào bảng tab Nhân sự.
- Máy chủ: `luuNhanSu_` cho TT/TP chỉ khi tài khoản đích là `TOVIEN`, chỉ đổi các trường QĐ2 (giữ nguyên `VaiTro`, không tạo mới); `dsNhanSu` cho TT/TP chỉ trả tổ viên, **không trả cột PIN**. Dùng lại `quyenTrenNguoi_`.
- Giữ khối "Quản lý tài khoản ca" cũ (không xóa) cho tới khi chủ dự án nghiệm thu tab mới.
- Mock: TT/TP sửa được tổ viên, bị chặn với TT/TP/LĐ/ADMIN, không đổi được vai trò; ADMIN mở khóa từ tab Nhân sự.

Kiểm tra L2 mỗi mục; cập nhật `CHUC_NANG.md` (F-BC-20 khóa cá nhân, F-DL-07 chuẩn hóa nhóm, F-NS-04 quản lý tổ viên cho TT/TP, F-NS-05 mở khóa ADMIN) và `API.md`. **Không triển khai**: dừng, báo cáo kênh B → Opus review → triển khai → bước dữ liệu thật A2.

---

## ĐỢT B – Nhân sự & Đơn vị (Claude Code (Sonnet)) · có điểm phải dừng (tạo tài khoản/PIN) → Opus review
**B1. Danh mục Đơn vị (QĐ3).** Tab mới `DonVi` (cột `TenDV`, `HoatDong`, `ThuTu`) — **thêm tab, không đổi tab cũ**; tự tạo tab nếu chưa có (không bắt chủ dự án chạy `setup`). ADMIN: thêm/sửa/ẩn đơn vị. Ô Đơn vị ở form nhân sự thành **danh sách chọn**. Chuẩn hóa tên khi lưu: bỏ khoảng trắng thừa, NFC.
**B2. Chuẩn hóa đơn vị đang trùng.** Action ADMIN xem trước → áp dụng: gom các tên trùng sau chuẩn hóa (khoảng trắng, hoa-thường, NFC) về một tên trong danh mục; tên không khớp danh mục liệt kê để ADMIN chọn. Sao lưu + log. Áp dụng thật sau khi chủ dự án duyệt bảng xem trước (cùng cách A2).
**B3. Import nhân sự từ Excel (QĐ4).** Tab Nhân sự (ADMIN): nút "Tải file mẫu" và "Import Excel" (đọc `.xlsx`/`.csv` bằng SheetJS từ `cdnjs.cloudflare.com`, phiên bản cố định; hoặc dán từ Excel). Cột: Mã HRM, Họ tên, Chức vụ, Đơn vị (phải có trong danh mục), Vai trò. Bảng xem trước có lỗi từng dòng → Xác nhận → ghi một lần (`appendMany_`), sinh PIN tạm, hiển thị **một lần** danh sách PIN tạm để in/giao tận tay (không lưu vào log, không gửi đi đâu).

---

## ĐỢT C – Dashboard tiến độ + điện thoại
**C1 (Claude Code (Sonnet)). Biểu đồ tiến độ hằng ngày (QĐ5)** ở tab Tổng quan: cột tờ Scan/Tách/OCR từng ngày từ 02/11 (gồm số đầu kỳ theo ngày) tới nay, tối đa 30 ngày, nút "◀ 30 ngày trước"; đường TB toàn dự án và TB 7 ngày; bấm một ngày → mở tab Theo ngày của ngày đó. `dash_` thêm tham số số ngày (tối đa 30) cho `series`, giữ mặc định 10 cho widget tab Báo cáo. Mock so `series` 10 ngày cũ không đổi.
**C2 (Antigravity (Gemini)) – sau C1. Giao diện điện thoại (≤ 640px)**: thanh tab con Dashboard thấy đủ 5 tab (biểu tượng + nhãn ngắn, chia lưới hoặc cuộn có dấu hiệu); bảng chính (Nhân sự, nhóm, Ai nhập, Dữ liệu) **chuyển thành thẻ xếp dọc** thay vì kéo ngang; KPI 2 cột; biểu đồ cao vừa, chú thích dưới; form báo cáo một tay. Sonnet viết prompt Antigravity (mẫu 10.3 + khối 3b). Opus review sẽ kiểm ở khổ 375px.

## ĐỢT T – Tốc độ + chống bấm lặp (Claude Code (Sonnet)) · thêm 10/11/2026 theo yêu cầu chủ dự án
**Hiện trạng (chủ dự án):** ca < 10 người vẫn thấy chậm; bấm Nhận hộp/Báo cáo chưa thấy phản hồi nên người dùng bấm liên tục.
**Opus đã khoanh (đọc mã, chưa đo):** mọi lệnh ghi qua `withLock_` (khóa chung toàn hệ thống, `waitLock(25000)`) → người sau xếp hàng; tab `NhatKy` (lớn nhất) **không** nằm trong `CACHE_TABS` nên mỗi lần ghi/`hopGoiY`/`lichSu` đọc lại cả tab; mỗi lần ghi còn ghi `log_` sang tab khác; sau khi ghi giao diện có thể gọi thêm vài lệnh đọc. `google.script.run` tự nó mất ~1–2 giây mỗi lượt. Bảng nhiều hộp (`ghiLo`) đã khóa nút + có `idLo` chống ghi trùng; các nút khác (Nhận hộp, Vào ca, Trả hộp, form Một hộp, Nhập hộ, quản lý) chưa thống nhất.
**T1 – Lớp chờ dùng chung + chống bấm lặp (làm trước, ít rủi ro).** Trong `call()` của `Index.html`: với action GHI (không thuộc `READ_ACTIONS`) hiện lớp phủ toàn màn hình có vòng quay + chữ "Đang gửi…" + thanh tiến trình **ước lượng** (chạy chậm dần tới ~90%, xong thì 100% rồi tắt; không giả số %), chặn mọi bấm cho tới khi có kết quả; sau 8 giây đổi chữ "Hệ thống đang bận, vui lòng chờ – KHÔNG bấm lại"; lỗi/hết hạn phiên phải tắt lớp phủ. Action ĐỌC: thanh mảnh trên đầu trang, không chặn. Cùng lúc chỉ cho **một** lệnh ghi đang chạy (lệnh ghi thứ hai khi lệnh trước chưa xong → bỏ qua). Không đổi tên/tham số `call()`, giữ mọi id. Máy chủ: `ghi`/`vaoCa`/`tra` nhận thêm `idGui` tùy chọn (như `idLo`, CacheService theo người, 10 phút) → gửi lặp cùng `idGui` trả lại kết quả cũ, không ghi trùng.
**T2 – Đo rồi mới tối ưu.** Thêm đo thời gian từng phần ở máy chủ (auth, chờ khóa, đọc tab nào, ghi, log) cho các action `ghi`, `ghiLo`, `hopGoiY`, `lichSu`, `me`, `dashboard`; ghi số đo vào `NhatKyHT` hoặc trả kèm khi ADMIN bật chế độ đo; **không** ảnh hưởng người dùng thường. Từ số đo, đề xuất các tối ưu xếp theo lợi ích/rủi ro, ví dụ: chỉ đọc phần cuối `NhatKy` cho thao tác trong ngày; gộp `log_` cùng lượt ghi; bỏ lệnh đọc thừa sau khi ghi (dùng luôn dữ liệu máy chủ trả về); thu hẹp vùng khóa (kiểm tra hợp lệ ngoài khóa, chỉ ghi trong khóa). **Dừng ở bảng đề xuất có số đo trước/sau trên mock → Opus review** rồi mới làm phần đụng cách đọc/ghi `NhatKy` hoặc khóa.
**Không đụng:** cột/tab Sheet, cách tính số liệu, link.

---

## Thứ tự
A (khẩn) → triển khai → A2 dữ liệu thật (chủ dự án duyệt) → B → **T1 → T2 (đo + đề xuất)** → C1 → C2 → Opus review C → triển khai. Mỗi đợt: Sonnet dừng ở cuối đợt, báo cáo kênh B, cập nhật SNAPSHOT.
