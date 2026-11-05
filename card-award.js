/* card-award patch v1 · 集卡奖励前端（99 张领取香薰小样套装 · 累计打卡 1000 天自动获得永久 VIP）[norefund][v08]
 * 接入方式见 INTEGRATION.md：只新增本文件 + card-award.css + regions.js，不改 index.html 既有代码。
 * 数据：后端未上线时走 mock（localStorage 持久化，键 card-award-mock-v1，绝不写 App 的 STORE_KEY）；
 * 后端上线后把 window.CARD_AWARD_CONFIG.mode 改为 "live" 并填 apiBase，接口即设计文档 A1–D1。
 * 卡面规则：只显示阿拉伯文，无编号、无译文、无宗教化文案；已收集按获得顺序在前，未获得灰格在后。 */
(function () {
  "use strict";

  /* ================= 配置与开关 ================= */
  var CFG = Object.assign({
    mode: "mock",            // "mock" | "live"
    apiBase: "",             // live 时如 "https://api.example.com"
    regionsUrl: "",          // live 时 D1 地址；空则用 regions.js 的 window.CA_REGIONS
  }, window.CARD_AWARD_CONFIG || {});

  var qs = new URLSearchParams((window.API04_CONFIG && window.API04_CONFIG.dev === true) ? location.search : ""); /* [r10-dev: QA v1.3-dev + PM decisions] URL switches only in dev builds */
  if (qs.get("ca_mode")) CFG.mode = qs.get("ca_mode");
  if (qs.get("ca_api")) CFG.apiBase = qs.get("ca_api");
  var MOCK_N = null; // ?ca_mock=37|52|99 → 演示张数；null = 读真实存档
  if (qs.get("ca_mock")) { var n = parseInt(qs.get("ca_mock"), 10); if (!isNaN(n)) MOCK_N = Math.max(0, Math.min(99, n)); }

  var STORE_KEY = "arabic-study-v1";       // 只读
  var MOCK_KEY = "card-award-mock-v1";     // 本模块专用
  var TOTAL = 99;

  /* ================= 工具 ================= */
  function $(s, r) { return (r || document).querySelector(s); }
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad2(x) { return (x < 10 ? "0" : "") + x; }
  function fmtDate(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function fmtDateTime(ts) { /* api05: contract v0.5 */ /* ISO UTC or ms → Beijing time */
    var t = typeof ts === "string" ? Date.parse(ts) : ts, d = new Date(t + 288e5);
    return d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate()) + " " + pad2(d.getUTCHours()) + ":" + pad2(d.getUTCMinutes()); }
  function bjD(v) { if (typeof v !== "string" || v.indexOf("T") < 0) return v; if (window.API04 && window.API04.bjDate) return window.API04.bjDate(v); var d = new Date(Date.parse(v) + 288e5); return d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate()); }
  function vipView(v) { return v ? Object.assign({}, v, { activatedAt: bjD(v.activatedAt), checkinDeadline: bjD(v.checkinDeadline) }) : v; }
  function addYears(dateStr, y) { var d = new Date(dateStr + "T00:00:00"); d.setFullYear(d.getFullYear() + y); return fmtDate(d); }
  function daysBetween(a, b) { return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000); }
  function uuid() { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); return "ca-" + Date.now() + "-" + Math.random().toString(16).slice(2); }
  function maskPhone(p) { return p && p.length === 11 ? p.slice(0, 3) + "****" + p.slice(7) : p; }

  var toastTimer = 0;
  function toast(msg) {
    var t = $("#ca-toast"); if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }

  /* Lucide 图标：优先复用 App 精灵（#i-*），缺的在本模块精灵里补（ca-i-*，路径为 Lucide/Feather 线性图标） */
  var OWN_ICONS = {
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    "map-pin": '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "rotate-ccw": '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    truck: '<rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    package: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11.5 11 13.5 15 9.5"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'
  };
  var APP_ICONS = { gift: "i-gift", check: "i-check", "chevron-down": "i-chevron-down", "chevron-right": "i-chevron-right", back: "i-arrow-left", x: "i-x", layers: "i-layers", info: "i-info", user: "i-user", award: "i-award", calendar: "i-calendar" };
  function icon(name, cls) {
    var id = APP_ICONS[name] ? "#" + APP_ICONS[name] : "#ca-i-" + name;
    return '<svg class="ic ' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="' + id + '"/></svg>';
  }
  function injectSprite() {
    if ($("#ca-sprite")) return;
    var parts = [];
    Object.keys(OWN_ICONS).forEach(function (k) { parts.push('<symbol id="ca-i-' + k + '" viewBox="0 0 24 24">' + OWN_ICONS[k] + "</symbol>"); });
    var svg = el('<svg id="ca-sprite" style="display:none" aria-hidden="true">' + parts.join("") + "</svg>");
    document.body.appendChild(svg);
  }

  /* ================= mock 状态（本模块专用存储） ================= */
  function mockLoad() {
    var d = { vipActivatedAt: "2026-10-21", claim: null, idem: {} };
    try { var raw = localStorage.getItem(MOCK_KEY); if (raw) d = Object.assign(d, JSON.parse(raw)); } catch (e) {}
    return d;
  }
  function mockSave(d) { try { localStorage.setItem(MOCK_KEY, JSON.stringify(d)); } catch (e) {} }
  /* QA 种子（仅 mock）：?ca_seed=claim|shipped 预置状态，方便验收截图 */
  function applySeed() {
    if (CFG.mode !== "mock" || !qs.get("ca_seed")) return;
    var d = mockLoad(), seed = qs.get("ca_seed");
    var addr = { recipient: "王小明", phone: "13800000000", regionCode: "440305", regionName: "广东省 深圳市 南山区", detailAddress: "科技园示例路 1 号 101 室", note: "" };
    if ((seed === "claim" || seed === "shipped") && !d.claim) {
      d.claim = { status: seed === "shipped" ? "shipped" : "submitted", claimedAt: Date.now() - 86400000 * 2,
        carrier: seed === "shipped" ? "顺丰速运" : null, trackingNo: seed === "shipped" ? "SF1234567890" : null,
        shippedAt: seed === "shipped" ? Date.now() - 86400000 : null, deliveredAt: null, addressChangesUsed: 0, address: addr };
      mockSave(d);
    }
  }

  /* ================= App 存档读取（只读） ================= */
  function appStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch (e) { return {}; }
  }
  /* 卡清单：从现有集卡区 DOM 抓取（id + 阿语名 + 稀有度），与版本解耦 */
  function scrapeCards() {
    var out = [];
    document.querySelectorAll("#collect-fan .cthumb").forEach(function (btn) {
      var id = (btn.id || "").replace("cthumb-", "");
      if (!id) return;
      var nameEl = btn.querySelector(".tcard-nameid");
      var tc = btn.querySelector(".tcard");
      out.push({ id: id, arName: nameEl ? nameEl.textContent.trim() : "", rarity: tc ? tc.getAttribute("data-rarity") || "" : "" });
    });
    return out;
  }
  /* 组装 A1 summary：已收集按获得顺序（store.cards 的顺序即获得顺序）在前，第一张占第 1 格；未获得按卡册原序灰格在后 */
  function buildSummary() {
    var set = scrapeCards();
    var byId = {}; set.forEach(function (c) { byId[c.id] = c; });
    var st = appStore();
    var ownedIds = [], dates = st.cardDates || {};
    if (CFG.mode === "mock" && MOCK_N !== null) {
      set.slice(0, MOCK_N).forEach(function (c, i) {
        ownedIds.push(c.id);
        var d = new Date(2026, 0, 5 + i * 3);
        dates = Object.assign({}, dates); dates[c.id] = fmtDate(d);
      });
    } else {
      (st.cards || []).forEach(function (id) { if (byId[id] && ownedIds.indexOf(id) === -1) ownedIds.push(id); });
    }
    var cards = [];
    ownedIds.forEach(function (id) { cards.push({ id: id, arName: byId[id].arName, rarity: byId[id].rarity, collected: true, awardedAt: dates[id] || null }); });
    set.forEach(function (c) { if (ownedIds.indexOf(c.id) === -1) cards.push({ id: c.id, arName: c.arName, rarity: c.rarity, collected: false, awardedAt: null }); });
    return { collectedCount: ownedIds.length, total: TOTAL, cards: cards, serverNow: new Date().toISOString() };
  }
  function mockVip() {
    var d = mockLoad();
    var deadline = addYears(d.vipActivatedAt, 3);
    var today = fmtDate(new Date());
    return { isVip: true, activatedAt: d.vipActivatedAt, checkinDeadline: deadline, daysRemaining: Math.max(0, daysBetween(today, deadline)), serverNow: new Date().toISOString() };
  }


  /* ================= 接口层 A1–D1（设计文档 §6） ================= */
  function liveFetch(path, opts) { /* api04: contract v0.4 */
    if (window.API04) return window.API04.pFetch(path, opts);
    var e = new Error("NETWORK"); e.code = "NETWORK"; return Promise.reject(e);
  }
  function delay(ms, v) { return new Promise(function (res) { setTimeout(function () { res(v); }, ms); }); }

  var api = {
    summary: function () { // A1
      if (CFG.mode === "live") return liveFetch("/api/v1/collection/summary");
      return delay(200, buildSummary());
    },
    vipStatus: function () { // A2
      if (CFG.mode === "live") return liveFetch("/api/v1/vip/status").then(vipView);
      return delay(120, mockVip());
    },
    incense: function () { // B1
      if (CFG.mode === "live") return liveFetch("/api/v1/rewards/incense");
      return Promise.all([api.summary(), api.vipStatus()]).then(function (r) {
        var d = mockLoad();
        var blockers = [];
        if (r[0].collectedCount < 99) blockers.push("CARDS_INCOMPLETE");
        return { eligible: blockers.length === 0 && !d.claim, blockers: blockers, claim: d.claim };
      });
    },
    claimIncense: function (addr, idem) { // B2
      if (CFG.mode === "live") return liveFetch("/api/v1/rewards/incense/claims", { method: "POST", body: addr, idem: idem });
      var d = mockLoad();
      if (d.claim) { var e = new Error("ALREADY_CLAIMED"); e.code = "ALREADY_CLAIMED"; return Promise.reject(e); }
      d.claim = { status: "submitted", claimedAt: Date.now(), carrier: null, trackingNo: null, shippedAt: null, deliveredAt: null, addressChangesUsed: 0, address: addr };
      mockSave(d);
      return delay(350, { claimId: "mock-" + idem.slice(0, 8), status: "submitted" });
    },
    patchIncenseAddress: function (addr, idem) { // B3（O3：发货前可改一次）
      if (CFG.mode === "live") return liveFetch("/api/v1/rewards/incense/claims/current", { method: "PATCH", body: addr, idem: idem });
      var d = mockLoad();
      if (!d.claim) { var e1 = new Error("NOT_CLAIMED"); e1.code = "NOT_CLAIMED"; return Promise.reject(e1); }
      if ((d.claim.status !== "submitted" && d.claim.status !== "under_review") || (d.claim.addressChangesUsed || 0) >= 1) { var e2 = new Error("CLAIM_LOCKED"); e2.code = "CLAIM_LOCKED"; return Promise.reject(e2); }
      d.claim.address = addr; d.claim.addressChangesUsed = (d.claim.addressChangesUsed || 0) + 1;
      mockSave(d);
      return delay(350, { claim: d.claim });
    },
    lifetimeProgress: function () { /* [v08 §4.2] GET /api/v1/lifetime/progress (read-only) */
      if (CFG.mode === "live") return liveFetch("/api/v1/lifetime/progress");
      var st = appStore(), vip = mockVip(), days = (st.checkins || []).length;
      return delay(80, { status: days >= 1000 ? "granted" : "in_progress", validDays: days, requiredDays: 1000, deadline: vip.checkinDeadline, onTrack: true, vipActiveToday: true, lifetimeVip: { granted: days >= 1000 } });
    },
    regions: function () { // D1
      if (CFG.mode === "live" && CFG.regionsUrl) return fetch(CFG.regionsUrl).then(function (r) { return r.json(); });
      if (CFG.mode === "live" && window.API04) return window.API04.request("GET", "/api/v1/regions"); /* api04: D1 via envelope */
      return delay(50, window.CA_REGIONS || []);
    }
  };

  var ERR_TEXT = {
    NOT_VIP: "该奖励为 VIP 专属", ALREADY_CLAIMED: "已经领取过了", ALREADY_APPLIED: "已经提交过申请",
    CARDS_INCOMPLETE: "卡还没有集齐", COURSES_INCOMPLETE: "课程还没有学完",
    ADDRESS_INVALID: "地址信息有误，请检查", ADDRESS_LOCKED: "地址已不能再修改", CLAIM_LOCKED: "地址已不能再修改", NETWORK: "网络不稳，请重试"
  };
  function errText(e) { var c = e && e.code; return ERR_TEXT[c] || (window.API04 && c ? window.API04.errText(c, e.status) : ERR_TEXT.NETWORK); }

  /* ================= 视图框架 ================= */
  var root = null, stack = [];
  function panel(id, title, bodyHtml) {
    var p = el('<section class="ca-panel" id="' + id + '" aria-hidden="true">' +
      '<div class="ca-head"><button type="button" class="ca-iconbtn" data-ca-back aria-label="返回">' + icon("back") + '</button>' +
      '<div class="ca-head-title">' + esc(title) + '</div><span style="width:36px;flex:0 0 auto"></span></div>' +
      '<div class="ca-body" id="' + id + '-body">' + bodyHtml + "</div></section>");
    p.querySelector("[data-ca-back]").addEventListener("click", closeTop);
    root.appendChild(p);
    return p;
  }
  function openPanel(id) {
    var p = document.getElementById(id); if (!p) return;
    if (stack[stack.length - 1] !== id) stack.push(id);
    root.appendChild(p); // 置顶：后打开的面板盖住先前的（同 z-index 按 DOM 序层叠）
    p.classList.add("open"); p.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeTop() {
    var id = stack.pop();
    if (id) { var p = document.getElementById(id); if (p) { p.classList.remove("open"); p.setAttribute("aria-hidden", "true"); } }
    if (!stack.length) { document.body.style.overflow = ""; refreshEntry(); }
    else if (stack[stack.length - 1] === "ca-collect") loadCollectData();
  }
  function refreshEntry() {
    var c = $("#ca-entry-count"); if (!c) return;
    Promise.all([api.summary(), api.vipStatus()]).then(function (r) {
      state.summary = r[0]; state.vip = r[1];
      c.textContent = r[0].collectedCount + "/" + r[0].total;
      var cd = $("#ca-entry-countdown"); if (cd && r[1] && r[1].isVip) cd.textContent = countdownText(r[1]);
    }).catch(function () {});
  }
  document.addEventListener("click", function (ev) { var w = ev.target.closest && ev.target.closest(".ca-input"); if (!w || w.classList.contains("pick") || /^(INPUT|TEXTAREA)$/.test(ev.target.tagName)) return; var i = w.querySelector("input,textarea"); if (i) i.focus(); });
  function closeAll() { while (stack.length) closeTop(); }

  var sheetMask = null;
  function showSheet(html) {
    sheetMask.innerHTML = '<div class="ca-sheet"><div class="ca-sheet-grip"></div>' + html + "</div>";
    sheetMask.classList.add("open");
  }
  function hideSheet() { sheetMask.classList.remove("open"); sheetMask.innerHTML = ""; }

  var state = { summary: null, vip: null, incense: null, checkin: null };

  function checkinText(c) { /* 「已打卡 X / 1000 天 · 截止 YYYY-MM-DD」(Beijing business date) or the lifetime VIP state */
    if (!c || c.status === "not_started") return "";
    if (c.grantPending) return "已打卡 " + c.validDays + " / " + (c.requiredDays || 1000) + " 天 · 终身 VIP 审核中"; /* [add25 E2a] */
    if (c.status === "granted" || (c.lifetimeVip && c.lifetimeVip.granted)) return "已获得终身 VIP · 累计打卡 " + c.validDays + " 天";
    var t = "已打卡 " + c.validDays + " / " + (c.requiredDays || 1000) + " 天 · 截止 " + bjD(c.deadline);
    if (c.status === "expired") return t + " · 已截止";
    if (c.vipActiveToday === false) return t + " · 续费后才会累计";
    if (c.onTrack === false) return t + " · 已无法在期限内满 1000 天";
    return t;
  }
  function loadCheckin(vip) { return vip && vip.isVip ? api.lifetimeProgress().catch(function () { return null; }) : Promise.resolve(null); }


  /* ================= 入口卡（我的） ================= */
  function renderEntry() {
    var anchor = document.getElementById("collect-card");
    if (!anchor || document.getElementById("ca-entry")) return;
    var entry = el('<button type="button" class="ca-entry" id="ca-entry">' +
      '<span class="ca-entry-head"><span class="me-ic">' + icon("award") + '</span>' +
      '<span class="ca-entry-title">集卡奖励</span>' +
      '<span class="ca-entry-count" id="ca-entry-count">–/99</span>' +
      '<span class="collect-chev" aria-hidden="true">' + icon("chevron-right") + "</span></span>" +
      '<span class="ca-entry-sub" id="ca-entry-sub" style="display:none">' + icon("clock") + '<span id="ca-entry-countdown"></span></span></button>');
    anchor.parentNode.insertBefore(entry, anchor.nextSibling);
    entry.addEventListener("click", openCollect);
    Promise.all([api.summary(), api.vipStatus()]).then(function (r) {
      state.summary = r[0]; state.vip = r[1];
      var c = $("#ca-entry-count"); if (c) c.textContent = r[0].collectedCount + "/" + r[0].total;
      loadCheckin(r[1]).then(function (ck) {
        state.checkin = ck; var sub = $("#ca-entry-sub"), cd = $("#ca-entry-countdown");
        if (ck && sub && cd) { cd.textContent = checkinText(ck); sub.style.display = "flex"; }
      });
    }).catch(function () {});
  }

  /* ================= 集卡页 ================= */
  var RARITY_LABEL = { legendary: "传说", rare: "稀有", common: "普通" };
  function openCollect() {
    openPanel("ca-collect");
    $("#ca-collect-body").innerHTML = '<div class="ca-hero"><div class="ca-skel" style="width:40%"></div><div class="ca-skel" style="width:60%;margin-top:10px;height:30px"></div><div class="ca-skel" style="margin-top:12px"></div></div>';
    loadCollectData();
  }
  function loadCollectData() {
    Promise.all([api.summary(), api.vipStatus(), api.incense()]).then(function (r) {
      return loadCheckin(r[1]).then(function (ck) { r.push(ck); return r; });
    }).then(function (r) {
      state.summary = r[0]; state.vip = r[1]; state.incense = r[2]; state.checkin = r[3];
      if (stack[stack.length - 1] === "ca-collect") renderCollect();
    }).catch(function (err) {
      var c = err && err.code, body = $("#ca-collect-body");
      if (c === "UNAUTHORIZED" || c === "TOKEN_INVALID" || c === "TOKEN_EXPIRED" || c === "CONSENT_REQUIRED") {
        body.innerHTML = '<p class="ca-note" style="margin-top:14px">' + esc(errText(err)) + '。本地卡册照常可用；集卡奖励需要登录' + (c === "CONSENT_REQUIRED" ? "并完成监护人同意" : "") + '。</p><div class="ca-spacer"></div><button type="button" class="ca-btn" id="ca-login-btn">' + (c === "CONSENT_REQUIRED" ? "去完成监护人同意" : "登录 / 注册") + '</button>';
        $("#ca-login-btn").addEventListener("click", function () { closeAll(); if (window.API04UI) window.API04UI.open(); });
      } else body.innerHTML = '<p class="ca-note">' + esc(errText(err)) + '，请返回后重试。</p>';
    });
  }
  function renderCollect() {
    var body = $("#ca-collect-body"), sum = state.summary, vip = state.vip, inc = state.incense;
    var n = sum.collectedCount, nv = sum.verifiedCount != null ? sum.verifiedCount : n;
    var incRight, incSub, ck = state.checkin, AR = (inc && inc.cardsRequired) || 99, ac = inc && inc.cardsCollected != null ? inc.cardsCollected : nv; /* v0.8 §5.4 B1 */
    if (inc && inc.claim) {
      incRight = '<span class="ca-pill">' + esc({ under_review: "已领取 · 审核中", /* [add25] */ submitted: "已领取 · 待发货", shipped: "已领取 · 已发货", delivered: "已领取 · 已签收", cancelled: "已取消" }[inc.claim.status] || "已领取") + "</span>";
      incSub = "每账号限领一次 · 已领取";
    } else if (ac >= AR && inc && inc.blockers && inc.blockers.indexOf("VIP_INACTIVE") >= 0) {
      incRight = '<span class="ca-pill">' + esc(errText({ code: "VIP_INACTIVE" })) + "</span>"; incSub = "续费后即可领取";
    } else if (ac >= AR) {
      incRight = '<span class="ca-pill ink">领取</span>'; incSub = "已达标 · 可以领取";
    } else {
      incRight = '<span class="ca-pill">还差 ' + (AR - ac) + " 张</span>"; incSub = "每账号限领一次 · 填写收货信息后寄出";
    }
    body.innerHTML =
      '<div class="ca-hero"><div class="ca-hero-label">已收集</div>' +
      '<div class="ca-hero-num"><b>' + n + '</b><span>/' + sum.total + "</span></div>" +
      '<div class="ca-bar"><i style="width:' + (n / sum.total * 100) + '%"></i></div>' +
      (ck ? '<div class="ca-count-line" id="ca-checkin-line">' + icon(ck.status === "granted" ? "award" : "calendar") + "<span>" + esc(checkinText(ck)) + "</span></div>" : "") + "</div>" +
      '<div class="ca-miles">' +
      '<button type="button" class="ca-mile" id="ca-mile-incense"><span class="ca-mile-tile">' + icon("gift") + '</span>' +
      '<span class="ca-mile-main"><span class="ca-mile-title">集齐 ' + AR + ' 张即可领取香薰小样套装 · ' + ac + '/' + AR + '</span><span class="ca-mile-line2"><span class="ca-mile-sub">' + incSub + "</span>" + incRight + "</span></span></button>" +
      "" + "</div>" +
      '<div class="ca-album-head"><span class="ca-album-title">我的卡册</span><span class="ca-album-count">' + n + "/" + sum.total + "</span></div>" +
      (sum.withheldCount > 0 && !(vip && vip.isVip) ? '<p class="ca-pending-line">' + icon("clock") + "<span>另有 " + sum.withheldCount + " 张开通 VIP 后发放（免费账号最多点亮 " + (sum.freeCap || 8) + " 张）</span></p>" : "") +
      '<div class="ca-grid-wrap"><div class="ca-grid" id="ca-grid"></div></div>' +
      '<p class="ca-note" style="margin-top:8px">已收集的卡按获得顺序排在前面，未获得的是灰格。点已获得的卡看详情。</p>';
    var grid = $("#ca-grid");
    sum.cards.forEach(function (c) {
      var cell = el('<button type="button" class="ca-cell' + (c.collected ? " got" : c.withheld ? " pending" : "") + '"' + (c.withheld ? ' aria-label="开通 VIP 后发放"' : "") + '><span class="ca-cell-name" dir="rtl" lang="ar">' + esc(c.arName) + "</span></button>");
      cell.addEventListener("click", function () {
        if (c.withheld) { toast("开通 VIP 后发放"); return; }
        if (!c.collected) { toast("尚未获得这张卡"); return; }
        showSheet('<div class="ca-card-detail"><div class="ca-big-name" dir="rtl" lang="ar">' + esc(c.arName) + "</div>" +
          '<div class="ca-detail-sub">' + (c.rarity && RARITY_LABEL[c.rarity] ? "稀有度 · " + RARITY_LABEL[c.rarity] + "　" : "") + (c.awardedAt ? "获得于 " + esc(bjD(c.awardedAt)) : "") + "</div></div>" +
          '<button type="button" class="ca-btn ghost" id="ca-sheet-close" style="margin-top:14px">关闭</button>');
        $("#ca-sheet-close").addEventListener("click", hideSheet);
      });
      grid.appendChild(cell);
    });
    $("#ca-mile-incense").addEventListener("click", function () {
      if (state.incense && state.incense.claim) openIncenseStatus();
      else if (state.incense && state.incense.eligible) openIncenseForm("new");
      else toast(state.incense && state.incense.blockers && state.incense.blockers.indexOf("VIP_INACTIVE") >= 0 && (state.incense.cardsCollected || 0) >= (state.incense.cardsRequired || 99) ? errText({ code: "VIP_INACTIVE" }) : "还差 " + ((state.incense && state.incense.cardsRequired || 99) - (state.incense && state.incense.cardsCollected != null ? state.incense.cardsCollected : nv)) + " 张可以领取香薰小样套装");
    });

  }

  /* ================= 香薰：地址表单 ================= */
  var formState = { mode: "new", region: { p: null, c: null, d: null }, idem: null, draft: {} };
  function fieldHtml(id, label, inner, errId) {
    return '<div class="ca-field"><label for="' + id + '">' + label + '</label>' + inner +
      '<div class="ca-error-text" id="' + errId + '"></div></div>';
  }
  function openIncenseForm(mode) {
    formState.mode = mode; formState.idem = uuid();
    var claim = state.incense && state.incense.claim;
    var a = (mode === "edit" && claim && claim.address) || formState.draft || {};
    formState.region = { p: null, c: null, d: null };
    openPanel("ca-incense");
    var body = $("#ca-incense-body");
    body.innerHTML =
      '<div class="ca-prize"><span class="ca-prize-thumb">实物图</span><span><span style="font-size:14.5px;font-weight:700">香薰小样套装</span><br>' +
      '<span class="ca-note">集齐 99 张可领取 · 每账号限领一次 · 大陆地区包邮</span></span></div>' +
      '<div class="ca-body-scroll" style="margin:0 -20px;padding:0 20px">' +
      fieldHtml("ca-f-recipient", "收货人", '<div class="ca-input" id="ca-w-recipient">' + icon("user") + '<input id="ca-f-recipient" type="text" maxlength="20" placeholder="请填写收货人姓名" value="' + esc(a.recipient || "") + '"></div>', "ca-e-recipient") +
      fieldHtml("ca-f-phone", "手机号", '<div class="ca-input" id="ca-w-phone">' + icon("phone") + '<input id="ca-f-phone" type="tel" inputmode="numeric" maxlength="11" placeholder="' + (mode === "edit" ? "不改可留空" + (a.phoneMasked ? "（当前 " + esc(a.phoneMasked) + "）" : "") : "11 位手机号") + '" value="' + esc(mode === "edit" ? "" : (a.phone || "")) + '"></div>', "ca-e-phone") +
      fieldHtml("ca-f-region", "省 / 市 / 区", '<button type="button" class="ca-input pick" id="ca-w-region">' + icon("map-pin") + '<span class="ca-pick-val ph" id="ca-region-val">请选择省 / 市 / 区</span>' + icon("chevron-down") + "</button>", "ca-e-region") +
      '<div id="ca-district-text-wrap" style="display:none">' + fieldHtml("ca-f-district-text", "区 / 县", '<div class="ca-input">' + icon("map-pin") + '<input id="ca-f-district-text" type="text" maxlength="20" placeholder="请填写区 / 县名称"></div>', "ca-e-district-text") + "</div>" +
      fieldHtml("ca-f-detail", "详细地址", '<div class="ca-input" id="ca-w-detail">' + icon("map-pin") + '<input id="ca-f-detail" type="text" maxlength="60" placeholder="街道、门牌号" value="' + esc(a.detailAddress || "") + '"></div>', "ca-e-detail") +
      fieldHtml("ca-f-note", "备注（选填）", '<div class="ca-input"><input id="ca-f-note" type="text" maxlength="30" placeholder="如：快递柜 / 放门口" value="' + esc(a.note || "") + '"></div>', "ca-e-note") +
      '<div class="ca-privacy">' + icon("info") + "<span>地址只用于本次奖品寄送 · 《隐私说明》</span></div>" +
      (mode === "edit" ? '<p class="ca-note" style="margin-top:8px">发货前可修改一次地址，这是第 1 次修改机会。</p>' : "") +
      '<div style="height:14px"></div><button type="button" class="ca-btn" id="ca-incense-submit">' + (mode === "edit" ? "保存新地址" : "提交领取") + "</button><div style='height:6px'></div></div>";
    if (a.regionName) { $("#ca-region-val").textContent = a.regionName; $("#ca-region-val").classList.remove("ph"); formState.regionName = a.regionName; formState.regionCode = a.regionCode || ""; }
    $("#ca-w-region").addEventListener("click", openRegionPicker);
    $("#ca-incense-submit").addEventListener("click", submitIncenseForm);
  }
  function setErr(wrapId, errId, msg) {
    var w = document.getElementById(wrapId), e = document.getElementById(errId);
    if (w) w.classList.toggle("err", !!msg);
    if (e) { e.textContent = msg || ""; e.classList.toggle("show", !!msg); }
    return !msg;
  }
  function collectAddress() {
    var recipient = $("#ca-f-recipient").value.trim();
    var phone = $("#ca-f-phone").value.trim();
    var detail = $("#ca-f-detail").value.trim();
    var note = $("#ca-f-note").value.trim();
    var ok = true;
    ok = setErr("ca-w-recipient", "ca-e-recipient", recipient.length >= 2 && recipient.length <= 20 ? "" : "请填写收货人姓名") && ok;
    var keepPhone = formState.mode === "edit" && !phone;
    ok = setErr("ca-w-phone", "ca-e-phone", keepPhone || /^1\d{10}$/.test(phone) ? "" : "请填写 11 位手机号") && ok;
    var regionName = formState.regionName || "", regionCode = formState.regionCode || "";
    var districtTextEl = $("#ca-f-district-text");
    if (districtTextEl && $("#ca-district-text-wrap").style.display !== "none") {
      var dt = districtTextEl.value.trim();
      ok = setErr(null, "ca-e-district-text", dt.length >= 2 ? "" : "请填写区 / 县名称") && ok;
      if (dt) { regionName = regionName + " " + dt; }
    }
    ok = setErr("ca-w-region", "ca-e-region", regionName ? "" : "请选择省 / 市 / 区") && ok;
    ok = setErr("ca-w-detail", "ca-e-detail", detail.length >= 5 && detail.length <= 60 ? "" : "请填写详细地址（至少 5 个字）") && ok;
    if (!ok) return null;
    formState.draft = { recipient: recipient, phone: phone, regionCode: regionCode, regionName: regionName, detailAddress: detail, note: note };
    if (keepPhone) { delete formState.draft.phone; var cur = state.incense && state.incense.claim && state.incense.claim.address; formState.shownPhone = (cur && cur.phoneMasked) || ""; } else formState.shownPhone = phone;
    return formState.draft;
  }
  function submitIncenseForm() {
    var addr = collectAddress(); if (!addr) return;
    showSheet('<div class="ca-sheet-title">' + (formState.mode === "edit" ? "确认新地址" : "确认收货地址") + "</div>" +
      '<div class="ca-sheet-line">' + esc(addr.recipient) + " · " + esc(formState.shownPhone || addr.phone || "") + (addr.phone ? "" : "（不变）") + "<br>" + esc(addr.regionName) + " " + esc(addr.detailAddress) + "</div>" +
      (formState.mode === "new" ? '<div class="ca-sheet-line" style="margin-top:6px;color:var(--ink,#2B2B2E)">每账号限领一次，提交后发货前可修改一次地址。</div>' : "") +
      '<button type="button" class="ca-btn" id="ca-confirm-btn" style="margin-top:14px">' + (formState.mode === "edit" ? "确认修改" : "确认领取") + "</button>" +
      '<button type="button" class="ca-btn ghost" id="ca-cancel-btn" style="margin-top:8px">再检查一下</button>');
    $("#ca-cancel-btn").addEventListener("click", hideSheet);
    $("#ca-confirm-btn").addEventListener("click", function () {
      var btn = this; btn.disabled = true; btn.textContent = "提交中…";
      var call = formState.mode === "edit" ? api.patchIncenseAddress(addr, formState.idem) : api.claimIncense(addr, formState.idem);
      call.then(function () {
        hideSheet(); formState.draft = {};
        return api.incense().then(function (inc) {
          state.incense = inc;
          toast(formState.mode === "edit" ? "地址已修改" : "领取成功");
          closeTop(); openIncenseStatus();
        });
      }).catch(function (e) { hideSheet(); toast(errText(e)); if (e.code === "ALREADY_CLAIMED") { api.incense().then(function (inc) { state.incense = inc; closeTop(); openIncenseStatus(); }); } });
    });
  }
  /* 地区三级联动（D1 数据；城市无下级数据时区县改手填） */
  var pickerSel = { p: null, c: null, d: null };
  function openRegionPicker() {
    api.regions().then(function (regions) {
      pickerSel = { p: null, c: null, d: null };
      showSheet('<div class="ca-sheet-title">选择省 / 市 / 区</div><div class="ca-region-cols" id="ca-region-cols"></div>' +
        '<button type="button" class="ca-btn" id="ca-region-done" style="margin-top:12px">完成</button>');
      var cols = $("#ca-region-cols");
      function colHtml(list, key) {
        return '<div class="ca-region-col" data-col="' + key + '">' + (list || []).map(function (o, i) {
          return '<button type="button" class="ca-region-opt' + (pickerSel[key] === o ? " sel" : "") + '" data-idx="' + i + '">' + esc(o.name) + "</button>";
        }).join("") + "</div>";
      }
      function draw() {
        cols.innerHTML = colHtml(regions, "p") +
          colHtml(pickerSel.p ? pickerSel.p.children || [] : [], "c") +
          colHtml(pickerSel.c ? pickerSel.c.children || [] : [], "d");
        cols.querySelectorAll(".ca-region-opt").forEach(function (b) {
          b.addEventListener("click", function () {
            var col = b.parentNode.getAttribute("data-col"), idx = +b.getAttribute("data-idx");
            if (col === "p") { pickerSel.p = regions[idx]; pickerSel.c = null; pickerSel.d = null; }
            if (col === "c") { pickerSel.c = pickerSel.p.children[idx]; pickerSel.d = null; }
            if (col === "d") { pickerSel.d = pickerSel.c.children[idx]; }
            draw();
          });
        });
      }
      draw();
      $("#ca-region-done").addEventListener("click", function () {
        if (!pickerSel.p || !pickerSel.c) { toast("请选满省和市"); return; }
        var needDistrictPick = (pickerSel.c.children || []).length > 0;
        if (needDistrictPick && !pickerSel.d) { toast("请选择区 / 县"); return; }
        formState.region = pickerSel;
        formState.regionName = pickerSel.p.name + " " + pickerSel.c.name + (pickerSel.d ? " " + pickerSel.d.name : "");
        formState.regionCode = (pickerSel.d || pickerSel.c).code;
        var v = $("#ca-region-val"); v.textContent = formState.regionName; v.classList.remove("ph");
        $("#ca-district-text-wrap").style.display = needDistrictPick ? "none" : "block";
        setErr("ca-w-region", "ca-e-region", "");
        hideSheet();
      });
    });
  }

  /* ================= 香薰：状态页 ================= */
  function tlRow(dot, title, sub, off, last) {
    return '<div class="ca-tl-row' + (off ? " off" : "") + (last ? " last" : "") + '"><span class="ca-tl-dot ' + dot + '">' +
      (dot === "done" ? icon("check") : "") + '</span><span class="ca-tl-main"><span class="ca-tl-title">' + esc(title) +
      '</span>' + (sub ? '<span class="ca-tl-sub" style="display:block">' + sub + "</span>" : "") + "</span></div>";
  }
  function openIncenseStatus() {
    openPanel("ca-incense-status");
    api.incense().then(function (inc) {
      state.incense = inc;
      var body = $("#ca-incense-status-body"), claim = inc.claim;
      if (!claim) { body.innerHTML = '<p class="ca-note">还没有领取记录。</p>'; return; }
      var statusName = { under_review: "审核中", submitted: "待发货", shipped: "已发货", delivered: "已签收", cancelled: "已取消" }[claim.status] || claim.status;
      var rows = "";
      rows += tlRow("done", "已提交", esc(fmtDateTime(claim.claimedAt)) + " · 地址已确认", false, false);
      if (claim.status === "under_review") { /* [add25 B1] */
        rows += tlRow("current", "审核中", "核对完成后安排发货", false, false);
        rows += tlRow("todo", "待发货", "审核通过后打包发出", false, false);
        rows += tlRow("todo", "待签收", "签收后状态自动更新", true, true);
      } else if (claim.status === "cancelled") {
        rows += tlRow("current", "已取消", esc(claim.cancelReason || "如有疑问请联系客服"), true, true);
      } else if (claim.status === "submitted") {
        rows += tlRow("current", "待发货", "平台打包中", false, false);
        rows += tlRow("todo", "待签收", "签收后状态自动更新", true, true);
      } else {
        rows += tlRow("done", "已发货", esc(claim.carrier || "") + " · " + esc(claim.trackingNo || "") +
          ' <button type="button" class="ca-btn small ghost" id="ca-copy-track" style="height:26px;font-size:11px;padding:0 10px;margin-left:6px">复制单号</button>', false, false);
        rows += claim.status === "delivered" ? tlRow("done", "已签收", esc(fmtDateTime(claim.deliveredAt || claim.shippedAt)), false, true)
                                             : tlRow("current", "待签收", "签收后状态自动更新", true, true);
      }
      var canEdit = (claim.status === "submitted" || claim.status === "under_review") && (claim.addressChangesUsed || 0) < 1; /* [add25 B1.5] */
      body.innerHTML =
        '<div class="ca-prize"><span class="ca-prize-thumb">' + icon("gift") + '</span><span style="flex:1"><span style="font-size:14.5px;font-weight:700">香薰小样套装</span><br>' +
        '<span class="ca-note">每账号限领一次</span></span><span class="ca-pill">' + esc(statusName) + "</span></div>" +
        '<div class="ca-timeline">' + rows + "</div>" +
        '<div class="ca-info-card"><div class="ca-info-row">' + icon("map-pin") + "<span><b>" + esc(claim.address.recipient) + "</b> · " + esc(claim.address.phoneMasked || maskPhone(claim.address.phone)) + "</span></div>" +
        '<div class="ca-info-row"><span style="margin-left:30px" class="ca-note">' + esc(claim.address.regionName) + " " + esc(claim.address.detailAddress) + "</span></div></div>" +
        (canEdit ? '<button type="button" class="ca-btn ghost" id="ca-edit-addr" style="margin-top:14px">修改地址（发货前可改一次）</button>'
                 : claim.status === "submitted" ? '<p class="ca-note" style="margin-top:12px">地址已修改过一次，不能再改。</p>' : "") +
        '<div class="ca-spacer"></div><button type="button" class="ca-btn ghost" id="ca-incense-service">联系客服</button>';
      var cp = $("#ca-copy-track");
      if (cp) cp.addEventListener("click", function () { if (navigator.clipboard) navigator.clipboard.writeText(claim.trackingNo || ""); toast("运单号已复制"); });
      var ed = $("#ca-edit-addr");
      if (ed) ed.addEventListener("click", function () { openIncenseForm("edit"); });
      $("#ca-incense-service").addEventListener("click", function () { toast("客服入口沿用 App 现有渠道"); });
    }).catch(function () { $("#ca-incense-status-body").innerHTML = '<p class="ca-note">加载失败，请返回后重试。</p>'; });
  }

  /* ================= 初始化 ================= */
  function buildDom() {
    root = el('<div id="card-award-root"></div>');
    document.body.appendChild(root);
    panel("ca-collect", "集卡", "");
    panel("ca-incense", "领取香薰小样套装", "");
    panel("ca-incense-status", "香薰小样领取状态", "");
    sheetMask = el('<div class="ca-sheet-mask" id="ca-sheet-mask"></div>');
    sheetMask.addEventListener("click", function (e) { if (e.target === sheetMask) hideSheet(); });
    document.body.appendChild(sheetMask);
    document.body.appendChild(el('<div class="ca-toast" id="ca-toast"></div>'));
  }
  function init() {
    injectSprite(); applySeed(); buildDom();
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      var ready = document.getElementById("collect-card") && document.querySelectorAll("#collect-fan .cthumb").length > 0;
      if (ready || tries > 40) { clearInterval(timer); renderEntry(); }
    }, 300);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
