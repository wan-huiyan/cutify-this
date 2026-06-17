/* sparkle_trail.js — sparkle-that-page
 * Use: <script src="sparkle_trail.js"></script>   Variant: <html data-trail="sparkle">
 * No-op on touch + on reduced-motion. Capped particle pool, rAF-driven. */
(function () {
  "use strict";
  if (!matchMedia("(pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var GLYPH = { sparkle: "✦", star: "★", heart: "♥", pixel: "✦" };
  var COLOR = { sparkle: "#fde047", star: "#facc15", heart: "#f472b6", pixel: "#c084fc" };
  var variant = document.documentElement.dataset.trail || "sparkle";
  var glyph = GLYPH[variant] || GLYPH.sparkle, color = COLOR[variant] || COLOR.sparkle;

  var layer = document.createElement("div");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483600;overflow:hidden";
  document.body.appendChild(layer);

  var MAX = 80, pool = [], live = [];
  for (var i = 0; i < MAX; i++) {
    var s = document.createElement("span");
    s.textContent = glyph;
    s.style.cssText = "position:absolute;will-change:transform,opacity;font-size:14px;color:" + color + ";opacity:0;transform:translate(-50%,-50%)";
    if (variant === "pixel") s.style.fontFamily = "monospace";
    layer.appendChild(s); pool.push(s);
  }
  function spawn(x, y, n, spread) {
    for (var k = 0; k < n && pool.length; k++) {
      var el = pool.pop();
      var ang = Math.random() * Math.PI * 2, dist = Math.random() * spread;
      live.push({ el: el, x: x, y: y, vx: Math.cos(ang) * dist, vy: Math.sin(ang) * dist - 0.4, life: 0, ttl: 36 + Math.random() * 20, rot: Math.random() * 360 });
      el.style.opacity = "1";
    }
  }
  var lastMove = 0, mx = 0, my = 0, moved = false;
  function onMove(e) { mx = e.clientX; my = e.clientY; moved = true; }
  function onClick(e) { spawn(e.clientX, e.clientY, 14, 6); }
  addEventListener("mousemove", onMove, { passive: true });
  addEventListener("click", onClick, { passive: true });

  var raf;
  function tick() {
    if (moved && performance.now() - lastMove > 16) { spawn(mx, my, 2, 2); lastMove = performance.now(); moved = false; }
    for (var i = live.length - 1; i >= 0; i--) {
      var p = live[i]; p.life++; p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.96;
      var t = p.life / p.ttl;
      p.el.style.transform = "translate(" + p.x + "px," + p.y + "px) scale(" + (1 - t) + ") rotate(" + p.rot + "deg)";
      p.el.style.opacity = String(1 - t);
      if (p.life >= p.ttl) { p.el.style.opacity = "0"; pool.push(p.el); live.splice(i, 1); }
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.sparkleTrail = { destroy: function () { cancelAnimationFrame(raf); removeEventListener("mousemove", onMove); removeEventListener("click", onClick); layer.remove(); } };
})();
