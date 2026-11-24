# Kho nghiệp vụ, văn bản và SOP theo đơn vị

Mỗi việc CEO có thể hỏi phải tra được theo 3 lớp dữ liệu gắn vào cây tổ chức: **Danh mục nghiệp vụ** cho biết đơn vị nào chịu trách nhiệm, **Bộ tài liệu** (SOP, biểu mẫu, văn bản căn cứ) cho biết làm theo các bước nào, và **Hồ sơ công việc** cho biết đang đến bước nào, ai làm, có quá hạn không. Trợ lý điều phối tra đúng thứ tự này; chỉ khi dữ liệu thiếu hoặc cũ mới gửi phiếu yêu cầu báo cáo cho trưởng đơn vị.

## Mô hình dữ liệu

> **Sơ đồ:** mô hình dữ liệu · 4 lớp nối qua Nghiệp vụ — bản có hình nằm trong [tài liệu gốc trên Claude](https://claude.ai/artifact/9hWSrjhytV1RtPnif14iKx).

Nghiệp vụ là khoá tra cứu: từ tên việc CEO hỏi, Trợ lý ra được đơn vị chủ trì, hồ sơ đang chạy và SOP đang áp dụng.

## Danh mục nghiệp vụ

Danh mục nghiệp vụ là bảng “việc này ai chịu” của cả Viện. Mỗi nghiệp vụ có đúng một đơn vị chủ trì, nên Trợ lý không bao giờ phải đoán giao cho ai.

| Trường | Ví dụ | Ghi chú |
| --- | --- | --- |
| Mã, tên | NV-HCQT-07 · Thành lập chi nhánh |  |
| Từ khoá / tên gọi khác | mở chi nhánh, cơ sở mới, địa điểm kinh doanh | Trợ lý dùng để nhận diện câu hỏi của CEO |
| Loại | Dự án một lần / Định kỳ / Theo yêu cầu | Định kỳ thì hệ thống tự sinh hồ sơ |
| Đơn vị chủ trì | Đúng 1 mã đơn vị trong Cơ cấu tổ chức VGC | Bắt buộc |
| Đơn vị phối hợp | P.KT, PK, P.QLHAUCAN | Ghi theo từng bước trong SOP |
| SOP, biểu mẫu, văn bản căn cứ | Liên kết tới kho văn bản | Chỉ liên kết bản đang hiệu lực |
| SLA tổng và SLA từng bước | Theo ngày làm việc | Dùng để tính quá hạn |
| Nhịp cập nhật bắt buộc | 2 ngày làm việc | Quá nhịp thì dữ liệu bị coi là cũ |
| Ngưỡng cảnh báo | Trễ 1 ngày báo trưởng đơn vị, trễ 3 ngày báo CEO |  |

Thẻ nghiệp vụ mẫu. Các bước, đơn vị và số ngày dưới đây chỉ là ví dụ; đơn vị chủ trì thật sẽ thay bằng SOP của mình.

```yaml
ma: NV-HCQT-07
ten: Thành lập chi nhánh
tu_khoa: [chi nhánh, mở chi nhánh, cơ sở mới, địa điểm kinh doanh]
loai: du_an_mot_lan
don_vi_chu_tri: HCQT        # ví dụ, cần CEO chốt
nguoi_phu_trach_mac_dinh: truong_don_vi_chu_tri
don_vi_phoi_hop: [P.KT, PK, P.QLHAUCAN]
sop: SOP-HCQT-07 v1.0
cac_buoc:
  - {so: 1, ten: Phê duyệt chủ trương, chu_tri: HCQT, sla_ngay: 5, dau_ra: Tờ trình đã duyệt}
  - {so: 2, ten: Chọn địa điểm và thuê mặt bằng, chu_tri: HCQT, phoi_hop: P.KT, sla_ngay: 20}
  - {so: 3, ten: Hồ sơ đăng ký hoạt động chi nhánh, chu_tri: HCQT, sla_ngay: 15}
  - {so: 4, ten: Cải tạo và trang thiết bị, chu_tri: P.QLHAUCAN, sla_ngay: 30, song_song_voi: 5}
  - {so: 5, ten: Nhân sự chuyên môn, chu_tri: PK, sla_ngay: 30, song_song_voi: 4}
  - {so: 6, ten: Giấy phép hoạt động khám chữa bệnh, chu_tri: HCQT, phoi_hop: PK, sla_ngay: 45}
  - {so: 7, ten: Khai trương, chu_tri: HCQT, sla_ngay: 7}
van_ban_can_cu: do đơn vị chủ trì khai, liên kết kho văn bản
nhip_cap_nhat: 2 ngày làm việc
canh_bao: {bao_truong_don_vi: tre 1 ngay, bao_ceo: tre 3 ngay}
```

## Hồ sơ công việc

Mỗi lần triển khai một nghiệp vụ là một hồ sơ công việc. Đây là nơi trả lời ba câu CEO hay hỏi: đang ở bước nào, ai đang làm, có quá hạn không.

| Trường | Ai ghi | Ghi chú |
| --- | --- | --- |
| Mã hồ sơ, nghiệp vụ, phiên bản SOP | Hệ thống | Giữ phiên bản SOP lúc mở hồ sơ |
| Người phụ trách | Trưởng đơn vị chủ trì | Đúng 1 người |
| Ngày bắt đầu, hạn tổng | Hệ thống tính từ SLA | Đổi hạn phải ghi lý do và người duyệt |
| Bước hiện tại (x/y) | Người phụ trách | Có thể nhiều bước cùng chạy nếu SOP cho song song |
| Người đang làm bước, hạn bước | Người phụ trách |  |
| Trạng thái bước | Người đang làm | Chưa bắt đầu / Đang làm / Chờ duyệt / Vướng / Xong |
| Vướng mắc, cần CEO quyết gì | Người phụ trách | Bắt buộc khi trạng thái Vướng |
| Biểu mẫu đã điền | Người đang làm | Bước chỉ được Xong khi đính kèm đầu ra |
| Cập nhật lần cuối | Hệ thống | Ai, lúc nào |

Ba chỉ số hệ thống tự tính, không ai nhập tay:

- **Quá hạn bước:** hôm nay đã qua hạn bước mà bước chưa Xong; kèm số ngày trễ.
- **Nguy cơ trễ tổng:** tổng số ngày còn lại của các bước chưa xong vượt quá số ngày đến hạn tổng.
- **Dữ liệu cũ:** lần cập nhật cuối đã quá nhịp cập nhật bắt buộc. Khi đó Trợ lý vẫn báo số liệu đang có nhưng ghi rõ là cũ, đồng thời gửi yêu cầu cập nhật cho người phụ trách.

## Luồng trả lời câu hỏi tiến độ của CEO

> **Sơ đồ:** luồng trả lời câu hỏi tiến độ · 3 điểm rẽ nhánh — bản có hình nằm trong [tài liệu gốc trên Claude](https://claude.ai/artifact/9hWSrjhytV1RtPnif14iKx).

Với câu “báo cáo tình hình thành lập chi nhánh”, Trợ lý khớp từ khoá “chi nhánh” với NV-HCQT-07, lấy hồ sơ đang mở và trả lời ngay nếu hồ sơ được cập nhật trong 2 ngày làm việc gần nhất. Nếu hồ sơ đã cũ, phiếu Yêu cầu báo cáo đi thẳng tới trưởng đơn vị chủ trì, kèm sẵn mẫu báo cáo ở mục dưới.

## Mẫu báo cáo tiến độ gửi CEO

Mọi câu trả lời về tiến độ đi theo một khuôn cố định, dòng đầu luôn là kết luận đúng hạn hay trễ. Ví dụ dưới đây dùng số liệu giả định.

```markdown
THÀNH LẬP CHI NHÁNH — TRỄ 3 NGÀY Ở BƯỚC 3/7
Hồ sơ HS-2026-031 · số liệu cập nhật 22/11 16:40 bởi [người phụ trách]

- Đơn vị chủ trì: [đơn vị] · Phụ trách: [họ tên]
- Đã xong: bước 1 Phê duyệt chủ trương, bước 2 Thuê mặt bằng
- Đang làm: bước 3 Hồ sơ đăng ký hoạt động chi nhánh — [người đang làm]
- Hạn bước: 20/11 → trễ 3 ngày
- Hạn tổng: 15/02/2027 → còn kịp nếu bước 4 và 5 chạy song song
- Vướng: thiếu hợp đồng thuê đã công chứng
- Cần CEO: ký giấy ủy quyền nộp hồ sơ
- Bước tiếp theo: nộp hồ sơ dự kiến 25/11
```

Quy tắc viết báo cáo:

- Luôn ghi nguồn và thời điểm cập nhật; số liệu cũ thì ghi “số liệu cũ” ngay dòng hai.
- Không suy đoán ngày xong. Chỉ đưa ngày dự kiến khi người phụ trách đã ghi.
- Dòng “Cần CEO” chỉ xuất hiện khi có việc cần CEO làm; không có thì bỏ dòng.
- CEO hỏi nhiều việc cùng lúc thì xếp việc trễ lên đầu.

## Quy tắc nạp tài liệu vào từng phòng

Agent của một phòng chỉ được nạp tài liệu đang hiệu lực mà phòng đó có quyền đọc. Bản nháp và bản hết hiệu lực không bao giờ vào ngữ cảnh agent.

| Thuộc tính tài liệu | Giá trị |
| --- | --- |
| Loại | SOP / Biểu mẫu / Văn bản căn cứ / Hướng dẫn |
| Đơn vị sở hữu | Đúng 1 mã đơn vị; chỉ đơn vị này được sửa |
| Phạm vi đọc | Riêng đơn vị / Chia sẻ cho đơn vị chỉ định / Dùng chung toàn Viện |
| Phiên bản, ngày hiệu lực, người duyệt | Bắt buộc trước khi chuyển sang Hiệu lực |
| Trạng thái | Nháp / Hiệu lực / Hết hiệu lực |
| Nghiệp vụ liên kết | Một tài liệu có thể phục vụ nhiều nghiệp vụ |

Quy tắc:

1. Agent của phòng nạp: tài liệu riêng của phòng + tài liệu dùng chung + tài liệu được chia sẻ cho phòng.
2. Đề xuất: đơn vị con được đọc tài liệu của đơn vị cha (Bộ phận XQ đọc SOP của Khoa Chẩn đoán hình ảnh), không có chiều ngược lại.
3. Hồ sơ đang chạy giữ phiên bản SOP lúc mở. Phiên bản mới áp dụng cho hồ sơ mở sau, trừ khi người phụ trách chủ động chuyển.
4. Tài liệu có dữ liệu nhạy cảm (nhân sự, lương, bệnh nhân) chỉ đưa tiêu đề và thông tin mô tả vào agent, không đưa nội dung.
5. Tài liệu sắp hết hiệu lực: nhắc đơn vị sở hữu trước 30 ngày.
6. Nghiệp vụ chưa có SOP vẫn được mở hồ sơ, nhưng bị đánh dấu “thiếu SOP” trên dashboard của CEO.

## Đặt ở đâu và lộ trình nạp dữ liệu

Đề xuất xây kho này ngay trong VGC, vì VGC đã có sẵn hai trong ba lớp. Trợ lý điều phối chỉ đọc dữ liệu qua API, không giữ bản sao riêng.

| Lớp | Trong VGC | Cần làm thêm |
| --- | --- | --- |
| Cây tổ chức | Phân hệ Cơ cấu tổ chức: 29 đơn vị, mã đơn vị, người quản lý | Làm sạch dữ liệu (tab chính, mục Cơ cấu tổ chức thực tế) |
| Bộ tài liệu | Module docRegistry đã thiết kế: phê duyệt động, sở hữu, phiên bản | Thêm trường Loại, Phạm vi đọc, Nghiệp vụ liên kết |
| Danh mục nghiệp vụ | Chưa có | Thực thể mới nối đơn vị, tài liệu và các bước SOP |
| Hồ sơ công việc | Module Công việc đang thiết kế theo AMIS Công việc | Thêm liên kết nghiệp vụ, bước theo SOP, nhịp cập nhật, chỉ số quá hạn và dữ liệu cũ |
| API cho Trợ lý | tRPC sẵn có | Tài khoản dịch vụ: đọc danh mục, hồ sơ, thông tin tài liệu; ghi duy nhất phiếu Yêu cầu báo cáo |

Lộ trình nạp dữ liệu:

1. **Tuần 1 – Kê nghiệp vụ.** Mỗi trưởng đơn vị kê 5–10 việc CEO hay hỏi nhất. Trợ lý lọc trùng và chồng chéo; CEO chốt đơn vị chủ trì.
2. **Tuần 2 – Gắn tài liệu.** Đưa SOP, biểu mẫu đang có (Word, PDF) vào docRegistry; đánh dấu nghiệp vụ còn thiếu SOP.
3. **Tuần 3 – Mở hồ sơ.** Nhập các việc đang chạy dở, bắt đầu với Thành lập chi nhánh.
4. **Tuần 4 – Bật Trợ lý.** Trợ lý trả lời câu hỏi tiến độ. Đo tỷ lệ câu hỏi trả lời được ngay mà không phải hỏi lại đơn vị.

## Quyết định cần chốt

Sáu quyết định này cần có trước tuần 1 của lộ trình.

- [ ] Đơn vị chủ trì nghiệp vụ Thành lập chi nhánh.
- [ ] Nhịp cập nhật bắt buộc mặc định (đề xuất 2 ngày làm việc) và hạn trả lời phiếu Yêu cầu báo cáo (đề xuất 4 giờ làm việc).
- [ ] Ngưỡng tự báo CEO khi trễ (đề xuất 3 ngày).
- [ ] Danh mục nghiệp vụ là thực thể mới hay mở rộng từ module Công việc.
- [ ] Đơn vị con có được đọc tài liệu của đơn vị cha không.
- [ ] Hồ sơ đang chạy có tự chuyển sang SOP phiên bản mới không.
