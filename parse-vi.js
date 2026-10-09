/* Tiêu Gọn – bộ hiểu câu tiếng Việt chạy ngay trên máy (không cần mạng, không gửi dữ liệu đi đâu).
   parse(text, ctx) -> { items:[...], query:{...}|null, unknown:[đoạn không hiểu] }
   Mỗi item: { kind, amt, note, cat, date:"yyyy-mm-dd", t, cardId, who, loanId, src }
     kind: "out" (chi tài khoản/tiền mặt) | "card" (quẹt thẻ) | "in" (khoản thu)
           | "lend" (cho vay) | "borrow" (đi vay) | "repay" (mình trả nợ) | "collect" (người ta trả mình)
           | "cardpay" (trả thẻ) | "bal" (số dư thật) | "xfer" (chuyển giữa các ví của mình: from, to)
   Có nhiều ví (v98): out/in/bal/cardpay có thể kèm w = mã ví nói trong câu ("cafe 30k momo").
   ctx: { now:Date, cards:[{id,name}], wallets:[{id,name}], loans:[{id,type,who,settled}], tags:[{id,label}], history:(note)=>tagId|"" }
   Dùng chung cho app (window.N50KParse) và cho bài thử chạy bằng Node (module.exports). */
(function(root){
  "use strict";
  const strip = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  const norm = s => strip(s).toLowerCase();
  const hasMarks = s => /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s);
  const pad = n => String(n).padStart(2, "0");
  const keyOf = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  /* chữ đầu viết hoa (kể cả chữ có dấu: "Đức", "Ánh"); [A-ZÀ-Ỹ] lẫn cả chữ thường có dấu nên không dùng được */
  const isCap = w => { const c = String(w || "").charAt(0); return !!c && c !== c.toLowerCase() && c === c.toUpperCase(); };
  const clean = w => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}%]+$/gu, "");

  /* ---------------- số tiền ---------------- */
  const COUNTERS = new Set(["cai","ly","coc","chai","hop","goi","phan","suat","to","dia","nguoi","lan","ve","kg","qua","chiec","doi","bo","thang","ngay","tuan","nam","gio","h","phut","lon","bat","mon","cuon","tam","con","trai","cay","lit","km","m","g","gb","tb","%","dot","ky","buoi","tiet","so","thu","khoan","thung","lo","loc","tui","bich","hu","khay","mieng","thanh","chuc","set","combo","cap","xap","tep","que","bo_","hop","goi","nam_"]);
  const OF = new WeakMap();                                        /* mảng chữ chuẩn hoá -> mảng chữ gốc */
  const pair = (O, N) => { OF.set(N, O); return { O, N }; };
  const K_UNITS = new Set(["k","ng","ngh","nghin","ngan","nghn","ka","x"]);
  const M_UNITS = new Set(["tr","trieu","cu","m","mil","chai_"]);
  function numOf(raw){
    /* "1.200.000" -> 1200000 ; "1,2" -> 1.2 ; "45" -> 45 */
    if(/^\d{1,3}([.,]\d{3})+$/.test(raw)) return parseInt(raw.replace(/[.,]/g, ""), 10);
    if(/^\d+[.,]\d+$/.test(raw)) return parseFloat(raw.replace(",", "."));
    if(/^\d+$/.test(raw)) return parseInt(raw, 10);
    return NaN;
  }
  /* đọc một số tiền bắt đầu ở token i; trả {v, n:số token đã dùng} hoặc null */
  function amountAt(N, i){
    const t = N[i]; if(!t) return null;
    /* "tháng 10", "thứ 7" không phải tiền; so theo chữ gốc để "Tuấn 2 triệu" vẫn là tiền */
    const O = OF.get(N), po = O && O[i-1] ? clean(O[i-1]).toLowerCase() : "";
    const afterDate = i > 0 && !(i > 1 && O && isCap(clean(O[i-1] || ""))) && (hasMarks(po) ? ["tháng","ngày","thứ","tuần","kỳ","đợt"].includes(po) : ["thang","ngay","thu","ky","dot"].includes(N[i-1]));
    /* v122: "tháng 10" không phải tiền, nhưng "gửi xe tháng 120k" là tiền: có đơn vị (k, tr, nghìn…) hoặc dấu chấm nghìn thì vẫn đọc */
    if(afterDate && (/^\d{1,2}$/.test(t) ? !(K_UNITS.has(N[i+1]) || ["tr","trieu","cu","d","dong","vnd"].includes(N[i+1])) : !/^\d{3,}$|^\d+([.,]\d{3})+$|^\d+(k|ng|ngh|nghin|ngan|tr|trieu|cu|d|dong|vnd)\d*$/.test(t))) return null;
    /* v122: "chia 4", "x 3", "nhân 2" là số người / số lượng, không phải tiền */
    if(i > 0 && (["chia","x"].includes(N[i-1]) || (po === "nhân" || po === "gấp")) && /^\d{1,2}$/.test(t) && !K_UNITS.has(N[i+1])) return null;
    if(i > 1 && N[i-1] === "cho" && N[i-2] === "chia" && /^\d{1,2}$/.test(t)) return null;
    let m = t.match(/^(\d+(?:[.,]\d+)*)(k|ng|ngh|nghin|ngan|tr|trieu|cu|m|d|dong|vnd|t)?(\d{1,3})?$/);
    if(!m) return null;
    let v = numOf(m[1]); if(isNaN(v)) return null;
    let unit = m[2] || "", tail = m[3] || "", used = 1;
    if(unit === "t" && !tail) return null;                       /* "2t" không rõ nghĩa */
    if(!unit){
      const nx = N[i+1] || "";
      if(K_UNITS.has(nx) && !(nx === "x" && /^\d{1,2}$/.test(N[i+2] || ""))){ unit = "k"; used = 2; }
      else if(nx === "tr" || nx === "trieu" || nx === "cu" || nx === "chai" && false){ unit = "tr"; used = 2; }
      else if(nx === "tram"){ unit = "tram"; used = 2; }
      else if(nx === "d" || nx === "dong" || nx === "vnd"){ unit = "d"; used = 2; }
      else if(COUNTERS.has(nx) && !/[.,]/.test(m[1]) && v < 100) return null;   /* "2 ly", "3 cái" là số lượng; "50.000 bò né" vẫn là tiền */
    }
    if(unit === "k" || unit === "ng" || unit === "ngh" || unit === "nghin" || unit === "ngan"){ v *= 1000; if(tail && unit === "k") v += parseInt(tail, 10) * Math.pow(10, 3 - tail.length); }
    else if(unit === "tr" || unit === "trieu" || unit === "cu" || unit === "m" || unit === "t"){
      v *= 1000000;
      if(tail) v += parseInt(tail, 10) * Math.pow(10, 6 - tail.length);
      else {
        /* "1 triệu 2", "1 triệu 250", "1 triệu 250 nghìn", "1tr2" */
        const nx = N[i+used] || "", nn = N[i+used+1] || "";
        if(/^\d{1,3}$/.test(nx)){
          if(K_UNITS.has(nn)){ v += parseInt(nx, 10) * 1000; used += 2; }
          else if(nn === "tram"){ v += parseInt(nx, 10) * 100000; used += 2; }
          else if(!COUNTERS.has(nn) || nx.length === 1){ v += parseInt(nx, 10) * Math.pow(10, 6 - nx.length); used += 1; }
        } else if(nx === "ruoi"){ v += 500000; used += 1; }
      }
    }
    else if(unit === "tram") v *= 100000;
    else if(unit === "d" || unit === "dong" || unit === "vnd"){ /* giữ nguyên */ }
    else if(v < 1000) v *= 1000;                                   /* "phở 45" -> 45.000 */
    if(N[i+used] === "ruoi" && (unit === "k" || unit === "tram")){ v += unit === "tram" ? 50000 : 500; used++; }
    v = Math.round(v);
    if(!(v > 0) || v > 100000000000) return null;
    return { v, n:used };
  }

  /* ---------------- ngày giờ ---------------- */
  const WDAY = { "thu 2":1, "thu hai":1, "thu 3":2, "thu ba":2, "thu 4":3, "thu tu":3, "thu 5":4, "thu nam":4, "thu 6":5, "thu sau":5, "thu 7":6, "thu bay":6, "chu nhat":0, "cn":0 };
  const PARTS = { sang:8, trua:12, chieu:16, toi:20, dem:22 };
  /* tìm ngày, giờ trong đoạn đã chuẩn hoá; trả {date, hh, mm, drop:Set(token index)} */
  function dateIn(N, now){
    /* "tôi" (đại từ) và "tối" (buổi tối) cùng chuẩn hoá thành "toi" (v103): có dấu thì nhìn dấu;
       gõ không dấu thì chỉ coi là buổi tối khi đi với "nay/qua" hoặc sau "buổi" */
    const O = OF.get(N);
    const isMe = i => {
      const o = O && O[i] ? clean(O[i]).toLowerCase() : "";
      if(hasMarks(o)) return o === "tôi";
      return !(N[i+1] === "nay" || N[i+1] === "qua" || N[i-1] === "buoi");
    };
    let date = null, hh = null, mm = null; const drop = new Set();
    const at = (i, words) => words.every((w, k) => N[i+k] === w);
    /* v123: câu nói về khoản sắp tới ("dự kiến", "sẽ", "sắp", "định", "hẹn", "tuần sau"…): "ngày 20", "thứ 6" hiểu là sắp tới, không lùi về trước */
    const oL = i => O && O[i] ? clean(O[i]).toLowerCase() : "";
    const fut = N.some((w, i) => (w === "du" && (N[i+1] === "kien" || N[i+1] === "tinh")) || (w === "ke" && N[i+1] === "hoach") || ["sẽ","sắp","định","hẹn"].includes(oL(i)) || (w === "tuan" && (N[i+1] === "sau" || N[i+1] === "toi")) || (w === "thang" && (N[i+1] === "sau" || N[i+1] === "toi")));
    if(fut) N.forEach((w, i) => { if((w === "du" && (N[i+1] === "kien" || N[i+1] === "tinh")) || (w === "ke" && N[i+1] === "hoach")) drop.add(i).add(i+1); if(["sẽ","sắp","định"].includes(oL(i))) drop.add(i); });
    for(let i = 0; i < N.length; i++){
      const w = N[i];
      /* ngày mai, sáng mai, tối mai; ngày kia / ngày mốt (không nhầm "chị Mai") */
      if((at(i, ["ngay","mai"]) || (PARTS[w] !== undefined && N[i+1] === "mai")) && !isCap(clean(O ? O[i+1] || "" : ""))){
        date = keyOf(addDays(now, 1)); drop.add(i).add(i+1); if(PARTS[w] !== undefined && hh === null) hh = PARTS[w]; i++; continue;
      }
      if(at(i, ["ngay","kia"]) || (w === "ngay" && oL(i+1) === "mốt") || oL(i) === "mốt"){ date = keyOf(addDays(now, 2)); drop.add(i); if(w === "ngay") drop.add(i+1); continue; }
      if(w === "hnay" || w === "homnay" || at(i, ["hum","nay"])){ date = keyOf(now); drop.add(i); if(w === "hum") drop.add(i+1); }
      else if(w === "nay" && ["luc","vua","ban","khi","hoi"].includes(N[i-1]) || (w === "xong" && N[i-1] === "vua" && i === N.length - 1)){ if(!date) date = keyOf(now); drop.add(i).add(i-1); }
      else if(w === "hqua" || w === "homqua" || at(i, ["hum","qua"])){ date = keyOf(addDays(now, -1)); drop.add(i); if(w === "hum") drop.add(i+1); }
      else if(w === "hkia" || w === "homkia"){ date = keyOf(addDays(now, -2)); drop.add(i); }
      else if(at(i, ["hom","nay"])){ date = keyOf(now); drop.add(i).add(i+1); }
      else if(at(i, ["hom","qua"])){ date = keyOf(addDays(now, -1)); drop.add(i).add(i+1); }
      else if(at(i, ["hom","kia"])){ date = keyOf(addDays(now, -2)); drop.add(i).add(i+1); }
      else if(at(i, ["bua","nay"]) || at(i, ["bua","qua"])){ date = keyOf(addDays(now, N[i+1] === "qua" ? -1 : 0)); drop.add(i).add(i+1); }
      else if(PARTS[w] !== undefined && (N[i+1] === "nay" || N[i+1] === "qua" || i === 0 || drop.has(i-1) || N[i-1] === "buoi" || N[i-1] === "an")
              && !(w === "toi" && isMe(i))){
        if(hh === null) hh = PARTS[w];
        if(N[i+1] === "nay"){ drop.add(i).add(i+1); if(!date) date = keyOf(now); }
        else if(N[i+1] === "qua"){ drop.add(i).add(i+1); date = keyOf(addDays(now, -1)); }
        else if(N[i-1] !== "an") drop.add(i);                     /* "ăn trưa" giữ lại làm nội dung */
        if(N[i-1] === "buoi") drop.add(i-1);
      }
      else if(((w === "thu" && N[i+1]) || w === "chu" || w === "cn") && !(i > 0 && O && isCap(clean(O[i] || "")))){
        const two = w + " " + (N[i+1] || ""), key = WDAY[two] !== undefined ? two : (WDAY[w] !== undefined ? w : null);
        if(key !== null){
          const len = key.split(" ").length, target = WDAY[key];
          let back = (now.getDay() - target + 7) % 7;
          const tuanTruoc = N[i+len] === "tuan" && N[i+len+1] === "truoc";
          const tuanSau = N[i+len] === "tuan" && (N[i+len+1] === "sau" || N[i+len+1] === "toi");
          if(tuanTruoc) back += 7;
          if(tuanSau){ const wdN = (now.getDay() + 6) % 7, wdT = (target + 6) % 7; date = keyOf(addDays(now, 7 - wdN + wdT)); }
          else if(fut){ date = keyOf(addDays(now, (target - now.getDay() + 7) % 7 || 7)); }
          else date = keyOf(addDays(now, -back));
          for(let k = 0; k < len + (tuanTruoc || tuanSau ? 2 : 0); k++) drop.add(i+k);
          if(N[i+len] === "tuan" && N[i+len+1] === "nay"){ drop.add(i+len).add(i+len+1); }
        }
      }
      else if(/^\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?$/.test(w)){
        const p = w.split(/[\/\-]/).map(Number), y = p[2] ? (p[2] < 100 ? 2000 + p[2] : p[2]) : now.getFullYear();
        const d = new Date(y, p[1] - 1, p[0]);
        if(d.getMonth() === p[1] - 1){ date = keyOf(d); drop.add(i); if(N[i-1] === "ngay") drop.add(i-1); }
      }
      else if(w === "ngay" && /^\d{1,2}$/.test(N[i+1] || "") && !K_UNITS.has(N[i+2] || "")){
        const dd = parseInt(N[i+1], 10);
        let d = new Date(now.getFullYear(), now.getMonth(), dd);
        const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if(fut){ if(d < today0) d = new Date(now.getFullYear(), now.getMonth() + 1, dd); }
        else if(d > now) d = new Date(now.getFullYear(), now.getMonth() - 1, dd);
        if(dd >= 1 && dd <= 31){ date = keyOf(d); drop.add(i).add(i+1); }
      }
      else if(/^\d{1,2}(h|:)\d{0,2}$/.test(w) || (/^\d{1,2}$/.test(w) && (N[i+1] === "gio" || N[i+1] === "h"))){
        const m = w.match(/^(\d{1,2})(?:h|:)?(\d{0,2})$/);
        if(m){ hh = parseInt(m[1], 10); mm = m[2] ? parseInt(m[2], 10) : 0; drop.add(i);
          if(N[i+1] === "gio" || N[i+1] === "h") drop.add(i+1);
          if(N[i-1] === "luc") drop.add(i-1);
          if(PARTS[N[i+1]] !== undefined || PARTS[N[i+2]] !== undefined){ const pw = PARTS[N[i+1]] !== undefined ? N[i+1] : N[i+2]; if((pw === "chieu" || pw === "toi") && hh < 12) hh += 12; }
        }
      }
    }
    return { date, hh, mm, drop };
  }

  /* ---------------- tag ---------------- */
  /* Từ điển nhóm chi (v122, ~900 từ): cụm dài khớp trước cụm ngắn ("bún đậu mắm tôm" là Ăn dù có "mắm";
     "sửa điện thoại" là Sửa chữa dù có "điện thoại"). Bằng nhau thì nhóm đứng trước thắng. */
  const TAG_RULES = [
    ["xang",     ["đổ xăng","xăng","đổ dầu","dầu diesel","petrolimex","pvoil","nhớt","sạc xe điện","sạc xe","trạm sạc","tiền sạc xe","sạc vinfast","đổ xăng xe","tiền xăng"]],
    ["dilai",    ["grab bike","grabbike","grab car","grabcar","grab","xanh sm","xanhsm","taxi","mai linh","vinasun","xe ôm","gửi xe","giữ xe","vé gửi xe","tiền gửi xe","phí gửi xe","gửi ô tô","vé xe","xe buýt","vé xe buýt","bus","metro","tàu điện","vé tàu","tàu hoả","tàu hỏa","xe khách","vé xe khách","limousine","phí đường","phí đường bộ","cầu đường","phí cầu đường","trạm thu phí","vetc","epass","be bike","be car","bebike","gojek","đi lại","phà","thuê xe","thuê xe máy","bảo hiểm xe","xe đạp công cộng","đi xe","cuốc xe","đi grab","đặt xe","xe điện"]],
    ["dienthoai",["tiền mạng","cước mạng","mạng","cước điện thoại","nạp thẻ","thẻ cào","nạp tiền điện thoại","nạp điện thoại","mua thẻ điện thoại","nạp 3g","nạp 4g","nạp 5g","3g","4g","5g","gói data","data","internet","wifi","cáp quang","truyền hình cáp","cước","viettel","vinaphone","mobifone","vietnamobile","fpt telecom","vnpt","fpt","sim","mua sim","icloud","google one","gói cước","điện thoại","tiền điện thoại","cước internet","tiền wifi","tiền internet"]],
    ["diennuoc", ["tiền điện","tiền nước","điện nước","hoá đơn điện","hóa đơn điện","hoá đơn nước","hóa đơn nước","tiền ga","bình ga","đổi ga","gas","tiền rác","phí rác","evn","tiền điện nước","nước sạch"]],
    ["nha",      ["tiền nhà","thuê nhà","tiền thuê nhà","tiền phòng","tiền trọ","phòng trọ","thuê trọ","phí quản lý","phí chung cư","phí dịch vụ chung cư","chung cư","nồi cơm điện","nồi chiên","nồi chiên không dầu","máy giặt","tủ lạnh","quạt","điều hoà","điều hòa","máy lọc nước","máy hút bụi","bàn ghế","giường","nệm","đệm","chăn","gối","ga giường","rèm","bóng đèn","xà phòng","nước giặt","nước xả","nước rửa bát","nước lau nhà","giấy vệ sinh","khăn giấy","giấy ăn","chổi","cây lau nhà","đồ dùng nhà","đồ gia dụng","gia dụng","nồi","chảo","bát đĩa","cốc chén","dọn nhà","giúp việc","osin","lau nhà","giặt là","giặt ủi","giặt sấy","giặt đồ","chuyển nhà","sửa nhà","cây cảnh","chậu cây","nến thơm","ổ cắm","thùng rác","móc quần áo"]],
    ["uong",     ["tiền nước uống","nước uống văn phòng","uống","đồ uống","chai nước","nước","lon bia","két bia","thùng bia","trà đá","trà","cà phê","cafe","café","coffee","cf","cà phê sữa","cafe sữa","bạc xỉu","nâu đá","đen đá","trà sữa","sinh tố","nước mía","nước ép","nước cam","nước dừa","dừa","bia","rượu","highlands","starbucks","phúc long","katinat","cộng cà phê","the coffee house","coffee house","trung nguyên","gong cha","tocotoco","mixue","koi","trà chanh","trà tắc","trà đào","matcha","cacao","soda","nước ngọt","nước uống","nước suối","nước khoáng","nước lọc","coca","pepsi","sting","redbull","bò húp","milo","đồ uống","nhậu","đi nhậu","nhậu bia","bia hơi","quán bia","quán nhậu","rượu vang","cocktail","trà chiều","cà phê muối","cafe muối","yaourt","sữa đậu nành","nước sâm","chè dưỡng nhan"]],
    ["cho",      ["hộp sữa","lốc sữa","thùng sữa","đi chợ","chợ","siêu thị","winmart","vinmart","coopmart","co.op","bách hoá xanh","bách hóa xanh","bhx","lotte mart","aeon","big c","go!","emart","mega market","kingfoodmart","rau","thịt","thịt lợn","thịt heo","thịt bò","thịt gà","cá","tôm","cua","mực","trứng","gạo","mắm","nước mắm","dầu ăn","đường","muối","bột ngọt","mì chính","hạt nêm","gia vị","hành","tỏi","ớt","rau củ","hoa quả","trái cây","sữa tươi","sữa chua","đồ khô","mì gói","mì tôm","đậu phụ","đậu hũ","đồ ăn về nấu","thực phẩm","thức ăn","rau muống","cà chua","khoai tây","hành tây","bí đỏ","nấm","xoài","cam","táo","nho","chuối","dưa hấu","bưởi","sầu riêng","thanh long","ổi","lê","dâu tây","bơ","mít","vải","nhãn","chôm chôm","măng cụt","sườn","ba chỉ","giò","chả lụa","xúc xích","đồ hộp","bánh mì sandwich","ngũ cốc","yến mạch","bột mì","nước tương","tương ớt","dầu hào","bánh kẹo tết"]],
    ["an",       ["ăn","cơm","phở","bún","miến","mì","mì quảng","mì cay","mì vằn thắn","hủ tiếu","cháo","bánh mì","bánh cuốn","bánh xèo","bánh canh","bánh tráng","bánh tráng trộn","bánh bao","bánh","xôi","lẩu","nướng","bbq","buffet","kfc","lotteria","jollibee","mcdonald","mcdonalds","burger king","burger","pizza","domino","sushi","gà rán","cơm tấm","cơm rang","cơm chiên","cơm gà","cơm văn phòng","cơm bình dân","cơm hộp","cơm niêu","bún chả","bún bò","bún bò huế","bún riêu","bún đậu","bún đậu mắm tôm","bún ốc","bún cá","bún mọc","bún thang","phở bò","phở gà","phở cuốn","ốc","hải sản","nem","nem rán","nem chua","nem chua rán","nem nướng","chả cá","gỏi cuốn","bò bía","chè","kem","bánh ngọt","bánh kem","bánh sinh nhật","bánh trung thu","snack","bim bim","kẹo","hướng dương","đồ ăn vặt","ăn vặt","đồ ăn","đồ ăn sáng","ăn sáng","ăn trưa","ăn tối","ăn khuya","ăn đêm","ăn uống","bữa","bữa sáng","bữa trưa","bữa tối","grabfood","shopeefood","befood","baemin","gofood","gs25","circle k","7-eleven","ministop","family mart","dimsum","mì ý","spaghetti","steak","bít tết","cháo lòng","lòng","thịt dê","lẩu dê","vịt quay","ngan","gà","bò né","bò kho","bò lá lốt","heo quay","bánh đa","cà ri","há cảo","takoyaki","tokbokki","tteokbokki","kimbap","ramen","udon","tiramisu","donut","croissant","khoai tây chiên","ngô","bắp","trứng vịt lộn","hột vịt lộn","nhà hàng","quán ăn","đặt đồ ăn","tiền ăn","cơm trưa","cơm tối","cơm chay","đồ chay","chay","bánh chưng","bánh giò","bánh khọt","bánh căn","bánh bèo","bánh flan","bánh crepe","sữa chua dẻo","sữa chua trân châu","kem tràng tiền","lẩu nướng","lẩu thái","lẩu gà","lẩu bò","nướng bbq","đồ nướng","sushi bar","gimbap","pho mai que","xiên que","xiên bẩn","cá viên chiên","phá lấu","bột chiên","bánh mì chảo","bánh mì que","cháo sườn","súp cua","bánh tráng nướng","ốc luộc","hàu nướng","trưa","sáng","tối","đồ ăn trưa","suất ăn","phần cơm","cơm ngoài","ăn ngoài","ăn nhà hàng","ăn quán","mì trộn","bún trộn","bún nem","cơm sườn","cơm phần","cơm bụi"]],
    ["muasam",   ["cái áo","chiếc áo","bộ quần áo","đôi giày","đôi dép","shopee","lazada","tiki","tiktok shop","tiktok","sendo","quần áo","áo","quần","váy","đầm","áo khoác","áo phông","áo sơ mi","quần jean","quần short","giày","giày thể thao","dép","túi","túi xách","ví da","balo","mũ","nón","kính","đồng hồ","trang sức","nhẫn","dây chuyền","bông tai","thắt lưng","tất","đồ lót","uniqlo","zara","h&m","mango","nike","adidas","mua sắm","shopping","order","đặt hàng","hàng online","phí ship","tiền ship","ship","iphone","samsung","xiaomi","oppo","laptop","máy tính","macbook","tai nghe","airpods","loa","sạc","cáp sạc","củ sạc","sạc dự phòng","ốp lưng","ốp điện thoại","chuột","bàn phím","màn hình","ipad","máy tính bảng","máy ảnh","đồ điện tử","thế giới di động","điện máy xanh","fpt shop","cellphones","mua điện thoại","điện thoại mới","đồ công nghệ","phụ kiện","quà cho mình","đồ secondhand","đồ si","thời trang","mỹ phẩm online","ô","áo mưa"]],
    ["suckhoe",  ["thuốc","mua thuốc","thuốc cảm","thuốc đau đầu","khám","khám bệnh","bệnh viện","phòng khám","nhà thuốc","pharmacity","long châu","an khang","vitamin","thực phẩm chức năng","nha khoa","răng","nhổ răng","niềng răng","lấy cao răng","trám răng","xét nghiệm","y tế","bảo hiểm y tế","bhyt","sức khoẻ","sức khỏe","tiêm","vaccine","vắc xin","tiêm phòng","khẩu trang","khám mắt","kính cận","kính mắt","vật lý trị liệu","châm cứu","gym","tập gym","phòng gym","yoga","đi bơi","bơi","bể bơi","thể thao","cầu lông","tennis","đá bóng","sân bóng","thuê sân","pickleball","chạy bộ","giày chạy","whey","thuốc bổ","siêu âm","nội soi","chụp x quang","tái khám","bảo hiểm sức khoẻ","bảo hiểm sức khỏe","bảo hiểm nhân thọ","băng cá nhân","dầu gió","nước muối sinh lý"]],
    ["lamdep",   ["cắt tóc","gội đầu","làm tóc","uốn tóc","nhuộm tóc","duỗi tóc","nail","làm nail","sơn móng","spa","massage","mát xa","mỹ phẩm","son","son môi","kem chống nắng","sữa rửa mặt","skincare","serum","toner","kem dưỡng","mặt nạ","nước hoa","làm đẹp","dầu gội","dầu xả","sữa tắm","kem đánh răng","bàn chải đánh răng","dao cạo","waxing","triệt lông","phun môi","nối mi","gội đầu dưỡng sinh","barber","hasaki","guardian","watsons","cocolux","tẩy trang","nước tẩy trang","lăn khử mùi","trang điểm","makeup","chăm sóc da","lấy mụn","xông hơi"]],
    ["hoctap",   ["học phí","khoá học","khóa học","sách","mua sách","học","vở","bút","học thêm","gia sư","tiếng anh","ielts","toeic","udemy","coursera","đồ dùng học tập","văn phòng phẩm","in ấn","in tài liệu","photo","phô tô","lệ phí thi","thi chứng chỉ","giáo trình","fahasa","học online","lớp học","workshop","khoá online","đăng ký học","tiền học","học lái xe","bằng lái"]],
    ["giaitri",  ["xem phim","phim","rạp phim","cgv","lotte cinema","bhd","galaxy cinema","beta cinemas","game","nạp game","steam","netflix","spotify","youtube premium","youtube","apple music","chatgpt plus","karaoke","hát karaoke","concert","vé concert","vé ca nhạc","ca nhạc","giải trí","vé xem","bowling","bida","bi-a","bi a","chơi game","đi chơi","công viên","khu vui chơi","xem bóng","xem bóng đá","vé bóng đá","sở thú","bảo tàng","triển lãm","câu cá","escape room","board game","boardgame","trò chơi","vinwonders","sun world","nhạc hội","liveshow","đi bar","bar","pub","club","vé xem phim","bắp nước"]],
    ["dulich",   ["du lịch","khách sạn","homestay","vé máy bay","máy bay","vietjet","vietnam airlines","bamboo","vietravel","agoda","booking","traveloka","airbnb","resort","villa","tour","đi phượt","vé tham quan","làm visa","phí visa","xin visa","hộ chiếu","đặt phòng","phòng khách sạn","thuê phòng","đi biển","nghỉ dưỡng","vé cáp treo","cáp treo","hành lý"]],
    ["concai",   ["sữa bột","bỉm","tã","đồ chơi","học phí con","học phí mầm non","học phí cho con","cho con","con cái","sữa cho con","quần áo trẻ em","đồ trẻ em","trường mầm non","nhà trẻ","mầm non","mẫu giáo","tiền học cho con","học cho con","cho bé","đồ cho bé","xe đẩy","ăn dặm","khám nhi","bỉm sữa","đồ sơ sinh","sữa cho bé","bánh ăn dặm","vở cho con","quà cho con","học thêm cho con","tiền học con","đóng học cho con","đóng tiền học"]],
    ["thucung",  ["cho con mèo","cho con chó","con mèo","con chó","cho mèo","cho chó","chó","mèo","pate","hạt cho mèo","hạt cho chó","thức ăn cho mèo","thức ăn cho chó","cát vệ sinh","cát mèo","thú cưng","thú y","spa chó","tắm chó","cắt tỉa lông","đồ chơi mèo","cá cảnh","thức ăn cá","chim cảnh","pet","pet shop","petshop","đồ cho mèo","đồ cho chó"]],
    ["hieuhy",   ["đám cưới","mừng cưới","đi đám cưới","ăn cưới","đi cưới","đám hỏi","phong bì","sinh nhật","quà","quà sinh nhật","quà tặng","tặng quà","đám hiếu","đám ma","đám tang","viếng","phúng viếng","biếu","mừng","mừng tuổi","lì xì cho","li xi cho","đầy tháng","thôi nôi","tân gia","hoa","mua hoa","bó hoa","giỗ","đồ cúng","cúng","vàng mã","mừng thọ","quà tết","biếu tết","quà 20/10","quà 8/3","quà valentine","gửi mẹ","gửi bố","gửi bố mẹ","biếu bố mẹ","cho bố mẹ","cho mẹ","cho bố","hiếu hỷ","đi viếng"]],
    ["tuthien",  ["từ thiện","ủng hộ","công đức","cúng dường","chùa","quyên góp","nhà thờ","phóng sinh","giúp đỡ","ủng hộ lũ lụt","quỹ"]],
    ["suachua",  ["vá săm","thay săm","vá lốp xe","sửa xe","sửa","thay nhớt","rửa xe","bảo dưỡng","bảo dưỡng xe","thay lốp","vá xe","vá lốp","bơm xe","sửa điện thoại","thay màn hình","thay pin","sửa máy tính","sửa laptop","sửa máy giặt","sửa điều hoà","sửa điều hòa","sửa tủ lạnh","bảo dưỡng điều hoà","bảo dưỡng điều hòa","vệ sinh điều hoà","vệ sinh điều hòa","thợ điện","thợ nước","sửa ống nước","sửa khoá","sửa khóa","đăng kiểm","thay phanh","thay má phanh","thay ắc quy","ắc quy","sơn xe","độ xe","thay dầu","sửa chữa","bảo hành","thay xích","thay săm","sửa giày","sửa quần áo","may đo","sửa đồng hồ"]],
    ["khac",     ["phí chuyển khoản","phí ngân hàng","phí thường niên","phí sms","lãi thẻ","phí trả chậm","thuế","phạt","tiền phạt","phạt nguội","rút tiền","phí rút tiền"]]
  ];
  const AMBIG = new Set(["cho","cho con","cha","con","ca","sua","ao","quan","but","vo","the","tra","an","son","chó","chợ","nuoc","che","bo","ga","dau","keo","hoa","cam","le","nho","bo","mang","hanh","duong","sach","hoc","sang","trua","toi","bua","ban","bia","banh","kem","nem","com","mi","bun","pho","oc","tom","cua","muc","ngan","ga_","chay","bar","lon","tour_"]);
  /* các từ không dấu vẫn chắc nghĩa dù gõ không dấu */
  const SAFE_UNMARKED = new Set(["com","pho","bun","banh","banh mi","mi","oc","kem","nem","bia","hoc","sach"]);
  /* từ chỉ buổi / chung chung: chỉ dùng khi không có từ nào rõ hơn ("cf sáng" là Uống, "sáng 30k" là Ăn) */
  const WEAK = new Set(["trưa","sáng","tối","bữa","ăn","mua","đồ ăn"]);
  const DICT = []; TAG_RULES.forEach(([tag, words], ti) => words.forEach(w => DICT.push({ tag, ti, w:w.toLowerCase(), n:norm(w), weak:WEAK.has(w) })));
  const DRINK2 = new Set(DICT.filter(d => d.tag === "uong" && /^tra /.test(d.n)).map(d => d.n));
  function guessTag(text, ctx){
    if(ctx && ctx.history){ const h = ctx.history(text); if(h) return h; }
    const low = " " + String(text).toLowerCase().replace(/[^\p{L}\p{N}&!.\-/%]+/gu, " ").replace(/\s+/g, " ").trim() + " ";
    const n = " " + norm(text).replace(/[^a-z0-9&!.\-/%]+/g, " ").replace(/\s+/g, " ").trim() + " ";
    let best = null, bs = 0; const markedText = hasMarks(String(text));
    const consider = (tag, ti, sc, w) => { if(sc > bs || (sc === bs && best && ti < best.ti)){ bs = sc; best = { tag, ti, w }; } };
    /* nhóm do người dùng tự tạo: tên nhóm xuất hiện trong câu */
    ((ctx && ctx.tags) || []).forEach(t => { const ln = norm(t.label || "").trim(); if(ln.length >= 3 && n.includes(" " + ln + " ")) consider(t.id, -1, ln.length * 2 + 2); });
    for(const d of DICT){
      if(low.includes(" " + d.w + " ")) consider(d.tag, d.ti, d.weak ? 1 : d.n.length * 2 + 1, d.w);
      else if(!AMBIG.has(d.n) || SAFE_UNMARKED.has(d.n)){
        /* gõ không dấu (hoặc lẫn có dấu, không dấu): so bản bỏ dấu, nhưng chỉ khi đoạn đó trong câu cũng không có dấu */
        const i = n.indexOf(" " + d.n + " ");
        if(i >= 0){ const seg = low.slice(i + 1, i + 1 + d.n.length); if((!hasMarks(seg) && !(markedText && hasMarks(d.w) && d.n.indexOf(" ") < 0)) || seg === d.w) consider(d.tag, d.ti, d.weak ? 0.5 : d.n.length * 2, d.w); }
      }
    }
    lastHit = best;
    return best ? best.tag : "khac";
  }
  /* từ cụ thể vừa dùng để đoán nhóm ("cắt tóc", "lẩu"), để tìm đúng món chứ không cả nhóm */
  let lastHit = null;
  const GENERIC_W = new Set(["ăn","uống","mua","chợ","đi chợ","đồ ăn","ăn uống","đồ uống","tiền","đi lại","mua sắm","sức khoẻ","sức khỏe","làm đẹp","học","giải trí","du lịch","con cái","thú cưng","quà","sửa","sửa chữa","nhà","điện thoại","mạng","cước","trưa","sáng","tối","bữa"]);
  function tagWord(text, ctx){ guessTag(text, ctx); const h = lastHit; return h && h.w && !GENERIC_W.has(h.w) && !WEAK.has(h.w) ? { tag:h.tag, w:h.w } : null; }

  /* ---------------- tách câu ---------------- */
  const SPLIT_WORDS = ["va","voi","roi","xong","sau do","con","them","cung","kem"];
  const SPLIT_MARK = { va:"và", voi:"với", roi:"rồi", xong:"xong", con:"còn", them:"thêm", cung:"cùng", kem:"kèm", sau:"sau", do:"đó" };
  /* có dấu mà khác dấu của từ nối thì không phải từ nối */
  const isSplit = (O, N, j) => { const w = N[j]; if(!SPLIT_WORDS.includes(w) && w !== "sau" && w !== "do") return false; const o = clean(O[j] || "").toLowerCase(); return !hasMarks(o) || o === SPLIT_MARK[w]; };
  function tokenize(text){
    const O = String(text).replace(/[ ]/g, " ").replace(/(\d)\s*([kK])\b/g, "$1$2")
      .replace(/(\d[\d.,]*\s*(?:k|đ|d|ngh|nghìn|ngàn|ngan|nghin|tr|triệu|trieu)?)\s*\/\s*(?=\p{L})/giu, "$1 mỗi ")   /* v122: "35k/ly" = 35k mỗi ly */
      .split(/\s+/).map(w => w.trim()).filter(Boolean);
    return pair(O, O.map(w => clean(norm(w))));
  }
  /* v122: số tiền đứng sau "giảm", "trừ", "voucher", "bớt", "chiết khấu" là tiền được giảm, không phải khoản mới */
  const DISC_W = ["giam","tru","bot","voucher","coupon","km"];
  function isDisc(N, i){ return DISC_W.includes(N[i-1]) || (N[i-1] === "gia" && N[i-2] === "giam") || (N[i-1] === "khau" && N[i-2] === "chiet") || (N[i-1] === "mai" && N[i-2] === "khuyen") || (DISC_W.includes(N[i-2]) && ["duoc","them","di","ma"].includes(N[i-1])); }
  /* chia thành các đoạn, mỗi đoạn tối đa một số tiền (trừ khi là câu vay/trả có một số) */
  function clauses(text){
    const parts = String(text).split(/[\n;]+|,(?!\d)|(?<!\d),|\.(?=\s+[^\d])|\s\+\s/).map(s => s.trim()).filter(Boolean);
    const out = [];
    parts.forEach(p => {
      const { O, N } = tokenize(p);
      /* trong một phần có >1 số tiền: cắt tại từ nối hoặc ngay sau mỗi số tiền */
      const amts = []; for(let i = 0; i < N.length; i++){ const a = amountAt(N, i); if(a){ if(!isDisc(N, i) || !amts.length) amts.push([i, a.n]); i += a.n - 1; } }
      if(amts.length <= 1){ out.push(pair(O, N)); return; }
      let start = 0;
      amts.forEach(([ai, an], k) => {
        if(k === amts.length - 1){ out.push(pair(O.slice(start), N.slice(start))); return; }
        let cut = ai + an;
        const nextA = amts[k+1][0];
        /* nếu sau số tiền là chữ rồi mới tới số tiếp, phần chữ đó thuộc khoản sau khi có từ nối */
        for(let j = ai + an; j < nextA; j++){ if((SPLIT_WORDS.includes(N[j]) && isSplit(O, N, j)) || (N[j] === "sau" && N[j+1] === "do" && isSplit(O, N, j))){ cut = j; break; } }
        const seg = pair(O.slice(start, cut), N.slice(start, cut));
        out.push(seg);
        start = cut;
        while(start < nextA && ((SPLIT_WORDS.includes(N[start]) && isSplit(O, N, start)) || (N[start] === "sau" && N[start+1] === "do" && isSplit(O, N, start)) || (N[start] === "do" && N[start-1] === "sau" && isSplit(O, N, start)))) start++;
      });
    });
    return out;
  }

  /* ---------------- người, thẻ, khoản vay ---------------- */
  const FILLER = new Set(["phai","can","se","sap","dinh","minh","toi","tao","em","anh_","tien","no","them","lai","cho","vay","muon","cua","tu","het","mat","ton","la","duoc","da","vua","moi","nay","qua","roi","xong","di","ve","khoan","so","tra","gui","hoan","bang","qua_","ck","chuyen","khoan_","the","mot","it","ay","do","nhe","nha","a","ah","ha","nhe!","thi"]);
  function nameFrom(O, N, from, to, drop){
    const w = [];
    for(let i = Math.max(0, from); i < Math.min(N.length, to); i++){
      /* "Minh" viết hoa là tên, "mình" là đại từ. Đầu câu (iPhone tự viết hoa) chỉ là tên khi không phải đại từ/từ thường */
      const o0 = clean(O[i] || ""), lo0 = o0.toLowerCase();
      const PRON = ["mình","tôi","tao","em","anh","chị","từ","cho","vay","mượn","trả","tiền","nợ","thêm","của","lại","đã","vừa","mới","hôm","nay","qua","cũng","đi","về","gửi"];
      const named = isCap(o0) && (i > 0 || (hasMarks(lo0) ? !PRON.includes(lo0) : !["minh","toi","tao","em","cho","vay","muon","tra","tien","no","them","cua","lai","hom","di","ve","gui"].includes(N[i])));
      if(drop.has(i) || (FILLER.has(N[i]) && !named) || amountAt(N, i) || /^\d/.test(N[i])) { if(w.length) break; else continue; }
      w.push(clean(O[i]));
    }
    return w.join(" ").trim();
  }
  function findLoan(ctx, name, type){
    if(!name || !ctx || !ctx.loans) return null;
    const n = norm(name), last = n.split(" ").pop();
    const cand = ctx.loans.filter(l => (!type || l.type === type));
    /* v116: khớp theo nguyên từ ("an" không khớp "Giang") */
    const inW = (a, b) => (" " + a + " ").includes(" " + b + " ");
    const score = l => { const w = norm(l.who); if(w === n) return 3; if(inW(w, n) || inW(n, w)) return 2; if(w.split(" ").pop() === last) return 1; return 0; };
    let best = null, bs = 0;
    cand.forEach(l => { const s = score(l) + (l.settled ? -0.5 : 0); if(s > bs){ bs = s; best = l; } });
    return bs >= 1 ? best : null;
  }
  /* v118: thẻ hay dùng nhất (app tính từ lịch sử quẹt thẻ, ctx.defaultCard) khi câu không nói thẻ nào */
  function defCard(ctx){ const cs = (ctx && ctx.cards) || [], d = ctx && ctx.defaultCard; return d && cs.some(c => c.id === d) ? d : null; }
  function findCard(ctx, N){
    const cards = (ctx && ctx.cards) || [];
    const txt = " " + N.join(" ") + " ";
    for(const c of cards){
      const cn = norm(c.name).trim(); if(!cn) continue;
      if(txt.includes(" " + cn + " ")) return c;
      const first = cn.split(" ")[0]; if(first.length >= 3 && txt.includes(" " + first + " ")) return c;
    }
    return null;
  }

  /* ví nhắc tới trong câu (v98): [{id, i, n}] theo thứ tự xuất hiện. "main" là ví mặc định (tài khoản, tiền mặt).
     Ví thêm khớp theo tên đầy đủ, hoặc chữ đầu của tên nếu đủ dài ("Momo cá nhân" → "momo"). */
  function walletsIn(ctx, N){
    const ws = (ctx && ctx.wallets) || [], out = [], used = new Set();
    const take = (id, i, n) => { for(let k = 0; k < n; k++) if(used.has(i + k)) return; for(let k = 0; k < n; k++) used.add(i + k); out.push({ id, i, n }); };
    ws.forEach(w => {
      const full = norm(w.name).split(/\s+/).map(clean).filter(Boolean); if(!full.length) return;
      let j = has(N, full);
      if(j >= 0){ take(w.id, j, full.length); return; }
      if(full[0].length >= 3 && !["the","vi","tai","tien","ngan","hang"].includes(full[0])){ j = N.indexOf(full[0]); if(j >= 0) take(w.id, j, 1); }
    });
    if(ws.length){
      [["tai","khoan"],["tien","mat"],["tk"],["tm"]].forEach(seq => { const j = has(N, seq); if(j >= 0 && !(seq[0] === "tai" && N[j-1] === "chuyen")) take("main", j, seq.length); });
    }
    return out.sort((a, b) => a.i - b.i);
  }
  const TO_W = ["sang","vao","qua","ve"], PAY_W = ["bang","qua","tu","trong","o"];
  const TOPUP_NOT = / (dien thoai|dt|3g|4g|5g|data|game|the cao|sim|dien|nuoc|hoc phi) /;

  /* ---------------- phép tính trong câu (v122) ----------------
     "3 ly trà sữa mỗi ly 35k", "2 cái áo 150k một cái", "trà sữa 35k x3", "35k/ly" → nhân số lượng
     "siêu thị 500k giảm 10%", "… được giảm 50k", "… trừ voucher 30k" → trừ
     "ăn lẩu 600k chia 4 (người)" → phần mình = 150k, giữ cả bill để đổi lại nếu mình trả hết
     Trả { amt, how:"qty"|"disc"|"split", split, total } hoặc null; đánh dấu các chữ đã dùng vào drop. */
  function calcAmount(O, N, ai, an, amt, drop){
    let v = amt, split = 0, total = 0; const how = [];
    const isN = w => /^\d{1,2}$/.test(w || "");
    /* số lượng: "x3", "x 3", "nhân 3" */
    let q = 0;
    for(let i = ai + an; i < N.length; i++){
      if(drop.has(i)) continue;
      const m = (N[i] || "").match(/^x(\d{1,2})$/);
      if(m){ q = +m[1]; drop.add(i); break; }
      if((N[i] === "x" || clean(O[i]).toLowerCase() === "nhân") && isN(N[i+1])){ q = +N[i+1]; drop.add(i).add(i+1); break; }
    }
    /* đơn giá: "mỗi ly 35k", "35k mỗi ly", "35k một cái", "35k 1 ly"; số lượng là "3 ly …" ở chỗ khác trong câu */
    if(!q){
      let per = false;
      for(let i = 0; i < N.length && !per; i++){
        if(drop.has(i)) continue;
        if(N[i] === "moi" && clean(O[i]).toLowerCase() !== "mới"){ per = true; drop.add(i); if(COUNTERS.has(N[i+1]) && i + 1 !== ai) drop.add(i+1); }
        else if(i >= ai + an && (N[i] === "mot" || N[i] === "1") && COUNTERS.has(N[i+1])){ per = true; drop.add(i).add(i+1); }
      }
      if(per) for(let i = 0; i < N.length; i++){ if(i !== ai && !drop.has(i) && isN(N[i]) && N[i] !== "1" && COUNTERS.has(N[i+1])){ q = +N[i]; break; } }
    }
    if(q >= 2 && q <= 99){ v *= q; how.push("qty"); }
    /* giảm giá: "giảm 10%", "sale 20%", "giảm 50k", "trừ voucher 30k" */
    for(let i = ai + an; i < N.length; i++){
      const pm = (O[i] || "").match(/^(\d{1,2})\s*%$/);
      if(pm && N.slice(Math.max(0, i - 3), i).some(w => ["giam","sale","off","khau","km","mai","bot"].includes(w))){
        v = Math.round(v * (100 - +pm[1]) / 100); how.push("disc");
        for(let k = Math.max(0, i - 3); k <= i; k++) if(k === i || ["giam","gia","sale","off","duoc","chiet","khau","khuyen","mai","km","bot"].includes(N[k])) drop.add(k);
        break;
      }
      if(isDisc(N, i)){
        const a = amountAt(N, i);
        if(a && a.v < v){
          v -= a.v; how.push("disc");
          for(let k = 0; k < a.n; k++) drop.add(i + k);
          for(let k = Math.max(0, i - 2); k < i; k++) if(DISC_W.concat(["gia","duoc","them","di","ma","chiet","khau","khuyen","mai"]).includes(N[k])) drop.add(k);
          i += a.n - 1;
        }
      }
    }
    /* chia tiền: "chia 4", "chia đều 4 người", "chia cho 3 đứa" */
    const ic = N.indexOf("chia");
    if(ic >= 0){
      let j = ic + 1; while(["deu","cho","ra","lam"].includes(N[j])) j++;
      if(isN(N[j]) && +N[j] >= 2){
        split = +N[j]; total = v; v = Math.round(v / split); how.push("split");
        for(let k = ic; k <= j; k++) drop.add(k);
        if(["nguoi","dua","phan","ban","suat","anh em"].includes(N[j+1])) drop.add(j+1);
      }
    }
    return how.length ? { amt:v, how:how.join("+"), split, total } : null;
  }

  /* ---------------- hiểu một đoạn ---------------- */
  const INC_RULES = [
    ["luong", [["luong"]]],
    ["thuong",[["thuong"],["hoa","hong"],["bonus"]]],
    ["ban",   [["ban","duoc"],["ban","hang"],["ban"]]],
    ["cho",   [["duoc","cho"],["duoc","tang"],["duoc","bieu"],["li","xi"],["lixi"],["mung","tuoi"],["duoc","mung"]]],
    ["khac",  [["hoan","tien"],["tien","ve"],["ve","tai","khoan"],["nhan","tien"],["nhan","duoc"],["thu","nhap"],["co","nguoi","chuyen"],["chuyen","cho","minh"],["chuyen","cho","toi"],["lai","tiet","kiem"],["tien","lai"],["lai","ngan","hang"],["thu","tien"],["khach","chuyen"],["khach","tra"],["khach","gui"],["khach","thanh","toan"],["thu","tien","hang"],["ung","luong"],["tam","ung"],["tien","hoan"],["duoc","hoan"],["hoan","lai"]]]
  ];
  const has = (N, seq) => { for(let i = 0; i + seq.length <= N.length; i++) if(seq.every((w, k) => N[i+k] === w)) return i; return -1; };

  function oneClause(c, ctx, carry){
    const { O, N } = c;
    const now = ctx.now || new Date();
    const dt = dateIn(N, now);
    let amtI = -1, amt = 0, amtN = 0;
    for(let i = 0; i < N.length; i++){ if(dt.drop.has(i)) continue; const a = amountAt(N, i); if(a){ amtI = i; amt = a.v; amtN = a.n; break; } }
    const drop = new Set(dt.drop); for(let k = 0; k < amtN; k++) drop.add(amtI + k);
    const calc = amt ? calcAmount(O, N, amtI, amtN, amt, drop) : null;
    if(calc){ amt = calc.amt; }
    const date = dt.date || carry.date || keyOf(now);
    const hh = dt.hh !== null ? dt.hh : carry.hh;
    const item = { amt, date, cardId:null, who:"", loanId:null, src:"tk" };
    if(calc){ item.calc = calc.how; if(calc.split){ item.split = calc.split; item.total = calc.total; } }
    let t;
    if(date === keyOf(now) && hh === null) t = now.getTime();
    else { const d = new Date(date + "T12:00:00"); if(hh !== null){ d.setHours(hh, dt.mm || 0, 0, 0); } else d.setHours(now.getHours(), now.getMinutes(), 0, 0); t = d.getTime(); }
    item.t = t;
    const meta = { date:dt.date || carry.date, hh };
    if(!amt) return { item:null, meta, text:O.join(" ") };

    const txt = " " + N.join(" ") + " ";
    const hasW = w => txt.includes(" " + w + " ");
    const markDrop = seq => { const i = has(N, seq); if(i >= 0) for(let k = 0; k < seq.length; k++) drop.add(i+k); return i; };
    let kind = null;

    /* chuyển tiền giữa các ví của mình (v98): "nạp momo 500k", "chuyển 1tr sang momo", "rút 300k từ momo về tài khoản" */
    const WS = walletsIn(ctx, N), WX = WS.filter(m => m.id !== "main");
    if(WX.length){
      const verb = hasW("nap") ? "nap" : hasW("rut") ? "rut" : hasW("chuyen") ? "chuyen" : null;
      let from = null, to = null, payBy = false;
      WS.forEach(m => {
        const p = N[m.i - 1], p2 = N[m.i - 2];
        if(p === "tu"){ if(!from) from = m.id; }
        else if(TO_W.includes(p) || (p === "tien" && TO_W.includes(p2))){ if(!to) to = m.id; }
        else if(p === "nap" || (p === "tien" && p2 === "nap")){ if(!to) to = m.id; }
        else if(p === "rut" || (p === "tien" && p2 === "rut")){ if(!from) from = m.id; }
        else if(p === "bang") payBy = true;
      });
      const free = WX.find(m => m.id !== from && m.id !== to);
      if(verb === "nap" && !payBy && !TOPUP_NOT.test(txt)){ if(!to && free) to = free.id; if(!from) from = "main"; }
      else if(verb === "rut"){ if(!from && free) from = free.id; if(!to) to = "main"; }
      else if(verb === "chuyen"){ if(to && !from) from = "main"; else if(!to) from = null; }
      else { from = to = null; }
      if(from && to && from !== to){
        kind = "xfer"; item.from = from; item.to = to;
        WS.forEach(m => { for(let k = 0; k < m.n; k++) drop.add(m.i + k); });
      }
    }

    /* số dư thật */
    if(!kind && WX.length && hasW("con") && !hasW("tieu") && !hasW("chi")) kind = "bal";
    if(!kind && (hasW("so du") || (hasW("tai khoan") && hasW("con")) || (hasW("tk") && hasW("con")) || (hasW("vi") && hasW("con") && !hasW("tieu")))){
      kind = "bal";
    }
    /* trả thẻ */
    if(!kind && (has(N, ["tra","the"]) >= 0 || has(N, ["tra","no","the"]) >= 0 || / tra (het |bot |them |not |)(no |tien |)the /.test(txt) || has(N, ["thanh","toan","the"]) >= 0 || has(N, ["tat","toan","the"]) >= 0)){
      kind = "cardpay";
      const cd = findCard(ctx, N); if(cd) item.cardId = cd.id;
      else { const cs = (ctx && ctx.cards) || []; item.cardId = cs.length === 1 ? cs[0].id : defCard(ctx); if(cs.length > 1 && item.cardId) item.cardGuess = true; }
    }
    /* vay mượn */
    if(!kind){
      /* v122: "trà" (có dấu) không phải "trả" */
      const traIdx = N.findIndex((w, i) => w === "tra" && (!hasMarks(clean(O[i]).toLowerCase()) || clean(O[i]).toLowerCase() === "trả"));
      const iCho = N.indexOf("cho");
      const iVay = N.findIndex((w, i) => (w === "vay" || w === "muon") && i > 0);
      const meIdx = N.findIndex((w, i) => (w === "minh" || w === "toi" || w === "tao" || w === "em") && !(i > 0 && isCap(clean(O[i]))));
      const meAfterVay = iVay > 0 && ["minh","toi","em","tao"].includes(N[iVay+1]) && !isCap(clean(O[iVay+1] || "x")) && iCho < 0;
      if(meAfterVay){ kind = "lend"; item.who = nameFrom(O, N, 0, iVay, drop) || (isCap(clean(O[0])) ? clean(O[0]) : ""); }
      else if(iCho >= 0 && iVay > iCho){
        /* "cho X vay" (mình cho vay) hoặc "X cho mình vay" (mình đi vay) */
        const meBetween = N.some((w, i) => i > iCho && i < iVay && (w === "minh" || w === "toi" || w === "tao" || w === "em") && !isCap(clean(O[i])) && !(w === "em" && ["gai","trai","ho","re","dau","be","con"].includes(N[i+1])));
        if(meBetween){ kind = "borrow"; item.who = nameFrom(O, N, 0, iCho, drop) || (iCho === 1 && isCap(clean(O[0])) ? clean(O[0]) : ""); }
        else { kind = "lend"; item.who = nameFrom(O, N, iCho + 1, iVay, drop); if(!item.who){ let st = iVay + 1; while(["them","tien"].includes(N[st])) st++; item.who = nameFrom(O, N, st, N.length, drop); } }
      } else if(has(N, ["vay"]) >= 0 || has(N, ["muon"]) >= 0){
        const iv = Math.max(N.indexOf("vay"), N.indexOf("muon") >= 0 && N.indexOf("vay") < 0 ? N.indexOf("muon") : -1);
        if(iv >= 0 && traIdx < 0){ kind = "borrow"; let st = iv + 1; while(["cua","tu","them","tien"].includes(N[st]) && !(N[st] === "tu" && (isCap(clean(O[st])) || clean(O[st]).toLowerCase() === "tú"))) st++; item.who = nameFrom(O, N, st, N.length, drop) || nameFrom(O, N, 0, iv, drop); }
      }
      /* v116: "thẻ trả ăn 1 triệu", "trả tiền ăn 200k": trả = trả tiền cho khoản chi, không phải trả nợ.
         Có nhắc thẻ (mà không phải "trả thẻ") hoặc ngay sau "trả" là một khoản chi (ăn, cà phê, xăng…) thì để phần chi tiêu xử lý. */
      let payFor = false;
      if(!kind && traIdx >= 0 && !hasW("no")){
        const it0 = traIdx; let s0 = it0 + 1; while(N[s0] === "tien" || N[s0] === "cho") s0++;
        const restTxt = O.slice(s0).filter((w, i) => !/\d/.test(w)).join(" ");
        /* trước "trả" có người khác ("con trả tiền học") thì còn mơ hồ: không tự quyết */
        const beforeMe = N.slice(0, it0).every((w, i) => ["minh","toi","em","tao","hom","nay","qua","sang","trua","toi","chieu","vua","phai","can","se","sap","dinh","mai","ngay","du","kien","moi","da"].includes(w) || drop.has(i));
        const isDrink = !hasMarks(clean(O[it0])) && DRINK2.has("tra " + (N[it0+1] || ""));   /* "tra dao" (trà đào) gõ không dấu */
        if(!isDrink && (N.includes("the") || (beforeMe && restTxt && guessTag(restTxt, ctx) !== "khac"))){ payFor = true; drop.add(it0); }
      }
      if(!kind && !payFor && traIdx >= 0 && !DRINK2.has("tra " + (N[traIdx+1] || ""))){
        const it = traIdx;
        const before = nameFrom(O, N, 0, it, drop);
        const giveBack = ["no","tien","lai","cho","bot","het","them","not","dan"];
        let st = it + 1; while(giveBack.includes(N[st])) st++;
        const after = nameFrom(O, N, st, N.length, drop);
        const meAfter = N.slice(it).some(w => w === "minh" || w === "toi" || w === "tao" || w === "em");
        const isDebtWord = hasW("no") || hasW("tra lai") || hasW("tra tien") || hasW("gui") || hasW("hoan");
        if(before && (meAfter || isDebtWord || findLoan(ctx, before, "lend"))){ kind = "collect"; item.who = before; }
        else if(after && (hasW("no") || findLoan(ctx, after, "borrow") || hasW("tra lai"))){ kind = "repay"; item.who = after; }
      }
      if(kind === "lend" || kind === "borrow" || kind === "repay" || kind === "collect"){
        const type = (kind === "lend" || kind === "collect") ? "lend" : "borrow";
        const l = findLoan(ctx, item.who, type);
        if(l){ item.loanId = l.id; item.who = l.who; }
        if((kind === "repay" || kind === "collect") && !l){
          /* không tìm thấy khoản vay để trả: để người dùng chọn trong thẻ xác nhận */
          item.loanMissing = true;
        }
      }
    }
    /* "mẹ cho 2 triệu", "anh Hai cho 500k": người khác cho mình tiền */
    const GIVERS = new Set(["me","bo","ba","cha","ong","ba","co","chu","bac","di","cau","mo","anh","chi","vo","chong","sep","ngoai","noi","bo_me"]);
    if(!kind){
      const ic = N.indexOf("cho");
      const diNotAunt = N[0] === "di" && !/^dì$/i.test(clean(O[0]));
      /* v111: "Đóng tiền học cho Mon 500k" là chi: trước "cho" có động từ/từ chi tiêu thì không phải "ai đó cho mình";
         chữ hoa đầu câu (iPhone tự viết hoa) không đủ để coi là tên người: mọi chữ trước "cho" đều phải viết hoa */
      const SPENDW = [hasMarks(clean(O[0] || "")) && clean(O[0]).toLowerCase() === "chị" ? "chi_" : "chi","mua","tra","tieu","an","nap","gui","dong","nop","chuyen","tang","dat","thue","lam","sua","gop","mung","bieu","uong","tien","phi","hoc","xin"];
      const nameLike = O.slice(0, ic).every(w => isCap(clean(w)));
      const giverSend = ic > 0 && ic <= 3 && GIVERS.has(N[0]) && ["chuyen","gui","ck","bank"].includes(N[ic-1]) && (ic + 1 >= N.length || amountAt(N, ic + 1) || ["minh","toi","em"].includes(N[ic+1]));
      if(giverSend){ kind = "in"; item.cat = "cho"; item.who = clean(O[0]); }
      else if(ic > 0 && ic <= 3 && !diNotAunt && N.indexOf("vay") < 0 && N.indexOf("muon") < 0 && (GIVERS.has(N[0]) || nameLike) && N.slice(0, ic).every(w => !SPENDW.includes(w))){
        kind = "in"; item.cat = "cho"; item.who = nameFrom(O, N, 0, ic, drop);
      }
    }
    /* khoản thu */
    if(!kind){
      for(const [cat, seqs] of INC_RULES){ for(const s of seqs){ const j = has(N, s); if(j >= 0){
        /* v122: "phí thường niên" không phải "thưởng"; có dấu thì so đúng dấu */
        if(s[0] === "tien" && s[1] === "ve" && (N[j-1] === "gui" || N[j-1] === "chuyen" || hasW("cho bo") || hasW("cho me"))) continue;
        if(s[0] === "thuong"){ const o = clean(O[j]).toLowerCase(); if(hasMarks(o) && o !== "thưởng") continue; if(!hasMarks(o) && (N[j+1] === "nien" || N[j-1] === "phi")) continue; }
        kind = "in"; item.cat = cat; break; } } if(kind) break; }
      if(kind === "in" && item.cat === "ban" && (hasW("mua") || hasW("tieu"))){ kind = null; delete item.cat; }
      /* v117: "nhậu với bạn 300k": "bạn" (người) không phải "bán"; gõ không dấu thì "với/cho/của ban" là bạn */
      if(kind === "in" && item.cat === "ban" && !hasW("ban duoc") && !hasW("ban hang")){
        const ib = N.indexOf("ban"), ob = ib >= 0 ? clean(O[ib]).toLowerCase() : "";
        if(ib >= 0 && (hasMarks(ob) ? ob !== "bán" : ["voi","vs","cung","cho","cua","cac","may","nhom","ban","va"].includes(N[ib-1]))){ kind = null; delete item.cat; }
      }
      /* "nhận 1 triệu từ công đoàn", "tôi nhận 500k" → khoản thu (v103); "nhận hàng", "nhận ship" là chi */
      if(!kind && hasW("nhan") && !hasW("nhan hang") && !hasW("nhan don") && !hasW("ship") && !hasW("mua") && !hasW("tra")){ kind = "in"; item.cat = "khac"; }
    }
    /* chi bằng thẻ hay tài khoản */
    if(!kind){
      const card = findCard(ctx, N);
      /* v122: "giày thể thao", "nạp thẻ viettel", "thẻ cào", "mua thẻ điện thoại" không phải quẹt thẻ tín dụng */
      const notCard = i => ["thao","cao","dien","game","nap","viettel","vina","vinaphone","mobi","mobifone","sim","cao_"].includes(N[i+1]) || ["nap","mua"].includes(N[i-1]) || N[i+1] === "dt";
      const theIdx = O.findIndex((w, i) => N[i] === "the" && (/thẻ/i.test(w) || !hasMarks(O.join(" "))) && !notCard(i));
      const byCard = card || theIdx >= 0 || hasW("visa") || hasW("credit") || hasW("mastercard") || (hasW("ca") && theIdx >= 0);
      if(byCard){
        kind = "card";
        const cards = (ctx && ctx.cards) || [];
        item.cardId = card ? card.id : (cards.length === 1 ? cards[0].id : defCard(ctx));
        if(!card && cards.length > 1 && item.cardId) item.cardGuess = true;   /* v119: không nói thẻ nào → thẻ hay dùng nhất, người dùng đổi được trên thẻ xác nhận */
        if(theIdx >= 0){ drop.add(theIdx); ["quet","ca","bang","qua","the"].forEach(w => { const j = N.indexOf(w); if(j >= 0 && Math.abs(j - theIdx) <= 1) drop.add(j); }); }
        if(card){ const cn = norm(card.name).split(" "); const j = has(N, cn); if(j >= 0) for(let k = 0; k < cn.length; k++) drop.add(j+k); else { const j2 = N.indexOf(cn[0]); if(j2 >= 0) drop.add(j2); } }
      } else {
        kind = "out";
        if(hasW("tien mat") || hasW("tm")){ item.src = "cash"; markDrop(["tien","mat"]); const tm = N.indexOf("tm"); if(tm >= 0) drop.add(tm); }
        markDrop(["chuyen","khoan"]); const ck = N.indexOf("ck"); if(ck >= 0) drop.add(ck);
      }
    }
    item.kind = kind;
    /* khoản chi/thu/số dư/trả thẻ nói rõ ví nào ("cafe 30k momo", "lương về techcombank") */
    if(WX.length && (kind === "out" || kind === "in" || kind === "bal" || kind === "cardpay")){
      const m = WX[0]; item.w = m.id;
      for(let k = 0; k < m.n; k++) drop.add(m.i + k);
      if(PAY_W.includes(N[m.i - 1]) || TO_W.includes(N[m.i - 1])) drop.add(m.i - 1);
      if(kind === "out"){ delete item.src; }
    }

    /* nội dung: phần chữ còn lại, bỏ từ thừa */
    const SKIP = new Set(["het","mat","ton","la","tieu","chi","bang","qua","luc","vao","o","tai","duoc","da","vua","moi","roi","xong","thi"]);
    const PARTICLE = new Set(["nhé","nha","nhe","nhỉ","à","ạ","a","thôi","nhá","đó","đấy"]);
    const words = [];
    /* v122: từ thừa so cả dấu: "xem bóng đá" giữ "đá" (khác "đã"), "giặt là" giữ "là", "hết/mất/tốn" mới bỏ ("mắt" giữ lại) */
    const SKIP_MARK = { het:"hết", mat:"mất", ton:"tốn", la:"là", tieu:"tiêu", chi:"chi", bang:"bằng", qua:"qua", luc:"lúc", vao:"vào", o:"ở", tai:"tại", duoc:"được", da:"đã", vua:"vừa", moi:"mới", roi:"rồi", xong:"xong", thi:"thì" };
    const isSkip = (w, n) => { if(!SKIP.has(n)) return false; const o = clean(w).toLowerCase(); return !hasMarks(o) || o === SKIP_MARK[n]; };
    O.forEach((w, i) => { if(drop.has(i)) return; const n = N[i]; if(!n) return; if(PARTICLE.has(clean(w).toLowerCase())) return;
      if(isSkip(w, n) && !(n === "la" && N[i-1] === "giat") && (words.length === 0 || i === O.length - 1 || ["het","mat","ton"].includes(n))) return; words.push(clean(w) || w); });
    while(words.length && ((isSkip(words[words.length-1], norm(words[words.length-1])) && !(norm(words[words.length-1]) === "la" && norm(words[words.length-2] || "") === "giat")) || PARTICLE.has(words[words.length-1].toLowerCase()))) words.pop();
    /* bỏ đại từ ở đầu nội dung: "Tôi nhận từ công đoàn" → "Nhận từ công đoàn" */
    while(words.length > 1 && ["toi","minh","tao"].includes(norm(words[0]))) words.shift();
    let note = words.join(" ").replace(/\s+/g, " ").trim();
    if(kind === "lend" || kind === "borrow" || kind === "repay" || kind === "collect" || kind === "bal" || kind === "cardpay" || kind === "xfer") note = "";
    if(kind === "in" && /^(nhận|nhan|được|duoc)$/i.test(note)) note = "";
    if(kind === "in" && item.cat === "cho" && item.who && !note) note = item.who + " cho";
    item.note = note ? note.charAt(0).toUpperCase() + note.slice(1) : "";
    if(kind === "out" || kind === "card"){
      const tagText = O.filter((w, i) => !drop.has(i)).join(" ");
      item.cat = guessTag(tagText.trim() ? tagText : O.join(" "), ctx);
    }
    return { item, meta };
  }

  /* ---------------- câu hỏi ---------------- */
  /* câu hỏi muốn xem chi tiết, liệt kê, gom nhóm, phân tích → báo cáo (q:"report") thay vì một con số tổng */
  const REPORT = / (gi|nhung gi|cai gi|khoan gi|khoan nao|nhung khoan|cac khoan|tung khoan|liet ke|chi tiet|cu the|phan tich|thong ke|tong hop|bao cao|gom nhom|gom lai|theo nhom|theo loai|theo danh muc|theo ngay|theo tuan|theo thang|vao dau|vao viec gi|cho viec gi|vao nhung gi|o dau|di dau|bay dau|di dau het|dau het|top|lon nhat|nhieu tien nhat|khoan to|so voi|so sanh|co nhieu hon|co it hon|nhieu hon|it hon|tang hay giam) /;
  function periodOf(n, now){
    const pad2 = x => String(x).padStart(2, "0"), k = d => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
    let m;
    if((m = n.match(/ tu (?:ngay )?(\d{1,2})(?:[\/\-](\d{1,2}))? (?:den|toi|-) (?:ngay )?(\d{1,2})(?:[\/\-](\d{1,2}))? /))){
      const mo1 = m[2] ? +m[2] - 1 : now.getMonth(), mo2 = m[4] ? +m[4] - 1 : (m[2] ? +m[2] - 1 : now.getMonth());
      const a = new Date(now.getFullYear(), mo1, +m[1]), b = new Date(now.getFullYear(), mo2, +m[3]);
      if(a <= b) return { period:"custom", from:k(a), to:k(b) };
    }
    if((m = n.match(/ (\d{1,3}) ngay (qua|gan day|gan nhat|vua roi|truoc) /))){ const b = new Date(now), a = new Date(now); a.setDate(a.getDate() - (+m[1]) + 1); return { period:"custom", from:k(a), to:k(b) }; }
    if((m = n.match(/ thang (\d{1,2})(?:[\/\-](\d{4}))? /)) && +m[1] >= 1 && +m[1] <= 12){
      let y = m[2] ? +m[2] : now.getFullYear(); if(!m[2] && +m[1] - 1 > now.getMonth()) y--;
      const a = new Date(y, +m[1] - 1, 1), b = new Date(y, +m[1], 0); return { period:"custom", from:k(a), to:k(b) };
    }
    if(/ nam nay /.test(n)) return { period:"year" };
    if(/ nam (ngoai|truoc|roi) /.test(n)){ const y = now.getFullYear() - 1; return { period:"custom", from:y + "-01-01", to:y + "-12-31" }; }
    if(/ thang (truoc|roi) /.test(n)) return { period:"lastmonth" };
    if(/ thang nay /.test(n)) return { period:"month" };
    if(/ tuan (truoc|roi) /.test(n)) return { period:"lastweek" };
    if(/ tuan nay /.test(n)) return { period:"week" };
    if(/ hom qua | hqua /.test(n)) return { period:"yesterday" };
    if(/ hom nay | hnay | nay /.test(n)) return { period:"today" };
    return { period:null };
  }
  /* ---------------- khoản sắp tới & gợi ý tiết kiệm (v123) ----------------
     "có khoản dự kiến cho vay nào không", "từ nay tới cuối tháng có khoản chi nào", "tuần sau phải trả gì"
       → { q:"upcoming", from, to, only:"lend"|"borrow"|"out"|"in"|"due"|null, label }
     "nên tiết kiệm gì", "tháng này nên cắt giảm khoản nào" → { q:"save", period } */
  const UP_STRONG = / (du kien|du tinh|sap toi|sap den|sap phai|sap co|sap chi|sap tra|sap thu|sap nhan|sap cho vay|cac ngay toi|nhung ngay toi|may ngay toi|ngay toi|thoi gian toi|sau hom nay|tu nay (den|toi)|tu hom nay (den|toi)|tu mai (den|toi)|den cuoi thang|toi cuoi thang|het thang|con lai cua thang|nhung ngay con lai|den han|toi han|sap den han|tuan toi|tuan sau|thang toi|thang sau|ngay mai|\d{1,3} ngay toi|lich (chi|tra|thu|no)|ke hoach (chi|tra|thu)|se (phai )?(chi|tra|thu|nhan|cho vay|vay)|chua toi|chua den) /;
  const UP_ASK = / (gi|nao|khong|ko|chua|nhung|cac|co|bao nhieu|bn|xem|liet ke|ke|lich|khoan|giao dich|phai|can|ai|nhi|dau) /;
  function upcomingOf(n, now){
    if(!UP_STRONG.test(n) || !UP_ASK.test(n)) return null;
    if(/ (co nen|nen (mua|chi|tieu|vay|dau tu|tra gop)|du doan|uoc tinh|bao nhieu la du|nen tieu bao nhieu) /.test(n)) return null;   /* xin lời khuyên, dự đoán: để AI */
    const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()), k = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const add = (d, x) => { const y = new Date(d); y.setDate(y.getDate() + x); return y; };
    const wd = (d0.getDay() + 6) % 7;                                           /* 0 = thứ Hai */
    let from = d0, to = new Date(now.getFullYear(), now.getMonth() + 1, 0), label = "từ nay đến hết " + to.getDate() + "/" + (to.getMonth() + 1);
    let m;
    if(/ (tuan sau|tuan toi) /.test(n)){ from = add(d0, 7 - wd); to = add(from, 6); label = "tuần sau"; }
    else if(/ (thang sau|thang toi) /.test(n)){ from = new Date(now.getFullYear(), now.getMonth() + 1, 1); to = new Date(now.getFullYear(), now.getMonth() + 2, 0); label = "tháng sau"; }
    else if(/ (cuoi tuan) /.test(n)){ from = add(d0, Math.max(0, 5 - wd)); to = add(d0, 6 - wd); label = "cuối tuần này"; }
    else if(/ tuan nay /.test(n)){ to = add(d0, 6 - wd); label = "từ nay đến hết tuần"; }
    else if(/ ngay mai /.test(n) && !/ (tu|sau) ngay mai /.test(n)){ from = add(d0, 1); to = from; label = "ngày mai"; }
    else if((m = n.match(/ (\d{1,3}) ngay toi /))){ to = add(d0, +m[1]); label = m[1] + " ngày tới"; }
    else if(/ nam nay /.test(n)){ to = new Date(now.getFullYear(), 11, 31); label = "từ nay đến hết năm"; }
    let only = null;
    if(/ cho (minh|toi|em|tao) (vay|muon) /.test(n)) only = "borrow";
    else if(/ cho ([a-z]+ ){0,3}(vay|muon) /.test(n)) only = "lend";
    else if(/ (di vay|vay|muon) /.test(n)) only = "borrow";
    else if(/ (den han|toi han|tra no|no phai tra|phai tra no|thu no|doi no) /.test(n)) only = "due";
    else if(/ (khoan thu|thu nhap|tien ve|se nhan|sap nhan|luong ve|duoc nhan) /.test(n)) only = "in";
    else if(/ (khoan chi|chi tieu|phai chi|se chi|sap chi|thanh toan|phai tra tien|dong tien|hoa don) /.test(n)) only = "out";
    return { q:"upcoming", from:k(from), to:k(to), only, label };
  }
  const SAVE_W = / (tiet kiem|bot tieu|giam chi|giam tieu|cat giam|cat bot|bot chi|chi it lai|tieu it lai|de danh|thắt lung|that lung buoc bung|bot lai|cat chi) /;
  const SAVE_ASK = / (gi|cai gi|khoan nao|nhom nao|muc nao|o dau|cho nao|the nao|ra sao|lam sao|lam the nao|nen|can|phai|goi y|tu van|bang cach nao|duoc khong|duoc o dau|cach nao|meo) /;
  function saveOf(n){ return SAVE_W.test(n) && SAVE_ASK.test(n) && !/ (tiet kiem|de danh) duoc (roi|nhieu|it|\d)/.test(n) ? true : false; }

  /* ---------------- ngữ cảnh từ dữ liệu của bạn (v124) ----------------
     App đưa vào ctx.know = { ng:{ "highlands":{c:12,l:"Highlands"}, "bun cha ha":{…} }, people:["Mẹ","Nam",…] }:
     các cụm 1–4 chữ có trong nội dung khoản đã ghi (đếm số lần), và tên người (khoản vay, người nhận, người thân).
     Câu hỏi nhắc tới cụm nào trong đó (tên quán, thương hiệu, nội dung riêng) thì lọc đúng theo cụm đó (kw),
     nhắc tới người nào thì hỏi về người đó. */
  const BRANDS = new Set(["grab","grab bike","grab car","be","xanh sm","gojek","taxi","shopee","lazada","tiki","tiktok","tiktok shop","sendo","highlands","starbucks","phuc long","katinat","the coffee house","coffee house","cong ca phe","trung nguyen","gong cha","tocotoco","mixue","koi","kfc","lotteria","jollibee","mcdonald","mcdonalds","burger king","domino","pizza hut","winmart","vinmart","coopmart","bach hoa xanh","bhx","lotte mart","aeon","big c","emart","circle k","gs25","7-eleven","ministop","family mart","cgv","lotte cinema","bhd","galaxy cinema","netflix","spotify","youtube","icloud","viettel","vinaphone","mobifone","fpt","evn","petrolimex","pharmacity","long chau","an khang","uniqlo","zara","nike","adidas","vietjet","vietnam airlines","bamboo","agoda","booking","traveloka","airbnb","grabfood","shopeefood","befood","baemin","guardian","watsons","hasaki","fahasa","dien may xanh","the gioi di dong","fpt shop","cellphones","ikea","decathlon","bun dau","pho thin","pho 10"]);
  const DICTN = new Set(DICT.map(d => d.n));
  /* chữ dùng để hỏi / chỉ thời gian: không coi là tên nơi, nội dung */
  const STOPQ = new Set(("tieu chi xai het ton bao nhieu bn thang tuan nam ngay hom nay qua truoc roi mua lan lien ke cac khoan nhung gi nao may o dau cho ai voi va cua minh toi tien tong la khi nao gan nhat cuoi cung lan cuoi trung binh moi mot tim kiem xem liet co khong chua da duoc den toi tu tren duoi hon it nhieu nhat bao lau ve di an uong the tai khoan vi so du con lai sao vay_ nhi a nhe nha oi thi cai gia tri giao dich lich su chuyen gui nhan tra no vay muon dong nop ki ky dot sang trua chieu toi dem cuoi dau ").split(" ").filter(Boolean));
  const FAMILY = ["mẹ","bố","ba","má","vợ","chồng","ông","bà","ông bà","bố mẹ","ba mẹ","anh hai","chị hai","em gái","em trai","con gái","con trai","sếp"];
  function knownIn(text, ctx){
    const know = ctx && ctx.know; if(!know || !know.ng) return null;
    const O = String(text).replace(/[?!.,:;]/g, " ").split(/\s+/).filter(Boolean), N = O.map(w => clean(norm(w)));
    let best = null;
    const cover = new Set();
    for(let len = Math.min(4, N.length); len >= 2; len--) for(let i = 0; i + len <= N.length; i++){ const ng = N.slice(i, i + len).join(" "); if(DICTN.has(ng) && !BRANDS.has(ng)) for(let j = i; j < i + len; j++) cover.add(j); }
    for(let len = Math.min(4, N.length); len >= 1 && !best; len--){
      for(let i = 0; i + len <= N.length; i++){
        const seg = N.slice(i, i + len), ng = seg.join(" ");
        if(ng.length < 3 || seg.every(w => STOPQ.has(w) || /^\d/.test(w))) continue;
        if(STOPQ.has(seg[0]) && len > 1) continue;
        let inside = true; for(let j = i; j < i + len; j++) if(!cover.has(j)) inside = false;
        if(inside && !BRANDS.has(ng)) continue;
        const hit = know.ng[ng]; if(!hit) continue;
        if(DICTN.has(ng) && !BRANDS.has(ng)) continue;                       /* từ chung ("ăn", "cà phê") để nhóm chi lo */
        const orig = O.slice(i, i + len).join(" ").toLowerCase(), lab = String(hit.l || "").toLowerCase();
        if(hasMarks(orig) && hasMarks(lab) && orig !== lab) continue;          /* "năm" không khớp "Nam" */
        best = { kw:ng, label:hit.l || O.slice(i, i + len).join(" "), c:hit.c || 1 };
        break;
      }
    }
    return best;
  }
  function peopleIn(text, ctx){
    const names = [].concat(((ctx && ctx.loans) || []).map(l => l.who), ((ctx && ctx.know && ctx.know.people) || []));
    const low = " " + String(text).toLowerCase().replace(/[?!.,:;]/g, " ").replace(/\s+/g, " ") + " ", n = " " + norm(text).replace(/[?!.,:;]/g, " ").replace(/\s+/g, " ") + " ";
    const out = [], seen = new Set();
    names.forEach(nm => {
      nm = String(nm || "").trim(); if(!nm || seen.has(nm.toLowerCase())) return;
      const full = norm(nm).trim(), lw = nm.toLowerCase(), last = full.split(" ").pop(), lastO = lw.split(" ").pop();
      let ok = false;
      if(low.includes(" " + lw + " ")) ok = true;
      else if(!hasMarks(low) && n.includes(" " + full + " ")) ok = true;
      else if(hasMarks(lastO) && lastO.length >= 2 && low.includes(" " + lastO + " ")) ok = true;
      else { /* "Tuấn béo", "Hùng xe ôm": tên đứng đầu (không phải danh xưng anh/chị/cô…) */
        const ws = lw.split(" "), f = ws[0], TITLE = ["anh","chị","chi","cô","co","chú","chu","bác","bac","em","ông","ong","bà","ba","cậu","cau","dì","di","mợ","thím","bạn","ban","sếp","sep"];
        const g = ws.length > 2 && TITLE.includes(f) ? ws[1] : (ws.length > 1 && !TITLE.includes(f) ? f : "");   /* "Cô Lan bán cơm" → "Lan" */
        const capW = String(text).split(/[\s?!.,:;]+/).filter(w => isCap(w)).map(w => w.toLowerCase());   /* gõ viết hoa "Lan" là tên, không phải "lần" */
        if(g && g.length >= 2 && (capW.includes(g) || (hasMarks(g) ? low.includes(" " + g + " ") : (!hasMarks(low) && n.includes(" " + g + " ") && !STOPQ.has(g))))) ok = true;
      }
      if(!ok && last.length >= 2 && (low.includes(" " + lastO + " ") || (!hasMarks(low) && n.includes(" " + last + " ")))){
        /* chỉ tên cuối ("Tuấn"): tránh chữ thường trùng ("năm nay", "mai" của ngày mai, "lan" của mấy lần) */
        const i = n.indexOf(" " + last + " "), after = n.slice(i + last.length + 2).split(" ")[0], before = n.slice(0, i).trim().split(" ").pop();
        ok = !["nay","ngoai","truoc","sau","roi","toi","nao","nua"].includes(after) && !["moi","mot","1","trong","may","ngay","bao","lan"].includes(before) && !STOPQ.has(last);
      }
      if(ok){ seen.add(nm.toLowerCase()); out.push(nm); }
    });
    /* người thân ("mẹ", "bố"): bỏ qua nếu chữ đó nằm trong tên quán / nội dung đã biết ("quán bà Tý") */
    const K = knownIn(text, ctx), kl = K ? " " + String(K.label).toLowerCase() + " " : "";
    FAMILY.forEach(f => { if(low.includes(" " + f + " ") && !kl.includes(" " + f + " ") && !out.some(x => x.toLowerCase() === f)) out.push(f.charAt(0).toUpperCase() + f.slice(1)); });
    return out;
  }
  /* ---------------- chữ viết tắt (v125) ----------------
     "uống HL 59k", "tháng này HL hết bao nhiêu": HL là gì?
     - ctx.alias = { hl:"Highlands" } là viết tắt bạn đã chọn (nằm trong dữ liệu, đi theo file sao lưu) → thay luôn, không hỏi.
     - chưa biết: tìm ứng viên trong nội dung bạn hay ghi (chữ cái đầu "Phúc Long" = PL, hoặc chữ đọc lướt "Highlands" ⊃ h…l)
       và bảng viết tắt phổ biến; app đoán ứng viên đầu, kèm nút để bạn chọn lại, chọn rồi thì nhớ. */
  const ABBR = { hl:["Highlands"], pl:["Phúc Long"], tch:["The Coffee House"], ktn:["Katinat"], sb:["Starbucks"], sbux:["Starbucks"], bhx:["Bách hoá xanh"], st:["Siêu thị"], sp:["Shopee"], lzd:["Lazada"], xsm:["Xanh SM"], tts:["Trà sữa"], ts:["Trà sữa"], bm:["Bánh mì"], mc:["McDonald's"], mcd:["McDonald's"], lt:["Lotteria"], jb:["Jollibee"], gs:["GS25"], ck7:["Circle K"], cck:["Circle K"], bk:["Burger King"], gc:["Gong Cha"], ttđ:["Trà tắc"], tđ:["Tiền điện"], td:["Tiền điện"], tn:["Tiền nước"], hp:["Học phí"], bhyt:["Bảo hiểm y tế"], tcb:["Techcombank"], vcb:["Vietcombank"], ctg:["Vietinbank"], bidv:["BIDV"], dt:["Điện thoại"], sn:["Sinh nhật"], đc:["Đám cưới"] };
  /* chữ in hoa ngắn nhưng không phải viết tắt cần hỏi */
  const ABBR_SKIP = new Set(["ok","oke","vib","mb","tp","tpb","ck","tm","k","vnd","atm","id","sms","otp","qr","tv","pc","usb","sim","ps","pr","ai","app","vip","bbq","kfc","cgv","fpt","evn","vnpt","bhd","gym","spa","diy","ib","dm","đm","ko","kp","nt","tk","hn","sg","hcm","dn","vn","usd","eur","jpy"]);
  const skel = s => s.replace(/[aeiouy]/g, "");
  function abbrCands(low, ctx){
    const out = [], seen = new Set(), add = (l, c) => { const k = norm(l).trim(); if(!k || seen.has(k)) return; seen.add(k); out.push({ label:l, c:c || 0 }); };
    const ng = (ctx && ctx.know && ctx.know.ng) || {};
    const ent = [];
    for(const k in ng){
      const ws = k.split(" "); if(k.length < 3) continue;
      let ok = false;
      if(ws.length >= 2 && ws.length === low.length && ws.every((w, i) => w[0] === low[i])) ok = true;                     /* Phúc Long → pl */
      else if(ws.length === 1 && k[0] === low[0] && k.length > low.length){ let j = 0; for(const ch of skel(k)) if(ch === low[j]) j++; ok = j >= low.length; }   /* Highlands ⊃ h…l */
      if(ok && !STOPQ.has(k)) ent.push([ng[k].l || k, ng[k].c || 1]);
    }
    ent.sort((a, b) => b[1] - a[1]).forEach(([l, c]) => add(l, c));
    (ABBR[low] || []).forEach(l => add(l, 0));
    return out.slice(0, 3);
  }
  /* các chữ viết tắt trong câu: [{ tok:"HL", low:"hl", label?:"Highlands" (đã biết), cands:[…] }] */
  function abbrIn(text, ctx){
    const alias = (ctx && ctx.alias) || {}, out = [];
    const names = new Set([].concat(((ctx && ctx.cards) || []).map(c => c.name), ((ctx && ctx.wallets) || []).map(w => w.name)).filter(Boolean).flatMap(n => norm(n).split(" ")));
    String(text).split(/[\s,;.!?:()]+/).forEach(raw => {
      const t = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""); if(!t) return;
      const low = t.toLowerCase(), nl = norm(t);
      if(out.some(x => x.low === low)) return;
      if(alias[low] !== undefined){ out.push({ tok:t, low, label:alias[low], known:true }); return; }
      if(!/^[\p{L}\d]{2,5}$/u.test(t) || /^\d/.test(t) || ABBR_SKIP.has(low) || ABBR_SKIP.has(nl) || names.has(nl)) return;
      const upper = t === t.toUpperCase() && /\p{Lu}/u.test(t) && t.length <= 4;
      if(!(upper || ABBR[low])) return;
      if(K_UNITS.has(nl) || M_UNITS.has(nl) || COUNTERS.has(nl)) return;
      out.push({ tok:t, low, cands:abbrCands(low, ctx) });
    });
    return out;
  }
  /* thay viết tắt bằng tên đầy đủ (đã biết, hoặc ứng viên đầu nếu pickFirst) */
  function expandAbbr(text, list, pickFirst){
    let s = String(text);
    (list || []).forEach(a => {
      const to = a.known ? a.label : (pickFirst && a.cands && a.cands.length ? a.cands[0].label : null);
      if(!to || to === a.tok) return;
      s = s.replace(new RegExp("(^|[^\\p{L}\\p{N}])" + a.tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?=$|[^\\p{L}\\p{N}])", "gu"), "$1" + to);
    });
    return s;
  }

  const FIND_W = / (la khoan gi|la gi|la cai gi|khoan gi|cua cai gi|cho cai gi|tu dau ra|o dau ra|co khoan nao|khoan nao) |^ (tim|tim kiem|tra cuu|tim khoan|kiem tra khoan) /;
  const LAST_W = / (lan cuoi|lan gan nhat|lan gan day nhat|gan day nhat|lan truoc|bao lau roi|bao lau (chua|khong|ko)|may ngay roi|may thang roi|khi nao|hom nao|ngay nao|bua nao) /;
  const COUNT_W = / (may lan|bao nhieu lan|bn lan|so lan|bao lan|may bua|bao nhieu bua|may cuoc|bao nhieu cuoc|may ly|bao nhieu ly|may don|bao nhieu don) /;
  const AVG_W = / (trung binh|binh quan|tb|moi ngay|moi tuan|moi thang|1 ngay|mot ngay|1 thang|mot thang|1 tuan|mot tuan|hang thang|hang ngay|hang tuan|thuong thang) /;
  /* câu hỏi lục dữ liệu: trả câu hỏi mới, hoặc null để phần còn lại xử lý */
  function dataQuery(text, n, ctx, now, amtV, tagOf0){
    const K = knownIn(text, ctx), P = peopleIn(text, ctx), pr = periodOf(n, now);
    const tw = tagWord(String(text).replace(/\b(lần|cuối|gần nhất|trung bình|mỗi|tìm|khi nào|bao lâu|rồi|chưa)\b/gi, " "));
    const subj = q => {
      if(K){ q.kw = K.kw; q.kwLabel = K.label; }
      else if(tw && q.q !== "avg"){ q.kw = norm(tw.w); q.kwLabel = tw.w; q.kwSoft = true; }    /* không thấy theo từ thì app lùi về cả nhóm */
      if(tagOf0 && (!K || q.kwSoft)) q.tag = tagOf0;
      if(P.length && !K && !tagOf0){ q.who = P[0]; if(P.length > 1) q.whoAll = P; }
      if(/ (quet the|ca the|the tin dung|bang the) /.test(n) || (/ the /.test(n) && !/ the nao /.test(n))) q.src = "card";
      return q;
    };
    const per = q => { if(pr.period){ q.period = pr.period; if(pr.from){ q.from = pr.from; q.to = pr.to; } } return q; };
    /* "450k hôm qua là khoản gì", "tìm khoản 1tr2", "có khoản nào 450k không" */
    if(amtV && FIND_W.test(n)) return per(subj({ q:"find", amt:amtV }));
    if(amtV) return null;
    /* "lần cuối đổ xăng khi nào", "bao lâu rồi chưa cắt tóc" */
    if(LAST_W.test(n) && !/ (nhieu nhat|it nhat|lon nhat|tieu nhieu) /.test(n) && (K || tagOf0 || P.length)) return subj({ q:"last" });
    /* "tháng này đi grab mấy lần" */
    if(COUNT_W.test(n) && (K || tagOf0 || P.length || / (tieu|chi|mua|quet|giao dich|khoan) /.test(n))) return per(subj({ q:"count", period:"month" }));
    /* "trung bình mỗi ngày tiêu bao nhiêu", "mỗi tháng tiền điện bao nhiêu" */
    if(AVG_W.test(n) && / (bao nhieu|bn|het|ton|tieu|chi|xai|khoang) /.test(n) && !/ (duoc tieu|han muc|nen tieu) /.test(n)){
      const unit = / (thang|hang thang|thuong thang) /.test(n) ? "month" : / tuan /.test(n) ? "week" : "day";
      return subj({ q:"avg", unit });
    }
    /* "tìm grab", "tìm khoản bún chả", "tra cứu highlands" */
    const mf = n.match(/^ (?:tim|tim kiem|tra cuu|loc|search) (?:khoan |giao dich |cac khoan |nhung khoan )?(.+?) $/);
    if(mf){ const q = per({ q:"find" }); if(K){ q.kw = K.kw; q.kwLabel = K.label; } else if(P.length){ q.who = P[0]; } else { q.kw = mf[1].replace(/ (thang nay|thang truoc|tuan nay|hom nay|hom qua|di|nhe|giup|voi)$/g, "").trim(); q.kwLabel = q.kw; } if(tagOf0 && !q.kw) q.tag = tagOf0; return q; }
    /* "giao dịch với Nam", "đã chuyển cho mẹ bao nhiêu", "Nam đã trả bao nhiêu" (không phải hỏi nợ) */
    if(P.length && !K && !/ (no|vay|muon) /.test(n) && / (bao nhieu|bn|gi|nhung gi|tong|lich su|giao dich|lan cuoi|khi nao|the nao|ra sao|xem|liet ke|nhung khoan|cac khoan) /.test(n))
      return per({ q:"person", who:P[0], whoAll:P });
    return null;
  }

  function asQuery(text, ctx){
    text = String(text).replace(/vậy/gi, "vậy_").replace(/\bvay\s*\??\s*$/i, "vậy_");   /* "sao tiêu nhiều vậy" không phải vay nợ */
    let n = " " + norm(text).replace(/[?!.,:;]/g, " ").replace(/\s+/g, " ") + " ";
    /* v122: "thế nào" không phải "thẻ"; "máy giặt" không phải "mấy" */
    n = n.replace(/ the nao /g, " ra sao ").replace(/ nhu the nao /g, " ra sao ");
    const tokO = String(text).split(/\s+/).map(w => clean(w).toLowerCase());
    const mayQ = tokO.some((w, i) => w === "mấy" || (w === "may" && !hasMarks(String(text)) && !["giat","tinh","bay","lanh","anh","in","say","lam","khoan_","man","moc","xay","han","hut"].includes(norm(tokO[i+1] || ""))));
    if(!mayQ) n = n.replace(/ may /g, " may_ ");
    if(/^ (so du|so du vi|kiem tra so du|check so du|xem so du|so du tai khoan|so du tk) $/.test(n) || /^ so du [a-z]+ $/.test(n)) n = n.replace(/ $/, " bao nhieu ");
    const now = (ctx && ctx.now) || new Date();
    /* v123: khoản sắp tới, gợi ý tiết kiệm (câu không kèm số tiền) */
    {
      const T = tokenize(text).N; let hasAmt = false, amtV = 0;
      for(let i = 0; i < T.length; i++){ const a = amountAt(T, i); if(a && !["tren","hon","tu","duoi"].includes(T[i-1])){ hasAmt = true; amtV = a.v; break; } }
      if(!hasAmt){
        const up = upcomingOf(n, now); if(up) return up;
        if(saveOf(n)){ const p0 = periodOf(n, now); const q = { q:"save", period:p0.period || "month" }; if(p0.from){ q.from = p0.from; q.to = p0.to; } return q; }
      }
      /* v124: câu hỏi lục dữ liệu (tìm khoản, lần cuối, mấy lần, trung bình, giao dịch với một người) */
      const tg0 = (() => { if(/ an uong /.test(n)) return "an+uong"; const g = guessTag(text.replace(/\b(chi tiết|chi tiêu|tiêu|chi|lần|cuối|gần nhất|trung bình|mỗi|tìm)\b/gi, " "), null); return g !== "khac" ? g : null; })();
      const dq = dataQuery(text, n, ctx, now, amtV, tg0);
      if(dq) return dq;
    }
    const nq = n.replace(/ gi (do|day|ay|ca) /g, " ");                 /* "200k gì đó" là lời kể, không phải câu hỏi */
    /* v122: "sao tháng này tiêu nhiều vậy" → báo cáo so với kỳ trước (máy tự làm, AI cũng chỉ làm được vậy vì không xem số liệu) */
    const why = /^ (sao|tai sao|vi sao|lam sao ma) .*(tieu|chi|xai|het|ton).*(nhieu|qua|the|vay_|du vay)/.test(nq) || /^ (sao|tai sao|vi sao) .*(nhieu|tang) /.test(nq);
    let wantsReport = why || REPORT.test(nq) || /^ (cho (toi|minh|em|tao) (biet|xem)|liet ke|thong ke|phan tich|bao cao|xem) /.test(nq);
    const isQ = /\?\s*$/.test(text) || / (bao nhieu|bn|may|nhieu khong|the nao|sao) /.test(n) || / (ngay|hom|khoan|nhom|thang|tuan) nao /.test(n) || / (khong|ko|chua) $/.test(n) && / (tieu|chi|xai|nhieu|it|tang|giam|vuot) /.test(n) || /^ (xem|cho xem|tong) /.test(n) || / (ai|nhung ai) (con |dang |van )?no | no (ai|nhung ai) /.test(n) || / no (khong|ko|chua|k) $/.test(n) || wantsReport;
    if(!isQ) return null;
    const { N } = tokenize(text);
    if(wantsReport && !/\?\s*$/.test(text)){
      /* có số tiền mà không đứng sau "trên/hơn/từ/top" thì là kể chi tiêu, không phải hỏi */
      for(let i = 0; i < N.length; i++){ const a = amountAt(N, i); if(a && !["tren","hon","tu","top","duoi"].includes(N[i-1])) return null; if(a) i += a.n - 1; }
    }
    if(!wantsReport){ for(let i = 0; i < N.length; i++){ const a = amountAt(N, i); if(a && !/ (bao nhieu|bn) /.test(n)) return null; } }
    /* "tháng này so với tháng trước": kỳ chính là kỳ nói trước, kỳ so sánh tự lấy kỳ liền trước */
    const cmpAt = n.search(/ (so voi|so sanh|nhieu hon|it hon) /);
    const pr = periodOf(cmpAt > 0 && periodOf(n.slice(0, cmpAt + 1), now).period ? n.slice(0, cmpAt + 1) : n, now), period = pr.period;
    const tag = (() => { if(/ an uong /.test(n)) return "an+uong"; const g = guessTag(text.replace(/\b(chi tiết|chi tiêu|tiêu|chi)\b/gi, " "), null); return g !== "khac" ? g : null; })();
    /* nguồn tiền: tài khoản/tiền mặt hay thẻ tín dụng */
    let src = "all", cardId = null;
    const card = findCard(ctx || {}, N);
    if(card){ src = "card"; cardId = card.id; }
    else if(/ (the|quet the|ca the|the tin dung|credit) /.test(n)) src = "card";
    else if(/ (tai khoan|tk|chuyen khoan|ck|tien mat|tm|vi) /.test(n) && !/ so du /.test(n)) src = "tk";
    /* v98: hỏi về một ví ("momo còn bao nhiêu", "tháng này chi gì bằng momo") */
    const qw = walletsIn(ctx || {}, N).find(m => m.id !== "main");
    if(qw && !wantsReport && / (so du|con) /.test(n) && !/ (tieu|chi|xai) /.test(n)) return { q:"balance", wid:qw.id };
    if(qw){ src = "tk"; cardId = null; }
    if(/ so du | (tai khoan|tk|vi) con | trong (tai khoan|tk|vi) /.test(n) && !wantsReport) return { q:"balance" };
    if(/ (no|vay) /.test(n) && !/ the /.test(n)){
      const m = n.match(/ (?:minh|toi) no (.+?) bao/) ; const m2 = n.match(/ (.+?) (?:con )?no (?:minh|toi)/);
      let who = m ? m[1] : m2 ? m2[1].replace(/^(con|da) /, "") : "";
      who = who.replace(/\b(con|da|van)\b/g, " ").trim();
      if(/^(ai|nhung ai|may nguoi|bao nhieu nguoi|ai ma)$/.test(who)) who = "";
      let whoAll = null;
      if(!who){ const P = peopleIn(text, ctx); if(P.length){ who = P[0]; if(P.length > 1) whoAll = P; } }
      const lq = { q:"loans", who: who.trim(), dir: m ? "borrow" : m2 ? "lend" : null };
      if(whoAll) lq.whoAll = whoAll;
      return lq;
    }
    if(/ (ngay nao|hom nao) .*(nhieu nhat|tieu nhieu)/.test(n)) return { q:"topday", period: period || "month" };
    if(wantsReport){
      const q = { q:"report", period: period || "month", src, cardId, tag, group:"tag", list:false, top:0, minAmt:0, kind:"out", compare:false };
      if(qw) q.wid = qw.id;
      { const K = knownIn(text, ctx); if(K && !(qw && norm(qw.name || "") === K.kw) && !(card && norm(card.name || "").includes(K.kw))){ q.kw = K.kw; q.kwLabel = K.label; q.tag = null; if(q.group === "tag") q.group = "none"; } }
      if(!period) q.noPeriod = true;                        /* không nói kỳ: có thể là câu nối tiếp câu trước */
      if(pr.from){ q.from = pr.from; q.to = pr.to; }
      if(/ (thu nhap|thu vao|thu duoc|khoan thu|kiem duoc|tien ve|nhan duoc) /.test(n)) q.kind = "in";
      if(/ theo ngay /.test(n)) q.group = "day";
      else if(/ theo tuan /.test(n)) q.group = "week";
      else if(/ theo thang /.test(n)) q.group = "month";
      else if(/ (o dau|cho ai|noi nao|cua hang nao|cho nhung ai) /.test(n)) q.group = "place";
      else if(/ (tai khoan hay the|the hay tai khoan|theo nguon) /.test(n)){ q.group = "src"; q.src = "all"; q.cardId = null; }
      if(/ (liet ke|tung khoan|cac khoan|nhung khoan|chi tiet tung|cu the tung) /.test(n) && !/ (nhom|loai|danh muc) /.test(n) && q.group === "tag") q.group = "none";
      if(/ (liet ke|chi tiet|cu the|tung khoan|cac khoan|nhung khoan) /.test(n)) q.list = true;
      const tm = n.match(/ top (\d{1,2}) | (\d{1,2}) khoan (lon|to) /);
      if(tm || / (lon nhat|nhieu tien nhat|khoan to) /.test(n)){ q.top = tm ? +(tm[1] || tm[2]) : 5; q.group = "none"; q.list = true; }
      for(let i = 0; i < N.length; i++){ if(["tren","hon","tu"].includes(N[i]) && N[i+1]){ const a = amountAt(N, i + 1); if(a && a.v >= 1000){ q.minAmt = a.v; break; } } }
      if(/ (so voi|so sanh|nhieu hon|it hon|tang hay giam|tang khong|giam khong) /.test(n) || why) q.compare = true;
      return q;
    }
    if(/ (con tieu duoc|tieu duoc nua|tieu them duoc|con duoc tieu|tieu duoc them|con bao nhieu de tieu|con bao nhieu (tien )?(de |duoc )tieu) /.test(n) && (!period || period === "today")) return { q:"left" };
    if(/ the /.test(n) && !/ (an|uong) /.test(n)) return { q:"card", period: period || "month" };
    if(/ con (bao nhieu|bn|duoc) | con lai /.test(n) && (!period || (period === "today" && !/ (tieu|chi|xai|het|ton|an|uong|mua) /.test(n)))) return { q:"left" };
    if(/ (tieu|chi|xai|het|ton|an|uong|mua) /.test(n) || tag || period){
      const q = { q:"spent", period: period || "today", tag, src };
      if(qw) q.wid = qw.id;
      if(!period) q.noPeriod = true;                        /* v124: không nói kỳ, hôm nay chưa có thì app lùi ra tháng này, rồi lần gần nhất */
      { const K = knownIn(text, ctx); if(K && !(card && norm(card.name || "").includes(K.kw))){ q.kw = K.kw; q.kwLabel = K.label; q.tag = null; } }
      if(pr.from){ q.period = "custom"; q.from = pr.from; q.to = pr.to; }
      return q;
    }
    return { q:"unknown" };
  }

  /* ---------------- câu nối tiếp ----------------
     Sau một câu hỏi về chi tiêu, người dùng hay nói tiếp ngắn gọn: "chỉ tính từ tài khoản", "còn thẻ thì sao",
     "tháng trước thì sao", "theo ngày", "liệt kê ra", "nhóm ăn thôi", "so với tháng trước".
     refine(text, prev, ctx) → câu hỏi trước với điều kiện mới thay vào, hoặc null nếu không phải câu nối tiếp. */
  function refine(text, prev, ctx){
    /* v123: nối tiếp câu hỏi khoản sắp tới: "còn tuần sau thì sao", "chỉ khoản cho vay thôi", "tháng sau?" */
    if(prev && prev.q === "upcoming"){
      const n0 = " " + norm(stripLead(text)).replace(/[?!.,:;]/g, " ").replace(/\s+/g, " ") + " ";
      if(n0.trim().split(" ").length > 12) return null;
      const now0 = (ctx && ctx.now) || new Date();
      const up = upcomingOf(n0 + "du kien co khoan nao ", now0);
      if(!up) return null;
      const hasRange = / (tuan sau|tuan toi|thang sau|thang toi|cuoi tuan|tuan nay|ngay mai|nam nay|\d{1,3} ngay toi|cuoi thang|het thang) /.test(n0);
      const q = Object.assign({}, prev);
      if(hasRange){ q.from = up.from; q.to = up.to; q.label = up.label; }
      if(up.only) q.only = up.only; else if(/ (tat ca|het|moi khoan|cac khoan) /.test(n0)) q.only = null;
      return (hasRange || up.only || q.only !== prev.only) ? q : null;
    }
    if(!prev || !(prev.q === "report" || prev.q === "spent" || prev.q === "card")) return null;
    ctx = ctx || {}; const now = ctx.now || new Date();
    const n = " " + norm(text).replace(/[?!.,:;]/g, " ").replace(/\s+/g, " ") + " ";
    const { N } = tokenize(text);
    if(N.length > 16) return null;
    for(let i = 0; i < N.length; i++){ const a = amountAt(N, i); if(a && !["tren","hon","tu","top","duoi"].includes(N[i-1])) return null; if(a) i += a.n - 1; }
    const q = Object.assign({}, prev); let changed = false;
    if(q.q === "card"){ q.q = "spent"; q.src = "card"; }
    const cmpAt = n.search(/ (so voi|so sanh) /);
    const pr = cmpAt >= 0 ? periodOf(n.slice(0, cmpAt + 1), now) : periodOf(n, now);   /* "so với tháng trước": giữ kỳ đang xem */
    if(pr.period){ q.period = pr.period; delete q.from; delete q.to; if(pr.from){ q.from = pr.from; q.to = pr.to; } changed = true; }
    const card = findCard(ctx, N), rw = walletsIn(ctx, N).find(m => m.id !== "main");
    if(rw){ q.src = "tk"; q.cardId = null; q.wid = rw.id; changed = true; }
    else if(card){ q.src = "card"; q.cardId = card.id; delete q.wid; changed = true; }
    else if(/ (ca hai|tat ca|ca the lan|ca tai khoan lan|gop het|tong het|bo loc|cac vi|moi vi) /.test(n)){ q.src = "all"; q.cardId = null; q.tag = null; q.tags = []; delete q.wid; changed = true; }
    else if(/ (tai khoan|tk|chuyen khoan|ck|tien mat|tm) /.test(n)){ q.src = "tk"; q.cardId = null; delete q.wid; changed = true; }
    else if(/ (the|quet the|ca the|the tin dung) /.test(n)){ q.src = "card"; q.cardId = null; delete q.wid; changed = true; }
    if(/ theo ngay /.test(n)){ q.group = "day"; changed = true; }
    else if(/ theo tuan /.test(n)){ q.group = "week"; changed = true; }
    else if(/ theo thang /.test(n)){ q.group = "month"; changed = true; }
    else if(/ (theo nhom|theo loai|gom nhom|gom lai) /.test(n)){ q.group = "tag"; changed = true; }
    else if(/ (o dau|noi nao|cho ai) /.test(n)){ q.group = "place"; changed = true; }
    if(/ (liet ke|chi tiet|tung khoan|cu the|cac khoan|nhung khoan|ke ra|ke het) /.test(n)){ q.list = true; if(!/ (nhom|loai) /.test(n) && q.group === "tag" && !q.tag) q.group = "none"; changed = true; }
    const tm = n.match(/ top (\d{1,2}) | (\d{1,2}) khoan (lon|to) /);
    if(tm || / (lon nhat|nhieu tien nhat|khoan to) /.test(n)){ q.top = tm ? +(tm[1] || tm[2]) : 5; q.group = "none"; q.list = true; changed = true; }
    for(let i = 0; i < N.length; i++){ if(["tren","hon","tu"].includes(N[i]) && N[i+1]){ const a = amountAt(N, i + 1); if(a && a.v >= 1000){ q.minAmt = a.v; changed = true; break; } } }
    if(/ (so voi|so sanh|tang hay giam|nhieu hon khong|it hon khong) /.test(n)){ q.compare = true; changed = true; }
    if(/ (thu nhap|khoan thu|thu vao|tien ve) /.test(n)){ q.kind = "in"; changed = true; }
    else if(q.kind === "in" && / (chi|tieu|xai) /.test(n)){ q.kind = "out"; changed = true; }
    const K = knownIn(text, ctx);
    if(K){ q.kw = K.kw; q.kwLabel = K.label; q.tag = null; changed = true; }
    else if(/ an uong /.test(n)){ q.tag = "an+uong"; delete q.kw; delete q.kwLabel; changed = true; }
    else {
      const g = guessTag(text.replace(/\b(chi tiết|chỉ tính|chỉ|tính|tiêu|chi|thôi|thì sao|còn)\b/gi, " "), null);
      if(g !== "khac" && !/ (tat ca|bo loc) /.test(n)){ q.tag = g; delete q.kw; delete q.kwLabel; changed = true; }
    }
    /* phải có dấu hiệu nối tiếp, tránh bắt nhầm câu kể chuyện */
    const cue = / (chi|chi tinh|chi xem|chi lay|con|thi sao|the con|vay con|xem|loc|bo|them|nua|thoi|tinh|lay ra|ke ra|liet ke|so voi|theo) /.test(n) || N.length <= 6;
    if(!changed || !cue) return null;
    if(q.q === "spent" && (q.group && q.group !== "tag" || q.list || q.top || q.compare)) q.q = "report";
    if(q.q === "report") q.group = q.group || "tag";
    return q;
  }

  /* ---------------- đầu vào chính ---------------- */
  /* v123: "Sai rồi ý tôi là trong các ngày tới", "không phải, ý mình là …" → chỉ hiểu phần sau */
  const LEAD = /^\s*(?:(?:sai|nhầm|nham|không phải|khong phai|ko phải|ko phai|k phải|chưa đúng|chua dung|không đúng|khong dung)(?:\s+(?:rồi|roi|r|nha|nhé|nhe))?[\s,.!:;-]*)?(?:(?:ý|y)\s+(?:tôi|toi|mình|minh|em|tao|là|la)(?:\s+(?:là|la|muốn hỏi|muon hoi|hỏi|hoi))?|(?:tôi|toi|mình|minh|em)\s+(?:muốn hỏi|muon hoi|hỏi là|hoi la|định hỏi|dinh hoi)|tức là|tuc la|nghĩa là|nghia la|à mà|a ma)[\s,.:;-]+/i;
  function stripLead(t){ const m = String(t).match(LEAD); return m && String(t).length - m[0].length >= 4 ? String(t).slice(m[0].length) : t; }
  function parse(text, ctx){
    ctx = ctx || {}; if(!ctx.now) ctx.now = new Date();
    const raw0 = String(text || "").trim(), raw1 = stripLead(raw0).trim();
    /* v125: viết tắt — đã biết thì thay luôn; chưa biết thì tạm hiểu theo ứng viên đầu, app hỏi lại kèm nút chọn */
    const abbr = abbrIn(raw1, ctx), raw = expandAbbr(raw1, abbr, true);
    const pend = abbr.filter(a => !a.known);
    if(!raw) return { items:[], query:null, unknown:[] };
    const query = asQuery(raw, ctx);
    if(query) return { items:[], query, unknown:[], abbr:pend };
    const items = [], unknown = [];
    let carry = { date:null, hh:null };
    let pendingText = "";
    clauses(raw).forEach(c => {
      const r = oneClause(pendingText ? tokenize(pendingText + " " + c.O.join(" ")) : c, ctx, carry);
      if(r.meta.date) carry.date = r.meta.date;
      if(r.meta.hh !== null && r.meta.hh !== undefined) carry.hh = r.meta.hh;
      if(r.item){ items.push(r.item); pendingText = ""; }
      else pendingText = (pendingText ? pendingText + " " : "") + r.text;
    });
    if(pendingText && !items.length) unknown.push(pendingText);
    else if(pendingText && items.length){
      /* chữ đứng sau số tiền cuối cùng ("45k ăn phở"): gộp vào nội dung khoản cuối nếu khoản đó chưa có nội dung */
      const last = items[items.length - 1];
      const extra = pendingText.replace(/^(và|với|rồi|xong)\s+/i, "").trim();
      if(extra && !last.note && (last.kind === "out" || last.kind === "card" || last.kind === "in")){
        last.note = extra.charAt(0).toUpperCase() + extra.slice(1);
        if(last.kind !== "in") last.cat = guessTag(extra, ctx);
      }
    }
    return { items, query:null, unknown, abbr:pend };
  }

  /* ---------------- máy tự xử lý được hay cần nhờ AI ----------------
     Dùng khi người dùng có bật AI: câu nào chắc chắn hiểu đúng trên máy thì không gọi AI cho đỡ tốn.
     Trả { local:true|false, why:[lý do cần AI] }. Lý do:
       noitem    không tìm ra khoản nào, cũng không phải câu hỏi
       query     câu hỏi mà máy không biết hỏi gì
       leftover  còn đoạn chữ không gắn được với số tiền nào
       numbers   trong câu có nhiều số tiền hơn số khoản tìm được
       words     có từ khó: chia tiền, trừ, nhầm, sửa, xoá, trả góp, phần trăm…
       query     (cũng dùng khi) câu xin lời khuyên, hỏi tương lai, hỏi lý do
       card      quẹt thẻ nhưng có nhiều thẻ mà không biết thẻ nào
       who       vay, trả nợ nhưng thiếu tên người hoặc không thấy khoản vay
       long      câu dài so với số khoản
     Mọi khoản vẫn hiện thẻ xác nhận trước khi ghi, nên máy hiểu sai thì người dùng sửa được hoặc bấm "Nhờ AI hiểu lại". */
  const HARD = / (chia|chia deu|moi nguoi|moi dua|tru di|tru ra|tru vao|cong them|cong vao|nham|sua lai|sua thanh|doi thanh|xoa|huy|khong phai|chu khong|tra gop|lai suat|phan tram|giam gia|hoan tien mot phan|tong cong|tat ca la|ca thay|moi cai|moi ly|moi phan|neu|thi sao|bao gio) /;
  /* câu hỏi mà bộ trả lời trên máy chỉ đoán bừa: xin lời khuyên, hỏi tương lai, hỏi lý do */
  const ASK = / (nen|co nen|tu van|goi y|lam sao|lam the nao|du doan|du kien|tuan sau|thang sau|nam sau|ke hoach|xu huong) /;
  const EDIT = / (sua|doi|chinh) (khoan|lai|thanh|so tien|cai khoan|cai vua|cai luc) | thanh \d| ghi (nham|sai|lon|thieu|thua) /;
  function assess(text, res, ctx){
    ctx = ctx || {};
    const why = [], n = " " + norm(text).replace(/[?!.,;:]/g, " ").replace(/\s+/g, " ") + " ";
    if(!res) res = parse(text, ctx);
    if(res.query){
      if(res.query.q === "unknown" || (ASK.test(n) && !["save","upcoming","find","last","count","avg","person"].includes(res.query.q))) why.push("query");
      return { local:!why.length, why };
    }
    if(!res.items.length){ why.push("noitem"); return { local:false, why }; }
    if(res.unknown && res.unknown.length) why.push("leftover");
    const { N } = tokenize(text); let cnt = 0;
    for(let i = 0; i < N.length; i++){ const a = amountAt(N, i); if(a){ if(!isDisc(N, i) || !cnt) cnt++; i += a.n - 1; } }
    if(cnt > res.items.length) why.push("numbers");
    /* v122: chia tiền, mỗi ly/cái, giảm giá… máy đã tự tính (item.calc) thì không còn là chữ khó */
    const calcd = res.items.some(it => it.calc);
    const n2 = calcd ? n.replace(/ (chia deu|chia|moi nguoi|moi dua|moi cai|moi ly|moi phan|moi suat|moi hop|moi ve|moi doi|moi chai|moi bat|giam gia|tru di|tru ra|phan tram|tru) /g, " ") : n;
    if(HARD.test(n2) || EDIT.test(n2) || (/%/.test(text) && !calcd)) why.push("words");
    const cards = ctx.cards || [];
    res.items.forEach(it => {
      if(it.kind === "card" && !it.cardId && cards.length > 1 && why.indexOf("card") < 0) why.push("card");
      if((it.kind === "lend" || it.kind === "borrow") && !it.who && !it.loanId && why.indexOf("who") < 0) why.push("who");
      if((it.kind === "repay" || it.kind === "collect") && (it.loanMissing || !it.loanId) && why.indexOf("who") < 0) why.push("who");
    });
    if(N.length > 14 * res.items.length + 4) why.push("long");
    return { local:!why.length, why };
  }

  /* đọc số tiền người dùng gõ trong ô sửa ("45k", "1tr2", "45.000") */
  function amountText(s){ const { N } = tokenize(s); const a = amountAt(N, 0); return a ? a.v : (parseInt(String(s).replace(/\D/g, ""), 10) || 0); }

  const api = { parse, stripLead, knownIn, peopleIn, tagWord, abbrIn, expandAbbr, abbrCands, assess, refine, amountText, guessTag, norm, _amountAt:amountAt, _clauses:clauses, _tokenize:tokenize };
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  else root.N50KParse = api;
})(typeof window !== "undefined" ? window : this);
