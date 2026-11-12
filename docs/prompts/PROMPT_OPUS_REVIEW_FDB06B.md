# Phiếu Opus review F-DB-06b: bảng "Tình hình từng ca" — cột tên tự co giãn, không cắt chữ

Người nhận: **Opus (CTO, reviewer độc lập)**. Đọc trước: `AGENTS.md`, `docs/CHUAN_PROMPT.md`, `docs/SNAPSHOT.md`. Chỉ đổi giao diện (`Index.html`), không đụng `Code.gs`.

## Bối cảnh
Bảng ca – nhóm – cá nhân (tab "Ca – Nhóm") hiện tên người, thanh màu Scan/Tách/OCR và số liệu trên cùng một hàng. Chủ dự án báo (12/11/2026, có ảnh) tên dài bị cắt thành "Trần Thị Hồng T…", các hàng lệch cột.

Nguyên nhân gốc: mỗi hàng là một lưới riêng (`.ng-row`) có cột số `auto`, nên độ rộng cột tên/thanh phụ thuộc chữ "· nhận N hộp" và số liệu của chính hàng đó; hàng nào dài thì ép tên. Hai lần vá trước (bản 32: cột số 118px; commit `8f77435`: cột tên 140px) là **số cố định**, hỏng khi tên dài hơn. Chủ dự án không chấp nhận cách vá cố định và không chấp nhận cho tên xuống dòng.

## Việc Sonnet đã làm (chưa triển khai)
Chỉ CSS/HTML tại chỗ trong `apps-script/Index.html`, giữ nguyên hàm JS và `id`:
1. `.nh-block` thành lưới 3 cột `minmax(0,max-content) minmax(24px,1fr) max-content`: **cột tên tự rộng bằng tên dài nhất trong nhóm**, cột số tự rộng bằng số dài nhất, thanh màu lấy phần còn lại. Mọi hàng của một nhóm thẳng cột, không số cố định.
2. `.ng-row` đổi thành `display: contents` (các ô nằm thẳng trong lưới `.nh-block`); `.nh-title` chiếm cả hàng (`grid-column: 1 / -1`).
3. `.ng-ten`: một dòng, chỉ cắt "…" khi thẻ hẹp hơn chính tên (lưới cho phép co `minmax(0,…)`), thay cho cắt mọi lúc.
4. Hàng "Chưa báo cáo" (`.ng-idle`): chip căn phải trong cột 2–3. `.nh-block .bar3 { min-width: 0 }` để thanh không đè số khi thẻ rất hẹp.
5. Điện thoại (≤480px): giữ bố cục cũ (tên + số một hàng, thanh xuống hàng riêng) bằng cách trả `.nh-block` về `block` và `.ng-row` về `grid` trong media query.
6. JS (từ commit `8b0880f`): thành viên thuộc nhóm không in lại "nhận N hộp" (đã ở tiêu đề nhóm); mục "Cá nhân (không nhóm)" vẫn in.
Sonnet đã dựng thẻ mẫu với đúng CSS này và chụp trình duyệt: thẻ 316px hiện đủ "Trần Thị Hồng Thúy", "Nguyễn Thanh Thìn", thẳng cột; thẻ 230px với tên rất dài mới cắt "…" và thanh không đè số. **Chưa kiểm trên dashboard thật** (cần Opus hoặc chủ dự án sau khi đẩy).

Kết quả công cụ: mock **581/0**, giao diện **667/0**, `node --check` khối `<script>` đạt. `git diff --stat` chỉ vài dòng `Index.html`.

## Opus soi những điểm này
1. **Không mất chức năng:** không xóa/đổi tên hàm, `id`, class dùng ở chỗ khác. Kiểm `.nh-block`, `.ng-row`, `.ng-ten`, `.ng-so`, `.bar3`, `.nh-title` có được dùng ngoài ca-card không (tìm toàn file), tránh lan sang bảng khác.
2. **`display: contents`:** chấp nhận được với trình duyệt đích (Chrome/Edge/Safari hiện đại) và trợ năng (đọc màn hình có thể mất vai trò `.ng-row`; hàng không có vai trò ARIA nên có chấp nhận không).
3. **Mọi trạng thái hàng:** hàng có báo cáo, hàng "Chưa báo cáo", mục Cá nhân có "nhận N hộp", nhóm chỉ có người chưa báo cáo (cột 2–3 chỉ có chip), `.cc-chua` (ca chưa chốt, đổi màu số).
4. **Cân đối giữa các nhóm:** cột tên/số rộng theo từng nhóm nên thanh màu của Nhóm A và Nhóm B có thể bắt đầu ở x khác nhau trong cùng thẻ. Chủ dự án có chấp nhận không, hay cần cột chung cả thẻ (khi đó phải bọc tất cả nhóm của một ca vào một lưới, đổi cấu trúc HTML)?
5. **Điện thoại ≤480px:** bố cục cũ còn nguyên, không tràn ngang.
6. **Thanh tỉ lệ:** `bar()` tính `% theo người làm nhiều nhất trong ngày` không đổi; thanh hẹp lại không làm sai ý nghĩa so sánh.
7. Tự chạy lại mock 581/0, giao diện 667/0 và `git diff --stat`.

## Điều kiện ĐẠT / GO
Không có lỗi chặn ở 1–6, hoặc có lỗi nhỏ đã ghi rõ. Ghi kết quả (ĐẠT/KHÔNG ĐẠT + lý do) vào đầu `docs/SNAPSHOT.md`. Nếu ĐẠT: **chủ dự án tự đẩy tay** `Index.html` (AGENTS.md mục Triển khai), báo số phiên bản để developer ghi vào tài liệu. Sau khi đẩy, chủ dự án xem tab "Ca – Nhóm" ở ca có tên dài và gửi ảnh nếu còn lệch.
