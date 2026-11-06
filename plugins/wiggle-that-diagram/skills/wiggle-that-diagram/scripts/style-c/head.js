// Style C runtime, first half (build.py joins head.js + src/<film>.js + tail.js into one IIFE): captions, step rail, height posting, virtual camera, reveal helper R() that logs every reveal for the timing test, camTo(), draw(), T(). Inputs: BEATS and TELL filled by build.py.
(function(){"use strict";
var D=document,svg=D.getElementById("scene"),root=D.getElementById("anim");
var $=function(s){return svg.querySelector(s)},$$=function(s){return svg.querySelectorAll(s)};
var RED="#f07a6e",GRN="#5fd08a",AMB="#f0b24a",GOLD="#e9b949",TEAL="#5cc8d6";
var BEATS=/*BEATS*/null,TELL=/*TELL*/0;
var B=[],END=0;BEATS.forEach(function(b){B.push(END);END+=b.d});var TAIL=.6;
var embedded=window.parent!==window;
var reduce=!!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);
/* captions + step rail */
var cap=D.getElementById("cap"),stepsEl=D.getElementById("steps"),pp=D.getElementById("pp"),caps=[],btns=[];
BEATS.forEach(function(b,i){
  var p=D.createElement("p");p.innerHTML='<span class="n">'+(i+1)+'</span><span></span>';p.lastChild.textContent=b.say;cap.appendChild(p);caps.push(p);
  var li=D.createElement("li"),bt=D.createElement("button");bt.type="button";bt.setAttribute("aria-label","Step "+(i+1)+": "+b.t);
  bt.innerHTML='<i></i><b>'+(i+1)+'</b><span class="lab"></span>';bt.querySelector(".lab").textContent=b.t;li.appendChild(bt);stepsEl.appendChild(li);btns.push(bt);
});
/* height for the deck: the figure's own height, so it can shrink as well as grow */
var lastH=0;
function postH(){if(!embedded)return;var h=Math.ceil(root.getBoundingClientRect().height);if(h&&h!==lastH){lastH=h;parent.postMessage({type:"anim-height",h:h},"*")}}
if(window.ResizeObserver)new ResizeObserver(postH).observe(root);
window.addEventListener("resize",postH);window.addEventListener("load",postH);
if(reduce)root.classList.add("rm");
function mark(k){caps.forEach(function(p,i){p.classList.toggle("on",i===k)});btns.forEach(function(b,i){if(i===k)b.setAttribute("aria-current","step");else b.removeAttribute("aria-current");b.classList.toggle("done",i<k)})}
if(!window.gsap){root.classList.add("rm");mark(TELL);pp.hidden=true;postH();return}
/* virtual camera: frames are "must be visible" rects [cx,cy,w,h], fitted to the picture's aspect */
var cam={s:0},FR={},ORDER=[],mode="",box=svg.parentNode;
function layout(){var w=box.clientWidth;return w<560?"p":w<820?"m":"w"}
function frame(i){var f=FR[ORDER[Math.max(0,Math.min(ORDER.length-1,i))]];return mode==="w"?f.w:(f.t||f.w)}
function applyCam(){
  if(!box.clientWidth||!ORDER.length)return;
  var m=layout();if(m!==mode){mode=m;svg.style.aspectRatio=m==="p"?"4/5":m==="m"?"4/3":"16/9"}
  var i=Math.floor(cam.s),f=cam.s-i,a=frame(i),b=frame(i+1),L=Math.log,r=m==="p"?.8:m==="m"?4/3:16/9;
  /* fit each frame to the aspect first, then interpolate one width in log space: no kink mid-move */
  var wa=Math.max(a[2],a[3]*r),wb=Math.max(b[2],b[3]*r);
  var cx=a[0]+(b[0]-a[0])*f,cy=a[1]+(b[1]-a[1])*f,w=Math.exp(L(wa)+(L(wb)-L(wa))*f),h=w/r;
  svg.setAttribute("viewBox",(cx-w/2).toFixed(1)+" "+(cy-h/2).toFixed(1)+" "+w.toFixed(1)+" "+h.toFixed(1));
}
var tl=gsap.timeline({paused:true,repeat:-1,onUpdate:tick});
/* R = reveal; every text reveal is logged so the test page can check the 2.5 s spacing */
var REV=[];
function words(list){var n=0;[].forEach.call(list,function(el){var ts=el.tagName==="text"?[el]:[].slice.call(el.querySelectorAll("text")),own=el.closest(".why");
  ts.forEach(function(t){if(!own&&t.closest(".why"))return;n+=t.textContent.split(/\s+/).filter(function(x){return /[A-Za-z0-9]/.test(x)}).length})});return n}
function els(s){return typeof s==="string"?$$(s):(s.length!=null?s:[s])}
function R(s,b,off,o){o=o||{};var e=els(s),st=o.stagger||0,f0={opacity:0},f1={opacity:1,duration:o.dur||.6,ease:o.ease||"power2.out",stagger:st};
  if(o.x!=null){f0.x=o.x;f1.x=0}else{f0.y=o.y==null?8:o.y;f1.y=0}
  if(o.scale){f0.scale=o.scale;f1.scale=1;f0.transformOrigin=f1.transformOrigin="50% 50%"}
  tl.fromTo(e,f0,f1,B[b]+off);REV.push({b:b,t:off,last:off+st*(e.length-1),w:words(e),s:String(s)})}
function camTo(i,b,off,dur,ease){tl.to(cam,{s:i,duration:dur||1.8,ease:ease||"sine.inOut"},B[b]+off)}
function T(b,off){return B[b]+off}
function draw(s,b,off,dur){var p=$(s),l=p.getTotalLength();tl.fromTo(p,{strokeDasharray:l,strokeDashoffset:l},{strokeDashoffset:0,duration:dur||1,ease:"power1.inOut"},B[b]+off)}
