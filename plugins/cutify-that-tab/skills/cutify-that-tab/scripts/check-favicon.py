#!/usr/bin/env python3
"""check-favicon.py - will this SVG favicon actually read in a browser tab?

Usage:
  check-favicon.py FILE.svg [FILE2.svg ...] [--dark DARK.svg]
                   [--html PAGE.html --replacing] [--self-test]

Per SVG, each check prints PASS / FAIL / WARN / UNCHECKED (or n/a) plus a reason:
  xml       parses, root is <svg>, has a viewBox                          (FAIL)
  crisp     pixel art (all <rect>, viewBox 0 0 16 16): root has
            shape-rendering="crispEdges"                                   (FAIL)
  margin    pixel art: free-floating paint in row/col 0 or 15 = FAIL, in
            row/col 1 or 14 = WARN (skill rule: >= 2 cells clear). Tiled
            sticker (first rect, rx>0, >= half the viewBox): tile must leave a
            1-cell outer margin, so a tile touching the edge = FAIL.
  contrast  colour difference between the body fill and the four Chrome tab
            colours: light active #f0eee9, light inactive #c2c5be, dark active
            #202124, dark inactive #2f3033. Body = tile fill if there is a
            tile, else the fill covering the most cells of a 16x16 raster
            (last painter wins). Gradient: mean over its stops. If the body
            cannot be worked out (paths, circles, text, opacity, named colours)
            this is UNCHECKED, never PASS.
            Light tabs below threshold = FAIL. Dark tabs: with --dark the dark
            file is tested against the dark tabs (FAIL); without it, a light
            file below threshold on a dark tab = WARN (add a two-file pair).
  html      --html PAGE: lists <link rel=icon> hrefs. With --replacing, an SVG
            icon href without a ?v= query = FAIL (SKILL.md Step 3b).

Verdict metric and threshold. Pass/fail is CIEDE2000 colour difference (dE),
threshold dE >= 22.5. The WCAG luminance ratio is printed but is NOT the
verdict: it cannot reproduce the skill's own field data (below). White on the
grey tab (1.75) vanished while pink-300 on that tab (1.04) read, because
saturated pastels differ from grey by hue, not lightness.
  field result  body (tab)                   WCAG   dE2000
  vanished      pink-50 #fbcfe8 / cream      1.19   20.2
  vanished      white   #ffffff / grey       1.75   13.8
  read          pink-300 #f9a8d4 / cream     1.56   27.7
  read          pink-300 #f9a8d4 / grey      1.04   29.6
  read          pink-50  #fbcfe8 / grey      1.26   24.5  (iter 1, with accents)
22.5 sits between the lowest "read" (24.5) and the highest "vanished" (20.2).
It is calibrated on five points: treat it as a smoke alarm, not a proof.

Exit codes (three-valued, like cutify-that-terminal's verify-glyphs.sh):
  0  PASS       no FAIL and nothing UNCHECKED (WARNs do not change the exit)
  1  FAIL       at least one check failed
  3  UNCHECKED  no FAIL, but a check that applies could not run. Not a pass.
(2 = bad command line.)

--self-test runs fixtures in scripts/fixtures/ (override: --fixtures DIR) and
proves the FAIL / WARN / UNCHECKED paths still fire. Exits 0 only if every
expectation holds.
"""
import argparse, math, os, re, sys, xml.etree.ElementTree as ET
from html.parser import HTMLParser

THRESHOLD = 22.5
TABS_LIGHT = [("light active", "#f0eee9"), ("light inactive", "#c2c5be")]
TABS_DARK = [("dark active", "#202124"), ("dark inactive", "#2f3033")]
SHAPES = {"rect", "circle", "ellipse", "path", "polygon", "polyline", "line", "text", "image", "use"}
SKIP = {"defs", "clipPath", "mask", "symbol", "style", "title", "desc", "metadata",
        "linearGradient", "radialGradient", "pattern", "filter"}
NAMED = {"white": "#ffffff", "black": "#000000"}

# ---------------------------------------------------------------- colour maths
def hex_norm(s):
    s = s.strip().lower()
    if re.fullmatch(r"#[0-9a-f]{3}", s):
        return "#" + "".join(c * 2 for c in s[1:])
    if re.fullmatch(r"#[0-9a-f]{6}", s):
        return s
    m = re.fullmatch(r"rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)", s)
    if m and all(int(g) <= 255 for g in m.groups()):
        return "#%02x%02x%02x" % tuple(int(g) for g in m.groups())
    return NAMED.get(s)

def _lin(h):
    return [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
            for c in (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))]

def wcag(a, b):
    def lum(h):
        r, g, bl = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
                    for c in (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))]
        return 0.2126 * r + 0.7152 * g + 0.0722 * bl
    hi, lo = sorted([lum(a), lum(b)], reverse=True)
    return (hi + 0.05) / (lo + 0.05)

def lab(h):
    r, g, b = _lin(h)
    x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
    y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116
    return 116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))

def de2000_lab(l1, l2):
    L1, a1, b1 = l1; L2, a2, b2 = l2
    C1, C2 = math.hypot(a1, b1), math.hypot(a2, b2)
    Cb = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1 = math.degrees(math.atan2(b1, a1p)) % 360
    h2 = math.degrees(math.atan2(b2, a2p)) % 360
    dL, dC = L2 - L1, C2p - C1p
    dh = h2 - h1
    if C1p * C2p == 0: dh = 0
    elif dh > 180: dh -= 360
    elif dh < -180: dh += 360
    dH = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dh / 2))
    Lb, Cbp = (L1 + L2) / 2, (C1p + C2p) / 2
    if C1p * C2p == 0: hb = h1 + h2
    elif abs(h1 - h2) <= 180: hb = (h1 + h2) / 2
    elif h1 + h2 < 360: hb = (h1 + h2 + 360) / 2
    else: hb = (h1 + h2 - 360) / 2
    T = (1 - 0.17 * math.cos(math.radians(hb - 30)) + 0.24 * math.cos(math.radians(2 * hb))
         + 0.32 * math.cos(math.radians(3 * hb + 6)) - 0.20 * math.cos(math.radians(4 * hb - 63)))
    SL = 1 + 0.015 * (Lb - 50) ** 2 / math.sqrt(20 + (Lb - 50) ** 2)
    SC, SH = 1 + 0.045 * Cbp, 1 + 0.015 * Cbp * T
    RT = (-2 * math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
          * math.sin(math.radians(60 * math.exp(-((hb - 275) / 25) ** 2))))
    return math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH))

def de2000(a, b):
    return de2000_lab(lab(a), lab(b))

# ----------------------------------------------------------------- svg reading
def local(tag):
    return tag.rsplit("}", 1)[-1] if isinstance(tag, str) else ""

def css_decls(s):
    return {k.strip(): v.strip() for k, v in (d.split(":", 1) for d in s.split(";") if ":" in d)}

class Svg:
    def __init__(self, root):
        self.root = root
        self.parent = {c: p for p in root.iter() for c in p}
        self.ids = {e.get("id"): e for e in root.iter() if e.get("id")}
        self.rules = {}
        for st in root.iter():
            if local(st.tag) == "style" and st.text:
                for m in re.finditer(r"\.([\w-]+)\s*\{([^}]*)\}", st.text):
                    self.rules.setdefault(m.group(1), {}).update(css_decls(m.group(2)))

    def prop(self, el, name):
        """Presentation property with inheritance: style attr > class rule > attribute."""
        while el is not None:
            d = css_decls(el.get("style", ""))
            if name in d: return d[name]
            for c in el.get("class", "").split():
                if name in self.rules.get(c, {}): return self.rules[c][name]
            if el.get(name) is not None: return el.get(name)
            el = self.parent.get(el)
        return None

    def has_transform(self, el):
        while el is not None:
            if el.get("transform"): return True
            el = self.parent.get(el)
        return False

    def alpha(self, el):
        """True if any ancestor/own opacity or fill-opacity is below 1."""
        while el is not None:
            for n in ("opacity", "fill-opacity"):
                v = el.get(n) or css_decls(el.get("style", "")).get(n)
                try:
                    if v is not None and float(v) < 1: return True
                except ValueError:
                    return True
            el = self.parent.get(el)
        return False

    def fill(self, el):
        """-> ('none',) | ('colors', (hex,..)) | ('unresolved', why). alpha handled by caller."""
        f = self.prop(el, "fill")
        f = "#000000" if f is None else f.strip()
        if f.lower() in ("none", "transparent"): return ("none",)
        h = hex_norm(f)
        if h: return ("colors", (h,))
        m = re.fullmatch(r"url\(\s*#([^)\s]+)\s*\)", f)
        if m:
            g = self.ids.get(m.group(1))
            stops = [] if g is None else [s for s in g if local(s.tag) == "stop"]
            cols = []
            for s in stops:
                c = s.get("stop-color") or css_decls(s.get("style", "")).get("stop-color")
                h = hex_norm(c) if c else None
                if not h: return ("unresolved", "gradient stop colour %r" % c)
                cols.append(h)
            return ("colors", tuple(cols)) if cols else ("unresolved", "gradient %s has no stops" % m.group(1))
        return ("unresolved", "fill %r" % f)

def num(el, name, default=0.0):
    v = el.get(name)
    if v is None: return default
    try: return float(v.strip().rstrip("px"))
    except ValueError: return None

def load_svg(path):
    """-> (Svg|None, error message|None)"""
    try:
        root = ET.parse(path).getroot()
    except (ET.ParseError, OSError) as e:
        return None, "does not parse: %s" % e
    return Svg(root), None

def painted_shapes(svg):
    out = []
    def walk(el, skipped):
        t = local(el.tag)
        skipped = skipped or t in SKIP
        if not skipped and t in SHAPES:
            fill = svg.fill(el)
            stroke = (svg.prop(el, "stroke") or "none").strip().lower()
            if fill[0] != "none" or stroke != "none":
                out.append({"el": el, "tag": t, "fill": fill, "stroke": stroke != "none",
                            "alpha": svg.alpha(el), "transform": svg.has_transform(el)})
        for c in el: walk(c, skipped)
    walk(svg.root, False)
    return out

def viewbox(svg):
    try:
        v = [float(x) for x in re.split(r"[\s,]+", svg.root.get("viewBox", "").strip())]
        return v if len(v) == 4 else None
    except ValueError:
        return None

def find_tile(shapes, vb):
    """A tiled sticker / blob background: first painted shape is a rounded rect >= half the viewBox."""
    if not shapes or not vb: return None
    s = shapes[0]
    if s["tag"] != "rect": return None
    el = s["el"]
    w, h = num(el, "width"), num(el, "height")
    rx, ry = num(el, "rx"), num(el, "ry")
    if None in (w, h, rx, ry) or not (rx > 0 or ry > 0): return None
    return s if w * h >= 0.5 * vb[2] * vb[3] else None

# ---------------------------------------------------------------------- checks
class Report:
    def __init__(self): self.rows = []     # (file, key, status, message)
    def add(self, f, k, s, m): self.rows.append((f, k, s, m))

def fmt_cols(cols): return cols[0] if len(cols) == 1 else "gradient " + ",".join(cols)

def contrast_line(body, tabs):
    """-> (fails [(name, de, wc)], rows [(name, de, wc)]); gradient = mean over stops."""
    rows = []
    for name, hx in tabs:
        des = [de2000(c, hx) for c in body]
        wcs = [wcag(c, hx) for c in body]
        rows.append((name, sum(des) / len(des), sum(wcs) / len(wcs)))
    return rows

def describe(rows):
    return "; ".join("%s dE %.1f (WCAG %.2f)" % r for r in rows)

def check_svg(rep, path, label, role):
    """role: 'light' (no dark pair: dark tabs only WARN), 'paired' (light tabs only) or 'dark' (dark tabs only)."""
    f = label
    svg, err = load_svg(path)
    if err:
        rep.add(f, "xml", "FAIL", err); return
    rootname = local(svg.root.tag)
    vb = viewbox(svg)
    if rootname != "svg": rep.add(f, "xml", "FAIL", "root element is <%s>, not <svg>" % rootname); return
    if not vb: rep.add(f, "xml", "FAIL", "root <svg> has no usable viewBox"); return
    rep.add(f, "xml", "PASS", "parses; <svg> viewBox=%s" % " ".join("%g" % x for x in vb))

    shapes = painted_shapes(svg)
    pixel = vb == [0, 0, 16, 16] and bool(shapes) and all(s["tag"] == "rect" for s in shapes)
    tile = find_tile(shapes, vb)

    if pixel:
        sr = (svg.root.get("shape-rendering") or css_decls(svg.root.get("style", "")).get("shape-rendering"))
        if sr == "crispEdges": rep.add(f, "crisp", "PASS", 'pixel art; shape-rendering="crispEdges" on root')
        else: rep.add(f, "crisp", "FAIL", 'pixel art without shape-rendering="crispEdges" on root (got %r): rects antialias to mush' % sr)
    else:
        rep.add(f, "crisp", "n/a", "not pixel art (needs all <rect>, viewBox 0 0 16 16)")

    # --- raster the 16x16 grid (pixel art only)
    grid, grid_why = None, None
    if pixel:
        grid = [[None] * 16 for _ in range(16)]
        for s in shapes:
            if s is tile: continue
            el = s["el"]
            x, y, w, h = (num(el, k) for k in ("x", "y", "width", "height"))
            if s["transform"] or s["stroke"]: grid_why = "a rect has a transform or stroke"; break
            if None in (x, y, w, h) or any(v != int(v) for v in (x, y, w, h)):
                grid_why = "non-integer rect coordinates"; break
            if (num(el, "rx") or 0) > 0 or (num(el, "ry") or 0) > 0:
                grid_why = "a non-tile rect has rounded corners"; break
            key = (s["fill"], s["alpha"])
            for cy in range(max(0, int(y)), min(16, int(y + h))):
                for cx in range(max(0, int(x)), min(16, int(x + w))):
                    grid[cy][cx] = key
        if grid_why: grid = None

    # --- margin
    if not pixel:
        rep.add(f, "margin", "n/a", "not pixel art")
    elif tile is not None and (tile["transform"] or tile["stroke"]):
        rep.add(f, "margin", "UNCHECKED", "tile has a transform or stroke")
    elif tile is not None:
        el = tile["el"]
        x, y, w, h = (num(el, k) for k in ("x", "y", "width", "height"))
        if None in (x, y, w, h): rep.add(f, "margin", "UNCHECKED", "tile geometry is not numeric")
        elif x < 1 or y < 1 or x + w > 15 or y + h > 15:
            rep.add(f, "margin", "FAIL", "tiled sticker: tile (%g,%g,%gx%g) touches the viewBox edge; needs a 1-cell outer margin (x,y>=1, x+w,y+h<=15)" % (x, y, w, h))
        elif grid is None:
            rep.add(f, "margin", "UNCHECKED", "tile has its margin, but the mascot could not be rasterised: " + grid_why)
        elif any(grid[r][c] for r in range(16) for c in (0, 15)) or any(grid[r][c] for r in (0, 15) for c in range(16)):
            rep.add(f, "margin", "FAIL", "tiled sticker: mascot paint in the outer ring (row/col 0 or 15)")
        else:
            rep.add(f, "margin", "PASS", "tiled sticker: tile (%g,%g,%gx%g) leaves a 1-cell outer margin" % (x, y, w, h))
    elif grid is None:
        rep.add(f, "margin", "UNCHECKED", "could not rasterise: " + (grid_why or "unknown"))
    else:
        ring0 = sorted({(r, c) for r in range(16) for c in range(16) if grid[r][c] and (r in (0, 15) or c in (0, 15))})
        ring1 = sorted({(r, c) for r in range(16) for c in range(16) if grid[r][c] and (r in (1, 14) or c in (1, 14)) and (r, c) not in ring0})
        if ring0: rep.add(f, "margin", "FAIL", "paint in row/col 0 or 15 (%d cells, first at row %d col %d); tab bars shave 1-2px" % (len(ring0), *ring0[0]))
        elif ring1: rep.add(f, "margin", "WARN", "paint in row/col 1 or 14 (%d cells, first at row %d col %d); skill rule is >= 2 cells clear" % (len(ring1), *ring1[0]))
        else: rep.add(f, "margin", "PASS", "free-floating; nothing in rows/cols 0, 1, 14, 15")

    # --- contrast
    body, how = None, ""
    if tile is not None:
        if tile["alpha"] or tile["fill"][0] != "colors":
            why = "tile has opacity" if tile["alpha"] else tile["fill"][1] if tile["fill"][0] == "unresolved" else "tile unpainted"
            body, how = None, "tile fill not resolvable (%s)" % why
        else: body, how = tile["fill"][1], "tile fill"
    elif grid is not None:
        counts = {}
        for row in grid:
            for k in row:
                if k: counts[k] = counts.get(k, 0) + 1
        if not counts: how = "nothing painted on the grid"
        else:
            k = max(counts, key=lambda k: counts[k])
            if k[1] or k[0][0] != "colors":
                how = "largest fill is not resolvable (%s)" % ("opacity < 1" if k[1] else k[0][1])
            else: body, how = k[0][1], "largest fill, %d of %d painted cells" % (counts[k], sum(counts.values()))
    else:
        kinds = sorted({s["tag"] for s in shapes if s["tag"] != "rect"})
        how = "cannot compute painted area (%s) and no background tile" % (", ".join(kinds) or grid_why or "unknown")

    tabsets = [("contrast-dark", TABS_DARK)] if role == "dark" else [("contrast-light", TABS_LIGHT)]
    if role == "light":   # no dark pair supplied: dark tabs are a WARN, not a FAIL
        tabsets.append(("contrast-dark", TABS_DARK))
    for key, tabs in tabsets:
        if body is None: rep.add(f, key, "UNCHECKED", how); continue
        rows = contrast_line(body, tabs)
        low = [r for r in rows if r[1] < THRESHOLD]
        txt = "body %s (%s) vs %s" % (fmt_cols(body), how, describe(rows))
        if not low: rep.add(f, key, "PASS", "%s; all >= %.1f" % (txt, THRESHOLD))
        elif key == "contrast-dark" and role == "light":
            rep.add(f, key, "WARN", "%s; below %.1f on a dark tab: add a dark pair (two-file <link media>)" % (txt, THRESHOLD))
        else: rep.add(f, key, "FAIL", "%s; below %.1f on %s" % (txt, THRESHOLD, ", ".join(r[0] for r in low)))

class LinkFinder(HTMLParser):
    def __init__(self): super().__init__(); self.links = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "link" and "icon" in (a.get("rel") or "").lower().split():
            self.links.append(a)
    handle_startendtag = handle_starttag

def check_html(rep, path, replacing):
    try:
        p = LinkFinder(); p.feed(open(path, encoding="utf-8", errors="replace").read())
    except OSError as e:
        rep.add(path, "html", "FAIL", "cannot read: %s" % e); return
    hrefs = [l.get("href") or "" for l in p.links]
    if not replacing:
        rep.add(path, "html", "INFO", "icon links: %s" % (", ".join(hrefs) or "none")); return
    svgs = [l for l in p.links if (l.get("href") or "").split("?")[0].endswith(".svg")
            or "svg" in (l.get("type") or "")]
    svgs = [l for l in svgs if not (l.get("href") or "").startswith("data:")]
    if not svgs:
        rep.add(path, "html", "UNCHECKED", "--replacing but no <link rel=icon> to an SVG file found (icon links: %s)" % (", ".join(hrefs) or "none")); return
    bad = [l["href"] for l in svgs if not re.search(r"[?&]v=", l.get("href") or "")]
    if bad: rep.add(path, "html", "FAIL", "replacing, but icon href has no ?v= query (browsers keep the old icon): %s (Step 3b)" % ", ".join(bad))
    else: rep.add(path, "html", "PASS", "every SVG icon href carries ?v=: %s" % ", ".join(l["href"] for l in svgs))

def run(svgs, dark=None, html=None, replacing=False):
    rep = Report()
    for p in svgs: check_svg(rep, p, os.path.basename(p), "paired" if dark else "light")
    if dark: check_svg(rep, dark, "dark:" + os.path.basename(dark), "dark")
    if html: check_html(rep, html, replacing)
    st = [r[2] for r in rep.rows]
    code = 1 if "FAIL" in st else 3 if "UNCHECKED" in st else 0
    return rep, code

def show(rep, code):
    last = None
    for f, k, s, m in rep.rows:
        if f != last: print("== %s" % f); last = f
        print("  %-9s %-14s %s" % (s, k, m))
    c = {s: [r[2] for r in rep.rows].count(s) for s in ("PASS", "FAIL", "WARN", "UNCHECKED")}
    verdict = {0: "PASS", 1: "FAIL", 3: "UNCHECKED (nothing was verified for those checks; this is not a pass)"}[code]
    print("SUMMARY: %d PASS, %d FAIL, %d WARN, %d UNCHECKED -> exit %d %s" % (c["PASS"], c["FAIL"], c["WARN"], c["UNCHECKED"], code, verdict))

# ------------------------------------------------------------------ self-test
def self_test(fx):
    bad = []
    # 1. the colour maths against published Sharma/Wu/Dalal CIEDE2000 test pairs
    for l1, l2, want in [((50, 2.6772, -79.7751), (50, 0, -82.7485), 2.0425),
                         ((50, 2.5, 0), (50, 0, -2.5), 4.3065),
                         ((50, 2.5, 0), (73, 25, -18), 27.1492)]:
        got = de2000_lab(l1, l2)
        if abs(got - want) > 1e-3: bad.append("CIEDE2000 reference pair %s: got %.4f want %.4f" % (l2, got, want))
    # 2. fixtures: (name, svgs, dark, html, replacing, exit, {key: status})
    P = lambda n: os.path.join(fx, n)
    cases = [
        ("good pixel art passes",        ["good_pixel.svg"], None, None, False, 0, {"xml": "PASS", "crisp": "PASS", "margin": "PASS", "contrast-light": "PASS", "contrast-dark": "PASS"}),
        ("missing crispEdges fails",     ["bad_no_crispedges.svg"], None, None, False, 1, {"crisp": "FAIL"}),
        ("paint on the edge fails",      ["bad_edge_paint.svg"], None, None, False, 1, {"margin": "FAIL"}),
        ("paint in row 1 only warns",    ["warn_margin.svg"], None, None, False, 0, {"margin": "WARN"}),
        ("pink-50 body fails",           ["bad_pale_body.svg"], None, None, False, 1, {"contrast-light": "FAIL"}),
        ("white body fails",             ["bad_white_body.svg"], None, None, False, 1, {"contrast-light": "FAIL"}),
        ("path-only is UNCHECKED, exit 3", ["path_only.svg"], None, None, False, 3, {"contrast-light": "UNCHECKED", "contrast-dark": "UNCHECKED"}),
        ("broken XML fails",             ["bad_xml.svg"], None, None, False, 1, {"xml": "FAIL"}),
        ("tile with margin passes",      ["good_tile.svg"], None, None, False, 0, {"margin": "PASS", "contrast-light": "PASS"}),
        ("tile touching the edge fails", ["bad_tile_edge.svg"], None, None, False, 1, {"margin": "FAIL"}),
        ("gradient blob passes",         ["good_blob.svg"], None, None, False, 0, {"crisp": "n/a", "contrast-light": "PASS"}),
        ("dark body, no dark pair: warns", ["good_silhouette.svg"], None, None, False, 0, {"contrast-light": "PASS", "contrast-dark": "WARN"}),
        ("silhouette + dark pair passes", ["good_silhouette.svg"], "good_silhouette_dark.svg", None, False, 0, {"contrast-light": "PASS", "dark:contrast-dark": "PASS"}),
        ("dark file with a dark body fails", ["good_silhouette.svg"], "good_silhouette.svg", None, False, 1, {"dark:contrast-dark": "FAIL"}),
        ("html without ?v= fails",       ["good_pixel.svg"], None, "page_no_version.html", True, 1, {"html": "FAIL"}),
        ("html with ?v= passes",         ["good_pixel.svg"], None, "page_versioned.html", True, 0, {"html": "PASS"}),
        ("html without --replacing only lists", ["good_pixel.svg"], None, "page_no_version.html", False, 0, {"html": "INFO"}),
    ]
    for name, svgs, dk, h, repl, want_code, want in cases:
        try:
            rep, code = run([P(s) for s in svgs], P(dk) if dk else None, P(h) if h else None, repl)
        except Exception as e:  # a crash is a failed expectation, not a pass
            bad.append("%s: crashed: %r" % (name, e)); print("  FAIL  %s (crashed)" % name); continue
        got = {(k if not f.startswith("dark:") else "dark:" + k): s for f, k, s, m in rep.rows}
        miss = ["%s=%s (got %s)" % (k, s, got.get(k)) for k, s in want.items() if got.get(k) != s]
        if code != want_code: miss.insert(0, "exit %d (got %d)" % (want_code, code))
        print("  %s  %s" % ("ok  " if not miss else "FAIL", name) + ("" if not miss else "  expected " + "; ".join(miss)))
        if miss: bad.append("%s: expected %s" % (name, "; ".join(miss)))
    print()
    if bad:
        print("SELF-TEST FAILED: %d expectation(s) did not hold:" % len(bad))
        for b in bad: print("  - " + b)
        print("Any PASS this script prints is not trustworthy until this is fixed.")
        return 1
    print("SELF-TEST PASSED: %d fixtures behaved as expected (FAIL, WARN, UNCHECKED and PASS paths all fire)." % len(cases))
    return 0

def main(argv=None):
    ap = argparse.ArgumentParser(prog="check-favicon.py", description=__doc__.split("\n", 1)[0],
                                 epilog="\n".join(__doc__.split("\n")[2:]),
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("svg", nargs="*", help="SVG favicon file(s) (light / default)")
    ap.add_argument("--dark", help="dark-mode SVG, tested against the dark tabs (needs exactly one SVG)")
    ap.add_argument("--html", help="page whose <link rel=icon> hrefs to list / check")
    ap.add_argument("--replacing", action="store_true", help="with --html: an SVG icon href must carry ?v=")
    ap.add_argument("--self-test", action="store_true", help="run the bundled fixtures and prove FAIL still fires")
    ap.add_argument("--fixtures", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures"),
                    help="fixtures directory for --self-test (default: scripts/fixtures)")
    a = ap.parse_args(argv)
    if a.self_test: return self_test(a.fixtures)
    if not a.svg and not a.html: ap.error("give at least one SVG (or --html PAGE)")
    if a.dark and len(a.svg) != 1: ap.error("--dark pairs with exactly one light SVG")
    if a.replacing and not a.html: ap.error("--replacing needs --html PAGE")
    rep, code = run(a.svg, a.dark, a.html, a.replacing)
    show(rep, code)
    return code

if __name__ == "__main__":
    sys.exit(main())
