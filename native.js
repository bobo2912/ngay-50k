/* Tiêu Gọn – lớp nối với bản iOS đóng gói (thư mục ios-app/, Capacitor).

   Một bộ mã chạy ở hai nơi:
   - Bản web (GitHub Pages, Safari, Chrome): window.Capacitor không có → N50KNative.isApp = false,
     mọi hàm dưới đây không làm gì, app chạy y như trước.
   - Bản iOS: Capacitor gắn window.Capacitor trước khi trang chạy → dùng plugin TieuGon
     (ios-app/ios/App/App/TieuGonPlugin.swift) cho Face ID, thông báo, chia sẻ file, mở link,
     hàng đợi giao dịch từ Phím tắt và widget.

   Phải nạp TRƯỚC lock.js (lock.js hỏi N50KNative để dùng Face ID gốc). */
window.N50KNative = (function(){
  var C = window.Capacitor;
  var isApp = !!(C && typeof C.isNativePlatform === "function" && C.isNativePlatform());
  var P = null;
  if(isApp){
    try{ P = typeof C.registerPlugin === "function" ? C.registerPlugin("TieuGon") : null; }catch(e){ P = null; }
    if(!P && C.Plugins) P = C.Plugins.TieuGon || null;
    if(!P) isApp = false;                  /* thiếu plugin: chạy như bản web cho chắc */
  }
  var api = { isApp:isApp, platform:isApp ? "ios" : "web" };
  function log(where, e){ try{ if(window.__n50kLog) window.__n50kLog("iOS", (where + ": " + (e && (e.code || e.message) || e)).slice(0, 300)); }catch(x){} }

  if(isApp){
    document.documentElement.classList.add("native-app");
    /* Đọc chữ trong ảnh: thư viện và dữ liệu tiếng Việt/Anh nằm sẵn trong app (ios-app/scripts/build-web.mjs chép vào).
       corePath, langPath là đường dẫn tuyệt đối vì worker hiểu đường dẫn tương đối theo vị trí của nó. */
    var abs = function(p){ try{ return new URL(p, location.href).href; }catch(e){ return p; } };
    window.__OCR = { js:"tesseract/tesseract.min.js", opts:{ workerPath:abs("tesseract/worker.min.js"), corePath:abs("tesseract/core"), langPath:abs("tesseract/lang"), workerBlobURL:false, gzip:true } };
  }

  /* ---------- thông tin máy (Face ID hay Touch ID…) ---------- */
  var infoP = null;
  api.info = function(){
    if(!isApp) return Promise.resolve({ platform:"web", bio:"none" });
    if(!infoP) infoP = P.info().catch(function(e){ log("info", e); infoP = null; return { platform:"ios", bio:"none" }; });
    return infoP;
  };
  api.bioName = function(kind){ return kind === "touchID" ? "Touch ID" : kind === "opticID" ? "Optic ID" : "Face ID"; };

  /* ---------- Face ID: khoá dữ liệu (base64) cất trong Keychain, chỉ lấy ra sau khi xác thực ---------- */
  function err(e){
    var x = new Error(e && e.message || String(e || "lỗi"));
    var code = e && e.code;
    x.code = code;
    if(code === "cancel") x.name = "NotAllowedError";          /* lock.js coi như người dùng tự huỷ, không báo lỗi */
    else if(code === "nokey") x.name = "BioChanged";
    return x;
  }
  api.bioAvailable = function(){ return api.info().then(function(i){ return !!i && i.bio !== "none"; }); };
  api.bioSave = function(keyB64){ return P.bioSave({ key:keyB64 }).catch(function(e){ throw err(e); }); };
  api.bioLoad = function(reason){ return P.bioLoad({ reason:reason || "Mở khoá Tiêu Gọn" }).then(function(r){ return r.key; }, function(e){ throw err(e); }); };
  api.bioDelete = function(){ return isApp ? P.bioDelete().catch(function(e){ log("bioDelete", e); }) : Promise.resolve(); };

  /* ---------- thông báo trên máy ---------- */
  api.notifyState = function(){ return isApp ? P.notifyState().then(function(r){ return r.state; }, function(){ return "denied"; }) : Promise.resolve(null); };
  api.notifyAsk = function(){ return isApp ? P.notifyAsk().then(function(r){ return r.state; }, function(){ return "denied"; }) : Promise.resolve(null); };
  api.notify = function(title, body, id){
    if(!isApp) return Promise.resolve(false);
    return P.notify({ title:title, body:body || "", id:id || "" }).then(function(){ return true; }, function(e){ log("notify", e); return false; });
  };

  /* ---------- chia sẻ / lưu file (sao lưu JSON, CSV) bằng bảng chia sẻ của iOS ---------- */
  api.shareFile = function(name, text){
    if(!isApp) return Promise.reject(new Error("web"));
    return P.shareFile({ name:name, text:String(text) });
  };

  /* ---------- link ra ngoài: mở bằng Safari, không mở ngay trong khung app ---------- */
  api.openUrl = function(url){
    if(!isApp){ window.open(url, "_blank", "noopener"); return Promise.resolve(true); }
    return P.openUrl({ url:url }).then(function(r){ return r && r.opened; }, function(e){ log("openUrl", e); return false; });
  };
  if(isApp){
    document.addEventListener("click", function(e){
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if(!a || e.defaultPrevented) return;
      var href = a.getAttribute("href") || "";
      if(!/^(https?:|mailto:|tel:|shortcuts:)/i.test(href)) return;     /* link trong app (privacy.html, #…) giữ nguyên */
      try{ if(new URL(href, location.href).origin === location.origin) return; }catch(x){ return; }
      e.preventDefault();
      api.openUrl(a.href);
    }, true);
  }

  /* ---------- hàng đợi giao dịch từ Phím tắt (tác vụ "Ghi vào Tiêu Gọn") ---------- */
  api.queueTake = function(){
    if(!isApp) return Promise.resolve([]);
    return P.queueTake().then(function(r){ return (r && r.items) || []; }, function(e){ log("queueTake", e); return []; });
  };
  /* gọi cb() khi Phím tắt vừa gửi giao dịch lúc app đang mở */
  api.onQueue = function(cb){
    if(!isApp || typeof P.addListener !== "function") return;
    try{ P.addListener("queue", function(){ cb(); }); }catch(e){ log("onQueue", e); }
  };

  /* ---------- widget "Hôm nay còn được tiêu" ---------- */
  var wT = 0, wLast = "";
  api.widget = function(data){
    if(!isApp) return;
    clearTimeout(wT);
    wT = setTimeout(function(){
      var json = data ? JSON.stringify(data) : "";
      var same = data ? JSON.stringify(Object.assign({}, data, { updated:0 })) : "";
      if(same === wLast) return;                       /* số liệu không đổi thì khỏi bắt widget vẽ lại */
      wLast = same;
      (json ? P.widgetSet({ json:json }) : P.widgetClear()).catch(function(e){ wLast = ""; log("widget", e); });
    }, 400);
  };

  return api;
})();
