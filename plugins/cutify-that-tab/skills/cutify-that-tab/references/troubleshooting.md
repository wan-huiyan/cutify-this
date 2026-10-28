# Troubleshooting and reference — cutify-that-tab

Detail moved out of `SKILL.md`. Each section is linked from the one-line pointer in the steps.

Contents:

- [Silhouette vanished into the tab background (R1 to R4)](#silhouette-vanished-into-the-tab-background-r1-to-r4)
- [Dark mode: why two files, not one file plus CSS-in-SVG](#dark-mode-why-two-files-not-one-file-plus-css-in-svg)
- [The two-margin rule for tiled stickers](#the-two-margin-rule-for-tiled-stickers)
- [Tab colours and the browser-tab mock](#tab-colours-and-the-browser-tab-mock)
- [Previewing at real tab size](#previewing-at-real-tab-size)
- [Authoring notes](#authoring-notes)

## Silhouette vanished into the tab background (R1 to R4)

A separate failure mode from tab-edge blending (v1.2) and dark-mode
mismatch (v1.3): the mascot has high contrast with the page `<body>`
but disappears into the *tab strip* color, which is often a light grey
or warm-grey distinct from pure white.


Chrome tab colours (macOS) are listed in
[Tab colours and the browser-tab mock](#tab-colours-and-the-browser-tab-mock).

A pure-white mascot body (`#ffffff`) reads great on `#0a0a0d` mock
backgrounds and on dark-mode active tabs but **completely vanishes**
on a light-mode inactive tab — only the colored accents (ears, blush)
remain visible, plus the eye dots floating in apparent nothingness.

The dark-mode recipe (two files + `<link media>`, see `SKILL.md`) does NOT
fix this: Chrome is technically in *light* mode while displaying the
grey-sage inactive tab, so the light-mode file is the one served —
which is the white body that disappears.

**When the user reports "I can see the ears and eyes but no body"
or shares a screenshot with most of the mascot invisible:**

1. **Sample the actual tab background color** from the user's
   screenshot (a color picker on the part of the tab around the
   favicon). Plug it into your preview mock (`examples/preview.html`, shipped in v1.12, or the manual `favicon_preview.html` below) as
   the `background:` of the tab-strip wrapper so subsequent variants
   render against the real failure environment, not against an
   idealized off-white.
2. **Pick from this recolor decision tree.** Four paths; pick by the
   mascot's existing personality and how much you're willing to
   change the silhouette.

| # | Path | What changes | Trade-off |
|---|---|---|---|
| **R1** | **Tint the body color** | `fill="#fff"` → mid/saturated color (`#f9a8d4` pink-300, `#fde68a` cream, `#bbf7d0` mint) | **Recommended for cute mascots.** Keeps the floating-silhouette charm. **Critical: the tint must be ≥2-3 shades darker than the lightest tab background it has to survive — `#fbcfe8` (pink-50) and similar `*-50` tier pastels are TOO PALE and vanish on cream/white active tabs.** Tailwind reference: aim for `*-200` to `*-300` for soft-cute, `*-400` to `*-500` for kawaii-sticker. ~30 sec edit. |
| **R2** | **Add a colored tile background** | Wrap with `<rect x=0 y=0 w=16 h=16 rx=3 fill="#fbcfe8"/>` first; keep body white | Best contrast in any tab color. Loses the "floating" charm — becomes a sticker icon. Same authoring as C-variant 1 with the **two-margin rule** (v1.2). |
| **R3** | **Add a 1px dark pixel outline** | Add charcoal `<rect>`s tracing the body silhouette | "Lineart" feel. Keeps body white. Doubles the rect count. Survives light tabs because the outline reads even when the fill blends. |
| **R4** | **Add the two-file dark-mode pair** | Ship `favicon.svg` (charcoal body) + `favicon-dark.svg` (light body) with `<link rel="icon" ... media="(prefers-color-scheme: dark)">` on the dark one — the recipe in `SKILL.md` | Only fixes the system-dark-mode case, NOT the grey-light-tab case (see above). Combine with R1 or R3, don't substitute. Do not use CSS-in-SVG `@media` for this: Chrome ignores it in favicons. |

**When to pick which:**

- Started with a pale floating mascot, want minimum visual change → **R1**
  with a `*-200` to `*-300` tint (not `*-50` — see contrast rule above).
- Want guaranteed contrast on every tab color in every theme → **R2**.
- The white body is load-bearing (e.g. the design specifically wants
  paper-white) → **R3**.
- You already implemented R1/R2/R3 and *also* want a different look in
  system dark mode → layer **R4** on top.

**R1 contrast threshold (v1.6.0).** "Tint the body" only works if the
tint is *meaningfully darker* than the tab background. A common
first-iteration failure: pick a `*-50` Tailwind pastel (e.g. `#fbcfe8`
pink-50) because it looks "cute" in the file preview against a dark
`#0a0a0d` body — then ship and discover it vanishes on Chrome's cream
active tab (`~#f0f2e8`) because pink-50 and cream are within ~5%
luminance of each other.

**Working rule:** pick a tint whose lightness is ≥30 points (Tailwind
luminance) below the brightest tab background you need to survive.
For Chrome's brightest tab (`~#f0f2e8`, lightness ~95%), that puts the
body color around lightness ~65% — i.e. Tailwind `*-300` territory
(`#f9a8d4` pink-300, `#fde047` yellow-300, `#86efac` green-300, etc.).

For accents (ears, blush, mouth) that need to differentiate from the
body: bump 2 shades further (`*-500` against a `*-300` body).

Field testing walked this two-iteration loop:
1. Iter 1 shipped `#fbcfe8` pink-50 head with `#fda4af` rose-300 ears.
   Reads on grey-sage inactive tab but vanishes on cream active tab.
2. Iter 2 corrected to `#f9a8d4` pink-300 head, `#ec4899` pink-500 ears,
   `#db2777` pink-600 blushes. Reads on cream + grey + dark.

The lesson: if the user reports "still can't see it" after R1, the
fix is rarely "switch to R2" — it's "go 2 shades darker on R1." Don't
abandon R1 prematurely.

**Preview the recolor options side-by-side.** Build a single HTML
preview with the tab-strip mock at the user's real tab background
color, render all four R-paths inline (one tab per variant). Each
variant: tab-size on the left (14×14), 56×56 enlarged on the right
with hex labels. User can pick by eye in <1 min instead of
ship → screenshot → "hmm" → re-ship loop.

This was a real field-testing experience: white-headed mochi-cat
shipped, user reported "the cat disappears into the tab" with a
screenshot of grey-sage inactive tab (`#c2c5be`). Sampled background,
rendered 4 variants (R1 pink head, R1 cream head, R2 pink tile, R3
outlined), user picked R1 pink. One-line `fill="#fff"` → `fill="#fbcfe8"`
edit shipped the fix. (That first ship used the too-pale `#fbcfe8`; the
two-iteration loop above is what corrected it to `#f9a8d4`.)

## Dark mode: why two files, not one file plus CSS-in-SVG

**Why two files, not one file + CSS-in-SVG (correction of v1.3):**

The v1.3 recipe used a single SVG with an embedded `<style>` block
containing `@media (prefers-color-scheme: dark)`. **This does not work
in Chrome for favicons.** Chrome treats favicon SVGs as *image-type
resources* (loaded via the favicon pipeline, not the document
pipeline) and does NOT evaluate CSS media queries inside them.

- ✅ **Firefox & Safari** honor CSS-in-SVG `@media` inside favicons.
- ❌ **Chrome** ignores it — the favicon stays in its default (light)
  mode regardless of the system color scheme.

Conversely, `media` on `<link rel="icon">` **does** work in Chrome —
since Chrome 92 (2021). It also works in Firefox and Safari. So the
two-file `<link media>` approach is the only path that works in all
three modern engines for favicons specifically.

(The v1.3 claim that "Chrome picks the first `<link rel="icon">`
regardless of the `media` attribute" was wrong — it was based on
outdated reports from pre-Chrome-92. Confirmed empirically in
field testing 2026-05-27: user reported the v1.3 single-file recipe
stayed charcoal in Chrome dark mode; switching to two files fixed it
immediately.)

**Browser support summary for favicon dark-mode techniques:**

| Approach | Chrome 92+ | Firefox | Safari |
|---|---|---|---|
| Two files + `<link media>` | ✅ Works | ✅ Works | ✅ Works |
| One file + CSS-in-SVG `@media` | ❌ Ignored | ✅ Works | ✅ Works |
| Page-level JS swap of `<link href>` based on `matchMedia` | ✅ Works | ✅ Works | ✅ Works |

The two-file approach is the simplest cross-browser path. JS swap is
the most flexible (e.g. live-toggle without page reload) but adds a
script dependency.

**Color guidance:**
- Light mode (light tab): use a dark shade — charcoal `#24292f`
  (GitHub), `#1f2937` (Tailwind gray-800), or your app's primary dark.
- Dark mode (dark tab): use a light shade — `#e5e7eb` (Tailwind
  gray-200) is a soft choice; `#ffffff` is max contrast but glaring at
  favicon size; warm cream `#fce7d4` works if the mascot needs a
  friendlier feel.
- **Don't bother with two intermediate shades** — at 16px tab size, only
  the high-contrast pair reads.

**Accents (cheeks, freckles, hat colors)** can stay hardcoded — they
read on both light and dark body fills as long as they sit in the
medium-saturation range (avoid pure-white/pure-black accents).

**Previewing both modes.** With the two-file recipe each file has hardcoded
fills, so preview each file on its own tab colour (the light file on the light
tab colours, the dark file on the dark ones) — `examples/preview.html` (shipped
in v1.12) does this. For the single-file CSS-in-SVG variant (Firefox/Safari
only), `<img src="favicon.svg">` inherits the *system* colour scheme, so a
preview page on a light-mode system renders the light variant in every `<img>`;
to preview dark rendering without toggling the system theme, inline the SVG
twice with hardcoded fills (one charcoal, one light grey). See
`examples/pixel_ghost_silhouette.svg` and `examples/pixel_ghost_silhouette_dark.svg`.

## The two-margin rule for tiled stickers

**The two-margin rule.** A tiled-sticker favicon has *two* margins to
size separately, and BOTH matter:

1. **Outer margin** — between the tile and the viewBox edge. This is
   what separates your sticker from the browser tab's own rounded edges
   and hover gradient. Skip this margin and the dark tile will blend
   into the tab's chrome at real tab size — even though the SVG file
   looks fine in isolation.
2. **Inner padding** — between the ghost (or mascot) and the tile edge.
   This is what the mascot "breathes" into; without it the mascot looks
   squeezed.

**Why this geometry:**

- Outer margin = 1 cell on each side gives the tile its own visual frame
  at real tab size (16-32px) without sacrificing too much mascot real
  estate. Tested live on Chrome (light-theme tab): a flush 16×16 tile
  blends with the tab's rounded chrome; the 14×14 inset reads as a
  clearly-bounded sticker. (Field testing 2026-05-27 — fix for the
  previous v1.1 design that omitted the outer margin.)
- Tile rx ≈ 21% of tile width (rx=3 for a 14-wide tile) — slightly less
  rounded than the previous v1.1 recipe (rx=3.5 on 16). Visually
  similar but proportional to the smaller tile.
- Mascot body ≤ 12 cells wide (cols 2-13). Leaves ~1-cell inner padding
  between the mascot's widest row and the tile's straight edges. The
  mascot can narrow at top/bottom rows to track the tile's rounded
  corners.

**Visible cells inside the 14×14 tile** (rx=3), in viewBox coords:

| viewBox row (y) | Tile-internal row | Visible cols (viewBox) | Width |
|---|---|---|---|
| 1 | top (rounded) | 2-13 | 12 |
| 2 | row 1 | 1-14 | 14 (full tile) |
| 3-12 | body | 1-14 | 14 (full tile) |
| 13 | bottom-1 | 1-14 | 14 (full tile) |
| 14 | bottom (rounded) | 2-13 | 12 |

So features at viewBox y=1 and y=14 (the rounded tile rows) must
stay within cols 2-13.

**Sizing rule of thumb for tiled pixel art:**

- Outer margin (tile-to-viewBox): **1 cell** on all sides — sweet spot
  validated in live tab rendering.
- Tile size: **14×14** (cols 1-14, rows 1-14).
- Mascot body width: **12-cell maximum** (cols 2-13) at the body rows.
- Mascot dome / bottom-bump rows can stretch wider only inside the
  visible-mask range at that row (typically 12 wide at the tile's
  rounded rows).
- Iteration evidence (field testing): 8 → 10 → 12 → 16 → 14
  flush → **14×14 tile inset with 12-wide mascot inside**. The flush
  intermediate was wrong; only the live-tab screenshot exposed it,
  not the file-level previews.

See `examples/pixel_ghost_tile.svg` for the worked example
(post-margin-fix): 14×14 inset tile, 12-wide
ghost body (cols 2-13), 3-row dome (4→8→12) at viewBox y=1/2/3,
3 symmetric bottom bumps × 2 wide at y=13, eyes at col 5+10, pink
cheeks at col 5-6+9-10.

**Notes on the two margins:**

- **The two are non-substitutable:** more inner padding doesn't fix
  the outer-margin blending bug — they protect against different
  failure modes.
- Empirical sweet spot, validated against live Chrome tab render:
  14×14 inset tile + 12-wide mascot body. Earlier iterations (8 → 10
  → 12 → 16 flush → 14 flush) all looked plausible in file previews
  but the flush variants blended at live tab size. See the v1.2
  changelog and `examples/pixel_ghost_tile.svg` for the corrected
  recipe.

## Tab colours and the browser-tab mock

Chrome on macOS uses roughly:
- Active tab: `#f0eee9` (warm off-white) or `#ffffff`
- Inactive tab: `#c2c5be` to `#d6d6d3` (grey-sage to warm grey)
- Dark mode active tab: `#202124`
- Dark mode inactive tab: `#2f3033`

**Browser-tab mock for previews** (when the user can't view a deployed
URL yet — useful for sharing options):

```html
<div style="display:flex; align-items:flex-end; padding:8px; background:#1c1c22; border-radius:8px 8px 0 0;">
  <div style="display:flex; align-items:center; gap:8px; padding:8px 14px;
              background:#0f0f12; border-radius:6px 6px 0 0; color:#d4d4d8; font-size:11.5px;">
    <span style="width:14px; height:14px; display:inline-flex;">
      <!-- your favicon SVG goes here, sized 14×14 -->
    </span>
    Your App Name
  </div>
</div>
```

This shows the favicon at real tab size next to a tab label, in a
tab-strip context. Far more informative than just looking at the SVG
file.

## Previewing at real tab size

Prefer `examples/preview.html` (shipped in v1.12; tab-strip mock at 16/32/64 px
against the four Chrome tab colours) and `scripts/check-favicon.py` (margin and
contrast checks). The manual version below is the fallback when you cannot use them.

**Iterate-with-preview loop (recommended during authoring, not just at the end).**
For pixel art especially, the design choices that matter (body width,
bump count, eye spacing) only become obvious at real tab size. Don't
author end-to-end then verify — interleave.

Write a tiny `favicon_preview.html` that renders the SVG at 16, 32,
64, 128 px stacked vertically:

```html
<!DOCTYPE html><html><body style="background:#0a0a0d;color:#aaa;font:13px system-ui;padding:40px">
  <div><img src="file:///abs/path/to/favicon.svg" width="16"  height="16"  style="image-rendering:pixelated"> 16×16 (real tab size)</div>
  <div><img src="file:///abs/path/to/favicon.svg" width="32"  height="32"  style="image-rendering:pixelated"> 32×32</div>
  <div><img src="file:///abs/path/to/favicon.svg" width="64"  height="64"  style="image-rendering:pixelated"> 64×64</div>
  <div><img src="file:///abs/path/to/favicon.svg" width="128" height="128" style="image-rendering:pixelated"> 128×128 (sketch scale)</div>
</body></html>
```

Then: `open favicon_preview.html`. Edit the SVG → it's already
re-rendered on the next reload. `image-rendering:pixelated` matches how
browsers actually render pixel art at the favicon's true 16×16.

This was used in a field-testing session — 5 iterations
(8-wide → 10 → 12 → 16 → **14**) converged with the user in ~10
minutes. Each iteration: write the SVG, refresh the preview, ask
"ship / tweak / different design" via AskUserQuestion.

**Caveat — file preview does NOT catch tab-edge blending.** The
`favicon_preview.html` mock above renders the favicon against a
flat dark `body { background:#0a0a0d }`. That hides one class of bug:
when the tile sits flush against the viewBox edge and there's no outer
margin (see C-variant), the tile blends into the *browser tab's own
rounded chrome* — visible only against a real browser-tab background,
not against a flat dark `<body>`. After ship, always verify with one of:

- A force-refreshed real tab in the actual browser (Cmd+Shift+R on Mac;
  favicons cache for ~24h, even in dev).
- A user-captured screenshot of the tab strip.
- A tab-strip mock with the OS's tab background color (lighter than the
  dark `<body>` mock — Chrome's light theme tab is roughly `#f0eee9`,
  not `#0a0a0d`).

Caught in field testing 2026-05-27: the v1.1-shipped flush 14-wide tile
looked clean in the file preview but blended visibly with Chrome's tab
edge. Live screenshot prompted the v1.2 inset-tile fix.

## Authoring notes

**Technique B parameters.**

- `viewBox="0 0 32 32"` — chosen because 32×32 gives integer coordinates
  for `cx/cy` while still scaling cleanly to 16×16 tabs. Don't use 16×16
  directly — sub-pixel coordinates compound rounding errors.
- `rx="8"` on the rect = 25% corner radius. Higher = more pill-shaped.
  `rx="14"` = full circle.
- Eyes at `cy=14` (a bit above middle), smile at `y=21` (lower third).
  Don't center vertically — faces read cuter when the eyes are above
  middle.
- Smile `Q` control point: `Q16 24 20 21` — the `24` is the y of the curve
  pull. Larger = bigger smile. Cap around `26` before it looks demonic.

**Technique C grid sketch.** Think of it as drawing on graph paper. Each
`<rect>` is a "pixel" at integer coords. A typical face = 10-15 rects.
Plan the grid before writing SVG:

```
.  .  .  X  .  .  .  .  .  .  X  .  .  .   ← ears (rows 3-4)
.  .  .  X  .  .  .  .  .  .  X  .  .  .
.  .  .  H  H  H  H  H  H  H  H  H  H  .   ← head (rows 5-13)
.  .  .  H  .  E  .  .  .  .  E  .  H  .   ← eyes
.  .  .  H  B  E  .  M  M  .  E  B  H  .   ← mouth + blush
...
```

Where `H`=head fill, `E`=eye, `M`=mouth, `B`=blush, `X`=ear, `.`=blank.
