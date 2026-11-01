/* Bài thử gộp dữ liệu hai máy / gộp file sao lưu (mergeStates trong index.html). Chạy: node tests-gop.js
   Lấy thẳng hàm từ index.html nên luôn thử đúng code đang chạy. */
const fs = require("fs");
const src = fs.readFileSync(__dirname + "/index.html", "utf8");
function grab(name){
  const i = src.indexOf("function " + name + "(");
  if(i < 0) throw new Error("không thấy hàm " + name);
  let d = 0;
  for(let k = src.indexOf("{", i); k < src.length; k++){
    if(src[k] === "{") d++;
    else if(src[k] === "}" && !--d) return src.slice(i, k + 1);
  }
}
const M = new Function(grab("normalize") + grab("mergeStates") + grab("mergeTagOff") + grab("mergeMapM") + grab("maxMap") + grab("fixOrphanAssets") + "; return { normalize, mergeStates };")();
let n = 0, fail = 0;
const ok = (name, cond, extra) => { n++; if(!cond){ fail++; console.log("✗ " + name + (extra ? "\n   " + extra : "")); } };
const N = M.normalize, G = M.mergeStates;
const count = (st, id) => ["days", "income", "cardTx"].reduce((s, b) => s + Object.values(st[b]).flat().filter(x => x.id === id).length, 0);

/* v210: khoản đã đổi ngày không bị nhân đôi */
{
  const A = N({ days:{ "2026-10-01":[{ id:"x", amt:50000, t:1, m:1 }] } });
  const B = N({ days:{ "2026-10-02":[{ id:"x", amt:50000, t:2, m:5 }] } });
  let r = G(A, B);
  ok("đổi ngày: chỉ còn một khoản", count(r, "x") === 1, JSON.stringify(r.days));
  ok("đổi ngày: nằm ở ngày mới", (r.days["2026-10-02"] || []).length === 1 && !r.days["2026-10-01"]);
  r = G(B, A);
  ok("đổi ngày (gộp ngược chiều): vẫn ngày mới", count(r, "x") === 1 && (r.days["2026-10-02"] || []).length === 1);
}
{
  const A = N({ days:{ "2026-10-01":[{ id:"x", amt:50000, t:1, m:1 }] } });
  const C = N({ cardTx:{ "2026-10-01":[{ id:"x", amt:50000, cardId:"c1", t:1, m:5 }] } });
  const r = G(A, C);
  ok("chi → chi thẻ: chỉ còn khoản thẻ", count(r, "x") === 1 && (r.cardTx["2026-10-01"] || []).length === 1);
}
{
  const A = N({ days:{ "2026-10-01":[{ id:"a", amt:1, t:2, m:1 }, { id:"b", amt:2, t:1, m:1 }] } });
  const B = N({ days:{ "2026-10-01":[{ id:"c", amt:3, t:3, m:2 }] } });
  const r = G(A, B);
  ok("hai máy ghi khoản khác nhau cùng ngày: giữ đủ, theo giờ", r.days["2026-10-01"].map(x => x.id).join() === "b,a,c");
}
{
  const A = N({ days:{ "2026-10-01":[{ id:"x", amt:1, t:1, m:1 }] } });
  const B = N({ deleted:{ x:9 } });
  ok("đã xoá bên kia (sau lần sửa): không sống lại", count(G(A, B), "x") === 0);
  const A2 = N({ days:{ "2026-10-03":[{ id:"x", amt:1, t:1, m:20 }] } });
  ok("sửa sau khi bên kia xoá: giữ lại", count(G(A2, B), "x") === 1);
}

/* v214: khoản tích luỹ mồ côi */
{
  const A = N({ assets:[], assetTx:[], deleted:{ s1:100 } });
  const B = N({ assets:[{ id:"s1", kind:"save", name:"Sổ", t:1, m:50 }], assetTx:[{ id:"t1", asset:"s1", dir:"in", amt:5, date:"2026-10-01", t:1, m:50 }] });
  let r = G(A, B);
  ok("máy A xoá sổ, máy B không đụng: sổ và giao dịch đều bỏ", !r.assets.length && !r.assetTx.length);
  const B2 = N({ assets:[{ id:"s1", kind:"save", name:"Sổ", t:1, m:50 }], assetTx:[{ id:"t1", asset:"s1", dir:"in", amt:5, date:"2026-10-01", t:1, m:50 }, { id:"t2", asset:"s1", dir:"in", amt:7, date:"2026-10-05", t:2, m:200 }] });
  r = G(A, B2);
  ok("máy B gửi thêm SAU lúc xoá: giữ lại sổ và giao dịch", r.assets.length === 1 && r.assetTx.length === 2 && !r.deleted.s1);
  const C = N({ assets:[], assetTx:[{ id:"t9", asset:"zz", dir:"in", amt:1, date:"2026-10-01", t:1, m:1 }] });
  ok("giao dịch của khoản không còn ở đâu: bỏ", !G(C, N({})).assetTx.length);
}
/* v214: askMem / payKind gộp theo thời điểm */
{
  const A = N({ askMem:{ "chuyen_di:lan":"vay" }, askMemM:{ "chuyen_di:lan":10 }, payKind:{ teo:"in" }, payKindM:{ teo:50 } });
  const B = N({ askMem:{ "chuyen_di:lan":"chi" }, askMemM:{ "chuyen_di:lan":5 }, payKind:{ teo:"out" }, payKindM:{ teo:20 } });
  let r = G(A, B);
  ok("lựa chọn đặt sau thắng (bên nhập đặt trước)", r.askMem["chuyen_di:lan"] === "vay" && r.payKind.teo === "in");
  const D = N({ askMem:{}, askMemM:{ "chuyen_di:lan":30 } });
  r = G(A, D);
  ok("bỏ lựa chọn (Chọn lại) ở máy kia sau đó: không sống lại", !("chuyen_di:lan" in r.askMem) && r.askMemM["chuyen_di:lan"] === 30);
  r = G(N({ askMem:{ x:"1" } }), N({ askMem:{ x:"2", y:"3" } }));
  ok("dữ liệu cũ chưa có mốc: như trước, bên nhập thắng, giữ khoá chỉ một bên có", r.askMem.x === "2" && r.askMem.y === "3");
  r = G(N({ askMem:{ z:"1" } }), N({}));
  ok("khoá chỉ bên này có, chưa có mốc: giữ", r.askMem.z === "1");
}

console.log((fail ? "✗ " + fail + " lỗi / " : "✓ ") + n + " bài thử");
process.exit(fail ? 1 : 0);
