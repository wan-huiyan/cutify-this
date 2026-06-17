---
name: pop-that-readme
description: Use when writing or upgrading a GitHub/open-source project's README so it actually pops — a cute, high-signal front page instead of a wall of text. Triggers on "write a README", "make my README pretty/cute/pop/stylish", "polish/redo my repo's README", "README template", "repo front page", "add badges / a hero banner / a feature table / an install section / a demo GIF", "open-source my project's readme", "give my repo a glow-up". Produces a centered pixel/arcade hero, a shields.io badge row, a bold one-line value-prop blockquote, a captioned demo image, a why-it-exists section, an emoji feature/ingredient table, a copy-paste install block, a contributors shoutout, and an honest limitations section. Ships a fill-in template + baked-in hero recipes (ASCII box + pixel SVG). Skip for terse internal-only repos, strict corporate brand templates, or non-README docs (API refs, tutorials).
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
| 1 | **Hero** (centered image/ASCII + title + emoji) | First impression; shows the thing in 1 second. Baked-in recipe below. |
| 2 | **Badge row** | Signals it's alive + legit (license, last-commit, version, "Claude Code skill"). |
| 3 | **Value-prop blockquote** (one bold sentence) | The single most important line. What it does + for whom, concretely. |
| 4 | **Demo image/GIF + `<sub>` caption** | Show, don't tell. Caption explains what the reader is looking at. |
| 5 | **What it does / Why it exists** | The concrete problem + the honest payoff (1–2 short paras). |
| 6 | **Emoji feature/ingredient table** | The proven recipe — skimmable, one emoji + claim + why per row. |
| 7 | **Quick start / Install** (copy-paste block) | The command, reachable without scrolling far. `<details>` for variants. |
| 8 | **Usage example** | A realistic "you say X → it does Y" snippet. |
| 9 | **Contributors** ("Built with love") | `contrib.rocks` image when others helped. |
| 10 | **Limitations / honesty box** | What it's NOT, and where it's weak. Builds trust; separates it from marketing. |
| 11 | License + links | Short footer. |

## Voice & copy rules

- **Value prop = one bold sentence in a blockquote.** Concrete verbs + the audience.
  Not "a tool for productivity" → "**Turn dense technical findings into a plain-English
  HTML explainer your boss will actually read.**"
- **Every claim earns a number or a specific.** "fast" → "renders in <50ms"; "lots of
  options" → "78 starter SVGs".
- **Emoji as wayfinding, not decoration.** One per feature-row / section header, used
  consistently. Don't sprinkle.
- **Honesty is a feature.** A real "Limitations" section (small sample, what's not
  covered) reads as confidence, not weakness.
- **Cute, not childish.** Playful copy + a real type/spacing discipline. "The cutest
  dev tool you've ever seen," not a kids' site.

## Baked-in hero recipe

Two zero-dependency heroes you can drop in. (For richer banners — animated pixel
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
3. Author the hero (recipe above) into `docs/`.
4. **Preserve** anything the old README had that's still accurate (install handles,
   troubleshooting links, contributor credits) — additive, not a wipe.
5. Run the **quality checklist** below.

## Quality checklist (verify before shipping)

- [ ] First screen (no scroll) has: hero, ≥3 badges, and the value-prop sentence.
- [ ] Value prop is **one bold sentence**, concrete, names the audience.
- [ ] Every feature-table claim has a number or a specific (no "fast / powerful / easy").
- [ ] Install command is copy-paste correct and appears above the fold-ish.
- [ ] A demo image/GIF exists (or a clear `docs/…` placeholder + TODO).
- [ ] A real **Limitations** section exists (not omitted).
- [ ] Badge/owner/repo slugs resolve (no 404 shields).
- [ ] Renders cleanly on GitHub (preview it) — tables aligned, code fences closed,
      `<p align="center">` blocks balanced.
- [ ] Contributors credited if anyone else helped (`contrib.rocks`).

## Examples directory

- `README.template.md` — the full fill-in template (every section, `<PLACEHOLDER>`s).
- `hero_examples.md` — the ASCII box hero + a worked pixel-SVG hero, copy-and-edit.

## See also

- **`cutify-that-tab`** / **`sparkle-that-page`** — sibling skills in the `cutify-this`
  bundle (and good examples of the house style in their own READMEs).
- **`pixel-art`**, **`css-animated-svg-scenes`** — for authoring a richer animated hero.
- **`show-and-tell`** — the arcade/honesty aesthetic this recipe descends from.

## Changelog

- **v1.0.0** (2026-06-17) — Initial skill: the house-style README recipe (11-section
  order), voice/copy rules, baked-in ASCII + pixel-SVG hero recipes, badge + install
  patterns, a fill-in template, and a pre-ship quality checklist.
