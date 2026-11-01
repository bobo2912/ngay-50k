/* Tiêu Gọn – đọc ảnh chụp màn hình sổ tiết kiệm / tiền gửi / chứng chỉ tiền gửi (v208). Chạy trên máy.
   Đầu vào là chữ do bộ đọc chữ trên máy (Tesseract) lấy ra từ ảnh, nên có thể lẫn lỗi: thiếu dấu, dính chữ, "4.75%/nãm".
   Không dựa vào giao diện của một ngân hàng cụ thể: tìm theo từ khoá (kỳ hạn, lãi suất, đáo hạn, quay vòng…) và kiểu số.
   parse(text) → null nếu không giống màn sổ tiết kiệm, ngược lại:
     { kind:"save"|"cd", name, amt, rate, term, start, due, onDue:"renew"|"wallet"|"", acct, intEnd, intNow } */
(function(root){
  "use strict";
  const fold = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  const pad = n => String(n).padStart(2, "0");

  /* số tiền: "217,996" "217.996" "1.250.000" "50000000" → số nguyên; số có phần lẻ ("4.75") không phải tiền */
  function money(tok){
    const t = String(tok).replace(/\s/g, "");
    if(/^\d{1,3}([.,]\d{3})+$/.test(t)) return parseInt(t.replace(/[.,]/g, ""), 10);
    if(/^\d+$/.test(t)) return parseInt(t, 10);
    return null;
  }
  /* các số tiền trong một dòng (có đơn vị VND / đ đi kèm, hoặc có dấu ngăn nghìn) */
  function amountsIn(line){
    const out = [], re = /(\d{1,3}(?:[.,]\d{3})+|\d{3,})(?!\s*[%\/\d])\s*(vnd|vnđ|vn d|dong|đ|d\b)?/gi;
    let m;
    while((m = re.exec(line))){
      const v = money(m[1]);
      if(v == null) continue;
      const sep = /[.,]/.test(m[1]);
      if(!m[2] && !sep) continue;                 /* số trơn không đơn vị: có thể là số tài khoản, năm… */
      if(!sep && m[1].length > 12) continue;
      out.push(v);
    }
    return out;
  }
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
  function monthsBetween(a, b){
    const [y1, m1, d1] = a.split("-").map(Number), [y2, m2, d2] = b.split("-").map(Number);
    let n = (y2 - y1) * 12 + (m2 - m1); if(d2 < d1 - 3) n--;
    return n;
  }

  function parse(text){
    const raw = String(text || "");
    const lines = raw.split(/\r?\n/).map(s => s.replace(/\s+/g, " ").trim()).filter(Boolean);
    const F = lines.map(fold), all = F.join("\n");
    /* có giống màn sổ tiết kiệm không */
    const isDep = /tien gui|tiet kiem|chung chi tien gui|cctg|so tiet kiem/.test(all);
    const hasTerms = /ky han|lai suat|%\s*\/?\s*nam|dao han|den han|tat toan/.test(all);
    if(!isDep || !hasTerms) return null;
    const res = { kind:"save", name:"", amt:0, rate:0, term:0, start:"", due:"", onDue:"", acct:"", intEnd:0, intNow:0 };
    if(/chung chi tien gui|cctg|\bcds?\b/.test(all)) res.kind = "cd";

    /* lãi suất: "4.75%/năm", "lãi suất 6,2 %" */
    let m = all.match(/(\d{1,2}(?:[.,]\d{1,3})?)\s*%\s*\/?\s*(?:nam|năm|n[aă]m|\/?nam)/) || all.match(/lai suat[^\d\n]{0,20}(\d{1,2}(?:[.,]\d{1,3})?)\s*%/) || all.match(/(\d{1,2}[.,]\d{1,3})\s*%/);
    if(m){ const r = parseFloat(m[1].replace(",", ".")); if(r > 0 && r < 30) res.rate = r; }

    /* kỳ hạn: ưu tiên dòng có "kỳ hạn" */
    if(/khong ky han/.test(all)) res.term = 0;
    else {
      const tl = F.findIndex(l => /ky han/.test(l));
      const scope = tl >= 0 ? F.slice(tl, tl + 2).join(" ") : all;
      m = scope.match(/(\d{1,2})\s*(thang|th\b)/) || all.match(/(\d{1,2})\s*thang/);
      if(m){ const n = parseInt(m[1], 10); if(n > 0 && n <= 120) res.term = n; }
      else if((m = scope.match(/(\d{1,2})\s*(nam)\b/))){ const n = parseInt(m[1], 10); if(n > 0 && n <= 10) res.term = n * 12; }
      else if((m = scope.match(/(\d{1,3})\s*(tuan|ngay)\b/))){ /* kỳ hạn tính theo tuần / ngày: để trống, người dùng tự chọn */ }
    }

    /* ngày: dd/mm/yyyy; dòng có "gửi / mở / bắt đầu" là ngày gửi, "đáo hạn / đến hạn" là ngày đáo hạn */
    const dates = [];
    F.forEach((l, i) => {
      const re = /(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*[\/.-]\s*(\d{2,4})/g; let d;
      while((d = re.exec(l))){ const k = dateKey(d[1], d[2], d[3]); if(k) dates.push({ k, i, l }); }
    });
    const tagged = (re) => { const x = dates.find(d => re.test(d.l) || (d.i > 0 && re.test(F[d.i - 1]) && !/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(F[d.i - 1]))); return x ? x.k : ""; };
    res.start = tagged(/ngay (gui|mo|bat dau|hieu luc|phat hanh)|tu ngay/);
    res.due = tagged(/dao han|den han|ngay tat toan|den ngay/);
    const ks = [...new Set(dates.map(d => d.k))].sort();
    if(!res.start && ks.length) res.start = ks[0];
    if(!res.due && ks.length > 1 && ks[ks.length - 1] > res.start) res.due = ks[ks.length - 1];
    if(res.start && res.due && !res.term){ const n = monthsBetween(res.start, res.due); if(n > 0 && n <= 120) res.term = n; }
    if(res.start && res.term && !res.due) res.due = addMonths(res.start, res.term);

    /* khi đến hạn */
    const dueLine = F.find(l => /hinh thuc|khi den han|khi dao han|tai tuc|quay vong/.test(l)) || F.find(l => /den han|dao han/.test(l) && !/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(l)) || "";
    if(/quay vong|tai tuc|tu dong gia han|gia han|nhap goc/.test(dueLine) || /quay vong|tai tuc/.test(all)) res.onDue = "renew";
    else if(/tat toan|tra ve|chuyen ve|nhan goc/.test(dueLine)) res.onDue = "wallet";

    /* số tài khoản tiền gửi / số sổ: dãy 8–16 chữ số */
    const al = F.findIndex(l => /so tai khoan|so so|so tk|stk|so hop dong|ma so/.test(l));
    const acctIn = s => { const x = String(s || "").replace(/[ ]/g, "").match(/(?:^|\D)(\d{8,16})(?!\d)/); return x ? x[1] : ""; };
    if(al >= 0) res.acct = acctIn(lines[al]) || acctIn(lines[al + 1]);
    if(!res.acct){ for(const l of lines){ if(/[.,]\d{3}/.test(l)) continue; const a = acctIn(l); if(a && !/\/\d{4}/.test(l)){ res.acct = a; break; } } }

    /* số tiền: lãi và tiền phong toả là số phụ; số gốc / số dư là số lớn nhất còn lại */
    let main = 0, other = 0;
    F.forEach((l, i) => {
      const vs = amountsIn(lines[i]); if(!vs.length) return;
      const v = Math.max(...vs);
      if(/lai/.test(l) && /cuoi ky|dao han|den han|khi het han|cuoi han/.test(l)){ res.intEnd = v; return; }
      if(/lai/.test(l) && /hien tai|tam tinh|den nay|hom nay|da phat sinh/.test(l)){ res.intNow = v; return; }
      if(/lai|phong toa|han muc|toi thieu|phi\b/.test(l)) return;
      if(/so du|so tien gui|tien goc|so tien|\bgoc\b/.test(l)) main = Math.max(main, v); else other = Math.max(other, v);
    });
    res.amt = main || other;
    /* dòng chỉ có số (số dư to ở đầu màn hình, đơn vị nằm riêng) */
    if(!res.amt){ lines.forEach((l, i) => { if(/^\d{1,3}([.,]\d{3})+$/.test(l.replace(/\s/g, "")) && !/lai/.test(F[i - 1] || "")) res.amt = Math.max(res.amt, money(l)); }); }

    /* tên: dòng ngắn có "tiền gửi / tiết kiệm / chứng chỉ" mà không phải tiêu đề chung */
    const nm = lines.find((l, i) => l.length <= 40 && /tien gui|tiet kiem|chung chi/.test(F[i]) && !/thong tin|so tai khoan|chi tiet|danh sach|gui them|tat toan|lich su|khoa|ky han|lai/.test(F[i]));
    res.name = (nm || (res.kind === "cd" ? "Chứng chỉ tiền gửi" : "Sổ tiết kiệm")).replace(/[^\p{L}\p{N} .\-]/gu, "").replace(/\s+/g, " ").trim();
    /* bỏ mảnh rác do biểu tượng bên cạnh bị đọc thành chữ ("… tích lũy Z 2", "… tích lũy &") */
    res.name = res.name.replace(/(\s+(?:[A-Za-z0-9]{1,2}|[^\p{L}\p{N}]+))+$/u, "").trim();
    if(res.acct) res.name += " ·" + res.acct.slice(-4);

    /* phải có ít nhất số tiền và một trong lãi suất / kỳ hạn / ngày mới coi là đọc được */
    if(!res.amt || !(res.rate || res.term || res.start)) return null;
    return res;
  }

  const api = { parse, fold };
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  else root.N50KSoTK = api;
})(typeof window !== "undefined" ? window : this);
