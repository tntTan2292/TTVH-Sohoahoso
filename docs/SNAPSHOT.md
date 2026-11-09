# SNAPSHOT – Đang làm tới đâu

> **Mỗi phiên làm việc (người hay AI) đọc file này ĐẦU TIÊN và CẬP NHẬT nó TRƯỚC KHI DỪNG**, kể cả khi dừng giữa chừng.
> Mở chat mới mà không biết đang làm gì → dán nội dung file này vào, hoặc nói "đọc `docs/SNAPSHOT.md` rồi làm tiếp".
> Giữ ngắn gọn: chỉ trạng thái hiện tại. Lịch sử đã xong chuyển sang `CHANGELOG.md`.

---

## 1. Trạng thái hệ thống
| Mục | Giá trị |
|---|---|
| Cập nhật lúc | 09/11/2026 — Antigravity: làm đẹp giao diện bảng nhiều hộp Đợt 1 (F-BC-18/19, F-QL-11) |
| Nhánh / commit | `main`, đã đẩy lên GitHub `tntTan2292/TTVH-Sohoahoso` (xem `git log -1`) |
| Bản đang chạy | Apps Script **phiên bản 20** (10/11/2026 00:02) trên link chính `…MlRA/exec` = commit `d568321` (F-DB-01 khoảng ngày; trước đó bản 19 = Dashboard loại TN-xx). Phiên bản trước: 19 (`60189ab`). Link phụ `…NIQ/exec` không đụng |
| Mã trên Apps Script khớp repo? | **Có** (băm SHA-256 `Code.gs`, `Index.html` khớp `d568321` sau khi lưu và tải lại trang) |
| Mock | `node tools/test_mock.js` → **261 đạt, 0 lỗi**; `node tools/kiem_tra_giao_dien.js` → 0 lỗi |
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
0. **[Sonnet XONG chức năng 10/11/2026, mock 261/0, giao diện 381/0, chưa triển khai; đã giao Antigravity thiết kế tự do: `docs/prompts/PROMPT_ANTIGRAVITY_DASHBOARD_TAB.md` → rồi Opus review tổng thể → triển khai] DASHBOARD CHIA TAB CON + THỐNG KÊ NHÂN SỰ (10/11/2026, chủ dự án yêu cầu)** — phiếu `docs/prompts/PROMPT_SONNET_DASHBOARD_TAB.md`. 5 tab: Tổng quan · Theo ngày · Ca – Nhóm · Nhân sự (mới, chọn khoảng ngày, action `thongKeNhanSu`) · Nhật ký nhập. Luồng: ☐ Sonnet (chức năng, gồm luôn F-DB-01 khoảng ngày `d568321` chưa triển khai) · ☐ Sonnet viết prompt Antigravity · ☐ Antigravity làm đẹp · ☐ Opus review tổng thể · ☐ triển khai · ☐ chủ dự án thử.
1. **Chuẩn hóa quy trình báo cáo** (mục 2a) — giao Sonnet bằng prompt trong `docs/prompts/`.
2. Triển khai F-QL-10 lên Apps Script và thử thật (mục 2b).
3. ~~Viết `tools/kiem_tra_giao_dien.js`~~ — xong (P0).
4. Kiểm thử trên Sheet thật theo bảng kiểm tra cuối `docs/CHUC_NANG.md` với 4 tài khoản.
5. Chuyển link phụ `…NIQ` lên phiên bản mới hoặc ngừng dùng.

## 4. Lỗi / chức năng bị mất đã biết (chưa sửa)
> Mỗi dòng: mô tả · mã chức năng (F-xx) · phát hiện ngày nào · ai phát hiện.

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
