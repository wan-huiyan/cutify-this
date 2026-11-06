#!/usr/bin/env python3
# Style C extra-width check: shoots each embed's most telling frame in a 708 px and a 340 px iframe and prints caption size and the on-screen size of 13-unit picture text. Inputs: html paths.
"""uv run --with playwright python widthcheck.py final/film1.html [...] [--out review] [--widths 708,340]
708 px is where the 4:3 portrait camera frames kick in; 340 px is the narrowest width the contract allows. Look at the PNGs:
nothing cut off or overlapping. Picture text under 16 px is expected on phones; the caption must carry the meaning."""
import argparse, pathlib
from playwright.sync_api import sync_playwright
ap = argparse.ArgumentParser(); ap.add_argument('files', nargs='+'); ap.add_argument('--out', default='review'); ap.add_argument('--widths', default='708,340')
A = ap.parse_args(); out = pathlib.Path(A.out); out.mkdir(parents=True, exist_ok=True)
P = '<!doctype html><body style="margin:0;background:#0f1420"><iframe id="f" style="border:0;display:block;width:%dpx;height:300px"></iframe><script>addEventListener("message",e=>{if(e.data&&e.data.type==="anim-height")f.style.height=e.data.h+"px"})</script></body>'
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    for iw in [int(x) for x in A.widths.split(',')]:
        for f in A.files:
            pg = b.new_page(viewport={"width": iw + 20, "height": 900}, device_scale_factor=2)
            pg.set_content(P % iw); pg.evaluate("h=>{f.srcdoc=h}", pathlib.Path(f).read_text())
            pg.wait_for_timeout(300); fr = pg.frames[1]; fr.wait_for_function("window.__anim&&document.fonts.status==='loaded'")
            a = fr.evaluate("__anim"); k = a["tell"]; fr.evaluate(f"__anim.seek({a['B'][k]+a['beats'][k]['still']})")
            px = fr.evaluate("(()=>{const s=document.getElementById('scene');return +(13*s.clientWidth/s.viewBox.baseVal.width).toFixed(1)})()")
            fs = fr.evaluate("parseFloat(getComputedStyle(document.querySelector('#cap p')).fontSize)")
            shot = out / f"w{iw}_{pathlib.Path(f).stem}.png"
            pg.wait_for_timeout(200); pg.locator("#f").screenshot(path=str(shot)); print(iw, f, "picture 13-unit text", px, "px; caption", fs, "px ->", shot)
            pg.close()
    b.close()
