# Ngày 50k

Ứng dụng web ghi chi tiêu hằng ngày, đặt một hạn mức cho mỗi ngày và theo dõi xem hôm nay còn tiêu được bao nhiêu. Cài lên màn hình chính của iPhone hay Android là chạy như một app bình thường, dùng được cả khi không có mạng.

**Dữ liệu chỉ nằm trên máy của bạn.** Không có tài khoản, không có máy chủ, không gửi gì đi đâu.

---

## Chạy thử

Mở `https://<tên-github-của-bạn>.github.io/ngay-50k/`

Cài lên iPhone: mở bằng **Safari** → nút chia sẻ → **Thêm vào Màn hình chính**.
Cài lên Android: mở bằng **Chrome** → menu → **Cài đặt ứng dụng**.

Muốn chạy trên máy tính để sửa:

```bash
python3 -m http.server 8765
# rồi mở http://127.0.0.1:8765
```

Phải mở qua một máy chủ web, không mở thẳng bằng `file://`, vì service worker và camera đều cần `http` hoặc `https`.

---

## Làm được gì

**Tổng quan** — Còn lại thực tế của tháng: thu vào trừ chi thường trừ chi thẻ. Khoản vay để riêng vì tiền vay không phải thu nhập và tiền trả nợ không phải chi tiêu. Chọn được tính gồm chi thường, chi thẻ hay cả hai; thống kê theo tag đi theo lựa chọn đó. Biểu đồ so sánh thu chi theo ngày, tuần, tháng.

**Thẻ** — Quản lý chi tiêu thẻ tín dụng, không tính vào hạn mức mỗi ngày. Nhập nhanh bằng cách dán thông báo ngân hàng hoặc chọn ảnh chụp màn hình: app đọc chữ trong ảnh, tách ra từng giao dịch, tự gán vào đúng thẻ theo 6 số đầu và 4 số cuối, rồi để bạn tick chọn khoản đúng trước khi ghi. Biểu đồ theo ngày và theo 12 tháng. Mỗi thẻ khai được ngày sao kê, mỗi khoản gắn được nhóm.

**Giao dịch** — Thẻ *Hôm nay còn được tiêu* với thanh tiến độ, chuyển đỏ khi vượt hạn mức. Quét mã VietQR bằng camera hoặc chọn ảnh mã QR, app tự điền số tài khoản, ngân hàng, số tiền và nội dung. Ghi tay, trả tiền mặt, nhập nhanh 5k–30k, nút 000. Gắn tag cho từng khoản, ghi bù ngày trước, sửa và xoá. Biểu đồ 7 ngày gần nhất kèm mức chi trung bình.

**Khoản vay** — Theo dõi khoản mình đi vay và mình cho vay, ghi từng lần trả, cảnh báo quá hạn.

**Người nhận** (trong Cài đặt) — Lưu người hay chuyển tiền để lần sau điền sẵn.

**Cài đặt** — Giao diện sáng/tối/tự động, hạn mức mỗi ngày, quản lý tag, sao lưu và đồng bộ, dung lượng đang dùng.

---

## Dữ liệu nằm ở đâu

Tất cả nằm trong `localStorage` của trình duyệt, dưới một khoá duy nhất là `ngay50k:v1`. Không có API, không có cookie, không có thống kê truy cập.

Hệ quả cần biết:

- Xoá app khỏi màn hình chính, hoặc xoá dữ liệu trang web trong cài đặt trình duyệt, là **mất sạch**. Nhớ xuất file sao lưu.
- Dữ liệu không tự đồng bộ giữa iPhone và máy tính. Muốn chuyển thì **Cài đặt → Sao lưu và đồng bộ → Xuất file**, mang file sang máy kia rồi **Nhập từ file**. Khi nhập có hai lựa chọn **Gộp** hoặc **Thay toàn bộ**, đều xem trước được thay đổi và hoàn tác được.
- App tự dọn khoản chi và khoản thu cũ hơn 400 ngày.
- File sao lưu là JSON có chứa số tài khoản và tên người nhận. **Đừng bao giờ tải file đó lên GitHub** — kho này công khai.

---

## Cấu trúc kho

```
index.html              toàn bộ app: giao diện, CSS và JavaScript trong một file
sw.js                   service worker, giữ app chạy được khi mất mạng
scan.html               trang riêng chứa camera quét QR, đóng là camera tắt hẳn
manifest.webmanifest    tên, icon, màu, chế độ standalone
vendor/jsQR.js          thư viện đọc mã QR, để sẵn trong kho
fonts/                  font Be Vietnam Pro dạng woff2
icons/                  icon app
HUONG-DAN.md            hướng dẫn đưa lên GitHub Pages và cài lên máy
IN-THIS-VERSION.md      có gì mới ở hai bản gần nhất, kèm danh sách tính năng
```

Camera nằm trong một trang riêng là có chủ ý: iOS giữ camera gắn với trang đang mở, nên khi đóng khung quét, app huỷ luôn cả `iframe` để chấm xanh trên iPhone tắt ngay.

App không tải gì từ bên ngoài khi chạy. Riêng chức năng đọc chữ trong ảnh cần tải thư viện Tesseract.js từ CDN ở lần dùng đầu tiên; không có mạng thì app báo rõ và bạn dùng cách chép chữ sẵn có của iPhone rồi dán vào.

---

## Sửa và phát hành bản mới

1. Sửa `index.html`.
2. Tăng số phiên bản ở **hai chỗ**:
   - `sw.js` → `const VERSION = "ngay50k-vNN";`
   - `index.html` → dòng `Phiên bản vNN` trong phần Cài đặt.
3. Ghi lại thay đổi vào `IN-THIS-VERSION.md`.
4. Đẩy lên GitHub. Lần sau mở app khi có mạng, app hiện **Đã có bản mới** → bấm **Tải lại**.

Không tăng `VERSION` trong `sw.js` thì máy vẫn dùng bản cũ trong bộ nhớ đệm.

Service worker lấy `index.html` theo kiểu *network-first* (có mạng thì lấy bản mới, mất mạng thì lấy bản đã lưu), còn font, icon và thư viện thì *cache-first*.

---

## Kiểm thử

Không có bộ test tự động trong kho. Cách kiểm nhanh bằng Playwright:

```bash
python3 -m http.server 8765 &
# mở Chromium ở khung 390×844, nạp sẵn dữ liệu mẫu vào localStorage
# rồi bấm qua từng tab và chụp màn hình so sánh
```

Vài chỗ dễ vỡ, sửa xong nên thử lại:

- **Thứ tự khai báo biến.** `renderAll()` chạy trước khi một số `const`/`let` kịp khởi tạo, nên những biến dùng trong lúc vẽ lần đầu phải là `var` hoặc hàm khai báo kiểu `function`.
- **Bộ đọc thông báo ngân hàng.** Nhiều ngân hàng viết cả giao dịch trên một dòng ngăn bằng dấu `|`; bộ phân tích tách theo từng ô và bỏ qua ô số dư hay hạn mức còn lại. Sửa phần này thì thử lại với cả thông báo dán tay lẫn ảnh chụp màn hình.
- **Vòng đời camera.** Mọi đường thoát khỏi khung quét đều phải huỷ `iframe`.
- **Lề trên.** iPhone có tai thỏ; phần đầu trang dùng `--safe-top` để không lọt vào vùng thanh trạng thái.

---

## Công nghệ

HTML, CSS và JavaScript thuần, không framework, không bước build. Mở `index.html` ra sửa là chạy.

- [jsQR](https://github.com/cozmo/jsQR) — đọc mã QR, đã để sẵn trong `vendor/`
- [Tesseract.js](https://github.com/naptha/tesseract.js) — đọc chữ trong ảnh, tải từ CDN khi cần
- [Be Vietnam Pro](https://fonts.google.com/specimen/Be+Vietnam+Pro) — font, đã để sẵn trong `fonts/`

Mã QR được đọc theo chuẩn EMVCo/VietQR, kể cả số tài khoản có chữ.

---

## Giấy phép

Dự án cá nhân, dùng tự do.
