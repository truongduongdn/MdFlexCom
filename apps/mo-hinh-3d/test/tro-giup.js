// Trợ giúp kiểm thử: chạy máy chủ mo-hinh-3d trên bản sao tạm (không có data/ thật, không có khoá API).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');

const APP = path.resolve(__dirname, '..');

const congTrong = () => new Promise((ok, no) => {
  const s = net.createServer();
  s.once('error', no);
  s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); });
});

// khoiDong({ coCau, tmp }) — tmp: chạy lại trên bản sao đã có (giữ data/)
async function khoiDong({ coCau, tmp } = {}) {
  if (!tmp) {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mo-hinh-3d-test-'));
    fs.cpSync(APP, tmp, { recursive: true, filter: (s) => !['data', 'test'].includes(path.relative(APP, s).split(path.sep)[0]) });
  }
  const port = await congTrong();
  const env = { ...process.env, PORT: String(port) };
  for (const k of ['ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL', 'PERPLEXITY_API_KEY', 'PERPLEXITY_API_URL', 'CO_CAU']) delete env[k];
  if (coCau) env.CO_CAU = coCau;
  const proc = spawn(process.execPath, ['server.js'], { cwd: tmp, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  proc.stdout.on('data', (d) => { log += d; });
  proc.stderr.on('data', (d) => { log += d; });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    if (proc.exitCode != null) throw new Error('Máy chủ không khởi động được:\n' + log);
    try { if ((await fetch(base + '/api/co-cau')).ok) break; } catch { /* chưa lên */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  async function goi(p, body, method) {
    const opt = body === undefined && !method ? {} : { method: method || 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) };
    const r = await fetch(base + p, opt);
    const t = await r.text();
    let json = null; try { json = JSON.parse(t); } catch { /* HTML */ }
    return { status: r.status, json, text: t };
  }
  const docPhieu = (ma) => JSON.parse(fs.readFileSync(path.join(tmp, 'data', 'phieu', ma + '.json'), 'utf8'));
  const ghiPhieu = (p) => fs.writeFileSync(path.join(tmp, 'data', 'phieu', p.ma + '.json'), JSON.stringify(p, null, 2));
  // dung({ giuTmp }) — giữ bản sao để khởi động lại với cơ cấu khác
  const dung = ({ giuTmp } = {}) => new Promise((ok) => {
    if (proc.exitCode != null) return ok();
    proc.once('exit', ok); proc.kill();
  }).then(() => { if (!giuTmp) fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); });
  return { base, tmp, goi, docPhieu, ghiPhieu, dung, log: () => log };
}

// Một lệnh giao việc mẫu
const giaoMau = (phong, them = {}) => ({
  muc_tieu: 'Phiếu kiểm thử', dau_vao: 'Không có', dau_ra: 'Báo cáo', tieu_chi: ['Đủ', 'Đúng hạn'],
  uu_tien: 'P2', cong: 'Không có', phong, tep: [], ...them
});

module.exports = { khoiDong, giaoMau };
