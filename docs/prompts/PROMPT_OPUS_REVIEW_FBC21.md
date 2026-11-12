# Phiếu Opus review F-BC-21 (mục 32): nhận hộp cá nhân trước khi phân nhóm → tự vào nhóm

Người nhận: **Opus (CTO, reviewer độc lập)**. Đọc trước: `AGENTS.md`, `docs/CHUAN_PROMPT.md`, `docs/SNAPSHOT.md`.

## Bối cảnh (dữ liệu thật, 12/11/2026)
Âu Thái Tuấn (00061904), ca Tối 11/11: nhận hộp 02.01.122 lúc 18:23 (chưa có nhóm → `Nhom` rỗng), được phân Nhóm 1 lúc 18:46, nhận 2.1.125 lúc 19:29 (Nhóm 1), Scan/Tách cả hai hộp lúc 20:13 (Nhóm 1). `dash_` chỉ đếm `NHAN_NHOM` có `nhom` → cột nhóm của ca chỉ có 1 hộp, báo cáo là 2. Cùng kiểu: Sáng 11/11 (Trần Nhật Tân, Nhóm 4), Chiều 11/11 (Trương Quốc Bảo, Nhóm 1), Tối 10/11. Nguyên nhân: nhóm chốt theo thời điểm báo cáo (`nhomOf_` trong `ghi_`), không ai chuyển dòng cũ khi nhóm được phân sau. Trước đây phải nhờ ADMIN chạy `chuanHoaNhom` tay mỗi ngày.

## Việc Sonnet đã làm (chưa triển khai)
- `Code.gs`: thêm `gomNhanNhomCaNhan_(u, ngay, ca)` và `gomNhanNhomAnToan_`, gọi ở cuối **cả hai nhánh** của `luuNhom_` (đường thường và `chiDoi`). Không đổi `ghi_`, `dash_`, `chuanHoaNhom_`, `caState_`.
- `tools/test_mock.js`: thêm khối F-BC-21 (+10 kiểm tra). Mock **581/0** (trước 571), giao diện 664/0, `node --check` Code.gs đạt. Không đụng `Index.html`.
- Tài liệu: `docs/CHUC_NANG.md` (F-BC-21), `docs/API.md` (ghi chú `luuNhom`), `CHANGELOG.md`, `docs/TIEN_DO_PO.md` mục 32.

## Opus soi những điểm này
1. **Phạm vi:** chỉ khâu `NHAN_NHOM`; bỏ qua `THỬ NGHIỆM`, `Huy`; dòng `Nhom` đã có không đụng; người/dòng thuộc ≠ 1 nhóm không đụng. Có chấp nhận việc Scan/Tách/OCR cá nhân (làm trước khi có nhóm) vẫn giữ cá nhân không? (Sonnet cố ý: số liệu gắn người làm, chuyển sẽ chia 50/50 đổi công của từng người.)
2. **Trùng:** nhóm đã có dòng nhận cùng khóa hộp (`maHopKhoa_`) thì không chuyển; hai người cùng nhóm cùng nhận cá nhân một hộp chỉ chuyển dòng đầu. Dòng còn lại ở lại cá nhân, ADMIN xử lý bằng `chuanHoaNhom`. Đủ an toàn chưa?
3. **Ghi Sheet:** `ghiVanBan_` đặt '@' trước (mã HRM toàn số, bài học D1); sao lưu `saoLuuDong_` trước khi sửa; log `GOM_NHAN_NHOM` từng dòng. `memoClear_('NhatKy')` sau khi ghi.
4. **Không làm hỏng việc chính:** `gomNhanNhomAnToan_` bọc try/catch, lỗi chỉ ghi log `GOM_NHAN_NHOM_LOI`, `luuNhom_` vẫn thành công. Kiểu trả về `luuNhom`: nhánh thường vẫn là chuỗi, nhánh `chiDoi` vẫn `{msg, nhom}` (chỉ nối thêm câu thông báo) — kiểm `Index.html` không so sánh chuỗi cứng.
5. **Hiệu năng/khóa:** chạy trong `withLock_` sẵn có của `api()`; mỗi lần lưu nhóm đọc `NhatKy` một lần (có đệm) và chỉ ghi khi có dòng cần chuyển. Nhánh `chiDoi` chỉ gọi khi `gan.length > 0`.
6. **Số liệu:** `dash_` không đổi mã, chỉ đổi dữ liệu đầu vào → `cas[].nhanNhom` đủ hộp; `thanhVienBanGhi_`/chia công không bị ảnh hưởng vì dòng NHAN_NHOM không tính sản lượng.
7. Tính lại khẳng định "mock 581/0, giao diện 664/0" bằng cách tự chạy.

## Điều kiện ĐẠT / GO
Không phát hiện lỗi chặn ở 1–6, và mock/giao diện tự chạy lại khớp. Ghi kết quả (ĐẠT/KHÔNG ĐẠT + lý do) vào đầu `docs/SNAPSHOT.md`. Nếu ĐẠT → chủ dự án đã yêu cầu **triển khai bằng skill `update-code-sohoa`** (đã cho phép riêng lần này, sau review đạt). Triển khai xong: ghi số phiên bản vào SNAPSHOT/CHANGELOG/TIEN_DO_PO mục 32.

## Việc dữ liệu một lần (ADMIN, cần chủ dự án đồng ý)
Sau khi có bản mới, dòng cũ 10–11/11 vẫn lệch: chạy `chuanHoaNhom` (Xem trước → duyệt → Áp dụng) cho 11/11 Sáng, Chiều, Tối (và 10/11 Tối). Theo `CHUAN_PROMPT.md` mục 3c; Sonnet chưa chạy gì trên Sheet thật.
