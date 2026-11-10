# Phiếu Sonnet: DON1 (mục 29), dọn chức năng chỉ dùng một lần

**CHƯA LÀM.** Chỉ giao khi đủ điều kiện dưới đây và chủ dự án nói rõ "đồng ý dọn <tên>" (`AGENTS.md`: không xóa action nếu chưa được đồng ý). Mỗi chức năng một commit, sửa đồng bộ `Code.gs`, `Index.html`, `docs/API.md`, `docs/CHUC_NANG.md` trong commit đó.

## Điều kiện từng chức năng
| Chức năng | Điều kiện dọn |
|---|---|
| DK1 `nhapDauKyNguoi` | Phiếu xác nhận người làm đã về và đã nạp file cuối, chủ dự án xem tab Nhân sự đạt. Quá 30/11/2026 mà phiếu chưa về thì chủ dự án quyết định chốt số hiện có hay chờ tiếp. |
| F-NS-11 `chuanHoaMaHRM` | Đã Áp dụng; bấm Xem trước lần nữa ra 0 dòng đổi, 0 xung đột. |
| H3 phần dữ liệu cũ | Không vào ứng dụng ngay từ đầu, làm theo `CHUAN_PROMPT.md` mục 3c. |

## Dọn DK1
- **Xóa:** thẻ `#dkCard` và các phần tử trong đó, `dkCall`, `dkDocDan`, biến `DK_DONG`, phần vẽ kết quả; action `nhapDauKyNguoi`, `nhapDauKyNguoi_`, `dkNguoiTab_`, `DK_NGUOI_TOI_DA_`, `DK_CHUYEN_CA_`.
- **Giữ:** tab `DauKyNguoi` và dữ liệu; `TAB.DauKyNguoi`, `TEXT_COLS`, `CACHE_TABS`; `dauKyNguoiRows_` và toàn bộ phần đọc ở `thongKeNhanSu_`; các tab sao lưu trên Sheet.

## Dọn F-NS-11
- **Xóa:** action `chuanHoaMaHRM`, `chuanHoaMaHRM_`, thẻ `#maCard` và các phần tử trong đó, `maCall`, `veMaXem`.
- Không đụng `maKhopSo0_` (nằm ngay trong khối hằng của DK1 nhưng luồng thêm tổ viên đang dùng) và chỗ `read_` tự khớp mã.

## Kiểm tra (L2)
- Trước khi xóa, rà bằng tìm kiếm: mọi hàm/hằng định xóa không còn nơi nào khác dùng.
- Mock: `dash_` và `thongKeNhanSu_` so với commit ngay trước đó, có `DauKyNguoi` và không có, giống hệt.
- Gọi action đã xóa → lỗi "Hành động không hợp lệ".
- Số kiểm tra **chỉ được giảm đúng phần** của action đã xóa (ngoại lệ trong `AGENTS.md` mục 5); ghi rõ số trước/sau và số đã bỏ trong báo cáo.

Không chạy lại trên Sheet thật. Opus review gọn trước khi chủ dự án đẩy.
