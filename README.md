# Tiêu Gọn

*Tên cũ: Ngày 50k. Kho mã vẫn tên `ngay-50k` và các khoá lưu dữ liệu vẫn bắt đầu bằng `ngay50k:` để máy đang dùng không mất dữ liệu.*

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

**Trò chuyện** (tab đầu, mở mặc định) — Kể chi tiêu bằng lời như nhắn tin. `parse-vi.js` (chạy trên máy, không gửi dữ liệu đi) tách câu thành các khoản, mỗi khoản là một thẻ xác nhận sửa được; bấm Ghi mới lưu, có Hoàn tác. Trả lời câu hỏi nhanh từ dữ liệu trên máy. Đổi màn hình mở đầu sang Ví trong Cài đặt. Tuỳ chọn **Trợ lý AI**: người dùng dán khoá API (Claude, ChatGPT, Gemini) trong Cài đặt, khoá lưu ở `localStorage["ngay50k:ai"]` trên máy, không bao giờ nằm trong kho này; app gọi thẳng API từ trình duyệt, AI chỉ trả JSON các khoản/câu hỏi, app kiểm tra lại rồi hiện thẻ xác nhận; lỗi thì quay về `parse-vi.js`.

**Ví** — Số dư hiện tại: số bạn nhập ở lần đối chiếu gần nhất, cộng trừ tiếp mọi khoản ghi sau lúc đó (quẹt thẻ chỉ cộng vào nợ thẻ, tới khi ghi Trả thẻ). Danh sách biến động kèm số dư sau từng khoản, lịch sử đối chiếu và trả thẻ.

**Tổng quan** — Còn lại thực tế của tháng: thu vào trừ chi thường trừ chi thẻ. Khoản vay để riêng vì tiền vay không phải thu nhập và tiền trả nợ không phải chi tiêu. Chọn được tính gồm chi thường, chi thẻ hay cả hai; thống kê theo tag đi theo lựa chọn đó. Biểu đồ so sánh thu chi và thống kê theo tag nằm trong bảng Phân tích tháng.

**Thẻ** — Quản lý chi tiêu thẻ tín dụng, không tính vào hạn mức mỗi ngày. Nhập nhanh bằng cách dán thông báo ngân hàng hoặc chọn ảnh chụp màn hình: app đọc chữ trong ảnh, tách ra từng giao dịch, tự gán vào đúng thẻ theo 6 số đầu và 4 số cuối, rồi để bạn tick chọn khoản đúng trước khi ghi. Biểu đồ theo ngày và theo 12 tháng. Mỗi thẻ khai được ngày sao kê, mỗi khoản gắn được nhóm.

**Tài khoản** (trước gọi là Giao dịch) — Thẻ *Hôm nay còn được tiêu* với thanh tiến độ, chuyển đỏ khi vượt hạn mức. Quét mã VietQR bằng camera hoặc chọn ảnh mã QR, app tự điền số tài khoản, ngân hàng, số tiền và nội dung. Ghi tay, trả tiền mặt, nhập nhanh 5k–30k, nút 000. Gắn tag cho từng khoản, ghi bù ngày trước, sửa và xoá. Biểu đồ 7 ngày gần nhất kèm mức chi trung bình, và lịch tháng tô màu theo số tiền chi mỗi ngày.

**Khoản vay** — Theo dõi khoản mình đi vay và mình cho vay. Một khoản ghi được nhiều lần vay thêm và nhiều lần trả, lịch sử gộp theo thời gian. Cảnh báo quá hạn.

**Người nhận** (trong Cài đặt) — Lưu người hay chuyển tiền để lần sau điền sẵn.

**Lần đầu mở** (máy chưa có dữ liệu): màn hình chào 4 bước (hạn mức, ngân hàng hay dùng, thẻ tín dụng, mã PIN) và nút xem thử với dữ liệu mẫu. Mọi khoản mẫu có mã bắt đầu bằng `demo_` để xoá sạch; cờ ở `localStorage` là `ngay50k:welcome`, `ngay50k:demo`, ngân hàng chọn ở `ngay50k:bank`.

Chữ giải thích trên giao diện được giữ ở mức tối thiểu; phần dài hơn nằm sau nút **ⓘ** cạnh tiêu đề.

**Cài đặt** — Giao diện tự động/sáng/tối/pastel, hạn mức mỗi ngày, quản lý tag, sao lưu và đồng bộ, dung lượng đang dùng.

---

## Dữ liệu nằm ở đâu

Dữ liệu chính nằm trong **IndexedDB** của trình duyệt: cơ sở dữ liệu `ngay50k` (phiên bản 2), bảng `kv`, khoá `ngay50k:v1` (bản để hoàn tác lần nhập file nằm ở khoá `ngay50k:beforeImport`). Giá trị là chuỗi JSON, giống hệt nội dung file sao lưu. Vài cài đặt nhỏ (giao diện, kiểu quét QR, lần sao lưu gần nhất) vẫn để trong `localStorage`. Không có API, không có cookie, không có thống kê truy cập.

Khi mở, app đọc hết dữ liệu vào bộ nhớ một lần (`N50K.ready`), rồi mới chạy phần còn lại. Mỗi lần lưu được ghi xuống IndexedDB ngay; các lần ghi dồn dập được gộp lại. Từ bản v46 trở về trước dữ liệu nằm trong `localStorage`; lần mở đầu tiên ở v47 tự chép sang, đọc lại để kiểm tra rồi xoá bản cũ. IndexedDB chưa mở xong sau 4 giây thì app chạy luôn bằng `localStorage` nhưng vẫn chờ tiếp; mở được lúc nào thì chuyển sang lúc đó (`adopt`), lấy bản có `updated` mới hơn. Mở lỗi thì app tự thử lại mỗi lần quay lại app, và trang Dung lượng ghi lý do (`N50K.why()`) kèm nút thử lại (`N50K.retry()`).

**Khoá app (`lock.js`, từ v77).** Khi bật mã PIN, các khoá dữ liệu (`ngay50k:v1`, `ngay50k:beforeImport`, `ngay50k:chat`, `ngay50k:ai`) được ghi xuống dạng `enc1:<iv>:<bản mã>` (AES-GCM 256). Khoá dữ liệu là 32 byte ngẫu nhiên, được bọc bằng khoá sinh từ mã PIN (PBKDF2-SHA256, 600.000 vòng) và, nếu bật Face ID, bọc thêm một bản bằng bí mật PRF của passkey. Thông tin này nằm ở `ngay50k:lock` (không chứa mã PIN). Trong bộ nhớ vẫn là dữ liệu thường; chỉ lúc ghi mới mã hoá. Chưa mở khoá thì `N50K` không ghi các khoá dữ liệu. Thứ tự khởi động: `N50K.ready` → `N50KLock.gate` → `startNgay50k`.

Hệ quả cần biết:

- Xoá app khỏi màn hình chính, hoặc xoá dữ liệu trang web trong cài đặt trình duyệt, là **mất sạch**. Nhớ xuất file sao lưu. Ngoài file JSON còn xuất được CSV để mở bằng Excel.
- Dữ liệu không tự đồng bộ giữa iPhone và máy tính. Muốn chuyển thì **Cài đặt → Sao lưu và đồng bộ → Xuất file**, mang file sang máy kia rồi **Nhập từ file**. Khi nhập có hai lựa chọn **Gộp** hoặc **Thay toàn bộ**, đều xem trước được thay đổi và hoàn tác được.
- Sao lưu nhanh: `navigator.share` một file `ngay50k-yyyy-MM-dd.json`; người dùng chạm vào phím tắt của mình (bật Hiện trong Bảng chia sẻ, nhận Tệp, Lưu tệp vào iCloud Drive) ngay trong bảng chia sẻ, không rời app. Phím tắt không đọc được dữ liệu của app web, nên lượt nào cũng phải bắt đầu từ nút trong app.
- Dữ liệu được giữ vô thời hạn; app không tự xoá khoản cũ.
- Khoá API của Trợ lý AI chỉ nằm trên máy người dùng, không có trong kho này và không vào file sao lưu. **Đừng bao giờ dán khoá vào mã nguồn.**
- File sao lưu là JSON có chứa số tài khoản và tên người nhận. **Đừng bao giờ tải file đó lên GitHub** — kho này công khai.

---

## Cấu trúc kho

```
index.html              toàn bộ app: giao diện, CSS và JavaScript trong một file
lock.js                 khoá app bằng mã PIN, mã hoá dữ liệu, Face ID (passkey PRF), sao lưu có mật khẩu
parse-vi.js             bộ hiểu câu tiếng Việt cho màn Trò chuyện (chạy trên máy)
tests-parse-vi.js       bộ câu mẫu: node tests-parse-vi.js
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

1. Sửa code.
2. Tăng số phiên bản ở **ba chỗ**, cùng một số:
   - `sw.js` → `const V = "NN";`
   - `index.html` → hai thẻ `<script src="parse-vi.js?v=NN">`, `<script src="lock.js?v=NN">`, và dòng `Phiên bản vNN` trong phần Cài đặt (cùng `VER` trong đoạn lưới an toàn đầu trang).
   - Lệnh gợi ý: `sed -i 's/const V = "OLD"/const V = "NN"/' sw.js && sed -i 's/?v=OLD/?v=NN/g; s/Phiên bản vOLD/Phiên bản vNN/; s/VER = "vOLD"/VER = "vNN"/' index.html`
3. Ghi lại thay đổi vào `IN-THIS-VERSION.md`.
4. Đẩy lên GitHub.

**Vì sao phải gắn số phiên bản cho script:** từ v83, service worker chỉ lấy script đúng địa chỉ có `?v=` trong bộ nhớ đệm của chính bản đó, và lấy trang chính từ mạng (chờ tối đa 3,5 giây) rồi mới tới bản đã lưu. Nhờ vậy trang và script luôn cùng một bản. Trước v83, trang và script được cập nhật lệch nhau nên app có lúc đơ ngay khi mở. Quên tăng `?v=` thì máy vẫn có thể dùng script cũ.

**Lưới an toàn khi khởi động** (đoạn script đầu `index.html`): mọi lỗi được ghi vào `localStorage["ngay50k:errlog"]` (30 dòng gần nhất), xem và sao chép ở Cài đặt → Dung lượng. Các bước khởi động được đánh dấu (`html` → `store` → `lock` → `app` → `started`); quá 9 giây chưa tới `started` (mà không phải đang chờ nhập mã PIN) thì hiện nút Tải lại và Tải bản mới nhất.

---

## Kiểm thử

Không có bộ test tự động trong kho. Cách kiểm nhanh bằng Playwright:

```bash
python3 -m http.server 8765 &
# mở Chromium ở khung 390×844, nạp sẵn dữ liệu mẫu vào localStorage
# rồi bấm qua từng tab và chụp màn hình so sánh
```

Bộ hiểu câu có hai bài thử chạy bằng Node: `node tests-parse-vi.js` và `node tests-parse-vi-2.js` (hiểu câu, 104 câu gõ không dấu, viết tắt, nhiều khoản) và `node tests-assess-vi.js` (câu nào máy tự xử lý, câu nào gửi AI, dùng `N50KParse.assess`).

Vài chỗ dễ vỡ, sửa xong nên thử lại:

- **Số dư ví.** `state.bals` là các lần đối chiếu (lần có `t` lớn nhất là mốc), `state.cardPay` là các lần trả thẻ. `balCalc()` chỉ tính khoản có thời điểm sau mốc và không ở tương lai (khoản ngày tương lai hiện ở mục Sắp tới); thời điểm lấy từ `t` nếu cùng ngày với khoản, không thì 00:00 của ngày đó (`recTime`), để khoản cũ không có giờ trong ngày đối chiếu không bị trừ lại.
- **Bộ hiểu câu.** Sửa `parse-vi.js` xong chạy `node tests-parse-vi.js`, phải ra `FAILED: 0`. Thêm câu mới vào bộ mẫu mỗi khi sửa một lỗi hiểu sai.
- **Kho dữ liệu.** Đọc và ghi dữ liệu chính qua `N50K.get` / `N50K.set` / `N50K.del`, không gọi thẳng `localStorage` cho khoá `ngay50k:v1`. Toàn bộ app nằm trong hàm `startNgay50k()`, chỉ chạy sau khi `N50K.ready` xong.
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
