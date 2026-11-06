#!/usr/bin/env python3
# Label check during camera moves: seeks an embed (paused, 1100 px srcdoc iframe, real Chrome) to given times and screenshots it. Inputs: html path, times.
"""uv run --with playwright python midmove.py final/film1.html 24.4 45.0 64.0 [--out work]
Pick times in the MIDDLE of camera moves (from the film def's cam list). Look at each shot: every HTML label must still sit on
its object. If one floats, the dumped camera track is stale (re-run render_way.py) or the label's wx/wy is wrong.
Works with any embed exposing window.__anim.seek(t) and __anim.state().ready (style A) or window.__anim.seek (style C)."""
import argparse
from pathlib import Path
from playwright.sync_api import sync_playwright
ap = argparse.ArgumentParser(usage=__doc__); ap.add_argument('html'); ap.add_argument('times', nargs='+', type=float); ap.add_argument('--out', default='work')
a = ap.parse_args(); src, ts, out = Path(a.html), a.times, Path(a.out)
out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome'); pg = b.new_page(viewport={'width': 1280, 'height': 900})
    pg.set_content('<iframe id=f style="width:1100px;height:760px;border:0"></iframe>')
    pg.evaluate('s=>{f.srcdoc=s}', src.read_text()); pg.wait_for_timeout(1500)
    fr = pg.frames[1]; fr.wait_for_function('window.__anim && (!__anim.state || __anim.state().ready)')
    for t in ts:
        fr.evaluate(f'__anim.seek({t})'); pg.wait_for_timeout(700)
        shot = out / f'mid_{src.stem}_{t}.png'; pg.locator('#f').screenshot(path=str(shot)); print(shot)
    b.close()
