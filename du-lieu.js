/* Tiêu Gọn – CẤU TRÚC DỮ LIỆU (schema 2). Chạy trên máy, không gửi đi đâu.

   Từ v199 dữ liệu chính (IndexedDB "ngay50k:v1") và file sao lưu được lưu theo schema 2:
   mọi biến động tiền nằm chung một bảng tx, cùng một bộ trường. Trong bộ nhớ app vẫn dùng dạng cũ
   (days / income / cardTx …) để không phải viết lại mọi màn hình cùng lúc; file này đổi qua lại hai dạng
   ở đúng hai chỗ: lúc đọc lên (fromV2) và lúc ghi xuống / xuất file (toV2). Đổi qua đổi lại không mất trường nào:
   trường lạ được giữ nguyên, bản ghi có trường trùng tên với trường của schema 2 thì cất nguyên vẹn trong "raw".

   ───────── schema 2 ─────────
   {
     schema: 2, updated, budget, budgetM,
     accounts: [ { id:"main", group:"main", name:"Tài khoản" },          // ví mặc định (tài khoản chính + tiền mặt)
                 { id, group:"wallet", kind:"bank"|"ewallet"|"other", name, icon, off? , m },
                 { id, group:"card",   kind:"credit", name, first6, last4, stmt, m } ],
     tx: [ {                                   // sắp theo ngày, trong ngày giữ thứ tự ghi
       id, type, amt, d:"YYYY-MM-DD", t,
       acc,      // tài khoản bị trừ / được cộng: mã ví ("main" là ví mặc định), mã thẻ với chi thẻ
       to?,      // tài khoản nhận: chuyển ví (mã ví), trả thẻ (mã thẻ)
       tag?,     // mã tag; khoản thu có tiền tố "in:" (in:luong, in:cho) để không trùng tag chi ("cho" = Đi chợ)
       note?, loan?, rc?, fx?, nk?, ph?, m?, …  // các trường khác giữ nguyên tên
     } ],
       type:  out      chi từ ví              card    chi bằng thẻ tín dụng (cộng nợ thẻ)
              in       thu vào ví             xfer    chuyển giữa hai ví
              cardpay  trả nợ thẻ             loan    số tiền gốc lúc tạo khoản vay / cho vay
              draw     vay thêm / cho vay thêm         repay   trả nợ / được trả (theo side của khoản vay)
     loans:    [ { id, side:"borrow"|"lend", who, due, note, prepaid, t, m } ],   // chỉ phần đầu, tiền nằm ở tx
     balances: [ { id, acc, amt, t, book?, card?, m } ],                          // các lần đối chiếu số dư
     recur:    [ { id, name, amt, day, tag, acc, from, made, m } ],
     tags, tagOff, contacts, learn, miss, thuvien, alias, aliasM, payKind, askMem, deleted
   }
*/
(function(root){
  "use strict";
  const SCHEMA = 2, MAIN = "main";
  const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);
  const clone = v => JSON.parse(JSON.stringify(v));

  /* chép một bản ghi sang dạng khác: fixed = trường thêm vào, ren = đổi tên trường.
     Bản ghi gốc đã có sẵn một trường mà dạng mới dùng (không phải do đổi tên mà ra) thì trả null → cất nguyên vẹn. */
  function remap(src, fixed, ren){
    const out = {}, used = new Set(Object.keys(fixed));
    for(const k in ren) used.add(ren[k]);
    for(const k in src){
      if(k in ren) continue;
      if(used.has(k)) return null;
      out[k] = src[k];
    }
    for(const k in ren) if(k in src) out[ren[k]] = src[k];
    return Object.assign(out, fixed);
  }
  function unmap(rec, drop, ren){
    const out = {}, back = {};
    for(const k in ren) back[ren[k]] = k;
    for(const k in rec){ if(drop.includes(k)) continue; out[k in back ? back[k] : k] = rec[k]; }
    return out;
  }
  const RAW = (type, src, extra) => Object.assign({ id:src && src.id, type, raw:clone(src) }, extra || {});

  /* các loại khoản và cách đổi tên trường; side = khoản nằm trong túi nào của dạng cũ */
  const KIND = {
    out:     { bag:"days",   ren:{ w:"acc", cat:"tag" }, accDef:true },
    in:      { bag:"income", ren:{ w:"acc", cat:"tag" }, accDef:true, tagPre:"in:" },
    card:    { bag:"cardTx", ren:{ cardId:"acc", where:"note", cat:"tag" } },
    xfer:    { list:"xfer",    ren:{ date:"d", from:"acc" } },
    cardpay: { list:"cardPay", ren:{ date:"d", from:"acc", cardId:"to" }, accDef:true }
  };
  const LOAN_SUB = { draw:{ list:"draws", ren:{ date:"d" } }, repay:{ list:"payments", ren:{ date:"d" } } };

  /* ---------- dạng cũ → schema 2 ---------- */
  function toV2(st){
    st = st || {};
    const tx = [];
    /* túi theo ngày: days / income / cardTx */
    ["out", "in", "card"].forEach(type => {
      const K = KIND[type], bag = isObj(st[K.bag]) ? st[K.bag] : {};
      Object.keys(bag).forEach(d => (Array.isArray(bag[d]) ? bag[d] : []).forEach(it => {
        if(!isObj(it)) return;
        let r = remap(it, { type, d }, K.ren);
        if(!r){ tx.push(RAW(type, it, { d })); return; }
        if(K.accDef && !("acc" in r)) r.acc = MAIN;
        if(K.tagPre && typeof r.tag === "string") r.tag = K.tagPre + r.tag;
        tx.push(r);
      }));
    });
    /* danh sách có ngày riêng: xfer / cardPay */
    ["xfer", "cardpay"].forEach(type => {
      const K = KIND[type];
      (Array.isArray(st[K.list]) ? st[K.list] : []).forEach(it => {
        if(!isObj(it)) return;
        const r = remap(it, { type }, K.ren);
        if(!r){ tx.push(RAW(type, it, { d:it.date })); return; }
        if(K.accDef && !("acc" in r)) r.acc = MAIN;
        tx.push(r);
      });
    });
    /* khoản vay: phần đầu ở loans, tiền gốc / vay thêm / trả ở tx */
    const loans = [];
    (Array.isArray(st.loans) ? st.loans : []).forEach(l => {
      if(!isObj(l)) return;
      const head = {};
      let clash = false;
      for(const k in l){
        if(k === "amt" || k === "date" || k === "payments" || k === "draws") continue;
        if(k === "side" || k === "raw") clash = true;
        head[k === "type" ? "side" : k] = l[k];
      }
      if(clash){ loans.push({ id:l.id, raw:clone(l) }); return; }
      loans.push(head);
      const o = { id:l.id, type:"loan", loan:l.id, amt:l.amt, d:l.date };
      if("t" in l) o.t = l.t;
      if(!("amt" in l)) delete o.amt;
      if(!("date" in l)) delete o.d;
      tx.push(o);
      ["draw", "repay"].forEach(type => {
        const S = LOAN_SUB[type];
        (Array.isArray(l[S.list]) ? l[S.list] : []).forEach(p => {
          if(!isObj(p)) return;
          const r = remap(p, { type, loan:l.id }, S.ren);
          tx.push(r || RAW(type, p, { d:p.date, loan:l.id }));
        });
      });
    });
    /* sắp theo ngày; trong một ngày giữ đúng thứ tự đã ghi (app hiện khoản theo thứ tự ghi, không theo giờ) */
    tx.forEach((r, i) => { r.__i = i; });
    tx.sort((a, b) => String(a.d || "").localeCompare(String(b.d || "")) || a.__i - b.__i);
    tx.forEach(r => { delete r.__i; });

    const accounts = [{ id:MAIN, group:"main", name:"Tài khoản" }];
    (Array.isArray(st.wallets) ? st.wallets : []).forEach(w => { if(isObj(w)) accounts.push("group" in w ? { id:w.id, group:"wallet", raw:clone(w) } : Object.assign({ id:w.id, group:"wallet" }, w)); });
    (Array.isArray(st.cards) ? st.cards : []).forEach(c => { if(isObj(c)) accounts.push(("group" in c || "kind" in c) ? { id:c.id, group:"card", raw:clone(c) } : Object.assign({ id:c.id, group:"card", kind:"credit" }, c)); });

    const balances = (Array.isArray(st.bals) ? st.bals : []).map(b => {
      if(!isObj(b)) return b;
      const r = remap(b, {}, { w:"acc" });
      if(!r) return { id:b.id, raw:clone(b) };
      if(!("acc" in r)) r.acc = MAIN;
      return r;
    });
    const recur = (Array.isArray(st.recur) ? st.recur : []).map(x => {
      if(!isObj(x)) return x;
      const r = remap(x, {}, { cat:"tag", card:"acc" });
      if(!r) return { id:x.id, raw:clone(x) };
      if("acc" in r && !r.acc) r.acc = MAIN;
      return r;
    });

    const out = {
      schema: SCHEMA, updated: st.updated || 0, budget: st.budget, budgetM: st.budgetM || 0,
      accounts, tx, loans, balances, recur,
      tags: st.tags || [], tagOff: st.tagOff || {}, contacts: st.contacts || [],
      learn: st.learn || [], miss: st.miss || [], thuvien: st.thuvien || [],
      alias: st.alias || {}, aliasM: st.aliasM || {}, payKind: st.payKind || {}, askMem: st.askMem || {},
      deleted: st.deleted || {}
    };
    /* trường cũ không còn dùng: chỉ giữ khi còn dữ liệu */
    if(isObj(st.payees) && Object.keys(st.payees).length) out.payees = st.payees;
    if(isObj(st.caps) && Object.keys(st.caps).length) out.caps = st.caps;
    return clone(out);
  }

  /* ---------- schema 2 → dạng cũ (dạng app dùng trong bộ nhớ) ---------- */
  function fromV2(v){
    v = v || {};
    const st = {
      budget: v.budget, budgetM: v.budgetM || 0, updated: v.updated || 0,
      days:{}, income:{}, cardTx:{}, xfer:[], cardPay:[], loans:[], wallets:[], cards:[],
      tags: v.tags || [], tagOff: v.tagOff || {}, contacts: v.contacts || [],
      learn: v.learn || [], miss: v.miss || [], thuvien: v.thuvien || [],
      alias: v.alias || {}, aliasM: v.aliasM || {}, payKind: v.payKind || {}, askMem: v.askMem || {},
      deleted: v.deleted || {}, payees: v.payees || {}, caps: v.caps || {}
    };
    (Array.isArray(v.accounts) ? v.accounts : []).forEach(a => {
      if(!isObj(a) || a.group === "main") return;
      const list = a.group === "card" ? st.cards : st.wallets;
      if(a.raw){ list.push(clone(a.raw)); return; }
      const r = unmap(a, a.group === "card" ? ["group", "kind"] : ["group"], {});
      list.push(r);
    });
    const loanById = new Map();
    (Array.isArray(v.loans) ? v.loans : []).forEach(h => {
      if(!isObj(h)) return;
      if(h.raw){ const l = clone(h.raw); st.loans.push(l); loanById.set(l.id, { l, raw:true }); return; }
      const l = unmap(h, [], { type:"side" });
      l.payments = []; l.draws = [];
      st.loans.push(l); loanById.set(l.id, { l, raw:false });
    });
    (Array.isArray(v.tx) ? v.tx : []).forEach(r => {
      if(!isObj(r)) return;
      const type = r.type;
      if(type === "loan" || type === "draw" || type === "repay"){
        const e = loanById.get(r.loan);
        if(!e || e.raw) return;                       /* khoản vay cất nguyên vẹn đã có sẵn tiền gốc / vay thêm / trả */
        if(type === "loan"){
          if("amt" in r) e.l.amt = r.amt;
          if("d" in r) e.l.date = r.d;
          return;
        }
        const S = LOAN_SUB[type];
        e.l[S.list].push(r.raw ? clone(r.raw) : unmap(r, ["type", "loan"], S.ren));
        return;
      }
      const K = KIND[type];
      if(!K) return;
      let it;
      if(r.raw) it = clone(r.raw);
      else {
        const c = Object.assign({}, r);
        if(K.tagPre && typeof c.tag === "string" && c.tag.indexOf(K.tagPre) === 0) c.tag = c.tag.slice(K.tagPre.length);
        if(K.accDef && c.acc === MAIN) delete c.acc;
        it = unmap(c, K.bag ? ["type", "d"] : ["type"], K.ren);
      }
      if(K.bag){
        const d = r.d;
        if(typeof d !== "string") return;
        (st[K.bag][d] = st[K.bag][d] || []).push(it);
      } else st[K.list].push(it);
    });
    st.bals = (Array.isArray(v.balances) ? v.balances : []).map(b => {
      if(!isObj(b)) return b;
      if(b.raw) return clone(b.raw);
      const c = Object.assign({}, b); if(c.acc === MAIN) delete c.acc;
      return unmap(c, [], { w:"acc" });
    });
    st.recur = (Array.isArray(v.recur) ? v.recur : []).map(x => {
      if(!isObj(x)) return x;
      if(x.raw) return clone(x.raw);
      const c = Object.assign({}, x); if(c.acc === MAIN) c.acc = "";
      return unmap(c, [], { cat:"tag", card:"acc" });
    });
    return clone(st);
  }

  const isV2 = o => isObj(o) && Number(o.schema) >= 2 && Array.isArray(o.tx);
  /* đọc dữ liệu đã lưu, dạng nào cũng được → dạng cũ trong bộ nhớ */
  const decode = o => isV2(o) ? fromV2(o) : (o || {});

  /* ---------- lớp đọc thống nhất ----------
     allTx(state): mọi biến động tiền của dạng trong bộ nhớ, cùng một bộ trường (xem đầu file).
     Khoản cất nguyên vẹn (raw) được trải ra để vẫn đọc được amt / t / note. */
  function allTx(st){
    return toV2(st).tx.map(r => r.raw ? Object.assign({}, r.raw, { id:r.id, type:r.type, d:r.d, loan:r.loan, raw:undefined }) : r);
  }
  /* chỉ mục theo ngày, tháng, tài khoản, khoản vay */
  function index(tx){
    const ix = { byDay:{}, byMonth:{}, byAcc:{}, byLoan:{} };
    const add = (m, k, r) => { if(k == null || k === "") return; (m[k] = m[k] || []).push(r); };
    (tx || []).forEach(r => {
      add(ix.byDay, r.d, r);
      add(ix.byMonth, typeof r.d === "string" ? r.d.slice(0, 7) : null, r);
      add(ix.byAcc, r.acc, r);
      if(r.to != null && r.to !== r.acc) add(ix.byAcc, r.to, r);
      add(ix.byLoan, r.loan, r);
    });
    return ix;
  }

  const api = { SCHEMA, MAIN, toV2, fromV2, isV2, decode, allTx, index };
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  else root.N50KData = api;
})(typeof window !== "undefined" ? window : this);
