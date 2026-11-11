"""One-off: the first journal posts, taken from the channel's own archive in the Музыка Сфер project
(skill/chunks/examples hold real posts with their numbers and dates; posts/ holds saved ones).
Writes content/journal/<date>-<n>.md. Run once; after that the files are the source.
"""
import os, re, sys
SRC = os.path.expanduser('~/Documents/Claude/Projects/🎵 Музыка Сфер')
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'content', 'journal')
MONTHS = {'января': 1, 'февраля': 2, 'марта': 3, 'апреля': 4, 'мая': 5, 'июня': 6, 'июля': 7, 'августа': 8, 'сентября': 9, 'октября': 10, 'ноября': 11, 'декабря': 12}
PHOTO = {48: 'river-wide', 47: 'session-studio', 46: 'lesson-beach', 45: 'session-hand', 44: 'play-close', 42: 'session-forest'}

def unwrap(body, poetic):
    paras = [p for p in re.split(r'\n\s*\n', body.strip()) if p.strip()]
    out = []
    for p in paras:
        lines = [l.strip() for l in p.split('\n')]
        if poetic:
            out.append('\n'.join(lines))
        else:
            out.append(' '.join(lines))
    return out

def clean(paras):
    keep = []
    for p in paras:
        if p.startswith('Обо мне |') or re.fullmatch(r'(#\S+\s*)+', p):
            continue
        keep.append(p)
    return keep

def write(date, number, paras, photo=None, source='telegram', poem=False):
    title = paras[0].split('\n')[0] if poem else paras[0]
    body = paras if poem else paras[1:]
    name = '%s-%s.md' % (date, number)
    fm = ['---', 'date: ' + date, 'number: ' + str(number), 'title: ' + title.replace('\n', ' '), 'source: ' + source]
    if photo:
        fm.append('photo: ' + photo)
    if poem:
        fm.append('kind: poem')
    fm.append('---')
    text = '\n'.join(fm) + '\n\n' + '\n\n'.join(body) + '\n'
    open(os.path.join(OUT, name), 'w', encoding='utf-8').write(text)
    print(name, '|', title[:60].replace('\n', ' / '))

ex = os.path.join(SRC, 'skill', 'chunks', 'examples')
for f in sorted(os.listdir(ex)):
    s = open(os.path.join(ex, f), encoding='utf-8').read()
    for m in re.finditer(r'\*\*пост (\d+)\*\*\s*\(([^)]+)\)[^\n]*\n+```\n(.*?)```', s, re.S):
        n, d, body = int(m.group(1)), m.group(2).split(), m.group(3)
        date = '%s-%02d-%02d' % (d[2], MONTHS[d[1]], int(d[0]))
        poetic = f.startswith('poetic')
        write(date, n, clean(unwrap(body, poetic)), PHOTO.get(n), poem=poetic)

# saved posts: one paragraph per line
p1 = open(os.path.join(SRC, 'posts', '2026-04-22_need-musical-experience.md'), encoding='utf-8').read()
write('2026-04-22', 'a', clean([l.strip() for l in p1.split('\n') if l.strip()]), 'lesson-studio')
p2 = open(os.path.join(SRC, 'posts', '2026-10-28_handpan-sphere-release.md'), encoding='utf-8').read().split('\n---\n')[0]
paras = [p.strip() for p in re.split(r'\n\s*\n', p2) if p.strip()]
write('2026-10-28', 'b', clean(paras), 'hps-app')
