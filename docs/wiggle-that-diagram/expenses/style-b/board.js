// Style B board for the expenses demo: phone (top left), policy over three receipt cards (top right), a colour and a reason
// for each card, the manager (under the amber reason) and the report (under the cards); the money travels back to the phone, the camera pulls back, the eraser wipes.
// Every event is anchored to window.BEATS[k].t0 (from beats.json via build_beats.py). Runs inside the huashu engine.
(() => {
const K = HB.make(), B = K.B, C = K.C, T = window.BEATS.map(b => b.t0), END = window.FILM_TOTAL;
const { clamp, lerp } = U, seg = MO.seg, ease = MO.sineInOut;
const at = (k, off) => T[k] + off;
const closed = pts => pts.concat([pts[0]]);
const thing = (a, b, pos, fn) => K.custom({ handed: false, t0: a, t1: a + 0.25,
  draw(g, q, ft) { if (ft > b) return null; const p = pos(ft); g.save(); g.globalAlpha = clamp(q * 2); g.translate(p[0], p[1]); fn(g, ft); g.restore(); return null; },
  start: () => pos(a), end: () => pos(a) });
const path = (from, to, a, b) => ft => { const e = ease(seg(ft, a, b)); return [lerp(from[0], to[0], e), lerp(from[1], to[1], e)]; };
const still = p => () => p;
const sheetIcon = g => { g.fillStyle = C.INK; g.beginPath(); g.roundRect(-26, -34, 52, 68, 6); g.fill();
  g.strokeStyle = C.BOARD; g.lineWidth = 5; for (const y of [-14, 0, 14]) { g.beginPath(); g.moveTo(-14, y); g.lineTo(14, y); g.stroke(); } };
const coin = g => { g.fillStyle = C.GOLD; g.beginPath(); g.arc(0, 0, 34, 0, 7); g.fill(); K.text(g, '$', 0, 16, 46, C.DARK, 'center'); };
const dot = col => g => { g.fillStyle = col; g.beginPath(); g.arc(0, 0, 18, 0, 7); g.fill(); };

const ROWS = [300, 460, 620], CX = 560, CW = 460;          // receipt cards: left x, width; row tops (height 120)

// ---------------- beat 1: three snaps, three receipts, the app reads each amount ----------------
B.at(at(0, 0.2));
K.line(closed(K.rr(140, 180, 260, 540, 40)));
K.line([[235, 210], [305, 210]], { min: 0.05 });
K.line(closed(K.rr(215, 290, 110, 80, 14)), { w: 5 });                                    // camera icon
K.line(DG.arcPts ? DG.arcPts(270, 330, 26, 26, 0, Math.PI * 2, 18) : [[270, 304], [296, 330], [270, 356], [244, 330], [270, 304]], { w: 5 });
for (const [i, t] of [[0, 0.9], [1, 1.2], [2, 1.5]].map(([i, t]) => [i, t])) {
  thing(at(0, t), END, still([200 + i * 70, 470]), sheetIcon);                             // snapped receipt on the phone
  thing(at(0, 1.8 + i * 0.25), at(0, 3.2 + i * 0.25), path([200 + i * 70, 470], [CX + 60, ROWS[i] + 60], at(0, 1.8 + i * 0.25), at(0, 2.9 + i * 0.25)), sheetIcon);
}
B.at(at(0, 2.6));
for (const y of ROWS) K.line(closed(K.rr(CX, y, CW, 120, 20)), { speed: 6000 });
const ITEMS = [['Hotel', '$180'], ['Dinner', '$95'], ['Taxi', '$40']];
B.at(at(0, 3.4));
ITEMS.forEach(([n, a], i) => { K.write(n, CX + 120, ROWS[i] + 76, 50, { rate: 26 }); K.write(a, CX + CW - 130, ROWS[i] + 76, 50, { rate: 26 }); });
ITEMS.forEach((_, i) => thing(at(0, 3.0), END, still([CX + 60, ROWS[i] + 60]), sheetIcon));  // the receipt icon stays on its card

// ---------------- beat 2: the written policy and its three checks ----------------
B.at(at(1, 1.0));
K.line(closed(K.rr(530, 60, 520, 170, 22)), { col: C.GOLD });
B.at(at(1, 2.5)); K.write('Expense policy', 790, 120, 46, { col: C.GOLD, align: 'center' });
B.at(B.cur + 0.1);
const ICX = [650, 790, 930];
K.line(DG.arcPts ? DG.arcPts(ICX[0], 180, 26, 26, 0, Math.PI * 2, 18) : [[ICX[0], 154], [ICX[0] + 26, 180], [ICX[0], 206], [ICX[0] - 26, 180], [ICX[0], 154]], { col: C.GOLD, w: 5 });
K.line([[ICX[1] - 28, 166], [ICX[1] + 10, 166], [ICX[1] + 28, 180], [ICX[1] + 10, 194], [ICX[1] - 28, 194], [ICX[1] - 28, 166]], { col: C.GOLD, w: 5, smooth: false });
K.line(closed(K.rr(ICX[2] - 28, 162, 56, 38, 8)), { col: C.GOLD, w: 5 });
B.at(at(1, 4.2));
for (const x of ICX) K.line([[x, 210], [x, ROWS[0]]], { col: C.GOLD, w: 4, smooth: false, speed: 5000 });

// ---------------- beat 3: a colour and a reason for each receipt ----------------
const RX = 1100, REASONS = [['Under the limit', C.GREEN], ['Over the $60 meal limit', C.AMBER], ['No photo', C.RED]];
REASONS.forEach(([r, col], i) => {
  thing(at(2, 1.4 + i * 2.5), END, still([1060, ROWS[i] + 60]), dot(col));
  B.at(at(2, 2.5 + i * 2.5)); K.write(r, RX, ROWS[i] + 76, 46, { col, rate: 24 });
});
B.at(at(2, 8.3)); K.arrow([[CX, ROWS[2] + 100], [470, 760], [400, 700]], { col: C.RED, w: 5 });   // the taxi goes back to Ana

// ---------------- beat 4: the amber dinner goes to the manager ----------------
B.at(at(3, 0.4)); K.arrow([[1300, 540], [1330, 680], [1310, 800]], { col: C.AMBER, w: 6 });
B.at(at(3, 0.9));
K.line(closed(K.rr(1100, 820, 420, 230, 22)));
K.line(DG.arcPts ? DG.arcPts(1180, 890, 34, 34, 0, Math.PI * 2, 20) : [[1180, 856], [1214, 890], [1180, 924], [1146, 890], [1180, 856]], { col: C.TEAL });
K.line([[1240, 876], [1470, 876]], { col: C.MUTED, w: 8, smooth: false }); K.line([[1240, 908], [1410, 908]], { col: C.MUTED, w: 8, smooth: false });
B.at(at(3, 2.5)); K.chip(1140, 970, 'Approved', C.GREEN, 40, { fill: true });
B.at(at(3, 3.0)); K.write('Client dinner, 2 people', 1140, 1032, 30, { col: C.MUTED, rate: 30 });

// ---------------- beat 5: the approved lines fill the report ----------------
B.at(at(4, 0.3)); K.arrow([[1100, 940], [1040, 940]], { col: C.GREEN, w: 6 });
B.at(at(4, 0.7));
K.line(closed(K.rr(560, 800, 460, 430, 22)));
K.line([[560, 870], [1020, 870]], { smooth: false });
const ROWY = [920, 990];
ROWY.forEach((y, i) => thing(at(4, 1.3 + i * 0.4), END, path([650, y], [790, y], at(4, 1.3 + i * 0.4), at(4, 1.8 + i * 0.4)), g => {
  g.fillStyle = C.GREEN; g.beginPath(); g.arc(-110, 0, 12, 0, 7); g.fill();
  g.strokeStyle = C.INK; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(-80, 0); g.lineTo(70, 0); g.moveTo(110, 0); g.lineTo(160, 0); g.stroke(); }));
B.at(at(4, 2.2)); K.line([[590, 1060], [990, 1060]], { smooth: false });
B.at(at(4, 2.5)); K.write('Total $275', 790, 1150, 58, { col: C.GOLD, align: 'center', rate: 22 });

// ---------------- beat 6: the money goes back to Ana's phone; pull back; hold; wipe ----------------
thing(at(5, 0.6), at(5, 2.6), path([790, 1190], [270, 600], at(5, 0.8), at(5, 2.4)), coin);
B.at(at(5, 2.3)); K.tick(222, 600, 1.3, C.GREEN, 9);
B.at(at(5, 2.5)); K.pop('Paid', 270, 680, 50, C.GREEN, 'center');

const S = MO.sineInOut;
K.film({ ids: ['expenses'], total: END,
  camKeys: [
    { t: 0, x: 560, y: 450, z: 1 }, { t: at(1, 0), x: 560, y: 450, z: 1 },
    { t: at(1, 1.6), x: 810, y: 400, z: 1.15, ease: S }, { t: at(2, 0), x: 810, y: 400, z: 1.15 },
    { t: at(2, 1.6), x: 1080, y: 470, z: 0.95, ease: S }, { t: at(3, 0), x: 1080, y: 470, z: 0.95 },
    { t: at(3, 1.6), x: 1220, y: 760, z: 1.0, ease: S }, { t: at(4, 0), x: 1220, y: 760, z: 1.0 },
    { t: at(4, 1.6), x: 1000, y: 1000, z: 0.95, ease: S }, { t: at(5, 0), x: 1000, y: 1000, z: 0.95 },
    { t: at(5, 1.8), x: 860, y: 680, z: 0.68, ease: S }],
  erase: { t0: at(5, 6.5), t1: at(5, 7.85), box: [60, 0, 1680, 1360], rows: 4, scale: 2.2 } });
})();
