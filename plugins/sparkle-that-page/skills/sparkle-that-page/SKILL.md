---
name: sparkle-that-page
description: Use when a user wants to add cute, playful runtime effects to a web page — a fairy-wand or magic custom cursor (11 kinds: star / moon / wizard / candy / pixel…), a sparkle / star / heart / fairy-dust trail following the mouse on move and click, an animated floating scroll-depth / scroll-progress indicator (ring, comet bar, or climbing mascot), tab-title peekaboo ("come back!" when the tab loses focus), click confetti or heart burst, a rubber-stamp "Done!" on a button, ambient floating petals / leaves / snowflakes / bubbles / fairy-dust, cute-chrome touches (pastel ::selection, wobble hover, kawaii loading spinner, pastel scrollbar), opt-in synthesized sounds (chime / tick / twinkle), a typed secret word that sets off a party, and a sun / moon dark-mode switch that never flashes the wrong theme. Pick a color palette (candy / neon / meadow) and a pixel-art style variant on each. Skip for serious / corporate UIs, or when the user wants a full design system or a heavyweight particle framework.
---

# Sparkle That Page ✨

Make the whole browser page delightful — not just the favicon (that's the
sibling skill `cutify-that-tab`). Ten self-contained, **zero-dependency**
effects you paste in: a fairy-wand cursor, a sparkle trail, an animated scroll
indicator, tab-title peekaboo, click confetti (with a rubber stamp), ambient
floaters, cute-chrome touches, opt-in sounds, a secret word, and a sun / moon
sky switch. Each is one short vanilla file — copy, drop in, tweak a
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
<html data-wand="garden" data-wand-palette="daisy" data-trail="fairydust" data-palette="candy">
```

**Every effect starts on load** — drop in the script and it runs. Each also registers
`window.SparkleThatPage.<name>` with `start()` and `destroy()`, so you can switch it off and
on (a settings toggle, an SPA route, a reduced-motion change) without re-injecting the file:
`start()` is idempotent (calling it twice never doubles listeners or layers), `destroy()` then
`start()` brings the effect back and re-reads the `data-*` attributes, and `start()` keeps the
same no-op guards as load (touch / coarse pointer, reduced motion). The `<script>` can sit in
`<head>` or `<body>`: the effects that draw a layer wait for `DOMContentLoaded` when `<body>` does
not exist yet (and `destroy()` cancels that wait).

### Step 0 · how often will it fire?

Decide how often an effect fires *before* you decide how it looks — a rule from
the `animate` skill in [emilkowalski/skills](https://github.com/emilkowalski/skills):
things users do 100+ times a day should barely animate; delight belongs to rare
moments. The defaults below follow it.

| Effect | How often it fires | Default |
|---|---|---|
| Click confetti | every click, 100+/day | scoped to celebratory elements (`[data-celebrate]`, `[data-confetti]`); `data-confetti-on="*"` is opt-in |
| Sparkle trail | every mouse move | sparse by default; `data-trail-density="storm"` is opt-in; landing pages, not all-day tools |
| Wobble hover | tens per day | near-imperceptible (±2°, 0.35 s, mouse only) |
| Floaters / fairy cursor / scroll ring | always on | fine on marketing and demo pages; never over data the user is reading or acting on |
| Tab peekaboo | rare | fine as is |
| Stamp (`data-stamp`) | once per finished task | the moment it marks is already rare; keep it on "done", "paid", "shipped" |
| Sounds | as often as the effects they follow | off until the visitor switches them on; quiet (peak gain ≤ 0.08); only on bursts, celebrate clicks and the party |
| Secret word / finale | rare (a few times ever) | fine as is; the finale is for "finished everything", not each step |
| Sky switch | rare | fine as is; it never animates the page, only flips the theme |

### Color palette (shared across the particle effects)

Set `data-palette` on `<html>` (default `candy`). It tints the **sparkle
trail**, **click confetti**, and **ambient floaters** (the `dust` / `fairydust`
variants), and turns on a soft glow for `neon`:

| `data-palette` | Colors | Vibe |
|---|---|---|
| `candy` | pink / purple / gold | kawaii (default, matches the cutify brand) |
| `neon` | cyan / lime / magenta / amber + **glow** | "mission control" |
| `meadow` | rose / indigo / teal / lavender / peach | soft, earthy, warm |

**One source of color.** `cute_chrome.css` defines the palette as CSS custom
properties — `--stp-c1` … `--stp-c5` (plus an optional `--stp-c6` and `--stp-ink`,
the text color on selections) — on `:root` (candy), overridden by
`[data-palette="neon"]` and `[data-palette="meadow"]`. It also uses them for
`::selection`, the spinner and the scrollbar. Each JS effect first reads those
tokens with `getComputedStyle`; if they are empty (the CSS isn't loaded) it falls
back to its own built-in array, so every file still works alone. Override the
tokens in your own CSS to brand all effects at once. Click confetti uses the
tokens only when `data-palette` is set; otherwise it keeps the per-variant colors.

### 1 · Fairy-wand cursor — `fairy_cursor.js`

Replaces the cursor with a 40 × 40 wand SVG via `cursor: url(...) 27 11, auto`. The click
point is the middle of the gem. Over anything clickable (`a[href]`, `button`, `[role=button]`,
`label`, `summary`, `select`, checkbox / radio / submit / button inputs, `[data-celebrate]`,
`[data-stamp]`) it swaps to a **brighter twin**: a halo behind the gem and more glints, so the
wand tells you what is clickable. The two images live in `--stp-wand` and `--stp-wand-link` on
`<html>`. The file injects its own `<style>`. Text inputs keep the I-beam.

- **Your own art.** Set `--stp-wand` and/or `--stp-wand-link` yourself (`cursor` values, e.g.
  `url(my-wand.svg) 4 4, auto`): in a stylesheet that applies before the script runs, or inline on
  `<html>` at any time. A property the page set is never overwritten or removed: the wand keeps
  painting only the ones that still hold what it last wrote.
- `data-wand` picks one of 11 families, each a different shape. `data-wand-palette` picks one of
  its 3 palettes; the first is the default:
  `star` (gold · pink · ice, the default) · `magical` (crescent cradling a heart gem: lilac · mint
  · sky) · `wizard` (gnarled staff hooked over an orb: arcane · ember · forest) ·
  `garden` (wooden rod, flower: rose · daisy · lavender) · `cosmic` (silver rod, north star in a
  planet ring: violet · aurora · nova) · `candy` (striped cane, glossy heart, bow: strawberry · mint
  · grape) · `crystal` (faceted gem: amethyst · aqua · rose) · `moon` (sleepy crescent holding a
  star: gold · silver · rose) · `ocean` (scallop shell, pearl: pearl · lagoon · coral) · `lollipop`
  (swirl, bow: berry · lemon · sky) · `pixel` (8-bit star on a 2 px grid: gold · rose · mint).
- **Old names keep working.** `heart` is an alias of `candy` (older aliases: `references/wands.md`).
  An unknown family falls back to `star`; an unknown palette falls back to the family's first.
- **Light and dark follow the page**, by the same rule as the glints trail (`sparkle_trail.js`):
  `<html data-theme="light|dark">` wins; otherwise the measured background of `<body>`, then
  `<html>`, decides; with neither opaque, the page is white unless its `color-scheme` allows `dark`
  and the system is dark. So a light-only site keeps the light-page wand for a dark-mode visitor.
  Light pages get a dark ink outline and dark pages a white one. The wand repaints when
  `data-theme`, `data-wand`, `data-wand-palette`, the `class` or `style` of `<html>` or `<body>`
  change, when a background transition on either ends, on `load`, and when the system scheme flips.
  Palettes are named per family and don't read `--stp-c1…`: a cursor is an image, and each
  palette is tuned so its outline stays readable.
- **Gallery API.** `fairyCursor.svg(family, palette, dark, on)` returns the SVG text,
  `.families` lists the names, `.palettes` maps each family to its palette names, and
  `.hotspot()` gives `[x, y]` in image pixels — the same for every family. Gradient ids are
  unique per wand, so many can share one page.
- **Drawing a new wand:** read [`references/wands.md`](references/wands.md) first. It covers the
  anatomy, the quality bar, each family's small-size trap, palette rules and sources to study
  (with licences).
- **Gotcha — strict Content-Security-Policy.** The base wand is set on `<html>` through the CSSOM
  (`root.style.cursor`), which a CSP such as `style-src 'self'` allows; only the glow rules live in an
  injected `<style>`, which that CSP blocks. So under a strict CSP the wand still shows and you lose only
  the glow over clickables (they fall back to the browser's own pointer). To keep the glow, allow the
  style with a nonce / hash or ship the two rules in your own stylesheet.
- **Gotcha — hotspot & size.** The hotspot (`27 11` = the middle of the gem) is in image
  pixels and must sit *inside* the image. Firefox and Chromium ignore cursor images over
  128 × 128 without an error. The 40 × 40 SVG is safe.
- No-op on touch / coarse pointers and in `forced-colors` mode (keeps the system's
  high-contrast pointer) — `start()` too. Static image, so reduced-motion is unaffected.
- `fairyCursor.start()` / `.destroy()`; `destroy()` removes the style, its own properties and the
  `stp-wand` class on `<html>`, gives back the page's own inline cursor, and disconnects the
  observer and its listeners. `node tests/sparkle_wands_smoke.mjs` checks every family × palette ×
  light/dark × glow, the light/dark rule, the repaints, the page's own art, and `destroy()`.

### 2 · Sparkle trail — `sparkle_trail.js`

A `pointer-events:none` overlay. Particles spawn on `mousemove` (rAF-throttled)
and burst on `click`; recycled fixed pool (cap 80). **It rests when idle:** the rAF loop
stops once no particle is alive and no move is pending, and the next `mousemove` or `click`
wakes it — an untouched page makes zero frame callbacks. (`ambient_floaters` is the one effect
that keeps a `requestAnimationFrame` loop on, by design: it is a drifting layer with no idle state.
The scroll ring's idle bob is an endless transform animation run by the browser, not a frame callback.)

- `data-trail`: `sparkle` (default) · `star` · `heart` · `pixel` · `fairydust`
  (small glowing dots) · `glints` (below). Colors come from `data-palette` (multi-color per particle).
- **`data-trail="glints"` — two-grain fairy dust.** Each spawn drops one tiny round **mote** and one
  thin four-point **glint** (a small inline SVG star). Glints **twinkle**: scale and opacity swell and
  dim about every quarter of a second while they drift down slowly, then fade (the grains carry
  `data-grain="mote"` / `"glint"`). It stays DOM-span based, in the same pool, loop and idle-rest as the
  other variants (the pool is 36 glints + 44 motes = the same cap of 80), so it keeps the
  "only `transform`/`opacity` animate" rule and the existing tests; a click bursts ten grains. The
  palette follows the **page's lightness**: pale gold / pink / lilac with a soft glow on dark pages, deeper
  gold / pink / violet with **no glow at all** (crisp) on light pages. Precedence, first match wins:
  1. `--stp-c1…c6` set by the page (e.g. from `cute_chrome.css`): used on both light and dark pages.
  2. otherwise the built-in light or dark glints palette. `data-palette` is **ignored** by this variant
     (that name picks a colour set, this variant picks by lightness; set the tokens to brand it).

  How "light or dark" is decided, in this order (every step can answer): `data-theme="dark"` / `"light"`
  on `<html>` (any other value, e.g. `cupcake`, is skipped); else the computed background of `<body>`,
  then `<html>`, the first that is at least half opaque (luminance below mid-grey = dark); else, for a
  page with no background of its own, `prefers-color-scheme: dark` **and** a `color-scheme` that
  includes `dark`. The system setting alone is not enough: a light page opened on a dark system is
  still a light page. It is re-read every time the loop wakes from rest, so a theme flip
  (`sky_switch.js`, a toggle) shows on the next move with no observer to clean up. A background that is
  only an image or gradient reads as "no background": set `data-theme` there.
  No shimmer while the pointer rests, so an untouched page still makes zero frame callbacks.
  **Strict CSP:** glints are safe under `style-src 'self'` (no `'unsafe-inline'`). Every style is set
  through the CSSOM (`el.style…`), which that policy allows, and the glint's inline SVG carries no
  `style=""` attribute. A test serves it with that policy and asserts 0 `securitypolicyviolation`
  events and 0 console errors. (An earlier build put `style="display:block"` inside the SVG markup,
  and a strict CSP logged 36 "Applying inline style violates…" errors at start.)
- `data-trail-density`: omit for the sparse default (a spawn every ≥ 24 px of
  pointer travel) · `storm` = dense, a spawn every ~16 ms (the v1.0 rate).
  Click bursts are the same either way.
- No-op on touch and on reduced-motion (load and `start()`).
- `sparkleTrail.start()` / `.destroy()`; the layer carries class `stp-trail`.

### 3 · Scroll-depth indicator — `scroll_indicator.js`

Fixed floating element driven by `scrollTop / (scrollHeight − innerHeight)`,
`passive` listener + rAF.

- `data-scroll`: `ring` (default — filling % ring, bottom-right, with an idle
  bob) · `comet` (top progress bar with a sparkle head; `scaleX`) · `mascot` (a
  pixel face that climbs a rail on the right; `translateY`).
- **Cheers at the bottom.** When you reach the end of the page the indicator element gets
  the class `is-end` (and loses it when you scroll back up); the mascot hops and smiles, the ring
  and the comet head pop once. Reduced motion: no hop or pop, but `is-end` still flips — so you
  can style the finish yourself with `[data-stp-scroll].is-end { … }` (the element carries
  `data-stp-scroll="<variant>"`).
- Reduced-motion disables the idle bob; the indicator still tracks position.
- `scrollIndicator.start()` / `.destroy()`.

### 4 · Tab-title peekaboo — `tab_title_peekaboo.js`

On `visibilitychange`, swaps `document.title` (and optionally the favicon) to a
cute message, then restores on return. The one effect that ties back to
`cutify-that-tab` — the away-favicon is an emoji-in-SVG, the same trick.

- `data-peekaboo-msg` (default `come back! 🥺`), `data-peekaboo-favicon` (an
  emoji; **omit** to leave the favicon alone).
- **Gotcha — taste.** Title-hijacking annoys some users; keep the message
  gentle and consider not also swapping the favicon. Restores cleanly on focus
  (the title to restore is read when the tab is hidden, so a title your app changed in
  between is not overwritten).
- `tabPeekaboo.start()` / `.destroy()`. Not a motion effect, so no reduced-motion guard.

### 5 · Click confetti / heart burst — `click_confetti.js`

A `<canvas>` overlay (sharp on Retina); a radial physics burst (velocity +
gravity, time-based so it matches at 60 and 120 Hz) on click.

- `data-confetti`: `heart` (default) · `star` · `confetti` · `petal` · `pixel`.
- `data-confetti-on` — *where* it fires, read at click time (so it can be
  toggled live): omit = only elements matching `[data-celebrate], [data-confetti]`
  (elements opt in) · `*` = every click · any other value = a CSS selector.
  `data-palette` recolors it (and `neon` adds glow).
- Reduced motion: *fewer and gentler, not zero* — a qualifying click draws one
  small glyph that fades out in place over ~400 ms (no movement, no physics).
- Exposes `SparkleThatPage.clickConfetti.burst(x, y)` to fire programmatically (it does
  nothing while the effect is destroyed), plus `.start()` / `.destroy()` and `.active()` — true
  while it runs. `destroy()` leaves the registry entry in place, so ask `active()` (as
  `cute_sounds.js` and `secret_word.js` do), not "is the key there". Its canvas has class `stp-confetti`.
- **Stamp — `data-stamp`.** Any element with `data-stamp="Done!"` gets, on click, a rotated
  rubber-stamp label that drops onto it and lands with a squash, with a confetti burst from
  `burst()` on the landing. The label text is the attribute's value (empty = `Done!`). It works
  whether or not `data-confetti-on` matches, replaces the normal burst for that click, is
  decorative (`aria-hidden`), takes its colour from `--stp-c1`, stays centred on its element if the page
  scrolls meanwhile, and removes itself after ~1.6 s.
  Reduced motion: the label simply appears and goes away — no slam, no confetti. Good for
  "Mark done", "Paid!", "Saved" buttons. `<button data-stamp="Paid!">Pay invoice</button>`

### 6 · Ambient floaters — `ambient_floaters.js`

A slow `position:fixed; pointer-events:none` layer **behind** content.

- `data-floaters`: `sakura` (default) · `leaves` · `snowflake` · `bubbles`
  (shiny gradient circles) · `dust` · `fairydust` (glowing). `data-floaters-count`
  (default 18, capped 60). `dust`/`fairydust` take `data-palette` colors.
- No-op on reduced-motion (load and `start()`). `ambientFloaters.start()` / `.destroy()`.
- Its loop never rests (a drifting layer has no idle); it is the only effect that keeps
  requesting frames while nothing is happening — `destroy()` it where that matters.

### 7 · Cute-chrome touches — `cute_chrome.css`

Drop-in CSS, mostly global:

- Pastel `::selection`.
- `.stp-wobble` — add to buttons/links for a gentle hover wobble (±2°, scale
  ≤ 1.03, 0.35 s; only where `(hover: hover) and (pointer: fine)`).
- `.stp-spinner` — `<span class="stp-spinner"></span>` is a kawaii 3-dot loader.
- Pastel custom scrollbar (WebKit/Blink + Firefox `scrollbar-color`).
- The `--stp-c1…c5` palette tokens (see Color palette) drive all three of the above.
- All motion is wrapped in `@media (prefers-reduced-motion: no-preference)`.

### 8 · Cute sounds — `cute_sounds.js`

Tiny synthesized sounds from WebAudio oscillators and gain envelopes — **no audio files**. They are
**off until the visitor switches them on**, and no `AudioContext` exists before that opt-in click.

- **The switch.** A round speaker button (bottom-left) is rendered for you; or mark your own element
  `data-sound-toggle` (an empty one gets the speaker icon; every one gets `aria-pressed`). The first click builds
  the one `AudioContext` and plays a small confirmation; later toggles reuse it. The choice is remembered in
  `localStorage` (`stp:sound`, inside try/catch); when "on" was remembered, the context is still not made at load but
  by the first sound (browsers want a user gesture anyway).
- **One voice per palette** (`<html data-palette>`, read each time a sound plays): `meadow` = triangle ·
  `neon` = sine, slightly detuned · `candy` = soft square (low gain, low-passed). Peak gain is ≤ 0.08 —
  the detuned neon pair feeds one gain node, so each of its two oscillators gets half to keep the sum there.
- **Sounds:** `chime` (a stamp landing; a `[data-confetti]` burst), `tick` (a click on `[data-celebrate]`, which then
  chimes with its burst), `twinkle` (the secret-word party), `on` (the confirmation). The click hooks only fire while
  `click_confetti.js` is running (`clickConfetti.active()`; after `destroy()` they are silent) and follow its rule (`data-confetti-on` selector, else `[data-celebrate], [data-confetti]`);
  `data-confetti-on="*"` does **not** make every click chime.
- **Reduced motion:** sound is not motion, so `prefers-reduced-motion` does not mute it — the visitor's own switch does.
  (A stamp chimes immediately instead of on the landing under reduced motion.)
- `SparkleThatPage.sounds` = `{ play(name), enabled(), setEnabled(bool), start(), destroy() }`. `play()` returns `true` when
  it scheduled a sound, `false` when sound is off / destroyed / the name is unknown. `destroy()` removes the button and
  closes the context. The button is styled inline (it works without `cute_chrome.css`).
- **Gotcha — taste.** Sound the visitor didn't ask for is the fastest way to be closed. Keep it opt-in, keep it quiet.

### 9 · Secret word — `secret_word.js`

Type a secret word anywhere on the page and it throws a little party: a big confetti burst, a status line and (if
sound is on) the twinkle. A wink for the curious, not a feature to explain.

- `data-secret` on `<html>` sets the word (default `magic`, case-insensitive, read at every key press).
- **Never while writing:** ignored inside text inputs, textareas, selects and contenteditable (also inside an open
  shadow root; a closed one hides its field from the page), and with Ctrl / Cmd /
  Alt held; typing in a field also forgets the letters typed so far. (Checkboxes and buttons don't count as fields.)
- **Confetti:** calls `SparkleThatPage.clickConfetti.burst()` from three points when `click_confetti.js` is running
  (`clickConfetti.active()`); otherwise (or if it was destroyed) a small self-contained canvas draws it and removes
  itself when empty.
- **Reduced motion:** no confetti — one calm message in a `role="status"` line (bottom-centre), then it goes away.
- `SparkleThatPage.secretWord` = `{ party(), finale(msg), start(), destroy() }`. **`finale(msg)` is the hook for
  "the visitor finished everything"** — call it from your own code (last task ticked, last step done): about two seconds
  of confetti waves, a chime + twinkle and `msg` (default "All done — well done!") in the status line. Both do nothing
  while destroyed.

### 10 · Sky switch — `sky_switch.js` + a head snippet

A sun / moon button that flips the page between light and dark and **never flashes the wrong theme**. The theme
lives on `<html data-theme="light|dark">`; your CSS styles itself from that attribute. Two parts, and the first one
is the point:

1. **The snippet, pasted into `<head>` before any stylesheet.** It runs synchronously before first paint, reads the saved
   choice (`localStorage` key `stp:theme`, in try/catch) or falls back to `prefers-color-scheme`, and sets the attribute:

   ```html
   <script>(function(){var r=document.documentElement,c=r.getAttribute("data-theme"),t;if(c&&c!=="light"&&c!=="dark")return;try{t=localStorage.getItem("stp:theme")}catch(e){}if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";r.setAttribute("data-theme",t)})()</script>
   ```

   Do **not** `defer` it or move it to the end of `<body>` — that is exactly the flash. (`sky_switch.js` also sets the
   attribute if the snippet is missing, but by then the first frame may already be painted in the wrong theme.)
2. **`sky_switch.js`** (anywhere) renders the button — `class="stp-sky"`, top-left, `aria-label="Dark mode"`,
   `aria-pressed` (true = dark) — flips the attribute on click and saves it. Or mark your own element `data-sky-toggle`.
   Both glyphs are in the button and the JS hides the unused one, so it works without `cute_chrome.css`; the stylesheet
   adds the round look and a small crossfade (only under `prefers-reduced-motion: no-preference`).

- **Style the page from the attribute**, and set `color-scheme` so form controls follow:
  `[data-theme="dark"] { color-scheme: dark; --bg: …; }`. Give cards and panels their own dark backgrounds, not just
  the page (light cards under light text are unreadable). `demo.html` shows the pattern with CSS variables.
- **No saved choice:** the page follows the computer's light / dark setting, live, until the visitor presses the button.
- **Your own theme names are left alone.** If `<html data-theme>` already holds something other than `light` / `dark`
  (daisyUI's `cupcake`, a Tailwind theme, …), neither the head snippet nor `sky_switch.js` touches it on load or when the
  computer's setting changes. Only a press of the toggle — an explicit choice — replaces it with `light` or `dark`; if your CSS
  does not style those two values, do not add the toggle to that page.
- Fires a `stp:theme` event on `<html>` (`detail` = `"light"` / `"dark"`).
- `SparkleThatPage.skySwitch` = `{ theme(), set("light"|"dark"), start(), destroy() }`. `destroy()` removes the button and
  listeners but leaves `data-theme` alone (it is page state).
- **Known limit:** `cute_chrome.css` keeps its pastel-on-white scrollbar in dark mode; restyle it from `[data-theme="dark"]`
  if you want it to match.

## Global constraints (baked into every effect — keep them)

- **`prefers-reduced-motion: reduce` disables/reduces every motion effect**
  (JS-guarded via `matchMedia` + CSS `@media`). Click confetti is "fewer and
  gentler, not zero": one glyph fades in place (~400 ms) instead of a burst.
- **Delight budget (Step 0):** confetti fires only on opted-in elements by
  default, the trail is sparse by default, the wobble is near-imperceptible and
  mouse-only. Dense / every-click modes are explicit opt-ins.
- All overlays are **`pointer-events: none`** — effects never block clicks,
  selection, or scrolling.
- Pointer-following effects (cursor, trail) **no-op on touch / coarse pointers**
  (`matchMedia('(pointer: fine)')`).
- Particle pools are **capped**, animation is **rAF-driven** and **time-based**
  (rAF timestamp, step clamped to 3 frames — same speed on 60 and 120 Hz),
  listeners are `passive`, and only `transform`/`opacity` are animated (plus the
  scroll ring's `stroke-dashoffset`, on a 48 px SVG). The confetti canvas is
  scaled by `devicePixelRatio`.
- Each JS effect auto-starts on load and registers `start()` and a **teardown** on a shared
  registry: `window.SparkleThatPage.<name>.start()` / `.destroy()` (for SPA route changes, a
  settings toggle). `start()` is idempotent and keeps the guards above; `destroy()` then
  `start()` brings the effect back. Keys: `fairyCursor`, `sparkleTrail`, `scrollIndicator`,
  `tabPeekaboo`, `clickConfetti` (also `.burst(x, y)` and `.active()`), `ambientFloaters`, `sounds`, `secretWord`, `skySwitch`.
- **Idle means idle:** the sparkle trail and the confetti canvas stop requesting animation
  frames when nothing is moving; only the ambient floaters (a drifting layer by design) keep a
  `requestAnimationFrame` loop. (The scroll ring's idle bob is an endless transform animation run by the browser.)
- **z-index map:** ambient floaters `0` (behind content); trail `2147483600`; scroll indicator
  `2147483601`; confetti canvas and the stamp `2147483602`; the sound / sky buttons and the secret-word
  status line `2147483603`.

## Verify — at real interaction, in a real browser

Like the favicon skill's "file previews lie" rule, but harder: a `cursor:url()`
and rAF sparkle trails are nearly invisible to DOM snapshots. Open
`examples/demo.html` (it composes the effects with toggles, a palette selector, and
variant dropdowns — it's both the showcase and the verify tool) and check:

- [ ] Each effect turns on/off; variants and palettes switch live.
- [ ] Fairy cursor on: hover the link / a button / the checkbox in the "glow" section — the
      wand lights up over them and is plain over text.
- [ ] Click confetti on: click the **Mark done** / **Pay invoice** buttons — a rotated stamp
      lands with a squash and confetti bursts; the stamp removes itself after ~1.6 s.
- [ ] Scroll indicator on: scroll to the very bottom — it cheers and has class `is-end`; scroll up, it clears.
- [ ] Trail idle: with the trail on and the mouse still, DevTools shows no animation-frame
      activity once the dust has faded (`node tests/sparkle_smoke.mjs` checks this and the rest).
- [ ] Clicks and scrolling are **not** blocked anywhere (overlays are
      `pointer-events:none`).
- [ ] `prefers-reduced-motion: reduce` → trail / floaters suppress; confetti
      shows one fading glyph per click; a stamp appears without slam or confetti; the
      scroll indicator still tracks and still flips `is-end`.
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

`examples/` ships twelve files — ten effect files, the live demo and the wand gallery. Every `.js` file auto-starts and
exposes `start()` / `destroy()` on `window.SparkleThatPage.<name>`:

| File | Effect | Key `data-*` |
|---|---|---|
| `fairy_cursor.js` | wand cursor + glowing wand over clickables; light/dark from the page | `data-wand` (star/magical/wizard/garden/cosmic/candy/crystal/moon/ocean/lollipop/pixel), `data-wand-palette`; `--stp-wand`, `--stp-wand-link` |
| `sparkle_trail.js` | mouse trail | `data-trail` (sparkle/star/heart/pixel/fairydust), `data-trail-density` (storm), `data-palette` |
| `scroll_indicator.js` | scroll depth; cheers (`is-end`) at the bottom | `data-scroll` (ring/comet/mascot) |
| `tab_title_peekaboo.js` | tab blur message | `data-peekaboo-msg`, `data-peekaboo-favicon` |
| `click_confetti.js` | click burst + rubber-stamp | `data-stamp` (label text; default "Done!"), `data-confetti` (heart/star/confetti/petal/pixel), `data-confetti-on` (`*` = every click; default `[data-celebrate], [data-confetti]`), `data-palette` |
| `ambient_floaters.js` | background layer | `data-floaters` (sakura/leaves/snowflake/bubbles/dust/fairydust), `data-floaters-count`, `data-palette` |
| `cute_sounds.js` | opt-in synthesized sounds (`SparkleThatPage.sounds`) | `data-sound-toggle` (your own switch), `data-palette` (the voice); `localStorage` `stp:sound` |
| `secret_word.js` | typed secret word → party; `finale()` hook (`SparkleThatPage.secretWord`) | `data-secret` (default `magic`) |
| `sky_switch.js` | sun / moon theme toggle (`SparkleThatPage.skySwitch`) + the no-flash `<head>` snippet (section 10) | `data-sky-toggle` (your own switch); sets `<html data-theme>`; `localStorage` `stp:theme` |
| `cute_chrome.css` | selection/wobble/spinner/scrollbar + palette tokens + the sky switch's look | `.stp-wobble`, `.stp-spinner` classes, `--stp-c1…c5` |
| `references/wands.md` (next to `examples/`) | how to draw a wand cursor: anatomy, quality bar, the 11 families and their small-size traps, palette rules, sources to study with licences | — |
| `demo.html` | live showcase + verify tool (stamp buttons, a link to hover for the glow, room to scroll to the bottom, the speaker + sun/moon toggles, the secret word; themed from `data-theme`) | — |
| `wands.html` | the wand gallery: all 11 families × 3 palettes on light, dark and the page's own theme, plain and glowing; hover a card to wear that wand | `data-wand`, `data-wand-palette` (set on hover) |

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

- **v1.3.0** (2026-11-11) — Wands that point the way. The wand cursor is redrawn as
  11 families with different silhouettes (star, magical, wizard, garden, cosmic, candy,
  crystal, moon, ocean, lollipop, pixel), 3 palettes each (`data-wand-palette`), 40 px
  with the click point on the gem and a brighter twin over clickables. The outline
  follows the page, not the system: `data-theme`, then the page background, then the
  colour scheme, the same rule as the trail, repainted live. A page's own
  `--stp-wand` art is never overwritten. Old names still work. New
  `references/wands.md` teaches an agent the anatomy, the families, the quality bar and
  where to look (licences checked at the source). New `examples/wands.html` shows all
  33 wands on light and dark pages; hover one to wear it. New `data-trail="glints"`:
  two-grain fairy dust (motes + twinkling four-point glints) with light and dark
  palettes, safe under a strict CSP. Ideas from morning-fairy's per-world wands.
- **v1.2.0** (2026-11-06) — Ideas back from pomodo, which ships 6 of these effects, plus
  three new effects. Every effect keeps starting on load and gains `start()` next to
  `destroy()` (idempotent; scripts in `<head>` wait for the body). The trail stops its
  animation loop when no dust is moving. The wand glows over things you can click
  (base wand set inline, so a strict CSP only loses the glow). The scroll buddy cheers
  at the bottom (`is-end`). New `data-stamp="Done!"`: a rubber stamp lands with a
  burst and stays on its button while you scroll; `clickConfetti.active()`. New
  `cute_sounds.js` (oscillators only, no AudioContext before the opt-in click, one
  voice per palette), `secret_word.js` (type "magic" for a party; `finale()`), and
  `sky_switch.js` with a no-flash `<head>` snippet that leaves other `data-theme`
  values alone. The browser smoke test grows from 6 to 70 assertions, each new one
  shown to fail when its feature is broken.
- **v1.1.0** (2026-10-28) — Delight budget + animation fixes. New "Step 0 · how
  often will it fire?" (frequency gate, credited to `animate` in
  emilkowalski/skills). Click confetti now fires only on `[data-celebrate],
  [data-confetti]` by default (`data-confetti-on="*"` = every click) and shows a
  single fading glyph under reduced motion; sparkle trail is sparse by default
  (`data-trail-density="storm"` restores the old rate); `.stp-wobble` is gentler
  and hover-gated. Scroll comet/mascot animate `transform` only; confetti canvas
  honors `devicePixelRatio`; confetti / trail / floaters physics is time-based
  (no 2× speed on 120 Hz); palettes come from `--stp-c1…c5` CSS tokens with the
  JS arrays as fallback.
- **v1.0.0** (2026-06-17) — Initial skill: 7 zero-dependency page effects
  (fairy-wand cursor, sparkle trail, scroll-depth indicator, tab-title
  peekaboo, click confetti, ambient floaters, cute-chrome touches), each with
  variants incl. pixel-art; a `candy`/`neon`/`meadow` palette system; a live
  `demo.html`; and a baked-in `prefers-reduced-motion` / touch-no-op / teardown
  accessibility contract.
