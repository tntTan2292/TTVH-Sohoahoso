# SNAPSHOT – Đang làm tới đâu

> **Mỗi phiên làm việc (người hay AI) đọc file này ĐẦU TIÊN và CẬP NHẬT nó TRƯỚC KHI DỪNG**, kể cả khi dừng giữa chừng.
> Mở chat mới mà không biết đang làm gì → dán nội dung file này vào, hoặc nói "đọc `docs/SNAPSHOT.md` rồi làm tiếp".
> Giữ ngắn gọn: chỉ trạng thái hiện tại. Lịch sử đã xong chuyển sang `CHANGELOG.md`.

---

## 1. Trạng thái hệ thống
| Mục | Giá trị |
|---|---|
| Cập nhật lúc | 10/11/2026 14:30 — Sonnet: triển khai phiên bản 22 (Đợt A + D1 + D2); chờ ADMIN đăng nhập để chạy A2 Xem trước |
| Nhánh / commit | `main`, đã đẩy lên GitHub `tntTan2292/TTVH-Sohoahoso` (xem `git log -1`) |
| Bản đang chạy | Apps Script **phiên bản 22** (10/11/2026 14:24) trên link chính `…MlRA/exec` = commit `5ccfbbc` (Đợt A: F-BC-20, F-DL-07, F-NS-04/05 + D1 `e75b6a1` + D2). Phiên bản trước: 21 (`96db7c6`) — **quay lui: Quản lý triển khai → `…MlRA` → ✏️ → chọn phiên bản 21 → Triển khai**. Link phụ `…NIQ/exec` không đụng |
| Mã trên Apps Script khớp repo? | **Có** (băm SHA-256 `Code.gs` 880737265eba…, `Index.html` 964f87b87663… khớp `main` sau khi lưu và tải lại trang; bản 21 trước khi đẩy đã khớp `96db7c6`) |
| Mock | `node tools/test_mock.js` → **308 đạt, 0 lỗi**; `node tools/kiem_tra_giao_dien.js` → 420 đạt, 0 lỗi (chạy thẳng trên checkout CRLF sau D2) |
| Kiểm thử trên Sheet thật | **Chưa đầy đủ** (xem `HUONG_DAN_TRIEN_KHAI.md` mục E) |

## 2. Việc đang làm (dở dang)
> Ghi rõ: đang sửa gì, **ai làm (Opus/Sonnet/Antigravity — xem `docs/PHAN_CONG.md`)**, file nào, đã xong bước nào, còn bước nào. Nếu không có gì dở → ghi "Không".

### 2a. CHUẨN HÓA QUY TRÌNH BÁO CÁO — bỏ nhập trùng (việc lớn, giao Sonnet)
- **Vấn đề:** báo cáo có quá nhiều thao tác nhập trùng (mỗi hộp gõ lại mã + số liệu ở Scan/Tách/OCR, chỉ 1 hộp mỗi lần gửi, nhận 2 tầng, 2 ô trang/tờ, form Nhập hộ là bản sao…), tốn thời gian.
- **Prompt giao việc:** `docs/prompts/PROMPT_SONNET_CHUAN_HOA_BAO_CAO.md` (đã liệt kê 10 điểm trùng D1–D10, ràng buộc, câu hỏi không được tự quyết).
- **Cách làm:** 2 giai đoạn. GĐ1: viết `docs/DE_XUAT_CHUAN_HOA_BAO_CAO.md` (đếm thao tác trước/sau, đề xuất P1, P2…) rồi **dừng chờ chủ dự án duyệt**. GĐ2: làm từng đề xuất đã duyệt, mỗi đề xuất một commit.
- **Phân công** (`docs/PHAN_CONG.md`): GĐ1 đề xuất + GĐ2 code → **Sonnet**; đề xuất đụng cách tính số liệu/API → **Opus review** trước khi chủ dự án duyệt; phần đẹp giao diện của form mới → **Antigravity** sau khi Sonnet xong; trước triển khai → **Opus review GO/NO-GO**.
- **Trạng thái:** ☑ GĐ1 xong (Sonnet, 09/11/2026): `docs/DE_XUAT_CHUAN_HOA_BAO_CAO.md` — đề xuất P1–P7, câu hỏi Q1–Q7, chưa sửa dòng mã nào, **không tự chuyển GĐ2** · ☑ Opus review đề xuất (09/11/2026): **ĐẠT CÓ ĐIỀU KIỆN**, 4 yêu cầu R1–R4 ghi ở mục 7 của file đề xuất (R1 chặn: lô phải chỉ đọc NhatKy 1 lần; R2 chỉ gửi `soTo`; R3 gộp P1 vào P2; R4 `idLo` bắt buộc). Thứ tự: P0 → P2(+P1) → P4 → P6 → P5 → P7a → P3 · ☑ chủ dự án trả lời Q1–Q5 (09/11/2026, ghi ở mục 8 file đề xuất: giữ Nhận hộp + tick/gõ tay; bỏ Số trang; KHÔNG điền sẵn (bỏ P5); cho tick OCR; 10 hộp/lần, ghi phần đúng; **mã hồ sơ là thông tin chính**) · ☑ **Đợt 1 – Sonnet xong** (P0 `c2f00a6`, P2 `db160c8`, P4 `3472935`, P3 `7d100c5`) · ☑ **Đợt 1 – Antigravity làm đẹp xong** (F-BC-18, F-BC-19, F-QL-11) · ☐ Opus review TỔNG THỂ Đợt 1 (một lần) · ☐ chủ dự án thử link thật · ☐ Đợt 2 (P6, P7a) · ☐ GĐ2 (ghi P nào xong ở đây) · ☐ Antigravity làm đẹp · ☐ Opus review trước triển khai
- **Đợt 1 – Sonnet & Antigravity xong (09/11/2026), đã đẩy GitHub, CHƯA triển khai:** P0, P2, P4, P3 + Giao diện bảng nhiều hộp (thẻ gọn 360px, số hồ sơ + số tờ cạnh nhau 50/50, thanh tick khâu gọn + OCR chủ động, chip gợi ý dễ chạm, nút lớn, kết quả ✔/✕ và lỗi đỏ tại thẻ). Mock 229/0, `kiem_tra_giao_dien.js` 356 đạt / 0 lỗi. **Chưa xác minh:** khóa 25 giây và tốc độ lô 30 dòng trên Apps Script/Sheet thật; `idLo` qua CacheService thật; giao diện trên điện thoại thật. Việc kế: **Opus review L3**, chủ dự án thử link thật (gộp F-QL-10), rồi Đợt 2 (P6, P7a). Form cũ chưa gỡ (chờ nghiệm thu).
- **☑ Opus review TỔNG THỂ Đợt 1 (09/11/2026, commit `db160c8..bbe1b5d`): ĐẠT – GO triển khai THỬ.** R1–R4 đạt (lô chỉ đọc NhatKy 1 lần nhờ `memoThem_`; chỉ gửi `soTo`; bảng dùng chung Báo cáo + Nhập hộ, form cũ giữ ở chế độ "Một hộp"; `idLo` gắn theo người, lưu sau khi ghi). Mock 229/0, giao diện 356/0, `dash_` trước/sau giống hệt. Phát hiện:
  - **F1 (đưa vào Đợt 2):** chưa có cảnh báo **mã hồ sơ trùng** với mã đã báo ở cùng khâu của cùng hộp (Opus đã chốt ở mục 8 file đề xuất). Chỉ cảnh báo, không chặn.
  - **F2 (điều kiện khi thử thật):** mỗi mục trong lô vẫn ghi Sheet riêng + ghi nhật ký riêng (~6 lệnh Sheet/mục) → lô 30 dòng có thể mất 10–20 giây trong khóa. Chủ dự án thử 1 lô **10 hộp × Scan + Tách** và ghi lại thời gian chờ. **> 15 giây** → giao Sonnet gộp ghi (appendMany cho NhatKy + một dòng log cho cả lô) trước khi dùng thật.
- **Đang giao Sonnet (09/11/2026):** triển khai bằng Claude in Chrome (Chrome đã đăng nhập sẵn, chủ dự án không phải thao tác) + tạo skill `update-code-sohoa` — phiếu `docs/prompts/PROMPT_SONNET_TRIEN_KHAI.md`; URL trình soạn và link `/exec` ở `deploy.local.md` (chỉ trên máy, không lên Git). ☐ đối chiếu bản trên Apps Script · ☐ triển khai …MlRA · ☐ skill · ☐ tài liệu.
- **Việc kế (chủ dự án, cách tay nếu không dùng clasp):** dán **cả `Code.gs` và `Index.html`** lên Apps Script → Triển khai phiên bản mới trên link `…MlRA` (gồm luôn F-QL-10) → thử theo danh sách trong báo cáo Opus (tổ viên lô 3 hộp Scan+Tách; gửi lại khi mất mạng; Nhập hộ lô; đo thời gian lô 10 hộp) → báo kết quả cho Opus.
- **Sau đó:** Đợt 2 (Sonnet → Antigravity): P6 "Hộp của tôi" + P7a + F1.

- **Triển khai Đợt 1 (09/11/2026, Sonnet): ĐÃ LÀM** – phiên bản **17** cho `…MlRA` (trước đó là phiên bản **16**, không phải 13 như ghi cũ; mã bản 16 khớp `ef54be3`). Đối chiếu trước khi đẩy: `Code.gs`, `Index.html` khớp `ef54be3`; `appsscript.json` trên Apps Script chỉ khác định dạng (Apps Script tự xuống dòng), nội dung JSON giống hệt → không ghi đè. Mở link `/exec`: tiêu đề "Số hóa hồ sơ - Báo cáo ca", màn hình đăng nhập hiện bình thường. **Chủ dự án thử 5 bước** (gồm đo thời gian lô 10 hộp × 3 khâu, F2). Quay lui: Quản lý triển khai → `…MlRA` → ✏️ → chọn **phiên bản 16** → Triển khai.

### 2b. F-QL-10 — tick "Scan kèm Tách" ở form Nhập hộ
- **Đã xong trong mã** (commit `07618a0`, mock 190/0, thử giao diện bằng mock).
- **Còn lại (chủ dự án làm):** dán `Index.html` lên Apps Script → Triển khai phiên bản mới trên link `…MlRA` (Quản lý triển khai → ✏️ → Phiên bản mới); thử thật: Tổ trưởng → Quản lý ca → Nhập hộ → Scan, tick, gửi → Nhật ký có 2 dòng SCAN + TACH loại NHẬP HỘ. Có thể gộp vào lần triển khai sau khi chuẩn hóa.

## 3. Việc tiếp theo (theo thứ tự ưu tiên)
**▶ NÂNG CẤP SAU TRIỂN KHAI CHÍNH THỨC (10/11/2026) — ƯU TIÊN CAO NHẤT.** Phiếu: `docs/prompts/PROMPT_NANG_CAP_SAU_TRIEN_KHAI.md` (nguyên nhân V1–V6 Opus đã khoanh, quyết định mặc định QĐ1–QĐ5, 3 đợt). Hệ thống đang chạy thật: không đổi link, không đổi cột, sửa dữ liệu thật phải xem trước → chủ dự án duyệt → sao lưu → log.
- ☑ **Đợt A khẩn – Sonnet XONG (10/11/2026), đã đẩy GitHub, CHƯA triển khai, DỪNG ở điểm phải dừng (phân quyền + sửa dữ liệu thật):** A1 `4c0084c` (F-BC-20) · A2 `31c237d` (F-DL-07) · A3 `7b8cbf6` (F-NS-04, F-NS-05). Không viết prompt Antigravity (theo phiếu). Mock 306/0. Giao diện A2/A3 chỉ thêm khung thô, chưa làm đẹp. · ☐ **Opus review L3** · ☐ triển khai (skill `update-code-sohoa`) · ☐ A2 xem trước dữ liệu ca Sáng 10/11 (không áp dụng) · ☐ chủ dự án duyệt · ☐ áp dụng
  - **Điểm Opus cần soi:** (1) A1 `ghi_`: `kieuNhan='CANHAN'` khi đã có nhóm → từ chối; nhập hộ `nguoiHo` đã có nhóm mà `nhom` trống/khác → từ chối (nhóm của người đó tra theo `ngay`/`ca` nhập hộ). (2) A2 `chuanHoaNhom_`: dòng trùng chỉ hủy khi số liệu GIỐNG (SoHoSo/SoTrang/SoTo/TrangLoi/HetHop); khác → `xungDot`, không đụng; ghi ô bằng `setValue` từng ô (≈2 lệnh/dòng, ca 50 dòng có thể mất vài chục giây trong khóa); `apDung` cần `xacNhan:'NHOM'`. (3) A3 `luuToVien_`: TT/TP chỉ sửa tổ viên có sẵn, bỏ qua email/vai trò gửi lên; `dsNhanSu` cho TT/TP không trả email, bỏ TN-xx.
  - **Chưa làm / không kiểm được bằng mock:** chạy thật trên Sheet; giao diện trên điện thoại; tốc độ `chuanHoaNhom` trên Apps Script thật. Khối "Quản lý tài khoản ca" cũ giữ nguyên.
  - **☑ Opus review Đợt A (10/11/2026, `4c0084c..7b8cbf6`): ĐẠT CÓ ĐIỀU KIỆN – GO triển khai sau 2 delta.** Đã soi (1)(2)(3): đúng phiếu; phân quyền A3 chặt (TT/TP chỉ tổ viên, không PIN/email, không đổi vai trò); A2 thận trọng đúng QĐ. Vẽ thử giao diện bằng mock: TT/TP có tab Nhân sự (Sửa/Cấp PIN/Mở khóa); tổ viên có nhóm chỉ thấy "Nhóm", chưa nhóm chỉ thấy "Cá nhân"; không lỗi JS. Mock 306/0.
    - **D1 (CHẶN trước khi chạy A2 trên dữ liệu thật):** `chuanHoaNhom_` ghi `Nhom`/`ThanhVien` bằng `setValue` **không đặt định dạng `@` trước** → `ThanhVien` dạng `00109101,00109102` có thể bị Sheet (dấu thập phân là dấu phẩy) đổi thành số, cùng loại lỗi `02.01.85` (F-HT-03). Sửa: đặt `@` cho ô `Nhom`, `ThanhVien` (và `NguoiHuy`) trước khi ghi (dùng `textFmt_`/cùng cơ chế `append_`). Mock: giả lập Sheet đổi chuỗi `số,số` thành số khi ô không `@`; kiểm `chuanHoaNhom` giữ đúng chuỗi.
    - **D2:** `tools/kiem_tra_giao_dien.js` báo 50 lỗi giả trên thư mục làm việc vì `core.autocrlf=true` (file có CRLF) → bỏ `\r` khi đọc file. Phải chạy được trực tiếp, không cần bản LF.
    - ☑ D1 (`e75b6a1`) + D2 (`5ccfbbc`) xong, ☑ triển khai phiên bản 22 (10/11/2026 14:24).
    - ☑ **A2 Xem trước ca Sáng 10/11/2026 (ADMIN, CHƯA ÁP DỤNG):** quét 17 dòng báo cáo; **đổi sang nhóm 2 dòng**; hủy trùng 0; xung đột 0; giữ nguyên cá nhân 0. Cả hai dòng cùng người Dương Thị Hòe (cá nhân) → Nhóm 2 (Dương Thị Hòe + Nguyễn Thanh Hà), lý do "Người báo cáo thuộc Nhóm 2 trong ca này": `R826de79d` 07:44 Nhận hộp **2.1.83** (0 hs/0 trang/0 tờ); `R46c238d8` 07:44 Nhận hộp **2.1.88** (0 hs/0 trang/0 tờ). Cả hai là Nhận hộp (không có số liệu) nên Dashboard Scan/Tách/OCR **không đổi**; chỉ đổi Nhom + ThanhVien. Chưa so Dashboard trước/sau vì chưa áp dụng.
    - ☑ **Chủ dự án DUYỆT, đã ÁP DỤNG (10/11/2026, ADMIN, chủ dự án gõ `NHOM` vào hộp thoại):** đổi 2 dòng `R826de79d`, `R46c238d8` sang Nhóm 2; có sao lưu `SaoLuuXoa` và log `CHUAN_HOA_NHOM` (tự ghi bởi máy chủ, chưa đọc lại ở tab Nhật ký). **Kiểm sau áp dụng:** Xem trước lại ca Sáng 10/11 → "Không có dòng nào cần đổi" (đã quét 17 dòng, xung đột 0). Chưa so Dashboard trước/sau bằng số (2 dòng đều 0 hồ sơ/trang/tờ nên Scan/Tách/OCR không thể đổi). Đợt A kết thúc; việc kế: Đợt B.
- ☐ **Đợt B (Sonnet):** danh mục Đơn vị · chuẩn hóa đơn vị trùng · import nhân sự Excel · ☐ Opus review · ☐ triển khai
- ☐ **Đợt C:** C1 biểu đồ tiến độ hằng ngày 30 ngày (Sonnet) → C2 giao diện điện thoại (Antigravity) · ☐ Opus review (kiểm khổ 375px) · ☐ triển khai

0. **[Sonnet XONG chức năng, Antigravity XONG giao diện 10/11/2026, mock 261/0, giao diện 381/0, chưa triển khai → việc kế: Opus review tổng thể → triển khai] DASHBOARD CHIA TAB CON + THỐNG KÊ NHÂN SỰ (10/11/2026, chủ dự án yêu cầu)** — phiếu `docs/prompts/PROMPT_SONNET_DASHBOARD_TAB.md`. 5 tab: Tổng quan · Theo ngày · Ca – Nhóm · Nhân sự (mới, chọn khoảng ngày, action `thongKeNhanSu`) · Nhật ký nhập. Luồng: ☑ Sonnet (chức năng) · ☑ Antigravity (giao diện) · ☑ Opus review tổng thể (10/11/2026, `79532f5..77c73fa`): **ĐẠT – GO triển khai sau 1 delta nhỏ** · ☐ Sonnet sửa delta N1 · ☐ triển khai · ☐ chủ dự án thử.
   - Opus đã kiểm: `dash_` chỉ tách hàm dùng chung (`nhatKyRows_`, `thanhVienBanGhi_`, `congCaNhan_`), so từng dòng logic giữ nguyên; `thongKeNhanSu_` dùng đúng quy tắc chia công/`dv`/loại hủy-THỬ NGHIỆM-TN-xx, khoảng 1 ngày khớp `canhan` (mock). Mock 261/0, giao diện 381/0. Vẽ thử cả 5 tab trong trình duyệt với dữ liệu thật từ mock: không lỗi JS.
   - "gomThu dao động giữa các lần chạy mock": **không phải lỗi** — `taoMau_` sinh số ngẫu nhiên (`Math.random`), so sánh trong cùng một lần chạy vẫn nhất quán.
   - **N1 (ĐÃ SỬA 10/11/2026, Sonnet):** tab Nhân sự thẻ "TỔNG SẢN LƯỢNG … tờ" và "NĂNG SUẤT TB … tờ/h", cột "TỜ/GIỜ" đang **cộng Scan + Tách + OCR** (một tờ Scan rồi Tách tính 2 lần) → dễ hiểu nhầm là số tờ đã số hóa. Sửa nhãn rõ: thẻ tổng hiện **3 số theo khâu (Scan / Tách / OCR)** thay cho một số cộng; năng suất ghi rõ **"tờ (cả 3 khâu) / giờ-người"** ở thẻ và tiêu đề cột. Không đổi cách tính.
   - **Chờ chủ dự án (không chặn):** xếp hạng nhân sự theo tổng 3 khâu (hiện tại) hay theo tờ Scan.
   - Thử với số liệu thật: chủ dự án xem tab Nhân sự "Từ đầu dự án" sau khi triển khai.
1. **Chuẩn hóa quy trình báo cáo** (mục 2a) — giao Sonnet bằng prompt trong `docs/prompts/`.
2. Triển khai F-QL-10 lên Apps Script và thử thật (mục 2b).
3. ~~Viết `tools/kiem_tra_giao_dien.js`~~ — xong (P0).
4. Kiểm thử trên Sheet thật theo bảng kiểm tra cuối `docs/CHUC_NANG.md` với 4 tài khoản.
5. Chuyển link phụ `…NIQ` lên phiên bản mới hoặc ngừng dùng.

## 4. Lỗi / chức năng bị mất đã biết (chưa sửa)
> Mỗi dòng: mô tả · mã chức năng (F-xx) · phát hiện ngày nào · ai phát hiện.

- **ĐANG GIAO SONNET (delta, L2) · Dashboard "Từng ca": "nhận X hộp" lệch giữa thành viên cùng nhóm** (ca Sáng 10/11: Nhóm 1 Trần Nhật Tân 2 hộp, Trần Quang Phát 1 hộp) · F-DB-06 · 10/11/2026 · chủ dự án. Nguyên nhân (Opus, `Code.gs` `dash_` khối TỪNG CA): mỗi dòng `NHAN_NHOM` cộng `nhanHop++` cho từng người trong `ThanhVien` **lưu lúc gửi**; dòng nhận khi nhóm chưa đủ người (hoặc người được thêm vào nhóm sau) chỉ cộng cho người có mặt lúc đó. Hộp nhận theo nhóm là của **nhóm**, không chia theo người. Sửa: đếm hộp nhận theo nhóm (số `MaHop` khác nhau) và hiện ở dòng tiêu đề nhóm; dòng từng người chỉ hiện "nhận X hộp" khi là cá nhân. Không sửa dữ liệu thật.

- **ĐÃ SỬA TRONG MÃ (10/11/2026, Sonnet; mock 245/0; triển khai bằng skill ngay sau đó) · phần mã của dòng dưới, chủ dự án vẫn dọn dữ liệu PhanCa thật.** Dashboard còn người ở ca Sáng/Chiều 09/11 sau khi xóa dữ liệu thử · F-DB-03, F-DB-06 · 10/11/2026 · chủ dự án.** Nguyên nhân (Opus): "Nhân sự" và khu "Từng ca" lấy từ `PhanCa` (danh sách vào ca), không từ báo cáo; dữ liệu thử đã xóa bản ghi nhưng còn dòng `PhanCa` của người giả `TN-07..11` và của Trần Nhật Tân (ca Sáng, Chiều). **Dọn dữ liệu (chủ dự án, không cần sửa mã):** ADMIN → Dữ liệu → "Xóa dữ liệu thử nghiệm" (xóa cả `PhanCa`/`NhanSu` của `TN-xx`); Quản lý ca → ngày 09/11, ca Sáng rồi ca Chiều → "Bỏ khỏi ca" Trần Nhật Tân. **Sửa mã (Sonnet):** `dash_` loại người `TN-xx` khỏi "Nhân sự"/`caNguoi` khi không `gomThu` (cùng quy tắc với bản ghi THỬ NGHIỆM).
- **Opus GO triển khai (10/11/2026, theo phiếu giao việc của chủ dự án) cho commit sửa F-DB-01/F-DB-06 (mock 245/0).**
- **ĐÃ LÀM LẠI (10/11/2026, Sonnet; mock 250/0, giao diện 356/0): `khoangNgay` + một dòng khoảng ngày; Opus GO theo phiếu; triển khai ngay sau đó.** (Nội dung yêu cầu:) "Ngày có dữ liệu" · F-DB-01 · 10/11/2026 · chủ dự án.** Bản 19 (Sonnet làm đúng yêu cầu cũ của Opus: 7 nút ngày, một hàng) **không đạt ý chủ dự án**: vẫn là dãy nút ngày, lâu dài không gọn. **Quyết định chủ dự án (10/11/2026): bỏ dãy nút ngày, chỉ ghi KHOẢNG NGÀY.** Opus chốt cách làm:
  - `dash_` trả thêm `khoangNgay: { tu, den, soNgay }` = ngày đầu và ngày cuối có dữ liệu (bản ghi báo cáo còn hiệu lực, không tính THỬ NGHIỆM khi không `gomThu`, kể cả số đầu kỳ `DauKy` có `Ngay`), `den` ≤ hôm nay; `soNgay` = số ngày khác nhau có dữ liệu.
  - Giao diện `#dNgayCo` thay dãy nút bằng **một dòng**: `Có dữ liệu: 02/11/2026 → 09/11/2026 · 8 ngày`; hai ngày đầu/cuối bấm được để nhảy tới; ô lịch `#dNgay` đặt `min = tu`. Bỏ biến cộng dồn `NGAY_CO` và các nút `.chip-ngay`. Giữ id `#dNgayCo`, `#dNgay`, nút ◀ ▶ / Hôm nay.
  - Giao Sonnet (nhỏ, không qua Antigravity); kiểm tra đạt thì triển khai (Opus GO).

- **LỖI DỮ LIỆU F-HT-03 (mã hộp `02.01.85` bị đổi thành ngày) · 10/11/2026 · ĐÃ SỬA VÀ TRIỂN KHAI phiên bản 18** (Sonnet): `appendMany_` đặt `@`; `read_` đọc đúng dữ liệu hỏng; `suaMaHopNgay()` sửa dữ liệu cũ. Mock 242/0. **Đã chạy `suaMaHopNgay` trên Sheet thật (09/11/2026 23:35, chủ dự án): sửa 2 ô (NhatKy dòng 5 → `02.01.84`, dòng 8 → `02.01.85`), có sao lưu và log; đã kiểm lại, không còn ô Date.** (Phần hướng dẫn cũ:) chạy `suaMaHopNgay` một lần trong trình soạn (hướng dẫn 3 dòng ở `HUONG_DAN_TRIEN_KHAI.md` mục D) để sửa các ô đã hỏng trên Sheet thật; số Nhận/Tồn trên Dashboard đã đúng ngay sau khi triển khai nhờ `read_`.
- **Không phải lỗi:** cột "Giờ" ở bảng Chi tiết là **giờ bấm gửi**, không phải giờ của ca. Nhập hộ lúc 03:49 cho "Ca Tối" là đúng (nhập bù ca đã qua).

- **KHÔNG PHẢI LỖI (ghi để khỏi điều tra lại):** 09/11/2026 23:22 chủ dự án đăng nhập tổ viên không thấy "Vào ca"/form báo cáo → do ngoài giờ (ca Tối đóng nhập 22:00; ca mở sớm 15', đóng sau giờ kết thúc 60'). Opus đã thử mã repo bằng mock trong trình duyệt: bảng nhiều hộp hiện bình thường, không lỗi JS. **Thử ngoài giờ:** dùng Tổ trưởng/ADMIN → Quản lý ca → **Nhập hộ** (không giới hạn giờ, cùng bảng nhiều hộp, cùng `ghiLo`). Thử luồng tổ viên trong giờ ca thật (từ 07:15). **Không gỡ khóa giờ trên bản đang chạy.** Dữ liệu thử: ADMIN hủy ở tab Dữ liệu sau khi thử.

- Tick "Scan kèm Tách" thiếu ở form Nhập hộ · F-QL-10 · 09/11/2026 · chủ dự án báo → **đã sửa trong mã, chưa triển khai**.

## 5. Quyết định đang chờ chủ dự án
- **Chuẩn hóa báo cáo Q8:** Mã hồ sơ có bắt buộc khi hộp chưa xong không? (Đợt 1 mặc định: không bắt buộc, hiển thị nổi bật, nhắc khi trống.)
- Hộp đã trả có còn được Tách file không.
- Số 571 trang "Tách file" ngày 05/11 ca tối (đã chuyển sang Tách) — cần Lãnh đạo xác nhận.
- Các file `PROMPT_*.md` ở gốc đã **cũ** (ví dụ ghi Quản lý chỉ có 2 khâu) — giữ làm lưu trữ hay chuyển vào `docs/prompts-cu/`.

---

## Mẫu cập nhật nhanh khi dừng giữa chừng
```
Cập nhật lúc: <ngày giờ> — <Opus | Sonnet | Antigravity | chủ dự án>
Đang làm: <việc>, mã chức năng <F-xx>
File đã sửa: <danh sách>   (đã commit? có/không — commit <mã>)
Đã xong: <các bước>
Còn lại: <các bước>
Mock: <x đạt / y lỗi>
Lưu ý cho phiên sau: <điều không được quên>
```
