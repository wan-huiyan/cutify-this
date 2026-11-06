# Brief template: one spec every style agent reads

Fill this in and save it as `<work folder>/SPEC.md` before any build agent starts. Every style gets the SAME
file, so switching style shows the same story, the same captions and the same lengths. Write the captions in
`beats.json` too (format: `scripts/common/beats.example.json`) and run the pacing gate on it BEFORE briefing:

```sh
python3 ~/.claude/skills/wiggle-that-diagram/scripts/common/pace_check.py beats.json --target film1=35
```

If the floor sum is longer than anyone wants to watch, shorten the captions now (one edit, all styles). Never
set a loop length separately from the captions: in the worked example the brief asked for 28–34 s loops while
the captions alone needed 51.7 s, every agent had to pick one, and the loops came out at about 2× the target.

---

```markdown
# Spec: "<what the reader should understand>" animations, <N> styles × <M> films (<date>)

Who asked and what they said (quote the feedback verbatim if this is a revision, e.g. "too fast to read, add captions").
Host page (READ ONLY, never edit): <absolute path to the deck or report>
Tokens: --bg … --ink … --muted … --line … --gold … --teal … --green … --amber … --red … --card … --panel …
Font: <family> (Google Fonts <weights>). Library if needed: GSAP 3.12.5 from cdnjs (pinned URL).

## Pacing (one rule for every style)
- Beat length >= max(4.5 s, (caption words + NEW picture words) / 3 + 1.5 s).
  NEW picture words: words written on the picture during this beat that this beat's caption does not already say
  and that were not shown in an earlier beat. (Checked by scripts/common/pace_check.py; do not invent another count.)
- A new group of words appears only >= 2.5 s after the previous group. The caption counts as a group shown at the
  beat's start. Words inside one group (e.g. four file names landing together) may arrive ~0.7 s apart.
- The last words of a beat get >= max(2.5, words/3 + 1) s before the beat ends.
- Camera: still while anything is read; slow, calm moves between beats (1.4–2.0 s, sine easing);
  AT MOST ONE quick accent per film, on the main verdict.
- Loop length = the sum of the beats in beats.json (<film1> ≈ <x> s, …). A clear >= 1 s hold on the last frame
  before looping.

## Captions (identical text in every style)
Below the picture: a caption strip (step number + caption sentence, changing with the beat), >= 16 px at a 360 px
iframe. A step rail (tap a step to jump there, and stay paused on it if paused). A Play/Pause button.
Text ON the picture stays short (labels, reasons); the caption carries the explanation.

### Film 1 · <name>
One concrete example threaded through every beat: <the one row / record / case, with its real values>.
1. **<Beat title, 2–4 words>.** "<Exact caption sentence.>"
   - On the picture: <short labels / reasons, worded exactly>
2. **<Beat title>.** "<Caption.>"
   - Verdict beat: <what turns red / green / amber, and the exact one-line reason on each>
…
Do NOT: <made-up ids, real client imagery, invented numbers (label any example figure "example numbers")>.

### Film 2 · <name>
…

## Embed contract (every file must follow it)
Copy `references/embed-contract.md` sections "The child side" 1–10 here, including the input-forwarding snippet
verbatim, and fill in the budgets:
- Style A (diagram clip, text-free video + HTML labels): <= 900 KB per file.
- Style B (whiteboard, square video): <= 900 KB per file (render 720×720 if needed).
- Style C (live SVG + GSAP): <= 40 KB per file.

## Deliverables per style folder
- `final/<film>.html` for each film (following the contract).
- Stills from a tiny test page that loads each file via `<iframe srcdoc>` at 1100 px (in a 1280 page) and 360 px
  (in a 390 page): `final/stills/<film>_1280_beat<K>.png`, `<film>_390_beat<K>.png` for at least beat 1, the
  verdict beat and the last beat, plus `<film>_*_reduced.png`.
- `final/NOTES.md`: how it was built (commands, scripts, huashu grammar used), every gate run and its result,
  sizes, per-beat timings, what was NOT checked, and what a person must re-run after an edit.
- A short shot list per film, written before building (huashu `references/镜头表模板.md`; Chinese headings if you
  want storyboard_lint to run on it).
```
