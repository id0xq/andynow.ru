// Builds the site into dist/: no dependencies, Node 20+.
// node build.mjs            → dist/
// node build.mjs --serve    → dist/ and a local server on http://localhost:4321
import { cp, mkdir, rm, writeFile, readdir } from 'node:fs/promises';
import { existsSync, createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { page, esc } from './src/layout.mjs';
import { SITE } from './src/content.mjs';
import { loadPosts } from './src/journal.mjs';
import * as P from './src/pages.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');

const PERSON = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Andy Now',
  alternateName: ['Андрей Наумов', 'now.andy_'],
  url: SITE.url + '/',
  image: SITE.url + '/og.jpg',
  jobTitle: 'Музыкант, преподаватель игры на ханге',
  description: 'Хэндпан-артист, ведущий звуковых сессий, преподаватель интуитивной игры, автор приложения Handpan Sphere.',
  knowsAbout: ['ханг', 'handpan', 'звуковые медитации', 'обучение игре на ханге', 'Telegram Mini Apps', 'Web Audio'],
  sameAs: [SITE.telegram, SITE.channel, SITE.vk, SITE.rutube, SITE.youtube, SITE.album, SITE.hps],
};

async function write(path, html) {
  const file = join(DIST, path, path.endsWith('.html') || path.endsWith('.xml') ? '' : 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}

async function build() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await cp(join(ROOT, 'src', 'assets'), join(DIST, 'assets'), { recursive: true, filter: (f) => !f.endsWith('photos.json') && !f.endsWith('.DS_Store') });
  await cp(join(ROOT, 'src', 'static'), DIST, { recursive: true });
  if (existsSync(join(ROOT, 'content', 'telegram', 'img'))) {
    await cp(join(ROOT, 'content', 'telegram', 'img'), join(DIST, 'content', 'telegram'), { recursive: true });
  }

  const posts = loadPosts();
  const pages = [
    { path: '/', title: 'Andy Now — ханг: обучение, инструменты, живой звук', description: 'Andy Now — музыкант и исследователь звука. Обучаю игре на ханге, подбираю инструменты, звучу на ретритах и событиях, собираю цифровые продукты.', body: P.home(posts), jsonld: PERSON, scripts: ['/assets/js/live.js'], bodyClass: 'is-home', preload: '<link rel="preload" href="/assets/img/hero-cut.webp" as="image" type="image/webp">\n' },
    { path: '/learn/', title: 'Обучение игре на ханге', description: 'Занятия на ханге онлайн и вживую: разовое занятие, курс из 2, 4 или 8 встреч, наставничество и курс ведущего звуковых сессий. Музыкальный опыт не нужен.', body: P.learn() },
    { path: '/instruments/', title: 'Подбор ханга', description: 'Помогу выбрать ханг по звуку, задаче и рукам. Три вопроса, строи на девять нот и расширенные, наличие, сроки и стоимость.', body: P.instruments() },
    { path: '/sound/', title: 'Живой ханг на ретритах и событиях', description: 'Звуковые сессии и сеты на ханге от 15 до 90 минут: ретриты, йога, фестивали, свадьбы и частные события.', body: P.sound() },
    { path: '/digital/', title: 'Цифровые продукты', description: 'Сайты, Telegram-боты и Mini Apps, автоматизация и ai-агенты. Беру проекты как технический специалист: от идеи до продукта.', body: P.digital() },
    { path: '/projects/', title: 'Проекты', description: 'Handpan Sphere, канал «Музыка Сфер», Земли Силы, ontheflow и amber&ash.', body: P.projects() },
    { path: '/about/', title: 'Обо мне', description: 'Андрей Наумов, Andy Now: путь к хангу, школа Animara, Храм Звука на Алтае, музыка и код.', body: P.about() },
    { path: '/journal/', title: 'Журнал', description: 'Заметки о звуке, практике и пути из канала «Музыка Сфер».', body: P.journal(posts) },
  ];
  for (const p of pages) await write(p.path, page(p));

  for (const [i, post] of posts.entries()) {
    const title = post.title || post.excerpt.slice(0, 60);
    await write(post.url, page({
      path: post.url, active: '/journal/', title, description: post.excerpt,
      image: post.photo ? `/assets/img/${post.photo}.webp` : '/og.jpg',
      jsonld: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: title, datePublished: post.date, author: { '@type': 'Person', name: 'Andy Now', url: SITE.url + '/' }, mainEntityOfPage: SITE.url + post.url },
      body: P.post(post, posts[i + 1], posts[i - 1]),
    }));
  }

  await writeFile(join(DIST, '404.html'), page({ path: '/404.html', title: 'Страница не найдена', description: 'Такой страницы нет.', body: P.notFound() }).replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"'));

  // RSS of the journal
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Журнал Andy Now</title><link>${SITE.url}/journal/</link><description>Заметки о звуке, практике и пути</description><language>ru</language>
${posts.map((p) => `<item><title>${esc(p.title || p.excerpt.slice(0, 60))}</title><link>${SITE.url}${p.url}</link><guid>${SITE.url}${p.url}</guid><pubDate>${new Date(p.date + 'T09:00:00Z').toUTCString()}</pubDate><description>${esc(p.excerpt)}</description></item>`).join('\n')}
</channel></rss>`;
  await writeFile(join(DIST, 'journal', 'feed.xml'), rss);

  const urls = [...pages.map((p) => p.path), ...posts.map((p) => p.url)];
  const today = new Date().toISOString().slice(0, 10);
  await writeFile(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE.url}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
  console.log(`built ${pages.length} pages and ${posts.length} journal posts into dist/`);
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.bin': 'application/octet-stream', '.txt': 'text/plain' };

function serve(port = 4321) {
  createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = join(DIST, path);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }); return createReadStream(join(DIST, '404.html')).pipe(res); }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    createReadStream(file).pipe(res);
  }).listen(port, '127.0.0.1', () => console.log(`serving dist/ on http://localhost:${port}`));
}

await build();
if (process.argv.includes('--serve')) serve();
