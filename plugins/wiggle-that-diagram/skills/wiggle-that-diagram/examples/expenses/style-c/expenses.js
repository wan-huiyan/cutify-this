/* expenses: how a claim gets checked. Beats are 0-based here (B[0] = beat 1); data-b in the SVG is 1-based.
   R() only for words (>= 2.5 s into a beat); shapes and movement use plain tl tweens at T(beat, offset). */
FR={
  phone:  {w:[455,445,840,580],  t:[455,445,840,580]},
  policy: {w:[700,405,640,640],  t:[700,405,640,640]},
  verdict:{w:[830,505,860,460],  t:[830,505,840,460]},
  mgr:    {w:[1200,380,760,420], t:[1300,330,560,420]},
  report: {w:[1300,610,700,420], t:[1400,600,400,460]},
  all:    {w:[815,450,1620,820], t:[465,445,870,600]}
};
ORDER=["phone","policy","verdict","mgr","report","all"];
var pop={scale:.4,transformOrigin:"50% 50%"};

/* beat 1: three snaps, the receipts fly into cards, the app reads each amount */
[0.5,0.9,1.3].forEach(function(t){tl.fromTo("#flash",{opacity:0},{opacity:.85,duration:.08,yoyo:true,repeat:1,ease:"none"},T(0,t))});
[["#fly1",348,-106],["#fly2",296,44],["#fly3",244,194]].forEach(function(f,i){
  tl.to(f[0],{opacity:1,duration:.15},T(0,1.6+i*.2));
  tl.to(f[0],{x:f[1],y:f[2],duration:1.0,ease:"sine.inOut"},T(0,1.6+i*.2));
  tl.to(f[0],{opacity:0,duration:.3},T(0,2.7+i*.2));
  tl.to("#c"+(i+1),{opacity:1,duration:.4},T(0,2.5+i*.2));
});
R("#cards-t",0,3.0);

/* beat 2: the written policy, and its three checks wired to every card */
camTo(1,1,0);
tl.to("#policy",{opacity:1,duration:.6},T(1,.3));
R("#policy-t",1,2.5);
["#rule1","#rule2","#rule3"].forEach(function(s,i){tl.set(s,{opacity:1},T(1,3.2+i*.3));draw(s,1,3.2+i*.3,.7)});

/* beat 3: a colour and a reason for each receipt */
camTo(2,2,0);
tl.fromTo("#d1",{opacity:0,scale:.4,transformOrigin:"50% 50%"},{opacity:1,scale:1,duration:.4,ease:"back.out(2)"},T(2,1.4));
R("#r1",2,2.5,{x:-12});
tl.fromTo("#d2",{opacity:0,scale:.4,transformOrigin:"50% 50%"},{opacity:1,scale:1,duration:.4,ease:"back.out(2)"},T(2,4.0));
R("#r2",2,5.0,{x:-12});
tl.fromTo("#d3",{opacity:0,scale:.4,transformOrigin:"50% 50%"},{opacity:1,scale:1,duration:.4,ease:"back.out(2)"},T(2,6.5));
R("#r3",2,7.5,{x:-12});
tl.set("#back3",{opacity:1},T(2,8.3));draw("#back3",2,8.3,.9);

/* beat 4: the amber dinner goes to the manager */
camTo(3,3,0);
tl.set("#to-mgr",{opacity:1},T(3,.4));draw("#to-mgr",3,.4,1.0);
tl.to("#mgr",{opacity:1,duration:.5},T(3,1.0));
R("#mgr-ok",3,2.5,{scale:.85});

/* beat 5: approved lines fill the report */
camTo(4,4,0);
tl.to("#rep",{opacity:1,duration:.5},T(4,.3));
tl.set("#to-rep",{opacity:1},T(4,.3));draw("#to-rep",4,.3,.8);
tl.fromTo("#row1",{opacity:0,x:-40},{opacity:1,x:0,duration:.5,ease:"sine.out"},T(4,1.0));
tl.fromTo("#row2",{opacity:0,x:-40},{opacity:1,x:0,duration:.5,ease:"sine.out"},T(4,1.5));
R("#total",4,2.5);

/* beat 6: pull back; the money travels back to Ana's phone */
camTo(5,5,0,2.0);
tl.to("#coin",{opacity:1,duration:.3},T(5,.6));
tl.to("#coin",{x:-1220,y:-180,duration:1.5,ease:"sine.inOut"},T(5,.8));
tl.to("#coin",{opacity:0,duration:.25},T(5,2.3));
tl.to("#ph-cam",{opacity:.25,duration:.4},T(5,2.2));
tl.fromTo("#ph-paid",{opacity:0,scale:.5,transformOrigin:"50% 50%"},{opacity:1,scale:1,duration:.45,ease:"back.out(2)"},T(5,2.3));
R("#paid",5,2.5);
