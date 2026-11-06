/* pizza: how an order travels from the app to the kitchen to the door. Beats are 0-based here (B[0] = beat 1); data-b in the SVG is 1-based. */
FR={
  phone:  {w:[260,450,420,560],  t:[260,450,300,520]},
  kitchen:{w:[860,430,520,480],  t:[860,440,460,470]},
  pickup: {w:[1050,510,620,460], t:[1060,520,480,480]},
  map:    {w:[850,460,1480,640], t:[300,450,320,520]},
  door:   {w:[1430,530,540,460], t:[1400,530,460,500]},
  all:    {w:[840,450,1540,660], t:[1250,520,760,560]}
};
ORDER=["phone","kitchen","pickup","map","door","all"];

/* beat 1: Sam taps Order */
tl.fromTo("#btn",{scale:1,transformOrigin:"50% 50%"},{scale:.92,duration:.18,yoyo:true,repeat:1,ease:"sine.inOut"},T(0,1.4));
tl.fromTo("#tap",{opacity:0,scale:.6,transformOrigin:"50% 50%"},{opacity:.9,scale:1.25,duration:.5,ease:"sine.out"},T(0,1.3));
tl.to("#tap",{opacity:0,duration:.4},T(0,1.8));
R("#sent",0,3.0,{scale:.8});

/* beat 2: the order flies to the kitchen and prints as a ticket; the pizza goes in the oven */
camTo(1,1,0);
tl.fromTo("#tok",{opacity:0,x:0,y:0},{opacity:1,duration:.3},T(1,.2));
tl.to("#tok",{x:530,y:-120,duration:1.6,ease:"sine.inOut"},T(1,.4));
tl.to("#tok",{opacity:0,duration:.3},T(1,2.3));
R("#ticket",1,3.0,{y:-18});
tl.to("#pz",{x:55,y:126,duration:1.2,ease:"sine.inOut"},T(1,4.6));
tl.fromTo("#glow",{opacity:0},{opacity:.6,duration:.8,ease:"sine.inOut"},T(1,5.6));

/* beat 3: timer ends, the box goes on the shelf, the driver takes it */
camTo(2,2,0);
tl.to("#glow",{opacity:0,duration:.6},T(2,.4));
tl.to("#pz",{x:260,y:120,duration:1.2,ease:"sine.inOut"},T(2,.8));
tl.to("#pz",{opacity:0,duration:.3},T(2,2.0));
tl.to("#box",{opacity:1,duration:.3},T(2,2.0));
R("#ready",2,3.0);
tl.to("#box",{x:94,y:131,duration:1.3,ease:"sine.inOut"},T(2,5.6));
tl.set("#box",{opacity:0},T(2,6.95));
tl.set("#rackbox",{opacity:1},T(2,6.95));

/* beat 4: the app follows the driver on a map */
camTo(3,3,0);
tl.to("#ready",{opacity:0,duration:.4},T(3,.2));
tl.to("#scr-home",{opacity:0,duration:.6},T(3,.4));
tl.to("#scr-map",{opacity:1,duration:.6},T(3,.4));
tl.to("#scoot",{x:170,duration:6.5,ease:"sine.inOut"},T(3,1.0));
tl.to("#mdot",{keyframes:[{x:40,y:-60},{x:110,y:-60},{x:144,y:-170}],duration:6.5,ease:"none"},T(3,1.0));
R("#eta",3,3.0);

/* beat 5: the box reaches the door; pull back to the whole trip (on narrow screens only to the road and the house, so the words stay readable) */
camTo(4,4,0,2.0);
tl.set("#rackbox",{opacity:0},T(4,1.0));
tl.set("#doorbox",{opacity:1},T(4,1.0));
tl.fromTo("#doorbox",{x:-225,y:-11},{x:0,y:0,duration:1.2,ease:"sine.inOut"},T(4,1.0));
R("#done",4,3.0,{y:12});
camTo(5,4,5.6,2.0);
