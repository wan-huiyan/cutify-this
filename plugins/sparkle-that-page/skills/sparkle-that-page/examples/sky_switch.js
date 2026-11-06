/* sky_switch.js — sparkle-that-page
 * A sun / moon button that switches the page between light and dark WITHOUT ever flashing the wrong theme.
 * Two parts:
 *   1. The inline snippet below, pasted into <head> BEFORE any stylesheet. It runs synchronously before first paint,
 *      reads the saved choice (localStorage "stp:theme", in try/catch) or falls back to prefers-color-scheme, and sets
 *      <html data-theme="light|dark">. If the page already has its own theme name there (data-theme="cupcake", a daisyUI
 *      or Tailwind theme), the snippet and this file leave it alone on load and on a system light / dark change;
 *      only a press of the toggle, an explicit choice, replaces it with light or dark. Do not load it with defer/async or move it to the end of <body>: that is the flash.
 *        <script>(function(){var r=document.documentElement,c=r.getAttribute("data-theme"),t;if(c&&c!=="light"&&c!=="dark")return;try{t=localStorage.getItem("stp:theme")}catch(e){}if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";r.setAttribute("data-theme",t)})()</script>
 *   2. This file (<script src="sky_switch.js"></script>, anywhere): it renders the toggle, flips the attribute and
 *      saves the choice. Your CSS styles the page from [data-theme="dark"] / [data-theme="light"]
 *      (and sets color-scheme, so form controls and scrollbars follow).
 * The toggle: a <button class="stp-sky"> (top-left) with aria-label "Dark mode" and aria-pressed (true = dark), or hook your
 *   own element by marking it data-sky-toggle (an empty one gets the sun / moon icon). It looks after itself without
 *   cute_chrome.css; the stylesheet only adds the polish. Both glyphs are in the button; the unused one is hidden by the JS.
 * No saved choice: the page follows the computer's light / dark setting, live, until the visitor presses the button.
 * Fires a "stp:theme" event on <html> (detail = "light" | "dark") when the theme changes.
 * Not a motion effect (the icon's small crossfade lives in cute_chrome.css under prefers-reduced-motion: no-preference).
 * API: SparkleThatPage.skySwitch = { theme(), set("light"|"dark"), start(), destroy() }
 *   destroy() removes the button it made and the listeners; it leaves <html data-theme> as it is (that is page state). */
(function () {
  "use strict";
  var KEY = "stp:theme", root = document.documentElement, mq = matchMedia("(prefers-color-scheme: dark)");
  var started = false, made = null;

  function saved() { try { var t = localStorage.getItem(KEY); return t === "light" || t === "dark" ? t : null; } catch (e) { return null; } }
  function theme() { var t = root.getAttribute("data-theme"); return t === "dark" || t === "light" ? t : (mq.matches ? "dark" : "light"); }
  function foreign() { var t = root.getAttribute("data-theme"); return !!t && t !== "light" && t !== "dark"; }   // the page's own theme name
  function put(t, remember) {
    var changed = root.getAttribute("data-theme") !== t;
    root.setAttribute("data-theme", t);
    if (remember) { try { localStorage.setItem(KEY, t); } catch (e) { /* this visit only */ } }
    paint();
    if (changed) root.dispatchEvent(new CustomEvent("stp:theme", { detail: t }));
  }

  var SVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<g class="stp-sun"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"/></g>' +
    '<g class="stp-moon"><path d="M20 14.2A8 8 0 0 1 9.8 4a8 8 0 1 0 10.2 10.2z" fill="currentColor"/></g></svg>';
  function toggles() { return document.querySelectorAll("[data-sky-toggle]"); }
  function paint() {
    var dark = theme() === "dark";
    Array.prototype.forEach.call(toggles(), function (b) {
      b.setAttribute("aria-pressed", dark ? "true" : "false");
      if (!b.hasAttribute("aria-label") && !b.textContent.trim()) b.setAttribute("aria-label", "Dark mode");
      if (b === made || (!b.children.length && !b.textContent.trim())) { if (!b.querySelector(".stp-sun")) { b.setAttribute("data-sky-icon", ""); b.innerHTML = SVG; } }
      var sun = b.querySelector(".stp-sun"), moon = b.querySelector(".stp-moon");   // hidden by the JS, so it works with no CSS at all
      if (sun) sun.setAttribute("opacity", dark ? "0" : "1");
      if (moon) moon.setAttribute("opacity", dark ? "1" : "0");
    });
  }
  function build() {
    if (made || !document.body || document.querySelector("[data-sky-toggle]")) return;
    made = document.createElement("button"); made.type = "button"; made.className = "stp-sky";
    made.setAttribute("data-sky-toggle", ""); made.setAttribute("aria-label", "Dark mode");
    made.style.cssText = "position:fixed;top:14px;left:14px;z-index:2147483603;width:40px;height:40px;padding:0;display:flex;align-items:center;justify-content:center;cursor:pointer";
    document.body.appendChild(made);
  }
  function onClick(e) { if (e.target && e.target.closest && e.target.closest("[data-sky-toggle]")) put(theme() === "dark" ? "light" : "dark", true); }
  function onSystem() { if (!saved() && !foreign()) put(mq.matches ? "dark" : "light", false); }
  function onReady() { build(); paint(); }

  function start() {
    if (started) return;
    started = true;
    if (!root.hasAttribute("data-theme")) root.setAttribute("data-theme", saved() || (mq.matches ? "dark" : "light")); // no head snippet: works, but may flash
    document.addEventListener("click", onClick, { passive: true });
    if (mq.addEventListener) mq.addEventListener("change", onSystem); else if (mq.addListener) mq.addListener(onSystem);
    if (document.body) onReady(); else document.addEventListener("DOMContentLoaded", onReady, { once: true });
  }
  function destroy() {
    if (!started) return;
    started = false;
    document.removeEventListener("click", onClick); document.removeEventListener("DOMContentLoaded", onReady);
    if (mq.removeEventListener) mq.removeEventListener("change", onSystem); else if (mq.removeListener) mq.removeListener(onSystem);
    if (made) { made.remove(); made = null; }
    Array.prototype.forEach.call(toggles(), function (b) { b.removeAttribute("aria-pressed"); if (b.hasAttribute("data-sky-icon")) { b.removeAttribute("data-sky-icon"); b.innerHTML = ""; } });
  }

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.skySwitch = { theme: theme, set: function (t) { if (t === "light" || t === "dark") put(t, true); }, start: start, destroy: destroy };
  start();
})();
