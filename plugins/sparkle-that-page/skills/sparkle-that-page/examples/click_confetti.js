/* click_confetti.js — sparkle-that-page
 * Use: <script src="click_confetti.js"></script>
 * Variant: <html data-confetti="heart">  (heart | star | confetti | petal | pixel)
 * Color theme (optional, overrides the variant's colors): <html data-palette="neon">  (candy | neon | meadow)
 *   Reads CSS tokens --stp-c1…c6 (see cute_chrome.css) first; built-in arrays are the fallback.
 * WHERE it fires (read at click time, so it can be toggled live):
 *   (default)                       only on [data-celebrate], [data-confetti] — elements that opt in
 *   <html data-confetti-on="*">     every click (showcases / demo pages)
 *   <html data-confetti-on=".buy">  any CSS selector
 * Reduced motion: one small glyph fades out at the click point (~400 ms, no movement).
 * Canvas overlay, pointer-events:none, devicePixelRatio-aware, time-based physics. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ds = document.documentElement.dataset, DEFAULT_ON = "[data-celebrate], [data-confetti]";
  var variant = ds.confetti || "heart", paletteName = ds.palette || null;
  var THEME = {
    candy:  ["#f472b6", "#c084fc", "#fde047", "#a5b4fc", "#fb7185"],
    neon:   ["#2ee6ff", "#b6ff3d", "#ff5ad0", "#ffb43d", "#ffffff"],
    meadow: ["#e87a90", "#6a5acd", "#4aad9a", "#d4943a", "#b8a8e0", "#f4c4a0"]
  };
  var PALETTE = { heart: ["#f472b6", "#fb7185", "#fda4af"], star: ["#fde047", "#facc15", "#fbbf24"], confetti: ["#f472b6", "#a5b4fc", "#fde047", "#86efac", "#fdba74"], petal: ["#fbcfe8", "#f9a8d4", "#fecdd3"], pixel: ["#c084fc", "#fde047", "#f472b6"] };
  var GLYPH = { heart: "♥", star: "★", petal: "❀", pixel: "■" };
  function tokens() { var cs = getComputedStyle(document.documentElement), o = []; for (var i = 1; i <= 6; i++) { var v = cs.getPropertyValue("--stp-c" + i).trim(); if (v) o.push(v); } return o.length ? o : null; }
  var colors = (paletteName && (tokens() || THEME[paletteName])) || PALETTE[variant] || PALETTE.heart;
  var glow = paletteName === "neon";

  var cv = document.createElement("canvas"), ctx = cv.getContext("2d"), dpr = 1;
  cv.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483602";
  function size() { dpr = window.devicePixelRatio || 1; cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); addEventListener("resize", size, { passive: true });
  document.body.appendChild(cv);

  var parts = [], raf = 0, last = 0;
  function burst(x, y) {
    if (reduce) { // fewer and gentler, not zero: one glyph fades in place
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
  function onClick(e) {
    var on = ds.confettiOn || DEFAULT_ON;
    if (on !== "*") { var t = e.target.closest && e.target.closest(on); if (!t || t === document.documentElement) return; } // <html data-confetti> is the variant, not a target
    burst(e.clientX, e.clientY);
  }
  addEventListener("click", onClick, { passive: true });

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.clickConfetti = { burst: burst, destroy: function () { removeEventListener("click", onClick); removeEventListener("resize", size); cancelAnimationFrame(raf); cv.remove(); } };
})();
