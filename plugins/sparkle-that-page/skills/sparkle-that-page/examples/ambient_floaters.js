/* ambient_floaters.js — sparkle-that-page
 * Use: <script src="ambient_floaters.js"></script>   Variant: <html data-floaters="sakura">
 * sakura | bubbles | snow | dust. Behind content, pointer-events:none. No-op on reduced-motion. */
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var ds = document.documentElement.dataset;
  var variant = ds.floaters || "sakura";
  var N = Math.max(1, Math.min(60, parseInt(ds.floatersCount, 10) || 18));
  var GLYPH = { sakura: "❀", bubbles: "○", snow: "❄", dust: "✦" };
  var COLOR = { sakura: "#fbcfe8", bubbles: "#bae6fd", snow: "#ffffff", dust: "#fde68a" };
  var glyph = GLYPH[variant] || GLYPH.sakura, color = COLOR[variant] || COLOR.sakura;

  var layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden";
  document.body.appendChild(layer);

  var items = [];
  function reset(p, top) {
    p.x = Math.random() * innerWidth; p.y = top ? -20 : Math.random() * innerHeight;
    p.vy = 0.3 + Math.random() * 0.8; p.vx = (Math.random() - 0.5) * 0.5; p.sway = Math.random() * 6.28; p.size = 10 + Math.random() * 12;
    p.el.style.fontSize = p.size + "px"; p.el.style.opacity = String(0.4 + Math.random() * 0.5);
  }
  for (var i = 0; i < N; i++) {
    var el = document.createElement("span"); el.textContent = glyph;
    el.style.cssText = "position:absolute;will-change:transform;color:" + color;
    layer.appendChild(el); var p = { el: el }; reset(p, false); items.push(p);
  }
  var raf;
  function tick() {
    for (var i = 0; i < items.length; i++) {
      var p = items[i]; p.sway += 0.02; p.y += p.vy; p.x += p.vx + Math.sin(p.sway) * 0.4;
      if (p.y > innerHeight + 20) reset(p, true);
      p.el.style.transform = "translate(" + p.x + "px," + p.y + "px) rotate(" + (p.sway * 30) + "deg)";
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.ambientFloaters = { destroy: function () { cancelAnimationFrame(raf); layer.remove(); } };
})();
