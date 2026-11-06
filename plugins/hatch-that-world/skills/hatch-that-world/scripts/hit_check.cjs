// hit_check.cjs — can the pointer reach each clickable thing in the drawing, and does a click land on its row?
// usage: PWC=<playwright folder> node hit_check.cjs page.html --drawn '.g-sign' --link '#meetlinks a'
//          [--match data-n] [--width 1280] [--time 2026-11-05T12:40:00Z] [--set key=value ...] [--click]
// For the n-th drawn element (or the drawn element whose --match attribute equals the link's) it asks
// document.elementFromPoint at the element's centre: the answer must be inside its link. Something else on top is
// reported as "covered by …" (e.g. a draggable sun, by design) and a different link as WRONG. With --click it
// clicks each link at a point it owns and checks the target row exists, is on screen and gets a flash class.
// Exit 1 on any WRONG, unreachable link or failed click; "covered" alone does not fail.
const pw = require(process.env.PWC || 'playwright'), path = require('path');
const a = process.argv.slice(2), o = {width: '1280', time: '2026-11-05T12:40:00Z', flash: 'st-flash'}, set = {}; let file;
for (let i = 0; i < a.length; i++) {
  if (a[i] === '--set') { const [k, ...v] = a[++i].split('='); set[k] = v.join('='); }
  else if (a[i] === '--click') o.click = true;
  else if (a[i].startsWith('--')) o[a[i].slice(2)] = a[++i]; else file = path.resolve(a[i]);
}
if (!file || !o.drawn || !o.link) { console.error('need page.html --drawn <selector> --link <selector>'); process.exit(2); }
(async () => {
  const b = await pw.chromium.launch({channel: 'chrome', headless: true}); const W = +o.width; let fails = 0;
  const open = async () => {
    const ctx = await b.newContext({viewport: {width: W, height: W < 800 ? 844 : 800}, timezoneId: 'UTC'}), page = await ctx.newPage();
    await page.route('http://127.0.0.1:*/**', r => r.fulfill({status: 204, body: ''}));
    await page.addInitScript(s => { try { for (const k in s) localStorage.setItem(k, s[k]); } catch (e) {} }, set);
    await page.clock.install({time: new Date(o.time)}); await page.goto('file://' + file); await page.clock.fastForward(3000);
    return {ctx, page};
  };
  const {ctx, page} = await open();
  const rows = await page.evaluate(([D, L, M]) => {
    const drawn = [...document.querySelectorAll(D)], links = [...document.querySelectorAll(L)];
    return drawn.map((d, n) => {
      const link = M ? links.find(l => l.getAttribute(M) === d.getAttribute(M)) : links[n];
      const r = d.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, el = document.elementFromPoint(x, y);
      const hit = el && links.find(l => l === el || l.contains(el));
      const what = !link ? 'NO LINK' : hit === link ? 'ok' : hit ? 'WRONG (another link)' : 'covered by ' + (el ? el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.getAttribute('class') ? '.' + el.getAttribute('class').split(' ')[0] : '') : 'nothing');
      return {n, what, href: link && link.getAttribute('href'), label: (d.textContent || '').trim().slice(0, 30)};
    });
  }, [o.drawn, o.link, o.match]);
  for (const r of rows) { console.log(`#${r.n} ${r.label.padEnd(30)} ${r.what}`); if (/WRONG|NO LINK/.test(r.what)) fails++; }
  if (!rows.length) { console.log('no drawn elements matched ' + o.drawn); fails++; }
  await ctx.close();
  if (o.click) {
    const n = rows.length;
    for (let i = 0; i < n; i++) {
      const {ctx, page} = await open();
      const pt = await page.evaluate(([L, i]) => { const l = document.querySelectorAll(L)[i]; if (!l) return null;
        for (const s of [l, ...l.querySelectorAll('*')]) { const r = s.getBoundingClientRect();
          for (const fx of [.5, .3, .7]) for (const fy of [.5, .3, .7]) { const x = r.left + r.width * fx, y = r.top + r.height * fy, e = document.elementFromPoint(x, y);
            if (e && (e === l || l.contains(e))) return {x, y, href: l.getAttribute('href')}; } }
        return {x: -1, href: l.getAttribute('href')}; }, [o.link, i]);
      if (!pt || pt.x < 0) { console.log(`click #${i}: link cannot be reached by the pointer`); fails++; await ctx.close(); continue; }
      await page.mouse.click(pt.x, pt.y);
      let r = {};   // poll: opening a section and smooth-scrolling to the row takes a moment
      for (let k = 0; k < 20 && !(r.flash && r.seen); k++) {
        await page.clock.fastForward(100); await page.waitForTimeout(80);
        r = await page.evaluate(([h, F]) => { const el = document.getElementById(h.slice(1)); if (!el) return {exists: false};
          const b = el.getBoundingClientRect(), x = b.left + Math.min(40, b.width / 2), y = b.top + Math.min(12, b.height / 2), at = b.height && document.elementFromPoint(x, y);
          return {exists: true, flash: el.classList.contains(F), seen: !!(at && (at === el || el.contains(at)))}; }, [pt.href, o.flash]);
      }
      const ok = r.exists && r.flash && r.seen; if (!ok) fails++;
      console.log(`click #${i} ${pt.href}: ${ok ? 'ok' : JSON.stringify(r)}`); await ctx.close();
    }
  }
  await b.close(); console.log(fails ? `FAIL (${fails})` : 'PASS'); process.exit(fails ? 1 : 0);
})();
