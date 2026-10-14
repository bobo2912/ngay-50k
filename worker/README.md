# Tiêu Gọn – trạm trung chuyển Cloudflare

Trạm nhỏ trên Cloudflare Workers chuyển thông báo biến động số dư từ **Phím tắt** trên iPhone sang app **Tiêu Gọn**. Thay cho Google Sheet + Apps Script từ app v158.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/<tên-github-của-bạn>/ngay-50k/tree/main/worker)

Trong app có sẵn nút Deploy trỏ đúng kho của bạn: **Cài đặt → Tự ghi từ thông báo → Phần B**.

## Chạy thế nào

```
Thông báo ngân hàng → Phím tắt (POST) → Worker giữ tạm → app lấy về (GET, hoặc WebSocket khi app đang mở) → app báo đã nhận → xoá
```

- Phím tắt gửi `POST /` với JSON `{ "k": "<mã bí mật>", "t": "<các dòng thông báo>" }`, trạm trả `TG_OK`. Cùng giao thức với Apps Script cũ, nên phím tắt cũ chỉ cần đổi URL.
- App gọi `GET /?k=…&since=<mốc>`. Mọi thông báo có mốc ≤ `since` bị xoá (app đã nhận), phần mới hơn được trả về.
- App đang mở thì giữ `GET /ws?k=…` (WebSocket). Thông báo tới là được đẩy sang ngay, app gửi `{ "ack": <mốc> }` để xoá.
- `POST /forget` với `{ "k": … }` xoá sạch hàng đợi. Nút **Xoá hết trên Cloudflare** trong app gọi đường này.

Dùng một Durable Object (lưu bằng SQLite), có trong gói Workers miễn phí.

## Không lưu trữ

- Thông báo chỉ nằm ở trạm trong lúc chờ app lấy. App nhận xong là xoá. Không ai lấy thì tự xoá sau 3 ngày.
- Không ghi nhật ký nội dung: `observability` tắt trong `wrangler.jsonc`, mã không `console.log` nội dung.
- Để bỏ dòng trùng khi phím tắt gửi lại cả tệp, trạm chỉ giữ dấu băm SHA-256 (16 ký tự) của từng dòng trong 3 ngày. Không giữ nội dung.
- Thư viện nội dung (quy tắc làm gọn nội dung) chạy trong app. Trạm không biết gì về nó.

## Mã bí mật

Nếu đặt biến môi trường `SECRET` (Cloudflare → Workers → tieugon-relay → Settings → Variables and Secrets), trạm dùng mã đó. Không đặt thì trạm ghi nhớ mã của lần kết nối đầu tiên. Vì vậy, triển khai xong hãy bấm **Kiểm tra** trong app ngay để nhận chủ.

## Chạy thử trên máy

```bash
cd worker
npm install
npx wrangler dev          # http://127.0.0.1:8787
# trong app: Cài đặt → Tự ghi từ thông báo → địa chỉ http://127.0.0.1:8787
```

Triển khai bằng dòng lệnh: `npx wrangler deploy`.
