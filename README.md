# cutify-this ✨

> A little **bundle of cute web skills** for Claude Code. Cutify the browser **tab** (hand-authored SVG favicons), sparkle up the whole **page** (fairy cursor, sparkle trails, scroll progress, confetti, floaters), and pop your repo's **README** (a cute house-style front page).

[![license](https://img.shields.io/github/license/wan-huiyan/cutify-this)](LICENSE)
[![last commit](https://img.shields.io/github/last-commit/wan-huiyan/cutify-this)](https://github.com/wan-huiyan/cutify-this/commits)
[![Claude Code](https://img.shields.io/badge/Claude_Code-skills-orange)](https://claude.com/claude-code)

## Three skills in the bundle

| Skill | What it does | Install |
|---|---|---|
| 🎀 **cutify-that-tab** | cute hand-authored SVG favicons — emoji / gradient blob / pixel-art mascot (78 starters) | `/plugin install cutify-that-tab@wan-huiyan-cutify-this` |
| ✨ **sparkle-that-page** | cute zero-dep page effects — fairy cursor, sparkle trail, scroll indicator, tab peekaboo, confetti, floaters, cute-chrome | `/plugin install sparkle-that-page@wan-huiyan-cutify-this` |
| 🪄 **pop-that-readme** | a cute, high-signal README in the house style — pixel hero, badges, value-prop, emoji feature table, install block, honesty box | `/plugin install pop-that-readme@wan-huiyan-cutify-this` |

Add the marketplace once, then install any (or all):

```bash
/plugin marketplace add wan-huiyan/cutify-this
```

> Renamed from `cutify-that-tab` → `cutify-this` (the repo now hosts three skills). Old links redirect automatically.

---

## ✨ sparkle-that-page — cute page effects

**▶ Live demo: https://wan-huiyan.github.io/cutify-this/**

Seven self-contained, **zero-dependency** effects — one short vanilla file each, copy-and-edit, no npm/build. Wire with `<script>` / `<link>`, then set options on `<html data-*>`:

| Effect | File | Options (`data-*`) |
|---|---|---|
| 🪄 Fairy-wand cursor | `fairy_cursor.js` | `data-wand` = star · heart · moon · pixel · **sailormoon** |
| ✨ Sparkle trail | `sparkle_trail.js` | `data-trail` = sparkle · star · heart · pixel · **fairydust** |
| 📜 Scroll-depth indicator | `scroll_indicator.js` | `data-scroll` = ring · comet · mascot |
| 👀 Tab-title peekaboo | `tab_title_peekaboo.js` | `data-peekaboo-msg`, `data-peekaboo-favicon` |
| 🎉 Click confetti | `click_confetti.js` | `data-confetti` = heart · star · confetti · petal · pixel |
| 🌸 Ambient floaters | `ambient_floaters.js` | `data-floaters` = sakura · leaves · snowflake · bubbles · dust · fairydust |
| 🎀 Cute-chrome touches | `cute_chrome.css` | `.stp-wobble`, `.stp-spinner`, pastel `::selection` + scrollbar |

**Color palette** across the particle effects: `<html data-palette="candy">` — **candy** (default), **neon** (glow), **meadow**.

Every motion effect respects `prefers-reduced-motion`, overlays never block clicks, pointer effects no-op on touch, and each exposes `SparkleThatPage.<name>.destroy()` for SPA cleanup. The bundled `examples/demo.html` (the live demo above) toggles all seven and doubles as the verify tool.

**Prior art** — heavier off-the-shelf options if you'd rather not hand-author: [tholman/cursor-effects](https://github.com/tholman/cursor-effects) (the classic fairy-dust / snowflake / bubble cursors), [party.js](https://party.js.org/), [canvas-confetti](https://github.com/catdad/canvas-confetti), [tsParticles](https://github.com/tsparticles/tsparticles). This bundle stays hand-authored & dependency-free so Claude can author + wire it (and pixel-art variants) for you.

---

## 🪄 pop-that-readme — a README that pops

The skill behind *this* README. It gives Claude the recipe + a fill-in template to author a cute, high-signal repo front page in the house style:

- **An 11-section recipe** (hero → badges → bold value-prop → captioned demo → why-it-exists → emoji feature table → install block → usage → contributors → honesty box → footer) — front-load value, stay scannable.
- **Baked-in hero recipes** — an ASCII box hero (works anywhere) + a copy-paste pixel-SVG hero (`shape-rendering="crispEdges"`); hand off to `pixel-art` / `css-animated-svg-scenes` for animated banners.
- **Voice rules** — value prop = one bold sentence; every claim earns a number; emoji as wayfinding; an honesty section as a feature.
- **A fill-in template** (`examples/README.template.md`) + a pre-ship **quality checklist**.

---

## 🎀 cutify-that-tab — cute SVG favicons

> A Claude Code skill for adding a cute, hand-authored SVG favicon to a web app — that tiny icon in the browser tab.

<p align="center">
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_mochi_cat.svg" width="64" height="64" alt="mochi cat" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_bunny.svg" width="64" height="64" alt="bunny" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_bear.svg" width="64" height="64" alt="bear" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_chick.svg" width="64" height="64" alt="chick" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_bee.svg" width="64" height="64" alt="bee" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_strawberry.svg" width="64" height="64" alt="strawberry" style="image-rendering:pixelated"/>
  <br/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_ghost.svg" width="64" height="64" alt="ghost" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_ghost_tile.svg" width="64" height="64" alt="ghost tile" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_ghost_silhouette.svg" width="64" height="64" alt="ghost silhouette" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cloud.svg" width="64" height="64" alt="cloud" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_dango.svg" width="64" height="64" alt="dango" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_frog.svg" width="64" height="64" alt="frog" style="image-rendering:pixelated"/>
  <br/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_brand_grad.svg" width="64" height="64" alt="happy blob"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_mint.svg" width="64" height="64" alt="wink blob"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_heart_eyes.svg" width="64" height="64" alt="heart-eyes blob"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_smug.svg" width="64" height="64" alt="smug blob"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_surprise.svg" width="64" height="64" alt="surprise blob"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_starry.svg" width="64" height="64" alt="starry-eyed blob"/>
  <br/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_kissy.svg" width="64" height="64" alt="kissy blob"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_wide_eye.svg" width="64" height="64" alt="anime blob"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_sleepy.svg" width="64" height="64" alt="sleepy blob"/>
</p>

## Why this exists

Most online "favicon generators" produce a 12-file pack (`favicon.ico`, `apple-touch-icon` variants, `manifest.json`, ...) for a problem that needs **one SVG file**. Modern browsers have supported `<link rel="icon" type="image/svg+xml">` since 2020 — 96%+ global support today.

This skill gives Claude Code the recipes to author cute, hand-coded favicons in a single SVG, plus the verification loop to make sure they actually read at real tab size (~14–16px).

## Quick Start

```
You: my app's browser tab is just a blank square. can you put something cute in there?

Claude: [reads skill] I'll add an SVG favicon. Three quick questions:
  - what vibe — emoji, gradient blob mascot, or 16×16 pixel-art mascot?
  - what color palette?
  - which animal / character if pixel art (bunny, bear, ghost, mochi cat, ...)?

You: pixel-art mochi cat, pink palette

Claude: [writes static/favicon.svg, wires up <link>, opens /tmp/favicon_preview.html
        showing 16/32/64/128 px stacked, iterates with you until shipped]
```

## The three techniques

| Technique | Effort | Vibe | When to pick |
|---|---|---|---|
| **A · Emoji as favicon** | ~30 sec | 🐱 minimum-viable | "Just put SOMETHING there" — works with any emoji |
| **B · Gradient mascot blob** | ~5 min | soft, friendly, brand-ish | Marketing site, indie SaaS, "personality not pixels" |
| **C · 16×16 pixel-art sticker** | ~10 min | kawaii, retro, dev-tool charm | Internal dashboard, dev tool, "we have taste" |

All three ship as a single SVG file. No `.ico`, no PNG fallbacks, no PWA manifest, no apple-touch-icon variants — those are different problems.

## What you get

- **`<link rel="icon" type="image/svg+xml">` recipe** — the modern one-liner
- **78 starter SVGs** in `examples/` — 56 pixel-art mascots (animals, sweets, nature, ghosts, silhouettes) and 22 emotion-variant gradient blobs. Copy + rename + edit colors
- **Live verification loop** — `/tmp/favicon_preview.html` rendering the favicon at 16/32/64/128 px so you iterate against real tab size, not the enlarged SVG
- **Tab-edge / tab-background diagnosis** — three distinct failure modes (chrome blending, dark-mode mismatch, light-tab silhouette vanish) with decision trees for each
- **Dark-mode-aware favicons** — the two-file `<link media>` recipe that works in Chrome 92+, Firefox, and Safari (single-file CSS-in-SVG `@media` is ignored by Chrome for favicons — this is documented in the skill)
- **Cache-bust recipe for *replacing* a favicon** — when you change an already-shipped icon and the live tab stubbornly shows the old one, the fix isn't "tell users to clear their cache." Bump a `?v=N` query on the `<link rel="icon">` href so the new URL re-fetches for everyone (Step 3b)

## Installation

**Claude Code (plugin install — recommended):**
```bash
/plugin marketplace add wan-huiyan/cutify-this
/plugin install cutify-that-tab@wan-huiyan-cutify-this
```

**Claude Code (git clone — always works):**
```bash
git clone https://github.com/wan-huiyan/cutify-this.git ~/.claude/skills/cutify-that-tab
```

**Cursor:**
```bash
# Per-project rule (most reliable)
mkdir -p .cursor/rules
# Copy SKILL.md content into .cursor/rules/cutify-that-tab.mdc with alwaysApply: true

# Or global
git clone https://github.com/wan-huiyan/cutify-this.git ~/.cursor/skills/cutify-that-tab
```

## Three failure modes the skill catches

The skill documents three distinct ways favicons silently break at real tab size — failures that file-level previews (`<img src=favicon.svg>` against a flat dark `<body>`) don't expose. Each has a different fix:

| # | Failure | Looks fine in | Breaks in | Fix |
|---|---|---|---|---|
| 1 | **Tab-edge blending** | File preview against dark `<body>` | Chrome's rounded tab chrome | 14×14 inset tile, 1-cell outer margin (the "two-margin rule") |
| 2 | **Dark-mode mismatch** | Single system theme | System theme switch | Two-file `<link media="(prefers-color-scheme: dark)">` recipe |
| 3 | **Light-tab silhouette vanish** | Dark mocks + dark-mode tabs | Light-mode inactive tab (Chrome's grey-sage `#c2c5be`) | Tint body to Tailwind `*-300` tier, or add tile, or add outline |

Failure #3 is the subtle one: `prefers-color-scheme` does NOT fix it — Chrome is technically in light mode while showing the grey-sage inactive tab, so the light-mode variant fires, which is the white body that disappears.

## Replacing a favicon? Cache-bust the link

A *fourth* failure mode, and the one most often mis-diagnosed as "Chrome is just stubborn about its cache": you deploy a new favicon, the server serves it correctly, but every browser tab keeps showing the **old** icon — even after a hard-refresh.

Favicons live in a **separate cache keyed on the icon URL**, not on the page. If you changed `favicon.svg`'s contents but left the `<link rel="icon">` href URL unchanged, the browser sees the same URL and serves the stale icon indefinitely, for every returning user. Incognito shows the new one (proving the server is right) but the normal profile stays stale.

**Fix — one line, ships to all users:** bump a version query on the href.

```html
<!-- before --> <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
<!-- after  --> <link rel="icon" type="image/svg+xml" href="/static/favicon.svg?v=2">
```

The query doesn't change what static servers return — it only changes the cache key, forcing a fresh fetch for *every* browser (including already-poisoned ones). Bump the integer on each subsequent swap. See **Step 3b** in the skill.

## Examples directory

The 78 starter SVGs in `examples/` — each is 13–25 lines, hand-authorable, copy-and-edit. Organized by family below.

### Pixel-art mascots (Technique C)

#### Animals — 24 mascots

| Preview | File | Vibe |
|---|---|---|
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_mochi_cat.svg" width="56" alt="mochi cat"> | `pixel_mochi_cat.svg` | classic pink mochi cat |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_bunny.svg" width="56" alt="bunny"> | `pixel_bunny.svg` | peach bunny with pink ears |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_bear.svg" width="56" alt="bear"> | `pixel_bear.svg` | brown bear with cream snout |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_chick.svg" width="56" alt="chick"> | `pixel_chick.svg` | yellow chick with orange beak + feet |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_bee.svg" width="56" alt="bee"> | `pixel_bee.svg` | striped bee with sky-blue wings |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_frog.svg" width="56" alt="frog"> | `pixel_frog.svg` | green frog face |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_sheep.svg" width="56" alt="sheep"> | `pixel_sheep.svg` | fluffy sheep with grey face |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cat_love.svg" width="56" alt="cat with heart"> | `pixel_cat_love.svg` | grey cat with a floating heart |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_shy_cat.svg" width="56" alt="shy cat"> | `pixel_shy_cat.svg` | lavender cat with big blush |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_panda.svg" width="56" alt="panda"> | `pixel_panda.svg` | black-and-white panda with patch eyes |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_penguin.svg" width="56" alt="penguin"> | `pixel_penguin.svg` | black penguin with white belly + orange beak |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_fox.svg" width="56" alt="fox"> | `pixel_fox.svg` | orange fox with cream snout |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_owl.svg" width="56" alt="owl"> | `pixel_owl.svg` | amber owl with big round eyes |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_pig.svg" width="56" alt="pig"> | `pixel_pig.svg` | pink pig with snout |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_duckling.svg" width="56" alt="duckling"> | `pixel_duckling.svg` | yellow duckling with orange bill |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cow.svg" width="56" alt="cow"> | `pixel_cow.svg` | white cow with black spots + pink muzzle |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_puppy.svg" width="56" alt="puppy"> | `pixel_puppy.svg` | cream puppy with floppy ears + tongue out |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_seal.svg" width="56" alt="seal"> | `pixel_seal.svg` | grey seal with whisker dots |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_otter.svg" width="56" alt="otter"> | `pixel_otter.svg` | brown otter with cream face |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_hedgehog.svg" width="56" alt="hedgehog"> | `pixel_hedgehog.svg` | spiky brown hedgehog in profile |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_axolotl.svg" width="56" alt="axolotl"> | `pixel_axolotl.svg` | pink axolotl with frilly gills |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_capybara.svg" width="56" alt="capybara"> | `pixel_capybara.svg` | calm brown capybara with sleepy eyes |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_corgi.svg" width="56" alt="corgi"> | `pixel_corgi.svg` | orange corgi with cream snout + tongue |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_quokka.svg" width="56" alt="quokka"> | `pixel_quokka.svg` | brown quokka with a famous big smile |

#### Sweets & food — 11 mascots

| Preview | File | Vibe |
|---|---|---|
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_strawberry.svg" width="56" alt="strawberry"> | `pixel_strawberry.svg` | red strawberry with seeds and a face |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_dango.svg" width="56" alt="dango"> | `pixel_dango.svg` | dango skewer (three pastel mochi balls) |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_donut.svg" width="56" alt="donut"> | `pixel_donut.svg` | pink-frosted donut with sprinkles |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cupcake.svg" width="56" alt="cupcake"> | `pixel_cupcake.svg` | cupcake with pink frosting + cherry |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_ice_cream.svg" width="56" alt="ice cream"> | `pixel_ice_cream.svg` | mint scoop on a waffle cone, with face |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_boba.svg" width="56" alt="boba tea"> | `pixel_boba.svg` | boba tea cup with pink straw + tapioca |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_macaron.svg" width="56" alt="macaron"> | `pixel_macaron.svg` | pink macaron sandwich with cream filling |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_pancakes.svg" width="56" alt="pancakes"> | `pixel_pancakes.svg` | pancake stack with butter + syrup |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_onigiri.svg" width="56" alt="onigiri"> | `pixel_onigiri.svg` | triangle rice ball with nori band + face |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_sushi.svg" width="56" alt="sushi"> | `pixel_sushi.svg` | salmon nigiri with a tiny face |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_taiyaki.svg" width="56" alt="taiyaki"> | `pixel_taiyaki.svg` | fish-shaped pastry in profile |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_pudding.svg" width="56" alt="pudding"> | `pixel_pudding.svg` | caramel pudding with a happy face |

#### Nature & objects — 11 mascots

| Preview | File | Vibe |
|---|---|---|
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cloud.svg" width="56" alt="cloud"> | `pixel_cloud.svg` | sky-blue cloud with pink blush |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_mushroom.svg" width="56" alt="mushroom"> | `pixel_mushroom.svg` | red-cap mushroom with a white-stem face |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_rainbow.svg" width="56" alt="rainbow"> | `pixel_rainbow.svg` | rainbow stripes between two clouds |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_star_face.svg" width="56" alt="smiling star"> | `pixel_star_face.svg` | yellow star with a sleepy smile |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_moon.svg" width="56" alt="moon"> | `pixel_moon.svg` | crescent moon with one eye + small blush |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_sun.svg" width="56" alt="sun"> | `pixel_sun.svg` | sun with rays + pink blushes |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_flower.svg" width="56" alt="flower"> | `pixel_flower.svg` | pink flower with smiling yellow center |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cactus.svg" width="56" alt="cactus"> | `pixel_cactus.svg` | potted cactus with a tiny face |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_tea_cup.svg" width="56" alt="tea cup"> | `pixel_tea_cup.svg` | pink tea cup with steam + face |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_planet.svg" width="56" alt="planet"> | `pixel_planet.svg` | ringed purple planet with face |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_acorn.svg" width="56" alt="acorn"> | `pixel_acorn.svg` | acorn with dark cap + smiling nut |

#### Ghosts — 4 variants

| Preview | File | Vibe |
|---|---|---|
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_ghost.svg" width="56" alt="ghost"> | `pixel_ghost.svg` | friendly ghost, transparent bg |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_ghost_tile.svg" width="56" alt="ghost on tile"> | `pixel_ghost_tile.svg` | C-variant 1 — ghost on dark tile (14×14 inset) |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_ghost_silhouette.svg" width="56" alt="ghost silhouette"> | `pixel_ghost_silhouette.svg` | C-variant 2 — silhouette with cut-out eyes |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_ghost_silhouette_dark.svg" width="56" alt="ghost silhouette dark"> | `pixel_ghost_silhouette_dark.svg` | dark-mode pair for the above |

#### Silhouettes — 5 cut-out variants

| Preview | File | Vibe |
|---|---|---|
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cat_silhouette.svg" width="56" alt="cat silhouette"> | `pixel_cat_silhouette.svg` | black cat with cut-out eyes + blush |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_bunny_silhouette.svg" width="56" alt="bunny silhouette"> | `pixel_bunny_silhouette.svg` | tall-eared bunny with cut-out eyes + blush |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_heart_silhouette.svg" width="56" alt="heart"> | `pixel_heart_silhouette.svg` | solid red heart with shine highlight |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_star_silhouette.svg" width="56" alt="star"> | `pixel_star_silhouette.svg` | solid yellow star with twinkle highlight |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cloud_silhouette.svg" width="56" alt="cloud silhouette"> | `pixel_cloud_silhouette.svg` | bold cloud silhouette with cut-out eyes |

### Gradient blobs (Technique B) — 22 emotion variants

| Preview | File | Gradient | Emotion |
|---|---|---|---|
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_brand_grad.svg" width="56" alt="happy blob"> | `blob_brand_grad.svg` | sunset (orange → red → pink → indigo) | 😊 happy |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_mint.svg" width="56" alt="wink blob"> | `blob_mint.svg` | mint → cyan | 😉 wink |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_heart_eyes.svg" width="56" alt="heart eyes blob"> | `blob_heart_eyes.svg` | pink → magenta | 😍 in love |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_smug.svg" width="56" alt="smug blob"> | `blob_smug.svg` | lavender → violet | 😏 smug |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_surprise.svg" width="56" alt="surprised blob"> | `blob_surprise.svg` | cyan → teal | 😮 gasping |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_starry.svg" width="56" alt="starry blob"> | `blob_starry.svg` | yellow → orange | 🤩 amazed |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_kissy.svg" width="56" alt="kissy blob"> | `blob_kissy.svg` | coral → pink | 😘 kissy |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_wide_eye.svg" width="56" alt="big-eyed blob"> | `blob_wide_eye.svg` | radial amber | 🥺 anime / big-eyed |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_sleepy.svg" width="56" alt="sleepy blob"> | `blob_sleepy.svg` | violet → indigo | 😌 sleepy |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_woah.svg" width="56" alt="woah blob"> | `blob_woah.svg` | lavender → violet | 😲 surprised (raised brows + O mouth) |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_cheer.svg" width="56" alt="cheering blob"> | `blob_cheer.svg` | yellow → amber | 🙌 cheering (arms-up Y + sparkles) |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_love_rays.svg" width="56" alt="radiating heart"> | `blob_love_rays.svg` | n/a (radiating heart) | ❤️ radiating love |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_sparkles.svg" width="56" alt="sparkling blob"> | `blob_sparkles.svg` | amber → pink | ✨ sparkling / shiny |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_giggle.svg" width="56" alt="giggling blob"> | `blob_giggle.svg` | rose → crimson | 😂 giggling (open laugh + blush) |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_blush.svg" width="56" alt="blushing blob"> | `blob_blush.svg` | pale pink → rose | ☺️ shy / blushing |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_dreamy.svg" width="56" alt="dreamy blob"> | `blob_dreamy.svg` | lavender → violet | 💭 dreamy (sleepy eyes + floating stars) |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_proud.svg" width="56" alt="proud blob"> | `blob_proud.svg` | cyan → teal | 😌 proud (closed-eye smile + sparkle) |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_party.svg" width="56" alt="party blob"> | `blob_party.svg` | mint → emerald | 🥳 party (tongue out + confetti) |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_cozy.svg" width="56" alt="cozy blob"> | `blob_cozy.svg` | peach → orange | ☕ cozy (sleepy + steam wisps) |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_wave.svg" width="56" alt="waving blob"> | `blob_wave.svg` | yellow → amber | 👋 waving hi |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_bubble_heart.svg" width="56" alt="speech bubble heart"> | `blob_bubble_heart.svg` | pink → magenta | 💬 speech bubble with a heart |
| <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_thinking.svg" width="56" alt="thinking blob"> | `blob_thinking.svg` | violet → indigo | 🤔 thinking (raised brow + thought bubble) |

## Limitations

- **Not a corporate brand mark.** This skill is for hand-authored, cute, low-effort favicons. If you need a polished brand mark, photographic logo, or an apple-touch-icon multi-platform pack, hand off to a designer.
- **SVG-only.** No `.ico` fallback in the recipes. Every browser shipped since 2020 supports SVG favicons (Chrome 80+, Firefox 41+, Safari 12+, Edge 80+). IE 11 and ancient Android browsers are not in scope.
- **Animation is shaky.** Most browsers reject SMIL animation in favicons; CSS animation works in some contexts but isn't covered in the canonical recipes.
- **PWA / home-screen icons.** Different problem — `manifest.json` and `apple-touch-icon` are out of scope.

## Dependencies

None at runtime — the output is a single SVG file. The skill assumes the user's web app has a `<head>` element where `<link rel="icon">` can be added; that's it.

## Key design decisions

1. **One SVG, not a 12-file pack.** The skill explicitly rejects the favicon-generator pattern of `.ico` + 4× PNG sizes + manifest + apple-touch-icon. Modern browsers don't need any of that.
2. **Live tab-size verification is non-optional.** Pixel-art choices that look great at the SVG's natural viewBox size (16×16, viewed at 200% in your editor) routinely break at the actual 14–16px tab size. The skill defaults to the `/tmp/favicon_preview.html` iterate-with-preview loop.
3. **Dark-mode goes through two files, not CSS-in-SVG.** Chrome treats favicon SVGs as image-type resources and does NOT evaluate `@media (prefers-color-scheme: dark)` inside them. The two-file `<link media>` recipe is the only cross-browser path.

## See also

- **`frontend-design`** — broader frontend / UI design guidance for Claude Code
- **`claude-design-handoff-bundle`** — for implementing a designer's specific favicon mark (different problem: rendering a brand mark, not authoring a cute one from scratch)

## References

- [MDN: SVG favicons](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/link)
- [Can I Use: SVG favicons](https://caniuse.com/link-icon-svg) — 96%+ global support as of 2026
- [`shape-rendering="crispEdges"`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/shape-rendering) — the magic attribute that keeps pixel art pixel-crisp

## Version history

- **v1.11.0** (2026-06-02) — Added **Step 3b — cache-bust the favicon link when replacing an existing icon.** Fixes the long-standing gap where the only cache advice was "hard-refresh / incognito," which doesn't help when a *changed* favicon stays stale on returning users' tabs. The deterministic fix is a `?v=N` version query on the `<link rel="icon">` href (new URL = new cache key = forced re-fetch for everyone). Source: field testing — a deployed monkey→butterfly swap was server-correct but tab-stale until `favicon.svg` → `favicon.svg?v=2`.
- **v1.10.0** (2026-05-28) — Big catalog expansion. Removed 4 mascots that didn't land (`blob_hugg`, `pixel_cat_meow`, `pixel_hyper_cat`, `pixel_monkey`). Added 50 new originals across five families: 15 animals (panda, penguin, fox, owl, pig, duckling, cow, puppy, seal, otter, hedgehog, axolotl, capybara, corgi, quokka), 10 sweets/food (donut, cupcake, ice cream, boba, macaron, pancakes, onigiri, sushi, taiyaki, pudding), 10 nature/objects (mushroom, rainbow, star face, moon, sun, flower, cactus, tea cup, planet, acorn), 5 silhouettes (cat, bunny, heart, star, cloud), and 10 emotion blobs (sparkles, giggle, blush, dreamy, proud, party, cozy, wave, bubble heart, thinking). Catalog now: 56 pixel + 22 blob = 78 starter SVGs.
- **v1.9.0** (2026-05-28) — Added 10 new starter mascots (6 pixel + 4 blob) inspired by a Slack emoji wishlist. Pixel: `sheep`, `cat_meow`, `cat_love`, `shy_cat`, `hyper_cat`, `monkey`. Blob: `hugg`, `woah`, `cheer`, `love_rays` (no-face radiating heart). IP-protected source emojis were skipped — all designs are original.
- **v1.8.0** (2026-05-27) — Expanded Technique B emotion vocabulary: swapped `blob_mint` to a wink and added 5 new emotion blobs (heart-eyes, smug, surprise, starry, kissy). Gradient blobs now cover 9 distinct emotions, useful for mood-picker UIs.
- **v1.7.0** (2026-05-27) — Dropped Technique D (text sticker); added 6 new pixel-art mascots (bunny, bear, chick, bee, strawberry, cloud) so the skill ships with 13 ready-to-edit pixel-art mascots and 4 gradient blobs.
- **v1.6.0** (2026-05-27) — Tightened R1 contrast guidance: tint body color should be ≥30 lightness points below the brightest tab background it must survive (Tailwind `*-300` for cream/white active tabs); `*-50` pastels vanish on cream tabs.
- **v1.5.0** (2026-05-27) — Flipped the dark-mode recipe to two files + `<link media>` after empirical finding that Chrome does NOT evaluate CSS-in-SVG `@media (prefers-color-scheme: dark)` for favicons. Browser-support matrix added.
- **v1.4.0** (2026-05-27) — Added the "silhouette disappeared into the tab background" diagnosis (distinct from tab-edge blending and dark-mode mismatch); 4-path recolor decision tree.
- **v1.3.0** (2026-05-27) — C-variant 2 (single-color silhouette with cut-out eyes, GitHub-octocat style); first dark-mode adaptation pass.
- **v1.2.0** (2026-05-27) — The "two-margin rule" for tiled pixel art (14×14 inset tile + 12-wide mascot body); live-browser verification is mandatory for tiled stickers.
- **v1.1.0** (2026-05-27) — C-variant for pixel art on a rounded tile; iterate-with-preview promoted to a first-class authoring pattern.
- **v1.0.0** (2026-05-27) — Initial skill: emoji, gradient blob, 16×16 pixel art.

## License

MIT — see [LICENSE](LICENSE).
