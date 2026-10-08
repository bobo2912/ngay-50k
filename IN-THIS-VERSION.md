# Tiêu Gọn – In this version

**Phiên bản hiện tại:** v101, ngày 08/10/2026

---

## Có gì mới trong v101 (so với v100)

- **Bỏ hàng chọn thẻ trong tab thẻ:** chọn thẻ bằng hàng tab ví ở trên. Chỉ còn nút "Chưa gán thẻ" khi có khoản quẹt thẻ chưa biết thuộc thẻ nào. Nút góc phải đổi thành **Sửa thẻ** cho thẻ đang xem.
- **Thêm ví → Thẻ tín dụng** nhập luôn 6 số đầu, 4 số cuối, ngày sao kê ngay trong màn Thêm ví (như màn thêm thẻ trước đây), lưu xong mở tab thẻ đó.
- **Bỏ nút Trả thẻ ở tab Tài khoản:** trả thẻ ở tab thẻ. Tiền trả thẻ (và tiền chuyển sang/nhận từ ví khác) hiện trong lịch sử ngày của tab Tài khoản, ghi "không tính chi tiêu", không cộng vào số đã chi.
- Khoản chi từ ví khác trong lịch sử ngày ghi thêm tên ví.

---

## Có gì mới trong v100 (so với v99)

**Các ví là các tab ngay trong màn Ví, không mở màn con nữa.**
- Đầu màn Ví là **Tổng các ví** (đã trừ nợ thẻ), bên dưới là hàng tab: Tài khoản, các ví thêm, các thẻ tín dụng, và nút Thêm ví.
- Chọn **Tài khoản**: hiện số dư ví Tài khoản, thẻ hạn mức hôm nay, nút quét QR / nhập tay / tiền mặt, lịch sử tiêu theo ngày, 7 ngày, lịch, như trước.
- Chọn **một ví khác** (Momo…): hiện ngay số dư và các khoản của ví đó, cùng nút Đối chiếu, Chuyển tiền, Sửa ví.
- Chọn **một thẻ**: hiện ngay nội dung thẻ (chi theo tháng, kỳ sao kê, Từ ảnh, Ghi tay, Trả thẻ), hàng tab vẫn ở trên để đổi qua lại.
- Màn Đối chiếu số dư chỉ mở khi bấm nút **Đối chiếu**.
- Thêm ví mới thì mở luôn tab của ví đó.
- Chỉ có một ví, không có thẻ thì màn Ví như cũ, không có hàng tab.

---

## Tất cả tính năng của app

### Tab Chat (mở mặc định)
- Kể chi tiêu, vay mượn, khoản thu bằng lời; app tách thành các thẻ xác nhận, bấm Ghi mới lưu, có Hoàn tác.
- Gửi ảnh thông báo trừ tiền: đọc bằng bộ đọc chữ trên máy, không tốn token AI.
- Hỏi nhanh: hôm nay tiêu bao nhiêu, ai còn nợ mình, số dư còn bao nhiêu…
- Hỏi chi tiết: tháng rồi tiêu gì, liệt kê khoản thẻ, top khoản lớn, tiêu ở đâu, so với tháng trước… → báo cáo gom nhóm, chạm để xem từng giao dịch, tính trên máy.
- Chọn Chat hay Ví làm màn hình mở đầu trong Cài đặt.
- **Trợ lý AI** (tuỳ chọn, trong nhóm Nâng cao): dùng khoá API Claude, ChatGPT hoặc Gemini; khoá chỉ lưu trên máy. Mặc định chỉ gọi AI cho câu khó, câu đơn giản máy tự hiểu; có nút Nhờ AI hiểu lại. Xem chi phí và số câu tiết kiệm trong Cài đặt.

### Tab Ví (các ví, thẻ tín dụng, hôm nay, giao dịch theo ngày)
- **Tổng các ví** (đã trừ nợ thẻ) và **hàng tab ví**: Tài khoản (gồm tiền mặt), các ví thêm (ngân hàng khác, ví điện tử), các thẻ tín dụng, nút **Thêm ví**. Chỉ một ví, không thẻ thì không có hàng tab.
- Tab **Tài khoản**: số dư, nút **Đối chiếu số dư**, cùng các mục bên dưới (hạn mức hôm nay, quét QR, giao dịch theo ngày kèm trả thẻ / chuyển ví, 7 ngày, lịch).
- Tab **ví khác**: số dư, nút Đối chiếu, Chuyển tiền, Sửa ví; các khoản sắp tới và biến động của ví.
- Tab **thẻ**: nội dung thẻ tín dụng (xem mục Màn thẻ tín dụng bên dưới). Nút **Trả thẻ** chọn được ví trả.
- Nút **Đối chiếu** mở màn riêng: ô nhập số dư thật (ví Tài khoản có thêm ô nợ thẻ), chuyển tiền giữa các ví, sắp tới, biến động từ lần đối chiếu, lịch sử đối chiếu / trả thẻ / chuyển ví.

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
- **Sao chép và mở app ngân hàng** bạn hay dùng bằng một lần chạm (MB Bank dán thẳng vào ô trợ lý).
- **Xem theo ngày:** lùi, tiến hoặc chọn ngày bất kỳ. Chạm khoản chi để sửa số tiền, ghi chú, ngày và tag. Xoá bằng hai lần chạm.
- **Lịch chi tiêu tháng:** mỗi ngày ghi số đã chi, tô màu đậm nhạt theo mức chi, ★ ngày chi nhiều nhất; chạm để xem ngày đó.
- **Biểu đồ 7 ngày gần nhất** so với hạn mức, có chi tiêu trung bình mỗi ngày. Chạm vào cột để xem lại giao dịch ngày đó.
- **Nhắc sao lưu** khi quá 7 ngày, kèm số khoản đang chỉ nằm trên máy này.
- **Ghi lại khoản hay lặp** bằng một chạm, và nhắc khi hôm qua bỏ ghi.

### Tab Tổng quan
- **Dòng tiền ròng** theo tháng (thu trừ chi), chọn được gồm chi thường, chi thẻ hay cả hai, kèm mức tăng giảm so với tháng trước.
- Bốn ô tổng: thu vào, chi thường, chi thẻ, khoản vay. Khoản vay để riêng, không tính vào dòng tiền ròng.
- Thêm khoản thu theo nguồn: Lương, Thưởng, Bán hàng, Được cho, Khác. Chạm vào khoản thu để sửa số tiền, ghi chú, ngày nhận, nguồn thu.
- **Phân tích tháng** (nút biểu đồ cạnh nút Khoản thu): biểu đồ so sánh thu chi theo ngày, tuần, tháng.
- Thống kê chi theo tag nằm trong Phân tích tháng, ăn theo lựa chọn ở trên. Chạm một nhóm để xem các khoản của nhóm đó theo ngày.
- Danh sách tất cả thu chi trong tháng. Chạm vào ô tìm là ô tìm lên sát đỉnh màn hình và đứng yên ở đó.
- **Tìm kiếm xuyên tháng** trên cả khoản chi, khoản thu và chi thẻ.
- **Sửa ngay tại chỗ:** chạm một dòng trong kết quả tìm kiếm hay trong bảng chi tiết nhóm là mở luôn form sửa của khoản đó, không phải đi tìm lại theo ngày.

### Màn thẻ tín dụng (tab thẻ trong màn Ví)
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
- **Ngân hàng hay dùng:** app ngân hàng mở bằng nút Sao chép và mở.
- **Khoá app:** mã PIN 4 hoặc 6 số, mã hoá dữ liệu trên máy, tự khoá khi rời app, mở bằng Face ID, đổi và tắt mã PIN.
- **Giao diện:** Tự động, Sáng, Tối hoặc Pastel.
- **Quét mã QR:** Camera iPhone hoặc Quét trực tiếp, kèm thời gian tự tắt camera.
- **Hạn mức chi một ngày.**
- **Người nhận:** danh sách người hay chuyển tiền.
- **Khoản định kỳ:** khai một lần, app tự ghi mỗi tháng, không tính vào hạn mức ngày. Chọn ghi vào chi thường hoặc vào một thẻ tín dụng.
- **Quản lý tag:** danh sách tag, chi tiết từng tag, đổi tên và icon, ẩn hoặc hiện, xoá tag tự tạo.
- **Sao lưu và đồng bộ:**
  - Xuất file sao lưu, hoặc xuất CSV để mở bằng Excel.
  - Khoá file sao lưu bằng mật khẩu (tuỳ chọn).
  - **Sao lưu nhanh bằng Phím tắt** iPhone qua bảng chia sẻ: một chạm, ở lại app, tự lưu vào iCloud Drive theo ngày.
  - Nhập từ file, chọn **Gộp** hoặc **Thay toàn bộ**, có xem trước thay đổi và **Hoàn tác**.
  - Đồng bộ giữa các máy qua file.
- **Dung lượng:** kèm số phiên bản app.
  - Thanh đo chỗ lưu đã dùng, dung lượng dữ liệu và bản lưu offline.
  - Xoá khoản chi hôm nay.
  - Xoá toàn bộ dữ liệu trên máy.

### Nền tảng
- Màn hình chào lần đầu: hạn mức, ngân hàng, thẻ tín dụng, mã PIN; có dữ liệu mẫu để xem thử.
- Cài lên màn hình chính như app, chạy **offline hoàn toàn**.
- Thanh đầu trang (ngày, nút Cài đặt) luôn dính trên cùng khi cuộn.
- Vuốt từ trái sang phải để từ trang con quay về trang trước trong cùng menu.
- Dữ liệu **chỉ lưu trên máy** (IndexedDB), không gửi lên máy chủ nào, mã hoá khi bật khoá app. App không tải gì từ trang web khác.
- Không còn giới hạn khoảng 5 MB dùng chung với các mini app khác.
- Tự báo khi có bản mới, bấm **Tải lại** để cập nhật.
- Chữ giải thích nằm sau nút **ⓘ** cạnh tiêu đề, chạm mới hiện.
- Giao diện Liquid Glass, sáng và tối theo cài đặt của máy. Thanh tab nổi ở đáy màn hình.
- Dữ liệu được giữ vô thời hạn, app không tự xoá khoản cũ.

---

## Lịch sử phiên bản

| Phiên bản | Nội dung chính |
|---|---|
| **v101** | Bỏ hàng chọn thẻ; thêm thẻ ngay trong Thêm ví; trả thẻ chỉ ở tab thẻ, hiện trong lịch sử Tài khoản |
| **v100** | Các ví là các tab trong màn Ví, nội dung ví và thẻ hiện ngay tại chỗ |
| **v99** | Thẻ tín dụng là một loại ví; bỏ ô Thẻ, thanh tab còn 4 ô; trả thẻ chọn ví |
| **v98** | Chọn ví khi ghi; chuyển tiền giữa các ví; chat hiểu tên ví |
| **v97** | Nhiều ví: thêm ví, hàng ví, tổng các ví trừ nợ thẻ, màn riêng từng ví |
| **v96** | Chạm ô chat không làm đầu trang và ô Số dư ví giật lên xuống |
| **v95** | Giữ màu đầu trang khi chat; sửa đơ sau khi chụp màn hình; nút Kiểm tra cập nhật; màn Đối chiếu số dư riêng |
| **v94** | Ô chat luôn một dòng; tab Chat; lớp mờ quanh ô Số dư ví |
| **v93** | Sửa Claude hay báo trả lời quá lâu; mặc định Haiku 4.5 |
| **v92** | Hiểu câu nối tiếp trong chat; nhãn ✦ AI / ⚡ Máy; AI ít quá thời gian |
| **v91** | Báo cáo chi tiêu trong chat (liệt kê, gom nhóm, so sánh); sửa bàn phím không hiện; sửa thanh màu trên iOS 26 |
| **v90** | Thanh trạng thái iPhone cùng màu với app ở mọi giao diện |
| **v89** | Dấu ✦ ở câu trả lời của AI; nút phân tích lại dùng ↻ |
| **v88** | Nút Phân tích lại bằng AI dưới mọi câu trả lời, kể cả câu của AI và kết quả đọc ảnh |
| **v87** | Nút Phân tích lại bằng AI dưới mọi câu trả lời của máy; khe dưới đầu trang tách màu |
| **v86** | Bỏ dải trắng dưới đầu trang ở tab Trò chuyện, khớp mọi giao diện |
| **v85** | "Còn lại thực tế" đổi thành "Dòng tiền ròng tháng này"; thẻ hạn mức hôm nay gọn hơn |
| **v84** | Chữ gọn hơn, thẻ hạn mức hôm nay thu nhỏ, chỉ nhấn số chính mỗi tab |
| **v83** | Sửa lỗi đơ khi mở app (trang và file phụ lệch bản, Face ID chặn bàn phím), thêm lưới an toàn và nhật ký lỗi |
| **v82** | Gộp Ví và Tài khoản thành một tab Ví |
| **v81** | Bộ hiểu câu: không dấu, viết tắt (hnay, hqua, 1k5, 1,5tr), 104 câu thử mới |
| **v80** | Máy trước, AI sau: chỉ câu khó mới gọi AI; AI xuống nhóm Nâng cao, dán khoá không tự bật |
| **v79** | Đổi tên app thành Tiêu Gọn |
| **v78** | Màn hình chào và dữ liệu mẫu, chọn ngân hàng hay dùng thay cho MB Bank cố định |
| **v77** | Khoá app bằng mã PIN, mã hoá dữ liệu, Face ID, sao lưu có mật khẩu |
| **v76** | Gửi ảnh thông báo trong chat, đọc trên máy không tốn token |
| **v75** | Làm mờ nội dung phía dưới thanh menu |
| **v74** | Ngân sách AI bằng USD, thông báo khi sắp hết |
| **v73** | Xem chi phí AI đã dùng theo từng nhà cung cấp |
| **v72** | Sửa lỗi chạm ô chat không hiện bàn phím |
| **v71** | Chạm ô chat chỉ đẩy ô nhập lên, ô nhập không bị menu che |
| **v70** | Sửa lỗi AI Claude, đầu trang và số dư dính trong chat |
| **v69** | Mở bàn phím trong chat không mất phần trên |

*File này chỉ giữ ghi chú của hai bản gần nhất.*
