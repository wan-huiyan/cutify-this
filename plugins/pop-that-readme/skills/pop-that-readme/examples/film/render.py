"""Render a kit.js film (an HTML page whose every frame is a pure function of t) to stills, an MP4 and a README GIF.

  python3 render.py film.html --check                         # run every frame in node first; catches script errors
  uv run --with playwright python render.py film.html --stills 5.5,16,23 --out stills/
  uv run --with playwright python render.py film.html --video demo.mp4 --gif demo.gif [--max-mb 4] [--workers 6]

The page must load kit.js and call setupFilm/shot (kit.js exposes render(t) and DUR). Needs ffmpeg on PATH.
Why --check: a script error (e.g. a const that clashes with a kit name such as CAP) leaves the page blank and the
browser only reports "Cannot read properties of undefined"; node names the line.
"""
import argparse, asyncio, pathlib, re, shutil, subprocess, sys, tempfile

FPS = 30


def check(film):
    src = film.read_text()
    kit = (film.parent / "kit.js").read_text()
    body = re.findall(r"<script>(.*?)</script>", src, re.S)[-1].replace("renderFrame(0);", "")
    js = kit + body + "\nfor(let t=0;t<DUR;t+=0.1)renderFrame(t);console.log('ok: every frame renders, '+DUR+' s')"
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f:
        f.write(js)
    r = subprocess.run(["node", f.name], capture_output=True, text=True)
    print(r.stdout.strip() or r.stderr.strip().splitlines()[:6])
    return r.returncode == 0


def gif(mp4, out, max_mb):
    for fps, width in [(8, 800), (6, 800), (6, 720), (5, 640), (5, 560)]:
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(mp4), "-vf",
                        f"fps={fps},scale={width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];"
                        "[b][p]paletteuse=dither=bayer:bayer_scale=4", str(out)], check=True)
        mb = out.stat().st_size / 1e6
        if mb <= max_mb:
            print(f"gif -> {out} {mb:.1f} MB ({fps} fps, {width} px)")
            return
    print(f"gif -> {out} {mb:.1f} MB: still over {max_mb} MB; shorten the film or link the MP4 instead")


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("film", nargs="?", default="film.html")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--stills")
    ap.add_argument("--out", default="stills")
    ap.add_argument("--video")
    ap.add_argument("--gif")
    ap.add_argument("--max-mb", type=float, default=4.0)
    ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()
    film = pathlib.Path(a.film).resolve()
    here = film.parent
    if a.check:
        sys.exit(0 if check(film) else 1)
    from playwright.async_api import async_playwright

    async def open_page(browser):
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        await page.goto(film.as_uri())
        await page.evaluate("document.fonts.ready")
        return page

    async def shoot(page, t, path):
        await page.evaluate(f"render({t})")
        await page.screenshot(path=str(path), type="png")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        if a.stills:
            out = here / a.out
            out.mkdir(parents=True, exist_ok=True)
            page = await open_page(browser)
            for t in [float(x) for x in a.stills.split(",")]:
                await shoot(page, t, out / f"t{t:05.1f}.png")
            print("stills ->", out)
        if a.video:
            frames = here / "frames"
            shutil.rmtree(frames, ignore_errors=True)
            frames.mkdir()
            page0 = await open_page(browser)
            n = int(round(await page0.evaluate("DUR") * FPS))
            pages = [page0] + [await open_page(browser) for _ in range(a.workers - 1)]

            async def worker(k, page):
                for i in range(k, n, a.workers):
                    await shoot(page, i / FPS, frames / f"{i:05d}.png")

            await asyncio.gather(*(worker(k, pg) for k, pg in enumerate(pages)))
            mp4 = here / a.video
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(frames / "%05d.png"),
                            "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(mp4)],
                           check=True)
            shutil.rmtree(frames)
            print("video ->", mp4, n, "frames")
            if a.gif:
                gif(mp4, here / a.gif, a.max_mb)
        await browser.close()


asyncio.run(main())
