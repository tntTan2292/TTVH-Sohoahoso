`apps-script/Code.gs` và `Index.html` kèm theo đã sửa xong (mock `node tools/test_mock.js`: 172/172). Kiểm tra lại (`node --check` + mock) rồi triển khai. Thay đổi so với phiên bản 12:

1. Dashboard lọc theo ngày (`Index.html`):
   - Thêm nút "◀ Ngày trước / Hôm nay / Ngày sau ▶" (`#dTruoc`, `#dHomNay`, `#dSau`).
   - Đổi ngày ở `#dNgay` là tự tải lại; `max` = hôm nay, không xem ngày tương lai.
   - Dòng `#dThu` ghi thứ, ngày và "hôm nay" hoặc "đang xem lịch sử".
   - Dãy nút các ngày gần đây có dữ liệu (`#dNgayCo`, lấy từ `d.series`, tối đa 14 ngày) để bấm chọn nhanh.
2. `Code.gs`:
   - Thêm `onEdit(e)`: khi sửa tay trực tiếp trên Sheet ở các tab trong `CACHE_TABS` thì gọi `cacheBump_` để web thấy ngay.
   - TTL cache tab giảm từ 600 xuống 300 giây.

Triển khai: KHÔNG tạo deployment mới. Có **2** bản triển khai đang hoạt động (link …MlRA và link …NIQ); cả hai đều phải chuyển sang phiên bản mới qua Quản lý triển khai → ✏️ → Phiên bản mới → Triển khai, giữ nguyên link. Báo kết quả tối đa 5 dòng.
