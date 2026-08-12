---
name: cutify-that-terminal
description: |
  Make a macOS terminal cute and then PROVE it renders — themes, rounded
  fonts, and a coloured Starship prompt, with a verification step that catches
  the "?" boxes before the user sees them. Use when the user asks to make their
  terminal prettier, cuter, nicer, less boring; wants a colour scheme or theme
  (Catppuccin, Rosé Pine, Tokyo Night, Gruvbox, Everforest); wants a nicer
  prompt, a git-aware prompt, Starship, Oh My Zsh, or Powerlevel10k; asks about
  Nerd Fonts, powerline symbols, or icon glyphs; or reports that their prompt
  shows "?" boxes, empty rectangles, tofu, question marks in diamonds, or
  broken/missing icons after following a ricing guide. Also covers keeping one
  terminal's prompt separate from another's, and choosing between Ghostty,
  iTerm2, kitty, WezTerm, Alacritty and Warp. Scope is macOS + Homebrew + zsh,
  centred on Ghostty. Skip for Linux or Windows setups, for shells other than
  zsh, and when the user only wants a web page cutified — that is the sibling
  skill sparkle-that-page.
author: Claude Code
version: 1.0.0
date: 2026-08-12
---

# Cutify That Terminal ✨

Make the window you stare at all day pleasant to look at — a theme, a rounded
font, a prompt that tells you the branch you are on — and then **prove every
glyph actually renders** before calling it done. That last part is the whole
point of this skill. Everything else here is four Homebrew commands.

## Problem

Terminal ricing guides all end the same way: install a Nerd Font, paste this
config, enjoy. None of them verify. So the user pastes it, the prompt comes
back with `?` boxes where the icons should be, and there is no error message
anywhere to explain it — because nothing errored. A font name that matches
nothing falls back **silently**. A preset that leaves one icon behind still
loads fine. A terminal that was never given the font just draws boxes.

The user cannot debug this, because every layer reports success.

## Context / Trigger conditions

Use when **any** of:

- "make my terminal cuter / prettier / nicer / less ugly", "my terminal is boring".
- A theme by name: Catppuccin, Rosé Pine, Tokyo Night, Gruvbox, Everforest, Nord, Dracula.
- "nicer prompt", "show the git branch in my prompt", "Starship", "Oh My Zsh", "Powerlevel10k".
- "Nerd Font", "powerline symbols", "what font should my terminal use".
- **The bug**: "my prompt shows question marks / boxes / weird symbols", "the icons
  are broken", "tofu", "it looks fine in one terminal but not the other".
- "which terminal should I use", Ghostty vs iTerm2 vs kitty vs WezTerm vs Warp.

**Skip** if: the platform is Linux or Windows (the ideas port, the commands do
not); the shell is not zsh; or the user wants a web page made cute — that is
**`sparkle-that-page`**, the sibling skill.

## Before you touch anything — the safety contract

This skill differs from the rest of the `cutify-this` bundle in one way that
matters: the others drop a file into a project and revert by deleting it. This
one **installs software and edits the user's shell config**. A broken `.zshrc`
means a shell that will not start. So:

- **Back up `~/.zshrc` before the first edit**, with the date in the name, and
  tell the user the path. `cp ~/.zshrc ~/.zshrc.backup-$(date +%F)`.
- **Show the diff** of what you are appending before appending it.
- **Never reorder or rewrite existing lines.** Append only.
- **Say what gets installed** before running Homebrew, not after.
- **Give the undo in the same breath as the change**: comment out one line,
  open a new tab.

Do not skip the backup because the file looks short.

## Solution — four levers, in this order

Cuteness comes from four things, and the terminal app is the least important of
them. Do them in this order; each one is visible before you start the next.

### 1 · The terminal — only if they do not have one they like

Do not move someone off a terminal they are happy in. If they have no strong
preference on macOS, **Ghostty** is the recommendation: native, GPU-drawn, and
it needs no config to be good.

```bash
brew install --cask ghostty
```

The honest comparison, one line each: **iTerm2** is the mature alternative and
the only one with real tmux integration — worth it if they work on remote hosts.
**Warp** has built-in AI, which is redundant next to Claude Code and costs a
cloud account. **kitty**, **WezTerm** and **Alacritty** are all fine and all
need more configuring to reach the same place.

**Gotcha — restart after installing fonts.** Ghostty enumerates system fonts at
startup. `Cmd+Shift+,` reloads *settings* but not the font list, so a font
installed while it is running is invisible until a real quit and reopen. This
looks exactly like a broken config and wastes a lot of time.

### 2 · The theme — free, instant, and the biggest visible change

Ghostty ships **463** themes. Nothing to install.

```bash
ghostty +list-themes      # live preview: the window repaints as you arrow through
```

Run it *inside Ghostty* — the `ghostty` command is only on PATH there. Then put
the name in `~/.config/ghostty/config` as `theme = <name>`, and `Cmd+Shift+,`.

The soft ones people usually mean by "cute": **Catppuccin Mocha** (the popular
one), **Rosé Pine** (dusty rose, more grown-up), **Rosé Pine Dawn** and
**Catppuccin Latte** (light), **Sakura** (the most literally pink),
**Everforest** and **Kanagawa** (quieter, warmer).

Offer the light/dark pair rather than pinning one:

```
theme = dark:Catppuccin Mocha,light:Catppuccin Latte
```

### 3 · The font — changes the feel more than the palette does

A rounded typeface does more for "cute" than any colour scheme. Two good ones:

```bash
brew install --cask font-maple-mono-nf   # rounded, still a serious work font
brew install --cask font-comic-mono      # rounded, genuinely playful
```

**Install the `-nf` build if there will be a prompt with icons.** `NF` is the
Nerd Font build: the same typeface *with* the icon glyphs. The plain build is
the same typeface *without* them.

**Gotcha — the package name is not the font name.** The cask is
`font-maple-mono-nf`; the family Ghostty wants is `Maple Mono NF`. Always copy
it from `ghostty +list-fonts` verbatim. A name Ghostty cannot match produces no
error at all — it silently falls back, and the user just sees the wrong font.

### 4 · The prompt — where most of the visible change actually is

A bare zsh prompt is `user@host dir %`. Starship replaces it with something
that reads its surroundings: the git branch, whether the tree is dirty, the
language version a project pins, and whether the last command failed.

```bash
brew install starship
starship preset catppuccin-powerline -o ~/.config/starship.toml   # matches the theme above
```

Then append the block from `examples/zshrc-starship-split.sh` to `~/.zshrc`
(after backing it up). Twelve presets ship built in — `starship preset --list`.
Seven redesign the whole prompt; five only swap icons and keep the default
layout. Say which kind you are offering.

**Gotcha — the `no-nerd-font` preset is not icon-free.** As of starship 1.26.0
it does not override `git_branch`, whose default symbol is a Nerd Font glyph.
One box survives, in the preset whose entire job is to have none. Append:

```toml
[git_branch]
symbol = ""
```

## Verify — the step every guide skips

**Run `scripts/verify-glyphs.sh` before telling the user it is done.** It asks
Ghostty which font would draw each icon in the rendered prompt, rather than
trusting that the config was right.

```bash
./scripts/verify-glyphs.sh                     # the prompt in this shell
./scripts/verify-glyphs.sh --config <file>     # one specific starship config
./scripts/verify-glyphs.sh --self-test         # prove the FAIL path still fires
```

It answers three questions that fail for different reasons, and exits `0` PASS,
`1` FAIL, `3` UNCHECKED. **`3` is not `0`** — a check that could not run is
reported as not-run, never as a pass.

- **Coverage** — does any font on this machine have these glyphs at all?
- **Source** — do they come from the font that was configured, or from a
  fallback? A fallback works today and breaks the day that other font is
  removed, and it usually means the configured name is wrong.
- **Terminal** — is this actually Ghostty? If not, whether the glyphs render
  depends on that terminal's own font setting, which the script cannot read.
  Reported UNCHECKED.

**The non-obvious finding this is built on: Ghostty bundles its own "Symbols
Nerd Font" as a fallback.** So icons render in Ghostty *even when no Nerd Font
is installed and even when `font-family` is wrong*. This is why the bug is so
confusing in practice — the terminal you configured looks perfect, and only the
*other* terminal shows boxes. Checking by eye in Ghostty proves nothing about
anywhere else. Checking the whole story is what the script is for.

Also verify by hand:

- [ ] Quit and reopen the terminal after installing any font (see the gotcha above).
- [ ] Open a **new tab** after editing `.zshrc` — the shell only reads it at startup.
- [ ] **Eyeball it.** No script proves "cute". Look at the prompt.

## Keep terminals separate

The most common real complaint is not "it is broken", it is "it is broken *in
the other terminal*". One prompt cannot be right in both a Nerd-Font terminal
and a stock one, so pick per terminal. Starship reads `$STARSHIP_CONFIG`, so
this is a few lines in `.zshrc` — the full block is in
`examples/zshrc-starship-split.sh`:

```bash
if [[ -n "$GHOSTTY_RESOURCES_DIR" || "$TERM" == "xterm-ghostty" ]]; then
  export STARSHIP_CONFIG="$HOME/.config/starship.toml"        # icons
else
  export STARSHIP_CONFIG="$HOME/.config/starship-plain.toml"  # no icons
fi
eval "$(starship init zsh)"
```

**Gotcha — testing this needs an *interactive* shell.** `zsh -lc` does not read
`.zshrc` at all and reports nothing, which looks identical to the block not
working. Use `zsh -lic`:

```bash
GHOSTTY_RESOURCES_DIR=/x zsh -lic 'echo ${STARSHIP_CONFIG##*/}'   # starship.toml
TERM=xterm-256color      zsh -lic 'echo ${STARSHIP_CONFIG##*/}'   # starship-plain.toml
```

## One thing that is not a bug

If the user says scrolling is broken, or that a key they were told to press
does not exist: **Mac laptop keyboards have no Page Up, Page Down, Home or End
keys.** They are made with `Fn` + an arrow. This comes up constantly because
terminal documentation assumes a full-size keyboard.

| Key | On a MacBook |
|---|---|
| Page Up / Page Down | `Fn` + `↑` / `↓` |
| Home / End | `Fn` + `←` / `→` |

And inside a full-screen program like Claude Code, Ghostty's own scroll
keybinds do nothing — that program draws on the alternate screen, which has no
scrollback behind it to scroll. That is correct behaviour, not a broken bind.

## Examples directory

| File | What it is |
|---|---|
| `scripts/verify-glyphs.sh` | The verification step. Three-valued exit, and a `--self-test` that proves it can still fail. |
| `examples/ghostty-config` | Annotated starter config — theme, font, and the two behaviour settings worth changing. |
| `examples/zshrc-starship-split.sh` | The per-terminal prompt block, with the interactive-shell testing gotcha. |

## Prior art / see also

- **[Ghostty](https://ghostty.org)** — Mitchell Hashimoto's terminal; the themes and glyph inspection this skill leans on are its own features.
- **[Starship](https://starship.rs)** — the cross-shell prompt, and the twelve presets.
- **[Catppuccin](https://catppuccin.com)** — the pastel palette, ported to hundreds of apps.
- **[Nerd Fonts](https://www.nerdfonts.com)** — the patched fonts that carry the icon glyphs, and the source of the whole tofu problem.

Sibling skills in this bundle: **`cutify-that-tab`** (favicons),
**`sparkle-that-page`** (page effects), **`pop-that-readme`** (READMEs).

## Changelog

- **v1.0.0** (2026-08-12) — Initial skill: four levers (terminal, theme, font,
  prompt) for macOS + Homebrew + zsh, a `verify-glyphs.sh` that checks glyph
  coverage, font-fallback source and terminal identity with a three-valued exit
  and a self-test, the per-terminal `STARSHIP_CONFIG` split, an explicit backup
  and undo contract for `.zshrc`, and the four silent-failure gotchas found
  while building it: Ghostty's bundled Symbols Nerd Font masking a wrong
  `font-family`, font enumeration only at startup, `no-nerd-font` leaving
  `git_branch` behind, and `zsh -lc` not reading `.zshrc`.
