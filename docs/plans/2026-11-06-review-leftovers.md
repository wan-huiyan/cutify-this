# Review leftovers — everything else from the 2026-11-06 "selling it better" review

Source: `~/Desktop/cutify-this-readme-and-skills-review-2026-11-06.html`. The README "do these first" items shipped in
the README overhaul pull request (wan-huiyan/cutify-this#18). This plan covers the rest.

Out of scope (the review's "Leave out"): Clawd stickers; app-specific mascot lines. Repo homepage field: not asked.

Scope cut, stated: mood/sleep favicons for **10 mascots**, not all 56 (the review's own recommendation).

Three pull requests, one per plugin. Builder agents touch only their plugin folder plus their own test file; the
README, `marketplace.json`, version bumps, changelogs and `scripts/check-all.sh` wiring are done by the main session.

## PR A — sparkle-that-page 1.2.0

1. pomodo's improvements, generalised (no pomodo colours or wording) → verify: smoke tests
   - every effect keeps auto-starting on load AND gains `start()` (idempotent) next to `destroy()`;
     `site/aurora.html` and `site/bubblegum.html` still work through `site/sparkle-bridge.js`
   - trail loop stops when no dust is moving, re-arms on move/click → assert 0 frame callbacks after ~1 s idle, then
     moving again spawns dust
   - wand glows over clickable things (`--stp-wand-link`); scroll mascot cheers at the bottom (`is-end`)
   - a `data-stamp` helper: a stamp lands with a confetti burst (generic "Done!" default)
2. `cute_sounds.js` — oscillators only, no files, off until an opt-in click; one voice per palette
   (meadow triangle, neon sine, candy soft square) → assert no `AudioContext` exists before the opt-in
3. `secret_word.js` — type `magic` (configurable, ignored in text fields) for a party; `finale()` hook → assert
4. sky switch — sun/moon toggle; theme set by a synchronous inline `<head>` script, `localStorage` in try/catch,
   falls back to `prefers-color-scheme` → assert attribute set before `DOMContentLoaded`; screenshot first frame

## PR B — cutify-that-tab 1.14.0

5. mood favicons in `examples/moods/` (kept out of the 78-starter sweep folder): a sleep variant for 10 pixel
   mascots, plus sad and starry for the mochi cat; `favicon_mood.js` (asleep after 18:00 and while the tab is away,
   `setMood()` for page state) → every mood SVG passes `check-favicon.py`; a browser test of the swap
6. favicon builder `examples/builder.html` (design skill: `impeccable`) — subject × style × palette, live 16 px tab
   preview on the four Chrome tab colours, copy-SVG button → rendered and looked at; a smoke test

## PR C — pop-that-readme 1.1.0

7. hand-drawn status badge recipe + two example SVG badges ("Robot vouched", "A human peeked") → render on GitHub

## README (with the PR it belongs to)

- 2×3 grid, one captioned picture per skill; "cute bits" two-picture row; one You:/Claude: example per skill
- use or delete `docs/readme/tab-preview.png`
- re-derive the "N checks" figure from the GitHub Actions log after each PR's run

## Agents (7): Sonnet for sparkle 1, sparkle 2–4, moods, badges; Opus for the builder and the two reviewers
