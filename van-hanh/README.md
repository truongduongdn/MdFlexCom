# Vận hành MdFlex trên máy thật

Hướng dẫn chạy hai app cho CEO dùng hằng ngày trên **máy chính** (máy giữ phiếu thật). Máy phụ chỉ sửa code và đồng bộ qua GitHub, nhánh `feat/doi-quan-ai`.

| App | Địa chỉ | Dùng để |
| --- | --- | --- |
| Khung chat Phiếu yêu cầu | http://localhost:3100 | CEO gõ yêu cầu → Phiếu yêu cầu đủ trường → Phiếu giao việc |
| Mô hình 3D | http://localhost:3200/ceo.html | Bảng CEO: việc chờ quyết, điểm nóng, KPI, bản tin sáng |
| | http://localhost:3200/giao-viec.html | Giao việc cho 5 phòng, Claude làm phiếu chuyên viên |

Cả hai máy chủ chỉ nghe trên `127.0.0.1`: chỉ dùng được ngay trên máy chính, người khác trong mạng không mở được.

## Tệp trong thư mục này

| Tệp | Việc |
| --- | --- |
| `chay-mdflex.bat` | Bấm đúp để chạy: kiểm tra nhanh → sao lưu → bật 2 máy chủ → mở Bảng CEO và Khung chat. Cơ cấu MdFlex — **máy chính dùng tệp này** |
| `chay-vien-gut.bat` | Như trên nhưng Mô hình 3D chạy cơ cấu Viện Gút (`CO_CAU=vien-gut`) — chỉ dùng trên máy phụ |
| `kiem-tra.js` | `node van-hanh/kiem-tra.js`: kiểm tra đầy đủ, gồm chạy thử hai app trên **bản sao tạm** (không đụng `data/` thật, không gọi Claude/Perplexity, không tốn tiền). Mô hình 3D luôn được thử với MdFlex (gỡ `CO_CAU`) và với từng cơ cấu trong `config/co-cau/`. Thêm `--nhanh` để bỏ phần chạy thử |
| `sao-luu.js` | `node van-hanh/sao-luu.js`: chép `data/` của hai app và `config/tai-khoan.json` ra ngoài repo |

Mã thoát của `kiem-tra.js`: `0` là đạt (có thể kèm dòng ⚠ cảnh báo), `1` là có dòng ✘ phải sửa trước khi chạy.

## Cài lần đầu trên máy chính

1. Cài Node.js 18 trở lên và Git. Không cần `npm install`.
2. Lấy mã:
   ```powershell
   git clone https://github.com/truongduongdn/MdFlexCom.git
   cd MdFlexCom
   git checkout feat/doi-quan-ai
   ```
   Nếu đã có repo: `git pull`.
3. Đặt khoá API **cho tài khoản Windows**, không ghi vào tệp nào trong repo. Repo đang công khai.
   ```powershell
   setx ANTHROPIC_API_KEY "<khoá Claude>"
   setx PERPLEXITY_API_KEY "<khoá Perplexity>"   # chỉ cần cho tab Thiết kế AI
   ```
   `setx` chỉ có hiệu lực ở cửa sổ mở **sau** lệnh này. Không có khoá thì app vẫn chạy theo quy tắc; khoá Claude cũng gắn tạm được ở trang Giao việc (tắt máy chủ là mất).
4. Tài khoản giao việc mặc định: chép `apps/mo-hinh-3d/config/tai-khoan.example.json` thành `tai-khoan.json` và điền email. Tệp này đã gitignore.
5. Chạy kiểm tra đầy đủ: `node van-hanh/kiem-tra.js`. Phải ra "Kết quả: đạt".

Không đặt biến `PORT` chung cho cả máy: cả hai app đọc cùng biến này và sẽ đụng cổng. Bộ kiểm tra sẽ cảnh báo nếu thấy.

## Hằng ngày

- Bấm đúp `van-hanh\chay-mdflex.bat`. Hai cửa sổ "MdFlex – …" là hai máy chủ; đóng cửa sổ là tắt máy chủ.
- Muốn tự chạy khi đăng nhập Windows: `Win + R` → `shell:startup` → tạo lối tắt tới `chay-mdflex.bat` trong thư mục vừa mở.
- Nếu app đã chạy sẵn, tệp `.bat` không bật thêm bản thứ hai, chỉ mở trình duyệt.

## Sao lưu và khôi phục

`data/` chứa phiếu thật và **không nằm trong git**: mất máy là mất phiếu, trừ khi có bản sao lưu.

- Mỗi lần chạy `chay-mdflex.bat` là có một bản sao lưu. Mặc định bản sao nằm trong thư mục `MdFlexCom-sao-luu` cạnh repo, mỗi lần là một thư mục `YYYY-MM-DD_HHmmss`. Script giữ 60 bản mới nhất.
- Nên đặt nơi lưu ở **ổ khác** hoặc ổ ngoài:
  ```powershell
  setx SAO_LUU_DIR "D:\SaoLuu\MdFlex"
  setx GIU_LAI 90
  ```
  Script từ chối lưu vào trong repo, để bản sao không bị commit lên GitHub. Khi đặt nơi lưu là thư mục đồng bộ đám mây, cần nhớ rằng phiếu Mức dữ liệu Đỏ cũng nằm trong đó.
- Sao lưu theo lịch, ví dụ 12:00 và 18:00 hằng ngày:
  ```powershell
  schtasks /Create /SC DAILY /ST 12:00 /TN "MdFlex sao luu 12h" /TR "node C:\MdFlexCom\van-hanh\sao-luu.js"
  schtasks /Create /SC DAILY /ST 18:00 /TN "MdFlex sao luu 18h" /TR "node C:\MdFlexCom\van-hanh\sao-luu.js"
  ```
  Thay `C:\MdFlexCom` bằng đường dẫn repo trên máy chính. Nếu đường dẫn có dấu cách, hãy đặt repo ở chỗ khác cho gọn. Nếu đã đổi nơi lưu bằng `setx SAO_LUU_DIR`, việc theo lịch cũng dùng giá trị đó.

**Khôi phục** (làm tay, vì đây là thay dữ liệu gốc):

1. Đóng hai cửa sổ máy chủ.
2. Đổi tên thư mục hỏng, **không xoá**: `apps\ceo-intake\data` → `data.hong-2026-11-25`.
3. Chép `apps\ceo-intake\data` từ bản sao lưu muốn dùng vào chỗ cũ. Làm tương tự với `apps\mo-hinh-3d\data` nếu cần.
4. Chạy `node van-hanh/kiem-tra.js --nhanh` và xem số phiếu khớp với bản sao lưu, rồi chạy lại `chay-mdflex.bat`.

Bộ kiểm tra báo ✘ khi có tệp phiếu hỏng không đọc được, hoặc khi bộ đếm số phiếu nhỏ hơn số phiếu đã có, vì phiếu mới sẽ ghi đè phiếu cũ.

## Cập nhật phiên bản

Code chỉ đi một đường: máy phụ sửa → commit → push lên `feat/doi-quan-ai` → máy chính pull.

1. Trên máy chính: đóng hai cửa sổ máy chủ.
2. Chạy `git pull`.
3. Chạy `node van-hanh/kiem-tra.js` (bản đầy đủ). Có ✘ thì không chạy; quay về bản trước bằng `git checkout <commit cũ>` và báo lại.
4. Bấm đúp `chay-mdflex.bat`.

Không sửa code trên máy chính. Nếu lỡ sửa, chạy `git status` trước khi pull. Bộ kiểm tra cũng báo khi có thay đổi chưa commit hoặc khi bản trên GitHub mới hơn.

## Giới hạn cần biết

- **Chưa có đăng nhập.** "Vai đang thao tác" chọn trên trang. Ai ngồi ở máy chính đều thao tác được với vai CEO, kể cả duyệt cổng CEO. Hãy khoá màn hình khi rời máy.
- Chỉ dùng trên một máy (127.0.0.1). Muốn mở cho nhân sự qua mạng nội bộ thì phải làm đăng nhập trước, và cần CEO cho phép đổi quy tắc trong `AGENTS.md`.
- Mỗi lần Claude làm phiếu đều tốn tiền API: Opus 5.5 khoảng 4 USD/1 triệu token vào, 20 USD/1 triệu token ra. Chi phí ghi trong nhật ký phiếu. Trần chi phí theo ngày chưa cài (chờ CEO chốt).
- Phiếu Mức dữ liệu Đỏ không bao giờ gửi cho Claude hay Perplexity.

## Trước khi tính là "dùng thật" (cổng GĐ0 → GĐ1)

Bộ kiểm tra hiện báo cảnh báo cho các việc dưới đây; chúng chặn cổng GĐ0 theo `docs/doi-quan-ai/01-dac-ta-kien-truc.md`:

- [ ] Danh sách Loại việc A–K ("mục 3") và định nghĩa Mức dữ liệu ("mục 5"): điền `apps/ceo-intake/config/loai-viec.json`.
- [ ] Gộp PR #2 (`feat/mdflex-co-cau`): Khung chat chuyển từ cơ cấu Viện Gút sang 5 phòng MdFlex.
- [ ] CEO chốt đơn vị chủ trì các nghiệp vụ còn `viDu: true`.
- [ ] Sáu quyết định CEO trong đặc tả: bảng công việc, website/CMS, nguồn được quét, mức tự động đăng, trần chi phí API theo ngày, phòng thứ hai.

Cổng ra GĐ1: 10 phiếu liên tiếp đạt nghiệm thu, không vượt cổng. Theo dõi chỉ số "đạt nghiệm thu lần đầu" trên Bảng CEO.
