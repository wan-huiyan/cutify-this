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
version: 1.11.0
date: 2026-06-02
---

# Cutify That Tab ✨

Put something cute in the browser tab. Three techniques, all SVG, all
hand-authorable in a single file. Pick whichever vibe — a smiling gradient
blob, a 16×16 pixel-art mascot (bunny, ghost, bear, mochi cat, ...), or
just an emoji. The tab is small real estate; spend ten minutes making it
delightful.

## Problem

User has a web app with a blank/default favicon (the empty square in the
browser tab) and wants something cute in there. They're not looking for a
corporate logo treatment — they want personality. Most online "favicon
generators" produce a heavy 12-file pack (favicon.ico, apple-touch-icon
variants, manifest.json, ...) for a problem that needs one SVG file.

## Context / Trigger Conditions

Use this skill when **any** of:

- User asks: "add a favicon / browser tab icon / tab logo / page icon."
- User says the tab shows a blank square or generic globe.
- User wants "personality" / "cute" / "something in the tab" without
  specifying a brand-mark treatment.
- User shows a UI mockup with a tab strip and the tab favicon is empty.

**Skip** if the user wants a polished brand mark, photographic logo, or a
multi-platform icon pack (apple-touch-icon, Android maskable, etc.) — those
are different problems requiring different tooling.

## Solution

### Step 1 — pick the technique (vibe-driven)

Three techniques. Pick before authoring; switching mid-way is wasted work.

| # | Technique | Effort | When to pick it |
|---|---|---|---|
| **A** | **Emoji favicon** | 0 min — one `<link>` tag | User wants instant-cute, zero asset files, OK with rendering as the OS's emoji font (slightly different on Mac vs Windows vs Linux). Examples: 🦊 🦦 🍡 🌈 🪼 🐸 🌷 |
| **B** | **Gradient mascot blob** | 5-10 min | App has a brand gradient and the favicon should rhyme with it. Soft, friendly. ~12 SVG elements. |
| **C** | **16×16 pixel-art sticker** | 10-15 min | Indie / "internal tool with personality" vibe. Web 1.0 charm. Renders pixel-perfect at native tab size. ~10 `<rect>` elements per icon. |

When in doubt, present the user options A-C with example renders before
authoring (the AskUserQuestion preview is great for this). Don't pick for
them on first ask — vibe matters.

### Step 2 — author the SVG

#### A · Emoji (zero file)

No file. Inline the emoji as a `<text>` element inside a data URI on the
`<link rel="icon">` tag:

```html
<link rel="icon" href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🦊</text></svg>' />
```

`y=".9em"` aligns the emoji to its full height inside the viewBox.
`font-size="90"` fills the 100-unit viewBox with margin for descenders.
**Use single quotes around `href=` so the SVG can use double quotes
internally.** Otherwise escape every quote with `&quot;` and lose your
mind.

Swap emojis later by changing one character.

#### B · Gradient mascot blob

Static file. Reuses the app's brand gradient via `<linearGradient>`. Eyes
are two `<circle>`s, smile is a quadratic `<path>`:

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

**Key design parameters:**

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

Variants (use radial gradients, different palettes, sleepy `~~` eyes
instead of dots, blush ellipses) under `examples/blob_*.svg`.

#### C · 16×16 pixel-art sticker

Static file. SVG `<rect>` elements on an integer grid. The critical
attribute is `shape-rendering="crispEdges"` — without it, browsers
antialias the rectangles into a mushy mess at every zoom level.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <!-- ears -->
  <rect x="3"  y="3" width="2" height="2" fill="#fda4af"/>
  <rect x="11" y="3" width="2" height="2" fill="#fda4af"/>
  <!-- head -->
  <rect x="3" y="5" width="10" height="9" fill="#fff"/>
  <!-- eyes -->
  <rect x="5"  y="8" width="1" height="2" fill="#1f2937"/>
  <rect x="10" y="8" width="1" height="2" fill="#1f2937"/>
  <!-- blush -->
  <rect x="4"  y="10" width="1" height="1" fill="#fda4af"/>
  <rect x="11" y="10" width="1" height="1" fill="#fda4af"/>
  <!-- mouth -->
  <rect x="7" y="10" width="1" height="1" fill="#1f2937"/>
  <rect x="8" y="10" width="1" height="1" fill="#1f2937"/>
</svg>
```

**Authoring approach:** think of it as drawing on graph paper. Each
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

**Margin matters at tab size** — leave ≥2px gap from the viewBox edge so
browsers' tab-bar rounding/clipping doesn't shave the icon. Don't paint
to the edge. See "Margin & tab-bar clipping" in Notes.

#### C-variant · Pixel art on a rounded tile background

Sometimes you want the pixel art to feel like a "sticker" — high-contrast
mascot on a colored rounded square — rather than a free-floating shape on
the browser-tab background. Adds 1 extra `<rect>` (the tile) and a
clearer visual boundary.

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

**Canonical recipe (16×16 viewBox):**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <!-- 14×14 tile with 1-cell OUTER margin on all sides. rx=3 ≈ 21% of tile width. -->
  <rect x="1" y="1" width="14" height="14" rx="3" fill="#121216"/>
  <!-- Mascot drawn on top. Body width up to 12 (cols 2-13). -->
  ...
</svg>
```

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

#### C-variant 2 · Single-color silhouette with cut-out eyes (GitHub-octocat style)

The other end of the spectrum from C-variant 1. Drop the tile entirely
and render the mascot as a single-color silhouette that floats freely
against the tab. Eyes (and any other interior details) become
**cut-outs** — gaps in the body shape that let the tab background show
through. This is the GitHub octocat treatment, and it's the visual
equivalent of "the mascot emerges from the tab."

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <!-- Body in solid color. Split into multiple <rect>s with gaps where -->
  <!-- the eyes (or other cut-outs) should be — the gaps stay transparent. -->
  <rect class="ghost" x="6" y="1" width="4" height="1"/>     <!-- dome top -->
  <rect class="ghost" x="2" y="3" width="12" height="3"/>    <!-- top of body -->
  <rect class="ghost" x="2" y="6" width="3" height="2"/>     <!-- left of eyes -->
  <rect class="ghost" x="6" y="6" width="4" height="2"/>     <!-- between eyes -->
  <rect class="ghost" x="11" y="6" width="3" height="2"/>    <!-- right of eyes -->
  <rect class="ghost" x="2" y="8" width="12" height="5"/>    <!-- bottom of body -->
  ...
</svg>
```

**Eye cut-out technique:** instead of drawing the eye as a darker `<rect>`
on top of the body, *split the body rect* into multiple smaller rects
that flow around the eye position, leaving a gap. The gap = transparent
= the tab background shows through, same as the cat's eyes in
`github.com`'s favicon.

This pattern only works for **single-color** mascots. If your design
needs additional accent colors (e.g. pink cheek blush), those can sit on
top of the body as separately-filled rects — they don't break the
silhouette aesthetic if used sparingly (1-2 accent dots max).

**When to pick C-variant 2 over C-variant 1 (tile background):**

| Pick this | If… |
|---|---|
| C-variant 1 (tile background) | The favicon should feel like a "sticker" with a defined boundary. Brand color demands a colored background. Want maximum control over what surrounds the mascot. |
| C-variant 2 (silhouette + cut-outs) | The favicon should feel like the mascot *emerges from* the tab. Want it to integrate visually with the browser chrome (light or dark). User explicitly references icons like the GitHub octocat. |

**Pairs naturally with the dark-mode CSS-in-SVG pattern below** — a
charcoal silhouette in light mode + a light-grey silhouette in dark
mode reads on both tab themes. See `examples/pixel_ghost_silhouette.svg`.

### Dark-mode adaptation — two files + `<link media>` (Chrome compatible)

For favicons that need to read on both light and dark browser-tab
backgrounds, use **two SVG files** and two `<link rel="icon">` tags,
with a `media="(prefers-color-scheme: dark)"` attribute on the dark
variant:

```html
<link rel="icon" type="image/svg+xml" href="/static/favicon.svg" />
<link rel="icon" type="image/svg+xml" href="/static/favicon-dark.svg"
      media="(prefers-color-scheme: dark)" />
```

Each SVG hardcodes its body fill (no `<style>` block, no `@media`):

```xml
<!-- favicon.svg (light mode default) -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <rect x="2" y="3" width="12" height="3" fill="#24292f"/>
  ...
  <!-- accent rects can have a separate hardcoded fill -->
  <rect x="5" y="9" width="2" height="1" fill="#f4a8b8"/>
</svg>

<!-- favicon-dark.svg (dark mode) — same geometry, light fill -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <rect x="2" y="3" width="12" height="3" fill="#e5e7eb"/>
  ...
  <rect x="5" y="9" width="2" height="1" fill="#f4a8b8"/>
</svg>
```

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

**Caveat — file-level previews can't show both modes simultaneously.**
The `<img src="favicon.svg">` tag inherits the *system* color scheme,
so a preview HTML page on a system in light mode will render the
light-mode variant in *every* `<img>`, regardless of the page's own
background. To preview dark-mode rendering without toggling the system
theme: inline the SVG twice into the preview HTML with hardcoded fills
(one charcoal, one light grey) so each pane shows its variant
correctly. See `examples/pixel_ghost_silhouette.svg` and the
`/tmp/favicon_preview.html` pattern used in field testing.

### Step 3 — wire it in

Save the SVG to your project's static dir (e.g. `static/favicon.svg`) and
add a `<link>` to the page `<head>`:

```html
<link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
```

That's it. **You don't need:**

- A `.ico` fallback (every browser shipped since 2020 supports SVG
  favicons — Chrome 80+, Firefox 41+, Safari 12+, Edge 80+).
- Multiple sizes (`16x16`, `32x32`, `64x64`, ...). SVG is resolution-
  independent; the browser scales the same file.
- An apple-touch-icon (only matters when users save the site to their
  iOS home screen — a different problem from "tab icon").
- A `manifest.json` (PWA territory, also different problem).

For Option A (emoji), put the data URI directly in `href=`. No file
needed; the `<link>` tag itself is the asset.

### Step 3b — REPLACING an existing favicon: cache-bust the `<link>` href

**This is the single most important step when you're *changing* a
favicon that has already shipped — not adding a first one.** It is also
the step most often missed, because it produces the classic false
report: *"I deployed the new icon but the live tab still shows the old
one — Chrome is just being stubborn about its cache."* That's only half
true, and there IS a deterministic fix.

**Why a hard-refresh doesn't fix it.** Browsers cache favicons in a
**separate, extremely sticky cache**, keyed on the icon **URL** — not
on the page. Cmd+Shift+R / Ctrl+F5 reload the *page* but routinely do
**not** evict the favicon. So if you change `favicon.svg`'s *contents*
but leave the `<link rel="icon">` href URL identical
(`/static/favicon.svg`), the browser sees the same URL, assumes the
same icon, and serves the stale one **indefinitely** — for every user
who ever loaded the old one, not just you. Incognito shows the new icon
(proving the *server* is correct) but the normal profile stays stale.

**The fix: change the URL so it becomes a new cache key.** Append a
version query to the href and bump it every time you change the icon:

```html
<!-- first ship -->
<link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
<!-- after you change favicon.svg's contents, bump the version: -->
<link rel="icon" type="image/svg+xml" href="/static/favicon.svg?v=2">
```

- The query string does **not** change what the server returns —
  Flask/Express/nginx static handlers ignore `?v=…` and serve the same
  file. It only changes the *cache key the browser stores it under*.
- Because the URL is new, **every** browser re-fetches on next load —
  including the ones already poisoned with the old icon. No "please
  clear your cache" instructions to users; the fix ships in the HTML.
- In a templating engine, keep `url_for`/asset helpers and append the
  query after: `href="{{ url_for('static', filename='favicon.svg') }}?v=2"`.
- Bump the number (`?v=2` → `?v=3`) on each subsequent change. (A
  content hash works too, but a hand-bumped integer is plenty for a
  favicon.)

**Telling first-add from a replacement:** if the project already has a
`<link rel="icon">` pointing at an asset that exists, you are
*replacing* — add/bump `?v=`. If there's no favicon link at all, you're
adding the first one — no version query needed yet (but adding `?v=1`
now makes the next swap painless).

### Step 4 — verify at real tab size

This is the validation step people skip — and the one where pixel-art
choices break. Always test the favicon at **actual tab size** (~14-16px
wide), not just the enlarged SVG.

**Quick verification:**

1. Open the page in a browser tab.
2. Look at the tab. Cute? Legible? Or muddy/clipped?
3. If muddy: did you forget `shape-rendering="crispEdges"` for pixel art?
4. If clipped: shrink the artwork ~1-2px from each edge of the viewBox.
5. If text is illegible: bump font-weight to 800-900, drop a letter, or
   switch to Technique B/C.

**Iterate-with-preview loop (recommended during authoring, not just at the end).**
For pixel art especially, the design choices that matter (body width,
bump count, eye spacing) only become obvious at real tab size. Don't
author end-to-end then verify — interleave.

Write a tiny `/tmp/favicon_preview.html` that renders the SVG at 16, 32,
64, 128 px stacked vertically:

```html
<!DOCTYPE html><html><body style="background:#0a0a0d;color:#aaa;font:13px system-ui;padding:40px">
  <div><img src="file:///abs/path/to/favicon.svg" width="16"  height="16"  style="image-rendering:pixelated"> 16×16 (real tab size)</div>
  <div><img src="file:///abs/path/to/favicon.svg" width="32"  height="32"  style="image-rendering:pixelated"> 32×32</div>
  <div><img src="file:///abs/path/to/favicon.svg" width="64"  height="64"  style="image-rendering:pixelated"> 64×64</div>
  <div><img src="file:///abs/path/to/favicon.svg" width="128" height="128" style="image-rendering:pixelated"> 128×128 (sketch scale)</div>
</body></html>
```

Then: `open /tmp/favicon_preview.html`. Edit the SVG → it's already
re-rendered on the next reload. `image-rendering:pixelated` matches how
browsers actually render pixel art at the favicon's true 16×16.

This was used in a field-testing session — 5 iterations
(8-wide → 10 → 12 → 16 → **14**) converged with the user in ~10
minutes. Each iteration: write the SVG, refresh the preview, ask
"ship / tweak / different design" via AskUserQuestion.

**Caveat — file preview does NOT catch tab-edge blending.** The
`/tmp/favicon_preview.html` mock above renders the favicon against a
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

**Diagnose: silhouette disappeared into the tab background (v1.4.0).**

A separate failure mode from tab-edge blending (v1.2) and dark-mode
mismatch (v1.3): the mascot has high contrast with the page `<body>`
but disappears into the *tab strip* color, which is often a light grey
or warm-grey distinct from pure white.

Chrome on macOS uses roughly:
- Active tab: `#f0eee9` (warm off-white) or `#ffffff`
- Inactive tab: `#c2c5be` to `#d6d6d3` (grey-sage to warm grey)
- Dark mode active tab: `#202124`
- Dark mode inactive tab: `#2f3033`

A pure-white mascot body (`#ffffff`) reads great on `#0a0a0d` mock
backgrounds and on dark-mode active tabs but **completely vanishes**
on a light-mode inactive tab — only the colored accents (ears, blush)
remain visible, plus the eye dots floating in apparent nothingness.

The `prefers-color-scheme` recipe in the Dark-mode section does NOT
fix this: Chrome is technically in *light* mode while displaying the
grey-sage inactive tab, so the CSS-in-SVG light-mode variant fires —
which is the white body that disappears.

**When the user reports "I can see the ears and eyes but no body"
or shares a screenshot with most of the mascot invisible:**

1. **Sample the actual tab background color** from the user's
   screenshot (a color picker on the part of the tab around the
   favicon). Plug it into your `/tmp/favicon_preview.html` mock as
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
| **R4** | **Add `prefers-color-scheme` CSS-in-SVG** | Use the v1.3 dark-mode pattern with a charcoal body in light mode + light body in dark mode | Only fixes the dark-mode case, NOT the grey-light-tab case (see above). Combine with R1 or R3, don't substitute. |

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
edit shipped the fix.

## Verification

After wiring up:

- [ ] `curl /static/favicon.svg` (or whatever path) returns 200 + the SVG
- [ ] Page HTML contains `<link rel="icon" type="image/svg+xml" href="..."`
- [ ] **If replacing an existing favicon:** the href carries a bumped
      `?v=N` query (Step 3b) — without it, returning users keep the old
      cached icon even after deploy, and a hard-refresh won't fix it
- [ ] Browser tab shows the new favicon (force-refresh with Cmd+Shift+R
      on Mac; Chrome aggressively caches favicons — if it stays stale
      after a replace, you forgot the `?v=` bump)
- [ ] At 1× zoom the icon is legible/recognizable (the tab-size test)
- [ ] At 2× zoom (retina) the icon is crisp, not blurry

If the icon looks crisp on retina but blurry at 1× and you're using
pixel art: you forgot `shape-rendering="crispEdges"`. Add it; refresh.

## Example

User says: "the browser tab is empty, can we put a cute logo on it?"

1. Show options A/B/C/D with rendered previews (use AskUserQuestion's
   `preview` field or a tab-strip mock HTML file).
2. User picks "Option C: mochi-cat" (or whichever).
3. Write `static/favicon.svg` with the 10-rect pixel art.
4. Add `<link rel="icon" type="image/svg+xml" href="/static/favicon.svg">`
   to the page template.
5. Deploy / serve.
6. User force-refreshes the tab. Cute kitty appears. Done.

Total: ~10 minutes including option preview + render verification.

## Notes

### Margin & tab-bar clipping

There are two regimes — pick the one that matches your icon:

**1. Transparent-background pixel art** (the standard examples — mochi-
cat, dango, frog, the simpler pixel_ghost). The shape floats on the
browser-tab background, and browser tab-bars crop the favicon slightly
— usually 1-2px of edge gets shaved by the tab's rounded corners or
hover overlay.

- **Rule:** leave ≥2px of empty space from each edge of the viewBox in a
  16×16 grid. The "safe" inner box is 12×12 centered.
- Don't paint to the edge.

**2. Tiled-background "sticker" pixel art** (see Technique C-variant and
`examples/pixel_ghost_tile.svg`). Here there are *two* margins — see
the "two-margin rule" in Technique C-variant. Both regimes apply:
the browser tab still crops *something*, but what it crops is now the
tile, not the mascot.

- **Outer margin (tile-to-viewBox):** 1 cell on all sides — tile lives
  at `(x=1, y=1, w=14, h=14, rx=3)` inside a 16×16 viewBox. Skip this
  margin and the tile blends with the tab chrome at live render.
- **Inner padding (mascot-to-tile):** mascot body ≤ 12 cells wide
  (cols 2-13). Lets the rounded tile breathe; gives the mascot a
  visible border of tile color on the left/right of each body row.
- **The two are non-substitutable:** more inner padding doesn't fix
  the outer-margin blending bug — they protect against different
  failure modes.
- Empirical sweet spot, validated against live Chrome tab render:
  14×14 inset tile + 12-wide mascot body. Earlier iterations (8 → 10
  → 12 → 16 flush → 14 flush) all looked plausible in file previews
  but the flush variants blended at live tab size. See the v1.2
  changelog and `examples/pixel_ghost_tile.svg` for the corrected
  recipe.

### Browser support (modern web)

- **Chrome / Edge 80+, Firefox 41+, Safari 12+**: native SVG favicon
  support. No fallback needed.
- **Old Safari (≤11), IE11**: no SVG favicon support. If you need these,
  serve a fallback `.ico` alongside:
  ```html
  <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
  <link rel="icon" type="image/png" href="/static/favicon.png" sizes="32x32">
  ```
  But — most internal tools, modern SaaS, and dev tooling drop IE11
  support entirely. Don't add a fallback unless you have concrete users
  on those browsers.

### Common gotchas

- **Browser caches favicons aggressively — and a hard-refresh often
  does NOT evict them.** The favicon cache is separate from the page
  cache and keyed on the icon URL. For a *first* add, Cmd+Shift+R (Mac)
  / Ctrl+F5 (Win/Linux) or incognito is usually enough. But when you've
  *changed* an already-shipped favicon and the live tab still shows the
  old one, don't conclude "Chrome is just stubborn" — the real fix is to
  **bump a `?v=N` query on the `<link rel="icon">` href** so the URL
  becomes a new cache key. See **Step 3b** above. This ships the fix to
  all users in the HTML instead of asking each one to clear their cache.
- **`<text>` inside SVG favicons uses the system font, not your
  webfonts.** Webfonts load after the favicon does. Pick a font-family
  that resolves immediately: `-apple-system, system-ui, sans-serif`.
- **Emojis render as the OS's emoji font.** Mac's 🦊 looks different
  from Windows's 🦊 looks different from Linux's. If consistency matters
  more than effort, use Technique B/C/D instead.
- **`width=` and `height=` on the SVG root are optional** when `viewBox`
  is set — the browser scales the icon to the tab's native size (14-32px
  depending on browser/OS/zoom). Don't hardcode.
- **Dark-mode tab bars don't auto-invert favicons.** If your app supports
  dark mode and the favicon has thin strokes that disappear on a dark tab
  bar, use a CSS media query:
  ```html
  <link rel="icon" href="/favicon-light.svg" media="(prefers-color-scheme: light)">
  <link rel="icon" href="/favicon-dark.svg" media="(prefers-color-scheme: dark)">
  ```
  But this is overkill for cute mascot work — pick colors that read on
  both backgrounds (white/cream fills work for both).

### Open extensions (planned v1.5+)

- Apple-touch-icon variant (for "save to home screen" iOS)
- Animated SVG favicon (smiles when page is loading, etc. — Chrome
  rejects most SMIL animation in favicons; CSS animation works in some
  contexts)

### Changelog

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

## Examples directory

The `examples/` folder ships starter SVGs you can copy and edit:

**Gradient blobs (Option B — 22 emotion variants):**

- `blob_brand_grad.svg` — happy, sunset gradient
- `blob_mint.svg` — wink, mint→cyan
- `blob_heart_eyes.svg` — in love
- `blob_smug.svg` — smug / smirk
- `blob_surprise.svg` — gasping (O mouth)
- `blob_starry.svg` — amazed / starry-eyed
- `blob_kissy.svg` — kissy + blush
- `blob_wide_eye.svg` — anime / big-eyed
- `blob_sleepy.svg` — closed-arc sleepy
- `blob_woah.svg` — raised brows + O mouth
- `blob_cheer.svg` — arms-up Y + sparkles
- `blob_love_rays.svg` — radiating heart (no face)
- `blob_sparkles.svg` — closed-eye smile + sparkles around
- `blob_giggle.svg` — open laugh + cheek blush
- `blob_blush.svg` — quiet shy + big cheek blush
- `blob_dreamy.svg` — half-closed eyes + floating stars
- `blob_proud.svg` — closed-eye smile + sparkle accent
- `blob_party.svg` — tongue out + confetti
- `blob_cozy.svg` — sleepy + steam wisps
- `blob_wave.svg` — waving arm raised
- `blob_bubble_heart.svg` — speech-bubble outline + heart
- `blob_thinking.svg` — raised brow + thought-bubble

**Pixel-art mascots (Option C — 56 starter mascots):**

*Animals (24):* `pixel_mochi_cat`, `pixel_bunny`, `pixel_bear`, `pixel_chick`,
`pixel_bee`, `pixel_frog`, `pixel_sheep`, `pixel_cat_love`, `pixel_shy_cat`,
`pixel_panda`, `pixel_penguin`, `pixel_fox`, `pixel_owl`, `pixel_pig`,
`pixel_duckling`, `pixel_cow`, `pixel_puppy`, `pixel_seal`, `pixel_otter`,
`pixel_hedgehog`, `pixel_axolotl`, `pixel_capybara`, `pixel_corgi`,
`pixel_quokka`.

*Sweets & food (12):* `pixel_strawberry`, `pixel_dango`, `pixel_donut`,
`pixel_cupcake`, `pixel_ice_cream`, `pixel_boba`, `pixel_macaron`,
`pixel_pancakes`, `pixel_onigiri`, `pixel_sushi`, `pixel_taiyaki`,
`pixel_pudding`.

*Nature & objects (11):* `pixel_cloud`, `pixel_mushroom`, `pixel_rainbow`,
`pixel_star_face`, `pixel_moon`, `pixel_sun`, `pixel_flower`, `pixel_cactus`,
`pixel_tea_cup`, `pixel_planet`, `pixel_acorn`.

*Ghosts (4):* `pixel_ghost`, `pixel_ghost_tile` (C-variant 1, dark tile),
`pixel_ghost_silhouette` (C-variant 2, single-color cut-out),
`pixel_ghost_silhouette_dark` (dark-mode pair).

*Silhouettes (5):* `pixel_cat_silhouette`, `pixel_bunny_silhouette`,
`pixel_heart_silhouette`, `pixel_star_silhouette`, `pixel_cloud_silhouette`.

Copy + rename + edit the colors and grid positions. They're 13-25 lines
each. See `README.md` for inline preview thumbnails of all 78.

## See also

- `frontend-design` — broader frontend / UI design guidance
- `claude-design-handoff-bundle` — when the favicon comes from a Claude
  Design handoff (different problem: implementing a designer's specific
  mark, not authoring a cute one from scratch)

## References

- [MDN: SVG favicons](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/link)
- [Can I Use: SVG favicons](https://caniuse.com/link-icon-svg) — 96%+
  global support as of 2026
- [shape-rendering=crispEdges](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/shape-rendering)
- [SVG `<text>` and font-family timing](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/text)
