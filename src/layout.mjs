// Shared page parts: the document head, header, footer, photos, links into the Telegram chat.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, NAV, MSG, SOCIAL } from './content.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PHOTOS = JSON.parse(readFileSync(join(HERE, 'assets', 'img', 'photos.json'), 'utf8'));

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A link into the Telegram chat with a first line already typed: key of MSG or any text.
export const tg = (keyOrText) => SITE.telegram + '?text=' + encodeURIComponent(MSG[keyOrText] || keyOrText);

const EXT = { target: '_blank', rel: 'noopener' };
const isExternal = (href) => /^https?:/.test(href);
export const attrs = (href) => (isExternal(href) ? ` target="${EXT.target}" rel="${EXT.rel}"` : '');

// action: { label, msg } → Telegram, or { label, href }
export function action(a, cls = 'btn btn-orange') {
  const href = a.msg ? tg(a.msg) : a.href;
  return `<a class="${cls}" href="${esc(href)}"${attrs(href)}>${esc(a.label)}</a>`;
}

// A photo at its own proportions, nothing cropped. mat: sand | blush | aqua | white | none
export function photo(name, { mat = 'none', sizes = '(max-width: 760px) 100vw, 50vw', loading = 'lazy', caption = '', cls = '', fit = '' } = {}) {
  const p = PHOTOS[name];
  if (!p) throw new Error('no photo ' + name);
  const img = `<img src="/assets/img/${name}.webp" srcset="/assets/img/${name}-s.webp 760w, /assets/img/${name}.webp ${p.w}w" sizes="${sizes}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" loading="${loading}" decoding="async"${loading === 'eager' ? ' fetchpriority="high"' : ''}>`;
  const cap = caption ? `<figcaption>${esc(caption)}</figcaption>` : '';
  return `<figure class="photo mat-${mat}${fit ? ' fit-' + fit : ''}${cls ? ' ' + cls : ''}">${img}${cap}</figure>`;
}

export function ctaBand({ title = 'Напишите мне', text = 'Отвечаю лично. Выберите, с чем вы пришли: сообщение уже будет набрано, останется отправить.' } = {}) {
  const items = [['Хочу учиться играть', 'lesson'], ['Подобрать инструмент', 'instrument'], ['Пригласить звучать', 'event'], ['Обсудить проект', 'project']];
  return `<section class="band band-orange cta" aria-labelledby="cta-title">
  <div class="wrap">
    <h2 id="cta-title">${esc(title)}</h2>
    <p class="lead">${esc(text)}</p>
    <div class="actions">${items.map(([label, msg]) => action({ label, msg }, 'btn btn-black')).join('')}</div>
    <p class="cta-direct">Или напрямую: <a href="${SITE.telegram}"${attrs(SITE.telegram)}>@andynow в Telegram</a></p>
  </div>
</section>`;
}

function header(active) {
  const links = NAV.map((n) => `<a href="${n.href}"${n.href === active ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`).join('');
  return `<header class="top" id="top">
  <div class="wrap top-row">
    <a class="logo" href="/" aria-label="Andy Now, на главную"><span class="logo-dot" aria-hidden="true"></span>andy now</a>
    <nav class="top-nav" aria-label="Разделы">${links}</nav>
    <a class="btn btn-black btn-small top-cta" href="${esc(tg('hello'))}"${attrs(SITE.telegram)}>Написать</a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu"><span>Меню</span></button>
  </div>
  <div class="menu" id="menu" hidden>
    <nav class="wrap menu-nav" aria-label="Разделы">${links}<a class="btn btn-orange" href="${esc(tg('hello'))}"${attrs(SITE.telegram)}>Написать в Telegram</a></nav>
  </div>
</header>`;
}

function footer() {
  const nav = NAV.map((n) => `<li><a href="${n.href}">${esc(n.label)}</a></li>`).join('');
  const social = SOCIAL.map((s) => `<li><a href="${s.href}"${attrs(s.href)}>${esc(s.label)}</a></li>`).join('');
  return `<footer class="foot">
  <div class="wrap foot-grid">
    <div class="foot-about">
      <a class="logo logo-light" href="/"><span class="logo-dot" aria-hidden="true"></span>andy now</a>
      <p>Музыка ханга, обучение, инструменты и цифровые продукты.</p>
      <a class="btn btn-orange" href="${esc(tg('hello'))}"${attrs(SITE.telegram)}>Написать в Telegram</a>
    </div>
    <div><p class="foot-h">Разделы</p><ul>${nav}</ul></div>
    <div><p class="foot-h">В сети</p><ul>${social}</ul></div>
  </div>
  <div class="wrap foot-legal">
    <p>© ${new Date().getFullYear()} Andy Now</p>
    <p>* Instagram принадлежит компании Meta, признанной экстремистской и запрещённой в России.</p>
  </div>
</footer>`;
}

export function page({ path, title, description, body, active = path, image = '/og.jpg', jsonld = null, scripts = [], bodyClass = '', preload = '' }) {
  const url = SITE.url + path;
  const fullTitle = path === '/' ? title : `${title} — Andy Now`;
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#ffffff">
<meta property="og:type" content="${path.startsWith('/journal/') && path !== '/journal/' ? 'article' : 'website'}">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="Andy Now">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.url}${image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="Журнал Andy Now" href="/journal/feed.xml">
<link rel="preload" href="/assets/fonts/display-normal-cyrillic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/text-normal-cyrillic.woff2" as="font" type="font/woff2" crossorigin>
${preload}<link rel="stylesheet" href="/assets/css/site.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>\n` : ''}</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a class="skip" href="#main">К содержанию</a>
${header(active)}
<main id="main">
${body}
</main>
${footer()}
<script src="/assets/js/site.js" defer></script>
${scripts.map((s) => `<script src="${s}" defer></script>`).join('\n')}
</body>
</html>
`;
}
