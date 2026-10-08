/* Thử phần "máy trước, AI sau": câu nào máy tự xử lý, câu nào gửi cho AI.
   Chạy: node tests-assess-vi.js */
const P = require("./parse-vi.js");
const ctx = {
  now: new Date("2026-10-07T12:00:00"),
  cards: [{ id:"c1", name:"VIB" }, { id:"c2", name:"TCB" }],
  loans: [{ id:"l1", type:"lend", who:"Dũng" }, { id:"l2", type:"borrow", who:"Hào" }],
  tags: []
};
/* [câu, "may" | "ai"] */
const CASES = [
  ["trưa ăn phở 45k", "may"], ["cafe 30k", "may"], ["hôm qua đổ xăng 70k", "may"],
  ["grab 28k, trà sữa 35k", "may"], ["xôi 15k bánh mì 20k cafe 25k", "may"],
  ["nhận lương 15 triệu", "may"], ["mẹ cho 2 triệu", "may"], ["quẹt thẻ VIB 1tr2 mua giày", "may"],
  ["cho chú Dũng vay 500k", "may"], ["Dũng trả 200k", "may"], ["trả Hào 300k", "may"],
  ["tài khoản còn 5 triệu 8", "may"], ["trả thẻ 3 triệu", "may"], ["sửa xe 150k", "may"],
  ["hôm nay tiêu bao nhiêu?", "may"], ["ai còn nợ mình?", "may"], ["tháng này ăn uống bao nhiêu", "may"],
  ["hôm nay còn bao nhiêu?", "may"], ["số dư bao nhiêu", "may"],
  ["quẹt thẻ 500k mua áo", "ai"],                       /* có 2 thẻ, không biết thẻ nào */
  ["ăn lẩu 600k chia 4 người", "may"] /* v122: máy tự tính */, ["mua 3 ly trà sữa mỗi ly 35k", "may"],
  ["lúc nãy ghi nhầm phở 45k thành 54k", "ai"], ["sửa khoản cafe thành 25k", "ai"],
  ["trả góp điện thoại 1tr5 tháng này", "ai"], ["đi siêu thị hết 450k nhưng được giảm 10%", "may"],
  ["hôm qua với mấy đứa bạn đi ăn uống linh tinh tốn khoảng 200k gì đó rồi về nhà", "ai"],
  ["mua đồ ăn sáng cho cả nhà", "ai"], ["tuần sau có nên mua laptop không?", "ai"],
  ["tháng này so với tháng trước tiêu nhiều hơn không?", "may"], ["sao tháng này tiêu nhiều thế?", "may"] /* v122: báo cáo so với tháng trước, máy tự làm */,
  ["con trả tiền học 2tr", "ai"]
];
let fail = 0;
CASES.forEach(([t, want]) => {
  const a = P.assess(t, P.parse(t, ctx), ctx), got = a.local ? "may" : "ai";
  if(got !== want){ fail++; console.log("SAI  " + t + "  → " + got + " (mong " + want + ") " + a.why.join(",")); }
});
console.log((CASES.length - fail) + "/" + CASES.length + " đúng. FAILED: " + fail);
process.exitCode = fail ? 1 : 0;
