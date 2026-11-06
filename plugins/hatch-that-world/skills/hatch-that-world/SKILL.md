---
name: hatch-that-world
description: Build a cute, playful single-page app or daily page in the "little world" style of the morning brief — the day or the data drawn as a scene (hills, a draggable sun, a mascot with moods), several switchable worlds (garden, cosmic, candy, caterpillar…) each light and dark with its own sounds, a build-your-own mascot picker, and clickable things in the drawing. Use whenever someone wants to make an app, dashboard, brief, tracker or personal page "cute", "fun", "like the morning brief" or morning-fairy, "with a mascot", "with themes/worlds", "drawn as a little world", or wants to add a new world/theme, mascot, scene element or clickable drawing to such a page — even if they don't name this skill. Also covers the build process that kept it safe: an options page before building, one agent per change on a shared file, and checks that can fail (copy text unchanged, pixel-identical other worlds, geometry and click tests).
---

# Hatch that world 🐛→🦋

How the morning brief in [morning-fairy](https://github.com/wan-huiyan/morning-fairy)
(builder: `plugins/morning-fairy/skills/morning-fairy/digest/build_digest.py`) was built, written down so the next cute app starts from the method and not from scratch. Sister skills:
`cutify-that-tab`, `sparkle-that-page`, `pop-that-readme`.

The idea in one line: **the content stays plain data; one builder turns it into a drawn little world, and every
look is a swappable world.** The reader decides from the picture; the details sit one click away.

## The shape of the app

Read `references/world-anatomy.md` before writing code. The short version:

- **One builder, one self-contained HTML file.** A Python (or Node) builder reads a content JSON and writes a single
  page with all CSS, JS and SVG inline. The content never sets colours, layout or motion; all design lives in the
  builder. That is what lets a new world change nothing about the content or the copy.
- **A world = colour tokens + one scene function + one sound voice.** Tokens on `:root[data-world="x"]` (light and
  dark), a `SCENE.x()` that draws the ground, sky, sun/moon, signposts and mascot spot as SVG, and an oscillator
  voice in the sound table. Adding a world touches only those three places plus the world picker and the
  whitelist that reads the saved choice. If you find yourself editing content or copy to add a world, stop.
- **The scene is the data.** Meetings lift the ground into hills by weight; the sun rides the clock and can be
  dragged; "now" is where the mascot stands. Make the drawing carry a real quantity, never decoration only.
- **A mascot with moods** derived from the data (sweat when something is overdue, starry when nothing waits,
  sleepy after 6 PM). Moods come from rules in the builder, not from the content.
- **The drawing is clickable, but the drawing stays `aria-hidden`.** Put an invisible layer of real `<a href="#row">`
  links over it, placed from the drawing's geometry on every redraw. Each link opens the section holding its row,
  unfolds any `<details>`, scrolls and flashes the row. Keyboard order = time order, visible focus ring.
- **Calm when asked.** Every animation has a reduced-motion guard; with reduced motion nothing flies, bobs,
  wiggles or sparkles, and a finale becomes a still picture.

## Fitting it to a new app (not every app is a day of meetings)

- **Pick the axis first.** The scene's left-to-right is the data's natural order: hours of today (the brief), the
  last 30 days (a log), the stages of a funnel, the weeks of a term. The sun (or moon, or a lantern) marks "now" on
  that axis and the mascot stands there. Dragging the marker scrubs through the axis.
- **Map each quantity to the channel that suits it,** and write the mapping in the plan before drawing:
  a continuous amount over the axis (pages per day, hours booked) → the ground's height;
  separate items (books, meetings, tasks) → objects standing on the ground (signs, trees, spines), sized by one
  amount at most; an ordinal score (a 1–5 rating) → a small accent (stars, a glow), never size; one overall state
  (streak, overdue, all done) → the mascot's mood. Two grains (per day and per item) is normal: ground for one,
  objects for the other.
- **Show missing data as missing.** Unrated is not 1 star; a day with no record is not a day with 0; an unfinished
  item looks different from a finished one. Say in the plan how each gap is drawn.
- **Size the process to the job.** A small new page: build it yourself in one go, still with the options page and
  the checks. The one-agent-at-a-time rule, backups and dated plans exist for a big file that changes often; use
  them once the page is big or shared. Always state agent count and tier before launching any.
- **The options page covers only what the user hasn't decided.** If they named the worlds ("a bookshelf and a
  forest"), offer choices for the scene shape and mascot, not for the worlds. Two worlds is plenty to start; the
  brief grew to four over many rounds.
- **Optional extras, only when asked:** sounds, the build-your-own picker, a local helper that saves choices. A
  remembered world in localStorage is enough for a first version.
- **"Daily" means a rebuild.** Either a scheduled task runs the builder each morning, or a small local server
  builds on request. Ask which; default to a one-line rebuild command and offer the schedule.
- **Rename the examples' storage keys** (`brief-world`, `jira-digest-layout` are the brief's own). The scripts need
  Playwright plus installed Chrome (`PWC` = the Playwright folder). The brief's builder is Python; match whatever
  the new project uses.

## The build process (this is what kept a 6,000-line single file from breaking)

1. **Brainstorm, then an options page before any build.** Load `design-an-interface` and make one HTML page that
   shows 3–4 radically different directions as **live phone-width slices of the real page with real data**, not
   mockups of nothing. Add a picks copy-back (`promptback`) so the owner ticks choices and pastes them back.
   Every look in the brief — the worlds, the mascot, the caterpillar — was chosen this way.
2. **A dated plan file per change** (`YYYY-MM-DD-plan-<thing>.md`) with the owner's words, what it is, the rules,
   and the checks. Owner feedback goes into the plan as a rule *with a check that would fail on the old version*
   (example: "the head looks detached" became "head-to-neck distance < 0.75 × radii at every 10 minutes").
3. **One agent at a time on the shared file**, top tier, because the builder is one big file and two agents would
   overwrite each other. Back up first (`<file>.bak-<round>-before-<thing>`), and back up fixtures too. While one
   agent runs, write the next plan; dispatch the next only when the first has reported and been checked.
4. **The agent never writes to real data.** It builds with *copies* of the logs into a scratch folder, stubs the
   local helper's POSTs, and never touches the live output or the user's saved look.
5. **Check, then look.** Run the checks in `references/checks.md`, then open the screenshots yourself. A report that
   says "PASS" is not the same as having seen it; one look caught a detached head, another a sign floating in the sky.
6. **Rebuild the live page** with the real logs, then confirm the logs' md5 is unchanged (except a change you meant)
   and the copy text is identical.
7. **When usage or time runs short**, tell the running agent to stop at a working state (tests green, or restore its
   backup) and write `PROGRESS.md`; copy plans and check scripts out of `/tmp` into a durable handoff folder.

## Checks that can fail

Details and the scripts are in `references/checks.md` and `scripts/`. The four that earned their keep:

| Check | Catches | Script |
|---|---|---|
| Copy text identical | a visual change that silently changed what gets copied or sent | `scripts/copy_identical.cjs` |
| Other worlds pixel-identical | a new world or feature that leaked into the old ones | `scripts/pixel_regress.cjs` |
| Geometry probe | shapes that look wrong at some times of day (detached head, overlapping signs) | write per feature; pattern in checks.md |
| Hit test | a clickable drawing where the pointer lands on the wrong thing | `scripts/hit_check.cjs` |

**On a first build** there is no "before", so copy and pixel checks start from the second change. Instead run:
a **data check** (build from a small fixture with known numbers and assert each drawn size or height matches its
value, e.g. the tallest spine is the longest book), an **escape check** (a title containing `<b>&"` renders as
text and the drawing survives), the geometry probe and the hit test.

Rule for every check: **prove it fails on the old build** (or a deliberately broken copy) before trusting it passes. Run a
before-vs-before pixel comparison first to learn the noise floor (blocked web fonts and seeded `Math.random` get it
to a handful of pixels).

## Things that bit us (read before building)

- **Escape everything that goes into the SVG drawing.** A `<` in a calendar title turned the rest of the scene into
  HTML; any text from outside data is an injection hole inside an inline SVG string.
- **A drawn thing under the sun:** if the sun is draggable and sits over a link, hand the press to the sun so
  dragging still works. Your hit test should report that as "covered by a higher layer", not as a failure.
- **Code spliced into another world at anchor strings** (the caterpillar reuses garden code) must fail soft: a moved
  anchor prints a warning and the page ships without that world. An unattended morning build must never fail on
  a cosmetic feature. Tests stay strict.
- **A remembered choice needs a whitelist.** The saved world/look is read from localStorage before paint; only known
  values are accepted, so a removed world can't leave a blank page.
- **Fan art and icon sets:** link third-party art from the artist's own repo, pinned to a commit, with a visible
  credit, and fall back to your own mascot when offline — never copy it into your repo. MIT icon sets can be
  bundled with their LICENSE and a NOTICE file. Embed only the style in use, not the whole set.
- **A file page can't save.** A page opened from disk has `Origin: null`, so a local helper must refuse its POSTs;
  give the button a path to the served page with the choices carried in the URL hash instead of greying it out.
- **Don't claim a count in the README you didn't re-measure** after a feature lands ("14 reduced-motion guards",
  "17 sounds"): recount or drop the number.

## Making a public copy

Keep the private builder as the source; a small `clean_builder.py` makes the public copy with assert-count
replacements (each private string must be found exactly the expected number of times, so a drifted anchor stops
the port instead of leaking). Then `skill-anonymizer`'s leak scan, a README via `pop-that-readme` with pictures made
from made-up demo data, version bumped in every manifest, CI on all runners, merge, release. Confirm the PR reads
`merged: true` before deleting its branch.

## Companion skills — load the one the moment calls for (if installed)

The cutify-this bundle has three of them (`cutify-that-tab`, `sparkle-that-page`, `pop-that-readme`); the rest are
separate skills. Without one, do that step by hand.

| Moment | Load |
|---|---|
| Choosing between looks or layouts | `design-an-interface`, then `promptback` for the picks |
| Designing or polishing a screen | `impeccable` |
| Section transitions, scroll motion | `gpt-taste` (heavy), `choreograph` (several elements), `animate` (one) |
| Browser-tab icon, asleep at night | `cutify-that-tab` |
| Cursor wand, fairy dust, confetti, secret party | `sparkle-that-page` |
| Charts or a quantity drawn into the scene | `dataviz` |
| Public README | `pop-that-readme` |
| Before anything goes public | `skill-anonymizer` |
