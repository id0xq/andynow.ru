// The pages of the space. Each function returns the inside of <main>; build.mjs wraps it with page().
import { esc, tg, action, photo, ctaBand, attrs, PHOTOS } from './layout.mjs';
import { SITE, STATEMENTS, FACTS, ROOMS, PROJECTS, OFFERS, SCALES, VIDEOS, MSG } from './content.mjs';

const link = (href, label, cls = 'link') => `<a class="${cls}" href="${esc(href)}"${attrs(href)}>${esc(label)}</a>`;

const facts = (cls = '') => `<ul class="facts${cls ? ' ' + cls : ''}">${FACTS.map(([n, t]) => `<li><b>${esc(n)}</b><span>${esc(t)}</span></li>`).join('')}</ul>`;

function postCard(p, { big = false } = {}) {
  const img = p.photo && PHOTOS[p.photo]
    ? photo(p.photo, { sizes: '(max-width: 760px) 100vw, 33vw', cls: 'post-photo' })
    : p.images && p.images.length
      ? `<figure class="photo post-photo tg-photo"><img src="/content/telegram/${esc(p.images[0])}" alt="" loading="lazy" decoding="async"></figure>`
      : '';
  const head = p.title ? `<h3>${esc(p.title)}</h3>` : '';
  const text = p.poem
    ? `<p class="poem">${esc(p.poem.split('\n\n').slice(0, 2).join('\n\n')).replace(/\n/g, '<br>')}</p>`
    : `<p class="excerpt">${esc(p.excerpt)}</p>`;
  return `<article class="post-card${p.poem ? ' is-poem' : ''}${big ? ' is-big' : ''}">
  <a href="${p.url}" class="post-link">${img}<time datetime="${p.date}">${p.human}</time>${head}${text}<span class="read">Читать</span></a>
</article>`;
}

function videos() {
  return `<div class="videos">${VIDEOS.map((v) => `<figure class="video" data-rutube="${v.id}">
  <button type="button" class="video-play" aria-label="Смотреть: ${esc(v.title)}, ${v.time}">
    <img src="/assets/img/video/${v.poster}.webp" width="640" height="360" alt="" loading="lazy" decoding="async"><span class="play" aria-hidden="true"></span>
  </button>
  <figcaption><span>${esc(v.title)}</span><span>${v.time}</span></figcaption>
</figure>`).join('')}</div>`;
}

function pageHead({ title, lead, cta = [], img, mat = 'sand', note = '' }) {
  return `<section class="page-head">
  <div class="wrap page-head-grid">
    <div class="page-head-text">
      <h1>${esc(title)}</h1>
      <p class="lead">${esc(lead)}</p>
      ${note ? `<p class="note-line">${note}</p>` : ''}
      <div class="actions">${cta.join('')}</div>
    </div>
    ${img ? photo(img, { mat, loading: 'eager', sizes: '(max-width: 980px) 100vw, 45vw', cls: 'page-head-photo' }) : ''}
  </div>
</section>`;
}

const steps = (items) => `<ol class="steps">${items.map(([h, t], i) => `<li><span class="step-n">${i + 1}</span><div><h3>${esc(h)}</h3><p>${esc(t)}</p></div></li>`).join('')}</ol>`;

const faq = (items) => `<div class="faq">${items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('')}</div>`;

// ─── home ──────────────────────────────────────────────────────────────────────────────────────────

export function home(posts) {
  const statements = STATEMENTS.map((s) => `<button type="button" class="statement" data-key="${s.key}" data-form="${s.form}" aria-controls="note-${s.key}" aria-pressed="false">${esc(s.line).replace(/\.$/, '<span class="dot">.</span>')}</button>`).join(' ');
  const notes = STATEMENTS.map((s) => `<div class="note" id="note-${s.key}" data-key="${s.key}" hidden>
  <p>${esc(s.text)}</p>
  <div class="actions">${action(s.cta)}${link(s.more.href, s.more.label)}</div>
</div>`).join('');
  const rooms = ROOMS.map((r) => `<a class="room" href="${r.href}">
  ${photo(r.photo, { mat: r.mat, fit: 'contain', sizes: '(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 25vw', cls: 'room-photo' })}
  <h3>${esc(r.title)}</h3><p>${esc(r.text)}</p>
</a>`).join('');
  const latest = posts.slice(0, 3).map((p) => postCard(p)).join('');
  const projects = PROJECTS.map((p) => `<li class="proj-row">
  <span class="state${p.live ? ' is-live' : ''}">${esc(p.state)}</span>
  <h3>${esc(p.name)}</h3>
  <p>${esc(p.text)}</p>
  <span class="proj-links">${p.links.map((l) => link(l.msg ? tg(l.msg) : l.href, l.label)).join('')}</span>
</li>`).join('');

  return `<section class="hero" aria-labelledby="hero-title">
  <div class="hero-flock"><canvas data-flock aria-hidden="true"></canvas><noscript>${photo('figure-sea', { loading: 'eager' })}</noscript></div>
  <div class="wrap hero-body">
    <p class="hero-name">Andy Now, музыкант и исследователь звука</p>
    <h1 id="hero-title" class="statements">${statements}</h1>
    <div class="notes" aria-live="polite">
      <div class="note is-default" id="note-default">
        <p>Выберите, с чем вы пришли, или просто напишите. Отвечаю лично.</p>
        <div class="actions">${action({ label: 'Написать мне', msg: 'hello' }, 'btn btn-black')}${link('/journal/', 'Читать журнал')}</div>
      </div>
      ${notes}
    </div>
  </div>
</section>

<section class="band intro" aria-labelledby="intro-title">
  <div class="wrap intro-grid">
    ${photo('portrait-smile', { mat: 'blush', sizes: '(max-width: 760px) 100vw, 40vw', cls: 'intro-photo' })}
    <div class="intro-text">
      <h2 id="intro-title">Звук меняет дыхание</h2>
      <p class="lead">Меня зовут Андрей, в музыке я Andy Now. Играю на ханге, пишу музыку и веду канал «Музыка Сфер».</p>
      <p>Больше семи лет я исследую, как звук влияет на внимание, дыхание и восприятие времени: в школе ханга Animara, на медитациях в Таиланде, в зеркальном Храме Звука на Алтае.</p>
      <p>Вторая моя половина инженерная. Handpan Sphere, виртуальный ханг в браузере и Telegram, я собрал сам, от идеи до кода.</p>
      ${link('/about/', 'Моя история')}
    </div>
  </div>
  <div class="wrap">${facts()}</div>
</section>

<section class="band rooms" aria-labelledby="rooms-title">
  <div class="wrap">
    <h2 id="rooms-title">Чем могу быть полезен</h2>
    <div class="rooms-grid">${rooms}</div>
  </div>
</section>

<section class="band band-sand journal-preview" aria-labelledby="journal-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="journal-title">Журнал</h2>
      <p class="lead">Заметки о звуке, практике и пути из канала «Музыка Сфер».</p>
      <div class="actions">${link('/journal/', 'Все записи')}${link(SITE.channel, 'Канал в Telegram')}</div>
    </div>
    <div class="posts-grid">${latest}</div>
  </div>
</section>

<section class="band band-black listen" aria-labelledby="listen-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="listen-title">Послушать</h2>
      <p class="lead">Альбом Music of the Sphere’s и записи с Алтая. Наушники и десять спокойных минут.</p>
      <div class="actions">${action({ label: 'Слушать альбом', href: SITE.album })}${link(SITE.rutube, 'Все видео')}</div>
    </div>
    ${videos()}
  </div>
</section>

<section class="band projects-preview" aria-labelledby="projects-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="projects-title">Проекты</h2>
      <div class="actions">${link('/projects/', 'Подробнее о проектах')}</div>
    </div>
    <ol class="proj-list">${projects}</ol>
  </div>
</section>

${ctaBand()}`;
}

// ─── learn ─────────────────────────────────────────────────────────────────────────────────────────

export function learn() {
  const mats = ['aqua', 'sand', 'blush', 'aqua'];
  const offers = OFFERS.map((o, i) => `<article class="offer" id="${o.id}">
  ${photo(o.photo, { mat: mats[i], sizes: '(max-width: 980px) 100vw, 42vw', cls: 'offer-photo' })}
  <div class="offer-text">
    <h2>${esc(o.title)}</h2>
    <p class="lead">${esc(o.lead)}</p>
    ${o.steps ? `<ol class="tiers">${o.steps.map(([n, c, t]) => `<li><b>${esc(n)}</b><span class="tier-count">${esc(c)}</span><p>${esc(t)}</p></li>`).join('')}</ol>` : ''}
    <ul class="ticks">${o.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    <p class="meta">${esc(o.meta)}</p>
    <div class="actions">${action(o.cta)}</div>
  </div>
</article>`).join('');

  return `${pageHead({
    title: 'Обучение игре на ханге',
    lead: 'Учу тех, кто никогда не держал инструмент в руках, и тех, кто уже играет и ищет свой почерк. Музыкальный опыт не нужен: ханг настроен в один строй, фальшивой ноты в нём нет.',
    cta: [action({ label: 'Записаться на пробное занятие', msg: 'trial' }), link('#formats', 'Форматы')],
    img: 'lesson-beach', mat: 'aqua',
  })}

<section class="band" aria-labelledby="first-title">
  <div class="wrap split">
    <h2 id="first-title">Как проходит первое занятие</h2>
    ${steps([
      ['Знакомимся', 'Вы рассказываете, что привело вас к хангу и чего хочется. Я слушаю, как вы играете, если уже играете.'],
      ['Звучим', 'Ставим руки, находим чистый звук, собираем первый ритм и первую мелодию. Её можно играть уже вечером.'],
      ['Строим путь', 'Определяем ваш уровень и договариваемся, как двигаться дальше: в каком темпе и к какой цели.'],
    ])}
  </div>
</section>

<section class="offers" id="formats" aria-label="Форматы обучения">
  <div class="wrap">${offers}</div>
</section>

<section class="band band-aqua" aria-labelledby="faq-title">
  <div class="wrap split">
    <h2 id="faq-title">Частые вопросы</h2>
    ${faq([
      ['У меня нет слуха и музыкального опыта. Получится?', 'Да. Все ноты ханга согласованы между собой, любое касание попадает в гармонию. Слух и чувство ритма приходят через игру и растут вместе с практикой.'],
      ['У меня ещё нет ханга. С чего начать?', `С подбора строя: <a href="/instruments/#pick">ответьте на три вопроса</a> или напишите мне. Пока инструмент в пути, строй можно послушать и поиграть на экране в <a href="${SITE.hps}" target="_blank" rel="noopener">Handpan Sphere</a>.`],
      ['Можно ли научиться онлайн?', 'Можно. Занятия идут один на один, по 60–75 минут. Нужны ханг и телефон, планшет или ноутбук для связи. На курсе после встреч остаётся видео с пройденным материалом.'],
      ['Сколько стоит обучение?', `Зависит от формата и числа занятий. Пробное занятие курса бесплатное. <a href="${esc(tg('lesson'))}" target="_blank" rel="noopener">Напишите мне</a>, и я расскажу подробно.`],
    ])}
  </div>
</section>

<section class="band" aria-labelledby="free-title">
  <div class="wrap free">
    <h2 id="free-title">Начать можно бесплатно</h2>
    <div class="free-grid">
      <a class="free-item" href="${SITE.practice}" target="_blank" rel="noopener"><h3>Звуковая практика</h3><p>Короткая практика в канале «Музыка Сфер». Наушники и десять минут тишины.</p><span class="link">Открыть в Telegram</span></a>
      <a class="free-item" href="${SITE.hps}" target="_blank" rel="noopener"><h3>Handpan Sphere</h3><p>Виртуальный ханг: играйте на схеме или со своим инструментом под атмосферу в его строе.</p><span class="link">handpansphere.ru</span></a>
    </div>
  </div>
</section>

${ctaBand({ title: 'Запишитесь на занятие', text: 'Напишите пару слов о себе и о том, играете ли вы уже. Отвечаю лично и подбираю время.' })}`;
}

// ─── instruments ───────────────────────────────────────────────────────────────────────────────────

export function instruments() {
  const scales = Object.entries(SCALES).map(([id, s]) => `<li class="scale"><img src="/assets/img/hangs/${id}-s.webp" width="300" height="300" alt="Ханг ${esc(s.name)}" loading="lazy" decoding="async"><div><h3>${esc(s.name)}</h3><p class="notes-line">${esc(s.notes)}</p><p>${esc(s.text)}</p></div></li>`).join('');
  const q = (name, legend, options) => `<fieldset><legend>${esc(legend)}</legend>${options.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}"><span>${esc(l)}</span></label>`).join('')}</fieldset>`;
  return `${pageHead({
    title: 'Подберу лучший инструмент',
    lead: 'Строй определяет характер ханга на годы вперёд. Помогаю выбрать его по звуку, задаче и рукам, чтобы инструмент хотелось брать каждый день.',
    cta: [action({ label: 'Подобрать инструмент', href: '#pick' }), action({ label: 'Написать', msg: 'instrument' }, 'btn btn-line')],
    img: 'hangs-duo', mat: 'sand',
  })}

<section class="band" aria-labelledby="how-title">
  <div class="wrap split">
    <h2 id="how-title">Как я подбираю</h2>
    ${steps([
      ['Слушаю вас', 'Какой звук отзывается, для чего инструмент, играете ли вы уже. Можно начать с трёх вопросов ниже.'],
      ['Предлагаю строй', 'Объясняю, чем строи отличаются, и даю их послушать. Каждый можно попробовать в Handpan Sphere.'],
      ['Привожу к инструменту', 'Рассказываю о наличии, сроках и стоимости. Если нужно, первое занятие на новом инструменте проведём вместе.'],
    ])}
  </div>
</section>

<section class="band band-sand pick" id="pick" aria-labelledby="pick-title">
  <div class="wrap">
    <h2 id="pick-title">Найдём ваш строй</h2>
    <p class="lead">Три вопроса, и станет понятно, с какого строя начать разговор.</p>
    <div class="quiz">
      <form class="quiz-form" id="quizForm">
        ${q('exp', 'Вы уже играете?', [['new', 'нет, это первый инструмент'], ['some', 'немного играю'], ['pro', 'играю уверенно, ищу второй']])}
        ${q('sound', 'Какой звук вам ближе?', [['warm', 'тёплый и спокойный'], ['deep', 'низкий и медитативный'], ['light', 'светлый и лиричный'], ['east', 'восточный, с характером']])}
        ${q('use', 'Для чего инструмент?', [['self', 'играть для себя'], ['people', 'вести практики и сессии'], ['stage', 'сцена и запись']])}
      </form>
      <div class="quiz-result" id="quizResult" aria-live="polite">
        <img id="quizPhoto" src="/assets/img/hangs/d-kurd-9.webp" width="900" height="900" alt="Ханг на девять нот" loading="lazy">
        <div>
          <p class="quiz-state" id="quizState">Ответьте на три вопроса</p>
          <h3 id="quizName">Здесь появится ваш строй</h3>
          <p class="notes-line" id="quizNotes"></p>
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

<section class="band" aria-labelledby="scales-title">
  <div class="wrap">
    <div class="section-head"><h2 id="scales-title">Строи на девять нот</h2><p class="lead">Классика, с которой начинают. Есть расширенные версии на 10–21 ноту под заказ.</p></div>
    <ul class="scales">${scales}</ul>
  </div>
</section>

<section class="band band-black" aria-labelledby="steel-title">
  <div class="wrap split">
    <div>
      <h2 id="steel-title">Что важно знать</h2>
      ${photo('hang-detail', { mat: 'none', sizes: '(max-width: 980px) 100vw, 40vw', cls: 'steel-photo' })}
    </div>
    <ul class="specs">
      <li><b>Нержавеющая сталь</b><p>Инструмент не боится влаги и не требует частого ухода.</p></li>
      <li><b>Длинный сустейн</b><p>Нота звучит долго и ровно, слышно каждое касание.</p></li>
      <li><b>От 9 до 21 ноты</b><p>Классические строи на девять нот и расширенные, с нотами снизу и мутантами.</p></li>
      <li><b>И не только ханг</b><p>Напишите, какой инструмент ищете: расскажу, что есть.</p></li>
    </ul>
  </div>
</section>

${ctaBand({ title: 'Подберём инструмент', text: 'Напишите, какой звук вы ищете и для чего. Отвечаю лично.' })}`;
}

// ─── sound on events ───────────────────────────────────────────────────────────────────────────────

export function sound() {
  return `${pageHead({
    title: 'Звучу на ретритах и событиях',
    lead: 'Каждый сет складывается один раз, здесь и сейчас. Это звуковой сюжет, в котором можно лечь, закрыть глаза и выдохнуть.',
    cta: [action({ label: 'Пригласить звучать', msg: 'event' })],
    note: 'После сессий чаще всего говорят о глубоком расслаблении, ровном дыхании и ясной голове.',
    img: 'session-studio', mat: 'blush',
  })}

<section class="band" aria-labelledby="formats-title">
  <div class="wrap split">
    <h2 id="formats-title">Форматы</h2>
    <dl class="spec-list">
      <div><dt>Медитативный сет</dt><dd>Звуковое путешествие для группы: вход, погружение и мягкий выход в тишину.</dd></div>
      <div><dt>Глубокое погружение</dt><dd>Длинная сессия sound healing, когда участники лежат и просто слушают.</dd></div>
      <div><dt>Звук для практик</dt><dd>Живая музыка для йоги, дыхательных и телесных практик.</dd></div>
      <div><dt>Шавасана и йога-нидра</dt><dd>Тихое звучание в конце практики.</dd></div>
      <div><dt>Длительность</dt><dd>15, 30, 45, 60, 75 или 90 минут</dd></div>
      <div><dt>Где</dt><dd>Ретриты, студии йоги, фестивали, свадьбы, частные и корпоративные события</dd></div>
    </dl>
  </div>
</section>

<section class="band band-blush" aria-labelledby="where-title">
  <div class="wrap">
    <div class="section-head"><h2 id="where-title">Где я звучу</h2></div>
    <div class="gallery">
      ${photo('temple-inside', { caption: 'Храм Звука, Алтай: три года сессий, больше 10 000 человек', sizes: '(max-width: 760px) 100vw, 33vw' })}
      ${photo('session-group', { caption: 'Awakening Meditation, Таиланд: благотворительные медитации под ханг', sizes: '(max-width: 760px) 100vw, 66vw' })}
      ${photo('session-forest', { caption: 'Бали: запись в туманном лесу у вулкана', sizes: '(max-width: 760px) 100vw, 50vw' })}
      ${photo('session-wedding', { caption: 'Свадьбы и вечерние события', sizes: '(max-width: 760px) 100vw, 25vw' })}
      ${photo('event-portrait', { caption: 'Музыка для открытых практик', sizes: '(max-width: 760px) 100vw, 25vw' })}
    </div>
  </div>
</section>

<section class="band band-black" aria-labelledby="watch-title">
  <div class="wrap">
    <div class="section-head"><h2 id="watch-title">Как это звучит</h2><div class="actions">${action({ label: 'Слушать альбом', href: SITE.album })}${link(SITE.rutube, 'Все видео на Rutube')}</div></div>
    ${videos()}
  </div>
</section>

<section class="band" aria-labelledby="invite-title">
  <div class="wrap split">
    <h2 id="invite-title">Как пригласить</h2>
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
  return `${pageHead({
    title: 'Собираю цифровые продукты для ваших проектов',
    lead: 'Я музыкант с инженерной головой. Беру проекты как технический специалист: от идеи и архитектуры до продукта, которым пользуются.',
    cta: [action({ label: 'Обсудить проект', msg: 'project' })],
    img: 'laptop', mat: 'aqua',
  })}

<section class="band" aria-labelledby="do-title">
  <div class="wrap split">
    <h2 id="do-title">Что я делаю</h2>
    <ul class="specs specs-light">
      <li><b>Сайты и магазины</b><p>Быстрые, красивые, удобные на телефоне. Ставятся на телефон как приложение и работают без сети.</p></li>
      <li><b>Telegram: боты и Mini Apps</b><p>Приложения прямо в мессенджере: запись, оплата, облачное сохранение, приглашения.</p></li>
      <li><b>Автоматизация процессов</b><p>Заявки, уведомления, таблицы, интеграции между сервисами. Рутина уходит машине.</p></li>
      <li><b>ai-агенты и базы знаний</b><p>Помощники на Claude, которые знают ваш контекст: отвечают, пишут черновики, разбирают входящие.</p></li>
      <li><b>Звук в браузере</b><p>Синтез, эффекты, лупер и запись на Web Audio. Моя любимая часть.</p></li>
    </ul>
  </div>
</section>

<section class="band band-sand" aria-labelledby="cases-title">
  <div class="wrap">
    <h2 id="cases-title">Сделано</h2>
    <div class="cases">
      <a class="case" href="${SITE.hps}" target="_blank" rel="noopener">
        ${photo('hps-app', { mat: 'white', sizes: '(max-width: 760px) 100vw, 30vw' })}
        <div><h3>Handpan Sphere</h3><p>Виртуальный ханг и атмосферный бэк: аккорды, ритм и природа звучат в строе инструмента. Сайт, офлайн-приложение и Telegram Mini App на одном коде, бот на Cloudflare Workers.</p><span class="link">handpansphere.ru</span></div>
      </a>
      <div class="case">
        ${photo('figure-sea', { mat: 'white', sizes: '(max-width: 760px) 100vw, 30vw' })}
        <div><h3>andynow.ru</h3><p>Этот сайт: стая из тысяч точек на первом экране, журнал из канала, единая обработка фото. Статический, быстрый, без лишних зависимостей.</p></div>
      </div>
      <div class="case">
        ${photo('scarf-gong', { mat: 'white', sizes: '(max-width: 760px) 100vw, 30vw' })}
        <div><h3>~ontheflow./</h3><p>Магазин редких артефактов на Next.js и Payload CMS: витрина, корзина, заказы с уведомлениями в Telegram, админка на русском.</p></div>
      </div>
    </div>
  </div>
</section>

<section class="band" aria-labelledby="stack-title">
  <div class="wrap split">
    <h2 id="stack-title">Как работаем</h2>
    <div>
      ${steps([
        ['Задача', 'Короткий разговор: что болит, кто пользователь, как поймём, что получилось.'],
        ['Прототип', 'Быстро собираю то, что можно потрогать, и мы правим по живому.'],
        ['Запуск', 'Довожу до продукта: домен, оплата, аналитика, инструкции. Остаюсь на связи.'],
      ])}
      <p class="stack">TypeScript, React и Next.js, Node, PostgreSQL и Supabase, Cloudflare Workers, Telegram Bot API и Mini Apps, Web Audio, Claude API, n8n и Make</p>
    </div>
  </div>
</section>

${ctaBand({ title: 'Обсудим проект', text: 'Опишите задачу в двух-трёх предложениях, и я отвечу, чем могу быть полезен.' })}`;
}

// ─── projects ──────────────────────────────────────────────────────────────────────────────────────

export function projects() {
  const mats = ['aqua', 'blush', 'sand', 'white', 'sand'];
  const items = PROJECTS.map((p, i) => `<article class="project">
  ${p.photo ? photo(p.photo, { mat: mats[i], sizes: '(max-width: 980px) 100vw, 40vw', cls: 'project-photo' }) : `<div class="project-photo project-empty mat-${mats[i]}" aria-hidden="true"><span>${esc(p.name)}</span></div>`}
  <div class="project-text">
    <span class="state${p.live ? ' is-live' : ''}">${esc(p.state)}</span>
    <h2>${esc(p.name)}</h2>
    <p class="lead">${esc(p.text)}</p>
    <div class="actions">${p.links.map((l, k) => (k === 0 ? action(l.msg ? { label: l.label, msg: l.msg } : { label: l.label, href: l.href }) : link(l.href, l.label))).join('')}</div>
  </div>
</article>`).join('');
  return `<section class="page-head page-head-text-only">
  <div class="wrap">
    <h1>Проекты</h1>
    <p class="lead">То, что работает сейчас, и то, что в пути. По порядку: от того, что открыто каждый день, к тому, что ещё собирается.</p>
  </div>
</section>
<section class="projects-full"><div class="wrap">${items}</div></section>
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
  return `<section class="page-head">
  <div class="wrap page-head-grid">
    <div class="page-head-text">
      <h1>Обо мне</h1>
      <p class="lead">Меня зовут Андрей Наумов, в музыке я Andy Now. Играю на ханге, пишу музыку, учу и веду звуковые сессии. И собираю цифровые продукты.</p>
      <div class="actions">${action({ label: 'Написать мне', msg: 'hello' })}</div>
    </div>
    ${photo('portrait-band', { mat: 'sand', loading: 'eager', sizes: '(max-width: 980px) 100vw, 45vw', cls: 'page-head-photo' })}
  </div>
</section>

<section class="band reading" aria-labelledby="story-title">
  <div class="wrap read">
    <h2 id="story-title">Путь к хангу</h2>
    <p>Впервые я услышал ханг примерно десять лет назад на YouTube. Звук сразу цеплял внимание и создавал странное, очень глубокое ощущение внутри. Тогда я ещё не знал, что однажды этот инструмент станет частью моего пути.</p>
    <p>Потом случилась живая встреча. В 2017 году, в предновогоднем Гоа, я гулял вечером по Арамболю и вдруг услышал звук, похожий на колокольчики. Пошёл прямо к нему и увидел девушку с джембе и другую, высекающую искры из стальной сферы.</p>
    <p>Я помню это ощущение до сих пор. Звук уносил далеко за пределы тела, пальцы сами отстукивали ритм, мысли затихали. Оставалось только звучание и чувство, что внутри открылось что-то очень живое.</p>
    <p>Ханг дал мне возможность выражать через звук то, что трудно передать словами. Через него я стал глубже слышать и исследовать внимание, внутренний ритм и само состояние, из которого рождается музыка.</p>
  </div>
  <div class="wrap">${photo('river-wide', { cls: 'wide-photo', sizes: '100vw', caption: 'Алтай, река Катунь' })}</div>
</section>

<section class="band band-sand" aria-labelledby="path-title">
  <div class="wrap split">
    <h2 id="path-title">По годам</h2>
    <ol class="timeline">${path.map(([when, h, t]) => `<li><span class="when">${esc(when)}</span><div><h3>${esc(h)}</h3><p>${esc(t)}</p></div></li>`).join('')}</ol>
  </div>
</section>

<section class="band temple" aria-labelledby="temple-title">
  <div class="wrap temple-grid">
    <div class="temple-text">
      <h2 id="temple-title">Храм Звука</h2>
      <p class="lead">Частный заповедник «Земли Силы» проекта «Анимара» в долине Катуни, на Алтае: больше 600 гектаров природы, тишины и чистого неба.</p>
      <p>В центре стоит зеркальный купол диаметром 12 метров из более чем 1200 панелей. Звук отражается и окутывает со всех сторон. Здесь я три года веду сессии, и всё, что знаю о звуке, состоянии и пространстве, собрал в курс для ведущих.</p>
      <div class="actions">${action({ label: 'Курс ведущего', href: '/learn/#leader' })}${link(SITE.zemli, 'Проект «Земли Силы»')}</div>
    </div>
    ${photo('temple-arch', { mat: 'blush', sizes: '(max-width: 760px) 100vw, 30vw', cls: 'temple-a' })}
    ${photo('temple-winter', { mat: 'aqua', sizes: '(max-width: 760px) 100vw, 30vw', cls: 'temple-b' })}
  </div>
</section>

<section class="band" aria-labelledby="school-title">
  <div class="wrap split">
    <h2 id="school-title">Ученики</h2>
    <div>
      ${photo('school-group', { sizes: '(max-width: 980px) 100vw, 55vw', caption: 'Занятие в школе ханга Animara' })}
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
    <h1>Журнал</h1>
    <p class="lead">Заметки о звуке, практике и пути. Новые записи выходят в канале «Музыка Сфер» в Telegram, здесь они собраны, чтобы читать спокойно.</p>
    <div class="actions">${action({ label: 'Канал в Telegram', href: SITE.channel })}${link('/journal/feed.xml', 'RSS')}</div>
  </div>
</section>
<section class="band band-tight journal-list"><div class="wrap"><div class="posts-grid">${posts.map((p) => postCard(p)).join('')}</div></div></section>`;
}

export function post(p, prev, next) {
  const img = p.photo && PHOTOS[p.photo]
    ? photo(p.photo, { mat: 'sand', loading: 'eager', sizes: '(max-width: 760px) 100vw, 720px', cls: 'article-photo' })
    : p.images && p.images.length ? p.images.map((im) => `<figure class="photo article-photo tg-photo"><img src="/content/telegram/${esc(im)}" alt="" loading="lazy"></figure>`).join('') : '';
  const nav = [prev && `<a class="pn prev" href="${prev.url}"><span>Ранее</span>${esc(prev.title || prev.excerpt.slice(0, 60))}</a>`, next && `<a class="pn next" href="${next.url}"><span>Новее</span>${esc(next.title || next.excerpt.slice(0, 60))}</a>`].filter(Boolean).join('');
  return `<article class="article">
  <div class="wrap read">
    <p class="crumbs"><a href="/journal/">Журнал</a></p>
    <time datetime="${p.date}">${p.human}</time>
    ${p.title ? `<h1>${esc(p.title)}</h1>` : '<h1 class="visually-hidden">Стихотворение</h1>'}
  </div>
  ${img ? `<div class="wrap read-wide">${img}</div>` : ''}
  <div class="wrap read article-body${p.poem ? ' is-poem' : ''}">${p.html}
    <p class="article-foot"><a class="btn btn-black" href="${p.link}" target="_blank" rel="noopener">Канал «Музыка Сфер» в Telegram</a></p>
  </div>
  ${nav ? `<nav class="wrap read pn-row" aria-label="Другие записи">${nav}</nav>` : ''}
</article>
${ctaBand({ title: 'Напишите мне', text: 'Если откликнулось, расскажите. Отвечаю лично.' })}`;
}

export function notFound() {
  return `<section class="page-head page-head-text-only nf">
  <div class="wrap">
    <h1>Здесь тихо</h1>
    <p class="lead">Такой страницы нет. Возможно, ссылка устарела.</p>
    <div class="actions">${action({ label: 'На главную', href: '/' }, 'btn btn-black')}${link('/journal/', 'Журнал')}</div>
  </div>
</section>`;
}

export { MSG };
