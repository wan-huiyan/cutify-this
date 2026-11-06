/* fairy_cursor.js — sparkle-that-page
 * Use:  <script src="fairy_cursor.js"></script>   (starts on load)
 * Pick a wand: <html data-wand="star">  (star | heart | moon | pixel | sailormoon) — read each time start() runs.
 * Over things you can click (a[href], button, [role=button], label, summary, select, checkbox/radio/submit/button
 *   inputs, [data-celebrate], [data-stamp]) the wand glows: a second cursor image, set as --stp-wand-link.
 *   The base wand is set on <html> through the CSSOM (root.style.cursor), so it survives a strict Content-Security-Policy;
 *   only the glow rules live in an injected <style>, which a CSP such as style-src 'self' blocks — then you lose the glow
 *   over clickables and nothing else. Override --stp-wand / --stp-wand-link on <html> to swap images.
 * API: SparkleThatPage.fairyCursor.start() / .destroy() — start() is idempotent; destroy() then start() brings it back.
 * No-op (start() too) on touch/coarse pointers and in forced-colors mode (keeps the system's high-contrast pointer).
 * Static image, so reduced-motion is unaffected. */
(function () {
  "use strict";
  var root = document.documentElement, on = false, style = null, prevCursor = "";

  var WANDS = {
    star: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="7" y1="25" x2="22" y2="10" stroke="#c084fc" stroke-width="3" stroke-linecap="round"/><path d="M24 3l1.7 3.7 4 .4-3 2.7.9 4-3.6-2.1-3.6 2.1.9-4-3-2.7 4-.4z" fill="#fde047" stroke="#f59e0b" stroke-width=".7"/></svg>',
    heart: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="7" y1="25" x2="21" y2="11" stroke="#f9a8d4" stroke-width="3" stroke-linecap="round"/><path d="M24 4c-1.4-1.6-4-1-4 1.3 0 2 2.6 3.6 4 4.7 1.4-1.1 4-2.7 4-4.7 0-2.3-2.6-2.9-4-1.3z" fill="#f472b6" stroke="#db2777" stroke-width=".7"/></svg>',
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="7" y1="25" x2="21" y2="11" stroke="#a5b4fc" stroke-width="3" stroke-linecap="round"/><path d="M27 7a5 5 0 1 0 0 6 4 4 0 0 1 0-6z" fill="#fde68a" stroke="#f59e0b" stroke-width=".7"/></svg>',
    pixel: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="11" width="2" height="2" fill="#c084fc"/><rect x="5" y="9" width="2" height="2" fill="#c084fc"/><rect x="7" y="7" width="2" height="2" fill="#c084fc"/><rect x="10" y="2" width="2" height="2" fill="#fde047"/><rect x="9" y="3" width="4" height="2" fill="#fde047"/><rect x="10" y="5" width="2" height="1" fill="#fde047"/><rect x="9" y="1" width="2" height="1" fill="#fde047"/></svg>',
    sailormoon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="8" y1="28" x2="17" y2="15" stroke="#facc15" stroke-width="3" stroke-linecap="round"/><path d="M25 4a8 8 0 1 0 3.4 12.2A6.2 6.2 0 0 1 25 4z" fill="#fef08a" stroke="#eab308" stroke-width=".9"/><path d="M18.3 12.6c-1.2-1.4-3.5-.6-3.5 1.2 0 1.7 2.2 3 3.5 4 1.3-1 3.5-2.3 3.5-4 0-1.8-2.3-2.6-3.5-1.2z" fill="#f472b6" stroke="#db2777" stroke-width=".6"/><circle cx="17" cy="13.6" r=".9" fill="#fff" opacity=".85"/></svg>'
  };

  // Same wand with a soft gold glow + two glints behind it. The glow is drawn on the 32-unit grid, then scaled to
  // the wand's own viewBox (the pixel wand uses 16). Centred on the hotspot so it reads as "the tip lights up".
  function glowing(svg) {
    var vb = +(/viewBox="0 0 (\d+)/.exec(svg) || [0, 32])[1], k = vb / 32;
    var halo = '<defs><radialGradient id="g"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".4" stop-color="#fde047" stop-opacity=".75"/><stop offset="1" stop-color="#f472b6" stop-opacity="0"/></radialGradient></defs>' +
      '<g transform="scale(' + k + ')"><circle cx="26" cy="5" r="9" fill="url(#g)"/>' +
      '<path d="M13 3l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z" fill="#fff" stroke="#f472b6" stroke-width=".4"/>' +
      '<path d="M29 17l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="#fff" stroke="#f472b6" stroke-width=".4"/></g>';
    return svg.replace(/>/, '>' + halo);                           // right after the opening <svg …> tag
  }
  // Hotspot at the wand's star/tip (top-right of the 32px image).
  function cursor(svg, fallback) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") 26 5, ' + fallback; }

  var CSS = 'html.stp-wand :is(a[href],button,[role="button"],label,summary,select,input[type="checkbox"],input[type="radio"],input[type="submit"],input[type="button"],[data-celebrate],[data-stamp]):not(:disabled){cursor:var(--stp-wand-link,pointer)}';

  function start() {
    if (on || !matchMedia("(pointer: fine)").matches || matchMedia("(forced-colors: active)").matches) return;
    on = true;
    prevCursor = root.style.cursor;
    var svg = WANDS[root.dataset.wand || "star"] || WANDS.star;
    root.style.setProperty("--stp-wand", cursor(svg, "auto"));
    root.style.setProperty("--stp-wand-link", cursor(glowing(svg), "pointer"));
    root.style.cursor = "var(--stp-wand, auto)";                  // CSSOM, not a <style>: allowed under a strict CSP
    style = document.createElement("style"); style.textContent = CSS; (document.head || root).appendChild(style);
    root.classList.add("stp-wand");
  }
  function destroy() {
    if (!on) return;
    on = false;
    root.classList.remove("stp-wand");
    root.style.removeProperty("--stp-wand"); root.style.removeProperty("--stp-wand-link"); root.style.cursor = prevCursor;
    if (style) { style.remove(); style = null; }
  }

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.fairyCursor = { start: start, destroy: destroy };
  start();
})();
