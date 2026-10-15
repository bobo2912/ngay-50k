// Tiêu Gọn – trạm trung chuyển thông báo ngân hàng trên Cloudflare (thay Google Sheet từ app v158).
//
// Phím tắt trên iPhone gửi (POST) nội dung thông báo → Worker giữ TẠM trong một Durable Object
// → app lấy về (GET, hoặc được đẩy thẳng qua WebSocket khi app đang mở) → app báo đã nhận → xoá ngay.
//
// Không lưu trữ:
//   • Thông báo chỉ nằm ở đây trong lúc chờ app lấy. App báo nhận là xoá. Không ai lấy thì tự xoá sau 3 ngày.
//   • Không ghi nhật ký nội dung (không console.log nội dung, tắt observability trong wrangler.jsonc).
//   • Để bỏ dòng trùng khi phím tắt gửi lại, chỉ giữ dấu băm SHA-256 (16 ký tự đầu) của từng dòng trong 3 ngày,
//     không giữ nội dung.
//   • Không có thư viện nội dung (ThuVien): việc làm gọn nội dung chạy trong app, trên máy của bạn.
//
// Mã bí mật: lấy từ biến môi trường SECRET nếu có đặt; không thì mã gửi kèm lần bấm "Kiểm tra" đầu tiên trong app
// (GET có claim=1) được ghi nhớ. Từ trạm bản 2: yêu cầu khác (phím tắt, người lạ dò địa chỉ) không nhận chủ được.
//
// Giao thức (giống Apps Script bản mã 4 để phím tắt cũ chỉ cần đổi URL):
//   POST /            body JSON { k, t }   → "TG_OK" | "TG_KEY" | "ERR …"
//   GET  /?k=&since=  → { ok, v:5, wv, items:[{at,t}], more }   (claim=1: lần đầu thì nhận chủ)   (đồng thời xoá mọi giao dịch có at ≤ since: app đã nhận)
//   GET  /ws?k=       → WebSocket: server gửi {items:[…]}; app gửi {ack:at} để xoá tới mốc đó;
//                       app gửi {"ping":1} định kỳ, Cloudflare tự trả {"pong":1} mà không đánh thức trạm (không tốn lượt)
//   POST /forget      body JSON { k }      → xoá sạch hàng đợi và dấu băm (nút "Xoá hết trên Cloudflare" trong app)

import { DurableObject } from "cloudflare:workers";

const WV = 2;                   // phiên bản trạm; app nhắc cập nhật khi trạm cũ hơn
const KEEP_MS = 3 * 86400000;   // giữ tối đa 3 ngày nếu app không lấy
const PAGE = 300;
const MAX_BODY = 200000;        // ~200 KB, đủ cho vài trăm thông báo

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const text = (t, s = 200) => new Response(t, { status: s, headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const u = new URL(req.url);
    if (u.pathname === "/favicon.ico") return new Response(null, { status: 404 });
    // Một hàng đợi duy nhất cho mỗi lần triển khai (mỗi người tự triển khai Worker của mình).
    // RELAY: cấu hình trong kho này. MY_DURABLE_OBJECT: mẫu "Hello World Durable Object" của Cloudflare (dán đè mã vào mẫu đó).
    const ns = env.RELAY || env.MY_DURABLE_OBJECT;
    if (!ns) return text("Thiếu Durable Object binding (RELAY hoặc MY_DURABLE_OBJECT)", 500);
    const stub = ns.get(ns.idFromName("tieugon"));
    return stub.fetch(req);
  },
};

async function hash16(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b).slice(0, 8)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function safeEq(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export class Relay extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
    this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS q (at INTEGER PRIMARY KEY, t TEXT NOT NULL)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS seen (h TEXT PRIMARY KEY, ts INTEGER NOT NULL)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)");
    // Nhịp giữ kết nối của app: Cloudflare tự trả lời, trạm đang ngủ đông không bị đánh thức.
    try { ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"ping":1}', '{"pong":1}')); } catch (e) {}
  }

  get(k) { const r = this.sql.exec("SELECT v FROM kv WHERE k = ?", k).toArray(); return r.length ? r[0].v : null; }
  put(k, v) { this.sql.exec("INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v", k, String(v)); }

  keyOk(k, claim) {
    k = String(k == null ? "" : k).trim();
    if (!k || k.length > 200) return false;
    const env = String(this.env.SECRET || "").trim();
    if (env) return safeEq(k, env);
    const saved = this.get("secret");
    if (saved) return safeEq(k, saved);
    if (!claim || k.length < 8) return false;   // chỉ nút Kiểm tra trong app mới nhận chủ, mã đủ dài
    this.put("secret", k);
    return true;
  }

  pending(since) {
    return this.sql.exec("SELECT at, t FROM q WHERE at > ? ORDER BY at LIMIT ?", Number(since) || 0, PAGE + 1).toArray();
  }
  ack(at) {
    at = Number(at) || 0;
    if (at > 0) this.sql.exec("DELETE FROM q WHERE at <= ?", at);
  }
  async arm() {
    if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + KEEP_MS);
  }

  async fetch(req) {
    const u = new URL(req.url);

    // WebSocket cho app đang mở: thông báo tới là đẩy thẳng sang, không phải hỏi lại.
    if (u.pathname === "/ws") {
      if (req.headers.get("Upgrade") !== "websocket") return text("Cần WebSocket", 426);
      if (!this.keyOk(u.searchParams.get("k"))) return text("TG_KEY", 403);
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      const items = this.pending(0).slice(0, PAGE);
      if (items.length) pair[1].send(JSON.stringify({ items }));
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    if (req.method === "POST") {
      let raw = "";
      try { raw = await req.text(); } catch (e) { return text("ERR đọc dữ liệu"); }
      if (raw.length > MAX_BODY) return text("ERR quá lớn");
      let d = {};
      try { d = JSON.parse(raw); } catch (e) {
        d = Object.fromEntries(new URLSearchParams(raw));
      }
      if (!d || typeof d !== "object") d = {};
      if (!this.keyOk(d.k)) return text("TG_KEY");          // sai mã: phím tắt giữ nguyên tệp

      if (u.pathname === "/forget") {
        this.sql.exec("DELETE FROM q"); this.sql.exec("DELETE FROM seen");
        await this.ctx.storage.deleteAlarm();
        return text("TG_OK");
      }

      const lines = String(d.t || "").split(/\r?\n/).map(x => x.trim()).filter(Boolean);
      if (!lines.length) return text("TG_OK");
      const now = Date.now();
      let at = Math.max(now, Number(this.get("lastAt")) + 1 || 0);
      const add = [];
      for (const x of lines) {
        const h = await hash16(x);
        if (this.sql.exec("SELECT 1 FROM seen WHERE h = ?", h).toArray().length) continue;   // phím tắt gửi lại cả tệp
        this.sql.exec("INSERT INTO seen (h, ts) VALUES (?, ?)", h, now);
        this.sql.exec("INSERT INTO q (at, t) VALUES (?, ?)", at, x);
        add.push({ at, t: x });
        at++;
      }
      if (!add.length) return text("TG_OK");
      this.put("lastAt", at - 1);
      await this.arm();
      const msg = JSON.stringify({ items: add });
      for (const ws of this.ctx.getWebSockets()) { try { ws.send(msg); } catch (e) {} }
      return text("TG_OK");
    }

    if (req.method === "GET") {
      if (!this.keyOk(u.searchParams.get("k"), u.searchParams.get("claim") === "1"))
        return json({ ok: false, err: this.env.SECRET || this.get("secret") ? "key" : "unclaimed", wv: WV });
      const since = Number(u.searchParams.get("since")) || 0;
      this.ack(since);                                     // mọi giao dịch tới mốc since app đã nhận → xoá
      if (u.searchParams.get("ack")) return json({ ok: true, v: 5, wv: WV });
      const rows = this.pending(since);
      return json({ ok: true, v: 5, wv: WV, items: rows.slice(0, PAGE), more: rows.length > PAGE, ws: true });
    }

    return text("Phương thức không hỗ trợ", 405);
  }

  async webSocketMessage(ws, m) {
    let d = null;
    try { d = JSON.parse(typeof m === "string" ? m : new TextDecoder().decode(m)); } catch (e) { return; }
    if (d && d.ack) this.ack(d.ack);
    if (d && d.ping) { try { ws.send('{"pong":1}'); } catch (e) {} }
  }
  async webSocketClose(ws, code) { try { ws.close(code === 1005 ? 1000 : code, "bye"); } catch (e) {} }
  async webSocketError() {}

  // Dọn định kỳ: giao dịch không ai lấy quá 3 ngày và dấu băm cũ.
  async alarm() {
    const cut = Date.now() - KEEP_MS;
    this.sql.exec("DELETE FROM q WHERE at < ?", cut);
    this.sql.exec("DELETE FROM seen WHERE ts < ?", cut);
    const left = this.sql.exec("SELECT (SELECT COUNT(*) FROM q) + (SELECT COUNT(*) FROM seen) AS n").one().n;
    if (left) await this.ctx.storage.setAlarm(Date.now() + 6 * 3600000);
  }
}

// Tên lớp của mẫu Cloudflare "Hello World Durable Object": dán file này đè lên src/index.ts của mẫu là chạy, không phải sửa cấu hình.
export { Relay as MyDurableObject };
