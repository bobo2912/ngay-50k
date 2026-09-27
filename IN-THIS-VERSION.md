# Ngày 50k – In this version

**Phiên bản hiện tại:** v38, ngày 27/09/2026

---

## Có gì mới trong v38 (so với v37)

- **Thanh tìm kiếm dính lại trên đầu.** Trước đây mỗi lần gõ là danh sách đổi, trang co lại và ô tìm trôi đi mất. Giờ tiêu đề và ô tìm dính ở đỉnh màn hình khi cuộn, nền đặc nên chữ bên dưới không lẫn vào.
- **Biểu đồ so sánh thu chi và Chi theo tag chuyển vào bảng Phân tích tháng**, mở bằng nút biểu đồ nhỏ cạnh nút Khoản thu. Tab Tổng quan ngắn lại đáng kể, chỉ còn ô tổng, bốn ô số và danh sách thu chi.

---

## Có gì mới trong v37 (so với v36)

**App không còn tự xoá dữ liệu cũ.** Từ v1 tới giờ, mỗi lần lưu app đều âm thầm xoá mọi khoản cũ hơn 400 ngày — nghĩa là khoảng một năm nữa, lịch sử những ngày đầu sẽ biến mất, và file sao lưu xuất sau đó cũng không còn dữ liệu cũ. Tính lại thì lo hão: một khoản chi chỉ chiếm chừng 120 byte, ghi 10 khoản mỗi ngày trong 5 năm mới hết 2 MB trên hạn mức 5–10 MB. Giờ dữ liệu được giữ nguyên, để còn so sánh năm nay với năm ngoái.

**Ghi lại khoản hay lặp bằng một chạm.** Dưới các nút nhập có dải *Ghi lại khoản hay lặp*: app tự tìm những khoản cùng nội dung và cùng số tiền xuất hiện từ hai lần trong 60 ngày gần đây — cà phê 25k, gửi xe 5k — chạm là ghi cho hôm nay, không qua form. Khoản nào đã ghi hôm nay thì tự ẩn khỏi dải.

**Nhắc khi bỏ ghi.** Nếu hôm qua không có khoản nào mà trước đó bạn vẫn ghi đều, app hiện một dòng *Hôm qua chưa ghi khoản nào · Ghi bù*, chạm là mở form sẵn ngày hôm qua. Bấm một lần rồi thì thôi, không nhắc lại.

**Tìm kiếm xuyên tháng.** Ô tìm trong Tổng quan, tìm cùng lúc trong khoản chi, khoản thu và chi thẻ của mọi tháng. Gõ được tên nơi chi, tên nhóm hoặc số tiền. Kết quả ghi rõ ngày, nhóm, thẻ và tổng số tiền đã chi.

**Xuất CSV.** Trong Sao lưu và đồng bộ, nút *Xuất CSV để mở bằng Excel*. File dùng dấu chấm phẩy và có BOM nên Excel tiếng Việt mở ra là đúng cột, đúng dấu. Cột: ngày, loại, số tiền, nhóm, nội dung, thẻ, định kỳ.

**Khoản định kỳ.** Trang mới trong Cài đặt: khai tên, số tiền, ngày trong tháng và nhóm. App tự ghi vào đúng ngày mỗi tháng, lùi tối đa ba tháng nếu bạn cài muộn, và không ghi trùng. Khoản định kỳ **không tính vào hạn mức mỗi ngày** — vì tiền nhà dồn vào một ngày thì hạn mức 50k hôm đó thành vô nghĩa — nhưng vẫn vào tổng chi của tháng. Ngày nào có khoản định kỳ thì dòng tổng ghi riêng *định kỳ …*.

**Kỳ sao kê thẻ.** Chọn một thẻ đã khai ngày sao kê, app hiện dải *Kỳ sao kê 30/8 – 29/9 · 2.400.000đ · còn 2 ngày* — đúng số tiền kỳ sao kê này sẽ tính, thay vì gom theo tháng dương lịch. Còn dưới ba ngày thì viền chuyển cam.

**Nhắc sao lưu rõ hơn:** nói luôn có bao nhiêu khoản đang chỉ nằm trên máy này, và viền chuyển đỏ khi quá 21 ngày hoặc chưa sao lưu lần nào.

---

## Tất cả tính năng của app

### Tab Tổng quan
- **Còn lại thực tế** theo tháng, chọn được gồm chi thường, chi thẻ hay cả hai, kèm mức tăng giảm so với tháng trước.
- Bốn ô tổng: thu vào, chi thường, chi thẻ, khoản vay. Khoản vay để riêng, không tính vào còn lại thực tế.
- Thêm khoản thu theo nguồn: Lương, Thưởng, Bán hàng, Được cho, Khác. Chạm vào khoản thu để sửa số tiền, ghi chú, ngày nhận, nguồn thu.
- **Phân tích tháng** (nút biểu đồ cạnh nút Khoản thu): biểu đồ so sánh thu chi theo ngày, tuần, tháng.
- Thống kê chi theo tag nằm trong Phân tích tháng, ăn theo lựa chọn ở trên.
- Danh sách tất cả thu chi trong tháng, tiêu đề và ô tìm dính trên đầu khi cuộn.
- **Tìm kiếm xuyên tháng** trên cả khoản chi, khoản thu và chi thẻ.

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
- **Nhắc sao lưu** khi quá 7 ngày, kèm số khoản đang chỉ nằm trên máy này.
- **Ghi lại khoản hay lặp** bằng một chạm, và nhắc khi hôm qua bỏ ghi.

### Tab Thẻ
- Quản lý thẻ trong bảng riêng (nút **Thẻ · N** ở hàng chọn tháng): tên thẻ, 6 số đầu, 4 số cuối, ngày sao kê.
- Khoản chi thẻ gắn được nhóm để vào thống kê theo tag, app tự đoán theo nơi chi đã gặp.
- Dải chọn thẻ ngang, chạm để xem riêng từng thẻ; khoản chi thẻ không tính vào hạn mức mỗi ngày.
- Ô tổng theo tháng: số khoản, số tiền và mức tăng giảm so với tháng trước.
- Biểu đồ *Theo ngày* và *12 tháng*, chạm cột để nhảy tới ngày hoặc tháng đó.
- Danh sách theo ngày kèm nhãn thẻ, sửa và xoá.
- Dán thông báo ngân hàng hoặc chọn ảnh chụp màn hình để nhập nhanh, tick chọn khoản đúng.
- **Kỳ sao kê:** thẻ có khai ngày sao kê thì hiện số tiền của kỳ đang mở và số ngày còn lại.

### Tab Khoản vay
- Theo dõi khoản **mình đi vay** và **mình cho vay**, có tổng đang nợ và tổng người khác nợ mình.
- Ghi từng lần trả, xem số còn lại, hạn trả, cảnh báo quá hạn.
- Lọc theo loại, trạng thái (chưa xong, tất toán), ngày khởi tạo hoặc ngày đến hạn.

### Người nhận (trong Cài đặt)
- Lưu người hay chuyển tiền: tên gợi nhớ, số tài khoản, ngân hàng, tên tài khoản, nội dung mặc định, tag thường dùng.
- Bấm **Chuyển** để mở form đã điền sẵn thông tin.

### Cài đặt (bánh răng góc trên bên phải)
- **Giao diện:** Tự động, Sáng hoặc Tối.
- **Quét mã QR:** Camera iPhone hoặc Quét trực tiếp, kèm thời gian tự tắt camera.
- **Hạn mức chi một ngày.**
- **Người nhận:** danh sách người hay chuyển tiền.
- **Khoản định kỳ:** khai một lần, app tự ghi mỗi tháng, không tính vào hạn mức ngày.
- **Quản lý tag:** danh sách tag, chi tiết từng tag, đổi tên và icon, ẩn hoặc hiện, xoá tag tự tạo.
- **Sao lưu và đồng bộ:**
  - Xuất file sao lưu, hoặc xuất CSV để mở bằng Excel.
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
- Chữ giải thích nằm sau nút **ⓘ** cạnh tiêu đề, chạm mới hiện.
- Giao diện Liquid Glass, sáng và tối theo cài đặt của máy. Thanh tab nổi ở đáy màn hình.
- Dữ liệu được giữ vô thời hạn, app không tự xoá khoản cũ.

---

## Lịch sử phiên bản

| Phiên bản | Nội dung chính |
|---|---|
| **v38** | Thanh tìm kiếm dính trên đầu, gom biểu đồ và thống kê tag vào bảng Phân tích tháng |
| **v37** | Bỏ tự xoá dữ liệu cũ, ghi lại một chạm, nhắc bỏ ghi, tìm kiếm, xuất CSV, khoản định kỳ, kỳ sao kê thẻ |

*File này chỉ giữ ghi chú của hai bản gần nhất.*
