#!/usr/bin/env node
// Sao lưu dữ liệu thật của MdFlex (không nằm trong git, repo công khai).
//   node van-hanh/sao-luu.js
// Chép apps/ceo-intake/data, apps/mo-hinh-3d/data và apps/mo-hinh-3d/config/tai-khoan.json
// sang SAO_LUU_DIR/<YYYY-MM-DD_HHmmss>/. Mặc định SAO_LUU_DIR = thư mục "MdFlexCom-sao-luu" cạnh repo.
// Giữ GIU_LAI bản mới nhất (mặc định 60); chỉ xoá các thư mục bản sao do script này tạo,
// không bao giờ xoá gì trong repo hay data/ gốc. Khôi phục làm tay, xem van-hanh/README.md.

'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const DICH = path.resolve(process.env.SAO_LUU_DIR || path.join(REPO, '..', 'MdFlexCom-sao-luu'));
const GIU_LAI = Math.max(1, Number(process.env.GIU_LAI) || 60);
const NGUON = [
  'apps/ceo-intake/data',
  'apps/mo-hinh-3d/data',
  'apps/mo-hinh-3d/config/tai-khoan.json'
];
const TEN_BAN = /^\d{4}-\d{2}-\d{2}_\d{6}$/;

const rel = path.relative(REPO, DICH);
if (!rel || (!rel.startsWith('..') && !path.isAbsolute(rel))) {
  console.error(`✘ SAO_LUU_DIR (${DICH}) nằm trong repo — bản sao có thể bị commit lên GitHub công khai. Chọn thư mục ngoài repo.`);
  process.exit(1);
}

const p2 = (n) => String(n).padStart(2, '0');
const d = new Date();
const ten = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
const ban = path.join(DICH, ten);

let soTep = 0, soByte = 0;
const dem = (p) => {
  const st = fs.statSync(p);
  if (st.isDirectory()) for (const e of fs.readdirSync(p)) dem(path.join(p, e));
  else { soTep++; soByte += st.size; }
};

try {
  fs.mkdirSync(ban, { recursive: true });
  const daChep = [];
  for (const n of NGUON) {
    const src = path.join(REPO, n);
    if (!fs.existsSync(src)) continue;
    fs.cpSync(src, path.join(ban, n), { recursive: true });
    dem(path.join(ban, n));
    daChep.push(n);
  }
  fs.writeFileSync(path.join(ban, 'sao-luu.json'), JSON.stringify({
    luc: d.toISOString(), may: require('os').hostname(), repo: REPO, nguon: daChep, soTep, soByte
  }, null, 2), 'utf8');
  console.log(`✔ Đã sao lưu ${soTep} tệp (${(soByte / 1024).toFixed(1)} KB) vào ${ban}`);
} catch (e) {
  console.error('✘ Sao lưu thất bại: ' + e.message);
  process.exit(1);
}

// Dọn bản cũ: chỉ các thư mục đúng mẫu tên do script này tạo
const cu = fs.readdirSync(DICH, { withFileTypes: true })
  .filter((e) => e.isDirectory() && TEN_BAN.test(e.name)
    && fs.existsSync(path.join(DICH, e.name, 'sao-luu.json')))
  .map((e) => e.name).sort().reverse().slice(GIU_LAI);
for (const n of cu) fs.rmSync(path.join(DICH, n), { recursive: true, force: true });
if (cu.length) console.log(`  Đã dọn ${cu.length} bản cũ, giữ ${GIU_LAI} bản mới nhất.`);
