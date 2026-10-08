/* Chạy kho câu mẫu (kho-cau-mau.js) qua bộ hiểu câu. Chạy: node tests-kho-cau.js [-v] [nhóm]
   In tỉ lệ đúng theo nhóm và tỉ lệ máy tự xử lý (không cần AI). */
const P = require("./parse-vi.js");
const K = require("./kho-cau-mau.js");
const L = require("./thu-vien-cau.js");
const V = process.argv.includes("-v"), only = process.argv.slice(2).find(a => !a.startsWith("-"));
const now = new Date(K.CTX.now);
const ctx = () => Object.assign({}, K.CTX, { now });
const D = n => { const d = new Date(now); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
function checkItem(it, w){
  if(!it) return "thiếu khoản";
  const bad = [];
  ["kind","amt","cat","src","w","from","to","split"].forEach(f => { if(w[f] !== undefined && it[f] !== w[f]) bad.push(f + " " + it[f]); });
  if(w.date !== undefined && it.date !== D(w.date)) bad.push("date " + it.date);
  if(w.card && it.cardId !== w.card) bad.push("card " + it.cardId);
  if(w.loan && it.loanId !== w.loan) bad.push("loan " + it.loanId);
  if(w.who && !P.norm(it.who || "").includes(P.norm(w.who))) bad.push("who " + it.who);
  return bad.join(", ");
}
function checkQ(q, w){
  if(!q) return "không hiểu là câu hỏi";
  const bad = [];
  ["q","period","tag","compare"].forEach(k => { if(w[k] !== undefined && q[k] !== w[k]) bad.push(k + " " + JSON.stringify(q[k])); });
  return bad.join(", ");
}
const show = r => r.query ? "Q " + JSON.stringify(r.query) : r.items.map(i => i.kind + "|" + i.amt + "|" + i.note + "|" + (i.cat || "") + "|" + i.date + (i.cardId ? "|" + i.cardId : "") + (i.loanId ? "|" + i.loanId : "") + (i.w ? "|w=" + i.w : "") + (i.split ? "|chia" + i.split : "")).join(" ; ") || "(không có khoản)";

const all = K.build(), stat = {};
let n = 0, ok = 0, local = 0, shown = 0;
all.forEach(({ nhom, cau, mong }) => {
  if(only && nhom.indexOf(only) !== 0) return;
  n++; const s = stat[nhom] = stat[nhom] || { n:0, ok:0, local:0 }; s.n++;
  const c = ctx(); let r;
  try{ r = P.parse(cau, c); }catch(e){ console.log("LỖI " + cau + " " + e.stack); return; }
  let err = "";
  if(mong.q) err = checkQ(r.query, mong);
  else {
    const ws = Array.isArray(mong) ? mong : [mong];
    if(r.query) err = "nhầm thành câu hỏi " + r.query.q;
    else if(r.items.length !== ws.length) err = r.items.length + " khoản (mong " + ws.length + ")";
    else ws.forEach((w, i) => { const m = checkItem(r.items[i], w); if(m) err += "[" + i + "] " + m + " "; });
  }
  if(!err){ const t = L.talk(cau, r, { now, guessTag:P.guessTag }); if(t) err = "bị trò chuyện chặn: " + t.id; }
  const a = P.assess(cau, r, c);
  if(!err){ ok++; s.ok++; if(a.local){ local++; s.local++; } else if(V) console.log("AI   [" + nhom + "] " + JSON.stringify(cau) + " " + a.why); }
  else if(V || shown < 400){ shown++; console.log("SAI  [" + nhom + "] " + JSON.stringify(cau) + "\n     " + err.trim() + "\n     → " + show(r)); }
});
/* trò chuyện, hướng dẫn: mỗi câu mẫu thêm bản không dấu, bản viết hoa đầu, bản thêm "ạ"/"nhé" */
L.TROCHUYEN.forEach(t => t.vi_du.forEach(v => [v, K.strip(v), v.charAt(0).toUpperCase() + v.slice(1), v + " ạ", v + "?"].forEach(cau => {
  if(only && "tro_chuyen".indexOf(only) !== 0) return;
  if((t.id === "thieu_tien" || t.khong_hoi) && /\?$/.test(cau)) return;
  n++; const st = stat.tro_chuyen = stat.tro_chuyen || { n:0, ok:0, local:0 }; st.n++;
  const r = P.parse(cau, ctx()), got = L.talk(cau, r, { now, guessTag:P.guessTag });
  if(got && got.id === t.id){ ok++; st.ok++; local++; st.local++; }
  else console.log("SAI  [tro_chuyen] " + JSON.stringify(cau) + " → " + (got ? got.id : "null") + " (mong " + t.id + ") " + show(r));
})));
/* nhánh hội thoại */
K.branches().forEach(({ nhom, cau, tiep, mong, waitAmt }) => {
  if(only && nhom.indexOf(only) !== 0) return;
  n++; const s = stat[nhom] = stat[nhom] || { n:0, ok:0, local:0 }; s.n++;
  const c = Object.assign(ctx(), { guessTag:t => P.guessTag(t) });
  const r0 = waitAmt ? { items:[] } : P.parse(cau, c);
  const dlg = waitAmt ? { items:[], waitAmt:cau } : { items:r0.items };
  const b = L.nhanh(tiep, dlg, P, c);
  let err = "";
  if(mong.act === "none"){ if(b) err = "bị coi là câu nối: " + JSON.stringify(b); }
  else if(!b) err = "không nhận ra câu nối";
  else if(b.act !== mong.act) err = "act " + b.act;
  else if(mong.act === "new"){ const r = P.parse(b.text, c); const it = r.items[0]; if(!it || it.amt !== mong.amt || (mong.cat && it.cat !== mong.cat)) err = "ghép sai: " + show(r); }
  else if(mong.f) for(const f in mong.f){ const want = mong.f[f], got = b.f && b.f[f]; if(want === true ? !got : got !== want) err += f + " " + JSON.stringify(got) + " "; }
  if(!err){ ok++; s.ok++; local++; s.local++; }
  else { console.log("SAI  [" + nhom + "] " + JSON.stringify(cau) + " → " + JSON.stringify(tiep) + "\n     " + err.trim()); }
});
console.log("\n" + Object.entries(stat).map(([g, s]) => g.padEnd(14) + " " + String(s.ok).padStart(4) + "/" + String(s.n).padEnd(4) + (s.ok < s.n ? "  sai " + (s.n - s.ok) : "") + (s.ok - s.local ? "  · cần AI " + (s.ok - s.local) : "")).join("\n"));
console.log("\nTỔNG " + ok + "/" + n + " đúng (" + (100 * ok / n).toFixed(1) + "%) · máy tự xử lý không cần AI: " + local + " (" + (100 * local / n).toFixed(1) + "%)");
process.exitCode = ok === n ? 0 : 1;
