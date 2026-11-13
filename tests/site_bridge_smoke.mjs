// Headless-browser test for site/sparkle-bridge.js under quick, repeated clicks — the case the landing pages' picture
// shelves make easy: a double-click on a confetti picture, five quick picks on every shelf, and an effect switched on and
// off while its pictures are still loading. Each must leave exactly one copy of the effect running (or none, once
// stopped): one confetti canvas that fires once per click, one floaters layer, one scroll companion, no stuck wand.
// Run: node tests/site_bridge_smoke.mjs
//   BRIDGE_JS=/path/to/copy.js serves another copy of the bridge, SITE_ROOT=/path another copy of the repo,
//   to prove a check can fail.
// Prints one "PASS  name" / "FAIL  name" line per assertion. Exit 0 = all pass, 1 = a FAIL, 2 = Playwright or Chrome missing.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('playwright is not installed (run: npm install --prefix tests)'); process.exit(2); }

const ROOT = process.env.SITE_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRIDGE = process.env.BRIDGE_JS || path.join(ROOT, 'site/sparkle-bridge.js');
const PORT = 8824;
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = url === '/site/sparkle-bridge.js' ? BRIDGE : path.join(ROOT, path.normalize(url));
  if (!file.startsWith(ROOT) && file !== BRIDGE) { res.writeHead(404); return res.end('not found'); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r, j) => { server.on('error', j); server.listen(PORT, '127.0.0.1', r); }).catch((e) => { console.log('cannot listen on ' + PORT + ': ' + e.message); process.exit(2); });
const BASE = `http://127.0.0.1:${PORT}`;

let failed = 0, browser;
const report = (ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? '  (' + detail + ')' : ''}`); };
const check = async (name, fn) => { try { const [ok, detail] = await fn(); report(ok, name, detail); } catch (e) { report(false, name, 'threw: ' + String(e.message || e).slice(0, 200)); } };
try { browser = await chromium.launch({ channel: 'chrome' }); }
catch { try { browser = await chromium.launch(); } catch { console.log('no Chrome / Chromium for Playwright'); server.close(); process.exit(2); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// what is running right now: copies of each effect's element, and the bridge's live wand
const COUNT = () => ({
  confetti: document.querySelectorAll('canvas.stp-confetti').length,
  floaters: document.querySelectorAll('canvas.stp-floaters').length,
  scroll: document.querySelectorAll('[data-stp-scroll]').length,
  wand: document.documentElement.classList.contains('stp-wand'),
});
// how many confetti canvases have something drawn on them
const PAINTED = () => [...document.querySelectorAll('canvas.stp-confetti')].filter((c) => {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < d.length; i += 16) if (d[i]) return true;
  return false;
}).length;

const PAGES = {
  aurora: { url: '/site/aurora.html', item: '.au-item', shelf: (k) => `[data-shelf="${k}"] .au-item`, keys: { wands: 'cursor', confetti: 'confetti', floaters: 'floaters', scroll: 'scroll' } },
  bubblegum: { url: '/site/bubblegum.html', item: '.bg-item', shelf: (k) => `[data-shelf="${k}"] .bg-item`, keys: { wands: 'wands', confetti: 'confetti', floaters: 'floaters', scroll: 'scroll' } },
};

try {
  for (const [name, P] of Object.entries(PAGES)) {
    const open = async () => {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      page.__errors = [];
      page.on('pageerror', (e) => page.__errors.push(e.message));
      await page.goto(BASE + P.url, { waitUntil: 'load' });
      await page.waitForFunction((sel) => document.querySelectorAll(sel).length >= 40 && window.SparkleThatPage && window.SparkleThatPage.clickConfetti, P.item, { timeout: 15000 });
      await sleep(600);
      page.__ctx = ctx;
      return page;
    };

    let page = await open();
    await check(`${name}: a double-click on a confetti picture leaves one confetti effect, and a later click fires once`, async () => {
      const item = page.locator(P.shelf(P.keys.confetti)).nth(3);
      await item.scrollIntoViewIfNeeded();
      await item.dblclick();
      await sleep(1500);   // both loads land and the burst finishes
      const n = await page.evaluate(COUNT);
      await sleep(2500);
      await page.mouse.click(640, 120);
      await sleep(250);
      const painted = await page.evaluate(PAINTED);
      return [n.confetti === 1 && painted === 1 && page.__errors.length === 0, `confetti canvases ${n.confetti}, painted by one click ${painted}, errors ${page.__errors.join(';')}`];
    });
    await page.__ctx.close();

    page = await open();
    await check(`${name}: five quick picks on every shelf leave one copy of each effect, showing the last pick`, async () => {
      // five different designs per shelf, clicked in one go (no waiting between clicks)
      for (const k of Object.values(P.keys)) {
        await page.evaluate((css) => { [...document.querySelectorAll(css)].slice(1, 6).forEach((b) => b.click()); }, P.shelf(k));
      }
      await sleep(2500);
      const n = await page.evaluate(COUNT);
      const scrollWant = await page.evaluate((css) => { const b = [...document.querySelectorAll(css)][5]; return b && (b.dataset.v || b.dataset.variant || b.getAttribute('aria-label')); }, P.shelf(P.keys.scroll));
      const ds = await page.evaluate(() => ({ ...document.documentElement.dataset }));
      // floaters may decline to run (reduced motion is off here, so it should run): one layer, never more
      return [n.confetti === 1 && n.floaters === 1 && n.scroll === 1 && page.__errors.length === 0,
        `confetti ${n.confetti}, floaters ${n.floaters}, scroll ${n.scroll}, last scroll pick ${scrollWant}, data-scroll ${ds.scroll}/${ds.scrollMascot || '-'}, errors ${page.__errors.join(';')}`];
    });
    await page.__ctx.close();
  }

  // the bridge alone, on a page that does not use it: switching an effect on and off while its pictures load
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/site/index.html', { waitUntil: 'load' });
  await check('bridge: wand switched on and off while its pictures load ends with no wand and no copy left running', async () => {
    const r = await page.evaluate(async () => {
      const m = await import('/site/sparkle-bridge.js');
      const art = m.loadArt('cursor');
      m.startFx('cursor', 'moon');
      m.stopFx('cursor');
      await art;
      await new Promise((r) => setTimeout(r, 800));
      return { wand: document.documentElement.classList.contains('stp-wand'), live: !!m.liveFx('cursor'), scripts: document.querySelectorAll('script[data-stp="fairyCursor"]').length, svg: typeof (await m.loadArt('cursor')).svg };
    });
    return [!r.wand && !r.live && r.scripts === 0 && r.svg === 'function', JSON.stringify(r)];
  });
  await check('bridge: wand switched on while its pictures load stays on, as one copy', async () => {
    const r = await page.evaluate(async () => {
      const m = await import('/site/sparkle-bridge.js');
      await m.stopFx('cursor');
      const art = m.loadArt('cursor');          // pictures first (already cached after the check above: no load)
      const started = m.startFx('cursor', 'crystal');
      await art; await started;
      await new Promise((r) => setTimeout(r, 500));
      const out = { wand: document.documentElement.classList.contains('stp-wand'), wandAttr: document.documentElement.dataset.wand, scripts: document.querySelectorAll('script[data-stp="fairyCursor"]').length };
      m.stopFx('cursor');
      await new Promise((r) => setTimeout(r, 300));
      out.afterStop = document.documentElement.classList.contains('stp-wand');
      return out;
    });
    return [r.wand && r.wandAttr === 'crystal' && r.scripts === 1 && !r.afterStop, JSON.stringify(r)];
  });
  await check('bridge: three quick starts of confetti leave one canvas, and stop removes it', async () => {
    const r = await page.evaluate(async () => {
      const m = await import('/site/sparkle-bridge.js');
      m.startFx('confetti', 'heart'); m.startFx('confetti', 'leaf'); const last = m.startFx('confetti', 'paw');
      await last;
      await new Promise((r) => setTimeout(r, 400));
      const out = { canvases: document.querySelectorAll('canvas.stp-confetti').length, family: document.documentElement.dataset.confetti };
      await m.stopFx('confetti');
      out.afterStop = document.querySelectorAll('canvas.stp-confetti').length;
      return out;
    });
    return [r.canvases === 1 && r.family === 'paw' && r.afterStop === 0, JSON.stringify(r)];
  });
  await ctx.close();
} catch (e) { report(false, 'bridge: test run', String(e.stack || e).slice(0, 300)); }
finally { try { await browser.close(); } catch {} server.close(); }
process.exit(failed ? 1 : 0);
