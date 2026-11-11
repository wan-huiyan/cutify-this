# Drawing a floater family

Read this before you draw a new family for `examples/ambient_floaters.js`, or before you judge one. Floaters are the
layer behind everything else on the page, on screen the whole time. They must be small, charming, readable on a
white page and on a dark one, and must never get in the way of the content.

## The quality bar

A family is done when every line here is true. Check the last three by looking at it, not by reading the code.

- **Drawn as paths, never as text.** Every shape is a canvas `Path2D`. No font characters, no emoji: a font draws
  them differently on every system (the old leaf was an emoji picture on a Mac and a flat glyph elsewhere). The
  test reads the file and fails on any character outside plain ASCII, `fillText` or `strokeText`.
- **A unit shape.** Draw each shape inside a box about 1 unit from the middle (radius about 1). The family's `sz`
  then says how big that is in pixels. Line widths are in the same units: 0.07 is a thin line, 0.15 a firm one.
- **Its own motion.** A family earns its place by moving differently from the others: fall and sway, rise, wander,
  twinkle in place, drift sideways. A new colour of the same fall is a palette, not a family.
- **Three depth layers come for free.** Items in the back layer are smaller (x 0.55), fainter (alpha 0.5) and slower
  (x 0.55); the front layer is bigger (x 1.15), solid and faster. Draw the family so that the small, faint version
  still reads as the same thing.
- **A light-page set and a dark-page set of colours.** The page decides (`isDark()` is copied from
  `fairy_cursor.js`). On a light page use saturated mid-tones with a darker edge; on a dark page lift the fills toward
  white and make the edge lighter. A pale colour that only works on one of them is the usual bug: the old snow was
  fixed at white and vanished on white pages. The test draws every family at real size on `#fff` and on `#111` and
  measures it: some pixel must reach 2.2:1 on white and 3:1 on `#111`, and at least 40 % of the solid pixels must
  reach 1.5:1 (so one bright dot cannot carry an invisible shape).
- **A soft edge instead of a hard one for light things.** Snow is pale blue-grey with a wide, faint stroke under the
  main one. Clouds are white with a blue-grey edge, and the small back-layer clouds get a wider one, stroked twice
  on a light page so it stays firm, because their alpha is capped at 0.5. Without an edge, pale shapes dissolve on a white page.
- **Page tokens are made for any page, so darken them on a light one.** `dust` and `fairydust` take the page's
  `--stp-c1 .. --stp-c6`. On a light page they are pulled a quarter of the way toward ink, and dust gets an edge,
  so a pale yellow token still shows on white.
- **Glow is stacked flat circles, not blur.** Two or three circles of falling alpha look like a glow, cost almost
  nothing, and need no gradient object per frame. On light pages keep the glow fainter than on dark ones. Under
  `data-palette="neon"` dust gets such a halo too, as it had in 1.x.
- **Looked at at real size, on both pages.** Render the family at the size it floats (front items are 12 to 40 px
  across) on `#fffdf9` and on `#1c1633`. Squint: can you name it from its outline? The gallery's `preview()` is made
  for exactly this.
- **Different from its siblings in shape and in movement.** Dust (four-point sparkles, drifting) and stars (plump
  five-point, twinkling in place) are both "sparkly", so they differ in shape and in what they do.
- **Quiet.** Back-layer items never exceed alpha 0.5, with one exception: clouds on a dark page (see their row below).
  Nothing flashes faster than about once a second.

## Anatomy of a family in `ambient_floaters.js`

Each entry in `FAM` has the same few parts:

| Part | What it does |
|---|---|
| `sz: [min, max]` | Radius in pixels for the front layer, before depth scaling. |
| `l`, `d` | Colour lists for a light page and a dark page. `dust` and `fairydust` use `pal: 1` instead and take the named palettes (`candy`, `neon`, `meadow`) or the page's `--stp-c1 .. --stp-c6` tokens. |
| `x`, `k`, `ao` | Optional: an accent colour (flower centre, seed stalk), an ink colour (faces, firefly body), an opacity scale for the page (clouds are fainter on dark pages). Each has a light and a dark value. |
| `ad` | Optional: on a dark page, the three layers' opacity instead of 0.5 / 0.75 / 1 (clouds use 0.85 / 0.92 / 1). |
| `init(p, w, h)` | Optional: extra starting values. Stars and clouds remember where they started (`bx`, `by`). |
| `mv(p, k, w, h, t)` | Moves one item. `k` is the time since the last frame in 60 Hz frames, so speed is the same on every screen. Wrap the item round when it leaves (`fall`, `rise`, `torus`). With `k = 0` it must not move the item at all: `preview()` calls it that way to set a pose. |
| `dr(c, p)` | Draws one item. The canvas is already moved, turned and scaled to the item. Use `edge()` for a filled shape with an edge, `A()` to set opacity, `disc()` for circles. |

Every item has the same fields: `ph` (a random phase), `w` (how fast the phase runs), `rot`, `v` (a coin flip for
variety: a single petal instead of a blossom), `q` (its speed, set by its depth layer), `ci` (which colour).
Colours are looked up when drawn, not when made, so a light and dark flip repaints at once.

## The families

| Family | Motion | One-line brief | The trap |
|---|---|---|---|
| `sakura` | falls, zigzags, flips | Five-petal blossoms with a notched tip, and loose petals. | Petals squash flat as they flip; keep the flip no thinner than half width or the blossom turns to a line. |
| `leaves` | falls, swings like a pendulum | Leaves with a midrib and veins, green and autumn colours. | Leaf green on a dark page needs the lift, or it looks like mud. |
| `snowflake` | falls slowly, sways | Six-armed flakes and soft round ones. Blue-grey on light pages. | White snow is invisible on a white page. Use a blue-grey and a soft wide edge; the test checks the contrast. |
| `bubbles` | rises, wobbles | Tinted circles with a white glint. | The white glint is invisible on a pale fill; tint the inside a little so it shows. |
| `dust` | floats, twinkles | Four-point sparkles with curved sides. | Straight sides read as diamonds. Use curves that bow inward. |
| `fairydust` | rises in a wobble, glows | Soft motes with a halo; a tiny sparkle in some. | The halo is flat circles, not blur. On a light page a halo at full strength looks like a stain. |
| `fireflies` | wanders, blinks | A tiny bug: head with feelers, a body, two soft wings swept back, a glowing tail end. | Dark ink on a light page and a light warm body (`#8f7f58`) on a dark one: a dark body on a dark page vanishes and leaves a glowing dot with ears. Keep the glow round the tail, not the whole bug. The test checks the body shows on `#111`. |
| `dandelion` | drifts sideways on the wind | A seed under a fan of fine lines with dots at the ends. | The fan lines are thin: below about 10 px they turn grey, so this family starts at 11 px. |
| `lanterns` | rises, glows, sways | A paper lantern with caps, ribs and a short tassel. | A long tassel looks like legs. Keep it short and curled. |
| `stars` | twinkles in place | Plump five-point stars with rounded corners and a glint. | Sharp points vanish at small sizes. Inner radius at least half the outer one, and round the joins. |
| `clouds` | drifts slowly, bobs | A puffy cloud; the bigger ones are asleep, with blush. | The face has to stay inside the body. On a dark page white at half alpha turns into grey storm clouds: use a soft blue fill at 0.85, a near-white rim, and keep the back layers almost as bright as the front (`ad`), so they look moonlit. Keep them level (a tilted cloud looks thrown). The test checks the dimmest tenth of cloud pixels on `#111` still reaches 5:1. |
| `hearts` | rises like balloons | A heart with a glint, a knot and a wavy string. | The string is the charm; leave it out and it is just a heart. |

`snow` is accepted as another name for `snowflake`. An unknown name, and names every JS object has (`constructor`,
`__proto__`), draw `sakura` rather than failing.

## Adding a family

1. Add the shapes to `shapes()` as `new Path2D("...")` strings (or build them in code, as the star and the dandelion
   fan are).
2. Add the entry to `FAM` with `sz`, `l`, `d`, `mv` and `dr`. Copy the nearest sibling.
3. Open `examples/floaters.html`: the new card appears by itself. Look at it on the light and the dark swatch, then click it and
   watch it move on the live page. Look at it in both themes.
4. Add the family name, and the way it should move, to `tests/sparkle_floaters_smoke.mjs` (`MOTION`). It checks the
   family draws, moves the way you say, and is visible on `#fff` and on `#111` (it measures every family by itself).
5. Keep the file within about 27 KB (the test fails above 27,648 bytes). If it is over, the palette lists and the
   comments are the first place to look.

## Where to look (study, don't copy)

These are for learning how professionals solve small, soft things: proportions, outline weight, how much detail
survives at 12 px. Draw your own art; don't trace or paste. Licences checked at each source on **2026-11-11**
unless the row says otherwise.

| Source | What to study | Licence (as stated at the source) |
|---|---|---|
| [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) | Cherry blossom, leaf, snowflake, balloon, lantern, cloud, firefly-like bugs: one object at several levels of detail | MIT, Copyright Microsoft Corporation (`LICENSE`), checked 2026-11-11 |
| [Twemoji](https://github.com/jdecked/twemoji) (maintained fork) | Flat shapes at 72 px that still read tiny, with no outline | Graphics CC BY 4.0, code MIT (repository front page), checked 2026-11-11 |
| [OpenMoji](https://openmoji.org) | Open-source emoji with a consistent outline weight: how a heavy outline keeps small things readable | Emoji graphics CC BY-SA 4.0 (FAQ page), checked 2026-11-11. Share-alike: study only |
| [Lucide](https://github.com/lucide-icons/lucide) | `snowflake`, `cloud`, `leaf`, `flower`: minimal line versions, good for stroke weight | ISC, plus MIT for icons derived from Feather (`LICENSE`), checked 2026-11-11 |
| [Kenney Particle Pack](https://kenney.nl/assets/particle-pack) | Sparkles, smoke, stars and glows made for particle effects: how soft a glow is drawn | CC0 (asset page), checked 2026-11-11 |
| [MDN: Path2D](https://developer.mozilla.org/en-US/docs/Web/API/Path2D) | The facts: building shapes once and drawing them many times; `addPath` joins shapes | Not checked: the fetched summary did not state the licence. Read the MDN attribution page before quoting it |
| [Noto Emoji](https://github.com/googlefonts/noto-emoji) | Rounded, friendly shading on small objects | Not checked this time (last read 2026-11-06 for the wand guide: Apache 2.0 images, OFL 1.1 fonts) |
| [game-icons.net](https://game-icons.net) | Hundreds of silhouettes: the "shape only" test | Not checked this time (last read 2026-11-06 for the wand guide: CC BY 3.0, some CC0) |

## Don't recreate a named franchise's thing

Describe the **style**, never the **item**. Floaters are made of nature and party things (petals, lanterns, clouds,
balloons), so this rarely comes up. Don't name a family, a palette or a comment after a show, character or game, and
don't draw a recognisable character as a cloud or a balloon.
