'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { khoiDong } = require('./tro-giup');

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const kichBan = (html) => [...html.split('\r').join('').matchAll(/<script>\n([\s\S]*?)<\/script>/g)].map((m) => m[1]);

test('trang Phong: bang phieu viec va xem toan man hinh', async (t) => {
  const s = await khoiDong();
  t.after(() => s.dung());
  const r = await s.goi('/phong.html');

  await t.test('script hop le', () => {
    assert.equal(r.status, 200);
    for (const k of kichBan(r.text)) assert.doesNotThrow(() => new AsyncFunction(k));
  });

  await t.test('co nut toan man hinh va che do full', () => {
    assert.match(r.text, /id="fullBtn"/);
    assert.match(r.text, /\.app\.full/);
    assert.match(r.text, /Escape/);
  });

  await t.test('cot trong thu gon, bang khong cuon ngang', () => {
    assert.match(r.text, /\.col\.thu/);
    assert.doesNotMatch(r.text, /grid-auto-columns:minmax\(232px,1fr\)/);
  });

  await t.test('chi tiet phieu chia hai cot khi toan man hinh', () => {
    assert.match(r.text, /class="pp-a"/);
    assert.match(r.text, /class="pp-b"/);
  });
});
