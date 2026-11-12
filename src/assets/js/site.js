// andynow.ru — header, menu, the statements of the first screen, photos, resin cards, the scale picker, video players.
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

  // first screen: a statement is chosen with a click (or Enter); it gathers the photo into its form and
  // opens its note, and both stay until another statement is chosen or the same one is clicked again.
  // Hover only hints: the mouse can travel down to the buttons across other statements.
  const statements = $('.statements');
  if (statements) {
    const buttons = $$('.statement', statements);
    const notes = $$('.note');
    let chosen = null;

    const show = (key) => {
      statements.classList.toggle('has-active', !!key);
      buttons.forEach((b) => { const on = b.dataset.key === key; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
      notes.forEach((n) => {
        const on = key ? n.dataset.key === key : n.classList.contains('is-default');
        if (on && n.hidden) { n.hidden = false; n.classList.remove('is-entering'); void n.offsetWidth; n.classList.add('is-entering'); }
        if (!on) n.hidden = true;
      });
      const b = buttons.find((x) => x.dataset.key === key);
      window.dispatchEvent(new CustomEvent('flock:form', { detail: b ? b.dataset.form : 'photo' }));
    };

    buttons.forEach((b) => b.addEventListener('click', () => {
      chosen = chosen === b.dataset.key ? null : b.dataset.key;
      show(chosen);
    }));
  }

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // living photos: the preview is there at once; the photo develops over it as soon as it is on the
  // screen and loaded, then drifts slowly while visible
  const photos = $$('.photo');
  if (photos.length && 'IntersectionObserver' in window) {
    const develop = (el) => {
      el.classList.add('is-seen');
      if (!still) el._alive = setTimeout(() => el.classList.add('is-alive'), 700);
    };
    // Near the screen the photo is asked for at once (loading = eager): a hidden lazy image may never be
    // fetched by the browser on its own (Safari waits for it to be visible, and it is clipped until it
    // develops). It develops when loaded, and after 2.5 s in any case.
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      const el = e.target;
      if (e.isIntersecting && !el._asked) {
        el._asked = true;
        const img = $('img', el);
        if (!img || (img.complete && img.naturalWidth)) { develop(el); return; }
        let done = false;
        const go = () => { if (!done) { done = true; develop(el); } };
        img.addEventListener('load', go, { once: true });
        img.addEventListener('error', go, { once: true });
        setTimeout(go, 2500);
        img.loading = 'eager';
        if (img.complete && img.naturalWidth) go();
      } else if (el.classList.contains('is-seen') && !still) {
        clearTimeout(el._alive);
        el.classList.toggle('is-alive', e.isIntersecting);
      }
    }), { rootMargin: '0px 0px 25% 0px', threshold: 0.01 });
    photos.forEach((el) => io.observe(el));
  } else photos.forEach((el) => el.classList.add('is-seen'));

  // resin cards and ice cases lean a little towards the cursor; the gloss follows it, the picture
  // inside moves the other way, as if seen through a thick clear block
  if (!still && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.resin, .slab').forEach((el) => {
      let frame = 0;
      el.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          el.classList.add('is-tilting');
          el.style.setProperty('--rx', ((0.5 - y) * 5).toFixed(2) + 'deg');
          el.style.setProperty('--ry', ((x - 0.5) * 6).toFixed(2) + 'deg');
          el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
          el.style.setProperty('--dx', ((0.5 - x) * 6).toFixed(1) + 'px');
          el.style.setProperty('--dy', ((0.5 - y) * 5).toFixed(1) + 'px');
        });
      });
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame);
        el.classList.remove('is-tilting');
        ['--rx', '--ry', '--mx', '--my', '--dx', '--dy'].forEach((k) => el.style.removeProperty(k));
      });
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
