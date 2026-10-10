/* Bài thử bộ đọc thông báo ngân hàng (parseNotif trong index.html).
   Chạy: node tests-notif.js   → phải ra "FAILED: 0".
   Mỗi mẫu: [tên, nội dung dán, danh sách giao dịch mong đợi]. Chỉ so các trường có ghi:
   amt, inc (true = tiền vào), day, time "HH:MM", sd, note (khớp một phần, không phân biệt hoa thường).
   Ngày trong mẫu tính tương đối theo hôm nay để bộ đọc không bỏ vì quá cũ. */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("  function vnAmount(raw)"), end = "    return out;\n  }";
const b = src.indexOf(end, a) + end.length;
const pad = n => String(n).padStart(2, "0");
const keyOf = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const parseNotif = new Function("pad", "keyOf", "todayKey", src.slice(a, b) + "\nreturn parseNotif;")(pad, keyOf, () => keyOf(new Date()));

const T = new Date(); T.setDate(T.getDate() - 1);            /* hôm qua, để mẫu không rơi vào "ngày tương lai" */
const P = new Date(T); P.setDate(P.getDate() - 1);           /* hôm kia */
const dmy = d => pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + String(d.getFullYear()).slice(2);
const dmY = d => pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear();
const D = dmy(T), DY = dmY(T), K = keyOf(T), PDM = pad(P.getDate()) + "/" + pad(P.getMonth() + 1);
const MB = (amt, time, sd, nd) => `TK 03xxx915|GD: ${amt}VND ${D} ${time}|SD: ${sd}VND|ND: ${nd}`;

const CASES = [
  /* ---- MB Bank (phím tắt nối mỗi thông báo một dòng) ---- */
  ["MB một thông báo", MB("-45,000", "08:12", "1,234,567", "MBCT THANH TOAN QR HIGHLANDS COFFEE D25H8MQF/89210"),
    [{ amt:45000, inc:false, day:K, time:"08:12", sd:1234567, note:"THANH TOAN QR HIGHLANDS COFFEE" }]],
  ["MB nhiều thông báo, có tiền vào", [MB("-45,000", "08:12", "1,234,567", "CAFE"), MB("+2,000,000", "09:00", "3,234,567", "NGUYEN VAN A chuyen tien"), MB("-120,000", "12:30", "3,114,567", "GRAB FOOD")].join("\n"),
    [{ amt:45000, inc:false, time:"08:12" }, { amt:2000000, inc:true, time:"09:00", sd:3234567 }, { amt:120000, inc:false, time:"12:30", note:"GRAB FOOD" }]],
  ["MB mỗi trường một dòng", `TK 03xxx915\nGD: -45,000VND ${D} 08:12\nSD: 1,234,567VND\nND: THANH TOAN QR HIGHLANDS`,
    [{ amt:45000, sd:1234567, note:"THANH TOAN QR HIGHLANDS" }]],
  ["MB dòng trống, CRLF", "\r\n" + MB("-45,000", "08:12", "1,234,567", "CAFE") + "\r\n\r\n" + MB("-60,000", "09:12", "1,174,567", "BANH MI") + "\r\n",
    [{ amt:45000, note:"CAFE" }, { amt:60000, note:"BANH MI", sd:1174567 }]],
  ["MB dòng có ngoặc kép (từ Sheet)", '"' + MB("-45,000", "08:12", "1,234,567", "CAFE") + '"',
    [{ amt:45000, note:"CAFE" }]],
  /* ---- v145: ND chỉ là ghi chú ---- */
  ["ND có số tiền không tách thành giao dịch mới", MB("-500,000", "08:12", "1,234,567", "tra tien an 500,000 cho Lan"),
    [{ amt:500000, note:"tra tien an 500,000 cho Lan" }]],
  ["ND có số tiền kiểu 150.000d", MB("-300,000", "08:12", "1,234,567", "dong tien 150.000d x2"),
    [{ amt:300000 }]],
  ["Ngày trong ND không đè ngày giao dịch", MB("-1,200,000", "08:12", "1,234,567", "TT hoa don dien " + PDM + " ky 1"),
    [{ amt:1200000, day:K, time:"08:12" }]],
  ["Giờ trong ND không đè giờ giao dịch", MB("-50,000", "08:12", "1,234,567", "an sang 07:30 pho"),
    [{ amt:50000, time:"08:12" }]],
  ["ND bị ngắt xuống dòng", MB("-45,000", "08:12", "1,234,567", "THANH TOAN QR") + "\nHIGHLANDS COFFEE",
    [{ amt:45000, note:"THANH TOAN QR HIGHLANDS COFFEE" }]],
  ["ND có dấu |", MB("-50,000", "08:12", "1,234,567", "an sang | pho bo"),
    [{ amt:50000, note:"pho bo" }]],
  ["Hai giao dịch giống nhau cùng phút (SD khác)", [MB("-45,000", "08:12", "1,000,000", "CAFE"), MB("-45,000", "08:12", "955,000", "CAFE")].join("\n"),
    [{ amt:45000, sd:1000000 }, { amt:45000, sd:955000 }]],
  /* ---- ngân hàng khác, viết thành câu ---- */
  ["Vietcombank", `Số dư TK VCB 0011000123456 -120,000 VND lúc ${DY.replace(/\//g, "-")} 12:30:11. Số dư 5,000,000 VND. Ref MBVCB.1234567.GRAB thanh toan`,
    [{ amt:120000, time:"12:30", sd:5000000 }]],
  ["Techcombank (ngày chỉ có trong ND)", `TK 1903xxxx4567\nSo tien GD: -250,000\nSo du: 10,500,000\nND: Thanh toan Shopee ${DY}`,
    [{ amt:250000, day:K, sd:10500000, note:"Thanh toan Shopee" }]],
  ["ACB (GD: là nội dung)", `ACB: TK 12345678(VND) - 99,000 luc ${D.slice(0, 5)} 14:20. So du 2,100,000. GD: CK DEN NGUYEN VAN B`,
    [{ amt:99000, sd:2100000, note:"CK DEN NGUYEN VAN B" }]],
  ["TPBank", `(TPBank): ${D};15:05\nTK: xxxx1234\nPS:-55.000VND\nSD: 900.000VND\nND: MOMO thanh toan`,
    [{ amt:55000, time:"15:05", sd:900000, note:"MOMO thanh toan" }]],
  ["VPBank", `VPBank: TK 1234xxx thay doi -1.500.000 VND luc ${DY} 16:00. SD: 20.000.000 VND. ND: chuyen tien hoc phi`,
    [{ amt:1500000, sd:20000000, note:"chuyen tien hoc phi" }]],
  ["BIDV (số dư cuối giữa câu)", `BIDV ${DY} 17:30\nTK 123xxxx456 tai BIDV -200,000VND. So du cuoi: 4,000,000VND. ND: TT dien`,
    [{ amt:200000, sd:4000000, note:"TT dien" }]],
  ["Nội dung giữa câu, dấu đ", `Tài khoản 0123 vừa giảm 30.000 đ vào ${DY} 19:00. Số dư hiện tại: 500.000 đ. Nội dung: an trua`,
    [{ amt:30000, sd:500000, note:"an trua" }]],
  ["Thẻ tín dụng", `The ****1234 giao dich -350,000VND tai CIRCLE K luc ${DY} 18:00. Han muc con lai 10,000,000VND`,
    [{ amt:350000, note:"CIRCLE K", sd:0 }]],
];

let fail = 0;
for(const [name, text, want] of CASES){
  const got = parseNotif(text, { credit:true });
  const errs = [];
  if(got.length !== want.length) errs.push("số giao dịch " + got.length + " ≠ " + want.length);
  want.forEach((w, i) => {
    const g = got[i]; if(!g) return;
    if(w.amt != null && g.amt !== w.amt) errs.push("#" + i + " amt " + g.amt);
    if(w.inc != null && !!g.inc !== w.inc) errs.push("#" + i + " inc " + !!g.inc);
    if(w.day && g.day !== w.day) errs.push("#" + i + " day " + g.day);
    if(w.time && pad(g.hm) + ":" + pad(g.mi) !== w.time) errs.push("#" + i + " time " + pad(g.hm) + ":" + pad(g.mi));
    if(w.sd != null && (g.sd || 0) !== w.sd) errs.push("#" + i + " sd " + g.sd);
    if(w.note && String(g.where).toLowerCase().indexOf(w.note.toLowerCase()) < 0) errs.push("#" + i + " note \"" + g.where + "\"");
  });
  if(errs.length){ fail++; console.log("✗ " + name + ": " + errs.join("; ")); }
  else console.log("✓ " + name);
}
console.log("\n" + CASES.length + " mẫu, FAILED: " + fail);
process.exit(fail ? 1 : 0);
