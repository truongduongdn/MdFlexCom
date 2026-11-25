# Thiết kế: Buồng điều hành CEO

Ngày 25/11/2026 · app `apps/mo-hinh-3d` · nhánh `feat/vien-gut`

## Vì sao

CEO cần quản lý các trưởng phòng theo một vòng khép kín: **đặt mục tiêu → lập kế hoạch → giao thành phiếu → theo dõi đơn vị đã nhận, làm tới đâu, có phản hồi không → đánh giá**. Hiện app chỉ nhìn được từng phiếu (Bảng CEO `ceo.html`). Chưa có "mục tiêu" để gom các phiếu, chưa có kênh phản hồi bằng lời, chưa có đánh giá theo kỳ.

## Mục tiêu

- CEO tạo và sửa **Mục tiêu**: tên, kỳ, kết quả cần đạt, chỉ số đo, các đơn vị tham gia, mức dữ liệu.
- **Kế hoạch**: danh sách mốc (tên, hạn, đơn vị phụ trách, đã xong hay chưa) nằm trong mục tiêu.
- **Triển khai**: từ mục tiêu bấm "Giao" thì tạo phiếu bằng đúng luồng giao việc hiện có (CEO → Trợ lý điều phối → Trưởng phòng → Chuyên viên). Một mục tiêu giao được nhiều đợt.
- **Theo dõi** từng đơn vị trong mục tiêu: thời điểm nhận, trạng thái, bước hiện tại, % phiếu thực hiện đã xong, quá hạn, vướng, chờ CEO, phản hồi gần nhất và thời điểm phản hồi.
- **Phản hồi**: nút Phản hồi trên phiếu cho người nhận, người giao, Trưởng phòng của phòng, CEO, Trợ lý điều phối. Ba loại: Báo cáo tiến độ, Hỏi lại, Khó khăn. CEO trả lời ngay trên Buồng điều hành.
- **Đánh giá**: CEO chấm từng đơn vị trong mục tiêu (Đạt / Đạt một phần / Không đạt, điểm 1–5, nhận xét bắt buộc khi không phải Đạt). Mục tiêu có tổng kết.
- **Thẻ trưởng phòng**: mỗi đơn vị một thẻ gồm số mục tiêu tham gia, điểm đánh giá trung bình, % phiếu đúng SLA, số phiếu quá hạn hoặc vướng đang mở, số phản hồi, và **phản hồi im lặng** (phiếu đang mở quá 2 ngày làm việc không có phản hồi nào từ phòng).

## Không làm (lần này) : Không cần người thật làm việc với AI, Mỗi phòng hệ thống tự xây dựng 1 trưởng phòng AI, Chịu trách nhiệm của trưởng phòng AI: giao việc, nhận phản hồi, báo cáo CEO, tự đánh giá. Chỉ cần CEO và Trợ lý điều phối là người thật.

- Đăng nhập, phân quyền theo người thật: vẫn dùng "vai đang thao tác" chọn trên trang như các trang hiện có.
- Gửi thông báo (email, Zalo…): CEO vẫn tự báo cho trưởng phòng.
- Năng lực nhân sự, khung kỹ năng theo vị trí: dự án sau.
- AI tự đánh giá hay tự chấm điểm trưởng phòng.

## Không được xảy ra

- Đổi hành vi phiếu hiện có. Phiếu không gắn mục tiêu phải chạy y như cũ; đầu ra API của MdFlex (mốc chuẩn trong `kiem-tra`) không đổi.
- AI ghi đánh giá, hoặc chuyên viên AI tự vượt cổng CEO.
- Gửi phiếu Mức dữ liệu Đỏ cho Claude (luồng giao vẫn tuân quy tắc cũ).

## Ràng buộc

Node thuần, không npm; chỉ nghe 127.0.0.1; giao diện tiếng Việt có dấu, theo `config/thuong-hieu.json`; `data/` không commit. Cơ cấu theo biến `CO_CAU`: đơn vị là `id` phòng của cơ cấu đang chạy; mục tiêu có đơn vị không thuộc cơ cấu này thì chỉ xem, không thao tác (như phiếu, mã 409).

## Cách làm đã chọn: A

| Cách | Đánh đổi | Kết quả |
| --- | --- | --- |
| **A. Mục tiêu là hồ sơ riêng, nối xuống phiếu** | Thêm một loại dữ liệu và một trang | **Đã chọn**: đủ vòng mục tiêu → giao → theo dõi → đánh giá theo kỳ, dùng lại toàn bộ phiếu |
| B. Phiếu gốc của CEO coi là mục tiêu | Ít việc, nhưng không có kỳ, không giao nhiều đợt, khó đánh giá trưởng phòng | Bỏ |
| C. Công cụ quản lý công việc bên ngoài | Quyết định CEO chưa chốt, đưa dữ liệu ra ngoài | Bỏ |

## Dữ liệu

`data/muc-tieu/MT-####.json`:

```json
{
  "ma": "MT-0001", "ten": "…", "co_cau": "vien-gut",
  "ky": { "loai": "quy", "ten": "Q4/2026", "tu": "2026-10-01", "den": "2026-12-31" },
  "ket_qua_can_dat": "…",
  "chi_so": [{ "ten": "…", "chi_tieu": "…", "thuc_te": "" }],
  "don_vi": ["pk", "p-kt"],
  "muc_du_lieu": "Vàng",
  "ke_hoach": [{ "ten": "…", "han": "2026-12-02", "don_vi": "pk", "xong": false }],
  "phieu_goc": ["PH-0004"],
  "trang_thai": "Đang triển khai",
  "danh_gia": { "pk": { "ket_qua": "Đạt", "diem": 4, "nhan_xet": "…", "luc": "…" } },
  "tong_ket": "",
  "nhat_ky": [{ "luc": "…", "ai": "CEO", "hanh_dong": "Tạo mục tiêu", "ghi_chu": "…" }],
  "tao_luc": "…"
}
```

- Trạng thái: Nháp → Đang triển khai (khi giao đợt đầu) → Chờ đánh giá (tự chuyển khi qua ngày `ky.den` hoặc mọi phiếu gốc đã Xong/Đã ngừng) → Đã đánh giá (khi đủ đánh giá cho mọi đơn vị và có tổng kết). Nhánh Huỷ (CEO, bắt buộc lý do).
- Phiếu gốc tạo từ mục tiêu có thêm trường **`ma_muc_tieu: "MT-0001"`** (không dùng `muc_tieu`: trường đó đã là nội dung mục tiêu của phiếu). Phiếu không tạo từ mục tiêu không có trường này. Có thể gắn phiếu gốc CEO đã giao trước đó vào mục tiêu (ví dụ PH-0004 "soạn quy trình").
- Phản hồi ghi vào `nhat_ky` của phiếu: `{ hanh_dong: "Phản hồi", loai, ghi_chu, ai, luc }`. Không đổi trạng thái phiếu. Loại: Báo cáo tiến độ / Hỏi lại / Khó khăn; CEO và Trợ lý điều phối dùng thêm loại **Trả lời**.
- Mọi sửa mục tiêu ghi nhật ký kèm lý do, giá trị cũ → mới (như Sửa phiếu).

## API

| Đường dẫn | Ai | Việc |
| --- | --- | --- |
| `GET /api/muc-tieu` | mọi vai | Danh sách mục tiêu kèm số liệu tính sẵn theo đơn vị |
| `GET /api/muc-tieu/MT-0001` | mọi vai | Một mục tiêu, phiếu liên quan, phản hồi gộp theo thời gian |
| `POST /api/muc-tieu` | CEO | Tạo (trạng thái Nháp) |
| `POST /api/muc-tieu/MT-0001/sua` | CEO | Sửa, bắt buộc lý do |
| `POST /api/muc-tieu/MT-0001/giao` | CEO | Giao một đợt: dùng lại logic `POST /api/giao-viec` với `phong` = đơn vị chọn (mặc định mọi đơn vị của mục tiêu) |
| `POST /api/muc-tieu/MT-0001/gan-phieu` | CEO | Gắn phiếu gốc CEO đã có |
| `POST /api/muc-tieu/MT-0001/danh-gia` | CEO | Chấm một đơn vị, hoặc ghi tổng kết |
| `POST /api/muc-tieu/MT-0001/huy` | CEO | Huỷ, bắt buộc lý do |
| `POST /api/phieu/PH-0001/phan-hoi` | người nhận, người giao, TP phòng, CEO, TL-DP | Ghi phản hồi |
| `GET /api/truong-phong` | mọi vai | Thẻ trưởng phòng của mọi đơn vị trong cơ cấu đang chạy |

## Trang

`/dieu-hanh.html` — Buồng điều hành CEO. Liên kết từ Bảng CEO và thanh trên trang chủ.

```
┌ Buồng điều hành · Viện Gút ─────────── Vai: [CEO ▾] ── Kỳ: [Q4/2026 ▾] ─┐
│ Mục tiêu            │ MT-0001 Bộ quy trình các phòng   Đang triển khai 38% │
│ ● MT-0001  38% ⚠2   │ [Mục tiêu] [Kế hoạch] [Triển khai] [Đánh giá]       │
│ ○ MT-0002  Nháp     │ Đơn vị      Nhận   Bước          Xong  Phản hồi     │
│ + Mục tiêu mới      │ Phòng khám  14:31  Đang làm      0/1   ⚠ im lặng 3n │
│                     │ Kế toán     14:31  Vướng         0/1   "Thiếu …" 2g │
├─────────────────────┴──────────────────────────────────────────────────────┤
│ Thẻ trưởng phòng: [Phòng khám 3.5★ 80% SLA ⚠1] [Kế toán …] …               │
└────────────────────────────────────────────────────────────────────────────┘
```

- Tab **Triển khai** có luồng phản hồi; CEO trả lời ngay tại đó (ghi phản hồi vào phiếu của đơn vị).
- Trang Phòng làm việc (`phong.html`) thêm nút **Phản hồi** trong chi tiết phiếu, để trưởng phòng báo lại.
- Tự làm mới mỗi 30 giây như Bảng CEO.

## Quy tắc chi tiết (quyết định của người viết thiết kế, sau vòng rà soát)

1. **Phiếu của một đơn vị** trong mục tiêu = phiếu Trợ lý điều phối → Trưởng phòng của đơn vị đó, thuộc phiếu gốc có `ma_muc_tieu`, cùng các phiếu con của nó. "Bước" và "% xong" tính như tab Luồng việc (phiếu lá).
2. **Phản hồi của đơn vị** = mục nhật ký `hanh_dong: "Phản hồi"` do Trưởng phòng hoặc chuyên viên của phòng ghi, trên bất kỳ phiếu nào trong chuỗi của đơn vị. Nhận/bắt đầu tự động không tính. **CEO trả lời** ghi vào phiếu Trợ lý → Trưởng phòng của đơn vị.
3. **Im lặng**: đơn vị có phiếu đang mở đã tạo quá 48 giờ, mà trong 48 giờ gần nhất không có phản hồi nào của đơn vị. Áp dụng cho mọi phiếu đang mở của phòng, không chỉ phiếu gắn mục tiêu.
4. **Thẻ trưởng phòng**: % đúng SLA, quá hạn, vướng, phản hồi, im lặng tính trên **mọi phiếu của phòng**; số mục tiêu và điểm trung bình tính trên mục tiêu có đơn vị đó. Bộ lọc Kỳ lọc cả hai (phiếu theo `tao_luc` trong kỳ, mục tiêu theo kỳ); chọn "Tất cả" thì không lọc.
5. **Một đợt giao**: CEO điền mục tiêu đợt, đầu vào, đầu ra, tiêu chí, ưu tiên, hạn, cổng, đơn vị; form điền sẵn từ mục tiêu (kết quả cần đạt, tiêu chí = các chỉ số, hạn = mốc kế hoạch được chọn hoặc `ky.den`, đơn vị = đơn vị của mốc hoặc mọi đơn vị). Mức dữ liệu của đợt không thấp hơn mức của mục tiêu.
6. **Gắn phiếu có sẵn**: chỉ phiếu gốc CEO → Trợ lý chưa gắn mục tiêu nào. Đơn vị trong phiếu chưa có trong mục tiêu thì tự thêm vào `don_vi`, ghi nhật ký.
7. **Trạng thái cho phép**: giao, gắn phiếu ở Nháp / Đang triển khai / Chờ đánh giá; chấm và tổng kết ở Đang triển khai / Chờ đánh giá; Đã đánh giá và Huỷ thì chỉ xem.

## Kiểm thử

- `van-hanh/kiem-tra.js`: chạy thử trên bản sao gồm tạo mục tiêu → giao → phản hồi → đánh giá, với MdFlex và với từng cơ cấu trong `config/co-cau/`.
- Mốc chuẩn MdFlex: đầu ra các API cũ không đổi.

## Để người làm tự quyết

Bố cục chi tiết và màu theo bộ nhận diện; cách tính "2 ngày làm việc" (tạm tính 48 giờ lịch, không trừ ngày nghỉ, giống SLA hiện tại); thứ tự sắp xếp danh sách.
