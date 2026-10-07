/* Tiêu Gọn – khoá app bằng mã PIN và mã hoá dữ liệu trên máy.

   Cách hoạt động
   - Dữ liệu được mã hoá bằng một khoá dữ liệu ngẫu nhiên (AES-GCM 256 bit).
   - Khoá dữ liệu được "bọc" bằng khoá sinh ra từ mã PIN (PBKDF2-SHA256, 600.000 vòng).
     Đổi mã PIN chỉ cần bọc lại, không phải mã hoá lại toàn bộ dữ liệu.
   - Mở bằng Face ID: một passkey trên máy có tiện ích PRF trả về 32 byte bí mật mỗi lần
     xác thực; khoá dữ liệu được bọc thêm một bản bằng bí mật đó. Máy không hỗ trợ PRF thì
     không bật được, vì mở bằng Face ID mà không có bí mật thật thì chỉ là khoá cửa giả.
   - Thông tin mở khoá (muối, bản bọc) nằm ở khoá "ngay50k:lock", không mã hoá; không chứa mã PIN.

   Mã PIN 4–6 số chống người khác cầm máy mở app. Ai lấy được bản sao bộ nhớ trình duyệt
   và có máy tính mạnh vẫn có thể dò mã PIN, nên file sao lưu dùng mật khẩu riêng, dài hơn. */
window.N50KLock = (function(){
  var LOCK_KEY = "ngay50k:lock", ITER = 600000, ENC = "enc1:";
  var meta = null, dek = null, dekRaw = null, unlocked = false, hiddenAt = 0, ui = null;
  var te = new TextEncoder(), td = new TextDecoder();
  var C = window.crypto && window.crypto.subtle;

  /* ---------- tiện ích ---------- */
  function rand(n){ var a = new Uint8Array(n); crypto.getRandomValues(a); return a; }
  function b64(u8){
    u8 = u8 instanceof Uint8Array ? u8 : new Uint8Array(u8);
    var s = "", CH = 0x8000;
    for(var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    return btoa(s);
  }
  function unb64(s){ var b = atob(String(s || "")), u = new Uint8Array(b.length); for(var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function readMeta(){ try{ var m = JSON.parse(N50K.get(LOCK_KEY) || "null"); return m && m.v === 1 && m.wp ? m : null; }catch(e){ return null; } }
  function saveMeta(){ if(meta) N50K.set(LOCK_KEY, JSON.stringify(meta)); else N50K.del(LOCK_KEY); }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

  async function pinKey(pin, salt, iter){
    var base = await C.importKey("raw", te.encode(String(pin)), "PBKDF2", false, ["deriveKey"]);
    return C.deriveKey({ name:"PBKDF2", hash:"SHA-256", salt:salt, iterations:iter }, base, { name:"AES-GCM", length:256 }, false, ["encrypt","decrypt"]);
  }
  async function prfKey(secret){
    var base = await C.importKey("raw", secret, "HKDF", false, ["deriveKey"]);
    return C.deriveKey({ name:"HKDF", hash:"SHA-256", salt:new Uint8Array(32), info:te.encode("ngay50k-passkey") }, base, { name:"AES-GCM", length:256 }, false, ["encrypt","decrypt"]);
  }
  async function wrap(kek, raw){ var iv = rand(12); var ct = await C.encrypt({ name:"AES-GCM", iv:iv }, kek, raw); return { iv:b64(iv), ct:b64(ct) }; }
  async function unwrap(kek, w){ return new Uint8Array(await C.decrypt({ name:"AES-GCM", iv:unb64(w.iv) }, kek, unb64(w.ct))); }
  async function useDek(raw){
    dekRaw = raw;
    dek = await C.importKey("raw", raw, { name:"AES-GCM" }, false, ["encrypt","decrypt"]);
    return codec();
  }
  function codec(){
    var key = dek;
    return {
      enc: async function(str){ var iv = rand(12); var ct = await C.encrypt({ name:"AES-GCM", iv:iv }, key, te.encode(str)); return ENC + b64(iv) + ":" + b64(ct); },
      dec: async function(str){ var p = String(str).slice(ENC.length).split(":"); return td.decode(await C.decrypt({ name:"AES-GCM", iv:unb64(p[0]) }, key, unb64(p[1]))); }
    };
  }

  /* ---------- chặn đoán mò: sai 5 lần thì phải chờ, mỗi lần sai thêm chờ gấp đôi ---------- */
  function waitLeft(){ return meta && meta.until ? Math.max(0, meta.until - Date.now()) : 0; }
  function noteFail(){
    meta.fails = (meta.fails || 0) + 1;
    if(meta.fails >= 5) meta.until = Date.now() + Math.min(15 * 60000, 30000 * Math.pow(2, meta.fails - 5));
    saveMeta();
  }
  function noteOk(){ if(meta.fails || meta.until){ meta.fails = 0; meta.until = 0; saveMeta(); } }

  async function tryPin(pin){
    var kek = await pinKey(pin, unb64(meta.salt), meta.iter || ITER);
    try{ return await unwrap(kek, meta.wp); }catch(e){ return null; }
  }

  /* ---------- passkey + PRF (Face ID) ---------- */
  function pkAvailable(){
    if(!(window.PublicKeyCredential && navigator.credentials && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable)) return Promise.resolve(false);
    return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(function(){ return false; });
  }
  async function pkSecret(idB64, saltB64){
    var cred = await navigator.credentials.get({ publicKey:{
      challenge:rand(32), timeout:60000, userVerification:"required",
      allowCredentials:[{ type:"public-key", id:unb64(idB64) }],
      extensions:{ prf:{ eval:{ first:unb64(saltB64) } } }
    }});
    var r = cred && cred.getClientExtensionResults ? cred.getClientExtensionResults() : {};
    var first = r && r.prf && r.prf.results && r.prf.results.first;
    if(!first) throw new Error("noprf");
    return new Uint8Array(first);
  }
  async function pkUnlock(){
    if(!meta || !meta.pk) throw new Error("nopk");
    var secret = await pkSecret(meta.pk.id, meta.pk.salt);
    return unwrap(await prfKey(secret), meta.pk.wp);
  }

  /* ---------- màn hình khoá ---------- */
  var KEYPAD = ["1","2","3","4","5","6","7","8","9","bio","0","del"];
  function build(){
    if(ui) return ui;
    var el = document.createElement("div");
    el.className = "lock"; el.id = "lockScr"; el.hidden = true;
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "lockTitle");
    el.innerHTML =
      '<div class="lock-in">' +
        '<img class="lock-icon" src="icons/icon-192.png" alt="" width="64" height="64">' +
        '<h2 id="lockTitle" tabindex="-1">Nhập mã PIN</h2>' +
        '<p class="lock-sub" id="lockSub"></p>' +
        '<div class="lock-dots" id="lockDots" aria-hidden="true"></div>' +
        '<p class="lock-err" id="lockErr" role="alert"></p>' +
        '<div class="lock-pad" id="lockPad">' + KEYPAD.map(function(k){
          if(k === "bio") return '<button type="button" class="lk lk-bio" data-k="bio" aria-label="Mở bằng Face ID"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M9 9v1.5M15 9v1.5M12 9v4h-1M9.5 16a4 4 0 0 0 5 0"/></svg></button>';
          if(k === "del") return '<button type="button" class="lk lk-del" data-k="del" aria-label="Xoá một số"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 5H9l-6 7 6 7h12z"/><path d="m16 9-5 6M11 9l5 6"/></svg></button>';
          return '<button type="button" class="lk" data-k="' + k + '">' + k + '</button>';
        }).join("") + '</div>' +
        '<div class="lock-foot">' +
          '<button type="button" class="lock-link" id="lockAlt"></button>' +
          '<button type="button" class="lock-link" id="lockCancel" hidden>Huỷ</button>' +
        '</div>' +
        '<div class="lock-forgot" id="lockForgot" hidden>' +
          '<p>Không có cách lấy lại mã PIN: dữ liệu trên máy đã được mã hoá bằng chính mã này. Nếu có file sao lưu, bạn có thể xoá dữ liệu trên máy rồi nhập lại từ file.</p>' +
          '<button type="button" class="ghost danger" id="lockWipe">Xoá dữ liệu trên máy và bắt đầu lại</button>' +
          '<button type="button" class="lock-link" id="lockForgotBack">Quay lại nhập mã</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    ui = { el:el, title:el.querySelector("#lockTitle"), sub:el.querySelector("#lockSub"), dots:el.querySelector("#lockDots"),
      err:el.querySelector("#lockErr"), pad:el.querySelector("#lockPad"), bio:el.querySelector(".lk-bio"),
      alt:el.querySelector("#lockAlt"), cancel:el.querySelector("#lockCancel"), forgot:el.querySelector("#lockForgot"),
      wipe:el.querySelector("#lockWipe"), forgotBack:el.querySelector("#lockForgotBack"), handler:null };
    ui.pad.addEventListener("click", function(e){ var b = e.target.closest("[data-k]"); if(b && ui.handler) ui.handler(b.dataset.k); });
    document.addEventListener("keydown", function(e){
      if(el.hidden || !ui.handler || !ui.forgot.hidden) return;
      if(/^[0-9]$/.test(e.key)){ ui.handler(e.key); e.preventDefault(); }
      else if(e.key === "Backspace"){ ui.handler("del"); e.preventDefault(); }
      else if(e.key === "Escape" && !ui.cancel.hidden){ ui.cancel.click(); }
    });
    return ui;
  }
  function dots(n, len){
    var s = ""; for(var i = 0; i < len; i++) s += '<span class="' + (i < n ? "on" : "") + '"></span>';
    ui.dots.innerHTML = s;
  }
  function shake(){ ui.dots.classList.remove("shake"); void ui.dots.offsetWidth; ui.dots.classList.add("shake"); if(navigator.vibrate) try{ navigator.vibrate(80); }catch(e){} }
  function show(){
    build();
    if(document.activeElement && document.activeElement.blur) try{ document.activeElement.blur(); }catch(e){}
    ui.el.hidden = false; document.documentElement.classList.add("locked");
    requestAnimationFrame(function(){ ui.el.classList.add("show"); ui.title.focus({ preventScroll:true }); });
  }
  function hide(){
    if(!ui) return;
    ui.el.classList.remove("show"); ui.handler = null;
    document.documentElement.classList.remove("locked");
    setTimeout(function(){ if(!ui.handler) ui.el.hidden = true; }, 200);
  }
  function setErr(t){ ui.err.textContent = t || ""; }

  /* Nhập mã PIN để mở. Trả về khoá dữ liệu thô. opts.cancel: cho phép huỷ (dùng khi xác nhận trong Cài đặt). */
  function askUnlock(opts){
    opts = opts || {};
    build(); show();
    return new Promise(function(resolve, reject){
      var pin = "", busy = false, len = meta.len || 6, timer = null;
      ui.title.textContent = opts.title || "Nhập mã PIN";
      ui.sub.textContent = opts.sub || "";
      ui.forgot.hidden = true; ui.pad.hidden = false; ui.dots.hidden = false;
      ui.alt.textContent = "Quên mã PIN?"; ui.alt.hidden = !!opts.cancel;
      ui.cancel.hidden = !opts.cancel;
      ui.bio.classList.toggle("off", !(meta.pk && !opts.noBio));
      dots(0, len); setErr(""); ui.err.hidden = false;
      function lockedOut(){
        var ms = waitLeft();
        if(!ms){ if(timer){ clearInterval(timer); timer = null; } setErr(""); return false; }
        setErr("Sai nhiều lần. Thử lại sau " + Math.ceil(ms / 1000) + " giây.");
        if(!timer) timer = setInterval(lockedOut, 1000);
        return true;
      }
      lockedOut();
      function done(raw){ if(timer) clearInterval(timer); ui.handler = null; resolve(raw); }
      async function bio(){
        if(busy) return; busy = true; setErr("");
        try{ var raw = await pkUnlock(); noteOk(); done(raw); }
        catch(e){ busy = false; if(e && e.name !== "NotAllowedError" && e.name !== "AbortError") setErr("Không mở được bằng Face ID. Hãy nhập mã PIN."); }
      }
      ui.handler = async function(k){
        if(busy) return;
        if(k === "bio"){ bio(); return; }
        if(lockedOut()) return;
        if(k === "del"){ pin = pin.slice(0, -1); dots(pin.length, len); return; }
        if(pin.length >= len) return;
        pin += k; dots(pin.length, len); setErr("");
        if(pin.length < len) return;
        busy = true; ui.el.classList.add("busy");
        var raw = await tryPin(pin);
        ui.el.classList.remove("busy"); busy = false;
        if(raw){ noteOk(); done(raw); return; }
        pin = ""; noteFail(); shake(); dots(0, len);
        if(!lockedOut()) setErr("Mã PIN chưa đúng." + (meta.fails >= 3 ? " Còn " + Math.max(0, 5 - meta.fails) + " lần thử trước khi phải chờ." : ""));
      };
      ui.cancel.onclick = function(){ if(timer) clearInterval(timer); ui.handler = null; hide(); reject(new Error("cancel")); };
      ui.alt.onclick = function(){ ui.title.textContent = "Quên mã PIN?"; ui.sub.textContent = ""; ui.err.hidden = true; ui.forgot.hidden = false; ui.pad.hidden = true; ui.dots.hidden = true; ui.alt.hidden = true; delete ui.wipe.dataset.armed; ui.wipe.textContent = "Xoá dữ liệu trên máy và bắt đầu lại"; };
      ui.forgotBack.onclick = function(){ ui.title.textContent = opts.title || "Nhập mã PIN"; ui.sub.textContent = opts.sub || ""; ui.err.hidden = false; ui.forgot.hidden = true; ui.pad.hidden = false; ui.dots.hidden = false; ui.alt.hidden = false; };
      ui.wipe.onclick = function(){
        if(ui.wipe.dataset.armed !== "1"){ ui.wipe.dataset.armed = "1"; ui.wipe.textContent = "Bấm lần nữa để xoá vĩnh viễn"; return; }
        wipeAll();
      };
      if(meta.pk && !opts.noBio && opts.autoBio) setTimeout(bio, 250);
    });
  }

  /* Đặt mã PIN mới: nhập hai lần. Trả về chuỗi mã PIN. */
  function askNewPin(opts){
    opts = opts || {};
    build(); show();
    return new Promise(function(resolve, reject){
      var len = 6, first = null, pin = "";
      ui.forgot.hidden = true; ui.pad.hidden = false; ui.dots.hidden = false;
      ui.cancel.hidden = false; ui.bio.classList.add("off");
      function step(){
        pin = ""; dots(0, len);
        ui.title.textContent = first ? "Nhập lại mã PIN" : (opts.title || "Đặt mã PIN mới");
        ui.sub.textContent = first ? "" : "Dùng mã này mỗi lần mở app. Quên mã thì chỉ khôi phục được từ file sao lưu.";
        ui.alt.hidden = !!first;
        ui.alt.textContent = len === 6 ? "Dùng mã 4 số" : "Dùng mã 6 số";
      }
      setErr(""); ui.err.hidden = false; step();
      ui.alt.onclick = function(){ len = len === 6 ? 4 : 6; setErr(""); step(); };
      ui.handler = function(k){
        if(k === "bio") return;
        if(k === "del"){ pin = pin.slice(0, -1); dots(pin.length, len); return; }
        if(pin.length >= len) return;
        pin += k; dots(pin.length, len); setErr("");
        if(pin.length < len) return;
        if(!first){
          if(/^(\d)\1+$/.test(pin) || "0123456789".indexOf(pin) >= 0 || "9876543210".indexOf(pin) >= 0){
            shake(); setErr("Mã này dễ đoán quá, hãy chọn mã khác."); pin = ""; setTimeout(function(){ dots(0, len); }, 250); return;
          }
          first = pin; setTimeout(step, 150); return;
        }
        if(pin === first){ ui.handler = null; resolve(pin); return; }
        shake(); setErr("Hai lần nhập không khớp, hãy đặt lại."); first = null; setTimeout(step, 250);
      };
      ui.cancel.onclick = function(){ ui.handler = null; hide(); reject(new Error("cancel")); };
    });
  }

  /* ---------- dữ liệu bị khoá mà thiếu thông tin mở: không chạy app để khỏi ghi đè ---------- */
  function hasEncrypted(){
    return N50K.encKeys().some(function(k){ var v = N50K.get(k); return typeof v === "string" && v.indexOf(ENC) === 0; });
  }
  function broken(){
    build(); show();
    ui.title.textContent = "Không mở được dữ liệu";
    ui.sub.textContent = "Dữ liệu trên máy đang được mã hoá nhưng thiếu thông tin mở khoá. App sẽ không ghi gì để khỏi làm mất dữ liệu.";
    ui.pad.hidden = true; ui.dots.hidden = true; ui.alt.hidden = true; ui.cancel.hidden = true;
    ui.forgot.hidden = false; ui.forgotBack.hidden = true;
    ui.wipe.onclick = function(){
      if(ui.wipe.dataset.armed !== "1"){ ui.wipe.dataset.armed = "1"; ui.wipe.textContent = "Bấm lần nữa để xoá vĩnh viễn"; return; }
      wipeAll();
    };
    return new Promise(function(){});
  }

  async function wipeAll(){
    try{ await N50K.wipe(); }catch(e){}
    try{ Object.keys(localStorage).filter(function(k){ return k.indexOf("ngay50k:") === 0; }).forEach(function(k){ localStorage.removeItem(k); }); }catch(e){}
    meta = null; dek = null; dekRaw = null;
    location.reload();
  }

  /* ---------- tự khoá khi rời app ---------- */
  function relock(){
    if(!meta || !unlocked || (ui && ui.handler)) return;
    askUnlock({ autoBio:true }).then(hide).catch(function(){});
  }
  document.addEventListener("visibilitychange", function(){
    if(!meta || !unlocked) return;
    if(document.hidden){
      hiddenAt = Date.now();
      if(!meta.auto) relock();       /* "Ngay": che màn hình ngay để ảnh trong trình chuyển app không lộ số liệu */
    } else if(meta.auto && hiddenAt && Date.now() - hiddenAt >= meta.auto * 60000){
      relock();
    }
  });

  /* ---------- API cho app ---------- */
  var api = {};
  api.KEY = LOCK_KEY;
  api.supported = function(){ return !!(C && window.TextEncoder); };
  api.isOn = function(){ return !!meta; };
  api.meta = function(){ return meta ? { len:meta.len, auto:meta.auto, pk:!!meta.pk } : null; };

  /* Chạy trước khi app khởi động: có khoá thì hỏi mã PIN rồi giải mã. */
  api.gate = async function(){
    meta = readMeta();
    if(!meta){
      if(hasEncrypted()) return broken();
      N50K.unlockPlain(); unlocked = true; return;
    }
    if(!api.supported()) return broken();
    var raw = await askUnlock({ autoBio:true });
    try{ await N50K.unlock(await useDek(raw)); }
    catch(e){ return broken(); }
    unlocked = true; hide();
  };

  /* Bật khoá: đặt mã PIN, sinh khoá dữ liệu, mã hoá toàn bộ dữ liệu đang có. */
  api.enable = async function(){
    if(!api.supported()) throw new Error("Trình duyệt này không hỗ trợ mã hoá.");
    var pin = await askNewPin();
    ui.title.textContent = "Đang mã hoá dữ liệu…"; ui.sub.textContent = ""; ui.pad.hidden = true; ui.dots.hidden = true; ui.alt.hidden = true; ui.cancel.hidden = true;
    try{
      var raw = rand(32), salt = rand(16);
      var kek = await pinKey(pin, salt, ITER);
      var m = { v:1, len:pin.length, salt:b64(salt), iter:ITER, wp:await wrap(kek, raw), auto:1, fails:0, until:0, pk:null, at:Date.now() };
      var c = await useDek(raw);
      meta = m; saveMeta();
      await N50K.setCodec(c);
    } finally { hide(); }
  };
  /* Đổi mã PIN: hỏi mã cũ, đặt mã mới, bọc lại khoá dữ liệu. */
  api.changePin = async function(){
    if(!meta) return;
    await askUnlock({ title:"Nhập mã PIN hiện tại", cancel:true, noBio:true });
    var pin = await askNewPin({ title:"Đặt mã PIN mới" });
    var salt = rand(16), kek = await pinKey(pin, salt, ITER);
    meta.len = pin.length; meta.salt = b64(salt); meta.iter = ITER; meta.wp = await wrap(kek, dekRaw);
    saveMeta(); await N50K.flush(); hide();
  };
  /* Tắt khoá: hỏi mã PIN, ghi lại dữ liệu dạng thường, rồi mới xoá thông tin khoá. */
  api.disable = async function(){
    if(!meta) return;
    await askUnlock({ title:"Nhập mã PIN để tắt khoá", cancel:true, noBio:true });
    hide();
    await N50K.setCodec(null);
    meta = null; dek = null; dekRaw = null; saveMeta();
    await N50K.flush();
  };
  api.setAuto = function(min){ if(!meta) return; meta.auto = min; saveMeta(); };
  api.lockNow = function(){ relock(); };

  api.pkAvailable = pkAvailable;
  /* Bật Face ID: tạo passkey trên máy, lấy bí mật PRF, bọc thêm một bản khoá dữ liệu. */
  api.enablePasskey = async function(){
    if(!meta || !dekRaw) throw new Error("Hãy bật mã PIN trước.");
    if(!(await pkAvailable())) throw new Error("Máy này không có Face ID hoặc Touch ID cho web app.");
    var salt = rand(32);
    var cred = await navigator.credentials.create({ publicKey:{
      rp:{ name:"Tiêu Gọn" },
      user:{ id:rand(16), name:"ngay50k-" + new Date().toISOString().slice(0, 10), displayName:"Tiêu Gọn" },
      challenge:rand(32), timeout:60000,
      pubKeyCredParams:[{ type:"public-key", alg:-7 }, { type:"public-key", alg:-257 }],
      authenticatorSelection:{ authenticatorAttachment:"platform", residentKey:"preferred", userVerification:"required" },
      extensions:{ prf:{ eval:{ first:salt } } }
    }});
    var ext = cred.getClientExtensionResults ? cred.getClientExtensionResults() : {};
    if(!(ext && ext.prf && (ext.prf.enabled || (ext.prf.results && ext.prf.results.first)))) throw new Error("noprf");
    var id = b64(cred.rawId), secret = ext.prf.results && ext.prf.results.first ? new Uint8Array(ext.prf.results.first) : await pkSecret(id, b64(salt));
    meta.pk = { id:id, salt:b64(salt), wp:await wrap(await prfKey(secret), dekRaw) };
    saveMeta(); await N50K.flush();
  };
  api.disablePasskey = async function(){ if(!meta) return; meta.pk = null; saveMeta(); await N50K.flush(); };
  api.wipeAll = wipeAll;
  /* App tự xoá toàn bộ dữ liệu: bỏ luôn khoá */
  api.forget = function(){ meta = null; dek = null; dekRaw = null; N50K.setCodec(null, true); N50K.del(LOCK_KEY); };

  /* ---------- file sao lưu có mật khẩu ---------- */
  /* sinh khoá từ mật khẩu trước (lúc gõ xong mật khẩu), để lúc bấm xuất chỉ còn mã hoá nhanh:
     iPhone chỉ cho mở bảng chia sẻ ngay sau lần chạm, chờ lâu sẽ bị chặn */
  var bk = null;
  api.prepBackup = function(pw){
    if(bk && bk.pw === pw) return bk.p;
    var salt = rand(16);
    bk = { pw:pw, salt:salt, p:pinKey(pw, salt, ITER) };
    return bk.p;
  };
  api.encBackup = async function(text, pw){
    var key = await api.prepBackup(pw), salt = bk.salt, iv = rand(12);
    var ct = await C.encrypt({ name:"AES-GCM", iv:iv }, key, te.encode(text));
    return JSON.stringify({ app:"ngay50k", format:1, exportedAt:new Date().toISOString(),
      enc:{ v:1, kdf:"PBKDF2-SHA256", iter:ITER, salt:b64(salt), iv:b64(iv) }, data:b64(ct) });
  };
  api.decBackup = async function(obj, pw){
    var e = obj.enc, key = await pinKey(pw, unb64(e.salt), e.iter || ITER);
    return td.decode(await C.decrypt({ name:"AES-GCM", iv:unb64(e.iv) }, key, unb64(obj.data)));
  };
  return api;
})();
