# Ngày 50k – In this version

**Phiên bản hiện tại:** v30, ngày 26/09/2026

---

## Có gì mới trong v30 (so với v29)

- **App tự làm rõ ảnh trước khi đọc chữ.** Ảnh chụp trung tâm thông báo là chữ sáng trên nền mờ chồng lên hình nền, bộ đọc chữ rất hay nhầm. App giờ tự chuyển ảnh thành chữ đen trên nền trắng rồi mới đọc, nên bắt được cả những thông báo trước đây bị bỏ sót.
- **Đọc được thông báo thứ hai, thứ ba trong cùng một ảnh.** Trước đây chụp 3 thông báo thì thường chỉ ra 1 khoản.
- **Chịu được lỗi đọc chữ thường gặp:** dấu `|` bị đọc thành `I`, `J` hay `]`; chữ *Hạn mức còn lại* bị đọc sai dấu. App vẫn tách đúng ô và vẫn bỏ qua số dư.
- **Tên nơi chi không còn dính sang thông báo kế tiếp** khi thông báo bị cắt bằng dấu ba chấm.
- **Gợi ý cách chính xác nhất** ngay trong bảng nhập: dùng tính năng chép chữ sẵn có của iPhone (chạm giữ vào ảnh, chọn *Sao chép văn bản*) rồi bấm *Dán từ bộ nhớ tạm*.

---

## Có gì mới trong v29 (so với v28)

- **Đọc được đúng thông báo của các ngân hàng trong nước.** Nhiều ngân hàng viết cả giao dịch trên một dòng dài, ngăn bằng dấu `|` (dạng `TÊN THẺ: SD THE [số thẻ]|Ngày GD: [...]|Số tiền GD: -...|...`). App giờ tách theo từng ô như vậy nên lấy đúng số thẻ, số tiền, ngày giờ và nơi chi.
- **Không còn nhầm số dư thành khoản chi.** Các ô *Hạn mức còn lại*, *SD*, *Số dư*, *Khả dụng* bị bỏ qua hẳn, nên không còn xuất hiện những khoản chi bằng đúng số dư hay hạn mức.
- **Ghép được dòng bị ngắt khi đọc ảnh.** Ảnh chụp trung tâm thông báo hay xuống dòng giữa chừng (`Số tiền GD: -` xuống dòng rồi mới tới số tiền), app tự nối lại trước khi đọc.
- **Bỏ qua thông báo không phải giao dịch:** quảng cáo, tin thử nghiệm, thông báo Apple Pay… không còn lọt vào danh sách.

---

## Tất cả tính năng của app

### Tab Giao dịch
- **Thẻ Hôm nay còn được tiêu:** số tiền còn lại, thanh tiến độ, chuyển đỏ khi vượt hạn mức.
- **Quét QR bằng camera:** mặc định mở camera iPhone để chụp mã (không cần cấp quyền), hoặc quét trực tiếp trong app tự nhận mã (chọn trong Cài đặt).
- **Chọn ảnh mã QR:** đọc mã QR từ ảnh chụp sẵn trong máy.
- **Đọc mã VietQR:** tự điền số tài khoản, ngân hàng, số tiền, nội dung và tên tài khoản (nếu mã có chứa).
- **Chuyển nhanh cho người hay chuyển:** chạm tên để điền sẵn thông tin.
- **Chuyển khoản nhập tay** và **Trả tiền mặt.**
- **Form ghi khoản chi:**
  - Số tiền, có chọn nhanh 5k, 10k, 15k, 20k, 30k và nút 000.
  - Số tài khoản, tên tài khoản, ngân hàng (có gợi ý tên ngân hàng), nội dung chuyển khoản.
  - Ngày giao dịch, cho phép ghi bù ngày trước.
  - Tag: 20 tag có sẵn, hiện nhanh 5 tag hay dùng, tạo tag riêng với tên và icon.
  - Ghi chú, kèm chọn nhanh nội dung gần đây.
  - Lưu người nhận vào danh sách ngay khi ghi.
  - Báo trước nếu khoản chi làm vượt hạn mức.
- **Đoạn chuyển tiền cho MB Bank:** sao chép và mở MB Bank bằng một lần chạm.
- **Xem theo ngày:** lùi, tiến hoặc chọn ngày bất kỳ. Chạm khoản chi để sửa số tiền, ghi chú, ngày và tag. Xoá bằng hai lần chạm.
- **Biểu đồ 7 ngày gần nhất** so với hạn mức, có chi tiêu trung bình mỗi ngày. Chạm vào cột để xem lại giao dịch ngày đó.
- **Nhắc sao lưu** khi quá 7 ngày chưa sao lưu.

### Tab Thu chi
- Xem tổng thu, tổng chi và số còn lại theo tháng.
- Thêm khoản thu theo nguồn: Lương, Thưởng, Bán hàng, Được cho, Khác. Chạm vào khoản thu để sửa số tiền, ghi chú, ngày nhận, nguồn thu.
- Biểu đồ so sánh thu chi theo ngày, tuần, tháng.
- Thống kê chi theo tag và danh sách tất cả thu chi trong tháng.

### Tab Khoản vay
- Theo dõi khoản **mình đi vay** và **mình cho vay**, có tổng đang nợ và tổng người khác nợ mình.
- Ghi từng lần trả, xem số còn lại, hạn trả, cảnh báo quá hạn.
- Lọc theo loại, trạng thái (chưa xong, tất toán), ngày khởi tạo hoặc ngày đến hạn.

### Tab Thẻ
- Quản lý thẻ tín dụng: tên thẻ, 6 số đầu, 4 số cuối. Nhiều thẻ hiện thành dải chọn ngang, chạm để lọc.
- Khoản chi thẻ không tính vào hạn mức mỗi ngày.
- Xem theo tháng, chia theo từng thẻ, danh sách theo ngày, sửa và xoá.
- Dán thông báo ngân hàng hoặc chọn ảnh chụp màn hình để nhập nhanh, tick chọn khoản đúng.

### Tab Người nhận
- Lưu người hay chuyển tiền: tên gợi nhớ, số tài khoản, ngân hàng, tên tài khoản, nội dung mặc định, tag thường dùng.
- Bấm **Chuyển** để mở form đã điền sẵn thông tin.

### Cài đặt (bánh răng góc trên bên phải)
- **Giao diện:** Tự động, Sáng hoặc Tối.
- **Quét mã QR:** Camera iPhone hoặc Quét trực tiếp, kèm thời gian tự tắt camera.
- **Hạn mức chi một ngày.**
- **Quản lý tag:** danh sách tag, chi tiết từng tag, đổi tên và icon, ẩn hoặc hiện, xoá tag tự tạo.
- **Sao lưu và đồng bộ:**
  - Xuất file sao lưu.
  - Nhập từ file, chọn **Gộp** hoặc **Thay toàn bộ**, có xem trước thay đổi và **Hoàn tác**.
  - Đồng bộ giữa các máy qua file.
- **Dung lượng:** kèm số phiên bản app.
  - Thanh đo chỗ lưu đã dùng, dung lượng dữ liệu và bản lưu offline.
  - Xoá khoản chi hôm nay.
  - Xoá toàn bộ dữ liệu trên máy.

### Nền tảng
- Cài lên màn hình chính như app, chạy **offline hoàn toàn**.
- Vuốt từ trái sang phải để từ trang con quay về trang trước trong cùng menu.
- Dữ liệu **chỉ lưu trên máy**, không gửi lên máy chủ nào. App không tải gì từ trang web khác.
- Tự báo khi có bản mới, bấm **Tải lại** để cập nhật.
- Giao diện Liquid Glass, sáng và tối theo cài đặt của máy. Thanh tab nổi ở đáy màn hình.
- Tự dọn khoản chi và khoản thu cũ hơn 400 ngày.

---

## Lịch sử phiên bản

| Phiên bản | Nội dung chính |
|---|---|
| **v30** | Tự làm rõ ảnh trước khi đọc chữ nên bắt đủ các thông báo trong một ảnh |
| **v29** | Đọc đúng thông báo ngân hàng kiểu một dòng ngăn bằng dấu gạch đứng, bỏ qua số dư và hạn mức còn lại |

*File này chỉ giữ ghi chú của hai bản gần nhất.*
