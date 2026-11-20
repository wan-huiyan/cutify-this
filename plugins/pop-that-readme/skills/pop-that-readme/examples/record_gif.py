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
    click=#start:1.5        click the first element matching a CSS selector
    wait:3                  just wait

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
import pathlib
import shutil
import subprocess
import sys
import tempfile
import time

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
        if "*" in action and not action.startswith("click="):
            action, n = action.rsplit("*", 1)
            times = int(n)
        for _ in range(times):
            if action == "wait":
                steps.append(("wait", "", wait))
            elif action.startswith("click="):
                steps.append(("click", action[len("click="):], wait))
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


async def capture(url, w, h, fps, lead, steps, tail, frames_dir, poster_raw):
    from playwright.async_api import async_playwright

    shots: list[tuple[float, pathlib.Path]] = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        ctx = await browser.new_context(viewport={"width": w, "height": h},
                                        device_scale_factor=1, reduced_motion="no-preference")
        page = await ctx.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.goto(url, wait_until="networkidle")
        await page.evaluate("document.fonts.ready.then(() => true)")
        await page.mouse.move(w - 2, h - 2)  # park the pointer away from hover effects

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
        at = lead
        for kind, arg, wait in steps:
            await until(at)
            if kind == "key":
                await page.keyboard.press(arg)
            elif kind == "click":
                await page.click(arg)
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
    ap.add_argument("page", help="local .html file or URL")
    ap.add_argument("out", help="output .gif")
    ap.add_argument("--size", default="1280x720", help="browser viewport WxH (default 1280x720)")
    ap.add_argument("--fps", type=int, default=12, help="frames per second (default 12)")
    ap.add_argument("--keys", default="", help='key script, e.g. "ArrowRight*5:2.2,wait:1"')
    ap.add_argument("--lead", type=float, default=2.0, help="seconds to film before the first step (default 2)")
    ap.add_argument("--tail", type=float, default=1.0, help="seconds to film after the last step (default 1)")
    ap.add_argument("--width", type=int, default=720, help="GIF width in px (default 720)")
    ap.add_argument("--max-mb", type=float, default=4.0, help="size ceiling in MB, 1 MB = 1,000,000 bytes (default 4)")
    ap.add_argument("--poster", help="also write the first settled frame as a PNG")
    a = ap.parse_args()

    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg not found on PATH")
    w, h = (int(x) for x in a.size.lower().split("x"))
    steps = parse_keys(a.keys)
    out = pathlib.Path(a.out).expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="record_gif_") as tmp:
        tmp = pathlib.Path(tmp)
        poster_raw = tmp / "poster.png" if a.poster else None
        shots = asyncio.run(capture(to_url(a.page), w, h, a.fps, a.lead, steps, a.tail, tmp, poster_raw))
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
