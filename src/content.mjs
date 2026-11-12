// Everything the pages say, in one place. Tone: Andy's voice (vault _context/style-guide.md):
// direct statements, short paragraphs, no pressure, lowercase where it feels softer.

export const SITE = {
  url: 'https://andynow.ru',
  name: 'Andy Now',
  telegram: 'https://t.me/andynow',
  channel: 'https://t.me/Music_ofSpheres',
  album: 'https://band.link/andynow',
  rutube: 'https://rutube.ru/channel/64767316/',
  vk: 'https://vk.com/music_ofspheres',
  youtube: 'https://www.youtube.com/@Music_ofSpheres',
  dzen: 'https://dzen.ru/handpan',
  instagram: 'https://www.instagram.com/now.andy_',
  hps: 'https://handpansphere.ru/',
  bot: 'https://t.me/handpansbot',
  zemli: 'https://www.instagram.com/zemli_sili/',
  cinematic: 'https://t.me/cinematiqbot',
  practice: 'https://t.me/Music_ofSpheres/69',
};

// ready-made first lines for the Telegram chat
export const MSG = {
  hello: 'Здравствуйте, Andy! Пишу с сайта andynow.ru.',
  lesson: 'Здравствуйте, Andy! Хочу записаться на занятие по хангу.',
  trial: 'Здравствуйте, Andy! Хочу записаться на пробное занятие по хангу.',
  course: 'Здравствуйте, Andy! Интересует курс игры на ханге. Хочу записаться на пробное занятие.',
  mentor: 'Здравствуйте, Andy! Хочу обсудить индивидуальное наставничество.',
  leader: 'Здравствуйте, Andy! Интересует курс ведущего звуковых сессий.',
  instrument: 'Здравствуйте, Andy! Хочу подобрать ханг. Подскажите, с чего начать?',
  event: 'Здравствуйте, Andy! Хочу пригласить вас звучать на событии. Дата: … Место: … Формат: …',
  project: 'Здравствуйте, Andy! Хочу обсудить совместный проект. Коротко о задаче: …',
  ontheflow: 'Здравствуйте, Andy! Напишите мне, когда откроется ontheflow.',
};

export const NAV = [
  { href: '/journal/', label: 'Журнал' },
  { href: '/learn/', label: 'Обучение' },
  { href: '/instruments/', label: 'Инструменты' },
  { href: '/sound/', label: 'Звук на событиях' },
  { href: '/digital/', label: 'Цифровые продукты' },
  { href: '/projects/', label: 'Проекты' },
  { href: '/about/', label: 'Обо мне' },
];

// The four statements of the first screen. Each one gathers the living photo into its own form and opens a short note.
export const STATEMENTS = [
  {
    key: 'learn', form: 'hang', line: 'Обучаю игре на ханге.',
    text: 'Онлайн и вживую, с нуля и для тех, кто уже играет. Первая мелодия звучит на первом занятии.',
    cta: { label: 'Записаться на занятие', msg: 'lesson' }, more: { href: '/learn/', label: 'Форматы обучения' },
  },
  {
    key: 'instruments', form: 'shell', line: 'Подберу лучший инструмент.',
    text: 'Ханг и другие инструменты под ваш звук и задачу. Расскажу о строе, наличии, сроках и цене.',
    cta: { label: 'Подобрать инструмент', href: '/instruments/#pick' }, more: { href: '/instruments/', label: 'Как я подбираю' },
  },
  {
    key: 'sound', form: 'waves', line: 'Звучу на ретритах и событиях.',
    text: 'Живые сеты от 15 до 90 минут: ретриты, йога, фестивали, свадьбы и частные встречи.',
    cta: { label: 'Пригласить звучать', msg: 'event' }, more: { href: '/sound/', label: 'Как это проходит' },
  },
  {
    key: 'digital', form: 'cube', line: 'Собираю цифровые продукты для ваших проектов.',
    text: 'Сайты, Telegram-приложения, автоматизация. Беру проекты как технический специалист, от идеи до запуска.',
    cta: { label: 'Обсудить проект', msg: 'project' }, more: { href: '/digital/', label: 'Что я делаю' },
  },
];

export const FACTS = [
  ['10 000+', 'человек побывали на моих звуковых сессиях'],
  ['1000+', 'учеников научились звучать на инструментах'],
  ['7+ лет', 'исследую, как звук влияет на состояние'],
  ['3 года', 'веду сессии в Храме Звука на Алтае'],
];

export const ROOMS = [
  { href: '/learn/', photo: 'beach-djembe', pos: '50% 45%', title: 'Обучение', text: 'Занятия один на один, курс из 2, 4 или 8 встреч, наставничество и курс ведущего.' },
  { href: '/instruments/', photo: 'hang-chest', pos: '62% 50%', title: 'Инструменты', text: 'Подбор ханга по звуку и задаче. Три вопроса, и понятно, с какого строя начать.' },
  { href: '/sound/', photo: 'session-wedding', pos: '50% 60%', title: 'Звук на событиях', text: 'Звуковые сессии и сеты для ретритов, йоги, фестивалей и частных событий.' },
  { href: '/digital/', photo: 'laptop', pos: '50% 60%', title: 'Цифровые продукты', text: 'Сайты, Telegram-приложения и автоматизация для ваших проектов.' },
];

export const PROJECTS = [
  {
    name: 'Handpan Sphere', state: 'работает', live: true, photo: 'hps-atmo',
    text: 'Виртуальный ханг и атмосферный бэк в строе вашего инструмента: танпура, бас, кахон, запись игры. Бесплатно, в браузере и в Telegram.',
    links: [{ href: SITE.hps, label: 'handpansphere.ru' }, { href: SITE.bot, label: '@handpansbot' }],
  },
  {
    name: 'Музыка Сфер', state: 'канал', live: true, photo: 'river-hat',
    text: 'Канал о музыке ханга: практики, релизы, заметки о звуке и состоянии. Здесь выходит альбом Music of the Sphere’s.',
    links: [{ href: SITE.channel, label: 'открыть канал' }, { href: SITE.album, label: 'слушать альбом' }],
  },
  {
    name: 'Земли Силы', state: 'работает', live: true, photo: 'temple-sunrise',
    text: 'Операционный менеджер автономного комплекса в первозданной природе Алтая. Настраиваю и автоматизирую процессы, управляю персоналом, вместе с единомышленниками развиваю проект.',
    links: [{ href: SITE.zemli, label: 'проект «Земли Силы»' }],
  },
  {
    name: 'Синематик', state: 'работает', live: true, photo: 'cinematic',
    text: 'Telegram-бот школы мобильной видеосъёмки. Уроки приходят автоматически, учиться можно в любое время. Веду проект целиком как технический специалист: от уроков до приёма оплат.',
    links: [{ href: SITE.cinematic, label: '@cinematiqbot' }],
  },
  {
    name: '~ontheflow./', state: 'скоро', live: false, photo: 'otf-sphere',
    text: 'Пространство редких артефактов и состояний. Первые изделия: музыкальные инструменты и шарфы.',
    links: [{ msg: 'ontheflow', label: 'узнать о запуске' }],
  },
  {
    name: 'amber&ash', state: 'в работе', live: false, photo: null,
    text: 'Совместный проект. Расскажу, когда он будет готов.',
    links: [],
  },
];

export const OFFERS = [
  {
    id: 'lesson', photo: 'offer-lesson', pos: '60% 40%', title: 'Онлайн-занятие',
    lead: 'Одна встреча, чтобы начать или разобрать то, что не получается',
    points: ['Звукоизвлечение, постановка рук и чистый звук без лишнего усилия', 'Базовый ритм и первая мелодия, с которыми можно играть сразу', 'Разбор вашего строя ханга и основы интуитивной игры'],
    cta: { label: 'Записаться на занятие', msg: 'lesson' },
  },
  {
    id: 'course', photo: 'beach-duo', pos: '50% 55%', title: 'Курс из 2, 4 или 8 занятий',
    lead: 'Путь от первых касаний до своей композиции',
    steps: [['Пробуждение', '2 занятия', 'Первый шаг: почувствовать инструмент, звучание и пространство практики.'], ['Погружение', '4 занятия', 'Базовая программа: ритм, уверенные руки, первые свои фразы.'], ['Резонанс', '8 занятий', 'Полный цикл: импровизация, структура и своя композиция.']],
    points: ['Пошаговая программа в понятном темпе', 'Уникальные ритмы, структура и импровизация', 'Видео с пройденным материалом, обратная связь'],
    cta: { label: 'Узнать о курсе', msg: 'course' },
  },
  {
    id: 'mentor', photo: 'lesson-dome', pos: '50% 62%', title: 'Индивидуальное наставничество',
    lead: 'Для тех, кто уже играет и хочет идти дальше',
    points: ['Программа под ваши цели: выступления, запись, свои практики', 'Работа над собственным звучанием и композиционное мышление', 'Регулярные онлайн и офлайн встречи, обмен опытом и ответы на вопросы'],
    cta: { label: 'Обсудить наставничество', msg: 'mentor' },
  },
  {
    id: 'leader', photo: 'offer-healing', full: true, title: 'Курс ведущего звуковых сессий',
    lead: 'Для тех, кто хочет проводить звуковые практики сам',
    points: ['Построение звуковой сессии: от первого звука до тишины', 'Работа с группой, пространством и состоянием', 'Нейрофизиология звука простым языком'],
    cta: { label: 'Узнать о курсе', msg: 'leader' },
  },
];

// nine-note scales of the Handpan Sphere catalogue, with the photo of each
export const SCALES = {
  'd-kurd-9': { name: 'D Kurd 9', notes: 'D3 / A3 Bb3 C4 D4 E4 F4 G4 A4', text: 'Глубокий тёплый минор. Самый популярный строй: в нём легко начать и долго не тесно.' },
  'd-celtic-minor-9': { name: 'D Celtic Minor 9', notes: 'D3 / A3 C4 D4 E4 F4 G4 A4 C5', text: 'Мягкий минор без острых углов. Ноты ладят в любом порядке, строй прощает ошибки.' },
  'cs-celtic-9': { name: 'C# Celtic 9', notes: 'C#3 / G#3 B3 C#4 D#4 E4 F#4 G#4 C#5', text: 'Кельтский характер на полтона ниже: чуть темнее и глубже, с длинным дыханием.' },
  'a-pygmy-9': { name: 'A Pygmy 9', notes: 'A2 / A3 B3 C4 E4 G4 A4 B4 C5', text: 'Пентатоника с низким дингом. Просторный созерцательный звук, ноты не спорят друг с другом.' },
  'c-pygmy-9': { name: 'C Pygmy 9', notes: 'C3 / G3 Ab3 C4 Eb4 F4 G4 Ab4 C5', text: 'Тёплый задумчивый строй. Хорош для медленной игры и вечерних практик.' },
  'f2-pygmy-9': { name: 'F2 Pygmy 9', notes: 'F2 / F3 G3 Ab3 C4 Eb4 F4 G4 Ab4', text: 'Очень низкий, бархатный. Этот строй звучит в моих записях из Храма Звука и держит долгие сессии.' },
  'cs-hijaz-9': { name: 'C# Hijaz 9', notes: 'C#3 / C#4 D4 F4 F#4 G#4 A4 B4 C#5', text: 'Восточный строй с характером: напряжение и разрешение слышны в каждой фразе.' },
  'e-equinox-9': { name: 'E Equinox 9', notes: 'E3 / G3 B3 C4 D4 E4 F#4 G4 B4', text: 'Лиричный строй: свет и лёгкая грусть в одной гамме. Легко рождает мелодии.' },
};

export const VIDEOS = [
  { id: '26e88ecd3420454f4cb82b24def42438', poster: 'altai', title: 'Весна в горах Алтая', time: '6:38' },
  { id: '3b4e280bb2697971f6478c3bbdec2155', poster: 'temple', title: 'В зеркальном Храме Звука', time: '10:33' },
  { id: '2e2ff12e3dc3b0bd1f19834082372377', poster: 'inner', title: 'Inner Sphere', time: '7:28' },
];

export const SOCIAL = [
  { href: SITE.telegram, label: 'Telegram' },
  { href: SITE.channel, label: 'Музыка Сфер' },
  { href: SITE.vk, label: 'ВКонтакте' },
  { href: SITE.rutube, label: 'Rutube' },
  { href: SITE.dzen, label: 'Дзен' },
  { href: SITE.youtube, label: 'YouTube' },
  { href: SITE.instagram, label: 'Instagram*' },
  { href: SITE.album, label: 'Альбом' },
];
