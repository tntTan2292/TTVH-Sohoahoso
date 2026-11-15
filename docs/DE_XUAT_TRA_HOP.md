# Đề xuất nâng cấp lần 3 – Quy chuẩn giao nhận / Trả hộp (CHỜ OPUS XÉT DUYỆT)

> Người soạn: Sonnet (rà soát, 15/11/2026). **Chưa sửa dòng mã nào.** Đây là phiếu để Opus (CTO) duyệt phương án, sau đó chủ dự án trả lời câu hỏi nghiệp vụ, rồi mới giao code.
> Yêu cầu của chủ dự án: trong tab **Đối soát hộp** thiếu dữ liệu cột **Trả hộp cho TTLT**; chức năng trả hộp chưa rõ ràng, cần quy chuẩn lại hai chặng: **(1) Nhân viên → Quản lý**, **(2) Quản lý → Trung tâm Lưu trữ (TTLT)**.

## 1. Hiện trạng (đọc từ mã, `main` = `33a5d94`)

### 1.1 Hệ thống chỉ có MỘT bước "trả"
| Chặng | Có trong hệ thống? | Bước ghi (`NhatKy.Buoc`) | Ai báo |
|---|---|---|---|
| TTLT → Quản lý | Có | `NHAN` ("Nhận từ TT Lưu trữ") | ADMIN/TT/TP |
| Quản lý → Nhân viên/nhóm | Có | `NHAN_NHOM` ("Nhận hộp") | Nhân viên/nhóm tự báo |
| Nhân viên → Quản lý (**giao hộp xong**) | **KHÔNG CÓ** | (không có) | – |
| Quản lý → TTLT | Có | `TRA` ("Trả hộp") | ADMIN/TT/TP |

Chặng (1) **không có bước riêng**. Hệ thống chỉ gián tiếp biết hộp "xong" nhờ tick **Xong hộp** (`HetHop`) ở Scan/Tách/OCR. Không biết hộp đã về tay Quản lý chưa, ai giao, lúc nào.

### 1.2 Cách `TRA` đang hoạt động (`Code.gs`)
- `ghi_` (dòng 565, 637–644): chỉ ADMIN/TT/TP. Dán danh sách mã. Hộp có `NHAN` mà **chưa Tách xong** → bỏ qua kèm cảnh báo; hộp **không có `NHAN`** → chỉ cảnh báo, **vẫn ghi**. Hộp đã có `TRA` → bỏ qua ("đã ghi nhận trước đó"), nên **không trả lại được lần hai** (trả bổ sung, trả sửa, trả từng phần).
- Dòng `TRA` chỉ có: ngày, ca, người nhập, nhóm (thường rỗng). **Không có** người/đơn vị bên TTLT nhận, số biên bản/phiếu giao, số hồ sơ-tờ lúc trả, ghi chú riêng.
- `hopHoSo_`/`hopBanGhi_` (1766, 1793) chỉ giữ `{ngay, ca}` của lần trả **sớm nhất**; không trả `nguoi` (người trả), không trả ghi chú.
- Đối soát (`Index.html` 4564–4565): cột "Trả" chỉ hiện **ngày** (`ngayNgan`), không ca, không người; CSV có "Ngày trả" duy nhất.
- Trạng thái (`hopTrangThai_` 1777): `THIEU_NHAN` được xét **trước** nên hộp trả mà thiếu `NHAN` hiện "Thiếu nhận TTLT", **che mất việc đã trả**. "Đủ" = có nhận + OCR xong + có trả; khi Tách xong nhưng OCR chưa xong và đã trả → "Đang làm dở" (không có nhãn "đã trả, chờ OCR").
- Gợi ý khi chọn trả (`hopGoiY_` 802): mọi hộp có `NHAN` mà chưa `TRA`, **không lọc theo đã Tách xong** → danh sách gợi ý chứa cả hộp sẽ bị bỏ qua.
- Dashboard: `traHop` = số hộp có mốc `TRA` sớm nhất rơi vào mốc ca/ngày; tồn đầu ca = đã nhận, chưa trả (`hopTapTruoc_` 1746). Không có "đã giao cho Quản lý, chưa trả TTLT".

### 1.3 Vì sao cột "Trả" trông thiếu (giả thuyết, cần chủ dự án xác nhận)
1. **Không ai/ít khi báo `TRA`** vì thao tác nằm riêng (chỉ nút của Quản lý, dán mã tay), và không có điểm nhắc nào dẫn tới nó → cột trống dù hộp đã trả thật.
2. Có báo `TRA` nhưng **hộp bị bỏ qua** vì chưa Tách xong ở hệ thống (dữ liệu cũ nhập thiếu `HetHop`) → không có dòng nào để đối soát.
3. Có hiện nhưng **chỉ thấy ngày**, thiếu ca/người/ghi chú nên không đối chiếu được với biên bản thật.
4. Nghiệp vụ thật có **chặng nhân viên → quản lý** mà hệ thống không ghi, nên hộp "xong" nhưng chưa trả không phân biệt được là còn ở nhân viên hay đã ở quản lý.

→ **Chưa có số liệu thật** để biết giả thuyết nào đúng. Đề xuất bước 0 bên dưới (chỉ đọc).

## 2. Phương án

### Phương án A – Nhẹ: giữ một bước `TRA`, làm rõ & đủ dữ liệu (không đổi mô hình)
- Đối soát: cột "Trả TTLT" hiện **ngày · ca · người trả · ghi chú**; thêm trạng thái "Đã trả, OCR chưa xong"; trạng thái thiếu nhận **không che** thông tin trả (hiện thêm chip "đã trả").
- `ghi_` `TRA`: gợi ý chỉ hộp đã Tách xong; cho phép **ghi chú trả** (số biên bản/người nhận bên TTLT, đưa vào `GhiChu`, không thêm cột).
- Cho phép trả lại lần hai khi ADMIN cố ý (có cờ) – hoặc giữ bỏ qua và ghi rõ.
- Ưu: ít rủi ro, không đổi `dash_`. Nhược: **không giải quyết chặng nhân viên → quản lý**.

### Phương án B – Khuyến nghị: tách hai chặng bằng một bước mới `GIAO`
- Thêm `Buoc = 'GIAO'` ("Giao hộp cho Quản lý"): **nhóm/cá nhân** báo hộp đã làm xong và đã giao lại Quản lý (dạng tick từ "Hộp của tôi"/bảng nhiều hộp, như P6/P7a). Không thêm cột sheet (dùng `Buoc`, `MaHop`, `NguoiNhap`, `Nhom`, `ThanhVien`, `GhiChu`).
- Quản lý **xác nhận nhận** chặng này bằng chính thao tác Trả: danh sách gợi ý của `TRA` = hộp đã `GIAO` mà chưa `TRA` (hộp ngoài danh sách vẫn gõ tay được, chỉ cảnh báo, đúng quyết định Q1 trước đây).
- `TRA` giữ nguyên ý nghĩa **Quản lý → TTLT**, bổ sung ghi chú biên bản.
- Đối soát thêm cột **"Giao QL"** (ngày · ca · người/nhóm) cạnh cột **"Trả TTLT"**; thêm trạng thái "Đã giao QL, chưa trả TTLT" (thay cho "Làm xong chưa trả" mơ hồ). Dashboard thêm đúng một ô/thông số "Chờ trả TTLT" (hộp đã giao QL, chưa trả) nếu Opus muốn.
- Ràng buộc: `GIAO` là **cảnh báo, không chặn** (hệ thống mới triển khai, hộp cũ chưa có lịch sử): `TRA` không có `GIAO` vẫn ghi, chỉ cảnh báo.
- Tương thích: dữ liệu cũ không có `GIAO` → trạng thái cũ hiển thị như hiện nay (không tính thiếu); `dash_` các số hiện có **giữ nguyên** (mock so trước/sau).
- Ảnh hưởng mã: `ghi_` (thêm `GIAO` vào danh sách bước, quyền cho cả tổ viên), `STEP_NAME_`, `hopMoc_`/`hopHoSo_`/`hopTrangThai_`/`hopBanGhi_`, `hopGoiY_`, `nhatKyRows_`, `Index.html` (`STEP_LABEL`, `stepsFor`, đối soát, CSV, nhật ký), `docs/CHUC_NANG.md`, `docs/API.md`.

### Phương án C – Đầy đủ: thêm xác nhận hai chiều
Quản lý bấm **xác nhận đã nhận** từng hộp nhân viên giao (hai bản ghi: `GIAO` + `XACNHAN`), TTLT cũng có xác nhận. Chặt chẽ nhưng thêm thao tác cho mọi người, trái mục tiêu "bỏ nhập trùng". **Không khuyến nghị** ở giai đoạn này.

## 3. Khuyến nghị
**Phương án B**, làm theo thứ tự: (0) đọc số thật → (1) A (hiển thị, không đổi mô hình, làm trước) → (2) `GIAO`. Nếu chủ dự án muốn chỉ làm nhanh: chỉ A. Lý do B: chủ dự án nêu rõ hai chặng giao nhận; A tự nó không biểu diễn được chặng đầu.

## 4. Bước 0 (chỉ đọc, không ghi Sheet) – cần chủ dự án đồng ý
Dùng tab Đối soát/Nhật ký trên link thật, hoặc ADMIN xuất CSV đối soát (không PIN), để thống kê: số hộp có `NHAN` nhưng không có `TRA`; số dòng `TRA` bị bỏ qua (xem log `BAO_CAO` có "KHÔNG ghi trả"); số hộp `TRA` mà thiếu `NHAN`. Kết quả quyết định giả thuyết ở mục 1.3.

## 4a. KẾT QUẢ BƯỚC 0 (đã đọc trực tiếp tab `NhatKy` trên Google Sheet thật, 15/11/2026, chỉ đọc, không ghi)
374 dòng (2 dòng đã hủy bỏ ra), ngày 02/11–15/11, 150 hộp (gộp theo khóa mã). Số dòng theo bước: `NHAN` 6, `NHAN_NHOM` 95, `SCAN` 119, `TACH` 146, `TRA` 6, `OCR` 0.
- **Chỉ 6 hộp có `NHAN` và đúng 6 hộp có `TRA`**: cùng 6 mã (2.1.83, .87–.91); nhận ca Sáng 10/11, trả ca Chiều 13/11 (không ghi chú). Ngoài 6 hộp này, **không có hộp nào được báo Nhận từ TTLT hay Trả**.
- **144/150 hộp thiếu `NHAN`**; trong đó **137 hộp đã Tách xong** nhưng không có `NHAN` và không có `TRA`. Nhóm có báo "Nhận hộp" (`NHAN_NHOM`) cho 94 hộp, 89 hộp trong số đó không có `NHAN`.
- Không có hộp `TRA` mà chưa Tách xong, không có hộp `TRA` thiếu `NHAN`: giả thuyết "lệnh Trả bị bỏ qua" **không đúng**; lỗi nằm ở chỗ **không ai báo**.
- Hộp mới tính từ 09/11: 36 + 12 + 18 + 18 + 19 + 10 + 7 hộp có làm, đa số Tách xong, chỉ 6 hộp có nhận/trả.
- **Kết luận:** cột "Trả" ở Đối soát gần như trống vì (a) Quản lý **không báo `NHAN` và `TRA`** (chỉ làm cho 6 hộp), (b) hộp cũ trước khi dùng hệ thống chưa có lịch sử nhận (đã dự đoán ở Q1 đợt trước), (c) không có bước nào buộc/nhắc báo. Giả thuyết 1 và 4 ở mục 1.3 đúng; giả thuyết 2 sai; giả thuyết 3 là lỗi hiển thị đã nêu. **Hệ quả cho thiết kế:** B (bước `GIAO`) chưa đủ nếu Quản lý vẫn không báo `NHAN`/`TRA`; cần thêm cách báo **hàng loạt, tối thiểu thao tác** (ví dụ "Trả tất cả hộp đã Tách xong và chưa trả" bằng một lần bấm, có Xem trước) và cho phép **nhập bổ sung ngày trả/nhận thật** cho hộp cũ. Đề xuất Opus cân nhắc làm A + "trả hàng loạt" trước.
- Chưa đọc tab Nhật ký hành động và tab `ChotCa`; không cần cho kết luận trên.

## 5. Câu hỏi cho chủ dự án (Opus lọc trước khi hỏi)
| # | Câu hỏi | Mặc định đề xuất |
|---|---|---|
| Q1 | Nhân viên giao hộp cho Quản lý theo cách nào ngoài đời (giao tận tay từng hộp, giao cuối ca, ký phiếu)? | Cuối ca, nhóm báo một lần |
| Q2 | Ai bấm `GIAO`: người trong nhóm, hay Tổ trưởng/Tổ phó thay? | Nhóm/cá nhân tự báo; quản lý được nhập hộ |
| Q3 | Quản lý có cần xác nhận **đã nhận** từng hộp nhân viên giao (phương án C) hay chỉ cần nhân viên báo giao? | Chỉ nhân viên báo, quản lý xác nhận ngầm khi trả TTLT |
| Q4 | Khi trả TTLT có biên bản/phiếu riêng cần ghi (số phiếu, người nhận bên TTLT)? | Ghi vào ghi chú, không thêm cột |
| Q5 | Trả một hộp nhiều lần (trả bổ sung/trả lại) có xảy ra không? | Không; vẫn bỏ qua lần hai, ADMIN sửa bản ghi cũ |
| Q6 | Hộp "trả mà chưa Tách xong" (hiện bị bỏ qua) có tình huống hợp lệ không (vd trả để TTLT xử lý tiếp)? | Giữ bỏ qua + cảnh báo |
| Q7 | Hộp nhận nhóm chưa có `GIAO` có được trả không? | Được, chỉ cảnh báo |

## 6. Điểm Opus cần quyết
1. Chọn A, B hay A→B (khuyến nghị A→B).
2. Thêm `Buoc` mới `GIAO` có ổn không (không thêm cột, nhưng thêm giá trị mới vào `NhatKy.Buoc` và `STEP_NAME_`; có chỗ nào so chuỗi cố định cần soi: `ghi_`, `hopMoc_`, `thongKeNhanSu_` (dòng 2009), `nhatKyRows_`).
3. `dash_` phải giữ nguyên mọi số hiện có; ô "Chờ trả TTLT" có làm hay không.
4. Có cho `TRA` lần hai (Q5) hay giữ bỏ qua.
5. Có đổi thứ tự ưu tiên `hopTrangThai_` (không che "đã trả" bởi "thiếu nhận") không.

## 7. Kế hoạch thực hiện nếu duyệt
- **Sonnet (code):** A trước (đối soát hiển thị, gợi ý, ghi chú trả) rồi `GIAO`; mỗi việc một commit (mã F-TH-01, F-TH-02…); mock **không giảm**, thêm kiểm tra: `dash_` trước/sau giống hệt khi không có `GIAO`; trạng thái đối soát đủ tổ hợp; `TRA` cảnh báo đúng.
- **Antigravity:** làm đẹp cột Giao QL/Trả, chip trạng thái, nút Giao hộp ở "Hộp của tôi" (sau khi Sonnet xong).
- **Opus:** review gộp một lần trước khi chủ dự án đẩy tay. Dữ liệu cũ không sửa tự động.
- **Chưa làm:** bất kỳ sửa Sheet thật, triển khai, đổi cột.

## 8. KẾT LUẬN OPUS (15/11/2026): DUYỆT CÓ ĐIỀU KIỆN

Opus tự soi mã tại `790a840` (`ghi_` 559–650, `hopGoiY_` 792–804, `hopMoc_`/`hopTapTruoc_`/`hopHoSo_`/`hopTrangThai_`/`hopBanGhi_` 1733–1795; `Index.html` form một bước ~3330–3350, đối soát 4535). Đồng ý với Sonnet: **bài toán gốc là hành vi báo cáo của Quản lý, không phải thiếu bước.** Thêm hai phát hiện:
- **Form Nhận/Trả là ô dán mã tay**: gợi ý chỉ hiện 12 mã dạng chữ, không chạm/chọn được; `hopGoiY_` không có nhánh cho `NHAN` (trả rỗng). Trả 137 hộp = gõ 137 mã → đây là lý do thực tế không ai báo.
- **OCR = 0 dòng trên Sheet thật**, mà "Đủ" và "Làm xong chưa trả" đều đòi OCR xong → hiện tại **không hộp nào có thể lên "Đủ" hay "Làm xong chưa trả"**, kể cả khi đã báo Trả.
- `hopTrangThai_` chỉ dùng cho Đối soát (`hopBanGhi_` → `doiSoatHop_`), **không dùng trong `dash_`** → đổi trạng thái không đổi số Dashboard.

### 8.1 Phương án chốt (trả lời 9 mục của phiếu)
1. **Hướng:** A + "điền nhanh" + bù `NHAN` một lần. **Hoãn B (`GIAO`)**: thêm thao tác cho tổ viên trái mục tiêu bỏ nhập trùng, và số liệu cho thấy chặng thiếu là chặng của Quản lý. Quy chuẩn chặng 1 (đề nghị, chờ chủ dự án xác nhận Q-D): **tick "Xong hộp" ở Tách = tổ viên đã giao hộp lại cho Quản lý**. Không làm C.
2. **Trả hàng loạt = KHÔNG thêm action.** `ghi_` đã nhận tới 200 mã/lần, có hộp xác nhận số hộp + ca, có cảnh báo từng hộp, xóa được từng bản ghi. Chỉ cần: gợi ý `TRA` = hộp **Tách xong, chưa trả** (bất kể có `NHAN`; không đòi OCR) + nút **"Điền tất cả hộp gợi ý"** vào ô mã (người dùng xóa bớt được trước khi gửi). Không cần gõ xác nhận kiểu `chuanHoaNhom` vì đây là báo cáo thường, không sửa bản ghi cũ. Hộp không có `NHAN`: giữ như hiện nay (cảnh báo, vẫn ghi), nhưng **khuyến nghị chạy bù `NHAN` (mục 3) trước khi trả** để Đối soát sạch. Trả theo ngày thật đã qua: dùng chế độ **Bổ sung** sẵn có (`p.boSung`, Loai `BỔ SUNG`), cùng nút điền nhanh.
3. **Bù `NHAN` cho hộp cũ: có, bằng tập lệnh chạy một lần** (`CHUAN_PROMPT.md` 3c, không action, không giao diện): `xemTruocBuNhan()` (chỉ đọc, in bảng) + `apDungBuNhan()`. Chọn hộp: còn hiệu lực, không THỬ NGHIỆM, có ít nhất một bản ghi, **chưa có `NHAN`**. Ngày/ca của `NHAN` bù = mốc **`NHAN_NHOM` sớm nhất** của hộp, không có thì **bản ghi sớm nhất** của hộp. `Loai='BỔ SUNG'`, `GhiChu='[Bù nhận TTLT, chạy <ngày>]'`, `NguoiNhap` = mã ADMIN chạy (lấy từ tham số hằng trong hàm, không đoán). Chạy trong khóa, đọc thẳng Sheet, ghi `@` cho `MaHop`, `log_` từng hộp, `memoClear_('NhatKy')`. Mã hộp theo khóa H1 (không tạo trùng biến thể). **Chỉ chạy khi chủ dự án trả lời Q-C.** Không bù `TRA` tự động (không biết ngày thật).
4. **`GIAO`:** hoãn. Ghi lại để làm sau nếu cần: phải sửa danh sách bước ở `ghi_` (564, 572, 586, 608), `STEP_NAME_`, `khoiPhuc_` (745, `mot`), `hopGoiY_`, `hopHoSo_`, `nhatKyRows_` không cần, `dash_` 2009 (`chiTiet`/`nnMap` sẽ rơi vào nhánh không đếm – an toàn), `Index.html` `stepsFor` (3013–3014), `STEP_LABEL`, màu bước 3269/3382.
5. **`dash_`: không đổi một dòng nào trong đợt này.** Mock so `dash_` với bản `790a840` (mọi ngày, có/không `gomThu`) giống hệt. **Không làm ô "Chờ trả TTLT"**; thay bằng dòng nhắc ở Quản lý ca (mục F-TH-02). Lưu ý cho chủ dự án: **chạy bù `NHAN` (dữ liệu) sẽ làm đổi số "hộp nhận"/"tồn đầu ca" của các ngày cũ** – đó là sửa dữ liệu, không phải đổi cách tính.
6. **`hopTrangThai_` đổi thứ tự** (thiếu nhận không che đã trả; "xong" theo Tách vì Trả chỉ cần Tách xong):
   1. có trả, Tách chưa xong → `TRA_SOM`
   2. có trả, có nhận, OCR xong → `DU` "Đủ"
   3. có trả (còn lại) → **`DA_TRA` "Đã trả, chưa đủ"**, ghi chú nêu thiếu gì ("thiếu nhận TTLT", "OCR chưa xong")
   4. không có nhận → `THIEU_NHAN`
   5. Tách xong → `XONG_CHUA_TRA`, đổi nhãn thành **"Tách xong, chưa trả"**
   6. có làm → `DANG_LAM`, không → `NHAN_CHUA_LAM`
   Giữ nguyên mã cũ, chỉ thêm `DA_TRA`; cập nhật `HOP_TT_`, `DS_TT`, `DS_CHIP`. Nếu Q-E trả lời "OCR không báo trên hệ thống" thì bỏ điều kiện OCR ở bước 2 (delta nhỏ).
7. **Trả lần hai:** giữ bỏ qua (mặc định Q5). **Ghi chú biên bản:** dùng `GhiChu` sẵn có (dòng `TRA` đã lưu ghi chú), thêm gợi ý ô nhập "Số biên bản / người nhận bên TTLT"; Đối soát và CSV hiện **ngày · ca · người · ghi chú** của Trả (và người của Nhận TTLT).
8. **Câu hỏi chủ dự án:** mục 8.2. Q2, Q3, Q5, Q6, Q7 của Sonnet dùng mặc định, không hỏi; Q1 thay bằng Q-D; Q4 dùng mặc định.
9. **Phân công:** Sonnet làm F-TH-01, F-TH-02, F-TH-03 (một việc một commit) → tự viết phiếu Antigravity (nút điền nhanh, chip `DA_TRA`, cột Trả TTLT) → Opus review gộp một lần → chủ dự án đẩy tay → chủ dự án chạy `xemTruocBuNhan` → duyệt → `apDungBuNhan`. Điểm phải dừng: F-TH-03 (sửa dữ liệu thật) chỉ viết + mock, **không chạy**. Tiến độ: mục 33 (F-TH-01), 34 (F-TH-02), 35 (F-TH-03) trong `docs/TIEN_DO_PO.md`.

### 8.2 Câu hỏi cho chủ dự án (5 câu)
| # | Câu hỏi | Mặc định nếu không trả lời |
|---|---|---|
| Q-A | Vì sao Quản lý không báo Nhận TTLT / Trả hộp: phải gõ mã tay, quên, không thấy nút, hay không biết phải báo? | Coi là do gõ tay + không có nhắc → làm điền nhanh + nhắc |
| Q-B | 137 hộp đã Tách xong: thực tế **đã trả TTLT chưa**? Đã trả thì ngày nào (một ngày chung hay theo đợt)? Chưa trả thì đang ở đâu? | Chưa trả; Quản lý bấm Trả khi trả thật |
| Q-C | Đồng ý **bù Nhận TTLT** cho 144 hộp, lấy ngày/ca = lúc nhóm nhận hộp (hoặc lúc làm đầu tiên)? Biết rằng số "hộp nhận" và "tồn đầu ca" của các ngày cũ trên Dashboard sẽ thay đổi. | Chưa chạy (chờ trả lời) |
| Q-D | Quy chuẩn chặng Nhân viên → Quản lý: **tick "Xong hộp" ở Tách = đã giao hộp lại cho Quản lý**, không thêm thao tác. Đồng ý, hay cần một bước "Giao hộp" riêng? | Đồng ý tick Xong hộp; không thêm bước |
| Q-E | Trên hệ thống chưa có báo cáo **OCR** nào. OCR có còn báo trên hệ thống không? Nếu không, "Đủ" chỉ cần Nhận + Tách xong + Trả? | Giữ điều kiện OCR |

## 9. QUYẾT ĐỊNH CHỦ DỰ ÁN (15/11/2026) VÀ PHƯƠNG ÁN CHỐT LẦN CUỐI (Opus)

| # | Chủ dự án trả lời | Opus chốt cách làm |
|---|---|---|
| Q-A | Nhận/Trả là quy trình **bắt buộc**; không làm thì phải cảnh báo | Thanh cảnh báo đỏ ở Quản lý ca (TT/TP/ADMIN) + dòng đỏ ở Đối soát. Không chặn báo cáo của tổ viên |
| Q-B | Quản lý chưa báo → cảnh báo trên hệ thống, Đối soát **tô nền đỏ** | Tô nền đỏ các dòng: thiếu Nhận từ TTLT, Tách xong chưa Trả cho TTLT, Trả khi chưa Tách xong |
| Q-C | **Quản lý tự nhập bổ sung trong hệ thống** (không phải tập lệnh) | **Bỏ tập lệnh bù `NHAN`.** F-TH-03 đổi thành thao tác ngay trong Đối soát: tick hộp dòng đỏ → "Ghi Nhận từ TTLT" / "Ghi Trả cho TTLT", chọn ngày + ca; dùng `ghi_` sẵn có (chế độ Bổ sung khi khác ca hiện tại). Hợp lệ theo `CHUAN_PROMPT.md` 3c vì người không phải chủ dự án phải tự làm |
| Q-D | Đồng ý: nhân viên làm xong mặc định đã trả hộp cho Quản lý | Quy chuẩn: **tick "Xong hộp" ở Tách = tổ viên đã giao hộp lại cho Quản lý**. Không thêm bước `GIAO` |
| Q-E | Không cần OCR (OCR không cần hồ sơ giấy); Tách xong là trả được cho TTLT | "Đủ" = Nhận từ TTLT + Tách xong + Trả cho TTLT. Cột OCR giữ để xem, **không** tính vào trạng thái |
| Thêm | Đối soát có **2 cột: NHẬN TỪ TTLT và TRẢ CHO TTLT** | Hai cột cùng dạng: ngày · ca · người (ghi chú dòng nhỏ). CSV có đủ ngày, ca, người, ghi chú cho cả hai |

**Trạng thái Đối soát (thay mục 8.1 điểm 6), xét từ trên xuống:**
1. Có trả, Tách chưa xong → `TRA_SOM` "Trả khi chưa Tách xong" — **đỏ**
2. Có trả, có nhận (Tách xong) → `DU` "Đủ"
3. Có trả, không có nhận → `DA_TRA` "Đã trả, thiếu Nhận từ TTLT" — **đỏ**
4. Không có nhận → `THIEU_NHAN` "Thiếu Nhận từ TTLT" — **đỏ**
5. Tách xong, chưa trả → `XONG_CHUA_TRA` "Tách xong, chưa Trả cho TTLT" — **đỏ**
6. Có làm → `DANG_LAM`; không → `NHAN_CHUA_LAM`

**Giữ nguyên:** `dash_` (không đổi dòng nào), `ghi_` (quyền, bỏ qua trả lần hai, cảnh báo), cột Sheet, action, `Buoc`. Lưu ý: khi Quản lý nhập bù Nhận theo ngày cũ, số "hộp nhận"/"tồn đầu ca" của ngày đó trên Dashboard thay đổi — đúng ý (sửa dữ liệu, không đổi cách tính).
Phiếu Sonnet đã sửa theo mục này: `docs/prompts/PROMPT_SONNET_TRA_HOP_TH1.md`.
