/* [v08c-ui] */
/* api04-ui.js — [api05: contract v0.5 applied] [v08: §7 parent_verify] login/register (H5 SMS; wx.login when inside the mini program), guest mode, consent ticket, sync. */
(function () {
  "use strict";
  var A = window.API04; if (!A) return;
  function $(s) { return document.querySelector(s); }
  function ic(id) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#' + id + '"/></svg>'; }
  /* [birthday: required y/m/d on register] */
  function dayOpts(y, m, sel) { var now = new Date(), max = y && m ? new Date(Date.UTC(+y, +m, 0)).getUTCDate() : 31; if (+y === now.getFullYear() && +m === now.getMonth() + 1) max = Math.min(max, now.getDate()); var h = '<option value="">日</option>'; for (var d = 1; d <= max; d++) h += '<option value="' + d + '"' + (String(d) === sel ? " selected" : "") + ">" + d + " 日</option>"; return h; }
  function campBirth() { try { var r = JSON.parse(localStorage.getItem("arabic-camp-signup-v1") || "null"); return r && r.birth ? r.birth : ""; } catch (e) { return ""; } }
  var mode = "register", cds = {};
  var page = document.createElement("div"); page.className = "ac-page"; page.id = "ac-page"; page.setAttribute("aria-hidden", "true"); page.setAttribute("role", "dialog"); page.setAttribute("aria-label", "账号");
  page.innerHTML = '<div class="ac-head"><button class="ac-iconbtn" id="ac-back" type="button" aria-label="返回">' + ic("i-chevron-left") + '</button><h2>账号</h2><span style="width:44px"></span></div><div class="ac-body" id="ac-body"></div>';
  document.body.appendChild(page);
  var row = document.createElement("button"); row.className = "me-row"; row.id = "me-account"; row.type = "button";
  row.innerHTML = '<span class="me-ic">' + ic("i-user") + '</span><span class="me-row-title" id="me-account-t">登录 / 注册</span><span class="me-row-sub" id="me-account-s">游客 · 本机学习</span>' + '<svg class="ic me-chev" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-chevron-right"/></svg>';
  var vip = document.getElementById("me-vip"); if (vip) vip.parentNode.insertBefore(row, vip);
  row.addEventListener("click", open);
  $("#ac-back").addEventListener("click", close);
  function open() { render(); page.classList.add("open"); page.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
  function close() { page.classList.remove("open"); page.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
  function paintRow() {
    var a = A.auth(), t = $("#me-account-t"), s = $("#me-account-s"); if (!t) return;
    if (a.user) { t.textContent = a.user.phone || "微信账号"; s.textContent = a.user.account_state === "active" ? "已登录 · 进度已同步" : "待监护人同意"; }
    else { t.textContent = "登录 / 注册"; s.textContent = "游客 · 本机学习"; }
  }
  function sig() { var a = A.auth(), u = a.user; return u ? u.id + ":" + u.account_state + ":" + JSON.stringify(a.synced || {}) : "guest"; }
  var lastSig = sig();
  A.onChange(function () { paintRow(); var s2 = sig(); if (s2 !== lastSig) { lastSig = s2; if (page.classList.contains("open")) render(); } });
  function yearOpts(sel) { var y = new Date().getFullYear(), h = '<option value="">年份</option>'; for (var i = y; i >= y - 100; i--) h += '<option value="' + i + '"' + (String(i) === sel ? " selected" : "") + ">" + i + " 年</option>"; return h; }
  function monOpts(sel) { var h = '<option value="">月份</option>'; for (var m = 1; m <= 12; m++) h += '<option value="' + m + '"' + (String(m) === sel ? " selected" : "") + ">" + m + " 月</option>"; return h; }
  function err(code) { var e = $("#ac-err"); if (!e) return; if (!code) { e.hidden = true; return; } e.innerHTML = ic("i-info") + "<span>" + A.errText(code) + "</span>"; e.hidden = false; }
  function countdown(btn, sec) { var id = btn.id; clearInterval(cds[id]); var n = sec || 60; btn.disabled = true; btn.textContent = n + "s"; cds[id] = setInterval(function () { n--; if (n <= 0) { clearInterval(cds[id]); btn.disabled = false; btn.textContent = "获取验证码"; } else btn.textContent = n + "s"; }, 1000); }
  /* [parent-verify: under-14 parent SMS on the register screen only] */
  var pvSentFor = null;
  var capToken = null;
  function guardBlock(line) {
    return '<div class="ac-g" id="ac-g" hidden><p class="ac-line">' + ic("i-shield-check") + (line || "未满 14 岁需家长手机验证") + '</p><div id="ac-g-in">' +
      '<div class="ac-row"><input class="ac-in" id="ac-gphone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="11" placeholder="家长手机号" aria-label="家长手机号"><button class="ac-btn2" id="ac-gsend" type="button">获取验证码</button></div>' +
      '<div class="ac-cap" id="ac-cap" hidden><input type="range" id="ac-capr" min="0" max="100" value="0" step="1" aria-label="向右拖到底，完成滑动验证"><span class="ac-capt" aria-hidden="true">向右拖到底</span></div>' +
      '<div class="ac-row" id="ac-gcrow" style="margin-top:8px"><input class="ac-in" id="ac-gcode" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="家长收到的 6 位验证码" aria-label="家长验证码"><button class="ac-btn2" id="ac-gverify" type="button">验证</button></div></div>' +
      '<div class="ac-ok ac-gdone" id="ac-gok" hidden></div></div>';
  }
  function childPhone() { var e = $("#ac-phone"); return e ? e.value.trim() : A.selfPhone(); } /* §7.2.1: logged-in → own phone */
  function capShow(on) { var c = $("#ac-cap"), r = $("#ac-gcrow"); if (!c) return; c.hidden = !on; r.style.display = on ? "none" : ""; if (on) { $("#ac-capr").value = 0; $("#ac-capr").focus(); } }
  function pvErr(e) { return e.code === "PARENT_PHONE_LIMIT" && !(e.details && e.details.reason === "accounts_30d") ? "PARENT_PHONE_LIMIT_DAILY" : e.code; }
  function ticketGood() { var t = A.ticket(); return t && t.parent_ticket && t.child_phone === childPhone() ? t : null; } /* [v08 §7.1.6] bound to child_phone */
  function ticketPaint(bd) {
    var t = ticketGood(), ok = $("#ac-gok"), inp = $("#ac-g-in"); if (!ok) return;
    ok.hidden = !t; inp.style.display = t ? "none" : "";
    if (t) { ok.innerHTML = ic("i-check") + "<span>家长手机 " + t.parent_phone_masked + " 已验证</span>"; var b = $("#ac-gsend"); if (b) { clearInterval(cds[b.id]); } }
  }
  function wireGuard(getBirth) {
    $("#ac-gsend").addEventListener("click", function () {
      var ph = $("#ac-gphone").value.trim(), me = childPhone();
      if (!A.PHONE_RE.test(me)) { err("PHONE_INVALID"); $("#ac-phone").focus(); return; } /* child_phone is required (§7.2) */
      if (!A.PHONE_RE.test(ph)) return err("PHONE_INVALID");
      if (me === ph) return err("PARENT_SAME_AS_CHILD");
      if (!capToken) { err(null); if (A.captcha.provider === "tencent") { var gb = this; gb.disabled = true; /* [add25 B6.1] Tencent modal; no slider */ /* [add25] */
          A.captcha.solve().then(function (r) { gb.disabled = false; if (r.cancelled) return; capToken = r; gb.click(); }, function () { gb.disabled = false; err("CAPTCHA_UNAVAILABLE"); }); return; }
        capShow(true); return; } /* §7.1.8: captcha before the parent SMS */
      var b = this, tk = capToken; capToken = null; b.disabled = true; var cx = { child_phone: me, captcha_token: tk.token }; if (tk.randstr) cx.captcha_randstr = tk.randstr; /* [add25 B6.1.4] */
      A.smsSend(ph, "parent_verify", cx).then(function (d) { pvSentFor = ph + "|" + me; err(null); countdown(b, d.resend_after_sec); $("#ac-gcode").focus(); },
        function (e) { b.disabled = false; if (swapMode(e, me)) return; err(pvErr(e)); if (e.code === "CAPTCHA_REQUIRED") capShow(true); else if (e.retryAfter && e.code !== "PARENT_PHONE_LIMIT") countdown(b, e.retryAfter); }); /* CAPTCHA_UNAVAILABLE: 503 + Retry-After 30 → neutral copy + countdown */ /* limit: inputs stay usable (change number) */ /* TOO_FREQUENT/TOO_MANY: Retry-After drives the countdown */
    });
    $("#ac-gverify").addEventListener("click", function () {
      var ph = $("#ac-gphone").value.trim(), code = $("#ac-gcode").value.trim(), me = childPhone();
      if (!A.PHONE_RE.test(ph) || !A.PHONE_RE.test(me)) return err("PHONE_INVALID");
      if (me === ph) return err("PARENT_SAME_AS_CHILD");
      if (pvSentFor !== ph + "|" + me) return err("NO_CODE");
      if (!/^\d{6}$/.test(code)) return err("CODE_WRONG");
      var b = this; b.disabled = true;
      A.parentVerify(ph, code, me).then(function () { b.disabled = false; $("#ac-gcode").value = ""; err(null); ticketPaint(getBirth()); if (window.__acGate) window.__acGate(); },
        function (e) { b.disabled = false; err(pvErr(e)); if (e.retryAfter && e.code !== "PARENT_PHONE_LIMIT") countdown($("#ac-gsend"), e.retryAfter); });
    });
    $("#ac-capr").addEventListener("input", function () { if (+this.value < 100) return; var r = this; r.disabled = true;
      A.captcha.solve({ done: true }).then(function (t) { r.disabled = false; capToken = t; capShow(false); $("#ac-gsend").click(); }, function (e) { r.disabled = false; r.value = 0; err(e.code); }); });
    $("#ac-capr").addEventListener("change", function () { if (+this.value < 100) this.value = 0; });
    ["ac-gphone", "ac-gcode"].forEach(function (id) { $("#" + id).addEventListener("input", function () { this.value = this.value.replace(/\D+/g, ""); }); });
  }
  function swapMode(e, ph) { /* §V2: PHONE_NOT_REGISTERED → 注册；PHONE_REGISTERED → 登录 */
    var to = e.code === "PHONE_NOT_REGISTERED" && mode === "login" ? "register" : e.code === "PHONE_REGISTERED" && mode === "register" ? "login" : null;
    if (!to) return false; mode = to; render(); $("#ac-phone").value = ph; err(e.code); return true; }
  function render() {
    var a = A.auth(), body = $("#ac-body"); lastSig = sig();
    if (a.user) {
      var s = a.synced && a.synced[a.user.id];
      body.innerHTML = '<div class="ac-ok">已登录 ' + (a.user.phone || "微信账号") + '<br>' + (s != null ? "本机进度已同步（版本 " + s + "）" : "尚未同步") + '</div>' +
        '<p class="ac-note">同步只会合并、不会删除本机学习记录。</p>' + meBirth(a.user) + '<div class="ac-err" id="ac-err" role="alert" hidden></div>' +
        '<button class="ac-main" id="ac-sync" type="button">立即同步</button><button class="ac-ghost" id="ac-logout" type="button">退出登录</button>';
      $("#ac-sync").addEventListener("click", function () { var b = this; b.disabled = true; A.postLogin().then(function () { b.disabled = false; err(null); render(); }, function (e) { b.disabled = false; err(e.code); }); });
      $("#ac-logout").addEventListener("click", function () { A.logout(); });
      wireMe(a.user);
      return;
    }
    var cb = campBirth(), cy = cb ? cb.slice(0, 4) : "", cm = cb ? String(+cb.slice(5, 7)) : "", cd = cb && cb.length === 10 ? String(+cb.slice(8, 10)) : "";
    body.innerHTML = '<div class="ac-seg" role="group" aria-label="注册或登录"><button type="button" id="ac-m-reg" aria-pressed="' + (mode === "register") + '">注册</button><button type="button" id="ac-m-login" aria-pressed="' + (mode === "login") + '">登录</button></div>' +
      '<div class="ac-row"><input class="ac-in" id="ac-phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="11" placeholder="手机号" aria-label="手机号"><button class="ac-btn2" id="ac-send" type="button">获取验证码</button></div>' +
      '<input class="ac-in" id="ac-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6 位验证码" aria-label="短信验证码">' +
      '<div class="ac-reg ac-row" id="ac-reg"' + (mode === "register" ? "" : " hidden") + '><select class="ac-in" id="ac-by" aria-label="出生年份">' + yearOpts(cy) + '</select><select class="ac-in" id="ac-bm" aria-label="出生月份">' + monOpts(cm) + '</select><select class="ac-in" id="ac-bd" aria-label="出生日">' + dayOpts(cy, cm, cd) + '</select></div>' +
      '<p class="ac-hint" id="ac-bhint"' + (mode === "register" ? "" : " hidden") + '>请选择出生日期</p>' +
      guardBlock() + '<div class="ac-err" id="ac-err" role="alert" hidden></div>' +
      '<button class="ac-main" id="ac-submit" type="button">' + (mode === "register" ? "注册" : "登录") + '</button>' +
      (window.wx && window.wx.login ? '<button class="ac-ghost" id="ac-wx" type="button">微信登录</button>' : "") +
      '<p class="ac-note">不登录也能在本机完整学习；登录后本机进度会合并到账号。</p>';
    function birth() { var y = $("#ac-by").value, m = $("#ac-bm").value, d = $("#ac-bd").value; if (!(y && m && d)) return null; var now = new Date(); if (+y * 10000 + +m * 100 + +d > now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()) return null; return { y: +y, m: +m, d: +d }; }
    function gate() { var bd = birth(), minor = mode === "register" && bd && A.ageYMD(bd.y, bd.m, bd.d) < 14; $("#ac-g").hidden = !minor; if (minor) ticketPaint(bd);
      if (mode === "register") { $("#ac-submit").disabled = !bd; $("#ac-bhint").hidden = !!bd; } }
    function fillDays() { var y = $("#ac-by").value, m = $("#ac-bm").value, keep = $("#ac-bd").value, now = new Date(); $("#ac-bd").innerHTML = dayOpts(y, m, keep);
      [].forEach.call($("#ac-bm").options, function (o) { o.disabled = !!(o.value && +y === now.getFullYear() && +o.value > now.getMonth() + 1); }); if ($("#ac-bm").selectedOptions[0] && $("#ac-bm").selectedOptions[0].disabled) { $("#ac-bm").value = ""; $("#ac-bd").innerHTML = dayOpts(y, "", ""); } }
    $("#ac-m-reg").addEventListener("click", function () { mode = "register"; render(); });
    $("#ac-m-login").addEventListener("click", function () { mode = "login"; render(); });
    $("#ac-by").addEventListener("change", function () { fillDays(); gate(); }); $("#ac-bm").addEventListener("change", function () { fillDays(); gate(); }); $("#ac-bd").addEventListener("change", gate); fillDays();
    ["ac-phone", "ac-code"].forEach(function (id) { $("#" + id).addEventListener("input", function () { this.value = this.value.replace(/\D+/g, ""); err(null); }); });
    $("#ac-phone").addEventListener("input", function () { var t = A.ticket(); if (t && t.parent_ticket && t.child_phone !== this.value.trim()) { A.clearTicket(); pvSentFor = null; gate(); } }); /* §7.1.6 */
    $("#ac-send").addEventListener("click", function () {
      var ph = $("#ac-phone").value.trim(); if (!A.PHONE_RE.test(ph)) return err("PHONE_INVALID");
      var b = this; b.disabled = true;
      A.smsSend(ph, mode === "register" ? "register" : "login").then(function (d) { err(null); countdown(b, d.resend_after_sec); }, function (e) { b.disabled = false; if (swapMode(e, ph)) return; err(e.code); if (e.retryAfter) countdown(b, e.retryAfter); });
    });
    wireGuard(birth); window.__acGate = gate;
    gate();
    $("#ac-submit").addEventListener("click", function () {
      var ph = $("#ac-phone").value.trim(), code = $("#ac-code").value.trim(), b = this;
      if (!A.PHONE_RE.test(ph)) return err("PHONE_INVALID");
      if (!/^\d{6}$/.test(code)) return err("CODE_WRONG");
      var p;
      if (mode === "register") { var bd = birth(); if (!bd) return err("BIRTH_DATE_INVALID"); if (A.ageYMD(bd.y, bd.m, bd.d) < 14 && !ticketGood()) return err(pvSentFor ? "PARENT_TICKET_REQUIRED" : "NO_CODE"); p = A.register({ phone: ph, code: code, birth_year: bd.y, birth_month: bd.m, birth_day: bd.d }); }
      else p = A.login(ph, code);
      b.disabled = true;
      p.then(function () { b.disabled = false; A.clearTicket(); render(); }, function (e) { b.disabled = false; if (swapMode(e, ph)) return; if (/^PARENT_TICKET_/.test(e.code)) { A.clearTicket(); pvSentFor = null; gate(); } err(e.code); }); /* the register code field is kept (§7.1.7) */
    });
    var wx = $("#ac-wx"); if (wx) wx.addEventListener("click", function () { var bd = birth(); window.wx.login({ success: function () { A.wechat(bd ? { birth_year: bd.y, birth_month: bd.m, birth_day: bd.d } : {}).then(render, function (e) { err(e.code); }); } }); });
  }
  /* §7.2.1 存量用户补填出生日期（只能填一次）+ 可选家长验证（不拦截任何功能） */
  function meBirth(u) {
    var h = "";
    if (u.birth_date_needed) h += '<div class="ac-mebd" id="ac-mebd"><p class="ac-line">' + ic("i-calendar") + '补填出生日期 <span class="ac-sub">只能填写一次</span></p><div class="ac-reg ac-row"><select class="ac-in" id="ac-by" aria-label="出生年份">' + yearOpts("") + '</select><select class="ac-in" id="ac-bm" aria-label="出生月份">' + monOpts("") + '</select><select class="ac-in" id="ac-bd" aria-label="出生日">' + dayOpts("", "", "") + '</select></div><button class="ac-btn2 ac-wide" id="ac-bdsave" type="button" disabled>保存出生日期</button></div>';
    else if (u.birth_year != null) h += '<p class="ac-note" id="ac-bdro">' + ic("i-calendar") + '出生日期 ' + u.birth_year + "-" + ("0" + u.birth_month).slice(-2) + "-" + ("0" + u.birth_day).slice(-2) + ' · 如需修改请联系客服</p>';
    if (u.parent_verify_needed) h += '<p class="ac-note" id="ac-pvopt">可选：做一次家长手机验证。不做也不影响任何功能。</p>' + guardBlock("家长手机验证（可选）");
    else if (u.parent_verified) h += '<div class="ac-ok ac-gdone" id="ac-pvdone">' + ic("i-check") + '<span>家长手机 ' + (u.parent_phone_masked || "") + ' 已验证</span></div>';
    return h;
  }
  function wireMe(u) {
    if ($("#ac-bdsave")) {
      var val = function () { var y = $("#ac-by").value, m = $("#ac-bm").value, d = $("#ac-bd").value; return y && m && d ? { y: y, m: m, d: d } : null; };
      var fd = function () { $("#ac-bd").innerHTML = dayOpts($("#ac-by").value, $("#ac-bm").value, $("#ac-bd").value); $("#ac-bdsave").disabled = !val(); };
      ["ac-by", "ac-bm", "ac-bd"].forEach(function (id) { $("#" + id).addEventListener("change", fd); });
      $("#ac-bdsave").addEventListener("click", function () { var v = val(), b = this; if (!v) return err("BIRTH_DATE_INVALID"); b.disabled = true;
        A.birthDate(v.y, v.m, v.d).then(function () { tipOff(u.id); render(); }, function (e) { b.disabled = false; err(e.code); if (e.code === "BIRTH_DATE_LOCKED") A.me().then(render, function () {}); }); });
    }
    if ($("#ac-g")) { $("#ac-g").hidden = false; wireGuard(function () { return null; }); ticketPaint();
      window.__acGate = function () { if (!A.ticket()) return; A.meParentVerify().then(function () { render(); }, function (e) { if (/^PARENT_TICKET_/.test(e.code)) { A.clearTicket(); pvSentFor = null; ticketPaint(); } err(e.code); if (e.code === "PARENT_VERIFY_NOT_NEEDED") A.me().then(render, function () {}); }); }; }
  }
  /* 我的：一次性、可关闭的补填提示 */
  function tipKey(id) { return "arabic-bd-tip-off-" + id; }
  function tipOff(id) { try { localStorage.setItem(tipKey(id), "1"); } catch (e) {} paintTip(); }
  var tip = document.createElement("div"); tip.className = "me-tip"; tip.id = "me-bd-tip"; tip.hidden = true;
  tip.innerHTML = '<button class="me-tip-main" id="me-bd-go" type="button">' + ic("i-calendar") + '<span>补填出生日期<small>只需填一次</small></span></button><button class="ac-iconbtn" id="me-bd-x" type="button" aria-label="不再提示">' + ic("i-x") + '</button>';
  row.parentNode && row.parentNode.insertBefore(tip, row.nextSibling);
  tip.querySelector("#me-bd-go").addEventListener("click", function () { open(); var s = $("#ac-mebd"); if (s) s.scrollIntoView({ block: "center" }); });
  tip.querySelector("#me-bd-x").addEventListener("click", function () { var u = A.auth().user; if (u) tipOff(u.id); });
  function paintTip() { var u = A.auth().user, off = true; try { off = !u || !u.birth_date_needed || localStorage.getItem(tipKey(u.id)) === "1"; } catch (e) {} tip.hidden = off; }
  A.onChange(paintTip); paintTip();
  paintRow();
  window.API04UI = { open: open, close: close, render: render };
})();
