#!/usr/bin/env python3
"""Repo-consistency checks for scripts/check-all.sh. Standard library only.

  repo_consistency.py versions       marketplace.json is valid; each plugin's version matches plugin.json and SKILL.md
  repo_consistency.py skills         every plugin has one SKILL.md whose frontmatter name matches its folder
  repo_consistency.py readme-links   every relative link / image in the README points at a file that exists

Env overrides (used to prove the checks can fail without touching tracked files):
  MARKETPLACE_JSON=<file>   README_PATH=<file>
Exit 0 = pass, 1 = problems found (each printed on its own line)."""
import json, os, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MARKETPLACE = Path(os.environ.get('MARKETPLACE_JSON') or ROOT / '.claude-plugin' / 'marketplace.json')
README = Path(os.environ.get('README_PATH') or ROOT / 'README.md')
problems = []

def frontmatter(path):
    m = re.match(r'\A---\r?\n(.*?)\r?\n---', path.read_text(encoding='utf-8'), re.S)
    return m.group(1) if m else ''

def load_marketplace():
    try:
        return json.loads(MARKETPLACE.read_text(encoding='utf-8'))['plugins']
    except Exception as e:
        problems.append(f'{MARKETPLACE}: cannot read plugin list ({e})')
        return []

def versions():
    for p in load_marketplace():
        name, ver = p.get('name'), p.get('version')
        src = ROOT / p.get('source', '')
        if not src.is_dir():
            problems.append(f'{name}: source {p.get("source")} is not a directory'); continue
        try:
            pj = json.loads((src / '.claude-plugin' / 'plugin.json').read_text(encoding='utf-8'))
        except Exception as e:
            problems.append(f'{name}: plugin.json unreadable ({e})'); continue
        if pj.get('version') != ver: problems.append(f'{name}: marketplace {ver} != plugin.json {pj.get("version")}')
        if pj.get('name') != name: problems.append(f'{name}: plugin.json name is {pj.get("name")}')
        for skill in sorted((src / 'skills').glob('*/SKILL.md')):
            m = re.search(r'^\s*version:\s*["\']?([^"\'\s#]+)', frontmatter(skill), re.M)
            if m and m.group(1) != ver: problems.append(f'{name}: marketplace {ver} != {skill.relative_to(ROOT)} {m.group(1)}')

def skills():
    plugins = load_marketplace()
    for p in plugins:
        src = ROOT / p.get('source', '')
        found = sorted((src / 'skills').glob('*/SKILL.md'))
        if len(found) != 1: problems.append(f'{p.get("name")}: expected 1 SKILL.md, found {len(found)}'); continue
        m = re.search(r'^name:\s*["\']?([^"\'\s]+)', frontmatter(found[0]), re.M)
        if not m or m.group(1) != p['name'] or found[0].parent.name != p['name']:
            problems.append(f'{p["name"]}: SKILL.md name {m.group(1) if m else None!r} / folder {found[0].parent.name!r} do not match')
    listed = {Path(p.get('source', '')).name for p in plugins}
    for d in sorted((ROOT / 'plugins').iterdir()):
        if d.is_dir() and d.name not in listed: problems.append(f'plugins/{d.name} is not listed in marketplace.json')

def exists_exact_case(base, rel):
    """True only if the path exists with this exact capitalisation (macOS says yes to wrong case, Linux/GitHub says no)."""
    cur = base
    for part in Path(rel).parts:
        if part in ('.', ''): continue
        if part == '..': cur = cur.parent; continue
        try:
            if part not in os.listdir(cur): return False
        except OSError: return False
        cur = cur / part
    return True

def readme_links():
    text = README.read_text(encoding='utf-8')
    text = re.sub(r'(?s)(```|~~~).*?\1', '', text)             # fenced code blocks hold examples, not links
    text = re.sub(r'`[^`\n]*`', '', text)
    refs = re.findall(r'!?\[[^\]]*\]\(\s*<?([^)\s>]+)', text)   # [x](path) and ![x](path)
    refs += re.findall(r'\b(?:src|href|poster|srcset)\s*=\s*["\']([^"\']+)', text)   # <img src>, <a href>
    refs += re.findall(r'^\s*\[[^\]]+\]:\s*(\S+)', text, re.M)  # [ref]: path
    n = 0
    for ref in refs:
        if re.match(r'(?i)^([a-z][a-z0-9+.-]*:|//|#)', ref): continue   # http(s), mailto, data:, anchors
        target = ref.split('#')[0].split('?')[0]
        if not target: continue
        n += 1
        if not exists_exact_case(README.parent, target): problems.append(f'{README.name}: broken link -> {ref}')
    print(f'{n} relative links/images checked in {README.name}')

cmd = sys.argv[1] if len(sys.argv) > 1 else ''
if cmd not in ('versions', 'skills', 'readme-links'): sys.exit(__doc__)
{'versions': versions, 'skills': skills, 'readme-links': readme_links}[cmd]()
for p in problems: print(p)
sys.exit(1 if problems else 0)
