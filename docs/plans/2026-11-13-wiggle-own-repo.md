# 2026-11-13 — move wiggle-that-diagram into its own repo

**Why:** wiggle is for slide decks and reports, not "cute"; its demo films (3.6 MB) outweigh the other five plugins
together; it shares no code with them and carries its own third-party notices.

**Gate (passed):** Claude Code's marketplace reference allows a plugin entry whose source is another GitHub repo,
`{"source": "github", "repo": "owner/repo"}` (fields `repo`, `ref`, `sha`; no `path`, so the plugin sits at that
repo's root). Install is by `<entry name>@<marketplace name>`, so `/plugin install wiggle-that-diagram@wan-huiyan-cutify-this`
keeps working. Users only get a new copy when the computed version changes, so the move ships as **1.3.1**.
Docs: https://code.claude.com/docs/en/plugins/marketplace-reference.md ("Plugin sources").

## New repo `wan-huiyan/wiggle-that-diagram` (public, MIT)

```
.claude-plugin/marketplace.json   marketplace "wan-huiyan-wiggle-that-diagram", one plugin, source "./plugins/wiggle-that-diagram"
plugins/wiggle-that-diagram/      .claude-plugin/plugin.json (1.3.1) + skills/wiggle-that-diagram/ (SKILL.md, notices, scripts, examples)
demos/                            the demos: beats.json, style-a|b|c/, expenses/, final/*.html, *.gif, README.md
scripts/check.sh                  the wiggle checks from cutify-this's check-all.sh + a version-match check
.github/workflows/test.yml        runs scripts/check.sh
.github/workflows/pages.yml       publishes demos/final/*.html at https://wan-huiyan.github.io/wiggle-that-diagram/
README.md                         pop-that-readme house style: expenses.gif hero, pizza.gif, link to the live films
LICENSE                           MIT
```

History: a scratch clone of cutify-this, `git filter-repo` keeping `plugins/wiggle-that-diagram/` and
`docs/wiggle-that-diagram/` (renamed to `demos/`), so the four wiggle commits (#13, #14, #15, #17) survive.

## cutify-this PR

- `marketplace.json`: wiggle entry -> `{"source": "git-subdir", "url": "https://github.com/wan-huiyan/wiggle-that-diagram.git",
  "path": "plugins/wiggle-that-diagram"}`, version 1.3.1;
  top description drops the wiggle clause.
- Delete `plugins/wiggle-that-diagram/` and `docs/wiggle-that-diagram/`.
- `scripts/check-all.sh`: drop the wiggle block. `tests/repo_consistency.py`: an entry with a non-relative source is
  checked for name, version and description only (its files live elsewhere).
- `.github/workflows/pages.yml`: stop copying the films; write a redirect page for `/wiggle/` and each of the six
  films to the same name on the new site, so old links keep working.
- README: "Six skills" -> five here, plus a pointer to wiggle-that-diagram in its own repo (same install command);
  GIFs repointed to the new repo's raw URLs; THIRD_PARTY_NOTICES link repointed; check count re-derived from the CI log.

## Steps -> check

1. Build the new repo in a scratch folder -> `scripts/check.sh` passes locally; style C rebuilds `demos/final/pizza.html` byte for byte.
2. (After a yes) create the public repo, push, turn on Pages -> both workflows green; films load at the new URL.
3. cutify-this branch -> `check-all.sh` passes; `claude plugin marketplace add <this worktree>` then
   `claude plugin install wiggle-that-diagram@wan-huiyan-cutify-this` in a throwaway `CLAUDE_CONFIG_DIR` installs 1.3.1 from the new repo.
4. PR, auto-merge on green -> after merge, same install from `wan-huiyan/cutify-this` on GitHub; old `/cutify-this/wiggle/`
   and `/cutify-this/wiggle/pizza.html` redirect to the new site.

## Extra checks (from review)

- **Existing installs:** before the PR merges, in a throwaway `CLAUDE_CONFIG_DIR`, add `wan-huiyan/cutify-this` from
  GitHub and install wiggle (1.3.0, old relative entry). After merge, `marketplace update` + `plugin update` in that same
  dir must give 1.3.1 from the new repo. (A local-path marketplace ignores version, so it can't test this.)
- Turn Pages on (`build_type=workflow`) right after `gh repo create`, before the first push.
- `claude plugin validate` on the new repo root and on the cutify-this branch.
- SKILL.md frontmatter `version:` also goes to 1.3.1.
- Prove the new check can fail: flip one byte in `demos/final/pizza.html`, style C line must read FAIL, restore.
- Commit messages `(#13)` etc. rewritten to `wan-huiyan/cutify-this#13` so they don't link to the wrong repo.
- If a plugin install hangs over 60 s, retry with `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1`.
- Credits: keep huashu-design (cutify-that-tab still uses it); drop the GSAP/fonts line.

## What changed while building it

- A `github` source copies the whole repo, so the first layout (plugin at the repo root) made the install 4.0 MB with
  the demos inside, against 380 KB before. The plugin moved to `plugins/wiggle-that-diagram/` and the cutify-this entry
  became a `git-subdir` source: install measured at 380 KB again, no `demos/`.
