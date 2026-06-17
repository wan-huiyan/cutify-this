/* ambient_floaters.js — sparkle-that-page
 * Use: <script src="ambient_floaters.js"></script>   Variant: <html data-floaters="sakura">
 *   sakura | leaves | snowflake | bubbles | dust | fairydust
 *   dust & fairydust pick colors from <html data-palette="candy"> (candy | neon | meadow)
 *   count: <html data-floaters-count="18">
 * A slow layer of drifting things behind the content. pointer-events:none.
 * No-op on reduced-motion. */
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var ds = document.documentElement.dataset;
  var variant = ds.floaters || "sakura";
  var N = Math.max(1, Math.min(60, parseInt(ds.floatersCount, 10) || 18));

  var PALETTES = {
    candy:  ["#f472b6", "#c084fc", "#fde047", "#a5b4fc", "#fb7185"],
    neon:   ["#2ee6ff", "#b6ff3d", "#ff5ad0", "#ffb43d", "#ffffff"],
    meadow: ["#e87a90", "#6a5acd", "#4aad9a", "#d4943a", "#b8a8e0", "#f4c4a0"]
  };
  var palette = PALETTES[ds.palette] || PALETTES.candy;
  var GLYPH = { sakura: "❀", leaves: "🍃", snowflake: "❄", dust: "✦", fairydust: "•" };
  var FIXED = { sakura: "#fbcfe8", snowflake: "#ffffff", leaves: "#86efac" };
  var usePalette = variant === "dust" || variant === "fairydust";
  var glow = ds.palette === "neon" || variant === "fairydust";
  var isBubble = variant === "bubbles";

  var layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden";
  document.body.appendChild(layer);

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
  var items = [];
  function reset(p, top) {
    p.x = Math.random() * innerWidth; p.y = top ? -24 : Math.random() * innerHeight;
    p.vy = 0.3 + Math.random() * 0.8; p.vx = (Math.random() - 0.5) * 0.5; p.sway = Math.random() * 6.28;
    p.size = isBubble ? (8 + Math.random() * 16) : (10 + Math.random() * 12);
    if (isBubble) { p.el.style.width = p.size + "px"; p.el.style.height = p.size + "px"; }
    else { p.el.style.fontSize = p.size + "px"; }
    p.el.style.opacity = String(0.4 + Math.random() * 0.5);
  }
  for (var i = 0; i < N; i++) {
    var el = document.createElement("span");
    el.style.cssText = "position:absolute;will-change:transform";
    paint(el);
    layer.appendChild(el);
    var p = { el: el }; reset(p, false); items.push(p);
  }
  var raf;
  function tick() {
    for (var i = 0; i < items.length; i++) {
      var p = items[i]; p.sway += 0.02; p.y += p.vy; p.x += p.vx + Math.sin(p.sway) * 0.4;
      if (p.y > innerHeight + 24) reset(p, true);
      p.el.style.transform = isBubble
        ? "translate(" + p.x + "px," + p.y + "px)"
        : "translate(" + p.x + "px," + p.y + "px) rotate(" + (p.sway * 30) + "deg)";
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.ambientFloaters = { destroy: function () { cancelAnimationFrame(raf); layer.remove(); } };
})();
