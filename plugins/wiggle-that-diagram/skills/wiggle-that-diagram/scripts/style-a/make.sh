#!/bin/sh
# Style A one-command rebuild: render (text-free mp4 + player data) -> inline -> pacing gate -> contract test + stills. Inputs: film names; run from the project folder.
# Usage: SKILL=~/.claude/skills/wiggle-that-diagram/scripts/style-a ./make.sh film1 film2
# Expects ./engine (huashu engine copy with eras_<film>.js), ./meta.json, and writes ./work and ./final.
# Set VERDICT_film1=3 (1-based verdict beat) to get a still of that beat. About 1 min render per film, about 1 min of tests per film.
set -e
: "${SKILL:=$HOME/.claude/skills/wiggle-that-diagram/scripts/style-a}"
for f in "$@"; do uv run --with playwright python "$SKILL/render_way.py" "$f" --engine engine --work work --scale 0.75 --crf 30; done
python3 "$SKILL/build.py" "$@" --meta meta.json --work work --out final
for f in "$@"; do python3 "$SKILL/pace_check.py" "work/${f}_data.json"; done
args=""; for f in "$@"; do v=$(eval echo "\${VERDICT_$f:-0}"); args="$args final/$f.html:$v"; done
uv run --with playwright python "$SKILL/test_embed.py" $args --stills final/stills | tee work/test_stdout.txt
