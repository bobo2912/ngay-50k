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
  const hasMarks = s => /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổổơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s);
  const pad = n => String(n).padStart(2, "0");
  const keyOf = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const isCap = w => { const c = String(w || "").charAt(0); return !!c && c !== c.toLowerCase() && c === c.toUpperCase(); };
  const clean = w => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}%]+$/gu, "");

  /* ---------------- số tiền ---------------- */
  const COUNTERS = new Set(["cai","ly","coc","chai","hop","goi","phan","suat","to","dia","nguoi","lan","ve","kg","qua","chiec","doi","bo","thang","ngay","tuan","nam","gio","h","phut","lon","bat","mon","cuon","tam","con","trai","cay","lit","km","m","g","gb","tb","%","dot","ky","buoi","tiet","so","thu","khoan","thung","lo","loc","tui","bich","hu","khay","mieng","thanh","chuc","set","combo","cap","xap","tep","que","bo_","hop","goi","nam_"]);
  const OF = new WeakMap();
  const pair = (O, N) => { OF.set(N, O); return { O, N }; };
  const K_UNITS = new Set(["k","ng","ngh","nghin","ngan","nghn","ka","x"]);
  const M_UNITS = new Set(["tr","trieu","cu","m","mil","chai_"]);
  function numOf(raw){
    if(/^\d{1,3}([.,]\d{3})+$/.test(raw)) return parseInt(raw.replace(/[.,]/g, ""), 10);
    if(/^\d+[.,]\d+$/.test(raw)) return parseFloat(raw.replace(",", "."));
    if(/^\d+$/.test(raw)) return parseInt(raw, 10);
    return NaN;
  }
  function amountAt(N, i){
    const t = N[i]; if(!t) return null;
    const O = OF.get(N), po = O && O[i-1] ? clean(O[i-1]).toLowerCase() : "";
    const afterDate = i > 0 && !(i > 1 && O && isCap(clean(O[i-1] || ""))) && (hasMarks(po) ? ["tháng","ngày","thứ","tuần","kỳ","đợt"].includes(po) : ["thang","ngay","thu","ky","dot"].includes(N[i-1]));
    if(afterDate && (/^\d{1,2}$/.test(t) ? !(K_UNITS.has(N[i+1]) || ["tr","trieu","cu","d","dong","vnd"].includes(N[i+1])) : !/^\d{3,}$|^\d+([.,]\d{3})+$|^\d+(k|ng|ngh|nghin|ngan|tr|trieu|cu|d|dong|vnd)\d*$/.test(t))) return null;
    if(i > 0 && (["chia","x"].includes(N[i-1]) || (po === "nhân" || po === "gấp")) && /^\d{1,2}$/.test(t) && !K_UNITS.has(N[i+1])) return null;
    if(i > 1 && N[i-1] === "cho" && N[i-2] === "chia" && /^\d{1,2}$/.test(t)) return null;
    let m = t.match(/^(\d+(?:[.,]\d+)*)(k|ng|ngh|nghin|ngan|tr|trieu|cu|m|d|dong|vnd|t)?(\d{1,3})?$/);
    if(!m) return null;
    let v = numOf(m[1]); if(isNaN(v)) return null;
    let unit = m[2] || "", tail = m[3] || "", used = 1;
    if(unit === "t" && !tail) return null;
    if(!unit){
      const nx = N[i+1] || "";
      if(K_UNITS.has(nx) && !(nx === "x" && /^\d{1,2}$/.test(N[i+2] || ""))){ unit = "k"; used = 2; }
      else if(nx === "tr" || nx === "trieu" || nx === "cu"){ unit = "tr"; used = 2; }
      else if(nx === "tram"){ unit = "tram"; used = 2; }
      else if(nx === "d" || nx === "dong" || nx === "vnd"){ unit = "d"; used = 2; }
      else if(COUNTERS.has(nx) && !/[.,]/.test(m[1]) && v < 100) return null;
    }
    if(unit === "k" || unit === "ng" || unit === "ngh" || unit === "nghin" || unit === "ngan"){ v *= 1000; if(tail && unit === "k") v += parseInt(tail, 10) * Math.pow(10, 3 - tail.length); }
    else if(unit === "tr" || unit === "trieu" || unit === "cu" || unit === "m" || unit === "t"){
      v *= 1000000;
      if(tail) v += parseInt(tail, 10) * Math.pow(10, 6 - tail.length);
      else {
        const nx = N[i+used] || "", nn = N[i+used+1] || "";
        if(/^\d{1,3}$/.test(nx)){
          if(K_UNITS.has(nn)){ v += parseInt(nx, 10) * 1000; used += 2; }
          else if(nn === "tram"){ v += parseInt(nx, 10) * 100000; used += 2; }
          else if(!COUNTERS.has(nn) || nx.length === 1){ v += parseInt(nx, 10) * Math.pow(10, 6 - nx.length); used += 1; }
        } else if(nx === "ruoi"){ v += 500000; used += 1; }
      }
    }
    else if(unit === "tram") v *= 100000;
    else if(v < 1000) v *= 1000;
    if(N[i+used] === "ruoi" && (unit === "k" || unit === "tram")){ v += unit === "tram" ? 50000 : 500; used++; }
    v = Math.round(v);
    if(!(v > 0) || v > 100000000000) return null;
    return { v, n:used };
  }

  /* ---------------- ngày giờ ---------------- */
  const WDAY = { "thu 2":1, "thu hai":1, "thu 3":2, "thu ba":2, "thu 4":3, "thu tu":3, "thu 5":4, "thu nam":4, "thu 6":5, "thu sau":5, "thu 7":6, "thu bay":6, "chu nhat":0, "cn":0 };
  const PARTS = { sang:8, trua:12, chieu:16, toi:20, dem:22 };
  function dateIn(N, now){
    const O = OF.get(N);
    const isMe = i => {
      const o = O && O[i] ? clean(O[i]).toLowerCase() : "";
      if(hasMarks(o)) return o === "tôi";
      return !(N[i+1] === "nay" || N[i+1] === "qua" || N[i-1] === "buoi");
    };
    let date = null, hh = null, mm = null; const drop = new Set();
    const at = (i, words) => words.every((w, k) => N[i+k] === w);
    const oL = i => O && O[i] ? clean(O[i]).toLowerCase() : "";
    const fut = N.some((w, i) => (w === "du" && (N[i+1] === "kien" || N[i+1] === "tinh")) || (w === "ke" && N[i+1] === "hoach") || ["sẽ","sắp","định","hẹn"].includes(oL(i)) || (w === "tuan" && (N[i+1] === "sau" || N[i+1] === "toi")) || (w === "thang" && (N[i+1] === "sau" || N[i+1] === "toi")));
    if(fut) N.forEach((w, i) => { if((w === "du" && (N[i+1] === "kien" || N[i+1] === "tinh")) || (w === "ke" && N[i+1] === "hoach")) drop.add(i).add(i+1); if(["sẽ","sắp","định"].includes(oL(i))) drop.add(i); });
    for(let i = 0; i < N.length; i++){
      const w = N[i];
      if((at(i, ["ngay","mai"]) || (PARTS[w] !== undefined && N[i+1] === "mai")) && !isCap(clean(O ? O[i+1] || "" : ""))){
        date = keyOf(addDays(now, 1)); drop.add(i).add(i+1); if(PARTS[w] !== undefined && hh === null) hh = PARTS[w]; i++; continue;
      }
      if(at(i, ["ngay","kia"]) || (w === "ngay" && oL(i+1) === "mốt") || oL(i) === "mốt"){ date = keyOf(addDays(now, 2)); drop.add(i); if(w === "ngay") drop.add(i+1); continue; }
      if(w === "hnay" || w === "homnay" || at(i, ["hum","nay"])){ date = keyOf(now); drop.add(i); if(w === "hum") drop.add(i+1); }
      else if(w === "nay" && ["luc","vua","ban","khi","hoi"].includes(N[i-1])){ if(!date) date = keyOf(now); drop.add(i).add(i-1); }
      else if(w === "hqua" || w === "homqua" || at(i, ["hum","qua"])){ date = keyOf(addDays(now, -1)); drop.add(i); if(w === "hum") drop.add(i+1); }
      else if(w === "hkia" || w === "homkia"){ date = keyOf(addDays(now, -2)); drop.add(i); }
      else if(at(i, ["hom","nay"])){ date = keyOf(now); drop.add(i).add(i+1); }
      else if(at(i, ["hom","qua"])){ date = keyOf(addDays(now, -1)); drop.add(i).add(i+1); }
      else if(at(i, ["hom","kia"])){ date = keyOf(addDays(now, -2)); drop.add(i).add(i+1); }
      else if(PARTS[w] !== undefined && (N[i+1] === "nay" || N[i+1] === "qua" || i === 0 || drop.has(i-1) || N[i-1] === "buoi") && !(w === "toi" && isMe(i))){
        if(hh === null) hh = PARTS[w];
        if(N[i+1] === "nay"){ drop.add(i).add(i+1); if(!date) date = keyOf(now); }
        else if(N[i+1] === "qua"){ drop.add(i).add(i+1); date = keyOf(addDays(now, -1)); }
        else if(N[i-1] !== "an") drop.add(i);
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
        }
      }
      else if(/^\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?$/.test(w)){
        const p = w.split(/[\/\-]/).map(Number), y = p[2] ? (p[2] < 100 ? 2000 + p[2] : p[2]) : now.getFullYear();
        const d = new Date(y, p[1] - 1, p[0]);
        if(d.getMonth() === p[1] - 1){ date = keyOf(d); drop.add(i); if(N[i-1] === "ngay") drop.add(i-1); }
      }
    }
    return { date, hh, mm, drop };
  }

  /* ---------------- danh mục chi tiêu ---------------- */
  const TAG_RULES = [
    ["xang",     ["đổ xăng","xăng","đổ dầu","petrolimex","pvoil","nhớt","sạc xe điện","sạc xe","trạm sạc"]],
    ["dilai",    ["grab bike","grabbike","grab car","grabcar","grab","xanh sm","xanhsm","taxi","mai linh","vinasun","xe ôm","gửi xe","giữ xe","phí gửi xe","bus","metro","vé tàu","vé xe","phí đường bộ","thuê xe"]],
    ["dienthoai",["tiền mạng","cước mạng","mạng","cước điện thoại","nạp thẻ","thẻ cào","nạp tiền điện thoại","3g","4g","5g","data","internet","wifi","viettel","vinaphone","mobifone","fpt","vnpt","sim","icloud","google one"]],
    ["diennuoc", ["tiền điện","tiền nước","điện nước","tiền ga","đổi ga","gas","tiền rác","evn"]],
    ["nha",      ["tiền nhà","thuê nhà","tiền phòng","tiền trọ","phòng trọ","phí quản lý","phí chung cư","máy giặt","tủ lạnh","điều hoà","điều hòa","nước giặt","nước rửa bát","giấy vệ sinh","đồ gia dụng","dọn nhà","giúp việc"]],
    ["uong",     ["nước","trà đá","trà","cà phê","cafe","café","coffee","cf","bạc xỉu","trà sữa","sinh tố","nước mía","nước ép","bia","rượu","highlands","starbucks","phúc long","katinat","the coffee house","mixue"]],
    ["cho",      ["sữa","đi chợ","chợ","siêu thị","winmart","coopmart","bách hoá xanh","aeon","big c","go!","rau","thịt","cá","tôm","trứng","gạo","gia vị","trái cây","thực phẩm"]],
    ["an",       ["ăn","cơm","phở","bún","miến","mì","cháo","bánh mì","xôi","lẩu","nướng","kfc","lotteria","pizza","sushi","gà rán","cơm tấm","bún chả","bún bò","ốc","hải sản","chè","kem","ăn sáng","ăn trưa","ăn tối","grabfood","shopeefood","nhà hàng","quán ăn"]],
    ["muasam",   ["shopee","lazada","tiki","tiktok shop","quần áo","áo","quần","váy","giày","dép","túi xách","ví","mũ","kính","đồng hồ","mỹ phẩm","điện thoại","laptop","tai nghe","sạc","ốp lưng","phụ kiện"]],
    ["suckhoe",  ["thuốc","khám","khám bệnh","bệnh viện","phòng khám","nhà thuốc","pharmacity","long châu","vitamin","nha khoa","răng","y tế","gym","yoga","thể thao"]],
    ["lamdep",   ["cắt tóc","gội đầu","làm tóc","nail","spa","massage","son","son môi","kem chống nắng","skincare","nước hoa","làm đẹp"]],
    ["hoctap",   ["học phí","khoá học","sách","vở","bút","tiếng anh","ielts","toeic","văn phòng phẩm","in ấn"]],
    ["giaitri",  ["xem phim","rạp phim","cgv","lotte cinema","game","nạp game","steam","netflix","spotify","youtube","karaoke","giải trí","đi chơi"]],
    ["dulich",   ["du lịch","khách sạn","homestay","vé máy bay","agoda","booking","traveloka","airbnb","resort"]],
    ["concai",   ["bỉm","tã","đồ chơi","học phí con","mầm non","sữa bột","cho bé"]],
    ["thucung",  ["chó","mèo","pate","hạt cho mèo","thú cưng","thú y","pet shop"]],
    ["hieuhy",   ["đám cưới","mừng cưới","sinh nhật","quà","đám ma","viếng","mừng tuổi","lì xì","hiếu hỷ"]],
    ["tuthien",  ["từ thiện","ủng hộ","công đức","quyên góp"]],
    ["suachua",  ["sửa xe","thay nhớt","rửa xe","bảo dưỡng","sửa điện thoại","sửa máy tính","sửa chữa"]],
    ["khac",     ["phí chuyển khoản","phí ngân hàng","thuế","phạt","rút tiền"]]
  ];
  const AMBIG = new Set(["cho","con","ca","sua","ao","quan","but","vo","the","tra","an","son","chó","chợ","nuoc","che","bo","ga","dau","keo","hoa","cam","le","nho","mang","hanh","duong","sach","hoc","sang","trua","toi","bua","ban","bia","banh","kem","nem","com","mi","bun","pho","oc","tom","cua","muc","ngan","chay","bar","lon"]);
  const WEAK = new Set(["trưa","sáng","tối","bữa","ăn","mua","đồ ăn"]);
  const DICT = []; TAG_RULES.forEach(([tag, words], ti) => words.forEach(w => DICT.push({ tag, ti, w:w.toLowerCase(), n:norm(w), weak:WEAK.has(w) })));
  let lastHit = null;
  function guessTag(text, ctx){
    if(ctx && ctx.history){ const h = ctx.history(text); if(h) return h; }
    const low = " " + String(text).toLowerCase().replace(/[^\p{L}\p{N}&!.\-/%]+/gu, " ").replace(/\s+/g, " ").trim() + " ";
    const n = " " + norm(text).replace(/[^a-z0-9&!.\-/%]+/g, " ").replace(/\s+/g, " ").trim() + " ";
    let best = null, bs = 0;
    const consider = (tag, ti, sc, w) => { if(sc > bs || (sc === bs && best && ti < best.ti)){ bs = sc; best = { tag, ti, w }; } };
    ((ctx && ctx.tags) || []).forEach(t => { const ln = norm(t.label || "").trim(); if(ln.length >= 3 && n.includes(" " + ln + " ")) consider(t.id, -1, ln.length * 2 + 2); });
    for(const d of DICT){
      if(low.includes(" " + d.w + " ")) consider(d.tag, d.ti, d.weak ? 1 : d.n.length * 2 + 1, d.w);
      else if(!AMBIG.has(d.n)){
        const i = n.indexOf(" " + d.n + " ");
        if(i >= 0) consider(d.tag, d.ti, d.weak ? 0.5 : d.n.length * 2, d.w);
      }
    }
    lastHit = best;
    return best ? best.tag : "khac";
  }

  /* ---------------- tách câu và phân tích chính ---------------- */
  const SPLIT_WORDS = ["va","voi","roi","xong","con","them","cung","kem"];
  const SPLIT_MARK = { va:"và", voi:"với", roi:"rồi", xong:"xong", con:"còn", them:"thêm", cung:"cùng", kem:"kèm" };
  const isSplit = (O, N, j) => { const w = N[j]; if(!SPLIT_WORDS.includes(w)) return false; const o = clean(O[j] || "").toLowerCase(); return !hasMarks(o) || o === SPLIT_MARK[w]; };
  function tokenize(text){
    const O = String(text).replace(/[ ]/g, " ").replace(/(\d)\s*([kK])\b/g, "$1$2").split(/\s+/).map(w => w.trim()).filter(Boolean);
    return pair(O, O.map(w => clean(norm(w))));
  }
  function clauses(text){
    const parts = String(text).split(/[\n;]+|,(?!\d)|(?<!\d),|\.(?=\s+[^\d])|\s\+\s/).map(s => s.trim()).filter(Boolean);
    const out = [];
    parts.forEach(p => {
      const { O, N } = tokenize(p);
      const amts = []; for(let i = 0; i < N.length; i++){ const a = amountAt(N, i); if(a){ amts.push([i, a.n]); i += a.n - 1; } }
      if(amts.length <= 1){ out.push(pair(O, N)); return; }
      let start = 0;
      amts.forEach(([ai, an], k) => {
        if(k === amts.length - 1){ out.push(pair(O.slice(start), N.slice(start))); return; }
        let cut = ai + an, nextA = amts[k+1][0];
        for(let j = ai + an; j < nextA; j++){ if(SPLIT_WORDS.includes(N[j]) && isSplit(O, N, j)){ cut = j; break; } }
        out.push(pair(O.slice(start, cut), N.slice(start, cut)));
        start = cut;
      });
    });
    return out;
  }

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
    let t = hh !== null ? new Date(date + "T" + pad(hh) + ":00:00").getTime() : new Date(date + "T12:00:00").getTime();
    item.t = t;
    if(!amt) return { item:null, meta:{ date:dt.date, hh }, text:O.join(" ") };

    item.kind = "out";
    const words = [];
    O.forEach((w, i) => { if(!drop.has(i)) words.push(clean(w) || w); });
    item.note = words.join(" ").trim();
    item.cat = guessTag(O.join(" "), ctx);
    return { item, meta:{ date:dt.date, hh } };
  }

  function parse(text, ctx){
    ctx = ctx || {}; if(!ctx.now) ctx.now = new Date();
    const raw = String(text || "").trim();
    if(!raw) return { items:[], query:null, unknown:[] };
    const items = [], unknown = [];
    let carry = { date:null, hh:null };
    clauses(raw).forEach(c => {
      const r = oneClause(c, ctx, carry);
      if(r.meta.date) carry.date = r.meta.date;
      if(r.item) items.push(r.item);
    });
    return { items, query:null, unknown };
  }

  /* ---------------- MAP VÀ PACK DỮ LIỆU TỐC ĐỘ CAO (TỪ ĐIỂN THUVIEN) ---------------- */
  function cleanAndMapDescription(rawText, mappingTable) {
      if (!rawText) return "";
      let ndMatch = rawText.match(/(?:ND|Nội dung|CK)[:\s]+([^#\n]+)/i);
      let cleanText = ndMatch ? ndMatch[1].trim() : rawText.trim();
      cleanText = cleanText.replace(/\s+/g, ' ');

      if (mappingTable && mappingTable.length > 0) {
          for (let i = 0; i < mappingTable.length; i++) {
              let keyword = mappingTable[i][0];
              let mappedNote = mappingTable[i][1];
              if (keyword && cleanText.toUpperCase().includes(keyword.toUpperCase())) {
                  cleanText = mappedNote;
                  break;
              }
          }
      }
      return cleanText;
  }

  function handleDataPack(pack) {
      if (!pack || pack.status !== "success") return;
      let mappingTable = pack.mappingTable || [];
      let rawTransactions = pack.transactions || [];
      
      let processedTransactions = rawTransactions.map(row => {
          let originalContent = row[2] || "";
          let refinedNote = cleanAndMapDescription(originalContent, mappingTable);
          return { date: row[0] || "", amount: row[1] || 0, rawContent: originalContent, note: refinedNote };
      });
      
      try {
          localStorage.setItem('cached_transactions_pack', JSON.stringify(processedTransactions));
      } catch (e) {
          console.error("Lỗi lưu cache:", e);
      }
      return processedTransactions;
  }

  const api = { 
    parse, cleanAndMapDescription, handleDataPack,
    _amountAt:amountAt, _clauses:clauses, _tokenize:tokenize 
  };
  
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  else root.N50KParse = api;
})(typeof window !== "undefined" ? window : this);
