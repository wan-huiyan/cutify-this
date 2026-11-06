/* favicon_mood.js - cutify-that-tab
 * A tab icon with moods: the mascot sleeps at night and while the tab is in the background,
 * and the page can show it sad (an error) or starry-eyed (a success).
 *
 *   <link rel="icon" type="image/svg+xml" href="pixel_mochi_cat.svg"
 *         data-mood-awake="pixel_mochi_cat.svg"
 *         data-mood-sleep="mochi_cat_sleep.svg"
 *         data-mood-sad="mochi_cat_sad.svg"
 *         data-mood-starry="mochi_cat_starry.svg"
 *         data-bedtime="18-7">
 *   <script src="favicon_mood.js"></script>
 *
 * data-mood-awake is required; the other three are optional (a mood with no file shows the awake icon).
 * data-bedtime is "start-end" in local hours, "18-7" by default (asleep from 18:00 until 07:00).
 *   Minutes are fine ("22:30-6:15"); "18-18" turns the clock off, so only a hidden tab sleeps.
 *   Hours are 0-23 and minutes 0-59; anything else ("25-7", "18:75-7") logs a warning and uses 18-7.
 *
 * Which icon wins, first match:
 *   1. a page override from window.CutifyTab.mood.set(...)      sad / starry / sleep / awake
 *   2. the tab is hidden (the user is in another tab)           sleep
 *   3. the clock is inside the bedtime window                   sleep
 *   4. otherwise                                                awake
 * An override beats a hidden tab on purpose: an error should still show in the tab strip while the user is away.
 *
 * API (window.CutifyTab.mood)
 *   set('sad' | 'starry' | 'sleep' | 'awake' | null)   null hands control back to the clock and the tab.
 *                                                      'awake' pins the awake icon even at night.
 *   get()      the mood this script is asking for now: 'awake' | 'sleep' | 'sad' | 'starry'. It is not always what the
 *              tab shows: while another script (peekaboo) owns the href, or after destroy(), the tab can differ.
 *   start()    start listening (this script calls it once on load; calling it again does nothing)
 *   destroy()  stop listening and put the link's original href back
 *
 * With sparkle-that-page's tab_title_peekaboo.js (data-peekaboo-favicon on <html>): its away icon wins while the tab
 * is hidden, and this script does not fight it. The rule is not specific to peekaboo: while the tab is hidden, if
 * someone else changed the link's href since this script last wrote it, this script leaves it alone. When the tab is
 * visible again the mood icon comes back (peekaboo puts its saved href back first; this script re-applies one tick
 * later). Load order of the two scripts does not matter. The one exception is an explicit set('sad' | ...) from the
 * page, which still shows while hidden: the page asked for it.
 *
 * Tab icons are not animated: the swap happens on visibilitychange and once a minute for the clock.
 * Several <link data-mood-awake> elements (for example a dark-mode pair with media="...") each get this treatment.
 */
(function () {
  "use strict";
  var root = (window.CutifyTab = window.CutifyTab || {});
  if (root.mood && root.mood.destroy) root.mood.destroy();   // a second copy of the script replaces the first

  var DEFAULT_BEDTIME = [18 * 60, 7 * 60];
  var STATES = ["awake", "sleep", "sad", "starry"];
  var entries = [], override = null, running = false, timer = 0, tickSoon = 0;

  function parseBedtime(text) {
    var m = /^\s*(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*$/.exec(text || "");
    // hours 0-23, minutes 0-59: "25-7" or "18:75-7" would otherwise never match (or match the wrong span) without a word
    var ok = m && Number(m[1]) < 24 && Number(m[3]) < 24 && Number(m[2] || 0) < 60 && Number(m[4] || 0) < 60;
    if (!ok) { if (text) console.warn('favicon_mood: data-bedtime="' + text + '" is not like "18-7" (hours 0-23, minutes 0-59); using 18-7'); return DEFAULT_BEDTIME; }
    return [Number(m[1]) * 60 + Number(m[2] || 0), Number(m[3]) * 60 + Number(m[4] || 0)];
  }
  function isNight(bed) {
    var d = new Date(), now = d.getHours() * 60 + d.getMinutes(), s = bed[0], e = bed[1];
    if (s === e) return false;
    return s < e ? now >= s && now < e : now >= s || now < e;
  }
  function hidden() { return document.hidden === true || document.visibilityState === "hidden"; }
  function stateOf(entry) {
    if (override) return override;
    if (hidden() || isNight(entry.bed)) return "sleep";
    return "awake";
  }
  function hrefFor(entry, state) { return entry.hrefs[state] || entry.hrefs.awake; }

  function apply() {
    if (!running) return;
    entries.forEach(function (e) {
      var cur = e.link.getAttribute("href"), want = hrefFor(e, stateOf(e));
      // hidden tab, no page override, and the href is not the one we wrote: someone else (peekaboo) owns it for now
      if (hidden() && !override && e.applied !== null && cur !== e.applied) return;
      if (cur !== want) e.link.setAttribute("href", want);
      e.applied = want;
    });
  }

  function onVisibility() {
    apply();
    // peekaboo may run after this listener, both when the tab hides (it swaps in its away icon) and when it comes back
    // (it restores the href it saved): look again once every listener has run.
    clearTimeout(tickSoon);
    tickSoon = setTimeout(apply, 0);
  }

  function start() {
    if (running) return;
    entries = [].slice.call(document.querySelectorAll("link[data-mood-awake]")).map(function (link) {
      var ds = link.dataset, hrefs = {
        awake: ds.moodAwake, sleep: ds.moodSleep, sad: ds.moodSad, starry: ds.moodStarry };
      return { link: link, original: link.getAttribute("href"), applied: null, hrefs: hrefs, bed: parseBedtime(ds.bedtime) };
    });
    if (!entries.length) { console.warn('favicon_mood: no <link rel="icon" data-mood-awake="..."> found'); return; }
    running = true;
    entries.forEach(function (e) {   // fetch every icon now so a swap never shows a blank square
      STATES.forEach(function (s) { if (e.hrefs[s]) new Image().src = e.hrefs[s]; });
    });
    document.addEventListener("visibilitychange", onVisibility);
    timer = setInterval(apply, 60000);
    apply();
  }

  function destroy() {
    document.removeEventListener("visibilitychange", onVisibility);
    clearInterval(timer); clearTimeout(tickSoon);
    if (running) entries.forEach(function (e) {
      if (e.original == null) e.link.removeAttribute("href"); else e.link.setAttribute("href", e.original);
    });
    running = false; entries = []; override = null;
  }

  function set(value) {
    if (value !== null && STATES.indexOf(value) < 0) {
      console.warn("favicon_mood: set(" + JSON.stringify(value) + ") ignored; use sad, starry, sleep, awake or null");
      return get();
    }
    override = value;
    apply();
    return get();
  }

  function get() {
    if (!running || !entries.length) return override || "awake";
    var s = stateOf(entries[0]);
    return entries[0].hrefs[s] ? s : "awake";
  }

  root.mood = { set: set, get: get, start: start, destroy: destroy };
  start();
})();
