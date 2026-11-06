/* cute_sounds.js — sparkle-that-page
 * Use: <script src="cute_sounds.js"></script>   (starts on load)
 * Tiny synthesized sounds: WebAudio oscillators + gain envelopes. No audio files. OFF until the visitor switches them on.
 * The switch: a small speaker button (bottom-left), or any element of yours marked  data-sound-toggle  (an empty one gets the
 *   speaker icon; it always gets aria-pressed). No AudioContext is created before the visitor opts in; the first one is made
 *   on the opt-in click (or, when "on" was remembered from an earlier visit, on the first sound) and then reused.
 *   The choice is remembered in localStorage ("stp:sound" = "on" | "off"), read and written inside try/catch.
 * Voice per palette (<html data-palette>, read each time a sound plays): meadow = triangle · neon = sine, slightly detuned
 *   · candy = soft square (low gain, low-passed). Peak gain is ~0.08 or less, so it stays quiet — the detuned neon pair
 *   shares one gain node, so each of its two oscillators gets half, and the pair adds up to the same loudness.
 * Sounds:  chime   a confetti or celebrate burst, and a stamp landing
 *          tick    a click on [data-celebrate]
 *          twinkle the secret-word party (secret_word.js)
 *          on      the little confirmation when the visitor turns sound on
 *   Click hooks only fire while click_confetti.js is running (clickConfetti.active()), and follow its rule: a stamp chimes when it lands;
 *   [data-celebrate] ticks, then chimes with its burst; [data-confetti] (or your data-confetti-on selector) chimes.
 *   data-confetti-on="*" does NOT make every click chime — sound is for the moments that matter.
 * Reduced motion: sound is not motion, so prefers-reduced-motion does not mute it — the visitor's own switch does.
 * API: SparkleThatPage.sounds = { play(name), enabled(), setEnabled(bool), start(), destroy() }
 *   play() returns true when it scheduled a sound, false when sound is off, destroyed, or the name is unknown.
 *   start() is idempotent; destroy() removes the button it made, the listeners and closes the AudioContext. */
(function () {
  "use strict";
  var KEY = "stp:sound", ds = document.documentElement.dataset, DEFAULT_ON = "[data-celebrate], [data-confetti]";
  var VOICE = {
    meadow: { type: "triangle", gain: 0.08, tail: 1 },
    neon:   { type: "sine", gain: 0.07, tail: 1.4, det: 7 },
    candy:  { type: "square", gain: 0.03, tail: 0.7, lp: 2600 }
  };
  var SCALE = [1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093, 2349.32, 2637.02]; // C major pentatonic-ish, C6 up
  // [scale index, start (s), length (s), gain multiplier]
  var SOUND = {
    chime:   [[2, 0, 0.3, 1], [4, 0.09, 0.3, 1], [5, 0.18, 0.7, 0.7]],
    tick:    [[3, 0, 0.07, 0.8]],
    twinkle: [[3, 0, 0.18, 1], [5, 0.05, 0.18, 0.9], [4, 0.1, 0.18, 0.9], [6, 0.15, 0.18, 0.8], [7, 0.21, 0.5, 0.7]],
    on:      [[3, 0, 0.1, 0.7], [5, 0.07, 0.2, 0.7]]
  };

  var started = false, enabled = false, ac = null, made = null, timers = [];

  function store(v) { try { if (v === undefined) return localStorage.getItem(KEY); localStorage.setItem(KEY, v); } catch (e) { /* private mode: this visit only */ } return null; }
  function ctxNow() {
    if (!ac) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); }
    if (ac.state === "suspended" && ac.resume) ac.resume();
    return ac;
  }
  function voice() { return VOICE[ds.palette] || VOICE.candy; }
  function note(a, v, idx, at, len, mul) {
    var t = a.currentTime + at, L = len * v.tail, g = a.createGain(), peak = v.gain * mul * (v.det ? 0.5 : 1), osc, out = g;   // two voices into one gain: halve each
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + L);
    if (v.lp) { var f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = v.lp; f.connect(a.destination); g.connect(f); } else g.connect(a.destination);
    [0, v.det || 0].forEach(function (d, i) {
      if (i && !d) return;
      osc = a.createOscillator(); osc.type = v.type; osc.frequency.setValueAtTime(SCALE[idx], t); osc.detune.value = d;
      osc.connect(out); osc.start(t); osc.stop(t + L + 0.05);
    });
  }
  function play(name) {
    if (!started || !enabled || !SOUND[name]) return false;
    try {
      var a = ctxNow(); if (!a) return false;
      var v = voice();
      SOUND[name].forEach(function (n) { note(a, v, n[0], n[1], n[2], n[3]); });
      return true;
    } catch (e) { return false; }
  }

  // ---- the switch ----
  var ICON_ON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
  function toggles() { return document.querySelectorAll("[data-sound-toggle]"); }
  function paint() {
    Array.prototype.forEach.call(toggles(), function (b) {
      b.setAttribute("aria-pressed", enabled ? "true" : "false");
      if (!b.hasAttribute("aria-label") && !b.textContent.trim()) b.setAttribute("aria-label", "Sound effects");
      if (b === made || (!b.children.length && !b.textContent.trim()) || b.hasAttribute("data-sound-icon")) { b.setAttribute("data-sound-icon", ""); b.innerHTML = enabled ? ICON_ON : ICON_OFF; }
    });
  }
  function build() {
    if (made || !document.body || document.querySelector("[data-sound-toggle]")) return;
    made = document.createElement("button"); made.type = "button"; made.className = "stp-sound";
    made.setAttribute("data-sound-toggle", ""); made.setAttribute("aria-label", "Sound effects");
    made.style.cssText = "position:fixed;left:14px;bottom:14px;z-index:2147483603;width:40px;height:40px;padding:0;display:flex;align-items:center;justify-content:center;" +
      "border-radius:50%;border:2px solid #f472b6;border:2px solid var(--stp-c1,#f472b6);background:Canvas;color:CanvasText;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.18)";
    document.body.appendChild(made);
  }
  function setEnabled(on) { enabled = !!on; store(enabled ? "on" : "off"); if (started) paint(); }

  function eligible(t) { // mirrors click_confetti.js: the data-confetti-on selector, or the default one ("*" is not sound-worthy)
    var sel = ds.confettiOn && ds.confettiOn !== "*" ? ds.confettiOn : DEFAULT_ON, el = t.closest && t.closest(sel);
    return el && el !== document.documentElement ? el : null;
  }
  function later(fn, ms) { var id = setTimeout(function () { timers.splice(timers.indexOf(id), 1); fn(); }, ms); timers.push(id); }
  function onClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("[data-sound-toggle]")) { setEnabled(!enabled); if (enabled) play("on"); return; }
    var cc = window.SparkleThatPage && window.SparkleThatPage.clickConfetti;
    if (!enabled || !cc || !cc.active || !cc.active()) return; // sounds follow confetti: not running (even if destroy()ed with its key left behind), no chime
    if (t.closest("[data-stamp]")) { later(function () { play("chime"); }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220); return; }
    var el = eligible(t);
    if (el && el.hasAttribute("data-celebrate")) { play("tick"); later(function () { play("chime"); }, 90); }
    else if (el) play("chime");
  }
  function onReady() { build(); paint(); }

  function start() {
    if (started) return;
    started = true;
    enabled = store() === "on";
    document.addEventListener("click", onClick, { passive: true });
    if (document.body) onReady(); else document.addEventListener("DOMContentLoaded", onReady, { once: true });
  }
  function destroy() {
    if (!started) return;
    started = false;
    document.removeEventListener("click", onClick); document.removeEventListener("DOMContentLoaded", onReady);
    timers.forEach(clearTimeout); timers = [];
    if (made) { made.remove(); made = null; }
    Array.prototype.forEach.call(toggles(), function (b) { b.removeAttribute("aria-pressed"); if (b.hasAttribute("data-sound-icon")) { b.removeAttribute("data-sound-icon"); b.innerHTML = ""; } });
    if (ac) { try { ac.close(); } catch (e) { /* already closed */ } ac = null; }
  }

  window.SparkleThatPage = window.SparkleThatPage || {};
  window.SparkleThatPage.sounds = { play: play, enabled: function () { return enabled; }, setEnabled: setEnabled, start: start, destroy: destroy };
  start();
})();
