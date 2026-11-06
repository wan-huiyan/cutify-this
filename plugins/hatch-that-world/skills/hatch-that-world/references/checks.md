# Checks that can fail

Every script takes the Playwright folder in `PWC` (find one with
`ls ~/.npm/_npx/*/node_modules/playwright -d`, or `npm i -D playwright` in a scratch folder) and launches the
installed Chrome (`channel: 'chrome'`). Pages are opened from `file://`. Stub any local helper so a check never
writes real data.

**Before trusting a pass, show it fails:** run the check on a page built by the old builder (or a deliberately
broken copy). A check that cannot fail proves nothing.

## 1. Copy text identical — `scripts/copy_identical.cjs`
`node copy_identical.cjs before.html after.html [--boxes 'input[type=checkbox]'] [--button '[data-copy-btn]'] [--out '#out']`
Ticks every box, presses the copy button, captures what the clipboard would get, and compares the two pages.
Prints `boxes N chars M` for each and `COPY-IDENTICAL` / `COPY-DIFFERS` (exit 1). Use on every visual change: the
copied text is what reaches other people, and a visual change must never alter it.

## 2. Other worlds pixel-identical — `scripts/pixel_regress.cjs`
`node pixel_regress.cjs before.html after.html outdir --worlds garden,cosmic,candy --key brief-world [--theme-key brief-theme] [--time 2026-11-05T12:40:00Z] [--layouts scene,stage,deck --layout-key jira-digest-layout] [--set k=v ...]`
For each world × mode × layout × width (1280, 390) it screenshots both pages with the clock frozen, reduced
motion, seeded `Math.random`, web fonts blocked, and counts differing pixels; also compares the scene SVG markup.
Run it **before vs before first**: that is the noise floor (on the brief: 47 of 48 looks at 0, one at 2 pixels).
A difference above the floor: crop it (`--crop`) and look before calling it noise.

## 3. Geometry probe — write one per drawn feature
Pattern (the caterpillar head check): install Playwright's clock, step the time across the whole range (every
10 minutes, 8 AM to 6 PM), at desktop and phone width, at several animation frames; measure in the DOM
(`getBBox`, circle `cx/cy/r`) the property the owner cares about; fail with the worst case and where it happened.

```js
await page.clock.install({time: new Date(Date.UTC(2026,10,5,8,0))});
for (let m = 0; m <= 600; m += 10) {
  await page.clock.setSystemTime(new Date(Date.UTC(2026,10,5,8,m)));
  await page.clock.fastForward(31000);              // let the page's own 30 s tick redraw "now"
  const r = await page.evaluate(() => { /* read shapes, return the ratio you test */ });
  if (r.ratio >= LIMIT) fails.push({m, ...r});
}
```
Turn owner feedback into the limit ("the head looks detached" → head-to-neck distance < 0.75 × summed radii).

## 4. Hit test — `scripts/hit_check.cjs`
`node hit_check.cjs page.html --drawn '.g-sign' --link '#meetlinks a' [--set brief-world=garden ...] [--width 1280]`
For each drawn element it takes the centre of its bounding box and asks `document.elementFromPoint`; the answer
must be a link (the n-th drawn element ↔ the n-th link by default, or match on `data-*` with `--match`). Reports
`ok`, `covered by <element>` (something drawn or placed on top, e.g. the draggable sun) and `WRONG`. Then click one
and confirm the target row exists, is visible and has the flash class.

## 5. Live rebuild guard
Before rebuilding the real page: `md5 -q` every log file; rebuild; `md5` again — identical unless the change was
meant to write (then diff and read the change). Then the copy check against the previous live page.
