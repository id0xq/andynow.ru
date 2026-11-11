---
суть: andynow.ru — пространство личного бренда Andy Now, исходники и сборка
проект: dev
тип: код
статус: в работе
дата: 2026-11-11
---

# andynow.ru

Пространство Andy Now: кто я, обучение игре на ханге, подбор инструментов, звук на событиях, цифровые продукты, проекты и журнал из канала «Музыка Сфер».

Статический сайт без зависимостей: Node 20+ собирает HTML из шаблонов в `dist/`. Хостинг — GitHub Pages, домен — andynow.ru (REG.RU).

## Команды

```bash
node build.mjs            # сборка в dist/
node build.mjs --serve    # сборка и просмотр на http://localhost:4321
node tools/telegram.mjs   # забрать новые посты канала в content/telegram/
sh tools/publish.sh "что изменилось"   # выложить на GitHub, дальше сайт собирает и публикует Actions
```

## Устройство

```
build.mjs              сборка: страницы, журнал, RSS, sitemap
src/content.mjs        все тексты, ссылки, форматы, строи, проекты
src/pages.mjs          страницы: главная, обучение, инструменты, звук, цифровые продукты, проекты, обо мне, журнал
src/layout.mjs         шапка, подвал, фото, ссылки в Telegram с готовым сообщением
src/journal.mjs        журнал: content/journal/*.md + content/telegram/posts.json
src/assets/css/site.css
src/assets/js/flock.js стая на первом экране
src/assets/js/site.js  меню, фразы первого экрана, подбор строя, видео
src/assets/figure.bin  точки фигуры для стаи (tools/figure.py)
src/assets/img/        фото в единой ч/б обработке (tools/photos.py)
content/journal/       посты журнала (markdown с frontmatter)
tools/                 photos.py, figure.py, lift.swift, telegram.mjs, journal-seed.py, publish.sh
sources/               исходники, которых нет в фотобанке: вырезка фигуры, сохранённое с andynow.super.site
```

## Дизайн

- Цвета: белый, чёрный, оранжевый `#FF5B1A`. Песок `#EFE7DA`, пастельный розовый `#F6DCD6` и бирюзовый `#D4ECE7` — поля и паспарту для фото.
- Шрифты: Wix Madefor Display (заголовки), Wix Madefor Text (интерфейс), Literata (чтение журнала). Все OFL, лежат в `src/assets/fonts`.
- Фото: все в одной ч/б обработке, в исходных пропорциях. Где макету нужна рамка, фото стоит в паспарту целиком, без обрезки.
- Первый экран: четыре фразы. Каждая собирает стаю в свою форму и открывает короткое пояснение с кнопкой: ханг сверху (обучение), ханг в пространстве (инструменты), звуковые волны (события), куб (цифровые продукты). В покое стая — фигура Andy с хангом.

## Фото

`tools/photos.py` берёт оригиналы из `~/Downloads/Andy Photo Bank` (и пару кадров из handpan-sphere), переводит в ч/б одной кривой, добавляет одинаковое зерно, сохраняет WebP двух размеров и `photos.json`. Список кадров и подписи — в начале скрипта.

```bash
python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt
.venv/bin/python tools/photos.py
```

Фигура для стаи: фон снят Apple Vision (`swift tools/lift.swift IN.jpg cut.png mask.png`, macOS 14+), точки — `.venv/bin/python tools/figure.py`.

## Журнал

Источники два:
1. `content/journal/*.md` — посты из архива канала (первые взяты из проекта «Музыка Сфер» скриптом `tools/journal-seed.py`). Новый пост можно добавить файлом: frontmatter `date`, `title`, `photo` (имя из `photos.json`), дальше текст абзацами.
2. `content/telegram/posts.json` — то, что `tools/telegram.mjs` читает из канала. Workflow запускает его каждый день.

**Важно:** у канала @Music_ofSpheres включено «Запретить копирование». Пока оно включено, Telegram не отдаёт текст постов наружу (ни на t.me/s/, ни во встраиваниях), и автоматический сбор возвращает пустоту. Чтобы журнал пополнялся сам: Telegram → канал → Изменить → Тип канала → выключить «Запретить копирование». Если защита нужна, новые посты добавляются файлами в `content/journal/`.

## Публикация

- Репозиторий: `id0xq/andynow.ru` (публичный, нужен для бесплатного Pages).
- Сборка и выкладка: GitHub Actions (`.github/workflows/deploy.yml`) — на каждый push в main, вручную и раз в день.
- `tools/publish.sh` синхронизирует эту папку в клон `~/.cache/andynow.ru`, коммитит и пушит, включает Pages из Actions и домен.

## DNS (REG.RU, настроено 11.11.2026)

| Тип | Имя | Значение |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | id0xq.github.io. |

Сертификат выпускает GitHub сам, после того как домен привязан к Pages. Потом включается «Enforce HTTPS».
Если проверка GitHub долго пишет, что DNS не найден (так было с handpansphere.ru на серверах REG.RU, см. `handpan-sphere/docs/DOMAIN.md`), рабочее решение — перенести DNS в Cloudflare (бесплатно, режим DNS only) с теми же записями.
