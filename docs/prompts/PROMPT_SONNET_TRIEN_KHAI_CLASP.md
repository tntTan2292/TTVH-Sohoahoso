# Phiếu giao việc: Sonnet triển khai mã lên Apps Script bằng clasp + tạo skill `update-code-sohoa`

> Opus viết 09/11/2026. Developer: **Claude Code (Sonnet)**. Mức kiểm tra: **L3** (đụng bản đang chạy thật).
> Căn cứ: Opus review Đợt 1 = **GO triển khai thử** (SNAPSHOT 2a, commit `3a115e1`). Chủ dự án yêu cầu Sonnet tự cập nhật mã lên link đang chạy và đóng gói thành skill dùng lại.

## Mục tiêu
1. Đưa `apps-script/Code.gs`, `apps-script/Index.html`, `apps-script/appsscript.json` ở `main` lên dự án Apps Script đang chạy, tạo **phiên bản mới** trên **đúng bản triển khai của link chính `…MlRA/exec`** (giữ nguyên link). **Không đụng** link phụ `…NIQ`.
2. Tạo skill dự án **`update-code-sohoa`** (chủ dự án gọi là "UpdateCodeSohoa") để mọi lần sau chỉ cần gọi skill là làm đúng quy trình này.

## Hiện trạng (Opus đã kiểm)
- Máy **chưa có** `clasp`, chưa có `~/.clasprc.json`, repo chưa có `.clasp.json`. Các lần trước triển khai bằng tay (`HUONG_DAN_TRIEN_KHAI.md` mục D "Cập nhật mã nguồn").
- `.gitignore` đang bỏ qua cả thư mục `.claude/` → skill đặt ở `.claude/skills/` sẽ **không** lên GitHub nếu không sửa `.gitignore`.

## Các bước

### A. Cài đặt (một lần)
1. `npm install -g @google/clasp` (ghi phiên bản vào báo cáo).
2. **Dừng, nhờ chủ dự án tự làm 2 việc** (Sonnet không đăng nhập thay, không nhập mật khẩu):
   - Bật Apps Script API: mở `https://script.google.com/home/usersettings` → bật "Google Apps Script API".
   - Chạy `clasp login` trong terminal của mình, đăng nhập đúng tài khoản Google **chủ của Sheet/Apps Script**.
3. Lấy **Script ID**: nhờ chủ dự án chép từ Apps Script → Cài đặt dự án (⚙) → "Mã tập lệnh", hoặc dùng `clasp list` rồi hỏi chủ dự án chọn đúng dự án. Không đoán.
4. Tạo `.clasp.json` ở gốc repo: `{ "scriptId": "<ID>", "rootDir": "apps-script" }`. Thêm `.clasp.json` và `.clasprc.json` vào `.gitignore` (thông tin riêng của máy/tài khoản).

### B. Kiểm tra trước khi đẩy (bắt buộc mỗi lần)
1. `git status` sạch, `main` đã push (`git status -sb` không "ahead").
2. `node tools/test_mock.js` → 0 lỗi; `node tools/kiem_tra_giao_dien.js` → 0 lỗi.
3. SNAPSHOT ghi Opus **GO** cho đợt sắp triển khai (lần này: có, Đợt 1). Không có GO → dừng, báo.
4. **Đối chiếu bản trên Apps Script với repo**: `clasp pull` vào **thư mục tạm** (scratchpad, không phải `apps-script/`), so danh sách file và nội dung với bản đã triển khai lần trước (`git show ef54be3:apps-script/...` cho lần này = phiên bản 13).
   - Trên Apps Script có **file lạ** không có trong repo, hoặc nội dung khác bản đã triển khai lần trước (có người sửa thẳng trên trình soạn) → **DỪNG**, báo chủ dự án danh sách khác biệt. Không đẩy đè (`clasp push` sẽ xóa/ghi đè).
5. Ghi lại số phiên bản đang chạy để quay lui: `clasp deployments` → tìm bản triển khai có URL kết thúc `…MlRA` (hỏi chủ dự án URL đầy đủ nếu không chắc) → ghi **Deployment ID** và **phiên bản hiện tại**.

### C. Đẩy và triển khai
1. `clasp push` (đẩy 3 file trong `apps-script/`).
2. `clasp version "<mã commit> <mô tả ngắn>"` → nhận số phiên bản mới N.
3. `clasp deploy -i <Deployment ID của …MlRA> -V N -d "<mã commit> <mô tả>"` — **cập nhật bản triển khai sẵn có**, KHÔNG tạo bản triển khai mới (link phải giữ nguyên).
4. Kiểm: `clasp deployments` thấy `…MlRA` đang ở phiên bản N; `curl -sL <link /exec>` trả trang có tiêu đề "Số hóa hồ sơ" (không phải trang lỗi).
5. Không chạy `setup`, không sửa Google Sheet, không bấm gì trên Web App thay người dùng.

### D. Quay lui (nếu bước C.4 lỗi hoặc chủ dự án báo hỏng)
`clasp deploy -i <Deployment ID> -V <phiên bản cũ>` → link về bản cũ ngay. Ghi lại vào SNAPSHOT.

### E. Ghi tài liệu
- `docs/SNAPSHOT.md` mục 1: "Bản đang chạy" = phiên bản N, commit, ngày; "Mã trên Apps Script khớp repo?" = Có. Mục 2a/2b: đánh dấu đã triển khai, chờ chủ dự án thử theo danh sách trong báo cáo Opus (5 bước, gồm đo thời gian lô 10 hộp).
- `CHANGELOG.md`: một dòng "Triển khai phiên bản N (commit …)".
- `HUONG_DAN_TRIEN_KHAI.md` mục D "Cập nhật mã nguồn": thêm cách triển khai bằng skill/clasp, giữ cách làm tay làm phương án dự phòng.

### F. Tạo skill `update-code-sohoa`
- Vị trí: `.claude/skills/update-code-sohoa/SKILL.md`. Sửa `.gitignore`: thay dòng `.claude/` bằng `.claude/*` và `!.claude/skills/` để skill lên GitHub (giữ `settings.local.json`, `launch.json` ngoài Git).
- Frontmatter: `name: update-code-sohoa`; `description` nói rõ: dùng khi chủ dự án nói "UpdateCodeSohoa", "cập nhật code lên Apps Script", "triển khai phiên bản mới", "deploy".
- Nội dung = các bước B → C → D → E ở trên, viết thành danh sách lệnh cụ thể; đọc `scriptId` từ `.clasp.json`; Deployment ID của `…MlRA` ghi trong skill (không phải bí mật) hoặc tra bằng `clasp deployments`. Nêu rõ các điểm **phải dừng hỏi**: thiếu GO, workspace bẩn, mock lỗi, Apps Script có thay đổi lạ, `clasp` hết hạn đăng nhập (nhờ chủ dự án `clasp login` lại).
- Thêm vào `README.md` bảng cấu trúc và `AGENTS.md` một dòng: "Triển khai lên Apps Script: dùng skill `update-code-sohoa`, không triển khai tay tùy tiện".

## Không được
- Không tạo bản triển khai mới (đổi link), không lưu trữ (archive) bản đang dùng, không đụng link `…NIQ`.
- Không commit `.clasp.json`, `~/.clasprc.json`, token. Không in token ra báo cáo.
- Không sửa mã `Code.gs`/`Index.html` trong việc này.

## Báo cáo (kênh B)
Phiên bản cũ → mới, Deployment ID (rút gọn), kết quả kiểm C.4, kết quả đối chiếu B.4, commit tài liệu + skill, việc chủ dự án cần làm tiếp (thử 5 bước). Ghi "chưa xác minh" cho mọi thứ không tự kiểm được.
