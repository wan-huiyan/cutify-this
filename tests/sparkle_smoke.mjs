// Headless-browser smoke test for sparkle-that-page: click confetti, the trail resting when idle, start()/destroy(),
// the data-stamp stamp, the scroll indicator's is-end and cheer, the wand's glow over links (also under a strict CSP),
// and the opt-in sounds, the typed secret word and the no-flash sky switch; plus scripts placed in <head>, a theme
// name the page already owns, the title peekaboo restores, and a stamp that stays on its button while the page scrolls.
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
const page_ = (head, body) => `<!doctype html><html${head}><head><meta charset="utf-8"><title>smoke</title></head><body style="margin:0">${body}</body></html>`;
fs.writeFileSync(path.join(TMP, 'trail.html'), page_('', `<div style="height:100vh">trail</div><script src="${EX}/sparkle_trail.js"></script>`));
fs.writeFileSync(path.join(TMP, 'stamp.html'), page_('', `<button id="s1" data-stamp style="margin:60px;padding:20px">stamp</button><button id="s2" data-stamp="Paid!" style="padding:20px">stamp2</button><div style="height:100vh"></div><script src="${EX}/click_confetti.js"></script>`));
fs.writeFileSync(path.join(TMP, 'scroll.html'), page_(' data-scroll="mascot"', `<div style="height:300vh">tall</div><script src="${EX}/scroll_indicator.js"></script>`));
fs.writeFileSync(path.join(TMP, 'wand.html'), page_('', `<a id="lnk" href="#x" style="display:block;margin:40px;padding:20px">link</a><p id="txt" style="margin:40px;padding:20px">text</p><script src="${EX}/fairy_cursor.js"></script>`));

fs.writeFileSync(path.join(TMP, 'secret.html'), page_('', `<input id="f" type="text"><input id="cb" type="checkbox"><div style="height:100vh">secret</div><script src="${EX}/secret_word.js"></script>`));
fs.writeFileSync(path.join(TMP, 'secret-both.html'), page_('', `<input id="f" type="text"><div style="height:100vh">secret</div><script src="${EX}/click_confetti.js"></script><script src="${EX}/secret_word.js"></script>`));

const wholePage = (htmlAttr, head, body) => `<!doctype html><html${htmlAttr}><head><meta charset="utf-8"><title>smoke</title>${head}</head><body>${body}</body></html>`;
const SCRIPTS = ['fairy_cursor', 'sparkle_trail', 'scroll_indicator', 'tab_title_peekaboo', 'click_confetti', 'ambient_floaters', 'cute_sounds', 'secret_word', 'sky_switch'];
fs.writeFileSync(path.join(TMP, 'stamp-star.html'), page_(' data-confetti-on="*"', `<button id="s1" data-stamp style="margin:60px;padding:20px">stamp</button><div style="height:100vh"></div><script src="${EX}/click_confetti.js"></script>`));
fs.writeFileSync(path.join(TMP, 'stamp-tall.html'), page_('', `<button id="s1" data-stamp style="margin:60px;padding:20px">stamp</button><div style="height:300vh"></div><script src="${EX}/click_confetti.js"></script>`));
for (const v of ['ring', 'comet']) fs.writeFileSync(path.join(TMP, `scroll-${v}.html`), page_(` data-scroll="${v}"`, `<div style="height:300vh">tall</div><script src="${EX}/scroll_indicator.js"></script>`));
// a strict Content-Security-Policy: blocks injected <style> elements (and inline style="" in markup, so this page has none); the CSSOM is still allowed
fs.writeFileSync(path.join(TMP, 'csp.html'), wholePage('', `<meta http-equiv="Content-Security-Policy" content="style-src 'self'">`, `<a id="lnk" href="#x">link</a><p id="txt">text</p><script src="${EX}/fairy_cursor.js"></script>`));
fs.writeFileSync(path.join(TMP, 'head.html'), wholePage('', SCRIPTS.map(n => `<script src="${EX}/${n}.js"></script>`).join(''), '<div style="height:200vh">page</div>'));
fs.writeFileSync(path.join(TMP, 'head-destroy.html'), wholePage('', `<script src="${EX}/click_confetti.js"></script><script>SparkleThatPage.clickConfetti.destroy()</script>`, '<p>page</p>'));
fs.writeFileSync(path.join(TMP, 'peek.html'), wholePage(' data-peekaboo-msg="come back!" data-peekaboo-favicon="\u{1F97A}"', '<link rel="icon" href="data:,">', `<script src="${EX}/tab_title_peekaboo.js"></script>`));

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

  // 6. trail rests when idle: count requestAnimationFrame calls (wrapped before any page script runs)
  const COUNT_RAF = () => { window.__raf = 0; const o = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = f => { window.__raf++; return o(f); }; };
  const live = page => page.evaluate(() => [...document.querySelectorAll('.stp-trail span')].filter(s => +s.style.opacity > 0).length);
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  await ctx.addInitScript(COUNT_RAF);
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/trail.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.sparkleTrail);
  await page.mouse.move(200, 200); await page.mouse.move(300, 300, { steps: 6 }); await page.mouse.move(303, 302); // last move < 24 px: spawns nothing, must not keep the loop alive
  await sleep(100);
  const duringDust = await live(page);
  await page.waitForFunction(() => [...document.querySelectorAll('.stp-trail span')].every(s => +s.style.opacity === 0), null, { timeout: 5000 });
  await sleep(150);
  await page.evaluate(() => { window.__raf = 0; });
  await sleep(1000);
  const idleFrames = await page.evaluate(() => window.__raf);
  report(duringDust > 0 && idleFrames === 0, 'sparkle trail: no requestAnimationFrame calls once the dust has died', `${duringDust} live dust while moving, ${idleFrames} frames in 1 s idle`);
  await page.mouse.move(500, 400); await page.mouse.move(560, 440, { steps: 4 });
  await sleep(100);
  const wakeFrames = await page.evaluate(() => window.__raf), wakeDust = await live(page);
  report(wakeFrames > 0 && wakeDust > 0, 'sparkle trail: a mouse move wakes it and dust spawns again', `${wakeFrames} frames, ${wakeDust} live dust`);
  await page.waitForFunction(() => [...document.querySelectorAll('.stp-trail span')].every(s => +s.style.opacity === 0), null, { timeout: 5000 });
  await sleep(150);
  await page.evaluate(() => { window.__raf = 0; });
  await page.mouse.click(100, 100);                                // a click wakes it too
  await sleep(100);
  const clickDust = await live(page), clickFrames = await page.evaluate(() => window.__raf);
  report(clickDust > 0 && clickFrames > 0, 'sparkle trail: a click wakes it and dust spawns again', `${clickFrames} frames, ${clickDust} live dust`);

  // 7. start() is idempotent; destroy() then start() brings it back with exactly one layer
  const layers = () => page.evaluate(() => document.querySelectorAll('.stp-trail').length);
  const api = await page.evaluate(() => { const t = window.SparkleThatPage.sparkleTrail; const a = [typeof t.start, typeof t.destroy]; t.destroy(); const gone = document.querySelectorAll('.stp-trail').length; t.start(); t.start(); return [a.join(), gone, document.querySelectorAll('.stp-trail').length]; });
  report(api[0] === 'function,function' && api[1] === 0 && api[2] === 1, 'sparkle trail: destroy(), start(), start() leaves exactly one layer', `types ${api[0]}, after destroy ${api[1]}, after 2x start ${api[2]}`);
  await page.mouse.move(100, 100); await page.mouse.move(180, 180, { steps: 4 });
  await sleep(100);
  const backDust = await live(page);
  report(backDust > 0 && await layers() === 1, 'sparkle trail: works again after destroy() + start()', `${backDust} live dust`);
  await page.evaluate(() => window.SparkleThatPage.sparkleTrail.destroy());
  report(await layers() === 0, 'sparkle trail: destroy() removes the layer');
  await ctx.close();

  // 8. data-stamp: a click adds a stamp label and draws confetti; the text comes from the attribute
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/stamp.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.clickConfetti);
  const stampsNow = () => page.evaluate(() => [...document.querySelectorAll('.stp-stamp')].map(e => e.textContent));
  report((await stampsNow()).length === 0 && await pixels(page) === 0, 'sparkle stamp: nothing before the click');
  await page.click('#s1');
  await sleep(450);
  const st1 = await stampsNow(), stPx = await pixels(page);
  report(st1.length === 1 && st1[0] === 'Done!' && stPx > 0, 'sparkle stamp: click on [data-stamp] adds a "Done!" label and draws confetti', `${JSON.stringify(st1)}, ${stPx} pixels`);
  await page.click('#s2');
  await sleep(100);
  const st2 = await stampsNow();
  report(st2.includes('Paid!'), 'sparkle stamp: the label text comes from the attribute value', JSON.stringify(st2));
  await sleep(1700);
  report((await stampsNow()).length === 0, 'sparkle stamp: labels remove themselves');
  await ctx.close();

  // 9. data-stamp under reduced motion: the label appears (no slam), no confetti
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, reducedMotion: 'reduce' });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/stamp.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.clickConfetti);
  await page.click('#s1');
  await sleep(450);
  const rst = await page.evaluate(() => { const e = document.querySelector('.stp-stamp'); return e ? [e.textContent, e.getAnimations().length] : null; });
  const rPx = await pixels(page);
  report(rst && rst[0] === 'Done!' && rst[1] === 0 && rPx === 0, 'sparkle stamp reduced-motion: label appears with no animation and no confetti', `${JSON.stringify(rst)}, ${rPx} pixels`);
  await ctx.close();

  // 9b. reduced motion: start() on the trail is a no-op too (the guards are inside start(), not only at load)
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, reducedMotion: 'reduce' });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/trail.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.sparkleTrail);
  const rl = await page.evaluate(() => { const t = window.SparkleThatPage.sparkleTrail; const a = document.querySelectorAll('.stp-trail').length; t.start(); return [a, document.querySelectorAll('.stp-trail').length]; });
  report(rl[0] === 0 && rl[1] === 0, 'sparkle trail reduced-motion: neither load nor start() makes a layer', JSON.stringify(rl));
  await ctx.close();

  // 10. scroll indicator: is-end flips at the bottom (also under reduced motion), and clears when you scroll back up
  for (const reducedMotion of ['no-preference', 'reduce']) {
    ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, reducedMotion });
    page = await ctx.newPage();
    await page.goto(`${ORIGIN}/__tmp__/scroll.html`);
    await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.scrollIndicator);
    const isEnd = () => page.evaluate(() => { const e = document.querySelector('[data-stp-scroll]'); return !!e && e.classList.contains('is-end'); });
    const atTop = await isEnd();
    await page.evaluate(() => scrollTo(0, 600)); await sleep(150);
    const mid = await isEnd();
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await sleep(200);
    const atBottom = await isEnd();
    await page.evaluate(() => scrollTo(0, 0)); await sleep(150);
    const back = await isEnd();
    report(!atTop && !mid && atBottom && !back, `sparkle scroll (${reducedMotion}): is-end only at the bottom`, `top ${atTop}, middle ${mid}, bottom ${atBottom}, back at top ${back}`);
    await ctx.close();
  }

  // 10b. the cheer itself: right after reaching the bottom something on the indicator is animating (hop / pop), not before, and not under reduced motion.
  // Only the cheering child is looked at: the ring's endless bob lives on the outer element and the mascot's CSS transition too, so they would always count.
  const cheering = page => page.evaluate(() => { const el = document.querySelector('[data-stp-scroll]'); return [...el.children].reduce((n, k) => n + [k, ...k.querySelectorAll('*')].reduce((m, x) => m + x.getAnimations().length, 0), 0); });
  for (const variant of ['mascot', 'ring', 'comet']) {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, reducedMotion });
      page = await ctx.newPage();
      await page.goto(`${ORIGIN}/__tmp__/${variant === 'mascot' ? 'scroll' : 'scroll-' + variant}.html`);
      await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.scrollIndicator);
      const idle = await cheering(page);
      await page.evaluate(() => scrollTo(0, 600)); await sleep(100);
      const midway = await cheering(page);
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await sleep(90);
      const atEnd = await cheering(page);
      report(idle === 0 && midway === 0 && (reducedMotion === 'reduce' ? atEnd === 0 : atEnd > 0), `sparkle scroll ${variant} (${reducedMotion}): ${reducedMotion === 'reduce' ? 'no cheer animation' : 'a cheer animation runs'} on reaching the bottom, none before`, `idle ${idle}, midway ${midway}, at the bottom ${atEnd}`);
      await ctx.close();
    }
  }

  // 11. wand: glowing cursor over a link, plain over text; start() twice adds one style; no-op on touch
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/wand.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.fairyCursor);
  const cur = sel => page.evaluate(s => getComputedStyle(document.querySelector(s)).cursor, sel);
  const [onLink, onText] = [await cur('#lnk'), await cur('#txt')];
  report(onLink.startsWith('url(') && onText.startsWith('url(') && onLink !== onText, 'sparkle wand: a different (glowing) cursor image over a link than over text', `link ${onLink.length} chars, text ${onText.length} chars`);
  report(decodeURIComponent(onLink).includes('radialGradient') && !decodeURIComponent(onText).includes('radialGradient'), 'sparkle wand: the link cursor image carries the glow (a radial gradient); the text cursor image does not', `link glow ${decodeURIComponent(onLink).includes('radialGradient')}, text glow ${decodeURIComponent(onText).includes('radialGradient')}`);
  const styles = await page.evaluate(() => { const w = window.SparkleThatPage.fairyCursor; w.start(); w.start(); const n1 = document.querySelectorAll('style').length; w.destroy(); return [n1, document.querySelectorAll('style').length, document.documentElement.classList.contains('stp-wand')]; });
  report(styles[0] === 1 && styles[1] === 0 && styles[2] === false, 'sparkle wand: start() twice adds one style; destroy() removes it and the class', JSON.stringify(styles));
  await page.evaluate(() => window.SparkleThatPage.fairyCursor.start());
  report((await cur('#lnk')).startsWith('url('), 'sparkle wand: destroy() then start() brings the wand back');
  await ctx.close();
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, hasTouch: true, isMobile: true });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/wand.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.fairyCursor);
  await page.evaluate(() => window.SparkleThatPage.fairyCursor.start());
  report(!(await cur('#lnk')).startsWith('url('), 'sparkle wand: no-op on a touch device, start() included');
  await ctx.close();
  // ---------- cute_sounds / secret_word / sky_switch ----------
  // 12. sound is opt-in: count AudioContext constructions (wrapped before any page script), the oscillator types and the peak gain
  const SPY_AUDIO = (stored) => {
    window.__ac = 0; window.__osc = []; window.__peak = 0;
    const Orig = window.AudioContext;
    window.AudioContext = class extends Orig { constructor(...a) { super(...a); window.__ac++; } };
    const os = OscillatorNode.prototype.start; OscillatorNode.prototype.start = function (...a) { window.__osc.push(this.type); return os.apply(this, a); };
    const ex = AudioParam.prototype.exponentialRampToValueAtTime; AudioParam.prototype.exponentialRampToValueAtTime = function (v, t) { if (v > window.__peak) window.__peak = v; return ex.call(this, v, t); };
    // the loudness a listener gets is the ramp's peak times the number of oscillators feeding that gain node
    window.__gains = [];
    const cg = BaseAudioContext.prototype.createGain;
    BaseAudioContext.prototype.createGain = function () {
      const g = cg.call(this); g.__peak = 0; g.__n = 0;
      const p = g.gain, ex2 = p.exponentialRampToValueAtTime.bind(p);
      p.exponentialRampToValueAtTime = (v, t) => { if (v > g.__peak) g.__peak = v; return ex2(v, t); };
      window.__gains.push(g); return g;
    };
    const oc = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (d, ...r) { if (this instanceof OscillatorNode && d && d.__n !== undefined) d.__n++; return oc.call(this, d, ...r); };
    if (stored) { try { localStorage.setItem('stp:sound', stored); } catch (e) {} }
  };
  const acCount = page => page.evaluate(() => window.__ac);
  ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  await ctx.addInitScript(SPY_AUDIO, null);
  page = await ctx.newPage();
  errors.length = 0;
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`${ORIGIN}${EX}/demo.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.sounds);
  const snd = '[data-sound-toggle]';
  const pressed = () => page.getAttribute(snd, 'aria-pressed');
  const beforeOptIn = [await acCount(page), await page.evaluate(() => window.SparkleThatPage.sounds.enabled()), await pressed()];
  const refused = await page.evaluate(() => [window.SparkleThatPage.sounds.play('chime'), window.__ac]);    // asking for a sound before opting in must neither play nor build a context
  report(beforeOptIn[0] === 0 && beforeOptIn[1] === false && beforeOptIn[2] === 'false' && refused[0] === false && refused[1] === 0,
    'sparkle sounds: before the opt-in click no AudioContext exists, and play() refuses', `contexts ${beforeOptIn[0]}, enabled ${beforeOptIn[1]}, aria-pressed ${beforeOptIn[2]}, play() ${refused[0]}, contexts after play() ${refused[1]}`);
  const label = await page.getAttribute(snd, 'aria-label');
  await page.click(snd);
  const afterOn = [await acCount(page), await page.evaluate(() => window.SparkleThatPage.sounds.enabled()), await pressed(), await page.evaluate(() => localStorage.getItem('stp:sound'))];
  report(afterOn[0] === 1 && afterOn[1] === true && afterOn[2] === 'true' && afterOn[3] === 'on' && !!label, 'sparkle sounds: the toggle click opts in (exactly 1 AudioContext, aria-pressed, remembered)', `contexts ${afterOn[0]}, enabled ${afterOn[1]}, aria-pressed ${afterOn[2]}, stored ${afterOn[3]}, label "${label}"`);
  await page.click(snd); await page.click(snd);
  const again = [await acCount(page), await pressed()];
  const offCheck = await page.evaluate(() => { const s = window.SparkleThatPage.sounds; s.setEnabled(false); const r = s.play('chime'); s.setEnabled(true); return r; });
  report(again[0] === 1 && again[1] === 'true' && offCheck === false, 'sparkle sounds: off then on again reuses the one context; play() is silent while off', `contexts ${again[0]}, aria-pressed ${again[1]}, play() while off ${offCheck}`);
  const voices = {};
  for (const pal of ['meadow', 'neon', 'candy']) {
    voices[pal] = await page.evaluate(async pal => {
      document.documentElement.dataset.palette = pal; window.__osc.length = 0; window.__peak = 0; window.__gains.length = 0;
      const ok = ['chime', 'tick', 'twinkle', 'on'].every(n => window.SparkleThatPage.sounds.play(n));
      return { ok, types: [...new Set(window.__osc)], peak: window.__peak, n: window.__osc.length, eff: Math.max(...window.__gains.map(g => g.__peak * g.__n)) };
    }, pal);
  }
  const wantType = { meadow: 'triangle', neon: 'sine', candy: 'square' };
  report(Object.keys(wantType).every(k => voices[k].ok && voices[k].n > 0 && voices[k].types.length === 1 && voices[k].types[0] === wantType[k]),
    'sparkle sounds: each palette has its own oscillator voice (meadow triangle, neon sine, candy square)', JSON.stringify(Object.fromEntries(Object.entries(voices).map(([k, v]) => [k, v.types.join()]))));
  report(Object.values(voices).every(v => v.peak > 0 && v.peak <= 0.081) && voices.candy.peak < voices.meadow.peak, 'sparkle sounds: quiet (peak gain <= 0.08, candy square lower)', Object.entries(voices).map(([k, v]) => `${k} ${v.peak}`).join(', '));
  report(Object.values(voices).every(v => v.eff > 0 && v.eff <= 0.081), 'sparkle sounds: quiet where it counts - the detuned neon pair (two oscillators, one gain node) sums to <= 0.08 too', Object.entries(voices).map(([k, v]) => `${k} ${+v.eff.toFixed(3)}`).join(', '));
  // celebrate click ticks then chimes (demo has click confetti running only after it is ticked on)
  await page.check('#chk-clickConfetti');
  await page.waitForFunction(() => window.SparkleThatPage.clickConfetti);
  await page.evaluate(() => { document.documentElement.dataset.palette = 'candy'; window.__osc.length = 0; });   // candy: one oscillator per note, so tick 1 + chime 3
  await page.click('button[data-celebrate]');
  await sleep(300);
  const celOsc = await page.evaluate(() => window.__osc.length);
  await page.evaluate(() => { window.__osc.length = 0; });
  await page.click('h1');                                    // demo sets data-confetti-on="*": a plain click bursts, but must stay silent
  await sleep(300);
  const plainOsc = await page.evaluate(() => window.__osc.length);
  report(celOsc === 4 && plainOsc === 0, 'sparkle sounds: [data-celebrate] click makes a tick (1 voice) + chime (3 voices); a plain click (confetti-on="*") stays silent', `${celOsc} voices vs ${plainOsc}`);
  report(errors.length === 0, 'sparkle sounds/secret/sky in demo: no console errors', errors.join(' | '));
  await page.evaluate(() => window.SparkleThatPage.sounds.destroy());
  report(await page.locator(snd).count() === 0 && await page.evaluate(() => window.SparkleThatPage.sounds.play('chime')) === false, 'sparkle sounds: destroy() removes the button and silences play()');
  await ctx.close();

  // 12b. "on" remembered from an earlier visit: still no AudioContext at load (it is made by the first sound)
  ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  await ctx.addInitScript(SPY_AUDIO, 'on');
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}${EX}/demo.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.sounds);
  await sleep(150);
  const rem0 = [await acCount(page), await page.evaluate(() => window.SparkleThatPage.sounds.enabled()), await pressed()];
  const rem1 = await page.evaluate(() => [window.SparkleThatPage.sounds.play('tick'), window.__ac]);
  report(rem0[0] === 0 && rem0[1] === true && rem0[2] === 'true' && rem1[0] === true && rem1[1] === 1, 'sparkle sounds: a remembered "on" still builds no AudioContext until the first sound', `at load ${rem0[0]} (enabled ${rem0[1]}, pressed ${rem0[2]}), after first sound ${rem1[1]}`);
  await ctx.close();

  // 13. secret word: typed on the page body -> confetti; typed in a text field -> nothing. Both confetti paths, custom word, reduced motion, finale.
  const toastText = page => page.evaluate(() => { const t = document.querySelector('.stp-toast'); return t ? t.textContent : null; });
  const ownCanvas = page => page.evaluate(() => document.querySelectorAll('.stp-secret-confetti').length);
  for (const [file, label] of [['secret.html', 'own canvas'], ['secret-both.html', 'click_confetti burst']]) {
    ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
    page = await ctx.newPage();
    await page.goto(`${ORIGIN}/__tmp__/${file}`);
    await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.secretWord);
    if (file === 'secret-both.html') await page.evaluate(() => { window.__b = 0; const c = window.SparkleThatPage.clickConfetti, o = c.burst; c.burst = (x, y) => { window.__b++; return o(x, y); }; });   // count the calls secret_word makes into click_confetti
    await page.locator('#f').focus();
    await page.keyboard.type('magic');                        // inside a text input: nothing
    await sleep(500);
    const inField = [await pixels(page), await toastText(page)];
    await page.evaluate(() => document.activeElement.blur());
    await page.keyboard.type('magi');
    await sleep(100);
    const partial = await pixels(page);
    await page.keyboard.type('c');
    await sleep(500);                                         // same wait as the negative case
    const onBody = [await pixels(page), await toastText(page), await ownCanvas(page)];
    report(inField[0] === 0 && !inField[1] && partial === 0 && onBody[0] > 0 && /secret/i.test(onBody[1] || ''),
      `sparkle secret word (${label}): "magic" on the page draws confetti + a status line; in a text input, or only "magi", nothing`, `input ${inField[0]} px, "magi" ${partial} px, page ${onBody[0]} px, toast "${onBody[1]}"`);
    const wantOwn = file === 'secret.html' ? onBody[2] === 1 : onBody[2] === 0;
    report(wantOwn, `sparkle secret word (${label}): ${file === 'secret.html' ? 'its own canvas is used' : 'it reuses click_confetti, no extra canvas'}`, `own canvases ${onBody[2]}`);
    if (file === 'secret-both.html') {                        // click_confetti switched off -> burst() would be silent, so the fallback must draw
      const liveCalls = await page.evaluate(() => window.__b);
      report(liveCalls === 3, 'sparkle secret word: while click_confetti runs, all 3 waves of the party go to its burst()', `${liveCalls} calls`);
      await page.evaluate(() => { window.SparkleThatPage.clickConfetti.destroy(); window.__b = 0; });   // destroy() keeps the registry key: the documented way to switch it off
      await sleep(2200);
      await page.keyboard.type('magic'); await sleep(450);
      const fb = [await pixels(page), await ownCanvas(page), await page.evaluate(() => window.__b)];
      report(fb[0] > 0 && fb[1] === 1, 'sparkle secret word: if click_confetti is destroyed the fallback canvas still draws', `${fb[0]} px, own canvases ${fb[1]}`);
      report(fb[2] === 0, 'sparkle secret word: after clickConfetti.destroy() no wave is sent to the dead burst() - all 3 go to the own canvas', `${fb[2]} calls to burst()`);
    } else {
      await page.evaluate(() => { document.documentElement.dataset.secret = 'abra'; });
      await sleep(2200);
      await page.keyboard.type('magic'); await sleep(450);
      const old = await pixels(page);
      await page.keyboard.type('abra'); await sleep(450);
      const nw = await pixels(page);
      await page.evaluate(() => document.activeElement.blur());
      report(old === 0 && nw > 0, 'sparkle secret word: data-secret changes the word', `"magic" ${old} px, "abra" ${nw} px`);
      await sleep(2200);
      const gone = [await pixels(page), await ownCanvas(page)];
      report(gone[0] === 0 && gone[1] === 0, 'sparkle secret word: the canvas removes itself once the confetti is gone', `${gone[0]} px, ${gone[1]} canvases`);
      await page.evaluate(() => window.SparkleThatPage.secretWord.finale('Yay, all of it!')); await sleep(400);
      const fin = [await pixels(page), await toastText(page)];
      report(fin[0] > 0 && fin[1] === 'Yay, all of it!', 'sparkle secret word: finale(msg) celebrates and shows the message', `${fin[0]} px, toast "${fin[1]}"`);
      await page.evaluate(() => window.SparkleThatPage.secretWord.destroy()); await sleep(100);
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      await page.keyboard.type('abra'); await sleep(300);
      report(await pixels(page) === 0 && await toastText(page) === null && await ownCanvas(page) === 0, 'sparkle secret word: destroy() stops it and removes its toast and canvas');
    }
    await ctx.close();
  }
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, reducedMotion: 'reduce' });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/secret.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.secretWord);
  await page.keyboard.type('magic'); await sleep(500);
  const rs = [await pixels(page), await toastText(page), await page.evaluate(() => document.querySelector('.stp-toast').getAttribute('role'))];
  report(rs[0] === 0 && /secret/i.test(rs[1] || '') && rs[2] === 'status', 'sparkle secret word reduced-motion: no confetti, just a calm status message', `${rs[0]} px, toast "${rs[1]}", role ${rs[2]}`);
  await ctx.close();

  // 14. sky switch + head snippet, against the real demo.html. sky_switch.js is blocked, so only the <head> snippet can set the theme;
  // a MutationObserver (installed before any page script) records whether <body> existed when data-theme was first set.
  const SPY_THEME = (stored) => {
    if (stored) { try { localStorage.setItem('stp:theme', stored); } catch (e) {} }
    window.__first = null;
    new MutationObserver(() => { if (!window.__first && document.documentElement.dataset.theme) window.__first = { value: document.documentElement.dataset.theme, bodyExisted: !!document.body }; })
      .observe(document, { attributes: true, subtree: true, attributeFilter: ['data-theme'] });   // observe the document: <html> does not exist yet when this runs
  };
  const lum = async (page, x, y) => {                          // brightness of one screenshot pixel (no toggle or panel is drawn there)
    const b64 = (await page.screenshot()).toString('base64');
    return page.evaluate(async ([b64, x, y]) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(x, y, 1, 1).data; return Math.round(0.299 * d[0] + 0.587 * d[1] + 0.114 * d[2]);
    }, [b64, x, y]);
  };
  for (const [stored, system, want] of [['dark', 'light', 'dark'], ['light', 'dark', 'light'], [null, 'dark', 'dark'], [null, 'light', 'light']]) {
    ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, colorScheme: system });
    await ctx.addInitScript(SPY_THEME, stored);
    await ctx.route('**/sky_switch.js*', r => r.abort());
    page = await ctx.newPage();
    await page.goto(`${ORIGIN}${EX}/demo.html`, { waitUntil: 'domcontentloaded' });
    const th = await page.evaluate(() => [document.documentElement.dataset.theme, window.__first, !!window.SparkleThatPage.skySwitch]);
    const px = await lum(page, 40, 400);
    const ok = th[0] === want && th[1] && th[1].value === want && th[1].bodyExisted === false && !th[2] && (want === 'dark' ? px < 70 : px > 200);
    report(ok, `sparkle sky: stored ${stored}, system ${system} -> ${want} is on <html> from <head> (before <body>) and in the first screenshot`, `theme ${th[0]}, set before body: ${th[1] && !th[1].bodyExisted}, sky_switch.js loaded: ${th[2]}, pixel brightness ${px}`);
    if (stored === 'dark') await page.screenshot({ path: path.join(TMP, 'first-frame-dark.png') });
    await ctx.close();
  }
  // the toggle itself
  ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, colorScheme: 'light' });
  await ctx.addInitScript(SPY_THEME, null);
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}${EX}/demo.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.skySwitch);
  const sky = '[data-sky-toggle]', theme = () => page.evaluate(() => document.documentElement.dataset.theme);
  const s0 = [await theme(), await page.getAttribute(sky, 'aria-pressed'), await page.getAttribute(sky, 'aria-label'), await lum(page, 40, 400)];
  await page.click(sky);
  const s1 = [await theme(), await page.getAttribute(sky, 'aria-pressed'), await page.evaluate(() => localStorage.getItem('stp:theme')), await lum(page, 40, 400)];
  report(s0[0] === 'light' && s0[1] === 'false' && !!s0[2] && s0[3] > 200 && s1[0] === 'dark' && s1[1] === 'true' && s1[2] === 'dark' && s1[3] < 70,
    'sparkle sky: the toggle is a named button with aria-pressed; one click flips light -> dark, saves it, and the page goes dark', `before ${JSON.stringify(s0)}, after ${JSON.stringify(s1)}`);
  const glyphs = await page.evaluate(() => [document.querySelector('.stp-sun').getAttribute('opacity'), document.querySelector('.stp-moon').getAttribute('opacity')]);
  report(glyphs[0] === '0' && glyphs[1] === '1', 'sparkle sky: the unused glyph is hidden by the JS (moon shows in dark)', JSON.stringify(glyphs));
  await page.reload({ waitUntil: 'domcontentloaded' });
  const first = await page.evaluate(() => window.__first);
  report(await theme() === 'dark' && first && first.value === 'dark' && first.bodyExisted === false, 'sparkle sky: after a reload the saved dark choice is set from <head>, with the system still light', JSON.stringify(first));
  await page.screenshot({ path: path.join(TMP, 'unused.png') });
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.skySwitch);
  const un = await page.evaluate(() => { const s = window.SparkleThatPage.skySwitch; s.destroy(); const gone = !document.querySelector('.stp-sky'); s.start(); s.start(); return [gone, document.querySelectorAll('.stp-sky').length, s.theme()]; });
  report(un[0] && un[1] === 1 && un[2] === 'dark', 'sparkle sky: destroy() removes the button; start() twice makes exactly one; the theme stays', JSON.stringify(un));
  await ctx.close();
  // 15. follow-ups from the review of the first version
  // 15a. a stamp REPLACES the normal burst: with data-confetti-on="*" a click would burst at once if it fell through; the stamp's own burst comes at ~220 ms
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/stamp-star.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.clickConfetti);
  await page.evaluate(() => { document.querySelector('#s1').click(); return new Promise(r => setTimeout(r, 60)); });
  const earlyPx = await pixels(page);
  await sleep(450);
  const landedPx = await pixels(page);
  report(earlyPx === 0 && landedPx > 0, 'sparkle stamp: replaces the normal burst (nothing at the click, confetti only on the landing)', `${earlyPx} px at 60 ms, ${landedPx} px after the landing`);
  await ctx.close();

  // 15b. the stamp stays on its button when the page scrolls
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/stamp-tall.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.clickConfetti);
  await page.click('#s1');
  await sleep(100);
  await page.evaluate(() => scrollTo(0, 200)); await sleep(200);
  const drift = await page.evaluate(() => {
    const c = r => [r.left + r.width / 2, r.top + r.height / 2], b = document.querySelector('#s1').getBoundingClientRect(), s = document.querySelector('.stp-stamp').getBoundingClientRect();
    return { scrolled: scrollY, btnTop: Math.round(b.top), dx: Math.abs(c(b)[0] - c(s)[0]), dy: Math.abs(c(b)[1] - c(s)[1]) };
  });
  report(drift.scrolled >= 150 && drift.dx < 3 && drift.dy < 3, 'sparkle stamp: after the page scrolls the stamp is still centred on its button', `scrolled ${drift.scrolled}px (button now at y=${drift.btnTop}), stamp off by ${drift.dx.toFixed(1)} / ${drift.dy.toFixed(1)} px`);
  await ctx.close();

  // 15c. the wand under a strict Content-Security-Policy (style-src 'self'): the injected <style> is blocked, the base wand (set through the CSSOM) is not
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/csp.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.fairyCursor);
  const cspCur = await page.evaluate(() => [getComputedStyle(document.querySelector('#txt')).cursor, getComputedStyle(document.querySelector('#lnk')).cursor]);
  report(!cspCur[1].startsWith('url(') && cspCur[0].startsWith('url('), 'sparkle wand under CSP style-src \'self\': the injected glow style is blocked, yet the wand is still the cursor over text', `text ${cspCur[0].slice(0, 30)}..., link ${cspCur[1]}`);
  await ctx.close();

  // 15d. scripts in <head>: no page errors, every layer appears once <body> exists, start() adds nothing twice, destroy() before that cancels the start
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  page = await ctx.newPage();
  const headErrors = [];
  page.on('pageerror', e => headErrors.push(String(e)));
  await page.goto(`${ORIGIN}/__tmp__/head.html`);
  await page.waitForFunction(() => document.querySelector('.stp-sky'));
  const layerCounts = () => page.evaluate(() => ['.stp-trail', '[data-stp-scroll]', '.stp-floaters', 'canvas.stp-confetti', '.stp-sound', '.stp-sky'].map(s => document.querySelectorAll(s).length));
  const hc0 = await layerCounts();
  await page.evaluate(() => { const S = window.SparkleThatPage; ['sparkleTrail', 'scrollIndicator', 'ambientFloaters', 'clickConfetti', 'sounds', 'skySwitch'].forEach(k => S[k].start()); });
  const hc1 = await layerCounts();
  report(headErrors.length === 0 && hc0.join() === '1,1,1,1,1,1' && hc1.join() === '1,1,1,1,1,1', 'sparkle scripts in <head>: no page errors, all six layers appear once the body exists, start() again adds none', `errors ${headErrors.length} ${headErrors[0] || ''}, layers ${hc0.join('/')} then ${hc1.join('/')}`);
  await ctx.close();
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/head-destroy.html`);
  await sleep(150);
  const hd = await page.evaluate(() => [document.querySelectorAll('canvas.stp-confetti').length, window.SparkleThatPage.clickConfetti.active()]);
  report(hd[0] === 0 && hd[1] === false, 'sparkle script in <head>: destroy() before the body exists cancels the pending start', `canvases ${hd[0]}, active ${hd[1]}`);
  await ctx.close();

  // 15e. peekaboo restores the title the page had WHEN IT WENT AWAY, and leaves a title the page changed meanwhile
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/peek.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.tabPeekaboo);
  const pk = await page.evaluate(() => {
    const link = document.querySelector('link[rel~="icon"]'), vis = h => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => h }); document.dispatchEvent(new Event('visibilitychange')); };
    document.title = 'App v2';                                  // the app renamed the tab after load, before the visitor left
    vis(true); const away = [document.title, link.getAttribute('href').startsWith('data:image/svg+xml,')];
    vis(false); const back = [document.title, link.getAttribute('href')];
    vis(true); document.title = 'Inbox (3)'; vis(false);        // the app renamed it while the visitor was away
    return { away, back, kept: document.title };
  });
  report(pk.away[0] === 'come back!' && pk.away[1] && pk.back[0] === 'App v2' && pk.back[1] === 'data:,' && pk.kept === 'Inbox (3)', 'sparkle peekaboo: restores the title read when the tab went away (not the one at load), the icon, and keeps a title changed while away', JSON.stringify(pk));
  await ctx.close();

  // 15f. sounds follow click_confetti being RUNNING: after clickConfetti.destroy() (which leaves the registry key) clicks are silent, after start() they sound again
  ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  await ctx.addInitScript(SPY_AUDIO, 'on');
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}${EX}/demo.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.sounds);
  await page.check('#chk-clickConfetti');
  await page.waitForFunction(() => window.SparkleThatPage.clickConfetti);
  const osc = async sel => { await page.evaluate(() => { window.__osc.length = 0; }); await page.click(sel); await sleep(400); return page.evaluate(() => window.__osc.length); };
  const gate = [await osc('button[data-celebrate]'), await osc('button[data-stamp]')];
  await page.evaluate(() => window.SparkleThatPage.clickConfetti.destroy());
  const gateOff = [await osc('button[data-celebrate]'), await osc('button[data-stamp]'), await page.evaluate(() => typeof window.SparkleThatPage.clickConfetti)];
  await page.evaluate(() => window.SparkleThatPage.clickConfetti.start());
  const gateBack = await osc('button[data-celebrate]');
  report(gate[0] > 0 && gate[1] > 0 && gateOff[0] === 0 && gateOff[1] === 0 && gateOff[2] === 'object' && gateBack > 0, 'sparkle sounds: silent after clickConfetti.destroy() (registry key still there), back after start()', `running ${gate} voices, destroyed ${gateOff.slice(0, 2)}, restarted ${gateBack}`);
  await ctx.close();

  // 15g. typing the secret word inside a text field in an OPEN shadow root is typing in a field: nothing; on the page, the same word still works
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/secret.html`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.secretWord);
  await page.evaluate(() => { const h = document.createElement('div'); document.body.appendChild(h); h.attachShadow({ mode: 'open' }).innerHTML = '<input id="si" type="text">'; h.shadowRoot.querySelector('#si').focus(); });
  await page.keyboard.type('magic'); await sleep(450);
  const shadowIn = [await pixels(page), await toastText(page)];
  await page.evaluate(() => document.activeElement.shadowRoot.activeElement.blur());
  await page.keyboard.type('magic'); await sleep(450);
  const shadowOut = [await pixels(page), await toastText(page)];
  report(shadowIn[0] === 0 && !shadowIn[1] && shadowOut[0] > 0 && /secret/i.test(shadowOut[1] || ''), 'sparkle secret word: typed inside a shadow-root text input does nothing; on the page it still fires', `in shadow input ${shadowIn[0]} px, on page ${shadowOut[0]} px`);
  await ctx.close();

  // 15h. a theme name the page already owns (data-theme="cupcake") is left alone by the real head snippet (taken from demo.html) and by sky_switch.js, also on a system change
  const snippet = (/<script>\(function\(\)\{var r=document\.documentElement[\s\S]*?<\/script>/.exec(fs.readFileSync(path.join(ROOT, EX, 'demo.html'), 'utf8')) || [''])[0];
  fs.writeFileSync(path.join(TMP, 'cupcake.html'), wholePage(' data-theme="cupcake"', snippet, `<p>themed</p><script src="${EX}/sky_switch.js"></script>`));
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, colorScheme: 'light' });
  page = await ctx.newPage();
  await page.goto(`${ORIGIN}/__tmp__/cupcake.html`, { waitUntil: 'domcontentloaded' });
  const cc0 = await page.evaluate(() => document.documentElement.dataset.theme);          // the head snippet has run, sky_switch.js may not have yet
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.skySwitch);
  await page.emulateMedia({ colorScheme: 'dark' }); await sleep(150);
  const cc1 = await page.evaluate(() => [document.documentElement.dataset.theme, window.SparkleThatPage.skySwitch.theme()]);
  await page.click('[data-sky-toggle]');
  const cc2 = await page.evaluate(() => document.documentElement.dataset.theme);
  report(snippet.length > 0 && cc0 === 'cupcake' && cc1[0] === 'cupcake' && cc1[1] === 'dark' && cc2 === 'light', 'sparkle sky: a page theme name (cupcake) survives the head snippet, sky_switch.js and a system change; only a press of the toggle replaces it', `after head snippet ${cc0}, after system->dark ${cc1[0]} (theme() says ${cc1[1]}), after a toggle press ${cc2}`);
  await ctx.close();
} catch (e) {
  report(false, 'sparkle smoke test ran to the end', String(e.message || e).split('\n')[0]);
} finally {
  await browser.close();
  server.close();
  fs.rmSync(TMP, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
