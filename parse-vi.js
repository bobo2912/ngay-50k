/* Ngày 50k – bộ hiểu câu tiếng Việt chạy ngay trên máy (không cần mạng, không gửi dữ liệu đi đâu).
   parse(text, ctx) -> { items:[...], query:{...}|null, unknown:[đoạn không hiểu] }
   Mỗi item: { kind, amt, note, cat, date:"yyyy-mm-dd", t, cardId, who, loanId, src }
     kind: "out" (chi tài khoản/tiền mặt) | "card" (quẹt thẻ) | "in" (khoản thu)
           | "lend" (cho vay) | "borrow" (đi vay) | "repay" (mình trả nợ) | "collect" (người ta trả mình)
           | "cardpay" (trả thẻ) | "bal" (số dư thật)
   ctx: { now:Date, cards:[{id,name}], loans:[{id,type,who,settled}], tags:[{id,label}], history:(note)=>tagId|"" }
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
    if(unit === "k" || unit === "ng" || unit === "ngh" || unit === "nghin" || unit === "ngan") v *= 1000;
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
    let date = null, hh = null, mm = null; const drop = new Set();
    const at = (i, words) => words.every((w, k) => N[i+k] === w);
    for(let i = 0; i < N.length; i++){
      const w = N[i];
      if(at(i, ["hom","nay"])){ date = keyOf(now); drop.add(i).add(i+1); }
      else if(at(i, ["hom","qua"])){ date = keyOf(addDays(now, -1)); drop.add(i).add(i+1); }
      else if(at(i, ["hom","kia"])){ date = keyOf(addDays(now, -2)); drop.add(i).add(i+1); }
      else if(at(i, ["bua","nay"]) || at(i, ["bua","qua"])){ date = keyOf(addDays(now, N[i+1] === "qua" ? -1 : 0)); drop.add(i).add(i+1); }
      else if(PARTS[w] !== undefined && (N[i+1] === "nay" || N[i+1] === "qua" || i === 0 || drop.has(i-1) || N[i-1] === "buoi" || N[i-1] === "an")){
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
    ["dienthoai",["nạp thẻ","nạp tiền điện thoại","nạp 3g","nạp 4g","3g","4g","5g","data","cước","internet","wifi","viettel","vinaphone","mobifone","fpt","điện thoại"]],
    ["diennuoc", ["tiền điện","tiền nước","điện nước","hoá đơn điện","hóa đơn điện","gas"]],
    ["nha",      ["tiền nhà","thuê nhà","tiền phòng","tiền trọ","phí quản lý","chung cư"]],
    ["uong",     ["cà phê","cafe","coffee","cf","trà sữa","sinh tố","nước mía","nước ép","bia","rượu","highlands","starbucks","phúc long","katinat","cộng cà phê","trà chanh","nước ngọt","nước uống","milo","đồ uống"]],
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
  const AMBIG = new Set(["cho","cho con","cha","con","ca","sua","ao","quan","but","vo","the","tra","an","son","rau","bia","chó","chợ"]);
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
    const parts = String(text).split(/[\n;]+|,(?!\d{3})|\.(?=\s+[^\d])|\s\+\s/).map(s => s.trim()).filter(Boolean);
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

    /* số dư thật */
    if(hasW("so du") || (hasW("tai khoan") && hasW("con")) || (hasW("tk") && hasW("con")) || (hasW("vi") && hasW("con") && !hasW("tieu"))){
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
      if(ic > 0 && ic <= 3 && N.indexOf("vay") < 0 && N.indexOf("muon") < 0 && (GIVERS.has(N[0]) || /^[A-ZĐÀ-Ỹ]/.test(O[0])) && N.slice(0, ic).every(w => !["mua","tra","chi","tieu","an","nap","gui"].includes(w))){
        kind = "in"; item.cat = "cho"; item.who = nameFrom(O, N, 0, ic, drop);
      }
    }
    /* khoản thu */
    if(!kind){
      for(const [cat, seqs] of INC_RULES){ for(const s of seqs){ if(has(N, s) >= 0){ kind = "in"; item.cat = cat; break; } } if(kind) break; }
      if(kind === "in" && item.cat === "ban" && (hasW("mua") || hasW("tieu"))){ kind = null; delete item.cat; }
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
        if(hasW("tien mat") || hasW("tm")){ item.src = "cash"; markDrop(["tien","mat"]); }
        markDrop(["chuyen","khoan"]); const ck = N.indexOf("ck"); if(ck >= 0) drop.add(ck);
      }
    }
    item.kind = kind;

    /* nội dung: phần chữ còn lại, bỏ từ thừa */
    const SKIP = new Set(["het","mat","ton","la","tieu","chi","bang","qua","luc","vao","o","tai","duoc","da","vua","moi","roi","xong","thi"]);
    const PARTICLE = new Set(["nhé","nha","nhe","nhỉ","à","ạ","a","thôi","nhá","đó","đấy"]);
    const words = [];
    O.forEach((w, i) => { if(drop.has(i)) return; const n = N[i]; if(!n) return; if(PARTICLE.has(clean(w).toLowerCase())) return; if(SKIP.has(n) && (words.length === 0 || i === O.length - 1 || ["het","mat","ton"].includes(n))) return; words.push(clean(w) || w); });
    while(words.length && (SKIP.has(norm(words[words.length-1])) || PARTICLE.has(words[words.length-1].toLowerCase()))) words.pop();
    let note = words.join(" ").replace(/\s+/g, " ").trim();
    if(kind === "lend" || kind === "borrow" || kind === "repay" || kind === "collect" || kind === "bal" || kind === "cardpay") note = "";
    if(kind === "in" && /^(nhận|nhan|được|duoc)$/i.test(note)) note = "";
    if(kind === "in" && item.cat === "cho" && item.who && !note) note = item.who + " cho";
    item.note = note ? note.charAt(0).toUpperCase() + note.slice(1) : "";
    if(kind === "out" || kind === "card") item.cat = guessTag(O.join(" "), ctx);
    return { item, meta };
  }

  /* ---------------- câu hỏi ---------------- */
  function asQuery(text, ctx){
    const n = " " + norm(text).replace(/[?!.,]/g, " ").replace(/\s+/g, " ") + " ";
    const isQ = /\?\s*$/.test(text) || / (bao nhieu|bn|may|nhieu khong|the nao|sao) /.test(n) || /^ (xem|cho xem|tong) /.test(n);
    if(!isQ) return null;
    const { N } = tokenize(text); for(let i = 0; i < N.length; i++){ const a = amountAt(N, i); if(a && !/ (bao nhieu|bn) /.test(n)) return null; }
    let period = null;
    if(/ hom nay | nay /.test(n) && !/ thang nay | tuan nay /.test(n)) period = "today";
    if(/ hom qua /.test(n)) period = "yesterday";
    if(/ tuan nay /.test(n)) period = "week";
    if(/ tuan truoc /.test(n)) period = "lastweek";
    if(/ thang nay /.test(n)) period = "month";
    if(/ thang truoc /.test(n)) period = "lastmonth";
    const tag = (() => { if(/ an uong /.test(n)) return "an+uong"; const g = guessTag(text, null); return g !== "khac" ? g : null; })();
    if(/ so du | (tai khoan|tk|vi) con /.test(n)) return { q:"balance" };
    if(/ (no|vay) /.test(n) && !/ the /.test(n)){
      const m = n.match(/ (?:minh|toi) no (.+?) bao/) ; const m2 = n.match(/ (.+?) (?:con )?no (?:minh|toi)/);
      let who = m ? m[1] : m2 ? m2[1].replace(/^(con|da) /, "") : "";
      who = who.replace(/\b(con|da|van)\b/g, " ").trim();
      if(/^(ai|nhung ai|may nguoi|bao nhieu nguoi|ai ma)$/.test(who)) who = "";
      return { q:"loans", who: who.trim(), dir: m ? "borrow" : m2 ? "lend" : null };
    }
    if(/ the /.test(n) && !/ (an|uong) /.test(n)) return { q:"card", period: period || "month" };
    if(/ con (bao nhieu|bn|duoc) | con lai /.test(n) && !period) return { q:"left" };
    if(/ (ngay nao|hom nao) .*(nhieu nhat|tieu nhieu)/.test(n)) return { q:"topday", period: period || "month" };
    if(/ (tieu|chi|xai|het|ton|an|uong|mua) /.test(n) || tag || period) return { q:"spent", period: period || "today", tag };
    return { q:"unknown" };
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

  /* đọc số tiền người dùng gõ trong ô sửa ("45k", "1tr2", "45.000") */
  function amountText(s){ const { N } = tokenize(s); const a = amountAt(N, 0); return a ? a.v : (parseInt(String(s).replace(/\D/g, ""), 10) || 0); }

  const api = { parse, amountText, guessTag, norm, _amountAt:amountAt, _clauses:clauses };
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  else root.N50KParse = api;
})(typeof window !== "undefined" ? window : this);
