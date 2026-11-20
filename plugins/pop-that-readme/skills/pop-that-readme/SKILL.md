---
name: pop-that-readme
description: Use when writing or upgrading a GitHub/open-source project's README so it actually pops — a cute, high-signal front page instead of a wall of text. Triggers on "write a README", "make my README pretty/cute/pop/stylish", "polish/redo my repo's README", "README template", "repo front page", "add badges / a hero banner / a feature table / an install section / a demo GIF", "animated demo", "GIF gallery", "showcase styles", "open-source my project's readme", "give my repo a glow-up". Produces a hero that shows the thing moving (a GIF linked to a live page; a pixel hero only when there is nothing to show), a shields.io badge row, a bold one-line value prop, a GIF gallery for variants, a why-it-exists section, an emoji feature/ingredient table, a copy-paste install block, a contributors shoutout, and an honest limitations section. Ships a fill-in template, a GIF recorder, and fallback heroes (ASCII box + pixel SVG). Skip for terse internal repos, strict brand templates, or non-README docs (API refs).
---

# Pop That README ✨

Turn a flat, wall-of-text README into a **cute, high-signal front page** people
actually read and screenshot — the polished house style behind repos like
`cutify-this`, `show-and-tell`, and `agent-review-panel`. One template, a baked-in
hero, and a section recipe. Pop, don't pad.

## Problem

A project is good but its README is a grey wall: no hero, no badges, a vague
one-liner, a giant prose dump, and the install command buried at the bottom.
Visitors bounce in seconds. The fix isn't *more* words — it's a **scannable,
characterful front page**: a hero that shows the thing, a value prop you grasp in
one line, an emoji table you skim, and an install block you can copy without
scrolling.

## Context / Trigger conditions

Use when **any** of:

- "Write / generate / redo / polish my README", "make my README pop / cute / pretty".
- "Give my repo a front page / a glow-up", "my README is just a wall of text".
- "Add a hero banner / badges / a feature table / a demo GIF / an install section".
- Open-sourcing a repo and it needs a README that earns a star.

**Skip** if: a terse internal-only repo (a one-paragraph README is correct), a strict
corporate brand template you must follow, or the doc is an API reference / tutorial /
changelog (different shape — see `frontend-design` / technical-writing).

## The recipe — section order (top to bottom)

A README pops when it's **scannable and front-loads value**. Use this order; drop
sections that don't apply, never reorder the top three.

| # | Section | Why it's there |
|---|---|---|
| 1 | **Hero** (a GIF of the thing moving, linked to a live page, or the GIF gallery when there are several styles; + title + emoji) | First impression; shows the thing in 1 second. See **Show it moving** below; the static heroes further down are the fallback. |
| 2 | **Badge row** | Signals it's alive + legit (license, last-commit, version, "Claude Code skill"). |
| 3 | **Value-prop blockquote** (one bold sentence) | The single most important line. What it does + for whom, concretely. |
| 4 | **Demo GIF or GIF gallery + `<sub>` caption** | Show, don't tell. One tile per style or variant, each linked live (**Show it moving** below). Caption explains what the reader is looking at. |
| 5 | **What it does / Why it exists** | The concrete problem + the honest payoff (1–2 short paras). |
| 6 | **Emoji feature/ingredient table** | The proven recipe — skimmable, one emoji + claim + why per row. |
| 7 | **Quick start / Install** (copy-paste block) | The command, reachable without scrolling far. `<details>` for variants. |
| 8 | **Usage example** | A realistic "you say X → it does Y" snippet. |
| 9 | **Contributors** ("Built with love") | `contrib.rocks` image when others helped. |
| 10 | **Limitations / honesty box** | What it's NOT, and where it's weak. Builds trust; separates it from marketing. |
| 11 | License + links | Short footer. |

## Show it moving

A README for something visual pops when the first screen **shows the thing working**.
A still pixel hero and a diagram describe it; a GIF proves it. The
[cutify-this README](https://github.com/wan-huiyan/cutify-this) is the worked example:
its hero is a GIF of a landing page with the wand cursor, sparkle trail and confetti
running, and it links to that page live on GitHub Pages.

**1. Decide what the first screen shows.** If the project has anything visual or
animated (a web page, a slide deck, a CLI, a widget, a game), the hero is a **GIF of it
moving, linked to a live page** you can click into. A static hero SVG or the ASCII box
(below) is the fallback, only for projects with nothing to show (a library, a parser).

```html
<p align="center">
  <a href="https://OWNER.github.io/REPO/demo.html"><img src="docs/readme/hero.gif" width="720"
     alt="What moves, in one sentence: the deck flips to slide 2 and the mascot waves"/></a>
  <br/><sub>What you are watching. <a href="https://OWNER.github.io/REPO/demo.html">Try it live →</a></sub>
</p>
```

Turn GitHub Pages on so the link is live: repo **Settings → Pages → Deploy from a
branch → main / root**, or
`gh api -X POST repos/OWNER/REPO/pages -f 'source[branch]=main' -f 'source[path]=/'`.
Open the URL yourself once the Pages build finishes, before you put it in the README.

**2. Several styles or variants: a gallery, one tile per style.** Three themes, three
decks, three cursor sets: give each its own tile with the GIF, a `<sub>` caption that
names it, and an **open live** link. Size each image by `width`, never `height`, so the
tiles keep their shape as the column narrows, and keep it to three tiles a row.

- **The gallery may stand in for the hero, and it goes on the first screen.** When there
  are several styles or variants, put the gallery right under the title and tagline,
  above the badges and the value prop. A static hero image above a gallery pushes the
  moving thing below the fold.
- **Equal tiles:** each gallery cell `width="33%"` and each `img` `width="100%"`, so the
  tiles come out the same size.
- **Phones:** GitHub does not stack a table on a phone, so three tiles in a row are about
  70–100 px wide at a 390 px screen. If the phone view matters, use one big GIF hero
  linked live with the gallery below it, or one tile per row.

```html
<table>
<tr>
<td width="33%" align="center"><a href="https://OWNER.github.io/REPO/garden.html"><img src="docs/readme/garden.gif" width="100%" alt="Garden style: flowers sprout as the slides advance"/></a><br/><sub><b>Garden</b>: flowers sprout on every slide · <a href="https://OWNER.github.io/REPO/garden.html">open live</a></sub></td>
<td width="33%" align="center"><!-- same shape: style 2 --></td>
<td width="33%" align="center"><!-- same shape: style 3 --></td>
</tr>
</table>
```

**3. Record it with `examples/record_gif.py`.** It opens the page in headless
Chromium, plays a key/click script at real speed, and encodes a looping GIF:

```bash
uv run --with playwright python examples/record_gif.py deck.html docs/readme/garden.gif \
  --size 1280x720 --width 720 --lead 2 --keys "ArrowRight*14:1.9" --tail 1.5 --poster docs/readme/garden.png
# first run only: uv run --with playwright playwright install chromium   (ffmpeg must be on PATH)
```

- **The pointer.** A headless browser draws no mouse pointer, so a click would look like
  an invisible hand. When the key script has a `click=` or `move=` step, the recorder draws
  an arrow that glides to the target and ripples where it clicks (`--cursor auto`, the
  default; `--cursor off` skips it). `move=SELECTOR:secs` glides there and hovers without
  clicking, which shows a hover effect. If the page draws its own cursor (the fairy wand),
  the recorder keeps the page's and does not add an arrow.
- **Size budget:** each GIF at or under **4 MB** (the script's default `--max-mb`; it
  steps down frame rate, then colours, then width until it fits), and the GIFs on one
  page under about **10 MB** in total. Every visitor downloads every GIF. Three tiles of
  about 3 MB is the ceiling; with more, autoplay one and show the rest as their
  `--poster` PNG, each linking to its GIF.
- **Look before you ship.** Pull six evenly spaced frames and look at every one:
  `ffmpeg -i out.gif -vf "select='not(mod(n\,N))',scale=360:-2,tile=3x2" -frames:v 1 sheet.png`
  with N = frame count / 6. You are checking for blank or half-loaded frames, text cut
  off, and that the motion is actually visible. Jumping straight into a section that
  fades in on scroll films empty frames, so give each step time to settle.

**4. Private content never goes public.** If the real thing holds client names,
people, figures or internal wording, do not record it. Build a **fictional demo copy**
first (made-up names, made-up numbers, the same styles), record that, and leak-scan the
copy and the GIF's source page before either is committed (grep for every client,
person and project name you know of, plus any real figures).

- **Invent the demo, do not lightly rename it:** new names, new quotes, new numbers, a new
  setting. Before publishing, check the demo against the real source for shared phrases
  (a sentence carried over with only the names swapped still identifies it).
- **Commit with the GitHub no-reply email on a personal public repo.** Before the first
  commit, `git config user.email <id>+<login>@users.noreply.github.com` (local to that
  repo). A work email in a public commit takes a history rewrite to remove.

**5. Demo the real thing, and keep it real after every change.** The
[after-the-call README](https://github.com/wan-huiyan/after-the-call) is the worked
example: three animated decks, each the skill's own output on an invented call, each
tile linking to the working deck on GitHub Pages.

- **The demo is real output.** Run the project on an invented input and publish what it
  produced (for a skill: what the skill made), under `docs/demo/` so each **open live**
  link opens the working thing, not a mock-up drawn for the README.
- **Film the moments that show the feature.** Script the recording through them, not just
  a scroll: arrow through every slide, and click the thing that animates
  (`--keys "ArrowRight*9:1.75,click=button.xp-btn:1.0,ArrowRight*5:1.75"` fills a quest
  deck's XP bar on camera).
- **Every live demo page gets its own tab icon**, drawn from that page's mascot (see
  `cutify-that-tab`). A page without one shows the browser's grey globe, and the tab is the
  first thing a visitor sees.
- **Say it is made up** in a small label on the page and in one `<sub>` line under the
  gallery.
- **Check the story by its beats, not only its phrases.** Have an agent that did not write
  the demo compare it with the real source beat by beat: the shape of the finding, its
  time windows, the kinds of lists, who said what. Two invented stories passed a shared-
  phrase check and still retold the real call with the names swapped.
- **Any text change means re-recording** every GIF that shows it. Then pull the frame where
  the changed text appears (`ffmpeg -ss <second> -i out.gif -frames:v 1 f.png`) and look.
- **After the push, check what visitors get:** a fresh clone; the Pages build is `built` at
  your commit (`gh api repos/OWNER/REPO/pages/builds/latest --jq '.status+" "+.commit'`);
  `curl` each live demo for a sentence you changed; a screenshot of the live README's first
  screen.

## Pictures are drawn, never emoji

Inside any **picture** (a diagram SVG, the hero, a badge, a social card, a demo page you
film), every icon is **hand-drawn as SVG paths**. Never put an emoji in one. An emoji is
drawn by each reader's system font, so it looks different on a Mac, on Windows and on
Linux; it cannot take your palette or line weight; and next to drawn shapes it reads as
clip-art. A row of eight emoji in coloured circles is the typical slip: redraw them as a
set.

- **One line style for the whole set:** round caps and joins, one stroke width (about 2.5
  at a 40 px icon), curves a little uneven so it looks drawn, the stroke a darker shade of
  that item's colour, at most one soft tint fill per icon.
- **Same meaning, drawn:** compass, five-petal flower, microphone, wrench and screwdriver,
  alarm clock, footprints, a noodle bowl with steam. Keep each to a few strokes so it reads
  at 1x.
- **Look at it twice, and hand over both renders.** One local HTML page, opened in
  headless Chromium (not a cropped preview), holding (1) the picture at 1x on `#ffffff`
  and on `#0d1117`, and (2) the same SVG at 4x, so every icon is big enough to judge the
  drawing. Screenshot it once and look at both halves. That is one render, a few seconds:
  "the user wanted it quick" is not a reason to skip it, because a hurried icon is the one
  that comes out unreadable. The picture is not done until you can name that render file
  and say what you saw in it.
- **Check with a character scan, not an emoji regex.** List every non-ASCII character in
  the SVG (`python3 -c "import sys;print(sorted({hex(ord(c)) for c in open(sys.argv[1]).read() if ord(c)>127}))" pic.svg`).
  Common emoji ranges miss some symbols: the alarm clock is U+23F0.
- Emoji as **text** wayfinding (a section heading, a feature-table row, a gallery caption)
  is still fine: that is type, not a picture.

## Voice & copy rules

- **Value prop = one bold sentence in a blockquote.** Concrete verbs + the audience.
  Not "a tool for productivity" → "**Turn dense technical findings into a plain-English
  HTML explainer your boss will actually read.**"
- **Every claim earns a number or a specific.** "fast" → "renders in <50ms"; "lots of
  options" → "78 starter SVGs".
- **Emoji as wayfinding, not decoration.** One per feature-row / section header, used
  consistently. Don't sprinkle. Never inside a picture (**Pictures are drawn, never emoji** above).
- **Honesty is a feature.** A real "Limitations" section (small sample, what's not
  covered) reads as confidence, not weakness.
- **Cute, not childish.** Playful copy + a real type/spacing discipline. "The cutest
  dev tool you've ever seen," not a kids' site.

## Baked-in hero recipe

The **fallback** for projects with nothing visual to show (a library, a parser, a
CLI with no interesting output): two zero-dependency heroes you can drop in. Anything
that moves gets a GIF hero instead (**Show it moving** above). (For richer banners — animated pixel
scenes — hand off to the `pixel-art` and `css-animated-svg-scenes` skills; see
`examples/hero_examples.md` for both heroes in full.)

**A · ASCII box hero** (works literally anywhere, even plain-text viewers):

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║            P R O J E C T   ·   N A M E           ║
║                                                  ║
║        one-line tagline that says the thing      ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```
Wrap it in a fenced code block so the box-drawing characters stay aligned.

**B · Centered pixel/SVG hero** (renders on GitHub):

```html
<p align="center">
  <img src="docs/hero.svg" width="520" alt="<project> — <one-line>"/>
</p>

<h1 align="center">project-name ✨</h1>
<p align="center"><em>one-line tagline that says the thing</em></p>
```
A simple inline pixel hero (a 16×16-grid SVG of `<rect>`s with
`shape-rendering="crispEdges"`, scaled up) is enough; commit it to `docs/`. Link the
image to an interactive/animated version when you have one
(`[![alt](hero.gif)](https://…live demo…)`).

## Badge row (shields.io)

The recurring set — keep 3–5, drop what doesn't apply:

```markdown
[![license](https://img.shields.io/github/license/OWNER/REPO)](LICENSE)
[![last commit](https://img.shields.io/github/last-commit/OWNER/REPO)](https://github.com/OWNER/REPO/commits)
[![release](https://img.shields.io/github/v/release/OWNER/REPO)](https://github.com/OWNER/REPO/releases)
[![Claude Code](https://img.shields.io/badge/Claude_Code-skill-orange)](https://claude.com/claude-code)
```
Add language/test/aesthetic badges as relevant (`python-3.9--3.12`,
`actions/workflows/test.yml/badge.svg`, a `style-arcade%2Fpixel` vanity badge).

## Hand-drawn status badges (jokes and claims with no live data)

Use a drawn badge, not shields.io, for a **claim no service can measure**: "Robot
vouched" (an agent saw it work in a browser), "A human peeked", "Fuelled by tea". Never
draw a badge that imitates a live metric (tests passing, coverage, build, downloads):
a picture cannot go red, so it would lie. Those stay shields.io / Actions badges.
Rule of thumb: if the claim could become false without anyone editing the file, it must
not be a static SVG.

- **Size:** height 20-28 px (24 is the sweet spot), width under ~160 px, so it sits in
  the same row as shields.io badges. Set `width`/`height` on the `<svg>` and a matching
  `viewBox`; add `vertical-align` only if the row looks off.
- **Pattern:** a rounded pill (`rx` = half the height), a ~20 px drawn character on the
  left, a 2-3 word label on the right. Under 4 KB, hand-authored, no `<script>`, no
  `<style>` needing the page.
- **Dark and light:** GitHub shows README SVGs on `#ffffff` and `#0d1117`. Give the pill
  its own solid mid-tone fill (white text passes contrast on it) plus a 1 px
  `#fff` at 35% outline, and it reads on both with no `<picture>`. Use `<picture>` with
  `prefers-color-scheme` only if the badge is transparent or needs two palettes.
- **Text:** GitHub serves README SVGs as `<img>`, so scripts and external fonts never
  load. Use a system font stack (`-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`)
  and pin the width with `textLength` + `lengthAdjust="spacingAndGlyphs"` so a
  wider fallback font cannot overflow the pill. Outline the text as paths only when the
  exact letterforms matter (it costs size and kills selectable text).
- **Alt text:** `<img alt="Robot vouched: an agent saw this work in a browser">` in the
  README, plus `role="img"`, `aria-label` and `<title>` inside the SVG. Say what the
  claim means, not what is drawn. Link the badge to a page that explains the claim.
- **Check it:** render at 1x and 3x on white and `#0d1117` before shipping.

Examples in `examples/badges/`: `robot-vouched.svg`, `human-peeked.svg`,
`fuelled-by-tea.svg`, and `examples/badges/README.md` (how to copy and recolour).

## Install block (for Claude Code skill/plugin repos)

Lead with the marketplace add; tuck variants in a `<details>`:

````markdown
```bash
/plugin marketplace add OWNER/REPO
/plugin install PLUGIN@MARKETPLACE
```

<details><summary>Shell form / git clone</summary>

```bash
claude plugin marketplace add OWNER/REPO
git clone https://github.com/OWNER/REPO ~/.claude/skills/REPO
```
</details>
````

## How to apply (existing repo)

1. **Read the repo first** — `plugin.json`/`package.json`, the code, existing README.
   The value prop and feature table must be *true*; pull real numbers/specifics.
2. Copy `examples/README.template.md`, fill every `<PLACEHOLDER>`, delete unused
   sections. Don't ship a placeholder.
3. Make the hero: a GIF of the thing moving, linked live (**Show it moving**), or the
   static fallback hero if there is nothing to show. Commit it to `docs/readme/`.
4. **Preserve** anything the old README had that's still accurate (install handles,
   troubleshooting links, contributor credits) — additive, not a wipe.
5. Run the **quality checklist** below.

## Quality checklist (verify before shipping)

- [ ] First screen (no scroll) has: hero, ≥3 badges, and the value-prop sentence.
- [ ] Value prop is **one bold sentence**, concrete, names the audience.
- [ ] Every feature-table claim has a number or a specific (no "fast / powerful / easy").
- [ ] Install command is copy-paste correct and appears above the fold-ish.
- [ ] If the project is visual or animated, the first screen **moves**: a GIF hero or a
      GIF gallery, one tile per style. A static hero only when there is nothing to show.
- [ ] Every GIF links to something live (GitHub Pages or a demo URL you opened), is at or
      under 4 MB, the page's GIFs total under about 10 MB, and six sampled frames were
      looked at (none blank, no text cut off).
- [ ] With several styles, the GIF gallery sits right under the title and tagline, above
      the badges and value prop, with no static hero image above it.
- [ ] Gallery cells are `width="33%"` and their images `width="100%"` (equal tiles); if
      the phone view matters, there is one big GIF hero or one tile per row.
- [ ] A fictional demo is invented (new names, quotes, numbers, setting), and was checked
      against the real source for shared phrases.
- [ ] On a personal public repo, every commit's author email is the GitHub no-reply
      address (`git log --format='%ae'`), set before the first commit.
- [ ] No picture contains an emoji: every SVG's non-ASCII characters were listed and none
      is an emoji or symbol glyph; each drawn icon was looked at alone at 4x and in place at
      1x on white and `#0d1117`.
- [ ] The demo is the project's real output on an invented input, hosted live; the recording
      clicks through the moments that show the feature; every live demo page has its own
      tab icon; the story was checked beat by beat against the real source by an agent that
      did not write it.
- [ ] A recording that clicks something shows a pointer gliding to it (or the page's own cursor), and
      you looked at a frame of it landing.
- [ ] After any demo text change, every GIF showing it was re-recorded and the frame with
      the change was looked at; after the push, the Pages build is `built` at your commit and
      the live README's first screen was looked at.
- [ ] A real **Limitations** section exists (not omitted).
- [ ] Badge/owner/repo slugs resolve (no 404 shields).
- [ ] Renders cleanly on GitHub (preview it) — tables aligned, code fences closed,
      `<p align="center">` blocks balanced.
- [ ] Badges are honest: anything that implies a live measurement (tests, coverage, build,
      version) is a live shields.io/Actions badge; hand-drawn badges only carry jokes or
      claims a person or agent made, and the claim is true today.
- [ ] Contributors credited if anyone else helped (`contrib.rocks`).

## Examples directory

- `README.template.md` — the full fill-in template (every section, `<PLACEHOLDER>`s).
- `hero_examples.md` — the ASCII box hero + a worked pixel-SVG hero (the fallback), copy-and-edit.
- `record_gif.py` — records a page or deck as a looping README GIF under a size budget, with a poster PNG and a drawn pointer for click steps (`--self-test` checks its path maths offline).
- `badges/` — three hand-drawn status-badge SVGs (robot, girl peeking over a wall, teacup) + how-to.

## See also

- **`cutify-that-tab`** / **`sparkle-that-page`** — sibling skills in the `cutify-this`
  bundle (and good examples of the house style in their own READMEs).
- **`pixel-art`**, **`css-animated-svg-scenes`** — for authoring a richer animated hero.
- **`show-and-tell`** — the arcade/honesty aesthetic this recipe descends from.

## Changelog

- **v1.4.0** (2026-11-20) — The recorder draws a pointer. `record_gif.py` glides a drawn
  arrow to each `click=` target along a slightly wobbly arc and ripples on the click, moving
  the real mouse so hover effects and sparkle trails show too. New `move=SELECTOR:secs` step,
  `--cursor auto|on|off`, a seeded path so reruns match, no arrow on a page that draws its
  own cursor, and `--self-test`. Show it moving step 3 and the checklist say so. Idea from
  huashu-design's `cursor.jsx` (arc, settling wobble, two-ring ripple), written fresh.
- **v1.3.0** (2026-11-20) — Pictures are drawn, never emoji: a new section with a line-style
  recipe for hand-drawn icon sets, a two-scale look (each icon at 4x, the picture at 1x on
  white and `#0d1117`) and a non-ASCII character scan instead of an emoji regex (U+23F0
  slips past the usual ranges). Show it moving gains step 5, demo the real thing: real
  output on an invented input, a recording that clicks through the feature, a tab icon on
  every live demo page, a beat-by-beat fiction check, re-record after any text change, and
  checks on the live result after the push. Three new checklist items. Prompted by a README
  built with v1.2.1 whose diagram put eight emoji in coloured circles, and whose demo
  needed three rounds to stop retelling the real call.
- **v1.2.1** (2026-11-20) — Show it moving, made explicit: with several styles the GIF
  gallery may stand in for the hero and goes right under the title and tagline, above
  badges and value prop; gallery cells `width="33%"` with images `width="100%"`; GitHub
  does not stack a table on phones (three tiles are about 70–100 px wide at 390 px), so
  use one big GIF hero or one tile per row when the phone view matters; a fictional demo
  is invented, not lightly renamed, and checked against the real source for shared
  phrases; commit with the GitHub no-reply email on personal public repos. Four new
  checklist items.
- **v1.2.0** (2026-11-20) — Show it moving: a new recipe section right after the
  section order. A visual project's first screen is a GIF of it moving, linked to a live
  GitHub Pages page; several styles get a gallery table, one GIF tile each with a caption
  and an "open live" link; `examples/record_gif.py` records the GIF under a 4 MB budget
  and you look at six frames before shipping; private content is recorded only from a
  fictional demo copy. The static pixel/ASCII heroes are now the fallback. Two new
  checklist items. Prompted by a README built with this skill that showed three animated
  decks as a still SVG and a diagram.
- **v1.1.0** (2026-11-06) — Hand-drawn status badges: a recipe for drawn pill badges
  that carry claims no service can measure ("Robot vouched", "A human peeked"), never
  a fake live metric; size, dark/light, system-font and alt-text rules; three example
  SVGs in `examples/badges/`; a new "badges are honest" checklist line. Idea from the
  pomodo README's hand-drawn badges.
- **v1.0.0** (2026-06-17) — Initial skill: the house-style README recipe (11-section
  order), voice/copy rules, baked-in ASCII + pixel-SVG hero recipes, badge + install
  patterns, a fill-in template, and a pre-ship quality checklist.
