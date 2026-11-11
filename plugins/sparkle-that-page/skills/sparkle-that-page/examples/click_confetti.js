/* click_confetti.js — sparkle-that-page
 * Use: <script src="click_confetti.js"></script>   (starts on load)
 * What falls (13 families, every shape is drawn as a path, never a font character):
 *   <html data-confetti="heart">  heart (default) · star · confetti (mixed paper, dots, triangles, stars) · paper (flips as it falls)
 *     · ribbon (curly streamers) · sprinkles · petal · leaf · snow · bubble (pops into a ring) · note · paw · pixel
 *   Each family has 3 named palettes (the first is the default), each with a light-page and a dark-page version:
 *   <html data-confetti-palette="berry">   see SparkleThatPage.clickConfetti.palettes for the names.
 *   An unknown family falls back to heart, an unknown palette to the family's first.
 * How it moves: <html data-confetti-motion="burst">  burst (default: a ring of pieces thrown out) · fountain (shoot up, then
 *   fall) · rain (start above the top of the screen and fall) · pop (a ring and a few pieces, for small buttons).
 * Color theme (optional, overrides every family's colors): <html data-palette="neon">  (candy | neon | meadow)
 *   Reads CSS tokens --stp-c1…c6 (see cute_chrome.css) first; built-in arrays are the fallback. Order of precedence:
 *   a palette passed to burst() > data-palette (with the tokens) > data-confetti-palette > the family's first palette.
 *   neon also makes the pieces glow.
 * Light or dark page: the same rule as pageIsDark() in sparkle_trail.js and isDark() in fairy_cursor.js (copied
 *   here): data-theme light|dark, else the <body> then <html> background, else the system scheme only if the page's
 *   color-scheme allows dark. The dark version of a palette is the light one lifted toward white; on a light page every
 *   piece gets a thin dark outline so pale pieces (and snow, bubbles) show on white. Pieces already in the air change
 *   colour at once when data-theme / class / style on <html> or <body> change; no reload.
 * WHERE it fires (read at click time, so it can be toggled live):
 *   (default)                       only on [data-celebrate], [data-confetti] — elements that opt in
 *   <html data-confetti-on="*">     every click (showcases / demo pages)
 *   <html data-confetti-on=".buy">  any CSS selector
 * STAMP: any element with data-stamp="Done!" (the text is the attribute's value; empty = "Done!") gets, on click, a
 *   rotated rubber-stamp label that lands on it with a squash, plus a confetti burst from burst(x, y). It works with
 *   or without data-confetti-on, and replaces the normal burst for that click. The label is decorative (aria-hidden)
 *   and removes itself after ~1.6 s; it takes its color from --stp-c1, and it follows its element if the page scrolls
 *   meanwhile. Reduced motion: the label just appears and is removed again after the same ~1.6 s — no slam, no fade,
 *   no confetti.
 * Reduced motion: exactly one small drawn shape (the family's) fades in place at the click point (~400 ms, no movement).
 * API: SparkleThatPage.clickConfetti.start() / .destroy() / .burst(x, y [, { family, palette, motion }]) / .active()
 *   start() is idempotent; destroy() then start() brings it back. burst() does nothing while the effect is off. The
 *   optional third argument fires that family / palette / motion once, without changing the page's own attributes.
 *   active() is true while it is running; destroy() keeps the registry entry, so other files (cute_sounds.js,
 *   secret_word.js) ask active(), not "does the key exist". Its canvas has class "stp-confetti".
 *   Also: .families (names), .palettes ({ family: [names] }), .motions, .colors(family, palette, dark) (the fills as
 *   drawn), and .draw(ctx, family, palette, dark, x, y, size, i) which paints one still piece on any 2D canvas
 *   (i picks its colour and variant) — the gallery uses it. These work even when the effect is destroyed.
 * Put the <script> in <head> or <body>: if <body> does not exist yet, start() waits for DOMContentLoaded.
 * Strict CSP: needs no <style> element and no style="" attribute; styles are set through the CSSOM, so a page with
 *   style-src 'self' works. Canvas overlay, pointer-events:none, devicePixelRatio-aware, time-based physics; the frame
 *   loop stops once no pieces are left. Drawing a new family: references/confetti.md. */
(function () {
  "use strict";
  var root = document.documentElement, ds = root.dataset, DEFAULT_ON = "[data-celebrate], [data-confetti]", INK = "#2a2140";
  var THEME = {
    candy:  ["#f472b6", "#c084fc", "#fde047", "#a5b4fc", "#fb7185"],
    neon:   ["#2ee6ff", "#b6ff3d", "#ff5ad0", "#ffb43d", "#ffffff"],
    meadow: ["#e87a90", "#6a5acd", "#4aad9a", "#d4943a", "#b8a8e0", "#f4c4a0"]
  };
  // Palettes: fills for a LIGHT page. Dark-page fills are these lifted toward white (LIFT), the outline is dark ink.
  var PAL = {
    heart:     { candy: ["#f472b6", "#fb7185", "#fda4af"], berry: ["#e11d6a", "#a21caf", "#f43f5e", "#fb7185"], peach: ["#fb923c", "#fb7185", "#fdba74", "#f9a8d4"] },
    star:      { gold: ["#fde047", "#facc15", "#fbbf24"], pastel: ["#fde68a", "#f9a8d4", "#a5b4fc", "#86efac"], ice: ["#7dd3fc", "#a5b4fc", "#c4b5fd", "#e0f2fe"] },
    confetti:  { party: ["#f472b6", "#a5b4fc", "#fde047", "#86efac", "#fdba74"], jewel: ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"], pastel: ["#fbcfe8", "#bae6fd", "#fef08a", "#bbf7d0", "#e9d5ff"] },
    paper:     { bright: ["#ef4444", "#3b82f6", "#facc15", "#22c55e", "#a855f7"], candy: ["#f472b6", "#c084fc", "#fde047", "#a5b4fc", "#fb7185"], gold: ["#fbbf24", "#f59e0b", "#fde68a", "#fff7d6", "#d97706"] },
    ribbon:    { rainbow: ["#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#c084fc"], pink: ["#f472b6", "#fb7185", "#fda4af", "#f9a8d4"], gift: ["#dc2626", "#16a34a", "#fbbf24", "#fef3c7"] },
    sprinkles: { rainbow: ["#f472b6", "#60a5fa", "#facc15", "#4ade80", "#fb923c", "#c084fc"], strawberry: ["#fb7185", "#fda4af", "#fff1f2", "#f43f5e"], cocoa: ["#92400e", "#d6a77a", "#fef3c7", "#f472b6"] },
    petal:     { sakura: ["#fbcfe8", "#f9a8d4", "#fecdd3"], peach: ["#fed7aa", "#fdba74", "#fecaca", "#fda4af"], lilac: ["#e9d5ff", "#d8b4fe", "#c4b5fd", "#fbcfe8"] },
    leaf:      { spring: ["#86efac", "#4ade80", "#a3e635", "#34d399"], autumn: ["#f97316", "#dc2626", "#f59e0b", "#b45309", "#eab308"], forest: ["#16a34a", "#15803d", "#65a30d", "#0f766e"] },
    snow:      { frost: ["#60a5fa", "#7aa8e8", "#93c5fd", "#a5b4fc"], flurry: ["#7c9ccf", "#8fa6c8", "#a3b8d9", "#b7a8e0"], pearl: ["#94a3b8", "#a5b4fc", "#c4a1e8", "#a8b6cc"] },
    bubble:    { soap: ["#38bdf8", "#f472b6", "#a78bfa", "#34d399"], sea: ["#06b6d4", "#38bdf8", "#2dd4bf", "#60a5fa"], gum: ["#f472b6", "#fb7185", "#e879f9", "#fda4af"] },
    note:      { pastel: ["#f9a8d4", "#c4b5fd", "#93c5fd", "#86efac"], ocean: ["#0ea5e9", "#6366f1", "#14b8a6", "#7dd3fc"], sunset: ["#fb923c", "#f43f5e", "#facc15", "#f472b6"] },
    paw:       { blush: ["#f9a8d4", "#fda4af", "#fbcfe8"], caramel: ["#d6a77a", "#c08552", "#e8c9a0", "#a8744a"], moon: ["#c4b5fd", "#a5b4fc", "#93c5fd", "#d8b4fe"] },
    pixel:     { candy: ["#c084fc", "#fde047", "#f472b6"], arcade: ["#22d3ee", "#a3e635", "#f0abfc", "#fbbf24"], pickle: ["#9bbc0f", "#8bac0f", "#5d8a1d", "#c5e04a"] }
  };
  var LIFT = { snow: 0.55, bubble: 0.62 };
  // How each family moves. g gravity scale (negative floats up), d drag on the fall (0 = none: like the old pieces),
  // w sideways sway, sp throw speed, z [size, size range], l life, vr spin.
  var DEF = { g: 1, d: 0, w: 0, sp: 1, z: [7, 6], l: 1, vr: 1 };
  var PH = {
    heart: {}, star: { z: [8, 6] }, confetti: { z: [6, 5] }, paper: { g: 0.5, d: 0.96, w: 0.5, z: [6, 4], vr: 0.5 },
    ribbon: { g: 0.4, d: 0.96, w: 0.4, z: [8, 5], l: 1.3, vr: 0.4 }, sprinkles: { z: [5, 3], vr: 1.6 },
    petal: { g: 0.3, d: 0.965, w: 0.6, z: [7, 5], l: 1.3 }, leaf: { g: 0.35, d: 0.965, w: 0.6, z: [8, 5], l: 1.3 },
    snow: { g: 0.2, d: 0.965, w: 0.35, z: [6, 5], l: 1.4, vr: 0.3 }, bubble: { g: -0.04, d: 0.96, w: 0.5, sp: 0.5, z: [7, 6], l: 1.5, vr: 0 },
    note: { g: 0.7, z: [8, 5], vr: 0.6 }, paw: { z: [8, 5], vr: 0.7 }, pixel: { z: [1, 1], vr: 0 }
  };
  var FAMS = Object.keys(PAL), MOTIONS = ["burst", "fountain", "rain", "pop"], MO = { burst: 1, fountain: 1, rain: 1, pop: 1 };
  FAMS.forEach(function (f) { var o = {}, k; for (k in DEF) o[k] = DEF[k]; for (k in PH[f]) o[k] = PH[f][k]; PH[f] = o; });
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k) ? o[k] : null; }  // "constructor" is no family

  // ---- shapes: Path2D in a unit box around (0,0), built once ----
  function P(d) { return new Path2D(d); }
  function ell(x, y, rx, ry, rot) { var q = new Path2D(); q.ellipse(x, y, rx, ry, rot || 0, 0, 6.3); return q; }
  function join() { var q = new Path2D(), i; for (i = 0; i < arguments.length; i++) q.addPath(arguments[i]); return q; }
  function star(n, R, r) { for (var d = "", i = 0; i < 2 * n; i++) { var a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + (q * Math.cos(a)).toFixed(2) + " " + (q * Math.sin(a)).toFixed(2); } return d + "Z"; }
  function bits(rows) { var q = new Path2D(), w = rows[0].length, y, x; for (y = 0; y < rows.length; y++) for (x = 0; x < w; x++) if (rows[y][x] === "1") q.rect(x - w / 2, y - rows.length / 2, 1, 1); return q; }
  var arm = P("M0 0V-1M0 -.5L.28 -.74M0 -.5L-.28 -.74"), flake = new Path2D(), i6;
  for (i6 = 0; i6 < 6; i6++) flake.addPath(arm, new DOMMatrix().rotate(i6 * 60));
  var SH = {
    heart: P("M0 .85C-1.2 .1-.95-.75-.45-.75C-.2-.75 0-.55 0-.35C0-.55 .2-.75 .45-.75C.95-.75 1.2 .1 0 .85Z"), shine: ell(-.5, -.38, .2, .11, -.6),
    star: P(star(5, .8, .4)), dot: ell(0, 0, .7, .7), hub: ell(0, 0, .17, .17), tri: P("M0-.85L.9.7L-.9.7Z"), paper: P("M-1-.62H1V.62H-1Z"),
    rib: P("M-1.2 0C-.8-1-.4-1 0 0S.8 1 1.2 0"), spr: P("M-.7 0H.7"), snow: flake, ring: ell(0, 0, .72, .72), glint: P("M-.5-.4A.65.65 0 0 1-.1-.7"),
    petal: P("M0 .9C-.9 .6-.8-.7-.15-.95L0-.7L.15-.95C.8-.7.9.6 0 .9Z"), pvein: P("M0 .6V-.25"),
    leaf: P("M0-1C.9-.4.9.5 0 1C-.9.5-.9-.4 0-1Z"), vein: P("M0-.8V1.05M0 .1L.4-.2M0 .1L-.4-.2M0 .5L.35.2M0 .5L-.35.2"),
    note: join(ell(-.4, .65, .5, .36, -.45), P("M-.08 .6V-.95H.14V.6Z"), P("M.14-.95C.2-.45.95-.55.8.15C.7-.35.4-.35.14-.1Z")),
    note2: join(ell(-.8, .7, .45, .33, -.45), ell(.45, .5, .45, .33, -.45), P("M-.42 .65V-.8H-.22V.65Z"), P("M.83 .45V-1H1.03V.45Z"), P("M-.42-.8L1.03-1V-.55L-.42-.35Z")),
    paw: join(P("M0 .05C.45 .05.95.5.8.9C.65 1.2.25.95 0 .95C-.25.95-.65 1.2-.8.9C-.95.5-.45.05 0 .05Z"), ell(-.85, -.05, .26, .36, -.5), ell(-.32, -.62, .26, .36, -.15), ell(.32, -.62, .26, .36, .15), ell(.85, -.05, .26, .36, .5)),
    pix: [bits(["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"]), bits(["11", "11"]), bits(["010", "111", "010"]), bits(["00100", "01110", "11111", "01110", "00100"])]
  };

  var cv = null, ctx, c, dpr = 1, dark = false, parts = [], raf = 0, last = 0, stamps = [], timers = [], mo = null, mq = null, probe, cache = {};

  // ---- colour ----
  function mix(a, b, t) {  // colour a toward b by t. a can be any CSS colour (rgb(), #abc, oklch()): it is read by a canvas probe
    var x = hex6(a), y = hex6(b), o = "#";
    if (x == null || y == null) return a;
    for (var s = 16; s >= 0; s -= 8) { var u = (x >> s) & 255; o += ("0" + Math.round(u + (((y >> s) & 255) - u) * t).toString(16)).slice(-2); }
    return o;
  }
  function hex6(a) {  // a CSS colour -> 0xrrggbb, or null when it is not a colour
    if (/^#[0-9a-f]{6}$/i.test(a)) return parseInt(a.slice(1), 16);
    var d = typeof a === "string" ? rgba(a) : null;
    return d && d[3] ? (d[0] << 16) | (d[1] << 8) | d[2] : null;
  }
  function mk(arr, lift, glow) { arr = arr.map(function (v) { return mix(v, v, 0); }); return { l: arr, k: arr.map(function (v) { return mix(v, INK, 0.4); }), d: arr.map(function (v) { return mix(v, "#ffffff", lift); }), glow: glow }; }
  function famPal(f, n) { var key = f + "|" + n; return cache[key] || (cache[key] = mk(PAL[f][n], LIFT[f] || 0.22, false)); }
  function tokens() { var cs = getComputedStyle(root), o = []; for (var i = 1; i <= 6; i++) { var v = cs.getPropertyValue("--stp-c" + i).trim(); if (v) o.push(v); } return o.length ? o : null; }
  function resolve(f, name, page) {  // explicit palette > data-palette (+ tokens) > data-confetti-palette > first
    var a;
    if (name) {
      if (own(PAL[f], name)) return famPal(f, name);
      if ((a = own(THEME, name))) return mk(a.slice(), 0, name === "neon");
    }
    if (page) {
      if (ds.palette && (a = tokens() || own(THEME, ds.palette))) return mk(a.slice(), 0, ds.palette === "neon");
      if (ds.confettiPalette && own(PAL[f], ds.confettiPalette)) return famPal(f, ds.confettiPalette);
    }
    return famPal(f, Object.keys(PAL[f])[0]);
  }
  function rgba(css) {  // any CSS colour -> [r, g, b, a]
    if (!probe) { var q = document.createElement("canvas"); q.width = q.height = 1; probe = q.getContext("2d", { willReadFrequently: true }); }
    probe.clearRect(0, 0, 1, 1); probe.fillStyle = "rgba(0,0,0,0)"; probe.fillStyle = css; probe.fillRect(0, 0, 1, 1);
    return probe.getImageData(0, 0, 1, 1).data;
  }
  function isDark() {  // copied from fairy_cursor.js: the same rule as pageIsDark() in sparkle_trail.js
    var t = root.getAttribute("data-theme"), els = [document.body, root], d, i;
    if (t === "dark" || t === "light") return t === "dark";
    for (i = 0; i < 2; i++) if (els[i] && (d = rgba(getComputedStyle(els[i]).backgroundColor))[3] >= 128) return d[0] * 0.299 + d[1] * 0.587 + d[2] * 0.114 < 128;
    return matchMedia("(prefers-color-scheme: dark)").matches && /\bdark\b/.test(getComputedStyle(root).colorScheme);
  }
  function repaint() { dark = isDark(); }  // airborne pieces look their colour up each frame, so this is all a flip needs
  function reduced() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }

  // ---- drawing one piece (c = the 2D context being drawn on; unit shapes are scaled by the piece size) ----
  function body(d, p, w) {  // fill with the ink outline underneath on light pages; w > 0 rounds the corners
    c.lineJoin = "round"; c.lineCap = "round";
    if (p.k) { c.lineWidth = (w || 0) + 0.28; c.strokeStyle = p.k; c.stroke(d); }
    if (w) { c.lineWidth = w; c.strokeStyle = p.f; c.stroke(d); }
    c.fillStyle = p.f; c.fill(d);
    c.shadowBlur = 0;
  }
  function line(d, p, w, ink) {  // a stroke-only shape (ribbon, sprinkle, snow); ink = how much wider the dark outline is
    c.lineJoin = c.lineCap = "round";
    if (p.k) { c.lineWidth = w + (ink || 0.3); c.strokeStyle = p.k; c.stroke(d); c.shadowBlur = 0; }
    c.lineWidth = w; c.strokeStyle = p.f; c.stroke(d); c.shadowBlur = 0;
  }
  function paintShape(p) {
    var F = p.fam, v = p.v, fl = Math.cos(p.ph), a = Math.max(0.2, Math.abs(fl));
    if (F === "confetti") F = ["paper", "dot", "tri", "star"][v % 4];
    if (F === "heart") { body(SH.heart, p); c.fillStyle = "rgba(255,255,255,.6)"; c.fill(SH.shine); }
    else if (F === "star") body(SH.star, p, 0.22);
    else if (F === "paper") { c.scale(1, fl < 0 ? -a : a); body(SH.paper, p); if (fl < 0) { c.fillStyle = "rgba(0,0,0,.17)"; c.fill(SH.paper); } }
    else if (F === "dot") body(SH.dot, p);
    else if (F === "tri") body(SH.tri, p, 0.16);
    else if (F === "ribbon") { c.scale(1, fl < 0 ? -a : a); line(SH.rib, p, 0.42); }
    else if (F === "sprinkles") line(SH.spr, p, 0.55);
    else if (F === "petal") { c.scale(a, 1); body(SH.petal, p); c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 0.12; c.stroke(SH.pvein); }
    else if (F === "leaf") { c.scale(a, 1); body(SH.leaf, p); c.strokeStyle = "rgba(0,0,0,.28)"; c.lineWidth = 0.1; c.stroke(SH.vein); }
    else if (F === "snow") { line(SH.snow, p, 0.19, 0.1); c.fillStyle = p.f; c.fill(SH.hub); }
    else if (F === "note") body(v % 2 ? SH.note2 : SH.note, p, 0.1);
    else if (F === "paw") body(SH.paw, p);
    else if (F === "bubble") {
      var t = p.still ? 0 : p.life / p.ttl, q = (t - 0.78) / 0.22, j, rc;
      if (q < 0) {
        c.globalAlpha *= 0.2; c.fillStyle = p.f; c.fill(SH.dot); c.globalAlpha *= 5;
        rc = p.k ? mix(p.f, INK, 0.3) : p.f; c.lineWidth = 0.14; c.strokeStyle = rc; c.stroke(SH.ring);
        c.strokeStyle = "rgba(255,255,255,.95)"; c.lineWidth = 0.15; c.lineCap = "round"; c.stroke(SH.glint);
      } else {  // popped: an open ring and six droplets
        c.globalAlpha *= 1 - q; rc = p.k ? mix(p.f, INK, 0.3) : p.f; c.lineWidth = 0.1 * (1 - q) + 0.04; c.strokeStyle = rc; c.scale(1 + q * 0.9, 1 + q * 0.9); c.stroke(SH.ring);
        for (j = 0; j < 6; j++) { c.beginPath(); c.arc(Math.cos(j * 1.047) * 1.05, Math.sin(j * 1.047) * 1.05, 0.1, 0, 6.3); c.fillStyle = rc; c.fill(); }
      }
    }
  }
  function drawPiece(g, p, dk) {
    c = g;
    var pal = p.pal, i = p.ci % pal.l.length, pix = p.fam === "pixel";
    p.f = dk ? pal.d[i] : pal.l[i]; p.k = dk ? null : pal.k[i];
    g.save();
    g.globalAlpha = p.a == null ? 1 : p.a;
    if (pal.glow) { g.shadowColor = p.f; g.shadowBlur = 12; }
    if (p.ring) {  // the pop ring
      g.lineWidth = 3 * (1 - p.t) + 0.5; g.strokeStyle = p.f; g.beginPath(); g.arc(p.x, p.y, 5 + p.t * 26, 0, 6.3); g.stroke(); g.restore(); return;
    }
    if (pix) {  // pixel art: whole pixels, no turning, a cell of 3 or 4 screen pixels
      var cell = 3 + (p.v % 2), d = SH.pix[p.v % 4];
      g.translate(Math.round(p.x), Math.round(p.y)); g.scale(cell, cell);
      if (p.k) { g.lineJoin = "miter"; g.lineWidth = 1; g.strokeStyle = p.k; g.stroke(d); }
      g.fillStyle = p.f; g.fill(d);
    } else { g.translate(p.x, p.y); g.rotate(p.r); g.scale(p.s, p.s); paintShape(p); }
    g.restore();
  }

  // ---- bursts ----
  function size() { dpr = window.devicePixelRatio || 1; cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function burst(x, y, o) {
    if (!cv) return;
    o = o || {};
    var f = o.family ? (own(PAL, o.family) ? o.family : "heart") : (own(PAL, ds.confetti) ? ds.confetti : "heart");
    var pal = resolve(f, o.palette, !o.palette), m = o.motion || ds.confettiMotion, F = PH[f], n, i, a, sp, p;
    if (!own(MO, m)) m = "burst";
    repaint();
    if (reduced()) {  // fewer and gentler, not zero: one drawn shape fades in place
      parts.push({ x: x, y: y, vx: 0, vy: 0, life: 0, ttl: 24, pal: pal, ci: 0, v: 0, fam: f, s: F.z[0] + F.z[1] * 0.6 + 2, r: 0, vr: 0, ph: 0, vph: 0, still: 1, fade: 0 });
    } else {
      n = m === "rain" ? Math.min(60, 24 + (innerWidth / 30 | 0)) : m === "pop" ? 8 : m === "fountain" ? 28 : 24;
      if (m === "pop") parts.push({ ring: 1, x: x, y: y, life: 0, ttl: 28, pal: pal, ci: 0, fam: f, still: 0, fade: 0, t: 0 });
      for (i = 0; i < n; i++) {
        p = { x: x, y: y, vx: 0, vy: 0, life: 0, ttl: (50 + Math.random() * 30) * F.l, ci: i, v: i, fam: f, pal: pal, s: F.z[0] + Math.random() * F.z[1], r: Math.random() * 6.28,
          vr: (Math.random() - 0.5) * 0.3 * F.vr, ph: Math.random() * 6.28, vph: 0.18 + Math.random() * 0.12, g: 0.18 * F.g, dr: F.d, w: F.w, fade: 0 };
        if (m === "fountain") { p.vx = (Math.random() - 0.5) * 5; p.vy = -(9 + Math.random() * 5); p.ttl *= 1.6; p.fade = 0.5; }
        else if (m === "rain") { var vt = 2.5 + Math.random() * 2; p.x = Math.random() * innerWidth; p.y = -40 - Math.random() * 220; p.vx = (Math.random() - 0.5) * 0.8; p.vy = vt * 0.6;
          p.g = 0.15; p.dr = 1 - 0.15 / vt; p.ttl = 400; p.fade = 0.9; }  // falls at a steady speed (gravity against drag), not faster and faster
        else if (m === "pop") { a = Math.random() * 6.283; sp = (1.5 + Math.random() * 2) * F.sp; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 1; p.ttl = (30 + Math.random() * 15) * Math.max(F.l, 1); p.g *= 0.5; }
        else { a = Math.random() * Math.PI * 2; sp = (3 + Math.random() * 6) * F.sp; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 3 * F.sp; }
        parts.push(p);
      }
    }
    if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
  }
  function tick(now) {
    var k = last ? Math.min((now - last) / 16.667, 3) : 1; last = now; // 1 = one 60 Hz frame
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i], t; p.life += k; t = p.t = p.life / p.ttl;
      if (!p.still && !p.ring) {
        p.vy += p.g * k; p.vx *= Math.pow(p.dr || 0.99, k); if (p.dr) p.vy *= Math.pow(p.dr, k);
        if (p.w) p.x += Math.sin(p.ph) * p.w * k;
        p.x += p.vx * k; p.y += p.vy * k; p.r += p.vr * k; p.ph += p.vph * k;
      }
      if (p.life < p.ttl && !(p.y > innerHeight + 60 && p.vy > 0)) {
        p.a = p.still || p.ring ? 1 - t : p.fam === "bubble" ? 1 : t < p.fade ? 1 : (1 - t) / (1 - p.fade);
        if (p.fam === "pixel" && !p.ring) p.a = Math.ceil(p.a * 4) / 4;  // fades in steps
        drawPiece(ctx, p, dark);
      } else parts.splice(i, 1);
    }
    raf = parts.length ? requestAnimationFrame(tick) : 0;
  }

  // The stamp: a fixed-position label centred on the clicked element, rotated -8deg. It is removed when its animation
  // ends (or after a timeout under reduced motion), so no cleanup is needed from the page. While it lives it is
  // re-centred on its element on every scroll (capture: also scrolling inside a nested container), so it never drifts.
  function later(fn, ms) { var id = setTimeout(function () { timers.splice(timers.indexOf(id), 1); fn(); }, ms); timers.push(id); }
  var T = "translate(-50%,-50%) ";
  function stamp(target) {
    var cx, cy;
    function centre() { if (!target.isConnected) return; var r = target.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
    centre();
    var s = document.createElement("span");
    s.className = "stp-stamp";
    s.setAttribute("aria-hidden", "true");
    s.textContent = target.getAttribute("data-stamp") || "Done!";
    s.style.cssText = "position:fixed;left:" + cx + "px;top:" + cy + "px;z-index:2147483602;pointer-events:none;white-space:nowrap;" +
      "padding:4px 14px;border:3px double currentColor;border-radius:10px;font:800 22px/1 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;" +
      "color:#be185d;color:color-mix(in srgb,var(--stp-c1,#f472b6) 65%,#000);background:rgba(255,255,255,.92);transform:" + T + "rotate(-8deg)";
    function follow() { centre(); s.style.left = cx + "px"; s.style.top = cy + "px"; }
    addEventListener("scroll", follow, { passive: true, capture: true });
    document.body.appendChild(s); stamps.push({ el: s, off: function () { removeEventListener("scroll", follow, true); } });
    function gone() { s.remove(); removeEventListener("scroll", follow, true); for (var i = 0; i < stamps.length; i++) if (stamps[i].el === s) { stamps.splice(i, 1); break; } }
    if (reduced()) { later(gone, 1600); return; } // no slam, no confetti
    var R = " rotate(-8deg)";
    s.animate([
      { transform: T + "scale(2.6) rotate(-22deg)", opacity: 0, offset: 0, easing: "cubic-bezier(.5,0,1,.6)" },              // drops in from above
      { transform: T + "scale(1.12,.84)" + R, opacity: 1, offset: .14, easing: "ease-out" },                                // lands: squash
      { transform: T + "scale(.97,1.04)" + R, opacity: 1, offset: .24, easing: "ease-in-out" },                             // springs back
      { transform: T + "scale(1)" + R, opacity: 1, offset: .32 },
      { transform: T + "scale(1)" + R, opacity: 1, offset: .78 },                                                           // holds
      { transform: T + "scale(1.05)" + R, opacity: 0, offset: 1 }
    ], { duration: 1600, fill: "both" }).onfinish = gone;
    later(function () { centre(); burst(cx, cy); }, 220); // on the landing
  }

  function onClick(e) {
    var st = e.target.closest && e.target.closest("[data-stamp]");
    if (st) { stamp(st); return; }
    var on = ds.confettiOn || DEFAULT_ON;
    if (on !== "*") { var t = e.target.closest && e.target.closest(on); if (!t || t === document.documentElement) return; } // <html data-confetti> is the variant, not a target
    burst(e.clientX, e.clientY);
  }
  function onEnd(e) { if (e.target === root || e.target === document.body) repaint(); }  // a background transition

  function start() {
    if (cv) return;
    if (!document.body) { document.addEventListener("DOMContentLoaded", start, { once: true }); return; } // script in <head>
    cv = document.createElement("canvas"); ctx = cv.getContext("2d");
    cv.setAttribute("aria-hidden", "true"); cv.className = "stp-confetti";
    cv.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483602";
    size(); addEventListener("resize", size, { passive: true });
    document.body.appendChild(cv);
    addEventListener("click", onClick, { passive: true });
    repaint();
    mo = new MutationObserver(repaint);  // never starts the frame loop: it only updates the light/dark flag
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
    addEventListener("load", repaint); root.addEventListener("transitionend", onEnd);
    mq = matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", repaint); else mq.addListener(repaint);
  }
  function destroy() {
    document.removeEventListener("DOMContentLoaded", start);
    if (!cv) return;
    removeEventListener("click", onClick); removeEventListener("resize", size);
    mo.disconnect(); mo = null; removeEventListener("load", repaint); root.removeEventListener("transitionend", onEnd);
    if (mq.removeEventListener) mq.removeEventListener("change", repaint); else mq.removeListener(repaint);
    mq = null;
    cancelAnimationFrame(raf); raf = 0; parts = [];
    timers.forEach(clearTimeout); timers = [];
    stamps.forEach(function (s) { s.off(); s.el.remove(); }); stamps = [];
    cv.remove(); cv = null;
  }

  var NAMES = {};
  FAMS.forEach(function (f) { NAMES[f] = Object.keys(PAL[f]); });
  function paletteOf(f, n) { f = own(PAL, f) ? f : "heart"; return resolve(f, n, false); }
  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.clickConfetti = {
    start: start, destroy: destroy, burst: burst, active: function () { return !!cv; },
    families: FAMS, palettes: NAMES, motions: MOTIONS,
    colors: function (f, n, dk) { var p = paletteOf(f, n); return (dk ? p.d : p.l).slice(); },
    draw: function (g, f, n, dk, x, y, s, i) {  // one still piece on any 2D canvas; i picks colour + variant
      f = own(PAL, f) ? f : "heart"; i = i || 0;
      drawPiece(g, { x: x, y: y, s: s, r: 0, ci: i, v: i, ph: i * 1.3, fam: f, pal: paletteOf(f, n), still: 1, life: 0, ttl: 1 }, !!dk);
    }
  };
  start();
})();
