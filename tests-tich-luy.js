/* Bài thử bộ hiểu câu tiết kiệm & đầu tư (tich-luy.js). Chạy: node tests-tich-luy.js */
const T = require("./tich-luy.js");
let n = 0, fail = 0;
const now = new Date("2026-11-01T10:00:00");
const ctx0 = { assets:[], wallets:[{ id:"w1", name:"Momo" }], now };
const ctx1 = { now, wallets:[], assets:[
  { id:"s1", kind:"save", name:"Sổ Vietcombank 6 tháng" },
  { id:"s2", kind:"save", name:"Sổ Techcombank 12 tháng" },
  { id:"g1", kind:"gold", name:"Vàng SJC", qty:2, unit:"chỉ" },
  { id:"f1", kind:"fund", name:"Quỹ DCDS" },
  { id:"x9", kind:"stock", name:"FPT", closed:1 }
] };
function check(text, want, ctx){
  n++;
  const r = T.parse(text, ctx || ctx0), it = r && r.items && r.items[0];
  if(want === null){ if(r){ fail++; console.log("✗ không phải câu tích luỹ: " + text + " → " + JSON.stringify(r)); } return; }
  if(want.q){ if(!r || !r.query || r.query.q !== want.q){ fail++; console.log("✗ " + text + " → " + JSON.stringify(r)); } return; }
  const bad = !it ? ["(không hiểu)"] : Object.keys(want).filter(k => JSON.stringify(it[k]) !== JSON.stringify(want[k]));
  if(bad.length){ fail++; console.log("✗ " + text + "\n   sai " + bad.join(", ") + ": " + JSON.stringify(it)); }
}
/* gửi tiết kiệm */
check("gửi tiết kiệm 50tr vcb 6 tháng 5,2%", { kind:"asin", amt:50000000, asset:null, ak:"save", rate:5.2, term:6, name:"Sổ Vietcombank 6 tháng", w:"main", date:"2026-11-01" });
check("gui tk 100 trieu techcombank 12 thang 5.5%", { kind:"asin", amt:100000000, ak:"save", term:12, rate:5.5, name:"Sổ Techcombank 1 năm" });
check("mở sổ 20tr bidv 3 tháng", { kind:"asin", amt:20000000, name:"Sổ BIDV 3 tháng", term:3 });
check("hôm qua gửi tiết kiệm 30tr acb không kỳ hạn", { kind:"asin", amt:30000000, term:0, date:"2026-10-31" });
check("gửi thêm 10tr vào sổ vcb", { kind:"asin", amt:10000000, asset:"s1" }, ctx1);
check("gửi tiết kiệm 50tr có sẵn từ trước", { kind:"asin", w:"" });
check("mở cd 200tr vpbank 12 tháng 6,1%", { kind:"asin", ak:"cd", amt:200000000, name:"CD VPBank 1 năm" });
check("gửi tiết kiệm 5tr từ momo", { kind:"asin", w:"w1" });
/* rút / tất toán */
check("rút sổ vcb", { kind:"asout", all:true, amt:0, asset:"s1" }, ctx1);
check("tất toán sổ techcombank", { kind:"asout", all:true, asset:"s2" }, ctx1);
check("rút 10tr từ sổ vcb", { kind:"asout", all:false, amt:10000000, asset:"s1" }, ctx1);
check("rút sổ tiết kiệm", { kind:"asout", all:true, asset:null }, ctx1);
/* vàng */
check("mua 1 chỉ vàng 8tr2", { kind:"asin", ak:"gold", amt:8200000, qty:1, unit:"chỉ", asset:null, name:"Vàng" });
check("mua 1 chỉ vàng 8tr2", { kind:"asin", ak:"gold", amt:8200000, qty:1, asset:"g1" }, ctx1);
check("mua 2 chỉ vàng sjc 16tr8", { kind:"asin", amt:16800000, qty:2, asset:"g1" }, ctx1);
check("mua nửa chỉ vàng 4tr1", { kind:"asin", qty:0.5, amt:4100000 });
check("vàng giờ 8tr5", { kind:"asval", ak:"gold", amt:8500000, per:null, asset:"g1" }, ctx1);
check("giá vàng hôm nay 8tr6", { kind:"asval", per:true, amt:8600000 }, ctx1);
check("vàng giờ tổng 17tr", { kind:"asval", per:false, amt:17000000 }, ctx1);
check("bán 1 chỉ vàng 8tr7", { kind:"asout", ak:"gold", amt:8700000, qty:1, all:false, asset:"g1" }, ctx1);
check("bán hết vàng 17tr4", { kind:"asout", all:true, amt:17400000 }, ctx1);
/* quỹ, cổ phiếu, tiền số */
check("mua ccq DCDS 5tr", { kind:"asin", ak:"fund", amt:5000000, asset:"f1" }, ctx1);
check("nạp 3tr vào quỹ VESAF", { kind:"asin", ak:"fund", amt:3000000, asset:null, name:"Quỹ VESAF" }, ctx1);
check("quỹ DCDS giờ 12tr", { kind:"asval", ak:"fund", amt:12000000, asset:"f1" }, ctx1);
check("mua 100 cp FPT 12tr", { kind:"asin", ak:"stock", amt:12000000, qty:100, unit:"cp", name:"FPT", asset:null }, ctx1);
check("mua btc 2tr", { kind:"asin", ak:"crypto", amt:2000000, name:"BTC" });
/* câu hỏi */
check("tài sản của mình bao nhiêu", { q:"assets" });
check("vàng lời lỗ thế nào", { q:"assets" });
/* không phải câu tích luỹ: để bộ hiểu câu chính xử lý */
[
  "ăn phở 45k", "chuyển 5tr vào tk", "chuyển tiền vào số tài khoản 0123 2tr", "rút 2tr", "rút tiền từ tk 3tr",
  "tất toán thẻ vib 5tr", "mua vé số 20k", "vâng ghi 50k", "dạ vâng", "quý này tiêu bao nhiêu", "ăn bún mà 50k",
  "mua sổ tay 30k", "nhận lương 15tr", "trả nợ Lan 500k", "gửi mẹ 2tr", "đóng tiền nhà 4tr",
  "mua bánh mì 20k", "cho Tuấn vay 1tr", "tài khoản còn 5tr8"
].forEach(s => check(s, null));
console.log((fail ? "✗ " + fail + " lỗi / " : "✓ ") + n + " câu");
process.exit(fail ? 1 : 0);
