# Báo cáo ca Số hóa hồ sơ – Bưu điện TP Huế

Hệ thống báo cáo sản lượng số hóa hồ sơ tại Trung tâm Lưu trữ TP Huế: Scan → Tách file PDF → OCR, mục tiêu 175.000 tờ mỗi khâu, 3 ca/ngày. Chạy trên **Google Apps Script (Web App)** gắn với một Google Sheet làm cơ sở dữ liệu.

## Cấu trúc
| Đường dẫn | Nội dung |
|---|---|
| `apps-script/Code.gs` | Backend: đăng nhập PIN, Vào ca, báo cáo, chốt ca, phân quyền, nhật ký, dashboard |
| `apps-script/Index.html` | Giao diện (một file HTML + CSS + JS) |
| `apps-script/appsscript.json` | Cấu hình dự án Apps Script (múi giờ, kiểu Web App) |
| `tools/build_khoi_tao.py` | Tạo file khởi tạo Google Sheet từ danh sách nhân sự (không lấy CCCD/SĐT) |
| `tools/test_mock.js` | Kiểm thử bằng mock, không cần Google: `node tools/test_mock.js` |
| `HUONG_DAN_TRIEN_KHAI.md` | Hướng dẫn triển khai, vận hành, bảo mật |
| `PROMPT_*.md` | Prompt giao việc cho các công cụ AI (giao diện, review, sửa lỗi) |

## Triển khai nhanh
Xem `HUONG_DAN_TRIEN_KHAI.md`: tạo Google Sheet từ file khởi tạo, dán `Code.gs` và `Index.html` vào Apps Script, chạy `setup`, triển khai Web App.

## Không có trong kho mã
Các tệp chứa dữ liệu cá nhân hoặc mật khẩu được loại khỏi Git (`.gitignore`): file Excel khởi tạo (tên, Mã HRM, PIN tạm), danh sách tài khoản, thư mục `backup/`, `TaiLieu/`. Liên hệ chủ dự án để lấy khi cần.
