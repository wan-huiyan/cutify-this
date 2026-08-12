#!/usr/bin/env bash
#
# verify-glyphs.sh — prove every glyph your prompt draws will actually render.
#
# The failure this exists for: a "cute terminal" setup looks finished, and then
# half the prompt is "?" boxes. Every guide says install a Nerd Font and paste a
# config; none of them check that the glyphs resolved. This does.
#
# Three separate questions, because they fail for different reasons:
#
#   1. COVERAGE  Does any font on this machine have these glyphs at all?
#                No  -> boxes everywhere, in every terminal. Hard fail.
#   2. SOURCE    Are they coming from the font you configured, or from a
#                fallback? A fallback works today and breaks the day that other
#                font is removed, and it usually means the name in your config
#                is wrong. Ghostty never warns about this - it falls back
#                silently, which is exactly why it goes unnoticed.
#   3. TERMINAL  Are you actually in Ghostty? If not, whether these glyphs
#                render depends on THAT terminal's own font setting, which this
#                script cannot read. Reported as UNCHECKED, never as a pass.
#
# Usage:
#   verify-glyphs.sh                      # check the prompt in this shell
#   verify-glyphs.sh --config <file>      # check one specific starship config
#   verify-glyphs.sh --self-test          # prove the FAIL path actually fires
#
# Exit codes, deliberately three-valued:
#   0  PASS       every glyph resolves, from the font you configured
#   1  FAIL       at least one glyph has no font at all, or comes from a fallback
#   3  UNCHECKED  the check could not run
#
# 3 is not 0. A check that could not run is not a pass.

set -uo pipefail

CONFIG="${STARSHIP_CONFIG:-}"
SELFTEST=0

while [ $# -gt 0 ]; do
  case "$1" in
    --config)    CONFIG="${2:-}"; shift 2 ;;
    --self-test) SELFTEST=1; shift ;;
    -h|--help)   sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 3 ;;
  esac
done

say()   { printf '%s\n' "$*"; }
unchk() { say ""; say "UNCHECKED - $*"; say "Nothing was verified. This is not a pass."; exit 3; }

# ---- locate ghostty ------------------------------------------------------
# The CLI lives inside the app bundle and is only on PATH inside Ghostty, so
# find it rather than requiring the caller to already be in the right terminal.
GHOSTTY="$(command -v ghostty 2>/dev/null || true)"
if [ -z "$GHOSTTY" ] && [ -x "/Applications/Ghostty.app/Contents/MacOS/ghostty" ]; then
  GHOSTTY="/Applications/Ghostty.app/Contents/MacOS/ghostty"
fi
[ -n "$GHOSTTY" ] || unchk "Ghostty was not found. This check asks Ghostty which font draws each glyph."
command -v python3 >/dev/null 2>&1 || unchk "python3 was not found. It pulls the icon codepoints out of the rendered prompt."
command -v starship >/dev/null 2>&1 || unchk "starship was not found, so there is no prompt to inspect."

# ---- which font is configured --------------------------------------------
CFG="${XDG_CONFIG_HOME:-$HOME/.config}/ghostty/config"
FONT=""
[ -f "$CFG" ] && FONT="$(grep -E '^[[:space:]]*font-family[[:space:]]*=' "$CFG" \
                         | tail -1 | sed 's/^[^=]*=[[:space:]]*//' | sed 's/[[:space:]]*$//')"
CONFIGURED="$FONT"
[ -n "$FONT" ] || CONFIGURED="(none set - Ghostty's built-in default)"

say "Terminal        : ${TERM_PROGRAM:-${TERM:-unknown}}"
say "Font configured : $CONFIGURED"

# ---- does that name match an installed family? ---------------------------
NAME_OK=1
if [ -n "$FONT" ]; then
  if "$GHOSTTY" +list-fonts 2>/dev/null | grep -qxF "$FONT"; then
    say "Font name       : matches an installed family exactly"
  else
    NAME_OK=0
    say "Font name       : NO EXACT MATCH. Ghostty falls back silently - no error,"
    say "                  just the wrong font. Run  ghostty +list-fonts  and copy"
    say "                  the name verbatim."
  fi
fi

# ---- render the prompt ----------------------------------------------------
if [ -n "$CONFIG" ]; then
  say "Starship config : $CONFIG"
  PROMPT="$(STARSHIP_CONFIG="$CONFIG" starship prompt --status=0 2>/dev/null)"
else
  say "Starship config : the default (~/.config/starship.toml)"
  PROMPT="$(starship prompt --status=0 2>/dev/null)"
fi
[ -n "$PROMPT" ] || unchk "starship produced no prompt to check."

# ---- pull out the icon codepoints the prompt actually draws ---------------
# Only the private-use ranges matter: those are the Nerd Font icons, the ones
# that go missing. Ordinary text and emoji resolve from system fonts anyway.
EXTRA=""
[ "$SELFTEST" = "1" ] && EXTRA="$(python3 -c 'print(chr(0xF8000),end="")')"

GLYPHS="$(printf '%s' "$PROMPT" | python3 -c '
import sys, re
s = re.sub(r"\x1b\[[0-9;]*m", "", sys.stdin.read())
seen, out = set(), []
for ch in s:
    cp = ord(ch)
    if (0xE000 <= cp <= 0xF8FF or 0xF0000 <= cp <= 0xFFFFD) and cp not in seen:
        seen.add(cp); out.append(ch)
sys.stdout.write("".join(out))
')$EXTRA"

if [ "$SELFTEST" = "1" ]; then
  say ""
  say "SELF-TEST: injecting U+F8000, a codepoint no font on any machine has."
  say "If the run below does not FAIL, this script cannot detect a missing glyph"
  say "and every PASS it has ever printed is worthless."
fi

say ""
if [ -z "$GLYPHS" ]; then
  say "PASS - this prompt uses no icon glyphs at all, so nothing can render as a box."
  say "       That is what the no-nerd-font preset is for, and it is the right"
  say "       choice for Apple Terminal, VS Code and ssh sessions."
  exit 0
fi

say "Icon glyphs used: $(printf '%s' "$GLYPHS" | python3 -c 'import sys;sys.stdout.write(str(len(sys.stdin.read())))')"
say ""

# ---- ask Ghostty which face draws each glyph ------------------------------
REPORT="$("$GHOSTTY" +show-face --font-family="${FONT:-}" --string="$GLYPHS" 2>&1)"

MISSING=0
FALLBACK=0
while IFS= read -r line; do
  [ -n "$line" ] || continue
  case "$line" in
    *"not found"*)
      MISSING=$((MISSING + 1)); printf '  MISSING   %s\n' "$line" ;;
    *"internal sprites"*)
      printf '  ok        %s\n' "$line" ;;
    *"found in face"*)
      FACE="$(printf '%s' "$line" | sed 's/.*found in face .\(.*\).\./\1/')"
      if [ -n "$FONT" ] && [ "$FACE" != "$FONT" ]; then
        FALLBACK=$((FALLBACK + 1)); printf '  fallback  %s\n' "$line"
      else
        printf '  ok        %s\n' "$line"
      fi ;;
    *) printf '            %s\n' "$line" ;;
  esac
done <<EOF
$REPORT
EOF

say ""
STATUS=0

if [ "$MISSING" -gt 0 ]; then
  STATUS=1
  say "FAIL - $MISSING glyph(s) have no font on this machine at all. They will"
  say "       render as a box in every terminal, not just this one."
  say ""
  say "  Install the Nerd Font build of your font and set the exact name:"
  say "    brew install --cask font-<name>-nf"
  say "    ghostty +list-fonts | grep -i <name>     # copy it verbatim"
  say "  Or drop icons entirely, which cannot break anywhere:"
  say "    starship preset no-nerd-font -o ~/.config/starship-plain.toml"
fi

if [ "$FALLBACK" -gt 0 ]; then
  STATUS=1
  say "FAIL - $FALLBACK glyph(s) render, but NOT from the font you configured."
  say "       They come from a fallback, so this works by luck: it breaks the day"
  say "       that other font is uninstalled, and it usually means the name in"
  say "       your config is wrong (the plain build instead of the NF build, or a"
  say "       spelling Ghostty could not match). Ghostty never warns about this."
  say ""
  say "  Set font-family to the family that is actually drawing them, above."
fi

if [ "$NAME_OK" = "0" ] && [ "$STATUS" = "0" ]; then
  STATUS=1
  say "FAIL - the configured font name matches nothing installed."
fi

if [ "$STATUS" = "0" ]; then
  say "PASS - every glyph resolves, from the font you configured."
fi

# ---- the part this script cannot see --------------------------------------
case "${TERM_PROGRAM:-}" in
  ghostty|Ghostty) ;;
  *)
    say ""
    say "UNCHECKED for this terminal. You are in '${TERM_PROGRAM:-${TERM:-unknown}}',"
    say "not Ghostty. Everything above describes what GHOSTTY would draw; whether"
    say "this terminal draws them depends on its own font setting, which this"
    say "script cannot read. If your prompt has icons and this terminal is not set"
    say "to a Nerd Font, it will show boxes. The per-terminal split in the skill"
    say "is the fix: icons for Ghostty, a plain prompt everywhere else."
    ;;
esac

exit "$STATUS"
