/* Chạy mọi câu mẫu trong thư viện (thu-vien-cau.js) qua bộ hiểu câu (parse-vi.js).
   Chạy: node tests-thu-vien.js      (thêm -v để in cả câu đúng) */
const P = require("./parse-vi.js");
const L = require("./thu-vien-cau.js");
const V = process.argv.includes("-v");
const C = L.MAU_CTX, now = new Date(C.now);
const ctx = () => ({ now, cards:C.cards, loans:C.loans, wallets:C.wallets, tags:[] });
const D = n => { const d = new Date(now); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

function checkItem(it, w){
  if(!it) return "thiếu khoản";
  const bad = [];
  if(w.kind && it.kind !== w.kind) bad.push("kind " + it.kind);
  if(w.amt && it.amt !== w.amt) bad.push("amt " + it.amt);
  if(w.cat && it.cat !== w.cat) bad.push("cat " + it.cat);
  if(w.date !== undefined && it.date !== D(w.date)) bad.push("date " + it.date);
  if(w.card && it.cardId !== w.card) bad.push("card " + it.cardId);
  if(w.loan && it.loanId !== w.loan) bad.push("loan " + it.loanId);
  if(w.src && it.src !== w.src) bad.push("src " + it.src);
  if(w.w && it.w !== w.w) bad.push("w " + it.w);
  if(w.from && it.from !== w.from) bad.push("from " + it.from);
  if(w.to && it.to !== w.to) bad.push("to " + it.to);
  if(w.who && !String(it.who || "").toLowerCase().includes(w.who.toLowerCase())) bad.push("who " + it.who);
  if(w.note && !String(it.note || "").toLowerCase().includes(w.note.toLowerCase())) bad.push("note " + it.note);
  return bad.join(", ");
}
function checkQ(q, w){
  if(!q) return "không hiểu là câu hỏi";
  const bad = [];
  ["q","period","tag","src","group","list","top","compare","minAmt"].forEach(k => { if(w[k] !== undefined && q[k] !== w[k]) bad.push(k + " " + JSON.stringify(q[k])); });
  if(w.kind_q && q.kind !== w.kind_q) bad.push("kind " + q.kind);
  return bad.join(", ");
}
const show = r => r.query ? "Q " + JSON.stringify(r.query) : r.items.map(i => i.kind + "|" + i.amt + "|" + i.note + "|" + (i.cat || "") + "|" + i.date + (i.cardId ? "|" + i.cardId : "") + (i.loanId ? "|" + i.loanId : "") + (i.w ? "|w=" + i.w : "")).join(" ; ") || "(không có khoản)";

const stat = {}; let total = 0, fail = 0;
function rec(group, id, text, err, got){
  total++; const s = stat[group] = stat[group] || { ok:0, n:0 }; s.n++;
  if(err){ fail++; console.log("SAI  [" + id + "] " + JSON.stringify(text) + "\n     " + err + "\n     → " + got); }
  else { s.ok++; if(V) console.log("đúng [" + id + "] " + text); }
}

/* A, B: ghi khoản và câu hỏi */
[["GHI", L.GHI], ["HOI", L.HOI]].forEach(([g, list]) => list.forEach(t => t.mau.forEach(([text, w]) => {
  let r; try{ r = P.parse(text, ctx()); }catch(e){ return rec(g, t.id, text, "LỖI " + e.message, ""); }
  let err = "";
  if(w.q) err = checkQ(r.query, w);
  else {
    const want = Array.isArray(w) ? w : [w];
    if(r.query) err = "nhầm thành câu hỏi " + r.query.q;
    else if(r.items.length !== want.length) err = r.items.length + " khoản (mong " + want.length + ")";
    else want.forEach((x, i) => { const m = checkItem(r.items[i], x); if(m) err += "[" + i + "] " + m + " "; });
  }
  /* câu mẫu ghi khoản không được bị phần trò chuyện chặn */
  if(!err && !w.q){ const t2 = L.talk(text, r, { now, guessTag:P.guessTag }); if(t2) err = "bị trò chuyện chặn: " + t2.id; }
  if(!err && w.q){ const t2 = L.talk(text, r, { now, guessTag:P.guessTag }); if(t2) err = "bị trò chuyện chặn: " + t2.id; }
  rec(g, t.id, text, err.trim(), show(r));
})));

/* C: câu nối tiếp */
L.NOI.forEach(t => t.mau.forEach(([a, b, w]) => {
  const prev = P.parse(a, ctx()).query;
  let q = null; try{ q = P.refine(b, prev, ctx()); }catch(e){}
  rec("NOI", t.id, a + " ⟶ " + b, checkQ(q, w), JSON.stringify(q));
}));

/* D: trò chuyện, hướng dẫn */
L.TROCHUYEN.forEach(t => t.vi_du.forEach(text => {
  const r = P.parse(text, ctx());
  const got = L.talk(text, r, { now, guessTag:P.guessTag });
  rec("TROCHUYEN", t.id, text, got && got.id === t.id ? "" : "ra " + (got ? got.id : "null"), show(r));
}));

/* E: câu số liệu / ghi khoản dễ bị nhầm là trò chuyện (không được chặn) */
[
  "tháng này tiêu ở đâu nhiều nhất", "quẹt thẻ ở đâu nhiều nhất", "ok ăn phở 45k", "cảm ơn, grab 28k",
  "thẻ VIB tháng này bao nhiêu", "hôm nay ăn gì hết bao nhiêu", "sao tháng này tiêu nhiều thế", "trả thẻ 3 triệu"
].forEach(text => {
  const r = P.parse(text, ctx()), got = L.talk(text, r, { now, guessTag:P.guessTag });
  rec("KHONG_CHAN", "-", text, got ? "bị chặn: " + got.id : "", show(r));
});

console.log("\n" + Object.entries(stat).map(([g, s]) => g + " " + s.ok + "/" + s.n).join(" · "));
console.log((total - fail) + "/" + total + " câu đúng. FAILED: " + fail);
const fs = L.fewShot(); if(V) console.log("\nCâu mẫu cho AI (" + fs.length + " dòng):\n" + fs.join("\n"));
process.exitCode = fail ? 1 : 0;
