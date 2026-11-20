# World anatomy — the pieces of a "little world" page, with real code

Working example to read when in doubt: github.com/wan-huiyan/morning-fairy,
`plugins/morning-fairy/skills/morning-fairy/digest/build_digest.py` (search the names below).

Contents: 1 Saved choice before paint · 2 Tokens · 3 The scene · 4 Sound voice · 5 Mascot and moods ·
6 Clickable drawing · 7 Picker · 8 Adding a world checklist · 9 Starter worlds (paper-cut, ink wash, lantern night)

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

## 9. Starter worlds: paper-cut, ink wash, lantern night
Three more worlds to offer when the owner has not named any. The garden, cosmic, candy and caterpillar worlds
live in the brief's builder; these three are written as cards so the sketch step (SKILL.md, "Pick one of three")
has material that differs in how things are made and how they move. Each card gives the tokens in the shape of
section 2, then what the scene, the mascot, the motion and the sound do. Hex values are starting points: derive
the real ones from the app's own colour, and check every text pair at 4.5:1 in both modes.

The East Asian craft behind each one is a source of *materials*, not of ornament. No dragons, no characters used
as decoration, no fake calligraphy. If the app's content is not Chinese, Japanese or Korean, nothing on the page
should pretend to be.

### paper-cut (`data-world="papercut"`)
Layers of cut paper held a few millimetres apart: flat colour, hard-edged shapes, a soft drop shadow under each layer.
```css
:root[data-world="papercut"]{--w-bg:#f6efe1;--w-card:#fffaf0;--w-ink:#2d2a32;--w-accent:#c8553d;--w-hill:#efc77e;--w-hill2:#c8553d;--w-hill3:#2f6b5a}
:root[data-world="papercut"][data-mode="dark"]{--w-bg:#241d2b;--w-card:#2f2638;--w-ink:#f4ead8;--w-accent:#f08a6c;--w-hill:#7a5a86;--w-hill2:#a8466a;--w-hill3:#2f5d58}
```
- **Materials:** no gradients, no blur. Depth is only a shadow offset (`translate(0,6)` at 13% black) under each layer.
  Edges are slightly wavy, not geometric, so it reads as scissors.
- **Scene:** the ground is three stacked hill layers; the data's height lifts the front layer, the layers behind lift
  less (parallax by amount). Meeting signs are white paper tags with a small fold at one corner.
- **Mascot:** a cut-out blob with a white body, two dot eyes and a one-line smile cut from a darker sheet; moods swap
  the cut-out mouth and add a small paper sweat drop or paper star.
- **Motion:** stepped, like frames under a camera: layers sway by 2 to 4 px on a 6 s ease, things "pop up" by scaling
  from 0.9 with a hard stop, no spring overshoot. Reduced motion: all still.
- **Sound:** `{type:'triangle',gain:.10,tail:.35}` plus a very short noise click on open and Done, the sound of paper.

### ink wash (`data-world="inkwash"`)
Brush and water on rice paper: one dark ink at different strengths, one red seal-red accent, a lot of empty paper.
```css
:root[data-world="inkwash"]{--w-bg:#ebe7de;--w-card:#f5f2eb;--w-ink:#2d2a32;--w-accent:#b0402e;--w-hill:#3a3740}
:root[data-world="inkwash"][data-mode="dark"]{--w-bg:#16171a;--w-card:#1f2024;--w-ink:#e6e1d6;--w-accent:#d4624d;--w-hill:#8d8a92}
```
- **Materials:** one ink colour at 12 to 85% opacity; soft edges from a blur filter on the hills and mist, sharp edges
  only on the one brush line and the red sun. The accent appears once per screen, like a seal.
- **Scene:** the data is the mountain ridge: amount sets the ridge's height and its darkness (heavier means darker
  ink). Meetings are a few brush marks or small peaks with a time in a small serif; mist sits between ridge layers.
  Dark mode inverts the paper to charcoal and the ink to pale, with the sun becoming a dim red moon.
- **Mascot:** an ink-blot with two paper-coloured eyes; sweat is a drop of water running down it, starry is two white
  flecks. Its edge is slightly soft, so it sits inside the same wash.
- **Motion:** slow and drifting: mist slides 40 px over 14 s, ink "blooms" outward 600 ms when something opens. Nothing
  bounces. Reduced motion: no drift, no bloom.
- **Sound:** `{type:'sine',gain:.09,tail:1.6,det:4}` with sparse low notes, like a struck bowl.
- **Cost warning:** blur filters over a big area are heavy on phones. Blur the few shapes that need it, never the
  whole scene group, and look at it on a real phone.

### lantern night (`data-world="lantern"`)
A street of paper lanterns after dark: the item itself glows. Night is its natural mode; its "light" mode is dusk.
```css
:root[data-world="lantern"]{--w-bg:#fbe9d0;--w-card:#fff6e6;--w-ink:#3a2433;--w-accent:#d9472f;--w-hill:#e8b27a}
:root[data-world="lantern"][data-mode="dark"]{--w-bg:#1b1530;--w-card:#271f40;--w-ink:#ffe9c2;--w-accent:#ffb347;--w-hill:#3a2d5c}
```
- **Materials:** a warm radial glow behind each lantern (a gradient fading to transparent), flat dark rooftops, one thin
  string of cord across the sky. Glow is the only gradient used.
- **Scene:** each meeting or item is a lantern hung on the string at its place on the axis; its size is the amount, its
  glow is an ordinal score (a rating or priority) so important things are warmer, and an unfinished item is an unlit
  grey lantern, a finished one is lit. The ground is a low street; "now" is a small lit window or the moon.
- **Mascot:** a round pale face under the lanterns, lit from above; moods change how it is lit (sweat: a lantern above
  flickers red; starry: all lanterns brighten once).
- **Motion:** gentle pendulum sway of 3 degrees on a 4 s ease with a different delay per lantern; a finale where lanterns
  rise slowly. Reduced motion: no sway, finale is a still, fully lit street.
- **Sound:** `{type:'sine',gain:.08,tail:1.2,det:7}` with a soft two-note chime; a lantern "lights" with a single high note.
- **Contrast:** text on a glow is the easy way to fail contrast; put numbers on the lantern body, not on the glow.

These three differ on purpose in **material** (cut paper, wet ink, glowing paper), **motion language** (stepped,
drifting, swaying) and **ground** (layers, ridge, street), so a sketch of each reads as a different world and not a
colour swap. Adding one still follows the checklist in section 8.
