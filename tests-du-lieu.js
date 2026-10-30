/* Thử bộ chuyển đổi schema 2 (du-lieu.js): node tests-du-lieu.js
   Mọi tên, số tài khoản, số tiền dưới đây là GIẢ. */
const D = require("./du-lieu.js");
let fail = 0, n = 0;
const ok = (name, cond, extra) => { n++; if(!cond){ fail++; console.log("✗ " + name + (extra ? "\n   " + extra : "")); } };

/* đưa về dạng so sánh được: bỏ túi ngày rỗng, sắp mảng bản ghi theo id, sắp khoá đối tượng */
function canon(v){
  if(Array.isArray(v)){
    const a = v.map(canon);
    if(a.every(x => x && typeof x === "object" && "id" in x)) a.sort((x, y) => String(x.id).localeCompare(String(y.id)));
    return a;
  }
  if(v && typeof v === "object"){
    const o = {};
    Object.keys(v).sort().forEach(k => {
      if(v[k] === undefined) return;
      if(Array.isArray(v[k]) && !v[k].length && /^\d{4}-\d{2}-\d{2}$/.test(k)) return;
      o[k] = canon(v[k]);
    });
    return o;
  }
  return v;
}
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
function firstDiff(a, b, path){
  path = path || "";
  if(JSON.stringify(a) === JSON.stringify(b)) return null;
  if(a && b && typeof a === "object" && typeof b === "object"){
    for(const k of new Set([...Object.keys(a), ...Object.keys(b)])){ const d = firstDiff(a[k], b[k], path + "." + k); if(d) return d; }
  }
  return path + ": " + JSON.stringify(a) + " ≠ " + JSON.stringify(b);
}

const T = d => new Date(d).getTime();
/* dữ liệu mẫu dạng cũ (trong bộ nhớ) đủ mọi loại khoản */
const v1 = {
  budget: 50000, budgetM: 1700000000000, updated: 1761800000000,
  days: {
    "2026-10-01": [
      { id:"o1", amt:45000, cat:"an", note:"Phở", t:T("2026-10-01T12:00:00"), m:1 },
      { id:"o2", amt:62000, cat:"cho", note:"Đi chợ", t:T("2026-10-01T08:00:00"), w:"wMomo", nk:"abc", fx:1, ph:["p1"] },
      { id:"o3", amt:300000, cat:"nha", note:"Chuyển tiền nhà", t:T("2026-10-01T09:00:00"), acct:"0123456789", bank:"MB Bank", memo:"tien nha", holder:"NGUYEN VAN A", contactId:"c1", who:"Anh A" }
    ],
    "2026-10-05": [ { id:"o4", amt:200000, cat:"nha", note:"Internet", t:T("2026-10-05T09:00:00"), fx:1, rc:"r1" } ],
    "2026-10-06": [],
    "2026-10-07": [ { id:"o5", amt:10000, cat:"khac", note:"lạ", t:T("2026-10-07T09:00:00"), type:"cũ", acc:"x" } ]   /* trùng tên trường → cất nguyên vẹn */
  },
  income: {
    "2026-10-02": [ { id:"i1", amt:15000000, cat:"luong", note:"Lương", t:T("2026-10-02T10:00:00") },
                    { id:"i2", amt:500000, cat:"cho", note:"Mẹ cho", t:T("2026-10-02T11:00:00"), w:"wMomo" } ]
  },
  cardTx: {
    "2026-10-03": [ { id:"c_1", amt:320000, where:"Shopee", cardId:"k1", cat:"muasam", t:T("2026-10-03T20:00:00") },
                    { id:"c_2", amt:99000, where:"Chi thẻ", cardId:null, cat:"", t:T("2026-10-03T21:00:00"), rc:"r2" },
                    { id:"c_3", amt:1000, where:"A", note:"B", cardId:"k1", t:T("2026-10-03T22:00:00") } ]
  },
  xfer: [ { id:"x1", amt:1000000, from:"main", to:"wMomo", date:"2026-10-04", t:T("2026-10-04T08:00:00"), note:"Nạp ví" } ],
  cardPay: [ { id:"p1", amt:500000, date:"2026-10-20", t:T("2026-10-20T08:00:00"), cardId:"k1" },
             { id:"p2", amt:100000, date:"2026-10-21", t:T("2026-10-21T08:00:00"), cardId:"k1", from:"wMomo" },
             { id:"p3", amt:50000, date:"2026-10-22", t:T("2026-10-22T08:00:00") } ],
  loans: [
    { id:"L1", type:"lend", who:"Minh", amt:500000, date:"2026-09-20", due:"", note:"", prepaid:0, t:T("2026-09-20T08:00:00"), m:5,
      payments:[ { id:"L1p1", amt:200000, date:"2026-10-01", note:"", t:T("2026-10-01T08:00:00") } ],
      draws:[ { id:"L1d1", amt:100000, date:"2026-09-25", note:"thêm", t:T("2026-09-25T08:00:00") } ] },
    { id:"L2", type:"borrow", who:"Chú Dũng", amt:2000000, date:"2026-08-01", due:"2026-12-01", note:"mua xe", prepaid:300000, t:T("2026-08-01T08:00:00"), payments:[], draws:[] }
  ],
  bals: [ { id:"b1", amt:4800000, book:4700000, card:120000, t:T("2026-09-30T20:00:00") },
          { id:"b2", amt:650000, t:T("2026-09-30T20:00:00"), w:"wMomo" } ],
  wallets: [ { id:"wMomo", name:"MoMo", kind:"ewallet", icon:"📱" }, { id:"wOld", name:"Ví cũ", kind:"credit", icon:"💳", off:1 } ],
  cards: [ { id:"k1", name:"VIB", first6:"123456", last4:"9999", stmt:20, m:3 } ],
  recur: [ { id:"r1", name:"Internet", amt:200000, day:5, cat:"nha", card:"", from:"2026-09-01", made:["2026-10"] },
          { id:"r2", name:"Netflix", amt:99000, day:3, cat:"giaitri", card:"k1", from:"2026-09-01" } ],
  tags: [ { id:"u_x", label:"Cà phê", icon:"☕" } ], tagOff: { thucung:{ v:1, m:2 } },
  contacts: [ { id:"c1", name:"Anh A", acct:"0123456789", bank:"MB Bank", memo:"", cat:"nha", uses:3 } ],
  learn: [ { id:"le1", key:"an pho #", items:[] } ], miss: [], thuvien: [ { id:"t1", k:"GS25", r:"GS25" } ],
  alias: { hl:"Highlands" }, aliasM: { hl:9 }, payKind: { "teo":"in" }, askMem: { "chuyen_di:lan":"vay" },
  deleted: { zz:123 }, payees: {}, caps: {}
};

const v2 = D.toV2(v1);
ok("có schema 2", v2.schema === 2 && D.isV2(v2));
ok("mọi biến động nằm ở tx", v2.tx.length === 5 + 2 + 3 + 1 + 3 + 3 + 1, "được " + v2.tx.length);
ok("tx sắp theo ngày", v2.tx.every((r, i) => !i || String(v2.tx[i - 1].d) <= String(r.d)));
ok("chi tiền mặt về ví main", v2.tx.find(r => r.id === "o1").acc === "main");
ok("chi từ ví khác giữ mã ví", v2.tx.find(r => r.id === "o2").acc === "wMomo");
ok("tag thu có tiền tố in:", v2.tx.find(r => r.id === "i2").tag === "in:cho");
ok("tag chi không có tiền tố", v2.tx.find(r => r.id === "o2").tag === "cho");
ok("chi thẻ: acc là mã thẻ, note là nơi chi", (r => r.type === "card" && r.acc === "k1" && r.note === "Shopee")(v2.tx.find(r => r.id === "c_1")));
ok("chuyển ví có acc → to", (r => r.acc === "main" && r.to === "wMomo" && r.d === "2026-10-04")(v2.tx.find(r => r.id === "x1")));
ok("trả thẻ: acc là ví trả, to là thẻ", (r => r.acc === "wMomo" && r.to === "k1")(v2.tx.find(r => r.id === "p2")));
ok("trả thẻ không ghi ví → main", v2.tx.find(r => r.id === "p1").acc === "main");
ok("khoản vay: tiền gốc thành tx loan", (r => r && r.amt === 500000 && r.d === "2026-09-20" && r.loan === "L1")(v2.tx.find(r => r.type === "loan" && r.loan === "L1")));
ok("vay thêm / trả là tx gắn loan", v2.tx.filter(r => r.loan === "L1").map(r => r.type).sort().join() === "draw,loan,repay");
ok("phần đầu khoản vay không còn tiền", (l => l.side === "lend" && !("amt" in l) && !("payments" in l) && !("draws" in l))(v2.loans.find(l => l.id === "L1")));
ok("bản ghi trùng tên trường cất nguyên vẹn", (r => r.raw && r.raw.type === "cũ" && r.d === "2026-10-07")(v2.tx.find(r => r.id === "o5")));
ok("chi thẻ có cả where và note cất nguyên vẹn", !!v2.tx.find(r => r.id === "c_3").raw);
ok("tài khoản: main + 2 ví + 1 thẻ", v2.accounts.map(a => a.group).join() === "main,wallet,wallet,card");
ok("thẻ có kind credit", v2.accounts.find(a => a.id === "k1").kind === "credit");
ok("đối chiếu số dư có acc", v2.balances.find(b => b.id === "b1").acc === "main" && v2.balances.find(b => b.id === "b2").acc === "wMomo");
ok("định kỳ: tag + acc", (r => r.tag === "nha" && r.acc === "main")(v2.recur.find(r => r.id === "r1")) && v2.recur.find(r => r.id === "r2").acc === "k1");
ok("bỏ trường cũ rỗng", !("payees" in v2) && !("caps" in v2));

/* khứ hồi: cũ → mới → cũ không mất gì */
const back = D.fromV2(v2);
const want = JSON.parse(JSON.stringify(v1));
ok("khứ hồi cũ → mới → cũ giữ nguyên dữ liệu", same(back, want), firstDiff(canon(back), canon(want)));
/* ổn định: chuyển lần hai ra đúng như lần một */
ok("chuyển lại ra cùng kết quả", JSON.stringify(D.toV2(back)) === JSON.stringify(v2), firstDiff(D.toV2(back), v2));
/* đi qua JSON (như lúc ghi xuống máy) */
ok("qua JSON vẫn khớp", same(D.decode(JSON.parse(JSON.stringify(v2))), want));
/* dạng cũ đi qua decode thì giữ nguyên */
ok("decode dạng cũ trả lại chính nó", D.decode(v1) === v1);
ok("dữ liệu rỗng", same(D.fromV2(D.toV2({})), D.fromV2(D.toV2(D.fromV2(D.toV2({}))))));

/* trong một ngày giữ thứ tự ghi, kể cả khoản ghi bù giờ sớm hơn */
ok("giữ thứ tự ghi trong ngày", back.days["2026-10-01"].map(x => x.id).join() === "o1,o2,o3");
ok("giữ thứ tự chi thẻ trong ngày", back.cardTx["2026-10-03"].map(x => x.id).join() === "c_1,c_2,c_3");

/* lớp đọc thống nhất */
const all = D.allTx(v1);
ok("allTx trải bản ghi cất nguyên vẹn", (r => r.amt === 10000 && r.type === "out" && r.d === "2026-10-07")(all.find(r => r.id === "o5")));
const ix = D.index(all);
ok("chỉ mục theo tháng", ix.byMonth["2026-10"].length === all.filter(r => String(r.d).startsWith("2026-10")).length);
ok("chỉ mục theo tài khoản gồm cả bên nhận", ix.byAcc.wMomo.some(r => r.id === "x1") && ix.byAcc.k1.some(r => r.id === "p1"));
ok("chỉ mục theo khoản vay", ix.byLoan.L1.length === 3);

/* tổng tiền không đổi qua khứ hồi */
const sum = st => { let s = 0; for(const b of ["days", "income", "cardTx"]) for(const k in st[b]) st[b][k].forEach(x => s += x.amt); st.loans.forEach(l => { s += l.amt; l.payments.forEach(p => s += p.amt); l.draws.forEach(p => s += p.amt); }); st.xfer.forEach(x => s += x.amt); st.cardPay.forEach(x => s += x.amt); return s; };
ok("tổng tiền khớp", sum(back) === sum(v1));

console.log((fail ? "✗ " + fail + " lỗi / " : "✓ ") + n + " bài thử");
process.exit(fail ? 1 : 0);
