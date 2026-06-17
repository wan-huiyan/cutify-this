# Hero recipes — copy, edit, drop in

Two zero-dependency heroes. Pick A for instant + universal, B for a rendered banner.
For a fancier *animated* hero, hand off to `pixel-art` / `css-animated-svg-scenes`.

---

## A · ASCII box hero

Paste inside a fenced code block so the box-drawing characters stay aligned. Keep the
box ≤ ~60 chars wide so it doesn't wrap on mobile.

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║            P R O J E C T   ·   N A M E           ║
║                                                  ║
║       one-line tagline that says the thing       ║
║                                                  ║
║     ✨ feature  ·  🎀 feature  ·  ⚡ feature       ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

Tips: space out the title letters (`P R O J E C T`) for presence; center each line by
eye; one line of "·"-separated feature words reads as a subtitle.

---

## B · Centered pixel-SVG hero

Commit a small inline-`<rect>` pixel SVG to `docs/hero.svg`, then center it. Use
`shape-rendering="crispEdges"` so it stays crisp when scaled up. Example — a little
star mascot on a rounded candy tile (16×16 grid, rendered at 120px):

```xml
<!-- docs/hero.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="120" height="120" shape-rendering="crispEdges">
  <rect x="1" y="1" width="14" height="14" rx="3" fill="#fdf2f8"/>
  <rect x="7" y="2" width="2" height="2" fill="#fde047"/>
  <rect x="5" y="4" width="6" height="2" fill="#fde047"/>
  <rect x="3" y="6" width="10" height="2" fill="#fde047"/>
  <rect x="4" y="8" width="8" height="2" fill="#f472b6"/>
  <rect x="5" y="10" width="2" height="2" fill="#1f2937"/>
  <rect x="9" y="10" width="2" height="2" fill="#1f2937"/>
  <rect x="6" y="12" width="4" height="1" fill="#1f2937"/>
</svg>
```

Then in the README:

```html
<p align="center">
  <img src="docs/hero.svg" width="120" height="120" alt="project mascot" style="image-rendering:pixelated"/>
</p>
<h1 align="center">project-name ✨</h1>
<p align="center"><em>one-line tagline that says the thing</em></p>
```

To link the hero to a live/animated version (recommended once you have one):

```markdown
[![project hero](docs/hero.gif)](https://OWNER.github.io/REPO/)
```
