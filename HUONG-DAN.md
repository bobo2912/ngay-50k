# Ngày 50k – bản PWA cài trên điện thoại

Thư mục này là toàn bộ app. Bạn đưa nó lên một trang web miễn phí (GitHub Pages), rồi thêm vào màn hình chính iPhone.

## Trong thư mục có gì

- `index.html`: app
- `manifest.webmanifest`: tên và icon khi cài lên màn hình chính
- `sw.js`: giúp app mở được khi không có mạng
- `IN-THIS-VERSION.md`: danh sách tính năng, điểm mới của bản hiện tại và lịch sử các phiên bản
- `fonts/`, `vendor/`, `icons/`: phông chữ, thư viện quét QR, icon. Tất cả nằm sẵn trong thư mục, app không tải gì từ trang web khác.

## Bước 1: Đưa app lên GitHub Pages (làm một lần, trên máy tính)

1. Tạo tài khoản miễn phí tại github.com.
2. Bấm dấu **+** góc trên bên phải, chọn **New repository**. Đặt tên, ví dụ `ngay-50k`, chọn **Public**, bấm **Create repository**.
3. Trong trang repository, bấm **uploading an existing file**. Kéo **toàn bộ nội dung** của thư mục này vào (gồm các file và 3 thư mục `fonts`, `vendor`, `icons`). Bấm **Commit changes**.
4. Vào **Settings**, chọn **Pages** ở cột trái. Ở mục **Branch**, chọn `main` và `/ (root)`, bấm **Save**.
5. Đợi 1–2 phút, tải lại trang. GitHub sẽ hiện link dạng `https://ten-cua-ban.github.io/ngay-50k/`.

## Bước 2: Cài lên iPhone

1. Mở link trên bằng **Safari**.
2. Bấm nút **Chia sẻ** (ô vuông có mũi tên lên), chọn **Thêm vào MH chính**, bấm **Thêm**.
3. Từ nay **luôn mở app bằng icon trên màn hình chính**. Dữ liệu trong icon này tách riêng với tab Safari.

## Bước 3: Chuyển dữ liệu cũ sang

Gửi file `ngay50k-du-lieu-tu-claude.json` sang iPhone (AirDrop, Zalo, hoặc lưu vào iCloud Drive). Mở app, bấm **biểu tượng bánh răng** ở góc trên bên phải, trong mục **Sao lưu và đồng bộ** bấm **Nhập từ file**, chọn file, rồi bấm **Gộp**.

## Sao lưu và đồng bộ giữa các máy

Tất cả nằm trong **Cài đặt** (biểu tượng bánh răng ở góc trên bên phải): hạn mức chi một ngày, sao lưu và đồng bộ, dung lượng.


- **Sao lưu:** bấm **Xuất file sao lưu** rồi lưu vào iCloud Drive hoặc gửi cho chính mình. App sẽ nhắc nếu quá 7 ngày chưa sao lưu.
- **Đồng bộ:** xuất file ở máy A, nhập vào máy B và chọn **Gộp**. Muốn hai máy giống hệt nhau thì làm thêm một lượt từ B về A.
- **Gộp** giữ khoản mới của cả hai máy. Khoản nào bị xoá hoặc sửa ở máy này cũng được xoá hoặc sửa ở máy kia (lấy lần sửa mới nhất).
- **Thay toàn bộ** thì xoá dữ liệu trên máy và dùng đúng dữ liệu trong file.
- Nhập nhầm thì bấm **Hoàn tác** ngay sau khi nhập.

## Xoá toàn bộ dữ liệu

- **Chỉ xoá dữ liệu, giữ app:** bấm **bánh răng**, kéo xuống mục **Dung lượng**, bấm **Xoá toàn bộ dữ liệu trên máy này**. App cho xuất file sao lưu trước, rồi mới bấm **Xoá vĩnh viễn**.
- **Xoá cả app lẫn dữ liệu:** nhấn giữ icon trên màn hình chính, chọn xoá.
- Xoá trên máy này không ảnh hưởng máy khác. Nếu sau đó bạn **Gộp** file từ máy khác vào, dữ liệu của máy đó sẽ quay lại.

## Bảo mật: 3 điều cần nhớ

1. **Tuyệt đối không tải file sao lưu (.json) lên GitHub.** Repository đang để Public, ai cũng xem được file trong đó. Trên GitHub chỉ có mã app, không có dữ liệu.
2. Dữ liệu chỉ nằm trên máy bạn, được bảo vệ bằng mật mã hoặc Face ID của iPhone. File sao lưu thì không có mật khẩu, nên hãy cất nó ở chỗ riêng tư như iCloud Drive của bạn, đừng gửi vào nhóm chat.
3. Xoá icon app khỏi màn hình chính thì dữ liệu cũng bị xoá theo. Hãy xuất file sao lưu trước khi xoá.

## Khi muốn sửa app

1. Thay file `index.html` mới trên GitHub (**Add file**, rồi **Upload files**).
2. Mở `sw.js`, tăng số phiên bản ở dòng `const VERSION = "ngay50k-v10";` lên số tiếp theo (`v11`, `v12`…)
3. Lần sau mở app có mạng, app hiện thông báo **Đã có bản mới**, bấm **Tải lại** là xong. Dữ liệu vẫn giữ nguyên.

## Làm thêm mini app khác

Mỗi app nên là **một repository riêng** (ví dụ `ghi-chu`, `tap-the-duc`), để dữ liệu và bộ nhớ đệm của các app không lẫn vào nhau.
