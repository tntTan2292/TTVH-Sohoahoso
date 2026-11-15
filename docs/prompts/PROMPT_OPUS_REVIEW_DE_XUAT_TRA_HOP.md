# Phiếu Opus xét duyệt ĐỀ XUẤT: quy chuẩn Trả hộp / giao nhận (nâng cấp lần 3)

Người nhận: **Opus (CTO)**. Đây là **duyệt phương án, chưa có mã để review**. Đọc trước: `AGENTS.md`, `docs/CHUAN_PROMPT.md` (mục 0, 3a, 7, 8), `docs/SNAPSHOT.md`, rồi **`docs/DE_XUAT_TRA_HOP.md`** (commit `e049153`, bổ sung số liệu thật ở `65f8db0`). Không sửa mã, không ghi Sheet.

## Bối cảnh
Chủ dự án (15/11/2026) báo: tab **Đối soát hộp** thiếu dữ liệu cột **Trả hộp cho TTLT**; chức năng trả hộp chưa rõ; cần quy chuẩn hai chặng giao nhận: **Nhân viên → Quản lý** và **Quản lý → Trung tâm Lưu trữ (TTLT)**.

## Sonnet đã làm (chỉ rà soát + đề xuất)
1. **Rà mã** (`Code.gs` `ghi_` dòng 565/637–644, `hopHoSo_`/`hopTrangThai_`/`hopBanGhi_` 1755–1794, `hopGoiY_` ~802; `Index.html` đối soát 4535–4576): hệ thống chỉ có bước `TRA` (Quản lý → TTLT), **không có chặng Nhân viên → Quản lý**; cột "Trả" chỉ hiện ngày (không ca/người/ghi chú); "Thiếu nhận TTLT" che việc đã trả; gợi ý Trả không lọc hộp đã Tách xong; trả lần hai bị bỏ qua.
2. **Đọc trực tiếp Google Sheet thật** (tab `NhatKy`, chỉ đọc, 15/11/2026): 374 dòng, 150 hộp (02–15/11). Chỉ **6 hộp** có `NHAN` và đúng 6 hộp đó có `TRA` (nhận 10/11 Sáng, trả 13/11 Chiều). **144/150 hộp thiếu `NHAN`**, trong đó **137 hộp đã Tách xong** nhưng chưa nhận/chưa trả. Không có hộp Trả mà chưa Tách xong hay thiếu Nhận → lỗi là **không ai báo**, không phải hệ thống bỏ qua.
3. **Ba phương án:** A (giữ một bước `TRA`, làm rõ hiển thị + gợi ý + ghi chú), B (thêm bước `GIAO` cho chặng nhân viên → quản lý, không thêm cột), C (xác nhận hai chiều, không khuyến nghị). Sonnet đề xuất A → B, **nhưng số liệu thật cho thấy B vẫn chưa đủ nếu Quản lý không báo Nhận/Trả**; gợi ý thêm **"Trả hàng loạt"** (một lần bấm, có Xem trước) và **nhập bổ sung ngày Nhận/Trả thật cho hộp cũ**.

## Opus quyết (trả lời từng mục, ngắn)
1. **Chọn hướng:** A, A→B, hay A + trả hàng loạt trước (rồi B)? Có đồng ý rằng bài toán gốc là **hành vi báo cáo**, không phải thiếu bước?
2. **Trả hàng loạt:** quy tắc chọn hộp ("đã Tách xong, chưa trả" hay "đã OCR xong"?), phải có Xem trước + gõ xác nhận kiểu `chuanHoaNhom` (`apDung`, sao lưu, log)? Hộp **không có `NHAN`** có được trả hàng loạt không (137 hộp)? Đề nghị chuẩn: cảnh báo, vẫn ghi.
3. **Hộp cũ chưa có `NHAN`:** có tạo bản ghi `NHAN` bù (loại `BỔ SUNG`, ngày thật do chủ dự án cung cấp) hay chỉ cho phép trả mà không đòi nhận? Đây là **sửa dữ liệu thật** → theo `CHUAN_PROMPT.md` mục 3c: Xem trước → chủ dự án duyệt → áp dụng.
4. **Bước `GIAO`:** thêm giá trị `Buoc` mới có an toàn? Soi các chỗ so chuỗi cố định: `ghi_` (564, 572, 608), `STEP_NAME_`, `hopMoc_`, `nhatKyRows_`, `thongKeNhanSu_` (~2009), `Index.html` `STEP_LABEL`/`stepsFor`, lọc nhật ký. Có cần quyền cho tổ viên (hiện NHAN/TRA chỉ quản lý)?
5. **`dash_` bất biến:** chấp nhận ràng buộc "mọi số hiện có giống hệt trước/sau (mock so với `33a5d94`)"; ô "Chờ trả TTLT" có làm không.
6. **`hopTrangThai_`:** có đổi ưu tiên để "Thiếu nhận" không che "đã trả"; thêm nhãn "Đã giao QL, chưa trả TTLT" và "Đã trả, OCR chưa xong"?
7. **Trả lần hai** (Q5) và **ghi chú biên bản** (Q4): giữ mặc định đề xuất hay đổi?
8. **Câu hỏi nào gửi chủ dự án** trong Q1–Q7 của đề xuất (lọc bớt, mặc định đúng thì khỏi hỏi). Thêm một câu mới: *vì sao Quản lý không báo Nhận/Trả (bất tiện, quên, không thấy nút)?*
9. **Phân công + thứ tự đợt** (Sonnet code → Antigravity giao diện → Opus review gộp một lần → chủ dự án đẩy tay), mã việc (`F-TH-xx`), thêm mục 33+ vào `docs/TIEN_DO_PO.md`.

## Kết luận cần ghi
**DUYỆT / DUYỆT CÓ ĐIỀU KIỆN / KHÔNG DUYỆT**, kèm phương án chốt và danh sách câu hỏi cho chủ dự án. Ghi vào `docs/SNAPSHOT.md` và cuối `docs/DE_XUAT_TRA_HOP.md`, commit, push. Nếu duyệt: viết luôn phiếu Sonnet theo mẫu `CHUAN_PROMPT.md` 10.2 (đợt đầu: cho phép dừng giữa chừng ở điểm sửa dữ liệu thật). Chưa duyệt thì **không giao code**.

## Không được làm
Sửa `Code.gs`/`Index.html`, ghi Sheet thật, triển khai Apps Script, đưa dữ liệu Sheet (mã hộp thật, tên, PIN) lên Git ngoài các con số tổng hợp đã nêu ở trên.
