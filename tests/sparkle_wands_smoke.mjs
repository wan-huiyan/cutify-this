// Headless-browser smoke test for the sparkle-that-page wands (fairy_cursor.js): every family × palette × light/dark ×
// glow renders a 40×40 SVG with its click point inside, the families differ in shape (not just colour), gradient ids
// don't collide when many wands share a page, light/dark follows the PAGE (the same rule as sparkle_trail.js's
// pageIsDark: data-theme, then the <body>/<html> background, then the system scheme only when the page allows dark),
// the wand repaints when any of those change, a page's own --stp-wand is left alone, odd names never crash it, the old
// data-wand names still work, destroy() lets go of everything, and the docs / demo / site name the real families.
// Run: node tests/sparkle_wands_smoke.mjs
//   WAND_JS=/path/to/copy.js points it at another copy of the wand file, SPARKLE_ROOT=/path at another copy of the
//   repo (docs, demo, site), to prove a check can fail.
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
const WAND = process.env.WAND_JS || path.join(SKILL, 'examples/fairy_cursor.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sparkle-wands-'));
const page_ = (attrs, body, head = '') => `<!doctype html><html${attrs}><head><meta charset="utf-8"><title>wands</title>${head}</head><body style="margin:0">${body}</body></html>`;
const LINKS = `<a id="lnk" href="#x" style="display:block;margin:40px;padding:20px">link</a><p id="txt" style="margin:40px;padding:20px">text</p>`;
const BODY = `${LINKS}<script src="/__wand__.js"></script>`;
const pages = {
  'plain.html': page_('', BODY),                                                     // no theme, no background: a white page
  'light.html': page_(' data-theme="light"', BODY),
  'owned.html': page_(' data-theme="ocean"', BODY),                                  // a theme name the page owns
  'scheme.html': page_(' style="color-scheme: light dark"', BODY),                    // the page allows a dark scheme
  'darkbody.html': page_('', BODY, '<style>body{background:#100a22}</style>'),
  'darkhtml.html': page_('', BODY, '<style>html{background:#100a22}</style>'),        // <body> transparent: <html> decides
  'toggle.html': page_('', BODY, '<style>html.night body{background:#111}</style>'),
  'fade.html': page_('', BODY, '<style>body{transition:background-color .12s} html.night body{background:#111}</style>'),
  'head.html': page_('', LINKS, '<script src="/__wand__.js"></script><style>body{background:#100a22} body.day{background:#fff}</style>'),
  'crosshair.html': page_(' style="cursor:crosshair"', BODY),
  'ownsheet.html': page_('', BODY, '<style>:root{--stp-wand:crosshair}</style>'),
};
for (const [n, h] of Object.entries(pages)) fs.writeFileSync(path.join(TMP, n), h);
// counts the wand's MutationObserver (one watching data-wand* / data-theme) observe/disconnect and colour-scheme listeners added/removed, so destroy() can be checked
const SPY = `(() => { const s = window.__spy = { observe: 0, disconnect: 0, add: 0, remove: 0 };
  const MO = window.MutationObserver; window.MutationObserver = class extends MO {
    observe(t, o) { if (o && o.attributeFilter && o.attributeFilter.some(a => /^data-(wand|theme)/.test(a))) { this.__w = 1; s.observe++; } return super.observe(t, o); }
    disconnect() { if (this.__w) s.disconnect++; return super.disconnect(); } };
  const P = MediaQueryList.prototype, add = P.addEventListener, rem = P.removeEventListener, al = P.addListener, rl = P.removeListener;
  P.addEventListener = function (t, f, o) { if (t === 'change') s.add++; return add.call(this, t, f, o); };
  P.removeEventListener = function (t, f, o) { if (t === 'change') s.remove++; return rem.call(this, t, f, o); };
  P.addListener = function (f) { s.add++; return al.call(this, f); }; P.removeListener = function (f) { s.remove++; return rl.call(this, f); }; })();`;

const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file;
  if (url === '/__wand__.js' || url.endsWith('/fairy_cursor.js')) file = WAND;                 // the site loads it through the bridge too
  else if (/^\/(site|plugins)\//.test(url)) file = path.join(ROOT, path.normalize(url.slice(1)));
  else file = path.join(TMP, path.normalize(url.slice(1)));
  if (file !== WAND && !file.startsWith(TMP) && !file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

let failed = 0, browser;
const report = (ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? '  (' + detail + ')' : ''}`); };
// one assertion whose probe may throw (an old copy of the wand file can crash on odd input): a throw is a FAIL, not an abort
const check = async (name, fn) => { try { const [ok, detail] = await fn(); report(ok, name, detail); } catch (e) { report(false, name, 'threw: ' + String(e.message || e).slice(0, 160)); } };
try { browser = await chromium.launch({ channel: 'chrome' }); }
catch { try { browser = await chromium.launch(); } catch { console.log('no Chrome / Chromium for Playwright'); server.close(); process.exit(2); } }

try {
  const open = async (file, opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, ...opts });
    await ctx.addInitScript(SPY);
    const page = await ctx.newPage();
    page.__errors = []; page.on('pageerror', e => page.__errors.push(e.message));
    await page.goto(`${ORIGIN}/${file}`);
    await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.fairyCursor);
    return { ctx, page };
  };
  const prop = (page, p = '--stp-wand') => page.evaluate(p => document.documentElement.style.getPropertyValue(p), p);
  const wand = page => prop(page);
  const changed = (page, before, p = '--stp-wand', timeout = 1500) => page.waitForFunction(([b, p]) => document.documentElement.style.getPropertyValue(p) !== b, [before, p], { timeout }).then(() => true, () => false);
  const ink = v => { const s = decodeURIComponent(v); return s.includes('stroke="#ffffff"') ? 'white' : s.includes('stroke="#2a2140"') ? 'dark' : '?'; };
  const inkOn = async (file, opts) => { const { ctx, page } = await open(file, opts); const v = ink(await wand(page)); await ctx.close(); return v; };

  // 1. the whole catalogue renders
  let { ctx, page } = await open('light.html');
  const cat = await page.evaluate(async () => {
    const W = SparkleThatPage.fairyCursor, bad = [], P = new DOMParser();
    let n = 0, fams = W.families || [], pals = W.palettes || {}, few = fams.filter(f => !(pals[f] && pals[f].length >= 3));
    const [hx, hy] = W.hotspot();
    for (const f of fams) for (const p of pals[f] || []) for (const dark of [false, true]) for (const on of [false, true]) {
      n++;
      const svg = W.svg(f, p, dark, on), doc = P.parseFromString(svg, 'image/svg+xml'), el = doc.documentElement;
      const tag = `${f}/${p}/${dark ? 'dark' : 'light'}/${on ? 'glow' : 'base'}`;
      if (doc.querySelector('parsererror') || el.nodeName !== 'svg') { bad.push(tag + ': not parseable'); continue; }
      if (el.getAttribute('width') !== '40' || el.getAttribute('height') !== '40') bad.push(tag + ': not 40×40');
      if (!(hx >= 0 && hx <= 39 && hy >= 0 && hy <= 39)) bad.push(tag + `: hotspot ${hx},${hy} outside`);
      const img = new Image(); img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
      try { await img.decode(); if (img.naturalWidth !== 40) bad.push(tag + ': image is ' + img.naturalWidth + ' px'); } catch { bad.push(tag + ': image does not decode'); }
    }
    return { fams: fams.length, few, n, bad };
  });
  report(cat.fams >= 10 && cat.few.length === 0, 'wands: at least 10 families, each with at least 3 palettes', JSON.stringify(cat));
  report(cat.n >= 120 && cat.bad.length === 0, `wands: every family × palette × light/dark × glow (${cat.n}) is a parseable, decodable 40×40 SVG with its hotspot inside`, cat.bad.slice(0, 5).join('; '));

  // 2. the families differ in shape: compare the drawn silhouettes (alpha > 0) of every pair, same light page, no glow
  const shapes = await page.evaluate(async () => {
    const W = SparkleThatPage.fairyCursor, masks = {}, c = document.createElement('canvas'); c.width = c.height = 40;
    const g = c.getContext('2d', { willReadFrequently: true });
    for (const f of W.families) {
      const img = new Image(); img.src = 'data:image/svg+xml,' + encodeURIComponent(W.svg(f, W.palettes[f][0], false, false));
      try { await img.decode(); } catch { return [0, f + ' does not decode']; }
      g.clearRect(0, 0, 40, 40); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, 40, 40).data, m = new Uint8Array(1600); for (let i = 0; i < 1600; i++) m[i] = d[i * 4 + 3] > 96 ? 1 : 0; masks[f] = m;
    }
    const [x, y] = W.hotspot(), hole = Object.keys(masks).filter(f => !masks[f][Math.round(y) * 40 + Math.round(x)]);  // the click point must land on paint
    let worst = [1e9, ''];
    const F = Object.keys(masks);
    for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) {
      let diff = 0; for (let q = 0; q < 1600; q++) diff += masks[F[i]][q] ^ masks[F[j]][q];
      if (diff < worst[0]) worst = [diff, F[i] + ' vs ' + F[j]];
    }
    return worst.concat([hole]);
  });
  report(shapes[2] && shapes[2].length === 0, 'wands: the click point (the hotspot) is on the drawn gem, not on empty space, in every family', String(shapes[2]));
  report(shapes[0] >= 60, `wands: every two families differ in silhouette by at least 60 of 1600 pixels, not just in colour (closest: ${shapes[1]}, ${shapes[0]} px)`, `closest pair ${shapes[1]}: ${shapes[0]} px`);

  // 3. gradient ids don't collide when different wands are inlined into one page (a gallery does this)
  const ids = await page.evaluate(() => {
    const W = SparkleThatPage.fairyCursor, seen = new Map(), dup = [];
    for (const f of W.families) for (const p of W.palettes[f]) for (const dark of [false, true]) for (const on of [false, true])
      for (const m of W.svg(f, p, dark, on).matchAll(/ id="([^"]+)"/g)) { const k = f + p + dark + on; if (seen.has(m[1]) && seen.get(m[1]) !== k) dup.push(m[1]); seen.set(m[1], k); }
    return { n: seen.size, dup: dup.slice(0, 5) };
  });
  report(ids.n > 0 && ids.dup.length === 0, 'wands: gradient ids are unique per wand, so many wands can be inlined in one page', JSON.stringify(ids));

  // 4. the glowing twin differs from the base wand for every family, and the link really wears it
  const twins = await page.evaluate(() => { const W = SparkleThatPage.fairyCursor; return W.families.filter(f => W.svg(f, null, false, true) === W.svg(f, null, false, false) || W.svg(f, null, true, true) === W.svg(f, null, true, false)); });
  report(twins.length === 0, 'wands: the glowing twin (over clickables) is a different image from the base wand, for every family', twins.join(', '));
  const [onLink, onText] = await page.evaluate(() => ['#lnk', '#txt'].map(s => getComputedStyle(document.querySelector(s)).cursor));
  report(onLink.startsWith('url(') && onText.startsWith('url(') && onLink !== onText, 'wands: the cursor over a link is the glow image, over text the base image');

  // 4b. an unknown palette falls back to the family's FIRST palette (SKILL.md says so), for every family
  const fallback = await page.evaluate(() => { const W = SparkleThatPage.fairyCursor; return W.families.filter(f => W.svg(f, 'no-such-palette', true, false) !== W.svg(f, W.palettes[f][0], true, false)); });
  report(fallback.length === 0, 'wands: an unknown data-wand-palette falls back to the family\'s first palette', fallback.join(', '));

  // 4c. names every JS object has (toString, constructor, __proto__…) are not families or palettes: no crash, the default wand
  await check('wands: toString / constructor / __proto__ / hasOwnProperty / valueOf as a family or a palette draw the default wand, no crash', () => page.evaluate(() => {
    const W = SparkleThatPage.fairyCursor, bad = [], star = W.svg('star', null, false, false), moon = W.svg('moon', null, false, false);
    for (const n of ['toString', 'constructor', '__proto__', 'hasOwnProperty', 'valueOf']) {
      try { if (W.svg(n, null, false, false) !== star) bad.push('family ' + n); } catch (e) { bad.push(`family ${n} throws ${e.message}`); }
      try { if (W.svg('moon', n, false, false) !== moon) bad.push('palette ' + n); } catch (e) { bad.push(`palette ${n} throws ${e.message}`); }
    }
    return [bad.length === 0, bad.join('; ')];
  }));

  // 4d. the pixel wand is one <path> per colour, not hundreds of <rect>s, so its cursor URL stays small
  const px = await page.evaluate(() => { const W = SparkleThatPage.fairyCursor, out = { rects: 0, longest: 0 };
    for (const p of W.palettes.pixel) for (const d of [false, true]) for (const on of [false, true]) { const s = W.svg('pixel', p, d, on); out.rects += (s.match(/<rect/g) || []).length; out.longest = Math.max(out.longest, encodeURIComponent(s).length); }
    return out; });
  report(px.rects === 0 && px.longest <= 3000, `wands: the pixel wand draws runs of cells as paths (no <rect>), every pixel cursor image ≤ 3000 characters (longest ${px.longest})`, JSON.stringify(px));

  // 4e. moon: the glow is kept out of the crescent's bite, so on a dark page the twin still reads as a crescent, not a ball
  const bite = await page.evaluate(async () => {
    const W = SparkleThatPage.fairyCursor, c = document.createElement('canvas'); c.width = c.height = 40;
    const g = c.getContext('2d', { willReadFrequently: true }), out = [];
    for (const p of W.palettes.moon) for (const on of [false, true]) {
      const im = new Image(); im.src = 'data:image/svg+xml,' + encodeURIComponent(W.svg('moon', p, true, on)); await im.decode();
      g.fillStyle = '#0f1422'; g.fillRect(0, 0, 40, 40); g.drawImage(im, 0, 0);
      const d = g.getImageData(33, 9, 1, 1).data; out.push(Math.round(Math.max(Math.abs(d[0] - 15), Math.abs(d[1] - 20), Math.abs(d[2] - 34))));
    }
    return out;
  });
  report(Math.max(...bite) <= 24, 'wands: moon on a dark page — inside the crescent\'s bite stays the page colour, base and glowing (no glow ball)', `distance from #0f1422 at (33,9): ${bite.join(', ')}`);

  // 5. light → dark through data-theme repaints the wand with a white outline; and back
  let before = await wand(page);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const darkOk = await changed(page, before), afterDark = await wand(page);
  report(darkOk && ink(before) === 'dark' && ink(afterDark) === 'white', 'wands: data-theme light → dark repaints the wand (dark ink outline → white)', `${ink(before)} → ${ink(afterDark)}`);
  const htmlCur = await page.evaluate(() => getComputedStyle(document.documentElement).cursor);
  report(decodeURIComponent(htmlCur).includes('stroke="#ffffff"'), 'wands: the cursor on <html> itself now carries the dark-page wand');

  // 6. data-wand and data-wand-palette repaint too; a palette named "constructor" on the live page is no crash
  before = await wand(page);
  await page.evaluate(() => document.documentElement.setAttribute('data-wand', 'wizard'));
  report(await changed(page, before), 'wands: changing data-wand repaints the wand');
  before = await wand(page);
  await page.evaluate(() => document.documentElement.setAttribute('data-wand-palette', 'ember'));
  report(await changed(page, before) && decodeURIComponent(await wand(page)).includes('stp-wizard-ember'), 'wands: changing data-wand-palette repaints the wand in that palette');
  before = await wand(page);
  await page.evaluate(() => { const r = document.documentElement; r.setAttribute('data-wand-palette', 'constructor'); });
  await changed(page, before);
  await page.evaluate(() => document.documentElement.setAttribute('data-wand', '__proto__'));
  await page.waitForTimeout(80);
  report(page.__errors.length === 0 && decodeURIComponent(await wand(page)).includes('stp-star-gold-d0'), 'wands: data-wand-palette="constructor" and data-wand="__proto__" on the live page fall back to the default wand without a page error', page.__errors.join('; ') || decodeURIComponent(await wand(page)).match(/stp-[a-z]+-[a-z]+-[ld][01]/)?.[0]);

  // 7. old names still render; sailormoon is the magical wand and heart the candy wand
  const old = await page.evaluate(() => {
    const W = SparkleThatPage.fairyCursor, ok = s => typeof s === 'string' && s.startsWith('<svg') && s.includes('width="40"');
    return { render: ['star', 'heart', 'moon', 'pixel', 'sailormoon'].filter(n => !ok(W.svg(n, null, false, false))),
      sailor: W.svg('sailormoon', null, false, false) === W.svg('magical', null, false, false), heart: W.svg('heart', null, false, false) === W.svg('candy', null, false, false) };
  });
  report(old.render.length === 0, 'wands: the old data-wand names (star, heart, moon, pixel, sailormoon) still render', old.render.join(', '));
  report(old.sailor && old.heart, 'wands: sailormoon draws the magical wand and heart the candy wand', JSON.stringify(old));

  // 8. destroy() disconnects the observer and the colour-scheme listener: a later data-theme flip changes nothing
  const gone = await page.evaluate(async () => {
    const r = document.documentElement; SparkleThatPage.fairyCursor.destroy();
    const cur = r.style.cursor; r.setAttribute('data-theme', 'light'); r.setAttribute('data-wand', 'moon');
    await new Promise(res => setTimeout(res, 50));
    return { cur, after: r.style.cursor, prop: r.style.getPropertyValue('--stp-wand'), spy: window.__spy };
  });
  report(gone.prop === '' && gone.after === gone.cur, 'wands: after destroy() a data-theme / data-wand flip repaints nothing', JSON.stringify(gone));
  report(gone.spy.observe >= 1 && gone.spy.disconnect === gone.spy.observe && gone.spy.add >= 1 && gone.spy.remove === gone.spy.add, 'wands: destroy() disconnects its MutationObserver and removes its colour-scheme listener', JSON.stringify(gone.spy));
  await check('wands: start() after destroy() paints again', async () => {
    await page.evaluate(() => { const r = document.documentElement; r.removeAttribute('data-wand-palette'); SparkleThatPage.fairyCursor.start(); });
    return [(await wand(page)).startsWith('url('), 'no wand'];
  });
  await ctx.close();

  // 9. light or dark is the PAGE's, as in sparkle_trail.js: a white page in a dark system keeps light-page ink…
  report(await inkOn('plain.html', { colorScheme: 'dark' }) === 'dark', 'wands: a white page (no data-theme, no background) with a DARK system wears the light-page wand (dark ink)');
  report(await inkOn('owned.html', { colorScheme: 'dark' }) === 'dark', 'wands: data-theme set to a page-owned name ("ocean") on a white page, dark system: light-page wand');
  // …a dark page in a light system gets the dark-page wand, from <body>'s background or, if <body> is transparent, <html>'s
  report(await inkOn('darkbody.html', { colorScheme: 'light' }) === 'white', 'wands: a #100a22 <body> with a LIGHT system wears the dark-page wand (white ink)');
  report(await inkOn('darkhtml.html', { colorScheme: 'light' }) === 'white', 'wands: a #100a22 <html> with a transparent <body> wears the dark-page wand');
  // …and the system scheme decides only when the page allows a dark color-scheme; then a scheme flip repaints
  ({ ctx, page } = await open('scheme.html', { colorScheme: 'light' }));
  before = await wand(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  const mqOk = await changed(page, before);
  report(mqOk && ink(before) === 'dark' && ink(await wand(page)) === 'white', 'wands: a page with color-scheme "light dark" and no background follows the system: light → dark repaints the wand', `${ink(before)} → ${ink(await wand(page))}`);
  await ctx.close();

  // 10. a class on <html> or an inline style on <body> that changes the background repaints the wand
  ({ ctx, page } = await open('toggle.html'));
  before = await wand(page);
  await page.evaluate(() => { document.body.style.background = '#202124'; });
  report(await changed(page, before) && ink(await wand(page)) === 'white', 'wands: an inline dark background set on <body> repaints the dark-page wand', ink(await wand(page)));
  before = await wand(page);
  await page.evaluate(() => { document.body.style.background = ''; });
  report(await changed(page, before) && ink(await wand(page)) === 'dark', 'wands: removing it again repaints the light-page wand', ink(await wand(page)));
  before = await wand(page);
  await page.evaluate(() => document.documentElement.classList.add('night'));
  report(await changed(page, before) && ink(await wand(page)) === 'white', 'wands: <html class="night"> turning the body dark repaints the wand (white ink)', ink(await wand(page)));
  await ctx.close();
  ({ ctx, page } = await open('fade.html'));
  before = await wand(page);
  await page.evaluate(() => document.documentElement.classList.add('night'));
  report(await changed(page, before) && ink(await wand(page)) === 'white', 'wands: a background that TRANSITIONS to dark repaints the wand once the transition ends', ink(await wand(page)));
  await ctx.close();
  ({ ctx, page } = await open('head.html'));
  await page.waitForLoadState('load');
  before = await wand(page);
  await page.evaluate(() => document.body.classList.add('day'));
  report(ink(before) === 'white' && await changed(page, before) && ink(await wand(page)) === 'dark', 'wands: with the <script> in <head>, the dark <body> is read once it exists and its class changes are watched', `${ink(before)} → ${ink(await wand(page))}`);
  await ctx.close();

  // 11. site/aurora.html (a #100a22 page, no data-theme) wears the dark-page wand, and its "crystal" pill is the crystal wand
  {
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx2.route(u => !u.href.startsWith(ORIGIN), r => r.abort());   // no web fonts in a test
    const p2 = await ctx2.newPage(), errs = []; p2.on('pageerror', e => errs.push(e.message));
    await check('wands: site/aurora.html with the bridge\'s "crystal" cursor wears the crystal wand in its dark-page variant', async () => {
      await p2.goto(`${ORIGIN}/site/aurora.html`, { waitUntil: 'domcontentloaded' });
      await p2.evaluate(async () => { const m = await import('/site/sparkle-bridge.js'); await m.startFx('cursor', 'crystal'); });
      const v = decodeURIComponent(await p2.evaluate(() => document.documentElement.style.getPropertyValue('--stp-wand')));
      const id = (v.match(/stp-[a-z]+-[a-z]+-[ld][01]/) || [''])[0];
      return [/^stp-crystal-[a-z]+-d0$/.test(id) && ink(v) === 'white' && errs.length === 0, `wand ${id || 'none'}, ink ${ink(v)}, errors ${errs.join('; ')}`];
    });
    await ctx2.close();
  }

  // 12. a page's own --stp-wand is left alone: set before start() (a stylesheet) or after (inline), through theme flips and destroy()
  ({ ctx, page } = await open('light.html'));
  await page.evaluate(() => document.documentElement.style.setProperty('--stp-wand', 'crosshair'));
  before = await prop(page, '--stp-wand-link');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const linkMoved = await changed(page, before, '--stp-wand-link');
  report((await prop(page)) === 'crosshair' && linkMoved && ink(await prop(page, '--stp-wand-link')) === 'white', 'wands: a --stp-wand the page sets after start() survives a theme flip, while --stp-wand-link still repaints', `--stp-wand "${(await prop(page)).slice(0, 30)}"`);
  await page.evaluate(() => SparkleThatPage.fairyCursor.destroy());
  report((await prop(page)) === 'crosshair' && (await prop(page, '--stp-wand-link')) === '', 'wands: destroy() removes only its own property (the page\'s --stp-wand stays)', `--stp-wand "${(await prop(page)).slice(0, 30)}", link "${(await prop(page, '--stp-wand-link')).slice(0, 30)}"`);
  await ctx.close();
  ({ ctx, page } = await open('ownsheet.html'));
  const sheet = await page.evaluate(() => [getComputedStyle(document.documentElement).cursor, document.documentElement.style.getPropertyValue('--stp-wand')]);
  report(sheet[0] === 'crosshair' && sheet[1] === '', 'wands: a --stp-wand from the page\'s own stylesheet before start() is used, not overwritten', JSON.stringify(sheet).slice(0, 120));
  await ctx.close();

  // 13. destroy() gives back the page's own inline cursor; forced-colors mode keeps the system pointer
  ({ ctx, page } = await open('crosshair.html'));
  const mid = await page.evaluate(() => document.documentElement.style.cursor);
  const back = await page.evaluate(() => { SparkleThatPage.fairyCursor.destroy(); return document.documentElement.style.cursor; });
  report(mid.startsWith('var(--stp-wand') && back === 'crosshair', 'wands: destroy() restores the page\'s own inline cursor on <html> (crosshair)', `during "${mid}", after "${back}"`);
  await ctx.close();
  ({ ctx, page } = await open('plain.html', { forcedColors: 'active' }));
  const forced = await page.evaluate(() => ({ prop: document.documentElement.style.getPropertyValue('--stp-wand'), cls: document.documentElement.classList.contains('stp-wand'), cur: document.documentElement.style.cursor }));
  report(forced.prop === '' && !forced.cls && forced.cur === '', 'wands: in forced-colors mode the wand is a no-op (no image, no class, no cursor)', JSON.stringify(forced).slice(0, 120));
  await ctx.close();

  // 14. the docs, the demo and the site use the real family names: no franchise name, every family offered, crystal is crystal
  ({ ctx, page } = await open('light.html'));
  const fams = await page.evaluate(() => SparkleThatPage.fairyCursor.families);
  await ctx.close();
  await check('wands: SKILL.md and demo.html name no franchise ("sailor…" appears only in references/wands.md\'s compatibility note)', async () => {
    const hits = ['SKILL.md', 'examples/demo.html'].filter(f => /sailor/i.test(fs.readFileSync(path.join(SKILL, f), 'utf8')));
    return [hits.length === 0, hits.join(', ')];
  });
  await check('wands: the demo\'s wand picker offers all the families', async () => {
    const m = fs.readFileSync(path.join(SKILL, 'examples/demo.html'), 'utf8').match(/attr:\s*"wand",\s*variants:\s*\[([^\]]*)\]/);
    const offered = m ? [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]) : [];
    return [fams.every(f => offered.includes(f)) && offered.every(v => fams.includes(v)), `offered ${offered.join(' ')}`];
  });
  await check('wands: site/sparkle-bridge.js maps "crystal" to the crystal wand and every cursor variant to a real family (or the heart alias)', async () => {
    const m = fs.readFileSync(path.join(ROOT, 'site/sparkle-bridge.js'), 'utf8').match(/cursor:[\s\S]*?variants:\s*\{([^}]*)\}/);
    const map = m ? Object.fromEntries([...m[1].matchAll(/(\w+):\s*'([^']+)'/g)].map(x => [x[1], x[2]])) : {};
    return [map.crystal === 'crystal' && Object.values(map).every(v => fams.includes(v) || v === 'heart'), JSON.stringify(map)];  // heart: the old name, an alias of candy
  });
} finally {
  await browser.close();
  server.close();
  fs.rmSync(TMP, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
