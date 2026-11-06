#!/usr/bin/env python3
# Style C contract + timing test: loads each embed into an <iframe srcdoc> at 1100 px and 360 px in real Chrome; checks the embed contract, reveal spacing, camera calm and the end hold; shoots stills. Inputs: html paths.
"""uv run --with playwright python test_contract.py final/film1.html [final/film2.html ...] [--stills final/stills] [--no-stills]
Needs the style C runtime hooks (head.js/tail.js): window.__anim = {time(), playing(), seek(t), B, END, REV, beats, tell, cam()},
#anim, #scene, #world, #cap p, #pp, #steps buttons. Writes <stills>/../test_report.json; exits 1 if any check fails.
Timing checks: every logged reveal waits >= 2.5 s after the previous words; at most one quick camera move per film
(pan > 1.2 widths/s or zoom > 1.5/s); the camera holds >= 1 s before the loop fade."""
import argparse, json, math, pathlib, sys
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser(); ap.add_argument('files', nargs='+'); ap.add_argument('--stills', default='stills'); ap.add_argument('--no-stills', action='store_true')
A = ap.parse_args()
STILLS = pathlib.Path(A.stills).resolve()
STILLS.mkdir(parents=True, exist_ok=True)
SHOOT = not A.no_stills
WAYS = [pathlib.Path(f).resolve() for f in A.files]
SIZES = [("1280", 1280, 1100, 900), ("390", 390, 360, 844)]  # still label, viewport w, iframe w, viewport h

PARENT = """<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#0f1420"><div style="padding:0 {pad}px"><iframe id="f" title="animation" style="border:0;display:block;width:{w}px;height:240px"></iframe></div>
<script>window.__msgs=[];addEventListener('message',function(e){{if(e.source!==document.getElementById('f').contentWindow)return;__msgs.push(e.data);
if(e.data&&e.data.type==='anim-height')document.getElementById('f').style.height=e.data.h+'px'}});</script></body></html>"""

results, fails = {}, []


def check(name, ok, detail=""):
    results.setdefault(cur, []).append({"check": name, "ok": bool(ok), "detail": detail})
    if not ok:
        fails.append(f"{cur}: {name} -- {detail}")
    print(("  ok   " if ok else "  FAIL ") + name + (f"  ({detail})" if detail else ""))


def load(ctx, way, vw, iw):
    pg = ctx.new_page()
    errs = []
    pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.set_content(PARENT.format(w=iw, pad=(vw - iw) // 2))
    html = way.read_text()
    pg.evaluate("h=>{document.getElementById('f').srcdoc=h}", html)
    pg.wait_for_function("window.__msgs.some(m=>m&&m.type==='anim-height')", timeout=20000)
    fr = pg.frame_locator("#f")
    frame = pg.frames[1]
    frame.wait_for_function("window.__anim && document.fonts.status==='loaded'", timeout=20000)
    pg.wait_for_timeout(400)
    return pg, frame, errs


def msgs(pg, t=None):
    return pg.evaluate("t=>window.__msgs.filter(m=>m&&(!t||m.type===t))", t)


with sync_playwright() as p:
    br = p.chromium.launch(channel="chrome")
    for way in WAYS:
        name = way.stem
        for label, vw, iw, vh in SIZES:
            cur = f"{name}@{iw}"
            print(f"== {cur}")
            ctx = br.new_context(viewport={"width": vw, "height": vh}, device_scale_factor=2, has_touch=True)
            pg, fr, errs = load(ctx, way, vw, iw)
            hs = [m["h"] for m in msgs(pg, "anim-height")]
            check("anim-height arrives", len(hs) >= 1, f"heights {hs}")
            ifh = pg.evaluate("document.getElementById('f').getBoundingClientRect().height")
            inner = fr.evaluate("Math.ceil(document.getElementById('anim').getBoundingClientRect().height)")
            se = fr.evaluate("document.documentElement.scrollHeight")
            check("iframe height = content height, no inner scroll", abs(ifh - inner) <= 1 and se <= inner + 1, f"iframe {ifh}, content {inner}, documentElement.scrollHeight {se}")
            a = fr.evaluate("window.__anim")
            t0 = fr.evaluate("__anim.time()")
            pg.wait_for_timeout(1500)
            t1 = fr.evaluate("__anim.time()")
            check("starts paused in the deck (no autoplay)", t0 == t1 and not fr.evaluate("__anim.playing()"), f"t {t0:.2f} -> {t1:.2f}")
            check("paused poster is beat 1 with picture visible", abs(t0 - (a["B"][0] + a["beats"][0]["still"])) < .05 and float(fr.evaluate("getComputedStyle(document.getElementById('world')).opacity")) > .99, f"t={t0:.2f}")
            pg.evaluate("document.getElementById('f').contentWindow.postMessage({type:'anim-play'},'*')")
            pg.wait_for_timeout(1600)
            t2 = fr.evaluate("__anim.time()")
            check("plays on anim-play (from the start)", fr.evaluate("__anim.playing()") and 1.0 < t2 < 2.4, f"t={t2:.2f}")
            pg.evaluate("document.getElementById('f').contentWindow.postMessage({type:'anim-pause'},'*')")
            pg.wait_for_timeout(100)
            t3 = fr.evaluate("__anim.time()")
            pg.wait_for_timeout(800)
            t4 = fr.evaluate("__anim.time()")
            check("pauses on anim-pause", t3 == t4 and not fr.evaluate("__anim.playing()"), f"{t3:.2f} -> {t4:.2f}")
            # input forwarding
            box = pg.locator("#f").bounding_box()
            cx, cy = box["x"] + box["width"] / 2, box["y"] + min(150, box["height"] / 3)
            pg.mouse.move(cx, cy)
            pg.mouse.wheel(0, 120)
            pg.wait_for_timeout(200)
            w = msgs(pg, "deck-wheel")
            check("wheel -> deck-wheel", len(w) >= 1 and w[-1]["dy"] > 0, json.dumps(w[-1:]))
            pg.mouse.click(cx, cy)
            pg.keyboard.press("ArrowDown")
            pg.keyboard.press("PageUp")
            pg.keyboard.press(" ")
            pg.wait_for_timeout(200)
            k = [m["key"] for m in msgs(pg, "deck-key")]
            check("keys -> deck-key", k[-3:] == ["ArrowDown", "PageUp", " "], f"{k}")
            cdp = ctx.new_cdp_session(pg)
            for typ, y in (("touchStart", cy + 120), ("touchMove", cy + 40), ("touchEnd", None)):
                cdp.send("Input.dispatchTouchEvent", {"type": typ, "touchPoints": [] if y is None else [{"x": cx, "y": y}]})
            pg.wait_for_timeout(200)
            s = msgs(pg, "deck-swipe")
            check("swipe -> deck-swipe", len(s) >= 1 and s[-1]["dy"] > 50, json.dumps(s[-1:]))
            # space on the play button plays rather than flipping the slide
            nk = len(k)
            fr.focus("#pp")
            pg.keyboard.press(" ")
            pg.wait_for_timeout(300)
            check("Space on play button toggles play, not forwarded", fr.evaluate("__anim.playing()") and len(msgs(pg, "deck-key")) == nk, "")
            fr.click("#pp")
            # step rail jump while paused
            fr.click("#steps li:nth-child(3) button")
            pg.wait_for_timeout(150)
            t5 = fr.evaluate("__anim.time()")
            want = a["B"][2] + a["beats"][2]["still"]
            check("step rail jumps to step 3 and stays paused", abs(t5 - want) < .05 and not fr.evaluate("__anim.playing()"), f"t={t5:.2f} want {want:.2f}")
            cur_cap = fr.evaluate("[...document.querySelectorAll('#cap p')].findIndex(p=>p.classList.contains('on'))")
            check("caption follows the step", cur_cap == 2, f"caption {cur_cap + 1}")
            # caption legibility
            cs = fr.evaluate("""(()=>{const ps=[...document.querySelectorAll('#cap p')];const c=document.getElementById('cap');
              return {fs:Math.min(...ps.map(p=>parseFloat(getComputedStyle(p).fontSize))),over:c.scrollWidth>c.clientWidth+1,
              capH:c.getBoundingClientRect().height, maxP:Math.max(...ps.map(p=>p.getBoundingClientRect().height))}})()""")
            check("caption font >= 16 px, no overflow", cs["fs"] >= 16 and not cs["over"], json.dumps(cs))
            # height is stable across beats (no jumps)
            n0 = len(msgs(pg, "anim-height"))
            for i in range(len(a["B"])):
                fr.evaluate(f"__anim.seek({a['B'][i] + a['beats'][i]['still']})")
            pg.wait_for_timeout(300)
            check("height does not change between beats", len(msgs(pg, "anim-height")) == n0, f"{len(msgs(pg, 'anim-height')) - n0} extra height messages")
            # picture text size at this width (smallest on-screen font of visible text at each still)
            px = []
            for i in range(len(a["B"])):
                fr.evaluate(f"__anim.seek({a['B'][i] + a['beats'][i]['still']})")
                px.append(fr.evaluate("""(()=>{const s=document.getElementById('scene'),vb=s.viewBox.baseVal,k=s.clientWidth/vb.width;return +(13*k).toFixed(1)})()"""))
            results.setdefault(cur + "_picture_13u_px", px)
            print(f"  info picture: 13-unit text renders at {px} css px per beat")
            # stills
            if SHOOT:
                for i in range(len(a["B"])):
                    fr.evaluate(f"__anim.seek({a['B'][i] + a['beats'][i]['still']})")
                    pg.wait_for_timeout(120)
                    pg.locator("#f").screenshot(path=str(STILLS / f"{name}_{label}_beat{i + 1}.png"))
            # resize: height follows width both ways
            if iw == 1100:
                pg.evaluate("document.getElementById('f').style.width='360px'")
                pg.wait_for_timeout(500)
                hn = msgs(pg, "anim-height")[-1]["h"]
                pg.evaluate("document.getElementById('f').style.width='1100px'")
                pg.wait_for_timeout(500)
                hw = msgs(pg, "anim-height")[-1]["h"]
                check("height re-posted on resize, grows and shrinks", hn != hw and abs(hw - hs[-1]) <= 1, f"1100:{hs[-1]} -> 360:{hn} -> 1100:{hw}")
            check("no console errors", not errs, "; ".join(errs[:3]))
            ctx.close()

            # reduced motion
            cur = f"{name}@{iw}-reduced"
            print(f"== {cur}")
            ctx = br.new_context(viewport={"width": vw, "height": vh}, device_scale_factor=2, reduced_motion="reduce")
            pg, fr, errs = load(ctx, way, vw, iw)
            tell = a["tell"]
            t0 = fr.evaluate("__anim.time()")
            pg.evaluate("document.getElementById('f').contentWindow.postMessage({type:'anim-play'},'*')")
            pg.wait_for_timeout(1200)
            t1 = fr.evaluate("__anim.time()")
            want = a["B"][tell] + a["beats"][tell]["still"]
            check("reduced: never autoplays, ignores anim-play", t0 == t1 and abs(t0 - want) < .05, f"t={t0:.2f} want {want:.2f}")
            vis = fr.evaluate("[...document.querySelectorAll('#cap p')].filter(p=>getComputedStyle(p).visibility==='visible'&&p.getBoundingClientRect().height>0).length")
            check("reduced: all captions shown as a numbered list", vis == len(a["B"]), f"{vis}/{len(a['B'])}")
            fr.click("#steps li:nth-child(1) button")
            pg.wait_for_timeout(150)
            t2 = fr.evaluate("__anim.time()")
            check("reduced: step rail jumps between still frames", abs(t2 - (a["B"][0] + a["beats"][0]["still"])) < .05, f"t={t2:.2f}")
            fr.click(f"#steps li:nth-child({tell + 1}) button")
            pg.wait_for_timeout(150)
            if SHOOT:
                pg.locator("#f").screenshot(path=str(STILLS / f"{name}_{label}_reduced.png"))
            check("reduced: no console errors", not errs, "; ".join(errs[:3]))
            ctx.close()

        # timing checks (deterministic, once per way): text-reveal spacing + camera calm + last-frame hold
        cur = f"{name}-timing"
        print(f"== {cur}")
        ctx = br.new_context(viewport={"width": 1280, "height": 900})
        pg, fr, errs = load(ctx, way, 1280, 1100)
        a = fr.evaluate("window.__anim")
        bad = []
        for b in range(len(a["B"])):
            evs = sorted([r for r in a["REV"] if r["b"] == b], key=lambda r: r["t"])
            prev_last = 0.0  # the caption itself appears at the beat start
            for r in evs:
                if r["t"] + 1e-6 < prev_last + 2.5:
                    bad.append(f"beat {b + 1}: {r['s']} at +{r['t']} only {r['t'] - prev_last:.2f}s after previous words")
                prev_last = max(prev_last, r["last"])
            if evs:
                last = max(evs, key=lambda r: r["last"])
                need = max(2.5, last["w"] / 3 + 1)
                if a["beats"][b]["d"] - last["last"] + 1e-6 < need:
                    bad.append(f"beat {b + 1}: last words ({last['s']}, {last['w']} words) get {a['beats'][b]['d'] - last['last']:.2f}s, need {need:.2f}s")
        check("every reveal waits >= 2.5 s after the previous words; last words get time to be read", not bad, "; ".join(bad))
        # camera: sample the virtual camera every 50 ms through the loop
        samples = fr.evaluate("""(()=>{const out=[];const E=__anim.END;for(let t=0;t<=E+1e-6;t+=0.05){__anim.seek(t);const v=__anim.cam().split(' ').map(Number);out.push([+t.toFixed(2),v[0]+v[2]/2,v[1]+v[3]/2,v[2]])}return out})()""")
        fast, peak_pan, peak_zoom, segs = [], 0, 0, []
        for (ta, xa, ya, wa), (tb, xb, yb, wb) in zip(samples, samples[1:]):
            dt = tb - ta
            pan = math.hypot(xb - xa, yb - ya) / ((wa + wb) / 2) / dt
            zoom = abs(math.log(wb / wa)) / dt
            peak_pan, peak_zoom = max(peak_pan, pan), max(peak_zoom, zoom)
            if pan > 1.2 or zoom > 1.5:
                fast.append(ta)
        # group fast samples into moves
        for t in fast:
            if not segs or t - segs[-1][1] > .2:
                segs.append([t, t])
            else:
                segs[-1][1] = t
        moving = [s[0] for s, n in zip(samples, samples[1:]) if abs(s[3] - n[3]) > .01 or abs(s[1] - n[1]) > .01 or abs(s[2] - n[2]) > .01]
        last_move = max(moving) if moving else 0
        hold = a["END"] - (last_move + .05)
        check("at most one quick camera move (the verdict accent)", len(segs) <= 1, f"quick moves at {segs}; peak pan {peak_pan:.2f} widths/s, peak zoom {peak_zoom:.2f}/s")
        check("last frame holds >= 1 s before the loop fade", hold >= 1.0, f"camera still for {hold:.2f}s before {a['END']}s")
        results[cur + "_camera"] = {"quick_moves": segs, "peak_pan_widths_per_s": round(peak_pan, 2), "peak_zoom_per_s": round(peak_zoom, 2), "final_hold_s": round(hold, 2)}
        check("no console errors", not errs, "; ".join(errs[:3]))
        ctx.close()

        # standalone: opened on its own it autoplays
        cur = f"{name}-standalone"
        print(f"== {cur}")
        ctx = br.new_context(viewport={"width": 1280, "height": 900})
        pg = ctx.new_page()
        pg.goto(way.as_uri())
        pg.wait_for_function("window.__anim && document.fonts.status==='loaded'", timeout=20000)
        pg.wait_for_timeout(1500)
        check("standalone autoplays", pg.evaluate("__anim.playing() && __anim.time()>0.5"), f"t={pg.evaluate('__anim.time()'):.2f}")
        ctx.close()
    br.close()

(STILLS.parent / "test_report.json").write_text(json.dumps({"fails": fails, "results": results}, indent=1))
print("\nFAILS:" if fails else "\nall checks passed")
for f in fails:
    print(" -", f)
sys.exit(1 if fails else 0)
