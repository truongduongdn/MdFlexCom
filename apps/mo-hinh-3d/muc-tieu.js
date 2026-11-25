// Buồng điều hành CEO: hồ sơ Mục tiêu (data/muc-tieu/MT-####.json) nối xuống phiếu.
// Thiết kế: thiet-ke/buong-dieu-hanh-ceo.md. Module nhận các hàm dùng chung của server.js qua tham số.
'use strict';
const fs = require('fs');
const path = require('path');

const TRANG_THAI = ['Nháp', 'Đang triển khai', 'Chờ đánh giá', 'Đã đánh giá', 'Huỷ'];
const LOAI_KY = ['thang', 'quy', 'nam'];
const MUC_DL = ['Xanh', 'Vàng', 'Đỏ'];
const KET_QUA = ['Đạt', 'Đạt một phần', 'Không đạt'];
const GIO_IM_LANG = 48;

function taoModuleMucTieu(dep) {
  const { ROOT, CO_CAU, phongCfg, readBody, send } = dep;
  const DIR = path.join(ROOT, 'data', 'muc-tieu');
  fs.mkdirSync(DIR, { recursive: true });

  const chu = (v) => (typeof v === 'string' ? v.trim() : '');
  const doc = (ma) => { try { return JSON.parse(fs.readFileSync(path.join(DIR, ma + '.json'), 'utf8')); } catch { return null; } };
  const ghi = (mt) => fs.writeFileSync(path.join(DIR, mt.ma + '.json'), JSON.stringify(mt, null, 2), 'utf8');
  const tatCa = () => fs.readdirSync(DIR).filter((f) => /^MT-\d+\.json$/.test(f)).sort().map((f) => doc(f.slice(0, -5))).filter(Boolean);
  const maMoi = () => {
    const n = fs.readdirSync(DIR).map((f) => /^MT-(\d+)\.json$/.exec(f)).filter(Boolean).map((x) => Number(x[1]));
    return 'MT-' + String((n.length ? Math.max(...n) : 0) + 1).padStart(4, '0');
  };
  const laNgay = (s) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
    const d = new Date(s + 'T00:00:00Z');
    return !isNaN(d) && d.toISOString().slice(0, 10) === s;
  };
  const tenKy = (k) => {
    const [y, m] = k.tu.split('-').map(Number);
    return k.loai === 'nam' ? String(y) : k.loai === 'quy' ? `Q${Math.ceil(m / 3)}/${y}` : `T${m}/${y}`;
  };
  const nhatKy = (mt, ai, hanhDong, ghiChu, lyDo) => mt.nhat_ky.push({ luc: new Date().toISOString(), ai, hanh_dong: hanhDong, ghi_chu: ghiChu || undefined, ly_do: lyDo || undefined });
  const idPhong = () => new Set((phongCfg() || { phong: [] }).phong.map((p) => p.id));

  // ---------- Kiểm hợp lệ ----------
  function kiemKy(ky, loi) {
    if (!ky || !LOAI_KY.includes(ky.loai)) { loi.push('Kỳ phải là tháng, quý hoặc năm (loai: thang, quy, nam).'); return null; }
    if (!laNgay(ky.tu) || !laNgay(ky.den)) { loi.push('Ngày bắt đầu và kết thúc kỳ phải là ngày hợp lệ (YYYY-MM-DD).'); return null; }
    if (ky.den < ky.tu) { loi.push('Ngày kết thúc kỳ phải sau ngày bắt đầu.'); return null; }
    const k = { loai: ky.loai, tu: ky.tu, den: ky.den };
    k.ten = chu(ky.ten) || tenKy(k);
    return k;
  }
  function kiemDonVi(dv, loi) {
    const ds = [...new Set((Array.isArray(dv) ? dv : []).map(chu).filter(Boolean))];
    if (!ds.length) loi.push('Chọn ít nhất một đơn vị tham gia.');
    const co = idPhong();
    const la = ds.filter((x) => !co.has(x));
    if (la.length) loi.push(`Đơn vị không có trong cơ cấu đang chạy: ${la.join(', ')}.`);
    return ds;
  }
  const kiemChiSo = (cs) => (Array.isArray(cs) ? cs : []).map((c) => ({ ten: chu(c && c.ten), chi_tieu: chu(c && c.chi_tieu), thuc_te: chu(c && c.thuc_te) })).filter((c) => c.ten);
  function kiemKeHoach(kh, donVi, loi) {
    return (Array.isArray(kh) ? kh : []).map((m) => {
      const x = { ten: chu(m && m.ten), han: chu(m && m.han), don_vi: chu(m && m.don_vi) || null, xong: !!(m && m.xong) };
      if (!x.ten) loi.push('Mốc kế hoạch phải có tên.');
      if (!laNgay(x.han)) loi.push(`Hạn của mốc "${x.ten}" phải là ngày (YYYY-MM-DD).`);
      if (x.don_vi && !donVi.includes(x.don_vi)) loi.push(`Mốc "${x.ten}" gắn đơn vị ${x.don_vi} không thuộc mục tiêu.`);
      return x;
    });
  }

  // ---------- Quyền ----------
  // Trả lỗi đã gửi (true) nếu không được ghi
  function chanGhi(res, mt, b, trangThaiChoPhep) {
    if (chu(b.ai) !== 'CEO') { send(res, 403, { error: 'Chỉ CEO được thao tác mục tiêu.' }); return true; }
    if (mt && mt.co_cau !== CO_CAU) { send(res, 409, { error: `Mục tiêu ${mt.ma} thuộc cơ cấu "${mt.co_cau}", máy chủ đang chạy "${CO_CAU}". Chỉ xem được.` }); return true; }
    if (mt && trangThaiChoPhep && !trangThaiChoPhep.includes(mt.trang_thai)) { send(res, 409, { error: `Mục tiêu ${mt.ma} đang ở trạng thái ${mt.trang_thai}, không thao tác được.` }); return true; }
    return false;
  }
  const docBody = async (req, res) => { try { return await readBody(req); } catch (e) { send(res, 400, { error: e.message }); return null; } };

  // ---------- Route ----------
  async function tao(req, res) {
    const b = await docBody(req, res); if (!b) return;
    if (chanGhi(res, null, b)) return;
    const loi = [];
    const ten = chu(b.ten); if (!ten) loi.push('Thiếu tên mục tiêu.');
    const ky = kiemKy(b.ky, loi);
    const donVi = kiemDonVi(b.don_vi, loi);
    const mucDL = chu(b.muc_du_lieu) || 'Vàng'; if (!MUC_DL.includes(mucDL)) loi.push('Mức dữ liệu chỉ nhận Xanh, Vàng hoặc Đỏ.');
    const keHoach = kiemKeHoach(b.ke_hoach, donVi, loi);
    if (loi.length) return send(res, 400, { error: loi.join(' '), loi });
    const mt = {
      ma: maMoi(), ten, co_cau: CO_CAU, ky, ket_qua_can_dat: chu(b.ket_qua_can_dat), chi_so: kiemChiSo(b.chi_so),
      don_vi: donVi, muc_du_lieu: mucDL, ke_hoach: keHoach, phieu_goc: [], trang_thai: 'Nháp',
      danh_gia: {}, tong_ket: '', nhat_ky: [], tao_luc: new Date().toISOString()
    };
    nhatKy(mt, 'CEO', 'Tạo mục tiêu', `${mt.ten} · ${ky.ten} · ${donVi.join(', ')}`);
    ghi(mt);
    send(res, 201, mt);
  }

  const MO = ['Nháp', 'Đang triển khai', 'Chờ đánh giá'];
  async function sua(req, res, ma) {
    const b = await docBody(req, res); if (!b) return;
    const mt = doc(ma); if (!mt) return send(res, 404, { error: 'Không tìm thấy mục tiêu ' + ma + '.' });
    if (chanGhi(res, mt, b, MO)) return;
    const lyDo = chu(b.ly_do); if (!lyDo) return send(res, 400, { error: 'Sửa mục tiêu cần ghi lý do.' });
    const loi = [], doi = [];
    const moi = {};
    if (b.ten !== undefined) { moi.ten = chu(b.ten); if (!moi.ten) loi.push('Tên mục tiêu không được trống.'); }
    if (b.ket_qua_can_dat !== undefined) moi.ket_qua_can_dat = chu(b.ket_qua_can_dat);
    if (b.ky !== undefined) moi.ky = kiemKy(b.ky, loi);
    if (b.don_vi !== undefined) moi.don_vi = kiemDonVi(b.don_vi, loi);
    if (b.muc_du_lieu !== undefined) { moi.muc_du_lieu = chu(b.muc_du_lieu); if (!MUC_DL.includes(moi.muc_du_lieu)) loi.push('Mức dữ liệu chỉ nhận Xanh, Vàng hoặc Đỏ.'); }
    if (b.chi_so !== undefined) moi.chi_so = kiemChiSo(b.chi_so);
    if (loi.length) return send(res, 400, { error: loi.join(' '), loi });
    const hien = (v) => (v && typeof v === 'object' ? (v.ten && v.tu ? v.ten : JSON.stringify(v)) : String(v));
    for (const [k, v] of Object.entries(moi)) {
      if (JSON.stringify(mt[k]) === JSON.stringify(v)) continue;
      doi.push(`${k}: ${hien(mt[k])} → ${hien(v)}`); mt[k] = v;
    }
    if (!doi.length) return send(res, 400, { error: 'Không có gì thay đổi.' });
    nhatKy(mt, 'CEO', 'Sửa mục tiêu', doi.join('; '), lyDo);
    ghi(mt);
    send(res, 200, mt);
  }

  async function tienDo(req, res, ma) {
    const b = await docBody(req, res); if (!b) return;
    const mt = doc(ma); if (!mt) return send(res, 404, { error: 'Không tìm thấy mục tiêu ' + ma + '.' });
    if (chanGhi(res, mt, b, MO)) return;
    const loi = [];
    if (b.ke_hoach !== undefined) mt.ke_hoach = kiemKeHoach(b.ke_hoach, mt.don_vi, loi);
    if (b.chi_so !== undefined) mt.chi_so = kiemChiSo(b.chi_so);
    if (loi.length) return send(res, 400, { error: loi.join(' '), loi });
    const xong = mt.ke_hoach.filter((m) => m.xong).length;
    nhatKy(mt, 'CEO', 'Cập nhật kế hoạch/chỉ số', `${xong}/${mt.ke_hoach.length} mốc xong`);
    ghi(mt);
    send(res, 200, mt);
  }

  async function huy(req, res, ma) {
    const b = await docBody(req, res); if (!b) return;
    const mt = doc(ma); if (!mt) return send(res, 404, { error: 'Không tìm thấy mục tiêu ' + ma + '.' });
    if (chanGhi(res, mt, b, MO)) return;
    const lyDo = chu(b.ly_do); if (!lyDo) return send(res, 400, { error: 'Huỷ mục tiêu cần ghi lý do.' });
    nhatKy(mt, 'CEO', 'Huỷ mục tiêu', `${mt.trang_thai} → Huỷ`, lyDo);
    mt.trang_thai = 'Huỷ';
    ghi(mt);
    send(res, 200, mt);
  }

  // Trả true nếu đã xử lý
  async function xuLy(req, res, u) {
    if (u === '/api/muc-tieu' && req.method === 'GET') { send(res, 200, tatCa()); return true; }
    if (u === '/api/muc-tieu' && req.method === 'POST') { await tao(req, res); return true; }
    const m = /^\/api\/muc-tieu\/(MT-\d{4,})(?:\/([a-z-]+))?$/.exec(u);
    if (!m) return false;
    const [, ma, viec] = m;
    if (!viec && req.method === 'GET') { const mt = doc(ma); mt ? send(res, 200, mt) : send(res, 404, { error: 'Không tìm thấy mục tiêu ' + ma + '.' }); return true; }
    if (req.method !== 'POST') return false;
    const ham = { sua, 'tien-do': tienDo, huy }[viec];
    if (!ham) return false;
    await ham(req, res, ma);
    return true;
  }

  return { xuLy, _noiBo: { doc, ghi, tatCa, chu, nhatKy, chanGhi, docBody, laNgay, MO } };
}

module.exports = taoModuleMucTieu;
module.exports.HANG_SO = { TRANG_THAI, LOAI_KY, MUC_DL, KET_QUA, GIO_IM_LANG };
