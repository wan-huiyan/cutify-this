#!/usr/bin/env python3
# Style A contract test: loads each embed into an <iframe srcdoc> at 1100 px and 360 px in real Chrome and checks the embed contract; shoots stills. Inputs: html paths.
"""uv run --with playwright python test_embed.py final/film1.html:3 [final/film2.html:4 ...] [--stills final/stills] [--budget 900000]
The ':N' suffix is the 1-based verdict beat (gets a still). Needs the style A player hooks (player_template.html):
window.__anim = {state() -> {ready, paused, t, beat, staticMode}, jump(i), seek(t), data: {beats, poster}}, and the
.cap / .live / ol.list / .rail button elements. Checks: size budget, anim-height, paused until anim-play, anim-pause,
wheel/keys/CDP-touch-swipe forwarding, caption >= 16 px and unclipped on every beat, stable height, no page errors,
reduced motion (paused poster, ignores anim-play, numbered list, rail jumps). Real Chrome (channel='chrome') because
Playwright's bundled Chromium cannot decode H.264. Writes stills and <stills>/../test_report.json; exit 1 on any failure."""
import json, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright
opt = lambda k, d: type(d)(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
STILLS = Path(opt('--stills', 'stills')); STILLS.mkdir(parents=True, exist_ok=True); BUDGET = opt('--budget', 900_000)
skip = {sys.argv.index(k) + 1 for k in ('--stills', '--budget') if k in sys.argv}
FILES = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and i not in skip]
if not FILES: sys.exit(__doc__)
HARNESS = """<!doctype html><html><head><meta charset=utf-8><style>html,body{margin:0;background:#0f1420}body{padding:20px}
iframe{display:block;border:0;width:%dpx;height:200px;background:#121826}</style></head><body><iframe id=f title=anim></iframe>
<script>window.MSG=[];addEventListener('message',e=>{const m=e.data;if(!m||!m.type)return;MSG.push(Object.assign({at:performance.now()},m));
if(m.type==='anim-height')document.getElementById('f').style.height=m.h+'px';});</script></body></html>"""
report = []
def chk(rows, name, ok, detail=''):
    rows.append({'check': name, 'ok': bool(ok), 'detail': detail}); print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(detail) if detail else ''), flush=True)
with sync_playwright() as p:
    br = p.chromium.launch(channel='chrome')
    for arg in FILES:
        path, _, vb = arg.partition(':'); verdict = int(vb or 0); w = Path(path).stem
        src = Path(path).read_text(); size = Path(path).stat().st_size
        for vw, iw, tag in ((1280, 1100, '1280'), (390, 360, '390')):
            rows = []; print(f'--- {w} iframe {iw}px', flush=True)
            chk(rows, f'file size <= {BUDGET} bytes', size <= BUDGET, size)
            ctx = br.new_context(viewport={'width': vw, 'height': 1600}, device_scale_factor=2 if iw < 500 else 1, has_touch=True)
            pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.set_content(HARNESS % iw)
            pg.evaluate('s => { document.getElementById("f").srcdoc = s; }', src)
            pg.wait_for_timeout(1500)
            fr = pg.frames[1]
            fr.wait_for_function('window.__anim && window.__anim.state().ready', timeout=15000)
            pg.wait_for_timeout(2500)
            msgs = pg.evaluate('MSG'); hs = [m['h'] for m in msgs if m['type'] == 'anim-height']
            chk(rows, 'anim-height arrives', len(hs) > 0, hs)
            st = fr.evaluate('__anim.state()')
            chk(rows, 'stays paused before anim-play (4 s after load)', st['paused'] and st['t'] < 0.1, st)
            pg.evaluate('document.getElementById("f").contentWindow.postMessage({type:"anim-play"},"*")'); pg.wait_for_timeout(2500)
            st2 = fr.evaluate('__anim.state()'); chk(rows, 'anim-play starts it', (not st2['paused']) and st2['t'] > 1.5, st2)
            pg.evaluate('document.getElementById("f").contentWindow.postMessage({type:"anim-pause"},"*")'); pg.wait_for_timeout(300)
            a = fr.evaluate('__anim.state().t'); pg.wait_for_timeout(1200); b = fr.evaluate('__anim.state()')
            chk(rows, 'anim-pause stops it', b['paused'] and abs(b['t'] - a) < 0.05, (a, b['t']))
            # input forwarding
            box = pg.locator('#f').bounding_box(); cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] * 0.3
            pg.evaluate('MSG.length = 0'); pg.mouse.move(cx, cy); pg.mouse.wheel(0, 240); pg.wait_for_timeout(300)
            chk(rows, 'wheel -> deck-wheel', any(m['type'] == 'deck-wheel' for m in pg.evaluate('MSG')))
            pg.mouse.click(box['x'] + 20, box['y'] + box['height'] - 12); pg.keyboard.press('ArrowDown'); pg.keyboard.press('PageUp'); pg.wait_for_timeout(300)
            keys = [m.get('key') for m in pg.evaluate('MSG') if m['type'] == 'deck-key']
            chk(rows, 'keys -> deck-key', 'ArrowDown' in keys and 'PageUp' in keys, keys)
            cdp = ctx.new_cdp_session(pg)
            cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': cx, 'y': cy + 60}]})
            for k in range(1, 6): cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': cx, 'y': cy + 60 - k * 30}]})
            cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); pg.wait_for_timeout(300)
            sw = [m for m in pg.evaluate('MSG') if m['type'] == 'deck-swipe']
            chk(rows, 'swipe (CDP touch) -> deck-swipe', sw and sw[-1]['dy'] > 100, sw[-1:] if sw else None)
            # captions: size, clipping, stable height across beats; stills
            nb = fr.evaluate('__anim.data.beats.length'); heights = []
            for i in range(nb):
                fr.evaluate(f'__anim.jump({i})'); pg.wait_for_timeout(700)
                heights.append(pg.evaluate('document.getElementById("f").getBoundingClientRect().height'))
                cap = fr.evaluate("""() => { const c = document.querySelector('.cap'), l = document.querySelector('.live');
                    return { fs: parseFloat(getComputedStyle(c).fontSize), sh: l.scrollHeight, ch: l.clientHeight, docSH: document.documentElement.scrollHeight }; }""")
                if cap['fs'] < 16 or cap['sh'] > cap['ch'] + 1: chk(rows, f'caption beat {i+1} >=16px and unclipped', False, cap)
                if i in (0, 2, verdict - 1, nb - 1):
                    pg.wait_for_timeout(400); pg.locator('#f').screenshot(path=str(STILLS / f'{w}_{tag}_beat{i+1}.png'))
            chk(rows, 'caption >=16 px and unclipped on every beat', not any(r['check'].startswith('caption beat') for r in rows), fr.evaluate("parseFloat(getComputedStyle(document.querySelector('.cap')).fontSize)"))
            chk(rows, 'iframe height stable across beats', max(heights) - min(heights) <= 1, heights)
            fin = pg.evaluate('MSG.filter(m=>m.type==="anim-height").map(m=>m.h)'); real = fr.evaluate('document.documentElement.scrollHeight')
            chk(rows, 'height settled = content (documentElement.scrollHeight)', abs(heights[-1] - real) <= 1, {'iframe': heights[-1], 'scrollHeight': real})
            chk(rows, 'no page errors', not errs, errs)
            ctx.close()
            # reduced motion
            ctx = br.new_context(viewport={'width': vw, 'height': 1400}, device_scale_factor=2 if iw < 500 else 1, reduced_motion='reduce')
            pg = ctx.new_page(); pg.set_content(HARNESS % iw); pg.evaluate('s => { document.getElementById("f").srcdoc = s; }', src)
            pg.wait_for_timeout(1500); fr = pg.frames[1]; fr.wait_for_function('window.__anim && window.__anim.state().ready', timeout=15000); pg.wait_for_timeout(1200)
            pg.evaluate('document.getElementById("f").contentWindow.postMessage({type:"anim-play"},"*")'); pg.wait_for_timeout(1500)
            rm = fr.evaluate("""() => ({ st: __anim.state(), items: document.querySelectorAll('.live ol.list > li').length,
                 fs: parseFloat(getComputedStyle(document.querySelector('.list')).fontSize), poster: __anim.data.poster })""")
            chk(rows, 'reduced motion: still frame, ignores anim-play, numbered captions', rm['st']['paused'] and rm['st']['staticMode'] and rm['items'] == nb and abs(rm['st']['t'] - rm['poster']) < 0.2 and rm['fs'] >= 16, rm)
            fr.evaluate('document.querySelectorAll(".rail button")[0].click()'); pg.wait_for_timeout(600)
            j = fr.evaluate('__anim.state()'); chk(rows, 'reduced motion: step rail jumps to a still', j['paused'] and j['beat'] == 0, j)
            fr.evaluate(f'__anim.seek(__anim.data.poster)'); pg.wait_for_timeout(500)
            pg.locator('#f').screenshot(path=str(STILLS / f'{w}_{tag}_reduced.png'))
            ctx.close()
            report.append({'way': w, 'iframe': iw, 'rows': rows})
    br.close()
(STILLS.parent / 'test_report.json').write_text(json.dumps(report, indent=1))
fails = [(r['way'], r['iframe'], x['check']) for r in report for x in r['rows'] if not x['ok']]
print('\nFAILURES:', fails if fails else 'none'); sys.exit(1 if fails else 0)
