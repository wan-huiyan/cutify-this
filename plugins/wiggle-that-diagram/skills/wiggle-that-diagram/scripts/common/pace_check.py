#!/usr/bin/env python3
# Pacing gate for the caption script, run BEFORE briefing any style and again after timing changes. Input: a beats.json (see beats.example.json).
"""Checks every beat of every film in a beats.json against the reading rule and prints the shortest loop the captions allow.

  python3 pace_check.py beats.json            # the house rule (below)
  python3 pace_check.py beats.json --literal  # count every picture word, even ones the caption already says
  python3 pace_check.py beats.json --target film1=30   # also warn when the floor sum is over a loop target (seconds)

The rule (one definition, used by every style so switching style shows the same lengths):
  beat length >= max(4.5, (caption words + NEW picture words) / 3 + 1.5) seconds
  NEW picture words = words in the beat's "picture" field that
    - are not already said by this beat's caption (a label that repeats the caption is recognised, not read again), and
    - were not shown on the picture in an EARLIER beat of the same film.
  Word matching: lower case, punctuation stripped, possessive 's and a plural s dropped.
Spacing (only when the beat lists "reveals"): the caption counts as a group of words shown at beat time 0; every later
group must appear >= 2.5 s after the previous group, and the last group must leave >= max(2.5, its words/3 + 1) s before the
beat ends.
Exit code 1 if any beat fails."""
import json, re, sys
from pathlib import Path


def norm(tok):
    t = tok.lower().replace("’", "'").strip(".,:;!?()'\"‘“”·")
    if t.endswith("'s"):
        t = t[:-2]
    if len(t) > 3 and t.endswith("s") and not t.endswith("ss"):
        t = t[:-1]
    return t


def toks(s):
    return [norm(x) for x in (s or "").split() if re.search(r"[A-Za-z0-9]", x)]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit(__doc__)
    literal = "--literal" in sys.argv
    targets = {}
    for i, a in enumerate(sys.argv):
        if a == "--target" and i + 1 < len(sys.argv):
            k, v = sys.argv[i + 1].split("=")
            targets[k] = float(v)
    data = json.loads(Path(args[0]).read_text())
    ok_all = True
    for film, spec in data.items():
        if film.startswith("_"):
            continue
        seen, total, cap_floor, floor_sum = set(), 0.0, 0.0, 0.0
        print(f"== {film}: {spec.get('title', '')}")
        for k, b in enumerate(spec["beats"], 1):
            cw = toks(b["caption"])
            capset = set(cw)
            pw = toks(b.get("picture", ""))
            new = pw if literal else list(dict.fromkeys(t for t in pw if t not in capset and t not in seen))
            seen |= set(pw)
            floor = max(4.5, (len(cw) + len(new)) / 3 + 1.5)
            cap_floor += max(4.5, len(cw) / 3 + 1.5)
            floor_sum += floor
            dur = float(b["dur"])
            problems = []
            if dur + 1e-9 < floor:
                problems.append(f"short by {floor - dur:.1f} s")
            if not (0 < float(b.get("still", dur - 0.6)) <= dur):
                problems.append("still is outside the beat")
            rev = sorted(b.get("reveals", []))
            if rev:
                groups = [0.0] + rev
                gaps = [round(groups[i] - groups[i - 1], 2) for i in range(1, len(groups))]
                if any(g < 2.5 for g in gaps):
                    problems.append(f"reveal gaps {gaps} (need >= 2.5)")
                last_words = max(1, len(new) // max(1, len(rev)))
                if dur - rev[-1] + 1e-9 < max(2.5, last_words / 3 + 1):
                    problems.append(f"last reveal at {rev[-1]} s leaves {dur - rev[-1]:.1f} s to read")
            ok = not problems
            ok_all &= ok
            print(f"  {'OK  ' if ok else 'FAIL'} beat {k} {b['title']!r}: {dur:.1f} s, floor {floor:.1f} s "
                  f"(caption {len(cw)} + new picture {len(new)} words){'  -- ' + '; '.join(problems) if problems else ''}")
            total += dur
        print(f"  loop as planned: {total:.1f} s (+ a held last frame >= 1 s inside the last beat)")
        print(f"  shortest loop the captions alone allow: {cap_floor:.1f} s; with picture words: {floor_sum:.1f} s")
        if film in targets and floor_sum > targets[film]:
            print(f"  WARNING: floor sum {floor_sum:.1f} s is over the target {targets[film]:.0f} s. Shorten the captions "
                  f"(in every style at once) or accept a longer loop; do not cut beats below the floor.")
    print("ALL OK" if ok_all else "SOME BEATS FAIL")
    sys.exit(0 if ok_all else 1)


if __name__ == "__main__":
    main()
