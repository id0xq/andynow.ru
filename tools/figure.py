"""Points of the hero figure: Andy with the hang, as a flock.

Input: sources/figure-cut.png, the subject lifted from the photo DSC00133 with Apple Vision
(tools/lift.swift). Output: src/assets/figure.bin, Int16 pairs (x, y) * 10000, where y runs
0..1 from head to feet and x is measured from the centre in the same units. The points are
shuffled, so any first N of them cover the whole figure evenly (the phone takes fewer).

Only the body is stippled here: density follows the tone (the dark shirt is dense, skin and light
trousers are sparse, the outline is reinforced). The hang is cut out of the body as an ellipse and
drawn by the page itself (assets/js/flock.js, HANG_IN_FIGURE), so its rim and fields stay crisp and
the same hang can grow out of the figure. Measured on this photo: centre on the figure's axis at
0.429 of the height, half-axes 0.137 and 0.158 of the height, tilted 12 degrees.

Usage: python tools/figure.py [N]
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
N = int(sys.argv[1]) if len(sys.argv) > 1 else 3800
H = 760  # sampling grid height

im = Image.open(os.path.join(ROOT, 'sources', 'figure-cut.png')).convert('RGBA')
im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
alpha = np.asarray(im.getchannel('A'), dtype=np.float32) / 255
gray = ImageOps.autocontrast(im.convert('RGB').convert('L', (0.36, 0.53, 0.11, 0)), cutoff=2)
lum = np.asarray(gray, dtype=np.float32) / 255
edge = np.asarray(im.getchannel('A').filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(1.2)), dtype=np.float32) / 255

# inner contours from the tone: the rim of the hang, its fields, the face and the hands
tone_edge = np.asarray(gray.filter(ImageFilter.GaussianBlur(1.0)).filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(1.4)), dtype=np.float32)
tone_edge = np.clip(tone_edge / np.percentile(tone_edge[alpha > 0.5], 98), 0, 1)

density = alpha * (0.03 + (1 - lum) ** 2.4) + 0.4 * edge + 0.25 * alpha * tone_edge
density[alpha < 0.5] *= 0.15
# the hang's ellipse (with a thin gap around it) stays empty
HX, HY, RX, RY, TILT = 0.0, 0.429, 0.137, 0.158, np.radians(12)   # top of the hang leans right
gy, gx = np.mgrid[0:H, 0:im.width].astype(np.float32)
ux = (gx - im.width / 2) / H - HX
uy = gy / H - HY
c, s_ = np.cos(TILT), np.sin(TILT)
ex = (ux * c + uy * s_) / (RX * 1.07)
ey = (-ux * s_ + uy * c) / (RY * 1.07)
density[ex * ex + ey * ey < 1] = 0

p = (density / density.sum()).ravel()

rng = np.random.default_rng(11)
idx = rng.choice(p.size, size=N, replace=False, p=p)
ys, xs = np.divmod(idx, im.width)
xs = xs + rng.random(N); ys = ys + rng.random(N)
x = (xs - im.width / 2) / H
y = ys / H
order = rng.permutation(N)
pts = np.stack([x[order], y[order]], axis=1)
data = np.round(pts * 10000).astype('<i2')
out = os.path.join(ROOT, 'src', 'assets', 'figure.bin')
data.tofile(out)
print('points', N, 'aspect', round(im.width / H, 3), 'bytes', os.path.getsize(out))

# a preview, to look at the stipple
prev = Image.new('L', (im.width * 2, H * 2), 255)
px = prev.load()
for (a, b) in pts:
    cx, cy = int((a * H + im.width / 2) * 2), int(b * H * 2)
    for dx in (0, 1):
        for dy in (0, 1):
            if 0 <= cx + dx < prev.width and 0 <= cy + dy < prev.height:
                px[cx + dx, cy + dy] = 0
prev.save(os.path.join(ROOT, 'sources', 'figure-preview.png'))
