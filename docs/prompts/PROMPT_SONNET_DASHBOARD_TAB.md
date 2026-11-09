# Phiếu giao việc: Dashboard chia tab con + thống kê theo nhân sự

> Opus viết 10/11/2026. Developer: **Claude Code (Sonnet)** làm chức năng → tự viết prompt **Antigravity (Gemini)** làm đẹp → **Opus review tổng thể** một lần → triển khai.
> Căn cứ: chủ dự án (10/11/2026): "Dashboard lộn xộn, tách ra nhiều tab: thống kê ngày, tổng hợp theo nhân sự v.v. cho dễ quan sát".
> Làm SAU commit `d568321` (khoảng ngày F-DB-01) — dùng luôn `khoangNgay`.

## Hiện trạng
`loadDash()` vẽ một trang dài 7 khu nối tiếp: widget tiến độ → ĐẦU CA (z1) → CUỐI CA (z2) → KẾT THÚC NGÀY (z3) → TỪNG CA (z5, `tungCaHtml`) → CHI TIẾT nhóm/cá nhân (z4) → AI NHẬP (`nguoiNhap`, `chiTiet`). Một lần gọi `dashboard` cho một ngày. Chưa có thống kê nhân sự **theo khoảng ngày**.

## Bố cục mới (Opus chốt; chủ dự án có thể đổi tên tab khi thử)
Thanh **tab con** ngay dưới tiêu đề Dashboard; nhớ tab đang xem (`localStorage`, bọc try/catch). Thanh chọn ngày (ô lịch, ◀ ▶, Hôm nay, dòng khoảng ngày) **dùng chung** cho các tab theo ngày.

| Tab | Nội dung | Nguồn dữ liệu |
|---|---|---|
| **1. Tổng quan** (mặc định) | Widget tiến độ 175.000 tờ (3 vòng), 6 KPI của ngày đang chọn (Nhận / Trả / Tồn hộp; tờ Scan / Tách / OCR), 3 chip trạng thái ca (đang làm / hết ca – chưa chốt / đã chốt), biểu đồ sản lượng 10 ngày (`c4`) | `dashboard` hiện có |
| **2. Theo ngày** | ĐẦU CA (z1) + CUỐI CA (z2) + KẾT THÚC NGÀY (z3), giữ biểu đồ `c1`, `c3`, `c5`, `c2` | `dashboard` hiện có |
| **3. Ca – Nhóm** | TỪNG CA (`tungCaHtml`) + bảng năng suất theo nhóm (phần nhóm của z4) | `dashboard` hiện có |
| **4. Nhân sự** (MỚI) | Bộ chọn khoảng: **Hôm nay / 7 ngày / Tháng này / Từ đầu dự án / Tùy chọn (từ–đến)**. Bảng mỗi người: số ca làm, tờ Scan / Tách / OCR, hộp xong, năng suất tờ/người-giờ, xếp hạng; dòng tổng cuối bảng; sắp xếp theo cột khi bấm tiêu đề. Bảng cá nhân của ngày (phần cá nhân của z4) chuyển vào đây (= khoảng "Hôm nay") | **action mới `thongKeNhanSu`** |
| **5. Nhật ký nhập** | AI NHẬP: tổng hợp theo ca + người nhập và chi tiết từng lần báo cáo | `dashboard` hiện có |

Quyền xem: như hiện nay (TT/TP, Lãnh đạo, ADMIN; tổ viên không có Dashboard). ADMIN "gồm dữ liệu thử nghiệm" áp dụng cho mọi tab.

## Máy chủ: action đọc `thongKeNhanSu`
- Payload `{ tu, den, gomThu }`; thêm vào `READ_ACTIONS` và `LANHDAO_ACTIONS`; chặn `TOVIEN` như `dashboard`; `gomThu` chỉ có tác dụng với ADMIN.
- Trả `{ tu, den, soNgay, nguoi: [{ ma, ten, soCa, scanDV, tachDV, ocrDV, scanHop, tachHop, ocrHop, gio, dvGio }], tong: {...} }`.
- **Dùng lại đúng quy tắc của `dash_`** (không viết công thức mới): `dv` = tờ nếu > 0 ngược lại trang; chia công theo `ThanhVien` chốt lúc báo cáo; người-giờ theo `CA[ca].gio`; loại bản ghi hủy; loại THỬ NGHIỆM và người `TN-xx` khi không `gomThu`. Tách phần tính cá nhân trong `dash_` thành hàm dùng chung rồi gọi từ cả hai nơi.
- Số đầu kỳ `DauKy` 02–08/11 **không có chi tiết từng người** → không cộng vào bảng nhân sự; giao diện ghi chú một dòng khi khoảng chọn chứa 02–08/11.
- Giới hạn khoảng tối đa 366 ngày.
- Kiểm thử mock: khoảng = 1 ngày phải **trùng khớp** `canhan` của `dash_` cùng ngày; khoảng nhiều ngày = tổng các ngày; THỬ NGHIỆM/hủy/TN-xx bị loại; TOVIEN bị chặn.

## Giao diện (Sonnet làm chức năng, mức "dùng được")
- Tách `loadDash()` thành các hàm vẽ từng tab (ví dụ `dashTabTongQuan(d)`, `dashTabNgay(d)`, `dashTabCaNhom(d)`, `dashTabNhanSu()`, `dashTabNhapLieu(d)`); một lần gọi `dashboard` dùng cho tab 1, 2, 3, 5; tab 4 chỉ gọi `thongKeNhanSu` khi mở tab (không gọi thừa).
- Biểu đồ chỉ vẽ khi tab của nó đang hiện (Chart.js vẽ sai kích thước trong phần tử ẩn).
- **Giữ nguyên** các hàm và id đã đăng ký trong `docs/CHUC_NANG.md` (F-DB-01…13): `#dNgay`, `#dTruoc`, `#dHomNay`, `#dSau`, `#dThu`, `#dNgayCo`, `#boxGomThu`, `#dGomThu`, `#dBody`, `#dPrint`, `c1…c5`, `widgetHtml`, `tungCaHtml`, `veNgayNav`, `loadDash`, `mk`, `zone`. Widget ở tab Báo cáo (`renderWidget`) không đổi.
- In / PDF (`#dPrint`): in tab đang xem.
- `tools/kiem_tra_giao_dien.js` 0 lỗi; thêm id/hàm mới vào `docs/CHUC_NANG.md` (F-DB-14 tab con, F-DB-15 thống kê nhân sự) và `docs/API.md`.

## Sau khi Sonnet xong
Không có điểm phải dừng (action mới chỉ bổ sung, không đổi cách tính) → Sonnet **viết prompt Antigravity** (mẫu 10.3 + khối cấm trình duyệt mục 3b) để làm đẹp: thanh tab con dính đầu trang khi cuộn, mỗi tab rõ khu vực, tab Nhân sự đọc tốt ở 360px (bảng cuộn ngang, cột tên cố định). Antigravity xong → chủ dự án mở chat Opus review tổng thể → triển khai bằng skill `update-code-sohoa`.

## Không được
Không đổi cách tính số liệu trong `dash_` (chỉ tách hàm dùng chung, kết quả phải giống hệt — mock so trước/sau). Không đổi cột Sheet. Không xóa khu nào: mọi khu cũ phải có mặt ở một tab.
