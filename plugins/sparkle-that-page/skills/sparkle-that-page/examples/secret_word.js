/* secret_word.js — sparkle-that-page
 * Use: <script src="secret_word.js"></script>   (starts on load)
 * Typing the secret word anywhere on the page sets off a little party: a big confetti burst and a twinkle.
 * Config: <html data-secret="magic">   (default "magic"; letters are matched case-insensitively; read at every key press)
 * Not triggered while the visitor types in a text field, textarea, select or contenteditable (so it never fires while
 *   someone is writing), or with Ctrl / Cmd / Alt held. Typing in a field also forgets the letters typed so far.
 * Confetti: reuses click_confetti.js (its burst() is called from a few points) when that effect is running — it asks
 *   clickConfetti.active(), so a destroy()ed click_confetti counts as not running; otherwise a
 *   small self-contained canvas draws it. Either way the canvas is pointer-events:none and stops when nothing is left.
 * Sound: plays the "twinkle" from cute_sounds.js when the visitor has switched sound on (and "chime" for finale()).
 * Reduced motion: no confetti, no movement — one calm message in a role="status" line, then it goes away.
 * API: SparkleThatPage.secretWord = { party(), finale(msg), start(), destroy() }
 *   party()      what the secret word does; call it yourself to preview.
 *   finale(msg)  the hook for "the visitor finished everything": a longer celebration (about 2 s of waves) and msg
 *                (default "All done — well done!") in the status line. Call it from your own code.
 *   Both do nothing while the effect is destroyed. start() is idempotent; destroy() removes everything it added. */
(function () {
  "use strict";
  var ds = document.documentElement.dataset;
  var FALLBACK = ["#f472b6", "#c084fc", "#fde047", "#a5b4fc", "#fb7185"];
  var TEXT_INPUT = /^(|text|search|email|url|tel|password|number|date|datetime-local|month|time|week)$/i;

  var on = false, typed = "", timers = [], toast = null, toastT = 0, cv = null, ctx = null, parts = [], raf = 0, last = 0;

  function reduced() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function colors() {
    var cs = getComputedStyle(document.documentElement), o = [];
    for (var i = 1; i <= 6; i++) { var v = cs.getPropertyValue("--stp-c" + i).trim(); if (v) o.push(v); }
    return o.length ? o : FALLBACK;
  }
  function later(fn, ms) { var id = setTimeout(function () { timers.splice(timers.indexOf(id), 1); fn(); }, ms); timers.push(id); }
  function sound(name) { var s = window.SparkleThatPage && window.SparkleThatPage.sounds; if (s && s.play) s.play(name); }

  // ---- the status line ----
  function say(text) {
    if (!toast) {
      toast = document.createElement("div"); toast.className = "stp-toast"; toast.setAttribute("role", "status");
      toast.style.cssText = "position:fixed;left:50%;bottom:28px;z-index:2147483603;max-width:calc(100vw - 32px);padding:10px 18px;border-radius:999px;pointer-events:none;" +
        "font:600 15px/1.3 system-ui,sans-serif;text-align:center;background:rgba(30,20,50,.94);color:#fff;border:2px solid #f472b6;border:2px solid var(--stp-c1,#f472b6);" +
        "box-shadow:0 8px 24px rgba(0,0,0,.28);opacity:0;transform:translateX(-50%)";
      document.body.appendChild(toast);
    }
    toast.style.transition = reduced() ? "none" : "opacity .25s ease";
    toast.textContent = text; toast.style.opacity = "1";
    clearTimeout(toastT);
    toastT = setTimeout(function () { if (toast) { toast.style.opacity = "0"; toast.textContent = ""; } }, 2400);
  }

  // ---- confetti: click_confetti.js when it is live, else our own canvas ----
  function confettiLive() { var c = window.SparkleThatPage && window.SparkleThatPage.clickConfetti; return !!(c && c.active && c.active()); }
  function ownBurst(x, y) {
    if (!cv) {
      cv = document.createElement("canvas"); cv.className = "stp-secret-confetti"; cv.setAttribute("aria-hidden", "true");
      cv.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483602";
      var d = window.devicePixelRatio || 1; cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d);
      ctx = cv.getContext("2d"); ctx.setTransform(d, 0, 0, d, 0, 0); document.body.appendChild(cv);
    }
    var c = colors();
    for (var i = 0; i < 34; i++) {
      var a = Math.random() * 6.283, sp = 3 + Math.random() * 7;
      parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, life: 0, ttl: 60 + Math.random() * 40, c: c[i % c.length], w: 6 + Math.random() * 6, r: Math.random() * 6.283, vr: (Math.random() - 0.5) * 0.35 });
    }
    if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
  }
  function tick(now) {
    var k = last ? Math.min((now - last) / 16.667, 3) : 1; last = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life += k; p.x += p.vx * k; p.y += p.vy * k; p.vy += 0.2 * k; p.vx *= Math.pow(0.99, k); p.r += p.vr * k;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - p.life / p.ttl); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.w / 3, p.w, p.w * 0.6); ctx.restore();
      if (p.life >= p.ttl) parts.splice(i, 1);
    }
    if (parts.length) raf = requestAnimationFrame(tick);
    else { raf = 0; if (cv) { cv.remove(); cv = null; ctx = null; } }
  }
  function burstAt(fx, fy) {
    var x = innerWidth * fx, y = innerHeight * fy;
    if (confettiLive()) window.SparkleThatPage.clickConfetti.burst(x, y); else ownBurst(x, y);
  }
  function waves(points, gap) { points.forEach(function (p, i) { later(function () { burstAt(p[0], p[1]); }, i * gap); }); }

  // ---- the two celebrations ----
  function party() {
    if (!on) return;
    if (!reduced()) waves([[0.2, 0.4], [0.5, 0.3], [0.8, 0.4]], 170);
    sound("twinkle");
    say("You found the secret word! ✨");
  }
  function finale(msg) {
    if (!on) return;
    if (!reduced()) { var pts = []; for (var i = 0; i < 9; i++) pts.push([0.12 + Math.random() * 0.76, 0.22 + Math.random() * 0.3]); waves(pts, 220); }
    sound("chime"); later(function () { sound("twinkle"); }, 260);
    say(msg || "All done — well done!");
  }

  // ---- the typed word ----
  function inField(t) {
    if (!t || !t.tagName) return false;
    var tag = t.tagName;
    return tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable || (tag === "INPUT" && TEXT_INPUT.test(t.getAttribute("type") || ""));
  }
  function onKey(e) {
    var t = e.composedPath ? e.composedPath()[0] : e.target;   // inside an open shadow root e.target is the host, not the <input>
    if (inField(t)) { typed = ""; return; }
    if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1) return;
    var word = (ds.secret || "magic").toLowerCase();
    typed = (typed + e.key.toLowerCase()).slice(-word.length);
    if (typed === word) { typed = ""; party(); }
  }

  function start() {
    if (on) return;
    on = true; typed = "";
    document.addEventListener("keydown", onKey);
  }
  function destroy() {
    if (!on) return;
    on = false;
    document.removeEventListener("keydown", onKey);
    timers.forEach(clearTimeout); timers = []; clearTimeout(toastT);
    cancelAnimationFrame(raf); raf = 0; parts = [];
    if (cv) { cv.remove(); cv = null; ctx = null; }
    if (toast) { toast.remove(); toast = null; }
  }

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.secretWord = { party: party, finale: finale, start: start, destroy: destroy };
  start();
})();
