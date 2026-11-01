/* Tiêu Gọn – hiểu câu Chat về TIẾT KIỆM & ĐẦU TƯ (v211). Chạy trên máy, không gửi đi đâu.
   N50KTichLuy.parse(text, ctx) → null (không phải câu tích luỹ) hoặc { items:[…] } / { query:{ q:"assets" } }

   ctx = { assets:[{ id, kind, name, qty, unit, closed }], wallets:[{ id, name }], now:Date }
   Khoản trả về (app hiện thẻ xác nhận, bấm Ghi mới ghi):
     { kind:"asin",  amt, asset|null, ak, name, rate?, term?, qty?, unit?, w, date }   bỏ tiền vào (gửi tiết kiệm, mua vàng / quỹ / cổ phiếu…)
     { kind:"asout", amt (0 = chưa biết, app điền), all, asset|null, ak, qty?, unit?, w, date }  rút / tất toán / bán
     { kind:"asval", amt, per:true|false|null, asset|null, ak, date }                   cập nhật giá ("vàng giờ 8tr5")
   w: "main" = ví mặc định, mã ví, hoặc "" = không qua ví (tiền có từ trước, lãi nhập gốc).
   Tiền vào khoản tích luỹ là chuyển tiền, KHÔNG phải khoản chi (không trừ hạn mức ngày). */
(function(root){
  "use strict";
  const MAIN = "main";
  function norm(s){
    return " " + String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d")
      .replace(/[^a-z0-9,.%/ ]+/g, " ").replace(/([a-z])[.,](\s|$)/g, "$1$2").replace(/\s+/g, " ").trim() + " ";
  }
  const has = (n, re) => re.test(n);

  /* ---------- ngân hàng ---------- */
  const BANKS = [
    ["Vietcombank", "vcb|vietcombank|ngoai thuong"], ["BIDV", "bidv"], ["VietinBank", "vtb|vietinbank|viettinbank|ctg"],
    ["Agribank", "agri|agribank|agr"], ["Techcombank", "tcb|techcombank|techcom"], ["MB", "mb|mbbank|mb bank|quan doi"],
    ["ACB", "acb"], ["VPBank", "vpb|vpbank|vp bank"], ["TPBank", "tpb|tpbank|tp bank"], ["VIB", "vib"], ["SHB", "shb"],
    ["HDBank", "hdb|hdbank|hd bank"], ["OCB", "ocb"], ["MSB", "msb|maritime"], ["Sacombank", "stb|sacom|sacombank"],
    ["SeABank", "seab|seabank"], ["LPBank", "lpb|lpbank|lienviet"], ["Eximbank", "eib|exim|eximbank"], ["Nam A Bank", "nab|nam a"],
    ["Bac A Bank", "bab|bac a"], ["SCB", "scb"], ["PVcomBank", "pvcb|pvcombank"], ["Cake", "cake"], ["Timo", "timo"], ["KienlongBank", "klb|kienlong"],
    ["ABBank", "abb|abbank"], ["VietABank", "vab|vietabank"], ["BaoViet Bank", "bvb|baoviet"], ["Shinhan", "shinhan"], ["Woori", "woori"]
  ];
  function bankIn(n){
    for(const [name, ks] of BANKS) if(new RegExp(" (" + ks + ") ").test(n)) return name;
    return "";
  }

  /* ---------- số tiền ---------- */
  const UNIT = { ty:1e9, ti:1e9, trieu:1e6, tr:1e6, cu:1e6, m:1e6, k:1e3, nghin:1e3, ngan:1e3, ng:1e3, d:1, dong:1, vnd:1 };
  const NUMW = { mot:1, hai:2, ba:3, bon:4, nam:5, sau:6, bay:7, tam:8, chin:9, muoi:10, nua:0.5, ruoi:0.5 };
  const toNum = s => Number(String(s).replace(",", "."));
  /* tìm số tiền: "8tr2", "50tr", "8,5 trieu", "500k", "1.200.000", "1 ty 2" */
  function moneyAll(n){
    const out = [];
    const re = / (\d+(?:[.,]\d+)*) ?(ty|ti|trieu|tr|cu|k|nghin|ngan|ng|d|dong|vnd|m)(?: ?(\d{1,3}))?(?= |\/)/g;
    let m;
    while((m = re.exec(n))){
      let base = m[1];
      if(/^\d{1,3}(\.\d{3})+$/.test(base)) base = base.replace(/\./g, "");
      let v = toNum(base) * UNIT[m[2]];
      if(m[3] && UNIT[m[2]] >= 1e3) v += Number(m[3]) / Math.pow(10, m[3].length) * UNIT[m[2]];
      if(v > 0) out.push({ v:Math.round(v), at:m.index, len:m[0].length });
      re.lastIndex = m.index + m[0].length - 1;
    }
    const re2 = / (\d{1,3}(?:\.\d{3})+|\d{4,})(?= )/g;
    while((m = re2.exec(n))){
      if(out.some(o => m.index >= o.at && m.index < o.at + o.len)) continue;
      out.push({ v:Number(m[1].replace(/\./g, "")), at:m.index, len:m[0].length });
      re2.lastIndex = m.index + m[0].length - 1;
    }
    return out.sort((a, b) => a.at - b.at);
  }
  /* số trơn nhỏ ("mua vàng 82" = 82 nghìn? không: chỉ dùng khi không còn số nào khác, nhân nghìn như bộ hiểu câu chính) */
  function plainSmall(n){ const m = / (\d+(?:[.,]\d+)?)(?= )/.exec(n); return m ? Math.round(toNum(m[1]) * 1000) : 0; }

  /* ---------- số lượng, kỳ hạn, lãi suất ---------- */
  const QTY_U = { chi:"chỉ", luong:"lượng", cay:"cây", gram:"gram", gr:"gram", g:"gram", cp:"cp", "co phieu":"cp", ccq:"CCQ", "chung chi":"CCQ", btc:"BTC", eth:"ETH", usdt:"USDT", coin:"coin" };
  function qtyIn(n){
    const re = / (\d+(?:[.,]\d+)?|mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi|nua) (chi|luong|cay|gram|gr|g|cp|co phieu|ccq|chung chi|btc|eth|usdt|coin)(?= )/;
    const m = re.exec(n);
    if(!m) return null;
    let q = m[1] in NUMW ? NUMW[m[1]] : toNum(m[1]);
    if(/ ruoi /.test(n.slice(m.index + m[0].length, m.index + m[0].length + 7))) q += 0.5;
    return { q, unit:QTY_U[m[2]], at:m.index, len:m[0].length };
  }
  function termIn(n){
    if(/ (khong ky han|khong thoi han|kkh) /.test(n)) return { m:0, at:-1, len:0 };
    let m = / (\d+) ?(thang|th|t)(?= )/.exec(n);
    if(m) return { m:Number(m[1]), at:m.index, len:m[0].length };
    m = / (\d+) ?(nam)(?= )/.exec(n);
    if(m) return { m:Number(m[1]) * 12, at:m.index, len:m[0].length };
    return null;
  }
  function rateIn(n){ const m = / (?:lai |ls )?(\d+(?:[.,]\d+)?) ?%/.exec(n); return m ? { r:toNum(m[1]), at:m.index, len:m[0].length } : null; }
  function dateIn(n, now){
    const d = new Date(now || Date.now());
    if(/ hom kia /.test(n)) d.setDate(d.getDate() - 2);
    else if(/ hom qua /.test(n)) d.setDate(d.getDate() - 1);
    const p = x => String(x).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function blank(n, spans){
    let s = n;
    spans.filter(Boolean).forEach(sp => { if(sp.at >= 0) s = s.slice(0, sp.at) + " " + "_".repeat(Math.max(0, sp.len - 1)) + s.slice(sp.at + sp.len); });
    return s;
  }

  /* ---------- loại tài sản ---------- */
  const GOLD = / (vang|sjc|pnj|doji|nhan tron|vang nhan|vang mieng) /;
  const FUND = / (ccq|chung chi quy|quy mo|quy dau tu) /;
  const STOCK = / (co phieu|cp|chung khoan) /;
  const CRYPTO = / (btc|eth|usdt|bitcoin|ethereum|crypto|tien so|tien ao|coin) /;
  const SAVEW = / (tiet kiem|tk|so tiet kiem|so tk|so|tien gui|gui gop|tich luy) /;
  const CDW = / (cd|cds|chung chi tien gui) /;
  function invKind(n, orig){
    /* "vâng" (dạ vâng) bỏ dấu cũng thành "vang": chỉ tính là vàng khi câu gốc viết "vàng" hoặc có mua / bán / giá / số chỉ */
    if(has(n, GOLD) && (/vàng|sjc|pnj|doji/i.test(orig) || / (mua|ban|gia|chi|luong|cay) /.test(n))) return "gold";
    if(has(n, CRYPTO)) return "crypto";
    if(has(n, FUND) || /quỹ/i.test(orig)) return "fund";
    if(has(n, STOCK) || /\bmã\s+[A-Z]{3}\b/.test(orig)) return "stock";
    return "";
  }
  /* mã: cổ phiếu (3 chữ in hoa trong câu gốc), quỹ (chữ sau "quỹ" / "ccq"), tiền số */
  function codeIn(orig, n, ak){
    const up = String(orig || "").match(/\b[A-Z][A-Z0-9]{2,6}\b/g) || [];
    const skip = new Set(["CCQ", "SJC", "PNJ", "DOJI", "VND", "USD", "CD", "CDS", "VCB", "BIDV", "TCB", "ACB", "MB", "VIB", "TPB", "VPB", "SHB", "OCB", "MSB", "STB", "HDB", "LPB", "EIB", "SCB"]);
    const pick = up.find(x => !skip.has(x));
    if(ak === "crypto"){ const m = / (btc|eth|usdt|bnb|sol|xrp|ada|doge) /.exec(n); if(m) return m[1].toUpperCase(); }
    if(pick) return pick;
    if(ak === "fund"){ const m = / (?:quy|ccq|chung chi quy) ([a-z]{3,6}) /.exec(n); if(m && !/^(dau|tien|mo|cua|cho|nay|kia|toi|minh|them|gio|gia|nam|thang|con|duoc)$/.test(m[1])) return m[1].toUpperCase(); }
    if(ak === "stock"){ const m = / (?:co phieu|cp|ma) ([a-z]{3}) /.exec(n); if(m && !/^(cua|nay|kia|cho|them|gio|gia|con)$/.test(m[1])) return m[1].toUpperCase(); }
    if(ak === "gold"){ const m = / (sjc|pnj|doji|nhan tron) /.exec(n); if(m) return m[1] === "nhan tron" ? "nhẫn tròn" : m[1].toUpperCase(); }
    return "";
  }
  const LABEL = { save:"Sổ tiết kiệm", cd:"Chứng chỉ tiền gửi", gold:"Vàng", fund:"Quỹ", stock:"Cổ phiếu", crypto:"Tiền số", other:"Khoản đầu tư" };
  const DEF_UNIT = { gold:"chỉ", fund:"CCQ", stock:"cp" };

  /* ---------- tìm khoản đã có ---------- */
  function findAsset(ctx, ak, keys){
    const isDep = k => k === "save" || k === "cd";
    const list = (ctx.assets || []).filter(a => a && !a.closed && (isDep(ak) ? isDep(a.kind) : a.kind === ak));
    const words = keys.filter(Boolean).map(k => norm(k).trim()).filter(Boolean);
    if(words.length){
      const hit = list.filter(a => { const nm = norm(a.name + " " + (a.code || "")); return words.some(w => nm.includes(" " + w + " ") || nm.includes(w)); });
      if(hit.length === 1) return { a:hit[0], sure:true };
      if(hit.length > 1) return { a:null, many:true };
      return { a:null, none:true, named:true };
    }
    if(list.length === 1) return { a:list[0], sure:false };
    return { a:null, many:list.length > 1 };
  }
  function walletIn(n, ctx){
    for(const w of (ctx.wallets || [])){ const k = norm(w.name).trim(); if(k && k.length >= 3 && n.includes(" " + k + " ")) return w.id; }
    if(/ (momo|zalopay|zalo pay|shopeepay|vnpay) /.test(n)){ const w = (ctx.wallets || []).find(x => /momo|zalo|shopee|vnpay/.test(norm(x.name))); if(w) return w.id; }
    return null;
  }
  const NO_WALLET = / (co san|co tu truoc|tu truoc|da co|von co|lai nhap goc|nhap goc|khong tru vi|khong qua vi) /;

  /* ---------- câu hỏi ---------- */
  const ASK = / (bao nhieu|the nao|ra sao|lai lo|loi lo|loi bao nhieu|lo bao nhieu|\?) /;

  function parse(text, ctx){
    ctx = ctx || {};
    const orig = String(text || "");
    if(orig.length > 200 || /\n/.test(orig)) return null;
    const n = norm(orig);
    if(n.trim().length < 3) return null;
    const date = dateIn(n, ctx.now);

    /* câu hỏi tài sản */
    if(has(n, / (tai san|tong tai san|tai san rong|tich luy|dang tiet kiem|tiet kiem duoc|so tiet kiem|vang|dau tu) /) && has(n, ASK) && !moneyAll(n).length)
      return { query:{ q:"assets", text:orig } };

    const rate = rateIn(n), term = termIn(n), qty = qtyIn(n);
    const rest = blank(n, [rate, term, qty]);
    const money = moneyAll(rest);
    const amt = money.length ? money[0].v : 0;

    /* ===== tiết kiệm / tiền gửi ===== */
    /* "so" sau khi bỏ dấu có thể là "số" (số tài khoản, số tiền, vé số): loại các cụm đó */
    const SO = "so(?! (tai khoan|tk|tien|du|dt|dien thoai|the|lan|luong|nha|phong|xe))";
    const depIn = new RegExp(" gui (them )?(tien )?(vao )?(" + SO + " )?(tiet kiem|tk|tien gui|cd|cds|chung chi tien gui|gop) ").test(n)
      || new RegExp(" (gui|nap|bo|chuyen|dong) (them )?(tien )?(\\S+ )?vao (" + SO + "|tiet kiem|cd|cds) ").test(n)
      || new RegExp(" (mo|lam) (them )?(1 |mot )?(" + SO + "|cd|cds) ").test(n);
    const depOut = !/ ve so /.test(n) && new RegExp(" (rut|tat toan|lay) (het |tien |them |\\S+ )?(tien )?(tu |o )?(" + SO + "|tiet kiem|tien gui|cd|cds|chung chi tien gui) ").test(n);
    if((depIn || depOut) && !/ (mua|ban) /.test(n)){
      const ak = has(n, CDW) ? "cd" : "save", bank = bankIn(n);
      const f = findAsset(ctx, ak, [bank]);
      if(depOut){
        const all = / (tat toan|het|dao han|toan bo) /.test(n) || !amt;
        let w = walletIn(n, ctx) || MAIN; if(has(n, / (khong ve vi|giu lai|de lai) /)) w = "";
        return { items:[{ kind:"asout", amt: all ? 0 : amt, all, asset: f.a ? f.a.id : null, ak, bank, w, date, note:orig }] };
      }
      if(!amt) return null;
      const topUp = / (them|nap them|gui them|bo them) /.test(n) && f.a;
      const it = { kind:"asin", amt, asset: topUp ? f.a.id : null, ak, w: has(n, NO_WALLET) ? "" : (walletIn(n, ctx) || MAIN), date, note:orig };
      if(!topUp){
        const tm = term ? term.m : null;
        it.name = (ak === "cd" ? "CD " : "Sổ ") + (bank || "tiết kiệm") + (tm ? " " + (tm % 12 === 0 && tm >= 12 ? tm / 12 + " năm" : tm + " tháng") : "");
        if(rate) it.rate = rate.r;
        if(term) it.term = term.m;
        if(bank) it.bank = bank;
      }
      return { items:[it] };
    }

    /* ===== đầu tư: vàng, quỹ, cổ phiếu, tiền số ===== */
    const ak = invKind(n, orig);
    if(!ak) return null;
    const code = codeIn(orig, n, ak);
    const buy = / (mua|gom|tich them|dau tu|nap|xuong tien) /.test(n) && !/ (ban|rut) /.test(n);
    const sell = / (ban|chot loi|cat lo|rut|thanh ly|ban het) /.test(n);
    const valW = / (gia|gio|hom nay|bay gio|hien tai|hien|dang|len|xuong|con|duoc|tang|giam|tri gia|gia tri) /.test(n);
    const f = findAsset(ctx, ak, [code]);
    const unit = qty ? qty.unit : DEF_UNIT[ak] || "";
    if(buy){
      const v = amt || (qty ? 0 : plainSmall(rest));
      if(!v) return null;
      const it = { kind:"asin", amt:v, asset: f.a && (f.sure || !code) ? f.a.id : null, ak, w: has(n, NO_WALLET) ? "" : (walletIn(n, ctx) || MAIN), date, note:orig };
      if(qty){ it.qty = qty.q; it.unit = qty.unit; }
      if(!it.asset) it.name = ak === "gold" ? "Vàng" + (code ? " " + code : "") : ak === "fund" ? (code ? "Quỹ " + code : "Chứng chỉ quỹ") : ak === "stock" ? (code || "Cổ phiếu") : (code || "Tiền số");
      if(!it.asset && !qty && DEF_UNIT[ak]) it.unit = DEF_UNIT[ak];
      return { items:[it] };
    }
    if(sell){
      const all = / (het|toan bo|tat ca|sach) /.test(n) || (!amt && !qty);
      const it = { kind:"asout", amt:amt, all, asset: f.a ? f.a.id : null, ak, code, w: has(n, / (khong ve vi|giu lai) /) ? "" : (walletIn(n, ctx) || MAIN), date, note:orig };
      if(qty){ it.qty = qty.q; it.unit = qty.unit; }
      return { items:[it] };
    }
    if(valW && amt){
      /* "vàng giờ 8tr5": giá 1 đơn vị hay tổng? per = true (nói rõ giá / 1 chỉ), false (nói rõ tổng), null (app tự đoán theo giá trị cũ) */
      let per = null;
      if(/ (gia|moi|1 chi|mot chi|1 luong|mot luong|\/ ?(chi|luong|cp|ccq)|1 cp|1 ccq) /.test(n)) per = true;
      if(/ (tong|ca|tat ca|toan bo|tri gia|gia tri) /.test(n)) per = false;
      return { items:[{ kind:"asval", amt, per, asset: f.a ? f.a.id : null, ak, code, date, note:orig }] };
    }
    return null;
  }

  const api = { parse, norm, moneyAll, bankIn, BANKS };
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  else root.N50KTichLuy = api;
})(typeof window !== "undefined" ? window : this);
