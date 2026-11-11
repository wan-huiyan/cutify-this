// Headless-browser smoke test for the sparkle-that-page ambient floaters (ambient_floaters.js, drawn on one canvas):
// all 12 families draw and each moves the way it says (fall / rise / drift / wander / twinkle in place), the old
// attribute names still work, three depth layers, the 60 cap, every family is visible on white and on #111 (snow live,
// all 12 measured from preview() at real size; fireflies show a body, clouds stay moonlit on dark), clouds follow a window resize, light/dark follows the
// PAGE and repaints live, palettes and --stp-c tokens, reduced motion, destroy() stops every frame request and
// listener, a strict CSP page works, preview() draws a still picture, no font characters anywhere, and the gallery
// (floaters.html) and guide (floaters.md) exist and work.
// Run: node tests/sparkle_floaters_smoke.mjs
//   FLOATERS_JS=/path/to/copy.js points it at another copy of the effect file, SPARKLE_ROOT=/path at another copy of
//   the repo (gallery, guide), to prove a check can fail.
// Prints one "PASS  name" / "FAIL  name" line per assertion. Exit 0 = all pass, 1 = a FAIL, 2 = Playwright or Chrome missing.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('playwright is not installed (run: npm install --prefix tests)'); process.exit(2); }

const ROOT = process.env.SPARKLE_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'plugins/sparkle-that-page/skills/sparkle-that-page');
const FL = process.env.FLOATERS_JS || path.join(SKILL, 'examples/ambient_floaters.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sparkle-floaters-'));
const FAMILIES = ['sakura', 'leaves', 'snowflake', 'bubbles', 'dust', 'fairydust', 'fireflies', 'dandelion', 'lanterns', 'stars', 'clouds', 'hearts'];
const OLD_NAMES = ['sakura', 'leaves', 'snowflake', 'bubbles', 'dust', 'fairydust'];  // the six values 1.1 accepted
// how each family must move, measured over about a second with 40 items
const MOTION = { sakura: 'fall', leaves: 'fall', snowflake: 'fall', bubbles: 'rise', dust: 'rise', fairydust: 'rise', lanterns: 'rise', hearts: 'rise',
  clouds: 'drift', dandelion: 'drift', stars: 'stay', fireflies: 'wander' };

const page_ = (attrs, body, head = '', bodyAttr = ' style="margin:0"') => `<!doctype html><html${attrs}><head><meta charset="utf-8"><title>floaters</title>${head}</head><body${bodyAttr}>${body}</body></html>`;
const SCRIPT = '<script src="/__fl__.js"></script>';
const pages = {
  'plain.html': page_(' data-floaters="snowflake" data-floaters-count="40"', `<div style="height:200vh">page</div>${SCRIPT}`),   // no theme, no background: a white page
  'white.html': page_(' data-theme="light" data-floaters="snowflake" data-floaters-count="40"', `<div style="height:200vh">page</div>${SCRIPT}`),
  'owned.html': page_(' data-theme="ocean"', SCRIPT),
  'scheme.html': page_(' style="color-scheme: light dark"', SCRIPT),
  'darkbody.html': page_('', SCRIPT, '<style>body{background:#100a22}</style>'),
  'darkhtml.html': page_('', SCRIPT, '<style>html{background:#100a22}</style>'),
  'toggle.html': page_(' data-floaters="sakura" data-floaters-count="40"', SCRIPT, '<style>html.night body{background:#111}</style>'),
  'head.html': page_('', '<p>page</p>', SCRIPT),
  'head-destroy.html': page_('', '<p>page</p>', `${SCRIPT}<script>SparkleThatPage.ambientFloaters.destroy()</script>`),
  'tokens.html': page_(' data-floaters="dust" data-floaters-count="40" data-theme="light"', SCRIPT, '<style>:root{--stp-c1:#00ff00;--stp-c2:#00ff00;--stp-c3:#00ff00;--stp-c4:#00ff00;--stp-c5:#00ff00;--stp-c6:#00ff00}</style>'),
  // cute_chrome.css-style tokens that are all pale yellow: on a white page dust must still show
  'yellow.html': page_(' data-floaters="dust" data-floaters-count="40" data-theme="light"', SCRIPT, '<style>:root{--stp-c1:#fde047;--stp-c2:#fde047;--stp-c3:#fde047;--stp-c4:#fde047;--stp-c5:#fde047;--stp-c6:#fde047}</style>'),
  'clouds.html': page_(' data-theme="light" data-floaters="clouds" data-floaters-count="40"', SCRIPT),
  // a strict Content-Security-Policy: blocks injected <style> elements and inline style="" markup (this page has none); the CSSOM is still allowed
  'csp.html': page_(' data-floaters="lanterns"', `<p>text</p>${SCRIPT}`, `<meta http-equiv="Content-Security-Policy" content="style-src 'self'">`, ''),
  'blank.html': page_(' data-theme="light"', '<p>text</p>'),
};
for (const f of FAMILIES) pages[`f-${f}.html`] = page_(` data-theme="light" data-floaters="${f}" data-floaters-count="40"`, `<div style="height:200vh">page</div>${SCRIPT}`);
for (const [n, h] of Object.entries(pages)) fs.writeFileSync(path.join(TMP, n), h);
// the gallery copied WITHOUT its effect file, to see the message
fs.mkdirSync(path.join(TMP, 'nojs'));
try { fs.copyFileSync(path.join(SKILL, 'examples/floaters.html'), path.join(TMP, 'nojs/floaters.html')); } catch {}

// counts frame requests and the effect's observer / listeners, so destroy() can be checked
const SPY = `(() => { const s = window.__spy = { raf: 0, cancel: 0, observe: 0, disconnect: 0, add: 0, remove: 0 };
  const raf = window.requestAnimationFrame; window.requestAnimationFrame = function (f) { s.raf++; return raf.call(window, f); };
  const MO = window.MutationObserver; window.MutationObserver = class extends MO {
    observe(t, o) { if (o && o.attributeFilter && o.attributeFilter.some(a => /^data-floaters/.test(a))) { this.__w = 1; s.observe++; } return super.observe(t, o); }
    disconnect() { if (this.__w) s.disconnect++; return super.disconnect(); } };
  const ae = window.addEventListener, re = window.removeEventListener;
  window.addEventListener = function (t, f, o) { if (t === 'resize' || t === 'load') s.add++; return ae.call(this, t, f, o); };
  window.removeEventListener = function (t, f, o) { if (t === 'resize' || t === 'load') s.remove++; return re.call(this, t, f, o); };
  const P = MediaQueryList.prototype, add = P.addEventListener, rem = P.removeEventListener;
  P.addEventListener = function (t, f, o) { if (t === 'change') s.add++; return add.call(this, t, f, o); };
  P.removeEventListener = function (t, f, o) { if (t === 'change') s.remove++; return rem.call(this, t, f, o); }; })();`;

const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.md': 'text/markdown' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file;
  if (url === '/__fl__.js' || (/^\/plugins\//.test(url) && url.endsWith('/ambient_floaters.js'))) file = FL;
  else if (/^\/plugins\//.test(url)) file = path.join(ROOT, path.normalize(url.slice(1)));
  else file = path.join(TMP, path.normalize(url.slice(1)));
  if (!(file === FL || file.startsWith(TMP) || file.startsWith(ROOT)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
const GALLERY = `${ORIGIN}/plugins/sparkle-that-page/skills/sparkle-that-page/examples/floaters.html`;

let failed = 0, browser;
const report = (ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? '  (' + detail + ')' : ''}`); };
const check = async (name, fn) => { try { const [ok, detail] = await fn(); report(ok, name, detail); } catch (e) { report(false, name, 'threw: ' + String(e.message || e).slice(0, 160)); } };
try { browser = await chromium.launch({ channel: 'chrome' }); }
catch { try { browser = await chromium.launch(); } catch { console.log('no Chrome / Chromium for Playwright'); server.close(); process.exit(2); } }

// pixel statistics of the live canvas (or the canvas with the given selector), run inside the page
const PX = `(sel) => { const c = document.querySelector(sel || 'canvas.stp-floaters'); if (!c) return null;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  let n = 0, r = 0, g = 0, b = 0, alpha = 0, best = 0, maxY = 0;
  for (let i = 0; i < d.length; i += 4) { const a = d[i + 3]; if (!a) continue; alpha += a;
    if (a >= 120) { n++; r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    if (a >= 200) { const Y = 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]); best = Math.max(best, 1.05 / (Y + 0.05)); maxY = Math.max(maxY, Y); } }
  return { n, mean: n ? [r / n, g / n, b / n] : [0, 0, 0], alpha, contrastOnWhite: best, maxY, w: c.width, h: c.height }; }`;
const px = (page, sel) => page.evaluate(`(${PX})(${JSON.stringify(sel || null)})`);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const sleep = ms => new Promise(r => setTimeout(r, ms));

try {
  const open = async (file, opts = {}, wait = true) => {
    const ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, ...opts });
    await ctx.addInitScript(SPY);
    const page = await ctx.newPage();
    page.__errors = []; page.__console = [];
    page.on('pageerror', e => page.__errors.push(e.message));
    page.on('console', m => page.__console.push(m.text()));
    await page.goto(file.startsWith('http') ? file : `${ORIGIN}/${file}`);
    if (wait) await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.ambientFloaters);
    page.__ctx = ctx;
    return page;
  };
  const state = page => page.evaluate(() => SparkleThatPage.ambientFloaters.state());
  const frames = async (page, n = 3) => { await page.evaluate(n => new Promise(r => { let i = 0; const f = () => ++i >= n ? r() : requestAnimationFrame(f); requestAnimationFrame(f); }), n); };

  // ---- 0. static facts about the file ----
  const src = fs.readFileSync(FL, 'utf8');
  report(!/[^\x00-\x7f]/.test(src) && !/fillText|strokeText|\.font\b|textContent|innerText/.test(src), 'floaters: no font characters, no emoji, no text drawing anywhere in the file (plain ASCII, no fillText / strokeText / font)');
  report(!/<style|style=|innerHTML|insertAdjacentHTML|createElement\(["']style/.test(src), 'floaters: no <style> element and no inline style markup in the file (the canvas is styled through the CSSOM)');
  report(Buffer.byteLength(src) <= 27648, `floaters: the file stays within its budget of about 27 KB (at most 27,648 bytes; now ${Buffer.byteLength(src)} bytes)`);
  report(/function isDark\(\)/.test(src) && /pageIsDark\(\) in sparkle_trail\.js/.test(src) && /copied from fairy_cursor\.js/.test(src), 'floaters: the isDark() rule is the copied one and the header says where it came from');

  // ---- 1. API and the one canvas ----
  let page = await open('f-sakura.html');
  await frames(page, 4);
  await check('floaters: API exposes the 12 families, a palettes list, start / destroy / active / preview', () => page.evaluate((F) => {
    const A = SparkleThatPage.ambientFloaters;
    const ok = JSON.stringify([...A.families].sort()) === JSON.stringify([...F].sort()) && ['start', 'destroy', 'active', 'preview', 'state'].every(k => typeof A[k] === 'function') && A.palettes.join() === 'candy,neon,meadow';
    return [ok, A.families.join()];
  }, FAMILIES));
  await check('floaters: ONE canvas.stp-floaters — fixed, z-index 0, pointer-events none, aria-hidden, covering the window; the old test counts it as one layer', () => page.evaluate(() => {
    const l = document.querySelectorAll('.stp-floaters'), c = l[0], s = getComputedStyle(c), r = c.getBoundingClientRect();
    const top = document.elementFromPoint(400, 300);
    return [l.length === 1 && c.tagName === 'CANVAS' && s.position === 'fixed' && s.zIndex === '0' && s.pointerEvents === 'none' && c.getAttribute('aria-hidden') === 'true'
      && r.width === innerWidth && r.height === innerHeight && top !== c, `${l.length} ${c.tagName} ${s.position} z${s.zIndex} pe:${s.pointerEvents} ${r.width}x${r.height}`];
  }));
  await check('floaters: start() again adds no second canvas', async () => { await page.evaluate(() => SparkleThatPage.ambientFloaters.start()); const n = await page.evaluate(() => document.querySelectorAll('.stp-floaters').length); return [n === 1, 'canvases ' + n]; });
  report(page.__errors.length === 0, 'floaters: no page errors on load', page.__errors.join('; '));
  await page.__ctx.close();

  // ---- 2. every family: draws, and moves the way it says ----
  for (const f of FAMILIES) {
    page = await open(`f-${f}.html`);
    await check(`floaters: ${f} draws on the canvas (pixels appear), count is 40, no page errors`, async () => {
      await frames(page, 5);
      const p = await px(page), s = await state(page);
      return [p && p.n > 150 && s.count === 40 && s.family === f && page.__errors.length === 0, `pixels ${p && p.n}, count ${s.count}, family ${s.family}, errors ${page.__errors[0] || 'none'}`];
    });
    await check(`floaters: ${f} moves as ${MOTION[f]}`, async () => {
      const a = await state(page), pa = await px(page); await sleep(1100); const b = await state(page);
      const dx = [], dy = [];
      a.items.forEach((it, i) => { const ddx = b.items[i].x - it.x, ddy = b.items[i].y - it.y; if (Math.abs(ddx) < 250 && Math.abs(ddy) < 250) { dx.push(ddx); dy.push(ddy); } });
      const med = v => { const s = [...v].sort((x, y) => x - y); return s[s.length >> 1] || 0; }, mean = v => v.reduce((x, y) => x + y, 0) / (v.length || 1);
      const maxMove = Math.max(...dx.map((x, i) => Math.hypot(x, dy[i])));
      let ok, detail = `median dx ${med(dx).toFixed(1)}, median dy ${med(dy).toFixed(1)}, mean dy ${mean(dy).toFixed(1)}, biggest move ${maxMove.toFixed(1)}`;
      if (MOTION[f] === 'fall') ok = med(dy) > 3;
      else if (MOTION[f] === 'rise') ok = mean(dy) < -1;
      else if (MOTION[f] === 'drift') ok = med(dx) > 0.5 && Math.abs(med(dy)) < 3 + (f === 'dandelion' ? 5 : 0);
      else if (MOTION[f] === 'stay') {  // twinkle in place: nobody leaves its spot, but the picture changes over time
        const alphas = []; for (let i = 0; i < 8; i++) { alphas.push((await px(page)).alpha); await sleep(250); }
        const lo = Math.min(...alphas), hi = Math.max(...alphas); ok = maxMove < 9 && (hi - lo) / hi > 0.03; detail += `, brightness range ${(100 * (hi - lo) / hi).toFixed(1)}%`;
      } else {  // wander: moves in every direction, and blinks
        const alphas = []; for (let i = 0; i < 12; i++) { alphas.push((await px(page)).alpha); await sleep(260); }
        const lo = Math.min(...alphas), hi = Math.max(...alphas);
        ok = mean(dx.map(Math.abs)) > 1.5 && Math.abs(med(dx)) < 6 && (hi - lo) / hi > 0.05; detail += `, blink range ${(100 * (hi - lo) / hi).toFixed(1)}%`;
      }
      return [ok, detail];
    });
    await page.__ctx.close();
  }

  // ---- 3. old names, aliases, odd names ----
  for (const n of [...OLD_NAMES, 'snow', 'nonsense', 'constructor', '__proto__', 'toString']) {
    page = await open('blank.html', {}, false);
    await page.evaluate(n => document.documentElement.setAttribute('data-floaters', n), n);
    await page.addScriptTag({ url: '/__fl__.js' });
    await check(`floaters: data-floaters="${n}" ${OLD_NAMES.includes(n) ? '(an old name) ' : ''}starts one canvas that draws${OLD_NAMES.includes(n) || n === 'snow' ? '' : ' (falls back to sakura)'}, no errors`, async () => {
      await frames(page, 5); const p = await px(page), s = await state(page), want = n === 'snow' ? 'snowflake' : OLD_NAMES.includes(n) ? n : 'sakura';
      return [p && p.n > 20 && s.family === want && page.__errors.length === 0, `family ${s.family} wanted ${want}, pixels ${p && p.n}, errors ${page.__errors[0] || 'none'}`];
    });
    await page.__ctx.close();
  }

  // ---- 4. count, cap and the three depth layers ----
  page = await open('blank.html', {}, false);
  await page.addScriptTag({ url: '/__fl__.js' });
  const counts = {};
  for (const [label, v] of [['default', null], ['500', '500'], ['5', '5'], ['abc', 'abc'], ['0', '0'], ['-3', '-3'], ['60', '60']]) {
    await page.evaluate(v => { const r = document.documentElement; if (v === null) r.removeAttribute('data-floaters-count'); else r.setAttribute('data-floaters-count', v); }, v);
    await frames(page, 3); counts[label] = (await state(page)).count;
  }
  report(counts.default === 18 && counts['500'] === 60 && counts['60'] === 60 && counts['5'] === 5 && counts.abc === 18 && counts['0'] === 18 && counts['-3'] === 1, 'floaters: data-floaters-count — default 18, capped at 60, 5 gives 5, junk gives 18, negative gives 1 (changing it live rebuilds the layer)', JSON.stringify(counts));
  await check('floaters: three depth layers — small, faint and slow at the back, bigger, clearer and faster in front; every layer has items', async () => {
    await page.evaluate(() => document.documentElement.setAttribute('data-floaters-count', '30')); await frames(page, 3);
    const L = (await state(page)).layers;
    const ok = L.length === 3 && L.every(l => l.n > 0) && L[0].size < L[1].size && L[1].size < L[2].size && L[0].alpha < L[1].alpha && L[1].alpha < L[2].alpha && L[0].speed < L[1].speed && L[1].speed < L[2].speed && L[0].n + L[1].n + L[2].n === 30;
    return [ok, JSON.stringify(L)];
  });
  await page.__ctx.close();

  // ---- 5. the canvas tracks the window and the screen density ----
  page = await open('f-sakura.html', { deviceScaleFactor: 2 });
  await frames(page, 3);
  await check('floaters: canvas is sharp on a 2x screen (backing store = window x 2) and follows a window resize', async () => {
    const a = await px(page); await page.setViewportSize({ width: 500, height: 400 }); await frames(page, 3); const b = await px(page); const s = await state(page);
    const inside = s.items.every(i => i.x >= -80 && i.x <= 580 && i.y >= -80 && i.y <= 480);
    return [a.w === 1600 && a.h === 1200 && b.w === 1000 && b.h === 800 && inside, `before ${a.w}x${a.h}, after ${b.w}x${b.h}, items inside ${inside}`];
  });
  await page.__ctx.close();
  page = await open('clouds.html');
  await check('floaters: clouds follow a window resize too (a shorter window brings every cloud into its upper 60 %)', async () => {
    await frames(page, 3); const a = Math.max(...(await state(page)).items.map(i => i.y));
    await page.setViewportSize({ width: 800, height: 300 }); await frames(page, 3); const b = Math.max(...(await state(page)).items.map(i => i.y));
    return [a > 200 && b <= 300 * 0.6 + 4, `lowest cloud before ${a.toFixed(0)} of 600, after ${b.toFixed(0)} of 300`];
  });
  await page.__ctx.close();

  // ---- 6. snow is visible on a white page and the colours follow the page ----
  page = await open('white.html');
  await check('floaters: snowflake on a white page is visible — drawn pixels reach contrast 2.2 or more against white', async () => { await frames(page, 6); const p = await px(page); return [p.contrastOnWhite >= 2.2, 'best contrast ' + p.contrastOnWhite.toFixed(2)]; });
  const lightSnow = await px(page);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await check('floaters: flipping data-theme to dark while running repaints the snow in pale colours (no reload), and back again', async () => {
    await frames(page, 4); const d = await px(page), s = await state(page);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await frames(page, 4); const l2 = await px(page), s2 = await state(page);
    return [s.dark === true && s2.dark === false && d.maxY > 0.8 && lightSnow.maxY < 0.6 && l2.maxY < 0.6 && dist(d.mean, lightSnow.mean) > 40, `dark flag ${s.dark}/${s2.dark}, brightest ${lightSnow.maxY.toFixed(2)} -> ${d.maxY.toFixed(2)} -> ${l2.maxY.toFixed(2)}`];
  });
  await page.__ctx.close();

  page = await open('plain.html');
  await check('floaters: snowflake on a plain page with no data-theme (white by default) still has contrast 2.2 or more', async () => { await frames(page, 6); const p = await px(page), s = await state(page); return [!s.dark && p.contrastOnWhite >= 2.2, `dark ${s.dark}, contrast ${p.contrastOnWhite.toFixed(2)}`]; });
  await page.__ctx.close();

  // ---- 7. light / dark follows the page, by the copied rule ----
  const darkOf = async (file, opts, before) => { const p = await open(file, opts); if (before) await before(p); await frames(p, 3); const s = await state(p); await p.__ctx.close(); return s.dark; };
  report(await darkOf('plain.html') === false && await darkOf('owned.html') === false, 'floaters: a page with no theme, and a data-theme the page owns ("ocean"), count as light when the background is white');
  report(await darkOf('darkbody.html') === true && await darkOf('darkhtml.html') === true, 'floaters: a dark <body> background, or a dark <html> with a transparent body, means a dark page');
  report(await darkOf('scheme.html', { colorScheme: 'dark' }) === true && await darkOf('scheme.html', { colorScheme: 'light' }) === false && await darkOf('plain.html', { colorScheme: 'dark' }) === false,
    'floaters: the system scheme counts only when the page allows dark (color-scheme: light dark): a dark system on a light-only page stays light');
  page = await open('toggle.html');
  await check('floaters: a class on <html> that darkens the body repaints live (dark flag and drawn colours), and back', async () => {
    await frames(page, 4); const a = await px(page), sa = await state(page);
    await page.evaluate(() => document.documentElement.classList.add('night')); await frames(page, 4); const b = await px(page), sb = await state(page);
    await page.evaluate(() => document.documentElement.classList.remove('night')); await frames(page, 4); const sc = await state(page);
    return [!sa.dark && sb.dark && !sc.dark && dist(a.mean, b.mean) > 20, `dark ${sa.dark}/${sb.dark}/${sc.dark}, colour change ${dist(a.mean, b.mean).toFixed(0)}`];
  });
  await check('floaters: a class on <body> and a style on <html> repaint too', async () => {
    await page.evaluate(() => { document.documentElement.style.background = '#111'; }); await frames(page, 4); const a = (await state(page)).dark;
    await page.evaluate(() => { document.documentElement.style.background = ''; }); await frames(page, 4); const b = (await state(page)).dark;
    await page.evaluate(() => { document.body.style.background = '#111'; }); await frames(page, 4); const c = (await state(page)).dark;
    return [a === true && b === false && c === true, `${a} ${b} ${c}`];
  });
  await page.__ctx.close();
  page = await open('scheme.html', { colorScheme: 'light' });
  await check('floaters: the system scheme changing while running repaints (page allows dark)', async () => {
    await frames(page, 3); const a = (await state(page)).dark; await page.emulateMedia({ colorScheme: 'dark' }); await frames(page, 4); const b = (await state(page)).dark;
    await page.emulateMedia({ colorScheme: 'light' }); await frames(page, 4); const c = (await state(page)).dark; return [a === false && b === true && c === false, `${a} ${b} ${c}`];
  });
  await page.__ctx.close();

  // ---- 8. changing the attributes while it runs, palettes and tokens ----
  page = await open('f-sakura.html');
  await check('floaters: changing data-floaters live switches the family at once, still one canvas', async () => {
    await frames(page, 3); await page.evaluate(() => document.documentElement.setAttribute('data-floaters', 'hearts')); await frames(page, 4);
    const s = await state(page), n = await page.evaluate(() => document.querySelectorAll('.stp-floaters').length); return [s.family === 'hearts' && n === 1 && s.count === 40, `${s.family} ${n} canvases`];
  });
  await page.__ctx.close();
  page = await open('f-dust.html');
  await check('floaters: dust and data-palette — candy, neon and meadow draw different colours (live switch)', async () => {
    const means = {};
    for (const p of ['candy', 'neon', 'meadow']) { await page.evaluate(p => document.documentElement.setAttribute('data-palette', p), p); await frames(page, 4); means[p] = (await px(page)).mean; }
    return [dist(means.candy, means.neon) > 12 && dist(means.neon, means.meadow) > 12 && dist(means.candy, means.meadow) > 8, JSON.stringify(means)];
  });
  await page.__ctx.close();
  page = await open('tokens.html');
  await check('floaters: dust takes the page\'s --stp-c1..6 tokens first (all green here, so the drawn pixels are green)', async () => { await frames(page, 5); const p = await px(page); return [p.n > 20 && p.mean[1] - p.mean[0] > 80 && p.mean[1] - p.mean[2] > 80, 'mean ' + p.mean.map(Math.round)]; });
  await page.__ctx.close();
  page = await open('yellow.html');
  await check('floaters: pale page tokens (all #fde047) are darkened on a white page, so dust still reaches contrast 2.2 against white', async () => { await frames(page, 5); const p = await px(page); return [p.n > 20 && p.contrastOnWhite >= 2.2, 'best contrast ' + p.contrastOnWhite.toFixed(2)]; });
  await page.__ctx.close();

  // ---- 9. reduced motion ----
  page = await open('f-sakura.html', { reducedMotion: 'reduce' });
  await check('floaters: reduced motion — no canvas on load, start() does nothing, and no frame is ever requested', async () => {
    await page.evaluate(() => SparkleThatPage.ambientFloaters.start()); await sleep(300);
    const r = await page.evaluate(() => [document.querySelectorAll('.stp-floaters').length, window.__spy.raf, SparkleThatPage.ambientFloaters.active()]); return [r[0] === 0 && r[1] === 0 && r[2] === false, JSON.stringify(r)];
  });
  await check('floaters: reduced motion — preview() still draws a still picture (the gallery works)', () => page.evaluate(() => { const c = document.createElement('canvas'); c.width = 200; c.height = 120; SparkleThatPage.ambientFloaters.preview(c, 'hearts', { dark: false }); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 100) n++; return [n > 300, 'pixels ' + n]; }));
  await page.__ctx.close();

  // ---- 10. destroy(), start() again, <head> ----
  page = await open('f-leaves.html');
  await check('floaters: destroy() removes the canvas and stops every frame request (none in the next 400 ms)', async () => {
    await frames(page, 3); await page.evaluate(() => SparkleThatPage.ambientFloaters.destroy()); await sleep(60);
    const before = await page.evaluate(() => window.__spy.raf); await sleep(400); const after = await page.evaluate(() => window.__spy.raf);
    const r = await page.evaluate(() => [document.querySelectorAll('.stp-floaters').length, SparkleThatPage.ambientFloaters.active()]);
    return [r[0] === 0 && r[1] === false && before === after, `canvases ${r[0]}, frames after destroy ${after - before}`];
  });
  await check('floaters: destroy() lets go of the observer and the resize / load / colour-scheme listeners it added', () => page.evaluate(() => { const s = window.__spy; return [s.observe >= 1 && s.disconnect === s.observe && s.remove >= 3 && s.remove >= s.add - 1, JSON.stringify(s)]; }));
  await check('floaters: start() after destroy() re-reads the attributes (new family, new count) and draws', async () => {
    await page.evaluate(() => { const r = document.documentElement; r.setAttribute('data-floaters', 'stars'); r.setAttribute('data-floaters-count', '7'); SparkleThatPage.ambientFloaters.start(); });
    await frames(page, 4); const s = await state(page), p = await px(page); return [s.family === 'stars' && s.count === 7 && p.n > 50, `${s.family} ${s.count} ${p.n}`];
  });
  await check('floaters: a second destroy() and a destroy() before any start() are harmless', () => page.evaluate(() => { const A = SparkleThatPage.ambientFloaters; A.destroy(); A.destroy(); return [!A.active(), '']; }));
  await page.__ctx.close();
  page = await open('head.html');
  await check('floaters: script in <head> — waits for the body, then one canvas, no errors', async () => { await frames(page, 3); const n = await page.evaluate(() => document.querySelectorAll('canvas.stp-floaters').length); return [n === 1 && page.__errors.length === 0, `canvases ${n}, errors ${page.__errors[0] || 'none'}`]; });
  await page.__ctx.close();
  page = await open('head-destroy.html');
  await check('floaters: script in <head> — destroy() before the body exists cancels the pending start', async () => { await sleep(150); const n = await page.evaluate(() => [document.querySelectorAll('canvas.stp-floaters').length, SparkleThatPage.ambientFloaters.active()]); return [n[0] === 0 && n[1] === false, JSON.stringify(n)]; });
  await page.__ctx.close();

  // ---- 11. strict CSP ----
  page = await open('csp.html');
  await check('floaters: a page with Content-Security-Policy style-src \'self\' still shows the floaters and logs no policy violation', async () => {
    await frames(page, 6); const p = await px(page), bad = page.__console.filter(t => /Content Security Policy|Refused to apply/i.test(t));
    return [p.n > 100 && bad.length === 0 && page.__errors.length === 0, `pixels ${p.n}, violations ${bad.length} ${bad[0] || ''}`];
  });
  await page.__ctx.close();

  // ---- 12. preview(): a still picture for galleries ----
  page = await open('blank.html', {}, false); await page.addScriptTag({ url: '/__fl__.js' });
  const pv = await page.evaluate((F) => {
    const A = SparkleThatPage.ambientFloaters, out = {}, grab = (f, o) => { const c = document.createElement('canvas'); c.width = 200; c.height = 120; A.preview(c, f, o); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0, r = 0, g = 0, b = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 120) { n++; r += d[i]; g += d[i + 1]; b += d[i + 2]; } return { n, mean: [r / (n || 1), g / (n || 1), b / (n || 1)], url: c.toDataURL(), w: c.width }; };
    for (const f of F) { try { out[f] = { l: grab(f, { dark: false }), d: grab(f, { dark: true }) }; } catch (e) { out[f] = { err: e.message }; } }
    const t = fn => { try { return fn(); } catch (e) { return false; } };
    out.__unknown = t(() => grab('nope', {}).url === grab('sakura', {}).url); out.__proto = t(() => grab('constructor', {}).url === grab('sakura', {}).url);
    out.__pal = t(() => [grab('dust', { palette: 'candy' }).url, grab('dust', { palette: 'neon' }).url, grab('dust', { palette: 'meadow' }).url]) || [];
    out.__again = t(() => grab('stars', {}).url === grab('stars', {}).url);
    return out;
  }, FAMILIES);
  for (const f of FAMILIES) report(pv[f] && !pv[f].err && pv[f].l.n > 100 && pv[f].d.n > 100 && dist(pv[f].l.mean, pv[f].d.mean) > 15, `floaters: preview("${f}") draws a picture on a light page and on a dark page, and the colours differ`, JSON.stringify(pv[f] && (pv[f].err || [pv[f].l.n, pv[f].d.n, dist(pv[f].l.mean, pv[f].d.mean)])));
  report(pv.__unknown && pv.__proto && pv.__again && new Set(pv.__pal).size === 3, 'floaters: preview() of an unknown name or "constructor" is sakura, the same call gives the same picture, and the three dust palettes differ');
  await check('floaters: preview() does not disturb a live layer (dark flag, family and colours stay the live ones)', async () => {
    await page.evaluate(() => { document.documentElement.setAttribute('data-floaters', 'snowflake'); SparkleThatPage.ambientFloaters.start(); });
    await frames(page, 4); const a = await px(page);
    await page.evaluate(() => { const c = document.createElement('canvas'); SparkleThatPage.ambientFloaters.preview(c, 'hearts', { dark: true }); }); await frames(page, 4);
    const s = await state(page), b = await px(page); return [s.family === 'snowflake' && !s.dark && b.maxY < 0.6 && b.contrastOnWhite >= 2.2, `${s.family} dark ${s.dark} contrast ${b.contrastOnWhite.toFixed(2)}`];
  });
  await page.__ctx.close();
  page = await open('blank.html', { deviceScaleFactor: 2 }, false); await page.addScriptTag({ url: '/__fl__.js' });
  await check('floaters: preview() on a canvas sizes its backing store for a 2x screen', () => page.evaluate(() => { const c = document.createElement('canvas'); c.setAttribute('width', '200'); c.setAttribute('height', '120'); SparkleThatPage.ambientFloaters.preview(c, 'stars', {}); return [c.width === 400 && c.height === 240, c.width + 'x' + c.height]; }));
  await page.__ctx.close();

  // ---- 12b. every family is visible on a white page and on #111 ----
  // preview() at real size (scale 1, 1x screen), drawn over the page colour by the browser, so the numbers are the same
  // on every run. best = the highest contrast of any seen pixel against the page; share = of the solid pixels
  // (alpha 128 or more), how many reach 1.5:1 against the page (an outline or a body you can see, not one bright dot).
  page = await open('blank.html', {}, false); await page.addScriptTag({ url: '/__fl__.js' });
  const vis = await page.evaluate(() => { const A = SparkleThatPage.ambientFloaters, out = {};
    const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }, L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    for (const f of A.families) for (const [pg, bg, dark] of [['white', '#ffffff', false], ['#111', '#111111', true]]) {
      const c = document.createElement('canvas'); c.width = 320; c.height = 160; A.preview(c, f, { dark, scale: 1 });
      const o = document.createElement('canvas'); o.width = 320; o.height = 160; const x = o.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 320, 160); x.drawImage(c, 0, 0);
      const raw = c.getContext('2d').getImageData(0, 0, 320, 160).data, seen = x.getImageData(0, 0, 320, 160).data, Lb = dark ? L(17, 17, 17) : 1;
      let best = 0, solid = 0, s15 = 0, s3 = 0;
      for (let i = 0; i < raw.length; i += 4) { const k = cr(L(seen[i], seen[i + 1], seen[i + 2]), Lb); if (k > best) best = k;
        if (raw[i + 3] >= 128) { solid++; if (k >= 1.5) s15++; if (k >= 3) s3++; } }
      out[f + ' ' + pg] = { best, solid, share: s15 / (solid || 1), share3: s3 / (solid || 1) };
    }
    return out; });
  for (const f of FAMILIES) for (const pg of ['white', '#111']) {
    const v = vis[f + ' ' + pg], floor = pg === 'white' ? 2.2 : 3, sf = f === 'clouds' && pg === 'white' ? 0.1 : 0.4;  // a white cloud on white is carried by its edge alone
    report(v && v.solid > 40 && v.best >= floor && v.share >= sf, `floaters: ${f} is visible on ${pg === 'white' ? 'a white page' : 'a #111 page'} — best contrast ${floor} or more, and at least ${sf * 100} % of its solid pixels reach 1.5:1`,
      v ? `best ${v.best.toFixed(2)}, share ${v.share.toFixed(2)}, solid ${v.solid}` : 'missing');
  }
  { const v = vis['fireflies #111']; report(v && v.share3 >= 0.7, 'floaters: fireflies on #111 show a body, not only a glow — at least 70 % of the solid pixels reach 3:1 against the page', v ? 'share at 3:1 ' + v.share3.toFixed(2) : 'missing'); }
  await check('floaters: clouds on #111 are moonlit, not grey storm clouds — the dimmest tenth of their drawn pixels still reaches 5:1 against the page (back layer included)', () => page.evaluate(() => {
    const A = SparkleThatPage.ambientFloaters, lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }, L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const c = document.createElement('canvas'); c.width = 320; c.height = 160; A.preview(c, 'clouds', { dark: true, scale: 1 });
    const o = document.createElement('canvas'); o.width = 320; o.height = 160; const x = o.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, 320, 160); x.drawImage(c, 0, 0);
    const raw = c.getContext('2d').getImageData(0, 0, 320, 160).data, seen = x.getImageData(0, 0, 320, 160).data, k = [], Lb = L(17, 17, 17);
    for (let i = 0; i < raw.length; i += 4) if (raw[i + 3] >= 40) k.push((L(seen[i], seen[i + 1], seen[i + 2]) + 0.05) / (Lb + 0.05));
    k.sort((a, b) => a - b); const p10 = k[Math.floor(k.length * 0.1)] || 0; return [k.length > 1000 && p10 >= 5, `dimmest tenth ${p10.toFixed(2)}:1, pixels ${k.length}`]; }));
  await check('floaters: dust under data-palette="neon" glows (a faint stacked-circle halo round each sparkle, as in 1.x); candy does not', () => page.evaluate(() => {
    const A = SparkleThatPage.ambientFloaters, faint = pal => { const c = document.createElement('canvas'); c.width = 320; c.height = 160; A.preview(c, 'dust', { dark: true, palette: pal, scale: 1 }); const d = c.getContext('2d').getImageData(0, 0, 320, 160).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0 && d[i] < 90) n++; return n; };
    const n = faint('neon'), cd = faint('candy'); return [n > 300 && n > cd * 3, `faint halo pixels: neon ${n}, candy ${cd}`]; }));
  await page.__ctx.close();

  // ---- 13. the guide ----
  let md = ''; try { md = fs.readFileSync(path.join(SKILL, 'references/floaters.md'), 'utf8'); } catch {}
  report(md.length > 2000 && FAMILIES.every(f => new RegExp('`' + f + '`').test(md)), 'floaters guide: references/floaters.md exists and names all 12 families', `${md.length} bytes`);
  const rows = md.split('\n').filter(l => /^\|\s*\[/.test(l) && /https?:\/\//.test(l));
  report(rows.length >= 5 && rows.every(r => /checked 2026-11-11|not checked/i.test(r)), 'floaters guide: every source row says "checked 2026-11-11" or "not checked"', `${rows.length} rows, ${rows.filter(r => !/checked 2026-11-11|not checked/i.test(r)).length} without`);
  report(/## The quality bar/.test(md) && /## Anatomy/.test(md) && /## Adding a family/.test(md) && /## Where to look/.test(md) && /franchise/i.test(md), 'floaters guide: has the quality bar, anatomy, adding a family, where to look and the no-franchise rule');

  // ---- 14. the gallery ----
  page = await open(GALLERY);
  await check('floaters gallery: one card per family (12), each with a light and a dark picture that really has drawn pixels', async () => {
    await page.waitForSelector('.card');
    const r = await page.evaluate(() => [...document.querySelectorAll('.card')].map(c => ({ f: c.dataset.family, px: [...c.querySelectorAll('canvas')].map(cv => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 100) n++; return n; }) })));
    return [r.length === 12 && r.every(c => c.px.length === 2 && c.px.every(n => n > 250)) && page.__errors.length === 0, r.map(c => c.f + ':' + c.px).join(' ') + ' errors ' + page.__errors.join(';')];
  });
  await check('floaters gallery: cards are not buttons that hold buttons — each card has one real <button> that chooses it (aria-pressed), and no role="button" anywhere', () => page.evaluate(() => {
    const cards = [...document.querySelectorAll('.card')], ok = cards.length === 12 && cards.every(c => !c.hasAttribute('role') && !c.hasAttribute('aria-pressed') && !c.hasAttribute('tabindex') && c.querySelector('button.pick[aria-pressed]'))
      && document.querySelectorAll('[role="button"]').length === 0;
    return [ok, `${cards.length} cards, role=button ${document.querySelectorAll('[role="button"]').length}, picks ${document.querySelectorAll('button.pick').length}`]; }));
  await check('floaters gallery: the card\'s button makes that family the page\'s live floaters, shows "Now floating: it", marks only that card', async () => {
    await page.click('[data-family="clouds"] button.pick'); await frames(page, 4);
    const r = await page.evaluate(() => ({ attr: document.documentElement.dataset.floaters, fam: SparkleThatPage.ambientFloaters.state().family, now: document.getElementById('now-name').textContent, on: [...document.querySelectorAll('.card.is-on')].map(c => c.dataset.family), pressed: [...document.querySelectorAll('button.pick[aria-pressed="true"]')].map(b => b.closest('.card').dataset.family), cv: document.querySelectorAll('.stp-floaters').length }));
    return [r.attr === 'clouds' && r.fam === 'clouds' && /clouds/.test(r.now) && r.on.join() === 'clouds' && r.pressed.join() === 'clouds' && r.cv === 1, JSON.stringify(r)];
  });
  await check('floaters gallery: the keyboard works too — Enter on a card\'s focused button picks it', async () => {
    await page.focus('[data-family="lanterns"] button.pick'); await page.keyboard.press('Enter'); await frames(page, 4);
    const f = await page.evaluate(() => SparkleThatPage.ambientFloaters.state().family); return [f === 'lanterns', f];
  });
  await check('floaters gallery: the page follows its own guide — main is position:relative with z-index 1, above the floaters canvas (z-index 0); the top bar stays sticky', () => page.evaluate(() => {
    const m = getComputedStyle(document.querySelector('main')), t = getComputedStyle(document.querySelector('.top'));
    return [m.position === 'relative' && m.zIndex === '1' && t.position === 'sticky' && +t.zIndex >= 1, `main ${m.position} z${m.zIndex}, bar ${t.position} z${t.zIndex}`]; }));
  await check('floaters gallery: the dust card\'s palette buttons change data-palette and the pictures', async () => {
    const before = await page.evaluate(() => document.querySelector('[data-family="dust"] canvas').toDataURL());
    await page.click('[data-family="dust"] .pal button:nth-child(2)'); await frames(page, 3);
    const r = await page.evaluate(() => ({ pal: document.documentElement.dataset.palette, fam: document.documentElement.dataset.floaters, url: document.querySelector('[data-family="dust"] canvas').toDataURL(), code: document.querySelector('[data-family="dust"] .attr code').textContent }));
    return [r.pal === 'neon' && r.fam === 'dust' && r.url !== before && /neon/.test(r.code), JSON.stringify({ pal: r.pal, fam: r.fam, code: r.code })];
  });
  await check('floaters gallery: the dark-page switch flips data-theme, remembers it under "stp:theme", and the live floaters repaint', async () => {
    await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'light'); }); await page.click('[data-family="snowflake"] button.pick'); await frames(page, 4);
    const a = await state(page); await page.click('#theme'); await frames(page, 4);
    const r = await page.evaluate(() => ({ th: document.documentElement.dataset.theme, ls: localStorage.getItem('stp:theme'), dark: SparkleThatPage.ambientFloaters.state().dark, pressed: document.getElementById('theme').getAttribute('aria-pressed') }));
    return [!a.dark && r.th === 'dark' && r.ls === 'dark' && r.dark === true && r.pressed === 'true', JSON.stringify(r)];
  });
  report(await page.evaluate(() => [...document.querySelectorAll('a')].some(a => /demo\.html$/.test(a.getAttribute('href'))) && [...document.querySelectorAll('a')].some(a => /references\/floaters\.md$/.test(a.getAttribute('href')))), 'floaters gallery: links to demo.html and to references/floaters.md');
  await page.__ctx.close();
  page = await open(`${ORIGIN}/nojs/floaters.html`, {}, false); await sleep(400);
  await check('floaters gallery: without ambient_floaters.js next to it, it says so instead of showing an empty page', async () => { const t = await page.evaluate(() => document.getElementById('out').textContent); return [/ambient_floaters\.js was not found/.test(t), t.slice(0, 80)]; });
  await page.__ctx.close();
  page = await open(GALLERY, { reducedMotion: 'reduce' });
  await check('floaters gallery: under reduced motion nothing floats, a note says so, and the pictures are still drawn', async () => {
    await page.waitForSelector('.card'); const r = await page.evaluate(() => ({ cv: document.querySelectorAll('.stp-floaters').length, hint: !document.getElementById('hint').hidden, n: (() => { const d = document.querySelector('[data-family="stars"] canvas').getContext('2d').getImageData(0, 0, 100, 100).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 100) k++; return k; })() }));
    return [r.cv === 0 && r.hint && r.n > 20, JSON.stringify(r)];
  });
  await page.__ctx.close();
} finally {
  await browser.close(); server.close();
  fs.rmSync(TMP, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
