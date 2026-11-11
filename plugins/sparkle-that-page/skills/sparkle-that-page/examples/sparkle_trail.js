/* sparkle_trail.js — sparkle-that-page
 * Use: <script src="sparkle_trail.js"></script>   (starts on load)   Variant: <html data-trail="sparkle">
 *   trail: sparkle | star | heart | pixel | fairydust | glints
 *   color: <html data-palette="candy">  (candy | neon | meadow) — multi-color picks per particle
 *     Reads CSS tokens --stp-c1…c6 (see cute_chrome.css) first; the built-in arrays are the fallback.
 *   glints: two-grain fairy dust — a tiny round mote + a thin four-point glint that twinkles (scale and opacity) as it falls.
 *     Each spawn emits one of each. Palette follows the PAGE'S lightness, re-read every time the loop wakes: crisp gold/pink/violet
 *     on light pages (no blur), pale gold/lilac with a soft glow on dark pages. Lightness = data-theme="dark|light", else the
 *     computed <body>/<html> background, else prefers-color-scheme (only when the page declares a dark color-scheme).
 *     --stp-c1…c6, if the page sets them, win over both built-in palettes; data-palette is ignored by this variant.
 *     fairy_cursor.js decides light or dark by this same rule (its isDark()), so the wand and the dust always agree.
 *     Safe under a strict CSP (style-src 'self'): all styles are set through the CSSOM, no inline style="" in the SVG markup.
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
  var GLYPH = { sparkle: "✦", star: "★", heart: "♥", pixel: "✦", fairydust: "•", glints: "" };
  var ds = document.documentElement.dataset, MAX = 80;
  function tokens() { var cs = getComputedStyle(document.documentElement), o = []; for (var i = 1; i <= 6; i++) { var v = cs.getPropertyValue("--stp-c" + i).trim(); if (v) o.push(v); } return o.length ? o : null; }

  var LIGHT_DUST = ["#e0a000", "#f2b705", "#d6458a", "#7b5cd6", "#1d9bd1"]; // deep enough to read on white
  var DARK_DUST  = ["#ffe08a", "#fff1bf", "#ffb8dc", "#cdbcff", "#a6e6ff"]; // pale, additive-looking on dark
  var STAR = "M0 -1Q.08 -.08 1 0Q.08 .08 0 1Q-.08 .08 -1 0Q-.08 -.08 0 -1Z";
  var layer = null, pool = [], gpool = [], live = [], palette, glow, dust = false, dark = false, probe = null;
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
  // --- glints variant ---
  function rgba(css) { // any CSS colour -> [r,g,b,a] 0-255 (a canvas pixel resolves rgb(), hsl(), oklch(), named colours alike)
    if (!probe) { var cv = document.createElement("canvas"); cv.width = cv.height = 1; probe = cv.getContext("2d", { willReadFrequently: true }); }
    probe.clearRect(0, 0, 1, 1); probe.fillStyle = "rgba(0,0,0,0)"; probe.fillStyle = css; probe.fillRect(0, 0, 1, 1);
    return probe.getImageData(0, 0, 1, 1).data;
  }
  function pageIsDark() {
    var t = ds.theme; if (t === "dark") return true; if (t === "light") return false;
    var els = [document.body, document.documentElement];
    for (var i = 0; i < els.length; i++) {
      if (!els[i]) continue;
      var d = rgba(getComputedStyle(els[i]).backgroundColor);
      if (d[3] >= 128) return d[0] * 0.299 + d[1] * 0.587 + d[2] * 0.114 < 128;
    }
    // no opaque background anywhere: the canvas is white, unless the page asked for a dark colour-scheme and the system is dark
    return matchMedia("(prefers-color-scheme: dark)").matches && /\bdark\b/.test(getComputedStyle(document.documentElement).colorScheme);
  }
  function readDust() { dark = pageIsDark(); palette = tokens() || (dark ? DARK_DUST : LIGHT_DUST); }
  function spawnDust(x, y, n, burst) {
    for (var j = 0; j < n; j++) {
      var wantG = j % 2 === 0, el = (wantG ? gpool : pool).pop() || (wantG ? pool : gpool).pop(); // one glint, one mote per pair
      if (!el) return;
      var g = el.dataset.grain === "glint", c = palette[(Math.random() * palette.length) | 0], vx, vy;
      el.style.color = c;
      if (g) el.firstChild.lastChild.setAttribute("opacity", dark ? "1" : "0"); // the white core is a dark-page highlight; on light pages it would hollow the star out
      el.style.filter = dark ? "drop-shadow(0 0 2.5px " + c + ")" : "none"; // static glow, dark pages only; light pages stay crisp
      if (burst) { var a = j / n * 6.283 + Math.random() * 0.4, sp = 1.1 + Math.random() * 1.6; vx = Math.cos(a) * sp; vy = Math.sin(a) * sp - 0.5; }
      else { vx = (Math.random() - 0.5) * 0.6; vy = (Math.random() - 0.5) * 0.5 + 0.1; }
      live.push({ el: el, d: true, g: g, x: x, y: y, vx: vx, vy: vy, grav: 0.012 + Math.random() * 0.018, life: 0,
        ttl: g ? 50 + Math.random() * 36 : 34 + Math.random() * 26, s: g ? 4 + Math.random() * 5.5 : 1 + Math.random() * 1.2,
        rot: g && Math.random() < 0.5 ? 45 : 0, ph: Math.random() * 6.283, sw: Math.random() * 6.283 });
      el.style.opacity = "1";
    }
  }
  function stepDust(p, k) {
    var t = p.life / p.ttl, fade = Math.max(0, 1 - t), tw = 0.5 + 0.5 * Math.sin(p.life * 0.42 + p.ph); // period ~15 frames at 60 Hz
    p.x += (p.vx + Math.sin(p.life * 0.08 + p.sw) * 0.12) * k; p.y += p.vy * k; p.vy += p.grav * k; p.vx *= Math.pow(0.965, k);
    var scale, op;
    if (p.g) { scale = p.s / 10 * (0.7 + 0.3 * tw) * (1 - t * 0.3); op = fade * (0.4 + 0.6 * tw); }
    else { scale = p.s / 3 * (1 - t * 0.5); op = fade; }
    p.el.style.transform = "translate(" + p.x + "px," + p.y + "px) rotate(" + p.rot + "deg) scale(" + scale + ")";
    p.el.style.opacity = String(op);
  }

  function wake() { if (!raf) { if (dust) readDust(); last = 0; raf = requestAnimationFrame(tick); } }
  function onMove(e) { mx = e.clientX; my = e.clientY; moved = true; wake(); }
  function onClick(e) { wake(); if (dust) spawnDust(e.clientX, e.clientY, 10, true); else spawn(e.clientX, e.clientY, 14, 6); }

  function tick(now) {
    raf = 0;
    if (!layer) return;
    var k = last ? Math.min((now - last) / 16.667, 3) : 1; last = now; // 1 = one 60 Hz frame
    if (moved) {
      var storm = ds.trailDensity === "storm";
      if (storm ? now - lastMove > 16 : fresh || Math.hypot(mx - sx, my - sy) >= 24) { if (dust) spawnDust(mx, my, 2, false); else spawn(mx, my, 2, 2); lastMove = now; sx = mx; sy = my; fresh = false; moved = false; }
      else if (!storm) moved = false; // sparse: a short move spawns nothing and is dropped, so the loop can rest; the next mousemove adds to it
    }
    for (var i = live.length - 1; i >= 0; i--) {
      var p = live[i]; p.life += k;
      if (p.d) stepDust(p, k);
      else {
        p.x += p.vx * k; p.y += p.vy * k; p.vy += 0.12 * k; p.vx *= Math.pow(0.96, k);
        var t = p.life / p.ttl;
        p.el.style.transform = "translate(" + p.x + "px," + p.y + "px) scale(" + (1 - t) + ") rotate(" + p.rot + "deg)";
        p.el.style.opacity = String(1 - t);
      }
      if (p.life >= p.ttl) { p.el.style.opacity = "0"; (p.g ? gpool : pool).push(p.el); live.splice(i, 1); }
    }
    if (live.length || moved) raf = requestAnimationFrame(tick); // otherwise rest: zero frames until the next move or click
  }

  function start() {
    if (layer) return;
    if (!matchMedia("(pointer: fine)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!document.body) { document.addEventListener("DOMContentLoaded", start, { once: true }); return; } // script in <head>
    var variant = ds.trail || "sparkle", paletteName = ds.palette || "candy";
    dust = variant === "glints";
    palette = tokens() || PALETTES[paletteName] || PALETTES.candy;
    if (dust) readDust();
    var glyph = GLYPH[variant] || GLYPH.sparkle;
    glow = paletteName === "neon" || variant === "fairydust";
    var fontSize = variant === "fairydust" ? 11 : 14;

    layer = document.createElement("div");
    layer.className = "stp-trail";
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483600;overflow:hidden";
    for (var i = 0; i < MAX && dust; i++) { // glints: 36 four-point glints + 44 motes = the same cap of 80, built once
      var d = document.createElement("span"), glint = i < 36;
      d.dataset.grain = glint ? "glint" : "mote";
      d.style.cssText = "position:absolute;left:0;top:0;opacity:0;will-change:transform,opacity;pointer-events:none;" + (glint ? "width:20px;height:20px;margin:-10px 0 0 -10px" : "width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:currentColor");
      if (glint) { d.innerHTML = '<svg viewBox="-10 -10 20 20" width="20" height="20"><path d="' + STAR.replace(/-?[\d.]+/g, function (n) { return +(n * 10).toFixed(2); }) + '" fill="currentColor"/><path d="' + STAR.replace(/-?[\d.]+/g, function (n) { return +(n * 3).toFixed(2); }) + '" fill="#fff"/></svg>'; d.firstChild.style.display = "block"; } // display via the CSSOM: an inline style="" in innerHTML is blocked by a strict style-src CSP (36 console errors)
      layer.appendChild(d); (glint ? gpool : pool).push(d);
    }
    for (var i = 0; i < MAX && !dust; i++) {
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
    layer.remove(); layer = null; pool = []; gpool = []; live = []; moved = false; dust = false;
  }

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.sparkleTrail = { start: start, destroy: destroy };
  start();
})();
