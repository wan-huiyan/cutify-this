# 0001 — Publish the landing site via a structure-preserving GitHub Pages build + chooser front door

- **Status:** Accepted
- **Date:** 2026-07-08
- **Session:** 1 · **PR:** #4

## Context
The Sparkle That Page landing site (`site/aurora.html`, `site/bubblegum.html`) drives the repo's
shipped effect modules through `site/sparkle-bridge.js`, whose module base is resolved at load time:

```js
export const EFFECTS_DIR = new URL(
  '../plugins/sparkle-that-page/skills/sparkle-that-page/examples/', import.meta.url
).href;
```

Each page also links `cute_chrome.css` via `../plugins/.../examples/` and imports `./sparkle-bridge.js`
/ `./icons.js` as siblings; the two directions cross-link with same-dir `aurora.html`↔`bubblegum.html`.

The existing Pages workflow (`.github/workflows/pages.yml`) built a **curated, flattened** `_site`:
it copied only `examples/*.js`/`*.css` + `examples/demo.html → index.html`, and triggered only on
`plugins/.../examples/**`. Consequences: (a) merging the landing pages would **not** have published
them (the build never copied `site/`, and the trigger never fired on `site/**`), and (b) naively
flattening `site/` into `_site` root would have **broken** the `import.meta.url`-relative module
paths (pages would 200, modules would 404).

## Decision
1. **Mirror the repo layout into `_site` — do not flatten.** Copy `site/**` → `_site/site/` and the
   `examples/` modules → `_site/plugins/.../examples/`, preserving the sibling relationship the code
   depends on. Modules are referenced in place (single source of truth, no duplication into `site/`).
2. **Trigger on `site/**`** (in addition to `examples/**` and the workflow file).
3. **Chooser as the front door.** Add `site/index.html` (a "pick your vibe" splash linking both
   directions + the raw demo); `/` redirects to it (relative `./site/`), `/demo.html` redirects to
   the raw effects demo. Grounded in the repo's own plan (`tasks/todo.md` step 4).
4. **Verify the deployed layout before merging** — build `_site` exactly as the workflow does, serve
   it, curl every route, and render in a browser (module registration + 0 console errors) — because
   static 200s don't catch a broken `import.meta.url` base.

## Consequences
- Live at `https://wan-huiyan.github.io/cutify-this/` → chooser; `/site/{aurora,bubblegum}.html`;
  `/demo.html` → demo. Verified green (deploy run `28929444855`), modules load on the real host.
- Relative redirects are mandatory: project Pages serve under `/<repo>/`, so absolute `/site/` breaks.
- If the site ever needs to ship **standalone**, copy the six `examples/*.js` + `cute_chrome.css` into
  `site/assets/` and repoint `EFFECTS_DIR` in `sparkle-bridge.js` (documented in `site/README.md`).

## Confirmation
Reusable form of the trap captured as skill
`github-pages-flattened-build-drops-sibling-path-subsite` (user-wide).
