/* ambient_floaters.js - sparkle-that-page 1.4: a slow layer of drifting things behind your content, on ONE canvas.
 * Use: <script src="ambient_floaters.js"></script>   (starts on load)   Pick one: <html data-floaters="sakura">
 *   sakura | leaves | snowflake (or "snow") | bubbles | dust | fairydust | fireflies | dandelion | lanterns | stars |
 *   clouds | hearts.   An unknown name draws sakura.   Count: <html data-floaters-count="18"> (default 18, at most 60).
 *   dust and fairydust take colours from <html data-palette="candy|neon|meadow"> or, when the page sets them, the CSS
 *   tokens --stp-c1 .. --stp-c6 (cute_chrome.css), darkened a little on light pages; neon dust glows. Every other
 *   family has its own light-page and dark-page colours.
 * Each family moves its own way: sakura, leaves, snowflake fall and sway; bubbles, lanterns, hearts rise; dust and
 *   fairydust float and twinkle; fireflies wander and blink; dandelion seeds ride the wind; stars twinkle in place;
 *   clouds drift sideways. Three depth layers: small, faint, slow at the back; bigger, clearer, faster in front.
 * Every shape is a drawn path: no font characters, no emoji, so it looks the same on every system.
 * Light or dark follows the PAGE, with the isDark() rule copied from fairy_cursor.js: data-theme light|dark, else the
 *   <body> then <html> background, else the system scheme only if the page's color-scheme allows dark. It repaints
 *   live when data-theme, class or style on <html>/<body> changes, a background transition ends, the page loads or
 *   the system scheme changes. Changing data-floaters, data-floaters-count or data-palette while running switches it.
 * The canvas has class "stp-floaters": fixed, z-index 0, pointer-events:none, aria-hidden, sharp on dense screens,
 *   resized with the window. Give your content position:relative; z-index:1 to keep it on top.
 * Time-based motion (same speed at 60 and 120 Hz). Reduced motion: does nothing on load and on start().
 * A drifting layer never rests, so its frame loop runs while it is on (browsers pause it in hidden tabs);
 *   destroy() stops it and removes the canvas.
 * Strict CSP (style-src 'self') is fine: the canvas is styled through the CSSOM, with no style element or attribute.
 * In <head> it waits for DOMContentLoaded.
 * API: SparkleThatPage.ambientFloaters
 *   .start() idempotent; after destroy() it re-reads the data-* attributes   .destroy()   .active()
 *   .families (names)   .palettes (["candy","neon","meadow"])
 *   .preview(canvas, family, { palette, dark, scale })  a still picture of a family on your canvas (the gallery uses
 *     it); dark defaults to false; works under reduced motion too
 *   .state()  { family, count, dark, items: [{ x, y, d, s }], layers: [{ n, size, alpha, speed }] }, for tests
 * Gallery: floaters.html. Drawing a new family: references/floaters.md. */
(function () {
"use strict";
var root = document.documentElement, TAU = Math.PI * 2, MAXN = 60, R = Math.random;
var cv = null, ctx = null, items = [], raf = 0, last = 0, fam = "sakura", cols = [], dk = false, key = "", dpr = 1, W = 0, H = 0;
var mo = null, mq = null, probe = null, O = { col: null, x: "#fff", k: "#333", am: 1, dk: false, t: 0, a: 1, r: 1, z: 1 };

// ---- the page's light/dark: copied from fairy_cursor.js ----
function rgba(css) {  // any CSS colour -> [r, g, b, a]
  if (!probe) { var c0 = document.createElement("canvas"); c0.width = c0.height = 1; probe = c0.getContext("2d", { willReadFrequently: true }); }
  probe.clearRect(0, 0, 1, 1); probe.fillStyle = "rgba(0,0,0,0)"; probe.fillStyle = css; probe.fillRect(0, 0, 1, 1);
  return probe.getImageData(0, 0, 1, 1).data;
}
function isDark() {  // the same rule as pageIsDark() in sparkle_trail.js
  var t = root.getAttribute("data-theme"), els = [document.body, root], d, i;
  if (t === "dark" || t === "light") return t === "dark";
  for (i = 0; i < 2; i++) if (els[i] && (d = rgba(getComputedStyle(els[i]).backgroundColor))[3] >= 128) return d[0] * 0.299 + d[1] * 0.587 + d[2] * 0.114 < 128;
  return matchMedia("(prefers-color-scheme: dark)").matches && /\bdark\b/.test(getComputedStyle(root).colorScheme);
}

// ---- colours: a light-page set and a dark-page set for every family ----
function mix(a, b, t) {  // colour a -> colour b by t. Any CSS colour (a page token may be rgb() or oklch()): read by the probe
  var x = rgba(a), y = rgba(b), o = [], i;
  if (x[3] < 128) return a;  // not a colour the probe can read: leave it as it was
  for (i = 0; i < 3; i++) o.push(Math.round(x[i] + (y[i] - x[i]) * t));
  return "rgb(" + o.join(",") + ")";
}
var NAMED = {  // dust and fairydust: data-palette candy | neon | meadow (light page set, dark page set)
  candy:  { l: ["#ec4899", "#a855f7", "#f5b100", "#6366f1", "#f43f5e"], d: ["#f472b6", "#c084fc", "#fde047", "#a5b4fc", "#fb7185"] },
  neon:   { l: ["#00a8cc", "#5fae00", "#e0239f", "#ee8a00", "#7c3aed"], d: ["#2ee6ff", "#b6ff3d", "#ff5ad0", "#ffb43d", "#ffffff"] },
  meadow: { l: ["#e87a90", "#6a5acd", "#2f9e8a", "#d4943a", "#8f7bd0", "#e8956a"], d: ["#f08fa3", "#9d90ee", "#5fd0bc", "#e8ae5c", "#c8b8f0", "#f4c4a0"] }
};
function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k) ? o[k] : null; }
function tokens() { var cs = getComputedStyle(root), o = []; for (var i = 1; i <= 6; i++) { var v = cs.getPropertyValue("--stp-c" + i).trim(); if (v) o.push(v); } return o.length ? o : null; }

// ---- shapes: each is one path in a unit box (radius about 1), built once ----
var SH = null;
function rot(a) { var c = Math.cos(a), s = Math.sin(a); return { a: c, b: s, c: -s, d: c, e: 0, f: 0 }; }
function rep(d, n) { var o = new Path2D(), b = new Path2D(d); for (var i = 0; i < n; i++) o.addPath(b, rot(TAU * i / n)); return o; }
function shapes() {
  if (SH) return SH;
  var star = new Path2D(), i, a, r, wl = new Path2D(), px, py;
  for (i = 0; i < 10; i++) { r = i % 2 ? 0.5 : 1; a = -Math.PI / 2 + i * Math.PI / 5; star[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r); }
  star.closePath();
  for (i = 0; i < 11; i++) { a = -Math.PI + Math.PI * i / 10; px = Math.cos(a) * 0.9; py = Math.sin(a) * 0.9; wl.moveTo(0, 0); wl.lineTo(px, py); wl.moveTo(px + 0.07, py); wl.arc(px, py, 0.07, 0, TAU); }
  SH = {
    pet: new Path2D("M0 .08C-.5 -.2 -.62 -.85 -.18 -.98L0 -.78L.18 -.98C.62 -.85 .5 -.2 0 .08Z"),
    bloom: rep("M0 .08C-.5 -.2 -.62 -.85 -.18 -.98L0 -.78L.18 -.98C.62 -.85 .5 -.2 0 .08Z", 5),
    leaf: new Path2D("M0 -1C.62 -.55 .66 .35 0 1C-.66 .35 -.62 -.55 0 -1Z"),
    rib: new Path2D("M0 -.8V1.2M0 -.15L.3 -.42M0 .25L.34 -.05M0 -.15L-.3 -.42M0 .25L-.34 -.05"),
    flake: rep("M0 0V-1M0 -.5L.3 -.78M0 -.5L-.3 -.78M0 -.78L.14 -.93M0 -.78L-.14 -.93", 6),
    spark: new Path2D("M0 -1Q.12 -.12 1 0Q.12 .12 0 1Q-.12 .12 -1 0Q-.12 -.12 0 -1Z"),
    wing: new Path2D("M0 0C.3 -.55 .95 -.5 .85 -.05C.75 .3 .2 .2 0 0Z"),
    puff: wl,
    lan: new Path2D("M-.5 -.62C-.95 -.3 -.95 .4 -.5 .66H.5C.95 .4 .95 -.3 .5 -.62Z"),
    cap: new Path2D("M-.42 -.62H.42V-.8H-.42ZM-.42 .66H.42V.84H-.42Z"),
    rib2: new Path2D("M-.22 -.62C-.52 -.1 -.52 .3 -.22 .66M.22 -.62C.52 -.1 .52 .3 .22 .66"),
    tas: new Path2D("M0 .84V1.1M0 1.1Q-.1 1.3 -.04 1.42M0 1.1Q.1 1.3 .04 1.42"),
    star: star,
    cloud: new Path2D("M-.62 .42C-1.02 .42 -1.08 -.18 -.66 -.2C-.68 -.62 -.12 -.78 .08 -.46C.26 -.84 .86 -.62 .78 -.15C1.14 -.14 1.12 .42 .7 .42Z"),
    face: new Path2D("M-.4 0Q-.3 .1 -.2 0M.2 0Q.3 .1 .4 0M-.07 .13Q0 .21 .07 .13"),
    heart: new Path2D("M0 .85C-1.1 .1 -.95 -.78 -.4 -.78C-.15 -.78 0 -.58 0 -.42C0 -.58 .15 -.78 .4 -.78C.95 -.78 1.1 .1 0 .85Z"),
    hl: new Path2D("M-.62 -.25C-.7 -.5 -.55 -.62 -.38 -.56"),
    str: new Path2D("M0 1C.25 1.3 -.25 1.55 0 1.85C.2 2.1 -.1 2.3 0 2.5"),
    knot: new Path2D("M0 .8L-.12 1.02H.12Z"),
    ant: new Path2D("M-.07 -.64Q-.14 -.9 -.32 -.98M.07 -.64Q.14 -.9 .32 -.98")
  };
  return SH;
}

// ---- small drawing helpers (c is already moved, turned and scaled to the item) ----
function disc(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
function edge(c, p, lw) { c.fillStyle = O.col.f; c.fill(p); c.strokeStyle = O.col.e; c.lineWidth = lw; c.lineJoin = "round"; c.stroke(p); }
function A(c, m) { c.globalAlpha = Math.max(0, Math.min(1, O.a * m)); }
function twinkle(p, sp) { return 0.5 + 0.5 * Math.sin(O.t * sp * p.q + p.ph * 3); }
function fall(p, w, h) { var m = p.s * 3; if (p.y > h + m) { p.y = -m; p.x = R() * w; } if (p.x > w + m) p.x = -m; else if (p.x < -m) p.x = w + m; }
function rise(p, w, h) { var m = p.s * 3; if (p.y < -m) { p.y = h + m; p.x = R() * w; } if (p.x > w + m) p.x = -m; else if (p.x < -m) p.x = w + m; }
function torus(p, w, h) { var m = p.s * 2; p.x = p.x < -m ? w + m : p.x > w + m ? -m : p.x; p.y = p.y < -m ? h + m : p.y > h + m ? -m : p.y; }

// ---- the families. sz: radius in px for the front layer before depth scaling. l / d: colours on a light / dark page
// (dust and fairydust use the named palettes instead). x: an accent colour, k: ink for faces and bodies, ao: opacity
// scale. mv moves an item (k = 1 is one 60 Hz frame), dr draws it. ----
var FAM = {
  sakura: {
  sz: [8, 13], l: ["#f7a1bf", "#fbbfd2", "#f58cb0", "#fdd0de"], d: ["#ffc2d9", "#ffd6e5", "#ffadc9", "#fff0f5"], x: { l: "#e4588a", d: "#ffd37a" },
  mv: function (p, k, w, h) { p.ph += p.w * k; p.rot += p.vr * k; p.y += p.vy * p.q * k; p.x += (0.2 + Math.sin(p.ph) * 0.5) * p.q * k; fall(p, w, h); },
  dr: function (c, p) { var S = shapes(); c.scale(0.5 + 0.5 * Math.abs(Math.cos(p.ph * 1.6)), 1);
    if (p.v) { c.translate(0, 0.45); c.scale(0.85, 0.85); edge(c, S.pet, 0.08); } else { edge(c, S.bloom, 0.07); c.fillStyle = O.x; disc(c, 0, 0, 0.17); } }
  },
  leaves: {
  sz: [6, 10], l: ["#6dbb6a", "#9ccc55", "#f1a33b", "#e0703a", "#c9a52e"], d: ["#86efac", "#bef264", "#fbbf5c", "#fb9d6b", "#e2c95a"],
  mv: function (p, k, w, h) { p.ph += p.w * k; p.rot = Math.sin(p.ph) * 0.9 + p.a * 0.2; p.y += p.vy * p.q * 1.1 * k; p.x += (0.1 + Math.cos(p.ph) * 0.55) * p.q * k; fall(p, w, h); },
  dr: function (c, p) { var S = shapes(); c.scale(0.7 + 0.3 * Math.cos(p.ph * 1.1), 1); edge(c, S.leaf, 0.08); c.strokeStyle = O.col.e; c.lineWidth = 0.07; c.lineCap = "round"; c.stroke(S.rib); }
  },
  snowflake: {
  sz: [6, 11], l: ["#7f9dc0", "#8eaccd", "#7692b8"], d: ["#f2f8ff", "#d8ecff", "#ffffff"],
  mv: function (p, k, w, h) { p.ph += p.w * k; p.rot += p.vr * k; p.y += (p.vy * 0.8 + 0.1) * p.q * k; p.x += Math.sin(p.ph) * 0.3 * p.q * k; fall(p, w, h); },
  dr: function (c, p) { var S = shapes(); c.fillStyle = c.strokeStyle = O.col.f; c.lineCap = "round";
    if (p.v) { A(c, 0.22); disc(c, 0, 0, 1.05); A(c, 1); disc(c, 0, 0, 0.55); }
    else { A(c, 0.26); c.lineWidth = 0.46; c.stroke(S.flake); A(c, 1); c.lineWidth = 0.15; c.stroke(S.flake); disc(c, 0, 0, 0.16); } }
  },
  bubbles: {
  sz: [8, 18], l: ["#5aaeea", "#9a8fe8", "#4fc4b4", "#ee7fbd"], d: ["#b8e4ff", "#d6c9ff", "#b4f0e4", "#ffc8e6"],
  mv: function (p, k, w, h) { p.ph += p.w * k; p.y -= (p.vy * 0.8 + 0.1) * p.q * k; p.x += Math.sin(p.ph) * 0.35 * p.q * k; rise(p, w, h); },
  dr: function (c, p) { var u = Math.sin(O.t * 0.004 * p.q + p.ph * 5) * 0.06; c.scale(1 + u, 1 - u); c.fillStyle = c.strokeStyle = O.col.f;
    A(c, O.dk ? 0.14 : 0.2); disc(c, 0, 0, 1); A(c, 0.9); c.lineWidth = 0.09; c.beginPath(); c.arc(0, 0, 0.96, 0, TAU); c.stroke();
    c.strokeStyle = c.fillStyle = "#fff"; c.lineCap = "round"; A(c, 1); c.lineWidth = 0.14; c.beginPath(); c.arc(0, 0, 0.62, Math.PI * 1.08, Math.PI * 1.45); c.stroke(); disc(c, 0.5, 0.42, 0.08); }
  },
  dust: {
  sz: [4, 8], pal: 1,
  mv: function (p, k, w, h) { p.ph += p.w * 0.6 * k; p.rot += p.vr * 0.5 * k; p.y -= (p.vy * 0.25 - Math.sin(p.ph * 0.7) * 0.12) * p.q * k; p.x += Math.cos(p.ph) * 0.2 * p.q * k; rise(p, w, h); },
  dr: function (c, p) { var u = 0.55 + 0.45 * twinkle(p, 0.004), g = O.dk ? 1 : 0.6; c.scale(u, u); c.fillStyle = O.col.f;
    if (O.gl) { A(c, 0.1 * g * u); disc(c, 0, 0, 1.9); A(c, 0.2 * g * u); disc(c, 0, 0, 1.2); }  // neon glows, as in 1.x
    A(c, 0.5 + 0.5 * u); c.fill(shapes().spark); if (!O.dk) { c.strokeStyle = O.col.e; c.lineWidth = 0.1; c.lineJoin = "round"; c.stroke(shapes().spark); } }
  },
  fairydust: {
  sz: [2, 4], pal: 1,
  mv: function (p, k, w, h) { p.ph += p.w * 1.2 * k; p.y -= (p.vy * 0.5 + 0.1) * p.q * k; p.x += Math.cos(p.ph) * 0.4 * p.q * k; rise(p, w, h); },
  dr: function (c, p) { var u = 0.5 + 0.5 * twinkle(p, 0.005), g = O.dk ? 1 : 0.7; c.fillStyle = O.col.f;
    A(c, 0.07 * g * (0.5 + u)); disc(c, 0, 0, 3.6); A(c, 0.14 * g * (0.5 + u)); disc(c, 0, 0, 2.3); A(c, 0.9); disc(c, 0, 0, 1);
    if (p.v) { c.scale(1.4, 1.4); c.fillStyle = O.dk ? "#fff" : O.col.f; A(c, 0.6 + 0.4 * u); c.fill(shapes().spark); } }
  },
  fireflies: {
  sz: [8, 12], l: ["#e8a600", "#9bc200", "#f0b400"], d: ["#e8ff6a", "#fff59d", "#b9f96b"], k: { l: "#5a4a30", d: "#8f7f58" },
  mv: function (p, k, w, h, t) { p.a += (Math.sin(t * 0.0007 + p.ph) * 0.04 + (R() - 0.5) * 0.08) * k; p.x += Math.cos(p.a) * 0.3 * p.q * k; p.y += Math.sin(p.a) * 0.24 * p.q * k; p.rot = Math.cos(p.a) * 0.3; torus(p, w, h); },
  dr: function (c, p) { var g = Math.pow(Math.max(0, Math.sin(O.t * 0.0017 * p.q + p.ph * 4)), 2), fl = Math.sin(O.t * 0.05 + p.ph) * 0.15, S = shapes();
    c.fillStyle = O.col.f; A(c, 0.05 + 0.1 * g); disc(c, 0, 0.42, 1.25); A(c, 0.12 + 0.26 * g); disc(c, 0, 0.42, 0.8);  // the glow, round the tail only
    [-1, 1].forEach(function (sd) {  // two soft wings, swept back from the shoulders
      c.save(); c.translate(0.1 * sd, -0.22); c.rotate(-sd * (0.62 + fl)); c.beginPath(); c.ellipse(0, 0.36, 0.2, 0.44, 0, 0, TAU);
      c.fillStyle = O.dk ? "#dfe8ff" : "#fff"; A(c, O.dk ? 0.32 : 0.85); c.fill(); if (!O.dk) { c.strokeStyle = O.k; c.lineWidth = 0.05; A(c, 0.45); c.stroke(); } c.restore(); });
    c.fillStyle = c.strokeStyle = O.k; A(c, 1); c.beginPath(); c.ellipse(0, -0.12, 0.23, 0.32, 0, 0, TAU); c.fill(); disc(c, 0, -0.5, 0.19);
    c.lineWidth = 0.06; c.lineCap = "round"; c.stroke(S.ant);
    c.fillStyle = O.col.f; A(c, 0.75 + 0.25 * g); c.beginPath(); c.ellipse(0, 0.4, 0.26, 0.32, 0, 0, TAU); c.fill();  // the glowing tail end
    c.fillStyle = "#fff"; A(c, (O.dk ? 0.35 : 0.25) + 0.45 * g); c.beginPath(); c.ellipse(0, 0.44, 0.11, 0.15, 0, 0, TAU); c.fill(); }
  },
  dandelion: {
  sz: [11, 16], l: ["#9d917e", "#aa9f8c"], d: ["#f6f1e6", "#e8e1d2"], x: { l: "#8a6d4b", d: "#d8c3a0" },
  mv: function (p, k, w, h) { p.ph += p.w * 0.7 * k; p.rot = Math.sin(p.ph) * 0.45 + 0.25; p.x += (0.3 + Math.sin(p.ph * 0.8) * 0.25) * p.q * k; p.y += (Math.cos(p.ph) * 0.22 - 0.05) * p.q * k; torus(p, w, h); },
  dr: function (c) { var S = shapes(); c.lineCap = "round"; c.strokeStyle = c.fillStyle = O.col.f; c.lineWidth = 0.07; c.stroke(S.puff); c.fill(S.puff);
    c.strokeStyle = O.x; c.lineWidth = 0.08; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 0.78); c.stroke(); c.fillStyle = O.x; c.beginPath(); c.ellipse(0, 0.92, 0.1, 0.22, 0, 0, TAU); c.fill(); }
  },
  lanterns: {
  sz: [11, 16], l: ["#ef5b4c", "#f59a3d", "#f2749f", "#f2b01e"], d: ["#ff7a68", "#ffae5c", "#ff8fb6", "#ffd166"], k: { l: "#8a5a22", d: "#ffe29a" },
  mv: function (p, k, w, h) { p.ph += p.w * 0.7 * k; p.rot = Math.sin(p.ph) * 0.12; p.y -= (p.vy * 0.5 + 0.1) * p.q * k; p.x += Math.sin(p.ph) * 0.3 * p.q * k; rise(p, w, h); },
  dr: function (c, p) { var S = shapes(), g = 0.8 + 0.2 * Math.sin(O.t * 0.006 * p.q + p.ph * 4) + 0.05 * Math.sin(O.t * 0.023 + p.ph); c.fillStyle = O.col.f;
    A(c, (O.dk ? 0.1 : 0.06) * g); disc(c, 0, 0, 1.9); A(c, (O.dk ? 0.16 : 0.1) * g); disc(c, 0, 0, 1.35); A(c, 1);
    edge(c, S.lan, 0.08); c.fillStyle = "#fff6c8"; A(c, (O.dk ? 0.5 : 0.4) * g); c.beginPath(); c.ellipse(0, 0.02, 0.5, 0.52, 0, 0, TAU); c.fill(); A(c, 0.55);
    c.strokeStyle = O.col.e; c.lineWidth = 0.06; c.stroke(S.rib2); A(c, 1);
    c.fillStyle = O.k; c.fill(S.cap); c.strokeStyle = O.k; c.lineWidth = 0.07; c.lineCap = "round"; c.stroke(S.tas); }
  },
  stars: {
  sz: [6, 11], l: ["#f7b928", "#f9a53a", "#ffcf3a", "#b39ddb"], d: ["#fff3a6", "#ffe27a", "#ffffff", "#cdbdff"],
  init: function (p) { p.bx = p.x; p.by = p.y; },
  mv: function (p, k) { p.ph += p.w * 0.25 * k; p.x = p.bx + Math.cos(p.ph * 3) * 3; p.y = p.by + Math.sin(p.ph * 2.3) * 3; p.rot = Math.sin(p.ph * 2) * 0.25; },
  dr: function (c, p) { var u = twinkle(p, 0.0034), s = 0.72 + 0.28 * u, S = shapes(); c.scale(s, s); A(c, 0.5 + 0.5 * u);
    c.fillStyle = c.strokeStyle = O.col.f; c.lineJoin = "round"; c.lineWidth = 0.3; c.fill(S.star); c.stroke(S.star);
    c.strokeStyle = O.col.e; c.lineWidth = 0.06; c.stroke(S.star); c.fillStyle = "#fff"; A(c, 0.75); disc(c, -0.2, -0.22, 0.12); }
  },
  clouds: {
  sz: [20, 34], l: ["#ffffff", "#f4f8ff", "#fff5fa"], d: ["#c6d4ff", "#d4cffc", "#e4d4f8"], k: { l: "#7b90b4", d: "#5e64a8" }, ao: { l: 1, d: 0.85 }, ad: [0.85, 0.92, 1],  // ad: on dark pages a back cloud at half alpha is a grey storm cloud, so the layers stay close
  init: function (p, w, h) { p.by = p.y = h * (0.03 + R() * 0.55); p.vy = 0.06 + R() * 0.14; p.rot = (R() - 0.5) * 0.12; },
  mv: function (p, k, w, h) { p.ph += p.w * 0.3 * k; p.x += p.vy * p.q * k; p.y = p.by + Math.sin(p.ph) * 3; if (p.x > w + p.s * 1.6) { p.x = -p.s * 1.6; p.by = h * (0.03 + R() * 0.55); } },
  dr: function (c, p) { var S = shapes(); edge(c, S.cloud, p.d ? 0.065 : 0.1); if (!p.d && !O.dk) { A(c, 1.5); c.stroke(S.cloud); A(c, 1); }  // a wider, firmer edge on the small, faint back layer
    if (p.v && p.d) { c.strokeStyle = O.k; c.lineWidth = 0.07; c.lineCap = "round"; c.stroke(S.face); c.fillStyle = "#ff8fb0"; A(c, 0.5); disc(c, -0.52, 0.2, 0.09); disc(c, 0.52, 0.2, 0.09); } }
  },
  hearts: {
  sz: [8, 13], l: ["#f4577a", "#f77fa3", "#b57bee", "#ff8f7b"], d: ["#ff7096", "#ffa0bd", "#c8a2ff", "#ffb4a2"],
  mv: function (p, k, w, h) { p.ph += p.w * 0.8 * k; p.rot = Math.sin(p.ph) * 0.16; p.y -= (p.vy * 0.8 + 0.1) * p.q * k; p.x += Math.sin(p.ph) * 0.35 * p.q * k; rise(p, w, h); },
  dr: function (c) { var S = shapes(); c.strokeStyle = O.col.e; c.lineWidth = 0.05; c.lineCap = "round"; c.stroke(S.str); edge(c, S.heart, 0.07);
    c.fillStyle = O.col.e; c.fill(S.knot); c.strokeStyle = "#fff"; c.lineWidth = 0.11; A(c, 0.85); c.stroke(S.hl); }
  }
};
var NAMES = Object.keys(FAM), ALIAS = { snow: "snowflake" };
function pick(n) { n = own(ALIAS, n) || n; return own(FAM, n) ? n : "sakura"; }

function colours(name, d, pal) {  // the colour list for a family on a light or dark page
  var F = FAM[name], list, ink = d ? "#ffffff" : "#2a1a3a", o = [], i;
  if (F.pal) { list = tokens(); if (list && !d) list = list.map(function (v) { return mix(v, ink, 0.25); });  // page tokens are made for any page: darken them a little on a light one
    list = list || (own(NAMED, pal) || NAMED.candy)[d ? "d" : "l"]; } else list = F[d ? "d" : "l"];
  for (i = 0; i < list.length; i++) o.push({ f: list[i], e: F.pal ? (d ? list[i] : mix(list[i], ink, 0.4)) : name === "clouds" ? mix(list[i], d ? "#f6f9ff" : "#4a6fa0", d ? 0.7 : 0.5) : mix(list[i], ink, d ? 0.38 : 0.3) });
  return o;
}
function setO(name, d, pal) {
  var F = FAM[name], m = d ? "d" : "l";
  O.dk = d; O.gl = pal === "neon"; O.x = F.x ? F.x[m] : "#fff"; O.k = F.k ? F.k[m] : d ? "#fff" : "#333"; O.am = F.ao ? F.ao[m] : 1;
}

// ---- items and the three depth layers ----
var DEPTH = [{ z: 0.55, a: 0.5, v: 0.55 }, { z: 0.8, a: 0.75, v: 0.85 }, { z: 1.15, a: 1, v: 1.15 }];
function make(F, d, w, h) {
  var D = DEPTH[d], p = { d: d, x: R() * w, y: R() * h, s: (F.sz[0] + R() * (F.sz[1] - F.sz[0])) * D.z, q: D.v * (0.8 + R() * 0.4),
    ph: R() * TAU, w: 0.015 + R() * 0.015, rot: (R() - 0.5) * 1.2, ci: (R() * 8) | 0, v: R() < 0.5, vy: 0.4 + R() * 0.4, vr: (R() - 0.5) * 0.03, a: R() * TAU };
  if (F.init) F.init(p, w, h);
  return p;
}
function drawItem(c, F, p) {
  var D = DEPTH[p.d], s = p.s * O.z, cs = Math.cos(p.rot) * s * O.r, sn = Math.sin(p.rot) * s * O.r;
  O.col = cols[p.ci % cols.length]; O.a = (O.dk && F.ad ? F.ad[p.d] : D.a) * O.am;
  c.setTransform(cs, sn, -sn, cs, p.x * O.r, p.y * O.r);
  c.globalAlpha = O.a; c.lineCap = "butt"; c.lineJoin = "miter";
  F.dr(c, p);
}

function size() {
  var nw = innerWidth, nh = innerHeight, i, p;
  dpr = Math.min(devicePixelRatio || 1, 2);
  if (W && H && (nw !== W || nh !== H)) for (i = 0; i < items.length; i++) { p = items[i]; p.x *= nw / W; p.y *= nh / H; if (p.bx !== undefined) p.bx *= nw / W; if (p.by !== undefined) p.by *= nh / H; }
  W = nw; H = nh;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); O.r = dpr;
}
function build() {
  var N = Math.max(1, Math.min(MAXN, parseInt(root.dataset.floatersCount, 10) || 18)), nb = Math.round(N * 0.4), nm = Math.round(N * 0.35), i;
  items = [];
  for (i = 0; i < N; i++) items.push(make(FAM[fam], i < nb ? 0 : i < nb + nm ? 1 : 2, W, H));
}
function refresh() {  // the page's theme or our attributes may have changed
  if (!cv) return;
  var ds = root.dataset, nf = pick(ds.floaters || "sakura"), k = nf + "|" + (ds.floatersCount || "");
  dk = isDark(); fam = nf; cols = colours(fam, dk, ds.palette); setO(fam, dk, ds.palette);
  if (k !== key) { key = k; build(); }
  if (mo) mo.takeRecords();
}
function onEnd(e) { if (e.target === root || e.target === document.body) refresh(); }
function watchBody() { if (mo && document.body) { mo.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] }); refresh(); } }

function tick(now) {
  var k = last ? Math.min((now - last) / 16.667, 3) : 1, F = FAM[fam], i, p; last = now;  // k = 1 is one 60 Hz frame
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
  O.t = now; O.z = 1; O.r = dpr;
  for (i = 0; i < items.length; i++) { p = items[i]; F.mv(p, k, W, H, now); drawItem(ctx, F, p); }
  raf = requestAnimationFrame(tick);
}

function start() {
  if (cv || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!document.body) { document.addEventListener("DOMContentLoaded", start, { once: true }); return; }  // script in <head>
  cv = document.createElement("canvas");
  cv.className = "stp-floaters"; cv.setAttribute("aria-hidden", "true");
  cv.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:0";
  document.body.appendChild(cv);
  ctx = cv.getContext("2d"); W = H = 0; key = ""; items = [];
  size(); refresh();
  mo = new MutationObserver(refresh);
  mo.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-floaters", "data-floaters-count", "data-palette", "class", "style"] });
  watchBody();
  addEventListener("resize", size); addEventListener("load", refresh); root.addEventListener("transitionend", onEnd);
  mq = matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) mq.addEventListener("change", refresh); else mq.addListener(refresh);
  last = 0; raf = requestAnimationFrame(tick);
}
function destroy() {
  document.removeEventListener("DOMContentLoaded", start);
  if (!cv) return;
  cancelAnimationFrame(raf); raf = 0;
  if (mo) { mo.disconnect(); mo = null; }
  removeEventListener("resize", size); removeEventListener("load", refresh); root.removeEventListener("transitionend", onEnd);
  if (mq) { if (mq.removeEventListener) mq.removeEventListener("change", refresh); else mq.removeListener(refresh); mq = null; }
  cv.remove(); cv = ctx = null; items = []; key = "";
}

// ---- a still picture of one family, for galleries ----
var SPOTS = [[0.1, 0.74, 0], [0.36, 0.86, 0], [0.62, 0.14, 0], [0.92, 0.62, 0], [0.4, 0.1, 0], [0.22, 0.34, 1], [0.7, 0.74, 1], [0.5, 0.5, 2], [0.84, 0.26, 2]];
var CLOUD_SPOTS = [[0.82, 0.8, 0], [0.12, 0.18, 0], [0.74, 0.3, 1], [0.34, 0.62, 2]];
function preview(canvas, name, o) {
  o = o || {}; name = pick(name);
  var F = FAM[name], w = canvas.clientWidth || +canvas.getAttribute("width") || 200, h = canvas.clientHeight || +canvas.getAttribute("height") || 120, r = Math.min(devicePixelRatio || 1, 2);
  var c = canvas.getContext("2d"), spots = name === "clouds" ? CLOUD_SPOTS : SPOTS, keep = R, seed = 7, i, p, list = [], sv = [O.r, O.z, O.t];
  for (i = 0; i < name.length; i++) seed = (seed * 31 + name.charCodeAt(i)) | 0;
  R = function () { seed = (seed * 1664525 + 1013904223) | 0; return ((seed >>> 8) & 0xffffff) / 16777216; };
  canvas.width = Math.round(w * r); canvas.height = Math.round(h * r);
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, canvas.width, canvas.height);
  cols = colours(name, !!o.dark, o.palette); setO(name, !!o.dark, o.palette);  // borrows the live layer's colours for a moment
  O.r = r; O.z = o.scale || h / 80; O.t = 2400;
  for (i = 0; i < spots.length; i++) {
    p = make(F, spots[i][2], w, h); p.x = spots[i][0] * w; p.y = spots[i][1] * h; p.ci = i; p.v = name === "clouds" ? i !== 0 : i % 2 === 0; p.ph = 0.6 + i * 1.3;
    if (F.init) { p.bx = p.x; p.by = p.y; }
    list.push(p);
  }
  R = keep;
  for (i = 0; i < list.length; i++) { p = list[i]; F.mv(p, 0, 1e9, 1e9, 0); drawItem(c, F, p); }
  c.setTransform(1, 0, 0, 1, 0, 0);
  O.r = sv[0]; O.z = sv[1]; O.t = sv[2];
  if (cv) { cols = colours(fam, dk, root.dataset.palette); setO(fam, dk, root.dataset.palette); }
}

function state() {
  var ls = [0, 1, 2].map(function () { return { n: 0, size: 0, alpha: 0, speed: 0 }; });
  items.forEach(function (p) { var l = ls[p.d]; l.n++; l.size += p.s; });
  ls.forEach(function (l, i) { if (l.n) l.size /= l.n; l.alpha = DEPTH[i].a; l.speed = DEPTH[i].v; });
  return { family: fam, count: items.length, dark: dk, items: items.map(function (p) { return { x: p.x, y: p.y, d: p.d, s: p.s }; }), layers: ls };
}

window.SparkleThatPage = window.SparkleThatPage || {};
window.SparkleThatPage.ambientFloaters = { start: start, destroy: destroy, active: function () { return !!cv; }, families: NAMES.slice(), palettes: Object.keys(NAMED), preview: preview, state: state };
start();
})();
