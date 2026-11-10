# Chuẩn viết prompt cho Developer

> Học theo `CODEX_PROMPT_STANDARD.md` và `MASTER_START_PROMPT.md` của dự án *TTVH - Hệ thống điều hành chất lượng*, thu gọn cho dự án nhỏ này.
> **Opus (CTO) phải đọc file này trước khi viết bất kỳ prompt nào** cho Sonnet hoặc Antigravity. Ai làm gì: `docs/PHAN_CONG.md`.

## Mục lục
0. Mục tiêu CTO: điều phối + tiết kiệm quota toàn team
1. Nguyên tắc: prompt ngắn, repo là nguồn sự thật
2. Hai loại tài liệu: phiếu giao việc và prompt dán vào chat
3. Cặp developer bắt buộc ghi rõ
4. Prompt đầu tiên và prompt tiếp nối (delta)
5. Mỗi prompt một lỗi hoặc một mục tiêu
6. Mức kiểm tra L1 / L2 / L3
7. Hai kênh báo cáo
8. Opus tự duyệt khi nào
9. Chat quá dài: bàn giao sang chat mới
10. Mẫu prompt (dán dùng ngay)

---

## 0. Mục tiêu CTO: điều phối + tiết kiệm quota toàn team
Opus có hai nhiệm vụ ngang nhau: **điều phối dự án** và **tiết kiệm quota cho cả team** (Opus, Sonnet, Antigravity). Mọi quyết định giao việc phải trả lời được câu hỏi: *có cách nào rẻ hơn mà vẫn đúng không?*

| Quy tắc | Cách làm |
|---|---|
| Developer rẻ nhất làm được | Việc thường giao Sonnet, giao diện giao Antigravity. Opus chỉ làm việc khó (`PHAN_CONG.md`). |
| **Review gộp, không review từng bước** | Mỗi đợt Opus review **một lần tổng thể** ở cuối (sau khi cả Sonnet và Antigravity xong), không review từng commit. Chỉ review giữa đợt khi gặp "điểm phải dừng" ở mục 3a. |
| Sonnet tự chuyển cho Antigravity | Nếu việc của Sonnet không có điểm phải dừng, Sonnet **viết luôn prompt cho Antigravity**, không cần qua Opus (mục 3a). |
| Opus đọc tối thiểu | Khi review: đọc SNAPSHOT, báo cáo kênh B, `git log` và `git diff --stat` của đợt, rồi chỉ mở đúng các đoạn rủi ro (phân quyền, `ghi_`, `dash_`, action mới). Không đọc lại cả `Index.html`/`Code.gs`. |
| Không hỏi lại điều repo đã có | Quyết định đã ghi trong repo thì không hỏi lại chủ dự án. |
| Không dùng trình duyệt khi không cần | Antigravity: **cấm** (mục 3b). Sonnet/Opus: kiểm bằng mock và `tools/kiem_tra_giao_dien.js`; chỉ mở trình duyệt khi lỗi chỉ thấy được trên giao diện, và chỉ đúng màn hình đó. |
| Chat ngắn | Bàn giao sang chat mới sớm khi chat nặng (mục 9). Một chat cho một việc hoặc một đợt. |
| Prompt ngắn | Dưới 250 từ, trỏ về repo (mục 1); prompt tiếp nối chỉ ghi phần thay đổi (mục 4). |

## 1. Nguyên tắc: prompt ngắn, repo là nguồn sự thật
- Developer làm việc **trong thư mục dự án**, tự đọc được repo. Vì vậy prompt **không chép lại** những gì repo đã có: quy tắc trong `AGENTS.md`, chức năng trong `docs/CHUC_NANG.md`, API trong `docs/API.md`, trạng thái trong `docs/SNAPSHOT.md`, hướng dẫn commit/kiểm thử.
- Prompt dán vào chat **dưới 250 từ** (trừ khi có lý do ghi rõ).
- Quyết định của chủ dự án **chỉ có trong chat** thì phải ghi vào repo trước (SNAPSHOT mục 5 hoặc phiếu giao việc), rồi mới giao. Developer **không làm** theo một thay đổi nghiệp vụ chỉ nằm trong prompt.
- **Chặn lệch việc:** nếu việc trong prompt khác việc đang ghi trong `docs/SNAPSHOT.md`, developer phải **dừng và báo**, không tự chọn bên nào.

## 2. Hai loại tài liệu
| | Phiếu giao việc | Prompt dán vào chat |
|---|---|---|
| Nằm ở | `docs/prompts/PROMPT_<NGUOI>_<VIEC>.md` (commit vào repo) | Chỉ trong chat |
| Độ dài | Đầy đủ: bối cảnh, điểm cần sửa, phạm vi, ràng buộc, câu hỏi không được tự quyết, kiểm tra | Dưới 250 từ, trỏ tới phiếu |
| Khi nào cần | Việc lớn, nhiều bước, nhiều phiên (ví dụ chuẩn hóa báo cáo) | Luôn có |

Việc nhỏ (sửa 1 lỗi rõ ràng) **không cần phiếu**: prompt dán vào chat là đủ, nhưng vẫn ghi việc vào SNAPSHOT mục 2.

## 3. Cặp developer bắt buộc ghi rõ
Mỗi prompt có đúng **một** developer chính, tiêu đề ghi đúng một trong ba cặp:
- `Prompt cho Claude Code (Sonnet)`: code mức thường đến vừa, kiểm thử, sửa lỗi, tài liệu, Git.
- `Prompt cho Claude Code (Opus)`: việc khó (phân quyền, cách tính số liệu, đổi cấu trúc dữ liệu), lập kế hoạch nhiều phần, review.
- `Prompt cho Antigravity (Gemini)`: giao diện, bố cục, hiển thị điện thoại. Model cố định Gemini Flash 3.8.

Cặp **không tồn tại**: "Antigravity (Sonnet)", "Claude Code (Gemini)". Viết như vậy là lỗi.

Quy tắc kèm theo:
- Developer **tự làm** việc được giao. Không dừng ở bước tìm hiểu rồi viết prompt chuyển cho developer khác. **Ngoại lệ duy nhất:** Sonnet làm xong phần của mình thì viết prompt cho Antigravity theo mục 3a.
- Gặp phần ngoài vai (Sonnet gặp việc làm đẹp giao diện; Antigravity gặp việc phải sửa `Code.gs`) thì **dừng phần đó, báo lại Opus** bằng một ghi chú ngắn. Không tự chuyển việc.
- Việc lẫn cả logic và giao diện: **Sonnet làm logic và API trước**, Antigravity làm giao diện **sau** khi phần logic đã ổn.
- Việc rủi ro cao: **người code và người review phải khác nhau** (khác model hoặc khác phiên).

## 3a. Sonnet xong → tự viết prompt cho Antigravity (không qua Opus)
Mục đích: bớt một vòng Opus ở giữa. Luồng chuẩn của một đợt:
```
Sonnet code + kiểm tra → Sonnet viết prompt Antigravity → Antigravity làm giao diện → Opus review TỔNG THỂ 1 lần → chủ dự án thử link thật → triển khai
```
**Điểm phải dừng** – Sonnet KHÔNG viết prompt Antigravity mà dừng, báo Opus review trước, nếu việc của Sonnet có một trong các điều sau:
1. Đụng phân quyền, đăng nhập, PIN, khóa tài khoản.
2. Đổi cách tính số liệu Dashboard (`dash_`, tiến độ, đầu kỳ, chia công nhóm) hoặc kiểm thử so `dash_` trước/sau **khác nhau**.
3. Đổi cột Sheet, đổi nghĩa trường dữ liệu, đổi/xóa action cũ.
4. Còn lỗi mock, còn kiểm tra chưa đạt, hoặc có "rủi ro còn lại" Sonnet không tự đánh giá được.
5. Phiếu giao việc ghi rõ "Opus review trước giao diện".

Thêm action mới chỉ **bổ sung** (không đổi action cũ) và đã có kiểm thử mock thì **không** phải dừng; Opus xem trong lần review tổng thể.

Khi viết prompt Antigravity, Sonnet:
- dùng **mẫu 10.3**, dưới 250 từ, ghi rõ màn hình/khối cần làm đẹp và các `id`/hàm **không được đổi**;
- ghi vào SNAPSHOT: "Đã giao Antigravity: <việc>", kèm prompt (hoặc lưu `docs/prompts/PROMPT_ANTIGRAVITY_<VIEC>.md` nếu dài);
- đặt prompt ở **cuối báo cáo kênh B**, dưới tiêu đề `### Prompt cho Antigravity (Gemini)`.

Antigravity làm xong → chủ dự án mở chat Opus, dùng **mẫu 10.5** để review tổng thể cả đợt (code Sonnet + giao diện Antigravity) một lần.

## 3b. Quy tắc bắt buộc cho Antigravity (tiết kiệm quota)
Mọi prompt cho Antigravity **phải chép nguyên khối này**:
> KHÔNG mở trình duyệt, KHÔNG tìm kiếm web, KHÔNG chụp màn hình, KHÔNG chạy dev server hay preview. Chỉ đọc và sửa file trong thư mục dự án. Không đọc lại cả `Index.html` nhiều lần: tìm đúng đoạn cần sửa bằng tìm kiếm rồi sửa tại chỗ. Kiểm tra duy nhất được phép: `node tools/test_mock.js` và `node tools/kiem_tra_giao_dien.js`.

Chỉ được mở trình duyệt khi prompt **ghi rõ cho phép** và nêu đúng một màn hình cần xem. Nghiệm thu giao diện là việc của chủ dự án trên link thật, không phải của Antigravity.

## 4. Prompt đầu tiên và prompt tiếp nối (delta)
**Chat mới** (developer chưa biết gì): prompt phải có dòng đọc chuỗi khởi động
`AGENTS.md → docs/SNAPSHOT.md → phiếu giao việc (nếu có)`.

**Cùng chat, việc đang làm dở**: không lặp lại chuỗi khởi động. Chỉ ghi phần **thay đổi (delta)**:
- chỗ bị ảnh hưởng (màn hình, hàm, file);
- căn cứ (quyết định của chủ dự án, kết quả review);
- kết quả mong đợi nhìn thấy được;
- những gì không được đụng;
- mức kiểm tra.

Cách làm cho mọi lỗi:
`Khoanh vùng → đọc tối thiểu → xác minh nguyên nhân → sửa đúng chỗ → kiểm tra đúng phạm vi → dừng.`

Nghi developer đã mất ngữ cảnh (chat bị tóm tắt, mở lại) → cho đọc lại chuỗi khởi động, đừng đoán.

## 5. Mỗi prompt một lỗi hoặc một mục tiêu
- Chủ dự án báo nhiều lỗi độc lập → **mỗi lỗi một prompt**. Lỗi giao diện và lỗi máy chủ không gộp chung, trừ khi đã chứng minh chung một nguyên nhân.
- Chủ dự án xác nhận lỗi trước **ĐẠT** rồi mới giao lỗi sau. Các lỗi còn lại ghi ở SNAPSHOT mục 4, **không nhét thêm** vào prompt đang chạy.

## 6. Mức kiểm tra
| Mức | Khi nào | Làm gì |
|---|---|---|
| **L1** (mặc định) | Sửa một lỗi nhỏ, một chỗ | `node --check`; chạy `node tools/test_mock.js` (0 lỗi); thử đúng chỗ vừa sửa |
| **L2** | Đụng action dùng chung, `ghi_`, `dash_`, hàm dùng ở nhiều màn hình | L1 + thêm kiểm thử mock mới + đi lại bảng kiểm tra cuối `docs/CHUC_NANG.md` cho phần liên quan |
| **L3** | Trước khi triển khai lên Apps Script, thay đổi lớn, đổi phân quyền hoặc số liệu | L2 + đủ bảng kiểm tra 4 vai trò + **Opus review GO/NO-GO** + danh sách thử bằng tay cho chủ dự án |

Muốn dùng mức cao hơn L1 thì ghi **một câu lý do** trong prompt.

**Kiểm tra kỹ thuật ≠ chủ dự án nghiệm thu.** Developer chạy mock, thử bằng trình duyệt chỉ là bằng chứng kỹ thuật. Thay đổi **nhìn thấy trên giao diện** chỉ ĐẠT khi chủ dự án tự xem trên link thật. Developer không tự tuyên bố "chủ dự án đã duyệt".

## 7. Hai kênh báo cáo
### Kênh B: Developer → Opus ("Báo cáo kỹ thuật")
Viết đủ để Opus kiểm lại được, không kể lể từng bước. Chỉ dùng mục nào có nội dung:
- **Kết quả**: xong / chưa xong / bị chặn.
- **Nguyên nhân / bằng chứng**: chỉ khi có lỗi. Chưa chứng minh được thì ghi `CHƯA CHỨNG MINH NGUYÊN NHÂN`, không đoán.
- **Thay đổi**: file, hàm, tác dụng.
- **Kiểm tra**: lệnh đã chạy và kết quả thật (ví dụ `mock 196/0`), không chỉ ghi "đạt".
- **Rủi ro còn lại**: chỉ khi có thật.
- **Git**: commit, đã push chưa.

Độ dài khoảng 100–250 từ cho việc đơn giản, 250–500 từ cho lỗi thật có nguyên nhân. Developer **không viết** prompt cho developer khác trong báo cáo, **trừ** Sonnet viết prompt cho Antigravity theo mục 3a.

Antigravity thêm (khi liên quan): màn hình/khối nào đã đổi, đổi gì (mô tả bằng lời, **không chụp màn hình**), những `id`/hàm đã giữ nguyên, kết quả hai lệnh kiểm tra. Không kết luận nguyên nhân phía máy chủ khi không có bằng chứng.

### Kênh A: Opus → chủ dự án
Opus đọc báo cáo kỹ thuật, tự quyết phần thuần kỹ thuật, rồi trả lời chủ dự án **đúng 3 phần**:
1. `### Phân tích kết quả`: dưới 5 câu, ngôn ngữ quản lý, không tên hàm, không đường dẫn file. Chuyện gì xảy ra, ảnh hưởng tới người dùng, tiến độ hay bị chặn.
2. `### Phương án`: dưới 5 câu. Làm gì tiếp, ai làm, kết quả mong đợi, khi nào kiểm tra lại.
3. **Đúng một** trong:
   - `### Prompt cho Claude Code (Sonnet)` / `### Prompt cho Claude Code (Opus)`
   - `### Prompt cho Antigravity (Gemini)`
   - `### Yêu cầu chủ dự án quyết định`

Chỉ hỏi chủ dự án về: quy tắc nghiệp vụ, hành vi sản phẩm, cách tính số liệu, tiêu chí nghiệm thu, hướng đi. Câu hỏi thuần kỹ thuật thì Opus tự quyết.

Review thấy lỗi sửa được trong việc đang làm → Opus **viết ngay** prompt sửa cho đúng developer, không dừng ở việc báo lỗi.

## 8. Opus tự duyệt khi nào
Opus được tự chốt **ĐẠT** một báo cáo kỹ thuật mà không hỏi chủ dự án **chỉ khi đủ cả 4 điều**:
1. Chỉ làm phần kỹ thuật chủ dự án đã duyệt, không tự đặt quy tắc nghiệp vụ mới.
2. Không đụng giao diện (giao diện luôn cần chủ dự án tự xem).
3. Không tăng rủi ro vận hành (không triển khai, không ghi vào Sheet thật).
4. Không đổi cột Sheet hay ý nghĩa số liệu.

Thiếu một điều → hỏi chủ dự án. Phân vân → coi như không được tự duyệt. Việc của Antigravity **không bao giờ** được tự duyệt.

## 9. Chat quá dài: bàn giao sang chat mới
> **Bắt buộc (chủ dự án yêu cầu 10/11/2026):** Opus **tự theo dõi và tự báo**, không chờ chủ dự án nhắc. Mỗi lượt tương tác trong chat dài đọc lại toàn bộ lịch sử nên tốn quota hơn một chat mới đọc từ repo. Khi thấy dấu hiệu dưới đây, cuối câu trả lời phải có mục **"### Chuyển chat CTO mới"** gồm lời báo ngắn + prompt mở đầu chat mới (mẫu 10.1, điền sẵn) trong khối code. Sonnet/Antigravity cũng tự báo theo cách tương tự khi chat của mình quá dài.

Dấu hiệu: đã xong nhiều việc trong cùng chat, kết quả dán vào quá dài, phải đọc lại tài liệu đã đọc, khó phân biệt quyết định cũ và mới, hệ thống báo đã tóm tắt hội thoại. Không bịa con số token.

Khi thấy dấu hiệu, chủ động làm 4 bước:
1. Báo chủ dự án 1–2 câu: chat đã nặng, nên chuyển sang chat mới, không mất gì.
2. **Ghi mọi thứ chỉ có trong chat vào repo** (SNAPSHOT, phiếu giao việc): quyết định, kết quả review, bước tiếp theo. Commit, push.
3. Đưa **prompt mở đầu chat mới** (mẫu 10.1) trong một khối code, điền sẵn.
4. Dừng ở chat cũ. Không chạy hai chat Opus song song.

Không bàn giao giữa chừng một bước làm repo dở dang (file sửa một nửa, chưa commit). Chat còn gọn thì không nhắc chuyển.

---

## 10. Mẫu prompt

### 10.1 Mở đầu chat Opus (CTO) mới
```text
Bạn là Opus – CTO dự án "Báo cáo ca Số hóa hồ sơ" (repo D:\Antigravity - Project\Claude - SỐ HÓA HỒ SƠ, GitHub tntTan2292/TTVH-Sohoahoso, nhánh main).
Vai trò: điều phối, viết prompt, review; chỉ tự code việc khó (docs/PHAN_CONG.md).

Đọc theo thứ tự: AGENTS.md → docs/SNAPSHOT.md → docs/CHUAN_PROMPT.md → docs/PHAN_CONG.md.
Không đọc lại toàn bộ lịch sử chat cũ.

Commit mới nhất trên GitHub: <mã commit>
Việc đang làm: <mục SNAPSHOT 2x>, đang ở bước <...>, developer <...>
Quyết định của chủ dự án trong chat trước (đã ghi ở <file/mục>): <... hoặc "Không">
Đang chờ: <báo cáo của Sonnet/Antigravity | quyết định chủ dự án | không>

Việc tiếp theo: <một câu>.
Trả lời theo kênh A (Phân tích kết quả / Phương án / đúng một prompt hoặc yêu cầu quyết định).
```

### 10.2 Prompt cho Claude Code (Sonnet), chat mới
```text
### Prompt cho Claude Code (Sonnet)
DỰ ÁN: Báo cáo ca Số hóa hồ sơ
VIỆC: <mã việc / mục SNAPSHOT>, <tên ngắn>

Đọc: AGENTS.md → docs/SNAPSHOT.md → <docs/prompts/<phiếu>.md | "không có phiếu">.

Mục tiêu: <kết quả nhìn thấy được, 1–2 câu>
Quyết định chủ dự án chưa có trong repo: <... | Không>
Phạm vi: chỉ <file/hàm>. Không đụng: <...>.
Mức kiểm tra: L1 | L2 (<lý do>) | L3 (<lý do>)

Tự làm việc này, không chuyển cho developer khác. Gặp phần giao diện cần làm đẹp, hoặc quy tắc nghiệp vụ chưa rõ: dừng phần đó, ghi SNAPSHOT, báo lại.
Xong: commit (ghi mã việc), push, cập nhật SNAPSHOT + CHANGELOG. Báo cáo theo kênh B (docs/CHUAN_PROMPT.md mục 7).
```

### 10.3 Prompt cho Antigravity (Gemini), chat mới
```text
### Prompt cho Antigravity (Gemini)
DỰ ÁN: Báo cáo ca Số hóa hồ sơ
VIỆC: <mã việc>, <tên ngắn>

Đọc: AGENTS.md → docs/SNAPSHOT.md → docs/CHUC_NANG.md (mục <...>).

Mục tiêu giao diện: <màn hình, kết quả nhìn thấy được; khổ 360px và máy tính>
Giữ nguyên (không đổi tên/xóa): <các id, hàm liên quan>
Chỉ sửa HTML/CSS trong apps-script/Index.html, sửa tại chỗ. KHÔNG sửa Code.gs.
KHÔNG viết lại cả file. KHÔNG đổi tên hàm JS, id, call('...'), trường dữ liệu.
Cần thêm dữ liệu hoặc logic từ máy chủ: dừng, báo lại, không tự làm.

KHÔNG mở trình duyệt, KHÔNG tìm kiếm web, KHÔNG chụp màn hình, KHÔNG chạy dev server hay preview. Chỉ đọc và sửa file trong thư mục dự án. Không đọc lại cả Index.html nhiều lần: tìm đúng đoạn rồi sửa tại chỗ.

Kiểm tra (duy nhất): node tools/test_mock.js (0 lỗi) và node tools/kiem_tra_giao_dien.js (0 lỗi); git diff --stat không xóa hàng loạt dòng Index.html.
Xong: commit, push, cập nhật SNAPSHOT. Báo cáo kênh B: khối đã đổi (mô tả bằng lời), id/hàm đã giữ, kết quả 2 lệnh kiểm tra.
```

### 10.4 Prompt tiếp nối (delta) trong cùng chat
```text
### Prompt cho <Claude Code (Sonnet) | Antigravity (Gemini)>
Delta cho việc <mã việc>:
- Chỗ: <màn hình / hàm>
- Căn cứ: <quyết định chủ dự án / kết quả review>
- Mong đợi: <kết quả nhìn thấy được>
- Không đụng: <...>
- Mức kiểm tra: L1
Khoanh vùng → đọc tối thiểu → xác minh nguyên nhân → sửa đúng chỗ → kiểm tra → dừng. Báo cáo kênh B.
```

### 10.5 Prompt cho Claude Code (Opus) review (tổng thể cuối đợt)
```text
### Prompt cho Claude Code (Opus)
Review TỔNG THỂ đợt <tên đợt> của việc <mã việc> (code Sonnet + giao diện Antigravity), commit <từ>..<đến>, theo docs/PHAN_CONG.md và docs/CHUAN_PROMPT.md mục 0.
Đọc tối thiểu: docs/SNAPSHOT.md → báo cáo kênh B của Sonnet/Antigravity → git log + git diff --stat của đợt → chỉ mở các đoạn rủi ro.
Tập trung: <số liệu Dashboard | phân quyền | API | mất chức năng>.
Kết luận: ĐẠT / CẦN SỬA (danh sách, mỗi mục có kịch bản lỗi cụ thể) / CHẶN.
Ghi kết quả vào SNAPSHOT, commit, push. Có mục CẦN SỬA thì viết luôn prompt delta cho Sonnet (mẫu 10.4).
```
