// Journal from the Telegram channel «Музыка Сфер» (@Music_ofSpheres).
//
// The channel has its web preview (t.me/s/…) turned off, but every public post is still served as an
// embed: https://t.me/Music_ofSpheres/<id>?embed=1. This script walks the post numbers, reads each embed,
// keeps text, date, views and photos, saves the photos next to the data and writes content/telegram/posts.json.
// Run it before the build; the GitHub workflow runs it on a schedule, so new posts appear by themselves.
//
// Usage: node tools/telegram.mjs [--from=ID] [--limit=N]
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHANNEL = 'Music_ofSpheres';
const OUT = join(ROOT, 'content', 'telegram');
const IMG = join(OUT, 'img');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const MISSES_TO_STOP = 30; // consecutive missing ids after the newest post
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const LIMIT = Number(args.limit || 80);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => access(p).then(() => true, () => false);

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ru' } });
      if (res.ok) return res;
      if (res.status === 404) return null;
    } catch (e) { /* retry */ }
    await sleep(800 * (i + 1));
  }
  return null;
}

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

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

function parse(id, html) {
  if (/tgme_widget_message_error|Post not found/.test(html) || !/tgme_widget_message_bubble/.test(html)) return null;
  const textMatch = html.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>(?=\s*<div class="tgme_widget_message_(?:footer|link_preview|reply_markup)|\s*<\/div>)/);
  const time = (html.match(/<time[^>]*datetime="([^"]+)"/) || [])[1] || null;
  const views = (html.match(/tgme_widget_message_views">([^<]*)</) || [])[1] || '';
  const photos = [...html.matchAll(/tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\('([^']+)'\)/g)].map((m) => m[1]);
  const videoThumbs = [...html.matchAll(/tgme_widget_message_video_thumb"[^>]*style="[^"]*background-image:url\('([^']+)'\)/g)].map((m) => m[1]);
  const forwarded = /tgme_widget_message_forwarded_from/.test(html);
  const audio = /tgme_widget_message_(voice|audio|document)/.test(html);
  const htmlText = textMatch ? cleanText(textMatch[1]) : '';
  return {
    id,
    date: time,
    views,
    html: htmlText,
    text: plain(htmlText),
    photos,
    videos: videoThumbs,
    audio,
    forwarded,
    link: `https://t.me/${CHANNEL}/${id}`,
  };
}

async function fetchPost(id) {
  const res = await get(`https://t.me/${CHANNEL}/${id}?embed=1&mode=tme`);
  if (!res) return null;
  return parse(id, await res.text());
}

async function saveImage(url, name) {
  const file = join(IMG, name);
  if (await exists(file)) return name;
  const res = await get(url.startsWith('//') ? 'https:' + url : url);
  if (!res) return null;
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  return name;
}

async function main() {
  await mkdir(IMG, { recursive: true });
  let known = [];
  try { known = JSON.parse(await readFile(join(OUT, 'posts.json'), 'utf8')); } catch (e) { /* first run */ }
  const start = Number(args.from || (known[0] && known[0].id) || 69);

  // 1. find the newest post: walk up until a long run of missing ids
  let newest = start, misses = 0, id = start;
  while (misses < MISSES_TO_STOP) {
    id++;
    const post = await fetchPost(id);
    if (post) { newest = id; misses = 0; } else misses++;
    await sleep(120);
  }
  console.log('newest post', newest);

  // 2. collect backwards; an album answers on each of its ids, keep it once
  const posts = [];
  const seen = new Set();
  for (let i = newest; i > 0 && posts.length < LIMIT; i--) {
    const post = await fetchPost(i);
    await sleep(120);
    if (!post) continue;
    const key = post.photos[0] || post.videos[0] || post.text.slice(0, 120);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (!post.text && !post.photos.length && !post.videos.length) continue;
    post.images = [];
    for (const [k, url] of [...post.photos, ...post.videos].entries()) {
      const saved = await saveImage(url, `${post.id}-${k}.jpg`);
      if (saved) post.images.push(saved);
    }
    delete post.photos;
    posts.push(post);
    process.stdout.write('.');
  }
  posts.sort((a, b) => b.id - a.id);
  await writeFile(join(OUT, 'posts.json'), JSON.stringify(posts, null, 1));
  console.log('\nposts', posts.length, 'from', posts.at(-1)?.id, 'to', posts[0]?.id);
}

main().catch((e) => { console.error(e); process.exit(1); });
