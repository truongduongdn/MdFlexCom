'use strict';
// Kiểm thử cho các lỗi tìm thấy ở vòng rà soát cuối (xem .superpowers ledger "Final:")
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { khoiDong, giaoMau } = require('./tro-giup');

const PUB = path.join(__dirname, '..', 'public');
const docTrang = (f) => fs.readFileSync(path.join(PUB, f), 'utf8').split('\r').join('');
const hamTrong = (src, ten) => { const i = src.indexOf('function ' + ten + '('); assert.ok(i >= 0, 'thiếu hàm ' + ten); const j = src.indexOf('\nfunction ', i + 1); return src.slice(i, j < 0 ? undefined : j); };
const mt = (them = {}) => ({ ai: 'CEO', ten: 'Quy trình', ky: { loai: 'quy', tu: '2026-10-01', den: '2099-12-31', ten: 'Q4/2026' }, don_vi: ['p-kt', 'pk'], ...them });
const dot = (them = {}) => ({ ai: 'CEO', muc_tieu: 'Soạn quy trình', dau_vao: 'Không có', dau_ra: 'Tài liệu', tieu_chi: ['Đủ'], uu_tien: 'P2', cong: 'Không có', tep: [], ...them });
const lui = (s, ma, gio) => { const p = s.docPhieu(ma); p.tao_luc = new Date(Date.now() - gio * 3600e3).toISOString(); s.ghiPhieu(p); };

test('1. Bang CEO khong coi phan hoi la doi trang thai', () => {
  const src = docTrang('ceo.html');
  assert.equal(src.includes('x.nhat_ky[x.nhat_ky.length-1]'), false, 'ceo.html còn đọc mục nhật ký cuối (phản hồi sẽ làm sai "chờ bao lâu")');
  assert.match(src, /hanh_dong\s*!==\s*"Phản hồi"|\.den\b/);
});

test('2. Buong dieu hanh: phieu gan tai lai, form chua luu khong bi ve lai', () => {
  const src = docTrang('dieu-hanh.html');
  assert.match(hamTrong(src, 'veTrienKhai'), /taiPhieuGan\(\)/);
  assert.match(src, /\$\("#chinh"\)\.addEventListener\("input",[^\n]*S\.ban\s*=\s*true/);
  assert.match(hamTrong(src, 'tai'), /S\.ban/);
});

test('rà soát: muc-tieu', async (t) => {
  const s = await khoiDong({ coCau: 'vien-gut' });
  t.after(() => s.dung());

  await t.test('3. bo don vi dang duoc tham chieu 409, khong tham chieu thi duoc', async () => {
    await s.goi('/api/muc-tieu', mt({ don_vi: ['p-kt', 'pk', 'ttnc', 'hcqt'], ke_hoach: [{ ten: 'Nháp', han: '2026-12-02', don_vi: 'p-kt', xong: false }] }));
    const bo = (dv) => s.goi('/api/muc-tieu/MT-0001/sua', { ai: 'CEO', don_vi: dv, ly_do: 'Thu hẹp' });
    assert.equal((await bo(['pk', 'ttnc', 'hcqt'])).status, 409); // p-kt có mốc
    await s.goi('/api/muc-tieu/MT-0001/giao', dot({ phong: ['pk'] }));
    assert.equal((await bo(['p-kt', 'ttnc', 'hcqt'])).status, 409); // pk đã nhận phiếu
    await s.goi('/api/muc-tieu/MT-0001/danh-gia', { ai: 'CEO', phong: 'ttnc', ket_qua: 'Đạt', diem: 4 });
    assert.equal((await bo(['p-kt', 'pk', 'hcqt'])).status, 409); // ttnc đã có đánh giá
    const ok = await bo(['p-kt', 'pk', 'ttnc']); // hcqt không bị tham chiếu
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.json.don_vi, ['p-kt', 'pk', 'ttnc']);
  });

  await t.test('4. tien-do chi tich moc, ghi thuc te, them moc; nhat ky ghi cu → moi', async () => {
    await s.goi('/api/muc-tieu', mt({ chi_so: [{ ten: 'Số phòng nộp', chi_tieu: '2/2' }], ke_hoach: [{ ten: 'Nộp nháp', han: '2026-12-02', xong: false }] }));
    const doiTen = await s.goi('/api/muc-tieu/MT-0002/tien-do', { ai: 'CEO', chi_so: [{ ten: 'Tên khác', chi_tieu: '2/2', thuc_te: '1/2' }] });
    assert.equal(doiTen.status, 400);
    const xoaMoc = await s.goi('/api/muc-tieu/MT-0002/tien-do', { ai: 'CEO', ke_hoach: [] });
    assert.equal(xoaMoc.status, 400);
    const doiHan = await s.goi('/api/muc-tieu/MT-0002/tien-do', { ai: 'CEO', ke_hoach: [{ ten: 'Nộp nháp', han: '2026-12-30', xong: false }] });
    assert.equal(doiHan.status, 400);
    const r = await s.goi('/api/muc-tieu/MT-0002/tien-do', { ai: 'CEO',
      ke_hoach: [{ ten: 'Nộp nháp', han: '2026-12-02', xong: true }, { ten: 'Duyệt', han: '2026-12-10', xong: false }],
      chi_so: [{ ten: 'Số phòng nộp', chi_tieu: '2/2', thuc_te: '1/2' }] });
    assert.equal(r.status, 200);
    const g = r.json.nhat_ky[r.json.nhat_ky.length - 1].ghi_chu;
    assert.match(g, /Nộp nháp: chưa xong → xong/);
    assert.match(g, /thêm mốc Duyệt/);
    assert.match(g, /Số phòng nộp: — → 1\/2/);
  });

  await t.test('5. buoc lay tu phieu la', async () => {
    await s.goi('/api/muc-tieu', mt({ don_vi: ['p-kt'] }));
    const g = await s.goi('/api/muc-tieu/MT-0003/giao', dot());
    const la = g.json.giao.phieu.map(s.docPhieu).find((p) => p.nguoi_giao === 'P-KT-TP');
    let x = (await s.goi('/api/muc-tieu/MT-0003')).json.don_vi_chi_tiet[0];
    assert.equal(x.buoc, 'Đã nhận');
    la.trang_thai = 'Chờ nghiệm thu'; s.ghiPhieu(la);
    x = (await s.goi('/api/muc-tieu/MT-0003')).json.don_vi_chi_tiet[0];
    assert.equal(x.buoc, 'Chờ nghiệm thu');
  });

  await t.test('6. im lang tinh moi phieu mo cua phong, bo qua Cho CEO duyet', async () => {
    await s.goi('/api/muc-tieu', mt({ don_vi: ['cn-nt'] }));
    await s.goi('/api/muc-tieu/MT-0004/giao', dot());
    const ngoai = await s.goi('/api/giao-viec', giaoMau(['cn-nt']));      // phiếu của phòng, không gắn mục tiêu
    const tp = ngoai.json.phieu.map(s.docPhieu).find((p) => p.nguoi_giao === 'TL-DP');
    lui(s, tp.ma, 49);
    const dv = async () => (await s.goi('/api/muc-tieu/MT-0004')).json.don_vi_chi_tiet[0];
    assert.equal((await dv()).im_lang, true);
    const p = s.docPhieu(tp.ma); p.trang_thai = 'Chờ CEO duyệt'; s.ghiPhieu(p);
    for (const ma of ngoai.json.phieu) if (ma !== tp.ma) { const q = s.docPhieu(ma); q.trang_thai = 'Xong'; q.xong_luc = new Date().toISOString(); s.ghiPhieu(q); }
    const goc = s.docPhieu(ngoai.json.goc); goc.tao_luc = new Date().toISOString(); s.ghiPhieu(goc);
    assert.equal((await dv()).im_lang, false);
    const the = (await s.goi('/api/truong-phong')).json.find((x) => x.phong === 'cn-nt');
    assert.equal(the.im_lang, false);
  });
});

test('7. Do kem ai_lam_ngay khong goi Claude ke ca khi co khoa', async () => {
  const s = await khoiDong({ coCau: 'vien-gut', env: { ANTHROPIC_API_KEY: 'sk-ant-thu-nghiem', ANTHROPIC_BASE_URL: 'http://127.0.0.1:9' } });
  try {
    await s.goi('/api/muc-tieu', mt({ don_vi: ['p-kt'], muc_du_lieu: 'Đỏ' }));
    const r = await s.goi('/api/muc-tieu/MT-0001/giao', dot({ ai_lam_ngay: true }));
    assert.equal(r.status, 201);
    assert.deepEqual(r.json.giao.ai_chay, []);
    // Đối chứng: mức Vàng thì có chạy (chứng minh bài này hỏng được nếu bỏ kiểm Đỏ)
    await s.goi('/api/muc-tieu', mt({ don_vi: ['p-kt'], muc_du_lieu: 'Vàng' }));
    const v = await s.goi('/api/muc-tieu/MT-0002/giao', dot({ ai_lam_ngay: true }));
    assert.ok(v.json.giao.ai_chay.length > 0);
  } finally { await s.dung(); }
});
