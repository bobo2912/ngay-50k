/* Tiêu Gọn – bài thử trên trình duyệt thật (v215): mở app ở cỡ iPhone, bấm qua các luồng chính.
   Chạy:  npm i --no-save playwright-core   (một lần)
          node tests-trinh-duyet.js           (tìm Chrome / Chromium sẵn trên máy; hoặc đặt CHROME=/đường/dẫn/chrome)
   Trang mở với ?test=1 để có lối vào window.__T (state, balCalc, persist, mergeStates). Không gửi gì ra mạng. */
const http = require("http"), fs = require("fs"), path = require("path");
let chromium;
try{ ({ chromium } = require("playwright-core")); }
catch(e){ console.log("Thiếu playwright-core. Chạy: npm i --no-save playwright-core"); process.exit(1); }

const ROOT = __dirname, PORT = 8790 + Math.floor(Math.random() * 100);
const TYPES = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".css":"text/css", ".json":"application/json", ".webmanifest":"application/manifest+json", ".png":"image/png", ".woff2":"font/woff2", ".svg":"image/svg+xml" };
const srv = http.createServer((q, r) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split("?")[0]));
  if(!p.startsWith(ROOT)){ r.writeHead(403); r.end(); return; }
  if(p.endsWith("/")) p += "index.html";
  fs.readFile(p, (e, d) => { if(e){ r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type":TYPES[path.extname(p)] || "application/octet-stream" }); r.end(d); });
});
function findChrome(){
  const c = [process.env.CHROME, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"];
  return c.find(x => x && fs.existsSync(x));
}

let n = 0, fail = 0;
const ok = (name, cond, extra) => { n++; console.log((cond ? "✓ " : "✗ ") + name + (!cond && extra ? "\n   " + extra : "")); if(!cond) fail++; };

(async () => {
  await new Promise(res => srv.listen(PORT, res));
  const exe = findChrome();
  const browser = await chromium.launch(Object.assign({ args:["--no-sandbox"] }, exe ? { executablePath:exe } : {}));
  const ctx = await browser.newContext({ viewport:{ width:375, height:740 }, deviceScaleFactor:2, serviceWorkers:"block" });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on("pageerror", e => errs.push(e.message));
  const URL = "http://localhost:" + PORT + "/index.html?test=1";
  const T = (fn, a) => pg.evaluate(fn, a);
  const tab = async name => { await pg.locator("nav button").filter({ hasText:name }).first().click(); await pg.waitForTimeout(400); };
  const say = async text => {
    await pg.locator("#chatIn").fill(text); await pg.locator("#chatIn").press("Enter"); await pg.waitForTimeout(700);
  };
  const lastCard = () => pg.locator(".pcard:not(.done):not(.skip)").last();
  const ghi = async () => { const b = lastCard().locator(".ok"); if(!(await b.count()) || !(await b.isEnabled())) return false; await b.click(); await pg.waitForTimeout(500); return true; };
  const today = () => T(() => (__T.state.days[__T.todayKey()] || []).length);
  const lastBot = () => pg.locator(".msg.bot").last().innerText();
  const bal = (w) => pg.evaluate(w => Math.round((__T.balCalc(null, w || "main") || {}).bal || 0), w);

  try{
    /* 1. mở app */
    await pg.goto(URL); await pg.waitForTimeout(1500);
    ok("mở app: màn hình chào hiện", await pg.getByText("Xem thử với dữ liệu mẫu").isVisible());
    await pg.getByText("Xem thử với dữ liệu mẫu").click(); await pg.waitForTimeout(1200);

    /* 2. bốn tab, không tràn ngang */
    for(const t of ["Chat", "Sổ", "Ví", "Tài sản"]){
      await tab(t);
      const over = await T(() => document.documentElement.scrollWidth - innerWidth);
      ok("tab " + t + ": vẽ được, không tràn ngang", over <= 0, "tràn " + over + "px");
    }

    /* 3. ghi chi bằng Chat, còn sau khi tải lại, hoàn tác */
    await tab("Chat");
    const d0 = await today();
    await say("ăn phở 45k");
    ok("Chat \"ăn phở 45k\": ghi được", await ghi());
    ok("khoản chi hôm nay +1", await today() === d0 + 1);
    await pg.locator(".pcard.done button").last().click(); await pg.waitForTimeout(500);
    ok("Hoàn tác trên thẻ đã ghi: khoản biến mất", await today() === d0);
    await ghi();
    await pg.reload(); await pg.waitForTimeout(1800);
    ok("tải lại trang: khoản vừa ghi vẫn còn", await today() === d0 + 1);
    await tab("Chat");

    /* 4. tiết kiệm & đầu tư bằng Chat (v211) */
    const d1 = await today(), b0 = await bal(), na0 = await T(() => __T.state.assets.length);
    await say("gửi tiết kiệm 50tr vcb 6 tháng 5,2%");
    ok("gửi tiết kiệm: thẻ Bỏ vào tích luỹ", (await lastCard().locator(".pk").inputValue()) === "asin");
    await ghi();
    const sv = await T(() => __T.state.assets.find(a => /Vietcombank/.test(a.name)));
    ok("gửi tiết kiệm: tạo sổ mới đủ lãi suất, kỳ hạn, đáo hạn", !!sv && sv.rate === 5.2 && sv.term === 6 && !!sv.due, JSON.stringify(sv));
    ok("gửi tiết kiệm: trừ ví 50tr", await bal() === b0 - 50000000);
    ok("gửi tiết kiệm: không thành khoản chi", await today() === d1);
    await pg.locator(".pcard.done button").last().click(); await pg.waitForTimeout(400);
    ok("hoàn tác gửi tiết kiệm: xoá sổ vừa tạo, trả lại ví", await T(() => __T.state.assets.length) === na0 && await bal() === b0);
    await say("gửi tiết kiệm 50tr vcb 6 tháng 5,2%"); await ghi();
    const gq0 = await T(() => (__T.state.assets.find(a => a.kind === "gold") || {}).qty || 0);
    await say("mua 1 chỉ vàng 8tr2"); await ghi();
    ok("mua 1 chỉ vàng: cộng 1 chỉ vào khoản vàng, không thành khoản chi", await T(() => __T.state.assets.find(a => a.kind === "gold").qty) === gq0 + 1 && await today() === d1);
    await say("vàng giờ 8tr5"); await ghi();
    const gv = await T(() => { const a = __T.state.assets.find(x => x.kind === "gold"); const v = __T.state.assetVal.filter(x => x.asset === a.id).pop(); return { v:v && v.v, qty:a.qty }; });
    ok("vàng giờ 8tr5: hiểu là giá 1 chỉ, tổng = giá × số chỉ", gv.v === 8500000 * gv.qty, JSON.stringify(gv));
    const b1 = await bal();
    await say("rút sổ vcb"); await ghi();
    const closed = await T(() => !!(__T.state.assets.find(a => /Vietcombank/.test(a.name)) || {}).closed);
    ok("rút sổ vcb: tất toán sổ, tiền về ví", closed && await bal() >= b1 + 50000000);
    await say("tài sản bao nhiêu");
    ok("hỏi tài sản: trả lời tài sản ròng", /Tài sản ròng/.test(await lastBot()));

    /* 5. khoản vay vào ví khác (v212) */
    const vb = await T(() => {
      const st = __T.state, k = __T.todayKey();
      if(!st.wallets.some(w => w.id === "wT")) st.wallets.push({ id:"wT", name:"Ví thử", kind:"bank", icon:"🏦" });
      st.bals.push({ id:"bT", w:"wT", amt:1000000, t:Date.now() - 60000 });
      const m0 = __T.balCalc(null, "main").bal;
      st.loans.push({ id:"LT", type:"borrow", who:"Thử", amt:2000000, date:k, t:Date.now() - 1000, w:"wT", payments:[], draws:[], prepaid:0 });
      __T.persist();
      return { m0, m1:__T.balCalc(null, "main").bal, w:__T.balCalc(null, "wT").bal };
    });
    ok("vay vào ví khác: cộng đúng ví đó, ví Tài khoản không đổi", vb.w === 3000000 && vb.m1 === vb.m0, JSON.stringify(vb));

    /* 6. gộp file cũ sau khi đổi ngày một khoản (v210) */
    const dup = await T(() => {
      const st = __T.state, k = __T.todayKey(), y = new Date(Date.now() - 86400000), yk = y.getFullYear() + "-" + String(y.getMonth() + 1).padStart(2, "0") + "-" + String(y.getDate()).padStart(2, "0");
      (st.days[k] = st.days[k] || []).push({ id:"MV1", amt:12345, cat:"an", note:"thử gộp", t:Date.now() });
      __T.persist();
      const old = JSON.parse(JSON.stringify(st));
      st.days[k] = st.days[k].filter(x => x.id !== "MV1"); (st.days[yk] = st.days[yk] || []).push({ id:"MV1", amt:12345, cat:"an", note:"thử gộp", t:Date.now() - 86400000 });
      __T.persist();
      return new Promise(res => setTimeout(() => {
        const m = __T.mergeStates(__T.state, old);
        res(Object.values(m.days).flat().filter(x => x.id === "MV1").length);
      }, 10));
    });
    ok("gộp với bản cũ sau khi đổi ngày: chỉ một khoản", dup === 1, "thấy " + dup);

    /* 7. báo cáo (v216): so với trung bình 3 tháng, báo cáo năm (đang ở tab Chat) */
    await say("tháng này so với trung bình 3 tháng");
    ok("Chat so tháng này với trung bình 3 tháng", /so với trung bình 3 tháng trước/i.test(await lastBot()), await lastBot());
    await say("báo cáo năm nay");
    ok("Chat báo cáo năm: chi, thu, từng tháng", /Năm \d{4}[^]*chi[^]*thu/.test(await lastBot()) && /Từng tháng/.test(await lastBot()), await lastBot());

    /* 8. giao diện v228: Nợ & cho vay tự mở ô có khoản, dòng ngày một hàng, dải ví ở đầu tab Ví */
    const tabJS = async name => { await T(n => [...document.querySelectorAll("nav button")].find(b => b.innerText.trim() === n).click(), name); await pg.waitForTimeout(500); };
    await tabJS("Tài sản");
    const lv = await T(() => { const p = document.querySelector('#loanSeg button[aria-pressed="true"]'); return { k:p && p.dataset.lv, n:document.querySelectorAll("#loanList > *:not(.empty)").length }; });
    ok("Nợ & cho vay: ô đang mở có khoản", lv.n > 0, JSON.stringify(lv));
    await tabJS("Ví");
    const vi = await T(() => {
      const h = [...document.querySelectorAll("#walFlow .day-head")].find(e => e.querySelector(".ds"));
      const r1 = h.querySelector(".dd").getBoundingClientRect(), r2 = h.querySelector(".ds").getBoundingClientRect();
      const strip = document.getElementById("wStrip"), head = document.querySelector("#wTabsBox .whead");
      return { row:Math.abs(r1.top - r2.top) < 8 && r2.left > r1.right, stripTop:strip.getBoundingClientRect().top < head.getBoundingClientRect().top };
    });
    ok("Ví: dòng ngày một hàng, tổng tiền bên phải", vi.row);
    ok("Ví: dải chọn ví nằm trên thẻ số dư", vi.stripTop);
    const act = await T(() => { const a = document.getElementById("whActs"); return !!a.closest(".wh-l") && [...a.children].some(b => /Cập nhật|Nhập số dư/.test(b.innerText)); });
    ok("Ví: nút Cập nhật nằm trong thẻ số dư", act);

    /* v230: lãi theo ngày: 100tr từ 01/08 + 2 × 100tr ngày 07/10, 7%/năm, tới 16/11/2026 = 3.586.301đ */
    await T(() => { __T.state.loans.push({ id:"laiT", type:"lend", who:"Thử lãi", amt:100000000, date:"2026-08-01", payments:[], prepaid:0, t:1, rate:7,
      draws:[{ id:"laiD1", amt:100000000, date:"2026-10-07", t:1 }, { id:"laiD2", amt:100000000, date:"2026-10-07", t:2 }] }); __T.persist(); });
    const li = await T(() => __T.loanInterest(__T.state.loans.find(x => x.id === "laiT"), "2026-11-16"));
    ok("lãi theo ngày khớp tính tay", li && li.total === 3586301 && li.parts.length === 3 && li.perDay === 57534, JSON.stringify(li && { t:li.total, d:li.perDay }));
    await T(() => { __T.state.loans = __T.state.loans.filter(x => x.id !== "laiT"); __T.persist(); });

    /* v231: ghi trả nợ có công tắc "Trừ vào số dư ví": tắt thì số dư không đổi (nw:1), bật thì trừ như cũ */
    await T(() => { __T.state.loans.push({ id:"nwT", type:"borrow", who:"Thử trừ ví", amt:5000000, date:"2026-01-05", payments:[], draws:[], prepaid:0, t:1 }); __T.persist(); });
    await pg.reload(); await pg.waitForTimeout(1800);
    await tab("Tài sản");
    await T(() => { const d = document.querySelector("details.lgrp-fam"); if(d) d.open = true; });   /* v242: khoản đi vay nằm trong nhóm thu gọn */
    await pg.waitForTimeout(200);
    await pg.getByText("Thử trừ ví").first().click(); await pg.waitForTimeout(500);
    const nb0 = await bal();
    await pg.getByRole("button", { name:"Ghi đã trả" }).click(); await pg.waitForTimeout(300);
    ok("form trả nợ có công tắc Trừ vào số dư ví", await pg.locator(".pNwRow").isVisible() && await pg.locator(".pNw").isChecked());
    await pg.locator(".pAmt").fill("1000000"); await pg.locator(".pNwRow").click(); await pg.waitForTimeout(200);
    ok("tắt công tắc: ẩn chọn ví, đổi gợi ý", !(await pg.locator(".pNw").isChecked()) && /không đổi/.test(await pg.locator(".pNwHint").innerText()));
    await pg.locator(".pSave").click(); await pg.waitForTimeout(400);
    const p1 = await T(() => __T.state.loans.find(x => x.id === "nwT").payments);
    ok("trả nợ không trừ ví: số dư giữ nguyên, ghi nw:1", p1.length === 1 && p1[0].nw === 1 && await bal() === nb0, JSON.stringify({ p1, nb0, b:await bal() }));
    await pg.getByRole("button", { name:"Ghi đã trả" }).click(); await pg.waitForTimeout(300);
    await pg.locator(".pAmt").fill("500000"); await pg.locator(".pSave").click(); await pg.waitForTimeout(400);
    ok("trả nợ để mặc định: trừ vào ví", await bal() === nb0 - 500000, (await bal()) + " vs " + nb0);
    await pg.locator(".rec").filter({ hasText:"500.000" }).locator(".rb-edit").click(); await pg.waitForTimeout(300);
    const eOn = await pg.locator(".eNw").count() && await pg.locator(".eNw").isChecked();
    await pg.locator(".eNwRow").click(); await pg.locator(".eSave").click(); await pg.waitForTimeout(400);
    ok("sửa trong lịch sử: tắt trừ ví được", eOn !== undefined && await bal() === nb0, (await bal()) + " vs " + nb0);
    await T(() => { __T.state.loans = __T.state.loans.filter(x => x.id !== "nwT"); __T.persist(); });

    /* v231: sổ tiết kiệm / đầu tư cũng có công tắc trừ vào ví */
    const ab0 = await bal();
    await T(() => document.getElementById("asAddSave").click()); await pg.waitForTimeout(500);
    await pg.locator("#asName").fill("Sổ thử ví"); await pg.locator("#asAmt").fill("2000000");
    ok("thêm sổ tiết kiệm: công tắc trừ ví bật sẵn", await pg.locator(".asNw").isChecked());
    await pg.locator(".asNwRow").click(); await pg.locator("#asSave").click(); await pg.waitForTimeout(500);
    const atx = await T(() => { const a = __T.state.assets.find(x => x.name === "Sổ thử ví"); return a && __T.state.assetTx.filter(x => x.asset === a.id); });
    ok("thêm sổ, tắt trừ ví: số dư giữ nguyên, không ghi ví", atx && atx.length === 1 && !atx[0].w && await bal() === ab0, JSON.stringify(atx));
    await pg.getByRole("button", { name:"Gửi thêm" }).click(); await pg.waitForTimeout(400);
    ok("gửi thêm: công tắc bật sẵn", await pg.locator(".asNw").isChecked());
    await pg.locator("#asAmt").fill("300000"); await pg.locator("#asSave").click(); await pg.waitForTimeout(500);
    ok("gửi thêm để bật: trừ vào ví", await bal() === ab0 - 300000, (await bal()) + " vs " + ab0);
    await T(() => { const a = __T.state.assets.find(x => x.name === "Sổ thử ví"); __T.state.assets = __T.state.assets.filter(x => x !== a); __T.state.assetTx = __T.state.assetTx.filter(x => x.asset !== a.id); __T.persist(); });

    await pg.locator(".msg.bot").last().screenshot({ path:process.env.SHOT || "/dev/null" }).catch(() => {});
    /* v232: khoản vay trong Chat có lãi suất / hạn trả; ảnh chụp màn hình thấu chi → thẻ Đi vay điền sẵn */
    await pg.goto(URL); await pg.waitForTimeout(1500); await tab("Chat");
    await say("Tôi vay 20 triệu lãi 5.7%/năm");
    ok("vay có lãi: thẻ điền sẵn lãi 5,7", (await lastCard().locator(".prt").inputValue()) === "5,7");
    ok("vay có lãi: có dòng ước tính lãi", /Lãi ≈/.test(await lastCard().locator(".pli").innerText()));
    ok("vay chưa tên: có nút gợi ý tên", (await lastCard().locator(".pwho").count()) > 0);
    await lastCard().locator(".pwho").filter({ hasText:"Ngân hàng" }).click(); await pg.waitForTimeout(300);
    ok("chạm tên gợi ý: điền vào ô tên", (await lastCard().locator(".pw").inputValue()) === "Ngân hàng");
    await say("hạn 17/8/2027");
    ok("nhắn hạn trả sau: điền vào thẻ", (await lastCard().locator(".pdu").inputValue()) === "2027-08-17");
    await ghi();
    const vl = await T(() => Object.assign({ today:__T.todayKey() }, __T.state.loans.filter(l => l.who === "Ngân hàng").pop()));
    ok("ghi vay: lưu lãi suất, hạn trả, ngày vay hôm nay", vl && vl.rate === 5.7 && vl.due === "2027-08-17" && vl.amt === 20000000 && vl.date === vl.today, JSON.stringify(vl));
    await say("vay MB 30 triệu lãi 1%/tháng hạn 1/3/2027");
    ok("vay MB lãi theo tháng: 12%/năm, tên MB, hạn đúng, ngày vay không bị lấy theo hạn",
      (await lastCard().locator(".prt").inputValue()) === "12" && (await lastCard().locator(".pw").inputValue()) === "MB" && (await lastCard().locator(".pdu").inputValue()) === "2027-03-01" && (await lastCard().locator(".pd").inputValue()) === await T(() => __T.todayKey()));
    await lastCard().locator(".no").click(); await pg.waitForTimeout(300);
    /* ảnh: thay bộ đọc chữ bằng chữ đã đọc sẵn từ một ảnh thật (số liệu đã đổi) */
    await T(txt => { window.__OCR = { raw:true }; window.Tesseract = { createWorker: async () => ({ recognize: async () => ({ data:{ text:txt } }), terminate: async () => {} }) }; }, `Tài khoản thếu chỉ

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
khoản vay`);
    await pg.locator("#chatIn").fill("lãi 5,7%");
    await pg.locator("#chatImg").setInputFiles({ name:"vay.png", mimeType:"image/png", buffer:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64") });
    await pg.waitForTimeout(2500);
    const ic = lastCard();
    ok("ảnh thấu chi: ra thẻ Đi vay", (await ic.locator(".pk").inputValue()) === "borrow", await lastBot());
    ok("ảnh thấu chi: tên, số tiền, ngày vay, hạn trả, lãi từ chữ gõ kèm",
      (await ic.locator(".pw").inputValue()) === "Thấu chi ·1234" && (await ic.locator(".pa").inputValue()).replace(/\D/g, "") === "18125016"
      && (await ic.locator(".pd").inputValue()) === "2026-08-17" && (await ic.locator(".pdu").inputValue()) === "2027-08-17" && (await ic.locator(".prt").inputValue()) === "5,7");
    ok("ảnh thấu chi: báo số tiền lấy theo hạn mức", /hạn mức/.test(await ic.innerText()));
    await ic.locator(".pa").fill("20000000"); await ghi();
    const il = await T(() => __T.state.loans.find(l => l.acct === "7157800001234"));
    ok("ghi khoản từ ảnh: lưu số tài khoản, ghi chú, lãi", il && il.amt === 20000000 && il.rate === 5.7 && il.date === "2026-08-17" && il.due === "2027-08-17" && /Lãi dự kiến 165\.656đ/.test(il.note), JSON.stringify(il));

    /* v242: Đi vay chia nhóm, Phải trả tháng này, tên gợi nhớ */
    await T(() => { const S = __T.state, ym = __T.todayKey().slice(0, 7);
      S.loans.push({ id:"t242a", type:"borrow", who:"LD9990001", amt:12000000, date:"2026-01-05", per:1000000, day:5, payments:[{ id:"t242p", amt:1000000, date:ym + "-05" }], t:1 });
      S.loans.push({ id:"t242b", type:"borrow", who:"Chị Hoa", amt:3000000, date:"2026-01-05", due:ym + "-01", payments:[], t:2 });
      __T.persist(true); });
    await tab("Tài sản");
    await pg.locator("#loanSeg button").filter({ hasText:"Đi vay" }).click(); await pg.waitForTimeout(300);
    ok("Đi vay: có khung Phải trả tháng này", await pg.locator(".lplan").count() === 1);
    ok("Phải trả: khoản ngân hàng đã trả kỳ này có dấu ✓", await pg.locator(".lplan .lp.done").filter({ hasText:"LD9990001" }).count() === 1);
    ok("Phải trả: khoản người thân quá hạn báo đỏ", await pg.locator(".lplan .lp.late").filter({ hasText:"Chị Hoa" }).count() === 1);
    ok("Đi vay: chia nhóm Vay ngân hàng / Người thân", await pg.locator("details.lgrp-bank").count() === 1 && await pg.locator("details.lgrp-fam").count() === 1);
    ok("nhóm mặc định thu gọn", !(await pg.locator("details.lgrp-bank").evaluate(e => e.open)));
    await pg.locator("details.lgrp-bank summary").click(); await pg.waitForTimeout(200);
    await pg.locator("details.lgrp-bank .loan").filter({ hasText:"LD9990001" }).click(); await pg.waitForTimeout(400);
    await pg.locator("#loanDetail button").filter({ hasText:"Sửa" }).first().click(); await pg.waitForTimeout(300);
    await pg.locator("#lNick").fill("Vay sửa nhà"); await pg.locator("#saveLoan").click(); await pg.waitForTimeout(400);
    ok("tên gợi nhớ: lưu và hiện ở chi tiết", await T(() => __T.state.loans.find(l => l.id === "t242a").nick) === "Vay sửa nhà" && /Vay sửa nhà/.test(await pg.locator("#loanDetail h2").first().innerText()));
    await pg.locator("#loanDetail .back").click(); await pg.waitForTimeout(400);
    ok("tên gợi nhớ: thẻ khoản vay hiện tên mới, mã ở dòng phụ", await pg.locator("details.lgrp-bank .loan").filter({ hasText:"Vay sửa nhà" }).filter({ hasText:"LD9990001" }).count() === 1);
    ok("nhóm mở được nhớ lại sau khi vẽ lại", await pg.locator("details.lgrp-bank").evaluate(e => e.open));

    ok("không có lỗi JavaScript", !errs.length, errs.slice(0, 5).join("\n   "));
  }catch(e){
    ok("chạy hết các bước", false, e && e.stack ? e.stack.split("\n").slice(0, 3).join("\n   ") : String(e));
  }
  await browser.close(); srv.close();
  console.log((fail ? "✗ " + fail + " lỗi / " : "✓ ") + n + " bài thử");
  process.exit(fail ? 1 : 0);
})();
