/* v200: thử phần G "Hỏi lại khi rẽ nhánh" của thư viện (thu-vien-cau.js).
   Mỗi câu mẫu: chạy qua parse-vi.js → hoiLai() → đúng nhánh được hỏi chưa; có lựa chọn thì chọn rồi xem khoản sau khi chọn.
   Thêm: nhớ lựa chọn theo người, trả lời bằng chữ, hỏi nối tiếp nhiều nhánh.
   Chạy: node tests-hoi-lai.js   (-v in cả câu đúng) */
const P = require("./parse-vi.js");
const L = require("./thu-vien-cau.js");
const V = process.argv.includes("-v");
const C = L.MAU_CTX;
const ctx = () => { const c = { now:new Date(C.now), cards:C.cards, loans:C.loans, wallets:C.wallets, tags:[] }; c.guessTag = t => P.guessTag(t, c); return c; };
let n = 0, bad = 0;
const ok = (cond, label, info) => { n++; if(!cond){ bad++; console.log("SAI  " + label + (info ? "\n     " + info : "")); } else if(V) console.log("đúng " + label); };
const show = it => JSON.stringify(Object.fromEntries(Object.entries(it).filter(([k]) => !["t","askLog","askD"].includes(k))));

function run(text, mem){
  const cx = ctx(), r = P.parse(text, cx);
  return { cx, items:L.hoiLai(r.items, text, cx, mem || {}) };
}

/* 1. câu mẫu của từng nhánh */
L.HOILAI.forEach(b => (b.mau || []).forEach(([text, want, pick, after]) => {
  const { cx, items } = run(text);
  const it = items[0] || {};
  const got = items.map(x => x.ask).find(Boolean) || null;
  ok(got === want, "[" + b.id + "] " + JSON.stringify(text) + " → hỏi " + want, "hỏi " + got + " · " + items.map(show).join(" ; "));
  if(!pick || got !== want) return;
  const v = L.hoiLaiVe(it, cx);
  ok(v && v.hoi && v.chon.some(o => o.id === pick), "[" + b.id + "] có lựa chọn " + pick, v && JSON.stringify(v.chon.map(o => o.id)));
  const res = L.hoiLaiChon(it, pick, cx, text, {});
  ok(!!res, "[" + b.id + "] chọn " + pick);
  if(!res || !after) return;
  const errs = [];
  if(after.kind && it.kind !== after.kind) errs.push("kind " + it.kind);
  if(after.amt && it.amt !== after.amt) errs.push("amt " + it.amt);
  if(after.cat && it.cat !== after.cat) errs.push("cat " + it.cat);
  if(after.who && !String(it.who || "").includes(after.who)) errs.push("who " + it.who);
  if(after.loan && it.loanId !== after.loan) errs.push("loan " + it.loanId);
  if(after.card && it.cardId !== after.card) errs.push("card " + it.cardId);
  if(after.fx && it.fx !== after.fx) errs.push("fx " + it.fx);
  if(after.bo && !res.bo) errs.push("không bỏ");
  if(after.extra){ const x = res.them[0] || {}; if(x.kind !== after.extra.kind || x.amt !== after.extra.amt) errs.push("thêm " + show(x)); }
  if(it.ask && it.ask === b.id) errs.push("vẫn còn hỏi");
  ok(!errs.length, "[" + b.id + "] " + JSON.stringify(text) + " chọn " + pick + " → đúng", errs.join(", ") + " · " + show(it));
}));

/* 2. nhớ lựa chọn: lần sau câu cùng người không hỏi nữa, thẻ ghi "theo lần trước" */
{
  const a = run("chuyển Lan 500k").items[0], cx = ctx(), mem = {};
  const r = L.hoiLaiChon(a, "vay", cx, "chuyển Lan 500k", mem);
  ok(r.nho === "chuyen_di:lan", "nhớ theo người: khoá " + r.nho);
  mem[r.nho] = "vay";
  const b = run("chuyển Lan 1tr2", mem).items[0];
  ok(!b.ask && b.kind === "lend" && b.askLog && b.askLog[0].auto, "lần sau tự hiểu là cho vay", show(b));
  ok(L.hoiLaiNhan(b.askLog[0], cx) === "Cho Lan vay / ứng hộ", "chữ của lựa chọn cũ", L.hoiLaiNhan(b.askLog[0], cx));
  const c = run("chuyển Hùng 1tr2", mem).items[0];
  ok(c.ask === "chuyen_di", "người khác vẫn hỏi");
}

/* 3. trả lời bằng chữ */
[["chuyển Lan 500k", "cho nó vay", "vay"], ["chuyển Lan 500k", "biếu mẹ nó", "chi"], ["Lan chuyển 1tr", "nó cho mình vay", "vay"], ["Lan chuyển 1tr", "lì xì", "thu"],
 ["ăn lẩu 1tr chia 4", "mình trả trước", "truoc"], ["ăn lẩu 1tr chia 4", "mình bao", "bao"], ["ăn lẩu 1tr chia 4", "phần mình thôi", "phan"],
 ["mua xe máy 40", "40 triệu", "lon"], ["tiền nhà 4tr", "có", "co"], ["tiền nhà 4tr", "không, lần này thôi", "khong"], ["quẹt thẻ 500k", "TPBank", "c2"],
 ["trả hộ Lan 200k", "nó sẽ trả lại", "vay"], ["chuyển Lan 500k", "2", "vay"], ["rút 2tr", "tiền mặt", "mat"], ["chuyển Lan 500k", "hôm nay trời đẹp quá", null]
].forEach(([t, say, want]) => {
  const { cx, items } = run(t); const it = items.find(x => x.ask) || {};
  const got = L.hoiLaiNoi(say, it, cx);
  ok(got === want, "trả lời " + JSON.stringify(say) + " cho " + JSON.stringify(t) + " → " + want, "ra " + got);
});

/* 4. hỏi nối tiếp: số tiền xong mới hỏi định kỳ */
{
  const t = "học phí 15", { cx, items } = run(t), it = items[0];
  ok(it.ask === "so_tien", "nối tiếp: hỏi số tiền trước");
  L.hoiLaiChon(it, "lon", cx, t, {});
  ok(it.amt === 15000000 && it.ask === "dinh_ky", "nối tiếp: rồi hỏi định kỳ", show(it));
}

/* 5. câu đã nói rõ thì không hỏi, chia tiền "mình trả trước" tự thêm khoản cho vay */
{
  const { items } = run("ăn lẩu 1tr chia 4 mình trả trước");
  ok(items.length === 2 && items[0].amt === 250000 && items[1].kind === "lend" && items[1].amt === 750000 && !items.some(x => x.ask), "chia 4 trả trước → chi 250k + cho vay 750k", items.map(show).join(" ; "));
}

/* 6. không đụng vào khoản đã rõ trong các bài thử cũ */
let quiet = 0, tot = 0;
L.GHI.forEach(k => k.mau.forEach(([t]) => { const { items } = run(t); tot++; if(items.some(x => x.ask && x.ask !== "tra")) { quiet++; if(V) console.log("     hỏi lại: " + t + " → " + items.map(x => x.ask).join(",")); } }));
console.log("Câu mẫu GHI có hỏi lại: " + quiet + "/" + tot + " (để biết thẻ hỏi lại có làm phiền nhiều không)");

console.log("\n" + (n - bad) + "/" + n + " đúng. FAILED: " + bad);
process.exitCode = bad ? 1 : 0;
