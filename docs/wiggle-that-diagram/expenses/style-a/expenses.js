// Style A scene for the expenses demo: the same world as style C (1600 x 900 units), drawn text-free on the canvas.
// Every word is an HTML label (WAY.make labels), anchored to a world point; an inline font-size on a label's html scales it
// (labels keep one size while the camera zooms, so big text inside big cards needs it). Beat timing comes from window.EX_BEATS,
// written from beats.json by scripts/style-a/beats_js.py --var EX_BEATS. Loaded after ways/way_make.js; registers SCENES['expenses'].
(() => {
const { clamp, lerp } = U, E = MO.sineInOut;
const B = window.EX_BEATS;
const P = { bg: '#121826', grid: '#1a2233', card: '#1a2233', edge: '#2a3346', ink: '#f3f1ea', muted: '#a8b0c0', phone: '#1f2a3f',
  rim: '#3a4560', screen: '#0d1220', gold: '#e9b949', teal: '#5cc8d6', green: '#5fd08a', amber: '#f0b24a', red: '#f07a6e', row: '#e3e6ea' };
const END = [6, B[5].dur - 0.05];
const ROWS = [300, 450, 600];
const T = WAY.make({
  poster: [6, B[5].still],
  beats: B.map(b => ({ title: b.title, dur: b.dur, cap: b.caption, still: b.still })),
  camBase: { x: 455, y: 445, z: 1.24 },
  cam: [
    { beat: 2, t: 0, kind: 'to', x: 700, y: 405, z: 1.125, dur: 1.8 },
    { beat: 3, t: 0, kind: 'to', x: 830, y: 505, z: 1.45, dur: 1.8 },
    { beat: 4, t: 0, kind: 'to', x: 1200, y: 380, z: 1.6, dur: 1.8 },
    { beat: 5, t: 0, kind: 'to', x: 1300, y: 610, z: 1.65, dur: 1.8 },
    { beat: 6, t: 0, kind: 'to', x: 815, y: 450, z: 0.79, dur: 2.0 }],
  labels: [
    ...[['Hotel', '$180'], ['Dinner', '$95'], ['Taxi', '$40']].flatMap(([n, a], i) => [
      { id: 'n' + i, html: '<span style="font-size:1.3em">' + n + '</span>', wx: 530, wy: ROWS[i] + 55, a: 'w', beat: 1, t: 2.5, to: END },
      { id: 'a' + i, html: '<b style="font-size:1.3em">' + a + '</b>', wx: 810, wy: ROWS[i] + 55, a: 'e', beat: 1, t: 2.5, to: END }]),
    { id: 'pol', html: '<b style="font-size:1.3em">Expense policy</b>', wx: 700, wy: 126, a: 'c', cls: 'gold', beat: 2, t: 2.5, to: END },
    { id: 'r1', html: '<b>Under the limit</b>', short: '<b>OK</b>', wx: 906, wy: 355, a: 'w', cls: 'key green', beat: 3, t: 2.5, to: END },
    { id: 'r2', html: '<b>Over the $60 meal limit</b>', short: '<b>Over limit</b>', wx: 906, wy: 505, a: 'w', cls: 'key amber', beat: 3, t: 5.0, to: END },
    { id: 'r3', html: '<b>No photo</b>', short: '<b>No photo</b>', wx: 906, wy: 655, a: 'w', cls: 'key red', beat: 3, t: 7.5, to: END },
    { id: 'ok', html: 'Approved', short: 'Approved', wx: 1347, wy: 326, a: 'c', cls: 'key onbtn small', beat: 4, t: 2.5, to: END },
    { id: 'note', html: 'Client dinner, 2 people', wx: 1272, wy: 370, a: 'w', cls: 'muted small', beat: 4, t: 2.5, to: END },
    { id: 'tot', html: '<b style="font-size:1.5em">Total $275</b>', short: '<b>$275</b>', wx: 1400, wy: 702, a: 'c', cls: 'key onbtn', beat: 5, t: 2.5, to: END },
    { id: 'paid', html: '<b>Paid</b>', short: '<b>Paid</b>', wx: 180, wy: 630, a: 'c', cls: 'key green', beat: 6, t: 2.5, to: END }],
});
const at = T.at, f = (t, a, d = 0.5) => clamp((t - a) / d);
const mv = (t, a, d, p0, p1) => { const e = E(clamp((t - a) / d)); return [lerp(p0[0], p1[0], e), lerp(p0[1], p1[1], e)]; };

const rr = (c, x, y, w, h, r, fill, stroke, lw = 3) => { c.beginPath(); c.roundRect(x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } };
const dot = (c, x, y, r, fill) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = fill; c.fill(); };
const ring = (c, x, y, r, col, lw = 4) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); };
const line = (c, pts, col, lw, dash) => { c.save(); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; if (dash) c.setLineDash(dash); c.stroke(); c.restore(); };
const alpha = (c, a, fn) => { if (a <= 0) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); };
// a cubic curve, drawn up to fraction q, with an arrowhead once complete enough
const bez = (p0, p1, p2, p3, n = 32) => Array.from({ length: n + 1 }, (_, i) => { const s = i / n, m = 1 - s;
  return [m * m * m * p0[0] + 3 * m * m * s * p1[0] + 3 * m * s * s * p2[0] + s * s * s * p3[0], m * m * m * p0[1] + 3 * m * m * s * p1[1] + 3 * m * s * s * p2[1] + s * s * s * p3[1]]; });
const drawPath = (c, pts, q, col, lw, dash) => { if (q <= 0) return; const k = Math.max(2, Math.round(pts.length * q)); const part = pts.slice(0, k); line(c, part, col, lw, dash);
  if (q > 0.97) { const a = part[part.length - 2], b = part[part.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    c.save(); c.translate(b[0], b[1]); c.rotate(ang); c.beginPath(); c.moveTo(4, 0); c.lineTo(-12, -8); c.lineTo(-12, 8); c.closePath(); c.fillStyle = col; c.fill(); c.restore(); } };
const BACK3 = bez([420, 690], [330, 760], [300, 720], [290, 690]);
const TOMGR = bez([1222, 505], [1290, 505], [1290, 430], [1320, 398]);
const TOREP = bez([1210, 380], [1230, 420], [1240, 440], [1250, 470]);

const receipt = (c, x, y) => { rr(c, x - 24, y - 31, 48, 62, 5, P.ink); for (const d of [-13, -1, 11]) line(c, [[x - 14, y + d], [x + 14 - (d > 0 ? 6 : 0), y + d]], P.bg, 4); };
const icons = [
  (c, x, y) => { rr(c, x - 26, y - 6, 52, 22, 4, null, P.teal, 4); rr(c, x - 26, y - 20, 20, 14, 4, P.teal); line(c, [[x - 26, y + 16], [x - 26, y + 24]], P.teal, 4); line(c, [[x + 26, y + 16], [x + 26, y + 24]], P.teal, 4); },
  (c, x, y) => { line(c, [[x - 12, y - 24], [x - 12, y - 4], [x - 6, y + 2], [x, y - 4], [x, y - 24]], P.teal, 4); line(c, [[x - 6, y - 24], [x - 6, y + 24]], P.teal, 4); line(c, [[x + 14, y - 24], [x + 8, y - 10], [x + 14, y + 2], [x + 14, y + 24]], P.teal, 4); },
  (c, x, y) => { line(c, [[x - 28, y + 8], [x - 28, y - 2], [x - 18, y - 18], [x + 18, y - 18], [x + 28, y - 2], [x + 28, y + 8], [x - 28, y + 8]], P.teal, 4); dot(c, x - 14, y + 12, 7, P.teal); dot(c, x + 14, y + 12, 7, P.teal); }];

function world(c, t) {
  c.fillStyle = P.bg; c.fillRect(-2000, -2000, 6000, 5000);
  for (const y of [100, 300, 500, 700]) line(c, [[-400, y], [2000, y]], P.grid, 2);
  for (const x of [200, 600, 1000, 1400]) line(c, [[x, -200], [x, 1100]], P.grid, 2);
  // phone
  rr(c, 70, 180, 220, 520, 32, P.phone, P.rim); rr(c, 84, 216, 192, 448, 14, P.screen); rr(c, 152, 196, 56, 8, 4, P.rim);
  alpha(c, 1 - 0.75 * f(t, at(6, 2.2), 0.4), () => { ring(c, 180, 330, 46, P.muted, 5); dot(c, 180, 330, 18, P.muted); rr(c, 146, 272, 30, 14, 4, P.muted); });
  for (let i = 0; i < 3; i++) receipt(c, 128 + i * 52, 461);
  for (const s of [0.5, 0.9, 1.3]) { const k = clamp(1 - Math.abs(t - at(1, s) - 0.08) / 0.08); alpha(c, 0.85 * k, () => rr(c, 84, 216, 192, 448, 14, P.ink)); }
  alpha(c, f(t, at(6, 2.3), 0.3), () => { const s = 0.5 + 0.5 * E(f(t, at(6, 2.3), 0.45)); c.save(); c.translate(180, 560); c.scale(s, s); dot(c, 0, 0, 44, P.green); line(c, [[-20, 0], [-6, 14], [20, -16]], P.bg, 8); c.restore(); });
  // policy and its three checks
  alpha(c, f(t, at(2, 0.3), 0.6), () => {
    rr(c, 420, 96, 560, 130, 18, P.card, P.gold);
    ring(c, 560, 176, 28, P.gold); line(c, [[560, 186], [570, 166]], P.gold, 4);
    line(c, [[676, 162], [708, 162], [724, 176], [708, 190], [676, 190], [676, 162]], P.gold, 4); dot(c, 688, 176, 4, P.gold);
    rr(c, 814, 160, 52, 36, 6, null, P.gold, 4); ring(c, 840, 178, 10, P.gold); rr(c, 830, 152, 20, 8, 2, P.gold);
  });
  [560, 700, 840].forEach((x, i) => { const q = f(t, at(2, 3.2 + i * 0.3), 0.7); if (q > 0) line(c, [[x, 206], [x, 206 + 94 * E(q)]], P.gold, 3); });
  // receipt cards, filled by the receipts flying from the phone
  ROWS.forEach((y, i) => alpha(c, f(t, at(1, 2.5 + i * 0.2), 0.4), () => { rr(c, 420, y, 420, 110, 16, P.card, P.edge); icons[i](c, 476, y + 55); }));
  ROWS.forEach((y, i) => { const a = at(1, 1.6 + i * 0.2); alpha(c, f(t, a, 0.15) * (1 - f(t, at(1, 2.7 + i * 0.2), 0.3)), () => { const p = mv(t, a, 1.0, [128 + i * 52, 461], [476, y + 55]); rr(c, p[0] - 24, p[1] - 31, 48, 62, 5, P.ink); }); });
  // a colour for each receipt; the red one goes back to Ana
  [[P.green, 1.4], [P.amber, 4.0], [P.red, 6.5]].forEach(([col, s], i) => { const q = f(t, at(3, s), 0.4); if (q > 0) dot(c, 876, ROWS[i] + 55, 16 * (0.4 + 0.6 * MO.backOut(q)), col); });
  drawPath(c, BACK3, f(t, at(3, 8.3), 0.9), P.red, 3, [8, 8]);
  // the manager
  drawPath(c, TOMGR, f(t, at(4, 0.4), 1.0), P.amber, 4);
  alpha(c, f(t, at(4, 1.0), 0.5), () => {
    rr(c, 1250, 200, 300, 190, 18, P.card, P.edge); dot(c, 1310, 260, 30, P.teal); dot(c, 1310, 250, 12, P.bg);
    c.beginPath(); c.ellipse(1310, 280, 20, 16, 0, Math.PI, 0); c.fillStyle = P.bg; c.fill();
    line(c, [[1360, 248], [1510, 248]], P.edge, 10); line(c, [[1360, 272], [1470, 272]], P.edge, 10);
  });
  alpha(c, f(t, at(4, 2.5), 0.4), () => rr(c, 1272, 306, 150, 40, 20, P.green));
  // the report
  drawPath(c, TOREP, f(t, at(5, 0.3), 0.8), P.green, 4);
  alpha(c, f(t, at(5, 0.3), 0.5), () => {
    rr(c, 1250, 450, 300, 320, 18, P.ink); rr(c, 1250, 450, 300, 56, { upperLeft: 18, upperRight: 18, lowerLeft: 0, lowerRight: 0 }, P.gold);
    line(c, [[1278, 478], [1398, 478]], P.bg, 10);
  });
  [[530, 1.0, 110, 50], [586, 1.5, 90, 40]].forEach(([y, s, w1, w2]) => alpha(c, f(t, at(5, s), 0.5), () => { const dx = -40 * (1 - E(f(t, at(5, s), 0.5)));
    rr(c, 1278 + dx, y, 244, 44, 8, P.row); dot(c, 1302 + dx, y + 22, 9, '#3f9d61'); line(c, [[1322 + dx, y + 22], [1322 + w1 + dx, y + 22]], P.bg, 12); line(c, [[1522 - 20 - w2 + dx, y + 22], [1502 + dx, y + 22]], P.bg, 12); }));
  alpha(c, f(t, at(5, 2.5), 0.4), () => line(c, [[1278, 660], [1522, 660]], P.bg, 3));
  // the money goes back to the phone
  alpha(c, f(t, at(6, 0.6), 0.3) * (1 - f(t, at(6, 2.3), 0.25)), () => { const p = mv(t, at(6, 0.8), 1.5, [1400, 740], [180, 560]); dot(c, p[0], p[1], 30, P.gold);
    line(c, [[p[0], p[1] - 16], [p[0], p[1] + 16]], P.bg, 4); });
}
SCENES['expenses'] = { draw(c, lt, t) { c.save(); CAM.apply(c, T.camAt(t)); world(c, t); c.restore(); } };
})();
