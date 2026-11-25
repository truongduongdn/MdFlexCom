'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { khoiDong } = require('./tro-giup');

const mtMau = (them = {}) => ({
  ai: 'CEO', ten: 'Chuẩn hoá quy trình Q4', ket_qua_can_dat: 'Mỗi phòng có bộ quy trình v0.1',
  ky: { loai: 'quy', tu: '2026-10-01', den: '2026-12-31' },
  chi_so: [{ ten: 'Số phòng nộp quy trình', chi_tieu: '5/5' }],
  don_vi: ['kt', 'ns'], muc_du_lieu: 'Vàng', ...them
});

test('muc tieu', async (t) => {
  const s = await khoiDong();
  t.after(() => s.dung());

  await t.test('tao muc tieu Nhap', async () => {
    const r = await s.goi('/api/muc-tieu', mtMau());
    assert.equal(r.status, 201);
    assert.equal(r.json.ma, 'MT-0001');
    assert.equal(r.json.trang_thai, 'Nháp');
    assert.equal(r.json.co_cau, 'mdflex');
    assert.equal(r.json.ky.ten, 'Q4/2026');
    assert.equal(r.json.nhat_ky[0].hanh_dong, 'Tạo mục tiêu');
  });

  await t.test('khong phai CEO 403', async () => {
    const r = await s.goi('/api/muc-tieu', mtMau({ ai: 'KT-TP' }));
    assert.equal(r.status, 403);
  });

  await t.test('ky sai 400', async () => {
    assert.equal((await s.goi('/api/muc-tieu', mtMau({ ky: { loai: 'quy', tu: '2026-12-31', den: '2026-10-01' } }))).status, 400);
    assert.equal((await s.goi('/api/muc-tieu', mtMau({ ky: { loai: 'tuan', tu: '2026-10-01', den: '2026-10-07' } }))).status, 400);
    assert.equal((await s.goi('/api/muc-tieu', mtMau({ ky: { loai: 'thang', tu: '2026-13-01', den: '2026-13-30' } }))).status, 400);
  });

  await t.test('thieu ten 400', async () => {
    assert.equal((await s.goi('/api/muc-tieu', mtMau({ ten: '  ' }))).status, 400);
  });

  await t.test('don vi la 400', async () => {
    assert.equal((await s.goi('/api/muc-tieu', mtMau({ don_vi: ['khong-co'] }))).status, 400);
    assert.equal((await s.goi('/api/muc-tieu', mtMau({ don_vi: [] }))).status, 400);
  });

  await t.test('GET danh sach va mot muc tieu', async () => {
    const ds = await s.goi('/api/muc-tieu');
    assert.equal(ds.status, 200);
    assert.equal(ds.json.length, 1);
    const mt = await s.goi('/api/muc-tieu/MT-0001');
    assert.equal(mt.status, 200);
    assert.equal(mt.json.ten, 'Chuẩn hoá quy trình Q4');
    assert.equal((await s.goi('/api/muc-tieu/MT-0099')).status, 404);
  });

  await t.test('sua can ly do', async () => {
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/sua', { ai: 'CEO', ten: 'Tên mới' })).status, 400);
    const r = await s.goi('/api/muc-tieu/MT-0001/sua', { ai: 'CEO', ten: 'Tên mới', ly_do: 'Gọn hơn' });
    assert.equal(r.status, 200);
    assert.equal(r.json.ten, 'Tên mới');
    const k = r.json.nhat_ky[r.json.nhat_ky.length - 1];
    assert.equal(k.hanh_dong, 'Sửa mục tiêu');
    assert.match(k.ghi_chu, /Chuẩn hoá quy trình Q4 → Tên mới/);
    assert.equal(k.ly_do, 'Gọn hơn');
  });

  await t.test('cap nhat tien do', async () => {
    const r = await s.goi('/api/muc-tieu/MT-0001/tien-do', {
      ai: 'CEO', ke_hoach: [{ ten: 'Nộp bản nháp', han: '2026-12-02', don_vi: 'kt', xong: true }],
      chi_so: [{ ten: 'Số phòng nộp quy trình', chi_tieu: '5/5', thuc_te: '2/5' }]
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.ke_hoach[0].xong, true);
    assert.equal(r.json.chi_so[0].thuc_te, '2/5');
    assert.equal(r.json.nhat_ky[r.json.nhat_ky.length - 1].hanh_dong, 'Cập nhật kế hoạch/chỉ số');
    const loi = await s.goi('/api/muc-tieu/MT-0001/tien-do', { ai: 'CEO', ke_hoach: [{ ten: 'X', han: '2026-12-02', don_vi: 'mkt', xong: false }] });
    assert.equal(loi.status, 400);
    const loiNgay = await s.goi('/api/muc-tieu/MT-0001/tien-do', { ai: 'CEO', ke_hoach: [{ ten: 'X', han: 'mai', xong: false }] });
    assert.equal(loiNgay.status, 400);
  });

  await t.test('huy can ly do', async () => {
    await s.goi('/api/muc-tieu', mtMau({ ten: 'Sẽ huỷ' }));
    assert.equal((await s.goi('/api/muc-tieu/MT-0002/huy', { ai: 'CEO' })).status, 400);
    const r = await s.goi('/api/muc-tieu/MT-0002/huy', { ai: 'CEO', ly_do: 'Gộp vào MT-0001' });
    assert.equal(r.status, 200);
    assert.equal(r.json.trang_thai, 'Huỷ');
    assert.equal((await s.goi('/api/muc-tieu/MT-0002/sua', { ai: 'CEO', ten: 'x', ly_do: 'y' })).status, 409);
  });
});

test('muc tieu co cau khac chi xem', async () => {
  const s = await khoiDong();
  await s.goi('/api/muc-tieu', mtMau());
  await s.dung({ giuTmp: true });
  const v = await khoiDong({ coCau: 'vien-gut', tmp: s.tmp });
  try {
    assert.equal((await v.goi('/api/muc-tieu/MT-0001')).status, 200);
    assert.equal((await v.goi('/api/muc-tieu/MT-0001/sua', { ai: 'CEO', ten: 'x', ly_do: 'y' })).status, 409);
  } finally { await v.dung(); }
});
