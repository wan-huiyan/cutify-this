---
name: inspire-that-deck
description: Use when someone wants an HTML slide deck, retro, recap, training or onboarding deck to feel cute, playful, warm or game-like ("make my slides cute", "scrapbook style", "like a cozy game", "add some personality to this deck") or asks for ideas for slide elements such as washi tape, polaroids, sticky notes, stamps, stickers, a pixel mascot, a dialogue box, an XP or progress bar, inventory slots or a loot reveal. Gives principles and a live gallery of single elements to borrow and adapt, never a template to fill in.
---

# Inspire that deck 🎟️

A gallery of small, cute slide elements, each shown working on its own, plus the principles for choosing
them. It is a mood board for your AI, **not a template**: the deck should grow out of the user's own
content, and borrow one or two pieces where a slide has a moment they fit.

Open the gallery first and look at it in a browser: `examples/gallery.html`
(live: https://wan-huiyan.github.io/cutify-this/plugins/inspire-that-deck/skills/inspire-that-deck/examples/gallery.html).
Every piece carries three notes: the moment it **fits**, when to **skip it**, and what it must **keep**.

## Principles (these hold for any style, not just the two shown)

1. **Start from the point, not the piece.** Write each slide's one point first. Only then ask whether
   the slide has a moment an element suits: a decision (a stamp), someone's own words (torn paper),
   progress through a list (an XP bar), a reminder (a sticky note), a surprise (a loot reveal).
2. **One star per slide.** One element carries the slide; the rest stays plain type and space.
3. **Match the tone of the news.** Bad news, a worrying figure, an apology or a loss gets clean type and
   no bounce. A game bar on a real business number makes the number look like a toy.
4. **Motion is a bonus, never the message.** Every slide must read fully with motion switched off
   (`prefers-reduced-motion`). Entrances are short (well under a second), happen once, and land after
   the words, so people read first.
5. **Draw it, don't paste it.** Icons and sprites are hand-drawn SVG, never emoji (emoji render
   differently on every system and cannot take your palette). Torn edges and tape come from CSS
   (`clip-path`, gradients), so no image files are needed.
6. **Readable first.** Body text at slide size (24 px and up on a 1920×1080 slide), contrast 4.5:1 or
   better, handwriting fonts only for short labels and captions.
7. **Interactive means real controls.** Anything you click (a tick, a chest, a "+1" button) is a
   `<button>` a keyboard can reach, and a progress bar has a text count next to it.
8. **Invent your own pieces.** The gallery shows two styles; the user's topic may suggest a third
   (a recipe card, a boarding pass, a field notebook). Use the notes' shape (fits / skip it when / keep)
   to judge any new piece before using it.

## How to use the gallery

- Read the user's content, list each slide's point, and mark the two or three moments worth a piece.
- Open the gallery, pick pieces for those moments, and **rebuild them in the deck's own palette and
  words**. Copying the CSS idea is fine; copying the bake-sale text or colours wholesale is not the point.
- Show the user the slides with and without the pieces if they are unsure; less is usually better.
- After building, look at every slide rendered (light and dark if the deck has both, and once with
  reduced motion) before calling it done.

## What is in the gallery

| Style | Pieces |
|---|---|
| Scrapbook | washi tape holding a card, polaroid with a pin, sticky note that slaps on, torn paper for a quote, stickers with a white edge, a stamp on a decision, a checklist you tick live |
| Cozy quest | a mascot that bobs, a dialogue box that types itself, an XP bar you fill by clicking, inventory slots, a loot reveal |

For a stamp or confetti triggered by a click anywhere on a page, see `sparkle-that-page`. For a whole
app drawn as a scene, see `hatch-that-world`. For an explainer animation on a slide, see
`wiggle-that-diagram`.

## Checks

`tests/deck_gallery_smoke.mjs` (run by `scripts/check-all.sh`) opens the gallery in a headless browser
and checks that every piece has its three notes, that the interactive pieces respond to a click and a
keyboard, that nothing moves with reduced motion on, that no emoji appear inside a picture, and that the
page does not scroll sideways on a phone.
