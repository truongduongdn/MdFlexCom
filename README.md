# MdFlexCom

MdFlex — phần mềm thông tin y tế tích hợp (HIS, EMR, LIS, PMS, PACS) cho phòng khám tư nhân. Repo này phục vụ xây dựng công ty: 5 phòng ban, đội AI vận hành, Business Model Canvas, lộ trình G0–G3 và thiết kế giao diện theo bộ nhận diện thương hiệu.

## Giới thiệu

MdFlex là công ty phần mềm y tế, cung cấp hệ thống thông tin tích hợp HIS, EMR/EHR, LIS, PMS, PACS cho phòng khám đa khoa tư nhân, sau đó mở rộng sang phòng khám chuyên khoa và chuỗi bệnh viện. Giá trị cốt lõi: tích hợp liền mạch, tuân thủ pháp lý 100%, tăng hiệu quả vận hành 40%, triển khai xong trong 90 ngày.

Công ty được xây dựng từ ngày thành lập theo mô hình **đội quân AI vận hành**:

- CEO đặt mục tiêu; Trợ lý điều phối (AI) chuyển thành phiếu giao cho 5 phòng: Kinh doanh, Marketing – Truyền thông, Phát triển phần mềm, Kế toán, Nhân sự – Hành chính.
- Mỗi phòng chủ trì các thành tố của Business Model Canvas, có chức năng, KPI và quy trình bàn giao chuẩn.
- Lộ trình tính từ ngày sản phẩm hoàn thành (N0): G0 21 người, G1 (+3 tháng) 28 người, G2 (+12 tháng) 49 người, G3 (+24 tháng) 73 người.
- Giao diện mọi sản phẩm theo bộ nhận diện MdFlex: teal `#149078`, cam `#F48C0C`, DM Sans / Inter / JetBrains Mono.

| Thành viên | Vai trò |
| --- | --- |
| CEO (người thật) | Đặt mục tiêu, chiến lược; duyệt các cổng người thật |
| Claude | Kiến trúc sư: viết đặc tả, review code và thiết kế |
| Codex | Lập trình theo work order |
| Perplexity | Nghiên cứu nguồn ngoài, đề xuất thiết kế theo nhận diện, soạn tài liệu |

## Cấu trúc

```
docs/doi-quan-ai/
  01-dac-ta-kien-truc.md     Đặc tả kiến trúc: tổ chức, 3 luồng, vị trí, quy định 3 tầng,
                             giao thức phiếu, khung chat CEO, giám sát, an toàn, lộ trình
  02-kho-nghiep-vu-sop.md    Kho nghiệp vụ, văn bản, SOP theo đơn vị; luồng Trợ lý trả lời tiến độ
apps/ceo-intake/             Khung chat Phiếu yêu cầu CEO (Node thuần, cổng 3100)
apps/mo-hinh-3d/             Mô hình 3D công ty, Canvas 9 thành tố, chức năng 5 phòng,
                             Thiết kế AI qua Perplexity, danh mục thành lập (Node thuần, cổng 3200)
van-hanh/                    Chạy trên máy thật: khởi động 1 cú bấm, kiểm tra, sao lưu
AGENTS.md                    Quy tắc cho agent lập trình (Codex / Claude Code)
```

Tài liệu gốc có sơ đồ nằm trên Claude: https://claude.ai/artifact/9hWSrjhytV1RtPnif14iKx — các tệp trong `docs/` là bản xuất Markdown ngày 24/11/2026.

## Chạy các app

Cần Node.js 18+, không cần `npm install`. Cả hai máy chủ chỉ nghe trên `127.0.0.1`.

**Dùng thật trên máy chính:** bấm đúp `van-hanh\chay-mdflex.bat` để chạy kiểm tra, sao lưu, bật cả hai app và mở Bảng CEO. Cài đặt, sao lưu, khôi phục, cập nhật: [van-hanh/README.md](van-hanh/README.md).

**Khung chat Phiếu yêu cầu CEO** — http://localhost:3100

```bash
cd apps/ceo-intake
node server.js        # Windows: bấm đúp start.bat
```

Chi tiết: [apps/ceo-intake/README.md](apps/ceo-intake/README.md).

**Mô hình 3D công ty** — http://localhost:3200

```bash
cd apps/mo-hinh-3d
node server.js        # Windows: bấm đúp start.bat
```

Tab Thiết kế AI cần biến môi trường `PERPLEXITY_API_KEY`. Chi tiết: [apps/mo-hinh-3d/README.md](apps/mo-hinh-3d/README.md).

## Việc còn mở

- Danh sách Loại việc A–K ("mục 3") và định nghĩa Mức dữ liệu ("mục 5") chưa có — điền vào `apps/ceo-intake/config/loai-viec.json` và tài liệu đặc tả.
- Đơn vị chủ trì nghiệp vụ "Thành lập chi nhánh" đang là ví dụ, cần CEO chốt.
- Phiếu giao việc hiện chỉ ghi tệp JSON; chưa nối sang module Công việc của VGC.
- Tầm nhìn, sứ mệnh và hai thành tố Canvas "Đối tác chính", "Hoạt động chính" trong `apps/mo-hinh-3d/config/canvas.json` là đề xuất, cần CEO chốt.
- `apps/ceo-intake/config/don-vi.json` vẫn theo cơ cấu Viện Gút; cần chuyển sang 5 phòng MdFlex.
