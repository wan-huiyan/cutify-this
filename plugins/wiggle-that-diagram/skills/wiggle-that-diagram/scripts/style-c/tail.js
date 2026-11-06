// Style C runtime, second half: loop fade, step/caption sync, play/pause, anim-play/anim-pause messages (parent only), reduced motion, the window.__anim test hook, start-up (paused on beat 1 still in a frame, autoplay alone).
/* loop: fade in at 0, hold the last frame, fade out over TAIL */
tl.fromTo("#world",{opacity:0},{opacity:1,duration:.5,ease:"none"},0);
tl.to("#world",{opacity:0,duration:TAIL,ease:"none"},END);
var cur=-1;
function stepAt(t){var k=0;for(var i=0;i<B.length;i++)if(t>=B[i]-1e-3)k=i;return k}
function tick(){applyCam();var t=tl.time(),k=stepAt(t);if(k!==cur){cur=k;mark(k)}
  var p=Math.min(1,Math.max(0,(t-B[k])/BEATS[k].d));btns.forEach(function(b,i){b.style.setProperty("--p",i<k?1:i===k?p.toFixed(3):0)})}
var playing=false,started=false;
function icon(){pp.innerHTML=playing?'<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="1" width="3.5" height="12"/><rect x="8.5" y="1" width="3.5" height="12"/></svg>':'<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1l10 6-10 6z"/></svg>';pp.setAttribute("aria-label",playing?"Pause animation":"Play animation")}
function play(){if(!started){started=true;tl.seek(0)}playing=true;tl.play();icon()}
function pause(){playing=false;tl.pause();icon()}
function still(i){tl.pause();tl.seek(B[i]+BEATS[i].still);tick()}
function show(i){started=true;playing=false;still(i);icon()}
pp.addEventListener("click",function(){playing?pause():play()});
btns.forEach(function(bt,i){bt.addEventListener("click",function(){if(playing){tl.seek(B[i]);tick()}else show(i)})});
window.addEventListener("message",function(e){if(e.source!==window.parent)return;var d=e.data;if(!d||typeof d!=="object")return;
  if(d.type==="anim-play"){if(!reduce&&!playing)play()}else if(d.type==="anim-pause"){if(playing)pause()}});
window.__anim={time:function(){return tl.time()},playing:function(){return playing},seek:function(t){pause();started=true;tl.seek(t);tick()},B:B,END:END,TAIL:TAIL,REV:REV,beats:BEATS,tell:TELL,cam:function(){return svg.getAttribute("viewBox")}};
var ready=false;
function start(){ready=true;applyCam();if(playing){postH();return}
  if(reduce)show(TELL);else if(embedded){still(0);icon()}else play();postH()}
if(window.ResizeObserver)new ResizeObserver(function(){applyCam();postH()}).observe(box);
icon();applyCam();
(D.fonts&&D.fonts.ready?D.fonts.ready:Promise.resolve()).then(start);
})();
