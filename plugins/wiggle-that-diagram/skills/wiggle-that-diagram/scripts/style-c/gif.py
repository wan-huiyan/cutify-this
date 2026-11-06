#!/usr/bin/env python3
# Style C picture for a README or a chat: seeks a built film through one beat in real Chrome, screenshots every frame and encodes a looping GIF (or one PNG still). Inputs: html path, beat, start/end seconds into the beat.
"""uv run --with playwright python gif.py final/film1.html --beat 4 --from 1.9 --to 8.6 --out film1.gif [--width 960] [--fps 12] [--colors 128] [--hold 1.5]
uv run --with playwright python gif.py final/film1.html --beat 5 --still 9.4 --out film1.png [--width 960]

--beat is 1-based (as on the step rail). Frames are taken by seeking (window.__anim.seek), so the GIF is exact and does not
depend on machine speed. The whole film (picture + caption + rail) is shot at --width CSS px, 1x. Pick a beat where things move
and the caption names what moves; start after the camera has arrived. Look at the result before using it.
Needs ffmpeg ($FFMPEG, PATH, or ~/.local/bin/ffmpeg)."""
import argparse, os, pathlib, shutil, subprocess, sys, tempfile
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser(); ap.add_argument('html'); ap.add_argument('--beat', type=int, required=True)
ap.add_argument('--from', dest='t0', type=float, default=0.0); ap.add_argument('--to', dest='t1', type=float)
ap.add_argument('--still', type=float); ap.add_argument('--out', required=True); ap.add_argument('--width', type=int, default=960)
ap.add_argument('--fps', type=int, default=12); ap.add_argument('--colors', type=int, default=128); ap.add_argument('--hold', type=float, default=1.5)
A = ap.parse_args()
if A.still is None and A.t1 is None:
    sys.exit("give --to (GIF) or --still (PNG)")
ff = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or str(pathlib.Path.home() / ".local/bin/ffmpeg")
tmp = pathlib.Path(tempfile.mkdtemp())
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    pg = b.new_page(viewport={"width": A.width, "height": 1000}, device_scale_factor=1)
    pg.goto(pathlib.Path(A.html).resolve().as_uri())
    pg.wait_for_function("window.__anim && document.fonts.status==='loaded'", timeout=20000)
    B = pg.evaluate("__anim.B")[A.beat - 1]
    first = A.still if A.still is not None else A.t0
    pg.evaluate(f"__anim.seek({B + first})"); pg.wait_for_timeout(700)  # let the caption fade-in finish
    if A.still is not None:
        pg.locator("#anim").screenshot(path=A.out); b.close(); print(A.out); sys.exit()
    n = int(round((A.t1 - A.t0) * A.fps))
    for i in range(n + 1):
        pg.evaluate(f"__anim.seek({B + A.t0 + i / A.fps})")
        pg.locator("#anim").screenshot(path=str(tmp / f"{i:04d}.png"))
    b.close()
vf = (f"tpad=stop_mode=clone:stop_duration={A.hold},split[a][b];[a]palettegen=max_colors={A.colors}:stats_mode=diff[p];"
      "[b][p]paletteuse=dither=none:diff_mode=rectangle")
subprocess.run([ff, "-loglevel", "error", "-y", "-framerate", str(A.fps), "-i", str(tmp / "%04d.png"), "-vf", vf, A.out], check=True)
shutil.rmtree(tmp)
print(f"{A.out}  {n + 1} frames  {pathlib.Path(A.out).stat().st_size / 1024:.0f} KB")
