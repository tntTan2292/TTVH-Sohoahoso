/**
 * SỐ HÓA HỒ SƠ – BÁO CÁO CA  |  Bưu điện TP Huế
 * Google Apps Script gắn với Google Sheet (container-bound), triển khai dạng Web App.
 * Luồng: Nhận hộp -> Scan -> Tách PDF -> Trả hộp. Mỗi người/cặp tự báo cáo, Tổ trưởng/Tổ phó chốt ca.
 */
const TZ = 'Asia/Ho_Chi_Minh';
const MO_TRUOC = 15;      // phút: cho nhập sớm trước giờ bắt đầu ca
const KHOA_SAU = 60;      // phút: tự khóa sau khi hết ca
const MAX_SAI_PIN = 5;
const MAX_SAI_PIN_TICH_LUY = 20;   // 20 lần sai PIN (không có lần đăng nhập đúng xen giữa) -> khóa hẳn, cần quản lý cấp lại PIN
const NGAY_BAT_DAU = '2026-11-02';  // ngày bắt đầu dự án; DauKy là lũy kế đến hết DAU_KY_DEN
const DAU_KY_DEN = '2026-11-08';
// Số ca đã làm mỗi ngày trong giai đoạn DauKy (02–08/11, theo phân ca TCHC cũ): dùng tính TB/ngày, TB/ca đúng theo ngày đang xem
const DAU_KY_CA = { '2026-11-02': 2, '2026-11-03': 3, '2026-11-04': 3, '2026-11-05': 3, '2026-11-06': 3, '2026-11-07': 2, '2026-11-08': 2 };
const MA_HOP_RE = /^[A-Za-z0-9][A-Za-z0-9._\/\-]{0,29}$/;   // mã hộp: chữ, số, . _ - /  (tối đa 30 ký tự)
const KHOA_PIN_GIAY = 900;   // sai PIN quá số lần -> tạm khóa 15 phút (không khóa vĩnh viễn từ xa)
const KHOA_MO_PHUT = 60;     // 'Mở khóa ca' chỉ có hiệu lực 60 phút
const MUC_TIEU_TO = 175000;   // Mục tiêu: số hóa dự kiến (tờ) gồm Scan + Tách file + OCR
const CA_LIST = ['Sáng', 'Chiều', 'Tối'];
const STEP_NAME_ = { NHAN: 'Nhận từ TT Lưu trữ', NHAN_NHOM: 'Nhận hộp (nhóm)', SCAN: 'Scan', TACH: 'Tách file', OCR: 'OCR', TRA: 'Trả hộp' };
const CA = {
  'Sáng':  { bd: '07:30', kt: '11:30', o: 1, gio: 4 },
  'Chiều': { bd: '13:00', kt: '17:00', o: 2, gio: 4 },
  'Tối':   { bd: '18:00', kt: '21:00', o: 3, gio: 3 }
};
const TAB = {
  NhanSu:   ['MaHRM','HoTen','ChucVu','DonVi','Email','VaiTro','PinHash','Salt','PinTam','DoiPin','SaiPin','Khoa','HoatDong'],
  PhanCa:   ['Ngay','Ca','MaHRM','HoTen','GioBD','GioKT'],
  PhanNhom: ['Ngay','Ca','Nhom','MaHRM','HoTen','NguoiPhan','ThoiGian'],
  NhatKy:   ['ID','ThoiGian','Ngay','Ca','Nhom','Buoc','MaHop','SoHoSo','SoTrang','SoTo','TrangLoi','HetHop','MaHoSo','GhiChu','NguoiNhap','Loai','Huy','NguoiHuy','ThanhVien'],
  ChotCa:   ['Ngay','Ca','TrangThai','NguoiXacNhan','ThoiGian','GhiChu'],
  DauKy:    ['Buoc','SoHop','SoHoSo','SoTrang','SoTo','GhiChu','Ngay','Ca'],
  LogHeThong: ['ThoiGian','MaHRM','HoTen','VaiTro','HanhDong','NgayCa','ChiTiet']
};
const TEXT_COLS = ['Ngay','Ca','MaHRM','MaHop','MaHoSo','Nhom','PinTam','PinHash','Salt','ID','GioBD','GioKT','ThoiGian','GhiChu','HoTen','ChiTiet','ThanhVien','NguoiPhan','NguoiNhap','NguoiXacNhan','NguoiHuy'];   // dùng chung cho setup, append_, appendMany_
const MIN_ROWS = { NhatKy: 20000, LogHeThong: 20000, PhanCa: 5000, PhanNhom: 5000, ChotCa: 5000 };   // setup bảo đảm đủ dòng TRƯỚC khi định dạng cột
const VAI_TRO_QL = ['TOTRUONG', 'TOPHO', 'ADMIN'];
const VAI_TRO_ALL = ['TOVIEN', 'TOTRUONG', 'TOPHO', 'LANHDAO', 'ADMIN'];

/* ====================== Khởi tạo ====================== */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Số hóa hồ sơ - Báo cáo ca')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Sửa tay trực tiếp trên Google Sheet (thêm nhân sự, sửa phân ca…) -> bỏ cache của tab đó để web thấy ngay
function onEdit(e) {
  try { const n = e && e.range ? e.range.getSheet().getName() : ''; if (CACHE_TABS[n]) cacheBump_(n); } catch (x) { }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Số hóa hồ sơ')
    .addItem('Khởi tạo / kiểm tra các tab', 'setup').addToUi();
}

function setup() {
  ownerOnly_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('SS_ID', ss.getId());
  ss.setSpreadsheetTimeZone(TZ);
  Object.keys(TAB).forEach(function (n) {
    const h = TAB[n];
    const sh = ss.getSheetByName(n) || ss.insertSheet(n);
    if (MIN_ROWS[n]) {                            // bảo đảm đủ dòng TRƯỚC khi định dạng cột
      const can = MIN_ROWS[n] - sh.getMaxRows();
      if (can > 0) sh.insertRowsAfter(sh.getMaxRows(), can);
    }
    h.forEach(function (k, i) {
      if (TEXT_COLS.indexOf(k) >= 0) sh.getRange(1, i + 1, sh.getMaxRows(), 1).setNumberFormat('@');
    });
    if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  SpreadsheetApp.getUi().alert('Đã khởi tạo xong. Tiếp theo: Triển khai > Ứng dụng web.');
}

/* ====================== Tiện ích ====================== */
let SS_ = null;   // mở Spreadsheet 1 lần cho mỗi lượt gọi (openById rất chậm)
function ss_() {
  if (SS_) return SS_;
  const id = PropertiesService.getScriptProperties().getProperty('SS_ID');
  SS_ = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  return SS_;
}
function s_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function n_(v) { const x = Number(v); return isFinite(x) ? x : 0; }
function b_(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }
function d_(v) { return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : s_(v); }
function min_(hm) { const p = hm.split(':'); return Number(p[0]) * 60 + Number(p[1]); }
function hm_(m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); }
function now_() {
  const d = new Date();
  const hm = Utilities.formatDate(d, TZ, 'HH:mm');
  return { ngay: Utilities.formatDate(d, TZ, 'yyyy-MM-dd'), hm: hm, min: min_(hm), ts: Utilities.formatDate(d, TZ, 'yyyy-MM-dd HH:mm:ss') };
}
const MEMO_ = {};
// Bộ nhớ đệm giữa các lượt gọi cho các tab nhỏ (đọc Sheet chậm). Mỗi lần ghi tab đổi "phiên bản" nên không đọc nhầm dữ liệu cũ.
const CACHE_TABS = { NhanSu: 1, PhanCa: 1, PhanNhom: 1, ChotCa: 1, DauKy: 1 };
function verKey_() { return String(Date.now()) + Math.random().toString(36).slice(2, 6); }
function tabVer_(name) {
  const c = CacheService.getScriptCache();
  let v = c.get('ver_' + name);
  if (!v) { v = verKey_(); c.put('ver_' + name, v, 21600); }
  return v;
}
function cacheBump_(name) { try { CacheService.getScriptCache().put('ver_' + name, verKey_(), 21600); } catch (e) { } }
function readValues_(name, sh) {
  if (!CACHE_TABS[name]) return sh.getDataRange().getValues();
  const c = CacheService.getScriptCache(), key = 'tab_' + name + '_' + tabVer_(name);
  const hit = c.get(key);
  if (hit) return JSON.parse(hit, function (k, x) { return x && typeof x === 'object' && x.__d !== undefined ? new Date(x.__d) : x; });
  const v = sh.getDataRange().getValues();
  try {
    const txt = JSON.stringify(v.map(function (row) { return row.map(function (x) { return x instanceof Date ? { __d: x.getTime() } : x; }); }));
    if (txt.length < 95000) c.put(key, txt, 300);
  } catch (e) { }
  return v;
}
function memoClear_(name) { if (name && CACHE_TABS[name]) cacheBump_(name); if (name) delete MEMO_[name]; else Object.keys(MEMO_).forEach(function (k) { delete MEMO_[k]; }); }
function ts_(v) { return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd HH:mm:ss') : s_(v); }
// Chống chèn công thức: chuỗi bắt đầu bằng = + - @ được thêm 1 dấu cách (s_() cắt lại khi đọc)
function safe_(v) { return (typeof v === 'string' && /^[=+\-@\t\r]/.test(v)) ? ' ' + v : v; }
function read_(name) {
  if (MEMO_[name]) return MEMO_[name];
  const sh = ss_().getSheetByName(name);
  if (!sh) return [];
  const v = readValues_(name, sh);
  const out = [];
  if (v.length >= 2) {
    const h = v[0];
    for (let i = 1; i < v.length; i++) {
      if (s_(v[i][0]) === '') continue;
      const o = { _row: i + 1 };
      for (let j = 0; j < h.length; j++) o[h[j]] = v[i][j];
      out.push(o);
    }
  }
  if (name === 'NhatKy') out.forEach(function (o) {   // dữ liệu cũ: mã hộp/mã hồ sơ bị Sheets đổi thành Date -> đưa về dd.MM.yy (giả định mã gốc dạng dd.mm.yy)
    ['MaHop', 'MaHoSo'].forEach(function (k) { if (o[k] instanceof Date) o[k] = Utilities.formatDate(o[k], TZ, 'dd.MM.yy'); });
  });
  MEMO_[name] = out;
  if (name !== 'NhanSu' && out.length) {   // dữ liệu cũ bị Sheets cắt số 0 đầu của Mã HRM -> đưa về đúng mã trong NhanSu
    const canon = {};
    read_('NhanSu').forEach(function (r) { const m = s_(r.MaHRM); canon[m.replace(/^0+/, '')] = m; });
    const fix = function (x) { x = s_(x); return canon[x.replace(/^0+/, '')] || x; };
    out.forEach(function (o) {
      ['MaHRM', 'NguoiNhap', 'NguoiXacNhan', 'NguoiHuy', 'NguoiPhan'].forEach(function (k) { if (o[k] !== undefined && o[k] !== '') o[k] = fix(o[k]); });
      if (o.ThanhVien) o.ThanhVien = s_(o.ThanhVien).split(',').map(fix).join(',');
    });
  }
  return out;
}
function append_(name, obj) {
  const sh = ss_().getSheetByName(name);
  const cols = TAB[name], row = sh.getLastRow() + 1;
  if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 1000);   // hết dòng dựng sẵn: thêm dòng (appendRow trước đây tự làm việc này)
  const rg = sh.getRange(row, 1, 1, cols.length);
  textFmt_(rg, cols, 1);   // cột mã/ngày ghi dạng văn bản, nếu không Sheets đổi "00109101" thành số, "02.01.85" thành ngày
  const vals = cols.map(function (k) { return obj[k] === undefined || obj[k] === null ? '' : safe_(obj[k]); });
  rg.setValues([vals]);
  memoThem_(name, row, cols, [vals]);
}
// Đặt định dạng văn bản '@' cho các cột văn bản của khối dòng sắp ghi (1 lần cho cả khối), giữ định dạng các cột khác.
function textFmt_(rg, cols, nRows) {
  const f = rg.getNumberFormats();
  const out = [];
  for (let i = 0; i < nRows; i++) out.push(cols.map(function (k, j) { return TEXT_COLS.indexOf(k) >= 0 ? '@' : (f[i] ? f[i][j] : ''); }));
  rg.setNumberFormats(out);
}
// Đang ghi theo lô (ghiLo): thêm dòng mới vào bộ nhớ thay vì bỏ bộ nhớ, để cả lô chỉ đọc NhatKy 1 lần (R1)
let LO_DANG_GHI_ = false;
function memoThem_(name, firstRow, cols, rowsVals) {
  if (LO_DANG_GHI_ && name === 'NhatKy' && MEMO_[name]) {
    rowsVals.forEach(function (v, i) { const o = { _row: firstRow + i }; cols.forEach(function (k, j) { o[k] = v[j]; }); MEMO_[name].push(o); });
  } else memoClear_(name);
}
function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  memoClear_();
  try { return fn(); } finally { lock.releaseLock(); }
}
function ownerOnly_() {      // chặn gọi từ web ẩn danh (hàm global có thể bị google.script.run gọi)
  const a = Session.getActiveUser().getEmail() || '', e = Session.getEffectiveUser().getEmail() || '';
  if (!a || a !== e) throw new Error('Chỉ chủ Sheet được chạy hàm này từ menu hoặc trình soạn');
}
function backupTab_(name) {  // sao lưu cả tab sang tab SL_<tên>_<giờ> trước khi xóa
  const ss = ss_(), sh = ss.getSheetByName(name);
  if (!sh) return '';
  const nm = 'SL_' + name + '_' + Utilities.formatDate(new Date(), TZ, 'yyMMdd_HHmmss');
  sh.copyTo(ss).setName(nm);
  return nm;
}
function log_(ma, act, detail) {      // nhật ký hệ thống: ai, lúc nào, ca nào, làm gì
  const t = now_();
  let ten = '', vai = '', ca = '';
  try {
    const u = read_('NhanSu').filter(function (r) { return s_(r.MaHRM) === s_(ma); })[0];
    if (u) { ten = s_(u.HoTen); vai = s_(u.VaiTro); }
    CA_LIST.forEach(function (c) { if (caWin_(c, t.ngay, t).open) ca = c; });
  } catch (e) { }
  append_('LogHeThong', { ThoiGian: t.ts, MaHRM: ma, HoTen: ten, VaiTro: vai, HanhDong: act, NgayCa: t.ngay + (ca ? ' · ca ' + ca : ' · ngoài ca'), ChiTiet: detail });
}
function hash_(salt, pin) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pin));
}
function isAdmin_(u) { return VAI_TRO_QL.indexOf(u.vaiTro) >= 0; }
function setCell_(tab, row, col, val) { ss_().getSheetByName(tab).getRange(row, TAB[tab].indexOf(col) + 1).setValue(safe_(val)); memoClear_(tab); }

/* ====================== Ca / thời gian ====================== */
function caWin_(ca, ngay, t) {
  const c = CA[ca];
  const from = min_(c.bd) - MO_TRUOC, to = min_(c.kt) + KHOA_SAU;
  return { open: t.ngay === ngay && t.min >= from && t.min <= to, tu: hm_(from), den: hm_(to), bd: c.bd, kt: c.kt };
}
function chotInfo_(ngay, ca) {
  let st = '', ts = '';
  read_('ChotCa').forEach(function (r) { if (d_(r.Ngay) === ngay && s_(r.Ca) === ca) { st = s_(r.TrangThai); ts = ts_(r.ThoiGian); } });
  return { st: st, ts: ts };
}
function chotStatus_(ngay, ca) { return chotInfo_(ngay, ca).st; }
function moConHieuLuc_(ts, t) {     // 'Mở khóa ca' chỉ hiệu lực KHOA_MO_PHUT phút (giờ VN, không có giờ mùa hè)
  if (!ts) return false;
  const a = new Date(ts.replace(' ', 'T') + '+07:00').getTime(), b = new Date(t.ts.replace(' ', 'T') + '+07:00').getTime();
  return isFinite(a) && isFinite(b) && b - a >= 0 && b - a <= KHOA_MO_PHUT * 60000;
}
function caState_(ngay, ca, t) {
  const w = caWin_(ca, ngay, t), ci = chotInfo_(ngay, ca);
  const locked = ci.st === 'CHOT';
  const unlocked = ci.st === 'MO' && moConHieuLuc_(ci.ts, t);
  w.locked = locked;
  w.canInput = (w.open || unlocked) && !locked;
  return w;
}
function nhomOf_(ngay, ca, ma) {
  const r = read_('PhanNhom').filter(function (x) { return d_(x.Ngay) === ngay && s_(x.Ca) === ca && s_(x.MaHRM) === ma; })[0];
  return r ? s_(r.Nhom) : '';
}
function membersOf_(ngay, ca, nhom) {
  return read_('PhanNhom').filter(function (x) { return d_(x.Ngay) === ngay && s_(x.Ca) === ca && s_(x.Nhom) === nhom; })
    .map(function (x) { return { ma: s_(x.MaHRM), ten: s_(x.HoTen) }; });
}

/* ====================== Đăng nhập ====================== */
function dsLogin() {      // công khai: chỉ mã, tên, đơn vị của người đang hoạt động (không có vai trò)
  const t = now_();
  const ds = read_('NhanSu').filter(function (r) { return b_(r.HoatDong); })
    .map(function (r) { return { ma: s_(r.MaHRM), ten: s_(r.HoTen), donVi: s_(r.DonVi) }; });
  ds.sort(function (a, b) { return a.donVi.localeCompare(b.donVi, 'vi') || a.ten.localeCompare(b.ten, 'vi'); });
  return { ngay: t.ngay, hm: t.hm, nhanSu: ds };
}

function login(ma, pin) {
  try { return withLock_(function () { return login_(ma, pin); }); }
  catch (e) { return { ok: false, err: 'Hệ thống đang bận, thử lại sau ít giây' }; }
}
function login_(ma, pin) {
  ma = s_(ma); pin = s_(pin);
  const u = read_('NhanSu').filter(function (r) { return s_(r.MaHRM) === ma; })[0];
  if (!u || !b_(u.HoatDong)) return { ok: false, err: 'Không tìm thấy tài khoản' };
  if (b_(u.Khoa)) return { ok: false, err: 'Tài khoản đang bị khóa – liên hệ Tổ trưởng/Tổ phó hoặc Quản trị' };
  const cache = CacheService.getScriptCache(), fk = 'f_' + ma;
  const fails = Number(cache.get(fk) || 0);
  if (fails >= MAX_SAI_PIN) return { ok: false, err: 'Nhập sai PIN quá ' + MAX_SAI_PIN + ' lần – thử lại sau 15 phút hoặc nhờ Tổ trưởng/Tổ phó cấp lại PIN' };
  const ok = s_(u.PinHash) ? hash_(s_(u.Salt), pin) === s_(u.PinHash) : (s_(u.PinTam) !== '' && s_(u.PinTam) === pin);
  if (!ok) {
    cache.put(fk, String(fails + 1), KHOA_PIN_GIAY);
    const sai = n_(u.SaiPin) + 1;
    setCell_('NhanSu', u._row, 'SaiPin', sai);
    log_(ma, 'LOGIN_FAIL', 'Sai PIN lần ' + (fails + 1) + ' (cộng dồn ' + sai + '/' + MAX_SAI_PIN_TICH_LUY + ')');
    if (sai >= MAX_SAI_PIN_TICH_LUY) {
      setCell_('NhanSu', u._row, 'Khoa', true);
      log_(ma, 'KHOA_TAI_KHOAN', 'Sai PIN cộng dồn ' + sai + ' lần – khóa, cần quản lý cấp lại PIN');
      return { ok: false, err: 'Sai PIN quá nhiều lần – tài khoản đã bị khóa, nhờ quản lý cấp lại PIN' };
    }
    return { ok: false, err: 'Sai PIN (còn ' + Math.max(0, MAX_SAI_PIN - fails - 1) + ' lần trước khi tạm khóa)' };
  }
  cache.remove(fk);
  if (n_(u.SaiPin) > 0) setCell_('NhanSu', u._row, 'SaiPin', 0);
  const token = Utilities.getUuid();
  cache.put('t_' + token, ma, 21600);
  log_(ma, 'LOGIN', '');
  return { ok: true, token: token, mustChange: b_(u.DoiPin) };
}

function auth_(token) {
  const ma = CacheService.getScriptCache().get('t_' + token);
  if (!ma) throw 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
  const r = read_('NhanSu').filter(function (x) { return s_(x.MaHRM) === ma; })[0];
  if (!r || !b_(r.HoatDong) || b_(r.Khoa)) throw 'Tài khoản không hợp lệ';
  return { ma: ma, ten: s_(r.HoTen), chucVu: s_(r.ChucVu), donVi: s_(r.DonVi), vaiTro: s_(r.VaiTro), doiPin: b_(r.DoiPin), _row: r._row };
}

/* ====================== API ====================== */
const READ_ACTIONS = ['me', 'hopGoiY', 'nhatKy', 'dashboard', 'dsCa', 'dsNhanSu', 'nhatKyHT', 'lichSu'];
const LANHDAO_ACTIONS = ['me', 'dashboard', 'doiPin', 'lichSu'];
function api(token, action, p) {
  try {
    const u = auth_(token); p = p || {};
    if (u.doiPin && action !== 'me' && action !== 'doiPin') throw 'Cần đổi PIN lần đầu trước khi dùng hệ thống';
    if (u.vaiTro === 'LANHDAO' && LANHDAO_ACTIONS.indexOf(action) < 0) throw 'Tài khoản Lãnh đạo chỉ được xem';
    const data = READ_ACTIONS.indexOf(action) >= 0 ? route_(u, action, p) : withLock_(function () { return route_(u, action, p); });
    return { ok: true, data: data };
  } catch (e) {
    return { ok: false, err: String(e && e.message ? e.message : e) };
  }
}
function route_(u, action, p) {
  switch (action) {
    case 'me': return me_(u);
    case 'doiPin': return doiPin_(u, p);
    case 'ghi': return ghi_(u, p);
    case 'ghiLo': return ghiLo_(u, p);
    case 'vaoCa': return vaoCa_(u, p);
    case 'lichSu': return lichSu_(u, p);
    case 'hopGoiY': return hopGoiY_(u, p);
    case 'nhatKy': return nhatKy_(u, p);
    case 'huy': return huy_(u, p);
    case 'dashboard': {
      if (u.vaiTro === 'TOVIEN') throw 'Dashboard chỉ dành cho Lãnh đạo và Quản lý';     // tổ viên không xem Dashboard
      return dash_(p.ngay, !!p.gomThu && u.vaiTro === 'ADMIN');
    }
    case 'nhatKyHT': needSuper_(u); return nhatKyHT_(p);
    case 'khoiPhuc': needSuper_(u); return khoiPhuc_(u, p);
    case 'suaBanGhi': needSuper_(u); return suaBanGhi_(u, p);
    case 'resetDuLieu': needSuper_(u); return resetDuLieu_(u, p);
    case 'taoMau': needSuper_(u); return taoMau_(u, p);
    case 'dsNhanSu': needSuper_(u); return dsNhanSu_();
    case 'luuNhanSu': needSuper_(u); return luuNhanSu_(u, p);
    case 'dsCa': need_(u); return dsCa_(p);
    case 'luuNhom': need_(u); return luuNhom_(u, p);
    case 'suaCa': need_(u); return suaCa_(u, p);
    case 'chot': need_(u); return chot_(u, p);
    case 'resetPin': need_(u); return resetPin_(u, p);
    case 'moKhoaTK': need_(u); return moKhoaTK_(u, p);
    default: throw 'Hành động không hợp lệ';
  }
}
function needSuper_(u) { if (u.vaiTro !== 'ADMIN') throw 'Chỉ Quản trị hệ thống được quản lý nhân sự'; }
function need_(u) { if (!isAdmin_(u)) throw 'Chỉ Tổ trưởng/Tổ phó được thực hiện thao tác này'; }

function duocVaoCa_(u) { return ['LANHDAO', 'ADMIN'].indexOf(u.vaiTro) < 0; }
function vaoCaInfo_(u, t) {          // các ca đang mở: mình đã vào chưa, đã có bao nhiêu người vào
  const pc = read_('PhanCa').filter(function (r) { return d_(r.Ngay) === t.ngay; });
  return CA_LIST.filter(function (c) { return caState_(t.ngay, c, t).canInput; }).map(function (c) {
    const rs = pc.filter(function (r) { return s_(r.Ca) === c; });
    return { ca: c, bd: CA[c].bd, kt: CA[c].kt, daVao: rs.some(function (r) { return s_(r.MaHRM) === u.ma; }), soDaVao: rs.length };
  });
}
function me_(u) {
  const t = now_();
  const cas = [], seen = {};
  read_('PhanCa').filter(function (r) { return d_(r.Ngay) === t.ngay && s_(r.MaHRM) === u.ma; }).forEach(function (r) {
    const ca = s_(r.Ca);
    if (!CA[ca] || seen[ca]) return;
    seen[ca] = 1;
    const st = caState_(t.ngay, ca, t), nhom = nhomOf_(t.ngay, ca, u.ma);
    cas.push({ ca: ca, bd: st.bd, kt: st.kt, den: st.den, open: st.open, locked: st.locked, canInput: st.canInput,
      nhom: nhom, thanhVien: nhom ? membersOf_(t.ngay, ca, nhom).map(function (m) { return m.ten; }) : [] });
  });
  cas.sort(function (a, b) { return CA[a.ca].o - CA[b.ca].o; });
  return { user: { ma: u.ma, ten: u.ten, chucVu: u.chucVu, vaiTro: u.vaiTro, donVi: u.donVi }, ngay: t.ngay, hm: t.hm, isAdmin: isAdmin_(u), isSuper: u.vaiTro === 'ADMIN', duocVaoCa: duocVaoCa_(u), vaoCa: vaoCaInfo_(u, t), caMo: CA_LIST.filter(function (c) { return caState_(t.ngay, c, t).canInput; }), cas: cas, caList: CA_LIST };
}

const PIN_YEU = ['0000', '1111', '1234', '4321', '2026', '2025', '2024', '2580', '1357', '2468', '8888', '6868', '9999', '112233', '998877', '520520', '123321', '147258', '159753', '102030'];
function pinYeu_(pin, ma) {
  if (/^(\d)\1+$/.test(pin)) return true;                                   // 111111
  const d = pin.split('').map(Number);
  let tang = true, giam = true;
  for (let i = 0; i < d.length - 1; i++) { if (d[i + 1] - d[i] !== 1) tang = false; if (d[i] - d[i + 1] !== 1) giam = false; }
  if (tang || giam) return true;                                            // 1234, 654321
  if (pin.length % 2 === 0 && pin.slice(0, pin.length / 2) === pin.slice(pin.length / 2)) return true;   // 123123
  if (PIN_YEU.indexOf(pin) >= 0) return true;
  const m = s_(ma).replace(/\D/g, '');
  if (m && m.slice(-pin.length) === pin) return true;                       // trùng đuôi Mã HRM
  return false;
}
function doiPin_(u, p) {
  const pin = s_(p.pin);
  if (!/^\d{4,6}$/.test(pin)) throw 'PIN gồm 4–6 chữ số';
  if (pinYeu_(pin, u.ma)) throw 'PIN quá dễ đoán (số lặp, dãy liên tiếp, trùng đuôi Mã HRM…). Chọn PIN khác';
  const salt = Utilities.getUuid().slice(0, 8);
  setCell_('NhanSu', u._row, 'Salt', salt);
  setCell_('NhanSu', u._row, 'PinHash', hash_(salt, pin));
  setCell_('NhanSu', u._row, 'PinTam', '');
  setCell_('NhanSu', u._row, 'DoiPin', false);
  setCell_('NhanSu', u._row, 'SaiPin', 0);
  log_(u.ma, 'DOI_PIN', '');
  return 'Đã đổi PIN';
}
function quyenTrenNguoi_(u, r) {     // chỉ ADMIN được đụng tài khoản quản lý / lãnh đạo / quản trị
  if (u.vaiTro !== 'ADMIN' && s_(r.VaiTro) !== 'TOVIEN') throw 'Chỉ Quản trị hệ thống được cấp lại PIN hoặc mở khóa tài khoản của quản lý, lãnh đạo và quản trị';
}
function resetPin_(u, p) {
  const r = read_('NhanSu').filter(function (x) { return s_(x.MaHRM) === s_(p.ma); })[0];
  if (!r) throw 'Không tìm thấy nhân sự';
  quyenTrenNguoi_(u, r);
  const pin = ('' + Math.floor(100000 + Math.random() * 900000));
  setCell_('NhanSu', r._row, 'PinTam', pin);
  setCell_('NhanSu', r._row, 'PinHash', '');
  setCell_('NhanSu', r._row, 'DoiPin', true);
  setCell_('NhanSu', r._row, 'SaiPin', 0);
  setCell_('NhanSu', r._row, 'Khoa', false);
  CacheService.getScriptCache().remove('f_' + s_(p.ma));
  log_(u.ma, 'RESET_PIN', 'cấp lại PIN tạm cho ' + s_(r.HoTen) + ' (' + s_(p.ma) + ', ' + s_(r.VaiTro) + ')');
  return { pin: pin, ten: s_(r.HoTen) };
}
function moKhoaTK_(u, p) {
  const r = read_('NhanSu').filter(function (x) { return s_(x.MaHRM) === s_(p.ma); })[0];
  if (!r) throw 'Không tìm thấy nhân sự';
  quyenTrenNguoi_(u, r);
  setCell_('NhanSu', r._row, 'Khoa', false); setCell_('NhanSu', r._row, 'SaiPin', 0);
  CacheService.getScriptCache().remove('f_' + s_(p.ma));
  log_(u.ma, 'MO_KHOA_TK', s_(p.ma) + ' ' + s_(r.HoTen));
  return 'Đã mở khóa tài khoản';
}

/* ---------- Ghi báo cáo ---------- */
function ghi_(u, p) {      // chạy trong withLock_ ở api()
  {
    if (u.vaiTro === 'LANHDAO') throw 'Tài khoản Lãnh đạo chỉ được xem';
    const t = now_(), admin = isAdmin_(u);
    const buoc = s_(p.buoc);
    if (['NHAN', 'NHAN_NHOM', 'SCAN', 'TACH', 'OCR', 'TRA'].indexOf(buoc) < 0) throw 'Bước báo cáo không hợp lệ';
    if ((buoc === 'NHAN' || buoc === 'TRA') && !admin) throw 'Chỉ Tổ trưởng/Tổ phó được nhận từ Trung tâm Lưu trữ / xác nhận trả hộp';
    let ngay = t.ngay, ca = s_(p.ca), nhom = '', loai = 'THƯỜNG';
    if (p.boSung) {
      if (!admin) throw 'Chỉ Tổ trưởng/Tổ phó được bổ sung lịch sử';
      ngay = d_(p.ngay); nhom = s_(p.nhom); loai = 'BỔ SUNG';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || !CA[ca]) throw 'Ngày/ca bổ sung không hợp lệ';
      if (ngay > t.ngay) throw 'Không nhập báo cáo cho ngày tương lai';
      if (['NHAN_NHOM', 'SCAN', 'TACH', 'OCR'].indexOf(buoc) >= 0) {
        if (nhom) {
          const nm = membersOf_(ngay, ca, nhom);
          if (!nm.length) throw 'Nhóm ' + nhom + ' chưa có trong ca ' + ca + ' ngày ' + ngay;
          if (s_(p.nguoiHo) && !nm.some(function (m) { return m.ma === s_(p.nguoiHo); })) throw 'Người được nhập hộ không thuộc nhóm ' + nhom;
        } else if (!s_(p.nguoiHo)) throw 'Chọn người được nhập hộ (hoặc chọn nhóm)';   // không chọn nhóm = báo cáo cá nhân
      }
    } else {
      if (!CA[ca]) throw 'Chưa chọn ca';
      const assigned = read_('PhanCa').some(function (r) { return d_(r.Ngay) === ngay && s_(r.Ca) === ca && s_(r.MaHRM) === u.ma; });
      if (!assigned && !(admin && (buoc === 'NHAN' || buoc === 'TRA'))) throw 'Bạn không thuộc danh sách ' + ('ca ' + ca).toLowerCase() + ' hôm nay – không được báo cáo ca này';
      const st = caState_(ngay, ca, t);
      if (st.locked) throw 'Ca đã được chốt – liên hệ Tổ trưởng/Tổ phó';
      if (!st.canInput) throw 'Ngoài thời gian nhập ca ' + ca + ' (' + st.tu + '–' + st.den + ')';
      nhom = nhomOf_(ngay, ca, u.ma);      // chưa phân nhóm = báo cáo cá nhân (nhom rỗng, thành viên = chính người báo cáo)
      if (buoc === 'NHAN_NHOM' && s_(p.kieuNhan) === 'CANHAN') nhom = '';     // chọn nhận cá nhân: chỉ ghi cho riêng người này
      if (buoc === 'NHAN_NHOM' && s_(p.kieuNhan) === 'NHOM' && !nhom) throw 'Bạn chưa được phân nhóm trong ca ' + ca + ' – yêu cầu Tổ trưởng/Tổ phó phân nhóm trước khi nhận hộp theo nhóm (hoặc chọn nhận Cá nhân)';
    }
    let nguoiHoTen = '';
    if (s_(p.nguoiHo)) {
      if (!admin) throw 'Chỉ quản lý được nhập hộ';
      const nh = read_('NhanSu').filter(function (r) { return s_(r.MaHRM) === s_(p.nguoiHo); })[0];
      if (!nh) throw 'Không tìm thấy người được nhập hộ';
      nguoiHoTen = s_(nh.HoTen); loai = 'NHẬP HỘ';
    }
    const raw = s_(p.hop).split(/\s+/).filter(Boolean);     // mỗi mã cách nhau bằng dòng/khoảng trắng (không dùng dấu phẩy)
    if (!raw.length) throw 'Chưa nhập mã hộp';
    const xau = raw.filter(function (h) { return !MA_HOP_RE.test(h); });
    if (xau.length) throw 'Mã hộp không hợp lệ: ' + xau.slice(0, 3).join(' | ') + ' (chỉ chữ, số, . _ - /; tối đa 30 ký tự; mỗi mã một dòng, không dùng dấu phẩy)';
    const hops = raw.filter(function (h, i) { return raw.indexOf(h) === i; });   // loại mã trùng trong danh sách nhập
    if (hops.length > 200) throw 'Tối đa 200 mã hộp mỗi lần';
    const canhanBuoc = ['NHAN_NHOM', 'SCAN', 'TACH', 'OCR'].indexOf(buoc) >= 0;
    const tv = nhom ? membersOf_(ngay, ca, nhom).map(function (m) { return m.ma; }).join(',')   // chốt thành viên nhóm lúc báo cáo
      : (canhanBuoc ? (s_(p.nguoiHo) || u.ma) : '');                                             // cá nhân: chỉ người đó
    const ghiChu = (nguoiHoTen ? '[Nhập hộ: ' + nguoiHoTen + '] ' : '') + s_(p.ghiChu);
    const warnings = [], rows = read_('NhatKy').filter(function (r) { return !b_(r.Huy); });
    if (raw.length > hops.length) warnings.push('Đã bỏ ' + (raw.length - hops.length) + ' mã trùng trong danh sách nhập');
    const has = function (b, h, het) { return rows.some(function (r) { return s_(r.Buoc) === b && s_(r.MaHop) === h && (!het || b_(r.HetHop)); }); };
    let added = 0, ct = '';

    if (buoc === 'SCAN' || buoc === 'TACH' || buoc === 'OCR') {
      if (hops.length !== 1) throw 'Mỗi lần báo cáo chỉ nhập 1 mã hộp';
      const hs = Math.floor(n_(p.soHoSo)), trang = Math.floor(n_(p.soTrang)), to = Math.floor(n_(p.soTo)), loi = Math.floor(n_(p.trangLoi));
      if (hs < 0 || trang < 0 || to < 0 || loi < 0) throw 'Số liệu không được âm';
      if (hs < 1) throw 'Nhập số hồ sơ (≥ 1)';
      if (trang < 1 && to < 1) throw 'Nhập số trang hoặc số tờ';
      if (hs > 60 || trang > 20000 || to > 10000) throw 'Số liệu bất thường, vui lòng kiểm tra lại';
      const het = !!p.hetHop, h = hops[0];
      if (has(buoc, h, true)) throw 'Hộp ' + h + ' đã được báo cáo XONG ở bước này – không nhận thêm báo cáo. Cần chỉnh thì nhờ Quản trị sửa/xóa bản ghi cũ';
      if (!has('NHAN', h) && !has('NHAN_NHOM', h)) { warnings.push('Hộp ' + h + ' chưa có trong danh sách đã nhận'); loai = (loai === 'BỔ SUNG' || loai === 'NHẬP HỘ') ? loai : 'CẢNH BÁO'; }
      if (buoc === 'TACH' && !has('SCAN', h)) warnings.push('Hộp ' + h + ' chưa có báo cáo Scan');
      if (buoc === 'OCR' && !has('TACH', h)) warnings.push('Hộp ' + h + ' chưa có báo cáo Tách file');
      append_('NhatKy', { ID: 'R' + Utilities.getUuid().slice(0, 8), ThoiGian: t.ts, Ngay: ngay, Ca: ca, Nhom: nhom, Buoc: buoc, MaHop: h,
        SoHoSo: hs, SoTrang: trang, SoTo: to, TrangLoi: loi, HetHop: het, MaHoSo: s_(p.maHoSo), GhiChu: ghiChu, NguoiNhap: u.ma, Loai: loai, Huy: false, ThanhVien: tv });
      added = 1; ct = hs + ' hồ sơ, ' + trang + ' trang, ' + to + ' tờ' + (het ? ', xong hộp' : '');
    } else {
      const objs = [];
      hops.forEach(function (h) {
        if (has(buoc, h)) { warnings.push('Hộp ' + h + ' đã ghi nhận trước đó – bỏ qua'); return; }
        if (buoc === 'TRA') {
          if (has('NHAN', h)) {
            if (!has('TACH', h, true)) { warnings.push('Hộp ' + h + ' chưa Tách file xong – KHÔNG ghi trả, bỏ qua hộp này'); return; }
          } else {          // hộp không có trong danh sách nhận: chỉ cảnh báo, vẫn ghi
            warnings.push('Hộp ' + h + ' chưa có trong danh sách nhận từ Trung tâm Lưu trữ');
            if (!has('SCAN', h, true)) warnings.push('Hộp ' + h + ' CHƯA Scan xong mà đã trả');
          }
        }
        objs.push({ ID: 'R' + Utilities.getUuid().slice(0, 8), ThoiGian: t.ts, Ngay: ngay, Ca: ca, Nhom: nhom, Buoc: buoc, MaHop: h,
          SoHoSo: 0, SoTrang: 0, SoTo: 0, TrangLoi: 0, HetHop: false, MaHoSo: (buoc === 'NHAN' || buoc === 'NHAN_NHOM') ? (s_(p.maHoSo) || s_(p.ghiChu)) : '', GhiChu: ghiChu, NguoiNhap: u.ma, Loai: loai, Huy: false, ThanhVien: tv });
      });
      appendMany_('NhatKy', objs);
      added = objs.length;
    }
    log_(u.ma, 'BAO_CAO', STEP_NAME_[buoc] + ' | báo cho ngày ' + ngay + ' ca ' + ca + ' nhóm ' + (nhom || '-') + ' | hộp ' + hops.join(',') + (ct ? ' | ' + ct : '') + (((buoc === 'NHAN' || buoc === 'NHAN_NHOM') && s_(p.ghiChu)) ? ' | mã hồ sơ/ghi chú: ' + s_(p.ghiChu) : '') + ' | ' + loai + (nguoiHoTen ? ' | nhập hộ ' + nguoiHoTen : '') + (warnings.length ? ' | ⚠ ' + warnings.join('; ') : ''));
    return { added: added, warnings: warnings };
  }
}

/* ---------- Ghi theo lô: nhiều hộp × (Scan, Tách, OCR) trong một lần gửi (P2) ---------- */
const LO_MAX_HOP = 10, LO_MAX_MUC = 30, LO_BUOC = ['SCAN', 'TACH', 'OCR'];
function ghiLo_(u, p) {      // chạy trong withLock_ ở api(); MỌI kiểm tra nằm ở ghi_ (gọi lại cho từng mục, không chép logic)
  const idLo = s_(p.idLo);
  if (!/^[A-Za-z0-9_\-]{8,64}$/.test(idLo)) throw 'Thiếu mã lần gửi (idLo) – tải lại trang rồi gửi lại';
  const cache = CacheService.getScriptCache(), key = 'lo_' + u.ma + '_' + idLo;
  const da = cache.get(key);
  if (da) { const kq = JSON.parse(da); kq.guiLai = true; return kq; }      // R4: gửi lại cùng idLo -> trả kết quả cũ, không ghi thêm
  const muc = Array.isArray(p.muc) ? p.muc : [];
  if (!muc.length) throw 'Chưa có dòng nào để gửi';
  if (muc.length > LO_MAX_MUC) throw 'Mỗi lần gửi tối đa ' + LO_MAX_HOP + ' hộp × ' + LO_BUOC.length + ' khâu (' + LO_MAX_MUC + ' dòng)';
  const thuTu = [], theoHop = {};
  muc.forEach(function (m) {
    const h = s_(m && m.hop), b = s_(m && m.buoc);
    if (LO_BUOC.indexOf(b) < 0) throw 'Khâu không hợp lệ trong lô: ' + b + ' (chỉ Scan, Tách file, OCR)';
    if (!h) throw 'Có dòng chưa nhập mã hộp';
    if (!theoHop[h]) { theoHop[h] = []; thuTu.push(h); }
    theoHop[h].push(m);
  });
  if (thuTu.length > LO_MAX_HOP) throw 'Mỗi lần gửi tối đa ' + LO_MAX_HOP + ' hộp (đang có ' + thuTu.length + ')';
  const chung = {};
  ['ca', 'boSung', 'ngay', 'nhom', 'nguoiHo', 'ghiChu'].forEach(function (k) { if (p[k] !== undefined) chung[k] = p[k]; });
  const ketQua = [], warnings = [];
  let added = 0, loi = 0;
  LO_DANG_GHI_ = true;
  try {
    thuTu.forEach(function (h) {
      theoHop[h].sort(function (a, b) { return LO_BUOC.indexOf(s_(a.buoc)) - LO_BUOC.indexOf(s_(b.buoc)); });
      let hong = '';
      theoHop[h].forEach(function (m) {
        const b = s_(m.buoc), kq = { hop: h, buoc: b, ok: false, added: 0, warnings: [], err: '' };
        ketQua.push(kq);
        if (hong) { kq.err = 'Bỏ qua vì khâu ' + (STEP_NAME_[hong] || hong) + ' của hộp này bị lỗi'; loi++; return; }
        const q = Object.assign({}, chung, { buoc: b, hop: h, soHoSo: m.soHoSo, soTrang: m.soTrang, soTo: m.soTo, trangLoi: m.trangLoi, hetHop: !!m.hetHop, maHoSo: m.maHoSo });
        try {
          const r = ghi_(u, q);
          kq.ok = true; kq.added = r.added; kq.warnings = r.warnings; added += r.added;
          r.warnings.forEach(function (w) { if (warnings.indexOf(w) < 0) warnings.push(w); });
        } catch (e) { kq.err = String(e && e.message ? e.message : e); hong = b; loi++; }
      });
    });
  } finally { LO_DANG_GHI_ = false; }
  const kqCuoi = { idLo: idLo, ketQua: ketQua, added: added, loi: loi, warnings: warnings };
  log_(u.ma, 'BAO_CAO_LO', 'lô ' + idLo + ': ' + thuTu.length + ' hộp, ' + muc.length + ' dòng, ghi ' + added + ' bản ghi, ' + loi + ' dòng lỗi/bỏ qua');
  try { const txt = JSON.stringify(kqCuoi); if (txt.length < 90000) cache.put(key, txt, 600); } catch (e) { }
  return kqCuoi;
}

/* ---------- Sửa dữ liệu cũ: mã hộp bị Sheets đổi thành ngày (CHỈ chủ Sheet chạy từ trình soạn) ---------- */
function suaMaHopNgay() {
  ownerOnly_();
  return withLock_(function () {
    const sh = ss_().getSheetByName('NhatKy'), v = sh.getDataRange().getValues(), h = TAB.NhatKy;
    const cols = ['MaHop', 'MaHoSo'].map(function (k) { return h.indexOf(k); });
    const sua = [], bo = [];
    for (let i = 1; i < v.length; i++) {
      let co = false;
      cols.forEach(function (c) { if (v[i][c] instanceof Date) { sua.push({ row: i + 1, col: c + 1, val: Utilities.formatDate(v[i][c], TZ, 'dd.MM.yy') }); co = true; } });
      if (co) bo.push(v[i]);
    }
    if (!sua.length) return { daSua: 0, soDong: 0 };
    const saoLuu = saoLuuDong_('NhatKy', bo, 'suaMaHopNgay');      // sao lưu các dòng sắp sửa vào tab SaoLuuXoa
    sua.forEach(function (x) { const rg = sh.getRange(x.row, x.col); rg.setNumberFormat('@'); rg.setValue(x.val); });
    memoClear_('NhatKy');
    log_('CHU_SHEET', 'SUA_MA_HOP_NGAY', 'đổi ' + sua.length + ' ô mã hộp/mã hồ sơ bị Sheets đổi thành ngày về dạng dd.MM.yy (' + bo.length + ' dòng, sao lưu ở ' + saoLuu + '): ' + sua.slice(0, 20).map(function (x) { return 'dòng ' + x.row + ' → ' + x.val; }).join('; '));
    return { daSua: sua.length, soDong: bo.length };
  });
}

function huy_(u, p) {
  const t = now_();
  const r = read_('NhatKy').filter(function (x) { return s_(x.ID) === s_(p.id); })[0];
  if (!r) throw 'Không tìm thấy bản ghi';
  if (b_(r.Huy)) throw 'Bản ghi đã được xóa trước đó';
  if (u.vaiTro !== 'ADMIN') {
    const st = caState_(d_(r.Ngay), s_(r.Ca), t);
    if (!isAdmin_(u)) throw 'Tổ viên không được hủy báo cáo – nhờ Tổ trưởng/Tổ phó hoặc Quản trị hủy để báo cáo lại';
    if (!st.canInput) throw 'Ca đã khóa – chỉ Quản trị hệ thống được xóa; hoặc mở khóa ca trước';
  }
  setCell_('NhatKy', r._row, 'Huy', true);
  setCell_('NhatKy', r._row, 'NguoiHuy', u.ma + ' ' + t.ts);
  log_(u.ma, 'XOA_BAO_CAO', 'ID ' + s_(p.id) + ' | ' + s_(r.Buoc) + ' ngày ' + d_(r.Ngay) + ' ca ' + s_(r.Ca) + ' nhóm ' + s_(r.Nhom) + ' hộp ' + s_(r.MaHop) + ' ' + n_(r.SoHoSo) + ' hồ sơ ' + n_(r.SoTrang) + ' trang ' + n_(r.SoTo) + ' tờ | người nhập ' + s_(r.NguoiNhap));
  return 'Đã xóa bản ghi';
}
function khoiPhuc_(u, p) {
  const r = read_('NhatKy').filter(function (x) { return s_(x.ID) === s_(p.id); })[0];
  if (!r) throw 'Không tìm thấy bản ghi';
  if (!b_(r.Huy)) throw 'Bản ghi này chưa bị xóa';
  const mot = ['NHAN', 'NHAN_NHOM', 'TRA'].indexOf(s_(r.Buoc)) >= 0;
  const trung = read_('NhatKy').some(function (x) {
    if (b_(x.Huy) || s_(x.ID) === s_(p.id) || s_(x.Buoc) !== s_(r.Buoc) || s_(x.MaHop) !== s_(r.MaHop)) return false;
    return mot || (b_(r.HetHop) && b_(x.HetHop));
  });
  if (trung) throw 'Không khôi phục được: hộp ' + s_(r.MaHop) + ' đã có bản ghi còn hiệu lực ở bước này (tránh cộng trùng). Xóa hoặc sửa bản ghi kia trước.';
  setCell_('NhatKy', r._row, 'Huy', false); setCell_('NhatKy', r._row, 'NguoiHuy', '');
  log_(u.ma, 'KHOI_PHUC_BAO_CAO', 'ID ' + s_(p.id) + ' | ' + s_(r.Buoc) + ' ngày ' + d_(r.Ngay) + ' ca ' + s_(r.Ca) + ' hộp ' + s_(r.MaHop));
  return 'Đã khôi phục bản ghi';
}
function nhatKyHT_(p) {
  const tu = d_(p.tu), den = d_(p.den), ma = s_(p.ma), hd = s_(p.hanhDong).toUpperCase();
  const rs = read_('LogHeThong').filter(function (r) {
    const ngay = ts_(r.ThoiGian).slice(0, 10);
    if (tu && ngay < tu) return false;
    if (den && ngay > den) return false;
    if (ma && s_(r.MaHRM) !== ma) return false;
    if (hd && s_(r.HanhDong).toUpperCase().indexOf(hd) < 0) return false;
    return true;
  });
  return rs.slice(-600).reverse().map(function (r) {
    return { tg: ts_(r.ThoiGian), ma: s_(r.MaHRM), ten: s_(r.HoTen), vai: s_(r.VaiTro), hd: s_(r.HanhDong), ngayCa: s_(r.NgayCa), ct: s_(r.ChiTiet) };
  });
}
function nhatKy_(u, p) {
  const t = now_(), ngay = d_(p.ngay) || t.ngay, ca = s_(p.ca);
  const ns = {}; read_('NhanSu').forEach(function (r) { ns[s_(r.MaHRM)] = s_(r.HoTen); });
  let myNhom = {};
  if (!isAdmin_(u)) read_('PhanNhom').forEach(function (r) { if (d_(r.Ngay) === ngay && s_(r.MaHRM) === u.ma) myNhom[s_(r.Ca)] = s_(r.Nhom); });
  return read_('NhatKy').filter(function (r) {
    if (d_(r.Ngay) !== ngay) return false;
    if (b_(r.Huy) && !(p.includeHuy && u.vaiTro === 'ADMIN')) return false;
    if (ca && s_(r.Ca) !== ca) return false;
    if (isAdmin_(u)) return true;
    // tổ viên chỉ thấy báo cáo của mình và của nhóm mình LÚC BÁO CÁO (theo ThanhVien lưu kèm bản ghi);
    // đổi nhóm thì không còn thấy báo cáo của nhóm cũ, nhóm mới cũng không thấy báo cáo trước khi mình vào
    if (s_(r.NguoiNhap) === u.ma) return true;
    const tv = s_(r.ThanhVien);
    if (tv) return tv.split(',').indexOf(u.ma) >= 0;
    return !!(s_(r.Nhom) && myNhom[s_(r.Ca)] === s_(r.Nhom));   // bản ghi cũ chưa có ThanhVien
  }).map(function (r) {
    return { id: s_(r.ID), ngay: d_(r.Ngay), gio: ts_(r.ThoiGian).slice(11, 16), ca: s_(r.Ca), nhom: s_(r.Nhom), buoc: s_(r.Buoc), hop: s_(r.MaHop),
      hs: n_(r.SoHoSo), trang: n_(r.SoTrang), to: n_(r.SoTo), loi: n_(r.TrangLoi), het: b_(r.HetHop), ghiChu: s_(r.GhiChu),
      nguoi: ns[s_(r.NguoiNhap)] || s_(r.NguoiNhap), loai: s_(r.Loai), daXoa: b_(r.Huy), mine: s_(r.NguoiNhap) === u.ma };
  }).reverse();
}

function hopGoiY_(u, p) {
  const buoc = s_(p.buoc), rows = read_('NhatKy').filter(function (r) { return !b_(r.Huy); });
  const set = function (b, het) { const m = {}; rows.forEach(function (r) { if (s_(r.Buoc) === b && (!het || b_(r.HetHop))) m[s_(r.MaHop)] = 1; }); return m; };
  const nhan = set('NHAN'), nhanNhom = set('NHAN_NHOM'), scanDone = set('SCAN', true), tachDone = set('TACH', true), ocrDone = set('OCR', true), tra = set('TRA');
  let out = [];
  if (buoc === 'SCAN') out = Object.keys(nhanNhom).filter(function (h) { return !scanDone[h] && !tra[h]; });
  else if (buoc === 'TACH') out = Object.keys(scanDone).filter(function (h) { return !tachDone[h] && !tra[h]; });
  else if (buoc === 'OCR') out = Object.keys(tachDone).filter(function (h) { return !ocrDone[h]; });
  else if (buoc === 'NHAN_NHOM') out = Object.keys(nhan).filter(function (h) { return !nhanNhom[h] && !tra[h]; });
  else if (buoc === 'TRA') out = Object.keys(nhan).filter(function (h) { return !tra[h]; });
  return out.sort();
}

/* ---------- Vào ca (tự vào ca đang mở) và lịch sử cá nhân ---------- */
function vaoCa_(u, p) {
  if (!duocVaoCa_(u)) throw 'Tài khoản này không vào ca (Lãnh đạo, Quản trị)';
  const t = now_(), ca = s_(p.ca);
  if (!CA[ca]) throw 'Chọn ca';
  const st = caState_(t.ngay, ca, t);
  if (!st.canInput) throw 'Ca ' + ca + ' hiện không mở để vào ca (' + st.tu + '–' + st.den + ')';
  const rs = read_('PhanCa').filter(function (r) { return d_(r.Ngay) === t.ngay && s_(r.Ca) === ca; });
  if (rs.some(function (r) { return s_(r.MaHRM) === u.ma; })) return { daVao: true, moi: false, soDaVao: rs.length };
  append_('PhanCa', { Ngay: t.ngay, Ca: ca, MaHRM: u.ma, HoTen: u.ten });
  log_(u.ma, 'VAO_CA', 'vào ca ' + ca + ' ngày ' + t.ngay + ' (người thứ ' + (rs.length + 1) + ')');
  return { daVao: true, moi: true, soDaVao: rs.length + 1 };
}
function lichSu_(u, p) {          // sản lượng của chính người gọi, chia theo thành viên nhóm lúc báo cáo
  const t = now_(), den = d_(p.den) || t.ngay, tu = d_(p.tu) || den;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tu) || !/^\d{4}-\d{2}-\d{2}$/.test(den) || tu > den) throw 'Khoảng ngày không hợp lệ';
  if ((new Date(den + 'T00:00:00Z') - new Date(tu + 'T00:00:00Z')) / 86400000 > 62) throw 'Chỉ xem tối đa 63 ngày mỗi lần';
  const pn = read_('PhanNhom');
  const thanhVien = function (r) {
    if (s_(r.ThanhVien)) return s_(r.ThanhVien).split(',').filter(Boolean);
    return pn.filter(function (x) { return d_(x.Ngay) === d_(r.Ngay) && s_(x.Ca) === s_(r.Ca) && s_(x.Nhom) === s_(r.Nhom); }).map(function (x) { return s_(x.MaHRM); });
  };
  const out = [];
  read_('NhatKy').forEach(function (r) {
    const ng = d_(r.Ngay), b = s_(r.Buoc);
    if (b_(r.Huy) || s_(r.Loai) === 'THỬ NGHIỆM' || ['SCAN', 'TACH', 'OCR'].indexOf(b) < 0 || ng < tu || ng > den) return;
    const tv = thanhVien(r);
    if (tv.indexOf(u.ma) < 0) return;
    const dv = n_(r.SoTo) > 0 ? n_(r.SoTo) : n_(r.SoTrang);
    out.push({ ngay: ng, ca: s_(r.Ca), buoc: b, hop: s_(r.MaHop), dv: dv, phanCuaToi: Math.round(dv / tv.length * 10) / 10, het: b_(r.HetHop), _t: ts_(r.ThoiGian) });
  });
  out.sort(function (a, b) { return a._t < b._t ? 1 : -1; });
  return out.slice(0, 500).map(function (x) { delete x._t; return x; });
}

/* ---------- Quản trị nhân sự (chỉ ADMIN) ---------- */
function dsNhanSu_() {
  return read_('NhanSu').map(function (r) {
    return { ma: s_(r.MaHRM), ten: s_(r.HoTen), chucVu: s_(r.ChucVu), donVi: s_(r.DonVi), email: s_(r.Email), vaiTro: s_(r.VaiTro), hoatDong: b_(r.HoatDong), khoa: b_(r.Khoa) };
  });
}
function luuNhanSu_(u, p) {
  const ma = s_(p.ma), ten = s_(p.ten), vai = s_(p.vaiTro) || 'TOVIEN';
  if (!ma || !ten) throw 'Nhập Mã HRM và Họ tên';
  if (VAI_TRO_ALL.indexOf(vai) < 0) throw 'Vai trò không hợp lệ';
  const cu = read_('NhanSu').filter(function (r) { return s_(r.MaHRM) === ma; })[0];
  const hoatDong = p.hoatDong === false ? false : true;
  if (cu) {
    if (cu.MaHRM && s_(cu.MaHRM) === u.ma && (!hoatDong || vai !== 'ADMIN')) throw 'Không tự khóa hoặc hạ quyền chính mình';
    const cuStr = 'tên ' + s_(cu.HoTen) + ', chức vụ ' + s_(cu.ChucVu) + ', đơn vị ' + s_(cu.DonVi) + ', email ' + s_(cu.Email) + ', vai trò ' + s_(cu.VaiTro) + ', hoạt động ' + b_(cu.HoatDong);
    setCell_('NhanSu', cu._row, 'HoTen', ten); setCell_('NhanSu', cu._row, 'ChucVu', s_(p.chucVu));
    setCell_('NhanSu', cu._row, 'DonVi', s_(p.donVi)); setCell_('NhanSu', cu._row, 'Email', s_(p.email));
    setCell_('NhanSu', cu._row, 'VaiTro', vai); setCell_('NhanSu', cu._row, 'HoatDong', hoatDong);
    log_(u.ma, 'SUA_NHAN_SU', ma + ' | cũ: ' + cuStr + ' | mới: tên ' + ten + ', chức vụ ' + s_(p.chucVu) + ', đơn vị ' + s_(p.donVi) + ', email ' + s_(p.email) + ', vai trò ' + vai + ', hoạt động ' + hoatDong);
    return { moi: false, ma: ma };
  }
  const pin = ('' + Math.floor(100000 + Math.random() * 900000));
  append_('NhanSu', { MaHRM: ma, HoTen: ten, ChucVu: s_(p.chucVu) || 'Tổ viên', DonVi: s_(p.donVi), Email: s_(p.email), VaiTro: vai,
    PinHash: '', Salt: '', PinTam: pin, DoiPin: true, SaiPin: 0, Khoa: false, HoatDong: hoatDong });
  log_(u.ma, 'THEM_NHAN_SU', ma + ' ' + vai);
  return { moi: true, ma: ma, pin: pin };
}

/* ---------- Quản trị dữ liệu báo cáo: sửa / reset / tạo mẫu (chỉ ADMIN) ---------- */
function appendMany_(name, objs) {
  if (!objs.length) return;
  const sh = ss_().getSheetByName(name), h = TAB[name];
  const vals = objs.map(function (o) { return h.map(function (k) { return o[k] === undefined || o[k] === null ? '' : safe_(o[k]); }); });
  const first = sh.getLastRow() + 1;
  if (first + vals.length - 1 > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), Math.max(1000, vals.length));
  const rg = sh.getRange(first, 1, vals.length, h.length);
  textFmt_(rg, h, vals.length);   // thiếu bước này từng làm mã hộp "02.01.85" bị Sheets đổi thành ngày (dòng Nhận hộp)
  rg.setValues(vals);
  memoThem_(name, first, h, vals);
}
// Sao lưu các dòng sắp xóa vào tab SaoLuuXoa (nhanh hơn nhiều so với chép cả tab)
function saoLuuDong_(tab, rows, nguoi) {
  if (!rows.length) return '';
  const ss = ss_(), nm = 'SaoLuuXoa';
  let sh = ss.getSheetByName(nm);
  if (!sh) { sh = ss.insertSheet(nm); sh.getRange(1, 1, 1, 4).setValues([['ThoiGian', 'Tab', 'NguoiXoa', 'DuLieu']]); }
  const ts = now_().ts;
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 4).setValues(rows.map(function (r) { return [ts, tab, nguoi, JSON.stringify(r.map(function (x) { return x instanceof Date ? ts_(x) : x; }))]; }));
  return nm;
}
function rewrite_(name, dropFn, saoLuu) {      // xóa các dòng thỏa dropFn(obj); trả về số dòng đã xóa; saoLuu = mã người xóa -> lưu dòng bị xóa
  const sh = ss_().getSheetByName(name), v = sh.getDataRange().getValues();
  if (v.length < 2) return 0;
  const h = v[0], keep = [], bo = [];
  let dropped = 0;
  for (let i = 1; i < v.length; i++) {
    const o = {}; for (let j = 0; j < h.length; j++) o[h[j]] = v[i][j];
    if (s_(v[i][0]) !== '' && dropFn(o)) { dropped++; if (saoLuu) bo.push(v[i]); } else if (s_(v[i][0]) !== '') keep.push(v[i]);
  }
  if (!dropped) return 0;
  if (saoLuu) saoLuuDong_(name, bo, saoLuu);
  sh.getRange(2, 1, v.length - 1, h.length).clearContent();
  if (keep.length) sh.getRange(2, 1, keep.length, h.length).setValues(keep);
  memoClear_(name);
  return dropped;
}
function suaBanGhi_(u, p) {
  const r = read_('NhatKy').filter(function (x) { return s_(x.ID) === s_(p.id); })[0];
  if (!r) throw 'Không tìm thấy bản ghi';
  const set = function (col, val) { setCell_('NhatKy', r._row, col, val); };
  const cu = 'ngày ' + d_(r.Ngay) + ', ca ' + s_(r.Ca) + ', nhóm ' + s_(r.Nhom) + ', hộp ' + s_(r.MaHop) + ', ' + n_(r.SoHoSo) + ' hồ sơ, ' + n_(r.SoTrang) + ' trang, ' + n_(r.SoTo) + ' tờ, lỗi ' + n_(r.TrangLoi) + ', xong hộp ' + b_(r.HetHop);
  if (p.ngay !== undefined) { if (!/^\d{4}-\d{2}-\d{2}$/.test(d_(p.ngay))) throw 'Ngày không hợp lệ'; set('Ngay', d_(p.ngay)); }
  if (p.ca !== undefined) { if (!CA[s_(p.ca)]) throw 'Ca không hợp lệ'; set('Ca', s_(p.ca)); }
  if (p.nhom !== undefined) set('Nhom', s_(p.nhom));
  if (p.hop !== undefined) set('MaHop', s_(p.hop));
  ['soHoSo:SoHoSo', 'soTrang:SoTrang', 'soTo:SoTo', 'trangLoi:TrangLoi'].forEach(function (m) {
    const k = m.split(':'); if (p[k[0]] !== undefined) set(k[1], Math.max(0, Math.floor(n_(p[k[0]]))));
  });
  if (p.hetHop !== undefined) set('HetHop', !!p.hetHop);
  if (p.ghiChu !== undefined) set('GhiChu', s_(p.ghiChu));
  log_(u.ma, 'SUA_BAN_GHI', 'ID ' + s_(p.id) + ' | cũ: ' + cu + ' | mới: ngày ' + d_(p.ngay) + ', ca ' + s_(p.ca) + ', nhóm ' + s_(p.nhom) + ', hộp ' + s_(p.hop) + ', ' + s_(p.soHoSo) + ' hồ sơ, ' + s_(p.soTrang) + ' trang, ' + s_(p.soTo) + ' tờ, lỗi ' + s_(p.trangLoi) + ', xong hộp ' + !!p.hetHop);
  return 'Đã sửa bản ghi';
}
function resetDuLieu_(u, p) {
  const pv = s_(p.phamVi), sl = u.ma;     // mọi dòng bị xóa được lưu vào tab SaoLuuXoa
  let n = 0;
  if (pv === 'TATCA') {
    if (s_(p.xacNhan) !== 'XOA') throw 'Gõ đúng chữ XOA để xác nhận xóa toàn bộ dữ liệu báo cáo';
    n = rewrite_('NhatKy', function () { return true; }, sl);
    rewrite_('ChotCa', function () { return true; }, sl);
    rewrite_('PhanNhom', function () { return true; }, sl);
  } else if (pv === 'THU') {
    n = rewrite_('NhatKy', function (o) { return s_(o.Loai) === 'THỬ NGHIỆM'; }, sl);
    rewrite_('PhanNhom', function (o) { return s_(o.NguoiPhan) === 'MAU' || /^TN-/.test(s_(o.MaHRM)); }, sl);   // nhóm do "Tạo dữ liệu mẫu" sinh ra
    rewrite_('PhanCa', function (o) { return /^TN-/.test(s_(o.MaHRM)); }, sl);      // người giả TN-xx
    rewrite_('NhanSu', function (o) { return /^TN-/.test(s_(o.MaHRM)) && s_(o.ChucVu) === 'THỬ NGHIỆM'; }, sl);
  } else if (pv === 'NGAY') {
    if (s_(p.xacNhan) !== 'XOA') throw 'Gõ đúng chữ XOA để xác nhận xóa dữ liệu của ngày này';
    const ngay = d_(p.ngay);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) throw 'Chọn ngày';
    n = rewrite_('NhatKy', function (o) { return d_(o.Ngay) === ngay; }, sl);
    rewrite_('ChotCa', function (o) { return d_(o.Ngay) === ngay; }, sl);
    rewrite_('PhanNhom', function (o) { return d_(o.Ngay) === ngay; }, sl);
    if (p.caPhanCa) rewrite_('PhanCa', function (o) { return d_(o.Ngay) === ngay; }, sl);   // tùy chọn: xóa luôn danh sách vào ca
  } else throw 'Phạm vi không hợp lệ';
  log_(u.ma, 'RESET_DU_LIEU', pv + ' ' + s_(p.ngay) + ' xóa ' + n + ' | sao lưu: SaoLuuXoa');
  return { daXoa: n, saoLuu: ['SaoLuuXoa'] };
}
// Tạo dữ liệu mẫu (THỬ NGHIỆM): mỗi ca được chọn có đủ soNguoi người, ghép cặp thành nhóm 2 người.
// Giữ nguyên người/nhóm thật đang có; người còn thiếu là nhân sự giả mã "TN-xx" (không đăng nhập được).
// Nút "Xóa dữ liệu thử nghiệm" dọn sạch: bản ghi THỬ NGHIỆM, nhóm MAU, phân ca và nhân sự TN-xx.
function taoMau_(u, p) {
  const t = now_(), ngay = d_(p.ngay) || t.ngay;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) throw 'Chọn ngày';
  const cas = (Array.isArray(p.cas) && p.cas.length ? p.cas : CA_LIST).filter(function (c) { return CA[c]; });
  const soNguoi = Math.max(2, Math.min(20, Math.floor(n_(p.soNguoi)) || 6));
  const rnd = function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); };
  // nhân sự giả TN-01.. (tạo khi cần, HoatDong = false để không hiện ở màn hình đăng nhập)
  const nsMa = {}; read_('NhanSu').forEach(function (r) { nsMa[s_(r.MaHRM)] = s_(r.HoTen); });
  const fake = function (i) {
    const ma = 'TN-' + ('0' + i).slice(-2);
    if (!nsMa[ma]) {
      append_('NhanSu', { MaHRM: ma, HoTen: 'Thử nghiệm ' + ('0' + i).slice(-2), ChucVu: 'THỬ NGHIỆM', DonVi: 'Dữ liệu mẫu', VaiTro: 'TOVIEN', DoiPin: false, SaiPin: 0, Khoa: false, HoatDong: false });
      nsMa[ma] = 'Thử nghiệm ' + ('0' + i).slice(-2);
    }
    return ma;
  };
  let fakeNo = 0;
  const nk = [];
  let soCa = 0, soThem = 0;
  cas.forEach(function (ca) {
    soCa++;
    // 1) đủ soNguoi người trong ca
    const trong = read_('PhanCa').filter(function (r) { return d_(r.Ngay) === ngay && s_(r.Ca) === ca; }).map(function (r) { return s_(r.MaHRM); });
    const dangCo = {}; trong.forEach(function (m) { dangCo[m] = 1; });
    while (trong.length < soNguoi) {
      let ma; do { ma = fake(++fakeNo); } while (dangCo[ma]);
      append_('PhanCa', { Ngay: ngay, Ca: ca, MaHRM: ma, HoTen: nsMa[ma], GioBD: CA[ca].bd, GioKT: CA[ca].kt });
      trong.push(ma); dangCo[ma] = 1; soThem++;
    }
    // 2) ghép nhóm 2 người: giữ nhóm đang có, lấp nhóm thiếu người trước, rồi mở nhóm mới
    const nhom = {}; read_('PhanNhom').forEach(function (r) { if (d_(r.Ngay) === ngay && s_(r.Ca) === ca && dangCo[s_(r.MaHRM)]) (nhom[s_(r.Nhom)] = nhom[s_(r.Nhom)] || []).push(s_(r.MaHRM)); });
    const coNhom = {}; Object.keys(nhom).forEach(function (k) { nhom[k].forEach(function (m) { coNhom[m] = 1; }); });
    const le = trong.filter(function (m) { return !coNhom[m]; });
    const themNhom = function (k, m) { (nhom[k] = nhom[k] || []).push(m); append_('PhanNhom', { Ngay: ngay, Ca: ca, Nhom: k, MaHRM: m, HoTen: nsMa[m] || '', NguoiPhan: 'MAU', ThoiGian: t.ts }); };
    Object.keys(nhom).forEach(function (k) { while (nhom[k].length < 2 && le.length) themNhom(k, le.shift()); });
    let so = 1;
    while (le.length) { while (nhom[String(so)]) so++; const k = String(so); themNhom(k, le.shift()); if (le.length) themNhom(k, le.shift()); }
    // 3) báo cáo mẫu cho từng nhóm
    Object.keys(nhom).sort(function (a, b) { return Number(a) - Number(b); }).forEach(function (k) {
      const tvs = nhom[k].join(','), soHop = rnd(1, 2);
      for (let j = 1; j <= soHop; j++) {
        const hop = 'TEST-' + ngay.slice(5) + '-' + CA[ca].o + '-' + k + '-' + j, hs = rnd(5, 10), trang = rnd(150, 420), xong = Math.random() < 0.7;
        const mk = function (o) {
          return Object.assign({ ID: 'T' + Utilities.getUuid().slice(0, 7), ThoiGian: t.ts, Ngay: ngay, Ca: ca, Nhom: k, MaHop: hop, MaHoSo: '', GhiChu: 'Dữ liệu mẫu', NguoiNhap: nhom[k][0], Loai: 'THỬ NGHIỆM', Huy: false, SoHoSo: 0, SoTrang: 0, SoTo: 0, TrangLoi: 0, HetHop: false, ThanhVien: tvs }, o);
        };
        nk.push(mk({ Buoc: 'NHAN', Nhom: '', ThanhVien: '' }), mk({ Buoc: 'NHAN_NHOM' }),
          mk({ Buoc: 'SCAN', SoHoSo: hs, SoTrang: trang, TrangLoi: rnd(0, 6), HetHop: xong }),
          mk({ Buoc: 'TACH', SoHoSo: hs, SoTrang: trang - rnd(0, 8), HetHop: xong }));
        if (Math.random() < 0.6) nk.push(mk({ Buoc: 'OCR', SoHoSo: hs, SoTo: trang - rnd(5, 20), HetHop: true }));
      }
    });
  });
  if (!soCa) throw 'Chọn ít nhất 1 ca';
  appendMany_('NhatKy', nk);
  log_(u.ma, 'TAO_DU_LIEU_MAU', ngay + ' ' + cas.join('+') + ' | ' + soNguoi + ' người/ca | thêm ' + soThem + ' người giả | ' + nk.length + ' bản ghi');
  return { soBanGhi: nk.length, soCa: soCa, ngay: ngay, soThem: soThem, soNguoi: soNguoi };
}

/* ---------- Quản lý ca (Tổ trưởng / Tổ phó) ---------- */
function dsCa_(p) {
  const t = now_(), ngay = d_(p.ngay) || t.ngay, ca = s_(p.ca);
  if (!CA[ca]) throw 'Chọn ca';
  const nhomMap = {};
  read_('PhanNhom').forEach(function (r) { if (d_(r.Ngay) === ngay && s_(r.Ca) === ca) nhomMap[s_(r.MaHRM)] = s_(r.Nhom); });
  const nguoi = read_('PhanCa').filter(function (r) { return d_(r.Ngay) === ngay && s_(r.Ca) === ca; })
    .map(function (r) { return { ma: s_(r.MaHRM), ten: s_(r.HoTen), nhom: nhomMap[s_(r.MaHRM)] || '' }; });
  const inCa = {}; nguoi.forEach(function (x) { inCa[x.ma] = 1; });
  const tatCa = read_('NhanSu').filter(function (r) { return b_(r.HoatDong) && ['TOVIEN', 'TOTRUONG', 'TOPHO'].indexOf(s_(r.VaiTro)) >= 0 && !inCa[s_(r.MaHRM)]; })
    .map(function (r) { return { ma: s_(r.MaHRM), ten: s_(r.HoTen) }; });
  const st = caState_(ngay, ca, t);
  const daNhap = {};
  read_('NhatKy').forEach(function (r) { if (!b_(r.Huy) && d_(r.Ngay) === ngay && s_(r.Ca) === ca) daNhap[s_(r.Nhom) || '-'] = (daNhap[s_(r.Nhom) || '-'] || 0) + 1; });
  const nsAll = read_('NhanSu').map(function (r) { return { ma: s_(r.MaHRM), ten: s_(r.HoTen), vaiTro: s_(r.VaiTro), khoa: b_(r.Khoa) }; });
  return { ngay: ngay, ca: ca, nguoi: nguoi, themDuoc: tatCa, locked: st.locked, canInput: st.canInput, den: st.den, soBanGhi: daNhap, soDaVao: nguoi.length, nhanSu: nsAll };
}
function luuNhom_(u, p) {
  const ngay = d_(p.ngay), ca = s_(p.ca), t = now_();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || !CA[ca]) throw 'Ngày/ca không hợp lệ';
  const cuNhom = read_('PhanNhom').filter(function (r) { return d_(r.Ngay) === ngay && s_(r.Ca) === ca; }).map(function (r) { return (s_(r.HoTen) || s_(r.MaHRM)) + '→N' + s_(r.Nhom); }).join('; ');
  const sh = ss_().getSheetByName('PhanNhom');
  const names = {}; read_('NhanSu').forEach(function (r) { names[s_(r.MaHRM)] = s_(r.HoTen); });
  if (p.chiDoi) {
    // Chỉ cập nhật đúng những người được gửi lên – không đụng tới nhóm người khác do quản lý khác vừa xếp
    const trongCa = {}; read_('PhanCa').forEach(function (r) { if (d_(r.Ngay) === ngay && s_(r.Ca) === ca) trongCa[s_(r.MaHRM)] = 1; });
    const gan = (p.gan || []).filter(function (g) { return trongCa[s_(g.ma)]; });
    const doi = {}; gan.forEach(function (g) { doi[s_(g.ma)] = 1; });
    read_('PhanNhom').filter(function (r) { return d_(r.Ngay) === ngay && s_(r.Ca) === ca && doi[s_(r.MaHRM)]; })
      .map(function (r) { return r._row; }).sort(function (a, b) { return b - a; }).forEach(function (row) { sh.deleteRow(row); });
    memoClear_('PhanNhom');
    gan.forEach(function (g) {
      if (s_(g.nhom)) append_('PhanNhom', { Ngay: ngay, Ca: ca, Nhom: s_(g.nhom), MaHRM: s_(g.ma), HoTen: names[s_(g.ma)] || '', NguoiPhan: u.ma, ThoiGian: t.ts });
    });
    memoClear_('PhanNhom');
    log_(u.ma, 'PHAN_NHOM', ngay + ' ' + ca + ' | cũ: ' + (cuNhom || '(chưa có)') + ' | đổi: ' + (gan.map(function (g) { return (names[s_(g.ma)] || s_(g.ma)) + '→' + (s_(g.nhom) ? 'N' + s_(g.nhom) : 'bỏ nhóm'); }).join('; ') || '(không có)'));
    const nhom = {}; read_('PhanNhom').forEach(function (r) { if (d_(r.Ngay) === ngay && s_(r.Ca) === ca) nhom[s_(r.MaHRM)] = s_(r.Nhom); });
    return { msg: gan.length ? 'Đã lưu phân nhóm' : 'Không có thay đổi', nhom: nhom };
  }
  read_('PhanNhom').filter(function (r) { return d_(r.Ngay) === ngay && s_(r.Ca) === ca; })
    .map(function (r) { return r._row; }).sort(function (a, b) { return b - a; }).forEach(function (row) { sh.deleteRow(row); });
  (p.gan || []).forEach(function (g) {
    if (s_(g.nhom)) append_('PhanNhom', { Ngay: ngay, Ca: ca, Nhom: s_(g.nhom), MaHRM: s_(g.ma), HoTen: names[s_(g.ma)] || '', NguoiPhan: u.ma, ThoiGian: t.ts });
  });
  memoClear_('PhanNhom');
  log_(u.ma, 'PHAN_NHOM', ngay + ' ' + ca + ' | cũ: ' + (cuNhom || '(chưa có)') + ' | mới: ' + (p.gan || []).filter(function (g) { return s_(g.nhom); }).map(function (g) { return (names[s_(g.ma)] || s_(g.ma)) + '→N' + s_(g.nhom); }).join('; '));
  return 'Đã lưu phân nhóm';
}
function suaCa_(u, p) {
  const ngay = d_(p.ngay), ca = s_(p.ca), ma = s_(p.ma);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || !CA[ca]) throw 'Ngày/ca không hợp lệ';
  const ns = read_('NhanSu').filter(function (r) { return s_(r.MaHRM) === ma; })[0];
  if (!ns) throw 'Không tìm thấy nhân sự';
  const xoaDong = function (tab, rows) {
    const sh = ss_().getSheetByName(tab);
    rows.map(function (r) { return r._row; }).sort(function (a, b) { return b - a; }).forEach(function (row) { sh.deleteRow(row); });
    memoClear_(tab);
  };
  if (p.them) {
    if (!b_(ns.HoatDong) || !duocVaoCa_({ vaiTro: s_(ns.VaiTro) })) throw 'Tài khoản này không thể được thêm vào ca';
    if (read_('PhanCa').some(function (r) { return d_(r.Ngay) === ngay && s_(r.Ca) === ca && s_(r.MaHRM) === ma; })) return 'Người này đã có trong ca';
    append_('PhanCa', { Ngay: ngay, Ca: ca, MaHRM: ma, HoTen: s_(ns.HoTen) });
  } else {
    xoaDong('PhanCa', read_('PhanCa').filter(function (r) { return d_(r.Ngay) === ngay && s_(r.Ca) === ca && s_(r.MaHRM) === ma; }));
    const nhomCu = read_('PhanNhom').filter(function (r) { return d_(r.Ngay) === ngay && s_(r.Ca) === ca && s_(r.MaHRM) === ma; });
    if (nhomCu.length) {          // người rời ca không còn nằm trong nhóm nào của ca đó
      xoaDong('PhanNhom', nhomCu);
      log_(u.ma, 'BO_KHOI_NHOM', ngay + ' ' + ca + ' ' + ma + ' ' + s_(ns.HoTen) + ' | cũ: nhóm ' + nhomCu.map(function (r) { return s_(r.Nhom); }).join(',') + ' | mới: (không nhóm, đã rời ca)');
    }
  }
  memoClear_('PhanCa');
  log_(u.ma, p.them ? 'THEM_VAO_CA' : 'BO_KHOI_CA', ngay + ' ' + ca + ' ' + ma + ' ' + s_(ns.HoTen));
  return 'Đã cập nhật nhân sự ca';
}
function chot_(u, p) {
  const ngay = d_(p.ngay), ca = s_(p.ca), t = now_(), trangThai = p.mo ? 'MO' : 'CHOT';
  if (!CA[ca]) throw 'Chọn ca';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) throw 'Ngày không hợp lệ';
  if (ngay > t.ngay) throw 'Không chốt hoặc mở khóa ca của ngày tương lai';
  append_('ChotCa', { Ngay: ngay, Ca: ca, TrangThai: trangThai, NguoiXacNhan: u.ma, ThoiGian: t.ts, GhiChu: s_(p.ghiChu) });
  log_(u.ma, trangThai === 'CHOT' ? 'CHOT_CA' : 'MO_KHOA_CA', ngay + ' ' + ca);
  let canhBao = [];
  if (trangThai === 'CHOT') {
    const co = {}; read_('NhatKy').forEach(function (r) { if (!b_(r.Huy) && d_(r.Ngay) === ngay && s_(r.Ca) === ca && s_(r.Nhom)) co[s_(r.Nhom)] = 1; });
    const nhoms = {}; read_('PhanNhom').forEach(function (r) { if (d_(r.Ngay) === ngay && s_(r.Ca) === ca) nhoms[s_(r.Nhom)] = 1; });
    canhBao = Object.keys(nhoms).filter(function (n) { return !co[n]; });
  }
  return { trangThai: trangThai, nhomChuaBaoCao: canhBao };
}

/* ====================== Dashboard ====================== */
function dash_(ngayIn, gomThu) {
  const t = now_(), ngay = d_(ngayIn) || t.ngay;
  const rows = read_('NhatKy').filter(function (r) { return !b_(r.Huy); }).map(function (r) {
    return { ngay: d_(r.Ngay), ca: s_(r.Ca), nhom: s_(r.Nhom), buoc: s_(r.Buoc), hop: s_(r.MaHop), hs: n_(r.SoHoSo), trang: n_(r.SoTrang),
      to: n_(r.SoTo), loi: n_(r.TrangLoi), het: b_(r.HetHop), nguoi: s_(r.NguoiNhap), loai: s_(r.Loai), tv: s_(r.ThanhVien) };
  }).filter(function (r) { return CA[r.ca] && (gomThu || r.loai !== 'THỬ NGHIỆM'); });   // dữ liệu THỬ NGHIỆM không tính vào số thật
  const ns = {}; read_('NhanSu').forEach(function (r) { ns[s_(r.MaHRM)] = s_(r.HoTen); });
  const pn = read_('PhanNhom');
  // DauKy: dòng có Ngay = số liệu TỪNG NGÀY (02–08/11) trước khi chạy hệ thống (Ca = Sáng/Chiều/Tối hoặc "Ngày" = sáng+chiều gộp);
  //        dòng không có Ngay = số dư gộp (lũy kế đến hết DAU_KY_DEN). Đừng nhập trùng hai kiểu cho cùng một số liệu.
  const dkLump = { SCAN: 0, TACH: 0, OCR: 0 }, dkNgay = [];
  read_('DauKy').forEach(function (r) {
    const b = s_(r.Buoc).toUpperCase(); if (dkLump[b] === undefined) return;
    const v = n_(r.SoTo) > 0 ? n_(r.SoTo) : n_(r.SoTrang), nd = d_(r.Ngay);
    if (nd) dkNgay.push({ b: b, ngay: nd, ca: s_(r.Ca), dv: v }); else dkLump[b] += v;
  });
  const dkSum = function (b, o) {
    return dkNgay.reduce(function (a, x) { return a + ((x.b === b && (!o.ngay || x.ngay === o.ngay) && (!o.ca || x.ca === o.ca) && (!o.den || x.ngay <= o.den)) ? x.dv : 0); }, 0);
  };
  rows.forEach(function (r) { r.k = r.ngay + '|' + CA[r.ca].o; r.dv = r.to > 0 ? r.to : r.trang; });
  const first = function (buoc, needHet) {
    const m = {};
    rows.forEach(function (r) { if (r.buoc === buoc && (!needHet || r.het) && r.hop && (m[r.hop] === undefined || r.k < m[r.hop])) m[r.hop] = r.k; });
    return m;
  };
  const nhan = first('NHAN'), scan = first('SCAN', true), tach = first('TACH', true), ocr = first('OCR', true), tra = first('TRA');
  const lt = function (m, h, k) { return m[h] !== undefined && m[h] < k; };
  const trangThaiTruoc = function (k) {
    let tonDau = 0, chuaScan = 0, chuaTach = 0;
    Object.keys(nhan).forEach(function (h) {
      if (lt(nhan, h, k) && !lt(tra, h, k)) { tonDau++; if (!lt(scan, h, k)) chuaScan++; }
    });
    Object.keys(scan).forEach(function (h) { if (lt(scan, h, k) && !lt(tach, h, k) && !lt(tra, h, k)) chuaTach++; });
    let chuaOcr = 0;
    Object.keys(tach).forEach(function (h) { if (lt(tach, h, k) && !lt(ocr, h, k)) chuaOcr++; });
    return { tonDau: tonDau, chuaScan: chuaScan, chuaTach: chuaTach, chuaOcr: chuaOcr };
  };
  // den (tùy chọn): chỉ tính tới mốc này (dùng cho lũy kế đến hết ngày đang xem)
  const cnt = function (m, prefix, den) { return Object.keys(m).filter(function (h) { return m[h].indexOf(prefix) === 0 && (!den || m[h] <= den); }).length; };
  const agg = function (prefix, den) {
    const rs = rows.filter(function (r) { return r.k.indexOf(prefix) === 0 && (!den || r.k <= den); });
    const sum = function (b, f) { return rs.filter(function (r) { return r.buoc === b; }).reduce(function (a, r) { return a + r[f]; }, 0); };
    const nn = {}; rs.forEach(function (r) { if (r.buoc === 'NHAN_NHOM') nn[r.hop] = 1; });
    const ng = {}; rs.forEach(function (r) { ng[r.nguoi] = 1; });
    return { nhanHop: cnt(nhan, prefix, den), nhanNhomHop: Object.keys(nn).length, traHop: cnt(tra, prefix, den),
      scanHop: cnt(scan, prefix, den), scanDV: sum('SCAN', 'dv'), scanHs: sum('SCAN', 'hs'), scanTrang: sum('SCAN', 'trang'), scanTo: sum('SCAN', 'to'), scanLoi: sum('SCAN', 'loi'),
      tachHop: cnt(tach, prefix, den), tachDV: sum('TACH', 'dv'), tachHs: sum('TACH', 'hs'), tachTrang: sum('TACH', 'trang'), tachTo: sum('TACH', 'to'),
      ocrHop: cnt(ocr, prefix, den), ocrDV: sum('OCR', 'dv'), ocrHs: sum('OCR', 'hs'), ocrTrang: sum('OCR', 'trang'), ocrTo: sum('OCR', 'to'),
      nguoiBaoCao: Object.keys(ng).length };
  };
  const nPhan = {};
  const laTN_ = function (ma) { return !gomThu && s_(ma).indexOf('TN-') === 0; };   // người thử nghiệm TN-xx: không tính vào số thật
  read_('PhanCa').forEach(function (r) { if (d_(r.Ngay) === ngay && !laTN_(r.MaHRM)) nPhan[s_(r.Ca)] = (nPhan[s_(r.Ca)] || 0) + 1; });
  const tongNhomCa = {}, daBCCa = {};       // chỉ để hiển thị "x/y nhóm đã báo cáo", không chặn gì
  pn.forEach(function (r) { if (d_(r.Ngay) === ngay) (tongNhomCa[s_(r.Ca)] = tongNhomCa[s_(r.Ca)] || {})[s_(r.Nhom)] = 1; });
  rows.forEach(function (r) { if (r.ngay === ngay && r.nhom && ['NHAN_NHOM', 'SCAN', 'TACH', 'OCR'].indexOf(r.buoc) >= 0) (daBCCa[r.ca] = daBCCa[r.ca] || {})[r.nhom] = 1; });
  const ttCa = function (ca) {
    if (ngay < t.ngay) return 'xong';
    if (ngay > t.ngay) return 'chua';
    return t.min < min_(CA[ca].bd) ? 'chua' : (t.min <= min_(CA[ca].kt) ? 'dang' : 'xong');
  };
  const cas = CA_LIST.map(function (ca) {
    const k = ngay + '|' + CA[ca].o;
    return Object.assign({ ca: ca, bd: CA[ca].bd, kt: CA[ca].kt, tt: ttCa(ca), nguoiPhan: nPhan[ca] || 0, nhomDaBC: Object.keys(daBCCa[ca] || {}).length, tongNhom: Object.keys(tongNhomCa[ca] || {}).length, chot: chotStatus_(ngay, ca) === 'CHOT' }, trangThaiTruoc(k), agg(k));
  });
  cas.forEach(function (c) { ['SCAN', 'TACH', 'OCR'].forEach(function (b) { c[b.toLowerCase() + 'DV'] += dkSum(b, { ngay: ngay, ca: c.ca }); }); });   // ca Tối (và Sáng/Chiều nếu có) của giai đoạn DauKy
  const caGop = { scanDV: dkSum('SCAN', { ngay: ngay, ca: 'Ngày' }), tachDV: dkSum('TACH', { ngay: ngay, ca: 'Ngày' }), ocrDV: dkSum('OCR', { ngay: ngay, ca: 'Ngày' }) };   // "ca ngày" cũ (sáng+chiều gộp)
  const day = agg(ngay + '|');
  day.scanDV += dkSum('SCAN', { ngay: ngay }); day.tachDV += dkSum('TACH', { ngay: ngay }); day.ocrDV += dkSum('OCR', { ngay: ngay });
  const cuoi = trangThaiTruoc(ngay + '|9');
  day.tonCuoi = cuoi.tonDau; day.chuaScanCuoi = cuoi.chuaScan; day.chuaTachCuoi = cuoi.chuaTach; day.chuaOcrCuoi = cuoi.chuaOcr;
  const dauNgay = trangThaiTruoc(ngay + '|0');
  day.tonDauNgay = dauNgay.tonDau;

  // chuỗi theo ngày (10 ngày gần nhất có dữ liệu, tính đến ngày đang xem)
  const dm = {}; rows.forEach(function (r) { if (r.ngay <= ngay) dm[r.ngay] = 1; }); dkNgay.forEach(function (x) { if (x.ngay <= ngay) dm[x.ngay] = 1; }); dm[ngay] = 1;
  const days = Object.keys(dm).sort().slice(-10);
  const series = days.map(function (d) {
    const a = agg(d + '|'), c = trangThaiTruoc(d + '|9');
    return { ngay: d, nhanHop: a.nhanHop, traHop: a.traHop, scanHop: a.scanHop, tachHop: a.tachHop, scanTrang: a.scanTrang, tachTrang: a.tachTrang, ocrHop: a.ocrHop, ocrDV: a.ocrDV + dkSum('OCR', { ngay: d }), scanDV: a.scanDV + dkSum('SCAN', { ngay: d }), tachDV: a.tachDV + dkSum('TACH', { ngay: d }),
      tonCuoi: c.tonDau, chuaScanCuoi: c.chuaScan, chuaTachCuoi: c.chuaTach };
  });

  // theo nhóm + cá nhân (50/50 trong nhóm)
  const nhoms = {}, canhan = {};
  pn.filter(function (r) { return d_(r.Ngay) === ngay; }).forEach(function (r) {
    const key = s_(r.Ca) + '|' + s_(r.Nhom);
    (nhoms[key] = nhoms[key] || { ca: s_(r.Ca), nhom: s_(r.Nhom), tv: [] }).tv.push({ ma: s_(r.MaHRM), ten: s_(r.HoTen) || ns[s_(r.MaHRM)] || s_(r.MaHRM) });
  });
  const z = function () { return { scanHop: 0, scanHs: 0, scanTrang: 0, scanTo: 0, scanDV: 0, tachHop: 0, tachHs: 0, tachTrang: 0, tachTo: 0, tachDV: 0, ocrHop: 0, ocrHs: 0, ocrTrang: 0, ocrTo: 0, ocrDV: 0 }; };
  Object.keys(nhoms).forEach(function (k) { Object.assign(nhoms[k], z()); });
  rows.filter(function (r) { return r.ngay === ngay && (r.buoc === 'SCAN' || r.buoc === 'TACH' || r.buoc === 'OCR'); }).forEach(function (r) {
    // thành viên lấy theo lúc báo cáo (ThanhVien); đổi nhóm sau đó không làm mất số của cá nhân
    const mem = r.tv ? r.tv.split(',').filter(Boolean).map(function (ma) { return { ma: ma, ten: ns[ma] || ma }; }) : null;
    const b = r.buoc.toLowerCase();
    const add = { Hs: r.hs, Trang: r.trang, To: r.to, Hop: r.het ? 1 : 0, DV: r.dv };
    let g = null;
    if (r.nhom) {
      const key = r.ca + '|' + r.nhom;
      g = nhoms[key];
      if (!g) g = nhoms[key] = Object.assign({ ca: r.ca, nhom: r.nhom, tv: mem || [] }, z());
      Object.keys(add).forEach(function (f) { g[b + f] += add[f]; });
    }
    const tvs = (mem && mem.length) ? mem : (g ? g.tv : []);   // báo cáo cá nhân (không nhóm): chỉ tính cho cá nhân, không vào bảng nhóm
    tvs.forEach(function (mm) {
      const c = canhan[mm.ma] = canhan[mm.ma] || Object.assign({ ma: mm.ma, ten: mm.ten, ca: {} }, z());
      c.ca[r.ca] = 1;
      Object.keys(add).forEach(function (f) { c[b + f] += add[f] / tvs.length; });
    });
  });
  const nhomOut = Object.keys(nhoms).map(function (k) {
    const g = nhoms[k], gio = g.tv.length * CA[g.ca].gio;
    g.gioNguoi = gio;
    g.scanDVGio = gio ? Math.round(g.scanDV / gio * 10) / 10 : 0;
    g.tachDVGio = gio ? Math.round(g.tachDV / gio * 10) / 10 : 0;
    g.ocrDVGio = gio ? Math.round(g.ocrDV / gio * 10) / 10 : 0;
    g.scanTrangGio = g.scanDVGio; g.tachTrangGio = g.tachDVGio; g.ocrTrangGio = g.ocrDVGio;   // tên cũ (giao diện cũ); giao diện mới dùng *DVGio
    return g;
  }).sort(function (a, b) { return CA[a.ca].o - CA[b.ca].o || a.nhom.localeCompare(b.nhom); });
  const canhanOut = Object.keys(canhan).map(function (k) {
    const c = canhan[k]; c.soCa = Object.keys(c.ca).length; delete c.ca;
    Object.keys(c).forEach(function (f) { if (typeof c[f] === 'number') c[f] = Math.round(c[f] * 10) / 10; });
    return c;
  }).sort(function (a, b) { return (b.scanDV + b.tachDV + b.ocrDV) - (a.scanDV + a.tachDV + a.ocrDV); });

  // TỪNG CA: mỗi người trong ca thuộc nhóm nào, làm được bao nhiêu (kể cả người chưa báo cáo)
  const cn = {};
  const getCN = function (ca, ma) { const k = ca + '|' + ma; return cn[k] = cn[k] || { ca: ca, ma: ma, ten: ns[ma] || ma, nhom: '', coMat: false, soBC: 0, nhanHop: 0, scanDV: 0, scanHs: 0, tachDV: 0, tachHs: 0, ocrDV: 0, ocrHs: 0 }; };
  read_('PhanCa').forEach(function (r) { if (d_(r.Ngay) === ngay && CA[s_(r.Ca)] && !laTN_(r.MaHRM)) getCN(s_(r.Ca), s_(r.MaHRM)).coMat = true; });
  pn.forEach(function (r) { if (d_(r.Ngay) === ngay && CA[s_(r.Ca)] && !laTN_(r.MaHRM)) getCN(s_(r.Ca), s_(r.MaHRM)).nhom = s_(r.Nhom); });
  rows.filter(function (r) { return r.ngay === ngay && ['NHAN_NHOM', 'SCAN', 'TACH', 'OCR'].indexOf(r.buoc) >= 0; }).forEach(function (r) {
    let mem = r.tv ? r.tv.split(',').filter(Boolean) : [];
    if (!mem.length) mem = r.nhom && nhoms[r.ca + '|' + r.nhom] ? nhoms[r.ca + '|' + r.nhom].tv.map(function (x) { return x.ma; }) : [r.nguoi];
    mem.forEach(function (ma) {
      const c = getCN(r.ca, ma), share = 1 / mem.length;
      c.soBC++;
      if (r.buoc === 'NHAN_NHOM') c.nhanHop++;
      else { const b = r.buoc.toLowerCase(); c[b + 'DV'] += r.dv * share; c[b + 'Hs'] += r.hs * share; }
    });
  });
  const caNguoi = Object.keys(cn).map(function (k) {
    const c = cn[k];
    ['scanDV', 'scanHs', 'tachDV', 'tachHs', 'ocrDV', 'ocrHs'].forEach(function (f) { c[f] = Math.round(c[f] * 10) / 10; });
    return c;
  }).sort(function (a, b) { return CA[a.ca].o - CA[b.ca].o || (a.nhom || 'zz').localeCompare(b.nhom || 'zz', 'vi', { numeric: true }) || a.ten.localeCompare(b.ten, 'vi'); });

  // lũy kế toàn bộ
  // lũy kế ĐẾN HẾT NGÀY ĐANG XEM (xem ngày cũ thì tiến độ là tiến độ lúc đó)
  const denMoc = ngay + '|9';
  const all = agg('', denMoc);
  const cuoiAll = trangThaiTruoc(denMoc);
  all.ton = cuoiAll.tonDau; all.chuaScan = cuoiAll.chuaScan; all.chuaTach = cuoiAll.chuaTach;
  // Số dư đầu kỳ gộp (dòng DauKy không có Ngay); số liệu từng ngày (có Ngay) được cộng thêm đến hết ngày đang xem
  const dk = { SCAN: { hop: 0, hs: 0, trang: 0, to: dkLump.SCAN }, TACH: { hop: 0, hs: 0, trang: 0, to: dkLump.TACH }, OCR: { hop: 0, hs: 0, trang: 0, to: dkLump.OCR } };
  const dv = function (o) { return o.to > 0 ? o.to : o.trang; };
  all.dauKy = dk;
  all.dauKyDen = { scanDV: dkLump.SCAN + dkSum('SCAN', { den: ngay }), tachDV: dkLump.TACH + dkSum('TACH', { den: ngay }), ocrDV: dkLump.OCR + dkSum('OCR', { den: ngay }) };   // đầu kỳ tính đến hết ngày đang xem
  // Số ngày / số ca ĐÃ KẾT THÚC theo bản phân ca của TCHC (từ 02/11) -> năng suất trung bình và dự kiến hoàn thành
  const caKetThuc = {}, ngayCoCa = {};
  read_('PhanCa').forEach(function (r) {      // ca sau giai đoạn DauKy: ca đã kết thúc và có người vào
    const dN = d_(r.Ngay), c = s_(r.Ca);
    if (!CA[c] || dN > t.ngay || dN > ngay || dN <= DAU_KY_DEN) return;
    if (dN < t.ngay || t.min > min_(CA[c].kt)) { caKetThuc[dN + '|' + c] = 1; ngayCoCa[dN] = 1; }
  });
  let nDK = 0, cDK = 0; Object.keys(DAU_KY_CA).forEach(function (d) { if (d <= ngay) { nDK++; cDK += DAU_KY_CA[d]; } });   // ngày/ca của giai đoạn DauKy đã trôi qua tới ngày đang xem
  const soCa = cDK + Object.keys(caKetThuc).length, soNgay = nDK + Object.keys(ngayCoCa).length;
  const tuNgay = NGAY_BAT_DAU;
  const buocs = [['scan', 'SCAN', 'scanDV', 'Scan'], ['tach', 'TACH', 'tachDV', 'Tách file PDF'], ['ocr', 'OCR', 'ocrDV', 'OCR']];
  const tienDo = { mucTieu: MUC_TIEU_TO, denNgay: ngay, tuNgay: tuNgay, soNgay: soNgay, soCa: soCa, buoc: buocs.map(function (b) {
    const da = all[b[2]] + dv(dk[b[1]]) + dkSum(b[1], { den: ngay }), con = Math.max(0, MUC_TIEU_TO - da);
    const tbNgay = soNgay ? da / soNgay : 0, tbCa = soCa ? da / soCa : 0;
    const nConLai = tbNgay > 0 ? Math.ceil(con / tbNgay) : null;
    return { key: b[0], ten: b[3], daLam: da, tyLe: da / MUC_TIEU_TO * 100, conLai: con, tbNgay: Math.round(tbNgay), tbCa: Math.round(tbCa),
      ngayConLai: nConLai, ngayXong: nConLai === null ? '' : Utilities.formatDate(new Date((ngay < t.ngay ? new Date(ngay + 'T12:00:00+07:00').getTime() : Date.now()) + nConLai * 86400000), TZ, 'dd/MM/yyyy') };
  }) };
  // ai nhập, nhập bao nhiêu: chi tiết từng lần báo cáo trong ngày + tổng hợp theo ca / người nhập
  const chiTiet = read_('NhatKy').filter(function (r) { return !b_(r.Huy) && d_(r.Ngay) === ngay && CA[s_(r.Ca)] && (gomThu || s_(r.Loai) !== 'THỬ NGHIỆM'); }).map(function (r) {
    const sc = ['SCAN', 'TACH', 'OCR'].indexOf(s_(r.Buoc)) >= 0, to = n_(r.SoTo), trang = n_(r.SoTrang);
    const tvTen = s_(r.ThanhVien) ? s_(r.ThanhVien).split(',').filter(Boolean).map(function (m) { return ns[m] || m; }).join(' + ') : '';
    return { gio: ts_(r.ThoiGian).slice(11, 16), ca: s_(r.Ca), nhom: s_(r.Nhom), buoc: s_(r.Buoc), hop: s_(r.MaHop), hs: n_(r.SoHoSo), trang: trang, to: to, dv: sc ? (to > 0 ? to : trang) : 0,
      het: b_(r.HetHop), ma: s_(r.NguoiNhap), nguoi: ns[s_(r.NguoiNhap)] || s_(r.NguoiNhap), thucHien: tvTen, loai: s_(r.Loai) };
  }).sort(function (a, b) { return CA[a.ca].o - CA[b.ca].o || a.gio.localeCompare(b.gio); });
  const nnMap = {};
  chiTiet.forEach(function (r) {
    const key = r.ca + '|' + r.ma;
    const x = nnMap[key] = nnMap[key] || { ca: r.ca, ma: r.ma, ten: r.nguoi, nhom: r.nhom, soLan: 0, scanDV: 0, scanHs: 0, tachDV: 0, tachHs: 0, ocrDV: 0, ocrHs: 0, nhanHop: 0, traHop: 0 };
    x.soLan++;
    if (r.buoc === 'SCAN') { x.scanDV += r.dv; x.scanHs += r.hs; } else if (r.buoc === 'TACH') { x.tachDV += r.dv; x.tachHs += r.hs; } else if (r.buoc === 'OCR') { x.ocrDV += r.dv; x.ocrHs += r.hs; }
    else if (r.buoc === 'NHAN' || r.buoc === 'NHAN_NHOM') x.nhanHop++; else if (r.buoc === 'TRA') x.traHop++;
  });
  const nguoiNhap = Object.keys(nnMap).map(function (k) { return nnMap[k]; }).sort(function (a, b) { return CA[a.ca].o - CA[b.ca].o || a.ten.localeCompare(b.ten, 'vi'); });
  return { ngay: ngay, capNhat: t.ts, cas: cas, caGop: caGop, day: day, series: series, nhom: nhomOut, canhan: canhanOut, caNguoi: caNguoi, nguoiNhap: nguoiNhap, chiTiet: chiTiet, luyKe: all, tienDo: tienDo };
}
