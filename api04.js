/* api04.js — v1.3-dev integration layer, now contract v0.5 (drafts/api_contract_v05.md). [api05: contract v0.5 applied]
   ONE flag: window.API04_CONFIG.mock (default true). mock=true → in-page mock server that follows the contract
   (paths, {ok,data}/{ok:false,code,message} envelope, HTTP status, error codes). mock=false → real gateway:
   fetch(base + path) with Authorization: Bearer + X-Device-Id, no cookies.
   Never touches localStorage["arabic-study-v1"] keys/structure except through the app's own merge+saveStore after sync. */
(function () {
  "use strict"; /* [v08-add1] */ /* [v08c] */
  var CFG = Object.assign({ mock: true, base: "" /* e.g. https://<env>.service.tcloudbase.com/api */ }, window.API04_CONFIG || {});
  var AUTH_KEY = "arabic-auth-v1", TICKET_KEY = "arabic-consent-ticket", MOCK_DB = "api04-mock-server-v1";
  var PHONE_RE = /^1\d{10}$/;

  /* ---------- error copy (contract §5 + P's codes); shown in neutral ink ---------- */
  var ERR_ZH = { /* [v08: contract v0.8 final — §7 parent_verify, §9 codes; deprecated codes removed] */
    BAD_REQUEST: "请求有误，请检查后重试", PHONE_INVALID: "手机号格式不对", BIRTH_DATE_INVALID: "请选择正确的出生日期",
    CODE_WRONG: "验证码不对", CODE_EXPIRED: "验证码已过期，请重新获取", CODE_LOCKED: "尝试次数过多，请重新获取验证码", CODE_USED: "验证码已使用，请重新获取",
    PARENT_SAME_AS_CHILD: "家长手机号不能和孩子的相同", PARENT_TICKET_REQUIRED: "未满 14 岁需家长手机验证", PARENT_TICKET_INVALID: "家长验证无效，请重新验证",
    PARENT_TICKET_EXPIRED: "家长验证已过期，请重新验证", PARENT_TICKET_USED: "家长验证已使用，请重新验证", PARENT_TICKET_MISMATCH: "孩子手机号已更改，请重新做家长验证", PARENT_TICKET_DEVICE_MISMATCH: "请在做家长验证的同一台设备上完成注册", DEVICE_ID_REQUIRED: "设备信息缺失，请刷新页面后重试", IDEMPOTENCY_KEY_REQUIRED: "请求不完整，请再试一次", CAPTCHA_REQUIRED: "请先完成滑动验证", PARENT_PHONE_LIMIT: "已转人工复核，通过后即可继续", PARENT_PHONE_LIMIT_DAILY: "这个家长手机号今天的验证码已用完，可明天再试或换一个家长手机号", BIRTH_DATE_LOCKED: "出生日期已填写，如需修改请联系客服", PARENT_VERIFY_NOT_NEEDED: "无需家长验证", /* [add25] */ CAPTCHA_UNAVAILABLE: "验证服务暂时不可用，请稍后重试", ISSUE_INVALID: "题目已失效，请重新开始练习", SCOPE_NOT_COMPLETED: "完成这一课后就能练习" /* [scope-422] v0.8.6: missing / unpublished / not-completed course → 422, friendly text, no popup */, INVALID_STATE: "状态已变化，请刷新后重试", BAD_STATUS: "当前状态不能进行这个操作",
    NO_CODE: "请先获取验证码", ADDRESS_INVALID: "地址信息有误，请检查", PAYLOAD_TOO_LARGE_LIST: "数据条目过多",
    UNAUTHORIZED: "请先登录", TOKEN_EXPIRED: "登录已过期，请重新登录", TOKEN_INVALID: "登录状态无效，请重新登录",
    ACCOUNT_FROZEN: "账号已冻结，请联系客服", ACCOUNT_BANNED: "账号已停用，请联系客服", FORBIDDEN: "没有权限", NOT_FOUND: "没有找到相关记录",
    PHONE_REGISTERED: "该手机号已注册，请直接登录", PHONE_NOT_REGISTERED: "该手机号还没有注册，请先注册", PHONE_REQUIRED: "请先绑定手机号",
    ALREADY_CLAIMED: "已经领取过了", NOT_CLAIMED: "还没有领取记录", CLAIM_LOCKED: "地址已不能再修改", ADDRESS_LOCKED: "地址已不能再修改",
    CARDS_INCOMPLETE: "还没有集齐 99 张卡", VIP_INACTIVE: "VIP 有效期内才能领取", NOT_VIP: "该功能为 VIP 专属",
    IMPORT_USED: "本机卡片已导入过", IDEMPOTENCY_MISMATCH: "请求冲突，请刷新后重试", DUPLICATE_CARD_IDS: "卡片数据有重复，请重试",
    STUDY_REJECTED: "学习记录未通过校验", ATTEMPT_INVALIDATED: "本次测验已失效", SCHEMA_TOO_NEW: "数据版本过新，请更新到最新版本",
    TOO_MANY: "今天的次数已用完，请明天再试", TOO_FREQUENT: "操作太频繁，请稍后再试", INTERNAL: "网络不稳，请重试", NETWORK: "网络不稳，请重试",
    REFUND_DISCONTINUED: "该功能已下线。有效打卡满 1000 天将自动获得终身 VIP", GUARDIAN_DISCONTINUED: "该功能已下线", MAKEUP_DISCONTINUED: "补签已取消", GONE: "该功能已下线"
  };
  var STATUS = { BAD_REQUEST: 400, PHONE_INVALID: 400, BIRTH_DATE_INVALID: 400, CODE_WRONG: 400, CODE_EXPIRED: 400, CODE_LOCKED: 400, PARENT_SAME_AS_CHILD: 400, PARENT_TICKET_INVALID: 400, ADDRESS_INVALID: 400, PAYLOAD_TOO_LARGE_LIST: 400, DUPLICATE_CARD_IDS: 400, NO_CODE: 400,
    UNAUTHORIZED: 401, TOKEN_EXPIRED: 401, TOKEN_INVALID: 401, ACCOUNT_FROZEN: 403, ACCOUNT_BANNED: 403, FORBIDDEN: 403,
    NOT_FOUND: 404, NOT_CLAIMED: 404, PHONE_NOT_REGISTERED: 404, PHONE_REGISTERED: 409, CODE_USED: 409, ALREADY_CLAIMED: 409, IMPORT_USED: 409, IDEMPOTENCY_MISMATCH: 409, PARENT_TICKET_USED: 409,
    REFUND_DISCONTINUED: 410, GUARDIAN_DISCONTINUED: 410, MAKEUP_DISCONTINUED: 410, GONE: 410,
    PARENT_TICKET_REQUIRED: 422, CAPTCHA_REQUIRED: 400, DEVICE_ID_REQUIRED: 400, IDEMPOTENCY_KEY_REQUIRED: 400, PARENT_TICKET_DEVICE_MISMATCH: 403, PARENT_PHONE_LIMIT: 429, BIRTH_DATE_LOCKED: 409, PARENT_VERIFY_NOT_NEEDED: 409, PARENT_TICKET_EXPIRED: 422, PARENT_TICKET_MISMATCH: 422, CARDS_INCOMPLETE: 422, VIP_INACTIVE: 422, NOT_VIP: 422, CLAIM_LOCKED: 422, ADDRESS_LOCKED: 422, PHONE_REQUIRED: 422, STUDY_REJECTED: 422, ATTEMPT_INVALIDATED: 422, SCHEMA_TOO_NEW: 422,
    TOO_MANY: 429, TOO_FREQUENT: 429, INTERNAL: 500, CAPTCHA_UNAVAILABLE: 503, ISSUE_INVALID: 400, SCOPE_NOT_COMPLETED: 422, INVALID_STATE: 422, BAD_STATUS: 422 };
  function errText(code, status) { return ERR_ZH[code] || (status === 410 ? "该功能已下线" : ERR_ZH.NETWORK); }

  /* ---------- token store (arabic-auth-v1 only) ---------- */
  function authLoad() { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null") || {}; } catch (e) { return {}; } }
  function authSave(a) { try { localStorage.setItem(AUTH_KEY, JSON.stringify(a)); } catch (e) {} }
  function setTokens(d) { var a = authLoad(); a.access_token = d.access_token; a.refresh_token = d.refresh_token; if (d.user) a.user = d.user; authSave(a); }
  function toGuest() { var a = authLoad(); delete a.access_token; delete a.refresh_token; delete a.user; authSave(a); emit(); }
  var listeners = []; function emit() { listeners.forEach(function (f) { try { f(authLoad()); } catch (e) {} }); }

  var DEV_KEY = "arabic-device-id-v1", devMem = null;
  function devOk(v) { return typeof v === "string" && /^[\x21-\x7e]{1,128}$/.test(v); }
  function deviceId() { /* [add1 A1] generated once, persisted under its own key; 1–128 visible ASCII */ if (devOk(devMem)) return devMem; try { var v = localStorage.getItem(DEV_KEY); if (!devOk(v)) { v = "h5-" + uuid(); localStorage.setItem(DEV_KEY, v); } devMem = v; } catch (e) { devMem = devMem || "h5-" + uuid(); } return devMem; }
  function uuid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "k-" + Date.now() + "-" + Math.random().toString(16).slice(2); }

  /* ---------- transport ---------- */
  function rawRequest(method, path, body, idem) {
    var a = authLoad(), h = { "Content-Type": "application/json", "X-Device-Id": deviceId(), "X-Platform": "h5" };
    if (a.access_token) h.Authorization = "Bearer " + a.access_token;
    if (idem) h["Idempotency-Key"] = idem;
    if (CFG.mock) return MOCK.handle(method, path, h, body);
    return fetch(CFG.base + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined, credentials: "omit" })
      .then(function (r) { return r.json().catch(function () { return { ok: false, code: r.status >= 500 ? "INTERNAL" : "NETWORK" }; })
        .then(function (j) { return { status: r.status, retryAfter: +r.headers.get("Retry-After") || 0, json: j }; }); },
        function () { return { status: 0, json: { ok: false, code: "NETWORK" } }; });
  }
  var idemPending = {}; /* [add1 A3] method|path|body → key; kept across network/5xx retries, dropped on a definitive answer */
  function request(method, path, body, idem, _retried) {
    var ik = null; if (method !== "GET" && !idem) { ik = method + "|" + path + "|" + JSON.stringify(body || {}); idem = idemPending[ik] || (idemPending[ik] = uuid()); }
    return rawRequest(method, path, body, idem).then(function (r) { if (ik && r.status && r.status < 500) delete idemPending[ik];
      var j = r.json || {};
      if (j.ok) { if (j.server_time) API.serverTime = j.server_time; return j.data; }
      var code = j.code || "NETWORK";
      if (r.status === 401 && code === "TOKEN_EXPIRED" && !_retried && authLoad().refresh_token) {
        return refresh().then(function () { return request(method, path, body, idem, true); }, function (e) { toGuest(); throw e; });
      }
      if (r.status === 401 && path.indexOf("/auth/") < 0) toGuest();
      var e = new Error(code); e.code = code; e.status = r.status; e.message = j.message || errText(code); e.zh = errText(code, r.status); e.retryAfter = r.retryAfter || 0; e.details = j.details;
      throw e;
    });
  }
  function refresh() {
    var a = authLoad();
    return rawRequest("POST", "/api/v1/auth/refresh", { refresh_token: a.refresh_token }, uuid()).then(function (r) {
      if (r.json && r.json.ok) { setTokens(r.json.data); return r.json.data; }
      var e = new Error((r.json && r.json.code) || "TOKEN_INVALID"); e.code = e.message; throw e;
    });
  }

  /* ---------- time: Beijing (UTC+8) display ---------- */
  function bjDate(iso) { if (!iso) return ""; var d = new Date(Date.parse(iso) + 8 * 3600e3); return d.toISOString().slice(0, 10); }
  function bjYM(ms) { var d = new Date((ms == null ? Date.now() : ms) + 8 * 3600e3); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 }; }
  /* [parent-verify: under-14 parent SMS at registration only (v0.8 assumed)] */
  function ageYMD(by, bm, bd, nowMs) { /* [v08-2] Beijing date; birthday counts; Feb 29 → Mar 1 in non-leap years (falls out of the M*100+D compare) */ var t = new Date((nowMs || Date.now()) + 8 * 3600e3), y = t.getUTCFullYear(), m = t.getUTCMonth() + 1, d = t.getUTCDate(); return y - by - ((m * 100 + d) < (bm * 100 + (bd || 1)) ? 1 : 0); }
  function ageYM(by, bm, nowMs) { var n = bjYM(nowMs); return n.y - by - (n.m < bm ? 1 : 0); }

  /* ---------- export / sync (guest → account, idempotent, never loses local data) ---------- */
  function exportPayload() {
    try { if (typeof window.saveStore === "function") window.saveStore(); } catch (e) {}
    var st = JSON.parse(localStorage.getItem("arabic-study-v1") || "{}"), mt = JSON.parse(localStorage.getItem("arabic-study-meta") || "{}");
    return { schemaVersion: 1, deviceId: mt.deviceId || deviceId(), exportedAt: new Date().toISOString(), store: st, meta: { deviceId: mt.deviceId || deviceId(), updatedAt: mt.updatedAt || 0, srsUpdatedAt: mt.srsUpdatedAt || {} } };
  }
  function applyMerged(res) {
    /* local ∪ server via the app's own merge: local data can only grow */
    if (!res || !res.store || typeof window.ioMergeStores !== "function") return false;
    var before = JSON.stringify(window.store);
    var srv = window.ioMigrateImported ? window.ioMigrateImported(window.ioNormalizeStore(res.store)) : res.store;
    var merged = window.ioMergeStores(window.store, srv, window.meta, res.meta || { srsUpdatedAt: {} });
    var ts = {}; [window.meta.srsUpdatedAt || {}, (res.meta || {}).srsUpdatedAt || {}].forEach(function (m) { Object.keys(m).forEach(function (k) { ts[k] = Math.max(ts[k] || 0, m[k]); }); });
    if (JSON.stringify(merged) === before) return false;
    window.store = merged; window.meta.srsUpdatedAt = ts; window.saveStore();
    return true;
  }
  function postLogin() {
    var a = authLoad(); if (!a.user || a.user.account_state !== "active") { emit(); return Promise.resolve({ skipped: true }); }
    var uid = a.user.id, out = {};
    return request("POST", "/api/v1/me/sync", exportPayload()).then(function (res) {
      out.rev = res.rev; out.changed = applyMerged(res);
      var b = authLoad(); b.synced = b.synced || {}; b.synced[uid] = res.rev; authSave(b);
      if (b.imported && b.imported[uid]) return null;
      var seq = window.store.cardSeq || {}, all = (window.store.cards || []).filter(function (c, i, a) { return a.indexOf(c) === i; });
      var ids = all.map(function (c, i) { return { c: c, k: typeof seq[c] === "number" ? seq[c] : 1e9 + i }; }).sort(function (x, y) { return x.k - y.k; }).map(function (x) { return x.c; }).slice(0, 99); /* PM: import every local card, earned order (cardSeq) */
      return request("POST", "/api/v1/me/cards/import-local", { card_ids: ids }).then(function (r) { out.imported = r.imported; return r; },
        function (e) { if (e.code !== "IMPORT_USED") throw e; out.imported = 0; });
    }).then(function () { var b = authLoad(); b.imported = b.imported || {}; b.imported[uid] = true; authSave(b); emit(); if (out.changed && window.refreshCards) try { window.refreshCards(); } catch (e) {} return out; });
  }

  /* ---------- auth API ---------- */
  var API = {
    config: CFG, errText: errText, ERR_ZH: ERR_ZH, request: request, refresh: refresh, auth: authLoad, onChange: function (f) { listeners.push(f); },
    bjDate: bjDate, ageYM: ageYM, PHONE_RE: PHONE_RE, serverTime: null, postLogin: postLogin, exportPayload: exportPayload,
    smsSend: function (phone, purpose, extra) { /* v0.8: register|login|bind_phone|parent_verify (needs child_phone); guardian_change goes to the stored guardian, no phone sent */
      var b = Object.assign({ purpose: purpose || "login" }, extra || {}); if (phone) b.phone = phone;
      return request("POST", "/api/v1/sms/send", b); },
    register: function (f) {
      var body = { phone: f.phone, code: f.code, birth_year: f.birth_year, birth_month: f.birth_month, birth_day: f.birth_day };
      if (f.nickname) body.nickname = f.nickname;
      var t = API.ticket(); if (t && t.parent_ticket && t.child_phone === f.phone) body.parent_ticket = t.parent_ticket; /* ticket bound to child_phone */
      return request("POST", "/api/v1/auth/register", body).then(function (d) {
        if (body.consent_ticket) API.clearTicket();
        setTokens(d); var a1 = authLoad(); a1.self_phone = f.phone; authSave(a1); emit(); return postLogin().then(function () { return d; });
      });
    },
    login: function (phone, code) {
      return request("POST", "/api/v1/auth/login", { phone: phone, code: code }).then(function (d) { setTokens(d); var a1 = authLoad(); a1.self_phone = phone; authSave(a1); emit(); return postLogin().then(function () { return d; }); });
    },
    wechat: function (birth) {
      return request("POST", "/api/v1/auth/wechat", birth || {}).then(function (d) { setTokens(d); emit(); return postLogin().then(function () { return d; }); });
    },
    logout: function () { var a = authLoad(), p = a.access_token ? request("POST", "/api/v1/auth/logout", { refresh_token: a.refresh_token }).catch(function () {}) : Promise.resolve(); toGuest(); return p; },
    /* §4.1 consent ticket: send = step 1, verify = step 2; ticket kept in sessionStorage only (30 min, single use) */
    parentVerify: function (parentPhone, code, childPhone) { /* §7.3 (2): POST /api/v1/parent/verify {phone, code, child_phone} → {parent_ticket, expires_at, child_phone_masked} */
      return request("POST", "/api/v1/parent/verify", { phone: parentPhone, code: code, child_phone: childPhone }).then(function (d) {
        try { sessionStorage.setItem(TICKET_KEY, JSON.stringify({ parent_ticket: d.parent_ticket, expires_at: d.expires_at, child_phone: childPhone, child_phone_masked: d.child_phone_masked, parent_phone_masked: parentPhone.slice(0, 3) + "****" + parentPhone.slice(7) })); } catch (e) {}
        return d; });
    },
    ageYMD: ageYMD,
    /* [add25 B6] captcha adapter — provider: Tencent Cloud Captcha 2.0 (TJCaptcha.js, loaded dynamically, live mode only).
       dev builds (mock): slider → captcha_token "test-pass" (randstr omitted). solve() → {token, randstr} | {cancelled:true} */
    captcha: { provider: CFG.mock === false && CFG.captchaAppId ? "tencent" : (window.__ARABIC_DEV_BUILD__ === true ? "dev-test-pass" : "none"),
      SDK_URL: "https://turing.captcha.qcloud.com/TJCaptcha.js", loads: 0,
      load: function () { var C = API.captcha; if (CFG.mock !== false) return Promise.reject(Object.assign(new Error("CAPTCHA_UNAVAILABLE"), { code: "CAPTCHA_UNAVAILABLE" })); /* never in mock/dev */
        if (typeof window.TencentCaptcha === "function") return Promise.resolve(window.TencentCaptcha);
        if (C._p) return C._p;
        C._p = new Promise(function (ok, no) { var s = document.createElement("script"); s.src = C.SDK_URL; s.async = true; C.loads++;
          s.onload = function () { typeof window.TencentCaptcha === "function" ? ok(window.TencentCaptcha) : no(new Error("load")); };
          s.onerror = function () { C._p = null; no(new Error("load")); }; document.head.appendChild(s); });
        return C._p; },
      solve: function (proof) { var C = API.captcha;
        if (C.provider === "tencent") return C.load().then(function (TC) { return new Promise(function (ok) {
            var cap = new TC(String(CFG.captchaAppId), function (res) { /* ret 0 = passed, 2 = closed by user; error tickets (trerror_…) are submitted as-is (server rejects) */
              if (res && res.ret === 2) return ok({ cancelled: true }); ok({ token: res && res.ticket || "", randstr: res && res.randstr || "" }); }, { userLanguage: "zh-cn" });
            cap.show(); }); },
          function () { var t = "trerror_1001_" + CFG.captchaAppId + "_" + Date.now(); return { token: t, randstr: "@" + Math.random().toString(36).slice(2, 5) }; }); /* B6.1.5: disaster ticket, submitted normally */
        return C.token(proof).then(function (t) { return { token: t }; }); },
      token: function (proof) { /* [add1 A2] 'test-pass' only when window.__ARABIC_DEV_BUILD__ (same gate as ?ca_mock); never in prod */
        var no = function () { return Promise.reject(Object.assign(new Error("CAPTCHA_REQUIRED"), { code: "CAPTCHA_REQUIRED", zh: errText("CAPTCHA_REQUIRED") })); };
        if (window.API04_CAPTCHA && window.API04_CAPTCHA.solve) return Promise.resolve(window.API04_CAPTCHA.solve(proof));
        if (window.__ARABIC_DEV_BUILD__ === true) return proof && proof.done ? Promise.resolve(["test", "pass"].join("-")) : no();
        return no(); } },
    practice: { /* [add25 B4/C1] GET /practice/questions, POST /practice/answers (Idempotency-Key added by request()) */
      questions: function (o) { o = o || {}; var q = []; if (o.count != null) q.push("count=" + encodeURIComponent(o.count)); if (o.scope) q.push("scope=" + encodeURIComponent(o.scope)); if (o.debug && window.__ARABIC_DEV_BUILD__ === true) q.push("debug_answers=1");
        return request("GET", "/api/v1/practice/questions" + (q.length ? "?" + q.join("&") : "")); },
      answers: function (list) { return request("POST", "/api/v1/practice/answers", { answers: list }).then(API.practice.normalize); },
      /* [counted-reason] counted=false is never an error: every reason (EXPIRED, TOO_FAST, VIP_INACTIVE, DUPLICATE_TODAY, COURSE_UNPUBLISHED, or any unknown/missing one) is just "not counted" */
      NOT_COUNTED: ["EXPIRED", "TOO_FAST", "VIP_INACTIVE", "DUPLICATE_TODAY", "COURSE_UNPUBLISHED"],
      normalize: function (r) { try { var a = r && r.results; if (!Array.isArray(a)) return r;
        r.results = a.map(function (x) { if (!x || typeof x !== "object") return { counted: false, reason: "UNKNOWN", notCounted: true };
          var c = x.counted === true && !x.reason; x.counted = c; x.notCounted = !c;
          if (!c) { x.reason = typeof x.reason === "string" && x.reason ? x.reason : "UNKNOWN"; x.reasonKnown = API.practice.NOT_COUNTED.indexOf(x.reason) >= 0; }
          return x; }); } catch (e) {} return r; } /* [/counted-reason] */ },
    selfPhone: function () { var a = authLoad(); return a.self_phone || ""; },
    birthDate: function (y, m, d) { /* §7.2.1 PATCH /me/birth-date — only once; 409 BIRTH_DATE_LOCKED afterwards */
      return request("PATCH", "/api/v1/me/birth-date", { birth_year: +y, birth_month: +m, birth_day: +d }).then(function (r) { return API.me().then(function () { return r; }, function () { return r; }); }); },
    meParentVerify: function () { var t = API.ticket(); /* §7.2.1 POST /me/parent-verify {parent_ticket} — optional, blocks nothing */
      return request("POST", "/api/v1/me/parent-verify", { parent_ticket: t ? t.parent_ticket : "" }).then(function (r) { API.clearTicket(); return API.me().then(function () { return r; }, function () { return r; }); }); },
    ticket: function () { try { var t = JSON.parse(sessionStorage.getItem(TICKET_KEY) || "null"); if (t && Date.parse(t.expires_at) > Date.now()) return t; } catch (e) {} return null; },
    clearTicket: function () { try { sessionStorage.removeItem(TICKET_KEY); } catch (e) {} },
    me: function () { return request("GET", "/api/v1/me").then(function (d) { var a = authLoad(); a.user = d.user || d; authSave(a); emit(); return a.user; }); },
    /* camp form adapter: updateProfile only (v0.8) */
    campCall: function (name, data) {
      if (name === "updateProfile") /* F profile: year + month (contract §3 PATCH /me) */
        return API.birthDate(data.birthYear, data.birthMonth, data.birthDay).then(function (d) { return { ok: true, user: authLoad().user, parent_verify_needed: d && d.parent_verify_needed }; }, function (e) { return { ok: false, code: e.code, message: e.zh }; });
      return Promise.resolve({ ok: false, code: name === "parentConsent" ? "GUARDIAN_DISCONTINUED" : "BAD_REQUEST" }); /* v0.8: parentConsent removed; never calls /consent/* */
    }
  };

  /* ---------- P (card-award): v0.5 §V4/§V7 — full /api/v1 paths, canonical fields; pass-through only ---------- */
  API.deviceId = deviceId; /* [add1 A1] exposed for tests */
  API.pFetch = function (path, opts) { opts = opts || {}; return request(opts.method || "GET", path, opts.body, opts.idem || undefined); };

  /* ================= MOCK SERVER (contract v0.5) ================= */
  var MOCK = (function () {
    var CODE = "123456", ACCESS_TTL = 7200e3, REFRESH_TTL = 30 * 864e5, COOLDOWN = 60e3, DAILY = 10, TICKET_TTL = 30 * 60e3, MAX_TRIES = 5;
    var force = null; /* test hook: force next response error code */
    function db() { try { return Object.assign({ users: {}, sms: {}, tickets: {}, pvHour: {}, access: {}, refresh: {}, idem: {}, seq: 0 }, JSON.parse(localStorage.getItem(MOCK_DB) || "{}")); } catch (e) { return { users: {}, sms: {}, tickets: {}, access: {}, refresh: {}, idem: {}, seq: 0 }; } }
    function save(d) { try { localStorage.setItem(MOCK_DB, JSON.stringify(d)); } catch (e) {} }
    var clockOff = 0; function now() { return Date.now() + clockOff; } /* [add25] FakeClock for tests (MOCK.advance) */
    function ok(data, status) { return { status: status || 200, json: { ok: true, data: data, server_time: new Date().toISOString() } }; }
    function fail(code, extra) { return { status: STATUS[code] || 400, retryAfter: extra && extra.retryAfter || 0, json: { ok: false, code: code, message: errText(code), details: extra && extra.details } }; }
    function rnd(n) { var s = ""; for (var i = 0; i < n; i++) s += "0123456789abcdef"[Math.floor(Math.random() * 16)]; return s; }
    function mask(p) { return p ? p.slice(0, 3) + "****" + p.slice(7) : null; }
    function hasBirth(u) { return u.birth_year != null && u.birth_month != null; }
    function pubUser(u) { /* [v08-2: §7.1.9 user — guardian phone masked + guardian_verified_at; no consent/pending fields] */
      return { id: u.id, phone: mask(u.phone), nickname: u.nickname || "", birth_year: u.birth_year == null ? null : u.birth_year, birth_month: u.birth_month == null ? null : u.birth_month, birth_day: u.birth_day == null ? null : u.birth_day,
        account_state: u.account_state === "pending_consent" ? "active" : u.account_state, parent_phone_masked: mask(u.guardian_phone), parent_verified: !!u.guardian_verified_at, parent_verify_needed: !!u.parent_verify_needed, birth_date_needed: u.birth_day == null, /* §7.1.9 */
        has_phone: !!u.phone, has_wechat: !!u.openid, created_at: u.created_at || null }; }
    function issue(d, u) { var at = "at_" + rnd(32), rt = rnd(64); d.access[at] = { uid: u.id, exp: now() + ACCESS_TTL, scope: u.account_state === "active" ? "user" : "pending" }; d.refresh[rt] = { uid: u.id, exp: now() + REFRESH_TTL }; return { user: pubUser(u), access_token: at, refresh_token: rt }; }
    function userBy(d, id) { for (var k in d.users) if (d.users[k].id === id) return d.users[k]; return null; }
    function smsCheckSend(d, key, phone, dev) {
      if (!PHONE_RE.test(String(phone || ""))) return fail("PHONE_INVALID");
      var r = d.sms[key] || {}, day = new Date(now() + 8 * 3600e3).toISOString().slice(0, 10);
      d.smsDay = d.smsDay || {}; d.devDay = d.devDay || {};
      var pd = d.smsDay[phone] && d.smsDay[phone].day === day ? d.smsDay[phone] : { day: day, count: 0 };
      var dd = dev ? (d.devDay[dev] && d.devDay[dev].day === day ? d.devDay[dev] : { day: day, count: 0 }) : null;
      if (r.sentAt && now() - r.sentAt < COOLDOWN) return fail("TOO_FREQUENT", { retryAfter: Math.ceil((COOLDOWN - (now() - r.sentAt)) / 1000) });
      if (pd.count >= DAILY || (dd && dd.count >= 20)) return fail("TOO_MANY", { retryAfter: 3600 });
      pd.count++; d.smsDay[phone] = pd; if (dd) { dd.count++; d.devDay[dev] = dd; }
      d.sms[key] = { sentAt: now(), exp: now() + 5 * 60e3, tries: 0, used: false };
      return null;
    }
    function smsVerify(d, key, code, peek) { /* peek: check only; consumed later (§7.1 step 6) */
      var r = d.sms[key];
      if (!r || r.exp < now()) return fail("CODE_EXPIRED");
      if (r.used) return fail("CODE_USED");
      if (r.tries >= MAX_TRIES) return fail("CODE_LOCKED");
      if (String(code) !== CODE) { r.tries++; return fail(r.tries >= MAX_TRIES ? "CODE_LOCKED" : "CODE_WRONG"); }
      if (!peek) r.used = true; return null;
    }
    function birthCheck(by, bm, bd) { /* §7.1: all three required; legal date; not after today (Beijing) → 400 BIRTH_DATE_INVALID + details.field */
      var t = new Date(Date.now() + 8 * 3600e3), Y = t.getUTCFullYear(), today = Y * 10000 + (t.getUTCMonth() + 1) * 100 + t.getUTCDate();
      function bad(f) { return fail("BIRTH_DATE_INVALID", { details: { field: f } }); }
      if (!Number.isInteger(by) || by < Y - 120 || by > Y) return bad("birth_year");
      if (!Number.isInteger(bm) || bm < 1 || bm > 12) return bad("birth_month");
      if (!Number.isInteger(bd) || bd < 1 || bd > new Date(Date.UTC(by, bm, 0)).getUTCDate()) return bad("birth_day");
      if (by * 10000 + bm * 100 + bd > today) return bad("birth_day");
      return null;
    }
    function hashT(t) { var h = 0; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return "h" + h; }
    function auth(d, h) {
      var m = /^Bearer (.+)$/.exec(h.Authorization || ""); if (!m) return { err: fail("UNAUTHORIZED") };
      var t = d.access[m[1]]; if (!t) return { err: fail("TOKEN_INVALID") };
      if (t.exp < now()) return { err: fail("TOKEN_EXPIRED") };
      var u = userBy(d, t.uid); if (!u) return { err: fail("TOKEN_INVALID") };
      if (u.flag) return { err: fail(u.flag) };
      return { u: u };
    }
    function names() { var out = []; document.querySelectorAll("#collect-fan .cthumb").forEach(function (b, i) { var n = b.querySelector(".tcard-nameid"), tc = b.querySelector(".tcard"); out.push({ id: i + 1, key: (b.id || "").replace("cthumb-", ""), arName: n ? n.textContent.trim() : "", rarity: tc ? tc.getAttribute("data-rarity") || "common" : "common" }); }); return out; }
    function summary(u) {
      var set = names(), owned = u.cards || [], byKey = {};
      owned.forEach(function (c) { byKey[c.key] = c; });
      var got = set.filter(function (c) { return byKey[c.key]; }).map(function (c) { var o = byKey[c.key]; return { id: c.id, ruleKey: c.key, arName: c.arName, rarity: c.rarity, collected: true, verified: !!o.verified, source: o.source, awardedAt: o.at }; })
        .sort(function (a, b) { return a.awardedAt < b.awardedAt ? -1 : a.awardedAt > b.awardedAt ? 1 : a.id - b.id; });
      var FREE_CAP = 8, held = []; /* §0.5 free users hold at most freeCap cards; the rest are withheld until VIP, then granted in one go */
      if (!u.vip && got.length > FREE_CAP) { held = got.slice(FREE_CAP).map(function (c) { return Object.assign({}, c, { collected: false, verified: false, withheld: true }); }); got = got.slice(0, FREE_CAP); }
      var rest = set.filter(function (c) { return !byKey[c.key]; }).map(function (c) { return { id: c.id, ruleKey: c.key, arName: c.arName, rarity: c.rarity, collected: false, verified: false, source: null, awardedAt: null }; });
      return { collectedCount: got.length, verifiedCount: got.filter(function (c) { return c.verified; }).length, withheldCount: held.length, total: 99, requiredTotal: 99, freeCap: FREE_CAP, isVip: !!u.vip, cards: got.concat(held, rest), serverNow: new Date().toISOString() };
    }
    function vipStatus(u) {
      if (!u.vip) return { isVip: false, permanent: false, source: null, activatedAt: null, expiresAt: null, checkinDeadline: null, daysRemaining: 0, serverNow: new Date().toISOString() };
      var dl = new Date(Date.parse(u.vip.activatedAt)); dl.setUTCFullYear(dl.getUTCFullYear() + 3);
      var days = Math.ceil((Date.parse(bjDate(dl.toISOString()) + "T00:00:00Z") - Date.parse(bjDate(new Date().toISOString()) + "T00:00:00Z")) / 864e5);
      return { isVip: true, permanent: !!u.vip.permanent || lifetimeProgress(u).lifetimeVip.granted, source: "wechat_pay", activatedAt: u.vip.activatedAt, expiresAt: null, checkinDeadline: dl.toISOString(), daysRemaining: Math.max(0, days), serverNow: new Date().toISOString() };
    }
    var B1_FLAGS = ["fast_answers_30", "multi_device_concurrent", "device_multi_account_30d", "daily_over_16h", "lifetime_precheck", "parent_phone_accounts_30d"];
    function openRisk(u, types) { return (u.risk_flags || []).filter(function (f) { return types.indexOf(f.type) >= 0 && (f.status === "open" || f.status === "confirmed"); }); }
    var CHECKIN_TARGET = 1000, AROMA_TARGET = 99, REWARD_REQUIRES_VIP = true; /* §11 default */
    function claimView(c) { return c ? Object.assign({ addressChangesMax: 1, cancelReason: null }, c) : null; }
    function checkinDays(u) { if (Array.isArray(u.checkin_records)) return u.checkin_records.filter(function (r) { return r.status === "valid"; }).length; /* [add25 B5] legacy/voided never count */ if (u.checkin_days != null) return u.checkin_days; var s = u.progress && u.progress.store; return s && Array.isArray(s.checkins) ? s.checkins.length : 0; }
    function lifetimeProgress(u) { /* §4.2 GET /api/v1/lifetime/progress */
      var n = new Date(), biz = bjDate(new Date(n.getTime() - 4 * 3600e3).toISOString());
      if (!u.vip) return { rulesVersion: "lifetime1000_v1", status: "not_started", grantPending: false, validDays: 0, requiredDays: CHECKIN_TARGET, remainingDays: CHECKIN_TARGET, firstPaidAt: null, firstPaidDate: null, deadline: null, deadlineAt: null, daysLeftToDeadline: null, maxReachable: null, onTrack: null, todayBizDate: biz, todayCounted: false, todayBlocker: "NOT_STARTED", todayProgress: null, vipActiveToday: false, lifetimeVip: { granted: false, grantedAt: null }, serverNow: n.toISOString() };
      var first = bjDate(u.vip.activatedAt), dl = new Date(Date.parse(first + "T00:00:00Z") + 1094 * 864e5).toISOString().slice(0, 10);
      var left = Math.max(0, Math.round((Date.parse(dl) - Date.parse(biz)) / 864e5) + 1), days = checkinDays(u), held = !u.vip.permanent && days >= CHECKIN_TARGET && left > 0 && (u.risk_flags || []).some(function (f) { return f.type === "lifetime_precheck" && f.status !== "dismissed"; }), granted = !held && (!!u.vip.permanent || (days >= CHECKIN_TARGET && left > 0)); /* [add25 E2a] precheck hold */
      var expired = !granted && left <= 0, max = days + left;
      return { rulesVersion: "lifetime1000_v1", status: granted ? "granted" : expired ? "expired" : "in_progress", validDays: days, requiredDays: CHECKIN_TARGET, remainingDays: Math.max(0, CHECKIN_TARGET - days),
        firstPaidAt: u.vip.activatedAt, firstPaidDate: first, deadline: dl, deadlineAt: new Date(Date.parse(dl + "T19:59:59Z") + 0).toISOString(), daysLeftToDeadline: left, maxReachable: max, onTrack: max >= CHECKIN_TARGET,
        allowedMissesLeft: left - Math.max(0, CHECKIN_TARGET - days), todayBizDate: biz, todayCounted: false, todayBlocker: expired ? "EXPIRED" : u.vip.expired ? "VIP_INACTIVE" : held || (u.risk_flags || []).some(function (f) { return f.type === "lifetime_precheck" && f.status === "open"; }) ? "RISK_REVIEW" : null, grantPending: held, legacyDays: Array.isArray(u.checkin_records) ? u.checkin_records.filter(function (r) { return r.status === "legacy"; }).length : 0,
        todayProgress: { segments: 0, validQuestions: 0, accuracy: 0, needSegments: 1, needQuestions: 10, minAccuracy: 0.5 }, vipActiveToday: !u.vip.expired,
        lifetimeVip: { granted: granted, grantedAt: granted ? (u.vip.grantedAt || n.toISOString()) : null }, serverNow: n.toISOString() };
    }
    function addrCheck(a) { return a && typeof a.recipient === "string" && a.recipient.length >= 2 && a.recipient.length <= 20 && PHONE_RE.test(a.phone || "") && /^\d{6}$/.test(a.regionCode || "") && a.regionName && a.detailAddress && a.detailAddress.length <= 60 && (!a.note || a.note.length <= 60); }
    function newUser(d, f, state) { d.seq++; var u = { id: "u" + d.seq, phone: f.phone || null, openid: f.openid || null, nickname: f.nickname || "", birth_year: f.birth_year, birth_month: f.birth_month, birth_day: f.birth_day == null ? null : f.birth_day, account_state: state, guardian_phone: f.guardian_phone || null, guardian_consent_at: f.guardian_consent_at || null, cards: [], progress: null, rev: 0, imported: false, vip: null, claim: null, created_at: new Date().toISOString() }; if (f.guardian_verified_at) { u.guardian_phone = f.guardian_phone; u.guardian_verified_at = f.guardian_verified_at; } d.users[u.phone || ("wx_" + u.openid)] = u; return u; }
    var PARENT_TTL = 10 * 60e3;
    function MOCK_NONPROD() { return window.__ARABIC_DEV_BUILD__ === true; } /* [add1 A5] the page-side analogue of APP_ENV≠production */
    function devH(h) { var v = h["X-Device-Id"]; return typeof v === "string" && /^[\x21-\x7e]{1,128}$/.test(v) ? v : null; }
    function parentCheck(d, b) { /* §7.1 step 3: under 14 → valid parent_ticket bound to the child phone; nothing is consumed here */
      if (ageYMD(b.birth_year, b.birth_month, b.birth_day) >= 14) return { r: null };
      var t = b.parent_ticket; if (!t) return { err: fail("PARENT_TICKET_REQUIRED") };
      var r = /^pt_/.test(t) ? d.tickets[hashT(t)] : null;
      if (!r) return { err: fail("PARENT_TICKET_INVALID") };
      if (r.used) return { err: fail("PARENT_TICKET_USED") };
      if (r.exp < now()) return { err: fail("PARENT_TICKET_EXPIRED") };
      if (r.child !== b.phone) return { err: fail("PARENT_TICKET_MISMATCH") }; /* [add1 A7] phone first → 422 */
      if (!b.__dev) return { err: fail("DEVICE_ID_REQUIRED") };
      if (r.dev !== hashT(b.__dev)) return { err: fail("PARENT_TICKET_DEVICE_MISMATCH") }; /* → 403 */
      if (r.parent === b.phone) return { err: fail("PARENT_SAME_AS_CHILD") };
      return { r: r };
    }
    function captchaCheck(d, h, b) { /* [add25 B6.2] non-prod: test-pass passes without calling the provider; prod: test-pass → 400. Provider = replaceable stub (MOCK.captchaStub) */
      if (b.captcha_token === "test-pass") return MOCK_NONPROD() ? null : fail("CAPTCHA_REQUIRED");
      if (!b.captcha_token || !b.captcha_randstr) return fail("CAPTCHA_REQUIRED");
      if (/^trerror_/.test(String(b.captcha_token))) return fail("CAPTCHA_REQUIRED");
      d.captchaCalls = (d.captchaCalls || []); var st = d.captchaStub == null ? "unavailable" : d.captchaStub;
      d.captchaCalls.push({ UserIp: (h["X-Forwarded-For"] || "").split(",")[0].trim() || null, CaptchaType: 9, Randstr: b.captcha_randstr, at: now() }); /* Ticket never logged */
      if (st === "timeout" || st === "error" || st === "unavailable") return fail("CAPTCHA_UNAVAILABLE", { retryAfter: 30 });
      if (!(h["X-Forwarded-For"] || "").split(",")[0].trim()) return fail("CAPTCHA_REQUIRED"); /* no client IP → treated as failed */
      return +st === 1 ? null : fail("CAPTCHA_REQUIRED");
    }
    var PURPOSES = ["register", "login", "bind_phone", "parent_verify"], GONE_PURPOSES = { guardian_consent: "GUARDIAN_DISCONTINUED", guardian_change: "GUARDIAN_DISCONTINUED", guardian_register: "GUARDIAN_DISCONTINUED", refund_guardian: "REFUND_DISCONTINUED", refund_election: "REFUND_DISCONTINUED", refund_choice_guardian: "REFUND_DISCONTINUED", guardian_election: "REFUND_DISCONTINUED" };
    function smsSend(d, h, b) {
      var p = b.purpose, to = b.phone, dev = h["X-Device-Id"] || "", a;
      if (GONE_PURPOSES[p]) return fail(GONE_PURPOSES[p]); /* 410, no SMS */
      if (PURPOSES.indexOf(p) < 0) return fail("BAD_REQUEST", { details: { field: "purpose" } });
      if (p === "register") { if (!PHONE_RE.test(to || "")) return fail("PHONE_INVALID"); if (d.users[to]) return fail("PHONE_REGISTERED"); }
      else if (p === "login") { if (!PHONE_RE.test(to || "")) return fail("PHONE_INVALID"); if (!d.users[to]) return fail("PHONE_NOT_REGISTERED"); if (d.users[to].flag === "ACCOUNT_FROZEN" || d.users[to].flag === "ACCOUNT_BANNED") return fail(d.users[to].flag); /* [add1 A4] 403 before limits, no code written */ }
      else if (p === "bind_phone") { a = auth(d, h); if (a.err) return a.err; if (!PHONE_RE.test(to || "")) return fail("PHONE_INVALID"); if (d.users[to]) return fail("PHONE_REGISTERED"); }
      else if (p === "parent_verify") { /* §7.2: {phone:parent, child_phone}; both required; different; child not registered */
        if (!PHONE_RE.test(to || "")) return fail("PHONE_INVALID", { details: { field: "phone" } });
        if (!PHONE_RE.test(b.child_phone || "")) return fail("PHONE_INVALID", { details: { field: "child_phone" } });
        var ce = captchaCheck(d, h, b); if (ce) return ce; /* [add25 B6.2.6] format → captcha → business → limits; failures never count */
        if (b.child_phone === to) return fail("PARENT_SAME_AS_CHILD");
        if (d.users[b.child_phone] && !(a = auth(d, h), !a.err && a.u.phone === b.child_phone)) return fail("PHONE_REGISTERED"); /* §7.2.1: logged-in self = child is allowed */
        var bday = new Date(now() + 4 * 3600e3).toISOString().slice(0, 10); d.pDay = d.pDay || {}; var pdy = d.pDay[to] && d.pDay[to].day === bday ? d.pDay[to] : { day: bday, n: 0 };
        if (pdy.n >= 5) return fail("PARENT_PHONE_LIMIT", { retryAfter: 3600, details: { reason: "daily_5" } });
        var er0 = smsCheckSend(d, p + "_" + to, to, dev); if (er0) return er0; pdy.n++; d.pDay[to] = pdy; return ok({ sent: true, resend_after_sec: 60, to_masked: mask(to) });
      }
      var er = smsCheckSend(d, p + "_" + to, to, dev); return er || ok({ sent: true, resend_after_sec: 60, to_masked: mask(to) });
    }
    var routes = {
      "POST /api/v1/sms/send": function (d, h, b) { return smsSend(d, h, b); },
      "POST /api/v1/auth/sms/send": function (d, h, b) { return smsSend(d, h, b); },
      "POST /api/v1/auth/parent_verify/send": function (d, h, b) { return smsSend(d, h, Object.assign({}, b, { purpose: "parent_verify" })); },
      "POST /api/v1/auth/parent_verify/confirm": function (d, h, b) { return routes["POST /api/v1/parent/verify"](d, h, b); }, /* v0.5 alias, removed in v0.6 */
      "POST /api/v1/consent/sms/send": function () { return fail("GUARDIAN_DISCONTINUED"); },
      "POST /api/v1/consent/verify": function () { return fail("GUARDIAN_DISCONTINUED"); },
      "POST /api/v1/me/guardian-consent": function () { return fail("GUARDIAN_DISCONTINUED"); },
      "POST /api/v1/me/checkins/makeup": function () { return fail("MAKEUP_DISCONTINUED"); },
      "GET /api/v1/refund/eligibility": function () { return fail("REFUND_DISCONTINUED"); }, "GET /api/v1/refund/progress": function () { return fail("REFUND_DISCONTINUED"); },
      "POST /api/v1/refund/choice": function () { return fail("REFUND_DISCONTINUED"); }, "POST /api/v1/refund/applications": function () { return fail("REFUND_DISCONTINUED"); },
      "GET /api/v1/refund/applications/current": function () { return fail("REFUND_DISCONTINUED"); }, "GET /api/v1/refund/policy": function () { return fail("REFUND_DISCONTINUED"); },
      "POST /api/v1/me/refund/applications": function () { return fail("REFUND_DISCONTINUED"); }, "GET /api/v1/me/refund/applications/current": function () { return fail("REFUND_DISCONTINUED"); },
      "GET /api/v1/me/refund/eligibility": function () { return fail("REFUND_DISCONTINUED"); }, "GET /api/v1/me/refund/election": function () { return fail("REFUND_DISCONTINUED"); }, "POST /api/v1/me/refund/election": function () { return fail("REFUND_DISCONTINUED"); },
      "POST /api/v1/auth/register": function (d, h, b) { /* §7.1 step order; any failure: no account, nothing consumed */
        if (!PHONE_RE.test(b.phone || "")) return fail("PHONE_INVALID");
        var be = birthCheck(b.birth_year, b.birth_month, b.birth_day); if (be) return be;
        if (d.users[b.phone]) return fail("PHONE_REGISTERED");
        b.__dev = devH(h); var pc = parentCheck(d, b); delete b.__dev; if (pc.err) return pc.err;
        var ve = smsVerify(d, "register_" + b.phone, b.code, true); if (ve) return ve;
        if (pc.r) { if (pc.r.used) return fail("PARENT_TICKET_USED"); pc.r.used = true; }
        d.sms["register_" + b.phone].used = true;
        var f = { phone: b.phone, nickname: b.nickname, birth_year: b.birth_year, birth_month: b.birth_month, birth_day: b.birth_day };
        if (pc.r) { f.guardian_phone = pc.r.parent; f.guardian_verified_at = new Date().toISOString(); }
        var u = newUser(d, f, "active"); return ok(Object.assign(issue(d, u), { created: true }), 201);
      },
      "POST /api/v1/auth/login": function (d, h, b) {
        if (!PHONE_RE.test(b.phone || "")) return fail("PHONE_INVALID");
        var u = d.users[b.phone]; if (!u) return fail("PHONE_NOT_REGISTERED");
        var ve = smsVerify(d, "login_" + b.phone, b.code); if (ve) return ve;
        if (u.flag === "ACCOUNT_BANNED") return fail("ACCOUNT_BANNED");
        return ok(Object.assign(issue(d, u), { created: false }));
      },
      "POST /api/v1/auth/refresh": function (d, h, b) {
        var r = d.refresh[b.refresh_token || ""]; if (!r || r.exp < now()) return fail("TOKEN_INVALID");
        delete d.refresh[b.refresh_token]; var u = userBy(d, r.uid); if (!u) return fail("TOKEN_INVALID");
        return ok(issue(d, u));
      },
      "POST /api/v1/auth/logout": function (d, h, b) { var a = auth(d, h, true); if (a.err) return a.err; Object.keys(d.access).forEach(function (k) { if (d.access[k].uid === a.u.id) delete d.access[k]; }); if (b.refresh_token) delete d.refresh[b.refresh_token]; return ok({}); },
      "POST /api/v1/me/bind-phone": function (d, h, b) { var a = auth(d, h); if (a.err) return a.err; if (!PHONE_RE.test(b.phone || "")) return fail("PHONE_INVALID"); if (d.users[b.phone]) return fail("PHONE_REGISTERED"); var ve = smsVerify(d, "bind_phone_" + b.phone, b.code); if (ve) return ve; var k = Object.keys(d.users).filter(function (x) { return d.users[x] === a.u; })[0]; delete d.users[k]; a.u.phone = b.phone; d.users[b.phone] = a.u; return ok({ user: pubUser(a.u) }); },
      "POST /api/v1/auth/wechat": function (d, h, b) {
        var oid = "mock-openid", u = d.users["wx_" + oid];
        if (u) return ok(Object.assign(issue(d, u), { created: false }));
        var be = birthCheck(b.birth_year, b.birth_month, b.birth_day); if (be) return be;
        if (ageYMD(b.birth_year, b.birth_month, b.birth_day) < 14) return fail("PARENT_TICKET_REQUIRED"); /* mini-program path has no child phone to bind; H5 SMS register only */
        var f = { openid: oid, birth_year: b.birth_year, birth_month: b.birth_month, birth_day: b.birth_day };
        return ok(Object.assign(issue(d, newUser(d, f, "active")), { created: true }), 201);
      },
      "POST /api/v1/parent/verify": function (d, h, b) { if (!devH(h)) return fail("DEVICE_ID_REQUIRED"); /* [add1 A1] before the code is touched */ /* §7.2: {phone, code, child_phone} → parent_ticket (10 min, single use, bound to child_phone); code consumed here */
        if (!PHONE_RE.test(b.phone || "")) return fail("PHONE_INVALID", { details: { field: "phone" } });
        if (!PHONE_RE.test(b.child_phone || "")) return fail("PHONE_INVALID", { details: { field: "child_phone" } });
        if (b.child_phone === b.phone) return fail("PARENT_SAME_AS_CHILD");
        var hr = d.pvHour[b.phone] || { n: 0, t: now() }; if (now() - hr.t > 3600e3) hr = { n: 0, t: now() }; if (hr.n >= 10) return fail("TOO_MANY", { retryAfter: Math.ceil((hr.t + 3600e3 - now()) / 1000) }); hr.n++; d.pvHour[b.phone] = hr;
        d.pAcc = d.pAcc || {}; d.review = d.review || {}; var acc = (d.pAcc[b.phone] || []).filter(function (x) { return now() - x.t < 30 * 864e5; });
        if (acc.length >= 3 && !acc.some(function (x) { return x.c === b.child_phone; }) && !(d.review[b.phone] && d.review[b.phone].status === "approved")) { d.review[b.phone] = d.review[b.phone] || { status: "pending", at: now() }; save(d); return fail("PARENT_PHONE_LIMIT", { retryAfter: 0, details: { reason: "accounts_30d", review: "pending" } }); }
        var ve = smsVerify(d, "parent_verify_" + b.phone, b.code); if (ve) return ve;
        if (!acc.some(function (x) { return x.c === b.child_phone; })) acc.push({ c: b.child_phone, t: now() }); d.pAcc[b.phone] = acc;
        var t = "pt_" + rnd(48), exp = now() + PARENT_TTL;
        d.tickets[hashT(t)] = { parent: b.phone, child: b.child_phone, dev: hashT(devH(h)), exp: exp, used: false };
        return ok({ parent_ticket: t, expires_at: new Date(exp).toISOString(), child_phone_masked: mask(b.child_phone) });
      },
      "PATCH /api/v1/me/birth-date": function (d, h, b) { /* §7.2.1 — once only */
        var a = auth(d, h, true); if (a.err) return a.err; var u = a.u;
        if (u.birth_day != null) return fail("BIRTH_DATE_LOCKED");
        var be = birthCheck(b.birth_year, b.birth_month, b.birth_day); if (be) return be;
        u.birth_year = b.birth_year; u.birth_month = b.birth_month; u.birth_day = b.birth_day;
        var minor = ageYMD(b.birth_year, b.birth_month, b.birth_day) < 14; u.parent_verify_needed = minor && !u.guardian_verified_at;
        return ok({ age_under_14: minor, parent_verify_needed: !!u.parent_verify_needed });
      },
      "POST /api/v1/me/parent-verify": function (d, h, b) { /* §7.2.1 — optional; never blocks anything */
        var a = auth(d, h, true); if (a.err) return a.err; var u = a.u;
        if (!u.parent_verify_needed) return fail("PARENT_VERIFY_NOT_NEEDED");
        if (!devH(h)) return fail("DEVICE_ID_REQUIRED"); var t = b.parent_ticket; if (!t) return fail("PARENT_TICKET_REQUIRED");
        var r = /^pt_/.test(t) ? d.tickets[hashT(t)] : null; if (!r) return fail("PARENT_TICKET_INVALID");
        if (r.used) return fail("PARENT_TICKET_USED"); if (r.exp < now()) return fail("PARENT_TICKET_EXPIRED");
        if (r.child !== u.phone) return fail("PARENT_TICKET_MISMATCH"); if (!devH(h)) return fail("DEVICE_ID_REQUIRED"); if (r.dev !== hashT(devH(h))) return fail("PARENT_TICKET_DEVICE_MISMATCH");
        if (r.parent === u.phone) return fail("PARENT_SAME_AS_CHILD");
        r.used = true; u.guardian_phone = r.parent; u.guardian_verified_at = new Date().toISOString(); u.parent_verify_needed = false;
        return ok({ user: pubUser(u) });
      },
      "GET /api/v1/me": function (d, h) { var a = auth(d, h, true); return a.err || ok({ user: pubUser(a.u) }); },
      "PATCH /api/v1/me": function (d, h, b) {
        var a = auth(d, h, true); if (a.err) return a.err; var u = a.u;
        if (b.birth_year != null || b.birth_month != null || b.birth_day != null) {
          if (u.birth_year != null && u.birth_month != null) return fail("FORBIDDEN");
          var be = birthCheck(b.birth_year, b.birth_month, b.birth_day); if (be) return be;
          u.birth_year = b.birth_year; u.birth_month = b.birth_month; u.birth_day = b.birth_day; /* no pending state: the parent check happens only at registration */
        }
        if (b.nickname != null) u.nickname = String(b.nickname).slice(0, 40);
        return ok({ user: pubUser(u) });
      },
      "POST /api/v1/me/sync": function (d, h, b) {
        var a = auth(d, h); if (a.err) return a.err; var u = a.u;
        if (!b || typeof b !== "object" || !b.store) return fail("BAD_REQUEST");
        if (b.schemaVersion > 1) return fail("SCHEMA_TOO_NEW");
        var srv = u.progress ? u.progress.store : null, srvMeta = u.progress ? u.progress.meta : { srsUpdatedAt: {} };
        var merged = srv ? window.ioMergeStores(srv, window.ioNormalizeStore(b.store), srvMeta, b.meta || {}) : window.ioNormalizeStore(b.store);
        var ts = {}; [srvMeta.srsUpdatedAt || {}, (b.meta || {}).srsUpdatedAt || {}].forEach(function (m) { Object.keys(m).forEach(function (k) { ts[k] = Math.max(ts[k] || 0, m[k]); }); });
        u.progress = { store: merged, meta: { deviceId: b.deviceId, updatedAt: now(), srsUpdatedAt: ts } }; u.rev++;
        return ok({ schemaVersion: 1, deviceId: b.deviceId, exportedAt: new Date().toISOString(), store: merged, meta: u.progress.meta, rev: u.rev });
      },
      "GET /api/v1/me/export": function (d, h) { var a = auth(d, h); if (a.err) return a.err; var p = a.u.progress || { store: {}, meta: {} }; return ok({ schemaVersion: 1, deviceId: p.meta.deviceId || "", exportedAt: new Date().toISOString(), store: p.store, meta: p.meta }); },
      "POST /api/v1/me/cards/import-local": function (d, h, b) {
        var a = auth(d, h); if (a.err) return a.err; var u = a.u, ids = b.card_ids;
        if (!Array.isArray(ids)) return fail("BAD_REQUEST");
        if (ids.length > 99) return fail("PAYLOAD_TOO_LARGE_LIST");
        if (new Set(ids).size !== ids.length) return fail("DUPLICATE_CARD_IDS", { details: { duplicates: ids.filter(function (x, i) { return ids.indexOf(x) !== i; }) } });
        if (u.imported) return fail("IMPORT_USED");
        var have = {}; u.cards.forEach(function (c) { have[c.key] = 1; }); var n = 0;
        var t0 = Date.now(); ids.forEach(function (k, i) { if (!have[k]) { u.cards.push({ key: k, verified: false, source: "migrated_local", at: new Date(t0 + i).toISOString() }); n++; } }); /* keeps submitted (earned) order */
        u.imported = true; return ok({ imported: n });
      },
      "GET /api/v1/collection/summary": function (d, h) { var a = auth(d, h); return a.err || ok(summary(a.u)); },
      "GET /api/v1/vip/status": function (d, h) { var a = auth(d, h); return a.err || ok(vipStatus(a.u)); },
      "GET /api/v1/lifetime/progress": function (d, h) { var a = auth(d, h); return a.err || ok(lifetimeProgress(a.u)); }, /* read-only */
      /* aroma sample set: 99 lit cards (withheld cards past freeCap don't count), once per account */
      "GET /api/v1/rewards/incense": function (d, h) {
        var a = auth(d, h); if (a.err) return a.err; var u = a.u, s = summary(u), b = [];
        if (s.verifiedCount < AROMA_TARGET) b.push("CARDS_INCOMPLETE"); if (u.claim) b.push("ALREADY_CLAIMED"); if (REWARD_REQUIRES_VIP && !u.vip) b.push("VIP_INACTIVE");
        return ok({ eligible: !b.length, blockers: b, cardsCollected: s.verifiedCount, cardsRequired: AROMA_TARGET, claim: claimView(u.claim) });
      },
      "POST /api/v1/rewards/incense/claims": function (d, h, b) {
        var a = auth(d, h); if (a.err) return a.err; var u = a.u;
        if (u.claim) return fail("ALREADY_CLAIMED"); if (summary(u).verifiedCount < AROMA_TARGET) return fail("CARDS_INCOMPLETE"); if (REWARD_REQUIRES_VIP && !u.vip) return fail("VIP_INACTIVE"); if (!addrCheck(b)) return fail("ADDRESS_INVALID");
        var rf = openRisk(u, B1_FLAGS); /* [add25 B1] open risk flag at submit → under_review, risk_flag=1 */
        u.claim = { claimId: "cl_" + rnd(8), status: rf.length ? "under_review" : "submitted", risk_flag: rf.length ? 1 : 0, risk_reason: rf.length ? rf.map(function (f) { return f.type + "#" + f.id; }).join(",") : null, claimedAt: new Date().toISOString(), carrier: null, trackingNo: null, shippedAt: null, deliveredAt: null, addressChangesUsed: 0,
          address: { recipient: b.recipient, phoneMasked: mask(b.phone), regionCode: b.regionCode, regionName: b.regionName, detailAddress: b.detailAddress, note: b.note || "" } };
        return ok({ claimId: u.claim.claimId, status: u.claim.status, claim: claimView(u.claim) }, 201);
      },
      "PATCH /api/v1/rewards/incense/claims/current": function (d, h, b) {
        var a = auth(d, h); if (a.err) return a.err; var u = a.u;
        if (!u.claim) return fail("NOT_CLAIMED"); if ((u.claim.status !== "submitted" && u.claim.status !== "under_review") || u.claim.addressChangesUsed >= 1) return fail("CLAIM_LOCKED"); /* [add25 B1.5] */
        var keep = b.phone == null || b.phone === "";
        if (!keep && !PHONE_RE.test(String(b.phone))) return fail("ADDRESS_INVALID", { details: { field: "phone" } });
        if (!addrCheck(Object.assign({}, b, { phone: keep ? "13800000000" : b.phone }))) return fail("ADDRESS_INVALID");
        u.claim.address = { recipient: b.recipient, phoneMasked: keep ? u.claim.address.phoneMasked : mask(b.phone), regionCode: b.regionCode, regionName: b.regionName, detailAddress: b.detailAddress, note: b.note || "" }; u.claim.addressChangesUsed++;
        return ok({ claim: claimView(u.claim) });
      },
      "GET /api/v1/me/aroma": function () { return fail("GONE"); },
      "POST /api/v1/me/aroma/claim": function () { return fail("GONE"); },
      "PATCH /api/v1/me/aroma/address": function () { return fail("GONE"); },
      "GET /api/v1/regions": function () { return ok(window.CA_REGIONS || []); },
      "GET /api/v1/practice/questions": function (d, h, b, q) { return practiceGet(d, h, q || {}); },
      "POST /api/v1/practice/answers": function (d, h, b) { return practiceAnswers(d, h, b); }
    };
    /* ===== [add25] practice bank (B4, C1–C6, C10, D3, D4) — bank built from the page's book-1 lessons; course xb1-lNN = BOOK1 no(14+NN) ===== */
    function bjNat(ms) { return new Date(ms + 8 * 3600e3).toISOString().slice(0, 10); } /* C3: Beijing natural date (00:00) */
    function bjBiz(ms) { return new Date(ms + 4 * 3600e3).toISOString().slice(0, 10); } /* D4: 04:00 business day */
    function dayDiff(a, b) { return Math.round((Date.parse(a) - Date.parse(b)) / 864e5); }
    var BANK = null;
    function bank() { if (BANK) return BANK; BANK = []; var BL = window.BOOK1_LESSONS || [];
      BL.forEach(function (L) { var n = L.no - 14, cid = 100 + n, k = 0;
        (L.bq || []).forEach(function (x) { if (!x || !Array.isArray(x.opts) || x.type === "order" || x.type === "fill" || x.opts.length < 2 || x.opts.length > 4) return; k++; /* C5/C6: single choice, 2–4 options */
          BANK.push({ id: 100000 + n * 100 + k, version: 1, type: /的意思/.test(x.q || "") ? "read_word" : (x.ar ? "dialog_next" : "grammar"), stem: (x.ar ? x.ar + " " : "") + (x.q || ""), options: x.opts.slice(), answer: x.a, course_id: cid, min_course_id: cid, status: "live" }); });
        (L.wi || []).forEach(function (wi) { var w = (window.WORDS || [])[wi]; if (!w || (L.review || []).indexOf(wi) >= 0 || w.status === "待定") return; var others = (L.wi || []).map(function (j) { return (window.WORDS || [])[j]; }).filter(function (o) { return o && o.zh !== w.zh && o.status !== "待定"; }).slice(0, 3); if (others.length < 1) return; k++;
          BANK.push({ id: 100000 + n * 100 + k, version: 1, type: "read_word", stem: w.ar, options: [w.zh].concat(others.map(function (o) { return o.zh; })), answer: 0, course_id: cid, min_course_id: cid, status: "live" }); }); });
      return BANK; }
    function completedCourses(u) { var td = u.completed || (u.progress && u.progress.store && u.progress.store.topicDone) || []; return td.map(function (no) { return no >= 15 && no <= 26 ? 100 + no - 14 : null; }).filter(Boolean); } /* C2: server-side course progress */
    function pState(u) { u.prac = u.prac || { issues: {}, lastCorrect: {}, answered: {}, counted: {}, log: [], rateQ: [], rateA: [], validDays: {} }; return u.prac; }
    function shuffleIdx(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); for (var j = n - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)), t = a[j]; a[j] = a[r]; a[r] = t; } return a; }
    function todayProg(u, P) { var biz = bjBiz(now()), list = P.log.filter(function (x) { return x.biz === biz; }), n = list.length, c = list.filter(function (x) { return x.correct; }).length, best = null;
      if (n >= 10) { best = 0; for (var i = 0; i + 10 <= n; i++) { var w = list.slice(i, i + 10).filter(function (x) { return x.correct; }).length / 10; if (w > best) best = w; } }
      var counted = best != null && best >= 0.5; if (counted && !P.validDays[biz]) P.validDays[biz] = "questions";
      return { bizDate: biz, validQuestions: n, needQuestions: 10, accuracy: n ? Math.round(c / n * 100) / 100 : 0, bestWindowAccuracy: best, minAccuracy: 0.5, segments: 0, needSegments: 1, counted: !!P.validDays[biz], basis: P.validDays[biz] || null }; }
    function practiceGet(d, h, q) {
      var a = auth(d, h); if (a.err) return a.err; var u = a.u, P = pState(u), t = now();
      var count = q.count == null ? 10 : +q.count; if (!Number.isInteger(count) || count < 1 || count > 20) return fail("BAD_REQUEST", { details: { field: "count" } });
      P.rateQ = P.rateQ.filter(function (x) { return t - x < 60e3; }); if (P.rateQ.length + count > 60) return fail("TOO_FREQUENT", { retryAfter: 60 });
      var done = completedCourses(u), scope = q.scope || "all", pool = bank().filter(function (x) { return x.status === "live" && done.indexOf(x.course_id) >= 0 && done.indexOf(x.min_course_id) >= 0; });
      var m = /^course:(\d+)$/.exec(scope), mb = /^book:(\d+)$/.exec(scope);
      if (m) { if (done.indexOf(+m[1]) < 0) return fail("SCOPE_NOT_COMPLETED"); pool = pool.filter(function (x) { return x.course_id === +m[1]; }); }
      else if (mb) pool = pool.filter(function (x) { return Math.floor((x.course_id - 100) / 100) === +mb[1] - 1; });
      else if (scope === "srs_due") pool = [];
      else if (scope !== "all") return fail("BAD_REQUEST", { details: { field: "scope" } });
      var nat = bjNat(t), biz = bjBiz(t);
      var answeredToday = function (x) { return P.answered[x.id] === biz; }; /* D3/D4: answered today (04:00 day) → never reissued */
      var liveIssue = function (x) { for (var k in P.issues) { var s = P.issues[k]; if (s.qid === x.id && !s.answered && !s.void && t - s.at < 30 * 60e3 && bjBiz(s.at) === biz) return k; } return null; };
      var picked = [], lockDays = 3, reissued = false;
      for (; lockDays >= 0 && picked.length < count; lockDays--) {
        picked = pool.filter(function (x) { var lc = P.lastCorrect[x.id]; return !answeredToday(x) && !liveIssue(x) && !(lc && dayDiff(nat, lc) <= lockDays); });
        if (picked.length >= count) break; }
      if (lockDays < 0) lockDays = 0;
      if (picked.length < count) { var extra = pool.filter(function (x) { var lc = P.lastCorrect[x.id]; return !answeredToday(x) && liveIssue(x) && !(lc && dayDiff(nat, lc) <= 0); }); if (extra.length) { reissued = true; picked = picked.concat(extra); } }
      picked = picked.sort(function () { return Math.random() - 0.5; }).slice(0, count);
      var dbg = q.debug_answers === "1" && MOCK_NONPROD(); /* B4.5: prod ignores it silently */
      var items = picked.map(function (x) { var old = liveIssue(x); if (old) P.issues[old].void = true; /* C4.2: old issue_id becomes EXPIRED */
        var ord = shuffleIdx(x.options.length), id = "pi_" + rnd(16); P.issues[id] = { qid: x.id, at: t, order: ord, answered: false };
        var it = { issue_id: id, question_id: x.id, version: x.version, type: x.type, stem: x.stem, audio_url: null, options: ord.map(function (i) { return x.options[i]; }), option_audio_urls: ord.map(function () { return null; }), image_url: null };
        if (dbg) it.answer_index = ord.indexOf(x.answer); return it; });
      items.forEach(function () { P.rateQ.push(t); });
      return ok({ items: items, issuedAt: new Date(t).toISOString(), requested: count, returned: items.length, exhausted: items.length < count, relaxation: { lockDays: lockDays, reissued: reissued }, todayProgress: todayProg(u, P) });
    }
    function practiceAnswers(d, h, b) {
      var a = auth(d, h); if (a.err) return a.err; var u = a.u, P = pState(u), t = now();
      if (!b || !Array.isArray(b.answers) || b.answers.length < 1 || b.answers.length > 20) return fail("BAD_REQUEST", { details: { field: "answers" } });
      for (var i = 0; i < b.answers.length; i++) { var x = b.answers[i]; if (!x || typeof x !== "object" || Object.keys(x).some(function (k) { return ["issue_id", "option_index", "elapsed_ms"].indexOf(k) < 0; })) return fail("BAD_REQUEST", { details: { field: "answers" } }); /* C5: no option_indexes etc. */
        var s = P.issues[x.issue_id]; if (!s) return fail("ISSUE_INVALID");
        if (!Number.isInteger(x.option_index) || x.option_index < 0 || x.option_index >= s.order.length) return fail("BAD_REQUEST", { details: { field: "option_index" } }); }
      P.rateA = P.rateA.filter(function (x) { return t - x < 60e3; }); if (P.rateA.length >= 60) return fail("TOO_FREQUENT", { retryAfter: 60 }); P.rateA.push(t);
      var biz = bjBiz(t), nat = bjNat(t), vipOk = u.vip && !u.vip.expired;
      var results = b.answers.map(function (x) { var s = P.issues[x.issue_id];
        if (s.answered) return s.result; /* same issue twice → original result, never counted again */
        var q = bank().filter(function (y) { return y.id === s.qid; })[0], correct = s.order[x.option_index] === q.answer, reason = null;
        if (s.void || t - s.at > 30 * 60e3) reason = "EXPIRED"; else if (t - s.at < 1500) reason = "TOO_FAST"; /* server time only; elapsed_ms is audit-only */
        else if (!vipOk) reason = "VIP_INACTIVE"; else if (P.counted[s.qid] === biz) reason = "DUPLICATE_TODAY";
        var counted = !reason; s.answered = true; s.result = { issue_id: x.issue_id, correct: correct, counted: counted, reason: reason }; s.elapsed_ms = x.elapsed_ms;
        if (reason !== "EXPIRED") P.answered[s.qid] = biz; if (correct && reason !== "EXPIRED") P.lastCorrect[s.qid] = nat;
        if (counted) { P.counted[s.qid] = biz; P.log.push({ biz: biz, qid: s.qid, correct: correct }); }
        return s.result; });
      return ok({ results: results, todayProgress: todayProg(u, P) });
    }
    function handle(method, path, h, body) {
      return new Promise(function (res) {
        setTimeout(function () {
          var qi = path.indexOf("?"), qs = {}; if (qi >= 0) { new URLSearchParams(path.slice(qi + 1)).forEach(function (v, k) { qs[k] = v; }); path = path.slice(0, qi); } /* [add25] query → 4th route arg */
          var d = db(), key = method + " " + path, r;
          if (force && (force.path === "*" || force.path === key)) { var c = force.code; force = null; r = fail(c, c === "TOO_FREQUENT" || c === "TOO_MANY" ? { retryAfter: 60 } : null); return res(r); }
          var fn = routes[key];
          if (!fn) return res(fail("NOT_FOUND"));
          var idem = h["Idempotency-Key"], bodyS = JSON.stringify(body || {});
          if (method !== "GET" && !(typeof idem === "string" && /^[\x21-\x7e]{1,128}$/.test(idem)) && !/^POST \/api\/v1\/payments\/notify\//.test(key)) { var g = null; try { g = fn(JSON.parse(JSON.stringify(d)), h, body || {}); } catch (e0) {} if (g && g.status === 410) return res(g); return res(fail("IDEMPOTENCY_KEY_REQUIRED")); } /* [add1 A3] before any write; 410 stays 410 */
          if (method !== "GET" && idem) {
            var ik = (h.Authorization || "anon") + "|" + key + "|" + idem, prev = d.idem[ik];
            if (prev) { if (prev.body !== bodyS) return res(fail("IDEMPOTENCY_MISMATCH")); return res(prev.resp); }
          }
          try { r = fn(d, h, body || {}, qs); } catch (e) { console.warn("mock 500", String(e && e.stack)); r = fail("INTERNAL"); }
          if (method !== "GET" && idem && r.json.ok) d.idem[(h.Authorization || "anon") + "|" + key + "|" + idem] = { body: bodyS, resp: r };
          save(d); res(r);
        }, 60);
      });
    }
    /* QA seed (mock only): ?ca_mock=N[&ca_seed=claim|shipped][&ca_checkin=N] → active VIP account with N verified cards, signed in */
    function seedFromQuery() {
      var q = new URLSearchParams(location.search), n = q.get("ca_mock"); if (n == null) return;
      var d = db(), phone = "13900000000", u = d.users[phone];
      if (!u) { d.seq++; u = d.users[phone] = { id: "u" + d.seq, phone: phone, birth_year: 1990, birth_month: 5, account_state: "active", cards: [], vip: null, imported: true, rev: 0 }; }
      u.vip = { activatedAt: "2026-10-20T16:00:00Z" }; u.claim = null; u.cards = []; u.checkin_days = q.get("ca_checkin") != null ? Math.max(0, parseInt(q.get("ca_checkin"), 10) || 0) : (parseInt(n, 10) >= 99 ? 1000 : Math.round((parseInt(n, 10) || 0) * 10));
      var tries = 0, t = setInterval(function () {
        var set = names(); if (!set.length && ++tries < 40) return; clearInterval(t);
        var d2 = db(), u2 = d2.users[phone], N = Math.max(0, Math.min(99, parseInt(n, 10) || 0));
        u2.cards = set.slice(0, N).map(function (c, i) { return { key: c.key, verified: true, source: "earned", at: new Date(Date.UTC(2026, 0, 5 + i * 3)).toISOString() }; });
        var seed = q.get("ca_seed"), addr = { recipient: "王小明", phoneMasked: "138****0000", regionCode: "440305", regionName: "广东省 深圳市 南山区", detailAddress: "科技园示例路 1 号 101 室", note: "" };
        if (seed === "claim" || seed === "shipped") u2.claim = { claimId: "cl_seed", status: seed === "shipped" ? "shipped" : "submitted", claimedAt: new Date(now() - 2 * 864e5).toISOString(), carrier: seed === "shipped" ? "顺丰速运" : null, trackingNo: seed === "shipped" ? "SF1234567890" : null, shippedAt: seed === "shipped" ? new Date(now() - 864e5).toISOString() : null, deliveredAt: null, addressChangesUsed: 0, address: addr };
        save(d2);
      }, 100);
      var tk = issue(d, u); save(d); setTokens(tk);
      var a = authLoad(); a.imported = a.imported || {}; a.imported[u.id] = true; a.synced = a.synced || {}; authSave(a);
    }
    return { handle: handle, seed: seedFromQuery, force: function (code, path) { force = { code: code, path: path || "*" }; }, db: db, save: save, CODE: CODE,
      expireAccess: function () { var d = db(); Object.keys(d.access).forEach(function (k) { d.access[k].exp = 0; }); save(d); },
      advance: function (ms) { clockOff += ms; }, resetClock: function () { clockOff = 0; }, /* [add25] FakeClock */
      captchaStub: function (code) { var d = db(); d.captchaStub = code; d.captchaCalls = []; save(d); },
      riskFlag: function (phone, type, status) { var d = db(), u = d.users[phone]; if (!u) return null; u.risk_flags = u.risk_flags || []; var f = { id: u.risk_flags.length + 1, type: type, status: status || "open" }; u.risk_flags.push(f); save(d); return f; },
      setRisk: function (phone, id, status) { var d = db(), u = d.users[phone]; (u.risk_flags || []).forEach(function (f) { if (f.id === id) f.status = status; }); save(d); },
      bank: function () { return bank(); },
      flag: function (phone, f) { var d = db(); if (d.users[phone]) d.users[phone].flag = f; save(d); } };
  })();
  API.mock = CFG.mock ? MOCK : null;
  window.API04 = API;
  if (CFG.mock && CFG.dev === true) MOCK.seed(); /* [r10-dev: QA v1.3-dev + PM decisions] URL seed only in dev builds */
})();
