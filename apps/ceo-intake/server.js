// Khung chat nhận Phiếu yêu cầu của CEO — máy chủ Node thuần, không cần npm install.
// Chạy: node server.js   → mở http://localhost:3100
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3100;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const CONFIG_DIR = path.join(ROOT, 'config');
const DATA_DIR = path.join(ROOT, 'data');
const PHIEU_DIR = path.join(DATA_DIR, 'phieu');
const GIAO_VIEC_DIR = path.join(DATA_DIR, 'giao-viec');
const COUNTER_FILE = path.join(DATA_DIR, 'counter.json');

for (const d of [DATA_DIR, PHIEU_DIR, GIAO_VIEC_DIR]) fs.mkdirSync(d, { recursive: true });

// ---------- Danh sách trường của phiếu (thứ tự = thứ tự in ra phiếu) ----------
const FIELDS = [
  { key: 'soPhieu', label: 'Số phiếu', auto: true },
  { key: 'tenViec', label: 'Tên việc ngắn' },
  { key: 'loaiViec', label: 'Loại việc', type: 'select', hint: 'A–K theo mục 3' },
  { key: 'mucRuiRo', label: 'Mức rủi ro', type: 'select', options: ['Xanh', 'Vàng', 'Đỏ'] },
  { key: 'nguon', label: 'Nguồn', hint: 'chỉ đạo ngày… / cuộc họp… / người giao' },
  { key: 'mucTieu', label: 'Mục tiêu', type: 'textarea', hint: 'kết quả mong muốn, vì sao cần' },
  { key: 'dauRa', label: 'Đầu ra', hint: 'loại tài liệu, định dạng, độ dài, số hiệu dự kiến' },
  { key: 'nguoiDungDauRa', label: 'Người dùng đầu ra', hint: 'ai đọc/dùng, để làm gì' },
  { key: 'nguoiDuyet', label: 'Người duyệt', hint: 'ai phê duyệt cuối' },
  { key: 'nguoiThucHien', label: 'Người thực hiện (chính)', type: 'donvi' },
  { key: 'phoiHop', label: 'Phối hợp', hint: 'bộ phận/người, hoặc "Không có"' },
  { key: 'han', label: 'Hạn chót', type: 'date' },
  { key: 'mocTrungGian', label: 'Mốc trung gian', hint: 'dàn ý / nháp / bản trình' },
  { key: 'phamViTrong', label: 'Phạm vi — Trong' },
  { key: 'phamViNgoai', label: 'Phạm vi — Ngoài' },
  { key: 'dauVao', label: 'Đầu vào sẵn có', type: 'textarea', hint: 'tài liệu, số liệu, văn bản tham chiếu' },
  { key: 'rangBuoc', label: 'Ràng buộc', hint: 'pháp lý / ngân sách / nhân sự / thời gian / điều cấm' },
  { key: 'tieuChi', label: 'Tiêu chí nghiệm thu', type: 'textarea', hint: '3–5 tiêu chí kiểm được, mỗi dòng một tiêu chí' },
  { key: 'ruiRoPhuThuoc', label: 'Rủi ro & phụ thuộc', hint: 'việc phải xong trước, ai có thể chặn' },
  { key: 'mucDuLieu', label: 'Mức dữ liệu', type: 'select', options: ['Xanh', 'Vàng', 'Đỏ'], hint: 'xem mục 5' },
  { key: 'luuTru', label: 'Lưu trữ', hint: 'thư mục nhóm việc, tên tệp' }
];

// ---------- Tiện ích ----------
const readJson = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
};
const writeJson = (file, obj) => fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8');
const norm = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasKw = (normText, kw) => new RegExp('(^|[^a-z0-9])' + escRe(norm(kw)) + '($|[^a-z0-9])').test(normText);
const pad = (n, w = 3) => String(n).padStart(w, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
const dmy = (d) => `${pad(d.getDate(), 2)}/${pad(d.getMonth() + 1, 2)}/${d.getFullYear()}`;
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const addWorkdays = (d, n) => {
  const r = new Date(d);
  while (n > 0) { r.setDate(r.getDate() + 1); if (r.getDay() !== 0 && r.getDay() !== 6) n--; }
  return r;
};
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'phieu';

const loadConfig = () => ({
  donVi: (readJson(path.join(CONFIG_DIR, 'don-vi.json'), {}).donVi || []),
  loaiViec: (readJson(path.join(CONFIG_DIR, 'loai-viec.json'), {}).loaiViec || []),
  nghiepVu: (readJson(path.join(CONFIG_DIR, 'danh-muc-nghiep-vu.json'), {}).nghiepVu || [])
});

const peekNumber = () => readJson(COUNTER_FILE, { next: 1 }).next;
const takeNumber = () => {
  const c = readJson(COUNTER_FILE, { next: 1 });
  // Không bao giờ cấp trùng số đã có tệp
  while (fs.existsSync(path.join(PHIEU_DIR, `V${pad(c.next)}.json`))) c.next++;
  const n = c.next; c.next = n + 1; writeJson(COUNTER_FILE, c); return n;
};

const donViLabel = (dv) => `${dv.ten} (${dv.ma})${dv.quanLy ? ' — ' + dv.quanLy : ' — chưa gán quản lý'}`;

function matchDonVi(normText, donVi) {
  const pairs = [];
  for (const dv of donVi) for (const kw of dv.tuKhoa || []) pairs.push({ dv, kw: norm(kw) });
  pairs.sort((a, b) => b.kw.length - a.kw.length);
  const found = [];
  for (const p of pairs) if (hasKw(normText, p.kw) && !found.includes(p.dv)) found.push(p.dv);
  return found;
}

// ---------- Đọc ngày trong câu ----------
const WEEKDAYS = { 'chu nhat': 0, 'thu hai': 1, 'thu ba': 2, 'thu tu': 3, 'thu nam': 4, 'thu sau': 5, 'thu bay': 6 };
function findDate(text) {
  const t0 = today();
  // Ngày ISO (YYYY-MM-DD) phải đọc trước, nếu không bộ đọc dd/mm sẽ bắt nhầm phần giữa chuỗi
  const iso = String(text).match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const d = new Date(+iso[1], +iso[2] - 1, +iso[3]);
    return d.getMonth() === +iso[2] - 1 && d.getDate() === +iso[3] ? d : null;
  }
  const m = String(text).match(/(\d{1,2})\s*[\/.\-]\s*(\d{1,2})(?:\s*[\/.\-]\s*(\d{2,4}))?/);
  if (m) {
    const dd = +m[1], mm = +m[2];
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
      let yy = m[3] ? +m[3] : t0.getFullYear();
      if (yy < 100) yy += 2000;
      let d = new Date(yy, mm - 1, dd);
      if (!m[3] && d < t0) d = new Date(yy + 1, mm - 1, dd);
      return d;
    }
  }
  const n = norm(text);
  if (hasKw(n, 'ngay mai')) { const d = new Date(t0); d.setDate(d.getDate() + 1); return d; }
  for (const [name, wd] of Object.entries(WEEKDAYS)) {
    if (hasKw(n, name)) {
      const d = new Date(t0);
      let diff = (wd - d.getDay() + 7) % 7; if (diff === 0) diff = 7;
      d.setDate(d.getDate() + diff);
      if (hasKw(n, name + ' tuan sau') && diff < 7) d.setDate(d.getDate() + 7);
      return d;
    }
  }
  return null;
}

// ---------- Đọc phiếu dán sẵn theo mẫu ----------
const LABEL_MAP = {
  'loai viec': 'loaiViec', 'muc rui ro': 'mucRuiRo', 'nguon': 'nguon', 'muc tieu': 'mucTieu',
  'dau ra': 'dauRa', 'nguoi dung dau ra': 'nguoiDungDauRa', 'nguoi duyet': 'nguoiDuyet',
  'nguoi thuc hien': 'nguoiThucHien', 'phoi hop': 'phoiHop', 'han': 'han', 'moc trung gian': 'mocTrungGian',
  'pham vi': 'phamVi', 'dau vao san co': 'dauVao', 'rang buoc': 'rangBuoc',
  'tieu chi nghiem thu': 'tieuChi', 'rui ro & phu thuoc': 'ruiRoPhuThuoc', 'rui ro va phu thuoc': 'ruiRoPhuThuoc',
  'muc du lieu': 'mucDuLieu', 'luu tru': 'luuTru'
};
const isPlaceholder = (v) => !v || /^[<…]/.test(v.trim()) || /^\.{3}$/.test(v.trim());

function parseTemplate(text) {
  const out = {};
  if (!/phi[eế]u y[eê]u c[aầ]u|^\s*(lo[aạ]i vi[eệ]c|m[uụ]c ti[eê]u)\s*:/im.test(text)) return out;
  let last = null;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const title = line.match(/PHI[EẾ]U Y[EÊ]U C[AẦ]U\s*[—\-–]\s*V?[^:]*:\s*(.+)$/i);
    if (title) { if (!isPlaceholder(title[1])) out.tenViec = title[1].trim(); last = null; continue; }
    if (/^c[aâ]u h[oỏ]i c[aầ]n x[aá]c nh[aậ]n/i.test(norm(line)) || /^cau hoi can xac nhan/.test(norm(line))) { last = null; continue; }
    // Một dòng có thể chứa 2 cặp "Nhãn: giá trị" ngăn bởi — hoặc khoảng trắng dài
    const segments = /^pham vi\s*:/.test(norm(line)) ? [line] : line.split(/\s+[—–]\s+|\s{3,}(?=[^\s:\d][^\s:]*(?: [^\s:]+){0,4}:\s)/);
    let matched = false;
    for (const seg of segments) {
      const m = seg.match(/^([^:]{2,40}):\s*(.*)$/);
      if (!m) continue;
      const key = LABEL_MAP[norm(m[1]).trim()];
      if (!key) continue;
      matched = true; last = key;
      const val = m[2].trim();
      if (key === 'phamVi') {
        const tr = val.match(/trong\s*:\s*([^|]*)/i); const ng = val.match(/ngo[aà]i\s*:\s*(.*)$/i);
        if (tr && !isPlaceholder(tr[1])) out.phamViTrong = tr[1].trim();
        if (ng && !isPlaceholder(ng[1])) out.phamViNgoai = ng[1].trim();
      } else if (key === 'mucRuiRo' || key === 'mucDuLieu') {
        const lv = ['Xanh', 'Vàng', 'Đỏ'].filter((x) => hasKw(norm(val), x));
        if (lv.length === 1) out[key] = lv[0];
      } else if (key === 'han') {
        const d = findDate(val); if (d) out.han = ymd(d);
      } else if (key === 'loaiViec') {
        const lm = val.match(/^\s*([A-K])\b/); if (lm) out.loaiViec = lm[1];
      } else if (!isPlaceholder(val)) out[key] = val;
    }
    if (!matched && last && !isPlaceholder(line)) {
      const cleaned = line.replace(/^[-•*\d.)\s]+/, '').trim();
      if (cleaned && ['tieuChi', 'mucTieu', 'dauVao', 'rangBuoc', 'ruiRoPhuThuoc'].includes(last)) {
        out[last] = out[last] ? out[last] + '\n' + cleaned : cleaned;
      }
    }
  }
  return out;
}

// ---------- Dựng phiếu nháp từ câu CEO gõ ----------
function buildDraft(text) {
  const cfg = loadConfig();
  const n = norm(text);
  const f = {};
  const set = (k, v, status = 'goiY') => { if (v != null && String(v).trim() !== '') f[k] = { value: String(v).trim(), status }; };

  const tpl = parseTemplate(text);
  const isTemplate = Object.keys(tpl).length >= 3;
  const so = peekNumber();
  set('soPhieu', 'V' + pad(so), 'auto');
  set('nguon', `Chỉ đạo CEO, ${dmy(today())}`);
  set('nguoiDuyet', 'CEO');

  let nv = null, dvs = [];
  if (!isTemplate) freeText();
  function freeText() {
  // Tên việc: câu đầu tiên, bỏ lời dẫn
  let ten = String(text).split(/[\n.!?]/)[0].replace(/\s+(để|nhằm)\s+.*$/i, '').replace(/[,;]?\s*(hạn|trước|deadline)\b.*$/i, '');
  ten = ten.replace(/^(anh|em|chị|hãy|làm ơn|nhờ|cần|yêu cầu|giao)\s+/i, '').trim();
  if (ten.length > 80) ten = ten.slice(0, 77).trim() + '…';
  if (ten && !/^phieu yeu cau/.test(norm(ten))) set('tenViec', ten.charAt(0).toUpperCase() + ten.slice(1));

  const de = String(text).match(/\s(để|nhằm)\s+([^.\n]+)/i);
  if (de) set('mucTieu', de[1].charAt(0).toUpperCase() + de[1].slice(1) + ' ' + de[2].trim());

  // Nghiệp vụ và đơn vị
  nv = cfg.nghiepVu.find((x) => (x.tuKhoa || []).some((kw) => hasKw(n, kw)));
  dvs = matchDonVi(n, cfg.donVi);
  const byMa = (ma) => cfg.donVi.find((d) => d.ma === ma);
  if (nv) {
    const chuTri = byMa(nv.donViChuTri);
    if (chuTri) set('nguoiThucHien', donViLabel(chuTri));
    const ph = (nv.phoiHop || []).map(byMa).filter(Boolean).map((d) => d.ten);
    if (ph.length) set('phoiHop', ph.join(', '));
    set('phamViTrong', `Nghiệp vụ ${nv.ten} (${nv.ma})`);
    set('dauVao', `Hồ sơ công việc đang mở của ${nv.ma}; SOP và biểu mẫu liên kết trong kho văn bản`);
  } else if (dvs.length) {
    set('nguoiThucHien', donViLabel(dvs[0]));
    if (dvs.length > 1) set('phoiHop', dvs.slice(1).map((d) => d.ten).join(', '));
  }

  // Đầu ra & tiêu chí
  let loaiDauRa = null;
  if (hasKw(n, 'bao cao')) loaiDauRa = 'baoCao';
  else if (hasKw(n, 'to trinh')) loaiDauRa = 'toTrinh';
  else if (hasKw(n, 'ke hoach')) loaiDauRa = 'keHoach';
  else if (hasKw(n, 'quy trinh') || hasKw(n, 'sop')) loaiDauRa = 'sop';
  const DAU_RA = {
    baoCao: ['Báo cáo (Word/PDF), 1–3 trang', 'Nêu tiến độ từng bước và người phụ trách\nChỉ rõ việc quá hạn, số ngày trễ và nguyên nhân\nCó mục đề xuất cần CEO quyết định'],
    toTrinh: ['Tờ trình (Word/PDF), 1–2 trang', 'Nêu rõ vấn đề, phương án và chi phí\nCó căn cứ pháp lý hoặc quy định nội bộ\nCó đề xuất cụ thể để CEO duyệt'],
    keHoach: ['Kế hoạch (Word/Excel)', 'Có mốc thời gian và người phụ trách từng việc\nCó nguồn lực và ngân sách dự kiến\nCó rủi ro chính và phương án dự phòng'],
    sop: ['SOP (Word), có sơ đồ các bước', 'Mỗi bước có người làm, đầu vào, đầu ra\nCó SLA từng bước\nCó biểu mẫu đi kèm']
  };
  if (loaiDauRa) { set('dauRa', DAU_RA[loaiDauRa][0]); set('tieuChi', DAU_RA[loaiDauRa][1]); }

  if (hasKw(n, 'giao ban')) set('nguoiDungDauRa', 'CEO và các trưởng đơn vị, dùng tại họp giao ban');
  else if (hasKw(n, 'hdtv') || hasKw(n, 'hoi dong thanh vien')) set('nguoiDungDauRa', 'Hội đồng thành viên, để ra quyết định');

  // Hạn
  const d = findDate(text);
  if (d) set('han', ymd(d), 'goiY');
  else if (nv && loaiDauRa === 'baoCao' && nv.slaNgayBaoCao) set('han', ymd(addWorkdays(today(), nv.slaNgayBaoCao)));
  if (f.han && loaiDauRa) {
    const hd = new Date(f.han.value + 'T00:00:00');
    const moc = new Date(hd);
    do { moc.setDate(moc.getDate() - 1); } while (moc.getDay() === 0 || moc.getDay() === 6);
    if (moc > today()) set('mocTrungGian', `Bản nháp ngày ${dmy(moc)}`);
  }

  // Mức rủi ro (gợi ý, CEO chốt)
  const DO = ['chi tien', 'thanh toan', 'ky hop dong', 'dang cong khai', 'bao chi', 'gui ra ngoai', 'xoa du lieu', 'giay phep', 'phap ly', 'thanh tra'];
  const XANH = ['noi bo', 'tong hop', 'thong ke'];
  if (DO.some((k) => hasKw(n, k))) set('mucRuiRo', 'Đỏ');
  else if (XANH.some((k) => hasKw(n, k)) && !nv) set('mucRuiRo', 'Xanh');
  else set('mucRuiRo', 'Vàng');

  // Mức dữ liệu (gợi ý)
  const DL_DO = ['luong', 'benh nhan', 'benh an', 'ho so nhan su', 'cccd', 'can cuoc', 'tai khoan ngan hang'];
  const DL_VANG = ['tai chinh', 'hop dong', 'gia', 'doanh thu', 'chi phi', 'chi tien', 'chi nhanh'];
  if (DL_DO.some((k) => hasKw(n, k))) set('mucDuLieu', 'Đỏ');
  else if (DL_VANG.some((k) => hasKw(n, k))) set('mucDuLieu', 'Vàng');
  else set('mucDuLieu', 'Xanh');

  // Loại việc nếu cấu hình có từ khoá
  const lv = cfg.loaiViec.find((x) => (x.tuKhoa || []).some((kw) => hasKw(n, kw)));
  if (lv) set('loaiViec', lv.ma);

  }

  // Phiếu dán theo mẫu: giá trị CEO tự gõ là đã xác nhận
  for (const [k, v] of Object.entries(tpl)) set(k, v, 'xacNhan');
  if (tpl.nguoiThucHien) {
    const m = matchDonVi(norm(tpl.nguoiThucHien), cfg.donVi);
    if (m.length) set('nguoiThucHien', donViLabel(m[0]), 'xacNhan');
  }

  if (f.tenViec) set('luuTru', `Phieu-yeu-cau/${today().getFullYear()}/V${pad(so)}-${slug(f.tenViec.value)}`, 'auto');

  for (const fd of FIELDS) if (!f[fd.key]) f[fd.key] = { value: '', status: 'thieu' };
  return { fields: f, nghiepVu: nv ? { ma: nv.ma, ten: nv.ten, viDu: !!nv.viDu } : null, donVi: dvs.map((x) => x.ma) };
}

// ---------- Tuỳ chọn: dùng Claude để đọc câu tự do (nếu có ANTHROPIC_API_KEY) ----------
async function aiExtract(text, cfg) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
  const keys = FIELDS.filter((x) => !x.auto && x.key !== 'luuTru').map((x) => `${x.key} (${x.label}${x.hint ? ': ' + x.hint : ''})`);
  const system = [
    'Bạn là Trợ lý điều phối. Đọc yêu cầu của CEO và trích các trường của Phiếu yêu cầu.',
    'Chỉ trả về một đối tượng JSON, không giải thích. Trường nào không suy ra được từ câu thì bỏ qua, KHÔNG bịa.',
    'han dạng YYYY-MM-DD. mucRuiRo, mucDuLieu chỉ nhận Xanh/Vàng/Đỏ. loaiViec chỉ nhận một chữ A–K.',
    'tieuChi: 3–5 dòng, mỗi dòng một tiêu chí kiểm được.',
    'Hôm nay: ' + ymd(today()),
    'Các trường: ' + keys.join('; '),
    'Loại việc: ' + cfg.loaiViec.map((x) => `${x.ma}=${x.ten}`).join('; '),
    'Đơn vị (dùng đúng tên): ' + cfg.donVi.filter((d) => !d.ngungHoatDong).map((d) => `${d.ma}=${d.ten}`).join('; ')
  ].join('\n');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 1500, system, messages: [{ role: 'user', content: text }] }),
      signal: ctrl.signal
    });
    if (!res.ok) return { error: `Claude API trả lỗi ${res.status}` };
    const j = await res.json();
    const out = (j.content || []).map((c) => c.text || '').join('');
    const m = out.match(/\{[\s\S]*\}/);
    return m ? { fields: JSON.parse(m[0]) } : null;
  } catch (e) {
    return { error: 'Không gọi được Claude API: ' + e.message };
  } finally { clearTimeout(timer); }
}

// ---------- Kiểm tra & phát hành ----------
function validate(fields) {
  const errors = [];
  for (const fd of FIELDS) {
    if (fd.auto) continue;
    const v = (fields[fd.key] && fields[fd.key].value || '').trim();
    if (!v) errors.push(`Thiếu: ${fd.label}`);
  }
  const han = fields.han && fields.han.value;
  if (han && !/^\d{4}-\d{2}-\d{2}$/.test(han)) errors.push('Hạn chót phải là ngày (YYYY-MM-DD)');
  else if (han && new Date(han + 'T00:00:00') < today()) errors.push('Hạn chót đã qua');
  const tc = (fields.tieuChi && fields.tieuChi.value || '').split(/\n/).map((s) => s.trim()).filter(Boolean);
  if (tc.length && (tc.length < 3 || tc.length > 5)) errors.push(`Tiêu chí nghiệm thu cần 3–5 dòng (đang có ${tc.length})`);
  for (const k of ['mucRuiRo', 'mucDuLieu']) {
    const v = fields[k] && fields[k].value;
    if (v && !['Xanh', 'Vàng', 'Đỏ'].includes(v)) errors.push(`${k === 'mucRuiRo' ? 'Mức rủi ro' : 'Mức dữ liệu'} chỉ nhận Xanh / Vàng / Đỏ`);
  }
  const lv = fields.loaiViec && fields.loaiViec.value;
  if (lv && !/^[A-K]$/.test(lv)) errors.push('Loại việc phải là một chữ từ A đến K');
  return errors;
}

function renderMarkdown(p) {
  const v = (k) => (p.fields[k] && p.fields[k].value) || '';
  const lv = loadConfig().loaiViec.find((x) => x.ma === v('loaiViec'));
  const hanD = v('han') ? dmy(new Date(v('han') + 'T00:00:00')) : '';
  const tc = v('tieuChi').split(/\n/).filter(Boolean).map((s, i) => `  ${i + 1}. ${s}`).join('\n');
  const lines = [
    `PHIẾU YÊU CẦU — ${p.soPhieu}: ${v('tenViec')}`,
    `Loại việc:            ${v('loaiViec')}${lv ? ' — ' + lv.ten : ''}          Mức rủi ro: ${v('mucRuiRo')}`,
    `Nguồn:                ${v('nguon')}`,
    `Mục tiêu:             ${v('mucTieu')}`,
    `Đầu ra:               ${v('dauRa')}`,
    `Người dùng đầu ra:    ${v('nguoiDungDauRa')}`,
    `Người duyệt:          ${v('nguoiDuyet')}`,
    `Người thực hiện:      ${v('nguoiThucHien')} — Phối hợp: ${v('phoiHop')}`,
    `Hạn:                  ${hanD} — Mốc trung gian: ${v('mocTrungGian')}`,
    `Phạm vi:              Trong: ${v('phamViTrong')} | Ngoài: ${v('phamViNgoai')}`,
    `Đầu vào sẵn có:       ${v('dauVao')}`,
    `Ràng buộc:            ${v('rangBuoc')}`,
    `Tiêu chí nghiệm thu:`,
    tc,
    `Rủi ro & phụ thuộc:   ${v('ruiRoPhuThuoc')}`,
    `Mức dữ liệu:          ${v('mucDuLieu')}`,
    `Lưu trữ:              ${v('luuTru')}`,
    `CÂU HỎI CẦN XÁC NHẬN (tối đa 5, kèm phương án gợi ý):`
  ];
  const qs = (p.cauHoi || []).slice(0, 5);
  if (!qs.length) lines.push('  (không có)');
  qs.forEach((q, i) => lines.push(`  ${i + 1}. ${q.text}${q.options && q.options.length ? ' [' + q.options.join(' / ') + ']' : ''} → ${q.answer || '(chưa trả lời)'}`));
  lines.push('', `Phát hành: ${new Date(p.phatHanhLuc).toLocaleString('vi-VN')} · Trạng thái: ${p.trangThai}`);
  return '```\n' + lines.join('\n') + '\n```\n';
}

function issue(body) {
  const fields = body.fields || {};
  const errors = validate(fields);
  if (errors.length) return { status: 400, body: { errors } };
  const so = 'V' + pad(takeNumber());
  fields.soPhieu = { value: so, status: 'auto' };
  if (fields.luuTru && fields.luuTru.value) fields.luuTru.value = fields.luuTru.value.replace(/\bV\d{3,}\b/, so);
  const now = new Date();
  const p = {
    soPhieu: so,
    fields,
    cauHoi: Array.isArray(body.cauHoi) ? body.cauHoi.slice(0, 5) : [],
    nghiepVu: body.nghiepVu || null,
    trangThai: 'Đã phát hành',
    phatHanhLuc: now.toISOString(),
    khongDuaNoiDungVaoAgent: (fields.mucDuLieu && fields.mucDuLieu.value) === 'Đỏ',
    canCeoDuyetCacCong: (fields.mucRuiRo && fields.mucRuiRo.value) === 'Đỏ'
  };
  writeJson(path.join(PHIEU_DIR, so + '.json'), p);
  fs.writeFileSync(path.join(PHIEU_DIR, so + '.md'), renderMarkdown(p), 'utf8');
  const gv = {
    ma: 'GV-' + so, loai: 'Giao việc', phieuGoc: so,
    nguoiNhan: fields.nguoiThucHien.value, phoiHop: fields.phoiHop.value,
    mucTieu: fields.mucTieu.value, dauRa: fields.dauRa.value, han: fields.han.value,
    tieuChiNghiemThu: fields.tieuChi.value.split(/\n/).filter(Boolean),
    canCeoDuyetCacCong: p.canCeoDuyetCacCong, trangThai: 'Mới', taoLuc: now.toISOString()
  };
  writeJson(path.join(GIAO_VIEC_DIR, gv.ma + '.json'), gv);
  return { status: 200, body: { soPhieu: so, file: `data/phieu/${so}.md`, giaoViec: `data/giao-viec/${gv.ma}.json` } };
}

function listPhieu() {
  return fs.readdirSync(PHIEU_DIR).filter((f) => f.endsWith('.json')).sort().reverse().map((f) => {
    const p = readJson(path.join(PHIEU_DIR, f), null);
    if (!p) return null;
    const v = (k) => (p.fields[k] && p.fields[k].value) || '';
    return { soPhieu: p.soPhieu, tenViec: v('tenViec'), nguoiThucHien: v('nguoiThucHien'), han: v('han'), mucRuiRo: v('mucRuiRo'), trangThai: p.trangThai, phatHanhLuc: p.phatHanhLuc };
  }).filter(Boolean);
}

// ---------- HTTP ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const send = (res, status, obj) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
const readBody = (req) => new Promise((resolve, reject) => {
  let s = ''; req.on('data', (c) => { s += c; if (s.length > 2e6) req.destroy(); });
  req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
  req.on('error', reject);
});

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;
    if (p === '/api/schema' && req.method === 'GET') {
      const cfg = loadConfig();
      return send(res, 200, {
        fields: FIELDS, loaiViec: cfg.loaiViec,
        donVi: cfg.donVi.map((d) => ({ ma: d.ma, ten: d.ten, quanLy: d.quanLy, ngungHoatDong: !!d.ngungHoatDong, tuKhoa: d.tuKhoa, label: donViLabel(d) })),
        ai: !!process.env.ANTHROPIC_API_KEY, today: ymd(today())
      });
    }
    if (p === '/api/draft' && req.method === 'POST') {
      const body = await readBody(req);
      const text = String(body.text || '').slice(0, 20000);
      const draft = buildDraft(text);
      let aiNote = null;
      // Dữ liệu Đỏ: không gửi nội dung ra dịch vụ bên ngoài (đặc tả: chỉ đưa thông tin mô tả vào agent)
      const isRed = draft.fields.mucDuLieu && draft.fields.mucDuLieu.value === 'Đỏ';
      const ai = isRed ? null : await aiExtract(text, loadConfig());
      if (isRed && process.env.ANTHROPIC_API_KEY) aiNote = 'Mức dữ liệu Đỏ: không gửi nội dung cho Claude, chỉ dùng quy tắc nội bộ.';
      if (ai && ai.error) aiNote = ai.error;
      else if (ai && ai.fields) {
        for (const fd of FIELDS) {
          const val = ai.fields[fd.key];
          if (fd.auto || val == null || String(val).trim() === '') continue;
          if (draft.fields[fd.key].status === 'xacNhan') continue;
          draft.fields[fd.key] = { value: Array.isArray(val) ? val.join('\n') : String(val).trim(), status: 'goiY' };
        }
        aiNote = 'Đã dùng Claude để đọc yêu cầu.';
      }
      return send(res, 200, { ...draft, aiNote });
    }
    if (p === '/api/phieu' && req.method === 'POST') {
      const r = issue(await readBody(req));
      return send(res, r.status, r.body);
    }
    if (p === '/api/phieu' && req.method === 'GET') return send(res, 200, listPhieu());
    const m = p.match(/^\/api\/phieu\/(V\d{3,})$/);
    if (m && req.method === 'GET') {
      const f = path.join(PHIEU_DIR, m[1] + '.json');
      if (!fs.existsSync(f)) return send(res, 404, { error: 'Không có phiếu' });
      return send(res, 200, { ...readJson(f, {}), markdown: fs.readFileSync(path.join(PHIEU_DIR, m[1] + '.md'), 'utf8') });
    }
    // Tệp tĩnh
    const rel = p === '/' ? 'index.html' : decodeURIComponent(p).replace(/^\/+/, '');
    const file = path.resolve(PUBLIC_DIR, rel);
    if (!file.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Không tìm thấy');
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

if (require.main === module) {
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Khung chat Phiếu yêu cầu đang chạy: http://localhost:${PORT}`);
    console.log(process.env.ANTHROPIC_API_KEY ? 'Chế độ: có Claude đọc câu tự do.' : 'Chế độ: quy tắc (chưa đặt ANTHROPIC_API_KEY).');
  });
}
module.exports = { buildDraft, parseTemplate, validate, findDate };
