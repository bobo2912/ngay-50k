# Ngày 50k – In this version

**Phiên bản hiện tại:** v47, ngày 06/10/2026

---

## Có gì mới trong v47 (so với v46)

**Dữ liệu chuyển sang IndexedDB, bỏ giới hạn khoảng 5 MB.** Trước đây toàn bộ khoản chi nằm trong `localStorage`, chỉ được khoảng 5 MB và tính chung cho mọi mini app cùng tài khoản GitHub (Chia cơm, các app sau này).

- Dữ liệu giờ lưu trong **IndexedDB**, chỗ lưu rộng hơn rất nhiều (thường hàng trăm MB trở lên, tuỳ máy). Đã thử lưu 40.000 khoản, khoảng 10 MB, mở lại vẫn đủ.
- **Tự chuyển dữ liệu cũ** ở lần mở đầu tiên: chép sang IndexedDB, đọc lại để chắc chắn khớp rồi mới xoá bản trong `localStorage`. Không phải làm gì.
- Xoá bản cũ trong `localStorage` cũng **trả lại chỗ cho các mini app khác** vẫn dùng `localStorage`.
- Các cài đặt nhỏ (giao diện, kiểu quét QR, lần sao lưu gần nhất) vẫn để trong `localStorage` như cũ.
- **Trang Dung lượng** hiện phần trăm theo chỗ lưu thật mà máy cho phép, kèm dòng báo khi máy đã cho phép giữ dữ liệu lâu dài.
- Máy nào không mở được IndexedDB thì app tự lưu kiểu cũ, không mất dữ liệu; lần sau mở được sẽ tự chuyển tiếp, lấy bản mới hơn.
- Mở app ở hai cửa sổ cùng lúc thì cửa sổ này lưu, cửa sổ kia tự cập nhật theo.

---

## Có gì mới trong v46 (so với v45)

**Sửa được khoản ngay tại chỗ vừa tìm thấy.** Trước đây tìm ra một khoản rồi muốn đổi số tiền thì phải nhớ ngày, sang tab Giao dịch, lùi về ngày đó rồi tìm lại trong danh sách.

- **Chạm vào một dòng trong kết quả tìm kiếm** là mở luôn form sửa của khoản đó.
- **Chạm vào một dòng trong bảng chi tiết nhóm** cũng vậy.
- Khoản chi thẻ mở form sửa của thẻ, khoản thu mở form khoản thu, khoản chi thường mở form chi — đúng loại của nó.
- Sửa xong lưu hay huỷ thì **bảng chi tiết nhóm mở lại và cập nhật luôn** số mới, không phải mở lại từ đầu.

**Khoản định kỳ ghi được vào thẻ.** Tiền nhà, tiền mạng, tiền học trả bằng thẻ tín dụng thì trước đây vẫn bị ghi thành chi thường.

- Khai khoản định kỳ giờ có thêm trường **Ghi vào**: chọn *Chi thường* hoặc chọn một thẻ trong danh sách.
- Chọn thẻ thì mỗi tháng app tự ghi khoản đó vào đúng thẻ, có gắn nhóm, lên đúng kỳ sao kê và biểu đồ của thẻ.
- Danh sách khoản định kỳ ghi rõ khoản nào vào thẻ nào.

**Sửa lỗi form sửa bị nằm dưới bảng đang mở.** Mở form sửa từ một bảng đã mở sẵn thì form hiện ra phía sau bảng đó, coi như bấm không được. Giờ mỗi bảng mở thêm tự nằm trên bảng trước.

---

---

## Tất cả tính năng của app

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
| **v47** | Dữ liệu chuyển sang IndexedDB, bỏ giới hạn khoảng 5 MB |
| **v46** | Sửa được khoản ngay từ kết quả tìm kiếm và bảng chi tiết nhóm, khoản định kỳ ghi được vào thẻ |

*File này chỉ giữ ghi chú của hai bản gần nhất.*
