---
name: sparkle-that-page
description: Use when a user wants to add cute, playful runtime effects to a web page — a fairy-wand or magic custom cursor (star / heart / moon / pixel / sailor-moon), a sparkle / star / heart / fairy-dust trail following the mouse on move and click, an animated floating scroll-depth / scroll-progress indicator (ring, comet bar, or climbing mascot), tab-title peekaboo ("come back!" when the tab loses focus), click confetti or heart burst, ambient floating petals / leaves / snowflakes / bubbles / fairy-dust, and cute-chrome touches (pastel ::selection, wobble hover, kawaii loading spinner, pastel scrollbar). Pick a color palette (candy / neon / meadow) and a pixel-art style variant on each. Skip for serious / corporate UIs, or when the user wants a full design system or a heavyweight particle framework.
---

# Sparkle That Page ✨

Make the whole browser page delightful — not just the favicon (that's the
sibling skill `cutify-that-tab`). Seven self-contained, **zero-dependency**
effects you paste in: a fairy-wand cursor, a sparkle trail, an animated scroll
indicator, tab-title peekaboo, click confetti, ambient floaters, and
cute-chrome touches. Each is one short vanilla file — copy, drop in, tweak a
`data-*` attribute. No npm, no build, no framework.

## Problem

A web app feels flat. The user wants personality — magic on the cursor,
sparkle on a click, a little mascot that climbs as you scroll — without
pulling in a particle framework, a build step, or a pile of dependencies.
They want to point at an effect and have it *just work*, and to be able to
hand-edit it afterward.

## Context / Trigger conditions

Use when **any** of:

- User asks for a "cute cursor / fairy cursor / magic wand cursor / sparkle
  cursor", "sparkles when I move/click the mouse", "cursor trail".
- "scroll progress bar / scroll indicator / reading progress / a thing that
  fills as you scroll".
- "confetti / heart burst on click", "celebrate when they click".
- "floating petals / snow / bubbles / leaves / fairy dust in the background".
- "make the tab say something when you leave", "come back message".
- "cute selection color / bouncy buttons / kawaii spinner".
- General: "make this page cuter / more playful / more alive / add some magic."

**Skip** if: the user wants a serious/corporate UI, a full design system, or a
heavyweight, highly-configurable particle engine (point them at the libraries
in **Prior art** instead). Also skip motion-heavy effects for users who've
asked for a calm/minimal experience — though every effect here already
self-disables under `prefers-reduced-motion`.

## Solution — pick the effect(s), copy the file, wire it in

Every effect ships as one file in `examples/`. Wire JS with a `<script>` and
CSS with a `<link>`, then set options via `data-*` attributes on `<html>`:

```html
<!-- one line per effect you want -->
<script src="/static/fairy_cursor.js"></script>
<script src="/static/sparkle_trail.js"></script>
<link rel="stylesheet" href="/static/cute_chrome.css">
<!-- options live on the html tag -->
<html data-wand="sailormoon" data-trail="fairydust" data-palette="candy">
```

### Color palette (shared across the particle effects)

Set `data-palette` on `<html>` (default `candy`). It tints the **sparkle
trail**, **click confetti**, and **ambient floaters** (the `dust` / `fairydust`
variants), and turns on a soft glow for `neon`:

| `data-palette` | Colors | Vibe |
|---|---|---|
| `candy` | pink / purple / gold | kawaii (default, matches the cutify brand) |
| `neon` | cyan / lime / magenta / amber + **glow** | "mission control" |
| `meadow` | rose / indigo / teal / lavender / peach | soft, earthy, warm |

### 1 · Fairy-wand cursor — `fairy_cursor.js`

Replaces the cursor with a wand SVG via `cursor: url(...) hotspot, auto`.

- `data-wand`: `star` (default) · `heart` · `moon` · `pixel` · `sailormoon`
  (gold crescent + pink heart gem).
- **Gotcha — hotspot & size.** The hotspot (`26 5` in the file = the wand
  tip) must sit *inside* the image, and browsers cap custom cursors around
  128px. The 32×32 SVG is safe.
- No-op on touch / coarse pointers (keeps the native cursor). Static image, so
  reduced-motion is unaffected.

### 2 · Sparkle trail — `sparkle_trail.js`

A `pointer-events:none` overlay. Particles spawn on `mousemove` (rAF-throttled)
and burst on `click`; recycled fixed pool (cap 80).

- `data-trail`: `sparkle` (default) · `star` · `heart` · `pixel` · `fairydust`
  (small glowing dots). Colors come from `data-palette` (multi-color per particle).
- No-op on touch and on reduced-motion.

### 3 · Scroll-depth indicator — `scroll_indicator.js`

Fixed floating element driven by `scrollTop / (scrollHeight − innerHeight)`,
`passive` listener + rAF.

- `data-scroll`: `ring` (default — filling % ring, bottom-right, with an idle
  bob) · `comet` (top progress bar with a sparkle head) · `mascot` (a pixel
  face that climbs a rail on the right).
- Reduced-motion disables the idle bob; the indicator still tracks position.

### 4 · Tab-title peekaboo — `tab_title_peekaboo.js`

On `visibilitychange`, swaps `document.title` (and optionally the favicon) to a
cute message, then restores on return. The one effect that ties back to
`cutify-that-tab` — the away-favicon is an emoji-in-SVG, the same trick.

- `data-peekaboo-msg` (default `come back! 🥺`), `data-peekaboo-favicon` (an
  emoji; **omit** to leave the favicon alone).
- **Gotcha — taste.** Title-hijacking annoys some users; keep the message
  gentle and consider not also swapping the favicon. Restores cleanly on focus.

### 5 · Click confetti / heart burst — `click_confetti.js`

A `<canvas>` overlay; a radial physics burst (velocity + gravity) on click.

- `data-confetti`: `heart` (default) · `star` · `confetti` · `petal` · `pixel`.
- `data-confetti-on` (optional CSS selector, e.g. `[data-confetti]`) limits
  bursts to matching elements; omit for any-click. `data-palette` recolors it
  (and `neon` adds glow).
- No-op on reduced-motion. Exposes `SparkleThatPage.clickConfetti.burst(x, y)`
  to fire programmatically.

### 6 · Ambient floaters — `ambient_floaters.js`

A slow `position:fixed; pointer-events:none` layer **behind** content.

- `data-floaters`: `sakura` (default) · `leaves` · `snowflake` · `bubbles`
  (shiny gradient circles) · `dust` · `fairydust` (glowing). `data-floaters-count`
  (default 18, capped 60). `dust`/`fairydust` take `data-palette` colors.
- No-op on reduced-motion.

### 7 · Cute-chrome touches — `cute_chrome.css`

Drop-in CSS, mostly global:

- Pastel `::selection`.
- `.stp-wobble` — add to buttons/links for a playful hover wobble.
- `.stp-spinner` — `<span class="stp-spinner"></span>` is a kawaii 3-dot loader.
- Pastel custom scrollbar (WebKit/Blink + Firefox `scrollbar-color`).
- All motion is wrapped in `@media (prefers-reduced-motion: no-preference)`.

## Global constraints (baked into every effect — keep them)

- **`prefers-reduced-motion: reduce` disables/reduces every motion effect**
  (JS-guarded via `matchMedia` + CSS `@media`).
- All overlays are **`pointer-events: none`** — effects never block clicks,
  selection, or scrolling.
- Pointer-following effects (cursor, trail) **no-op on touch / coarse pointers**
  (`matchMedia('(pointer: fine)')`).
- Particle pools are **capped**, animation is **rAF-driven**, listeners are
  `passive`, and only `transform`/`opacity` are animated.
- Each JS effect registers a **teardown** on a shared registry:
  `window.SparkleThatPage.<name>.destroy()` (for SPA route changes). Keys:
  `fairyCursor`, `sparkleTrail`, `scrollIndicator`, `tabPeekaboo`,
  `clickConfetti`, `ambientFloaters`.
- **z-index map:** ambient floaters `0` (behind content); scroll indicator
  `2147483601`; trail `2147483600`; confetti `2147483602`.

## Verify — at real interaction, in a real browser

Like the favicon skill's "file previews lie" rule, but harder: a `cursor:url()`
and rAF sparkle trails are nearly invisible to DOM snapshots. Open
`examples/demo.html` (it composes all seven with toggles, palette selector, and
variant dropdowns — it's both the showcase and the verify tool) and check:

- [ ] Each effect turns on/off; variants and palettes switch live.
- [ ] Clicks and scrolling are **not** blocked anywhere (overlays are
      `pointer-events:none`).
- [ ] `prefers-reduced-motion: reduce` → trail / confetti / floaters suppress;
      the scroll indicator still tracks.
- [ ] No console errors.
- [ ] **Eyeball it.** Programmatic checks can't prove "cute" — look at the
      cursor, the trail, a confetti burst, the floaters.

**Gotcha — local cache during iteration.** `demo.html` re-injects effect
scripts with a `?v=<n>` counter that resets each page load. If you reload after
editing a file, the browser can serve the *stale* cached script/page (same URL)
and you'll "verify" the old version. When iterating locally, serve from a fresh
port each time (`python3 -m http.server <new-port>`) or hard-reload bypassing
cache. In production this is a non-issue — the files don't change between loads.

## Examples directory

`examples/` ships eight files — seven effects + the live demo:

| File | Effect | Key `data-*` |
|---|---|---|
| `fairy_cursor.js` | wand cursor | `data-wand` (star/heart/moon/pixel/sailormoon) |
| `sparkle_trail.js` | mouse trail | `data-trail` (sparkle/star/heart/pixel/fairydust), `data-palette` |
| `scroll_indicator.js` | scroll depth | `data-scroll` (ring/comet/mascot) |
| `tab_title_peekaboo.js` | tab blur message | `data-peekaboo-msg`, `data-peekaboo-favicon` |
| `click_confetti.js` | click burst | `data-confetti` (heart/star/confetti/petal/pixel), `data-confetti-on`, `data-palette` |
| `ambient_floaters.js` | background layer | `data-floaters` (sakura/leaves/snowflake/bubbles/dust/fairydust), `data-floaters-count`, `data-palette` |
| `cute_chrome.css` | selection/wobble/spinner/scrollbar | `.stp-wobble`, `.stp-spinner` classes |
| `demo.html` | live showcase + verify tool | — |

## Prior art / see also

This skill deliberately stays **hand-authored and dependency-free** so Claude
can author + wire the effects (and pixel-art variants) for you with no npm/build.
If you instead want a heavier, off-the-shelf option, these are the mature
libraries in this space — worth knowing and crediting:

- **[tholman/cursor-effects](https://github.com/tholman/cursor-effects)** — the
  canonical "90s cursor effects" revival (fairy dust, snowflake, bubble,
  rainbow, emoji, trailing cursors). MIT, vanilla, zero-dep. The effect
  *vocabulary* here (fairy dust / snowflake / bubble) follows its naming.
- **[party.js](https://party.js.org/)** — confetti + sparkle particle templates.
- **[canvas-confetti](https://github.com/catdad/canvas-confetti)** — the popular one-call confetti.
- **[tsParticles](https://github.com/tsparticles/tsparticles)** — full,
  framework-agnostic particle engine (snow, bubbles, confetti, fireworks).

Internal inspiration: the `neon` palette + glowing fairy-dust come from
**token-torch** ("neon mission control"); the `meadow` palette comes from a
colleague's **Common Ground** team warm-up.

Sibling skill: **`cutify-that-tab`** — the cute favicon half of the
`cutify-this` bundle. Broader UI guidance: **`frontend-design`**.

## Changelog

- **v1.0.0** (2026-06-17) — Initial skill: 7 zero-dependency page effects
  (fairy-wand cursor, sparkle trail, scroll-depth indicator, tab-title
  peekaboo, click confetti, ambient floaters, cute-chrome touches), each with
  variants incl. pixel-art; a `candy`/`neon`/`meadow` palette system; a live
  `demo.html`; and a baked-in `prefers-reduced-motion` / touch-no-op / teardown
  accessibility contract.
