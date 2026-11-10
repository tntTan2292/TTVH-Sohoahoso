# Phiếu Sonnet: CC1 (mục 30) + XN1 (mục 28) + LOC1 (mục 31)

Opus chốt 10/11/2026 theo đề nghị của chủ dự án. Làm liền ba việc, **mỗi việc một commit, thứ tự CC1 → XN1 → LOC1**. Không ghi Sheet thật. Triển khai theo mục "Review và triển khai" cuối phiếu (chủ dự án yêu cầu riêng đợt này). Antigravity làm đẹp sau khi đã triển khai, Sonnet chỉ viết sẵn prompt theo `CHUAN_PROMPT.md` mục 3a. C3 (mục 25) vẫn hoãn, làm sau đợt này.

## CC1 (mục 30): Chốt ca = "đã kiểm tra", hiện rõ ca chưa chốt (L2)

**Không đổi:** cách tính mọi số; `chot_`; khóa nhập (`caState_`); `chot` trả về trong `cas`; `DauKy`, `DauKyNguoi`. Chốt ca vẫn khóa nhập như cũ.

**Quy tắc đã chốt**
- Hằng số `CHOT_AP_DUNG_TU = '2026-11-10'` trong `Code.gs` (chủ dự án chốt: tính từ ngày triển khai chính thức). **Mọi ca trước mốc này được coi là đã chốt**, kể cả ca không có dữ liệu. Chỉ là cách hiển thị: **không ghi dòng nào vào `ChotCa`**, `c.chot` và việc khóa nhập của các ca đó giữ nguyên.
- Ca **cần chốt** = ngày ≥ mốc, đã hết giờ ca (`ngay < hôm nay`, hoặc cùng ngày và đã qua giờ kết thúc), và có ít nhất một dòng `PhanCa` không phải `TN-` hoặc một dòng `NhatKy` còn hiệu lực không phải THỬ NGHIỆM.
- Trạng thái, dùng **một hàm chung** cho mọi nơi:
  - `da`: ngày trước mốc, hoặc dòng `ChotCa` mới nhất là `CHOT`.
  - `chua`: cần chốt, chưa `CHOT`, cùng ngày hôm nay. Đã mở khóa (`MO`) mà chưa chốt lại cũng là chưa chốt.
  - `quaHan`: cần chốt, chưa `CHOT`, `ngay < hôm nay` (sang ngày mới là quá hạn).
  - `''`: các trường hợp khác, gồm ca đang làm và ca từ mốc trở đi không có dữ liệu.

**Máy chủ (chỉ thêm, không đổi trường cũ)**
- `dash_`: thêm `trangThaiChot` vào từng phần tử `cas` và `soCaChuaChot` (đếm `chua` + `quaHan` của ngày đang xem).
- Action đọc mới `caChuaChot` (TT/TP/ADMIN): `{tong, ds:[{ngay, ca, trangThai}]}`, quét từ mốc đến hôm nay. **Không nhét vào `dsCa`**, vì `NhatKy` không có đệm và `dsCa` gọi rất thường xuyên; giao diện chỉ gọi một lần khi mở tab Quản lý ca.

**Giao diện (khung thô, Antigravity làm đẹp sau)**
- Thẻ/dòng của đúng ca `chua` hoặc `quaHan`: số Scan/Tách/OCR **của ca đó** hiện màu chữ phụ, luôn kèm nhãn chữ "Chưa chốt ca" hoặc "Quá hạn chốt" (đỏ). Cột tổng, KPI và biểu đồ không mờ. Không dùng `opacity`, vì in và màn hình điện thoại sẽ khó đọc.
- Tổng ngày ghi "gồm N ca chưa chốt" khi N > 0.
- Quản lý ca: huy hiệu "Có N ca chưa chốt", bấm thấy danh sách ngày + ca.
- Sửa hai chỗ đang sai với ý nghĩa mới: dòng `tt = c.chot ? ['Đã chốt', 'bad']` phải là `ok` (xanh); `ttChip` đang hiện đỏ "Hết ca – chưa chốt" cho mọi ca đã qua, kể cả 02–08/11. Cả hai chỗ này phải lấy theo `trangThaiChot`, không theo `c.chot` (`da` hiện "Đã chốt"; không có trạng thái thì chỉ hiện "Hết ca").
- Đổi lời nút chốt thành ý "Xác nhận đã kiểm tra số liệu ca này. Sau khi chốt tổ viên không nhập được nữa."

**Không làm:** nhắc qua email/Zalo; cột chốt trong CSV (CSV hiện có là Đối soát theo **hộp**, một hộp đi qua nhiều ca nên cột này không có nghĩa).

**Mock bắt buộc:** so `dash_` với `Code.gs` ở `848b751` trên mọi ngày, có/không `gomThu`: giống hệt sau khi bỏ hai trường mới. Kiểm đủ: CHOT, MO sau CHOT, CHOT sau MO, ca rỗng, ca chỉ có THỬ NGHIỆM, ca trước mốc (ra `da`, không tính vào số chưa chốt, `ChotCa` không thêm dòng), ca ngày 10/11 chưa chốt (ra `quaHan` từ 11/11), ca đang làm, sang ngày, quyền `caChuaChot` (tổ viên và Lãnh đạo bị từ chối).

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

## LOC1 (mục 31): Tab Nhân sự lọc rõ từ ngày đến ngày, theo ngày đang xem (L1)

Chỉ sửa `Index.html` (`nsKhoangTinh`, `dashTabNhanSu`, chỗ đổi ngày ở `loadDash`). Máy chủ đã nhận `tu`, `den`, không đổi.

**Hiện trạng:** ô từ–đến đã có nhưng ẩn sau lựa chọn cuối "Tùy chọn"; các lựa chọn khác luôn tính đến hôm nay nên lùi "Ngày xem báo cáo" về 08/11 mà tab vẫn ra số đến hiện tại.

**Làm:**
- Hai ô Từ ngày, Đến ngày **luôn hiện** (giữ `#nsKhoang`, `#nsTuyChon`, `#nsTu`, `#nsDen`). Giữ nguyên các `value` của lựa chọn.
- Các lựa chọn nhanh điền sẵn hai ô và **tính đến ngày đang xem** (`#dNgay`, trống thì hôm nay): "Hôm nay" đổi chữ thành "Ngày đang xem" (từ = đến = ngày xem); "7 ngày gần nhất" = 7 ngày kết thúc ở ngày xem; "Tháng này" = đầu tháng của ngày xem đến ngày xem; "Từ đầu dự án" = ngày đầu có dữ liệu đến ngày xem. Ngày xem là hôm nay thì kết quả giống bản hiện tại.
- Đổi ngày xem: lựa chọn nhanh tự tính lại và tải lại số. Đang ở "Tùy chọn" thì giữ nguyên hai ô.
- Người dùng sửa tay một trong hai ô: tự chuyển sang "Tùy chọn" và tải số. Từ sau Đến: báo lỗi tại chỗ, không xóa bảng đang có.

**Kiểm tra** thêm vào `tools/kiem_tra_giao_dien.js` trên DOM giả: bốn lựa chọn với ngày xem 08/11; đổi ngày xem; sửa tay chuyển Tùy chọn; đang Tùy chọn đổi ngày xem không mất khoảng đã chọn. Không để kết quả cũ về muộn đè kết quả mới.

## Tài liệu (cả ba việc)
Mỗi việc thêm hoặc sửa dòng `CHUC_NANG.md` trong cùng commit (LOC1 sửa F-DB-15); CC1 thêm vào `API.md`; cập nhật `TIEN_DO_PO.md`, `SNAPSHOT.md`, `CHANGELOG.md`.

## Review và triển khai (chủ dự án yêu cầu riêng đợt này, 10/11/2026)
Chủ dự án bận, nhờ làm trọn đợt. Quy tắc "chỉ triển khai sau khi Opus review đạt" **không bỏ**. Làm đúng thứ tự:

1. Xong cả ba commit, mock và giao diện 0 lỗi, đã push.
2. **Opus review độc lập:** gọi subagent với model `opus`, không kèm suy luận của Sonnet, chỉ giao mẫu `CHUAN_PROMPT.md` 10.5 cho `848b751..HEAD`. Trọng tâm: `dash_` không đổi số; luồng xác nhận ghi dữ liệu thật không mất từ khóa, không gửi trùng; không có đường ghi `ChotCa` mới; lọc ngày tab Nhân sự. Opus tự ghi kết quả vào SNAPSHOT.
   - Không gọi được subagent model `opus` → **dừng, không triển khai**, báo chủ dự án.
   - CẦN SỬA → Sonnet sửa đúng danh sách, rồi review lại. Tối đa 2 vòng; vẫn chưa ĐẠT → **dừng, không triển khai**.
3. Có ĐẠT/GO của Opus trong SNAPSHOT → triển khai bằng skill `update-code-sohoa`. Bản đang chạy phải khớp `848b751` (phiên bản 28); không khớp → dừng, không ghi đè.

**Giữ link và dữ liệu (bắt buộc):**
- Chỉ sửa bản triển khai `…MlRA` bằng Phiên bản mới. Cấm "Triển khai mới", cấm Lưu trữ, không đụng `…NIQ`. Link phải giữ nguyên.
- Cấm chạy `setup`, `taoMau`, `resetDuLieu` hay hàm nào khác trong trình soạn. Không mở, không ghi Google Sheet. Không đăng nhập vào ứng dụng, không nhập PIN hay mật khẩu. Đợt này không đổi cột, không thêm tab.
- Không ghi đè `appsscript.json`, không đổi quyền.
- Sau khi triển khai chỉ kiểm: băm khớp `main`, `/exec` mở được màn đăng nhập. Lỗi thì quay lui phiên bản 28, ghi SNAPSHOT, báo chủ dự án.

Ghi phiên bản mới vào SNAPSHOT mục 1, CHANGELOG, `HUONG_DAN_TRIEN_KHAI.md`; `TIEN_DO_PO` mục 28, 30, 31 ghi "đã lên link chính (phiên bản N), chờ chủ dự án thử", không ghi Xong.
