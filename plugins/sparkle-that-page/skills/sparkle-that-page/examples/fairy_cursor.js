/* fairy_cursor.js — sparkle-that-page
 * Use:  <script src="fairy_cursor.js"></script>
 * Pick a wand: <html data-wand="star">  (star | heart | moon | pixel)
 * No-op on touch/coarse pointers. Static image, so reduced-motion is unaffected. */
(function () {
  "use strict";
  if (!matchMedia("(pointer: fine)").matches) return; // touch: keep native cursor

  var WANDS = {
    star: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="7" y1="25" x2="22" y2="10" stroke="#c084fc" stroke-width="3" stroke-linecap="round"/><path d="M24 3l1.7 3.7 4 .4-3 2.7.9 4-3.6-2.1-3.6 2.1.9-4-3-2.7 4-.4z" fill="#fde047" stroke="#f59e0b" stroke-width=".7"/></svg>',
    heart: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="7" y1="25" x2="21" y2="11" stroke="#f9a8d4" stroke-width="3" stroke-linecap="round"/><path d="M24 4c-1.4-1.6-4-1-4 1.3 0 2 2.6 3.6 4 4.7 1.4-1.1 4-2.7 4-4.7 0-2.3-2.6-2.9-4-1.3z" fill="#f472b6" stroke="#db2777" stroke-width=".7"/></svg>',
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="7" y1="25" x2="21" y2="11" stroke="#a5b4fc" stroke-width="3" stroke-linecap="round"/><path d="M27 7a5 5 0 1 0 0 6 4 4 0 0 1 0-6z" fill="#fde68a" stroke="#f59e0b" stroke-width=".7"/></svg>',
    pixel: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="11" width="2" height="2" fill="#c084fc"/><rect x="5" y="9" width="2" height="2" fill="#c084fc"/><rect x="7" y="7" width="2" height="2" fill="#c084fc"/><rect x="10" y="2" width="2" height="2" fill="#fde047"/><rect x="9" y="3" width="4" height="2" fill="#fde047"/><rect x="10" y="5" width="2" height="1" fill="#fde047"/><rect x="9" y="1" width="2" height="1" fill="#fde047"/></svg>'
  };
  var variant = (document.documentElement.dataset.wand || "star");
  var svg = WANDS[variant] || WANDS.star;
  var uri = "data:image/svg+xml," + encodeURIComponent(svg);
  var prev = document.documentElement.style.cursor;
  // Hotspot at the wand's star/tip (top-right of the 32px image).
  document.documentElement.style.cursor = 'url("' + uri + '") 26 5, auto';

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.fairyCursor = { destroy: function () { document.documentElement.style.cursor = prev; } };
})();
