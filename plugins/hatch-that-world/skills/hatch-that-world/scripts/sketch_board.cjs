// sketch_board.cjs — put three world sketches side by side on ONE labelled board, and refuse a bad set.
// usage: PWC=<playwright folder> node sketch_board.cjs a.html b.html c.html
//          [--labels 'A paper-cut,B ink wash,C lantern'] [--out board] [--size 640x400]
//          [--blank-share 0.97] [--clone-edges 0.85] [--clone-colour 4]
// Screenshots each page at the same size (reduced motion, local helper calls stubbed), then checks:
//   BLANK  a sketch where one colour covers >= --blank-share of the pixels (nothing was drawn)
//   CLONE  two sketches whose drawn outlines overlap >= --clone-edges (same layout, different paint), or whose
//          mean colour difference is under --clone-colour of 255 (a colour swap or an identical page)
// On success writes <out>.png and <out>.html (three equal tiles with the labels). Nothing is written on failure.
// Exit 0 = board written, 1 = BLANK or CLONE, 2 = could not run (missing file, bad arguments, no browser).
const pw = require(process.env.PWC || 'playwright');
const path = require('path'), fs = require('fs');
const a = process.argv.slice(2), files = [], o = {out: 'sketch-board', size: '640x400', labels: '', 'blank-share': '0.97', 'clone-edges': '0.85', 'clone-colour': '4'};
for (let i = 0; i < a.length; i++) { if (a[i].startsWith('--')) o[a[i].slice(2)] = a[++i]; else files.push(a[i]); }
const die = (m, c = 2) => { console.error(m); process.exit(c); };
if (files.length !== 3) die('need exactly three sketch files: sketch_board.cjs a.html b.html c.html [--labels "A,B,C"]');
const missing = files.filter(f => !fs.existsSync(f));
if (missing.length) die('MISSING sketch file: ' + missing.join(', '));
const m = /^(\d+)x(\d+)$/.exec(o.size); if (!m) die('--size must look like 640x400');
const W = +m[1], H = +m[2];
const labels = o.labels ? o.labels.split(',').map(s => s.trim()) : [];
while (labels.length < 3) labels.push(String.fromCharCode(65 + labels.length) + ' ' + path.basename(files[labels.length], path.extname(files[labels.length])));
const esc = s => s.replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

// Runs inside a blank page: decode the three PNGs, return per-image dominant-colour share and the pairwise
// edge overlap (Jaccard on a coarse grid, 1px dilation) and mean colour difference.
const analyse = ([urls, w, h]) => Promise.all(urls.map(u => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = u; }))).then(imgs => {
  const gw = 160, gh = Math.round(160 * h / w), px = imgs.map(im => {
    const c = document.createElement('canvas'); c.width = gw; c.height = gh; const x = c.getContext('2d');
    x.drawImage(im, 0, 0, gw, gh); return x.getImageData(0, 0, gw, gh).data;
  });
  const edges = px.map(d => {
    const e = new Uint8Array(gw * gh), g = (i, c) => d[i * 4 + c];
    for (let y = 0; y < gh - 1; y++) for (let x = 0; x < gw - 1; x++) {
      const i = y * gw + x; let m = 0;
      for (let c = 0; c < 3; c++) m = Math.max(m, Math.abs(g(i, c) - g(i + 1, c)), Math.abs(g(i, c) - g(i + gw, c)));
      e[i] = m > 14 ? 1 : 0;
    }
    const f = new Uint8Array(gw * gh);   // dilate by one cell so a 1px shift is not a difference
    for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) { const i = y * gw + x; f[i] = (e[i] | e[i - 1] | e[i + 1] | e[i - gw] | e[i + gw]); }
    return {e, f};
  });
  const dominant = px.map(d => {
    const n = {}; let best = 0;
    for (let i = 0; i < d.length; i += 4) { const k = (d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4); best = Math.max(best, n[k] = (n[k] || 0) + 1); }
    return best / (d.length / 4);
  });
  const pairs = [];
  for (let p = 0; p < 3; p++) for (let q = p + 1; q < 3; q++) {
    let inter = 0, uni = 0, sum = 0;
    for (let i = 0; i < gw * gh; i++) {
      const A = edges[p].e[i] && edges[q].f[i] || edges[q].e[i] && edges[p].f[i], U = edges[p].e[i] || edges[q].e[i];
      if (U) { uni++; if (A) inter++; }
      for (let c = 0; c < 3; c++) sum += Math.abs(px[p][i * 4 + c] - px[q][i * 4 + c]);
    }
    pairs.push({p, q, jaccard: uni ? inter / uni : 1, colour: sum / (gw * gh * 3), edgeCells: [edges[p].e, edges[q].e].map(e => e.reduce((s, v) => s + v, 0))});
  }
  return {dominant, pairs};
});

(async () => {
  let b;
  try { b = await pw.chromium.launch({channel: 'chrome', headless: true}); }
  catch (e) { try { b = await pw.chromium.launch({headless: true}); } catch (e2) { die('no Chrome / Chromium for Playwright (npx playwright install chromium)'); } }
  const shots = [];
  for (const f of files) {
    const c = await b.newContext({viewport: {width: W, height: H}, reducedMotion: 'reduce'}), p = await c.newPage();
    await p.route('http://127.0.0.1:*/**', r => r.fulfill({status: 204, body: ''}));
    await p.goto('file://' + path.resolve(f)); await p.waitForTimeout(600);
    shots.push((await p.screenshot()).toString('base64')); await c.close();
  }
  const urls = shots.map(s => 'data:image/png;base64,' + s);
  const ctx = await b.newContext(), pg = await ctx.newPage(); await pg.goto('about:blank');
  const r = await pg.evaluate(analyse, [urls, W, H]); await ctx.close();
  const problems = [];
  r.dominant.forEach((d, i) => { if (d >= +o['blank-share']) problems.push(`BLANK: ${files[i]} ("${labels[i]}") is one flat colour (${(d * 100).toFixed(1)}% of pixels the same); nothing was drawn`); });
  r.pairs.forEach(x => {
    if (r.dominant[x.p] >= +o['blank-share'] || r.dominant[x.q] >= +o['blank-share']) return;   // already reported as blank
    const why = [];
    if (x.jaccard >= +o['clone-edges']) why.push(`outlines overlap ${(x.jaccard * 100).toFixed(0)}% (limit ${(+o['clone-edges'] * 100).toFixed(0)}%)`);
    if (x.colour < +o['clone-colour']) why.push(`mean colour difference ${x.colour.toFixed(1)}/255 (limit ${o['clone-colour']})`);
    if (why.length) problems.push(`CLONE: "${labels[x.p]}" and "${labels[x.q]}" look like the same sketch: ${why.join('; ')}. Three directions must differ in material and motion, not just colour`);
  });
  r.pairs.forEach(x => console.log(`pair ${labels[x.p]} / ${labels[x.q]}: outline overlap ${(x.jaccard * 100).toFixed(0)}%, colour diff ${x.colour.toFixed(1)}`));
  if (problems.length) { problems.forEach(p => console.error(p)); await b.close(); process.exit(1); }

  const html = `<!doctype html><meta charset="utf-8"><title>Pick one of three</title>
<style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#f3eee4;font:600 16px/1.3 system-ui,sans-serif;color:#2d2a32}
.row{display:flex;gap:20px}.tile{flex:0 0 ${W}px;margin:0}.tile img{display:block;width:${W}px;height:${H}px;border-radius:14px;border:2px solid #2d2a32;background:#fff}
.tile figcaption{margin-top:10px;font-size:18px;white-space:nowrap}.tile b{display:inline-block;width:28px;height:28px;margin-right:8px;border-radius:50%;background:#2d2a32;color:#f3eee4;text-align:center;line-height:28px}</style>
<div class="row">${urls.map((u, i) => `<figure class="tile"><img src="${u}" alt="${esc(labels[i])}"><figcaption><b>${'ABC'[i]}</b>${esc(labels[i].replace(/^[A-C]\s+/, ''))}</figcaption></figure>`).join('')}</div>`;
  const out = path.resolve(o.out);
  fs.mkdirSync(path.dirname(out), {recursive: true});
  fs.writeFileSync(out + '.html', html);
  const bc = await b.newContext({viewport: {width: 3 * W + 40 + 48, height: H + 100}}), bp = await bc.newPage();
  await bp.goto('file://' + out + '.html');
  await bp.screenshot({path: out + '.png', fullPage: true}); await b.close();
  console.log('BOARD OK ' + out + '.png');
})();
