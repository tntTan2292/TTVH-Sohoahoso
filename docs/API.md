# Hợp đồng giữa giao diện và máy chủ (API)

> `Index.html` chỉ nói chuyện với `Code.gs` qua các hàm dưới đây. **Đổi tên action, đổi tên trường gửi đi hoặc trường trả về = phải sửa cả hai file trong cùng một commit** và cập nhật file này.

## Cách gọi
- Công khai (chưa đăng nhập): `google.script.run.dsLogin()` (trả `{ngay, hm, nhanSu:[{ma,ten,donVi}]}` đã sắp sẵn theo thứ tự hiển thị, KHÔNG có vai trò/thuTu), `google.script.run.login(ma, pin)` → `{ token, doiPin, ... }` hoặc lỗi.
- Sau đăng nhập: mọi thứ đi qua `api(token, action, payload)` → luôn trả `{ ok: true, data }` hoặc `{ ok: false, err: 'thông báo tiếng Việt' }`.
- Ở giao diện dùng hàm `call(action, payload)` (trả Promise; lỗi là chuỗi `err`).

## Lớp chặn chung trong `api()`
1. `auth_(token)` — token hết hạn → lỗi "Phiên đăng nhập đã hết hạn".
2. Chưa đổi PIN lần đầu → chỉ được `me`, `doiPin`.
3. `LANHDAO` → chỉ được `me`, `dashboard`, `thongKeNhanSu`, `doiPin`, `lichSu`, `doiSoatHop`, `chiTietCa`.
4. Action không thuộc `READ_ACTIONS` chạy trong khóa (`withLock_`).
5. (T2) Mọi action nhận thêm `do:true` (chỉ có tác dụng với ADMIN) → kết quả có thêm trường `do:{action, tong, phan}` (ms từng phần; xem `docs/DO_TOC_DO.md`). Không đổi `data`.


`READ_ACTIONS = ['me','hopGoiY','nhatKy','dashboard','dsCa','dsNhanSu','dsDonVi','nhatKyHT','lichSu','thongKeNhanSu','doiSoatHop','chiTietCa','caChuaChot']`

## Danh sách action

| Action | Ai được gọi | Payload gửi lên | Kết quả chính |
|---|---|---|---|
| `me` | mọi người | — | `{user:{ma,ten,chucVu,vaiTro,donVi}, ngay, hm, isAdmin, isSuper, duocVaoCa, vaoCa:[{ca,bd,kt,daVao,soDaVao}], caMo:[ca], cas:[{ca,bd,kt,den,open,locked,canInput,nhom,thanhVien[]}]}` |
| `doiPin` | mọi người | `{pin}` | — |
| `vaoCa` | trừ LANHDAO, ADMIN | `{ca}` | `{moi, soDaVao}` |
| `ghi` | trừ LANHDAO (NHAN/TRA chỉ quản lý); giữ nguyên, `ghiLo` gọi lại hàm này | `{idGui?, buoc, ca, hop, soHoSo, soTrang, soTo, trangLoi, hetHop, ghiChu, maHoSo, kieuNhan:'CANHAN'|'NHOM'}`; nhập hộ thêm `{boSung:true, ngay, nhom, nguoiHo}` | có `warnings[]`. **QĐ1 (F-BC-20):** người đã có nhóm trong ca → `kieuNhan:"CANHAN"` bị từ chối; nhập hộ `nguoiHo` đã có nhóm mà `nhom` trống/khác bị từ chối |
| `ghiLo` | trừ LANHDAO (như `ghi`; chỉ khâu SCAN/TACH/OCR) | `{idLo, ca, muc:[{hop, buoc, soHoSo, soTrang, soTo, trangLoi, hetHop, maHoSo}]}`; nhập hộ thêm `{boSung:true, ngay, nhom, nguoiHo}`; `ghiChu` chung. `idLo` bắt buộc (8–64 ký tự chữ/số/`_`/`-`), tối đa **10 hộp**, **30 dòng** | `{idLo, ketQua:[{hop, buoc, ok, added, warnings[], err}], added, loi, warnings[], guiLai?}`. Mỗi mục đi qua `ghi_` (mọi kiểm tra cũ). Lỗi ở một khâu → các khâu sau của **cùng hộp** bị bỏ qua, hộp khác vẫn ghi. Gửi lại cùng `idLo` (10 phút, theo người gửi) trả kết quả cũ kèm `guiLai: true`, không ghi thêm |
| `hopGoiY` | mọi người (trừ LANHDAO) | `{buoc}` | danh sách mã hộp |
| `nhatKy` | mọi người (trừ LANHDAO) | `{ngay, ca, includeHuy}` | bản ghi `{id, gio, buoc, hop, hs, trang, to, loi, het, ghiChu, mine, ...}` |
| `huy` | TT/TP khi ca còn mở; ADMIN mọi lúc | `{id}` | — |
| `lichSu` | mọi người | `{tu, den}` | `[{ngay, ca, buoc, hop, dv, phanCuaToi, het}]` |
| `dashboard` | TT/TP, LANHDAO, ADMIN (**không** TOVIEN) | `{ngay, gomThu, soNgay?}` (`gomThu` chỉ có tác dụng với ADMIN; `soNgay` = số ngày của `series`, mặc định 10, kẹp tối đa 30 — C1) | xem dưới |
| `doiSoatHop` | TT/TP, LANHDAO, ADMIN (**không** TOVIEN) | `{tu?, den?, trangThai?, tim?, gomThu?}` (`den` không quá hôm nay, trạng thái tính tới hết `den`; `trangThai` ∈ DU, NHAN_CHUA_LAM, DANG_LAM, XONG_CHUA_TRA, THIEU_NHAN, TRA_SOM; tối đa 5000 dòng, `catBot`) | `{tu, den, dem:{tong, <trạng thái>…}, hop:[{ma, khoa, tt, ttText, nhan:{ngay,ca,nguoi}\|null, nhanNhom:{ngay,ca,nhom}\|null, scan/tach/ocr:{to,xong}, tra:{ngay,ca}\|null, ngayMoc, ghiChu}], soDong, catBot, capNhat}` — chỉ đọc |
| `chiTietCa` | TT/TP, LANHDAO, ADMIN (**không** TOVIEN) | `{ngay, ca, loai: tonDau\|nhan\|chuaScan\|chuaTach\|chuaOcr, gomThu?}` | `{ngay, ca, loai, ten, soDong, hop:[như doiSoatHop]}` — `soDong` = số trên ô tương ứng của `dashboard.cas[]` (tonDau, nhanHop, chuaScan, chuaTach, chuaOcr); chỉ đọc |
| `caChuaChot` | TT/TP, ADMIN (**không** TOVIEN, **không** LANHDAO) | `{}` | `{tong, ds:[{ngay, ca, trangThai: 'chua'\|'quaHan'}]}` — các ca CẦN CHỐT mà chưa chốt, từ mốc `CHOT_AP_DUNG_TU` (2026-11-10) tới hôm nay, sắp theo ngày rồi ca. Chỉ đọc (không ghi `ChotCa`, không log). Giao diện gọi MỘT lần khi mở tab Quản lý ca |
| `thongKeNhanSu` | TT/TP, LANHDAO, ADMIN (**không** TOVIEN) | `{tu, den, gomThu}` (`den` không quá hôm nay; tối đa 366 ngày; `gomThu` chỉ có tác dụng với ADMIN) | `{ tu, den, soNgay, dauKyDen, nguoi: [{ ma, ten, soCa, scanDV, tachDV, ocrDV, scanHop, tachHop, ocrHop, scanHs, tachHs, gio, dvGio }], tong: { soNguoi, soCa, gio, dvGio, scanDV, tachDV, ocrDV, scanHop, tachHop, ocrHop, scanHs, tachHs } }` — cùng quy tắc `canhan` của `dash_` (dv = tờ nếu > 0 ngược lại trang; chia công theo `ThanhVien`; `gio` = Σ `CA[ca].gio` các ca đã làm; `dvGio` = tờ/giờ). Không gồm số đầu kỳ `DauKy` (không có chi tiết từng người; `dauKyDen` để giao diện ghi chú). **DK1:** cộng thêm tab `DauKyNguoi` trong khoảng ngày (chia đều theo ô; giờ từ cột `Gio`; mỗi người mỗi (ngày, ca) một lần; ca Ngày 8 giờ = 2 ca); khi khoảng ngày có dữ liệu này trả thêm `coDauKyNguoi:true` và `chuaRo:{scanDV,tachDV,ocrDV}` (dòng "Chưa rõ người", không vào `nguoi`/`tong`); khoảng ngày không có thì kết quả như cũ (không có hai trường này) |
| `dsCa` | TT/TP/ADMIN | `{ngay, ca}` | nhân sự ca, nhóm, `soDaVao`, trạng thái chốt |
| `luuNhom` | TT/TP/ADMIN | `{ngay, ca, gan:[{ma,nhom}], chiDoi}` | — |  *(F-BC-21: sau khi lưu, tự chuyển NHAN_NHOM cá nhân cùng ngày/ca của người vừa được phân sang nhóm; thông báo có thể kèm "đã chuyển N hộp nhận cá nhân sang nhóm"; kiểu trả về không đổi)*
| `suaCa` | TT/TP/ADMIN | `{ngay, ca, ma, them}` | — |
| `chot` | TT/TP/ADMIN | `{ngay, ca, ghiChu, SCAN, TACH, OCR}`; mở khóa: `{ngay, ca, mo:true}` | — |
| `resetPin` | TT/TP (chỉ tổ viên), ADMIN | `{ma}` | `{ten, pin}` (PIN tạm, chỉ hiện 1 lần) |
| `moKhoaTK` | TT/TP (chỉ tổ viên), ADMIN | `{ma}` | chuỗi thông báo |
| `dsNhanSu` | TT/TP/ADMIN (TT/TP: chỉ tổ viên, không email) | — | danh sách nhân sự `{ma,ten,chucVu,donVi,email,vaiTro,hoatDong,khoa,thuTu}` (không có cột PIN; `thuTu` = số hoặc `''`; sắp theo đơn vị → thuTu → tên — B5e) |
| `luuNhanSu` | ADMIN (đầy đủ, tạo mới được; `donVi` phải thuộc danh mục — B1); TT/TP: sửa **tổ viên có sẵn**, chỉ đổi `ten, chucVu, donVi, hoatDong` (đổi vai trò, sửa quản lý/LĐ/ADMIN → từ chối); **thêm tổ viên mới chỉ khi gửi `taoMoi:true`** (F-NS-12b: luôn vai trò Tổ viên, bỏ qua email/thuTu, mã trùng → "Mã HRM này đã có trong hệ thống"; không có `taoMoi` thì tạo mới vẫn bị từ chối) | `{ma, ten, chucVu, donVi, email, vaiTro, hoatDong, thuTu?, taoMoi?}` (`thuTu`: chỉ ADMIN; số nguyên ≥ 0, `''` = xếp cuối, bỏ qua = giữ nguyên; sai → lỗi, không ghi — B5e) | `{moi, ma, pin?}` |
| `suaBanGhi` | ADMIN | `{id, ngay, ca, nhom, hop, soHoSo, soTrang, soTo, trangLoi, hetHop, ghiChu}` | — |
| `khoiPhuc` | ADMIN | `{id}` | — |
| `taoMau` | ADMIN | `{ngay, cas:[ca], soNguoi}` | `{soBanGhi, soCa, ngay, soNguoi, soThem}` |
| `resetDuLieu` | ADMIN | `{phamVi:'THU'}`; `{phamVi:'NGAY', ngay, xacNhan:'XOA', caPhanCa}`; `{phamVi:'TATCA', xacNhan:'XOA'}` | có `saoLuu`; `THU` trả thêm `nguoiGia` (số người giả TN-xx đã xóa) |
| `chuanHoaNhom` | ADMIN | `{ngay, ca, apDung:false}` (xem trước, không ghi); `{ngay, ca, apDung:true, xacNhan:"NHOM"}` (áp dụng) | `{ngay, ca, apDung, tongQuet, boQua, doiNhom:[{id,gio,buoc,hop,hs,trang,to,loi,het,maHoSo,nguoi,nhomCu,nhomMoi,tvCu,tvMoi,ly}], huyTrung:[{...,giuId}], xungDot:[{nhom,buoc,hop,dong:[],ly}], daSua:{doi,huy}, saoLuu}` (`daSua`, `saoLuu` chỉ khi áp dụng) |
| `dsDonVi` | TT/TP/ADMIN | — | `[{ten, hoatDong, thuTu, soNguoi}]` theo thứ tự; tab `DonVi` chưa có → `[]` (B1) |
| `luuDonVi` | ADMIN | `{ten, tenCu?, thuTu?, hoatDong?}` — không có `tenCu` = thêm mới; có `tenCu` = sửa/ẩn/đổi tên (đổi tên chỉ khi đơn vị chưa có người dùng; không xóa) | `{moi, ten}` (B1) |
| `chuanHoaDonVi` | ADMIN | `{apDung:false, anhXa?}` (xem trước, không ghi); `{apDung:true, xacNhan:"DONVI", anhXa?}` (áp dụng). `anhXa` = `{<khóa tên chuẩn hóa>: <tên trong danh mục> \| "+"}` cho tên chưa khớp danh mục (B2) | `{apDung, soNguoiQuet, soDonViChuan, donViTrong, themVaoDanhMuc:[], doi:[{khoa,tenCu,tenMoi,soNguoi,nguon,nguoi:[]}], khongKhop:[{khoa,goiY,soNguoi,cacTen:[{ten,soNguoi}]}], daSua:{nguoi,themDanhMuc}, saoLuu}` (`daSua`, `saoLuu` chỉ khi áp dụng) |
| `importNhanSu` | ADMIN | `{dong:[{ma,ten,chucVu,donVi,vaiTro}], apDung:false}` (xem trước); `{..., apDung:true, xacNhan:"IMPORT"}` (ghi). `ma` phải là chuỗi; tối đa 300 dòng; `vaiTro` TOVIEN/TOTRUONG/TOPHO/LANHDAO (B5c), ADMIN bị từ chối (B3) | `{apDung, dong:[{stt,ma,ten,chucVu,donVi,vaiTro,trangThai:OK\|BO_QUA\|LOI,loi:[],ghiChu}], soOk, soLoi, soBoQua, daGhi?, pin?:[{ma,ten,donVi,vaiTro,pin}]}` — `pin` chỉ có khi ghi, **hiện một lần**, không vào log |
| `xoaNhanSu` | ADMIN | `{ma, xacNhan:<gõ lại đúng mã>}` — chỉ khi tài khoản chưa từng dùng (NhatKy/PhanCa/PhanNhom/ChotCa); `TN-xx` luôn xóa được (kèm PhanCa/PhanNhom); không tự xóa, không xóa ADMIN cuối (B5) | `{ma, ten, daXoa:1, phanCa, phanNhom, saoLuu}` |
| `chuanHoaMaHRM` | ADMIN | `{apDung:false, doDai?:8}` (xem trước); `{apDung:true, xacNhan:"MAHRM"}` (áp dụng) (F-NS-11) | `{apDung, doDai, doi:[{ma,moi,ten,donVi,vaiTro}], xungDot:[{ma,moi,ten,ly}], daDungDoDai, daSua?, saoLuu?}` |
| `nhapDauKyNguoi` | ADMIN | `{dong:[{ngay,ca,buoc,soTo,thanhVien,gio,tenGoc,nguon,ghiChu}], apDung, xacNhan}` — `ngay` 2026-11-02..08, `ca` Ngày/Tối, `buoc` SCAN/TACH/OCR, `thanhVien` = Mã HRM cách nhau dấu phẩy (trống chỉ khi `tenGoc` là "Chưa rõ người"), `gio` cùng thứ tự; tối đa 200 dòng; `apDung:true` cần `xacNhan:"DAUKY"` (DK1) | `{apDung, dong:[{stt,…,trangThai:OK/LOI,loi[]}], soDong, soLoi, doiChieu:[{ngay,ca,buoc,nhap,daCo,lech,khop}], soLech, canChuyenCa}` + khi áp dụng `{daGhi, daChuyenCa, saoLuu:{dauKyNguoi,dauKy}}`. Không `apDung` = chỉ xem trước, không ghi. Áp dụng bị từ chối khi còn dòng lỗi hoặc tổng lệch với `DauKy`; thay toàn bộ tab `DauKyNguoi` (tự tạo, sao lưu bản cũ), chuyển ca dòng `DauKy` Tách 766 tờ 08/11 từ Tối sang Ngày (sao lưu SaoLuuXoa); chạy lại không cộng dồn |
| `nhatKyHT` | ADMIN | `{tu, den, ma, hanhDong}` | dòng log |

## Kết quả `dashboard` (hàm `dash_`)
| Trường | Dùng ở |
|---|---|
| `ngay`, `capNhat` | tiêu đề, dòng "cập nhật lúc" |
| `tienDo`, `luyKe` (`luyKe.dauKyDen`) | widget tiến độ (`widgetHtml`) |
| `cas[]`: `nhanNhom` (`{nhóm: số hộp nhận khác nhau}`, ví dụ `{'1':2}`), `ca, bd, kt, nguoiPhan, tonDau, chuaScan, chuaTach, chuaOcr, scanDV, tachDV, ocrDV, nhanHop, traHop, nguoiBaoCao, nhomDaBC, tongNhom`, trạng thái chốt | khu ĐẦU CA, CUỐI CA |
| `cas[].trangThaiChot`, `soCaChuaChot` (CC1) | `trangThaiChot`: `da` (ngày trước 2026-11-10 hoặc dòng `ChotCa` mới nhất là CHOT) · `chua` (cần chốt, cùng ngày hôm nay, hết giờ ca) · `quaHan` (cần chốt, ngày < hôm nay) · `''` (ca đang làm, tương lai, hoặc không có dữ liệu thật). `soCaChuaChot` = số ca `chua` + `quaHan` của ngày đang xem. Trường `chot` cũ giữ nguyên. Chỉ để hiển thị |
| `caGop` `{scanDV, tachDV, ocrDV}` | thẻ "Ca ngày (gộp)" giai đoạn 02–08/11 |
| `day`: `nhanHop, traHop, tonCuoi, scanDV, tachDV, ocrDV, scanHop, tachHop, ocrHop` | KẾT THÚC NGÀY |
| `khoangNgay { tu, den, soNgay }`: ngày đầu/cuối có dữ liệu (không tính THỬ NGHIỆM khi không `gomThu`, không tính bản đã hủy, gồm DauKy có `Ngay`, `den` ≤ hôm nay; rỗng thì `tu=den=''`, `soNgay=0`) | dòng "Có dữ liệu" `#dNgayCo`, `#dNgay.min` |
| `series[]` (10 ngày): `ngay, nhanHop, traHop, tonCuoi, scanDV, tachDV, ocrDV` | biểu đồ `c2`, `c4` |
| `caNguoi[]` (`nhanHop` = chỉ hộp nhận cá nhân) | khu Từng ca (`tungCaHtml`) |
| `nhom[]`: `ca, nhom, tv[], scanDV, scanHs, tachDV, ocrDV, scanDVGio, tachDVGio, ocrDVGio, ...` | bảng nhóm |
| `canhan[]`: `ten, soCa, scanDV, tachDV, ocrDV` | bảng cá nhân |
| `nguoiNhap[]`, `chiTiet[]` | khu AI NHẬP |

## Quy ước dữ liệu
- `dv` (đơn vị tính) = số tờ nếu > 0, ngược lại số trang. 1 trang ≈ 1 tờ.
- Mã khâu: `NHAN`, `NHAN_NHOM`, `SCAN`, `TACH`, `OCR`, `TRA`. Nhãn hiển thị ở `STEP_LABEL` (Index.html) và `STEP_NAME_` (Code.gs).
- `Loai` bản ghi: `THƯỜNG`, `BỔ SUNG`, `NHẬP HỘ`, `CẢNH BÁO`, `THỬ NGHIỆM`.
- Cột từng tab Sheet: hằng `TAB` đầu `Code.gs` (đừng đổi thứ tự cột khi Sheet thật đã có dữ liệu).
