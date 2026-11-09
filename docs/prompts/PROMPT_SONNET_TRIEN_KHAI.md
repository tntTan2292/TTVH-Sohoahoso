# Phiếu giao việc: Sonnet triển khai mã lên Apps Script (Claude in Chrome) + tạo skill `update-code-sohoa`

> Opus viết 09/11/2026, sửa cùng ngày: **bỏ clasp**, dùng lại đúng cách các phiên Sonnet trước đã triển khai thành công (Claude in Chrome trên Chrome đã đăng nhập sẵn của chủ dự án, không cần chủ dự án thao tác).
> Developer: **Claude Code (Sonnet)**. Mức kiểm tra: **L3** (đụng bản đang chạy thật).
> Căn cứ: Opus review Đợt 1 = **GO triển khai thử** (SNAPSHOT 2a). Chủ dự án yêu cầu Sonnet tự cập nhật mã lên link đang chạy và đóng gói thành skill dùng lại.

## Thông tin dự án Apps Script
URL trình soạn và link `/exec` đầy đủ nằm trong file **`deploy.local.md` ở gốc repo — chỉ có trên máy, KHÔNG đưa lên Git** (đã có trong `.gitignore`; link `/exec` là trang đăng nhập công khai, không công bố trên GitHub). Không chép các giá trị đó vào file nào được commit.

| Mục | Giá trị |
|---|---|
| Trình soạn, link chính `…MlRA`, link phụ `…NIQ` | xem `deploy.local.md` |
| File trên Apps Script | `Code.gs`, `Index.html`, `appsscript.json` (manifest) |
| Bản đang chạy | phiên bản 13 = commit `ef54be3` (SNAPSHOT mục 1) |

Nếu trình soạn mở ra dự án khác, hoặc trong Quản lý triển khai không thấy bản kết thúc `…MlRA` → **dừng, hỏi chủ dự án**, không đoán.

## Mục tiêu
1. Đưa 3 file trong `apps-script/` ở `main` lên dự án trên, tạo **phiên bản mới** cho **đúng bản triển khai `…MlRA`** (giữ nguyên link). Không đụng `…NIQ`.
2. Tạo skill dự án **`update-code-sohoa`** (chủ dự án gọi "UpdateCodeSohoa") ghi lại quy trình này để lần sau gọi là làm đúng.

## Các bước

### A. Kiểm tra trước khi đẩy (bắt buộc mỗi lần)
1. `git status` sạch, `main` đã push.
2. `node tools/test_mock.js` → 0 lỗi; `node tools/kiem_tra_giao_dien.js` → 0 lỗi.
3. SNAPSHOT ghi Opus **GO** cho đợt sắp triển khai (lần này có: Đợt 1). Không có GO → dừng.
4. Dùng **Claude in Chrome** (Chrome thật, đã đăng nhập Google; không dùng trình duyệt tích hợp). Gặp trang đăng nhập → dừng, nhờ chủ dự án đăng nhập.

### B. Đối chiếu bản trên Apps Script (chống ghi đè sửa tay)
1. Mở trình soạn, đọc nội dung từng file qua `monaco.editor.getModels()` (javascript_tool), tính mã băm (bỏ `\r`).
2. So với bản đã triển khai lần trước (`git show <commit bản đang chạy>:apps-script/Code.gs` …; lần này `ef54be3`).
3. **Khác** (có người sửa thẳng trên trình soạn) hoặc có **file lạ** → **DỪNG**, báo chủ dự án danh sách khác biệt. Không ghi đè.

### C. Đẩy mã
1. Thay nội dung từng model bằng nội dung file ở `main` (`setValue`). Nạp nội dung bằng cách an toàn, ví dụ server cục bộ `127.0.0.1` chỉ phục vụ đúng 3 file rồi `fetch` từ trang, hoặc chia khúc qua javascript_tool. Tắt server ngay sau khi xong.
2. Lưu (Ctrl+S / nút Lưu), đợi hết trạng thái "đang lưu".
3. **Xác minh**: đọc lại từ model, mã băm phải trùng bản ở `main` cho cả 3 file. Không trùng → dừng.

### D. Triển khai phiên bản mới (giữ link)
1. Triển khai → **Quản lý các tùy chọn triển khai** → chọn bản có URL kết thúc `…MlRA` → **✏️ (bút chì)** → Phiên bản: **Phiên bản mới** → mô tả `"<mã commit> <mô tả ngắn>"` → Triển khai.
2. Ghi lại **số phiên bản mới N** và **phiên bản cũ** (để quay lui).
3. **Không** bấm "Triển khai mới" (tạo link khác), **không** Lưu trữ (archive) bản đang dùng.
4. Kiểm: mở link `/exec` → trang tải được, tiêu đề "Số hóa hồ sơ", không lỗi. Không đăng nhập, không thao tác dữ liệu trên Web App.

### E. Quay lui (khi D.4 lỗi hoặc chủ dự án báo hỏng)
Quản lý các tùy chọn triển khai → `…MlRA` → ✏️ → chọn **phiên bản cũ** → Triển khai. Ghi vào SNAPSHOT.

### F. Ghi tài liệu
- `docs/SNAPSHOT.md` mục 1: "Bản đang chạy" = phiên bản N, commit, ngày; "Mã trên Apps Script khớp repo?" = Có. Mục 2a/2b: đã triển khai, chờ chủ dự án thử 5 bước (gồm đo thời gian lô 10 hộp).
- `CHANGELOG.md`: "Triển khai phiên bản N (commit …)".
- `HUONG_DAN_TRIEN_KHAI.md` dòng Trạng thái + mục D "Cập nhật mã nguồn": thêm "dùng skill `update-code-sohoa`".

### G. Tạo skill `update-code-sohoa`
- Vị trí `.claude/skills/update-code-sohoa/SKILL.md`. Sửa `.gitignore`: thay dòng `.claude/` bằng `.claude/*` và `!.claude/skills/` để skill lên GitHub (`settings.local.json`, `launch.json` vẫn ngoài Git).
- Frontmatter: `name: update-code-sohoa`; `description`: dùng khi chủ dự án nói "UpdateCodeSohoa", "cập nhật code lên Apps Script/link", "triển khai phiên bản mới", "deploy".
- Nội dung: đọc URL từ `deploy.local.md` (không chép URL vào skill) + các bước A → F viết thành thao tác cụ thể (gồm đoạn JS đọc/ghi/tính băm model Monaco đã dùng thành công) + **các điểm phải dừng**: thiếu GO, workspace bẩn, kiểm tra lỗi, bản trên Apps Script khác repo, gặp trang đăng nhập, không thấy `…MlRA`.
- Ghi chú tiết kiệm quota trong skill: đọc trang bằng `javascript_tool`/`get_page_text`, chỉ chụp màn hình khi cần bấm nút theo tọa độ.
- `AGENTS.md` thêm một dòng: "Triển khai lên Apps Script: chỉ dùng skill `update-code-sohoa`". `README.md`: thêm skill vào bảng cấu trúc.

## Không được
- Không tạo bản triển khai mới, không archive, không đụng `…NIQ`, không chạy `setup`, không sửa Google Sheet.
- Không sửa `Code.gs`/`Index.html` trong việc này. Không đổi cài đặt tài khoản Google.

## Báo cáo (kênh B)
Phiên bản cũ → mới, kết quả đối chiếu B, kết quả xác minh băm C.3 và kiểm D.4, commit tài liệu + skill, việc chủ dự án làm tiếp (thử 5 bước). Ghi "chưa xác minh" cho điều không tự kiểm được.
