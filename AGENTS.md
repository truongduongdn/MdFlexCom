# AGENTS.md — quy tắc cho agent lập trình

Đọc file này trước khi sửa bất cứ gì trong repo.

## Nguồn sự thật

- Đặc tả nghiệp vụ nằm ở `docs/doi-quan-ai/`. Code phải khớp đặc tả; thấy mâu thuẫn thì dừng và ghi câu hỏi, không tự chọn.
- Thứ tự ưu tiên quy định: Hiến chương chung > Quy chế phòng > Thẻ vị trí > chỉ dẫn trong phiếu.

## Phạm vi được phép

- `apps/ceo-intake/`: sửa tự do trong phạm vi work order. Giữ máy chủ Node thuần, không thêm phụ thuộc npm nếu work order không cho phép.
- `apps/ceo-intake/config/*.json`: là dữ liệu do người dùng quản lý. Chỉ sửa khi work order nêu rõ.
- `docs/`: chỉ sửa khi work order yêu cầu cập nhật đặc tả.

## Không được làm

- Không commit `apps/ceo-intake/data/` (phiếu thật, có thể chứa dữ liệu nội bộ).
- Không đưa khoá API, mật khẩu, token vào code hay config; dùng biến môi trường (`ANTHROPIC_API_KEY`, `PORT`).
- Không bỏ các cổng phê duyệt người thật: đăng công khai, gửi ra ngoài, chi tiền, xoá dữ liệu gốc, đổi quy định/quyền.
- Không cho máy chủ nghe ngoài `127.0.0.1` nếu work order không yêu cầu.

## Quy ước

- Giao diện và thông báo bằng tiếng Việt có dấu.
- Mọi trường của Phiếu yêu cầu là bắt buộc; giá trị trống ghi "Không có".
- Kiểm tra trước khi giao: chạy `node server.js`, gọi `POST /api/draft` và `POST /api/phieu` với một phiếu mẫu, xác nhận tệp sinh ra trong `data/` đúng mẫu.
