# Phiếu NS12 (mục 27): Tổ trưởng/Tổ phó thêm tổ viên mới

Người làm: Sonnet. Opus review bắt buộc (đụng phân quyền và PIN). Opus viết 10/11/2026. Mức kiểm tra: L3, vì đổi phân quyền.

**Quyết định của chủ dự án (10/11/2026):** cấp quản lý được thêm người dùng; làm xong việc này mới đẩy code một lần. Quyết định này thay phần "TT/TP không tạo mới" của QĐ2. Phần còn lại của QĐ2 giữ nguyên.

**Phạm vi Opus chốt (cách hiểu "cấp quản lý"):** chỉ Tổ trưởng, Tổ phó (ADMIN đã thêm được từ trước). Chỉ tạo vai trò Tổ viên. Lãnh đạo vẫn chỉ xem.

## 1. Backend (`Code.gs`), bổ sung, không đổi hành vi cũ
Trong `luuToVien_`, đầu hàm: nếu `p.taoMoi === true` thì gọi hàm mới `taoToVien_(u, p)` và trả kết quả. Không có `taoMoi`: giữ nguyên như cũ, kể cả câu báo "không tạo tài khoản mới". Kiểm tra mock hiện có về việc này không được sửa, không được bỏ.

`taoToVien_(u, p)`:
- Kiểm `isAdmin_(u)`. Nhánh ADMIN của `luuNhanSu_` không đổi và không đọc `taoMoi`.
- `ma`, `ten` bắt buộc. `ma` không có khoảng trắng.
- Từ chối mã bắt đầu `TN-` (không phân biệt hoa thường). `dsNhanSu_` ẩn loại mã này với TT/TP nên tạo ra sẽ không thấy.
- Trùng mã: so bằng `maKhopSo0_` với **mọi** dòng `NhanSu`, không chỉ tổ viên. Trùng thì từ chối: "Mã HRM này đã có trong hệ thống", **không** kèm tên hay vai trò người đó.
- `p.vaiTro` có giá trị khác `TOVIEN`: từ chối. Luôn ghi `VaiTro: 'TOVIEN'`, `Email: ''`, `ThuTu: ''`, `HoatDong: true`.
- `chucVu` trống thì `'Tổ viên'`. Đơn vị: `donViChon_(p.donVi, undefined)`, bắt buộc thuộc danh mục.
- PIN tạm sinh như nhánh ADMIN, `DoiPin: true`, `SaiPin: 0`, `Khoa: false`.
- `log_(u.ma, 'THEM_NHAN_SU', ma + ' TOVIEN (do ' + u.vaiTro + ' tạo)')`. Không ghi PIN vào log.
- Trả `{ moi: true, ma: ma, pin: pin }`. Không thêm `luuNhanSu` vào `IDGUI_ACTIONS`, vì kết quả có PIN sẽ nằm trong đệm.

## 2. Giao diện (`Index.html`), khung thô, chỉ cho TT/TP
- Nút `#nsThem` "+ Thêm tổ viên" cạnh tiêu đề danh sách, chỉ hiện khi `!ME.isSuper`.
- Biến `NS_THEM_MOI`. Bấm `#nsThem`: bật `true`, hiện `#nsFormCard`, xóa các ô, `#nsMa` nhập được, tiêu đề "Thêm tổ viên mới", ẩn ô "Đang hoạt động", kéo lên form.
- Bấm Sửa một dòng: `NS_THEM_MOI = false`, tiêu đề "Sửa thông tin tổ viên", hiện lại ô "Đang hoạt động", `#nsMa` khóa như cũ.
- Với TT/TP, `#nsClear` hiện chữ "Hủy" và gọi `clearNS` (đã ẩn form). `NS_THEM_MOI` về `false`. ADMIN giữ nguyên "Nhập mới".
- `saveNS`: nếu `!ME.isSuper && NS_THEM_MOI` thì gửi thêm `taoMoi: true`.
- Tạo thành công: xóa các ô để thêm người tiếp, **nhưng giữ dòng báo PIN tạm trên màn hình**. Không gọi `clearNS` ở bước này vì hàm đó xóa thông báo và ẩn form.
- Giữ nguyên mọi `id` và hàm đang có. Không làm đẹp.

## 3. Kiểm tra mock (thêm, số kiểm tra không giảm)
TT và TP tạo được, ra PIN tạm, vai trò Tổ viên, `DoiPin` bật; người mới có trong `dsNhanSu` của TT và trong `dsLogin`; đăng nhập được bằng PIN tạm và bị buộc đổi PIN. Từ chối: thiếu mã, thiếu tên, mã có khoảng trắng, mã `TN-` và `tn-`, đơn vị ngoài danh mục, `vaiTro` khác Tổ viên; trùng mã với tổ viên, với ADMIN, với mã khác số 0 đầu; câu lỗi trùng không lộ tên. Bị từ chối thì số dòng `NhanSu` không đổi. Gửi kèm `email`, `thuTu` thì không ghi. Tổ viên và Lãnh đạo gửi `taoMoi` bị từ chối. Không có `taoMoi` thì TT/TP vẫn bị từ chối như cũ. ADMIN gửi `taoMoi` vẫn chạy đúng như cũ. `LogHeThong` không chứa PIN. `kiem_tra_giao_dien.js`: có `#nsThem`, ADMIN không thấy nút.

## 4. Tài liệu
Thêm dòng F-NS-12 và sửa F-NS-04 trong `CHUC_NANG`; sửa dòng `luuNhanSu` trong `API` (thêm `taoMoi`, bỏ "tạo mới → từ chối" ở TT/TP khi có `taoMoi`); `CHANGELOG`, `SNAPSHOT`, mục 27 `TIEN_DO_PO`. Commit có mã `F-NS-12`.

**DỪNG sau khi xong trong mã.** Không triển khai, không ghi Sheet thật, không viết prompt Antigravity (điểm phải dừng: phân quyền, PIN). Báo cáo kênh B cho Opus.
