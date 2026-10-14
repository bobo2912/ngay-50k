/* Tiêu Gọn – THƯ VIỆN NỘI DUNG (quy tắc làm gọn thông báo ngân hàng). Chạy trên máy, không gửi đi đâu.

   Từ v158 thay sheet ThuVien của Google Sheet. Quy tắc nằm trong dữ liệu chính của app (state.thuvien),
   được mã hoá khi bật mã PIN, đi theo file sao lưu. File này chỉ có cách khớp, KHÔNG có quy tắc của ai.
   Mọi ví dụ dưới đây là tên và số giả.

   Mỗi quy tắc: { k: từ khoá (cột A), r: nội dung thay (cột B), tag?: mã tag tự gắn }

   ───────── Cách viết từ khoá (cột A) ─────────
     grabfood          nội dung chứa "grabfood" (không phân biệt hoa thường, có dấu hay không)
     ck                từ ≤ 3 ký tự phải đứng thành từ riêng ("ck" không khớp "ckb")
     ^ck               nội dung BẮT ĐẦU bằng "ck"
     hoan tien$        nội dung KẾT THÚC bằng "hoan tien"
     "an"              khớp nguyên từ "an" (không khớp "ban", "anh")
     grab*food         * thay cho đoạn bất kỳ ("grab food", "grabfood", "grab-xyz-food")
     grab, be, xanh sm một trong các từ (dấu phẩy = HOẶC)
     grab & food       phải có cả hai (dấu & = VÀ)
     grab & -hoan      có "grab" nhưng KHÔNG có "hoan"
     DEN:nguyen van a  người nhận (phần DEN: của thông báo, có cả số tài khoản)
     TU:0123456789     người gửi (tên hoặc số tài khoản)
     TK:12xxx345       tài khoản của bạn trong thông báo (khi có nhiều tài khoản)
     DONG:abc          cả dòng thông báo
     TIEN:50k          đúng 50.000đ; TIEN:<50k, TIEN:>=1tr, TIEN:10k-50k, TIEN:+ (tiền vào), TIEN:- (tiền ra)
     Ghép: DEN:nguyen van a & TIEN:<100k & -hoan
   Mặc định (không ghi trường) là phần nội dung: ND: (chuyển khoản), Tại: (chạm thẻ), Nội dung giao dịch: (thẻ tín dụng).

   ───────── Nội dung thay (cột B) ─────────
     {DEN}  tên người nhận (bỏ số tài khoản)     {TU}   tên người gửi
     {ND}   nội dung gốc đã bỏ mã giao dịch      {TIEN} số tiền, vd 45.000đ
     Để trống cột B mà có tag = giữ nguyên nội dung, chỉ gắn tag.

   ───────── Thứ tự xét ─────────
     Quy tắc cụ thể hơn được xét trước: có điều kiện người nhận/người gửi/tài khoản/số tiền, nhiều điều kiện hơn,
     từ khoá dài hơn. Khớp quy tắc đầu tiên là dừng.

   API: N50KRule.parse(k) · apply(line, rules) · applyText(text, rules) · explain(k) · lint(rule, rules) · suggest(line) · fields(line)
   Thử: node tests-quy-tac.js */
(function(root){
  "use strict";

  const noAcc = s => String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, " ").trim();
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const W = "[a-z0-9]";

  /* ---------- đọc các phần của một dòng thông báo ---------- */
  function party(line, f){
    const m = line.match(new RegExp("(?:^|\\|)\\s*(?:" + f + ")\\s*:\\s*([^|]*)", "i"));
    return m ? m[1].trim() : "";
  }
  function partyName(v){ return String(v || "").replace(/\s+-\s+-?[A-Z0-9]*\d[A-Z0-9]*\s*$/i, "").trim() || String(v || ""); }
  /* [bắt đầu, kết thúc, thêm ';'] của phần nội dung trong dòng */
  function noteSpan(line){
    let m = line.match(/(\bND\s*:|N[ộo]i dung giao d[ịi]ch\s*:|N[ộo]i dung\s*:)\s*/i);
    if(m){
      const st = m.index + m[0].length, rest = line.slice(st), e = rest.indexOf("|");
      let end = e >= 0 ? st + e : line.length;
      while(end > st && /\s/.test(line[end - 1])) end--;
      return end > st ? [st, end, false] : null;
    }
    m = line.match(/\bT[ạa]i\s*:\s*/i);                                  /* chạm thẻ: "Tại: GS25 … Số tiền: …" */
    if(m){
      const s2 = m.index + m[0].length, r2 = line.slice(s2), e2 = r2.search(/\s+S[ốo] ti[ềe]n\s*:|\s*\|/i);
      let end2 = e2 >= 0 ? s2 + e2 : line.length;
      while(end2 > s2 && /[\s;]/.test(line[end2 - 1])) end2--;
      return end2 > s2 ? [s2, end2, true] : null;
    }
    return null;
  }
  function amountOf(line){
    let m = line.match(/\b(?:GD|PS)\s*:\s*([+\-])\s?(\d[\d.,]*)\s*(?:VND|VNĐ|đ)/i)
      || line.match(/(?:S[ốo] ti[ềe]n|Amount)\s*:?\s*([+\-])?\s?(\d[\d.,]*)/i)
      || line.match(/([+\-])\s?(\d{1,3}(?:[.,]\d{3})+)\s*(?:VND|VNĐ|đ)/i);
    if(!m) return { amt:0, sign:"" };
    const amt = Number(String(m[2]).replace(/[.,]/g, "")) || 0;
    let sign = m[1] || "";
    if(!sign && /ghi c[oó]|ti[ềe]n v[àa]o|nh[ậa]n ti[ềe]n|ho[àa]n ti[ềe]n/i.test(line)) sign = "+";
    if(!sign && /T[ạa]i\s*:|chi ti[êe]u|thanh to[áa]n/i.test(line)) sign = "-";
    return { amt, sign };
  }
  function account(line){ const m = line.match(/\b(?:TK|STK|Tài khoản|Tai khoan)\s*:?\s*([0-9xX*.]{4,})/); return m ? m[1] : ""; }
  /* nội dung gốc, bỏ tiền tố mã ngân hàng và mã giao dịch ở cuối */
  function cleanNote(t){
    let x = String(t || "").replace(/\s+/g, " ").trim();
    x = x.replace(/^(?:MBCT|IBFT|MBVCB\.\S+|FT\d{6,}\S*|\d{6,})\s+/i, "");
    for(let i = 0; i < 3; i++) x = x.replace(/[\s\-.,;]+(?:\S*\/\S*|(?=\S*\d)(?=\S*[A-Za-z])[A-Za-z0-9]{6,}|\d{6,})\s*$/, "").trim();
    return x.replace(/^[\s\-:;]+|[\s\-:;]+$/g, "");
  }
  function fields(line){
    line = String(line || "");
    const sp = noteSpan(line), a = amountOf(line), den = party(line, "DEN|ĐẾN"), tu = party(line, "TU|TỪ");
    const nd = sp ? line.slice(sp[0], sp[1]) : "";
    return { line, span:sp, nd, ndClean:cleanNote(nd), den, tu, denName:partyName(den), tuName:partyName(tu),
      tk:account(line), amt:a.amt, sign:a.sign,
      v:{ ND:noAcc(nd), DEN:noAcc(den), TU:noAcc(tu), TK:noAcc(account(line)), DONG:noAcc(line) } };
  }

  /* ---------- đọc từ khoá ---------- */
  const FIELD = { ND:"ND", NOIDUNG:"ND", DEN:"DEN", NHAN:"DEN", TU:"TU", GUI:"TU", TK:"TK", DONG:"DONG", TIEN:"TIEN", SOTIEN:"TIEN" };
  const FIELD_VI = { ND:"nội dung", DEN:"người nhận", TU:"người gửi", TK:"tài khoản của bạn", DONG:"cả dòng thông báo" };
  function money(s){
    s = noAcc(s).replace(/\s/g, "");
    const m = s.match(/^(\d+(?:[.,]\d+)?)(k|nghin|ngan|tr|trieu|m|cu|d|vnd)?$/);
    if(!m) return NaN;
    let n = m[2] === undefined || /^(d|vnd)$/.test(m[2]) ? Number(m[1].replace(/[.,]/g, "")) : Number(m[1].replace(",", "."));
    if(/^(k|nghin|ngan)$/.test(m[2])) n *= 1000;
    if(/^(tr|trieu|m|cu)$/.test(m[2])) n *= 1e6;
    return Math.round(n);
  }
  function fmt(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ"; }
  function parseMoney(s){
    s = String(s).trim();
    if(s === "+" || s === "-") return { sign:s };
    let m = s.match(/^(<=|>=|<|>|=)?\s*(.+?)$/), op = m[1] || "=", rest = m[2];
    const rg = !m[1] && rest.match(/^(.+?)\s*(?:-|–|den|đến)\s*(.+)$/i);
    if(rg){ const a = money(rg[1]), b = money(rg[2]); if(isFinite(a) && isFinite(b)) return { lo:Math.min(a, b), hi:Math.max(a, b) }; }
    const v = money(rest); if(!isFinite(v)) return null;
    return { op, v };
  }
  function moneyOk(c, f){
    if(c.sign) return f.sign === c.sign;
    const a = f.amt; if(!a) return false;
    if(c.lo != null) return a >= c.lo && a <= c.hi;
    return c.op === "<" ? a < c.v : c.op === "<=" ? a <= c.v : c.op === ">" ? a > c.v : c.op === ">=" ? a >= c.v : a === c.v;
  }
  function moneyVi(c){
    if(c.sign) return c.sign === "+" ? "là tiền vào" : "là tiền ra";
    if(c.lo != null) return "số tiền từ " + fmt(c.lo) + " đến " + fmt(c.hi);
    return "số tiền " + ({ "<":"dưới ", "<=":"không quá ", ">":"trên ", ">=":"từ ", "=":"đúng " })[c.op] + fmt(c.v);
  }
  /* một từ: ^ đầu, $ cuối, "…" nguyên từ, * đoạn bất kỳ */
  function term(raw){
    let s = String(raw).trim(), start = false, end = false, whole = false;
    if(s[0] === "^"){ start = true; s = s.slice(1).trim(); }
    if(s.length > 1 && s[s.length - 1] === "$"){ end = true; s = s.slice(0, -1).trim(); }
    const q = s.match(/^["“”'](.*)["“”']$/); if(q){ whole = true; s = q[1].trim(); }
    const t = noAcc(s); if(!t) return null;
    const wild = t.indexOf("*") >= 0, lit = t.replace(/\*/g, "").replace(/\s+/g, " ").trim();
    if(!lit) return null;
    if(!wild && lit.length <= 3) whole = true;
    let body = t.split("*").map(x => esc(x.trim()).replace(/ /g, "\\s+")).join(".*?");
    const lb = /^[a-z0-9]/.test(t) ? "(?:^|[^a-z0-9])" : "", rb = /[a-z0-9]$/.test(t) ? "(?![a-z0-9])" : "";
    let re = (start ? "^" + "\\s*" : whole ? lb : "") + body + (end ? "\\s*$" : (whole || start) ? rb : "");
    if(end && whole && !start) re = lb + body + "\\s*$";
    return { raw:String(raw).trim(), text:lit, start, end, whole, wild, re:new RegExp(re) };
  }
  function termVi(t){
    let s = "“" + t.text + "”";
    if(t.wild) s += " (dấu * là đoạn bất kỳ)";
    const p = [];
    if(t.start) p.push("bắt đầu bằng"); if(t.end) p.push("kết thúc bằng");
    if(!p.length) p.push(t.whole ? "có nguyên từ" : "chứa");
    return p.join(" và ") + " " + s;
  }
  /* parse("DEN:nguyen van a & TIEN:<100k & -hoan") */
  const cache = new Map();
  function parse(k){
    k = String(k == null ? "" : k).trim();
    if(cache.has(k)) return cache.get(k);
    const out = { k, conds:[], errors:[], score:0 };
    if(!k) out.errors.push("Chưa có từ khoá.");
    k.split(/\s*&\s*/).forEach(part => {
      if(!part) return;
      let neg = false;
      if(/^[-!]\s*\S/.test(part) && !/^-\s*\d/.test(part)){ neg = true; part = part.replace(/^[-!]\s*/, ""); }
      let field = "ND";
      const m = part.match(/^([A-Za-zĐđÊêƯư ]{2,8})\s*:\s*(.*)$/);
      if(m){
        const f = FIELD[noAcc(m[1]).replace(/\s/g, "").toUpperCase()];
        if(f){ field = f; part = m[2]; } else if(/^[A-Za-z]{2,7}$/.test(m[1].trim())) out.errors.push("“" + m[1].trim() + ":” không phải trường nào. Dùng DEN:, TU:, TK:, DONG:, TIEN: (hoặc bỏ để xét nội dung).");
      }
      if(field === "TIEN"){
        const c = parseMoney(part);
        if(!c){ out.errors.push("Không đọc được số tiền “" + part + "”. Ví dụ: TIEN:50k, TIEN:<100k, TIEN:10k-50k, TIEN:+"); return; }
        out.conds.push({ field, neg, money:c }); out.score += 300; return;
      }
      const terms = part.split(/\s*,\s*/).map(term).filter(Boolean);
      if(!terms.length){ out.errors.push("Có một điều kiện trống (thừa dấu & hoặc dấu phẩy?)."); return; }
      out.conds.push({ field, neg, terms });
      out.score += (field === "ND" ? 0 : 1000) + (neg ? 20 : 100) + Math.min.apply(null, terms.map(t => t.text.length)) + (terms.some(t => t.start || t.end) ? 5 : 0);
    });
    if(!out.conds.some(c => !c.neg)) out.errors.push("Cần ít nhất một điều kiện không có dấu - (loại trừ).");
    out.ok = !out.errors.length;
    if(cache.size > 500) cache.clear();
    cache.set(k, out);
    return out;
  }
  function condOk(c, f){
    let hit;
    if(c.money) hit = moneyOk(c.money, f);
    else { const v = f.v[c.field] || ""; hit = !!v && c.terms.some(t => t.re.test(v)); }
    return c.neg ? !hit : hit;
  }
  function matches(p, f){ return p.ok && p.conds.every(c => condOk(c, f)); }

  function explain(k){
    const p = parse(k);
    if(!p.conds.length) return { ok:false, text:"", errors:p.errors };
    const parts = p.conds.map(c => {
      if(c.money) return (c.neg ? "không " : "") + moneyVi(c.money);
      const lst = c.terms.map(termVi);
      return FIELD_VI[c.field] + " " + (c.neg ? "KHÔNG " : "") + (lst.length > 1 ? lst.slice(0, -1).join(", ") + " hoặc " + lst[lst.length - 1] : lst[0]);
    });
    return { ok:p.ok, text:"Khớp khi " + parts.join(", và ") + ".", errors:p.errors };
  }

  /* ---------- áp dụng ---------- */
  function sorted(rules){
    return (rules || []).filter(r => r && !r.off && String(r.k || "").trim() && (String(r.r || "").trim() || r.tag))
      .map((r, i) => ({ r, i, p:parse(r.k) })).filter(x => x.p.ok)
      .sort((a, b) => b.p.score - a.p.score || a.i - b.i);
  }
  function fill(tpl, f){
    return String(tpl).replace(/\{\s*(DEN|TU|ND|TIEN)\s*\}/gi, (_, n) => {
      n = n.toUpperCase();
      return n === "DEN" ? f.denName : n === "TU" ? f.tuName : n === "ND" ? f.ndClean : f.amt ? fmt(f.amt) : "";
    }).replace(/\|/g, "/").replace(/\s+/g, " ").trim();
  }
  /* trả { line: dòng đã làm gọn, rule, note, tag } — rule null nếu không quy tắc nào khớp */
  function apply(line, rules, pre){
    line = String(line || "");
    const list = pre || sorted(rules), f = fields(line);
    for(const x of list){
      if(!matches(x.p, f)) continue;
      const rep = fill(x.r.r || "", f);
      if(!rep || !f.span) return { line, rule:x.r, note:f.nd, tag:x.r.tag || "" };
      const out = line.slice(0, f.span[0]) + rep + (f.span[2] ? ";" : "") + line.slice(f.span[1]);
      return { line:out, rule:x.r, note:rep, tag:x.r.tag || "" };
    }
    return { line, rule:null, note:f.nd, tag:"" };
  }
  function applyText(text, rules){
    const pre = sorted(rules), hits = [];
    const lines = String(text || "").split(/\r?\n/).map(l => { const a = apply(l, null, pre); if(a.rule) hits.push(a); return a.line; });
    return { text:lines.join("\n"), hits };
  }

  /* ---------- kiểm tra một quy tắc: lỗi, cảnh báo, thử trên các dòng mẫu ---------- */
  function lint(rule, rules, sample){
    const p = parse(rule.k), e = explain(rule.k), warn = [];
    const r = String(rule.r || "");
    (r.match(/\{[^}]*\}/g) || []).forEach(t => { if(!/^\{\s*(DEN|TU|ND|TIEN)\s*\}$/i.test(t)) warn.push(t + " không phải chỗ tự điền. Dùng {DEN}, {TU}, {ND} hoặc {TIEN}."); });
    if(/\|/.test(r)) warn.push("Dấu | sẽ được đổi thành / vì app dùng | để tách các phần của thông báo.");
    if(!r.trim() && !rule.tag) warn.push("Chưa có nội dung thay hoặc tag, quy tắc sẽ không làm gì.");
    p.conds.forEach(c => (c.terms || []).forEach(t => {
      if(t.text.length <= 1) warn.push("“" + t.text + "” quá ngắn, dễ khớp nhầm.");
      if(/\d{5,}/.test(t.text) && c.field === "ND") warn.push("“" + t.text + "” có dãy số dài, hay là mã giao dịch (mỗi lần một khác) nên có thể không bao giờ khớp lại.");
      if(/[a-z]\d[a-z0-9]{3,}\/\d+/.test(t.text)) warn.push("“" + t.text + "” trông như mã giao dịch, nên bỏ.");
    }));
    if(/\{DEN\}/i.test(r) && p.conds.some(c => c.money && c.money.sign === "+")) warn.push("{DEN} là người nhận, nhưng quy tắc chỉ khớp tiền vào. Có lẽ cần {TU}.");
    if(/\{TU\}/i.test(r) && p.conds.some(c => c.money && c.money.sign === "-")) warn.push("{TU} là người gửi, nhưng quy tắc chỉ khớp tiền ra. Có lẽ cần {DEN}.");
    const same = (rules || []).filter(x => x !== rule && x.id !== rule.id && noAcc(x.k) === noAcc(rule.k));
    if(same.length) warn.push("Đã có quy tắc cùng từ khoá → “" + same[0].r + "”.");
    /* thử trên các dòng mẫu: khớp bao nhiêu, bị quy tắc khác xét trước bao nhiêu */
    const hits = [], shadow = [];
    if(p.ok && sample && sample.length){
      const others = sorted((rules || []).filter(x => x !== rule && x.id !== rule.id));
      const me = { r:rule, i:-1, p };
      sample.forEach(line => {
        const f = fields(line);
        if(!matches(p, f)) return;
        const before = others.find(x => x.p.score > p.score && matches(x.p, f));
        const after = apply(line, null, [me]);
        (before ? shadow : hits).push({ line, before:f.nd, after:after.note, by:before ? before.r : null });
      });
    }
    return { ok:p.ok, explain:e.text, errors:p.errors, warn, hits, shadow };
  }

  /* ---------- gợi ý quy tắc cho một dòng thông báo ---------- */
  const FILLER = /^(mbct|ibft|ft\d*|ck|chuyen|tien|khoan|chuyen khoan|thanh toan|tt|gd|giao dich|qr|vietqr|napas|tu|den|cho|tai|cua|va|the|so|pos|ecom)$/;
  function title(s){ return String(s).toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()); }
  function suggest(line){
    const f = fields(line), out = [], seen = new Set();
    const add = (k, r, why) => { const key = noAcc(k); if(!k || seen.has(key)) return; seen.add(key); out.push({ k, r, why }); };
    const out1 = f.sign === "-", in1 = f.sign === "+", nn0 = noAcc(f.nd);
    /* nội dung kiểu "TEN NGUOI chuyen tien" (câu mặc định của ngân hàng) → lấy luôn tên người làm nội dung */
    if(f.denName && f.den && nn0.indexOf(noAcc(f.denName)) >= 0 && /chuyen tien/.test(nn0)) add("DEN:" + f.denName, "{DEN}", "Nội dung chỉ là câu mặc định của ngân hàng, thay bằng tên người nhận");
    if(f.tuName && f.tu && nn0.indexOf(noAcc(f.tuName)) >= 0 && /chuyen tien/.test(nn0)) add("TU:" + f.tuName, "{TU}", "Nội dung chỉ là câu mặc định của ngân hàng, thay bằng tên người gửi");
    /* trả cửa hàng mà nội dung là câu mặc định "<TÊN BẠN> chuyen tien" → khớp câu đó, thay bằng tên nơi nhận */
    const dm = noAcc(cleanNote(f.nd)).match(/^(.{4,40}?) chuyen tien$/);
    if(dm && f.denName && noAcc(f.denName).indexOf(dm[1]) < 0) add(dm[1].toUpperCase() + " CHUYEN TIEN", "{DEN}", "Nội dung là câu mặc định của ngân hàng, thay bằng tên nơi nhận");
    if(out1 && f.denName && f.den) add("DEN:" + f.denName, "Chuyển cho " + title(f.denName), "Mọi lần chuyển tiền tới người này");
    if(in1 && f.tuName && f.tu) add("TU:" + f.tuName, "Nhận từ " + title(f.tuName), "Mọi lần người này chuyển tới");
    if(f.nd){
      const isTap = f.span && f.span[2];
      let words = cleanNote(f.nd).split(/\s+/).filter(Boolean);
      if(isTap){                                                        /* chạm thẻ: lấy tên nơi mua, bỏ mã cửa hàng */
        const w = words.filter(x => !/\d{3,}/.test(x) || /^[A-Za-z]+\d{1,3}$/.test(x));
        const name = (w[0] && w[0].length >= 3 ? w[0] : w.slice(0, 2).join(" ")) || words[0];
        if(name) add(name, title(name), "Mọi lần chạm thẻ ở " + name);
      } else {
        const key = words.filter(x => !FILLER.test(noAcc(x)) && !/\d{4,}/.test(x) && !/[\/]/.test(x)).slice(0, 3).join(" ");
        if(key && key.length >= 3){
          const startHere = noAcc(cleanNote(f.nd)).indexOf(noAcc(key)) === 0;
          add(key.length <= 3 && startHere ? "^" + key : key, title(key), "Nội dung có “" + key + "”");
        }
      }
    }
    if(f.amt && out1 && !out.length) add("TIEN:" + f.amt / 1000 + "k & TIEN:-", "", "Theo số tiền (ít dùng)");
    return out.slice(0, 4);
  }

  /* đọc bảng dán từ Google Sheet / Excel: mỗi dòng "từ khoá<TAB>nội dung" (bỏ dòng tiêu đề) */
  function parseTable(text){
    const rows = [];
    String(text || "").split(/\r?\n/).forEach((l, i) => {
      if(!l.trim()) return;
      let a = l.split("\t");
      if(a.length < 2) a = l.split(/\s{2,}|;|\s+→\s+|\s*=>\s*/);
      if(a.length < 2) return;
      const k = a[0].trim().replace(/^"|"$/g, ""), r = a.slice(1).join(" ").trim().replace(/^"|"$/g, "");
      if(!k) return;
      if(i === 0 && /t[uừ]\s*kh[oó]a|keyword|n[ộo]i dung chu[ẩa]n/i.test(k + " " + r)) return;
      rows.push({ k, r });
    });
    return rows;
  }

  const api = { parse, explain, apply, applyText, lint, suggest, fields, parseTable, noAcc, sorted, fmt };
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  else root.N50KRule = api;
})(typeof window !== "undefined" ? window : this);
