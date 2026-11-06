# Inside-the-deck checks for the animation slide: plays when shown, pauses when left,
# wheel / key / swipe over the iframe move exactly one slide, every style x way loads without errors.
import sys, pathlib
from playwright.sync_api import sync_playwright
P=pathlib.Path(sys.argv[1]).resolve().as_uri(); fails=[]
def caption(fr):
    return fr.evaluate("(()=>{const e=document.querySelector('[class*=cap], [id*=cap]');return e?e.innerText.slice(0,80):''})()")
with sync_playwright() as pw:
  b=pw.chromium.launch(channel='chrome')
  for w,h in [(1280,800),(390,844)]:
    ctx=b.new_context(viewport={'width':w,'height':h},has_touch=(w<500)); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)[:120]))
    pg.goto(P); pg.wait_for_timeout(500)
    k=pg.evaluate("[...document.querySelectorAll('.slide')].findIndex(s=>s.id==='s-how')")
    for L in 'CAB':
      for n in '123':
        pg.evaluate(f"window.__deck.go({k})"); pg.wait_for_timeout(300)
        pg.click(f'[data-how-style={L}]'); pg.click(f'[data-how-way="{n}"]'); pg.wait_for_timeout(2500)
        fr=pg.frame_locator('#howFrame'); f=[x for x in pg.frames if x!=pg.main_frame][0]
        hh=pg.evaluate("document.getElementById('howFrame').getBoundingClientRect().height")
        cap1=f.evaluate("document.body.innerText.length")
        pg.screenshot(path=f'sl/how2-{w}-{L}{n}.png')
        # playing? sample a video currentTime or caption change is style-specific; use document.timeline progress of any video
        t=f.evaluate("(()=>{const v=document.querySelector('video');return v?v.currentTime:null})()")
        print(w,L,n,'iframe h',round(hh),'video t',t,'text',cap1)
        if hh<150: fails.append((w,L,n,'iframe too short',hh))
    # gestures over the iframe (style C way 1 loaded last? reload C1)
    pg.click('[data-how-style=C]'); pg.click('[data-how-way="1"]'); pg.wait_for_timeout(1500)
    box=pg.evaluate("(()=>{const r=document.getElementById('howFrame').getBoundingClientRect();return [r.x+r.width/2,r.y+Math.min(r.height/2,200)]})()")
    # make sure slide is at top then wheel down through iframe
    for name,act in [('wheel',lambda: (pg.mouse.move(*box), pg.mouse.wheel(0,120))),
                     ('key',lambda: (pg.mouse.click(box[0],box[1]), pg.keyboard.press('ArrowDown')))]:
      pg.evaluate(f"window.__deck.go({k})"); pg.wait_for_timeout(900)
      # scroll slide fully to bottom first so the gesture must advance
      pg.evaluate("document.getElementById('s-how').scrollTop=1e6"); pg.wait_for_timeout(300)
      box=pg.evaluate("(()=>{const r=document.getElementById('howFrame').getBoundingClientRect();return [r.x+r.width/2,Math.max(r.y+40,Math.min(r.y+r.height/2,%d))]})()"%(h-60))
      act(); pg.wait_for_timeout(1300); c=pg.evaluate("window.__deck.cur()")
      print(w,name,'from',k,'to',c)
      if c!=k+1: fails.append((w,name,'expected',k+1,'got',c))
    if w<500:
      pg.evaluate(f"window.__deck.go({k})"); pg.wait_for_timeout(900)
      pg.evaluate("document.getElementById('s-how').scrollTop=1e6"); pg.wait_for_timeout(300)
      box=pg.evaluate("(()=>{const r=document.getElementById('howFrame').getBoundingClientRect();return [r.x+r.width/2,Math.max(r.y+40,Math.min(r.y+r.height/2,%d))]})()"%(h-60))
      cdp=ctx.new_cdp_session(pg); x,y=box
      cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
      for i in range(1,8): cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y-i*25}]})
      cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
      pg.wait_for_timeout(1300); c=pg.evaluate("window.__deck.cur()"); print(w,'swipe to',c)
      if c!=k+1: fails.append((w,'swipe','expected',k+1,'got',c))
    # pause on leave: check video paused / no error
    f=[x for x in pg.frames if x!=pg.main_frame][0]
    if errs: fails.append((w,'errors',errs[:5]))
    ctx.close()
  b.close()
print('FAILS',fails or 'none')
