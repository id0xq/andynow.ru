"""Site photos: one black-and-white treatment for every picture, whatever its source.

Reads the originals (Andy Photo Bank, Handpan Sphere sources, the andynow.super.site saves),
turns each into the same monochrome: luminance with a skin-friendly channel mix, the same
tonal curve and a fine grain. The native aspect ratio is kept: the layout chooses frames that
fit the picture, so nothing is cropped here.

Output: src/assets/img/<name>.webp (large) and <name>-s.webp (small), plus photos.json with
the sizes, which the build reads for width/height attributes.

Usage: python tools/photos.py   (needs Pillow with WebP; the handpan-sphere .venv has it)
"""
import json
import os
import numpy as np
import subprocess
import tempfile

from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = os.path.expanduser('~/Downloads/Andy Photo Bank')
HPS = os.path.expanduser('~/Downloads/handpan-sphere/docs/photos/src')
SUPER = os.path.join(ROOT, 'sources', 'super')
OUT = os.path.join(ROOT, 'src', 'assets', 'img')

# name: (source, alt text)
PHOTOS = {
    'figure-sea':      (BANK + '/andy nika phuket/DSC00133.JPG', 'Andy Now с хангом на берегу моря'),
    'portrait-smile':  (BANK + '/photo andy handpan/IMG_7040.JPG', 'Andy Now смеётся и играет на ханге'),
    'portrait-band':   (BANK + '/andy/IMG_5736.JPG', 'Andy Now в повязке и очках играет на ханге'),
    'portrait-sun':    (BANK + '/andy nika phuket/DSC09495.JPG', 'Портрет Andy Now на берегу'),
    'river-backlit':   (BANK + '/andy paulina/DSC09999-2_resized.jpg', 'Andy Now играет на ханге против солнца у реки'),
    'river-wide':      (BANK + '/andy paulina/DSC09957-3.jpg', 'Andy Now играет на ханге у реки в горах Алтая'),
    'hang-chest':      (BANK + '/andy nika phuket/DSC09753.JPG', 'Ханг в руках у моря'),
    'hangs-duo':       (BANK + '/andy nika phuket/DSC00281.JPG', 'Два ханга в руках на фоне моря'),
    'hangs-back':      (BANK + '/andy nika phuket/DSC09830.JPG', 'Двое музыкантов спиной к спине с хангами'),
    'hang-detail':     (BANK + '/photo for claude/DSC00087.JPG', 'Край ханга крупным планом'),
    'play-close':      (BANK + '/andy/IMG_5735.JPG', 'Руки над хангом во время игры'),
    'hands-top':       (BANK + '/photo for claude/DSC00012.JPG', 'Руки на ханге и барабане, вид сверху'),
    'lesson-beach':    (BANK + '/photo for claude/DSC00346.JPG', 'Занятие на ханге на пляже'),
    'lesson-studio':   (BANK + '/photo andy handpan/IMG_7236.JPG', 'Занятие на ханге в студии'),
    'lesson-dome':     (BANK + '/photo for claude/IMG_5388.jpg', 'Занятие на ханге в куполе с видом на горы'),
    'lesson-outdoor':  (BANK + '/photo andy handpan/IMG_7408.JPG', 'Andy Now показывает приём ученику'),
    'school-group':    (BANK + '/photo andy handpan/DSCF0138.JPG', 'Группа учеников с хангами в школе Animara'),
    'session-studio':  (BANK + '/soundhealing/IMG_9570.jpg', 'Звуковая сессия: Andy Now играет, участники лежат'),
    'session-hand':    (BANK + '/photo for claude/IMG_5390.jpg', 'Ладонь на ханге в полутьме'),
    'session-group':   (BANK + '/awakening meditation/639988361_17946577212107323_9193600887169162334_n.jpg', 'Медитация под открытым небом в Таиланде'),
    'session-forest':  (BANK + '/handpan bali volcano/IMG_8773.JPG', 'Музыканты играют в туманном лесу на Бали'),
    'session-wedding': (BANK + '/хэндпан свадьба/photo_2026-02-04 14.56.30.jpeg', 'Живой ханг на вечернем событии в лесу'),
    'event-portrait':  (BANK + '/photo andy handpan/3C6728CF-64FE-4E7F-A4C1-4C23041F4D0D.JPG', 'Andy Now играет на ханге на событии'),
    'temple-arch':     (BANK + '/photo for claude/DSC00080-1_resized.jpg', 'Andy Now у круглой арки перед Храмом Звука'),
    'temple-inside':   (HPS + '/temple-inside.webp', 'Внутри зеркального купола Храма Звука'),
    'temple-winter':   (SUPER + '/temple-winter.webp', 'Зеркальный Храм Звука зимой'),
    'laptop':          (BANK + '/photo_2023-06-23 19.03.08.jpeg', 'Andy Now за ноутбуком'),
    'scarf-gong':      (BANK + '/andy/DSC04273.JPG', 'Andy Now играет на ханге рядом с гонгом'),
    'hps-app':         (os.path.expanduser('~/Downloads/handpan-sphere/avatar.png'), 'Схема ханга в приложении Handpan Sphere'),
}
LARGE, SMALL = 1600, 760   # longest side
SEED = 7


def open_any(path):
    """Opens JPEG/PNG/WebP directly and HEIC through sips; applies the EXIF orientation."""
    if path.lower().endswith('.heic'):
        tmp = tempfile.mktemp(suffix='.jpg')
        subprocess.run(['sips', '-s', 'format', 'jpeg', path, '--out', tmp], check=True, capture_output=True)
        path = tmp
    im = Image.open(path)
    im.draft('RGB', (LARGE * 2, LARGE * 2))
    return ImageOps.exif_transpose(im).convert('RGB')


def mono(im):
    """The site's monochrome: channel mix, levels, a soft S-curve."""
    r, g, b = im.split()
    gray = Image.merge('RGB', (r, g, b)).convert('L', (0.36, 0.53, 0.11, 0))
    gray = ImageOps.autocontrast(gray, cutoff=(0.5, 0.3))
    curve = []
    for i in range(256):
        x = i / 255
        s = x * x * (3 - 2 * x)          # smoothstep
        curve.append(round(255 * (0.55 * s + 0.45 * x)))
    return gray.point(curve)


def grain(gray, amount=2.6):
    """Fine luminance grain, the same on every photo: it evens out the different cameras and compressions."""
    rng = np.random.default_rng(SEED)
    a = np.asarray(gray, dtype=np.float32)
    noise = rng.normal(0.0, amount, a.shape).astype(np.float32)
    noise = np.asarray(Image.fromarray(noise + 128).convert('L').filter(ImageFilter.GaussianBlur(0.4)), dtype=np.float32) - 128
    # stronger in the mid-tones, almost none in pure white and black
    mid = 1 - np.abs(a / 127.5 - 1) ** 2
    return Image.fromarray(np.clip(a + noise * (0.35 + 0.65 * mid) * 1.6, 0, 255).astype(np.uint8))


def fit(im, side):
    if max(im.size) <= side:
        return im
    k = side / max(im.size)
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    meta = {}
    for name, (src, alt) in PHOTOS.items():
        im = open_any(src)
        large = grain(mono(fit(im, LARGE)))
        small = grain(mono(fit(im, SMALL)), 2)
        large.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=80, method=6)
        small.save(os.path.join(OUT, name + '-s.webp'), 'WEBP', quality=78, method=6)
        meta[name] = {'w': large.width, 'h': large.height, 'alt': alt}
        print('%-16s %4dx%-4d %4d KB' % (name, large.width, large.height, os.path.getsize(os.path.join(OUT, name + '.webp')) // 1024))
    with open(os.path.join(OUT, 'photos.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)

    # the nine-note hangs of the Handpan Sphere catalogue, in the same monochrome
    hangs_src = os.path.expanduser('~/Downloads/handpan-sphere/dist/photos/hangs')
    os.makedirs(os.path.join(OUT, 'hangs'), exist_ok=True)
    for f in sorted(os.listdir(hangs_src)):
        if f.endswith('-9.webp'):
            im = mono(open_any(os.path.join(hangs_src, f)))
            im.save(os.path.join(OUT, 'hangs', f), 'WEBP', quality=80, method=6)
            im.resize((300, 300), Image.LANCZOS).save(os.path.join(OUT, 'hangs', f.replace('.webp', '-s.webp')), 'WEBP', quality=80, method=6)
    print('hangs done')

    # link preview 1200x630
    og = ImageOps.fit(mono(open_any(PHOTOS['river-wide'][0])), (1200, 630), Image.LANCZOS, centering=(0.5, 0.45))
    og.convert('RGB').save(os.path.join(ROOT, 'src', 'static', 'og.jpg'), 'JPEG', quality=84, optimize=True, progressive=True)
    print('og done')


if __name__ == '__main__':
    main()
