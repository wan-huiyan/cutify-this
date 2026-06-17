# sparkle-that-page + cutify-this bundle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `sparkle-that-page` companion skill (7 zero-dependency cute page effects) to the repo, rebrand the repo into the `cutify-this` 2-plugin bundle, and ship a live GitHub Pages demo.

**Architecture:** The repo becomes a 2-plugin marketplace (`wan-huiyan-cutify-this`). The existing `cutify-that-tab` favicon plugin is unchanged in behaviour. The new `sparkle-that-page` plugin ships one self-contained vanilla-JS/CSS snippet per effect under `examples/`, a single `demo.html` that composes them (also the Pages site), and a `SKILL.md` that teaches the recipes. No build step, no dependencies.

**Tech Stack:** Vanilla ES5/ES6 JS (IIFE, no modules, no deps), CSS, SVG data-URIs, GitHub Actions (Pages), Claude Code plugin/marketplace JSON manifests.

## Global Constraints

Copy these into every effect file; they are the skill's non-negotiable contract:

- **Zero dependencies, no build step.** Each effect is one self-contained file you paste/include. No npm, no bundler, no framework.
- **`prefers-reduced-motion: reduce` → disable/reduce motion.** Guard every animation with `matchMedia('(prefers-reduced-motion: reduce)').matches` (JS) and/or `@media (prefers-reduced-motion: reduce)` (CSS).
- **Overlays are `pointer-events: none`.** No effect may block clicks, selection, or scrolling.
- **Pointer-following effects no-op on touch / coarse pointers** via `matchMedia('(pointer: fine)').matches`.
- **Particle counts capped; rAF-driven; `passive: true` scroll/mouse listeners; animate via `transform`/`opacity` only.**
- **Each JS effect registers a teardown** on a shared registry: `window.SparkleThatPage = window.SparkleThatPage || {}; SparkleThatPage.<name> = { destroy(){...} }` for SPA cleanup.
- **z-index convention:** ambient floaters `0` (behind content via a fixed layer with negative-ish stacking), trails/confetti/scroll-indicator `2147483600+` (above content, below dev overlays).
- **Naming/author:** author is "Huiyan" (one word). New plugin version starts at `1.0.0`.
- **Repo after rebrand:** `wan-huiyan/cutify-this`; marketplace name `wan-huiyan-cutify-this`; favicon plugin keeps its name `cutify-that-tab` and is bumped to `1.11.0` to resolve pre-existing version drift.

---

## File structure

```
.claude-plugin/marketplace.json          # MODIFY: rename, add 2nd plugin, bump cutify-that-tab→1.11.0
.github/workflows/pages.yml              # CREATE: deploy demo to Pages
plugins/cutify-that-tab/.claude-plugin/plugin.json   # MODIFY: version 1.10.0→1.11.0, repo URL
plugins/sparkle-that-page/
  .claude-plugin/plugin.json             # CREATE: v1.0.0
  skills/sparkle-that-page/
    SKILL.md                             # CREATE: the skill
    examples/
      fairy_cursor.js                    # CREATE
      sparkle_trail.js                   # CREATE
      scroll_indicator.js                # CREATE
      tab_title_peekaboo.js              # CREATE
      click_confetti.js                  # CREATE
      ambient_floaters.js                # CREATE
      cute_chrome.css                    # CREATE
      demo.html                          # CREATE: composes all 7, also the Pages index
README.md                                # MODIFY: rebrand to bundle, both skills, install cmds
```

Each effect file is a complete, paste-ready unit. `demo.html` includes the effect files via relative `<script>`/`<link>` so there is **one source of truth** per effect. The Pages workflow copies `demo.html` + the effect files into the publish artifact, renaming `demo.html` → `index.html`.

---

### Task 1: Scaffold the `sparkle-that-page` plugin + register the bundle + fix version drift

**Files:**
- Create: `plugins/sparkle-that-page/.claude-plugin/plugin.json`
- Create (empty dir marker): `plugins/sparkle-that-page/skills/sparkle-that-page/examples/.gitkeep`
- Modify: `.claude-plugin/marketplace.json`
- Modify: `plugins/cutify-that-tab/.claude-plugin/plugin.json:4` (version) + repository field

**Interfaces:**
- Produces: the marketplace now lists two plugins, `cutify-that-tab` and `sparkle-that-page`, both resolvable by `/plugin install <name>@wan-huiyan-cutify-this`.

- [ ] **Step 1: Create the new plugin manifest**

`plugins/sparkle-that-page/.claude-plugin/plugin.json`:
```json
{
  "name": "sparkle-that-page",
  "description": "Add cute, zero-dependency page effects to a web app: a fairy-wand custom cursor, sparkle trail on mouse move + click, an animated floating scroll-depth/progress indicator, tab-title peekaboo, click confetti / heart burst, ambient floaters (petals/bubbles/snow), and cute-chrome touches (::selection, wobble hover, kawaii spinner). Pixel-art style variant on each.",
  "version": "1.0.0",
  "author": { "name": "Huiyan Wan" },
  "repository": "https://github.com/wan-huiyan/cutify-this",
  "license": "MIT",
  "keywords": ["claude-code", "claude-code-skill", "cursor", "sparkle", "scroll-progress", "confetti", "animation", "pixel-art", "frontend", "cute"]
}
```

- [ ] **Step 2: Rebrand + extend the marketplace manifest**

Replace `.claude-plugin/marketplace.json` with:
```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "wan-huiyan-cutify-this",
  "description": "cutify-this — a bundle of cute web skills. Cutify the browser tab (hand-authored SVG favicons) and sparkle up the whole page (fairy cursor, sparkle trails, scroll progress, confetti, floaters).",
  "owner": { "name": "Huiyan Wan" },
  "plugins": [
    {
      "name": "cutify-that-tab",
      "source": "./plugins/cutify-that-tab",
      "description": "Add a cute SVG favicon: emoji, gradient blob, or 16×16 pixel-art mascot. 56 pixel-art mascots + 22 emotion gradient blobs.",
      "version": "1.11.0"
    },
    {
      "name": "sparkle-that-page",
      "source": "./plugins/sparkle-that-page",
      "description": "Cute zero-dep page effects: fairy-wand cursor, sparkle trail, animated scroll-depth indicator, tab-title peekaboo, click confetti, ambient floaters, cute-chrome touches. Pixel-art variant on each.",
      "version": "1.0.0"
    }
  ]
}
```

- [ ] **Step 3: Fix the favicon plugin's version drift**

In `plugins/cutify-that-tab/.claude-plugin/plugin.json`: change `"version": "1.10.0"` → `"version": "1.11.0"` and `"repository": "https://github.com/wan-huiyan/cutify-that-tab"` → `"https://github.com/wan-huiyan/cutify-this"`. (SKILL.md + README already document v1.11.0; this makes the manifests agree.)

- [ ] **Step 4: Create the examples dir placeholder**

```bash
mkdir -p plugins/sparkle-that-page/skills/sparkle-that-page/examples
touch plugins/sparkle-that-page/skills/sparkle-that-page/examples/.gitkeep
```

- [ ] **Step 5: Verify both manifests parse and the marketplace lists two plugins**

Run:
```bash
python3 -c "import json; m=json.load(open('.claude-plugin/marketplace.json')); print('marketplace', m['name'], [p['name'] for p in m['plugins']]); assert m['name']=='wan-huiyan-cutify-this'; assert len(m['plugins'])==2"
python3 -c "import json; p=json.load(open('plugins/sparkle-that-page/.claude-plugin/plugin.json')); assert p['name']=='sparkle-that-page' and p['version']=='1.0.0'; print('plugin ok')"
python3 -c "import json; p=json.load(open('plugins/cutify-that-tab/.claude-plugin/plugin.json')); assert p['version']=='1.11.0'; print('favicon bumped ok')"
```
Expected: prints `marketplace wan-huiyan-cutify-this ['cutify-that-tab', 'sparkle-that-page']`, `plugin ok`, `favicon bumped ok`; no AssertionError.

- [ ] **Step 6: Commit**

```bash
git add .claude-plugin/marketplace.json plugins/sparkle-that-page/.claude-plugin/plugin.json plugins/cutify-that-tab/.claude-plugin/plugin.json plugins/sparkle-that-page/skills/sparkle-that-page/examples/.gitkeep
git commit -m "feat: scaffold sparkle-that-page plugin + rebrand marketplace to cutify-this"
```

---

### Task 2: `fairy_cursor.js` — custom wand cursor

**Files:**
- Create: `plugins/sparkle-that-page/skills/sparkle-that-page/examples/fairy_cursor.js`

**Interfaces:**
- Produces: including this script sets `document.documentElement.style.cursor` to a wand SVG. Reads variant from `<html data-wand="star|heart|moon|pixel">` (default `star`). Registers `SparkleThatPage.fairyCursor.destroy()` which restores the cursor.

- [ ] **Step 1: Write the effect**

```js
/* fairy_cursor.js — sparkle-that-page
 * Use:  <script src="fairy_cursor.js"></script>
 * Pick a wand: <html data-wand="star">  (star | heart | moon | pixel)
 * No-op on touch/coarse pointers. Static image, so reduced-motion is unaffected. */
(function () {
  "use strict";
  if (!matchMedia("(pointer: fine)").matches) return; // touch: keep native cursor

  var WANDS = {
    star: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="7" y1="25" x2="22" y2="10" stroke="#c084fc" stroke-width="3" stroke-linecap="round"/><path d="M24 3l1.7 3.7 4 .4-3 2.7.9 4-3.6-2.1-3.6 2.1.9-4-3-2.7 4-.4z" fill="#fde047" stroke="#f59e0b" stroke-width=".7"/></svg>',
    heart: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="7" y1="25" x2="21" y2="11" stroke="#f9a8d4" stroke-width="3" stroke-linecap="round"/><path d="M24 4c-1.4-1.6-4-1-4 1.3 0 2 2.6 3.6 4 4.7 1.4-1.1 4-2.7 4-4.7 0-2.3-2.6-2.9-4-1.3z" fill="#f472b6" stroke="#db2777" stroke-width=".7"/></svg>',
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="7" y1="25" x2="21" y2="11" stroke="#a5b4fc" stroke-width="3" stroke-linecap="round"/><path d="M27 7a5 5 0 1 0 0 6 4 4 0 0 1 0-6z" fill="#fde68a" stroke="#f59e0b" stroke-width=".7"/></svg>',
    pixel: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="11" width="2" height="2" fill="#c084fc"/><rect x="5" y="9" width="2" height="2" fill="#c084fc"/><rect x="7" y="7" width="2" height="2" fill="#c084fc"/><rect x="10" y="2" width="2" height="2" fill="#fde047"/><rect x="9" y="3" width="4" height="2" fill="#fde047"/><rect x="10" y="5" width="2" height="1" fill="#fde047"/><rect x="9" y="1" width="2" height="1" fill="#fde047"/></svg>'
  };
  var variant = (document.documentElement.dataset.wand || "star");
  var svg = WANDS[variant] || WANDS.star;
  var uri = "data:image/svg+xml," + encodeURIComponent(svg);
  var prev = document.documentElement.style.cursor;
  // Hotspot at the wand's star/tip (top-right of the 32px image).
  document.documentElement.style.cursor = 'url("' + uri + '") 26 5, auto';

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.fairyCursor = { destroy: function () { document.documentElement.style.cursor = prev; } };
})();
```

- [ ] **Step 2: Verify it loads and sets the cursor (programmatic gate)**

Create a throwaway `/tmp/stp_cursor.html`:
```html
<!doctype html><html data-wand="star"><body style="height:200vh"><script src="file:///ABS/PATH/fairy_cursor.js"></script></body></html>
```
Open with Playwright MCP (`browser_navigate` to the file URL), then:
- `browser_console_messages` → expect **no errors**.
- `browser_evaluate` `() => getComputedStyle(document.documentElement).cursor` → expect a string starting with `url("data:image/svg+xml`.
- `browser_evaluate` `() => !!window.SparkleThatPage.fairyCursor` → `true`.

Eyeball: the cursor is a wand. (True cuteness verified at the demo stage.)

- [ ] **Step 3: Commit**

```bash
git add plugins/sparkle-that-page/skills/sparkle-that-page/examples/fairy_cursor.js
git commit -m "feat(sparkle): fairy-wand cursor (star/heart/moon/pixel)"
```

---

### Task 3: `sparkle_trail.js` — sparkles on move + click

**Files:**
- Create: `plugins/sparkle-that-page/skills/sparkle-that-page/examples/sparkle_trail.js`

**Interfaces:**
- Produces: a fixed `pointer-events:none` overlay; sparkles spawn on `mousemove` (rAF-throttled) and burst on `click`. Variant from `<html data-trail="sparkle|star|heart|pixel">`. Registers `SparkleThatPage.sparkleTrail.destroy()`.

- [ ] **Step 1: Write the effect**

```js
/* sparkle_trail.js — sparkle-that-page
 * Use: <script src="sparkle_trail.js"></script>   Variant: <html data-trail="sparkle">
 * No-op on touch + on reduced-motion. Capped particle pool, rAF-driven. */
(function () {
  "use strict";
  if (!matchMedia("(pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var GLYPH = { sparkle: "✦", star: "★", heart: "♥", pixel: "✦" };
  var COLOR = { sparkle: "#fde047", star: "#facc15", heart: "#f472b6", pixel: "#c084fc" };
  var variant = document.documentElement.dataset.trail || "sparkle";
  var glyph = GLYPH[variant] || GLYPH.sparkle, color = COLOR[variant] || COLOR.sparkle;

  var layer = document.createElement("div");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483600;overflow:hidden";
  document.body.appendChild(layer);

  var MAX = 80, pool = [], live = [];
  for (var i = 0; i < MAX; i++) {
    var s = document.createElement("span");
    s.textContent = glyph;
    s.style.cssText = "position:absolute;will-change:transform,opacity;font-size:14px;color:" + color + ";opacity:0;transform:translate(-50%,-50%)";
    if (variant === "pixel") s.style.fontFamily = "monospace";
    layer.appendChild(s); pool.push(s);
  }
  function spawn(x, y, n, spread) {
    for (var k = 0; k < n && pool.length; k++) {
      var el = pool.pop();
      var ang = Math.random() * Math.PI * 2, dist = Math.random() * spread;
      live.push({ el: el, x: x, y: y, vx: Math.cos(ang) * dist, vy: Math.sin(ang) * dist - 0.4, life: 0, ttl: 36 + Math.random() * 20, rot: Math.random() * 360 });
      el.style.opacity = "1";
    }
  }
  var lastMove = 0, mx = 0, my = 0, moved = false;
  addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; moved = true; }, { passive: true });
  addEventListener("click", function (e) { spawn(e.clientX, e.clientY, 14, 6); }, { passive: true });

  var raf;
  function tick() {
    if (moved && performance.now() - lastMove > 16) { spawn(mx, my, 2, 2); lastMove = performance.now(); moved = false; }
    for (var i = live.length - 1; i >= 0; i--) {
      var p = live[i]; p.life++; p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.96;
      var t = p.life / p.ttl;
      p.el.style.transform = "translate(" + p.x + "px," + p.y + "px) scale(" + (1 - t) + ") rotate(" + p.rot + "deg)";
      p.el.style.opacity = String(1 - t);
      if (p.life >= p.ttl) { p.el.style.opacity = "0"; pool.push(p.el); live.splice(i, 1); }
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.sparkleTrail = { destroy: function () { cancelAnimationFrame(raf); layer.remove(); } };
})();
```

- [ ] **Step 2: Verify (programmatic gate)**

Throwaway HTML including the script. With Playwright:
- `browser_console_messages` → no errors.
- `browser_evaluate` move sequence: dispatch `mousemove` then a `click`, then assert `() => window.SparkleThatPage.sparkleTrail && document.querySelectorAll('span').length >= 80` (pool created).
- Confirm the overlay does not block clicks: `browser_evaluate` `() => { const o=document.elementFromPoint(5,5); return o && o.tagName!=='SPAN'; }` over the layer area → underlying element reachable (layer is `pointer-events:none`).

- [ ] **Step 3: Commit**
```bash
git add plugins/sparkle-that-page/skills/sparkle-that-page/examples/sparkle_trail.js
git commit -m "feat(sparkle): sparkle trail on move + click (sparkle/star/heart/pixel)"
```

---

### Task 4: `scroll_indicator.js` — animated floating scroll-depth indicator

**Files:**
- Create: `plugins/sparkle-that-page/skills/sparkle-that-page/examples/scroll_indicator.js`

**Interfaces:**
- Produces: a fixed floating indicator reflecting `scrollTop/(scrollHeight-innerHeight)`. Variant from `<html data-scroll="ring|comet|mascot">` (default `ring`). Registers `SparkleThatPage.scrollIndicator.destroy()`.

- [ ] **Step 1: Write the effect**

```js
/* scroll_indicator.js — sparkle-that-page
 * Use: <script src="scroll_indicator.js"></script>   Variant: <html data-scroll="ring">
 * ring = filling % ring (bottom-right), comet = top progress bar with a sparkle head,
 * mascot = a little face that climbs a rail on the right. Idle bob unless reduced-motion. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var variant = document.documentElement.dataset.scroll || "ring";
  var el, raf, ring, label, bar, head, mascot;

  if (variant === "comet") {
    el = document.createElement("div");
    el.style.cssText = "position:fixed;top:0;left:0;height:4px;width:0;z-index:2147483601;background:linear-gradient(90deg,#f9a8d4,#c084fc,#a5b4fc);pointer-events:none;border-radius:0 3px 3px 0";
    head = document.createElement("span"); head.textContent = "✦";
    head.style.cssText = "position:absolute;right:-7px;top:-7px;font-size:14px;color:#fde047";
    el.appendChild(head); document.body.appendChild(el);
  } else if (variant === "mascot") {
    el = document.createElement("div");
    el.style.cssText = "position:fixed;right:10px;top:0;width:30px;height:30px;z-index:2147483601;pointer-events:none;transition:top .08s linear";
    el.innerHTML = '<svg width="30" height="30" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="3" width="2" height="2" fill="#fda4af"/><rect x="11" y="3" width="2" height="2" fill="#fda4af"/><rect x="3" y="5" width="10" height="9" fill="#fff" stroke="#f9a8d4" stroke-width=".4"/><rect x="5" y="8" width="1" height="2" fill="#1f2937"/><rect x="10" y="8" width="1" height="2" fill="#1f2937"/><rect x="7" y="10" width="2" height="1" fill="#1f2937"/></svg>';
    mascot = el; document.body.appendChild(el);
  } else { // ring
    el = document.createElement("div");
    el.style.cssText = "position:fixed;right:16px;bottom:16px;width:48px;height:48px;z-index:2147483601;pointer-events:none";
    el.innerHTML = '<svg width="48" height="48" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="#f3e8ff" stroke-width="4"/><circle id="stp-ring" cx="18" cy="18" r="15" fill="none" stroke="#c084fc" stroke-width="4" stroke-linecap="round" stroke-dasharray="94.2" stroke-dashoffset="94.2" transform="rotate(-90 18 18)"/></svg><span id="stp-pct" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 11px system-ui;color:#a855f7">0%</span>';
    ring = el.querySelector("#stp-ring"); label = el.querySelector("#stp-pct"); document.body.appendChild(el);
    if (!reduce) { el.animate([{ transform: "translateY(0)" }, { transform: "translateY(-3px)" }, { transform: "translateY(0)" }], { duration: 2600, iterations: Infinity }); }
  }

  function pct() { var h = document.documentElement.scrollHeight - innerHeight; return h <= 0 ? 0 : Math.min(1, Math.max(0, scrollY / h)); }
  function render() {
    var p = pct();
    if (variant === "comet") { el.style.width = (p * 100) + "%"; }
    else if (variant === "mascot") { el.style.top = (p * (innerHeight - 34)) + "px"; }
    else { ring.style.strokeDashoffset = String(94.2 * (1 - p)); label.textContent = Math.round(p * 100) + "%"; }
    raf = 0;
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(render); }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  render();

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.scrollIndicator = { destroy: function () { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); el.remove(); } };
})();
```

- [ ] **Step 2: Verify (programmatic gate)**

Throwaway HTML with `body{height:300vh}` + the script. Playwright:
- no console errors.
- `browser_evaluate` `() => { window.scrollTo(0, document.body.scrollHeight); return new Promise(r=>setTimeout(()=>r(document.querySelector('#stp-pct')?.textContent),120)); }` → for `ring` variant expect `"100%"` (or near). For comet/mascot, assert the element's width/top moved.

- [ ] **Step 3: Commit**
```bash
git add plugins/sparkle-that-page/skills/sparkle-that-page/examples/scroll_indicator.js
git commit -m "feat(sparkle): animated scroll-depth indicator (ring/comet/mascot)"
```

---

### Task 5: `tab_title_peekaboo.js` — playful title/favicon on tab blur

**Files:**
- Create: `plugins/sparkle-that-page/skills/sparkle-that-page/examples/tab_title_peekaboo.js`

**Interfaces:**
- Produces: on `visibilitychange` to hidden, swaps `document.title` to a cute message (and optionally the favicon); restores both on return. Config via `<html data-peekaboo-msg="come back! 🥺" data-peekaboo-favicon="🥺">`. Registers `SparkleThatPage.tabPeekaboo.destroy()`.

- [ ] **Step 1: Write the effect**

```js
/* tab_title_peekaboo.js — sparkle-that-page
 * Use: <script src="tab_title_peekaboo.js"></script>
 * Config: <html data-peekaboo-msg="come back! 🥺" data-peekaboo-favicon="🥺">
 * (favicon swap is optional — omit data-peekaboo-favicon to leave the icon alone.)
 * Ties back to cutify-that-tab: the away-favicon is an emoji-in-SVG, same trick. */
(function () {
  "use strict";
  var ds = document.documentElement.dataset;
  var awayMsg = ds.peekabooMsg || "come back! 🥺";
  var awayEmoji = ds.peekabooFavicon || ""; // empty = don't touch favicon
  var origTitle = document.title, origHref = null, link = null;

  if (awayEmoji) {
    link = document.querySelector('link[rel~="icon"]');
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    origHref = link.getAttribute("href");
  }
  function emojiIcon(e) {
    return "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">' + e + "</text></svg>");
  }
  function onVis() {
    if (document.hidden) { document.title = awayMsg; if (link) link.setAttribute("href", emojiIcon(awayEmoji)); }
    else { document.title = origTitle; if (link && origHref != null) link.setAttribute("href", origHref); else if (link) link.removeAttribute("href"); }
  }
  document.addEventListener("visibilitychange", onVis);

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.tabPeekaboo = { destroy: function () { document.removeEventListener("visibilitychange", onVis); document.title = origTitle; if (link && origHref != null) link.setAttribute("href", origHref); } };
})();
```

- [ ] **Step 2: Verify (programmatic gate)**

Playwright on a throwaway page with `<title>Demo</title>` + the script:
- `browser_evaluate` `() => { Object.defineProperty(document,'hidden',{value:true,configurable:true}); document.dispatchEvent(new Event('visibilitychange')); return document.title; }` → expect the away message.
- Then set hidden `false` + dispatch again → expect `"Demo"` restored.
- no console errors.

- [ ] **Step 3: Commit**
```bash
git add plugins/sparkle-that-page/skills/sparkle-that-page/examples/tab_title_peekaboo.js
git commit -m "feat(sparkle): tab-title peekaboo with optional favicon swap"
```

---

### Task 6: `click_confetti.js` — heart/star/confetti burst on click

**Files:**
- Create: `plugins/sparkle-that-page/skills/sparkle-that-page/examples/click_confetti.js`

**Interfaces:**
- Produces: a `<canvas>` overlay; a radial physics burst on each click, or only on clicks matching `<html data-confetti-on="[data-confetti]">` if that attribute is set. Variant from `<html data-confetti="heart|star|confetti|petal|pixel">`. Registers `SparkleThatPage.clickConfetti.destroy()` and `SparkleThatPage.clickConfetti.burst(x,y)`.

- [ ] **Step 1: Write the effect**

```js
/* click_confetti.js — sparkle-that-page
 * Use: <script src="click_confetti.js"></script>
 * Variant: <html data-confetti="heart">  (heart | star | confetti | petal | pixel)
 * Limit to specific targets: <html data-confetti-on="[data-confetti]"> (else any click).
 * No-op on reduced-motion. Canvas overlay, pointer-events:none. */
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var ds = document.documentElement.dataset;
  var variant = ds.confetti || "heart", sel = ds.confettiOn || null;
  var PALETTE = { heart: ["#f472b6", "#fb7185", "#fda4af"], star: ["#fde047", "#facc15", "#fbbf24"], confetti: ["#f472b6", "#a5b4fc", "#fde047", "#86efac", "#fdba74"], petal: ["#fbcfe8", "#f9a8d4", "#fecdd3"], pixel: ["#c084fc", "#fde047", "#f472b6"] };
  var GLYPH = { heart: "♥", star: "★", petal: "❀", pixel: "■" };
  var colors = PALETTE[variant] || PALETTE.heart;

  var cv = document.createElement("canvas"), ctx = cv.getContext("2d");
  cv.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483602";
  function size() { cv.width = innerWidth; cv.height = innerHeight; }
  size(); addEventListener("resize", size, { passive: true });
  document.body.appendChild(cv);

  var parts = [], raf = 0;
  function burst(x, y) {
    var n = 24;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 6;
      parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, life: 0, ttl: 50 + Math.random() * 30, c: colors[i % colors.length], s: 7 + Math.random() * 6, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, g: GLYPH[variant] });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life++; p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.vx *= 0.99; p.r += p.vr;
      var t = p.life / p.ttl; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      if (p.g) { ctx.font = p.s * 2 + "px serif"; ctx.textAlign = "center"; ctx.fillText(p.g, 0, 0); }
      else { ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); }
      ctx.restore();
      if (p.life >= p.ttl) parts.splice(i, 1);
    }
    raf = parts.length ? requestAnimationFrame(tick) : 0;
  }
  function onClick(e) { if (sel && !(e.target.closest && e.target.closest(sel))) return; burst(e.clientX, e.clientY); }
  addEventListener("click", onClick, { passive: true });

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.clickConfetti = { burst: burst, destroy: function () { removeEventListener("click", onClick); removeEventListener("resize", size); cancelAnimationFrame(raf); cv.remove(); } };
})();
```

- [ ] **Step 2: Verify (programmatic gate)**

Playwright on throwaway page + script:
- no console errors; `() => !!document.querySelector('canvas')` → true.
- `browser_evaluate` `() => { window.SparkleThatPage.clickConfetti.burst(100,100); return new Promise(r=>requestAnimationFrame(()=>r(true))); }` → resolves true, no error (particles created & animating).
- canvas does not block clicks (pointer-events:none): `() => document.elementFromPoint(100,100).tagName !== 'CANVAS'`.

- [ ] **Step 3: Commit**
```bash
git add plugins/sparkle-that-page/skills/sparkle-that-page/examples/click_confetti.js
git commit -m "feat(sparkle): click confetti / heart burst (canvas, 5 variants)"
```

---

### Task 7: `ambient_floaters.js` — drifting background layer

**Files:**
- Create: `plugins/sparkle-that-page/skills/sparkle-that-page/examples/ambient_floaters.js`

**Interfaces:**
- Produces: a fixed background layer (behind content) of slowly drifting elements. Variant from `<html data-floaters="sakura|bubbles|snow|dust">` (default `sakura`), count from `data-floaters-count` (default 18). Registers `SparkleThatPage.ambientFloaters.destroy()`.

- [ ] **Step 1: Write the effect**

```js
/* ambient_floaters.js — sparkle-that-page
 * Use: <script src="ambient_floaters.js"></script>   Variant: <html data-floaters="sakura">
 * sakura | bubbles | snow | dust. Behind content, pointer-events:none. No-op on reduced-motion. */
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var ds = document.documentElement.dataset;
  var variant = ds.floaters || "sakura";
  var N = Math.max(1, Math.min(60, parseInt(ds.floatersCount, 10) || 18));
  var GLYPH = { sakura: "❀", bubbles: "○", snow: "❄", dust: "✦" };
  var COLOR = { sakura: "#fbcfe8", bubbles: "#bae6fd", snow: "#ffffff", dust: "#fde68a" };
  var glyph = GLYPH[variant] || GLYPH.sakura, color = COLOR[variant] || COLOR.sakura;

  var layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden";
  document.body.appendChild(layer);

  var items = [];
  function reset(p, top) {
    p.x = Math.random() * innerWidth; p.y = top ? -20 : Math.random() * innerHeight;
    p.vy = 0.3 + Math.random() * 0.8; p.vx = (Math.random() - 0.5) * 0.5; p.sway = Math.random() * 6.28; p.size = 10 + Math.random() * 12;
    p.el.style.fontSize = p.size + "px"; p.el.style.opacity = String(0.4 + Math.random() * 0.5);
  }
  for (var i = 0; i < N; i++) {
    var el = document.createElement("span"); el.textContent = glyph;
    el.style.cssText = "position:absolute;will-change:transform;color:" + color;
    layer.appendChild(el); var p = { el: el }; reset(p, false); items.push(p);
  }
  var raf;
  function tick() {
    for (var i = 0; i < items.length; i++) {
      var p = items[i]; p.sway += 0.02; p.y += p.vy; p.x += p.vx + Math.sin(p.sway) * 0.4;
      if (p.y > innerHeight + 20) reset(p, true);
      p.el.style.transform = "translate(" + p.x + "px," + p.y + "px) rotate(" + (p.sway * 30) + "deg)";
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.ambientFloaters = { destroy: function () { cancelAnimationFrame(raf); layer.remove(); } };
})();
```

- [ ] **Step 2: Verify (programmatic gate)**

Playwright + throwaway page:
- no console errors; `() => window.SparkleThatPage.ambientFloaters && document.querySelectorAll('span').length >= 18`.
- layer is behind/ non-blocking: `() => getComputedStyle(document.querySelector('[aria-hidden="true"]')).pointerEvents === 'none'`.

- [ ] **Step 3: Commit**
```bash
git add plugins/sparkle-that-page/skills/sparkle-that-page/examples/ambient_floaters.js
git commit -m "feat(sparkle): ambient floaters (sakura/bubbles/snow/dust)"
```

---

### Task 8: `cute_chrome.css` — selection, wobble hover, kawaii spinner, scrollbar

**Files:**
- Create: `plugins/sparkle-that-page/skills/sparkle-that-page/examples/cute_chrome.css`

**Interfaces:**
- Produces: drop-in CSS. Classes/usage: `.stp-wobble` (hover micro-interaction), `.stp-spinner` (loading dots). `::selection` + custom scrollbar apply globally. All motion guarded by `prefers-reduced-motion`.

- [ ] **Step 1: Write the CSS**

```css
/* cute_chrome.css — sparkle-that-page
 * Use: <link rel="stylesheet" href="cute_chrome.css">
 * - ::selection becomes pastel (global)
 * - add class "stp-wobble" to buttons/links for a playful hover
 * - <span class="stp-spinner"></span> = a kawaii 3-dot bouncing loader
 * - pastel custom scrollbar (WebKit/Blink)
 * Motion is disabled under prefers-reduced-motion. */
::selection { background: #f9a8d4; color: #fff; }
::-moz-selection { background: #f9a8d4; color: #fff; }

.stp-wobble { display: inline-block; transition: transform .15s ease; }
@media (prefers-reduced-motion: no-preference) {
  .stp-wobble:hover { animation: stp-wobble .5s ease; }
  @keyframes stp-wobble {
    0%,100% { transform: rotate(0) scale(1); }
    25% { transform: rotate(-4deg) scale(1.05); }
    50% { transform: rotate(3deg) scale(1.05); }
    75% { transform: rotate(-2deg) scale(1.03); }
  }
}

.stp-spinner, .stp-spinner::before, .stp-spinner::after {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #c084fc;
}
.stp-spinner { position: relative; }
.stp-spinner::before, .stp-spinner::after { content: ""; position: absolute; top: 0; }
.stp-spinner::before { left: -14px; background: #f472b6; }
.stp-spinner::after { left: 14px; background: #a5b4fc; }
@media (prefers-reduced-motion: no-preference) {
  .stp-spinner, .stp-spinner::before, .stp-spinner::after { animation: stp-bounce 1s ease-in-out infinite; }
  .stp-spinner::before { animation-delay: -.16s; }
  .stp-spinner::after { animation-delay: .16s; }
  @keyframes stp-bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-8px); } }
}

* { scrollbar-width: thin; scrollbar-color: #f9a8d4 #fdf2f8; }
::-webkit-scrollbar { width: 12px; height: 12px; }
::-webkit-scrollbar-track { background: #fdf2f8; }
::-webkit-scrollbar-thumb { background: #f9a8d4; border-radius: 6px; border: 3px solid #fdf2f8; }
::-webkit-scrollbar-thumb:hover { background: #f472b6; }
```

- [ ] **Step 2: Verify (programmatic gate)**

Playwright on a page that links the CSS and has `<button class="stp-wobble">Hi</button><span class="stp-spinner"></span>`:
- no console errors; the stylesheet loads (`() => [...document.styleSheets].some(s => (s.href||'').endsWith('cute_chrome.css'))`).
- `() => getComputedStyle(document.querySelector('.stp-wobble')).display === 'inline-block'`.

- [ ] **Step 3: Commit**
```bash
git add plugins/sparkle-that-page/skills/sparkle-that-page/examples/cute_chrome.css
git commit -m "feat(sparkle): cute-chrome CSS (selection, wobble, spinner, scrollbar)"
```

---

### Task 9: `demo.html` — live showcase composing all 7 effects (also the Pages site)

**Files:**
- Create: `plugins/sparkle-that-page/skills/sparkle-that-page/examples/demo.html`

**Interfaces:**
- Consumes: the 7 effect files via relative `<script src>` / `<link>`.
- Produces: a single page with a control panel (checkboxes/selects to toggle each effect + variant), tall content to exercise scrolling, and demo buttons (with `data-confetti` + `.stp-wobble`). Loads effects on toggle by injecting `<script>` with cache-busting and calling `destroy()` to turn off.

- [ ] **Step 1: Write the demo**

Author `demo.html` with:
- A pastel landing header ("✨ sparkle-that-page — cutify-this") + one-line install (`/plugin install sparkle-that-page@wan-huiyan-cutify-this`).
- A fixed control panel: a checkbox per effect; a `<select>` for each variant (`data-wand`, `data-trail`, `data-scroll`, `data-confetti`, `data-floaters`); a "reduced-motion is respected" note.
- ≥ 3 screens of content (so scroll indicator has range), demo buttons `<button class="stp-wobble" data-confetti>Click me!</button>`, and a `<span class="stp-spinner"></span>`.
- Toggle logic: enabling an effect sets the relevant `data-*` on `<html>`, then injects `<script src="<file>?ts=<n>">`; disabling calls `window.SparkleThatPage[name].destroy()`. (Use a fixed incrementing counter for cache-bust — do **not** use `Date.now()`.)
- `cute_chrome.css` linked from the start (it is harmless/global).
- All effect files referenced by **relative path** (`./fairy_cursor.js`, …) so the same file works in-repo and on Pages.

(Full HTML is ~150 lines; author it directly following the contract above. Keep it dependency-free.)

- [ ] **Step 2: Verify the whole catalog in a real browser (Playwright)**

Open the demo via `file://` absolute path:
- `browser_console_messages` after loading → **no errors**.
- Toggle each effect on via `browser_evaluate` (check the box + fire its change handler) and assert `window.SparkleThatPage.<name>` exists for the JS effects.
- Scroll to bottom → scroll indicator reads ~100%.
- Click a `[data-confetti]` button → confetti canvas has drawn (no error from `burst`).
- Click is **not** blocked anywhere (every overlay `pointer-events:none`): `() => document.elementFromPoint(innerWidth/2, innerHeight/2)` returns a content element, never an overlay.
- `browser_take_screenshot` for the record.
- **Reduced-motion gate:** `browser_emulate_media`/`browser_evaluate` to set `prefers-reduced-motion: reduce` (or re-navigate with Playwright `colorScheme`/reduced-motion emulation) → re-run: sparkle trail / confetti / floaters do **not** spawn; ring/comet still reflect position statically.
- **Honest eyeball pass:** view the screenshot(s); confirm the cursor/trail/confetti/floaters actually look cute (Playwright can't assert "cute"). Flag anything off for a quick fix before moving on.

- [ ] **Step 3: Commit**
```bash
git add plugins/sparkle-that-page/skills/sparkle-that-page/examples/demo.html
git commit -m "feat(sparkle): live demo composing all 7 effects (Pages source)"
```

---

### Task 10: `SKILL.md` — the sparkle-that-page skill

**Files:**
- Create: `plugins/sparkle-that-page/skills/sparkle-that-page/SKILL.md`

**Interfaces:**
- Produces: the skill Claude loads. Frontmatter `name: sparkle-that-page` + a `description` carrying the **full effect vocabulary** so it triggers on any named effect.

- [ ] **Step 1: Write the skill**

Structure (mirror the favicon skill's depth + tone):
- **Frontmatter**:
  ```yaml
  ---
  name: sparkle-that-page
  description: Use when a user wants to add cute, playful runtime effects to a web page — a fairy-wand or magic custom cursor, sparkle/star/heart trail following the mouse on move and click, an animated floating scroll-depth / scroll-progress indicator (ring, comet bar, or climbing mascot), tab-title peekaboo ("come back!" when the tab loses focus), click confetti or heart burst, ambient floating petals/bubbles/snow, and cute-chrome touches (pastel ::selection, wobble hover, kawaii loading spinner, pastel scrollbar). Pixel-art style variant on each. Skip for serious/corporate UIs or when the user wants a full design system.
  ---
  ```
- **Problem / when to use / when to skip** (skip: corporate/serious UI, accessibility-critical flows where motion is unwanted by default — note the reduced-motion guard addresses this).
- **The 7 effects**: one section each — what it is, the file to copy (`examples/<file>`), how to wire it (`<script src>` / `<link>`), the config knobs (`data-*` table), the pixel-art variant, and gotchas (cursor hotspot + size cap; title-hijack can annoy users so keep it gentle/opt-in; canvas vs DOM tradeoff; floaters z-index).
- **Global constraints section** = the "baked-in defaults" verbatim (reduced-motion, pointer-events none, pointer:fine no-op, capped pools, teardown, z-index map).
- **Verify-at-real-interaction loop**: open `examples/demo.html` (or the live Pages demo), toggle effects, confirm reduced-motion path, confirm clicks aren't blocked — the page-effects analog of the favicon skill's preview loop. State plainly that screenshots can't prove "cute"; an eyeball pass is required.
- **Examples table**: the 7 files + their variants.
- **See also**: `cutify-that-tab` (sibling — the favicon), `frontend-design`.
- **Changelog**: `v1.0.0 (2026-06-17)` initial.

- [ ] **Step 2: Verify frontmatter + vocabulary**

Run:
```bash
python3 - <<'PY'
import re,sys
t=open('plugins/sparkle-that-page/skills/sparkle-that-page/SKILL.md').read()
assert t.startswith('---'), "missing frontmatter open"
fm=t.split('---',2)[1]
assert 'name: sparkle-that-page' in fm
for kw in ['cursor','sparkle','trail','scroll','confetti','floating','selection']:
    assert kw in fm.lower(), f"description missing vocabulary: {kw}"
print("SKILL.md frontmatter + vocabulary OK")
PY
```
Expected: `SKILL.md frontmatter + vocabulary OK`.

- [ ] **Step 3: Commit**
```bash
git add plugins/sparkle-that-page/skills/sparkle-that-page/SKILL.md
git commit -m "docs(sparkle): SKILL.md teaching all 7 effects + reduced-motion contract"
```

---

### Task 11: GitHub Pages workflow

**Files:**
- Create: `.github/workflows/pages.yml`

**Interfaces:**
- Produces: on push to the default branch, publishes the sparkle demo to Pages with `demo.html` as `index.html`.

- [ ] **Step 1: Write the workflow**

```yaml
name: Deploy demo to Pages
on:
  push:
    branches: [main]
    paths:
      - "plugins/sparkle-that-page/skills/sparkle-that-page/examples/**"
      - ".github/workflows/pages.yml"
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - name: Assemble site (single source of truth = demo.html)
        run: |
          mkdir -p _site
          src="plugins/sparkle-that-page/skills/sparkle-that-page/examples"
          cp "$src"/*.js "$src"/*.css _site/
          cp "$src/demo.html" _site/index.html
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site
      - id: deploy
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify the workflow is valid YAML**

```bash
python3 -c "import yaml; d=yaml.safe_load(open('.github/workflows/pages.yml')); print('jobs:', list(d['jobs'])); assert 'deploy' in d['jobs']"
```
Expected: `jobs: ['deploy']`. (If PyYAML missing: `python3 -c "import json,subprocess"` is not enough — instead eyeball indentation; the live run in Task 13 is the real gate.)

- [ ] **Step 3: Commit**
```bash
git add .github/workflows/pages.yml
git commit -m "ci: deploy sparkle-that-page demo to GitHub Pages"
```

---

### Task 12: README rebrand to the `cutify-this` bundle

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: the repo's front page now presents the bundle (both skills), the new install commands, and a link to the live demo.

- [ ] **Step 1: Rewrite the README top + add sparkle section**

- Title → `# cutify-this ✨` with a one-line: "A bundle of cute web skills — cutify the browser **tab** and sparkle up the whole **page**."
- Badges: update repo slug to `wan-huiyan/cutify-this` (GitHub redirects make old slugs work, but use the new one).
- **Two-skill table** at top:
  | Skill | What it does | Install |
  |---|---|---|
  | `cutify-that-tab` | cute SVG favicons | `/plugin install cutify-that-tab@wan-huiyan-cutify-this` |
  | `sparkle-that-page` | cute page effects | `/plugin install sparkle-that-page@wan-huiyan-cutify-this` |
- **Marketplace add** (front-and-center, new name): `/plugin marketplace add wan-huiyan/cutify-this`.
- New **"sparkle-that-page"** section: the 7 effects (one-line each) + the `data-*` quick-reference + **"▶ Live demo: https://wan-huiyan.github.io/cutify-this/"**.
- Keep the existing favicon content as its own section (move under a `## cutify-that-tab` heading; do not delete the catalog).
- Preserve existing example `<img src="plugins/cutify-that-tab/...">` paths (unchanged on disk).

- [ ] **Step 2: Verify install commands + demo link present and consistent**

```bash
grep -q "wan-huiyan/cutify-this" README.md && \
grep -q "sparkle-that-page@wan-huiyan-cutify-this" README.md && \
grep -q "cutify-that-tab@wan-huiyan-cutify-this" README.md && \
grep -q "wan-huiyan.github.io/cutify-this" README.md && \
echo "README rebrand OK"
```
Expected: `README rebrand OK`.

- [ ] **Step 3: Commit**
```bash
git add README.md
git commit -m "docs: rebrand README to the cutify-this bundle + sparkle-that-page + live demo link"
```

---

### Task 13: Repo rename, push, enable Pages, open PR, verify live

This is the one hard-to-reverse, outward-facing task. Do it last, after all content is committed and the demo verified locally. **Pause for explicit user go-ahead before the rename + push** (it touches their public repo).

- [ ] **Step 1: Push the feature branch (pre-rename; remote redirects)**
```bash
git push -u origin feat/sparkle-that-page
```

- [ ] **Step 2: Rename the GitHub repo**
```bash
gh repo rename cutify-this --repo wan-huiyan/cutify-that-tab --yes
git remote set-url origin https://github.com/wan-huiyan/cutify-this.git
git remote -v   # confirm new URL
```

- [ ] **Step 3: Enable Pages with the GitHub Actions source**
```bash
gh api -X POST repos/wan-huiyan/cutify-this/pages -f build_type=workflow 2>&1 || \
gh api -X PUT  repos/wan-huiyan/cutify-this/pages -f build_type=workflow
```
(If it already exists, the PUT updates it. Confirm: `gh api repos/wan-huiyan/cutify-this/pages --jq .build_type` → `workflow`.)

- [ ] **Step 4: Open the PR**
```bash
gh pr create --repo wan-huiyan/cutify-this --base main --head feat/sparkle-that-page \
  --title "Add sparkle-that-page + rebrand to the cutify-this bundle" \
  --body "$(cat <<'EOF'
Adds a `sparkle-that-page` companion skill (7 zero-dep cute page effects) and rebrands the repo into the `cutify-this` 2-plugin bundle, with a live GitHub Pages demo.

- New plugin: fairy cursor, sparkle trail, scroll-depth indicator, tab-title peekaboo, click confetti, ambient floaters, cute-chrome touches — pixel-art variant on each.
- All effects respect `prefers-reduced-motion`, no-op on touch, never block clicks, are rAF-driven with capped particle pools, and expose a teardown.
- Marketplace renamed `wan-huiyan-cutify-this`; favicon plugin bumped 1.10.0→1.11.0 to fix pre-existing version drift.
- Live demo: https://wan-huiyan.github.io/cutify-this/

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Merge, then verify the live deploy (the real gate)**

After merge to `main`, the Pages workflow runs. Then:
```bash
gh run list --repo wan-huiyan/cutify-this --workflow "Deploy demo to Pages" -L 1
# poll until the run completes
curl -s -o /dev/null -w "%{http_code}" https://wan-huiyan.github.io/cutify-this/
```
Expected: HTTP `200`. Then open the live URL in Playwright (`browser_navigate`), confirm **no console errors** and effects fire (toggle one, scroll to bottom, click a confetti button). **Done = live URL returns 200 with effects firing**, not "the Actions run went green."

- [ ] **Step 6: Confirm old-URL redirect still works**
```bash
curl -s -o /dev/null -w "%{http_code}\n" -L https://github.com/wan-huiyan/cutify-that-tab
```
Expected: `200` (GitHub redirects the old slug to `cutify-this`).

---

## Self-Review

**Spec coverage:** D1 companion skill → Tasks 1–10. D2 all 7 effects → Tasks 2–8. D3 name → Task 1. D4 snippets + demo → Tasks 2–9. D5 rename → Task 13. D6 marketplace name → Tasks 1, 12, 13. D7 Pages → Tasks 11, 13. D8 future skill → architecture only (no task; intentional). Advisor #1 (marketplace name) → Task 12 front-and-center install. #2 version drift → Task 1 Step 3. #3 rename pre-flight → done + Task 13. #4 Pages enable + single-source + live gate → Tasks 11, 13. #5 eyeball pass → Task 9 Step 2. Triggering vocabulary → Task 10 frontmatter + Step 2 check.

**Placeholder scan:** demo.html (Task 9) and SKILL.md (Task 10) are authored against explicit contracts rather than full inline text (both are long prose/markup artifacts, not logic) — every other code step contains complete runnable code. The demo/SKILL contracts enumerate every required element, so they are specs, not "TODO"s.

**Type/name consistency:** registry keys used consistently — `SparkleThatPage.fairyCursor / sparkleTrail / scrollIndicator / tabPeekaboo / clickConfetti / ambientFloaters` and `cute_chrome.css` (CSS-only, no registry). `data-*` knobs: `data-wand`, `data-trail`, `data-scroll`, `data-peekaboo-msg`/`data-peekaboo-favicon`, `data-confetti`/`data-confetti-on`, `data-floaters`/`data-floaters-count`. demo.html (Task 9) and SKILL.md (Task 10) reference these same names.
