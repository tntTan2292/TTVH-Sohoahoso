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
- **QĐ4 (V4):** Import: chỉ ADMIN; mã HRM **đã có thì bỏ qua và báo** (không ghi đè); vai trò qua import chỉ `TOVIEN/TOTRUONG/TOPHO` + `LANHDAO` (sửa 10/11/2026, xem B5c; không tạo ADMIN); có dòng lỗi thì **không ghi gì**.
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

## ĐỢT H – Mã hộp & Đối soát hộp (Claude Code (Sonnet)) · thêm 10/11/2026 theo chủ dự án
**Căn cứ:** 10/11 cùng một hộp ghi `2.1.87` (Quản lý nhận TTLT) và `02.01.87` (nhóm nhận) → mọi chỗ so `MaHop` nguyên chuỗi (~16 chỗ: `ghi_` `has()`, `hopGoiY_`, `dash_`…) coi là 2 hộp → cảnh báo "chưa có trong danh sách đã nhận" nhầm, tồn/chờ lệch. **Chủ dự án chốt dạng chuẩn `02.01.87`.**
**H1 – Khóa hộp (làm trước, L2).** Hàm dùng chung `maHopKhoa_(v)`: bỏ khoảng trắng, in hoa; nếu đúng mẫu các đoạn số ngăn bằng dấu chấm thì bỏ số 0 đầu từng đoạn (đoạn `0`/`00` → `0`); mã khác mẫu → khóa là chính nó. Hàm hiển thị `maHopChuan_(v)`: đoạn số đệm đủ 2 chữ số (`2.1.87` → `02.01.87`; đoạn ≥ 3 chữ số giữ nguyên). **Mọi** chỗ so/gom theo `MaHop` dùng khóa (gom tất cả, không sót chỗ nào: liệt kê trong báo cáo). Không sửa dữ liệu cũ, không đổi cột. Mock: (1) dữ liệu không có biến thể → `dash_`, `hopGoiY_`, cảnh báo `ghi_` **giống hệt** trước/sau; (2) có `2.1.87` + `02.01.87` → một hộp, hết cảnh báo nhầm, tồn đúng.
**H2 – Đối soát hộp (L2), GỘP với C0.** Một hàm máy chủ dùng chung `trangThaiHop_(rows, den)` trả trạng thái từng hộp (theo khóa) — `dash_` lấy số đếm từ đây, C0 (bấm ô ra danh sách) và Đối soát lấy danh sách từ đây → số trên ô luôn = số dòng danh sách. Action ĐỌC `doiSoatHop {tu, den, trangThai, tim}`. **Tab con thứ 6 trong Dashboard** "Đối soát hộp" (cùng quyền Dashboard; tổ viên không thấy). Mỗi hộp một dòng: mã (dạng chuẩn) · nhận TTLT (ngày, ca, người; ghi chú nếu có biến thể mã) · nhóm nhận · Scan/Tách/OCR: số tờ lũy kế + ✔ khi đã có `HetHop` · trả TTLT (ngày) · trạng thái. Trạng thái: Đủ (nhận, OCR xong, đã trả) · Đã nhận chưa làm · Đang làm dở · Làm xong chưa trả · **Thiếu nhận TTLT** (có `NHAN_NHOM`/Scan/Tách/OCR mà không có `NHAN`; ghi rõ "nhóm đã nhận" nếu có `NHAN_NHOM`) · Trả khi chưa Tách xong. Lọc khoảng ngày nhận, trạng thái, tìm mã; xuất CSV (UTF-8 BOM). Chỉ đọc `NhatKy` còn hiệu lực (bỏ hủy, THỬ NGHIỆM như Dashboard). Sonnet chức năng → Antigravity làm đẹp bảng.
**H3 – Ép dạng chuẩn khi nhập + chuẩn hóa dữ liệu cũ (L3, sửa dữ liệu thật).** **QĐ6 (chủ dự án chốt 10/11/2026):** (a) đoạn số có thể ≥ 3 chữ số (vd `208.18.17`) – cho phép, giữ nguyên số chữ số, chỉ đệm đoạn 1 chữ số thành 2; (b) mã không theo mẫu số (vd `TEST-…`) giữ nguyên, không ép, không chặn; (c) báo cáo hộp chưa có nhận TTLT: **chỉ cảnh báo** như hiện nay, không chặn cứng (rà bằng tab Đối soát). Nhập `2.1.87` tự đổi thành `02.01.87`; công cụ ADMIN xem trước → áp dụng (cùng cách `chuanHoaNhom`) để đổi `MaHop` cũ về dạng chuẩn, sao lưu + log.

## ĐỢT C – Dashboard tiến độ + điện thoại
**C0 (Claude Code (Sonnet), thêm 10/11/2026 theo chủ dự án) – Ô số liệu bấm được → danh sách chi tiết.** Phạm vi đợt này: các ô của khung "Ca trong ngày"/"ĐẦU CA" (Nhân sự, Hộp tồn đầu ca, Nhận từ TTLT, Chưa scan, Chờ tách file, Chờ OCR). Ô khác (Cuối ca, KPI) để sau khi chủ dự án dùng thử.
- Bấm ô → hộp thoại (điện thoại: toàn màn hình) liệt kê chi tiết; ô có số 0 thì không bấm được. Hộp: mã hộp · nhận lúc (ngày, ca) · nhóm/người đang giữ (`NHAN_NHOM`) · khâu đã xong (Scan/Tách/OCR) · số tờ đã báo. Nhân sự: tên · nhóm · đã/chưa báo cáo (dùng `caNguoi` sẵn có, không gọi máy chủ). Có ô lọc nhanh theo mã hộp.
- Máy chủ: action ĐỌC mới `chiTietCa {ngay, ca, loai}` (chỉ tải khi bấm, không làm `dash_` nặng thêm). Danh sách phải tính bằng **đúng hàm** ra con số của ô: tách logic `trangThaiTruoc`/`nhanHop` trong `dash_` thành hàm dùng chung trả về tập mã hộp, ô lấy `.length`. Mock: với mọi ca/loại, số dòng danh sách = số trên ô; `dash_` trước/sau giống hệt. Tổ viên không được gọi (như Dashboard).
- Mức L2 (đụng `dash_`). Sonnet làm chức năng → viết prompt Antigravity làm đẹp hộp thoại → Opus review.
**C1 (Claude Code (Sonnet)). Biểu đồ tiến độ hằng ngày (QĐ5)** ở tab Tổng quan: cột tờ Scan/Tách/OCR từng ngày từ 02/11 (gồm số đầu kỳ theo ngày) tới nay, tối đa 30 ngày, nút "◀ 30 ngày trước"; đường TB toàn dự án và TB 7 ngày; bấm một ngày → mở tab Theo ngày của ngày đó. `dash_` thêm tham số số ngày (tối đa 30) cho `series`, giữ mặc định 10 cho widget tab Báo cáo. Mock so `series` 10 ngày cũ không đổi.
**C2 (Antigravity (Gemini)) – sau C1. Giao diện điện thoại (≤ 640px)**: thanh tab con Dashboard thấy đủ 5 tab (biểu tượng + nhãn ngắn, chia lưới hoặc cuộn có dấu hiệu); bảng chính (Nhân sự, nhóm, Ai nhập, Dữ liệu) **chuyển thành thẻ xếp dọc** thay vì kéo ngang; KPI 2 cột; biểu đồ cao vừa, chú thích dưới; form báo cáo một tay. Sonnet viết prompt Antigravity (mẫu 10.3 + khối 3b). Opus review sẽ kiểm ở khổ 375px.

**B4 (thêm 10/11/2026 theo chủ dự án) – Đăng nhập: chọn Đơn vị trước, rồi chọn tên.** Làm SAU B1 (cần danh mục) và nên dùng thật sau khi B2 đã áp dụng (đơn vị hết trùng). Hiện trạng: `lgSearch` + một `<select id="lgUser">` dài gom theo đơn vị (`dsLogin`, `renderLoginSelect`) → 50+ người phải kéo tìm.
- Bước 1: chọn **Đơn vị** (danh sách theo `ThuTu` trong danh mục, chỉ đơn vị đang hoạt động và có người; kèm số người). Bước 2: chỉ hiện tên của đơn vị đó (nút/thẻ dễ chạm, xếp theo tên). Bước 3: PIN.
- **Nhớ trên máy:** lưu đơn vị + mã người đăng nhập thành công lần trước (`localStorage`, bọc try/catch; KHÔNG lưu PIN/token) → mở trang thấy sẵn "Đăng nhập là <Tên> (<Đơn vị>)", chỉ gõ PIN; có nút "Người khác".
- Ô tìm `lgSearch` giữ lại: gõ tên/mã thì tìm trên **mọi** đơn vị (bỏ qua bước 1).
- `dsLogin` (công khai) trả thêm danh mục đơn vị (tên + thứ tự); vẫn KHÔNG trả vai trò/email/PIN. Giữ `lgUser`, `lgPin`, `lgBtn`, hàm `login` (có thể ẩn `lgUser` và đồng bộ giá trị từ thẻ đã chọn).
- Phân công: Sonnet làm chức năng; Antigravity làm đẹp sau đó (Sonnet viết prompt). Mức L2 (màn hình đầu tiên của mọi người dùng).

**B5 (thêm 10/11/2026 theo chủ dự án) – ADMIN xóa tài khoản tạo nhầm.** Hiện chỉ có "Ngừng hoạt động"; người giả `TN-xx` (do "Tạo dữ liệu mẫu") chỉ xóa được qua tab Dữ liệu → "Xóa dữ liệu thử nghiệm". Thêm nút **Xóa** ở tab Nhân sự (chỉ ADMIN), action `xoaNhanSu {ma, xacNhan: <mã>}`: chỉ xóa khi tài khoản **chưa từng được dùng** — không có trong `NhatKy` (NguoiNhap/ThanhVien), `PhanCa`, `PhanNhom`, `ChotCa`(NguoiXacNhan); có dấu vết → từ chối, gợi ý "Ngừng hoạt động" (giữ lịch sử). Không xóa chính mình, không xóa ADMIN cuối cùng. Sao lưu dòng vào `SaoLuuXoa` **không kèm** PinHash/Salt/PinTam; log `XOA_NHAN_SU`. Người `TN-xx` luôn xóa được (kèm dòng PhanCa/PhanNhom của họ). Mức L2, mock: xóa người chưa dùng; từ chối người đã báo cáo; không còn cột PIN trong sao lưu.
- **B5b (chủ dự án báo 10/11):** "Xóa dữ liệu thử nghiệm" xóa bảng dữ liệu nhưng **không xóa người `TN-xx`** ("Thử nghiệm 01–11"). `resetDuLieu_` THU chỉ xóa `NhanSu` khi `MaHRM` bắt đầu `TN-` **VÀ** `ChucVu === 'THỬ NGHIỆM'`. Trước khi sửa: CHỈ ĐỌC Sheet thật, ghi lại `MaHRM`/`ChucVu`/`DonVi` của các dòng này để xác định vì sao không khớp. Sửa: xóa theo tiền tố `TN-` (tiền tố dành riêng, import đã chặn) + xóa PhanCa/PhanNhom của họ; thông báo kết quả ghi rõ số người giả đã xóa. Mock: người TN-xx có ChucVu khác vẫn bị xóa; người thật không bị đụng.
- **B5c – Ban chỉ đạo (chủ dự án 10/11):** dùng vai trò `LANHDAO` sẵn có (quyền giống Lãnh đạo BĐTP), **không thêm vai trò mới**. Đơn vị "Ban chỉ đạo" thêm vào danh mục. **QĐ4 sửa (chủ dự án 10/11/2026): Import ĐƯỢC tạo vai trò `LANHDAO`** (chỉ xem); vẫn cấm `ADMIN`. `importNhanSu_` + file mẫu + hướng dẫn cập nhật; mock: LANHDAO được, ADMIN bị từ chối. Sửa hiển thị: dòng tiêu đề sau đăng nhập (`hSub`) và nơi hiện vai trò của người `LANHDAO` có Chức vụ → hiện **Chức vụ** (vd "Trưởng Ban chỉ đạo") thay cho chữ "Lãnh đạo". Không đổi phân quyền.

**B5d (thêm 10/11/2026 theo chủ dự án) – Bộ lọc ở "Danh sách nhân sự hệ thống" (tab Nhân sự).** Cạnh ô `nsTim`: chọn **Đơn vị** (từ danh mục + "(ngoài danh mục)" + "Tất cả"), **Vai trò**, **Trạng thái** (Đang hoạt động / Ngừng / Tất cả). Lọc phía trình duyệt trên `NS_DS` (không thêm action, không gọi lại máy chủ), kết hợp với ô tìm; hiện "x / y người". Giữ lựa chọn khi danh sách tải lại sau Lưu/Xóa. TT/TP (chỉ thấy tổ viên) vẫn có lọc Đơn vị + Trạng thái. Mức L1.

**B5e (thêm 10/11/2026 theo chủ dự án) – Thứ tự người trong danh sách đăng nhập.** Opus chốt **cách (b)**, không dùng sắp theo vai trò (Ban chỉ đạo cùng vai trò `LANHDAO` → vô hiệu) hay theo chữ trong Chức vụ (dễ sai). Thêm cột **`ThuTu` vào CUỐI `TAB.NhanSu`** (cột N; không đổi/chèn cột cũ); tự thêm tiêu đề nếu Sheet chưa có (giống `donViTab_`, không bắt chạy `setup`). Form nhân sự (chỉ ADMIN) có ô "Thứ tự hiển thị" (số nguyên ≥ 0, trống = cuối). `dsLogin` sắp: đơn vị (theo `ThuTu` danh mục, rồi ABC) → `ThuTu` người (trống xếp sau) → họ tên ABC; vẫn chỉ trả `ma, ten, donVi`. Danh sách nhân sự và B4 dùng cùng thứ tự. Mock: tab NhanSu cũ không có cột `ThuTu` vẫn chạy (đọc/ghi/append/import/xóa); `setCell_`/`append_` ghi đúng cột N; `dsLogin` không lộ vai trò. Mức L2. Sau khi triển khai: chủ dự án nhập Võ Hoài Trung = 1, Mai Văn Mười = 2.

## ĐỢT T – Tốc độ + chống bấm lặp (Claude Code (Sonnet)) · thêm 10/11/2026 theo yêu cầu chủ dự án
**Hiện trạng (chủ dự án):** ca < 10 người vẫn thấy chậm; bấm Nhận hộp/Báo cáo chưa thấy phản hồi nên người dùng bấm liên tục.
**Opus đã khoanh (đọc mã, chưa đo):** mọi lệnh ghi qua `withLock_` (khóa chung toàn hệ thống, `waitLock(25000)`) → người sau xếp hàng; tab `NhatKy` (lớn nhất) **không** nằm trong `CACHE_TABS` nên mỗi lần ghi/`hopGoiY`/`lichSu` đọc lại cả tab; mỗi lần ghi còn ghi `log_` sang tab khác; sau khi ghi giao diện có thể gọi thêm vài lệnh đọc. `google.script.run` tự nó mất ~1–2 giây mỗi lượt. Bảng nhiều hộp (`ghiLo`) đã khóa nút + có `idLo` chống ghi trùng; các nút khác (Nhận hộp, Vào ca, Trả hộp, form Một hộp, Nhập hộ, quản lý) chưa thống nhất.
**T1 – Lớp chờ dùng chung + chống bấm lặp (làm trước, ít rủi ro).** Trong `call()` của `Index.html`: với action GHI (không thuộc `READ_ACTIONS`) hiện lớp phủ toàn màn hình có vòng quay + chữ "Đang gửi…" + thanh tiến trình **ước lượng** (chạy chậm dần tới ~90%, xong thì 100% rồi tắt; không giả số %), chặn mọi bấm cho tới khi có kết quả; sau 8 giây đổi chữ "Hệ thống đang bận, vui lòng chờ – KHÔNG bấm lại"; lỗi/hết hạn phiên phải tắt lớp phủ. Action ĐỌC: thanh mảnh trên đầu trang, không chặn. Cùng lúc chỉ cho **một** lệnh ghi đang chạy (lệnh ghi thứ hai khi lệnh trước chưa xong → bỏ qua). Không đổi tên/tham số `call()`, giữ mọi id. Máy chủ: `ghi`/`vaoCa`/`tra` nhận thêm `idGui` tùy chọn (như `idLo`, CacheService theo người, 10 phút) → gửi lặp cùng `idGui` trả lại kết quả cũ, không ghi trùng.
**T2 – Đo rồi mới tối ưu.** Thêm đo thời gian từng phần ở máy chủ (auth, chờ khóa, đọc tab nào, ghi, log) cho các action `ghi`, `ghiLo`, `hopGoiY`, `lichSu`, `me`, `dashboard`; ghi số đo vào `NhatKyHT` hoặc trả kèm khi ADMIN bật chế độ đo; **không** ảnh hưởng người dùng thường. Từ số đo, đề xuất các tối ưu xếp theo lợi ích/rủi ro, ví dụ: chỉ đọc phần cuối `NhatKy` cho thao tác trong ngày; gộp `log_` cùng lượt ghi; bỏ lệnh đọc thừa sau khi ghi (dùng luôn dữ liệu máy chủ trả về); thu hẹp vùng khóa (kiểm tra hợp lệ ngoài khóa, chỉ ghi trong khóa). **Dừng ở bảng đề xuất có số đo trước/sau trên mock → Opus review** rồi mới làm phần đụng cách đọc/ghi `NhatKy` hoặc khóa.
**Không đụng:** cột/tab Sheet, cách tính số liệu, link.

---

## Thứ tự
A (khẩn) → triển khai → A2 dữ liệu thật (chủ dự án duyệt) → B (B1–B3) → B4 → **H1 → T1 → T2 (đo + đề xuất)** → C1 → C2 → Opus review C → triển khai. Mỗi đợt: Sonnet dừng ở cuối đợt, báo cáo kênh B, cập nhật SNAPSHOT.
