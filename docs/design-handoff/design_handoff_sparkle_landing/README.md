# Handoff: Sparkle That Page — Landing Page (two directions)

## Overview
Two complete, self-contained landing-page directions for **Sparkle That Page** (the `cutify-this` plugin / "the cutest dev tool you've ever seen"). Both market the same product — a one-file, zero-dependency script that adds cute live effects (sparkle trail, click confetti, fairy cursor, ambient floaters, scroll meter, tab peekaboo, kawaii loaders, theme palettes) to any web page — and both *demonstrate the product on themselves* by running the real effects live.

- **Direction A — "Aurora"** (`Aurora.dc.html`): dark, cinematic, galaxy palette. Liquid-glass chrome, animated gradient wordmark, a rigged fairy-cat mascot on a glowing mushroom, scroll-scrubbed "pinned pillar" reveal, an auto-scrolling effect marquee, an **interactive playground** (toggle each effect + pick a variant, live), sticky stacking effect-cards, stats, and a final CTA.
- **Direction B — "Bubblegum"** (`Bubblegum.dc.html`): bright, candy, TOONHUB-style. A color-crossfade **carousel** of effects, the same scroll-pinned pillars, the fairy-cat mascot, a features grid, and an install band.

The two pages cross-link via a pill switcher (bottom-center on Aurora, top-center on Bubblegum). Conceptually they double as two of the product's four built-in palettes (Aurora ≈ "galaxy", Bubblegum ≈ "candy").

## About the Design Files
The files in this bundle are **design references authored in HTML/CSS/JS** — prototypes that show the intended look, motion, and behavior. They are **not production code to copy verbatim**. They were built in a lightweight prototyping runtime ("Design Components", `*.dc.html` + `support.js`); `support.js` is the prototype harness and is **not** part of the deliverable.

The task is to **recreate these designs in the `cutify-this` repo's environment** using its established patterns. The repo ships effect modules as standalone vanilla-JS files (e.g. `fairy_cursor.js`, `sparkle_trail.js`, `click_confetti.js`, `scroll_indicator.js`, `tab_title_peekaboo.js`, `ambient_floaters.js`) plus a `cute_chrome.css`. The landing site should be built as a normal static site (plain HTML/CSS/JS, or whatever framework the repo's site uses). **Reuse the repo's real effect modules** for the live demos rather than the prototype's `sparkle-fx.js` (which is a re-implementation for the prototype — see "Effects engine" below for the mapping).

## Fidelity
**High-fidelity.** Final colors, type, spacing, motion, and copy are all specified below and present in the files. Recreate pixel-closely, then swap the prototype's effect engine for the repo's actual modules.

---

## Design Tokens

### Fonts (Google Fonts)
- **Fredoka** (400/500/600/700) — display / UI / wordmark (both pages)
- **Nunito** (400/600/700/800 + italic) — body copy (both pages)
- **DM Mono** (400/500) — code, kicker labels, variant pills (Aurora)
- **Anton** (400) — giant ghost type + big headlines (Bubblegum only)

### Aurora palette (dark / "galaxy")
| Token | Value | Use |
|---|---|---|
| bg base | `#100a22` | body |
| bg radial | `radial-gradient(1100px 700px at 50% -8%, #2a1b54 0%, #180f31 42%, #100a22 100%)` | page bg |
| violet | `#a78bfa` | primary accent |
| indigo | `#818cf8` | accent |
| cyan | `#22d3ee` | accent |
| pink | `#f0abfc` | accent |
| lilac | `#c4b5fd` | accent |
| gold | `#fde047` | sparkle |
| ink (text) | `#f1ecff` | headings/body |
| muted text | `#cfc4ee`, `#bcb0e0` | body/secondary |
| blue mono | `#8fb6ff` | kicker labels |
| glass fill | `rgba(255,255,255,.04–.05)` | cards/nav |
| glass border | `1px solid rgba(255,255,255,.12–.14)` | cards/nav |
| glass shadow | `inset 0 1px 1px rgba(255,255,255,.14–.16), 0 14–40px … rgba(0,0,0,.8–1)` | cards |
| primary CTA | `linear-gradient(123deg,#a78bfa,#f0abfc 55%,#22d3ee)`, text `#1a0f33` | buttons |
| wordmark | `linear-gradient(108deg,#a78bfa,#818cf8 18%,#fff 38%,#f0abfc 56%,#22d3ee 78%,#a78bfa 100%)`, `background-size:240% auto`, clipped to text, `au-shine 5s linear infinite` | hero H1 |

### Bubblegum palette (bright / "candy")
| Token | Value | Use |
|---|---|---|
| section bg | `#fff1f8` | "more in the box" + footer |
| hero bg | per active carousel effect, crossfades over 650ms | hero |
| dark text | `#3a1338` | headings |
| muted text | `#9b6a8e` | body |
| magenta | `#c026a3` | kickers |
| install band | `linear-gradient(135deg,#ec4899,#a855f7 52%,#3b82f6)` | band |
| Effect accents (carousel) | sparkle `#ec4899`/panel `#f9a8d4` · confetti `#a855f7`/`#d8b4fe` · fairy `#3b82f6`/`#93c5fd` · bloom `#10b981`/`#6ee7b7` | bg + cards |

### Radii / shape
- Pills/buttons: `999px` (Aurora nav/CTAs), `14px` (Aurora code/secondary buttons)
- Cards: Aurora 20–34px; Bubblegum carousel cards `46px`, feature cards `24–26px`
- Mushroom, mascot, etc. are CSS art (see "Mascot").

---

## Screens / Views

### A1 · Aurora — Nav (fixed)
Centered liquid-glass pill, `top:18px`, `z-index:50`. Logo (`✨ sparkle‑that‑page`, Fredoka 700 17px) · divider · text links **Try it / Inside / Install** (Fredoka 600 14px, `rgba(241,236,255,.78)`, hover → `#fff` + `rgba(255,255,255,.08)` bg) · gradient pill button **Add sparkle ✨**. Glass: `rgba(255,255,255,.05)` + `backdrop-filter:blur(16px)` + 1px white border.

### A2 · Aurora — Hero (100vh, fades out on scroll)
Centered column: two rotated sticker chips ("one tiny file", "zero dependencies") → **fairy-cat mascot on a glowing mushroom** (see Mascot) → giant gradient wordmark `sparkle that page` (`clamp(2.9rem,11vw,7.2rem)`, Fredoka 700, `line-height:.96`, `letter-spacing:-.03em`) → subhead (Nunito 600, max-width 36ch, `#cfc4ee`) → install row: `$ npm i sparkle-that-page` code chip + ghost "Try it live ▶" → micro hint line. The whole hero `opacity` is driven by scroll (`1 - scrollY/(innerHeight*0.62)`).

### A3 · Aurora — Scroll-reveal pillars ("Three steps to sparkle")
A 200vh trigger zone. Three glass cards are **fixed** at `bottom:13vh` and **wipe in left→right via a CSS `mask-image` gradient** as you scroll the zone, then wipe out (the container `opacity` fades in/out at the ends). Heading has a Veldara-style **underline bar** (`linear-gradient(90deg,#a78bfa,#f0abfc,#22d3ee)`) behind the word "sparkle". Cards: number (gradient text) + title + body. See "Interactions → Pinned mask reveal".

### A4 · Aurora — Marquee ("Every effect, in motion")
Two rows of glass tiles auto-scroll in opposite directions (CSS `@keyframes` translateX ±33.333%, content tripled for seamless loop), edge-masked. Each tile: a **crafted CSS icon** (not emoji — see `icons.js`) + effect name + one-line description.

### A5 · Aurora — Interactive Playground ("Flip a switch, see the magic")
A glass panel with a responsive grid of **6 effect controls**. Each control: crafted icon + name + sub, a **toggle switch**, and a row of **variant pills**. Toggling **actually starts/stops the real effect on the page**; picking a variant restarts it with that look. Defaults: trail ON (sparkle), confetti ON, ambient floaters ON (stars), scroll meter ON (cat), tab peekaboo ON (shy); fairy cursor OFF. Variants:
- Sparkle trail: sparkle / star / heart
- Click confetti: confetti / heart / star / petal
- Fairy cursor: star / heart / moon / crystal
- Ambient floaters: stars / sakura / snow / bubbles
- Scroll meter: cat / comet
- Tab peekaboo: shy / love / sleepy / ghost

### A6 · Aurora — Sticky stacking cards ("Four ways to delight")
Four cards `position:sticky; top:96px`, each scaling down slightly as the next overlaps (JS scroll handler). Left = number (gradient) + mono tag + title + body; right = a small live demo (sparkle cluster, confetti button, scroll-meter mock, palette swatches).

### A7 · Aurora — Stats + Final CTA
Stats: 4 glass tiles ("1 tiny file", "0 dependencies", "8 live effects", "4 color vibes"), big gradient numbers. CTA: centered glass panel, sparkle icon, "Make your page impossible to leave", install chip + "Read the docs →".

### B1 · Bubblegum — Carousel hero (100vh)
Background color = active effect accent, **crossfades 650ms cubic-bezier(.4,0,.2,1)**. Giant **Anton** ghost word behind (effect's word: SPARKLE/CONFETTI/MAGIC/BLOOM), crossfades. Brand label top-left, white "Add sparkle" pill top-right, **direction switcher** top-center. Four panel cards arranged by role (**center / left / right / back**) — each a pastel rounded panel with a **composed scene**: glow disc, two spinning dashed halo rings, orbiting twinkle-sparkles, the crafted effect icon (132px) with bob + drop-shadow, a pedestal shadow, and an accent **title pill**. Bottom-left: effect title + description + two circular ‹ › nav buttons. Bottom-right: Anton "GET IT →". Clicking a side card or arrows rotates roles (see Interactions).

### B2 · Bubblegum — Pillars + Mascot + Features ("More in the box")
Same scroll-reveal pinned pillars (white cards, candy gradient backdrop, Anton heading w/ underline). Then the **fairy-cat mascot on her mushroom** floats above the section heading. Then a 4-card features grid (Scroll meter / Tab peekaboo / Kawaii loaders / Theme palettes) — white cards, slight rotation, crafted icons, hover lift. Then an install band + footer.

---

## Mascot — layered fairy-cat (CSS art, fully rigged)
A kawaii white fairy-kitten built entirely from positioned `<span>`s under a `.fc` root (`.fc *{position:absolute}`). **Independently animated parts**, each its own `@keyframes`:
- **Ears** (`.fc-ear.l/.r`) wiggle (`fc-earL/R`)
- **Wings** (`.fc-wing.ul/ll/ur/lr`) — four iridescent blades flutter (`fc-wingLU/LL/RU/RL`); right side mirrored with `scaleX(-1)`
- **Tail** (`.fc-tail`) sways (`fc-tail`)
- **Wand-arm** (`.fc-armL`) waves (`fc-arm`); holds an ornate magical-girl wand: gold/rose filigree heart frame (`.hframe`) + iridescent heart (`.heart`, conic gradient + clip-path) + rose center (`.rose`) + gold star crown (`.crown`) + base gem (`.gem`) + fluttering angel-wings (`.tw.l/.r`) + twinkle sparkles (`.tsp`), all pulsing (`fc-topglow`)
- **Eyes** (`.fc-eye`) follow the cursor via CSS vars `--ex/--ey`, and **blink** via `--bk` (scaleY) — both driven by JS (see below)
- **Tutu** (`.fc-tutu` + 6 `.fc-petal`), **head/band/flower/cheeks/nose/mouth+fangs**, **body**

Surrounding her: a **mushroom** (`.m-seat` + `.m-seat-glow` + `.m-seat::before` spots + `.m-seat::after` stem) that **sways and pulses** (`au-shroomsway`, `au-shroomglow`) with rising **sparkle-motes** (`.m-mote`, `au-mote`); a soft **aura** (`.fc-aura`); and continuous **fairy dust** (`.fc-dust`, `fc-dust` keyframe, per-particle `--dx/--dy` + delay).

Wrappers: `#…MascotFly` carries the float (`au-fly`), `#…MascotMag` is the magnetic target. JS init (per page, `_initMascot` / `_initBgMascot`):
- `magnetic(mag,{strength:5,padding:150})` — whole cat drifts toward the cursor
- `mousemove` → sets `--ex/--ey` on the `.fc` root (eyes follow)
- self-scheduling `setTimeout` blink → sets `--bk` to `.1` for 120ms
- click → swaps the fly animation to `m-twirl` for 1.1s, then restores `au-fly`
All gated by `prefers-reduced-motion` / `hover:none`.

> The full, copy-pasteable CSS + markup for the mascot lives in `Aurora.dc.html` (search `layered fairy-kitten`) and `Bubblegum.dc.html`. It is plain CSS/HTML — portable as-is into any framework.

---

## Effects engine
The prototype uses `sparkle-fx.js` (ES module) exporting: `sparkleTrail`, `clickConfetti`, `ambientFloaters`, `fairyCursor`, `scrollIndicator`, `tabPeekaboo`, `magnetic`. Each returns a `destroy()` function and honors `prefers-reduced-motion` / touch. **For production, prefer the repo's existing modules** and map them:

| Prototype export | Repo module | Notes |
|---|---|---|
| `sparkleTrail({glyph,colors,glow})` | `sparkle_trail.js` (`window.SparkleThatPage.sparkleTrail`) | glyph variants ✦★♥ |
| `clickConfetti({glyph,colors})` | `click_confetti.js` | glyph = null → ribbons; ♥★❀ → glyphs |
| `ambientFloaters({glyphs,colors,count,…})` | `ambient_floaters.js` | sakura/snow/bubbles/stars |
| `fairyCursor({variant})` | `fairy_cursor.js` | star/heart/moon/crystal wands |
| `scrollIndicator({variant,c1,c2})` | `scroll_indicator.js` | `cat` = corner buddy on a rail; `comet` = top progress bar w/ a glowing face |
| `tabPeekaboo({mood})` | `tab_title_peekaboo.js` | shy/love/sleepy/ghost — swaps `document.title` + favicon on `visibilitychange` |
| `magnetic(el,{strength,padding})` | (prototype-only) | eases an element toward the cursor; small helper to port |

The **playground** (A5) is just a registry: each toggle calls the module's init (storing the returned `destroy`) or calls `destroy()`; variant change = destroy + re-init with the new option. Wire it to the repo's modules the same way `demo.html` does.

## Interactions & Behavior
- **Pinned mask reveal (A3/B2):** a tall trigger section; a `position:fixed` card block. On scroll, compute progress `0→1` across the zone; set `grid.style.maskImage = linear-gradient(to right, #000 {p*130}%, transparent {p*130+15}%)` (desktop) / `to bottom … +20%` (mobile); fade container `opacity` in over the first 20vh and out over the last 30vh. rAF loop.
- **Hero fade (A2):** `header.opacity = clamp(0,1, 1 - scrollY/(innerHeight*0.62))`.
- **Carousel (B1):** roles `center=active`, `left=active-1`, `right=active+1`, `back=active+2`. Each card transitions `transform/left/opacity/filter 650ms cubic-bezier(.4,0,.2,1)`. Center: `translateX(-50%) scale(1.16)`, z20; left/right: `scale(.72)`, blur 1.4px, z10; back: `scale(.56)`, blur 2.6px, z5. `navigate('next'|'prev')` bumps `active mod 4`, locks input for 660ms, sets hero bg to the new accent, and crossfades the ghost word + title/desc (swap text at the 220ms midpoint).
- **Marquee (A4):** pure CSS, opposite directions, tripled content, edge mask.
- **Sticky stack (A6):** scroll handler scales each card by `1 - p*0.06*(n-1-i)`.
- **Reveal-on-scroll:** `IntersectionObserver` adds `.in` → `opacity/translateY/blur(8px)→0` over .7–.8s.
- **Mascot:** magnetic drift, eye-follow, blink, click-twirl (above).

## State Management
- **Playground:** `fxState = { key: { on, variant } }` + `fxInstances = { key: destroyFn|null }`. Toggle flips `on` and starts/stops; variant change restarts if on. Initialize defaults on mount.
- **Carousel:** `active` (0–3), `animating` lock, `isMobile` (`innerWidth < 640`, on resize). Effect data array (word/title/icon/accent/panel/desc).
- **Pins / hero fade / sticky:** rAF + scroll listeners; no persisted state.

## Assets
- **No external image assets are required** — the mascot, mushroom, all effect icons, and the wand are pure CSS. (An earlier raster mascot, `assets/fairy-cat.png`, was replaced by the layered CSS version and is **not** used.)
- Icons come from `icons.js` (`icon(name,size)` → HTML string of CSS shapes): `sparkle, wand, confetti, cursor, bloom, cat, eye, peek, loader, palette`. Needs `@keyframes ic-spin` and `ic-tw` in the host page.
- Fonts: Google Fonts (Fredoka, Nunito, DM Mono, Anton).

## Files (in this bundle)
- `Aurora.dc.html` — Direction A (dark). Full markup, inline styles, `<helmet>` `@keyframes`/`@font-face`, and the logic class (playground, pins, carousel-less, mascot, sticky, marquee).
- `Bubblegum.dc.html` — Direction B (bright). Carousel + pins + mascot + features.
- `sparkle-fx.js` — prototype effect engine (reference; map to repo modules).
- `icons.js` — crafted CSS icon set used across both pages.

> In the `.dc.html` files, ignore the `<x-dc>`, `<script src="./support.js">`, and `data-dc-*` wrappers — those are the prototype harness. The **markup between `<x-dc>…</x-dc>`**, the **`<helmet>` CSS**, and the **logic class body** are what you port. All visual styling is inline or in `<helmet>` `@keyframes`; there is no external stylesheet.

## Target repo
`https://github.com/wan-huiyan/cutify-this` — reuse its effect modules and `cute_chrome.css`; implement the two landing directions as static pages (or in the repo's site framework if one exists).
