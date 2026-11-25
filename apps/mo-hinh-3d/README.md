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
- **Ngang điểm thì không tự giao**: khi hai phòng trở lên cùng điểm cao nhất, Trợ lý điều phối dừng và báo "Các phòng ngang điểm…", CEO phải chọn phòng. Từ khoá quá chung (ví dụ "nội dung") không đặt ở cấp phòng.
- **Ngừng vì sai bộ phận** (CEO, Trợ lý điều phối, hoặc Trưởng phòng đang nhận việc; bắt buộc ghi lý do): phiếu Trưởng phòng và mọi phiếu con của nhánh chuyển sang trạng thái cuối **Đã ngừng**, không ai làm tiếp được. Phiếu gốc của CEO hết nhánh đang chạy thì về Trợ lý điều phối: có chọn phòng thì giao ngay; không chọn thì Trợ lý tự chọn lại, bỏ qua phòng vừa ngừng; vẫn không chọn được thì phiếu gốc **chờ chọn phòng** trên màn Giao việc. Chuyên viên thấy sai thì báo vướng lên Trưởng phòng, không tự ngừng. Phiếu đã ngừng không tính quá hạn, không tính vào cộng dồn.

### Luồng việc trên mô hình công ty

Trang chủ có tab **Luồng việc** và nhãn trạng thái trên từng toà nhà phòng (rảnh, việc chờ nhận, đang làm, chờ CEO, vướng), tự làm mới mỗi 20 giây. Mỗi việc hiện bước đang tới (Chờ nhận → Đã nhận → Đang làm → Chờ Trưởng phòng nghiệm thu → Chờ CEO duyệt → Xong), số phiếu thực hiện đã xong, hạn, người làm và **báo cáo về** ai (theo chuỗi phiếu cha: Chuyên viên → Trưởng phòng → Trợ lý điều phối → CEO).

### Gợi ý từ AI khi giao việc

Màn Giao việc có nút **Gợi ý từ AI**: Trợ lý điều phối đề xuất khung mô tả (bối cảnh, phạm vi, đầu vào, ràng buộc, người dùng kết quả), đầu ra, kết quả cần có để đạt mục tiêu, tiêu chí nghiệm thu, ưu tiên và cổng CEO. Bấm "Thêm" thì gợi ý được nối sau chữ CEO viết, không ghi đè. Có `ANTHROPIC_API_KEY` thì hỏi Claude (effort `medium`, mỗi lần khoảng 0,02 USD); chưa có khoá hoặc Mức dữ liệu Đỏ thì gợi ý theo thẻ vị trí của chuyên viên phù hợp, không gửi ra ngoài.

Trang riêng `/ceo.html`: **bảng điều hành CEO**, lấy số liệu thẳng từ nhật ký phiếu của cả 5 phòng, tự làm mới mỗi 30 giây:

- Thẻ chỉ số: đang mở, quá hạn, sắp trễ (≥ 80% SLA), chờ CEO quyết, xong hôm nay, đúng SLA, đạt nghiệm thu lần đầu.
- Việc chờ CEO quyết: duyệt hoặc trả lại (bắt buộc lý do) ngay trên bảng, ghi nhật ký với vai CEO.
- Khối lượng theo phòng × trạng thái; Điểm nóng (10 phiếu ứ đọng lâu nhất, ai đang giữ); Luồng phối hợp (bàn giao chưa được nhận quá 15 phút, phiếu cha chưa đóng dù mọi phiếu con đã xong).
- KPI theo vị trí: đúng SLA (cảnh báo < 90%), đạt lần đầu (cảnh báo < 80%), số lần báo vướng.
- Bản tin sáng soạn sẵn (hôm qua xong gì, hôm nay đến hạn, cần CEO quyết), có nút sao chép. Chưa tự gửi lúc 07:30.

Trang riêng `/dieu-hanh.html`: **Buồng điều hành CEO**, vòng Mục tiêu → Kế hoạch → Triển khai → Đánh giá (thiết kế: [thiet-ke/buong-dieu-hanh-ceo.md](thiet-ke/buong-dieu-hanh-ceo.md)):

- **Mục tiêu** (`data/muc-tieu/MT-####.json`, không commit): tên, kỳ (tháng/quý/năm), kết quả cần đạt, chỉ số (chỉ tiêu → thực tế), đơn vị tham gia, mức dữ liệu, mốc kế hoạch. Trạng thái Nháp → Đang triển khai → Chờ đánh giá (tự chuyển khi hết kỳ hoặc mọi phiếu gốc đã đóng) → Đã đánh giá; nhánh Huỷ. Sửa, huỷ bắt buộc lý do; mọi thay đổi ghi nhật ký. Chỉ vai CEO ghi.
- **Triển khai**: "Giao một đợt" tạo phiếu bằng luồng giao việc thường (CEO → Trợ lý → Trưởng phòng → Chuyên viên); phiếu gốc mang `ma_muc_tieu`. Gắn được phiếu gốc CEO đã giao trước đó. Mức dữ liệu của đợt không thấp hơn mục tiêu.
- **Theo dõi từng đơn vị**: nhận lúc, trạng thái, phiếu thực hiện xong/tổng, quá hạn, vướng, chờ CEO, phản hồi gần nhất, **im lặng** (phiếu mở quá 48 giờ mà 48 giờ qua phòng không phản hồi). CEO trả lời ngay trên trang.
- **Phản hồi** trên phiếu (`POST /api/phieu/PH-####/phan-hoi`): Báo cáo tiến độ, Hỏi lại, Khó khăn; CEO và Trợ lý thêm Trả lời. Ghi nhật ký, không đổi trạng thái. Trưởng phòng gửi từ chi tiết phiếu trên trang Phòng làm việc.
- **Đánh giá**: CEO chấm từng đơn vị (Đạt / Đạt một phần / Không đạt, điểm 1–5, nhận xét bắt buộc khi chưa Đạt) và tổng kết.
- **Thẻ trưởng phòng**: điểm trung bình, số mục tiêu, % đúng SLA, phiếu đang mở, quá hạn, vướng, phản hồi, im lặng — lọc theo kỳ.
- Liên kết thẳng: `/dieu-hanh.html?mt=MT-0001&tab=trien-khai` (tab: `muc-tieu`, `ke-hoach`, `trien-khai`, `danh-gia`).

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
| `CO_CAU` | (để trống = MdFlex) | Cơ cấu tổ chức. Để trống: `config/phong.json`, `config/canvas.json` (MdFlex, như cũ). `CO_CAU=vien-gut`: `config/co-cau/vien-gut/phong.json` |

## Chạy với cơ cấu khác (CO_CAU)

Mỗi máy chạy một cơ cấu: máy chính chạy MdFlex (không đặt `CO_CAU`), máy phụ chạy Viện Gút.

```powershell
$env:CO_CAU = "vien-gut"; node server.js     # hoặc bấm đúp van-hanh\chay-vien-gut.bat ở gốc repo
```

- Cơ cấu nằm ở `config/co-cau/<tên>/phong.json` (bắt buộc) và `canvas.json` (tuỳ chọn, cùng mẫu với `config/canvas.json`). **Không sửa `config/phong.json` của MdFlex** khi làm cơ cấu khác.
- Mọi trang đọc cơ cấu qua `/co-cau.js` (nạp trước script trang, đặt `window.CO_CAU`) hoặc `/api/phong`; `/api/co-cau` cho biết cơ cấu đang chạy. Lời dặn gửi Claude cũng lấy tên tổ chức theo cơ cấu.
- Trường thêm của phong.json cơ cấu khác: `to_chuc`, `ten_day_du`, `khau_hieu`, `gioi_thieu` (câu giới thiệu gửi Claude), `moc_mo_ta`, và ở mỗi phòng `mau: {sang, toi}` (màu theo bảng màu thương hiệu), `tang` (gắn tầng toà nhà, `null` = chưa gắn), `chia_to_de_xuat`.
- Cơ cấu Viện Gút sinh từ `apps/ceo-intake/config/don-vi.json` bằng `node config/co-cau/vien-gut/tao-phong.js` (thêm `--ghi-de` để sinh lại; mọi sửa tay trong phong.json sẽ mất). Sau khi sinh, phong.json là dữ liệu do người dùng quản lý: chức năng, KPI, thẻ vị trí AI đang để "Chưa khai báo"/đề xuất.
- Dữ liệu phiếu vẫn ở `data/` chung. Phiếu thuộc phòng không có trong cơ cấu đang chạy vẫn hiện (nhãn "Chung") nhưng mọi thao tác bị chặn (409).
- Tab Thành lập và kế hoạch mốc G0–G3 là nội dung riêng của MdFlex, chỉ hiện khi chạy MdFlex.

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
| `GET /api/phong` | Dữ liệu phòng, tổ, vị trí, thẻ vị trí AI, mẫu bàn giao của cơ cấu đang chạy (MdFlex: `config/phong.json`) |
| `GET /api/muc-tieu`, `GET /api/muc-tieu/MT-0001` | Mục tiêu kèm `don_vi_chi_tiet`, `phan_hoi`, `tom_tat` |
| `POST /api/muc-tieu` | CEO tạo: `{ ai, ten, ky:{loai,tu,den}, ket_qua_can_dat, chi_so[], don_vi[], muc_du_lieu, ke_hoach[] }` |
| `POST /api/muc-tieu/MT-0001/sua` · `/huy` | `{ ai, …, ly_do }` |
| `POST /api/muc-tieu/MT-0001/tien-do` | `{ ai, ke_hoach?, chi_so? }` — tích mốc, ghi số thực tế |
| `POST /api/muc-tieu/MT-0001/giao` | Như `/api/giao-viec` + `ai`; `phong` mặc định mọi đơn vị của mục tiêu |
| `POST /api/muc-tieu/MT-0001/gan-phieu` | `{ ai, ma_phieu }` — gắn phiếu gốc CEO → Trợ lý có sẵn |
| `POST /api/muc-tieu/MT-0001/danh-gia` | `{ ai, phong, ket_qua, diem, nhan_xet }` hoặc `{ ai, tong_ket }` |
| `POST /api/phieu/PH-0001/phan-hoi` | `{ ai, loai, noi_dung }` |
| `GET /api/truong-phong?ky=&tu=&den=` | Thẻ trưởng phòng; `ky` lọc mục tiêu theo tên kỳ, `tu`/`den` lọc phiếu theo ngày tạo |
| `GET /api/co-cau` | Cơ cấu đang chạy: `id`, `ten`, tệp cấu hình, số phòng, có Canvas không |
| `GET /co-cau.js` | Script nạp cơ cấu cho các trang (`window.CO_CAU`, màu phòng) |
| `GET /api/phieu?phong=kd` | Phiếu phòng nhận hoặc gửi đi, kèm `ty_le_sla`, `qua_han` |
| `POST /api/phieu` | Tạo phiếu: `ai, loai, nguoi_giao, nguoi_nhan, muc_tieu, dau_vao, dau_ra, tieu_chi[], uu_tien, cong, phieu_cha, ghi_chu_rui_ro` |
| `POST /api/phieu/PH-0001/hanh-dong` | `{ hanh_dong, ai, ly_do, tieu_chi[] }` — `nhan, bat_dau, nop, nghiem_thu, tra_lai, vuong, go_vuong, ceo_duyet, ceo_tra_lai` |
| `POST /api/phieu/PH-0001/sua` | `{ ai, ly_do, muc_tieu?, dau_vao?, dau_ra?, tieu_chi[]?, uu_tien?, cong?, muc_du_lieu?, han?, nguoi_nhan? }` |
| `POST /api/phieu/PH-0001/dieu-phoi` | `{ ai, phong[]?, ai_lam_ngay? }` — chuyển phiếu CEO giao cho Trợ lý điều phối định tuyến; phiếu gốc đang chờ chọn phòng thì giao cho phòng chọn |
| `POST /api/phieu/PH-0001/ai-lam` | `{ ai }` — Claude làm phiếu (chạy nền, trả 202) |
| `POST /api/phieu/PH-0001/ngung` | `{ ai, ly_do, phong[]?, ai_lam_ngay? }` — ngừng nhánh vì sai bộ phận, định tuyến lại phiếu gốc |
| `POST /api/giao-viec/goi-y` | `{ muc_tieu, dau_vao, dau_ra, tieu_chi[], tep[], muc_du_lieu }` → `{ nguon: claude\|mau, goi_y }` |
| `GET /api/ai` | Có khoá Claude hay chưa, model, effort |
| `POST /api/tep` | `{ ten, du_lieu (base64) }` → `{ id, ten, kich_thuoc, doc_duoc, van_ban }` |
| `GET /api/tep/<id>/<tên>` | Tải tệp đính kèm |
| `POST /api/giao-viec/xem-truoc` | Xếp hạng phòng và chuyên viên theo nội dung, kèm từ khoá khớp |
| `POST /api/giao-viec` | `{ muc_tieu, dau_vao, dau_ra, tieu_chi[], uu_tien, han, cong, phong[], tep[] }` → tạo chuỗi phiếu CEO → Trợ lý → Trưởng phòng → Chuyên viên |
| `GET /toa-nha/toa-nha-7-tang.glb`, `GET /toa-nha/dac-ta-canh.json` | Mô hình và đặc tả cảnh toà nhà |
| `POST /api/thiet-ke` | `{ "yeu_cau": "...", "vung": "toan-trang", "che_do": "sang" }` |

## Kiểm thử

```bash
cd apps/mo-hinh-3d
node --test "test/**/*.test.js"     # chạy trên bản sao tạm, không đụng data/ thật, không gọi Claude
```

`van-hanh/kiem-tra.js` (bản đầy đủ) cũng chạy bộ này.

## Dữ liệu cần CEO xác nhận

- Tầm nhìn và sứ mệnh trong `config/canvas.json` đang là đề xuất.
- Thành tố Đối tác chính và Hoạt động chính được suy ra từ tài liệu lộ trình, cần đối chiếu Canvas gốc.
- Số liệu Canvas là kế hoạch cũ, chỉ để tham khảo; chỉ tiêu thật đặt tại cổng G0.
