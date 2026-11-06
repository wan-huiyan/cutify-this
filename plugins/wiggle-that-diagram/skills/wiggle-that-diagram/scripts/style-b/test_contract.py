#!/usr/bin/env python3
# Style B contract test: puts each embed twice into a test page via <iframe srcdoc> (1100 px and 360 px), opens it in real Chrome and checks the embed contract; shoots stills. Inputs: html paths, beats.json.
"""uv run --with playwright python test_contract.py final/film1.html [final/film2.html ...] --beats beats.json [--stills final/stills] [--test final/test]
The film key in beats.json is the html file's stem. Needs the style B player (player.html): a <video id="v">, a caption
.cap .item.on (.k step line + p sentence), #rail buttons, #list (reduced motion). Checks: anim-height, paused on beat 1's
still until anim-play, plays/pauses on messages, rail jumps (paused -> still, playing -> beat start), wheel/keys/swipe
-> deck-* messages, caption and step line >= 16 px with no sideways scroll, reduced motion (verdict still, ignores
anim-play, numbered list that jumps). The test page has overflow:hidden: in a page that scrolls, a touch swipe scrolls
the parent and the forwarded dy comes out tiny (measured 15 instead of 200). Exit 1 on any failure."""
import argparse, html, json, pathlib, sys, time
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser(); ap.add_argument('files', nargs='+'); ap.add_argument('--beats', required=True)
ap.add_argument('--stills', default='stills'); ap.add_argument('--test', default='test'); A = ap.parse_args()
STILLS, TEST = pathlib.Path(A.stills).resolve(), pathlib.Path(A.test).resolve()
STILLS.mkdir(parents=True, exist_ok=True); TEST.mkdir(parents=True, exist_ok=True)
BEATS = json.loads(pathlib.Path(A.beats).read_text())
RESULTS = []

def page_for(path):
    way = pathlib.Path(path).stem
    src = html.escape(pathlib.Path(path).read_text(), quote=True)
    p = TEST / f'{way}_test.html'
    p.write_text(f'''<!doctype html><html><head><meta charset="utf-8"><title>{way} contract test</title></head>
<body style="margin:0;background:#0f1420;color:#a8b0c0;font:14px sans-serif;overflow:hidden">
<p style="margin:8px">1100 px iframe</p><iframe id="w" style="border:0;width:1100px;height:300px;display:block" srcdoc="{src}"></iframe>
<p style="margin:8px">360 px iframe</p><iframe id="n" style="border:0;width:360px;height:300px;display:block" srcdoc="{src}"></iframe>
<script>window.__msgs={{w:[],n:[]}};
addEventListener('message',function(e){{var id=e.source===document.getElementById('w').contentWindow?'w':'n';
  window.__msgs[id].push(e.data); if(e.data&&e.data.type==='anim-height') document.getElementById(id).style.height=e.data.h+'px';}});
</script></body></html>''')
    return p

def check(name, ok, detail=''):
    RESULTS.append((name, bool(ok), detail)); print(('PASS ' if ok else 'FAIL ') + name + (f'  ({detail})' if detail else ''))

def msgs(pg, id_, typ): return [m for m in pg.evaluate(f'window.__msgs.{id_}') if isinstance(m, dict) and m.get('type') == typ]
def post(pg, id_, typ): pg.evaluate(f"document.getElementById('{id_}').contentWindow.postMessage({{type:'{typ}'}},'*')")
def vstate(fr): return fr.evaluate("(() => { const v = document.getElementById('v'); const on = document.querySelector('.cap .item.on .k'); return {paused: v.paused, t: v.currentTime, rs: v.readyState, step: on ? on.textContent : null}; })()")
def wait_seek(fr): fr.evaluate("new Promise(r => { const v = document.getElementById('v'); if (!v.seeking) return r(); v.addEventListener('seeked', () => r(), {once: true}); })"); time.sleep(0.25)

def run(path, b):
    way = pathlib.Path(path).stem
    beats = BEATS[way]
    N, V = len(beats['beats']), beats['verdict']
    starts, t = [], 0.0
    for x in beats['beats']: starts.append((t, t + x['still'])); t += x['dur']
    p = page_for(path)
    for id_, label in [('w', '1280'), ('n', '390')]:
        ctx = b.new_context(viewport={'width': 1140, 'height': 1600}, has_touch=True)
        pg = ctx.new_page(); pg.goto(p.as_uri()); time.sleep(2.5)
        fr = pg.frame_locator(f'#{id_}'); frame = pg.query_selector(f'#{id_}').content_frame()
        hs = msgs(pg, id_, 'anim-height')
        check(f'{way} {id_} anim-height arrives', hs and hs[-1]['h'] > 300, f"{len(hs)} msgs, last h={hs[-1]['h'] if hs else None}")
        s0 = vstate(frame)
        check(f'{way} {id_} paused before anim-play', s0['paused'] and abs(s0['t'] - starts[0][1]) < 0.3, f"t={s0['t']:.2f} step={s0['step']}")
        time.sleep(1.0); s1 = vstate(frame)
        check(f'{way} {id_} still paused 1 s later', s1['paused'] and abs(s1['t'] - s0['t']) < 0.01)
        post(pg, id_, 'anim-play'); time.sleep(2.0); s2 = vstate(frame)
        check(f'{way} {id_} plays on anim-play from step 1', (not s2['paused']) and 0.5 < s2['t'] < 3.5 and s2['step'].startswith('Step 1'), f"t={s2['t']:.2f}")
        post(pg, id_, 'anim-pause'); time.sleep(0.4); s3 = vstate(frame); time.sleep(0.6); s4 = vstate(frame)
        check(f'{way} {id_} pauses on anim-pause', s3['paused'] and abs(s4['t'] - s3['t']) < 0.01)
        # caption legibility at this width
        lg = frame.evaluate("(() => { const p = document.querySelector('.cap .item.on p'), k = document.querySelector('.cap .item.on .k'); const de = document.documentElement; return {fs: parseFloat(getComputedStyle(p).fontSize), ks: parseFloat(getComputedStyle(k).fontSize), sw: de.scrollWidth, cw: de.clientWidth}; })()")
        check(f'{way} {id_} caption + step line >= 16 px, no sideways scroll', lg['fs'] >= 16 and lg['ks'] >= 16 and lg['sw'] <= lg['cw'], json.dumps(lg))
        # rail jumps (paused) + stills for beat 1, verdict, last
        for k in sorted({1, 3, V, N}):
            frame.click(f'#rail button:nth-child({k})'); wait_seek(frame); sk = vstate(frame)
            check(f'{way} {id_} rail step {k} lands on its still', sk['paused'] and abs(sk['t'] - starts[k - 1][1]) < 0.15 and sk['step'].startswith(f'Step {k}'), f"t={sk['t']:.2f}")
            pg.query_selector(f'#{id_}').screenshot(path=str(STILLS / f'{way}_{label}_beat{k}.png'))
        # rail jump while playing resumes from the beat start
        post(pg, id_, 'anim-play'); time.sleep(0.5); frame.click('#rail button:nth-child(2)'); time.sleep(0.8); sj = vstate(frame)
        check(f'{way} {id_} rail jump while playing', (not sj['paused']) and starts[1][0] < sj['t'] < starts[1][0] + 2, f"t={sj['t']:.2f}")
        post(pg, id_, 'anim-pause'); time.sleep(0.3)
        # input forwarding: wheel, keys, swipe
        box = pg.query_selector(f'#{id_}').bounding_box(); cx, cy = box['x'] + box['width'] / 2, box['y'] + min(200, box['height'] / 2)
        pg.mouse.move(cx, cy); pg.mouse.wheel(0, 120); time.sleep(0.3)
        check(f'{way} {id_} wheel -> deck-wheel', any(m.get('dy') == 120 for m in msgs(pg, id_, 'deck-wheel')))
        frame.evaluate("document.body.tabIndex = -1; document.body.focus()"); pg.keyboard.press('ArrowDown'); pg.keyboard.press('PageUp'); time.sleep(0.3)
        keys = [m['key'] for m in msgs(pg, id_, 'deck-key')]
        check(f'{way} {id_} keys -> deck-key', 'ArrowDown' in keys and 'PageUp' in keys, str(keys))
        cdp = ctx.new_cdp_session(pg)
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': cx, 'y': cy + 150}]})
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': cx, 'y': cy + 50}]})
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': cx, 'y': cy - 50}]})
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); time.sleep(0.3)
        sw = msgs(pg, id_, 'deck-swipe')
        check(f'{way} {id_} swipe -> deck-swipe', any(m.get('dy', 0) > 150 for m in sw), str(sw[-1:] if sw else None))
        ctx.close()
    # reduced motion
    for id_, label in [('w', '1280'), ('n', '390')]:
        ctx = b.new_context(viewport={'width': 1140, 'height': 1600}, reduced_motion='reduce')
        pg = ctx.new_page(); pg.goto(p.as_uri()); time.sleep(2.5)
        frame = pg.query_selector(f'#{id_}').content_frame()
        post(pg, id_, 'anim-play'); time.sleep(1.2); s = vstate(frame)
        lst = frame.evaluate("(() => { const l = document.getElementById('list'); return {shown: getComputedStyle(l).display !== 'none', n: l.children.length, cap: getComputedStyle(document.getElementById('cap')).display}; })()")
        check(f'{way} {id_} reduced motion: ignores anim-play, shows verdict still', s['paused'] and abs(s['t'] - starts[V - 1][1]) < 0.15, f"t={s['t']:.2f}")
        check(f'{way} {id_} reduced motion: numbered caption list', lst['shown'] and lst['n'] == N and lst['cap'] == 'none', json.dumps(lst))
        pg.query_selector(f'#{id_}').screenshot(path=str(STILLS / f'{way}_{label}_reduced.png'))
        frame.click('#list li:nth-child(1) button'); wait_seek(frame); s1 = vstate(frame)
        check(f'{way} {id_} reduced motion: step list jumps between stills', s1['paused'] and abs(s1['t'] - starts[0][1]) < 0.15, f"t={s1['t']:.2f}")
        ctx.close()

with sync_playwright() as pw:
    b = pw.chromium.launch(channel='chrome')
    for f in A.files: run(f, b)
    b.close()
fails = [r for r in RESULTS if not r[1]]
print(f'\n{len(RESULTS) - len(fails)}/{len(RESULTS)} passed')
(TEST / 'results.json').write_text(json.dumps(RESULTS, indent=1))
sys.exit(1 if fails else 0)
