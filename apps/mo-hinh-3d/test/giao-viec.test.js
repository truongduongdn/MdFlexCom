'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { khoiDong, giaoMau } = require('./tro-giup');

test('giao viec khong gan muc tieu giu nguyen', async () => {
  const s = await khoiDong();
  try {
    const r = await s.goi('/api/giao-viec', giaoMau(['kt']));
    assert.equal(r.status, 201);
    assert.equal(r.json.phieu.length, 3);
    const goc = s.docPhieu(r.json.goc);
    assert.equal('ma_muc_tieu' in goc, false);
    assert.equal(goc.nguoi_giao, 'CEO');
    assert.equal(goc.nguoi_nhan, 'TL-DP');
  } finally { await s.dung(); }
});
