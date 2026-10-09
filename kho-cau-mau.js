/* Tiêu Gọn – KHO CÂU MẪU (v122): sinh vài nghìn câu tiếng Việt theo đủ kiểu người dùng hay nhắn,
   mỗi câu kèm kết quả mong đợi, để chạy thử bộ hiểu câu (parse-vi.js) và thư viện câu (thu-vien-cau.js).
   Chạy: node tests-kho-cau.js   (in tỉ lệ máy tự hiểu đúng theo từng nhóm, và các câu sai)

   Câu được ghép từ: món/việc chi (kèm nhóm và giá thường gặp) × cách nói số tiền × lúc nào × có dấu / không dấu
   × mẫu câu. Sinh theo hạt giống cố định nên lần nào chạy cũng ra đúng bộ câu đó.
   Kho này không chạy trong app; app dùng thứ máy học được từ nó: từ điển nhóm chi trong parse-vi.js,
   các luật hiểu câu và nhánh hội thoại trong thu-vien-cau.js. */
(function(root){
  "use strict";
  const strip = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

  /* ---------- món / việc chi: [cụm từ, nhóm, giá thấp (nghìn), giá cao (nghìn), cờ] ----------
     cờ "m": gõ không dấu thì nhóm có thể mơ hồ (chè/che, cá/ca…), không chấm nhóm ở bản không dấu */
  const ITEMS = [
    /* ăn */
    ["phở bò","an",35,70],["bún chả","an",35,60],["bún bò huế","an",40,70],["cơm tấm","an",30,60],["cơm văn phòng","an",30,50],
    ["bánh mì","an",15,35],["xôi","an",10,30],["bánh cuốn","an",25,45],["mì quảng","an",35,60],["hủ tiếu","an",30,55],
    ["cháo sườn","an",20,40],["bún riêu","an",30,50],["bún đậu mắm tôm","an",40,80],["lẩu thái","an",250,600],["lẩu bò","an",300,700],
    ["nướng bbq","an",300,900],["buffet","an",250,600],["kfc","an",60,200],["lotteria","an",60,180],["jollibee","an",50,150],
    ["pizza","an",150,400],["sushi","an",150,500],["gà rán","an",50,150],["cơm gà","an",35,60],["cơm rang","an",30,50],
    ["bánh xèo","an",40,90],["bánh tráng trộn","an",15,35],["ốc","an",80,250],["hải sản","an",300,1200],["nem chua rán","an",20,50],
    ["chè","an",15,40,"m"],["kem","an",10,40,"m"],["bánh kem","an",150,450],["bánh ngọt","an",20,80],["đồ ăn vặt","an",20,80],
    ["grabfood","an",50,200],["shopeefood","an",50,200],["ăn sáng","an",20,50],["ăn trưa","an",30,80],["ăn tối","an",50,200],
    ["ăn khuya","an",30,100],["cơm hộp","an",30,50],["bún cá","an",35,55],["mì cay","an",40,80],["bánh bao","an",10,25],
    ["trứng vịt lộn","an",8,20],["gỏi cuốn","an",20,50],["bò né","an",50,90],["tokbokki","an",40,90],["ramen","an",80,180],
    ["cơm chay","an",30,60],["bít tết","an",150,400],["dimsum","an",100,300],["xiên que","an",20,60],["bánh mì chảo","an",35,60],
    /* uống */
    ["cà phê","uong",20,55],["cafe sữa","uong",20,40],["bạc xỉu","uong",25,45],["trà sữa","uong",30,70],["trà đá","uong",3,10],
    ["sinh tố","uong",25,50],["nước mía","uong",10,20],["nước ép","uong",25,50],["highlands","uong",39,79],["starbucks","uong",60,120],
    ["phúc long","uong",45,80],["katinat","uong",40,75],["trà chanh","uong",15,30],["bia hơi","uong",50,200],["nhậu","uong",200,800],
    ["nước ngọt","uong",10,25],["nước suối","uong",5,15],["trà đào","uong",30,60],["matcha","uong",40,80],["cà phê muối","uong",25,45],
    ["nước dừa","uong",20,40],["sữa đậu nành","uong",10,25],["rượu vang","uong",250,900],["mixue","uong",20,40],["cộng cà phê","uong",40,70],
    /* đi lại, xăng */
    ["grab","dilai",20,120],["grab bike","dilai",15,60],["grab car","dilai",50,250],["xanh sm","dilai",30,200],["taxi","dilai",60,400],
    ["xe ôm","dilai",15,50],["gửi xe","dilai",3,10],["vé xe buýt","dilai",7,15],["vé tàu","dilai",150,900],["xe khách","dilai",150,450],
    ["phí cầu đường","dilai",15,80],["be bike","dilai",15,50],["vé metro","dilai",8,20],["tiền gửi xe tháng","dilai",100,300],["thuê xe máy","dilai",100,250],
    ["đổ xăng","xang",50,120],["xăng","xang",50,100],["đổ dầu","xang",300,800],["sạc xe điện","xang",50,200],["tiền xăng","xang",60,150],
    /* chợ */
    ["đi chợ","cho",80,300],["siêu thị","cho",150,800],["winmart","cho",100,600],["bách hoá xanh","cho",80,400],["rau","cho",10,40],
    ["thịt lợn","cho",60,200],["thịt bò","cho",150,400],["cá","cho",50,200,"m"],["tôm","cho",100,350,"m"],["trứng","cho",25,50],
    ["gạo","cho",100,300],["dầu ăn","cho",40,90],["nước mắm","cho",30,80],["trái cây","cho",50,200],["sữa tươi","cho",30,80],
    ["mì tôm","cho",50,120],["sữa chua","cho",25,60],["hoa quả","cho",50,200],["sầu riêng","cho",150,500],["xoài","cho",40,100],
    /* mua sắm */
    ["shopee","muasam",80,600],["lazada","muasam",80,600],["tiki","muasam",80,500],["tiktok shop","muasam",80,400],["quần áo","muasam",150,800],
    ["áo phông","muasam",100,350],["quần jean","muasam",250,700],["giày thể thao","muasam",500,2500],["dép","muasam",50,250],["túi xách","muasam",300,1500],
    ["balo","muasam",200,800],["đồng hồ","muasam",500,5000],["tai nghe","muasam",200,4000],["sạc dự phòng","muasam",200,600],["ốp lưng","muasam",50,200],
    ["laptop","muasam",12000,30000],["iphone","muasam",15000,35000],["uniqlo","muasam",300,1200],["phí ship","muasam",15,40],["chuột","muasam",150,600,"m"],
    /* nhà, điện nước, điện thoại */
    ["tiền nhà","nha",3000,8000],["tiền trọ","nha",1500,4000],["phí chung cư","nha",300,1200],["nồi cơm điện","nha",500,2000],["quạt","nha",300,1200],
    ["giấy vệ sinh","nha",50,150],["nước giặt","nha",100,250],["giặt là","nha",40,150],["giúp việc","nha",300,1500],["bóng đèn","nha",30,120],
    ["tiền điện","diennuoc",300,1500],["tiền nước","diennuoc",80,300],["tiền ga","diennuoc",350,500],["tiền rác","diennuoc",20,50],["hoá đơn điện","diennuoc",300,1500],
    ["tiền mạng","dienthoai",150,350],["nạp điện thoại","dienthoai",20,200],["cước internet","dienthoai",180,300],["gói data","dienthoai",70,200],["nạp thẻ viettel","dienthoai",50,200],
    ["icloud","dienthoai",19,69],["wifi","dienthoai",150,300],
    /* sức khoẻ, làm đẹp */
    ["mua thuốc","suckhoe",50,400],["khám bệnh","suckhoe",200,1000],["nha khoa","suckhoe",300,3000],["vitamin","suckhoe",150,600],["xét nghiệm","suckhoe",200,1500],
    ["tập gym","suckhoe",300,800],["yoga","suckhoe",400,1200],["đi bơi","suckhoe",30,80],["thuê sân cầu lông","suckhoe",80,200],["khẩu trang","suckhoe",20,60],
    ["cắt tóc","lamdep",50,200],["gội đầu","lamdep",40,120],["làm nail","lamdep",150,500],["spa","lamdep",300,1500],["mỹ phẩm","lamdep",200,1000],
    ["kem chống nắng","lamdep",150,500],["sữa rửa mặt","lamdep",100,350],["nước hoa","lamdep",500,3000],["massage","lamdep",200,600],["dầu gội","lamdep",80,250],
    /* học, giải trí, du lịch */
    ["học phí","hoctap",1000,10000],["khoá học tiếng anh","hoctap",1500,8000],["mua sách","hoctap",80,400],["văn phòng phẩm","hoctap",30,200],["in tài liệu","hoctap",10,80],
    ["gia sư","hoctap",1500,5000],["lệ phí thi ielts","hoctap",4000,5000],
    ["xem phim","giaitri",90,250],["cgv","giaitri",90,250],["netflix","giaitri",70,260],["spotify","giaitri",59,99],["karaoke","giaitri",200,800],
    ["nạp game","giaitri",50,500],["vé concert","giaitri",800,4000],["bowling","giaitri",100,300],["bida","giaitri",60,200],["khu vui chơi","giaitri",150,600],
    ["khách sạn","dulich",500,3000],["homestay","dulich",300,1500],["vé máy bay","dulich",900,5000],["vietjet","dulich",900,3500],["tour","dulich",1000,8000],
    ["agoda","dulich",500,3000],["vé tham quan","dulich",50,500],
    /* con cái, thú cưng, hiếu hỷ, từ thiện, sửa chữa */
    ["bỉm","concai",250,450],["sữa bột","concai",400,900],["đồ chơi","concai",100,600],["học phí mầm non","concai",2000,6000],["đồ cho bé","concai",100,500],
    ["pate cho mèo","thucung",20,80],["hạt cho chó","thucung",150,500],["cát vệ sinh","thucung",80,200],["thú y","thucung",150,800],["tắm chó","thucung",100,300],
    ["mừng cưới","hieuhy",300,2000],["đi đám cưới","hieuhy",500,2000],["quà sinh nhật","hieuhy",200,1000],["phúng viếng","hieuhy",200,1000],["mua hoa","hieuhy",150,500],
    ["biếu bố mẹ","hieuhy",1000,5000],["tân gia","hieuhy",500,2000],["đồ cúng","hieuhy",100,500],
    ["từ thiện","tuthien",100,1000],["công đức","tuthien",50,500],["ủng hộ lũ lụt","tuthien",200,2000],
    ["sửa xe","suachua",50,500],["thay nhớt","suachua",80,200],["rửa xe","suachua",30,80],["vá xe","suachua",20,50],["sửa điện thoại","suachua",200,1500],
    ["thay pin","suachua",300,900],["bảo dưỡng điều hoà","suachua",200,500],["thay lốp","suachua",300,1200],["đăng kiểm","suachua",300,600],["sửa máy giặt","suachua",200,800]
  ];

  /* ---------- câu tự nhiên viết tay (không sinh tự động): kiểu người thật hay nhắn ---------- */
  const TU_NHIEN = [
    ["sáng nay làm ly cafe 25k", { kind:"out", amt:25000, cat:"uong" }],
    ["vừa đi đổ xăng hết 80 nghìn", { kind:"out", amt:80000, cat:"xang" }],
    ["trưa nay ăn cơm bụi 35k thôi", { kind:"out", amt:35000, cat:"an" }],
    ["mới mua bó rau với mớ thịt hết 120k", { kind:"out", amt:120000, cat:"cho" }],
    ["tốn 30k gửi xe ô tô", { kind:"out", amt:30000, cat:"dilai" }],
    ["chiều đi uống trà chanh với tụi bạn 40k", { kind:"out", amt:40000, cat:"uong" }],
    ["tối nay đi nhậu hết 450 nghìn", { kind:"out", amt:450000, cat:"uong" }],
    ["order shopee cái ốp lưng 89k", { kind:"out", amt:89000, cat:"muasam" }],
    ["đặt grab về nhà 52k", { kind:"out", amt:52000, cat:"dilai" }],
    ["đóng tiền học thêm cho con 1tr5", { kind:"out", amt:1500000, cat:"concai" }],
    ["mua thuốc cảm cho mẹ 85k", { kind:"out", amt:85000, cat:"suckhoe" }],
    ["vừa nạp 100k tiền điện thoại", { kind:"out", amt:100000, cat:"dienthoai" }],
    ["thanh toán tiền điện tháng 9 hết 812k", { kind:"out", amt:812000, cat:"diennuoc" }],
    ["trả tiền nhà tháng này 4tr2", { kind:"out", amt:4200000, cat:"nha" }],
    ["đi siêu thị mua đồ dùng hết 650k", { kind:"out", amt:650000, cat:"cho" }],
    ["mua bánh sinh nhật cho bé 320k", { kind:"out", amt:320000 }],
    ["cuối tuần đi xem phim 2 vé 180k", { kind:"out", amt:180000, cat:"giaitri" }],
    ["mừng đám cưới đồng nghiệp 500k", { kind:"out", amt:500000, cat:"hieuhy" }],
    ["gửi tiền về cho bố mẹ 3 triệu", { kind:"out", amt:3000000, cat:"hieuhy" }],
    ["sửa cái xe máy hết 350k", { kind:"out", amt:350000, cat:"suachua" }],
    ["thay nhớt xe 120k", { kind:"out", amt:120000, cat:"suachua" }],
    ["đi khám răng 300k", { kind:"out", amt:300000, cat:"suckhoe" }],
    ["mua hạt cho con mèo 220k", { kind:"out", amt:220000, cat:"thucung" }],
    ["đóng tiền gym 3 tháng 1tr2", { kind:"out", amt:1200000, cat:"t_gym" }],   /* nhóm "Gym" người dùng tự tạo thắng nhóm có sẵn */
    ["netflix tháng này 260k", { kind:"out", amt:260000, cat:"giaitri" }],
    ["gia hạn icloud 45k", { kind:"out", amt:45000, cat:"dienthoai" }],
    ["mua vé máy bay đi Đà Nẵng 2tr4", { kind:"out", amt:2400000, cat:"dulich" }],
    ["đặt phòng khách sạn 1tr8", { kind:"out", amt:1800000, cat:"dulich" }],
    ["ủng hộ quỹ lũ lụt 200k", { kind:"out", amt:200000, cat:"tuthien" }],
    ["đi chùa công đức 100k", { kind:"out", amt:100000, cat:"tuthien" }],
    ["mua cuốn sách 150k", { kind:"out", amt:150000, cat:"hoctap" }],
    ["đóng học phí kỳ này 12 triệu", { kind:"out", amt:12000000, cat:"hoctap" }],
    ["ăn sáng bánh cuốn 30k với cafe 20k", [{ amt:30000, cat:"an" }, { amt:20000, cat:"uong" }]],
    ["phở 50k, trà đá 5k, gửi xe 5k", [{ amt:50000 }, { amt:5000 }, { amt:5000 }]],
    ["sáng: bánh mì 20k\ntrưa: cơm 40k\ntối: bún 35k", [{ amt:20000 }, { amt:40000 }, { amt:35000 }]],
    ["hôm qua quên ghi, ăn lẩu 400k", { kind:"out", amt:400000, cat:"an", date:-1 }],
    ["hôm kia đổ xăng 75k", { kind:"out", amt:75000, cat:"xang", date:-2 }],
    ["thứ 2 tuần này mua giày 900k", { kind:"out", amt:900000, cat:"muasam" }],
    ["ngày 1 trả tiền mạng 220k", { kind:"out", amt:220000, cat:"dienthoai" }],
    ["quẹt thẻ mua laptop 18 triệu", { kind:"card", amt:18000000, cat:"muasam" }],
    ["thẻ vib mua đồ siêu thị 1tr1", { kind:"card", amt:1100000, card:"c1" }],
    ["cà thẻ ăn nhà hàng 1tr5", { kind:"card", amt:1500000, cat:"an" }],
    ["thanh toán thẻ tpbank 6 triệu", { kind:"cardpay", amt:6000000, card:"c2" }],
    ["trả hết nợ thẻ 4tr3", { kind:"cardpay", amt:4300000 }],
    ["lương tháng 10 về 18tr", { kind:"in", amt:18000000, cat:"luong" }],
    ["công ty trả lương 15 triệu", { kind:"in", amt:15000000, cat:"luong" }],
    ["được thưởng nóng 2tr", { kind:"in", amt:2000000, cat:"thuong" }],
    ["bán con xe cũ được 8 triệu", { kind:"in", amt:8000000, cat:"ban" }],
    ["khách chuyển tiền hàng 1tr2", { kind:"in", amt:1200000 }],
    ["mẹ chuyển cho 2 triệu", { kind:"in", amt:2000000 }],
    ["nhận tiền hoàn shopee 75k", { kind:"in", amt:75000 }],
    ["lãi ngân hàng tháng này 230k", { kind:"in", amt:230000 }],
    ["cho bạn Hùng mượn 1 triệu", { kind:"lend", amt:1000000 }],
    ["Hùng mượn mình 500k", { kind:"lend", amt:500000 }],
    ["mượn tạm chị Mai 2 triệu", { kind:"borrow", amt:2000000 }],
    ["hào trả mình 300k rồi", { kind:"collect", amt:300000, loan:"l3" }],
    ["đã trả anh tuấn 1tr", { kind:"repay", amt:1000000, loan:"l2" }],
    ["trả bớt cho Lan 500k", { kind:"repay", amt:500000, loan:"l5" }],
    ["chú dũng gửi trả 2 triệu", { kind:"collect", amt:2000000, loan:"l1" }],
    ["tài khoản giờ còn 7tr650", { kind:"bal", amt:7650000 }],
    ["check số dư thấy còn 3.240.000", { kind:"bal", amt:3240000 }],
    ["momo còn có 85k", { kind:"bal", amt:85000, w:"w1" }],
    ["nạp 200k vào momo", { kind:"xfer", amt:200000, from:"main", to:"w1" }],
    ["chuyển từ techcombank sang momo 1tr", { kind:"xfer", amt:1000000, from:"w3", to:"w1" }],
    ["mua 3 ly cafe mỗi ly 25k", { kind:"out", amt:75000, cat:"uong" }],
    ["2 bát phở 50k một bát", { kind:"out", amt:100000, cat:"an" }],
    ["trà sữa 35k x4 cho cả phòng", { kind:"out", amt:140000, cat:"uong" }],
    ["đi ăn nướng 1tr2 chia 4 đứa", { kind:"out", amt:300000, cat:"an" }],
    ["karaoke 800k chia đều 4 người", { kind:"out", amt:200000, cat:"giaitri" }],
    ["mua nồi chiên 1tr5 được giảm 200k", { kind:"out", amt:1300000, cat:"nha" }],
    ["áo khoác 600k sale 30%", { kind:"out", amt:420000, cat:"muasam" }],
    ["hôm nay tiêu hết bao nhiêu rồi nhỉ", { q:"spent", period:"today" }],
    ["tháng này mình đã xài bao nhiêu tiền rồi", { q:"spent", period:"month" }],
    ["tuần này ăn uống tốn bao nhiêu", { q:"spent", period:"week", tag:"an+uong" }],
    ["tháng này đổ xăng hết bao nhiêu", { q:"spent", period:"month", tag:"xang" }],
    ["tháng trước tiền điện bao nhiêu", { q:"spent", period:"lastmonth", tag:"diennuoc" }],
    ["tiền đi đâu hết rồi", { q:"report" }],
    ["sao tháng này tiêu nhiều vậy", { q:"report" }],
    ["cho mình xem chi tiêu tuần này", { q:"report", period:"week" }],
    ["liệt kê mấy khoản shopee tháng này", { q:"report", period:"month" }],
    ["khoản nào to nhất tháng này", { q:"report", period:"month" }],
    ["hôm nay còn tiêu được không", { q:"left" }],
    ["còn bao nhiêu để tiêu hôm nay", { q:"left" }],
    ["trong tài khoản còn bao nhiêu", { q:"balance" }],
    ["ai đang nợ tiền mình vậy", { q:"loans" }],
    ["mình còn nợ ai không", { q:"loans" }],
    ["tháng này quẹt thẻ hết bao nhiêu rồi", { q:"card" }],
    ["an sang 30k 😋", { kind:"out", amt:30000, cat:"an" }],
    ["cf vs ban 50k", { kind:"out", amt:50000, cat:"uong" }],
    ["đi grab đi làm 35k", { kind:"out", amt:35000, cat:"dilai" }],
    ["tiền chợ hnay 180k", { kind:"out", amt:180000, cat:"cho", date:0 }],
    ["Đổ xăng 50k nha", { kind:"out", amt:50000, cat:"xang" }],
    ["mua đồ ăn vặt 45k :))", { kind:"out", amt:45000, cat:"an" }],
    ["Trưa: cơm gà 45k", { kind:"out", amt:45000, cat:"an" }],
    ["tối ăn bún bò 50k + trà đá 5k", [{ amt:50000, cat:"an" }, { amt:5000, cat:"uong" }]],
    ["mua 1 thùng bia 330k", { kind:"out", amt:330000, cat:"uong" }],
    ["sinh nhật bạn tặng quà 400k", { kind:"out", amt:400000, cat:"hieuhy" }],
    ["đi đám ma 200k", { kind:"out", amt:200000, cat:"hieuhy" }],
    ["tiền nước uống văn phòng 50k", { kind:"out", amt:50000, cat:"uong" }],
    ["phí ship đơn lazada 25k", { kind:"out", amt:25000, cat:"muasam" }],
    ["mua tã cho bé 380k", { kind:"out", amt:380000, cat:"concai" }],
    ["đóng tiền mầm non tháng 10 3tr5", { kind:"out", amt:3500000, cat:"concai" }],
    ["tiền rác tháng này 30k", { kind:"out", amt:30000, cat:"diennuoc" }],
    ["đổi bình ga 420k", { kind:"out", amt:420000, cat:"diennuoc" }],
    ["thuê sân bóng 300k chia 10", { kind:"out", amt:30000, cat:"suckhoe" }],
    ["vé xem bóng đá 200k", { kind:"out", amt:200000, cat:"giaitri" }],
    ["chơi bida với anh em 120k", { kind:"out", amt:120000, cat:"giaitri" }],
    ["bơm xe 5k", { kind:"out", amt:5000, cat:"suachua" }],
    ["vá săm 30k", { kind:"out", amt:30000, cat:"suachua" }],
    ["gội đầu dưỡng sinh 150k", { kind:"out", amt:150000, cat:"lamdep" }],
    ["mua son 250k", { kind:"out", amt:250000, cat:"lamdep" }],
    ["photo tài liệu 20k", { kind:"out", amt:20000, cat:"hoctap" }],
    ["đăng ký khoá ielts 6tr", { kind:"out", amt:6000000, cat:"hoctap" }],
    ["vé cáp treo bà nà 900k", { kind:"out", amt:900000, cat:"dulich" }],
    ["thuê xe máy đi phượt 150k", { kind:"out", amt:150000, cat:"dilai" }],
    ["tiêm phòng cúm 350k", { kind:"out", amt:350000, cat:"suckhoe" }],
    ["mua vitamin c 120k", { kind:"out", amt:120000, cat:"suckhoe" }],
    ["tắm cho chó 150k", { kind:"out", amt:150000, cat:"thucung" }],
    ["cát cho mèo 90k", { kind:"out", amt:90000, cat:"thucung" }],
    ["30k bánh mì pate", { kind:"out", amt:30000, cat:"an" }],
    ["1tr2 tiền điện", { kind:"out", amt:1200000, cat:"diennuoc" }],
    ["chi 500k đi chợ cuối tuần", { kind:"out", amt:500000, cat:"cho" }],
    ["vừa quẹt visa 2tr mua giày", { kind:"card", amt:2000000, cat:"muasam" }],
    ["thẻ tín dụng trả tiền khách sạn 1tr6", { kind:"card", amt:1600000, cat:"dulich" }],
    ["shopee 459k trả bằng thẻ", { kind:"card", amt:459000, cat:"muasam" }],
    ["nhận lương rồi 16tr500", { kind:"in", amt:16500000, cat:"luong" }],
    ["vừa nhận thưởng tháng 3tr", { kind:"in", amt:3000000, cat:"thuong" }],
    ["chị gái cho 500k", { kind:"in", amt:500000, cat:"cho" }],
    ["được ông bà lì xì 1 triệu", { kind:"in", amt:1000000, cat:"cho" }],
    ["thu tiền nhà cho thuê 5tr", { kind:"in", amt:5000000 }],
    ["cho Tuấn Anh vay 700k", { kind:"lend", amt:700000 }],
    ["cho em gái mượn 1tr", { kind:"lend", amt:1000000 }],
    ["vay ngân hàng 50 triệu", { kind:"borrow", amt:50000000 }],
    ["chị Mai trả tiền 500k", { kind:"collect", amt:500000, loan:"l4" }],
    ["trả lan 200k", { kind:"repay", amt:200000, loan:"l5" }],
    ["số dư tk 12tr", { kind:"bal", amt:12000000 }],
    ["rút 500k từ zalopay", { kind:"xfer", amt:500000, from:"w2", to:"main" }],
    ["hôm nay chi những gì", { q:"report", period:"today" }],
    ["tuần này cafe hết bao nhiêu", { q:"spent", period:"week", tag:"uong" }],
    ["tháng 9 tiêu bao nhiêu", { q:"spent", period:"custom" }],
    ["so sánh tháng này với tháng trước", { q:"report", compare:true }],
    ["tháng này chi nhiều nhất cho cái gì", { q:"report" }],
    ["tổng tiền grab tháng này", { q:"spent", period:"month", tag:"dilai" }],
    ["còn nợ thẻ bao nhiêu", { q:"card" }],
    ["Hào còn nợ không", { q:"loans" }]
  ];

  /* ---------- PRNG cố định ---------- */
  function rng(seed){ let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }

  /* ---------- cách nói số tiền ---------- */
  function amtText(v, r, noBare){
    const k = v / 1000;
    if(v >= 1000000){
      const tr = Math.floor(v / 1000000), du = v % 1000000;
      const forms = [];
      if(!du){ forms.push(tr + "tr", tr + " triệu", tr + " củ", tr + "m", (tr * 1000) + "k"); }
      else if(du % 100000 === 0){ const d = du / 100000; forms.push(tr + "tr" + d, tr + " triệu " + d, tr + "," + d + " triệu", tr + " củ " + d, tr + "tr" + d + "00"); }
      else { forms.push((v / 1000) + "k"); }
      forms.push(v.toLocaleString("de-DE"), v.toLocaleString("de-DE") + "đ");
      return forms[Math.floor(r() * forms.length)];
    }
    const forms = [k + "k", k + "k", k + " nghìn", k + " ngàn", k + "K", v.toLocaleString("de-DE"), v.toLocaleString("de-DE") + "đ", v + "đ", k + " ngh"];
    if(k < 1000 && r() < 0.15 && !noBare) return String(k);           /* "phở 45" = 45.000 */
    return forms[Math.floor(r() * forms.length)];
  }
  function priceOf(lo, hi, r){
    let v = lo + r() * (hi - lo);
    const step = v >= 1000 ? 100 : v >= 100 ? 10 : v >= 20 ? 5 : 1;
    v = Math.max(step, Math.round(v / step) * step);
    return v * 1000;
  }

  const WHEN = [["", 0], ["", 0], ["", 0], ["hôm nay", 0], ["sáng nay", 0], ["trưa nay", 0], ["chiều nay", 0], ["tối nay", 0],
                ["hôm qua", -1], ["tối qua", -1], ["sáng qua", -1], ["hôm kia", -2], ["hqua", -1], ["hnay", 0], ["vừa xong", 0], ["lúc nãy", 0]];
  const SPEND_T = [
    (i, a) => i + " " + a, (i, a) => i + " " + a, (i, a) => i + " hết " + a, (i, a) => i + " mất " + a, (i, a) => a + " " + i,
    (i, a) => i + " " + a + " nhé", (i, a) => "tiêu " + a + " " + i, (i, a) => i + ": " + a, (i, a) => i + " tốn " + a, (i, a) => i + " - " + a
  ];

  /* ---------- người, thẻ, ví dùng trong kho ---------- */
  const CTX = {
    now: "2026-10-09T15:00:00",                                     /* thứ Sáu */
    cards: [{ id:"c1", name:"VIB" }, { id:"c2", name:"TPBank" }, { id:"c3", name:"MB Visa" }],
    defaultCard: "c3",
    loans: [{ id:"l1", type:"lend", who:"Chú Dũng" }, { id:"l2", type:"borrow", who:"Anh Tuấn" }, { id:"l3", type:"lend", who:"Hào" },
            { id:"l4", type:"lend", who:"chị Mai" }, { id:"l5", type:"borrow", who:"Lan" }],
    wallets: [{ id:"w1", name:"Momo" }, { id:"w2", name:"ZaloPay" }, { id:"w3", name:"Techcombank" }],
    tags: [{ id:"t_gym", label:"Gym" }]
  };

  function build(seed){
    const r = rng(seed || 20261009), pick = a => a[Math.floor(r() * a.length)];
    const out = [];
    const add = (nhom, cau, mong) => out.push({ nhom, cau, mong });
    const vary = s => r() < 0.35 ? strip(s) : (r() < 0.1 ? s.charAt(0).toUpperCase() + s.slice(1) : s);

    /* A. chi tiêu thường: mỗi món 6 câu */
    ITEMS.forEach(([it, tag, lo, hi, fl]) => {
      for(let k = 0; k < 6; k++){
        const v = priceOf(lo, hi, r), a = amtText(v, r, /^(vé|trái|ly|chai|hộp|bát|suất|đôi|cái|quả) /.test(it)), [w, dd] = pick(WHEN), T = pick(SPEND_T);
        let cau = T(it, a); if(w) cau = (r() < 0.8 ? w + " " + cau : cau + " " + w);
        const plain = r() < 0.35, text = plain ? strip(cau) : cau;
        const m = { kind:"out", amt:v, date:dd };
        if(!(plain && fl === "m")) m.cat = tag;
        add("chi_" + tag, text, m);
      }
    });
    /* B. quẹt thẻ */
    const CARD_T = [
      (i, a, c) => "quẹt thẻ " + c + " " + a + " " + i, (i, a, c) => i + " " + a + " thẻ " + c, (i, a, c) => i + " " + a + " bằng thẻ " + c,
      (i, a, c) => "cà thẻ " + c + " " + i + " " + a, (i, a, c) => "thẻ " + c + " " + i + " " + a, (i, a) => "quẹt thẻ " + a + " " + i,
      (i, a) => i + " " + a + " quẹt thẻ", (i, a, c) => "thanh toán thẻ " + c + " cho " + i + " " + a, (i, a) => "thẻ trả " + i + " " + a
    ];
    for(let k = 0; k < 360; k++){
      const [it, tag, lo, hi, fl] = pick(ITEMS), v = priceOf(lo, Math.max(hi, 200), r), a = amtText(v, r), c = pick(CTX.cards), T = pick(CARD_T);
      const named = T.length >= 3 && T(it, a, "@@").includes("@@");
      if(T === CARD_T[7]) continue;                                    /* "thanh toán thẻ" là trả thẻ, để phần trả thẻ thử */
      const cau = T(it, a, c.name), plain = r() < 0.3;
      const m = { kind:"card", amt:v, card: named ? c.id : CTX.defaultCard };
      if(!(plain && fl === "m")) m.cat = tag;
      add("quet_the", plain ? strip(cau) : cau, m);
    }
    /* C. chi bằng ví khác, tiền mặt, chuyển khoản */
    const W_T = [(i, a, w) => i + " " + a + " " + w, (i, a, w) => "trả bằng " + w + " " + a + " " + i, (i, a, w) => i + " " + a + " qua " + w, (i, a, w) => w + " " + i + " " + a];
    for(let k = 0; k < 120; k++){
      const [it, tag, lo, hi] = pick(ITEMS), v = priceOf(lo, hi, r), a = amtText(v, r), w = pick(CTX.wallets);
      if(/^(nạp|đổ|sạc)/.test(it)) continue;
      add("chi_vi", vary(pick(W_T)(it, a, w.name)), { kind:"out", amt:v, w:w.id });
    }
    const CASH_T = [(i, a) => "tiền mặt " + i + " " + a, (i, a) => i + " " + a + " tiền mặt", (i, a) => i + " " + a + " tm", (i, a) => "ck " + i + " " + a, (i, a) => "chuyển khoản " + i + " " + a, (i, a) => i + " " + a + " ck"];
    for(let k = 0; k < 80; k++){
      const [it, tag, lo, hi] = pick(ITEMS), v = priceOf(lo, hi, r), T = pick(CASH_T), cau = T(it, amtText(v, r));
      add("tienmat_ck", vary(cau), Object.assign({ kind:"out", amt:v }, /tiền mặt| tm$/.test(cau) ? { src:"cash" } : {}));
    }
    /* D. khoản thu */
    const INC = [
      ["nhận lương", "luong"], ["lương về", "luong"], ["lương tháng 9", "luong"], ["nhận lương tháng này", "luong"], ["được trả lương", "luong"],
      ["thưởng", "thuong"], ["thưởng tết", "thuong"], ["thưởng dự án", "thuong"], ["nhận thưởng", "thuong"], ["hoa hồng", "thuong"], ["thưởng kpi", "thuong"],
      ["bán đồ cũ được", "ban"], ["bán hàng được", "ban"], ["bán xe được", "ban"], ["bán quần áo cũ được", "ban"], ["bán hàng online", "ban"],
      ["được lì xì", "cho"], ["mẹ cho", "cho"], ["bố cho", "cho"], ["được mừng tuổi", "cho"], ["được tặng", "cho"], ["được cho", "cho"], ["ông bà cho", "cho"], ["anh Hai cho", "cho"],
      ["hoàn tiền shopee", "khac"], ["lãi tiết kiệm", "khac"], ["nhận tiền freelance", "khac"], ["thu nhập thêm", "khac"], ["nhận được", "khac"], ["tiền về tài khoản", "khac"], ["được hoàn tiền", "khac"], ["nhận tiền làm thêm", "khac"]
    ];
    INC.forEach(([p, cat]) => { for(let k = 0; k < 5; k++){ const v = priceOf(cat === "luong" ? 8000 : 100, cat === "luong" ? 30000 : 5000, r); add("thu", vary(p + " " + amtText(v, r)), { kind:"in", amt:v, cat }); } });
    /* E. vay mượn */
    const NEWP = ["Nam", "Hùng", "Linh", "chị Hoa", "anh Bình", "cô Thu", "Minh", "bạn Phương", "Tú", "Quân"];
    for(let k = 0; k < 40; k++){
      const p = pick(NEWP), v = priceOf(100, 10000, r), a = amtText(v, r);
      add("cho_vay", vary(pick(["cho " + p + " vay " + a, "cho " + p + " mượn " + a, "cho " + p + " vay " + a + " nhé", "cho vay " + p + " " + a])), { kind:"lend", amt:v, who:p.split(" ").pop() });
      add("di_vay", vary(pick(["vay " + p + " " + a, "mượn " + p + " " + a, "vay của " + p + " " + a, p + " cho mình vay " + a, p + " cho tôi mượn " + a])), { kind:"borrow", amt:v, who:p.split(" ").pop() });
    }
    [["Chú Dũng","l1","lend"],["Hào","l3","lend"],["chị Mai","l4","lend"],["Anh Tuấn","l2","borrow"],["Lan","l5","borrow"]].forEach(([who, id, type]) => {
      for(let k = 0; k < 10; k++){
        const v = priceOf(100, 5000, r), a = amtText(v, r), w = who.toLowerCase();
        if(type === "lend"){
          add("duoc_tra", vary(pick([w + " trả " + a, w + " trả mình " + a, w + " trả nợ " + a, w + " trả lại " + a, w + " gửi trả " + a])), { kind:"collect", amt:v, loan:id });
          add("cho_vay_them", vary(pick(["cho " + w + " vay thêm " + a, "cho " + w + " vay " + a])), { kind:"lend", amt:v, loan:id });
        } else {
          add("tra_no", vary(pick(["trả nợ " + w + " " + a, "trả " + w + " " + a, "trả lại " + w + " " + a, "trả tiền " + w + " " + a])), { kind:"repay", amt:v, loan:id });
          add("vay_them", vary(pick(["vay " + w + " thêm " + a, "vay thêm " + w + " " + a])), { kind:"borrow", amt:v, loan:id });
        }
      }
    });
    /* F. số dư, trả thẻ, chuyển ví */
    for(let k = 0; k < 40; k++){
      const v = priceOf(500, 50000, r), a = amtText(v, r);
      add("so_du", vary(pick(["tài khoản còn " + a, "tk còn " + a, "số dư " + a, "số dư còn " + a, "tài khoản hiện còn " + a, "check tk còn " + a])), { kind:"bal", amt:v });
      const w = pick(CTX.wallets);
      add("so_du_vi", vary(pick([w.name + " còn " + a, "số dư " + w.name + " " + a])), { kind:"bal", amt:v, w:w.id });
      const c = pick(CTX.cards);
      add("tra_the", vary(pick(["trả thẻ " + c.name + " " + a, "thanh toán thẻ " + c.name + " " + a, "trả nợ thẻ " + c.name + " " + a, "tất toán thẻ " + c.name + " " + a])), { kind:"cardpay", amt:v, card:c.id });
      add("tra_the", vary(pick(["trả thẻ " + a, "thanh toán thẻ tín dụng " + a, "trả nợ thẻ " + a])), { kind:"cardpay", amt:v, card:CTX.defaultCard });
      add("chuyen_vi", vary(pick(["nạp " + w.name + " " + a, "nạp " + a + " vào " + w.name, "chuyển " + a + " sang " + w.name])), { kind:"xfer", amt:v, from:"main", to:w.id });
      add("chuyen_vi", vary(pick(["rút " + a + " từ " + w.name + " về tài khoản", "rút " + w.name + " " + a, "chuyển " + a + " từ " + w.name + " về tài khoản"])), { kind:"xfer", amt:v, from:w.id, to:"main" });
    }
    /* G. nhiều khoản một câu */
    const SEP = [", ", ", ", " và ", " rồi ", "\n", " + ", " với ", "; ", ". "];
    for(let k = 0; k < 300; k++){
      const n = 2 + (r() < 0.3 ? 1 : 0), parts = [], m = [];
      for(let j = 0; j < n; j++){ const [it, tag, lo, hi, fl] = pick(ITEMS); const v = priceOf(lo, hi, r); parts.push(it + " " + amtText(v, r)); const x = { amt:v }; if(fl !== "m") x.cat = tag; m.push(x); }
      let cau = parts[0]; for(let j = 1; j < n; j++) cau += pick(SEP) + parts[j];
      const [w, dd] = pick(WHEN); if(w) { cau = w + " " + cau; m.forEach(x => x.date = dd); }
      const plain = r() < 0.3; if(plain) m.forEach(x => { if(["che","kem","ca","tom","chuot"].some(z => strip(cau).includes(z))) delete x.cat; });
      add("nhieu_khoan", plain ? strip(cau) : cau, m);
    }
    /* H. phép tính: số lượng × đơn giá, chia tiền, giảm giá */
    const QTY = [["ly trà sữa","uong","ly",30,60],["ly cà phê","uong","ly",20,45],["cái áo","muasam","cái",100,300],["bát phở","an","bát",35,60],["suất cơm","an","suất",30,50],
                 ["hộp sữa","cho","hộp",8,15],["vé xem phim","giaitri","vé",80,150],["chai nước","uong","chai",5,15],["cái bánh mì","an","cái",15,30],["đôi dép","muasam","đôi",80,200]];
    for(let k = 0; k < 120; k++){
      const [it, tag, unit, lo, hi] = pick(QTY), q = 2 + Math.floor(r() * 4), v = priceOf(lo, hi, r), a = amtText(v, r);
      const T = pick([
        () => q + " " + it + " mỗi " + unit + " " + a, () => "mua " + q + " " + it + " " + a + " một " + unit, () => q + " " + it + ", " + a + "/" + unit,
        () => q + " " + it + " " + a + " 1 " + unit, () => it + " " + a + " x" + q, () => it + " " + a + " x " + q
      ]);
      add("tinh_soluong", vary(T()), { kind:"out", amt:v * q, cat:tag });
    }
    for(let k = 0; k < 60; k++){
      const [it, tag, lo, hi] = pick(ITEMS.filter(x => x[1] === "an" || x[1] === "uong" || x[1] === "giaitri")), n = 2 + Math.floor(r() * 5);
      const v = Math.round(priceOf(Math.max(lo, 200), Math.max(hi, 600), r) / (n * 1000)) * n * 1000, a = amtText(v, r);
      add("tinh_chia", vary(pick([it + " " + a + " chia " + n, it + " " + a + " chia " + n + " người", it + " hết " + a + " chia đều " + n + " người", it + " " + a + " chia " + n + " đứa"])), { kind:"out", amt:v / n, cat:tag, split:n });
    }
    for(let k = 0; k < 40; k++){
      const [it, tag, lo, hi] = pick(ITEMS.filter(x => x[1] === "cho" || x[1] === "muasam")), p = pick([10, 20, 30, 50]);
      const v = Math.round(priceOf(Math.max(lo, 100), Math.max(hi, 400), r) / 10000) * 10000, a = amtText(v, r);
      const amb = ITEMS.find(x => x[0] === it)[4] === "m", g1 = vary(pick([it + " " + a + " giảm " + p + "%", it + " " + a + " được giảm " + p + "%", it + " " + a + " sale " + p + "%"]));
      add("tinh_giam", g1, Object.assign({ kind:"out", amt:Math.round(v * (100 - p) / 100) }, amb && g1 === strip(g1) ? {} : { cat:tag }));
      const g = Math.round(v * p / 100 / 1000) * 1000;
      const g2 = vary(pick([it + " " + a + " giảm " + amtText(g, r), it + " " + a + " được giảm " + amtText(g, r), it + " " + a + " trừ voucher " + amtText(g, r)]));
      if(g > 0) add("tinh_giam", g2, Object.assign({ kind:"out", amt:v - g }, amb && g2 === strip(g2) ? {} : { cat:tag }));
    }

    /* I. câu hỏi */
    const PER = [["hôm nay","today"],["hnay","today"],["hôm qua","yesterday"],["tuần này","week"],["tuần trước","lastweek"],["tuần rồi","lastweek"],
                 ["tháng này","month"],["tháng trước","lastmonth"],["tháng rồi","lastmonth"],["năm nay","year"],["tháng 9","custom"],["tháng 8","custom"],["7 ngày qua","custom"]];
    const SPENT_Q = [p => p + " tiêu bao nhiêu", p => p + " chi bao nhiêu", p => p + " tiêu hết bao nhiêu", p => p + " xài bao nhiêu", p => p + " tiêu bn",
                     p => p + " hết bao nhiêu tiền", p => "tổng chi " + p, p => p + " tiêu bao nhiêu rồi", p => p + " đã chi bao nhiêu", p => p + " tiêu hết bao nhiêu tiền rồi"];
    PER.forEach(([p, per]) => SPENT_Q.forEach(T => add("hoi_tong", vary(T(p)), { q:"spent", period:per })));
    const TAGQ = [["ăn uống","an+uong"],["cà phê","uong"],["xăng","xang"],["grab","dilai"],["đi chợ","cho"],["shopee","muasam"],["tiền điện","diennuoc"],["thuốc","suckhoe"],["trà sữa","uong"],["cắt tóc","lamdep"]];
    PER.slice(0, 10).forEach(([p, per]) => TAGQ.forEach(([t, tag]) => add("hoi_nhom", vary(pick([p + " " + t + " bao nhiêu", p + " tiền " + t + " hết bao nhiêu", p + " " + t + " hết bao nhiêu", p + " chi cho " + t + " bao nhiêu"])), { q:"spent", period:per, tag })));
    const REP_Q = [p => p + " tiêu gì", p => p + " tiêu những gì", p => p + " tiêu vào đâu", p => "liệt kê chi tiêu " + p, p => "chi tiết chi tiêu " + p,
                   p => "phân tích chi tiêu " + p, p => "thống kê " + p, p => p + " chi vào việc gì", p => "xem chi tiêu " + p, p => p + " tiền đi đâu hết"];
    PER.forEach(([p, per]) => REP_Q.forEach(T => add("hoi_baocao", vary(T(p)), { q:"report", period:per })));
    PER.slice(0, 10).forEach(([p, per]) => {
      add("hoi_top", vary(pick(["5 khoản lớn nhất " + p, "top 5 " + p, p + " khoản nào lớn nhất", "khoản to nhất " + p, "3 khoản lớn nhất " + p])), { q:"report", period:per });
      add("hoi_sosanh", vary(pick([p + " so với kỳ trước", p + " tiêu nhiều hơn không", p + " so sánh với trước"])), { q:"report", period:per, compare:true });
      add("hoi_ngay", vary(pick([p + " ngày nào tiêu nhiều nhất", p + " hôm nào tiêu nhiều nhất"])), { q:"topday" });
    });
    ["hôm nay còn bao nhiêu", "còn được tiêu bao nhiêu", "hôm nay còn tiêu được bao nhiêu", "còn bao nhiêu tiền tiêu", "hnay con bn", "hôm nay còn được bao nhiêu", "còn lại bao nhiêu", "hôm nay tiêu được nữa không"].forEach(t => add("hoi_con", vary(t), { q:"left" }));
    ["số dư", "số dư bao nhiêu", "tài khoản còn bao nhiêu", "ví còn bao nhiêu", "số dư ví", "tk còn bao nhiêu", "còn bao nhiêu tiền trong tài khoản", "so du bn", "kiểm tra số dư"].forEach(t => add("hoi_sodu", vary(t), { q:"balance" }));
    ["momo còn bao nhiêu", "số dư momo", "zalopay còn bao nhiêu", "techcombank còn bao nhiêu"].forEach(t => add("hoi_sodu", vary(t), { q:"balance" }));
    ["ai nợ mình", "ai còn nợ mình", "mình đang nợ ai", "mình còn nợ ai", "những ai nợ tiền mình", "ai đang nợ tôi", "tôi nợ ai", "hào nợ bao nhiêu", "chú dũng còn nợ bao nhiêu", "mình nợ anh tuấn bao nhiêu", "còn nợ lan bao nhiêu", "nợ nần thế nào"].forEach(t => add("hoi_no", vary(t), { q:"loans" }));
    ["thẻ tháng này bao nhiêu", "tháng này quẹt thẻ bao nhiêu", "nợ thẻ bao nhiêu", "thẻ tín dụng tháng này tiêu bao nhiêu", "quẹt thẻ bao nhiêu rồi"].forEach(t => add("hoi_the", vary(t), { q:"card" }));
    /* v123: khoản sắp tới, dự kiến */
    const UP_WHEN = ["từ nay đến cuối tháng", "từ nay tới cuối tháng", "các ngày tới", "những ngày tới", "sắp tới", "thời gian tới", "từ hôm nay đến hết tháng", "tuần sau", "tháng sau", "7 ngày tới", "sau hôm nay", "dự kiến"];
    const UP_WHAT = [["có khoản nào", null], ["có khoản chi nào", "out"], ["có khoản cho vay nào", "lend"], ["có khoản thu nào", "in"], ["có khoản nào đến hạn", "due"], ["có giao dịch gì", null], ["có gì phải trả", null], ["phải chi những gì", "out"], ["có khoản dự kiến nào", null], ["sẽ cho ai vay", "lend"], ["có khoản đi vay nào", "borrow"]];
    UP_WHEN.forEach(w => UP_WHAT.forEach(([x, only]) => {
      const tail = pick([" không", " không?", "", " ko", " chưa", " nhỉ"]);
      const cau = r() < 0.5 ? w + " " + x + tail : x + " " + w + tail;
      add("hoi_sap_toi", vary(cau), Object.assign({ q:"upcoming" }, only ? { only } : {}));
    }));
    ["sai rồi ý tôi là trong các ngày tới", "ý mình là từ nay tới cuối tháng có khoản nào không", "không phải, ý tôi là các khoản dự kiến", "tức là sắp tới có khoản chi nào không", "ý là những ngày tới sau hôm nay"].forEach(t => add("hoi_sap_toi", vary(t), { q:"upcoming" }));
    /* v123: nên tiết kiệm gì */
    const SV = ["nên tiết kiệm gì", "nên tiết kiệm cái gì", "nên cắt giảm khoản nào", "nên bớt tiêu cái gì", "tiết kiệm ở đâu được", "làm sao để tiết kiệm", "cắt bớt khoản nào", "nên giảm chi nhóm nào", "gợi ý tiết kiệm", "nên tiết kiệm ở đâu", "làm thế nào để bớt tiêu", "tư vấn tiết kiệm giúp mình"];
    [["", "month"], ["tháng này ", "month"], ["tuần này ", "week"], ["vậy ", "month"], ["thế ", "month"], ["tháng trước ", "lastmonth"]].forEach(([p0, per]) => SV.forEach(t => add("hoi_tiet_kiem", vary(p0 + t + pick(["", "?", " nhỉ", " vậy"])), { q:"save", period:per })));
    TU_NHIEN.forEach(([c, m]) => add("tu_nhien", c, m));
    return out;
  }


  /* ---------- nhánh hội thoại: [câu đầu, câu trả lời tiếp, mong đợi] ----------
     mong: { act, f:{…} } với f là các trường phải đổi; act "none" = không phải câu nối (để bộ hiểu câu xử lý như câu mới) */
  function branches(seed){
    const r = rng((seed || 20261009) + 7), pick = a => a[Math.floor(r() * a.length)], out = [];
    const add = (a, b, m) => out.push({ nhom:"nhanh_" + m.act, cau:a, tiep:b, mong:m });
    const FIRST = ["trưa ăn phở 45k", "cafe 30k", "grab 28k", "đổ xăng 70k", "mua áo 250k", "trà sữa 35k", "siêu thị 420k", "cắt tóc 80k", "bún chả 40k", "tiền điện 650k"];
    const SAVE = ["ok", "ok ghi đi", "ghi đi", "đúng rồi", "chuẩn", "lưu", "ghi luôn", "oke", "ừ", "đúng rồi ghi đi", "ghi hết", "chốt", "ok đúng rồi", "dc", "uk", "vâng", "ghi nhé", "Ok", "Đúng rồi"];
    const SKIP = ["bỏ", "thôi", "thôi bỏ", "huỷ", "không ghi", "khỏi", "bỏ đi", "xoá đi", "thôi khỏi", "không cần", "đừng ghi", "hủy"];
    FIRST.forEach(f => { for(let k = 0; k < 4; k++){ add(f, pick(SAVE), { act:"save" }); add(f, pick(SKIP), { act:"skip" }); } });
    const FIX = [v => v, v => v + " chứ", v => "nhầm, " + v, v => "à " + v, v => "sửa thành " + v, v => v + " mới đúng", v => "không phải, " + v, v => "đổi thành " + v, v => v + " nhé", v => "ghi nhầm, " + v + " chứ", v => "sai rồi " + v];
    for(let k = 0; k < 60; k++){
      const f = pick(FIRST), v = (5 + Math.floor(r() * 90)) * 1000, t = pick(FIX)(pick([v / 1000 + "k", v / 1000 + " nghìn", v.toLocaleString("de-DE")]));
      add(f, t, { act:"set", f:{ amt:v } });
    }
    for(let k = 0; k < 15; k++){ add(pick(FIRST), pick(["quẹt thẻ", "à quẹt thẻ", "bằng thẻ", "thẻ VIB", "thẻ TPBank chứ", "quẹt thẻ VIB", "cà thẻ", "à thẻ MB Visa"]), { act:"set", f:{ kind:"card" } }); }
    for(let k = 0; k < 10; k++){ add(pick(FIRST), pick(["tiền mặt", "trả tiền mặt", "tiền mặt chứ"]), { act:"set", f:{ src:"cash" } }); add(pick(FIRST), pick(["momo", "trả bằng momo", "qua zalopay", "momo chứ"]), { act:"set", f:{ kind:"out" } }); }
    for(let k = 0; k < 15; k++){ add(pick(FIRST), pick(["hôm qua", "hôm qua chứ", "à hôm qua", "hôm kia", "ghi hôm qua", "tối qua"]), { act:"set", f:{ date:true } }); }
    [["cafe 30k", "nhóm uống", "uong"], ["mua áo 250k", "là mua sắm", "muasam"], ["grab 28k", "nhóm đi lại", "dilai"], ["abc 50k", "nhóm ăn", "an"], ["đồ 120k", "tag thú cưng", "thucung"], ["mua đồ 300k", "vào nhóm con cái", "concai"], ["xyz 90k", "là xăng", "xang"]]
      .forEach(([a, b, c]) => add(a, b, { act:"set", f:{ cat:c } }));
    [["50k", "nội dung là ăn sáng"], ["chi 200k", "ghi là mua quà"], ["120k", "tên là tiền gas"]].forEach(([a, b]) => add(a, b, { act:"set", f:{ note:true } }));
    [["ăn lẩu 600k chia 4", "mình trả hết", 600000], ["ăn lẩu 600k chia 4", "chỉ phần mình", 150000], ["karaoke 900k chia 3 người", "tôi trả hết", 900000], ["nhậu 1tr2 chia 4", "ghi cả bill", 1200000], ["buffet 800k chia đều 2 người", "phần mình thôi", 400000]]
      .forEach(([a, b, v]) => add(a, b, { act:"set", f:{ amt:v } }));
    [["cho vay 500k", "Nam"], ["vay 2tr", "anh Bình"], ["cho mượn 300k", "chị Hoa"]].forEach(([a, b]) => add(a, b, { act:"set", f:{ who:true } }));
    /* không phải câu nối: câu chi tiêu mới, câu hỏi */
    [["trưa ăn phở 45k", "cafe 30k"], ["cafe 30k", "grab 28k về nhà"], ["grab 28k", "hôm nay tiêu bao nhiêu"], ["mua áo 250k", "trà sữa 35k và bánh 20k"], ["siêu thị 420k", "nhận lương 15tr"],
     ["bún chả 40k", "tháng này tiêu gì"], ["cắt tóc 80k", "cho Nam vay 500k"], ["cafe 30k", "đổ xăng 70k"], ["trà sữa 35k", "ai nợ mình"], ["tiền điện 650k", "tiền nước 120k"]]
      .forEach(([a, b]) => add(a, b, { act:"none" }));
    /* hỏi số tiền: bot hỏi "ăn phở hết bao nhiêu?" → trả lời */
    [["ăn phở", "45k", 45000, "an"], ["đổ xăng", "70 nghìn", 70000, "xang"], ["mua giày", "hết 1tr2", 1200000, "muasam"], ["cafe", "29k", 29000, "uong"], ["cắt tóc", "80.000", 80000, "lamdep"], ["grab", "mất 32k", 32000, "dilai"]]
      .forEach(([a, b, v, c]) => out.push({ nhom:"nhanh_hoitien", cau:a, tiep:b, mong:{ act:"new", amt:v, cat:c }, waitAmt:true }));
    return out;
  }
  const api = { ITEMS, CTX, build, branches, strip };
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  else root.N50KKho = api;
})(typeof window !== "undefined" ? window : this);
