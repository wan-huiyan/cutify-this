#!/usr/bin/env python3
# Style C camera speed printout: samples the virtual camera every 50 ms between two times and prints pan (frame widths/s) and zoom (log-width/s). Inputs: html path, t0, t1.
"""uv run --with playwright python camdbg.py final/film1.html 24 28
Use it when a move feels jerky or the contract test reports a quick move you did not intend: a calm glide stays under
about 1.2 widths/s pan and 1.5/s zoom; a spike in the middle of a move means frames were interpolated before fitting
to the aspect (fit first, then interpolate width in log space; head.js already does this)."""
import math, pathlib, sys
from playwright.sync_api import sync_playwright
if len(sys.argv) < 4: sys.exit(__doc__)
src = pathlib.Path(sys.argv[1]).resolve(); t0, t1 = float(sys.argv[2]), float(sys.argv[3])
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome"); pg = b.new_page(viewport={"width": 1100, "height": 900})
    pg.goto(src.as_uri()); pg.wait_for_function("window.__anim")
    pg.wait_for_timeout(500)
    s = pg.evaluate(f"(()=>{{const o=[];for(let t={t0};t<={t1};t+=0.05){{__anim.seek(t);o.push([+t.toFixed(2),__anim.cam()])}}return o}})()")
    prev = None
    for t, v in s:
        x, y, w, h = map(float, v.split()); c = (x + w / 2, y + h / 2)
        if prev:
            dt = t - prev[0]; pan = math.hypot(c[0] - prev[1][0], c[1] - prev[1][1]) / w / dt; z = abs(math.log(w / prev[2])) / dt
            print(t, [round(q) for q in c], round(w), 'pan %.2f zoom %.2f' % (pan, z))
        prev = (t, c, w)
    b.close()
