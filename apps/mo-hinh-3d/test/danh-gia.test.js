'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { khoiDong } = require('./tro-giup');

const mt = (them = {}) => ({ ai: 'CEO', ten: 'Bộ quy trình', ky: { loai: 'quy', tu: '2026-10-01', den: '2099-12-31', ten: 'Q4/2026' }, don_vi: ['p-kt', 'pk'], ...them });
const dot = { ai: 'CEO', muc_tieu: 'Soạn quy trình', dau_vao: 'Không có', dau_ra: 'Tài liệu', tieu_chi: ['Đủ'], uu_tien: 'P2', cong: 'Không có', tep: [] };

test('danh gia va the truong phong', async (t) => {
  const s = await khoiDong({ coCau: 'vien-gut' });
  t.after(() => s.dung());
  await s.goi('/api/muc-tieu', mt());

  await t.test('danh gia khi Nhap 409', async () => {
    const r = await s.goi('/api/muc-tieu/MT-0001/danh-gia', { ai: 'CEO', phong: 'p-kt', ket_qua: 'Đạt', diem: 4 });
    assert.equal(r.status, 409);
  });

  await t.test('danh gia don vi', async () => {
    await s.goi('/api/muc-tieu/MT-0001/giao', dot);
    const r = await s.goi('/api/muc-tieu/MT-0001/danh-gia', { ai: 'CEO', phong: 'p-kt', ket_qua: 'Đạt', diem: 4, nhan_xet: 'Tốt' });
    assert.equal(r.status, 201);
    assert.equal(r.json.danh_gia['p-kt'].ket_qua, 'Đạt');
    assert.equal(r.json.danh_gia['p-kt'].diem, 4);
    assert.ok(r.json.danh_gia['p-kt'].luc);
    assert.equal(r.json.trang_thai, 'Đang triển khai');
  });

  await t.test('khong phai CEO 403', async () => {
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/danh-gia', { ai: 'P-KT-TP', phong: 'p-kt', ket_qua: 'Đạt', diem: 5 })).status, 403);
  });

  await t.test('khong dat thieu nhan xet 400', async () => {
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/danh-gia', { ai: 'CEO', phong: 'pk', ket_qua: 'Không đạt', diem: 2, nhan_xet: ' ' })).status, 400);
  });

  await t.test('diem ngoai 1-5 400', async () => {
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/danh-gia', { ai: 'CEO', phong: 'pk', ket_qua: 'Đạt', diem: 6 })).status, 400);
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/danh-gia', { ai: 'CEO', phong: 'pk', ket_qua: 'Đạt', diem: 0 })).status, 400);
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/danh-gia', { ai: 'CEO', phong: 'pk', ket_qua: 'Đạt', diem: 3.5 })).status, 400);
  });

  await t.test('ket qua hoac don vi sai 400', async () => {
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/danh-gia', { ai: 'CEO', phong: 'pk', ket_qua: 'Xuất sắc', diem: 5 })).status, 400);
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/danh-gia', { ai: 'CEO', phong: 'ttnc', ket_qua: 'Đạt', diem: 5 })).status, 400);
  });

  await t.test('the truong phong', async () => {
    const ph = (await s.goi('/api/muc-tieu/MT-0001')).json.don_vi_chi_tiet.find((x) => x.phong === 'p-kt').phieu[0];
    await s.goi(`/api/phieu/${ph}/phan-hoi`, { ai: 'P-KT-TP', loai: 'Báo cáo tiến độ', noi_dung: 'Đang soạn' });
    const r = await s.goi('/api/truong-phong?ky=Q4/2026&tu=2026-10-01&den=2099-12-31');
    assert.equal(r.status, 200);
    const kt = r.json.find((x) => x.phong === 'p-kt');
    assert.equal(kt.truong_phong, 'Phạm Thị Tuyến');
    assert.equal(kt.so_muc_tieu, 1);
    assert.equal(kt.diem_tb, 4);
    assert.equal(kt.so_phan_hoi, 1);
    assert.equal(kt.im_lang, false);
    assert.equal(r.json.find((x) => x.phong === 'pk').diem_tb, null);
    assert.equal(r.json.length, 8);
    const khac = (await s.goi('/api/truong-phong?ky=Q1/2020&tu=2020-01-01&den=2020-03-31')).json.find((x) => x.phong === 'p-kt');
    assert.equal(khac.so_muc_tieu, 0);
    assert.equal(khac.diem_tb, null);
    assert.equal(khac.so_phan_hoi, 0);
  });

  await t.test('du danh gia va tong ket thi Da danh gia', async () => {
    await s.goi('/api/muc-tieu/MT-0001/danh-gia', { ai: 'CEO', phong: 'pk', ket_qua: 'Đạt một phần', diem: 3, nhan_xet: 'Thiếu SOP xét nghiệm' });
    let r = await s.goi('/api/muc-tieu/MT-0001');
    assert.equal(r.json.trang_thai, 'Đang triển khai');
    r = await s.goi('/api/muc-tieu/MT-0001/danh-gia', { ai: 'CEO', tong_ket: 'Đạt 1/2 đơn vị, làm tiếp Q1' });
    assert.equal(r.status, 201);
    assert.equal(r.json.trang_thai, 'Đã đánh giá');
    assert.equal(r.json.tong_ket, 'Đạt 1/2 đơn vị, làm tiếp Q1');
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/giao', dot)).status, 409);
    assert.equal((await s.goi('/api/muc-tieu/MT-0001/danh-gia', { ai: 'CEO', phong: 'pk', ket_qua: 'Đạt', diem: 5 })).status, 409);
  });
});
