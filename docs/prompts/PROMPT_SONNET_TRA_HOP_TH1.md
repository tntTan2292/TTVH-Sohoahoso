# Phiếu Sonnet: Đợt TH1 – Trả hộp / Nhận TTLT (mục 33, 34, 35)

Người nhận: **Sonnet**. Opus duyệt có điều kiện ngày 15/11/2026, phương án chốt ở `docs/DE_XUAT_TRA_HOP.md` **mục 8** (đọc kỹ mục 8.1). Gốc so sánh: `790a840`.

## Việc (một việc một commit)
**F-TH-01 – Đối soát: trạng thái + cột Trả TTLT (mục 33)**
- `hopTrangThai_` theo đúng thứ tự 6 bước ở mục 8.1 điểm 6; thêm mã `DA_TRA` "Đã trả, chưa đủ"; đổi nhãn `XONG_CHUA_TRA` thành "Tách xong, chưa trả" (giữ mã). Cập nhật `HOP_TT_`, `DS_TT`, `DS_CHIP`.
- `hopHoSo_` giữ thêm `ghiChu` của lần trả sớm nhất; `hopBanGhi_` trả `tra: {ngay, ca, nguoi, ghiChu}` (tên người qua `ns`) và ghi chú thiếu gì cho `DA_TRA`. Không lộ `k`/`tg`.
- `Index.html` đối soát: cột Trả hiện ngày · ca · người (ghi chú dạng dòng nhỏ, qua `esc()`); CSV thêm Ca trả, Người trả, Ghi chú trả. Khung thô, để Antigravity làm đẹp.

**F-TH-02 – Gợi ý + điền nhanh + nhắc (mục 34)**
- `hopGoiY_`: `TRA` = hộp **Tách xong (HetHop) và chưa `TRA`** (không đòi `NHAN`, không đòi OCR); thêm nhánh `NHAN` = hộp có bất kỳ bản ghi còn hiệu lực, chưa `NHAN`, chưa `TRA`. Các nhánh khác giữ nguyên.
- Form Nhận TTLT / Trả hộp (ô dán mã): nút **"Điền tất cả hộp gợi ý (N)"** điền danh sách vào ô mã, mỗi mã một dòng, tối đa 200 (quá thì điền 200 đầu và báo). Hộp xác nhận gửi giữ như cũ. Ô ghi chú khi `TRA` có gợi ý "Số biên bản / người nhận bên TTLT". Chạy được cả ở chế độ Bổ sung.
- Quản lý ca (chỉ TT/TP/ADMIN): một dòng nhắc "N hộp đã Tách xong chưa trả TTLT · M hộp chưa có Nhận TTLT", bấm mở đúng form. Lấy từ `hopGoiY`, không thêm action, không đụng `dash_`.

**F-TH-03 – Tập lệnh bù `NHAN` một lần (mục 35) – ĐIỂM PHẢI DỪNG**
- `xemTruocBuNhan()` + `apDungBuNhan()` theo đúng mục 8.1 điểm 3 và `CHUAN_PROMPT.md` 3c. Áp dụng gọi lại xem trước trong cùng khóa, ghi `appendMany_`, `log_` từng hộp. Xem trước in: số hộp, phân bổ theo ngày/ca, 10 dòng mẫu (không in PIN/tên ngoài cần thiết).
- **Chỉ viết + mock, KHÔNG chạy trên Sheet thật.** Chủ dự án chạy sau khi trả lời Q-C.

## Ràng buộc
- `dash_` không đổi dòng nào; mock so `dash_` với `git show 790a840:apps-script/Code.gs` (mọi ngày, có/không `gomThu`) **giống hệt**.
- `ghi_` không đổi (quyền, bỏ qua trả lần hai, cảnh báo giữ nguyên). Không thêm cột, không thêm action, không thêm `Buoc`.
- Mock thêm kiểm tra: đủ 6 nhánh trạng thái; gợi ý `TRA`/`NHAN`; bù `NHAN` chọn đúng hộp, ngày/ca đúng mốc, chạy lần hai không tạo trùng, bỏ THỬ NGHIỆM/hủy, biến thể mã H1.
- Ghi `docs/CHUC_NANG.md` cùng commit; `docs/API.md` nếu đổi trường trả về.
- Q-D, Q-E chưa trả lời: dùng mặc định ở mục 8.2. Chủ dự án trả lời khác → dừng phần đó, báo.

## Xong
Viết phiếu Antigravity (mẫu 10.3: nút điền nhanh, chip `DA_TRA`, cột Trả TTLT, dòng nhắc Quản lý ca). Cập nhật SNAPSHOT, CHANGELOG, `docs/TIEN_DO_PO.md` mục 33–35. Báo cáo kênh B, nêu rõ F-TH-03 chưa chạy.
