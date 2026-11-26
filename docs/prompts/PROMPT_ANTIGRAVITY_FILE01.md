# Phiếu Antigravity: F-FILE-01 – làm đẹp giao diện "Tách file / OCR tính theo file" (mục 36)

Người nhận: **Antigravity (Gemini Flash 3.8)**. Gốc: `cdb9a63` (Opus review mã ĐẠT). Logic đã xong, chỉ làm đẹp HTML/CSS trong `apps-script/Index.html`. Nội dung chức năng: dòng `F-FILE-01` trong `docs/CHUC_NANG.md`.

## Việc (khổ điện thoại 360px và máy tính)
1. **Ô nhập số khi ẩn Số trang/Số tờ** (form cá nhân, nhập hộ, nhiều hộp `.lo-row`, sửa bản ghi): khâu Tách file/OCR chỉ còn ô "Số file (= số hồ sơ)" (các ô khác bị `style="display:none"`). Sửa CSS `.num-row` để ô còn lại không lệch, không vỡ lưới (lưu ý quy tắc `.lo-row .num-row > div:nth-child(3)`). **Không xóa** các ô ẩn, không đổi `style="display:none"`.
2. **Ghi chú đỏ** `GHI_CHU_FILE_HTML` ("Khâu Tách file và OCR chỉ báo cáo SỐ FILE…"): rõ, gọn, nổi bật vừa phải, không đè nút.
3. **Dashboard – vòng tiến độ** (`ring`, `widgetHtml`): dòng "Mục tiêu … file", chip "✔ Đủ mục tiêu (100%)", chip "Tạm tính" xuống dòng đẹp, ba vòng cao bằng nhau.
4. **Khung "⚙ Số quy đổi Tách file / OCR"** (`qdfHtml`, thẻ `<details>`): canh 3 ô số + nút, chữ ghi chú dễ đọc.
5. **Tab Nhân sự:** thẻ "Năng suất TB (tính riêng)" (hai dòng tờ/giờ và file/giờ) và bảng thêm cột năng suất: không tràn ngang ở 360px.
6. **Chú thích biểu đồ và tiêu đề** dài hơn trước ("Scan: tờ · Tách, OCR: file", "Tách file (file)"…): không tràn, không che biểu đồ trên điện thoại.

## Giữ nguyên (không đổi tên/xóa)
`laKhauFile`, `GHI_CHU_FILE_HTML`, `ring`, `widgetHtml`, `qdfHtml`, `qdfLuu`, `#qdfMuc`, `#qdfTach`, `#qdfOcr`, `#qdfLuuBtn`, `#qdfMsg`, `#fHs`, `#fTrang`, `#fTo`, `#hoHs`, `#hoTrang`, `#hoTo`, `#eHs`, `#eTrang`, `#eTo`, `#eLoi`, `data-k="hs"`, `data-k="to"`, `#c4`, `#c5`, `#c6`, mọi `call('...')`.

## Xong
Commit (ghi `F-FILE-01`), push, cập nhật SNAPSHOT. Báo cáo kênh B: khối đã đổi (mô tả bằng lời), id/hàm đã giữ, kết quả 2 lệnh kiểm tra. Sau đó chủ dự án mở chat Opus review tổng thể (mẫu 10.5).
