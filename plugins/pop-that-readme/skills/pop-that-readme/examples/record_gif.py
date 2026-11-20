#!/usr/bin/env python3
"""record_gif.py - record an animated web page (a slide deck, a demo page) as a README GIF.

What it is for
    A README sells a project in the first screen. A short looping GIF of the thing
    actually moving does more than any paragraph. This script opens a page in headless
    Chromium, plays a little key/click script with real waits (so the page's own CSS
    and JS animations run at real speed), grabs frames on a timer, and encodes a small,
    sharp, forever-looping GIF with ffmpeg's two-pass palette method.

How to run it
    uv run --with playwright python record_gif.py PAGE OUT.gif [options]

    PAGE is a local .html file or a URL. First run only, if Playwright says
    "Executable doesn't exist":
        uv run --with playwright playwright install chromium
    ffmpeg must be on PATH.

    Example - walk a deck: a 2 s hold, then 14 right-arrow presses 1.9 s apart:
        uv run --with playwright python record_gif.py deck.html deck.gif \\
            --size 1280x720 --fps 12 --width 720 --lead 2 \\
            --keys "ArrowRight*14:1.9" --tail 1.5 --max-mb 3.3 --poster deck.png

Key script (--keys), comma separated, each step "ACTION:SECONDS-TO-WAIT-AFTER":
    ArrowRight:2.2          press a key (any Playwright key name: Space, Enter, ArrowDown...)
    ArrowRight*14:1.9       the same step 14 times
    click=#start:1.5        glide the cursor to the first element matching a CSS selector, then click it
    move=#card:1.2          glide to it and hover, no click (shows hover effects)
    wait:3                  just wait
    A glide takes 0.5 to 0.8 s depending on distance, and that time is part of the step's
    wait, so the next step still fires on the same timetable.

Cursor
    Headless Chromium draws no mouse pointer, so a button would react to an invisible hand.
    With --cursor auto (the default) the script draws one whenever the key script has a click
    or move step: a small arrow that glides to each target along a slightly wobbly arc and
    puts a two-ring ripple where it clicks. The real mouse makes the same moves in small
    steps, so hover effects and mouse-following effects (a sparkle trail) show too. The path
    comes from a seeded generator, so the same command draws the same path every run.
    If the page hides the pointer itself (computed cursor: none on html, body or the
    target, as sparkle-that-page's fairy cursor does), the arrow is not drawn, since the page
    draws its own; the real mouse still moves. --cursor off keeps the old behaviour: no
    glide, a plain click. --cursor on always draws the arrow. Run --self-test for the offline
    check of the path maths.

Size budget
    Every visitor downloads every GIF that autoplays, so keep each GIF at or under
    4 MB (the default --max-mb) and the GIFs on one page under about 10 MB in total.
    Three GIFs of about 3 MB is the most a gallery should carry; with more, autoplay
    one and show the rest as their --poster PNG, each linking to its GIF. MB here is
    1,000,000 bytes, as macOS Finder counts them. If the result is over --max-mb
    the script re-encodes from the frames it already captured (no second browser
    run): first at a lower fps, then with 128 colours, then at a smaller width, and it
    tells you which it settled on.

Output: the GIF, a line with frames / duration / size / width / fps, and with
--poster a still PNG of the first settled frame (fonts loaded, intro animation done)
at the same width, for a <picture> fallback or a social preview.
"""
from __future__ import annotations

import argparse
import asyncio
import math
import pathlib
import random
import shutil
import subprocess
import sys
import tempfile
import time
import zlib

MB = 1_000_000  # decimal megabytes, as macOS Finder reports file sizes


def parse_keys(spec: str) -> list[tuple[str, str, float]]:
    """'ArrowRight*3:2,click=#a:1,wait:2' -> [('key','ArrowRight',2.0), ...]"""
    steps: list[tuple[str, str, float]] = []
    for part in [p.strip() for p in spec.split(",") if p.strip()]:
        action, _, secs = part.rpartition(":")
        if not action:
            action, secs = part, "2"
        wait = float(secs)
        times = 1
        if "*" in action and not action.startswith(("click=", "move=")):
            action, n = action.rsplit("*", 1)
            times = int(n)
        for _ in range(times):
            if action == "wait":
                steps.append(("wait", "", wait))
            elif action.startswith("click="):
                steps.append(("click", action[len("click="):], wait))
            elif action.startswith("move="):
                steps.append(("move", action[len("move="):], wait))
            else:
                steps.append(("key", action, wait))
    return steps


def to_url(page: str) -> str:
    if "://" in page:
        return page
    p = pathlib.Path(page).expanduser().resolve()
    if not p.exists():
        sys.exit(f"no such file: {p}")
    return p.as_uri()


# ---- the drawn cursor ---------------------------------------------------------------------

def glide_seconds(dist: float, diag: float) -> float:
    """0.5 s for a short hop up to 0.8 s across most of the screen."""
    return 0.5 + 0.3 * min(1.0, dist / (0.75 * diag))


def cursor_path(start, end, vw, vh, seed, steps):
    """Points from start to end along a slightly bent arc with a small hand wobble.

    Returns steps + 1 (x, y) points: the first is exactly `start`, the last exactly `end`.
    The pace eases in and out, the wobble fades to nothing by the last point so the cursor
    settles dead on the target, and every point stays inside the viewport. The same inputs
    always give the same points: the only randomness is random.Random(seed).
    """
    rng = random.Random(seed)
    (sx, sy), (ex, ey) = start, end
    dx, dy = ex - sx, ey - sy
    dist = math.hypot(dx, dy)
    nx, ny = (-dy / dist, dx / dist) if dist else (0.0, 0.0)
    bend = dist * rng.uniform(0.10, 0.20) * rng.choice((-1, 1))   # how far the arc bows out
    cx, cy = (sx + ex) / 2 + nx * 2 * bend, (sy + ey) / 2 + ny * 2 * bend  # quadratic control point
    amp = min(4.0, 1.0 + dist * 0.01)                              # wobble size in px
    ph1, ph2 = rng.uniform(0, math.tau), rng.uniform(0, math.tau)
    pts = [(float(sx), float(sy))]
    for i in range(1, steps):
        u = i / steps
        e = u * u * (3 - 2 * u)                                    # smoothstep: ease in and out
        x = (1 - e) ** 2 * sx + 2 * (1 - e) * e * cx + e * e * ex
        y = (1 - e) ** 2 * sy + 2 * (1 - e) * e * cy + e * e * ey
        fade = (1 - u) ** 2
        x += nx * amp * fade * math.sin(math.tau * 2.3 * u + ph1) + amp * 0.5 * fade * math.sin(math.tau * 3.1 * u + ph2)
        y += ny * amp * fade * math.sin(math.tau * 2.3 * u + ph1) + amp * 0.5 * fade * math.cos(math.tau * 3.1 * u + ph2)
        pts.append((min(max(x, 0.0), vw - 1.0), min(max(y, 0.0), vh - 1.0)))
    pts.append((float(ex), float(ey)))
    return pts


# An arrow drawn by hand (slightly uneven edges, dark fill, white outline so it reads on light
# and dark pages) that follows the real mouse, and a two-ring ripple on mousedown. It sits on
# top of the page and ignores the mouse. Hidden until show() so it does not sit in the corner.
CURSOR_JS = r"""
(() => {
  if (window.__rgCursor) return;
  let x = -100, y = -100, on = false, root, arrow;
  const make = () => {
    root = document.createElement('div');
    root.setAttribute('aria-hidden', 'true');
    root.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none;display:none';
    root.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" style="position:absolute;left:-3px;top:-2px;overflow:visible;filter:drop-shadow(0 1.5px 2px rgba(0,0,0,.35));transform-origin:3px 2px">' +
      '<path d="M3.1 2.2 Q2.8 11 3 19.6 Q3.2 20.3 3.9 19.7 L7.4 16.1 L10.1 21.9 Q10.4 22.5 11.1 22.2 L12.9 21.3 Q13.5 21 13.2 20.4 L10.6 14.9 L15.9 14.7 Q16.9 14.6 16.2 13.8 L3.9 2 Q3.2 1.5 3.1 2.2 Z" ' +
      'fill="#1d1b2e" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/></svg>';
    arrow = root.firstChild;
    document.documentElement.appendChild(root);
  };
  const place = () => { if (root) root.style.transform = 'translate(' + x + 'px,' + y + 'px)'; };
  addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; place(); }, true);
  addEventListener('mousedown', () => {
    if (!on) return;
    arrow.animate([{transform: 'scale(1)'}, {transform: 'scale(.86)'}], {duration: 90, fill: 'forwards'});
    for (const [delay, size] of [[0, 64], [120, 96]]) {
      const r = document.createElement('div');
      r.style.cssText = 'position:absolute;left:' + -size / 2 + 'px;top:' + -size / 2 + 'px;width:' + size + 'px;height:' + size +
        'px;box-sizing:border-box;border-radius:50%;border:3.5px solid #fff;background:rgba(255,95,162,.22);box-shadow:0 0 0 2px rgba(29,27,46,.7),inset 0 0 0 2px rgba(29,27,46,.7);opacity:0';
      root.appendChild(r);
      r.animate([{transform: 'scale(.2)', opacity: 1}, {transform: 'scale(1)', opacity: 0}],
                {duration: 650, delay, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both'}).onfinish = () => r.remove();
    }
  }, true);
  addEventListener('mouseup', () => { if (on) arrow.animate([{transform: 'scale(.86)'}, {transform: 'scale(1)'}], {duration: 120, fill: 'forwards'}); }, true);
  window.__rgCursor = {
    show() { on = true; if (!root) make(); root.style.display = 'block'; place(); },
    hide() { on = false; if (root) root.style.display = 'none'; },
  };
})();
"""


def self_test() -> int:
    """Offline check of the path maths: no browser, no ffmpeg. Exit 0 = pass."""
    bad: list[str] = []

    def expect(ok, what):
        if not ok:
            bad.append(what)

    vw, vh = 1280, 720
    cases = [((1278, 718), (640, 360)), ((0, 0), (1279, 719)), ((5, 700), (1275, 10)),
             ((100, 100), (110, 104)), ((640, 360), (640, 360)), ((0, 719), (0, 0))]
    for start, end in cases:
        pts = cursor_path(start, end, vw, vh, 7, 40)
        expect(pts[0] == (float(start[0]), float(start[1])), f"{start}->{end}: does not start at the start point")
        expect(pts[-1] == (float(end[0]), float(end[1])), f"{start}->{end}: does not end exactly on the target")
        expect(all(0 <= x <= vw - 1 and 0 <= y <= vh - 1 for x, y in pts), f"{start}->{end}: leaves the viewport")
        expect(len(pts) == 41, f"{start}->{end}: expected 41 points, got {len(pts)}")
        expect(pts == cursor_path(start, end, vw, vh, 7, 40), f"{start}->{end}: same seed gave a different path")
    a, b = (30, 60), (1200, 640)
    expect(cursor_path(a, b, vw, vh, 1, 40) != cursor_path(a, b, vw, vh, 2, 40), "different seeds gave the same path")
    # an arc, not a ruler line: some point sits clearly off the straight line from a to b
    length = math.hypot(b[0] - a[0], b[1] - a[1])
    off = max(abs((b[0] - a[0]) * (a[1] - y) - (a[0] - x) * (b[1] - a[1])) / length
              for x, y in cursor_path(a, b, vw, vh, 1, 40))
    expect(off > 20, f"path is a straight line (furthest point {off:.1f} px off)")
    # it settles: the last 3 points are within 3 px of the target
    tail = cursor_path(a, b, vw, vh, 1, 40)[-4:-1]
    expect(all(math.hypot(x - b[0], y - b[1]) < 40 for x, y in tail), "path does not settle on the target")
    diag = math.hypot(vw, vh)
    expect(abs(glide_seconds(1, diag) - 0.5) < 0.01 and abs(glide_seconds(diag, diag) - 0.8) < 1e-9, "glide time is not 0.5-0.8 s")
    expect(parse_keys("move=#a:1,click=.b:2,ArrowRight*2:1") ==
           [("move", "#a", 1.0), ("click", ".b", 2.0), ("key", "ArrowRight", 1.0), ("key", "ArrowRight", 1.0)],
           "parse_keys does not read move= and click=")
    for line in bad:
        print("FAIL", line)
    print("self-test:", "FAILED" if bad else f"ok ({len(cases)} paths, determinism, bounds, arc, settle, glide time, parse_keys)")
    return 1 if bad else 0


async def capture(url, w, h, fps, lead, steps, tail, frames_dir, poster_raw, cursor=False):
    from playwright.async_api import async_playwright

    shots: list[tuple[float, pathlib.Path]] = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        ctx = await browser.new_context(viewport={"width": w, "height": h},
                                        device_scale_factor=1, reduced_motion="no-preference")
        if cursor:
            await ctx.add_init_script(CURSOR_JS)
        page = await ctx.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.goto(url, wait_until="networkidle")
        await page.evaluate("document.fonts.ready.then(() => true)")
        pos = (w - 2.0, h - 2.0)
        await page.mouse.move(*pos)  # park the pointer away from hover effects

        stop = asyncio.Event()

        async def grabber():
            t0 = time.monotonic()
            k = 0
            while not stop.is_set():
                target = t0 + k / fps
                delay = target - time.monotonic()
                if delay > 0:
                    await asyncio.sleep(delay)
                ts = time.monotonic() - t0
                path = frames_dir / f"raw{len(shots):05d}.jpg"
                await page.screenshot(path=str(path), type="jpeg", quality=92)
                shots.append((ts, path))
                k = max(k + 1, int((time.monotonic() - t0) * fps))  # skip ticks we missed

        task = asyncio.create_task(grabber())
        # Steps run on an absolute timetable, so a slow press or click (a busy machine)
        # does not stretch the recording: each step fires at lead + the waits before it.
        start = time.monotonic()

        async def until(t):
            delay = start + t - time.monotonic()
            if delay > 0:
                await asyncio.sleep(delay)

        await until(lead)
        if poster_raw:
            await page.screenshot(path=str(poster_raw))

        async def glide_to(sel, idx, wait, at):
            """Move the real mouse to the middle of `sel` along the arc. Returns the end point."""
            nonlocal pos
            loc = page.locator(sel).first
            await loc.scroll_into_view_if_needed()
            box = await loc.bounding_box()
            if not box:
                sys.exit(f"step {idx + 1}: {sel!r} has no visible box to move to")
            rng = random.Random(zlib.crc32(f"{idx}:{sel}".encode()))
            end = (min(max(box["x"] + box["width"] * (0.5 + rng.uniform(-0.12, 0.12)), 0), w - 1.0),
                   min(max(box["y"] + box["height"] * (0.5 + rng.uniform(-0.12, 0.12)), 0), h - 1.0))
            own = await page.evaluate("""(sel) => { const none = e => e && getComputedStyle(e).cursor === 'none';
                return none(document.documentElement) || none(document.body) || none(document.querySelector(sel)); }""", sel)
            await page.evaluate("(own) => window.__rgCursor && (own ? window.__rgCursor.hide() : window.__rgCursor.show())", own)
            dist = math.hypot(end[0] - pos[0], end[1] - pos[1])
            secs = min(glide_seconds(dist, math.hypot(w, h)), wait * 0.8)  # the glide is part of the wait
            n = max(8, round(secs * 60))
            pts = cursor_path(pos, end, w, h, zlib.crc32(f"{idx}:{sel}".encode()), n)
            for i, (x, y) in enumerate(pts[1:], 1):
                await until(at + secs * i / n)
                await page.mouse.move(x, y)
            pos = end
            return end

        at = lead
        for idx, (kind, arg, wait) in enumerate(steps):
            await until(at)
            if kind == "key":
                await page.keyboard.press(arg)
            elif kind in ("click", "move") and not cursor:
                await (page.click(arg) if kind == "click" else page.hover(arg))
            elif kind in ("click", "move"):
                x, y = await glide_to(arg, idx, wait, at)
                if kind == "click":
                    await page.mouse.click(x, y, delay=70)
            at += wait
        await until(at + tail)
        stop.set()
        await task
        await browser.close()
    if errors:
        print("page errors:", *errors, sep="\n  ", file=sys.stderr)
    return shots


def resample(shots, fps, out_dir: pathlib.Path) -> int:
    """Pick, for each output tick, the captured frame nearest in time. Returns frame count."""
    for f in out_dir.glob("f*.jpg"):
        f.unlink()
    duration = shots[-1][0]
    n = int(duration * fps) + 1
    j = 0
    for i in range(n):
        t = i / fps
        while j + 1 < len(shots) and abs(shots[j + 1][0] - t) <= abs(shots[j][0] - t):
            j += 1
        (out_dir / f"f{i:05d}.jpg").symlink_to(shots[j][1])
    return n


def encode(seq_dir, fps, width, colors, out: pathlib.Path):
    graph = (f"scale={width}:-2:flags=lanczos,split[a][b];"
             f"[a]palettegen=max_colors={colors}:stats_mode=diff[p];"
             f"[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(fps),
                    "-i", str(seq_dir / "f%05d.jpg"), "-filter_complex", graph,
                    "-loop", "0", str(out)], check=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0],
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("page", nargs="?", help="local .html file or URL")
    ap.add_argument("out", nargs="?", help="output .gif")
    ap.add_argument("--size", default="1280x720", help="browser viewport WxH (default 1280x720)")
    ap.add_argument("--fps", type=int, default=12, help="frames per second (default 12)")
    ap.add_argument("--keys", default="", help='key script, e.g. "ArrowRight*5:2.2,wait:1"')
    ap.add_argument("--lead", type=float, default=2.0, help="seconds to film before the first step (default 2)")
    ap.add_argument("--tail", type=float, default=1.0, help="seconds to film after the last step (default 1)")
    ap.add_argument("--width", type=int, default=720, help="GIF width in px (default 720)")
    ap.add_argument("--max-mb", type=float, default=4.0, help="size ceiling in MB, 1 MB = 1,000,000 bytes (default 4)")
    ap.add_argument("--poster", help="also write the first settled frame as a PNG")
    ap.add_argument("--cursor", choices=("auto", "on", "off"), default="auto",
                    help="drawn pointer that glides to click=/move= targets: auto = when the key script has "
                         "a click or move step (default); off = no glide, plain click")
    ap.add_argument("--self-test", action="store_true", help="check the cursor path maths offline and exit")
    a = ap.parse_args()

    if a.self_test:
        sys.exit(self_test())
    if not a.page or not a.out:
        ap.error("PAGE and OUT.gif are required")
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg not found on PATH")
    w, h = (int(x) for x in a.size.lower().split("x"))
    steps = parse_keys(a.keys)
    pointing = any(k in ("click", "move") for k, _, _ in steps)
    cursor = a.cursor == "on" or (a.cursor == "auto" and pointing)
    out = pathlib.Path(a.out).expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="record_gif_") as tmp:
        tmp = pathlib.Path(tmp)
        poster_raw = tmp / "poster.png" if a.poster else None
        shots = asyncio.run(capture(to_url(a.page), w, h, a.fps, a.lead, steps, a.tail, tmp, poster_raw, cursor))
        span = shots[-1][0] - shots[0][0]
        got = (len(shots) - 1) / span if span else 0
        print(f"captured {len(shots)} frames in {span:.1f} s ({got:.1f}/s achieved, {a.fps}/s asked)")
        if got < a.fps * 0.8:
            print("  warning: the browser could not keep up; motion may look choppy. Try a smaller --size.")

        # Try the asked settings first, then step down until it fits.
        tries = [(a.fps, a.width, 256)]
        for f in (10, 8):
            if f < a.fps:
                tries.append((f, a.width, 256))
        low_fps = min(a.fps, 8)
        tries.append((low_fps, a.width, 128))  # fewer colours costs less legibility than fewer pixels
        for wd in range(a.width - 80, 479, -80):
            tries.append((low_fps, wd, 128))

        limit = a.max_mb * MB
        for n, (fps, width, colors) in enumerate(tries):
            frames = resample(shots, fps, tmp)
            encode(tmp, fps, width, colors, out)
            size = out.stat().st_size
            if size <= limit or n == len(tries) - 1:
                break
            print(f"  {size / MB:.2f} MB at {fps} fps, {width} px is over {a.max_mb} MB - retrying smaller")
        if (fps, width, colors) != tries[0]:
            print(f"  settled on {fps} fps, {width} px, {colors} colours (asked {a.fps} fps, {a.width} px)")
        if size > limit:
            print(f"  warning: still {size / MB:.2f} MB, over {a.max_mb} MB. Shorten the key script.")

        if a.poster:
            poster = pathlib.Path(a.poster).expanduser().resolve()
            poster.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(poster_raw),
                            "-vf", f"scale={width}:-2:flags=lanczos", str(poster)], check=True)
            print(f"poster: {poster}")

    print(f"{out}: {frames} frames, {frames / fps:.1f} s, {size / MB:.2f} MB, "
          f"{width} px wide, {fps} fps, loops forever")


if __name__ == "__main__":
    main()
