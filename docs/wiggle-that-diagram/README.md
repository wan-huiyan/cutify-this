# wiggle-that-diagram demos

Two made-up examples for the [`wiggle-that-diagram`](../../plugins/wiggle-that-diagram/skills/wiggle-that-diagram/SKILL.md)
skill, each in all three styles. Live, with a switcher (whiteboard first): <https://wan-huiyan.github.io/cutify-this/wiggle/>

## How an expense claim gets checked (`expenses/`)

Ana snaps three receipts, written rules check each one, each gets a colour and a reason, the manager approves the
amber dinner, the approved lines fill the report and finance pays it. Six beats, 46 s loops, one `expenses/beats.json`.
Every name and amount is invented.

| Style | Film | Size | Source |
|---|---|---|---|
| Whiteboard (B) | `final/expenses-whiteboard.html` | 818 KB | `expenses/style-b/board.js`, `eras.js` |
| Diagram clip (A) | `final/expenses-diagram.html` | 435 KB | `expenses/style-a/expenses.js`, `eras_expenses.js`, `meta.json` |
| Live SVG (C) | `final/expenses.html` | 23 KB | `expenses/style-c/expenses.svg`, `expenses.js` (default theme) |

`expenses.gif` (the whiteboard at 2× speed, made with ffmpeg from the B master video) is the README picture. Build
it like the pizza below, with `expenses/beats.json`, `--var EX_BEATS` for A and no `--css` for C.

## How a pizza order travels

Sam orders one margherita in an app, the order prints as a ticket in the kitchen, a driver collects the box,
the app tracks the driver on a map, and the box reaches 12 Elm Street. Five beats, one caption script, three styles.
Every name, number and address is invented.

| Style | Film | Size | Source |
|---|---|---|---|
| Live SVG (C) | `final/pizza.html` | 21 KB | `style-c/pizza.svg`, `style-c/pizza.js`, `style-c/theme.css` |
| Diagram clip (A) | `final/pizza-diagram.html` | 423 KB | `style-a/pizza.js`, `style-a/eras_pizza.js`, `style-a/meta.json` |
| Whiteboard (B) | `final/pizza-whiteboard.html` | 513 KB | `style-b/board.js`, `style-b/eras.js` |

All three are 42 s loops built from `beats.json`. `final/index.html` is the switcher page for both demos; `pizza.gif` is step 4 of
the live style. The same sources ship inside the skill as `examples/pizza/` and `examples/expenses/`.

Rebuild and check, from this folder (`S` is the skill's `scripts` folder):

```bash
S=$(cd ../../plugins/wiggle-that-diagram/skills/wiggle-that-diagram/scripts && pwd)   # absolute, so it still works after a cd
python3 $S/common/pace_check.py beats.json
```

Style C:

```bash
python3 $S/style-c/build.py beats.json --src style-c --out final --css style-c/theme.css
uv run --with playwright python $S/style-c/test_contract.py final/pizza.html --stills /tmp/pizza-stills
uv run --with playwright python $S/style-c/gif.py final/pizza.html --beat 4 --from 1.9 --to 8.6 --out pizza.gif
```

Styles A and B need a copy of the [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) engine
(`ENG` below), with an empty `favicon.ico` in it; the steps are in SKILL.md, step 6. In short:

```bash
# A: work folder W holds engine/, meta.json
cp $S/style-a/way_make.js style-a/pizza.js $W/engine/ways/ && cp style-a/eras_pizza.js $W/engine/ && cp style-a/meta.json $W/
python3 $S/style-a/beats_js.py beats.json --engine $W/engine --var PZ_BEATS
(cd $W && SKILL=$S/style-a VERDICT_pizza=5 sh $S/style-a/make.sh pizza)   # SKILL: else make.sh uses ~/.claude/skills; -> $W/final/pizza.html
# B: engine with render.py patched to channel='chrome' and kit.js in demos/_hb/
python3 $S/style-b/build_beats.py beats.json --engine $ENG && cp style-b/board.js style-b/eras.js $ENG/demos/pizza/
uv run --with playwright python $ENG/render.py --film demos/pizza --fps 30 --crf 12 --out work/pizza_master.mp4
python3 $S/style-b/build_html.py pizza --beats beats.json --work work --out final   # -> final/pizza-whiteboard.html
```
