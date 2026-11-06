# Traps found while building the worked example, each with its fix

Sources: the three style agents' `final/NOTES.md` files and the prototype run (see SKILL.md "Worked example").
Re-check machine-specific items (paths, installed tools) with `command -v` before trusting them.

## Browser and tools

| Trap | What happens | Fix |
|---|---|---|
| Playwright's bundled Chromium cannot play H.264 | Video embeds (A, B) show a blank or poster frame in tests; contract checks on playback fail or lie | Launch real Chrome: `p.chromium.launch(channel='chrome')`. Style B also patched the huashu engine's `render.py` the same way. Rendering frames to PNG (style A's `render_way.py`) needs no decoding, so plain Chromium is fine there. |
| Bundled Chromium may not be installed at all | `launch()` fails | Either `uv run --with playwright playwright install chromium` once, or use `channel='chrome'` everywhere. |
| `ffprobe` missing (ffmpeg present) | huashu `film_gate.py` / `deliver.py` crash | Put `scripts/common/ffprobe-shim` first on PATH: `PATH=<skill>/scripts/common/ffprobe-shim:$PATH uv run film_gate.py film.mp4`. It answers only the width/height/duration query. |
| ffmpeg not on PATH | Encoders fail | A common user-level install is `~/.local/bin/ffmpeg`; the scripts look in `$FFMPEG`, then PATH, then there. |
| Engine boot over sync XHR occasionally fails against the threaded local server | `render_way.py` hangs or reports `__bootFailed` | The script already retries 3 times; if it still fails, rerun. |
| huashu `render.py` logs one page error per film | "页面报错 1 条": a 404 for `scenes/<id>.js`, which the engine probes before reading `SCENE_LIBS` | Frames come out correct; believed harmless, not proven. The engine probes `${SCENE_DIR or 'scenes'}/<id>.js`; setting `window.SCENE_DIR` to the folder that holds the scene file (as style A did) should avoid it (suspected, untested). A second 404 for `favicon.ico` is not counted. |

## Content and timing

| Trap | What happens | Fix |
|---|---|---|
| Loop targets set apart from the captions | Brief asked for 28–34 s; captions alone needed 51.7 s; agents built 73.5–81.6 s and every one flagged the conflict | Derive loop length from `pace_check.py`. Shorten captions if too long. Confirm the resulting lengths with the user; in the worked example nobody had confirmed the ~2× loops yet. |
| Each agent counts "picture words" its own way | A's literal count failed 14 of 16 beats that its own count passed; lengths differ between styles | One rule, written in the brief, checked by `scripts/common/pace_check.py`. |
| A beat written as one long shot | huashu `storyboard_lint` goes red (shots over 8 s) | Write the shot list at the grain of picture events (style C: 27, 17 and 14 shots for 6, 5 and 5 beats). An English shot list with no template headings cannot be linted at all (style A). |
| Made-up specifics creep onto the picture | Rule ids, figures, stamps nobody gave you | Brief says what not to invent; label example figures "example numbers"; list every invented picture item in NOTES for a person to confirm. |
| Paused start on t = 0 | Style A's first paused frame was an empty folder plus two labels | Start paused on beat 1's finished frame (B and C did). |

## Style A (text-free video + HTML label track)

| Trap | Fix |
|---|---|
| **Labels drift.** HTML labels are placed from a camera track dumped at render time; any edit to scene geometry, camera or timing without re-rendering leaves labels floating off their objects. | Re-run `render_way.py` (or `make.sh`) after every scene edit, then `midmove.py` at mid-move times and look. |
| 1280×720 did not fit the 900 KB budget once base64-inlined (923 KB video, ~1.31 MB inlined) | Render 960×540 (`--scale 0.75`), x264 CRF 30, `-tune animation`, no scene-cut keyframes. Line art is slightly soft at 1100 px; labels stay sharp because they are HTML. |
| Long label text unreadable on phones | Mark key labels `cls:'key'` with a `short` version; the rest move into the caption box as coloured bullet lines on cue. |
| Poster flashing behind t = 0 labels while the video loads | Show the poster only in reduced motion or when the video fails. |

## Style B (whiteboard, square video)

| Trap | Fix |
|---|---|
| Size headroom is thin (way1 885.6 KB at CRF 34) | `build_html.py` searches CRF upward until the HTML fits 880 KiB; check hand lettering at the chosen CRF; 2× DPR sharpness was never checked. |
| Swipe forwarding under-reports in a scrolling parent page | The deck page must be `overflow:hidden` (see embed-contract.md). |
| The 2.5 s gap between text groups was set by design, not measured | Fill `reveals` in beats.json so `pace_check.py` checks it, or look at contact sheets. |

## Style C (live SVG + GSAP + virtual camera)

| Trap | Fix |
|---|---|
| Zoom kinks and spikes mid-move | Fit each camera frame to the current aspect BEFORE interpolating, and interpolate width in log space (`head.js` does this). |
| Quick moves you did not intend | GSAP `power2` is cubic and peaks too fast; use `sine.inOut` and longer durations. `test_contract.py` flags pan > 1.2 widths/s or zoom > 1.5/s; `camdbg.py` prints the speed. |
| Thumbnails drawn in the wrong place | GSAP's transform overwrote the element's own SVG `translate`; wrap the element in a parent `<g>` and animate the child. |
| Words with no beat tag escape the pacing count | `build.py` fails on any `<text>` without `data-b` (it caught reasons tagged to the wrong beat). |
| The 2.5 s spacing check only sees reveals logged through `R()` | Movement of things already on screen (pointer, token) is not counted; look at the live playback frames. |

## huashu gates that disagree with explainers paced for reading

- `film_gate.py` turns RED when fast-motion frames are under 3.5 % of the film. Long still holds for reading do exactly that
  (style A: 0.034 and 0.007). For these embeds the deliverable is the HTML file, not `deliver.py`'s copied mp4,
  so record the red in NOTES and do not add motion just to turn it green. Yellow "few events per 10 s" and "long
  stretch without fast action" are the reading holds; leave them.
- The blue-purple gate stayed green (0.000) on a dark navy deck; no override was needed.
- huashu asks for an independent reviewer who watches the finished film at normal speed. None of the three builds
  had one. Do it (see SKILL.md, step 7).

## Learned in the review rounds (worked example)
| Trap | Fix |
|---|---|
| The brief put an invented example label and an invented rule on client-facing pictures; all three styles copied them faithfully. | Every example value in the brief needs a source (file, screenshot, deck line). Re-read the host page's own rules before writing verdict reasons: if the page says a check needs a person to confirm it, a green verdict must say so too. |
| Two films said the same thing in different words (Way 1 green reason vs Way 2's quoted answer) after a wording fix touched only one. | When you change a fact's wording, grep every film and every style (picture text, phone bullets, alt text, SVG `<desc>`) for the old phrase; for drawn-in-video styles also look at frames. |
| An independent checker died on a usage limit and its style shipped on its own builder's gates only. | Say so in the hand-over; rerun the checker next session. |
