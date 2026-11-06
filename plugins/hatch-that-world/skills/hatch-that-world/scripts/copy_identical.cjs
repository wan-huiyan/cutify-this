// copy_identical.cjs — does a change leave the COPIED text exactly as it was?
// usage: PWC=<playwright folder> node copy_identical.cjs before.html after.html
//          [--boxes 'input[type=checkbox]'] [--button '[data-copy-btn]'] [--out '#out'] [--set key=value ...]
// Ticks every box, presses the copy button, captures what the clipboard would receive (or the --out field's value),
// and compares the two pages. Exit 0 = COPY-IDENTICAL, 1 = COPY-DIFFERS, 2 = could not run.
const pw = require(process.env.PWC || 'playwright');
const path = require('path');
const args = process.argv.slice(2), files = [], opt = {boxes: 'input[type=checkbox]', button: '[data-copy-btn]', out: '#out'}, set = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--set') { const [k, ...v] = args[++i].split('='); set[k] = v.join('='); }
  else if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i];
  else files.push(path.resolve(args[i]));
}
if (files.length !== 2) { console.error('need before.html and after.html'); process.exit(2); }
(async () => {
  const b = await pw.chromium.launch({channel: 'chrome', headless: true}), got = [];
  for (const f of files) {
    const c = await b.newContext({viewport: {width: 1280, height: 800}, reducedMotion: 'reduce'}), p = await c.newPage();
    await p.route('http://127.0.0.1:*/**', r => r.fulfill({status: 204, body: ''}));   // never let a local helper write
    await p.addInitScript(s => {
      window.__c = '';
      try { Object.defineProperty(navigator, 'clipboard', {value: {writeText: t => { window.__c = t; return Promise.resolve(); }}}); } catch (e) {}
      try { for (const k in s) localStorage.setItem(k, s[k]); } catch (e) {}
    }, set);
    await p.goto('file://' + f); await p.waitForTimeout(800);
    const n = await p.evaluate(sel => { const bs = [...document.querySelectorAll(sel)]; bs.forEach(x => { if (!x.checked) x.click(); }); return bs.length; }, opt.boxes);
    const ok = await p.evaluate(sel => { const btn = document.querySelector(sel); if (btn) btn.click(); return !!btn; }, opt.button);
    if (!ok) { console.error(`no copy button ${opt.button} in ${f}`); process.exit(2); }
    await p.waitForTimeout(400);
    const t = await p.evaluate(sel => window.__c || (document.querySelector(sel) || {}).value || '', opt.out);
    got.push(t); console.log(path.basename(f), 'boxes', n, 'chars', t.length); await c.close();
  }
  await b.close();
  const same = got[0] === got[1];
  console.log(same ? 'COPY-IDENTICAL' : 'COPY-DIFFERS');
  process.exit(same ? 0 : 1);
})();
