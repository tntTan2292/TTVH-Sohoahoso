# Phiếu Sonnet: CC1 (mục 30) + XN1 (mục 28)

Opus chốt 10/11/2026 theo đề nghị của chủ dự án. Làm liền hai việc, **mỗi việc một commit, CC1 trước, XN1 sau**. Không triển khai, không ghi Sheet thật. Xong thì Sonnet viết prompt Antigravity theo `CHUAN_PROMPT.md` mục 3a; Opus review một lần cuối đợt. C3 (mục 25) vẫn hoãn, làm sau đợt này.

## CC1 (mục 30): Chốt ca = "đã kiểm tra", hiện rõ ca chưa chốt (L2)

**Không đổi:** cách tính mọi số; `chot_`; khóa nhập (`caState_`); `chot` trả về trong `cas`; `DauKy`, `DauKyNguoi`. Chốt ca vẫn khóa nhập như cũ.

**Quy tắc đã chốt**
- Hằng số `CHOT_AP_DUNG_TU` trong `Code.gs`, tạm đặt `'2026-11-12'`; Opus đổi thành ngày triển khai thật khi cho GO. Ca trước mốc này (gồm toàn bộ 02–08/11) **không bao giờ** có nhãn chưa chốt.
- Ca **cần chốt** = ngày ≥ mốc, đã hết giờ ca (`ngay < hôm nay`, hoặc cùng ngày và đã qua giờ kết thúc), và có ít nhất một dòng `PhanCa` không phải `TN-` hoặc một dòng `NhatKy` còn hiệu lực không phải THỬ NGHIỆM.
- Trạng thái, dùng **một hàm chung** cho mọi nơi:
  - `da`: dòng `ChotCa` mới nhất là `CHOT`.
  - `chua`: cần chốt, chưa `CHOT`, cùng ngày hôm nay. Đã mở khóa (`MO`) mà chưa chốt lại cũng là chưa chốt.
  - `quaHan`: cần chốt, chưa `CHOT`, `ngay < hôm nay` (sang ngày mới là quá hạn).
  - `''`: các trường hợp khác, gồm ca đang làm và ca trước mốc.

**Máy chủ (chỉ thêm, không đổi trường cũ)**
- `dash_`: thêm `trangThaiChot` vào từng phần tử `cas` và `soCaChuaChot` (đếm `chua` + `quaHan` của ngày đang xem).
- Action đọc mới `caChuaChot` (TT/TP/ADMIN): `{tong, ds:[{ngay, ca, trangThai}]}`, quét từ mốc đến hôm nay. **Không nhét vào `dsCa`**, vì `NhatKy` không có đệm và `dsCa` gọi rất thường xuyên; giao diện chỉ gọi một lần khi mở tab Quản lý ca.

**Giao diện (khung thô, Antigravity làm đẹp sau)**
- Thẻ/dòng của đúng ca `chua` hoặc `quaHan`: số Scan/Tách/OCR **của ca đó** hiện màu chữ phụ, luôn kèm nhãn chữ "Chưa chốt ca" hoặc "Quá hạn chốt" (đỏ). Cột tổng, KPI và biểu đồ không mờ. Không dùng `opacity`, vì in và màn hình điện thoại sẽ khó đọc.
- Tổng ngày ghi "gồm N ca chưa chốt" khi N > 0.
- Quản lý ca: huy hiệu "Có N ca chưa chốt", bấm thấy danh sách ngày + ca.
- Sửa hai chỗ đang sai với ý nghĩa mới: dòng `tt = c.chot ? ['Đã chốt', 'bad']` phải là `ok` (xanh); `ttChip` đang hiện đỏ "Hết ca – chưa chốt" cho mọi ca đã qua, kể cả 02–08/11, phải theo `trangThaiChot` (không có trạng thái thì chỉ hiện "Hết ca").
- Đổi lời nút chốt thành ý "Xác nhận đã kiểm tra số liệu ca này. Sau khi chốt tổ viên không nhập được nữa."

**Không làm:** nhắc qua email/Zalo; cột chốt trong CSV (CSV hiện có là Đối soát theo **hộp**, một hộp đi qua nhiều ca nên cột này không có nghĩa).

**Mock bắt buộc:** so `dash_` với `Code.gs` ở `848b751` trên mọi ngày, có/không `gomThu`: giống hệt sau khi bỏ hai trường mới. Kiểm đủ: CHOT, MO sau CHOT, CHOT sau MO, ca rỗng, ca chỉ có THỬ NGHIỆM, ca trước mốc, ca đang làm, sang ngày, quyền `caChuaChot` (tổ viên và Lãnh đạo bị từ chối).

## XN1 (mục 28): Hộp xác nhận tự vẽ thay `confirm`/`prompt` (L2)

Chỉ sửa `Index.html`. **Sonnet làm cả phần JS**, không chuyển Antigravity, vì đây là đổi luồng đồng bộ sang Promise.

**Hàm:** `hoiXacNhan(tieuDe, noiDung, tuKhoa)` trả Promise, chỉ resolve, không reject: không có `tuKhoa` thì `true`; có `tuKhoa` thì chuỗi đã gõ; hủy thì `null`.
- Một khối `#modalXN` cố định trong HTML, dùng lại `.modal-overlay`, nằm trên `#modalCT`.
- `noiDung` gán bằng `textContent` (có tên người).
- Có từ khóa: nút Đồng ý tắt cho tới khi ô nhập khớp đúng từ khóa (so khớp sau khi bỏ khoảng trắng hai đầu). Vẫn gửi chuỗi đó lên máy chủ như cũ, **máy chủ vẫn kiểm `xacNhan`**.
- Hủy, Esc → `null`. Bấm ra nền không đóng. Enter chỉ có tác dụng khi nút Đồng ý đang bật. Bấm đúp chỉ resolve một lần. Đang mở mà gọi thêm → resolve `null` ngay.

**Thay đủ 18 chỗ** (10 `confirm`, 8 `prompt`). Không thay `alert`. Bẫy cần soi:
- Mọi đoạn sau `confirm`/`prompt` phải chuyển vào `.then`, giữ nguyên `return`, `.catch`, việc khóa nút, và thời điểm tạo `idGui`.
- Luồng XOA theo ngày hỏi **hai hộp liên tiếp**: hộp đầu phải đóng hẳn rồi mới mở hộp sau.
- Hai dòng `if (apDung) { var t = prompt(...) }` (MAHRM, DAUKY): nhánh xem trước phải chạy như cũ, không hỏi.
- Hai lần hỏi khi gửi báo cáo (Scan kèm Tách, ghi hộp): không được gửi trùng.
- Xóa tài khoản: từ khóa là chính Mã HRM.

**Kiểm tra thêm vào `tools/kiem_tra_giao_dien.js`** (hiện chưa kiểm hộp thoại):
- Không còn `confirm(`/`prompt(` gốc trong `Index.html`.
- Còn đủ từ khóa MAHRM, DAUKY, NHOM, DONVI, IMPORT, XOA.
- Trên DOM giả: nút tắt khi sai từ khóa; Hủy không gọi `call`; đúng từ khóa thì `call` nhận đúng `xacNhan`; bấm đúp một lần; hai hộp liên tiếp chạy được.
- Mock máy chủ không giảm số kiểm tra.

**Tài liệu:** mỗi việc thêm dòng `CHUC_NANG.md` trong cùng commit; CC1 thêm vào `API.md`; cập nhật `TIEN_DO_PO.md`, `SNAPSHOT.md`, `CHANGELOG.md`.
