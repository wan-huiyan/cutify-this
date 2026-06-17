# Design — `sparkle-that-page` + the `cutify-this` bundle

**Date:** 2026-06-17
**Status:** Approved (brainstorming complete)
**Author:** Huiyan Wan (with Claude)

## Problem / motivation

The repo currently ships **one** Claude Code skill — `cutify-that-tab` — that
authors cute SVG **favicons** (the browser-tab icon). The user wants to add
more "cute stuff" that lives on the **page itself**, not just the tab:

- a **fairy-wand cursor**,
- **magic sparkles** as the mouse moves and clicks,
- an **animated, floating scroll-depth indicator**,
- **pixel-art** styling,
- "all the cute stuff like that."

These are page-level **runtime** effects (JS/CSS), a different problem domain
from a static favicon SVG. The repo is also intended to **grow** into a
collection of cute web skills (a future "cute README generator" skill is
planned, à la show-and-tell / agent-review-panel / google-trends-browser-fetch).

## Decisions (all user-approved)

| # | Decision | Choice |
|---|---|---|
| D1 | How the new effects live in the repo | **Companion skill** (not broadening the favicon skill, not loose sections) |
| D2 | Effect catalog | **All 7**: fairy cursor, sparkle trail, scroll indicator, tab-title peekaboo, click confetti/heart burst, ambient floaters, cute-chrome touches — **pixel-art as a style variant on each** |
| D3 | Companion skill name | **`sparkle-that-page`** |
| D4 | Packaging | **Per-effect standalone vanilla snippets + a live `demo.html`** (zero deps, copy-and-edit, mirrors the favicon skill's per-SVG model) |
| D5 | Repo strategy | **Rename** `cutify-that-tab` → **`cutify-this`** (umbrella bundle; GitHub auto-redirects old URLs, preserves stars/releases/history) |
| D6 | Marketplace name | `wan-huiyan-cutify-that-tab` → **`wan-huiyan-cutify-this`** (deliberate clean rebrand; new install commands go front-and-center in README) |
| D7 | GitHub Pages | **Yes, in v1** — live demo of all sparkle effects, deployed via GitHub Actions |
| D8 | Future cute-README skill | **Out of scope for v1** — architecture leaves room for it as a 3rd sibling plugin |

## Architecture / final repo layout

After the work, `wan-huiyan/cutify-this` is a **2-plugin marketplace**:

```
.claude-plugin/marketplace.json          # name → wan-huiyan-cutify-this; lists BOTH plugins
.github/workflows/pages.yml              # NEW — deploy demo to GitHub Pages
docs/plans/2026-06-17-...-design.md      # this doc
plugins/
  cutify-that-tab/                        # UNCHANGED behaviour; only version + repo-url touch-ups
    .claude-plugin/plugin.json
    skills/cutify-that-tab/SKILL.md + examples/*.svg
  sparkle-that-page/                      # NEW plugin
    .claude-plugin/plugin.json            # v1.0.0
    skills/sparkle-that-page/
      SKILL.md
      examples/                           # one self-contained snippet per effect + variants
        demo.html                         # live showcase of ALL effects (single source of truth)
README.md                                 # rebranded to the bundle; both skills presented
```

- The **repo/marketplace** gets the umbrella name; the **favicon plugin keeps
  its own name** (`cutify-that-tab`). Plugin dir paths under
  `plugins/cutify-that-tab/...` do **not** change, so existing README image
  `src` paths stay valid.
- Install (post-rebrand):
  - `cutify-that-tab@wan-huiyan-cutify-this`
  - `sparkle-that-page@wan-huiyan-cutify-this`

## The catalog — 7 techniques

Each effect is a self-contained ~20–50 line vanilla JS/CSS snippet, copy-and-edit,
**zero dependencies, no build step**. Pixel-art variant offered on each.

1. **Fairy-wand cursor** — `cursor: url("data:image/svg+xml,...") <hx> <hy>, auto`.
   Tip-aligned hotspot. Designs: star wand, heart wand, moon wand, + a crisp
   **pixel** wand. Documents the browser cursor-size cap and hotspot-within-image rule.
2. **Sparkle trail** — `pointer-events:none` fixed overlay. rAF-throttled particle
   spawn on `mousemove`, denser burst on `click`. Recycled fixed-size pool.
   Sparkle / star / heart + pixel-star sprite variants.
3. **Scroll-depth indicator** — fixed floating element driven by
   `scrollTop / (scrollHeight - innerHeight)`, `passive` listener + rAF. Three
   designs: climbing mascot (idle bob), filling ring with %, progress comet.
   Pixel-mascot variant.
4. **Tab-title peekaboo** — on `visibilitychange`/blur, save & swap
   `document.title` → "come back! 🥺" + optional sad-favicon swap (reuses a
   `cutify-that-tab` SVG); restore on return. The effect that literally ties
   back to "the tab." Ships a respectful/tasteful default + note that some find
   title-hijacking annoying.
5. **Click confetti / heart burst** — radial burst with velocity + gravity,
   fades out. Heart / star / confetti / petal + pixel variants. Optional
   `[data-confetti]` trigger selector for buttons/form submit.
6. **Ambient floaters** — slow `position:fixed; pointer-events:none` background
   layer. Sakura petals / bubbles / snow / sparkle-dust variants. Density-capped.
7. **Cute-chrome touches** — pastel `::selection`, `.wobble:hover` micro-interaction,
   a kawaii CSS-only loading spinner, optional pastel custom scrollbar.

## Baked-in defaults (non-negotiable; documented in SKILL.md)

- **`prefers-reduced-motion: reduce` disables/reduces every motion effect** (JS-guarded via `matchMedia` + CSS `@media`).
- All overlays `pointer-events: none` — effects never block clicks/scroll.
- Pointer-following effects **no-op on touch / coarse pointers** (`matchMedia('(pointer: fine)')`).
- Particle pools capped; rAF-driven; `passive` scroll listeners; GPU transforms.
- Documented z-index layering + a teardown function for SPAs.
- **SKILL.md `description` carries the full effect vocabulary** (cursor, wand,
  sparkle, trail, scroll progress/indicator, confetti, floaters, `::selection`,
  pixel-art) so the skill triggers whichever effect the user names — not just "sparkle."

## Demo & GitHub Pages

- `examples/demo.html` — one self-contained page, toggles for all 7 effects.
  Doubles as the README showcase **and** the live-verify tool (the page-effects
  analog of the favicon skill's `/tmp/favicon_preview.html`).
- **Single source of truth:** the Pages workflow **copies** `demo.html` →
  publish dir as `index.html`; we do not maintain two copies.
- Pages first-run needs the source enabled (Settings → Pages → "GitHub Actions",
  or via `gh api`). Done-gate = **live URL returns 200 with effects firing**,
  not "the Actions run went green."

## Approaches considered & rejected

- *One `cutify-page.js` config lib* — heavier, not hand-editable, breaks the
  copy-one-thing philosophy. (User chose per-effect snippets.)
- *Broaden the favicon skill* — hurts focus/triggering. (User chose a companion skill.)
- *Brand-new repo + migrate* / *extend in place* — rename-with-redirects wins:
  keeps stars/history/URLs **and** gives a proper umbrella brand.

## Out of scope (YAGNI for v1)

No build step, no npm package, no React/Vue wrappers, no config UI, no sound,
and **not** the future cute-README skill (architecture only leaves room for it).

## Advisor guardrails folded in

1. Marketplace `name` change is a separate lever from the repo rename — treated
   as a deliberate clean rebrand; new install commands front-and-center.
2. Pre-existing version drift (`plugin.json`/`marketplace.json` = 1.10.0 vs
   `SKILL.md`/`README` documenting v1.11.0) — **fix in passing**: bump the
   favicon plugin's version-bearing files to 1.11.0 to agree.
3. Rename is the one hard-to-reverse step — pre-flighted: `gh` authed as
   `wan-huiyan` (`repo`+`workflow` scopes), `cutify-this` confirmed available;
   update the local remote URL after rename.
4. Pages needs its source enabled + single-source-of-truth demo; verify the live URL.
5. Playwright can't *see* cursor/trail/confetti cuteness — programmatic gates
   (clicks not blocked, reduced-motion path, no console errors, touch no-op)
   plus an honest eyeball pass on the live demo.

## Verification plan

- Open `demo.html` / live Pages URL in a real browser (Playwright MCP):
  each effect fires; clicks & scroll not blocked; reduced-motion path; no console
  errors; touch/coarse-pointer no-op.
- Live Pages URL returns 200 and shows effects.
- All version-bearing files for both plugins agree (version-bump-checklist).
- `cutify-that-tab` favicon plugin behaviour unchanged.

## Rollout

Feature branch `feat/sparkle-that-page` → PR. Rename the GitHub repo at the
appropriate point in rollout; update local remote; enable Pages; verify live.
