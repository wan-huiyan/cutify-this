// Headless-browser smoke test for sparkle-that-page's click confetti.
// Run via `bash scripts/check-all.sh` (or directly: node tests/sparkle_smoke.mjs).
// Prints one "PASS name" / "FAIL name" line per assertion. Exit 0 = all pass, 1 = a FAIL,
// 2 = Playwright or a browser is not available (check-all.sh turns that into SKIP, or FAIL in CI).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('playwright is not installed (run: npm install --prefix tests)'); process.exit(2); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EX = '/plugins/sparkle-that-page/skills/sparkle-that-page/examples';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sparkle-smoke-'));   // generated page lives here, never in the repo
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>smoke</title></head>
<body style="margin:0;height:100vh"><div id="plain" style="height:300px">plain spot</div>
<button id="cel" data-celebrate style="margin:20px;padding:20px">celebrate</button>
<script src="${EX}/click_confetti.js"></script></body></html>`;   // no data-confetti-on: the shipped default
fs.writeFileSync(path.join(TMP, 'minimal.html'), PAGE);

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const base = url.startsWith('/__tmp__/') ? TMP : ROOT;
  const rel = url.startsWith('/__tmp__/') ? url.slice(9) : url;
  const file = path.join(base, path.normalize(rel));
  if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

let failed = 0;
const report = (ok, name, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' - ' + detail : ''}`); if (!ok) failed++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pixels = page => page.evaluate(() => [...document.querySelectorAll('canvas')].reduce((n, c) => {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
  return n;
}, 0));

let browser;
try { browser = await chromium.launch(); }
catch { try { browser = await chromium.launch({ channel: 'chrome' }); }
        catch (e) { console.log('no browser available: ' + e.message.split('\n')[0]); server.close(); process.exit(2); } }

try {
  // 1+2. the shipped demo: loads clean, and (it opts in with data-confetti-on="*") a plain click draws confetti
  const errors = [];
  let ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  let page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`${ORIGIN}${EX}/demo.html`);
  await page.check('#chk-clickConfetti');                       // the demo injects the module when ticked
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.clickConfetti);
  await sleep(200);
  report(errors.length === 0, 'sparkle demo.html: no console errors', errors.join(' | '));
  const h1 = await page.locator('h1').boundingBox();
  const before = await pixels(page);
  await page.mouse.click(h1.x + h1.width / 2, h1.y + h1.height / 2);
  await sleep(80);
  const demoPx = await pixels(page);
  report(before === 0 && demoPx > 0, 'sparkle demo.html: click on a plain spot draws confetti', `${before} -> ${demoPx} pixels`);
  await ctx.close();

  // 3+4. minimal page, no data-confetti-on: plain click draws nothing, [data-celebrate] draws
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/minimal.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.clickConfetti);
  await page.mouse.click(400, 150);                              // inside #plain
  await sleep(150);
  const plainPx = await pixels(page);
  report(plainPx === 0, 'sparkle default: plain click draws nothing', `${plainPx} pixels`);
  await page.click('#cel');
  await sleep(80);
  const normalPx = await pixels(page);
  report(normalPx > 0, 'sparkle default: click on [data-celebrate] draws', `${normalPx} pixels`);
  await ctx.close();

  // 5. reduced motion: a small glyph shows, then the canvas is empty again after ~700 ms
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, reducedMotion: 'reduce' });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/minimal.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.clickConfetti);
  await page.click('#cel');
  await sleep(80);
  const redEarly = await pixels(page);
  await sleep(700);
  const redLate = await pixels(page);
  report(redEarly > 0 && redEarly < normalPx, 'sparkle reduced-motion: celebrate click draws a little', `${redEarly} pixels vs ${normalPx} at normal motion`);
  report(redLate === 0, 'sparkle reduced-motion: nothing left after ~700 ms', `${redLate} pixels`);
  await ctx.close();
} catch (e) {
  report(false, 'sparkle smoke test ran to the end', String(e.message || e).split('\n')[0]);
} finally {
  await browser.close();
  server.close();
  fs.rmSync(TMP, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
