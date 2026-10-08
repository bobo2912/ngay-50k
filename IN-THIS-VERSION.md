# Tiêu Gọn – In this version

**Phiên bản hiện tại:** v111, ngày 08/10/2026

---

## Có gì mới trong v111 (so với v110)

- **Số dư thẻ trừ cả tiền đã trả:** đầu màn thẻ = chi trong tháng − các lần trả thẻ trong tháng (vd chi 745.937đ, trả 299.145đ → −446.792đ). Dòng phụ ghi rõ "Chi … · đã trả … · tháng …".
- Biểu tượng nguồn tiền (🏦, 💳…) nhỏ lại và nâng lên, nằm giữa chiều cao chữ.
- **Sổ → Tháng:** bỏ đường trắng phía trên tiêu đề và ô tìm.
- **Nền không còn chia 2 mảng màu** ở trang ngắn (Chat, kết quả tìm), ở mọi giao diện.

---

## Có gì mới trong v110 (so với v109)

- **Mọi ví cùng một bố cục:** Tài khoản, ví khác và thẻ đều có đầu màn số dư (thẻ là số dư âm = chi trong tháng), bên dưới là **chọn tháng ‹ ›**, **ô tìm** (cùng cơ chế dính đỉnh màn hình) và **lịch sử giao dịch theo ngày** của tháng đang xem. Tìm thì tìm trong mọi tháng.
- Thẻ: lịch sử gồm quẹt thẻ và các lần trả thẻ (ghi trả từ ví nào); có dòng kỳ sao kê khi xem tháng hiện tại. Nút Trả thẻ / Sửa thẻ ở đầu màn.
- **Ví chỉ lo số dư:** bỏ Ghi tay / Từ ảnh khỏi thẻ. **Ghi chi** ở Sổ giờ hỏi **Ghi thủ công** hay **Từ ảnh**; Từ ảnh dùng y nguyên cách đọc ảnh chụp / dán thông báo ngân hàng của thẻ trước đây.
- Biểu tượng nguồn tiền (🏦, 💳…) canh thẳng hàng với chữ.

---

## Có gì mới trong v109 (so với v108)

- **Tìm ở Sổ → Tháng:** bỏ dải trắng thừa phía trên ô tìm; nút Ngày/Tháng cũng ẩn khi đang tìm.
- **Tab thẻ giống tab ví:** đầu màn là **số dư âm** = tổng chi bằng thẻ trong tháng đang xem (vd −3.681.117đ, "Chi tháng 10/2026 · 4 khoản"), bên phải xếp dọc 2 nút **Trả thẻ** và **Sửa thẻ**. Bỏ chữ "Không nợ", bỏ khối tổng chi và biểu đồ; bên dưới là nút Ghi tay / Từ ảnh, kỳ sao kê và **Lịch sử giao dịch**.
- **Sổ đồng bộ với Ví:** Sổ (Ngày và Tháng) giờ có đủ mọi giao dịch: chi tài khoản/ví, quẹt thẻ, thu, và các khoản tiền di chuyển như **trả thẻ, chuyển giữa ví, vay / cho vay / trả nợ** (ghi "không tính thu chi", không cộng vào hạn mức hay thu chi). Danh sách tháng có thêm quẹt thẻ.
- **Nguồn tiền bằng biểu tượng:** cuối dòng phụ có biểu tượng nhỏ 🏦 tài khoản, 📱 ví điện tử, 💳 thẻ (giữ ngón tay hoặc trình đọc màn hình đọc được tên đầy đủ).

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
- Tab **Tài khoản**: số dư, nút **Đối chiếu số dư** và **Thêm khoản thu**, cùng các mục bên dưới (hạn mức hôm nay, nút ghi chi / thu, giao dịch theo ngày kèm trả thẻ / chuyển ví, 7 ngày, lịch).
- Tab **ví khác**: số dư, nút Đối chiếu, Chuyển tiền, Sửa ví; các khoản sắp tới và biến động của ví.
- Tab **thẻ**: nội dung thẻ tín dụng (xem mục Màn thẻ tín dụng bên dưới). Nút **Trả thẻ** chọn được ví trả.
- Nút **Đối chiếu** mở màn riêng: ô nhập số dư thật (ví Tài khoản có thêm ô nợ thẻ), chuyển tiền giữa các ví, sắp tới, biến động từ lần đối chiếu, lịch sử đối chiếu / trả thẻ / chuyển ví.

- **Thẻ Hôm nay còn được tiêu:** số tiền còn lại, thanh tiến độ, chuyển đỏ khi vượt hạn mức.
- **Chuyển nhanh cho người hay chuyển:** chạm tên để điền sẵn thông tin.
- **Nhập tay** (ghi chi tiền mặt; bấm "Chuyển khoản cho ai đó?" để nhập số tài khoản) và **Thêm thu.**
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

### Tab Sổ → Tháng (trước là Tổng quan)
- **Dòng tiền ròng** theo tháng (thu trừ chi), chọn được gồm chi thường, chi thẻ hay cả hai, kèm mức tăng giảm so với tháng trước.
- Bốn ô tổng: thu vào, chi thường, chi thẻ, khoản vay. Khoản vay để riêng, không tính vào dòng tiền ròng.
- Khoản thu (thêm ở tab Ví) hiện trong danh sách theo nguồn: Lương, Thưởng, Bán hàng, Được cho, Khác. Chạm vào khoản thu để sửa số tiền, ghi chú, ngày nhận, nguồn thu.
- **Phân tích tháng** (nút biểu đồ cạnh tên tháng): biểu đồ so sánh thu chi theo ngày, tuần, tháng.
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
| **v110** | Mọi ví cùng bố cục (tháng, tìm, lịch sử); Ghi chi hỏi thủ công / từ ảnh |
| **v109** | Tab thẻ số dư âm + Trả/Sửa thẻ; Sổ có đủ trả thẻ, chuyển ví, vay; nguồn tiền bằng biểu tượng |
| **v108** | Tìm trong lịch sử ví (cùng cơ chế ô tìm của Sổ) |
| **v107** | Sổ (Ngày/Tháng) và Ví tách vai; hạn mức tính cả quẹt thẻ; Ghi chi chọn được thẻ |
| **v106** | Bỏ hẳn quét mã QR; nút Cập nhật số dư canh giữa |
| **v105** | Màn Ví gọn (hướng A): số dư một lần, tab chữ, nút chi đỏ / thu xanh |
| **v104** | Nhãn Tài khoản gọn; 4 nút ghi trên một hàng; Ghi nhanh gọn |
| **v103** | Sửa: "nhận" là khoản thu; "tôi" không bị hiểu là "tối" |
| **v102** | Thêm khoản thu ở tab Ví (Tài khoản), bỏ khỏi Tổng quan |
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
