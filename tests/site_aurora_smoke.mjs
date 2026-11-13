// Headless-browser smoke test for the landing page site/aurora.html and its "collection" shelves:
// every family is a playground pill and a shelf item (11 wands / 13 confetti / 12 floaters / 11 companions),
// every shelf picture is really drawn, clicking an item puts that design on the page and keeps the playground in
// step (pill + switch), a confetti item bursts, every gallery link points at a file on disk, 375 px wide has no
// sideways scroll, and nothing throws. Also: each shelf really fades in when scrolled to (it is built after the
// reveal observer started), the confetti pictures use the colours the page's confetti really uses (data-palette), and
// a pick that the device declines (floaters under reduced motion, the wand on a touch phone) does not show as on.
// Run: node tests/site_aurora_smoke.mjs
//   SITE_ROOT=/path points it at another copy of the repo (site/ and plugins/), to prove a check can fail.
// Prints one "PASS  name" / "FAIL  name" line per assertion. Exit 0 = all pass, 1 = a FAIL, 2 = Playwright or Chrome missing.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('playwright is not installed (run: npm install --prefix tests)'); process.exit(2); }

const ROOT = process.env.SITE_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8821;
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.md': 'text/markdown' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, path.normalize(url));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r, j) => { server.on('error', j); server.listen(PORT, '127.0.0.1', r); }).catch((e) => { console.log('cannot listen on ' + PORT + ': ' + e.message); process.exit(2); });
const PAGE = `http://127.0.0.1:${PORT}/site/aurora.html`;

let failed = 0, browser;
const report = (ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? '  (' + detail + ')' : ''}`); };
const check = async (name, fn) => { try { const [ok, detail] = await fn(); report(ok, name, detail); } catch (e) { report(false, name, 'threw: ' + String(e.message || e).slice(0, 160)); } };
try { browser = await chromium.launch({ channel: 'chrome' }); }
catch { try { browser = await chromium.launch(); } catch { console.log('no Chrome / Chromium for Playwright'); server.close(); process.exit(2); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WANDS = ['star', 'magical', 'wizard', 'garden', 'cosmic', 'candy', 'crystal', 'moon', 'ocean', 'lollipop', 'pixel'];
const CONFETTI = ['confetti', 'heart', 'star', 'paper', 'ribbon', 'sprinkles', 'petal', 'leaf', 'snow', 'bubble', 'note', 'paw', 'pixel'];
const FLOATERS = ['dust', 'sakura', 'snowflake', 'bubbles', 'leaves', 'fairydust', 'fireflies', 'dandelion', 'lanterns', 'stars', 'clouds', 'hearts'];
const COMPANIONS = ['cat', 'bunny', 'bear', 'frog', 'sprout', 'rocket', 'caterpillar', 'moon', 'balloon', 'ring', 'comet'];
const SHELVES = { cursor: WANDS, confetti: CONFETTI, floaters: FLOATERS, scroll: COMPANIONS };

try {
  const open = async (width = 1280, height = 900, extra = {}) => {
    const ctx = await browser.newContext({ viewport: { width, height }, ...extra });
    const page = await ctx.newPage();
    page.__errors = [];
    page.on('pageerror', (e) => page.__errors.push(e.message));
    await page.goto(PAGE, { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelectorAll('.au-item').length >= 40 && window.SparkleThatPage && window.SparkleThatPage.clickConfetti, null, { timeout: 15000 });
    await sleep(300);
    page.__ctx = ctx;
    return page;
  };
  const page = await open();

  await check('aurora: every family is a playground pill, with the right counts (11 wands, 13 confetti, 12 floaters, 11 companions)', () => page.evaluate((S) => {
    const bad = [];
    for (const [k, list] of Object.entries(S)) {
      const got = [...document.querySelectorAll(`.au-vp[data-key="${k}"]`)].map((b) => b.dataset.v);
      if (got.length !== list.length || list.some((v) => !got.includes(v))) bad.push(`${k}: ${got.length}`);
    }
    return [!bad.length, bad.join('; ')];
  }, SHELVES));
  await check('aurora: every family is a shelf item, same counts, none twice', () => page.evaluate((S) => {
    const bad = [];
    for (const [k, list] of Object.entries(S)) {
      const got = [...document.querySelectorAll(`.au-item[data-key="${k}"]`)].map((b) => b.dataset.v);
      if (got.length !== list.length || list.some((v) => !got.includes(v)) || new Set(got).size !== got.length) bad.push(`${k}: ${got.length}`);
    }
    return [!bad.length, bad.join('; ')];
  }, SHELVES));
  await check('aurora: the playground keeps the "crystal" wand pill and starts floaters on dust (today\'s look)', () => page.evaluate(() => [
    !!document.querySelector('.au-vp[data-key="cursor"][data-v="crystal"]') && document.documentElement.dataset.floaters === 'dust', `floaters=${document.documentElement.dataset.floaters}`]));
  await check('aurora: pills and items are real <button>s with aria-labels; the switches too', () => page.evaluate(() => {
    const els = [...document.querySelectorAll('.au-vp, .au-item, .au-switch')];
    const bad = els.filter((e) => e.tagName !== 'BUTTON' || !e.getAttribute('aria-label'));
    return [els.length > 100 && !bad.length, `${els.length} controls, ${bad.length} bad`];
  }));

  await check('aurora: every wand and companion picture is a non-empty svg', () => page.evaluate(() => {
    const bad = [...document.querySelectorAll('.au-item[data-key="cursor"], .au-item[data-key="scroll"]')].filter((b) => {
      const s = b.querySelector('.au-pic svg'); return !s || s.querySelectorAll('*').length < 2 || s.getBoundingClientRect().width < 8;
    }).map((b) => b.dataset.v);
    return [!bad.length, bad.join(',')];
  }));
  await check('aurora: every confetti and floaters picture has drawn pixels (a blank canvas is 0)', () => page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('.au-item[data-key="confetti"], .au-item[data-key="floaters"]').forEach((b) => {
      const c = b.querySelector('canvas'); let n = 0;
      if (c && c.width) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; }
      if (n < 25) bad.push(b.dataset.key + ':' + b.dataset.v + '=' + n);
    });
    return [!bad.length, bad.join(', ')];
  }));

  // each shelf card is built after the reveal observer started: it must still fade in when scrolled to.
  // (Playwright counts opacity-0 buttons as visible and clickable, so only computed opacity catches this.)
  const shelvesShow = (pg) => async () => {
    const out = [];
    for (const k of Object.keys(SHELVES)) {
      await pg.locator(`[data-shelf="${k}"]`).scrollIntoViewIfNeeded();
      let op = '0';
      for (let i = 0; i < 25 && op !== '1'; i++) { await sleep(100); op = await pg.evaluate((k) => getComputedStyle(document.querySelector(`[data-shelf="${k}"]`)).opacity, k); }
      out.push(k + '=' + op);
    }
    return [out.every((t) => t.endsWith('=1')), out.join(' ')];
  };
  await check('aurora: each of the four shelves fades in (opacity 1) when scrolled into view at 1280', shelvesShow(page));

  await check('aurora: confetti pictures use the page\'s colours (data-palette candy): the leaf picture has no green, yet is drawn', () => page.evaluate(() => {
    const c = document.querySelector('.au-item[data-key="confetti"][data-v="leaf"] canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0, green = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 120) continue; n++; if (d[i + 1] > d[i] + 30 && d[i + 1] > d[i + 2] + 30) green++; }
    return [n >= 25 && green <= n * 0.05, `opaque ${n}, green ${green}, data-palette=${document.documentElement.dataset.palette}`];
  }));

  // clicking an item: html data-*, the playground pill and switch
  const state = (key, v) => page.evaluate(([k, v]) => {
    const d = document.documentElement.dataset, card = document.querySelector(`.au-pf[data-key="${k}"]`);
    return { wand: d.wand, floaters: d.floaters, scroll: d.scroll, mascot: d.scrollMascot,
      pill: card.querySelector(`.au-vp[data-v="${v}"]`).getAttribute('aria-pressed'), pills: card.querySelectorAll('.au-vp[aria-pressed="true"]').length,
      sw: card.querySelector('.au-switch').getAttribute('aria-pressed'), item: document.querySelector(`.au-item[data-key="${k}"][data-v="${v}"]`).getAttribute('aria-pressed') };
  }, [key, v]);
  const click = async (key, v) => { await page.locator(`.au-item[data-key="${key}"][data-v="${v}"]`).scrollIntoViewIfNeeded(); await page.locator(`.au-item[data-key="${key}"][data-v="${v}"]`).click(); await sleep(500); };

  await click('cursor', 'ocean');
  await check('aurora: clicking the ocean wand sets data-wand, selects its pill alone, and turns the cursor switch on (it started off)', async () => {
    const s = await state('cursor', 'ocean'); return [s.wand === 'ocean' && s.pill === 'true' && s.pills === 1 && s.sw === 'true' && s.item === 'true', JSON.stringify(s)];
  });
  await click('floaters', 'lanterns');
  await check('aurora: clicking the lanterns floater sets data-floaters, its pill, its switch', async () => {
    const s = await state('floaters', 'lanterns'); return [s.floaters === 'lanterns' && s.pill === 'true' && s.pills === 1 && s.sw === 'true', JSON.stringify(s)];
  });
  await click('scroll', 'frog');
  await check('aurora: clicking the frog climber sets data-scroll=mascot and data-scroll-mascot=frog, pill and switch', async () => {
    const s = await state('scroll', 'frog'); return [s.scroll === 'mascot' && s.mascot === 'frog' && s.pill === 'true' && s.sw === 'true', JSON.stringify(s)];
  });
  await click('scroll', 'rocket');
  await check('aurora: clicking the rocket sets data-scroll=rocket and clears the climber name', async () => {
    const s = await state('scroll', 'rocket'); return [s.scroll === 'rocket' && !s.mascot && s.pill === 'true' && s.pills === 1, JSON.stringify(s)];
  });
  await check('aurora: a pill hidden behind "more" opens its card when picked from a shelf (the selected pill is visible)', () => page.evaluate(() => {
    const p = document.querySelector('.au-vp[data-key="scroll"][data-v="rocket"]'); return [p.getBoundingClientRect().width > 0, 'rocket pill hidden'];
  }));
  await check('aurora: the switch turns the effect off again and the shelf item lets go', async () => {
    await page.locator('.au-switch[data-key="floaters"]').click(); await sleep(300);
    const r = await page.evaluate(() => [document.querySelector('.au-switch[data-key="floaters"]').getAttribute('aria-pressed'), !!(window.SparkleThatPage && window.SparkleThatPage.ambientFloaters), document.querySelector('.au-item[data-key="floaters"][data-v="lanterns"]').getAttribute('aria-pressed')]);
    return [r[0] === 'false' && r[1] === false && r[2] === 'false', r.join()];
  });

  // confetti: pieces appear after the click
  await check('aurora: clicking a confetti item starts confetti and pieces are on the confetti canvas soon after', async () => {
    const item = page.locator('.au-item[data-key="confetti"][data-v="paw"]'); await item.scrollIntoViewIfNeeded();
    await page.evaluate(() => { document.querySelectorAll('canvas.stp-confetti').forEach((c) => c.__seen = 0); });
    await item.click();
    let best = 0, fam = null, act = false;
    for (let i = 0; i < 10 && best < 40; i++) {
      await sleep(90);
      const r = await page.evaluate(() => {
        const live = window.SparkleThatPage && window.SparkleThatPage.clickConfetti; const cs = [...document.querySelectorAll('canvas')].filter((c) => /confetti/.test(c.className));
        let n = 0; for (const c of cs) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; }
        return { n, act: !!(live && live.active && live.active()), fam: document.documentElement.dataset.confetti, canvases: cs.length };
      });
      best = Math.max(best, r.n); fam = r.fam; act = r.act;
    }
    const s = await state('confetti', 'paw');
    return [act && best >= 40 && fam === 'paw' && s.pill === 'true' && s.sw === 'true', `active=${act} pixels=${best} data-confetti=${fam} pill=${s.pill} switch=${s.sw}`];
  });

  await check('aurora: every gallery link on the page points at a file that exists on disk', () => {
    return page.evaluate(() => [...document.querySelectorAll('a.au-gal')].map((a) => a.getAttribute('href'))).then((hrefs) => {
      const missing = hrefs.filter((h) => !fs.existsSync(path.join(ROOT, 'site', h)));
      const want = ['wands', 'confetti', 'floaters', 'scroll'].filter((g) => hrefs.filter((h) => h.endsWith(g + '.html')).length < 2);
      return [hrefs.length === 8 && !missing.length && !want.length, `links ${hrefs.length}, missing ${missing.join(',')}, linked fewer than twice: ${want.join(',')}`];
    });
  });
  await check('aurora: each shelf heading shows its count and a "see all" link', () => page.evaluate(() => {
    const t = [...document.querySelectorAll('[data-shelf]')].map((s) => s.querySelector('h3').textContent.trim() + '|' + (s.querySelector('a.au-seeall') ? 'link' : 'none'));
    const ok = t.length === 4 && /^11 wands\|link/.test(t[0]) && /^13 confetti\|link/.test(t[1]) && /^12 floaters\|link/.test(t[2]) && /^11 scroll companions\|link/.test(t[3]);
    return [ok, t.join(' ; ')];
  }));
  await check('aurora: no page errors at 1280 wide', () => [page.__errors.length === 0, page.__errors.join(' | ')]);
  await page.__ctx.close();

  const m = await open(375, 800);
  await check('aurora: no sideways scroll at 375 wide (scrollWidth <= innerWidth), and shelf items stay inside the window', () => m.evaluate(() => {
    const over = [...document.querySelectorAll('.au-item, .au-pf, [data-shelf]')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).length;
    return [document.documentElement.scrollWidth <= innerWidth && over === 0, `scrollWidth ${document.documentElement.scrollWidth} vs ${innerWidth}, ${over} past the edge`];
  }));
  await check('aurora: each of the four shelves fades in (opacity 1) when scrolled into view at 375', shelvesShow(m));
  await check('aurora: no page errors at 375 wide', () => [m.__errors.length === 0, m.__errors.join(' | ')]);
  await m.__ctx.close();

  // floaters decline to run under reduced motion: picking one must not show as on, and the page says why
  const r = await open(1280, 900, { reducedMotion: 'reduce' });
  await check('aurora (reduced motion): picking the sakura floater leaves the item and the switch off and shows a note', async () => {
    const it = r.locator('.au-item[data-key="floaters"][data-v="sakura"]'); await it.scrollIntoViewIfNeeded(); await it.click(); await sleep(500);
    const s = await r.evaluate(() => ({ item: document.querySelector('.au-item[data-key="floaters"][data-v="sakura"]').getAttribute('aria-pressed'),
      sw: document.querySelector('.au-switch[data-key="floaters"]').getAttribute('aria-pressed'), canvases: document.querySelectorAll('canvas.stp-floaters').length,
      note: (document.querySelector('[data-shelf="floaters"] .au-note') || {}).textContent || '' }));
    return [s.item === 'false' && s.sw === 'false' && s.canvases === 0 && s.note.length > 10, JSON.stringify(s)];
  });
  await check('aurora (reduced motion): no page errors', () => [r.__errors.length === 0, r.__errors.join(' | ')]);
  await r.__ctx.close();

  // the wand needs a mouse (pointer: fine): on a touch phone a wand pick must not show as on
  const t = await open(375, 800, { isMobile: true, hasTouch: true });
  await check('aurora (touch phone): picking a wand leaves the item and the cursor switch off and shows a note', async () => {
    const it = t.locator('.au-item[data-key="cursor"][data-v="moon"]'); await it.scrollIntoViewIfNeeded(); await it.tap(); await sleep(500);
    const s = await t.evaluate(() => ({ item: document.querySelector('.au-item[data-key="cursor"][data-v="moon"]').getAttribute('aria-pressed'),
      sw: document.querySelector('.au-switch[data-key="cursor"]').getAttribute('aria-pressed'), wand: document.documentElement.classList.contains('stp-wand'),
      note: (document.querySelector('[data-shelf="cursor"] .au-note') || {}).textContent || '' }));
    return [s.item === 'false' && s.sw === 'false' && !s.wand && s.note.length > 10, JSON.stringify(s)];
  });
  await t.__ctx.close();
} catch (e) { report(false, 'aurora: test run', String(e.stack || e).slice(0, 300)); }
finally { try { await browser.close(); } catch {} server.close(); }
process.exit(failed ? 1 : 0);
