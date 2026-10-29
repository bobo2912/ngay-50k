/* v193 – Câu thử cho khoản chi định kỳ: câu hỏi → { q:"fixed", mode, period }, câu "không tính định kỳ" → fx:"no",
   câu kể kèm "định kỳ" → khoản có fx:1, câu hỏi cách dùng → thư viện hd_dinhky. Chạy: node tests-dinh-ky.js */
const P = require("./parse-vi.js"), L = require("./thu-vien-cau.js");
const ctx = () => ({ now:new Date("2026-10-29T11:00:00"), cards:[{ id:"c1", name:"VIB" }] });
let ok = 0, bad = 0;
function check(text, want){
  const r = P.parse(text, ctx()), q = r.query || {};
  const got = {};
  if(want.items){
    const it = r.items[0] || {};
    got.items = r.items.length; got.fx = it.fx || 0; got.note = it.note; got.kind = it.kind;
  } else {
    got.q = q.q; got.mode = q.mode; got.period = q.period; got.fx = q.fx; got.src = q.src; got.from = q.from; got.to = q.to; got.minAmt = q.minAmt;
  }
  if(want.lib !== undefined){ const t = L.talk(text, r, {}); got.lib = t ? t.id : null; }
  const miss = Object.keys(want).filter(k => k !== "items" && String(got[k]) !== String(want[k]));
  if(want.items && got.items !== want.items) miss.push("items");
  if(miss.length){ bad++; console.log("SAI  \"" + text + "\"  cần " + JSON.stringify(want) + "  được " + JSON.stringify(got)); } else ok++;
}
/* câu hỏi số liệu */
check("tiêu gì các khoản định kỳ", { q:"fixed", mode:"list", period:"month", lib:null });
check("các khoản định kỳ tháng này", { q:"fixed", mode:"list", period:"month" });
check("tháng này chi định kỳ hết bao nhiêu", { q:"fixed", mode:"list", period:"month" });
check("liệt kê khoản định kỳ", { q:"fixed", mode:"list" });
check("chi cố định tháng này", { q:"fixed", mode:"list", period:"month" });
check("định kỳ tháng trước", { q:"fixed", period:"lastmonth" });
check("chi tiêu định kỳ tháng 9", { q:"fixed", period:"custom", from:"2026-09-01", to:"2026-09-30" });
check("tổng định kỳ năm nay", { q:"fixed", period:"year" });
check("khoản định kỳ nào lớn nhất", { q:"fixed", mode:"top" });
check("so sánh định kỳ tháng này với tháng trước", { q:"fixed", mode:"compare", period:"month" });
check("trung bình mỗi tháng chi định kỳ bao nhiêu", { q:"fixed", mode:"avg" });
check("định kỳ trung bình mỗi tháng bao nhiêu", { q:"fixed", mode:"avg" });
check("khoản định kỳ sắp tới", { q:"fixed", mode:"upcoming", from:"2026-10-29", to:"2026-10-31" });
check("còn khoản định kỳ nào chưa trả", { q:"fixed", mode:"upcoming" });
check("tháng sau phải trả những khoản định kỳ nào", { q:"fixed", mode:"upcoming", from:"2026-11-01", to:"2026-11-30" });
check("khoản nào có vẻ là định kỳ", { q:"fixed", mode:"detect" });
check("định kỳ bằng thẻ tháng này", { q:"fixed", src:"card" });
check("định kỳ thẻ VIB", { q:"fixed", src:"card" });
check("khoản định kỳ trên 1tr tháng này", { q:"fixed", minAmt:1000000 });
check("dinh ky thang nay bao nhieu", { q:"fixed", period:"month" });
/* bỏ khoản định kỳ khỏi câu hỏi thường */
check("tháng này tiêu bao nhiêu không tính định kỳ", { q:"spent", period:"month", fx:"no" });
check("liệt kê chi tiêu tháng này trừ khoản cố định", { q:"report", fx:"no" });
check("tuần này tiêu bao nhiêu ngoài các khoản định kỳ", { q:"report", period:"week", fx:"no" });
check("tháng này tiêu bao nhiêu", { q:"spent", fx:undefined });
/* câu kể kèm định kỳ → khoản định kỳ */
check("tiền nhà 3tr định kỳ", { items:1, fx:1, note:"Tiền nhà", kind:"out" });
check("học phí hàng tháng 2tr", { items:1, fx:1, note:"Học phí" });
check("tiền mạng hang thang 250k", { items:1, fx:1, note:"Tiền mạng" });
check("phí gửi xe 150k định kỳ", { items:1, fx:1, note:"Phí gửi xe" });
check("ăn trưa 45k", { items:1, fx:0 });
check("lãi ngân hàng tháng này 230k", { items:1, fx:0 });
/* hỏi cách dùng → hướng dẫn */
check("khoản định kỳ là gì", { lib:"hd_dinhky" });
check("thêm khoản định kỳ thế nào", { lib:"hd_dinhky" });
check("tiền nhà hàng tháng có tự ghi được không", { lib:"hd_dinhky" });
/* câu nối tiếp sau câu hỏi định kỳ */
{
  const prev = { q:"fixed", mode:"list", period:"month", src:"all", cardId:null };
  const t = (text, want) => { const r = P.refine(text, prev, ctx()) || {}; const miss = Object.keys(want).filter(k => String(r[k]) !== String(want[k])); if(miss.length){ bad++; console.log("SAI nối tiếp \"" + text + "\" cần " + JSON.stringify(want) + " được " + JSON.stringify(r)); } else ok++; };
  t("tháng trước thì sao", { q:"fixed", period:"lastmonth", mode:"list" });
  t("so với tháng trước", { q:"fixed", period:"month", mode:"compare" });
  t("cái nào lớn nhất", { q:"fixed", mode:"top" });
  t("còn thẻ thì sao", { q:"fixed", src:"card" });
  t("còn khoản nào chưa trả", { q:"fixed", mode:"upcoming" });
  t("trung bình mỗi tháng", { q:"fixed", mode:"avg" });
}
console.log((ok + bad) + " câu, " + ok + " đúng. FAILED: " + bad);
if(bad) process.exitCode = 1;
