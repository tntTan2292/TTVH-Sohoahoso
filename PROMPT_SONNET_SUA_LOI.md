# Prompt giao cho Sonnet: sửa lỗi sau review (NO-GO → sẵn sàng kiểm thử)

Làm việc trong thư mục dự án này. Đọc trước: `apps-script/Code.gs`, `apps-script/Index.html`, `tools/build_khoi_tao.py`, `HUONG_DAN_TRIEN_KHAI.md`.

## Bối cảnh

Hệ thống "Báo cáo ca Số hóa hồ sơ" của Bưu điện TP Huế: Google Apps Script Web App gắn với 1 Google Sheet, chạy với tư cách chủ file, truy cập "Bất kỳ ai". Khoảng 30 người, 3 ca/ngày, mục tiêu 175.000 tờ mỗi khâu. Số liệu dùng báo cáo Lãnh đạo, nên đúng số liệu, đúng phân quyền và truy vết được quan trọng hơn giao diện.

Bản review kết luận NO-GO. Nhiệm vụ của bạn là sửa đúng các mục dưới đây, theo thứ tự.

## Quy tắc làm việc

1. Thư mục không có git. Trước khi sửa, chép `apps-script/` và `tools/build_khoi_tao.py` vào `backup_truoc_sua/`.
2. Chỉ sửa `apps-script/Code.gs`, `apps-script/Index.html`, `tools/build_khoi_tao.py`, `HUONG_DAN_TRIEN_KHAI.md`, và tạo các file nêu rõ trong prompt này. Không sửa các script vá khác trong `tools/`, không ghi đè `SoHoa_KhoiTao_v2.xlsx`.
3. Không viết lại toàn bộ, không đổi nghiệp vụ, không thiết kế lại giao diện. Giao diện sẽ do công cụ khác làm, nên giữ nguyên các `id` phần tử đang có.
4. Giữ phong cách mã hiện tại (`function`, `const/let`, hàm nội bộ có `_` cuối).
5. Không triển khai Apps Script, không chạm vào Google Sheet thật hay Drive.
6. Không in PIN hoặc nội dung cột `PinTam`, `PinHash` ra màn hình hay báo cáo.
7. Số dòng trong prompt là theo bản lúc review, có thể lệch sau khi sửa. Hãy tìm theo tên hàm.
8. Không tự quyết các câu ở mục "Không được tự quyết"; để nguyên hành vi và liệt kê trong báo cáo.

## Nhóm 1: Hạ tầng dùng chung (làm trước)

**H1. Lock tập trung trong `api()`.** Tạo danh sách action ghi: `ghi, huy, khoiPhuc, suaBanGhi, resetDuLieu, taoMau, luuNhanSu, luuNhom, suaCa, chot, resetPin, moKhoaTK, doiPin, nhapPhanCa`. Với các action này: sau `auth_` lấy `LockService.getScriptLock().waitLock(20000)`, xóa cache đọc của H2, chạy, rồi nhả lock trong `finally`. Bỏ lock riêng trong `ghi_`. Nếu hết thời gian chờ, trả thông báo tiếng Việt "Hệ thống đang bận, vui lòng thử lại". Toàn bộ `login` cũng chạy trong lock (`waitLock(10000)`).

**H2. Nhớ đọc trong một lần chạy.** Dùng biến toàn cục để `ss_()` chỉ `openById` một lần và `read_(name)` chỉ đọc một lần mỗi tab. Xóa cache của tab đó trong `append_`, `appendMany_`, `setCell_`, `rewrite_`, và sau mỗi `deleteRow`. Mã gọi `read_` không được sửa trực tiếp đối tượng trả về.

**H3. Chặn công thức khi ghi vào Sheet.** Thêm hàm theo cột:
```js
function safe_(col, v) {
  if (TEXT_COLS.indexOf(col) >= 0 || typeof v !== 'string') return v;
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
```
Áp dụng trong `append_`, `appendMany_`, `setCell_`, và khi `rewrite_` ghi lại dữ liệu (vì `getValues` trả về chuỗi đã mất dấu `'`; nếu bỏ sót, công thức sẽ sống lại). Ở `rewrite_`, lấy tên cột từ dòng tiêu đề.

**H4. Kiểm tra dữ liệu người nhập trong `ghi_`.**
- Tách mã hộp bằng `/[\s;]+/`, bỏ dấu phẩy khỏi ký tự phân tách. Sửa tương ứng bộ đếm ở `Index.html` (`fHop.oninput`, phần xác nhận trong `send`).
- Mã hộp phải khớp `/^[0-9A-Za-z][0-9A-Za-z._\/-]{0,39}$/`, viết hoa khi lưu, loại mã trùng trong cùng lần gửi. Có mã sai thì báo danh sách mã sai và không ghi gì.
- `MaHoSo` để trống hoặc bắt đầu bằng chữ/số, tối đa 50 ký tự. `GhiChu` tối đa 500 ký tự.
- Số trang, tờ, trang lỗi phải ≥ 0. Trang lỗi không vượt quá `max(trang, to)`.

**H5. Định dạng và dung lượng cột.** Thêm `ThoiGian` vào `TEXT_COLS`. Trong `setup`: tab `NhatKy` và `LogHeThong` có ít nhất 20.000 dòng (dùng `insertRowsAfter`) trước khi đặt định dạng; luôn ghi lại dòng tiêu đề theo `TAB`. Đầu `setup` thêm `if (!Session.getActiveUser().getEmail()) throw 'Không có quyền';`. `appendMany_` tự thêm dòng nếu vượt `getMaxRows()`.

## Nhóm 2: Các mục Chặn

**C1. `resetPin_`:** nếu người gọi không phải ADMIN và tài khoản đích không phải `TOVIEN` thì từ chối ("Chỉ Quản trị được cấp lại PIN cho tài khoản quản lý"). `moKhoaTK_` giữ nguyên quyền.

**C2.** Đã xử lý ở H3 và H4.

**C3. `LogHeThong` lệch cột:** `build_khoi_tao.py` dùng đúng 7 cột như `TAB` trong `Code.gs`. `setup` đã xử lý ở H5.

**C4. Đọc thời gian:** thêm hàm sau và dùng ở `nhatKyHT_` (lọc và hiển thị), `nhatKy_` (cột giờ), và mọi chỗ cắt chuỗi `ThoiGian`:
```js
function ts_(v) { return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd HH:mm:ss') : s_(v); }
```

**C5. Nhập lịch phân ca.** Thêm action `nhapPhanCa` chỉ ADMIN, và ô dán trong tab Dữ liệu của `Index.html`. Mỗi dòng: `Ngay<TAB>Ca<TAB>MaHRM`. Yêu cầu:
- Ngày dạng `yyyy-MM-dd`, ca chuẩn hóa NFC và có trong `CA`, mã có trong `NhanSu` (họ tên lấy từ `NhanSu`).
- Có dòng sai thì báo số dòng và lý do, không ghi gì.
- Bỏ qua dòng trùng hoàn toàn với `PhanCa` đang có. Ghi bằng `appendMany_`. Trả về số dòng thêm và số dòng bỏ qua.
- Ghi log `NHAP_PHAN_CA` kèm khoảng ngày và số dòng.

**C6. File khởi tạo.** Viết `tools/tao_khoi_tao_v3.py` đọc `SoHoa_KhoiTao_v2.xlsx` và xuất `SoHoa_KhoiTao_v3.xlsx`:
- Dữ liệu `NhanSu`, `PhanCa` bắt đầu từ dòng 2, giữ nguyên PIN tạm và mã HRM dạng văn bản.
- `LogHeThong` đủ 7 cột.
- Thêm 1 dòng ADMIN: `MaHRM = ADMIN01`, họ tên "Quản trị hệ thống", `VaiTro = ADMIN`, PIN tạm 6 số sinh bằng `secrets`, `DoiPin = TRUE`, `HoatDong = TRUE`.
- Cột trong `TEXT_COLS` (kể cả `ThoiGian`) có định dạng `@`.

Sửa `build_khoi_tao.py`: `append` dữ liệu trước rồi mới định dạng ô (lỗi hiện tại đẩy dữ liệu xuống dòng 3000), và thêm dòng ADMIN tương tự. Không có file nguồn TCHC trong thư mục, nên không chạy lại script này.

**C7. Bảng Chi tiết theo `dv`.** Trong `dash_`: thêm `scanDv, tachDv, ocrDv` vào `z()`, thêm `Dv: r.dv` vào `add`. `scanTrangGio/tachTrangGio/ocrTrangGio` tính theo `Dv`; sắp xếp `canhanOut` theo `Dv`. Trong `Index.html`, bảng nhóm và bảng cá nhân hiển thị `scanDv/tachDv/ocrDv` thay cho `Trang + To`.

**C8. Hộp đã xong:** trong nhánh SCAN/TACH/OCR của `ghi_`, thay điều kiện bằng `if (has(buoc, h, true)) throw 'Hộp ' + h + ' đã được báo cáo xong ở bước này';`, áp dụng cả khi không tick "xong".

## Nhóm 3: Các mục Quan trọng

**Q1. Dữ liệu thử nghiệm.** `dash_(ngay, gomThu)` mặc định loại `Loai === 'THỬ NGHIỆM'`. Trong `api`, chỉ truyền `gomThu` khi người gọi là ADMIN. Thêm ô tick "Gồm dữ liệu thử nghiệm" ở Dashboard, chỉ ADMIN thấy. `taoMau_` đặt `NguoiPhan = 'MAU'` cho phân nhóm do nó tạo; `resetDuLieu_` phạm vi `THU` xóa luôn các dòng đó.

**Q2. Khôi phục và hủy.** `khoiPhuc_`: từ chối nếu bản ghi chưa bị hủy. Từ chối nếu đã có bản ghi còn hiệu lực cùng bước và hộp mà `HetHop = true`; với `NHAN/NHAN_NHOM/TRA` từ chối khi đã có bất kỳ bản ghi còn hiệu lực cùng bước và hộp. `huy_`: từ chối nếu bản ghi đã bị hủy.

**Q3. Mở khóa có hạn.** Thêm hằng `MO_TAM = 30` (phút). Tạo `chotInfo_(ngay, ca)` trả về trạng thái và `ThoiGian` của dòng cuối (`chotStatus_` gọi lại hàm này). `caState_`: `unlocked` chỉ đúng khi trạng thái là `MO` và chưa quá 30 phút kể từ thời điểm mở. `chot_`: kiểm tra định dạng ngày, không cho chốt ngày tương lai.

**Q4. Khóa tài khoản.** Trong `login`, kiểm tra khóa tạm trước khi so PIN:
- Mỗi lần sai tăng `SaiPin`. Khi `SaiPin % 5 === 0`: khóa tạm 15 phút bằng `CacheService` (khóa `lk_<ma>`).
- Khi `SaiPin >= 20`: đặt `Khoa = TRUE`, phải có người mở.
- Đăng nhập đúng đặt `SaiPin = 0`. `moKhoaTK_` và `resetPin_` xóa cả khóa tạm.
- Thông báo lỗi nói rõ "tạm khóa 15 phút".

**Q6. Bắt đổi PIN phía máy chủ.** `auth_` trả thêm `doiPin`. Trong `api`, nếu `u.doiPin` và action khác `doiPin` thì từ chối. `doiPin_` từ chối PIN toàn số giống nhau và dãy tăng/giảm liên tiếp (`1234`, `654321`).

**Q8. Đổi nhóm và truy vết.** Trong `luuNhom_`, so phân nhóm cũ và mới:
- Nhóm đã có bản ghi còn hiệu lực trong ca đó mà sẽ không còn thành viên nào: từ chối với mọi vai trò.
- Nhóm đã có bản ghi mà đổi thành viên: chỉ ADMIN được làm.
- Log `PHAN_NHOM` ghi cũ → mới. Ghi các dòng mới bằng `appendMany_`.

`luuNhanSu_` ghi cũ → mới cho mọi trường thay đổi.

**Q9. Giới hạn nhập hộ.** Trong nhánh `boSung` của `ghi_`: `ngay` không được lớn hơn hôm nay. Với `NHAN_NHOM/SCAN/TACH/OCR`: bắt buộc có `nguoiHo`, nhóm phải tồn tại trong `PhanNhom` của ngày/ca đó, và `nguoiHo` phải thuộc nhóm đó.

**Q11. Sao lưu trước khi xóa.** Trong `resetDuLieu_`, trước khi xóa chép các tab bị ảnh hưởng thành `BK_<tab>_<yyyyMMdd_HHmmss>` (`copyTo`), ghi tên bản sao vào log. Phạm vi `NGAY` cũng yêu cầu `xacNhan === 'XOA'` ở máy chủ; `Index.html` đổi sang `prompt` như nút xóa toàn bộ.

**Q12. `build_khoi_tao.py`.**
- Chuyển bảng ánh xạ cột sang cấu hình rõ ràng ở đầu file, có chú thích.
- Thoát với mã lỗi nếu có tên không khớp hoặc họ tên trùng nhau trong danh sách nhân sự (hiện chỉ in ra hoặc ghi đè).
- Thêm tùy chọn `--chi-phan-ca <file.tsv>`: chỉ xuất `Ngay<TAB>Ca<TAB>MaHRM` để dán vào chức năng ở C5, không tạo workbook và không sinh PIN.

**Q13. Hiệu năng.**
- Cache kết quả `dash_` 45 giây bằng `CacheService`, khóa gồm ngày, `gomThu` và số phiên bản `dash_v`. Sau mỗi action ghi thành công, tăng `dash_v`. Bọc `put` trong `try/catch` (giới hạn 100 KB).
- `ghi_` nhánh nhận/trả dùng `appendMany_` một lần thay vì `appendRow` theo vòng lặp.

**Q14. Nhận và trả hộp.** Khi `TRA` mà hộp chưa có Scan `HetHop`, thêm cảnh báo vào `warnings` (vẫn ghi).

**Q15. Nhãn.**
- Widget: khi ngày xem khác ngày hiện tại, thay chữ "Hôm nay" bằng ngày đang xem.
- `dash_` trả thêm `nhomDaBC` và `tongNhom` cho từng ca; Dashboard đổi "Người đã báo cáo" thành "Nhóm đã báo cáo x / y".

**Q16. Cập nhật `HUONG_DAN_TRIEN_KHAI.md`.**
- Dùng `SoHoa_KhoiTao_v3.xlsx`. Sau khi tải lên phải **Tệp → Lưu dưới dạng Google Trang tính**; làm việc trên bản đã chuyển, rồi xóa file xlsx trên Drive và máy.
- Bỏ yêu cầu nhập `DauKy` (đã có sẵn; chỉ kiểm tra lại). Bỏ phần điền Gmail.
- Bổ sung: khâu OCR; tài khoản ADMIN; nhập hộ; nhập phân ca hằng tháng theo C5; sao lưu và khôi phục; cách triển khai phiên bản mới mà giữ nguyên link `/exec`.
- Thêm mục "Trước ngày chạy thật": chốt ngày cắt số liệu `DauKy`, và nhập `NHAN` cho các hộp đang dở.
- Cập nhật cơ chế khóa theo Q3 và Q4.

## Nhóm 4: Việc nhỏ

- Xóa đoạn kiểm tra Gmail trong `login` và hàm `loadBs`.
- `ghi_`: từ chối ngay vai trò `LANHDAO`.
- `suaCa_`: kiểm tra ngày/ca, không thêm trùng.
- `suaBanGhi_`: giữ nguyên `Loai` cũ (`NHẬP HỘ`, `BỔ SUNG`, `CẢNH BÁO`, `THỬ NGHIỆM`), thêm dấu sửa vào `GhiChu` dạng `[Đã sửa]`.
- ID bản ghi dùng đủ UUID. PIN tạm sinh từ `Utilities.getUuid()` thay cho `Math.random`.
- `log_` nhận tham số `ngayCa` tùy chọn; `ghi_`, `huy_`, `khoiPhuc_`, `suaBanGhi_`, `chot_` truyền ngày/ca của bản ghi.
- `Index.html`: thêm `.catch` cho `renderBao`, `loadNK`, `hopGoiY`, và `withFailureHandler` cho `dsLogin`. Khi lỗi là "Phiên đăng nhập đã hết hạn" thì báo và tải lại trang.
- `Index.html`: nút Hủy chỉ hiện khi `r.mine` hoặc người xem là quản lý. Khóa nút trong lúc gửi ở `dlMau`, `qlAdd`, `pinBtn`.
- `Index.html`: `mk` kiểm tra `window.Chart`; nếu CDN lỗi thì Dashboard vẫn hiện số liệu, chỉ thiếu biểu đồ. Thêm `color-scheme: light dark` vào `:root`.

## Không được tự quyết (giữ nguyên hành vi, nêu trong báo cáo)

- Hộp đã trả có còn được Tách file không (`chuaTach` và `hopGoiY` hiện loại hộp đã trả, OCR thì không).
- Tổ viên có được xem năng suất cá nhân của mọi người trên Dashboard không.
- 571 trang trong số `DauKy` ngày 05/11 ca tối, và ngày cắt số liệu.
- Nội dung lịch phân ca sau 09/11.

## Kiểm tra sau khi sửa

Chạy `node --check` trên `Code.gs` (chép sang file `.js` tạm) và trên khối `<script>` của `Index.html`. Dựng mock Apps Script bằng Node trong thư mục tạm, không để lại trong `apps-script/` (có thể tham khảo `h.js`, `t.js` tại `C:\Users\Admin\AppData\Local\Temp\claude\3947c88c932e97e7\556dbb45-f8bb-46fb-bf50-530663a68b06\scratchpad\` nếu còn). Tất cả phải đạt:

1. Tổ trưởng gọi `resetPin` cho ADMIN: bị từ chối; cho tổ viên: thành công.
2. `DoiPin = TRUE` gọi `ghi`: bị từ chối.
3. Ghi chú `=1+1` được lưu với dấu `'` ở đầu; qua `rewrite_` vẫn còn dấu đó.
4. Tab log có `ThoiGian` kiểu Date: `nhatKyHT_` lọc đúng ngày, `nhatKy_` trả giờ dạng `HH:mm`.
5. 200 trang + 100 tờ: KPI và bảng nhóm cùng là 100. Chỉ nhập 300 tờ: năng suất khác 0.
6. Báo hộp xong rồi gửi tiếp không tick xong: bị từ chối, tổng không đổi.
7. Hủy, nhập lại, khôi phục bản cũ: bị từ chối, tổng là số mới.
8. Chốt rồi Mở: 31 phút sau ngoài giờ ca, tổ viên không ghi và không hủy được.
9. `taoMau`: tiến độ mặc định không đổi, có `gomThu` với ADMIN thì đổi. Xóa THỬ NGHIỆM: không còn phân nhóm mẫu.
10. Nhập hộ ngày tương lai hoặc nhóm không tồn tại: bị từ chối.
11. Đổi nhóm đã có báo cáo bằng tài khoản Tổ trưởng: bị từ chối.
12. Sai PIN 5 lần: khóa tạm; đủ 20 lần: `Khoa = TRUE`.
13. Mã `208,18,17` ở bước Nhận: bị từ chối, không ghi dòng nào. Mã trùng trong một lần gửi: chỉ 1 dòng.
14. `nhapPhanCa` có 1 dòng sai: không ghi gì; dán lại dữ liệu đúng 2 lần: không sinh dòng trùng.
15. `SoHoa_KhoiTao_v3.xlsx`: dữ liệu từ dòng 2, có 1 ADMIN, `LogHeThong` đủ 7 cột, số PIN tạm cũ không đổi, số dòng `PhanCa` vẫn 140.

## Báo cáo khi xong

1. Bảng từng mục (H1–H5, C1–C8, Q1–Q16 có sửa, nhóm nhỏ): đã sửa / chưa sửa / lý do.
2. Kết quả 15 bước kiểm tra, chép đúng kết quả thật; bước nào không đạt hoặc không chạy được thì nói rõ.
3. Danh sách thay đổi trong `Index.html` theo hàm, để chuyển sang bản giao diện mới.
4. Những điểm chưa xác minh được vì cần Apps Script thật, tối thiểu: `appendRow` với cột `@`, dấu `'` khi đọc lại, `Session.getActiveUser()` khi chạy từ trình soạn thảo, thời gian `getValues`.
5. Các câu ở mục "Không được tự quyết".

Không ghi "hoàn tất" nếu còn bước kiểm tra chưa đạt.
