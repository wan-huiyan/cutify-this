# sparkle-that-page 1.3.0 — wands that point the way, and a gallery that shows a lot

Why: our wand cursor is a 32 px flat line with a shape on top. The wands in morning-fairy (one per world, light and
dark) and in the Agent Quest page (magical-girl wand, twinkling two-grain fairy dust) are much better. The skill
should (a) tell an agent what makes a good wand and where to look, and (b) demo many finished wands.

References (read, port the mechanism, never the app wording):
- morning-fairy `plugins/morning-fairy/skills/morning-fairy/digest/build_digest.py` ~3210–3275: `WANDP` table,
  `wandSVG(on, world, dark)`, repaint on `data-world` / `data-theme` / colour-scheme change.
- `~/Desktop/marieke-agent-quest-2026-10-23.html`: `wandSVG(on)` (magical-girl wand), fairy dust `setDust()`
  (motes + four-point glints that twinkle, separate light and dark palettes).

## Steps

1. `references/wands.md` — anatomy (rod, bands, end cap, gem at the hotspot, wings, glow, glints, outline), quality
   bar (40 px, outline flips light/dark, brighter twin over clickables, still image), ~10 named families with a
   one-line brief, where to look (licences checked at the source, date stated), study-don't-copy, no franchise props
   → verify: every source row has a licence and a checked date, or says "not checked".
2. `fairy_cursor.js` — one drawing function, families × palettes × light/dark; follows the page theme; old
   `data-wand` names still work (`sailormoon` → alias of `magical`) → verify: existing wand assertions pass, new
   ones for light/dark repaint and every family/palette rendering a valid SVG with the hotspot inside.
3. `examples/wands.html` — every family × palette, light and dark, normal and glowing; hover a card to wear it →
   verify: rendered and looked at, smoke test.
4. Trail variant `glints` — two-grain twinkling dust with light/dark palettes → verify: smoke test, idle-stop still 0.
5. Adversarial review, fixes, wire tests into `check-all.sh`, Pages publishes `wands.html`, README picture, version
   1.3.0 + changelog → verify: CI count matches README; live URL 200.

Agents (4): Opus wand artist (steps 1–2), Sonnet gallery (3), Sonnet dust (4), Opus reviewer.
