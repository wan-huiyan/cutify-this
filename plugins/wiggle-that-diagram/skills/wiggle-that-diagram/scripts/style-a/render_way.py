#!/usr/bin/env python3
# Style A renderer: boots a huashu engine copy, dumps player data (beats, captions, labels, camera track) and renders a text-free H.264 + webp poster. Inputs: film name, engine dir.
"""Render one film. The engine copy must contain eras_<film>.js (loaded by the engine's ?film=<film> boot param) whose
SCENE_LIBS load way_make.js and the film's scene file; the scene file calls WAY.make(def), which sets window.WT.

  uv run --with playwright python render_way.py film1 --engine ./engine --stills 3.0,9.5  -> work/film1_stills/t003.00.png ...
  uv run --with playwright python render_way.py film1 --engine ./engine --scale 0.75 --crf 30
        -> work/film1.mp4, work/film1_poster.webp, work/film1_data.json (input to build.py and pace_check.py)
Re-run after ANY change to scene geometry, camera or timing: the HTML labels are placed from the dumped camera track,
so a stale dump makes labels drift off their objects. Rendering frames needs no H.264 decoding, so plain Playwright
Chromium is fine here (the contract test needs real Chrome). ffmpeg: $FFMPEG, then PATH, then ~/.local/bin/ffmpeg.
"""
import argparse, base64, functools, http.server, json, os, shutil, socketserver, subprocess, sys, threading, time
from pathlib import Path
from playwright.sync_api import sync_playwright

FF = os.environ.get('FFMPEG') or shutil.which('ffmpeg') or os.path.expanduser('~/.local/bin/ffmpeg')
ap = argparse.ArgumentParser(); ap.add_argument('film'); ap.add_argument('--engine', default='engine'); ap.add_argument('--work', default='work'); ap.add_argument('--stills'); ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--crf', type=int, default=28); ap.add_argument('--scale', type=float, default=1.0)
a = ap.parse_args()
ENG = Path(a.engine).resolve(); WORK = Path(a.work).resolve(); WORK.mkdir(parents=True, exist_ok=True)

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
class S(socketserver.ThreadingTCPServer):
    request_queue_size = 128; daemon_threads = True
srv = S(('127.0.0.1', 0), functools.partial(Q, directory=str(ENG))); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

DUMP = r"""(fps) => {
  const T = window.WT, N = Math.round(T.DUR * fps), cam = [];
  let last = null;
  for (let i = 0; i < N; i++) { const k = T.camAt(i / fps), v = [+k.x.toFixed(2), +k.y.toFixed(2), +k.z.toFixed(4)];
    if (!last || v[0] !== last[0] || v[1] !== last[1] || v[2] !== last[2]) { cam.push([i, ...v]); last = v; } }
  return { way: T.def.way, fps, n: N, dur: T.DUR, poster: T.POSTER_T, beats: T.CAPTIONS, labels: T.LABELS, cam };
}"""
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    for attempt in range(3):
        pg.goto(f'http://127.0.0.1:{port}/index.html?render=1&film={a.film}&w=1280&h=720')
        pg.wait_for_function('window.__ready === true || !!window.__bootFailed', timeout=60000)
        bf = pg.evaluate('window.__bootFailed || null')
        if not bf: break
        print('boot failed, retrying:', bf, file=sys.stderr)
    else: raise SystemExit('boot failed')
    data = pg.evaluate(DUMP, a.fps); data['way'] = a.film
    (WORK / f'{a.film}_data.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    grab = "async (t)=>{ await window.prepare(t); window.renderFrame(t); return window.__canvas.toDataURL('image/png').split(',')[1]; }"
    if a.stills:
        out = WORK / f'{a.film}_stills'; out.mkdir(exist_ok=True)
        for s in a.stills.split(','):
            (out / f't{float(s):06.2f}.png').write_bytes(base64.b64decode(pg.evaluate(grab, float(s))))
        print('stills ->', out)
    else:
        kf = ','.join(f"{bt['t0']:.3f}" for bt in data['beats'])
        vf = 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p'
        if a.scale != 1.0: vf = f'scale={int(1280*a.scale)//2*2}:{int(720*a.scale)//2*2}:flags=lanczos,' + vf
        mp4 = WORK / f'{a.film}.mp4'
        ff = subprocess.Popen([FF, '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', str(a.fps), '-c:v', 'png', '-i', '-', '-vf', vf,
            '-c:v', 'libx264', '-preset', 'slow', '-crf', str(a.crf), '-tune', 'animation', '-g', '9999', '-x264-params', 'scenecut=0', '-force_key_frames', kf,
            '-movflags', '+faststart', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-an', str(mp4)], stdin=subprocess.PIPE)
        st = time.time()
        for i in range(data['n']):
            png = base64.b64decode(pg.evaluate(grab, i / a.fps)); ff.stdin.write(png)
            if i == round(data['poster'] * a.fps): (WORK / f'{a.film}_poster.png').write_bytes(png)
            if i % 300 == 0: print(f'{i}/{data["n"]} {time.time()-st:.0f}s', flush=True)
        ff.stdin.close(); ff.wait()
        subprocess.run([FF, '-v', 'error', '-y', '-i', str(WORK / f'{a.film}_poster.png'), '-vf', 'scale=960:-2', '-c:v', 'libwebp', '-quality', '72', str(WORK / f'{a.film}_poster.webp')], check=True)
        print('mp4', mp4.stat().st_size // 1024, 'KB; poster', (WORK / f'{a.film}_poster.webp').stat().st_size // 1024, 'KB')
    b.close()
srv.shutdown()
if errs: raise SystemExit('page errors:\n' + '\n'.join(errs))
