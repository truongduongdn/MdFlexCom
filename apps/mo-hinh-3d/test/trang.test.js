'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { khoiDong } = require('./tro-giup');

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const kichBan = (html) => [...html.split('\r').join('').matchAll(/<script>\n([\s\S]*?)<\/script>/g)].map((m) => m[1]);

test('trang Buong dieu hanh', async (t) => {
  const s = await khoiDong({ coCau: 'vien-gut' });
  t.after(() => s.dung());

  await t.test('dieu-hanh.html nap co cau va script hop le', async () => {
    const r = await s.goi('/dieu-hanh.html');
    assert.equal(r.status, 200);
    assert.match(r.text, /<script src="\/co-cau\.js"><\/script>/);
    const ds = kichBan(r.text);
    assert.ok(ds.length >= 1);
    for (const k of ds) assert.doesNotThrow(() => new AsyncFunction(k));
    for (const api of ['/api/muc-tieu', '/api/truong-phong', '/phan-hoi', '/danh-gia', '/giao', '/gan-phieu', '/tien-do']) assert.ok(r.text.includes(api), 'thiếu ' + api);
  });

  await t.test('Bang CEO va trang chu co lien ket', async () => {
    assert.match((await s.goi('/ceo.html')).text, /href="\/dieu-hanh\.html"/);
    assert.match((await s.goi('/')).text, /href="\/dieu-hanh\.html"/);
  });
});
