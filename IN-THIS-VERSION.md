# Ngày 50k – In this version

**Phiên bản hiện tại:** v50, ngày 06/10/2026

---

## Có gì mới trong v50 (so với v49)

**Tab Ví riêng, đứng đầu và mở mặc định.** Mở app là thấy ngay ví còn bao nhiêu tiền.

- Thẻ **Số dư hiện tại** chuyển từ Tổng quan sang tab **Ví**, kèm hai nút **Đối chiếu số dư** và **Trả thẻ**.
- **Biến động từ lần đối chiếu:** mọi khoản làm đổi số dư, mới nhất ở trên, mỗi dòng ghi số tiền và **số dư còn lại sau khoản đó**. Quẹt thẻ cũng hiện, ghi rõ là nợ thẻ, chưa trừ ví. Chạm một dòng chi hoặc thu để sửa ngay.
- **Đối chiếu và trả thẻ:** lịch sử các lần đối chiếu (kèm số lệch) và các lần trả thẻ nằm luôn trên tab, xoá được nếu ghi nhầm.
- Dòng **Số dư ví** ở tab Giao dịch giờ dẫn về tab Ví.
- Thanh tab có 5 mục: Ví, Tổng quan, Giao dịch, Thẻ, Khoản vay.

---

## Có gì mới trong v49 (so với v48)

**Biết ví đang còn bao nhiêu tiền, không chỉ thu chi theo tháng.** Ghi giao dịch vẫn y như cũ, không thêm bước nào.

- **Số dư hiện tại** nằm đầu tab Tổng quan, và một dòng **Số dư ví** trong thẻ *Hôm nay còn được tiêu* ở tab Giao dịch.
- Lần đầu bấm **Nhập số dư hiện tại**, gõ số đang thấy trong app ngân hàng. Từ đó app tự tính tiếp:
  - khoản thu cộng vào, chi thường trừ ra;
  - đi vay và được trả nợ cộng vào, cho vay và trả nợ trừ ra;
  - **quẹt thẻ chưa trừ số dư**, chỉ cộng vào nợ thẻ.
- **Trả thẻ** (nút mới ở tab Thẻ): tiền trả thẻ trừ vào số dư và trừ nợ thẻ, không tính là chi tiêu. Số tiền điền sẵn bằng số đang nợ.
- Có nợ thẻ thì thấy luôn **sau khi trả thẻ còn bao nhiêu**.
- **Đối chiếu số dư:** gõ số thật, app báo lệch bao nhiêu so với sổ rồi lấy số thật làm mốc mới. Khoản quên ghi trước lúc đối chiếu, ghi bù sau đó, không làm đổi số dư nữa vì số thật đã có nó.
- **Lịch sử** các lần đối chiếu (kèm số lệch) và các lần trả thẻ, xoá được nếu ghi nhầm.
- Số dư, lần đối chiếu và lần trả thẻ đi theo file sao lưu và gộp được giữa các máy.

**Sửa lỗi Gộp file làm mất khoản định kỳ.** Trước đây gộp file sao lưu từ máy khác thì danh sách khoản định kỳ bị xoá trắng. Giờ được gộp như các khoản khác.

---

## Tất cả tính năng của app

### Tab Ví (mở mặc định)
- **Số dư hiện tại** của ví, nợ thẻ và số còn lại sau khi trả thẻ.
- Nút **Đối chiếu số dư** và **Trả thẻ**.
- **Biến động từ lần đối chiếu**, mỗi dòng kèm số dư còn lại; chạm để sửa.
- Lịch sử đối chiếu và trả thẻ.

### Tab Tổng quan
- **Còn lại thực tế** theo tháng, chọn được gồm chi thường, chi thẻ hay cả hai, kèm mức tăng giảm so với tháng trước.
- Bốn ô tổng: thu vào, chi thường, chi thẻ, khoản vay. Khoản vay để riêng, không tính vào còn lại thực tế.
- Thêm khoản thu theo nguồn: Lương, Thưởng, Bán hàng, Được cho, Khác. Chạm vào khoản thu để sửa số tiền, ghi chú, ngày nhận, nguồn thu.
- **Phân tích tháng** (nút biểu đồ cạnh nút Khoản thu): biểu đồ so sánh thu chi theo ngày, tuần, tháng.
- Thống kê chi theo tag nằm trong Phân tích tháng, ăn theo lựa chọn ở trên. Chạm một nhóm để xem các khoản của nhóm đó theo ngày.
- Danh sách tất cả thu chi trong tháng. Chạm vào ô tìm là ô tìm lên sát đỉnh màn hình và đứng yên ở đó.
- **Tìm kiếm xuyên tháng** trên cả khoản chi, khoản thu và chi thẻ.
- **Sửa ngay tại chỗ:** chạm một dòng trong kết quả tìm kiếm hay trong bảng chi tiết nhóm là mở luôn form sửa của khoản đó, không phải đi tìm lại theo ngày.

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
- **Trả thẻ:** ghi lần thanh toán thẻ, trừ vào số dư ví và nợ thẻ, không tính là chi tiêu.
- **Kỳ sao kê:** thẻ có khai ngày sao kê thì hiện số tiền của kỳ đang mở và số ngày còn lại.

### Tab Khoản vay
- Theo dõi khoản **mình đi vay** và **mình cho vay**, có tổng đang nợ và tổng người khác nợ mình.
- Ghi nhiều lần vay thêm và nhiều lần trả trong cùng một khoản, lịch sử gộp theo thời gian.
- Xem số còn lại, hạn trả, cảnh báo quá hạn.
- Ba tab con: Đi vay, Cho vay, Tất toán; hai tab đầu hiện tổng còn phải trả hoặc còn phải thu.
- Lọc theo trạng thái (chưa xong, tất toán), ngày khởi tạo hoặc ngày đến hạn.

### Người nhận (trong Cài đặt)
- Lưu người hay chuyển tiền: tên gợi nhớ, số tài khoản, ngân hàng, tên tài khoản, nội dung mặc định, tag thường dùng.
- Bấm **Chuyển** để mở form đã điền sẵn thông tin.

### Cài đặt (bánh răng góc trên bên phải)
- **Giao diện:** Tự động, Sáng hoặc Tối.
- **Quét mã QR:** Camera iPhone hoặc Quét trực tiếp, kèm thời gian tự tắt camera.
- **Hạn mức chi một ngày.**
- **Người nhận:** danh sách người hay chuyển tiền.
- **Khoản định kỳ:** khai một lần, app tự ghi mỗi tháng, không tính vào hạn mức ngày. Chọn ghi vào chi thường hoặc vào một thẻ tín dụng.
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
- Dữ liệu **chỉ lưu trên máy** (IndexedDB), không gửi lên máy chủ nào. App không tải gì từ trang web khác.
- Không còn giới hạn khoảng 5 MB dùng chung với các mini app khác.
- Tự báo khi có bản mới, bấm **Tải lại** để cập nhật.
- Chữ giải thích nằm sau nút **ⓘ** cạnh tiêu đề, chạm mới hiện.
- Giao diện Liquid Glass, sáng và tối theo cài đặt của máy. Thanh tab nổi ở đáy màn hình.
- Dữ liệu được giữ vô thời hạn, app không tự xoá khoản cũ.

---

## Lịch sử phiên bản

| Phiên bản | Nội dung chính |
|---|---|
| **v50** | Tab Ví riêng, đứng đầu, mở mặc định; biến động số dư từng khoản |
| **v49** | Số dư ví: đối chiếu, trả thẻ, nợ thẻ; sửa lỗi gộp làm mất khoản định kỳ |

*File này chỉ giữ ghi chú của hai bản gần nhất.*
