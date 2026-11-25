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

  // ---------- Theo dõi đơn vị ----------
  const { tatCaPhieu, docPhieu, ghiPhieu, kemChiSo, danhBa, taoChuoiGiaoViec } = dep;
  const MUC_SO = { Xanh: 0, 'Vàng': 1, 'Đỏ': 2 };
  const DONG = ['Xong', 'Đã ngừng'];
  const homNay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function chiMuc(all) {
    const by = {}, con = {};
    all.forEach((p) => { by[p.ma] = p; if (p.phieu_cha) (con[p.phieu_cha] = con[p.phieu_cha] || []).push(p); });
    const hauDue = (p) => [p, ...(con[p.ma] || []).flatMap(hauDue)];
    return { by, con, hauDue };
  }
  // Phản hồi trong một danh sách phiếu, mới nhất trước (cùng thời điểm thì mục ghi sau đứng trước)
  const phanHoiTrong = (ds) => ds.flatMap((p) => p.nhat_ky.map((k, i) => ({ k, i, p })))
    .filter(({ k }) => k.hanh_dong === 'Phản hồi')
    .sort((a, b) => (b.k.luc.localeCompare(a.k.luc)) || (b.i - a.i))
    .map(({ k, p }) => ({ luc: k.luc, ai: k.ai, loai: k.loai, noi_dung: k.ghi_chu, ma_phieu: p.ma, phong: p.phong || null }));

  // Quy tắc chi tiết 1–3 trong thiết kế
  function tinhDonVi(mt, all) {
    const cfg = phongCfg() || { phong: [] }; const db = danhBa(cfg);
    const { by, con, hauDue } = chiMuc(all);
    const goc = mt.phieu_goc.map((m) => by[m]).filter(Boolean);
    const now = Date.now(), H = GIO_IM_LANG * 3600e3;
    return mt.don_vi.map((id) => {
      const tps = goc.flatMap((g) => (con[g.ma] || []).filter((x) => x.nguoi_giao === 'TL-DP' && x.phong === id));
      const chuoi = tps.flatMap(hauDue);
      const la = chuoi.filter((x) => x.loai !== 'Đề xuất' && x.trang_thai !== 'Đã ngừng' && !(con[x.ma] || []).some((c) => c.loai !== 'Đề xuất'));
      const mo = chuoi.filter((x) => !DONG.includes(x.trang_thai));
      const ph = phanHoiTrong(chuoi).filter((r) => db[r.ai] && db[r.ai].phong === id);
      const cuoi = ph[0] || null;
      const imLang = mo.some((x) => now - Date.parse(x.tao_luc) > H) && !(cuoi && now - Date.parse(cuoi.luc) <= H);
      const nhan = tps.map((x) => (x.nhat_ky.find((k) => k.den === 'Đã nhận') || {}).luc).filter(Boolean).sort()[0] || null;
      const p = cfg.phong.find((x) => x.id === id);
      return {
        phong: id, ten: p ? p.ten_ngan : id, truong_phong: p ? p.truong_phong.nguoi_that : null,
        phieu: tps.map((x) => x.ma), nhan_luc: nhan,
        trang_thai: tps.length ? tps[tps.length - 1].trang_thai : 'Chưa giao',
        xong: la.filter((x) => x.trang_thai === 'Xong').length, tong: la.length,
        qua_han: mo.some((x) => kemChiSo(x).qua_han), vuong: chuoi.some((x) => x.trang_thai === 'Vướng'),
        cho_ceo: chuoi.some((x) => x.trang_thai === 'Chờ CEO duyệt'),
        phan_hoi_cuoi: cuoi, so_phan_hoi: ph.length, im_lang: imLang
      };
    });
  }
  // Đang triển khai → Chờ đánh giá khi qua ngày kết thúc kỳ hoặc mọi phiếu gốc đã đóng
  function trangThaiTuDong(mt, by) {
    if (mt.trang_thai !== 'Đang triển khai') return false;
    const goc = mt.phieu_goc.map((m) => by[m]).filter(Boolean);
    const hetKy = homNay() > mt.ky.den;
    const xongHet = goc.length > 0 && goc.every((g) => DONG.includes(g.trang_thai));
    if (!hetKy && !xongHet) return false;
    nhatKy(mt, 'Hệ thống', 'Tự chuyển trạng thái', `Đang triển khai → Chờ đánh giá (${hetKy ? 'hết kỳ ' + mt.ky.ten : 'mọi phiếu gốc đã đóng'})`);
    mt.trang_thai = 'Chờ đánh giá';
    if (mt.co_cau === CO_CAU) ghi(mt);
    return true;
  }
  function chiTiet(mt, all) {
    all = all || tatCaPhieu();
    const { by, hauDue } = chiMuc(all);
    trangThaiTuDong(mt, by);
    const dv = tinhDonVi(mt, all);
    const goc = mt.phieu_goc.map((m) => by[m]).filter(Boolean);
    return {
      ...mt, don_vi_chi_tiet: dv, phan_hoi: phanHoiTrong(goc.flatMap(hauDue)),
      tom_tat: {
        xong: dv.reduce((a, x) => a + x.xong, 0), tong: dv.reduce((a, x) => a + x.tong, 0),
        qua_han: dv.filter((x) => x.qua_han).length, vuong: dv.filter((x) => x.vuong).length,
        im_lang: dv.filter((x) => x.im_lang).length, cho_ceo: dv.filter((x) => x.cho_ceo).length
      }
    };
  }

  async function giao(req, res, ma) {
    const b = await docBody(req, res); if (!b) return;
    const mt = doc(ma); if (!mt) return send(res, 404, { error: 'Không tìm thấy mục tiêu ' + ma + '.' });
    if (chanGhi(res, mt, b, MO)) return;
    const phong = Array.isArray(b.phong) && b.phong.length ? [...new Set(b.phong.map(chu))] : mt.don_vi.slice();
    const ngoai = phong.filter((x) => !mt.don_vi.includes(x));
    if (ngoai.length) return send(res, 400, { error: `Đơn vị ${ngoai.join(', ')} không thuộc mục tiêu ${mt.ma}. Sửa mục tiêu để thêm đơn vị trước.` });
    const mdl = chu(b.muc_du_lieu) || mt.muc_du_lieu;
    if (!MUC_DL.includes(mdl)) return send(res, 400, { error: 'Mức dữ liệu chỉ nhận Xanh, Vàng hoặc Đỏ.' });
    if (MUC_SO[mdl] < MUC_SO[mt.muc_du_lieu]) return send(res, 400, { error: `Mức dữ liệu của đợt (${mdl}) không được thấp hơn mức của mục tiêu (${mt.muc_du_lieu}).` });
    const r = taoChuoiGiaoViec({ ...b, phong, muc_du_lieu: mdl }, { maMucTieu: mt.ma });
    if (r.loi) return send(res, 400, { error: r.loi });
    mt.phieu_goc.push(r.goc);
    if (mt.trang_thai === 'Nháp') mt.trang_thai = 'Đang triển khai';
    nhatKy(mt, 'CEO', 'Giao đợt', `${r.goc} → ${phong.join(', ')}`);
    ghi(mt);
    send(res, 201, { muc_tieu: chiTiet(mt), giao: r });
  }

  async function ganPhieu(req, res, ma) {
    const b = await docBody(req, res); if (!b) return;
    const mt = doc(ma); if (!mt) return send(res, 404, { error: 'Không tìm thấy mục tiêu ' + ma + '.' });
    if (chanGhi(res, mt, b, MO)) return;
    const maP = chu(b.ma_phieu);
    const p = /^PH-\d{4,}$/.test(maP) ? docPhieu(maP) : null;
    if (!p) return send(res, 404, { error: 'Không tìm thấy phiếu ' + maP + '.' });
    const laGoc = !p.phieu_cha || p.phieu_cha === 'Không có'; // trường trống ghi "Không có" (AGENTS.md)
    if (!(p.nguoi_giao === 'CEO' && p.nguoi_nhan === 'TL-DP' && laGoc)) return send(res, 400, { error: 'Chỉ gắn được phiếu gốc CEO → Trợ lý điều phối.' });
    if (p.ma_muc_tieu) return send(res, 409, { error: `Phiếu ${maP} đã gắn mục tiêu ${p.ma_muc_tieu}.` });
    const co = idPhong();
    const dv = [...new Set(tatCaPhieu().filter((x) => x.phieu_cha === maP && x.nguoi_giao === 'TL-DP').map((x) => x.phong))];
    const la = dv.filter((x) => !co.has(x));
    if (la.length) return send(res, 409, { error: `Phiếu ${maP} giao cho đơn vị ngoài cơ cấu đang chạy: ${la.join(', ')}.` });
    p.ma_muc_tieu = mt.ma; ghiPhieu(p);
    const them = dv.filter((x) => !mt.don_vi.includes(x));
    mt.don_vi.push(...them);
    mt.phieu_goc.push(maP);
    if (mt.trang_thai === 'Nháp') mt.trang_thai = 'Đang triển khai';
    nhatKy(mt, 'CEO', 'Gắn phiếu', maP + (them.length ? ` · thêm đơn vị ${them.join(', ')}` : ''));
    ghi(mt);
    send(res, 200, chiTiet(mt));
  }

  // Trả true nếu đã xử lý
  async function xuLy(req, res, u) {
    if (u === '/api/muc-tieu' && req.method === 'GET') { const all = tatCaPhieu(); send(res, 200, tatCa().map((mt) => chiTiet(mt, all))); return true; }
    if (u === '/api/muc-tieu' && req.method === 'POST') { await tao(req, res); return true; }
    const m = /^\/api\/muc-tieu\/(MT-\d{4,})(?:\/([a-z-]+))?$/.exec(u);
    if (!m) return false;
    const [, ma, viec] = m;
    if (!viec && req.method === 'GET') { const mt = doc(ma); mt ? send(res, 200, chiTiet(mt)) : send(res, 404, { error: 'Không tìm thấy mục tiêu ' + ma + '.' }); return true; }
    if (req.method !== 'POST') return false;
    const ham = { sua, 'tien-do': tienDo, huy, giao, 'gan-phieu': ganPhieu }[viec];
    if (!ham) return false;
    await ham(req, res, ma);
    return true;
  }

  return { xuLy, _noiBo: { doc, ghi, tatCa, chu, nhatKy, chanGhi, docBody, laNgay, MO } };
}

module.exports = taoModuleMucTieu;
module.exports.HANG_SO = { TRANG_THAI, LOAI_KY, MUC_DL, KET_QUA, GIO_IM_LANG };
