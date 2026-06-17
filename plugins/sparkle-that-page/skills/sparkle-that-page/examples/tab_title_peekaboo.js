/* tab_title_peekaboo.js — sparkle-that-page
 * Use: <script src="tab_title_peekaboo.js"></script>
 * Config: <html data-peekaboo-msg="come back! 🥺" data-peekaboo-favicon="🥺">
 * (favicon swap is optional — omit data-peekaboo-favicon to leave the icon alone.)
 * Ties back to cutify-that-tab: the away-favicon is an emoji-in-SVG, same trick. */
(function () {
  "use strict";
  var ds = document.documentElement.dataset;
  var awayMsg = ds.peekabooMsg || "come back! 🥺";
  var awayEmoji = ds.peekabooFavicon || ""; // empty = don't touch favicon
  var origTitle = document.title, origHref = null, link = null;

  if (awayEmoji) {
    link = document.querySelector('link[rel~="icon"]');
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    origHref = link.getAttribute("href");
  }
  function emojiIcon(e) {
    return "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">' + e + "</text></svg>");
  }
  function onVis() {
    if (document.hidden) { document.title = awayMsg; if (link) link.setAttribute("href", emojiIcon(awayEmoji)); }
    else { document.title = origTitle; if (link && origHref != null) link.setAttribute("href", origHref); else if (link) link.removeAttribute("href"); }
  }
  document.addEventListener("visibilitychange", onVis);

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.tabPeekaboo = { destroy: function () { document.removeEventListener("visibilitychange", onVis); document.title = origTitle; if (link && origHref != null) link.setAttribute("href", origHref); } };
})();
