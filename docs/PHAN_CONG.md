# Phân công Developer (AI)

> Mọi việc trước khi bắt đầu phải xác định **ai làm** theo bảng dưới, và ghi tên người đang làm vào `docs/SNAPSHOT.md`.
> Nếu đang ở sai vai (ví dụ Sonnet nhận phải việc thiết kế giao diện, Antigravity nhận phải việc sửa `Code.gs`), **dừng lại, ghi vào SNAPSHOT và báo chủ dự án** để chuyển đúng người.

## Đội
| Developer | Vai trò | Làm | Không làm |
|---|---|---|---|
| **Opus** (Claude Opus) | **CTO, điều phối** | Chia việc, viết prompt giao việc (`docs/prompts/`), duyệt đề xuất, giữ tài liệu (`AGENTS.md`, `docs/`) đúng; **review** các thay đổi quan trọng; tự code **chỉ việc khó** (xem dưới) | Không tự code việc thường, việc giao diện. Không làm thay Sonnet/Antigravity nếu họ làm được |
| **Sonnet** (Claude Sonnet) | **Lập trình viên chính** | Code chức năng mức thường đến vừa trong `Code.gs` và phần logic JS của `Index.html` (gọi API, xử lý dữ liệu, kiểm tra nhập); viết kiểm thử mock; sửa lỗi | Không thiết kế lại giao diện. Không tự quyết nghiệp vụ, phân quyền, cách tính số liệu |
| **Antigravity** (Gemini Flash 3.8) | **Giao diện** | HTML/CSS, bố cục, màu, hiển thị trên điện thoại, trải nghiệm thao tác trong `Index.html` | **Không sửa `Code.gs`**. Không đổi tên hàm JS, `id`, action, trường dữ liệu. Không viết lại cả file |

## Việc nào giao ai
| Loại việc | Giao | Opus review? |
|---|---|---|
| Phân quyền, bảo mật, PIN, khóa tài khoản | **Opus** code | — |
| Cách tính số liệu Dashboard (`dash_`, tiến độ, đầu kỳ, chia công nhóm) | **Opus** code, hoặc Sonnet code + **Opus review bắt buộc** | Có |
| Đổi cấu trúc dữ liệu: cột Sheet, action mới, đổi hợp đồng `docs/API.md` | Opus thiết kế → Sonnet code | Có |
| Thay đổi quy trình nghiệp vụ (ví dụ chuẩn hóa báo cáo) | Opus/Sonnet đề xuất → **chủ dự án duyệt** → Sonnet code | Có |
| Sửa lỗi, thêm chức năng nhỏ/vừa, thêm kiểm thử | **Sonnet** | Không, trừ khi đụng các mục ở trên |
| Đổi giao diện, bố cục, màu, chữ hiển thị, trải nghiệm trên điện thoại | **Antigravity** | Không; Sonnet hoặc Opus chỉ kiểm tra không mất chức năng |
| Giao diện cần dữ liệu mới từ máy chủ | Sonnet thêm vào API trước → Antigravity vẽ sau | Theo mục API |
| Trước khi triển khai lên Apps Script bản có thay đổi lớn | **Opus review** (GO / NO-GO) | Có |

**"Việc khó"** (Opus tự làm): sai một chỗ là sai số liệu báo cáo Lãnh đạo, lộ quyền, hoặc hỏng dữ liệu thật; hoặc lỗi Sonnet đã sửa 2 lần không xong.

## Quy trình phối hợp
1. **Opus** nhận yêu cầu từ chủ dự án → xác định loại việc theo bảng → viết prompt vào `docs/prompts/PROMPT_<NGUOI>_<VIEC>.md` → ghi vào SNAPSHOT: việc, người làm, prompt.
2. **Chủ dự án** mở chat mới với đúng developer và gõ: *"Đọc `AGENTS.md`, `docs/SNAPSHOT.md` rồi làm theo `docs/prompts/<file>`."*
3. **Developer** làm, mỗi việc một commit, cập nhật SNAPSHOT trước khi dừng (kể cả dừng giữa chừng).
4. Việc cần review → chủ dự án mở chat Opus: *"Review các commit của việc <tên> theo `docs/PHAN_CONG.md`."* Opus ghi kết quả (đạt / cần sửa + danh sách) vào SNAPSHOT.
5. Antigravity sửa giao diện **sau** Sonnet trên cùng file `Index.html` → luôn kéo bản mới nhất (`git pull`), không làm song song trên cùng file.

## Quy tắc riêng cho Antigravity
- Prompt cho Antigravity phải ghi rõ: **chỉ sửa CSS/HTML tại chỗ**, giữ nguyên mọi hàm JS, `id`, `call('…')` có trong `docs/CHUC_NANG.md`.
- Sau khi Antigravity sửa: chạy `node tools/test_mock.js` và xem `git diff --stat` (`Index.html` bị xóa hàng trăm dòng là dấu hiệu viết lại cả file → không nhận).
- Trước đây giao diện bị viết lại cả file làm mất chức năng; đây là lý do có quy tắc này.
