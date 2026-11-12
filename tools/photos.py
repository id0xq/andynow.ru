"""Site photos: one cinematic grade for every picture, whatever its source (tools/cine.py).

The grade keeps the photographers' colour and adds depth: deep soft blacks, a filmic highlight
roll-off, clarity in the midtones, teal shadows against amber highlights, living colour with skin
protected, a quiet vignette and very fine grain. The native aspect ratio is kept; the layout decides
the frame. Covers of the Handpan Sphere carousels and the ~ontheflow./ render go without a grade.

Output: src/assets/img/<name>.webp (1600 px), <name>-m.webp (1200 px), <name>-s.webp (720 px, longest side),
photos.json with widths, alt and a tiny blurred preview (lq) that shows while the photo loads;
the first screen (hero-sea.webp: the frame and Andy stepping out of it, with alpha), the catalogue hangs, og.jpg.

Usage: .venv/bin/python tools/photos.py            everything (numpy + Pillow, see tools/requirements.txt)
       .venv/bin/python tools/photos.py name …     only these photos
"""
import base64
import io
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageFilter, ImageOps

import cine

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = os.path.expanduser('~/Downloads/Andy Photo Bank')
ALTAI = BANK + '/andy paulina/2025-10-05 ANDY/ANDY'
HPS = os.path.expanduser('~/Downloads/handpan-sphere/docs/photos/src')
CAROUSEL = os.path.expanduser('~/Downloads/handpan-sphere/marketing/carousels/out/publish/ig-ru')
SUPER = os.path.join(ROOT, 'sources', 'super')
OUT = os.path.join(ROOT, 'src', 'assets', 'img')

# name: (source, alt text)
PHOTOS = {
    'hero-play':       (BANK + '/andy nika phuket/DSC09938.JPG', 'Andy Now играет на ханге'),
    'portrait-band':   (BANK + '/andy/IMG_5736.JPG', 'Andy Now в повязке и очках играет на ханге'),
    'play-sun':        (BANK + '/andy nika phuket/DSC09941.JPG', 'Andy Now играет на ханге на солнце'),
    'river-hat':       (ALTAI + '/DSC09998-1.jpg', 'Andy Now играет на ханге у реки на Алтае'),
    'river-wide':      (ALTAI + '/DSC09957-3.jpg', 'Andy Now играет на ханге у реки в горах Алтая'),
    'sculpture':       (ALTAI + '/DSC09370-1.jpg', 'Andy Now с хангом у светящейся скульптуры на Алтае'),
    'temple-arch':     (ALTAI + '/DSC00080-1.jpg', 'Andy Now у круглой арки перед Храмом Звука'),
    'hang-chest':      (BANK + '/andy nika phuket/DSC09753.JPG', 'Ханг в руках у моря'),
    'hangs-back':      (BANK + '/andy nika phuket/DSC09837.JPG', 'Двое музыкантов спиной к спине с хангами'),
    'hang-detail':     (BANK + '/photo for claude/DSC00087.JPG', 'Край ханга крупным планом'),
    'play-close':      (BANK + '/andy/IMG_5735.JPG', 'Руки над хангом во время игры'),
    'hands-top':       (BANK + '/photo for claude/DSC00012.JPG', 'Руки на ханге и барабане, вид сверху'),
    'lesson-beach':    (BANK + '/photo for claude/DSC00346.JPG', 'Занятие на ханге на пляже'),
    'lesson-dome':     (BANK + '/photo for claude/IMG_5388.jpg', 'Занятие на ханге в куполе с видом на горы'),
    'school-group':    (BANK + '/photo andy handpan/DSCF0138.JPG', 'Группа учеников с хангами в школе Animara'),
    'session-bowl':    (BANK + '/awakening meditation/IMG_5737.JPG', 'Ханг и поющая чаша на звуковой практике'),
    'session-hand':    (BANK + '/photo for claude/IMG_5390.jpg', 'Ладонь на ханге в полутьме'),
    'session-lake':    (BANK + '/awakening meditation/IMG_5672.jpg', 'Звуковая медитация у озера в Таиланде'),
    'session-forest':  (BANK + '/handpan bali volcano/IMG_8773.JPG', 'Музыканты играют в туманном лесу на Бали'),
    'session-wedding': (BANK + '/хэндпан свадьба/photo_2026-02-04 14.56.30.jpeg', 'Живой ханг на вечернем событии в лесу'),
    'event-portrait':  (BANK + '/photo andy handpan/3C6728CF-64FE-4E7F-A4C1-4C23041F4D0D.JPG', 'Andy Now играет на ханге на событии'),
    'temple-inside':   (HPS + '/temple-inside.webp', 'Внутри зеркального купола Храма Звука'),
    'temple-winter':   (SUPER + '/temple-winter.webp', 'Зеркальный Храм Звука зимой'),
    'temple-sunrise':  (HPS + '/temple-sunrise.webp', 'Зеркальный Храм Звука на рассвете, Алтай'),
    'temple-summer':   (BANK + '/DJI_20240401003113_0213_D.JPG', 'Зеркальный Храм Звука летом в долине Катуни'),
    'cinematic':       (os.path.expanduser('~/Downloads/now./синематик 2/DSC01232.jpg'), 'Съёмка на телефон: кадр школы мобильной видеосъёмки Синематик'),
    # the learning photos of handpansphere.ru
    'andy-hat':        (HPS + '/andy-hat.jpg', 'Andy Now в шляпе играет на ханге на закате, Алтай'),
    'andy-river':      (HPS + '/andy-river.jpg', 'Andy Now с хангом у горной реки на Алтае'),
    'altai-glow':      (HPS + '/altai-glow.jpg', 'Ханг у светящейся скульптуры в долине Алтая'),
    'beach-djembe':    (HPS + '/beach-djembe.jpg', 'Занятие на пляже: ханг и джембе'),
    'beach-duo':       (HPS + '/beach-duo.jpg', 'Andy Now и ученица играют на хангах на пляже'),
    'offer-lesson':    (HPS + '/offer-lesson-water.jpg', 'Andy Now играет на ханге у воды на закате'),
    'offer-healing':   (HPS + '/offer-healing-session.jpg', 'Звуковая сессия с хангом'),
    'laptop':          (BANK + '/photo_2023-06-23 19.03.08.jpeg', 'Andy Now за ноутбуком'),
}
# Handpan Sphere: covers of the Instagram carousels, kept as they are, no grade; (source, alt, crop box)
SCREENS = {
    'hps-atmo':   (CAROUSEL + '/01-intro/01.jpg', 'Handpan Sphere: атмосфера в строе твоего ханга', None),
    'hps-chords': (CAROUSEL + '/03-learn/01.jpg', 'Handpan Sphere: аккорды загораются на схеме', None),
    'otf-sphere': (os.path.join(ROOT, 'sources', 'ontheflow-sphere.png'), '~ontheflow./: оранжевая сфера в мурмурации (tools/sphere.py)', None),
}
# the first screen: DSC00134 at 2400x3200 and its subject mask (swift tools/lift.swift sources/sea.jpg cut.png sources/sea-mask.png)
SEA = os.path.join(ROOT, 'sources', 'sea.jpg')
SEA_MASK = os.path.join(ROOT, 'sources', 'sea-mask.png')
FRAME_TOP = 0.36   # the frame starts here; above it only Andy stands out, over the page
SIZES = {'': 1600, '-m': 1200, '-s': 720}   # longest side of each file
SEED = 7


def open_any(path):
    """Opens JPEG/PNG/WebP directly and HEIC through sips; applies the EXIF orientation."""
    if path.lower().endswith('.heic'):
        tmp = tempfile.mktemp(suffix='.jpg')
        subprocess.run(['sips', '-s', 'format', 'jpeg', path, '--out', tmp], check=True, capture_output=True)
        path = tmp
    im = Image.open(path)
    im.draft('RGB', (SIZES[''] * 2, SIZES[''] * 2))
    return ImageOps.exif_transpose(im).convert('RGB')


def grade(im, mask=None, **_):
    """The cinematic grade (tools/cine.py); mask limits its statistics to the subject."""
    return cine.grade(im, mask=mask)


def grain(a, amount=2.4):
    return cine.grain(a, amount * 0.55)


def to_image(a):
    return Image.fromarray((a * 255 + 0.5).astype(np.uint8))


def fit(im, side):
    if max(im.size) <= side:
        return im
    k = side / max(im.size)
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)


def preview(im):
    """A 16 px wide blurred preview as a data URI: the photo's colours show at once, the file follows."""
    t = im.convert('RGB').resize((16, max(1, round(16 * im.height / im.width))), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    buf = io.BytesIO()
    t.save(buf, 'WEBP', quality=45)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()


def save_set(name, im, meta, alt, graded=True):
    """im: the picture at the largest size (graded array or PIL image). Writes the three sizes."""
    big = to_image(im) if graded else im
    widths = []
    for suffix, side in SIZES.items():
        k = min(1, side / max(big.size))
        if suffix and k == 1 and widths:          # the source is smaller than this size: nothing to add
            continue
        out = big if k == 1 else big.resize((round(big.width * k), round(big.height * k)), Image.LANCZOS)
        if graded:
            out = to_image(grain(np.asarray(out, np.float32) / 255, 2.4 if not suffix else 2.0))
        out.save(os.path.join(OUT, name + suffix + '.webp'), 'WEBP', quality=80 if suffix else 82, method=6)
        widths.append(out.width)
    meta[name] = {'w': big.width, 'h': big.height, 'alt': alt, 'widths': sorted(set(widths)), 'lq': preview(big)}
    print('%-16s %4dx%-4d %4d KB  %s' % (name, big.width, big.height, os.path.getsize(os.path.join(OUT, name + '.webp')) // 1024, meta[name]['widths']))


def hero(meta):
    """The first screen: the photo in a frame that starts at FRAME_TOP, and Andy above that line cut
    out of the sky, so he stands out of the frame onto the page. One RGBA file per size."""
    src, m = Image.open(SEA).convert('RGB'), Image.open(SEA_MASK).convert('L')
    core = m.filter(ImageFilter.MinFilter(9))     # the inside of the subject, for clean edge colours
    for suffix, side in (('', 1600), ('-s', 960)):
        h = side
        w = round(src.width * h / src.height)
        mask = np.asarray(m.resize((w, h), Image.LANCZOS), np.float32) / 255
        a = grain(grade(src.resize((w, h), Image.LANCZOS), mask=mask > 0.5, blue=0.16), 2.4 if not suffix else 2.0)
        # above the frame the edge pixels carry blue sky: give them the colour of the subject next to them
        c = np.asarray(core.resize((w, h), Image.LANCZOS), np.float32)[..., None] / 255
        num, den = blur_rgb(a * c, 6), blur_rgb(np.repeat(c, 3, -1), 6)
        top = round(h * FRAME_TOP)
        edge = (mask < 0.995) & (den[..., 0] > 0.03)
        edge[top:] = False
        a[edge] = (num / np.maximum(den, 1e-3))[edge]
        alpha = np.clip((mask - 0.1) / 0.9, 0, 1)
        alpha[top:] = 1
        im = Image.fromarray((np.dstack([a, alpha]) * 255 + 0.5).astype(np.uint8), 'RGBA')
        im.save(os.path.join(OUT, 'hero-sea' + suffix + '.webp'), 'WEBP', quality=84, method=6)
        if not suffix:
            meta['hero-sea'] = {'w': w, 'h': h, 'alt': 'Andy Now с хангом на камнях у моря, Пхукет', 'frameTop': FRAME_TOP}
    print('hero-sea done')


def blur_rgb(x, r):
    return np.stack([np.asarray(Image.fromarray((x[..., k] * 255 + 0.5).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32) / 255 for k in range(x.shape[-1])], -1)


def videos():
    """Posters of the Rutube videos (frames saved in sources/video), 16:9 at 960 px, same grade."""
    os.makedirs(os.path.join(OUT, 'video'), exist_ok=True)
    for name, f in {'altai': 'altai-spring.jpg', 'temple': 'temple-journey.jpg', 'inner': 'inner-sphere.jpg'}.items():
        im = ImageOps.fit(open_any(os.path.join(ROOT, 'sources', 'video', f)), (960, 540), Image.LANCZOS)
        to_image(grain(grade(im), 2)).save(os.path.join(OUT, 'video', name + '.webp'), 'WEBP', quality=80, method=6)
    print('video posters done')


def only(names):
    """Re-renders just these photos and keeps everything else in photos.json."""
    path = os.path.join(OUT, 'photos.json')
    meta = json.load(open(path, encoding='utf-8'))
    for name in names:
        if name in PHOTOS:
            src, alt = PHOTOS[name]
            save_set(name, grade(fit(open_any(src), SIZES[''])), meta, alt)
        elif name in SCREENS:
            src, alt, box = SCREENS[name]
            im = Image.open(src).convert('RGB')
            save_set(name, fit(im.crop(box) if box else im, SIZES['']), meta, alt, graded=False)
        else:
            raise SystemExit('no photo ' + name)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)


def main():
    if len(sys.argv) > 1:                          # photos.py name …
        return only(sys.argv[1:])
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):                     # old files: names may have changed
        if f.endswith('.webp'):
            os.remove(os.path.join(OUT, f))
    meta = {}
    for name, (src, alt) in PHOTOS.items():
        save_set(name, grade(fit(open_any(src), SIZES[''])), meta, alt)
    for name, (src, alt, box) in SCREENS.items():
        im = Image.open(src).convert('RGB')
        if box:
            im = im.crop(box)
        save_set(name, fit(im, SIZES['']), meta, alt, graded=False)
    hero(meta)
    with open(os.path.join(OUT, 'photos.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)

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
