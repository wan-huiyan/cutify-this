# sparkle-that-page 1.4.0 — confetti, floaters and scroll mascots get the wand treatment

Why: 1.3.0 gave the wand cursor a guide that tells an agent what makes a good wand and where to look, and a gallery
that shows 33 finished wands. Confetti, floaters and the scroll indicator are still the 1.1 versions: a handful of
variants, each drawn with a font character, with nothing that teaches an agent how to make more. Bring the same two
things to each: **a guide (`references/*.md`) that points the way, and a gallery page that shows a lot.**

## What is wrong today (checked in the code, 2026-11-11)

- **Drawn with font characters.** Confetti uses `♥ ★ ❀ ■`, floaters use `❀ 🍃 ❄ ✦ •`. They look different on every
  operating system (🍃 is an emoji picture on a Mac, a flat glyph elsewhere), and `❀` may not exist in the font at all.
- **Snow disappears on white pages.** The snowflake floater is fixed to `#ffffff`. No effect follows light/dark the way
  the wand now does.
- **Few choices.** Confetti: 5 variants, all one motion (a radial burst). Floaters: 6, all falling or rising. Scroll:
  3, with one pixel face as the only character.
- **No guide.** An agent asked for "autumn confetti" or "a scroll mascot that is a rocket" has nothing to work from.

## Rules for all three (same as the wands)

- Each effect stays **one file you copy**, no shared module. About 27 KB at most for confetti and floaters, 32 KB for the scroll file (raised from 20 KB after the build; see step 3).
- **Draw shapes as paths** (canvas `Path2D` or inline SVG), never font characters or emoji.
- **Follow the page's light/dark** with the same rule as `fairy_cursor.js` `isDark()` (data-theme, then body
  background, then html background, then the system setting only if the page allows dark). Copy the function; say so
  in the header.
- **Old names keep working**: every current `data-confetti`, `data-floaters`, `data-scroll` value, and the public API
  (`burst()`, `active()`, `start()`, `destroy()`) that `secret_word.js`, `cute_sounds.js` and `site/sparkle-bridge.js`
  call.
  Confetti's **`data-stamp`** lives inside `click_confetti.js` and must survive the rewrite.
- **The old test is the back-compat gate:** `tests/sparkle_smoke.mjs` (70 checks) must pass **unedited**. A builder
  who finds an old assertion that conflicts with the new design reports it instead of changing the test.
- **Reduced motion** keeps today's behaviour for each effect (confetti: one small *drawn shape* fades in place, no
  longer a font character; floaters: off; scroll: tracks position, no hop).
- **Live theme flips:** `sky_switch.js` and the gallery switches change `data-theme` while effects run. Every effect
  repaints in the new colours without a reload.
- **No franchise characters or props.** Study sources, never copy art.
- Tests print `PASS  name` / `FAIL  name` with **two spaces**, and every new behaviour gets an assertion that fails
  when that behaviour is broken (shown by breaking it once).

## Steps

1. **Confetti** — `references/confetti.md` + `click_confetti.js` + `examples/confetti.html` + `tests/sparkle_confetti_smoke.mjs`
   - About 12 shape families: heart, star, paper (rectangles that flip as they fall), ribbon (curly streamers),
     sprinkles, petal, leaf, snow, bubble (pops into a ring), note, paw, pixel. 3 palettes each, light and dark.
   - New `data-confetti-motion`: `burst` (today's, the default) · `fountain` (shoots up, falls) · `rain` (from the
     top of the screen) · `pop` (a ring and a few pieces, for small buttons).
   - API: `burst(x, y)` keeps working and gains an optional third argument, `burst(x, y, { family, palette, motion })`,
     so a gallery card can fire its own family without restarting the effect.
   - Gallery: one card per family × palette; clicking a card fires it there; a motion switch and the light/dark switch.
   → verify: old variant names still render; every family draws without errors on light and dark; `burst()` with
   options draws that family while the page's own setting stays unchanged; each motion moves pieces the way it says
   (fountain pieces go up first, rain pieces start above the screen); reduced motion still draws exactly one fading
   shape; the canvas stops requesting frames once the pieces are gone; `data-stamp` still lands.

2. **Floaters** — `references/floaters.md` + `ambient_floaters.js` + `examples/floaters.html` + `tests/sparkle_floaters_smoke.mjs`
   - About 12 families: the 6 existing ones redrawn (sakura, leaves, snow, bubbles, dust, fairydust) plus fireflies
     (wander and blink, made for dark pages), dandelion seeds, lanterns (rise and glow), stars (twinkle in place),
     clouds (slow sideways drift), hearts (rise like balloons).
   - Drawn on **one canvas** with class `stp-floaters` (today it is DOM elements; the old test only counts the
     `.stp-floaters` layer, so a canvas with that class keeps it passing).
   - Three depth layers (small, faint, slow at the back; bigger and clearer at the front). Snow turns pale blue-grey on
     light pages.
   - Gallery: cards show each family as a still drawing; clicking one makes it the page's live floaters (like the
     wand gallery's "hover to wear").
   → verify: old variant names still work; snow is visible on a white page (contrast check on the drawn colour);
   flipping `data-theme` while running changes the drawn colours; the count cap of 60 holds; reduced motion still
   means off; `destroy()` stops all frame requests.

3. **Scroll mascots** — `references/scroll-mascots.md` + `scroll_indicator.js` + `examples/scroll.html` + `tests/sparkle_scroll_smoke.mjs`
   - Keep `ring` and `comet`. Turn `mascot` into a family of about 8, each with four states: **idle**, **moving**
     (while you scroll), **holding on** (when you scroll fast) and **cheering** (at the bottom, the existing
     `is-end`). Families: climber (cat, bunny, bear, frog on the side rail), sprout (grows leaf by leaf and flowers at
     the end), rocket (rises, lands on a moon), caterpillar (crawls along the bottom edge), moon (new to full as you
     read), balloon (rises, bobs at the top).
   - Climbers should look like the same family as cutify-that-tab's 56 pixel favicons
     (`plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_*.svg`): study those, redraw at this size.
   - **Size:** eight families × four states will not fit in 20 KB. Budget raised to **about 32 KB** for this one
     file, with compact path data (one path per colour, as the pixel wand does); the builder reports the final size.
   - Gallery: a long page; picking a card puts that mascot on the page so you scroll to see it travel; each card also
     shows its four states side by side as stills.
   → verify: `data-scroll="mascot"` still gives a climbing face; each family's **progress state** goes from 0 at the
   top to 1 at the bottom (for climbers, rocket and balloon that is position; for sprout and moon it is the growth or
   phase, which do not move); "holding on" appears on a fast scroll and leaves after it; `is-end` flips at the bottom
   and back; reduced motion means no hop but the class still flips.

4. **Review and fix** (one reviewer across all three, then fixers)
   → verify: every finding fixed or explicitly declined with a reason.

5. **Ship** (main session)
   - SKILL.md sections 3, 5, 6 point to the guides and galleries; quick start; changelog 1.4.0; the examples list.
   - `demo.html` pickers offer the new families and link the three galleries.
   - `scripts/check-all.sh` runs the three new tests; README check count re-derived from the CI log.
   - README: one picture per effect (or one combined strip), linked to the live galleries.
   - Version 1.4.0 in `marketplace.json` and `plugin.json`.
   - Pages already copies `examples/*.html` and `references/*.md` — no workflow change expected; confirm on the
     live site.
   → verify: CI count matches the README; each gallery URL returns 200 on the live site; I look at every family in
   light and dark in the live galleries (contact sheets) before calling it done.

## Who does what

Builders touch only their own effect's four files. The main session does everything in step 5.

| Agent | Tier | Why this tier |
|---|---|---|
| Confetti builder (step 1) | Sonnet | Shapes are simple paths; physics already exists |
| Floaters builder (step 2) | Sonnet | Simple shapes; motion is parameters on the existing loop |
| Scroll mascot builder (step 3) | Opus | Characters with four states each: the hardest art judgement |
| Reviewer (step 4) | Opus | Finds the light/dark, back-compat and "test can't fail" bugs, as it did for the wands |
| Fixers (step 4) | 1–2 Sonnet, Opus only if a finding is serious | |

**5–6 agents** (2 Opus, 3–4 Sonnet). The three builders run at the same time.

So three builders in one checkout don't collide:
- the main session creates the feature branch first; builders run **no git commands**;
- each builder gets its own local server port (8801 confetti, 8802 floaters, 8803 scroll);
- each launches Playwright with `{ channel: 'chrome' }` (the bundled Chromium is missing on this Mac);
- each writes its report to `docs/plans/reports/2026-11-11-<effect>.md` (not `/private/tmp`, which a restart wipes;
  the reports folder is deleted before the pull request).

## Time

About 1 hour for the three builders in parallel, 20 minutes for the review, 30 minutes of fixes, 30 minutes for
step 5 and the live check: **about 2½ hours wall-clock**, longer if the review finds art that needs redrawing.

## Out of scope

- A shared shapes module (breaks "copy one file").
- New effects (this is a deepening of three existing ones).
- Sounds for the new families (`cute_sounds.js` keeps its current hooks).
