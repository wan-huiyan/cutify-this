// Style B board kit: dark whiteboard helpers on top of the huashu engine's DG.board (y3 grammar): hand-written words, pops, arrows, cursor, buttons, chips, camera + pen + eraser film. Input: window.BEATS.
// Load via the film's eras.js SCENE_LIBS after beats.js: ['demos/<film>/beats.js', 'demos/_hb/kit.js', 'demos/<film>/board.js']. HB.make() returns a fresh board + helpers.
// Timing: every film reads window.BEATS (generated from beats.json by build_beats.py) and anchors each beat with B.at(T[k] + offset).
// Colthe defaults are a dark navy palette (C below); swap them for the new deck's tokens.
// Holds are truly still: the pen leaves the frame when idle and the camera has no drift between moves.
(() => {
const W = 1080, H = 1080;
const { clamp, lerp } = U;
const seg = MO.seg;
const C = { BOARD: '#121826', INK: '#f3f1ea', MUTED: '#a8b0c0', GOLD: '#e9b949', RED: '#f07a6e', GREEN: '#5fd08a', AMBER: '#f0b24a', TEAL: '#5cc8d6', DARK: '#1a1405' };
const FONT = '"Kalam-700"';
const LW = 6.5, SPEED = 3000;
const HB = window.HB = { C, FONT, W, H };

HB.make = () => {
  const B = DG.board({ ink: C.INK, lw: LW, speed: SPEED, font: FONT });
  const K = { B, C };
  const rr = K.rr = (x, y, w, h, r = 18) => {
    const o = [[x + r, y]];
    const arc = (cx, cy, a0) => { for (let i = 0; i <= 5; i++) { const a = a0 + i / 5 * Math.PI / 2; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI);
    return o;
  };
  const path = K.path = (g, pts, close) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };
  const rrPath = K.rrPath = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const text = K.text = (g, s, x, y, size, col, align = 'left') => { g.font = `${size}px ${FONT}`; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); };
  const custom = K.custom = o => B.push(Object.assign({ kind: 'custom' }, o));
  K.line = (pts, o = {}) => B.line(pts, o);
  K.boxLine = (pts, o = {}) => B.line(pts, { smooth: false, ...o });
  K.arrow = (pts, { col = C.GOLD, w = LW, speed = SPEED * 0.9 } = {}) => {
    B.line(pts, { col, w, speed });
    const a = pts[pts.length - 2], b = pts[pts.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 30;
    B.line([[b[0] - Math.cos(ang - 0.5) * L, b[1] - Math.sin(ang - 0.5) * L], b, [b[0] - Math.cos(ang + 0.5) * L, b[1] - Math.sin(ang + 0.5) * L]], { col, w, smooth: false, min: 0.06 });
  };
  // pop: no hand, scale up with a small overshoot (RSA keyword pop). adv = how far the timeline advances.
  K.popShape = (cx, cy, fn, { dur = 0.3, adv = 0.08 } = {}) => {
    const t0 = B.cur;
    custom({ handed: false, t0, t1: t0 + dur, draw(g, q) { const e = Math.max(0.001, MO.backOut(q, 2.2)); g.save(); g.globalAlpha = clamp(q * 4); g.translate(cx, cy); g.scale(e, e); fn(g); g.restore(); return null; }, start: () => [cx, cy], end: () => [cx, cy] });
    B.cur += adv;
  };
  K.pop = (s, x, y, size, col = C.INK, align = 'left', adv = 0.1) => { B.pop(s, x, y, size, { col, align }); B.cur += adv - 0.12; };
  // hand-written words (the pen zigzags over each letter)
  K.write = (s, x, y, size, { col = C.INK, rate = 20, align = 'left' } = {}) => B.text(s, x, y, size, { col, rate, align });
  K.dot = (x, y, r, col) => K.popShape(x, y, g => { g.fillStyle = col; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); }, { adv: 0.1 });
  K.reveal = (x, y, w, h, drawFn, dur = 0.4, rows = 4) => {
    const zz = DG.zigzag(x - 6, y - 6, w + 12, h + 12, rows), cum = DG.cum(zz), rowH = (h + 12) / rows;
    custom({ t0: B.cur, t1: B.cur + dur,
      draw(g, q) { const d = cum[cum.length - 1] * q; g.save(); if (q < 1) g.clip(DG.revealMask(zz, cum, d, rowH * 2.2)); g.lineJoin = 'round'; g.lineCap = 'round'; drawFn(g); g.restore(); return q < 1 ? DG.pointAt(zz, cum, d) : null; },
      start: () => zz[0], end: () => zz[zz.length - 1] });
    B.cur += dur + 0.03;
  };
  K.dashed = (pts, { col = C.INK, w = 5, dur = 0.2, dash = [16, 12], handed = true } = {}) => {
    const cum = DG.cum(pts), len = cum[cum.length - 1];
    custom({ handed, t0: B.cur, t1: B.cur + dur, draw(g, q) { g.save(); g.setLineDash(dash); g.strokeStyle = col; g.lineWidth = w; const tip = DG.drawPartial(g, pts, cum, len * MO.sineInOut(q)); g.restore(); return q < 1 && handed ? tip : null; },
      start: () => pts[0], end: () => pts[pts.length - 1] });
    B.cur += dur + 0.03;
  };
  K.tick = (x, y, s = 1, col = C.GREEN, w = 8) => B.line([[x, y], [x + 22 * s, y + 24 * s], [x + 62 * s, y - 26 * s]], { col, w, smooth: false, min: 0.12 });
  K.bolt = (g, r) => {                                                   // lightning-bolt badge icon
    g.fillStyle = C.GOLD; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    const k = r / 36; g.fillStyle = C.DARK; path(g, [[5, -25], [-12, 4], [2, 4], [-5, 25], [14, -6], [0, -6]].map(([a, b]) => [a * k, b * k]), true); g.fill();
  };
  // mouse cursor that glides in, clicks at tc, leaves
  K.cursor = (tx, ty, tc) => {
    const t0 = tc - 0.5, t1 = tc + 0.8;
    custom({ handed: false, t0, t1, draw(g, q, ft) {
      let x, y, a = 1;
      if (ft < tc) { const e = MO.cubicOut(seg(ft, t0, tc)); x = lerp(tx + 150, tx, e); y = lerp(ty + 190, ty, e); a = clamp(seg(ft, t0, t0 + 0.1)); }
      else { const e = MO.cubicIn(seg(ft, tc + 0.35, t1)); x = lerp(tx, tx + 170, e); y = lerp(ty, ty + 210, e); a = 1 - e; }
      if (a <= 0) return null;
      const press = ft >= tc && ft < tc + 0.14 ? 0.86 : 1;
      if (ft >= tc && ft < tc + 0.4) { const k = seg(ft, tc, tc + 0.4); g.save(); g.globalAlpha = (1 - k) * 0.9; g.strokeStyle = C.GOLD; g.lineWidth = 4; g.beginPath(); g.arc(tx, ty, 14 + k * 46, 0, 7); g.stroke(); g.restore(); }
      g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(1.25 * press, 1.25 * press);
      path(g, [[0, 0], [0, 34], [9, 26], [16, 41], [22, 38], [15, 24], [27, 24]], true);
      g.fillStyle = C.INK; g.fill(); g.lineWidth = 3; g.strokeStyle = C.DARK; g.lineJoin = 'round'; g.stroke(); g.restore();
      return null;
    }, start: () => [tx, ty], end: () => [tx, ty] });
  };
  // a pill button, drawn as an outline, fills when clicked at tc (solid: filled from the start)
  K.button = (x, y, w, h, label, col, fillTxt, tc, size = 42, solid = false) => {
    const t0 = B.cur;
    custom({ handed: false, t0, t1: t0 + 0.3, draw(g, q, ft) {
      const e = Math.max(0.001, MO.backOut(q, 2.2)), on = tc != null && ft >= tc, pulse = on ? 1 + 0.08 * Math.sin(Math.PI * seg(ft, tc, tc + 0.25)) : 1;
      g.save(); g.globalAlpha = clamp(q * 4); g.translate(x + w / 2, y + h / 2); g.scale(e * pulse, e * pulse);
      rrPath(g, -w / 2, -h / 2, w, h, h / 2);
      if (on || solid) { g.fillStyle = col; g.fill(); text(g, label, 0, size * 0.36, size, fillTxt, 'center'); }
      else { g.lineWidth = 5; g.strokeStyle = col; g.stroke(); text(g, label, 0, size * 0.36, size, col, 'center'); }
      g.restore(); return null;
    }, start: () => [x, y], end: () => [x, y] });
    B.cur += 0.1;
  };
  // outlined chip with a label
  K.chip = (x, y, label, col, size = 44, { fill = false, adv = 0.1 } = {}) => K.popShape(x, y, g => {
    g.font = `${size}px ${FONT}`; const tw = g.measureText(label).width, h = size * 1.5;
    rrPath(g, 0, -h / 2, tw + size * 0.8, h, h / 2);
    if (fill) { g.fillStyle = col; g.fill(); text(g, label, size * 0.4, size * 0.34, size, C.DARK); }
    else { g.lineWidth = 4; g.strokeStyle = col; g.stroke(); text(g, label, size * 0.4, size * 0.34, size, col); }
  }, { adv });
  // something that slides along a path between t0 and t1 and (optionally) stays at the end
  K.travel = (pts, t0, t1, fn, { stay = true, fade = 0.15, ease = MO.sineInOut } = {}) => {
    const cum = DG.cum(pts), len = cum[cum.length - 1];
    custom({ handed: false, t0, t1, draw(g, q, ft) {
      if (!stay && ft > t1 + fade) return null;
      const p = DG.pointAt(pts, cum, len * ease(q));
      g.save(); g.globalAlpha = clamp(seg(ft, t0, t0 + fade)) * (stay ? 1 : 1 - clamp(seg(ft, t1, t1 + fade))); g.translate(p[0], p[1]); fn(g, q); g.restore(); return null;
    }, start: () => pts[0], end: () => pts[pts.length - 1] });
  };
  // a board-coloured veil over a region from t (dims everything drawn earlier in the list)
  K.veil = (x, y, w, h, t, alpha = 0.7, dur = 0.6) => custom({ handed: false, t0: t, t1: t + dur, draw(g, q) { g.save(); g.globalAlpha = alpha * MO.sineInOut(q); g.fillStyle = C.BOARD; g.fillRect(x, y, w, h); g.restore(); return null; }, start: () => [x, y], end: () => [x, y] });

  // ---------- line-drawn stand-in thumbnails ----------
  const frame = (g, x, y, w = 240, h = 170) => { g.strokeStyle = C.INK; g.lineWidth = 5; rrPath(g, x, y, w, h, 14); g.stroke(); };
  K.thumbSunset = (x, y) => g => {                                         // sunset over a rail
    frame(g, x, y);
    g.lineWidth = 4.5; g.strokeStyle = C.GOLD; g.beginPath(); g.arc(x + 82, y + 104, 36, Math.PI, 2 * Math.PI); g.stroke();
    g.strokeStyle = C.INK; path(g, [[x + 12, y + 104], [x + 228, y + 104]]); g.stroke();
    path(g, [[x + 12, y + 138], [x + 228, y + 138]]); g.stroke();
    for (const px of [36, 76, 116]) { path(g, [[x + px, y + 138], [x + px, y + 164]]); g.stroke(); }
    g.lineWidth = 5; path(g, [[x + 160, y + 54], [x + 218, y + 54], [x + 189, y + 92]], true); g.stroke();
    path(g, [[x + 189, y + 92], [x + 189, y + 128]]); g.stroke(); path(g, [[x + 172, y + 130], [x + 206, y + 130]]); g.stroke();
    g.fillStyle = C.INK; g.beginPath(); g.arc(x + 202, y + 46, 6, 0, 7); g.fill();
  };
  K.thumbWaves = (x, y) => g => {                                        // waves and a sun
    frame(g, x, y);
    g.lineWidth = 4.5; g.strokeStyle = C.GOLD; g.beginPath(); g.arc(x + 40, y + 40, 15, 0, 7); g.stroke();
    g.strokeStyle = C.INK;
    for (const wy of [102, 136]) { g.beginPath(); for (let i = 0; i <= 24; i++) { const px = x + 12 + i * 8.5, py = y + wy + Math.sin(i * 1.1) * 5; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
    for (const [hx, hy, r] of [[70, 86, 13], [100, 84, 13], [128, 90, 9]]) { g.beginPath(); g.arc(x + hx, y + hy, r, 0, 7); g.stroke(); }
    g.beginPath(); g.arc(x + 168, y + 120, 16, 0, 7); g.stroke(); g.beginPath(); g.arc(x + 168, y + 120, 7, 0, 7); g.stroke();
    path(g, [[x + 205, y + 40], [x + 205, y + 112]]); g.stroke(); path(g, [[x + 224, y + 40], [x + 224, y + 112]]); g.stroke();
    for (const ry of [62, 86]) { path(g, [[x + 205, y + ry], [x + 224, y + ry]]); g.stroke(); }
  };
  K.thumbSkyline = (x, y) => g => {                                         // city skyline
    frame(g, x, y);
    g.lineWidth = 4.5; g.strokeStyle = C.INK;
    path(g, [[x + 12, y + 150], [x + 228, y + 150]]); g.stroke();
    for (const [bx, by, bw] of [[28, 96, 34], [70, 72, 28], [160, 84, 30], [200, 108, 24]]) { path(g, [[x + bx, y + 150], [x + bx, y + by], [x + bx + bw, y + by], [x + bx + bw, y + 150]]); g.stroke(); }
    path(g, [[x + 112, y + 150], [x + 112, y + 74], [x + 119, y + 44], [x + 126, y + 14], [x + 133, y + 44], [x + 140, y + 74], [x + 140, y + 150]]); g.stroke();
    g.strokeStyle = C.GOLD; g.beginPath(); g.arc(x + 196, y + 40, 13, 0, 7); g.stroke();
  };
  K.scaled = (x, y, s, fn) => g => { g.save(); g.translate(x, y); g.scale(s, s); g.translate(-x, -y); fn(g); g.restore(); };
  // a sheet of paper with a folded corner; inner(g) draws its contents
  K.sheet = (x, y, w, h, inner) => g => {
    g.strokeStyle = C.INK; g.lineWidth = 5; path(g, [[x, y], [x + w - 36, y], [x + w, y + 36], [x + w, y + h], [x, y + h]], true); g.stroke();
    path(g, [[x + w - 36, y], [x + w - 36, y + 36], [x + w, y + 36]]); g.stroke();
    if (inner) inner(g);
  };
  // generic photo / video stand-in tile
  K.tile = (x, y, w, h, kind) => g => {
    g.strokeStyle = C.INK; g.lineWidth = 4.5; rrPath(g, x, y, w, h, 10); g.stroke();
    if (kind === 'video') { g.fillStyle = C.GOLD; path(g, [[x + w / 2 - 14, y + h / 2 - 18], [x + w / 2 + 20, y + h / 2], [x + w / 2 - 14, y + h / 2 + 18]], true); g.fill(); }
    else { g.strokeStyle = C.INK; path(g, [[x + 10, y + h - 12], [x + w * 0.38, y + h * 0.4], [x + w * 0.6, y + h * 0.66], [x + w * 0.74, y + h * 0.52], [x + w - 10, y + h - 12]]); g.stroke(); g.strokeStyle = C.GOLD; g.beginPath(); g.arc(x + w - 22, y + 20, 8, 0, 7); g.stroke(); }
  };

  // ---------- the film: camera, pen, eraser, frame ----------
  K.film = ({ ids, camKeys, erase, total }) => {
    const camAt = ft => CAM.at(camKeys, ft);
    const { t0: TE0, t1: TE1, box: [EX0, EY0, EX1, EY1], rows: EROWS = 4, scale: ES = 1 } = erase;
    const ERH = (EY1 - EY0) / EROWS, EPATH = [];
    for (let r = 0; r < EROWS; r++) { const y = EY0 + ERH * (r + 0.5); if (r % 2) EPATH.push([EX1, y], [EX0, y]); else EPATH.push([EX0, y], [EX1, y]); }
    const ECUM = DG.cum(EPATH);
    const eraser = (g, x, y) => {
      g.save(); g.translate(x, y); g.scale(ES, ES);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.roundRect(-118, -350, 260, 740, 40); g.fill();
      g.fillStyle = '#4b4f57'; g.beginPath(); g.roundRect(-130, -370, 260, 740, 40); g.fill();
      g.fillStyle = '#c9ab78'; g.beginPath(); g.roundRect(-104, -344, 208, 688, 28); g.fill();
      g.strokeStyle = 'rgba(26,20,5,.35)'; g.lineWidth = 6; for (const yy of [-220, 0, 220]) { g.beginPath(); g.moveTo(-70, yy); g.lineTo(70, yy); g.stroke(); }
      g.restore();
    };
    const pen = (c, x, y, col, tilt) => {
      c.save(); c.translate(x, y); c.rotate(-0.72 + tilt);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.roundRect(34, 16, 250, 34, 16); c.fill();
      c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.lineTo(26, -8); c.lineTo(26, 8); c.closePath(); c.fill();
      c.fillStyle = '#9aa0ab'; c.beginPath(); c.roundRect(24, -12, 26, 24, 4); c.fill();
      c.fillStyle = '#ece8dd'; c.beginPath(); c.roundRect(48, -17, 190, 34, 12); c.fill();
      c.fillStyle = col; c.beginPath(); c.roundRect(212, -18, 46, 36, 10); c.fill();
      c.fillStyle = 'rgba(26,20,5,.18)'; c.beginPath(); c.roundRect(60, 5, 140, 7, 4); c.fill();
      c.restore();
    };
    let HS = null;
    const handed = () => HS || (HS = B.S.filter(s => s.kind !== 'pop' && s.kind !== 'fill' && (s.kind !== 'custom' || s.handed !== false)).sort((a, b) => a.t0 - b.t0));
    const OFF = [W + 200, H + 280], EXIT = 0.35, ENTER = 0.4;
    const penPos = (ft, cam, tip) => {
      if (tip) return CAM.toScreen(cam, tip[0], tip[1]);
      let prev = null, next = null;
      for (const s of handed()) { if (s.t1 <= ft) prev = s; else if (s.t0 > ft && !next) next = s; }
      if (prev && next && next.t0 - prev.t1 < EXIT + ENTER + 0.1) return B.penAt(ft, cam, null);
      if (prev && ft < prev.t1 + EXIT) { const a = B.penAt(prev.t1, cam, null), q = MO.cubicIn(seg(ft, prev.t1, prev.t1 + EXIT)); return [lerp(a[0], OFF[0], q), lerp(a[1], OFF[1], q)]; }
      if (next && ft > next.t0 - ENTER) { const b = B.penAt(next.t0 - 1e-4, cam, null), q = MO.cubicOut(seg(ft, Math.max(0.02, next.t0 - ENTER), next.t0)); return [lerp(OFF[0], b[0], q), lerp(OFF[1], b[1], q)]; }
      return null;
    };
    const shot = (c, lt, t) => {
      const ft = t, cam = camAt(ft);
      c.fillStyle = C.BOARD; c.fillRect(0, 0, W, H);
      if (ft >= TE1) return;                                              // board wiped clean: loop seam
      c.save(); CAM.apply(c, cam);
      const r = B.draw(c, ft);
      if (ft > TE0) {
        const d = ECUM[ECUM.length - 1] * MO.sineInOut(seg(ft, TE0, TE1));
        c.save(); c.clip(DG.revealMask(EPATH, ECUM, d, ERH * 1.18)); c.fillStyle = C.BOARD; c.fillRect(EX0 - 3000, EY0 - 3000, EX1 - EX0 + 6000, EY1 - EY0 + 6000); c.restore();
        const p = DG.pointAt(EPATH, ECUM, d); eraser(c, p[0], p[1]);
      }
      c.restore();
      if (ft < TE0) { const hp = penPos(ft, cam, r.tip); if (hp) pen(c, hp[0], hp[1], r.col || B.penColor(ft), r.tip ? Math.sin(ft * 7) * 0.03 : 0); }
    };
    for (const id of ids) SCENES[id] = { draw: shot };
    K.camAt = camAt;
    return shot;
  };
  return K;
};
})();
