# AGENTS.md — quy tắc cho agent lập trình

Đọc file này trước khi sửa bất cứ gì trong repo.

## Nguồn sự thật

- Đặc tả nghiệp vụ nằm ở `docs/doi-quan-ai/`. Code phải khớp đặc tả; thấy mâu thuẫn thì dừng và ghi câu hỏi, không tự chọn.
- Thứ tự ưu tiên quy định: Hiến chương chung > Quy chế phòng > Thẻ vị trí > chỉ dẫn trong phiếu.

## Phạm vi được phép

- `apps/ceo-intake/`: sửa tự do trong phạm vi work order. Giữ máy chủ Node thuần, không thêm phụ thuộc npm nếu work order không cho phép.
- `apps/ceo-intake/config/*.json`: là dữ liệu do người dùng quản lý. Chỉ sửa khi work order nêu rõ.
- `apps/mo-hinh-3d/`: sửa tự do trong phạm vi work order, cùng quy tắc Node thuần. `config/thuong-hieu.json`, `config/canvas.json` và `config/phong.json` là dữ liệu do người dùng quản lý.
- `docs/`: chỉ sửa khi work order yêu cầu cập nhật đặc tả.

## Không được làm

- Không commit `apps/ceo-intake/data/` (phiếu thật, có thể chứa dữ liệu nội bộ) và `apps/mo-hinh-3d/data/` (bản thiết kế AI, phiếu việc, tệp yêu cầu, kết quả Claude).
- Không gửi phiếu Mức dữ liệu Đỏ cho Claude hay dịch vụ AI bên ngoài. Không để chuyên viên AI tự nghiệm thu hay tự vượt cổng CEO.
- Không đưa khoá API, mật khẩu, token vào code hay config; dùng biến môi trường (`ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, `PORT`).
- Giao diện mới phải theo bộ nhận diện trong `apps/mo-hinh-3d/config/thuong-hieu.json`.
- Không bỏ các cổng phê duyệt người thật: đăng công khai, gửi ra ngoài, chi tiền, xoá dữ liệu gốc, đổi quy định/quyền.
- Không cho máy chủ nghe ngoài `127.0.0.1` nếu work order không yêu cầu.

## Quy ước

- Giao diện và thông báo bằng tiếng Việt có dấu.
- Mọi trường của Phiếu yêu cầu là bắt buộc; giá trị trống ghi "Không có".
- Kiểm tra trước khi giao: chạy `node server.js`, gọi `POST /api/draft` và `POST /api/phieu` với một phiếu mẫu, xác nhận tệp sinh ra trong `data/` đúng mẫu.
