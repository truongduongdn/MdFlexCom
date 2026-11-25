# Buồng điều hành CEO — Kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CEO đặt mục tiêu, giao thành phiếu, theo dõi đơn vị nhận/tiến độ/phản hồi và đánh giá trưởng phòng trên trang `/dieu-hanh.html`.

**Architecture:** Mục tiêu là hồ sơ JSON trong `data/muc-tieu/`. Logic mục tiêu nằm ở module mới `muc-tieu.js`, nhận các hàm dùng chung của `server.js` qua tham số (không đổi cấu trúc file cũ). `giaoViec` được tách phần lõi thành hàm dùng lại cho "giao đợt". Phản hồi là một mục nhật ký mới trên phiếu.

**Tech Stack:** Node 18+ thuần (`http`, `fs`, `node:test`), HTML/JS thuần, không npm.

**Spec:** `apps/mo-hinh-3d/thiet-ke/buong-dieu-hanh-ceo.md`

## Global Constraints

- Không thêm phụ thuộc npm; chỉ nghe `127.0.0.1`; `data/` không commit.
- Giao diện, thông báo lỗi: tiếng Việt có dấu; màu, chữ theo `config/thuong-hieu.json` (teal `#149078`, cam `#F48C0C`, DM Sans / Inter / JetBrains Mono, bo góc 8/12/16px, khoảng cách bội số 4px).
- Cơ cấu theo `CO_CAU`; không sửa `config/phong.json`.
- Phiếu không gắn mục tiêu chạy y như cũ; mốc chuẩn MdFlex (đầu ra API cũ) không đổi.
- AI không ghi đánh giá; phiếu Mức dữ liệu Đỏ không gửi cho Claude.
- Trường liên kết trên phiếu: `ma_muc_tieu` (không dùng `muc_tieu`).
- Loại phản hồi: `Báo cáo tiến độ`, `Hỏi lại`, `Khó khăn`, `Trả lời` (chỉ CEO, TL-DP).
- Trạng thái mục tiêu: `Nháp`, `Đang triển khai`, `Chờ đánh giá`, `Đã đánh giá`, `Huỷ`. Kết quả đánh giá: `Đạt`, `Đạt một phần`, `Không đạt`; điểm 1–5.
- Im lặng: phiếu đang mở tạo quá 48 giờ và 48 giờ gần nhất không có phản hồi của đơn vị.

## Review Focus

1. Vai không phải CEO gọi API tạo/sửa/giao/đánh giá mục tiêu → 403, không ghi gì. (Task 3, 5)
2. Phản hồi rỗng hoặc dài quá 2000 ký tự → 400; vai không liên quan phiếu → 403. (Task 2)
3. Kỳ sai (`den` trước `tu`, ngày không hợp lệ) hoặc đơn vị không thuộc cơ cấu đang chạy → 400 khi tạo. (Task 3)
4. Mục tiêu tạo dưới cơ cấu khác (`co_cau` khác `CO_CAU`) → xem được, thao tác trả 409. (Task 3)
5. Giao đợt với mức dữ liệu thấp hơn mục tiêu → 400; mức Đỏ kèm `ai_lam_ngay` → không chạy Claude. (Task 4)

---

## File Structure

| Tệp | Trách nhiệm |
| --- | --- |
| `apps/mo-hinh-3d/muc-tieu.js` (mới) | Đọc/ghi mục tiêu, kiểm hợp lệ, tính số liệu theo đơn vị, thẻ trưởng phòng, các route `/api/muc-tieu*`, `/api/truong-phong` |
| `apps/mo-hinh-3d/server.js` | Tách lõi `giaoViec`; route `/api/phieu/:ma/phan-hoi`; gắn module mục tiêu |
| `apps/mo-hinh-3d/public/dieu-hanh.html` (mới) | Trang Buồng điều hành |
| `apps/mo-hinh-3d/public/phong.html` | Nút Phản hồi trong chi tiết phiếu; hiện phản hồi trong nhật ký |
| `apps/mo-hinh-3d/public/ceo.html`, `index.html` | Liên kết tới Buồng điều hành |
| `apps/mo-hinh-3d/test/tro-giup.js` (mới) | Chạy máy chủ trên bản sao tạm, gọi API |
| `apps/mo-hinh-3d/test/*.test.js` (mới) | Kiểm thử `node --test apps/mo-hinh-3d/test/` |
| `van-hanh/kiem-tra.js` | Chạy thêm bộ kiểm thử app |
| `apps/mo-hinh-3d/README.md` | Tài liệu API, trang |

---

### Task 1: Bộ chạy kiểm thử và tách lõi giao việc

**Files:** Create `test/tro-giup.js`, `test/giao-viec.test.js`; Modify `server.js` (`giaoViec`).

**Interfaces:**
- Produces: `test/tro-giup.js` → `async khoiDong({ coCau } = {}) → { base, tmp, goi(path, body?, method?) → {status, json}, dung() }` (bản sao app không có `data/`, gỡ mọi khoá API và `CO_CAU` trước khi đặt).
- Produces (server.js): `taoChuoiGiaoViec(b, { maMucTieu } = {}) → { loi: string, ngang? } | { goc, phieu, dinh_tuyen, tu_dong, ai_chay }`. `giaoViec` gọi hàm này; khi có `maMucTieu`, phiếu gốc có `ma_muc_tieu` trước lần ghi đầu tiên.

- [ ] **Step 1:** Test `giao viec khong gan muc tieu giu nguyen`: MdFlex, `POST /api/giao-viec` (phòng `kt`) → 201; đọc phiếu gốc → không có khoá `ma_muc_tieu`; số phiếu = 3.
- [ ] **Step 2:** Chạy `node --test test/` → PASS ngay (đây là mốc chuẩn trước khi tách).
- [ ] **Step 3:** Tách `taoChuoiGiaoViec` từ thân `giaoViec`; `giaoViec` chỉ đọc body, gọi, rồi `send`.
- [ ] **Step 4:** Chạy lại `node --test test/` và `node van-hanh/kiem-tra.js` (từ gốc repo) → PASS / "Kết quả: đạt".
- [ ] **Step 5:** Commit `Tách lõi giao việc, thêm bộ kiểm thử app`.

### Task 2: Phản hồi trên phiếu

**Files:** Modify `server.js`, `public/phong.html`; Test `test/phan-hoi.test.js`.

**Interfaces:**
- Produces: `POST /api/phieu/:ma/phan-hoi` body `{ ai, loai, noi_dung }` → 201 phiếu (kèm chỉ số). Ghi `nhat_ky.push({ luc, ai, hanh_dong: 'Phản hồi', loai, ghi_chu: noi_dung, quy_dinh })`, không đổi `trang_thai`.
- Produces: `const LOAI_PHAN_HOI = ['Báo cáo tiến độ','Hỏi lại','Khó khăn','Trả lời']`.
- Quyền: `ai` ∈ {người nhận, người giao, TP của `p.phong`, `CEO`, `TL-DP`}; `Trả lời` chỉ `CEO`, `TL-DP`. Phiếu ngoài cơ cấu → 409 (dùng `phieuKhacCoCau`).

- [ ] **Step 1:** Tests: `phan hoi hop le ghi nhat ky` (TP ghi `Khó khăn` → 201, trạng thái không đổi, mục nhật ký cuối có `hanh_dong:'Phản hồi'`, `loai:'Khó khăn'`); `phan hoi rong 400`; `phan hoi dai hon 2000 ky tu 400`; `vai khong lien quan 403` (TP phòng khác); `chuyen vien khong duoc Tra loi 403`.
- [ ] **Step 2:** Chạy → FAIL (404).
- [ ] **Step 3:** Cài route và hàm `phanHoi(req,res,ma)` trong `server.js`.
- [ ] **Step 4:** `phong.html`: trong chi tiết phiếu thêm khối "Phản hồi" (chọn loại, ô nội dung, nút Gửi; vai lấy từ `#actor`); nhật ký hiện dòng phản hồi nổi bật kèm loại.
- [ ] **Step 5:** Chạy `node --test test/` → PASS; commit `Thêm phản hồi trên phiếu`.

### Task 3: Hồ sơ mục tiêu (tạo, xem, sửa, huỷ)

**Files:** Create `muc-tieu.js`; Modify `server.js` (gắn route); Test `test/muc-tieu.test.js`.

**Interfaces:**
- Consumes: từ server.js truyền vào `taoModuleMucTieu({ ROOT, CO_CAU, phongCfg, danhBa, tatCaPhieu, docPhieu, ghiPhieu, kemChiSo, readBody, send, taoChuoiGiaoViec, toChuc })`.
- Produces: `module.exports = taoModuleMucTieu` trả `{ xuLy(req, res, u) → boolean, theTruongPhong(ky?) }`; `xuLy` trả `true` nếu đã xử lý route.
- Dữ liệu theo spec mục "Dữ liệu"; mã `MT-####` tăng dần theo số lớn nhất trong `data/muc-tieu/`.
- Kiểm hợp lệ khi tạo: `ten` bắt buộc; `ky.loai` ∈ `thang|quy|nam`; `ky.tu`, `ky.den` dạng `YYYY-MM-DD`, `den ≥ tu`; `don_vi` ≥ 1 và đều thuộc cơ cấu đang chạy; `muc_du_lieu` ∈ Xanh/Vàng/Đỏ (mặc định Vàng). Thiếu → 400 với danh sách lỗi tiếng Việt.
- Chỉ `ai === 'CEO'` được ghi (403 khác). `co_cau` của mục tiêu khác `CO_CAU` → 409 khi ghi.
- Produces: `POST /api/muc-tieu/:ma/tien-do` `{ ai:'CEO', ke_hoach?, chi_so? }` cập nhật mốc kế hoạch (thêm, tích xong) và `thuc_te` của chỉ số, không cần lý do, ghi nhật ký "Cập nhật kế hoạch/chỉ số". Mốc có `don_vi` phải thuộc `don_vi` của mục tiêu, `han` dạng ngày.

- [ ] **Step 1:** Tests: `cap nhat tien do` (tích một mốc `xong:true`, ghi `thuc_te` → lưu, nhật ký có mục mới; mốc với đơn vị ngoài mục tiêu → 400); `tao muc tieu Nhap` (201, `ma:'MT-0001'`, `trang_thai:'Nháp'`, nhật ký "Tạo mục tiêu"); `khong phai CEO 403`; `ky sai 400`; `don vi la 400`; `sua can ly do` (thiếu lý do 400; có lý do → nhật ký ghi cũ → mới); `huy can ly do` (→ `Huỷ`, sau đó sửa → 409); `muc tieu co cau khac chi xem` (tạo bằng MdFlex, khởi động lại cùng `tmp` với `CO_CAU=vien-gut` → GET 200, sửa 409); `GET danh sach`.
- [ ] **Step 2:** Chạy → FAIL.
- [ ] **Step 3:** Cài `muc-tieu.js` phần lưu trữ, kiểm hợp lệ, các route tạo/xem/sửa/huỷ; gắn `xuLy` vào đầu bộ định tuyến của server.js.
- [ ] **Step 4:** Chạy → PASS; commit `Thêm hồ sơ mục tiêu`.

`tro-giup.khoiDong` cần thêm tuỳ chọn `{ tmp }` để chạy lại trên cùng bản sao (cho test cơ cấu khác).

### Task 4: Giao đợt, gắn phiếu, theo dõi đơn vị

**Files:** Modify `muc-tieu.js`; Test `test/muc-tieu-giao.test.js`.

**Interfaces:**
- Produces: `POST /api/muc-tieu/:ma/giao` body như `/api/giao-viec` (thiếu `phong` → mọi `don_vi`) → 201 `{ muc_tieu, giao }`; thêm `goc` vào `phieu_goc`; `Nháp → Đang triển khai`.
- Produces: `POST /api/muc-tieu/:ma/gan-phieu` `{ ai, ma_phieu }`: chỉ phiếu gốc `nguoi_giao:'CEO'`, `nguoi_nhan:'TL-DP'`, chưa có `ma_muc_tieu`; ghi `ma_muc_tieu` vào phiếu; thêm đơn vị con chưa có vào `don_vi` (nhật ký).
- Produces: `tinhDonVi(mt, dsPhieu) → [{ phong, ma_phieu, nhan_luc, trang_thai, buoc, xong, tong, qua_han, vuong, cho_ceo, phan_hoi_cuoi: {luc, ai, loai, noi_dung} | null, im_lang }]` và `trangThaiTuDong(mt, dsPhieu)` (→ `Chờ đánh giá` khi qua `ky.den` hoặc mọi phiếu gốc Xong/Đã ngừng). `GET` mục tiêu trả thêm `don_vi_chi_tiet` và `phan_hoi` (mọi phản hồi trong các chuỗi, mới nhất trước).
- Quy tắc theo spec "Quy tắc chi tiết" 1–3, 5–7. Mức dữ liệu đợt thấp hơn mục tiêu → 400.

- [ ] **Step 1:** Tests (Viện Gút): `giao dot tao phieu gan ma_muc_tieu` (2 đơn vị → phiếu gốc có `ma_muc_tieu`, MT `Đang triển khai`, `don_vi_chi_tiet` 2 dòng, `xong:0`); `muc du lieu thap hon 400`; `gan phieu co san` (phiếu gốc tạo bằng `/api/giao-viec` cho đơn vị mới → được gắn, `don_vi` thêm đơn vị); `gan phieu da gan 409`; `phan hoi hien o don vi` (TP phản hồi → `phan_hoi_cuoi.loai`); `im lang sau 48 gio` (sửa `tao_luc` phiếu trong tmp lùi 49 giờ → `im_lang:true`; có phản hồi → `false`); `het ky chuyen Cho danh gia` (`ky.den` hôm qua → GET trả `Chờ đánh giá`); `do kem ai_lam_ngay khong chay Claude` (`ai_chay` rỗng).
- [ ] **Step 2:** Chạy → FAIL.
- [ ] **Step 3:** Cài các route và hàm tính.
- [ ] **Step 4:** Chạy → PASS; commit `Giao đợt từ mục tiêu, theo dõi đơn vị`.

### Task 5: Đánh giá và thẻ trưởng phòng

**Files:** Modify `muc-tieu.js`; Test `test/danh-gia.test.js`.

**Interfaces:**
- Produces: `POST /api/muc-tieu/:ma/danh-gia` `{ ai, phong, ket_qua, diem, nhan_xet }` hoặc `{ ai, tong_ket }`. Nhận xét bắt buộc khi `ket_qua !== 'Đạt'`. Chỉ ở `Đang triển khai`/`Chờ đánh giá`. Đủ đơn vị + có tổng kết → `Đã đánh giá`.
- Produces: `GET /api/truong-phong?ky=<tên kỳ|tat-ca>` → `[{ phong, ten, truong_phong, so_muc_tieu, diem_tb|null, ty_le_dung_sla|null, qua_han, vuong, so_phan_hoi, im_lang }]` theo "Quy tắc chi tiết" 4.

- [ ] **Step 1:** Tests: `danh gia don vi` (201, lưu đánh giá); `khong dat thieu nhan xet 400`; `diem ngoai 1-5 400`; `du danh gia va tong ket thi Da danh gia` (sau đó giao → 409); `the truong phong` (điểm TB = trung bình điểm đã chấm, `so_muc_tieu` đúng, lọc `ky` khác → `so_muc_tieu:0`).
- [ ] **Step 2–4:** FAIL → cài → PASS; commit `Đánh giá mục tiêu, thẻ trưởng phòng`.

### Task 6: Trang Buồng điều hành

**Files:** Create `public/dieu-hanh.html`; Modify `public/ceo.html`, `public/index.html` (thêm liên kết "Buồng điều hành").

**Interfaces:** Consumes mọi API Task 2–5 và `/co-cau.js`.

- [ ] **Step 1:** Trang theo bố cục spec: thanh trên (tên tổ chức, chọn vai mặc định CEO, chọn kỳ), cột trái danh sách mục tiêu (mã, tên, trạng thái, %, cảnh báo) + "Mục tiêu mới", vùng chính 4 tab Mục tiêu / Kế hoạch / Triển khai / Đánh giá, dải thẻ trưởng phòng ở dưới. Form tạo/sửa, giao đợt (điền sẵn theo spec quy tắc 5), gắn phiếu, phản hồi/trả lời, đánh giá. Làm mới 30 giây. Lỗi API hiện thông báo tiếng Việt.
- [ ] **Step 2:** Kiểm thử thêm vào `test/trang.test.js`: `GET /dieu-hanh.html` 200 và chứa `src="/co-cau.js"`; cú pháp script trang parse được (`new AsyncFunction`).
- [ ] **Step 3:** Chạy `node --test test/` → PASS. Kiểm tay trên trình duyệt (vai CEO và vai TP) nếu mở được.
- [ ] **Step 4:** Commit `Thêm trang Buồng điều hành CEO`.

### Task 7: Hoàn tất

**Files:** Modify `van-hanh/kiem-tra.js`, `apps/mo-hinh-3d/README.md`.

- [ ] **Step 1:** `kiem-tra.js` (bản đầy đủ) chạy thêm `node --test apps/mo-hinh-3d/test/`, lỗi → ✘.
- [ ] **Step 2:** README: mục Buồng điều hành, bảng API mới, `data/muc-tieu/`.
- [ ] **Step 3:** Mốc chuẩn MdFlex: chạy lại so sánh đầu ra API cũ với `truoc-mdflex.json` → giống (bỏ `ty_le_sla`). `md5` của `config/phong.json` không đổi.
- [ ] **Step 4:** `git pull`, commit, push `feat/vien-gut`.
