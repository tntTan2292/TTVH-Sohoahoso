// Kiểm tra giao diện KHÔNG bị mất chức năng:  node tools/kiem_tra_giao_dien.js
// Đối chiếu docs/CHUC_NANG.md + docs/API.md với apps-script/Index.html và Code.gs:
//  1. mọi #id trong cột "Giao diện" của CHUC_NANG.md còn trong Index.html
//  2. mọi hàm/biến trong cột "Giao diện" còn trong Index.html; hàm trong cột "Backend" còn trong Code.gs
//  3. mọi action trong API.md có trong route_ (Code.gs); mọi call('x') của Index.html có trong route_
//  4. cú pháp khối <script> của Index.html và Code.gs
//  5. không có id trùng trong phần HTML tĩnh
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(root, f), 'utf8').split(String.fromCharCode(13)).join('');   // bỏ CR: checkout Windows (core.autocrlf=true) là CRLF
const html = rd('apps-script/Index.html'), gs = rd('apps-script/Code.gs');
const cn = rd('docs/CHUC_NANG.md'), api = rd('docs/API.md');
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('FAIL', msg); } };

// ---- cú pháp ----
const scripts = []; html.replace(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g, (m, s) => { scripts.push(s); return m; });
ok(scripts.length >= 1, 'Index.html có khối <script>');
scripts.forEach((s, i) => { try { new vm.Script(s); pass++; } catch (e) { ok(false, 'cú pháp <script> #' + i + ': ' + e.message); } });
try { new vm.Script(gs); pass++; } catch (e) { ok(false, 'cú pháp Code.gs: ' + e.message); }
const js = scripts.join('\n');

// ---- id tĩnh trùng nhau ----
const staticHtml = html.replace(/<script[\s\S]*?<\/script>/g, '');
const ids = {}; staticHtml.replace(/\bid="([^"]+)"/g, (m, x) => { ids[x] = (ids[x] || 0) + 1; return m; });
Object.keys(ids).forEach(k => ok(ids[k] === 1, 'id tĩnh bị trùng trong HTML: ' + k));


// ---- T1: danh sách action ĐỌC của giao diện (READ_ACT) phải khớp READ_ACTIONS của máy chủ ----
{ const a = (gs.match(/const READ_ACTIONS = \[([^\]]*)\]/) || [])[1], b = (html.match(/var READ_ACT = \[([^\]]*)\]/) || [])[1];
  const norm = x => (x || '').replace(/['\s]/g, '').split(',').sort().join();
  ok(a && b && norm(a) === norm(b), 'READ_ACT (Index.html) khớp READ_ACTIONS (Code.gs)'); }
// ---- đọc bảng CHUC_NANG.md ----
const hasId = id => new RegExp('id=\\\\?["\']' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\\\?["\']').test(html);
const hasJs = n => new RegExp('function\\s+' + n + '\\s*\\(|(var|let|const)\\s+' + n + '\\b|\\b' + n + '\\s*[:=]').test(js);
const hasGs = n => new RegExp('function\\s+' + n + '\\s*\\(|(const|let|var)\\s+' + n + '\\b').test(gs);
let cols = null, nId = 0, nJs = 0, nGs = 0;
cn.split(/\r?\n/).forEach(line => {
  if (!/^\|/.test(line)) { cols = null; return; }
  const cells = line.split('|').slice(1, -1).map(x => x.trim());
  if (cells.some(c => /^Giao diện$/.test(c) || /^Backend/.test(c))) { cols = cells; return; }
  if (!cols || /^[-: ]+$/.test(cells[0])) return;
  cols.forEach((h, i) => {
    const kind = /^Giao diện$/.test(h) ? 'ui' : (/^Backend/.test(h) ? 'gs' : '');
    if (!kind || cells[i] === undefined) return;
    (cells[i].match(/`[^`]+`/g) || []).forEach(t => {
      t = t.slice(1, -1).trim();
      const mId = t.match(/^#([A-Za-z][\w]*)$/);
      if (kind === 'ui' && mId) { nId++; ok(hasId(mId[1]), cells[0] + ': thiếu id #' + mId[1] + ' trong Index.html'); return; }
      const mFn = t.match(/^([A-Za-z_][\w]*)(\(|$)/);
      if (!mFn || /^(true|false|null)$/.test(mFn[1])) return;
      const n = mFn[1];
      if (kind === 'ui') { if (/^(call|api)$/.test(n)) return; if (/^[a-z][a-z0-9]*$/.test(n) && !/[A-Z]/.test(n) && !/\(/.test(t)) return; nJs++; ok(hasJs(n) || hasGs(n), cells[0] + ': thiếu hàm/biến giao diện ' + n); }
      else if (!/^(ghi|dash|me)_$/.test(n) || true) { if (/^[a-z]+$/.test(n)) return; if (/^[A-Z]+$/.test(n)) { ok(gs.indexOf("'" + n + "'") >= 0, cells[0] + ': thiếu giá trị ' + n + ' trong Code.gs'); return; } nGs++; ok(hasGs(n) || /[a-z]+_?$/.test(n) && gs.indexOf(n) >= 0, cells[0] + ': thiếu ' + n + ' trong Code.gs'); }
    });
  });
});

// ---- action: API.md ↔ route_ ↔ call(...) ----
const route = (gs.match(/function route_[\s\S]*?\n}\n/) || [''])[0];
const cases = {}; route.replace(/case '(\w+)'/g, (m, a) => { cases[a] = 1; return m; });
const actions = []; api.split(/\r?\n/).forEach(l => { const m = l.match(/^\|\s*`(\w+)`\s*\|/); if (m) actions.push(m[1]); });
actions.forEach(a => { if (a === 'login' || a === 'dsLogin') return; ok(cases[a], 'API.md có action `' + a + '` nhưng route_ không có'); });
const calls = {}; js.replace(/\bcall\('(\w+)'/g, (m, a) => { calls[a] = 1; return m; });
Object.keys(calls).forEach(a => ok(cases[a], "Index.html gọi call('" + a + "') nhưng route_ không có"));
['ghi', 'hopGoiY', 'nhatKy', 'dashboard', 'me', 'vaoCa', 'lichSu'].forEach(a => ok(calls[a], "Index.html không còn gọi call('" + a + "')"));

// ---- XN1 (mục 28): hộp xác nhận tự vẽ thay confirm/prompt ----
ok(!/\b(confirm|prompt)\(/.test(js), 'XN1: Index.html không còn confirm( / prompt( gốc của trình duyệt');
['MAHRM', 'DAUKY', 'NHOM', 'DONVI', 'IMPORT', 'XOA'].forEach(k => ok(new RegExp("hoiXacNhan\\([\\s\\S]{0,500}?'" + k + "'\\)").test(js), 'XN1: còn từ khóa xác nhận ' + k + ' trong hoiXacNhan(...)'));
ok(/hoiXacNhan\([^;]*String\(x\.ma\)/.test(js), 'XN1: xóa tài khoản dùng chính Mã HRM làm từ khóa');
ok((js.match(/hoiXacNhan\(/g) || []).length >= 18, 'XN1: hoiXacNhan được gọi ở đủ 18 chỗ thay confirm/prompt (hiện ' + (js.match(/hoiXacNhan\(/g) || []).length + ')');
ok(hasId('modalXN') && hasId('xnTieuDe') && hasId('xnNoiDung') && hasId('xnNhap') && hasId('xnDongY') && hasId('xnHuy') && hasId('xnKhoaBox'), 'XN1: khối #modalXN đủ id');
ok(/id="modalXN" class="modal-overlay hide"/.test(html) && html.indexOf('id="modalXN"') > html.indexOf('id="modalCT"') && /#modalXN \{ z-index: 1100; \}/.test(html), 'XN1: #modalXN dùng .modal-overlay, nằm sau và trên #modalCT');
// trích hàm từ Index.html để chạy trên DOM giả
const trich = n => { const i = js.indexOf('function ' + n + '('); if (i < 0) return ''; let d = 0; for (let k = js.indexOf('{', i); k < js.length; k++) { if (js[k] === '{') d++; else if (js[k] === '}') { d--; if (!d) return js.slice(i, k + 1); } } return ''; };
const mkEl = () => { const cls = new Set(['hide']); return { value: '', disabled: false, textContent: '', innerHTML: '', onclick: null, oninput: null, dataset: {}, style: {}, focus() { }, classList: { add: c => cls.add(c), remove: c => cls.delete(c), contains: c => cls.has(c), toggle(c, f) { if (f) cls.add(c); else cls.delete(c); } } }; };
const taoMoi = (extra) => {
  const els = {}, listeners = [], calls = [];
  const sb = Object.assign({ Promise, String, setTimeout, console, XN_DANG: null }, {
    $: id => els[id] || (els[id] = mkEl()),
    document: { addEventListener: (t, f) => { if (t === 'keydown') listeners.push(f); }, removeEventListener: (t, f) => { const i = listeners.indexOf(f); if (i >= 0) listeners.splice(i, 1); } },
    call: (a, p) => { calls.push([a, p]); return Promise.resolve({ daSua: 0, xungDot: [], doi: [], saoLuu: '' }); },
    msg() { }, loadNS() { }, veMaXem() { }, esc: x => String(x)
  }, extra || {});
  vm.createContext(sb);
  vm.runInContext('var XN_DANG = null;\n' + ['hoiXacNhan', 'maCall', 'maChay'].map(trich).join('\n'), sb);
  const phim = (key, target) => { const e = { key, target: target || null, preventDefault() { } }; listeners.slice().forEach(f => f(e)); };
  return { sb, els, calls, listeners, phim, moXN: () => !!els.modalXN && !els.modalXN.classList.contains('hide') };
};
const chay = async () => {
  const cho = () => new Promise(r => setTimeout(r, 0));
  // 1) có từ khóa: nút tắt tới khi khớp (bỏ khoảng trắng hai đầu), resolve đúng chuỗi, bấm đúp một lần
  { const T = taoMoi(); let n = 0, kq;
    const pr = T.sb.hoiXacNhan('Tiêu đề', 'Nội dung <b>x</b>', 'MAHRM'); pr.then(v => { n++; kq = v; });
    ok(T.moXN() && T.els.xnDongY.disabled === true && T.els.xnNoiDung.textContent === 'Nội dung <b>x</b>' && T.els.xnNoiDung.innerHTML === '', 'XN1: mở hộp, nút Đồng ý tắt khi có từ khóa; nội dung gán bằng textContent (không qua innerHTML)');
    T.els.xnNhap.value = 'MAHR'; T.els.xnNhap.oninput(); ok(T.els.xnDongY.disabled === true, 'XN1: gõ sai/thiếu từ khóa → nút vẫn tắt');
    T.phim('Enter', T.els.xnNhap); await cho(); ok(n === 0 && T.moXN(), 'XN1: Enter khi nút tắt không có tác dụng');
    T.els.xnNhap.value = '  MAHRM '; T.els.xnNhap.oninput(); ok(T.els.xnDongY.disabled === false, 'XN1: đúng từ khóa (bỏ khoảng trắng hai đầu) → nút bật');
    T.els.xnDongY.onclick(); T.els.xnDongY.onclick && T.els.xnDongY.onclick(); T.phim('Enter'); await cho();
    ok(n === 1 && kq === 'MAHRM' && !T.moXN() && T.listeners.length === 0, 'XN1: Đồng ý trả đúng chuỗi từ khóa, bấm đúp/Enter thêm vẫn chỉ resolve một lần, hộp đóng, bỏ lắng nghe phím'); }
  // 2) không từ khóa → true; Hủy, Esc → null; bấm ra nền không đóng; gọi thêm khi đang mở → null
  { const T = taoMoi(); const a = T.sb.hoiXacNhan('T', 'N'); ok(T.els.xnDongY.disabled === false && T.els.xnKhoaBox.classList.contains('hide'), 'XN1: không từ khóa → nút bật, ô nhập ẩn');
    const b = await T.sb.hoiXacNhan('T2', 'N2'); ok(b === null && T.moXN(), 'XN1: đang mở mà gọi thêm → resolve null ngay, hộp đầu vẫn mở');
    ok(!T.els.modalXN.onclick, 'XN1: không gắn xử lý bấm nền (bấm ra nền không đóng)');
    T.els.xnDongY.onclick(); ok(await a === true, 'XN1: Đồng ý không từ khóa → true'); }
  { const T = taoMoi(); const a = T.sb.hoiXacNhan('T', 'N', 'XOA'); T.els.xnHuy.onclick(); ok(await a === null && !T.moXN(), 'XN1: Hủy → null'); }
  { const T = taoMoi(); const a = T.sb.hoiXacNhan('T', 'N', 'XOA'); T.phim('Escape'); ok(await a === null && !T.moXN(), 'XN1: Esc → null'); }
  { const T = taoMoi(); const a = T.sb.hoiXacNhan('T', 'N'); T.phim('Enter', T.els.xnHuy); await cho(); ok(T.moXN(), 'XN1: Enter khi tiêu điểm ở nút Hủy không tự đồng ý'); T.phim('Enter'); ok(await a === true, 'XN1: Enter khi nút Đồng ý bật → đồng ý'); }
  // 3) hai hộp liên tiếp (luồng XÓA theo ngày): hộp đầu đóng hẳn rồi mới mở hộp sau
  { const T = taoMoi(); let hopHai = null;
    const luong = T.sb.hoiXacNhan('Hộp 1', 'N1', 'XOA').then(t => { const daDong = !T.moXN() && T.sb.XN_DANG === null; return T.sb.hoiXacNhan('Hộp 2', 'N2').then(c => { hopHai = [t, daDong, c]; }); });
    T.els.xnNhap.value = 'XOA'; T.els.xnNhap.oninput(); T.els.xnDongY.onclick(); await cho(); await cho();
    ok(T.moXN() && T.els.xnTieuDe.textContent === 'Hộp 2' && T.els.xnDongY.disabled === false, 'XN1: hộp thứ hai mở được ngay sau khi hộp thứ nhất đóng');
    T.els.xnHuy.onclick(); await luong; ok(hopHai && hopHai[0] === 'XOA' && hopHai[1] === true && hopHai[2] === null, 'XN1: hai hộp liên tiếp: hộp 1 trả đúng từ khóa, đã đóng trước khi mở hộp 2; Hủy hộp 2 → null (giữ danh sách vào ca)', hopHai); }
  // 4) luồng thật maCall (Khôi phục Mã HRM): xem trước không hỏi; Hủy không gọi máy chủ; đúng từ khóa gọi đúng xacNhan
  { const T = taoMoi(); T.sb.maCall(false); await cho();
    ok(!T.moXN() && T.calls.length === 1 && T.calls[0][0] === 'chuanHoaMaHRM' && T.calls[0][1].apDung === false && T.calls[0][1].xacNhan === undefined, 'XN1: Xem trước (apDung=false) chạy như cũ, không hỏi, không gửi xacNhan', T.calls); }
  { const T = taoMoi(); T.sb.maCall(true); ok(T.moXN(), 'XN1: Áp dụng mở hộp xác nhận'); T.els.xnHuy.onclick(); await cho(); await cho(); ok(T.calls.length === 0, 'XN1: Hủy → KHÔNG gọi máy chủ'); }
  { const T = taoMoi(); T.sb.maCall(true); T.els.xnNhap.value = 'MAHRM'; T.els.xnNhap.oninput(); T.els.xnDongY.onclick(); await cho(); await cho();
    ok(T.calls.length === 1 && T.calls[0][1].apDung === true && T.calls[0][1].xacNhan === 'MAHRM', 'XN1: đúng từ khóa → call nhận đúng xacNhan = MAHRM, gọi đúng một lần', T.calls); }
  // ---- LOC1 (mục 31): tab Nhân sự luôn có ô từ ngày – đến ngày, tính theo ngày đang xem ----
  {
    const els = {}, ds = [], msgs = [];
    const sb = { console, Date, String, Promise, esc: x => String(x), dashNsBang() { sb.bang = (sb.bang || 0) + 1; }, msg: (id, t) => { msgs.push([id, t]); },
      $: id => els[id] || (els[id] = Object.assign(mkEl(), { checked: false })),
      call: (a, p) => new Promise((res, rej) => { ds.push({ a, p, res, rej }); }),
      ME: { ngay: '2026-11-10', user: { vaiTro: 'TOTRUONG' } }, DASH: { d: { khoangNgay: { tu: '2026-11-02' } }, tab: 'nhansu', ns: { k: 'homnay', tu: '', den: '', data: null } } };
    vm.createContext(sb);
    vm.runInContext(['nsNgayXem', 'nsKhoangTinh', 'nsChonKhoang', 'nsSuaTay', 'dashTabNhanSu', 'dashNsTai'].map(trich).join('\n'), sb);
    const ngayXem = v => { sb.$('dNgay').value = v; };
    const ve = () => { const h = sb.$('dBody').innerHTML; return { sel: (h.match(/<option value="([^"]+)" selected>/) || [])[1], tu: (h.match(/id="nsTu"[^>]*value="([^"]*)"/) || [])[1], den: (h.match(/id="nsDen"[^>]*value="([^"]*)"/) || [])[1], hienTuyChon: !/id="nsTuyChon" class="[^"]*hide/.test(h), nhan: /<option value="homnay"[^>]*>Ngày đang xem</.test(h) }; };
    const k = () => JSON.stringify(sb.nsKhoangTinh());
    const dat = (kk, nx) => { sb.DASH.ns.k = kk; ngayXem(nx); sb.DASH.ns.data = null; sb.dashTabNhanSu(); return ve(); };
    // 1) bốn lựa chọn với ngày xem 08/11
    let v = dat('homnay', '2026-11-08'); ok(v.sel === 'homnay' && v.tu === '2026-11-08' && v.den === '2026-11-08' && v.nhan && v.hienTuyChon, 'LOC1: "Ngày đang xem" 08/11 → từ = đến = 08/11; hai ô luôn hiện; nhãn đổi chữ', v);
    v = dat('7', '2026-11-08'); ok(v.tu === '2026-11-02' && v.den === '2026-11-08', 'LOC1: 7 ngày gần nhất kết thúc ở ngày xem 08/11 (02/11 → 08/11)', v);
    v = dat('thang', '2026-11-08'); ok(v.tu === '2026-11-01' && v.den === '2026-11-08', 'LOC1: Tháng này = đầu tháng của ngày xem → ngày xem', v);
    v = dat('dau', '2026-11-08'); ok(v.tu === '2026-11-02' && v.den === '2026-11-08', 'LOC1: Từ đầu dự án = ngày đầu có dữ liệu → ngày xem', v);
    // 2) ngày xem là hôm nay → giống bản hiện tại
    ok(dat('homnay', '2026-11-10').tu === '2026-11-10' && dat('7', '2026-11-10').tu === '2026-11-04' && dat('thang', '2026-11-10').tu === '2026-11-01' && dat('dau', '2026-11-10').den === '2026-11-10', 'LOC1: ngày xem là hôm nay → cùng kết quả bản cũ (hôm nay / 7 ngày / tháng / đầu dự án)');
    ngayXem(''); sb.DASH.ns.k = 'homnay'; ok(k() === '{"tu":"2026-11-10","den":"2026-11-10"}', 'LOC1: ô ngày xem trống → dùng hôm nay');
    // 3) đổi ngày xem: lựa chọn nhanh tự tính lại và tải lại số (loadDash → dashTabNhanSu → dashNsTai)
    ds.length = 0; dat('7', '2026-11-10'); ds.length = 0; ngayXem('2026-11-08'); sb.DASH.ns.data = null; sb.dashTabNhanSu();
    ok(ds.length === 1 && ds[0].a === 'thongKeNhanSu' && ds[0].p.tu === '2026-11-02' && ds[0].p.den === '2026-11-08', 'LOC1: đổi ngày xem sang 08/11 khi đang ở "7 ngày" → tải lại với 02/11–08/11', ds.map(x => x.p));
    // 4) đang Tùy chọn: đổi ngày xem không mất khoảng đã chọn
    sb.DASH.ns.k = 'tuychon'; sb.DASH.ns.tu = '2026-11-03'; sb.DASH.ns.den = '2026-11-05'; ds.length = 0; ngayXem('2026-11-09'); sb.DASH.ns.data = null; sb.dashTabNhanSu();
    v = ve(); ok(v.sel === 'tuychon' && v.tu === '2026-11-03' && v.den === '2026-11-05' && ds[0].p.tu === '2026-11-03' && ds[0].p.den === '2026-11-05', 'LOC1: đang "Tùy chọn", đổi ngày xem → hai ô và số gửi lên giữ nguyên khoảng đã chọn', [v, ds.map(x => x.p)]);
    // 5) sửa tay một ô → chuyển Tùy chọn và tải số
    dat('7', '2026-11-08'); ds.length = 0; sb.$('nsTu').value = '2026-11-04'; sb.$('nsDen').value = '2026-11-08'; sb.$('nsTu').onchange();
    ok(sb.DASH.ns.k === 'tuychon' && sb.DASH.ns.tu === '2026-11-04' && sb.$('nsKhoang').value === 'tuychon' && ds.length === 1 && ds[0].p.tu === '2026-11-04' && ds[0].p.den === '2026-11-08', 'LOC1: sửa tay ô Từ ngày → tự chuyển "Tùy chọn" và tải số', [sb.DASH.ns.k, ds.map(x => x.p)]);
    // 6) Từ > Đến: báo lỗi tại chỗ, không tải, không xóa bảng, giữ khoảng cũ
    const truoc = JSON.stringify([sb.DASH.ns.k, sb.DASH.ns.tu, sb.DASH.ns.den]); sb.DASH.ns.data = { nguoi: [{ ma: 'x' }] }; ds.length = 0; msgs.length = 0;
    sb.$('nsTu').value = '2026-11-09'; sb.$('nsDen').value = '2026-11-05'; sb.$('nsTu').onchange();
    ok(ds.length === 0 && msgs.some(m => m[0] === 'nsLoi' && /trước hoặc bằng/.test(m[1])) && sb.DASH.ns.data && sb.DASH.ns.data.nguoi.length === 1 && JSON.stringify([sb.DASH.ns.k, sb.DASH.ns.tu, sb.DASH.ns.den]) === truoc, 'LOC1: Từ ngày sau Đến ngày → báo lỗi tại chỗ (#nsLoi), không gọi máy chủ, không xóa bảng, giữ khoảng cũ', msgs);
    ds.length = 0; sb.$('nsTu').value = ''; sb.$('nsTu').onchange(); ok(ds.length === 0 && sb.DASH.ns.data, 'LOC1: xóa trống một ô → báo lỗi, không tải');
    // 7) kết quả cũ về muộn không đè kết quả mới
    dat('tuychon', '2026-11-10'); sb.DASH.ns.tu = '2026-11-01'; sb.DASH.ns.den = '2026-11-02'; sb.DASH.ns.data = null; ds.length = 0; sb.bang = 0;
    sb.dashNsTai(); sb.DASH.ns.tu = '2026-11-03'; sb.DASH.ns.den = '2026-11-04'; sb.dashNsTai();
    ds[1].res({ tag: 'moi' }); await cho(); ds[0].res({ tag: 'cu' }); await cho();
    ok(sb.DASH.ns.data && sb.DASH.ns.data.tag === 'moi' && sb.bang === 1, 'LOC1: kết quả của lần tải cũ về muộn không đè kết quả mới', [sb.DASH.ns.data, sb.bang]);
    // 8) đổi ngày xem trong lúc chờ: kết quả cũ bị bỏ
    dat('7', '2026-11-10'); sb.DASH.ns.data = null; ds.length = 0; sb.bang = 0; sb.dashNsTai(); ngayXem('2026-11-08'); ds[0].res({ tag: 'cu' }); await cho();
    ok(sb.DASH.ns.data === null && sb.bang === 0, 'LOC1: đổi ngày xem trong lúc chờ → kết quả theo ngày cũ bị bỏ');
    ok(/function nsChonKhoang|function nsSuaTay|function nsNgayXem/.test(js) && hasId('nsKhoang') && hasId('nsTuyChon') && hasId('nsTu') && hasId('nsDen') && hasJs('nsKhoangTinh') && hasJs('dashTabNhanSu'), 'LOC1: giữ #nsKhoang, #nsTuyChon, #nsTu, #nsDen, nsKhoangTinh, dashTabNhanSu');
  }
};

console.log('Kiểm tra giao diện: ' + nId + ' id, ' + nJs + ' hàm giao diện, ' + nGs + ' hàm máy chủ, ' + Object.keys(calls).length + ' call()');
chay().then(() => {
  console.log('TỔNG: ' + pass + ' đạt, ' + fail + ' lỗi');
  process.exit(fail ? 1 : 0);
});
