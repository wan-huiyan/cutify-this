#!/usr/bin/env python3
# Contact sheet: tiles every PNG matching a glob into one image so a person can look at all beats at once. Inputs: glob, output path.
"""uv run --with pillow python contact_sheet.py "final/stills/film1_1280_*.png" review/contact_film1_1280.png [--cols 3] [--scale 0.5]"""
import glob, sys
from PIL import Image
args = [a for a in sys.argv[1:] if not a.startswith('--')]
if len(args) < 2:
    sys.exit(__doc__)
opt = lambda k, d: type(d)(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
cols, scale = opt('--cols', 3), opt('--scale', 0.5)
fs = sorted(glob.glob(args[0]))
if not fs:
    sys.exit('no files match ' + args[0])
ims = [Image.open(f) for f in fs]
ims = [i.resize((int(i.width * scale), int(i.height * scale))) for i in ims]
W = max(i.width for i in ims); H = max(i.height for i in ims); rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W + (cols - 1) * 8, rows * H + (rows - 1) * 8), (60, 60, 60))
for k, i in enumerate(ims):
    sheet.paste(i, ((k % cols) * (W + 8), (k // cols) * (H + 8)))
sheet.save(args[1]); print(args[1], len(ims), 'images')
