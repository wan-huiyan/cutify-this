/* fairy_cursor.js — sparkle-that-page: a fairy-wand cursor, starts on load. Light or dark page: the same rule as
 * pageIsDark() in sparkle_trail.js (data-theme light|dark, else the <body> then <html> background, else the system
 * scheme if the page's color-scheme allows dark). A --stp-wand / --stp-wand-link the page sets itself is left alone.
 * Names, API, gotchas: SKILL.md section 1. Drawing a wand: references/wands.md. */
(function () {
"use strict";
var root = document.documentElement, on = false, style = null, prevCursor = "", mo = null, mq = null, key = "", mine = {}, probe;
var HX = 27, HY = 11, UP = -Math.PI / 2;  // the click point, mid-gem, in every family
var ALIAS = { sailormoon: "magical", heart: "candy" };
function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k) ? o[k] : null; }  // "constructor" is no palette

function mix(a, b, t) {  // hex colour a → b by t
  var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), o = "#";
  for (var s = 16; s >= 0; s -= 8) { var u = (x >> s) & 255; o += ("0" + Math.round(u + (((y >> s) & 255) - u) * t).toString(16)).slice(-2); }
  return o;
}
function lt(c, t) { return mix(c, "#ffffff", t); }
function dk(c, t) { return mix(c, "#000000", t); }
function f1(n) { return +n.toFixed(2); }
function starPath(cx, cy, R, r, n, rot) {
  for (var d = "", i = 0; i < 2 * n; i++) { var a = rot + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + f1(cx + q * Math.cos(a)) + " " + f1(cy + q * Math.sin(a)); }
  return d + "Z";
}
function crescent(ax, ay, R, bx, by, r) {  // disc A minus disc B
  var dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy), a = (R * R - r * r + d * d) / (2 * d), h = Math.sqrt(R * R - a * a);
  var px = ax + a * dx / d, py = ay + a * dy / d, x1 = f1(px + h * dy / d), y1 = f1(py - h * dx / d);
  return "M" + x1 + " " + y1 + "A" + R + " " + R + " 0 1 0 " + f1(px - h * dy / d) + " " + f1(py + h * dx / d) + "A" + r + " " + r + " 0 0 1 " + x1 + " " + y1 + "Z";
}

// The drawing kit: colours (lifted on dark pages), ink outline, gradients with ids unique per wand, shared parts.
function kit(id, dark, cols) {
  var k = { dark: dark, ink: dark ? "#ffffff" : "#2a2140", defs: "", n: 0 }, INK = '" stroke="' + k.ink + '" stroke-opacity=".92"';
  k.c = cols.map(function (c) { return dark ? lt(c, 0.18) : c; });
  k.ol = function (w) { return INK.slice(1) + ' stroke-width="' + w + '" stroke-linejoin="round" paint-order="stroke"'; };
  k.lin = function (st, x1, y1, x2, y2) {  // user-space when coordinates are given
    var g = id + k.n++;
    k.defs += '<linearGradient id="' + g + '"' + (x1 == null ? ' x2="1" y2="1"' : ' gradientUnits="userSpaceOnUse" x1="' + f1(x1) + '" y1="' + f1(y1) + '" x2="' + f1(x2) + '" y2="' + f1(y2) + '"') + ">" +
      st.map(function (s, i) { return '<stop offset="' + f1(i / (st.length - 1)) + '" stop-color="' + s + '"/>'; }).join("") + "</linearGradient>";
    return "url(#" + g + ")";
  };
  k.shine = function (c) { return k.lin([lt(c, 0.7), c, dk(c, 0.18)]); };  // lit from the top-left
  k.p = function (d, fill, w, more) { return '<path d="' + d + '" fill="' + fill + '"' + (w ? k.ol(w) : "") + (more || "") + "/>"; };
  k.o = function (x, y, r, fill, w) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + (w ? k.ol(w) : "") + "/>"; };
  k.s = function (d, c, w, more) { return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"' + (more || "") + "/>"; };
  k.dot = function (x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff" opacity=".9"/>'; };
  k.line = function (d, w, c, o) {  // ink underneath (o wider), colour c on top
    var a = '<path d="' + d + '" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="';
    return a + (w + (o || 1.8)) + INK + "/>" + a + w + '" stroke="' + c + '"/>';
  };
  k.rod = function (d, x0, y0, x1, y1, w, c, hi, o) {  // shaded across its width
    var L = Math.hypot(x1 - x0, y1 - y0), nx = (y1 - y0) / L * w / 2, ny = (x0 - x1) / L * w / 2, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    return k.line(d, w, k.lin([dk(c, 0.2), lt(c, hi || 0.6), c, dk(c, 0.3)], mx - nx, my - ny, mx + nx, my + ny), o);
  };
  k.stick = function (w, ts, cap) {  // straight rod, metal bands at fractions ts, end cap
    var s = "";
    ts.forEach(function (t) { var x = 5 + 16 * t, y = 35.5 - 16 * t, h = (w / 2 + 0.2) * 0.7071; s += "M" + f1(x - h) + " " + f1(y - h) + "L" + f1(x + h) + " " + f1(y + h); });
    return k.rod("M5 35.5L21 19.5", 5, 35.5, 21, 19.5, w, k.c[0]) + (s ? '<path d="' + s + '" stroke="' + k.c[1] + '" stroke-width="1.3"/>' : "") + k.o(4.6, 35.9, 1.8, k.shine(cap), 1.2);
  };
  k.bow = function (c) {
    return '<g transform="rotate(45 20.6 20)">' + k.p("M20.6 20C17.6 17.4 15.6 18 15.8 20S18 22.6 20.6 20ZM20.6 20C23.6 17.4 25.6 18 25.4 20S23.2 22.6 20.6 20ZM20.6 20L18.8 24.8L20 24.2L20.6 25.4M20.6 20L22.4 24.8L21.2 24.2L20.6 25.4", c, 1.1) + k.o(20.6, 20, 1.1, dk(c, 0.15), 0.8) + "</g>";
  };
  return k;
}
function heart(cx, cy, s) {
  var P = function (x, y) { return f1(cx + x * s) + " " + f1(cy + y * s); }, r = f1(2.3 * s);
  return "M" + P(0, 4.4) + "Q" + P(-1.6, 2.4) + " " + P(-4.2, -0.4) + "A" + r + " " + r + " 0 0 1 " + P(0, -2.2) + "A" + r + " " + r + " 0 0 1 " + P(4.2, -0.4) + "Q" + P(1.6, 2.4) + " " + P(0, 4.4) + "Z";
}
function gleam(k, cx, cy, s) {  // white arc on a heart's left lobe
  return k.s("M" + f1(cx - 3.4 * s) + " " + f1(cy - 0.5 * s) + "A" + f1(1.6 * s) + " " + f1(1.6 * s) + " 0 0 1 " + f1(cx - 1.8 * s) + " " + f1(cy - 2.1 * s), "#fff", f1(0.8 * s));
}
function glint(k, x, y, r, fill) {  // four points, concave sides: a twinkle, not a diamond
  var q = r * 0.18, p = function (a, b) { return f1(a) + " " + f1(b); };
  return k.p("M" + p(x, y - r) + "Q" + p(x + q, y - q) + " " + p(x + r, y) + "Q" + p(x + q, y + q) + " " + p(x, y + r) + "Q" + p(x - q, y + q) + " " + p(x - r, y) + "Q" + p(x - q, y - q) + " " + p(x, y - r) + "Z", fill, 0.7);
}

// Each family (briefs: references/wands.md): palettes p, optional glow colour index, draw(k, k.c, on).
var FAM = {
  // cols: rod, metal, star
  star: { p: { gold: ["#b98cff", "#f2b52b", "#ffd23f"], pink: ["#7fd6ff", "#f2b52b", "#ff8cc6"], ice: ["#ff9ccc", "#c6d0e6", "#9fe4ff"] },
    draw: function (k, c) {
      return k.stick(2.6, [], c[1]) + k.p(starPath(27, 11.2, 9.4, 4.3, 5, UP), k.shine(c[2]), 1.5) +
        k.p(starPath(27, 11.6, 3.6, 1.7, 5, UP), lt(c[2], 0.6), 0, ' opacity=".8"') + k.dot(24.2, 8.2, 1.1);
    } },
  // cols: rod, metal (crescent, bands), gem
  magical: { p: { lilac: ["#c3a6ff", "#c0b5e8", "#8a4dff"], mint: ["#6ed8bf", "#f2b52b", "#ff5f8f"], sky: ["#8fc8ff", "#d4dcf0", "#ff6fae"] },
    draw: function (k, c) {
      return k.stick(3, [0.16, 0.26, 0.93], c[1]) + k.p(crescent(27, 11, 7.6, 27, 8.2, 8), k.lin([lt(c[1], 0.65), c[1], dk(c[1], 0.12)], 27, 11, 27, 19), 1.2) +
        k.p(heart(27, 11.2, 1), k.shine(c[2]), 1.2) + gleam(k, 27, 11.2, 1);
    } },
  // cols: wood, leaf, orb, swirl
  wizard: { p: { arcane: ["#9a5a26", "#5fbf5a", "#4a8dff", "#c7e6ff"], ember: ["#9a5a26", "#5fbf5a", "#ff7a2b", "#ffe2a8"], forest: ["#8a6326", "#9ad35a", "#2fbf6e", "#d4ffd9"] },
    draw: function (k, c) {
      var w = k.dark ? dk(c[0], 0.22) : c[0];  // dark wood, thin outline: not grey on dark pages
      return k.rod("M5 37.4C7.8 35.4 8 33.6 10.6 31.8S13.2 28.6 14.8 27.4S18.4 21.4 21.3 16.7", 5, 37.4, 21.3, 16.7, 3.8, w, 0.35, k.dark && 1.1) + k.line("M10.4 32.4C9 31.6 8.4 30.2 8.6 29", 1.3, w, k.dark && 1.1) +
        '<g transform="rotate(45 27 11)">' + k.o(27, 11, 5.8, k.lin([lt(c[3], 0.3), c[2], dk(c[2], 0.35)], 23.5, 7.5, 30.5, 15), 1.4) +
        k.s("M24.4 12.6C25.6 14.6 29 14.4 29.8 12C28.6 13 26.6 13 26.4 11.4", c[3], .9) +
        k.line("M27 18.6C23.2 18.2 20.4 15.2 20.4 11C20.4 6.6 23.8 3.6 28 4C30.4 4.2 31.6 5.6 31.4 7C31.2 8.2 30 8.6 29.2 8", 1.7, lt(w, 0.12), k.dark && 1.1) +
        k.p("M22 17C19.4 17.6 17.4 16.2 17 14.2C19.2 13.8 21.2 15 22 17Z", c[1], 1.1) + "</g>" + k.dot(25, 8.7, 1.4);
    } },
  // cols: wood, leaf, petal, centre
  garden: { p: { rose: ["#a8754a", "#4fae5a", "#ff8fb8", "#ffcf3a"], daisy: ["#a8754a", "#4fae5a", "#ffffff", "#ffc21a"], lavender: ["#a8754a", "#4fae5a", "#b99cff", "#fff1a6"] },
    glow: 3,
    draw: function (k, c) {
      var pet = "", i, a, x, y;
      for (i = 0; i < 5; i++) {
        a = UP + i * 2 * Math.PI / 5; x = f1(27 + 4.3 * Math.cos(a)); y = f1(11 + 4.3 * Math.sin(a));
        pet += '<ellipse cx="' + x + '" cy="' + y + '" rx="2.9" ry="3.9" transform="rotate(' + f1(a * 180 / Math.PI + 90) + " " + x + " " + y + ')" fill="' + k.lin([lt(c[2], 0.5), c[2], c[2]]) + '"' + k.ol(1.2) + "/>";
      }
      return k.stick(3, [0.2, 0.42, 0.64], c[1]) + k.p("M6.6 33.6C3.4 33.4 1.6 31 1.8 28.6C4.4 28.8 6.6 30.8 6.6 33.6Z", c[1], 1.1) +
        k.p("M21.6 18.8C19.4 15.6 15.8 15.2 13.8 16.2C15.6 18.8 18.6 19.6 21.6 18.8ZM21.6 18.8C24.6 21 25.4 24.4 24.8 26.4C22.2 25 20.8 22 21.6 18.8Z", c[1], 1.1) +
        pet + k.o(27, 11, 2.6, k.shine(c[3]), 1) + k.dot(26.2, 10.2, 0.8);
    } },
  // cols: rod, silver, star, ring
  cosmic: { p: { violet: ["#a9a3d6", "#d9dcef", "#ffe98a", "#8a6bff"], aurora: ["#9cc9d6", "#d9dcef", "#d9fff0", "#2fd3a0"], nova: ["#d6a3c3", "#d9dcef", "#fff0b0", "#ff6f91"] },
    glow: 3,
    draw: function (k, c) {
      var ring = function (f) { return '<g transform="rotate(-28 27 11)">' + k.line("M16.6 11A10.4 3.2 0 0 " + f + " 37.4 11", 1.1, c[3], 1) + "</g>"; };
      return k.stick(2.6, [0.15, 0.25, 0.9], c[3]) + ring(1) + k.p(starPath(27, 11, 4.8, 2.1, 4, UP + Math.PI / 4), lt(c[2], 0.3), 1.1) +
        k.p(starPath(27, 11, 10, 2.4, 4, UP), k.shine(c[2]), 1.4) + ring(0) + k.dot(27, 11, 1.4);
    } },
  // cols: cane, bow, heart, stripe
  candy: { p: { strawberry: ["#fff6fa", "#ff6fae", "#ff3d7f", "#ff4f8f"], mint: ["#f4fffb", "#3fcf9f", "#ff6f9f", "#33c49a"], grape: ["#fbf6ff", "#9b6bff", "#b25bff", "#8f5bff"] },
    draw: function (k, c) {
      return k.line("M5 35.5L21 19.5", 3.4, c[0]) + k.p("M5 35.5L21 19.5", "none", 0, ' stroke="' + c[3] + '" stroke-width="3.4" stroke-dasharray="1.6 1.9"') +
        k.p(heart(27, 10.8, 1.4), k.shine(c[2]), 1.5) + gleam(k, 27, 10.8, 1.4) + k.dot(24.4, 11.4, 0.6) + k.bow(c[1]);
    } },
  // cols: rod, metal, crystal
  crystal: { p: { amethyst: ["#c8c2dd", "#d8b04a", "#a46bff"], aqua: ["#c8d6dd", "#c9d0e2", "#3fd2e6"], rose: ["#e6c8d6", "#d8b04a", "#ff86b6"] },
    draw: function (k, c) {
      var g = c[2];
      return k.stick(2.6, [0.15, 0.25], c[1]) + '<g transform="rotate(45 27 11)">' + k.p("M27 2.4L31 6.8L31 15.4L27 18.4L23 15.4L23 6.8Z", g, 1.5) +
        k.p("M27 2.4L23 6.8L23 15.4L27 12Z", lt(g, 0.55)) + k.p("M27 2.4L31 6.8L27 12Z", lt(g, 0.25)) + k.p("M31 15.4L27 18.4L23 15.4L27 12Z", dk(g, 0.22)) +
        k.s("M27 2.4L27 12L23 15.4M27 12L31 15.4M23 6.8L27 12L31 6.8", k.ink, 0.5, ' stroke-opacity=".35"') +
        k.p("M22.4 16.2L31.6 16.2L30.6 19.6L23.4 19.6Z", k.shine(c[1]), 1.1) + k.s("M24.4 6.8L24.4 12", "#fff", 1) + "</g>";
    } },
  // cols: rod, metal, moon, star
  moon: { p: { gold: ["#9aa6ff", "#f2b52b", "#ffd84a", "#fff6c8"], silver: ["#c49cff", "#c9d0e2", "#dfe6f5", "#fff1a8"], rose: ["#8fd8ff", "#f2b52b", "#ffb3cf", "#fff6c8"] },
    glow: 3, bite: [30.2, 7.8, 8],  // glow masked out of the bite, or the moon reads as a ball
    draw: function (k, c) {
      return k.stick(2.6, [0.15, 0.25, 0.92], c[1]) + k.p(crescent(25.4, 12.6, 9.6, 30.2, 7.8, 8), k.shine(c[2]), 1.5) +
        k.s("M18.6 13.4Q19.6 14.6 20.8 13.6", k.ink, .8) + '<circle cx="21.6" cy="16.6" r="1" fill="#ff7fa8" opacity=".75"/>' +
        k.p(starPath(27.4, 10.6, 3.8, 1.7, 5, UP), c[3], 1.1);
    } },
  // cols: rod, metal, shell, pearl
  ocean: { p: { pearl: ["#7fd0e6", "#f2c9a0", "#ffc4d6", "#fffaf2"], lagoon: ["#f2c9a0", "#ffffff", "#5fd6d0", "#fff6fb"], coral: ["#7fb6ff", "#ffe2b8", "#ff8f73", "#fff8ec"] },
    draw: function (k, c) {
      var edge = "", rib = "", i, a, x, y;
      for (i = 0; i <= 7; i++) {
        a = Math.PI + i * Math.PI / 7; x = f1(27 + 9.4 * Math.cos(a)); y = f1(15 + 9.4 * Math.sin(a));
        edge += (i ? "A1.9 1.9 0 0 1 " : "M") + x + " " + y; if (i && i < 7) rib += "M27 16.4L" + x + " " + y;
      }
      return k.stick(2.6, [0.15, 0.25], c[2]) + '<g transform="rotate(45 27 15)">' + k.p(edge + "L29.4 18.6L24.6 18.6Z", k.lin([lt(c[2], 0.6), c[2], dk(c[2], 0.12)], 27, 5, 27, 18), 1.4) +
        k.s(rib, dk(c[2], 0.3), 0.7, ' opacity=".7"') + "</g>" + k.o(27, 11, 3.3, k.lin([c[3], c[3], dk(c[3], 0.2)]), 1.2) + k.dot(26, 10, 1.1);
    } },
  // cols: stick, bow, swirl, disc
  lollipop: { p: { berry: ["#ffffff", "#7fd6ff", "#ff4f9a", "#fff2f8"], lemon: ["#ffffff", "#ff8fb8", "#ffb000", "#fffbe6"], sky: ["#ffffff", "#ffc94a", "#4a9dff", "#f0f8ff"] },
    draw: function (k, c) {
      var sp = "", t, a, r;
      for (t = 0; t <= 1.001; t += 0.04) { a = t * 3.6 * Math.PI; r = 0.8 + 5.8 * t; sp += (t ? "L" : "M") + f1(27 + r * Math.cos(a)) + " " + f1(11 + r * Math.sin(a)); }
      return k.line("M5 35.5L21 19.5", 2.4, c[0]) + k.o(27, 11, 8.2, c[3], 1.5) + k.s(sp, c[2], 1.8) +
        k.s("M21.6 7.4A6.6 6.6 0 0 1 25.4 4.6", "#fff", 1.3, ' opacity=".9"') + k.bow(c[1]);
    } },
  // 2-px cells, outline and bevel worked out from the filled cells, one <path> per colour. cols: rod, -, star
  pixel: { px: true, p: { gold: ["#a46bff", "", "#ffd23f"], rose: ["#5fd3b5", "", "#ff6fae"], mint: ["#ff7fb8", "", "#52e0c4"] },
    draw: function (k, c, lit) {
      var G = [], C = [], P = {}, out = "", x, y, i, star = ["....#....", "....#....", "...###...", "#########", ".#######.", "..#####..", "..##.##..", ".##...##.", ".#.....#."];
      var at = function (x, y) { return x < 0 || x > 19 ? "" : G[y * 20 + x] || ""; }, fill = function (x, y) { return /[sr]/.test(at(x, y)); };
      var ring = function (ch, by, far) {  // empty cells next to one that passes by(), near the star
        for (y = 0; y < 20; y++) for (x = 0; x < 20; x++) if (!at(x, y) && (x - 13) * (x - 13) + (y - 5) * (y - 5) < far && (by(x - 1, y) || by(x + 1, y) || by(x, y - 1) || by(x, y + 1))) G[y * 20 + x] = ch;
      };
      var cell = function (x, y, c, o) { if (x >= 0 && x < 20 && y >= 0) C[y * 20 + x] = c + (o ? '" opacity="' + o : ""); };
      for (y = 0; y < 9; y++) { for (x = 0; x < 9; x++) if (star[y][x] === "#") G[y * 20 + 29 + x] = "s"; G[(18 - y) * 20 + 2 + y] = G[(18 - y) * 20 + 3 + y] = "r"; }
      ring("o", fill, 999);
      if (lit) ring("h", function (x, y) { return at(x, y) === "o"; }, 50);  // the twin's halo: one ring of cells
      for (y = 0; y < 20; y++) for (x = 0; x < 20; x++) {
        var ch = at(x, y), b = ch === "o" ? k.ink : ch === "s" ? k.c[2] : k.c[0];
        if (ch === "h") cell(x, y, k.dark ? lt(k.c[2], 0.55) : k.c[2], k.dark ? 0.5 : 0.45);
        else if (ch) cell(x, y, ch === "o" ? b : !fill(x - 1, y) || !fill(x, y - 1) ? lt(b, 0.45) : !fill(x + 1, y) || !fill(x, y + 1) ? dk(b, 0.2) : b);
      }
      [[18, 1], [6, 3]].concat(lit ? [[18, 11], [6, 9], [11, 0]] : []).forEach(function (p) {
        [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d, j) { cell(p[0] + d[0], p[1] + d[1], k.dark ? "#ffffff" : "#ffc21a", j && 0.7); });
      });
      for (y = 0; y < 20; y++) for (x = 0; x < 20; x = i) {  // run-length rows
        c = C[y * 20 + x]; for (i = x + 1; i < 20 && C[y * 20 + i] === c; i++);
        if (c) P[c] = (P[c] || "") + "M" + 2 * x + " " + 2 * y + "h" + 2 * (i - x) + "v2H" + 2 * x + "z";
      }
      for (c in P) out += '<path d="' + P[c] + '" fill="' + c + '"/>';
      return '<g shape-rendering="crispEdges">' + out + "</g>";
    } }
};

var GLINTS = [[35.4, 2.8, 1.6, 1], [18.4, 5.2, 1.1, 0]], MORE = [[38.4, 16.8, 1.5, 1], [14.2, 13.4, 1.1, 0], [24.4, 1.6, 1, 0]];
function wandSVG(family, palette, dark, on) {
  family = own(ALIAS, family) || family; if (!own(FAM, family)) family = "star";
  var F = FAM[family]; if (!own(F.p, palette)) palette = Object.keys(F.p)[0];
  var id = "stp-" + family + "-" + palette + "-" + (dark ? "d" : "l") + (on ? 1 : 0) + "-", b = F.bite;
  var k = kit(id, !!dark, F.p[palette]), art = F.draw(k, k.c, !!on), glow = lt(k.c[F.glow || 2], 0.35), halo = "", sp = "";
  if (!F.px) {
    if (on) {  // radialGradient in the twin only
      k.defs += '<radialGradient id="' + id + 'h"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="' + glow + '" stop-opacity=".8"/><stop offset="1" stop-color="' + glow + '" stop-opacity="0"/></radialGradient>';
      halo = k.o(HX, HY, 13, "url(#" + id + "h)");
    } else halo = k.o(HX, HY, 7, glow).replace("/>", ' opacity=".18"/>') + k.o(HX, HY, 4.6, glow).replace("/>", ' opacity=".22"/>');  // a faint aura
    if (b) { k.defs += '<mask id="' + id + 'm"><rect width="40" height="40" fill="#fff"/>' + k.o(b[0], b[1], b[2], "#000") + "</mask>"; halo = '<g mask="url(#' + id + 'm)">' + halo + "</g>"; }
    // gold and white glints; on light pages all gold (a tiny white one reads as a grey smudge)
    (on ? GLINTS.concat(MORE) : GLINTS).forEach(function (g) { sp += glint(k, g[0], g[1], g[2] * (on ? 1.15 : 1), on ? (g[3] || !dark ? "#fff3a8" : "#fff") : g[3] || !dark ? "#ffcf3a" : "#fff"); });
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">' + (k.defs ? "<defs>" + k.defs + "</defs>" : "") + halo + art + sp + "</svg>";
}

function rgba(css) {  // any CSS colour -> [r, g, b, a]
  if (!probe) { var cv = document.createElement("canvas"); cv.width = cv.height = 1; probe = cv.getContext("2d", { willReadFrequently: true }); }
  probe.clearRect(0, 0, 1, 1); probe.fillStyle = "rgba(0,0,0,0)"; probe.fillStyle = css; probe.fillRect(0, 0, 1, 1);
  return probe.getImageData(0, 0, 1, 1).data;
}
function isDark() {  // the same rule as pageIsDark() in sparkle_trail.js
  var t = root.getAttribute("data-theme"), els = [document.body, root], d, i;
  if (t === "dark" || t === "light") return t === "dark";
  for (i = 0; i < 2; i++) if (els[i] && (d = rgba(getComputedStyle(els[i]).backgroundColor))[3] >= 128) return d[0] * 0.299 + d[1] * 0.587 + d[2] * 0.114 < 128;
  return matchMedia("(prefers-color-scheme: dark)").matches && /\bdark\b/.test(getComputedStyle(root).colorScheme);
}
function cursor(svg, fallback) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") ' + HX + " " + HY + ", " + fallback; }
function put(prop, v) {  // unless the page owns it: it had a value first, or no longer holds ours
  var m = mine[prop], cur = root.style.getPropertyValue(prop);
  if (m === false || (m ? cur !== m : getComputedStyle(root).getPropertyValue(prop))) { mine[prop] = false; return; }
  root.style.setProperty(prop, v); mine[prop] = root.style.getPropertyValue(prop);
}
function paint() {
  if (!on) return;
  var f = root.dataset.wand || "star", p = root.dataset.wandPalette, d = isDark(), n = f + "|" + p + "|" + d;
  if (n !== key) {
    key = n;
    put("--stp-wand", cursor(wandSVG(f, p, d, false), "auto"));
    put("--stp-wand-link", cursor(wandSVG(f, p, d, true), "pointer"));
  }
  if (mo) mo.takeRecords();
}
function onEnd(e) { if (e.target === root || e.target === document.body) paint(); }  // a background transition
function watchBody() { if (mo && document.body) { mo.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] }); paint(); } }

var CSS = 'html.stp-wand :is(a[href],button,[role="button"],label,summary,select,input[type="checkbox"],input[type="radio"],input[type="submit"],input[type="button"],[data-celebrate],[data-stamp]):not(:disabled){cursor:var(--stp-wand-link,pointer)}';

function start() {
  if (on || !matchMedia("(pointer: fine)").matches || matchMedia("(forced-colors: active)").matches) return;
  on = true; key = ""; mine = {};
  prevCursor = root.style.cursor;
  paint();
  root.style.cursor = "var(--stp-wand, auto)";  // CSSOM: allowed under a strict CSP
  style = document.createElement("style"); style.textContent = CSS; (document.head || root).appendChild(style);
  root.classList.add("stp-wand");
  mo = new MutationObserver(paint);
  mo.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-wand", "data-wand-palette", "class", "style"] });
  if (document.body) watchBody(); else document.addEventListener("DOMContentLoaded", watchBody);
  addEventListener("load", paint); root.addEventListener("transitionend", onEnd);
  mq = matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) mq.addEventListener("change", paint); else mq.addListener(paint);
}
function destroy() {
  if (!on) return;
  on = false;
  mo.disconnect(); mo = null;
  document.removeEventListener("DOMContentLoaded", watchBody); removeEventListener("load", paint); root.removeEventListener("transitionend", onEnd);
  if (mq.removeEventListener) mq.removeEventListener("change", paint); else mq.removeListener(paint);
  mq = null;
  root.classList.remove("stp-wand");
  for (var p in mine) if (mine[p] && root.style.getPropertyValue(p) === mine[p]) root.style.removeProperty(p);
  root.style.cursor = prevCursor;
  if (style) { style.remove(); style = null; }
}

var PAL = {};
Object.keys(FAM).forEach(function (f) { PAL[f] = Object.keys(FAM[f].p); });
window.SparkleThatPage = window.SparkleThatPage || {};
window.SparkleThatPage.fairyCursor = {
  start: start, destroy: destroy, svg: wandSVG, families: Object.keys(FAM), palettes: PAL,
  hotspot: function () { return [HX, HY]; }  // the same for every family
};
start();
})();
