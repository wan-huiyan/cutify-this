# Deck-side test: switcher loads, style switch changes the frame, "Watch it work" link lands with the way pressed, arrows still move on. Usage: uv run --with playwright python3 -I howtest.py <deck.html>
import sys, pathlib
WAY3_LABEL = '3 · Option three'  # must match WAYS[2] in embed_anims.py
from playwright.sync_api import sync_playwright
P=pathlib.Path(sys.argv[1]).resolve().as_uri()
fails=[]
with sync_playwright() as pw:
  b=pw.chromium.launch(channel='chrome')
  for w,h in [(1280,800),(390,844)]:
    pg=b.new_page(viewport={'width':w,'height':h}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(P); pg.wait_for_timeout(500)
    k=pg.evaluate("[...document.querySelectorAll('.slide')].findIndex(s=>s.id==='s-how')")
    pg.evaluate(f"window.__deck.go({k})"); pg.wait_for_timeout(1500)
    st=pg.evaluate("({loaded:document.getElementById('howFrame').srcdoc.length})")
    if st['loaded']<1000: fails.append((w,'not loaded',st))
    pg.screenshot(path=f'sl/how-{w}.png')
    pg.click('[data-how-style=A]'); pg.wait_for_timeout(1200); a=pg.evaluate("document.getElementById('howFrame').srcdoc.length")
    pg.click('[data-how-way="2"]'); pg.wait_for_timeout(800)
    pr=pg.evaluate("[...document.querySelectorAll('[aria-pressed=true]')].map(b=>b.textContent)")
    if a==st['loaded']: fails.append((w,'style switch did not change frame'))
    # watch-it-work from Way 3 panel
    pg.evaluate("window.__deck.go(3)"); pg.wait_for_timeout(700)
    pg.click('#s4 [data-open=d-w3]'); pg.wait_for_timeout(400); pg.click('#d-w3 [data-watch-way="3"]'); pg.wait_for_timeout(1200)
    cur=pg.evaluate("window.__deck.cur()"); pr2=pg.evaluate("[...document.querySelectorAll('[aria-pressed=true]')].map(b=>b.textContent)")
    op=pg.evaluate("!!document.querySelector('dialog[open]')")
    if cur!=k or op or WAY3_LABEL not in pr2: fails.append((w,'watch link',cur,k,op,pr2))
    # keys still work on the how slide
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(700)
    if pg.evaluate("window.__deck.cur()")!=k+1: fails.append((w,'arrow from how slide'))
    if errs: fails.append((w,'errors',errs))
    print(w,'pressed',pr,pr2)
    pg.close()
  b.close()
print('FAILS',fails or 'none')
