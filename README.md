<p align="center">
  <a href="https://wan-huiyan.github.io/cutify-this/site/aurora.html"><img src="docs/readme/hero.gif" width="880" alt="A fairy wand glides across the dark purple Aurora landing page leaving a sparkle trail, a click bursts into confetti, and the page scrolls while a cat mascot rides the scroll indicator."/></a>
  <br/><sub>sparkle-that-page running live on its own landing page: wand cursor, fairy-dust trail, a confetti burst, and the scroll buddy. <a href="https://wan-huiyan.github.io/cutify-this/site/aurora.html">Try it yourself →</a></sub>
</p>

<h1 align="center">cutify-this ✨</h1>
<p align="center"><em>Six Claude Code skills that make the things you build cute, and check that the cute actually works.</em></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/wan-huiyan/cutify-this" alt="license"/></a>
  <a href="https://github.com/wan-huiyan/cutify-this/actions/workflows/test.yml"><img src="https://github.com/wan-huiyan/cutify-this/actions/workflows/test.yml/badge.svg" alt="tests"/></a>
  <a href="https://github.com/wan-huiyan/cutify-this/commits"><img src="https://img.shields.io/github/last-commit/wan-huiyan/cutify-this" alt="last commit"/></a>
  <a href="https://claude.com/claude-code"><img src="https://img.shields.io/badge/Claude_Code-6_skills-orange" alt="Claude Code: 6 skills"/></a>
  <img src="https://img.shields.io/badge/style-kawaii_but_tested-f472b6" alt="style: kawaii but tested"/>
</p>

> **Ask Claude to "make it cute" and get a favicon that doesn't vanish in a grey tab, page effects that switch off for people who
> asked for less motion, a terminal whose icons provably render, and a README, an app or an explainer animation with the same
> care. Every skill ships with checks that can fail.**

## 🚀 Install

```bash
/plugin marketplace add wan-huiyan/cutify-this
```

Then install the ones you want (or all six):

```bash
/plugin install cutify-that-tab@wan-huiyan-cutify-this
/plugin install sparkle-that-page@wan-huiyan-cutify-this
/plugin install pop-that-readme@wan-huiyan-cutify-this
/plugin install cutify-that-terminal@wan-huiyan-cutify-this
/plugin install hatch-that-world@wan-huiyan-cutify-this
/plugin install wiggle-that-diagram@wan-huiyan-cutify-this
```

<details><summary>From a terminal instead, all six in one go</summary>

```bash
claude plugin marketplace add wan-huiyan/cutify-this
for p in cutify-that-tab sparkle-that-page pop-that-readme cutify-that-terminal hatch-that-world wiggle-that-diagram; do
  claude plugin install "$p@wan-huiyan-cutify-this"
done
```
</details>

## 🧺 Six skills at a glance

| | Skill | Say this to Claude | You get | Try it |
|---|---|---|---|---|
| ✨ | [**sparkle-that-page**](#-sparkle-that-page--cute-page-effects) | "make this page more magical" | 10 drop-in effects (cursor, trail, confetti, stamp, sounds, secret word, sky switch…), 3 palettes, zero dependencies | [live demo](https://wan-huiyan.github.io/cutify-this/site/aurora.html) |
| 🎀 | [**cutify-that-tab**](#-cutify-that-tab--a-cute-favicon-that-survives-the-tab) | "put something cute in the browser tab" | 1 SVG favicon from 78 starters in 7 styles, checked against 4 Chrome tab colours; a builder; icons that sleep at night | [builder](https://wan-huiyan.github.io/cutify-this/plugins/cutify-that-tab/skills/cutify-that-tab/examples/builder.html) · [style gallery](https://wan-huiyan.github.io/cutify-this/plugins/cutify-that-tab/skills/cutify-that-tab/examples/styles.html) |
| 🐛 | [**hatch-that-world**](#-hatch-that-world--your-app-as-a-little-world) | "make this dashboard cute, like the morning brief" | your data drawn as a scene, switchable worlds, a mascot with moods | [morning-fairy](https://github.com/wan-huiyan/morning-fairy) |
| 🪱 | [**wiggle-that-diagram**](#-wiggle-that-diagram--make-a-diagram-explain-itself) | "animate this how-it-works diagram" | a captioned, looping explainer in 3 styles, paced so people can read it | [3 styles](https://wan-huiyan.github.io/cutify-this/wiggle/) |
| ⌨️ | [**cutify-that-terminal**](#️-cutify-that-terminal--a-cute-terminal-that-provably-renders) | "make my terminal prettier" | a theme, a rounded Nerd Font, a Starship prompt, and a check for `?` boxes | macOS + zsh |
| 🪄 | [**pop-that-readme**](#-pop-that-readme--a-readme-that-pops) | "give my README a glow-up" | an 11-section front page in this house style, with a fill-in template | this page |

<table>
<tr>
<td width="33%" align="center"><a href="#-sparkle-that-page--cute-page-effects"><img src="docs/readme/sparkle-stamp.png" alt="A PAID! rubber stamp landing on a pink button with a burst of hearts"/></a><br/><sub><b>sparkle-that-page</b>: a stamp and a burst for the big moments</sub></td>
<td width="33%" align="center"><a href="#-cutify-that-tab--a-cute-favicon-that-survives-the-tab"><img src="docs/readme/tab-builder.png" alt="The favicon builder with an NES-outline frog shown in four browser tab colours, each marked Reads"/></a><br/><sub><b>cutify-that-tab</b>: build a tab icon and see it pass on all 4 tab colours</sub></td>
<td width="33%" align="center"><a href="#-hatch-that-world--your-app-as-a-little-world"><img src="https://raw.githubusercontent.com/wan-huiyan/morning-fairy/main/docs/three-worlds.png" alt="The same morning brief drawn in three worlds: a storybook garden, a cosmic orbit and candy pop"/></a><br/><sub><b>hatch-that-world</b>: one app, three switchable worlds (morning-fairy)</sub></td>
</tr>
<tr>
<td align="center"><a href="#-wiggle-that-diagram--make-a-diagram-explain-itself"><img src="docs/wiggle-that-diagram/expenses.gif" alt="A whiteboard animation explaining how an expense claim gets checked, from receipts to payment"/></a><br/><sub><b>wiggle-that-diagram</b>: a diagram that explains itself, step by step</sub></td>
<td align="center"><a href="#️-cutify-that-terminal--a-cute-terminal-that-provably-renders">⌨️<br/><b>No screenshot yet</b></a><br/><sub><b>cutify-that-terminal</b>: a cute prompt, and a check that the icons really render</sub></td>
<td align="center"><a href="#-pop-that-readme--a-readme-that-pops"><img src="plugins/pop-that-readme/skills/pop-that-readme/examples/badges/robot-vouched.svg" height="24" alt="Robot vouched badge"/> <img src="plugins/pop-that-readme/skills/pop-that-readme/examples/badges/human-peeked.svg" height="24" alt="A human peeked badge"/></a><br/><sub><b>pop-that-readme</b>: this page, hand-drawn badges included</sub></td>
</tr>
</table>

## 🌱 Used in the wild

<table>
<tr>
<td width="50%"><a href="https://github.com/wan-huiyan/pomodo"><img src="https://raw.githubusercontent.com/wan-huiyan/pomodo/main/docs/screens/after-hours.png" alt="Pomodo's Recently done list: two rows finished after 6 pm sit under a night-sky strip with a moon, and Pomo the pixel tomato, looking sleepy, tells the team to go to bed"/></a></td>
<td width="50%"><a href="https://github.com/wan-huiyan/morning-fairy"><img src="https://raw.githubusercontent.com/wan-huiyan/morning-fairy/main/docs/three-worlds.png" alt="The same morning brief drawn in three worlds: a storybook garden, a cosmic orbit and candy pop"/></a></td>
</tr>
<tr>
<td><sub><b><a href="https://github.com/wan-huiyan/pomodo">Pomodo</a></b>, a team progress board, runs 6 of the 7 sparkle effects, adapted: the wand, the fairy dust, the stars on a click, the tab peekaboo, the floating dust, and Pomo climbing the scroll rail (that's our scroll buddy).</sub></td>
<td><sub><b><a href="https://github.com/wan-huiyan/morning-fairy">morning-fairy</a></b>, a daily brief drawn as a little world, is where hatch-that-world's method comes from: one builder, swappable worlds, a mascot with moods. (Made-up data.)</sub></td>
</tr>
</table>

---

## ✨ sparkle-that-page — cute page effects

**▶ [Live demo](https://wan-huiyan.github.io/cutify-this/) · landing pages: [Aurora (dark)](https://wan-huiyan.github.io/cutify-this/site/aurora.html) · [Bubblegum (bright)](https://wan-huiyan.github.io/cutify-this/site/bubblegum.html)**

Ten self-contained, **zero-dependency** effects: one short vanilla file each, no npm, no build. Wire them with
`<script>` / `<link>`, then choose options with `data-*` attributes on `<html>`.

<table>
<tr>
<td width="50%"><img src="docs/readme/sparkle-stamp.png" alt="A pink Pay invoice button with a tilted PAID! rubber stamp landing on it and a burst of pastel hearts around it"/></td>
<td width="50%"><img src="docs/readme/sparkle-secret-word.png" alt="The demo page in dark mode covered in confetti after typing the word magic, with a toast that says You found the secret word, a moon button top-left and a muted speaker bottom-left"/></td>
</tr>
<tr>
<td><sub><b>A stamp for the big moments.</b> <code>data-stamp="Paid!"</code> lands a rubber stamp on the button with a burst, and it stays put while you scroll.</sub></td>
<td><sub><b>A secret, a sky and a speaker.</b> Type <i>magic</i> for a party; the moon button flips the theme with no flash on reload; sounds stay off until you press the speaker. (Dark mode.)</sub></td>
</tr>
</table>

<p align="center">
  <a href="https://wan-huiyan.github.io/cutify-this/plugins/sparkle-that-page/skills/sparkle-that-page/examples/wands.html"><img src="docs/readme/sparkle-wands.png" width="880" alt="Eleven wand cursors in a row, each glowing as it does over a link: star, magical crescent with a heart gem, wizard staff with an orb, garden flower, cosmic star with a ring, striped candy heart, crystal, sleepy moon, ocean shell with a pearl, lollipop and a pixel star, shown once on a white page and once on a dark page"/></a>
  <br/><sub>All 11 wand families, as they glow over a link, on a light page and a dark page. Each comes in 3 palettes, and the outline flips to suit the page. <a href="https://wan-huiyan.github.io/cutify-this/plugins/sparkle-that-page/skills/sparkle-that-page/examples/wands.html">Try every wand as your cursor →</a></sub>
</p>

<p align="center">
  <a href="https://wan-huiyan.github.io/cutify-this/plugins/sparkle-that-page/skills/sparkle-that-page/examples/confetti.html"><img src="docs/readme/sparkle-confetti-floaters-scroll.png" width="880" alt="Three rows drawn on a white page and again on a dark page: 13 kinds of confetti (hearts, stars, paper, ribbons, sprinkles, petals, leaves, snowflakes, bubbles, music notes, paw prints, pixels), 12 kinds of floaters (blossoms, leaves, snow, bubbles, sparkles, fireflies, dandelion seeds, lanterns, stars, sleepy clouds, heart balloons), and 9 pixel scroll companions (a cat, bunny, bear and frog, a sprout in a pot, a rocket, a caterpillar, a moon and a balloon)"/></a>
  <br/><sub>Every confetti, floater and scroll companion, drawn by the effects themselves on a light page and a dark page. See them move: <a href="https://wan-huiyan.github.io/cutify-this/plugins/sparkle-that-page/skills/sparkle-that-page/examples/confetti.html">confetti</a> · <a href="https://wan-huiyan.github.io/cutify-this/plugins/sparkle-that-page/skills/sparkle-that-page/examples/floaters.html">floaters</a> · <a href="https://wan-huiyan.github.io/cutify-this/plugins/sparkle-that-page/skills/sparkle-that-page/examples/scroll.html">scroll companions</a></sub>
</p>

| | Effect | File | Variants (`data-*`) |
|---|---|---|---|
| 🪄 | Fairy-wand cursor | `fairy_cursor.js` | `data-wand` = star · magical · wizard · garden · cosmic · candy · crystal · moon · ocean · lollipop · pixel; `data-wand-palette` picks 1 of 3 each; follows light and dark pages ([see all 33](https://wan-huiyan.github.io/cutify-this/plugins/sparkle-that-page/skills/sparkle-that-page/examples/wands.html)) |
| ✨ | Sparkle trail | `sparkle_trail.js` | `data-trail` = sparkle · star · heart · pixel · fairydust · glints (twinkling, light and dark); `data-trail-density="storm"` for the dense version |
| 📜 | Scroll buddy | `scroll_indicator.js` | `data-scroll` = ring · comet · mascot (a cat, bunny, bear or frog climber) · sprout · rocket · caterpillar · moon · balloon; each one moves, holds on during a fast scroll and cheers at the bottom ([see them all](https://wan-huiyan.github.io/cutify-this/plugins/sparkle-that-page/skills/sparkle-that-page/examples/scroll.html)) |
| 👀 | Tab-title peekaboo | `tab_title_peekaboo.js` | `data-peekaboo-msg`, `data-peekaboo-favicon` |
| 🎉 | Click confetti | `click_confetti.js` | `data-confetti` = heart · star · confetti · paper · ribbon · sprinkles · petal · leaf · snow · bubble · note · paw · pixel; 3 palettes each; `data-confetti-motion` = burst · fountain · rain · pop ([see them all](https://wan-huiyan.github.io/cutify-this/plugins/sparkle-that-page/skills/sparkle-that-page/examples/confetti.html)) |
| 🌸 | Ambient floaters | `ambient_floaters.js` | `data-floaters` = sakura · leaves · snowflake · bubbles · dust · fairydust · fireflies · dandelion · lanterns · stars · clouds · hearts, in three depth layers ([see them all](https://wan-huiyan.github.io/cutify-this/plugins/sparkle-that-page/skills/sparkle-that-page/examples/floaters.html)) |
| 🎀 | Cute chrome | `cute_chrome.css` | `.stp-wobble`, `.stp-spinner`, pastel selection and scrollbar |
| ✅ | Stamp | `click_confetti.js` | `data-stamp="Done!"` on any button; the attribute's value is the stamp text |
| 🔔 | Cute sounds | `cute_sounds.js` | a speaker toggle (or your own `data-sound-toggle`); one voice per palette: candy soft square, neon sine, meadow triangle |
| 🤫 | Secret word | `secret_word.js` | `data-secret` (default `magic`); `SparkleThatPage.secretWord.finale()` for "finished everything" |
| 🌙 | Sky switch | `sky_switch.js` + a `<head>` snippet | sets `<html data-theme="light|dark">` before the first paint; leaves other theme names alone |

**Palettes:** `data-palette` = **candy** (default), **neon** (with glow), **meadow**. All colours come from CSS tokens
`--stp-c1…c6` in `cute_chrome.css`, so one edit recolours every effect.

**Cute, but considerate.** The skill decides *how often* an effect fires before how it looks (the "delight budget",
from Emil Kowalski's [animate](https://github.com/emilkowalski/skills) skill):

| | What | Why |
|---|---|---|
| 🎯 | Confetti fires only on `[data-celebrate]` buttons by default; `data-confetti-on="*"` makes every click burst | A burst on every click of an all-day tool stops being a treat |
| 🌬️ | The trail is sparse by default (a sparkle every 24 px of movement) | A storm is for landing pages, not tools |
| ♿ | With reduced motion on, confetti becomes one small heart that fades in place; the trail and floaters stay off | "Fewer and gentler", not nothing |
| 🖱️ | Pointer effects do nothing on touch screens; overlays never block a click or a scroll | Effects never get in the way |
| 🔬 | Confetti is sharp on Retina screens and runs at the same speed on 60 Hz and 120 Hz displays | Physics is time-based, the canvas matches the screen's pixel density |
| 🔇 | Sounds are off until the visitor presses the speaker; nothing audio-related loads before that click | Nobody wants a page that beeps uninvited |
| 🔋 | The trail stops its animation loop when no dust is moving | No battery spent on an empty screen |
| 🧹 | Every effect has `SparkleThatPage.<name>.start()` and `.destroy()` | Switch effects on and off, and clean up on single-page-app route changes |

```text
You:    make the "mark as done" button feel good
Claude: [adds data-stamp="Done!" and click_confetti.js, so a click lands a stamp with a small burst;
         keeps confetti off every other click, since this is an all-day tool]
```

<sub>Prior art, if you'd rather not hand-author: [tholman/cursor-effects](https://github.com/tholman/cursor-effects),
[party.js](https://party.js.org/), [canvas-confetti](https://github.com/catdad/canvas-confetti),
[tsParticles](https://github.com/tsparticles/tsparticles). This bundle stays dependency-free so Claude can write and
wire every effect for you.</sub>

---

## 🎀 cutify-that-tab — a cute favicon that survives the tab

<p align="center">
  <a href="https://wan-huiyan.github.io/cutify-this/plugins/cutify-that-tab/skills/cutify-that-tab/examples/styles.html"><img src="docs/readme/styles.png" width="820" alt="One pixel cat drawn in seven favicon styles, each shown at 16 px in light and dark browser tabs plus a 64 px enlargement."/></a>
  <br/><sub>One cat, seven styles, each in a real tab chip on Chrome's four tab colours. <a href="https://wan-huiyan.github.io/cutify-this/plugins/cutify-that-tab/skills/cutify-that-tab/examples/styles.html">Open the gallery →</a></sub>
</p>

One SVG file in the browser tab, instead of the 12-file pack a favicon generator gives you. Every browser since 2020
supports `<link rel="icon" type="image/svg+xml">`.

| | Feature | The specifics |
|---|---|---|
| 🐾 | **78 starters** | 56 pixel-art mascots (animals, sweets, nature, ghosts, silhouettes) and 22 emotion blobs; 13–25 lines each |
| 🎨 | **7 styles** | kawaii pixel, 1-bit silhouette, Game Boy, NES outline, die-cut sticker, chibi blob, riso two-ink: each with rules written to survive 16 px |
| 🎲 | **Explores before it draws** | 6 candidates across at least 3 styles (picked by a real random draw, so not always the pink cat); you choose from the 3 most different |
| ✅ | **A checker that can fail** | `check-favicon.py` scores the icon against Chrome's 4 tab colours, its edge margin and crisp edges: PASS, FAIL or UNCHECKED, with a 17-case self-test. None of the 78 starters fails it |
| 🛠️ | **A favicon builder** | `builder.html`: pick a subject (6) × style (6) × colour, see it at real size on all 4 tab colours with a live pass/fail from the same rule as the checker, then copy or download the SVG |
| 😴 | **Icons that sleep** | `examples/moods/`: a sleep face for 10 mascots, plus sad and starry for the cat; `favicon_mood.js` puts the icon to sleep after bedtime and while the tab is in the background, and shows page state with `CutifyTab.mood.set('sad')` |
| 🔍 | **Tab-size preview** | `preview.html` shows your icon at 16, 32 and 64 px in a real tab chip on all 4 colours, light and dark files side by side |
| 🌗 | **Dark mode that works in Chrome** | Two files and two `<link media>` tags; Chrome ignores `@media` inside a favicon SVG |
| ♻️ | **Replacing an icon?** | Bump `?v=2` on the link. Browsers cache favicons by URL, and a hard refresh won't clear it |
| 📚 | **Sources to study, not copy** | Lospec, OpenMoji, Twemoji, Fluent Emoji, Kenney, Phosphor, with their licences checked |

<table>
<tr>
<td width="50%"><a href="https://wan-huiyan.github.io/cutify-this/plugins/cutify-that-tab/skills/cutify-that-tab/examples/builder.html"><img src="docs/readme/tab-builder.png" alt="The favicon builder: subject buttons (cat, bunny, bear, frog, ghost, chick), a style list, and an NES-outline frog shown at real size in four browser tabs, each marked Reads with its colour difference"/></a></td>
<td width="50%"><a href="https://wan-huiyan.github.io/cutify-this/plugins/cutify-that-tab/skills/cutify-that-tab/examples/moods/moods.html"><img src="docs/readme/tab-moods.png" alt="The mochi cat favicon awake and asleep, in tab chips and 64 px enlargements on the four Chrome tab colours; asleep has closed eyes and a small z"/></a></td>
</tr>
<tr>
<td><sub><b>The builder.</b> Subject × style × colour, checked live on all four tab colours. <a href="https://wan-huiyan.github.io/cutify-this/plugins/cutify-that-tab/skills/cutify-that-tab/examples/builder.html">Try it →</a></sub></td>
<td><sub><b>Bedtime.</b> After 6 pm, and whenever you're on another tab, the icon closes its eyes. <a href="https://wan-huiyan.github.io/cutify-this/plugins/cutify-that-tab/skills/cutify-that-tab/examples/moods/moods.html">See all 10 →</a></sub></td>
</tr>
</table>

```
You:    the browser tab is a blank square. can you put something cute in there?
Claude: [opens the style gallery, draws 6 candidates in kawaii pixel, NES outline and die-cut sticker,
         runs the checker, shows you the 3 most different]
You:    the NES one
Claude: [writes static/favicon.svg, wires the <link>, checks it on all 4 tab colours] Done. It passes on all four.
```

<details><summary>🖼️ All 78 starters</summary>

<p align="center">
<img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_acorn.svg" width="48" height="48" alt="acorn" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_axolotl.svg" width="48" height="48" alt="axolotl" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_bear.svg" width="48" height="48" alt="bear" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_bee.svg" width="48" height="48" alt="bee" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_boba.svg" width="48" height="48" alt="boba" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_bunny.svg" width="48" height="48" alt="bunny" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_bunny_silhouette.svg" width="48" height="48" alt="bunny silhouette" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cactus.svg" width="48" height="48" alt="cactus" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_capybara.svg" width="48" height="48" alt="capybara" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cat_love.svg" width="48" height="48" alt="cat love" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cat_silhouette.svg" width="48" height="48" alt="cat silhouette" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_chick.svg" width="48" height="48" alt="chick" style="image-rendering:pixelated"/>
  <br/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cloud.svg" width="48" height="48" alt="cloud" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cloud_silhouette.svg" width="48" height="48" alt="cloud silhouette" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_corgi.svg" width="48" height="48" alt="corgi" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cow.svg" width="48" height="48" alt="cow" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_cupcake.svg" width="48" height="48" alt="cupcake" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_dango.svg" width="48" height="48" alt="dango" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_donut.svg" width="48" height="48" alt="donut" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_duckling.svg" width="48" height="48" alt="duckling" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_flower.svg" width="48" height="48" alt="flower" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_fox.svg" width="48" height="48" alt="fox" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_frog.svg" width="48" height="48" alt="frog" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_ghost.svg" width="48" height="48" alt="ghost" style="image-rendering:pixelated"/>
  <br/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_ghost_silhouette.svg" width="48" height="48" alt="ghost silhouette" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_ghost_silhouette_dark.svg" width="48" height="48" alt="ghost silhouette dark" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_ghost_tile.svg" width="48" height="48" alt="ghost tile" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_heart_silhouette.svg" width="48" height="48" alt="heart silhouette" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_hedgehog.svg" width="48" height="48" alt="hedgehog" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_ice_cream.svg" width="48" height="48" alt="ice cream" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_macaron.svg" width="48" height="48" alt="macaron" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_mochi_cat.svg" width="48" height="48" alt="mochi cat" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_moon.svg" width="48" height="48" alt="moon" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_mushroom.svg" width="48" height="48" alt="mushroom" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_onigiri.svg" width="48" height="48" alt="onigiri" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_otter.svg" width="48" height="48" alt="otter" style="image-rendering:pixelated"/>
  <br/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_owl.svg" width="48" height="48" alt="owl" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_pancakes.svg" width="48" height="48" alt="pancakes" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_panda.svg" width="48" height="48" alt="panda" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_penguin.svg" width="48" height="48" alt="penguin" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_pig.svg" width="48" height="48" alt="pig" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_planet.svg" width="48" height="48" alt="planet" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_pudding.svg" width="48" height="48" alt="pudding" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_puppy.svg" width="48" height="48" alt="puppy" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_quokka.svg" width="48" height="48" alt="quokka" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_rainbow.svg" width="48" height="48" alt="rainbow" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_seal.svg" width="48" height="48" alt="seal" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_sheep.svg" width="48" height="48" alt="sheep" style="image-rendering:pixelated"/>
  <br/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_shy_cat.svg" width="48" height="48" alt="shy cat" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_star_face.svg" width="48" height="48" alt="star face" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_star_silhouette.svg" width="48" height="48" alt="star silhouette" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_strawberry.svg" width="48" height="48" alt="strawberry" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_sun.svg" width="48" height="48" alt="sun" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_sushi.svg" width="48" height="48" alt="sushi" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_taiyaki.svg" width="48" height="48" alt="taiyaki" style="image-rendering:pixelated"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/pixel_tea_cup.svg" width="48" height="48" alt="tea cup" style="image-rendering:pixelated"/>
  <br/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_blush.svg" width="48" height="48" alt="blush"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_brand_grad.svg" width="48" height="48" alt="brand grad"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_bubble_heart.svg" width="48" height="48" alt="bubble heart"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_cheer.svg" width="48" height="48" alt="cheer"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_cozy.svg" width="48" height="48" alt="cozy"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_dreamy.svg" width="48" height="48" alt="dreamy"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_giggle.svg" width="48" height="48" alt="giggle"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_heart_eyes.svg" width="48" height="48" alt="heart eyes"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_kissy.svg" width="48" height="48" alt="kissy"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_love_rays.svg" width="48" height="48" alt="love rays"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_mint.svg" width="48" height="48" alt="mint"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_party.svg" width="48" height="48" alt="party"/>
  <br/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_proud.svg" width="48" height="48" alt="proud"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_sleepy.svg" width="48" height="48" alt="sleepy"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_smug.svg" width="48" height="48" alt="smug"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_sparkles.svg" width="48" height="48" alt="sparkles"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_starry.svg" width="48" height="48" alt="starry"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_surprise.svg" width="48" height="48" alt="surprise"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_thinking.svg" width="48" height="48" alt="thinking"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_wave.svg" width="48" height="48" alt="wave"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_wide_eye.svg" width="48" height="48" alt="wide eye"/>
  <img src="plugins/cutify-that-tab/skills/cutify-that-tab/examples/blob_woah.svg" width="48" height="48" alt="woah"/>
  <br/>
</p>

Each file is in [`examples/`](plugins/cutify-that-tab/skills/cutify-that-tab/examples), with its name and
vibe listed in the skill's [SKILL.md](plugins/cutify-that-tab/skills/cutify-that-tab/SKILL.md#examples-directory).
</details>

<details><summary>🩺 The four ways a favicon silently breaks (and the fixes)</summary>

| # | Failure | Looks fine in | Breaks in | Fix |
|---|---|---|---|---|
| 1 | **Tab-edge blending** | a preview on a flat dark page | Chrome's rounded tab | a 14×14 tile with a 1-cell outer margin |
| 2 | **Dark-mode mismatch** | one system theme | switching theme | two files + `<link media="(prefers-color-scheme: dark)">` |
| 3 | **Body vanishes on a light tab** | dark previews and dark tabs | Chrome's grey inactive tab `#c2c5be` | tint the body to Tailwind `*-300` or darker, or add a tile |
| 4 | **The old icon won't go away** | incognito | every returning visitor | bump `?v=N` on the `<link>` href |

Number 3 is the subtle one: `prefers-color-scheme` doesn't fix it, because Chrome is in light mode while it shows the
grey inactive tab. The checker catches 1 and 3 before you ship.
</details>

---

## 🐛 hatch-that-world — your app as a little world

<p align="center">
  <img src="https://raw.githubusercontent.com/wan-huiyan/morning-fairy/main/docs/caterpillar-world.png" width="720" alt="A morning brief drawn as a leaf: the caterpillar's body runs from 8 AM to now with a mascot on its back, and meeting signs stand on the leaf's humps"/>
  <br/><sub>Built with this method: <a href="https://github.com/wan-huiyan/morning-fairy">morning-fairy</a>'s caterpillar world. (Made-up demo data.)</sub>
</p>

The method behind [morning-fairy](https://github.com/wan-huiyan/morning-fairy), written down so your next cute app
starts from it:

| | Feature | The specifics |
|---|---|---|
| 🗺️ | **The scene is the data** | Pick the axis (hours of today, the last 30 days, a funnel's stages), then map each number to a channel: a running amount → the ground's height, items → objects on it, the overall state → the mascot's mood. Missing data is drawn as missing, never as 0 |
| 🌍 | **Worlds you can swap** | A world = colour tokens + one scene drawing + one sound voice. Adding one touches nothing else: an 8-step checklist and real code in `references/world-anatomy.md` |
| 🖱️ | **Clickable, still accessible** | An invisible layer of real links placed from the drawing's geometry; keyboard order follows time order |
| 🧭 | **Options before building** | An options page with live slices of your real data, and a dated plan per change |
| ✅ | **Checks that can fail** | 3 Playwright scripts, each shown failing on the old version first: `copy_identical.cjs` (copied text unchanged), `pixel_regress.cjs` (other worlds didn't move a pixel) and `hit_check.cjs` (every drawn thing is clickable and lands on its row) |

```text
You:    make my sales dashboard cute, like the morning brief
Claude: [picks the axis (the last 30 days) and draws it as a garden: revenue is the hill's height, deals are
         flowers, the mascot's mood follows the target; shows you an options page with your real numbers first]
```

Needs Node, Playwright and Chrome for the scripts. Pairs with sparkle-that-page and cutify-that-tab.

---

## 🪱 wiggle-that-diagram — make a diagram explain itself

<p align="center">
  <img src="docs/wiggle-that-diagram/expenses.gif" width="720" alt="The whiteboard style at double speed: a pen draws a phone and three receipt cards (hotel $180, dinner $95, taxi $40), an expense policy box wired to each card, a coloured reason for each (under the limit, over the $60 meal limit, no photo), a manager's Approved note, an expense report with a total of $275, and a Paid tick on the phone."/>
  <br/><sub>The whiteboard style at 2× speed: how an expense claim gets checked, from receipts to payment (made-up example). <a href="https://wan-huiyan.github.io/cutify-this/wiggle/">Watch it with captions, in all three styles →</a></sub>
</p>

Turn one static "how it works" picture into a short, **captioned, looping animation** for an HTML slide deck or
report, offered in three styles so people can pick:

| Style | Looks like | Made with |
|---|---|---|
| **Diagram clip** | a clean, 3Blue1Brown-style diagram; labels stay sharp | huashu-art-motion engine → text-free video + HTML labels |
| **Whiteboard** | someone explaining at a whiteboard, hand-lettered | huashu-art-motion's whiteboard grammar → square video |
| **Live** | a polished product animation, about 30 KB | inline SVG + GSAP with a virtual camera |

| | What makes it different | The specifics |
|---|---|---|
| 📖 | **Readable, not flashy** | Captions are written first; each step holds for at least `max(4.5 s, words/3 + 1.5 s)`, and `pace_check.py` fails any step shorter than its reading time |
| 🔁 | **One story, three ways** | One caption script feeds all three styles, so a switcher compares styles, not content |
| 🎞️ | **Behaves inside a deck** | One self-contained file per film in an `iframe srcdoc`: step rail, play/pause, reduced motion, and one gesture still moves one slide |
| ✅ | **Checks that can fail** | A pacing gate, contract tests in real Chrome, edge-clipping checks, size budgets, and reviewers who check every word in the picture against the source |

```text
You:    animate slide 4, the "how a claim gets approved" diagram, it's too much to take in at once
Claude: [writes the captions first, builds the film in all three styles with a switcher, checks every step
         is on screen long enough to read, and drops it into the slide as one file]
```

Needs `uv`, Google Chrome, ffmpeg (video styles) and the
[huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) skill for the two video styles.

---

## ⌨️ cutify-that-terminal — a cute terminal that provably renders

Every terminal-ricing guide ends with "install a Nerd Font, paste this config, enjoy". None of them check. So the
prompt comes back with `?` boxes where the icons should be, and **nothing errored anywhere**: a font name that matches
nothing falls back silently, and a terminal that never got the font just draws boxes.

| | Lever | What it gets you |
|---|---|---|
| 🖥️ | **Terminal** | Ghostty if you have no preference; honest one-liners on iTerm2, kitty, WezTerm and Warp so you can disagree |
| 🎨 | **Theme** | 463 built into Ghostty; `ghostty +list-themes` previews them live. Nothing to install |
| 🔤 | **Font** | A rounded face does more for "cute" than any palette: Maple Mono NF, or Comic Mono if you mean it |
| ❯ | **Prompt** | Starship with the git branch, a dirty-tree mark, and a `❯` that turns red when the last command failed |
| ✅ | **The check** | `verify-glyphs.sh` asks Ghostty which font draws each icon in your real prompt. Exit `0` PASS, `1` FAIL, `3` UNCHECKED, plus `--self-test` to prove the FAIL path still fires |

**The finding it's built on:** Ghostty bundles its own Symbols Nerd Font as a fallback, so icons render in Ghostty even
when your `font-family` is wrong. The terminal you configured looks perfect; only the *other* one shows boxes.

```text
You:    make my terminal prettier
Claude: [suggests a theme and a rounded font, backs up ~/.zshrc and shows the diff, sets up Starship,
         then runs verify-glyphs.sh on your real prompt] PASS: every icon is drawn by the Nerd Font.
```

> ⚠️ **One of these is not like the others.** The other skills drop a file into your project and you undo them by
> deleting it. This one **installs software and edits your `~/.zshrc`**, so it backs the file up first, shows you the
> diff, only appends, and gives you the undo in the same breath. macOS + Homebrew + zsh only.

---

## 🪄 pop-that-readme — a README that pops

The skill behind *this* page. It gives Claude a recipe and a fill-in template for a cute, high-signal front page:

| | Feature | The specifics |
|---|---|---|
| 🧱 | **An 11-section recipe** | hero → badges → one bold promise → captioned demo → why → feature table → install → usage → contributors → limitations → footer |
| 🖼️ | **Ready-made heroes** | an ASCII box hero that works anywhere, and a copy-paste pixel-SVG hero |
| ✍️ | **Voice rules** | the promise is one bold sentence; every claim earns a number; emoji as signposts, not decoration; a real limitations section |
| ☑️ | **A pre-ship checklist** | first screen has the hero, 3+ badges and the promise; no 404 badges; renders cleanly on GitHub; badges are honest |
| 🤖 | **Hand-drawn status badges** | drawn pills for claims no service can measure, never a fake live metric; sized to sit in a shields.io row, readable on GitHub light and dark; 3 examples to copy |

<p align="center">
  <img src="plugins/pop-that-readme/skills/pop-that-readme/examples/badges/robot-vouched.svg" height="24" alt="Robot vouched: an agent saw it work in a browser"/>
  <img src="plugins/pop-that-readme/skills/pop-that-readme/examples/badges/human-peeked.svg" height="24" alt="A human peeked: a person looked at it before it shipped"/>
  <img src="plugins/pop-that-readme/skills/pop-that-readme/examples/badges/fuelled-by-tea.svg" height="24" alt="Fuelled by tea"/>
  <br/><sub>The three example badges, hand-drawn SVG, 1–1.5 KB each. A picture can't go red, so tests and coverage stay live badges.</sub>
</p>

```text
You:    give my README a glow-up, it's a wall of text
Claude: [reads the repo, drafts the hero, badge row, one bold promise and a feature table,
         moves the long install notes into a fold, and adds a limitations section]
```

---

## ✅ Checks

```bash
bash scripts/check-all.sh
```

One script runs every check, on every push and pull request (the **tests** badge above). Today it runs 602 checks:

- **Favicons:** the checker's 17-fixture self-test, then every starter SVG on the four Chrome tab colours (0 fail; the
  3 known blobs it can't measure must stay UNCHECKED).
- **Mood favicons:** all 12 pass the checker, and a browser test (79 checks) fakes the clock and a hidden tab to
  prove the icon sleeps at bedtime, wakes at 07:00, and lets a page-state face win.
- **Builder:** a browser test (33 checks) shows the page's pass/fail agrees with `check-favicon.py` on all 132
  builder icons and on 108 shipped files and fixtures, and that copy and download give the right file.
- **Sparkle:** a real Chromium clicks, types and scrolls around the demo and checks 70 things, among them: confetti
  only on celebrate buttons by default; the trail's animation loop stops when idle; the stamp lands and follows its
  button; no sound system exists before the speaker is pressed; the secret word works on the page but not in a text
  box; the theme is set before the first paint; and reduced motion makes everything calmer. Each check was shown to
  fail when its feature is broken.
- **Wands and dust:** all 33 wands render with the click point on the gem; the outline follows the page (a white site
  in dark mode still gets dark ink); a page's own wand art is never overwritten; the twinkling dust stays quiet
  under a strict Content-Security-Policy.
- **Confetti, floaters and scroll companions (257 checks):** every family and palette is drawn as a shape, never a font
  character, and stays visible on a white page and a dark one; each follows the page's theme live; the four confetti
  motions and the floaters' depth layers move the way they say; the scroll companions track progress and hold on
  during a fast scroll; and the old names still work. Each check was shown to fail when its feature is broken.
- **Landing pages (55 checks):** both landing pages offer every family and draw the whole collection with the real
  effects; a tap puts that design on the page; the shelves really appear when scrolled to; a double-click or five
  quick taps leave one copy of each effect running, not several; and nothing scrolls sideways on a phone.
- **Syntax:** every shipped script parses (JavaScript, Python, bash, zsh).
- **Wiggle:** the pacing checker passes on the example films, and style C rebuilds byte-for-byte.
- **Repo:** marketplace versions match each plugin, skill names match, and every link in this README points at a real
  file.

The terminal glyph check is skipped on machines without Ghostty, so CI does not cover it.

## 🙈 Limitations

- **Claude Code first.** The skills are written for Claude Code. Other agents can read the `SKILL.md` files, but the
  install commands and some steps assume Claude Code.
- **Favicons are SVG only.** No `.ico` fallback, no `apple-touch-icon` or PWA icons; for a polished brand mark, use a
  designer. Most browsers reject animation inside a favicon.
- **The favicon checker is an early warning, not proof.** Its pass mark is calibrated on 5 field cases, and it can't
  measure outlines or tile-less blobs (3 starters come back UNCHECKED). Look at the real tab before you ship.
- **The terminal skill is macOS + Homebrew + zsh.** The ideas port to Linux; the commands don't.
- **hatch-that-world and wiggle-that-diagram need tools:** Node, Playwright and Chrome; wiggle's video styles also need
  ffmpeg and the huashu-art-motion skill.
- **"Cute" is still judged by eye.** Every check here proves something that can fail (contrast, pacing, glyphs, clicks),
  never that it's charming. Look at it.

## 💛 Credits

- **[huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion)** and **[huashu-design](https://github.com/alchaincyf/huashu-design)**
  by 花叔 (alchaincyf, MIT): the direction method and rendering engine under wiggle's video styles, and the "add
  options, not bans" idea behind cutify-that-tab's style exploration.
- **[animate](https://github.com/emilkowalski/skills)** by Emil Kowalski: the "should it animate at all" frequency
  gate behind sparkle-that-page's delight budget.
- **[tholman/cursor-effects](https://github.com/tholman/cursor-effects)**: the effect vocabulary (fairy dust,
  snowflake, bubble) sparkle-that-page names its variants after.
- **[Lospec](https://lospec.com/palette-list/dmg-nso)**: the Game Boy greens.
- Wiggle's live style uses [GSAP](https://gsap.com) and the fonts [Outfit](https://fonts.google.com/specimen/Outfit)
  and [Kalam](https://fonts.google.com/specimen/Kalam) (OFL); see its
  [`THIRD_PARTY_NOTICES.md`](plugins/wiggle-that-diagram/skills/wiggle-that-diagram/THIRD_PARTY_NOTICES.md).

Made by Huiyan Wan with **Claude** (Anthropic) in Claude Code. Version history:
[cutify-that-tab](plugins/cutify-that-tab/skills/cutify-that-tab/CHANGELOG.md), and the `## Changelog` section at the
end of the `SKILL.md` for [sparkle-that-page](plugins/sparkle-that-page/skills/sparkle-that-page/SKILL.md#changelog),
[cutify-that-terminal](plugins/cutify-that-terminal/skills/cutify-that-terminal/SKILL.md#changelog) and
[pop-that-readme](plugins/pop-that-readme/skills/pop-that-readme/SKILL.md#changelog). For hatch-that-world and
wiggle-that-diagram, see the [commit history](https://github.com/wan-huiyan/cutify-this/commits/main).

## License

MIT, see [LICENSE](LICENSE).
