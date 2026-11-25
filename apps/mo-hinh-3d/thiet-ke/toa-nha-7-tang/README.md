# Toà nhà vận hành MdFlexCom · Mô hình 3D theo tầng

Bản nháp 02 do Perplexity thiết kế ngày 24/11/2026, **chờ CEO duyệt**. Thay phương án khuôn viên năm cánh bằng toà văn phòng 7 tầng, mặt dựng kính, có mặt cắt mở để nhìn vào từng khu làm việc.

## Tệp

| Tệp | Nội dung |
| --- | --- |
| `toa-nha-7-tang.glb` | Mô hình glTF 2.0 dạng tách tầng: 137 node, 114 mesh, 10 vật liệu, không có ảnh |
| `dac-ta-canh.json` | Đặc tả cảnh Three.js: toạ độ, bảng màu ngày/đêm, font, bố cục khu, 7 tầng × 3 khu |
| `khong-gian-lam-viec.csv` | Bảng tầng và không gian làm việc |

Tên gốc trong `C:\MdFlexCom\`: `Mô hình 3D GLB · Toà nhà vận hành MdFlexCom.glb` (trùng nội dung với `mdflexcom-toa-nha-7-tang (1).glb`), `Đặc tả cảnh Three.js · Toà nhà MdFlexCom 7 tầng.json`, `Tng-Khnggianlmvic.csv`.

## Bố trí tầng

| Tầng | Không gian làm việc | Màu nhấn |
| --- | --- | --- |
| 1 | Sảnh đón tiếp, khu demo sản phẩm, phòng tiếp khách | cam |
| 2 | Kinh doanh: bán hàng trực tiếp, đối tác & kênh, Customer Success | cam |
| 3 | Marketing: Digital & SEO, studio nội dung, Thương hiệu & PR | cam |
| 4 | Phát triển phần mềm: Sản phẩm & y khoa, Dev–QA–DevOps, triển khai & hỗ trợ | teal |
| 5 | Kế toán: tổng hợp & thuế, công nợ & hoá đơn, kế hoạch tài chính | teal đậm |
| 6 | Nhân sự – Hành chính: tuyển dụng & đào tạo, lương & phúc lợi, hành chính & pháp chế | teal |
| 7 | Điều hành: phòng CEO, Trợ lý điều phối (vòng teal liền), Kiểm soát viên độc lập (vòng teal nét đứt) | teal đậm |

Chế độ xem trong bản của Perplexity: Ngoại thất, Mặt cắt, Tách tầng, Từng tầng. Kích thước là đơn vị mô hình, không phải mét.

## Kiểm tra theo bộ nhận diện (`config/thuong-hieu.json`)

Đạt: teal `#149078`, cam `#F48C0C`, navy `#1A1A2E`, nền `#E8F5F1`, chế độ đêm `#0F172A` `#1E293B` `#334155` `#2DD4A8` `#FBB040` `#F1F5F9`; không có đen `#000000`; font DM Sans / Inter / JetBrains Mono, chữ tối thiểu 12px.

Đã sửa ngày 24/11/2026 — 6 màu ngoài bảng màu đã được thay trong cả JSON (ghi ở trường `dieu_chinh_mau`) và vật liệu GLB. Tệp gốc chưa sửa vẫn ở `C:\MdFlexCom\`.

| Màu gốc | Dùng cho | Đã thay bằng |
| --- | --- | --- |
| `#0D6B59` | khung (frame) | `#0D6B56` primary-dark (lệch 3 đơn vị, có thể gõ nhầm) |
| `#FFF3E0` | nền kem | `#FEF3E2` accent-light |
| `#F9FAFB` | sàn phòng | `#F5F5F5` surface |
| `#E5E7EB` | thép, vách | `#E0E0E0` border |
| `#9CA3AF` | cạnh | `#666666` gray-mid |
| `#64748B` | cạnh ban đêm | `#334155` dark-border |

## Xem trong app

Chạy `node server.js` trong `apps/mo-hinh-3d`, mở http://localhost:3200/toa-nha.html (hoặc nút **Toà nhà 7 tầng** trên trang chính). Chế độ: Cả toà, Tách tầng, Từng tầng; Ngày/Đêm; bấm tầng để xem 3 khu. Màu đêm lấy từ `bang_mau.dem`, ánh xạ theo màu ngày của từng vật liệu.

Chưa có chế độ Ngoại thất/Mặt cắt riêng: tệp GLB hiện là mô hình mặt cắt tách tầng.

## Còn thiếu

- Ảnh logo mà JSON trỏ tới: `assets/mdflex-logo-ngay.jpg` và `assets/mdflex-logo-dem.png`. Trong `MDFlex Brand Kit.zip` có `logo.jpg`, chưa có bản trắng cho nền tối.
- Bảng phối cảnh (ảnh render) chưa thấy trên máy.
- `moc_nhan_su_ke_hoach` là số kế hoạch, không phải sức chứa.
