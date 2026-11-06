# Hand-drawn badges

Three 24 px-high pills, each under 1.5 KB: `robot-vouched.svg`, `human-peeked.svg`,
`fuelled-by-tea.svg`. Copy one, then change:

1. the label text, and the `textLength` next to it (about 7 px per character at font-size 12),
2. the pill `width` (in `width` and `viewBox`, and the two `rect`s),
3. the pill fill (keep white text above 4.5:1 contrast),
4. the character, drawn in the left 24 px.

Use in a README:

```markdown
[![Robot vouched: an agent saw this work in a browser](docs/badges/robot-vouched.svg)](docs/verification.md)
```

Only for claims with no live data. Tests, coverage and builds stay on shields.io.
