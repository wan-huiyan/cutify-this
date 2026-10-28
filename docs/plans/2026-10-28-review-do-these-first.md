# Plan — the five "do these first" fixes from the 2026-10-28 skill review

Source: review report `~/Desktop/cutify-this-skill-review-2026-10-28.html` (compares the bundle against
`animate`, `gpt-taste`, `alchaincyf/huashu-design`, `TangfanOVO/fanfan-icons`). One branch, one PR:
`improve/do-these-first-review`. Version bumps: cutify-that-tab 1.11.0 → 1.12.0, sparkle-that-page
1.0.0 → 1.1.0 (both `plugin.json` and `.claude-plugin/marketplace.json`).

## Tasks

1. **Tab skill — fix contradictions** (`plugins/cutify-that-tab/skills/cutify-that-tab/SKILL.md`)
   - line ~741 "white/cream fills work for both" → contradicts v1.4/v1.6; replace with pointer to R1 `*-300` rule.
   - line ~575 R4 recommends CSS-in-SVG `@media` (Chrome ignores it, v1.5) → R4 = two-file `<link media>`.
   - lines ~650, ~729 "A/B/C/D" → A/B/C (D removed v1.7).
   - line ~743 "Open extensions (planned v1.5+)" → remove (stale).
   → verify: `grep -nE "B/C/D|A/B/C/D|v1\.5\+|white/cream fills work" SKILL.md` returns nothing.

3. **Tab skill — slim SKILL.md** (933 lines → ~300–350)
   - Changelog → `CHANGELOG.md` beside SKILL.md. R1–R4 diagnosis + browser-support detail + field-testing
     narratives → `references/troubleshooting.md`. SKILL.md keeps the steps, recipes and one-line pointers.
   → verify: `wc -l SKILL.md` ≤ 350; every rule present before still exists in one of the three files
     (diff of headings); no fact lost.

2. **Tab skill — shipped checks** (after 1 and 3)
   - `scripts/check-favicon.py`: XML parses; pixel art has `crispEdges`; edge margin (≥2 cells free-floating,
     ≥1 for tiled); body fill contrast vs Chrome tab colours `#f0eee9 #c2c5be #202124 #2f3033` (WCAG ratio);
     optional `--html <file>` checks `<link rel="icon">` has `?v=` when replacing. Exit 0 PASS / 1 FAIL /
     3 UNCHECKED; `--self-test` on known-good + known-bad fixtures.
   - `examples/preview.html`: tab-strip mock at 16/32/64 px against the 4 tab colours, loads any SVG by
     query string or file picker.
   → verify: `--self-test` exits 0; run over all 78 examples and record the counts; preview rendered + screenshotted.

4. **Sparkle — animation fixes** (`plugins/sparkle-that-page/skills/sparkle-that-page/examples/`)
   - scroll indicator: comet `width` → `transform: scaleX`, mascot `top` → `translateY`.
   - confetti canvas: devicePixelRatio scaling.
   - confetti / trail / floaters: time-based steps (`dt/16.67`), clamped.
   - `cute_chrome.css`: hover gated by `(hover:hover) and (pointer:fine)`.
   - palettes: one source — CSS custom properties read via `getComputedStyle`, JS arrays kept as fallback so
     each file still works alone.
   → verify: headless load of `demo.html` and both `site/` pages — no console errors; grep shows no
     `style.width`/`style.top` animation left.

5. **Sparkle — delight budget**
   - SKILL.md: new "Step 0 · how often will it fire?" (animate's frequency gate) with the per-effect table.
   - confetti default scope = `[data-celebrate], [data-confetti]`; `data-confetti-on="*"` opts into every
     click. `demo.html`, `site/sparkle-bridge.js` / landing pages opt in explicitly so the showcase still
     bursts on every click (copy there promises it).
   - trail: sparser default density; `data-trail-density="storm"` for the old rate.
   - reduced motion: confetti gets a gentle variant (a single heart fades in place, no travel).
   → verify: headless click test — plain click on `demo.html` / site still bursts; a page without opt-in
     only bursts on `[data-celebrate]`; reduced-motion emulation shows only the fade.

6. **Review + PR** — diff review, all checks above re-run, commit (named paths only), PR, merge on green.
   Note: merging redeploys GitHub Pages (`pages.yml` triggers on `examples/**`).

## Execution

Subagents (Sonnet, medium effort): A = tasks 1+3, C = tasks 4+5 (parallel, disjoint files), then B = task 2.
Version bumps in `marketplace.json` done by the orchestrator to avoid two writers on one file.
