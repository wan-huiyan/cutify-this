# Embeds 3 styles x 3 films into a stacked-slide HTML deck, idempotently. Configure first: the STYLES and WAYS
# labels below, and the anchor ids (#s4 = the slide to insert after, d-w1..3 = each option's detail dialog) for your deck.
# Usage: python3 -I embed_anims.py <deck.html> <dirs-root>   (expects <root>/{A,B,C}/final/way{1,2,3}.html)
# Adds (once): CSS, the "See each option work" slide after #s4, "Watch it work" links in d-w1..d-w3,
# the loader/switcher/input-forwarding JS. Re-running replaces only the data block between the ANIM markers.
import sys, re, pathlib
deck, root = sys.argv[1], pathlib.Path(sys.argv[2])
s = open(deck, encoding='utf-8').read()

STYLES = [('C', 'Live'), ('A', 'Diagram clip'), ('B', 'Whiteboard')]
WAYS = [(1, '1 · Option one'), (2, '2 · Option two'), (3, '3 · Option three')]  # your films' short labels

def esc(t):  # keep the HTML intact inside <script type="text/plain">
    return t.replace('</script', '<\\/script').replace('</SCRIPT', '<\\/SCRIPT').replace('<!--', '<\\!--')

blocks = []
for L, _ in STYLES:
    for n, _ in WAYS:
        f = root / L / 'final' / f'way{n}.html'
        if not f.exists():
            sys.exit(f'missing {f}')
        t = f.read_text(encoding='utf-8')
        if '<\\/script' in t.lower() or '<\\!--' in t: sys.exit(f'{f} already contains an escaped marker; the decode would break it')
        blocks.append(f'<script type="text/plain" id="anim-{L}-{n}">{esc(t)}</script>')
data = '<!--ANIM-DATA-START-->\n' + '\n'.join(blocks) + '\n<!--ANIM-DATA-END-->'

if '<!--ANIM-DATA-START-->' in s:
    s = re.sub(r'<!--ANIM-DATA-START-->.*?<!--ANIM-DATA-END-->', lambda m: data, s, flags=re.S)
else:
    css = '''
.howwrap{max-width:1180px;margin:auto;width:100%}
.howhead{text-align:center;margin-bottom:8px}
.howhead h2{margin-bottom:4px}
.segrow{display:flex;flex-wrap:wrap;justify-content:center;gap:0 10px}
#s-how h2{font-size:clamp(1.7rem,3.4vw,2.6rem)}
@media (min-width:900px) and (max-height:920px){#s-how .say{display:none}}
@media (max-width:899px){#s-how .say{display:none}#s-how h2{font-size:1.5rem;margin:0 0 6px}#s-how .seg{margin-bottom:6px}}
.howbox iframe{margin:0 auto}
.seg{display:inline-flex;flex-wrap:wrap;justify-content:center;gap:6px;padding:5px;border-radius:999px;background:var(--panel);box-shadow:inset 0 0 0 1px var(--line);margin:0 4px 10px}
.seg button{border:0;border-radius:999px;padding:9px 16px;font:600 .95rem "Outfit",sans-serif;color:var(--muted);background:transparent;cursor:pointer}
.seg button[aria-pressed="true"]{background:var(--gold);color:#1a1405}
.seg.style button[aria-pressed="true"]{background:var(--teal);color:#06181b}
.seglabel{font-size:.8rem;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-right:6px}
.howbox{border-radius:20px;overflow:hidden;background:#121826;box-shadow:0 0 0 1px var(--line);margin:6px auto 0}
.howbox iframe{display:block;width:100%;height:62vh;border:0;background:#121826}
@media (max-width:520px){.seg button{padding:8px 11px;font-size:.85rem}.seglabel{display:none}}
'''
    s = s.replace('</style>', css + '</style>', 1)
    way_btns = ''.join(f'<button type="button" data-how-way="{n}" aria-pressed="{str(n==1).lower()}">{t}</button>' for n, t in WAYS)
    sty_btns = ''.join(f'<button type="button" data-how-style="{L}" aria-pressed="{str(L=="C").lower()}">{t}</button>' for L, t in STYLES)
    slide = f'''
<!-- See each option work -->
<section class="slide" id="s-how">
  <div class="howwrap">
    <div class="howhead">
      <h2>See each option work</h2>
      <p class="say" style="margin:0 auto 14px">Pick an option, then a style. Captions explain each step; tap a step to jump to it.</p>
      <div class="segrow"><div><span class="seglabel">Option</span><div class="seg way" role="group" aria-label="Option">{way_btns}</div></div>
      <div><span class="seglabel">Style</span><div class="seg style" role="group" aria-label="Style">{sty_btns}</div></div></div>
    </div>
    <div class="howbox"><iframe id="howFrame" title="How the selected way works (animation)"></iframe></div>
  </div>
</section>
'''
    i = s.find('<section class="slide" id="s4">'); j = s.find('</section>', i) + len('</section>')
    assert i > 0
    s = s[:j] + '\n' + slide + s[j:]
    # "Watch it work" link inside each Way panel
    for n in (1, 2, 3):
        m = re.search(r'(<dialog id="d-w%d">.*?<div class="dbody">)' % n, s, re.S)
        assert m, n
        s = s.replace(m.group(1), m.group(1) + f'\n    <p><a class="btn main" href="#s-how" data-watch-way="{n}">Watch it work</a></p>', 1)
    # deck JS hooks: refactor input handling so the iframe can forward gestures
    js = r'''
  /* ---- "See each option work": one animation iframe at a time, built on demand ---- */
  var how={way:1,style:'C',frame:document.getElementById('howFrame'),loaded:''};
  function howKey(){return how.style+'-'+how.way;}
  function howPost(t){try{how.frame.contentWindow.postMessage({type:t},'*');}catch(e){}}
  function howLoad(){
    var k=howKey(); if(how.loaded===k)return;
    var src=document.getElementById('anim-'+k); if(!src)return;
    var html=src.textContent.replace(/<\\\/script/gi,'</script').replace(/<\\!--/g,'<!--');
    how.loaded=k; how.frame.style.height='62vh'; how.frame.srcdoc=html;
  }
  how.frame.addEventListener('load',function(){ howFit(); if(slides[cur]&&slides[cur].id==='s-how')howPost('anim-play'); });
  /* desktop: make animation + caption fit one screen. Prefer a narrower inner layout (captions keep their size);
     zoom only if even the narrowest allowed layout is too tall. Each width is measured after the animation's own
     resize code has run (its layout can be set in JS), so this is async. Phones (< 900 px) scroll instead. */
  function howWait(ms){return new Promise(function(r){setTimeout(r,ms);});}
  async function howFit(){
    var f=how.frame,sl=document.getElementById('s-how'),tok=++how.tok;
    if(window.innerWidth<900){f.style.zoom='';f.style.width='';f.style.visibility='';how.fitting=false;return;}
    var d; try{d=f.contentDocument;}catch(e){} if(!d||!d.body)return;
    how.fitting=true; f.style.visibility='hidden'; f.style.zoom=''; f.style.width=''; f.style.height='2400px';
    await howWait(40); if(tok!==how.tok)return;
    var box=f.parentNode.clientWidth,top=f.getBoundingClientRect().top-sl.getBoundingClientRect().top+sl.scrollTop;
    var avail=sl.clientHeight-top-14,minW=Math.min(box,740);
    async function hAt(w){f.style.width=w+'px';await howWait(90);return Math.ceil(d.body.getBoundingClientRect().height);}
    var best=box,bh=await hAt(box);
    if(bh>avail){
      var lo=minW,hi=box,hl=await hAt(lo); best=lo; bh=hl;
      if(hl<=avail){ while(hi-lo>20){ var mid=Math.round((lo+hi)/2),hm=await hAt(mid); if(tok!==how.tok)return;
        if(hm<=avail){lo=mid;best=mid;bh=hm;}else hi=mid; } }
    }
    if(tok!==how.tok)return;
    bh=await hAt(best); if(tok!==how.tok)return;
    f.style.zoom=bh>avail?String(Math.max(0.6,avail/bh)):'';
    f.style.height=bh+'px'; f.style.visibility=''; how.fitting=false;
  }
  how.tok=0;
  window.addEventListener('resize',function(){clearTimeout(how.rt);how.rt=setTimeout(howFit,150);});
  function howSet(kind,val){
    how[kind]=val;
    document.querySelectorAll(kind==='way'?'[data-how-way]':'[data-how-style]').forEach(function(b){
      b.setAttribute('aria-pressed',String(b.getAttribute(kind==='way'?'data-how-way':'data-how-style')===String(val)));});
    if(slides[cur]&&slides[cur].id==='s-how')howLoad(); else how.loaded='';
  }
  document.addEventListener('deck:slide',function(e){
    if(e.detail==='s-how'){ if(how.loaded!==howKey())howLoad(); else howPost('anim-play'); }
    else howPost('anim-pause');
  });
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-how-way]'); if(b){howSet('way',+b.getAttribute('data-how-way'));return;}
    b=e.target.closest('[data-how-style]'); if(b){howSet('style',b.getAttribute('data-how-style'));return;}
    b=e.target.closest('[data-watch-way]'); if(b){howSet('way',+b.getAttribute('data-watch-way')); var od=document.querySelector('dialog[open]'); if(od)od.close();}
  },true);
  window.addEventListener('message',function(e){
    if(!how.frame||e.source!==how.frame.contentWindow||!e.data)return;
    var m=e.data;
    if(m.type==='anim-height'&&m.h>80){if(window.innerWidth<900)how.frame.style.height=Math.ceil(m.h)+'px';else if(!how.fitting){try{how.frame.style.height=Math.ceil(how.frame.contentDocument.body.getBoundingClientRect().height)+'px';}catch(x){}}return;}
    if(m.type==='deck-wheel'){onWheel(m.dy,m.mode);return;}
    if(m.type==='deck-key'){onKey(m.key);return;}
    if(m.type==='deck-swipe'){onSwipe(m.dy,m.dx);return;}
  });
'''
    # 1) go(): announce slide changes
    a = 'busyUntil=performance.now()+650;\n    animateIn(s);'
    assert s.count(a) == 1
    s = s.replace(a, a + "\n    document.dispatchEvent(new CustomEvent('deck:slide',{detail:s.id}));")
    # 2) wheel body -> onWheel(dy,mode)
    old_wheel = re.search(r"  window\.addEventListener\('wheel',function\(e\)\{\n    if\(dialogOpen\(\)\)return;\n    e\.preventDefault\(\);\n(.*?)\n  \},\{passive:false\}\);", s, re.S)
    assert old_wheel
    body = old_wheel.group(1)
    assert 'var dy=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?window.innerHeight:1);' in body
    body2 = body.replace('var dy=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?window.innerHeight:1);', 'dy=dy*(mode===1?16:mode===2?window.innerHeight:1);')
    new_wheel = ("  function onWheel(dy,mode){\n    if(dialogOpen())return;\n" + body2 + "\n  }\n"
                 "  window.addEventListener('wheel',function(e){\n    if(dialogOpen())return;\n    e.preventDefault();\n    onWheel(e.deltaY,e.deltaMode);\n  },{passive:false});\n"
                 "  function onSwipe(dy,dx){\n    if(dialogOpen()||Math.abs(dy)<50||Math.abs(dy)<Math.abs(dx))return;\n    var s=slides[cur],dir=dy>0?1:-1;\n    if(room(s,dir)){s.scrollBy({top:dy*1.5,behavior:'smooth'});return;}\n    go(cur+dir);\n  }")
    s = s.replace(old_wheel.group(0), new_wheel)
    # 3) keydown body -> onKey(key)
    old_key = re.search(r"  document\.addEventListener\('keydown',function\(e\)\{\n    if\(dialogOpen\(\)\)return;\n(.*?)\n  \}\);\n  /\* links", s, re.S)
    assert old_key
    kb = old_key.group(1).replace('e.preventDefault();', '').replace('e.key', 'key')
    new_key = ("  function onKey(key){\n    if(dialogOpen())return false;\n" + kb.replace('return;', 'return true;') +
               "\n    return ['ArrowDown','PageDown','ArrowRight',' ','ArrowUp','PageUp','ArrowLeft','Home','End'].indexOf(key)>-1;\n  }\n"
               "  document.addEventListener('keydown',function(e){\n    if(e.target.closest&&e.target.closest('.seg')&&(e.key===' '||e.key==='Enter'))return;\n    if(onKey(e.key))e.preventDefault();\n  });\n  /* links")
    s = s.replace(old_key.group(0), new_key)
    # 4) append the how-block before the closing of the IIFE
    end = "  window.addEventListener('hashchange'"
    assert s.count(end) == 1
    s = s.replace(end, js + end)
    s = s.replace('</body>', data + '\n</body>', 1)

open(deck, 'w', encoding='utf-8').write(s)
print('ok', len(s) // 1024, 'KB')
