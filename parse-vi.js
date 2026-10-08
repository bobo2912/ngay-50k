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
  const clean = w => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}%]+$/gu, "");

  /* ---------------- số tiền ---------------- */
  const COUNTERS = new Set(["cai","ly","coc","chai","hop","goi","phan","suat","to","dia","nguoi","lan","ve","kg","qua","chiec","doi","bo","thang","ngay","tuan","nam","gio","h","phut","lon","bat","mon","cuon","tam","con","trai","cay","lit","km","m","g","gb","tb","%","dot","ky","buoi","tiet","so","thu"]);
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
    if(i > 0 && (hasMarks(po) ? ["tháng","ngày","thứ","tuần","kỳ","đợt"].includes(po) : ["thang","ngay","thu","ky","dot"].includes(N[i-1]))) return null;
    let m = t.match(/^(\d+(?:[.,]\d+)*)(k|ng|ngh|nghin|ngan|tr|trieu|cu|m|d|dong|vnd|t)?(\d{1,3})?$/);
    if(!m) return null;
    let v = numOf(m[1]); if(isNaN(v)) return null;
    let unit = m[2] || "", tail = m[3] || "", used = 1;
    if(unit === "t" && !tail) return null;                       /* "2t" không rõ nghĩa */
    if(!unit){
      const nx = N[i+1] || "";
      if(K_UNITS.has(nx)){ unit = "k"; used = 2; }
      else if(nx === "tr" || nx === "trieu" || nx === "cu" || nx === "chai" && false){ unit = "tr"; used = 2; }
      else if(nx === "tram"){ unit = "tram"; used = 2; }
      else if(nx === "d" || nx === "dong" || nx === "vnd"){ unit = "d"; used = 2; }
      else if(COUNTERS.has(nx)) return null;                     /* "2 ly", "3 cái" là số lượng */
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
          else if(!COUNTERS.has(nn)){ v += parseInt(nx, 10) * Math.pow(10, 6 - nx.length); used += 1; }
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
    for(let i = 0; i < N.length; i++){
      const w = N[i];
      if(w === "hnay" || w === "homnay" || at(i, ["hum","nay"])){ date = keyOf(now); drop.add(i); if(w === "hum") drop.add(i+1); }
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
      else if((w === "thu" && N[i+1]) || w === "chu" || w === "cn"){
        const two = w + " " + (N[i+1] || ""), key = WDAY[two] !== undefined ? two : (WDAY[w] !== undefined ? w : null);
        if(key !== null){
          const len = key.split(" ").length, target = WDAY[key];
          let back = (now.getDay() - target + 7) % 7;
          const tuanTruoc = N[i+len] === "tuan" && N[i+len+1] === "truoc";
          if(tuanTruoc) back += 7;
          date = keyOf(addDays(now, -back));
          for(let k = 0; k < len + (tuanTruoc ? 2 : 0); k++) drop.add(i+k);
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
        if(d > now) d = new Date(now.getFullYear(), now.getMonth() - 1, dd);
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
  const TAG_RULES = [
    ["xang",     ["đổ xăng","xăng","petrolimex","nhớt"]],
    ["dilai",    ["grab bike","grabbike","grab car","grab","xanh sm","taxi","xe ôm","gửi xe","vé xe","xe buýt","bus","metro","phí đường","cầu đường","be bike","gojek","đi lại","giữ xe","vé tàu"]],
    ["dienthoai",["tiền mạng","cước mạng","mạng","nạp thẻ","nạp tiền điện thoại","nạp 3g","nạp 4g","3g","4g","5g","data","cước","internet","wifi","viettel","vinaphone","mobifone","fpt","điện thoại"]],
    ["diennuoc", ["tiền điện","tiền nước","điện nước","hoá đơn điện","hóa đơn điện","gas"]],
    ["nha",      ["tiền nhà","thuê nhà","tiền phòng","tiền trọ","phí quản lý","chung cư"]],
    ["uong",     ["trà đá","trà","cà phê","cafe","coffee","cf","trà sữa","sinh tố","nước mía","nước ép","bia","rượu","highlands","starbucks","phúc long","katinat","cộng cà phê","trà chanh","nước ngọt","nước uống","milo","đồ uống"]],
    ["cho",      ["đi chợ","chợ","siêu thị","winmart","coopmart","co.op","bách hoá xanh","bách hóa xanh","bhx","lotte mart","aeon","rau","thịt","trứng","gạo","mắm","dầu ăn"]],
    ["an",       ["ăn","cơm","phở","bún","miến","mì","hủ tiếu","cháo","bánh mì","bánh cuốn","bánh","xôi","lẩu","nướng","bbq","kfc","lotteria","jollibee","mcdonald","pizza","sushi","gà rán","đồ ăn","grabfood","shopeefood","befood","baemin","gs25","circle k","7-eleven","snack","trưa","sáng","tối","bữa"]],
    ["muasam",   ["shopee","lazada","tiki","tiktok","sendo","quần áo","áo","quần","giày","dép","túi","uniqlo","zara","mua sắm","đồ gia dụng","mỹ phẩm online"]],
    ["suckhoe",  ["thuốc","khám","bệnh viện","nhà thuốc","pharmacity","long châu","vitamin","nha khoa","răng","xét nghiệm","dán nhiệt","y tế","sức khoẻ","sức khỏe"]],
    ["lamdep",   ["cắt tóc","gội đầu","làm tóc","nail","spa","mỹ phẩm","son","skincare","làm đẹp"]],
    ["hoctap",   ["học phí","khoá học","khóa học","sách","học","vở","bút"]],
    ["giaitri",  ["xem phim","phim","cgv","lotte cinema","game","netflix","spotify","youtube","karaoke","concert","giải trí","vé xem"]],
    ["dulich",   ["du lịch","khách sạn","homestay","vé máy bay","vietjet","vietnam airlines","bamboo","agoda","booking","resort"]],
    ["concai",   ["sữa bột","bỉm","tã","đồ chơi","học phí con","cho con","con cái"]],
    ["thucung",  ["chó","mèo","pate","cát vệ sinh","thú cưng","thú y"]],
    ["hieuhy",   ["đám cưới","mừng cưới","phong bì","sinh nhật","quà","đám hiếu","viếng","biếu","mừng"]],
    ["tuthien",  ["từ thiện","ủng hộ","công đức","cúng dường","chùa"]],
    ["suachua",  ["sửa xe","sửa","thay nhớt","rửa xe","bảo dưỡng","thay lốp","vá xe"]]
  ];
  const AMBIG = new Set(["cho","cho con","cha","con","ca","sua","ao","quan","but","vo","the","tra","an","son","chó","chợ","nuoc"]);
  function guessTag(text, ctx){
    const low = String(text).toLowerCase(), marks = hasMarks(text), n = " " + norm(text) + " ";
    if(ctx && ctx.history){ const h = ctx.history(text); if(h) return h; }
    for(const [tag, words] of TAG_RULES){
      for(const w of words){
        if(marks){ if(new RegExp("(^|[^\\p{L}])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^\\p{L}])", "u").test(low)) return tag; }
        else { const nw = norm(w); if(AMBIG.has(nw) || AMBIG.has(w)) continue; if(n.includes(" " + nw + " ")) return tag; }
      }
    }
    return "khac";
  }

  /* ---------------- tách câu ---------------- */
  const SPLIT_WORDS = ["va","voi","roi","xong","sau do","con","them","cung","kem"];
  function tokenize(text){
    const O = String(text).replace(/[ ]/g, " ").replace(/(\d)\s*([kK])\b/g, "$1$2").split(/\s+/).map(w => w.trim()).filter(Boolean);
    return pair(O, O.map(w => clean(norm(w))));
  }
  /* chia thành các đoạn, mỗi đoạn tối đa một số tiền (trừ khi là câu vay/trả có một số) */
  function clauses(text){
    const parts = String(text).split(/[\n;]+|,(?!\d)|(?<!\d),|\.(?=\s+[^\d])|\s\+\s/).map(s => s.trim()).filter(Boolean);
    const out = [];
    parts.forEach(p => {
      const { O, N } = tokenize(p);
      /* trong một phần có >1 số tiền: cắt tại từ nối hoặc ngay sau mỗi số tiền */
      const amts = []; for(let i = 0; i < N.length; i++){ const a = amountAt(N, i); if(a){ amts.push([i, a.n]); i += a.n - 1; } }
      if(amts.length <= 1){ out.push(pair(O, N)); return; }
      let start = 0;
      amts.forEach(([ai, an], k) => {
        if(k === amts.length - 1){ out.push(pair(O.slice(start), N.slice(start))); return; }
        let cut = ai + an;
        const nextA = amts[k+1][0];
        /* nếu sau số tiền là chữ rồi mới tới số tiếp, phần chữ đó thuộc khoản sau khi có từ nối */
        for(let j = ai + an; j < nextA; j++){ if(SPLIT_WORDS.includes(N[j]) || (N[j] === "sau" && N[j+1] === "do")){ cut = j; break; } }
        const seg = pair(O.slice(start, cut), N.slice(start, cut));
        out.push(seg);
        start = cut;
        while(start < nextA && (SPLIT_WORDS.includes(N[start]) || N[start] === "do" || N[start] === "sau")) start++;
      });
    });
    return out;
  }

  /* ---------------- người, thẻ, khoản vay ---------------- */
  const FILLER = new Set(["minh","toi","tao","em","anh_","tien","no","them","lai","cho","vay","muon","cua","tu","het","mat","ton","la","duoc","da","vua","moi","nay","qua","roi","xong","di","ve","khoan","so","tra","gui","hoan","bang","qua_","ck","chuyen","khoan_","the","mot","it","ay","do","nhe","nha","a","ah","ha","nhe!","thi"]);
  function nameFrom(O, N, from, to, drop){
    const w = [];
    for(let i = Math.max(0, from); i < Math.min(N.length, to); i++){
      const named = /^[A-ZĐÀ-Ỹ]/.test(O[i]) && i > 0;                /* "Minh" viết hoa là tên, "mình" là đại từ */
      if(drop.has(i) || (FILLER.has(N[i]) && !named) || amountAt(N, i) || /^\d/.test(N[i])) { if(w.length) break; else continue; }
      w.push(clean(O[i]));
    }
    return w.join(" ").trim();
  }
  function findLoan(ctx, name, type){
    if(!name || !ctx || !ctx.loans) return null;
    const n = norm(name), last = n.split(" ").pop();
    const cand = ctx.loans.filter(l => (!type || l.type === type));
    const score = l => { const w = norm(l.who); if(w === n) return 3; if(w.includes(n) || n.includes(w)) return 2; if(w.split(" ").pop() === last) return 1; return 0; };
    let best = null, bs = 0;
    cand.forEach(l => { const s = score(l) + (l.settled ? -0.5 : 0); if(s > bs){ bs = s; best = l; } });
    return bs >= 1 ? best : null;
  }
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

  /* ---------------- hiểu một đoạn ---------------- */
  const INC_RULES = [
    ["luong", [["luong"]]],
    ["thuong",[["thuong"],["hoa","hong"],["bonus"]]],
    ["ban",   [["ban","duoc"],["ban","hang"],["ban"]]],
    ["cho",   [["duoc","cho"],["duoc","tang"],["duoc","bieu"],["li","xi"],["lixi"],["mung","tuoi"],["duoc","mung"]]],
    ["khac",  [["hoan","tien"],["tien","ve"],["ve","tai","khoan"],["nhan","tien"],["nhan","duoc"],["thu","nhap"],["co","nguoi","chuyen"],["chuyen","cho","minh"],["chuyen","cho","toi"],["lai","tiet","kiem"],["tien","lai"]]]
  ];
  const has = (N, seq) => { for(let i = 0; i + seq.length <= N.length; i++) if(seq.every((w, k) => N[i+k] === w)) return i; return -1; };

  function oneClause(c, ctx, carry){
    const { O, N } = c;
    const now = ctx.now || new Date();
    const dt = dateIn(N, now);
    let amtI = -1, amt = 0, amtN = 0;
    for(let i = 0; i < N.length; i++){ if(dt.drop.has(i)) continue; const a = amountAt(N, i); if(a){ amtI = i; amt = a.v; amtN = a.n; break; } }
    const drop = new Set(dt.drop); for(let k = 0; k < amtN; k++) drop.add(amtI + k);
    const date = dt.date || carry.date || keyOf(now);
    const hh = dt.hh !== null ? dt.hh : carry.hh;
    const item = { amt, date, cardId:null, who:"", loanId:null, src:"tk" };
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
    if(!kind && (has(N, ["tra","the"]) >= 0 || has(N, ["tra","no","the"]) >= 0 || has(N, ["thanh","toan","the"]) >= 0 || has(N, ["tat","toan","the"]) >= 0)){
      kind = "cardpay";
      const cd = findCard(ctx, N); if(cd) item.cardId = cd.id;
    }
    /* vay mượn */
    if(!kind){
      const iCho = N.indexOf("cho");
      const iVay = N.findIndex((w, i) => (w === "vay" || w === "muon") && i > 0);
      const meIdx = N.findIndex(w => w === "minh" || w === "toi" || w === "tao" || w === "em");
      if(iCho >= 0 && iVay > iCho){
        /* "cho X vay" (mình cho vay) hoặc "X cho mình vay" (mình đi vay) */
        if(meIdx > iCho && meIdx < iVay){ kind = "borrow"; item.who = nameFrom(O, N, 0, iCho, drop); }
        else { kind = "lend"; item.who = nameFrom(O, N, iCho + 1, iVay, drop); }
      } else if(has(N, ["vay"]) >= 0 || has(N, ["muon"]) >= 0){
        const iv = Math.max(N.indexOf("vay"), N.indexOf("muon") >= 0 && N.indexOf("vay") < 0 ? N.indexOf("muon") : -1);
        if(iv >= 0 && !hasW("tra")){ kind = "borrow"; let st = iv + 1; while(["cua","tu","them","tien"].includes(N[st])) st++; item.who = nameFrom(O, N, st, N.length, drop) || nameFrom(O, N, 0, iv, drop); }
      }
      if(!kind && hasW("tra") && !hasW("tra sua") && !hasW("tra da") && !hasW("tra chanh")){
        const it = N.indexOf("tra");
        const before = nameFrom(O, N, 0, it, drop);
        const giveBack = ["no","tien","lai","cho"];
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
      const SPENDW = ["mua","tra","chi","tieu","an","nap","gui","dong","nop","chuyen","tang","dat","thue","lam","sua","gop","mung","bieu","uong","tien","phi","hoc","xin"];
      const nameLike = O.slice(0, ic).every(w => /^[A-ZĐÀ-Ỹ]/.test(clean(w)));
      if(ic > 0 && ic <= 3 && !diNotAunt && N.indexOf("vay") < 0 && N.indexOf("muon") < 0 && (GIVERS.has(N[0]) || nameLike) && N.slice(0, ic).every(w => !SPENDW.includes(w))){
        kind = "in"; item.cat = "cho"; item.who = nameFrom(O, N, 0, ic, drop);
      }
    }
    /* khoản thu */
    if(!kind){
      for(const [cat, seqs] of INC_RULES){ for(const s of seqs){ if(has(N, s) >= 0){ kind = "in"; item.cat = cat; break; } } if(kind) break; }
      if(kind === "in" && item.cat === "ban" && (hasW("mua") || hasW("tieu"))){ kind = null; delete item.cat; }
      /* "nhận 1 triệu từ công đoàn", "tôi nhận 500k" → khoản thu (v103); "nhận hàng", "nhận ship" là chi */
      if(!kind && hasW("nhan") && !hasW("nhan hang") && !hasW("nhan don") && !hasW("ship") && !hasW("mua") && !hasW("tra")){ kind = "in"; item.cat = "khac"; }
    }
    /* chi bằng thẻ hay tài khoản */
    if(!kind){
      const card = findCard(ctx, N);
      const theIdx = O.findIndex((w, i) => N[i] === "the" && (/thẻ/i.test(w) || !hasMarks(O.join(" "))));
      const byCard = card || theIdx >= 0 || hasW("visa") || hasW("credit") || hasW("mastercard") || (hasW("ca") && theIdx >= 0);
      if(byCard){
        kind = "card";
        const cards = (ctx && ctx.cards) || [];
        item.cardId = card ? card.id : (cards.length === 1 ? cards[0].id : null);
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
    O.forEach((w, i) => { if(drop.has(i)) return; const n = N[i]; if(!n) return; if(PARTICLE.has(clean(w).toLowerCase())) return; if(SKIP.has(n) && (words.length === 0 || i === O.length - 1 || ["het","mat","ton"].includes(n))) return; words.push(clean(w) || w); });
    while(words.length && (SKIP.has(norm(words[words.length-1])) || PARTICLE.has(words[words.length-1].toLowerCase()))) words.pop();
    /* bỏ đại từ ở đầu nội dung: "Tôi nhận từ công đoàn" → "Nhận từ công đoàn" */
    while(words.length > 1 && ["toi","minh","tao"].includes(norm(words[0]))) words.shift();
    let note = words.join(" ").replace(/\s+/g, " ").trim();
    if(kind === "lend" || kind === "borrow" || kind === "repay" || kind === "collect" || kind === "bal" || kind === "cardpay" || kind === "xfer") note = "";
    if(kind === "in" && /^(nhận|nhan|được|duoc)$/i.test(note)) note = "";
    if(kind === "in" && item.cat === "cho" && item.who && !note) note = item.who + " cho";
    item.note = note ? note.charAt(0).toUpperCase() + note.slice(1) : "";
    if(kind === "out" || kind === "card") item.cat = guessTag(O.join(" "), ctx);
    return { item, meta };
  }

  /* ---------------- câu hỏi ---------------- */
  /* câu hỏi muốn xem chi tiết, liệt kê, gom nhóm, phân tích → báo cáo (q:"report") thay vì một con số tổng */
  const REPORT = / (gi|nhung gi|cai gi|khoan gi|khoan nao|nhung khoan|cac khoan|tung khoan|liet ke|chi tiet|cu the|phan tich|thong ke|tong hop|bao cao|gom nhom|gom lai|theo nhom|theo loai|theo danh muc|theo ngay|theo tuan|theo thang|vao dau|vao viec gi|cho viec gi|vao nhung gi|o dau|top|lon nhat|nhieu tien nhat|khoan to|so voi|so sanh|co nhieu hon|co it hon|tang hay giam) /;
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
  function asQuery(text, ctx){
    const n = " " + norm(text).replace(/[?!.,:;]/g, " ").replace(/\s+/g, " ") + " ";
    const now = (ctx && ctx.now) || new Date();
    const nq = n.replace(/ gi (do|day|ay|ca) /g, " ");                 /* "200k gì đó" là lời kể, không phải câu hỏi */
    let wantsReport = REPORT.test(nq) || /^ (cho (toi|minh|em|tao) (biet|xem)|liet ke|thong ke|phan tich|bao cao|xem) /.test(nq);
    const isQ = /\?\s*$/.test(text) || / (bao nhieu|bn|may|nhieu khong|the nao|sao) /.test(n) || /^ (xem|cho xem|tong) /.test(n) || / (ai|nhung ai) (con |dang |van )?no | no (ai|nhung ai) /.test(n) || wantsReport;
    if(!isQ) return null;
    const { N } = tokenize(text);
    if(wantsReport && !/\?\s*$/.test(text)){
      /* có số tiền mà không đứng sau "trên/hơn/từ/top" thì là kể chi tiêu, không phải hỏi */
      for(let i = 0; i < N.length; i++){ const a = amountAt(N, i); if(a && !["tren","hon","tu","top","duoi"].includes(N[i-1])) return null; if(a) i += a.n - 1; }
    }
    if(!wantsReport){ for(let i = 0; i < N.length; i++){ const a = amountAt(N, i); if(a && !/ (bao nhieu|bn) /.test(n)) return null; } }
    /* "tháng này so với tháng trước": kỳ chính là kỳ nói trước, kỳ so sánh tự lấy kỳ liền trước */
    const cmpAt = n.search(/ (so voi|so sanh) /);
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
    if(/ so du | (tai khoan|tk|vi) con /.test(n) && !wantsReport) return { q:"balance" };
    if(/ (no|vay) /.test(n) && !/ the /.test(n)){
      const m = n.match(/ (?:minh|toi) no (.+?) bao/) ; const m2 = n.match(/ (.+?) (?:con )?no (?:minh|toi)/);
      let who = m ? m[1] : m2 ? m2[1].replace(/^(con|da) /, "") : "";
      who = who.replace(/\b(con|da|van)\b/g, " ").trim();
      if(/^(ai|nhung ai|may nguoi|bao nhieu nguoi|ai ma)$/.test(who)) who = "";
      return { q:"loans", who: who.trim(), dir: m ? "borrow" : m2 ? "lend" : null };
    }
    if(/ (ngay nao|hom nao) .*(nhieu nhat|tieu nhieu)/.test(n)) return { q:"topday", period: period || "month" };
    if(wantsReport){
      const q = { q:"report", period: period || "month", src, cardId, tag, group:"tag", list:false, top:0, minAmt:0, kind:"out", compare:false };
      if(qw) q.wid = qw.id;
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
      if(/ (so voi|so sanh|co nhieu hon|co it hon|tang hay giam|tang khong|giam khong) /.test(n)) q.compare = true;
      return q;
    }
    if(/ the /.test(n) && !/ (an|uong) /.test(n)) return { q:"card", period: period || "month" };
    if(/ con (bao nhieu|bn|duoc) | con lai /.test(n) && (!period || (period === "today" && !/ (tieu|chi|xai|het|ton|an|uong|mua) /.test(n)))) return { q:"left" };
    if(/ (tieu|chi|xai|het|ton|an|uong|mua) /.test(n) || tag || period){
      const q = { q:"spent", period: period || "today", tag, src };
      if(qw) q.wid = qw.id;
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
    if(/ an uong /.test(n)){ q.tag = "an+uong"; changed = true; }
    else {
      const g = guessTag(text.replace(/\b(chi tiết|chỉ tính|chỉ|tính|tiêu|chi|thôi|thì sao|còn)\b/gi, " "), null);
      if(g !== "khac" && !/ (tat ca|bo loc) /.test(n)){ q.tag = g; changed = true; }
    }
    /* phải có dấu hiệu nối tiếp, tránh bắt nhầm câu kể chuyện */
    const cue = / (chi|chi tinh|chi xem|chi lay|con|thi sao|the con|vay con|xem|loc|bo|them|nua|thoi|tinh|lay ra|ke ra|liet ke|so voi|theo) /.test(n) || N.length <= 6;
    if(!changed || !cue) return null;
    if(q.q === "spent" && (q.group && q.group !== "tag" || q.list || q.top || q.compare)) q.q = "report";
    if(q.q === "report") q.group = q.group || "tag";
    return q;
  }

  /* ---------------- đầu vào chính ---------------- */
  function parse(text, ctx){
    ctx = ctx || {}; if(!ctx.now) ctx.now = new Date();
    const raw = String(text || "").trim();
    if(!raw) return { items:[], query:null, unknown:[] };
    const query = asQuery(raw, ctx);
    if(query) return { items:[], query, unknown:[] };
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
    return { items, query:null, unknown };
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
  const ASK = / (nen|co nen|tu van|goi y|lam sao|lam the nao|tai sao|vi sao|du doan|du kien|tuan sau|thang sau|nam sau|ke hoach|xu huong) |^ sao /;
  const EDIT = / (sua|doi|chinh) (khoan|cai|lai|thanh|so|tien) | thanh \d| ghi (nham|sai|lon|thieu|thua) /;
  function assess(text, res, ctx){
    ctx = ctx || {};
    const why = [], n = " " + norm(text).replace(/[?!.,;:]/g, " ").replace(/\s+/g, " ") + " ";
    if(!res) res = parse(text, ctx);
    if(res.query){
      if(res.query.q === "unknown" || ASK.test(n)) why.push("query");
      return { local:!why.length, why };
    }
    if(!res.items.length){ why.push("noitem"); return { local:false, why }; }
    if(res.unknown && res.unknown.length) why.push("leftover");
    const { N } = tokenize(text); let cnt = 0;
    for(let i = 0; i < N.length; i++){ const a = amountAt(N, i); if(a){ cnt++; i += a.n - 1; } }
    if(cnt > res.items.length) why.push("numbers");
    if(HARD.test(n) || EDIT.test(n) || /%/.test(text)) why.push("words");
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

  const api = { parse, assess, refine, amountText, guessTag, norm, _amountAt:amountAt, _clauses:clauses };
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  else root.N50KParse = api;
})(typeof window !== "undefined" ? window : this);
