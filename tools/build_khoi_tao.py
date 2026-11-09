# Tạo file khởi tạo (v3) cho hệ thống Báo cáo ca. CHỈ lấy Mã HRM, họ tên, chức vụ, đơn vị – KHÔNG lấy CCCD/SĐT.
# Cách chạy:  python build_khoi_tao.py <file_TCHC.xlsx> <SoHoa_KhoiTao_v3.xlsx> [file_v2_de_giu_PIN.xlsx]
#  - Danh sách nhân sự lấy từ các sheet "DS nhân sự ..."; chức vụ Tổ trưởng/Tổ phó lấy từ sheet T11.
#  - KHÔNG nạp lịch phân ca: tab PhanCa để trống, từng người tự bấm "Vào ca" khi ca mở.
#  - Không định dạng sẵn hàng trống (tránh dữ liệu bị dán xuống dòng 3000 khi tải lên Google Sheets);
#    định dạng văn bản của các cột do hàm setup() trong Apps Script đặt.
#  - Giữ nguyên PIN tạm của file cũ (đối chiếu theo Mã HRM); người mới được cấp PIN ngẫu nhiên.
#  - Thống nhất tên Đơn vị (ví dụ "Phòng tài chính kế hoạch" và "Phòng Tài chính kế hoạch" thành một).
import openpyxl, re, secrets, unicodedata, sys, os
from collections import Counter

SRC = sys.argv[1]; OUT = sys.argv[2]; OLD = sys.argv[3] if len(sys.argv) > 3 else None
norm = lambda s: re.sub(r'\s+', ' ', unicodedata.normalize('NFC', str(s or '')).strip()).casefold()
clean = lambda s: re.sub(r'\s+', ' ', unicodedata.normalize('NFC', str(s or '')).strip())

wb = openpyxl.load_workbook(SRC, data_only=True)
people = {}   # tên chuẩn hóa -> thông tin
for sn in wb.sheetnames:
    if sn.startswith('DS nhân sự'):
        for r in wb[sn].iter_rows(min_row=9, values_only=True):
            if r[0] and r[1] and r[2] and re.fullmatch(r'\d{5,}', str(r[2]).strip()):   # bỏ dòng tiêu đề bảng bị đọc nhầm
                people[norm(r[1])] = dict(ma=str(r[2]).strip(), ten=clean(r[1]), dv=clean(r[6]))

# Thống nhất tên đơn vị: nhóm theo chữ thường, chọn cách viết xuất hiện nhiều nhất
cnt = {}
for p in people.values():
    cnt.setdefault(norm(p['dv']), Counter())[p['dv']] += 1
canon = {k: c.most_common(1)[0][0] for k, c in cnt.items()}
for p in people.values():
    p['dv'] = canon[norm(p['dv'])]

# Vai trò Tổ trưởng/Tổ phó (sheet T11); KHÔNG lấy lịch phân ca
roles = {}; miss = []
t11 = [wb[s] for s in wb.sheetnames if s.startswith('T11')]
if t11:
    for r in t11[0].iter_rows(min_row=10, values_only=True):
        if not isinstance(r[0], int) or not r[1]:
            continue
        p = people.get(norm(r[1]))
        if not p:
            miss.append(r[1]); continue
        roles[p['ma']] = {'Tổ trưởng': 'TOTRUONG', 'Tổ phó': 'TOPHO'}.get(str(r[2]).strip(), 'TOVIEN')

old_pin = {}; old_ma = {}
if OLD and os.path.exists(OLD):
    for r in openpyxl.load_workbook(OLD)['NhanSu'].iter_rows(min_row=2, values_only=True):
        if r[0]:
            old_ma[str(r[0])] = r[1]
            if r[8]:
                old_pin[str(r[0])] = str(r[8])

TAB = {
    'NhanSu': ['MaHRM', 'HoTen', 'ChucVu', 'DonVi', 'Email', 'VaiTro', 'PinHash', 'Salt', 'PinTam', 'DoiPin', 'SaiPin', 'Khoa', 'HoatDong'],
    'PhanCa': ['Ngay', 'Ca', 'MaHRM', 'HoTen', 'GioBD', 'GioKT'],
    'PhanNhom': ['Ngay', 'Ca', 'Nhom', 'MaHRM', 'HoTen', 'NguoiPhan', 'ThoiGian'],
    'NhatKy': ['ID', 'ThoiGian', 'Ngay', 'Ca', 'Nhom', 'Buoc', 'MaHop', 'SoHoSo', 'SoTrang', 'SoTo', 'TrangLoi', 'HetHop', 'MaHoSo', 'GhiChu', 'NguoiNhap', 'Loai', 'Huy', 'NguoiHuy', 'ThanhVien'],
    'ChotCa': ['Ngay', 'Ca', 'TrangThai', 'NguoiXacNhan', 'ThoiGian', 'GhiChu'],
    'DauKy': ['Buoc', 'SoHop', 'SoHoSo', 'SoTrang', 'SoTo', 'GhiChu', 'Ngay', 'Ca'],
    'LogHeThong': ['ThoiGian', 'MaHRM', 'HoTen', 'VaiTro', 'HanhDong', 'NgayCa', 'ChiTiet'],
}
out = openpyxl.Workbook(); out.remove(out.active)
for n, h in TAB.items():
    out.create_sheet(n).append(h)

CHUCVU = {'TOTRUONG': 'Tổ trưởng', 'TOPHO': 'Tổ phó'}
new_ma = set()
for ma, p in sorted({v['ma']: v for v in people.values()}.items()):
    vt = roles.get(ma, 'TOVIEN'); new_ma.add(ma)
    out['NhanSu'].append([ma, p['ten'], CHUCVU.get(vt, 'Tổ viên'), p['dv'], '', vt, '', '', old_pin.get(ma) or f'{secrets.randbelow(900000) + 100000}', True, 0, False, True])
# Lãnh đạo và Quản trị hệ thống: giữ PIN tạm của file cũ (nếu có), không thì cấp ngẫu nhiên; người dùng bị server buộc đổi PIN ở lần đăng nhập đầu
out['NhanSu'].append(['00061914', 'Mai văn Mười', 'Phó giám đốc BĐTP', 'Lãnh đạo BĐTP', '', 'LANHDAO', '', '', old_pin.get('00061914') or f'{secrets.randbelow(900000) + 100000}', True, 0, False, True])
out['NhanSu'].append(['ADMIN', 'Quản trị hệ thống', 'Quản trị', 'Bưu điện TP Huế', '', 'ADMIN', '', '', old_pin.get('ADMIN') or f'{secrets.randbelow(900000) + 100000}', True, 0, False, True])

# Số đầu kỳ TỪNG NGÀY 02–08/11/2026, lấy từ sheet "BÁO CÁO SẢN LƯỢNG SỐ HOÁ" (tab SCAN / SỐ HÓA / Xử lý TT; 1 trang = 1 tờ).
# Ca "Ngày" = sáng + chiều gộp (sheet cũ không tách), ca "Tối" riêng. 571 trang ghi "Tách file" ở tab SCAN ngày 05/11 ca Tối (375 + 196)
# đã chuyển sang Tách. Dòng KHÔNG có Ngay là số dư gộp: v3 không dùng (tránh cộng trùng).
# (Buoc, Ngay, Ca, SoHop, SoTo, GhiChu)  -  SoHop = "SL nhận bàn giao (hộp)" ở tab SCAN, chỉ để tham khảo
DAU_KY = [
    ('SCAN', '2026-11-02', 'Tối', 3, 1089, 'Scan: 395 + 399 + 295'),
    ('SCAN', '2026-11-03', 'Ngày', 12, 4159, 'Scan: 851 + 1481 + 667 + 1160'),
    ('SCAN', '2026-11-03', 'Tối', 5, 2019, 'Scan: 724 + 872 + 423'),
    ('SCAN', '2026-11-04', 'Ngày', 5, 948, 'Scan: 74 + 152 + 220 + 346 + 156'),
    ('SCAN', '2026-11-04', 'Tối', '', 2430, 'Scan: 714 + 792 + 924'),
    ('SCAN', '2026-11-05', 'Ngày', 1, 1466, 'Scan: 1004 + 462'),
    ('SCAN', '2026-11-05', 'Tối', 2, 988, 'Scan: 102 + 886 (không tính 571 trang ghi Tách file)'),
    ('SCAN', '2026-11-06', 'Ngày', 1, 1192, 'Scan: 517 + 512 + 163'),
    ('SCAN', '2026-11-06', 'Tối', 1, 496, 'Scan: 496'),
    ('SCAN', '2026-11-07', 'Ngày', 9, 3856, 'Scan: 446 + 1600 + 0 + 1052 + 758'),
    ('SCAN', '2026-11-08', 'Ngày', 4, 1388, 'Scan: 938 + 250 + 200'),
    ('TACH', '2026-11-05', 'Ngày', '', 3286, 'Tách: 140 + 2300 + 253 + 304 + 289'),
    ('TACH', '2026-11-05', 'Tối', '', 571, 'Tách: 375 + 196 (ghi nhầm ở tab SCAN, đã chuyển sang Tách)'),
    ('TACH', '2026-11-06', 'Ngày', '', 1475, 'Tách: 509 + 311 + 165 + 248 + 242'),
    ('TACH', '2026-11-07', 'Ngày', '', 254, 'Tách: 254'),
    ('TACH', '2026-11-08', 'Tối', '', 766, 'Tách: 275 + 125 + 366'),
    ('OCR', '2026-11-06', 'Ngày', '', 308, 'OCR (Xử lý TT): 206 + 102'),
    ('OCR', '2026-11-06', 'Tối', '', 378, 'OCR (Xử lý TT): 201 + 177'),
    ('OCR', '2026-11-07', 'Ngày', '', 1235, 'OCR (Xử lý TT): 446 + 254 + 332 + 203'),
    ('OCR', '2026-11-08', 'Ngày', '', 1219, 'OCR (Xử lý TT): 275 + 273 + 305 + 366'),
]
tong = {}
for bu, ng, ca, hop, to, gc in DAU_KY:
    tong[bu] = tong.get(bu, 0) + to
    out['DauKy'].append([bu, hop, '', '', to, gc, ng, ca])
assert tong == {'SCAN': 20031, 'TACH': 6352, 'OCR': 3140}, tong   # khớp tổng đã xác nhận
tsv = os.path.join(os.path.dirname(os.path.abspath(OUT)), 'DauKy_theo_ngay.tsv')
with open(tsv, 'w', encoding='utf-8', newline='') as f:
    f.write(chr(9).join(TAB['DauKy']) + chr(10))
    for bu, ng, ca, hop, to, gc in DAU_KY:
        f.write(chr(9).join([bu, str(hop), '', '', str(to), gc, ng, ca]) + chr(10))
out.save(OUT)

print('nhân sự:', len(people), '(+ Lãnh đạo + ADMIN) | PhanCa: để trống (Vào ca) | không khớp T11:', miss, '| giữ PIN cũ:', len(old_pin))
print('đơn vị:', sorted(set(canon.values())))
if old_ma:
    thieu = {m: t for m, t in old_ma.items() if m not in new_ma and m not in ('00061914', 'ADMIN')}
    them = [m for m in new_ma if m not in old_ma]
    print('SO VỚI v2 – có trong v2 nhưng không có trong v3:', thieu, '| có trong v3 nhưng không có trong v2:', them)
    for m, t in thieu.items():
        print('  lý do:', repr(m), '/', repr(t), '= dòng TIÊU ĐỀ của bảng "DS nhân sự đợt 2" bị bản v2 đọc nhầm thành 1 nhân sự (không phải người thật)' if not re.fullmatch(r'\d{5,}', m) else '= (cần kiểm tra)')
print('DauKy từng ngày:', tong, '| đã tạo', OUT, 'và', tsv)
