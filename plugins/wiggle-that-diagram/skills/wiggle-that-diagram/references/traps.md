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
| huashu `render.py` logs one page error per film and exits 1 | "页面报错 1 条": under real Chrome (`channel='chrome'`, which style B patches in) it is a 404 for `/favicon.ico`, counted as a console error; the video is written first, so a `| tail` hides the failed exit code. Tested on the pizza example: not the scene-file probe (the loader skips the probe when `SCENE_LIBS` already registered the scene). | `touch engine/favicon.ico` in the engine copy; `render.py` then exits 0. |

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

## Learned on the pizza example (first film made from the published instructions)

| Trap | Fix |
|---|---|
| "Swap the `:root` tokens" did not re-theme the film: the page background, caption colour and the ink on gold were hard-coded, and `build.py` had no way to add CSS. | Fixed: all four are tokens now; pass a theme file with `build.py --css theme.css`. |
| `R(sel, beat, off)` and `camTo(i, beat, off)` take a 0-based beat; `data-b` in the SVG is 1-based. | Write `R("#x", 0, 3)` for beat 1. |
| `R()` on a wordless shape, or at offset 0, fails the spacing check: every `R()` is logged as words, and the caption counts as words at offset 0. | `R()` only for words, ≥ 2.5 s into the beat; shapes, movement and words that arrive with the caption use plain `tl` tweens at `T(beat, off)`. A label's background pill belongs inside the `R()` group, or it shows up empty first. |
| `pace_check.py` counts the `picture` field in beats.json; `build.py` counts the SVG's tagged words. They drifted silently. | Fixed: `build.py` warns when they differ. |
| A label visible from t = 0 is counted in the beat its `data-b` names, not when it is on screen. | Tag it with the beat in which the camera first shows it. |
| The timing test samples the camera only at 1100 px, so narrow (`t`) frames are never speed-checked; a whole-world pull-back in a 4:5 frame shrank picture text to ~3 px. | Give every frame a `t` rect; on narrow screens end on a closer frame (the pizza's `all.t` shows only the road and the house). Check the 390 px stills by eye. |
| No README picture tool. | `gif.py` seeks the film frame by frame in real Chrome and encodes a GIF (181 KB for 6.7 s at 960 px) or one PNG. |
| Style B ends with an eraser wipe, but the last beat's `still` (shared by every style) was 0.6 s before the end, so B's poster and reduced-motion frame landed mid-wipe. | Put the last beat's `still` before the wipe starts (the pizza wipes from 8.5 s into a 10 s beat; `still` is 8.4). |
| Style B: an object drawn as a time-positioned `K.custom` item stays on the board for the rest of the film; the pizza showed two boxes at the door. | Give every moving object an end time (`t1` / a visibility window), and hand over to the next object at the same instant. |
| Style A's recipe had the scene file carry its own copy of the captions. | `scripts/style-a/beats_js.py` writes `ways/<film>_beats.js` from beats.json; the scene reads that. |
| The three players expose different test hooks: C and A have `window.__anim` (C: `time()`, A: `state().t`), B has none (read `#v.currentTime`). | A host-page test that checks all three must read each one its own way (the pizza's switcher test does). |

## Learned on the expenses example (a richer six-beat film)

| Trap | Fix |
|---|---|
| Style B `test_contract.py` takes the film key from the html file's stem; a file already renamed to `<film>-whiteboard.html` fails with `KeyError`. | Test the file as `final/<film>.html`, then rename it. |
| Style B `K.write` aligns only left or centre, so a right-hand amount on a card ran into a long name ("Dinne$95"). | Leave about 130 board px for the right-hand text, or widen the card. |
| Style B: a board laid out in one long row (phone, cards, manager, report) made the closing pull-back tiny in the square frame (zoom 0.52). | Lay the board out for the square: put later panels under earlier ones (the manager under the amber reason, the report under the cards); the pull-back is then zoom 0.68. |
| Style A: HTML labels keep one size while the camera zooms, so a word inside a big card looks tiny in a close shot. | Put an inline `font-size` (1.3 to 1.5 em) in that label's `html`; then check the whole-picture frame, where enlarged labels can run into their neighbours, and leave long labels at 1 em. |
| Style C: a close frame cut a word in half at its top edge. | Look at every step's still at both widths; move the frame until each word is in or out. |

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
