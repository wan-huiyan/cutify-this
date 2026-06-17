/* scroll_indicator.js — sparkle-that-page
 * Use: <script src="scroll_indicator.js"></script>   Variant: <html data-scroll="ring">
 * ring = filling % ring (bottom-right), comet = top progress bar with a sparkle head,
 * mascot = a little face that climbs a rail on the right. Idle bob unless reduced-motion. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var variant = document.documentElement.dataset.scroll || "ring";
  var el, raf, ring, label;

  if (variant === "comet") {
    el = document.createElement("div");
    el.style.cssText = "position:fixed;top:0;left:0;height:4px;width:0;z-index:2147483601;background:linear-gradient(90deg,#f9a8d4,#c084fc,#a5b4fc);pointer-events:none;border-radius:0 3px 3px 0";
    var head = document.createElement("span"); head.textContent = "✦";
    head.style.cssText = "position:absolute;right:-7px;top:-7px;font-size:14px;color:#fde047";
    el.appendChild(head); document.body.appendChild(el);
  } else if (variant === "mascot") {
    el = document.createElement("div");
    el.style.cssText = "position:fixed;right:10px;top:0;width:30px;height:30px;z-index:2147483601;pointer-events:none;transition:top .08s linear";
    el.innerHTML = '<svg width="30" height="30" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="3" width="2" height="2" fill="#fda4af"/><rect x="11" y="3" width="2" height="2" fill="#fda4af"/><rect x="3" y="5" width="10" height="9" fill="#fff" stroke="#f9a8d4" stroke-width=".4"/><rect x="5" y="8" width="1" height="2" fill="#1f2937"/><rect x="10" y="8" width="1" height="2" fill="#1f2937"/><rect x="7" y="10" width="2" height="1" fill="#1f2937"/></svg>';
    document.body.appendChild(el);
  } else { // ring
    el = document.createElement("div");
    el.style.cssText = "position:fixed;right:16px;bottom:16px;width:48px;height:48px;z-index:2147483601;pointer-events:none";
    el.innerHTML = '<svg width="48" height="48" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="#f3e8ff" stroke-width="4"/><circle id="stp-ring" cx="18" cy="18" r="15" fill="none" stroke="#c084fc" stroke-width="4" stroke-linecap="round" stroke-dasharray="94.2" stroke-dashoffset="94.2" transform="rotate(-90 18 18)"/></svg><span id="stp-pct" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 11px system-ui;color:#a855f7">0%</span>';
    ring = el.querySelector("#stp-ring"); label = el.querySelector("#stp-pct"); document.body.appendChild(el);
    if (!reduce) { el.animate([{ transform: "translateY(0)" }, { transform: "translateY(-3px)" }, { transform: "translateY(0)" }], { duration: 2600, iterations: Infinity }); }
  }

  function pct() { var h = document.documentElement.scrollHeight - innerHeight; return h <= 0 ? 0 : Math.min(1, Math.max(0, scrollY / h)); }
  function render() {
    var p = pct();
    if (variant === "comet") { el.style.width = (p * 100) + "%"; }
    else if (variant === "mascot") { el.style.top = (p * (innerHeight - 34)) + "px"; }
    else { ring.style.strokeDashoffset = String(94.2 * (1 - p)); label.textContent = Math.round(p * 100) + "%"; }
    raf = 0;
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(render); }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  render();

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.scrollIndicator = { destroy: function () { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); el.remove(); } };
})();
