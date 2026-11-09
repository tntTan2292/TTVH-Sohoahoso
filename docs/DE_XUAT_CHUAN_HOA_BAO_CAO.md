# Đề xuất chuẩn hóa quy trình báo cáo (Giai đoạn 1 – CHƯA SỬA MÃ)

Ngày viết: 09/11/2026 · Căn cứ: `apps-script/Code.gs`, `apps-script/Index.html` ở commit `ab68e98`, `docs/CHUC_NANG.md`, `docs/API.md`.
Trạng thái: **chờ chủ dự án duyệt từng đề xuất.** Chưa có dòng mã nào bị sửa.

Quy ước đếm: **ô** = mỗi trường phải gõ/chạm để điền (kể cả tick "Hết hộp"); **gửi** = bấm nút Gửi; **confirm** = hộp thoại `confirm()`; **ghi** = một lần gọi action ghi (mỗi lần lấy khóa `withLock_`, đọc lại NhatKy, ghi log).

---

## 1. Kiểm chứng D1–D10 trong mã

| # | Kết luận | Bằng chứng |
|---|---|---|
| D1 | **Đúng.** Scan/Tách/OCR dùng chung một khối form, mỗi lần gõ lại mã hộp, số hồ sơ, trang/tờ, tick hết hộp | `Index.html` `buildForm` 1495–1506; `send` 1551–1553 |
| D2 | **Đúng.** `hopGoiY_` chỉ trả mảng mã đã sắp xếp, không có số liệu | `Code.gs` 561–572 |
| D3 | **Đúng.** Chặn cứng 1 mã/lần cho Scan/Tách/OCR; mỗi lần gửi 1 `confirm` + 1 `ghi` + `nhatKy` + (TT/TP) `dashboard` | `Code.gs` 458; `Index.html` 1555, 1576 (`loadNK`, `renderWidget`) |
| D4 | **Đúng.** NHAN rồi NHAN_NHOM cùng mã. `hopGoiY_` đã biết danh sách (NHAN chưa NHAN_NHOM) nhưng giao diện vẫn bắt dán lại | `Code.gs` 569; `Index.html` 1510 (textarea) |
| D5 | **Đúng.** Hai ô, server chỉ cần 1 trong 2 (`trang < 1 && to < 1`); `dv = to > 0 ? to : trang` | `Code.gs` 462, 602, 884; `Index.html` 1499–1500 |
| D6 | **Đúng.** Bắt buộc `hs ≥ 1` ở cả 3 khâu | `Code.gs` 461 |
| D7 | **Đúng.** TRA là textarea dán mã; `hopGoiY_('TRA')` trả mọi hộp NHAN chưa TRA (chưa lọc "đã Tách xong") | `Code.gs` 570, 477–478; `Index.html` 1510 |
| D8 | **Đúng.** Không có action nào trả số đã báo của một hộp; ca sau gõ lại từ đầu | không có trong `route_` |
| D9 | **Đúng.** `KEM_TACH` là biến JS, mất khi tải lại trang; chỉ Scan→Tách | `Index.html` 1464, 1505, 1541, 1554 |
| D10 | **Đúng, nặng hơn dự đoán.** `renderHo` (1737–1790) có form, `send`, kèm-Tách riêng. **Ngoài ra `renderHo` không có datalist/`hopGoiY`** (ô `#hoHop` ở 1757 không có `list=`) và không có `confirm` | `Index.html` 1757 |

### Điểm phát hiện thêm
| # | Điểm | Bằng chứng |
|---|---|---|
| E1 | Mỗi lần đổi khâu (`buildForm`) gọi lại `hopGoiY` — một lượt máy chủ chỉ để lấy danh sách gợi ý | `Index.html` 1542 |
| E2 | Mỗi `ghi` đọc lại toàn bộ NhatKy và `has()` quét tuyến tính cho từng hộp (O(số dòng × số hộp)) + `log_` đọc lại NhanSu. Quan trọng khi làm ghi theo lô | `Code.gs` 452–454, 180–189 |
| E3 | Sau mỗi lần gửi xóa hết ô (kể cả số hồ sơ, mã hồ sơ), người dùng gõ lại cho hộp kế tiếp | `Index.html` 1574 |
| E4 | `confirm()` trên điện thoại là hộp thoại hệ thống, chậm và dễ bấm nhầm Hủy; hiện 1 lần cho mỗi hộp mỗi khâu | `Index.html` 1555, 1559 |
| E5 | Ô "Mã hồ sơ" (`fMaHs`) hiện ở cả 3 khâu dù không bắt buộc, thêm một ô vô nghĩa cho Tách/OCR | `Index.html` 1506 |
| E6 | `dash_` dùng `NHAN_NHOM` để tính "nhóm đã báo cáo" và nhận theo nhóm (`nn`, `daBCCa`); bỏ NHAN_NHOM sẽ ảnh hưởng khu CUỐI CA | `Code.gs` 907, 919 |

---

## 2. Bảng đếm thao tác HIỆN TẠI

Kịch bản: 1 cặp, 1 ca, **5 hộp**, mỗi hộp Nhận hộp → Scan → Tách → OCR. Một người của cặp báo cáo cho cả cặp (tổ viên, không thấy Dashboard nên không gọi `dashboard`). Giả định mã hộp chọn từ gợi ý/dán nhanh (tính 1 ô), số Scan = Tách = OCR, không có trang lỗi (nếu có thì Scan +1 ô/hộp).

| Khâu | Ô | Gửi | Confirm | Ghi | Chạm đổi khâu | Gọi đọc (`hopGoiY` + `nhatKy`) |
|---|---|---|---|---|---|---|
| Nhận hộp (dán 5 mã một lần) | 1 | 1 | 1 | 1 | 1 | 1 + 1 |
| Scan (5 lần × [mã, hồ sơ, trang/tờ, hết hộp] + ô "Mã hồ sơ" bỏ trống) | 20 | 5 | 5 | 5 | 1 | 1 + 5 |
| Tách (như Scan) | 20 | 5 | 5 | 5 | 1 | 1 + 5 |
| OCR (như Scan) | 20 | 5 | 5 | 5 | 1 | 1 + 5 |
| **Tổng** | **61** | **16** | **16** | **16** | **4** | **4 + 16 = 20** |

Biến thể hiện có: tick "Scan kèm Tách" (F-BC-08): bỏ 20 ô + 5 gửi + 5 confirm của Tách, nhưng vẫn **2 lần ghi cho mỗi hộp** → tổng 41 ô, 11 gửi, 11 confirm, 16 ghi.
Với trang lỗi/scan lại: +5 ô ở Scan. Tab Báo cáo của TT/TP: mỗi gửi thêm 1 lần `dashboard`.

Tổng thao tác người dùng ≈ 61 ô + 16 gửi + 16 confirm + 4 đổi khâu = **97 chạm**, và 16 lần chờ máy chủ (mỗi lần chờ khóa + đọc cả NhatKy).

---

## 3. Danh sách đề xuất

Thứ tự khuyến nghị làm: **P1 → P2 → P4 → P5 → P6 → P3 → P7a**. P1 là nền; P2 là mục có lợi nhất.

### P1 – Một hàm vẽ form chung cho Báo cáo và Nhập hộ  (giải quyết D10, E5)
- **Người dùng thấy:** không đổi gì ngay; Nhập hộ **có thêm** gợi ý mã hộp (hiện đang thiếu) và mọi cải tiến sau tự có ở cả hai nơi.
- **Mã:** chỉ `Index.html`. Tạo `renderReportForm(opts)` với tham số `{ prefix:'f'|'ho', boSung, nguoiHo, steps, onSend }`. **Giữ nguyên mọi `id` hiện có** (`fHop`…, `hoHop`…) bằng tham số `prefix`; `buildForm` và `renderHo` gọi hàm chung. Không đổi `Code.gs`.
- **Ảnh hưởng dash_/số cũ:** không.
- **F-xx:** F-BC-02..05, F-BC-08, F-QL-08, F-QL-10 (phải đi lại toàn bộ).
- **Rủi ro:** đây là chỗ hay mất chức năng nhất của dự án → làm **từng bước** (chuyển từng khối, không viết lại file), thêm `tools/kiem_tra_giao_dien.js` kiểm các `id` còn đủ trước khi làm. Độ lớn: **M**.

### P2 – Gửi nhiều hộp một lần: action ghi theo lô `ghiLo`  (giải quyết D3, E3, E4; nền cho D1)
- **Người dùng thấy:** ở khâu Scan/Tách/OCR hiện **bảng nhiều dòng** (mỗi dòng 1 hộp: mã, hồ sơ, tờ, tick hết hộp). Nút "+ Thêm hộp"; dòng mới tự mang số hồ sơ của dòng trước. **Một** nút Gửi, **một** confirm tóm tắt ("5 hộp Scan, tổng 1.240 tờ, 3 hộp xong") rồi nhận kết quả theo từng hộp (✔ / ⚠ / ✖ lý do).
- **Mã:** `Code.gs`: thêm action `ghiLo` (không vào `READ_ACTIONS` → chạy trong khóa, ghi `log_`). Payload `{ ca, [boSung, ngay, nhom, nguoiHo], muc:[{ buoc, hop, soHoSo, soTrang, soTo, trangLoi, hetHop, maHoSo }], ghiChu }`. Cài đặt: duyệt từng mục **gọi lại `ghi_(u, mục)`** trong try/catch → kế thừa nguyên vẹn phân quyền, giờ ca, ca chốt, mã hợp lệ, số không âm, hộp đã xong, điều kiện Trả, ThanhVien, nhập hộ (không chép lại logic). Trả `{ ketQua:[{ hop, buoc, ok, added, warnings, err }], added, warnings }`. `ghi_` cũ giữ nguyên (giao diện cũ vẫn gọi được).
  - Thứ tự trong một hộp: Scan → Tách → OCR; **hộp có khâu lỗi thì bỏ các khâu sau của hộp đó** (giống hành vi "kèm Tách" hiện nay: Scan lỗi không ghi Tách; Tách lỗi vẫn giữ Scan). Các hộp khác không bị ảnh hưởng. **Không** hủy toàn lô nếu một hộp lỗi (cần chủ dự án xác nhận, xem Q4).
  - Hiệu năng (E2): `ghi_` mỗi mục đọc lại sheet (`append_` xóa memo). 5 hộp × 3 khâu = 15 lần ≈ chấp nhận được, nhưng giới hạn trên phải do chủ dự án chọn (Q4). Có thể tối ưu sau bằng cách tách `ghi_` thành "kiểm tra" + "ghi" dùng chung `rows` (độ lớn M, rủi ro cao hơn — chỉ làm nếu đo thấy chậm).
- **Ảnh hưởng dash_/số cũ:** không đổi cột; mỗi khâu mỗi hộp vẫn 1 dòng NhatKy. Kiểm thử: chạy cùng dữ liệu bằng chuỗi `ghi` cũ và bằng `ghiLo`, so `dash_` giống hệt.
- **F-xx:** F-BC-02..06, F-BC-10, F-BC-16, F-HT-01; thêm mã mới F-BC-18 (ghi theo lô). API.md: thêm action `ghiLo`.
- **Rủi ro:** giao diện bảng nhiều dòng ở 360px (nên dùng thẻ xếp dọc, không dùng `<table>`); timeout khóa 25 giây nếu lô quá lớn; người dùng gửi lô rồi mất mạng → gửi lại bị chặn bởi "hộp đã xong" nhưng hộp chưa tick xong sẽ **ghi đôi** (cần chống: mã yêu cầu `idLo` hoặc kiểm tra trùng thời điểm — xem rủi ro bên dưới). Độ lớn: **L**.

### P3 – Chọn nhiều khâu một lần (Scan + Tách + OCR) với cùng số liệu  (giải quyết D1, D9)
- **Người dùng thấy:** trong bảng của P2, mỗi dòng/hộp (hoặc cả lô) có ba ô chọn **☑ Scan ☑ Tách ☑ OCR**. Chọn xong chỉ gõ số một lần. Lựa chọn **được nhớ** giữa các lần mở (localStorage bọc try/catch). Có thể sửa số riêng cho từng khâu (OCR hay lệch vì chỉ xử lý phần đã tách).
- **Mã:** `Index.html` sinh `muc[]` cho `ghiLo` (cùng một hộp → 1–3 mục). `Code.gs` không đổi thêm. Tổng quát hóa `KEM_TACH` (giữ `#fKemTach`, `#hoKemTach`, `KEM_TACH` còn tác dụng như cũ cho tới khi được thay thế; không xóa khi chưa được duyệt).
- **Ảnh hưởng dash_:** thêm số liệu vào các khâu **chỉ khi người dùng tick**. **Rủi ro nghiệp vụ:** nếu tick OCR trong khi OCR chưa thực sự làm xong, số OCR Dashboard bị thổi phồng. Cần chủ dự án quyết cho phép tick OCR cùng Scan hay chỉ "Scan + Tách" (Q-phạm vi, xem Q3).
- **F-xx:** F-BC-08, F-QL-10 (được thay bằng cơ chế chung, ghi chú trong CHUC_NANG). Độ lớn: **M** (làm sau P2).

### P4 – Gộp "Số trang" và "Số tờ" thành một ô "Số tờ"  (giải quyết D5)
- **Người dùng thấy:** chỉ một ô "Số tờ". (Tùy chọn Q2: vẫn cho nhập "Số trang" qua nút "Khác?" hoặc bỏ hẳn.)
- **Mã:** `Index.html` — gửi `soTo = giá trị` và `soTrang = giá trị` (cùng số) để mọi cột/`log_`/lịch sử cũ vẫn có đủ hai trường; **không đổi `Code.gs`**. Lý do chọn gửi cả hai: `dash_`/`lichSu_` dùng `to > 0 ? to : trang`, gửi cùng số không làm `dv` đổi; các cột `scanTrang`, `scanTo` vẫn có giá trị cho bất kỳ báo cáo nào đọc chúng.
  - Lưu ý (cần xác nhận): dữ liệu cũ nhập "chỉ trang" vẫn đọc đúng nhờ `dv`; bản ghi mới có `SoTrang = SoTo`. Đây là thay đổi ý nghĩa của cột `SoTrang` (từ "số trang nhập" sang "bằng số tờ") nhưng khớp quy ước 1 trang = 1 tờ.
  - `editDL` (sửa bản ghi của ADMIN) giữ nguyên hai ô, không đổi.
- **Ảnh hưởng dash_:** không (so sánh `dash_` trước/sau trên cùng bộ dữ liệu). **F-xx:** F-BC-05. Độ lớn: **S**.

### P5 – Số hồ sơ ở Tách/OCR tự lấy từ Scan  (giải quyết D6, D2)
- **Người dùng thấy:** ở Tách/OCR ô "Số hồ sơ" và "Số tờ" **đã điền sẵn** từ khâu trước của hộp đó, có thể sửa. (Nếu Q3 chọn "tự lấy", ô số hồ sơ có thể ẩn.)
- **Mã:** `Code.gs`: action đọc mới `hopCuaToi` (xem P6) trả `{ hop, scan:{hs,to,het}, tach:{…}, ocr:{…} }` lấy từ NhatKy (cộng các dòng chưa hủy của hộp ở từng khâu). `ghi_` **không đổi**. Nếu Q3 = "server tự lấy": `ghiLo` thêm bước điền `soHoSo` từ Scan khi mục để trống rồi mới gọi `ghi_` (kiểm `hs < 1` giữ nguyên).
- **Ảnh hưởng dash_:** không. **F-xx:** F-BC-04, F-BC-05. Độ lớn: **S** khi dùng sẵn P6.

### P6 – "Hộp của tôi" trong ca + chọn hộp bằng ô tick  (giải quyết D2, D4, D7, D8, E1)
- **Người dùng thấy:** thay ô dán mã bằng **danh sách thẻ hộp** của ca: mỗi hộp hiện đang ở khâu nào, đã báo bao nhiêu tờ ở mỗi khâu, hộp dở ca trước (D8) có nhãn "đã báo X tờ". Chạm hộp → vào form khâu kế tiếp điền sẵn số liệu (P5). Ở NHAN_NHOM và TRA: danh sách ô tick, có **"Chọn tất cả"**; TRA chỉ liệt kê hộp đủ điều kiện (đã Tách xong), phần còn lại hiện mờ kèm lý do.
- **Mã:** `Code.gs`: action đọc `hopCuaToi` (thêm vào `READ_ACTIONS`, cho mọi vai trò trừ LANHDAO; thêm vào danh sách `route_`). Có thể thay lời gọi `hopGoiY` ở mỗi `buildForm` bằng 1 lần `hopCuaToi` lúc mở tab (giảm E1). `hopGoiY` giữ nguyên để giao diện cũ gọi được. `Index.html`: `buildForm`/hàm chung của P1. Việc ghi vẫn qua `ghiLo`/`ghi`.
- **Ảnh hưởng dash_:** không (chỉ đọc). **F-xx:** F-BC-04, F-BC-07, F-BC-10. F-BC-18 mới (hộp của tôi) .
- **Rủi ro:** phạm vi "hộp của tôi" khi nhóm đổi giữa ca; hộp do người khác báo dở. Cần định nghĩa rõ: hộp **trong ngày/ca đang mở** mà nhóm/cá nhân đã nhận (`ThanhVien` chứa mình), cộng hộp còn dở từ ca trước (Q5). Độ lớn: **M–L**.

### P7 – Bỏ bước NHAN_NHOM hay chỉ làm nhanh hơn  (giải quyết D4)
Hai lựa chọn, **chưa chọn** — xem Q1:
- **7a (làm nhanh, rủi ro thấp):** giữ NHAN_NHOM; nhờ P6 chỉ chạm tick các hộp + 1 nút ("Nhận 5 hộp"). Không đổi dữ liệu.
- **7b (bỏ hẳn):** TT/TP giao hộp cho nhóm khi NHAN (hoặc tổ viên Scan thẳng từ danh sách NHAN). Phải sửa `hopGoiY_`/`has('NHAN_NHOM')` (Code.gs 466, 566, 569), và **`dash_`** (907, 919: "nhóm đã báo cáo"/nhận theo nhóm) và mất dữ liệu "ai nhận hộp nào". Rủi ro **cao**, thay đổi ý nghĩa số liệu Dashboard → không tự quyết.
- **F-xx:** F-BC-07, F-BC-10, F-DB-04. Độ lớn: 7a **S**, 7b **L**.

---

## 4. Bảng đếm thao tác SAU khi áp dụng (cùng kịch bản)

Giả định áp dụng P1–P6 và P7a; số Scan = Tách = OCR, nhập ở bảng nhiều dòng; hết hộp tick một lần/hộp.

| Khâu | Ô | Gửi | Confirm | Ghi (lần gọi) | Gọi đọc |
|---|---|---|---|---|---|
| Nhận hộp: tick "Chọn tất cả" 5 hộp | 1 (chạm) | 1 | 1 | 1 | 1 (`hopCuaToi`) |
| Báo cáo 5 hộp × (Scan+Tách+OCR): mỗi hộp gõ 2 ô (số hồ sơ, số tờ) + 1 tick hết hộp; tick 3 khâu chọn 1 lần cho cả lô | 5×3 + 3 = 18 | 1 | 1 | **1** (`ghiLo`, 15 dòng NhatKy) | 1 |
| **Tổng** | **19** | **2** | **2** | **2** | **2–3** |

Với số hồ sơ mặc định tự điền (cùng hồ sơ/hộp, P5): còn 5×2+3 = 13 ô.
So sánh: **61 ô → 19 ô (≈ −69%)**, 16 gửi → 2, 16 confirm → 2, 16 ghi → 2, 20 lần gọi đọc → 2–3. Nếu chỉ làm P2 (không P3): 61 → ~46 ô nhưng gửi/confirm/ghi vẫn giảm xuống 4 mỗi loại (3 khâu + nhận).
Ước tính, **chưa đo trên Apps Script thật**: thời gian chờ một `ghiLo` 15 mục lớn hơn 1 `ghi` (mỗi mục đọc lại sheet), nhưng nhỏ hơn 15 lần chờ khóa riêng rẽ.

---

## 5. Rủi ro chung và cách kiểm soát
1. **Ghi đôi khi mạng chập chờn:** gửi lô rồi mất kết nối, người dùng bấm lại. Với hộp đã tick xong, `has(buoc,h,true)` chặn lại. Hộp **chưa xong** (dở ca) sẽ bị ghi thêm một dòng nữa. Đề xuất: `ghiLo` nhận `idLo` do giao diện sinh, server từ chối `idLo` đã dùng trong vòng 10 phút (CacheService). Cần duyệt vì thêm một cơ chế mới.
2. **Số liệu Dashboard:** mỗi P ghi phải có kiểm thử so `dash_` trước/sau trên cùng dữ liệu (cả `scanDV`, `scanHop`, `caNguoi`, `nhom`, `canhan`, `chiTiet`).
3. **Mất chức năng giao diện:** làm P1 trước và dựng `tools/kiem_tra_giao_dien.js` (việc số 3 trong SNAPSHOT) để kiểm `id` và `call('…')` mỗi lần.
4. **Tương thích:** giữ `ghi`, `hopGoiY`, `#fKemTach`, `#hoKemTach`; bản đang triển khai gọi được.
5. **Chưa xác minh trên Apps Script thật:** khóa 25 giây với lô lớn, độ trễ `hopCuaToi` khi NhatKy hàng nghìn dòng, hiển thị ở 360px trên máy thật.

---

## 6. Câu hỏi chủ dự án cần quyết

| # | Câu hỏi | Gợi ý của người viết (không bắt buộc) |
|---|---|---|
| Q1 | **Bỏ hẳn NHAN_NHOM** (tổ viên nhận tự động khi TT/TP giao) hay chỉ làm nhanh hơn (7a)? Bỏ hẳn thì mất dữ liệu "nhóm nào nhận hộp nào" và phải sửa `dash_` ở "nhóm đã báo cáo". | 7a (chọn tick + một nút) |
| Q2 | **Bỏ ô "Số trang"** khỏi giao diện (chỉ còn "Số tờ")? Giữ lại làm trường phụ hay xóa hẳn? | Bỏ khỏi giao diện, vẫn lưu `SoTrang = SoTo` |
| Q3 | **Số hồ sơ ở Tách/OCR:** (a) điền sẵn từ Scan, người dùng vẫn thấy và sửa được; (b) server tự lấy, giao diện ẩn ô; (c) vẫn bắt nhập. Và **có cho tick OCR chung với Scan** không (rủi ro thổi phồng số OCR)? | (a); OCR không tick chung mặc định, người dùng chủ động bật |
| Q4 | **Giới hạn một lần gửi:** tối đa bao nhiêu hộp × bao nhiêu khâu (hiện chốt 1 hộp/khâu; "Nhận" tối đa 200 mã)? Lô có lỗi ở một hộp thì **ghi các hộp còn lại** (đề xuất) hay **hủy cả lô**? | 10 hộp × 3 khâu = 30 dòng/lần; ghi các hộp còn lại |
| Q5 | **Hộp làm dở (chưa tick hết hộp) ở ca trước:** ca sau báo tiếp thế nào? (a) nhập **phần làm thêm** (cộng dồn, đúng cách `dash_` đang cộng); (b) nhập **tổng lũy kế** rồi máy tự trừ ra phần thêm. Hộp dở thuộc về nhóm nào nếu nhóm ca sau khác? | (a), hiện rõ "ca trước đã báo X tờ" |
| Q6 | Chấp nhận cơ chế chống ghi đôi `idLo` (mục 5.1)? | Có |
| Q7 | Thứ tự làm và đề xuất nào duyệt / hoãn / bỏ (P1–P7)? | P1→P2→P4→P5→P6→P3→P7a |

---

## 7. Opus review (09/11/2026)

**Kết luận: ĐẠT CÓ ĐIỀU KIỆN.** Phân tích D1–D10, E1–E6 đúng với mã (đã kiểm lại `ghi_`, `hopGoiY_`, `dash_`, `append_`, `withLock_`). Hướng P2 (gọi lại `ghi_` cho từng mục) là đúng: giữ nguyên mọi kiểm tra, không đổi cột, `dash_` không đổi. Có 4 chỗ phải sửa trước khi làm:

| # | Mức | Vấn đề | Yêu cầu |
|---|---|---|---|
| R1 | **Chặn** | P2 hiệu năng: `NhatKy` **không** nằm trong `CACHE_TABS`, và `append_` gọi `memoClear_('NhatKy')` → mỗi mục trong lô đọc lại **toàn bộ** sheet. Lô 30 mục × vài nghìn dòng chạy trong một khóa, trong khi người khác chỉ chờ khóa 25 giây (`withLock_`) → báo "hệ thống bận" hàng loạt giữa ca. Đề xuất ghi "tối ưu sau nếu đo thấy chậm" là không đủ. | Trong P2: khi đang chạy `ghiLo`, `append_` **thêm dòng mới vào `MEMO_.NhatKy`** thay vì xóa (hoặc cờ tương đương), để cả lô chỉ đọc sheet **1 lần**. Mock phải đếm `getValues` của NhatKy = 1 cho một lô. Giới hạn lô mặc định **10 hộp × 3 khâu**. |
| R2 | Quan trọng | P4 gửi `soTrang = soTo` làm bảng "Nhật ký ca" (`loadNK`) và khu "Ai nhập – Chi tiết" hiện hai cột trùng số (25 trang, 25 tờ) → người đọc dễ cộng gấp đôi; cột `SoTrang` đổi nghĩa. | Giao diện chỉ gửi **`soTo`**, `soTrang` để trống (0). `dv` vẫn đúng (`to > 0`), cột `SoTrang` giữ nghĩa "số trang có nhập". Không cần sửa `Code.gs`. |
| R3 | Quan trọng | P1 riêng (tách form cũ thành hàm chung) là refactor cỡ M ở **chỗ dễ mất chức năng nhất**, không đem lại lợi ích cho người dùng, rồi P2/P3/P6 lại thay phần Scan/Tách/OCR của chính form đó → làm hai lần. | **Gộp P1 vào P2**: dựng thẳng thành phần mới "bảng báo cáo nhiều hộp" **dùng chung ngay từ đầu** cho tab Báo cáo và form Nhập hộ (tham số `boSung/nguoiHo`). Form cũ **giữ nguyên, không xóa** cho tới khi chủ dự án nghiệm thu bảng mới; khi đó mới gỡ phần Scan/Tách/OCR cũ trong một commit riêng. |
| R4 | Quan trọng | Chống ghi đôi (`idLo`) đang để "cần duyệt". Đây là quyết định kỹ thuật, không phải nghiệp vụ. | CTO quyết: **bắt buộc có trong P2**. Lưu `idLo` → kết quả vào CacheService 10 phút **sau khi** ghi xong; gửi lại cùng `idLo` thì trả lại kết quả cũ, không ghi thêm. Q6 bỏ khỏi danh sách hỏi chủ dự án. |

Ghi nhận khác (không chặn):
- P3: đồng ý mặc định **chỉ tick sẵn Scan + Tách**, OCR phải chủ động bật (OCR thường lệch số, dễ thổi phồng Dashboard).
- P7: đồng ý **7a**; 7b đổi ý nghĩa "nhóm đã báo cáo" ở `dash_` → chỉ làm nếu chủ dự án chọn ở Q1.
- Việc **P0 = `tools/kiem_tra_giao_dien.js`** phải xong trước mọi sửa giao diện (kiểm `id`, `call('…')` trong `docs/CHUC_NANG.md`).
- Triển khai theo **đợt**, mỗi đợt Opus review L3 + chủ dự án thử trên link thật: Đợt 1 = P0 + P2 (gồm P1, R1, R4) + P4 + F-QL-10; Đợt 2 = P6 + P5 + P7a; Đợt 3 = P3.

**Thứ tự làm đã chốt (chờ chủ dự án duyệt Q1–Q5):** P0 → P2(+P1) → P4 → P6 → P5 → P7a → P3.
**Câu hỏi còn lại cho chủ dự án:** Q1, Q2, Q3, Q4 (con số giới hạn), Q5. Q6 đã quyết (R4). Q7 thay bằng thứ tự trên.

---

## 8. Quyết định của chủ dự án (09/11/2026) — có hiệu lực, thay cho các gợi ý ở mục 3–6 nếu khác

| # | Quyết định | Hệ quả cho đề xuất |
|---|---|---|
| Q1 | **Làm nhanh hơn (7a), KHÔNG bỏ "Nhận hộp".** Phải có **cả hai cách**: hộp có sẵn trong danh sách đã nhận thì **tick chọn**; tìm không có thì **gõ tay**. Lý do: hệ thống mới triển khai, lịch sử các hộp cũ đã nhận chưa được nhập vào hệ thống. | Mọi chỗ chọn hộp (Nhận hộp, Scan/Tách/OCR, Trả hộp) phải có **ô tìm + gõ tay mã chưa có trong danh sách**. Không được chặn hộp ngoài danh sách (máy chủ hiện chỉ cảnh báo "chưa có trong danh sách đã nhận" → **giữ nguyên**). |
| Q2 | **Bỏ ô "Số trang"**, chỉ còn "Số tờ". | P4 theo R2: giao diện chỉ gửi `soTo`. Form sửa bản ghi của ADMIN (`editDL`) giữ nguyên hai ô. |
| Q3 | **Không điền sẵn** số hồ sơ / số tờ ở Tách/OCR từ Scan. **Cho phép tick OCR cùng Scan.** | **Bỏ P5.** P6 vẫn hiện "đã báo" của hộp để người nhập đối chiếu, nhưng không tự điền vào ô. P3: cho tick cả Scan + Tách + OCR; mặc định tick sẵn Scan + Tách, OCR người dùng tự bật. |
| Q4 | **Tối đa 10 hộp mỗi lần gửi (× tối đa 3 khâu); hộp lỗi bỏ qua và báo lý do, hộp đúng vẫn ghi.** | P2 như đề xuất + R1, R4. |
| Q5 | Hộp có **nhiều hồ sơ phân biệt bằng mã hồ sơ**. Khi nhận hộp đã nhập khoảng "từ hồ sơ số … đến số …". Báo cáo phải nhập **mã hồ sơ đã làm và số tờ đã làm**; hộp làm dở thì ca sau nhập tiếp **phần hồ sơ làm thêm** (theo mã hồ sơ). | **Đảo E5:** ô "Mã hồ sơ" là thông tin chính, không phải ô thừa. Mỗi dòng của bảng nhiều hộp (P2) có: mã hộp, **mã hồ sơ đã làm (từ–đến)**, số hồ sơ, số tờ, hết hộp. P6 hiện cho mỗi hộp: khoảng mã hồ sơ lúc nhận (cột `MaHoSo` của bản ghi NHAN/NHAN_NHOM) và các mã hồ sơ đã báo ở từng khâu. |

**Điểm Opus chốt kỹ thuật theo các quyết định trên (không cần hỏi lại):**
- Mã hồ sơ báo **trùng** với mã đã báo ở cùng khâu của cùng hộp → **chỉ cảnh báo**, không chặn (đúng kiểu cảnh báo hiện có).
- Nhập khoảng dạng "472-476" thì giao diện **gợi ý** số hồ sơ = 5 (người dùng vẫn sửa được).

**Còn chờ chủ dự án xác nhận (không chặn Đợt 1):** Q8 — Mã hồ sơ có **bắt buộc** khi hộp **chưa xong** (chưa tick hết hộp) không? Mặc định trong Đợt 1: **không bắt buộc, nhưng hiển thị nổi bật** và nhắc khi để trống.

**Kế hoạch đã duyệt:**
- **Đợt 1 (Sonnet):** P0 `tools/kiem_tra_giao_dien.js` → P2 bảng nhiều hộp dùng chung Báo cáo + Nhập hộ (gồm P1, R1, R4, mã hồ sơ mỗi dòng, gõ tay mã ngoài danh sách) → P4 chỉ "Số tờ" → P3 tick nhiều khâu (Scan + Tách mặc định, OCR tự bật). Xong → Sonnet **tự viết prompt Antigravity** làm đẹp phần mới (nếu không có điểm phải dừng, `CHUAN_PROMPT.md` mục 3a) → Antigravity → **Opus review tổng thể một lần (L3)** → chủ dự án thử trên link thật (gộp triển khai F-QL-10).
- **Đợt 2 (Sonnet → Antigravity):** P6 "Hộp của tôi" + hiển thị mã hồ sơ đã nhận/đã báo → P7a Nhận hộp và Trả hộp chọn bằng tick + gõ tay. Cùng luồng: Sonnet → Antigravity → Opus review tổng thể → chủ dự án thử.
- (Cập nhật 09/11/2026: bỏ "Đợt 3 Antigravity riêng"; giao diện làm ngay trong từng đợt để tiết kiệm một vòng review.)
