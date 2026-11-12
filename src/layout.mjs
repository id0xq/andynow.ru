// Shared page parts: the document head, header, footer, photos, titles, links into the Telegram chat.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, NAV, MSG, SOCIAL } from './content.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PHOTOS = JSON.parse(readFileSync(join(HERE, 'assets', 'img', 'photos.json'), 'utf8'));

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A link into the Telegram chat with a first line already typed: key of MSG or any text.
export const tg = (keyOrText) => SITE.telegram + '?text=' + encodeURIComponent(MSG[keyOrText] || keyOrText);

const isExternal = (href) => /^https?:/.test(href);
export const attrs = (href) => (isExternal(href) ? ' target="_blank" rel="noopener"' : '');

// action: { label, msg } → Telegram, or { label, href }. Classes: btn-ink (default), btn-line, btn-orange
export function action(a, cls = 'btn btn-ink') {
  const href = a.msg ? tg(a.msg) : a.href;
  return `<a class="${cls}" href="${esc(href)}"${attrs(href)}>${esc(a.label)}</a>`;
}

export const link = (href, label, cls = 'link') => `<a class="${cls}" href="${esc(href)}"${attrs(href)}>${esc(label)}</a>`;

// The design code's title: the first word thin, the rest bold. "Обучение игре на ханге" → thin "Обучение".
export function split(text, { dot = false } = {}) {
  const t = esc(text);
  const i = t.indexOf(' ');
  const head = i < 0 ? t : `<span class="thin">${t.slice(0, i)}</span>${t.slice(i)}`;
  return dot ? head.replace(/\.$/, '<span class="dot">.</span>') : head;
}

// Section title between a tilde and a dot-slash: ~ чем могу быть полезен ./ (as in ~ontheflow./),
// with an optional line under it.
export function secHead(id, title, sub = '', { align = 'center', actions = '' } = {}) {
  return `<div class="sec-head sec-${align}">
  <h2 id="${id}" class="bracket"><span>${esc(title)}</span></h2>
  ${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}${actions ? `<div class="actions">${actions}</div>` : ''}
</div>`;
}

// A living photo. ratio: frame proportions ('4/5', '3/4', '16/9'…) with the picture covering it,
// pos: object-position for that crop; without ratio the photo keeps its own proportions.
// A 16 px preview of the photo covers the frame at once; the file loads under it (the browser sees the
// image the whole time, so its own lazy loading works) and the preview slides away behind the scan line
// when the photo is loaded and on screen (see site.css, .photo). cls 'resin' makes it a resin card.
const SUFFIXES = { 1: [''], 2: ['-s', ''], 3: ['-s', '-m', ''] };
export function photo(name, { ratio = '', pos = '', sizes = '(max-width: 760px) 100vw, 50vw', loading = 'lazy', caption = '', cls = '', tag = '' } = {}) {
  const p = PHOTOS[name];
  if (!p) throw new Error('no photo ' + name);
  const style = [ratio && `--ratio:${ratio}`, pos && `--pos:${pos}`].filter(Boolean).join(';');
  const srcset = p.widths.map((w, i) => `/assets/img/${name}${SUFFIXES[p.widths.length][i]}.webp ${w}w`).join(', ');
  const img = `<img src="/assets/img/${name}.webp" srcset="${srcset}" sizes="${sizes}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" loading="${loading}"${loading === 'eager' ? ' fetchpriority="high"' : ' decoding="async"'}>`;
  const cap = caption ? `<figcaption>${esc(caption)}</figcaption>` : '';
  const mark = tag ? `<span class="photo-tag" aria-hidden="true">${esc(tag)}</span>` : '';
  return `<figure class="photo${ratio ? ' is-framed' : ''}${cls ? ' ' + cls : ''}"${style ? ` style="${style}"` : ''}><span class="photo-in" style="--lq:url(${p.lq})">${img}${mark}</span>${cap}</figure>`;
}

// The last block of most pages: four ways to start, each a message already typed in Telegram.
export function ctaBand({ title = 'Напишите мне', text = 'Выберите, с чем вы пришли: сообщение уже будет набрано, останется отправить. Отвечаю лично.' } = {}) {
  const items = [['Хочу учиться играть', 'lesson', 'занятие или курс'], ['Подобрать инструмент', 'instrument', 'ханг под ваш звук'], ['Пригласить звучать', 'event', 'ретрит, событие, практика'], ['Обсудить проект', 'project', 'сайт, приложение, автоматизация']];
  return `<section class="section cta" aria-labelledby="cta-title">
  <div class="wrap cta-grid">
    <div class="cta-text">
      <p class="label">готовы начать</p>
      <h2 id="cta-title" class="h-big">${split(title)}</h2>
      <p class="lead">${esc(text)}</p>
      <p class="cta-direct">Или напрямую: <a href="${SITE.telegram}"${attrs(SITE.telegram)}>@andynow в Telegram</a></p>
    </div>
    <ol class="cta-list">${items.map(([label, msg, sub], i) => `<li><a href="${esc(tg(msg))}"${attrs(SITE.telegram)}><span class="num">0${i + 1}</span><b>${esc(label)}</b><span class="sub">${esc(sub)}</span><span class="arrow" aria-hidden="true">→</span></a></li>`).join('')}</ol>
  </div>
</section>`;
}

function header(active) {
  const links = NAV.map((n) => `<a href="${n.href}"${n.href === active ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`).join('');
  return `<header class="top" id="top">
  <div class="wrap top-row">
    <a class="logo" href="/" aria-label="Andy Now, на главную"><span class="logo-dot" aria-hidden="true"></span>Andy Now</a>
    <nav class="top-nav" aria-label="Разделы">${links}</nav>
    <a class="btn btn-ink btn-small top-cta" href="${esc(tg('hello'))}"${attrs(SITE.telegram)}>Написать</a>
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
      <a class="logo" href="/"><span class="logo-dot" aria-hidden="true"></span>Andy Now</a>
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
<meta name="theme-color" content="#FFFFFF">
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
<link rel="preload" href="/assets/fonts/montserrat-cyrillic.woff2" as="font" type="font/woff2" crossorigin>
${preload}<link rel="stylesheet" href="/assets/css/site.css">
<script>document.documentElement.classList.add('js')</script>
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
