# Drawing a wand cursor

Read this before you draw a new wand for `examples/fairy_cursor.js`, or before you judge one. A wand cursor is a
40 × 40 SVG painted with `cursor: url(...) x y, auto`. It is the one piece of the page that is on screen all the
time and right under the user's eye, so it must be sharp, readable and charming at its real size, on light pages
and on dark ones.

## The quality bar

A wand is done when every line here is true. Check the last two by looking at the picture, not by reading the SVG.

- **40 × 40 image, drawn on a 40-unit grid.** Big enough for a gem, an accessory and glints; small enough to stay under
  the browser cap. Firefox and Chromium ignore cursor images over **128 × 128** without an error (MDN `cursor`),
  so the cursor just silently stays the default arrow.
- **The click point sits on the gem.** The hotspot (`27 11` in every family here) is in image pixels, counted from
  the top-left, and must be inside the image (browsers clamp it). The user aims with the shiny part, not the end of
  the stick.
- **An outline whose colour flips with the page.** Use dark ink (`#2a2140`) on light pages and white on dark pages.
  Without it, a pastel wand disappears on a white page and a dark wood staff disappears on a dark one. Decide
  light or dark from the **page**, by the same rule as the glints trail (`pageIsDark()` in `sparkle_trail.js`):
  `<html data-theme="light|dark">` when set; otherwise the measured background of `<body>`, then `<html>`; with
  neither opaque, the page is white unless its `color-scheme` allows `dark` and the system is dark. The system
  setting alone is the wrong signal: a dark-mode visitor on a light-only site would get white ink on white.
  Repaint when any input changes (`data-theme`, `class` / `style` on `<html>` or `<body>`, a background
  transition ending, `load`, the system scheme).
- **A brighter twin for clickables.** The same wand with a radial halo behind the gem and more glints, set as
  `--stp-wand-link`. It is how the cursor tells you "this is clickable". Keep `radialGradient` for the twin only;
  `tests/sparkle_smoke.mjs` checks that the base wand has none. The pixel twin has no `radialGradient` at all, by
  design: its halo is one ring of cells in the gem colour (a dithered checkerboard read as mud on dark pages). So
  don't point that check at `data-wand="pixel"`.
- **A still image.** Browsers draw a cursor image as one still frame, and reduced motion has nothing to stop. The twinkle belongs
  to the sparkle trail, not the cursor.
- **Unique ids.** Gradient ids are prefixed per wand (`stp-<family>-<palette>-<l|d><0|1>-n`). A gallery inlines many
  wands into one page, and duplicate ids make every wand silently use the first wand's gradients.
- **Looked at at 40 px, on light and on dark.** Rasterise at 40 px with device-pixel ratio 1, then blow that raster
  up 3× with `image-rendering: pixelated`. A vector redrawn at 120 px hides the mush you are looking for.
- **Different from its siblings in shape, not just in colour.** Squint at the 40 px row: each family must be
  nameable from its silhouette. `tests/sparkle_wands_smoke.mjs` compares every pair of silhouettes.

## Anatomy: each part and its job

The head sits top-right, the stick runs down-left at 45°, and the end cap sits in the bottom-left corner. This is
how a right hand holds a wand, and it keeps the click point near the top of the image.

| Part | Its job | How `fairy_cursor.js` draws it |
|---|---|---|
| **Rod** | Reads as "a wand" and gives the direction | `k.rod`: an ink stroke 1.8 px wider than the rod, then a gradient stroke shaded *across* its width (dark, highlight, mid, dark), so it looks round. 2.4–3.8 px wide. |
| **Bands** | Show it was made by someone, and break up a long rod | `k.stick(w, [fractions])`: short metal strokes across the rod. Two near the grip and one under the head is plenty. |
| **End cap** | Ends the rod cleanly instead of on a raw stroke cap | `k.o(4.6, 35.9, 1.8, …)`: a small shiny ball. |
| **Gem / head** | The point of the whole thing: it carries the click point | Centred on the hotspot, 6–10 px across. Shade it with a *linear* gradient lit from the top-left (`k.shine`) plus one white highlight dot. |
| **Leaves, bow, ring** | Character, and a silhouette nobody else has | Small (≤ 6 px), outlined, kept off the click point. One accessory per wand. |
| **Aura and halo** | "The tip is lit" | Base wand: two faint flat circles of r 7 and r 4.6. Twin: a radial gradient of r 13, white at the centre fading to the glow colour. A family with a hole in its head (`moon`) sets `bite: [x, y, r]` and both are masked out of it. |
| **Glints** | The sparkle | Four-point stars with concave sides (`glint`), so they read as twinkles rather than diamonds. 2 on the base wand and 5 on the twin, bigger and brighter. |
| **Outline** | Readable on any page | `paint-order="stroke"` with a stroke of about 1.5, so ~0.75 px of ink shows outside the fill and none eats into it. |

## The families

`data-wand` picks one and `data-wand-palette` picks a palette (the first is the default). `heart` is an alias of
`candy`, because the old heart wand was a plain heart on a stick, and candy is that wand grown up. An unknown family
falls back to `star`, an unknown palette to the family's first, and names every JS object has (`constructor`,
`__proto__`) are unknown names, not crashes.

| Family | Palettes | One-line brief | The 16 px / 40 px trap |
|---|---|---|---|
| `star` | gold · pink · ice | The classic: a plump five-point star on a slim rod. | Thin points vanish at small sizes. Keep the inner radius at ≥ 45 % of the outer one. Our first ribbon under the star read as an arrowhead, so it went. |
| `magical` | lilac · mint · sky | A magical-girl-style wand: a crescent cradling a heart gem on a banded rod. Silver crescent and lilac by default. | At 40 px the crescent mostly hides behind the heart. That is fine: it reads as a cradle. More detail turns to noise. Wings were cut: with a pink rod, a gold crescent and a heart they made one show's prop. |
| `wizard` | arcane · ember · forest | A gnarled staff with a knot; its top hooks over a glowing orb, with one leaf. | Twigs closing round the orb read as a **magnifying glass**. Two symmetric twigs read as a **slingshot**. Hook from one side only and leave the orb open. On dark pages the wood is darkened instead of lifted, with a thinner white outline and a softer highlight, or it reads as grey. |
| `garden` | rose · daisy · lavender | A wooden rod wound with leaf-green bands, leaves, and a five-petal flower. | More than five petals merge into a disc. White petals (daisy) only survive on a light page because of the ink outline. |
| `cosmic` | violet · aurora · nova | A silver rod and a long-rayed north star inside a tilted planet ring. | The ring wants to dominate. Keep it 1.1 px with a thin outline, and draw its front half after the star so the star stays the biggest thing. |
| `candy` | strawberry · mint · grape | A striped candy cane, a big glossy heart and a bow. | The stripes are a dash pattern along the rod and go grey at 16 px. The heart must be bigger than the magical wand's so the two don't look alike. |
| `crystal` | amethyst · aqua · rose | A faceted crystal point set in a metal collar. | Facets need three tones of one hue (light, mid, shade). Facet lines are ink at 35 % opacity; full ink turns the gem into a grid. |
| `moon` | gold · silver · rose | A sleepy crescent moon (closed eye, blush) holding a little star in its curve. | A glow behind a crescent fills its bite and turns it into a **ball**, worst on dark pages. The aura and the twin's halo are masked out of the bite (`bite`); the test checks the bite stays the page colour. |
| `ocean` | pearl · lagoon · coral | A ribbed scallop shell fanned out behind a pearl. | Ribs in full ink become hatching. Draw them in the shell colour, darkened. |
| `lollipop` | berry · lemon · sky | A white stick, a swirled lollipop disc and a bow. | Spiral turns closer together than the stroke width fill in solid. Use about 1.8 turns with a 1.8 px stroke. |
| `pixel` | gold · rose · mint | 8-bit: a pixel star on a stepped rod, with a one-cell halo ring when glowing. | 40 / 16 = 2.5, so a 16-cell grid smears. Draw on a 2 px grid (20 cells) with `shape-rendering="crispEdges"`, work out the outline and the bevel from the filled cells, and put the hotspot on a cell centre. Emit one `<path>` of run-length rows per colour, not a `<rect>` per cell: the cursor image is written inline on `<html>`, and one `<rect>` per cell (up to 156) made it up to 17,600 characters; paths cut that to under 2,900. |

## Palettes

- **Four colours per palette, with a meaning set by the family** (noted in a comment above each family). For example,
  `magical` uses rod, metal, gem and `wizard` uses wood, leaf, orb, swirl. Derive the light and dark shades in
  code (`lt`, `dk`) instead of listing them.
- **On dark pages, fills lift 18 % toward white** and the outline turns white. Saturated mid-tones look muddy on a
  dark page without the lift.
- **The rod and the gem are different hues.** If they match, the head stops reading as a separate object.
- **Glints are fairy gold and white** for every family, so a wand looks magical whatever its palette. On light pages
  every glint is gold: a 2 px white glint with an ink outline reads as a grey smudge there. Pixel wands likewise use
  white glints on dark pages and gold on light ones.
- **Why the wand does not read the page's `--stp-c1…` tokens.** A cursor is an image painted once, not a styled
  element. Following the tokens would mean reading computed styles and repainting on every CSS change, and the
  tokens are tuned for confetti, not for outline contrast. Named palettes are curated per family. If a page needs
  its brand colours, add a palette to the family.

## Adding a family

1. Write `draw(k, c, on)` in `FAM` (`c` is the palette after the dark-page lift) with three palettes and a comment naming each palette colour. Use the kit parts
   (`k.stick`, `k.rod`, `k.line`, `k.p`, `k.s`, `k.o`, `k.shine`, `k.bow`) so the outline and ids stay right.
2. Keep the gem centred on `27 11`, and keep everything inside 1–39 so the glints have room.
3. Render the contact sheet (every palette, light and dark, base and glowing, 1× and 3× pixelated) and look at it.
   Iterate until the 40 px version is nameable at a glance.
4. Run `node tests/sparkle_wands_smoke.mjs`. It picks the new family up automatically and checks size, hotspot,
   ids, the glowing twin and how different its silhouette is from the others.

## Where to look (study, don't copy)

These are for learning how professionals solve small-size magic objects: proportions, outline weight, how much
detail survives. Draw your own art; don't trace or paste. Licences checked at each source on **2026-11-06**.

| Source | What to study | Licence (as stated at the source) |
|---|---|---|
| [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) — `assets/Magic wand` | One object drawn as 3D, colour, flat and high-contrast: what each level of detail keeps | MIT (`LICENSE`, © Microsoft Corporation) |
| [Twemoji](https://github.com/jdecked/twemoji) (maintained fork) | Flat emoji at 72 px: a 🪄 that reads at tiny sizes with no outline | Graphics CC BY 4.0, code MIT (README, `LICENSE-GRAPHICS`) |
| [Noto Emoji](https://github.com/googlefonts/noto-emoji) | Rounded, friendly shading on small objects | Images and tools Apache 2.0 ("most image resources"), fonts OFL 1.1 (README) |
| [Phosphor Icons](https://github.com/phosphor-icons/core) — `magic-wand` | The same wand at six stroke weights: how weight changes legibility | MIT (`LICENSE`, © 2023 Phosphor Icons) |
| [Lucide](https://github.com/lucide-icons/lucide) — `wand`, `wand-sparkles` | Minimal line wands at 24 px with sparkles as separate marks | ISC, plus MIT for icons derived from Feather (`LICENSE`) |
| [game-icons.net](https://github.com/game-icons/icons) | Hundreds of fantasy staffs, orbs and wands as silhouettes: the "shape-only" test | CC BY 3.0, some icons CC0 (`license.txt`) |
| [Kenney Cursor Pack](https://kenney.nl/assets/cursor-pack) | Real cursor sets: hotspot placement, outline weight, pointer vs hand | CC0 (asset page and kenney.nl/support) |
| [MDN: `cursor`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/cursor) | The facts: 128 × 128 cap, 32 × 32 recommended, hotspot in image pixels, clamped | Prose CC BY-SA 2.5+, code samples CC0 / MIT (MDN attribution page) |
| [Lospec pixel art tutorials](https://lospec.com/pixel-art-tutorials) | Outlines, dithering and anti-aliasing on tiny grids | No licence on the index page; each tutorial links to its own source with its own terms. Study only. |
| [OpenGameArt](https://opengameart.org) | Pixel-art wands and magic items | Not checked: the FAQ page refused the fetch (403). Each asset shows its own licence, so read it on the asset's page. |

## Don't recreate a named franchise's prop

Describe the **style**, never the **item**. "A magical-girl-style wand: crescent cradling a heart gem" is a style
that belongs to nobody. A copy of a specific show's wand, with its name, its exact shape and its colours, is
someone's trademarked merchandise. Don't name families, palettes, comments or files after a show, a character or a
game, and don't let a composition add up to one show's prop.

Compatibility note: the old value `data-wand="sailormoon"` still draws `magical`; it is not offered in any picker.
