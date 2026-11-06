/* scroll_indicator.js — sparkle-that-page
 * Use: <script src="scroll_indicator.js"></script>   (starts on load)   Variant: <html data-scroll="ring">
 * ring = filling % ring (bottom-right), comet = top progress bar with a sparkle head,
 * mascot = a little face that climbs a rail on the right. Only the ring bobs gently while idle (an endless
 * transform animation, run by the browser, not a frame callback; none under reduced motion).
 * At the bottom of the page the element gets the class "is-end" (removed again when you scroll up) and cheers once:
 * the mascot hops and smiles, the ring pops, the comet's head pops. Reduced motion: no hop or pop, the class still flips.
 *   The element carries data-stp-scroll="<variant>", so you can style the finish yourself: [data-stp-scroll].is-end { … }.
 * API: SparkleThatPage.scrollIndicator.start() / .destroy() — start() is idempotent; destroy() then start() brings it
 *   back and re-reads data-scroll.
 * Animates transform only (scaleX / translate), plus the ring's stroke-dashoffset. In <head> it waits for DOMContentLoaded. */
(function () {
  "use strict";
  var el = null, raf = 0, variant, ring, label, bar, head, mouth, smile, wasEnd = false;
  function reduced() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }

  function build() {
    variant = document.documentElement.dataset.scroll || "ring";
    if (variant === "comet") {
      el = document.createElement("div");
      el.style.cssText = "position:fixed;top:0;left:0;height:4px;width:100%;z-index:2147483601;pointer-events:none";
      bar = document.createElement("div");
      bar.style.cssText = "height:100%;width:100%;transform-origin:left;transform:scaleX(0);background:linear-gradient(90deg,#f9a8d4,#c084fc,#a5b4fc)";
      head = document.createElement("span"); head.textContent = "✦";
      head.style.cssText = "position:absolute;left:-7px;top:-7px;font-size:14px;color:#fde047";
      el.appendChild(bar); el.appendChild(head);
    } else if (variant === "mascot") {
      el = document.createElement("div");
      el.style.cssText = "position:fixed;right:10px;top:0;transform:translateY(0);width:30px;height:30px;z-index:2147483601;pointer-events:none;transition:transform .08s linear";
      el.innerHTML = '<svg width="30" height="30" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="3" width="2" height="2" fill="#fda4af"/><rect x="11" y="3" width="2" height="2" fill="#fda4af"/><rect x="3" y="5" width="10" height="9" fill="#fff" stroke="#f9a8d4" stroke-width=".4"/><rect x="5" y="8" width="1" height="2" fill="#1f2937"/><rect x="10" y="8" width="1" height="2" fill="#1f2937"/><rect class="stp-m1" x="7" y="10" width="2" height="1" fill="#1f2937"/><g class="stp-m2" display="none" fill="#1f2937"><rect x="6" y="10" width="4" height="1"/><rect x="7" y="11" width="2" height="1"/></g></svg>';
      mouth = el.querySelector(".stp-m1"); smile = el.querySelector(".stp-m2");
    } else { // ring
      variant = "ring";
      el = document.createElement("div");
      el.style.cssText = "position:fixed;right:16px;bottom:16px;width:48px;height:48px;z-index:2147483601;pointer-events:none";
      el.innerHTML = '<svg width="48" height="48" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="#f3e8ff" stroke-width="4"/><circle class="stp-ring" cx="18" cy="18" r="15" fill="none" stroke="#c084fc" stroke-width="4" stroke-linecap="round" stroke-dasharray="94.2" stroke-dashoffset="94.2" transform="rotate(-90 18 18)"/></svg><span class="stp-pct" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 11px system-ui;color:#a855f7">0%</span>';
      ring = el.querySelector(".stp-ring"); label = el.querySelector(".stp-pct");
      if (!reduced()) el.animate([{ transform: "translateY(0)" }, { transform: "translateY(-3px)" }, { transform: "translateY(0)" }], { duration: 2600, iterations: Infinity });
    }
    el.setAttribute("aria-hidden", "true");
    el.setAttribute("data-stp-scroll", variant);
    document.body.appendChild(el);
  }

  function cheer() { // one hop / pop, on the child that has no inline transform of its own, so nothing is overridden
    if (reduced()) return;
    if (variant === "mascot") el.firstChild.animate([{ transform: "translateY(0) rotate(0)" }, { transform: "translateY(-10px) rotate(-8deg)" }, { transform: "translateY(0) rotate(6deg)" }, { transform: "translateY(-4px) rotate(-3deg)" }, { transform: "none" }], { duration: 650, easing: "ease-out" });
    else if (variant === "ring") el.firstChild.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 450, easing: "ease-out" });
    else head.animate([{ scale: "1" }, { scale: "1.9" }, { scale: "1" }], { duration: 450, easing: "ease-out" }); // `scale` composes with the head's inline translateX
  }
  function pct() { var h = document.documentElement.scrollHeight - innerHeight; return h <= 0 ? 0 : Math.min(1, Math.max(0, scrollY / h)); }
  function atEnd() { var h = document.documentElement.scrollHeight - innerHeight; return h > 0 && scrollY >= h - 8; }
  function render() {
    raf = 0;
    if (!el) return;
    var p = pct(), end = atEnd();
    if (variant === "comet") { bar.style.transform = "scaleX(" + p + ")"; head.style.transform = "translateX(" + (p * document.documentElement.clientWidth) + "px)"; }
    else if (variant === "mascot") { el.style.transform = "translateY(" + (p * (innerHeight - 34)) + "px)"; mouth.setAttribute("display", end ? "none" : "inline"); smile.setAttribute("display", end ? "inline" : "none"); }
    else { ring.style.strokeDashoffset = String(94.2 * (1 - p)); label.textContent = Math.round(p * 100) + "%"; }
    el.classList.toggle("is-end", end);
    if (end && !wasEnd) cheer();
    wasEnd = end;
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(render); }

  function start() {
    if (el) return;
    if (!document.body) { document.addEventListener("DOMContentLoaded", start, { once: true }); return; } // script in <head>
    build();
    wasEnd = atEnd(); // landing already at the bottom is not a "reach": no cheer, but the state class is right
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    render();
  }
  function destroy() {
    document.removeEventListener("DOMContentLoaded", start);
    if (!el) return;
    cancelAnimationFrame(raf); raf = 0;
    removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll);
    el.remove(); el = null;
  }

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.scrollIndicator = { start: start, destroy: destroy };
  start();
})();
