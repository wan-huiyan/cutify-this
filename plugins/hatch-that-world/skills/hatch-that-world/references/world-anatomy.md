# World anatomy — the pieces of a "little world" page, with real code

Working example to read when in doubt: github.com/wan-huiyan/morning-fairy,
`plugins/morning-fairy/skills/morning-fairy/digest/build_digest.py` (search the names below).

Contents: 1 Saved choice before paint · 2 Tokens · 3 The scene · 4 Sound voice · 5 Mascot and moods ·
6 Clickable drawing · 7 Picker · 8 Adding a world checklist

## 1. The saved choice, before first paint
A tiny inline script in `<head>` reads the saved world and theme and sets attributes on `<html>`, so the first
frame is already right (no flash). Only whitelisted values are accepted.

```js
var r=document.documentElement; r.setAttribute('data-world','garden');
try{ var w=localStorage.getItem('brief-world');
     if(w==='garden'||w==='cosmic'||w==='candy'||w==='caterpillar') r.setAttribute('data-world',w);
     var t=localStorage.getItem('brief-theme'); if(t==='light'||t==='dark') r.setAttribute('data-theme',t); }catch(e){}
r.setAttribute('data-mode', r.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
```
(`HEAD_SCRIPT` in the builder.) The try/catch matters: storage can throw in private windows.

## 2. Tokens: one block per world, light and dark
```css
:root[data-world="garden"]{--w-bg:#f6efe1;--w-card:#fffaf0;--w-ink:#2d2a32;--w-accent:#c8553d;--w-hill:#cfe0b5}
:root[data-world="garden"][data-mode="dark"]{--w-bg:#1d2a22;--w-card:#26352c;--w-ink:#eef3e6;--w-accent:#f39a7c;--w-hill:#3c5a44}
```
Every component reads `var(--w-*)`; no component names a world. Check text/background pairs at ≥ 4.5:1 for each
world and mode. A world may also swap fonts (the garden uses a hand-written face for labels).

## 3. The scene: one function per world, same geometry for all
Shared geometry is computed once (`geo()`: width, ground line, scale `k` for phone vs desktop, `X(minute)` mapping
8 AM–6 PM onto the width). The day's load is a sum of smooth bumps, one per meeting, centred on its middle:

```js
function loadAt(t){ var s=0; LOADEV.forEach(function(e){ if(e.w) s+=e.w*Math.exp(-Math.pow((t-e.m)/e.sg,2)); }); return s; }
// sigma = max(22, length x .55) minutes; an optional meeting has weight 0 (gets a dashed sign, no hill)
```
Each world's `SCENE.<world>()` returns an SVG string: sky, ground path `gr(x) = base(x) - lift(loadAt(t(x)))`,
signposts at each meeting's middle (stacked on taller posts when they would touch), the sun on an arc, a house or
cocoon at 6 PM, then the mascot group `WHO`. All worlds use the same `X()`, `gr()` and sign placement, so a feature
built on the geometry (pins, links, the caterpillar's body) works everywhere.

Rules that kept it pretty:
- Signs never share a board: try heights until neither board nor post meets one already placed.
- Labels never sit on the sun: hide or move the "now" label when it would.
- A body that follows the ground (the caterpillar) is laid **backwards from the head by arc length**, with each
  segment overlapping the next, head drawn last and tilted to the slope. Laying it forwards from 8 AM leaves a gap
  that changes with the clock.

## 4. Sound: one voice per world, same notes
```js
var VOICE = {garden:{type:'triangle',gain:.14,tail:1}, cosmic:{type:'sine',gain:.085,tail:1.9,det:9},
             candy:{type:'square',gain:.04,tail:.65}};
VOICE.caterpillar = {type:'sine', gain:.13, tail:.55};   // a soft pluck; added by the caterpillar's own code
```
One `SFX` table maps events (tick, Done, open, copy, world switch, sun crossing an hour…) to note patterns; the
voice makes them sound like the world. Off until the speaker button is on; made by WebAudio, no files.

## 5. Mascot and moods
Moods come from builder rules on the data: sweat (an item has a stamp/deadline), starry (nothing left to act on),
sleepy (after 6 PM), calm otherwise. The mascot is a group in the scene with its eyes following the pointer;
one-shot moves (wake, bounce, blush, trick) play on events. A remote mascot (fan art) is an `<img>`/`<image>` only,
with the built-in mascot as the offline fallback.

## 6. Clickable drawing over an aria-hidden scene
```js
function placePins(){                          // re-run on every redraw: resize, sun drag, layout switch
  pinHost.innerHTML = '';
  PINS.forEach(function(q){
    if (!document.getElementById(q.p.id)) return;          // no row, no link
    var a = document.createElement('a'); a.className='pinlink'; a.href='#'+q.p.id;
    a.style.left = q.x+'px'; a.style.top = q.y+'px'; a.setAttribute('aria-label', q.label);
    pinHost.appendChild(a);
  });
}
```
- The link layers sit above the SVG; higher-priority layers (section signposts, pins) come later in the DOM.
- Hit areas follow the drawing: the board, the board grown to a 32 px minimum, the post, and the stretch of hill.
- Hover and focus add a `lift` class to the matching drawn group; none under reduced motion.
- One in-page handler opens the section holding `#id`, opens a closed `<details>` ancestor, scrolls, adds
  `.st-flash` for 1.5 s.
- Rows get stable ids from the builder (`mt-<index>`, `adm-<slug>`); something with no row points at the nearest
  section rather than nowhere.

## 7. The "Build your own" picker
A `<template>` cloned into a shadow-root `<dialog>`; shown once ever (a localStorage flag) when no saved look exists,
and reopened from the Look panel. Live preview; Save posts to a local helper (127.0.0.1 only, Origin and Host
checked, strict validation, atomic write) that rebuilds today's page. On a `file://` page, Save becomes "Open the
live page to save" and carries the choices in the URL hash, validated on arrival.

## 8. Adding a world — the checklist
1. Whitelist value in the head script; radio + swatch in the Look panel.
2. Token block, light and dark; every per-world CSS override that exists for the others.
3. `SCENE.<world>()`, its ground base, and any per-world drawing rules (night, all-done finale).
4. `VOICE` and `SCALE` entries; particle colours.
5. Picker `:host([data-world=…])` styles.
6. Tests: whitelist, tokens exist in both modes, contrast, the page with the world switched off is unchanged.
7. Checks in `checks.md`: other worlds pixel-identical, copy identical, a geometry probe for anything new it draws.
