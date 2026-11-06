# Embed contract: one animation file inside a slide deck or HTML report

Each animation is ONE self-contained HTML file. The host page (the deck) puts the file's text into an
`<iframe srcdoc>`, so the file must work with no URL of its own and no neighbouring files. All three styles in
the worked example passed this contract in real Chrome at 1100 px and 360 px iframe widths.

## The child side (inside every animation file)

1. **Nothing but the animation.** The picture, a caption strip under it, a step rail (one button per beat) and a
   Play/Pause button. No page title, no slide chrome, no mock deck.
   `html,body{margin:0;background:<the deck's panel colour>}`. The iframe IS the window: lay out from the file's
   own width (media or container queries), 340–1100 px. No `vh` units.
2. **Height.** After load, after `document.fonts.ready`, and on every resize (ResizeObserver), post
   `parent.postMessage({type:'anim-height', h}, '*')`, only when `h` changed.
   **Use `h = Math.ceil(rootElement.getBoundingClientRect().height)`, not `document.documentElement.scrollHeight`.**
   Once the deck sizes the iframe to `h`, `scrollHeight` can never report less than the iframe's height, so the
   embed could grow but never shrink back when the iframe gets wider. All three styles made this change; the test
   confirmed the two values are equal whenever the iframe is sized to `h`, and that `h` shrinks and regrows on resize.
3. **Stable height.** Reserve the caption box at the height of the longest caption (put all captions in one grid
   cell, or measure the tallest at the current width). The iframe height must not change between beats.
4. **Start paused inside the deck** on beat 1's *finished* frame (never an empty picture), with caption 1 showing.
   `{type:'anim-play'}` plays (from 0 the first time), `{type:'anim-pause'}` pauses. Accept messages only from
   `window.parent`. If `anim-play` arrives before the media is ready, queue it.
   Opened on its own (`window.parent === window`), autoplay.
5. **Step rail.** Tapping a step while paused shows that beat's finished frame and stays paused; while playing, it
   jumps to the beat's start. Force a video keyframe at every beat start (styles A and B) so the jump lands fast.
6. **Reduced motion** (`prefers-reduced-motion: reduce`): never autoplay and ignore `anim-play`; show the most
   telling frame (the verdict beat) and ALL captions as a numbered list; the rail still jumps between still frames.
   A Play button that works on an explicit click is acceptable. If the video cannot decode or GSAP fails to load,
   fall back to the same poster plus numbered captions.
7. **Media inline** (base64). External loads allowed: Google Fonts and one pinned library from cdnjs
   (GSAP 3.12.5 in the worked example). Size budgets: video styles ≤ 900 KB per file; live SVG ≤ 40 KB.
8. **Captions** ≥ 16 px at a 360 px iframe, never clipped, no sideways scroll. Text ON the picture stays short
   (labels, reasons). It came out at 10–14 px at 360 px in all three styles, so the caption must carry the meaning.
9. **Test hook.** Expose `window.__anim` for the contract tests (each style's shape is listed in its test script's
   header). It is harmless in production.
10. **Input forwarding.** Paste this verbatim at the end of `<body>`, so the deck's one-gesture-one-slide
    navigation still works when the pointer or finger is over the animation:

```html
<script>
(function(){ if (window.parent === window) return;
  var send=function(m){ parent.postMessage(m,'*'); };
  window.addEventListener('wheel',function(e){ e.preventDefault(); send({type:'deck-wheel',dy:e.deltaY,mode:e.deltaMode}); },{passive:false});
  document.addEventListener('keydown',function(e){
    var nav=['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','PageDown','PageUp','Home','End',' '];
    if(nav.indexOf(e.key)<0) return;
    if(e.key===' ' && e.target.closest && e.target.closest('button')) return;
    e.preventDefault(); send({type:'deck-key',key:e.key}); });
  var y0=null,x0=null;
  window.addEventListener('touchstart',function(e){ if(e.touches.length===1){y0=e.touches[0].clientY;x0=e.touches[0].clientX;} },{passive:true});
  window.addEventListener('touchend',function(e){ if(y0===null) return; var t=e.changedTouches[0];
    send({type:'deck-swipe',dy:y0-t.clientY,dx:x0-t.clientX}); y0=null; },{passive:true});
})();
</script>
```

Space on a focused button (Play/Pause, a rail step) is NOT forwarded: it presses the button.

## The parent side (in the deck)

**Status: an outline, never run against a real deck.** In the worked example the deck was read-only and had no
handler yet; the animations were only tested in their own test pages. Build this, then test it in the real deck.

```js
// 1. Keep the animation files as strings (e.g. <script type="text/plain" id="anim-film1">…</script>, or fetched once).
// 2. Lazy-create ONE iframe at a time: when a slide holding an animation becomes active, create its iframe;
//    when the slide leaves, send anim-pause and remove the iframe (or blank its srcdoc) to free the decoder.
function mountAnim(slot, html){                      // slot = the element on the slide that holds the animation
  const f = document.createElement('iframe');
  f.title = slot.dataset.title || 'animation';
  f.style.cssText = 'display:block;width:100%;border:0;height:240px';   // real height arrives via anim-height
  f.srcdoc = html;                                   // set through the property, not an attribute string you escape by hand
  slot.replaceChildren(f);
  return f;
}
// 3. One message listener for every animation. Trust only messages whose source is one of your iframes.
window.addEventListener('message', e => {
  const f = [...document.querySelectorAll('iframe')].find(x => x.contentWindow === e.source);
  const m = e.data; if (!f || !m || typeof m !== 'object') return;
  if (m.type === 'anim-height') f.style.height = m.h + 'px';
  // Feed forwarded input into the deck's OWN navigation code, exactly as if it had happened on the page:
  if (m.type === 'deck-wheel') deckWheel(m.dy * (m.mode === 1 ? 16 : m.mode === 2 ? innerHeight : 1));
  if (m.type === 'deck-key')   deckKey(m.key);                      // same branch as the deck's keydown handler
  if (m.type === 'deck-swipe') deckSwipe(m.dy, m.dx);               // same thresholds as the deck's touch handler (e.g. 50 px)
});
// 4. Play only what is on screen: on slide enter -> f.contentWindow.postMessage({type:'anim-play'}, '*');
//    on slide leave or a dialog opening over it -> {type:'anim-pause'}.
```

Notes for the parent:
- The deck page itself must not scroll (`html,body{overflow:hidden}` for a one-gesture-one-slide deck). In a page
  that scrolls, a vertical touch swipe over the iframe scrolled the parent, and the forwarded `dy` came out as 15
  instead of 200 (measured in style B's test).
- The deck's wheel handler usually treats a burst of wheel events with gaps under ~300 ms as one gesture. Route
  `deck-wheel` into that same burst logic, not straight to "next slide", or a trackpad flick will skip several slides.
- If the slide itself can still scroll (long slide content), let `deck-key`/`deck-swipe` scroll it first, as the
  deck's own handlers do.
- A style switcher (A/B/C) swaps the iframe's `srcdoc` and re-sends `anim-play` if the slide was playing.
