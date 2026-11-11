// Headless-browser smoke test for the sparkle-that-page scroll companions (scroll_indicator.js): the still pictures
// (every family, look, state, light and dark: paths only, no font characters, four different states, families that
// differ in shape, an outline that reads on white and on near-black), the live element (progress 0 at the top to 1 at
// the bottom for every family, which way each one travels, a slow scroll is "is-moving", a fast one "is-holding" that
// leaves after, "is-end" at the bottom and back), reduced motion (no animation, classes still flip), no frame
// callbacks while idle, a live repaint on a theme flip, a strict CSP, odd names, destroy(), the size budget, and the
// gallery page (examples/scroll.html).
// Run: node tests/sparkle_scroll_smoke.mjs
//   SCROLL_JS=/path/to/copy.js points it at another copy of the effect file, to prove a check can fail.
// Prints one "PASS  name" / "FAIL  name" line per assertion. Exit 0 = all pass, 1 = a FAIL, 2 = Playwright or Chrome missing.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('playwright is not installed (run: npm install --prefix tests)'); process.exit(2); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXD = path.join(ROOT, 'plugins/sparkle-that-page/skills/sparkle-that-page/examples');
const JS = process.env.SCROLL_JS || path.join(EXD, 'scroll_indicator.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sparkle-scroll-'));
const FAMS = ['ring', 'comet', 'mascot', 'sprout', 'rocket', 'caterpillar', 'moon', 'balloon'];
const PIXEL = ['mascot', 'sprout', 'rocket', 'caterpillar', 'moon', 'balloon'];
const MASCOTS = ['cat', 'bunny', 'bear', 'frog'];
const STATES = ['idle', 'moving', 'holding', 'end'];
const LOOKS = [...MASCOTS.map(m => ['mascot', m]), ...PIXEL.slice(1).map(f => [f, null])];

// No inline style="" anywhere in these pages, so the CSP page raises no violation of its own.
const page_ = (attrs, head = '') => `<!doctype html><html${attrs}><head><meta charset="utf-8"><title>scroll</title>${head}<link rel="stylesheet" href="/__tall.css"></head><body><p id="txt">text</p><div class="tall">tall</div><script src="/__scroll__.js"></script></body></html>`;
fs.writeFileSync(path.join(TMP, '__tall.css'), 'body{margin:0} .tall{height:5000px} html.night body{background:#111}');
const CSP = `<meta http-equiv="Content-Security-Policy" content="style-src 'self'">`;
for (const f of [...FAMS, 'climber', '__proto__']) {
  fs.writeFileSync(path.join(TMP, `${f}.html`), page_(` data-scroll="${f}"`));
  fs.writeFileSync(path.join(TMP, `csp-${f}.html`), page_(` data-scroll="${f}"`, CSP));
}
for (const m of [...MASCOTS, 'constructor']) fs.writeFileSync(path.join(TMP, `m-${m}.html`), page_(` data-scroll="mascot" data-scroll-mascot="${m}"`));
fs.mkdirSync(path.join(TMP, 'nojs'));
fs.copyFileSync(path.join(EXD, 'scroll.html'), path.join(TMP, 'nojs', 'scroll.html'));   // the gallery with no .js next to it

const SPY = `(() => { const s = window.__spy = { raf: 0, observe: 0, disconnect: 0, csp: 0 };
  const r = window.requestAnimationFrame; window.requestAnimationFrame = f => { s.raf++; return r.call(window, f); };
  const MO = window.MutationObserver; window.MutationObserver = class extends MO {
    observe(t, o) { if (o && o.attributeFilter && o.attributeFilter.includes('data-theme')) { this.__w = 1; s.observe++; } return super.observe(t, o); }
    disconnect() { if (this.__w) s.disconnect++; return super.disconnect(); } };
  document.addEventListener('securitypolicyviolation', () => s.csp++);
  window.__norm = m => { const t = document.createElement('div'); t.innerHTML = m; return t.innerHTML; }; })();`;  // svg() markup as the DOM serialises it

const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.md': 'text/markdown' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file;
  if (url === '/__scroll__.js' || (url.endsWith('/scroll_indicator.js') && !url.startsWith('/nojs/'))) file = JS;
  else if (url.startsWith('/plugins/')) file = path.join(ROOT, path.normalize(url.slice(1)));
  else file = path.join(TMP, path.normalize(url.slice(1)));
  if (file !== JS && !file.startsWith(TMP) && !file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

let failed = 0, browser;
const report = (ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? '  (' + detail + ')' : ''}`); };
const check = async (name, fn) => { try { const [ok, detail] = await fn(); report(ok, name, detail); } catch (e) { report(false, name, 'threw: ' + String(e.message || e).slice(0, 200)); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
try { browser = await chromium.launch({ channel: 'chrome' }); }
catch { try { browser = await chromium.launch(); } catch { console.log('no Chrome / Chromium for Playwright'); server.close(); process.exit(2); } }

const open = async (file, opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, ...opts });
  await ctx.addInitScript(SPY);
  const page = await ctx.newPage();
  page.__errors = []; page.on('pageerror', e => page.__errors.push(e.message));
  await page.goto(`${ORIGIN}/${file}`);
  await page.waitForFunction(() => window.SparkleThatPage && window.SparkleThatPage.scrollIndicator);
  return page;
};
const close = page => page.context().close();
// scroll by `step` px on each of `n` frames, inside the page, so the speed is deterministic
const drive = (page, step, n) => page.evaluate(([s, k]) => new Promise(r => { let i = 0; (function f() { scrollBy(0, s); if (++i < k) requestAnimationFrame(f); else setTimeout(r, 20); })(); }), [step, n]);
const live = page => page.evaluate(() => {
  const e = document.querySelector('[data-stp-scroll]'); if (!e) return null;
  const r = e.getBoundingClientRect(), all = [e, ...e.querySelectorAll('*')];
  return { fam: e.getAttribute('data-stp-scroll'), p: +e.getAttribute('data-stp-progress'), api: window.SparkleThatPage.scrollIndicator.progress(), state: e.getAttribute('data-stp-state'),
    moving: e.classList.contains('is-moving'), holding: e.classList.contains('is-holding'), end: e.classList.contains('is-end'),
    x: Math.round(r.left), y: Math.round(r.top), w: r.width, h: r.height, html: e.innerHTML, anims: all.reduce((n, x) => n + x.getAnimations().length, 0), own: e.getAnimations().length };
});
const toTop = page => page.evaluate(() => scrollTo(0, 0));
const toMid = page => page.evaluate(() => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2));
const toEnd = page => page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));

try {
  // ---- 1. the stills -------------------------------------------------------------------------------------------
  let page = await open('mascot.html');
  await check('scroll api: families, mascots and states are the documented lists', async () => {
    const a = await page.evaluate(() => { const A = window.SparkleThatPage.scrollIndicator; return [A.families, A.mascots, A.states, typeof A.svg, typeof A.progress, typeof A.state]; });
    return [JSON.stringify(a.slice(0, 3)) === JSON.stringify([FAMS, MASCOTS, STATES]) && a.slice(3).every(t => t === 'function'), JSON.stringify(a)];
  });
  const stills = await page.evaluate(([LOOKS, STATES]) => {
    const A = window.SparkleThatPage.scrollIndicator, out = [];
    for (const [f, m] of LOOKS) for (const st of STATES) for (const dark of [false, true]) out.push({ f, m, st, dark, s: A.svg(f, st, dark, { mascot: m }) });
    for (const f of ['ring', 'comet']) for (const st of STATES) for (const dark of [false, true]) out.push({ f, m: null, st, dark, s: A.svg(f, st, dark) });
    return out;
  }, [LOOKS, STATES]);
  await check('scroll stills: every family, look, state and theme is an <svg> of paths only (no text, no font characters, parses cleanly)', async () => {
    const bad = await page.evaluate(stills => stills.filter(x => {
      const d = new DOMParser().parseFromString(x.s, 'image/svg+xml');
      if (d.querySelector('parsererror') || d.documentElement.nodeName !== 'svg') return true;
      if (/[^\x20-\x7e]/.test(x.s) || /<text|<foreignObject|<image/i.test(x.s)) return true;
      const tags = [...d.documentElement.querySelectorAll('*')].map(n => n.nodeName);
      const allowed = x.f === 'ring' ? ['circle'] : ['path', 'g'];
      return !tags.length || tags.some(t => !allowed.includes(t)) || (x.f !== 'ring' && !d.querySelector('path[d]'));
    }).map(x => `${x.f}/${x.m}/${x.st}/${x.dark}`), stills);
    return [bad.length === 0 && stills.length === (LOOKS.length + 2) * 8, `${stills.length} stills, bad: ${bad.slice(0, 6).join(', ')}`];
  });
  await check('scroll stills: each look\'s four states are four different pictures', async () => {
    const same = [];
    for (const [f, m] of LOOKS) for (const dark of [false, true]) {
      const set = new Set(stills.filter(x => x.f === f && x.m === m && x.dark === dark).map(x => x.s));
      if (set.size !== 4) same.push(`${m || f}/${dark ? 'dark' : 'light'}: ${set.size}`);
    }
    return [same.length === 0, same.join(', ')];
  });
  await check('scroll stills: the nine looks differ in shape, not just colour (idle silhouettes pairwise different)', async () => {
    const shape = s => s.replace(/fill="[^"]*"/g, '');
    const idle = LOOKS.map(([f, m]) => shape(stills.find(x => x.f === f && x.m === m && x.st === 'idle' && !x.dark).s));
    const dup = []; for (let i = 0; i < idle.length; i++) for (let j = i + 1; j < idle.length; j++) if (idle[i] === idle[j]) dup.push(`${LOOKS[i]} = ${LOOKS[j]}`);
    return [dup.length === 0, dup.join('; ')];
  });
  await check('scroll stills: the edge of every picture contrasts at least 3:1 with a white page and with a near-black one', async () => {
    const res = await page.evaluate(async stills => {
      const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
      const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const bad = [];
      for (const x of stills) {
        if (x.f === 'ring' || x.f === 'comet') continue;   // the two classics keep their 1.x colours
        const bg = x.dark ? [18, 16, 22] : [255, 255, 255];
        const img = new Image(); img.src = 'data:image/svg+xml,' + encodeURIComponent(x.s); await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);   // transparent canvas: the silhouette is where alpha > 0
        const d = g.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height, clear = (X, Y) => X < 0 || Y < 0 || X >= W || Y >= H || d[(Y * W + X) * 4 + 3] === 0;
        let edge = 0, good = 0;
        for (let y = 0; y < H; y++) for (let x2 = 0; x2 < W; x2++) {
          const i = (y * W + x2) * 4; if (d[i + 3] === 0) continue;
          if (!(clear(x2 + 1, y) || clear(x2 - 1, y) || clear(x2, y + 1) || clear(x2, y - 1))) continue;
          edge++; if (ratio([d[i], d[i + 1], d[i + 2]], bg) >= 3) good++;   // the pixels a page sees first
        }
        if (!edge || good / edge < 0.85) bad.push(`${x.m || x.f}/${x.st}/${x.dark ? 'dark' : 'light'} ${(good / edge * 100).toFixed(0)}%`);
      }
      return bad;
    }, stills);
    return [res.length === 0, res.slice(0, 8).join(', ')];
  });
  await check('scroll stills: sprout grows and moon fills as progress goes 0 → 1 (more leaf / lit cells at each step)', async () => {
    const r = await page.evaluate(() => {
      const A = window.SparkleThatPage.scrollIndicator, count = (s, col) => [...s.matchAll(new RegExp('fill="(?:' + col + ')" d="([^"]*)"', 'g'))].reduce((n, m) => n + [...m[1].matchAll(/h(\d+)/g)].reduce((a, h) => a + +h[1], 0), 0);
      const steps = [0, 0.25, 0.5, 0.75, 1];
      return { sprout: steps.map(p => count(A.svg('sprout', 'idle', false, { progress: p }), '#4ade80|#15803d')), moon: steps.map(p => count(A.svg('moon', 'idle', false, { progress: p }), '#fde68a') + count(A.svg('moon', 'idle', false, { progress: p }), '#f2c94c')) };
    });
    const up = a => a.every((v, i) => !i || v > a[i - 1]);
    return [up(r.sprout) && up(r.moon) && r.moon[0] === 0, JSON.stringify(r)];
  });
  await check('scroll stills: odd names fall back instead of crashing (svg("__proto__"), mascot "constructor", state "nope")', async () => {
    const r = await page.evaluate(() => { const A = window.SparkleThatPage.scrollIndicator; return [A.svg('__proto__', 'nope', false, { mascot: 'constructor' }), A.svg('mascot', 'idle', false, { mascot: 'cat' }), A.svg('climber', 'idle', false)]; });
    return [r[0] === r[1] && r[2] === r[1], r[0].slice(0, 60)];
  });
  await close(page);

  // ---- 2. the live element: progress, direction, end, per family ------------------------------------------------
  for (const f of FAMS) {
    await check(`scroll ${f}: progress is 0 at the top, about half in the middle, 1 at the bottom; is-end only at the bottom and gone back at the top`, async () => {
      const pg = await open(`${f}.html`);
      const a = await live(pg); await toMid(pg); await sleep(350); const b = await live(pg); await toEnd(pg); await sleep(350); const c = await live(pg); await toTop(pg); await sleep(350); const d = await live(pg);
      await close(pg);
      const ok = a.p === 0 && a.api === 0 && b.p > 0.4 && b.p < 0.6 && Math.abs(b.api - b.p) < 0.002 && c.p === 1 && c.api === 1 && d.p === 0 && !a.end && !b.end && c.end && !d.end && c.state === 'end' && d.state === 'idle' && a.fam === f;
      return [ok, `p ${a.p}/${b.p}/${c.p}/${d.p}, end ${a.end}/${b.end}/${c.end}/${d.end}, state ${c.state}/${d.state}`];
    });
  }
  await check('scroll travel: mascot climbs down the right rail, rocket and balloon rise up it, caterpillar crawls right along the bottom, sprout and moon stay put and change', async () => {
    const out = {};
    for (const f of PIXEL) {
      const pg = await open(`${f}.html`);
      await sleep(300); const a = await live(pg); await toEnd(pg); await sleep(350); const b = await live(pg);
      out[f] = { dx: b.x - a.x, dy: b.y - a.y, changed: a.html !== b.html, right: a.x + a.w, bottom: a.y + a.h, track: await pg.evaluate(() => document.querySelectorAll('.stp-scroll-track').length) };
      await close(pg);
    }
    const o = out, V = (k) => o[k].dx === 0 && o[k].right > 740 && o[k].track === 1;
    const ok = V('mascot') && o.mascot.dy > 400 && V('rocket') && o.rocket.dy < -400 && V('balloon') && o.balloon.dy < -400 &&
      o.caterpillar.dx > 600 && o.caterpillar.dy === 0 && o.caterpillar.bottom > 590 && o.caterpillar.track === 1 &&
      ['sprout', 'moon'].every(k => o[k].dx === 0 && o[k].dy === 0 && o[k].changed && o[k].track === 0);
    return [ok, JSON.stringify(o)];
  });
  await check('scroll mascot: data-scroll="mascot" (and "climber") is a pixel cat face; data-scroll-mascot picks bunny / bear / frog; "constructor" falls back to the cat', async () => {
    const got = {};
    for (const n of ['mascot', 'climber', ...MASCOTS.map(m => 'm-' + m), 'm-constructor']) {
      const pg = await open(`${n}.html`);
      got[n] = await pg.evaluate(() => { const e = document.querySelector('[data-stp-scroll]'), A = window.SparkleThatPage.scrollIndicator; const svg = e.querySelector('svg');
        return { fam: e.getAttribute('data-stp-scroll'), crisp: svg && svg.getAttribute('shape-rendering'), which: ['cat', 'bunny', 'bear', 'frog'].find(m => svg.outerHTML === window.__norm(A.svg('mascot', 'idle', false, { mascot: m, progress: 0 }))) || '?', errors: 0 }; });
      got[n].errors = pg.__errors.length;
      await close(pg);
    }
    const ok = Object.values(got).every(g => g.fam === 'mascot' && g.crisp === 'crispEdges' && !g.errors) && got.mascot.which === 'cat' && got.climber.which === 'cat' &&
      MASCOTS.every(m => got['m-' + m].which === m) && got['m-constructor'].which === 'cat';
    return [ok, JSON.stringify(got)];
  });
  await check('scroll odd variant: data-scroll="__proto__" falls back to the ring with no page error', async () => {
    const pg = await open('__proto__.html'); const l = await live(pg); const e = pg.__errors.length; await close(pg);
    return [l && l.fam === 'ring' && e === 0, `${l && l.fam}, errors ${e}`];
  });

  // ---- 3. moving / holding / settle, and motion ------------------------------------------------------------------
  for (const f of PIXEL) {
    await check(`scroll ${f}: a slow scroll is is-moving (not holding) with a sway; a fast one is is-holding; both leave once scrolling stops, and nothing animates or asks for frames while idle`, async () => {
      const pg = await open(`${f}.html`);
      await pg.evaluate(() => scrollTo(0, 300)); await sleep(400);
      await drive(pg, 6, 20); const slow = await live(pg);
      await sleep(500); const settled = await live(pg);
      await drive(pg, 160, 8); const fast = await live(pg);
      await sleep(500); const after = await live(pg);
      const raf0 = await pg.evaluate(() => window.__spy.raf); await sleep(700); const raf1 = await pg.evaluate(() => window.__spy.raf);
      const idleAnims = (await live(pg)).anims;
      await close(pg);
      const allowIdle = f === 'balloon' ? 1 : 0;   // the balloon bobs while idle (a browser-run animation, no frames asked)
      const ok = slow.moving && !slow.holding && slow.state === 'moving' && slow.own > allowIdle && !settled.moving && !settled.holding && settled.state === 'idle' &&
        fast.holding && fast.state === 'holding' && fast.own > allowIdle && !after.holding && !after.moving && after.state === 'idle' && raf1 === raf0 && idleAnims === allowIdle;
      return [ok, `slow ${slow.state}/${slow.moving}/${slow.holding}/${slow.own} anims, settled ${settled.state}, fast ${fast.state}/${fast.holding}/${fast.own}, after ${after.state}, idle rAF ${raf1 - raf0}, idle anims ${idleAnims}`];
    });
  }
  await check('scroll pictures follow the state: idle, moving, holding and end each show their own still from svg()', async () => {
    const pg = await open('m-bunny.html');
    const same = async st => pg.evaluate(st => { const e = document.querySelector('[data-stp-scroll]'), A = window.SparkleThatPage.scrollIndicator; return e.querySelector('svg').outerHTML === window.__norm(A.svg('mascot', st, false, { mascot: 'bunny' })); }, st);
    await pg.evaluate(() => scrollTo(0, 300)); await sleep(400);
    const r = { idle: await same('idle') };
    await drive(pg, 6, 20); r.moving = await same('moving');
    await drive(pg, 160, 8); r.holding = await same('holding');
    await toEnd(pg); await sleep(400); r.end = await same('end');
    await close(pg);
    return [Object.values(r).every(Boolean), JSON.stringify(r)];
  });
  await check('scroll reduced motion: no animation at all (no sway, shiver, bob, hop), yet is-moving / is-holding / is-end still flip and progress tracks', async () => {
    const res = {};
    for (const f of PIXEL) {
      const pg = await open(`${f}.html`, { reducedMotion: 'reduce' });
      await pg.evaluate(() => scrollTo(0, 300)); await sleep(300);
      await drive(pg, 6, 20); const s = await live(pg);
      await drive(pg, 160, 8); const h = await live(pg);
      await toEnd(pg); await sleep(60); const e = await live(pg);
      await sleep(500); const z = await live(pg);
      res[f] = [s.moving, h.holding, e.end, e.p, s.anims + h.anims + e.anims + z.anims, z.state];
      await close(pg);
    }
    const ok = Object.values(res).every(r => r[0] && r[1] && r[2] && r[3] === 1 && r[4] === 0 && r[5] === 'end');
    return [ok, JSON.stringify(res)];
  });
  await check('scroll cheer: reaching the bottom starts one hop on the inner picture (not before), for every pixel family', async () => {
    const res = {};
    for (const f of PIXEL) {
      const pg = await open(`${f}.html`);
      const kids = () => pg.evaluate(() => { const e = document.querySelector('[data-stp-scroll]'); return [...e.querySelectorAll('*')].reduce((n, x) => n + x.getAnimations().length, 0); });
      await toMid(pg); await sleep(400); const before = await kids();
      await toEnd(pg); await sleep(80); const at = await kids();
      res[f] = [before, at]; await close(pg);
    }
    return [Object.values(res).every(r => r[0] === 0 && r[1] > 0), JSON.stringify(res)];
  });

  // ---- 4. theme, CSP, no glyphs, no blocking --------------------------------------------------------------------
  await check('scroll theme: flipping data-theme to dark repaints the live companion and its rail without a reload (and back)', async () => {
    const pg = await open('m-frog.html');
    const look = () => pg.evaluate(() => [document.querySelector('[data-stp-scroll] svg').outerHTML, document.querySelector('.stp-scroll-track').style.background]);
    const want = d => pg.evaluate(d => window.__norm(window.SparkleThatPage.scrollIndicator.svg('mascot', 'idle', d, { mascot: 'frog' })), d);
    const a = await look();
    await pg.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark')); await sleep(100); const b = await look();
    await pg.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await sleep(100); const c = await look();
    const wl = await want(false), wd = await want(true);
    await close(pg);
    return [a[0] === wl && b[0] === wd && c[0] === a[0] && b[1] !== a[1] && c[1] === a[1], `light picture ok ${a[0] === wl}, dark picture ok ${b[0] === wd}, rail ${a[1].slice(0, 50)} -> ${b[1].slice(0, 50)}`];
  });
  await check('scroll theme: with no data-theme, a class that turns <body> dark repaints the ring, the comet star and the rocket', async () => {
    const r = {};
    for (const f of ['ring', 'comet', 'rocket']) {
      const pg = await open(`${f}.html`);
      const snap = () => pg.evaluate(() => document.querySelector('[data-stp-scroll]').innerHTML);
      const a = await snap(); await pg.evaluate(() => document.documentElement.classList.add('night')); await sleep(100); const b = await snap();
      await pg.evaluate(() => document.documentElement.classList.remove('night')); await sleep(100); const c = await snap();
      r[f] = a !== b && a === c; await close(pg);
    }
    return [Object.values(r).every(Boolean), JSON.stringify(r)];
  });
  await check('scroll CSP: under style-src \'self\' every family appears, is fixed in place, and raises no policy violation', async () => {
    const r = {};
    for (const f of FAMS) {
      const pg = await open(`csp-${f}.html`);
      await toEnd(pg); await sleep(200);
      r[f] = await pg.evaluate(() => { const e = document.querySelector('[data-stp-scroll]'); return [window.__spy.csp, getComputedStyle(e).position, e.getBoundingClientRect().width > 0]; });
      r[f].push(pg.__errors.length); await close(pg);
    }
    return [Object.values(r).every(x => x[0] === 0 && x[1] === 'fixed' && x[2] && x[3] === 0), JSON.stringify(r)];
  });
  await check('scroll no font characters: the live element has no text except the ring\'s percentage, and the comet\'s head is a drawn path', async () => {
    const r = {};
    for (const f of FAMS) {
      const pg = await open(`${f}.html`);
      r[f] = await pg.evaluate(() => { const e = document.querySelector('[data-stp-scroll]'); return [e.textContent.trim(), !!e.querySelector('path'), e.querySelectorAll('text').length]; });
      await close(pg);
    }
    const ok = Object.entries(r).every(([f, x]) => (f === 'ring' ? /^\d+%$/.test(x[0]) : x[0] === '' && x[1]) && x[2] === 0);
    return [ok, JSON.stringify(r)];
  });
  await check('scroll does not cover content: the companion and its rail let clicks through and stay small (≤ 72 px)', async () => {
    const r = {};
    for (const f of PIXEL) {
      const pg = await open(`${f}.html`);
      await toMid(pg); await sleep(300);
      r[f] = await pg.evaluate(() => { const e = document.querySelector('[data-stp-scroll]'), t = document.querySelector('.stp-scroll-track'), b = e.getBoundingClientRect();
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return [getComputedStyle(e).pointerEvents, t ? getComputedStyle(t).pointerEvents : 'none', !e.contains(hit) && hit !== t, Math.max(b.width, b.height)]; });
      await close(pg);
    }
    return [Object.values(r).every(x => x[0] === 'none' && x[1] === 'none' && x[2] && x[3] <= 72), JSON.stringify(r)];
  });

  // ---- 5. start / destroy ----------------------------------------------------------------------------------------
  await check('scroll destroy(): removes the companion and rail, disconnects the theme watcher, stops timers and scroll work; start() twice adds one; start() re-reads data-scroll', async () => {
    const pg = await open('rocket.html');
    const r = await pg.evaluate(async () => {
      const A = window.SparkleThatPage.scrollIndicator, s = window.__spy, wait = ms => new Promise(r => setTimeout(r, ms));
      A.start(); const twice = document.querySelectorAll('[data-stp-scroll]').length;
      scrollBy(0, 40); await wait(30);
      A.destroy();
      const gone = [document.querySelectorAll('[data-stp-scroll]').length, document.querySelectorAll('.stp-scroll-track').length, s.observe, s.disconnect, A.progress()];
      const raf0 = s.raf; scrollBy(0, 300); await wait(400); document.documentElement.setAttribute('data-theme', 'dark'); await wait(50);
      const quiet = s.raf - raf0;
      document.documentElement.dataset.scroll = 'moon'; A.start();
      return { twice, gone, quiet, again: document.querySelector('[data-stp-scroll]').getAttribute('data-stp-scroll') };
    });
    const errs = pg.__errors.length; await close(pg);
    const ok = r.twice === 1 && r.gone[0] === 0 && r.gone[1] === 0 && r.gone[2] >= 1 && r.gone[3] === r.gone[2] && r.gone[4] === null && r.quiet === 0 && r.again === 'moon' && errs === 0;
    return [ok, JSON.stringify(r) + ` errors ${errs}`];
  });
  await check('scroll ring: on a white page the arc and the percentage are at least 4.5:1, on a dark page at least 3:1', async () => {
    const pg = await open('ring.html');
    const grab = () => pg.evaluate(() => { const r = document.querySelector('.stp-ring'), l = document.querySelector('.stp-pct');
      const rgb = c => (c.match(/\d+/g) || []).slice(0, 3).map(Number), hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
      return { arc: hex(r.getAttribute('stroke')), pct: rgb(getComputedStyle(l).color) }; });
    const light = await grab();
    await pg.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark')); await sleep(150);
    const dark = await grab(); await close(pg);
    const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const W = [255, 255, 255], K = [18, 16, 22], r = [ratio(light.arc, W), ratio(light.pct, W), ratio(dark.arc, K), ratio(dark.pct, K)];
    return [r[0] >= 4.5 && r[1] >= 4.5 && r[2] >= 3 && r[3] >= 3, r.map(v => v.toFixed(2)).join(' / ')];
  });
  await check('scroll holding: the first scroll after load (a restored position) is ignored, but a later big jump still counts as holding on', async () => {
    const pg = await open('mascot.html');
    await pg.evaluate(() => scrollTo(0, 3000)); await sleep(120);
    const first = await live(pg); await sleep(350);
    await pg.evaluate(() => scrollTo(0, 100)); await sleep(120);
    const second = await live(pg); await close(pg);
    return [!first.holding && !first.moving && second.holding, `first ${first.state}, second ${second.state}`];
  });
  await check('scroll size: the effect file stays within the 32 KB budget', async () => {
    const n = fs.statSync(JS).size; return [n <= 32 * 1024, `${n} bytes`];
  });

  // ---- 6. the gallery --------------------------------------------------------------------------------------------
  const G = 'plugins/sparkle-that-page/skills/sparkle-that-page/examples/scroll.html';
  await check('scroll gallery: loads without errors; a card per look with its four states as stills; links to the demo and the guide', async () => {
    const pg = await open(G);
    const r = await pg.evaluate(() => ({
      cards: [...document.querySelectorAll('.card[data-family]')].map(c => [c.getAttribute('data-family') + (c.getAttribute('data-mascot') ? ':' + c.getAttribute('data-mascot') : ''), c.querySelectorAll('.states svg').length]),
      links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')), tall: document.documentElement.scrollHeight / innerHeight }));
    const errs = pg.__errors.length; await close(pg);
    const want = [...MASCOTS.map(m => 'mascot:' + m), 'sprout', 'rocket', 'caterpillar', 'moon', 'balloon'];
    const names = r.cards.map(c => c[0]);
    const ok = errs === 0 && want.every(w => names.includes(w)) && r.cards.every(c => c[1] >= 4) && r.links.some(h => /demo\.html$/.test(h)) && r.links.some(h => /references\/scroll-mascots\.md$/.test(h)) && r.tall > 3;
    return [ok, `errors ${errs}, cards ${JSON.stringify(r.cards)}, tall ${r.tall.toFixed(1)}`];
  });
  await check('scroll gallery: clicking a card puts that companion live on the page; the toggle flips the page dark, saves it under stp:theme, and the companion repaints', async () => {
    const pg = await open(G);
    await pg.click('.card[data-family="rocket"]'); await sleep(100);
    const a = await live(pg);
    await pg.click('.card[data-mascot="frog"]'); await sleep(100);
    const b = await pg.evaluate(() => [document.querySelector('[data-stp-scroll]').getAttribute('data-stp-scroll'), document.documentElement.dataset.scrollMascot, document.querySelectorAll('[data-stp-scroll]').length]);
    const before = (await live(pg)).html;
    const t0 = await pg.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await pg.click('#theme'); await sleep(150);
    const t1 = await pg.evaluate(() => [document.documentElement.getAttribute('data-theme'), localStorage.getItem('stp:theme')]);
    const after = (await live(pg)).html;
    await close(pg);
    const ok = a.fam === 'rocket' && b[0] === 'mascot' && b[1] === 'frog' && b[2] === 1 && t1[0] !== t0 && t1[1] === t1[0] && before !== after;
    return [ok, `${a.fam}, ${b}, theme ${t0} -> ${t1}, repainted ${before !== after}`];
  });
  await check('scroll gallery: every card has a real button that puts it on the page from the keyboard, and the card itself is not a focus stop', async () => {
    const pg = await open(G);
    const r = await pg.evaluate(() => ({ cards: document.querySelectorAll('.card[data-family]').length, buttons: document.querySelectorAll('.card[data-family] > button.choose').length,
      tab: document.querySelectorAll('.card[tabindex]').length, names: [...document.querySelectorAll('.card button.choose')].every(b => /^Put .+ on this page$/.test(b.textContent)) }));
    await pg.focus('.card[data-family="balloon"] button.choose'); await pg.keyboard.press('Enter'); await sleep(100);
    const fam = await pg.evaluate(() => document.querySelector('[data-stp-scroll]').getAttribute('data-stp-scroll'));
    await close(pg);
    return [r.cards >= 9 && r.buttons === r.cards && r.tab === 0 && r.names && fam === 'balloon', JSON.stringify(r) + ` live ${fam}`];
  });
  await check('scroll gallery: with scroll_indicator.js missing it says so instead of showing an empty page, and the Dark page switch still works without an error', async () => {
    const ctx = await browser.newContext(); const pg = await ctx.newPage();
    await pg.goto(`${ORIGIN}/nojs/scroll.html`); await sleep(200);
    const errs = []; pg.on('pageerror', e => errs.push(e.message));
    const t = await pg.evaluate(() => document.body.innerText);
    await pg.click('#theme'); await sleep(100);   // the Dark page switch must not throw without the effect file
    await ctx.close();
    return [/scroll_indicator\.js was not found/.test(t) && errs.length === 0, t.slice(0, 120) + ' errors ' + errs.join('|')];
  });
} finally {
  await browser.close();
  server.close();
  fs.rmSync(TMP, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
