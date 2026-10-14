// Tiêu Gọn – nhận thông báo ngân hàng từ Phím tắt và trả cho app. Bản mã 4
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
function keyOk_(k){ var s = SECRET || P_().getProperty('SECRET_KEY'); return !!s && !!k && String(k) === String(s); }

// ============ POST: Phím tắt gửi nội dung TieuGon.txt ============
function doPost(e){
  var d = {};
  try{ d = JSON.parse(e.postData.contents); }catch(err){ d = (e && e.parameter) || {}; }
  if(!keyOk_(d.k)) return txt_('TG_KEY');                // sai mã: không trả TG_OK, phím tắt giữ nguyên tệp
  var lines = String(d.t || '').split(/\r?\n/).map(function(x){ return x.trim(); }).filter(function(x){ return x; });
  if(!lines.length) return txt_('TG_OK');
  var lock = LockService.getScriptLock();
  if(!lock.tryLock(20000)) return txt_('TG_BUSY');       // hai thông báo tới cùng lúc: cái sau chờ, không đè nhau
  try{
    var ss = SpreadsheetApp.getActiveSpreadsheet(), p = P_();
    var tb = ss.getSheetByName(SH_TB) || ss.insertSheet(SH_TB);
    var n = tb.getLastRow(), from = Math.max(1, n - 399);
    var rows = n ? tb.getRange(from, 1, n - from + 1, 3).getValues() : [], have = {};
    rows.forEach(function(r){ have[String(r[2] || r[1])] = 1; });   // bỏ trùng theo nội dung gốc (phím tắt gửi lại cả tệp khi lần trước lỗi)
    var last = Number(p.getProperty('lastAt')) || 0;
    var at = Math.max(Date.now(), last + 1, rows.length ? Number(rows[rows.length - 1][0]) + 1 : 0);
    var lib = lib_(ss), add = [], q = [];
    lines.forEach(function(x){
      if(have[x]) return; have[x] = 1;
      var c = clean_(x, lib);
      add.push([String(at), c, x]); q.push({ at: at, t: c }); at++;  // mỗi dòng một mốc riêng
    });
    if(!add.length) return txt_('TG_OK');
    tb.getRange(n + 1, 1, add.length, 3).setNumberFormat('@').setValues(add);   // ghi một lần thay vì appendRow từng dòng
    if(n + add.length > KEEP + 200) tb.deleteRows(1, n + add.length - KEEP);

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
    return txt_('TG_OK');
  }catch(err){
    return txt_('ERR');                                                // phím tắt giữ tệp, lần sau gửi lại
  }finally{ lock.releaseLock(); }
}

// ============ GET: app hỏi giao dịch mới hơn "since" ============
function doGet(e){
  var prm = (e && e.parameter) || {};
  if(!keyOk_(prm.k)) return out_({ ok:false, err:'key' });
  var p = P_(), since = Number(prm.since || 0), last = Number(p.getProperty('lastAt')) || 0;
  if(since > (Number(p.getProperty('ackAt')) || 0)) p.setProperty('ackAt', String(since));   // app đã nhận xong tới mốc này
  var qm = p.getProperty('qMin');                                      // mốc giao dịch cũ nhất còn trong A1 ('' = A1 trống)
  var trim = qm === null || (qm !== '' && Number(qm) <= since);        // A1 còn giao dịch app đã nhận → dọn
  if(last && last <= since && !trim) return out_({ ok:true, v:4, items:[], more:false });   // không có gì mới: trả ngay, không mở Sheet
  var lock = LockService.getScriptLock(); lock.tryLock(5000);
  try{
    var ss = SpreadsheetApp.getActiveSpreadsheet(), floor = Number(p.getProperty('qFloor')) || 0, items = null;
    var dp = ss.getSheetByName(SH_DP), q = dp ? readQ_(dp) : [];
    if(trim && dp && q !== null){                                        // dọn ô A1: chỉ giữ giao dịch app chưa nhận
      q = q.filter(function(x){ return x.at > since; });
      floor = Math.max(floor, since);
      p.setProperties({ qFloor: String(floor), qMin: q.length ? String(q[0].at) : '' });
      dp.getRange('A1').setNumberFormat('@').setValue(JSON.stringify(q));
    } else if(trim && !dp) p.setProperty('qMin', '');
    if(since >= floor && q !== null) items = q.filter(function(x){ return x.at > since; });   // đường nhanh: chỉ đọc ô A1
    if(items === null){                                                  // đường chậm: app lâu không mở, hàng đợi đã tràn
      var tb = ss.getSheetByName(SH_TB), n = tb ? tb.getLastRow() : 0;
      var rows = n ? tb.getRange(1, 1, n, 2).getValues() : [];
      items = rows.filter(function(r){ return Number(r[0]) > since; }).map(function(r){ return { at:Number(r[0]), t:String(r[1]) }; });
    }
    items.sort(function(a, b){ return a.at - b.at; });
    return out_({ ok:true, v:4, items:items.slice(0, PAGE), more:items.length > PAGE });
  }catch(err){
    return out_({ ok:false, err:String(err && err.message || err) });
  }finally{ lock.releaseLock(); }
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
