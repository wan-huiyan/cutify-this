#!/usr/bin/env python3
# Style B encoder + inliner: encodes a film's master render to a small square H.264 and inlines it with a poster into player.html -> <film>.html. Inputs: film names, beats.json.
"""python3 build_html.py film1 [film2 ...] --beats beats.json [--work work] [--out final] [--start-crf 30] [--size 720] [--fps 24]
Reads work/<film>_master.mp4 (from the huashu render.py) and beats.json (title, alt, verdict, beats). Tries CRF from
--start-crf upward and keeps the lowest CRF (best quality) whose HTML fits --limit bytes (default 880,000, leaving headroom
under a 900,000-byte budget). Forces a keyframe at every beat start so step jumps land fast. ffmpeg: $FFMPEG, then PATH, then ~/.local/bin/ffmpeg."""
import argparse, base64, json, os, pathlib, shutil, subprocess, sys

H = pathlib.Path(__file__).resolve().parent
FF = os.environ.get('FFMPEG') or shutil.which('ffmpeg') or os.path.expanduser('~/.local/bin/ffmpeg')
ap = argparse.ArgumentParser(); ap.add_argument('films', nargs='+'); ap.add_argument('--beats', required=True)
ap.add_argument('--work', default='work'); ap.add_argument('--out', default='final'); ap.add_argument('--template', default=str(H / 'player.html'))
ap.add_argument('--start-crf', type=int, default=30); ap.add_argument('--limit', type=int, default=880_000)
ap.add_argument('--size', type=int, default=720); ap.add_argument('--fps', type=int, default=24)
A = ap.parse_args(); WORK = pathlib.Path(A.work); OUT = pathlib.Path(A.out); OUT.mkdir(parents=True, exist_ok=True)

def build(way):
    spec = json.loads(pathlib.Path(A.beats).read_text())[way]
    beats, t = [], 0.0
    for b in spec['beats']:
        beats.append({'t0': round(t, 3), 't1': round(t + b['dur'], 3), 'still': round(t + b['still'], 3), 'title': b['title'], 'caption': b['caption']})
        t += b['dur']
    master = WORK / f'{way}_master.mp4'
    kf = ','.join(f"{b['t0']:.3f}" for b in beats)
    poster = WORK / f'{way}_poster.jpg'
    vt = beats[spec['verdict'] - 1]['still']
    subprocess.run([FF, '-v', 'error', '-y', '-ss', str(vt), '-i', str(master), '-frames:v', '1', '-vf', 'scale=480:-2:flags=lanczos', '-q:v', '6', str(poster)], check=True)
    tpl = ''.join(l for l in pathlib.Path(A.template).read_text().splitlines(True) if not l.startswith('<!-- Style B player'))  # drop the template's header comment
    for crf in range(A.start_crf, 41):
        mp4 = WORK / f'{way}_{A.size}.mp4'
        subprocess.run([FF, '-v', 'error', '-y', '-i', str(master), '-vf', f'fps={A.fps},scale={A.size}:-2:flags=lanczos', '-c:v', 'libx264', '-preset', 'veryslow',
                        '-tune', 'animation', '-crf', str(crf), '-pix_fmt', 'yuv420p', '-g', '900', '-keyint_min', '20', '-sc_threshold', '0',
                        '-force_key_frames', kf, '-movflags', '+faststart', '-an', str(mp4)], check=True)
        html = (tpl.replace('__TITLE__', spec['title']).replace('__ALT__', spec['alt'].replace('"', '&quot;'))
                   .replace('__BEATS__', json.dumps(beats)).replace('__VERDICT__', str(spec['verdict']))
                   .replace('__POSTER__', base64.b64encode(poster.read_bytes()).decode())
                   .replace('__VIDEO__', base64.b64encode(mp4.read_bytes()).decode()))
        if len(html.encode()) <= A.limit: break
    out = OUT / f'{way}.html'
    out.write_text(html)
    print(f'{way}: crf {crf}  mp4 {mp4.stat().st_size // 1024} KB  poster {poster.stat().st_size // 1024} KB  html {out.stat().st_size // 1024} KB  length {t:.1f} s')

for w in A.films: build(w)
