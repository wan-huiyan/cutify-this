# Drawing click confetti

Read this before you draw a new family for `examples/click_confetti.js`, or before you judge one. Confetti is a few
dozen small pieces on a transparent canvas for about a second. Each piece is on screen for a moment and is small, so what
matters is the outline at 14 to 20 px, the colour against the page, and how the whole cloud moves. The gallery
(`examples/confetti.html`) shows every family; click a card to fire it.

## The quality bar

A family is done when every line is true. Check the last three by looking at a real burst, not by reading the paths.

- **Every shape is a path.** `Path2D` objects built once at load (from SVG path text, or from `ellipse` / `rect`
  calls). Never a font character and never an emoji: a letter shape looks different on every operating system, and
  one may not exist in the font at all. The test fails if `fillText` or `strokeText` is called for any family.
- **A unit box.** Draw around (0, 0) in a box of about 2 by 2. The piece's size scales it, so the same path serves a
  7 px and a 13 px piece. Keep the widest part near 1 so families look the same size next to each other.
- **A dark outline on light pages.** On a light page every piece gets a thin outline in dark ink, made by stroking
  the path first and filling over it, so about half the line shows outside. Without it a pale pink petal or a
  white snowflake disappears on a white page. The dark page gets no outline: the colours are lifted instead.
- **Palettes with a light-page and a dark-page version.** Write the colours for a light page. The dark version is the
  same colours lifted 22 % toward white (snow and bubbles 55 to 62 %). The test checks that the two differ.
- **Visible on white and on near-black.** The test draws every family in every palette at a small size on white and on
  `#111`, and wants the most contrasting pixel (one at least half covered, blended onto the page) to reach 2.5 to 1.
  `snow` and `bubble` are held to 3 to 1 on top of that. Fills for these two are mid-tones, never pastels, and the bubble
  ring is drawn in a darker shade of its colour on light pages.
- **Different from its siblings in shape.** Squint at a burst: each family should be nameable from its silhouette,
  not only from its colour. A gallery contact sheet of one burst per family, light and dark, is the check.
- **Looked at, in both themes, at real size and at 3 times.** Stills hide the paper flip, the ribbon curl and the bubble
  pop, so also look at a burst mid-flight.
- **Cheap.** Draw with a handful of path calls per piece. No gradients, no blur (the neon theme adds a glow
  through the canvas shadow, which is the one allowed exception). 60 pieces at most per click.

## Anatomy: each part and its job

| Part | Its job | How `click_confetti.js` draws it |
|---|---|---|
| **Body** | The silhouette, which is the whole point | `body(path, piece, w)`: ink outline stroke (light page only), then an optional fill-coloured stroke of width `w` that rounds sharp corners (stars, triangles), then the fill. |
| **Line shape** | Ribbons, sprinkles and snow have no inside | `line(path, piece, w)`: an ink stroke 0.3 wider (snow passes its own, 0.1, so the gaps between its arms stay open), then the colour stroke, round caps. |
| **Highlight** | A glossy look for free | One small white ellipse at 60 % opacity (hearts). Petals and leaves use a vein stroke instead. |
| **Flip** | Paper, ribbons, petals and leaves turn over as they fall | A phase that grows every frame; the piece is scaled along one axis by `cos(phase)`, kept at 20 % or more so it never vanishes. Paper shows a darker back when the cosine is negative. |
| **Sway** | Light things do not fall straight | A sideways nudge of `sin(phase)` each frame, per family. |
| **Drag** | Light things reach a steady fall speed | Gravity against drag on the fall: petals, leaves, snow, paper, ribbon and bubbles fall slowly and steadily; hearts and stars fall faster and faster, like the old pieces. |
| **Pop** | A bubble should end, not fade | At 78 % of its life a bubble is replaced by a growing ring that fades, plus six small droplets. |
| **Pixel snapping** | 8-bit pieces must stay crisp | Whole-pixel positions, whole-pixel cell size (3 or 4), no rotation, and the fade goes in four steps. |

## The families

`data-confetti` picks one and `data-confetti-palette` picks a palette (the first is the default). An unknown family falls
back to `heart`, an unknown palette to the family's first, and names every JS object has (`constructor`, `__proto__`) are
unknown names, not crashes. Old values `heart`, `star`, `confetti`, `petal` and `pixel` still work.

| Family | Palettes | One-line brief | The 14 px trap |
|---|---|---|---|
| `heart` | candy · berry · peach | A plump heart with a glossy highlight. | The cleft must stay open at 14 px, or it reads as a blob. |
| `star` | gold · pastel · ice | A five-point star with rounded corners. | Sharp points vanish. A fill-coloured stroke rounds them and the inner radius stays at half the outer. |
| `confetti` | party · jewel · pastel | The classic mix: paper strips, dots, triangles, small stars. | Each piece takes its variant from its number, so a burst always has all four. |
| `paper` | bright · candy · gold | Strips that flip over as they fall and show a darker back. | A strip seen edge-on must not vanish: the flip stops at 20 %. |
| `ribbon` | rainbow · pink · gift | Curly streamers that flutter. | A stroke much thinner than 0.4 units goes grey at small sizes. |
| `sprinkles` | rainbow · strawberry · cocoa | Fat short capsules that tumble. | Pale sprinkles need the outline; the white ones are the first to vanish. |
| `petal` | sakura · peach · lilac | A notched blossom petal that sways. | A pastel petal on white is the textbook case for the outline. |
| `leaf` | spring · autumn · forest | A veined leaf that turns as it floats. | The vein is a translucent dark line, so it works on every green. |
| `snow` | frost · flurry · pearl | A six-armed flake. | Fill the hub with a small dot only: a big filled hub turns the flake into a gear. Mid blues on light pages, nearly white on dark ones. |
| `bubble` | soap · sea · gum | A thin ring with a glint that drifts up, then pops. | A bubble is mostly empty, so the ring colour carries it: dark enough on white. |
| `note` | pastel · ocean · sunset | A single note or a beamed pair. | The flag and beam are what make it a note; keep them at 0.2 units or thicker. |
| `paw` | blush · caramel · moon | A pad and four toe beans. | Four toes of 0.26 radius is the smallest that still reads as toes at 14 px. |
| `pixel` | candy · arcade · pickle | 8-bit hearts, squares, plus signs and diamonds. | Cells of 2 px look like dust; 3 or 4 read as pixel art. |

## Motions

`data-confetti-motion` on `<html>` sets what a plain click does; `burst(x, y, { motion })` overrides it once.

| Motion | What happens | Use it for |
|---|---|---|
| `burst` (default) | 24 pieces thrown out in all directions | Any celebratory click |
| `fountain` | 28 pieces shoot upward, then fall | A big button, "you did it" |
| `rain` | Pieces start above the top of the screen and fall at a steady speed | A page-level moment (order placed) |
| `pop` | One expanding ring and 8 small pieces | Small buttons, toggles, like buttons |

Under reduced motion every motion gives the same single still shape that fades in about 400 ms.

## Palettes

- **Three to six colours per palette**, written for a light page. Keep the first one the family's signature: it
  is also the colour a reduced-motion visitor sees.
- **Name them for what they are** (`strawberry`, `pickle`), not for the theme.
- **`data-palette` is a different thing.** `candy`, `neon` and `meadow` are page-wide colour themes shared with
  the cute-chrome CSS and the sounds. They override every family's colours (and the `--stp-c1` to `--stp-c6` tokens
  win over them). Precedence: a palette passed to `burst()`, then `data-palette`, then `data-confetti-palette`, then
  the family's first palette.
- **Why the pieces do not read `--stp-c1…` by default.** Those tokens are one set of colours for the whole page.
  Named palettes are curated per family, so snow can be blue-grey and a leaf green on the same page.

## Light and dark

The effect decides light or dark from the page, with the same rule as the wand cursor (`isDark()` is copied from
`fairy_cursor.js`): `<html data-theme="light|dark">` when set; otherwise the measured background of `<body>`, then
`<html>`; with neither opaque, the page is white unless its `color-scheme` allows `dark` and the system is dark. A dark
visitor on a light-only site must not get white-on-white pieces. It repaints when `data-theme`, `class` or `style` on
`<html>` or `<body>` change, when a background transition ends, on `load`, and when the system scheme changes. Pieces
already flying look their colour up on every frame, so they change at once.

## Adding a family

1. Add its colours to `PAL` (three palettes, written for a light page) and, if it is a mid-tone family, a value to `LIFT`.
2. Add its movement to `PH` (gravity, drag, sway, speed, size, life, spin). Leave a value out to use the default.
3. Build its `Path2D` in `SH` and add one branch to `paintShape`, using `body()` or `line()` so the outline stays right.
4. Open `examples/confetti.html`: add one sentence to `BRIEF` for the card.
5. Run `node tests/sparkle_confetti_smoke.mjs`. It picks the new family up from `families` and checks that every
   palette draws, that light and dark differ, that no font character was used, and the reduced-motion shape.
6. Fire a burst of it in each motion on a light and a dark page, and look.

## Where to look (study, don't copy)

For proportions, outline weight and how much detail survives at small sizes. Draw your own art; do not trace or paste.
Licences read at each source on **2026-11-11**.

| Source | What to study | Licence (as stated at the source) |
|---|---|---|
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | A small, well-used confetti engine: gravity, drag, ticks, `flat`, and a reduced-motion switch | ISC (page says "ISC license"; LICENSE wording not read), checked 2026-11-11 |
| [Kenney Particle Pack](https://kenney.nl/assets/particle-pack) | 80 particle sprites: how a few shapes carry a whole effect | CC0 (asset page), checked 2026-11-11 |
| [Twemoji](https://github.com/jdecked/twemoji) (maintained fork) | Flat 72 px emoji: how hearts, stars and notes read with no outline | Graphics CC BY 4.0, code MIT (README), checked 2026-11-11 |
| [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) | One object drawn flat, colour and 3D: which details each level keeps | MIT (repository page), checked 2026-11-11 |
| [OpenMoji](https://github.com/hfg-gmuend/openmoji) | Outlined emoji: line weight against fill | CC BY-SA 4.0 (README). Share-alike: study only, do not copy into this repo. Checked 2026-11-11 |
| [game-icons.net](https://game-icons.net/about.html) | Hundreds of silhouettes: the "shape-only" test | CC BY 3.0 with credit to the author (about page), checked 2026-11-11 |
| [tsParticles](https://github.com/tsparticles/tsparticles) | A big particle library: emitter shapes and presets | MIT (repository page; the end of the page was not read), checked 2026-11-11 |
| [MDN: Path2D](https://developer.mozilla.org/en-US/docs/Web/API/Path2D) | The facts about reusable canvas paths | Page names a Creative Commons licence without giving the version, checked 2026-11-11 |
| [Lospec pixel art tutorials](https://lospec.com/pixel-art-tutorials) | Outlines and dithering on tiny grids (for `pixel`) | Not checked |

## Don't recreate a named franchise's prop

Describe the **style**, never the **item**. A paw print, a soap bubble and a music note belong to nobody. A specific
show's mascot, logo or party item, with its name and exact shape, is someone's trademark. Don't name families, palettes,
comments or files after a show, a character or a game.
