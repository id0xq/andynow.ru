// The journal: posts of the Telegram channel «Музыка Сфер», its only source.
// tools/telegram.mjs reads the channel into content/telegram/posts.json (albums already joined into one
// post, pictures in content/telegram/img); this module turns those posts into the journal's entries.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from './content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
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
const tagless = (html) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();

// The title is the post's first line; a long first line gives its first sentence, or its first words.
function titleOf(line) {
  if (line.length <= 90) return { title: line, whole: true };
  const sentence = line.match(/^(.{20,90}?[.!?…])(\s|$)/);
  if (sentence) return { title: sentence[1], whole: false };
  return { title: line.slice(0, 80).replace(/\s+\S*$/, '') + '…', whole: false };
}

// When the first line became the title, it leaves the body so it is not read twice.
function dropFirstLine(html, line) {
  const m = html.match(/^<p>([\s\S]*?)(<br>|<\/p>)/);
  if (!m || stripEmoji(tagless(m[1])) !== line) return html;
  return m[2] === '<br>' ? '<p>' + html.slice(m[0].length) : html.slice(m[0].length);
}

export function loadPosts() {
  if (!existsSync(TG_FILE)) return [];
  const raw = JSON.parse(readFileSync(TG_FILE, 'utf8')).filter((p) => p.text && p.date);
  raw.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  // a first line that several posts share ("Релиз нового видео на YouTube!") takes the next line along,
  // so that different posts never look like copies of each other
  const firsts = raw.map((p) => stripEmoji(p.text.split('\n')[0].trim()));
  const repeated = new Set(firsts.filter((f, i) => firsts.indexOf(f) !== i));
  const used = new Set();
  return raw.map((p) => {
    const lines = p.text.split('\n').map((s) => s.trim()).filter(Boolean);
    const first = stripEmoji(lines[0]);
    let { title, whole } = titleOf(first);
    if (repeated.has(first) && whole && lines[1]) {
      title = first + ' ' + (lines[1].length > 60 ? lines[1].slice(0, 58).replace(/\s+\S*$/, '') + '…' : lines[1]);
    }
    const date = p.date.slice(0, 10);
    let slug = date + '-' + (slugify(title) || 'post');
    while (used.has(slug)) slug += '-2';
    used.add(slug);
    const rest = (whole ? lines.slice(1) : [first.slice(title.replace(/…$/, '').length), ...lines.slice(1)]).join(' ').replace(/\s+/g, ' ').trim();
    const excerpt = rest.length > 220 ? rest.slice(0, 220).replace(/\s+\S*$/, '') + '…' : rest;
    return {
      id: p.id, date, slug, title, excerpt,
      html: whole ? dropFirstLine(p.html, first) : p.html,
      images: p.images || [],
      photo: null, poem: null,
      url: `/journal/${slug}/`,
      link: p.link || SITE.channel,
      human: humanDate(date),
    };
  });
}
