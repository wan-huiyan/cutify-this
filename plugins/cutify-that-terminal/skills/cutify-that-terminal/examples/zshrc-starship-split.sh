# Append to ~/.zshrc. This block must stay LAST — Starship wraps whatever the
# prompt is at the point it runs, so anything setting a prompt after it wins.
#
# WHY THE SPLIT: the pretty prompt draws icon glyphs. Ghostty is set to a Nerd
# Font, so it has them. Apple Terminal, VS Code and ssh sessions use their own
# font settings, and there they render as "?" boxes. One prompt cannot be right
# in both places, so pick per terminal.
#
#   Ghostty       -> ~/.config/starship.toml         icons, colour blocks
#   anywhere else -> ~/.config/starship-plain.toml   no icons, cannot break
#
# Create the plain one once:
#   starship preset no-nerd-font -o ~/.config/starship-plain.toml
#
# KNOWN GAP in that preset, as of starship 1.26.0: it does not override
# git_branch, whose default symbol IS a Nerd Font glyph, so one box survives.
# Append this to the plain config to close it:
#
#   [git_branch]
#   symbol = ""
#
# To turn the prompt off entirely: comment out the `eval` line, open a new tab.

if [[ -n "$GHOSTTY_RESOURCES_DIR" || "$TERM" == "xterm-ghostty" ]]; then
  export STARSHIP_CONFIG="$HOME/.config/starship.toml"
else
  export STARSHIP_CONFIG="$HOME/.config/starship-plain.toml"
fi
eval "$(starship init zsh)"

# Testing the split without opening four terminals — note the -i, an
# INTERACTIVE shell. `zsh -lc` skips .zshrc entirely and silently reports
# nothing, which looks exactly like the block not working:
#
#   GHOSTTY_RESOURCES_DIR=/x zsh -lic 'echo ${STARSHIP_CONFIG##*/}'   # icons
#   TERM=xterm-256color      zsh -lic 'echo ${STARSHIP_CONFIG##*/}'   # plain
