// Headless-browser test for the tweak drawer in sparkle-that-page's demo.html: it opens from a tab on the page edge and
// closes with the close button and with Esc, keeps Tab inside while open, drives the live page (wand, trail, palette,
// scroll buddy, petals, sounds), remembers the choices across a reload under one stp: key, survives storage that throws,
// copies a snippet that really starts the chosen effects on a blank page, fits a 390 px phone with no sideways scroll,
// follows light/dark, and stops its slide under reduced motion.
// Run: node tests/sparkle_tweaks_smoke.mjs     (SPARKLE_ROOT=/path points it at another copy of the repo, to prove a check can fail)
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
const EX = '/plugins/sparkle-that-page/skills/sparkle-that-page/examples';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sparkle-tweaks-'));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const base = url.startsWith('/__tmp__/') ? TMP : ROOT;
  const file = path.join(base, path.normalize(url.startsWith('/__tmp__/') ? url.slice(9) : url));
  if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
const DEMO = `${ORIGIN}${EX}/demo.html`;

let failed = 0;
const report = (ok, name, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' - ' + detail : ''}`); if (!ok) failed++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

let browser;
try { browser = await chromium.launch(); }
catch { try { browser = await chromium.launch({ channel: 'chrome' }); }
        catch (e) { console.log('no browser available: ' + e.message.split('\n')[0]); server.close(); process.exit(2); } }

const open = async page => { await page.click('#tw-tab'); await page.waitForSelector('#tw-panel', { state: 'visible' }); };
const visible = page => page.evaluate(() => { const r = document.getElementById('tw-panel'); return getComputedStyle(r).visibility === 'visible'; });

try {
  const errors = [];
  const track = p => { p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); };

  // 1. open and close: the tab, the close button, Esc; focus goes in on open and back to the tab on close
  let ctx = await browser.newContext({ viewport: { width: 1100, height: 800 }, permissions: ['clipboard-read', 'clipboard-write'] });
  let page = await ctx.newPage(); track(page);
  await page.goto(DEMO);
  const closedAtStart = !(await visible(page));
  const tabLabel = await page.getAttribute('#tw-tab', 'aria-label');
  const tabSvg = await page.evaluate(() => ({ svg: !!document.querySelector('#tw-tab svg path'), text: document.getElementById('tw-tab').textContent.trim() }));
  report(closedAtStart && /open/i.test(tabLabel) && tabSvg.svg && tabSvg.text === '', 'tweaks: starts closed; the edge tab is a labelled button with a drawn SVG icon and no text or emoji', `closed=${closedAtStart} label="${tabLabel}" svg=${tabSvg.svg}`);
  await open(page);
  const focusIn = await page.evaluate(() => document.getElementById('tw-panel').contains(document.activeElement));
  report((await visible(page)) && focusIn && (await page.getAttribute('#tw-tab', 'aria-expanded')) === 'true', 'tweaks: the tab opens the drawer, focus moves inside, aria-expanded is true');
  await page.click('#tw-close'); await sleep(450);
  const afterClose = await page.evaluate(() => ({ vis: getComputedStyle(document.getElementById('tw-panel')).visibility, focus: document.activeElement.id }));
  report(afterClose.vis === 'hidden' && afterClose.focus === 'tw-tab', 'tweaks: the close button closes it and gives focus back to the tab', `visibility=${afterClose.vis} focus=${afterClose.focus}`);
  await open(page); await page.keyboard.press('Escape'); await sleep(450);
  const afterEsc = await page.evaluate(() => ({ vis: getComputedStyle(document.getElementById('tw-panel')).visibility, focus: document.activeElement.id }));
  report(afterEsc.vis === 'hidden' && afterEsc.focus === 'tw-tab', 'tweaks: Esc closes it and gives focus back to the tab', `visibility=${afterEsc.vis} focus=${afterEsc.focus}`);

  // 2. focus stays inside: 40 Tabs and 40 Shift+Tabs never leave the drawer
  await open(page);
  let outside = 0;
  for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); if (!(await page.evaluate(() => document.getElementById('tw-panel').contains(document.activeElement)))) outside++; }
  for (let i = 0; i < 40; i++) { await page.keyboard.press('Shift+Tab'); if (!(await page.evaluate(() => document.getElementById('tw-panel').contains(document.activeElement)))) outside++; }
  report(outside === 0, 'tweaks: Tab and Shift+Tab wrap around inside the open drawer', `${outside} of 80 key presses landed outside`);
  await page.evaluate(() => document.getElementById('chk-fairyCursor').focus());   // focus parked on the page behind the drawer (a click there): Tab must pull it back in
  await page.keyboard.press('Tab');
  const pulled = await page.evaluate(() => document.getElementById('tw-panel').contains(document.activeElement));
  report(pulled, 'tweaks: with focus on the page behind the open drawer, Tab moves it back inside');

  // 3. every control is a real input with a label
  const ctl = await page.evaluate(() => [...document.querySelectorAll('#tw-panel select, #tw-panel input')].map(c => ({ id: c.id, label: !!(c.labels && c.labels.length && c.labels[0].textContent.trim()) })));
  report(ctl.length >= 7 && ctl.every(c => c.label), 'tweaks: every select and checkbox has a label', ctl.filter(c => !c.label).map(c => c.id).join() || `${ctl.length} controls`);

  // 4. changing the wand and the palette changes the live page
  const wandBefore = await page.evaluate(() => document.documentElement.style.getPropertyValue('--stp-wand'));
  await page.selectOption('#tw-wand', 'wizard');
  await sleep(200);
  const w1 = await page.evaluate(() => ({ attr: document.documentElement.dataset.wand, css: document.documentElement.style.getPropertyValue('--stp-wand'), api: !!(window.SparkleThatPage && window.SparkleThatPage.fairyCursor), chk: document.getElementById('chk-fairyCursor').checked }));
  await sleep(150);
  const w1b = await page.evaluate(() => document.documentElement.style.getPropertyValue('--stp-wand'));
  await page.selectOption('#tw-wand', 'candy'); await sleep(150);
  const w2 = await page.evaluate(() => ({ attr: document.documentElement.dataset.wand, css: document.documentElement.style.getPropertyValue('--stp-wand') }));
  report(!wandBefore && w1.attr === 'wizard' && w1.api && w1.chk && w1b.length > 50 && w2.attr === 'candy' && w2.css.length > 50 && w2.css !== w1b, 'tweaks: picking a wand starts the cursor and swaps the picture; another wand swaps it again', `wizard css ${w1b.length} chars, candy differs: ${w2.css !== w1b}`);
  await page.selectOption('#tw-wand', 'wizard');
  await page.selectOption('#tw-trail', 'heart');
  await page.selectOption('#tw-density', 'storm');
  await page.selectOption('#tw-palette', 'neon');
  await page.selectOption('#tw-scroll', 'bunny');
  await page.check('#tw-floaters');
  await page.check('#tw-sound');
  await sleep(300);
  const live = await page.evaluate(() => ({
    palette: document.documentElement.dataset.palette, trail: document.documentElement.dataset.trail, density: document.documentElement.dataset.trailDensity,
    scroll: document.documentElement.dataset.scroll + '/' + document.documentElement.dataset.scrollMascot, floaters: !!document.querySelector('canvas.stp-floaters'),
    trailLayer: !!document.querySelector('.stp-trail'), buddy: !!document.querySelector('[data-stp-scroll]'), sound: window.SparkleThatPage.sounds.enabled(),
    panelPalette: document.getElementById('sel-palette').value, panelWand: document.getElementById('sel-fairyCursor').value }));
  report(live.palette === 'neon' && live.panelPalette === 'neon' && live.trail === 'heart' && live.density === 'storm' && live.scroll === 'mascot/bunny' && live.floaters && live.trailLayer && live.buddy && live.sound && live.panelWand === 'wizard',
    'tweaks: palette, trail + density, scroll buddy, petals and sound all change the live page, and the old panel follows', JSON.stringify(live));
  const palClick = await page.evaluate(() => { document.getElementById('sel-palette').value = 'meadow'; document.getElementById('sel-palette').dispatchEvent(new Event('change', { bubbles: true })); return document.getElementById('tw-palette').value; });
  report(palClick === 'meadow', 'tweaks: a change made in the old panel shows up in the drawer', `drawer says ${palClick}`);
  await page.selectOption('#tw-palette', 'neon');

  // 5. the key in storage, then a reload
  const stored = await page.evaluate(() => { const ks = Object.keys(localStorage).filter(k => /^stp:/.test(k)); return { ks, v: JSON.parse(localStorage.getItem('stp:tweaks') || 'null') }; });
  report(stored.ks.includes('stp:tweaks') && stored.v && stored.v.wand === 'wizard' && stored.v.palette === 'neon' && stored.v.scroll === 'bunny' && stored.v.floaters === true, 'tweaks: choices are saved under one stp:tweaks key', JSON.stringify(stored.v));
  await page.reload();
  await sleep(500);
  const back = await page.evaluate(() => ({ wand: document.documentElement.dataset.wand, palette: document.documentElement.dataset.palette, css: document.documentElement.style.getPropertyValue('--stp-wand').length,
    sel: [document.getElementById('tw-wand').value, document.getElementById('tw-trail').value, document.getElementById('tw-palette').value, document.getElementById('tw-scroll').value, document.getElementById('tw-density').value],
    floaters: !!document.querySelector('canvas.stp-floaters'), snippet: document.getElementById('tw-snippet').value.includes('data-wand="wizard"') }));
  report(back.wand === 'wizard' && back.palette === 'neon' && back.css > 50 && back.sel.join() === 'wizard,heart,neon,bunny,storm' && back.floaters && back.snippet, 'tweaks: choices survive a reload (effects running again, drawer and snippet agree)', JSON.stringify(back));
  report(errors.length === 0, 'tweaks: no console errors through all of that', errors.join(' | '));

  // 6. the copied snippet, in a blank page, starts the chosen effects
  await open(page);
  await page.click('#tw-copy'); await sleep(300);
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const shown = await page.inputValue('#tw-snippet');
  report(copied.length > 0 && copied === shown && /Copied/.test(await page.textContent('#tw-status')), 'tweaks: Copy my setup puts the shown snippet on the clipboard and says so', `${copied.length} chars`);
  const htmlTag = /^<html([^>]*)>$/m.exec(copied);
  const tags = copied.split('\n').filter(l => /^<(script|link)\b/.test(l)).map(l => l.replace('/static/', `${EX}/`));
  fs.writeFileSync(path.join(TMP, 'blank.html'), `<!doctype html><html${htmlTag ? htmlTag[1] : ''}><head><meta charset="utf-8"><title>blank</title></head><body><div style="height:300vh">my page</div>${tags.join('')}</body></html>`);
  const errs2 = [];
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs2.push(String(e))); p2.on('console', m => { if (m.type() === 'error') errs2.push(m.text()); });
  await p2.goto(`${ORIGIN}/__tmp__/blank.html`); await sleep(500);
  const bl = await p2.evaluate(() => { const S = window.SparkleThatPage || {}; return { api: Object.keys(S).sort().join(), wand: document.documentElement.style.getPropertyValue('--stp-wand').length, trail: document.documentElement.dataset.trail, density: document.documentElement.dataset.trailDensity,
    palette: document.documentElement.dataset.palette, floaters: !!document.querySelector('canvas.stp-floaters'), buddy: (document.querySelector('[data-stp-scroll]') || {}).dataset && document.querySelector('[data-stp-scroll]').dataset.stpScroll, speaker: !!document.querySelector('[data-sound-toggle]'),
    chromeCss: [...document.styleSheets].some(s => /cute_chrome/.test(s.href || '')) }; });
  report(htmlTag && tags.length === 6 && bl.api === 'ambientFloaters,fairyCursor,scrollIndicator,sounds,sparkleTrail' && bl.wand > 50 && bl.trail === 'heart' && bl.density === 'storm' && bl.palette === 'neon' && bl.floaters && bl.buddy === 'mascot' && bl.speaker && bl.chromeCss && errs2.length === 0,
    'tweaks: the copied snippet on a blank page starts exactly the chosen effects (wand, trail, scroll buddy, petals, sounds, neon palette) and nothing else', JSON.stringify(bl) + ` tags=${tags.length}` + (errs2.length ? ' errors: ' + errs2.join(' | ') : ''));
  await p2.close();

  // 6b. the snippet follows the choices: a wand-only setup names only the wand
  await page.click('#tw-reset'); await sleep(400);
  await page.selectOption('#tw-wand', 'moon');
  const only = await page.inputValue('#tw-snippet');
  report(/data-wand="moon"/.test(only) && /fairy_cursor\.js/.test(only) && !/sparkle_trail|scroll_indicator|ambient_floaters|cute_sounds|data-palette|cute_chrome/.test(only) && (only.match(/<script/g) || []).length === 1, 'tweaks: after Reset and one wand, the snippet names only the wand', only.split('\n').slice(-2).join(' | '));
  const resetState = await page.evaluate(() => ({ trail: !!document.querySelector('.stp-trail'), floaters: !!document.querySelector('canvas.stp-floaters'), buddy: !!document.querySelector('[data-stp-scroll]'), pal: document.documentElement.dataset.palette }));
  report(!resetState.trail && !resetState.floaters && !resetState.buddy && resetState.pal === 'candy', 'tweaks: Reset switches the other effects off and goes back to candy', JSON.stringify(resetState));
  await ctx.close();

  // 7. storage that throws: the page and the drawer still work
  ctx = await browser.newContext({ viewport: { width: 1100, height: 800 } });
  page = await ctx.newPage(); const errs3 = []; page.on('pageerror', e => errs3.push(String(e)));
  await page.addInitScript(() => { const boom = () => { throw new Error('storage blocked'); }; Storage.prototype.getItem = boom; Storage.prototype.setItem = boom; Storage.prototype.removeItem = boom; });
  await page.goto(DEMO); await open(page);
  await page.selectOption('#tw-wand', 'star'); await page.selectOption('#tw-palette', 'meadow'); await sleep(200);
  const nostore = await page.evaluate(() => ({ wand: document.documentElement.dataset.wand, palette: document.documentElement.dataset.palette, snip: document.getElementById('tw-snippet').value.includes('data-palette="meadow"') }));
  report(errs3.length === 0 && nostore.wand === 'star' && nostore.palette === 'meadow' && nostore.snip, 'tweaks: with localStorage throwing on every call, the drawer still works and nothing errors', errs3.join(' | ') || JSON.stringify(nostore));
  await ctx.close();

  // 8. a phone: 390 px, no sideways scroll, closed or open, drawer fully on screen
  ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, isMobile: false });
  page = await ctx.newPage(); await page.goto(DEMO);
  const sw = () => page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth }));
  const swClosed = await sw();
  await open(page); await sleep(400);
  const swOpen = await sw();
  const rect = await page.evaluate(() => { const r = document.getElementById('tw-panel').getBoundingClientRect(); const t = document.getElementById('tw-tab').getBoundingClientRect(); return { l: r.left, r: r.right, tl: t.left, tr: t.right, over: [...document.querySelectorAll('#tw-panel *')].filter(n => n.getBoundingClientRect().right > r.right + 1 && getComputedStyle(n).display !== 'none').length }; });
  report(swClosed.sw <= swClosed.cw && swOpen.sw <= swOpen.cw && swOpen.bw <= 390 && rect.l >= 0 && rect.r <= 390 && rect.tl >= 0 && rect.over === 0, 'tweaks: at 390 px wide there is no sideways scroll (closed or open), the drawer and its tab are on screen, nothing spills out of the drawer', `closed ${swClosed.sw}/${swClosed.cw}, open ${swOpen.sw}/${swOpen.cw}, drawer ${Math.round(rect.l)}-${Math.round(rect.r)}, ${rect.over} overflowing`);
  await ctx.close();

  // 9. light and dark follow the page's [data-theme] variables
  ctx = await browser.newContext({ viewport: { width: 1100, height: 800 } });
  page = await ctx.newPage(); await page.goto(DEMO); await open(page);
  const bg = async t => { await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), t); return page.evaluate(() => { const c = getComputedStyle(document.getElementById('tw-panel')); const x = getComputedStyle(document.querySelector('#tw-panel legend')); return { bg: c.backgroundColor, ink: c.color, legend: x.color }; }); };
  const lt = await bg('light'), dk = await bg('dark');
  const lum = s => { const m = s.match(/\d+/g).map(Number); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
  report(lum(lt.bg) > 200 && lum(dk.bg) < 80 && lum(lt.ink) < 100 && lum(dk.ink) > 180, 'tweaks: the drawer uses the page theme: pale with dark text in light, dark with pale text in dark', `light ${lt.bg} / ${lt.ink}, dark ${dk.bg} / ${dk.ink}`);
  await ctx.close();

  // 10. reduced motion: no slide
  ctx = await browser.newContext({ viewport: { width: 1100, height: 800 }, reducedMotion: 'reduce' });
  page = await ctx.newPage(); await page.goto(DEMO);
  const dur = await page.evaluate(() => getComputedStyle(document.getElementById('tweaks')).transitionDuration);
  await ctx.close();
  ctx = await browser.newContext({ viewport: { width: 1100, height: 800 } });
  page = await ctx.newPage(); await page.goto(DEMO);
  const durNormal = await page.evaluate(() => getComputedStyle(document.getElementById('tweaks')).transitionDuration);
  report(parseFloat(dur) === 0 && parseFloat(durNormal) > 0, 'tweaks: under prefers-reduced-motion the slide has no transition (and it has one otherwise)', `reduced ${dur}, normal ${durNormal}`);
  await ctx.close();
} catch (e) {
  report(false, 'tweaks smoke test ran to the end', String(e.message || e).split('\n')[0]);
} finally {
  await browser.close();
  server.close();
  fs.rmSync(TMP, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
