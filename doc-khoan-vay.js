/* Tiêu Gọn – hiểu thông tin khoản vay (v232). Chạy trên máy, không gửi dữ liệu đi.
   1) textInfo(text, today) — lấy thêm thông tin từ câu chat về khoản vay:
        "vay 20 triệu lãi 5.7%/năm", "vay MB 50tr lãi 1%/tháng hạn 17/8/2027", "vay 30tr trong 12 tháng"
        → { rate, due, dueRaw, termM, bank }  (rate luôn tính theo %/năm; trường nào không có thì rỗng / 0)
   2) parse(ocrText) — đọc chữ (Tesseract trên máy) từ ảnh chụp màn hình khoản vay / thấu chi trong app ngân hàng.
        null nếu không giống màn khoản vay, ngược lại:
        { who, product, bank, amt, amtFrom:"used"|"limit"|"", limit, avail, rate, start, due, intEst, acct, note }
      Không dựa vào giao diện một ngân hàng cụ thể: tìm theo nhãn (dư nợ, hạn mức, ngày giải ngân, đáo hạn…) và kiểu số. */
(function(root){
  "use strict";
  const fold = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  const pad = n => String(n).padStart(2, "0");
  const r2 = x => Math.round(x * 100) / 100;

  function dateKey(d, m, y){
    d = +d; m = +m; y = +y; if(y < 100) y += 2000;
    if(!(d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2000 && y <= 2100)) return null;
    return y + "-" + pad(m) + "-" + pad(d);
  }
  function addMonths(k, n){
    const [y, m, d] = k.split("-").map(Number), t = new Date(y, m - 1 + n, 1);
    const dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    return t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(Math.min(d, dim));
  }
  const todayK = () => { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };

  /* tên ngân hàng / công ty tài chính hay gặp → tên gọn để ghi "Vay của ai" */
  const BANKS = [
    [/\bmb ?bank\b|\bmbbank\b|\bngan hang quan doi\b|\bmb\b/, "MB"],
    [/\bvietcombank\b|\bvcb\b/, "Vietcombank"], [/\btechcombank\b|\btcb\b/, "Techcombank"],
    [/\bbidv\b/, "BIDV"], [/\bvietinbank\b|\bctg\b/, "VietinBank"], [/\bagribank\b/, "Agribank"],
    [/\bacb\b/, "ACB"], [/\bvp ?bank\b/, "VPBank"], [/\btp ?bank\b/, "TPBank"], [/\bsacombank\b|\bstb\b/, "Sacombank"],
    [/\bvib\b/, "VIB"], [/\bshb\b/, "SHB"], [/\bhd ?bank\b/, "HDBank"], [/\bmsb\b|\bmaritime\b/, "MSB"], [/\bocb\b/, "OCB"],
    [/\bseabank\b/, "SeABank"], [/\bshinhan\b/, "Shinhan"], [/\beximbank\b/, "Eximbank"], [/\blpbank\b|\blienviet\b/, "LPBank"],
    [/\bnam a ?bank\b/, "Nam A Bank"], [/\bbac a ?bank\b/, "Bac A Bank"], [/\bpvcombank\b/, "PVcomBank"], [/\bcake\b/, "Cake"],
    [/\btimo\b/, "Timo"], [/\bhome ?credit\b/, "Home Credit"], [/\bfe ?credit\b/, "FE Credit"], [/\bmirae ?asset\b/, "Mirae Asset"],
    [/\bhd ?saison\b/, "HD Saison"], [/\bshinhan ?finance\b/, "Shinhan Finance"]
  ];
  function bankIn(f){ for(const [re, name] of BANKS) if(re.test(f)) return name; return ""; }

  /* lãi suất trong câu: "lãi 5.7%/năm", "lãi suất 5,7%", "lãi 1%/tháng", "0.8% một tháng" → %/năm */
  function rateIn(f){
    const unit = "(?:\\s*(?:\\/|mot|1|moi|\\/\\s*1)?\\s*(nam|thang|th|ngay)\\b)?";
    let m = f.match(new RegExp("lai(?:\\s*suat)?\\s*:?\\s*(\\d{1,3}(?:[.,]\\d{1,3})?)\\s*%" + unit));
    if(!m) m = f.match(/(\d{1,3}(?:[.,]\d{1,3})?)\s*%\s*(?:\/|mot|1|moi)?\s*(nam|thang|th|ngay)\b/);
    if(!m) return 0;
    let v = parseFloat(m[1].replace(",", ".")); if(!(v > 0)) return 0;
    const u = m[2] || "nam";
    if(u === "thang" || u === "th") v *= 12; else if(u === "ngay") v *= 365;
    v = r2(v);
    return v > 0 && v < 100 ? v : 0;
  }

  function textInfo(text, today){
    const f = " " + fold(text).replace(/\s+/g, " ") + " ", t0 = today || todayK();
    const out = { rate:rateIn(f), due:"", dueRaw:"", termM:0, bank:bankIn(f) };
    /* hạn trả: "hạn 17/8/2027", "đáo hạn 17/08", "trả trước 30/12/2026", "hạn trả ngày 5/1" */
    const dm = f.match(/(?:dao han|den han|het han|han tra|toi han|tra truoc|truoc ngay|\bhan)\s*(?:la|vao)?\s*(?:ngay)?\s*:?\s*(\d{1,2})\s*[\/\-.]\s*(\d{1,2})(?:\s*[\/\-.]\s*(\d{2,4}))?/);
    if(dm){
      let k = dm[3] ? dateKey(dm[1], dm[2], dm[3]) : dateKey(dm[1], dm[2], t0.slice(0, 4));
      if(k && !dm[3] && k < t0) k = dateKey(dm[1], dm[2], +t0.slice(0, 4) + 1);
      if(k){ out.due = k; out.dueRaw = dm[0].trim(); }
    }
    /* thời hạn: "trong 12 tháng", "kỳ hạn 6 tháng", "thời hạn 2 năm", "hạn 1 năm" */
    const tm = f.match(/(?:trong|ky han|thoi han|\bhan|tra gop|gop)\s*(?:vay)?\s*(\d{1,3})\s*(thang|nam)\b/);
    if(tm){ const n = +tm[1] * (tm[2] === "nam" ? 12 : 1); if(n > 0 && n <= 600) out.termM = n; }
    return out;
  }

  /* ---------- đọc ảnh ---------- */
  function money(tok){
    const t = String(tok).replace(/\s/g, "");
    if(/^\d{1,3}([.,]\d{3})+$/.test(t)) return parseInt(t.replace(/[.,]/g, ""), 10);
    if(/^\d+$/.test(t)) return parseInt(t, 10);
    return null;
  }
  /* số tiền đầu tiên trong đoạn: có dấu ngăn nghìn, hoặc có đơn vị VND / đ */
  function amountIn(s){
    const re = /(\d{1,3}(?:[.,]\d{3})+|\d{4,})(?!\s*[%\/]|[.,]?\d)\s*(vnd|vnđ|vn d|dong|đ|d\b)?/gi;
    let m;
    while((m = re.exec(s))){
      const sep = /[.,]/.test(m[1]);
      if(!m[2] && !sep) continue;                /* số trơn không đơn vị: số tài khoản, năm… */
      const v = money(m[1]); if(v != null && v > 0) return v;
    }
    return null;
  }
  function dateIn(s){
    const m = s.match(/(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{4}|\d{2})\b/);
    return m ? dateKey(m[1], m[2], m[3]) : null;
  }
  function rateFrom(s){
    const m = s.match(/(\d{1,2}(?:[.,]\d{1,3})?)\s*%\s*(?:\/\s*)?(nam|thang|ngay)?/);
    if(!m) return 0;
    let v = parseFloat(m[1].replace(",", ".")); if(m[2] === "thang") v *= 12; else if(m[2] === "ngay") v *= 365;
    v = r2(v); return v > 0 && v < 100 ? v : 0;
  }

  /* nhãn → trường. Thứ tự quan trọng: nhãn dài / cụ thể trước */
  const LABELS = [
    ["avail", /han muc (con lai|kha dung|con duoc)|so tien (kha dung|con duoc (vay|rut|dung))|con duoc vay/],
    ["disb",  /so tien (vay|da vay|giai ngan|da giai ngan|vay ban dau)|so tien goc vay|tong (so tien )?vay/],
    ["used",  /du no( goc)?( hien tai| con lai| thuc te)?|so tien (da su dung|da dung|da rut|dang vay|con no)|da su dung|goc con lai|tong (du )?no/],
    ["limit", /han muc( thau chi| tang them| duoc cap| vay| toi da| tin dung)?/],
    ["start", /ngay (dang ky|giai ngan|vay|mo|hieu luc|bat dau|ky( hop dong)?|cap)/],
    ["due",   /ngay (dao han|het han|den han|tat toan|ket thuc)|han (tra|thanh toan cuoi)|thoi han vay den/],
    ["rate",  /lai suat/],
    ["intEst",/(so tien )?lai (du kien|tam tinh|phai tra|den nay|cong don|da phat sinh)/],
    ["acctPay", /tai khoan (thu no|tra no|nhan( tien)?|lien ket|nguon|trich no)/],
    ["acct",  /tai khoan (thau chi|vay)|so (tai khoan|hop dong|khe uoc)( vay)?|ma (khoan vay|hop dong)|hop dong (vay|so)/],
    ["skip",  /thoi diem truy van|ngay truy van|cap nhat luc|thoi gian truy van/]
  ];
  function labelOf(fl){
    for(const [k, re] of LABELS){ const m = fl.match(re); if(m) return { k, end:m.index + m[0].length, at:m.index }; }
    return null;
  }

  /* sửa lỗi đọc chữ hay gặp trên chữ đã bỏ dấu: "thếu chỉ" → thau chi, "đóo hạn" → dao han */
  const fixOcr = f => f.replace(/\bth[a-z]u ch[a-z1]\b/g, "thau chi").replace(/\bd[a-z]o han\b/g, "dao han").replace(/\bgiai ng[a-z]n\b/g, "giai ngan").replace(/\bh[a-z]n m[a-z]c\b/g, "han muc").replace(/\bdu n[o0]\b/g, "du no");
  /* kiểu giá trị của một dòng đứng riêng (không có nhãn) */
  function valType(s){
    const fs = fold(s);
    if(/%/.test(fs) && rateFrom(fs)) return "rate";
    if(dateIn(fs)) return "date";
    if(amountIn(s)) return "amt";
    if(/^\D{0,3}\d[\d\s.\-]{5,24}$/.test(s.trim()) && s.replace(/\D/g, "").length >= 6) return "acct";
    return "";
  }
  const NEED = { disb:"amt", avail:"amt", used:"amt", limit:"amt", intEst:"amt", start:"date", due:"date", skip:"date", rate:"rate", acct:"acct", acctPay:"acct" };
  function valOf(k, s){
    const fs = fold(s);
    if(k === "start" || k === "due" || k === "skip") return dateIn(fs);
    if(k === "rate") return rateFrom(fs) || null;
    if(k === "acct" || k === "acctPay"){ const m = s.replace(/[\s.\-]/g, "").match(/\d{6,20}/); return m ? m[0] : null; }
    return amountIn(s);
  }

  function parse(text){
    const lines = String(text || "").split(/\r?\n/).map(s => s.replace(/\s+/g, " ").trim()).filter(Boolean);
    const F = lines.map(l => fixOcr(fold(l))), all = F.join("\n");
    const isLoan = /thau chi|khoan vay|du no|giai ngan|hop dong vay|tai khoan vay|vay (tieu dung|the chap|cam co|tin chap|online|nhanh|mua nha|mua xe|kinh doanh)|tra no|dong khoan vay/.test(all);
    if(!isLoan) return null;
    /* màn thẻ tín dụng / sổ tiết kiệm có chữ "dư nợ" / "tất toán" nhưng không phải khoản vay */
    if(/the tin dung|sao ke|thanh toan toi thieu/.test(all) && !/thau chi|khoan vay|hop dong vay/.test(all)) return null;
    if(/tien gui|tiet kiem/.test(all) && !/thau chi|khoan vay|du no|giai ngan|hop dong vay/.test(all)) return null;

    const res = { who:"", product:"", bank:bankIn(all), amt:0, amtFrom:"", paid:0, disb:0, limit:0, avail:0, used:0, rate:0, start:"", due:"", intEst:0, acct:"", note:"" };
    const lbs = F.map(labelOf), used = new Set(), open = [];
    const put = (k, v) => { if(v == null || k === "skip" || k === "acctPay") return; if(!res[k]) res[k] = v; };
    /* lượt 1: giá trị trên cùng dòng với nhãn; hoặc một giá trị đứng riêng ngay dòng dưới (không nằm trong một cột giá trị) */
    F.forEach((fl, i) => {
      const lb = lbs[i]; if(!lb) return;
      const v = valOf(lb.k, lines[i].slice(Math.min(lines[i].length, lb.end)));
      if(v != null){ put(lb.k, v); return; }
      const nx = lines[i + 1], nx2 = lines[i + 2];
      if(nx && !lbs[i + 1] && valType(nx) === NEED[lb.k] && !(nx2 && !lbs[i + 2] && valType(nx2))){ put(lb.k, valOf(lb.k, nx)); used.add(i + 1); return; }
      open.push(i);
    });
    /* lượt 2: màn hai cột bị đọc thành một cột nhãn rồi một cột giá trị → ghép theo thứ tự, đúng kiểu */
    if(open.length){
      const vals = [];
      lines.forEach((l, j) => { if(j > open[0] && !lbs[j] && !used.has(j)){ const t = valType(l); if(t) vals.push({ j, t }); } });
      let p = 0;
      open.forEach(i => {
        const k = lbs[i].k;
        for(let q = p; q < vals.length; q++){ if(vals[q].t === NEED[k]){ put(k, valOf(k, lines[vals[q].j])); p = q + 1; break; } }
      });
    }
    /* số tài khoản thấu chi / vay thường nằm ngay dưới tên sản phẩm */
    if(!res.acct){
      const i = F.findIndex(fl => /thau chi|khoan vay|tai khoan vay/.test(fl));
      for(let j = i; i >= 0 && j <= i + 1 && j < lines.length; j++){ const m = lines[j].replace(/[\s.\-]/g, "").match(/^\D{0,40}?(\d{8,20})$/); if(m){ res.acct = m[1]; break; } }
    }
    if(!res.rate){ const m = all.match(/(\d{1,2}[.,]\d{1,3}|\d{1,2})\s*%\s*\/?\s*nam/); if(m) res.rate = rateFrom(m[0]); }

    /* sản phẩm */
    if(/thau chi/.test(all)) res.product = "Thấu chi";
    else if(/vay the chap/.test(all)) res.product = "Vay thế chấp";
    else if(/vay cam co/.test(all)) res.product = "Vay cầm cố";
    else if(/vay tieu dung/.test(all)) res.product = "Vay tiêu dùng";
    else if(/vay tin chap/.test(all)) res.product = "Vay tín chấp";
    else if(/vay mua nha/.test(all)) res.product = "Vay mua nhà";
    else if(/vay mua xe/.test(all)) res.product = "Vay mua xe";
    else res.product = "Khoản vay";

    /* số tiền: ưu tiên dư nợ / số đã dùng; thấu chi chỉ có hạn mức + còn được dùng → lấy hiệu; cuối cùng lấy hạn mức */
    if(res.disb){ res.amt = res.disb; res.amtFrom = "used"; if(res.used && res.used < res.disb) res.paid = res.disb - res.used; }
    else if(res.used){ res.amt = res.used; res.amtFrom = "used"; }
    else if(res.limit && res.avail && res.avail <= res.limit){ res.amt = res.limit - res.avail; res.amtFrom = "used"; }
    else if(res.limit){ res.amt = res.limit; res.amtFrom = "limit"; }
    if(res.start && res.due && res.due <= res.start) res.due = "";
    if(!res.amt && !res.due && !res.rate) return null;   /* quá ít thông tin: không phải màn khoản vay */

    res.who = (res.bank ? res.bank + " · " : "") + res.product + (res.acct ? " ·" + res.acct.slice(-4) : "");
    const bits = [];
    bits.push(res.product + (res.acct ? " số " + res.acct : "") + (res.bank ? " (" + res.bank + ")" : ""));
    const vn = v => v.toLocaleString("vi-VN") + "đ";
    if(res.limit) bits.push("Hạn mức " + vn(res.limit));
    if(res.avail) bits.push("Còn được dùng " + vn(res.avail));
    if(res.disb && res.used) bits.push("Dư nợ lúc chụp " + vn(res.used));
    if(res.intEst) bits.push("Lãi dự kiến " + vn(res.intEst));
    res.note = bits.join(". ");
    return res;
  }

  const api = { parse, textInfo, _rateIn:t => rateIn(" " + fold(t) + " "), _addMonths:addMonths };
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  else root.N50KVay = api;
})(typeof window !== "undefined" ? window : this);
