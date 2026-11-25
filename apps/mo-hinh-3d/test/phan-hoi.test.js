'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { khoiDong, giaoMau } = require('./tro-giup');

// Phiếu của Trưởng phòng Kế toán (TL-DP → KT-TP) trong chuỗi giao cho phòng kt
async function chuoiKeToan(s) {
  const r = await s.goi('/api/giao-viec', giaoMau(['kt']));
  const tp = r.json.phieu.map(s.docPhieu).find((p) => p.nguoi_giao === 'TL-DP');
  const cv = r.json.phieu.map(s.docPhieu).find((p) => p.nguoi_giao === tp.nguoi_nhan);
  return { tp, cv };
}

test('phan hoi', async (t) => {
  const s = await khoiDong();
  t.after(() => s.dung());
  const { tp, cv } = await chuoiKeToan(s);

  await t.test('phan hoi hop le ghi nhat ky', async () => {
    const r = await s.goi(`/api/phieu/${tp.ma}/phan-hoi`, { ai: tp.nguoi_nhan, loai: 'Khó khăn', noi_dung: 'Thiếu số liệu tháng 10' });
    assert.equal(r.status, 201);
    const p = s.docPhieu(tp.ma);
    assert.equal(p.trang_thai, tp.trang_thai);
    const k = p.nhat_ky[p.nhat_ky.length - 1];
    assert.equal(k.hanh_dong, 'Phản hồi');
    assert.equal(k.loai, 'Khó khăn');
    assert.equal(k.ghi_chu, 'Thiếu số liệu tháng 10');
    assert.equal(k.ai, tp.nguoi_nhan);
  });

  await t.test('CEO tra loi duoc', async () => {
    const r = await s.goi(`/api/phieu/${tp.ma}/phan-hoi`, { ai: 'CEO', loai: 'Trả lời', noi_dung: 'Lấy số liệu tạm' });
    assert.equal(r.status, 201);
  });

  await t.test('phan hoi rong 400', async () => {
    const r = await s.goi(`/api/phieu/${tp.ma}/phan-hoi`, { ai: 'CEO', loai: 'Hỏi lại', noi_dung: '   ' });
    assert.equal(r.status, 400);
  });

  await t.test('phan hoi dai hon 2000 ky tu 400', async () => {
    const r = await s.goi(`/api/phieu/${tp.ma}/phan-hoi`, { ai: 'CEO', loai: 'Hỏi lại', noi_dung: 'a'.repeat(2001) });
    assert.equal(r.status, 400);
  });

  await t.test('loai khong hop le 400', async () => {
    const r = await s.goi(`/api/phieu/${tp.ma}/phan-hoi`, { ai: 'CEO', loai: 'Khen', noi_dung: 'x' });
    assert.equal(r.status, 400);
  });

  await t.test('vai khong lien quan 403', async () => {
    const r = await s.goi(`/api/phieu/${tp.ma}/phan-hoi`, { ai: 'KD-TP', loai: 'Hỏi lại', noi_dung: 'x' });
    assert.equal(r.status, 403);
  });

  await t.test('chuyen vien khong duoc Tra loi 403', async () => {
    const r = await s.goi(`/api/phieu/${cv.ma}/phan-hoi`, { ai: cv.nguoi_nhan, loai: 'Trả lời', noi_dung: 'x' });
    assert.equal(r.status, 403);
  });

  await t.test('chuyen vien bao cao duoc', async () => {
    const r = await s.goi(`/api/phieu/${cv.ma}/phan-hoi`, { ai: cv.nguoi_nhan, loai: 'Báo cáo tiến độ', noi_dung: 'Xong 50%' });
    assert.equal(r.status, 201);
  });

  await t.test('phieu khong ton tai 404', async () => {
    const r = await s.goi('/api/phieu/PH-9999/phan-hoi', { ai: 'CEO', loai: 'Hỏi lại', noi_dung: 'x' });
    assert.equal(r.status, 404);
  });
});
