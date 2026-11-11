// Headless-browser smoke test for the sparkle-that-page click confetti (click_confetti.js) and its gallery: every
// family x palette x light/dark draws as paths (never a font character), the four motions move pieces the way they
// say, burst() with options fires that family without touching the page's attributes, light/dark follows the PAGE and
// repaints pieces already in the air, reduced motion draws exactly one still shape that fades, the frame loop stops when
// the pieces are gone, a strict style-src 'self' page still works, and the old names / API keep working.
// Run: node tests/sparkle_confetti_smoke.mjs
//   CONFETTI_JS=/path/to/copy.js points it at another copy of the effect file, to prove a check can fail.
//   SPARKLE_ROOT=/path points it at another copy of the repo (gallery, guide).
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
const JS = process.env.CONFETTI_JS || path.join(SKILL, 'examples/click_confetti.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sparkle-confetti-'));
const pg = (attrs, body, head = '') => `<!doctype html><html${attrs}><head><meta charset="utf-8"><title>confetti</title>${head}</head><body style="margin:0;background:#fff">${body}</body></html>`;
const SCRIPT = '<script src="/__confetti__.js"></script>';
const pages = {
  'on.html': pg(' data-confetti-on="*"', `<div style="height:600px">x</div>${SCRIPT}`),
  'dark.html': pg(' data-confetti-on="*" data-theme="dark"', `<div style="height:600px">x</div>${SCRIPT}`, '<style>body{background:#17161c !important}</style>'),
  'night.html': pg(' data-confetti-on="*"', `<div style="height:600px">x</div>${SCRIPT}`, '<style>body{transition:none} html.night body{background:#111 !important}</style>'),
  'leaf.html': pg(' data-confetti-on="*" data-confetti="leaf" data-confetti-palette="autumn"', `<div style="height:600px">x</div>${SCRIPT}`),
  'neon.html': pg(' data-confetti-on="*" data-confetti="leaf" data-confetti-palette="autumn" data-palette="neon"', `<div style="height:600px">x</div>${SCRIPT}`),
  'rainpage.html': pg(' data-confetti-on="*" data-confetti-motion="rain"', `<div style="height:600px">x</div>${SCRIPT}`),
  'badmotion.html': pg(' data-confetti-on="*" data-confetti-motion="__proto__" data-confetti="constructor"', `<div style="height:600px">x</div>${SCRIPT}`),
  'csp.html': `<!doctype html><html data-confetti-on="*"><head><meta charset="utf-8"><title>csp</title><link rel="stylesheet" href="/csp.css"></head><body><button id="s" data-stamp="Done!">stamp</button>${SCRIPT}</body></html>`,
  'head.html': pg(' data-confetti-on="*"', '<p>page</p>', SCRIPT),
  'celebrate.html': pg('', `<button id="cel" data-celebrate style="margin:100px;padding:20px">c</button>${SCRIPT}`),
  'stamp.html': pg('', `<button id="s" data-stamp style="margin:200px 0 0 300px;padding:20px">stamp</button>${SCRIPT}`),
};
for (const [n, h] of Object.entries(pages)) fs.writeFileSync(path.join(TMP, n), h);
fs.writeFileSync(path.join(TMP, 'csp.css'), 'body{margin:0} #s{margin:200px 0 0 300px;padding:20px}');
// the gallery with its script removed, to see the "script not found" message
const GAL = path.join(SKILL, 'examples/confetti.html');
if (fs.existsSync(GAL)) fs.writeFileSync(path.join(TMP, 'gallery-nojs.html'), fs.readFileSync(GAL, 'utf8').replace('<script src="./click_confetti.js"></script>', ''));

// installed before any page script: counts requestAnimationFrame calls, font drawing calls, MutationObservers, CSP violations
const SPY = `(() => { const s = window.__spy = { raf: 0, text: 0, observe: 0, disconnect: 0, csp: 0 };
  const r = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = f => { s.raf++; return r(f); };
  const P = CanvasRenderingContext2D.prototype; for (const k of ['fillText', 'strokeText']) { const o = P[k]; P[k] = function (...a) { s.text++; return o.apply(this, a); }; }
  const MO = window.MutationObserver; window.MutationObserver = class extends MO {
    observe(t, o) { if (o && o.attributeFilter && o.attributeFilter.includes('data-theme')) { this.__w = 1; s.observe++; } return super.observe(t, o); }
    disconnect() { if (this.__w) s.disconnect++; return super.disconnect(); } };
  document.addEventListener('securitypolicyviolation', () => s.csp++); })();`;

const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.md': 'text/markdown' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file;
  if (url === '/__confetti__.js' || url.endsWith('/click_confetti.js')) file = JS;
  else if (/^\/(site|plugins)\//.test(url)) file = path.join(ROOT, path.normalize(url.slice(1)));
  else file = path.join(TMP, path.normalize(url.slice(1)));
  if (file !== JS && !file.startsWith(TMP) && !file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  const h = { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' };
  if (url === '/csp.html') h['content-security-policy'] = "default-src 'self'; style-src 'self'; script-src 'self'";
  res.writeHead(200, h);
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

let failed = 0, browser;
const report = (ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? '  (' + detail + ')' : ''}`); };
const check = async (name, fn) => { try { const [ok, detail] = await fn(); report(ok, name, detail); } catch (e) { report(false, name, 'threw: ' + String(e.message || e).slice(0, 160)); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
try { browser = await chromium.launch({ channel: 'chrome' }); }
catch { try { browser = await chromium.launch(); } catch { console.log('no Chrome / Chromium for Playwright'); server.close(); process.exit(2); } }

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
// reads the confetti canvas: pixel count, bounding box, alpha total, pixels below row cy, and per named colour group the
// count of solid (alpha >= 200) pixels within 8 of one of its colours; also the darkest / lightest solid pixel luminance
const GRAB = `(g => { const c = document.querySelector('canvas.stp-confetti'); if (!c) return null;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, w = c.width;
  const r = { n: 0, minx: 1e9, maxx: -1, miny: 1e9, maxy: -1, alpha: 0, below: 0, groups: {}, minL: 9, maxL: -1 };
  for (const k in g.groups) r.groups[k] = 0;
  const lum = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  for (let i = 0; i < d.length; i += 4) { const a = d[i + 3]; if (!a) continue; const x = (i >> 2) % w, y = ((i >> 2) / w) | 0;
    r.n++; r.alpha += a; if (x < r.minx) r.minx = x; if (x > r.maxx) r.maxx = x; if (y < r.miny) r.miny = y; if (y > r.maxy) r.maxy = y; if (g.cy != null && y > g.cy) r.below++;
    if (a >= 200) { const L = 0.2126 * lum(d[i]) + 0.7152 * lum(d[i + 1]) + 0.0722 * lum(d[i + 2]); if (L < r.minL) r.minL = L; if (L > r.maxL) r.maxL = L;
      for (const k in g.groups) if (g.groups[k].some(q => Math.abs(q[0] - d[i]) <= 8 && Math.abs(q[1] - d[i + 1]) <= 8 && Math.abs(q[2] - d[i + 2]) <= 8)) r.groups[k]++; } }
  return r; })`;
const grab = (page, o = {}) => page.evaluate(`${GRAB}(${JSON.stringify(o)})`);

try {
  const open = async (file, opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1, ...opts });
    await ctx.addInitScript(SPY);
    const page = await ctx.newPage();
    page.__errors = []; page.on('pageerror', e => page.__errors.push(e.message));
    await page.goto(`${ORIGIN}/${file}`);
    await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.clickConfetti);
    return { ctx, page };
  };
  const C = (page, fn, arg) => page.evaluate(`((a) => { const C = SparkleThatPage.clickConfetti; return (${fn.toString()})(C, a); })(${JSON.stringify(arg === undefined ? null : arg)})`);
  const colours = (page, f, n, dark) => C(page, (C, a) => C.colors(a[0], a[1], a[2]), [f, n, dark]);
  const fillsOf = (cols) => cols.map(hex);

  // 1. the catalogue
  let { ctx, page } = await open('on.html');
  const cat = await page.evaluate(() => {
    const C = SparkleThatPage.clickConfetti, bad = [], c = document.createElement('canvas'); c.width = c.height = 60;
    const g = c.getContext('2d', { willReadFrequently: true }); let n = 0;
    for (const f of C.families) for (const p of C.palettes[f]) for (const dark of [false, true]) for (let i = 0; i < 4; i++) {
      n++; g.clearRect(0, 0, 60, 60);
      try { C.draw(g, f, p, dark, 30, 30, 12, i); } catch (e) { bad.push(f + '/' + p + ': ' + e.message); continue; }
      const d = g.getImageData(0, 0, 60, 60).data; let k = 0; for (let j = 3; j < d.length; j += 4) if (d[j] > 40) k++;
      if (k < 12) bad.push(`${f}/${p}/${dark ? 'dark' : 'light'}/${i}: ${k} px`);
    }
    const few = C.families.filter(f => !(C.palettes[f] && C.palettes[f].length >= 3));
    const same = []; for (const f of C.families) for (const p of C.palettes[f]) if (C.colors(f, p, true).join() === C.colors(f, p, false).join()) same.push(f + '/' + p);
    return { fams: C.families.length, few, n, bad: bad.slice(0, 6), same };
  });
  report(cat.fams >= 12 && cat.few.length === 0, 'confetti: at least 12 families, each with at least 3 palettes', JSON.stringify(cat));
  report(cat.n >= 12 * 3 * 2 * 4 && cat.bad.length === 0, `confetti: every family x palette x light/dark x variant (${cat.n}) draws a visible shape`, cat.bad.join('; '));
  report(cat.same.length === 0, 'confetti: every palette has a dark-page version that differs from its light-page version', cat.same.join(', '));
  const oldNames = await page.evaluate(() => ['heart', 'star', 'confetti', 'petal', 'pixel'].filter(f => !SparkleThatPage.clickConfetti.families.includes(f)));
  report(oldNames.length === 0, 'confetti: the old family names (heart, star, confetti, petal, pixel) are all still families', oldNames.join());
  const flip = await page.evaluate(() => { const C = SparkleThatPage.clickConfetti, c = document.createElement('canvas'); c.width = c.height = 60;
    const g = c.getContext('2d', { willReadFrequently: true }), out = [];
    for (let i = 0; i < 6; i++) { g.clearRect(0, 0, 60, 60); C.draw(g, 'paper', 'bright', false, 30, 30, 12, i); const d = g.getImageData(0, 0, 60, 60).data; let k = 0; for (let j = 3; j < d.length; j += 4) if (d[j] > 40) k++; out.push(k); }
    return out; });
  report(Math.max(...flip) - Math.min(...flip) >= 0.3 * Math.max(...flip), 'confetti paper: pieces flip - the same strip is much thinner at some turns than at others', flip.join());
  await ctx.close();

  // 2. no font characters, anywhere: every family and motion, normal and reduced motion
  for (const reducedMotion of ['no-preference', 'reduce']) {
    ({ ctx, page } = await open('on.html', { reducedMotion }));
    const n = await page.evaluate(async () => { const C = SparkleThatPage.clickConfetti;
      for (const f of C.families) for (const m of C.motions) C.burst(300, 300, { family: f, motion: m });
      const c = document.createElement('canvas'), g = c.getContext('2d'); for (const f of C.families) C.draw(g, f, C.palettes[f][0], false, 10, 10, 10, 0);
      await new Promise(r => setTimeout(r, 300)); return window.__spy.text; });
    report(n === 0, `confetti (${reducedMotion}): no fillText / strokeText call for any family or motion - shapes are paths`, `${n} font draws`);
    await ctx.close();
  }

  // 3. old names draw on a click, unknown names fall back, odd names never crash
  for (const fam of ['heart', 'star', 'confetti', 'petal', 'pixel']) {
    ({ ctx, page } = await open('on.html'));
    await page.evaluate(f => { document.documentElement.dataset.confetti = f; }, fam);
    await page.mouse.click(400, 300); await sleep(70);
    const s = await grab(page);
    report(s && s.n > 30 && page.__errors.length === 0, `confetti: data-confetti="${fam}" still draws on a click`, `${s && s.n} px, ${page.__errors}`);
    await ctx.close();
  }
  ({ ctx, page } = await open('badmotion.html'));
  await page.mouse.click(400, 300); await sleep(70);
  const bad = await grab(page);
  report(bad && bad.n > 30 && page.__errors.length === 0, 'confetti: data-confetti="constructor" and data-confetti-motion="__proto__" fall back to a heart burst, no crash', `${bad && bad.n} px, ${page.__errors}`);
  await ctx.close();

  // 4. burst(x, y, options) fires that family, the page's own setting stays
  ({ ctx, page } = await open('on.html'));
  const leaf = fillsOf(await colours(page, 'leaf', 'forest', false)), heart = fillsOf(await colours(page, 'heart', 'candy', false)), autumn = fillsOf(await colours(page, 'leaf', 'autumn', false));
  const G = { leaf, heart, autumn };
  const before = await page.evaluate(() => JSON.stringify({ ...document.documentElement.dataset }));
  await page.evaluate(() => SparkleThatPage.clickConfetti.burst(400, 300, { family: 'leaf', palette: 'forest' })); await sleep(60);
  const opt = await grab(page, { groups: G });
  const after = await page.evaluate(() => JSON.stringify({ ...document.documentElement.dataset }));
  report(opt.groups.leaf > 40 && opt.groups.heart === 0, 'confetti burst(x, y, { family, palette }): draws that family in that palette', JSON.stringify(opt.groups));
  report(before === after, "confetti burst(x, y, options): the page's own data-* attributes are not changed", `${before} -> ${after}`);
  await sleep(1700);
  await page.mouse.click(400, 300); await sleep(60);
  const plain = await grab(page, { groups: G });
  report(plain.groups.heart > 40 && plain.groups.leaf === 0, 'confetti burst with options: the next plain click is still the page\'s own heart', JSON.stringify(plain.groups));
  await sleep(1700);
  await page.evaluate(() => SparkleThatPage.clickConfetti.burst(400, 300, { family: 'nope', palette: 'nope' })); await sleep(60);
  const nope = await grab(page, { groups: G });
  report(nope.groups.heart > 40 && page.__errors.length === 0, 'confetti burst with an unknown family / palette: falls back to a heart', JSON.stringify(nope.groups));
  await ctx.close();

  // 5. page attributes: palette, theme override, precedence
  ({ ctx, page } = await open('leaf.html'));
  await page.mouse.click(400, 300); await sleep(60);
  const pa = await grab(page, { groups: { autumn, leaf } });
  report(pa.groups.autumn > 40 && pa.groups.leaf === 0, 'confetti: data-confetti-palette picks that palette of the family', JSON.stringify(pa.groups));
  await ctx.close();
  ({ ctx, page } = await open('neon.html'));
  const neon = fillsOf(await page.evaluate(() => ['#2ee6ff', '#b6ff3d', '#ff5ad0', '#ffb43d', '#ffffff']));
  await page.mouse.click(400, 300); await sleep(60);
  const nn = await grab(page, { groups: { neon, autumn } });
  report(nn.groups.neon > 20 && nn.groups.autumn === 0, 'confetti: data-palette="neon" (the page-wide theme) still overrides the family palette', JSON.stringify(nn.groups));
  await sleep(1700);
  await page.evaluate(() => SparkleThatPage.clickConfetti.burst(400, 300, { palette: 'autumn' })); await sleep(60);
  const ex = await grab(page, { groups: { neon, autumn } });
  report(ex.groups.autumn > 40 && ex.groups.neon === 0, 'confetti: a palette passed to burst() beats data-palette', JSON.stringify(ex.groups));
  await ctx.close();

  // 6. motions
  ({ ctx, page } = await open('on.html'));
  const frac = async (motion) => { await page.evaluate(m => SparkleThatPage.clickConfetti.burst(400, 300, { family: 'heart', motion: m }), motion); await sleep(100);
    const s = await grab(page, { cy: 300 }); await sleep(2500); return s; };
  const b = await frac('burst'), f = await frac('fountain');
  report(b.n > 0 && b.below / b.n > 0.08, 'confetti burst motion: pieces go out in every direction (a clear share is below the click point)', `${b.below}/${b.n} below`);
  report(f.n > 0 && f.below / f.n < 0.03, 'confetti fountain: pieces shoot UP first - almost nothing is below the click point at 100 ms', `${f.below}/${f.n} below`);
  await page.evaluate(() => SparkleThatPage.clickConfetti.burst(400, 300, { family: 'heart', motion: 'rain' }));
  await sleep(30);
  const r1 = await grab(page, { cy: 120 });
  await sleep(1100);
  const r2 = await grab(page, { cy: 300 });
  report(r1 && r1.n < 40 && r1.below === 0 && r2 && r2.n > 100 && r2.maxy > 100, 'confetti rain: nothing is on screen at first (pieces start above the top), then pieces fall in', `${r1 && r1.n} px at 30 ms (below row 120: ${r1 && r1.below}), ${r2 && r2.n} px at 1.1 s, lowest row ${r2 && r2.maxy}`);
  await sleep(6000);
  await page.evaluate(() => SparkleThatPage.clickConfetti.burst(400, 300, { family: 'heart', motion: 'pop' })); await sleep(110);
  const pop = await grab(page);
  await sleep(1500);
  // a ring: at ~250 ms pixels sit around the click point in (nearly) every direction, which 8 loose pieces cannot do
  await page.evaluate(() => SparkleThatPage.clickConfetti.burst(400, 300, { family: 'heart', motion: 'pop' })); await sleep(240);
  const rays = await page.evaluate(() => { const c = document.querySelector('canvas.stp-confetti'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let hit = 0;
    for (let k = 0; k < 24; k++) { let ok = 0; for (let r = 6; r <= 34 && !ok; r++) { const x = Math.round(400 + r * Math.cos(k * Math.PI / 12)), y = Math.round(300 + r * Math.sin(k * Math.PI / 12)); if (d[(y * c.width + x) * 4 + 3]) ok = 1; } hit += ok; } return hit; });
  await sleep(1200);
  report(rays >= 22, 'confetti pop: draws a ring - pixels surround the click point in (nearly) every direction', `${rays} of 24 directions`);
  report(pop.n > 0 && pop.n < b.n * 0.8 && pop.maxx - pop.minx < 150 && pop.maxy - pop.miny < 150, 'confetti pop: a ring and a few pieces, small and close to the click (for small buttons)', `${pop.n} px (burst ${b.n}), box ${pop.maxx - pop.minx} x ${pop.maxy - pop.miny}`);
  await ctx.close();
  ({ ctx, page } = await open('rainpage.html'));
  await page.mouse.click(400, 300); await sleep(30);
  const rp = await grab(page, { cy: 120 });
  report(rp === null || (rp.n < 40 && rp.below === 0), 'confetti: data-confetti-motion="rain" on <html> makes a plain click rain', rp && `${rp.n} px, ${rp.below} below row 120`);
  await ctx.close();

  // 7. the frame loop stops when no pieces are left (every motion), and nothing is left on the canvas
  ({ ctx, page } = await open('on.html'));
  for (const m of ['burst', 'fountain', 'rain', 'pop']) {
    await check(`confetti ${m}: the canvas empties and the frame loop stops once the pieces are gone`, async () => {
      await page.evaluate(m => SparkleThatPage.clickConfetti.burst(400, 300, { family: 'bubble', motion: m }), m);
      const t0 = Date.now(); let s, peak = 0, r0 = await page.evaluate(() => window.__spy.raf), still = 0;
      do { await sleep(250); s = await grab(page); peak = Math.max(peak, s.n); const r1 = await page.evaluate(() => window.__spy.raf); still = r1 === r0 ? still + 1 : 0; r0 = r1; } while (still < 3 && Date.now() - t0 < 14000);
      return [peak > 0 && s.n === 0 && still >= 3, `peak ${peak} px, ${s.n} px left, frames stopped for ${still} samples after ${Date.now() - t0} ms`];
    });
  }
  await ctx.close();

  // 8. reduced motion: exactly one small shape, fading in place, per family
  ({ ctx, page } = await open('on.html', { reducedMotion: 'reduce' }));
  const rm = [];
  for (const fam of await C(page, C => C.families)) {
    await page.evaluate(f => SparkleThatPage.clickConfetti.burst(400, 300, { family: f }), fam); await sleep(70);
    const a = await grab(page); await sleep(200); const bb = await grab(page); await sleep(450); const gone = await grab(page);
    const w = a ? a.maxx - a.minx : 0, h = a ? a.maxy - a.miny : 0;
    const still = a && bb && Math.abs((a.minx + a.maxx) / 2 - (bb.minx + bb.maxx) / 2) <= 1 && Math.abs((a.miny + a.maxy) / 2 - (bb.miny + bb.maxy) / 2) <= 1;
    const ok = a && w > 6 && w < 45 && h < 45 && still && bb.alpha < a.alpha * 0.85 && gone.n === 0;
    if (!ok) rm.push(`${fam}: ${a && w}x${a && h} still=${still} alpha ${a && a.alpha}->${bb && bb.alpha} gone=${gone && gone.n}`);
  }
  report(rm.length === 0, 'confetti reduced motion: every family gives ONE small shape that stays in place, fades, and is gone by ~700 ms', rm.slice(0, 3).join(' | '));
  await page.evaluate(() => SparkleThatPage.clickConfetti.burst(400, 300, { motion: 'rain' })); await sleep(60);
  const rr = await grab(page);
  report(rr && rr.maxx - rr.minx < 45, 'confetti reduced motion: even the rain / fountain / pop motions give the same single still shape', rr && `${rr.maxx - rr.minx} px wide`);
  await ctx.close();

  // 9. light / dark follows the PAGE, and pieces already in the air repaint without a new burst
  const lightF = fillsOf(await colours(await (async () => { ({ ctx, page } = await open('on.html')); return page; })(), 'heart', 'candy', false));
  const darkF = fillsOf(await colours(page, 'heart', 'candy', true));
  await ctx.close();
  const live = async (file, flipFn, name) => {
    ({ ctx, page } = await open(file));
    await page.evaluate(() => SparkleThatPage.clickConfetti.burst(400, 300, { family: 'heart', palette: 'candy', motion: 'rain' }));
    await sleep(900);
    const a = await grab(page, { groups: { l: lightF, d: darkF } });
    await page.evaluate(flipFn); await sleep(120);
    const z = await grab(page, { groups: { l: lightF, d: darkF } });
    const raf = await page.evaluate(() => window.__spy.raf);
    await ctx.close();
    return [a, z, raf];
  };
  let [a1, z1] = await live('on.html', () => document.documentElement.setAttribute('data-theme', 'dark'));
  report(a1.groups.l > 20 && a1.groups.d < a1.groups.l * 0.05 && z1.groups.d > 20 && z1.groups.l < z1.groups.d * 0.05, 'confetti: data-theme flipped to dark while pieces are in the air - they repaint in the dark-page colours, no new burst', `light-page fills ${a1.groups.l}/${a1.groups.d} -> ${z1.groups.l}/${z1.groups.d}`);
  [a1, z1] = await live('night.html', () => document.documentElement.classList.add('night'));
  report(a1.groups.l > 20 && a1.groups.d < a1.groups.l * 0.05 && z1.groups.d > 20 && z1.groups.l < z1.groups.d * 0.05, 'confetti: a class on <html> that darkens the <body> background (no data-theme) also repaints pieces already flying', `${a1.groups.l}/${a1.groups.d} -> ${z1.groups.l}/${z1.groups.d}`);
  [a1, z1] = await live('dark.html', () => document.documentElement.setAttribute('data-theme', 'light'));
  report(a1.groups.d > 20 && a1.groups.l < a1.groups.d * 0.05 && z1.groups.l > 20 && z1.groups.d < z1.groups.l * 0.05, 'confetti: a dark page flipped back to light repaints in the light-page colours (data-theme beats the dark body background)', `${a1.groups.l}/${a1.groups.d} -> ${z1.groups.l}/${z1.groups.d}`);
  ({ ctx, page } = await open('on.html'));
  await page.evaluate(() => SparkleThatPage.clickConfetti.burst(400, 300, { family: 'heart', motion: 'rain' })); await sleep(700);
  const ink = await grab(page, { groups: { ink: [hex('#2a2140')].concat([[0x7b, 0x2a, 0x56]]) } });
  report(ink.n > 0 && ink.minL < 0.35, 'confetti: on a light page every piece carries a darker outline (so pale pieces show on white)', `darkest solid pixel luminance ${ink.minL.toFixed(2)}`);
  await ctx.close();

  // 10. snow and bubbles are visible on white (contrast of the darkest solid pixel), and bright on dark
  for (const fam of ['snow', 'bubble']) {
    ({ ctx, page } = await open('on.html'));
    await page.evaluate(f => SparkleThatPage.clickConfetti.burst(400, 300, { family: f }), fam); await sleep(60);
    const s = await grab(page);
    const contrast = 1.05 / (s.minL + 0.05);
    report(contrast >= 3, `confetti ${fam} on a white page: the darkest drawn pixel has a contrast of at least 3:1 against white`, `${contrast.toFixed(2)}:1`);
    await ctx.close();
    ({ ctx, page } = await open('dark.html'));
    await page.evaluate(f => SparkleThatPage.clickConfetti.burst(400, 300, { family: f }), fam); await sleep(60);
    const t = await grab(page);
    const bg = 0.0085;
    report((t.maxL + 0.05) / (bg + 0.05) >= 3, `confetti ${fam} on a dark page: the lightest drawn pixel has a contrast of at least 3:1 against the page`, `${((t.maxL + 0.05) / (bg + 0.05)).toFixed(2)}:1`);
    await ctx.close();
  }

  // 10b. EVERY family x palette, drawn at a small real size on white and on near-black (#111): the most contrasting solid
  // pixel must reach 2.5:1 against the page. Each pixel is blended onto the page colour first (drawn = alpha >= 128, i.e. at least half covered).
  ({ ctx, page } = await open('on.html'));
  const vis = await page.evaluate(() => {
    const C = SparkleThatPage.clickConfetti, out = {};
    const lum = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = (r, g, b) => 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
    for (const [name, bg, dark] of [['white', 255, false], ['dark', 17, true]]) {
      const bgL = L(bg, bg, bg);
      for (const f of C.families) {
        let worst = 99, where = '';
        for (const p of C.palettes[f]) for (let i = 0; i < 4; i++) {
          const c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d', { willReadFrequently: true });
          C.draw(g, f, p, dark, 24, 24, 8, i);
          const d = g.getImageData(0, 0, 48, 48).data; let best = 1;
          for (let j = 0; j < d.length; j += 4) { if (d[j + 3] < 128) continue;
            const a = d[j + 3] / 255, px = L(d[j] * a + bg * (1 - a), d[j + 1] * a + bg * (1 - a), d[j + 2] * a + bg * (1 - a));
            const r = (Math.max(px, bgL) + 0.05) / (Math.min(px, bgL) + 0.05); if (r > best) best = r; }
          if (best < worst) { worst = best; where = p + '/' + i; }
        }
        out[name + '|' + f] = [worst, where];
      }
    }
    return out;
  });
  for (const [k, [ratio, where]] of Object.entries(vis)) { const [pg, f] = k.split('|');
    report(ratio >= 2.5, `confetti ${f} on a ${pg === 'white' ? 'white' : 'near-black (#111)'} page: every palette has a drawn pixel with a contrast of at least 2.5:1 against it`, `worst ${ratio.toFixed(2)}:1 at ${where}`); }
  await ctx.close();

  // 10c. colours that are not #rrggbb still get an outline on white (rgb(), 3-digit hex, oklch())
  for (const [n, col] of [['rgb()', 'rgb(253, 224, 71)'], ['3-digit hex', '#fe4'], ['oklch()', 'oklch(0.93 0.17 100)']]) {
    ({ ctx, page } = await open('on.html'));
    await page.evaluate(c => { const r = document.documentElement; for (let i = 1; i <= 6; i++) r.style.setProperty('--stp-c' + i, c); r.setAttribute('data-palette', 'candy'); SparkleThatPage.clickConfetti.burst(400, 300, { family: 'star', palette: undefined }); }, col);
    await sleep(60);
    const g2 = await grab(page);
    report(g2 && g2.n > 0 && g2.minL < 0.35, `confetti: a page colour written as ${n} still gets a dark outline on white`, `darkest solid pixel luminance ${g2 && g2.minL.toFixed(2)}`);
    await ctx.close();
  }

  // 11. strict CSP: style-src 'self' - a burst draws, a stamp appears centred on its button, no violations
  ({ ctx, page } = await open('csp.html'));
  const btn = await page.locator('#s').boundingBox();
  await page.click('#s'); await sleep(450);
  const stampBox = await page.evaluate(() => { const e = document.querySelector('.stp-stamp'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  const cs = await grab(page);
  const viol = await page.evaluate(() => window.__spy.csp);
  report(stampBox && Math.abs(stampBox[0] - (btn.x + btn.width / 2)) < 6 && Math.abs(stampBox[1] - (btn.y + btn.height / 2)) < 6, 'confetti under style-src \'self\': the stamp appears centred on its button', JSON.stringify([stampBox, btn]));
  report(cs && cs.n > 0 && viol === 0 && page.__errors.length === 0, 'confetti under style-src \'self\': the burst draws and there is no CSP violation', `${cs && cs.n} px, ${viol} violations, ${page.__errors}`);
  await ctx.close();

  // 12. old behaviour that lives inside this file: where it fires, stamp, API
  ({ ctx, page } = await open('celebrate.html'));
  await page.mouse.click(600, 400); await sleep(100);
  const nothing = await grab(page);
  await page.click('#cel'); await sleep(70);
  const some = await grab(page);
  report(nothing.n === 0 && some.n > 0, 'confetti: by default only [data-celebrate] / [data-confetti] elements fire', `${nothing.n} px on a plain spot, ${some.n} on the button`);
  await ctx.close();
  ({ ctx, page } = await open('stamp.html', { reducedMotion: 'reduce' }));
  await page.click('#s'); await sleep(300);
  const rs = await page.evaluate(() => [document.querySelectorAll('.stp-stamp').length, document.querySelector('canvas.stp-confetti').getContext('2d').getImageData(0, 0, 800, 600).data.some((v, i) => i % 4 === 3 && v)]);
  report(rs[0] === 1 && rs[1] === false, 'confetti stamp under reduced motion: the label appears and no confetti is drawn', JSON.stringify(rs));
  await ctx.close();
  ({ ctx, page } = await open('stamp.html'));
  await page.click('#s'); await sleep(500);
  const ps = await grab(page);
  report(ps && ps.n > 0, 'confetti stamp: the burst lands about 220 ms after the click (visible at 500 ms)', `${ps && ps.n} px`);
  await ctx.close();

  // 13. start / destroy / observers
  ({ ctx, page } = await open('on.html'));
  const life = await page.evaluate(async () => {
    const C = SparkleThatPage.clickConfetti, s = window.__spy, o = [];
    o.push(document.querySelectorAll('canvas.stp-confetti').length, C.active(), s.observe);
    C.start(); o.push(document.querySelectorAll('canvas.stp-confetti').length);
    C.burst(300, 300); C.destroy();
    o.push(document.querySelectorAll('canvas.stp-confetti').length, C.active(), s.disconnect);
    C.burst(300, 300, { family: 'star' }); o.push(document.querySelectorAll('canvas.stp-confetti').length);
    const raf0 = s.raf; await new Promise(r => setTimeout(r, 200)); o.push(s.raf - raf0);
    const c = document.createElement('canvas'); C.draw(c.getContext('2d'), 'star', 'gold', false, 10, 10, 6, 0); o.push(C.families.length > 11);
    C.start(); o.push(document.querySelectorAll('canvas.stp-confetti').length, C.active());
    return o;
  });
  report(life[0] === 1 && life[1] && life[2] >= 1 && life[3] === 1 && life[4] === 0 && life[5] === false && life[6] >= 1 && life[7] === 0 && life[8] === 0 && life[9] && life[10] === 1 && life[11],
    'confetti: start() twice = one canvas; destroy() removes it, stops frames and releases the theme observer; burst() while off does nothing; draw() still works; start() brings it back', JSON.stringify(life));
  await ctx.close();
  ({ ctx, page } = await open('head.html'));
  await page.mouse.click(400, 300); await sleep(70);
  const hd = await grab(page);
  report(hd && hd.n > 0 && page.__errors.length === 0, 'confetti: a <script> in <head> waits for the body and then works', `${hd && hd.n} px, ${page.__errors}`);
  await ctx.close();

  // 14. other files that call into this one
  const src = fs.readFileSync(JS, 'utf8');
  report(!/fillText|strokeText|font\s*=\s*[^;]*serif/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), 'confetti file: no fillText / strokeText in the code (only the stamp label uses a font, as a real element)');
  report(!/[☀-➿\u{1F300}-\u{1FAFF}]/u.test(src), 'confetti file: no emoji or dingbat characters anywhere in it');
  report(!/<style|innerHTML|style="/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), 'confetti file: no <style> element, no innerHTML and no style="" attribute (strict CSP)');
  report(/isDark\(\)[\s\S]{0,40}copied from fairy_cursor\.js/.test(src) && /data-confetti-motion/.test(src) && /data-confetti-palette/.test(src), 'confetti file: the header says isDark() is copied from fairy_cursor.js and names the new attributes');

  // 15. the gallery
  if (fs.existsSync(GAL)) {
    ({ ctx, page } = await (async () => { const c = await browser.newContext({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 }); await c.addInitScript(SPY); const p = await c.newPage(); p.__errors = []; p.on('pageerror', e => p.__errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') p.__errors.push(m.text()); });
      await p.goto(`${ORIGIN}/plugins/sparkle-that-page/skills/sparkle-that-page/examples/confetti.html`); await p.waitForSelector('.card'); return { ctx: c, page: p }; })());
    const gal = await page.evaluate(() => { const C = SparkleThatPage.clickConfetti; return { cards: document.querySelectorAll('.card').length, want: C.families.reduce((n, f) => n + C.palettes[f].length, 0), motions: document.querySelectorAll('#motions button').length, links: [...document.querySelectorAll('a')].map(a => a.getAttribute('href')), stills: [...document.querySelectorAll('.card canvas')].filter(c => c.width > 0).length }; });
    report(gal.cards === gal.want && gal.cards >= 36 && gal.motions === 4 && gal.stills === gal.cards * 3, 'confetti gallery: one card per family x palette, with 3 still pictures each and a switch for the 4 motions', JSON.stringify(gal));
    report(gal.links.includes('./demo.html') && gal.links.includes('../references/confetti.md'), 'confetti gallery: links to demo.html and references/confetti.md', gal.links.join());
    const attrs0 = await page.evaluate(() => JSON.stringify({ ...document.documentElement.dataset }));
    const card = page.locator('.card:has(button.fire[aria-label*="leaf confetti, autumn"])');
    await card.scrollIntoViewIfNeeded();
    await page.click('#motions button:has-text("fountain")');
    const cb = await card.locator('.stage').boundingBox(), cyc = cb.y + cb.height / 2;
    await card.locator('.stage').click(); await sleep(90);
    const fired = await grab(page, { groups: { autumn }, cy: cyc });
    report(fired && fired.groups.autumn > 15 && fired.below / fired.n < 0.1, 'confetti gallery: clicking a card fires that family and palette from the card, in the chosen motion (fountain goes up)', fired && `${fired.groups.autumn} autumn px, ${fired.below}/${fired.n} below`);
    report(attrs0 === await page.evaluate(() => JSON.stringify({ ...document.documentElement.dataset })), 'confetti gallery: firing a card does not change the page\'s own data-* attributes');
    const dbl = await page.evaluate(() => document.querySelectorAll('canvas.stp-confetti').length);
    report(dbl === 1, 'confetti gallery: exactly one confetti canvas (cards do not trigger a second, default burst)', String(dbl));
    const stillBefore = await page.evaluate(() => document.querySelector('.stage canvas').toDataURL().length);
    await page.click('#theme'); await sleep(150);
    const stillAfter = await page.evaluate(() => [document.documentElement.getAttribute('data-theme'), document.querySelector('.stage canvas').toDataURL().length]);
    report(stillAfter[0] === 'dark' && stillAfter[1] !== stillBefore, 'confetti gallery: the dark-page switch redraws the stills', `${stillAfter}`);
    report(page.__errors.length === 0, 'confetti gallery: no console or page errors', page.__errors.join(' | '));
    const roles = await page.evaluate(() => ({ roleBtn: document.querySelectorAll('.card[role="button"]').length, nested: document.querySelectorAll('[role="button"] button').length, fire: document.querySelectorAll('.card button.fire').length, cards: document.querySelectorAll('.card').length }));
    report(roles.roleBtn === 0 && roles.nested === 0 && roles.fire === roles.cards, 'confetti gallery: no card has role=button; each card has its own real Fire button', JSON.stringify(roles));
    await page.evaluate(() => document.querySelector('button.fire[aria-label*="heart confetti, candy"]').focus()); await page.keyboard.press('Enter'); await sleep(80);
    const kb = await grab(page);
    report(kb && kb.n > 0, 'confetti gallery: Enter on a card\'s Fire button fires confetti (keyboard works)', `${kb && kb.n} px`);
    await ctx.close();
    { const c = await browser.newContext(); const p = await c.newPage(); await p.goto(`${ORIGIN}/gallery-nojs.html`); ctx = c; page = p; }
    if (page) { await sleep(200); await page.click('#theme'); const sw = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); report(sw === 'dark', 'confetti gallery: with click_confetti.js missing the Dark page switch still works', String(sw)); const msg = await page.evaluate(() => (document.querySelector('#out .hint') || {}).textContent || ''); report(/click_confetti\.js was not found/.test(msg), 'confetti gallery: with click_confetti.js missing it says so instead of showing nothing', msg.slice(0, 80)); await ctx.close(); }
  } else report(false, 'confetti gallery: examples/confetti.html exists');
  const guide = path.join(SKILL, 'references/confetti.md');
  if (fs.existsSync(guide)) {
    const md = fs.readFileSync(guide, 'utf8');
    const names = JSON.parse(await (async () => { const { ctx: c, page: p } = await open('on.html'); const r = await p.evaluate(() => JSON.stringify(SparkleThatPage.clickConfetti.families)); await c.close(); return r; })());
    const missing = names.filter(f => !new RegExp('`' + f + '`').test(md));
    const jsSrc = fs.readFileSync(path.join(SKILL, 'examples/click_confetti.js'), 'utf8') + md + (fs.existsSync(GAL) ? fs.readFileSync(GAL, 'utf8') : '');
    report(!/game ?boy/i.test(jsSrc), 'confetti: no trademarked name (Game Boy) in the effect, its guide or its gallery', (jsSrc.match(/game ?boy/i) || [''])[0]);
    report(missing.length === 0 && /checked 2026-11-11/.test(md) && /data-confetti-motion/.test(md), 'confetti guide: names every family, the motion attribute, and dates its licence checks', 'missing: ' + missing.join());
  } else report(false, 'confetti guide: references/confetti.md exists');
} catch (e) {
  console.log('FAIL  test run crashed: ' + String(e.stack || e).slice(0, 400)); failed++;
} finally {
  if (browser) await browser.close();
  server.close();
}
process.exit(failed ? 1 : 0);
