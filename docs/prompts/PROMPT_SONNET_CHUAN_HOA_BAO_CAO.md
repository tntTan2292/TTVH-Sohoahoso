# Prompt giao Sonnet: chuẩn hóa quy trình báo cáo, bỏ nhập trùng

> Cách dùng: mở chat mới với Sonnet **trong thư mục dự án**, dán toàn bộ phần dưới dòng `---`.
> Viết ngày 09/11/2026, dựa trên commit `07618a0`. Nếu mã đã đổi nhiều, Sonnet phải tin mã nguồn và `docs/` hơn số dòng ghi ở đây.

---

## Vai trò và bối cảnh
Bạn tiếp quản dự án **Báo cáo ca Số hóa hồ sơ – Bưu điện TP Huế** (Google Apps Script Web App + Google Sheet). Khoảng 30 người, 3 ca/ngày, mỗi ca khoảng 6 người làm theo cặp. Họ báo cáo trên điện thoại, giữa lúc đang làm việc tay. **Vấn đề:** báo cáo hiện có quá nhiều thao tác nhập trùng, mất nhiều thời gian. **Mục tiêu:** chuẩn hóa quy trình để mỗi thông tin chỉ nhập **một lần**, số thao tác cho mỗi hộp giảm rõ rệt, **không làm sai số liệu Dashboard và không làm mất chức năng nào đang có**.

## Đọc trước (bắt buộc, theo thứ tự)
1. `AGENTS.md`: quy tắc làm việc. Đặc biệt: không viết lại cả file, một việc một commit, chạy mock, cập nhật SNAPSHOT trước khi dừng.
2. `docs/SNAPSHOT.md`: đang làm tới đâu.
3. `docs/CHUC_NANG.md`: mọi chức năng (mã F-xx), **không được làm mất**.
4. `docs/API.md`: hợp đồng giữa giao diện và máy chủ.
5. `apps-script/Code.gs`: hàm `ghi_`, `hopGoiY_`, `me_`, `dash_`, `lichSu_`.
6. `apps-script/Index.html`: hàm `buildForm`, `send`, `renderHo`, `stepsFor`.

## Quy trình hiện tại của một hộp hồ sơ
```
TT/TP: NHAN (Nhận từ TT Lưu trữ, dán nhiều mã)
  → Tổ viên: NHAN_NHOM (Nhận hộp, dán lại mã, chọn Cá nhân/Nhóm)
    → SCAN  (1 mã hộp + số hồ sơ + số trang/tờ + trang lỗi + tick hết hộp)
    → TACH  (gõ lại 1 mã hộp + số hồ sơ + số trang/tờ + tick hết hộp)
    → OCR   (gõ lại 1 mã hộp + số hồ sơ + số trang/tờ + tick hết hộp)
  → TT/TP: TRA (Trả hộp, dán lại mã; chỉ được trả khi đã Tách xong)
```
Mỗi bước = 1 dòng trong tab `NhatKy`. `dash_` đếm "hộp xong" theo lần `HetHop` đầu tiên ở mỗi khâu, tính `dv` = số tờ nếu > 0, ngược lại số trang. Đã có sẵn: tick "Scan đồng thời ghi Tách" ở tab Báo cáo (F-BC-08) và ở form Nhập hộ (F-QL-10); datalist gợi ý mã hộp theo khâu (`hopGoiY_`).

## Các điểm nhập trùng đã phát hiện (kiểm chứng lại trong mã)
| # | Điểm trùng | Ở đâu |
|---|---|---|
| D1 | Một hộp đi 3 khâu Scan/Tách/OCR: mỗi khâu gõ lại mã hộp, số hồ sơ, số trang/tờ, tick hết hộp. Số liệu thường giống hệt nhau | `buildForm`, `send` |
| D2 | Máy chủ đã biết số Scan của hộp, nhưng form Tách/OCR không tự điền | `hopGoiY_` chỉ trả mã, không trả số liệu |
| D3 | Scan/Tách/OCR chỉ cho **1 mã hộp mỗi lần gửi** (`'Mỗi lần báo cáo chỉ nhập 1 mã hộp'`). Nhiều hộp thì nhiều lần gửi, mỗi lần một `confirm()` và một lượt chờ máy chủ | `ghi_` |
| D4 | Nhận 2 tầng: TT/TP nhận (NHAN), rồi tổ viên dán lại cùng mã (NHAN_NHOM) | `ghi_`, `hopGoiY_` |
| D5 | Hai ô "Số trang" và "Số tờ" trong khi quy ước 1 trang = 1 tờ. Thừa một ô, dễ nhập nhầm cả hai | `buildForm`, `dash_` (`dv`) |
| D6 | Số hồ sơ bắt buộc ở cả 3 khâu dù không đổi theo hộp | `ghi_` (`hs < 1` → lỗi) |
| D7 | Trả hộp phải dán lại mã, dù hệ thống đã biết hộp nào đủ điều kiện trả | `TRA` trong `ghi_` |
| D8 | Hộp làm dở sang ca sau phải gõ lại từ đầu, không thấy đã báo bao nhiêu | — |
| D9 | Tick "kèm Tách" mới làm cho Scan→Tách. OCR chưa có; tick không nhớ giữa các lần mở | `KEM_TACH` |
| D10 | Form Nhập hộ (`renderHo`) là bản sao riêng của form báo cáo. Hai bản phải sửa song song nên dễ lệch, chính là nguyên nhân F-QL-10 từng bị thiếu | `renderHo` vs `buildForm` |

Bạn được phép phát hiện thêm điểm khác, ghi rõ bằng chứng (hàm, dòng).

## Cách làm: 2 giai đoạn, KHÔNG gộp
### Giai đoạn 1: Đề xuất (chưa sửa mã)
Viết `docs/DE_XUAT_CHUAN_HOA_BAO_CAO.md` gồm:
1. **Bảng đếm thao tác hiện tại** cho kịch bản chuẩn: 1 cặp, 1 ca, 5 hộp, mỗi hộp đi Nhận hộp → Scan → Tách → OCR. Đếm số ô phải gõ, số lần bấm, số lần `confirm`, số lần gọi máy chủ.
2. **Danh sách đề xuất** (mã P1, P2…). Mỗi đề xuất gồm: giải quyết điểm D nào; mô tả thao tác mới của người dùng; thay đổi `Index.html` / `Code.gs` (action mới hay sửa action cũ); **ảnh hưởng tới `dash_` và số liệu cũ**; chức năng F-xx bị ảnh hưởng; rủi ro; độ lớn (S/M/L).
3. **Bảng đếm thao tác sau khi áp dụng** cho cùng kịch bản.
4. **Câu hỏi cần chủ dự án quyết** (xem mục dưới).

Gợi ý hướng để đánh giá (không bắt buộc làm theo, tự cân nhắc):
- Danh sách **"Hộp của tôi"** trong ca: mỗi hộp hiện đang ở khâu nào và số đã báo. Chạm vào hộp → form khâu kế tiếp **điền sẵn** số hồ sơ, số trang từ khâu trước; chỉ cần sửa nếu khác rồi gửi. Có thể cần action đọc mới (ví dụ `hopCuaToi`, thêm vào `READ_ACTIONS`).
- Tổng quát hóa "kèm Tách" thành chọn **nhiều khâu một lần** (Scan + Tách + OCR) với cùng số liệu.
- **Gửi nhiều hộp một lần** bằng bảng nhiều dòng: một action ghi theo lô (ví dụ `ghiLo`) chạy trong **một** lần khóa, kết quả và cảnh báo trả theo từng hộp. Không gọi `ghi` nhiều lần liên tiếp từ giao diện.
- Gộp "Số trang"/"Số tờ" thành **một ô "Số tờ"** trên giao diện. Máy chủ vẫn nhận cả hai trường để dữ liệu cũ và `dash_` không đổi.
- NHAN_NHOM và TRA: **chọn từ danh sách gợi ý bằng ô tick** (có "chọn tất cả") thay vì dán mã.
- Dùng **một hàm vẽ form chung** cho Báo cáo và Nhập hộ (khác nhau ở tham số `boSung`, `nguoiHo`), để chỉ còn một nơi phải sửa (D10).

**Kết thúc giai đoạn 1:** cập nhật `docs/SNAPSHOT.md` (đang chờ duyệt đề xuất), commit `Đề xuất chuẩn hóa báo cáo (chưa sửa mã)`, rồi **DỪNG và chờ chủ dự án duyệt** từng đề xuất. Không tự chuyển sang giai đoạn 2.

### Giai đoạn 2: Làm các đề xuất đã duyệt
- Làm **từng đề xuất một**, mỗi đề xuất một commit `P<n>: …`. Thêm dòng vào `docs/CHUC_NANG.md` (mã F mới), `docs/API.md` (nếu có action hoặc trường mới), `CHANGELOG.md`.
- Mỗi đề xuất có kiểm thử mới trong `tools/test_mock.js`. Kiểm thử về số liệu phải so `dash_` **trước và sau** trên cùng dữ liệu.
- Sau **mỗi** commit cập nhật `docs/SNAPSHOT.md`: đề xuất nào xong, đề xuất nào còn lại.

## Ràng buộc bắt buộc
- **Không đổi cấu trúc cột** các tab Sheet (`TAB` trong `Code.gs`). Mỗi khâu của mỗi hộp vẫn là 1 dòng `NhatKy` như hiện tại, để `dash_`, `lichSu_`, dữ liệu cũ và số đầu kỳ giữ nguyên ý nghĩa.
- Giữ mọi kiểm tra của `ghi_`: phân quyền, giờ ca, ca đã chốt, mã hộp hợp lệ, số không âm, hộp đã xong không nhận thêm, điều kiện Trả hộp, chốt `ThanhVien` lúc báo cáo, nhập hộ chỉ ngày hôm nay hoặc quá khứ. Action mới phải đi qua đúng các kiểm tra này (gọi lại hàm dùng chung, không chép lại logic).
- Action ghi mới phải chạy trong khóa (không đưa vào `READ_ACTIONS`) và ghi `log_` như `ghi_`.
- Không xóa action `ghi` cũ; giao diện cũ hoặc bản đang triển khai vẫn phải gọi được.
- Giao diện cho điện thoại 360px, nút lớn, thao tác một tay; dữ liệu người nhập luôn qua `esc()`; ES5.
- Không triển khai Apps Script, không chạm Google Sheet thật. Không in PIN.

## Không được tự quyết (đưa vào câu hỏi cho chủ dự án)
- Có bỏ hẳn bước NHAN_NHOM không (tổ viên nhận tự động khi TT/TP giao), hay chỉ làm cho nhanh hơn.
- Có bỏ ô "Số trang" khỏi giao diện không (chỉ còn "Số tờ").
- Số hồ sơ ở Tách/OCR: tự lấy từ Scan hay vẫn bắt nhập.
- Một lần gửi được phép ghi tối đa bao nhiêu hộp × bao nhiêu khâu.
- Hộp làm dở (chưa tick hết hộp) ở ca trước: ca sau báo tiếp theo cách nào.

## Kiểm tra sau mỗi commit ở giai đoạn 2
1. `node tools/test_mock.js`: `0 lỗi`, số kiểm tra **tăng** (hiện 190).
2. `node --check` cho `Code.gs` (chép sang `.js` tạm) và khối `<script>` của `Index.html`.
3. `git diff --stat`: không có xóa hàng loạt ngoài ý muốn trong `Index.html`.
4. Đi lại bảng kiểm tra cuối `docs/CHUC_NANG.md`.

## Báo cáo khi dừng
- Giai đoạn 1: đường dẫn file đề xuất, bảng trước/sau (tóm tắt), danh sách câu hỏi.
- Giai đoạn 2: từng P đã làm (commit), kết quả mock thật, việc còn lại. Ghi "chưa xác minh" cho những gì cần Apps Script thật mới kiểm được.
