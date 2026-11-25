# Khung chat Phiếu yêu cầu CEO

CEO gõ yêu cầu bằng câu bình thường (hoặc dán phiếu đã điền theo mẫu). Trợ lý điều phối dựng Phiếu yêu cầu, điền sẵn các trường suy ra được, hỏi lại tối đa 5 câu cho phần còn thiếu, và chỉ phát hành khi đủ mọi trường.

## Chạy

Cần Node.js 18 trở lên. Không cần `npm install`.

- Windows: bấm đúp `start.bat`, hoặc mở terminal tại thư mục này và chạy `node server.js`.
- Mở trình duyệt: http://localhost:3100
- Đổi cổng: `set PORT=3200` (Windows) rồi `node server.js`.

## Ba màn hình

- **Tạo phiếu:** khung chat + phiếu nháp.
- **Sơ đồ vận hành:** CEO → Trợ lý điều phối → cây tổ chức (lấy từ `config/don-vi.json`), kèm Kiểm soát viên và 3 luồng (giao việc / quy trình / đề xuất). Mỗi đơn vị hiện số việc đang mở và số việc trễ; bấm vào đơn vị để xem danh sách việc. Đổi cơ cấu (vd sang MdFlex) chỉ cần sửa `config/don-vi.json`.
- **Phiếu đã phát hành:** danh sách và nội dung từng phiếu.

## Hai chế độ đọc câu

- **Quy tắc (mặc định):** nhận diện đơn vị, nghiệp vụ, ngày, loại đầu ra bằng từ khoá.
- **Claude:** đặt biến môi trường `ANTHROPIC_API_KEY` trước khi chạy để Claude đọc câu tự do tốt hơn. Đổi model bằng `ANTHROPIC_MODEL` (mặc định `claude-sonnet-5-5`). Giá trị Claude đọc được vẫn chỉ là "Gợi ý", CEO xác nhận.

## Cấu hình (sửa trực tiếp, không cần khởi động lại)

| Tệp | Nội dung |
| --- | --- |
| `config/loai-viec.json` | Danh sách Loại việc A–K (hiện là chỗ trống — cần điền theo mục 3 của quy định) |
| `config/don-vi.json` | Cơ cấu MdFlex: công ty, 5 phòng và 8 nhóm con theo kế hoạch nhân sự mốc N0+12 tháng. `chucDanh` là chức danh quản lý; `quanLy` để trống đến khi có người giữ vị trí |
| `config/danh-muc-nghiep-vu.json` | Danh mục nghiệp vụ MdFlex → đơn vị chủ trì. 7 mục đều là ví dụ (`viDu: true`), cần CEO chốt |
| `config/don-vi.vgc.json`, `config/danh-muc-nghiep-vu.vgc.json` | Cơ cấu 29 đơn vị Viện Gút (VGC) và ví dụ "Thành lập chi nhánh" cũ, giữ lại để đối chiếu |

**Chọn bộ cơ cấu.** Mặc định app dùng cơ cấu MdFlex. Muốn chạy lại cơ cấu Viện Gút thì đặt biến `ORG=vgc` trước khi chạy (Windows: `set ORG=vgc` rồi `node server.js`). Phiếu cũ giao cho mã đơn vị không có trong bộ đang dùng được đếm vào "chưa khớp đơn vị" ở ô Trợ lý điều phối trên Sơ đồ vận hành.

## Dữ liệu sinh ra

- `data/phieu/V001.json` và `V001.md` — phiếu đã phát hành (bản đọc được theo đúng mẫu).
- `data/giao-viec/GV-V001.json` — phiếu Giao việc cho người thực hiện. Bản này chỉ ghi tệp; chưa gửi đi đâu. Bước sau là nối sang công cụ quản lý công việc của doanh nghiệp.
- `data/counter.json` — bộ đếm số phiếu.

## Quy tắc đã cài

- Mọi trường đều bắt buộc; trường không có nội dung ghi "Không có".
- Tiêu chí nghiệm thu: 3–5 dòng. Hạn chót không được ở quá khứ. Mức rủi ro, Mức dữ liệu chỉ nhận Xanh / Vàng / Đỏ. Loại việc là một chữ A–K.
- Rủi ro Đỏ → phiếu gắn cờ "mọi cổng chờ CEO duyệt". Dữ liệu Đỏ → gắn cờ "không đưa nội dung vào agent".
- Số phiếu chỉ cấp chính thức khi phát hành, không trùng số.
- Máy chủ chỉ nghe trên 127.0.0.1 (chỉ máy này truy cập được).
