/* Thử bộ hiểu câu với nhiều ví (v98). Chạy: node tests-wallet-vi.js */
const P = require("./parse-vi.js");
const ctx = { now:new Date("2026-10-07T12:00:00"), cards:[{ id:"c1", name:"VIB" }], loans:[], tags:[],
  wallets:[{ id:"w1", name:"Momo" }, { id:"w2", name:"Techcombank" }, { id:"w3", name:"ZaloPay" }] };
/* [câu, mong đợi] — mong đợi: kind, w, from, to, note; hoặc q cho câu hỏi */
const CASES = [
  ["cafe 30k momo", { kind:"out", w:"w1", note:"Cafe" }],
  ["trả bằng momo 45k ăn phở", { kind:"out", w:"w1" }],
  ["grab 28k qua zalopay", { kind:"out", w:"w3", note:"Grab" }],
  ["phở 45k", { kind:"out", w:undefined }],
  ["nạp momo 500k", { kind:"xfer", from:"main", to:"w1" }],
  ["nạp 500k vào momo", { kind:"xfer", from:"main", to:"w1" }],
  ["chuyển 1tr sang momo", { kind:"xfer", from:"main", to:"w1" }],
  ["chuyển 2 triệu từ techcombank sang momo", { kind:"xfer", from:"w2", to:"w1" }],
  ["rút 300k từ momo về tài khoản", { kind:"xfer", from:"w1", to:"main" }],
  ["rut momo 200k", { kind:"xfer", from:"w1", to:"main" }],
  ["nạp điện thoại 100k bằng momo", { kind:"out", w:"w1" }],
  ["chuyển khoản tiền nhà 3tr từ techcombank", { kind:"out", w:"w2" }],
  ["momo còn 350k", { kind:"bal", w:"w1" }],
  ["tài khoản còn 5 triệu 8", { kind:"bal", w:undefined }],
  ["nhận lương 15 triệu vào techcombank", { kind:"in", w:"w2" }],
  ["quẹt thẻ VIB 1tr2 mua giày", { kind:"card", w:undefined }],
  ["momo còn bao nhiêu", { q:"balance", wid:"w1" }],
  ["số dư bao nhiêu", { q:"balance", wid:undefined }],
  ["tháng này chi gì bằng momo", { q:"report", wid:"w1" }],
  ["hôm nay tiêu bao nhiêu", { q:"spent", wid:undefined }]
];
let fail = 0;
CASES.forEach(([t, want]) => {
  const r = P.parse(t, ctx), got = r.query ? r.query : (r.items[0] || {});
  const bad = Object.keys(want).filter(k => got[k] !== want[k]);
  if(bad.length || (!r.query && r.items.length !== 1)){ fail++; console.log("SAI  " + t + " → " + JSON.stringify(r.query || r.items) + " | sai: " + bad.join(",")); }
});
/* câu nối tiếp: "còn momo thì sao" sau câu hỏi chi tiêu */
const prev = P.parse("tháng này tiêu gì", ctx).query, ref = P.refine("còn momo thì sao", prev, ctx);
if(!ref || ref.wid !== "w1"){ fail++; console.log("SAI  nối tiếp momo → " + JSON.stringify(ref)); }
const ref2 = P.refine("tất cả các ví", Object.assign({}, prev, { wid:"w1" }), ctx);
if(!ref2 || ref2.wid){ fail++; console.log("SAI  bỏ lọc ví → " + JSON.stringify(ref2)); }
/* không có ví thêm thì không đổi gì */
const r0 = P.parse("nạp momo 500k", { now:ctx.now, cards:[], loans:[], tags:[] }).items[0];
if(!r0 || r0.kind === "xfer" || r0.w){ fail++; console.log("SAI  không có ví → " + JSON.stringify(r0)); }
console.log((CASES.length + 3 - fail) + "/" + (CASES.length + 3) + " đúng. FAILED: " + fail);
process.exitCode = fail ? 1 : 0;
