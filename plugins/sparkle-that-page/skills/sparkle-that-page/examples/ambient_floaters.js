/* ambient_floaters.js — sparkle-that-page
 * Use: <script src="ambient_floaters.js"></script>   (starts on load)   Variant: <html data-floaters="sakura">
 *   sakura | leaves | snowflake | bubbles | dust | fairydust
 *   dust & fairydust pick colors from <html data-palette="candy"> (candy | neon | meadow)
 *   count: <html data-floaters-count="18">
 *   dust/fairydust read CSS tokens --stp-c1…c6 (see cute_chrome.css) first; built-in arrays are the fallback.
 * A slow layer of drifting things behind the content. pointer-events:none.
 * Time-based motion (same speed at 60 / 120 Hz). No-op (start() too) on reduced-motion.
 * Ambient by design: the rAF loop runs for as long as the effect is on (there is no "idle" for a drifting layer) —
 *   it is the one effect that does not rest. destroy() stops it; the browser already pauses rAF in background tabs.
 * In <head> it waits for DOMContentLoaded.
 * API: SparkleThatPage.ambientFloaters.start() / .destroy() — start() is idempotent; destroy() then start() brings it
 *   back and re-reads the data-* attributes. */
(function () {
  "use strict";
  var PALETTES = {
    candy:  ["#f472b6", "#c084fc", "#fde047", "#a5b4fc", "#fb7185"],
    neon:   ["#2ee6ff", "#b6ff3d", "#ff5ad0", "#ffb43d", "#ffffff"],
    meadow: ["#e87a90", "#6a5acd", "#4aad9a", "#d4943a", "#b8a8e0", "#f4c4a0"]
  };
  var GLYPH = { sakura: "❀", leaves: "🍃", snowflake: "❄", dust: "✦", fairydust: "•" };
  var FIXED = { sakura: "#fbcfe8", snowflake: "#ffffff", leaves: "#86efac" };
  function tokens() { var cs = getComputedStyle(document.documentElement), o = []; for (var i = 1; i <= 6; i++) { var v = cs.getPropertyValue("--stp-c" + i).trim(); if (v) o.push(v); } return o.length ? o : null; }

  var layer = null, items = [], raf = 0, last = 0, variant, palette, usePalette, glow, isBubble;

  function paint(el) {
    if (isBubble) {
      el.style.borderRadius = "50%";
      el.style.background = "radial-gradient(circle at 32% 30%, rgba(255,255,255,.92), rgba(186,230,253,.5) 45%, rgba(125,211,252,.22) 100%)";
      el.style.boxShadow = "inset 0 0 4px rgba(255,255,255,.7), 0 0 6px rgba(125,211,252,.35)";
    } else {
      var c = usePalette ? palette[(Math.random() * palette.length) | 0] : (FIXED[variant] || "#fbcfe8");
      el.textContent = GLYPH[variant] || "❀";
      el.style.color = c;
      el.style.textShadow = glow ? "0 0 7px " + c : "none";
    }
  }
  function reset(p, top) {
    p.x = Math.random() * innerWidth; p.y = top ? -24 : Math.random() * innerHeight;
    p.vy = 0.3 + Math.random() * 0.8; p.vx = (Math.random() - 0.5) * 0.5; p.sway = Math.random() * 6.28;
    p.size = isBubble ? (8 + Math.random() * 16) : (10 + Math.random() * 12);
    if (isBubble) { p.el.style.width = p.size + "px"; p.el.style.height = p.size + "px"; }
    else { p.el.style.fontSize = p.size + "px"; }
    p.el.style.opacity = String(0.4 + Math.random() * 0.5);
  }
  function tick(now) {
    var k = last ? Math.min((now - last) / 16.667, 3) : 1; last = now; // 1 = one 60 Hz frame
    for (var i = 0; i < items.length; i++) {
      var p = items[i]; p.sway += 0.02 * k; p.y += p.vy * k; p.x += (p.vx + Math.sin(p.sway) * 0.4) * k;
      if (p.y > innerHeight + 24) reset(p, true);
      p.el.style.transform = isBubble
        ? "translate(" + p.x + "px," + p.y + "px)"
        : "translate(" + p.x + "px," + p.y + "px) rotate(" + (p.sway * 30) + "deg)";
    }
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (layer || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!document.body) { document.addEventListener("DOMContentLoaded", start, { once: true }); return; } // script in <head>
    var ds = document.documentElement.dataset;
    variant = ds.floaters || "sakura";
    var N = Math.max(1, Math.min(60, parseInt(ds.floatersCount, 10) || 18));
    palette = tokens() || PALETTES[ds.palette] || PALETTES.candy;
    usePalette = variant === "dust" || variant === "fairydust";
    glow = ds.palette === "neon" || variant === "fairydust";
    isBubble = variant === "bubbles";

    layer = document.createElement("div");
    layer.className = "stp-floaters";
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden";
    document.body.appendChild(layer);
    items = [];
    for (var i = 0; i < N; i++) {
      var el = document.createElement("span");
      el.style.cssText = "position:absolute;will-change:transform";
      paint(el);
      layer.appendChild(el);
      var p = { el: el }; reset(p, false); items.push(p);
    }
    last = 0;
    raf = requestAnimationFrame(tick);
  }
  function destroy() {
    document.removeEventListener("DOMContentLoaded", start);
    if (!layer) return;
    cancelAnimationFrame(raf); raf = 0;
    layer.remove(); layer = null; items = [];
  }

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.ambientFloaters = { start: start, destroy: destroy };
  start();
})();
