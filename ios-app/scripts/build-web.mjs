// Tiêu Gọn iOS – chép mã web (thư mục gốc repo) vào ios-app/www để Capacitor đóng gói.
// Chạy: npm run web   (hoặc npm run sync để chép rồi đồng bộ sang dự án Xcode)
//
// Bản iOS dùng ĐÚNG các file web như bản GitHub Pages; khác biệt duy nhất nằm trong native.js,
// tự nhận ra đang chạy trong app (window.Capacitor) để dùng Face ID, thông báo, chia sẻ… của iOS.
// Thêm vào www: thư viện đọc chữ Tesseract + dữ liệu tiếng Việt/Anh, để app không tải code từ mạng
// (App Store không cho app tải code chạy sau khi đã duyệt).
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");             // ios-app/
const root = join(app, "..");             // gốc repo = mã web
const www = join(app, "www");
const nm = join(app, "node_modules");

const WEB_FILES = ["index.html", "manifest.webmanifest", "privacy.html", "sw.js",
  "lock.js", "native.js", "parse-vi.js", "thu-vien-cau.js", "quy-tac.js", "du-lieu.js"];
const WEB_DIRS = ["fonts", "icons"];

rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });
for (const f of WEB_FILES) {
  if (!existsSync(join(root, f))) throw new Error("Thiếu file web: " + f);
  cpSync(join(root, f), join(www, f));
}
for (const d of WEB_DIRS) cpSync(join(root, d), join(www, d), { recursive: true });

// Tesseract: thư viện, worker, lõi wasm (chỉ bản LSTM, app gọi createWorker(..., 1)), dữ liệu vie + eng.
const T = join(www, "tesseract");
mkdirSync(join(T, "core"), { recursive: true });
mkdirSync(join(T, "lang"), { recursive: true });
const need = p => { if (!existsSync(p)) throw new Error("Thiếu " + p + " – chạy npm install trong ios-app trước."); return p; };
cpSync(need(join(nm, "tesseract.js/dist/tesseract.min.js")), join(T, "tesseract.min.js"));
cpSync(need(join(nm, "tesseract.js/dist/worker.min.js")), join(T, "worker.min.js"));
for (const f of ["tesseract-core-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js"])
  cpSync(need(join(nm, "tesseract.js-core", f)), join(T, "core", f));
for (const l of ["vie", "eng"])
  cpSync(need(join(nm, "@tesseract.js-data", l, "4.0.0_best_int", l + ".traineddata.gz")), join(T, "lang", l + ".traineddata.gz"));

// Đánh dấu bản đóng gói (để kiểm tra nhanh trong Safari Web Inspector: window.__TG_BUILD)
writeFileSync(join(www, "build.json"), JSON.stringify({ builtAt: new Date().toISOString() }) + "\n");

const size = d => readdirSync(d).reduce((s, f) => { const p = join(d, f), st = statSync(p); return s + (st.isDirectory() ? size(p) : st.size); }, 0);
console.log("✓ Đã chép mã web vào ios-app/www (" + (size(www) / 1048576).toFixed(1) + " MB)");
