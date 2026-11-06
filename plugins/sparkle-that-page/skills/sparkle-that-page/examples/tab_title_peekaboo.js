/* tab_title_peekaboo.js — sparkle-that-page
 * Use: <script src="tab_title_peekaboo.js"></script>   (starts on load)
 * Config: <html data-peekaboo-msg="come back! 🥺" data-peekaboo-favicon="🥺">   (read each time start() runs)
 * (favicon swap is optional — omit data-peekaboo-favicon to leave the icon alone.)
 * The title to restore is read when the tab is hidden, so a title your app changed meanwhile is not overwritten.
 * API: SparkleThatPage.tabPeekaboo.start() / .destroy() — start() is idempotent; destroy() then start() brings it back.
 * Not a motion effect, so there is no reduced-motion or touch guard.
 * Ties back to cutify-that-tab: the away-favicon is an emoji-in-SVG, same trick. */
(function () {
  "use strict";
  var on = false, awayMsg, awayEmoji, origTitle = "", origHref = null, link = null, away = false;

  function emojiIcon(e) {
    return "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">' + e + "</text></svg>");
  }
  function back() {
    if (!away) return;
    away = false;
    if (document.title === awayMsg) document.title = origTitle;
    if (link) { if (origHref != null) link.setAttribute("href", origHref); else link.removeAttribute("href"); }
  }
  function onVis() {
    if (document.hidden) {
      if (away) return;
      away = true; origTitle = document.title; document.title = awayMsg;
      if (link) { origHref = link.getAttribute("href"); link.setAttribute("href", emojiIcon(awayEmoji)); }
    } else back();
  }
  function start() {
    if (on) return;
    on = true;
    var ds = document.documentElement.dataset;
    awayMsg = ds.peekabooMsg || "come back! 🥺";
    awayEmoji = ds.peekabooFavicon || ""; // empty = don't touch favicon
    link = null;
    if (awayEmoji) {
      link = document.querySelector('link[rel~="icon"]');
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    }
    document.addEventListener("visibilitychange", onVis);
  }
  function destroy() {
    if (!on) return;
    on = false;
    document.removeEventListener("visibilitychange", onVis);
    back();
  }

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.tabPeekaboo = { start: start, destroy: destroy };
  start();
})();
