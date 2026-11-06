#!/usr/bin/env python3
# Style A inliner: puts one film's text-free mp4, webp poster and player data into player_template.html -> one self-contained <film>.html. Inputs: film names, meta.json.
"""python3 build.py film1 [film2 ...] --meta meta.json [--work work] [--out final] [--budget 900000]

meta.json: {"film1": {"title": "...", "aria": "How X works, in N steps", "alt": "one-paragraph description of the poster frame"}}
Needs work/<film>.mp4, work/<film>_poster.webp, work/<film>_data.json from render_way.py. Exit 1 when a file is over budget."""
import argparse, base64, json, sys
from pathlib import Path

H = Path(__file__).parent
ap = argparse.ArgumentParser(); ap.add_argument('films', nargs='+'); ap.add_argument('--meta', required=True)
ap.add_argument('--work', default='work'); ap.add_argument('--out', default='final'); ap.add_argument('--budget', type=int, default=900_000)
ap.add_argument('--template', default=str(H / 'player_template.html'))
a = ap.parse_args()
META = json.loads(Path(a.meta).read_text()); WORK = Path(a.work); OUT = Path(a.out); OUT.mkdir(parents=True, exist_ok=True)
bad = False
for f in a.films:
    d = json.loads((WORK / f'{f}_data.json').read_text())
    for L in d['labels']:
        for k in ('dup', 'beat', 'follow'): L.pop(k, None)
        L['t0'] = round(L['t0'], 3); L['t1'] = round(L['t1'], 3)
    m = META[f]
    s = ''.join(l for l in Path(a.template).read_text().splitlines(True) if not l.startswith('<!-- Style A player'))  # drop the template's header comment
    s = s.replace('/*TITLE*/', m['title']).replace('/*ARIA*/', m['aria']).replace('/*ALT*/', m['alt'].replace('"', '&quot;'))
    s = s.replace('/*DATA*/null', json.dumps(d, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/'))
    s = s.replace('/*VIDEO*/', base64.b64encode((WORK / f'{f}.mp4').read_bytes()).decode())
    s = s.replace('/*POSTER*/', base64.b64encode((WORK / f'{f}_poster.webp').read_bytes()).decode())
    out = OUT / f'{f}.html'; out.write_text(s)
    n = out.stat().st_size
    print(f'{out} {n} bytes ({n/1000:.0f} KB) loop {d["dur"]} s', 'OK' if n <= a.budget else f'OVER {a.budget} BYTE BUDGET')
    bad |= n > a.budget
sys.exit(1 if bad else 0)
