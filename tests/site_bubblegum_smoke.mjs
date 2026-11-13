// Headless-browser smoke test for the Bubblegum landing page's collection section (site/bubblegum.html):
// four shelves (11 wands, 13 confetti, 12 floaters, 11 scroll friends) drawn by the real effect modules, each item a
// button that puts its design on the page, a "see all" link to each gallery, no sideways scroll at 375 px, and the
// page's own load-time effects (trail, confetti, scroll cat, tab) still start.
// Run: node tests/site_bubblegum_smoke.mjs
//   SITE_ROOT=/path points it at another copy of the repo (needs site/ and plugins/), to prove a check can fail.
// Prints one "PASS  name" / "FAIL  name" line per assertion. Exit 0 = all pass, 1 = a FAIL, 2 = Playwright or Chrome missing.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('playwright is not installed (run: npm install --prefix tests)'); process.exit(2); }

const ROOT = process.env.SITE_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8822;
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.md': 'text/markdown' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, path.normalize(decodeURIComponent(req.url.split('?')[0])));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
try { await new Promise((ok, no) => { server.once('error', no); server.listen(PORT, '127.0.0.1', ok); }); }
catch (e) { console.log('cannot listen on ' + PORT + ': ' + e.message); process.exit(2); }
const URL_ = `http://127.0.0.1:${PORT}/site/bubblegum.html`;

let failed = 0, browser;
const report = (ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? '  (' + detail + ')' : ''}`); };
const check = async (name, fn) => { try { const [ok, detail] = await fn(); report(ok, name, detail); } catch (e) { report(false, name, 'threw: ' + String(e.message || e).slice(0, 160)); } };
try { browser = await chromium.launch({ channel: 'chrome' }); }
catch { try { browser = await chromium.launch(); } catch { console.log('no Chrome / Chromium for Playwright'); server.close(); process.exit(2); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 812 : 800 } });
  const page = await ctx.newPage();
  page.__errors = [];
  page.on('pageerror', (e) => page.__errors.push(String(e.message || e)));
  page.__ctx = ctx;
  await page.goto(URL_);
  await page.waitForFunction(() => document.querySelectorAll('.bg-item').length >= 47, null, { timeout: 8000 }).catch(() => {});
  await sleep(400);
  return page;
}
const SH = (k) => `[data-shelf="${k}"] .bg-item`;
// drawn pixels in a canvas: count of non-transparent pixels
const COUNT = `(c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; }`;
const pressed = (page, sel) => page.$$eval(sel, (bs) => bs.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.getAttribute('aria-label')));

try {
  let page = await open(1280);

  await check('shelves hold 11 wands, 13 confetti, 12 floaters and 11 scroll friends', async () => {
    const n = {};
    for (const k of ['wands', 'confetti', 'floaters', 'scroll']) n[k] = await page.$$eval(SH(k), (b) => b.length);
    return [n.wands === 11 && n.confetti === 13 && n.floaters === 12 && n.scroll === 11, JSON.stringify(n)];
  });
  await check('every item is a real <button> with an aria-label and an aria-pressed value', () => page.$$eval('.bg-item', (bs) => {
    const bad = bs.filter((b) => b.tagName !== 'BUTTON' || !b.getAttribute('aria-label') || !/^(true|false)$/.test(b.getAttribute('aria-pressed')));
    return [bs.length === 47 && !bad.length, bad.length + ' bad of ' + bs.length];
  }));
  await check('each shelf heading shows its count and a see-all link', () => page.$$eval('.bg-shelf-head', (hs) => {
    const want = [['Wands', 11], ['Confetti', 13], ['Floaters', 12], ['Scroll friends', 11]];
    const got = hs.map((h) => [h.querySelector('h3').firstChild.textContent, +h.querySelector('h3 span').textContent, h.querySelector('a').textContent]);
    const ok = want.every((w, i) => got[i] && got[i][0] === w[0] && got[i][1] === w[1] && got[i][2].includes('see all ' + w[1]));
    return [ok, JSON.stringify(got)];
  }));
  await check('every wand and scroll picture is a non-empty svg with shapes in it', () => page.evaluate(() => {
    const bad = [...document.querySelectorAll('[data-shelf="wands"] .pic, [data-shelf="scroll"] .pic')].filter((p) => { const s = p.querySelector('svg'); return !s || s.querySelectorAll('*').length < 2 || !s.getBoundingClientRect().width; });
    return [!bad.length, bad.length + ' empty'];
  }));
  await check('every confetti and floaters picture has drawn pixels (floor 20, a blank canvas is 0)', async () => {
    const r = await page.$$eval('[data-shelf="confetti"] canvas, [data-shelf="floaters"] canvas', (cs, src) => { const f = eval(src); return cs.map((c) => f(c)); }, COUNT);
    const low = r.filter((n) => n < 20);
    return [r.length === 25 && !low.length, `${r.length} canvases, lowest ${Math.min(...r)}`];
  });

  await check('wand click: <html data-wand> follows, aria-pressed moves to that wand only', async () => {
    const b = (await page.$$(SH('wands')))[4]; const label = await b.getAttribute('aria-label');
    const fam = label.replace('Wand: ', '').split(',')[0];
    await b.click(); await sleep(500);
    const w = await page.evaluate(() => document.documentElement.dataset.wand);
    const pr = await pressed(page, SH('wands'));
    return [w === fam && pr.length === 1 && pr[0] === label, `data-wand=${w} want ${fam}, pressed ${JSON.stringify(pr)}`];
  });
  await check('wand click: the wand is now the cursor (html.stp-wand and a --stp-wand image)', () => page.evaluate(() => {
    const r = document.documentElement, v = r.style.getPropertyValue('--stp-wand');
    return [r.classList.contains('stp-wand') && /url\(/.test(v), 'class ' + r.classList.contains('stp-wand') + ' var ' + v.slice(0, 30)];
  }));
  await check('floaters click: <html data-floaters> follows and the floaters layer appears', async () => {
    const b = (await page.$$(SH('floaters')))[7]; const label = await b.getAttribute('aria-label');
    const fam = label.replace('Floaters: ', '');
    await b.click(); await sleep(600);
    const r = await page.evaluate(() => ({ d: document.documentElement.dataset.floaters, cv: document.querySelectorAll('canvas.stp-floaters').length }));
    const pr = await pressed(page, SH('floaters'));
    return [r.d === fam && r.cv === 1 && pr.length === 1 && pr[0] === label, JSON.stringify(r) + ' want ' + fam + ' pressed ' + JSON.stringify(pr)];
  });
  await check('scroll click on a climber (bunny): data-scroll=mascot, data-scroll-mascot=bunny, only bunny pressed', async () => {
    const b = page.locator(SH('scroll') + '[aria-label="Scroll friend: bunny"]'); await b.click(); await sleep(500);
    const r = await page.evaluate(() => ({ s: document.documentElement.dataset.scroll, m: document.documentElement.dataset.scrollMascot }));
    const pr = await pressed(page, SH('scroll'));
    return [r.s === 'mascot' && r.m === 'bunny' && pr.length === 1 && pr[0] === 'Scroll friend: bunny', JSON.stringify(r) + JSON.stringify(pr)];
  });
  await check('scroll click on a non-climber (rocket): data-scroll=rocket and the climber name is cleared', async () => {
    await page.locator(SH('scroll') + '[aria-label="Scroll friend: rocket"]').click(); await sleep(500);
    const r = await page.evaluate(() => ({ s: document.documentElement.dataset.scroll, m: document.documentElement.dataset.scrollMascot || null }));
    return [r.s === 'rocket' && r.m === null, JSON.stringify(r)];
  });
  await check('confetti click: becomes the page confetti and fires pieces at once', async () => {
    const b = page.locator(SH('confetti') + '[aria-label^="Confetti: heart"]');
    await b.scrollIntoViewIfNeeded();
    await b.click(); 
    let n = 0;
    for (let i = 0; i < 12 && n < 5; i++) { await sleep(120); n = await page.evaluate(`(() => { const c = document.querySelector('canvas.stp-confetti'); return c ? (${COUNT})(c) : -1; })()`); }
    const r = await page.evaluate(() => ({ d: document.documentElement.dataset.confetti, live: !!(window.SparkleThatPage.clickConfetti && window.SparkleThatPage.clickConfetti.active()) }));
    const pr = await pressed(page, SH('confetti'));
    return [r.d === 'heart' && r.live && n >= 5 && pr.length === 1 && /heart/.test(pr[0]), JSON.stringify(r) + ` pixels ${n} pressed ${JSON.stringify(pr)}`];
  });
  await check('tapping the pressed wand again turns the wand cursor off and unpresses it', async () => {
    const b = (await page.$$(SH('wands')))[4];
    if (await b.getAttribute('aria-pressed') !== 'true') { await b.click(); await sleep(400); }
    const on = await page.evaluate(() => document.documentElement.classList.contains('stp-wand'));
    await b.click(); await sleep(400);
    const off = await page.evaluate(() => document.documentElement.classList.contains('stp-wand'));
    const pr = await pressed(page, SH('wands'));
    return [on && !off && pr.length === 0, `on ${on} off ${off} pressed ${JSON.stringify(pr)}`];
  });
  await check('tapping the pressed floaters again removes the floaters layer and unpresses it', async () => {
    const b = (await page.$$(SH('floaters')))[7];
    const n0 = await page.evaluate(() => document.querySelectorAll('canvas.stp-floaters').length);
    if (!n0) { await b.click(); await sleep(500); }
    const on = await page.evaluate(() => document.querySelectorAll('canvas.stp-floaters').length);
    await b.click(); await sleep(400);
    const off = await page.evaluate(() => document.querySelectorAll('canvas.stp-floaters').length);
    const pr = await pressed(page, SH('floaters'));
    return [on === 1 && off === 0 && pr.length === 0, `on ${on} off ${off} pressed ${JSON.stringify(pr)}`];
  });
  await check('confetti shelf pictures and the page burst use the same candy colours (no green leaves)', async () => {
    const tally = `(c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let g = 0, pk = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 200) continue; if (d[i + 1] > d[i] + 25 && d[i + 1] > d[i + 2] + 25) g++; else if (d[i] > 180 && d[i + 2] > 120) pk++; } return { g, pk }; }`;
    const b = page.locator(SH('confetti') + '[aria-label^="Confetti: leaf"]');
    await b.scrollIntoViewIfNeeded();
    const pic = await b.locator('canvas').evaluate((c, src) => eval(src)(c), tally);
    await b.click(); await sleep(250);
    const live = await page.evaluate(`(() => { const c = document.querySelector('canvas.stp-confetti'); return c ? (${tally})(c) : null; })()`);
    return [pic.g === 0 && pic.pk > 5 && live && live.g === 0 && live.pk > 5, JSON.stringify({ pic, live })];
  });
  await check('reduced motion: picking a floater does not mark it pressed (nothing is running)', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto(URL_);
    await p.waitForFunction(() => document.querySelectorAll('.bg-item').length >= 47, null, { timeout: 8000 }).catch(() => {});
    await sleep(300);
    const b = p.locator(SH('floaters') + '[aria-label="Floaters: sakura"]');
    await b.scrollIntoViewIfNeeded(); await b.click(); await sleep(600);
    const r = await p.evaluate(() => ({ cv: document.querySelectorAll('canvas.stp-floaters').length }));
    const pr = await pressed(p, SH('floaters'));
    await ctx.close();
    return [r.cv === 0 && pr.length === 0, JSON.stringify(r) + JSON.stringify(pr)];
  });
  await check('resize: the confetti and floaters pictures are redrawn at their new width (no stretching)', async () => {
    const p = await open(1280);
    await p.setViewportSize({ width: 700, height: 800 }); await sleep(600);
    const bad = await p.$$eval('[data-shelf="confetti"] canvas, [data-shelf="floaters"] canvas', (cs) => cs.filter((c) => Math.abs(c.width / (Math.min(devicePixelRatio || 1, 2)) - c.clientWidth) > 2).length);
    await p.__ctx.close();
    return [bad === 0, bad + ' canvases whose bitmap width does not match their box'];
  });
  await check('wand pictures are drawn big enough (52 px wide)', () => page.$$eval(SH('wands') + ' .pic svg', (ss) => { const w = Math.min(...ss.map((s) => s.getBoundingClientRect().width)); return [w >= 48, 'narrowest ' + w]; }));
  await check('keyboard: a shelf item takes focus and Enter picks it', async () => {
    const b = page.locator(SH('floaters') + '[aria-label="Floaters: hearts"]'); await b.focus(); await page.keyboard.press('Enter'); await sleep(500);
    const d = await page.evaluate(() => document.documentElement.dataset.floaters);
    return [d === 'hearts', d];
  });
  await check('every gallery link points at a file that exists on disk', async () => {
    const hrefs = await page.$$eval('.bg-shelf-head a', (as) => as.map((a) => a.href));
    const want = ['wands.html', 'confetti.html', 'floaters.html', 'scroll.html'];
    const res = hrefs.map((h) => { const p = path.join(ROOT, decodeURIComponent(new URL(h).pathname)); return [path.basename(p), fs.existsSync(p) && p.includes('sparkle-that-page/examples/')]; });
    return [res.length === 4 && want.every((w, i) => res[i][0] === w && res[i][1]), JSON.stringify(res)];
  });
  await check('load-time effects still start: trail, confetti, scroll cat, tab', async () => {
    const p2 = await open(1280);
    const r = await p2.evaluate(() => { const S = window.SparkleThatPage || {}, d = document.documentElement.dataset; return { trail: !!S.sparkleTrail && d.trail === 'sparkle', confetti: !!S.clickConfetti && d.confetti === 'confetti', scroll: !!S.scrollIndicator && d.scroll === 'mascot' && d.scrollMascot === 'cat', tab: !!S.tabPeekaboo }; });
    const pr = { c: await pressed(p2, SH('confetti')), s: await pressed(p2, SH('scroll')) };
    await p2.__ctx.close();
    return [r.trail && r.confetti && r.scroll && r.tab && pr.c.length === 1 && /confetti/.test(pr.c[0]) && pr.s.length === 1 && /cat/.test(pr.s[0]), JSON.stringify(r) + JSON.stringify(pr)];
  });
  await check('no page errors at 1280', async () => [page.__errors.length === 0, page.__errors.join(' | ')]);
  await page.__ctx.close();

  page = await open(375);
  await check('375 px wide: no sideways scroll on the page, no shelf overflows its own box', () => page.evaluate(() => {
    const de = document.documentElement, over = [...document.querySelectorAll('.bg-shelf')].filter((s) => s.scrollWidth > s.clientWidth + 1).length;
    return [de.scrollWidth <= innerWidth && document.body.scrollWidth <= innerWidth && !over, `doc ${de.scrollWidth}/${innerWidth}, shelves over ${over}`];
  }));
  await check('375 px wide: the shelves are all there and every item stays inside the window', () => page.evaluate(() => {
    const bs = [...document.querySelectorAll('.bg-item')], out = bs.filter((b) => { const r = b.getBoundingClientRect(); return r.right > innerWidth + 0.5 || r.left < -0.5; });
    return [bs.length === 47 && !out.length, bs.length + ' items, ' + out.length + ' outside'];
  }));
  await check('no page errors at 375', async () => [page.__errors.length === 0, page.__errors.join(' | ')]);
  await page.__ctx.close();
} finally {
  await browser.close(); server.close();
}
process.exit(failed ? 1 : 0);
