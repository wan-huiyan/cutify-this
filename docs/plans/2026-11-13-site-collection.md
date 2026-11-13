# Landing pages show the whole 1.4 collection

Why: the live demo (`/` → `site/` → Aurora and Bubblegum) still offers the 1.2 choices — 4 confetti, 4 wands, 4
floaters, 2 scroll buddies — and never links the four galleries. Bring the gallery designs onto both landing pages.

## Done by the main session (before the builders)

- `site/sparkle-bridge.js`: every family in each variant map (the old names still work: wand `heart`, floaters
  `snow`; floaters `stars` is now the real stars family, `dust` is the old look); the four climbers set
  `data-scroll-mascot`; new `loadArt(key)` returns the pure drawing functions (wand `svg`, confetti `draw`, floaters
  `preview`, scroll `svg`) whether or not the effect runs; `liveFx(key)` returns the running API (for `burst`).
  → verified in Chrome: all four `loadArt` calls return their functions, nothing starts; wand test 40/40.

## Steps

1. **Aurora** (`site/aurora.html` + `tests/site_aurora_smoke.mjs`)
   - Playground: every family as a pill, each card links its gallery; floaters default `dust` keeps today's look.
   - New section "the collection" after the playground: four shelves drawn by the real modules on a dark page —
     11 wands, 13 confetti, 12 floaters, 9 companions (+ ring, comet). Clicking an item puts it on this page and
     keeps the playground in step; confetti items also burst there. Each shelf links its gallery.
   → verify: every family appears as a pill and on a shelf; every shelf picture has drawn pixels; a click changes
   the live effect and the playground state; gallery links resolve; 375 px wide has no sideways scroll; no errors.
2. **Bubblegum** (`site/bubblegum.html` + `tests/site_bubblegum_smoke.mjs`) — the same collection, drawn for a light
   page in Bubblegum's own style; clicking applies it live.
   → verify: the same checks.
3. **Review** (one reviewer across both pages, the bridge and the tests), then fixers.
4. **Ship** (main session): `site/index.html` links the galleries; `check-all.sh` runs the two tests; README check
   count from the CI log; PR, merge on green, look at the live pages in light and dark.

## Agents

2 Sonnet builders (in parallel, one per page), 1 Opus reviewer, 1–2 fixers (Sonnet; Opus only for a serious
finding). At most 5. Builders run no git commands and touch only their own page and test; local ports 8821
(Aurora) and 8822 (Bubblegum); reports to `docs/plans/reports/2026-11-13-site-<page>.md`.
