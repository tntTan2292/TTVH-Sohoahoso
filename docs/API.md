# Hợp đồng giữa giao diện và máy chủ (API)

> `Index.html` chỉ nói chuyện với `Code.gs` qua các hàm dưới đây. **Đổi tên action, đổi tên trường gửi đi hoặc trường trả về = phải sửa cả hai file trong cùng một commit** và cập nhật file này.

## Cách gọi
- Công khai (chưa đăng nhập): `google.script.run.dsLogin()`, `google.script.run.login(ma, pin)` → `{ token, doiPin, ... }` hoặc lỗi.
- Sau đăng nhập: mọi thứ đi qua `api(token, action, payload)` → luôn trả `{ ok: true, data }` hoặc `{ ok: false, err: 'thông báo tiếng Việt' }`.
- Ở giao diện dùng hàm `call(action, payload)` (trả Promise; lỗi là chuỗi `err`).

## Lớp chặn chung trong `api()`
1. `auth_(token)` — token hết hạn → lỗi "Phiên đăng nhập đã hết hạn".
2. Chưa đổi PIN lần đầu → chỉ được `me`, `doiPin`.
3. `LANHDAO` → chỉ được `me`, `dashboard`, `thongKeNhanSu`, `doiPin`, `lichSu`.
4. Action không thuộc `READ_ACTIONS` chạy trong khóa (`withLock_`).

`READ_ACTIONS = ['me','hopGoiY','nhatKy','dashboard','dsCa','dsNhanSu','dsDonVi','nhatKyHT','lichSu','thongKeNhanSu']`

## Danh sách action

| Action | Ai được gọi | Payload gửi lên | Kết quả chính |
|---|---|---|---|
| `me` | mọi người | — | `{user:{ma,ten,chucVu,vaiTro,donVi}, ngay, hm, isAdmin, isSuper, duocVaoCa, vaoCa:[{ca,bd,kt,daVao,soDaVao}], caMo:[ca], cas:[{ca,bd,kt,den,open,locked,canInput,nhom,thanhVien[]}]}` |
| `doiPin` | mọi người | `{pin}` | — |
| `vaoCa` | trừ LANHDAO, ADMIN | `{ca}` | `{moi, soDaVao}` |
| `ghi` | trừ LANHDAO (NHAN/TRA chỉ quản lý); giữ nguyên, `ghiLo` gọi lại hàm này | `{buoc, ca, hop, soHoSo, soTrang, soTo, trangLoi, hetHop, ghiChu, maHoSo, kieuNhan:'CANHAN'|'NHOM'}`; nhập hộ thêm `{boSung:true, ngay, nhom, nguoiHo}` | có `warnings[]`. **QĐ1 (F-BC-20):** người đã có nhóm trong ca → `kieuNhan:"CANHAN"` bị từ chối; nhập hộ `nguoiHo` đã có nhóm mà `nhom` trống/khác bị từ chối |
| `ghiLo` | trừ LANHDAO (như `ghi`; chỉ khâu SCAN/TACH/OCR) | `{idLo, ca, muc:[{hop, buoc, soHoSo, soTrang, soTo, trangLoi, hetHop, maHoSo}]}`; nhập hộ thêm `{boSung:true, ngay, nhom, nguoiHo}`; `ghiChu` chung. `idLo` bắt buộc (8–64 ký tự chữ/số/`_`/`-`), tối đa **10 hộp**, **30 dòng** | `{idLo, ketQua:[{hop, buoc, ok, added, warnings[], err}], added, loi, warnings[], guiLai?}`. Mỗi mục đi qua `ghi_` (mọi kiểm tra cũ). Lỗi ở một khâu → các khâu sau của **cùng hộp** bị bỏ qua, hộp khác vẫn ghi. Gửi lại cùng `idLo` (10 phút, theo người gửi) trả kết quả cũ kèm `guiLai: true`, không ghi thêm |
| `hopGoiY` | mọi người (trừ LANHDAO) | `{buoc}` | danh sách mã hộp |
| `nhatKy` | mọi người (trừ LANHDAO) | `{ngay, ca, includeHuy}` | bản ghi `{id, gio, buoc, hop, hs, trang, to, loi, het, ghiChu, mine, ...}` |
| `huy` | TT/TP khi ca còn mở; ADMIN mọi lúc | `{id}` | — |
| `lichSu` | mọi người | `{tu, den}` | `[{ngay, ca, buoc, hop, dv, phanCuaToi, het}]` |
| `dashboard` | TT/TP, LANHDAO, ADMIN (**không** TOVIEN) | `{ngay, gomThu}` (`gomThu` chỉ có tác dụng với ADMIN) | xem dưới |
| `thongKeNhanSu` | TT/TP, LANHDAO, ADMIN (**không** TOVIEN) | `{tu, den, gomThu}` (`den` không quá hôm nay; tối đa 366 ngày; `gomThu` chỉ có tác dụng với ADMIN) | `{ tu, den, soNgay, dauKyDen, nguoi: [{ ma, ten, soCa, scanDV, tachDV, ocrDV, scanHop, tachHop, ocrHop, scanHs, tachHs, gio, dvGio }], tong: { soNguoi, soCa, gio, dvGio, scanDV, tachDV, ocrDV, scanHop, tachHop, ocrHop, scanHs, tachHs } }` — cùng quy tắc `canhan` của `dash_` (dv = tờ nếu > 0 ngược lại trang; chia công theo `ThanhVien`; `gio` = Σ `CA[ca].gio` các ca đã làm; `dvGio` = tờ/giờ). Không gồm số đầu kỳ `DauKy` (không có chi tiết từng người; `dauKyDen` để giao diện ghi chú) |
| `dsCa` | TT/TP/ADMIN | `{ngay, ca}` | nhân sự ca, nhóm, `soDaVao`, trạng thái chốt |
| `luuNhom` | TT/TP/ADMIN | `{ngay, ca, gan:[{ma,nhom}], chiDoi}` | — |
| `suaCa` | TT/TP/ADMIN | `{ngay, ca, ma, them}` | — |
| `chot` | TT/TP/ADMIN | `{ngay, ca, ghiChu, SCAN, TACH, OCR}`; mở khóa: `{ngay, ca, mo:true}` | — |
| `resetPin` | TT/TP (chỉ tổ viên), ADMIN | `{ma}` | `{ten, pin}` (PIN tạm, chỉ hiện 1 lần) |
| `moKhoaTK` | TT/TP (chỉ tổ viên), ADMIN | `{ma}` | chuỗi thông báo |
| `dsNhanSu` | TT/TP/ADMIN (TT/TP: chỉ tổ viên, không email) | — | danh sách nhân sự `{ma,ten,chucVu,donVi,email,vaiTro,hoatDong,khoa}` (không có cột PIN) |
| `luuNhanSu` | ADMIN (đầy đủ, tạo mới được; `donVi` phải thuộc danh mục — B1); TT/TP: chỉ sửa **tổ viên có sẵn**, chỉ đổi `ten, chucVu, donVi, hoatDong` (đổi vai trò, tạo mới, sửa quản lý/LĐ/ADMIN → từ chối) | `{ma, ten, chucVu, donVi, email, vaiTro, hoatDong}` | `{moi, ma, pin?}` |
| `suaBanGhi` | ADMIN | `{id, ngay, ca, nhom, hop, soHoSo, soTrang, soTo, trangLoi, hetHop, ghiChu}` | — |
| `khoiPhuc` | ADMIN | `{id}` | — |
| `taoMau` | ADMIN | `{ngay, cas:[ca], soNguoi}` | `{soBanGhi, soCa, ngay, soNguoi, soThem}` |
| `resetDuLieu` | ADMIN | `{phamVi:'THU'}`; `{phamVi:'NGAY', ngay, xacNhan:'XOA', caPhanCa}`; `{phamVi:'TATCA', xacNhan:'XOA'}` | có `saoLuu` |
| `chuanHoaNhom` | ADMIN | `{ngay, ca, apDung:false}` (xem trước, không ghi); `{ngay, ca, apDung:true, xacNhan:"NHOM"}` (áp dụng) | `{ngay, ca, apDung, tongQuet, boQua, doiNhom:[{id,gio,buoc,hop,hs,trang,to,loi,het,maHoSo,nguoi,nhomCu,nhomMoi,tvCu,tvMoi,ly}], huyTrung:[{...,giuId}], xungDot:[{nhom,buoc,hop,dong:[],ly}], daSua:{doi,huy}, saoLuu}` (`daSua`, `saoLuu` chỉ khi áp dụng) |
| `dsDonVi` | TT/TP/ADMIN | — | `[{ten, hoatDong, thuTu, soNguoi}]` theo thứ tự; tab `DonVi` chưa có → `[]` (B1) |
| `luuDonVi` | ADMIN | `{ten, tenCu?, thuTu?, hoatDong?}` — không có `tenCu` = thêm mới; có `tenCu` = sửa/ẩn/đổi tên (đổi tên chỉ khi đơn vị chưa có người dùng; không xóa) | `{moi, ten}` (B1) |
| `nhatKyHT` | ADMIN | `{tu, den, ma, hanhDong}` | dòng log |

## Kết quả `dashboard` (hàm `dash_`)
| Trường | Dùng ở |
|---|---|
| `ngay`, `capNhat` | tiêu đề, dòng "cập nhật lúc" |
| `tienDo`, `luyKe` (`luyKe.dauKyDen`) | widget tiến độ (`widgetHtml`) |
| `cas[]`: `nhanNhom` (`{nhóm: số hộp nhận khác nhau}`, ví dụ `{'1':2}`), `ca, bd, kt, nguoiPhan, tonDau, chuaScan, chuaTach, chuaOcr, scanDV, tachDV, ocrDV, nhanHop, traHop, nguoiBaoCao, nhomDaBC, tongNhom`, trạng thái chốt | khu ĐẦU CA, CUỐI CA |
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
