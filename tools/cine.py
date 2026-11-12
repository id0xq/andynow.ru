"""The cinematic grade of the site ("Now cine").

The photographers' originals already carry most of the look, so the grade keeps their colour and adds
what makes a frame feel like cinema: depth (deep but soft blacks, a filmic shoulder for highlights),
clarity in the midtones, a restrained teal in the shadows against warm highlights, living colour
(vibrance with skin protected), a quiet vignette and very fine grain. Nothing is washed or flattened.

grade(im, mask=None, strength=1.0) -> float32 array in 0..1; mask (bool array) limits the statistics to
the subject. grain(a) adds the grain; it is applied after any resize.
"""
import numpy as np
from PIL import Image, ImageFilter

LUM = np.array([0.2126, 0.7152, 0.0722], np.float32)
SHADOW_TINT = np.array([-0.030, 0.006, 0.034], np.float32)    # teal, into the shadows
HIGHLIGHT_TINT = np.array([0.026, 0.010, -0.026], np.float32)  # amber, into the highlights
SEED = 7


def _blur(x, r):
    """Gaussian-like blur of a 2D float array: three box blurs along each axis (numpy, float precision)."""
    k = max(1, int(round(r * 0.6)))

    def box(v, axis):
        pad = [(0, 0), (0, 0)]
        pad[axis] = (k + 1, k)
        c = np.cumsum(np.pad(v, pad, mode='edge'), axis=axis, dtype=np.float64)
        n = v.shape[axis]
        hi = np.take(c, np.arange(2 * k + 1, 2 * k + 1 + n), axis=axis)
        lo = np.take(c, np.arange(0, n), axis=axis)
        return ((hi - lo) / (2 * k + 1)).astype(np.float32)

    for _ in range(3):
        x = box(box(x, 0), 1)
    return x


def _hue(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    d = mx - mn + 1e-6
    return np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60


def _band(h, centre, width):
    return np.clip(1 - np.abs(((h - centre + 180) % 360) - 180) / width, 0, 1)


def _filmic(y):
    """S-curve with a soft toe and a long shoulder: contrast in the mids, nothing hard at the ends."""
    k = 5.2
    s = 1 / (1 + np.exp(-k * (y - 0.5)))
    lo, hi = 1 / (1 + np.exp(k / 2)), 1 / (1 + np.exp(-k / 2))
    s = (s - lo) / (hi - lo)
    return 0.52 * s + 0.48 * y


def grade(im, mask=None, strength=1.0):
    a = np.asarray(im.convert('RGB'), np.float32) / 255
    h, w = a.shape[:2]
    sel = mask if mask is not None else np.ones((h, w), bool)
    Y = a @ LUM

    # 1. levels on brightness: a true black and a clean white, without stretching flat frames too far
    lo = min(float(np.percentile(Y[sel], 0.35)), 0.10)
    hi = max(float(np.percentile(Y[sel], 99.7)), 0.78)
    a = np.clip((a - lo) / (hi - lo), 0, 1)

    # 2. white balance: a gentle pull of the midtones to neutral (a hair warm), never a filter
    Y = a @ LUM
    mid = sel & (Y > 0.22) & (Y < 0.78)
    if mid.sum() > 200:
        m = a[mid].mean(0)
        target = m.mean() * np.array([1.015, 1.0, 0.975], np.float32)
        gain = np.clip(target / np.maximum(m, 1e-3), 0.93, 1.07)
        a = np.clip(a * (1 + 0.4 * strength * (gain - 1)), 0, 1)

    # 3. clarity: local contrast in the midtones
    Y = a @ LUM
    radius = max(w, h) / 60
    detail = Y - _blur(Y, radius)
    midw = 1 - np.abs(Y * 2 - 1) ** 2
    a = a + (0.32 * strength * detail * midw)[..., None]

    # 4. filmic tone on brightness, colour ratios kept; very bright colours ease towards white
    a = np.clip(a, 0, 1)
    Y = a @ LUM
    Yt = Y + strength * (_filmic(Y) - Y)
    k = (Yt / np.maximum(Y, 1e-4))[..., None]
    a = a * k
    over = np.clip(a.max(-1, keepdims=True) - 1, 0, None)
    a = a + (Yt[..., None] - a) * np.clip(over * 2, 0, 1)
    a = np.clip(a, 0, 1)

    # 5. vibrance: quiet colours come alive, loud ones stay; skin is protected
    Y = a @ LUM
    c = a - Y[..., None]
    sat = np.abs(c).max(-1)
    skin = _band(_hue(a), 28, 26) * (sat > 0.03)
    boost = 1 + strength * (0.26 * (1 - np.clip(sat / 0.28, 0, 1)) * (1 - 0.7 * skin))
    a = np.clip(Y[..., None] + c * boost[..., None], 0, 1)

    # 6. split tone: teal shadows, amber highlights
    Y = a @ LUM
    ws = ((1 - Y) ** 2.2)[..., None] * strength
    wh = (Y ** 2.2)[..., None] * strength
    a = a + ws * SHADOW_TINT + wh * HIGHLIGHT_TINT

    # 7. deep, soft blacks and a highlight roll-off that never clips to paper
    a = 0.018 + 0.97 * np.clip(a, 0, 1)

    # 8. a quiet vignette
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.hypot((xx - w / 2) / (w / 2), (yy - h / 2) / (h / 2)) / np.sqrt(2)
    v = 1 - 0.11 * strength * np.clip((r - 0.45) / 0.55, 0, 1) ** 1.6
    a = a * v[..., None]
    return np.clip(a, 0, 1).astype(np.float32)


def grain(a, amount=1.3):
    """Very fine luminance grain, strongest in the midtones."""
    rng = np.random.default_rng(SEED)
    n = rng.normal(0.0, amount / 255, a.shape[:2]).astype(np.float32)
    n = 0.6 * n + 0.4 * _blur(n, 1)
    Y = a @ LUM
    mid = 1 - np.abs(Y * 2 - 1) ** 2
    return np.clip(a + (n * (0.35 + 0.65 * mid) * 2.2)[..., None], 0, 1)
