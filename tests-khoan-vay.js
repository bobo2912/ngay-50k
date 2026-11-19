/* Thử bộ hiểu khoản vay (doc-khoan-vay.js): node tests-khoan-vay.js
   Phần 1: câu chat. Phần 2: chữ bộ đọc chữ lấy ra từ ảnh chụp màn hình khoản vay (có lẫn lỗi). Số liệu là GIẢ. */
const V = require("./doc-khoan-vay.js");
let n = 0, fail = 0;
function chk(name, r, want){
  n++;
  if(want === null){ if(r !== null){ fail++; console.log("✗ " + name + ": lẽ ra không nhận, được " + JSON.stringify(r)); } return; }
  if(!r){ fail++; console.log("✗ " + name + ": không nhận ra"); return; }
  const bad = Object.keys(want).filter(k => r[k] !== want[k]);
  if(bad.length){ fail++; console.log("✗ " + name + ": " + bad.map(k => k + "=" + JSON.stringify(r[k]) + " (cần " + JSON.stringify(want[k]) + ")").join(", ")); }
}
const T = (s, want) => chk(s, V.textInfo(s, "2026-11-19"), want);
const P = (name, s, want) => chk(name, V.parse(s), want);

/* ---- câu chat ---- */
T("Tôi vay 20 triệu lãi 5.7%/năm", { rate:5.7, due:"", termM:0, bank:"" });
T("vay MB 20 triệu lãi 5,7%/năm hạn 17/8/2027", { rate:5.7, due:"2027-08-17", bank:"MB" });
T("vay ngân hàng 50tr lãi 1%/tháng trong 12 tháng", { rate:12, termM:12 });
T("cho Nam vay 5 triệu lãi 2%/tháng", { rate:24 });
T("cho Lan mượn 3tr lãi 0,8% một tháng", { rate:9.6 });
T("vay vcb 100tr lãi suất 7% hạn 30/6", { rate:7, due:"2027-06-30", bank:"Vietcombank" });
T("vay Techcombank 200tr thời hạn 2 năm", { termM:24, bank:"Techcombank", rate:0 });
T("vay anh Tuấn 5tr trả trước 31/12", { due:"2026-12-31", rate:0 });
T("giảm 10% vay 5tr", { rate:0 });
T("vay 30tr đáo hạn ngày 01/02/2027 lãi 9%", { rate:9, due:"2027-02-01" });

/* ---- ảnh: màn thấu chi, bộ đọc chữ tách cột nhãn / cột giá trị, đọc sai dấu ("thếu chỉ", "đóo hạn") ---- */
P("thấu chi, hai cột bị tách", `Tài khoản thếu chỉ

7157800001234
Thời điểm truy vấn
Ngày đăng ký
Ngày đóo hạn

Hạn mức tăng thêm
Số tiền lãi dự kiến

Tài khoản thu nợ

® Trong hạn

22:16:21 19/11/2026
17/08/2026
17/08/2027

18,125,016 VND
165,656 VND

9500100000001
NGUYEN VAN A

Đóng
khoản vay`, { product:"Thấu chi", amt:18125016, amtFrom:"limit", limit:18125016, start:"2026-08-17", due:"2027-08-17", intEst:165656, acct:"7157800001234", who:"Thấu chi ·1234" });
P("thấu chi, nhãn và giá trị cùng dòng, có hạn mức còn lại", `Tài khoản thấu chi
7157800001234
Hạn mức thấu chi 50,000,000 VND
Hạn mức còn lại 30,000,000 VND
Lãi suất 5.7%/năm
Ngày đăng ký 17/08/2026
Ngày đáo hạn 17/08/2027`, { amt:20000000, amtFrom:"used", limit:50000000, avail:30000000, rate:5.7, start:"2026-08-17", due:"2027-08-17" });
P("khoản vay tiêu dùng có dư nợ, giá trị dòng dưới", `Chi tiết khoản vay
Vay tiêu dùng VPBank
Số hợp đồng
LD2026001234
Số tiền giải ngân
30.000.000 đ
Dư nợ gốc hiện tại
24.500.000 đ
Lãi suất
18%/năm
Ngày giải ngân
05/03/2026
Ngày đáo hạn
05/03/2028
Kỳ trả tiếp theo 05/12/2026`, { product:"Vay tiêu dùng", bank:"VPBank", amt:30000000, paid:5500000, amtFrom:"used", rate:18, start:"2026-03-05", due:"2028-03-05", who:"VPBank · Vay tiêu dùng ·1234" });
P("vay mất dấu", `Thong tin khoan vay
Du no 12,000,000 VND
Lai suat 1%/thang
Ngay giai ngan 01/10/2026
Ngay dao han 01/10/2027`, { amt:12000000, rate:12, start:"2026-10-01", due:"2027-10-01", product:"Khoản vay" });

/* ---- không phải màn khoản vay ---- */
P("sao kê thẻ tín dụng", `Thẻ tín dụng Visa
Dư nợ hiện tại 5,200,000 VND
Thanh toán tối thiểu 260,000 VND
Ngày đến hạn 25/11/2026`, null);
P("sổ tiết kiệm", `Tiền gửi số tích lũy
217,996 VND
Kỳ hạn & lãi suất 12 tháng - 4.75%/năm
Ngày đáo hạn 12/10/2027`, null);
P("thông báo chuyển khoản", `TK 1234xxx567 -500,000 VND luc 19/11/2026 10:20. SD 2,100,000 VND. ND: an trua`, null);
P("chỉ có chữ trả nợ, không số liệu", `Trả nợ thành công`, null);

console.log(fail ? "✗ " + fail + " lỗi / " + n + " bài thử" : "✓ " + n + " bài thử");
process.exitCode = fail ? 1 : 0;
