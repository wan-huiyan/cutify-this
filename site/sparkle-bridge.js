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
              variants: { sparkle: 'sparkle', star: 'star', heart: 'heart' } },
  confetti: { file: 'click_confetti.js',     win: 'clickConfetti',   attr: 'confetti',
              variants: { confetti: 'confetti', heart: 'heart', star: 'star', petal: 'petal' } },
  cursor:   { file: 'fairy_cursor.js',       win: 'fairyCursor',     attr: 'wand',
              variants: { star: 'star', heart: 'heart', moon: 'moon', crystal: 'pixel' } },
  floaters: { file: 'ambient_floaters.js',   win: 'ambientFloaters', attr: 'floaters',
              variants: { stars: 'dust', sakura: 'sakura', snow: 'snowflake', bubbles: 'bubbles' } },
  scroll:   { file: 'scroll_indicator.js',   win: 'scrollIndicator', attr: 'scroll',
              variants: { cat: 'mascot', comet: 'comet' } },
  tab:      { file: 'tab_title_peekaboo.js', win: 'tabPeekaboo',
              moods: { shy:    ['come back! 🥺', '🥺'],
                       love:   ['miss you 💕', '💕'],
                       sleepy: ['zzz… 😴', '😴'],
                       ghost:  ['boo! 👻', '👻'] } },
};

let _n = 0;

/* Inject (or re-inject) a module's <script>. `key` is the window.SparkleThatPage property name,
 * used as the data-stp marker too. The ?v= cache-bust guarantees the same file re-executes on
 * re-inject (honored over http; ignored over file://). Resolves to the module instance, or null
 * if the module no-opped on this device (e.g. touch / reduced-motion guards). */
export function injectEffect(file, key) {
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = EFFECTS_DIR + file + '?v=' + (++_n);
    s.setAttribute('data-stp', key);
    s.onload = () => resolve((window.SparkleThatPage && window.SparkleThatPage[key]) || null);
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

/* High-level start/stop used by both pages. Sets the data-* the module reads, then injects it. */
export async function startFx(key, variant) {
  const spec = EFFECT_SPECS[key];
  if (!spec) return;
  stopFx(key);
  const ds = document.documentElement.dataset;
  if (spec.attr) ds[spec.attr] = (spec.variants && spec.variants[variant]) || Object.values(spec.variants)[0];
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
}

export function stopFx(key) {
  const spec = EFFECT_SPECS[key];
  if (spec) destroyEffect(spec.win);
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
