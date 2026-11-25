#!/usr/bin/env node
// Kiểm tra trước khi vận hành MdFlex trên máy thật.
//   node van-hanh/kiem-tra.js          kiểm tra tĩnh + chạy thử cả hai app trên bản sao tạm
//   node van-hanh/kiem-tra.js --nhanh  chỉ kiểm tra tĩnh (dùng khi khởi động hằng ngày)
// Chạy thử luôn diễn ra trên bản sao trong thư mục tạm, không đụng data/ thật,
// và gỡ khoá API khỏi môi trường của bản thử nên không gọi dịch vụ ngoài, không tốn tiền.
// Mã thoát: 0 = đạt (có thể kèm cảnh báo), 1 = có lỗi phải sửa trước khi chạy.

'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const { spawn, execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const APPS = {
  ceo: { ten: 'Khung chat Phiếu yêu cầu', dir: path.join(REPO, 'apps', 'ceo-intake'), port: 3100 },
  m3d: { ten: 'Mô hình 3D', dir: path.join(REPO, 'apps', 'mo-hinh-3d'), port: 3200 }
};
const NHANH = process.argv.includes('--nhanh');

let soLoi = 0, soCanhBao = 0;
const dat = (s) => console.log('  ✔ ' + s);
const canhBao = (s) => { soCanhBao++; console.log('  ⚠ ' + s); };
const loi = (s) => { soLoi++; console.log('  ✘ ' + s); };
const muc = (s) => console.log('\n' + s);

const docJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
function thuDocJson(file, nhan) {
  try { return docJson(file); } catch (e) { loi(`${nhan}: không đọc được JSON (${e.message})`); return null; }
}
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ---------- 1. Môi trường ----------
function kiemMoiTruong() {
  muc('1. Môi trường');
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 18) dat(`Node.js ${process.versions.node}`);
  else loi(`Node.js ${process.versions.node} quá cũ — cần bản 18 trở lên`);

  // Chỉ báo có hay không, không bao giờ in khoá
  if (process.env.ANTHROPIC_API_KEY) dat('Có ANTHROPIC_API_KEY (Claude đọc câu tự do, chuyên viên AI làm phiếu)');
  else canhBao('Chưa có ANTHROPIC_API_KEY — app vẫn chạy theo quy tắc; có thể gắn khoá tạm ở trang /giao-viec.html');
  if (process.env.PERPLEXITY_API_KEY) dat('Có PERPLEXITY_API_KEY (tab Thiết kế AI)');
  else canhBao('Chưa có PERPLEXITY_API_KEY — tab Thiết kế AI sẽ báo chưa kết nối');
  if (process.env.PORT) canhBao(`Biến PORT=${process.env.PORT} đang đặt chung — cả hai app sẽ cùng nhận cổng này và đụng nhau. Gỡ PORT trước khi chạy start-all`);
}

// ---------- 2. Cấu hình ----------
function tepCoCau(base) {
  const org = (process.env.ORG || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const f = path.join(APPS.ceo.dir, 'config', org ? `${base}.${org}.json` : `${base}.json`);
  return fs.existsSync(f) ? f : path.join(APPS.ceo.dir, 'config', `${base}.json`);
}

function kiemCauHinhCeo() {
  muc('2a. Cấu hình Khung chat (apps/ceo-intake/config)');
  const fDv = tepCoCau('don-vi'), fNv = tepCoCau('danh-muc-nghiep-vu');
  const dvJ = thuDocJson(fDv, path.basename(fDv));
  const lvJ = thuDocJson(path.join(APPS.ceo.dir, 'config', 'loai-viec.json'), 'loai-viec.json');
  const nvJ = thuDocJson(fNv, path.basename(fNv));
  if (!dvJ || !lvJ || !nvJ) return;

  const donVi = dvJ.donVi || [];
  const ma = new Set();
  for (const d of donVi) {
    if (!d.ma || !d.ten) loi(`${path.basename(fDv)}: có đơn vị thiếu "ma" hoặc "ten"`);
    if (ma.has(d.ma)) loi(`${path.basename(fDv)}: trùng mã đơn vị ${d.ma}`);
    ma.add(d.ma);
  }
  const goc = donVi.filter((d) => !d.thuoc);
  if (goc.length !== 1) loi(`${path.basename(fDv)}: cần đúng 1 đơn vị gốc (thuoc = null), đang có ${goc.length}`);
  for (const d of donVi) if (d.thuoc && !ma.has(d.thuoc)) loi(`${path.basename(fDv)}: ${d.ma} thuộc mã ${d.thuoc} không tồn tại`);
  const chuaGan = donVi.filter((d) => !d.quanLy && !d.ngungHoatDong).length;
  dat(`${path.basename(fDv)}: ${donVi.length} đơn vị, gốc "${goc[0] ? goc[0].ten : '?'}"`);
  if (chuaGan) canhBao(`${chuaGan} đơn vị chưa gán người quản lý (quanLy trống)`);

  const lv = lvJ.loaiViec || [];
  const thieuLv = 'ABCDEFGHIJK'.split('').filter((c) => !lv.some((x) => x.ma === c));
  if (thieuLv.length) loi(`loai-viec.json: thiếu loại ${thieuLv.join(', ')}`);
  const chuaKhai = lv.filter((x) => /chưa khai báo/i.test(x.ten || '')).length;
  if (chuaKhai) canhBao(`loai-viec.json: ${chuaKhai}/11 loại việc vẫn là chỗ trống "chưa khai báo" (chờ mục 3 của quy định)`);
  else dat('loai-viec.json: đủ 11 loại A–K');

  const nv = nvJ.nghiepVu || [];
  for (const n of nv) {
    if (!ma.has(n.donViChuTri)) loi(`${path.basename(fNv)}: ${n.ma} chủ trì bởi mã ${n.donViChuTri} không có trong ${path.basename(fDv)}`);
    for (const p of n.phoiHop || []) if (!ma.has(p)) loi(`${path.basename(fNv)}: ${n.ma} phối hợp với mã ${p} không có trong ${path.basename(fDv)}`);
  }
  const viDu = nv.filter((n) => n.viDu).length;
  dat(`${path.basename(fNv)}: ${nv.length} nghiệp vụ, mã đơn vị khớp cơ cấu`);
  if (viDu) canhBao(`${viDu}/${nv.length} nghiệp vụ còn đánh dấu ví dụ (viDu: true) — cần CEO chốt đơn vị chủ trì`);
}

function kiemCauHinh3d() {
  muc('2b. Cấu hình Mô hình 3D (apps/mo-hinh-3d/config)');
  const dir = path.join(APPS.m3d.dir, 'config');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) thuDocJson(path.join(dir, f), f);
  const phong = fs.existsSync(path.join(dir, 'phong.json')) ? thuDocJson(path.join(dir, 'phong.json'), 'phong.json') : null;
  if (!phong) { loi('Thiếu config/phong.json'); return; }
  const ds = phong.phong || [];
  if (!ds.length) loi('phong.json: không có phòng nào');
  else dat(`phong.json: ${ds.length} phòng (${ds.map((p) => p.id).join(', ')})`);
  if (!Array.isArray(phong.cong_ceo) || !phong.cong_ceo.length) loi('phong.json: thiếu danh sách cổng CEO (cong_ceo)');
  for (const k of ['P1_gio', 'P2_gio', 'P3_gio']) if (!(phong.sla && phong.sla[k] > 0)) loi(`phong.json: thiếu SLA ${k}`);
  if (!fs.existsSync(path.join(dir, 'thuong-hieu.json'))) loi('Thiếu config/thuong-hieu.json (bộ nhận diện)');

  // Cơ cấu theo biến CO_CAU: MdFlex (để trống) dùng config/phong.json; khác thì config/co-cau/<tên>/phong.json
  const coCau = (process.env.CO_CAU || '').trim().toLowerCase();
  const dsCoCau = fs.existsSync(path.join(dir, 'co-cau')) ? fs.readdirSync(path.join(dir, 'co-cau')).filter((n) => fs.existsSync(path.join(dir, 'co-cau', n, 'phong.json'))) : [];
  if (coCau && coCau !== 'mdflex' && !dsCoCau.includes(coCau)) loi(`CO_CAU=${coCau} nhưng không có config/co-cau/${coCau}/phong.json (có sẵn: ${dsCoCau.join(', ') || 'không'})`);
  else dat(`Cơ cấu đang dùng: ${coCau && coCau !== 'mdflex' ? coCau + ' (CO_CAU)' : 'MdFlex (CO_CAU để trống)'}`);
  for (const n of dsCoCau) {
    const c = thuDocJson(path.join(dir, 'co-cau', n, 'phong.json'), `co-cau/${n}/phong.json`);
    if (!c) continue;
    const p = c.phong || [];
    const ma = [...(c.vi_tri_chung || []).map((v) => v.ma), ...p.flatMap((x) => [x.truong_phong && x.truong_phong.ai && x.truong_phong.ai.ma, ...(x.to || []).flatMap((t) => (t.ai || []).map((a) => a.ma))])];
    const trung = ma.filter((m, i) => ma.indexOf(m) !== i);
    if (trung.length) loi(`co-cau/${n}: trùng mã vị trí ${[...new Set(trung)].join(', ')}`);
    for (const x of p) {
      if (!/^[a-z0-9-]+$/.test(x.id || '')) loi(`co-cau/${n}: mã phòng "${x.id}" chỉ được dùng chữ thường không dấu, số, gạch ngang`);
      if (!(x.to || []).some((t) => (t.ai || []).length)) loi(`co-cau/${n}: phòng ${x.id} không có chuyên viên AI nào — Trưởng phòng sẽ không chia được việc`);
    }
    const tang = p.map((x) => x.tang).filter(Boolean);
    if (tang.length !== new Set(tang).size) loi(`co-cau/${n}: hai phòng cùng gắn một tầng`);
    if (!Array.isArray(c.moc) || !c.moc.length || p.some((x) => (x.truong_phong.so_nguoi || []).length !== c.moc.length)) loi(`co-cau/${n}: số phần tử so_nguoi phải bằng số mốc (moc)`);
    if (!c.sla || !Array.isArray(c.cong_ceo)) loi(`co-cau/${n}: thiếu sla hoặc cong_ceo`);
    dat(`co-cau/${n}/phong.json: ${p.length} phòng, ${p.reduce((a, x) => a + x.to.length, 0)} tổ${tang.length ? ', ' + tang.length + ' phòng đã gắn tầng' : ', chưa gắn tầng'}`);
  }

  const tk = path.join(dir, 'tai-khoan.json');
  if (!fs.existsSync(tk)) canhBao('Chưa có config/tai-khoan.json — chép từ tai-khoan.example.json rồi điền email người giao mặc định');
  else {
    const raw = fs.readFileSync(tk, 'utf8');
    if (/"(mat_khau|password|api_key|khoa|token|secret)"\s*:/i.test(raw) || /sk-ant-|pplx-/i.test(raw)) loi('config/tai-khoan.json có vẻ chứa mật khẩu/khoá — gỡ ra, khoá chỉ đặt qua biến môi trường');
    else dat('config/tai-khoan.json có, không chứa khoá');
  }
}

// ---------- 3. Dữ liệu ----------
function lietKe(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? lietKe(p) : [p];
  });
}

function kiemDuLieu() {
  muc('3. Dữ liệu (data/ — không nằm trong git)');
  for (const [k, app] of Object.entries(APPS)) {
    const dataDir = path.join(app.dir, 'data');
    const tep = lietKe(dataDir);
    const hong = tep.filter((f) => f.endsWith('.json')).filter((f) => { try { docJson(f); return false; } catch { return true; } });
    for (const f of hong) loi(`Tệp hỏng, không đọc được: ${path.relative(REPO, f)} — khôi phục từ bản sao lưu`);
    dat(`${app.ten}: ${tep.length} tệp trong data/`);

    if (k === 'ceo') {
      const phieu = fs.existsSync(path.join(dataDir, 'phieu')) ? fs.readdirSync(path.join(dataDir, 'phieu')).filter((f) => /^V\d+\.json$/.test(f)) : [];
      const lonNhat = phieu.reduce((m, f) => Math.max(m, Number(f.slice(1, -5))), 0);
      const fc = path.join(dataDir, 'counter.json');
      const next = fs.existsSync(fc) ? (() => { try { return docJson(fc).next; } catch { return null; } })() : 1;
      if (phieu.length) dat(`${phieu.length} phiếu yêu cầu, số lớn nhất V${String(lonNhat).padStart(3, '0')}`);
      if (next != null && next <= lonNhat) loi(`data/counter.json đang là ${next} nhưng đã có phiếu V${String(lonNhat).padStart(3, '0')} — phiếu mới sẽ ghi đè phiếu cũ. Sửa "next" thành ${lonNhat + 1}`);
    } else {
      const phieu = fs.existsSync(path.join(dataDir, 'phieu')) ? fs.readdirSync(path.join(dataDir, 'phieu')).filter((f) => /^PH-\d+\.json$/.test(f)) : [];
      if (phieu.length) dat(`${phieu.length} phiếu việc của các phòng`);
    }
  }
}

// ---------- 4. Git ----------
function git(args) {
  try { return execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; }
}
function kiemGit() {
  muc('4. Git');
  const nhanh = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (nhanh == null) { canhBao('Không phải repo git hoặc chưa cài git — bỏ qua'); return; }
  dat(`Nhánh ${nhanh}, commit ${git(['rev-parse', '--short', 'HEAD'])}`);
  const theoDoi = git(['ls-files', '--', 'apps/ceo-intake/data', 'apps/mo-hinh-3d/data', 'apps/mo-hinh-3d/config/tai-khoan.json']);
  if (theoDoi) loi('Dữ liệu thật đang bị git theo dõi (repo công khai!): ' + theoDoi.split('\n').slice(0, 5).join(', '));
  else dat('data/ và tai-khoan.json không nằm trong git');
  const ab = git(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']);
  if (ab) {
    const [truoc, sau] = ab.split(/\s+/).map(Number);
    if (sau) canhBao(`Bản trên GitHub mới hơn ${sau} commit — chạy "git pull" rồi khởi động lại (số liệu theo lần fetch gần nhất)`);
    if (truoc) canhBao(`Có ${truoc} commit chưa đẩy lên GitHub`);
  }
  const ban = git(['status', '--porcelain']);
  if (ban) canhBao(`Có ${ban.split('\n').length} thay đổi chưa commit`);
}

// ---------- 5. Cổng ----------
const congTrong = (port) => new Promise((ok) => {
  const s = net.createServer();
  s.once('error', () => ok(false));
  s.once('listening', () => s.close(() => ok(true)));
  s.listen(port, '127.0.0.1');
});
const congNgauNhien = () => new Promise((ok, no) => {
  const s = net.createServer();
  s.once('error', no);
  s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); });
});
async function kiemCong() {
  muc('5. Cổng');
  for (const app of Object.values(APPS)) {
    if (await congTrong(app.port)) dat(`Cổng ${app.port} trống (${app.ten})`);
    else canhBao(`Cổng ${app.port} đang có tiến trình nghe — có thể ${app.ten} đã chạy sẵn`);
  }
}

// ---------- 6. Chạy thử trên bản sao ----------
async function chayBanSao(app, tuyChon = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mdflex-kiem-tra-'));
  fs.cpSync(app.dir, tmp, {
    recursive: true,
    filter: (src) => path.relative(app.dir, src).split(path.sep)[0] !== 'data'
  });
  if (tuyChon.truocKhiChay) tuyChon.truocKhiChay(tmp);
  const port = await congNgauNhien();
  const env = { ...process.env, PORT: String(port) };
  for (const k of ['ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL', 'PERPLEXITY_API_KEY', 'PERPLEXITY_API_URL', 'CO_CAU']) delete env[k];
  if (tuyChon.coCau) env.CO_CAU = tuyChon.coCau;
  const proc = spawn(process.execPath, ['server.js'], { cwd: tmp, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  proc.stdout.on('data', (d) => { log += d; });
  proc.stderr.on('data', (d) => { log += d; });
  const base = `http://127.0.0.1:${port}`;
  const het = Date.now() + 15000;
  while (Date.now() < het) {
    if (proc.exitCode != null) break;
    try { const r = await fetch(base + '/'); if (r.ok) break; } catch { /* chưa lên */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  const dung = () => new Promise((ok) => {
    if (proc.exitCode != null) return ok();
    proc.once('exit', ok); proc.kill();
  }).then(() => fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }));
  return { tmp, base, proc, dung, log: () => log };
}

async function goi(base, p, body) {
  const r = await fetch(base + p, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch { /* trang HTML */ }
  return { status: r.status, json, text };
}

async function thuCeo() {
  muc('6a. Chạy thử Khung chat trên bản sao (theo AGENTS.md)');
  const s = await chayBanSao(APPS.ceo);
  try {
    if (s.proc.exitCode != null) { loi('Máy chủ không khởi động được:\n' + s.log()); return; }
    const trang = await goi(s.base, '/');
    trang.status === 200 ? dat('GET / → 200') : loi(`GET / → ${trang.status}`);

    const nhap = await goi(s.base, '/api/draft', { text: 'Giao phòng kế toán lập báo cáo tài chính tháng 11, hạn thứ sáu' });
    if (nhap.status !== 200 || !nhap.json || !nhap.json.fields) { loi(`POST /api/draft → ${nhap.status}`); return; }
    const f = nhap.json.fields;
    const nth = f.nguoiThucHien && f.nguoiThucHien.value;
    nth ? dat(`POST /api/draft nhận ra người thực hiện: ${nth}`) : loi('POST /api/draft không nhận ra phòng kế toán');

    const han = new Date(); han.setDate(han.getDate() + 7);
    const mau = {
      loaiViec: 'A', mucTieu: 'Phiếu chạy thử của van-hanh/kiem-tra.js', nguoiDungDauRa: 'CEO, để xem tình hình tài chính',
      phoiHop: 'Không có', phamViTrong: 'Số liệu tháng 11', phamViNgoai: 'Không có', dauVao: 'Không có',
      rangBuoc: 'Không có', ruiRoPhuThuoc: 'Không có', han: ymd(han)
    };
    const fields = {};
    for (const [k, v] of Object.entries(f)) fields[k] = { value: v.value, status: 'xacNhan' };
    for (const [k, v] of Object.entries(mau)) if (!fields[k] || !fields[k].value || k === 'han') fields[k] = { value: v, status: 'xacNhan' };
    if (!fields.nguoiThucHien || !fields.nguoiThucHien.value) fields.nguoiThucHien = { value: 'Phòng Kế toán', status: 'xacNhan' };

    const ph = await goi(s.base, '/api/phieu', { fields, cauHoi: [] });
    if (ph.status >= 300) { loi(`POST /api/phieu → ${ph.status}: ${(ph.json && ph.json.errors || []).join('; ')}`); return; }
    dat(`POST /api/phieu → ${ph.status}`);

    const d = path.join(s.tmp, 'data');
    const j = path.join(d, 'phieu', 'V001.json'), md = path.join(d, 'phieu', 'V001.md'), gv = path.join(d, 'giao-viec', 'GV-V001.json');
    if (!fs.existsSync(j) || !fs.existsSync(md) || !fs.existsSync(gv)) { loi('Không thấy đủ V001.json, V001.md, GV-V001.json trong data/'); return; }
    const p = docJson(j), g = docJson(gv), mdText = fs.readFileSync(md, 'utf8');
    const ok = p.soPhieu === 'V001' && p.trangThai === 'Đã phát hành'
      && mdText.includes('PHIẾU YÊU CẦU — V001') && mdText.includes('Tiêu chí nghiệm thu:') && mdText.includes('CÂU HỎI CẦN XÁC NHẬN')
      && g.phieuGoc === 'V001' && g.trangThai === 'Mới' && g.tieuChiNghiemThu.length >= 3;
    ok ? dat('Tệp sinh ra đúng mẫu: V001.json, V001.md, GV-V001.json') : loi('Tệp sinh ra sai mẫu phiếu');
    const ds = await goi(s.base, '/api/phieu');
    Array.isArray(ds.json) && ds.json.length === 1 ? dat('GET /api/phieu liệt kê phiếu vừa tạo') : canhBao('GET /api/phieu không trả đúng 1 phiếu');
  } catch (e) {
    loi('Lỗi khi chạy thử: ' + e.message + '\n' + s.log());
  } finally { await s.dung(); }
}

async function thu3d() {
  muc('6b. Chạy thử Mô hình 3D trên bản sao — cơ cấu MdFlex (gỡ CO_CAU)');
  const s = await chayBanSao(APPS.m3d);
  try {
    if (s.proc.exitCode != null) { loi('Máy chủ không khởi động được:\n' + s.log()); return; }
    const cc = await goi(s.base, '/api/co-cau');
    cc.json && cc.json.la_mdflex && cc.json.tep === 'config/phong.json' ? dat('Không đặt CO_CAU → MdFlex, đọc config/phong.json') : loi('Không đặt CO_CAU nhưng máy chủ không chạy cơ cấu MdFlex');
    for (const p of ['/', '/ceo.html', '/giao-viec.html', '/phong.html?id=kt', '/toa-nha.html', '/api/phong', '/api/ai', '/api/canvas', '/co-cau.js']) {
      const r = await goi(s.base, p);
      r.status === 200 ? dat(`GET ${p} → 200`) : loi(`GET ${p} → ${r.status}`);
    }
    const gv = await goi(s.base, '/api/giao-viec', {
      muc_tieu: 'Phiếu chạy thử của van-hanh/kiem-tra.js: lập báo cáo chi phí tháng 11',
      dau_vao: 'Không có', dau_ra: 'Báo cáo chi phí tháng 11 (Excel)',
      tieu_chi: ['Đủ các khoản chi', 'Có so sánh với tháng 10', 'Ghi rõ nguồn số liệu'],
      uu_tien: 'P3', cong: 'Không có', phong: ['kt'], muc_du_lieu: 'Vàng', tep: []
    });
    if (gv.status !== 201 || !gv.json || !gv.json.goc) { loi(`POST /api/giao-viec → ${gv.status}: ${gv.json && gv.json.error}`); return; }
    dat(`POST /api/giao-viec → 201, phiếu gốc ${gv.json.goc}, tạo ${gv.json.phieu.length} phiếu`);
    const dir = path.join(s.tmp, 'data', 'phieu');
    const tep = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^PH-\d+\.json$/.test(f)) : [];
    tep.length >= 3 ? dat(`Chuỗi phiếu CEO → Trợ lý → Trưởng phòng → Chuyên viên ghi ${tep.length} tệp`) : loi(`Chỉ ghi ${tep.length} tệp phiếu, cần ít nhất 3`);
    const goc = docJson(path.join(dir, gv.json.goc + '.json'));
    goc.nguoi_giao === 'CEO' && Array.isArray(goc.nhat_ky) && goc.nhat_ky.length ? dat('Phiếu gốc có người giao CEO và nhật ký') : loi('Phiếu gốc thiếu người giao hoặc nhật ký');
    const ds = await goi(s.base, '/api/phieu?phong=kt');
    Array.isArray(ds.json) && ds.json.length ? dat(`GET /api/phieu?phong=kt → ${ds.json.length} phiếu`) : loi('GET /api/phieu?phong=kt không thấy phiếu vừa giao');
  } catch (e) {
    loi('Lỗi khi chạy thử: ' + e.message + '\n' + s.log());
  } finally { await s.dung(); }
}

// Mỗi cơ cấu trong config/co-cau/<tên>/: máy chủ chạy được, giao việc ra đủ chuỗi phiếu, phiếu của cơ cấu khác bị chặn thao tác
async function thuCoCauKhac() {
  const goc = path.join(APPS.m3d.dir, 'config', 'co-cau');
  const ds = fs.existsSync(goc) ? fs.readdirSync(goc).filter((n) => fs.existsSync(path.join(goc, n, 'phong.json'))) : [];
  for (const n of ds) {
    muc(`6c. Chạy thử Mô hình 3D trên bản sao — CO_CAU=${n}`);
    let cfg; try { cfg = docJson(path.join(goc, n, 'phong.json')); } catch { loi(`co-cau/${n}/phong.json hỏng`); continue; }
    // Một phiếu giả của phòng không có trong cơ cấu này (như phiếu MdFlex cũ còn trong data/)
    const s = await chayBanSao(APPS.m3d, {
      coCau: n,
      truocKhiChay: (tmp) => {
        fs.mkdirSync(path.join(tmp, 'data', 'phieu'), { recursive: true });
        fs.writeFileSync(path.join(tmp, 'data', 'phieu', 'PH-9999.json'), JSON.stringify({ ma: 'PH-9999', phong: '__khong-co__', nguoi_giao: 'CEO', nguoi_nhan: 'X', trang_thai: 'Mới', tao_luc: new Date().toISOString(), han: new Date(Date.now() + 864e5).toISOString(), nhat_ky: [], tieu_chi: [], quy_dinh: [] }));
      }
    });
    try {
      if (s.proc.exitCode != null) { loi('Máy chủ không khởi động được:\n' + s.log()); continue; }
      const cc = await goi(s.base, '/api/co-cau');
      cc.json && cc.json.id === n && cc.json.so_phong === cfg.phong.length ? dat(`CO_CAU=${n} → ${cc.json.ten}, ${cc.json.so_phong} phòng`) : loi(`CO_CAU=${n} nhưng /api/co-cau trả ${JSON.stringify(cc.json)}`);
      for (const p of ['/', '/ceo.html', '/giao-viec.html', `/phong.html?id=${cfg.phong[0].id}`, '/toa-nha.html', '/co-cau.js']) {
        const r = await goi(s.base, p);
        r.status === 200 ? dat(`GET ${p} → 200`) : loi(`GET ${p} → ${r.status}`);
      }
      const ph = cfg.phong[0];
      const gv = await goi(s.base, '/api/giao-viec', { muc_tieu: 'Phiếu chạy thử của van-hanh/kiem-tra.js', dau_vao: 'Không có', dau_ra: 'Báo cáo', tieu_chi: ['Đủ'], uu_tien: 'P3', cong: 'Không có', phong: [ph.id], tep: [] });
      gv.status === 201 && gv.json.phieu.length >= 3 ? dat(`Giao việc cho ${ph.ten_ngan} → ${gv.json.phieu.length} phiếu`) : loi(`POST /api/giao-viec → ${gv.status}: ${gv.json && gv.json.error}`);
      const lan = await goi(s.base, '/api/phieu/PH-9999/hanh-dong', { hanh_dong: 'nhan', ai: 'X' });
      lan.status === 409 ? dat('Phiếu của phòng ngoài cơ cấu bị chặn thao tác (409)') : loi(`Thao tác phiếu ngoài cơ cấu → ${lan.status}, cần 409`);
    } catch (e) {
      loi('Lỗi khi chạy thử: ' + e.message + '\n' + s.log());
    } finally { await s.dung(); }
  }
}

// Bộ kiểm thử tự động của app Mô hình 3D (apps/mo-hinh-3d/test, node:test, chạy trên bản sao tạm)
function thuBoKiemThu() {
  muc('7. Bộ kiểm thử Mô hình 3D (mục tiêu, phản hồi, đánh giá, trang)');
  const { spawnSync } = require('child_process');
  const r = spawnSync(process.execPath, ['--test', 'test/**/*.test.js'], { cwd: APPS.m3d.dir, encoding: 'utf8', timeout: 300000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const so = (k) => Number((out.match(new RegExp('ℹ ' + k + ' (\\d+)')) || [])[1] || 0);
  if (r.status === 0 && so('pass') > 0) dat(`${so('pass')} bài kiểm thử đạt`);
  else loi(`Bộ kiểm thử lỗi: ${so('fail')} bài hỏng / ${so('pass')} đạt. Chạy "node --test \"test/**/*.test.js\"" trong apps/mo-hinh-3d để xem chi tiết.\n` +
    out.split('\n').filter((l) => /✖/.test(l)).slice(0, 8).join('\n'));
}

(async () => {
  console.log(`Kiểm tra MdFlex — ${REPO}${NHANH ? ' (nhanh)' : ''}`);
  kiemMoiTruong();
  kiemCauHinhCeo();
  kiemCauHinh3d();
  kiemDuLieu();
  kiemGit();
  await kiemCong();
  if (!NHANH) { await thuCeo(); await thu3d(); await thuCoCauKhac(); thuBoKiemThu(); }
  console.log(`\nKết quả: ${soLoi ? soLoi + ' lỗi' : 'đạt'}${soCanhBao ? ', ' + soCanhBao + ' cảnh báo' : ''}.`);
  process.exit(soLoi ? 1 : 0);
})();
