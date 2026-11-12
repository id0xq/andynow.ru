// The pages of the space. Each function returns the inside of <main>; build.mjs wraps it with page().
// Design code (site.css): white, ink, one orange; titles with a thin first word; section titles
// between ~ and ./; numbered rows on hairlines; cards cast in clear resin; colour photos in one grade.
import { esc, tg, action, link, split, secHead, photo, ctaBand, attrs, PHOTOS } from './layout.mjs';
import { SITE, STATEMENTS, FACTS, ROOMS, PROJECTS, OFFERS, SCALES, VIDEOS, MSG, PLATFORMS } from './content.mjs';
import { icon } from './icons.mjs';

const n2 = (i) => String(i + 1).padStart(2, '0');
const sgn = (v) => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(2);

// The first screen: Andy by the sea, stepping out of the frame onto the page, with a scan line and
// trackers. Statements turn the photo into points that gather into a hang, waves or a cube (live.js).
const HERO_TRACKS = [[0.637, 0.505, 'ханг'], [0.22, 0.588, 'горизонт'], [0.16, 0.82, 'камни']];
function heroStage() {
  const h = PHOTOS.hero;
  const trackers = HERO_TRACKS.map(([x, y, label], i) => `<span class="tracker is-on" style="--x:${(x * 100).toFixed(1)}%;--y:${(y * 100).toFixed(1)}%" data-x="${x}" data-y="${y}" data-label="${label}"><i></i><span>${n2(i)} ${sgn(x * 2 - 1)} ${sgn(1 - y * 2)} ${label}</span></span>`).join('');
  return `<div class="live" data-live data-form="photo">
      <canvas aria-hidden="true"></canvas>
      <div class="stage" style="--frame:${(h.frameTop * 100).toFixed(1)}%">
        <img class="stage-photo" src="/assets/img/hero.webp" srcset="/assets/img/hero-s.webp ${h.small}w, /assets/img/hero.webp ${h.w}w" sizes="(max-width: 900px) 92vw, 46vw" width="${h.w}" height="${h.h}" alt="${esc(h.alt)}" fetchpriority="high">
        <span class="stage-meta mono" aria-hidden="true"><span>кадр 0134</span><span>7.9° N · 98.4° E</span></span>
        <span class="stage-glow" aria-hidden="true"><span></span></span>
        <span class="live-scan" aria-hidden="true"></span>
        <div class="stage-trackers" aria-hidden="true">${trackers}</div>
      </div>
      <div class="live-trackers" aria-hidden="true"></div>
      <div class="live-legend"><button type="button" class="mono" data-toggle="trackers" aria-pressed="true">трекеры</button><button type="button" class="mono" data-toggle="scan" aria-pressed="true">скан</button></div>
    </div>`;
}

const facts = (cls = '') => `<ul class="facts${cls ? ' ' + cls : ''}">${FACTS.map(([n, t]) => `<li><b>${esc(n)}</b><span>${esc(t)}</span></li>`).join('')}</ul>`;

function postCard(p) {
  const img = p.photo && PHOTOS[p.photo]
    ? photo(p.photo, { ratio: '4/3', sizes: '(max-width: 760px) 100vw, 33vw', cls: 'post-photo' })
    : p.images && p.images.length
      ? `<figure class="photo is-framed post-photo" style="--ratio:4/3"><span class="photo-in"><img src="/content/telegram/${esc(p.images[0])}" alt="" loading="lazy" decoding="async"></span></figure>`
      : '';
  const head = p.title ? `<h3>${esc(p.title)}</h3>` : '';
  const text = p.poem
    ? `<p class="poem">${esc(p.poem.split('\n\n').slice(0, 2).join('\n\n')).replace(/\n/g, '<br>')}</p>`
    : `<p class="excerpt">${esc(p.excerpt)}</p>`;
  return `<article class="post-card${p.poem ? ' is-poem' : ''}">
  <a href="${p.url}" class="post-link">${img}<time class="mono" datetime="${p.date}">${p.human}</time>${head}${text}<span class="read">Читать <span aria-hidden="true">→</span></span></a>
</article>`;
}

// the album on every platform, as on band.link/andynow
const platforms = () => `<ul class="platforms" aria-label="Альбом на площадках">${PLATFORMS.map(([name, href, ic]) => `<li><a href="${esc(href)}" target="_blank" rel="noopener">${icon(ic)}<span>${esc(name)}</span></a></li>`).join('')}</ul>`;

function videos() {
  return `<div class="videos">${VIDEOS.map((v, i) => `<figure class="video" data-rutube="${v.id}">
  <button type="button" class="video-play" aria-label="Смотреть: ${esc(v.title)}, ${v.time}">
    <span class="video-pic"><img src="/assets/img/video/${v.poster}.webp" width="960" height="540" alt="" loading="lazy" decoding="async"></span><span class="play" aria-hidden="true"></span>
  </button>
  <figcaption><span class="mono">${n2(i)}</span><span>${esc(v.title)}</span><span class="mono">${v.time}</span></figcaption>
</figure>`).join('')}</div>`;
}

// The head of an inner page: label, title with a thin first word, lead, actions, a framed photo.
function pageHead({ label, title, lead, cta = [], img, pos = '', tag = '', note = '' }) {
  return `<section class="page-head">
  <div class="wrap page-head-grid">
    <div class="page-head-text">
      <p class="label">${esc(label)}</p>
      <h1>${split(title)}</h1>
      <p class="lead">${esc(lead)}</p>
      ${note ? `<p class="note-line">${note}</p>` : ''}
      <div class="actions">${cta.join('')}</div>
    </div>
    ${img ? photo(img, { ratio: '4/5', pos, loading: 'eager', tag, sizes: '(max-width: 980px) 100vw, 42vw', cls: 'page-head-photo ice' }) : ''}
  </div>
</section>`;
}

const steps = (items) => `<ol class="rows steps">${items.map(([h, t], i) => `<li><span class="num">${n2(i)}</span><h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ol>`;

const faq = (items) => `<div class="faq">${items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('')}</div>`;

// ─── home ──────────────────────────────────────────────────────────────────────────────────────────

export function home(posts) {
  const statements = STATEMENTS.map((s, i) => `<button type="button" class="statement" data-key="${s.key}" data-form="${s.form}" aria-controls="note-${s.key}" aria-pressed="false"><span class="st-n mono" aria-hidden="true">${n2(i)}</span><span class="st-line">${split(s.line, { dot: true })}</span></button>`).join(' ');
  const notes = STATEMENTS.map((s) => `<div class="note" id="note-${s.key}" data-key="${s.key}" hidden>
  <p>${esc(s.text)}</p>
  <div class="actions">${action(s.cta)}${action(s.more, 'btn btn-line')}</div>
</div>`).join('');
  const rooms = ROOMS.map((r, i) => `<a class="room resin" href="${r.href}">
  ${photo(r.photo, { ratio: '3/4', pos: r.pos, sizes: '(max-width: 760px) 80vw, (max-width: 1100px) 45vw, 25vw', cls: 'room-photo' })}
  <span class="room-n mono">${n2(i)}</span>
  <h3>${esc(r.title)}</h3>
  <p>${esc(r.text)}</p>
  <span class="room-go" aria-hidden="true">→</span>
  <span class="corners" aria-hidden="true"></span>
</a>`).join('');
  const latest = posts.slice(0, 3).map((p) => postCard(p)).join('');
  const projects = PROJECTS.map((p, i) => `<li class="proj-row">
  <span class="num">${n2(i)}</span>
  <div class="proj-name"><h3>${esc(p.name)}</h3><span class="state${p.live ? ' is-live' : ''}">${esc(p.state)}</span></div>
  <p>${esc(p.text)}</p>
  <span class="proj-links">${p.links.map((l) => link(l.msg ? tg(l.msg) : l.href, l.label)).join('')}</span>
</li>`).join('');

  return `<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero-grid">
    <div class="hero-text">
      <p class="label">Andy Now · музыкант, преподаватель, инженер</p>
      <h1 id="hero-title" class="statements">${statements}</h1>
      <div class="notes" aria-live="polite">
        <div class="note is-default" id="note-default">
          <p>Выберите, с чем вы пришли, или просто напишите. Отвечаю лично.</p>
          <div class="actions">${action({ label: 'Написать мне', msg: 'hello' })}${action({ label: 'Читать журнал', href: '/journal/' }, 'btn btn-line')}</div>
        </div>
        ${notes}
      </div>
    </div>
    ${heroStage()}
  </div>
</section>

<section class="section intro" aria-labelledby="intro-title">
  <div class="wrap intro-grid">
    <div class="intro-text">
      <p class="label">кто я</p>
      <h2 id="intro-title" class="h-big">${split('Звук меняет состояние')}</h2>
      <p class="lead">Меня зовут Андрей, творческий псевдоним Andy Now. Играю на ханге, пишу музыку и веду канал «Музыка Сфер».</p>
      <p>Больше семи лет я исследую, как звук влияет на внимание, дыхание и восприятие времени: в школе ханга Animara, на медитациях в Таиланде, в зеркальном Храме Звука на Алтае.</p>
      <p>Вторая моя половина инженерная. Handpan Sphere, виртуальный ханг в браузере и Telegram, я собрал сам, от идеи до кода.</p>
      <div class="actions">${action({ label: 'Моя история', href: '/about/' }, 'btn btn-line')}</div>
    </div>
    ${photo('sunset', { ratio: '4/5', pos: '47% 50%', tag: 'закат', sizes: '(max-width: 760px) 100vw, 40vw', cls: 'intro-photo' })}
  </div>
  <div class="wrap">${facts()}</div>
</section>

<section class="section rooms" aria-labelledby="rooms-title">
  <div class="wrap">${secHead('rooms-title', 'чем могу быть полезен', 'Четыре двери. За каждой форматы, цены по запросу и прямой путь в мой Telegram.')}</div>
  <div class="rooms-rail"><div class="wrap rooms-grid">${rooms}</div></div>
</section>

<section class="section journal-preview" aria-labelledby="journal-title">
  <div class="wrap">
    ${secHead('journal-title', 'журнал', 'Заметки о звуке, практике и пути из канала «Музыка Сфер».', { actions: link('/journal/', 'Все записи') + link(SITE.channel, 'Канал в Telegram') })}
    <div class="posts-grid">${latest}</div>
  </div>
</section>

<section class="section night listen" aria-labelledby="listen-title">
  <div class="wrap">
    ${secHead('listen-title', 'послушать', 'Альбом Music of the Sphere’s и записи с Алтая. Наушники и десять спокойных минут.', { extra: platforms(), actions: action({ label: 'Слушать альбом', href: SITE.album }, 'btn btn-orange') + link(SITE.rutube, 'Все видео') })}
    ${videos()}
  </div>
</section>

<section class="section projects-preview" aria-labelledby="projects-title">
  <div class="wrap">
    ${secHead('projects-title', 'проекты', 'По порядку: от того, что открыто каждый день, к тому, что ещё собирается.', { actions: link('/projects/', 'Подробнее о проектах') })}
    <ol class="rows proj-list">${projects}</ol>
  </div>
</section>

${ctaBand()}`;
}

// ─── learn ─────────────────────────────────────────────────────────────────────────────────────────

export function learn() {
  // two columns that keep their own heights: 01 and 03 on the left, 02 and 04 on the right;
  // on a phone they fold back into one column in order (--i)
  const cards = OFFERS.map((o, i) => `<article class="offer-card resin" id="${o.id}" style="--i:${i}">
  ${photo(o.photo, { ratio: o.full ? '' : '3/2', pos: o.pos || '', tag: n2(i) + ' / 0' + OFFERS.length, sizes: '(max-width: 900px) 100vw, 46vw', cls: 'offer-photo' })}
  <div class="offer-body">
    <h2>${esc(o.title)}</h2>
    <p class="offer-sub">${esc(o.lead)}</p>
    ${o.steps ? `<ol class="tiers">${o.steps.map(([name, count, t]) => `<li><b class="tier-count">${esc(count.split(' ')[0])}</b><span class="tier-word mono">${esc(count.split(' ').slice(1).join(' '))}</span><h3>${esc(name)}</h3><p>${esc(t)}</p></li>`).join('')}</ol>` : ''}
    <ul class="ticks">${o.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    <div class="actions">${action(o.cta)}</div>
  </div>
</article>`);
  const offers = `<div class="offers-col">${cards.filter((_, i) => i % 2 === 0).join('')}</div><div class="offers-col">${cards.filter((_, i) => i % 2 === 1).join('')}</div>`;

  const strip = [['hero-play', 'Пхукет'], ['altai-glow', 'Алтай'], ['play-close', 'Руки'], ['hands-top', 'Ритм'], ['hangs-back', 'Дуэт']]
    .map(([n, t], i) => photo(n, { ratio: '3/4', pos: n === 'hangs-back' ? '50% 20%' : '', tag: n2(i) + ' ' + t, sizes: '(max-width: 760px) 70vw, 22vw' })).join('');

  return `${pageHead({
    label: 'обучение',
    title: 'Учиться играть на ханге',
    lead: 'Учу тех, кто никогда не держал инструмент в руках, и тех, кто уже играет и ищет свой почерк. Музыкальный опыт не нужен: достаточно интереса и желания прикоснуться к инструменту.',
    cta: [action({ label: 'Записаться на пробное занятие', msg: 'trial' }), action({ label: 'Форматы', href: '#formats' }, 'btn btn-line')],
    img: 'andy-river', pos: '44% 50%', tag: 'Алтай · Катунь',
  })}

<section class="section about-teacher" aria-labelledby="teacher-title">
  <div class="wrap">
    <div class="teacher">
      <h2 id="teacher-title" class="h-mid">${split('Меня зовут Andy Now')}</h2>
      <div>
        <p class="lead">Я играю на ханге, пишу музыку и веду проект «Музыка Сфер».</p>
        <p>Больше семи лет вместе с проектом «Анимара» я исследую, как звук влияет на внимание, дыхание и восприятие времени. Три года веду звуковые сессии с хангом в зеркальном Храме Звука на Алтае.</p>
      </div>
    </div>
    ${facts('facts-cards')}
  </div>
  <div class="strip" aria-label="Фото с занятий">${strip}</div>
</section>

<section class="section offers" id="formats" aria-labelledby="formats-title">
  <div class="wrap">
    ${secHead('formats-title', 'как можно заниматься', 'Онлайн и вживую. Начать можно с бесплатного пробного занятия курса.')}
    <div class="offers-grid">${offers}</div>
    <p class="offers-more">${link('/about/#temple-title', 'Подробнее о Храме Звука')}</p>
  </div>
</section>

<section class="section" aria-labelledby="first-title">
  <div class="wrap split-grid">
    ${secHead('first-title', 'первое занятие', 'Сорок минут, после которых понятно, куда идти.', { align: 'left' })}
    ${steps([
      ['Знакомимся', 'Вы рассказываете, что привело вас к хангу и чего хочется. Я слушаю, как вы играете, если уже играете.'],
      ['Звучим', 'Ставим руки, находим чистый звук, собираем первый ритм и первую мелодию. Её можно играть уже вечером.'],
      ['Строим путь', 'Определяем ваш уровень и договариваемся, как двигаться дальше: в каком темпе и к какой цели.'],
    ])}
  </div>
</section>

<section class="section night" aria-labelledby="faq-title">
  <div class="wrap split-grid">
    ${secHead('faq-title', 'частые вопросы', '', { align: 'left' })}
    ${faq([
      ['У меня нет слуха и музыкального опыта. Получится?', 'Да. Все ноты ханга согласованы между собой, любое касание попадает в гармонию. Слух и чувство ритма приходят через игру и растут вместе с практикой.'],
      ['У меня ещё нет ханга. С чего начать?', `С подбора строя: <a href="/instruments/#pick">ответьте на три вопроса</a> или напишите мне. Пока инструмент в пути, строй можно послушать и поиграть на экране в <a href="${SITE.hps}" target="_blank" rel="noopener">Handpan Sphere</a>.`],
      ['Можно ли научиться онлайн?', 'Можно. Занятия идут один на один, по 60–75 минут. Нужны ханг и телефон, планшет или ноутбук для связи. На курсе после встреч остаётся видео с пройденным материалом.'],
      ['Сколько стоит обучение?', `Зависит от формата и числа занятий. Пробное занятие курса бесплатное. <a href="${esc(tg('lesson'))}" target="_blank" rel="noopener">Напишите мне</a>, и я расскажу подробно.`],
    ])}
  </div>
</section>

<section class="section" aria-labelledby="free-title">
  <div class="wrap">
    ${secHead('free-title', 'начать бесплатно')}
    <div class="free-grid">
      <a class="free-item resin" href="${SITE.practice}" target="_blank" rel="noopener"><span class="num">01</span><h3>Звуковая практика</h3><p>Короткая практика в канале «Музыка Сфер». Наушники и десять минут тишины.</p><span class="link">Открыть в Telegram</span></a>
      <a class="free-item resin" href="${SITE.hps}" target="_blank" rel="noopener"><span class="num">02</span><h3>Handpan Sphere</h3><p>Виртуальный ханг: играйте на схеме или со своим инструментом под атмосферу в его строе.</p><span class="link">handpansphere.ru</span></a>
    </div>
  </div>
</section>

${ctaBand({ title: 'Запишитесь на занятие', text: 'Напишите пару слов о себе и о том, играете ли вы уже. Отвечаю лично и подбираю время.' })}`;
}

// ─── instruments ───────────────────────────────────────────────────────────────────────────────────

export function instruments() {
  const scales = Object.entries(SCALES).map(([id, s]) => `<li class="scale"><img src="/assets/img/hangs/${id}-s.webp" width="300" height="300" alt="Ханг ${esc(s.name)}" loading="lazy" decoding="async"><div><h3>${esc(s.name)}</h3><p class="notes-line mono">${esc(s.notes)}</p><p>${esc(s.text)}</p></div></li>`).join('');
  const q = (name, legend, options, i) => `<fieldset><legend><span class="num">${n2(i)}</span>${esc(legend)}</legend>${options.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}"><span>${esc(l)}</span></label>`).join('')}</fieldset>`;
  return `${pageHead({
    label: 'инструменты',
    title: 'Подберу лучший инструмент',
    lead: 'Строй определяет характер ханга на годы вперёд. Помогаю выбрать его по звуку, задаче и рукам, чтобы инструмент хотелось брать каждый день.',
    cta: [action({ label: 'Подобрать инструмент', href: '#pick' }), action({ label: 'Написать', msg: 'instrument' }, 'btn btn-line')],
    img: 'hang-chest', pos: '62% 50%', tag: 'D Kurd · сталь',
  })}

<section class="section" aria-labelledby="how-title">
  <div class="wrap split-grid">
    ${secHead('how-title', 'как я подбираю', '', { align: 'left' })}
    ${steps([
      ['Слушаю вас', 'Какой звук отзывается, для чего инструмент, играете ли вы уже. Можно начать с трёх вопросов ниже.'],
      ['Предлагаю строй', 'Объясняю, чем строи отличаются, и даю их послушать. Каждый можно попробовать в Handpan Sphere.'],
      ['Привожу к инструменту', 'Рассказываю о наличии, сроках и стоимости. Если нужно, первое занятие на новом инструменте проведём вместе.'],
    ])}
  </div>
</section>

<section class="section pick" id="pick" aria-labelledby="pick-title">
  <div class="wrap">
    ${secHead('pick-title', 'найдём ваш строй', 'Три вопроса, и станет понятно, с какого строя начать разговор.')}
    <div class="quiz">
      <form class="quiz-form" id="quizForm">
        ${q('exp', 'Вы уже играете?', [['new', 'нет, это первый инструмент'], ['some', 'немного играю'], ['pro', 'играю уверенно, ищу второй']], 0)}
        ${q('sound', 'Какой звук вам ближе?', [['warm', 'тёплый и спокойный'], ['deep', 'низкий и медитативный'], ['light', 'светлый и лиричный'], ['east', 'восточный, с характером']], 1)}
        ${q('use', 'Для чего инструмент?', [['self', 'играть для себя'], ['people', 'вести практики и сессии'], ['stage', 'сцена и запись']], 2)}
      </form>
      <div class="quiz-result resin" id="quizResult" aria-live="polite">
        <img id="quizPhoto" src="/assets/img/hangs/d-kurd-9.webp" width="900" height="900" alt="Ханг на девять нот" loading="lazy">
        <div>
          <p class="quiz-state mono" id="quizState">Ответьте на три вопроса</p>
          <h3 id="quizName">Здесь появится ваш строй</h3>
          <p class="notes-line mono" id="quizNotes"></p>
          <p id="quizText">Это первое приближение. Точный подбор я делаю лично: слушаю, что вам нужно, и рассказываю о наличии, сроках и стоимости.</p>
          <p class="quiz-alt" id="quizAlt"></p>
          <div class="actions">
            <a class="btn btn-orange" id="quizCta" href="${esc(tg('instrument'))}" target="_blank" rel="noopener">Получить подбор от Andy</a>
            ${link(SITE.hps, 'Послушать строи в Handpan Sphere')}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="scales-title">
  <div class="wrap">
    ${secHead('scales-title', 'строи на девять нот', 'Классика, с которой начинают. Есть расширенные версии на 10–21 ноту под заказ.')}
    <ul class="scales">${scales}</ul>
  </div>
</section>

<section class="section night" aria-labelledby="steel-title">
  <div class="wrap split-grid">
    <div>
      ${secHead('steel-title', 'что важно знать', '', { align: 'left' })}
      ${photo('hang-detail', { ratio: '4/5', tag: 'край ханга', sizes: '(max-width: 980px) 100vw, 40vw', cls: 'steel-photo' })}
    </div>
    <ol class="rows specs">
      <li><span class="num">01</span><h3>Нержавеющая сталь</h3><p>Инструмент не боится влаги и не требует частого ухода.</p></li>
      <li><span class="num">02</span><h3>Длинный сустейн</h3><p>Нота звучит долго и ровно, слышно каждое касание.</p></li>
      <li><span class="num">03</span><h3>От 9 до 21 ноты</h3><p>Классические строи на девять нот и расширенные, с нотами снизу и мутантами.</p></li>
      <li><span class="num">04</span><h3>И не только ханг</h3><p>Напишите, какой инструмент ищете: расскажу, что есть.</p></li>
    </ol>
  </div>
</section>

${ctaBand({ title: 'Подберём инструмент', text: 'Напишите, какой звук вы ищете и для чего. Отвечаю лично.' })}`;
}

// ─── sound on events ───────────────────────────────────────────────────────────────────────────────

export function sound() {
  const formats = [
    ['Медитативный сет', 'Звуковое путешествие для группы: вход, погружение и мягкий выход в тишину.'],
    ['Глубокое погружение', 'Длинная сессия sound healing, когда участники лежат и просто слушают.'],
    ['Звук для практик', 'Живая музыка для йоги, дыхательных и телесных практик.'],
    ['Шавасана и йога-нидра', 'Тихое звучание в конце практики.'],
  ];
  return `${pageHead({
    label: 'звук на событиях',
    title: 'Звучу на ретритах и событиях',
    lead: 'Каждый сет складывается один раз, здесь и сейчас. Это звуковой сюжет, в котором можно лечь, закрыть глаза и выдохнуть.',
    cta: [action({ label: 'Пригласить звучать', msg: 'event' })],
    note: 'После сессий чаще всего говорят о глубоком расслаблении, ровном дыхании и ясной голове.',
    img: 'session-bowl', pos: '50% 50%', tag: 'ханг и чаша',
  })}

<section class="section" aria-labelledby="formats-title">
  <div class="wrap split-grid">
    ${secHead('formats-title', 'форматы', '', { align: 'left' })}
    <div>
      <ol class="rows">${formats.map(([h, t], i) => `<li><span class="num">${n2(i)}</span><h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ol>
      <dl class="spec-list">
        <div><dt class="mono">длительность</dt><dd>15, 30, 45, 60, 75 или 90 минут</dd></div>
        <div><dt class="mono">где</dt><dd>Ретриты, студии йоги, фестивали, свадьбы, частные и корпоративные события</dd></div>
      </dl>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="where-title">
  <div class="wrap">
    ${secHead('where-title', 'где я звучу')}
    <div class="gallery">
      ${photo('temple-inside', { ratio: '3/4', caption: 'Храм Звука, Алтай: три года сессий, больше 10 000 человек', sizes: '(max-width: 760px) 100vw, 33vw' })}
      ${photo('session-lake', { ratio: '3/4', caption: 'Awakening Meditation, Таиланд: благотворительные медитации под ханг', sizes: '(max-width: 760px) 100vw, 33vw' })}
      ${photo('session-forest', { ratio: '3/4', pos: '40% 50%', caption: 'Бали: запись в туманном лесу у вулкана', sizes: '(max-width: 760px) 100vw, 33vw' })}
      ${photo('session-wedding', { ratio: '3/4', caption: 'Свадьбы и вечерние события', sizes: '(max-width: 760px) 100vw, 33vw' })}
      ${photo('event-portrait', { ratio: '3/4', caption: 'Музыка для открытых практик', sizes: '(max-width: 760px) 100vw, 33vw' })}
      ${photo('sky-play', { ratio: '3/4', pos: '50% 40%', caption: 'Сеты под открытым небом', sizes: '(max-width: 760px) 100vw, 33vw' })}
    </div>
  </div>
</section>

<section class="section night" aria-labelledby="watch-title">
  <div class="wrap">
    ${secHead('watch-title', 'как это звучит', '', { actions: action({ label: 'Слушать альбом', href: SITE.album }, 'btn btn-orange') + link(SITE.rutube, 'Все видео на Rutube') })}
    ${videos()}
  </div>
</section>

<section class="section" aria-labelledby="invite-title">
  <div class="wrap split-grid">
    ${secHead('invite-title', 'как пригласить', '', { align: 'left' })}
    ${steps([
      ['Напишите дату и место', 'И пару слов о событии: сколько будет людей, какое пространство, что происходит до и после.'],
      ['Подберём формат', 'Длительность, громкость и характер звука под пространство и задачу.'],
      ['Звучим', 'Приезжаю, настраиваюсь в пространстве и веду сет.'],
    ])}
  </div>
</section>

${ctaBand({ title: 'Пригласить звучать', text: 'Напишите дату, место и формат. Отвечаю лично.' })}`;
}

// ─── digital ───────────────────────────────────────────────────────────────────────────────────────

export function digital() {
  const what = [
    ['Сайты и магазины', 'Быстрые, красивые, удобные на телефоне. Ставятся на телефон как приложение и работают без сети.'],
    ['Telegram: боты и Mini Apps', 'Приложения прямо в мессенджере: запись, оплата, облачное сохранение, приглашения.'],
    ['Автоматизация процессов', 'Заявки, уведомления, таблицы, интеграции между сервисами. Рутина уходит машине.'],
    ['ai-агенты и базы знаний', 'Помощники на Claude, которые знают ваш контекст: отвечают, пишут черновики, разбирают входящие.'],
    ['Звук в браузере', 'Синтез, эффекты, лупер и запись на Web Audio. Моя любимая часть.'],
  ];
  return `${pageHead({
    label: 'цифровые продукты',
    title: 'Собираю цифровые продукты для ваших проектов',
    lead: 'Я музыкант с инженерной головой. Беру проекты как технический специалист: от идеи и архитектуры до продукта, которым пользуются.',
    cta: [action({ label: 'Обсудить проект', msg: 'project' })],
    img: 'laptop', pos: '50% 55%', tag: 'Пхукет · работа',
  })}

<section class="section" aria-labelledby="do-title">
  <div class="wrap split-grid">
    ${secHead('do-title', 'что я делаю', '', { align: 'left' })}
    <ol class="rows">${what.map(([h, t], i) => `<li><span class="num">${n2(i)}</span><h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ol>
  </div>
</section>

<section class="section night" aria-labelledby="cases-title">
  <div class="wrap">
    ${secHead('cases-title', 'сделано')}
    <div class="cases">
      <a class="case" href="${SITE.hps}" target="_blank" rel="noopener">
        ${photo('hps-chords', { ratio: '3/4', tag: 'web · telegram', sizes: '(max-width: 760px) 100vw, 30vw', cls: 'ice' })}
        <h3>Handpan Sphere</h3><p>Виртуальный ханг и атмосферный бэк: аккорды, ритм и природа звучат в строе инструмента. Сайт, офлайн-приложение и Telegram Mini App на одном коде, бот на Cloudflare Workers.</p><span class="link">handpansphere.ru</span>
      </a>
      <a class="case" href="${SITE.cinematic}" target="_blank" rel="noopener">
        ${photo('cinematic', { ratio: '3/4', pos: '38% 50%', tag: 'telegram · оплаты', sizes: '(max-width: 760px) 100vw, 30vw', cls: 'ice' })}
        <h3>Синематик</h3><p>Telegram-бот школы мобильной видеосъёмки. Уроки приходят автоматически, учиться можно в любое время. Настроил приём оплат и веду проект целиком как технический специалист.</p><span class="link">@cinematiqbot</span>
      </a>
      <a class="case" href="${SITE.zemli}" target="_blank" rel="noopener">
        ${photo('temple-sunrise', { ratio: '3/4', tag: 'процессы · команда', sizes: '(max-width: 760px) 100vw, 30vw', cls: 'ice' })}
        <h3>Земли Силы</h3><p>Операционный менеджер автономного комплекса в первозданной природе Алтая. Настраиваю и автоматизирую процессы, управляю персоналом, вместе с единомышленниками развиваю проект.</p><span class="link">Проект «Земли Силы»</span>
      </a>
      <div class="case">
        ${photo('play-sun', { ratio: '3/4', tag: 'webgl · скан', sizes: '(max-width: 760px) 100vw, 30vw', cls: 'ice' })}
        <h3>andynow.ru</h3><p>Этот сайт: фото первого экрана рассыпается на десятки тысяч точек и собирается в ханг, волны и куб на WebGL. Журнал из канала, единая цветовая обработка фото. Статический, быстрый, без лишних зависимостей.</p>
      </div>
      <div class="case">
        ${photo('otf-sphere', { ratio: '3/4', tag: 'next.js · payload', sizes: '(max-width: 760px) 100vw, 30vw', cls: 'ice' })}
        <h3>~ontheflow./</h3><p>Магазин редких артефактов на Next.js и Payload CMS: витрина, корзина, заказы с уведомлениями в Telegram, админка на русском.</p>
      </div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="stack-title">
  <div class="wrap split-grid">
    ${secHead('stack-title', 'как работаем', '', { align: 'left' })}
    <div>
      ${steps([
        ['Задача', 'Короткий разговор: что болит, кто пользователь, как поймём, что получилось.'],
        ['Прототип', 'Быстро собираю то, что можно потрогать, и мы правим по живому.'],
        ['Запуск', 'Довожу до продукта: домен, оплата, аналитика, инструкции. Остаюсь на связи.'],
      ])}
      <p class="stack mono">TypeScript · React · Next.js · Node · PostgreSQL · Supabase · Cloudflare Workers · Telegram Bot API · Mini Apps · Web Audio · Claude API · n8n · Make</p>
    </div>
  </div>
</section>

${ctaBand({ title: 'Обсудим проект', text: 'Опишите задачу в двух-трёх предложениях, и я отвечу, чем могу быть полезен.' })}`;
}

// ─── projects ──────────────────────────────────────────────────────────────────────────────────────

export function projects() {
  const items = PROJECTS.map((p, i) => `<article class="project">
  ${p.photo ? photo(p.photo, { ratio: '4/5', tag: n2(i) + ' / 0' + PROJECTS.length, sizes: '(max-width: 980px) 100vw, 40vw', cls: 'project-photo ice' }) : `<div class="project-photo project-empty resin" aria-hidden="true"><span>${esc(p.name)}</span></div>`}
  <div class="project-text">
    <span class="state${p.live ? ' is-live' : ''}">${esc(p.state)}</span>
    <h2>${esc(p.name)}</h2>
    <p class="lead">${esc(p.text)}</p>
    <div class="actions">${p.links.map((l, k) => (k === 0 ? action(l.msg ? { label: l.label, msg: l.msg } : { label: l.label, href: l.href }) : link(l.href, l.label))).join('')}</div>
  </div>
</article>`).join('');
  return `<section class="page-head page-head-text-only">
  <div class="wrap">
    <p class="label">проекты</p>
    <h1>${split('Проекты в работе')}</h1>
    <p class="lead">То, что работает сейчас, и то, что в пути. По порядку: от того, что открыто каждый день, к тому, что ещё собирается.</p>
  </div>
</section>
<section class="section projects-full"><div class="wrap">${items}</div></section>
${ctaBand()}`;
}

// ─── about ─────────────────────────────────────────────────────────────────────────────────────────

export function about() {
  const path = [
    ['около 2016', 'Первый звук', 'Услышал ханг на YouTube. Даже через экран в этом звуке было что-то особенное.'],
    ['2017', 'Гоа, Арамболь', 'Живая встреча: вечером на улице услышал звук, похожий на колокольчики, и пошёл прямо к нему.'],
    ['2019–2021', 'Школа ханга Animara', 'Основал школу в Красной Поляне. Больше тысячи учеников научились звучать на инструментах.'],
    ['Алтай', 'Храм Звука', 'Три года веду звуковые сессии в зеркальном куполе. На них побывали больше 10 000 человек.'],
    ['Таиланд', 'Awakening Meditation', 'Сооснователь проекта: регулярные благотворительные медитации под звучание ханга.'],
    ['2026', 'Музыка и код', 'Альбом Music of the Sphere’s, приложение Handpan Sphere, этот сайт.'],
  ];
  return `${pageHead({
    label: 'обо мне',
    title: 'Андрей Наумов, Andy Now',
    lead: 'Играю на ханге, пишу музыку, учу и веду звуковые сессии. И собираю цифровые продукты.',
    cta: [action({ label: 'Написать мне', msg: 'hello' })],
    img: 'portrait-band', pos: '50% 40%', tag: 'Земли Силы',
  })}

<section class="section reading" aria-labelledby="story-title">
  <div class="wrap read">
    ${secHead('story-title', 'путь к хангу', '', { align: 'left' })}
    <p class="lead">Впервые я услышал ханг примерно десять лет назад на YouTube. Звук сразу цеплял внимание и создавал странное, очень глубокое ощущение внутри.</p>
    <p>Тогда я ещё не знал, что однажды этот инструмент станет частью моего пути. Потом случилась живая встреча. В 2017 году, в предновогоднем Гоа, я гулял вечером по Арамболю и вдруг услышал звук, похожий на колокольчики. Пошёл прямо к нему и увидел девушку с джембе и другую, высекающую искры из стальной сферы.</p>
    <p>Я помню это ощущение до сих пор. Звук уносил далеко за пределы тела, пальцы сами отстукивали ритм, мысли затихали. Оставалось только звучание и чувство, что внутри открылось что-то очень живое.</p>
    <p>Ханг дал мне возможность выражать через звук то, что трудно передать словами. Через него я стал глубже слышать и исследовать внимание, внутренний ритм и само состояние, из которого рождается музыка.</p>
  </div>
  <div class="wrap">${photo('river-wide', { cls: 'wide-photo', sizes: '100vw', caption: 'Алтай, река Катунь', tag: 'Катунь' })}</div>
</section>

<section class="section" aria-labelledby="path-title">
  <div class="wrap split-grid">
    ${secHead('path-title', 'по годам', '', { align: 'left' })}
    <ol class="rows timeline">${path.map(([when, h, t]) => `<li><span class="num">${esc(when)}</span><h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ol>
  </div>
</section>

<section class="section night temple" aria-labelledby="temple-title">
  <div class="wrap temple-grid">
    <div class="temple-text">
      <p class="label">Алтай</p>
      <h2 id="temple-title" class="h-big">${split('Храм Звука')}</h2>
      <p class="lead">Частный заповедник «Земли Силы» проекта «Анимара» в долине Катуни, на Алтае: больше 600 гектаров природы, тишины и чистого неба.</p>
      <p>В центре стоит зеркальный купол диаметром 12 метров из более чем 1200 панелей. Звук отражается и окутывает со всех сторон. Здесь я три года веду сессии, и всё, что знаю о звуке, состоянии и пространстве, собрал в курс для ведущих.</p>
      <div class="actions">${action({ label: 'Курс ведущего', href: '/learn/#leader' }, 'btn btn-orange')}${link(SITE.zemli, 'Проект «Земли Силы»')}</div>
    </div>
    ${photo('temple-arch', { ratio: '3/4', tag: 'арка', sizes: '(max-width: 760px) 100vw, 30vw', cls: 'temple-a' })}
    ${photo('altai-tipi', { ratio: '3/4', pos: '48% 50%', tag: 'долина Катуни', sizes: '(max-width: 760px) 100vw, 30vw', cls: 'temple-b' })}
    ${photo('temple-summer', { ratio: '16/9', pos: '50% 60%', tag: 'купол летом', sizes: '(max-width: 760px) 100vw, 90vw', cls: 'temple-c' })}
  </div>
</section>

<section class="section" aria-labelledby="school-title">
  <div class="wrap split-grid">
    ${secHead('school-title', 'ученики', '', { align: 'left' })}
    <div>
      ${photo('school-group', { caption: 'Занятие в школе ханга Animara', sizes: '(max-width: 980px) 100vw, 55vw' })}
      ${facts('facts-tight')}
    </div>
  </div>
</section>

${ctaBand()}`;
}

// ─── journal ───────────────────────────────────────────────────────────────────────────────────────

export function journal(posts) {
  return `<section class="page-head page-head-text-only">
  <div class="wrap">
    <p class="label">журнал</p>
    <h1>${split('Журнал о звуке')}</h1>
    <p class="lead">Заметки о звуке, практике и пути. Новые записи выходят в канале «Музыка Сфер» в Telegram, здесь они собраны, чтобы читать спокойно.</p>
    <div class="actions">${action({ label: 'Канал в Telegram', href: SITE.channel })}</div>
  </div>
</section>
<section class="section section-tight journal-list"><div class="wrap"><div class="posts-grid">${posts.map((p) => postCard(p)).join('')}</div></div></section>`;
}

export function post(p, prev, next) {
  const img = p.photo && PHOTOS[p.photo]
    ? photo(p.photo, { loading: 'eager', sizes: '(max-width: 760px) 100vw, 860px', cls: 'article-photo' })
    : p.images && p.images.length ? p.images.map((im) => `<figure class="photo article-photo"><span class="photo-in"><img src="/content/telegram/${esc(im)}" alt="" loading="lazy"></span></figure>`).join('') : '';
  const nav = [prev && `<a class="pn prev" href="${prev.url}"><span class="mono">ранее</span>${esc(prev.title || prev.excerpt.slice(0, 60))}</a>`, next && `<a class="pn next" href="${next.url}"><span class="mono">новее</span>${esc(next.title || next.excerpt.slice(0, 60))}</a>`].filter(Boolean).join('');
  return `<article class="article">
  <div class="wrap read">
    <p class="crumbs mono"><a href="/journal/">журнал</a> / <time datetime="${p.date}">${p.human}</time></p>
    ${p.title ? `<h1>${esc(p.title)}</h1>` : '<h1 class="visually-hidden">Стихотворение</h1>'}
  </div>
  ${img ? `<div class="wrap read-wide">${img}</div>` : ''}
  <div class="wrap read article-body${p.poem ? ' is-poem' : ''}">${p.html}
    <p class="article-foot"><a class="btn btn-ink" href="${p.link}" target="_blank" rel="noopener">Канал «Музыка Сфер» в Telegram</a></p>
  </div>
  ${nav ? `<nav class="wrap read pn-row" aria-label="Другие записи">${nav}</nav>` : ''}
</article>
${ctaBand({ title: 'Напишите мне', text: 'Если откликнулось, расскажите. Отвечаю лично.' })}`;
}

export function notFound() {
  return `<section class="page-head page-head-text-only nf">
  <div class="wrap">
    <p class="label mono">404</p>
    <h1>${split('Здесь тихо')}</h1>
    <p class="lead">Такой страницы нет. Возможно, ссылка устарела.</p>
    <div class="actions">${action({ label: 'На главную', href: '/' })}${link('/journal/', 'Журнал')}</div>
  </div>
</section>`;
}

export { MSG, attrs };
