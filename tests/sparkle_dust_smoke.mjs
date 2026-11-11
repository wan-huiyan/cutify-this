// Headless-browser smoke test for the sparkle trail's "glints" variant (two-grain twinkling fairy dust):
// both grains spawn, glints twinkle, the palette follows the page's lightness (and the page's --stp-c tokens win),
// the trail rests (0 animation frames) when idle, destroy() really detaches, a click bursts 10 grains, the white glint core is
// dark-page only, glints raise 0 CSP violations under style-src 'self', and the guards (touch, reduced motion, sparse density, cap, start()) hold.
// Run via `bash scripts/check-all.sh` (or directly: node tests/sparkle_dust_smoke.mjs).
// Prints one "PASS name" / "FAIL name" line per assertion. Exit 0 = all pass, 1 = a FAIL, 2 = Playwright or Chrome is not available.
// SPARKLE_ROOT=<dir> serves a different copy of the repo (used to run this test against a deliberately broken copy).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('playwright is not installed (run: npm install --prefix tests)'); process.exit(2); }

const ROOT = process.env.SPARKLE_ROOT ? path.resolve(process.env.SPARKLE_ROOT) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EX = '/plugins/sparkle-that-page/skills/sparkle-that-page/examples';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sparkle-dust-'));   // generated pages live here, never in the repo
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

// a page = <html attrs>, a body style, optional <head> extras. No cute_chrome.css anywhere: its --stp-c tokens would mask the light/dark palettes.
const mk = (name, htmlAttr, bodyStyle = '', head = '') => fs.writeFileSync(path.join(TMP, name + '.html'),
  `<!doctype html><html ${htmlAttr}><head><meta charset="utf-8"><title>dust</title>${head}</head><body style="margin:0;${bodyStyle}"><div style="height:100vh">dust</div><script src="${EX}/sparkle_trail.js"></script></body></html>`);
const G = 'data-trail="glints"';
mk('light', `${G} data-theme="light"`, 'background:#fff');
mk('dark', `${G} data-theme="dark"`, 'background:#111');
mk('bgdark', G, 'background:#14101f');                                           // no data-theme: measured from the background
mk('bglight', G, 'background:#fbf7ee');                                          // no data-theme, light background, (dark system)
mk('schemedark', G, '', '<style>html{color-scheme:light dark}</style>');         // no background at all, page asks for dark, (dark system)
mk('plain', G);                                                                  // no background, no colour-scheme: white canvas even on a dark system
mk('tokens', `${G} data-theme="dark"`, 'background:#111', '<style>:root{--stp-c1:rgb(18, 52, 86);--stp-c2:rgb(171, 205, 239);--stp-c3:rgb(1, 2, 3)}</style>');
mk('storm', `${G} data-trail-density="storm"`, 'background:#fff');
mk('flip', `${G} data-theme="light"`, 'background:#fff');
mk('htmldark', `${G} style="background:#14101f"`);                              // the dark background is on <html>, <body> has none (a light system)
// strict-CSP pages: served with style-src 'self', so they carry no inline style="" or <style> of their own
const mkCsp = (name, theme) => fs.writeFileSync(path.join(TMP, name + '.html'),
  `<!doctype html><html ${G} data-theme="${theme}"><head><meta charset="utf-8"><title>dust csp</title></head><body><p>dust</p><script src="${EX}/sparkle_trail.js"></script></body></html>`);
mkCsp('csp-light', 'light'); mkCsp('csp-dark', 'dark');

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const base = url.startsWith('/__tmp__/') ? TMP : ROOT;
  const rel = url.startsWith('/__tmp__/') ? url.slice(9) : url;
  const file = path.join(base, path.normalize(rel));
  if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  const headers = { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' };
  if (/^csp-/.test(path.basename(file))) headers['content-security-policy'] = "default-src 'self'; style-src 'self'";
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

let failed = 0;
const report = (ok, name, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' - ' + detail : ''}`); if (!ok) failed++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const COUNT_RAF = () => { window.__raf = 0; const o = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = f => { window.__raf++; return o(f); }; };

let browser;
try { browser = await chromium.launch({ channel: 'chrome' }); }
catch { try { browser = await chromium.launch(); }
        catch (e) { console.log('no browser available: ' + e.message.split('\n')[0]); server.close(); fs.rmSync(TMP, { recursive: true, force: true }); process.exit(2); } }

const COUNT_CSP = () => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI)); };
const open = async (name, opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, ...opts });
  await ctx.addInitScript(COUNT_RAF);
  await ctx.addInitScript(COUNT_CSP);
  const page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/${name}.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.sparkleTrail);
  return { ctx, page };
};
const sweep = async (page, x = 100, y = 150) => { await page.mouse.move(x, y); await page.mouse.move(x + 240, y + 120, { steps: 12 }); };
const grains = page => page.evaluate(() => [...document.querySelectorAll('.stp-trail span[data-grain]')].filter(s => +s.style.opacity > 0)
  .map(s => ({ kind: s.dataset.grain, color: s.style.color, filter: s.style.filter, svg: !!s.querySelector('svg'),
    core: s.querySelector('svg') ? s.querySelector('svg').lastChild.getAttribute('opacity') : null })));   // the white four-point core drawn over a glint
const allRest = page => page.waitForFunction(() => [...document.querySelectorAll('.stp-trail span')].every(s => +s.style.opacity === 0), null, { timeout: 6000 });
const rgb = c => (/(\d+),\s*(\d+),\s*(\d+)/.exec(c) || []).slice(1).map(Number);
const luma = c => { const [r, g, b] = rgb(c); return 0.299 * r + 0.587 * g + 0.114 * b; };
const mean = a => a.reduce((s, x) => s + x, 0) / (a.length || 1);
// colours a page's trail draws, collected over several sweeps (palette picks are random, so one sweep sees a subset)
const colours = async (page, passes = 6) => {
  const seen = new Set(), glow = [];
  for (let i = 0; i < passes; i++) {
    await sweep(page, 60 + i * 10, 100 + i * 20); await sleep(60);
    for (const g of await grains(page)) { seen.add(g.color); glow.push(g.filter); }
    await page.mouse.move(700, 560); await sleep(30);
  }
  return { set: [...seen], glow };
};

try {
  // 1. both grains spawn on a mouse move: tiny round motes and four-point glints (an inline-SVG star)
  let { ctx, page } = await open('light');
  await sweep(page); await sleep(80);
  let g = await grains(page);
  const glints = g.filter(x => x.kind === 'glint'), motes = g.filter(x => x.kind === 'mote');
  report(glints.length > 0 && motes.length > 0 && glints.every(x => x.svg) && motes.every(x => !x.svg),
    'dust: a mouse move spawns both grains - motes (plain dots) and glints (four-point stars)', `${motes.length} motes, ${glints.length} glints`);

  // 2. glints twinkle: sampled ~10 times over their life, scale AND opacity go up at least once (a plain fade only ever goes down)
  await sweep(page, 80, 120); await sleep(20);
  const series = await page.evaluate(async () => {
    const els = [...document.querySelectorAll('.stp-trail span[data-grain=glint]')].filter(s => +s.style.opacity > 0).slice(0, 6);
    const out = els.map(() => []);
    for (let i = 0; i < 10; i++) {
      els.forEach((el, j) => { const m = /scale\(([^)]+)\)/.exec(el.style.transform); out[j].push({ o: +el.style.opacity, s: m ? parseFloat(m[1]) : NaN }); });
      await new Promise(r => setTimeout(r, 45));
    }
    return out;
  });
  const rises = (a, key) => a.some((x, i) => i && x[key] > a[i - 1][key] + 0.005);
  const twinkled = series.filter(a => rises(a, 'o') && rises(a, 's')).length;
  const changed = series.filter(a => a.length && a[0].o !== a[a.length - 1].o && a[0].s !== a[a.length - 1].s).length;
  report(series.length > 0 && twinkled > 0 && changed === series.length, 'dust: glints twinkle - scale and opacity rise and fall during their life, not just fade out',
    `${series.length} glints sampled 10x, ${twinkled} twinkled (both went up at least once), ${changed} changed between first and last sample`);
  await ctx.close();

  // 3. the palette follows the page: light page vs dark page (data-theme) draw from different sets; dark ones are paler
  ({ ctx, page } = await open('light')); const L = await colours(page); await ctx.close();
  ({ ctx, page } = await open('dark')); const D = await colours(page); await ctx.close();
  const inter = L.set.filter(c => D.set.includes(c));
  report(L.set.length >= 3 && D.set.length >= 3 && inter.length === 0 && mean(D.set.map(luma)) > mean(L.set.map(luma)) + 40,
    'dust: a light page and a dark page draw from different palettes (dark page paler)', `light ${L.set.length} colours (mean luma ${mean(L.set.map(luma)).toFixed(0)}), dark ${D.set.length} (${mean(D.set.map(luma)).toFixed(0)}), shared ${inter.length}`);
  report(L.glow.length > 0 && L.glow.every(f => f === 'none') && D.glow.length > 0 && D.glow.every(f => /drop-shadow/.test(f)),
    'dust: crisp on light pages (no glow), soft glow on dark pages', `light filters ${[...new Set(L.glow)]}, dark filters ${[...new Set(D.glow)].length} distinct drop-shadow`);

  // 4. with no data-theme the page's lightness is measured: dark background -> dark palette; light background on a dark system -> still light;
  //    no background but a dark colour-scheme on a dark system -> dark; no background, no colour-scheme on a dark system -> white canvas -> light
  const side = async (name, opts) => { const o = await open(name, opts); const r = await colours(o.page, 4); await o.ctx.close(); return r.set; };
  const only = (set, ref) => set.length > 0 && set.every(c => ref.includes(c));
  const bgDark = await side('bgdark', { colorScheme: 'light' });
  const bgLight = await side('bglight', { colorScheme: 'dark' });
  const schemeDark = await side('schemedark', { colorScheme: 'dark' });
  const plainDark = await side('plain', { colorScheme: 'dark' });
  report(only(bgDark, D.set), 'dust: dark page background (no data-theme, light system) picks the dark palette', `${bgDark.length} colours`);
  report(only(bgLight, L.set), 'dust: light page background (no data-theme, dark system) picks the light palette', `${bgLight.length} colours`);
  report(only(schemeDark, D.set), 'dust: no background but color-scheme dark on a dark system picks the dark palette', `${schemeDark.length} colours`);
  report(only(plainDark, L.set), 'dust: no background and no color-scheme on a dark system (white canvas) picks the light palette', `${plainDark.length} colours`);

  // 5. the page's own --stp-c tokens win over both built-in palettes
  ({ ctx, page } = await open('tokens')); const T = await colours(page, 4); await ctx.close();
  const want = ['rgb(18, 52, 86)', 'rgb(171, 205, 239)', 'rgb(1, 2, 3)'];
  report(T.set.length > 0 && T.set.every(c => want.includes(c)), 'dust: --stp-c1..c3 set by the page win over the built-in palette', `drew ${JSON.stringify(T.set)}`);

  // 6. the palette is re-read when the loop wakes: flip data-theme while at rest and the next move draws the other palette
  ({ ctx, page } = await open('flip'));
  await sweep(page); await sleep(60);
  const before = (await grains(page)).map(x => x.color);
  await allRest(page); await sleep(200);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; document.body.style.background = '#111'; });
  const after = [];
  for (let i = 0; i < 4; i++) { await sweep(page, 60 + i * 10, 100 + i * 20); await sleep(60); (await grains(page)).forEach(x => after.push(x.color)); await page.mouse.move(700, 560); await allRest(page); await sleep(150); }
  report(before.length > 0 && after.length > 0 && before.every(c => L.set.includes(c)) && after.every(c => D.set.includes(c)),
    'dust: flipping the page theme while idle changes the dust colours on the next move', `before ${before.length} grains (light set), after ${after.length} (dark set)`);
  await ctx.close();

  // 7. idle: after the dust has died, 0 animation frames in 1 s; a move or a click wakes it again (click spawns both grains)
  ({ ctx, page } = await open('light'));
  await sweep(page); await sleep(100);
  const during = (await grains(page)).length;
  await allRest(page); await sleep(150);
  await page.evaluate(() => { window.__raf = 0; });
  await sleep(1000);
  const idleFrames = await page.evaluate(() => window.__raf);
  report(during > 0 && idleFrames === 0, 'dust: no requestAnimationFrame calls once the dust has died', `${during} live grains while moving, ${idleFrames} frames in 1 s idle`);
  await page.mouse.move(500, 400); await page.mouse.move(560, 440, { steps: 4 }); await sleep(100);
  const wake = [await page.evaluate(() => window.__raf), (await grains(page)).length];
  await allRest(page); await sleep(150);
  await page.evaluate(() => { window.__raf = 0; });
  await page.mouse.click(100, 100); await sleep(100);
  const clicked = await grains(page), clickFrames = await page.evaluate(() => window.__raf);
  report(wake[0] > 0 && wake[1] > 0 && clickFrames > 0 && clicked.some(x => x.kind === 'glint') && clicked.some(x => x.kind === 'mote'),
    'dust: a move and a click both wake the loop; the click bursts both grains', `move woke ${wake[0]} frames / ${wake[1]} grains, click ${clickFrames} frames / ${clicked.length} grains`);

  // 8. start() is idempotent, destroy() removes everything, start() again re-reads data-trail
  const lay = () => page.evaluate(() => document.querySelectorAll('.stp-trail').length);
  await page.evaluate(() => { const t = window.SparkleThatPage.sparkleTrail; t.start(); t.start(); });
  const afterStart = await lay();
  await page.evaluate(() => window.SparkleThatPage.sparkleTrail.destroy());
  const afterDestroy = await lay();
  await page.evaluate(() => { document.documentElement.dataset.trail = 'heart'; window.SparkleThatPage.sparkleTrail.start(); });
  await sweep(page); await sleep(80);
  const heart = await page.evaluate(() => [document.querySelectorAll('.stp-trail span[data-grain]').length, document.querySelectorAll('.stp-trail span').length]);
  await page.evaluate(() => { window.SparkleThatPage.sparkleTrail.destroy(); document.documentElement.dataset.trail = 'glints'; window.SparkleThatPage.sparkleTrail.start(); });
  await sweep(page); await sleep(80);
  const back = (await grains(page)).length;
  report(afterStart === 1 && afterDestroy === 0 && heart[0] === 0 && heart[1] > 0 && back > 0 && await lay() === 1,
    'dust: start() twice = one layer; destroy() removes it; start() re-reads data-trail (heart and back to glints)', `layers ${afterStart}/${afterDestroy}, heart variant has ${heart[0]} dust spans of ${heart[1]}, glints back ${back} grains`);
  await ctx.close();

  // 9. sparse by default (a spawn per >= 24 px of travel), dense with data-trail-density="storm"; the pool is capped at 80 either way
  ({ ctx, page } = await open('light'));
  await page.mouse.move(300, 300); await sleep(40); await allRest(page); await sleep(100);   // first move spawns once (fresh start); let that die
  for (let i = 1; i <= 5; i++) await page.mouse.move(300 + i * 3, 300);                          // 15 px of wiggle in total
  await sleep(80);
  const wiggle = (await grains(page)).length;
  await allRest(page);
  await page.mouse.move(300, 300); await page.mouse.move(700, 300, { steps: 40 }); await sleep(60);   // 400 px
  const sparse = (await grains(page)).length;
  report(wiggle === 0 && sparse > 0 && sparse <= 2 * (Math.ceil(400 / 24) + 1), 'dust: sparse by default - a 15 px wiggle spawns nothing, 400 px spawns about one pair per 24 px', `${wiggle} grains after the wiggle, ${sparse} after 400 px`);
  await ctx.close();
  ({ ctx, page } = await open('storm'));
  let peak = 0;
  for (let i = 0; i < 10; i++) { await page.mouse.move(100, 100 + i * 30); await page.mouse.move(700, 100 + i * 30, { steps: 30 }); peak = Math.max(peak, (await grains(page)).length); }
  const total = await page.evaluate(() => document.querySelectorAll('.stp-trail span').length);
  report(peak > 2 * (Math.ceil(400 / 24) + 1) && peak <= 80 && total === 80, 'dust: the particle cap holds - storm density never shows more than 80, and the layer holds exactly 80 spans', `peak ${peak} live, ${total} spans in the layer`);
  await ctx.close();

  // 9b. a click wakes the loop and bursts exactly 10 grains (5 glints + 5 motes): at rest, a click on the spot the pointer already is spawns nothing else
  ({ ctx, page } = await open('light'));
  await page.mouse.move(300, 300); await sleep(40); await allRest(page); await sleep(100);
  await page.mouse.click(300, 300); await sleep(60);
  const burst = await grains(page);
  const nG = burst.filter(x => x.kind === 'glint').length, nM = burst.filter(x => x.kind === 'mote').length;
  report(burst.length === 10 && nG === 5 && nM === 5, 'dust: a click bursts exactly 10 grains - 5 glints and 5 motes', `${burst.length} grains, ${nG} glints, ${nM} motes`);
  await ctx.close();

  // 9c. the white core of a glint is a dark-page highlight: shown (opacity 1) on a dark page, hidden (opacity 0) on a light one, so light-page stars are not hollow
  ({ ctx, page } = await open('light')); await sweep(page); await sleep(80);
  const coreLight = (await grains(page)).filter(x => x.kind === 'glint').map(x => x.core); await ctx.close();
  ({ ctx, page } = await open('dark')); await sweep(page); await sleep(80);
  const coreDark = (await grains(page)).filter(x => x.kind === 'glint').map(x => x.core); await ctx.close();
  report(coreLight.length > 0 && coreLight.every(c => c === '0') && coreDark.length > 0 && coreDark.every(c => c === '1'),
    'dust: the white glint core is hidden on light pages and shown on dark pages', `light cores ${[...new Set(coreLight)]} (${coreLight.length} glints), dark cores ${[...new Set(coreDark)]} (${coreDark.length} glints)`);

  // 9d. the page's lightness is read from <html> too: a dark background on <html> only (no data-theme, light system) still picks the dark palette
  const htmlDark = await side('htmldark', { colorScheme: 'light' });
  report(only(htmlDark, D.set), 'dust: a dark background on <html> alone (body transparent, no data-theme, light system) picks the dark palette', `${htmlDark.length} colours`);

  // 9e. destroy() detaches the mousemove and click listeners: after it, moving and clicking wake nothing (0 animation frames). Control: the same input wakes the loop before destroy().
  ({ ctx, page } = await open('light'));
  await sweep(page); await sleep(60); await allRest(page); await sleep(150);
  await page.evaluate(() => { window.__raf = 0; });
  await page.mouse.move(500, 400); await page.mouse.move(600, 450, { steps: 4 }); await page.mouse.click(520, 410); await sleep(80);
  const liveFrames = await page.evaluate(() => window.__raf);
  await allRest(page); await sleep(150);
  await page.evaluate(() => { window.SparkleThatPage.sparkleTrail.destroy(); window.__raf = 0; });
  await page.mouse.move(100, 100); await page.mouse.move(300, 250, { steps: 6 }); await page.mouse.click(310, 260); await sleep(200);
  const deadFrames = await page.evaluate(() => window.__raf), deadLayers = await page.evaluate(() => document.querySelectorAll('.stp-trail').length);
  report(liveFrames > 0 && deadFrames === 0 && deadLayers === 0, 'dust: destroy() removes the mousemove and click listeners - after it a move and a click make 0 animation frames and no layer',
    `${liveFrames} frames from the same input before destroy(), ${deadFrames} after, ${deadLayers} layers`);
  await ctx.close();

  // 9f. strict CSP (style-src 'self'): glints raise 0 securitypolicyviolation events and 0 console errors, and still spawn and look right.
  //     Control: an inline style attribute set on the same page IS blocked, so the counter can fail.
  for (const theme of ['light', 'dark']) {
    const errs = [];
    const ctx2 = await browser.newContext({ viewport: { width: 800, height: 600 } });
    await ctx2.addInitScript(COUNT_CSP);
    const p2 = await ctx2.newPage(); p2.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p2.on('pageerror', e => errs.push(String(e.message)));
    await p2.goto(`${ORIGIN}/__tmp__/csp-${theme}.html`);
    await p2.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.sparkleTrail);
    await sweep(p2); await sleep(80); await p2.mouse.click(200, 200); await sleep(60);
    const gs = await grains(p2), glintDisplay = await p2.evaluate(() => getComputedStyle(document.querySelector('.stp-trail svg')).display);
    const viol = await p2.evaluate(() => window.__csp.slice()), nErr = errs.length;   // before the control below, which logs a console error of its own
    await p2.evaluate(() => document.body.setAttribute('style', 'color:red'));   // control: must be blocked
    const control = await p2.evaluate(() => window.__csp.length);
    report(viol.length === 0 && nErr === 0 && gs.length > 0 && gs.some(x => x.kind === 'glint') && glintDisplay === 'block' && control === 1,
      `dust CSP: under style-src 'self' glints raise 0 CSP violations and 0 console errors on a ${theme} page (and still draw; the control inline style is blocked)`,
      `${viol.length} violations ${JSON.stringify(viol.slice(0, 2))}, ${nErr} console errors, ${gs.length} grains, svg display ${glintDisplay}, control violations ${control}`);
    await ctx2.close();
  }

  // 10. reduced motion and touch: no layer from load or from start(), and nothing spawns
  ({ ctx, page } = await open('light', { reducedMotion: 'reduce' }));
  const rm = await page.evaluate(() => { const a = document.querySelectorAll('.stp-trail').length; window.SparkleThatPage.sparkleTrail.start(); return [a, document.querySelectorAll('.stp-trail').length]; });
  await sweep(page); await sleep(80);
  const rmGrains = await page.evaluate(() => document.querySelectorAll('.stp-trail span').length);
  report(rm[0] === 0 && rm[1] === 0 && rmGrains === 0, 'dust reduced-motion: neither load nor start() makes a layer, and a mouse move spawns nothing', `layers ${JSON.stringify(rm)}, ${rmGrains} spans`);
  await ctx.close();
  ({ ctx, page } = await open('light', { hasTouch: true, isMobile: true }));
  const touch = await page.evaluate(() => { const fine = matchMedia('(pointer: fine)').matches; window.SparkleThatPage.sparkleTrail.start(); return [fine, document.querySelectorAll('.stp-trail').length]; });
  report(touch[0] === false && touch[1] === 0, 'dust touch: on a coarse pointer start() makes no layer', `pointer:fine ${touch[0]}, layers ${touch[1]}`);
  await ctx.close();
} catch (e) {
  report(false, 'sparkle dust smoke test ran to the end', String(e.message || e).split('\n')[0]);
} finally {
  await browser.close();
  server.close();
  fs.rmSync(TMP, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
