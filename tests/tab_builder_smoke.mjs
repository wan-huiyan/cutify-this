// Headless-browser smoke test for cutify-that-tab's examples/builder.html: every subject x style renders a
// valid 16x16 crispEdges SVG whose pixels match the builder's grid; the page's JS check agrees with
// scripts/check-favicon.py (exit code and every check status) on every combination and on files saved
// through the real Download button (saved as favicon.svg / favicon-dark.svg); the same JS check agrees with Python on
// every shipped SVG and fixture (gradients, tiles, transforms, broken XML: files the builder never makes);
// Copy SVG writes the clipboard, its execCommand fallback and its "Copy failed" state work; the code panels stay open
// across picks; keyboard, favicon, dark scheme, reduced motion and 375 px width.
// Run directly: node tests/tab_builder_smoke.mjs (or via scripts/check-all.sh once it is wired in).
// Prints one "PASS name" / "FAIL name" line per assertion. Exit 0 = all pass, 1 = a FAIL,
// 2 = Playwright, a browser or python3 is not available.
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
const SKILL = '/plugins/cutify-that-tab/skills/cutify-that-tab';
const CHECKER = path.join(ROOT, SKILL, 'scripts/check-favicon.py');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tab-builder-smoke-'));   // exported SVGs live here, never in the repo
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.md': 'text/plain' };
if (spawnSync('python3', ['--version']).status !== 0) { console.log('python3 is not available'); process.exit(2); }

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, path.normalize(decodeURIComponent(req.url.split('?')[0])));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
const URL_ = `${ORIGIN}${SKILL}/examples/builder.html`;

let failed = 0;
const report = (ok, name, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' - ' + detail : ''}`); if (!ok) failed++; };

// python3 check-favicon.py -> { exit, rows: Map("file|key" -> status) }
function python(light, dark) {
  const args = [CHECKER, light, ...(dark ? ['--dark', dark] : [])];
  const r = spawnSync('python3', args, { encoding: 'utf8' });
  const rows = new Map(); let file = '';
  for (const line of r.stdout.split('\n')) {
    const h = line.match(/^== (.*)$/); if (h) { file = h[1].startsWith('dark:') ? 'dark' : 'light'; continue; }
    const m = line.match(/^ {2}(\S+)\s+(\S+)\s/); if (m) rows.set(`${file}|${m[2]}`, m[1]);
  }
  return { exit: r.status, rows, out: r.stdout };
}
const jsRows = ck => new Map(ck.rows.map(r => [`${r.file.endsWith('dark.svg') ? 'dark' : 'light'}|${r.key}`, r.status]));
const sameRows = (a, b) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);
const diff = (a, b) => [...new Set([...a.keys(), ...b.keys()])].filter(k => a.get(k) !== b.get(k)).map(k => `${k}: js ${a.get(k)} / py ${b.get(k)}`).join('; ');

let browser;
try { browser = await chromium.launch(); }
catch { try { browser = await chromium.launch({ channel: 'chrome' }); }
        catch (e) { console.log('no browser available: ' + e.message.split('\n')[0]); server.close(); process.exit(2); } }

try {
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGIN });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto(URL_);
  await page.waitForFunction(() => window.builder && window.builder.current);
  report(errors.length === 0, 'page loads without console errors', errors.join(' | '));

  const { subjects, styles, palettes } = await page.evaluate(() => ({ subjects: window.builder.subjects, styles: window.builder.styles,
    palettes: Object.fromEntries(window.builder.styles.map(s => [s, window.builder.palettes(s)])) }));
  report(subjects.length >= 6 && styles.length >= 6, 'at least 6 subjects and 6 styles', `${subjects.length} subjects, ${styles.length} styles`);

  // 1. every subject x style x preset palette (1-bit with and without its dark pair): valid SVG, pixels = grid
  const combos = [];
  for (const style of styles) for (const palette of (palettes[style].length ? palettes[style] : [undefined])) for (const subject of subjects) {
    combos.push({ subject, style, palette, pair: false });
    if (style === 'silhouette') combos.push({ subject, style, palette, pair: true });
  }
  const results = await page.evaluate(async combos => {
    const out = [];
    const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    for (const o of combos) {
      const r = window.builder.render(o);
      const problems = [];
      for (const [label, svg, grid] of [['light', r.light, r.grid], ...(r.dark ? [['dark', r.dark, null]] : [])]) {
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        const root = doc.documentElement;
        if (doc.getElementsByTagName('parsererror').length) { problems.push(label + ': does not parse'); continue; }
        if (root.localName !== 'svg') problems.push(label + ': root is not <svg>');
        if (root.getAttribute('viewBox') !== '0 0 16 16') problems.push(label + ': viewBox is ' + root.getAttribute('viewBox'));
        if (root.getAttribute('shape-rendering') !== 'crispEdges') problems.push(label + ': no crispEdges');
        if (svg.length > 2500) problems.push(label + `: ${svg.length} bytes`);
        if (!grid) continue;
        // draw at real 16 px and compare every painted cell, and every empty cell outside the tile
        const img = new Image(16, 16);
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/svg+xml,' + encodeURIComponent(svg); });
        const c = Object.assign(document.createElement('canvas'), { width: 16, height: 16 });
        const g = c.getContext('2d'); g.drawImage(img, 0, 0, 16, 16);
        const px = g.getImageData(0, 0, 16, 16).data;
        let bad = 0, painted = 0;
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
          const i = (y * 16 + x) * 4, want = grid[y][x];
          if (want) { painted++; const [R, G, B] = rgb(want); if (px[i] !== R || px[i + 1] !== G || px[i + 2] !== B || px[i + 3] !== 255) bad++; }
          else if (!r.tile && px[i + 3] !== 0) bad++;
        }
        if (!painted) problems.push(label + ': nothing painted');
        if (bad) problems.push(`${label}: ${bad} pixels differ from the grid at 16 px`);
      }
      out.push({ ...o, light: r.light, dark: r.dark, exit: r.check.exit, rows: r.check.rows.map(({ file, key, status }) => ({ file, key, status })), problems });
    }
    return out;
  }, combos);
  const broken = results.filter(r => r.problems.length);
  report(broken.length === 0, `every subject x style x preset palette renders a valid 16x16 crispEdges SVG matching its grid (${results.length} renders)`,
    broken.slice(0, 4).map(r => `${r.subject}/${r.style}/${r.palette}${r.pair ? '+pair' : ''}: ${r.problems.join(', ')}`).join(' | '));
  const notPassing = results.filter(r => r.exit !== 0);
  report(notPassing.length === 0, `every preset combination passes the JS check (exit 0, no margin FAIL; ${results.length} renders)`,
    notPassing.map(r => `${r.subject}/${r.style}/${r.palette}: exit ${r.exit}`).join(', '));
  const maxBytes = Math.max(...results.map(r => r.light.length));
  report(maxBytes <= 2500, 'exported SVGs are small', `largest ${maxBytes} bytes`);

  // 2. the JS check agrees with check-favicon.py on every combination: exit code and every check's status
  const disagree = [];
  for (const r of results) {
    const base = path.join(TMP, `${r.subject}-${r.style}-${r.palette || 'fixed'}${r.pair ? '-pair' : ''}`);
    fs.writeFileSync(base + '.svg', r.light);
    if (r.dark) fs.writeFileSync(base + '-dark.svg', r.dark);
    const py = python(base + '.svg', r.dark ? base + '-dark.svg' : null);
    const js = jsRows(r);
    if (py.exit !== r.exit || !sameRows(js, py.rows)) disagree.push(`${path.basename(base)}: js exit ${r.exit} / py exit ${py.exit}; ${diff(js, py.rows)}`);
  }
  report(disagree.length === 0, `JS check matches check-favicon.py on all ${results.length} renders (exit code + every check)`, disagree.slice(0, 3).join(' | '));

  // 2b. the same comparison on files the builder did NOT make: every shipped example, mood and fixture SVG with its _dark pair.
  // Builder output is only plain <rect>s, so gradients, style=, tiles with transforms and broken XML are only exercised here.
  const skillDir = path.join(ROOT, SKILL), sweep = [];
  for (const d of ['examples', 'examples/moods', 'scripts/fixtures']) {
    for (const f of fs.readdirSync(path.join(skillDir, d)).filter(f => f.endsWith('.svg') && !f.endsWith('_dark.svg')).sort()) {
      const dk = path.join(skillDir, d, f.replace(/\.svg$/, '_dark.svg'));
      sweep.push([path.join(skillDir, d, f), fs.existsSync(dk) ? dk : null]);
    }
  }
  const own = path.join(skillDir, 'scripts/fixtures/good_silhouette.svg');
  sweep.push([own, own]);                       // a dark-body icon used as its own dark file: must FAIL in both
  const sweepDis = []; let sweepTile = null, sweepGrad = 0;
  for (const [l, d] of sweep) {
    const lt = fs.readFileSync(l, 'utf8'), dt = d ? fs.readFileSync(d, 'utf8') : null;
    const js = await page.evaluate(([a, b]) => window.builder.check(a, b), [lt, dt]);
    const py = python(l, d), jr = jsRows(js);
    if (/tile_transform\.svg$/.test(l)) sweepTile = py.rows.get('light|margin');
    if (/linearGradient|radialGradient/.test(lt)) sweepGrad++;
    if (py.exit !== js.exit || !sameRows(jr, py.rows)) sweepDis.push(`${path.relative(skillDir, l)}${d ? ' +dark' : ''}: js exit ${js.exit} / py exit ${py.exit}; ${diff(jr, py.rows)}`);
  }
  report(sweepDis.length === 0, `JS check matches check-favicon.py on all ${sweep.length} shipped SVGs and fixtures (${sweepGrad} with gradients; exit code + every check)`, sweepDis.slice(0, 3).join(' | '));
  report(sweepTile === 'UNCHECKED', 'the sweep reaches the tile-with-a-transform path (tile_transform.svg: margin UNCHECKED in Python)', `python margin ${sweepTile}`);

  // 3. three (plus two) exports through the real Download button, checked by Python, compared with the badges
  async function downloadVia(id, file) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#' + id)]);
    const to = path.join(TMP, file); await dl.saveAs(to); return { to, suggested: dl.suggestedFilename() };
  }
  const badges = () => page.$$eval('[data-tab]', els => Object.fromEntries(els.map(e => [e.dataset.tab, e.dataset.state])));
  const verdict = () => page.$eval('#verdict', e => Number(e.dataset.exit));
  const cases = [
    { name: 'kawaii cat, pink', set: { subject: 'cat', style: 'kawaii', palette: 'pink', pair: false }, exit: 0,
      badges: { 'Light active': 'pass', 'Light inactive': 'pass', 'Dark active': 'pass', 'Dark inactive': 'pass' } },
    { name: '1-bit cat, charcoal, no dark pair (dark tabs only WARN)', set: { subject: 'cat', style: 'silhouette', palette: 'charcoal', pair: false }, exit: 0,
      badges: { 'Light active': 'pass', 'Light inactive': 'pass', 'Dark active': 'warn', 'Dark inactive': 'warn' } },
    { name: 'kawaii ghost, custom pink-50 #fbcfe8 (should FAIL)', set: { subject: 'ghost', style: 'kawaii', palette: 'custom', custom: '#fbcfe8', pair: false }, exit: 1,
      badges: { 'Light active': 'fail', 'Light inactive': 'pass', 'Dark active': 'pass', 'Dark inactive': 'pass' } },
    { name: '1-bit bunny with the dark pair', set: { subject: 'bunny', style: 'silhouette', palette: 'charcoal', pair: true }, exit: 0, dark: true,
      badges: { 'Light active': 'pass', 'Light inactive': 'pass', 'Dark active': 'pass', 'Dark inactive': 'pass' } },
  ];
  for (const c of cases) {
    await page.evaluate(o => window.builder.set(o), c.set);
    const slug = c.name.replace(/[^a-z0-9]+/gi, '-').slice(0, 40);
    const light = await downloadVia('download-light', slug + '.svg');
    const dark = c.dark ? await downloadVia('download-dark', slug + '-dark.svg') : null;
    const py = python(light.to, dark && dark.to);
    const js = await verdict(), b = await badges();
    const badgeOk = Object.entries(c.badges).every(([k, v]) => b[k] === v);
    const names = light.suggested === 'favicon.svg' && (!dark || dark.suggested === 'favicon-dark.svg');
    report(py.exit === c.exit && js === py.exit && badgeOk && names,
      `download + check-favicon.py agrees with the badges: ${c.name}`,
      `python exit ${py.exit}, JS verdict exit ${js}, expected ${c.exit}; badges ${JSON.stringify(b)}; saved as ${light.suggested}${dark ? ' + ' + dark.suggested : ''}`);
  }
  // the "shipped charcoal as the dark icon" mistake: Python FAILs it, and so does the JS check
  await page.evaluate(() => window.builder.set({ subject: 'cat', style: 'silhouette', palette: 'charcoal', pair: false }));
  const charcoal = await downloadVia('download-light', 'charcoal.svg');
  const pyBoth = python(charcoal.to, charcoal.to);
  const jsBoth = await page.evaluate(() => { const s = window.builder.current.light; return window.builder.check(s, s).exit; });
  report(pyBoth.exit === 1 && jsBoth === 1, '1-bit charcoal used as its own dark file fails in both (exit 1)', `python ${pyBoth.exit}, JS ${jsBoth}`);
  const callout = await page.$eval('#callout', e => e.textContent);
  report(/fades on dark tab bars/.test(callout) && await page.$('#callout button') !== null, '1-bit without the pair explains the dark-tab problem and offers the pair', callout.trim().slice(0, 80));
  await page.click('#callout button');
  report(await page.evaluate(() => !!window.builder.current.dark) && await page.$('#download-dark') !== null, '"Add the dark pair" adds favicon-dark.svg');

  // 4. Copy SVG: clipboard holds the exact SVG, the button shows "Copied"
  await page.evaluate(() => window.builder.set({ subject: 'frog', style: 'nes', palette: 'lime', pair: false }));
  await page.click('#copy-light');
  await page.waitForFunction(() => document.querySelector('#copy-light').dataset.copied === 'true', null, { timeout: 2000 }).catch(() => {});
  const copied = await page.$eval('#copy-light', b => ({ state: b.dataset.copied, text: b.textContent.trim() }));
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  const want = await page.evaluate(() => window.builder.current.light);
  report(copied.state === 'true' && copied.text === 'Copied' && clip === want, 'Copy SVG copies the SVG and shows "Copied"',
    `state ${copied.state}, label "${copied.text}", clipboard ${clip === want ? 'matches' : 'differs (' + clip.length + ' chars)'}`);
  const live = await page.$eval('#live', e => e.textContent);
  report(/Copied/.test(live), 'the copy is announced to screen readers', live);

  // the announcement is a fresh node each time, so a second copy of the same file is announced again
  await page.click('#copy-light');
  await page.waitForFunction(() => document.querySelector('#live span'), null, { timeout: 2000 }).catch(() => {});
  const liveNode = await page.$eval('#live', e => ({ el: e.firstElementChild && e.firstElementChild.localName, text: e.textContent }));
  report(liveNode.el === 'span' && /Copied/.test(liveNode.text), 'the announcement is a new element in the live region (so a repeat copy is announced again)', JSON.stringify(liveNode));

  // an open "Show the code" panel stays open when the pick changes (update() rebuilds the file list on every input)
  await page.click('#files details summary');
  const openNow = () => page.$$eval('#files details', ds => ds.map(d => d.open));
  const before = await openNow();
  await page.click('label.opt:has(input[name=subject][value=bear])');
  const afterSubject = await openNow();
  await page.evaluate(() => window.builder.set({ style: 'nes', palette: 'lime' }));
  const afterStyle = await openNow();
  report(before[0] === true && afterSubject[0] === true && afterStyle[0] === true, 'an open "Show the code" panel stays open after a new subject or style', JSON.stringify({ before, afterSubject, afterStyle }));
  const wideOpen = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  report(wideOpen <= 0, 'an open code panel does not stretch the page sideways at 1280 px', `scrollWidth - width = ${wideOpen}`);
  await page.click('#files details summary');   // close it again for the steps below
  report((await openNow())[0] === false && (await (async () => { await page.evaluate(() => window.builder.set({ subject: 'frog' })); return openNow(); })())[0] === false,
    'a closed panel stays closed after a pick');
  await page.evaluate(() => window.builder.set({ subject: 'frog', style: 'nes', palette: 'lime', pair: false }));

  // 5. the page's own favicon follows the pick
  const fav = await page.$eval('#fav', l => l.getAttribute('href'));
  report(fav === 'data:image/svg+xml,' + encodeURIComponent(want), 'the browser tab favicon updates to the current pick');

  // 6. keyboard: arrow keys move through the subject radios and re-render
  await page.focus('input[name=subject][value=cat]');
  await page.keyboard.press('ArrowRight');
  const after = await page.evaluate(() => ({ subj: document.querySelector('input[name=subject]:checked').value, focused: document.activeElement.value,
    outline: getComputedStyle(document.activeElement.nextElementSibling).outlineStyle }));
  report(after.subj === 'bunny' && after.focused === 'bunny' && after.outline !== 'none', 'keyboard: ArrowRight picks the next subject, with a visible focus ring', JSON.stringify(after));
  const unlabelled = await page.$$eval('input, button', els => els.filter(e => !(e.labels && e.labels.length) && !e.textContent.trim() && !e.getAttribute('aria-label')).length);
  report(unlabelled === 0, 'every control has a label', `${unlabelled} unlabelled`);

  // 4b. the execCommand fallback (used when navigator.clipboard is refused): it must select the SVG text, and Copy failed must show
  for (const execResult of [true, false]) {
    const fb = await context.newPage();
    await fb.addInitScript(r => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } });
      window.__exec = []; window.__execResult = r;
      document.execCommand = cmd => { const a = document.activeElement; window.__exec.push({ cmd, text: a && a.value }); return window.__execResult; };
    }, execResult);
    await fb.goto(URL_);
    await fb.waitForFunction(() => window.builder && window.builder.current);
    await fb.click('#copy-light');
    await fb.waitForFunction(() => document.querySelector('#copy-light').dataset.copied, null, { timeout: 2000 }).catch(() => {});
    const o = await fb.evaluate(() => ({ state: document.querySelector('#copy-light').dataset.copied, label: document.querySelector('#copy-light').textContent.trim(),
      live: document.querySelector('#live').textContent, exec: window.__exec, svg: window.builder.current.light }));
    const selected = o.exec.length === 1 && o.exec[0].cmd === 'copy' && o.exec[0].text === o.svg;
    report(selected && (execResult ? o.state === 'true' && o.label === 'Copied' && /Copied/.test(o.live)
                                   : o.state === 'error' && o.label === 'Copy failed' && /Copy failed/.test(o.live)),
      `clipboard refused, execCommand("copy") ${execResult ? 'works' : 'fails'}: the SVG is selected and the button says "${execResult ? 'Copied' : 'Copy failed'}"`,
      `state ${o.state}, label "${o.label}", exec calls ${o.exec.length}, selected text ${selected ? 'is the SVG' : 'is not the SVG'}`);
    await fb.close();
  }

  // 4c. dark colour scheme: the tab icon and the thumbnails switch to the dark twin of a 1-bit pick, and back when the scheme flips
  {
    const dk = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1280, height: 900 } });
    const dp = await dk.newPage();
    await dp.goto(URL_);
    await dp.waitForFunction(() => window.builder && window.builder.current);
    await dp.evaluate(() => window.builder.set({ subject: 'bunny', style: 'silhouette', palette: 'charcoal', pair: true }));
    const state = () => dp.evaluate(() => {
      const u = s => 'data:image/svg+xml,' + encodeURIComponent(s), cur = window.builder.current;
      const thumbs = [...document.querySelectorAll('[data-thumb]')].map(i => {
        const [kind, id] = i.dataset.thumb.split(':'), r = window.builder.render(kind === 'subject' ? { subject: id, pair: true } : { style: id, pair: true });
        return { src: i.getAttribute('src'), light: u(r.light), dark: r.dark ? u(r.dark) : null };
      });
      return { fav: document.getElementById('fav').getAttribute('href'), light: u(cur.light), dark: u(cur.dark),
        thumbsDark: thumbs.filter(t => t.dark).every(t => t.src === t.dark), thumbsLight: thumbs.every(t => t.src === t.light),
        pairedThumbs: thumbs.filter(t => t.dark).length };
    });
    let st = await state();
    report(st.fav === st.dark && st.fav !== st.light, 'dark scheme + dark pair: the page\'s own tab icon is the dark file');
    report(st.pairedThumbs > 0 && st.thumbsDark, `dark scheme: the 1-bit thumbnails show their dark twin (${st.pairedThumbs} of them)`);
    await dp.emulateMedia({ colorScheme: 'light' });
    await dp.waitForFunction(() => document.getElementById('fav').getAttribute('href') === 'data:image/svg+xml,' + encodeURIComponent(window.builder.current.light), null, { timeout: 2000 }).catch(() => {});
    st = await state();
    report(st.fav === st.light && st.thumbsLight, 'switching the page to light scheme puts the light file and thumbnails back');
    await dk.close();
  }

  // 7. opened straight from disk (file://), the way SKILL.md opens preview.html
  const disk = await browser.newPage();
  const diskErrors = []; disk.on('pageerror', e => diskErrors.push(e.message));
  await disk.goto('file://' + path.join(ROOT, SKILL, 'examples/builder.html'));
  await disk.waitForFunction(() => window.builder && window.builder.current, null, { timeout: 5000 }).catch(() => {});
  await disk.click('#copy-light');
  await disk.waitForFunction(() => document.querySelector('#copy-light').dataset.copied, null, { timeout: 2000 }).catch(() => {});
  const diskState = await disk.$eval('#copy-light', b => b.dataset.copied || 'none');
  report(diskErrors.length === 0 && ['true', 'error'].includes(diskState), 'works from file:// (renders; Copy ends in "Copied" or a visible "Copy failed")', `errors ${diskErrors.length}, copy state ${diskState}`);
  await disk.close();

  // 8. reduced motion and 375 px
  const phone = await browser.newPage({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
  await phone.goto(URL_);
  await phone.waitForFunction(() => window.builder && window.builder.current);
  const m = await phone.evaluate(() => ({ sw: document.documentElement.scrollWidth, tr: getComputedStyle(document.querySelector('.opt .card')).transitionDuration }));
  report(m.sw <= 375, 'no horizontal scroll at 375 px', `scrollWidth ${m.sw}`);
  await phone.click('#files details summary');
  const swOpen = await phone.evaluate(() => document.documentElement.scrollWidth);
  report(swOpen <= 375, 'no horizontal scroll at 375 px with a code panel open', `scrollWidth ${swOpen}`);
  report(/^0s(, 0s)*$/.test(m.tr), 'prefers-reduced-motion turns transitions off', m.tr);
  await phone.close();
} catch (e) {
  report(false, 'test run crashed', e.stack);
} finally {
  await browser.close();
  server.close();
  fs.rmSync(TMP, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
