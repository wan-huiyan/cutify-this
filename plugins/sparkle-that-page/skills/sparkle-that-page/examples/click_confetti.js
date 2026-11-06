/* click_confetti.js — sparkle-that-page
 * Use: <script src="click_confetti.js"></script>   (starts on load)
 * Variant: <html data-confetti="heart">  (heart | star | confetti | petal | pixel)
 * Color theme (optional, overrides the variant's colors): <html data-palette="neon">  (candy | neon | meadow)
 *   Reads CSS tokens --stp-c1…c6 (see cute_chrome.css) first; built-in arrays are the fallback.
 * WHERE it fires (read at click time, so it can be toggled live):
 *   (default)                       only on [data-celebrate], [data-confetti] — elements that opt in
 *   <html data-confetti-on="*">     every click (showcases / demo pages)
 *   <html data-confetti-on=".buy">  any CSS selector
 * STAMP: any element with data-stamp="Done!" (the text is the attribute's value; empty = "Done!") gets, on click, a
 *   rotated rubber-stamp label that lands on it with a squash, plus a confetti burst from burst(x, y). It works with
 *   or without data-confetti-on, and replaces the normal burst for that click. The label is decorative (aria-hidden)
 *   and removes itself after ~1.6 s; it takes its color from --stp-c1, and it follows its element if the page scrolls
 *   meanwhile. Reduced motion: the label just appears and is removed again after the same ~1.6 s — no slam, no fade,
 *   no confetti.
 * Reduced motion: one small glyph fades out at the click point (~400 ms, no movement).
 * API: SparkleThatPage.clickConfetti.start() / .destroy() / .burst(x, y) / .active() — start() is idempotent; destroy()
 *   then start() brings it back and re-reads the data-* attributes. burst() does nothing while the effect is off.
 *   active() is true while it is running; destroy() keeps the registry entry, so other files (cute_sounds.js,
 *   secret_word.js) ask active(), not "does the key exist". Its canvas has class "stp-confetti".
 * Put the <script> in <head> or <body>: if <body> does not exist yet, start() waits for DOMContentLoaded.
 * Canvas overlay, pointer-events:none, devicePixelRatio-aware, time-based physics. */
(function () {
  "use strict";
  var ds = document.documentElement.dataset, DEFAULT_ON = "[data-celebrate], [data-confetti]";
  var THEME = {
    candy:  ["#f472b6", "#c084fc", "#fde047", "#a5b4fc", "#fb7185"],
    neon:   ["#2ee6ff", "#b6ff3d", "#ff5ad0", "#ffb43d", "#ffffff"],
    meadow: ["#e87a90", "#6a5acd", "#4aad9a", "#d4943a", "#b8a8e0", "#f4c4a0"]
  };
  var PALETTE = { heart: ["#f472b6", "#fb7185", "#fda4af"], star: ["#fde047", "#facc15", "#fbbf24"], confetti: ["#f472b6", "#a5b4fc", "#fde047", "#86efac", "#fdba74"], petal: ["#fbcfe8", "#f9a8d4", "#fecdd3"], pixel: ["#c084fc", "#fde047", "#f472b6"] };
  var GLYPH = { heart: "♥", star: "★", petal: "❀", pixel: "■" };
  function tokens() { var cs = getComputedStyle(document.documentElement), o = []; for (var i = 1; i <= 6; i++) { var v = cs.getPropertyValue("--stp-c" + i).trim(); if (v) o.push(v); } return o.length ? o : null; }
  function reduced() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }

  var cv = null, ctx, dpr = 1, variant, colors, glow, parts = [], raf = 0, last = 0, stamps = [], timers = [];

  function size() { dpr = window.devicePixelRatio || 1; cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function burst(x, y) {
    if (!cv) return;
    if (reduced()) { // fewer and gentler, not zero: one glyph fades in place
      parts.push({ x: x, y: y, vx: 0, vy: 0, life: 0, ttl: 24, c: colors[0], s: 8, r: 0, vr: 0, g: GLYPH[variant] || GLYPH.heart, still: 1 });
    } else {
      for (var i = 0; i < 24; i++) {
        var a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 6;
        parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, life: 0, ttl: 50 + Math.random() * 30, c: colors[i % colors.length], s: 7 + Math.random() * 6, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, g: GLYPH[variant] });
      }
    }
    if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
  }
  function tick(now) {
    var k = last ? Math.min((now - last) / 16.667, 3) : 1; last = now; // 1 = one 60 Hz frame
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life += k;
      if (!p.still) { p.x += p.vx * k; p.y += p.vy * k; p.vy += 0.18 * k; p.vx *= Math.pow(0.99, k); p.r += p.vr * k; }
      var t = p.life / p.ttl; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      if (glow) { ctx.shadowColor = p.c; ctx.shadowBlur = 12; }
      if (p.g) { ctx.font = p.s * 2 + "px serif"; ctx.textAlign = "center"; ctx.fillText(p.g, 0, 0); }
      else { ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); }
      ctx.restore();
      if (p.life >= p.ttl) parts.splice(i, 1);
    }
    raf = parts.length ? requestAnimationFrame(tick) : 0;
  }

  // The stamp: a fixed-position label centred on the clicked element, rotated -8deg. It is removed when its animation
  // ends (or after a timeout under reduced motion), so no cleanup is needed from the page. While it lives it is
  // re-centred on its element on every scroll (capture: also scrolling inside a nested container), so it never drifts.
  function later(fn, ms) { var id = setTimeout(function () { timers.splice(timers.indexOf(id), 1); fn(); }, ms); timers.push(id); }
  var T = "translate(-50%,-50%) ";
  function stamp(target) {
    var cx, cy;
    function centre() { if (!target.isConnected) return; var r = target.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
    centre();
    var s = document.createElement("span");
    s.className = "stp-stamp";
    s.setAttribute("aria-hidden", "true");
    s.textContent = target.getAttribute("data-stamp") || "Done!";
    s.style.cssText = "position:fixed;left:" + cx + "px;top:" + cy + "px;z-index:2147483602;pointer-events:none;white-space:nowrap;" +
      "padding:4px 14px;border:3px double currentColor;border-radius:10px;font:800 22px/1 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;" +
      "color:#be185d;color:color-mix(in srgb,var(--stp-c1,#f472b6) 65%,#000);background:rgba(255,255,255,.92);transform:" + T + "rotate(-8deg)";
    function follow() { centre(); s.style.left = cx + "px"; s.style.top = cy + "px"; }
    addEventListener("scroll", follow, { passive: true, capture: true });
    document.body.appendChild(s); stamps.push({ el: s, off: function () { removeEventListener("scroll", follow, true); } });
    function gone() { s.remove(); removeEventListener("scroll", follow, true); for (var i = 0; i < stamps.length; i++) if (stamps[i].el === s) { stamps.splice(i, 1); break; } }
    if (reduced()) { later(gone, 1600); return; } // no slam, no confetti
    var R = " rotate(-8deg)";
    s.animate([
      { transform: T + "scale(2.6) rotate(-22deg)", opacity: 0, offset: 0, easing: "cubic-bezier(.5,0,1,.6)" },              // drops in from above
      { transform: T + "scale(1.12,.84)" + R, opacity: 1, offset: .14, easing: "ease-out" },                                // lands: squash
      { transform: T + "scale(.97,1.04)" + R, opacity: 1, offset: .24, easing: "ease-in-out" },                             // springs back
      { transform: T + "scale(1)" + R, opacity: 1, offset: .32 },
      { transform: T + "scale(1)" + R, opacity: 1, offset: .78 },                                                           // holds
      { transform: T + "scale(1.05)" + R, opacity: 0, offset: 1 }
    ], { duration: 1600, fill: "both" }).onfinish = gone;
    later(function () { centre(); burst(cx, cy); }, 220); // on the landing
  }

  function onClick(e) {
    var st = e.target.closest && e.target.closest("[data-stamp]");
    if (st) { stamp(st); return; }
    var on = ds.confettiOn || DEFAULT_ON;
    if (on !== "*") { var t = e.target.closest && e.target.closest(on); if (!t || t === document.documentElement) return; } // <html data-confetti> is the variant, not a target
    burst(e.clientX, e.clientY);
  }

  function start() {
    if (cv) return;
    if (!document.body) { document.addEventListener("DOMContentLoaded", start, { once: true }); return; } // script in <head>
    variant = ds.confetti || "heart";
    var paletteName = ds.palette || null;
    colors = (paletteName && (tokens() || THEME[paletteName])) || PALETTE[variant] || PALETTE.heart;
    glow = paletteName === "neon";
    cv = document.createElement("canvas"); ctx = cv.getContext("2d");
    cv.setAttribute("aria-hidden", "true"); cv.className = "stp-confetti";
    cv.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483602";
    size(); addEventListener("resize", size, { passive: true });
    document.body.appendChild(cv);
    addEventListener("click", onClick, { passive: true });
  }
  function destroy() {
    document.removeEventListener("DOMContentLoaded", start);
    if (!cv) return;
    removeEventListener("click", onClick); removeEventListener("resize", size);
    cancelAnimationFrame(raf); raf = 0; parts = [];
    timers.forEach(clearTimeout); timers = [];
    stamps.forEach(function (s) { s.off(); s.el.remove(); }); stamps = [];
    cv.remove(); cv = null;
  }

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.clickConfetti = { start: start, destroy: destroy, burst: burst, active: function () { return !!cv; } };
  start();
})();
