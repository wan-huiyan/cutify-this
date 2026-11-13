/* sparkle-bridge.js — drives sparkle-that-page's REAL effect modules from the landing pages.
 *
 * The repo modules (plugins/.../examples/*.js) are auto-init IIFEs: each reads its config
 * from <html data-*> once on load, self-runs, and registers window.SparkleThatPage.<name>
 * with a .destroy(). They are NOT factories — you don't call them with options. So we drive
 * them exactly the way the repo's own examples/demo.html does:
 *   set data-* on <html>  →  inject the module <script>  →  call .destroy() to stop.
 * That reuses the shipped modules verbatim (rather than the prototype's sparkle-fx.js).
 *
 * Deployment note: EFFECTS_DIR points at the canonical modules via a repo-relative path,
 * so the site must be served from at/above the repo root (GitHub Pages from root is fine).
 * If the site ever ships standalone, copy the six modules + cute_chrome.css into site/assets/
 * and repoint EFFECTS_DIR. */

export const EFFECTS_DIR = new URL(
  '../plugins/sparkle-that-page/skills/sparkle-that-page/examples/',
  import.meta.url
).href;

/* Internal key  →  { module file, window.SparkleThatPage property, <html> data-attr, variant map }.
 * `win` is used as BOTH the destroy lookup and the data-stp marker so they can never desync.
 * Variant maps translate the prototype's variant names to the modules' real ones. */
export const EFFECT_SPECS = {
  trail:    { file: 'sparkle_trail.js',      win: 'sparkleTrail',    attr: 'trail',
              variants: { sparkle: 'sparkle', star: 'star', heart: 'heart', pixel: 'pixel', fairydust: 'fairydust', glints: 'glints' } },
  confetti: { file: 'click_confetti.js',     win: 'clickConfetti',   attr: 'confetti',
              variants: { confetti: 'confetti', heart: 'heart', star: 'star', paper: 'paper', ribbon: 'ribbon', sprinkles: 'sprinkles',
                          petal: 'petal', leaf: 'leaf', snow: 'snow', bubble: 'bubble', note: 'note', paw: 'paw', pixel: 'pixel' } },
  cursor:   { file: 'fairy_cursor.js',       win: 'fairyCursor',     attr: 'wand',
              variants: { star: 'star', heart: 'heart', magical: 'magical', wizard: 'wizard', garden: 'garden', cosmic: 'cosmic', candy: 'candy',
                          crystal: 'crystal', moon: 'moon', ocean: 'ocean', lollipop: 'lollipop', pixel: 'pixel' } },
  // "stars" meant the dust sparkles before 1.4 added a real stars family; "dust" is that old look now
  floaters: { file: 'ambient_floaters.js',   win: 'ambientFloaters', attr: 'floaters',
              variants: { dust: 'dust', sakura: 'sakura', snow: 'snowflake', snowflake: 'snowflake', bubbles: 'bubbles', leaves: 'leaves',
                          fairydust: 'fairydust', fireflies: 'fireflies', dandelion: 'dandelion', lanterns: 'lanterns', stars: 'stars',
                          clouds: 'clouds', hearts: 'hearts' } },
  // the four climbers are data-scroll="mascot" plus data-scroll-mascot (see `climbers`)
  scroll:   { file: 'scroll_indicator.js',   win: 'scrollIndicator', attr: 'scroll',
              variants: { cat: 'mascot', bunny: 'mascot', bear: 'mascot', frog: 'mascot', sprout: 'sprout', rocket: 'rocket',
                          caterpillar: 'caterpillar', moon: 'moon', balloon: 'balloon', ring: 'ring', comet: 'comet' },
              climbers: { cat: 'cat', bunny: 'bunny', bear: 'bear', frog: 'frog' } },
  tab:      { file: 'tab_title_peekaboo.js', win: 'tabPeekaboo',
              moods: { shy:    ['come back! 🥺', '🥺'],
                       love:   ['miss you 💕', '💕'],
                       sleepy: ['zzz… 😴', '😴'],
                       ghost:  ['boo! 👻', '👻'] } },
};

let _n = 0;
const wanted = new Set();  // keys a page has started and not stopped

/* Inject (or re-inject) a module's <script>. `key` is the window.SparkleThatPage property name,
 * used as the data-stp marker too. The ?v= cache-bust guarantees the same file re-executes on
 * re-inject (honored over http; ignored over file://). Resolves to the module instance, or null
 * if the module no-opped on this device (e.g. touch / reduced-motion guards). */
export function injectEffect(file, key) {
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = EFFECTS_DIR + file + '?v=' + (++_n);
    s.setAttribute('data-stp', key);
    s.onload = () => {
      const api = (window.SparkleThatPage && window.SparkleThatPage[key]) || null;
      keepArt(key, api);
      resolve(api);
    };
    s.onerror = () => resolve(null);
    document.body.appendChild(s);
  });
}

export function destroyEffect(key) {
  const api = window.SparkleThatPage && window.SparkleThatPage[key];
  if (api && api.destroy) { try { api.destroy(); } catch (e) {} }
  if (window.SparkleThatPage) delete window.SparkleThatPage[key];
  document.querySelectorAll('script[data-stp="' + key + '"]').forEach((s) => s.remove());
}

/* One queue per effect: every start, stop and loadArt for a key waits for the one before it, so only
 * one copy of a module is ever loading. Without it, a double-click starts a second copy while the first
 * is still loading; stopFx cannot destroy a copy that has not run yet, and both end up live
 * (double confetti on every later click, stacked floater layers, a stuck wand). */
const queues = {};
function inTurn(win, job) {
  const run = (queues[win] || Promise.resolve()).then(job);
  queues[win] = run.catch(() => {});
  return run;
}

/* High-level start/stop used by both pages. Sets the data-* the module reads, then injects it.
 * Resolves once the effect is running (or has declined to run on this device). */
export function startFx(key, variant) {
  const spec = EFFECT_SPECS[key];
  if (!spec) return Promise.resolve();
  wanted.add(key);
  return inTurn(spec.win, async () => {
    destroyEffect(spec.win);
    const ds = document.documentElement.dataset;
    if (spec.attr) ds[spec.attr] = (spec.variants && spec.variants[variant]) || Object.values(spec.variants)[0];
    if (spec.climbers) {
      if (spec.climbers[variant]) ds.scrollMascot = spec.climbers[variant]; else delete ds.scrollMascot;
    }
    if (spec.moods) {
      const m = spec.moods[variant] || spec.moods.shy;
      ds.peekabooMsg = m[0];
      ds.peekabooFavicon = m[1];
    }
    if (key === 'floaters') ds.floatersCount = '28';
    // The landing copy promises a dense trail and "every click bursts", so opt in to both explicitly
    // (the shipped defaults are sparse trail + confetti only on [data-celebrate] / [data-confetti]).
    if (key === 'trail') ds.trailDensity = 'storm';
    if (key === 'confetti') ds.confettiOn = '*';
    await injectEffect(spec.file, spec.win);
  });
}

export function stopFx(key) {
  const spec = EFFECT_SPECS[key];
  wanted.delete(key);
  if (!spec) return Promise.resolve();
  return inTurn(spec.win, () => destroyEffect(spec.win));
}

/* The drawing half of each module, kept after the effect is stopped, so a page can show the same
 * pictures the gallery pages show (wands, confetti pieces, floaters, scroll companions) whether or
 * not that effect is running. Only the pure parts are kept: they draw, they never start anything.
 *   cursor   → svg(family, palette, dark, on), families, palettes
 *   confetti → draw(ctx, family, palette, dark, x, y, size, i), colors(), families, palettes, motions,
 *              burst(x, y, { family, palette, motion }) only while confetti is running
 *   floaters → preview(canvas, family, { palette, dark, scale }), families, palettes
 *   scroll   → svg(family, state, dark, { mascot, progress, cell }), families, mascots, states */
const ART = {};
const ART_KEYS = ['svg', 'draw', 'colors', 'preview', 'families', 'palettes', 'motions', 'mascots', 'states'];

function keepArt(win, api) {
  if (!api) return;
  const kept = {};
  ART_KEYS.forEach((k) => { if (api[k] !== undefined) kept[k] = api[k]; });
  if (Object.keys(kept).length) ART[win] = kept;
}

/* Resolves to the drawing functions for an effect key ('cursor', 'confetti', 'floaters', 'scroll').
 * If the module was never loaded on this page it is loaded once and stopped straight away. */
export function loadArt(key) {
  const spec = EFFECT_SPECS[key];
  if (!spec) return Promise.resolve(null);
  if (ART[spec.win]) return Promise.resolve(ART[spec.win]);
  return inTurn(spec.win, async () => {
    if (ART[spec.win]) return ART[spec.win];
    const live = window.SparkleThatPage && window.SparkleThatPage[spec.win];
    if (live) { keepArt(spec.win, live); return ART[spec.win] || null; }
    await injectEffect(spec.file, spec.win);
    // loaded only for its pictures: stop it, unless the page has asked for this effect to run
    if (!wanted.has(key)) destroyEffect(spec.win);
    return ART[spec.win] || null;
  });
}

/* the live API (burst, active…) while an effect runs, else null */
export function liveFx(key) {
  const spec = EFFECT_SPECS[key];
  return (spec && window.SparkleThatPage && window.SparkleThatPage[spec.win]) || null;
}

/* prototype-only helper: eases an element toward the cursor when the pointer is near it. */
export function magnetic(el, opts) {
  opts = opts || {};
  const strength = opts.strength || 5, padding = opts.padding || 150;
  if (matchMedia('(hover: none)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return function () {};
  }
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, running = true;
  function onMove(e) {
    const r = el.getBoundingClientRect();
    const within = e.clientX > r.left - padding && e.clientX < r.right + padding &&
                   e.clientY > r.top - padding && e.clientY < r.bottom + padding;
    if (within) {
      tx = (e.clientX - (r.left + r.width / 2)) / strength;
      ty = (e.clientY - (r.top + r.height / 2)) / strength;
    } else { tx = 0; ty = 0; }
  }
  function loop() {
    cx += (tx - cx) * 0.1; cy += (ty - cy) * 0.1;
    el.style.transform = 'translate(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px)';
    if (running) raf = requestAnimationFrame(loop);
  }
  addEventListener('mousemove', onMove, { passive: true });
  raf = requestAnimationFrame(loop);
  return function () {
    running = false;
    cancelAnimationFrame(raf);
    removeEventListener('mousemove', onMove);
    el.style.transform = '';
  };
}
