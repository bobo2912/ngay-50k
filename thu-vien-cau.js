/* Tiêu Gọn – THƯ VIỆN CÂU HỎI VÀ CÂU TRẢ LỜI cho màn Chat (chạy trên máy, không gửi đi đâu).

   Thư viện gom mọi kiểu câu người dùng hay nhắn, chia theo ngữ cảnh, mỗi kiểu có:
     id, ten        mã và tên kiểu câu
     y_nghia        máy cần hiểu câu đó là gì
     mau            câu mẫu (có dấu, không dấu, viết tắt, giọng nói) kèm kết quả mong đợi
     tra_loi        câu trả lời tốt nhất app nên đưa ra (mẫu, {..} là chỗ app tự điền số liệu)

   Bốn phần:
     GHI    kể chi tiêu, thu nhập, vay mượn, số dư… → thẻ xác nhận để bấm Ghi
     HOI    hỏi số liệu → app tự tính trên máy rồi trả lời
     NOI    câu nối tiếp câu hỏi trước ("còn thẻ thì sao", "tháng trước thì sao")
     TROCHUYEN  chào hỏi, cảm ơn, hỏi cách dùng app, than thở, xin lời khuyên, thiếu số tiền…
                → app trả lời ngay bằng tra_loi, không cần AI
     (E) thư viện riêng: học từ chỗ bạn sửa và từ AI (hocTao, hocTim)
     (F) nhánh hội thoại: câu nối vào thẻ đang chờ Ghi hoặc câu hỏi số tiền (nhanh)
   Kho câu mẫu vài nghìn câu để thử nằm ở kho-cau-mau.js (node tests-kho-cau.js).

   Dùng ở ba chỗ:
     1. App: N50KLib.talk(text, res, info) trả câu trả lời cho phần TROCHUYEN (index.html, localReply).
     2. Trợ lý AI: N50KLib.fewShot() đưa câu mẫu + kết quả mong đợi vào lời dặn AI, AI bắt chước đúng cách hiểu.
     3. Bài thử: node tests-thu-vien.js chạy mọi câu mẫu qua parse-vi.js, câu nào máy hiểu sai là thấy ngay.
   Thêm câu mới: thêm vào `mau` của đúng kiểu câu rồi chạy bài thử.

   Kết quả mong đợi trong `mau`:
     ghi khoản: { kind, amt, cat, date (số ngày lùi: 0 hôm nay, -1 hôm qua), card, loan, who, note, src, w, from, to }
                hoặc mảng nhiều khoản
     câu hỏi:   { q, period, tag, src, group, list, top, compare, kind_q, minAmt }
     trò chuyện: chuỗi id kiểu câu trong TROCHUYEN
   Bối cảnh bài thử (thẻ, khoản vay, ví) ở cuối file: MAU_CTX. */
(function(root){
  "use strict";

  /* ======================= A. GHI KHOẢN ======================= */
  const GHI = [
    { id:"chi_an", ten:"Chi ăn", y_nghia:"Ăn sáng/trưa/tối, đồ ăn, quán xá → chi tài khoản, nhóm Ăn.",
      tra_loi:"Hiện thẻ \"Chi tài khoản · {số tiền} · {nội dung}\" nhóm Ăn, chờ bấm Ghi.",
      mau:[
        ["trưa ăn phở 45k", { kind:"out", amt:45000, cat:"an", note:"phở" }],
        ["an pho 45k", { kind:"out", amt:45000, cat:"an" }],
        ["sáng nay bánh mì 20k", { kind:"out", amt:20000, cat:"an", date:0 }],
        ["bún chả 40", { kind:"out", amt:40000, cat:"an" }],
        ["tối qua ăn lẩu 350k", { kind:"out", amt:350000, cat:"an", date:-1 }],
        ["đặt grabfood 85k", { kind:"out", amt:85000, cat:"an" }],
        ["cơm văn phòng 35 nghìn", { kind:"out", amt:35000, cat:"an" }],
        ["45k ăn phở", { kind:"out", amt:45000, cat:"an" }]
      ]},
    { id:"chi_uong", ten:"Chi đồ uống", y_nghia:"Cà phê, trà sữa, trà đá, bia… → nhóm Uống.",
      tra_loi:"Thẻ chi nhóm Uống.",
      mau:[
        ["cafe 25k", { kind:"out", amt:25000, cat:"uong" }],
        ["cf sáng 29k", { kind:"out", amt:29000, cat:"uong" }],
        ["tra sua 35k", { kind:"out", amt:35000, cat:"uong" }],
        ["trà đá 5k", { kind:"out", amt:5000, cat:"uong" }],
        ["highlands 59k", { kind:"out", amt:59000, cat:"uong" }],
        ["nhậu bia với bạn 300k", { kind:"out", amt:300000, cat:"uong" }]
      ]},
    { id:"chi_dilai", ten:"Đi lại, xăng xe", y_nghia:"Grab, taxi, gửi xe, đổ xăng → nhóm Đi lại / Xăng.",
      tra_loi:"Thẻ chi nhóm Đi lại hoặc Xăng.",
      mau:[
        ["grab 28k", { kind:"out", amt:28000, cat:"dilai" }],
        ["đổ xăng 70k", { kind:"out", amt:70000, cat:"xang" }],
        ["do xang 80k", { kind:"out", amt:80000, cat:"xang" }],
        ["gửi xe 5k", { kind:"out", amt:5000, cat:"dilai" }],
        ["taxi ra sân bay 250k", { kind:"out", amt:250000, cat:"dilai" }],
        ["xanh sm về nhà 62k", { kind:"out", amt:62000, cat:"dilai" }]
      ]},
    { id:"chi_hoadon", ten:"Hoá đơn, nhà cửa", y_nghia:"Tiền điện, nước, nhà, mạng, điện thoại.",
      tra_loi:"Thẻ chi nhóm Điện nước / Nhà / Điện thoại.",
      mau:[
        ["tiền điện 650k", { kind:"out", amt:650000, cat:"diennuoc" }],
        ["tien nha 4tr", { kind:"out", amt:4000000, cat:"nha" }],
        ["tiền nước 120k", { kind:"out", amt:120000, cat:"diennuoc" }],
        ["cước internet 220k", { kind:"out", amt:220000, cat:"dienthoai" }],
        ["nạp điện thoại 100k", { kind:"out", amt:100000, cat:"dienthoai" }],
        ["tiền trọ tháng 10 3tr5", { kind:"out", amt:3500000, cat:"nha" }]
      ]},
    { id:"chi_muasam", ten:"Mua sắm, chợ", y_nghia:"Đi chợ, siêu thị, Shopee, quần áo.",
      tra_loi:"Thẻ chi nhóm Chợ / Mua sắm.",
      mau:[
        ["đi chợ 150k", { kind:"out", amt:150000, cat:"cho" }],
        ["siêu thị winmart 420k", { kind:"out", amt:420000, cat:"cho" }],
        ["shopee 199k", { kind:"out", amt:199000, cat:"muasam" }],
        ["mua áo 250k", { kind:"out", amt:250000, cat:"muasam" }],
        ["mua giày 1tr2", { kind:"out", amt:1200000, cat:"muasam" }]
      ]},
    { id:"chi_khac", ten:"Sức khoẻ, làm đẹp, học, giải trí, hiếu hỷ…", y_nghia:"Các nhóm còn lại đoán theo từ khoá.",
      tra_loi:"Thẻ chi với nhóm đoán theo nội dung; không đoán được thì nhóm Khác.",
      mau:[
        ["mua thuốc 120k", { kind:"out", amt:120000, cat:"suckhoe" }],
        ["cắt tóc 80k", { kind:"out", amt:80000, cat:"lamdep" }],
        ["học phí tiếng anh 2tr", { kind:"out", amt:2000000, cat:"hoctap" }],
        ["xem phim 220k", { kind:"out", amt:220000, cat:"giaitri" }],
        ["mừng cưới 500k", { kind:"out", amt:500000, cat:"hieuhy" }],
        ["sửa xe 150k", { kind:"out", amt:150000, cat:"suachua" }],
        ["pate cho mèo 45k", { kind:"out", amt:45000, cat:"thucung" }],
        ["ủng hộ từ thiện 200k", { kind:"out", amt:200000, cat:"tuthien" }]
      ]},
    { id:"chi_tienmat", ten:"Chi tiền mặt / chuyển khoản", y_nghia:"Nói rõ tiền mặt hay chuyển khoản; vẫn là chi tài khoản.",
      tra_loi:"Thẻ chi, nguồn Tiền mặt hoặc Tài khoản.",
      mau:[
        ["tiền mặt mua rau 30k", { kind:"out", amt:30000, src:"cash" }],
        ["ck tiền nhà 4tr", { kind:"out", amt:4000000, cat:"nha" }],
        ["chuyển khoản tiền học 1tr5", { kind:"out", amt:1500000 }]
      ]},
    { id:"chi_nhieu", ten:"Nhiều khoản một câu", y_nghia:"Tách mỗi số tiền thành một khoản.",
      tra_loi:"Một tin với nhiều thẻ, mỗi khoản một thẻ, có nút Ghi tất cả.",
      mau:[
        ["grab 28k, trà sữa 35k", [{ kind:"out", amt:28000, cat:"dilai" }, { kind:"out", amt:35000, cat:"uong" }]],
        ["xôi 15k bánh mì 20k cafe 25k", [{ amt:15000 }, { amt:20000 }, { amt:25000, cat:"uong" }]],
        ["ăn phở 45k rồi đổ xăng 70k", [{ amt:45000, cat:"an" }, { amt:70000, cat:"xang" }]],
        ["sáng bánh mì 20k\ntrưa cơm 35k", [{ amt:20000 }, { amt:35000 }]]
      ]},
    { id:"chi_ngay", ten:"Ghi bù ngày trước", y_nghia:"Hôm qua, hôm kia, thứ 2, ngày 5, 5/10… → đúng ngày.",
      tra_loi:"Thẻ chi ghi rõ ngày, ví dụ \"Hôm qua\".",
      mau:[
        ["hôm qua đổ xăng 70k", { kind:"out", amt:70000, date:-1 }],
        ["hom kia an lau 300k", { kind:"out", amt:300000, date:-2 }],
        ["hqua cafe 30k", { kind:"out", amt:30000, date:-1 }],
        ["thứ 2 mua sách 150k", { kind:"out", amt:150000, date:-2 }],
        ["ngày 5 tiền điện 600k", { kind:"out", amt:600000, date:-2 }]
      ]},
    { id:"quet_the", ten:"Quẹt thẻ tín dụng", y_nghia:"Quẹt/cà thẻ, tên thẻ → chi thẻ, không trừ ví.",
      tra_loi:"Thẻ \"Quẹt thẻ · {thẻ} · {số tiền}\"; nhiều thẻ mà không nói thẻ nào thì để chọn.",
      mau:[
        ["quẹt thẻ VIB 1tr2 mua giày", { kind:"card", amt:1200000, card:"c1" }],
        ["quet the vib 500k mua ao", { kind:"card", amt:500000, card:"c1" }],
        ["cà thẻ tpbank 2tr siêu thị", { kind:"card", amt:2000000, card:"c2" }],
        ["thẻ trả ăn 1 triệu", { kind:"card", amt:1000000, cat:"an" }],
        ["shopee 350k bằng thẻ VIB", { kind:"card", amt:350000, card:"c1", cat:"muasam" }]
      ]},
    { id:"tra_the", ten:"Trả thẻ tín dụng", y_nghia:"Thanh toán dư nợ thẻ: không phải chi tiêu.",
      tra_loi:"Thẻ \"Trả thẻ · {thẻ} · {số tiền}\", trừ ví, giảm nợ thẻ.",
      mau:[
        ["trả thẻ 3 triệu", { kind:"cardpay", amt:3000000 }],
        ["thanh toán thẻ VIB 5tr", { kind:"cardpay", amt:5000000, card:"c1" }],
        ["tra no the tpbank 2tr", { kind:"cardpay", amt:2000000, card:"c2" }]
      ]},
    { id:"thu", ten:"Khoản thu", y_nghia:"Lương, thưởng, bán hàng, được cho, hoàn tiền, lãi.",
      tra_loi:"Thẻ \"Khoản thu · {nguồn} · {số tiền}\", cộng vào ví.",
      mau:[
        ["nhận lương 15 triệu", { kind:"in", amt:15000000, cat:"luong" }],
        ["lương về 15tr", { kind:"in", amt:15000000, cat:"luong" }],
        ["thưởng tết 5 triệu", { kind:"in", amt:5000000, cat:"thuong" }],
        ["bán đồ cũ được 300k", { kind:"in", amt:300000, cat:"ban" }],
        ["được lì xì 500k", { kind:"in", amt:500000, cat:"cho" }],
        ["mẹ cho 2 triệu", { kind:"in", amt:2000000, cat:"cho" }],
        ["hoàn tiền shopee 50k", { kind:"in", amt:50000 }],
        ["nhan luong 12tr", { kind:"in", amt:12000000, cat:"luong" }]
      ]},
    { id:"cho_vay", ten:"Cho người khác vay", y_nghia:"Mình đưa tiền cho người khác mượn.",
      tra_loi:"Thẻ \"Cho vay · {người} · {số tiền}\"; đã có khoản với người đó thì ghi thêm vào.",
      mau:[
        ["cho chú Dũng vay 500k", { kind:"lend", amt:500000, loan:"l1" }],
        ["cho chu dung vay 1tr", { kind:"lend", amt:1000000, loan:"l1" }],
        ["cho Nam mượn 2 triệu", { kind:"lend", amt:2000000, who:"Nam" }]
      ]},
    { id:"di_vay", ten:"Mình đi vay", y_nghia:"Mình mượn tiền người khác.",
      tra_loi:"Thẻ \"Đi vay · {người} · {số tiền}\".",
      mau:[
        ["vay anh Tuấn 3 triệu", { kind:"borrow", amt:3000000, loan:"l2" }],
        ["mượn Lan 500k", { kind:"borrow", amt:500000, who:"Lan" }],
        ["anh Tuấn cho mình vay 1tr", { kind:"borrow", amt:1000000, loan:"l2" }]
      ]},
    { id:"tra_no", ten:"Mình trả nợ", y_nghia:"Trả lại tiền mình đã vay.",
      tra_loi:"Thẻ \"Trả nợ · {người} · {số tiền}\", giảm khoản mình đang nợ.",
      mau:[
        ["trả nợ anh Tuấn 2tr", { kind:"repay", amt:2000000, loan:"l2" }],
        ["tra no anh tuan 1tr", { kind:"repay", amt:1000000, loan:"l2" }],
        ["trả anh Tuấn 500k", { kind:"repay", amt:500000, loan:"l2" }]
      ]},
    { id:"duoc_tra", ten:"Được trả nợ", y_nghia:"Người mình cho vay trả lại.",
      tra_loi:"Thẻ \"Được trả nợ · {người} · {số tiền}\", giảm khoản họ còn nợ.",
      mau:[
        ["Hào trả 870k", { kind:"collect", amt:870000, loan:"l3" }],
        ["hao tra 200k", { kind:"collect", amt:200000, loan:"l3" }],
        ["chú Dũng trả mình 1 triệu", { kind:"collect", amt:1000000, loan:"l1" }]
      ]},
    { id:"so_du", ten:"Báo số dư thật", y_nghia:"Số dư đang thấy trong app ngân hàng → mốc đối chiếu.",
      tra_loi:"Thẻ \"Số dư thật · {số tiền}\"; ghi xong số dư ví lấy mốc này.",
      mau:[
        ["tài khoản còn 5 triệu 8", { kind:"bal", amt:5800000 }],
        ["tk con 3tr2", { kind:"bal", amt:3200000 }],
        ["số dư 12.450.000", { kind:"bal", amt:12450000 }],
        ["momo còn 350k", { kind:"bal", amt:350000, w:"w1" }]
      ]},
    { id:"chuyen_vi", ten:"Chuyển giữa các ví", y_nghia:"Nạp/rút ví điện tử: không phải chi tiêu.",
      tra_loi:"Thẻ \"Chuyển giữa ví · {từ} → {đến}\".",
      mau:[
        ["nạp momo 500k", { kind:"xfer", amt:500000, from:"main", to:"w1" }],
        ["rút 300k từ momo về tài khoản", { kind:"xfer", amt:300000, from:"w1", to:"main" }],
        ["chuyển 1tr sang momo", { kind:"xfer", amt:1000000, from:"main", to:"w1" }]
      ]},
    { id:"chi_vi", ten:"Chi bằng ví khác", y_nghia:"Nói tên ví (Momo…) khi chi → trừ ví đó.",
      tra_loi:"Thẻ chi ghi rõ ví.",
      mau:[
        ["cafe 30k momo", { kind:"out", amt:30000, w:"w1" }],
        ["trả bằng momo 45k ăn phở", { kind:"out", amt:45000, w:"w1" }]
      ]},
    { id:"so_tien", ten:"Cách nói số tiền", y_nghia:"k, nghìn, tr, củ, 1tr2, 1 triệu 250, 2 trăm, rưỡi, 45 (= 45k).",
      tra_loi:"Đọc đúng số tiền.",
      mau:[
        ["ăn 1tr2", { amt:1200000 }],
        ["mua đồ 1 triệu 250", { amt:1250000 }],
        ["sửa điện thoại 2 trăm", { amt:200000 }],
        ["tiền học 1 triệu rưỡi", { amt:1500000 }],
        ["đi chợ 2 củ", { amt:2000000 }],
        ["phở 45", { amt:45000 }],
        ["mua bàn 1.200.000", { amt:1200000 }],
        ["cafe 25 ngàn", { amt:25000 }]
      ]}
  ];

  /* ======================= B. HỎI SỐ LIỆU ======================= */
  const HOI = [
    { id:"hoi_tong", ten:"Đã tiêu bao nhiêu", y_nghia:"Tổng chi một kỳ.",
      tra_loi:"\"{Kỳ} bạn đã chi {tổng} (tài khoản {a}, thẻ {b}).\" + nút Xem chi tiết từng khoản; hôm nay thì kèm còn tiêu được bao nhiêu.",
      mau:[
        ["hôm nay tiêu bao nhiêu", { q:"spent", period:"today" }],
        ["hom nay tieu bn", { q:"spent", period:"today" }],
        ["tuần này tiêu bao nhiêu", { q:"spent", period:"week" }],
        ["tháng trước tiêu bao nhiêu?", { q:"spent", period:"lastmonth" }],
        ["hôm qua hết bao nhiêu tiền", { q:"spent", period:"yesterday" }],
        ["tháng 9 chi bao nhiêu", { q:"spent", period:"custom" }]
      ]},
    { id:"hoi_nhom", ten:"Tiêu bao nhiêu cho một nhóm", y_nghia:"Tổng chi một nhóm (ăn uống, xăng, grab…).",
      tra_loi:"\"{Kỳ} bạn đã chi cho {nhóm} {tổng}.\"",
      mau:[
        ["tháng này ăn uống bao nhiêu", { q:"spent", period:"month", tag:"an+uong" }],
        ["thang nay an uong bn", { q:"spent", period:"month", tag:"an+uong" }],
        ["tuần này đổ xăng hết bao nhiêu", { q:"spent", period:"week", tag:"xang" }],
        ["tháng này cafe bao nhiêu", { q:"spent", period:"month", tag:"uong" }]
      ]},
    { id:"hoi_con", ten:"Hôm nay còn tiêu được bao nhiêu", y_nghia:"Hạn mức ngày trừ đã chi hôm nay.",
      tra_loi:"\"Hôm nay còn tiêu được {x} (hạn mức {h}).\" Vượt thì báo đã vượt bao nhiêu.",
      mau:[
        ["còn được tiêu bao nhiêu", { q:"left" }],
        ["hom nay con bao nhieu", { q:"left" }],
        ["hôm nay còn bao nhiêu?", { q:"left" }]
      ]},
    { id:"hoi_sodu", ten:"Số dư ví", y_nghia:"Số dư hiện tại của ví / một ví.",
      tra_loi:"\"Số dư ví hiện là {x}, đang nợ thẻ {y}.\" Chưa có mốc thì hướng dẫn nói \"tài khoản còn 5 triệu 8\".",
      mau:[
        ["số dư bao nhiêu", { q:"balance" }],
        ["số dư bn", { q:"balance" }],
        ["tài khoản còn bao nhiêu", { q:"balance" }],
        ["momo còn bao nhiêu", { q:"balance" }]
      ]},
    { id:"hoi_no", ten:"Ai nợ ai", y_nghia:"Khoản vay còn dở; hỏi một người thì lọc người đó.",
      tra_loi:"\"Bạn đang nợ {a}, người khác nợ bạn {b}.\" + danh sách từng người.",
      mau:[
        ["ai còn nợ mình", { q:"loans" }],
        ["mình còn nợ ai", { q:"loans" }],
        ["Hào còn nợ mình bao nhiêu", { q:"loans" }],
        ["mình nợ anh Tuấn bao nhiêu", { q:"loans" }]
      ]},
    { id:"hoi_the", ten:"Chi thẻ, nợ thẻ", y_nghia:"Tổng quẹt thẻ tháng này và nợ thẻ.",
      tra_loi:"\"Tháng này quẹt thẻ {x}. Đang nợ thẻ {y}.\"",
      mau:[
        ["thẻ tháng này bn", { q:"card" }],
        ["tháng này quẹt thẻ bao nhiêu", { q:"card" }]
      ]},
    { id:"hoi_chitiet", ten:"Tiêu vào những gì", y_nghia:"Báo cáo gom theo nhóm, liệt kê, phân tích.",
      tra_loi:"Bảng báo cáo: tổng, từng nhóm (% và số tiền), bấm vào nhóm xem từng khoản.",
      mau:[
        ["tháng này tiêu gì", { q:"report", period:"month", group:"tag" }],
        ["tháng rồi tiêu những gì", { q:"report", period:"lastmonth" }],
        ["liệt kê các khoản tuần này", { q:"report", period:"week", list:true }],
        ["phân tích chi tiêu tháng này", { q:"report", period:"month" }],
        ["thống kê theo ngày tháng này", { q:"report", period:"month", group:"day" }],
        ["tháng này tiêu ở đâu", { q:"report", period:"month", group:"place" }]
      ]},
    { id:"hoi_top", ten:"Khoản lớn nhất", y_nghia:"Top N khoản, khoản trên X.",
      tra_loi:"Danh sách N khoản lớn nhất, mỗi dòng ngày · nội dung · số tiền.",
      mau:[
        ["5 khoản lớn nhất tháng này", { q:"report", top:5 }],
        ["top 3 tuần này", { q:"report", top:3 }],
        ["khoản lớn nhất tháng trước", { q:"report", period:"lastmonth", top:5 }],
        ["các khoản trên 500k tháng này", { q:"report", minAmt:500000 }]
      ]},
    { id:"hoi_sosanh", ten:"So với kỳ trước", y_nghia:"Tăng/giảm so với kỳ liền trước.",
      tra_loi:"Báo cáo kèm cột kỳ trước và mức tăng/giảm từng nhóm.",
      mau:[
        ["tháng này so với tháng trước", { q:"report", period:"month", compare:true }],
        ["tuần này tiêu nhiều hơn tuần trước không", { q:"report", compare:true }]
      ]},
    { id:"hoi_thu", ten:"Thu nhập", y_nghia:"Báo cáo khoản thu.",
      tra_loi:"Báo cáo khoản thu theo nguồn.",
      mau:[
        ["tháng này thu nhập những gì", { q:"report", kind_q:"in" }],
        ["liệt kê khoản thu tháng trước", { q:"report", period:"lastmonth", kind_q:"in" }]
      ]},
    { id:"hoi_sap_toi", ten:"Khoản sắp tới, dự kiến", y_nghia:"Khoản có ngày từ nay tới cuối tháng (hoặc tuần sau, tháng sau…): chi / thu ghi trước ngày, cho vay / vay dự kiến, hạn trả nợ, khoản định kỳ chưa tới ngày.",
      tra_loi:"Danh sách theo ngày + tổng sắp chi / sắp thu + số dư ví dự kiến; không có thì nói rõ và chỉ cách ghi trước.",
      mau:[
        ["Có khoản dự kiến cho vay nào không", { q:"upcoming", only:"lend" }],
        ["Sai rồi ý tôi là trong các ngày tới sau hôm nay", { q:"upcoming" }],
        ["từ nay tới cuối tháng có khoản chi nào không", { q:"upcoming", only:"out" }],
        ["tuần sau phải trả gì", { q:"upcoming" }],
        ["sắp tới có khoản nào đến hạn không", { q:"upcoming", only:"due" }],
        ["tháng sau có khoản thu nào không", { q:"upcoming", only:"in" }],
        ["ngày mai có gì phải trả không", { q:"upcoming" }],
        ["các ngày tới có giao dịch gì", { q:"upcoming" }],
        ["du kien cuoi thang co khoan nao", { q:"upcoming" }]
      ]},
    { id:"hoi_tiet_kiem", ten:"Nên tiết kiệm gì", y_nghia:"Lấy 5 nhóm chi nhiều nhất kỳ này, so kỳ trước, kèm mẹo và số tiền bớt được.",
      tra_loi:"5 nhóm chi nhiều nhất (số tiền, %, tăng/giảm), mẹo từng nhóm, tổng có thể để dành.",
      mau:[
        ["Nên tiết kiệm gì", { q:"save", period:"month" }],
        ["Vậy nên tiết kiệm gì", { q:"save", period:"month" }],
        ["Tháng này nên tiết kiệm gì", { q:"save", period:"month" }],
        ["nên cắt giảm khoản nào", { q:"save" }],
        ["làm sao để tiết kiệm", { q:"save" }],
        ["tuần này nên bớt tiêu cái gì", { q:"save", period:"week" }],
        ["nen tiet kiem o dau", { q:"save" }]
      ]},
    { id:"hoi_ngay", ten:"Ngày tiêu nhiều nhất", y_nghia:"Ngày chi lớn nhất trong kỳ.",
      tra_loi:"\"Tháng này bạn chi nhiều nhất ngày {d}: {x}.\"",
      mau:[
        ["ngày nào tiêu nhiều nhất", { q:"topday" }],
        ["tháng trước hôm nào tiêu nhiều nhất", { q:"topday", period:"lastmonth" }]
      ]}
  ];

  /* ======================= C. CÂU NỐI TIẾP ======================= */
  /* [câu hỏi trước, [câu nối, mong đợi sau khi gộp]] */
  const NOI = [
    { id:"noi", ten:"Câu nối tiếp", y_nghia:"Đổi/thêm một điều kiện cho câu hỏi vừa hỏi, giữ nguyên phần còn lại.",
      tra_loi:"Trả lời lại câu hỏi trước với điều kiện mới.",
      mau:[
        ["tháng này tiêu gì", "còn thẻ thì sao", { q:"report", period:"month", src:"card" }],
        ["tháng này tiêu gì", "tháng trước thì sao", { q:"report", period:"lastmonth" }],
        ["tháng này tiêu gì", "chỉ tính từ tài khoản", { q:"report", src:"tk" }],
        ["tháng này tiêu gì", "theo ngày", { q:"report", group:"day" }],
        ["tháng này tiêu gì", "liệt kê ra", { q:"report", list:true }],
        ["hôm nay tiêu bao nhiêu", "hôm qua thì sao", { q:"spent", period:"yesterday" }],
        ["tháng này tiêu gì", "nhóm ăn thôi", { q:"report", tag:"an" }],
        ["tháng này tiêu gì", "so với tháng trước", { q:"report", period:"month", compare:true }],
        ["có khoản dự kiến nào không", "còn tuần sau thì sao", { q:"upcoming" }],
        ["có khoản dự kiến nào không", "chỉ khoản cho vay thôi", { q:"upcoming", only:"lend" }],
        ["từ nay tới cuối tháng có khoản chi nào không", "tháng sau thì sao", { q:"upcoming", only:"out" }]
      ]}
  ];

  /* ======================= D. TRÒ CHUYỆN & HƯỚNG DẪN ======================= */
  /* khop: biểu thức so trên câu đã bỏ dấu, chữ thường, có dấu cách hai đầu (" ... ").
     uu_tien "truoc": hỏi cách dùng app / câu rất rõ nghĩa → trả lời luôn, kể cả khi máy tưởng là câu hỏi số liệu.
     uu_tien "sau": chỉ dùng khi máy không tìm ra khoản nào và không hiểu là câu hỏi số liệu.
     ai: true → có Trợ lý AI thì để AI trả lời (câu mở, cần suy nghĩ), không có thì dùng tra_loi.
     goi_y: nút gợi ý hiện dưới câu trả lời (bấm là gửi câu đó). */
  const HOW = "(the nao|lam sao|lam the nao|o dau|cho nao|cach|huong dan|chi (minh|toi|em|tao|giup)|bang cach nao|duoc khong|dc khong|kieu gi|nhu nao|ra sao)";
  const TROCHUYEN = [
    { id:"hoi_hanmuc", ten:"Hỏi hạn mức hiện tại", uu_tien:"truoc",
      khop:[" han muc (cua (minh|toi|em) )?(la |hien tai |bay gio )?(bao nhieu|bn|may|the nao|ra sao) ", "^ (moi ngay|mot ngay) (duoc )?(tieu|chi) (bao nhieu|bn) "],
      vi_du:["hạn mức là bao nhiêu", "mỗi ngày được tiêu bao nhiêu"],
      tra_loi:["Hạn mức hiện tại là <b>{han_muc}</b> mỗi ngày. Đổi ở <b>Cài đặt → Hạn mức chi một ngày</b>."],
      goi_y:["hôm nay còn bao nhiêu?"] },
    /* ---- hỏi cách dùng app ---- */
    { id:"hd_vay", ten:"Theo dõi vay mượn", uu_tien:"truoc",
      khop:[HOW + ".*(ghi|theo doi|quan ly) .*(vay|no|cho muon) ", " (ghi|theo doi|quan ly) .*(vay|no|cho muon) .*" + HOW, " (khoan vay|so no) .*" + HOW],
      vi_du:["ghi khoản vay thế nào", "theo dõi nợ ở đâu"],
      tra_loi:["Nhắn thẳng là được:\n• <b>cho chú Dũng vay 500k</b> / <b>vay anh Tuấn 3 triệu</b>\n• <b>Hào trả 200k</b> / <b>trả nợ anh Tuấn 1tr</b>\nTab <b>Khoản vay</b> gom theo từng người, còn nợ bao nhiêu và quá hạn. Hỏi nhanh: <b>ai còn nợ mình?</b>"],
      goi_y:["ai còn nợ mình?"] },
    { id:"hd_ghi", ten:"Cách ghi chi tiêu", uu_tien:"truoc",
      khop:[HOW + ".*(ghi|nhap|them|ke) .*(khoan|chi|tieu|thu|giao dich)", "(ghi|nhap|them) .*(khoan|chi tieu|giao dich) .*" + HOW],
      vi_du:["ghi chi tiêu thế nào", "cách nhập khoản chi", "lam sao them giao dich"],
      tra_loi:["Bạn cứ nhắn như kể chuyện, có số tiền là được:\n• <b>trưa ăn phở 45k</b>\n• <b>grab 28k, trà sữa 35k</b> (nhiều khoản một lần)\n• <b>hôm qua đổ xăng 70k</b> (ghi bù ngày trước)\n• <b>quẹt thẻ VIB 1tr2 mua giày</b>\nMình hiện thẻ xác nhận, kiểm tra rồi bấm <b>Ghi</b>. Muốn nhập tay thì vào tab <b>Sổ → Ghi chi</b>."],
      goi_y:["trưa ăn phở 45k"] },
    { id:"hd_sua", ten:"Cách sửa, xoá khoản", uu_tien:"truoc",
      khop:[HOW + ".*(sua|xoa|chinh|doi|huy) .*(khoan|giao dich|cai|so tien|noi dung|ngay)", "(sua|xoa|chinh|huy) .*(khoan|giao dich) .*" + HOW, " (ghi|nhap) (nham|sai|lon) .*" + HOW],
      vi_du:["sửa khoản đã ghi thế nào", "làm sao xoá giao dịch", "ghi nhầm rồi làm sao"],
      tra_loi:["Vào tab <b>Sổ</b>, chạm vào khoản muốn sửa để đổi số tiền, nội dung, ngày, nhóm; muốn xoá thì bấm dấu <b>✕</b> ở cuối dòng. Khoản vừa bấm Ghi trong Chat thì bấm <b>Hoàn tác</b> ngay trên thẻ đó.\nThẻ chưa ghi thì bạn sửa thẳng trên thẻ rồi mới bấm Ghi."] },
    { id:"hd_hanmuc", ten:"Hạn mức mỗi ngày", uu_tien:"truoc",
      khop:[" han muc ", " (doi|dat|chinh|sua|tang|giam) .*(50k|muc chi|ngan sach) .*(ngay|moi ngay)"],
      vi_du:["đổi hạn mức ở đâu", "hạn mức là gì", "tăng hạn mức lên 80k thế nào"],
      tra_loi:["Hạn mức là số tiền bạn tự đặt cho mỗi ngày; Chat và tab Sổ báo hôm nay còn tiêu được bao nhiêu theo số này. Đổi ở <b>Cài đặt (⚙︎) → Hạn mức chi một ngày</b>. Quẹt thẻ tín dụng không tính vào hạn mức."],
      goi_y:["hôm nay còn bao nhiêu?"] },
    { id:"hd_anh", ten:"Đọc ảnh, thông báo ngân hàng", uu_tien:"truoc",
      khop:[" (doc|chup|gui|nhap) .*(anh|hinh|man hinh|thong bao|sao ke|tin nhan ngan hang) ", " (anh|thong bao ngan hang) .*" + HOW],
      vi_du:["gửi ảnh chụp thông báo được không", "đọc sao kê thế nào"],
      tra_loi:["Bấm nút ảnh cạnh ô nhập Chat, chọn ảnh chụp màn hình thông báo ngân hàng (tối đa 4 ảnh). Mình đọc chữ ngay trên máy, tách từng giao dịch và gán đúng thẻ theo 6 số đầu / 4 số cuối; bạn tick khoản đúng rồi Ghi. Ở tab <b>Sổ → Ghi chi → Từ ảnh</b> còn dán được chữ thông báo."] },
    { id:"hd_the", ten:"Thẻ tín dụng", uu_tien:"truoc",
      khop:[" (them|tao|khai|cai|nhap|xoa|sua|doi ten) (the|the tin dung) ", " (ngay )?sao ke ", " the tin dung .*" + HOW],
      vi_du:["thêm thẻ tín dụng ở đâu", "ngày sao kê là gì", "xoá thẻ VIB thế nào"],
      tra_loi:["Thêm thẻ ở tab <b>Ví → Thêm ví → Thẻ tín dụng</b>, khai tên thẻ, 6 số đầu / 4 số cuối (để đọc thông báo ngân hàng) và ngày sao kê. Sửa hoặc xoá: mở thẻ trong tab Ví → <b>Sửa thẻ</b>.\nQuẹt thẻ không trừ ví và không tính vào hạn mức; khi thanh toán thẻ thì nhắn <b>trả thẻ 3 triệu</b>."] },
    { id:"hd_vi", ten:"Ví điện tử, nhiều tài khoản", uu_tien:"truoc",
      khop:[" (them|tao) (vi|tai khoan) ", " (momo|zalopay|vi dien tu|vnpay|shopeepay) .*" + HOW, " nhieu (vi|tai khoan) "],
      vi_du:["thêm ví momo thế nào", "có dùng được nhiều tài khoản không", "tạo ví mới"],
      tra_loi:["Tab <b>Ví → Thêm ví</b> để thêm tài khoản ngân hàng khác hoặc ví điện tử (Momo, ZaloPay…). Ví <b>Tài khoản</b> có sẵn đã gồm tài khoản chính và tiền mặt.\nSau đó nhắn được kiểu <b>cafe 30k momo</b>, <b>nạp momo 500k</b>, <b>momo còn 350k</b>."] },
    { id:"hd_saoluu", ten:"Sao lưu, chuyển máy", uu_tien:"truoc",
      khop:[" (sao luu|backup|dong bo|xuat file|nhap file|khoi phuc) ", " (chuyen|doi|sang) (may|dien thoai|iphone|may moi) ", " mat (het )?du lieu ", " (xoa app|go app) "],
      vi_du:["sao lưu thế nào", "đổi điện thoại thì sao", "xoá app có mất dữ liệu không"],
      tra_loi:["Dữ liệu chỉ nằm trên máy này, xoá app là mất. Vào <b>Cài đặt → Sao lưu và đồng bộ → Xuất file</b> để lưu một file sao lưu (nên bật mật khẩu file). Sang máy mới: mở app, vào cùng chỗ đó chọn <b>Nhập từ file</b>, chọn Gộp hoặc Thay toàn bộ; xem trước được và Hoàn tác được."] },
    { id:"hd_khoa", ten:"Khoá app, mã PIN, Face ID", uu_tien:"truoc",
      khop:[" (ma pin|pin|face id|faceid|khoa app|mat khau app|mat khau mo app|van tay) "],
      vi_du:["đặt mã pin thế nào", "bật face id", "quên mã pin thì sao"],
      tra_loi:["Vào <b>Cài đặt → Khoá app</b> để bật mã PIN, rồi bật thêm Face ID nếu máy hỗ trợ. Khi khoá, dữ liệu trên máy được mã hoá.\nMã PIN không lưu ở đâu cả, quên là không mở được dữ liệu, nên nhớ xuất file sao lưu trước khi bật."] },
    { id:"hd_ai", ten:"Trợ lý AI", uu_tien:"truoc",
      khop:[" (tro ly ai|khoa api|api key|api|chatgpt|gemini|claude|openai) ", " (bat|dung|cai|tat) ai "],
      vi_du:["bật trợ lý AI thế nào", "khoá api lấy ở đâu", "có dùng chatgpt được không"],
      tra_loi:["Không cần AI vẫn dùng được: mình hiểu câu ngay trên máy. Muốn hiểu cả câu khó (chia tiền, sửa khoản, ảnh chụp) thì vào <b>Cài đặt → Trợ lý AI</b>, dán khoá API của Claude, ChatGPT hoặc Gemini và bật <b>Dùng AI khi trò chuyện</b>. Khoá chỉ nằm trên máy bạn; câu nào máy tự hiểu chắc chắn thì không gọi AI cho đỡ tốn."] },
    { id:"hd_riengtu", ten:"Dữ liệu, riêng tư", uu_tien:"truoc",
      khop:[" du lieu .*(o dau|luu|an toan|gui|lo|ai xem|bi doc) ", " (gui|lo|ban|chia se|day) .*du lieu ", " (bao mat|rieng tu|an toan khong|co bi lo) "],
      vi_du:["dữ liệu lưu ở đâu", "có an toàn không", "app có gửi dữ liệu đi không"],
      tra_loi:["Mọi khoản bạn ghi chỉ nằm trên máy này: không tài khoản, không máy chủ, không gửi đi đâu. Chỉ khi bật Trợ lý AI thì câu bạn nhắn (không kèm sổ sách) mới được gửi tới hãng AI bạn chọn để hiểu câu. Bật <b>Cài đặt → Khoá app</b> để mã hoá dữ liệu bằng mã PIN."] },
    { id:"hd_tag", ten:"Nhóm chi (tag)", uu_tien:"truoc",
      khop:[" (them|tao|doi|sua|xoa|doi ten) (tag|nhom|danh muc|loai chi) ", " (tag|nhom|danh muc) .*" + HOW],
      vi_du:["thêm tag mới thế nào", "đổi nhóm của khoản chi", "tạo danh mục"],
      tra_loi:["Thêm, đổi tên, xoá nhóm ở <b>Cài đặt → Quản lý tag</b>. Đổi nhóm của một khoản: chạm vào khoản đó trong <b>Sổ</b> rồi chọn nhóm khác; với thẻ chưa ghi trong Chat thì chạm vào nhóm trên thẻ. Mình nhớ nhóm bạn chọn cho từng nội dung để lần sau đoán đúng."] },
    { id:"hd_dinhky", ten:"Khoản định kỳ", uu_tien:"truoc",
      khop:[" (dinh ky|tu (dong )?ghi|lap lai) "],
      vi_du:["tiền nhà hàng tháng có tự ghi được không", "khoản định kỳ là gì"],
      tra_loi:["Khoản lặp lại (tiền nhà, mạng, học phí…) đặt ở <b>Cài đặt → Khoản định kỳ</b>: chọn số tiền, ngày trong tháng, ví hoặc thẻ; tới ngày app tự ghi."] },
    { id:"hd_giaodien", ten:"Giao diện, màn mở đầu", uu_tien:"truoc",
      khop:[" (giao dien|che do toi|dark mode|nen toi|mau nen|pastel|man hinh mo dau|mo app vao) "],
      vi_du:["đổi sang nền tối", "mở app vào thẳng ví được không"],
      tra_loi:["<b>Cài đặt → Giao diện</b>: tự động, sáng, tối, pastel. <b>Cài đặt → Màn hình mở đầu</b>: mở app vào Chat hay Ví."] },
    { id:"hd_cai", ten:"Cài app, dùng khi mất mạng", uu_tien:"truoc",
      khop:[" (cai (app|ung dung|len)|man hinh chinh|offline|khong co mang|mat mang|cap nhat (app|ban moi)|ban moi) "],
      vi_du:["cài app lên màn hình chính", "không có mạng dùng được không", "cập nhật bản mới thế nào"],
      tra_loi:["iPhone: mở bằng Safari → nút chia sẻ → <b>Thêm vào Màn hình chính</b>. Android: Chrome → menu → <b>Cài đặt ứng dụng</b>. Cài rồi thì mất mạng vẫn dùng bình thường (trừ Trợ lý AI). Có bản mới thì tắt hẳn app rồi mở lại."] },

    /* ---- v122: tình huống thêm ---- */
    { id:"rut_tien", ten:"Rút tiền mặt", uu_tien:"truoc", de_khoan:true,
      khop:["^ (vua |da |moi )?rut (tien|tien mat|atm|tien atm|tien o atm|tien tu atm|tien tai khoan)( | # )", "^ (vua |da |moi )?rut # (tien mat|tien|o atm|atm)"],
      vi_du:["rút tiền mặt 2tr", "rút atm 500k", "vừa rút tiền 1 triệu"],
      tra_loi:["Rút tiền mặt không phải chi tiêu nên mình không ghi 🙂 Ví <b>Tài khoản</b> đã gồm cả tiền mặt, số dư không đổi. Khi tiêu khoản tiền mặt đó thì kể như thường, ví dụ <i>tiền mặt mua rau 30k</i>. Nếu bạn để tiền mặt ở một ví riêng thì nhắn <i>chuyển 2tr sang (tên ví)</i>."] },
    { id:"hoi_ngay", ten:"Hỏi hôm nay ngày mấy", uu_tien:"truoc",
      khop:["^ (hom nay|hnay|nay) (la )?(ngay|thu) (may|bao nhieu|gi) ", "^ (bay gio|gio) (la )?may gio "],
      vi_du:["hôm nay ngày mấy", "hôm nay thứ mấy", "bây giờ mấy giờ"],
      tra_loi:["Hôm nay là {hom_nay} 📅"] },
    { id:"loi_app", ten:"Báo lỗi app", uu_tien:"truoc",
      khop:[" (app|ung dung) .*(loi|bi loi|treo|do|khong chay|khong mo|dung|bug|cham|lag) ", "^ (bi loi|loi roi|bug|lag qua|treo roi) "],
      vi_du:["app bị lỗi", "ứng dụng không mở được", "lag quá"],
      tra_loi:["Tiếc quá 😥 Bạn thử tắt hẳn app (vuốt lên khỏi đa nhiệm) rồi mở lại. Vẫn lỗi thì vào <b>Cài đặt → Dung lượng → Nhật ký lỗi</b>, chụp màn hình gửi người làm app. Dữ liệu vẫn nằm trên máy, nhớ <b>Cài đặt → Sao lưu và đồng bộ → Xuất file</b> cho chắc."] },
    { id:"xoa_het", ten:"Muốn xoá hết dữ liệu", uu_tien:"truoc",
      khop:[" (xoa het|xoa sach|xoa toan bo|reset|lam lai tu dau) "],
      vi_du:["xoá hết dữ liệu", "reset app", "làm lại từ đầu"],
      tra_loi:["Xoá toàn bộ nằm ở <b>Cài đặt → Sao lưu và đồng bộ</b> (cuối trang), cần bấm xác nhận. Xoá rồi không lấy lại được, nên <b>Xuất file</b> sao lưu trước nhé."] },
    { id:"nhac_ghi", ten:"Nhờ nhắc ghi chi tiêu", uu_tien:"truoc",
      khop:[" (nhac|bao) (minh|toi|em)? ?(ghi|nhap|ke) ", " (dat|cai) (loi )?nhac "],
      vi_du:["nhắc mình ghi chi tiêu mỗi tối", "đặt lời nhắc"],
      tra_loi:["App chạy trên trình duyệt nên chưa tự gửi thông báo được. Mẹo: trên iPhone vào <b>Phím tắt → Tự động hoá → Thời gian trong ngày</b> (vd 21:00), thêm tác vụ <b>Mở ứng dụng → Tiêu Gọn</b>; hoặc đặt lời nhắc trong app Lời nhắc lặp lại mỗi ngày."] },
    { id:"tam_su", ten:"Tâm sự chuyện tiền", uu_tien:"truoc", ai:true,
      khop:[" (ap luc|stress|cang thang|so|lo lang|lo) .*(tien|no|cuoi thang|luong) ", " (khong du song|khong du tieu|thieu tien|vay no nhieu) "],
      vi_du:["dạo này áp lực tiền bạc quá", "lương không đủ tiêu"],
      tra_loi:["Mình hiểu, chuyện tiền bạc dễ làm mình mệt lắm 🫂 Mình cùng nhìn rõ trước đã: nhắn <b>tháng này tiêu gì</b> để xem tiền đi đâu, <b>ai còn nợ mình</b> / <b>mình còn nợ ai</b> để nắm khoản vay. Biết rõ con số thường giúp nhẹ lòng hơn. Nếu áp lực quá, chia sẻ với người thân tin cậy cũng là một cách tốt."],
      goi_y:["tháng này tiêu gì", "mình còn nợ ai"] },

    /* ---- câu rõ nghĩa, ưu tiên trước câu hỏi số liệu ---- */
    { id:"ban_la_ai", ten:"Hỏi bạn là ai", uu_tien:"truoc",
      khop:["^ (ban|may|em|bot) (la ai|ten gi|la gi|la cai gi) ", " ten (ban|cua ban) la gi ", "^ ai (day|vay|the) "],
      vi_du:["bạn là ai", "bạn tên gì", "may la ai"],
      tra_loi:["Mình là trợ lý ghi chép của Tiêu Gọn 🐷 Bạn kể chi tiêu, mình ghi vào sổ; bạn hỏi tiêu bao nhiêu, mình tính ngay trên máy cho bạn."] },
    { id:"lam_duoc_gi", ten:"Hỏi làm được gì", uu_tien:"truoc",
      khop:[" (lam|giup|biet) (duoc )?(gi|nhung gi|cai gi) ", "^ (help|tro giup|huong dan|giup minh|giup voi|menu) $", " (dung|xai) (app|cai nay) (sao|the nao|nhu nao) "],
      vi_du:["bạn làm được gì", "help", "hướng dẫn", "dùng app thế nào"],
      tra_loi:["Mình làm được mấy việc này:\n• <b>Ghi chi tiêu</b> bằng lời: <i>trưa ăn phở 45k</i>, <i>grab 28k, trà sữa 35k</i>\n• <b>Quẹt thẻ, trả thẻ</b>: <i>quẹt thẻ VIB 1tr2</i>, <i>trả thẻ 3 triệu</i>\n• <b>Thu nhập, vay mượn</b>: <i>nhận lương 15tr</i>, <i>cho Nam vay 500k</i>\n• <b>Hỏi số liệu</b>: <i>hôm nay tiêu bao nhiêu</i>, <i>tháng này tiêu gì</i>, <i>5 khoản lớn nhất</i>, <i>ai còn nợ mình</i>\n• <b>Đọc ảnh</b> thông báo ngân hàng\nHỏi cách dùng cũng được, ví dụ <i>sao lưu thế nào</i>."],
      goi_y:["hôm nay tiêu bao nhiêu", "tháng này tiêu gì"] },
    { id:"cam_on", nhuong_hoi:true, ten:"Cảm ơn, đồng ý", uu_tien:"truoc",
      khop:["^ (cam on|cam ơn|cmon|thanks|thank|tks|thx|ty) ", "^ (ok|oke|okay|okie|uh|uk|u|da|vang|duoc roi|dc roi|tot|on roi|hay|chuan|dung roi) $"],
      vi_du:["cảm ơn", "thanks bạn", "ok", "được rồi"],
      tra_loi:["Có gì cứ nhắn mình nhé 💪", "Không có gì, cần gì cứ gọi mình 😊", "Ok bạn, mình ở đây nha."] },
    { id:"chao", nhuong_hoi:true, ten:"Chào hỏi", uu_tien:"truoc",
      khop:["^ (chao|xin chao|hi|hello|helo|alo|hey|yo|chao ban|chao em|e oi|ban oi|oi) ", "^ (chao buoi )?(sang|trua|chieu|toi) (vui|tot lanh) "],
      vi_du:["chào bạn", "hello", "alo", "chào buổi sáng"],
      tra_loi:["{chao} 😊 Hôm nay bạn tiêu gì rồi, kể mình nghe với.", "{chao}! Có khoản nào cần ghi không?"] },
    { id:"tam_biet", nhuong_hoi:true, ten:"Tạm biệt", uu_tien:"truoc",
      khop:["^ (bye|bai|tam biet|pp|di ngu|ngu ngon|good night|gn|hen gap lai) "],
      vi_du:["bye", "ngủ ngon nha", "tạm biệt"],
      tra_loi:["Tạm biệt bạn, mai nhớ kể mình nghe chi tiêu nhé 👋", "Ngủ ngon nha 🌙"] },
    { id:"khen", nhuong_hoi:true, ten:"Khen", uu_tien:"truoc",
      khop:["^ (gioi|hay|tuyet|xuat sac|good|nice|qua da|dinh|pro|10 diem|thong minh)( qua| that| ghe| the| lam)? ", " (ban|em|app) (gioi|hay|tuyet|thong minh|xin|dinh)( qua| that| ghe| lam)? "],
      vi_du:["giỏi quá", "app hay thật", "bạn thông minh ghê"],
      tra_loi:["Hihi cảm ơn bạn 🥰 Ghi đều tay là mình tính càng chuẩn đó."] },
    { id:"che_sai", nhuong_hoi:true, ten:"Báo máy hiểu sai", uu_tien:"truoc",
      khop:["^ (sai|sai roi|nham|nham roi|khong dung|ko dung|k dung|hieu sai|hieu nham|khong phai|ko phai|ngu|do ngu|toi qua) ", " (sai roi|hieu sai|hieu nham|ghi sai|nhan sai) "],
      vi_du:["sai rồi", "hiểu nhầm rồi", "không phải"],
      tra_loi:["Xin lỗi bạn 🙏 Bạn chạm vào thẻ để sửa số tiền, nội dung, ngày hay nhóm rồi mới bấm Ghi. Nếu lỡ Ghi rồi thì bấm <b>Hoàn tác</b> trên thẻ. Có Trợ lý AI thì bấm <b>Phân tích lại bằng AI</b>, hoặc nhắn lại câu rõ hơn, ví dụ <i>quẹt thẻ VIB 500k mua áo</i>."] },

    /* ---- cảm xúc, tâm sự (chỉ khi không có khoản nào) ---- */
    { id:"het_tien", ten:"Than hết tiền, tiêu nhiều", uu_tien:"truoc",
      khop:[" (het tien|chay tui|vo ngan sach|vuot han muc|tieu nhieu qua|tieu qua tay|tieu lo tay|ngheo|khong con tien|can tien|cuoi thang roi|toang|xot) ", " (buon|chan|met|lo) (qua|ghe|that) "],
      vi_du:["hết tiền rồi", "tháng này cháy túi", "tiêu nhiều quá buồn ghê"],
      tra_loi:["Thương bạn 🫂 Mình xem cùng nhé: nhắn <b>tháng này tiêu gì</b> để biết tiền đi đâu nhiều nhất, hoặc <b>so với tháng trước</b> để thấy nhóm nào tăng. Từ giờ tới cuối tháng thử giữ đúng hạn mức mỗi ngày, mình báo còn bao nhiêu cho bạn."],
      goi_y:["tháng này tiêu gì", "tháng này so với tháng trước"] },
    { id:"vui", ten:"Khoe tiết kiệm", uu_tien:"truoc", khong_hoi:true,
      khop:[" (tiet kiem duoc|khong tieu gi|chua tieu gi|khong tieu dong nao|du tien|con du|duoi han muc|giu duoc) "],
      vi_du:["hôm nay không tiêu gì", "tuần này tiết kiệm được"],
      tra_loi:["Tuyệt vời 🎉 Giữ phong độ nhé! Muốn xem còn bao nhiêu thì hỏi <b>hôm nay còn bao nhiêu?</b>"],
      goi_y:["hôm nay còn bao nhiêu?"] },
    { id:"loi_khuyen", nhuong_hoi:true, ten:"Xin lời khuyên tiết kiệm", uu_tien:"truoc", ai:true,
      khop:[" (lam sao|cach|meo|bi quyet|lam the nao) .*(tiet kiem|bot tieu|giam chi|de danh|du tien|khong vuot) ", " (co nen|nen) (mua|chi|tieu|vay|tra gop|dau tu) ", " (tu van|goi y|loi khuyen) "],
      vi_du:["có nên mua iphone không", "tư vấn giúp mình"],
      tra_loi:["Mình không xem được hết hoàn cảnh của bạn, nhưng vài mẹo hay dùng:\n• Ghi đủ mọi khoản trong 2–3 tuần để thấy tiền đi đâu (<b>tháng này tiêu gì</b>)\n• Đặt hạn mức ngày vừa sức và cố giữ, hôm nào dư thì để dành\n• Món lớn: chờ 2–3 ngày rồi mới mua, so với số dư và nợ thẻ\n• Trả thẻ đủ trước hạn để khỏi mất lãi\nBật Trợ lý AI (Cài đặt) nếu muốn bàn kỹ hơn."],
      goi_y:["tháng này tiêu gì"] },

    /* ---- thiếu số tiền: kể chi tiêu nhưng chưa có số ---- */
    { id:"thieu_tien", ten:"Kể chi tiêu mà thiếu số tiền", uu_tien:"sau",
      khop:[],                                                       /* tự nhận: câu có từ chi tiêu/nhóm chi nhưng không có số tiền */
      vi_du:["ăn phở", "vừa đổ xăng", "mua giày"],
      tra_loi:["<b>{noi_dung}</b> hết bao nhiêu vậy bạn? Gõ kèm số tiền, ví dụ <i>{vi_du}</i>."] }
  ];
  const SPEND = /^ (an|uong|mua|do|nap|tra|dong|nop|di|goi|dat|thue|sua|cat|xem|choi|gui|chuyen|tang|mung|bieu|vua|moi|hom nay|sang|trua|chieu|toi) /;

  /* ======================= máy dùng ======================= */
  const strip = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  const nrm = s => " " + strip(s).toLowerCase().replace(/[?!.,:;…"“”'()]/g, " ").replace(/\s+/g, " ").trim() + " ";
  const RX = new Map();
  TROCHUYEN.forEach(t => RX.set(t.id, t.khop.map(k => new RegExp(k))));
  const pick = (arr, text) => { let h = 0; for(const c of String(text)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return arr[(h + new Date().getMinutes()) % arr.length]; };
  const greetOf = d => { const h = d.getHours(); return h < 11 ? "Chào buổi sáng" : h < 14 ? "Chào buổi trưa" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối"; };
  const SHORT = 9;                                                   /* câu trò chuyện thường ngắn; câu dài hơn để bộ hiểu câu / AI lo */

  /* match(text) → kiểu câu TROCHUYEN khớp đầu tiên (không tính thieu_tien), hoặc null */
  function match(text){
    /* bỏ từ đệm cuối câu ("ok ạ", "help nhé") để các mẫu khớp trọn câu vẫn nhận ra */
    const n = nrm(text).replace(/( (a|ah|nhe|nha|nhi|oi|ha|day|ne|nhá|đi|di|voi|giup|với|nhe ban|ban oi|nha ban))+ $/, " "), words = n.trim().split(" ").length;
    for(const t of TROCHUYEN){
      if(!t.khop.length) continue;
      if(t.id.indexOf("hd_") !== 0 && words > SHORT) continue;
      if(t.khong_hoi && /\?\s*$/.test(text)) continue;
      if(RX.get(t.id).some(r => r.test(n))) return t;
    }
    return null;
  }

  /* talk(text, res, info) → { id, html, goi_y, ai } hoặc null
     res: kết quả parse-vi.js của câu đó; info: { now:Date, hasAI:bool, guessTag:fn }
     - kiểu "truoc" (hỏi cách dùng app, chào, cảm ơn…) trả lời khi không có khoản nào; riêng hd_* có từ hỏi cách làm
       thì trả lời cả khi máy lỡ đọc ra khoản ("làm sao đổi hạn mức thành 80k").
     - kiểu "sau" chỉ khi không có khoản và không phải câu hỏi số liệu.
     - thiếu số tiền: câu ngắn kể chi tiêu, không có số → hỏi lại số tiền. */
  function talk(text, res, info){
    info = info || {}; res = res || { items:[], query:null };
    const now = info.now || new Date(), n = nrm(text);
    const items = (res.items || []).length, q = res.query, realQ = q && q.q !== "unknown";
    const t = match(text);
    const howTo = new RegExp(HOW).test(n);
    let use = null;
    if(t && t.nhuong_hoi && realQ && q.q !== "spent") return null;     /* v123: "sai rồi, ý tôi là …", "cảm ơn, tháng này tiêu gì" → trả lời câu hỏi */
    if(t && t.uu_tien === "truoc" && (!items || t.de_khoan || (t.id.indexOf("hd_") === 0 && howTo))) use = t;
    else if(t && t.uu_tien === "sau" && !items && !realQ) use = t;
    if(use){
      if(use.ai && info.hasAI) return { id:use.id, ai:true, html:"", goi_y:[] };
      const WD = ["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"];
      const html = pick(use.tra_loi, text).replace("{chao}", greetOf(now))
        .replace("{hom_nay}", WD[now.getDay()] + ", " + now.getDate() + "/" + (now.getMonth() + 1) + "/" + now.getFullYear() + ", " + String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0"))
        .replace("{han_muc}", info.budget ? Number(info.budget).toLocaleString("vi-VN") + "đ" : "chưa đặt");
      return { id:use.id, html, goi_y:(use.goi_y || []).slice(), ai:false };
    }
    /* thiếu số tiền */
    if(!items && !realQ && !/\d/.test(text) && n.trim().split(" ").length <= 6){
      const gt = info.guessTag ? info.guessTag(text) : "khac";
      if(gt !== "khac" || SPEND.test(n)){
        const tt = TROCHUYEN.find(x => x.id === "thieu_tien");
        let nd = String(text).trim().replace(/[?!.]+$/, ""); nd = nd.charAt(0).toUpperCase() + nd.slice(1);
        const vd = nd.toLowerCase() + " " + (gt === "nha" ? "4tr" : gt === "uong" ? "30k" : gt === "muasam" ? "250k" : "45k");
        const esc = s => s.replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
        return { id:"thieu_tien", html:tt.tra_loi[0].replace("{noi_dung}", esc(nd)).replace("{vi_du}", esc(vd)), goi_y:[], ai:false };
      }
    }
    return null;
  }

  /* câu mẫu cho Trợ lý AI: mỗi kiểu câu GHI/HOI lấy vài câu, kèm kết quả mong đợi viết gọn */
  function brief(w){
    const one = x => Object.entries(x).map(([k, v]) => {
      if(k === "date") return "date:" + (v === 0 ? "hôm nay" : v === -1 ? "hôm qua" : v + " ngày");
      if(k === "card") return "cardId:<thẻ " + (v === "c1" ? "VIB" : "TPBank") + ">";
      if(k === "loan") return "loanId:<khoản vay khớp tên>";
      if(k === "w") return "wallet:<ví Momo>";
      if(k === "from" || k === "to") return k + ":" + (v === "main" ? "main" : "<ví Momo>");
      if(k === "kind_q") return "kind:" + v;
      if(k === "note") return null;
      return k + ":" + (typeof v === "string" ? v : JSON.stringify(v));
    }).filter(Boolean).join(", ");
    return Array.isArray(w) ? "items [" + w.map(x => "{" + one(x) + "}").join(", ") + "]" : w.q ? "query {" + one(w) + "}" : "items [{" + one(w) + "}]";
  }
  function fewShot(per){
    per = per || 2; const out = [];
    GHI.concat(HOI).forEach(g => g.mau.slice(0, per).forEach(([s, w]) => out.push("\"" + s.replace(/\n/g, " / ") + "\" → " + brief(w))));
    NOI[0].mau.slice(0, 3).forEach(([a, b, w]) => out.push("(trước: \"" + a + "\") \"" + b + "\" → " + brief(w)));
    out.push("\"chào bạn\", \"cảm ơn\", \"bạn làm được gì\", \"sao lưu thế nào\" → items rỗng, query null, reply trả lời ngắn");
    out.push("\"ăn phở\" (thiếu số tiền) → items rỗng, reply hỏi lại số tiền");
    return out;
  }

  /* ======================= E. THƯ VIỆN RIÊNG: HỌC TỪ NGƯỜI DÙNG (v119) =======================
     Mỗi lần bạn sửa thẻ xác nhận rồi bấm Ghi, hoặc ghi kết quả do AI hiểu, app lưu một "câu đã học":
       { id, key, text, amts, items:[…], query, src:"sua"|"ai", t, used, hits }
     key là "khuôn câu": bỏ dấu, chữ thường, số tiền thay bằng #, bỏ từ đệm (nhé, nha, ạ…).
     Lần sau gõ câu cùng khuôn ("thẻ trả ăn trưa 1 triệu" → "thẻ trả ăn trưa 850k"), máy dùng lại đúng cách hiểu đó
     với số tiền mới, không cần AI. Câu đã học nằm trong dữ liệu chính (state.learn) nên đi theo file sao lưu.
     Câu máy chưa hiểu (phải nhờ AI, hoặc bạn bấm "Phân tích lại bằng AI") nằm ở state.miss: { id, key, text, why, n, t }. */
  const FILL_W = new Set(["nhe","nha","a","ah","nhi","thoi","nhá","ha","day","do","oi","nhe!","di_"]);
  const DAY = 86400000;
  const dayKey = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const dayDiff = (a, b) => Math.round((new Date(a + "T12:00:00") - new Date(b + "T12:00:00")) / DAY);
  /* khuôn câu và các số tiền trong câu, theo đúng thứ tự */
  function khuon(text, P){
    const { N } = P._tokenize(String(text || "").replace(/\n+/g, " , "));
    const w = [], amts = [];
    for(let i = 0; i < N.length; i++){
      const a = P._amountAt(N, i);
      if(a){ w.push("#"); amts.push(a.v); i += a.n - 1; continue; }
      if(!N[i] || FILL_W.has(N[i])) continue;
      w.push(N[i]);
    }
    return { key:w.join(" "), amts };
  }
  const KEEP = ["kind","amt","cat","cardId","loanId","who","w","from","to","src","note"];
  /* tạo một câu đã học từ các khoản bạn đã ghi (hoặc câu hỏi AI đã hiểu) */
  function hocTao(text, items, query, opt){
    opt = opt || {}; const P = opt.P, now = opt.now || new Date(), today = dayKey(now);
    const k = khuon(text, P); if(!k.key) return null;
    const rec = { key:k.key, text:String(text).trim().slice(0, 300), amts:k.amts, src:opt.src || "sua", t:now.getTime(), used:now.getTime(), hits:0 };
    if(query){
      if(query.q === "unknown" || query.period === "custom" && !/\bthang \d/.test(k.key)) return null;   /* "7 ngày qua" tính theo ngày học, dùng lại sẽ sai */
      const q = {}; for(const x in query) if(query[x] !== undefined && query[x] !== null && query[x] !== "") q[x] = query[x];
      rec.query = q; return rec;
    }
    if(!items || !items.length) return null;
    const usedA = new Set();
    rec.items = items.map(it => {
      const o = {}; KEEP.forEach(f => { if(it[f] !== undefined && it[f] !== null && it[f] !== "") o[f] = it[f]; });
      /* số tiền khớp số nào trong câu: lần sau thay bằng số mới ở đúng vị trí đó */
      let ai = -1; for(let j = 0; j < k.amts.length; j++) if(!usedA.has(j) && k.amts[j] === it.amt){ ai = j; break; }
      if(ai >= 0) usedA.add(ai);
      o.ai = ai;
      /* "ăn lẩu 600k chia 4" → 150k; "siêu thị 500k giảm 10%" → 450k: nhớ tỉ lệ so với số tiền lớn nhất trong câu,
         chỉ khi câu có chữ chia/mỗi/giảm/%… và tỉ lệ tròn (1/n, n lần, bội của 5%), để không học nhầm lỗi gõ */
      if(ai < 0 && k.amts.length && it.amt > 0 && /(^| )(chia|moi|giam|%|nhan|x|phan|nua|gap|cong|tru)( |$)/.test(k.key + " " + String(text).replace(/\d+\s*%/g, " % "))){
        const big = k.amts.indexOf(Math.max.apply(null, k.amts)), r = it.amt / k.amts[big];
        const nice = [2,3,4,5,6,7,8,9,10,12,15,20].some(n => Math.abs(r - 1 / n) < 1e-6 || Math.abs(r - n) < 1e-6) || (r > 0 && r < 2 && Math.abs(r * 20 - Math.round(r * 20)) < 1e-6);
        if(nice){ o.aj = big; o.ar = r; }
      }
      if(it.date) o.dd = dayDiff(it.date, today);
      return o;
    });
    return rec;
  }
  /* dùng lại câu đã học cho câu mới cùng khuôn → { items, query } hoặc null */
  function hocDung(rec, text, opt){
    opt = opt || {}; const P = opt.P, now = opt.now || new Date();
    const k = khuon(text, P);
    if(!rec || k.key !== rec.key || k.amts.length !== (rec.amts || []).length) return null;
    if(rec.query) return { items:[], query:Object.assign({}, rec.query) };
    const same = k.amts.join() === rec.amts.join();
    const items = [];
    for(const x of rec.items || []){
      let amt = x.ai >= 0 ? k.amts[x.ai] : same ? x.amt : (x.aj >= 0 && x.ar) ? Math.round(k.amts[x.aj] * x.ar) : null;
      if(!(amt > 0)) return null;                                   /* số tiền bạn tự sửa không suy ra được từ câu mới */
      const it = {}; KEEP.forEach(f => { if(x[f] !== undefined) it[f] = x[f]; });
      it.amt = amt;
      const d = new Date(now); d.setDate(d.getDate() + (x.dd || 0));
      it.date = dayKey(d);
      it.t = x.dd ? new Date(it.date + "T" + String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0") + ":00").getTime() : now.getTime();
      it.who = it.who || ""; it.loanId = it.loanId || null; it.cardId = it.cardId || null; it.note = it.note || "";
      if(!it.src) it.src = "tk";
      items.push(it);
    }
    return items.length ? { items, query:null } : null;
  }
  /* tìm câu đã học hợp với câu mới: cùng khuôn, mới học / hay dùng trước */
  function hocTim(list, text, opt){
    if(!list || !list.length) return null;
    const k = khuon(text, opt.P); if(!k.key) return null;
    const cand = list.filter(r => r && r.key === k.key).sort((a, b) => (b.used || b.t || 0) - (a.used || a.t || 0));
    for(const r of cand){ const out = hocDung(r, text, opt); if(out) return { rec:r, out }; }
    return null;
  }
  /* câu mẫu riêng cho Trợ lý AI (dùng id thật của thẻ, khoản vay, ví) */
  function hocChoAI(list, max){
    return (list || []).slice().sort((a, b) => (b.used || b.t || 0) - (a.used || a.t || 0)).slice(0, max || 25).map(r => {
      if(r.query) return "\"" + r.text + "\" → query " + JSON.stringify(r.query);
      return "\"" + r.text + "\" → items " + JSON.stringify((r.items || []).map(x => { const o = Object.assign({}, x); delete o.ai; delete o.aj; delete o.ar; if(o.dd){ o.date = o.dd === -1 ? "hôm qua" : o.dd + " ngày"; } delete o.dd; return o; }));
    });
  }

  /* ======================= F. NHÁNH HỘI THOẠI (v122) =======================
     Câu trả lời ngắn nối vào tin trước của bot, máy tự xử lý không cần AI:
       đang có thẻ chờ Ghi   → "ok ghi đi" (ghi), "thôi bỏ" (bỏ), "50k chứ" / "nhầm, 54k" (sửa số tiền),
                               "quẹt thẻ" / "thẻ VIB" / "tiền mặt" / "momo" (đổi nguồn tiền), "hôm qua chứ" (đổi ngày),
                               "nhóm uống" / "là ăn uống" (đổi nhóm), "nội dung là …" (đổi nội dung),
                               "chỉ phần mình" / "mình trả hết" (chia tiền), "Nam" (tên người vay khi còn thiếu)
       bot vừa hỏi số tiền   → "45k" ghép với câu trước ("ăn phở" + "45k")
     nhanh(text, dlg, P, ctx) → { act:"save"|"skip"|"set"|"new", idx, f:{…}, say, text } hoặc null
     dlg: { items:[khoản đang chờ, theo thứ tự], idxs:[vị trí trong tin], waitAmt:"câu thiếu số tiền" } */
  const N_SAVE = /^ (ok|oke|okay|okie|uh|uk|u|um|da|vang|duoc|dc|dung|dung roi|dung r|chuan|chuan roi|chinh xac|ghi|ghi di|ghi lai|ghi luon|ghi het|ghi tat ca|ghi giup|ghi nhe|luu|luu di|luu lai|ok ghi|ok ghi di|ok luu|xac nhan|yes|y|co|ok dung roi|dung vay|ok chuan|duyet|chot|chot di) (di |nhe |nha |luon |giup |voi |a |nhe ban |)$/;
  const N_SKIP = /^ (bo|bo di|bo qua|thoi|thoi bo|thoi khoi|khoi|khoi ghi|huy|huy di|khong ghi|ko ghi|k ghi|dung ghi|xoa|xoa di|no|khong|ko|sai het|bo het|thoi khong ghi|khong can|ko can|cancel) (di |nhe |nha |luon |a |)$/;
  const N_FIX = ["nham","nham roi","sua","sua lai","sua thanh","doi","doi thanh","thanh","chu","chu khong phai","khong phai","ko phai","k phai","a","ah","u","uh","dung ra","moi dung","moi dung chu","la","lai","ghi lai","nhe","nha","di","con","ma","ghi","ghi nham","sai","sai roi","cai","khoan","so tien","tien","nhe ban","oi","the","may","ghi sai","ok","oke","vay"];
  const N_FIXW = new Set(N_FIX.join(" ").split(" "));
  function nhanh(text, dlg, P, ctx){
    if(!dlg || !P) return null;
    const n = nrm(text), words = n.trim().split(" ").filter(Boolean);
    const now = (ctx && ctx.now) || new Date();
    /* bot vừa hỏi số tiền cho câu thiếu tiền: "45k", "hết 45k", "45 nghìn" */
    if(dlg.waitAmt && !(dlg.items || []).length){
      const k = khuon(text, P);
      if(k.amts.length && words.length <= 5) return { act:"new", text:dlg.waitAmt + " " + String(text).trim() };
      return null;
    }
    const items = dlg.items || []; if(!items.length || words.length > 9) return null;
    const last = items.length - 1;
    const SAVEW = new Set(["ok","oke","okay","okie","uh","uk","u","um","da","vang","duoc","dc","dung","roi","r","chuan","chinh","xac","ghi","di","lai","luon","het","tat","ca","giup","nhe","nha","luu","nhan","yes","y","co","vay","duyet","chot","a","ban","em","nhe!","the","minh","toi"]);
    const strongSave = words.some(w => ["ok","oke","okay","okie","uh","uk","u","da","vang","dc","duoc","dung","chuan","ghi","luu","yes","chot","duyet"].includes(w));
    if(/(^|\s)đừng(\s|$)/i.test(String(text)) || (N_SKIP.test(n) && !/(^|\s)đúng(\s|$)/i.test(String(text)))) return { act:"skip", say:"" };
    if(N_SAVE.test(n) || (strongSave && words.every(w => SAVEW.has(w)) && !words.some(w => ["khong","ko","k","sai","bo","huy","thoi"].includes(w)))) return { act:"save", say:"" };
    if(N_SKIP.test(n)) return { act:"skip", say:"" };
    /* câu tự nó là một câu hỏi ("hôm qua tiêu gì", "tháng này tiêu bao nhiêu") thì trả lời câu hỏi, không coi là sửa thẻ đang chờ */
    try{ const rq = P.parse(text, ctx); if(rq.query && rq.query.q !== "unknown") return null; }catch(e){}
    const k = khuon(text, P), cards = (ctx && ctx.cards) || [], wallets = (ctx && ctx.wallets) || [];
    const rest = k.key.split(" ").filter(w => w && w !== "#");
    const fixOnly = rest.every(w => N_FIXW.has(w));
    /* chọn khoản đích: nhắc tới nội dung khoản nào thì khoản đó, nói số tiền cũ thì khoản có số đó, không thì khoản cuối */
    const pickIdx = (oldAmt) => {
      if(oldAmt) { const j = items.findIndex(it => it.amt === oldAmt); if(j >= 0) return j; }
      for(let j = items.length - 1; j >= 0; j--){ const nt = nrm(items[j].note || "").trim(); if(nt && nt.split(" ").some(w => w.length >= 2 && rest.includes(w))) return j; }
      return last;
    };
    /* chia tiền */
    const sp = items.findIndex(it => it.split);
    if(sp >= 0){
      if(/ (phan minh|chi phan minh|tinh phan minh|phan cua minh|chi tinh minh|phan toi|chia deu) /.test(n)) return { act:"set", idx:sp, f:{ amt:Math.round(items[sp].total / items[sp].split) }, say:"Ghi phần của bạn." };
      if(/ (minh tra het|toi tra het|tra het|ghi ca|ca bill|tra ca|minh tra ca|ghi het tien|ghi tong|tong bill|tra truoc|minh bao) /.test(n)) return { act:"set", idx:sp, f:{ amt:items[sp].total, split:0 }, say:"Ghi cả " + items[sp].total.toLocaleString("vi-VN") + "đ." };
    }
    /* sửa số tiền: "50k chứ", "nhầm 54k", "không phải 45k mà 54k", "45k thành 54k", hoặc chỉ "50k" */
    if(k.amts.length && words.length <= 9){
      const noteHit = rest.some(w => w.length >= 2 && !N_FIXW.has(w) && items.some(it => nrm(it.note || "").includes(" " + w + " ")));
      const others = rest.filter(w => !N_FIXW.has(w) && !items.some(it => nrm(it.note || "").includes(" " + w + " ")));
      if((fixOnly || (noteHit && !others.length && rest.some(w => ["nham","sua","chu","thanh","phai","dung","lai","moi"].includes(w)))) && k.amts.length <= 2){
        const nv = k.amts[k.amts.length - 1], old = k.amts.length === 2 ? k.amts[0] : 0;
        const idx = pickIdx(old);
        return { act:"set", idx, f:{ amt:nv }, say:"Sửa số tiền thành " + nv.toLocaleString("vi-VN") + "đ." };
      }
      return null;
    }
    if(k.amts.length) return null;
    /* đổi nguồn tiền */
    const card = cards.find(c => { const cn = nrm(c.name).trim(); return cn && (n.includes(" " + cn + " ") || (cn.split(" ")[0].length >= 3 && n.includes(" " + cn.split(" ")[0] + " "))); });
    const cardOnly = rest.every(w => ["quet","the","ca","bang","tin","dung","credit","visa","tra","chu","a","ah","la","nhe","nha","di","doi","sang","dung roi","thanh"].includes(w) || (card && nrm(card.name).includes(" " + w + " ")));
    if((card || / (quet the|ca the|bang the|the tin dung|tra the|the) /.test(n)) && cardOnly && !/ tra the /.test(n.replace(/ tra the (vib|tp|mb)/, ""))){
      const idx = pickIdx(0);
      return { act:"set", idx, f:{ kind:"card", cardId: card ? card.id : (items[idx].cardId || (ctx && ctx.defaultCard) || (cards[0] || {}).id || null) }, say:"Đổi sang quẹt thẻ" + (card ? " " + card.name : "") + "." };
    }
    const wal = wallets.find(w => { const wn = nrm(w.name).trim(); return wn && n.includes(" " + wn + " "); });
    if(wal && rest.length <= 4) return { act:"set", idx:pickIdx(0), f:{ kind:"out", w:wal.id }, say:"Đổi sang ví " + wal.name + "." };
    if(/ (tien mat|tm) /.test(n) && rest.length <= 5) return { act:"set", idx:pickIdx(0), f:{ kind:"out", src:"cash", w:null }, say:"Đổi sang tiền mặt." };
    if(/ (chuyen khoan|ck|tai khoan|tk) /.test(n) && rest.length <= 5) return { act:"set", idx:pickIdx(0), f:{ kind:"out", src:"tk", w:null }, say:"Đổi sang chi tài khoản." };
    /* đổi ngày */
    if(/ (hom qua|hqua|hom kia|hkia|hom nay|hnay|toi qua|sang qua|trua qua|chieu qua|thu (2|3|4|5|6|7|hai|ba|tu|nam|sau|bay)|chu nhat|cn|ngay \d{1,2}|\d{1,2}\/\d{1,2}) /.test(n) && rest.length <= 6){
      let d = null; try{ const r = P.parse(String(text) + " 1000đ", Object.assign({}, ctx, { now })); d = r.items[0] && r.items[0].date; }catch(e){}
      if(d) return { act:"set", idx:pickIdx(0), f:{ date:d }, say:"Đổi ngày." };
    }
    /* đổi loại khoản */
    const KIND = [[/ (khoan thu|thu nhap|tien vao|duoc nhan|la thu) /, "in"], [/ (cho vay|cho muon) /, "lend"], [/ (di vay|vay|muon) /, "borrow"], [/ (tra no) /, "repay"], [/ (tra the|thanh toan the) /, "cardpay"], [/ (chi tieu|khoan chi|la chi) /, "out"]];
    for(const [rx, kd] of KIND) if(rx.test(n) && rest.length <= 4) return { act:"set", idx:pickIdx(0), f:{ kind:kd }, say:"Đổi loại khoản." };
    /* đổi nhóm: "nhóm uống", "là ăn uống", "tag đi lại", "thuộc nhóm xăng" */
    const mg = n.match(/^ (?:doi |chuyen |sua )?(?:sang |thanh |vao )?(?:nhom|tag|loai|danh muc|muc|thuoc nhom|la nhom|la|vao nhom) (.+) $/);
    if(mg){
      const ow = String(text).trim().split(/\s+/), tail = ow.slice(ow.length - mg[1].trim().split(" ").length).join(" ");   /* tên nhóm lấy từ câu gốc (giữ dấu) */
      const tg = (ctx && ctx.guessTag) ? ctx.guessTag(tail) : P.guessTag(tail, ctx);
      if(tg && tg !== "khac") return { act:"set", idx:pickIdx(0), f:{ cat:tg }, say:"Đổi nhóm." };
    }
    /* đổi nội dung */
    const mn = String(text).trim().match(/^(?:nội dung|noi dung|ghi chú|ghi chu|ghi là|ghi la|tên là|ten la|đặt tên|dat ten)\s*(?:là|la|:)?\s+(.+)$/i);
    if(mn) return { act:"set", idx:pickIdx(0), f:{ note:mn[1].charAt(0).toUpperCase() + mn[1].slice(1) }, say:"Đổi nội dung." };
    /* tên người cho khoản vay đang thiếu tên */
    const lw = items.findIndex(it => ["lend","borrow","repay","collect"].includes(it.kind) && !it.loanId && !String(it.who || "").trim());
    if(lw >= 0 && words.length <= 3 && /^[\p{L} ]+$/u.test(String(text).trim())){
      const who = String(text).trim().replace(/^(cho|của|cua|là|la)\s+/i, "");
      return { act:"set", idx:lw, f:{ who:who.charAt(0).toUpperCase() + who.slice(1) }, say:"" };
    }
    return null;
  }

  /* bối cảnh dùng cho bài thử và câu mẫu */
  const MAU_CTX = {
    now: "2026-10-07T14:30:00",                                      /* thứ Tư */
    cards: [{ id:"c1", name:"VIB" }, { id:"c2", name:"TPBank" }],
    loans: [{ id:"l1", type:"lend", who:"Chú Dũng" }, { id:"l2", type:"borrow", who:"Anh Tuấn" }, { id:"l3", type:"lend", who:"Hào" }],
    wallets: [{ id:"w1", name:"Momo" }]
  };

  const api = { GHI, HOI, NOI, TROCHUYEN, MAU_CTX, match, talk, fewShot, nrm, khuon, hocTao, hocDung, hocTim, hocChoAI, nhanh };
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  else root.N50KLib = api;
})(typeof window !== "undefined" ? window : this);
