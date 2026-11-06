# wiggle-that-diagram demo: how a pizza order travels

A neutral, made-up example for the [`wiggle-that-diagram`](../../plugins/wiggle-that-diagram/skills/wiggle-that-diagram/SKILL.md)
skill: Sam orders one margherita in an app, the order prints as a ticket in the kitchen, a driver collects the box,
the app tracks the driver on a map, and the box reaches 12 Elm Street. Five beats, one caption script. Every name,
number and address is invented.

| File | What it is |
|---|---|
| `beats.json` | The caption script and beat timing (shared by every style) |
| `src/pizza.svg`, `src/pizza.js`, `src/theme.css` | Style C (live SVG + GSAP) source: the drawn world, the timeline and camera, the cream-and-tomato theme |
| `final/pizza.html` | The built film: one self-contained file, 21 KB, 42.6 s loop. Live: <https://wan-huiyan.github.io/cutify-this/wiggle/pizza.html> |
| `pizza.gif` | Step 4 as a GIF for the README (made with `scripts/style-c/gif.py`) |

The same sources ship inside the skill as `examples/pizza/`.

Rebuild and check (from this folder; `S` is the skill folder):

```bash
S=../../plugins/wiggle-that-diagram/skills/wiggle-that-diagram
python3 $S/scripts/common/pace_check.py beats.json
python3 $S/scripts/style-c/build.py beats.json --src src --out final --css src/theme.css
uv run --with playwright python $S/scripts/style-c/test_contract.py final/pizza.html --stills /tmp/pizza-stills
uv run --with playwright python $S/scripts/style-c/gif.py final/pizza.html --beat 4 --from 1.9 --to 8.6 --out pizza.gif
```

Only style C is built here so far.
