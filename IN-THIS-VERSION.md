# Ngày 50k – In this version

**Phiên bản hiện tại:** v35, ngày 27/09/2026

---

## Có gì mới trong v35 (so với v34)

- **Chọn cách tính còn lại thực tế.** Ngay dưới con số có ba lựa chọn: *Cả hai*, *Chi thường*, *Chi thẻ*. Ô chi bị loại khỏi phép tính sẽ mờ đi để thấy ngay đang tính những gì.
- **Thống kê theo tag ăn theo lựa chọn đó**, và đổi tiêu đề cho khớp: *Chi theo tag*, *Chi thường theo tag* hoặc *Chi thẻ theo tag*.
- **Bốn ô tổng bằng nhau.** Trước đây ô khoản vay cao hơn ba ô kia vì có thêm dòng chú thích, làm cả lưới xô lệch. Câu chú thích chuyển xuống thành một dòng dưới lưới.
- **Bỏ phần đặt trần cho từng nhóm.**
- **Nút thêm khoản thu** không còn là khối xanh to giữa trang, mà thành nút tròn **＋ Khoản thu** ở cuối hàng chọn tháng, giống nút **Thẻ · N** bên tab Thẻ.
- **Người nhận giờ là một trang con thật của Cài đặt**, cùng thanh *Cài đặt · Xong*, cùng kiểu nút *‹ Cài đặt* và tiêu đề lớn như Quản lý tag hay Quét mã QR. Bấm **Chuyển** vẫn đóng Cài đặt và mở sẵn form chuyển tiền như trước.

---

## Có gì mới trong v34 (so với v33)

Bản lớn: app không còn chỉ đếm tiền mỗi ngày mà cho thấy cả bức tranh tháng.

**Tab Tổng quan** thay cho tab Thu chi, và nằm đầu thanh menu.
- Con số lớn nhất là **còn lại thực tế** = thu vào − chi thường − chi thẻ, kèm mức tăng giảm so với tháng trước.
- Bốn ô: thu vào, chi thường, chi thẻ, khoản vay. Ô khoản vay ghi rõ **không tính vào số trên** — tiền vay được không phải thu nhập, tiền trả nợ không phải chi tiêu. Chạm vào để mở tab Khoản vay.
- Biểu đồ thu chi và thống kê theo nhóm vẫn ở dưới như cũ.

**Ngân sách theo nhóm.** Đặt trần mỗi tháng cho vài nhóm hay vượt, nhóm nào để trống thì app không theo dõi. Thanh tiến độ ba màu: trong trần xanh, từ 85% chuyển cam kèm *còn bao nhiêu cho mấy ngày cuối tháng*, vượt thì đỏ và ghi rõ vượt bao nhiêu. Trần dùng lại cho các tháng sau.

**Khoản chi thẻ gắn được nhóm**, nên ngân sách tính cả tiền quẹt thẻ — nếu không, trần *Mua sắm* sẽ bỏ sót đúng những lần mua sắm lớn nhất. App tự đoán nhóm theo nơi chi đã từng gặp, bạn chỉ cần sửa khi đoán sai.

**Thẻ có thêm ngày sao kê** (không bắt buộc). Bảng Quản lý thẻ hiện *sao kê ngày 15*, và nhắc *còn 3 ngày* khi sắp tới.

**Tab Giao dịch thêm hai thông tin** ngay trong thẻ hạn mức: dòng *Thẻ tháng này …* ở chân thẻ, chạm là sang tab Thẻ — trước đây chi thẻ hoàn toàn vô hình ở màn hình chính; và dòng trạng thái cho biết **cả tuần** còn dư hay đã vượt bao nhiêu, vì chi tiêu thật không đều mỗi ngày.

**Thanh menu còn bốn tab:** Tổng quan · Giao dịch · Thẻ · Khoản vay. **Người nhận** chuyển vào Cài đặt vì đó là dữ liệu tham chiếu, không phải nơi ghé mỗi ngày. Bốn tab nên mỗi nút rộng hơn hẳn, chữ hết chen chúc.

App vẫn mở lên ở tab **Giao dịch** để ghi khoản chi không mất thêm một chạm nào.

---

## Tất cả tính năng của app

### Tab Tổng quan
- **Còn lại thực tế** theo tháng, chọn được gồm chi thường, chi thẻ hay cả hai, kèm mức tăng giảm so với tháng trước.
- Bốn ô tổng: thu vào, chi thường, chi thẻ, khoản vay. Khoản vay để riêng, không tính vào còn lại thực tế.
- Thêm khoản thu theo nguồn: Lương, Thưởng, Bán hàng, Được cho, Khác. Chạm vào khoản thu để sửa số tiền, ghi chú, ngày nhận, nguồn thu.
- Biểu đồ so sánh thu chi theo ngày, tuần, tháng.
- Thống kê chi theo tag, ăn theo lựa chọn ở trên, và danh sách tất cả thu chi trong tháng.

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

### Tab Thẻ
- Quản lý thẻ trong bảng riêng (nút **Thẻ · N** ở hàng chọn tháng): tên thẻ, 6 số đầu, 4 số cuối, ngày sao kê.
- Khoản chi thẻ gắn được nhóm để vào thống kê theo tag, app tự đoán theo nơi chi đã gặp.
- Dải chọn thẻ ngang, chạm để xem riêng từng thẻ; khoản chi thẻ không tính vào hạn mức mỗi ngày.
- Ô tổng theo tháng: số khoản, số tiền và mức tăng giảm so với tháng trước.
- Biểu đồ *Theo ngày* và *12 tháng*, chạm cột để nhảy tới ngày hoặc tháng đó.
- Danh sách theo ngày kèm nhãn thẻ, sửa và xoá.
- Dán thông báo ngân hàng hoặc chọn ảnh chụp màn hình để nhập nhanh, tick chọn khoản đúng.

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
| **v35** | Chọn cách tính còn lại thực tế, bỏ đặt trần, cân lại lưới ô tổng, Người nhận vào hẳn Cài đặt |
| **v34** | Tab Tổng quan, ngân sách theo nhóm, tag cho khoản chi thẻ, ngày sao kê, thanh menu 4 tab |

*File này chỉ giữ ghi chú của hai bản gần nhất.*
