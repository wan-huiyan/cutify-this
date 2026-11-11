// Headless-browser smoke test for the sparkle-that-page wand gallery (examples/wands.html): a card for every family ×
// palette fairy_cursor.js exposes, every picture drawn by SparkleThatPage.fairyCursor.svg (not copied), every image loads,
// hover or keyboard focus makes that wand the real <html> cursor, the page's dark toggle redraws the cards and the cursor,
// the copy-paste attributes are right and copyable, it works from file:// and http, has no console errors, no horizontal
// scroll at 375 px, a visible keyboard focus ring, no motion under prefers-reduced-motion, no off-site requests,
// the no-mouse hint on a touch device, the dark toggle remembered across a reload, and demo.html links to it.
// Run: node tests/sparkle_wands_gallery_smoke.mjs   (GALLERY_DIR=/path/to/copy points it at another copy of the examples
// folder, to prove a check can fail)
// Prints one "PASS name" / "FAIL name" line per assertion. Exit 0 = all pass, 1 = a FAIL, 2 = Playwright or Chrome missing.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('playwright is not installed (run: npm install --prefix tests)'); process.exit(2); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.resolve(process.env.GALLERY_DIR || path.join(ROOT, 'plugins/sparkle-that-page/skills/sparkle-that-page/examples'));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const file = path.join(DIR, path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(DIR) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
const URL_HTTP = ORIGIN + '/wands.html', URL_FILE = pathToFileURL(path.join(DIR, 'wands.html')).href;

let failed = 0, browser;
const report = (ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? '  (' + String(detail).slice(0, 300) + ')' : ''}`); };
const check = async (name, fn) => { try { const r = await fn(); report(r === true || (Array.isArray(r) && r[0]), name, Array.isArray(r) ? r[1] : r); } catch (e) { report(false, name, 'threw: ' + e.message.split('\n')[0]); } };
try { browser = await chromium.launch({ channel: 'chrome' }); }
catch { try { browser = await chromium.launch(); } catch { console.log('no Chrome / Chromium for Playwright'); server.close(); process.exit(2); } }

const problems = [], offsite = [];   // console errors, page errors, failed or 4xx requests, and requests that left the origin
function watch(page, tag) {
  page.on('console', m => { if (m.type() === 'error') problems.push(`${tag} console: ${m.text()}`); });
  page.on('pageerror', e => problems.push(`${tag} pageerror: ${e.message}`));
  page.on('requestfailed', r => problems.push(`${tag} requestfailed: ${r.url().slice(0, 80)}`));
  page.on('response', r => { if (r.status() >= 400) problems.push(`${tag} ${r.status()}: ${r.url().slice(0, 80)}`); });
  page.on('request', r => { const u = r.url(); if (!/^(data:|blob:|about:)/.test(u) && !u.startsWith(ORIGIN) && !u.startsWith('file://')) offsite.push(u); });
}
async function open(opts, url = URL_HTTP, tag = 'http') {
  const ctx = await browser.newContext(opts), page = await ctx.newPage();
  watch(page, tag); await page.goto(url);
  await page.waitForSelector('[data-family][data-palette]', { timeout: 5000 }).catch(() => {});
  return { ctx, page };
}
// what the cursor looks like right now, as the SVG source it was built from
const cursorSvg = page => page.evaluate(() => {
  const c = getComputedStyle(document.documentElement).cursor, a = c.indexOf('url("'), b = c.lastIndexOf('")');
  return a < 0 || b < 0 ? c : decodeURIComponent(c.slice(a + 5, b).replace(/^data:image\/svg\+xml,/, ''));
});
const wants = (page, f, p, dark, on = false) => page.evaluate(([f, p, d, o]) => SparkleThatPage.fairyCursor.svg(f, p, d, o), [f, p, dark, on]);
async function wearing(page, f, p, dark) {   // wait for the repaint (it runs in a mutation observer), then compare
  const want = await wants(page, f, p, dark);
  for (let i = 0; i < 40; i++) { if (await cursorSvg(page) === want) return true; await page.waitForTimeout(50); }
  return false;
}

const { ctx: mainCtx, page } = await open({ viewport: { width: 1280, height: 900 }, colorScheme: 'light', permissions: ['clipboard-read', 'clipboard-write'] });
const ex = await page.evaluate(() => { const A = window.SparkleThatPage && SparkleThatPage.fairyCursor; return A ? { fam: A.families, pal: A.palettes } : null; });
if (!ex) { report(false, 'fairy_cursor.js loads on the gallery page', 'SparkleThatPage.fairyCursor is missing'); await browser.close(); server.close(); process.exit(1); }
const pairs = ex.fam.flatMap(f => ex.pal[f].map(p => [f, p]));

await check(`a card exists for every family × palette (${pairs.length}), each once`, async () => {
  const have = await page.$$eval('[data-family][data-palette]', ns => ns.map(n => n.dataset.family + '/' + n.dataset.palette));
  const want = pairs.map(([f, p]) => f + '/' + p), missing = want.filter(k => !have.includes(k));
  return [!missing.length && have.length === want.length, `missing ${missing.join(',')}; ${have.length} cards for ${want.length} pairs`];
});

await check('every picture is exactly what fairyCursor.svg() returns (4 renders on the swatches, 2 on the stage)', () => page.evaluate(() => {
  const A = SparkleThatPage.fairyCursor, dec = s => decodeURIComponent((s || '').replace(/^data:image\/svg\+xml,/, '')), bad = [];
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.querySelectorAll('[data-family][data-palette]').forEach(c => {
    const f = c.dataset.family, p = c.dataset.palette, imgs = [...c.querySelectorAll('img')];
    if (imgs.length !== 6) bad.push(`${f}/${p}: ${imgs.length} images`);
    const seen = new Set();
    imgs.forEach(im => {
      const d = im.dataset.dark === 'page' ? dark : im.dataset.dark === '1', on = im.dataset.on === '1';
      seen.add(im.dataset.dark + im.dataset.on);
      if (dec(im.getAttribute('src')) !== A.svg(f, p, d, on)) bad.push(`${f}/${p} ${im.dataset.dark}${im.dataset.on} differs`);
    });
    if (seen.size !== 6) bad.push(`${f}/${p}: renders are not light/dark/page × plain/glow`);
  });
  return [!bad.length, bad.slice(0, 4).join('; ')];
}));

await check('the page draws no SVG of its own: no <svg or viewBox= literal in wands.html', () => {
  // the emoji favicon in <link rel="icon"> is the one allowed SVG
  const t = fs.readFileSync(path.join(DIR, 'wands.html'), 'utf8').replace(/<link rel="icon"[^>]*>/g, ''), hits = t.match(/<svg|viewBox\s*=/gi) || [];
  return [!hits.length, `${hits.length} literal(s) found`];
});

await check('every image loads (complete, naturalWidth > 0)', () => page.evaluate(async PAIRS => {
  const imgs = [...document.images]; await Promise.all(imgs.map(i => i.decode().catch(() => {})));
  const bad = imgs.filter(i => !i.complete || i.naturalWidth === 0);
  return [imgs.length >= PAIRS * 6 && !bad.length, `${bad.length} of ${imgs.length} images broken, ${imgs.length} images for ${PAIRS} cards`];
}, pairs.length));

await check('each card shows its family, a one-line brief and the exact copy-paste attributes', () => page.evaluate(() => {
  const bad = [];
  document.querySelectorAll('[data-family][data-palette]').forEach(c => {
    const f = c.dataset.family, p = c.dataset.palette, sec = c.closest('section'), brief = sec && sec.querySelector('p');
    const want = `<html data-wand="${f}" data-wand-palette="${p}">`;
    if (!sec || !sec.textContent.includes(f)) bad.push(`${f}: no family heading`);
    if (!brief || brief.textContent.trim().length < 15) bad.push(`${f}: no brief`);
    if (![...c.querySelectorAll('code')].some(k => k.textContent === want)) bad.push(`${f}/${p}: attributes`);
  });
  return [!bad.length, bad.slice(0, 4).join('; ')];
}));

await check('hovering a card makes that wand the <html> cursor (all cards)', async () => {
  await page.mouse.move(2, 2); const bad = [];
  for (const [f, p] of pairs) {
    await page.locator(`[data-family="${f}"][data-palette="${p}"]`).hover();
    if (!await wearing(page, f, p, false)) bad.push(f + '/' + p);
  }
  return [!bad.length, 'cursor did not follow: ' + bad.slice(0, 5).join(',')];
});

await check('the hovered card is the only one marked as worn', async () => {
  const [f, p] = pairs[7]; await page.locator(`[data-family="${f}"][data-palette="${p}"]`).hover();
  const n = await page.$$eval('.is-worn', ns => ns.map(n => n.dataset.family + '/' + n.dataset.palette));
  return [n.length === 1 && n[0] === f + '/' + p, JSON.stringify(n)];
});

await check('a button inside a card shows the glowing twin of the worn wand, plain text shows the plain wand', async () => {
  const [f, p] = pairs[13]; const card = page.locator(`[data-family="${f}"][data-palette="${p}"]`);
  await card.hover(); await wearing(page, f, p, false);
  const svgOf = sel => card.locator(sel).evaluate(e => { const c = getComputedStyle(e).cursor, a = c.indexOf('url("'), b = c.lastIndexOf('")'); return a < 0 ? c : decodeURIComponent(c.slice(a + 5, b).replace(/^data:image\/svg\+xml,/, '')); });
  const twin = await svgOf('.copy'), plain = await svgOf('h3');
  return [twin === await wants(page, f, p, false, true) && plain === await wants(page, f, p, false, false), 'button twin ' + (twin === await wants(page, f, p, false, true)) + ', text plain ' + (plain === await wants(page, f, p, false, false))];
});

await check('keyboard focus on a card makes that wand the cursor', async () => {
  await page.mouse.move(2, 2);
  const [f, p] = pairs[pairs.length - 2]; await page.locator(`[data-family="${f}"][data-palette="${p}"]`).focus();
  return [await wearing(page, f, p, false), 'focus did not change the cursor'];
});

await check('the keyboard reaches a card and shows a visible focus ring', async () => {
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
  let ring = null;
  for (let i = 0; i < 12 && !ring; i++) {
    await page.keyboard.press('Tab');
    ring = await page.evaluate(() => { const a = document.activeElement; if (!a || !a.matches('[data-family]')) return null; const s = getComputedStyle(a); return { w: parseFloat(s.outlineWidth), st: s.outlineStyle }; });
  }
  return [!!ring && ring.w >= 2 && ring.st !== 'none', JSON.stringify(ring)];
});

await check('the dark toggle is a real button, works from the keyboard, and flips <html data-theme>', async () => {
  const btn = page.getByRole('button', { name: /dark page/i });
  await btn.focus(); const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.keyboard.press('Space');
  const after = await page.evaluate(() => [document.documentElement.dataset.theme, document.querySelector('#theme').getAttribute('aria-pressed')]);
  await page.keyboard.press('Space');
  const back = await page.evaluate(() => document.documentElement.dataset.theme);
  return [before === 'light' && after[0] === 'dark' && after[1] === 'true' && back === 'light', `${before} -> ${after} -> ${back}`];
});

await check('toggling the page to dark redraws the page-following renders in the dark variant (swatches stay put)', async () => {
  await page.getByRole('button', { name: /dark page/i }).click();
  const r = await page.evaluate(() => {
    const A = SparkleThatPage.fairyCursor, dec = s => decodeURIComponent(s.replace(/^data:image\/svg\+xml,/, '')), bad = [];
    document.querySelectorAll('[data-family][data-palette]').forEach(c => c.querySelectorAll('img').forEach(im => {
      const f = c.dataset.family, p = c.dataset.palette, on = im.dataset.on === '1', d = im.dataset.dark === 'page' ? true : im.dataset.dark === '1';
      if (dec(im.getAttribute('src')) !== A.svg(f, p, d, on)) bad.push(`${f}/${p}/${im.dataset.dark}${on ? 1 : 0}`);
    }));
    return { bad, theme: document.documentElement.dataset.theme, pageImgs: document.querySelectorAll('img[data-dark="page"]').length };
  });
  return [r.theme === 'dark' && r.pageImgs === pairs.length * 2 && !r.bad.length, `${r.theme}, ${r.pageImgs} page imgs, bad ${r.bad.slice(0, 4)}`];
});

await check('on a dark page the worn wand is the dark variant, and its card follows when the next is hovered', async () => {
  const [f, p] = pairs[3]; await page.locator(`[data-family="${f}"][data-palette="${p}"]`).hover();
  const [f2, p2] = pairs[20]; await page.locator(`[data-family="${f2}"][data-palette="${p2}"]`).hover();
  return [await wearing(page, f2, p2, true), 'cursor is not the dark ' + f2 + '/' + p2];
});

await check('toggling back to light restores the light variants and the cursor repaints', async () => {
  await page.getByRole('button', { name: /dark page/i }).click();
  const [f, p] = await page.evaluate(() => [document.documentElement.dataset.wand, document.documentElement.dataset.wandPalette]);
  const ok = await wearing(page, f, p, false);
  const img = await page.evaluate(() => { const i = document.querySelector('img[data-dark="page"]'), A = SparkleThatPage.fairyCursor; const c = i.closest('[data-family]'); return decodeURIComponent(i.getAttribute('src').replace(/^data:image\/svg\+xml,/, '')) === A.svg(c.dataset.family, c.dataset.palette, false, i.dataset.on === '1'); });
  return [ok && img, `cursor ${ok}, stage ${img}`];
});

await check('Copy puts the attributes on the clipboard', async () => {
  const [f, p] = pairs[5]; const card = page.locator(`[data-family="${f}"][data-palette="${p}"]`);
  await card.locator('.copy').click();
  const got = await page.evaluate(() => navigator.clipboard.readText());
  return [got === `<html data-wand="${f}" data-wand-palette="${p}">`, JSON.stringify(got)];
});

await check('no horizontal scroll at 1280 px', async () => [await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'scrollWidth > innerWidth']);

await check('no console errors, page errors, failed or 4xx requests across load, hover, focus, toggle and copy', () => [!problems.length, problems.slice(0, 3).join(' | ')]);
await mainCtx.close();

for (const scheme of ['light', 'dark']) {
  await check(`375 px wide, ${scheme} system scheme: all cards present, no horizontal scroll, page opens in ${scheme}`, async () => {
    const { ctx, page: m } = await open({ viewport: { width: 375, height: 800 }, colorScheme: scheme }, URL_HTTP, '375');
    const r = await m.evaluate(() => ({ w: document.documentElement.scrollWidth, iw: innerWidth, n: document.querySelectorAll('[data-family][data-palette]').length, t: document.documentElement.dataset.theme,
      stage: document.querySelector('img[data-dark="page"]').getAttribute('src') }));
    const want = await wants(m, pairs[0][0], pairs[0][1], scheme === 'dark');
    await ctx.close();
    return [r.w <= r.iw && r.n === pairs.length && r.t === scheme && decodeURIComponent(r.stage.replace(/^data:image\/svg\+xml,/, '')) === want, JSON.stringify({ w: r.w, iw: r.iw, n: r.n, t: r.t })];
  });
}

await check('375 px wide after the dark toggle: still no horizontal scroll', async () => {
  const { ctx, page: m } = await open({ viewport: { width: 375, height: 800 }, colorScheme: 'light' }, URL_HTTP, '375t');
  await m.getByRole('button', { name: /dark page/i }).click();
  const w = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); await ctx.close();
  return [w[0] <= w[1], w.join(' > ')];
});

await check('works from file:// (cards, images and cursor wiring, no errors)', async () => {
  const before = problems.length, { ctx, page: f } = await open({ viewport: { width: 1280, height: 900 } }, URL_FILE, 'file');
  const n = await f.$$eval('[data-family][data-palette]', ns => ns.length);
  const [fam, pal] = pairs[4]; await f.locator(`[data-family="${fam}"][data-palette="${pal}"]`).hover();
  const worn = await wearing(f, fam, pal, false);
  const broken = await f.evaluate(() => [...document.images].filter(i => !i.complete || !i.naturalWidth).length);
  await ctx.close();
  return [n === pairs.length && worn && broken === 0 && problems.length === before, `${n} cards, worn ${worn}, ${broken} broken, new problems ${problems.slice(before).join(' | ')}`];
});

await check('prefers-reduced-motion: no transition or animation runs anywhere (and there are some when motion is allowed)', async () => {
  const probe = () => `(() => { let t = 0, a = 0; for (const e of document.querySelectorAll('*')) { const s = getComputedStyle(e); if (s.transitionDuration.split(',').some(x => parseFloat(x) > 0)) t++; if (s.animationName !== 'none') a++; } return [t, a, matchMedia('(prefers-reduced-motion: reduce)').matches]; })()`;
  const { ctx: c1, page: p1 } = await open({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' }, URL_HTTP, 'motion');
  const on = await p1.evaluate(probe()); await c1.close();
  const { ctx: c2, page: p2 } = await open({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }, URL_HTTP, 'reduced');
  const off = await p2.evaluate(probe()); await c2.close();
  return [on[0] + on[1] > 0 && off[2] && off[0] + off[1] === 0, `allowed: ${on.slice(0, 2)}, reduced: ${off}`];
});

await check('no off-site requests and no <script src> that leaves the folder', async () => {
  const { ctx, page: p } = await open({ viewport: { width: 1280, height: 900 } });
  const srcs = await p.$$eval('script[src], link[href]', ns => ns.map(n => n.getAttribute('src') || n.getAttribute('href')).filter(u => !u.startsWith('data:')));
  await ctx.close();
  const bad = srcs.filter(u => /^(https?:)?\/\//.test(u) || u.startsWith('/') || u.includes('..'));
  return [!offsite.length && !bad.length, `requests ${offsite.slice(0, 2)}, srcs ${bad}`];
});

await check('on a touch device (no fine pointer) the page shows the "no mouse pointer" hint; with a mouse it stays hidden', async () => {
  const { ctx: c1, page: fine } = await open({ viewport: { width: 1280, height: 900 } }, URL_HTTP, 'hint-fine');
  const fineHidden = await fine.evaluate(() => { const h = document.getElementById('hint'); return h.hidden && getComputedStyle(h).display === 'none'; }); await c1.close();
  const { ctx: c2, page: touch } = await open({ viewport: { width: 375, height: 800 }, hasTouch: true, isMobile: true }, URL_HTTP, 'hint-touch');
  const t = await touch.evaluate(() => { const h = document.getElementById('hint'), r = h.getBoundingClientRect(); return { coarse: !matchMedia('(pointer: fine)').matches, hidden: h.hidden, shown: r.width > 0 && r.height > 0, text: h.textContent, cards: document.querySelectorAll('[data-family][data-palette]').length }; });
  await c2.close();
  return [fineHidden && t.coarse && !t.hidden && t.shown && /no mouse pointer/i.test(t.text) && t.cards === pairs.length, JSON.stringify({ fineHidden, ...t })];
});

await check('the dark toggle is remembered: a choice made on a light system survives a reload, and so does light chosen on a dark system', async () => {
  const out = [];
  for (const [sys, pick] of [['light', 'dark'], ['dark', 'light']]) {
    const { ctx, page: m } = await open({ viewport: { width: 1280, height: 900 }, colorScheme: sys }, URL_HTTP, 'persist-' + sys);
    const start = await m.evaluate(() => document.documentElement.dataset.theme);
    await m.getByRole('button', { name: /dark page/i }).click();
    const stored = await m.evaluate(() => { try { return localStorage.getItem('stp:theme'); } catch (e) { return 'threw'; } });
    await m.reload(); await m.waitForSelector('[data-family][data-palette]');
    const after = await m.evaluate(() => [document.documentElement.dataset.theme, document.getElementById('theme').getAttribute('aria-pressed')]);
    await ctx.close();
    out.push({ sys, start, pick, stored, after });
  }
  return [out.every(o => o.start === o.sys && o.stored === o.pick && o.after[0] === o.pick && o.after[1] === String(o.pick === 'dark')), JSON.stringify(out)];
});

await check('demo.html has a "See every wand" link that reaches wands.html', async () => {
  const { ctx, page: d } = await open({ viewport: { width: 1280, height: 900 } }, ORIGIN + '/demo.html', 'demo');
  await d.waitForSelector('#controls .ctl', { timeout: 3000 }).catch(() => {});
  const links = await d.$$eval('a[href]', ns => ns.filter(n => /wands\.html$/.test(n.getAttribute('href'))).map(n => ({ href: n.href, text: n.textContent.trim(), near: !!n.closest('#panel') })));
  const status = links.length ? (await d.request.get(links[0].href)).status() : 0;
  await ctx.close();
  return [links.length === 1 && /see every wand/i.test(links[0].text) && links[0].near && status === 200, JSON.stringify(links) + ' status ' + status];
});

await check('no console errors, page errors, failed or 4xx requests on ANY page the test opened (1280, 375, file://, reduced motion, demo.html)', () => [!problems.length, problems.slice(0, 3).join(' | ')]);

await browser.close(); server.close();
process.exit(failed ? 1 : 0);
