# Sparkle That Page — landing site

Two static landing-page directions for the **sparkle-that-page** plugin, recreated from the
design handoff in `docs/design-handoff/design_handoff_sparkle_landing/`. Both market the same
product and **demonstrate it on themselves** by running the real effects live.

| File | Direction | Look |
|---|---|---|
| `index.html` | **Chooser** | the front door — pick-your-vibe splash linking both directions + the raw effects demo |
| `aurora.html` | **A — Aurora** | dark / galaxy. Nav · hero (fairy-cat mascot on a glowing mushroom + gradient wordmark, scroll-fade) · scroll-mask pillars · auto-scroll marquee · **interactive playground** · sticky stacking cards · stats · final CTA |
| `bubblegum.html` | **B — Bubblegum** | bright / candy. Color-crossfade carousel · scroll-mask pillars · mascot · features grid · install band |

The two directions cross-link via the pill switcher (bottom-center on Aurora, top-center on Bubblegum); the chooser links into both.

## How the live effects work

The pages drive the repo's **real, shipped effect modules** in
`plugins/sparkle-that-page/skills/sparkle-that-page/examples/` — **not** the prototype's
`sparkle-fx.js`. Those modules are auto-init IIFEs configured by `<html data-*>` that register
`window.SparkleThatPage.<name>.destroy()`. `sparkle-bridge.js` drives them exactly the way the
repo's own `examples/demo.html` does:

```
set data-* on <html>  →  inject the module <script>  →  call .destroy() to stop
```

- **`sparkle-bridge.js`** — the only glue: `startFx`/`stopFx` (set `data-*` + inject/destroy),
  `EFFECT_SPECS` (variant translation), and the prototype-only `magnetic()` helper.
- **`icons.js`** — the crafted CSS-icon set from the handoff bundle (pure shapes, no emoji).
- **`cute_chrome.css`** — loaded directly from the repo's `examples/` (selection / scrollbar /
  spinner / wobble).

## Running / deploying

Serve from **at or above the repo root** so the repo-relative module paths resolve:

```
python3 -m http.server 8137      # then open http://localhost:8137/site/  (or /site/bubblegum.html)
```

**Live deploy — GitHub Pages** (`.github/workflows/pages.yml`, on push to `main`). The workflow
mirrors the repo layout into `_site` rather than flattening — `site/` and the canonical
`plugins/.../examples/` modules stay **siblings**, so `sparkle-bridge.js`'s `EFFECTS_DIR`
(`../plugins/...`) and each page's `cute_chrome.css` link resolve unchanged. Root `/` redirects
to the chooser (`/site/`); `/demo.html` redirects to the raw effects demo. Single source of
truth — the modules are referenced in place, never copied into `site/`. If the site ever needs
to ship **standalone**, copy the six `examples/*.js` + `cute_chrome.css` into `site/assets/` and
repoint `EFFECTS_DIR` in `sparkle-bridge.js`.

## Deliberate mappings

The repo modules don't 1:1 match the prototype's factory API, so the bridge translates:

| Prototype | Repo `data-*` | Note |
|---|---|---|
| fairy cursor `crystal` | `data-wand=pixel` | no crystal wand ships in the module |
| floaters `stars` / `snow` | `data-floaters=dust` / `snowflake` | nearest shipped variants |
| scroll `cat` | `data-scroll=mascot` | the corner buddy on a rail |
| tab moods shy/love/sleepy/ghost | `data-peekaboo-msg` + `-favicon` presets | the module takes a message + emoji |
| custom "galaxy" colors | `data-palette=candy` | the modules ship candy/neon/meadow only; page chrome uses exact galaxy hex, particles use candy (unmodified modules) |

## Verification

Driven over a local server with Playwright. The headless backend couldn't encode screenshots of
the heavy backdrop-blur compositing (fixed 5 s cap), so verification was done by **asserting the
wiring and layout directly** instead:

- `window.SparkleThatPage` holds exactly the expected modules per page (Aurora defaults →
  `sparkleTrail, clickConfetti, ambientFloaters, scrollIndicator, tabPeekaboo`, cursor off;
  Bubblegum → `sparkleTrail, clickConfetti, scrollIndicator, tabPeekaboo`).
- Playground: toggling Fairy cursor ON injects `fairyCursor` live; switching its variant
  re-injects with exactly one script (no stranded duplicates); toggling Sparkle trail OFF
  removes it.
- Layout: no horizontal overflow, full-viewport hero, gradient wordmark clipped, fonts loaded,
  all sections built/positioned, zero console errors on both pages.
