/* sparkle_trail.js — sparkle-that-page
 * Use: <script src="sparkle_trail.js"></script>   Variant: <html data-trail="sparkle">
 *   trail: sparkle | star | heart | pixel | fairydust
 *   color: <html data-palette="candy">  (candy | neon | meadow) — multi-color picks per particle
 * No-op on touch + on reduced-motion. Capped particle pool, rAF-driven. */
(function () {
  "use strict";
  if (!matchMedia("(pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var PALETTES = {
    candy:  ["#f472b6", "#c084fc", "#fde047", "#a5b4fc", "#fb7185"],
    neon:   ["#2ee6ff", "#b6ff3d", "#ff5ad0", "#ffb43d", "#ffffff"],
    meadow: ["#e87a90", "#6a5acd", "#4aad9a", "#d4943a", "#b8a8e0", "#f4c4a0"]
  };
  var GLYPH = { sparkle: "✦", star: "★", heart: "♥", pixel: "✦", fairydust: "•" };
  var ds = document.documentElement.dataset;
  var variant = ds.trail || "sparkle";
  var paletteName = ds.palette || "candy";
  var palette = PALETTES[paletteName] || PALETTES.candy;
  var glyph = GLYPH[variant] || GLYPH.sparkle;
  var glow = paletteName === "neon" || variant === "fairydust";
  var fontSize = variant === "fairydust" ? 11 : 14;

  var layer = document.createElement("div");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483600;overflow:hidden";
  document.body.appendChild(layer);

  var MAX = 80, pool = [], live = [];
  for (var i = 0; i < MAX; i++) {
    var s = document.createElement("span");
    s.textContent = glyph;
    s.style.cssText = "position:absolute;will-change:transform,opacity;font-size:" + fontSize + "px;opacity:0;transform:translate(-50%,-50%)";
    if (variant === "pixel") s.style.fontFamily = "monospace";
    layer.appendChild(s); pool.push(s);
  }
  function spawn(x, y, n, spread) {
    for (var k = 0; k < n && pool.length; k++) {
      var el = pool.pop();
      var c = palette[(Math.random() * palette.length) | 0];
      el.style.color = c;
      el.style.textShadow = glow ? "0 0 6px " + c : "none";
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
