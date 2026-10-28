# Changelog — cutify-that-tab

Newest first. The skill itself is in `SKILL.md`; diagnosis and field-testing detail is in
`references/troubleshooting.md`.

## v1.12.0 (2026-10-28)

- **Contradictions fixed.** The "pick colors that read on both backgrounds
  (white/cream fills work for both)" gotcha contradicted the v1.4 finding
  (white body vanishes on Chrome's light inactive tab `#c2c5be`) and v1.6
  (pale `*-50` tints vanish on the cream active tab); it now points at the R1
  rule (`*-300` tints or darker, two-file `<link media>` for dark mode).
  Recolor path **R4** now recommends the two-file `<link media>` recipe, not
  CSS-in-SVG `@media` (which Chrome ignores in favicons, v1.5); the
  "file-level previews" caveat and the silhouette-variant pairing note no
  longer present CSS-in-SVG as the recommended path (it stays documented, as
  Firefox/Safari-only, in the browser-support matrix). "Options A/B/C/D" and
  "Technique B/C/D" corrected to A/B/C (Technique D was removed in v1.7). The
  stale "Open extensions (planned v1.5+)" section was removed (the
  apple-touch-icon note already lives in Step 3; the animated-favicon note is
  now a Common gotcha).
- **SKILL.md split** (933 lines to under 350): the changelog moved to this
  file; the R1-R4 silhouette diagnosis, the "why two files" explanation and
  browser-support matrix, the two-margin-rule rationale and visible-cells
  table, the browser-tab mock, the Chrome tab colour list and the field-testing
  narratives moved to `references/troubleshooting.md`. SKILL.md keeps the
  steps, the three techniques with their canonical recipes, and one-line
  pointers.
- **New shipped checks** (added by a follow-up step in the same release):
  `examples/preview.html` (tab-strip mock at 16/32/64 px against the four
  Chrome tab colours; loads any SVG by query string or file picker) and
  `scripts/check-favicon.py` (XML parses, `crispEdges` on pixel art, edge
  margin, body-vs-tab colour difference, optional `?v=` check on the `<link>`;
  exit 0 pass / 1 fail / 3 unchecked; `--self-test` proves the failures still
  fire). The colour check uses CIEDE2000 >= 22.5, not the WCAG luminance ratio:
  the skill's own field data (white vanished on `#c2c5be` at WCAG 1.75, pink-300
  read there at 1.04) cannot be separated by any luminance threshold. These replace the throwaway `/tmp/favicon_preview.html`
  advice.


- **v1.11.0 (2026-06-02):** Added **Step 3b — cache-bust the `<link>`
  href when REPLACING an existing favicon.** Corrects the long-standing
  gap where the skill's only cache advice was "hard-refresh / incognito
  / caches 24h" — which does NOT fix the common case of a *changed*
  favicon staying stale on the live tab for returning users. The
  deterministic fix is a `?v=N` version query on the icon href (new URL
  = new cache key = forced re-fetch for all users, shipped in the HTML).
  Updated the "Common gotchas" bullet and the Verification checklist to
  point at it. Source: field testing 2026-06-02 — a deployed
  monkey→butterfly favicon swap was correctly served by the server
  (verified via image-SHA ancestry) but every browser kept the cached
  monkey in the tab; `favicon.svg` → `favicon.svg?v=2` shipped the fix
  to all users in one line. Prior guidance had repeatedly mis-attributed
  this to "Chrome being stubborn" with no real remedy.
- **v1.10.0 (2026-05-28):** Big catalog expansion. Dropped 4 mascots
  that didn't land (`blob_hugg`, `pixel_cat_meow`, `pixel_hyper_cat`,
  `pixel_monkey`). Added 50 originals across five families: 15 animals
  (panda, penguin, fox, owl, pig, duckling, cow, puppy, seal, otter,
  hedgehog, axolotl, capybara, corgi, quokka), 10 sweets/food (donut,
  cupcake, ice cream, boba, macaron, pancakes, onigiri, sushi, taiyaki,
  pudding), 10 nature/objects (mushroom, rainbow, star face, moon, sun,
  flower, cactus, tea cup, planet, acorn), 5 silhouettes (cat, bunny,
  heart, star, cloud), and 10 emotion blobs (sparkles, giggle, blush,
  dreamy, proud, party, cozy, wave, bubble heart, thinking). Examples
  catalog now 22 blob + 56 pixel = 78 SVGs.

- **v1.9.0 (2026-05-28):** Added 10 new starter mascots inspired by a
  Slack emoji wishlist (IP-protected characters skipped — designs are
  original): pixel `sheep`, `cat_meow`, `cat_love`, `shy_cat`,
  `hyper_cat`, `monkey`; blob `hugg`, `woah`, `cheer`, `love_rays`
  (the last has no face — pure radiating heart). Examples catalog
  updated.

- **v1.8.0 (2026-05-27):** Expanded Technique B emotion vocabulary. Replaced
  `blob_mint.svg`'s generic happy face with a wink (kept mint gradient).
  Added 5 new emotion blobs: `blob_heart_eyes.svg` (in love),
  `blob_smug.svg` (smirk), `blob_surprise.svg` (gasping with O mouth),
  `blob_starry.svg` (amazed with 4-point star eyes), `blob_kissy.svg`
  (wink + puckered lips). Skill now ships 9 gradient-blob variants
  covering 9 distinct emotions. Useful for picker UIs where the user
  selects mood/personality before color palette.
- **v1.7.0 (2026-05-27):** Removed Technique D (text sticker — initials on
  a pastel chip) — too utilitarian for a "make it cute" skill. Added 6
  new pixel-art (Technique C) examples to widen the mascot vocabulary:
  bunny (peach + pink ears), bear (brown + cream snout), chick
  (yellow + orange beak/feet), bee (striped + sky-blue wings),
  strawberry (red + seeds + face), cloud (sky-blue + pink blush). All
  6 follow the existing pixel_mochi_cat / pixel_ghost style: 16×16
  viewBox, `shape-rendering="crispEdges"`, ~10-15 `<rect>` elements.
- **v1.6.0 (2026-05-27):** Tightened the R1 contrast guidance after a
  two-iteration ship failure in field testing. The previous R1 copy
  ("soft pastel contrasts on light + dark + grey tabs") was too
  generous — `*-50` tier Tailwind pastels (e.g. `#fbcfe8` pink-50) sit
  within ~5% luminance of Chrome's cream active tab (`~#f0f2e8`) and
  vanish on it, even though they read fine on grey-sage inactive tabs
  and on dark mocks. New explicit threshold: body tint should be ≥30
  lightness points below the brightest tab background it has to
  survive (Tailwind `*-300` for cream/white active tabs). Added the
  "if user still can't see it after R1, go 2 shades darker, don't
  abandon R1 for R2" heuristic. Source: field testing iter 1 (pink-50,
  failed) → iter 2 (pink-300, shipped).
- **v1.5.0 (2026-05-27):** Flipped the dark-mode recommendation from
  v1.3. **Chrome does NOT evaluate CSS-in-SVG `@media
  (prefers-color-scheme: dark)` for favicons** (it treats favicon SVGs
  as image-type resources, which don't see system color-scheme inside).
  Firefox and Safari do. The v1.3 claim that "Chrome ignores `media`
  on `<link rel="icon">`" was based on outdated reports — Chrome HAS
  supported it since Chrome 92 (2021). New canonical recipe: **two
  hardcoded-fill SVG files + two `<link rel="icon">` tags**, the dark
  one with `media="(prefers-color-scheme: dark)"`. Added a browser-
  support matrix table. Source: field testing (user reported the v1.3
  recipe stayed charcoal in Chrome dark mode; switching to two files
  fixed it immediately).
- **v1.4.0 (2026-05-27):** Added Step 4 "Diagnose: silhouette
  disappeared into the tab background" subsection. New failure mode
  distinct from tab-edge blending (v1.2) and dark-mode mismatch (v1.3):
  pure-white mascot body vanishes on light-mode inactive tabs (Chrome
  uses `#c2c5be` grey-sage). The dark-mode `prefers-color-scheme`
  recipe does NOT fix this because Chrome is technically in light mode.
  New decision tree (R1 tint body / R2 colored tile / R3 dark outline
  / R4 stack with prefers-color-scheme) with when-to-pick guidance.
  Sample-the-tab-background workflow + side-by-side preview pattern
  for all 4 variants in one HTML mock. Source: field testing follow-up.
- **v1.3.0 (2026-05-27):** Added C-variant 2 (single-color silhouette
  with cut-out eyes — the GitHub-octocat style: split body rects to
  leave gaps where eyes go; tab background shows through). Added a new
  "Dark-mode adaptation via CSS-in-SVG" section: single-file
  `@media (prefers-color-scheme: dark)` inside SVG works in Chrome /
  Firefox / Safari, sidesteps Chrome's broken `<link media>` honoring.
  Added file-preview caveat: `<img src=*.svg>` inherits system theme,
  so dark-mode rendering can't be previewed from a light-mode system
  without inlining the SVG with hardcoded fills. New example:
  `pixel_ghost_silhouette.svg`. Resolved "Dark-mode-aware favicons"
  open extension. Source: field testing.
- **v1.2.0 (2026-05-27):** Corrected the C-variant tile-sizing rule.
  Previous v1.1 recipe (flush 14-wide tile + 14-wide body, rx=3.5 on
  16×16 viewBox) blended with Chrome's tab chrome at live tab size.
  New recipe: **14×14 inset tile (1-cell outer margin) + 12-wide
  mascot body inside** — the "two-margin rule." Added explicit warning
  that file-level previews against a flat dark `<body>` miss the
  tab-edge blending failure mode; live-browser verification is
  mandatory for tiled stickers. Updated `examples/pixel_ghost_tile.svg`
  to the post-fix design. Source: field testing.
- **v1.1.0 (2026-05-27):** Added Technique C-variant for pixel art on a
  rounded tile background. Promoted iterate-with-preview loop from a
  verification step to a first-class authoring pattern. New example:
  `pixel_ghost_tile.svg`. **Superseded by v1.2** for the sizing rule.
  Source: field testing.
- **v1.0.0 (2026-05-27):** Initial skill.
