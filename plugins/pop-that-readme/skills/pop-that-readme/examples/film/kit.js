// Style D kit: plumbing and element shapes for a long silent film drawn as ONE SVG page, where every frame is a pure function of t.
// Load it before the film's own script: <script src="kit.js"></script>. The film calls setupFilm({...}), then shot(fn) once per shot.
// Nothing here carries story text: every word on screen comes from the film's own strings.

// ---------- theme (override any key with window.KIT_THEME before loading) ----------
const C = Object.assign({bg:'#0f1420',panel:'#121826',card:'#1a2233',line:'#2a3346',ink:'#f3f1ea',mut:'#a8b0c0',gold:'#e9b949',teal:'#5cc8d6',
  green:'#5fd08a',amber:'#f0b24a',red:'#f07a6e',cap:'#d9dce4',paper:'#efe9dc',dark:'#1b2130',pmut:'#6b7180',pgold:'#9a6a08',pteal:'#1f7f8c',
  pgreen:'#2f9e5c',pamb:'#b9740f',sticky:'#f4cf6b',stickyFold:'#c9a240'}, (typeof window!=='undefined'&&window.KIT_THEME)||{});
const W=1920,H=1080,CX=960,CY=470;

// ---------- maths ----------
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), p=(t,a,b)=>cl((t-a)/(b-a)), L=(a,b,x)=>a+(b-a)*x;
const eo=x=>1-Math.pow(1-x,3), eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const bk=x=>{if(x<=0)return 0;const c=1.7;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};   // small overshoot, for pops
const rnd=i=>{let x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};               // stable pseudo-random, same every frame
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const tw=(s,size)=>String(s).length*size*0.5;                                                  // rough text width for Outfit bold
function wrap(s,n){const out=[];let l='';String(s).split(' ').forEach(x=>{if((l+' '+x).trim().length>n&&l){out.push(l);l=x}else l=(l+' '+x).trim()});if(l)out.push(l);return out}

// ---------- primitives ----------
function T(x,y,s,o={}){return `<text x="${x}" y="${y}" font-size="${o.size||28}" font-weight="${o.wt||400}" fill="${o.fill||C.ink}" text-anchor="${o.a||'start'}" ${o.ls?`letter-spacing="${o.ls}"`:''} opacity="${o.op??1}">${esc(s)}</text>`}
const G=(inner,tr='',op=1)=>op<=0.001?'':`<g ${tr?`transform="${tr}"`:''} opacity="${op}">${inner}</g>`;
const R=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r??14}" fill="${o.fill||C.card}" ${o.stroke?`stroke="${o.stroke}" stroke-width="${o.sw||2}"`:''} ${o.dash?`stroke-dasharray="${o.dash}"`:''} opacity="${o.op??1}"/>`;
// the camera: look at (fx,fy) at scale s; dx,dy nudge the frame. Wrap a shot's whole picture in G(g, cam(...)).
const cam=(s,fx,fy,dx=0,dy=0)=>`translate(${CX+dx} ${CY+dy}) scale(${s}) translate(${-fx} ${-fy})`;
function chip(x,y,label,col,o={}){const sz=o.size||22,w=o.w||(tw(label,sz)*1.1+34);return R(x,y,w,o.h||38,{r:19,fill:col,op:o.bgop??.18})+T(x+w/2,y+(o.h||38)/2+sz*0.36,label,{size:sz,wt:700,fill:o.ink||col,a:'middle'})}
function tick(x,y,k,r=14){return G(`<circle r="${r}" fill="${C.green}"/><path d="M${-r*.45} 0 l${r*.3} ${r*.38} l${r*.6} ${-r*.68}" stroke="${C.bg}" stroke-width="${r*.26}" fill="none" stroke-linecap="round"/>`,`translate(${x} ${y}) scale(${bk(cl(k))})`,cl(k*2))}
function fileIcon(x,y,col,s=1){return G(`<rect width="34" height="44" rx="5" fill="${col}"/><path d="M7 14h20M7 22h20M7 30h14" stroke="${C.bg}" stroke-width="3"/>`,`translate(${x} ${y}) scale(${s})`)}

// ---------- people and speech ----------
function avatar(x,y,col,s=1){return G(`<circle r="40" fill="${C.panel}" stroke="${col}" stroke-width="4"/><circle cy="-10" r="13" fill="${col}"/><path d="M-24 24 Q0 -6 24 24 Z" fill="${col}"/>`,`translate(${x} ${y}) scale(${s})`)}
// a speech bubble that pops in as k goes 0 -> 1; o.tail 'up' | 'right' | default down-left; o.who: small grey attribution under it
function bubble(x,y,s,k,o={}){if(k<=0)return '';const size=o.size||28,w=o.w||(tw(s,size)*1.05+56),h=size+32,col=o.col||C.teal,tx=o.tx||0;
 const tail=o.tail==='none'?'':o.tail==='up'?`<path d="M${tx-14} ${-h/2+2} l14 -26 l14 26z" fill="${C.panel}" stroke="${col}" stroke-width="2.5"/>`:o.tail==='right'?`<path d="M${w/2-2} ${-8} l26 10 l-26 12z" fill="${C.panel}" stroke="${col}" stroke-width="2.5"/>`:`<path d="M${tx-16} ${h/2-2} l-8 26 l30 -26z" fill="${C.panel}" stroke="${col}" stroke-width="2.5"/>`;
 return G(tail+R(-w/2,-h/2,w,h,{r:h/2,fill:C.panel,stroke:col,sw:2.5})+T(0,size*0.36,s,{size,wt:700,a:'middle'})+(o.who?T(0,h/2+(o.tail?30:52),o.who,{size:20,a:'middle',fill:C.mut,wt:700}):''),`translate(${x} ${y}) scale(${bk(cl(k))})`,cl(k*2))}
// one remark in someone's words, as a quote pill; without text it is a blank pill (for a crowd of them)
function quote(x,y,rot,s=1,o={}){const col=o.col||C.gold,w=o.text?Math.max(240,tw(o.text,26)*1.05+80):220;
 const g=R(-w/2,-30,w,60,{r:30,fill:C.panel,stroke:col,sw:2.5})+T(-w/2+18,14,'“',{size:44,wt:700,fill:col})+(o.text?T(-w/2+50,9,o.text,{size:26,wt:700}):R(-w/2+52,-5,w-90,10,{r:5,fill:C.mut}));
 return G(g,`translate(${x} ${y}) rotate(${rot}) scale(${s})`,o.op??1)}
// a voice recording: waveform bars, coloured by who is speaking via o.sp(i) -> index into o.cols; o.off scrolls it
function wave(x,y,lab,o={}){const n=o.n||34,w=o.w||300,hh=o.h||46,off=o.off||0,fl=Math.floor(off),fr=off-fl,cols=o.cols||[C.teal,C.gold,C.mut];let g='';
 for(let j=0;j<n;j++){const i=j+fl,xx=x+(j-fr)*(w/n);if(xx<x)continue;const h=10+Math.abs(Math.sin(i*0.9+(o.ph||0)*3+rnd(i)*6))*hh*(0.4+rnd(i+40)*0.6);const sp=o.sp?o.sp(i):0;
  g+=R(xx,y-h/2,w/n*0.55,h,{r:3,fill:cols[sp],op:sp===cols.length-1&&o.sp?.35:.85})}
 g+=G(`<circle r="14" fill="${C.teal}"/><rect x="-4.5" y="-8" width="9" height="15" rx="4.5" fill="${C.bg}"/>`,`translate(${x+14} ${y-hh/2-38})`)+T(x+38,y-hh/2-30,lab,{size:o.ls||28,wt:700})+(o.len?T(x+w,y-hh/2-30,o.len,{size:22,fill:C.mut,a:'end'}):'');
 return G(g,'',o.op??1)}
// a person assembling from dots: frac 0..1 of the dots lit, in a fixed random order
const FIGURE_DOTS=(()=>{const pts=[];for(let yy=-120;yy<=110;yy+=13)for(let xx=-104;xx<=104;xx+=13){const head=xx*xx+(yy+62)*(yy+62)<46*46,body=yy>6&&(xx/96)**2+((yy-112)/104)**2<1;if(head||body)pts.push([xx,yy,rnd(xx*7.3+yy*13.1)])}return pts.sort((a,b)=>a[2]-b[2])})();
function dotFigure(x,y,frac,col){const lit=Math.floor(cl(frac)*FIGURE_DOTS.length);return FIGURE_DOTS.map(([dx,dy],i)=>i<lit?`<circle cx="${x+dx}" cy="${y+dy}" r="5.5" fill="${col}"/>`:`<circle cx="${x+dx}" cy="${y+dy}" r="3.5" fill="${C.line}"/>`).join('')}
const dotTarget=(i,of)=>FIGURE_DOTS[Math.min(FIGURE_DOTS.length-1,Math.floor(i/of*FIGURE_DOTS.length))];   // where the i-th of `of` arriving dots lands
function robot(x,y,s=1,col=C.gold){return G(`<rect x="-46" y="-40" width="92" height="76" rx="18" fill="${C.panel}" stroke="${col}" stroke-width="4"/><circle cx="-18" cy="-4" r="9" fill="${col}"/><circle cx="18" cy="-4" r="9" fill="${col}"/><rect x="-16" y="16" width="32" height="6" rx="3" fill="${col}"/><path d="M0 -40 V-58" stroke="${col}" stroke-width="4"/><circle cx="0" cy="-62" r="7" fill="${col}"/>`,`translate(${x} ${y}) scale(${s})`)}

// ---------- the hero object: one document card that travels through every shot ----------
// o.label corner label; o.face: lines of text replacing the bars; o.fig 0..1 grows the three bars; o.stamp: a word stamped on it
function docCard(x,y,s=1,o={}){
 let g=R(-170,-110,340,220,{r:16,fill:C.ink})+R(-144,-86,150,16,{r:4,fill:C.bg})+R(-144,-58,240,9,{r:4,fill:C.mut})+R(-144,-40,190,9,{r:4,fill:C.mut});
 const fig=o.fig??1;[0,1,2].forEach(i=>{g+=R(-144,-6+i*30,[220,170,120][i]*fig,18,{r:5,fill:[C.gold,C.teal,C.green][i]})});
 if(o.face){g+=R(-160,-100,320,200,{r:12,fill:C.ink})+o.face.map((l,i)=>T(0,-14+i*44-(o.face.length-1)*10,l,{size:o.faceSize||30,wt:700,fill:C.bg,a:'middle'})).join('')}
 if(o.label)g+=T(150,96,o.label,{size:20,wt:700,fill:C.bg,a:'end'});
 if(o.stamp)g+=G(R(-80,-26,160,52,{r:10,fill:'none',stroke:C.green,sw:5})+T(0,12,o.stamp,{size:28,wt:700,fill:C.green,a:'middle'}),`translate(70 -30) rotate(-10) scale(${o.stampK??1})`,cl(o.stampK??1));
 return G(g,`translate(${x} ${y}) rotate(${o.rot||0}) scale(${s})`,o.op??1)}

// ---------- one meaning, one shape ----------
// A LIST of requirements or fixes: printed tape with a torn bottom, coming out of a slot. rows [id, text, source].
// o.title, o.count (right of title), o.unroll 0..1, o.rowK(i) 0..1 per row, o.status[i] 'met'|'not met'|'', o.hl[i] highlighter colour,
// o.plain (no quote marks), o.more (a last grey line), o.w, o.rh, o.paper
let TID=0;   // clip ids; setupFilm's render resets it every frame
function tape(x,y,rows,o={}){const w=o.w||640,rh=o.rh||68,hd=66,full=hd+rows.length*rh+(o.more?40:14),hh=full*cl(o.unroll??1),id='tp'+(TID++);
 let zz='';const tz=16;for(let i=0;i<Math.ceil(w/tz);i++)zz+=` L${x+w-(i+0.5)*tz} ${y+hh+8} L${Math.max(x,x+w-(i+1)*tz)} ${y+hh}`;
 let g=`<path d="M${x} ${y} H${x+w} V${y+hh}${zz} Z" fill="${o.paper||C.paper}"/>`+R(x-22,y-14,w+44,22,{r:11,fill:C.line});
 let inn=T(x+24,y+44,o.title||'',{size:28,wt:700,fill:C.dark})+(o.count?T(x+w-22,y+44,o.count,{size:20,fill:C.pmut,a:'end'}):'')+`<path d="M${x+18} ${y+hd-8} H${x+w-18}" stroke="${C.dark}" stroke-width="2" opacity=".45"/>`;
 rows.forEach((r,i)=>{const k=o.rowK?o.rowK(i):1;if(k<=0)return;const yy=y+hd+i*rh,st=(o.status&&o.status[i])||'',hl=o.hl&&o.hl[i],q=(o.plain||o.noq)?r[1]:'“'+r[1]+'”',qx=o.plain?x+92:x+108;
  let rr='';if(hl)rr+=R(qx-8,yy+10,Math.min(w-(qx-x)-12,tw(q,23)*1.04+22),32,{r:4,fill:hl,op:.55});
  rr+=R(x+20,yy+12,26,26,{r:5,fill:'none',stroke:C.dark,sw:2.5});
  if(st==='met')rr+=`<path d="M${x+25} ${yy+25} l6 7 l12 -15" stroke="${C.pgreen}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  if(st==='not met')rr+=`<path d="M${x+26} ${yy+25} h14" stroke="${C.pamb}" stroke-width="4" stroke-linecap="round"/>`;
  rr+=T(x+58,yy+33,r[0],{size:20,wt:700,fill:r[0][0]==='S'?C.pteal:C.pgold})+T(qx,yy+33,q,{size:23,wt:700,fill:C.dark})+(r[2]?T(qx,yy+57,r[2],{size:17,fill:C.pmut}):'');
  if(!o.plain&&(st==='met'||st==='not met'))rr+=T(x+w-22,yy+33,st,{size:18,wt:700,fill:st==='met'?C.pgreen:C.pamb,a:'end'});
  rr+=`<path d="M${x+18} ${yy+rh-3} H${x+w-18}" stroke="${C.dark}" stroke-width="1.5" stroke-dasharray="3 6" opacity=".35"/>`;
  inn+=G(rr,`translate(${L(24,0,k)} 0)`,k)});
 if(o.more)inn+=T(x+24,y+hd+rows.length*rh+28,o.more,{size:19,fill:C.pmut});
 return g+`<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${hh}"/></clipPath><g clip-path="url(#${id})">${inn}</g>`}
// A SCORE: a half dial with a needle. v on a 0..o.max scale (default 5); o.mark draws the pass line (e.g. 4), omit for none.
function gauge(x,y,v,lab,col,o={}){const r=o.r||64,mx=o.max||5,f=cl(v/mx),a=Math.PI+f*Math.PI,pt=(a,rr)=>[(rr*Math.cos(a)).toFixed(1),(rr*Math.sin(a)).toFixed(1)];
 const [ex,ey]=pt(a,r);let g=`<path d="M${-r} 0 A${r} ${r} 0 0 1 ${r} 0" fill="none" stroke="${C.line}" stroke-width="14" stroke-linecap="round"/>`;
 if(f>0.005)g+=`<path d="M${-r} 0 A${r} ${r} 0 0 1 ${ex} ${ey}" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round"/>`;
 if(o.mark!=null){const am=Math.PI*(1+o.mark/mx),[m1x,m1y]=pt(am,r-15),[m2x,m2y]=pt(am,r+15),[lx,ly]=pt(am,r+30);g+=`<path d="M${m1x} ${m1y} L${m2x} ${m2y}" stroke="${C.ink}" stroke-width="3"/>`+T(lx,+ly+6,String(o.mark),{size:16,wt:700,fill:C.mut,a:'middle'})}
 const [nx,ny]=pt(a,r-20);g+=`<path d="M0 0 L${nx} ${ny}" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/><circle r="8" fill="${C.ink}"/>`;
 g+=T(0,38,Math.round(v)+'/'+mx,{size:o.vs||28,wt:700,a:'middle'})+(lab?T(0,66,lab,{size:o.fs||20,wt:700,fill:C.mut,a:'middle'}):'');
 return G(g,`translate(${x} ${y})`,o.op??1)}
// FEEDBACK from a person: a sticky note. No text draws scribble lines (a note in flight, too small to read).
function sticky(x,y,text,o={}){const w=o.w||300,sz=o.size||24,lines=text?wrap(text,o.n||22):[],h=o.h||Math.max(110,40+lines.length*(sz+8)+(o.note?30:0));
 let g=`<path d="M${-w/2} ${-h/2} H${w/2} V${h/2-28} L${w/2-28} ${h/2} H${-w/2} Z" fill="${C.sticky}"/><path d="M${w/2} ${h/2-28} L${w/2-28} ${h/2-28} L${w/2-28} ${h/2} Z" fill="${C.stickyFold}"/>`+R(-34,-h/2-10,68,22,{r:3,fill:'#ffffff',op:.3});
 lines.forEach((l,i)=>g+=T(-w/2+20,-h/2+42+i*(sz+8),l,{size:sz,wt:700,fill:C.dark}));
 if(!text)[0,1].forEach(i=>g+=R(-w/2+20,-h/2+30+i*24,w*0.6-i*30,9,{r:4,fill:C.dark,op:.45}));
 if(o.note)g+=T(-w/2+20,h/2-16,o.note,{size:17,fill:'#6a5520'});
 return G(g,`translate(${x} ${y}) rotate(${o.rot||0}) scale(${o.s||1})`,o.op??1)}
// AN IDEA: a light bulb hanging on a wire of length wl; k 0..1 lights it
function bulb(x,y,k,wl=170,col=C.gold){let g=`<path d="M0 ${-wl} V-34" stroke="${C.mut}" stroke-width="2.5"/>`+R(-12,-42,24,16,{r:3,fill:C.mut});
 if(k>0)g+=`<circle cy="6" r="${44+k*26}" fill="${col}" opacity="${0.14*k}"/>`+[0,1,2,3,4].map(i=>{const a=Math.PI*(0.1+i*0.2),c=Math.cos(a),s=Math.sin(a);return `<path d="M${(c*44).toFixed(1)} ${(6+s*44).toFixed(1)} L${(c*(44+20*k)).toFixed(1)} ${(6+s*(44+20*k)).toFixed(1)}" stroke="${col}" stroke-width="4" stroke-linecap="round" opacity="${k}"/>`}).join('');
 g+=`<circle cy="6" r="30" fill="${k>0.5?col:C.panel}" stroke="${col}" stroke-width="3"/><path d="M-9 10 l6 -10 l6 10 l6 -10" stroke="${k>0.5?C.bg:col}" stroke-width="3" fill="none"/>`;return G(g,`translate(${x} ${y})`)}
// INSPECTION by someone else: a magnifying glass
const lens=(x,y,s=1)=>G(`<circle r="58" fill="${C.teal}" fill-opacity=".12" stroke="${C.ink}" stroke-width="8"/><path d="M42 42 L96 96" stroke="${C.ink}" stroke-width="16" stroke-linecap="round"/>`,`translate(${x} ${y}) scale(${s})`);
// TWO RESULTS COMPARED: a balance; tilt in degrees (positive = left pan down); o.rk fades the right pan in
function balance(x,y,tilt,left,right,o={}){const a=tilt*Math.PI/180,c=Math.cos(a),s=Math.sin(a),hl=o.half||320;
 const E=[[x-hl*c,y+hl*s],[x+hl*c,y-hl*s]];let g=`<path d="M${x} ${y} L${x} ${y+130}" stroke="${C.mut}" stroke-width="8"/><path d="M${x-70} ${y+140} H${x+70}" stroke="${C.mut}" stroke-width="8" stroke-linecap="round"/>`;
 g+=`<path d="M${E[0][0]} ${E[0][1]} L${E[1][0]} ${E[1][1]}" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="12" fill="${C.gold}"/>`;
 [left,right].forEach((t,i)=>{if(!t)return;const [ex,ey]=E[i],op=i?(o.rk??1):1;g+=G(`<path d="M${ex} ${ey} L${ex-120} ${ey+64} M${ex} ${ey} L${ex+120} ${ey+64}" stroke="${C.mut}" stroke-width="2.5"/><path d="M${ex-130} ${ey+64} Q${ex} ${ey+104} ${ex+130} ${ey+64} Z" fill="${C.teal}" opacity=".85"/>`+T(ex,ey+54,t,{size:t.length>10?26:30,wt:700,a:'middle'}),'',op)});
 return g}
// A CONDITION that must hold: a signal lamp on a post, red until on > 0.5
function lamp(x,y,on){const col=on>0.5?C.green:C.red;return `<path d="M${x} ${y+40} V${y+120}" stroke="${C.line}" stroke-width="10"/><circle cx="${x}" cy="${y}" r="46" fill="${C.panel}" stroke="${C.line}" stroke-width="5"/>`+(on>0.5?`<circle cx="${x}" cy="${y}" r="70" fill="${C.green}" opacity="${0.18*on}"/>`:'')+`<circle cx="${x}" cy="${y}" r="30" fill="${col}" opacity="${on>0.5?1:.55}"/>`}
// A PROCESS THAT REPEATS: a ring track with N stations. stations [[n, name, col], ...]; o.drop 0..1 drops them on; o.active highlights one
const stPos=(cx,cy,r,i,n)=>{const a=-Math.PI/2+i*2*Math.PI/n;return [cx+r*Math.cos(a),cy+r*Math.sin(a),a]};
const onTrack=(cx,cy,r,f)=>{const a=-Math.PI/2+f*2*Math.PI;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]};
function track(cx,cy,r,stations,o={}){const drop=o.drop??1,n=stations.length;let g=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.line}" stroke-width="${o.sw||46}" opacity="${o.op??1}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.mut}" stroke-width="3" stroke-dasharray="18 22" stroke-dashoffset="${o.dash||0}" opacity="${(o.op??1)*.5}"/>`;
 stations.forEach(([num,name,col],i)=>{const k=bk(cl(drop*n-i));if(k<=0)return;const [x,y,a]=stPos(cx,cy,r,i,n);const act=o.active===i,sr=o.sr||40,lr=o.lr||92,lx=Math.cos(a)*lr,ly=Math.sin(a)*lr+10;
  const anc=Math.abs(Math.cos(a))<0.3?'middle':(Math.cos(a)>0?'start':'end');
  g+=G(`<circle r="${sr}" fill="${act?col:C.panel}" stroke="${col}" stroke-width="4"/>`+T(0,sr*0.34,num,{size:sr*0.9,wt:700,fill:act?C.bg:col,a:'middle'})+(o.labels===false?'':T(lx,ly+(Math.sin(a)<-0.9?-18:0),name,{size:o.ls||28,wt:700,a:anc,fill:act?C.ink:C.mut})),`translate(${x} ${y-(1-k)*200}) scale(${0.6+0.4*k})`,cl(k*3))});
 return g}

// ---------- overlay: things that must NOT move with the camera (caption, where-am-I map) ----------
let OVER='',CAP='';
// small map, top right: which station of the repeating process this shot is about
function mini(stations,active,k=1){const cx=1790,cy=96,r=42,n=stations.length;let g=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.line}" stroke-width="8"/>`;
 stations.forEach(([num,name,col],i)=>{const [x,y]=stPos(cx,cy,r,i,n);g+=`<circle cx="${x}" cy="${y}" r="${i===active?12:7}" fill="${i===active?col:C.mut}" opacity="${i===active?1:.6}"/>`});
 const [num,name,col]=stations[active];g+=T(cx-r-26,cy+10,num+'  '+name,{size:28,wt:700,fill:col,a:'end'});OVER+=G(g,`translate(0 ${L(-30,0,k)})`,k);return ''}
// the caption: wipes in at shot time t0; one per shot
function cap(text,u,t0=0.4,size=50){CAP=text;const k=eo(p(u,t0,t0+0.5));if(k<=0)return '';const w=tw(text,size)*1.08+60;
 OVER+=`<defs><clipPath id="cc"><rect x="100" y="950" width="${w*k+30}" height="100"/></clipPath></defs>`+`<rect x="112" y="986" width="26" height="26" rx="4" fill="${C.gold}" transform="rotate(${(1-k)*90} 125 999)"/>`+`<g clip-path="url(#cc)">${T(164,1012,text,{size,wt:700,fill:C.cap})}</g>`;return ''}

// ---------- the film: shots, durations per cut, one render(t) ----------
// setupFilm({durs:[...], header:'...', tags:[...] (optional small line under the header, per shot), stage:{y:130,h:800,scale:1.1,cy:540},
//            accents:[...] (optional, per shot: when the shot's key thing lands, a quick push that settles; see renderFrame)})
// The stage is the band between header and caption; the picture is clipped to it, so a camera push never covers either.
// shot(fn): fn(u) returns the picture's SVG for shot-local time u (seconds) and calls cap()/mini() for the overlay.
const SH=[];let FILM={durs:[],header:'',tags:null,stage:{y:130,h:800,scale:1.1,cy:540}},_t=0,DUR=0;
function setupFilm(o){FILM=Object.assign(FILM,o);SH.length=0;_t=0}
function shot(fn){const d=FILM.durs[SH.length];if(d==null)throw new Error('setupFilm durs has no entry for shot '+(SH.length+1));SH.push({a:_t,b:_t+d,fn});_t+=d;DUR=_t}
function renderFrame(t){TID=0;t=((t%DUR)+DUR)%DUR;const i=Math.max(0,SH.findIndex(s=>t>=s.a&&t<s.b)),sh=SH[i],u=t-sh.a;
 OVER='';CAP='';const pic=sh.fn(u);const st=FILM.stage;
 // accents[i] = t0, or [t0, amount, sx, sy], or a list of those: a quick push (0.22 s) that settles back (0.7 s) at u=t0,
 // about the point (sx, sy) in SCREEN pixels as read off a still (default: stage centre; amount default .3). Aim it at the
 // thing that just arrived: a push about the centre shoves edge labels off screen. Framing at rest is unchanged, so the
 // per-shot sheet is too. Use it where a long hold would otherwise feel frozen.
 let pk=pic;const acs=FILM.accents&&FILM.accents[i];
 for(const ac of acs==null?[]:Array.isArray(acs)&&Array.isArray(acs[0])?acs:[acs]){
  const [t0,amt0,sx,sy]=[].concat(ac),amt=amt0??.3,scy=st.cy??(st.y+st.h/2),fx=sx==null?CX:CX+(sx-CX)/st.scale,
   fy=sy==null?CY:CY+(sy-scy)/st.scale,q=u-t0,k=q<0?0:q<.22?1-(1-q/.22)**3:q<.92?1-eio((q-.22)/.7):0;
  if(k>0)pk=`<g transform="translate(${fx} ${fy}) scale(${1+amt*k}) translate(${-fx} ${-fy})">${pk}</g>`}
 const tag=FILM.tags&&FILM.tags[i]?T(110,124,FILM.tags[i],{size:20,wt:700,fill:C.mut}):'';
 const svg=`<rect width="${W}" height="${H}" fill="${C.bg}"/><defs><radialGradient id="g1" cx=".82" cy=".1" r=".6"><stop offset="0" stop-color="${C.teal}" stop-opacity=".10"/><stop offset="1" stop-color="${C.teal}" stop-opacity="0"/></radialGradient><radialGradient id="g2" cx=".1" cy=".9" r=".5"><stop offset="0" stop-color="${C.gold}" stop-opacity=".08"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></radialGradient><clipPath id="stg"><rect x="0" y="${st.y}" width="${W}" height="${st.h}"/></clipPath></defs><rect width="${W}" height="${H}" fill="url(#g1)"/><rect width="${W}" height="${H}" fill="url(#g2)"/>`
  +(FILM.header?T(110,96,FILM.header,{size:30,wt:700,fill:C.gold}):'')+tag
  +`<g clip-path="url(#stg)"><g transform="translate(${CX} ${st.cy??(st.y+st.h/2)}) scale(${st.scale}) translate(${-CX} ${-CY})">`+pk+`</g></g>`+OVER;
 if(typeof document!=='undefined'){const el=document.getElementById('v');if(el)el.innerHTML=svg}
 return {svg,pic,over:OVER,cap:CAP,shot:i}}
if(typeof window!=='undefined')window.render=t=>{renderFrame(t)};   // render.py calls render(t) and reads DUR
