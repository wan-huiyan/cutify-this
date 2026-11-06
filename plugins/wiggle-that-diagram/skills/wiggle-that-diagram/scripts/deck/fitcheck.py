# For every style x way at laptop and phone sizes: frame top/bottom, whether animation+caption end on screen, inner width, zoom, caption px as rendered.
import sys, pathlib, json
from playwright.sync_api import sync_playwright
P=pathlib.Path(sys.argv[1]).resolve().as_uri(); bad=[]
with sync_playwright() as pw:
  b=pw.chromium.launch(channel='chrome')
  for w,h in [(1280,800),(1440,900),(1920,1080),(390,844)]:
    pg=b.new_page(viewport={'width':w,'height':h}); pg.goto(P); pg.wait_for_timeout(400)
    k=pg.evaluate("[...document.querySelectorAll('.slide')].findIndex(s=>s.id==='s-how')")
    pg.evaluate(f"window.__deck.go({k})")
    for L in 'CAB':
      for n in '123':
        pg.click(f'[data-how-style={L}]'); pg.click(f'[data-how-way="{n}"]'); pg.wait_for_timeout(2600)
        r=pg.evaluate("""(()=>{const f=document.getElementById('howFrame'),r=f.getBoundingClientRect(),d=f.contentDocument,z=parseFloat(f.style.zoom)||1;
          let cs=[...d.querySelectorAll('p,div,span')].filter(e=>e.offsetParent&&e.innerText&&e.innerText.split(' ').length>8&&!e.children.length).map(e=>parseFloat(getComputedStyle(e).fontSize));
          return {top:Math.round(r.top),bottom:Math.round(r.bottom),w:f.style.width,zoom:z,cap:cs.length?Math.round(Math.max(...cs)*z*10)/10:null}})()""")
        ok=r['bottom']<=h
        if not ok and w>=900: bad.append((w,L,n,r))
        print(w,L,n,r,'FITS' if ok else 'scroll')
        if n=='1': pg.screenshot(path=f'sl/fit2-{w}-{L}{n}.png')
    pg.close()
  b.close()
print('LAPTOP OVERFLOWS',bad or 'none')
