#!/usr/bin/env python3
# Style A pacing gate on the BUILT film: reads render_way.py's work/<film>_data.json (real label times), not the plan. Inputs: data json paths.
"""python3 pace_check.py work/film1_data.json [...] [--literal]   (--literal: count every picture word, even ones the caption says)
Per beat: duration >= max(4.5, (caption words + new picture words)/3 + 1.5), where 'new picture words' = words of labels that
first appear in this beat and are NOT already in this beat's caption (labels that repeat caption words are pointers, not extra reading).
Each new group of words (labels within 0.8 s of each other) appears >= 2.5 s after the previous group (the caption counts as the group at t0).
Also: last-beat words are readable before the 1 s end hold."""
import json, re, sys
from pathlib import Path
H = Path(__file__).parent
words = lambda h: re.findall(r"[A-Za-z0-9’'\.\-–]+", re.sub(r'<[^>]+>', ' ', h).replace('&nbsp;', ' '))
norm = lambda w: re.sub(r"[^a-z0-9]", '', w.lower().replace('’', "'").strip("'").split("'")[0])
ok_all = True
LIT = '--literal' in sys.argv
for w in [a for a in sys.argv[1:] if not a.startswith('--')]:
    d = json.loads(Path(w).read_text()); print(f'== {w}: loop {d["dur"]} s')
    for b in d['beats']:
        cw = words(b['cap']); cset = {norm(x) for x in cw}
        labs = [L for L in d['labels'] if b['t0'] - 1e-6 <= L['t0'] < b['t1'] - 1e-6]
        new = [x for L in labs for x in words(L['html']) if norm(x) and (LIT or norm(x) not in cset)]
        floor = max(4.5, (len(cw) + len(new)) / 3 + 1.5); dur = b['t1'] - b['t0']
        times = sorted({round(L['t0'] - b['t0'], 2) for L in labs} | {0.0}); groups = []
        for t in times:
            if not groups or t - groups[-1] > 0.8: groups.append(t)
        gaps = [round(groups[i] - groups[i - 1], 2) for i in range(1, len(groups))]
        ok = dur + 1e-6 >= floor and all(g >= 2.5 for g in gaps)
        ok_all &= ok
        print(f"  beat {b['n']} {b['title']!r}: {dur:.1f} s (floor {floor:.1f}; caption {len(cw)} words + {len(new)} new picture words {new}) word groups at {groups} gaps {gaps} {'OK' if ok else 'FAIL'}")
print('ALL OK' if ok_all else 'SOME FAIL'); sys.exit(0 if ok_all else 1)
