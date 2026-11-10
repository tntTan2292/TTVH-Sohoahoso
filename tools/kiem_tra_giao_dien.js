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

console.log('Kiểm tra giao diện: ' + nId + ' id, ' + nJs + ' hàm giao diện, ' + nGs + ' hàm máy chủ, ' + Object.keys(calls).length + ' call()');
console.log('TỔNG: ' + pass + ' đạt, ' + fail + ' lỗi');
process.exit(fail ? 1 : 0);
