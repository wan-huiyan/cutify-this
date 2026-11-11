/* scroll_indicator.js - sparkle-that-page: a scroll-depth companion. Starts on load. Pick one on <html>:
 *   data-scroll="ring" (default): a filling % ring, bottom-right, idle bob; "comet": a top bar with a star head;
 *   "mascot" (or "climber"): a pixel climber down a rail on the right, data-scroll-mascot = cat (default) | bunny |
 *   bear | frog; "sprout": bottom-right, grows a leaf at each step, flowers at the end; "rocket": rises up the right,
 *   lands on a moon; "caterpillar": crawls along the bottom to a leaf; "moon": bottom-right, new to full;
 *   "balloon": rises up the right and bobs. Travellers get a dotted rail, .stp-scroll-track (one z-index below).
 * Progress: 0 at the top, 1 at the bottom (position, the sprout's growth, the moon's phase). The element
 * [data-stp-scroll="<variant>"] carries data-stp-progress, data-stp-state (idle|moving|holding|end) and the classes
 * "is-moving" (scrolling), "is-holding" (a fast scroll: clings on, worried, wind lines; gone when it ends) and
 * "is-end" (the very bottom: cheers once; removed when you scroll up).
 * API: SparkleThatPage.scrollIndicator.start() / .destroy() (start() is idempotent; destroy() then start() re-reads
 * data-scroll), .progress(), .state(), and for galleries .families, .mascots, .states and
 * .svg(family, state, dark, { mascot, progress, cell }), a still picture.
 * Light/dark follows the PAGE: isDark() is copied from fairy_cursor.js (data-theme, else the <body> then <html>
 * background, else the system scheme if color-scheme allows dark); repaints live on data-theme / class / style
 * changes on <html> or <body>, a background transition ending, load, and a system scheme change.
 * Motion: transform only (and the ring's stroke-dashoffset). Position is the element's transform; the sway, the
 * fast-scroll shiver and the balloon's bob animate its own rotate / translate / scale; the cheer hops the inner
 * wrapper; blinks swap the picture on a timer. No frame callback runs while nothing scrolls. Reduced motion: no
 * sway, shiver, bob, blink, hop or position easing; classes, progress and pictures still track.
 * Strict CSP (style-src 'self') is fine: styles go through the CSSOM, the markup has no style="".
 * New shapes are SVG paths (pixel art, one path per colour), never font characters; the ring keeps its 1.x circles
 * and "N%" label. Drawing one: references/scroll-mascots.md. In <head> it waits for DOMContentLoaded. */
(function () {
"use strict";
var root = document.documentElement, el = null, wrap = null, track = null, raf = 0, variant, look, ring, label, bar, head;
var wasEnd = false, firstScroll = true, moving = false, holding = false, vel = 0, lastY = 0, lastT = 0, settleT = 0, blinkT = 0, blinking = false;
var cur = { p: 0, state: "idle" }, poseKey = "", motion = "", anim = null, bob = null, mo = null, mq = null, dark = false, probe;
var NS = "http://www.w3.org/2000/svg", FAST = 4;  // px per ms: faster than this is a fast scroll ("holding on")
var FAMS = ["ring", "comet", "mascot", "sprout", "rocket", "caterpillar", "moon", "balloon"];
var MASCOTS = ["cat", "bunny", "bear", "frog"], STATES = ["idle", "moving", "holding", "end"];
function reduced() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }
function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k) ? o[k] : null; }

// ---- colours
function mix(a, b, t) {  // hex colour a -> b by t
  var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), o = "#";
  for (var s = 16; s >= 0; s -= 8) { var u = (x >> s) & 255; o += ("0" + Math.round(u + (((y >> s) & 255) - u) * t).toString(16)).slice(-2); }
  return o;
}
// Shared keys: o outline, k eyes, h blush, s sweat, y sparkle, n wind lines, x mouth inside. Each look adds its own.
var BASE = { k: "#1f2937", h: "#f472b6", s: "#7dd3fc", x: "#be185d" };
var LOOKS = {
  cat: { b: "#ffffff", e: "#f9a8d4", m: "#fde7f0", B: "#f3d7e6" },
  bunny: { b: "#fdba74", e: "#f472b6", m: "#ffedd5", B: "#f59e0b" },
  bear: { b: "#d97706", e: "#fbbf24", m: "#fde68a", B: "#92400e" },
  frog: { b: "#84cc16", e: "#65a30d", m: "#ecfccb", B: "#4d7c0f", w: "#ffffff" },
  sprout: { t: "#f08a5d", T: "#c2410c", S: "#78350f", g: "#4ade80", G: "#15803d", p: "#f9a8d4", c: "#fde047" },
  rocket: { b: "#f8fafc", p: "#f472b6", e: "#a78bfa", c: "#7dd3fc", B: "#94a3b8", f: "#fb923c", F: "#fde047", M: "#fde68a", N: "#e2b84a" },
  caterpillar: { b: "#86efac", B: "#4ade80", e: "#bef264", p: "#f9a8d4", g: "#22c55e", G: "#15803d" },
  moon: { b: "#fde68a", B: "#f2c94c", d: "#cbd5e1" },
  balloon: { b: "#f9a8d4", w: "#ffffff", B: "#db2777" }
};
function palette(name, dk) {
  var src = own(LOOKS, name) || LOOKS.cat, out = {}, i;
  for (i in BASE) out[i] = BASE[i];
  for (i in src) out[i] = dk ? mix(src[i], "#ffffff", 0.1) : src[i];
  out.o = dk ? "#efe6ff" : "#2a2140";  // outline flips with the page, like the wand's ink
  out.n = dk ? "#cbd5e1" : "#64748b";  // wind lines
  out.y = dk ? "#fde047" : "#d97706";  // sparkles: gold on dark, deep amber on white
  if (name === "moon" && dk) out.d = "#475569";  // the unlit part of the moon
  out.K = dk ? "#e2e8f0" : "#1f2937";  // eyes drawn on the unlit moon
  return out;
}

// ---- the pixel kit: draw on a grid, outline the filled cells, then emit one path per colour
function grid(W, H) {
  var c = new Array(W * H), g = { W: W, H: H, c: c };
  g.r = function (x, y, w, h, k) { for (var j = y; j < y + h; j++) for (var i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < W && j < H) c[j * W + i] = k; };
  g.m = function (x, y, w, h, k) { g.r(x, y, w, h, k); g.r(W - x - w, y, w, h, k); };  // a rect and its mirror
  g.p = function (k, s) { for (var i = 0; i < s.length; i += 2) g.r(parseInt(s[i], 36), parseInt(s[i + 1], 36), 1, 1, k); };
  g.pm = function (k, s) { for (var i = 0; i < s.length; i += 2) g.m(parseInt(s[i], 36), parseInt(s[i + 1], 36), 1, 1, k); };
  g.at = function (x, y) { return c[y * W + x]; };
  g.line = function () {  // outline: every empty cell beside a filled one
    var add = [];
    for (var j = 0; j < H; j++) for (var i = 0; i < W; i++) if (!c[j * W + i] && ((i && c[j * W + i - 1]) || (i < W - 1 && c[j * W + i + 1]) || (j && c[(j - 1) * W + i]) || (j < H - 1 && c[(j + 1) * W + i]))) add.push(j * W + i);
    add.forEach(function (n) { c[n] = "o"; });
  };
  return g;
}
function toSVG(g, pal, cell) {
  var by = {}, out = "", W = g.W;
  for (var y = 0; y < g.H; y++) for (var x = 0; x < W; x++) {
    var k = g.c[y * W + x]; if (!k) continue;
    var n = 1; while (x + n < W && g.c[y * W + x + n] === k) n++;
    by[k] = (by[k] || "") + "M" + x + " " + y + "h" + n + "v1h-" + n + "z"; x += n - 1;
  }
  for (var k2 in by) out += '<path fill="' + (pal[k2] || "#f0f") + '" d="' + by[k2] + '"/>';
  return '<svg xmlns="' + NS + '" width="' + W * cell + '" height="' + g.H * cell + '" viewBox="0 0 ' + W + " " + g.H + '" shape-rendering="crispEdges">' + out + "</svg>";
}

function dots(g, k, x, y, s) { for (var i = 0; i < s.length; i += 2) g.r(x + +s[i], y + +s[i + 1], 1, 1, k); }  // cells at offsets "dxdy..."
function spark(g, x, y) { dots(g, "y", x - 1, y - 1, "1001112112"); }
function wind(g, rows) { rows.forEach(function (r) { g.r(r[0], r[1], r[2], 1, "n"); }); }
// A face: eyes at ex (left eye x; the right one mirrors), ey; mouth centred on cx (two cells: cx, cx+1) at my.
function face(g, st, ex, ey, cx, my, blink, eyeKey) {
  var W = g.W, rx = W - 1 - ex, k = eyeKey || "k";
  if (st === "holding") {  // squeezed shut: > <
    dots(g, k, ex - 1, ey, "001102"); dots(g, k, rx, ey, "100112"); dots(g, k, cx - 1, my, "01102130");
  } else if (st === "end") {  // happy ^ ^ and an open smile
    dots(g, k, ex - 1, ey, "011021"); dots(g, k, rx - 1, ey, "011021");
    g.r(cx, my, 2, 1, k); g.r(cx, my + 1, 2, 1, "x");
  } else {
    if (blink) { g.r(ex - 1, ey + 1, 2, 1, k); g.r(rx, ey + 1, 2, 1, k); }
    else { var up = st === "moving" ? -1 : 0; g.r(ex, ey + up, 1, 2, k); g.r(rx, ey + up, 1, 2, k); }
    if (st === "moving") g.r(cx, my, 2, 1, k); else dots(g, k, cx - 1, my, "00301121");
  }
}

// ---- the looks: each draws one state; p is the progress
// Climbers: 20 x 20 cells, head x 4-15 y 6-14.
function climber(name, st, p, blink) {
  var g = grid(20, 20), frog = name === "frog";
  if (name === "cat") { g.pm("b", "434445545565"); g.pm("e", "55"); }
  if (name === "bunny") { g.m(5, 1, 2, 5, "b"); g.m(6, 2, 1, 3, "e"); }
  if (name === "bear") { g.m(4, 4, 3, 3, "b"); g.m(5, 5, 1, 1, "e"); g.pm("b", "46"); }
  if (frog) { g.m(4, 3, 5, 4, "b"); g.m(5, 4, 3, 2, "w"); }
  g.r(5, 6, 10, 1, "b"); g.r(4, 7, 12, 7, "b"); g.r(5, 14, 10, 1, "b");
  if (name === "bear") g.r(7, 10, 6, 3, "m");
  if (frog) g.r(5, 13, 10, 1, "e");
  g.r(6, 15, 8, 2, "b"); g.r(8, 15, 4, 2, "m");  // body and belly
  if (st === "holding") { g.r(5, 17, 2, 2, "B"); g.r(13, 17, 2, 2, "B"); }  // dangling feet
  else { g.r(6, 17, 3, 1, "B"); g.r(11, 17, 3, 1, "B"); }
  if (st === "idle") { g.r(5, 14, 2, 2, "m"); g.r(13, 14, 2, 2, "m"); }  // paws on the rail
  if (st === "moving") { g.r(16, 3, 2, 6, "b"); g.r(16, 2, 2, 2, "m"); g.r(3, 13, 2, 2, "m"); }
  if (st === "holding") { if (frog) g.r(9, 2, 2, 1, "b"); else g.m(8, 3, 1, 3, "b"); g.r(8, 1, 4, 2, "m"); }  // paws grip the rail
  if (st === "end") { g.pm("b", "38372726161515"); g.pm("m", "1424"); g.pm("m", "1323"); }
  g.line();
  if (frog) {  // the frog's eyes sit on its bumps
    if (st === "holding" || st === "end" || blink) g.m(5, 4, 3, 2, "b");
    if (st === "holding" || st === "end") g.pm("k", st === "end" ? "556475" : "546574");
    else if (blink) g.m(5, 5, 3, 1, "k");
    else g.m(6, 4, 1, st === "moving" ? 1 : 2, "k");
    if (st === "end") { g.r(8, 10, 4, 1, "k"); g.r(9, 11, 2, 1, "x"); }
    else if (st === "holding") g.p("k", "8b9aabba");
    else { g.p("k", "7a8bbbca"); g.r(9, 11, 2, 1, "k"); }
    g.r(5, 10, 2, 1, "h"); g.r(13, 10, 2, 1, "h");
  } else {
    face(g, st, 7, 9, 9, 11, blink);
    g.r(5, 11, 2, 1, "h"); g.r(13, 11, 2, 1, "h");
    if (name === "bunny") g.r(9, 10, 2, 1, "e");
    if (name === "bear" && (st === "idle" || st === "moving")) g.r(9, 10, 2, 1, "k");
  }
  if (st === "holding") { g.p("s", "h6h7i7"); wind(g, [[0, 9, 3], [1, 12, 2], [0, 15, 3]]); }
  if (st === "end") { spark(g, 1, 1); spark(g, 18, 1); }
  return g;
}

// Rocket: 20 x 28; a flame when moving / holding, a moon at the end.
function rocket(st, p, blink) {
  var g = grid(20, 28);
  g.r(9, 1, 2, 1, "p"); g.r(8, 2, 4, 1, "p"); g.r(7, 3, 6, 2, "p");
  g.r(6, 5, 8, 11, "b"); g.r(6, 15, 8, 1, "e"); g.r(7, 16, 6, 1, "b"); g.r(8, 17, 4, 1, "B");
  g.r(8, 6, 4, 1, "e"); g.m(7, 7, 1, 2, "e"); g.r(8, 9, 4, 1, "e"); g.r(8, 7, 4, 2, "c"); g.r(8, 7, 1, 1, "b");  // window
  g.m(4, 12, 2, 5, "p"); g.m(3, 14, 1, 3, "p");  // fins
  if (st === "moving") { g.r(8, 18, 4, 2, "f"); g.r(9, 20, 2, 1, "f"); g.r(9, 18, 2, 1, "F"); }
  if (st === "holding") { g.r(7, 18, 6, 3, "f"); g.r(8, 21, 4, 2, "f"); g.r(9, 23, 2, 2, "f"); g.r(8, 18, 4, 2, "F"); g.r(9, 20, 2, 2, "F"); }
  if (st === "end") { g.m(6, 18, 1, 2, "B"); g.r(6, 20, 8, 1, "M"); g.r(4, 21, 12, 1, "M"); g.r(3, 22, 14, 1, "M"); g.r(2, 23, 16, 4, "M"); g.r(4, 24, 3, 2, "N"); g.r(5, 26, 1, 1, "N"); g.r(12, 23, 2, 1, "N"); g.r(10, 26, 3, 1, "N"); }
  g.line();
  face(g, st, 8, 10, 9, 13, blink);
  g.m(6, 12, 1, 1, "h");
  if (st === "holding") wind(g, [[1, 3, 2], [17, 5, 2], [0, 9, 2], [18, 10, 2]]), g.p("s", "eaebfb");
  if (st === "end") { spark(g, 2, 3); spark(g, 17, 8); }
  return g;
}

// Balloon: 16 x 28, with an ink string.
function balloon(st, p, blink) {
  var g = grid(16, 28), sq = st === "holding";
  if (sq) { g.r(4, 3, 8, 1, "b"); g.r(2, 4, 12, 1, "b"); g.r(1, 5, 14, 7, "b"); g.r(2, 12, 12, 1, "b"); g.r(4, 13, 8, 1, "b"); }
  else { g.r(5, 1, 6, 1, "b"); g.r(3, 2, 10, 1, "b"); g.r(2, 3, 12, 1, "b"); g.r(1, 4, 14, 7, "b"); g.r(2, 11, 12, 1, "b"); g.r(3, 12, 10, 1, "b"); g.r(5, 13, 6, 1, "b"); }
  g.r(7, 14, 2, 1, "B"); g.r(6, 15, 4, 1, "B");
  g.line();
  g.p("w", sq ? "3646" : "443545");
  face(g, st, 5, sq ? 7 : 6, 7, sq ? 9 : 8, blink);
  g.m(3, sq ? 10 : 9, 1, 1, "h");
  var s = st === "moving" ? "8g9h9iajakalambncnbo" : sq ? "7g7h6i5j5k6l7m7n6o5p" : "7g8h8i7j6k6l7m8n8o7p";
  if (!sq && st !== "moving") s += "7q";
  g.p("o", s);
  if (sq) { wind(g, [[13, 1, 2], [14, 15, 2], [11, 18, 3]]); g.p("s", "d4d5"); }
  if (st === "end") { spark(g, 1, 16); spark(g, 13, 20); }
  return g;
}

// Caterpillar: 34 x 14, heading right; a leaf at the end.
function caterpillar(st, p, blink) {
  var g = grid(34, 14), off = st === "moving" ? [0, -2, -2, 0] : st === "holding" ? [-3, -2, -1, 0] : [0, 0, 0, 0];
  for (var i = 0; i < 4; i++) {
    var x = 1 + i * 5, y = 6 + off[i], k = i % 2 ? "B" : "b";
    g.r(x + 1, y, 3, 1, k); g.r(x, y + 1, 5, 3, k); g.r(x + 1, y + 4, 3, 1, k);
    if (!off[i]) { g.r(x + 1, y + 5, 1, 1, "G"); g.r(x + 3, y + 5, 1, 1, "G"); }
  }
  var hx = 20, hy = st === "holding" ? 5 : 4;
  g.r(hx + 1, hy, 5, 1, "e"); g.r(hx, hy + 1, 7, 5, "e"); g.r(hx + 1, hy + 6, 5, 1, "e");
  g.r(hx + 1, hy - 1, 1, 1, "G"); g.r(hx + 5, hy - 1, 1, 1, "G"); g.r(hx, hy - 2, 1, 1, "p"); g.r(hx + 6, hy - 2, 1, 1, "p");
  if (st === "end") { g.r(30, 1, 1, 1, "g"); g.r(29, 2, 3, 1, "g"); g.r(28, 3, 5, 5, "g"); g.r(29, 8, 3, 1, "g"); g.r(30, 9, 1, 3, "G"); g.r(30, 3, 1, 6, "G"); g.p("G", "v4x5"); g.r(28, 4, 1, 3, ""); }
  g.line();
  face({ W: 2 * hx + 7, r: g.r }, st, hx + 2, hy + 2, hx + 2, hy + 4, blink);
  g.r(hx + 1, hy + 4, 1, 1, "h"); g.r(hx + 5, hy + 4, 1, 1, "h");
  if (st === "holding") { wind(g, [[0, 1, 3], [6, 0, 3], [12, 2, 2]]); g.p("s", "r4s4"); }
  if (st === "end") { spark(g, 3, 2); spark(g, 14, 1); }
  return g;
}

// Moon: 20 x 20, lit from the right as p goes 0 -> 1.
function moon(st, p, blink) {
  var g = grid(20, 20), R = 8.6, c = 9.5, kk = 1 - 2 * p;
  for (var y = 0; y < 20; y++) for (var x = 0; x < 20; x++) {
    var u = (x + 0.5 - c) / R, v = (y + 0.5 - c) / R;
    if (u * u + v * v <= 1) g.r(x, y, 1, 1, u > kk * Math.sqrt(Math.max(0, 1 - v * v)) ? "b" : "d");
  }
  g.line();
  if (g.at(13, 5) === "b") g.r(13, 5, 2, 2, "B");
  if (g.at(15, 12) === "b") g.r(15, 12, 1, 1, "B");
  if (g.at(4, 13) === "b") g.r(4, 13, 2, 1, "B");
  var under = g.c.slice();
  face(g, st, 6, 8, 9, 11, st === "idle" ? !blink : blink);  // idle: sleepy eyes, opening when it "blinks"
  g.c.forEach(function (k, i) { if (k === "k" && under[i] === "d") g.c[i] = "K"; });
  g.r(4, 11, 2, 1, "h"); g.r(14, 11, 2, 1, "h");
  if (st === "holding") { g.p("s", "h3h4i4"); wind(g, [[0, 2, 3], [0, 17, 3]]); }
  if (st === "end") { spark(g, 1, 1); spark(g, 18, 2); spark(g, 18, 18); }
  return g;
}

// Sprout: 19 x 26; the stem grows with p, a flower at the end.
function sprout(st, p, blink) {
  var g = grid(19, 26), h = 1 + Math.round(p * 11), top = 18 - h, bend = st === "holding", i;
  function sx(y) { return 9 + (bend ? Math.round((18 - y) * (18 - y) / 30) : 0); }
  for (i = 0; i < h; i++) g.r(sx(17 - i), 17 - i, 1, 1, "G");
  var leaves = Math.min(4, Math.floor(p * 5));
  for (i = 0; i < leaves; i++) {
    var ly = 15 - i * 2, lx = sx(ly), side = i % 2 ? 1 : -1;
    g.r(lx + side, ly, 1, 1, "g"); g.r(lx + side * 2, ly, 1, 1, "g"); g.r(lx + side * 2, ly - 1, 1, 1, "g"); g.r(lx + side * 3, ly - 1, 1, 1, "g");
  }
  var tx = sx(top);
  if (st === "end") { g.r(tx - 1, top - 4, 3, 1, "p"); g.r(tx - 3, top - 3, 2, 3, "p"); g.r(tx + 2, top - 3, 2, 3, "p"); g.r(tx - 1, top, 3, 1, "p"); g.r(tx - 1, top - 3, 3, 3, "c"); }
  else { g.r(tx - 2, top - 1, 2, 1, "g"); g.r(tx + 1, top - 1, 2, 1, "g"); g.r(tx - 1, top, 1, 1, "g"); g.r(tx + 1, top, 1, 1, "g"); }
  g.r(4, 18, 11, 2, "T"); g.r(5, 18, 9, 1, "S"); g.r(5, 20, 9, 4, "t"); g.r(6, 24, 7, 1, "t");
  g.line();
  face(g, st, 7, 20, 8, 22, blink);
  g.r(5, 22, 1, 1, "h"); g.r(13, 22, 1, 1, "h");
  if (st === "end") { g.r(tx, top - 2, 1, 1, "k"); spark(g, 2, 4); spark(g, 16, 8); }
  if (st === "holding") { wind(g, [[0, 3, 3], [1, 8, 3], [0, 13, 2]]); g.p("s", "f1"); }
  return g;
}

var DRAW = { sprout: sprout, rocket: rocket, caterpillar: caterpillar, moon: moon, balloon: balloon };
function pixelSVG(fam, mas, st, dk, p, cell, blink) {
  var name = fam === "mascot" ? mas : fam, g = fam === "mascot" ? climber(mas, st, p, blink) : DRAW[fam](st, p, blink);
  return toSVG(g, palette(name, dk), cell || 2);
}

// The two classics. The ring and comet stills are only for a gallery; the live ones are built in build().
var RINGC = [["#f3e8ff", "#9333ea", "#7e22ce"], ["#3b2a55", "#d8b4fe", "#e9d5ff"]];
var STAR = "M7 0C7.7 4.5 9.5 6.3 14 7 9.5 7.7 7.7 9.5 7 14 6.3 9.5 4.5 7.7 0 7 4.5 6.3 6.3 4.5 7 0Z";
function ringSVG(p, dk, size) {
  var c = RINGC[dk ? 1 : 0];
  return '<svg xmlns="' + NS + '" width="' + size + '" height="' + size + '" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="' + c[0] + '" stroke-width="4"/><circle class="stp-ring" cx="18" cy="18" r="15" fill="none" stroke="' + c[1] + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="94.2" stroke-dashoffset="' + (94.2 * (1 - p)).toFixed(1) + '" transform="rotate(-90 18 18)"/></svg>';
}
function starSVG(dk) { return '<svg xmlns="' + NS + '" width="14" height="14" viewBox="-1 -1 16 16"><path d="' + STAR + '" fill="#fde047" stroke="' + (dk ? "#ffffff" : "#a16207") + '" stroke-width="1.2" stroke-linejoin="round" paint-order="stroke"/></svg>'; }
function svg(fam, st, dk, o) {
  o = o || {};
  fam = fam === "climber" ? "mascot" : FAMS.indexOf(fam) < 0 ? "mascot" : fam;
  st = STATES.indexOf(st) < 0 ? "idle" : st;
  var p = typeof o.progress === "number" ? Math.min(1, Math.max(0, o.progress)) : st === "end" ? 1 : { idle: 0.35, moving: 0.5, holding: 0.65 }[st];
  if (fam === "ring") return ringSVG(p, !!dk, o.cell ? o.cell * 24 : 48);
  if (fam === "comet") {
    var w = 48, x = Math.round(p * w);
    return '<svg xmlns="' + NS + '" width="' + (w + 8) + '" height="16" viewBox="-4 -6 ' + (w + 8) + ' 16"><path fill="#c084fc" d="M0 0h' + x + 'v4H0z"/><g transform="translate(' + (x - 7) + ' -5)">' + starSVG(!!dk).replace(/^<svg[^>]*>|<\/svg>$/g, "") + "</g></svg>";
  }
  var mas = own({ cat: 1, bunny: 1, bear: 1, frog: 1 }, o.mascot) ? o.mascot : "cat";
  return pixelSVG(fam, mas, st, !!dk, p, o.cell, !!o.blink);
}

// ---- light or dark: copied from fairy_cursor.js (the same rule as pageIsDark() in sparkle_trail.js)
function rgba(css) {  // any CSS colour -> [r, g, b, a]
  if (!probe) { var cv = document.createElement("canvas"); cv.width = cv.height = 1; probe = cv.getContext("2d", { willReadFrequently: true }); }
  probe.clearRect(0, 0, 1, 1); probe.fillStyle = "rgba(0,0,0,0)"; probe.fillStyle = css; probe.fillRect(0, 0, 1, 1);
  return probe.getImageData(0, 0, 1, 1).data;
}
function isDark() {
  var t = root.getAttribute("data-theme"), els = [document.body, root], d, i;
  if (t === "dark" || t === "light") return t === "dark";
  for (i = 0; i < 2; i++) if (els[i] && (d = rgba(getComputedStyle(els[i]).backgroundColor))[3] >= 128) return d[0] * 0.299 + d[1] * 0.587 + d[2] * 0.114 < 128;
  return matchMedia("(prefers-color-scheme: dark)").matches && /\bdark\b/.test(getComputedStyle(root).colorScheme);
}

// ---- the live element
// Size in px and where it sits, per family: [width, height, css].
var BOX = {
  mascot: [40, 40, "right:8px;top:0"], rocket: [40, 56, "right:8px;top:0"], balloon: [32, 56, "right:12px;top:0"],
  caterpillar: [68, 28, "left:4px;bottom:2px"], sprout: [38, 52, "right:14px;bottom:10px"], moon: [40, 40, "right:16px;bottom:16px"]
};
function build() {
  variant = root.dataset.scroll || "ring";
  if (variant === "climber") variant = "mascot";
  look = own({ cat: 1, bunny: 1, bear: 1, frog: 1 }, root.dataset.scrollMascot) ? root.dataset.scrollMascot : "cat";
  dark = isDark();
  el = document.createElement("div");
  if (variant === "comet") {
    el.style.cssText = "position:fixed;top:0;left:0;height:4px;width:100%;z-index:2147483601;pointer-events:none";
    bar = document.createElement("div");
    bar.style.cssText = "height:100%;width:100%;transform-origin:left;transform:scaleX(0);background:linear-gradient(90deg,#f9a8d4,#c084fc,#a5b4fc)";
    head = document.createElement("span");
    head.style.cssText = "position:absolute;left:-7px;top:-5px;width:14px;height:14px;display:block";
    el.appendChild(bar); el.appendChild(head);
  } else if (own(BOX, variant)) {
    var b = BOX[variant];
    el.style.cssText = "position:fixed;" + b[2] + ";width:" + b[0] + "px;height:" + b[1] + "px;z-index:2147483601;pointer-events:none;transform-origin:" + ({ mascot: "50% 0", balloon: "50% 100%", sprout: "50% 100%", caterpillar: "50% 100%" }[variant] || "50% 50%");
        wrap = document.createElement("div");
    wrap.style.cssText = "width:100%;height:100%;transform-origin:50% 100%";
    el.appendChild(wrap);
    if (variant !== "sprout" && variant !== "moon") {
      track = document.createElement("div");
      track.className = "stp-scroll-track";
      track.setAttribute("aria-hidden", "true");
      track.style.cssText = variant === "caterpillar" ? "position:fixed;left:8px;right:8px;bottom:3px;height:2px;z-index:2147483600;pointer-events:none;opacity:.45"
        : "position:fixed;top:8px;bottom:8px;width:2px;right:" + (parseInt(b[2].slice(6), 10) + b[0] / 2 - 1) + "px;z-index:2147483600;pointer-events:none;opacity:.45";
      document.body.appendChild(track);
    }
  } else {  // ring
    variant = "ring";
    el.style.cssText = "position:fixed;right:16px;bottom:16px;width:48px;height:48px;z-index:2147483601;pointer-events:none";
    el.innerHTML = ringSVG(0, dark, 48);
    ring = el.querySelector(".stp-ring");
    label = document.createElement("span"); label.className = "stp-pct"; label.textContent = "0%";
    label.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 11px system-ui";
    el.appendChild(label);
    if (!reduced()) el.animate([{ transform: "translateY(0)" }, { transform: "translateY(-3px)" }, { transform: "translateY(0)" }], { duration: 2600, iterations: Infinity });
  }
  el.setAttribute("aria-hidden", "true");
  el.setAttribute("data-stp-scroll", variant);
  document.body.appendChild(el);
  paintTheme(true);
}

function paintTheme(force) {  // colours that follow the page; the pixel picture repaints through pose()
  if (!el) return;
  var d = isDark();
  if (d === dark && !force) { if (mo) mo.takeRecords(); return; }
  dark = d;
  if (variant === "ring") {
    var c = RINGC[dark ? 1 : 0];
    el.firstChild.firstChild.setAttribute("stroke", c[0]); ring.setAttribute("stroke", c[1]); label.style.color = c[2];
  } else if (variant === "comet") head.innerHTML = starSVG(dark);
  if (track) track.style.background = "repeating-linear-gradient(" + (variant === "caterpillar" ? "90deg" : "180deg") + "," + (dark ? "#e9d5ff" : "#7c6a9a") + " 0 3px,transparent 3px 8px)";
  pose();
  if (mo) mo.takeRecords();
}
function pose() {  // swap the picture only when what it shows changes
  if (!wrap) return;
  var stage = variant === "sprout" || variant === "moon" ? Math.round(cur.p * 16) : 0;
  var key = variant + look + cur.state + dark + stage + blinking;
  if (key === poseKey) return;
  poseKey = key;
  wrap.innerHTML = pixelSVG(variant, look, cur.state, dark, stage / 16, 2, blinking && cur.state === "idle");
}

// Motion of the element itself, per state. Individual rotate / translate / scale compose with the position transform.
var SWAY = {
  mascot: [{ rotate: "-6deg" }, { rotate: "6deg" }, 260], rocket: [{ translate: "-1px 0" }, { translate: "1px 0" }, 90],
  balloon: [{ rotate: "-7deg" }, { rotate: "7deg" }, 700], caterpillar: [{ scale: "1 1" }, { scale: "1.06 .9" }, 280],
  sprout: [{ rotate: "-5deg" }, { rotate: "5deg" }, 600], moon: [{ rotate: "-10deg" }, { rotate: "10deg" }, 800]
};
function setMotion(st) {
  if (st === motion) return;
  motion = st;
  if (anim) { anim.cancel(); anim = null; }
  if (reduced() || !wrap) return;
  var s = SWAY[variant];
  if (st === "moving") anim = el.animate([s[0], s[1]], { duration: s[2], iterations: Infinity, direction: "alternate", easing: "ease-in-out" });
  if (st === "holding") anim = el.animate([{ translate: "-1px 0" }, { translate: "1px 0" }], { duration: 70, iterations: Infinity, direction: "alternate" });
}
function cheer() {  // one hop or pop, on an inner part with no inline transform of its own
  if (reduced()) return;
  if (variant === "ring") el.firstChild.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 450, easing: "ease-out" });
  else if (variant === "comet") head.animate([{ scale: "1" }, { scale: "1.9" }, { scale: "1" }], { duration: 450, easing: "ease-out" }); // `scale` composes with the head's inline translateX
  else if (variant === "sprout" || variant === "moon") wrap.animate([{ transform: "scale(1)" }, { transform: "scale(1.2) rotate(-6deg)" }, { transform: "scale(.95) rotate(4deg)" }, { transform: "none" }], { duration: 650, easing: "ease-out" });
  else wrap.animate([{ transform: "translateY(0) rotate(0)" }, { transform: "translateY(-10px) rotate(-8deg)" }, { transform: "translateY(0) rotate(6deg)" }, { transform: "translateY(-4px) rotate(-3deg)" }, { transform: "none" }], { duration: 650, easing: "ease-out" });
}

function blinkLater() {
  clearTimeout(blinkT); blinkT = 0;
  if (!el || !wrap || reduced()) return;
  blinkT = setTimeout(function () {
    blinkT = 0;
    if (!el) return;
    if (cur.state !== "idle" || document.hidden) return blinkLater();
    blinking = true; pose();
    blinkT = setTimeout(function () { blinking = false; pose(); blinkLater(); }, 160);
  }, 2600 + Math.random() * 2600);
}

function pct() { var h = root.scrollHeight - innerHeight; return h <= 0 ? 0 : Math.min(1, Math.max(0, scrollY / h)); }
function atEnd() { var h = root.scrollHeight - innerHeight; return h > 0 && scrollY >= h - 8; }
function render() {
  raf = 0;
  if (!el) return;
  var p = pct(), end = atEnd(), b = BOX[variant];
  cur.p = p;
  cur.state = end ? "end" : holding ? "holding" : moving ? "moving" : "idle";
  if (variant === "comet") { bar.style.transform = "scaleX(" + p + ")"; head.style.transform = "translateX(" + (p * root.clientWidth) + "px)"; }
  else if (variant === "ring") { ring.style.strokeDashoffset = String(94.2 * (1 - p)); label.textContent = Math.round(p * 100) + "%"; }
  else {
    if (variant === "mascot") el.style.transform = "translateY(" + Math.round(4 + p * (innerHeight - b[1] - 8)) + "px)";
    else if (variant === "rocket" || variant === "balloon") el.style.transform = "translateY(" + Math.round(4 + (1 - p) * (innerHeight - b[1] - 8)) + "px)";
    else if (variant === "caterpillar") el.style.transform = "translateX(" + Math.round(p * (root.clientWidth - b[0] - 8)) + "px)";
    pose(); setMotion(cur.state);
  }
  el.classList.toggle("is-moving", moving);
  el.classList.toggle("is-holding", holding);
  el.classList.toggle("is-end", end);
  el.setAttribute("data-stp-progress", p.toFixed(3));
  el.setAttribute("data-stp-state", cur.state);
  if (end && !wasEnd) cheer();
  wasEnd = end;
}
function settle() { settleT = 0; moving = holding = false; vel = 0; if (!raf) raf = requestAnimationFrame(render); }
function onScroll(e) {
  if (e && e.type === "scroll" && firstScroll) { firstScroll = false; lastY = scrollY; lastT = performance.now(); }  // a restored position on reload is not a fast scroll
  else if (e && e.type === "scroll") {
    var now = performance.now(), y = scrollY, dy = Math.abs(y - lastY), dt = now - lastT;
    var inst = dy / Math.min(Math.max(dt, 8), 50);  // a jump after a pause counts as one 50 ms frame
    vel = dt > 50 ? inst : vel * 0.5 + inst * 0.5;
    lastY = y; lastT = now;
    if (dy) {
      moving = true;
      holding = vel > FAST ? true : vel < FAST / 2 ? false : holding;
      clearTimeout(settleT); settleT = setTimeout(settle, 200);
    }
  }
  if (!raf) raf = requestAnimationFrame(render);
}
function onEnd(e) { if (e.target === root || e.target === document.body) paintTheme(); }
function onTheme() { paintTheme(); }
function watchBody() { if (mo && document.body) mo.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] }); }

function start() {
  if (el) return;
  if (!document.body) { document.addEventListener("DOMContentLoaded", start, { once: true }); return; } // script in <head>
  poseKey = ""; motion = ""; firstScroll = true; moving = holding = blinking = false; vel = 0; lastY = scrollY; lastT = performance.now();
  build();
  wasEnd = atEnd();  // landing at the bottom is not a "reach": no cheer, but the class is right
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  mo = new MutationObserver(onTheme);
  mo.observe(root, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
  watchBody();
  addEventListener("load", onTheme); root.addEventListener("transitionend", onEnd);
  mq = matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) mq.addEventListener("change", onTheme); else mq.addListener(onTheme);
  if (variant === "balloon" && !reduced()) bob = el.animate([{ translate: "0 0" }, { translate: "0 -3px" }], { duration: 1300, iterations: Infinity, direction: "alternate", easing: "ease-in-out", composite: "add" });
  render();
  if (track && !reduced()) el.style.transition = "transform .08s linear";  // only after the first placement: no slide-in
  blinkLater();
}
function destroy() {
  document.removeEventListener("DOMContentLoaded", start);
  if (!el) return;
  cancelAnimationFrame(raf); raf = 0;
  clearTimeout(settleT); clearTimeout(blinkT); settleT = blinkT = 0;
  removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll);
  if (mo) { mo.disconnect(); mo = null; }
  removeEventListener("load", onTheme); root.removeEventListener("transitionend", onEnd);
  if (mq) { if (mq.removeEventListener) mq.removeEventListener("change", onTheme); else mq.removeListener(onTheme); mq = null; }
  if (anim) anim.cancel(); if (bob) bob.cancel(); anim = bob = null;
  if (track) track.remove();
  el.remove(); el = wrap = track = null;
}

window.SparkleThatPage = window.SparkleThatPage || {};
window.SparkleThatPage.scrollIndicator = {
  start: start, destroy: destroy, svg: svg, families: FAMS.slice(), mascots: MASCOTS.slice(), states: STATES.slice(),
  progress: function () { return el ? cur.p : null; }, state: function () { return el ? cur.state : null; }
};
start();
})();
