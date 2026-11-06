---
name: wiggle-that-diagram
description: "Use when someone asks to animate an illustration in an HTML slide deck or HTML report, show how a mechanism, workflow or data flow works step by step, make an explainer animation for a slide, slow an animation down because it is too fast to read, add captions to one, or offer three animation styles to pick from. Builds one captioned, looping, self-contained file per mechanism that drops into an iframe srcdoc (step rail, reduced motion, deck-safe input forwarding), in three formats: A diagram clip (huashu engine, text-free video + HTML labels), B whiteboard (huashu y3), C live SVG + GSAP with a virtual camera."
metadata:
  author: "Huiyan Wan, built with Claude (Anthropic)"
  license: "MIT"
  version: "1.0.0"
  created: "2026-11-05"
  base_skill: "huashu-art-motion 1.2.0"
---

# wiggle-that-diagram: explainer motion in three styles

Turn one static "how it works" illustration into a short, captioned, looping animation that sits inside an
HTML deck or report, and offer it in three formats so the reader can pick. The method was worked out on a
real client deck (see "Worked example"). It uses `huashu-art-motion` for direction (shot lists,
camera rules, the six ways to fail) and, for styles A and B, as the rendering engine.

## When to use it, and when not

Use it when:
- a deck or HTML report has a mechanism diagram (files flow, rules check, a person approves) and the reader
  should *see it happen*, step by step, with words they can read;
- the user wants options in genuinely different formats, not three colour schemes of one;
- an earlier animation was "too fast to read" or needs captions.

Do not use it for: a single micro-interaction (use `animate`), a narrated video with voice-over (use
`huashu-art-motion` directly), or a chart of numbers (use `dataviz`).

## The three styles (they differ in format, not palette)

| | A · diagram clip | B · whiteboard | C · live SVG |
|---|---|---|---|
| Picture | huashu engine canvas scene, t1_3b1b grammar, rendered to a text-free H.264 | huashu y3_whiteboard grammar, dark board, pen draws and hand-letters (Kalam), square video | Inline SVG world filmed by a virtual camera (viewBox tweened by GSAP 3.12.5) |
| Words on the picture | HTML labels placed over the video from a dumped camera track (always sharp) | Drawn into the video (must be big enough for a phone) | Real SVG text (sharp, reflows by changing camera frames per width) |
| Size per film (worked example) | 360–820 KB (budget 900 KB) | 847–886 KB (budget 900 KB) | 21–34 KB (budget 40 KB) |
| Feels like | a clean 3Blue1Brown-style diagram | someone explaining at a whiteboard | a polished product animation |
| Main risk | labels drift if the scene changes without re-rendering | tight size budget; phone labels 12–14 px | fiddly camera maths; GSAP transform quirks |

All three share ONE caption script, the same beats and the same embed contract, so a style switcher shows the
same story told three ways.

## The method, end to end

Each step ends with the check that proves it is done.

1. **Find the mechanism and one concrete example.** Read the host page (read only). Pick the moment to show
   and ONE real example threaded through every beat (one row, one record, one case, with its real values).
   List what must not be invented (ids, figures, imagery). → Check: you can say each beat as "this object does
   this", with a noun and a verb.

2. **Write the caption script first.** One caption sentence per beat, 3–6 beats per film, in
   `beats.json` (format: `scripts/common/beats.example.json`). Captions are identical in every style. Then run
   the pacing gate and read the floor it prints:
   ```sh
   python3 ~/.claude/skills/wiggle-that-diagram/scripts/common/pace_check.py beats.json
   ```
   → Check: every beat OK, and the user has agreed the resulting loop lengths (or shorter captions). Never set a
   loop target separately from the captions; see "Pacing".

3. **Write the brief.** Fill `references/brief-template.md` into `SPEC.md`: feedback quoted, tokens, pacing rule,
   caption script, beats, embed contract with the verbatim snippet, budgets, deliverables. → Check: an agent with
   no other context could build from it.

4. **Directions round (optional, when the user has not seen the styles).** Three agents in parallel, one per
   style, each prototyping the SAME moment of one film (~8–12 s) and shooting stills at 1280 and 390 px. Show
   the stills side by side; the user picks one or keeps all three. → Check: the user's choice is in writing.

5. **Build round.** One agent per style (each continuing its own prototype), all films in that style, writing
   only under `<work>/<style>/final/`. Briefs: `references/agent-briefs.md`. Say the agent count and tier to the
   user before launching. → Check: each returns files, stills, NOTES.md and an honest open-issues list.

6. **Build recipes** (what each style agent actually did; scripts are in `scripts/style-a|b|c/`):
   - **A.** `cp -R ~/.claude/skills/huashu-art-motion/scripts/engine <A>/engine`. Add `engine/ways/way_make.js`
     (from `scripts/style-a/`), a scene file `engine/ways/<film>.js` that calls `WAY.make({poster, beats, camBase,
     cam, labels})` and registers `SCENES['<film>']`, and `engine/eras_<film>.js` setting `FILM_SIZE=[1280,720]`,
     `PUNCH=0` (otherwise the engine adds a 0.03 punch-in on transitions), `SCENE_LIBS=['ways/way_make.js',
     'ways/<film>.js']`, `SCENE_DIR='ways'`, `ERAS=[{id:'<film>',dur:1}]`. Draw NO text on the canvas. The
     drawing helpers (boxes, lines, cursor, ticks) are written per film; the worked example's set lives
     in its temporary `A/final/build/engine/ways/common.js` and is not part of this skill.
     Then `render_way.py <film> --scale 0.75 --crf 30` → `build.py <film> --meta meta.json` → `pace_check.py
     work/<film>_data.json` → `test_embed.py final/<film>.html:<verdict beat>` (or all at once: `make.sh`).
     After any scene edit, re-render and run `midmove.py` at mid-move times: labels must sit on their objects.
   - **B.** Copy the engine the same way and patch `render.py` to `chromium.launch(channel='chrome', …)`. Put
     `kit.js` in `engine/demos/_hb/`, write `engine/demos/<film>/board.js` (uses `HB.make()`, anchors events to
     `BEATS[k].t0 + offset`) and `engine/demos/<film>/eras.js` (`FILM_SIZE=[1080,1080]`, `PUNCH=0`, Kalam font face,
     `SCENE_LIBS=['demos/<film>/beats.js','demos/_hb/kit.js','demos/<film>/board.js']`). Then
     `build_beats.py beats.json --engine engine` → `uv run --with playwright python engine/render.py --film
     demos/<film> --fps 30 --crf 12 --out work/<film>_master.mp4` → `build_html.py <film> --beats beats.json`
     (720², 24 fps, lowest CRF that fits) → `test_contract.py final/<film>.html --beats beats.json`. Each film
     ends with a pull-back to the whole board, a ≥ 1 s hold, then an eraser wipe; the empty board is where the loop restarts.
   - **C.** Write `src/<film>.svg` (one `<svg id="scene" class="scene">` holding `<g id="world">`; tag every
     `<text>` or its group with `data-b="<beat>"`) and `src/<film>.js` (camera frames `FR` / `ORDER`; reveals with
     `R(selector, beat, offset)`, moves with `camTo(i, beat, offset)`, line draws with `draw()`). Then
     `build.py beats.json --src src --out final` → `test_contract.py final/<film>.html` → `widthcheck.py`.
     The runtime (`shell.html`, `shell.css`, `head.js`, `tail.js`) is reused as is; swap the `:root` tokens.

7. **Check before showing anyone** (all three builds skipped the last three; do them):
   - pacing gate OK; contract test all pass at 1100 and 360 px in real Chrome; sizes under budget;
   - look at contact sheets of every beat at both widths (`scripts/common/contact_sheet.py`);
   - huashu `film_gate.py` on the A/B mp4s (with the ffprobe shim if needed), red read as explained in `traps.md`;
   - an independent reviewer who did not build it watches each loop at normal speed and writes findings;
   - test inside the real host page (parent side of `references/embed-contract.md`), on a real phone, and in
     Safari (style A/B fallback: poster + numbered captions when H.264 cannot play).

8. **Hand over.** Show the three styles side by side (stills or a switcher page), with the loop lengths, sizes,
   what was invented on the picture (for the user to confirm), and what was not checked.

## Host side: all nine in one slide with a switcher (`scripts/deck/`)

What the worked deck does, and what broke on the way:
1. **Embed, don't link.** Each film goes into the deck as `<script type="text/plain" id="anim-{style}-{way}">`
   with `</script` → `<\/script` and `<!--` → `<\!--` escaped; JS decodes it into `iframe.srcdoc` only when the
   slide is shown (one iframe, built on demand). `embed_anims.py` does this idempotently between
   `<!--ANIM-DATA-START-->` / `<!--ANIM-DATA-END-->` markers, so re-running after a rebuild replaces only the data.
   The deck grew from ~0.3 MB to 4.5 MB.
2. **One slide, two segmented button groups** (Way, Style; `aria-pressed`), plus a "Watch it work" link inside each
   Way's detail panel that sets the way, closes the panel and jumps to the slide.
3. **Play/pause follows the slide:** `go()` dispatches a `deck:slide` event; the switcher posts `anim-play` when
   its slide becomes current (and on iframe load if current), `anim-pause` otherwise.
4. **Gestures over the iframe:** the deck's wheel/key/swipe handlers were refactored into `onWheel(dy,mode)`,
   `onKey(key)`, `onSwipe(dy,dx)`, called both by the deck's own listeners and by the iframe's forwarded
   messages (accept only `e.source === frame.contentWindow`). `howtest2.py` proves one gesture = one slide.
5. **Fit to one laptop screen: narrow the inner layout first, zoom last.** At 1280×800 the films were 740–840 px
   tall at full width, so the caption fell below the screen. What works (`howFit` in `embed_anims.py`): the srcdoc
   iframe is same-origin, so the deck measures `contentDocument.body` height itself. It tries inner widths from the
   box width down to 740 px (binary search, waiting ~90 ms per width because a film may set its layout in JS on
   resize, frame hidden meanwhile) and keeps the widest that fits; only if 740 px is still too tall does it set
   `frame.style.zoom`. Narrowing beats zooming because the caption keeps its size while the picture shrinks.
   Traps met on the way: (a) zoom with `width:100%` widens the inner layout (1126 → 1876 px) and loops down to
   the floor, so always pin `frame.style.width` in px; (b) `documentElement.scrollHeight` never reports less than
   the iframe's current height, so it cannot drive shrinking (measure `body` instead, with the frame made tall);
   (c) measuring in the same tick as the width change reads a stale JS layout. Ask films for a side-by-side layout
   when wide (square pictures) and ≤ 580 px total height at 780 px wide. Phones (< 900 px) do not fit; the slide
   scrolls, with a compact header.
6. **Tests:** `howtest.py` (switching, deep link, arrows), `howtest2.py` (all 9 load and play in real Chrome,
   wheel/key/swipe over the iframe move exactly one slide), plus the deck's own one-gesture-one-slide checks.
   Any deck test that hard-codes slide numbers breaks when the slide is inserted: look slides up by id.

## Pacing (the user's main complaint about the first cut)

The first prototypes were 8–13 s. The reader's verdict: too fast to read what was happening, and it needed captions. The rule used for the rebuild:
- each beat lasts ≥ max(4.5 s, (caption words + new picture words) / 3 + 1.5 s). The canonical count is
  `scripts/common/pace_check.py` (and style C's `build.py`, which counts the same way from the SVG). Style A's own
  `pace_check.py` checks the built film's real label times and differs in one way: a word repeated by a new label
  in a later beat counts again there;
- something new appears only ≥ 2.5 s after the previous words; the camera holds still while words are read;
- slow camera moves between beats (1.4–2.0 s, sine easing), at most ONE quick accent per film, on the verdict;
- ≥ 1 s hold on the last frame before the loop.

Consequence to tell the user up front: captions of ~20 words per beat make 5–6 beat films of 40–80 s. In the
worked example the brief's 18–34 s targets were impossible (captions alone needed 31.5–51.7 s); all three
agents chose the reading rule and built 35–82 s loops, which nobody had confirmed with the user. Shorter loops
mean shorter captions, changed once in `beats.json` for all styles.

## Embed contract, size and phones (summary; full text in `references/embed-contract.md`)

- One self-contained HTML file per film, loaded by the host into `<iframe srcdoc>`. Picture + caption strip +
  step rail + Play/Pause, nothing else. Media base64-inline; only Google Fonts and pinned GSAP may load.
- Posts `{type:'anim-height', h}` (h = root element height, so it can shrink); starts paused on beat 1's
  finished frame; `anim-play` / `anim-pause` messages; autoplays only when opened on its own.
- Forwards wheel, navigation keys and swipes to the deck as `deck-wheel` / `deck-key` / `deck-swipe` with the
  verbatim snippet, so one gesture still moves one slide.
- Reduced motion: never autoplay, show the verdict frame and every caption as a numbered list, rail still jumps.
- Budgets: video styles ≤ 900 KB per file (A rendered at 960×540, B at 720×720 / 24 fps); SVG style ≤ 40 KB.
- Phones: captions ≥ 16 px at a 360 px iframe, unclipped, height stable across beats. Text on the picture came
  out at 10–14 px at 360 px in every style, so keep picture text to short labels and let the caption explain.

## Agent orchestration (detail in `references/agent-briefs.md`)

Worked example: 3 Opus direction agents → user kept all three styles → 3 Opus build agents (one per style, each
continuing its own prototype) → 1 agent wrote this skill. Seven agents in total. Each brief carried: the shared
SPEC.md path, the huashu files to read, the style's format in one paragraph, the host page as read only, the
folder it may write to, `channel='chrome'` and the ffmpeg location, the self-check list, and a JSON result schema
that includes `open_issues`. Add next time: one independent reviewer, and a single orchestrator decision on any
conflict all agents raise (here: loop length).

## Known traps (top ones; all of them with fixes in `references/traps.md`)

- Playwright's bundled Chromium cannot play H.264: test video embeds with `channel='chrome'`.
- `ffprobe` was missing: put `scripts/common/ffprobe-shim` first on PATH for huashu's `film_gate.py`.
- Style A labels drift after any scene, camera or timing edit unless you re-render the label track.
- huashu's fast-motion gate goes red when long still holds for reading dominate a film (A: 0.034 and 0.007); record it, do not add motion.
- The blue-purple gate stayed green on a dark navy deck; no override was needed.
- Style C: fit camera frames to the aspect before interpolating; use sine, not power2; wrap translated SVG
  elements before GSAP animates them.

## Scripts

Every script starts with a one-line comment saying what it does and its inputs; run a Python script with `-h`
(or no arguments) for usage. What was run after client content was stripped, against the worked example's output:
A `build.py` and C `build.py` rebuilt byte-identical files; B `build_html.py` rebuilt a same-size file; the A, B
and C contract tests passed on one film each (28, 34 and all checks); A `render_way.py` rendered stills; A
`pace_check.py`, `midmove.py`, B `build_beats.py`, C `camdbg.py`, `widthcheck.py`, `common/*` ran once each.
Not run: `make.sh` (syntax check only) and `kit.js` (syntax check only; it runs inside the engine).

| Script | Use |
|---|---|
| `common/pace_check.py` | Pacing gate on `beats.json`; prints the shortest loop the captions allow |
| `common/beats.example.json` | The shared beats format (neutral example) |
| `common/contact_sheet.py` | Tile stills into one image to look at |
| `common/ffprobe-shim/ffprobe` | Stand-in for a missing ffprobe (huashu film_gate) |
| `style-a/way_make.js`, `render_way.py`, `build.py`, `pace_check.py`, `test_embed.py`, `midmove.py`, `make.sh`, `player_template.html` | Style A pipeline: label track, render, inline, gates, contract test |
| `style-b/kit.js`, `build_beats.py`, `build_html.py`, `test_contract.py`, `player.html` | Style B pipeline: board kit, timing bridge, encode + inline, contract test |
| `style-c/shell.html`, `shell.css`, `head.js`, `tail.js`, `build.py`, `test_contract.py`, `camdbg.py`, `widthcheck.py` | Style C runtime, builder, contract + timing test, camera and width checks |
| `deck/embed_anims.py`, `howtest.py`, `howtest2.py` | Host side: embed all films + switcher slide + zoom-to-fit into a stacked-slide deck; tests (labels and anchor ids are the worked deck's, change first) |

Dependencies: `uv`, Google Chrome, ffmpeg (styles A and B), Pillow for contact sheets, the
`huashu-art-motion` skill (engine for A and B, `film_gate.py`, `storyboard_lint.py`).

## Worked example

Built on a real client deck (details withheld): a deck comparing three alternative approaches to one process,
each animated in all three styles (3 × 3 films). Everything above
(timings, sizes, traps, heights) comes from that build. Keep your own worked example's files (spec, the films,
each style's NOTES.md) somewhere lasting, outside any session scratchpad, and point to it from your project notes,
not from this skill.

## Credits

- **[huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion)** by 花叔 (alchaincyf), MIT licence: the
  direction method (shot lists, camera grammar, the ways an explainer fails, film_gate and storyboard_lint) and
  the rendering engine for styles A and B (t1_3b1b and y3_whiteboard grammars). This skill's style A and B
  scripts are written to run inside a copy of that engine. Its licence notice is in `THIRD_PARTY_NOTICES.md`.
- **[GSAP](https://gsap.com)** (GreenSock, now part of Webflow), loaded from cdnjs at runtime by style C; not bundled.
- **Fonts** loaded at runtime, not bundled: [Outfit](https://fonts.google.com/specimen/Outfit) and
  [Kalam](https://fonts.google.com/specimen/Kalam) (SIL Open Font License).
- **Made by** Huiyan Wan with **Claude** (Anthropic), in Claude Code: Claude ran the build as parallel agents (one per
  style, plus independent reviewers) and wrote this skill from what worked and what broke.
