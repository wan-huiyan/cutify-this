// Style B board for the pizza demo: one dark whiteboard holding four corners (phone top-left, kitchen top-right,
// scooter bottom-right, house bottom-left); the camera visits them beat by beat, pulls back, holds, and the eraser wipes.
// Every event is anchored to window.BEATS[k].t0 (from beats.json via build_beats.py). Runs inside the huashu engine.
(() => {
const K = HB.make(), B = K.B, C = K.C, T = window.BEATS.map(b => b.t0), END = window.FILM_TOTAL;
const { clamp, lerp } = U, seg = MO.seg, ease = MO.sineInOut;
const at = (k, off) => T[k] + off;
const closed = pts => pts.concat([pts[0]]);

// something with no pen: visible between a and b, placed by pos(ft), drawn by fn(g, ft) around (0,0)
const thing = (a, b, pos, fn) => K.custom({ handed: false, t0: a, t1: a + 0.25,
  draw(g, q, ft) { if (ft > b) return null; const p = pos(ft); g.save(); g.globalAlpha = clamp(q * 2); g.translate(p[0], p[1]); fn(g, ft); g.restore(); return null; },
  start: () => pos(a), end: () => pos(a) });
const path = (from, to, a, b) => ft => { const e = ease(seg(ft, a, b)); return [lerp(from[0], to[0], e), lerp(from[1], to[1], e)]; };
const chain = (...legs) => ft => { for (const [a, b, f] of legs) if (ft <= b) return f(ft); return legs[legs.length - 1][2](ft); };

const pizza = r => g => { g.lineWidth = 5; g.strokeStyle = C.AMBER; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke();
  g.fillStyle = C.RED; g.beginPath(); g.arc(0, 0, r * 0.78, 0, 7); g.fill();
  g.fillStyle = C.INK; for (const [x, y] of [[-0.3, -0.25], [0.3, -0.1], [-0.05, 0.35]]) { g.beginPath(); g.arc(x * r, y * r, r * 0.17, 0, 7); g.fill(); } };
const box = g => { g.lineWidth = 5; g.strokeStyle = C.INK; g.fillStyle = C.AMBER; g.beginPath(); g.roundRect(-55, -34, 110, 34, 6); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-55, -22); g.lineTo(55, -22); g.stroke(); };
const ticketIcon = g => { g.lineWidth = 5; g.strokeStyle = C.INK; g.fillStyle = C.BOARD; g.beginPath(); g.roundRect(-26, -34, 52, 68, 6); g.fill(); g.stroke();
  for (const y of [-14, 0, 14]) { g.beginPath(); g.moveTo(-14, y); g.lineTo(14, y); g.stroke(); } };
const scooter = g => { g.lineCap = 'round'; g.lineJoin = 'round';
  g.lineWidth = 7; g.strokeStyle = C.TEAL; g.beginPath(); g.moveTo(-70, -40); g.lineTo(30, -40); g.lineTo(54, -96); g.lineTo(70, -96); g.moveTo(54, -96); g.lineTo(62, -40); g.stroke();
  g.lineWidth = 6; g.strokeStyle = C.INK; for (const x of [-48, 52]) { g.beginPath(); g.arc(x, -22, 22, 0, 7); g.stroke(); }
  g.fillStyle = C.RED; g.beginPath(); g.roundRect(-30, -128, 30, 70, 14); g.fill();
  g.fillStyle = C.AMBER; g.beginPath(); g.arc(-15, -150, 20, 0, 7); g.fill(); };

// ---------------- beat 1: Sam orders (phone, top-left) ----------------
B.at(at(0, 0.3));
K.line(closed(K.rr(390, 220, 300, 640, 44)));
K.line([[505, 252], [575, 252]], { min: 0.05 });
K.write('Pizza app', 540, 330, 54, { align: 'center' });
K.popShape(540, 470, pizza(72), { adv: 0.25 });
K.write('Margherita', 540, 620, 52, { align: 'center' });
K.button(430, 680, 220, 78, 'Order', C.RED, C.INK, at(0, 3.4), 44);
K.cursor(540, 719, at(0, 3.4));
B.at(at(0, 4.0)); K.chip(452, 810, 'Sent', C.GREEN, 40);

// ---------------- beat 2: the ticket prints in the kitchen; pizza into the oven (top-right) ----------------
thing(at(1, 0.2), at(1, 2.0), path([700, 470], [1640, 330], at(1, 0.3), at(1, 1.9)), ticketIcon);
B.at(at(1, 1.9));
K.line(closed(K.rr(1450, 200, 550, 680, 30)));
K.line([[1450, 312], [2000, 312]], { smooth: false });
K.write('Kitchen', 1725, 285, 60, { align: 'center' });
B.at(at(1, 3.0));
K.reveal(1610, 330, 180, 150, K.sheet(1610, 330, 180, 150, g => { K.text(g, '#42', 1700, 400, 50, C.INK, 'center'); K.text(g, 'Margherita', 1700, 455, 36, C.INK, 'center'); }), 0.5);
B.at(at(1, 4.2));
K.line(closed(K.rr(1500, 560, 300, 270, 24)));
K.line(closed(K.rr(1530, 590, 240, 140, 14)), { w: 5 });
K.write('Oven', 1650, 800, 46, { align: 'center' });
K.line([[1830, 800], [1970, 800]], { smooth: false });                                   // the shelf
const OVEN = [1650, 660], SHELF = [1900, 795], RACK = [1640, 1636];
const glow = K.custom({ handed: false, t0: at(1, 6.2), t1: at(1, 7.0), draw(g, q, ft) {
  const a = 0.5 * q * (1 - clamp(seg(ft, at(2, 0.4), at(2, 1.2)))); if (a <= 0) return null;
  g.save(); g.globalAlpha = a; g.fillStyle = C.AMBER; g.beginPath(); g.roundRect(1534, 594, 232, 132, 12); g.fill(); g.restore(); return null; },
  start: () => OVEN, end: () => OVEN });
thing(at(1, 5.0), at(2, 2.2), chain([0, at(1, 6.2), path([1560, 500], OVEN, at(1, 5.2), at(1, 6.2))], [0, 1e9, path(OVEN, [SHELF[0], SHELF[1] - 30], at(2, 0.8), at(2, 2.0))]), pizza(34));

// ---------------- beat 3: the box goes on the shelf, the driver takes it (bottom-right) ----------------
thing(at(2, 2.1), at(4, 2.0), chain(
  [0, at(2, 5.6), () => SHELF],
  [0, at(2, 6.9), path(SHELF, [RACK[0] - 74, RACK[1] - 70], at(2, 5.6), at(2, 6.9))],
  [0, 1e9, ft => { const s = scooterAt(ft); return [s[0] - 74, s[1] - 70]; }]), box);
const scooterAt = chain([0, at(3, 2.0), () => RACK], [0, 1e9, path(RACK, [820, 1636], at(3, 2.0), at(3, 8.0))]);
thing(at(2, 1.2), END, scooterAt, scooter);
B.at(at(2, 3.0)); K.pop('Ready', 1900, 735, 46, C.GREEN, 'center');

// ---------------- beat 4: the app follows the driver on a map (whole board) ----------------
B.at(at(3, 0.6));
K.line([[2000, 1660], [280, 1660]], { smooth: false, w: 5, col: C.MUTED });               // the road
K.veil(402, 360, 276, 488, at(3, 0.9), 1, 0.4);                                            // clear the phone screen
B.at(at(3, 1.3));
const ROUTE = [[440, 740], [480, 640], [600, 640], [640, 420]];
K.line(ROUTE, { col: C.GOLD, w: 8 });
K.line([[380, 1640], [380, 1420], [700, 1420], [700, 1640]], { smooth: false });            // the house
K.line([[350, 1430], [540, 1290], [730, 1430]], { smooth: false });
K.line(closed(K.rr(560, 1520, 80, 120, 8)), { w: 5, col: C.RED });
B.at(at(3, 2.5)); K.write('12 Elm St', 540, 1488, 40, { align: 'center' });
{ const cum = DG.cum(ROUTE), len = cum[cum.length - 1];
  thing(at(3, 2.0), END, ft => DG.pointAt(ROUTE, cum, len * ease(seg(ft, at(3, 2.0), at(3, 8.0)))), g => { g.fillStyle = C.RED; g.beginPath(); g.arc(0, 0, 16, 0, 7); g.fill(); g.lineWidth = 5; g.strokeStyle = C.INK; g.stroke(); }); }
B.at(at(3, 5.0)); K.pop('6 min away', 540, 815, 44, C.INK, 'center');

// ---------------- beat 5: the box reaches the door; pull back; hold; wipe ----------------
thing(at(4, 2.0), END, path([820 - 74, 1566], [600, 1640], at(4, 2.0), at(4, 3.0)), box);
B.at(at(4, 3.0)); K.chip(250, 1230, 'Delivered in 25 min', C.GREEN, 44, { fill: true });

const S = MO.sineInOut;
K.film({ ids: ['pizza'], total: END,
  camKeys: [
    { t: 0, x: 540, y: 540, z: 1 }, { t: at(1, 0), x: 540, y: 540, z: 1 },
    { t: at(1, 1.8), x: 1700, y: 540, z: 1, ease: S }, { t: at(2, 0), x: 1700, y: 540, z: 1 },
    { t: at(2, 1.8), x: 1700, y: 1000, z: 0.62, ease: S }, { t: at(3, 0), x: 1700, y: 1000, z: 0.62 },
    { t: at(3, 1.8), x: 1140, y: 980, z: 0.58, ease: S }, { t: at(4, 0), x: 1140, y: 980, z: 0.58 },
    { t: at(4, 1.8), x: 560, y: 1440, z: 1, ease: S }, { t: at(4, 5.6), x: 560, y: 1440, z: 1 },
    { t: at(4, 7.4), x: 1140, y: 980, z: 0.58, ease: S }],
  erase: { t0: at(4, 8.5), t1: at(4, 9.85), box: [160, 120, 2100, 1800], rows: 4, scale: 2.2 } });
})();
