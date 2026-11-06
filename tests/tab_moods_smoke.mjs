// Headless-browser smoke test for cutify-that-tab's mood favicons (examples/moods/favicon_mood.js).
// Run directly: node tests/tab_moods_smoke.mjs   (or from scripts/check-all.sh once the main session wires it in)
// Prints one "PASS name" / "FAIL name" line per assertion. Exit 0 = all pass, 1 = a FAIL,
// 2 = Playwright or a browser is not available.
// The clock is faked with page.clock (UTC timezone), and "the tab is hidden" is emulated by overriding
// document.hidden / visibilityState and dispatching visibilitychange: a headless page is never really hidden.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('playwright is not installed (run: npm install --prefix tests)'); process.exit(2); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TAB = 'plugins/cutify-that-tab/skills/cutify-that-tab';
const MOODS = `/${TAB}/examples/moods`;
const PEEK = '/plugins/sparkle-that-page/skills/sparkle-that-page/examples/tab_title_peekaboo.js';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tab-moods-smoke-'));   // fixture pages live here, never in the repo
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

const AWAKE = `${MOODS}/../pixel_mochi_cat.svg`, SLEEP = `${MOODS}/mochi_cat_sleep.svg`;
const SAD = `${MOODS}/mochi_cat_sad.svg`, STARRY = `${MOODS}/mochi_cat_starry.svg`;

// One fixture page, parameterised by what goes on the <link> and <html>, and which scripts load in which order.
function fixture({ bedtime = '', sad = true, peek = '' } = {}) {
  const scripts = { mood: `<script src="${MOODS}/favicon_mood.js"></script>`, peek: `<script src="${PEEK}"></script>` };
  const order = peek === 'peek-first' ? [scripts.peek, scripts.mood] : peek === 'mood-first' ? [scripts.mood, scripts.peek] : [scripts.mood];
  return `<!doctype html><html lang="en"${peek ? ' data-peekaboo-favicon="🥺" data-peekaboo-msg="back!"' : ''}><head><meta charset="utf-8"><title>moods smoke</title>
<link rel="icon" type="image/svg+xml" href="${AWAKE}" data-mood-awake="${AWAKE}" data-mood-sleep="${SLEEP}"
  ${sad ? `data-mood-sad="${SAD}"` : ''} data-mood-starry="${STARRY}" ${bedtime ? `data-bedtime="${bedtime}"` : ''}></head>
<body>moods</body>${order.join('')}</html>`;
}
const PAGES = { default: fixture(), custom: fixture({ bedtime: '22-6' }), minutes: fixture({ bedtime: '22:30-6:15' }), nosad: fixture({ sad: false }),
  junk: fixture({ bedtime: 'bedtime' }), off: fixture({ bedtime: '18-18' }),
  hour25: fixture({ bedtime: '25-7' }), hour24: fixture({ bedtime: '24-7' }), min75: fixture({ bedtime: '18:75-7' }), wide: fixture({ bedtime: '12-23:59' }),
  peekFirst: fixture({ peek: 'peek-first' }), moodFirst: fixture({ peek: 'mood-first' }) };
for (const [name, html] of Object.entries(PAGES)) fs.writeFileSync(path.join(TMP, `${name}.html`), html);

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

let browser;
try { browser = await chromium.launch(); }
catch { try { browser = await chromium.launch({ channel: 'chrome' }); }
        catch (e) { console.log('no browser available: ' + e.message.split('\n')[0]); server.close(); process.exit(2); } }

const base = f => (f || '').split('/').pop();
const href = page => page.evaluate(() => document.querySelector('link[rel~="icon"]').getAttribute('href'));
const mood = (page, expr) => page.evaluate(`window.CutifyTab.mood.${expr}`);
async function hidden(page, h) {
  await page.evaluate(h => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
  }, h);
}
// open a fixture with the browser clock at hh:mm UTC (the context timezone is UTC, so that is local time too)
async function openAt(name, hh, mm = 0, ss = 0) {
  const ctx = await browser.newContext({ timezoneId: 'UTC', viewport: { width: 600, height: 400 } });
  const page = await ctx.newPage();
  const errors = [], warnings = [], requests = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warning') warnings.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('request', r => requests.push(new URL(r.url()).pathname));
  await page.clock.install({ time: new Date(Date.UTC(2026, 10, 6, hh, mm, ss)) });
  // Count what the script leaves running. apply() returns early once running is false, so a leaked listener or timer
  // is invisible in the icon: only counting the calls shows it. Added after clock.install so it wraps the fake timers.
  await page.addInitScript(() => {
    const live = new Set(), timers = new Set(); let adds = 0;
    const add = document.addEventListener.bind(document), rem = document.removeEventListener.bind(document);
    document.addEventListener = (t, f, o) => { if (t === 'visibilitychange') { live.add(f); adds++; } return add(t, f, o); };
    document.removeEventListener = (t, f, o) => { if (t === 'visibilitychange') live.delete(f); return rem(t, f, o); };
    const si = window.setInterval, ci = window.clearInterval;
    window.setInterval = (f, ms, ...a) => { const id = si(f, ms, ...a); if (ms === 60000) timers.add(id); return id; };
    window.clearInterval = id => { timers.delete(id); return ci(id); };
    window.__probe = () => ({ listeners: live.size, adds, intervals: timers.size });
  });
  await page.goto(`${ORIGIN}/__tmp__/${name}.html`);
  return { ctx, page, errors, warnings, requests };
}
// poll until the icon is `file` (or give up after 1.5 s): swaps that wait a tick must not make the test flaky
async function settles(page, file) {
  for (let i = 0; i < 30; i++) { if (base(await href(page)) === base(file)) return true; await sleep(50); }
  return false;
}
const probe = page => page.evaluate(() => window.__probe());
const check = async (name, page, file) => { const ok = await settles(page, file); report(ok, name, ok ? '' : `href is ${base(await href(page))}, wanted ${base(file)}`); };

try {
  // ---- 0. the shipped files: every SVG passes check-favicon.py, every moods.html data-mood-* file exists
  const svgs = fs.readdirSync(path.join(ROOT, TAB, 'examples/moods')).filter(f => f.endsWith('.svg'));
  const bad = svgs.filter(f => spawnSync('python3', [path.join(ROOT, TAB, 'scripts/check-favicon.py'), path.join(ROOT, TAB, 'examples/moods', f)]).status !== 0);
  report(svgs.length >= 12 && bad.length === 0, `check-favicon.py exit 0 on all ${svgs.length} moods SVGs`, bad.join(', '));
  const need = ['axolotl', 'bear', 'bunny', 'chick', 'corgi', 'fox', 'frog', 'ghost', 'mochi_cat', 'panda'].map(n => `${n}_sleep.svg`).concat('mochi_cat_sad.svg', 'mochi_cat_starry.svg');
  report(need.every(f => svgs.includes(f)), 'the 10 sleep files + mochi_cat sad/starry exist', need.filter(f => !svgs.includes(f)).join(', '));

  // ---- 1. the clock: 22:00 asleep, 10:00 awake
  let t = await openAt('default', 22);
  await check('22:00 -> the link href is the sleep file', t.page, SLEEP);
  report(await mood(t.page, 'get()') === 'sleep', 'get() says sleep at 22:00');
  report(t.errors.length === 0, 'no console errors on load', t.errors.join(' | '));
  await t.ctx.close();

  t = await openAt('default', 10);
  await check('10:00 -> the link href is the awake file', t.page, AWAKE);
  report(await mood(t.page, 'get()') === 'awake', 'get() says awake at 10:00');

  // ---- 2. override wins over the clock, until set(null)
  await mood(t.page, "set('sad')");
  await check("set('sad') at 10:00 -> the sad file", t.page, SAD);
  report(await mood(t.page, 'get()') === 'sad', "get() says sad after set('sad')");
  await mood(t.page, "set('starry')");
  await check("set('starry') -> the starry file", t.page, STARRY);
  await mood(t.page, 'set(null)');
  await check('set(null) -> back to the clock (awake at 10:00)', t.page, AWAKE);
  report(await mood(t.page, "set('bogus')") === 'awake' && base(await href(t.page)) === base(AWAKE), "set('bogus') is ignored");

  // ---- 3. a hidden tab sleeps, and wakes when visible again
  await hidden(t.page, true);
  await check('hiding the tab at 10:00 -> the sleep file', t.page, SLEEP);
  report(await mood(t.page, 'get()') === 'sleep', 'get() says sleep while hidden');
  await hidden(t.page, false);
  await check('showing the tab again -> the awake file', t.page, AWAKE);

  // ---- 4. an override beats a hidden tab, and 'awake' pins awake at night
  await mood(t.page, "set('sad')");
  await hidden(t.page, true);
  await sleep(150);
  report(base(await href(t.page)) === base(SAD), "set('sad') while the tab is hidden stays sad (an error should show in the tab strip)");
  await mood(t.page, 'set(null)'); await hidden(t.page, false);
  await t.ctx.close();

  t = await openAt('default', 22);
  await mood(t.page, "set('awake')");
  await check("set('awake') at 22:00 pins the awake file", t.page, AWAKE);
  await mood(t.page, 'set(null)');
  await check('set(null) at 22:00 -> asleep again', t.page, SLEEP);
  await t.ctx.close();

  // ---- 5. bedtime window edges (default 18-7): 17:59 awake, 18:00 asleep, 06:59 asleep, 07:00 awake
  for (const [hh, mm, want, label] of [[17, 59, AWAKE, 'awake'], [18, 0, SLEEP, 'asleep'], [6, 59, SLEEP, 'asleep'], [7, 0, AWAKE, 'awake']]) {
    t = await openAt('default', hh, mm);
    await check(`default bedtime 18-7: ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} is ${label}`, t.page, want);
    await t.ctx.close();
  }
  t = await openAt('custom', 21, 0);
  await check('data-bedtime="22-6": 21:00 is awake', t.page, AWAKE);
  await t.ctx.close();
  t = await openAt('custom', 23, 0);
  await check('data-bedtime="22-6": 23:00 is asleep', t.page, SLEEP);
  await t.ctx.close();
  t = await openAt('minutes', 22, 20);
  await check('data-bedtime="22:30-6:15": 22:20 is awake', t.page, AWAKE);
  await t.ctx.close();
  t = await openAt('minutes', 6, 10);
  await check('data-bedtime="22:30-6:15": 06:10 is asleep', t.page, SLEEP);
  await t.ctx.close();
  t = await openAt('junk', 10);
  await check('an unreadable data-bedtime falls back to 18-7 (10:00 awake)', t.page, AWAKE);
  await t.ctx.close();
  t = await openAt('off', 23);
  await check('data-bedtime="18-18" turns the clock off (23:00 stays awake)', t.page, AWAKE);
  await hidden(t.page, true);
  await check('... but a hidden tab still sleeps', t.page, SLEEP);
  await t.ctx.close();

  // out-of-range hours or minutes fall back to 18-7 with a console warning (they used to be accepted silently)
  for (const [name, hh, mm, label] of [['hour25', 20, 0, '"25-7"'], ['hour24', 20, 0, '"24-7"'], ['min75', 18, 30, '"18:75-7"']]) {
    t = await openAt(name, hh, mm);
    await check(`data-bedtime=${label} is rejected: falls back to 18-7 (${hh}:${String(mm).padStart(2, '0')} asleep)`, t.page, SLEEP);
    report(t.warnings.some(w => /data-bedtime/.test(w)), `data-bedtime=${label} logs a console warning`, t.warnings.join(' | '));
    await t.ctx.close();
  }
  t = await openAt('wide', 13, 0);
  await check('data-bedtime="12-23:59" (valid, hour 23 minute 59) is accepted: 13:00 asleep', t.page, SLEEP);
  report(!t.warnings.some(w => /data-bedtime/.test(w)), 'data-bedtime="12-23:59" logs no warning');
  await t.ctx.close();

  // ---- 6. the clock moving on while the tab sits there: 17:59:30, a minute later it is bedtime
  t = await openAt('default', 17, 59, 30);
  await check('17:59:30 starts awake', t.page, AWAKE);
  await t.page.clock.fastForward(60000);
  await check('a minute later (18:00:30) the once-a-minute tick puts it to sleep', t.page, SLEEP);
  await t.ctx.close();

  // ---- 7. a missing data-mood-sad falls back to the awake icon
  t = await openAt('nosad', 10);
  await mood(t.page, "set('sad')");
  await check("no data-mood-sad: set('sad') shows the awake icon", t.page, AWAKE);
  report(await mood(t.page, 'get()') === 'awake', 'no data-mood-sad: get() reports awake, not sad');
  await t.ctx.close();

  // ---- 8. destroy() puts the original href back and stops listening; start() brings it back
  t = await openAt('default', 22);
  await check('before destroy: asleep at 22:00', t.page, SLEEP);
  await mood(t.page, 'destroy()');
  await check('destroy() restores the link\'s original href', t.page, AWAKE);
  await hidden(t.page, true); await sleep(150);
  report(base(await href(t.page)) === base(AWAKE), 'after destroy() hiding the tab changes nothing');
  await hidden(t.page, false);
  await mood(t.page, 'start()');
  await check('start() after destroy() works again (asleep at 22:00)', t.page, SLEEP);
  await mood(t.page, 'start()');
  report(base(await href(t.page)) === base(SLEEP), 'a second start() does nothing');
  await t.ctx.close();

  // what is left running: one listener and one timer per started script, none after destroy(), none doubled by a second start()
  t = await openAt('default', 22);
  let pr = await probe(t.page);
  report(pr.listeners === 1 && pr.adds === 1 && pr.intervals === 1, 'on load: one visibilitychange listener and one once-a-minute timer', JSON.stringify(pr));
  await mood(t.page, 'start()');
  pr = await probe(t.page);
  report(pr.adds === 1 && pr.intervals === 1, 'a second start() adds no second listener or timer', JSON.stringify(pr));
  await mood(t.page, 'destroy()');
  await check('... and destroy() after it still restores the original href (a second start() did not re-read it)', t.page, AWAKE);
  pr = await probe(t.page);
  report(pr.listeners === 0 && pr.intervals === 0, 'destroy() removes the listener and clears the timer', JSON.stringify(pr));
  await mood(t.page, 'start()');
  pr = await probe(t.page);
  report(pr.listeners === 1 && pr.intervals === 1, 'start() after destroy() runs exactly one listener and one timer', JSON.stringify(pr));
  await t.ctx.close();

  // loading the script a second time replaces the first copy instead of stacking a second one
  t = await openAt('default', 22);
  await t.page.evaluate(() => new Promise((res, rej) => { const s = document.createElement('script');
    s.src = document.querySelector('script[src*="favicon_mood"]').src + '?again'; s.onload = res; s.onerror = rej; document.head.append(s); }));
  pr = await probe(t.page);
  report(pr.listeners === 1 && pr.intervals === 1, 'a second copy of the script destroys the first (one listener, one timer, not two)', JSON.stringify(pr));
  await t.page.evaluate("CutifyTab.mood.set('sad')");
  await check('... and the surviving copy still works', t.page, SAD);
  await t.ctx.close();

  // every icon is fetched on load, so a swap never shows a blank square: sleep, sad and starry are only ever fetched by the preload
  t = await openAt('default', 10);
  let got = [];
  for (let i = 0; i < 30; i++) { got = [SLEEP, SAD, STARRY].filter(f => t.requests.some(r => r.endsWith(f.split('/').pop()))); if (got.length === 3) break; await sleep(50); }
  report(got.length === 3, 'at 10:00 the sleep, sad and starry files are already requested (preloaded)', `requested ${got.length} of 3`);
  await t.ctx.close();

  // ---- 9. with sparkle-that-page's tab_title_peekaboo: its away icon wins while hidden, mood returns on visible; load order irrelevant
  for (const [name, label] of [['peekFirst', 'peekaboo script first'], ['moodFirst', 'mood script first']]) {
    for (const [hh, want, when] of [[10, AWAKE, 'day'], [22, SLEEP, 'night']]) {
      t = await openAt(name, hh);
      await check(`${label}, ${when}: visible tab shows the mood icon`, t.page, want);
      await hidden(t.page, true);
      await sleep(200);
      const away = await href(t.page);
      report(away.startsWith('data:image/svg+xml'), `${label}, ${when}: hidden tab shows peekaboo's away icon, not the mood file`, base(away).slice(0, 40));
      await hidden(t.page, false);
      await check(`${label}, ${when}: back on visible, the mood icon returns`, t.page, want);
      await t.ctx.close();
    }
  }
  for (const [name, label] of [['peekFirst', 'peekaboo script first'], ['moodFirst', 'mood script first']]) {
    t = await openAt(name, 10);
    await mood(t.page, "set('sad')");
    await hidden(t.page, true);
    await sleep(200);
    report(base(await href(t.page)) === base(SAD), `${label}: an explicit set("sad") still shows while hidden (the page asked for it)`);
    await t.ctx.close();
  }
  t = await openAt('peekFirst', 10);
  await hidden(t.page, true);
  await sleep(200);
  report(await mood(t.page, 'get()') === 'sleep' && (await href(t.page)).startsWith('data:'),
    "get() is the mood the script asks for ('sleep' while hidden), even while peekaboo's away icon is what the tab shows");
  await t.ctx.close();
  t = await openAt('peekFirst', 10);
  await t.page.evaluate('SparkleThatPage.tabPeekaboo.destroy()');
  await hidden(t.page, true);
  await check('peekaboo destroyed: the hidden tab sleeps again (the mood script does not stay out of it)', t.page, SLEEP);
  await t.ctx.close();
  t = await openAt('default', 22);
  await t.page.evaluate(() => { document.querySelector('link[rel~="icon"]').setAttribute('href', 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E'); });
  await hidden(t.page, true);
  await sleep(200);
  report((await href(t.page)).startsWith('data:'), 'any other script that sets the href while the tab is hidden is left alone');
  await hidden(t.page, false);
  await check('... and the mood icon returns when the tab is visible', t.page, SLEEP);
  await t.ctx.close();

  // ---- 10. moods.html: loads clean, every image loads, the buttons drive the page's own icon
  t = await openAt('default', 10);   // reuse the clock setup; then go to the real page
  await t.page.goto(`${ORIGIN}${MOODS}/moods.html`);
  await t.page.waitForLoadState('load');
  const broken = await t.page.evaluate(() => [...document.images].filter(i => !i.naturalWidth).map(i => i.src));
  report(broken.length === 0, 'moods.html: every <img> loads', broken.join(', '));
  report(t.errors.length === 0, 'moods.html: no console errors', t.errors.join(' | '));
  const rows = await t.page.locator('#sleepers .row').count();
  report(rows === 10, `moods.html shows 10 mascots awake vs asleep (${rows})`);
  await t.page.click('button[data-value="sad"]');
  await check('moods.html: the Sad button puts the sad file in the page\'s own tab icon', t.page, SAD);
  await t.page.click('button[data-value="sleep"]');
  await check('moods.html: the Asleep button puts the sleep file in the tab icon', t.page, SLEEP);
  await t.page.click('#cycle');
  await check('moods.html: "Flip to the next mood" moves on (sleep -> sad)', t.page, SAD);
  await t.page.click('button[data-value="null"]');
  await check('moods.html: "Clock + tab" hands it back to the clock (10:00 awake)', t.page, AWAKE);
  await t.ctx.close();
} catch (e) {
  report(false, 'test run crashed', e.stack || String(e));
} finally {
  await browser.close();
  server.close();
  fs.rmSync(TMP, { recursive: true, force: true });
}
console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
