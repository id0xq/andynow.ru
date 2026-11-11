// andynow.ru — header, menu, the statements of the first screen, the scale picker, video players.
// Every link works without this file; it only adds behaviour.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const TELEGRAM = 'https://t.me/andynow';
  const tg = (text) => TELEGRAM + '?text=' + encodeURIComponent(text);

  // header: solid once the page moves
  const top = $('#top');
  const onScroll = () => top.classList.toggle('is-solid', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // menu on narrow screens
  const menuBtn = $('.menu-btn'), menu = $('#menu');
  if (menuBtn && menu) {
    const setMenu = (open) => {
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.firstElementChild.textContent = open ? 'Закрыть' : 'Меню';
      menu.hidden = !open;
      document.body.classList.toggle('menu-open', open);
      document.documentElement.style.overflow = open ? 'hidden' : '';
    };
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  }

  // first screen: each statement changes the flock and opens its note
  const statements = $('.statements');
  if (statements) {
    const buttons = $$('.statement', statements);
    const notes = $$('.note');
    const body = $('.hero-body');
    let pinned = null, leaveTimer = null;

    const show = (key) => {
      statements.classList.toggle('has-active', !!key);
      buttons.forEach((b) => { const on = b.dataset.key === key; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
      notes.forEach((n) => {
        const on = key ? n.dataset.key === key : n.classList.contains('is-default');
        if (on && n.hidden) { n.hidden = false; n.classList.remove('is-entering'); void n.offsetWidth; n.classList.add('is-entering'); }
        if (!on) n.hidden = true;
      });
      const b = buttons.find((x) => x.dataset.key === key);
      window.dispatchEvent(new CustomEvent('flock:form', { detail: b ? b.dataset.form : 'figure' }));
    };

    buttons.forEach((b) => {
      b.addEventListener('mouseenter', () => { clearTimeout(leaveTimer); if (!pinned) show(b.dataset.key); });
      b.addEventListener('focus', () => { clearTimeout(leaveTimer); show(b.dataset.key); });
      b.addEventListener('click', () => {
        pinned = pinned === b.dataset.key ? null : b.dataset.key;
        show(pinned || b.dataset.key);
      });
    });
    body.addEventListener('mouseleave', () => {
      if (pinned) return;
      leaveTimer = setTimeout(() => show(null), 1400);
    });
    // a click outside the hero text lets the figure come back
    document.addEventListener('click', (e) => {
      if (pinned && !body.contains(e.target)) { pinned = null; show(null); }
    });
  }

  // scale picker (instruments page)
  const quizForm = $('#quizForm');
  if (quizForm) {
    const SCALES = {
      'd-kurd-9': ['D Kurd 9', 'D3 / A3 Bb3 C4 D4 E4 F4 G4 A4', 'Глубокий тёплый минор. Самый популярный строй: в нём легко начать и долго не тесно.'],
      'd-celtic-minor-9': ['D Celtic Minor 9', 'D3 / A3 C4 D4 E4 F4 G4 A4 C5', 'Мягкий минор без острых углов. Ноты ладят в любом порядке, строй прощает ошибки.'],
      'cs-celtic-9': ['C# Celtic 9', 'C#3 / G#3 B3 C#4 D#4 E4 F#4 G#4 C#5', 'Кельтский характер на полтона ниже: чуть темнее и глубже, с длинным дыханием.'],
      'a-pygmy-9': ['A Pygmy 9', 'A2 / A3 B3 C4 E4 G4 A4 B4 C5', 'Пентатоника с низким дингом. Просторный созерцательный звук, ноты не спорят друг с другом.'],
      'c-pygmy-9': ['C Pygmy 9', 'C3 / G3 Ab3 C4 Eb4 F4 G4 Ab4 C5', 'Тёплый задумчивый строй. Хорош для медленной игры и вечерних практик.'],
      'f2-pygmy-9': ['F2 Pygmy 9', 'F2 / F3 G3 Ab3 C4 Eb4 F4 G4 Ab4', 'Очень низкий, бархатный. Этот строй звучит в моих записях из Храма Звука и держит долгие сессии.'],
      'cs-hijaz-9': ['C# Hijaz 9', 'C#3 / C#4 D4 F4 F#4 G#4 A4 B4 C#5', 'Восточный строй с характером: напряжение и разрешение слышны в каждой фразе.'],
      'e-equinox-9': ['E Equinox 9', 'E3 / G3 B3 C4 D4 E4 F#4 G4 B4', 'Лиричный строй: свет и лёгкая грусть в одной гамме. Легко рождает мелодии.'],
    };
    // sound → purpose → [first choice, also worth hearing]
    const PICK = {
      warm: { self: ['d-kurd-9', 'd-celtic-minor-9'], people: ['d-celtic-minor-9', 'f2-pygmy-9'], stage: ['d-kurd-9', 'e-equinox-9'] },
      deep: { self: ['a-pygmy-9', 'c-pygmy-9'], people: ['f2-pygmy-9', 'a-pygmy-9'], stage: ['f2-pygmy-9', 'c-pygmy-9'] },
      light: { self: ['e-equinox-9', 'd-celtic-minor-9'], people: ['d-celtic-minor-9', 'e-equinox-9'], stage: ['e-equinox-9', 'cs-celtic-9'] },
      east: { self: ['cs-hijaz-9', 'd-kurd-9'], people: ['cs-hijaz-9', 'd-kurd-9'], stage: ['cs-hijaz-9', 'd-kurd-9'] },
    };
    const EXP = {
      new: 'Для первого инструмента девяти нот достаточно: меньше выбора, быстрее музыка.',
      some: 'Девяти нот хватит надолго. Если захочется шире, есть версии на десять нот и больше.',
      pro: 'Как второй инструмент стоит послушать и расширенные строи на 10–21 ноту: расскажу, что доступно.',
    };
    const WORDS = {
      exp: { new: 'первый инструмент', some: 'немного играю', pro: 'играю уверенно, ищу второй' },
      sound: { warm: 'тёплый и спокойный', deep: 'низкий и медитативный', light: 'светлый и лиричный', east: 'восточный, с характером' },
      use: { self: 'для себя', people: 'практики и сессии', stage: 'сцена и запись' },
    };
    const LEFT = { 3: 'Ответьте на три вопроса', 2: 'Ещё два вопроса', 1: 'Ещё один вопрос' };
    const el = { box: $('#quizResult'), photo: $('#quizPhoto'), state: $('#quizState'), name: $('#quizName'), notes: $('#quizNotes'), text: $('#quizText'), alt: $('#quizAlt'), cta: $('#quizCta') };
    quizForm.addEventListener('change', () => {
      const d = new FormData(quizForm);
      const exp = d.get('exp'), sound = d.get('sound'), use = d.get('use');
      const left = [exp, sound, use].filter((v) => !v).length;
      if (left) { el.state.textContent = LEFT[left]; return; }
      const [a, b] = PICK[sound][use];
      const [name, notes, text] = SCALES[a];
      el.photo.src = '/assets/img/hangs/' + a + '.webp';
      el.photo.alt = 'Ханг ' + name;
      el.state.textContent = 'Начните с этого строя';
      el.name.textContent = name;
      el.notes.textContent = notes;
      el.text.textContent = text + ' ' + EXP[exp];
      el.alt.textContent = 'Послушайте также ' + SCALES[b][0] + '. Это первое приближение: точный подбор я делаю лично.';
      el.box.classList.add('is-ready');
      el.cta.href = tg('Здравствуйте, Andy! Подбираю ханг. Опыт: ' + WORDS.exp[exp] + '. Звук: ' + WORDS.sound[sound] + '. Для чего: ' + WORDS.use[use] + '. Сайт предложил строй ' + name + '. Подскажите по наличию, срокам и стоимости.');
    });
  }

  // video: the Rutube player loads only when asked
  $$('.video[data-rutube]').forEach((fig) => {
    const btn = $('.video-play', fig);
    btn.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.src = 'https://rutube.ru/play/embed/' + fig.dataset.rutube;
      frame.title = btn.getAttribute('aria-label').replace(/^Смотреть: /, '');
      frame.allow = 'autoplay; fullscreen; clipboard-write; encrypted-media';
      frame.allowFullscreen = true;
      frame.addEventListener('load', () => { try { frame.contentWindow.postMessage(JSON.stringify({ type: 'player:play', data: {} }), '*'); } catch (e) { /* the viewer presses play */ } });
      btn.replaceWith(frame);
      frame.focus();
    });
  });
})();
