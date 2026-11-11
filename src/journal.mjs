// The journal: posts of the channel «Музыка Сфер».
// Two sources, merged: content/journal/*.md (curated, with a photo of the site's series)
// and content/telegram/posts.json (collected by tools/telegram.mjs whenever the channel lets the web read it).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc } from './layout.mjs';
import { SITE } from './content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MD_DIR = join(ROOT, 'content', 'journal');
const TG_FILE = join(ROOT, 'content', 'telegram', 'posts.json');

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
export const humanDate = (iso) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
const slugify = (s) => s.toLowerCase().split('').map((c) => TR[c] ?? c).join('')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').split('-').slice(0, 6).join('-');

const EMOJI_START = /^[\p{Extended_Pictographic}️‍\s]+/u;
const stripEmoji = (s) => s.replace(EMOJI_START, '');

// plain text → HTML: paragraphs, line breaks, links for addresses and @names
function linkify(text) {
  return esc(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[\s(])((?:[a-z0-9-]+\.)+(?:ru|com|xyz|link|pro)\b(?:\/[^\s<]*)?)/g, '$1<a href="https://$2" target="_blank" rel="noopener">$2</a>')
    .replace(/(^|[\s(])@([A-Za-z0-9_]{4,})/g, '$1<a href="https://t.me/$2" target="_blank" rel="noopener">@$2</a>');
}
const toHtml = (paras) => paras.map((p) => '<p>' + linkify(p).replace(/\n/g, '<br>') + '</p>').join('');

function readMd(file) {
  const raw = readFileSync(join(MD_DIR, file), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = Object.fromEntries(m[1].split('\n').map((l) => { const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
  const body = m[2].trim().split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const poetic = meta.kind === 'poem';
  return { source: 'md', date: meta.date, number: meta.number, title: meta.title, photo: meta.photo || null, body, poetic };
}

function readTelegram() {
  if (!existsSync(TG_FILE)) return [];
  return JSON.parse(readFileSync(TG_FILE, 'utf8')).filter((p) => p.text).map((p) => {
    const paras = p.text.split('\n').map((s) => s.trim()).filter(Boolean);
    return { source: 'tg', id: p.id, date: p.date.slice(0, 10), title: paras[0].slice(0, 140), html: p.html, images: p.images || [], link: p.link, body: paras.slice(1), poetic: false };
  });
}

const norm = (s) => stripEmoji(s).toLowerCase().replace(/[^a-zа-яё0-9]/g, '').slice(0, 40);

export function loadPosts() {
  const md = readdirSync(MD_DIR).filter((f) => f.endsWith('.md')).map(readMd);
  const tg = readTelegram();
  const seen = new Set(md.map((p) => p.date + norm(p.title)));
  const all = [...md, ...tg.filter((p) => !seen.has(p.date + norm(p.title)))];
  all.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const used = new Set();
  return all.map((p) => {
    let slug = p.date + '-' + (slugify(stripEmoji(p.title)) || 'post');
    while (used.has(slug)) slug += '-2';
    used.add(slug);
    const title = p.poetic ? null : stripEmoji(p.title);
    const html = p.source === 'tg' ? p.html : toHtml(p.body);
    const plain = p.body.join(' ').replace(/\s+/g, ' ').trim();
    const excerpt = plain.length > 220 ? plain.slice(0, 220).replace(/\s+\S*$/, '') + '…' : plain;
    return {
      ...p, slug, title, html, excerpt,
      poem: p.poetic ? p.body.join('\n\n') : null,
      url: `/journal/${slug}/`,
      link: p.link || SITE.channel,
      human: humanDate(p.date),
    };
  });
}
