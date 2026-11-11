"""Site photos: one colour grade for every picture, whatever its source.

The grade ("Now grade") makes photos from different shoots and cameras look like one series:
- white balance pulled halfway to a warm grey, so blue noon and orange sunset meet in the middle;
- saturation brought to one common level, greens leaning to olive and blues to slate;
- a soft S-curve with matte warm blacks and paper-coloured highlights (the site's ink and paper);
- the same fine grain.
The native aspect ratio is kept; the layout decides the frame.

Output: src/assets/img/<name>.webp (large) and <name>-s.webp (small), photos.json with sizes and alt,
the hero cutout (hero-cut.webp, with alpha) for the living photo, the catalogue hangs and og.jpg.

Usage: .venv/bin/python tools/photos.py   (numpy + Pillow, see tools/requirements.txt)
"""
import json
import os
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageFilter, ImageOps

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = os.path.expanduser('~/Downloads/Andy Photo Bank')
ALTAI = BANK + '/andy paulina/2025-10-05 ANDY/ANDY'
HPS = os.path.expanduser('~/Downloads/handpan-sphere/docs/photos/src')
APP = os.path.expanduser('~/Downloads/handpan-sphere/marketing/carousels/assets/app')
SUPER = os.path.join(ROOT, 'sources', 'super')
OUT = os.path.join(ROOT, 'src', 'assets', 'img')

# name: (source, alt text)
PHOTOS = {
    'hero-play':       (BANK + '/andy nika phuket/DSC09938.JPG', 'Andy Now играет на ханге'),
    'figure-sea':      (BANK + '/andy nika phuket/DSC00133.JPG', 'Andy Now с хангом на берегу моря'),
    'portrait-smile':  (BANK + '/photo andy handpan/IMG_7040.JPG', 'Andy Now смеётся и играет на ханге'),
    'portrait-band':   (BANK + '/andy/IMG_5736.JPG', 'Andy Now в повязке и очках играет на ханге'),
    'portrait-sun':    (BANK + '/andy nika phuket/DSC09495.JPG', 'Портрет Andy Now на берегу'),
    'play-sun':        (BANK + '/andy nika phuket/DSC09941.JPG', 'Andy Now играет на ханге на солнце'),
    'river-hat':       (ALTAI + '/DSC09998-1.jpg', 'Andy Now играет на ханге у реки на Алтае'),
    'river-play':      (ALTAI + '/DSC09964-1.jpg', 'Andy Now с хангом на камнях у Катуни'),
    'river-wide':      (ALTAI + '/DSC09957-3.jpg', 'Andy Now играет на ханге у реки в горах Алтая'),
    'sculpture':       (ALTAI + '/DSC09370-1.jpg', 'Andy Now с хангом у светящейся скульптуры на Алтае'),
    'lesson-temple':   (ALTAI + '/DSC00037-1.jpg', 'Занятие на ханге у зеркального Храма Звука'),
    'temple-arch':     (ALTAI + '/DSC00080-1.jpg', 'Andy Now у круглой арки перед Храмом Звука'),
    'hang-chest':      (BANK + '/andy nika phuket/DSC09753.JPG', 'Ханг в руках у моря'),
    'hangs-duo':       (BANK + '/andy nika phuket/DSC00281.JPG', 'Два ханга в руках на фоне моря'),
    'hangs-back':      (BANK + '/andy nika phuket/DSC09830.JPG', 'Двое музыкантов спиной к спине с хангами'),
    'hang-detail':     (BANK + '/photo for claude/DSC00087.JPG', 'Край ханга крупным планом'),
    'play-close':      (BANK + '/andy/IMG_5735.JPG', 'Руки над хангом во время игры'),
    'hands-top':       (BANK + '/photo for claude/DSC00012.JPG', 'Руки на ханге и барабане, вид сверху'),
    'lesson-beach':    (BANK + '/photo for claude/DSC00346.JPG', 'Занятие на ханге на пляже'),
    'lesson-dome':     (BANK + '/photo for claude/IMG_5388.jpg', 'Занятие на ханге в куполе с видом на горы'),
    'lesson-outdoor':  (BANK + '/photo andy handpan/IMG_7050.JPG', 'Andy Now играет для группы на открытом воздухе'),
    'school-group':    (BANK + '/photo andy handpan/DSCF0138.JPG', 'Группа учеников с хангами в школе Animara'),
    'session-bowl':    (BANK + '/awakening meditation/IMG_5737.JPG', 'Ханг и поющая чаша на звуковой практике'),
    'session-hand':    (BANK + '/photo for claude/IMG_5390.jpg', 'Ладонь на ханге в полутьме'),
    'session-group':   (BANK + '/awakening meditation/639988361_17946577212107323_9193600887169162334_n.jpg', 'Медитация под открытым небом в Таиланде'),
    'session-lake':    (BANK + '/awakening meditation/IMG_5672.jpg', 'Звуковая медитация у озера в Таиланде'),
    'session-forest':  (BANK + '/handpan bali volcano/IMG_8773.JPG', 'Музыканты играют в туманном лесу на Бали'),
    'session-wedding': (BANK + '/хэндпан свадьба/photo_2026-02-04 14.56.30.jpeg', 'Живой ханг на вечернем событии в лесу'),
    'event-portrait':  (BANK + '/photo andy handpan/3C6728CF-64FE-4E7F-A4C1-4C23041F4D0D.JPG', 'Andy Now играет на ханге на событии'),
    'temple-inside':   (HPS + '/temple-inside.webp', 'Внутри зеркального купола Храма Звука'),
    'temple-winter':   (SUPER + '/temple-winter.webp', 'Зеркальный Храм Звука зимой'),
    'laptop':          (BANK + '/photo_2023-06-23 19.03.08.jpeg', 'Andy Now за ноутбуком'),
    'scarf-gong':      (BANK + '/andy/DSC04273.JPG', 'Andy Now играет на ханге рядом с гонгом'),
}
# screens of the Handpan Sphere app: kept as they are, no grade; (source, alt, crop box in source pixels)
SCREENS = {
    'hps-app': (APP + '/ru-dark-playing.webp', 'Экран Handpan Sphere: ханг D Kurd 10 играет аккорды', (0, 0, 1170, 1462)),
    'hps-pan': (APP + '/ru-dark-pan.webp', 'Ханг в приложении Handpan Sphere: ноты подсвечены цветом', None),
}
HERO_CUT = os.path.join(ROOT, 'sources', 'hero-cut.png')   # tools/lift.swift on DSC09938, cropped
LARGE, SMALL = 1600, 760   # longest side
SEED = 7
LUM = np.array([0.2126, 0.7152, 0.0722], np.float32)
WARM_GREY = np.array([0.53, 0.50, 0.46], np.float32)
INK = np.array([0.16, 0.115, 0.085], np.float32)      # where the shadows lean
PAPER = np.array([0.985, 0.955, 0.905], np.float32)   # where the highlights lean


def open_any(path):
    """Opens JPEG/PNG/WebP directly and HEIC through sips; applies the EXIF orientation."""
    if path.lower().endswith('.heic'):
        tmp = tempfile.mktemp(suffix='.jpg')
        subprocess.run(['sips', '-s', 'format', 'jpeg', path, '--out', tmp], check=True, capture_output=True)
        path = tmp
    im = Image.open(path)
    im.draft('RGB', (LARGE * 2, LARGE * 2))
    return ImageOps.exif_transpose(im).convert('RGB')


def hue(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    d = mx - mn + 1e-6
    return np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60


def band(h, centre, width):
    """1 at the centre hue, 0 beyond ±width degrees."""
    return np.clip(1 - np.abs(((h - centre + 180) % 360) - 180) / width, 0, 1)


def grade(im, mask=None):
    """The Now grade. mask (bool array) limits the statistics to the subject of a cutout."""
    a = np.asarray(im, dtype=np.float32) / 255
    sel = mask if mask is not None else np.ones(a.shape[:2], bool)
    Y = a @ LUM
    # 1. white balance halfway to a warm grey, measured on the midtones
    mid = sel & (Y > 0.2) & (Y < 0.8)
    m = a[mid].mean(0) if mid.sum() > 100 else a[sel].mean(0)
    gain = WARM_GREY / (m / m.mean() * WARM_GREY.mean())
    a = a * (1 + 0.7 * (gain - 1))
    # 2. levels
    Y = a @ LUM
    lo, hi = np.percentile(Y[sel], 0.5), np.percentile(Y[sel], 99.5)
    a = np.clip((a - lo) / max(hi - lo, 1e-3), 0, 1)
    Y = a @ LUM
    # 3. one saturation level for all; greens to olive, blues to slate
    c = a - Y[..., None]
    k = np.clip(0.05 / max(float(np.abs(c[sel]).mean()), 1e-3), 0.5, 1.1)
    h = hue(a)
    green, blue = band(h, 100, 70), band(h, 210, 45)
    a = Y[..., None] + c * (k * (1 - 0.5 * green - 0.45 * blue))[..., None]
    a[..., 0] += 0.12 * green * np.clip(a[..., 1] - a[..., 2], 0, None)
    a = np.clip(a, 0, 1)
    # 4. tone: soft S, matte warm blacks, paper highlights, a warm push
    x = 0.55 * (a * a * (3 - 2 * a)) + 0.45 * a
    Yn = x @ LUM
    ws = ((1 - Yn) ** 2)[..., None] * 0.30
    wl = (Yn ** 2)[..., None] * 0.16
    x = x * (1 - ws - wl) + INK * ws + PAPER * wl
    x = x * np.array([1.02, 1.0, 0.95], np.float32)
    x = 0.055 + 0.915 * x
    return np.clip(x, 0, 1)


def grain(a, amount=2.4):
    """Fine luminance grain, the same on every photo: it evens out cameras and compressions."""
    rng = np.random.default_rng(SEED)
    n = rng.normal(0.0, amount / 255, a.shape[:2]).astype(np.float32)
    n = np.asarray(Image.fromarray(((n * 255) + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.45)), np.float32) / 255 - 0.5
    Y = a @ LUM
    mid = 1 - np.abs(Y * 2 - 1) ** 2
    return np.clip(a + (n * (0.4 + 0.6 * mid) * 1.7)[..., None], 0, 1)


def to_image(a):
    return Image.fromarray((a * 255 + 0.5).astype(np.uint8))


def fit(im, side):
    if max(im.size) <= side:
        return im
    k = side / max(im.size)
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)


def save_pair(name, large, small, meta, alt):
    large.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=82, method=6)
    small.save(os.path.join(OUT, name + '-s.webp'), 'WEBP', quality=80, method=6)
    meta[name] = {'w': large.width, 'h': large.height, 'alt': alt}
    print('%-16s %4dx%-4d %4d KB' % (name, large.width, large.height, os.path.getsize(os.path.join(OUT, name + '.webp')) // 1024))


def videos():
    """Posters of the Rutube videos (frames saved in sources/video), 16:9 at 960 px, same grade."""
    os.makedirs(os.path.join(OUT, 'video'), exist_ok=True)
    for name, f in {'altai': 'altai-spring.jpg', 'temple': 'temple-journey.jpg', 'inner': 'inner-sphere.jpg'}.items():
        im = ImageOps.fit(open_any(os.path.join(ROOT, 'sources', 'video', f)), (960, 540), Image.LANCZOS)
        to_image(grain(grade(im), 2)).save(os.path.join(OUT, 'video', name + '.webp'), 'WEBP', quality=80, method=6)
    print('video posters done')


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):                     # old files: names may have changed
        if f.endswith('.webp'):
            os.remove(os.path.join(OUT, f))
    meta = {}
    for name, (src, alt) in PHOTOS.items():
        im = open_any(src)
        large = to_image(grain(grade(fit(im, LARGE))))
        small = to_image(grain(grade(fit(im, SMALL)), 2))
        save_pair(name, large, small, meta, alt)
    for name, (src, alt, box) in SCREENS.items():
        im = Image.open(src).convert('RGB')
        if box:
            im = im.crop(box)
        save_pair(name, fit(im, 1200), fit(im, SMALL), meta, alt)
    with open(os.path.join(OUT, 'photos.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)

    # the living photo of the first screen: the cutout, graded on the subject only, alpha kept
    cut = Image.open(HERO_CUT).convert('RGBA')
    cut = cut.resize((round(cut.width * 1000 / cut.height), 1000), Image.LANCZOS)
    alpha = np.asarray(cut.split()[3])
    rgb = to_image(grade(cut.convert('RGB'), mask=alpha > 128))
    rgb.putalpha(cut.split()[3])
    rgb.save(os.path.join(OUT, 'hero-cut.webp'), 'WEBP', quality=86, method=6)
    print('hero-cut', rgb.size)

    # the nine-note hangs of the Handpan Sphere catalogue, in the same grade
    hangs_src = os.path.expanduser('~/Downloads/handpan-sphere/dist/photos/hangs')
    os.makedirs(os.path.join(OUT, 'hangs'), exist_ok=True)
    for f in sorted(os.listdir(hangs_src)):
        if f.endswith('-9.webp'):
            im = to_image(grade(open_any(os.path.join(hangs_src, f))))
            im.save(os.path.join(OUT, 'hangs', f), 'WEBP', quality=82, method=6)
            im.resize((300, 300), Image.LANCZOS).save(os.path.join(OUT, 'hangs', f.replace('.webp', '-s.webp')), 'WEBP', quality=80, method=6)
    print('hangs done')

    videos()

    # link preview 1200x630
    og = ImageOps.fit(to_image(grade(fit(open_any(PHOTOS['river-wide'][0]), 2000))), (1200, 630), Image.LANCZOS, centering=(0.5, 0.45))
    og.save(os.path.join(ROOT, 'src', 'static', 'og.jpg'), 'JPEG', quality=86, optimize=True, progressive=True)
    print('og done')


if __name__ == '__main__':
    main()
