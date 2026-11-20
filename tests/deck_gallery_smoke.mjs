// Headless-browser smoke test for the inspire-that-deck gallery (examples/gallery.html): every piece carries its
// three notes (fits / skip it when / keep), the interactive pieces answer a click AND a keyboard, nothing animates
// with reduced motion on, no picture holds a font character (emoji), the dialogue's full sentence is there for
// screen readers from the start, and the page neither errors nor scrolls sideways on a phone.
// Run: node tests/deck_gallery_smoke.mjs
//   GALLERY_HTML=/path/to/copy.html points it at another copy, to prove a check can fail.
// Prints one "PASS  name" / "FAIL  name" line per assertion. Exit 0 = all pass, 1 = a FAIL, 2 = Playwright or Chrome missing.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('playwright is not installed (run: npm install --prefix tests)'); process.exit(2); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = process.env.GALLERY_HTML || path.join(ROOT, 'plugins/inspire-that-deck/skills/inspire-that-deck/examples/gallery.html');
const URL_ = pathToFileURL(FILE).href;
let failed = 0;
const ok = (c, name, why = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  deck gallery: ${name}${c || !why ? '' : ` (${why})`}`); if (!c) failed++; };

let browser;
try { browser = await chromium.launch(); }
catch (e) { console.log(`Chrome for Playwright is missing: npx --prefix tests playwright install chromium (${e.message.split('\n')[0]})`); process.exit(2); }

// the fonts come from Google Fonts; block the network so the test is offline and deterministic
const open = async (opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, ...opts });
  await ctx.route(/^https?:/, r => r.abort());
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(URL_); await page.waitForTimeout(300);
  return { ctx, page, errors };
};

{ const { ctx, page, errors } = await open();
  const specs = await page.$$eval('.spec', ss => ss.map(s => ({ id: s.id, h3: !!s.querySelector('h3')?.textContent.trim(),
    dts: [...s.querySelectorAll('.notes dt')].map(d => d.textContent.trim()),
    dds: [...s.querySelectorAll('.notes dd')].map(d => d.textContent.trim().length) })));
  ok(specs.length === 12, `12 pieces (found ${specs.length})`);
  const bad = specs.filter(s => !s.h3 || s.dts.join('|') !== 'Fits|Skip it when|Keep' || s.dds.some(n => n < 20));
  ok(bad.length === 0, 'every piece has a title and three filled notes: Fits, Skip it when, Keep', bad.map(s => s.id).join(', '));

  // no font characters inside a picture: every SVG's markup is plain ASCII (emoji and symbol glyphs are not)
  const nonAscii = await page.$$eval('svg', ss => ss.map(s => [...s.outerHTML].filter(c => c.codePointAt(0) > 127).join('')).join(''));
  ok(nonAscii === '', 'no emoji or symbol characters inside any SVG', nonAscii);
  const sprites = await page.$$eval('svg[data-sprite]', ss => ss.map(s => s.querySelectorAll('rect').length));
  ok(sprites.length >= 7 && sprites.every(n => n > 10), `every pixel sprite drew (${sprites.length} sprites)`);

  const label = await page.getAttribute('#s-dialogue .type', 'aria-label');
  ok(label && label.length > 40 && label.endsWith('!'), 'the dialogue box carries its full sentence for screen readers');

  // XP bar: click and keyboard
  const xp = async () => page.$eval('.xp-bar', b => [b.getAttribute('aria-valuenow'), b.querySelectorAll('i.on').length, document.querySelector('.xp-num').textContent]);
  const x0 = await xp(); await page.click('#s-xp .qbtn'); const x1 = await xp();
  ok(x0[0] === '2' && x1[0] === '3' && x1[1] === 6 && x1[2] === '3 / 5', `XP bar fills on click (${x0} -> ${x1})`);
  await page.focus('#s-xp .qbtn'); await page.keyboard.press('Enter'); const x2 = await xp();
  ok(x2[0] === '4' && x2[2] === '4 / 5', `XP bar fills from the keyboard (${x2})`);

  // checklist: click and keyboard
  const box = '#s-check li:nth-child(3) button';
  const p0 = await page.getAttribute(box, 'aria-pressed'); await page.click(box); const p1 = await page.getAttribute(box, 'aria-pressed');
  await page.focus(box); await page.keyboard.press('Space'); const p2 = await page.getAttribute(box, 'aria-pressed');
  ok(p0 === 'false' && p1 === 'true' && p2 === 'false', `checklist ticks on click and untick on Space (${p0},${p1},${p2})`);

  // loot: a real button opens it, the Close button shuts it
  await page.focus('#s-loot .chest-btn'); await page.keyboard.press('Enter');
  const opened = await page.$eval('#s-loot .stage', s => s.classList.contains('open'));
  await page.click('#s-loot .replay');
  const closed = await page.$eval('#s-loot .stage', s => !s.classList.contains('open'));
  ok(opened && closed, 'loot chest opens from the keyboard and closes again');

  // entrances run once the piece is on screen
  await page.evaluate(() => document.querySelector('#s-stamp').scrollIntoView()); await page.waitForTimeout(400);
  const running = await page.evaluate(() => document.getAnimations().length);
  ok(running > 0, `pieces animate when motion is allowed (${running} animations running)`);
  ok(errors.length === 0, 'no page errors', errors.join(' | '));
  await ctx.close(); }

{ const { ctx, page, errors } = await open({ reducedMotion: 'reduce' });
  for (const id of ['#s-tape', '#s-stamp', '#s-mascot', '#s-dialogue', '#s-bag']) { await page.evaluate(s => document.querySelector(s).scrollIntoView(), id); await page.waitForTimeout(150); }
  await page.click('#s-loot .chest-btn'); await page.waitForTimeout(200);
  const anims = await page.evaluate(() => document.getAnimations().map(a => a.animationName || a.constructor.name));
  ok(anims.length === 0, 'with reduced motion nothing animates, even after opening the chest', anims.slice(0, 5).join(', '));
  const shown = await page.$eval('#s-loot .loot-item', e => getComputedStyle(e).opacity);
  ok(shown === '1', `with reduced motion the loot prize still shows (opacity ${shown})`);
  const typed = await page.$eval('#s-dialogue .type [aria-hidden]', e => e.textContent.length);
  ok(typed > 40, 'with reduced motion the dialogue shows its whole sentence at once');
  ok(errors.length === 0, 'no page errors with reduced motion', errors.join(' | '));
  await ctx.close(); }

{ const { ctx, page } = await open({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(over <= 0, `no sideways scroll on a 390 px phone (overflow ${over}px)`);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok(bg === 'rgb(29, 23, 32)', `dark mode follows the system (body ${bg})`);
  await ctx.close(); }

await browser.close();
process.exit(failed ? 1 : 0);
