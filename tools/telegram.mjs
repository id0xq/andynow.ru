// The journal's only source: the Telegram channel «Музыка Сфер» (@Music_ofSpheres).
//
// Every public post is served as an embed: https://t.me/Music_ofSpheres/<id>?embed=1. This script walks
// the post numbers, reads each embed (text, date, views, photos; for a video or a link, its preview
// picture), and writes content/telegram/posts.json with the pictures next to it in content/telegram/img.
//
// An album in Telegram is several messages in a row with the same text, and each of them answers with
// the whole album: such messages become one post, linked to the first of them. A post the network
// failed to read keeps its last known version; a post Telegram says is gone leaves the journal.
// The GitHub workflow runs this before every build, so new posts appear by themselves; the posts.json
// in the repository is the last snapshot and the fallback if Telegram does not answer.
//
// Usage: node tools/telegram.mjs [--from=ID]
import { mkdir, readFile, writeFile, readdir, unlink, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHANNEL = 'Music_ofSpheres';
const OUT = join(ROOT, 'content', 'telegram');
const IMG = join(OUT, 'img');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const MISSES_TO_STOP = 30; // consecutive missing ids after the newest post
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => access(p).then(() => true, () => false);
const FAILED = Symbol('failed');   // the network did not answer: not the same as "no such post"

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ru' } });
      if (res.ok) return res;
      if (res.status === 404) return null;
    } catch (e) { /* retry */ }
    await sleep(800 * (i + 1));
  }
  return FAILED;
}

// named and numeric entities (&#33; is "!")
const decode = (s) => s
  .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&');

// The message text as safe, minimal HTML: paragraphs, line breaks, bold, italic, links.
function cleanText(raw) {
  let s = raw
    .replace(/<i class="emoji"[^>]*><b>(.*?)<\/b><\/i>/g, '$1')       // emoji images → the emoji itself
    .replace(/<tg-emoji[^>]*>(.*?)<\/tg-emoji>/g, '$1')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g, (m, href, text) => '\u0001' + decode(href) + '\u0002' + text + '\u0003')
    .replace(/<(\/?)(b|strong)>/g, '\u0004$1b\u0005')
    .replace(/<(\/?)(i|em)>/g, '\u0004$1i\u0005')
    .replace(/<[^>]+>/g, '');
  s = decode(s);
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  s = esc(s)
    .replace(/\u0001([^\u0002]*)\u0002([^\u0003]*)\u0003/g, (m, href, text) => {
      const safe = /^(https?:|tg:|mailto:)/.test(href) ? href.replace(/"/g, '%22') : '#';
      return '<a href="' + safe + '" target="_blank" rel="noopener">' + text + '</a>';
    })
    .replace(/\u0004(\/?)(b|i)\u0005/g, '<$1$2>');
  const paragraphs = s.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return paragraphs.map((p) => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');
}

const plain = (html) => decode(html.replace(/<br>/g, ' ').replace(/<\/p><p>/g, '\n').replace(/<[^>]+>/g, '')).trim();
const bg = (html, cls) => [...html.matchAll(new RegExp(cls + '[^"]*"[^>]*style="[^"]*background-image:url\\(\'([^\']+)\'\\)', 'g'))].map((m) => m[1]);

function parse(id, html) {
  if (/tgme_widget_message_error|Post not found/.test(html) || !/tgme_widget_message_bubble/.test(html)) return null;
  const textMatch = html.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>(?=\s*<div class="tgme_widget_message_(?:footer|link_preview|reply_markup)|\s*<\/div>)/);
  const time = (html.match(/<time[^>]*datetime="([^"]+)"/) || [])[1] || null;
  const views = (html.match(/tgme_widget_message_views">([^<]*)</) || [])[1] || '';
  const photos = bg(html, 'tgme_widget_message_photo_wrap');
  const videos = bg(html, 'tgme_widget_message_video_thumb');
  const previews = bg(html, 'link_preview_(?:right_)?image');
  const htmlText = textMatch ? cleanText(textMatch[1]) : '';
  return {
    id,
    date: time,
    views,
    html: htmlText,
    text: plain(htmlText),
    pictures: photos.length || videos.length ? [...photos, ...videos] : previews.slice(0, 1),
    forwarded: /tgme_widget_message_forwarded_from/.test(html),
    link: `https://t.me/${CHANNEL}/${id}`,
  };
}

async function fetchPost(id) {
  const res = await get(`https://t.me/${CHANNEL}/${id}?embed=1&mode=tme`);
  if (res === FAILED || res === null) return res;
  return parse(id, await res.text());
}

async function saveImage(url, name) {
  const file = join(IMG, name);
  if (await exists(file)) return name;
  const res = await get(url.startsWith('//') ? 'https:' + url : url);
  if (!res || res === FAILED) return null;
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  return name;
}

const same = (a, b) => a.text === b.text && (a.date || '').slice(0, 10) === (b.date || '').slice(0, 10) && a.pictures.length === b.pictures.length;

async function main() {
  await mkdir(IMG, { recursive: true });
  let known = [];
  try { known = JSON.parse(await readFile(join(OUT, 'posts.json'), 'utf8')); } catch (e) { /* first run */ }
  const knownById = new Map(known.map((p) => [p.id, p]));
  const start = Number(args.from || Math.max(0, ...known.map((p) => p.id)) || 69);

  // 1. the newest post: walk up from the last known one until a long run of missing ids
  let newest = start, misses = 0, id = start;
  while (misses < MISSES_TO_STOP) {
    id++;
    const post = await fetchPost(id);
    if (post && post !== FAILED) { newest = id; misses = 0; } else misses++;
    await sleep(120);
  }
  console.log('newest post', newest);

  // 2. every message from the first to the newest
  const messages = [];
  let failed = 0;
  for (let i = 1; i <= newest; i++) {
    const post = await fetchPost(i);
    await sleep(120);
    if (post === FAILED) {                         // keep what we knew
      failed++;
      if (knownById.has(i)) messages.push({ ...knownById.get(i), kept: true });
      continue;
    }
    if (post && (post.text || post.pictures.length)) messages.push(post);
    process.stdout.write('.');
  }

  // 3. albums: messages in a row with the same text, day and pictures are one post (the first id)
  messages.sort((a, b) => a.id - b.id);
  const posts = [];
  for (const m of messages) {
    const prev = posts.at(-1);
    if (prev && !m.kept && !prev.kept && m.id - prev.lastId <= 1 && same(prev, m)) { prev.lastId = m.id; continue; }
    posts.push({ ...m, lastId: m.id });
  }

  // 4. pictures of the posts that stay; pictures nobody uses go away
  const keep = new Set();
  for (const p of posts) {
    if (p.kept) { (p.images || []).forEach((n) => keep.add(n)); continue; }
    p.images = [];
    for (const [k, url] of p.pictures.entries()) {
      const saved = await saveImage(url, `${p.id}-${k}.jpg`);
      if (saved) { p.images.push(saved); keep.add(saved); }
    }
  }
  for (const f of await readdir(IMG)) if (!keep.has(f)) await unlink(join(IMG, f));

  const out = posts.map(({ pictures, lastId, kept, ...p }) => p).sort((a, b) => b.id - a.id);
  await writeFile(join(OUT, 'posts.json'), JSON.stringify(out, null, 1));
  console.log('\nposts', out.length, 'messages', messages.length, 'not read', failed);
}

main().catch((e) => { console.error(e); process.exit(1); });
