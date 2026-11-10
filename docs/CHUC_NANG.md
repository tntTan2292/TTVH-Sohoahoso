# Sổ đăng ký chức năng (KHÔNG ĐƯỢC LÀM MẤT)

> Đây là danh sách **mọi chức năng đang chạy**. Trước khi sửa bất kỳ file nào, đọc mục liên quan. Sau khi sửa, đi lại **bảng kiểm tra** ở cuối file.
> Thêm chức năng mới = thêm một dòng vào đây **trong cùng commit**. Bỏ một chức năng = phải được chủ dự án đồng ý và ghi vào `CHANGELOG.md`.
>
> Cột **Mã** dùng để nhắc tới chức năng trong commit, prompt và CHANGELOG (ví dụ "sửa F-BC-04").
> Cột **Backend** là hàm trong `apps-script/Code.gs`; cột **Giao diện** là hàm/`id` trong `apps-script/Index.html`.

Cập nhật lần cuối: 09/11/2026 — phiên bản 13 + F-QL-10, F-BC-18, F-BC-19, F-QL-11 (chưa triển khai), mock 242 đạt / 0 lỗi.

---

## 1. Vai trò và tab được thấy

| Vai trò | Tab thấy (`start()` trong Index.html) | Ghi chú |
|---|---|---|
| `TOVIEN` | Báo cáo | **Không** có Dashboard (server cũng chặn `dashboard`) |
| `TOTRUONG`, `TOPHO` | Báo cáo, Quản lý ca, Dashboard | `isAdmin = true` |
| `LANHDAO` | Dashboard | Chỉ được gọi `me`, `dashboard`, `doiPin`, `lichSu` |
| `ADMIN` | Báo cáo, Quản lý ca, Nhân sự, Dữ liệu, Nhật ký, Dashboard | `isSuper = true`; **không vào ca** |

Tab trong giao diện: `pBao`, `pQL`, `pNS`, `pDL`, `pLG`, `pDash` (hàm `showTab`).

---

## 2. Đăng nhập và tài khoản (F-DN)

| Mã | Chức năng | Backend | Giao diện |
|---|---|---|---|
| F-DN-01 | **Đăng nhập 3 bước (B4):** Bước 1 chọn Đơn vị `#lgDv` (thứ tự danh mục, kèm số người), Bước 2 chạm thẻ tên `#lgNguoi` (ô ẩn `#lgUser` giữ Mã HRM đã chọn), Bước 3 PIN; gõ `#lgSearch` thì tìm trong mọi đơn vị; nhớ người lần trước bằng `localStorage` (`sohoa_lg_ma`, chỉ Mã HRM, không PIN) và chọn sẵn đơn vị + tên. Danh sách tên đăng nhập công khai (chỉ mã, tên, đơn vị; sắp theo THỨ TỰ DANH MỤC đơn vị rồi `ThuTu` người rồi họ tên — B5e; bỏ người nghỉ; không trả vai trò, không trả `thuTu`) | `dsLogin` | `renderLoginSelect`, `lgChon`, `lgNho`, `lgKhoiPhuc`, `#lgSearch`, `#lgDv`, `#lgNguoi`, `#lgUser` |
| F-DN-02 | Đăng nhập tên + PIN, trả token | `login` → `login_` | `#lgPin`, `#lgBtn`, `#lgMsg` |
| F-DN-03 | Sai 5 lần → tạm khóa 15 phút (không đặt cột `Khoa`) | `login_`, `KHOA_PIN_GIAY` | thông báo lỗi |
| F-DN-04 | Sai cộng dồn 20 lần → khóa hẳn (`Khoa = TRUE`) | `login_`, `MAX_SAI_PIN_TICH_LUY` | thông báo lỗi |
| F-DN-05 | Buộc đổi PIN lần đầu (server chặn mọi action trừ `me`, `doiPin`) | `api`, `auth_` | `#vPin`, `#npin`, `#npin2`, `#pinBtn` |
| F-DN-06 | Cấm PIN dễ đoán (lặp, liên tiếp, nửa lặp, danh sách phổ biến, trùng đuôi Mã HRM) | `pinYeu_`, `PIN_YEU` | thông báo lỗi |
| F-DN-07 | PIN băm SHA-256 + muối | `hash_` | — |
| F-DN-08 | Cấp lại PIN: TT/TP chỉ cho tổ viên; quản lý/lãnh đạo/ADMIN chỉ ADMIN cấp | `resetPin_`, `quyenTrenNguoi_` | `#qlRs` (Quản lý ca), nút cấp PIN ở `loadNS` |
| F-DN-09 | Mở khóa tài khoản (cùng quy tắc quyền như F-DN-08) | `moKhoaTK_` | `#qlUk` |
| F-DN-10 | Bỏ kiểm tra Gmail (chạy chế độ ẩn danh) | — | — |
| F-DN-11 | Hết phiên → báo và tải lại trang | `auth_` | `call()` |

## 3. Vào ca (F-VC)

| Mã | Chức năng | Backend | Giao diện |
|---|---|---|---|
| F-VC-01 | Khung "Ca đang mở – Vào ca" (mở sớm 15', đóng sau giờ kết thúc 60') | `vaoCaInfo_`, `me_.vaoCa` | `renderBao` → `#boxVaoCa`, `.btn-join-ca` |
| F-VC-02 | Vào ca ghi `PhanCa`, không ghi trùng, có log `VAO_CA` | `vaoCa_` | `call('vaoCa', {ca})` |
| F-VC-03 | Lãnh đạo, ADMIN không vào ca (`duocVaoCa = false`) | `duocVaoCa_` | ẩn khung vào ca |
| F-VC-04 | Hiển thị số người đã vào (`soDaVao`), không chặn | `vaoCaInfo_`, `dsCa_` | `#boxVaoCa`, Quản lý ca |

Giờ ca (`CA` trong Code.gs): Sáng 07:30–11:30 (4 giờ), Chiều 13:00–17:00 (4 giờ), Tối 18:00–21:00 (3 giờ).

## 4. Báo cáo (F-BC)

Các khâu theo vai trò (`stepsFor()` trong Index.html — **đừng đổi nếu không đổi cả server**):

| Vai trò | Khâu |
|---|---|
| Tổ viên | `NHAN_NHOM` (Nhận hộp), `SCAN`, `TACH`, `OCR` |
| Tổ trưởng / Tổ phó | `NHAN` (Nhận từ TT Lưu trữ), `NHAN_NHOM`, `SCAN`, `TACH`, `OCR`, `TRA` (Trả hộp) |
| ADMIN | `NHAN`, `TRA` |

| Mã | Chức năng | Backend | Giao diện |
|---|---|---|---|
| F-BC-01 | Thẻ trạng thái ca hôm nay (nhóm, thành viên, hạn nhập, đã chốt) | `me_.cas` | `renderBao` → `#caInfo` |
| F-BC-02 | Form báo cáo theo khâu, chọn ca nếu nhiều ca cùng mở | `ghi_` | `buildForm`, `#fCa`, `#steps`, `#fields`, `#fSend`, `send()` |
| F-BC-03 | Ô mã hộp: mỗi dòng một mã, không dấu phẩy, chữ/số/`. _ - /`, ≤30 ký tự; mã trùng bị bỏ + cảnh báo | `ghi_`, `MA_HOP_RE` | `#fHop`, `#fCnt` (đếm mã) |
| F-BC-04 | Gợi ý mã hộp theo khâu | `hopGoiY_` | `#dlHop` (datalist) |
| F-BC-05 | Số hồ sơ/trang/tờ/trang lỗi không âm; tick "Hết hộp" | `ghi_` | `#fHs`, `#fTrang`, `#fTo`, `#fLoi`, `#fHet` |
| F-BC-06 | Hộp đã báo xong ở một khâu thì không nhận thêm ở khâu đó | `ghi_` | thông báo lỗi |
| F-BC-07 | Nhận hộp: chọn **Cá nhân / Nhóm** (`kieuNhan`); NHOM khi chưa có nhóm → từ chối | `ghi_` | `#kieuNhan`, `#kieuNhanInfo`, `KIEU_NHAN`, `veKieuNhan` |
| F-BC-08 | Scan: tick "Đồng thời ghi Tách file bằng đúng số Scan" (gửi thêm bản ghi TACH; Tách lỗi vẫn giữ Scan) | `ghi_` (2 lần gọi) | `#fKemTach`, `KEM_TACH`, `send()` |
| F-BC-09 | Nhận từ TT Lưu trữ: dán danh sách mã; ô Mã hồ sơ / ghi chú ("Từ 472 đến 476") lưu vào `MaHoSo` và `GhiChu` | `ghi_` | `#fMaHs`, `#fNote` |
| F-BC-10 | Trả hộp: hộp có bản ghi Nhận mà chưa Tách xong → bỏ qua + cảnh báo; hộp không có bản ghi Nhận → cảnh báo nhưng vẫn ghi | `ghi_` | hiển thị `warnings` |
| F-BC-11 | Chưa phân nhóm vẫn báo được (tính cá nhân: `Nhom` rỗng, `ThanhVien` = chính mình) | `ghi_`, `nhomOf_` | — |
| F-BC-12 | `ThanhVien` chốt lúc báo cáo → đổi nhóm sau không mất số cá nhân | `ghi_` | — |
| F-BC-13 | Nhật ký ca của tôi + nút Hủy (chỉ quản lý; tổ viên không tự hủy) | `nhatKy_`, `huy_` | `loadNK` → `#nk` |
| F-BC-14 | Widget tiến độ gọn ở tab Báo cáo (ẩn với tổ viên) | `dash_` | `renderWidget` → `#wgBao` |
| F-BC-15 | Lịch sử cá nhân (chia theo thành viên nhóm lúc báo cáo) | `lichSu_` | `openLichSu`, `#modalLS`, `#lsTu`, `#lsDen`, `#lsBody` |
| F-BC-16 | Ngoài giờ nhập / ca đã chốt → không ghi được | `caState_`, `ghi_` | chip trạng thái |
| F-BC-17 | Lãnh đạo không ghi được | `ghi_`, `LANHDAO_ACTIONS` | ẩn tab Báo cáo |
| F-BC-18 | **Báo cáo nhiều hộp một lần (P2):** bảng nhiều dòng cho Scan/Tách/OCR (≤ 10 hộp × 3 khâu/lần). Mỗi dòng: mã hộp (chọn gợi ý/chạm chip hoặc **gõ tay** mã ngoài danh sách), **mã hồ sơ đã làm**, số hồ sơ (gõ "472-476" gợi ý 5), **số tờ** (P4: bảng này không có ô Số trang, chỉ gửi `soTo`; form cũ vẫn có cả hai ô), trang lỗi (Scan), xong hộp. Một confirm tóm tắt; kết quả từng hộp; hộp lỗi bỏ qua và báo lý do, hộp đúng vẫn ghi. Cả lô chỉ đọc NhatKy 1 lần (R1); gửi lại cùng `idLo` không ghi trùng (R4). Form một hộp cũ vẫn còn (nút "Một hộp (form cũ)"; chọn được nhớ trong trình duyệt) | `ghiLo_` (gọi lại `ghi_` cho từng mục), `memoThem_`, `LO_MAX_HOP` | `loRenderBox`, `loThuThap`, `loGui`, `loPrepare`, `loModeHtml`, `#fLoBox`, `#fLoRes` |
| F-BC-19 | **Tick nhiều khâu (P3):** trong bảng nhiều hộp, ô tick "Ghi cùng lúc các khâu" Scan / Tách file / OCR dùng **cùng số liệu**. Bấm nút khâu Scan → mặc định Scan + Tách; bấm Tách → chỉ Tách; bấm OCR → chỉ OCR (OCR do người dùng tự bật, có nhắc khi gửi). Tick được **nhớ theo từng nút khâu** (localStorage). Khâu đã ghi xong cho một dòng được đánh dấu "Đã ghi", gửi lại chỉ ghi khâu còn lại (không ghi đôi). Thay thế dần tick "kèm Tách" (F-BC-08, F-QL-10 vẫn còn ở form cũ) | `ghiLo_` (sắp Scan → Tách → OCR) | `loKhauDoc`, `loKhauChon`, `loThuThap`, `loGui`, `LO_KHAU_MD`, `loPrepare` |
| F-BC-20 | **Có nhóm thì chỉ báo cáo theo nhóm (QĐ1, 10/11/2026):** trong một ca, người đã được phân nhóm chỉ báo cáo/nhận hộp theo nhóm; chỉ người **chưa có nhóm** mới báo cáo cá nhân. Máy chủ `ghi_` (đường thường: `kieuNhan='CANHAN'` khi đã có nhóm → từ chối; nhập hộ `boSung`: `nguoiHo` đã có nhóm mà `nhom` trống/khác → từ chối); `ghiLo_` kế thừa. Giao diện: ẩn nút "Cá nhân"/"Nhóm" không áp dụng; Nhập hộ: chọn người đã có nhóm → tự chọn và khóa ô Nhóm | `ghi_`, `ghiLo_` | `#kieuNhan`, `veKieuNhan`, `#hoNhom`, `#hoNg` |

## 5. Quản lý ca – Tổ trưởng/Tổ phó/ADMIN (F-QL)

| Mã | Chức năng | Backend | Giao diện |
|---|---|---|---|
| F-QL-01 | Chọn ngày/ca, xem nhân sự trong ca, tự làm mới 20 giây | `dsCa_` | `initQL`, `loadQL`, `#qlNgay`, `#qlCa`, `#qlLoad`, `#qlBody` |
| F-QL-02 | Tự ghép cặp, chỉnh tay, Lưu phân nhóm | `luuNhom_` | `#qlGhep`, `#qlLuu` |
| F-QL-03 | Đổi nhóm từng ô lưu ngay (`chiDoi: true`, chỉ sửa người được gửi) | `luuNhom_` | `loadQL` (onchange) |
| F-QL-04 | Thêm / bỏ người khỏi ca; bỏ khỏi ca thì bỏ luôn khỏi nhóm (log `BO_KHOI_NHOM`) | `suaCa_` | `#qlAddSel`, `#qlAdd`, nút `data-rm` |
| F-QL-05 | Xác nhận & chốt ca (không chốt ngày tương lai) | `chot_` | `#qlChot` |
| F-QL-06 | Mở khóa ca, hiệu lực 60 phút | `chot_` (`mo: true`), `moConHieuLuc_` | `#qlMo` |
| F-QL-07 | Cấp lại PIN / mở khóa tài khoản | xem F-DN-08, F-DN-09 | `#qlNs`, `#qlRs`, `#qlUk`, `#qlMsg3` |
| F-QL-08 | Nhập số liệu hộ thành viên (ngày hôm nay hoặc quá khứ; nhóm tùy chọn, "Cá nhân" thì bắt buộc chọn người) | `ghi_` (`boSung`, `nguoiHo`) | `renderHo`, `#hoCard`, `#hoSteps`, `#hoNhom`, `#hoNg`, `#hoSend` |
| F-QL-09 | Áp nhóm đang chọn sang khung nhập hộ | — | `apNhomQL` |
| F-QL-10 | Nhập hộ khâu Scan: tick "Đồng thời ghi Tách file PDF bằng đúng số Scan" (gửi thêm bản ghi `TACH` nhập hộ, bỏ trang lỗi; Tách lỗi vẫn giữ Scan) | `ghi_` (2 lần gọi, `boSung`) | `renderHo` → `#hoKemTach`, `#hoSend` |
| F-QL-11 | Nhập hộ bằng **cùng bảng nhiều hộp** với F-BC-18 (khâu Scan/Tách/OCR; tham số `boSung`, `nguoiHo`, `nhom`, `ngay`, `ca` truyền qua `ghiLo`). Form nhập hộ cũ giữ nguyên (nút "Một hộp (form cũ)"), nên F-QL-10 vẫn còn | `ghiLo_`, `ghi_` (`boSung`) | `renderHo` → `#hoLoBox`, `#hoLoRes`, `#hoSend`, `loGui` |

## 6. Nhân sự – chỉ ADMIN (F-NS)

> **B5c – hiển thị Ban chỉ đạo:** người `LANHDAO` có Chức vụ thì dòng tiêu đề sau đăng nhập (`#hSub`) và cột Vai trò tab Nhân sự hiện **Chức vụ** (hàm `vaiHienThi`); chức vụ dài cắt "…" (không vỡ dòng ở 375px). Không thêm vai trò, không đổi phân quyền.

| Mã | Chức năng | Backend | Giao diện |
|---|---|---|---|
| F-NS-01 | Danh sách nhân sự | `dsNhanSu_` | `loadNS` → `#nsList` |
| F-NS-02 | Thêm / sửa (ghi log cũ → mới) | `luuNhanSu_` | `#nsMa`…`#nsAct`, `#nsSave`, `#nsClear` |
| F-NS-03 | Cấp PIN mới từ danh sách | `resetPin_` | nút `data-p` |
| F-NS-04 | **Tab Nhân sự cho Tổ trưởng/Tổ phó (QĐ2):** TT/TP có tab "Nhân sự" chỉ thấy **tổ viên** (không email, không cột PIN, không tài khoản quản lý/LĐ/ADMIN, không người giả TN-xx): ô tìm (`#nsTim`), nút **Sửa** (họ tên, chức vụ, đơn vị, hoạt động), **Cấp PIN mới**, **Mở khóa**. Không đổi vai trò, không tạo mới. Máy chủ: `dsNhanSu_(u)` lọc theo vai trò; `luuToVien_` (gọi từ `luuNhanSu_` khi không phải ADMIN). Khối "Quản lý tài khoản ca" cũ (`#qlNs`…) **giữ nguyên** chờ nghiệm thu | `dsNhanSu_`, `luuToVien_`, `quyenTrenNguoi_` | `#pNS`, `#nsTim`, `#nsMsg2`, `veNS`, `#nsFormCard` |
| F-NS-05 | ADMIN: nút **Mở khóa** trong bảng tab Nhân sự (gọi `moKhoaTK`, đặt lại bộ đếm sai PIN; ADMIN mở khóa được mọi vai trò) | `moKhoaTK_` | nút `data-k` trong `veNS` |
| F-NS-06 | **Danh mục Đơn vị (B1, QĐ3), chỉ ADMIN sửa:** tab `DonVi` (`TenDV`, `HoatDong`, `ThuTu`) tự tạo khi cần (không phải chạy `setup`). ADMIN thêm / sửa thứ tự / ẩn–hiện / đổi tên (chỉ khi chưa ai dùng đơn vị đó; không xóa, chỉ ẩn). Tên chuẩn hóa khi lưu (bỏ khoảng trắng thừa, NFC); trùng không phân biệt hoa/thường/khoảng trắng bị chặn. Ô **Đơn vị** `#nsDv` ở form ADMIN **và** form TT/TP sửa tổ viên là danh sách chọn; máy chủ (`donViChon_` trong `luuNhanSu_`, `luuToVien_`) từ chối đơn vị ngoài danh mục hoặc đang ẩn, trừ khi giữ nguyên giá trị cũ của người đó (không gửi `donVi` = giữ nguyên). Tạo nhân sự mới bắt buộc chọn đơn vị trong danh mục. TT/TP gọi `dsDonVi` để lấy danh sách chọn | `dsDonVi_`, `luuDonVi_`, `donViChon_`, `donViTab_`, `chuanTen_` | `#dvCard`, `#dvTen`, `#dvThuTu`, `#dvLuu`, `#dvList`, `#nsDv`, `loadDV`, `fillNsDv`, `veDV`, `saveDV` |
| F-NS-07 | **Chuẩn hóa đơn vị đang trùng (B2), chỉ ADMIN:** gom tên đơn vị của nhân sự giống nhau sau chuẩn hóa (khoảng trắng, hoa/thường, NFC) về đúng tên trong danh mục. **Xem trước** (không ghi gì) → **Áp dụng** (gõ `DONVI`): sao lưu mã/họ tên/đơn vị cũ (không PIN) vào `SaoLuuXoa`, đổi cột `DonVi` (ô đặt `@` trước), log `CHUAN_HOA_DON_VI` từng cặp cũ → mới + dòng tổng. Tên chưa có trong danh mục liệt kê kèm gợi ý; ADMIN chọn gom về đơn vị có sẵn hoặc `+` (thêm vào danh mục) qua `anhXa`. Bỏ qua người giả `TN-xx`. Chạy lại không đổi gì nữa | `chuanHoaDonVi_` | `#dvChCard`, `#dvChXem`, `#dvChKq`, `#dvChMsg`, `dvChCall`, `veDvCh` |
| F-NS-08 | **Import nhân sự từ Excel/CSV/dán (B3, QĐ4), chỉ ADMIN:** cột Mã HRM, Họ tên, Chức vụ, Đơn vị (phải trong danh mục), Vai trò (`TOVIEN/TOTRUONG/TOPHO/LANHDAO` — **B5c:** thêm `LANHDAO` cho Ban chỉ đạo, chỉ xem, quyền không đổi; nhận cả "Tổ viên/Tổ trưởng/Tổ phó/Lãnh đạo"; `ADMIN` bị từ chối; trống = Tổ viên). Đọc `.xlsx/.csv` bằng SheetJS 0.18.5 từ `cdnjs.cloudflare.com` (nạp khi cần), hoặc dán từ Excel; nút **Tải file mẫu**. Mã HRM giữ dạng **văn bản** (số 0 đầu; mã kiểu số bị báo lỗi; ghi với `@`). Xem trước từng dòng (OK / bỏ qua mã đã có / lỗi); còn dòng lỗi → không ghi gì; gõ `IMPORT` → ghi một lần (`appendMany_`), PIN tạm sinh ngẫu nhiên, **lưu dạng băm** (`PinHash`+`Salt`, `DoiPin=TRUE`), hiện **một lần** trong kết quả, không vào log/sao lưu. Tối đa 300 dòng/lần | `importNhanSu_`, `pinTamMoi_`, `boDau_` | `#imCard`, `#imFile`, `#imDan`, `#imMau`, `#imXem`, `#imKq`, `#imMsg`, `imXem`, `imGhi`, `imTaiMau`, `imDocFile`, `imDoiDong` |
| F-NS-09 | **ADMIN xóa tài khoản tạo nhầm (B5):** nút **Xóa** ở bảng tab Nhân sự (chỉ ADMIN) → gõ lại đúng Mã HRM. Chỉ xóa khi **chưa từng dùng**: không có trong `NhatKy` (`NguoiNhap`, `ThanhVien`, `NguoiHuy`), `PhanCa`, `PhanNhom` (`MaHRM`, `NguoiPhan`), `ChotCa` (`NguoiXacNhan`); có dấu vết → từ chối, gợi ý "Ngừng hoạt động". Không tự xóa, không xóa ADMIN hoạt động cuối cùng. `TN-xx` luôn xóa được kèm PhanCa/PhanNhom. **E1:** trước `deleteRow` đọc thẳng ô MaHRM của dòng trên Sheet, lệch thì tìm lại dòng, không thấy thì từ chối (không xóa nhầm do đệm cũ). Sao lưu `SaoLuuXoa` (tab `NhanSu(xóa)`) chỉ gồm mã/họ tên/chức vụ/đơn vị/email/vai trò — không PinHash/Salt/PinTam; log `XOA_NHAN_SU` | `xoaNhanSu_` | nút `data-x` trong `veNS` (`#nsList`, `#nsMsg2`) |
| F-NS-12 | **Thứ tự người ở màn hình đăng nhập (B5e):** cột `ThuTu` ở CUỐI `TAB.NhanSu` (cột N; tab cũ 13 cột tự được thêm cột + tiêu đề khi ghi, `nsDamBaoCot_`, không bắt chạy `setup`; không gọi ở đường đọc). Ô `#nsThuTu` (chỉ ADMIN; số nguyên ≥ 0, trống = xếp cuối; không gửi = giữ nguyên). Thứ tự chung `nhanSuSapXep_`: đơn vị (ThuTu danh mục, ngoài danh mục xếp sau) → `ThuTu` người (trống sau) → họ tên ABC; dùng cho `dsLogin` và `dsNhanSu_`. `renderLoginSelect` không sắp lại. `luuToVien_` (TT/TP) không đụng `ThuTu`. Mã cố định sau triển khai: nhập Võ Hoài Trung = 1, Mai Văn Mười = 2 | `thuTuNhap_`, `thuTuNguoi_` | `#nsThuTu`, `renderLoginSelect` |
| F-NS-10 | **Bộ lọc danh sách nhân sự (B5d):** cạnh ô tìm `#nsTim` có 3 ô chọn Đơn vị `#nsLocDv` (danh mục + "(ngoài danh mục)" + Tất cả) / Vai trò `#nsLocVai` (chỉ ADMIN) / Trạng thái `#nsLocTt` (Hoạt động / Bị khóa / Ngưng); lọc phía trình duyệt trên `NS_DS`, kết hợp với ô tìm; `#nsDem` hiện "x / y người"; giữ lựa chọn sau khi tải lại danh sách. TT/TP có lọc Đơn vị + Trạng thái. Không đổi `Code.gs` | — | `veNS`, `fillLocDv`, `#nsLoc`, `#nsLocDv`, `#nsLocVai`, `#nsLocTt`, `#nsDem` |
| F-NS-11 | **Khôi phục số 0 đầu Mã HRM (chỉ ADMIN):** Mã HRM toàn chữ số ngắn hơn 8 (bị Sheets cắt số 0, ví dụ 61887) → đệm lại 00061887, ghi dạng văn bản (cột MaHRM của NhanSu đặt `@`). Xem trước (không ghi) → Áp dụng (gõ `MAHRM`): sao lưu [mã cũ, họ tên, mã mới] (không PIN) vào `SaoLuuXoa`, log `CHUAN_HOA_MA_HRM`. Mã đệm xong trùng mã có sẵn/trùng nhau → xung đột, không đổi. Bỏ qua mã có chữ (ADMIN, TN-xx) và mã đã đủ độ dài. Chỉ sửa NhanSu; tab khác tự khớp nhờ `read_`. Người đang đăng nhập bằng mã cũ phải đăng nhập lại | `chuanHoaMaHRM_` | `#maCard`, `#maXem`, `#maKq`, `#maMsg`, `maCall`, `veMaXem` |

## 7. Dữ liệu – chỉ ADMIN (F-DL)

| Mã | Chức năng | Backend | Giao diện |
|---|---|---|---|
| F-DL-01 | Bảng bản ghi theo ngày, gồm bản ghi đã hủy (mờ, gạch ngang) | `nhatKy_` (`includeHuy`) | `loadDL` → `#dlList` |
| F-DL-02 | Sửa bản ghi (giữ nguyên `Loai`, ghi log) | `suaBanGhi_` | `editDL`, `#dlEdit`, `#eNgay`…`#eSave` |
| F-DL-03 | Xóa (hủy mềm) / khôi phục (từ chối nếu trùng hộp đã xong) | `huy_`, `khoiPhuc_` | nút `data-d`, `data-u` |
| F-DL-04 | Tạo dữ liệu mẫu (`THỬ NGHIỆM`, người giả TN-xx) | `taoMau_` | `#dlMauCa`, `#dlMau` |
| F-DL-05 | Xóa dữ liệu thử nghiệm (gồm nhóm mẫu; **B5b:** xóa cả người giả `TN-xx` theo tiền tố `TN-` bất kể ChucVu/DonVi, kèm PhanCa/PhanNhom của họ; thông báo ghi số người giả đã xóa; sao lưu NhanSu không kèm PinHash/Salt/PinTam) | `resetDuLieu_` (`THU`) | `#dlThu` |
| F-DL-06 | Xóa theo ngày / toàn bộ: phải gõ `XOA`; sao lưu tab `SL_<tab>_<giờ>` trước | `resetDuLieu_` (`NGAY`, `TATCA`), `backupTab_` | `#dlNgayDel`, `#dlAll` |
| F-DL-07 | **Chuẩn hóa báo cáo cá nhân → nhóm (A2, ADMIN):** khung trong tab Dữ liệu: chọn ngày + ca → **Xem trước** (bảng dòng, giờ, khâu, hộp, người, cũ → mới, lý do; dòng xung đột liệt kê riêng) → **Áp dụng** (gõ `NHOM`). Quét `NhatKy` không hủy/không THỬ NGHIỆM, khâu NHAN_NHOM/SCAN/TACH/OCR, `Nhom` rỗng mà người báo cáo thuộc một nhóm `PhanNhom` của đúng ngày/ca → đổi `Nhom` + `ThanhVien` = cả nhóm; dòng trùng (cùng nhóm/khâu/hộp, số liệu giống) → hủy mềm dòng thừa; số liệu khác → KHÔNG tự đổi. Áp dụng: sao lưu `SaoLuuXoa`, log `CHUAN_HOA_NHOM`/`CHUAN_HOA_NHOM_HUY` từng dòng + `CHUAN_HOA_NHOM_TONG` | `chuanHoaNhom_` | `#chCard`, `#chNgay`, `#chCa`, `#chXem`, `#chApDung`, `#chKq`, `initCH`, `chCall`, `veChXem` |

## 8. Nhật ký hệ thống – chỉ ADMIN (F-LG)

| Mã | Chức năng | Backend | Giao diện |
|---|---|---|---|
| F-LG-01 | Lọc theo khoảng ngày, mã người, hành động | `nhatKyHT_` | `initLG`, `loadLG`, `#lgTu`, `#lgDen`, `#lgMa`, `#lgHd`, `#lgList` |
| F-LG-02 | Mọi thao tác ghi đều log (ai, lúc nào, ca nào, cũ → mới) | `log_` | — |

## 9. Dashboard – TT/TP/Lãnh đạo/ADMIN (F-DB)

| Mã | Chức năng | Backend (trường trong kết quả `dash_`) | Giao diện |
|---|---|---|---|
| F-DB-01 | Chọn ngày: ◀ Ngày trước / Hôm nay / Ngày sau ▶, không xem ngày tương lai, dòng thứ-ngày, một dòng "Có dữ liệu: dd/mm/yyyy → dd/mm/yyyy · N ngày" (hai ngày đầu/cuối bấm được; ô lịch `#dNgay` có `min` = ngày đầu) | `khoangNgay` | `veNgayNav`, `#dNgay`, `#dTruoc`, `#dHomNay`, `#dSau`, `#dThu`, `#dNgayCo` |
| F-DB-02 | Widget tiến độ: 3 vòng Scan/Tách/OCR so với 175.000 tờ, còn lại, TB/ngày, TB/ca, ngày dự kiến xong | `tienDo`, `luyKe` | `widgetHtml`, `ring` |
| F-DB-03 | Khu ĐẦU CA: 3 thẻ ca (nhân sự, tồn đầu ca, **Nhận từ TTLT** (`cas[].nhanHop`, 0 nếu ca không nhận hộp), chưa scan, chờ tách, chờ OCR) + biểu đồ `c1`, `c3` | `cas[]` | `loadDash`, `zone('z1')` |
| F-DB-04 | Khu CUỐI CA: tờ scan/tách/OCR, hộp nhận/trả, "x/y nhóm đã báo cáo" + biểu đồ `c5` | `cas[].nhomDaBC`, `tongNhom` | `zone('z2')` |
| F-DB-05 | Khu KẾT THÚC NGÀY: nhận/trả/tồn, tờ + hộp xong 3 khâu, biểu đồ 10 ngày `c2`, `c4` | `day`, `series` | `zone('z3')` |
| F-DB-06 | Khu "Từng ca": mỗi người trong ca (nhóm, có mặt, số báo cáo, hộp, tờ 3 khâu); người thử nghiệm `TN-xx` không tính (nhân sự ca, `caNguoi`) trừ khi ADMIN bật `gomThu`. **Hộp nhận theo nhóm** hiện MỘT số ở tiêu đề nhóm (`cas[].nhanNhom`, đếm `MaHop` khác nhau của dòng `NHAN_NHOM` có nhóm); `caNguoi[].nhanHop` chỉ đếm hộp nhận **cá nhân** (hết lệch "2 hộp / 1 hộp" giữa thành viên cùng nhóm) | `caNguoi`, `cas[].nhanNhom` | `tungCaHtml` |
| F-DB-07 | Khu CHI TIẾT: bảng nhóm (năng suất tờ/người-giờ theo `*DVGio`) ở tab Ca – Nhóm; bảng cá nhân (chia 50/50) nay nằm ở tab Nhân sự (F-DB-15) | `nhom[]`, `canhan[]` | `zone('z4')`, `dashTabCaNhom` |
| F-DB-08 | Khu AI NHẬP: tổng hợp theo ca và người nhập + chi tiết từng lần báo cáo | `nguoiNhap`, `chiTiet` | `zone('z4', 'AI NHẬP')` |
| F-DB-09 | Số đầu kỳ từng ngày 02–08/11 (bảng `DauKy`), ca "Ngày (gộp)" | `caGop`, `luyKe.dauKyDen`, `DAU_KY_CA` | thẻ ca gộp |
| F-DB-10 | ADMIN: ô "gồm dữ liệu thử nghiệm" (mặc định loại `THỬ NGHIỆM`) | `dash_(ngay, gomThu)` | `#boxGomThu`, `#dGomThu` |
| F-DB-11 | In dashboard | — | `#dPrint` |
| F-DB-12 | Biểu đồ lỗi (CDN hỏng) thì số liệu vẫn hiện | — | `mk`, `try/catch` trong `dashVeBieuDo` |
| F-DB-13 | Cache dashboard, cập nhật khi có ghi | `dash_`, `cacheBump_` | — |
| F-DB-14 | Dashboard chia 5 tab con: Tổng quan (widget tiến độ, 6 KPI, trạng thái ca, biểu đồ `c4`) · Theo ngày (ĐẦU CA, CUỐI CA, KẾT THÚC NGÀY; `c1`,`c3`,`c5`,`c2`,`c4`) · Ca – Nhóm (`tungCaHtml` + bảng nhóm) · Nhân sự · Nhật ký nhập (AI NHẬP). Nhớ tab đang xem (`localStorage` `dashTab`); một lần gọi `dashboard` dùng cho 4 tab, biểu đồ chỉ vẽ khi tab hiện; thanh chọn ngày dùng chung; in/PDF in tab đang xem | `dashboard` | `#dTabs`, `.dtab`, `DASH`, `dashChonTab`, `dashHienTab`, `dashTabTongQuan`, `dashTabNgay`, `dashTabCaNhom`, `dashTabNhatKy`, `dashVeBieuDo` |
| F-DB-15 | Tab Nhân sự: thống kê từng người theo khoảng ngày (Hôm nay / 7 ngày / Tháng này / Từ đầu dự án / Tùy chọn từ–đến): số ca, tờ Scan/Tách/OCR, hộp xong, giờ-người, tờ/người-giờ, xếp hạng, dòng Tổng, bấm tiêu đề cột để sắp xếp; ghi chú khi khoảng chứa số đầu kỳ 02–08/11 (không có chi tiết từng người). Cùng quy tắc chia công với `canhan` của `dash_` (khoảng 1 ngày trùng khớp); loại bản hủy, THỬ NGHIỆM và người `TN-xx` (trừ ADMIN `gomThu`); chặn TOVIEN; tối đa 366 ngày | `thongKeNhanSu` → `{tu, den, soNgay, dauKyDen, nguoi[], tong}` | `thongKeNhanSu_`, `nhatKyRows_`, `congCaNhan_`, `dashTabNhanSu`, `dashNsTai`, `dashNsBang`, `#nsKhoang`, `#nsTu`, `#nsDen`, `#nsBody` |
| F-DB-16 | **Ô số liệu "ĐẦU CA" bấm được (C0):** ô Nhân sự / Hộp tồn đầu ca / Nhận từ TTLT / Chưa scan / Chờ tách file / Chờ OCR (số > 0) mở hộp thoại `#modalCT` (điện thoại: toàn màn hình) liệt kê: mã hộp (dạng chuẩn) · nhận lúc · nhóm nhận · Scan/Tách/OCR (✔ xong + số tờ) · tờ đã báo; ô lọc `#ctTim`; Nhân sự dùng `caNguoi` sẵn có (không gọi máy chủ). Máy chủ `chiTietCa {ngay, ca, loai: tonDau|nhan|chuaScan|chuaTach|chuaOcr, gomThu}` (ĐỌC; chỉ tải khi bấm; không TOVIEN). Danh sách và số trên ô cùng một hàm: `hopMoc_`/`hopTapTruoc_`/`hopTrongMoc_` (dash_ dùng chung) | `chiTietCa_`, `hopMoc_`, `hopTapTruoc_`, `hopTrongMoc_`, `hopHoSo_` | `mb`, `ctGan`, `openCT`, `closeCT`, `ctVe`, `#modalCT`, `#ctTitle`, `#ctTim`, `#ctBody`, `#ctDong` |
| F-DB-17 | **Đối soát hộp (H2):** tab con thứ 6 của Dashboard (cùng quyền Dashboard, tổ viên không thấy). Mỗi hộp một dòng: mã (dạng chuẩn, gộp biến thể) · nhận TTLT (ngày, ca, người) · nhóm nhận · Scan/Tách/OCR (số tờ lũy kế, ✔ khi HetHop) · ngày trả · trạng thái: Đủ / Đã nhận chưa làm / Đang làm dở / Làm xong chưa trả / **Thiếu nhận TTLT** (ghi "nhóm đã nhận") / **Trả khi chưa Tách xong**. Lọc khoảng ngày nhận, trạng thái (nút đếm), tìm mã (theo khóa); xuất CSV (UTF-8 BOM, chống chèn công thức). Trạng thái tính tới hết ngày chọn; bỏ bản ghi hủy và THỬ NGHIỆM như Dashboard. Máy chủ `doiSoatHop {tu, den, trangThai, tim, gomThu}` (ĐỌC) | `doiSoatHop_`, `hopTrangThai_`, `hopBanGhi_` | `dashTabDoiSoat`, `dashDsTai`, `dashDsBang`, `dsLoc`, `dsCsv`, `csvO`, `#dsTu`, `#dsDen`, `#dsTim`, `#dsXem`, `#dsBody` |

## 10. Hạ tầng (F-HT) — sửa nhầm là hỏng toàn hệ thống

| Mã | Chức năng | Ở đâu |
|---|---|---|
| F-HT-01 | Mọi action ghi + đăng nhập + vào ca chạy tuần tự trong 1 khóa; action đọc (`READ_ACTIONS`) không khóa | `api`, `withLock_` |
| F-HT-02 | Chống chèn công thức (`= + - @` → thêm dấu cách) | `safe_` |
| F-HT-03 | Mã HRM có số 0 đầu và mã hộp dạng `dd.mm.yy` (VD `02.01.85`): ghi dạng văn bản `@` bằng **cả** `append_` và `appendMany_` (dùng chung `TEXT_COLS` qua `textFmt_`), đọc đối chiếu lại; `read_` đưa mã hộp/mã hồ sơ đã bị Sheets đổi thành ngày về `dd.MM.yy`; `suaMaHopNgay()` (chỉ chủ Sheet chạy từ trình soạn) sửa dữ liệu cũ | `append_`, `appendMany_`, `textFmt_`, `read_`, `TEXT_COLS`, `suaMaHopNgay` |
| F-HT-04 | Cache đọc tab + bỏ cache khi sửa tay trên Sheet | `readValues_`, `tabVer_`, `onEdit` |
| F-HT-05 | `setup` bảo đảm đủ dòng (20.000 / 5.000) rồi mới định dạng cột; chỉ chủ Sheet chạy được | `setup`, `ownerOnly_`, `MIN_ROWS` |
| F-HT-06 | Chống XSS khi render dữ liệu người nhập | `esc()` trong Index.html |
| F-HT-07 | **Khóa mã hộp (H1, QĐ6):** `maHopKhoa_(v)` (bỏ khoảng trắng, in hoa; mã dạng các đoạn số ngăn dấu chấm thì bỏ số 0 đầu từng đoạn, đoạn `0`/`00` → `0`; mã khác mẫu: khóa là chính nó) và `maHopChuan_(v)` (đoạn 1 chữ số đệm thành 2: `2.1.87` → `02.01.87`; đoạn ≥ 2 chữ số giữ nguyên; chưa dùng để hiển thị, dành cho H2/H3). Mọi chỗ so/gom theo `MaHop` dùng khóa: `ghi_` (loại trùng trong danh sách nhập; `has` cho cảnh báo chưa nhận / chưa Scan / chưa Tách / chặn đã XONG / Trả), `ghiLo_` (gom dòng theo hộp), `khoiPhuc_` (kiểm trùng), `hopGoiY_` (gợi ý 5 khâu, trả mã đại diện `repMaHop_`), `nhatKyRows_` → `dash_` (nhận/Scan/Tách/OCR/Trả đếm hộp, hộp nhận nhóm `nnSet`, tồn đầu ca/chưa scan/chờ tách/chờ OCR) và `thongKeNhanSu_`, `chuanHoaNhom_` (`nhomKey`). Giá trị `MaHop` lưu vào Sheet và mọi chỗ hiển thị giữ nguyên chuỗi gốc | `maHopKhoa_`, `maHopChuan_`, `repMaHop_` | — |
| F-HT-08 | **Lớp chờ + chống bấm lặp (T1):** `call()` — lệnh GHI (không thuộc `READ_ACT`) hiện lớp phủ `#busy` (vòng quay, thanh tiến trình ƯỚC LƯỢNG chậm dần tới ~90%, sau 8 giây đổi chữ "KHÔNG bấm lại"), chặn bấm, mỗi lúc chỉ một lệnh ghi (lệnh thứ hai bị từ chối ngay); lệnh ĐỌC chỉ hiện thanh mảnh `#topBar`. `ghi`/`vaoCa` gửi kèm `idGui` (cùng nội dung gửi lại sau lỗi mạng dùng lại idGui) → máy chủ trả kết quả cũ, không ghi trùng (`idGui_`, cache 10 phút theo người+action). Không đổi tên/tham số `call()` | `idGui_` | `call`, `busyBat`, `busyTat`, `topBar`, `idMoi`, `#busy`, `#busyBar`, `#busyTxt`, `#topBar` |
| F-HT-09 | **Chế độ đo tốc độ (T2, chỉ ADMIN, mặc định tắt):** ADMIN gửi `do:true` → `api()` trả kèm `do:{action, tong, phan:{auth, khoa, doc:<tab>, sheet:<tab>, ghi:<tab>, log}}` (ms); người khác không nhận; không ghi thêm gì, không đổi `data`. Tab Dữ liệu có thẻ `#doCard`: bật `#doBat`, xem `#doXem` (bảng gom theo lệnh, kèm vòng gửi–nhận), sao chép `#doChep`, xóa `#doXoa`. Bảng đề xuất tối ưu ở `docs/DO_TOC_DO.md` (chưa tối ưu) | `pt_`, `readValues_`, `api` | `doKhoiTao`, `doGhi`, `doBang`, `doVe`, `#doCard`, `#doBat`, `#doXem`, `#doChep`, `#doXoa`, `#doBody` |

---

## Bảng kiểm tra sau mỗi lần sửa (bắt buộc)

**Tự động (máy):**
1. `node tools/test_mock.js` → phải `0 lỗi`, số kiểm tra **không được giảm** so với lần trước (hiện 371).
2. `node tools/kiem_tra_giao_dien.js` → mọi `id` và `call('…')` trong sổ này vẫn còn trong `Index.html`.

**Bằng tay trên link thử (sau khi triển khai), 4 tài khoản:**
- [ ] Tổ viên: đăng nhập → Vào ca → Nhận hộp (Cá nhân/Nhóm) → Scan có tick "kèm Tách" → OCR → xem Lịch sử cá nhân. Không thấy tab Dashboard.
- [ ] Tổ trưởng: Vào ca → Quản lý ca: Tự ghép cặp, đổi nhóm 1 ô, bỏ 1 người khỏi ca → Nhận từ TT Lưu trữ (có ghi chú mã hồ sơ) → Trả hộp → Nhập hộ (khâu Scan có tick kèm Tách) → Chốt ca → Mở khóa → Dashboard đủ 6 khu.
- [ ] Lãnh đạo: chỉ thấy Dashboard; đổi ngày bằng ◀ ▶ và nút ngày; xem 02–08/11 có số đầu kỳ.
- [ ] ADMIN: Nhân sự (thêm/sửa/cấp PIN/mở khóa; Danh mục Đơn vị; Chuẩn hóa đơn vị — Xem trước; Import Excel — Xem trước), Dữ liệu (sửa, xóa, khôi phục, tạo mẫu, xóa thử nghiệm), Nhật ký (lọc), Dashboard tick "gồm dữ liệu thử nghiệm".
