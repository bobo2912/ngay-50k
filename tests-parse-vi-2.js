/* Bộ câu thử thứ hai cho bộ hiểu câu: gõ không dấu, viết tắt, tiếng lóng, nhiều khoản trong một câu.
   Chạy: node tests-parse-vi-2.js
   Mỗi dòng: [câu, mong đợi]. Mong đợi là một khoản (object) hoặc danh sách khoản (mảng), hoặc { q, period, tag } cho câu hỏi.
   Trong một khoản chỉ so những trường có ghi: kind, amt, cat, date, card (cardId), loan (loanId), src, who (khớp một phần), note (khớp một phần, không phân biệt hoa thường). */
const P = require("./parse-vi.js");
const now = new Date("2026-10-07T14:30:00");             /* thứ Tư */
const ctx = {
  now,
  cards: [{ id:"c1", name:"VIB" }, { id:"c2", name:"TPBank" }],
  loans: [{ id:"l1", type:"lend", who:"Chú Dũng" }, { id:"l2", type:"borrow", who:"Anh Tuấn" }, { id:"l3", type:"lend", who:"Hào" }]
};
const D = n => { const d = new Date(now); d.setDate(d.getDate() - n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const TODAY = D(0), YDAY = D(1);

const CASES = [
  /* ---- không dấu ---- */
  ["an pho 45k", { kind:"out", amt:45000, cat:"an" }],
  ["tra sua 35k", { kind:"out", amt:35000, cat:"uong" }],
  ["do xang 70k", { kind:"out", amt:70000, cat:"xang" }],
  ["hom qua an lau 350k", { kind:"out", amt:350000, cat:"an", date:YDAY }],
  ["sang nay banh mi 20k", { kind:"out", amt:20000, cat:"an", date:TODAY }],
  ["di cho 150k", { kind:"out", amt:150000, cat:"cho" }],
  ["tien dien 650k", { kind:"out", amt:650000, cat:"diennuoc" }],
  ["tien nha 4tr", { kind:"out", amt:4000000, cat:"nha" }],
  ["mua thuoc 120k", { kind:"out", amt:120000, cat:"suckhoe" }],
  ["cat toc 80k", { kind:"out", amt:80000, cat:"lamdep" }],
  ["xem phim 220k", { kind:"out", amt:220000, cat:"giaitri" }],
  ["nap dien thoai 100k", { kind:"out", amt:100000, cat:"dienthoai" }],
  ["quet the vib 500k mua ao", { kind:"card", amt:500000, card:"c1" }],
  ["cho chu dung vay 1tr", { kind:"lend", amt:1000000, loan:"l1" }],
  ["hao tra 200k", { kind:"collect", amt:200000, loan:"l3" }],
  ["tra no anh tuan 2tr", { kind:"repay", amt:2000000, loan:"l2" }],
  ["nhan luong 12tr", { kind:"in", amt:12000000, cat:"luong" }],
  ["tk con 3tr2", { kind:"bal", amt:3200000 }],
  ["hom nay tieu bao nhieu", { q:"spent", period:"today" }],
  ["thang nay an uong bn", { q:"spent", period:"month", tag:"an+uong" }],

  /* ---- viết tắt, tiếng lóng ---- */
  ["cf 25k", { kind:"out", amt:25000, cat:"uong" }],
  ["cafe sáng 25k", { kind:"out", amt:25000, cat:"uong" }],
  ["ck cho Lan 200k", { kind:"out", amt:200000 }],
  ["tm 50k mua rau", { kind:"out", amt:50000, src:"cash", cat:"cho" }],
  ["tiền mặt 30k gửi xe", { kind:"out", amt:30000, src:"cash", cat:"dilai" }],
  ["hnay ăn trưa 40k", { kind:"out", amt:40000, cat:"an", date:TODAY }],
  ["hqua grab 28k", { kind:"out", amt:28000, cat:"dilai", date:YDAY }],
  ["hnay tiêu bn", { q:"spent", period:"today" }],
  ["ăn trưa hết 45k nha", { kind:"out", amt:45000, cat:"an" }],
  ["uống trà sữa 35k nhé", { kind:"out", amt:35000, cat:"uong" }],
  ["mới đi grab 30k thôi", { kind:"out", amt:30000, cat:"dilai" }],
  ["15 củ tiền học", { kind:"out", amt:15000000, cat:"hoctap" }],
  ["mua giày 1 củ 2", { kind:"out", amt:1200000, cat:"muasam" }],
  ["shopee 320k", { kind:"out", amt:320000, cat:"muasam" }],
  ["gửi xe 5k", { kind:"out", amt:5000, cat:"dilai" }],
  ["netflix 260k", { kind:"out", amt:260000, cat:"giaitri" }],
  ["mừng cưới 500k", { kind:"out", amt:500000, cat:"hieuhy" }],
  ["đi chùa công đức 100k", { kind:"out", amt:100000, cat:"tuthien" }],
  ["pate cho mèo 45k", { kind:"out", amt:45000, cat:"thucung" }],
  ["bỉm cho con 380k", { kind:"out", amt:380000, cat:"concai" }],

  /* ---- cách viết số tiền ---- */
  ["phở 45.000đ", { amt:45000, cat:"an" }],
  ["phở 45,000", { amt:45000 }],
  ["phở 45000", { amt:45000 }],
  ["phở 45 k", { amt:45000 }],
  ["phở 45K", { amt:45000 }],
  ["tiền nhà 1.250.000 đồng", { amt:1250000, cat:"nha" }],
  ["học phí 2tr5", { amt:2500000, cat:"hoctap" }],
  ["học phí 2 triệu 5", { amt:2500000 }],
  ["học phí 2 triệu rưỡi", { amt:2500000 }],
  ["điện thoại 1 triệu 200 nghìn", { amt:1200000 }],
  ["áo 850 nghìn", { amt:850000, cat:"muasam" }],
  ["rau 200 ngàn", { amt:200000 }],
  ["bia 1tr", { amt:1000000, cat:"uong" }],
  ["laptop 25tr", { amt:25000000 }],
  ["vé máy bay 1,5tr", { amt:1500000, cat:"dulich" }],
  ["nước 1k5", { amt:1500 }],
  ["xôi 15", { amt:15000, cat:"an" }],
  ["đổ 2 lít xăng 50k", { amt:50000, cat:"xang" }],

  /* ---- nhiều khoản trong một câu ---- */
  ["sáng xôi 15k, trưa cơm 40k, tối phở 50k", [{ amt:15000, cat:"an" }, { amt:40000, cat:"an" }, { amt:50000, cat:"an" }]],
  ["cafe 25k + bánh mì 20k", [{ amt:25000, cat:"uong" }, { amt:20000, cat:"an" }]],
  ["grab 28k và trà sữa 35k", [{ amt:28000, cat:"dilai" }, { amt:35000, cat:"uong" }]],
  ["rau 20k thịt 80k trứng 30k", [{ amt:20000 }, { amt:80000 }, { amt:30000 }]],
  ["xang 50k, rua xe 30k", [{ amt:50000, cat:"xang" }, { amt:30000, cat:"suachua" }]],
  ["phở 45k\ntrà đá 5k", [{ amt:45000, cat:"an" }, { amt:5000, cat:"uong" }]],
  ["hôm qua đi chợ 200k với đổ xăng 70k", [{ amt:200000, cat:"cho", date:YDAY }, { amt:70000, cat:"xang", date:YDAY }]],
  ["nhận lương 15tr, trả tiền nhà 4tr", [{ kind:"in", amt:15000000 }, { kind:"out", amt:4000000, cat:"nha" }]],
  ["cho Hào vay 300k rồi ăn tối 60k", [{ kind:"lend", amt:300000, loan:"l3" }, { kind:"out", amt:60000, cat:"an" }]],
  ["mua áo 300k bằng thẻ TPBank và quần 250k", [{ kind:"card", amt:300000, card:"c2" }, { amt:250000 }]],

  /* ---- ngày giờ ---- */
  ["hôm kia ăn lẩu 400k", { amt:400000, date:D(2) }],
  ["tối qua bia 200k", { amt:200000, date:YDAY, cat:"uong" }],
  ["thứ 2 tuần trước cafe 30k", { amt:30000, date:D(9) }],
  ["chủ nhật đi siêu thị 650k", { amt:650000, date:D(3), cat:"cho" }],
  ["15/9 khám răng 500k", { amt:500000, date:"2026-09-15", cat:"suckhoe" }],
  ["ngày 3 đóng tiền mạng 220k", { amt:220000, date:"2026-10-03", cat:"dienthoai" }],
  ["sáng nay 7h30 bánh cuốn 35k", { amt:35000, date:TODAY, cat:"an" }],
  ["bua qua an bun cha 50k", { amt:50000, date:YDAY, cat:"an" }],

  /* ---- thẻ tín dụng ---- */
  ["quẹt thẻ tpbank 2tr mua điện thoại", { kind:"card", amt:2000000, card:"c2" }],
  ["cà thẻ VIB 500k lotte mart", { kind:"card", amt:500000, card:"c1", cat:"cho" }],
  ["thẻ vib 1tr2 uniqlo", { kind:"card", amt:1200000, card:"c1", cat:"muasam" }],
  ["trả thẻ tpbank 5tr", { kind:"cardpay", amt:5000000, card:"c2" }],
  ["thanh toán thẻ VIB 3tr", { kind:"cardpay", amt:3000000, card:"c1" }],

  /* ---- vay mượn ---- */
  ["cho Hào mượn 300k", { kind:"lend", amt:300000, loan:"l3" }],
  ["mượn anh Tuấn 2tr", { kind:"borrow", amt:2000000, loan:"l2" }],
  ["Dũng trả mình 500k", { kind:"collect", amt:500000, loan:"l1" }],
  ["anh Tuấn cho mình mượn 1tr", { kind:"borrow", amt:1000000, loan:"l2" }],
  ["trả anh Tuấn 500k", { kind:"repay", amt:500000, loan:"l2" }],
  ["chu dung tra 1tr", { kind:"collect", amt:1000000, loan:"l1" }],
  ["vay Minh 2tr", { kind:"borrow", amt:2000000, who:"Minh" }],

  /* ---- khoản thu ---- */
  ["lương về 15tr", { kind:"in", amt:15000000, cat:"luong" }],
  ["thưởng tết 5 triệu", { kind:"in", amt:5000000, cat:"thuong" }],
  ["bán đồ cũ được 300k", { kind:"in", amt:300000, cat:"ban" }],
  ["được lì xì 500k", { kind:"in", amt:500000, cat:"cho" }],
  ["hoàn tiền shopee 50k", { kind:"in", amt:50000 }],
  ["lãi tiết kiệm 120k", { kind:"in", amt:120000 }],
  ["bố cho 1tr", { kind:"in", amt:1000000, cat:"cho" }],

  /* ---- câu hỏi ---- */
  ["tuần này tiêu bao nhiêu", { q:"spent", period:"week" }],
  ["hôm qua ăn uống hết bao nhiêu", { q:"spent", period:"yesterday", tag:"an+uong" }],
  ["tháng trước tiêu bao nhiêu?", { q:"spent", period:"lastmonth" }],
  ["ai còn nợ mình", { q:"loans" }],
  ["mình còn nợ ai", { q:"loans" }],
  ["số dư bn", { q:"balance" }],
  ["còn được tiêu bao nhiêu", { q:"left" }],
  ["thẻ tháng này bn", { q:"card" }],
  ["hom nay con bao nhieu", { q:"left" }]
];

function match(it, want){
  if(!it) return "thiếu khoản";
  const bad = [];
  if(want.kind && it.kind !== want.kind) bad.push("kind " + it.kind);
  if(want.amt && it.amt !== want.amt) bad.push("amt " + it.amt);
  if(want.cat && it.cat !== want.cat) bad.push("cat " + it.cat);
  if(want.date && it.date !== want.date) bad.push("date " + it.date);
  if(want.card && it.cardId !== want.card) bad.push("card " + it.cardId);
  if(want.loan && it.loanId !== want.loan) bad.push("loan " + it.loanId);
  if(want.src && it.src !== want.src) bad.push("src " + it.src);
  if(want.who && !String(it.who || "").toLowerCase().includes(want.who.toLowerCase())) bad.push("who " + it.who);
  if(want.note && !String(it.note || "").toLowerCase().includes(want.note.toLowerCase())) bad.push("note " + it.note);
  return bad.join(", ");
}
let fail = 0;
CASES.forEach(([text, want]) => {
  let r; try{ r = P.parse(text, ctx); }catch(e){ console.log("LỖI " + text + " → " + e.message); fail++; return; }
  let err = "";
  if(want && want.q){
    if(!r.query) err = "không hiểu là câu hỏi";
    else{
      if(r.query.q !== want.q) err = "q " + r.query.q;
      if(want.period && r.query.period !== want.period) err += " period " + r.query.period;
      if(want.tag && r.query.tag !== want.tag) err += " tag " + r.query.tag;
    }
  } else {
    const list = Array.isArray(want) ? want : [want];
    if(r.query) err = "nhầm thành câu hỏi " + r.query.q;
    else if(r.items.length !== list.length) err = r.items.length + " khoản (mong " + list.length + ")";
    else list.forEach((w, i) => { const m = match(r.items[i], w); if(m) err += "[" + i + "] " + m + " "; });
  }
  if(err){
    fail++;
    const got = r.query ? "Q " + JSON.stringify(r.query) : r.items.map(i => i.kind + "|" + i.amt + "|" + i.note + "|" + (i.cat || "") + "|" + i.date + (i.cardId ? "|" + i.cardId : "") + (i.loanId ? "|" + i.loanId : "")).join(" ; ");
    console.log("SAI  " + JSON.stringify(text) + "\n     " + err.trim() + "\n     → " + got);
  }
});
console.log("\n" + (CASES.length - fail) + "/" + CASES.length + " câu đúng. FAILED: " + fail);
process.exitCode = fail ? 1 : 0;
