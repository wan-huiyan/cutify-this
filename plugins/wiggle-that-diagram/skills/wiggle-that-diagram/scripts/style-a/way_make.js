// Style A label track: WAY.make(def) turns one beat list into absolute times, a camera function, and the label/caption data the HTML player reads (dumped by render_way.py). Input: a film def (below).
// Copied from the worked example's ways/common.js (lines 1-33). Needs the huashu engine's U, MO and CAM globals (lib/), so load it after them via SCENE_LIBS.
//
// def = {
//   poster: [beat, secondsIntoBeat],                       // the most telling frame: reduced-motion still and video-fail poster
//   beats:  [{ title, dur, cap, still?, extras?: [{ t, html, cls }] }],   // cap = the exact caption sentence; extras = phone-only bullet lines
//   camBase: { x, y, z },                                  // world point at the centre of the frame, and zoom
//   cam:    [{ beat, t, kind: 'to', x, y, z, dur, ease? } | { beat, t, kind: 'punch', k }],   // calm moves at beat changes; ONE punch per film
//   labels: [{ id, html, short?, wx, wy, a: 'n'|'s'|'e'|'w'|'c', beat, t, to?: [beat, s], cls?: 'key' | 'muted small' | ... }],
// }
// No text is ever drawn on the canvas: every word is a label (HTML over the video), anchored to a WORLD point (wx, wy).
// Labels with cls 'key' stay on the picture on phones (using `short`); the rest move into the caption box there.
(() => {
const { clamp, lerp } = U;
const P = { bg: '#121826', card: '#1a2233', line: '#2a3346', ink: '#f3f1ea', muted: '#a8b0c0', gold: '#e9b949',
  teal: '#5cc8d6', green: '#5fd08a', amber: '#f0b24a', red: '#f07a6e', dark: '#1a1405', paper: '#223047', deep: '#202a3d' };

window.WAY = {
  make(def) {
    const T = { P, def };
    let acc = 0;
    T.BEATS = def.beats.map((b, i) => { const o = { ...b, n: i + 1, t0: acc, t1: acc + b.dur }; acc += b.dur; return o; });
    T.DUR = +acc.toFixed(3);
    T.at = (k, local) => T.BEATS[k - 1].t0 + local;                // beat k (1-based), local seconds → absolute
    const EASE = { longTail: MO.longTail, sine: MO.sineInOut, cubic: MO.cubicInOut };
    const ev = (def.cam || []).map(e => ({ ...e, at: T.at(e.beat, e.t), ease: e.ease ? EASE[e.ease] : undefined }));
    T.camAt = t => CAM.track(def.camBase, ev, t);
    T.LABELS = (def.labels || []).map(L => {
      const t0 = T.at(L.beat, L.t);
      const t1 = L.to ? T.at(L.to[0], L.to[1]) : T.BEATS[L.beat - 1].t1 - 0.05;
      return { id: L.id, html: L.html, short: L.short || null, a: L.a || 'c', cls: L.cls || '', wx: L.wx, wy: L.wy, t0, t1, beat: L.beat,
        dup: !!L.dup, follow: L.follow || null };
    });
    T.CAPTIONS = T.BEATS.map(b => ({ n: b.n, title: b.title, t0: b.t0, t1: b.t1, cap: b.cap, still: T.at(b.n, b.still ?? (b.dur - 0.6)),
      extras: (b.extras || []).map(x => ({ t: T.at(b.n, x.t), html: x.html, cls: x.cls || '' })) }));
    T.POSTER_T = T.at(def.poster[0], def.poster[1]);
    window.WT = T;
    if (window.ERAS && ERAS[0]) ERAS[0].dur = T.DUR;
    return T;
  },
};
})();
