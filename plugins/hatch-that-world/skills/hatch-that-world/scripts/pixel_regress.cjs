// pixel_regress.cjs — do the worlds look exactly as before?
// usage: PWC=<playwright folder> node pixel_regress.cjs before.html after.html outdir
//          --worlds garden,cosmic,candy --key brief-world [--theme-key brief-theme] [--modes light,dark]
//          [--layouts scene,stage,deck --layout-key my-layout] [--time 2026-11-05T12:40:00Z] [--widths 1280,390]
//          [--scene '#scene'] [--set key=value ...]
// Run BEFORE vs BEFORE first: that is the noise floor. Clock frozen, reduced motion, Math.random seeded, web fonts
// blocked, local helpers stubbed. Writes both screenshots per look and a crop of any difference; prints one row per
// look with the differing-pixel count and whether the scene markup is identical. Exit 1 if any look differs.
const pw = require(process.env.PWC || 'playwright'), fs = require('fs'), path = require('path');
const a = process.argv.slice(2), pos = [], o = {modes: 'light,dark', widths: '1280,390', time: '2026-11-05T12:40:00Z', scene: '#scene'}, set = {};
for (let i = 0; i < a.length; i++) {
  if (a[i] === '--set') { const [k, ...v] = a[++i].split('='); set[k] = v.join('='); }
  else if (a[i].startsWith('--')) o[a[i].slice(2)] = a[++i]; else pos.push(a[i]);
}
const [before, after, out] = pos.map(p => path.resolve(p));
if (!out || !o.worlds || !o.key) { console.error('need before after outdir --worlds a,b --key storageKey'); process.exit(2); }
fs.mkdirSync(out, {recursive: true});
const H = {1280: 800, 390: 844};
(async () => {
  const b = await pw.chromium.launch({channel: 'chrome', headless: true}), rows = []; let bad = 0;
  const layouts = o.layouts ? o.layouts.split(',') : [null];
  for (const W of o.widths.split(',').map(Number)) for (const lay of layouts) for (const world of o.worlds.split(',')) for (const mode of o.modes.split(',')) {
    const got = [];
    for (const f of [before, after]) {
      const ctx = await b.newContext({viewport: {width: W, height: H[W] || 800}, deviceScaleFactor: 1, timezoneId: 'UTC', reducedMotion: 'reduce'});
      const page = await ctx.newPage();
      await page.route('http://127.0.0.1:*/**', r => r.fulfill({status: 204, body: ''}));
      await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
      const s = {...set, [o.key]: world}; if (o['theme-key']) s[o['theme-key']] = mode; if (lay && o['layout-key']) s[o['layout-key']] = lay;
      await page.addInitScript(s => { try { for (const k in s) localStorage.setItem(k, s[k]); } catch (e) {}
        let x = 42; Math.random = () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }, s);
      if (!o['theme-key']) await page.emulateMedia({colorScheme: mode === 'dark' ? 'dark' : 'light'});
      await page.clock.setFixedTime(new Date(o.time));
      await page.goto('file://' + f); await page.waitForTimeout(1200);
      const png = await page.screenshot();
      const scene = await page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.outerHTML : ''; }, o.scene);
      got.push({png, scene}); await ctx.close();
    }
    const name = [W, lay, world, mode].filter(Boolean).join('-');
    fs.writeFileSync(`${out}/${name}-before.png`, got[0].png); fs.writeFileSync(`${out}/${name}-after.png`, got[1].png);
    const p = await b.newPage();
    const r = await p.evaluate(async ([A, C]) => {
      const load = s => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = s; });
      const [ia, ic] = await Promise.all([load(A), load(C)]); if (ia.width !== ic.width || ia.height !== ic.height) return {n: -1};
      const W = ia.width, H = ia.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
      x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, W, H).data; x.drawImage(ic, 0, 0); const dc = x.getImageData(0, 0, W, H).data;
      let n = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (let i = 0; i < da.length; i += 4) if (da[i] !== dc[i] || da[i+1] !== dc[i+1] || da[i+2] !== dc[i+2]) { n++; const px = (i/4) % W, py = Math.floor(i/4/W); x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
      if (!n) return {n};
      const pad = 30, bx = Math.max(0, x0 - pad), by = Math.max(0, y0 - pad), bw = Math.min(W, x1 + pad) - bx, bh = Math.min(H, y1 + pad) - by;
      const c2 = document.createElement('canvas'); c2.width = bw * 2 + 10; c2.height = bh; const y = c2.getContext('2d'); y.fillStyle = '#fff'; y.fillRect(0, 0, c2.width, bh);
      y.drawImage(ia, bx, by, bw, bh, 0, 0, bw, bh); y.drawImage(ic, bx, by, bw, bh, bw + 10, 0, bw, bh);
      return {n, box: [x0, y0, x1, y1], crop: c2.toDataURL('image/png')};
    }, ['data:image/png;base64,' + got[0].png.toString('base64'), 'data:image/png;base64,' + got[1].png.toString('base64')]);
    await p.close();
    if (r.crop) fs.writeFileSync(`${out}/${name}-DIFF-crop.png`, Buffer.from(r.crop.split(',')[1], 'base64'));
    if (r.n !== 0) bad++;
    rows.push(`${name.padEnd(32)} pixels differing: ${String(r.n).padStart(6)}${r.box ? '  box ' + r.box.join(',') : ''}   scene markup ${got[0].scene === got[1].scene ? 'identical' : 'DIFFERS'}`);
  }
  await b.close(); console.log(rows.join('\n')); console.log(`\n${rows.length - bad} of ${rows.length} looks pixel-identical`);
  process.exit(bad ? 1 : 0);
})();
