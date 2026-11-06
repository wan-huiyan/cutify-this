#!/usr/bin/env bash
# check-all.sh - run every cheap, offline, deterministic check the bundle has, one line each.
#
#   bash scripts/check-all.sh
#
# Output: PASS / FAIL / SKIP + name per check, then "N checks passed, M skipped" (and "K failed" when any).
# Exit 1 if anything FAILed. SKIP means "could not run here" and is never counted as a pass.
# The one skip that could hide a gap in CI (browser smoke test not set up) is turned into a FAIL when CI is set.
#
# Env overrides (used to prove checks can fail, see tests/repo_consistency.py): MARKETPLACE_JSON, README_PATH.
# One-time setup for the browser smoke test:  npm install --prefix tests && npx --prefix tests playwright install chromium

set -u
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT" || exit 2
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
PY=${PYTHON:-python3}
export PYTHONDONTWRITEBYTECODE=1

PASSED=0; FAILED=0; SKIPPED=0
indent() { sed 's/^/        /' | head -"${1:-12}"; }
pass() { printf 'PASS  %s\n' "$1"; PASSED=$((PASSED + 1)); }
fail() { printf 'FAIL  %s\n' "$1"; FAILED=$((FAILED + 1)); [ -n "${2:-}" ] && printf '%s\n' "$2" | indent; return 0; }
skip() { printf 'SKIP  %s  (%s)\n' "$1" "$2"; SKIPPED=$((SKIPPED + 1)); }
skip_unless_ci() { # a missing browser setup must not turn the CI badge green
  if [ -n "${CI:-}" ]; then fail "$1" "would be skipped ($2) but CI must run it"; else skip "$1" "$2"; fi; }

# check NAME cmd...  -> PASS when the command exits 0
check() { local name=$1; shift; local out; out=$("$@" 2>&1); local rc=$?
  if [ $rc -eq 0 ]; then pass "$name"; else fail "$name" "exit $rc: $(printf '%s\n' "$out" | tail -8)"; fi; }

# Syntax check a set of JS files. Files using import/export are copied to .mjs so node parses them as modules.
js_syntax() { local name=$1; shift; local bad="" n=0 f
  for f in "$@"; do n=$((n + 1)); local t=$f
    if grep -qE '^(import|export) ' "$f"; then t="$TMP/esm$n.mjs"; cp "$f" "$t"; fi
    node --check "$t" >/dev/null 2>"$TMP/err" || bad="$bad$f: $(head -1 "$TMP/err")"$'\n'
  done
  if [ -z "$bad" ]; then pass "$name ($n files)"; else fail "$name" "$bad"; fi; }

# browser_suite LABEL FILE -> one PASS/FAIL line per assertion the Playwright test prints; exit 2 = setup missing.
browser_suite() { local label=$1 file=$2 out rc lines l
  if [ ! -d tests/node_modules/playwright ]; then
    skip_unless_ci "$label" "Playwright not installed: npm install --prefix tests && npx --prefix tests playwright install chromium"; return; fi
  out=$(node "$file" 2>&1); rc=$?
  if [ $rc -eq 2 ]; then skip_unless_ci "$label" "$(printf '%s' "$out" | head -1)"; return; fi
  lines=$(printf '%s\n' "$out" | grep -E '^(PASS|FAIL)  ' || true)
  if [ -z "$lines" ]; then fail "$label" "exit $rc: $(printf '%s\n' "$out" | tail -5)"; return; fi
  while IFS= read -r l; do
    case "$l" in PASS*) pass "${l#PASS  }" ;; *) fail "${l#FAIL  }" ;; esac
  done <<< "$lines"
  [ $rc -ne 0 ] && [ -z "$(printf '%s\n' "$lines" | grep '^FAIL')" ] && fail "$label: exited $rc with no FAIL line" "$(printf '%s\n' "$out" | tail -5)"
  return 0
}
TAB=plugins/cutify-that-tab/skills/cutify-that-tab
SPK=plugins/sparkle-that-page/skills/sparkle-that-page
TERM=plugins/cutify-that-terminal/skills/cutify-that-terminal
HATCH=plugins/hatch-that-world/skills/hatch-that-world
WIG=plugins/wiggle-that-diagram/skills/wiggle-that-diagram

echo "== cutify-that-tab"
check "tab: check-favicon.py --self-test (17 fixtures, every FAIL/WARN/UNCHECKED path fires)" "$PY" $TAB/scripts/check-favicon.py --self-test

# Sweep every shipped example. The _dark file is tested as the pair of its light twin, never alone.
sweep() {
  local f base rc n=0 unchecked="" bad=""
  for f in $TAB/examples/*.svg; do
    base=$(basename "$f" .svg)
    case "$base" in *_dark) continue ;; esac
    n=$((n + 1))
    if [ -f "$TAB/examples/${base}_dark.svg" ]; then "$PY" $TAB/scripts/check-favicon.py "$f" --dark "$TAB/examples/${base}_dark.svg" >"$TMP/fav" 2>&1; rc=$?
    else "$PY" $TAB/scripts/check-favicon.py "$f" >"$TMP/fav" 2>&1; rc=$?; fi
    case $rc in
      0) ;;
      3) unchecked="$unchecked $base" ;;
      *) bad="$bad$base (exit $rc)"$'\n' ;;
    esac
  done
  local want="blob_cheer blob_love_rays blob_sparkles" got
  got=$(printf '%s\n' $unchecked | sort | tr '\n' ' ' | sed 's/ $//')
  [ "$got" = "$want" ] || bad="${bad}UNCHECKED set changed: expected [$want] got [$got]"$'\n'
  if [ -z "$bad" ]; then pass "tab: favicon sweep, $n examples, 0 FAIL, only blob_cheer/blob_love_rays/blob_sparkles UNCHECKED (expected)"
  else fail "tab: favicon sweep of $n examples" "$bad"; fi
}
sweep

# Mood favicons live in examples/moods/ (kept out of the starter sweep): every one must PASS, none UNCHECKED.
moods_sweep() { local f n=0 bad=""
  for f in $TAB/examples/moods/*.svg; do n=$((n + 1))
    "$PY" $TAB/scripts/check-favicon.py "$f" >"$TMP/fav" 2>&1 || bad="$bad$(basename "$f") (exit $?)"$'\n'
  done
  if [ $n -gt 0 ] && [ -z "$bad" ]; then pass "tab: mood favicons, $n files, all PASS"; else fail "tab: mood favicon sweep ($n files)" "$bad"; fi; }
moods_sweep
js_syntax "tab: node --check examples/moods/*.js" $TAB/examples/moods/*.js
browser_suite "tab: mood favicon browser test" tests/tab_moods_smoke.mjs
browser_suite "tab: favicon builder browser test" tests/tab_builder_smoke.mjs

echo "== sparkle-that-page"
js_syntax "sparkle: node --check examples/*.js" $SPK/examples/*.js
js_syntax "sparkle: node --check site/*.js (ES modules)" site/*.js
browser_suite "sparkle: headless browser smoke test" tests/sparkle_smoke.mjs

echo "== cutify-that-terminal"
check "terminal: bash -n verify-glyphs.sh" bash -n $TERM/scripts/verify-glyphs.sh
if command -v zsh >/dev/null 2>&1; then check "terminal: zsh -n zshrc-starship-split.sh" zsh -n $TERM/examples/zshrc-starship-split.sh
else skip "terminal: zsh -n zshrc-starship-split.sh" "zsh not installed"; fi
bash $TERM/scripts/verify-glyphs.sh --self-test >"$TMP/glyph" 2>&1; rc=$?
case $rc in
  0) pass "terminal: verify-glyphs.sh --self-test" ;;
  3) skip "terminal: verify-glyphs.sh --self-test" "needs Ghostty on macOS; exit 3 = UNCHECKED, nothing verified" ;;
  *) fail "terminal: verify-glyphs.sh --self-test" "exit $rc: $(tail -6 "$TMP/glyph")" ;;
esac

echo "== hatch-that-world"
js_syntax "hatch: node --check scripts/*.cjs" $HATCH/scripts/*.cjs

echo "== wiggle-that-diagram"
PYFILES=$(find $WIG/scripts -name '*.py'; echo $WIG/scripts/common/ffprobe-shim/ffprobe)
js_syntax "wiggle: node --check scripts + pizza example JS (style C head/tail are fragments, left out)" \
  $(find $WIG/scripts $WIG/examples -name '*.js' ! -name head.js ! -name tail.js)
# shellcheck disable=SC2086
check "wiggle: every Python script compiles" "$PY" -c 'import sys; [compile(open(f).read(), f, "exec") for f in sys.argv[1:]]' $PYFILES
check "wiggle: bash -n style-a/make.sh" bash -n $WIG/scripts/style-a/make.sh
check "wiggle: pace_check.py on beats.example.json" "$PY" $WIG/scripts/common/pace_check.py $WIG/scripts/common/beats.example.json
check "wiggle: pace_check.py on the pizza demo beats" "$PY" $WIG/scripts/common/pace_check.py $WIG/examples/pizza/beats.json
style_c_rebuild() {
  local E=$WIG/examples/pizza out
  out=$("$PY" $WIG/scripts/style-c/build.py $E/beats.json --src $E/style-c --out "$TMP/c" --css $E/style-c/theme.css 2>&1) || { fail "wiggle: style C rebuild of pizza" "$(printf '%s\n' "$out" | tail -6)"; return; }
  if cmp -s "$TMP/c/pizza.html" docs/wiggle-that-diagram/final/pizza.html; then pass "wiggle: style C build.py rebuilds docs/.../final/pizza.html byte for byte"
  else fail "wiggle: style C rebuild differs from docs/wiggle-that-diagram/final/pizza.html (rebuild the demo or fix the builder)"; fi
}
style_c_rebuild

echo "== repo consistency"
check "repo: marketplace.json valid; versions match plugin.json and SKILL.md" "$PY" tests/repo_consistency.py versions
check "repo: every plugin listed, one SKILL.md each, name matches folder" "$PY" tests/repo_consistency.py skills
check "repo: README relative links and images point at files that exist" "$PY" tests/repo_consistency.py readme-links

echo
if [ $FAILED -gt 0 ]; then echo "$PASSED checks passed, $SKIPPED skipped, $FAILED FAILED"; exit 1; fi
echo "$PASSED checks passed, $SKIPPED skipped"
