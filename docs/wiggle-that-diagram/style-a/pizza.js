// Style A scene for the pizza demo: the same world as style C (1600 x 900 units), drawn text-free on the canvas.
// Every word is an HTML label (WAY.make labels), anchored to a world point. Beat timing comes from window.PZ_BEATS,
// written from beats.json by scripts/style-a/beats_js.py --var PZ_BEATS. Loaded after ways/way_make.js; registers SCENES['pizza'].
(() => {
const { clamp, lerp } = U, E = MO.sineInOut;
const B = window.PZ_BEATS;
const P = { bg: '#121826', ground: '#1a2233', road: '#222c40', ink: '#f3f1ea', line: '#2a3346', card: '#1f2a3f', screen: '#0d1220',
  gold: '#e9b949', teal: '#5cc8d6', green: '#5fd08a', red: '#f07a6e', amber: '#f0b24a', crust: '#e7b56a', map: '#16302b' };
const END = [5, B[4].dur - 0.05];
const T = WAY.make({
  poster: [5, B[4].still],
  beats: B.map(b => ({ title: b.title, dur: b.dur, cap: b.caption, still: b.still })),
  camBase: { x: 260, y: 450, z: 1.29 },
  cam: [
    { beat: 2, t: 0, kind: 'to', x: 860, y: 445, z: 1.35, dur: 1.8 },
    { beat: 3, t: 0, kind: 'to', x: 1060, y: 480, z: 1.3, dur: 1.8 },
    { beat: 4, t: 0, kind: 'to', x: 850, y: 460, z: 0.865, dur: 1.8 },
    { beat: 5, t: 0, kind: 'to', x: 1430, y: 530, z: 1.56, dur: 2.0 },
    { beat: 5, t: 5.6, kind: 'to', x: 840, y: 450, z: 0.83, dur: 2.0 }],
  labels: [
    { id: 'app', html: 'Pizza app', wx: 260, wy: 290, a: 'c', beat: 1, t: 0, to: END },
    { id: 'mar', html: 'Margherita', wx: 260, wy: 478, a: 'c', beat: 1, t: 0, to: [4, 0.6] },
    { id: 'ord', html: 'Order', wx: 260, wy: 548, a: 'c', cls: 'onbtn', beat: 1, t: 0, to: [4, 0.6] },
    { id: 'sent', html: '<b>Sent</b>', short: '<b>Sent</b>', wx: 272, wy: 616, a: 'c', cls: 'key green', beat: 1, t: 3.0, to: [4, 0.6] },
    { id: 'kit', html: 'Kitchen', wx: 860, wy: 240, a: 'c', cls: 'onbtn', beat: 2, t: 0, to: END },
    { id: 'tk', html: '<b>#42</b><br>Margherita', short: '#42', wx: 860, wy: 358, a: 'c', cls: 'key slot', beat: 2, t: 3.0, to: END },
    { id: 'oven', html: 'Oven', wx: 805, wy: 640, a: 'c', cls: 'small', beat: 2, t: 0, to: END },
    { id: 'ready', html: '<b>Ready</b>', short: '<b>Ready</b>', wx: 1010, wy: 505, a: 'c', cls: 'key green', beat: 3, t: 3.0, to: [4, 0.4] },
    { id: 'addr', html: '12 Elm St', wx: 1499, wy: 572, a: 'c', cls: 'small', beat: 4, t: 0, to: END },
    { id: 'eta', html: '<b>6 min away</b>', short: '<b>6 min</b>', wx: 260, wy: 615, a: 'c', cls: 'key gold', beat: 4, t: 3.0, to: END },
    { id: 'done', html: '<b>Delivered in 25 min</b>', short: '<b>Delivered</b>', wx: 1442, wy: 340, a: 'c', cls: 'key onbtn', beat: 5, t: 3.0, to: END }],
});
const at = T.at, f = (t, a, d = 0.5) => clamp((t - a) / d);
const mv = (t, a, d, p0, p1) => { const e = E(clamp((t - a) / d)); return [lerp(p0[0], p1[0], e), lerp(p0[1], p1[1], e)]; };

const rr = (c, x, y, w, h, r, fill, stroke, lw = 4) => { c.beginPath(); c.roundRect(x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } };
const dot = (c, x, y, r, fill) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = fill; c.fill(); };
const line = (c, pts, col, lw, dash) => { c.save(); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; if (dash) c.setLineDash(dash); c.stroke(); c.restore(); };
const alpha = (c, a, fn) => { if (a <= 0) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); };
const pizza = (c, x, y, r) => { dot(c, x, y, r, P.crust); dot(c, x, y, r * 0.8, P.red); for (const [u, v] of [[-.3, -.25], [.35, -.1], [-.05, .35]]) dot(c, x + u * r, y + v * r, r * 0.2, '#fff4dc'); };
const box = (c, x, y) => { rr(c, x - 40, y - 26, 80, 26, 4, P.crust, P.bg, 3); line(c, [[x - 40, y - 17], [x + 40, y - 17]], P.bg, 2); };
const ROUTE = [[186, 560], [226, 500], [296, 500], [330, 380]];
const along = (pts, q) => { const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let d = tot * q; for (let i = 0; i < L.length; i++) { if (d <= L[i]) { const k = d / L[i]; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; } d -= L[i]; } return pts[pts.length - 1]; };

function world(c, t) {
  c.fillStyle = P.bg; c.fillRect(-2000, -2000, 6000, 5000);
  c.fillStyle = P.ground; c.fillRect(-2000, 700, 6000, 3000);
  rr(c, 1060, 708, 1000, 34, 17, P.road); line(c, [[1080, 725], [2000, 725]], P.line, 4, [18, 16]);
  // phone
  rr(c, 140, 210, 240, 480, 36, '#2b3550'); rr(c, 156, 250, 208, 400, 16, P.screen); rr(c, 232, 226, 56, 8, 4, P.line);
  const home = 1 - f(t, at(4, 0.4), 0.6), map = f(t, at(4, 0.4), 0.6);
  alpha(c, home, () => {
    pizza(c, 260, 385, 54);
    const press = t > at(1, 1.4) && t < at(1, 1.76) ? 0.93 : 1;
    c.save(); c.translate(260, 548); c.scale(press, press); rr(c, -72, -27, 144, 54, 27, P.gold); c.restore();
    const k = f(t, at(1, 1.3), 0.5); alpha(c, (1 - f(t, at(1, 1.8), 0.4)) * 0.9, () => { c.beginPath(); c.arc(260, 548, 30 * (0.6 + 0.65 * k), 0, 7); c.strokeStyle = P.ink; c.lineWidth = 4; c.stroke(); });
    alpha(c, f(t, at(1, 3.0), 0.6), () => rr(c, 210, 596, 124, 40, 20, null, P.green, 3));
  });
  alpha(c, map, () => {
    c.fillStyle = P.map; c.fillRect(156, 310, 208, 340);
    line(c, [[160, 600], [360, 600]], '#24453e', 7); line(c, [[220, 312], [220, 648]], '#24453e', 7); line(c, [[300, 312], [300, 648]], '#24453e', 7);
    line(c, ROUTE, P.gold, 7);
    c.fillStyle = P.teal; c.beginPath(); c.moveTo(314, 368); c.lineTo(330, 352); c.lineTo(346, 368); c.lineTo(346, 386); c.lineTo(314, 386); c.closePath(); c.fill();
    const d = along(ROUTE, E(f(t, at(4, 1.0), 6.5))); dot(c, d[0], d[1], 13, P.ink); dot(c, d[0], d[1], 9, P.red);
    alpha(c, f(t, at(4, 3.0), 0.6), () => rr(c, 168, 592, 184, 46, 23, P.bg, P.gold, 3));
  });
  // order token flying to the kitchen
  alpha(c, f(t, at(2, 0.2), 0.3) * (1 - f(t, at(2, 2.3), 0.3)), () => { const p = mv(t, at(2, 0.4), 1.6, [330, 470], [860, 350]); rr(c, p[0] - 20, p[1] - 26, 40, 52, 5, P.ink); line(c, [[p[0] - 10, p[1] - 8], [p[0] + 10, p[1] - 8]], P.bg, 3); line(c, [[p[0] - 10, p[1] + 4], [p[0] + 10, p[1] + 4]], P.bg, 3); });
  // kitchen
  rr(c, 640, 200, 440, 500, 22, P.card, P.ink, 4); rr(c, 640, 200, 440, 78, { upperLeft: 22, upperRight: 22, lowerLeft: 0, lowerRight: 0 }, P.red);
  c.fillStyle = P.red; c.fillRect(640, 250, 440, 28); line(c, [[640, 278], [1080, 278]], P.ink, 4);
  line(c, [[690, 312], [1030, 312]], P.line, 4);
  alpha(c, f(t, at(2, 3.0), 0.6), () => { const y = 312 - 18 * (1 - E(f(t, at(2, 3.0), 0.6))); rr(c, 798, y, 124, 92, 4, P.bg, P.ink, 3); });
  line(c, [[680, 452], [950, 452]], P.line, 5);
  rr(c, 680, 476, 250, 190, 16, '#3a4560'); rr(c, 704, 500, 202, 104, 10, P.screen);
  alpha(c, 0.6 * f(t, at(2, 5.6), 0.8) * (1 - f(t, at(3, 0.4), 0.6)), () => rr(c, 704, 500, 202, 104, 10, P.amber));
  line(c, [[960, 560], [1060, 560]], P.line, 5);
  if (t < at(3, 2.3)) { const p = t < at(3, 0) ? mv(t, at(2, 4.6), 1.2, [750, 426], [805, 552]) : mv(t, at(3, 0.8), 1.2, [805, 552], [1010, 534]); alpha(c, 1 - f(t, at(3, 2.0), 0.3), () => pizza(c, p[0], p[1], 24)); }
  // house
  c.beginPath(); c.moveTo(1340, 480); c.lineTo(1460, 384); c.lineTo(1580, 480); c.closePath(); c.fillStyle = P.teal; c.fill();
  rr(c, 1360, 476, 200, 224, 0, P.card, P.ink, 4); rr(c, 1384, 512, 44, 40, 4, '#2d4a63'); rr(c, 1470, 600, 58, 100, 6, P.red);
  // scooter (moves in beat 4) and the box riding on it
  const sx = 1150 + 170 * E(f(t, at(4, 1.0), 6.5)), sy = 724;
  for (const x of [-34, 34]) { dot(c, sx + x, sy - 16, 16, P.ink); dot(c, sx + x, sy - 16, 7, P.bg); }
  line(c, [[sx - 50, sy - 30], [sx + 18, sy - 30], [sx + 34, sy - 62], [sx + 44, sy - 62]], P.teal, 10);
  rr(c, sx - 18, sy - 84, 22, 46, 10, P.red); dot(c, sx - 7, sy - 98, 14, P.crust);
  if (t >= at(3, 2.0)) {
    let p;
    if (t < at(3, 5.6)) p = [1010, 558];
    else if (t < at(4, 0)) p = mv(t, at(3, 5.6), 1.3, [1010, 558], [1104, 688]);
    else if (t < at(5, 1.0)) p = [sx - 46, 688];
    else p = mv(t, at(5, 1.0), 1.2, [1320 - 46, 688], [1499, 700]);
    alpha(c, f(t, at(3, 2.0), 0.3), () => box(c, p[0], p[1]));
  }
  // delivered badge (its words are an HTML label)
  alpha(c, f(t, at(5, 3.0), 0.6), () => rr(c, 1260, 310, 320, 60, 30, P.green));
}
SCENES['pizza'] = { draw(c, lt, t) { c.save(); CAM.apply(c, T.camAt(t)); world(c, t); c.restore(); } };
})();
