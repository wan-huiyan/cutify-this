# Style vocabulary — cutify-that-tab

Seven named styles that survive a 16 px browser tab. Each has a few hard rules and
one specimen — **the same cat face in every style**, so you compare style, not
subject. Open `examples/styles.html` to see all seven on the four Chrome tab
colours before choosing; a model that only reads a style's *name* draws its
average impression of it.

Every style still has to pass `scripts/check-favicon.py` (exit 0). The rules
below are written so it does.

| Style | Specimen | Feel |
|---|---|---|
| [Kawaii pixel](#kawaii-pixel) | `pixel_mochi_cat.svg` | soft, pastel, the house default |
| [1-bit silhouette](#1-bit-silhouette) | `pixel_cat_silhouette.svg` | quiet, octocat-like, blends with the browser |
| [Game Boy](#game-boy) | `style_gameboy_cat.svg` | nostalgic, handheld, four greens |
| [NES outline](#nes-outline) | `style_nes_cat.svg` | arcade, bold, black-outlined sprite |
| [Die-cut sticker](#die-cut-sticker) | `style_diecut_cat.svg` | laptop-sticker, white cut border |
| [Chibi blob](#chibi-blob) | `style_chibi_cat.svg` | smooth vector, round, squishy |
| [Riso two-ink](#riso-two-ink) | `style_riso_cat.svg` | zine / print, two inks overprinting |

## Kawaii pixel

- **When:** the default for "make it cute"; indie tools, internal apps.
- **Rules:** 16×16 grid, `crispEdges`; body a Tailwind `*-300` or darker (never
  white or `*-50`); accents 2 shades darker than the body; 1×2 dark eyes set wide;
  1-cell blush under each eye; art inside the 12×12 safe box.
- **16 px trap:** pale bodies vanish on light tabs — see
  `troubleshooting.md#silhouette-vanished-into-the-tab-background-r1-to-r4`.

## 1-bit silhouette

- **When:** the user references the GitHub octocat, or wants the icon to feel
  native to the browser chrome.
- **Rules:** one colour; interior detail is *cut out* (gaps in the body), not
  drawn on top; at most 1–2 accent cells; ship a light/dark pair with two
  `<link media>` tags (charcoal `#24292f` light, `#e5e7eb` dark).
- **16 px trap:** without the dark pair the charcoal body disappears on dark tabs.

## Game Boy

- **When:** retro, playful, "games" or "handheld" vibe; a green that isn't a brand.
- **Rules:** exactly four colours, the DMG greens as Nintendo Switch Online
  renders them (lightest → darkest): `#8cad28`, `#6c9421`, `#426b29`, `#214231`
  ([Lospec `dmg-nso`](https://lospec.com/palette-list/dmg-nso)). Draw on a rounded tile of the
  lightest green (the screen); the mascot uses the two middle greens for fill and
  shade, the darkest for eyes and a 1-cell outline. No other hues, no blush pink.
- **16 px trap:** the two lightest greens are close — never put them next to each
  other as the only contrast.

## NES outline

- **When:** arcade, bold, energetic; works on every tab colour because of the
  outline.
- **Rules:** a 1-cell near-black outline (`#1f2937` or `#000`) around the whole
  silhouette; at most 3 fill colours inside it, flat (no gradients, no
  anti-aliasing); a 1-cell white highlight in each eye is allowed. Fill colours
  saturated (Tailwind `*-400`/`*-500`).
- **16 px trap:** the outline eats 2 cells of width — keep the inner body ≥ 8
  cells wide or the face won't fit.

## Die-cut sticker

- **When:** "sticker", "laptop sticker", "badge" — a cut-out look that reads on
  any tab.
- **Rules:** the mascot is surrounded by a 1-cell white border that follows its
  silhouette (the cut line), and the white border sits on a 1-cell soft grey edge
  (`#d1d5db` or `#9ca3af`) so it doesn't vanish on light tabs. Mascot body
  `*-300`/`*-400`. Total art still inside 14×14 (border included).
- **16 px trap:** two border rings leave ~10×10 for the mascot — simplify the face
  to eyes + blush.

## Chibi blob

- **When:** soft, friendly, app-icon feel; smooth curves instead of pixels.
- **Rules:** vector, `viewBox="0 0 32 32"`; the body is one rounded `<rect>` with a
  large `rx` (a squircle) in a `*-300`/`*-400` fill — keep it a `<rect>` so the
  checker can measure it; big head, tiny features low on the face (eyes at
  ~60% height, wide apart); round blush ellipses; ears as small circles or
  triangles. No outline, no gradient (use technique B for gradients).
- **16 px trap:** features smaller than ~2 units of the 32 grid disappear at 16 px.

## Riso two-ink

- **When:** zine, editorial, "printed" or handmade feel; design-literate audiences.
- **Rules:** exactly two inks plus their overprint: fluorescent pink `#ff48b0`
  and blue `#0078bf` (approximations of common riso inks), overlap drawn
  explicitly as `#002284` (pink × blue, multiplied per channel) — don't rely on
  `mix-blend-mode`, which favicon renderers may ignore. Offset one ink by 1 cell
  (misregistration) so the overlap shows as a sliver. Pixel grid, `crispEdges`.
- **16 px trap:** the misregistration must be exactly 1 cell; 2 cells reads as a
  bug.

## Styles that do not survive 16 px

Use these only for larger art (a README hero, a 64 px+ empty state), never for
the tab: thin line icons (strokes under ~1.5 px at 16 px), cross-stitch (each
× needs 3×3 cells), 3D clay / glossy emoji, painterly or textured fills,
photographic mascots.

## Where to look for more (study, don't copy)

Look at these for shapes, expressions and palettes, then draw an original. Never
paste their artwork into a project's favicon unless the user asks and the licence
terms (attribution, share-alike) are met.

| Source | Good for | Licence (checked 2026-10-29) |
|---|---|---|
| [Lospec palette list](https://lospec.com/palette-list) | limited pixel-art palettes (filter by colour count) | no licence stated for palettes; cite the palette page when you use its hex values |
| [OpenMoji](https://openmoji.org) | flat, outlined expressions | graphics CC BY-SA 4.0 — attribution **and** share-alike |
| [Twemoji](https://github.com/jdecked/twemoji) (maintained fork) | simple, chunky emoji shapes | graphics CC BY 4.0 — attribution |
| [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) | soft 3D and flat variants of every emoji | MIT |
| [Kenney](https://kenney.nl/assets) (e.g. 1-Bit Pack, Tiny Town) | pixel sprites at small sizes | CC0 — no attribution needed |
| [Phosphor Icons](https://github.com/phosphor-icons/core) | consistent line/fill icon geometry | MIT |

Licences change; re-check the source's LICENSE file before copying anything
rather than trusting this table.
