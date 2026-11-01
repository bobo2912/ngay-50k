/* Thử bộ đọc ảnh sổ tiết kiệm (doc-so-tk.js): node tests-so-tk.js
   Chữ dưới đây mô phỏng chữ bộ đọc chữ lấy ra từ ảnh chụp màn hình app ngân hàng (có lẫn lỗi). Số liệu là GIẢ. */
const P = require("./doc-so-tk.js");
let n = 0, fail = 0;
function t(name, text, want){
  n++; const r = P.parse(text);
  if(want === null){ if(r !== null){ fail++; console.log("✗ " + name + ": lẽ ra không nhận, được " + JSON.stringify(r)); } return; }
  if(!r){ fail++; console.log("✗ " + name + ": không nhận ra"); return; }
  const bad = Object.keys(want).filter(k => r[k] !== want[k]);
  if(bad.length){ fail++; console.log("✗ " + name + ": " + bad.map(k => k + "=" + JSON.stringify(r[k]) + " (cần " + JSON.stringify(want[k]) + ")").join(", ")); }
}
t("tiền gửi số tích luỹ (màn kiểu app ngân hàng, số có dấu phẩy ngăn nghìn)", `2:47
< Thông tin tiền gửi số
Tiền gửi số tích lũy
217,996 VND
Số tài khoản tiền gửi 5526432594841
12/10/2026 12/10/2027
Đặt lịch gửi thêm tự động
Khoá chức năng tất toán online
Tăng cường bảo mật sổ tiết kiệm
Lịch sử Gửi thêm Tất toán
Thông tin tài khoản tiền gửi số
Kỳ hạn & lãi suất 12 tháng - 4.75%/năm
Hình thức đến hạn Quay vòng gốc và lãi
Lãi dự kiến hiện tại 330 VND
Lãi dự kiến cuối kỳ 10,117 VND
Số tiền phong toả 0 VND`, { kind:"save", amt:217996, rate:4.75, term:12, start:"2026-10-12", due:"2027-10-12", onDue:"renew", acct:"5526432594841", intEnd:10117, intNow:330, name:"Tiền gửi số tích lũy ·4841" });
t("cùng màn, chữ đọc mất dấu và số dư tách đơn vị", `Thong tin tien gui so
Tien gui so tich luy
217,996
VND
So tai khoan tien gui 5526432594841
12/10/2026 12/10/2027
Ky han & lai suat 12 thang - 4.75%/nam
Hinh thuc den han Quay vong goc va lai
Lai du kien hien tai 330 VND
Lai du kien cuoi ky 10,117 VND`, { amt:217996, rate:4.75, term:12, start:"2026-10-12", due:"2027-10-12", onDue:"renew" });
t("tên lẫn mảnh rác của biểu tượng bút chì", `Tiền gửi số tích lũy Z 2
217,996 VND
Số tài khoản tiền gửi 5526432594841
Kỳ hạn & lãi suất 12 tháng - 4.75%/năm
12/10/2026 12/10/2027`, { name:"Tiền gửi số tích lũy ·4841" });
t("sổ tiết kiệm có nhãn ngày gửi / đáo hạn, dấu chấm ngăn nghìn", `Chi tiết sổ tiết kiệm
Số tiền gửi 50.000.000 VND
Kỳ hạn 6 tháng
Lãi suất 5,2%/năm
Ngày gửi 15/09/2026
Ngày đáo hạn 15/03/2027
Hình thức đáo hạn Tất toán, trả gốc và lãi về tài khoản`, { kind:"save", amt:50000000, rate:5.2, term:6, start:"2026-09-15", due:"2027-03-15", onDue:"wallet" });
t("chứng chỉ tiền gửi, không ghi kỳ hạn → tính từ hai ngày", `Chứng chỉ tiền gửi
Mã số CCTG 00123456789
Số tiền 100.000.000 đ
Lãi suất 7,4 %/năm
Từ ngày 01/11/2026
Đến ngày 01/11/2027`, { kind:"cd", amt:100000000, rate:7.4, term:12, start:"2026-11-01", due:"2027-11-01", acct:"00123456789" });
t("không kỳ hạn", `Tiền gửi không kỳ hạn
Số dư 3.000.000 VND
Lãi suất 0,5%/năm`, { amt:3000000, rate:0.5, term:0 });
t("thông báo chuyển tiền thường không phải sổ", `MB Bank: TK 0123456789 -500,000VND luc 14:20 01/11/2026. SD: 4,500,000VND. ND: chuyen tien an trua`, null);
t("biên lai chuyển khoản có chữ tiết kiệm trong nội dung nhưng không có kỳ hạn / lãi suất", `Chuyển tiền thành công
Số tiền 2.000.000 VND
Nội dung: tiet kiem thang 11
01/11/2026 14:20`, null);
console.log(fail ? "✗ " + fail + " lỗi / " + n + " bài thử" : "✓ " + n + " bài thử");
process.exitCode = fail ? 1 : 0;
