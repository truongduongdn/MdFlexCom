# Đội quân AI vận hành — Đặc tả kiến trúc

Bản xuất từ tài liệu Claude ngày 24/11/2026 · Tác giả: Truong Duong

## Tóm tắt

Đội quân AI gồm 4 tầng: CEO (người thật) giao mục tiêu → Trợ lý điều phối phân rã và phân phối → Trưởng phòng AI chia việc và nghiệm thu → Chuyên viên AI thực thi. Mọi giao việc, bàn giao và đề xuất đều là một phiếu trên một bảng công việc chung, nên CEO luôn biết ai đang làm gì, tắc ở đâu.

Nguyên tắc thiết kế:

- **Một nguồn sự thật.** Agent chỉ trao đổi qua phiếu. Việc không có phiếu thì không làm.
- **Quy định là dữ liệu có phiên bản.** Nạp theo 3 tầng: Hiến chương chung → Quy chế phòng → Thẻ vị trí.
- **Mỗi bàn giao là một hợp đồng.** Ghi rõ đầu vào, đầu ra, tiêu chí nghiệm thu và SLA.
- **Người thật giữ các cổng không đảo ngược được.** Đăng công khai, gửi ra ngoài, chi tiền, xoá dữ liệu.
- **Vướng thì leo thang, không đoán.** Thiếu dữ liệu hoặc sắp quá SLA thì mở phiếu đề xuất lên cấp trên.

Phạm vi bản 1: khung chung dùng cho mọi phòng, chạy thử trước với Phòng Nội dung (quét nguồn, phân tích, đăng website) đúng mục tiêu của dự án. Ba công cụ trong mô hình Base được thay bằng ba luồng: Base Wework → Luồng Giao việc, Base Workflow → Luồng Quy trình, Base Request → Luồng Đề xuất.

## Sơ đồ tổ chức

> **Sơ đồ:** sơ đồ tổ chức · 4 tầng, Phòng Nội dung chạy thử — bản có hình nằm trong [tài liệu gốc trên Claude](https://claude.ai/artifact/9hWSrjhytV1RtPnif14iKx).

Kiểm soát viên đứng ngoài chuỗi chỉ huy để báo cáo độc lập. Mở phòng mới chỉ cần viết Quy chế phòng và thẻ vị trí; khung không đổi.

## Cơ cấu tổ chức thực tế Viện Gút

> **Sơ đồ:** cây tổ chức Viện Gút · 29 đơn vị, 51 nhân viên (VGC, 23/11/2026) — bản có hình nằm trong [tài liệu gốc trên Claude](https://claude.ai/artifact/9hWSrjhytV1RtPnif14iKx).

Công ty có 9 đơn vị trực thuộc, trong đó 3 khối có cấp con: Phòng khám (9 NV), Phòng An ninh - Kỹ thuật (10 NV) và Trung tâm Truyền thông - Thông tin (20 NV). Số liệu lấy từ phân hệ Cơ cấu tổ chức của VGC ngày 23/11/2026; đội quân AI có thể lấy chính cây này làm danh sách phòng ban.

Dữ liệu cây cần rà soát:

- 3 đơn vị chưa gán quản lý: Tạp vụ, Phòng Sản xuất Video, Trung tâm Công nghệ.
- Trung tâm Công nghệ đang Ngừng hoạt động nhưng vẫn gán 3 nhân viên.
- Phòng Công nghệ Kỹ thuật (TTCN\_IT) và Phòng Phát triển Công nghệ (TTCN\_Dev) mang mã TTCN nhưng đang trực thuộc Trung tâm Truyền thông - Thông tin, không thuộc Trung tâm Công nghệ.
- Phòng Kế hoạch tổng hợp (kèm Điều dưỡng, Chăm sóc khách hàng) đang trực thuộc Trung tâm Truyền thông - Thông tin; cần xác nhận đúng thực tế.
- Cột Cấp tổ chức chưa thống nhất: lẫn mã thô (PHONG, KHOA, TRUNG\_TAM) với nhãn; Khoa Ngoại để cấp Phòng ban trong khi các khoa khác là Khoa; Phòng Quản lý cung ứng - Hậu cần và Trung tâm Công nghệ bỏ trống cấp.

## Ba luồng vận hành

> **Sơ đồ:** ba luồng vận hành · xuống, ngang, lên — bản có hình nằm trong [tài liệu gốc trên Claude](https://claude.ai/artifact/9hWSrjhytV1RtPnif14iKx).

Cả ba luồng dùng chung một mẫu phiếu, chỉ khác trường Loại, nên CEO xem một bảng là thấy đủ. Phòng Kinh doanh và Nhân sự vẽ nét đứt vì chưa mở trong bản 1.

## Danh mục vị trí

Mỗi vị trí chỉ có đúng quyền và công cụ ghi trong thẻ vị trí. Trợ lý và Trưởng phòng không tự làm nghiệp vụ, chỉ điều phối và nghiệm thu.

| Vị trí | Số lượng | Nhiệm vụ chính | Công cụ được phép | Quyền quyết định |
| --- | --- | --- | --- | --- |
| CEO (người thật) | 1 | Giao mục tiêu, duyệt các cổng, duyệt quy định, xem báo cáo | Bảng công việc, dashboard, điện thoại | Toàn quyền |
| Trợ lý điều phối | 1 | Làm rõ yêu cầu, phân rã thành phiếu, chọn phòng, theo dõi SLA, tổng hợp báo cáo | Đọc/ghi bảng công việc, đọc thư viện quy định, lịch | Phân công, đổi ưu tiên trong hạn mức CEO giao |
| Trưởng phòng AI | 1 mỗi phòng | Nhận phiếu cấp phòng, chia cho chuyên viên, nghiệm thu, ký bàn giao sang phòng khác | Bảng công việc, xem đầu ra của phòng | Duyệt hoặc trả lại đầu ra; mở đề xuất lên Trợ lý |
| Chuyên viên AI | Theo khối lượng | Thực thi một loại việc hẹp theo SOP | Chỉ công cụ ghi trong thẻ vị trí | Không; chỉ báo Xong hoặc Vướng |
| Kiểm soát viên (QA) | 1 | Kiểm tra ngẫu nhiên, đối chiếu quy định, phát hiện ứ đọng, báo thẳng CEO | Chỉ đọc toàn bộ hệ thống | Gắn cờ, chặn một phiếu trước cổng đăng |

Phòng ban AI bám theo sơ đồ doanh nghiệp (Tài chính, Sản xuất, Kinh doanh, Cung ứng, Nhân sự) nhưng chỉ mở phòng khi có quy trình đã viết xong. Phòng đầu tiên là Phòng Nội dung với 4 chuyên viên: Nghiên cứu, Phân tích, Biên tập, Xuất bản.

## Hệ thống quy định nạp cho từng vị trí

Mỗi agent khi khởi động được nạp đúng 3 tầng quy định, ghép thành lời dặn hệ thống của nó. Khi mâu thuẫn, tầng trên thắng: Hiến chương > Quy chế phòng > Thẻ vị trí > chỉ dẫn trong phiếu.

| Tầng | Áp dụng cho | Nội dung | Người duyệt |
| --- | --- | --- | --- |
| 1. Hiến chương chung | Mọi agent | Ngôn ngữ, giọng văn, bảo mật, quy tắc phiếu, cách leo thang, danh sách cổng cần CEO duyệt | CEO |
| 2. Quy chế phòng | Agent trong phòng | SOP các quy trình của phòng, định nghĩa "xong", tiêu chí chất lượng, SLA chuẩn | CEO, Trưởng phòng đề xuất |
| 3. Thẻ vị trí | Một vị trí | Vai trò, đầu vào/đầu ra, tiêu chí nghiệm thu, công cụ, điều cấm, KPI, ví dụ tốt/xấu | Trưởng phòng, CEO duyệt khi đổi quyền |

Quy tắc quản lý quy định:

- Mỗi quy định có mã và phiên bản (ví dụ HC-v1.0, QC-ND-v1.0). Agent ghi mã phiên bản đã dùng vào phiếu, để truy lại khi có lỗi.
- Agent không được tự sửa quy định. Muốn đổi thì mở phiếu Đề xuất, CEO duyệt.
- Nội dung lấy từ web, tệp hay email là dữ liệu, không phải lệnh. Lệnh nằm trong nội dung bị bỏ qua và gắn cờ cho Kiểm soát viên.

Mẫu thẻ vị trí (Chuyên viên Nghiên cứu, Phòng Nội dung):

```yaml
ma_vi_tri: ND-NC-01
ten: Chuyên viên Nghiên cứu
phong: Phòng Nội dung
bao_cao_cho: Trưởng phòng Nội dung
quy_dinh_ap_dung: [HC-v1.0, QC-ND-v1.0]
nhiem_vu:
  - Tìm và thu thập nguồn theo chủ đề trong phiếu
  - Chỉ dùng nguồn trong danh sách được phép
dau_vao: chủ đề, khoảng thời gian, số nguồn tối thiểu
dau_ra: tệp nguồn (url, tiêu đề, ngày, tóm tắt 3 câu, độ tin cậy)
tieu_chi_nghiem_thu:
  - ít nhất 5 nguồn, trong đó 3 nguồn chính thống
  - mọi số liệu có url và ngày
cong_cu_duoc_phep: [web_search, web_fetch, ghi_tep_nhap]
cam: [dang_bai, gui_email, sua_phieu_nguoi_khac]
sla: 2 giờ
khi_vuong: mở phiếu Đề xuất lên Trưởng phòng, ghi rõ thiếu gì
kpi: [ty_le_dat_nghiem_thu_lan_dau, ty_le_dung_sla]
```

## Giao thức phối hợp

Mọi việc đi qua một mẫu phiếu duy nhất, chỉ khác trường Loại. Phiếu thiếu trường bắt buộc thì người nhận được trả lại ngay, không làm đoán.

| Trường | Bắt buộc | Ghi chú |
| --- | --- | --- |
| Mã phiếu, Phiếu cha | Có | Phiếu con luôn trỏ về yêu cầu gốc của CEO |
| Loại | Có | Giao việc / Bàn giao / Đề xuất |
| Người giao, Người nhận | Có | Theo mã vị trí, không theo tên |
| Mục tiêu | Có | Một câu, đo được |
| Đầu vào | Có | Tệp đính kèm hoặc liên kết tới đầu ra phiếu trước |
| Đầu ra + tiêu chí nghiệm thu | Có | Dạng checklist |
| Ưu tiên, Hạn | Có | P1 / P2 / P3, hạn tính theo SLA |
| Trạng thái, Nhật ký | Tự động | Mọi thay đổi ghi lại ai, lúc nào, phiên bản quy định nào |

Vòng đời phiếu đi thẳng: Mới → Đã nhận → Đang làm → Chờ nghiệm thu → Xong. Ba nhánh ngoại lệ: **Trả lại** (về Đang làm, kèm lý do), **Vướng** (sinh phiếu Đề xuất), **Chờ CEO duyệt** (khi chạm cổng).

Quy tắc bàn giao:

1. Chỉ Trưởng phòng ký bàn giao sang phòng khác. Chuyên viên không gửi thẳng ra ngoài phòng.
2. Phiếu bàn giao gồm đầu ra, checklist nghiệm thu đã tick và ghi chú rủi ro.
3. Phòng nhận phải bấm Nhận hoặc Trả lại trong 15 phút. Im lặng quá hạn thì Trợ lý tự leo thang.
4. Một phiếu bị trả lại tối đa 2 lần. Lần thứ 3 chuyển thẳng lên CEO.

SLA mặc định (chỉnh được trong Quy chế phòng): nhận phiếu ≤ 15 phút; P1 xong ≤ 2 giờ; P2 ≤ 1 ngày; P3 ≤ 3 ngày.

Thang leo thang: Chuyên viên → Trưởng phòng → Trợ lý điều phối → CEO. Kích hoạt khi phiếu đã dùng 80% SLA mà chưa xong, thiếu đầu vào, quy định mâu thuẫn, hoặc việc chạm cổng cần CEO duyệt.

## Khung chat nhận yêu cầu của CEO

CEO gõ yêu cầu tự do (hoặc dán phiếu đã điền) vào khung chat. Trợ lý điều phối dựng Phiếu yêu cầu theo mẫu dưới, điền sẵn những gì suy ra được, hỏi lại phần còn thiếu, và chỉ phát hành phiếu khi đủ mọi trường bắt buộc và CEO bấm Xác nhận.

> **Sơ đồ:** mô phỏng khung chat nhận yêu cầu của CEO · số liệu ví dụ — bản có hình nằm trong [tài liệu gốc trên Claude](https://claude.ai/artifact/9hWSrjhytV1RtPnif14iKx).

Mẫu phiếu (mọi trường đều bắt buộc):

```markdown
PHIẾU YÊU CẦU — V<số>: <tên việc ngắn>
Loại việc:            <A–K theo mục 3>          Mức rủi ro: Xanh / Vàng / Đỏ
Nguồn:                <chỉ đạo ngày… / cuộc họp… / người giao>
Mục tiêu:             <kết quả mong muốn, vì sao cần>
Đầu ra:               <loại tài liệu, định dạng, độ dài, số hiệu dự kiến>
Người dùng đầu ra:    <ai đọc/dùng, để làm gì>
Người duyệt:          <ai phê duyệt cuối>
Người thực hiện:      <chính> — Phối hợp: <bộ phận/người>
Hạn:                  <hạn chót> — Mốc trung gian: <dàn ý/nháp/bản trình>
Phạm vi:              Trong: … | Ngoài: …
Đầu vào sẵn có:       <tài liệu, số liệu, văn bản tham chiếu>
Ràng buộc:            <pháp lý / ngân sách / nhân sự / thời gian / điều cấm>
Tiêu chí nghiệm thu:  <3–5 tiêu chí kiểm được>
Rủi ro & phụ thuộc:   <việc khác phải xong trước, ai có thể chặn>
Mức dữ liệu:          Xanh / Vàng / Đỏ (xem mục 5)
Lưu trữ:              <thư mục nhóm việc, tên tệp>
CÂU HỎI CẦN XÁC NHẬN (tối đa 5, kèm phương án gợi ý):
1. …
```

| Trường | Ai điền | Kiểm tra trước khi phát hành |
| --- | --- | --- |
| Số phiếu, tên việc | Trợ lý tự sinh số; rút tên từ câu của CEO | Tên ngắn, không trùng phiếu đang mở |
| Loại việc, Mức rủi ro | Trợ lý gợi ý, CEO chốt | Loại phải thuộc A–K; rủi ro Đỏ thì mọi cổng chờ CEO duyệt |
| Nguồn | Mặc định “Chỉ đạo CEO, ngày gửi” |  |
| Mục tiêu, Người dùng đầu ra, Phạm vi | CEO | Mục tiêu có “vì sao”; Phạm vi có ít nhất một dòng “Ngoài” |
| Đầu ra, Người duyệt | Trợ lý gợi ý theo loại việc; người duyệt mặc định CEO |  |
| Người thực hiện, Phối hợp | Trợ lý tra Danh mục nghiệp vụ | Phải là đơn vị, người có thật trong VGC |
| Hạn, Mốc trung gian | Trợ lý gợi ý theo SLA nghiệp vụ, CEO chốt | Hạn sau hôm nay; mốc nằm trước hạn |
| Đầu vào sẵn có, Rủi ro & phụ thuộc | Trợ lý tra kho văn bản và hồ sơ đang mở | Ghi “không có” nếu trống, không để rỗng |
| Ràng buộc | CEO | Ghi “không có” nếu trống |
| Tiêu chí nghiệm thu | Trợ lý viết nháp, CEO duyệt | 3–5 tiêu chí, mỗi tiêu chí kiểm được |
| Mức dữ liệu | Trợ lý gợi ý, CEO chốt | Đỏ thì nội dung không đưa vào agent, chỉ thông tin mô tả |
| Lưu trữ | Trợ lý tự sinh theo nhóm việc |  |
| Câu hỏi cần xác nhận | Trợ lý | Tối đa 5 câu, mỗi câu kèm phương án gợi ý |

Trình tự trong khung chat:

1. CEO gõ yêu cầu tự do hoặc dán phiếu.
2. Trợ lý trả về phiếu nháp: trường điền sẵn ghi “(gợi ý)”, trường trống ghi “Thiếu” bằng màu cảnh báo.
3. Trợ lý hỏi tối đa 5 câu, mỗi câu có phương án A/B để CEO chọn nhanh.
4. CEO trả lời hoặc sửa thẳng trường; nút Xác nhận chỉ bật khi không còn trường thiếu.
5. Xác nhận → phát hành phiếu V\<số>, sinh phiếu Giao việc cho người thực hiện, lưu theo trường Lưu trữ.

Còn mở: danh sách Loại việc A–K (“mục 3”) và định nghĩa Mức dữ liệu (“mục 5”) chưa có trong tài liệu này.

## Giám sát và báo cáo cho CEO

Mọi số liệu lấy thẳng từ nhật ký phiếu, nên CEO không cần hỏi ai cũng biết việc đang tắc ở đâu, từ bao giờ, ai chịu trách nhiệm.

Dashboard có 3 khối:

- **Khối lượng:** số phiếu theo giai đoạn, xong/chưa xong, đúng/quá hạn, theo phòng và theo agent.
- **Điểm nóng:** phiếu nằm quá lâu ở một trạng thái, sắp theo thời gian ứ đọng, kèm vị trí đang giữ phiếu.
- **Luồng phối hợp:** phiếu đã Xong nhưng chưa bàn giao sang bước sau, kèm lý do.

KPI cho mỗi agent:

| KPI | Cách đo | Ngưỡng cảnh báo (đề xuất) |
| --- | --- | --- |
| Đúng SLA | Phiếu xong trong hạn / tổng phiếu | < 90% |
| Đạt nghiệm thu lần đầu | Phiếu không bị trả lại / tổng phiếu | < 80% |
| Số lần leo thang | Đếm theo tuần | Tăng 2 tuần liền |
| Vi phạm quy định | Kiểm soát viên gắn cờ | Bất kỳ lần nào |
| Chi phí mỗi phiếu | Token và phí API quy ra VNĐ | Vượt trần trong Quy chế phòng |

Nhịp báo cáo: bản tin sáng 07:30 (hôm qua xong gì, hôm nay làm gì, việc chờ CEO quyết); cảnh báo tức thì khi phiếu P1 trễ hoặc có vi phạm; báo cáo tuần sáng thứ Hai. Agent tụt KPI là tín hiệu sửa thẻ vị trí hoặc SOP, không phải “phạt” agent.

## An toàn và kiểm soát

Năm loại việc luôn dừng ở trạng thái Chờ CEO duyệt, dù agent nào làm:

1. Đăng công khai lên website hoặc mạng xã hội.
2. Gửi email, tin nhắn ra ngoài doanh nghiệp.
3. Chi tiền, đặt mua, ký xác nhận với bên thứ ba.
4. Xoá hoặc ghi đè dữ liệu gốc.
5. Thay đổi quy định hoặc quyền của bất kỳ vị trí nào.

Các lớp bảo vệ khác:

- **Quyền tối thiểu:** mỗi agent chỉ được cấp công cụ trong thẻ vị trí; khoá API tách theo phòng; chuyên viên không có quyền ghi ra ngoài.
- **Chống lệnh cài cắm:** nội dung quét được chỉ là dữ liệu; Kiểm soát viên nhận cờ khi gặp câu có dạng lệnh.
- **Nhật ký không xoá được:** ai, lúc nào, công cụ gì, phiên bản quy định nào.
- **Trần ngân sách:** theo phiếu và theo ngày; chạm trần thì dừng và hỏi CEO.
- **Kiểm soát viên độc lập:** không thuộc phòng nào, báo thẳng CEO, không bị Trợ lý chỉnh sửa.

## Ví dụ chạy thử: Phòng Nội dung

CEO giao một câu: “Sáng thứ Hai hằng tuần, tổng hợp vĩ mô và thị trường tuần qua, đăng lên website.” Đội quân chạy từ 06:00 và đưa bản nháp tới CEO trước 07:30.

1. **Trợ lý điều phối** tạo phiếu cha định kỳ (06:00 thứ Hai), chia 4 phiếu con, giao Trưởng phòng Nội dung.
2. **Chuyên viên Nghiên cứu** quét danh sách nguồn được phép, xuất tệp nguồn. Trưởng phòng nghiệm thu theo checklist.
3. **Chuyên viên Phân tích** đọc tệp nguồn, viết nhận định; mọi số liệu có nguồn và ngày.
4. **Chuyên viên Biên tập** chuẩn hoá giọng văn, tiêu đề, SEO, kiểm lại trích dẫn.
5. **Kiểm soát viên** đối chiếu ngẫu nhiên 3 số liệu với nguồn gốc, kiểm vi phạm quy định.
6. **Chuyên viên Xuất bản** tạo bài ở chế độ nháp trên website, chuyển phiếu sang Chờ CEO duyệt.
7. **CEO** duyệt trên điện thoại → bài được đăng. Trợ lý đóng phiếu cha và ghi KPI.

Nếu bước 2 thiếu nguồn (ví dụ trang nguồn không truy cập được), Nghiên cứu mở phiếu Đề xuất thay vì tự lấy nguồn ngoài danh sách. Khi Kiểm soát viên đạt 4 tuần liền không lỗi, CEO có thể cân nhắc cho bước 7 tự đăng.

## Nền tảng kỹ thuật và lộ trình

Đề xuất dựng trên 5 khối, mỗi khối thay được độc lập:

| Khối | Đề xuất | Ghi chú |
| --- | --- | --- |
| Bộ não agent | Claude Agent SDK; mỗi vị trí là một agent | Lời dặn hệ thống = ghép 3 tầng quy định; danh sách công cụ lấy từ thẻ vị trí. Bản thử nhanh có thể dùng subagent của Claude Code |
| Bảng công việc | Postgres (Supabase): bảng tickets, ticket\_events, policies, agents | Hoặc nối vào công cụ quản lý công việc có API sẵn có |
| Thư viện quy định | Thư mục Markdown/YAML trong Git | Mỗi lần sửa là một commit có người duyệt, giống cách dùng AGENTS.md |
| Lập lịch | Cron sinh phiếu định kỳ | Trợ lý đọc hàng đợi theo chu kỳ 5 phút |
| Đầu ra | API CMS của website, chỉ tạo bài nháp; dashboard đọc từ bảng công việc | Quyền đăng công khai chỉ nằm ở nút duyệt của CEO |

Lộ trình, mỗi giai đoạn có cổng ra:

1. **GĐ0 – tuần 1: Bộ quy định.** Hiến chương, Quy chế Phòng Nội dung, 7 thẻ vị trí. Cổng: CEO duyệt bộ v1.0.
2. **GĐ1 – tuần 2–3: Chạy tay.** Bảng công việc, Trợ lý, Phòng Nội dung; CEO bấm chạy từng lần. Cổng: 10 phiếu liên tiếp đạt nghiệm thu, không vượt cổng.
3. **GĐ2 – tuần 4–5: Tự động.** Lịch định kỳ, bản tin sáng, dashboard điểm nóng, Kiểm soát viên. Cổng: 2 tuần đúng SLA ≥ 90%.
4. **GĐ3 – từ tuần 6: Nhân bản.** Mở phòng thứ hai bằng cách viết Quy chế phòng và thẻ vị trí mới; khung không đổi.

## Quyết định CEO cần chốt

Sáu quyết định này chặn GĐ0; chốt xong là viết được bộ quy định v1.0.

- [ ] Bảng công việc: tự dựng (Supabase) hay nối vào công cụ đang dùng?
- [ ] Website đích và CMS (WordPress hay nền tảng khác)?
- [ ] Danh sách nguồn được phép quét và nguồn cấm.
- [ ] Mức tự động đăng: luôn chờ CEO duyệt, hay tự đăng khi Kiểm soát viên đạt?
- [ ] Trần chi phí API theo ngày.
- [ ] Phòng thứ hai mở ở GĐ3.

Phần tiếp theo — nơi đặt văn bản, biểu mẫu, SOP cho từng phòng và cách Trợ lý tra cứu tiến độ: Kho nghiệp vụ & SOP
