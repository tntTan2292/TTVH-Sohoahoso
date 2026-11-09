# Nhật ký thay đổi

Mỗi dòng: ngày · mã chức năng (xem `docs/CHUC_NANG.md`) · thay đổi · commit · phiên bản Apps Script đã triển khai (nếu có).

## 2026-11-09
- P0 · `tools/kiem_tra_giao_dien.js`: kiểm `id`/hàm giao diện trong CHUC_NANG.md, action trong API.md ↔ `route_` ↔ `call('…')`, cú pháp `<script>`/Code.gs, id tĩnh trùng. 328 đạt / 0 lỗi; đã thử cố ý đổi `id="fSend"` và tên `buildForm` → bắt được.
- Tài liệu: thêm `docs/CHUAN_PROMPT.md` — chuẩn viết prompt (học từ CODEX_PROMPT_STANDARD + MASTER_START_PROMPT của dự án Điều hành chất lượng): prompt < 250 từ, cặp developer, delta, L1/L2/L3, 2 kênh báo cáo, Opus tự duyệt, bàn giao chat, 5 mẫu prompt.
- Tài liệu: thêm `docs/DE_XUAT_CHUAN_HOA_BAO_CAO.md` — giai đoạn 1 chuẩn hóa báo cáo (đếm thao tác 61 ô/16 gửi/16 confirm cho 5 hộp, đề xuất P1–P7, câu hỏi Q1–Q7). Chưa sửa mã, chờ duyệt.
- Tài liệu: thêm `docs/PHAN_CONG.md` — Opus (CTO điều phối, review, việc khó), Sonnet (code), Antigravity Gemini Flash 3.8 (giao diện).
- Tài liệu: thêm `docs/prompts/PROMPT_SONNET_CHUAN_HOA_BAO_CAO.md` — giao Sonnet chuẩn hóa quy trình báo cáo, bỏ nhập trùng (2 giai đoạn: đề xuất → duyệt → làm).
- F-QL-10 · Form "Nhập số liệu hộ thành viên" khâu Scan: thêm tick "Đồng thời ghi Tách file PDF bằng đúng số Scan" (trước chỉ có ở tab Báo cáo). Mock 190/0. **Chưa triển khai lên Apps Script.**
- Tài liệu: thêm `AGENTS.md`, `CLAUDE.md`, `docs/CHUC_NANG.md`, `docs/API.md`, `docs/SNAPSHOT.md`, `CHANGELOG.md` để chống mất chức năng khi sửa và để phiên mới biết đang làm tới đâu.
- `ef54be3` · Bản đầu đưa lên GitHub = Apps Script **phiên bản 13** (link `…MlRA`). Gồm: Vào ca, nhận hộp Cá nhân/Nhóm, Scan kèm Tách, Dashboard lọc theo ngày (◀ ▶, nút ngày có dữ liệu), số đầu kỳ từng ngày 02–08/11, khu "Từng ca", khu "Ai nhập", `onEdit` bỏ cache khi sửa tay Sheet. Mock 188/0.
