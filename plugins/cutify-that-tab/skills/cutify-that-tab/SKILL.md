---
name: cutify-that-tab
description: |
  Add a cute, hand-authored SVG favicon to a web app — the tiny icon that
  shows in the browser tab. Use when the user asks to add a favicon, browser
  tab icon, tab logo, page icon, site icon, or "cute thing in the tab," or
  says the current tab shows a blank/default square. Covers 3 techniques
  in increasing effort: (A) emoji-as-favicon via inline SVG data URI — zero
  assets; (B) gradient mascot blob — a soft blob shape with a face built
  from circles + a quadratic-curve smile; (C) 16×16 pixel-art sticker using
  SVG <rect> on an integer grid with shape-rendering="crispEdges" (bunny,
  bear, chick, mochi cat, ghost, frog, strawberry, cloud, dango, bee, ...).
  Includes the modern `<link rel="icon" type="image/svg+xml">` recipe (no
  more .ico files, no PNG fallbacks needed for modern browsers), tab-size
  verification, and which technique fits which vibe. Skip if the user wants
  a corporate/photographic logo — this skill is for hand-authored, cute,
  low-effort icons.
author: Claude Code
version: 1.12.1
date: 2026-10-28
---

# Cutify That Tab ✨

Put something cute in the browser tab. Three techniques, all SVG, all
hand-authorable in one file: a gradient blob, a 16×16 pixel-art mascot, or
just an emoji. Spend ten minutes making the tab delightful.

## Problem

User has a blank/default favicon (the empty square in the tab) and wants
personality, not a corporate logo. Online "favicon generators" emit a 12-file
pack (favicon.ico, apple-touch-icon variants, manifest.json, ...) for a
problem that needs one SVG file.

## When to use

The user asks for a favicon / tab icon / tab logo / page icon, the tab shows a
blank square or globe, or they want "something cute in the tab". **Skip** for
a polished brand mark, photographic logo, or multi-platform icon pack
(apple-touch-icon, Android maskable).

## Solution

### Step 1 — pick the technique (vibe-driven)

Pick before authoring (switching mid-way is wasted work). When in doubt,
show options A-C with renders (AskUserQuestion preview); don't pick on first ask.

| # | Technique | Effort | When to pick it |
|---|---|---|---|
| **A** | **Emoji favicon** | 0 min — one `<link>` tag | Instant-cute, zero asset files, OK with the OS's emoji font (differs on Mac / Windows / Linux). Examples: 🦊 🦦 🍡 🌈 🪼 🐸 🌷 |
| **B** | **Gradient mascot blob** | 5-10 min | App has a brand gradient and the favicon should rhyme with it. Soft, friendly. ~12 SVG elements. |
| **C** | **16×16 pixel-art sticker** | 10-15 min | Indie / "internal tool with personality" vibe. Pixel-perfect at native tab size. ~10 `<rect>` elements. |

### Step 2 — author the SVG

#### A · Emoji (zero file)

Inline the emoji as a `<text>` element in a data URI on the `<link>`:

```html
<link rel="icon" href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🦊</text></svg>' />
```

`y=".9em"` aligns the emoji to its full height; `font-size="90"` fills the
viewBox with room for descenders. **Single quotes around `href=`** so the SVG
can use double quotes. Swap emojis by changing one character.

#### B · Gradient mascot blob

Reuses the app's brand gradient via `<linearGradient>`. Eyes are two
`<circle>`s, the smile is a quadratic `<path>`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#f59e0b"/>
      <stop offset="35%"  stop-color="#ef4444"/>
      <stop offset="70%"  stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#bg)"/>
  <circle cx="12" cy="14" r="2" fill="#fff"/>
  <circle cx="20" cy="14" r="2" fill="#fff"/>
  <path d="M12 21 Q16 24 20 21" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>
</svg>
```

- `viewBox="0 0 32 32"` (not 16×16: sub-pixel coordinates compound rounding
  errors). `rx="8"` = 25% corner radius; `rx="14"` = circle.
- Eyes at `cy=14` (above middle), smile at `y=21` — faces read cuter that way.
  Smile `Q16 24 20 21`: the `24` is the curve pull; cap near `26`.

Variants (radial gradients, other palettes, sleepy `~~` eyes, blush
ellipses): `examples/blob_*.svg`. More on the parameters:
`references/troubleshooting.md#authoring-notes`

#### C · 16×16 pixel-art sticker

SVG `<rect>`s on an integer grid. `shape-rendering="crispEdges"` is critical —
without it browsers antialias the rects into mush at every zoom level.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <rect x="3"  y="3" width="2" height="2" fill="#ec4899"/>   <!-- ears -->
  <rect x="11" y="3" width="2" height="2" fill="#ec4899"/>
  <rect x="3" y="5" width="10" height="9" fill="#f9a8d4"/>   <!-- head: *-300, not white -->
  <rect x="5"  y="8" width="1" height="2" fill="#1f2937"/>   <!-- eyes -->
  <rect x="10" y="8" width="1" height="2" fill="#1f2937"/>
  <rect x="4"  y="10" width="1" height="1" fill="#db2777"/>  <!-- blush -->
  <rect x="11" y="10" width="1" height="1" fill="#db2777"/>
  <rect x="7" y="10" width="1" height="1" fill="#1f2937"/>   <!-- mouth -->
  <rect x="8" y="10" width="1" height="1" fill="#1f2937"/>
</svg>
```

**Authoring:** plan the grid on graph paper first (one `<rect>` per run of
cells; a typical face is 10-15 rects) — sketch format in
`references/troubleshooting.md#authoring-notes`. **Margin:** leave ≥2px
between the artwork and the viewBox edge (safe box 12×12); tab bars shave
1-2px. **Colour:** a white or `*-50` pastel body vanishes on a light/grey tab —
use `*-300` or darker. Mascot vanished on a light/grey tab? →
`references/troubleshooting.md#silhouette-vanished-into-the-tab-background-r1-to-r4`

#### C-variant 1 · Pixel art on a rounded tile background

A "sticker": mascot on a coloured rounded square. **Two margins** BOTH matter:
the *outer margin* (tile to viewBox edge — without it the tile blends into the
tab's own rounded chrome) and the *inner padding* (mascot to tile edge).

**Canonical recipe (16×16 viewBox):**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <!-- 14×14 tile with 1-cell OUTER margin on all sides. rx=3 ≈ 21% of tile width. -->
  <rect x="1" y="1" width="14" height="14" rx="3" fill="#121216"/>
  <!-- Mascot drawn on top. Body width up to 12 (cols 2-13). -->
  ...
</svg>
```

- Outer margin: **1 cell**. Tile: **14×14** at `(1,1)`, `rx=3`.
- Mascot body: **≤12 cells wide** (cols 2-13); it may narrow at the top and
  bottom rows to follow the tile's rounded corners. Features on the rounded
  rows (viewBox y=1 and y=14) must stay within cols 2-13.

Worked example: `examples/pixel_ghost_tile.svg`. Visible-cells table and the
tuning history: `references/troubleshooting.md#the-two-margin-rule-for-tiled-stickers`

#### C-variant 2 · Single-color silhouette with cut-out eyes (GitHub-octocat style)

Drop the tile: a single-colour silhouette floats on the tab, and eyes are
**cut-outs** — gaps in the body that let the tab background show through.
Split the body rect into smaller rects that flow around the eye, leaving a gap:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <rect class="ghost" x="2" y="3" width="12" height="3"/>    <!-- top of body -->
  <rect class="ghost" x="2" y="6" width="3" height="2"/>     <!-- left of eyes -->
  <rect class="ghost" x="6" y="6" width="4" height="2"/>     <!-- between eyes -->
  <rect class="ghost" x="11" y="6" width="3" height="2"/>    <!-- right of eyes -->
  <rect class="ghost" x="2" y="8" width="12" height="5"/>    <!-- bottom of body -->
</svg>
```

Single-colour only; 1-2 accent dots (pink cheeks) are fine. Pick C-variant 1
for a "sticker" boundary or brand-colour background; C-variant 2 when the
mascot should *emerge from* the tab (GitHub octocat). Charcoal in light mode +
light grey in dark mode reads on both tab themes: `examples/pixel_ghost_silhouette.svg`
+ `examples/pixel_ghost_silhouette_dark.svg` with the recipe below.

### Dark mode — two files + `<link media>`

To read on both light and dark tab bars, ship **two SVG files with hardcoded
fills** and two `<link rel="icon">` tags; `media` goes on the dark one:

```html
<link rel="icon" type="image/svg+xml" href="/static/favicon.svg" />
<link rel="icon" type="image/svg+xml" href="/static/favicon-dark.svg"
      media="(prefers-color-scheme: dark)" />
```

```xml
<!-- favicon.svg (light default) -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <rect x="2" y="3" width="12" height="3" fill="#24292f"/>
  <rect x="5" y="9" width="2" height="1" fill="#f4a8b8"/>  <!-- accent: same in both files -->
</svg>
<!-- favicon-dark.svg: same geometry, light fill (#e5e7eb) -->
```

Why not one file with CSS `@media` inside the SVG: Chrome ignores it for
favicons (works in Firefox/Safari only), while `<link media>` works in every
modern engine since Chrome 92. Details and the support matrix:
`references/troubleshooting.md#dark-mode-why-two-files-not-one-file-plus-css-in-svg`

Colours: dark shade on light tabs (`#24292f`, `#1f2937`), light shade on dark
tabs (`#e5e7eb`; `#ffffff` glares; warm `#fce7d4` is friendlier). Skip
intermediate shades; mid-saturation accents can stay hardcoded in both files.

### Step 3 — wire it in

Save the SVG to the static dir (e.g. `static/favicon.svg`) and add to `<head>`:

```html
<link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
```

**You don't need:** a `.ico` fallback (SVG favicons ship in Chrome 80+,
Firefox 41+, Safari 12+, Edge 80+), multiple sizes (SVG scales), an
apple-touch-icon (iOS "save to home screen" — a different problem) or a
`manifest.json` (PWA territory). For Option A the data URI goes in `href=`.

### Step 3b — REPLACING an existing favicon: cache-bust the `<link>` href

**The step most often missed when *changing* a shipped favicon** (the false
report: *"deployed, but Chrome is just being stubborn"*). Browsers keep
favicons in a **separate, extremely sticky cache keyed on the icon URL**;
Cmd+Shift+R / Ctrl+F5 routinely do **not** evict it. If the contents change
but the href stays `/static/favicon.svg`, the stale icon is served
**indefinitely** to every user who loaded the old one (incognito shows the
new icon, proving the server is fine).

**Fix: change the URL so it becomes a new cache key.** Append a version query
and bump it on every change:

```html
<!-- first ship -->
<link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
<!-- after changing favicon.svg's contents, bump the version: -->
<link rel="icon" type="image/svg+xml" href="/static/favicon.svg?v=2">
```

- Static handlers (Flask/Express/nginx) ignore `?v=…`; it only changes the
  browser's cache key, so every browser re-fetches on next load — no "please
  clear your cache" for users. Bump `?v=2` → `?v=3` on each later change.
- With a templating engine, append after the helper:
  `href="{{ url_for('static', filename='favicon.svg') }}?v=2"`.
- **First add vs replacement:** a `<link rel="icon">` already pointing at an
  existing asset means *replacing* — add/bump `?v=`. No favicon link yet: no
  query needed (`?v=1` makes the next swap painless; for a first add,
  Cmd+Shift+R / Ctrl+F5 or incognito is usually enough).

### Step 4 — verify at real tab size

The step people skip, and where pixel-art choices break. Test at **actual tab
size** (~14-16px wide), not the enlarged SVG.

1. Open the page in a tab. Cute? Legible? Or muddy/clipped?
2. Muddy: forgot `shape-rendering="crispEdges"` on pixel art? Clipped: pull the
   artwork 1-2px in from each viewBox edge.
3. Text illegible: bump font-weight to 800-900, drop a letter, or switch to B/C.
4. Mascot partly invisible on a grey or cream tab? →
   `references/troubleshooting.md#silhouette-vanished-into-the-tab-background-r1-to-r4`

Interleave preview and authoring (body width, bump count and eye spacing only
show at tab size). Two bundled tools:

- `open examples/preview.html?src=favicon.svg&dark=favicon-dark.svg` (or use its
  file pickers): the icon at 16/32/64 px on each of the four Chrome tab colours.
  Look at it: no script replaces that.
- `python3 scripts/check-favicon.py favicon.svg [--dark favicon-dark.svg]
  [--html page.html --replacing]` checks XML validity, `crispEdges`, edge margin,
  body-vs-tab colour difference (CIEDE2000 >= 22.5; WCAG ratio cannot tell pale
  pink from grey) and `?v=`. Exit 0 = pass, **1 = FAIL**, **3 = UNCHECKED** (a
  check could not run, e.g. paths/circles with no tile: not a pass); WARNs
  (1-cell margin, light icon on dark tabs) do not change it. `--self-test` proves
  the FAIL paths still fire.

A flat dark-`<body>` preview misses tab-edge blending and bodies that vanish on a
light tab, so after shipping confirm in a force-refreshed real tab. Chrome tab
colours, the tab-strip mock HTML and the manual preview loop:
`references/troubleshooting.md#tab-colours-and-the-browser-tab-mock`

## Verification

- [ ] `curl /static/favicon.svg` (or your path) returns 200 + the SVG
- [ ] Page HTML contains `<link rel="icon" type="image/svg+xml" href="..."`
- [ ] **If replacing a favicon:** the href carries a bumped `?v=N` (Step 3b) —
      otherwise returning users keep the cached icon
- [ ] Tab shows the new favicon after Cmd+Shift+R (stale after a replace = missing `?v=`)
- [ ] At 1× the icon is legible; at 2× (retina) it is crisp. Crisp on retina
      but blurry at 1× with pixel art = `crispEdges` missing
- [ ] Body fill reads on light, grey-inactive and dark tabs (not white or
      `*-50` pastel): `scripts/check-favicon.py` exits 0 (1 = fix it; 3 = it could
      not check, so look at `examples/preview.html` yourself)

## Example
"The tab is empty, can we put a cute logo on it?" → show options A/B/C with
previews → user picks "C: mochi-cat" → write `static/favicon.svg` (10 rects) →
add the `<link>` to the template → serve; force-refresh. ~10 minutes.

## Notes

**Browser support:** Chrome / Edge 80+, Firefox 41+, Safari 12+ support SVG
favicons natively. Old Safari (≤11) and IE11 do not — add a fallback only if
you have users there, next to the SVG link:
`<link rel="icon" type="image/png" href="/static/favicon.png" sizes="32x32">`

**Common gotchas**
- **`<text>` in SVG favicons uses the system font**, not webfonts (they load
  after the favicon): `-apple-system, system-ui, sans-serif`. Emojis likewise
  render in the OS's emoji font; if consistency matters, use Technique B/C.
- **`width=` / `height=` on the SVG root are optional** when `viewBox` is set;
  the browser scales to the tab's native size (14-32px). Don't hardcode.
- **Dark tab bars don't auto-invert favicons.** Use the two-file `<link media>`
  recipe above (optionally a `/favicon-light.svg` with
  `media="(prefers-color-scheme: light)"`). Don't rely on "white or cream
  fills work on both": pale fills vanish on light/grey tabs; use `*-300` or
  darker (R1 in `references/troubleshooting.md`).
- **Animated favicons:** Chrome rejects most SMIL animation; CSS animation
  works only in some contexts. Not supported by this skill.

## Examples directory

`examples/` ships 78 starter SVGs (13-25 lines each; copy, then change colours
and grid positions); `README.md` has thumbnails.

**Gradient blobs (Option B — 22 emotion variants):** `blob_brand_grad.svg` happy, sunset gradient ·
`blob_mint.svg` wink, mint→cyan · `blob_heart_eyes.svg` in love · `blob_smug.svg` smug / smirk ·
`blob_surprise.svg` gasping (O mouth) · `blob_starry.svg` amazed / starry-eyed ·
`blob_kissy.svg` kissy + blush · `blob_wide_eye.svg` anime / big-eyed ·
`blob_sleepy.svg` closed-arc sleepy · `blob_woah.svg` raised brows + O mouth ·
`blob_cheer.svg` arms-up Y + sparkles · `blob_love_rays.svg` radiating heart (no face) ·
`blob_sparkles.svg` closed-eye smile + sparkles around · `blob_giggle.svg` open laugh + cheek blush ·
`blob_blush.svg` quiet shy + big cheek blush · `blob_dreamy.svg` half-closed eyes + floating stars ·
`blob_proud.svg` closed-eye smile + sparkle accent · `blob_party.svg` tongue out + confetti ·
`blob_cozy.svg` sleepy + steam wisps · `blob_wave.svg` waving arm raised ·
`blob_bubble_heart.svg` speech-bubble outline + heart · `blob_thinking.svg` raised brow + thought-bubble

**Pixel-art mascots (Option C — 56 starter mascots):**
*Animals (24):* `pixel_mochi_cat`, `pixel_bunny`, `pixel_bear`, `pixel_chick`, `pixel_bee`, `pixel_frog`,
`pixel_sheep`, `pixel_cat_love`, `pixel_shy_cat`, `pixel_panda`, `pixel_penguin`, `pixel_fox`,
`pixel_owl`, `pixel_pig`, `pixel_duckling`, `pixel_cow`, `pixel_puppy`, `pixel_seal`,
`pixel_otter`, `pixel_hedgehog`, `pixel_axolotl`, `pixel_capybara`, `pixel_corgi`, `pixel_quokka`.
*Sweets & food (12):* `pixel_strawberry`, `pixel_dango`, `pixel_donut`, `pixel_cupcake`,
`pixel_ice_cream`, `pixel_boba`, `pixel_macaron`, `pixel_pancakes`, `pixel_onigiri`,
`pixel_sushi`, `pixel_taiyaki`, `pixel_pudding`.
*Nature & objects (11):* `pixel_cloud`, `pixel_mushroom`, `pixel_rainbow`, `pixel_star_face`,
`pixel_moon`, `pixel_sun`, `pixel_flower`, `pixel_cactus`, `pixel_tea_cup`, `pixel_planet`, `pixel_acorn`.
*Ghosts (4):* `pixel_ghost`, `pixel_ghost_tile` (C-variant 1, dark tile),
`pixel_ghost_silhouette` (C-variant 2, single-color cut-out), `pixel_ghost_silhouette_dark` (dark-mode pair).
*Silhouettes (5):* `pixel_cat_silhouette`, `pixel_bunny_silhouette`, `pixel_heart_silhouette`,
`pixel_star_silhouette`, `pixel_cloud_silhouette`.

## See also

`references/troubleshooting.md` (R1-R4 diagnosis, two files, two-margin rule, tab
colours, preview loop) · `CHANGELOG.md` · `frontend-design` (broader UI design) ·
`claude-design-handoff-bundle` (implementing a designer's specific mark)

## References

[MDN: SVG favicons](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/link) ·
[Can I Use: SVG favicons](https://caniuse.com/link-icon-svg) (96%+ global support as of 2026) ·
[shape-rendering=crispEdges](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/shape-rendering) ·
[SVG `<text>` and font-family timing](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/text)
