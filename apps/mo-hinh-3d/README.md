# Mô hình 3D công ty MdFlex

Trang localhost gồm 4 tab:

| Tab | Nội dung |
| --- | --- |
| Tổ chức | Mô hình 3D: 5 phòng, 15 tổ, lớp AI điều phối, số người theo mốc từ Thành lập đến G3 |
| Canvas & chức năng | Tầm nhìn, sứ mệnh, mục tiêu theo cổng; Business Model Canvas 9 thành tố; ma trận phòng × thành tố; chức năng, nhiệm vụ 5 phòng |
| Thiết kế AI | Gửi yêu cầu thiết kế giao diện tới Perplexity kèm bộ nhận diện MdFlex; áp thử CSS và kiểm tra tuân thủ tự động |
| Thành lập | Danh mục việc cần làm để thành lập công ty đến cổng G0 |

Trang riêng `/giao-viec.html`: **màn hình CEO giao việc** toàn trang, có kéo thả tệp yêu cầu, và **luồng tiếp nhận tự động**:

1. CEO điền mục tiêu, mô tả, kết quả cần, tiêu chí, ưu tiên, hạn, cổng CEO; thả tệp yêu cầu (tối đa 5 tệp, 10 MB mỗi tệp). Tệp .txt, .md, .csv, .json, .docx được đọc chữ; .pdf, .xlsx, .pptx, ảnh chỉ lưu kèm.
2. Trợ lý điều phối (`TL-DP`) tự nhận phiếu gốc và chọn phòng theo từ khoá `tu_khoa` trong `config/phong.json` (khớp cả nội dung tệp; văn bản không dấu thì so không dấu). CEO tick phòng thì theo CEO; không khớp phòng nào thì yêu cầu CEO chọn.
3. Trưởng phòng AI tự nhận và chia cho chuyên viên AI có `tu_khoa` khớp nhất (không khớp thì gán chuyên viên đầu tiên, ghi "mặc định, Trưởng phòng xem lại"). Chuyên viên tự nhận phiếu.
4. Cổng CEO đặt ở phiếu thực hiện; tệp đính kèm đi theo cả 3 cấp phiếu.
5. Khi mọi phiếu con xong, phiếu cha tự nộp nghiệm thu; phiếu do Trợ lý giao thì Trợ lý tự nghiệm thu và cộng dồn tiếp. Phiếu gốc dừng ở Chờ nghiệm thu để CEO nghiệm thu (trên màn hình giao việc hoặc Bảng CEO).

### Chuyên viên AI làm phiếu bằng Claude

Đặt `ANTHROPIC_API_KEY` rồi chạy máy chủ. Trên phiếu của chuyên viên AI có nút **Để Claude làm phiếu này**; màn hình Giao việc có ô **Cho Claude làm ngay sau khi giao**.

- Máy chủ gọi `POST https://api.anthropic.com/v1/messages` (fetch, không npm) với model `claude-opus-5-5`, `output_config.effort` `high`, `output_config.format` kiểu `json_schema`, và `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`) để khi bộ lọc an toàn từ chối thì API tự chạy lại trên model dự phòng.
- Lời dặn hệ thống ghép từ thẻ vị trí (nhiệm vụ, việc cấm), hiến chương và cổng CEO. Claude chỉ soạn bản nháp; mọi việc gửi, nộp, ký, chi tiền ghi vào "Việc người thật phải làm".
- Gửi kèm tệp: chữ đọc được từ .docx/.txt/.md/.csv/.json; PDF và ảnh gửi nguyên tệp.
- Kết quả: tóm tắt, sản phẩm (Markdown), tự đánh giá từng tiêu chí, việc người thật phải làm, câu hỏi. Lưu trong phiếu và `data/ket-qua/PH-####.md`. Đủ tiêu chí thì tự nộp nghiệm thu; thiếu đầu vào thì báo Vướng và sinh phiếu Đề xuất lên Trưởng phòng. **Trưởng phòng vẫn nghiệm thu**, AI không tự nghiệm thu.
- Phiếu **Mức dữ liệu Đỏ** không bao giờ gửi cho Claude.
- Mỗi lần chạy ghi số token và chi phí ước tính (Opus 5.5: 4 USD/1 triệu token vào, 20 USD/1 triệu token ra) vào nhật ký.

| Biến môi trường | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | (không có) | Khoá Claude. Không có thì chuyên viên AI chỉ nhận phiếu, không tự làm |
| `ANTHROPIC_MODEL` | `claude-opus-5-5` | Model Claude |
| `ANTHROPIC_EFFORT` | `high` | Mức suy nghĩ: `low`, `medium`, `high`, `xhigh`, `max` |

### Sửa phiếu, chuyển Trợ lý điều phối

- **Sửa phiếu** (người giao, CEO, Trợ lý điều phối, Trưởng phòng đang giữ phiếu; khi chưa nộp nghiệm thu): sửa mục tiêu, đầu vào, đầu ra, tiêu chí, ưu tiên, cổng CEO, mức dữ liệu, người nhận. Bắt buộc ghi lý do; nhật ký ghi giá trị cũ → mới. Đổi người nhận thì phiếu về Mới.
- **Chuyển Trợ lý điều phối** (phiếu CEO giao thẳng, chưa bắt đầu làm): phiếu thành phiếu gốc của Trợ lý; Trợ lý chọn phòng theo nội dung và tạo phiếu Trưởng phòng, phiếu chuyên viên như màn hình Giao việc. Định tuyến là so khớp từ khoá tại máy, không gửi nội dung ra dịch vụ ngoài. Tệp lưu ở `data/tep/` (không commit); tệp bấm "Bỏ" trên màn hình vẫn nằm trong `data/tep/`.

Trang riêng `/ceo.html`: **bảng điều hành CEO**, lấy số liệu thẳng từ nhật ký phiếu của cả 5 phòng, tự làm mới mỗi 30 giây:

- Thẻ chỉ số: đang mở, quá hạn, sắp trễ (≥ 80% SLA), chờ CEO quyết, xong hôm nay, đúng SLA, đạt nghiệm thu lần đầu.
- Việc chờ CEO quyết: duyệt hoặc trả lại (bắt buộc lý do) ngay trên bảng, ghi nhật ký với vai CEO.
- Khối lượng theo phòng × trạng thái; Điểm nóng (10 phiếu ứ đọng lâu nhất, ai đang giữ); Luồng phối hợp (bàn giao chưa được nhận quá 15 phút, phiếu cha chưa đóng dù mọi phiếu con đã xong).
- KPI theo vị trí: đúng SLA (cảnh báo < 90%), đạt lần đầu (cảnh báo < 80%), số lần báo vướng.
- Bản tin sáng soạn sẵn (hôm qua xong gì, hôm nay đến hạn, cần CEO quyết), có nút sao chép. Chưa tự gửi lúc 07:30.

Trang riêng `/phong.html?id=kd|mkt|pt|kt|ns`: **trang làm việc của từng phòng** — bảng phiếu việc theo vòng đời, chỉ số SLA, tổ và vị trí theo mốc, thẻ vị trí AI, bàn giao giữa các phòng. Mở từ nút **Phòng làm việc** trên trang chính, từ bảng chi tiết phòng, hoặc từ tầng T02–T06 của toà nhà.

Trang riêng `/toa-nha.html`: toà nhà vận hành 7 tầng (bản nháp 02 của Perplexity), có tách tầng, từng tầng, ngày/đêm. Tệp nguồn và kết quả kiểm màu ở [thiet-ke/toa-nha-7-tang](thiet-ke/toa-nha-7-tang/README.md).

Giao diện theo bộ nhận diện trong `config/thuong-hieu.json` (teal #149078, cam #F48C0C, DM Sans / Inter / JetBrains Mono, bo góc 8/12/16px, khoảng cách bội số 4px).

## Chạy

Cần Node.js 18+, không cần `npm install`.

```powershell
cd apps\mo-hinh-3d
$env:PERPLEXITY_API_KEY = "<khoá của anh>"   # chỉ cần cho tab Thiết kế AI
node server.js                               # hoặc bấm đúp start.bat
```

Mở http://localhost:3200. Máy chủ chỉ nghe trên 127.0.0.1.

| Biến môi trường | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `PERPLEXITY_API_KEY` | (không có) | Khoá API Perplexity. Không có thì tab Thiết kế AI báo chưa kết nối |
| `PERPLEXITY_MODEL` | `perplexity/auto` | Model trên Orchestrator API, dạng `creator/model-name` |
| `PORT` | `3200` | Cổng máy chủ |

## Thiết kế AI hoạt động thế nào

1. Trình duyệt gửi `POST /api/thiet-ke` với vùng giao diện và mô tả yêu cầu.
2. Máy chủ ghép bộ nhận diện thành chỉ dẫn hệ thống, gọi `POST https://api.perplexity.ai/orchestrator/v1/chat/completions` với `response_format` kiểu `json_schema`. Khoá API chỉ nằm ở máy chủ.
3. Kết quả gồm tóm tắt, danh sách thay đổi, CSS, bảng AI tự kiểm, câu hỏi cần xác nhận.
4. Máy chủ làm sạch CSS (bỏ `@import`, `url()`, thẻ HTML) và tự kiểm tra: màu ngoài bảng màu, đen thuần, font ngoài bộ chữ, cỡ chữ dưới 12px, khoảng cách không bội số 4px, bo góc ngoài thang.
5. Mỗi bản lưu ở `data/thiet-ke/TK###.json` (không commit).

CSS chỉ áp thử trên trang đang mở; tải lại trang là mất. Muốn giữ thì sao chép CSS và đưa vào `public/index.html` qua review.

## Phiếu việc của các phòng

Theo giao thức phiếu trong `docs/doi-quan-ai/01-dac-ta-kien-truc.md`:

- Vòng đời Mới → Đã nhận → Đang làm → Chờ nghiệm thu → Xong; nhánh Trả lại, Vướng, Chờ CEO duyệt. Máy chủ chặn chuyển trạng thái sai thứ tự.
- Mọi trường bắt buộc; thiếu thì trả lỗi. Phiếu cha, ghi chú rủi ro trống thì ghi "Không có".
- Chỉ Trưởng phòng ký Bàn giao, gửi tới Trưởng phòng phòng khác. Chuyên viên chỉ gửi phiếu trong phòng mình.
- Người làm không tự nghiệm thu. Nộp nghiệm thu khi đã tick đủ tiêu chí.
- Trả lại lần thứ 3 chuyển thẳng Chờ CEO duyệt. Phiếu gắn cổng CEO (đăng công khai, gửi ra ngoài, chi tiền, xoá dữ liệu gốc, đổi quy định/quyền) dừng ở Chờ CEO duyệt; chỉ vai CEO duyệt được.
- Báo Vướng tự sinh phiếu Đề xuất lên cấp trên (Chuyên viên → Trưởng phòng → Trợ lý điều phối).
- Hạn tính theo SLA: P1 2 giờ, P2 24 giờ, P3 72 giờ (giờ lịch, chưa trừ ngày nghỉ). Cảnh báo khi dùng ≥ 80% SLA.
- Nhật ký ghi ai, lúc nào, từ trạng thái nào sang trạng thái nào, lý do, phiên bản quy định.
- Phiếu lưu ở `data/phieu/PH-####.json` (không commit).

Hạn chế: chưa có đăng nhập — "vai đang thao tác" chọn trên trang, máy chủ chỉ kiểm tra quyền theo vai đó. Chỉ dùng trên máy nội bộ (127.0.0.1).

`config/phong.json` được sinh từ dữ liệu `DEPTS`, `FLOWS` trong `public/index.html` và `config/canvas.json`; khi sửa số người thì sửa cả hai nơi. Thẻ vị trí AI (15 chuyên viên, 5 trưởng phòng AI) là đề xuất, chờ Trưởng phòng và CEO duyệt.

## API

| Đường dẫn | Mô tả |
| --- | --- |
| `GET /api/trang-thai` | Có khoá hay chưa, model, danh sách vùng giao diện |
| `GET /api/thuong-hieu` | Bộ nhận diện |
| `GET /api/canvas` | Canvas, tầm nhìn, chức năng phòng |
| `GET /api/thiet-ke` | 30 bản thiết kế gần nhất |
| `GET /api/phong` | Dữ liệu 5 phòng, tổ, vị trí, thẻ vị trí AI, mẫu bàn giao (`config/phong.json`) |
| `GET /api/phieu?phong=kd` | Phiếu phòng nhận hoặc gửi đi, kèm `ty_le_sla`, `qua_han` |
| `POST /api/phieu` | Tạo phiếu: `ai, loai, nguoi_giao, nguoi_nhan, muc_tieu, dau_vao, dau_ra, tieu_chi[], uu_tien, cong, phieu_cha, ghi_chu_rui_ro` |
| `POST /api/phieu/PH-0001/hanh-dong` | `{ hanh_dong, ai, ly_do, tieu_chi[] }` — `nhan, bat_dau, nop, nghiem_thu, tra_lai, vuong, go_vuong, ceo_duyet, ceo_tra_lai` |
| `POST /api/phieu/PH-0001/sua` | `{ ai, ly_do, muc_tieu?, dau_vao?, dau_ra?, tieu_chi[]?, uu_tien?, cong?, muc_du_lieu?, han?, nguoi_nhan? }` |
| `POST /api/phieu/PH-0001/dieu-phoi` | `{ ai, phong[]?, ai_lam_ngay? }` — chuyển phiếu CEO giao cho Trợ lý điều phối định tuyến |
| `POST /api/phieu/PH-0001/ai-lam` | `{ ai }` — Claude làm phiếu (chạy nền, trả 202) |
| `GET /api/ai` | Có khoá Claude hay chưa, model, effort |
| `POST /api/tep` | `{ ten, du_lieu (base64) }` → `{ id, ten, kich_thuoc, doc_duoc, van_ban }` |
| `GET /api/tep/<id>/<tên>` | Tải tệp đính kèm |
| `POST /api/giao-viec/xem-truoc` | Xếp hạng phòng và chuyên viên theo nội dung, kèm từ khoá khớp |
| `POST /api/giao-viec` | `{ muc_tieu, dau_vao, dau_ra, tieu_chi[], uu_tien, han, cong, phong[], tep[] }` → tạo chuỗi phiếu CEO → Trợ lý → Trưởng phòng → Chuyên viên |
| `GET /toa-nha/toa-nha-7-tang.glb`, `GET /toa-nha/dac-ta-canh.json` | Mô hình và đặc tả cảnh toà nhà |
| `POST /api/thiet-ke` | `{ "yeu_cau": "...", "vung": "toan-trang", "che_do": "sang" }` |

## Dữ liệu cần CEO xác nhận

- Tầm nhìn và sứ mệnh trong `config/canvas.json` đang là đề xuất.
- Thành tố Đối tác chính và Hoạt động chính được suy ra từ tài liệu lộ trình, cần đối chiếu Canvas gốc.
- Số liệu Canvas là kế hoạch cũ, chỉ để tham khảo; chỉ tiêu thật đặt tại cổng G0.
