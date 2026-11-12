"""~ontheflow./ — the orange sphere in a murmuration, rendered as a still for the site.

The sphere is the shop's own sign (a Fibonacci sphere of dots, as in ontheflow/src/components/sections/
Hero.tsx), here in the site's orange with a soft bloom. Around it a murmuration: a ribbon of pale points
that winds round the sphere, thick and thin in turns, folded by a slow curl-noise flow.
Rendered at 2x and reduced, so every dot is smooth.

Usage: .venv/bin/python tools/sphere.py  ->  sources/ontheflow-sphere.png (1200x1600)
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'sources', 'ontheflow-sphere.png')
W, H, SS = 1200, 1600, 2            # final size and supersampling
CX, CY, R = 600, 800, 200           # the sphere, in final pixels
rng = np.random.default_rng(20261112)


def blur(x, r):
    """Gaussian-like blur (three box passes per axis) of a 2D float array."""
    k = max(1, int(round(r * 0.6)))

    def box(v, axis):
        pad = [(0, 0), (0, 0)]
        pad[axis] = (k + 1, k)
        c = np.cumsum(np.pad(v, pad, mode='constant'), axis=axis, dtype=np.float64)
        n = v.shape[axis]
        return ((np.take(c, np.arange(2 * k + 1, 2 * k + 1 + n), axis=axis) - np.take(c, np.arange(n), axis=axis)) / (2 * k + 1)).astype(np.float32)

    for _ in range(3):
        x = box(box(x, 0), 1)
    return x


def splat(xs, ys, ws, r):
    """Soft dots: weights put on a grid at the dot centres, then blurred to the dot size."""
    g = np.zeros((H * SS, W * SS), np.float32)
    xi = np.clip((xs * SS).astype(int), 0, W * SS - 1)
    yi = np.clip((ys * SS).astype(int), 0, H * SS - 1)
    np.add.at(g, (yi, xi), ws)
    return blur(g, r * SS)


def curl(x, y, t):
    """A smooth swirling field (curl of a sum of sines)."""
    a, b, c = 0.0062, 0.0071, 0.0043
    s1, c1 = np.sin(x * a + t * 0.7), np.cos(x * a + t * 0.7)
    s2, c2 = np.sin(y * b - t * 0.6), np.cos(y * b - t * 0.6)
    c3 = np.cos((x + y) * c + t * 0.5)
    return (-b * s1 * s2 + 0.5 * c * c3) / 0.008, -(a * c1 * c2 + 0.5 * c * c3) / 0.008


def main():
    from PIL import ImageDraw
    # background: graphite, lighter behind the sphere
    yy, xx = np.mgrid[0:H * SS, 0:W * SS].astype(np.float32) / SS
    d = np.hypot((xx - CX) / W, (yy - CY) / H)
    base = np.array([0.043, 0.047, 0.054], np.float32)
    lift = np.array([0.115, 0.118, 0.126], np.float32)
    img = base + (lift - base) * np.clip(1 - d / 0.75, 0, 1)[..., None] ** 1.5

    def over(img, density, colour, k):
        a = (1 - np.exp(-density * k))[..., None]
        return img * (1 - a) + colour * a

    # murmuration: a ribbon that spirals round the sphere, thick in the middle and thin at the ends;
    # a fractal noise thins and thickens it into clumps and gaps, a short swirl folds its edges
    n = 150000
    s_ = rng.random(n)
    theta = np.radians(205) - s_ * np.radians(330)
    rad = R * (1.35 + 1.25 * s_)
    width = 18 + 95 * np.sin(np.pi * s_) ** 1.6
    cxs, cys = CX + np.cos(theta) * rad, CY + np.sin(theta) * rad * 0.72 + (s_ - 0.5) * 420
    tx, ty = -np.sin(theta), np.cos(theta) * 0.7
    tn = np.hypot(tx, ty)
    nx, ny = -ty / tn, tx / tn
    off = rng.normal(0, 1, n) * width
    along = rng.normal(0, 1, n) * 18
    px = cxs + nx * off + tx / tn * along
    py = cys + ny * off + ty / tn * along
    dirs = rng.random((7, 2)) * 2 - 1
    freqs = np.array([0.004, 0.006, 0.009, 0.013, 0.019, 0.027, 0.04])
    phases = rng.random(7) * 6.28
    fbm = sum(np.sin((px * dx + py * dy) * f + ph) / (1 + j * 0.6) for j, ((dx, dy), f, ph) in enumerate(zip(dirs, freqs, phases)))
    fbm = (fbm - fbm.min()) / (fbm.max() - fbm.min())
    keep = rng.random(n) < np.clip(fbm * 1.8 - 0.5, 0, 1) ** 2.4
    px, py = px[keep], py[keep]
    for k in range(18):
        fx, fy = curl(px * 1.4, py * 1.4, 0.8 + k * 0.02)
        px += fx * 3.2
        py += fy * 3.2
    # birds that ended up inside the sphere's disc sit behind it, dimmer
    inb = (px > -10) & (px < W + 10) & (py > -10) & (py < H + 10)
    px, py = px[inb], py[inb]
    inside = np.hypot(px - CX, py - CY) < R * 1.05
    behind = inside & (rng.random(px.size) < 0.65)
    size = rng.uniform(0.55, 1.15, px.size) * SS
    pale = np.array([0.93, 0.91, 0.88], np.float32)

    def birds(img, sel, colour, alpha):
        layer = Image.new('L', (W * SS, H * SS), 0)
        dr = ImageDraw.Draw(layer)
        for x0, y0, r0 in zip(px[sel] * SS, py[sel] * SS, size[sel]):
            dr.ellipse((x0 - r0, y0 - r0, x0 + r0, y0 + r0), fill=255)
        a = (np.asarray(layer, np.float32) / 255)[..., None] * alpha
        return img * (1 - a) + colour * a

    img = birds(img, behind, pale * 0.6, 0.6)

    # the sphere: Fibonacci dots, turned a little; nearer dots larger, brighter and warmer
    m = 760
    i = np.arange(m) + 0.5
    y = 1 - 2 * i / m
    r = np.sqrt(1 - y * y)
    phi = i * 2.399963229728653
    x, z = np.cos(phi) * r, np.sin(phi) * r
    tilt, spin = 0.38, 0.7
    x, z = x * np.cos(spin) + z * np.sin(spin), -x * np.sin(spin) + z * np.cos(spin)
    y, z = y * np.cos(tilt) - z * np.sin(tilt), y * np.sin(tilt) + z * np.cos(tilt)
    depth = (z + 1) / 2
    sx, sy = CX + x * R, CY - y * R
    orange = np.array([1.0, 0.353, 0.122], np.float32)
    ember = np.array([0.55, 0.13, 0.04], np.float32)
    light = np.array([1.0, 0.70, 0.50], np.float32)
    glow = splat(sx, sy, (0.2 + depth ** 2).astype(np.float32), 40)
    img = img + (glow / glow.max())[..., None] * orange * 0.22
    order = np.argsort(depth)
    for lo, hi in ((0.0, 0.3), (0.3, 0.55), (0.55, 0.8), (0.8, 1.01)):
        layer = Image.new('L', (W * SS, H * SS), 0)
        dr = ImageDraw.Draw(layer)
        for j in order:
            if lo <= depth[j] < hi:
                rad = (0.8 + 3.0 * depth[j] ** 1.3) * SS
                dr.ellipse((sx[j] * SS - rad, sy[j] * SS - rad, sx[j] * SS + rad, sy[j] * SS + rad), fill=255)
        a = (np.asarray(layer, np.float32) / 255)[..., None]
        mid = (lo + hi) / 2
        col = ember + (orange - ember) * min(1, mid * 1.4)
        if lo >= 0.8:
            col = orange * 0.55 + light * 0.45
        img = img * (1 - a * (0.35 + 0.65 * mid)) + col * a * (0.35 + 0.65 * mid)

    # birds in front of the sphere
    img = birds(img, ~behind, pale, 0.72)
    print('birds', int(px.size))

    # film: a quiet vignette and fine grain
    v = 1 - 0.3 * np.clip((np.hypot((xx - W / 2) / (W / 2), (yy - H / 2) / (H / 2)) / 1.414 - 0.35) / 0.65, 0, 1) ** 1.5
    img = img * v[..., None]
    out = Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)).resize((W, H), Image.LANCZOS)
    a = np.asarray(out, np.float32) / 255
    a = np.clip(a + rng.normal(0, 1.2 / 255, a.shape[:2]).astype(np.float32)[..., None], 0, 1)
    Image.fromarray((a * 255 + 0.5).astype(np.uint8)).save(OUT)
    print('wrote', OUT)


if __name__ == '__main__':
    main()
