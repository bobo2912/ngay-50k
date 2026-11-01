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
  const T = fn => pg.evaluate(fn);
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

    ok("không có lỗi JavaScript", !errs.length, errs.slice(0, 5).join("\n   "));
  }catch(e){
    ok("chạy hết các bước", false, e && e.stack ? e.stack.split("\n").slice(0, 3).join("\n   ") : String(e));
  }
  await browser.close(); srv.close();
  console.log((fail ? "✗ " + fail + " lỗi / " : "✓ ") + n + " bài thử");
  process.exit(fail ? 1 : 0);
})();
