/* click_confetti.js — sparkle-that-page
 * Use: <script src="click_confetti.js"></script>
 * Variant: <html data-confetti="heart">  (heart | star | confetti | petal | pixel)
 * Color theme (optional, overrides the variant's colors): <html data-palette="neon">  (candy | neon | meadow)
 * Limit to specific targets: <html data-confetti-on="[data-confetti]"> (else any click).
 * No-op on reduced-motion. Canvas overlay, pointer-events:none. */
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var ds = document.documentElement.dataset;
  var variant = ds.confetti || "heart", sel = ds.confettiOn || null, paletteName = ds.palette || null;
  var THEME = {
    candy:  ["#f472b6", "#c084fc", "#fde047", "#a5b4fc", "#fb7185"],
    neon:   ["#2ee6ff", "#b6ff3d", "#ff5ad0", "#ffb43d", "#ffffff"],
    meadow: ["#e87a90", "#6a5acd", "#4aad9a", "#d4943a", "#b8a8e0", "#f4c4a0"]
  };
  var PALETTE = { heart: ["#f472b6", "#fb7185", "#fda4af"], star: ["#fde047", "#facc15", "#fbbf24"], confetti: ["#f472b6", "#a5b4fc", "#fde047", "#86efac", "#fdba74"], petal: ["#fbcfe8", "#f9a8d4", "#fecdd3"], pixel: ["#c084fc", "#fde047", "#f472b6"] };
  var GLYPH = { heart: "♥", star: "★", petal: "❀", pixel: "■" };
  var colors = (paletteName && THEME[paletteName]) || PALETTE[variant] || PALETTE.heart;
  var glow = paletteName === "neon";

  var cv = document.createElement("canvas"), ctx = cv.getContext("2d");
  cv.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483602";
  function size() { cv.width = innerWidth; cv.height = innerHeight; }
  size(); addEventListener("resize", size, { passive: true });
  document.body.appendChild(cv);

  var parts = [], raf = 0;
  function burst(x, y) {
    var n = 24;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 6;
      parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, life: 0, ttl: 50 + Math.random() * 30, c: colors[i % colors.length], s: 7 + Math.random() * 6, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, g: GLYPH[variant] });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life++; p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.vx *= 0.99; p.r += p.vr;
      var t = p.life / p.ttl; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      if (glow) { ctx.shadowColor = p.c; ctx.shadowBlur = 12; }
      if (p.g) { ctx.font = p.s * 2 + "px serif"; ctx.textAlign = "center"; ctx.fillText(p.g, 0, 0); }
      else { ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); }
      ctx.restore();
      if (p.life >= p.ttl) parts.splice(i, 1);
    }
    raf = parts.length ? requestAnimationFrame(tick) : 0;
  }
  function onClick(e) { if (sel && !(e.target.closest && e.target.closest(sel))) return; burst(e.clientX, e.clientY); }
  addEventListener("click", onClick, { passive: true });

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.clickConfetti = { burst: burst, destroy: function () { removeEventListener("click", onClick); removeEventListener("resize", size); cancelAnimationFrame(raf); cv.remove(); } };
})();
