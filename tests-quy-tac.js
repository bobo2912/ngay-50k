/* Thử bộ quy tắc Thư viện nội dung (quy-tac.js): node tests-quy-tac.js
   Mọi tên, số tài khoản, số tiền dưới đây là GIẢ. */
const R = require("./quy-tac.js");
let fail = 0, n = 0;
const eq = (name, got, want) => { n++; if(JSON.stringify(got) !== JSON.stringify(want)){ fail++; console.log("✗ " + name + "\n   được: " + JSON.stringify(got) + "\n   cần:  " + JSON.stringify(want)); } };

/* bộ quy tắc mẫu, cùng kiểu với một thư viện thật hay gặp */
const rules = [
  { id:"1", k:"DEN:NGUYEN VAN AN", r:"Chuyển tiền bản thân" },
  { id:"2", k:"TU:NGUYEN VAN AN", r:"Chuyển tiền bản thân" },
  { id:"3", k:"TU:0123456789", r:"Chuyển tiền bản thân" },
  { id:"4", k:"^NGUYEN VAN AN CHUYEN TIEN", r:"Chuyển tiền bản thân" },
  { id:"5", k:"MBCT TRAN THI BINH CHUYEN TIEN", r:"{DEN}" },
  { id:"6", k:"CHUYEN TIEN LE LAM TRON", r:"Tiết kiệm tiền lẻ" },
  { id:"7", k:"QUAN BUN CHA HA NOI", r:"Ăn trưa bún chả" },
  { id:"8", k:"GS25", r:"GS25" },
  { id:"9", k:"WM+ HNI", r:"WinMart+" },
  { id:"10", k:"^ck", r:"Chuyển tiền" },
  { id:"11", k:"grab*food, shopeefood", r:"Đặt đồ ăn {TIEN}", tag:"an" },
  { id:"12", k:"DEN:LE VAN CUONG & TIEN:<100k", r:"Gửi xe" },
  { id:"13", k:"hoan tien$", r:"Hoàn tiền" },
  { id:"14", k:"taxi & -hoan", r:"Đi taxi" },
  { id:"15", k:"TIEN:+ & luong", r:"Lương" }
];
const L = {
  self: "TK 12xxx345|GD: -10,000VND 10/10/26 12:47 |SD: 1,000,000VND|DEN: NGUYEN VAN AN - 99887766001|ND: MBCT NGUYEN VAN AN chuyen tien D25I6DI7/129741",
  selfIn: "TK 12xxx345|GD: +10,000VND 10/10/26 12:49 |SD: 1,010,000VND|TU: NGUYEN VAN AN - 99887766001|ND: NGUYEN VAN AN chuyen tien I2J1SKFX/602564",
  shop: "TK 12xxx345|GD: -35,000VND 10/10/26 13:00 |SD: 975,000VND|DEN: TRAN THI BINH - 55554444|ND: MBCT TRAN THI BINH chuyen tien X1Y2Z3W4/111222",
  round: "TK 12xxx345|GD: -5,000VND 10/10/26 13:03 |SD: 970,000VND|ND: CHUYEN TIEN LE LAM TRON SAU GIAO DICH CHUYEN KHOAN VAO TAI KHOAN DANG GOM (TIET KIEM TIEN LE)",
  tap: "Thẻ 4xxx1234 Tại: GS25 VN0001 KHU A Số tiền: 25,000 VND lúc 10/10/26 08:10",
  ck: "TK 12xxx345|GD: -50,000VND 10/10/26 14:00 |SD: 920,000VND|ND: ck tien sach",
  ck2: "TK 12xxx345|GD: -50,000VND 10/10/26 14:00 |SD: 920,000VND|ND: tra tien ck cho ban",
  ckb: "TK 12xxx345|GD: -50,000VND 10/10/26 14:00 |SD: 920,000VND|ND: ckb tra no",
  grab: "TK 12xxx345|GD: -89,000VND 11/10/26 19:00 |SD: 831,000VND|ND: GRAB FOOD ORDER 5XK2PQ",
  park: "TK 12xxx345|GD: -5,000VND 11/10/26 07:30 |SD: 826,000VND|DEN: LE VAN CUONG - 777888|ND: MBCT LE VAN CUONG chuyen tien",
  park2: "TK 12xxx345|GD: -500,000VND 11/10/26 07:30 |SD: 326,000VND|DEN: LE VAN CUONG - 777888|ND: tien nha",
  refund: "TK 12xxx345|GD: +30,000VND 11/10/26 09:00 |SD: 356,000VND|ND: SHOP ABC hoan tien",
  taxi: "TK 12xxx345|GD: -60,000VND 11/10/26 10:00 |SD: 296,000VND|ND: taxi san bay",
  taxiR: "TK 12xxx345|GD: +60,000VND 11/10/26 10:00 |SD: 356,000VND|ND: taxi hoan lai",
  luong: "TK 12xxx345|GD: +9,000,000VND 05/10/26 10:00 |SD: 9,356,000VND|TU: CONG TY XYZ - 1234|ND: Tra luong thang 9",
  nothing: "TK 12xxx345|GD: -20,000VND 11/10/26 10:00 |SD: 1VND|ND: mua sach"
};
const note = k => R.apply(L[k], rules).note;
eq("chuyển cho chính mình (DEN)", note("self"), "Chuyển tiền bản thân");
eq("nhận từ chính mình (TU)", note("selfIn"), "Chuyển tiền bản thân");
eq("{DEN} lấy tên bỏ số TK", note("shop"), "TRAN THI BINH");
eq("tiền lẻ làm tròn", note("round"), "Tiết kiệm tiền lẻ");
eq("chạm thẻ Tại:", R.apply(L.tap, rules).line, "Thẻ 4xxx1234 Tại: GS25; Số tiền: 25,000 VND lúc 10/10/26 08:10");
eq("^ck đầu nội dung", note("ck"), "Chuyển tiền");
eq("^ck giữa câu không khớp", R.apply(L.ck2, rules).rule, null);
eq("^ck không khớp ckb", R.apply(L.ckb, rules).rule, null);
eq("* và dấu phẩy, {TIEN}, tag", [note("grab"), R.apply(L.grab, rules).tag], ["Đặt đồ ăn 89.000đ", "an"]);
eq("DEN & TIEN<100k khớp", note("park"), "Gửi xe");
eq("DEN & TIEN<100k không khớp 500k", R.apply(L.park2, rules).rule, null);
eq("$ kết thúc", note("refund"), "Hoàn tiền");
eq("loại trừ -hoan", [note("taxi"), R.apply(L.taxiR, rules).rule], ["Đi taxi", null]);
eq("TIEN:+ & luong", note("luong"), "Lương");
eq("không khớp giữ nguyên", R.apply(L.nothing, rules).line, L.nothing);
eq("applyText nhiều dòng", R.applyText([L.self, L.nothing, L.grab].join("\n"), rules).hits.length, 2);

/* ưu tiên: quy tắc theo người nhận xét trước quy tắc theo nội dung */
eq("ưu tiên DEN trước ND", R.apply(L.self, [{ k:"chuyen tien", r:"X" }, { k:"DEN:nguyen van an", r:"Y" }]).note, "Y");
eq("từ dài trước từ ngắn", R.apply(L.grab, [{ k:"grab", r:"A" }, { k:"grab food", r:"B" }]).note, "B");
eq("quy tắc tắt bỏ qua", R.apply(L.grab, [{ k:"grab", r:"A", off:true }]).rule, null);

/* đọc từ khoá */
eq("lỗi trường lạ", R.parse("ABC:x").ok, false);
eq("lỗi tiền", R.parse("TIEN:abc").ok, false);
eq("chỉ có loại trừ", R.parse("-grab").ok, false);
eq("TIEN khoảng", R.parse("TIEN:10k-50k").conds[0].money, { lo:10000, hi:50000 });
eq("TIEN 1,5tr", R.parse("TIEN:>=1,5tr").conds[0].money, { op:">=", v:1500000 });
eq("giải thích ^", R.explain("^ck").text, "Khớp khi nội dung bắt đầu bằng “ck”.");
eq("giải thích ghép", R.explain("DEN:le van cuong & TIEN:<100k & -hoan").text,
  "Khớp khi người nhận chứa “le van cuong”, và số tiền dưới 100.000đ, và nội dung KHÔNG chứa “hoan”.");

/* cảnh báo */
const lt = R.lint({ id:"x", k:"D25I6DI7/129741", r:"{ABC}" }, rules, [L.self]);
eq("cảnh báo mã giao dịch + chỗ điền lạ", lt.warn.length >= 2, true);
const sh = R.lint({ id:"y", k:"chuyen tien", r:"Chuyển" }, rules, [L.self, L.shop, L.nothing]);
eq("bị quy tắc khác xét trước", [sh.hits.length, sh.shadow.length], [0, 2]);

/* gợi ý */
const s1 = R.suggest(L.shop);
eq("gợi ý theo người nhận", s1[0].k, "DEN:TRAN THI BINH");
eq("gợi ý {DEN} khi nội dung mặc định", s1.some(x => x.r === "{DEN}"), true);
eq("gợi ý chạm thẻ", R.suggest(L.tap)[0].k, "GS25");
eq("gợi ý nội dung", R.suggest(L.grab)[0].k, "GRAB FOOD ORDER");

/* dán từ Google Sheet */
const tsv = "Từ khóa gốc\tNội dung chuẩn\nGS25\tGS25\n^ck\tChuyển tiền\nDEN:NGUYEN VAN AN\tChuyển tiền bản thân\n";
eq("dán bảng", R.parseTable(tsv), [{ k:"GS25", r:"GS25" }, { k:"^ck", r:"Chuyển tiền" }, { k:"DEN:NGUYEN VAN AN", r:"Chuyển tiền bản thân" }]);

console.log((fail ? "FAILED: " + fail : "FAILED: 0") + " / " + n + " bài thử");
process.exit(fail ? 1 : 0);
