#!/usr/bin/env python3
# Style C builder: assembles shell.html + shell.css + head.js + src/<film>.svg + src/<film>.js + tail.js into one self-contained <film>.html per film, with a pacing gate and size budget. Inputs: beats.json, src dir.
"""python3 build.py beats.json --src src --out final [--budget 40960] [--css theme.css] [--runtime <dir with shell.html, shell.css, head.js, tail.js>]

--css appends a theme file after shell.css: redefine the :root tokens there (--panel, --ink, --muted, --line, --gold, --teal,
--cap-ink, --on-gold, ...) to match the host page. Colours inside src/<film>.svg are your own.

Fails (exit 1) if a beat is shorter than its reading floor, if a <text> has no data-b beat, or if a file is over budget.
beats.json format: ../common/beats.example.json (title, verdict, beats[title, caption, dur, still]); the film key names
src/<film>.svg (the world: one <svg id="scene"> holding <g id="world">, every <text> or an ancestor tagged data-b="k")
and src/<film>.js (the timeline, using head.js's R(), camTo(), draw(), T() and FR / ORDER camera frames).

Reading floor per beat:
  max(4.5, (caption words + NEW picture words) / 3 + 1.5) seconds
NEW picture words = words in <text> elements tagged data-b="k" (inherited from the nearest ancestor), minus words the
beat's own caption already says. Words shown in an earlier beat, or earlier in the same beat, are not counted again.
If a beat in beats.json has a "picture" field, the build warns when its words differ from the SVG's words for that beat
(pace_check.py reads the field, this build reads the SVG). Tag a label with the beat in which the camera first shows it.
"""
import argparse, json, pathlib, re, sys, xml.etree.ElementTree as ET

HERE = pathlib.Path(__file__).resolve().parent
ap = argparse.ArgumentParser(); ap.add_argument('beats'); ap.add_argument('--src', default='src'); ap.add_argument('--out', default='final')
ap.add_argument('--budget', type=int, default=40 * 1024); ap.add_argument('--runtime', default=str(HERE)); ap.add_argument('--css', default=None)
A = ap.parse_args()
SRC, RT, ROOT, BUDGET = pathlib.Path(A.src), pathlib.Path(A.runtime), pathlib.Path(A.out), A.budget
ROOT.mkdir(parents=True, exist_ok=True)
SPEC = {k: v for k, v in json.loads(pathlib.Path(A.beats).read_text()).items() if not k.startswith("_")}
WAYS = {k: dict(title=v["title"], tell=v["verdict"] - 1, beats=[(b["title"], b["caption"], b["dur"], b["still"]) for b in v["beats"]])
        for k, v in SPEC.items()}


def norm(tok):
    t = tok.lower().replace("’", "'").strip(".,:;!?()'\"‘“”")
    if t.endswith("'s"):
        t = t[:-2]
    if len(t) > 3 and t.endswith("s") and not t.endswith("ss"):
        t = t[:-1]
    return t


def toks(s):
    return [norm(x) for x in s.split() if re.search(r"[A-Za-z0-9]", x)]


def picture_words(svg_text):
    tree = ET.fromstring(svg_text)
    out, missing = {}, []

    def walk(el, beat):
        b = el.get("data-b", beat)
        if el.tag.endswith("text"):
            txt = "".join(el.itertext()).strip()
            if txt:
                if b is None:
                    missing.append(txt)
                else:
                    out.setdefault(int(b), []).extend(toks(txt))
        for c in el:
            walk(c, b)

    walk(tree, None)
    return out, missing


def main():
    head = (RT / "head.js").read_text()
    tail = (RT / "tail.js").read_text()
    css = "\n".join(l for l in (RT / "shell.css").read_text().splitlines() if not l.startswith("/* Style C")) + "\n"
    if A.css:
        css += pathlib.Path(A.css).read_text() + "\n"
    shell = (RT / "shell.html").read_text()
    ok = True
    report = {}
    for n, w in WAYS.items():
        svg = (SRC / f"{n}.svg").read_text()
        js = (SRC / f"{n}.js").read_text()
        pic, missing = picture_words(svg)
        if missing:
            ok = False
            print(f"FAIL {n}: <text> without data-b: {missing}")
        rows, seen = [], set()
        for k, (title, say, d, st) in enumerate(w["beats"], 1):
            cw = toks(say)
            capset = set(cw)
            new = list(dict.fromkeys(t for t in pic.get(k, []) if t not in capset and t not in seen))
            seen |= set(pic.get(k, []))
            floor = max(4.5, (len(cw) + len(new)) / 3 + 1.5)
            good = d + 1e-9 >= floor and 0 < st <= d
            ok &= good
            declared = SPEC[n]["beats"][k - 1].get("picture")
            if declared is not None and set(toks(declared)) != set(pic.get(k, [])):
                print(f"WARN {n} beat {k}: SVG words {sorted(set(pic.get(k, [])))} differ from beats.json picture {sorted(set(toks(declared)))}"
                      " -- pace_check.py and this build are counting different words; make them match")
            rows.append(dict(beat=k, title=title, caption_words=len(cw), new_picture_words=len(new),
                             floor=round(floor, 2), dur=d, still=st, ok=good, new=new))
        beats = [dict(t=t, say=s, d=d, still=st) for (t, s, d, st) in w["beats"]]
        total = sum(b["d"] for b in beats)
        page = (shell.replace("{{TITLE}}", w["title"]).replace("{{CSS}}", css).replace("{{SVG}}", svg.strip())
                .replace("{{JS}}", head.replace("/*BEATS*/null", json.dumps(beats, ensure_ascii=False)).replace("/*TELL*/0", str(w["tell"])) + js + tail))
        # light minify: drop indentation and blank lines (keeps the file readable enough to diff)
        page = "\n".join(l.strip() for l in page.splitlines()
                         if l.strip() and not l.strip().startswith(("// Style C", "/* Style C", "<!-- Style C")))  # drop the runtime files' header comments
        out = ROOT / f"{n}.html"
        out.write_text(page)
        size = len(page.encode())
        if size > BUDGET:
            ok = False
            print(f"FAIL {n}: {size} bytes > {BUDGET}")
        report[n] = dict(bytes=size, loop_s=round(total + 0.6, 2), beats=rows)
        print(f"{n}.html  {size/1024:.1f} KB  loop {total + 0.6:.1f} s (beats {total:.1f} s + 0.6 s fade)")
        for r in rows:
            print(f"  beat {r['beat']} {r['title']:<28} caption {r['caption_words']:>2} + new picture {r['new_picture_words']:>2} words"
                  f" -> floor {r['floor']:>5.2f} s, built {r['dur']:>5.2f} s  {'ok' if r['ok'] else 'SHORT'}  new={r['new']}")
    (ROOT / "build_report.json").write_text(json.dumps(report, indent=1))
    if not ok:
        print("BUILD FAILED")
        sys.exit(1)
    print("build ok")


if __name__ == "__main__":
    main()
