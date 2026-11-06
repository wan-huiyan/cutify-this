# Agent briefs: what each dispatched agent was told

The worked example ran as two workflows. Reuse the shape; replace the content. State the agent count and model
tier to the user before launching, and choose the tier per dispatch (keep workflows small: the worked example used
3–4 agents per round).

| Stage | Agents | Tier used | Output |
|---|---|---|---|
| 1. Directions | 3, one per style, in parallel | Opus | One prototype each of the SAME moment (one film, ~8–12 s), stills at 1280 and 390, for the user to pick or keep |
| 2. Build | 3, one per style, in parallel, each continuing its own prototype | Opus | All films in that style, following the shared SPEC.md; NOTES.md; stills; structured JSON result |
| 3. Write-up | 1 | Opus | This skill |
| Missing (do it next time) | 1 independent reviewer per style, or 1 for all | Sonnet is enough to check stills against the brief; a person or Opus for "does it read at normal speed" | Findings in `<style>/review/*.md` |

Seven agents in total ran. Opus was used for all of them; the direction and build agents make design judgements
and debug render pipelines, which justified the tier. A reviewer that compares stills to a checklist can be cheaper.

## Stage 1 brief (one per style): must contain

1. What it is: ONE design direction (prototype, not final) for an animated "how it works" illustration in
   <host page>, which must read on a 390 px phone and at 1280 px desktop.
2. Load huashu-art-motion: read `~/.claude/skills/huashu-art-motion/SKILL.md` (open tier), `references/镜头语言.md`
   sections 1–4, `references/色板.md`, and the grammar card the direction names under `references/动画语法/`.
   Write a short shot list first (`references/镜头表模板.md`). Respect the six ways to fail.
3. The host page path (READ ONLY), which parts of it hold the content, and the colour tokens and font.
4. The moment to show, beat by beat, with ONE concrete example threaded through every shot and the exact wording
   of any verdict and reason. What not to invent.
5. Deliverables in its own folder: shot list, sources, `preview.html` (the animation in a mock of the host page,
   honouring reduced motion), `still_1280.png` (1280×800) and `still_390.png` (390×844) at the most telling moment,
   2–3 extra stills, estimated embedded size.
6. Environment facts: Playwright bundled Chromium missing → `channel='chrome'`; ffmpeg path.
7. "Do not write anywhere except your own folder. Report honestly: if text is not legible at 390, say so."
8. The direction itself (formats differ, not palettes):
   - **A** — copy the huashu engine to `<A>/engine`; t1_3b1b grammar (or y1, saying why); render a TEXT-LIGHT 16:9
     mp4 where shapes carry the story; ALL words as HTML labels positioned over the video. Run qa.py / clip_lint
     where applicable; report the blue-purple gate, do not fight it.
   - **B** — copy the huashu engine to `<B>/engine`; y3_whiteboard grammar, dark board; square (or 4:5) mp4 that
     draws the mechanism like a hand on a whiteboard, words written large enough for a 360 px phone.
   - **C** — no video. huashu director rules (shot list, camera as punctuation, one concrete object per beat, one
     palette) implemented as inline SVG + GSAP (pinned) with a virtual camera (viewBox pan/zoom); real text that
     reflows on phones; size = bytes of SVG + JS.
9. A JSON schema for the result: direction, format, preview_html, still paths, est_size_kb, duration_s,
   legible_at_390, reduced_motion_plan, how_it_scales_to_other_films, huashu_steps_followed, risks.

## Stage 2 brief (one per style): must contain

1. "You are continuing your own earlier work", the style in one sentence, and the prototype folder to reuse
   (A: engine copy, scenes, label-track method, preview code; B: engine copy and board code, plus a NEW caption
   strip and step rail; C: build.py, scene, step rail, camera code).
2. "Read the full spec first: <SPEC.md>" (made from `brief-template.md`): feedback, caption script, beats, pacing
   rule, embed contract with the verbatim snippet, budgets.
3. Re-read huashu SKILL.md on camera use and the six failure modes; write a shot list per film before building.
4. The content fixes from the prototype review, by name.
5. Write only under `<style>/final/`; never touch the host page or another folder. Browser `channel='chrome'`.
6. Self-check before finishing, in a test page that loads each file via `iframe srcdoc` at 1100 px and 360 px:
   anim-height arrives, paused until anim-play, wheel/keys/swipe produce deck-* messages, reduced motion shows a
   still + numbered captions, captions readable at 360. "Report honestly what failed."
7. A JSON result schema: files [{film, path, size_kb, duration_s}], stills, notes_path, beat_timings,
   legible_at_360, contract_checks, gates_run, open_issues.

## After stage 2 (the orchestrator, not an agent)

- Read the three `open_issues` side by side. In the worked example all three raised the same conflict (loop target
  vs reading rule) and each resolved it alone; that is a decision for the user, not for three agents.
- Dispatch the independent reviewer(s), then show the user the three styles side by side.
