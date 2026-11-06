/* sparkle_trail.js — sparkle-that-page
 * Use: <script src="sparkle_trail.js"></script>   (starts on load)   Variant: <html data-trail="sparkle">
 *   trail: sparkle | star | heart | pixel | fairydust
 *   color: <html data-palette="candy">  (candy | neon | meadow) — multi-color picks per particle
 *     Reads CSS tokens --stp-c1…c6 (see cute_chrome.css) first; the built-in arrays are the fallback.
 *   density: sparse by default (a spawn every >=24 px of travel); <html data-trail-density="storm"> = dense, every ~16 ms.
 * Click bursts are unchanged. Time-based physics (same speed at 60 / 120 Hz).
 * The rAF loop RESTS when no particle is alive and no move is pending; a mousemove or click wakes it again.
 * API: SparkleThatPage.sparkleTrail.start() / .destroy() — start() is idempotent (one layer, one set of listeners);
 *   destroy() then start() brings it back and re-reads the data-* attributes.
 * No-op (start() too) on touch + on reduced-motion. Capped particle pool. In <head> it waits for DOMContentLoaded. */
(function () {
  "use strict";
  var PALETTES = {
    candy:  ["#f472b6", "#c084fc", "#fde047", "#a5b4fc", "#fb7185"],
    neon:   ["#2ee6ff", "#b6ff3d", "#ff5ad0", "#ffb43d", "#ffffff"],
    meadow: ["#e87a90", "#6a5acd", "#4aad9a", "#d4943a", "#b8a8e0", "#f4c4a0"]
  };
  var GLYPH = { sparkle: "✦", star: "★", heart: "♥", pixel: "✦", fairydust: "•" };
  var ds = document.documentElement.dataset, MAX = 80;
  function tokens() { var cs = getComputedStyle(document.documentElement), o = []; for (var i = 1; i <= 6; i++) { var v = cs.getPropertyValue("--stp-c" + i).trim(); if (v) o.push(v); } return o.length ? o : null; }

  var layer = null, pool = [], live = [], palette, glow;
  var raf = 0, last = 0, lastMove = 0, mx = 0, my = 0, sx = 0, sy = 0, moved = false, fresh = true;

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
  function wake() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
  function onMove(e) { mx = e.clientX; my = e.clientY; moved = true; wake(); }
  function onClick(e) { spawn(e.clientX, e.clientY, 14, 6); wake(); }

  function tick(now) {
    raf = 0;
    if (!layer) return;
    var k = last ? Math.min((now - last) / 16.667, 3) : 1; last = now; // 1 = one 60 Hz frame
    if (moved) {
      var storm = ds.trailDensity === "storm";
      if (storm ? now - lastMove > 16 : fresh || Math.hypot(mx - sx, my - sy) >= 24) { spawn(mx, my, 2, 2); lastMove = now; sx = mx; sy = my; fresh = false; moved = false; }
      else if (!storm) moved = false; // sparse: a short move spawns nothing and is dropped, so the loop can rest; the next mousemove adds to it
    }
    for (var i = live.length - 1; i >= 0; i--) {
      var p = live[i]; p.life += k; p.x += p.vx * k; p.y += p.vy * k; p.vy += 0.12 * k; p.vx *= Math.pow(0.96, k);
      var t = p.life / p.ttl;
      p.el.style.transform = "translate(" + p.x + "px," + p.y + "px) scale(" + (1 - t) + ") rotate(" + p.rot + "deg)";
      p.el.style.opacity = String(1 - t);
      if (p.life >= p.ttl) { p.el.style.opacity = "0"; pool.push(p.el); live.splice(i, 1); }
    }
    if (live.length || moved) raf = requestAnimationFrame(tick); // otherwise rest: zero frames until the next move or click
  }

  function start() {
    if (layer) return;
    if (!matchMedia("(pointer: fine)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!document.body) { document.addEventListener("DOMContentLoaded", start, { once: true }); return; } // script in <head>
    var variant = ds.trail || "sparkle", paletteName = ds.palette || "candy";
    palette = tokens() || PALETTES[paletteName] || PALETTES.candy;
    var glyph = GLYPH[variant] || GLYPH.sparkle;
    glow = paletteName === "neon" || variant === "fairydust";
    var fontSize = variant === "fairydust" ? 11 : 14;

    layer = document.createElement("div");
    layer.className = "stp-trail";
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483600;overflow:hidden";
    for (var i = 0; i < MAX; i++) {
      var s = document.createElement("span");
      s.textContent = glyph;
      s.style.cssText = "position:absolute;will-change:transform,opacity;font-size:" + fontSize + "px;opacity:0;transform:translate(-50%,-50%)";
      if (variant === "pixel") s.style.fontFamily = "monospace";
      layer.appendChild(s); pool.push(s);
    }
    document.body.appendChild(layer);
    fresh = true; moved = false;
    addEventListener("mousemove", onMove, { passive: true });
    addEventListener("click", onClick, { passive: true });
  }
  function destroy() {
    document.removeEventListener("DOMContentLoaded", start);
    if (!layer) return;
    cancelAnimationFrame(raf); raf = 0;
    removeEventListener("mousemove", onMove); removeEventListener("click", onClick);
    layer.remove(); layer = null; pool = []; live = []; moved = false;
  }

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.sparkleTrail = { start: start, destroy: destroy };
  start();
})();
