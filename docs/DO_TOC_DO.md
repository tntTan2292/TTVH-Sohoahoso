# Đo tốc độ và đề xuất tối ưu (T2, mục 18)

> **Trạng thái: đã đo trên mock (đếm số lần gọi), CHƯA tối ưu, CHƯA có số mili-giây thật.** Số ms thật chỉ lấy được trên link chính: ADMIN bật "Chế độ đo" rồi dùng thử (hướng dẫn ở mục 1). Opus review bảng này rồi mới làm phần đụng cách đọc/ghi `NhatKy` hoặc khóa.

## 1. Cách đo (đã có trong mã, mặc định TẮT)
- **Máy chủ** (`Code.gs`): `api()` chỉ đo khi **ADMIN** gửi `do:true` (người khác gửi cũng không nhận gì). Đo: `auth` (xác thực), `khoa` (đợi khóa chung `waitLock`), `doc:<tab>` (đọc tab, gồm đệm), `sheet:<tab>` (đọc thật từ Sheet), `ghi:<tab>` (mỗi lần ghi), `log` (nhật ký hệ thống), `tong`. Kết quả trả kèm `{ok, data, do:{action, tong, phan}}`; **không ghi gì thêm** vào Sheet/nhật ký, không đổi `data`.
- **Trình duyệt** (`Index.html`): tab **Dữ liệu → "Chế độ đo tốc độ"** (chỉ ADMIN). Bật → mọi lệnh của chính ADMIN gửi thêm `do:true`; bảng gom theo lệnh: số lần, máy chủ TB, **vòng gửi–nhận TB**, "ngoài máy chủ" = vòng − máy chủ (đường truyền + hàng đợi Google), xác thực / đợi khóa / đọc / ghi / nhật ký. Nút "Sao chép bảng" dán vào báo cáo.
- **Việc chủ dự án / Opus làm sau khi triển khai:** ADMIN bật đo, làm lần lượt: Nhận hộp, Báo cáo một hộp, Báo cáo bảng nhiều hộp (3 hộp), Xem Dashboard, Xem nhật ký; sao chép bảng gửi lại. Nếu muốn đo lúc nhiều người dùng, nhờ vài người cùng bấm trong khi ADMIN đo (cột "Đợi khóa" sẽ lộ ra).

## 2. Số lần đọc / ghi Sheet của từng lệnh (mock, 492 dòng `NhatKy`)
Đếm bằng chính bộ đo ở mục 1 (đối chiếu với bộ đếm độc lập của mock — khớp). "Lạnh" = bộ nhớ đệm trống (lượt gọi đầu), "ấm" = ngay lượt sau. `NhatKy` **không nằm trong `CACHE_TABS`** nên luôn đọc cả tab; `NhanSu`/`PhanCa`/`PhanNhom`/`ChotCa`/`DauKy`/`DonVi` có đệm 5 phút.

| Lệnh | Đọc Sheet (lạnh) | Đọc Sheet (ấm) | Ghi Sheet | Nhật ký (`log_`) | Khóa |
|---|---|---|---|---|---|
| `me` | PhanCa, ChotCa | – | – | – | không |
| `hopGoiY` | **NhatKy** (cả tab) | – (đệm trong lượt) | – | – | không |
| `lichSu` | PhanNhom, **NhatKy** | – | – | – | không |
| `dashboard` | **NhatKy**, PhanNhom, DauKy, PhanCa, ChotCa | – | – | – | không |
| `ghi` (1 hộp) | PhanNhom, NhanSu, **NhatKy** | PhanNhom, NhanSu, **NhatKy** | NhatKy ×1, LogHeThong ×1 | 1 | **có** |
| `ghiLo` (3 hộp) | PhanNhom, NhanSu, **NhatKy** | – (kết quả cũ) | NhatKy ×3, LogHeThong ×4 | 4 | **có** |

Ghi chú: "ấm" của `ghi` vẫn đọc vì mọi lệnh ghi qua `withLock_` mở đầu bằng `memoClear_()` (xóa bộ nhớ trong lượt, đúng chủ ý để không đọc nhầm dữ liệu cũ). Mỗi lần `append_` là một chuỗi lệnh Sheet (`getLastRow`, `getRange`, `getNumberFormats`, `setNumberFormats`, `setValues`); `ghiLo` 3 hộp = **7 lần ghi riêng lẻ**, 4 lần trong đó là nhật ký.

## 3. Bảng đề xuất (xếp theo lợi ích ÷ rủi ro; chưa làm)
| # | Đề xuất | Lợi ích dự kiến | Rủi ro | Cách kiểm |
|---|---|---|---|---|
| 1 | **`ghiLo_`: ghi một lần.** Gom 3 dòng NhatKy vào `appendMany_` và gộp 3–4 dòng `log_` thành 1 lần `appendMany_` LogHeThong. 7 lần ghi → 2. | **Cao** cho bảng nhiều hộp (người dùng hay bấm nhất) | Thấp–vừa (đổi thứ tự ghi trong lô; vẫn trong khóa; `idLo` giữ nguyên) | Mock: kết quả `ghiLo` giống hệt, số dòng ghi giống hệt, số lần ghi giảm |
| 2 | **Bớt lệnh định dạng trong `append_`**: bỏ `getNumberFormats` + `setNumberFormats` mỗi lần ghi, thay bằng đặt định dạng văn bản cho cả cột một lần (`setup`/lần đầu). Mỗi `append_` giảm khoảng 2 trong 5 lệnh. | Vừa–cao (mọi lệnh ghi) | **Vừa**: Sheet cũ có thể chưa đặt định dạng cột → mã hộp `02.01.85` bị đổi thành ngày (lỗi cũ đã từng gặp). Phải kiểm định dạng cột trước | Đọc định dạng 1 ô cột `MaHop`/`Ngay`; chỉ bỏ khi đã là văn bản; mock có giả lập |
| 3 | **`log_` không tự đọc `NhanSu` + tính ca mỗi lần** (truyền sẵn tên/vai trò/ca từ lệnh gọi). Nay mỗi `log_` đọc NhanSu (đệm) và quét `CA_LIST`. | Thấp–vừa (CPU, không phải lệnh Sheet) | Thấp | Mock: nội dung nhật ký giống hệt |
| 4 | **Đệm kết quả `dash_` theo (ngày, gomThu) ~20–30 giây, đổi phiên bản khi có ghi `NhatKy`/`PhanNhom`/`PhanCa`/`ChotCa`.** Widget tiến độ mỗi người mở 60 giây/lần, Dashboard nhiều người xem → đọc cả 5 tab mỗi lần. | **Cao khi nhiều người xem** (giảm tải Sheet và hàng đợi) | Vừa: phải bảo đảm không trả số cũ sau khi ghi (dùng cùng cơ chế `ver_`); kết quả > 100 KB không nhét được vào CacheService (hiện `dash_` nhiều ngày có thể lớn) | Mock: sau mỗi lệnh ghi, `dash_` luôn bằng tính mới; so trước/sau |
| 5 | **Chỉ đọc phần cuối `NhatKy`** cho lệnh trong ngày (`ghi_` kiểm trùng/đã XONG, `hopGoiY_`, `lichSu_` hôm nay): đọc `getRange` N dòng cuối thay vì cả tab; nếu hộp không xuất hiện trong phần cuối thì đọc đủ. | **Cao nhưng tăng theo thời gian** (NhatKy chỉ lớn lên theo thời gian; chưa có số dòng thật để ước) | **Cao**: kiểm tra "đã Scan xong ở ngày trước", gợi ý hộp tồn, hộp nhận từ nhiều ngày trước đều cần lịch sử | Cần Opus thiết kế (chỉ mục theo hộp?). **Không làm khi chưa có số đo thật** |
| 6 | **Đệm `NhatKy` theo phiên bản** (đưa vào `CACHE_TABS`). Bị chặn: CacheService giới hạn ~100 KB/mục, NhatKy vượt rất sớm (dùng cách chia khúc hoặc chỉ đệm khúc "tháng này"). | Vừa | Vừa–cao (nhiều khúc, dễ lệch phiên bản) | Chỉ làm nếu đo cho thấy đọc `NhatKy` chiếm phần lớn thời gian |
| 7 | **Thu hẹp vùng khóa của `ghi`/`ghiLo`:** kiểm tra hợp lệ (phân quyền, ca mở, nhóm) ngoài khóa; trong khóa chỉ làm "kiểm lại trùng + ghi". Khóa hiện giữ cả lúc đọc `NhatKy` + kiểm tra. | Cao khi nhiều người bấm cùng lúc (cột "Đợi khóa") | **Cao**: dễ lọt kiểm tra trùng/đã XONG giữa hai lệnh; cần thiết kế lại thứ tự | Chỉ làm sau khi bảng đo thật cho thấy "Đợi khóa" lớn; Opus thiết kế |
| 8 | **Bỏ lệnh đọc thừa sau khi ghi ở giao diện** (dùng luôn kết quả trả về thay vì gọi lại `hopGoiY`/`nhatKy`/`me`). | Vừa (mỗi lượt gọi thêm ~1–2 giây vì `google.script.run`) | Thấp–vừa (giao diện) | Kiểm bằng trang giả lập; không đổi API |

## 4. Đề xuất thứ tự làm sau khi có số đo thật
1. Nếu "ngoài máy chủ" (vòng − máy chủ) **lớn nhất** → đề xuất 8 (bớt số lượt gọi) và T1 đã che bằng lớp chờ; tối ưu máy chủ ít tác dụng.
2. Nếu "ghi Sheet"+"nhật ký" lớn → đề xuất 1, rồi 2, 3.
3. Nếu "đọc Sheet" của NhatKy lớn → đề xuất 4 (cho người xem), 5/6 (cho người ghi) — cần Opus thiết kế.
4. Nếu "đợi khóa" lớn lúc nhiều người → đề xuất 7 (sau 1–3, vì rút ngắn thời gian giữ khóa bằng 1–3 giảm hàng đợi trước).

## 5. Không đụng trong T2
Không đổi cách đọc/ghi `NhatKy`, khóa, định dạng cột, cột/tab Sheet, cách tính số liệu. T2 chỉ thêm bộ đo (tắt mặc định) và tài liệu này.
