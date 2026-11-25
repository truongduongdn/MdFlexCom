#!/usr/bin/env node
// Sinh config/co-cau/vien-gut/phong.json từ cơ cấu Viện Gút của app ceo-intake.
//   node apps/mo-hinh-3d/config/co-cau/vien-gut/tao-phong.js            ghi mới (dừng nếu tệp đã có)
//   node apps/mo-hinh-3d/config/co-cau/vien-gut/tao-phong.js --ghi-de   ghi đè bản đã có
// Nguồn: apps/ceo-intake/config/don-vi.vgc.json nếu có, không thì don-vi.json (phải là cơ cấu Viện Gút, gốc TCT).
// Chỉ ĐỌC config/phong.json của MdFlex để chép phần dùng chung (SLA, cổng CEO, vị trí chung); không bao giờ ghi vào đó.
// Sau khi sinh, phong.json là dữ liệu do người dùng quản lý: sửa tay chức năng, KPI, từ khoá, thẻ vị trí AI, tầng.

'use strict';
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const APP = path.resolve(DIR, '..', '..', '..');
const CEO_CFG = path.resolve(APP, '..', 'ceo-intake', 'config');
const DICH = path.join(DIR, 'phong.json');
const MDFLEX = path.join(APP, 'config', 'phong.json');

const docJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
const nguon = ['don-vi.vgc.json', 'don-vi.json'].map((f) => path.join(CEO_CFG, f)).find((f) => {
  if (!fs.existsSync(f)) return false;
  const g = (docJson(f).donVi || []).find((d) => !d.thuoc);
  return g && g.ma === 'TCT';
});
if (!nguon) { console.error('✘ Không thấy cơ cấu Viện Gút (gốc TCT) trong apps/ceo-intake/config/don-vi.vgc.json hay don-vi.json'); process.exit(1); }
if (fs.existsSync(DICH) && !process.argv.includes('--ghi-de')) { console.error(`✘ ${path.relative(process.cwd(), DICH)} đã có. Thêm --ghi-de nếu muốn sinh lại (mọi chỉnh sửa tay sẽ mất).`); process.exit(1); }

const dv = docJson(nguon);
const mdf = docJson(MDFLEX);
const tatCa = (dv.donVi || []).filter((d) => !d.ngungHoatDong);
const ngung = (dv.donVi || []).filter((d) => d.ngungHoatDong).map((d) => d.ten);
const goc = tatCa.find((d) => !d.thuoc);
const con = (ma) => tatCa.filter((d) => d.thuoc === ma);
const conChau = (ma) => con(ma).flatMap((c) => [c, ...conChau(c.ma)]);

const boDau = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
const slug = (s) => boDau(String(s)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MA = (s) => slug(s).toUpperCase();
const hoaDau = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function tenNgan(ten) {
  let t = ten.replace(/\s+Viện Gút$/i, '');
  const m = t.match(/^(Phòng|Trung tâm|Khoa|Bộ phận|BP)\s+(.+)$/);
  if (m && /^\p{Lu}/u.test(m[2])) t = m[2];          // "Phòng Kế toán" → "Kế toán"; giữ "Phòng khám"
  else if (m && m[1] === 'Trung tâm') t = hoaDau(m[2]); // "Trung tâm nghiên cứu" → "Nghiên cứu"
  return t;
}
// Từ khoá: tên có dấu (để khớp câu gõ có dấu) + từ khoá không dấu của ceo-intake (để khớp câu không dấu)
// Tên rút gọn chỉ lấy khi có từ 2 chữ trở lên: "Ngoại", "Nội" một chữ sẽ khớp nhầm "nội dung"
// Câu có dấu chỉ khớp từ khoá có dấu (máy chủ so có dấu khi câu có dấu), nên kèm dạng có dấu của từ khoá ceo-intake.
// Từ khoá không có trong bảng này chỉ khớp câu gõ không dấu — thêm vào đây khi don-vi.json có từ khoá mới.
const CO_DAU = {
  'nha thuoc': 'nhà thuốc', 'an ninh': 'an ninh', 'phong ky thuat': 'phòng kỹ thuật', 'bao ve': 'bảo vệ', 'bep an': 'bếp ăn',
  'nha bep': 'nhà bếp', 'ky thuat dien': 'kỹ thuật điện', 'dien nuoc': 'điện nước', 'tap vu': 'tạp vụ', 've sinh': 'vệ sinh',
  'hanh chinh': 'hành chính', 'quan tri': 'quản trị', 'ke toan': 'kế toán', 'tai chinh': 'tài chính', 'phong kham': 'phòng khám',
  'dien tim': 'điện tim', 'chan doan hinh anh': 'chẩn đoán hình ảnh', 'x quang': 'x quang', 'sieu am': 'siêu âm',
  'khoa ngoai': 'khoa ngoại', 'khoa noi': 'khoa nội', 'xet nghiem': 'xét nghiệm', 'cung ung': 'cung ứng', 'hau can': 'hậu cần',
  'mua hang': 'mua hàng', 'vat tu': 'vật tư', 'trung tam nghien cuu': 'trung tâm nghiên cứu', 'nghien cuu': 'nghiên cứu',
  'truyen thong - thong tin': 'truyền thông - thông tin', 'trung tam truyen thong': 'trung tâm truyền thông',
  'cong nghe ky thuat': 'công nghệ kỹ thuật', 'ke hoach tong hop': 'kế hoạch tổng hợp', 'cham soc khach hang': 'chăm sóc khách hàng',
  'dieu duong': 'điều dưỡng', 'quang cao': 'quảng cáo', 'phat trien cong nghe': 'phát triển công nghệ', 'phan mem': 'phần mềm',
  'lap trinh': 'lập trình', 'san xuat video': 'sản xuất video', 'trung tam cong nghe': 'trung tâm công nghệ'
};
const tuKhoa = (ds) => [...new Set(ds.flatMap((d) => [d.ten.toLowerCase(), ...(tenNgan(d.ten).includes(' ') ? [tenNgan(d.ten).toLowerCase()] : []),
  ...(d.tuKhoa || []).flatMap((k) => (CO_DAU[k] && CO_DAU[k] !== k ? [CO_DAU[k], k] : [k]))]))]
  .filter((k) => k.length >= 2);

// Màu phòng lấy theo thứ tự từ bảng màu thương hiệu (config/thuong-hieu.json): [sáng, tối]
const MAU = [['#149078', '#2dd4a8'], ['#f48c0c', '#fbb040'], ['#3b82f6', '#3b82f6'], ['#0d6b56', '#149078'],
  ['#444444', '#e0e0e0'], ['#f59e0b', '#f59e0b'], ['#22c55e', '#22c55e'], ['#1a1a2e', '#f1f5f9'], ['#666666', '#e8f5f1']];

const daDem = new Set(); // một người quản lý nhiều đơn vị chỉ đếm một lần
const dem = (ten) => { if (!ten || daDem.has(ten)) return 0; daDem.add(ten); return 1; };

const phong = con(goc.ma).map((u, i) => {
  const id = slug(u.ma), P = MA(u.ma), ngan = tenNgan(u.ten);
  const tpMa = `${P}-TP`;
  const soTP = dem(u.quanLy); // đếm trưởng phòng trước người quản lý tổ
  const maCon = (c) => { const m = MA(c.ma); return m.startsWith(P + '-') ? m.slice(P.length + 1) : m; }; // ANKT_BV → BV
  const nhom = con(u.ma).length ? con(u.ma) : [u];
  const to = nhom.map((c) => {
    const chau = conChau(c.ma).filter((x) => x !== c);
    const viTri = [{ ten: `Quản lý ${c === u ? 'đơn vị' : c.ten}: ${c.quanLy || 'chưa gán'}`, so_nguoi: [c === u ? 0 : dem(c.quanLy)] }]
      .concat(chau.map((x) => ({ ten: `${x.ten}: ${x.quanLy || 'chưa gán'}`, so_nguoi: [dem(x.quanLy)] })));
    return {
      ten: c === u ? ngan : c.ten,
      ma_don_vi: c.ma,
      de_xuat: false,
      kiem: null,
      vi_tri: viTri,
      ai: [{
        ma: c === u ? `${P}-01` : `${P}-${maCon(c)}-01`,
        ten: `Chuyên viên AI ${c === u ? ngan : tenNgan(c.ten)}`,
        tu_khoa: tuKhoa([c, ...chau]),
        nhiem_vu: [`Soạn nháp văn bản, báo cáo, số liệu theo phiếu giao cho ${c.ten}`],
        dau_vao: 'Theo phiếu: mục tiêu, đầu vào, tiêu chí nghiệm thu',
        dau_ra: `Bản nháp chờ quản lý ${c.ten} duyệt`,
        tieu_chi_nghiem_thu: ['Đúng mục tiêu và đầu ra ghi trong phiếu', 'Nêu rõ nguồn số liệu, phần còn thiếu'],
        cong_cu_duoc_phep: ['ghi_tep_nhap'],
        cam: ['gui_ra_ngoai', 'chi_tien', 'xoa_du_lieu_goc', 'doi_quy_dinh'],
        sla: '1 ngày',
        bao_cao_cho: tpMa,
        kpi: ['ty_le_dung_sla', 'ty_le_dat_nghiem_thu_lan_dau'],
        de_xuat: true
      }]
    };
  });
  return {
    id, ma: u.ma, ten: u.ten, ten_ngan: ngan,
    tang: null,
    mau: { sang: MAU[i % MAU.length][0], toi: MAU[i % MAU.length][1] },
    tu_khoa: tuKhoa([u, ...conChau(u.ma)]),
    quy_che: `QC-${P}-v0 (chưa có)`,
    truong_phong: {
      nguoi_that: u.quanLy || 'Chưa gán quản lý',
      so_nguoi: [soTP],
      ai: {
        ma: tpMa,
        ten: `Trưởng ${ngan} (AI)`,
        nhiem_vu: 'Nhận phiếu cấp phòng, chia cho chuyên viên, nghiệm thu, ký bàn giao sang phòng khác',
        quyen: 'Duyệt hoặc trả lại đầu ra; mở Đề xuất lên Trợ lý điều phối'
      }
    },
    chuc_nang: 'Chưa khai báo — trưởng đơn vị bổ sung.',
    nhiem_vu: [],
    muc_tieu: 'Chưa khai báo',
    su_menh: 'Chưa khai báo',
    dau_ra: 'Chưa khai báo',
    kpi: 'Chưa khai báo',
    to
  };
});

const out = {
  _ghiChu: 'Cơ cấu Viện Gút cho app mo-hinh-3d, dùng khi chạy với CO_CAU=vien-gut. Sinh bằng tao-phong.js rồi do người dùng quản lý. ' +
    'Phòng = đơn vị trực thuộc công ty; tổ = đơn vị cấp dưới (cấp thấp hơn nữa ghi trong vi_tri của tổ). ' +
    'so_nguoi = số người quản lý đã gán (mỗi người đếm một lần), chưa phải định biên. ' +
    'Thẻ vị trí AI là ĐỀ XUẤT tự sinh, chờ trưởng đơn vị và CEO duyệt. tang để null cho đến khi CEO gắn tầng toà nhà.' +
    (ngung.length ? ` Bỏ qua đơn vị ngừng hoạt động: ${ngung.join(', ')}.` : ''),
  to_chuc: 'Viện Gút',
  ten_day_du: goc.ten,
  khau_hieu: `${goc.ten} · CEO ${goc.quanLy || 'chưa gán'}`,
  nguon: `Sinh từ apps/ceo-intake/config/${path.basename(nguon)} (${(dv._ghiChu || '').split('.')[0]}) ngày ${new Date().toLocaleDateString('vi-VN')}.`,
  moc: ['Hiện tại'],
  quy_dinh_chung: mdf.quy_dinh_chung,
  sla: mdf.sla,
  cong_ceo: mdf.cong_ceo,
  vi_tri_chung: mdf.vi_tri_chung,
  phong,
  ban_giao: []
};

// Kiểm tra mã không trùng
const ma = [...out.vi_tri_chung.map((v) => v.ma), ...phong.flatMap((p) => [p.truong_phong.ai.ma, ...p.to.flatMap((t) => t.ai.map((a) => a.ma))])];
const trung = ma.filter((m, i) => ma.indexOf(m) !== i);
if (trung.length) { console.error('✘ Trùng mã vị trí: ' + trung.join(', ')); process.exit(1); }

fs.writeFileSync(DICH, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`✔ Đã ghi ${path.relative(process.cwd(), DICH)}: ${phong.length} phòng, ${phong.reduce((a, p) => a + p.to.length, 0)} tổ, ${ma.length - out.vi_tri_chung.length} vị trí AI (nguồn ${path.basename(nguon)})`);
