// Kiểm thử bằng mock (không chạm Google Sheet thật):  node tools/test_mock.js
const fs = require('fs'), vm = require('vm'), crypto = require('crypto');
const code = fs.readFileSync(__dirname + '/../apps-script/Code.gs', 'utf8');

// ---------- mock Google ----------
let getValuesCalls = 0, lockCount = 0;
const getValuesBy = {};   // số lần đọc từng tab (đếm R1)
const fmtLog = [], appendRowCalls = {};
class Sheet {
  constructor(name, header) { this.name = name; this.rows = [header.slice()]; this.maxRows = 1000; }
  getDataRange() { const me = this; return { getValues() { getValuesCalls++; getValuesBy[me.name] = (getValuesBy[me.name] || 0) + 1; return me.rows.map(r => r.slice()); } }; }
  appendRow(a) { appendRowCalls[this.name] = (appendRowCalls[this.name] || 0) + 1; this.rows.push(a.slice()); }
  getLastRow() { return this.rows.length; }
  getMaxRows() { return this.maxRows; } getMaxColumns() { return 26; }
  insertRowsAfter(pos, n) { this.maxRows += n; }
  deleteRow(r) { this.rows.splice(r - 1, 1); }
  getRange(r, c, nr, nc) {
    const me = this; nr = nr || 1; nc = nc || 1;
    const ensure = (rr) => { while (me.rows.length < rr) me.rows.push([]); };
    return {
      setValue(v) { ensure(r); me.rows[r - 1][c - 1] = v; return this; },
      setValues(vs) {
        for (let i = 0; i < vs.length; i++) {
          ensure(r + i);
          for (let j = 0; j < vs[i].length; j++) {
            let v = vs[i][j]; const m = typeof v === 'string' && v.match(/^(\d\d)\.(\d\d)\.(\d\d)$/);
            if (m && !(me.fmts && me.fmts[r + i] && me.fmts[r + i][c - 1 + j] === '@')) v = new Date(Date.UTC(+m[3] >= 30 ? 1900 + +m[3] : 2000 + +m[3], +m[2] - 1, +m[1]));   // giả lập Sheets tự đổi "02.01.85" thành ngày khi ô chưa là văn bản
            me.rows[r + i - 1][c - 1 + j] = v;
          }
        }
        return this;
      },
      clearContent() { for (let i = 0; i < nr; i++) if (me.rows[r + i - 1]) for (let j = 0; j < nc; j++) me.rows[r + i - 1][c - 1 + j] = ''; return this; },
      setNumberFormat() { fmtLog.push([me.name, me.maxRows]); return this; }, setFontWeight() { return this; },
      getNumberFormats() { return Array.from({ length: nr }, () => Array(nc).fill('')); }, setNumberFormats(f) { me.fmts = me.fmts || {}; for (let i = 0; i < f.length; i++) me.fmts[r + i] = f[i]; return this; }
    };
  }
  setFrozenRows() { } setName(n) { this.name = n; return this; }
  copyTo(ss) { const s = new Sheet('copy', []); s.rows = this.rows.map(r => r.slice()); ss.sheets.push(s); return s; }
}
const TABS = {
  NhanSu: ['MaHRM','HoTen','ChucVu','DonVi','Email','VaiTro','PinHash','Salt','PinTam','DoiPin','SaiPin','Khoa','HoatDong'],
  PhanCa: ['Ngay','Ca','MaHRM','HoTen','GioBD','GioKT'],
  PhanNhom: ['Ngay','Ca','Nhom','MaHRM','HoTen','NguoiPhan','ThoiGian'],
  NhatKy: ['ID','ThoiGian','Ngay','Ca','Nhom','Buoc','MaHop','SoHoSo','SoTrang','SoTo','TrangLoi','HetHop','MaHoSo','GhiChu','NguoiNhap','Loai','Huy','NguoiHuy','ThanhVien'],
  ChotCa: ['Ngay','Ca','TrangThai','NguoiXacNhan','ThoiGian','GhiChu'],
  DauKy: ['Buoc','SoHop','SoHoSo','SoTrang','SoTo','GhiChu','Ngay','Ca'],
  LogHeThong: ['ThoiGian','MaHRM','HoTen','VaiTro','HanhDong','NgayCa','ChiTiet']
};
const ss = { sheets: [], getSheetByName(n) { return this.sheets.find(s => s.name === n) || null; }, insertSheet(n) { const s = new Sheet(n, []); this.sheets.push(s); return s; }, getId() { return 'X'; }, setSpreadsheetTimeZone() { } };
Object.keys(TABS).forEach(n => ss.sheets.push(new Sheet(n, TABS[n])));
const fmt = (d, tz, f) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(d).map(x => [x.type, x.value]));
  const H = p.hour === '24' ? '00' : p.hour;
  return f.replace('yyyy', p.year).replace('yy', p.year.slice(2)).replace('MM', p.month).replace('dd', p.day).replace('HH', H).replace('mm', p.minute).replace('ss', p.second);
};
const cacheMap = {};
const ctx = {
  console, Date, Math, JSON, Object, Number, String, Array, isFinite, isNaN, Intl, RegExp,
  Utilities: { formatDate: fmt, getUuid: () => crypto.randomUUID(), base64Encode: b => Buffer.from(b).toString('base64'), computeDigest: (a, s) => Array.from(crypto.createHash('sha256').update(s).digest()), DigestAlgorithm: { SHA_256: 1 } },
  CacheService: { getScriptCache: () => ({ get: k => (k in cacheMap ? cacheMap[k] : null), put: (k, v) => { cacheMap[k] = v; }, remove: k => { delete cacheMap[k]; } }) },
  LockService: { getScriptLock: () => ({ waitLock() { lockCount++; }, releaseLock() { } }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'X', setProperty() { } }) },
  SpreadsheetApp: { getActiveSpreadsheet: () => ss, openById: () => ss, getUi: () => ({ alert() { }, createMenu: () => ({ addItem() { return this; }, addToUi() { } }) }) },
  Session: { getActiveUser: () => ({ getEmail: () => ctx.__active }), getEffectiveUser: () => ({ getEmail: () => 'owner@x.com' }) },
  HtmlService: {}
};
ctx.__active = '';
vm.createContext(ctx); vm.runInContext(code, ctx);
{ const mc = ctx.memoClear_; ctx.__memoOnly = () => mc(); ctx.memoClear_ = function (n) { mc(n); if (!n) Object.keys(cacheMap).forEach(k => { if (/^(tab|ver)_/.test(k)) delete cacheMap[k]; }); }; }   // test sửa thẳng Sheet: bỏ luôn cache tab
let NOW = '2026-11-09 15:30:00';
const setNow = (ts) => { NOW = ts; ctx.now_ = () => { const hm = NOW.slice(11, 16), p = hm.split(':'); return { ngay: NOW.slice(0, 10), hm, min: +p[0] * 60 + +p[1], ts: NOW }; }; ctx.memoClear_(); };
setNow(NOW);

// ---------- dữ liệu ----------
const sh = n => ss.getSheetByName(n);
const addUser = (ma, ten, vt, pin, doi, dv, email) => sh('NhanSu').rows.push([ma, ten, vt, dv || 'Đơn vị B', email || '', vt, '', '', pin, !!doi, 0, false, true]);
addUser('ADMIN', 'Quản trị', 'ADMIN', '482916', false, 'Bưu điện TP Huế');
addUser('TT1', 'Tổ trưởng', 'TOTRUONG', '222222', false, 'Trung tâm vận hành');
addUser('A1', 'Nhân viên A', 'TOVIEN', '333333', false, 'Phòng Tổ chức hành chính');
addUser('B1', 'Nhân viên B', 'TOVIEN', '444444', false, 'Phòng Tổ chức hành chính');
addUser('C1', 'Nhân viên C', 'TOVIEN', '555555', true, 'Phòng Tài chính kế hoạch');
addUser('LD1', 'Lãnh đạo', 'LANHDAO', '666666', false, 'Lãnh đạo BĐTP');
addUser('D1', 'Nhân viên D', 'TOVIEN', '777777', false, 'Trung tâm vận hành');
addUser('00076603', 'Nhân viên E', 'TOVIEN', '888888', true, 'Trung tâm vận hành', 'e@gmail.com');
sh('DauKy').rows.push(['SCAN', '', '', '', 1000, ''], ['TACH', '', '', '', 500, ''], ['OCR', '', '', '', 100, '']);

let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('PASS', name); } else { fail++; console.log('FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const tok = (ma, pin) => ctx.login(ma, pin).token;
const api = (t, a, p) => ctx.api(t, a, p || {});

// ===== 1. dsLogin =====
const dl = ctx.dsLogin();
ok(dl.ngay === '2026-11-09' && dl.hm === '15:30' && Array.isArray(dl.nhanSu) && !('trongCa' in dl), 'dsLogin trả {ngay,hm,nhanSu}', Object.keys(dl));
ok(dl.nhanSu.length === 8 && dl.nhanSu.every(x => Object.keys(x).sort().join() === 'donVi,ma,ten'), 'dsLogin: mọi người đang hoạt động, chỉ có ma/ten/donVi (không lộ vai trò)', dl.nhanSu[0]);
const dvs = dl.nhanSu.map(x => x.donVi);
ok(JSON.stringify(dvs) === JSON.stringify(dvs.slice().sort((a, b) => a.localeCompare(b, 'vi'))), 'dsLogin sắp theo đơn vị', dvs);
sh('NhanSu').rows.push(['NGHI', 'Đã nghỉ', 'Tổ viên', 'X', '', 'TOVIEN', '', '', '123450', false, 0, false, false]);
ctx.memoClear_();
ok(!ctx.dsLogin().nhanSu.some(x => x.ma === 'NGHI'), 'dsLogin bỏ người không hoạt động');

// ===== 2. Đăng nhập, tạm khóa, khóa 20 lần, bắt đổi PIN =====
const tAdmin = tok('ADMIN', '482916'), tA = tok('A1', '333333'), tB = tok('B1', '444444'), tLD = tok('LD1', '666666'), tD = tok('D1', '777777');
var tTT = tok('TT1', '222222');
ok(tAdmin && tTT && tA && tB && tLD, 'đăng nhập đúng PIN');
let r; for (let i = 0; i < 5; i++) r = ctx.login('B1', '000000');
r = ctx.login('B1', '444444');
ok(!r.ok && /quá 5 lần/.test(r.err), 'sai 5 lần: đúng PIN vẫn bị tạm khóa 15 phút', r);
ok(sh('NhanSu').rows.find(x => x[0] === 'B1')[11] === false, 'tạm khóa 15 phút KHÔNG đặt cột Khoa');
delete cacheMap['f_B1'];
ok(!!tok('B1', '444444') && sh('NhanSu').rows.find(x => x[0] === 'B1')[10] === 0, 'đăng nhập đúng xóa bộ đếm sai PIN');
for (let i = 0; i < 19; i++) { delete cacheMap['f_D1']; ctx.login('D1', '000000'); }
ok(sh('NhanSu').rows.find(x => x[0] === 'D1')[11] === false, '19 lần sai chưa khóa hẳn');
delete cacheMap['f_D1']; r = ctx.login('D1', '000000');
ok(sh('NhanSu').rows.find(x => x[0] === 'D1')[11] === true && /bị khóa/.test(r.err), 'lần sai thứ 20: khóa hẳn tài khoản', r);
delete cacheMap['f_D1']; r = ctx.login('D1', '777777');
ok(!r.ok && /khóa/.test(r.err), 'tài khoản đã khóa hẳn không đăng nhập được kể cả PIN đúng');
const tC = tok('C1', '555555');
r = api(tC, 'ghi', { buoc: 'SCAN' });
ok(!r.ok && /đổi PIN lần đầu/.test(r.err), 'server chặn hành động khi chưa đổi PIN lần đầu', r);
ok(api(tC, 'me').ok, 'me vẫn gọi được khi chưa đổi PIN');
ok(api(tC, 'doiPin', { pin: '9371' }).ok, 'đổi PIN lần đầu bằng PIN tốt');

// ===== 3. PIN dễ đoán, bỏ kiểm tra Gmail =====
const tE = tok('00076603', '888888');
for (const bad of ['111111', '123456', '654321', '1234', '123123', '0000', '2026', '076603', '6603']) {
  r = api(tE, 'doiPin', { pin: bad });
  ok(!r.ok && /dễ đoán/.test(r.err), 'cấm PIN dễ đoán: ' + bad, r);
}
ok(api(tE, 'doiPin', { pin: '382951' }).ok, 'PIN tốt được chấp nhận');
ctx.__active = 'nguoi.la@gmail.com';
ok(!!ctx.login('00076603', '382951').token, 'không còn kiểm tra Gmail khi đăng nhập (email khác vẫn vào được)');
ctx.__active = '';

// ===== 4. Phân quyền reset PIN =====
r = api(tTT, 'resetPin', { ma: 'ADMIN' });
ok(!r.ok && /Quản trị hệ thống/.test(r.err), 'Tổ trưởng KHÔNG reset được PIN của ADMIN', r);
ok(!api(tTT, 'moKhoaTK', { ma: 'ADMIN' }).ok, 'Tổ trưởng không mở khóa được tài khoản ADMIN');
ok(api(tTT, 'resetPin', { ma: 'C1' }).ok, 'Tổ trưởng reset được PIN tổ viên');
ok(!api(tTT, 'resetPin', { ma: 'TT1' }).ok, 'Tổ trưởng không reset PIN của quản lý');
const rTT = api(tAdmin, 'resetPin', { ma: 'TT1' });
ok(rTT.ok, 'ADMIN reset được PIN quản lý');
ok(api(tTT, 'me').ok && !api(tTT, 'dashboard', {}).ok, 'sau khi bị reset PIN, phiên cũ bị buộc đổi PIN lần đầu');
tTT = tok('TT1', rTT.data.pin); api(tTT, 'doiPin', { pin: '2957' }); tTT = tok('TT1', '2957');
ok(!api(tA, 'resetPin', { ma: 'B1' }).ok, 'tổ viên không reset được PIN');
delete cacheMap['f_D1']; api(tAdmin, 'moKhoaTK', { ma: 'D1' });
ok(sh('NhanSu').rows.find(x => x[0] === 'D1')[11] === false && sh('NhanSu').rows.find(x => x[0] === 'D1')[10] === 0, 'ADMIN mở khóa tài khoản, bộ đếm về 0');

// ===== 5. Vào ca =====
let me = api(tA, 'me').data;
ok(me.duocVaoCa === true && me.vaoCa.length === 1 && me.vaoCa[0].ca === 'Chiều' && me.vaoCa[0].daVao === false && me.vaoCa[0].soDaVao === 0 && me.vaoCa[0].bd === '13:00' && me.vaoCa[0].kt === '17:00', 'me_: vaoCa cho ca đang mở', me.vaoCa);
ok(api(tAdmin, 'me').data.duocVaoCa === false && api(tLD, 'me').data.duocVaoCa === false, 'ADMIN và LANHDAO không được vào ca (duocVaoCa=false)');
r = api(tA, 'vaoCa', { ca: 'Chiều' });
ok(r.ok && r.data.moi === true && r.data.soDaVao === 1, 'A1 vào ca Chiều', r);
r = api(tA, 'vaoCa', { ca: 'Chiều' });
ok(r.ok && r.data.moi === false && sh('PhanCa').rows.filter(x => x[2] === 'A1').length === 1, 'vào ca lần 2 không ghi trùng');
r = api(tA, 'vaoCa', { ca: 'Sáng' });
ok(!r.ok && /không mở/.test(r.err), 'chỉ vào được ca đang mở', r);
ok(api(tB, 'vaoCa', { ca: 'Chiều' }).ok && api(tTT, 'vaoCa', { ca: 'Chiều' }).ok, 'B1 và Tổ trưởng vào ca');
ok(!api(tAdmin, 'vaoCa', { ca: 'Chiều' }).ok, 'ADMIN không vào ca được');
r = api(tLD, 'vaoCa', { ca: 'Chiều' });
ok(!r.ok && /chỉ được xem/.test(r.err), 'LANHDAO không vào ca được', r);
me = api(tA, 'me').data;
ok(me.vaoCa[0].daVao === true && me.vaoCa[0].soDaVao === 3, 'me_: sau khi vào ca daVao=true, soDaVao=3', me.vaoCa);
ok(api(tTT, 'dsCa', { ngay: '2026-11-09', ca: 'Chiều' }).data.soDaVao === 3, 'dsCa_ có soDaVao');
ok(sh('LogHeThong').rows.filter(x => x[4] === 'VAO_CA').length === 3, 'vào ca có ghi nhật ký');
setNow('2026-11-09 19:30:00');
ok(!api(tA, 'vaoCa', { ca: 'Chiều' }).ok, 'ca đã hết giờ: không vào được');
setNow('2026-11-09 15:30:00');

// ===== 6. Phân nhóm, quản lý tự báo như tổ viên =====
ok(api(tTT, 'luuNhom', { ngay: '2026-11-09', ca: 'Chiều', gan: [{ ma: 'A1', nhom: '1' }, { ma: 'B1', nhom: '1' }, { ma: 'TT1', nhom: '2' }] }).ok, 'Tổ trưởng phân nhóm (A1+B1 nhóm 1, tổ trưởng nhóm 2)');
const rep = (t, o) => api(t, 'ghi', Object.assign({ ca: 'Chiều' }, o));
ok(rep(tTT, { buoc: 'NHAN', hop: 'H1' }).ok, 'quản lý nhận từ TT Lưu trữ (giữ NHAN)');
let d = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data;
ok(d.cas[1].tongNhom === 2 && d.cas[1].nhomDaBC === 0, 'dash: tongNhom=2, nhomDaBC=0 khi chưa ai báo cáo', d.cas[1]);
rep(tTT, { buoc: 'NHAN', hop: 'M1' });
ok(rep(tTT, { buoc: 'SCAN', hop: 'M1', soHoSo: 4, soTrang: 40, hetHop: true }).ok, 'Tổ trưởng đã vào ca tự báo Scan như tổ viên');
ok(rep(tTT, { buoc: 'TACH', hop: 'M1', soHoSo: 4, soTrang: 38 }).ok && rep(tTT, { buoc: 'OCR', hop: 'M1', soHoSo: 4, soTo: 30 }).ok, 'Tổ trưởng tự báo Tách và OCR');
r = rep(tAdmin, { buoc: 'SCAN', hop: 'M1', soHoSo: 1, soTrang: 1 });
ok(!r.ok && /không thuộc danh sách/.test(r.err), 'ADMIN không báo khâu của tổ viên trực tiếp (chưa vào ca)', r);
ok(!api(tA, 'ghi', { buoc: 'NHAN', ca: 'Chiều', hop: 'H8' }).ok, 'tổ viên vẫn không nhận từ TT Lưu trữ');
d = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data;
ok(d.cas[1].nhomDaBC === 1 && d.cas[1].tongNhom === 2, 'dash: 1/2 nhóm đã báo cáo (chỉ hiển thị)', d.cas[1]);

// ===== 7. Số liệu, lịch sử cá nhân =====
ok(rep(tA, { buoc: 'NHAN_NHOM', hop: 'H1' }).ok, 'tổ viên nhận hộp từ quản lý');
ok(rep(tA, { buoc: 'SCAN', hop: 'H1', soHoSo: 8, soTrang: 100, soTo: 0 }).ok, 'A1 scan 100 trang');
ok(rep(tA, { buoc: 'SCAN', hop: 'H2', soHoSo: 5, soTrang: 100, soTo: 90, hetHop: true }).ok, 'A1 scan H2 (100 trang / 90 tờ, xong hộp)');
d = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data;
const g = d.nhom.find(x => x.nhom === '1');
ok(d.day.scanDV === 230 && g.scanDV === 190, 'KPI ngày 230 (gồm nhóm 2: 40) và nhóm 1 = 190 theo dv', { kpi: d.day.scanDV, nhom: g && g.scanDV });
ok(Math.abs(g.scanDVGio - 190 / 8) < 0.11, 'năng suất nhóm theo dv/người-giờ', g.scanDVGio);
ok(d.canhan.find(x => x.ma === 'A1').scanDV === 95, 'cá nhân chia 50/50 theo dv');
const dAdm = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data, rTV = api(tA, 'dashboard', { ngay: '2026-11-09' });
ok(!rTV.ok && /Lãnh đạo và Quản lý/.test(rTV.err), 'TOVIEN bị chặn xem Dashboard', rTV);
ok(api(tTT, 'dashboard', { ngay: '2026-11-09' }).data.nhom.length > 0 && api(tLD, 'dashboard', { ngay: '2026-11-09' }).data.canhan.length > 0 && dAdm.nhom.length > 0, 'Tổ trưởng, Lãnh đạo, ADMIN vẫn xem nhóm và cá nhân');
let ls = api(tA, 'lichSu', { tu: '2026-11-09', den: '2026-11-09' });
ok(ls.ok && ls.data.length === 2 && ls.data.every(x => ['ngay', 'ca', 'buoc', 'hop', 'dv', 'phanCuaToi', 'het'].every(k => k in x)), 'lichSu: đủ trường, chỉ bản ghi của A1', ls.data);
ok(ls.data.find(x => x.hop === 'H2').dv === 90 && ls.data.find(x => x.hop === 'H2').phanCuaToi === 45 && ls.data.find(x => x.hop === 'H2').het === true, 'lichSu: phanCuaToi = dv / số thành viên nhóm (90/2=45)', ls.data);
ls = api(tTT, 'lichSu', {}).data;
ok(ls.length === 3 && ls.every(x => x.phanCuaToi === x.dv), 'lichSu: Tổ trưởng (nhóm 1 người) nhận trọn phần của mình; mặc định lấy hôm nay', ls);
ok(api(tLD, 'lichSu', {}).ok && api(tLD, 'lichSu', {}).data.length === 0, 'LANHDAO xem lichSu (rỗng) được');
ok(!api(tA, 'lichSu', { tu: '2026-11-10', den: '2026-11-01' }).ok, 'lichSu: khoảng ngày sai bị từ chối');
ctx.append_('NhatKy', { ID: 'T1', ThoiGian: NOW, Ngay: '2026-11-09', Ca: 'Chiều', Nhom: '1', Buoc: 'SCAN', MaHop: 'TEST-1', SoHoSo: 6, SoTrang: 1000, SoTo: 0, HetHop: true, NguoiNhap: 'ADMIN', Loai: 'THỬ NGHIỆM', Huy: false, ThanhVien: 'A1,B1' });
ok(api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data.day.scanDV === 230, 'dữ liệu THỬ NGHIỆM không tính vào dashboard thật');
ok(api(tAdmin, 'dashboard', { ngay: '2026-11-09', gomThu: true }).data.day.scanDV === 1230, 'ADMIN bật gomThu thì thấy');
ok(api(tTT, 'dashboard', { ngay: '2026-11-09', gomThu: true }).data.day.scanDV === 230, 'người không phải ADMIN không bật được gomThu');
ok(api(tA, 'lichSu', {}).data.length === 2, 'lichSu không gồm dữ liệu THỬ NGHIỆM');

// ===== 8. Ghi nhiều hộp, mã hộp, số âm, trả hộp =====
const rowsBefore = sh('NhatKy').rows.length, apBefore = appendRowCalls.NhatKy || 0;
r = rep(tTT, { buoc: 'NHAN', hop: 'H10\nH11 H10\tH12' });
ok(r.ok && r.data.added === 3 && sh('NhatKy').rows.length === rowsBefore + 3 && (appendRowCalls.NhatKy || 0) === apBefore, 'nhận 3 hộp bằng 1 lần ghi hàng loạt (appendMany_), loại mã trùng', { added: r.data && r.data.added });
ok(r.data.warnings.some(w => /bỏ 1 mã trùng/.test(w)), 'có cảnh báo đã bỏ mã trùng', r.data.warnings);
r = rep(tTT, { buoc: 'NHAN', hop: 'H20,H21' });
ok(!r.ok && /Mã hộp không hợp lệ/.test(r.err), 'dấu phẩy không còn là dấu phân tách: bị từ chối', r);
for (const bad of ['H;1', '=cmd', 'a b!', 'x'.repeat(31)]) ok(!rep(tTT, { buoc: 'NHAN', hop: bad }).ok, 'mã hộp sai định dạng bị từ chối: ' + bad.slice(0, 12));
ok(rep(tTT, { buoc: 'NHAN', hop: '208.18.17' }).ok, 'mã hộp dạng 208.18.17 hợp lệ');
r = rep(tA, { buoc: 'SCAN', hop: 'H1', soHoSo: 3, soTrang: -5, soTo: 10 });
ok(!r.ok && /không được âm/.test(r.err), 'chặn số âm', r);
rep(tTT, { buoc: 'NHAN', hop: 'P1 P2' });
rep(tTT, { buoc: 'SCAN', hop: 'P1', soHoSo: 2, soTrang: 20, hetHop: true }); rep(tTT, { buoc: 'TACH', hop: 'P1', soHoSo: 2, soTrang: 20, hetHop: true });
rep(tTT, { buoc: 'SCAN', hop: 'P2', soHoSo: 2, soTrang: 20, hetHop: true });      // P2: Scan xong nhưng chưa Tách xong
r = rep(tTT, { buoc: 'TRA', hop: 'P1 P2 H11 Q9' });
const traRows = sh('NhatKy').rows.filter(x => x[5] === 'TRA' && !x[16]).map(x => x[6]);
ok(r.ok && r.data.added === 2 && traRows.includes('P1') && traRows.includes('Q9') && !traRows.includes('P2') && !traRows.includes('H11'), 'trả hộp: hộp có NHAN mà chưa Tách xong bị bỏ qua, các hộp khác vẫn ghi', { added: r.data && r.data.added, traRows });
ok(r.data.warnings.filter(w => /chưa Tách file xong/.test(w)).length === 2, 'có cảnh báo "chưa Tách file xong" cho từng hộp bị bỏ qua', r.data.warnings);
ok(r.data.warnings.some(w => /Q9 chưa có trong danh sách nhận/.test(w)) && traRows.includes('Q9'), 'hộp không có NHAN: chỉ cảnh báo, vẫn ghi');
ok(rep(tTT, { buoc: 'TRA', hop: 'H2' }).ok && !rep(tTT, { buoc: 'TRA', hop: 'H2' }).data.warnings.some(w => /CHƯA Scan/.test(w)), 'hộp không có NHAN nhưng đã Scan xong: không cảnh báo Scan');

// ===== 9. Hộp xong, hủy, khôi phục, nhập hộ =====
r = rep(tA, { buoc: 'SCAN', hop: 'H2', soHoSo: 1, soTrang: 10 });
ok(!r.ok && /XONG/.test(r.err), 'hộp đã xong: báo cáo một phần bị từ chối', r);
const idH2 = sh('NhatKy').rows.find(x => x[6] === 'H2' && x[5] === 'SCAN')[0];
ok(api(tAdmin, 'huy', { id: idH2 }).ok, 'ADMIN xóa bản ghi H2');
r = api(tAdmin, 'huy', { id: idH2 });
ok(!r.ok && /đã được xóa/.test(r.err), 'không xóa lại bản ghi đã xóa', r);
{
  ok(rep(tA, { buoc: 'SCAN', hop: 'HUY1', soHoSo: 1, soTrang: 5 }).ok, 'tổ viên báo cáo HUY1');
  const idHuy = sh('NhatKy').rows.filter(x => x[6] === 'HUY1').slice(-1)[0][0];
  const rTV = api(tA, 'huy', { id: idHuy });
  ok(!rTV.ok && /Tổ viên không được hủy/.test(rTV.err), 'tổ viên KHÔNG tự hủy được báo cáo của mình', rTV);
  ok(api(tTT, 'huy', { id: idHuy }).ok, 'Tổ trưởng hủy được báo cáo của tổ viên để báo cáo lại');
}
ok(rep(tA, { buoc: 'SCAN', hop: 'H2', soHoSo: 5, soTrang: 100, soTo: 90, hetHop: true }).ok, 'báo cáo lại H2');
r = api(tAdmin, 'khoiPhuc', { id: idH2 });
ok(!r.ok && /cộng trùng/.test(r.err), 'khôi phục bị chặn vì đã có bản ghi mới', r);
const nh = (o) => api(tTT, 'ghi', Object.assign({ buoc: 'SCAN', boSung: true, ngay: '2026-11-09', ca: 'Chiều', nhom: '1', nguoiHo: 'A1', hop: 'H9', soHoSo: 3, soTrang: 30 }, o));
ok(/tương lai/.test(nh({ ngay: '2026-11-20' }).err), 'nhập hộ ngày tương lai bị từ chối');
ok(/chưa có trong ca/.test(nh({ nhom: '7' }).err), 'nhập hộ vào nhóm không tồn tại bị từ chối');
ok(/không thuộc nhóm/.test(nh({ nguoiHo: 'C1' }).err), 'nhập hộ cho người không thuộc nhóm bị từ chối');
ok(nh({}).ok, 'nhập hộ hợp lệ');
const nhRow = sh('NhatKy').rows.find(x => x[6] === 'H9');
const idH9 = nhRow[0];
ok(nhRow[15] === 'NHẬP HỘ', 'bản ghi nhập hộ có Loai = NHẬP HỘ', nhRow[15]);
ok(api(tAdmin, 'suaBanGhi', { id: idH9, soHoSo: 4, soTrang: 44 }).ok && sh('NhatKy').rows.find(x => x[0] === idH9)[15] === 'NHẬP HỘ', 'sửa bản ghi giữ nguyên Loai cũ');

// ===== 10. Vai trò LANHDAO chỉ xem =====
for (const [a, p] of [['ghi', { buoc: 'NHAN', ca: 'Chiều', hop: 'Z1' }], ['huy', { id: idH9 }], ['vaoCa', { ca: 'Chiều' }], ['luuNhom', {}], ['chot', {}], ['resetPin', { ma: 'A1' }]]) {
  r = api(tLD, a, p); ok(!r.ok && /chỉ được xem/.test(r.err), 'LANHDAO không gọi được: ' + a, r);
}
ok(api(tLD, 'dashboard', {}).ok && api(tLD, 'me').ok, 'LANHDAO vẫn xem dashboard và me');

// ===== 11. Chốt, mở khóa, sửa ca, ngày tương lai =====
r = api(tTT, 'chot', { ngay: '2026-11-12', ca: 'Chiều' });
ok(!r.ok && /tương lai/.test(r.err), 'không chốt ca của ngày tương lai', r);
r = api(tTT, 'suaCa', { ngay: '2026-11-09', ca: 'Chiều', ma: 'A1', them: true });
ok(r.ok && r.data === 'Người này đã có trong ca' && sh('PhanCa').rows.filter(x => x[2] === 'A1').length === 1, 'suaCa không thêm trùng', r);
ok(!api(tTT, 'suaCa', { ngay: '2026-11-09', ca: 'Chiều', ma: 'LD1', them: true }).ok && !api(tTT, 'suaCa', { ngay: '2026-11-09', ca: 'Chiều', ma: 'ADMIN', them: true }).ok, 'không thêm LANHDAO/ADMIN vào ca');
ok(api(tTT, 'suaCa', { ngay: '2026-11-09', ca: 'Chiều', ma: 'C1', them: true }).ok && sh('PhanCa').rows.some(x => x[2] === 'C1'), 'suaCa thêm người mới được');
api(tTT, 'luuNhom', { ngay: '2026-11-09', ca: 'Chiều', gan: [{ ma: 'A1', nhom: '1' }, { ma: 'B1', nhom: '1' }, { ma: 'TT1', nhom: '2' }, { ma: 'C1', nhom: '5' }] });
ok(sh('PhanNhom').rows.some(x => x[3] === 'C1' && x[2] === '5'), '(chuẩn bị) C1 đang ở nhóm 5');
const lgN = sh('LogHeThong').rows.length;
ok(api(tTT, 'suaCa', { ngay: '2026-11-09', ca: 'Chiều', ma: 'C1', them: false }).ok, 'bỏ C1 khỏi ca');
ok(!sh('PhanCa').rows.some(x => x[2] === 'C1' && x[0] === '2026-11-09') && !sh('PhanNhom').rows.some(x => x[3] === 'C1' && x[0] === '2026-11-09' && x[1] === 'Chiều'), 'bỏ khỏi ca thì xóa luôn dòng của họ trong PhanNhom ngày/ca đó');
ok(sh('PhanNhom').rows.filter(x => x[0] === '2026-11-09' && x[1] === 'Chiều').length === 3, 'những người khác trong nhóm không bị ảnh hưởng');
const lgB = sh('LogHeThong').rows.slice(lgN).map(x => x[4] + ':' + x[6]);
ok(lgB.some(x => /^BO_KHOI_NHOM:.*C1.*cũ: nhóm 5/.test(x)) && lgB.some(x => /^BO_KHOI_CA:/.test(x)), 'có log BO_KHOI_NHOM (cũ → mới) và BO_KHOI_CA', lgB);
api(tTT, 'suaCa', { ngay: '2026-11-09', ca: 'Chiều', ma: 'C1', them: true });
const lgM = sh('LogHeThong').rows.length;
api(tTT, 'suaCa', { ngay: '2026-11-09', ca: 'Chiều', ma: 'C1', them: false });
ok(!sh('LogHeThong').rows.slice(lgM).some(x => x[4] === 'BO_KHOI_NHOM'), 'bỏ người không thuộc nhóm nào: không sinh log nhóm thừa');
api(tTT, 'chot', { ngay: '2026-11-09', ca: 'Chiều' });
setNow('2026-11-09 18:30:00');
ok(!api(tA, 'ghi', { buoc: 'SCAN', ca: 'Chiều', hop: 'H5', soHoSo: 1, soTrang: 5 }).ok, 'ca đã chốt: tổ viên không ghi được');
setNow('2026-11-09 18:20:00');
api(tTT, 'chot', { ngay: '2026-11-09', ca: 'Chiều', mo: true });
ok(ctx.caState_('2026-11-09', 'Chiều', ctx.now_()).canInput === true, 'mở khóa ca: nhập được trong hạn');
setNow('2026-11-09 19:30:00');
ok(ctx.caState_('2026-11-09', 'Chiều', ctx.now_()).canInput === false, 'mở khóa ca hết hiệu lực sau 60 phút');
setNow('2026-11-09 15:30:00');

// ===== 12. Chống công thức, Date, chốt thành viên nhóm =====
ctx.append_('NhatKy', { ID: 'F1', ThoiGian: NOW, Ngay: '2026-11-09', Ca: 'Chiều', Buoc: 'NHAN', MaHop: 'H0', GhiChu: '=NhanSu!I2', NguoiNhap: 'TT1', Loai: 'THƯỜNG', Huy: false });
ok(/^ =/.test(sh('NhatKy').rows.find(x => x[0] === 'F1')[13]) && ctx.s_(sh('NhatKy').rows.find(x => x[0] === 'F1')[13]) === '=NhanSu!I2', 'ghi chú "=" bị vô hiệu hóa và đọc lại đúng');
sh('NhatKy').rows.find(x => x[0] === 'F1')[1] = new Date('2026-11-09T08:30:00Z');
ok(api(tAdmin, 'nhatKy', { ngay: '2026-11-09' }).data.some(x => x.id === 'F1' && x.gio === '15:30'), 'ThoiGian dạng Date vẫn ra đúng giờ VN');
sh('LogHeThong').rows.push([new Date('2026-11-09T08:31:00Z'), 'TT1', 'TT', 'TOTRUONG', 'TEST_DATE', 'x', 'y']);
ctx.memoClear_();
ok(api(tAdmin, 'nhatKyHT', { tu: '2026-11-09', den: '2026-11-09', hanhDong: 'TEST_DATE' }).data.length === 1, 'lọc nhật ký hệ thống theo ngày chạy đúng khi ThoiGian là Date');
const tvRow = sh('NhatKy').rows.filter(x => x[5] === 'SCAN' && x[6] === 'H1')[0];
ok(tvRow[18] === 'A1,B1', 'bản ghi lưu thành viên nhóm lúc báo cáo', tvRow[18]);
sh('PhanNhom').rows = [TABS.PhanNhom.slice(), ['2026-11-09', 'Chiều', '1', 'B1', 'Nhân viên B', 'TT1', ''], ['2026-11-09', 'Chiều', '2', 'A1', 'Nhân viên A', 'TT1', '']];
ctx.memoClear_();
ok(api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data.canhan.find(x => x.ma === 'A1').scanDV > 0, 'đổi nhóm sau báo cáo không làm mất số của cá nhân');
ok(api(tA, 'lichSu', {}).data.length >= 2, 'lichSu vẫn đúng sau khi đổi nhóm (theo ThanhVien đã chốt)');

// ===== 13. Tiến độ: ngày/ca theo DauKy + vào ca =====
let T = api(tAdmin, 'dashboard', {}).data.tienDo;
ok(T.soNgay === 7 && T.soCa === 18 && T.tuNgay === '2026-11-02', 'tiến độ lúc 15:30: 7 ngày / 18 ca của giai đoạn DauKy (ca Chiều hôm nay chưa kết thúc)', T);
setNow('2026-11-09 18:30:00');
T = api(tAdmin, 'dashboard', {}).data.tienDo;
ok(T.soNgay === 8 && T.soCa === 19, 'sau khi ca Chiều (có người vào) kết thúc: +1 ngày, +1 ca', T);
ok(T.buoc[0].tbNgay > 0 && T.buoc[0].ngayConLai > 0, 'TB/ngày > 0 dù PhanCa không còn lịch TCHC', T.buoc[0]);
setNow('2026-11-09 15:30:00');

// ===== 14. Khóa, đọc nhớ, setup, sao lưu, nhật ký cũ → mới, xóa mẫu =====
const l0 = lockCount;
api(tAdmin, 'me'); api(tAdmin, 'dashboard', {}); api(tA, 'lichSu', {});
ok(lockCount === l0, 'thao tác chỉ đọc (kể cả lichSu) không giữ khóa');
api(tTT, 'resetPin', { ma: 'C1' }); ctx.login('A1', '000000'); api(tA, 'vaoCa', { ca: 'Chiều' });
ok(lockCount >= l0 + 3, 'thao tác ghi, đăng nhập và vào ca đều giữ khóa', lockCount - l0);
ctx.memoClear_(); getValuesCalls = 0; ctx.read_('NhanSu'); ctx.read_('NhanSu'); ctx.read_('NhanSu');
ok(getValuesCalls === 1, 'đọc lặp cùng tab chỉ đọc Sheet 1 lần');
ctx.__active = ''; let threw = false; try { ctx.setup(); } catch (e) { threw = true; }
ok(threw, 'setup() bị chặn khi gọi ẩn danh');
ctx.__active = 'owner@x.com'; fmtLog.length = 0; threw = false; try { ctx.setup(); } catch (e) { threw = true; }
ctx.__active = '';
ok(!threw && sh('NhatKy').maxRows >= 20000 && sh('LogHeThong').maxRows >= 20000, 'setup: NhatKy và LogHeThong đủ 20.000 dòng', [sh('NhatKy').maxRows, sh('LogHeThong').maxRows]);
ok(['PhanCa', 'PhanNhom', 'ChotCa'].every(n => sh(n).maxRows >= 5000), 'setup: PhanCa, PhanNhom, ChotCa có ít nhất 5.000 dòng', ['PhanCa', 'PhanNhom', 'ChotCa'].map(n => sh(n).maxRows));
ok(['PhanCa', 'PhanNhom', 'ChotCa'].every(n => fmtLog.some(x => x[0] === n) && fmtLog.filter(x => x[0] === n).every(x => x[1] >= 5000)), 'setup: định dạng @ của PhanCa/PhanNhom/ChotCa chỉ chạy sau khi đủ 5.000 dòng');
ok(fmtLog.filter(x => x[0] === 'NhatKy' || x[0] === 'LogHeThong').every(x => x[1] >= 20000) && fmtLog.some(x => x[0] === 'NhatKy'), 'setup: định dạng cột chỉ chạy SAU khi đã đủ 20.000 dòng', fmtLog.filter(x => x[0] === 'NhatKy').slice(0, 2));
// tạo mẫu rồi xóa
sh('PhanCa').rows.push(['2026-11-08', 'Chiều', 'A1', 'Nhân viên A', '', ''], ['2026-11-08', 'Chiều', 'B1', 'Nhân viên B', '', '']);
ctx.memoClear_();
{
  sh('PhanCa').rows.push(['2026-11-07', 'Chiều', 'A1', 'Nhân viên A', '', '']);
  sh('PhanNhom').rows.push(['2026-11-07', 'Chiều', '1', 'A1', 'Nhân viên A', 'TT1', '']);
  ctx.memoClear_();
  const rm = api(tAdmin, 'taoMau', { ngay: '2026-11-07', cas: ['Sáng', 'Chiều'], soNguoi: 6 });
  const nhomCa = ca => { const m = {}; sh('PhanNhom').rows.filter(x => x[0] === '2026-11-07' && x[1] === ca).forEach(x => (m[x[2]] = m[x[2]] || []).push(x[3])); return m; };
  const ch = nhomCa('Chiều'), sa = nhomCa('Sáng');
  ok(rm.ok && Object.keys(ch).length === 3 && Object.values(ch).every(g => g.length === 2) && ch['1'].includes('A1'), 'taoMau: ca Chiều đủ 6 người / 3 nhóm, giữ người thật ở Nhóm 1', ch);
  ok(Object.keys(sa).length === 3 && Object.values(sa).every(g => g.length === 2), 'taoMau: ca Sáng 6 người / 3 nhóm', sa);
}
r = api(tAdmin, 'taoMau', { ngay: '2026-11-08' });
ok(r.ok && sh('PhanNhom').rows.some(x => x[5] === 'MAU'), 'taoMau sinh nhóm đánh dấu MAU', r);
r = api(tAdmin, 'resetDuLieu', { phamVi: 'THU' });
ok(r.ok && r.data.saoLuu[0] === 'SaoLuuXoa' && !sh('PhanNhom').rows.some(x => x[5] === 'MAU') && sh('SaoLuuXoa').rows.length > 1, 'xóa THU xóa luôn nhóm mẫu và lưu dòng bị xóa vào SaoLuuXoa', r);
ok(!['PhanCa', 'PhanNhom', 'NhanSu'].some(n => sh(n).rows.some(x => /^TN-/.test(x[n === 'NhanSu' ? 0 : n === 'PhanCa' ? 2 : 3]))), 'xóa THU dọn sạch người giả TN-xx (phân ca, nhóm, nhân sự)');
ok(sh('PhanNhom').rows.some(x => x[3] === 'B1' && x[1] === 'Chiều'), 'xóa THU không đụng nhóm thật');
r = api(tAdmin, 'resetDuLieu', { phamVi: 'NGAY', ngay: '2026-11-08' });
ok(!r.ok && /XOA/.test(r.err), 'phạm vi NGAY cần gõ XOA ở server', r);
ok(api(tAdmin, 'resetDuLieu', { phamVi: 'NGAY', ngay: '2026-11-08', xacNhan: 'XOA' }).ok, 'phạm vi NGAY với XOA thì chạy');
sh('PhanCa').rows.push(['2026-11-06', 'Chiều', 'A1', 'Nhân viên A', '', '']); ctx.memoClear_();
api(tAdmin, 'resetDuLieu', { phamVi: 'NGAY', ngay: '2026-11-06', xacNhan: 'XOA' });
ok(sh('PhanCa').rows.some(x => x[0] === '2026-11-06'), 'xóa NGAY mặc định giữ danh sách vào ca');
api(tAdmin, 'resetDuLieu', { phamVi: 'NGAY', ngay: '2026-11-06', xacNhan: 'XOA', caPhanCa: true });
ok(!sh('PhanCa').rows.some(x => x[0] === '2026-11-06'), 'xóa NGAY + caPhanCa xóa luôn danh sách vào ca');
ok(!api(tAdmin, 'resetDuLieu', { phamVi: 'TATCA', xacNhan: 'xoa' }).ok, 'TATCA cần đúng chữ XOA');
r = api(tAdmin, 'luuNhanSu', { ma: 'B1', ten: 'Nhân viên B2', chucVu: 'Tổ viên', donVi: 'DV', email: '', vaiTro: 'TOVIEN', hoatDong: true });
const lg2 = sh('LogHeThong').rows.filter(x => x[4] === 'SUA_NHAN_SU').slice(-1)[0];
ok(r.ok && /cũ: .*Nhân viên B.*mới: .*Nhân viên B2/.test(lg2[6]), 'nhật ký sửa nhân sự có cũ → mới');
api(tTT, 'luuNhom', { ngay: '2026-11-09', ca: 'Chiều', gan: [{ ma: 'A1', nhom: '3' }] });
ok(/cũ: .*mới: .*N3/.test(sh('LogHeThong').rows.filter(x => x[4] === 'PHAN_NHOM').slice(-1)[0][6]), 'nhật ký phân nhóm có cũ → mới');
ok(sh('LogHeThong').rows.slice(1).filter(x => x[4] && x[4] !== 'TEST_DATE').every(x => x[1] !== '' && String(x[5]).includes('·')), 'mọi dòng nhật ký có người và ngữ cảnh ca');

// ===== Phân nhóm chiDoi: 2 quản lý cùng xếp, không ghi đè nhau =====
{
  const nhomCua = ma => { ctx.memoClear_(); return (sh('PhanNhom').rows.find(x => x[0] === '2026-11-09' && x[1] === 'Chiều' && x[3] === ma) || [])[2] || ''; };
  const r1 = api(tTT, 'luuNhom', { ngay: '2026-11-09', ca: 'Chiều', chiDoi: true, gan: [{ ma: 'A1', nhom: '4' }] });
  const r2 = api(tAdmin, 'luuNhom', { ngay: '2026-11-09', ca: 'Chiều', chiDoi: true, gan: [{ ma: 'B1', nhom: '5' }, { ma: 'KHONG_TRONG_CA', nhom: '1' }] });
  ok(r1.ok && r2.ok && nhomCua('A1') === '4' && nhomCua('B1') === '5', 'chiDoi: quản lý sau không xóa nhóm quản lý trước vừa xếp', [r1, r2]);
  ok(r2.data.nhom.A1 === '4' && r2.data.nhom.B1 === '5' && !('KHONG_TRONG_CA' in r2.data.nhom), 'chiDoi: trả về nhóm hiện tại của cả ca, bỏ qua người không trong ca', r2.data);
  ok(api(tTT, 'luuNhom', { ngay: '2026-11-09', ca: 'Chiều', chiDoi: true, gan: [{ ma: 'A1', nhom: '' }] }).ok && nhomCua('A1') === '' && nhomCua('B1') === '5', 'chiDoi: bỏ nhóm một người không ảnh hưởng người khác');
}

// ===== Nhận hộp: chọn Cá nhân / Nhóm =====
{
  const dong = h => sh('NhatKy').rows.filter(x => x[6] === h && x[5] === 'NHAN_NHOM').slice(-1)[0];
  let rk = api(tA, 'ghi', { buoc: 'NHAN_NHOM', ca: 'Chiều', hop: 'KN1', kieuNhan: 'NHOM' });
  ok(!rk.ok && /chưa được phân nhóm/.test(rk.err), 'nhận hộp theo NHÓM khi chưa phân nhóm: báo yêu cầu quản lý phân nhóm', rk);
  rk = api(tA, 'ghi', { buoc: 'NHAN_NHOM', ca: 'Chiều', hop: 'KN1', kieuNhan: 'CANHAN' });
  ok(rk.ok && dong('KN1')[4] === '' && dong('KN1')[18] === 'A1', 'nhận hộp CÁ NHÂN khi chưa có nhóm: ghi cho riêng người đó', rk);
  rk = api(tB, 'ghi', { buoc: 'NHAN_NHOM', ca: 'Chiều', hop: 'KN2', kieuNhan: 'CANHAN' });
  ok(!rk.ok && /đã thuộc Nhóm 5/.test(rk.err) && !dong('KN2'), 'A1/QĐ1: đã có nhóm mà chọn CÁ NHÂN bị từ chối, không ghi gì', rk);
  rk = api(tB, 'ghi', { buoc: 'NHAN_NHOM', ca: 'Chiều', hop: 'KN3', kieuNhan: 'NHOM' });
  ok(rk.ok && dong('KN3')[4] === '5', 'đã có nhóm và chọn NHÓM: ghi cho nhóm', rk);
  rk = api(tB, 'ghi', { buoc: 'NHAN_NHOM', ca: 'Chiều', hop: 'KN4' });
  ok(rk.ok && dong('KN4')[4] === '5', 'A1: đã có nhóm, không gửi kieuNhan: mặc định ghi theo nhóm', rk);
  // A1 – QĐ1: nhập hộ phải theo nhóm của người được nhập hộ
  const hoQ = (o) => api(tTT, 'ghi', Object.assign({ buoc: 'NHAN_NHOM', boSung: true, ngay: '2026-11-09', ca: 'Chiều', hop: 'KH1' }, o));
  rk = hoQ({ nguoiHo: 'B1', nhom: '' });
  ok(!rk.ok && /đã thuộc Nhóm 5/.test(rk.err), 'A1: nhập hộ cho người ĐÃ có nhóm mà để trống nhóm bị từ chối', rk);
  rk = hoQ({ nguoiHo: 'B1', nhom: '4' });
  ok(!rk.ok, 'A1: nhập hộ cho người đã có nhóm nhưng chọn nhóm khác bị từ chối', rk);
  rk = hoQ({ nguoiHo: 'B1', nhom: '5' });
  ok(rk.ok && dong('KH1')[4] === '5', 'A1: nhập hộ đúng nhóm của người đó được ghi', rk);
  rk = hoQ({ nguoiHo: 'A1', nhom: '', hop: 'KH2' });
  ok(rk.ok && dong('KH2')[4] === '' && dong('KH2')[18] === 'A1', 'A1: nhập hộ cho người CHƯA có nhóm vẫn ghi cá nhân', rk);
  rk = api(tTT, 'ghi', { buoc: 'SCAN', boSung: true, ngay: '2026-11-09', ca: 'Chiều', nguoiHo: 'B1', nhom: '', hop: 'KH3', soHoSo: 1, soTrang: 5 });
  ok(!rk.ok && /đã thuộc Nhóm 5/.test(rk.err), 'A1: nhập hộ Scan cho người đã có nhóm mà để trống nhóm cũng bị từ chối', rk);
  rk = api(tTT, 'ghiLo', { idLo: 'LO-A1-TEST-01', boSung: true, ngay: '2026-11-09', ca: 'Chiều', nguoiHo: 'B1', nhom: '', muc: [{ hop: 'KH4', buoc: 'SCAN', soHoSo: 1, soTrang: 5 }] });
  ok(rk.ok && rk.data.loi === 1 && /đã thuộc Nhóm 5/.test(rk.data.ketQua[0].err), 'A1: ghiLo kế thừa quy tắc: dòng nhập hộ sai nhóm bị báo lỗi', rk.data);
  rk = api(tB, 'ghiLo', { idLo: 'LO-A1-TEST-02', ca: 'Chiều', muc: [{ hop: 'KH5', buoc: 'SCAN', soHoSo: 1, soTrang: 5 }] });
  ok(rk.ok && rk.data.loi === 0 && sh('NhatKy').rows.filter(x => x[6] === 'KH5').every(x => x[4] === '5'), 'A1: tổ viên có nhóm gửi lô: ghi theo nhóm', rk);
}

// ===== Dashboard TỪNG CA: người trong ca, nhóm, sản lượng =====
{
  ctx.memoClear_();
  const dd = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data, cn = dd.caNguoi.filter(x => x.ca === 'Chiều');
  const b1 = cn.find(x => x.ma === 'B1'), a1 = cn.find(x => x.ma === 'A1');
  ok(cn.length >= 3 && cn.every(x => x.coMat || x.soBC > 0), 'caNguoi: liệt kê người trong ca Chiều (có mặt hoặc có báo cáo)', cn.map(x => x.ma));
  ok(b1 && b1.nhom === '5' && a1 && a1.nhom === '', 'caNguoi: ghi đúng nhóm hiện tại của từng người', [b1 && b1.nhom, a1 && a1.nhom]);
  ok(a1 && a1.nhanHop >= 1 && b1 && b1.nhanHop >= 2, 'caNguoi: đếm hộp nhận cá nhân / nhóm cho từng người', [a1 && a1.nhanHop, b1 && b1.nhanHop]);
}

// ===== Dashboard: người thử nghiệm TN-xx không tính vào nhân sự ca (trừ khi ADMIN gomThu) =====
{
  ctx.memoClear_();
  const truoc = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data, nPhanTruoc = truoc.cas.find(c => c.ca === 'Chiều').nguoiPhan;
  const gopTruoc = api(tAdmin, 'dashboard', { ngay: '2026-11-09', gomThu: true }).data, nGopTruoc = gopTruoc.cas.find(c => c.ca === 'Chiều').nguoiPhan;
  sh('PhanCa').rows.push(['2026-11-09', 'Chiều', 'TN-91', 'Người thử 91', '', '']);
  sh('PhanNhom').rows.push(['2026-11-09', 'Chiều', '9', 'TN-91', 'Người thử 91', '', '']);
  ctx.memoClear_();
  const mac = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data, gop = api(tAdmin, 'dashboard', { ngay: '2026-11-09', gomThu: true }).data;
  ok(mac.cas.find(c => c.ca === 'Chiều').nguoiPhan === nPhanTruoc && !mac.caNguoi.some(x => x.ma === 'TN-91'), 'dash: mặc định không đếm TN-xx (nguoiPhan, caNguoi)');
  ok(gop.cas.find(c => c.ca === 'Chiều').nguoiPhan === nGopTruoc + 1 && gop.caNguoi.some(x => x.ma === 'TN-91'), 'dash: gomThu (ADMIN) thì đếm TN-xx');
  ok(mac.day.scanDV === truoc.day.scanDV && mac.day.tachDV === truoc.day.tachDV && mac.luyKe.scanHop === truoc.luyKe.scanHop && mac.day.nhanHop === truoc.day.nhanHop, 'dash: số tờ/hộp không đổi khi có TN-xx');
  sh('PhanCa').rows.pop(); sh('PhanNhom').rows.pop(); ctx.memoClear_();
}

// ===== Dashboard: khoangNgay (khoảng ngày có dữ liệu) =====
{
  ctx.memoClear_();
  const kn = function (o) { return api(tAdmin, 'dashboard', Object.assign({ ngay: '2026-11-09' }, o || {})).data.khoangNgay; };
  const b = kn();
  ok(b && /^\d{4}-\d\d-\d\d$/.test(b.tu) && b.den <= '2026-11-09' && b.tu <= b.den && b.soNgay >= 1, 'khoangNgay: có tu/den/soNgay hợp lệ, den không quá hôm nay', b);
  const nk0 = sh('NhatKy').rows.length, dk0 = sh('DauKy').rows.length;
  ctx.append_('NhatKy', { ID: 'KN1', ThoiGian: NOW, Ngay: '2026-10-20', Ca: 'Chiều', Nhom: '1', Buoc: 'SCAN', MaHop: 'KN-1', SoHoSo: 1, SoTrang: 10, SoTo: 0, HetHop: true, NguoiNhap: 'ADMIN', Loai: 'THỬ NGHIỆM', Huy: false });
  ctx.append_('NhatKy', { ID: 'KN2', ThoiGian: NOW, Ngay: '2026-10-19', Ca: 'Chiều', Nhom: '1', Buoc: 'SCAN', MaHop: 'KN-2', SoHoSo: 1, SoTrang: 10, SoTo: 0, HetHop: true, NguoiNhap: 'ADMIN', Loai: 'BÌNH THƯỜNG', Huy: true });
  ctx.append_('NhatKy', { ID: 'KN3', ThoiGian: NOW, Ngay: '2026-12-01', Ca: 'Chiều', Nhom: '1', Buoc: 'SCAN', MaHop: 'KN-3', SoHoSo: 1, SoTrang: 10, SoTo: 0, HetHop: true, NguoiNhap: 'ADMIN', Loai: 'BÌNH THƯỜNG', Huy: false });
  ctx.memoClear_();
  const k1 = kn();
  ok(k1.tu === b.tu && k1.den === b.den && k1.soNgay === b.soNgay, 'khoangNgay: bỏ qua THỬ NGHIỆM, bản ghi đã hủy và ngày tương lai', [b, k1]);
  const k2 = kn({ gomThu: true });
  ok(k2.tu === '2026-10-20' && k2.soNgay === b.soNgay + 1, 'khoangNgay: gomThu (ADMIN) thì tính cả THỬ NGHIỆM (vẫn không tính bản đã hủy)', k2);
  sh('DauKy').rows.push(['SCAN', '', '', '', 50, 'x', '2026-10-30', 'Ngày']); ctx.memoClear_('DauKy'); ctx.memoClear_();
  const k3 = kn();
  ok(k3.tu === '2026-10-30' && k3.soNgay === b.soNgay + 1, 'khoangNgay: gồm cả ngày của DauKy có Ngay', k3);
  sh('DauKy').rows.length = dk0; sh('NhatKy').rows.length = nk0; ctx.memoClear_('DauKy'); ctx.memoClear_();
  ok(JSON.stringify(kn()) === JSON.stringify(b), 'khoangNgay: dọn dữ liệu thử xong trở lại như cũ');
}

// ===== Nhật ký: tổ viên chỉ thấy báo cáo của mình / nhóm mình lúc báo cáo =====
{
  const nkRow = (id, nguoi, nhom, tv) => sh('NhatKy').rows.push([id, '2026-11-09 15:00:00', '2026-11-09', 'Chiều', nhom, 'NHAN_NHOM', id, 0, 0, 0, 0, false, '', '', nguoi, 'THƯỜNG', false, '', tv]);
  nkRow('VIS1', 'B1', '5', 'B1,A1');      // nhóm lúc đó có A1
  nkRow('VIS2', 'B1', '5', 'B1,C1');      // nhóm lúc đó không có A1
  nkRow('VIS3', 'C1', '', 'C1');          // cá nhân người khác
  ctx.memoClear_();
  const ids = api(tA, 'nhatKy', {}).data.map(x => x.id);
  ok(ids.includes('VIS1') && !ids.includes('VIS2') && !ids.includes('VIS3'), 'tổ viên chỉ thấy báo cáo có mình trong nhóm lúc báo cáo', ids.filter(i => /^VIS/.test(i)));
  ok(['VIS1', 'VIS2', 'VIS3'].every(i => api(tTT, 'nhatKy', {}).data.some(x => x.id === i)), 'quản lý vẫn thấy hết báo cáo trong ngày');
}
// ===== Cache tab nhỏ: lượt gọi sau đọc từ cache, ghi xong thì không đọc nhầm dữ liệu cũ =====
{
  ctx.__memoOnly(); api(tTT, 'dsCa', { ca: 'Chiều' });
  ctx.__memoOnly(); getValuesCalls = 0; const d1 = api(tTT, 'dsCa', { ca: 'Chiều' }).data;
  ok(getValuesCalls === 1, 'dsCa lần 2: NhanSu/PhanCa/PhanNhom/ChotCa lấy từ cache, chỉ còn đọc NhatKy (1 lần thay vì 5)', getValuesCalls);
  api(tTT, 'luuNhom', { ngay: '2026-11-09', ca: 'Chiều', chiDoi: true, gan: [{ ma: 'B1', nhom: '6' }] });
  ctx.__memoOnly(); const d2 = api(tTT, 'dsCa', { ca: 'Chiều' }).data;
  ok(d2.nguoi.find(x => x.ma === 'B1').nhom === '6', 'sau khi đổi nhóm, lượt gọi mới thấy ngay nhóm mới (không dùng cache cũ)', d2.nguoi.find(x => x.ma === 'B1'));
  api(tTT, 'luuNhom', { ngay: '2026-11-09', ca: 'Chiều', chiDoi: true, gan: [{ ma: 'B1', nhom: '5' }] });
}
{
  ctx.__memoOnly(); api(tTT, 'dsCa', { ca: 'Chiều' });
  sh('PhanCa').rows.push(['2026-11-09', 'Chiều', 'NV9', 'Sửa tay trên Sheet', '', '']);   // sửa tay trực tiếp trên Sheet
  ctx.onEdit({ range: { getSheet: () => ({ getName: () => 'PhanCa' }) } });
  ctx.__memoOnly();
  ok(api(tTT, 'dsCa', { ca: 'Chiều' }).data.nguoi.some(x => x.ma === 'NV9'), 'sửa tay trên Sheet (onEdit) làm mới cache ngay');
  sh('PhanCa').rows.pop(); ctx.memoClear_();
}

// ===== Lũy kế tính đến hết ngày đang xem =====
{
  sh('NhatKy').rows.push(['LK1', '2026-11-05 09:00:00', '2026-11-05', 'Sáng', '', 'SCAN', 'LK-HOP', 1, 0, 700, 0, true, '', '', 'A1', 'THƯỜNG', false, '', 'A1']);
  ctx.memoClear_();
  const dNay = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data, dCu = api(tAdmin, 'dashboard', { ngay: '2026-11-04' }).data, d5 = api(tAdmin, 'dashboard', { ngay: '2026-11-05' }).data;
  ok(dCu.luyKe.scanDV === dNay.luyKe.scanDV - 700 - (dNay.luyKe.scanDV - d5.luyKe.scanDV) && d5.luyKe.scanDV - dCu.luyKe.scanDV === 700, 'xem ngày cũ: lũy kế Scan chỉ tính tới hết ngày đó', [dCu.luyKe.scanDV, d5.luyKe.scanDV, dNay.luyKe.scanDV]);
  ok(dCu.tienDo.denNgay === '2026-11-04' && dCu.tienDo.buoc[0].daLam < dNay.tienDo.buoc[0].daLam, 'tiến độ tổng thể đổi theo ngày đang xem', [dCu.tienDo.buoc[0].daLam, dNay.tienDo.buoc[0].daLam]);
  sh('NhatKy').rows.pop(); ctx.memoClear_();
}

// ===== Báo cáo cá nhân khi chưa phân nhóm =====
{
  api(tTT, 'luuNhom', { ngay: '2026-11-09', ca: 'Chiều', gan: [] });
  ctx.memoClear_();
  const rc = rep(tA, { buoc: 'SCAN', hop: 'CN1', soHoSo: 2, soTrang: 20 });
  ok(rc.ok, 'chưa phân nhóm: tổ viên vẫn báo cáo được (cá nhân)', rc);
  const row = sh('NhatKy').rows.filter(x => x[6] === 'CN1').slice(-1)[0];
  ok(row && row[18] === 'A1' && row[4] === '', 'báo cáo cá nhân: Nhom rỗng, ThanhVien = chính người báo cáo', row);
  const rh = api(tTT, 'ghi', { buoc: 'SCAN', boSung: true, ngay: '2026-11-09', ca: 'Chiều', nhom: '', nguoiHo: 'B1', hop: 'CN2', soHoSo: 1, soTrang: 10 });
  ok(rh.ok, 'nhập hộ không chọn nhóm: chạy như cá nhân', rh);
  ok(!api(tTT, 'ghi', { buoc: 'SCAN', boSung: true, ngay: '2026-11-09', ca: 'Chiều', nhom: '', hop: 'CN3', soHoSo: 1, soTrang: 10 }).ok, 'nhập hộ không nhóm và không chọn người: bị từ chối');
  const dd = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data;
  ok(dd.canhan.some(c => c.ma === 'A1' && c.scanTrang >= 20), 'dashboard: số cá nhân được tính cho người báo cáo', dd.canhan);
}

// ===== Dashboard: ai nhập bao nhiêu =====
{
  const dn = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data;
  const a1 = dn.nguoiNhap.find(x => x.ma === 'A1' && x.ca === 'Chiều');
  ok(a1 && a1.scanDV >= 20 && a1.soLan >= 1, 'dashboard: tổng hợp theo ca và người nhập', dn.nguoiNhap);
  ok(dn.chiTiet.some(x => x.hop === 'CN1' && x.nguoi && x.gio), 'dashboard: chi tiết từng lần báo cáo có giờ và người nhập');
  ok(dn.chiTiet.some(x => x.hop === 'CN2' && x.ma === 'TT1' && /B/.test(x.thucHien)), 'dashboard: nhập hộ ghi người nhập và người thực hiện', dn.chiTiet.filter(x => x.hop === 'CN2'));
  ok(!api(tA, 'dashboard', { ngay: '2026-11-09' }).ok, 'tổ viên không xem được chi tiết người nhập (bị chặn cả Dashboard)');
}

// ===== 15. Số đầu kỳ TỪNG NGÀY (DauKy có Ngay/Ca) =====
setNow('2026-11-09 20:00:00');
const ngayKiem = ['2026-11-02', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-08', '2026-11-09'];
const truoc = {}; ngayKiem.forEach(n => { truoc[n] = api(tAdmin, 'dashboard', { ngay: n }).data; });
[['SCAN', '', '', '', 2000, 'x', '2026-11-05', 'Ngày'], ['SCAN', '', '', '', 500, 'x', '2026-11-05', 'Tối'], ['TACH', '', '', '', 300, 'x', '2026-11-06', 'Ngày'], ['OCR', '', '', '', 200, 'x', '2026-11-06', 'Tối']].forEach(rw => sh('DauKy').rows.push(rw));
ctx.memoClear_('DauKy'); ctx.memoClear_();
const sau = {}; ngayKiem.forEach(n => { sau[n] = api(tAdmin, 'dashboard', { ngay: n }).data; });
const dlt = (n, f) => f(sau[n]) - f(truoc[n]);
ok(dlt('2026-11-05', d => d.day.scanDV) === 2500 && dlt('2026-11-05', d => d.cas[2].scanDV) === 500 && sau['2026-11-05'].caGop.scanDV === 2000 && dlt('2026-11-05', d => d.cas[0].scanDV) === 0, 'ngày 05/11: số ngày = 2.000 (ca ngày gộp) + 500 (ca Tối); Sáng/Chiều không bị cộng', { day: dlt('2026-11-05', d => d.day.scanDV), toi: dlt('2026-11-05', d => d.cas[2].scanDV), gop: sau['2026-11-05'].caGop });
ok(dlt('2026-11-04', d => d.day.scanDV) === 0 && dlt('2026-11-04', d => d.tienDo.buoc[0].daLam) === 0, 'ngày 04/11 (trước dòng 05/11): không đổi số');
ok(dlt('2026-11-05', d => d.tienDo.buoc[0].daLam) === 2500 && dlt('2026-11-06', d => d.tienDo.buoc[0].daLam) === 2500 && dlt('2026-11-09', d => d.tienDo.buoc[0].daLam) === 2500, 'tiến độ Scan lũy kế tới hết ngày: cộng từng ngày đến ngày đang xem (05/11, 06/11, 09/11 đều +2.500)');
ok(dlt('2026-11-05', d => d.tienDo.buoc[1].daLam) === 0 && dlt('2026-11-06', d => d.tienDo.buoc[1].daLam) === 300 && dlt('2026-11-06', d => d.tienDo.buoc[2].daLam) === 200 && dlt('2026-11-05', d => d.tienDo.buoc[2].daLam) === 0, 'Tách và OCR chỉ cộng từ đúng ngày của chúng (06/11)');
ok(dlt('2026-11-06', d => d.day.tachDV) === 300 && dlt('2026-11-06', d => d.day.ocrDV) === 200 && dlt('2026-11-06', d => d.cas[2].ocrDV) === 200 && sau['2026-11-06'].caGop.tachDV === 300, 'ngày 06/11: Tách 300 (ca ngày gộp), OCR 200 (ca Tối)');
const se = sau['2026-11-09'].series.find(x => x.ngay === '2026-11-05'), se0 = truoc['2026-11-09'].series.find(x => x.ngay === '2026-11-05');
ok(se && (se.scanDV - (se0 ? se0.scanDV : 0)) === 2500, 'biểu đồ 10 ngày có cột ngày 05/11 với số đầu kỳ từng ngày', { se, se0 });
ok(sau['2026-11-09'].series.some(x => x.ngay === '2026-11-06' && x.tachDV >= 300) && sau['2026-11-09'].luyKe.dauKyDen.scanDV === 1000 + 2500, 'series gồm ngày 06/11; luyKe.dauKyDen = số dư gộp + từng ngày tới hết ngày xem');
ok(sau['2026-11-02'].tienDo.soNgay === 1 && sau['2026-11-02'].tienDo.soCa === 2 && sau['2026-11-05'].tienDo.soNgay === 4 && sau['2026-11-05'].tienDo.soCa === 11 && sau['2026-11-08'].tienDo.soNgay === 7 && sau['2026-11-08'].tienDo.soCa === 18, 'TB/ngày, TB/ca tính theo số ngày/ca đã qua đến ngày đang xem (02/11: 1 ngày/2 ca; 05/11: 4/11; 08/11: 7/18)', [2, 5, 8].map(n => [sau['2026-11-0' + n].tienDo.soNgay, sau['2026-11-0' + n].tienDo.soCa]));
ok(sau['2026-11-05'].tienDo.buoc[0].tbNgay > 0 && sau['2026-11-05'].tienDo.buoc[0].tbNgay === Math.round(sau['2026-11-05'].tienDo.buoc[0].daLam / 4), 'TB/ngày của ngày 05/11 = tổng lũy kế / 4 ngày');
ok(api(tTT, 'dashboard', { ngay: '2026-11-05' }).data.caGop.scanDV === 2000, 'Tổ trưởng cũng nhận caGop');

// ===== 16. Nhận hộp: ghi chú / mã hồ sơ trong hộp được lưu vào cột MaHoSo (và vẫn ở GhiChu) =====
setNow('2026-11-09 15:30:00'); ctx.memoClear_();
{
  const rr = api(tTT, 'ghi', { buoc: 'NHAN', ca: 'Chiều', hop: 'MH1 MH2', ghiChu: 'Từ 472 đến 476' });
  const rs = sh('NhatKy').rows.filter(x => x[6] === 'MH1' || x[6] === 'MH2');
  ok(rr.ok && rs.length === 2 && rs.every(x => x[12] === 'Từ 472 đến 476' && /Từ 472 đến 476/.test(x[13])), 'Nhận từ TT Lưu trữ: ghi chú "Từ 472 đến 476" được lưu ở cột MaHoSo và GhiChu', rs.map(x => [x[12], x[13]]));
  const r2 = api(tTT, 'ghi', { buoc: 'NHAN', ca: 'Chiều', hop: 'MH3', ghiChu: 'x', maHoSo: 'HS-001..HS-010' });
  ok(r2.ok && sh('NhatKy').rows.find(x => x[6] === 'MH3')[12] === 'HS-001..HS-010', 'nếu có trường maHoSo riêng thì ưu tiên maHoSo');
  const r3 = api(tTT, 'ghi', { buoc: 'TRA', ca: 'Chiều', hop: 'MH4', ghiChu: 'ghi chú trả' });
  ok(r3.ok && sh('NhatKy').rows.find(x => x[6] === 'MH4')[12] === '', 'bước Trả hộp không ghi vào MaHoSo');
  ok(sh('LogHeThong').rows.slice(1).some(x => x[4] === 'BAO_CAO' && /mã hồ sơ\/ghi chú: Từ 472 đến 476/.test(x[6])), 'nhật ký BAO_CAO có ghi chú/mã hồ sơ của hộp nhận');
}

// ===== F-QL-10: Nhập hộ Scan kèm Tách file (giao diện gửi lại đúng payload, đổi buoc = TACH, bỏ trangLoi) =====
{
  const p = { buoc: 'SCAN', boSung: true, ngay: '2026-11-09', ca: 'Chiều', nhom: '', nguoiHo: 'B1', hop: 'KT1', soHoSo: 2, soTrang: 25, soTo: 0, trangLoi: 1, hetHop: true };
  const r1 = api(tTT, 'ghi', p);
  const t = Object.assign({}, p, { buoc: 'TACH' }); delete t.trangLoi;
  const r2 = api(tTT, 'ghi', t);
  const rows = sh('NhatKy').rows.filter(x => x[6] === 'KT1');
  const sc = rows.find(x => x[5] === 'SCAN'), ta = rows.find(x => x[5] === 'TACH');
  ok(r1.ok && r2.ok && sc && ta, 'nhập hộ Scan kèm Tách: ghi đủ 2 bản ghi SCAN và TACH', [r1, r2]);
  ok(ta && Number(ta[8]) === 25 && Number(ta[7]) === 2 && ta[11] === true && ta[15] === 'NHẬP HỘ' && ta[18] === 'B1', 'bản ghi Tách cùng số trang/hồ sơ/hết hộp, loại NHẬP HỘ, tính cho người được nhập hộ', ta);
}

// ===== P2: ghiLo – ghi nhiều hộp × (Scan, Tách, OCR) một lần gửi =====
{
  const idn = (() => { let i = 0; return () => 'LO-TEST-' + (++i) + '-abcdef'; })();
  const lo = (t, muc, o) => api(t, 'ghiLo', Object.assign({ ca: 'Chiều', idLo: idn(), muc }, o || {}));
  const mk = (hop, buoc, hs, to, extra) => Object.assign({ hop, buoc, soHoSo: hs, soTo: to }, extra || {});
  const nk = () => sh('NhatKy').rows.slice(1);
  const dem = h => nk().filter(x => x[6] === h).length;
  ['LA', 'LB', 'LC'].forEach(h => { rep(tTT, { buoc: 'NHAN', hop: h }); api(tA, 'ghi', { buoc: 'NHAN_NHOM', ca: 'Chiều', hop: h, kieuNhan: 'CANHAN' }); });

  // 1. ba hộp × ba khâu, tổ viên, một lần gửi
  const muc1 = []; ['LA', 'LB', 'LC'].forEach((h, i) => ['SCAN', 'TACH', 'OCR'].forEach(b => muc1.push(mk(h, b, 3, 20 + i, { hetHop: h !== 'LC', maHoSo: '47' + i + '-47' + (i + 2), trangLoi: b === 'SCAN' ? 1 : 0 }))));
  const l0 = lockCount; r = lo(tA, muc1);
  ok(r.ok && r.data.added === 9 && r.data.loi === 0 && r.data.ketQua.length === 9 && r.data.ketQua.every(k => k.ok), 'ghiLo: 3 hộp × 3 khâu ghi đủ 9 bản ghi, không lỗi', r);
  ok(lockCount - l0 === 1, 'ghiLo chạy trong 1 lần khóa (không thuộc READ_ACTIONS)', lockCount - l0);
  const ra = nk().filter(x => x[6] === 'LA' && ['SCAN', 'TACH', 'OCR'].indexOf(x[5]) >= 0);
  ok(ra.length === 3 && ra.every(x => x[18] === 'A1' && x[14] === 'A1' && x[15] === 'THƯỜNG') && ra.find(x => x[5] === 'SCAN')[12] === '470-472' && Number(ra.find(x => x[5] === 'SCAN')[10]) === 1, 'ghiLo: mỗi khâu 1 dòng NhatKy, chốt ThanhVien/Nhóm, lưu mã hồ sơ và trang lỗi như ghi cũ', ra);
  ok(sh('LogHeThong').rows.filter(x => x[4] === 'BAO_CAO_LO' && !/LO-A1-TEST/.test(x[6])).length === 1 && sh('LogHeThong').rows.filter(x => x[4] === 'BAO_CAO' && /^(Scan|Tách file|OCR)/.test(x[6]) && /hộp LA /.test(x[6])).length === 3, 'ghiLo ghi log: 1 dòng BAO_CAO_LO + log BAO_CAO cho từng khâu');

  // 2. R1: cả lô 10 hộp × 3 khâu chỉ đọc NhatKy 1 lần
  const muc2 = []; for (let i = 1; i <= 10; i++) ['SCAN', 'TACH', 'OCR'].forEach(b => muc2.push(mk('LX' + i, b, 2, 10, { hetHop: true })));
  ctx.memoClear_(); for (const k in getValuesBy) delete getValuesBy[k];
  r = lo(tA, muc2);
  ok(r.ok && r.data.added === 30 && r.data.loi === 0, 'ghiLo: 10 hộp × 3 khâu = 30 dòng ghi được', r.ok ? { added: r.data.added, loi: r.data.loi } : r);
  ok(getValuesBy.NhatKy === 1, 'R1: cả lô 30 mục chỉ đọc sheet NhatKy ĐÚNG 1 lần', getValuesBy);
  ctx.memoClear_(); for (const k in getValuesBy) delete getValuesBy[k];
  for (let i = 1; i <= 3; i++) api(tA, 'ghi', { buoc: 'SCAN', ca: 'Chiều', hop: 'LY' + i, soHoSo: 1, soTo: 5 });
  ok(getValuesBy.NhatKy >= 3, 'đối chứng: gọi ghi cũ 3 lần thì đọc NhatKy ≥ 3 lần', getValuesBy);
  ok(dem('LX1') === 3 && dem('LX10') === 3, 'sau lô, dữ liệu thật đã nằm trong Sheet (đọc lại thấy đủ)');

  // 3. R4: gửi lại cùng idLo không ghi thêm
  const id = 'LO-RETRY-0001', n0 = nk().length;
  const m3 = [mk('LD', 'SCAN', 2, 15, { hetHop: true })];
  const a1 = api(tA, 'ghiLo', { ca: 'Chiều', idLo: id, muc: m3 }), a2 = api(tA, 'ghiLo', { ca: 'Chiều', idLo: id, muc: m3 });
  ok(a1.ok && a1.data.added === 1 && a2.ok && a2.data.guiLai === true && a2.data.added === 1 && nk().length === n0 + 1, 'R4: gửi lại cùng idLo trả kết quả cũ, không ghi thêm', [a1, a2, nk().length - n0]);
  ok(!api(tB, 'ghiLo', { ca: 'Chiều', idLo: id, muc: [mk('LD', 'TACH', 2, 15)] }).data.guiLai, 'idLo gắn với người gửi: người khác dùng cùng idLo không bị trả kết quả của người kia');
  ok(!api(tA, 'ghiLo', { ca: 'Chiều', muc: m3 }).ok && !api(tA, 'ghiLo', { ca: 'Chiều', idLo: 'x', muc: m3 }).ok, 'thiếu / sai idLo bị từ chối');

  // 4. giới hạn lô
  const nhieuHop = []; for (let i = 1; i <= 11; i++) nhieuHop.push(mk('LZ' + i, 'SCAN', 1, 1));
  r = lo(tA, nhieuHop); ok(!r.ok && /tối đa 10 hộp/.test(r.err), 'quá 10 hộp bị từ chối', r);
  const nhieuMuc = []; for (let i = 1; i <= 31; i++) nhieuMuc.push(mk('LZ' + (i % 10), 'SCAN', 1, 1));
  r = lo(tA, nhieuMuc); ok(!r.ok && /tối đa/.test(r.err), 'quá 30 dòng bị từ chối', r);
  r = lo(tA, []); ok(!r.ok, 'lô rỗng bị từ chối');
  r = lo(tA, [mk('LZ1', 'TRA', 1, 1)]); ok(!r.ok && /Khâu không hợp lệ/.test(r.err), 'ghiLo chỉ nhận Scan/Tách/OCR', r);
  ok(dem('LZ1') === 0, 'lô bị từ chối không ghi gì');

  // 5. hộp lỗi bỏ qua, hộp đúng vẫn ghi; khâu sau của hộp lỗi bị bỏ qua
  r = lo(tA, [mk('LA', 'SCAN', 1, 5), mk('LA', 'TACH', 1, 5), mk('LE', 'OCR', 2, 9, { hetHop: false }), mk('LE', 'SCAN', 2, 9)]);
  const kq = r.data && r.data.ketQua;
  ok(r.ok && r.data.added === 2 && r.data.loi === 2 && kq.filter(k => k.hop === 'LA').every(k => !k.ok) && /XONG/.test(kq.find(k => k.hop === 'LA' && k.buoc === 'SCAN').err) && /Bỏ qua/.test(kq.find(k => k.hop === 'LA' && k.buoc === 'TACH').err), 'hộp đã xong Scan: dòng lỗi báo lý do, Tách của hộp đó bị bỏ qua', kq);
  ok(kq && kq.filter(k => k.hop === 'LE').length === 2 && kq.filter(k => k.hop === 'LE').every(k => k.ok) && dem('LE') === 2, 'hộp LE vẫn ghi (kết quả theo từng hộp), thứ tự khâu được sắp Scan → OCR');
  ok(r.data.warnings.some(w => /LE chưa có trong danh sách đã nhận/.test(w)), 'hộp ngoài danh sách (gõ tay) vẫn ghi, chỉ cảnh báo');

  // 6. cùng hộp hai dòng cùng khâu trong một lô: bộ nhớ đọc đã cập nhật nên dòng sau bị chặn "đã XONG"
  r = lo(tA, [mk('LF', 'SCAN', 1, 5, { hetHop: true }), mk('LF', 'SCAN', 1, 5, { hetHop: true })]);
  ok(r.ok && r.data.ketQua[0].ok && !r.data.ketQua[1].ok && /XONG/.test(r.data.ketQua[1].err) && dem('LF') === 1, 'trong cùng lô, dòng thứ hai của hộp đã xong bị chặn (đọc thấy dòng vừa ghi)', r);

  // 7. mọi kiểm tra của ghi_: ngoài ca, ca không thuộc, nhập hộ, lãnh đạo, số âm, thiếu số
  setNow('2026-11-09 19:30:00'); r = lo(tA, [mk('LG', 'SCAN', 1, 5)]);
  ok(r.ok && r.data.added === 0 && /Ngoài thời gian|Ca đã|không thuộc/.test(r.data.ketQua[0].err), 'ngoài giờ ca: ghiLo không ghi (kế thừa kiểm tra ghi_)', r); setNow('2026-11-09 15:30:00');
  r = lo(tA, [mk('LG', 'SCAN', 1, 5)], { ca: 'Sáng' }); ok(r.ok && r.data.added === 0 && /không thuộc danh sách/.test(r.data.ketQua[0].err), 'ca không thuộc danh sách: không ghi', r);
  r = lo(tA, [mk('LG', 'SCAN', 1, 5)], { boSung: true, ngay: '2026-11-09', nguoiHo: 'B1' }); ok(r.ok && r.data.added === 0 && /Chỉ Tổ trưởng/.test(r.data.ketQua[0].err), 'tổ viên không nhập hộ được qua ghiLo', r);
  r = api(tLD, 'ghiLo', { ca: 'Chiều', idLo: idn(), muc: [mk('LG', 'SCAN', 1, 5)] }); ok(!r.ok && /chỉ được xem/.test(r.err), 'Lãnh đạo không gọi được ghiLo', r);
  r = lo(tA, [mk('LG', 'SCAN', -1, 5), mk('LH', 'SCAN', 0, 5), mk('LI', 'SCAN', 2, 0), mk('LJ', 'SCAN', 2, 99999)]);
  ok(r.ok && r.data.added === 0 && r.data.loi === 4 && /không được âm/.test(r.data.ketQua[0].err) && /số hồ sơ/.test(r.data.ketQua[1].err) && /số trang hoặc số tờ/.test(r.data.ketQua[2].err) && /bất thường/.test(r.data.ketQua[3].err), 'số âm / thiếu số hồ sơ / thiếu số tờ / quá lớn: từng dòng báo lỗi, không ghi', r);
  r = lo(tA, [mk('LK M', 'SCAN', 1, 5)]); ok(r.ok && r.data.added === 0 && !r.data.ketQua[0].ok, 'mã hộp có khoảng trắng bị từ chối', r);
  r = lo(tA, [mk('a,b', 'SCAN', 1, 5)]); ok(r.ok && r.data.added === 0 && /không hợp lệ/.test(r.data.ketQua[0].err), 'mã hộp có dấu phẩy bị từ chối', r);
  r = lo(tTT, [mk('LN', 'SCAN', 2, 9, { hetHop: true }), mk('LN', 'TACH', 2, 9)], { boSung: true, ngay: '2026-11-09', nhom: '', nguoiHo: 'B1' });
  ok(r.ok && r.data.added === 2 && nk().filter(x => x[6] === 'LN').every(x => x[15] === 'NHẬP HỘ' && x[18] === 'B1'), 'quản lý nhập hộ qua ghiLo: loại NHẬP HỘ, tính cho người được nhập hộ', r);

  // 8. so sánh với chuỗi ghi cũ: cùng dữ liệu NhatKy và cùng dash_
  const strip = rows => rows.map(x => x.map((v, i) => (i === 0 || i === 1) ? '' : v));
  const dashJ = () => { ctx.memoClear_(); const dd = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data; delete dd.capNhat; return JSON.stringify(dd); };
  ['M1', 'M2', 'M3'].forEach(h => { rep(tTT, { buoc: 'NHAN', hop: 'S' + h }); api(tA, 'ghi', { buoc: 'NHAN_NHOM', ca: 'Chiều', hop: 'S' + h, kieuNhan: 'CANHAN' }); });
  const muc8 = []; ['M1', 'M2', 'M3'].forEach((h, i) => ['SCAN', 'TACH', 'OCR'].forEach(b => muc8.push(mk('S' + h, b, 2 + i, 18 + i, { hetHop: i !== 2, maHoSo: 'HS-' + i, trangLoi: b === 'SCAN' ? i : 0 }))));
  const nTruoc = sh('NhatKy').rows.length;
  r = lo(tA, muc8); const rowsLo = strip(sh('NhatKy').rows.slice(nTruoc)), dashLo = dashJ();
  sh('NhatKy').rows.length = nTruoc; ctx.memoClear_();
  muc8.forEach(m => api(tA, 'ghi', { ca: 'Chiều', buoc: m.buoc, hop: m.hop, soHoSo: m.soHoSo, soTo: m.soTo, trangLoi: m.trangLoi, hetHop: m.hetHop, maHoSo: m.maHoSo }));
  const rowsOld = strip(sh('NhatKy').rows.slice(nTruoc)), dashOld = dashJ();
  ok(r.ok && rowsLo.length === 9 && JSON.stringify(rowsLo) === JSON.stringify(rowsOld), 'so sánh: ghiLo và chuỗi ghi cũ cho NhatKy giống hệt (trừ ID/giờ)', [rowsLo.length, rowsOld.length]);
  ok(dashLo === dashOld && dashLo.length > 200, 'so sánh: dash_ trước/sau (ghiLo vs ghi cũ) giống hệt trên cùng dữ liệu');
}

// ===== P4: giao diện chỉ gửi soTo (soTrang không gửi) – số liệu vẫn đúng ở dash_ và lịch sử =====
{
  const idn = 'LO-P4-TEST-0001';
  ['T1', 'T2'].forEach(h => { rep(tTT, { buoc: 'NHAN', hop: h }); api(tA, 'ghi', { buoc: 'NHAN_NHOM', ca: 'Chiều', hop: h, kieuNhan: 'CANHAN' }); });
  const dTruoc = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data;
  const r1 = api(tA, 'ghiLo', { ca: 'Chiều', idLo: idn, muc: [
    { hop: 'T1', buoc: 'SCAN', soHoSo: 2, soTo: 37, hetHop: true, maHoSo: '10-11' },
    { hop: 'T1', buoc: 'TACH', soHoSo: 2, soTo: 37, hetHop: true },
    { hop: 'T2', buoc: 'SCAN', soHoSo: 1, soTo: 12, hetHop: false }] });
  const rows = sh('NhatKy').rows.filter(x => x[6] === 'T1' || x[6] === 'T2').filter(x => x[5] !== 'NHAN' && x[5] !== 'NHAN_NHOM');
  ok(r1.ok && r1.data.added === 3 && rows.length === 3 && rows.every(x => Number(x[8]) === 0 && Number(x[9]) > 0), 'P4: chỉ gửi soTo → cột SoTrang giữ 0, SoTo có số (không trùng hai cột)', rows);
  const dSau = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data;
  ok(dSau.day.scanDV - dTruoc.day.scanDV === 49 && dSau.day.tachDV - dTruoc.day.tachDV === 37 && dSau.day.scanHop - dTruoc.day.scanHop === 1, 'P4: dash_ cộng đúng theo số tờ (dv = to), hộp xong đếm 1', [dSau.day.scanDV - dTruoc.day.scanDV, dSau.day.tachDV - dTruoc.day.tachDV]);
  const ls = api(tA, 'lichSu', { tu: '2026-11-09', den: '2026-11-09' }).data;
  ok(ls.filter(x => x.hop === 'T1' && x.buoc === 'SCAN')[0].dv === 37, 'P4: Lịch sử cá nhân hiện đúng 37 tờ cho bản ghi chỉ có soTo');
  const nkr = api(tA, 'nhatKy', {}).data.filter(x => x.hop === 'T1' && x.buoc === 'SCAN')[0];
  ok(nkr.to === 37 && nkr.trang === 0, 'P4: Nhật ký ca trả to=37, trang=0 (không hiện hai cột trùng số)', nkr);
}

// ===== P3: tick nhiều khâu – mặc định Scan + Tách (OCR tự bật) cùng số liệu; so với cách "kèm Tách" cũ (2 lần ghi) =====
{
  const strip = rows => rows.map(x => x.map((v, i) => (i === 0 || i === 1) ? '' : v));
  const dashJ = () => { ctx.memoClear_(); const dd = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data; delete dd.capNhat; return JSON.stringify(dd); };
  ['K1', 'K2', 'K3'].forEach(h => { rep(tTT, { buoc: 'NHAN', hop: h }); api(tA, 'ghi', { buoc: 'NHAN_NHOM', ca: 'Chiều', hop: h, kieuNhan: 'CANHAN' }); });
  const dong = [['K1', 3, 31, true, '1-3'], ['K2', 2, 18, false, '4-5'], ['K3', 1, 9, true, '']];
  const lo = dong.reduce((a, d) => a.concat(['SCAN', 'TACH'].map(b => ({ hop: d[0], buoc: b, soHoSo: d[1], soTo: d[2], hetHop: d[3], maHoSo: d[4], trangLoi: b === 'SCAN' ? 1 : '' }))), []);
  const n0 = sh('NhatKy').rows.length;
  const r1 = api(tA, 'ghiLo', { ca: 'Chiều', idLo: 'LO-P3-TEST-0001', muc: lo });
  const rowsLo = strip(sh('NhatKy').rows.slice(n0)), dLo = dashJ();
  sh('NhatKy').rows.length = n0; ctx.memoClear_();
  dong.forEach(d => { api(tA, 'ghi', { buoc: 'SCAN', ca: 'Chiều', hop: d[0], soHoSo: d[1], soTo: d[2], hetHop: d[3], maHoSo: d[4], trangLoi: 1 }); api(tA, 'ghi', { buoc: 'TACH', ca: 'Chiều', hop: d[0], soHoSo: d[1], soTo: d[2], hetHop: d[3], maHoSo: d[4] }); });
  const rowsOld = strip(sh('NhatKy').rows.slice(n0)), dOld = dashJ();
  ok(r1.ok && r1.data.added === 6 && r1.data.loi === 0, 'P3: Scan + Tách cho 3 hộp trong một lô ghi đủ 6 bản ghi', r1);
  ok(JSON.stringify(rowsLo) === JSON.stringify(rowsOld) && rowsLo.length === 6, 'P3: NhatKy giống hệt cách ghi cũ (Scan rồi Tách từng hộp), trừ ID/giờ');
  ok(dLo === dOld, 'P3: dash_ trước/sau giống hệt trên cùng dữ liệu');
  // OCR bật sau: lô riêng chỉ khâu OCR cho hộp đã Scan + Tách xong, không có cảnh báo "chưa Tách"
  const r2 = api(tA, 'ghiLo', { ca: 'Chiều', idLo: 'LO-P3-TEST-0002', muc: [{ hop: 'K1', buoc: 'OCR', soHoSo: 3, soTo: 31, hetHop: true }] });
  ok(r2.ok && r2.data.added === 1 && !r2.data.warnings.some(w => /chưa có báo cáo Tách/.test(w)), 'P3: lô chỉ OCR (người dùng tự bật) cho hộp đã Tách: ghi 1 bản ghi, không cảnh báo', r2);
  // ba khâu cùng lúc, đúng thứ tự dù gửi lộn xộn
  rep(tTT, { buoc: 'NHAN', hop: 'K4' });
  const r3 = api(tA, 'ghiLo', { ca: 'Chiều', idLo: 'LO-P3-TEST-0003', muc: ['OCR', 'SCAN', 'TACH'].map(b => ({ hop: 'K4', buoc: b, soHoSo: 1, soTo: 5, hetHop: true })) });
  ok(r3.ok && r3.data.added === 3 && r3.data.warnings.every(w => !/chưa có báo cáo (Scan|Tách)/.test(w)), 'P3: Scan + Tách + OCR cùng lúc: máy chủ tự xếp đúng thứ tự, không cảnh báo thiếu khâu trước', r3);
}

// ===== Lỗi dữ liệu: mã hộp "02.01.85" bị Google Sheets đổi thành ngày (appendMany_ thiếu định dạng văn bản '@') =====
{
  const nkS = sh('NhatKy');
  // 0. kiểm tra chính cái mock có giả lập đúng lỗi của Sheets: ghi "dd.mm.yy" vào ô chưa là văn bản -> thành Date
  const tmp = sh('DauKy'); const r0 = tmp.rows.length; tmp.getRange(r0 + 1, 6, 1, 1).setValues([['02.01.85']]);
  ok(tmp.rows[r0][5] instanceof Date, 'mock giả lập đúng Sheets: "02.01.85" vào ô chưa là văn bản bị đổi thành Date');
  tmp.rows.length = r0;
  // (a) Nhận hộp nhiều mã (appendMany_): mã dạng dd.mm.yy phải được lưu đúng chuỗi
  const rN = api(tTT, 'ghi', { buoc: 'NHAN', ca: 'Chiều', hop: '03.02.86 03.02.87 MD.01' });
  const rowsN = nkS.rows.filter(x => ['03.02.86', '03.02.87', 'MD.01'].indexOf(x[6]) >= 0 || x[6] instanceof Date);
  ok(rN.ok && rN.data.added === 3 && rowsN.length === 3 && rowsN.every(x => typeof x[6] === 'string'), 'Nhận hộp (appendMany_): mã "03.02.86" lưu đúng chuỗi, không bị đổi thành ngày', rowsN.map(x => String(x[6])));
  const rT = api(tTT, 'ghi', { buoc: 'TRA', ca: 'Chiều', hop: '05.04.86' });
  ok(rT.ok && nkS.rows.filter(x => x[6] instanceof Date).length === 0, 'Trả hộp (appendMany_) cũng không tạo ô Date', rT);
  const nMau = nkS.rows.length; ctx.memoClear_();
  ok(api(tAdmin, 'taoMau', { ngay: '2026-11-04', cas: ['Tối'], soNguoi: 2 }).ok && nkS.rows.slice(nMau - 1).every(x => !(x[6] instanceof Date)), 'taoMau (appendMany_) không tạo ô Date');
  // (b) dữ liệu cũ đã hỏng: dòng Nhận hộp có MaHop là Date -> đọc ra "04.03.85", khớp dòng Scan, gợi ý hộp đúng
  nkS.rows.push(['RHONG001', '2026-11-09 07:00:00', '2026-11-09', 'Chiều', '', 'NHAN', new Date(Date.UTC(1985, 2, 4)), 0, 0, 0, 0, false, new Date(Date.UTC(1985, 0, 2)), '', 'TT1', 'THƯỜNG', false, '', '']);
  ctx.memoClear_();
  const doc = ctx.read_('NhatKy').find(x => x.ID === 'RHONG001');
  ok(doc && doc.MaHop === '04.03.85' && doc.MaHoSo === '02.01.85', 'read_: MaHop/MaHoSo bị Date được đọc về "04.03.85" / "02.01.85"', doc && [doc.MaHop, doc.MaHoSo]);
  const gy = api(tTT, 'hopGoiY', { buoc: 'NHAN_NHOM' }).data;
  ok(gy.indexOf('04.03.85') >= 0 && !gy.some(x => /GMT|Mar|Jan/.test(x)), 'hopGoiY: hộp có dòng Nhận bị hỏng vẫn được gợi ý đúng mã', gy);
  const rS = api(tTT, 'ghi', { buoc: 'SCAN', ca: 'Chiều', hop: '04.03.85', soHoSo: 1, soTo: 9 });
  ok(rS.ok && !rS.data.warnings.some(w => /chưa có trong danh sách đã nhận/.test(w)), 'Scan hộp 04.03.85: khớp với dòng Nhận đã hỏng, không cảnh báo "chưa có trong danh sách đã nhận"', rS);
  ctx.memoClear_();
  const dd = api(tAdmin, 'dashboard', { ngay: '2026-11-09' }).data;
  ok(!JSON.stringify(dd).match(/GMT|Wed Jan|Tue Mar/), 'dash_: không còn chuỗi ngày kiểu "Tue Mar … GMT" ở bất kỳ trường nào');
  // (c) suaMaHopNgay: chỉ chủ Sheet, sửa đúng số ô, chạy lần 2 không sửa gì, có sao lưu và log
  ctx.__active = ''; let thr = false; try { ctx.suaMaHopNgay(); } catch (e) { thr = true; }
  ok(thr && nkS.rows.find(x => x[0] === 'RHONG001')[6] instanceof Date, 'suaMaHopNgay: người không phải chủ Sheet bị chặn, không sửa gì');
  ctx.__active = 'owner@x.com';
  const s1 = ctx.suaMaHopNgay();
  const fixed = nkS.rows.find(x => x[0] === 'RHONG001');
  ok(s1.daSua === 2 && s1.soDong === 1 && fixed[6] === '04.03.85' && fixed[12] === '02.01.85' && typeof fixed[6] === 'string', 'suaMaHopNgay: sửa đúng 2 ô (MaHop, MaHoSo) của 1 dòng về chuỗi dd.MM.yy', s1);
  ok(sh('SaoLuuXoa') && sh('SaoLuuXoa').rows.some(r => /RHONG001/.test(String(r[3]))), 'suaMaHopNgay: có sao lưu dòng cũ vào SaoLuuXoa');
  ok(sh('LogHeThong').rows.some(r => r[4] === 'SUA_MA_HOP_NGAY'), 'suaMaHopNgay: có ghi log hệ thống');
  const s2 = ctx.suaMaHopNgay();
  ok(s2.daSua === 0 && s2.soDong === 0, 'suaMaHopNgay: chạy lần 2 không sửa thêm ô nào', s2);
  ctx.__active = '';
}

// ===== thongKeNhanSu: thống kê theo nhân sự trong khoảng ngày =====
{
  ctx.memoClear_();
  const tk = function (tok, o) { return api(tok, 'thongKeNhanSu', o); };
  const DAYS = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'];
  const F = ['scanDV', 'tachDV', 'ocrDV', 'scanHop', 'tachHop', 'ocrHop', 'scanHs', 'tachHs'];
  const dayCN = function (n) { return api(tAdmin, 'dashboard', { ngay: n }).data.canhan; };
  // 1) khoảng 1 ngày trùng khớp canhan của dash_ cùng ngày
  const un = tk(tAdmin, { tu: '2026-11-09', den: '2026-11-09' });
  const cn9 = dayCN('2026-11-09');
  ok(un.ok && un.data.nguoi.length === cn9.length && cn9.length > 0 && cn9.every(c => { const x = un.data.nguoi.find(y => y.ma === c.ma); return x && x.soCa === c.soCa && F.every(f => x[f] === c[f]); }), 'thongKeNhanSu: khoảng 1 ngày trùng khớp canhan của dashboard', [un.data && un.data.nguoi, cn9]);
  // 2) khoảng nhiều ngày = tổng các ngày
  const tong = {}; DAYS.forEach(n => dayCN(n).forEach(c => { const o = tong[c.ma] = tong[c.ma] || { scanDV: 0, tachDV: 0, ocrDV: 0 }; o.scanDV += c.scanDV; o.tachDV += c.tachDV; o.ocrDV += c.ocrDV; }));
  const nhieu = tk(tAdmin, { tu: '2026-11-02', den: '2026-11-09' }).data;
  ok(Object.keys(tong).length > 0 && Object.keys(tong).every(ma => { const x = nhieu.nguoi.find(y => y.ma === ma); return x && ['scanDV', 'tachDV', 'ocrDV'].every(f => Math.abs(x[f] - tong[ma][f]) <= 0.5); }) && nhieu.nguoi.length === Object.keys(tong).length, 'thongKeNhanSu: nhiều ngày = tổng các ngày', [nhieu.nguoi, tong]);
  ok(nhieu.tong.scanDV === Math.round(nhieu.nguoi.reduce((a, x) => a + x.scanDV, 0) * 10) / 10 && nhieu.tong.soNguoi === nhieu.nguoi.length && nhieu.soNgay >= 1 && nhieu.dauKyDen === '2026-11-08', 'thongKeNhanSu: dòng tổng khớp tổng cột, có soNgay và dauKyDen', nhieu.tong);
  const x0 = nhieu.nguoi[0];
  ok(x0 && x0.gio > 0 && x0.dvGio === Math.round((x0.scanDV + x0.tachDV + x0.ocrDV) / x0.gio * 10) / 10, 'thongKeNhanSu: năng suất = tờ / người-giờ', x0);
  // 3) THỬ NGHIỆM / bản đã hủy / người TN-xx bị loại (trừ gomThu)
  const nk0 = sh('NhatKy').rows.length, truoc = tk(tAdmin, { tu: '2026-11-08', den: '2026-11-08' }).data, a1t = (truoc.nguoi.find(y => y.ma === 'A1') || { scanDV: 0 }).scanDV;
  ctx.append_('NhatKy', { ID: 'TK1', ThoiGian: NOW, Ngay: '2026-11-08', Ca: 'Chiều', Nhom: '', Buoc: 'SCAN', MaHop: 'TK-1', SoHoSo: 1, SoTrang: 10, SoTo: 100, HetHop: true, NguoiNhap: 'A1', Loai: 'BÌNH THƯỜNG', Huy: false, ThanhVien: 'A1,TN-91' });
  ctx.append_('NhatKy', { ID: 'TK2', ThoiGian: NOW, Ngay: '2026-11-08', Ca: 'Chiều', Nhom: '', Buoc: 'SCAN', MaHop: 'TK-2', SoHoSo: 1, SoTrang: 10, SoTo: 999, HetHop: true, NguoiNhap: 'A1', Loai: 'BÌNH THƯỜNG', Huy: true, ThanhVien: 'A1' });
  ctx.append_('NhatKy', { ID: 'TK3', ThoiGian: NOW, Ngay: '2026-11-08', Ca: 'Chiều', Nhom: '', Buoc: 'SCAN', MaHop: 'TK-3', SoHoSo: 1, SoTrang: 10, SoTo: 777, HetHop: true, NguoiNhap: 'A1', Loai: 'THỬ NGHIỆM', Huy: false, ThanhVien: 'A1' });
  ctx.memoClear_();
  const sau = tk(tAdmin, { tu: '2026-11-08', den: '2026-11-08' }).data;
  ok(!sau.nguoi.some(y => y.ma === 'TN-91') && ((sau.nguoi.find(y => y.ma === 'A1') || {}).scanDV) === a1t + 50, 'thongKeNhanSu: loại bản hủy, THỬ NGHIỆM và người TN-xx (A1 chỉ nhận 50 = 100/2)', sau.nguoi);
  const gom = tk(tAdmin, { tu: '2026-11-08', den: '2026-11-08', gomThu: true }).data;
  ok(gom.nguoi.some(y => y.ma === 'TN-91') && (gom.nguoi.find(y => y.ma === 'A1') || {}).scanDV === a1t + 50 + 777, 'thongKeNhanSu: ADMIN gomThu thì tính cả THỬ NGHIỆM và TN-xx (vẫn bỏ bản hủy)', gom.nguoi);
  ok(JSON.stringify(tk(tTT, { tu: '2026-11-08', den: '2026-11-08', gomThu: true }).data.nguoi) === JSON.stringify(sau.nguoi), 'thongKeNhanSu: không phải ADMIN thì gomThu không có tác dụng');
  sh('NhatKy').rows.length = nk0; ctx.memoClear_();
  // 4) phân quyền và kiểm tra khoảng
  ok(!tk(tA, { tu: '2026-11-09', den: '2026-11-09' }).ok, 'thongKeNhanSu: tổ viên bị chặn');
  ok(tk(tLD, { tu: '2026-11-09', den: '2026-11-09' }).ok && tk(tTT, {}).ok, 'thongKeNhanSu: Lãnh đạo và Tổ trưởng xem được; không truyền ngày thì lấy hôm nay');
  ok(!tk(tAdmin, { tu: '2026-11-09', den: '2026-11-01' }).ok && !tk(tAdmin, { tu: '2025-01-01', den: '2026-11-09' }).ok, 'thongKeNhanSu: từ > đến hoặc quá 366 ngày bị từ chối');
  ok(tk(tAdmin, { tu: '2026-10-01', den: '2030-01-01' }).data.den <= '2026-11-09', 'thongKeNhanSu: đến ngày không vượt quá hôm nay');
}

// ===== A2: chuanHoaNhom (cá nhân → nhóm, xem trước / áp dụng) =====
{
  const NG = '2026-11-09', CAX = 'Sáng';
  const nk0 = sh('NhatKy').rows.length, pn0 = sh('PhanNhom').rows.length;
  sh('PhanNhom').rows.push([NG, CAX, '1', 'A1', 'Nhân viên A', 'TT1', ''], [NG, CAX, '1', 'B1', 'Nhân viên B', 'TT1', ''], [NG, CAX, '2', 'TT1', 'Tổ trưởng', 'TT1', '']);
  ctx.memoClear_();
  const mk = (id, o) => ctx.append_('NhatKy', Object.assign({ ID: id, ThoiGian: NG + ' 08:' + id.slice(2, 4) + ':00', Ngay: NG, Ca: CAX, Nhom: '', Buoc: 'SCAN', MaHop: 'CH-X', SoHoSo: 2, SoTrang: 50, SoTo: 0, TrangLoi: 0, HetHop: true, NguoiNhap: 'A1', Loai: 'THƯỜNG', Huy: false, ThanhVien: 'A1' }, o));
  mk('CH10', { MaHop: 'CH-1', NguoiNhap: 'A1', ThanhVien: 'A1' });                 // 1) A1 và B1 báo cùng hộp, giống nhau → đổi nhóm 1 + hủy dòng thừa
  mk('CH11', { MaHop: 'CH-1', NguoiNhap: 'B1', ThanhVien: 'B1' });
  mk('CH12', { MaHop: 'CH-2', Buoc: 'NHAN_NHOM', SoHoSo: 0, SoTrang: 0, HetHop: false });   // 2) một dòng nhận hộp cá nhân → đổi nhóm
  mk('CH13', { MaHop: 'CH-3', SoTrang: 10 });                                       // 3) khác số liệu → xung đột
  mk('CH14', { MaHop: 'CH-3', SoTrang: 20, NguoiNhap: 'B1', ThanhVien: 'B1' });
  mk('CH15', { MaHop: 'CH-4', NguoiNhap: 'D1', ThanhVien: 'D1' });                  // 4) D1 chưa có nhóm → giữ cá nhân
  mk('CH16', { MaHop: 'CH-5', Loai: 'THỬ NGHIỆM' });                                // 5) THỬ NGHIỆM và bản đã hủy: không quét
  mk('CH17', { MaHop: 'CH-6', Huy: true });
  mk('CH18', { MaHop: 'CH-7', Nhom: '1', ThanhVien: 'A1,B1', SoTrang: 30 });        // 6) dòng nhóm sẵn có + dòng cá nhân giống hệt → hủy dòng cá nhân
  mk('CH19', { MaHop: 'CH-7', SoTrang: 30 });
  mk('CH20', { MaHop: 'CH-8', Buoc: 'TRA', SoHoSo: 0, SoTrang: 0, HetHop: false }); // 7) khâu không thuộc diện chuẩn hóa
  ctx.memoClear_();
  const nhom = id => ctx.s_(sh('NhatKy').rows.find(x => x[0] === id)[4]);
  const snap = () => JSON.stringify([sh('NhatKy').rows, sh('LogHeThong').rows.length]);
  const kPhan = () => api(tAdmin, 'dashboard', { ngay: NG }).data.day.scanDV;
  // quyền
  ok(!api(tTT, 'chuanHoaNhom', { ngay: NG, ca: CAX }).ok && !api(tA, 'chuanHoaNhom', { ngay: NG, ca: CAX }).ok && !api(tLD, 'chuanHoaNhom', { ngay: NG, ca: CAX }).ok, 'A2: chỉ ADMIN gọi được chuanHoaNhom (TT/TP, tổ viên, LĐ bị chặn)');
  ok(!api(tAdmin, 'chuanHoaNhom', { ca: CAX }).ok && !api(tAdmin, 'chuanHoaNhom', { ngay: NG, ca: 'Khuya' }).ok, 'A2: thiếu ngày hoặc ca sai bị từ chối');
  // xem trước
  const truoc = snap(), kTruoc = kPhan();
  const pv = api(tAdmin, 'chuanHoaNhom', { ngay: NG, ca: CAX });
  const D = pv.data || {};
  ok(pv.ok && D.apDung === false && snap() === truoc, 'A2: xem trước KHÔNG ghi gì (NhatKy, log không đổi)', pv.err);
  const idDoi = (D.doiNhom || []).map(x => x.id).sort().join(), idHuy = (D.huyTrung || []).map(x => x.id).sort().join();
  ok(idDoi === 'CH10,CH12' && idHuy === 'CH11,CH19', 'A2: đề xuất đổi CH10,CH12; hủy trùng CH11 (giống CH10) và CH19 (giống dòng nhóm CH18)', { idDoi, idHuy });
  ok(D.xungDot.length === 1 && D.xungDot[0].hop === 'CH-3' && D.xungDot[0].dong.length === 2, 'A2: CH-3 khác số liệu → liệt kê xung đột, không tự quyết', D.xungDot);
  ok(D.boQua === 1 && !(D.doiNhom.concat(D.huyTrung).some(x => ['CH15', 'CH16', 'CH17', 'CH20', 'CH13', 'CH14'].indexOf(x.id) >= 0)), 'A2: người chưa có nhóm giữ cá nhân; THỬ NGHIỆM, bản hủy, khâu TRA, dòng xung đột không bị đề xuất sửa', D);
  const x10 = D.doiNhom.find(x => x.id === 'CH10');
  ok(x10 && x10.nhomMoi === '1' && /Nhân viên A \+ Nhân viên B/.test(x10.tvMoi) && x10.tvCu === 'Nhân viên A' && x10.ly && x10.buoc === 'SCAN' && x10.hop === 'CH-1', 'A2: bảng xem trước có đủ giờ, khâu, hộp, người, cũ → mới, lý do', x10);
  // áp dụng: cần xác nhận
  const r0 = api(tAdmin, 'chuanHoaNhom', { ngay: NG, ca: CAX, apDung: true });
  ok(!r0.ok && /NHOM/.test(r0.err) && snap() === truoc, 'A2: áp dụng thiếu chữ NHOM bị từ chối, không ghi gì', r0);
  const sl0 = (sh('SaoLuuXoa') || { rows: [] }).rows.length, lg0 = sh('LogHeThong').rows.length;
  const ap = api(tAdmin, 'chuanHoaNhom', { ngay: NG, ca: CAX, apDung: true, xacNhan: 'NHOM' });
  ok(ap.ok && ap.data.daSua.doi === 2 && ap.data.daSua.huy === 2 && ap.data.saoLuu === 'SaoLuuXoa', 'A2: áp dụng: đổi 2, hủy 2, có sao lưu', ap);
  ok(nhom('CH10') === '1' && nhom('CH12') === '1' && sh('NhatKy').rows.find(x => x[0] === 'CH10')[18] === 'A1,B1', 'A2: dòng được đổi có Nhom = 1 và ThanhVien = cả nhóm');
  ok(sh('NhatKy').rows.find(x => x[0] === 'CH11')[16] === true && sh('NhatKy').rows.find(x => x[0] === 'CH19')[16] === true && /^ADMIN /.test(sh('NhatKy').rows.find(x => x[0] === 'CH11')[17]), 'A2: dòng trùng bị hủy mềm (Huy = TRUE, NguoiHuy ghi người + giờ)');
  ok(nhom('CH13') === '' && nhom('CH14') === '' && nhom('CH15') === '' && sh('NhatKy').rows.find(x => x[0] === 'CH13')[16] === false, 'A2: xung đột và người chưa có nhóm KHÔNG bị đụng');
  ok(sh('SaoLuuXoa').rows.length - sl0 === 4 && sh('SaoLuuXoa').rows.slice(sl0).every(x => x[1] === 'NhatKy' && /"CH1[0129]"/.test(x[3])), 'A2: sao lưu đúng 4 dòng cũ vào SaoLuuXoa (JSON dòng gốc)');
  const lgM = sh('LogHeThong').rows.slice(lg0).map(x => x[4] + ':' + x[6]);
  ok(lgM.filter(x => /^CHUAN_HOA_NHOM:/.test(x)).length === 2 && lgM.filter(x => /^CHUAN_HOA_NHOM_HUY:/.test(x)).length === 2 && lgM.some(x => /^CHUAN_HOA_NHOM_TONG:/.test(x)) && lgM.filter(x => /^CHUAN_HOA_NHOM:.*cũ: .*mới: /.test(x)).length === 2, 'A2: log từng dòng cũ → mới + 1 dòng tổng', lgM);
  ok(kTruoc - kPhan() === 80, 'A2: Dashboard ngày giảm đúng phần trùng bị hủy (50 + 30 = 80), không đổi gì khác', [kTruoc, kPhan()]);
  const ap2 = api(tAdmin, 'chuanHoaNhom', { ngay: NG, ca: CAX, apDung: true, xacNhan: 'NHOM' });
  ok(ap2.ok && ap2.data.daSua.doi === 0 && ap2.data.daSua.huy === 0 && ap2.data.xungDot.length === 1, 'A2: chạy lại không còn gì để đổi (idempotent), xung đột vẫn được nhắc', ap2.data);
  // dọn
  sh('NhatKy').rows.length = nk0; sh('PhanNhom').rows.length = pn0; ctx.memoClear_();
}


console.log('\nTỔNG: ' + pass + ' đạt, ' + fail + ' lỗi');
process.exit(fail ? 1 : 0);
