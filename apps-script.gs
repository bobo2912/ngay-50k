// Tiêu Gọn – nhận thông báo ngân hàng từ Phím tắt và trả cho app. Bản mã 4.3
// Lỗi hay sai mã được ghi vào sheet NhatKy. Chạy hàm kiemTra (chọn ở thanh trên, bấm ▶ Chạy) để thử không cần iPhone.
// Giữ ý tưởng: hàng đợi JSON ở DataPack!A1 (app lấy nhanh) + sheet ThuVien chuẩn hoá nội dung.
// Ô A1 chỉ chứa giao dịch app CHƯA nhận. Không xoá ngay lúc app đọc (mạng rớt là mất), mà xoá khi app báo đã nhận:
// app gửi "since" = mốc giao dịch cuối nó đã nhận (app v151 báo ngay sau khi lấy xong) → giao dịch tới mốc đó bị dọn khỏi A1.
// Nhờ vậy mạng rớt giữa chừng hay bấm "Kiểm tra" trong Cài đặt cũng không mất giao dịch.

var SECRET = '';          // để trống = dùng mã đã lưu trong Script Properties (SECRET_KEY); hoặc dán mã bí mật của app vào đây
var SH_TB = 'ThongBao', SH_TV = 'ThuVien', SH_DP = 'DataPack';
var KEEP = 1000;          // ThongBao giữ 1000 dòng gần nhất
var QMAX = 150;           // hàng đợi A1 tối đa 150 giao dịch (~30 KB; một ô Sheet chứa tối đa 50.000 ký tự)
var PAGE = 300;           // mỗi lần trả tối đa 300 giao dịch (app tự lấy tiếp khi more = true)

function out_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function txt_(t){ return ContentService.createTextOutput(t); }
function P_(){ return PropertiesService.getScriptProperties(); }
// Mã đúng nếu khớp SECRET ở trên HOẶC mã đã lưu (SECRET_KEY). Chưa có mã nào thì lưu mã của lần gửi đầu tiên.
function keyOk_(k){
  k = String(k == null ? '' : k).trim(); if(!k) return false;
  var p = P_(), saved = p.getProperty('SECRET_KEY');
  if(SECRET && k === String(SECRET).trim()) return true;
  if(saved && k === String(saved).trim()) return true;
  if(!SECRET && !saved){ p.setProperty('SECRET_KEY', k); return true; }
  return false;
}
function log_(kind, msg){
  try{
    var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName('NhatKy') || ss.insertSheet('NhatKy');
    sh.appendRow([new Date(), kind, String(msg).slice(0, 500)]);
    if(sh.getLastRow() > 300) sh.deleteRows(1, sh.getLastRow() - 200);
  }catch(e){}
}
function hint_(k){ k = String(k == null ? '' : k); return 'mã nhận được: "' + (k.length > 3 ? k.slice(0, 3) + '…' : k) + '" (' + k.length + ' ký tự); SECRET ' + (SECRET ? 'có đặt' : 'để trống') + ', SECRET_KEY ' + (P_().getProperty('SECRET_KEY') ? 'có lưu' : 'chưa lưu'); }

// ============ POST: Phím tắt gửi nội dung TieuGon.txt ============
function doPost(e){
  var d = {};
  try{ d = JSON.parse(e.postData.contents); }catch(err){ d = (e && e.parameter) || {}; }
  if(!d || typeof d !== 'object') d = {};
  if(!keyOk_(d.k)){ log_('TG_KEY', 'POST sai mã · ' + hint_(d.k)); return txt_('TG_KEY'); }   // sai mã: phím tắt giữ nguyên tệp
  var lines = String(d.t || '').split(/\r?\n/).map(function(x){ return x.trim(); }).filter(function(x){ return x; });
  if(!lines.length) return txt_('TG_OK');
  var lock = LockService.getScriptLock(), t0 = Date.now();
  if(!lock.tryLock(8000)){                               // khoá bị giữ quá lâu: vẫn ghi (không đè ai), không bắt phím tắt chờ
    log_('TG_BUSY', 'POST chờ khoá 8 giây không được (lần chạy khác đang giữ) → ghi thẳng vào ThongBao');
    return postNoLock_(lines);
  }
  try{
    var ss = SpreadsheetApp.getActiveSpreadsheet(), p = P_();
    var tb = ss.getSheetByName(SH_TB) || ss.insertSheet(SH_TB);
    var n = tb.getLastRow(), from = Math.max(1, n - 399);
    var rows = n ? tb.getRange(from, 1, n - from + 1, 3).getValues() : [], have = {};
    rows.forEach(function(r){ have[String(r[2] || r[1])] = 1; });   // bỏ trùng theo nội dung gốc (phím tắt gửi lại cả tệp khi lần trước lỗi)
    var last = Number(p.getProperty('lastAt')) || 0;
    var lastRow = 0; rows.forEach(function(r){ var v = Number(r[0]); if(v > lastRow) lastRow = v; });   // bỏ qua dòng tiêu đề / ô không phải số
    var at = Math.max(Date.now(), last + 1, lastRow + 1);
    var lib = lib_(ss), add = [], q = [];
    lines.forEach(function(x){
      if(have[x]) return; have[x] = 1;
      var c = clean_(x, lib);
      add.push([String(at), c, x]); q.push({ at: at, t: c }); at++;  // mỗi dòng một mốc riêng
    });
    if(!add.length) return txt_('TG_OK');
    tb.getRange(n + 1, 1, add.length, 3).setNumberFormat('@').setValues(add);   // ghi một lần thay vì appendRow từng dòng
    if(n + add.length > KEEP + 200) tb.deleteRows(1, Math.min(300, n + add.length - KEEP));   // dọn dần, mỗi lần tối đa 300 dòng

    var dp = ss.getSheetByName(SH_DP);
    if(!dp){ dp = ss.insertSheet(SH_DP); dp.hideSheet(); }
    var floor = Number(p.getProperty('qFloor')) || 0, ack = Number(p.getProperty('ackAt')) || 0;
    var cur = readQ_(dp);
    if(cur === null){ cur = []; floor = Math.max(floor, last); }        // A1 hỏng: bỏ, phần cũ app lấy từ ThongBao
    cur = cur.filter(function(x){ return x.at > ack; }).concat(q);     // dọn những gì app đã báo nhận
    floor = Math.max(floor, ack);
    if(cur.length > QMAX){ var drop = cur.splice(0, cur.length - QMAX); floor = Math.max(floor, drop[drop.length - 1].at); }
    p.setProperties({ qFloor: String(floor), qMin: cur.length ? String(cur[0].at) : '' });   // ghi mốc trước, ô A1 sau
    dp.getRange('A1').setNumberFormat('@').setValue(JSON.stringify(cur));
    p.setProperty('lastAt', String(at - 1));
    if(Date.now() - t0 > 5000) log_('CHAM', 'POST mất ' + Math.round((Date.now() - t0) / 1000) + ' giây · ThongBao ' + n + ' dòng');
    return txt_('TG_OK');
  }catch(err){
    log_('ERR', 'POST: ' + (err && err.stack || err));
    return txt_('ERR ' + (err && err.message || err));                // phím tắt giữ tệp, lần sau gửi lại
  }finally{ lock.releaseLock(); }
}

// ============ GET: app hỏi giao dịch mới hơn "since" ============
function doGet(e){
  var prm = (e && e.parameter) || {};
  if(!keyOk_(prm.k)){ log_('TG_KEY', 'GET sai mã · ' + hint_(prm.k)); return out_({ ok:false, err:'key' }); }
  var p = P_(), since = Number(prm.since || 0), last = Number(p.getProperty('lastAt')) || 0;
  if(since > (Number(p.getProperty('ackAt')) || 0)) p.setProperty('ackAt', String(since));   // app đã nhận xong tới mốc này
  var qm = p.getProperty('qMin');                                      // mốc giao dịch cũ nhất còn trong A1 ('' = A1 trống)
  var trim = qm === null || (qm !== '' && Number(qm) <= since);        // A1 còn giao dịch app đã nhận → dọn
  if(last && last <= since && !trim) return out_({ ok:true, v:4, items:[], more:false });   // không có gì mới: trả ngay, không mở Sheet
  var lock = LockService.getScriptLock(), locked = lock.tryLock(0);   // app hỏi không bao giờ chờ khoá
  try{
    var ss = SpreadsheetApp.getActiveSpreadsheet(), floor = Number(p.getProperty('qFloor')) || 0, items = null;
    var dp = ss.getSheetByName(SH_DP), q = dp ? readQ_(dp) : [];
    if(trim && locked && dp && q !== null){                                        // dọn ô A1: chỉ giữ giao dịch app chưa nhận
      q = q.filter(function(x){ return x.at > since; });
      floor = Math.max(floor, since);
      p.setProperties({ qFloor: String(floor), qMin: q.length ? String(q[0].at) : '' });
      dp.getRange('A1').setNumberFormat('@').setValue(JSON.stringify(q));
    } else if(trim && locked && !dp) p.setProperty('qMin', '');
    if(since >= floor && q !== null) items = q.filter(function(x){ return x.at > since; });   // đường nhanh: chỉ đọc ô A1
    if(items === null){                                                  // đường chậm: app lâu không mở, hàng đợi đã tràn
      var tb = ss.getSheetByName(SH_TB), n = tb ? tb.getLastRow() : 0;
      var rows = n ? tb.getRange(1, 1, n, 2).getValues() : [];
      items = rows.filter(function(r){ return Number(r[0]) > since; }).map(function(r){ return { at:Number(r[0]), t:String(r[1]) }; });
    }
    items.sort(function(a, b){ return a.at - b.at; });
    return out_({ ok:true, v:4, items:items.slice(0, PAGE), more:items.length > PAGE });
  }catch(err){
    log_('ERR', 'GET: ' + (err && err.stack || err));
    return out_({ ok:false, err:String(err && err.message || err) });
  }finally{ if(locked) lock.releaseLock(); }
}

// Ghi khi không có khoá: appendRow từng dòng (không đè dòng của lần chạy khác), không động vào ô A1;
// nâng mốc qFloor để app lấy các dòng này thẳng từ ThongBao.
function postNoLock_(lines){
  try{
    var ss = SpreadsheetApp.getActiveSpreadsheet(), p = P_(), lib = lib_(ss);
    var tb = ss.getSheetByName(SH_TB) || ss.insertSheet(SH_TB);
    var at = Math.max(Date.now(), (Number(p.getProperty('lastAt')) || 0) + 1);
    lines.forEach(function(x){ tb.appendRow([String(at), clean_(x, lib), x]); at++; });
    p.setProperties({ qFloor: String(Math.max(Number(p.getProperty('qFloor')) || 0, at - 1)), lastAt: String(Math.max(Number(p.getProperty('lastAt')) || 0, at - 1)) });
    return txt_('TG_OK');
  }catch(err){
    log_('ERR', 'POST không khoá: ' + (err && err.stack || err));
    return txt_('ERR ' + (err && err.message || err));
  }
}

// ============ Hỗ trợ ============
function readQ_(dp){
  var v = dp.getRange('A1').getValue();
  if(v === '' || v === null) return [];
  try{ var a = JSON.parse(v); return Array.isArray(a) ? a : null; }catch(e){ return null; }
}

// ThuVien: cột A từ khoá, cột B nội dung thay; dòng 1 là tiêu đề. Từ khoá dài được so trước
// (vd "GRAB FOOD" thắng "GRAB"), so không phân biệt hoa thường và có dấu/không dấu.
function lib_(ss){
  var sh = ss.getSheetByName(SH_TV); if(!sh) return [];
  var v = sh.getDataRange().getValues(); v.shift();
  return v.map(function(r){ return { k: noAcc_(String(r[0]).trim()), r: String(r[1]).trim() }; })
          .filter(function(x){ return x.k && x.r; })
          .sort(function(a, b){ return b.k.length - a.k.length; });
}
function noAcc_(s){ return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); }

function clean_(line, lib){
  if(!lib.length) return line;
  var m = line.match(/(ND\s*:|N[ộo]i dung\s*:)\s*([^|]*)/i);
  if(!m) return line;
  var raw = m[2], body = raw.replace(/\s+$/, ''), tail = raw.slice(body.length);
  if(!body) return line;
  var low = noAcc_(body);
  for(var i = 0; i < lib.length; i++){
    if(low.indexOf(lib[i].k) >= 0){
      var start = m.index + m[0].length - raw.length;
      return line.slice(0, start) + lib[i].r + tail + line.slice(start + raw.length);
    }
  }
  return line;
}

// ============ Thử trong trình soạn Apps Script: chọn kiemTra → ▶ Chạy → xem Nhật ký thực thi ============
function kiemTra(){
  var k = SECRET || P_().getProperty('SECRET_KEY') || '(chưa có mã)';
  var line = 'TK 00xxx000|GD: -1,000VND ' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yy HH:mm') + ' |SD: 0VND|ND: THU KIEM TRA TIEU GON';
  var r = doPost({ postData: { contents: JSON.stringify({ k: k, t: line }) } }).getContent();
  Logger.log('POST trả về: ' + r + (r === 'TG_OK' ? '  → ghi Sheet được. Xem sheet ThongBao và DataPack!A1 (xoá dòng thử nếu muốn).' : '  → xem sheet NhatKy để biết lý do.'));
  Logger.log('Mã đang dùng bắt đầu bằng: ' + String(k).slice(0, 3) + '… (so với mã bí mật trong app và trường k của phím tắt)');
}

// ============ Chẩn đoán: chọn chanDoan → ▶ Chạy → chép Nhật ký thực thi gửi lại ============
function chanDoan(){
  var t = Date.now(), lap = function(name){ Logger.log(name + ': ' + (Date.now() - t) + ' ms'); t = Date.now(); };
  var lk = LockService.getScriptLock(), got = lk.tryLock(1000);
  Logger.log('Khoá ghi: ' + (got ? 'trống' : 'ĐANG BỊ GIỮ bởi lần chạy khác')); if(got) lk.releaseLock(); t = Date.now();
  var ss = SpreadsheetApp.getActiveSpreadsheet(); lap('Mở Sheet');
  ss.getSheets().forEach(function(sh){
    var r = sh.getLastRow(), c = sh.getLastColumn(), f = 0;
    if(r && c){ sh.getRange(1, 1, Math.min(r, 3000), Math.min(c, 30)).getFormulas().forEach(function(row){ row.forEach(function(x){ if(x) f++; }); }); }
    Logger.log('Sheet ' + sh.getName() + ': ' + r + ' dòng có dữ liệu × ' + c + ' cột · lưới ' + sh.getMaxRows() + '×' + sh.getMaxColumns() + ' · ' + f + ' ô công thức');
  }); lap('Đếm các sheet');
  var tb = ss.getSheetByName(SH_TB);
  if(tb){ var n = tb.getLastRow(); if(n) tb.getRange(Math.max(1, n - 399), 1, Math.min(n, 400), 3).getValues(); } lap('Đọc 400 dòng cuối ThongBao');
  var lib = lib_(ss); lap('Đọc ThuVien (' + lib.length + ' từ khoá)');
  var dp = ss.getSheetByName(SH_DP), a1 = dp ? String(dp.getRange('A1').getValue()) : ''; lap('Đọc DataPack!A1 (' + a1.length + ' ký tự)');
  var pr = P_().getProperties(); Logger.log('Thuộc tính: ' + Object.keys(pr).map(function(k){ return k + '=' + (k === 'SECRET_KEY' ? String(pr[k]).slice(0, 3) + '…' : pr[k]); }).join(', '));
  var tr = ScriptApp.getProjectTriggers(); Logger.log('Trình kích hoạt: ' + (tr.length ? tr.map(function(x){ return x.getHandlerFunction() + ' (' + x.getEventType() + ')'; }).join(', ') : 'không có'));
}
