# Phiếu Sonnet: Đợt TH1 – Nhận từ TTLT / Trả cho TTLT (mục 33, 34, 35)

Người nhận: **Sonnet**. Phương án chốt: `docs/DE_XUAT_TRA_HOP.md` **mục 9** (chủ dự án đã trả lời Q-A…Q-E ngày 15/11/2026; mục 9 thay mục 8 ở chỗ khác nhau). Gốc so sánh: `790a840`.

## Việc (một việc một commit)
**F-TH-01 – Đối soát: trạng thái, 2 cột, tô đỏ (mục 33)**
- `hopTrangThai_` đúng thứ tự 6 bước ở mục 9 (không xét OCR). Thêm mã `DA_TRA`; đổi nhãn theo mục 9 (giữ mã cũ). Cập nhật `HOP_TT_`, `DS_TT`, `DS_CHIP`.
- `hopHoSo_` giữ thêm `ghiChu` của lần nhận/trả sớm nhất; `hopBanGhi_` trả `nhan` và `tra` cùng dạng `{ngay, ca, nguoi, ghiChu}` (tên qua `ns`). Không lộ `k`/`tg`.
- Bảng: hai cột **NHẬN TỪ TTLT** và **TRẢ CHO TTLT** (ngày · ca · người, ghi chú dòng nhỏ, qua `esc()`); giữ cột OCR. Dòng `TRA_SOM`, `DA_TRA`, `THIEU_NHAN`, `XONG_CHUA_TRA` **nền đỏ** (một class, Antigravity chỉnh màu). CSV đủ ngày/ca/người/ghi chú cho cả hai.

**F-TH-02 – Gợi ý, điền nhanh, cảnh báo (mục 34)**
- `hopGoiY_`: `TRA` = hộp Tách xong, chưa `TRA`; thêm nhánh `NHAN` = hộp có bản ghi còn hiệu lực, chưa `NHAN`. Nhánh khác giữ nguyên.
- Form Nhận/Trả: nút **"Điền tất cả hộp gợi ý (N)"** (mỗi mã một dòng, tối đa 200). Ô ghi chú khi Trả gợi ý "Số biên bản / người nhận bên TTLT".
- Quản lý ca (TT/TP/ADMIN): **thanh cảnh báo đỏ** "N hộp chưa có Nhận từ TTLT · M hộp Tách xong chưa Trả cho TTLT", bấm mở Đối soát đã lọc. Lấy từ `hopGoiY`, không thêm action.

**F-TH-03 – Quản lý nhập bổ sung ngay trong Đối soát (mục 35)**
- Chỉ TT/TP/ADMIN (ẩn với Lãnh đạo): ô tick ở dòng đỏ; nút **"Ghi Nhận từ TTLT"** (cho dòng thiếu nhận) và **"Ghi Trả cho TTLT"** (cho dòng Tách xong chưa trả).
- Hộp xác nhận tự vẽ (kiểu XN1): chọn ngày (≤ hôm nay) + ca, hiện số hộp. Riêng Nhận có lựa chọn **"Theo ngày/ca nhóm nhận của từng hộp"** (thiếu thì ngày làm đầu tiên) → gom theo ngày/ca.
- Gọi `ghi_` sẵn có: ngày hôm nay + ca đang mở → báo thường; khác → `boSung`. Mỗi lần ≤ 200 mã, gọi lần lượt; xong tải lại Đối soát, hiện cảnh báo máy chủ.

## Ràng buộc
- `dash_`, `ghi_`, cột Sheet, action, `Buoc`: **không đổi**. Mock so `dash_` với `790a840` (mọi ngày, có/không `gomThu`) giống hệt.
- Mock thêm: 6 nhánh trạng thái (có hộp OCR chưa xong vẫn `DU`); `nhan`/`tra` có người + ghi chú; gợi ý `TRA`/`NHAN`; ghi Nhận bổ sung theo ngày nhóm nhận ra đúng ngày/ca, Loai `BỔ SUNG`; Lãnh đạo ghi bị chặn.
- Ghi `docs/CHUC_NANG.md` (kèm quy chuẩn Q-D: tick "Xong hộp" ở Tách = đã giao hộp cho Quản lý), `docs/API.md` (trường `nhan`/`tra`, mã `DA_TRA`) cùng commit.

## Xong
Viết phiếu Antigravity (mẫu 10.3: màu nền đỏ, hai cột, thanh cảnh báo, ô tick + hộp chọn ngày/ca). Cập nhật SNAPSHOT, CHANGELOG, `docs/TIEN_DO_PO.md` mục 33–35. Báo cáo kênh B.
