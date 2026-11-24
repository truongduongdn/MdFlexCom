# MdFlexCom

Công ty MdFlex — dự án **Đội quân AI vận hành**: CEO giao việc → Trợ lý điều phối phân phối → Trưởng phòng AI → Chuyên viên AI, chạy trên một bảng phiếu chung với quy định nạp theo từng vị trí.

## Cấu trúc

```
docs/doi-quan-ai/
  01-dac-ta-kien-truc.md     Đặc tả kiến trúc: tổ chức, 3 luồng, vị trí, quy định 3 tầng,
                             giao thức phiếu, khung chat CEO, giám sát, an toàn, lộ trình
  02-kho-nghiep-vu-sop.md    Kho nghiệp vụ, văn bản, SOP theo đơn vị; luồng Trợ lý trả lời tiến độ
apps/ceo-intake/             Khung chat Phiếu yêu cầu CEO (Node thuần, cổng 3100)
AGENTS.md                    Quy tắc cho agent lập trình (Codex / Claude Code)
```

Tài liệu gốc có sơ đồ nằm trên Claude: https://claude.ai/artifact/9hWSrjhytV1RtPnif14iKx — các tệp trong `docs/` là bản xuất Markdown ngày 24/11/2026.

## Chạy app Khung chat Phiếu yêu cầu

```bash
cd apps/ceo-intake
node server.js        # Windows: bấm đúp start.bat
# mở http://localhost:3100
```

Cần Node.js 18+, không cần `npm install`. Chi tiết: [apps/ceo-intake/README.md](apps/ceo-intake/README.md).

## Việc còn mở

- Danh sách Loại việc A–K ("mục 3") và định nghĩa Mức dữ liệu ("mục 5") chưa có — điền vào `apps/ceo-intake/config/loai-viec.json` và tài liệu đặc tả.
- Đơn vị chủ trì nghiệp vụ "Thành lập chi nhánh" đang là ví dụ, cần CEO chốt.
- Phiếu giao việc hiện chỉ ghi tệp JSON; chưa nối sang module Công việc của VGC.
