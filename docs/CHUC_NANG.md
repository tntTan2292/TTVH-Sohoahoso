# Sổ đăng ký chức năng (KHÔNG ĐƯỢC LÀM MẤT)

> Đây là danh sách **mọi chức năng đang chạy**. Trước khi sửa bất kỳ file nào, đọc mục liên quan. Sau khi sửa, đi lại **bảng kiểm tra** ở cuối file.
> Thêm chức năng mới = thêm một dòng vào đây **trong cùng commit**. Bỏ một chức năng = phải được chủ dự án đồng ý và ghi vào `CHANGELOG.md`.
>
> Cột **Mã** dùng để nhắc tới chức năng trong commit, prompt và CHANGELOG (ví dụ "sửa F-BC-04").
> Cột **Backend** là hàm trong `apps-script/Code.gs`; cột **Giao diện** là hàm/`id` trong `apps-script/Index.html`.

Cập nhật lần cuối: 09/11/2026 — phiên bản 13 + F-QL-10, F-BC-18, F-BC-19, F-QL-11 (chưa triển khai), mock 242 đạt / 0 lỗi.

---

## 1. Vai trò và tab được thấy

| Vai trò | Tab thấy (`start()` trong Index.html) | Ghi chú |
|---|---|---|
| `TOVIEN` | Báo cáo | **Không** có Dashboard (server cũng chặn `dashboard`) |
| `TOTRUONG`, `TOPHO` | Báo cáo, Quản lý ca, Dashboard | `isAdmin = true` |
| `LANHDAO` | Dashboard | Chỉ được gọi `me`, `dashboard`, `doiPin`, `lichSu` |
| `ADMIN` | Báo cáo, Quản lý ca, Nhân sự, Dữ liệu, Nhật ký, Dashboard | `isSuper = true`; **không vào ca** |

Tab trong giao diện: `pBao`, `pQL`, `pNS`, `pDL`, `pLG`, `pDash` (hàm `showTab`).

---

## 2. Đăng nhập và tài khoản (F-DN)

| Mã | Chức năng | Backend | Giao diện |
|---|---|---|---|
| F-DN-01 | Danh sách tên đăng nhập công khai (chỉ mã, tên, đơn vị; sắp theo đơn vị; bỏ người nghỉ) | `dsLogin` | `renderLoginSelect`, `#lgSearch`, `#lgUser` |
| F-DN-02 | Đăng nhập tên + PIN, trả token | `login` → `login_` | `#lgPin`, `#lgBtn`, `#lgMsg` |
| F-DN-03 | Sai 5 lần → tạm khóa 15 phút (không đặt cột `Khoa`) | `login_`, `KHOA_PIN_GIAY` | thông báo lỗi |
| F-DN-04 | Sai cộng dồn 20 lần → khóa hẳn (`Khoa = TRUE`) | `login_`, `MAX_SAI_PIN_TICH_LUY` | thông báo lỗi |
| F-DN-05 | Buộc đổi PIN lần đầu (server chặn mọi action trừ `me`, `doiPin`) | `api`, `auth_` | `#vPin`, `#npin`, `#npin2`, `#pinBtn` |
| F-DN-06 | Cấm PIN dễ đoán (lặp, liên tiếp, nửa lặp, danh sách phổ biến, trùng đuôi Mã HRM) | `pinYeu_`, `PIN_YEU` | thông báo lỗi |
| F-DN-07 | PIN băm SHA-256 + muối | `hash_` | — |
| F-DN-08 | Cấp lại PIN: TT/TP chỉ cho tổ viên; quản lý/lãnh đạo/ADMIN chỉ ADMIN cấp | `resetPin_`, `quyenTrenNguoi_` | `#qlRs` (Quản lý ca), nút cấp PIN ở `loadNS` |
| F-DN-09 | Mở khóa tài khoản (cùng quy tắc quyền như F-DN-08) | `moKhoaTK_` | `#qlUk` |
| F-DN-10 | Bỏ kiểm tra Gmail (chạy chế độ ẩn danh) | — | — |
| F-DN-11 | Hết phiên → báo và tải lại trang | `auth_` | `call()` |

## 3. Vào ca (F-VC)

| Mã | Chức năng | Backend | Giao diện |
|---|---|---|---|
| F-VC-01 | Khung "Ca đang mở – Vào ca" (mở sớm 15', đóng sau giờ kết thúc 60') | `vaoCaInfo_`, `me_.vaoCa` | `renderBao` → `#boxVaoCa`, `.btn-join-ca` |
| F-VC-02 | Vào ca ghi `PhanCa`, không ghi trùng, có log `VAO_CA` | `vaoCa_` | `call('vaoCa', {ca})` |
| F-VC-03 | Lãnh đạo, ADMIN không vào ca (`duocVaoCa = false`) | `duocVaoCa_` | ẩn khung vào ca |
| F-VC-04 | Hiển thị số người đã vào (`soDaVao`), không chặn | `vaoCaInfo_`, `dsCa_` | `#boxVaoCa`, Quản lý ca |

Giờ ca (`CA` trong Code.gs): Sáng 07:30–11:30 (4 giờ), Chiều 13:00–17:00 (4 giờ), Tối 18:00–21:00 (3 giờ).

## 4. Báo cáo (F-BC)

Các khâu theo vai trò (`stepsFor()` trong Index.html — **đừng đổi nếu không đổi cả server**):

| Vai trò | Khâu |
|---|---|
| Tổ viên | `NHAN_NHOM` (Nhận hộp), `SCAN`, `TACH`, `OCR` |
| Tổ trưởng / Tổ phó | `NHAN` (Nhận từ TT Lưu trữ), `NHAN_NHOM`, `SCAN`, `TACH`, `OCR`, `TRA` (Trả hộp) |
| ADMIN | `NHAN`, `TRA` |

| Mã | Chức năng | Backend | Giao diện |
|---|---|---|---|
| F-BC-01 | Thẻ trạng thái ca hôm nay (nhóm, thành viên, hạn nhập, đã chốt) | `me_.cas` | `renderBao` → `#caInfo` |
| F-BC-02 | Form báo cáo theo khâu, chọn ca nếu nhiều ca cùng mở | `ghi_` | `buildForm`, `#fCa`, `#steps`, `#fields`, `#fSend`, `send()` |
| F-BC-03 | Ô mã hộp: mỗi dòng một mã, không dấu phẩy, chữ/số/`. _ - /`, ≤30 ký tự; mã trùng bị bỏ + cảnh báo | `ghi_`, `MA_HOP_RE` | `#fHop`, `#fCnt` (đếm mã) |
| F-BC-04 | Gợi ý mã hộp theo khâu | `hopGoiY_` | `#dlHop` (datalist) |
| F-BC-05 | Số hồ sơ/trang/tờ/trang lỗi không âm; tick "Hết hộp" | `ghi_` | `#fHs`, `#fTrang`, `#fTo`, `#fLoi`, `#fHet` |
| F-BC-06 | Hộp đã báo xong ở một khâu thì không nhận thêm ở khâu đó | `ghi_` | thông báo lỗi |
| F-BC-07 | Nhận hộp: chọn **Cá nhân / Nhóm** (`kieuNhan`); NHOM khi chưa có nhóm → từ chối | `ghi_` | `#kieuNhan`, `#kieuNhanInfo`, `KIEU_NHAN`, `veKieuNhan` |
| F-BC-08 | Scan: tick "Đồng thời ghi Tách file bằng đúng số Scan" (gửi thêm bản ghi TACH; Tách lỗi vẫn giữ Scan) | `ghi_` (2 lần gọi) | `#fKemTach`, `KEM_TACH`, `send()` |
| F-BC-09 | Nhận từ TT Lưu trữ: dán danh sách mã; ô Mã hồ sơ / ghi chú ("Từ 472 đến 476") lưu vào `MaHoSo` và `GhiChu` | `ghi_` | `#fMaHs`, `#fNote` |
| F-BC-10 | Trả hộp: hộp có bản ghi Nhận mà chưa Tách xong → bỏ qua + cảnh báo; hộp không có bản ghi Nhận → cảnh báo nhưng vẫn ghi | `ghi_` | hiển thị `warnings` |
| F-BC-11 | Chưa phân nhóm vẫn báo được (tính cá nhân: `Nhom` rỗng, `ThanhVien` = chính mình) | `ghi_`, `nhomOf_` | — |
| F-BC-12 | `ThanhVien` chốt lúc báo cáo → đổi nhóm sau không mất số cá nhân | `ghi_` | — |
| F-BC-13 | Nhật ký ca của tôi + nút Hủy (chỉ quản lý; tổ viên không tự hủy) | `nhatKy_`, `huy_` | `loadNK` → `#nk` |
| F-BC-14 | Widget tiến độ gọn ở tab Báo cáo (ẩn với tổ viên) | `dash_` | `renderWidget` → `#wgBao` |
| F-BC-15 | Lịch sử cá nhân (chia theo thành viên nhóm lúc báo cáo) | `lichSu_` | `openLichSu`, `#modalLS`, `#lsTu`, `#lsDen`, `#lsBody` |
| F-BC-16 | Ngoài giờ nhập / ca đã chốt → không ghi được | `caState_`, `ghi_` | chip trạng thái |
| F-BC-17 | Lãnh đạo không ghi được | `ghi_`, `LANHDAO_ACTIONS` | ẩn tab Báo cáo |
| F-BC-18 | **Báo cáo nhiều hộp một lần (P2):** bảng nhiều dòng cho Scan/Tách/OCR (≤ 10 hộp × 3 khâu/lần). Mỗi dòng: mã hộp (chọn gợi ý/chạm chip hoặc **gõ tay** mã ngoài danh sách), **mã hồ sơ đã làm**, số hồ sơ (gõ "472-476" gợi ý 5), **số tờ** (P4: bảng này không có ô Số trang, chỉ gửi `soTo`; form cũ vẫn có cả hai ô), trang lỗi (Scan), xong hộp. Một confirm tóm tắt; kết quả từng hộp; hộp lỗi bỏ qua và báo lý do, hộp đúng vẫn ghi. Cả lô chỉ đọc NhatKy 1 lần (R1); gửi lại cùng `idLo` không ghi trùng (R4). Form một hộp cũ vẫn còn (nút "Một hộp (form cũ)"; chọn được nhớ trong trình duyệt) | `ghiLo_` (gọi lại `ghi_` cho từng mục), `memoThem_`, `LO_MAX_HOP` | `loRenderBox`, `loThuThap`, `loGui`, `loPrepare`, `loModeHtml`, `#fLoBox`, `#fLoRes` |
| F-BC-19 | **Tick nhiều khâu (P3):** trong bảng nhiều hộp, ô tick "Ghi cùng lúc các khâu" Scan / Tách file / OCR dùng **cùng số liệu**. Bấm nút khâu Scan → mặc định Scan + Tách; bấm Tách → chỉ Tách; bấm OCR → chỉ OCR (OCR do người dùng tự bật, có nhắc khi gửi). Tick được **nhớ theo từng nút khâu** (localStorage). Khâu đã ghi xong cho một dòng được đánh dấu "Đã ghi", gửi lại chỉ ghi khâu còn lại (không ghi đôi). Thay thế dần tick "kèm Tách" (F-BC-08, F-QL-10 vẫn còn ở form cũ) | `ghiLo_` (sắp Scan → Tách → OCR) | `loKhauDoc`, `loKhauChon`, `loThuThap`, `loGui`, `LO_KHAU_MD`, `loPrepare` |

## 5. Quản lý ca – Tổ trưởng/Tổ phó/ADMIN (F-QL)

| Mã | Chức năng | Backend | Giao diện |
|---|---|---|---|
| F-QL-01 | Chọn ngày/ca, xem nhân sự trong ca, tự làm mới 20 giây | `dsCa_` | `initQL`, `loadQL`, `#qlNgay`, `#qlCa`, `#qlLoad`, `#qlBody` |
| F-QL-02 | Tự ghép cặp, chỉnh tay, Lưu phân nhóm | `luuNhom_` | `#qlGhep`, `#qlLuu` |
| F-QL-03 | Đổi nhóm từng ô lưu ngay (`chiDoi: true`, chỉ sửa người được gửi) | `luuNhom_` | `loadQL` (onchange) |
| F-QL-04 | Thêm / bỏ người khỏi ca; bỏ khỏi ca thì bỏ luôn khỏi nhóm (log `BO_KHOI_NHOM`) | `suaCa_` | `#qlAddSel`, `#qlAdd`, nút `data-rm` |
| F-QL-05 | Xác nhận & chốt ca (không chốt ngày tương lai) | `chot_` | `#qlChot` |
| F-QL-06 | Mở khóa ca, hiệu lực 60 phút | `chot_` (`mo: true`), `moConHieuLuc_` | `#qlMo` |
| F-QL-07 | Cấp lại PIN / mở khóa tài khoản | xem F-DN-08, F-DN-09 | `#qlNs`, `#qlRs`, `#qlUk`, `#qlMsg3` |
| F-QL-08 | Nhập số liệu hộ thành viên (ngày hôm nay hoặc quá khứ; nhóm tùy chọn, "Cá nhân" thì bắt buộc chọn người) | `ghi_` (`boSung`, `nguoiHo`) | `renderHo`, `#hoCard`, `#hoSteps`, `#hoNhom`, `#hoNg`, `#hoSend` |
| F-QL-09 | Áp nhóm đang chọn sang khung nhập hộ | — | `apNhomQL` |
| F-QL-10 | Nhập hộ khâu Scan: tick "Đồng thời ghi Tách file PDF bằng đúng số Scan" (gửi thêm bản ghi `TACH` nhập hộ, bỏ trang lỗi; Tách lỗi vẫn giữ Scan) | `ghi_` (2 lần gọi, `boSung`) | `renderHo` → `#hoKemTach`, `#hoSend` |
| F-QL-11 | Nhập hộ bằng **cùng bảng nhiều hộp** với F-BC-18 (khâu Scan/Tách/OCR; tham số `boSung`, `nguoiHo`, `nhom`, `ngay`, `ca` truyền qua `ghiLo`). Form nhập hộ cũ giữ nguyên (nút "Một hộp (form cũ)"), nên F-QL-10 vẫn còn | `ghiLo_`, `ghi_` (`boSung`) | `renderHo` → `#hoLoBox`, `#hoLoRes`, `#hoSend`, `loGui` |

## 6. Nhân sự – chỉ ADMIN (F-NS)

| Mã | Chức năng | Backend | Giao diện |
|---|---|---|---|
| F-NS-01 | Danh sách nhân sự | `dsNhanSu_` | `loadNS` → `#nsList` |
| F-NS-02 | Thêm / sửa (ghi log cũ → mới) | `luuNhanSu_` | `#nsMa`…`#nsAct`, `#nsSave`, `#nsClear` |
| F-NS-03 | Cấp PIN mới từ danh sách | `resetPin_` | nút `data-p` |

## 7. Dữ liệu – chỉ ADMIN (F-DL)

| Mã | Chức năng | Backend | Giao diện |
|---|---|---|---|
| F-DL-01 | Bảng bản ghi theo ngày, gồm bản ghi đã hủy (mờ, gạch ngang) | `nhatKy_` (`includeHuy`) | `loadDL` → `#dlList` |
| F-DL-02 | Sửa bản ghi (giữ nguyên `Loai`, ghi log) | `suaBanGhi_` | `editDL`, `#dlEdit`, `#eNgay`…`#eSave` |
| F-DL-03 | Xóa (hủy mềm) / khôi phục (từ chối nếu trùng hộp đã xong) | `huy_`, `khoiPhuc_` | nút `data-d`, `data-u` |
| F-DL-04 | Tạo dữ liệu mẫu (`THỬ NGHIỆM`, người giả TN-xx) | `taoMau_` | `#dlMauCa`, `#dlMau` |
| F-DL-05 | Xóa dữ liệu thử nghiệm (gồm nhóm mẫu) | `resetDuLieu_` (`THU`) | `#dlThu` |
| F-DL-06 | Xóa theo ngày / toàn bộ: phải gõ `XOA`; sao lưu tab `SL_<tab>_<giờ>` trước | `resetDuLieu_` (`NGAY`, `TATCA`), `backupTab_` | `#dlNgayDel`, `#dlAll` |

## 8. Nhật ký hệ thống – chỉ ADMIN (F-LG)

| Mã | Chức năng | Backend | Giao diện |
|---|---|---|---|
| F-LG-01 | Lọc theo khoảng ngày, mã người, hành động | `nhatKyHT_` | `initLG`, `loadLG`, `#lgTu`, `#lgDen`, `#lgMa`, `#lgHd`, `#lgList` |
| F-LG-02 | Mọi thao tác ghi đều log (ai, lúc nào, ca nào, cũ → mới) | `log_` | — |

## 9. Dashboard – TT/TP/Lãnh đạo/ADMIN (F-DB)

| Mã | Chức năng | Backend (trường trong kết quả `dash_`) | Giao diện |
|---|---|---|---|
| F-DB-01 | Chọn ngày: ◀ Ngày trước / Hôm nay / Ngày sau ▶, không xem ngày tương lai, dòng thứ-ngày, nút các ngày có dữ liệu (7 ngày gần nhất, một hàng cuộn ngang) | `series` | `veNgayNav`, `#dNgay`, `#dTruoc`, `#dHomNay`, `#dSau`, `#dThu`, `#dNgayCo` |
| F-DB-02 | Widget tiến độ: 3 vòng Scan/Tách/OCR so với 175.000 tờ, còn lại, TB/ngày, TB/ca, ngày dự kiến xong | `tienDo`, `luyKe` | `widgetHtml`, `ring` |
| F-DB-03 | Khu ĐẦU CA: 3 thẻ ca (nhân sự, tồn đầu ca, chưa scan, chờ tách, chờ OCR) + biểu đồ `c1`, `c3` | `cas[]` | `loadDash`, `zone('z1')` |
| F-DB-04 | Khu CUỐI CA: tờ scan/tách/OCR, hộp nhận/trả, "x/y nhóm đã báo cáo" + biểu đồ `c5` | `cas[].nhomDaBC`, `tongNhom` | `zone('z2')` |
| F-DB-05 | Khu KẾT THÚC NGÀY: nhận/trả/tồn, tờ + hộp xong 3 khâu, biểu đồ 10 ngày `c2`, `c4` | `day`, `series` | `zone('z3')` |
| F-DB-06 | Khu "Từng ca": mỗi người trong ca (nhóm, có mặt, số báo cáo, hộp, tờ 3 khâu); người thử nghiệm `TN-xx` không tính (nhân sự ca, `caNguoi`) trừ khi ADMIN bật `gomThu` | `caNguoi` | `tungCaHtml` |
| F-DB-07 | Khu CHI TIẾT: bảng nhóm (năng suất tờ/người-giờ theo `*DVGio`) và bảng cá nhân (chia 50/50) | `nhom[]`, `canhan[]` | `zone('z4')` |
| F-DB-08 | Khu AI NHẬP: tổng hợp theo ca và người nhập + chi tiết từng lần báo cáo | `nguoiNhap`, `chiTiet` | `zone('z4', 'AI NHẬP')` |
| F-DB-09 | Số đầu kỳ từng ngày 02–08/11 (bảng `DauKy`), ca "Ngày (gộp)" | `caGop`, `luyKe.dauKyDen`, `DAU_KY_CA` | thẻ ca gộp |
| F-DB-10 | ADMIN: ô "gồm dữ liệu thử nghiệm" (mặc định loại `THỬ NGHIỆM`) | `dash_(ngay, gomThu)` | `#boxGomThu`, `#dGomThu` |
| F-DB-11 | In dashboard | — | `#dPrint` |
| F-DB-12 | Biểu đồ lỗi (CDN hỏng) thì số liệu vẫn hiện | — | `mk`, `try/catch` trong `loadDash` |
| F-DB-13 | Cache dashboard, cập nhật khi có ghi | `dash_`, `cacheBump_` | — |

## 10. Hạ tầng (F-HT) — sửa nhầm là hỏng toàn hệ thống

| Mã | Chức năng | Ở đâu |
|---|---|---|
| F-HT-01 | Mọi action ghi + đăng nhập + vào ca chạy tuần tự trong 1 khóa; action đọc (`READ_ACTIONS`) không khóa | `api`, `withLock_` |
| F-HT-02 | Chống chèn công thức (`= + - @` → thêm dấu cách) | `safe_` |
| F-HT-03 | Mã HRM có số 0 đầu và mã hộp dạng `dd.mm.yy` (VD `02.01.85`): ghi dạng văn bản `@` bằng **cả** `append_` và `appendMany_` (dùng chung `TEXT_COLS` qua `textFmt_`), đọc đối chiếu lại; `read_` đưa mã hộp/mã hồ sơ đã bị Sheets đổi thành ngày về `dd.MM.yy`; `suaMaHopNgay()` (chỉ chủ Sheet chạy từ trình soạn) sửa dữ liệu cũ | `append_`, `appendMany_`, `textFmt_`, `read_`, `TEXT_COLS`, `suaMaHopNgay` |
| F-HT-04 | Cache đọc tab + bỏ cache khi sửa tay trên Sheet | `readValues_`, `tabVer_`, `onEdit` |
| F-HT-05 | `setup` bảo đảm đủ dòng (20.000 / 5.000) rồi mới định dạng cột; chỉ chủ Sheet chạy được | `setup`, `ownerOnly_`, `MIN_ROWS` |
| F-HT-06 | Chống XSS khi render dữ liệu người nhập | `esc()` trong Index.html |

---

## Bảng kiểm tra sau mỗi lần sửa (bắt buộc)

**Tự động (máy):**
1. `node tools/test_mock.js` → phải `0 lỗi`, số kiểm tra **không được giảm** so với lần trước (hiện 242).
2. `node tools/kiem_tra_giao_dien.js` → mọi `id` và `call('…')` trong sổ này vẫn còn trong `Index.html`.

**Bằng tay trên link thử (sau khi triển khai), 4 tài khoản:**
- [ ] Tổ viên: đăng nhập → Vào ca → Nhận hộp (Cá nhân/Nhóm) → Scan có tick "kèm Tách" → OCR → xem Lịch sử cá nhân. Không thấy tab Dashboard.
- [ ] Tổ trưởng: Vào ca → Quản lý ca: Tự ghép cặp, đổi nhóm 1 ô, bỏ 1 người khỏi ca → Nhận từ TT Lưu trữ (có ghi chú mã hồ sơ) → Trả hộp → Nhập hộ (khâu Scan có tick kèm Tách) → Chốt ca → Mở khóa → Dashboard đủ 6 khu.
- [ ] Lãnh đạo: chỉ thấy Dashboard; đổi ngày bằng ◀ ▶ và nút ngày; xem 02–08/11 có số đầu kỳ.
- [ ] ADMIN: Nhân sự (thêm/sửa/cấp PIN), Dữ liệu (sửa, xóa, khôi phục, tạo mẫu, xóa thử nghiệm), Nhật ký (lọc), Dashboard tick "gồm dữ liệu thử nghiệm".
