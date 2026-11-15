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
