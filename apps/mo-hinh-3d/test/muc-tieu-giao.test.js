'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { khoiDong, giaoMau } = require('./tro-giup');

const ngay = (d) => { const x = new Date(Date.now() + d * 864e5); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const mtMau = (them = {}) => ({
  ai: 'CEO', ten: 'Bộ quy trình các phòng', ket_qua_can_dat: 'Mỗi phòng có quy trình v0.1',
  ky: { loai: 'quy', tu: ngay(-30), den: ngay(60) }, don_vi: ['p-kt', 'pk'], muc_du_lieu: 'Vàng', ...them
});
const dot = (them = {}) => ({ ai: 'CEO', muc_tieu: 'Soạn quy trình', dau_vao: 'Không có', dau_ra: 'Tài liệu', tieu_chi: ['Đủ 5 phần'], uu_tien: 'P2', cong: 'Không có', tep: [], ...them });
const dv = (mt, id) => mt.don_vi_chi_tiet.find((x) => x.phong === id);

test('giao dot va theo doi don vi', async (t) => {
  const s = await khoiDong({ coCau: 'vien-gut' });
  t.after(() => s.dung());
  await s.goi('/api/muc-tieu', mtMau());

  await t.test('giao dot tao phieu gan ma_muc_tieu', async () => {
    const r = await s.goi('/api/muc-tieu/MT-0001/giao', dot());
    assert.equal(r.status, 201);
    assert.equal(r.json.giao.phieu.length, 5); // gốc + 2 × (Trưởng phòng + chuyên viên)
    assert.equal(s.docPhieu(r.json.giao.goc).ma_muc_tieu, 'MT-0001');
    const mt = (await s.goi('/api/muc-tieu/MT-0001')).json;
    assert.equal(mt.trang_thai, 'Đang triển khai');
    assert.deepEqual(mt.phieu_goc, [r.json.giao.goc]);
    assert.equal(mt.don_vi_chi_tiet.length, 2);
    assert.equal(dv(mt, 'pk').xong, 0);
    assert.equal(dv(mt, 'pk').tong, 1);
    assert.ok(dv(mt, 'pk').nhan_luc);
    assert.equal(dv(mt, 'pk').im_lang, false);
    assert.equal(dv(mt, 'pk').phan_hoi_cuoi, null);
  });

  await t.test('giao khong phai CEO 403', async () => {
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/giao', dot({ ai: 'PK-TP' }))).status, 403);
  });

  await t.test('giao don vi ngoai muc tieu 400', async () => {
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/giao', dot({ phong: ['ttnc'] }))).status, 400);
  });

  await t.test('phan hoi hien o don vi', async () => {
    const mt0 = (await s.goi('/api/muc-tieu/MT-0001')).json;
    const maTP = dv(mt0, 'pk').phieu[0];
    assert.equal((await s.goi(`/api/phieu/${maTP}/phan-hoi`, { ai: 'PK-TP', loai: 'Khó khăn', noi_dung: 'Chưa có mẫu SOP' })).status, 201);
    // CEO trả lời không tính là phản hồi của đơn vị
    assert.equal((await s.goi(`/api/phieu/${maTP}/phan-hoi`, { ai: 'CEO', loai: 'Trả lời', noi_dung: 'Dùng mẫu SOP-HCQT-07' })).status, 201);
    const mt = (await s.goi('/api/muc-tieu/MT-0001')).json;
    assert.equal(dv(mt, 'pk').phan_hoi_cuoi.loai, 'Khó khăn');
    assert.equal(dv(mt, 'pk').phan_hoi_cuoi.ai, 'PK-TP');
    assert.equal(mt.phan_hoi.length, 2);
    assert.equal(mt.phan_hoi[0].loai, 'Trả lời'); // mới nhất trước
  });

  await t.test('im lang sau 48 gio', async () => {
    const mt0 = (await s.goi('/api/muc-tieu/MT-0001')).json;
    const maTP = dv(mt0, 'p-kt').phieu[0];
    const p = s.docPhieu(maTP); p.tao_luc = new Date(Date.now() - 49 * 3600e3).toISOString(); s.ghiPhieu(p);
    assert.equal(dv((await s.goi('/api/muc-tieu/MT-0001')).json, 'p-kt').im_lang, true);
    await s.goi(`/api/phieu/${maTP}/phan-hoi`, { ai: 'P-KT-TP', loai: 'Báo cáo tiến độ', noi_dung: 'Đang soạn' });
    assert.equal(dv((await s.goi('/api/muc-tieu/MT-0001')).json, 'p-kt').im_lang, false);
  });

  await t.test('gan phieu co san', async () => {
    const g = await s.goi('/api/giao-viec', giaoMau(['ttnc']));
    const r = await s.goi('/api/muc-tieu/MT-0001/gan-phieu', { ai: 'CEO', ma_phieu: g.json.goc });
    assert.equal(r.status, 200);
    assert.ok(r.json.don_vi.includes('ttnc'));
    assert.ok(r.json.phieu_goc.includes(g.json.goc));
    assert.equal(s.docPhieu(g.json.goc).ma_muc_tieu, 'MT-0001');
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/gan-phieu', { ai: 'CEO', ma_phieu: g.json.goc })).status, 409);
    const tp = g.json.phieu.map(s.docPhieu).find((x) => x.nguoi_giao === 'TL-DP');
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/gan-phieu', { ai: 'CEO', ma_phieu: tp.ma })).status, 400);
  });

  await t.test('danh sach co tom tat tien do', async () => {
    const ds = (await s.goi('/api/muc-tieu')).json;
    assert.equal(ds[0].tom_tat.tong, 3);
    assert.equal(typeof ds[0].tom_tat.xong, 'number');
  });
});

test('muc du lieu va trang thai tu dong', async (t) => {
  const s = await khoiDong({ coCau: 'vien-gut' });
  t.after(() => s.dung());

  await t.test('muc du lieu thap hon 400', async () => {
    await s.goi('/api/muc-tieu', mtMau({ muc_du_lieu: 'Đỏ' }));
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/giao', dot({ muc_du_lieu: 'Vàng' }))).status, 400);
  });

  await t.test('do kem ai_lam_ngay khong chay Claude', async () => {
    const r = await s.goi('/api/muc-tieu/MT-0001/giao', dot({ ai_lam_ngay: true }));
    assert.equal(r.status, 201);
    assert.deepEqual(r.json.giao.ai_chay, []);
    assert.ok(r.json.giao.phieu.map(s.docPhieu).every((p) => p.muc_du_lieu === 'Đỏ'));
  });

  await t.test('het ky chuyen Cho danh gia', async () => {
    await s.goi('/api/muc-tieu', mtMau({ ten: 'Kỳ đã qua', ky: { loai: 'thang', tu: ngay(-40), den: ngay(-1) } }));
    await s.goi('/api/muc-tieu/MT-0002/giao', dot());
    assert.equal((await s.goi('/api/muc-tieu/MT-0002')).json.trang_thai, 'Chờ đánh giá');
  });

  await t.test('giao khi da huy 409', async () => {
    await s.goi('/api/muc-tieu', mtMau({ ten: 'Huỷ' }));
    await s.goi('/api/muc-tieu/MT-0003/huy', { ai: 'CEO', ly_do: 'Thử' });
    assert.equal((await s.goi('/api/muc-tieu/MT-0003/giao', dot())).status, 409);
  });
});
