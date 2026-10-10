# Tiêu Gọn – In this version

**Phiên bản hiện tại:** v147, ngày 10/10/2026

---

## Có gì mới trong v147 (so với v146)

- **Nhận giao dịch từ Google Sheet nhanh hơn:** mở / quay lại app là hỏi Sheet gần như ngay (0,15–0,3 giây thay vì 0,6–1,5 giây, bỏ giới hạn 15 giây giữa hai lần); chưa có gì thì tự hỏi lại sau 4, 10 và 20 giây (phím tắt có thể chưa gửi xong), rời app thì dừng. Bấm 📋 hiện "Đang lấy từ Google Sheet…".
- **Apps Script bản mã 3:** khi không có gì mới thì trả lời ngay, không mở Sheet (nhanh hơn rõ rệt); lúc nhận thông báo chỉ so 400 dòng gần nhất để bỏ trùng. Cài đặt nhắc khi mã còn là bản cũ.

---

## Có gì mới trong v146 (so với v145)

- Cài đặt → Tự ghi từ thông báo: bấm **Kiểm tra** giờ hiện kết quả ngay dưới nút (trước đây hiện ở đầu trang, ngoài màn hình nên trông như nút không chạy); nút đổi thành "Đang kiểm tra…" trong lúc chờ. Báo rõ khi URL là /dev, thiếu /exec, là link trang Sheet, hoặc máy đang mất mạng.

---

## Có gì mới trong v145 (so với v144)

- **Đọc nội dung ND đúng hơn:** số tiền trong ND (vd "tra Lan 500,000") không còn bị tách thành giao dịch thứ hai; ngày giờ trong ND không đè ngày giờ giao dịch; ND bị ngắt xuống dòng hoặc có dấu | được nối lại đủ; bỏ dấu " thừa khi lấy từ Google Sheet.
- **Đọc được số dư nằm giữa câu** (Vietcombank, ACB, VPBank, BIDV, Cake…) và nhận "GD: <chữ>" là nội dung (ACB).
- **Hai giao dịch thật giống nhau cùng phút không còn bị gộp:** dấu vân tay chống trùng có thêm số dư SD; khoản ghi từ thông báo nhớ dấu vân tay, chỉ khoản ghi tay mới được so "đã có trong sổ" và mỗi khoản ghi tay chỉ khớp một thông báo.
- **Google Sheet không còn mất thông báo lúc iPhone mất mạng:** phím tắt gửi cả tệp TieuGon.txt, Apps Script (bản mã 2) bỏ dòng đã có, trả TG_OK để phím tắt xoá tệp; tệp không lớn dần. Lấy từng trang 300 dòng tới hết. Có khoá tránh hai thông báo ghi cùng lúc.
- Đã dùng Sheet thì không cần chép vào bộ nhớ tạm nữa (không ghi đè thứ đang copy); 📋 lúc mất mạng mở thẳng chọn tệp. Câu báo nói đúng nguồn (Sheet / bộ nhớ tạm / tệp); Cài đặt báo khi mã Apps Script còn là bản cũ.
- Bài thử mới `node tests-notif.js` (20 mẫu thông báo).

---

## Có gì mới trong v144 (so với v143)

- **📋 tự chọn cách lấy thông báo:** có mạng và đã kết nối Google Sheet → lấy từ Sheet (mở app cũng tự lấy); chưa có Sheet hoặc mất mạng → dán bộ nhớ tạm; dán không được / bộ nhớ tạm trống / không có giao dịch → thanh dưới có nút **Chọn tệp** đọc thẳng TieuGon.txt (kèm "Dán lại"); Sheet lỗi → nút **Dán** và **Chọn tệp**. Bỏ mục chọn 3 cách.
- Cài đặt → Tự ghi từ thông báo: hướng dẫn một automation duy nhất **"TG · Lưu thông báo MB"** (Append to Text File → Get File → Copy to Clipboard → [Get Contents of URL cho Google Sheet, luôn để cuối]); Sheet đặt tên **"TG · Thông báo ngân hàng"**, dự án Apps Script **"TG Relay"**. Dòng trạng thái cho biết đang dùng cách nào.

---

## Có gì mới trong v143 (so với v142)

- Cài đặt → Tự ghi từ thông báo gọn lại: chọn **một** trong 3 cách ở mục **Cách đang dùng** (Google Sheet · Chọn tệp · Bộ nhớ tạm), chỉ hiện hướng dẫn của cách đang chọn; nút 📋 làm đúng theo cách đó. Dán URL Google Sheet hợp lệ thì tự chuyển sang cách Google Sheet.

---

## Có gì mới trong v142 (so với v141)

- **Tự động hoàn toàn qua Google Sheet của bạn:** Phím tắt (automation MB Bank) gửi nội dung thông báo lên một Apps Script trong tài khoản Google của bạn; **mở app hoặc quay lại app là giao dịch mới tự hiện sẵn** trong Chat để bấm Ghi, không cần chạm gì thêm (đang ở màn khác thì có thanh "N giao dịch mới · Xem"). Bấm 📋 để lấy ngay.
- Cài đặt → Tự ghi từ thông báo: hướng dẫn từng bước, nút **Chép mã Apps Script** (đã gắn sẵn mã bí mật riêng), ô dán URL /exec, nút **Kiểm tra**. Cách chọn tệp vẫn còn làm phương án không cần mạng.

---

## Có gì mới trong v141 (so với v140)

- **Ghi từ thông báo không phải rời app:** bấm **📋** là bảng chọn tệp của iPhone hiện ngay trên Tiêu Gọn, chạm tệp **TieuGon.txt** (lần sau nằm sẵn ở mục Gần đây) là app đọc và tách giao dịch luôn. Không còn mở app Phím tắt, không qua bộ nhớ tạm, không có bước Paste. Phím tắt thứ hai "TieuGon" không cần nữa (có thể xoá).
- Cài đặt → Tự ghi từ thông báo: hướng dẫn mới, nút "Chọn tệp thử"; bỏ chọn "📋 đọc từ tệp" để quay lại cách dán bộ nhớ tạm.

---

## Có gì mới trong v140 (so với v139)

- Thanh hiện sau khi quay lại từ phím tắt TieuGon gọn một dòng: "📋 Đã lấy thông báo" + nút **Dán**.

---

## Có gì mới trong v139 (so với v138)

- **Thông báo ngân hàng lưu vào tệp, không đụng bộ nhớ tạm:** Phím tắt tự động hoá giờ dùng **Append to Text File** ghi từng thông báo vào iCloud Drive/Shortcuts/TieuGon.txt. Bạn copy gì khác trong lúc chưa mở app cũng không mất thông báo, và dán ở app khác không bị dính nội dung ngân hàng.
- Bấm **📋** cạnh ô chat → app mở phím tắt **TieuGon** (chép tệp vào bộ nhớ tạm) → bấm **◀ Tiêu Gọn** để quay lại → thanh dưới hiện **Dán** → Paste → xem lại rồi Ghi. Trong 2 phút sau đó bấm 📋 là dán luôn.
- Giao dịch cũ hơn 35 ngày trong tệp được bỏ qua; giao dịch đã ghi / đã bỏ vẫn không hiện lại.
- Cài đặt → Tự ghi từ thông báo: hướng dẫn cài 2 phím tắt, đổi tên phím tắt, nút "Thử chạy phím tắt"; bỏ chọn "Lấy thông báo từ tệp" để quay về cách cũ (chép thẳng vào bộ nhớ tạm). Sổ → Ghi chi → "Dán thông báo vừa nhận" vẫn dán thẳng bộ nhớ tạm.

---

## Có gì mới trong v138 (so với v137)

- Dán **một** thông báo (1 giao dịch + dòng số dư) giờ vẫn có nút **Ghi giao dịch** ở dưới khung, không phải chạm mở dòng mới ghi được. Từ 2 giao dịch trở lên vẫn là "Ghi tất cả (N)". Dòng số dư vẫn ghi riêng.

---

## Có gì mới trong v137 (so với v136)

- **Biểu tượng nét mảnh trong vòng tròn xám** thay cho emoji màu ở mọi danh sách giao dịch (Sổ Ngày/Tháng, lịch sử ví, khoản thu, chuyển ví, vay…), gọn và đồng bộ hơn; hợp cả giao diện Sáng, Tối, Pastel. Có sẵn ~60 biểu tượng cho các nhóm và loại khoản; tag tự tạo dùng emoji lạ thì emoji được chuyển xám cho cùng tông.

---

## Có gì mới trong v136 (so với v135)

- **Phân tích lại bằng AI gửi nguyên cả đoạn thông báo đã dán** (đủ mọi dòng, giữ cả SD, ND, ngày giờ) để AI hiểu đúng ngữ cảnh. Kết quả AI tự lọc bỏ các giao dịch đã từng dán trước đó, chỉ giữ giao dịch mới của lần dán này, và nói rõ đã bỏ qua mấy giao dịch.

---

## Có gì mới trong v135 (so với v134)

- Kết quả **dán từ thông báo ngân hàng (📋)** cũng có nút **"↻ Chưa đúng? Phân tích lại bằng AI"**: bấm thì gửi đúng các dòng thông báo của giao dịch mới cho Trợ lý AI đọc lại (khoản đã Ghi được giữ nguyên). Thông báo đọc lại bằng AI không bị đưa vào danh sách "câu máy chưa hiểu".

---

## Có gì mới trong v134 (so với v133)

- **Sửa: hỏi "Hôm qua tiêu gì" khi còn thẻ chờ Ghi (vd dòng số dư của thông báo ngân hàng) bị hiểu thành "đổi ngày" của thẻ đó.** Câu nào tự nó là câu hỏi (hôm qua tiêu gì, tháng này tiêu bao nhiêu, lần cuối… khi nào) giờ luôn được trả lời như câu hỏi; chỉ câu ngắn kiểu "hôm qua chứ", "50k chứ", "thẻ VIB" mới là sửa thẻ đang chờ.

---

## Có gì mới trong v133 (so với v132)

- **Nhiều giao dịch hiện gọn trong một khung:** dán nhiều thông báo (hoặc kể nhiều khoản một lúc) thì mỗi giao dịch là **một dòng** có số thứ tự, nội dung, nhóm, giờ; số tiền **chi màu đỏ (−)**, **thu màu xanh (+)**. Chạm một dòng để mở thẻ sửa đầy đủ, "Thu gọn ▲" để đóng lại. Khung thông báo có tiêu đề "📋 Thông báo ngân hàng · N giao dịch".
- Dòng **🏦 Số dư sau giao dịch** nằm cuối khung, tách riêng bằng nền nhạt, chạm để cập nhật số dư; "Ghi tất cả" không gồm dòng này.
- Khoản đã ghi / đã bỏ vẫn ở đúng chỗ trong danh sách với dấu ✓ và nút Hoàn tác / Khôi phục.
- Bong bóng dán chỉ ghi "📋 Dán thông báo ngân hàng · N giao dịch mới".

---

## Có gì mới trong v132 (so với v131)

- Câu chào Chat trở lại: **"Chào bạn! Hôm nay bạn thế nào?"**
- Bấm 📋 mà chưa dán được, bộ nhớ tạm trống hoặc không có giao dịch ngân hàng thì chỉ báo thoáng ở dưới màn hình, không chèn câu hướng dẫn vào Chat nữa.

---

## Có gì mới trong v131 (so với v130)

- **Chống trùng theo số tiền + thời gian:** giao dịch nào đã từng dán vào app (đã Ghi, đã Bỏ, hay đã ghi rồi xoá trong Sổ) thì lần sau dán không hiện lại nữa. Nhận diện bằng tiền vào/ra, số tiền, ngày và giờ:phút. Cùng một thông báo bị chép nhiều lần trong bộ nhớ tạm cũng chỉ tính một.
- **Bong bóng dán gọn hơn:** không in cả bộ nhớ tạm (vốn chứa cả thông báo cũ), chỉ liệt kê các giao dịch mới, vd "+10.000đ · 00:55", "−20.000đ · 01:05".

---

## Có gì mới trong v130 (so với v129)

- **Thẻ Số dư thật lấy theo thông báo gần nhất:** khi dán nhiều thông báo, số dư lấy từ giao dịch muộn nhất; các giao dịch cùng phút thì lấy thông báo đến sau (nằm cuối bộ nhớ tạm). Trước đây giao dịch cùng phút bị lấy nhầm thông báo đầu tiên.
- Thông báo mới nhất đã được ghi trước đó vẫn được dùng để tính số dư, không bị bỏ qua.

---

## Có gì mới trong v129 (so với v128)

- **Tiền vào (+) là khoản thu:** thông báo "GD: +491,997VND" giờ thành thẻ **Khoản thu** (nội dung lấy từ ND:, có chữ lương / thưởng thì tự chọn nhóm).
- **Cập nhật số dư là thẻ riêng:** ghi giao dịch không còn tự đổi số dư. Thông báo có "SD:" thì app thêm một thẻ **Số dư thật** ở cuối (lấy SD của giao dịch mới nhất), bấm Ghi thẻ đó mới cập nhật số dư Tài khoản. Nút "Ghi tất cả" không gồm thẻ số dư.
- **Nhiều biến động cùng lúc:** dán nhiều thông báo một lần thì mỗi dòng là một giao dịch (chi và thu), giao dịch đã ghi tự bỏ qua, chỉ một thẻ số dư theo giao dịch mới nhất. Cài đặt → Tự ghi từ thông báo có thêm bước Phím tắt để nối thông báo mới vào bộ nhớ tạm thay vì đè lên.

---

## Có gì mới trong v128 (so với v127)

- **Mở app không còn hiện thanh "Vừa có thông báo ngân hàng?"** (iPhone không cho app biết có thông báo mới hay chưa trước khi bạn bấm Paste, nên thanh cứ hiện cả khi không có gì mới). Thay bằng nút **📋** nhỏ cạnh ô chat, có tiền trừ thì bấm nút này rồi bấm Paste.
- Bấm 📋 mà vẫn là thông báo cũ thì chỉ báo "✓ Không có giao dịch mới", không thêm gì vào Chat.
- Bật / tắt nút 📋 ở Cài đặt → Tự ghi từ thông báo.

---

## Có gì mới trong v127 (so với v126)

- **Đọc thông báo MB Bank chuẩn hơn:** ghi chú lấy đúng phần sau **ND:** (bỏ mã giao dịch ở cuối và tiền tố MBCT), nên app tự đoán nhóm theo nội dung (vd THANH TOAN QR HIGHLANDS → Uống). Số tài khoản người nhận (DEN:) không còn bị nhầm là số thẻ.
- **Cập nhật số dư theo SD:** khoản đọc từ thông báo có "SD: …" thì bấm Ghi là số dư Tài khoản đặt theo đúng số dư ngân hàng sau giao dịch đó (khoản ghi sau thời điểm đó vẫn được tính). Hoàn tác thì bỏ luôn mốc số dư này.
- **Không ghi trùng:** mỗi giao dịch đã đọc được nhớ lại (số tiền, giờ, số dư sau giao dịch); mở app dán lại cùng thông báo thì chỉ báo "Không có giao dịch mới", không thêm thẻ vào Chat.

---

## Có gì mới trong v126 (so với v125)

- **Ghi từ thông báo ngân hàng (gần tự động):** cài một lần Phím tắt → Tự động hoá → **Thông báo** (app MB Bank…) → **Sao chép vào bộ nhớ tạm**. Mở Tiêu Gọn, thanh dưới hỏi "Vừa có thông báo ngân hàng?" → bấm **Ghi** → app đọc bộ nhớ tạm, tách khoản trừ tiền (trên máy) và đưa vào Chat để xác nhận. Khoản khớp số thẻ thì thành quẹt thẻ.
- Sổ → **Ghi chi** có thêm lựa chọn **Dán thông báo vừa nhận**.
- Cài đặt → **Tự ghi từ thông báo**: bật/tắt thanh nhắc khi mở app, hướng dẫn từng bước, nút thử đọc bộ nhớ tạm. Dán lại cùng một thông báo thì app nhắc là đã đưa vào rồi.

---

## Có gì mới trong v125 (so với v124)

- **Hiểu chữ viết tắt và hỏi lại kèm lựa chọn.** Gõ "uống HL 59k", "PL 55k", "tháng này HL hết bao nhiêu": máy tìm "HL" là gì trong chính sổ của bạn (chữ cái đầu như Phúc Long = PL, hoặc đọc lướt như Highlands ⊃ H…L) và bảng viết tắt phổ biến (BHX, TCH, KTN…), tạm hiểu theo khả năng cao nhất rồi hỏi: "Mình hiểu HL là Highlands, đúng không?" kèm nút **Đúng**, các lựa chọn khác (vd Hạ Long), **Giữ nguyên HL**. Bấm một nút là thẻ chờ Ghi / câu trả lời đổi theo ngay.
- **Nhớ lựa chọn:** chọn rồi thì lần sau gõ HL là hiểu luôn, không hỏi lại. Dạy bằng lời cũng được: "HL là Highlands", "XYZ là quán ốc cô Ba" (thẻ đang chờ cũng tự sửa theo), "quên HL" để bỏ.
- Không đoán được (vd "XYZ") thì hỏi "XYZ là gì vậy?" thay vì ghi bừa.
- Xem và xoá các viết tắt đã nhớ ở **Cài đặt → Chat đã học → Viết tắt**. Viết tắt nằm trong dữ liệu chính nên đi theo file sao lưu và gộp được giữa hai máy; Trợ lý AI cũng được báo các viết tắt này.

---

## Có gì mới trong v124 (so với v123)

- **Chat hiểu ngữ cảnh từ chính sổ của bạn.** App dựng một từ điển riêng từ nội dung bạn đã ghi (tên quán, thương hiệu, cách gọi riêng như "quán bà Tý", "tiền học Mon") và tên người (khoản vay, người nhận, người thân). Câu hỏi nhắc tới cái nào thì lọc đúng cái đó, không lấy cả nhóm: "tháng này Highlands hết bao nhiêu" chỉ tính Highlands, không tính mọi đồ uống.
- **Kiểu hỏi mới, máy tự trả lời:**
  - Tìm khoản: "450k hôm qua là khoản gì", "tìm khoản 1tr2" (không đúng số thì đưa các khoản gần số đó), "tìm quán bà Tý".
  - Lần cuối: "lần cuối cắt tóc khi nào", "bao lâu rồi chưa đi quán bà Tý": ngày gần nhất, các lần trước, nhịp trung bình và lần tới dự kiến.
  - Mấy lần: "tháng này đi grab mấy lần": số lần, tổng, trung bình mỗi lần, so với kỳ trước, nút liệt kê.
  - Trung bình: "trung bình mỗi ngày tiêu bao nhiêu" (so với hạn mức), "mỗi tháng tiền điện bao nhiêu" (3 tháng gần nhất và tháng này đang ở mức bao nhiêu %).
  - Theo người: "đã gửi mẹ bao nhiêu", "Nam đã trả bao nhiêu", "giao dịch với Nam": khoản vay với người đó và mọi khoản có nhắc tên.
- **Tự làm rõ khi câu thiếu ý:**
  - Không nói kỳ ("tiền điện bao nhiêu"): hôm nay chưa có thì lấy tháng này, tháng này chưa có thì báo lần gần nhất.
  - Câu cụt chỉ có tên ("Tuấn", "Lan"): app tìm trong sổ xem là ai và đưa nút chọn ("giao dịch với Anh Tuấn", "Tuấn béo còn nợ bao nhiêu"…). Trùng tên nhiều người thì nêu đủ.
  - Hỏi tiếp chỉ bằng tên quán ("còn Highlands?") thì đổi đúng sang quán đó.
- Sửa: "hôm qua" không còn bị đoán là nhóm Hiếu hỷ (lẫn với "quà"); "Tuấn" không lẫn với "tuần", "Lan" viết hoa không lẫn với "lần"; chữ trong tên quán ("quán bà Tý", "Hà Nội") không bị hiểu là người thân.
- Kho câu mẫu thêm 102 câu hỏi lục dữ liệu: 4.648 câu, máy tự hiểu đúng hết.

---

## Có gì mới trong v123 (so với v122)

- **Hỏi khoản sắp tới / dự kiến, máy tự trả lời:** "có khoản dự kiến cho vay nào không", "các ngày tới sau hôm nay có gì", "từ nay tới cuối tháng có khoản chi nào", "tuần sau phải trả gì", "sắp đến hạn khoản nào", "tháng sau có khoản thu nào". App gom từ nay tới cuối tháng (hoặc tuần sau, tháng sau, N ngày tới): khoản chi / thu / quẹt thẻ ghi trước ngày, cho vay / đi vay hẹn ngày, hạn trả của khoản vay còn dở, khoản định kỳ chưa tới ngày. Trả lời theo ngày, tổng sắp chi / sắp thu và số dư ví dự kiến. Hỏi tiếp "còn tháng sau thì sao", "chỉ khoản cho vay thôi" được.
- **Ghi trước khoản tương lai qua Chat:** "ngày 20 dự kiến cho Nam vay 2tr", "ngày mai đóng tiền điện 700k", "thứ 2 tuần sau trả tiền nhà", "sẽ cho Nam vay 1tr vào ngày 15", "Hào hẹn ngày 25 trả 500k" ghi đúng ngày sắp tới (trước đây bị lùi về tháng trước). Tới ngày mới trừ vào số dư.
- **"Nên tiết kiệm gì"** (cả "vậy nên…", "tháng này nên…", "nên cắt giảm khoản nào", "làm sao để tiết kiệm"): 5 nhóm chi nhiều nhất kỳ này với số tiền, %, tăng / giảm so với kỳ trước, mẹo riêng từng nhóm, số tiền bớt được và tổng có thể để dành. Đầu tháng ít dữ liệu thì lấy 30 ngày qua.
- **Câu sửa lại** kiểu "Sai rồi, ý tôi là …", "không phải, ý mình là …" giờ hiểu phần sau thay vì chỉ xin lỗi.
- Sửa: "phải trả tiền nhà 4tr" là khoản chi (trước bị hiểu thành được trả nợ).
- Kho câu mẫu thêm 200+ câu hỏi khoản sắp tới và tiết kiệm: 4.546 câu, máy tự hiểu đúng hết.

---

## Có gì mới trong v122 (so với v121)

- **Kho câu mẫu 4.342 câu** (`kho-cau-mau.js`, chạy `node tests-kho-cau.js`): ~250 món/việc chi kèm nhóm và giá × cách nói số tiền × lúc nào × có dấu/không dấu; quẹt thẻ, ví, tiền mặt, thu nhập, vay mượn, số dư, trả thẻ, chuyển ví, nhiều khoản một câu, phép tính, câu hỏi, trò chuyện, nhánh hội thoại, và ~150 câu viết tay kiểu người thật nhắn. Máy tự hiểu đúng 100% bộ này, không cần AI (trước khi sửa: 89,8%).
- **Từ điển nhóm chi ~1.100 từ**, cụm dài khớp trước ("bún đậu mắm tôm" là Ăn dù có "mắm", "sửa điện thoại" là Sửa chữa). Nhóm bạn tự tạo (vd "Gym") được đoán theo tên.
- **Máy tự tính:** "3 ly trà sữa mỗi ly 35k" → 105k; "35k/ly", "x3"; "siêu thị 500k giảm 10%" → 450k; "… được giảm 50k", "trừ voucher 30k"; "ăn lẩu 600k chia 4" → ghi phần mình 150k, có nút **mình trả hết** để ghi cả bill.
- **Nhánh hội thoại, máy tự xử lý:** khi đang có thẻ chờ Ghi, nhắn tiếp
  - "ok ghi đi" (ghi), "thôi bỏ" / "đừng ghi" (bỏ)
  - "nhầm, 45k chứ" / "45k" (sửa số tiền), "quẹt thẻ" / "thẻ VIB" / "tiền mặt" / "momo" (đổi nguồn tiền)
  - "hôm qua chứ" (đổi ngày), "nhóm uống" (đổi nhóm), "nội dung là …" (đổi nội dung), "Nam" (tên người khi cho vay thiếu tên).
  - Kể thiếu số tiền ("ăn phở") → app hỏi lại → nhắn "45k" là ra đúng khoản.
- **Gợi ý ngay trên thẻ:** thẻ đoán (bấm đổi thẻ khác), chia tiền, thiếu tên người vay, số tiền đã tính.
- **Tình huống trò chuyện mới:** rút tiền mặt (không ghi là chi), hỏi ngày giờ, hỏi hạn mức, báo lỗi app, xoá hết dữ liệu, nhờ nhắc ghi, tâm sự chuyện tiền.
- Hiểu đúng thêm nhiều kiểu câu: "gửi xe tháng 120k", "50.000 bò né", "2 triệu 9", "giày thể thao" (không phải thẻ), "nạp thẻ viettel" (không phải quẹt thẻ), "trà đào" gõ không dấu, "phí thường niên" (không phải thưởng), "Hùng mượn mình 500k", "mẹ chuyển cho 2tr", "khách chuyển tiền hàng", "trả hết nợ thẻ", "sao tháng này tiêu nhiều vậy" (báo cáo so với tháng trước), "tiền đi đâu hết", "còn bao nhiêu để tiêu", "số dư"…

---

## Có gì mới trong v121 (so với v120)

- **Chạm vào ô nhập Chat, ô tìm kiếm hay bất kỳ nút nào không còn nháy ô xám chữ nhật.** Đó là lớp tô xám mặc định của iPhone khi chạm; giờ tắt cho toàn app (trước chỉ tắt cho vài nút). Nút vẫn có hiệu ứng nhấn riêng của app.

---

## Có gì mới trong v120 (so với v119)

- **Chạm vào ô nhập Chat không còn nháy.** App vẫn giữ mẹo chống đẩy cả trang lên khi bật bàn phím (ô nhập tạm trong suốt khoảng 0,3 giây), nhưng giờ đặt một lớp chữ giống hệt đè lên đúng chỗ, nên chữ / dòng gợi ý trong ô đứng yên.

---

## Có gì mới trong v119 (so với v118)

- **"Thẻ trả ăn trưa 1 triệu" giờ máy tự xử lý, không gọi AI.** Trước đây có từ hai thẻ mà câu không nói thẻ nào thì máy nhường AI. Giờ máy chọn **thẻ quẹt nhiều nhất 60 ngày qua**, bạn đổi được ngay trên thẻ xác nhận. "Trả thẻ 3 triệu" cũng chọn sẵn thẻ đó.
- **Chat tự học từ bạn (thư viện riêng):**
  - Sửa thẻ xác nhận (loại, số tiền, nhóm, thẻ, người, ví, nội dung, ngày) rồi bấm Ghi, hoặc ghi khoản do AI hiểu → app nhớ cách hiểu câu đó.
  - Lần sau gõ câu cùng kiểu, chỉ khác số tiền ("thẻ trả ăn trưa 850k"), máy dùng lại ngay, nhãn **📚 Đã học**, không cần AI. Học được cả kiểu chia tiền và giảm giá: đã học "lẩu 600k chia 4" → 150k thì "lẩu 800k chia 4" ra 200k.
  - Câu hỏi AI đã hiểu (vd "tháng này tiền đi đâu hết") cũng được nhớ, lần sau máy trả lời luôn.
  - Khi vẫn phải nhờ AI, 25 câu đã học gần nhất được gửi kèm làm ví dụ riêng của bạn.
- **Sổ "Câu máy chưa hiểu":** câu máy phải nhờ AI, không hiểu, hoặc bạn bấm "Phân tích lại bằng AI" được ghi lại kèm lý do. Máy học được câu nào thì câu đó tự rời sổ. Có nút **Sao chép danh sách** để gửi người làm app đưa vào thư viện chung.
- **Cài đặt → Chat đã học:** xem, xoá từng câu đã học và câu chưa hiểu, số lần đã dùng lại không cần AI.
- **Mọi thứ máy học đều nằm trong dữ liệu chính** (`learn`, `miss`), nên đi theo file sao lưu, gộp được giữa hai máy, và được mã hoá khi bật mã PIN.

---

## Có gì mới trong v118 (so với v117)

- **Đang gõ ở Chat, chạm ra chỗ trống là bàn phím hạ ngay; vuốt lên/xuống cũng hạ bàn phím** mà không còn giật (trang không bị cuộn dưới bàn phím nữa), giống iMessage. Bấm nút gửi, hàng gợi ý, hay nút Ghi/Bỏ, ô chọn trong thẻ xác nhận vẫn hoạt động như thường.

---

## Có gì mới trong v117 (so với v116)

- **Thư viện câu hỏi – trả lời (`thu-vien-cau.js`)** cho Chat: 227 câu mẫu chia 4 phần — ghi khoản (20 kiểu), hỏi số liệu (11 kiểu), câu nối tiếp, trò chuyện và hướng dẫn (26 kiểu) — mỗi kiểu có câu mẫu (có dấu, không dấu, viết tắt) kèm kết quả mong đợi và câu trả lời nên đưa ra.
- **Chat trả lời được nhiều câu hơn mà không cần AI:** hỏi cách dùng app (ghi, sửa/xoá, hạn mức, thẻ, ví, sao lưu, mã PIN, Trợ lý AI, tag, khoản định kỳ, vay mượn, đọc ảnh, giao diện, cài app), chào hỏi theo buổi, cảm ơn, tạm biệt, khen, báo hiểu sai, than hết tiền, khoe tiết kiệm, xin mẹo tiết kiệm. Câu trả lời có nút gợi ý bấm là hỏi luôn.
- **Kể chi tiêu mà quên số tiền** ("ăn phở") giờ được hỏi lại "Ăn phở hết bao nhiêu vậy bạn?" thay vì hiện hướng dẫn chung.
- **Trợ lý AI nhận câu mẫu từ thư viện** trong lời dặn, hiểu đúng cách app mong đợi.
- Bộ hiểu câu hiểu đúng thêm: "5 khoản lớn nhất tháng này", "ngày nào tiêu nhiều nhất", "tuần này tiêu nhiều hơn tuần trước không", "nhậu bia với bạn 300k" (là chi, không phải bán hàng).
- Bài thử mới: `node tests-thu-vien.js`.

---

## Có gì mới trong v116 (so với v115)

- **"Thẻ trả ăn 1 triệu" giờ là quẹt thẻ, nhóm Ăn**, không còn hiểu nhầm thành trả nợ. "Trả" đi với thẻ hoặc với một khoản chi (trả tiền ăn, trả tiền cà phê…) là khoản chi; "trả thẻ" vẫn là trả thẻ, "trả nợ X" / "trả X" (X đang cho mình vay) vẫn là trả nợ.
- Tìm người vay khớp theo nguyên từ: "ăn" không còn bị nhận nhầm là "Giang".

---

## Có gì mới trong v115 (so với v114)

- **Trang Chat ngắn không còn vuốt được**, nên câu chào không bị khung Số dư ví che dù vuốt lên. Bỏ cách kéo dài thân trang của v111 (trên iPhone làm trang dư ra), thay bằng nền liền một màu ở mọi giao diện; dải mờ sau ô nhập Chat và menu dưới cũng dùng đúng màu này.

---

## Có gì mới trong v114 (so với v113)

- **Câu chào ở Chat không còn bị khung Số dư ví che một nửa.** Mở Chat giờ chỉ cuộn vừa đủ để tin cuối nằm ngay trên ô nhập; chat ngắn thì đứng yên ở đầu trang, không cuộn tới đáy trang nữa.

---

## Có gì mới trong v113 (so với v112)

- **Sao lưu mang theo toàn bộ cài đặt:** giao diện, màn mở đầu, ngân hàng, Trợ lý AI **kể cả khoá API**, chi phí AI, sao lưu nhanh, ví hay dùng và lịch sử Chat. Nhập file ở máy mới là dùng được ngay, không phải dán lại khoá. Mã PIN / Face ID không đi theo file. Gộp thì chỉ lấy lịch sử Chat khi máy này chưa có tin nào; Hoàn tác trả lại cả cài đặt cũ.
- **Chat hiện câu chào ngay** khi mở app hoặc chuyển sang tab Chat (trước phải vuốt xuống mới thấy).
- **Ô tìm ở Ví luôn dính đỉnh khi cuộn**, kể cả tháng có ít giao dịch, giống Sổ → Tháng.

---

## Có gì mới trong v112 (so với v111)

- **Chat hiểu đúng "Đóng tiền học cho Mon 500k" là khoản chi**, không còn ghi thành "Được cho". Câu "X cho …" chỉ là khoản thu khi X là người (mẹ, bố, anh Hai, Hùng…), không phải khi có động từ chi tiêu như đóng, nộp, mua, trả.
- **Sổ → Tháng:** khi ô tìm dính đỉnh màn hình thì không còn hai góc trắng bên trên.
- **Menu dưới tự ẩn khi cuộn xuống, cuộn lên thì hiện lại** (như Facebook). Về đầu trang, cuộn tới cuối hoặc đổi tab thì menu luôn hiện. Tab Chat giữ menu cố định vì ô nhập nằm ngay trên.

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
