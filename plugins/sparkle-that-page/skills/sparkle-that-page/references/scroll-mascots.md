# Drawing a scroll companion

Read this before you draw a new companion for `examples/scroll_indicator.js`, or before you judge one. A scroll
companion is a small picture that tells the reader how far down the page they are. It is on screen the whole time
someone reads, so it has to earn that place: small, calm, honest and a little bit delightful.

See every one in `examples/scroll.html` (click a card, then scroll).

## What makes a good companion

A companion is done when every line here is true. Check the last one by looking at the picture, not by reading
the code.

- **It never covers the content.** It lives at an edge (the right-hand rail, the bottom edge or a corner), takes
  no clicks (`pointer-events: none` on the companion and its dotted rail), and is hidden from screen readers
  (`aria-hidden`). It is no bigger than 72 px on its longest side; most are 40 px. The page's own sticky header
  or corner buttons may sit under it: say so to the page owner rather than making it bigger or brighter.
- **It is readable at 30 to 48 px.** Pixel art on a grid of 2 px cells, so every cell lands on whole screen pixels
  and stays sharp. Never a scale that gives 2.5 px cells: they blur. Galleries show it at 3 px per cell, which is
  also whole pixels.
- **Its progress is honest.** One number, 0 at the very top and 1 at the very bottom, read from
  `scrollY / (scrollHeight − innerHeight)`. A traveller's place along its rail, a grower's growth and the moon's
  phase all read that same number, and nothing else. No easing that lets it lag far behind the page, no jumps.
- **It has a payoff at the end.** At the bottom of the page it cheers once: a happy face, sparkles, arms up or a
  flower, and one small hop. Scrolling back up takes it away, so the reader can earn it again.
- **It is calm while idle.** Nothing moves while the page is still, apart from a blink every few seconds (a
  picture swap on a timer, not an animation) and the balloon's slow bob. No loop asks for animation frames while
  nothing scrolls.
- **It reads on white and on near-black.** An outline that flips with the page: dark ink (`#2a2140`) on light
  pages, a pale lavender (`#efe6ff`) on dark ones. Light or dark is decided from the page by the same rule as
  the wand (`isDark()`, copied from `fairy_cursor.js`), never from the system setting alone, and the picture
  repaints the moment `data-theme`, a class or a style on `<html>` or `<body>` changes.
- **Looked at, at its real size, on both pages.** Render the four states at 2 px per cell on white and on
  `#121016`, then at 3 px per cell. If a face needs a second look to read, redraw it.

## The four states

Every companion goes through the same four states. The script puts a class on the element for each, so a page
can style them too, and swaps in that state's picture.

| State | When | Class | What the picture does | What moves (never under reduced motion) |
|---|---|---|---|---|
| **idle** | the page is still | none | Its resting pose, eyes open; climbers hold the rail at chest height, the moon dozes | a blink every 2.6 to 5.2 s; the balloon bobs |
| **moving** | any scroll | `is-moving` | Reaches, leans or lights up: one paw up, a small flame, a humped back | a gentle sway of the whole companion (`rotate`, or `scale` for the caterpillar) |
| **holding on** | a fast scroll (over 4 px per ms, or a big jump) | `is-holding` | Clings on: eyes squeezed shut (`> <`), a wavy mouth, a sweat drop, grey wind lines; the balloon squashes, the stem bends | a fast little shiver (`translate` 1 px each way) |
| **the end** | the very bottom (within 8 px) | `is-end` | Cheers: `^ ^` eyes, an open smile, sparkles, arms up, the flower, the moon landing, the leaf | one hop of the inner picture, once, on arrival |

A big jump counts as a fast scroll, so an anchor link or the Home and End keys can show "holding on" for a moment. The first scroll event after the page loads is ignored, so a position the browser restores on reload does not trigger it.

`is-moving` and `is-holding` both leave 200 ms after the last scroll event. Holding also leaves when the speed
drops below half the threshold while you are still scrolling. When several apply, the picture shows the end
first, then holding, then moving. The live element also carries `data-stp-state` and `data-stp-progress`
(`0.000` to `1.000`), and the API has `scrollIndicator.state()` and `.progress()`.

**Reduced motion** keeps the four pictures and the classes and drops every movement: no sway, shiver, bob, blink,
hop, or easing of the position. The companion still goes to the right place and still flowers at the end.

## Anatomy: how a companion is built

| Part | Its job | How `scroll_indicator.js` does it |
|---|---|---|
| **The grid** | Keeps every shape crisp | `grid(W, H)`: a list of cells, each empty or a colour key (`"b"` body, `"m"` muzzle and paws, `"e"` ears and trim, `"k"` eyes…). Shapes are `g.r(x, y, w, h, key)` rectangles, `g.m(…)` for a rectangle and its mirror, and `g.p` / `g.pm` for single cells from base-36 pairs. |
| **The outline** | Makes it readable on any page | `g.line()` after the body is drawn: every empty cell beside a filled one becomes `"o"`. Leave one empty cell of margin around the body so the outline fits. |
| **The face** | Says which state it is in | `face(g, state, eyeX, eyeY, mouthX, mouthY, blink)` after the outline, so the face sits inside it. The right eye mirrors the left. |
| **Extras** | Sparkles, wind lines, sweat | Drawn after the outline so they have none: `spark(g, x, y)`, `wind(g, rows)`, a couple of `"s"` cells for sweat. |
| **The picture** | One small file | `toSVG()` writes one `<path>` per colour, made of one-row runs (`M4 6h12v1h-12z`), with `shape-rendering="crispEdges"`. No `<rect>` per cell, no ids, no text. |
| **The element** | Position and motion | The outer element carries the position (`translateX/Y`, rounded to whole pixels) and the sway and shiver (`rotate` / `translate` / `scale`, which add to the position). An inner wrapper holds the picture and does the cheer hop. The picture is replaced only when the state, the theme, the mascot or (for growers) the progress step changes. |
| **The rail** | Shows where the journey starts and ends | A dotted line (`.stp-scroll-track`) behind the travellers: down the right side, or along the bottom for the caterpillar. Growers have none. |

All styles go through the CSSOM (`el.style.cssText`), and the markup has no `style=""`, so a page with a strict
`Content-Security-Policy: style-src 'self'` works.

## The families

`data-scroll` picks one. Unknown names fall back to `ring`, an unknown `data-scroll-mascot` to `cat`, and names
every JS object has (`constructor`, `__proto__`) are unknown names, not crashes.

| Family | Where | Grid (cells) | Brief | The small-size trap |
|---|---|---|---|---|
| `mascot` + `cat` (default) | right rail, top to bottom | 20 × 20 | White, pink ears, a close redraw of the 1.x mascot | White on white: the dark outline is the whole silhouette. On dark pages the pale outline nearly matches the body, which is fine: the cat is the bright shape. |
| `mascot` + `bunny` | right rail | 20 × 20 | Peach, tall ears lined pink | Long ears make it tall; keep them 2 cells wide or they turn into antennae. |
| `mascot` + `bear` | right rail | 20 × 20 | Honey brown, cream muzzle, round ears | A muzzle as wide as the mouth crowds the face; it is 6 cells, with the nose only when the mouth is closed. |
| `mascot` + `frog` | right rail | 20 × 20 | Lime green, eyes on top bumps | The eyes are on the bumps, not the face, so the frog draws its own eyes; a squeezed eye fills the bump first. |
| `sprout` | bottom-right corner, does not travel | 19 × 26 | A pot with a face; the stem grows a cell at a time, a leaf every fifth of the page, a flower at the end | Leaves on alternate sides, 4 cells each. More than four leaves turn into a bush. |
| `rocket` | right rail, bottom to top | 20 × 28 | Rises; small flame when moving, a roaring one when holding on; lands on a little moon at the end | A face high on the body meets the window. The eyes sit under the window and the mouth one row lower, or the face reads as a "U". |
| `caterpillar` | bottom edge, left to right | 34 × 14 | Four striped segments and a head; humps when moving, finds a leaf at the end | A flat rectangle leaf reads as a pickle. The leaf is pointed at both ends, with a vein, a stem and a bite. |
| `moon` | bottom-right corner, does not travel | 20 × 20 | New at the top, full at the bottom: each cell is lit if it is right of the shadow line for that phase | Dark eyes vanish on the unlit part on dark pages; eyes on unlit cells switch to a pale colour (`"K"`). |
| `balloon` | right rail, bottom to top | 16 × 28 | Floats up on an ink string; bobs while idle; squashes in the wind | A heart beside the balloon merged with the outline and read as a crown, so the end state has sparkles only. |
| `ring` · `comet` | the 1.x classics | — | Unchanged, apart from the comet's star now being a drawn path and the ring following the page's light/dark | — |

The climbers belong to the same family as the 16 × 16 pixel favicons in
`plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_*.svg`: a square head 10 to 12 cells wide, 1 × 2 eyes,
blush beside the eyes, flat colours, no gradients. They are redrawn bigger, with an outline, a body and paws,
because a scroll companion needs poses and a favicon does not.

## Palettes

- **Each look has its own small colour map** (`LOOKS` in the script), with keys shared across looks: `o`
  outline, `k` eyes, `h` blush, `s` sweat, `y` sparkles, `n` wind lines, `x` the inside of an open mouth.
- **On dark pages, fills lift 10 % toward white**, the outline turns pale lavender, sparkles turn gold
  (`#fde047`) and wind lines light grey. On white pages sparkles are deep amber (`#d97706`): yellow on white
  disappears.
- **The face stays dark** (`#1f2937`) on light fills in both themes.
- **The edge must contrast 3 : 1 with the page.** `tests/sparkle_scroll_smoke.mjs` draws every state on white and on
  `#121016` and checks that at least 85 % of the edge pixels do.

## Adding a companion

1. Write a function `name(state, p, blink)` that returns a grid: body first, then `g.line()`, then the face and
   extras. Draw all four states; keep a one-cell margin for the outline.
2. Add its colours to `LOOKS`, its box (`[width, height, css]`) to `BOX`, its sway to `SWAY`, and its name to
   `DRAW` and `FAMS`. A traveller needs its direction in `render()`.
3. Render the contact sheet (every state, light and dark, 2 px and 3 px per cell) and look at it. Then put it live
   in `examples/scroll.html`, scroll slowly, flick fast and reach the bottom, on both themes.
4. Run `node tests/sparkle_scroll_smoke.mjs` (paths only, four different states, a shape of its own, edge
   contrast, progress, the states, reduced motion, CSP) and `node tests/sparkle_smoke.mjs` (the 1.x behaviour).
5. Keep the effect file within the 32 KB budget the test checks: one path per colour, short offset strings for
   faces.

## Where to look (study, don't copy)

These are for learning how other people draw tiny characters and objects: proportions, outline weight, how few
cells a face needs. Draw your own art; don't trace or paste. Licences checked at each source on **2026-11-11**,
except where it says otherwise.

| Source | What to study | Licence (as stated at the source) |
|---|---|---|
| cutify-that-tab's pixel favicons (`plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_*.svg`, this repo) | The house style the climbers follow: head shape, 1 × 2 eyes, blush | MIT (this repo's `LICENSE`) |
| [Kenney Pixel Platformer](https://kenney.nl/assets/pixel-platformer) | Small characters on a tight grid: how a body, feet and a face fit in very few cells | CC0 (asset page) |
| [Pixelarticons](https://github.com/halfmage/pixelarticons) | Small objects drawn on a 24-cell grid with no anti-aliasing | MIT (`LICENSE`, © 2019 Gerrit Halfmann) |
| [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) | How one object (a rocket, a balloon, a plant) is simplified from 3D to flat to high-contrast | MIT (`LICENSE`, © Microsoft Corporation) |
| [Noto Emoji](https://github.com/googlefonts/noto-emoji) — the eight moon phases | A phase sequence that reads at tiny sizes | Tools and "most image resources" Apache 2.0, fonts OFL 1.1 (README) |
| [Twemoji](https://github.com/jdecked/twemoji) (maintained fork) | Flat, outline-free objects at 72 px | Graphics CC BY 4.0 (`LICENSE-GRAPHICS`) |
| [MDN: prefers-reduced-motion and scroll events](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) | The facts behind the reduced-motion and passive-listener choices | Prose CC BY-SA 2.5 or later, code samples CC0 / MIT (MDN attribution page) |
| [Lospec pixel art tutorials](https://lospec.com/pixel-art-tutorials) | Outlines, faces and readable silhouettes on tiny grids | No licence on the index page; each tutorial links to its own source with its own terms. Study only. |
| [OpenGameArt](https://opengameart.org) | Pixel creatures with several poses | Not checked: the FAQ page refused the fetch (403). Each asset shows its own licence, so read it on the asset's page. |

## Don't recreate a named franchise's character

Describe the **kind of creature**, never a **character**. "A white pixel cat with pink ears" belongs to nobody. A
copy of a famous cat, rabbit, frog or bear, with its name, its signature colours, a bow, a collar or a costume, is
someone's trademark. The same goes for the rocket (no real or fictional spacecraft), the moon (no named moon
character) and the caterpillar (no storybook caterpillar). Don't name looks, palettes, comments or files after a
show, a book, a game or a brand, and don't let a combination of details add up to one.
