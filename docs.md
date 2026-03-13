# Документация tandem-sites.ru

> Внутренняя документация для разработчиков студии **Tandem Sites**.  
> Актуально на март 2026 г. При значительных изменениях — обновлять этот файл.

---

## Содержание

1. [Обзор проекта](#1-обзор-проекта)
2. [Стек и принципы разработки](#2-стек-и-принципы-разработки)
3. [Структура репозитория](#3-структура-репозитория)
4. [Хостинг и деплой](#4-хостинг-и-деплой)
5. [Главная страница — index.htm](#5-главная-страница--indexhtm)
    - [Full-page слайдер](#full-page-слайдер)
    - [Анимации и Canvas-эффекты](#анимации-и-canvas-эффекты)
    - [SEO и мета-разметка](#seo-и-мета-разметка)
    - [PWA](#pwa)
    - [Resource hints](#resource-hints)
6. [Service Worker — sw.js](#6-service-worker--swjs)
    - [Стратегия кеширования](#стратегия-кеширования)
    - [Sandbox guard для /viewer/works/\*](#sandbox-guard-для-viewerworks)
    - [Офлайн-страница](#офлайн-страница)
7. [Portfolio Viewer — /viewer/](#7-portfolio-viewer--viewer)
    - [Архитектура модулей](#архитектура-модулей)
    - [База данных проектов](#база-данных-проектов)
    - [Жизненный цикл загрузки сайта](#жизненный-цикл-загрузки-сайта)
    - [SmartPreload](#smartpreload)
    - [Phone-режим](#phone-режим)
    - [URL-синхронизация и история браузера](#url-синхронизация-и-история-браузера)
    - [No-Toolbox Viewer](#no-toolbox-viewer)
    - [CSS-архитектура Viewer](#css-архитектура-viewer)
8. [Утилиты-модули](#8-утилиты-модули)
    - [xfetcher.js](#xfetcherjs)
    - [http-to-https.js](#http-to-httpsjs)
9. [Works — демо-проекты](#9-works--демо-проекты)
10. [Договор — /agreement/](#10-договор--agreement)
    - [CRC32-валидация ссылок](#crc32-валидация-ссылок)
    - [Процесс подписания](#процесс-подписания)
    - [AES-GCM шифрование localStorage](#aes-gcm-шифрование-localstorage)
11. [TandemSign — /security/libs/tandemsign.js](#11-tandemsign--securitylibstandemsignjs)
12. [Staff Tools — /staff/tools/](#12-staff-tools--stafftools)
13. [Admin — /admin/](#13-admin--admin)
14. [Публичные утилиты](#14-публичные-утилиты)
    - [AdBlock-детектор](#adblock-детектор)
15. [Специальные системные страницы](#15-специальные-системные-страницы)
16. [CSS-переменные и дизайн-система](#16-css-переменные-и-дизайн-система)
17. [Советы по разработке](#17-советы-по-разработке)
18. [Как добавить новый проект в портфолио](#18-как-добавить-новый-проект-в-портфолио)
19. [Как сгенерировать ссылку на договор](#19-как-сгенерировать-ссылку-на-договор)

---

## 1. Обзор проекта

**Tandem Sites** — студия по разработке премиальных лендингов на чистом HTML/CSS/JS. Сайт является одновременно:

-   **Витриной студии** (главная страница с описанием услуг и ценами)
-   **Интерактивным портфолио** (Viewer — просмотрщик демо-проектов в iframe)
-   **Юридическим инструментом** (страница договора с криптографической подписью)

**Ключевая философия:** никаких фреймворков и сборщиков — весь код на ванильном HTML/CSS/JS. Это одновременно производственный принцип и маркетинговое утверждение (показываем клиентам, что работаем именно так).

---

## 2. Стек и принципы разработки

| Категория    | Решение                                                         |
| ------------ | --------------------------------------------------------------- |
| Языки        | HTML5, CSS3, ES2020+ (vanilla JS)                               |
| Фреймворки   | **Нет** — намеренно                                             |
| Сборщик      | **Нет** — файлы статические, деплоятся as-is                    |
| Шрифты       | Google Fonts (Syne, Inter, Raleway, Exo 2)                      |
| Хостинг      | GitHub Pages                                                    |
| SW-стратегия | NO-CACHE passthrough                                            |
| Хранилище    | `localStorage` (настройки Viewer, зашифрованные данные подписи) |
| Криптография | Web Crypto API (`SHA-256`, `AES-GCM`, `PBKDF2`, WebAuthn)       |

**Правила:**

-   Не добавлять зависимости без явной необходимости
-   Поддерживать работу без JS там, где это разумно (SEO-страницы)
-   Всегда проверять работу в Chrome/Firefox/Safari на мобиле
-   `maximum-scale=1, user-scalable=no` — только для интерактивных «приложений» (Viewer, агреемент); на обычных лендингах не ломать доступность

---

## 3. Структура репозитория

```
tandem-sites.ru/
│
├── index.htm               ← Главная страница (5 слайдов)
├── index.app.js            ← JS главной страницы (слайдер + эффекты)
├── index-ui.css            ← CSS главной страницы
├── sw.js                   ← Service Worker
├── manifest.json           ← PWA-манифест
├── status.json             ← Флаг {"isActive": true/false}
├── CNAME                   ← GitHub Pages: tandem-sites.ru
├── CXNAME                  ← (резерв/алиас домена)
├── 404.htm                 ← Кастомная 404-страница
├── 404.md                  ← Маршрут 404 для GitHub Pages (permalink: /404.htm)
│
├── index_media/            ← Медиа главной страницы (cat.gif и т.п.)
│
├── viewer/                 ← Портфолио-вьювер (см. раздел 7)
│   ├── index.html          ← Основной вьювер (с тулбаром)
│   ├── projects.db.json    ← БД проектов (плоский JSON-массив)
│   ├── advices.md          ← Советы по разработке (см. раздел 17)
│   ├── app/
│   │   ├── code/           ← JS-модули вьювера
│   │   └── styles/         ← CSS вьювера
│   ├── home/               ← Домашний экран вьювера (id: 0)
│   ├── no-toolbox-viewer/  ← Fullscreen-вьювер (без панели)
│   ├── p/                  ← Шорт-линки на проекты
│   ├── sandbox-escape-error/ ← Экран ошибки прямого доступа к works
│   └── works/              ← Демо-проекты (изолированы SW)
│
├── agreement/              ← Страница договора оферты
│   ├── index.html
│   ├── scripts.js          ← Логика подписания (CRC32, WebAuthn, AES-GCM)
│   └── styles.css
│
├── security/
│   └── libs/
│       └── tandemsign.js   ← Криптобиблиотека (SHA-256 цепочка подписи)
│
├── staff/
│   └── tools/              ← Внутренние инструменты (только для сотрудников)
│       ├── index.html      ← Заглушка с проверкой sessionStorage
│       └── open/           ← Генератор/валидатор договорных ссылок
│           ├── index.html
│           ├── scripts.js
│           └── style.css
│
├── admin/
│   └── index.html          ← Редирект на внешнюю панель управления
│
├── ads/
│   └── bait.js             ← Bait-файл для AdBlock-детектора
│
└── public-tests/
    └── adblock-checker/    ← Публичная утилита UADBDetector
        ├── index.html
        └── uadbdetector.js
```

---

## 4. Хостинг и деплой

Сайт хостится на **GitHub Pages** со статическим контентом.

-   Домен привязан через файл `CNAME` (`tandem-sites.ru`)
-   Деплой — автоматически при пуше в `main` (или настроенную ветку)
-   **Бэкенда нет** — весь функционал реализован на клиенте
-   HTTPS обязателен; `http-to-https.js` редиректит HTTP → HTTPS на всех страницах вьювера (кроме `localhost` и параметра `?force-unsafe-http=true`)

**404-маршрутизация:** файл `404.md` содержит только `permalink: /404.htm` — это GitHub Pages-хак, который заставляет отдавать кастомную страницу `404.htm` при любом несуществующем URL.

---

## 5. Главная страница — index.htm

Точка входа сайта. Вся логика находится в `index.app.js`, стили — в `index-ui.css`.

### Full-page слайдер

Реализован **без библиотек** (без fullPage.js и аналогов). 5 слайдов:

| #   | id    | Название     | Контент                             |
| --- | ----- | ------------ | ----------------------------------- |
| 1   | `#s1` | Hero         | Заголовок, CTA-кнопки, статистика   |
| 2   | `#s2` | Capabilities | 6 карточек возможностей             |
| 3   | `#s3` | Services     | Карусель прайс-карточек (3 позиции) |
| 4   | `#s4` | Portfolio    | Превью портфолио, CTA → `/viewer`   |
| 5   | `#s5` | Contact      | Telegram, контакты, футер           |

**Принцип работы слайдера (`index.app.js`):**

```js
// Все слайды позиционированы через top: N*100dvh (или vh как fallback)
// Переключение — CSS transform на #fp-wrap:
wrap.style.transform = `translateY(${-cur * 100}${slideUnit})`;
// Анимация контента: translateY ±60px + opacity 0→1
// Parallax bg-слоёв: 0.6× от скорости слайда
```

**Навигация:**

-   **Колесо мыши** — накапливает `deltaY` (порог 55px), переключает слайд
-   **Клавиатура** — `ArrowDown/Up`, `PageDown/Up`, `Home`, `End`
-   **Touch** — свайп вертикальный >42px (горизонтальный свайп в зоне карусели #s3 — карусели)
-   **Точки (dots)** — клик по боковым индикаторам `#dots`

**Защита от множественных переходов:** флаг `busy` — пока `busy === true`, новый `goTo()` игнорируется. Длительность анимации 820 мс.

**Контроль скролла Slide 3:** карточки услуг на мобиле переключаются горизонтальным свайпом внутри `.svc-carousel-wrap`, вертикальный свайп в этой же зоне всё равно переключает слайд.

### Анимации и Canvas-эффекты

#### Нейро-сетка (Slide 1) — `#neural-canvas`

Реализована на 2D Canvas в `index.app.js`:

-   **Jittered grid** инициализации: canvas делится на ячейки (1 частица на ячейку) — исключает "проплешины"
-   Количество частиц: `max(30, min(320, area/REF*200))`, где `REF = 1440×900`
-   **Физика:** медленный органический дрейф (синусоидальное ускорение), гравитация к курсору (`GRAV_R = 200px`)
-   **Toroidal wrap** — частицы "выходят" с одного края и появляются с другого
-   **Линии-соединения:** если расстояние между частицами < 95px
-   **Маска «факел»** — `radialGradient` с `globalCompositeOperation: destination-in`, радиус 220px от курсора. Эффект: сетка видна только вокруг курсора
-   **Хвост курсора** — кольцевой буфер 22 точки (TRAIL_LEN), время жизни 200мс, `clickRipples` при клике

#### Canvas S4 — линзадисторшн сетки

На Slide 4 (`#s4`) нарисована интерактивная сетка на Canvas с эффектом линзы:

-   Позиция линзы (`gridX`, `gridY`) lerp-интерполируется к позиции курсора (коэфф. 0.03)
-   При переходе на слайд 4 — моментальный снап: `gridX = mx; gridY = my` (без "проплыва")
-   Флаг `window._fpSliding = true` во время анимации слайда — останавливает RAF-циклы эффектов

#### CSS-анимации главной

-   `.hero-blob-*` — цветные градиентные пятна с `filter: blur`, реагируют на курсор (`blobPx`, `blobPy`)
-   `.s3-cat` — котик пробегает по Slide 3 при первом посещении (`cat-run` CSS-анимация)
-   `.s5-wave-*` — три SVG-волны внизу Slide 5 с разными скоростями/направлениями
-   `#scroll-hint` — подсказка "Прокрутите вниз" на Slide 1; скрывается при уходе

#### Кастомный курсор

-   Только на `pointer: fine` устройствах (десктоп)
-   `#cursor-dot` — маленькая фиолетовая точка
-   TrailCanvas поверх документа — хвост из точек с fade-out
-   `clickScale` — "пунч" (увеличение + быстрый возврат) при клике
-   Детекция телепорта: если пауза >50мс + прыжок >100px → сброс хвоста

### SEO и мета-разметка

Полная SEO-разметка на всех публичных страницах:

-   `<title>`, `<meta name="description">`, `<meta name="keywords">`
-   Open Graph (Facebook, VK, Telegram, WhatsApp)
-   Twitter/X Card
-   **JSON-LD** (Schema.org): `Organization` + `WebSite` + `WebPage` — тройная граф-структура
-   `SearchAction` в JSON-LD указывает на `/viewer?q={search_term_string}`

### PWA

-   `manifest.json` — `display: standalone`, тема `#7c6ef5`, язык `ru`
-   SW регистрируется через `<script src="/sw.js">` неявно — регистрация происходит в `index.app.js`
-   Иконки: `/icon.png` (72–512px) и `/logo.png`

### Resource hints

На главной странице прописаны агрессивные подсказки браузеру:

```html
<!-- Критические ресурсы — начинают загружаться сразу при парсинге <head> -->
<link rel="preload" as="image" href="/icon.png" />
<link rel="preload" as="image" href="/logo.png" />
<link rel="preload" as="script" href="/viewer/app/code/modules/xfetcher.js" />
<link rel="preload" as="script" href="/index.app.js" />

<!-- Prefetch viewer — браузер качает в фоне ещё до клика по CTA "Смотреть портфолио" -->
<link rel="prefetch" href="/viewer/" />
<link rel="prefetch" as="style" href="/viewer/app/styles/default.app-base.css" />
<!-- ... все 6 CSS и 8 JS вьювера -->
```

Это означает: к моменту клика на CTA «Смотреть портфолио» браузер уже скачал почти весь вьювер.

---

## 6. Service Worker — sw.js

### Стратегия кеширования

**NO-CACHE passthrough** — SW не кеширует ничего. Все запросы всегда идут в сеть.

```
Install  → skipWaiting() — мгновенная активация
Activate → caches.keys().then(keys => keys.map(k => caches.delete(k))) — снос ВСЕХ кешей
           self.clients.claim() — немедленный контроль всех вкладок
Fetch    → fetch(request) напрямую; при ошибке → offline404()
```

Почему no-cache: статика на GitHub Pages раздаётся с нормальными HTTP-кешами браузера. SW добавлял бы только второй слой кеширования, усложняя инвалидацию. Выбрана максимальная простота.

### Sandbox guard для /viewer/works/\*

Это **главная нетривиальная функция** SW. При navigate-запросе к любому пути `/viewer/works/…`:

```
1. Перехватить запрос (request.mode === 'navigate')
2. Сделать fetch(request) в сеть
3. Получить HTML-ответ
4. Инжектировать в начало <head> охранный скрипт:
   <script>if(window.self===window.top)window.location.replace("/viewer/sandbox-escape-error/");</script>
5. Вернуть модифицированный Response
```

**Результат:** если пользователь откроет `tandem-sites.ru/viewer/works/example-astra/` **напрямую** — его немедленно перенаправит на страницу ошибки. Если страница открыта в `iframe` внутри вьювера — `window.self !== window.top`, скрипт ничего не делает.

**Зачем:** демо-проекты должны демонстрироваться только через фирменный вьювер с тулбаром. Прямой доступ разрушает контекст (нет навигации студии, нет логотипа, нет CTA).

> ⚠️ **Важно:** guard инжектируется только при `mode === 'navigate'` (переход по URL). Прямой запрос через `fetch()` или `XHR` не затрагивается.

### Офлайн-страница

При `fetch` failure + `mode === 'navigate'` SW возвращает встроенную HTML-страницу (хранится прямо в JS-строке). Дизайн совпадает с основным сайтом: тёмный фон `#08080f`, фирменный градиент, сетка.

---

## 7. Portfolio Viewer — /viewer/

Центральная фича сайта. SPA-оболочка с iframe, в котором показываются демо-сайты.

### Архитектура модулей

Все скрипты подключаются в `viewer/index.html` в строго определённом порядке:

```html
<!-- Порядок подключения критичен! -->
<script src="/viewer/app/code/modules/xfetcher.js"></script>
<!-- window.__dbReady = xfetch.json('projects.db.json') — сохраняем промис ДО загрузки модулей -->
<script>
    window.__dbReady = xfetch.json("projects.db.json");
</script>
```

Затем подключаются модули через `<link rel="stylesheet">` / `<script>` в конце `<body>`:

| Файл                        | Назначение                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `app.viewer.js`             | Глобальное состояние (`App`), DOM-ссылки, утилиты (`reloadFrame`, `calcPhoneScale`, `clearFramePhoneStyles`)                         |
| `app.viewer.loader.js`      | Прогрессбар: `startProgress()`, `finishProgress()`, обработчик `iframe.onload`                                                       |
| `app.viewer.preload.js`     | `SmartPreload` — тихая фоновая загрузка следующего сайта                                                                             |
| `app.viewer.mobile.js`      | Phone-режим: `PHONE_FORMATS`, `togglePhonePreview()`, `applyPhoneFormat()`, `initPhonePanels()`                                      |
| `app.toolbox.navigation.js` | `loadSite()`, `navigate()`, `selectSite()`, `syncUrl()`, `triggerInfoAnimation()`, дропдаун                                          |
| `app.toolbox.events.js`     | Клавиатура (←/→), ресайз-хендлер phone-режима, кастомные тултипы                                                                     |
| `app.toolbox.modal.js`      | Мобильная шторка (bottom-sheet): `openActionsModal()`, `closeActionsModal()`, `copyLink()`, swipe-to-close                           |
| `app.viewer.init.js`        | `init()` — точка запуска: ждёт `__dbReady`, строит дропдаун, восстанавливает состояние из `localStorage`, открывает начальный проект |

#### Объект `App` (app.viewer.js)

```js
const App = {
    state: {
        currentIndex: 0,          // текущий индекс в TANDEM_SITES
        currentProgress: 0,       // прогресс загрузки (0–100)
        progressTimer: null,      // интервал прогрессбара
        finishTimer1/2: null,     // таймеры скрытия лоадера
        isRealLoad: false,        // true когда ждём реальную iframe загрузку
        phonePrevWasActive: bool, // был ли phone-режим до перехода на "Главную"
        onFrameLoadCallback: fn,  // вызывается один раз после следующей загрузки
        currentFormatId: 'std',   // id текущего phone-формата
        copyTimer: null,          // таймер сброса состояния "скопировано"
    },
    UI: { /* все DOM-ссылки */ }
};
```

### База данных проектов

Файл `viewer/projects.db.json` — плоский JSON-массив, загружается через `xfetch.json()` при старте вьювера:

```json
[
    { "id": 0, "title": "Главная", "description": "...", "path": "home" },
    { "id": 1, "title": "Сайт юриста...", "description": "...", "path": "works/example-lawyer" },
    { "id": 2, "title": "ЧОО «Астра»", "description": "...", "path": "works/example-astra" },
    { "id": 3, "title": "JSTD AI", "description": "...", "path": "works/example-jstd" },
    { "id": 4, "title": "Флорист", "description": "...", "path": "works/example-florist" },
    { "id": 5, "title": "Дизайнер", "description": "...", "path": "works/example-designer" },
    { "id": 6, "title": "ArcVPN", "description": "...", "path": "works/example-vpn" },
    { "id": 7, "title": "Кондитер", "description": "...", "path": "works/example-cakes" },
    { "id": 8, "title": "PCraft", "description": "...", "path": "works/example-minipcbuilder" }
]
```

**Поля:**

-   `id` — уникальный числовой идентификатор. `id: 0` зарезервирован за "Главной" вьювера.
-   `title` — отображается в дропдауне и тулбаре
-   `description` — подзаголовок в тулбаре
-   `path` — относительный путь от `viewer/` **или** абсолютный URL (для внешних проектов)

> Для добавления нового проекта — см. раздел [18. Как добавить новый проект](#18-как-добавить-новый-проект-в-портфолио).

### Жизненный цикл загрузки сайта

```
loadSite(index)
  │
  ├── SmartPreload.cancel()         ← отменяем pending preload старого "следующего"
  ├── App.state.currentIndex = index
  ├── syncUrl(site.id)              ← обновляем URL (?project-id=N)
  ├── loader.classList.remove('hidden')
  ├── startProgress()               ← 0% → 88% интервалом 280мс (rem * 0.09 шаг)
  ├── triggerInfoAnimation(cb)      ← анимация смены заголовка в тулбаре
  ├── Обновление кнопок навигации
  ├── Управление phone-режимом (отключить на home, восстановить при возврате)
  ├── updateDropdownState(index)
  └── reloadFrame(site.path)
        │
        ├── frame.classList.add('loading')   ← визуально скрыть фрейм
        ├── frame.style.transitionDuration = '0ms'  ← instant hide без мигания
        └── rAF → rAF → frame.contentWindow.location.replace(src)
                          (fallback: frame.src = src при cross-origin ошибке)

iframe.onload (app.viewer.loader.js)
  │
  ├── isRealLoad → finishProgress()  ← 88% → 100% за 220мс → скрыть loader
  └── SmartPreload.scheduleNext(currentIndex)  ← через 900мс грузим следующий сайт
```

**Почему `location.replace()` вместо `src=`:**  
`src=` добавляет запись в историю iframe, что ломает кнопку «Назад» браузера. `location.replace()` заменяет текущую запись.

### SmartPreload

```
app/code/app.viewer.preload.js
```

Принцип: пока пользователь смотрит сайт N, скрытый `#preload-frame` уже загружает сайт N+1.

```
После iframe.onload основного фрейма:
  → setTimeout(900ms)
  → preloadFrame.src = TANDEM_SITES[currentIndex + 1].path
```

**Гарантии:**

-   Preload стартует только после полной загрузки основного фрейма (не конкурирует по сети)
-   При навигации до срабатывания таймера — `SmartPreload.cancel()` обнуляет таймер
-   Повторная загрузка одного пути пропускается (`_loadedPath === path`)
-   Последний проект в списке не preload-ится (некуда)

### Phone-режим

```
app/code/app.viewer.mobile.js
```

6 форматов устройств с реальными размерами:

| id        | Название    | Размер    | Примеры                    |
| --------- | ----------- | --------- | -------------------------- |
| `std`     | Стандарт    | 390 × 844 | iPhone 14/13/12/16e        |
| `compact` | Компакт     | 375 × 667 | iPhone SE, iPhone 8/7      |
| `pro`     | Pro         | 393 × 852 | iPhone 16/15/14 Pro        |
| `max`     | Plus / Max  | 428 × 926 | iPhone 14 Plus, 13 Pro Max |
| `tall`    | Tall        | 412 × 915 | Pixel 7/8, Nothing Phone   |
| `mid`     | Android Mid | 360 × 800 | Samsung Galaxy, Xiaomi     |

**Масштабирование iframe:**

```js
function calcPhoneScale() {
    const availH = window.innerHeight - getPanelH() - 48;
    const REF = 926; // самый высокий формат (Plus/Max)
    return Math.min(
        (window.screen.availHeight * 0.72) / REF, // стабильная база — физический экран
        (availH * 0.98) / REF, // страховочный потолок по вьюпорту
    );
}
```

Формула использует `screen.availHeight` (физический экран) как основу — это защита от нестабильного `innerHeight` при скрытии/показе мобильной адресной строки.

**Состояние сохраняется в `localStorage`:**

-   `app.viewer.mobileMode` — `"true"/"false"`
-   `app.viewer.format` — id формата (`"std"`, `"compact"`, etc.)

**Блокировка на главной:** при переходе к `id: 0` phone-режим принудительно отключается. При уходе с главной — восстанавливается через `phonePrevWasActive`.

**Автоотключение при ресайзе:** если `window.innerWidth < 900` — режим деактивируется.

**Боковые панели (pp-left, pp-right):** позиционируются по `calc(50% ± displayW/2 + 12px)`. Левая — список форматов, правая — список устройств текущего формата.

### URL-синхронизация и история браузера

```
Первый loadSite → history.replaceState  (не добавляет запись)
Последующие    → history.pushState     (кнопка «Назад» работает)

popstate (кнопка «Назад»/«Вперёд»):
  → читаем ?project-id из URL
  → loadSite(idx, skipSync=true)  ← skipSync чтобы не дублировать запись
```

**URL при id=0:** параметр `?project-id` удаляется (`url.searchParams.delete`).

### No-Toolbox Viewer

```
viewer/no-toolbox-viewer/index.html
```

Упрощённый вьювер без тулбара — только iframe на весь экран. Используется кнопкой «Открыть в новой вкладке» в тулбаре.

**Параметры запуска:**

-   `?render-mode=fullscreen&project-id=3` — загрузить проект по числовому ID
-   `?render-mode=fullscreen&project-name=example-astra` — по имени папки

**Защита:** если `render-mode !== 'fullscreen'` — немедленный редирект на основной вьювер `../?(сохраняя project-id)`.

**Безопасность `project-name`:** допускаются только символы `[a-zA-Z0-9_-]`:

```js
if (/^[a-zA-Z0-9_-]+$/.test(projectName)) loadFrame("../works/" + projectName);
```

Это предотвращает path traversal (`../../../etc/passwd`).

**Скрипты (порядок важен):**

```html
<script src="/viewer/app/code/modules/xfetcher.js"></script>
<script src="...no-toolbox-viewer/index.state.js"></script>
← URL-парметры + ранний редирект
<script src="...no-toolbox-viewer/index.loader.js"></script>
← showError(), loadFrame(), loadById()
<script src="...no-toolbox-viewer/index.init.js"></script>
← точка входа: выбор режима
```

### CSS-архитектура Viewer

`viewer/app/styles/default.css` — точка входа, импортирует все стилевые модули через `@import`:

| Файл                                | Содержание                                                         |
| ----------------------------------- | ------------------------------------------------------------------ |
| `default.app-base.css`              | Reset, CSS-переменные (полная дизайн-система), html/body           |
| `default.app-viewer.css`            | Тулбар (`#panel`), iframe, лоадер, прогрессбар, тултипы, дропдаун  |
| `default.app-viewer-mobile.css`     | Phone-режим: iframe-трансформ, боковые панели, форматы, устройства |
| `default.app-viewer-no-toolbox.css` | Стили no-toolbox вьювера и экранов ошибок                          |
| `default.app-modal-dialogs.css`     | Мобильная шторка-модал (bottom-sheet)                              |

---

## 8. Утилиты-модули

### xfetcher.js

```
viewer/app/code/modules/xfetcher.js
```

Умная обёртка над `fetch` с retry-логикой. Используется во вьювере и no-toolbox вьювере.

**API:**

```js
xfetch.request(url, options?)  → Promise<Response>
xfetch.json(url, options?)     → Promise<any>   // shorthand: request + .json()
```

**Опции (поверх стандартных fetch):**

| Опция     | Тип         | По умолчанию | Описание                     |
| --------- | ----------- | ------------ | ---------------------------- |
| `retries` | number      | 3            | Количество повторных попыток |
| `baseMs`  | number      | 300          | Базовая задержка (мс)        |
| `capMs`   | number      | 8000         | Максимальная задержка (мс)   |
| `signal`  | AbortSignal | —            | Для отмены запроса           |

**Классификация ошибок:**

-   **PERMANENT** (400, 401, 403, 404, 405, 406, 410, 422, 451) — retry не делается
-   **RETRYABLE** (408, 429, 500, 502, 503, 504) — retry с backoff
-   **AbortError** — никогда не retry
-   **TypeError** ("Failed to fetch", нет сети) — retry

**Задержка:** `min(capMs, baseMs * 2^(attempt-1)) ± 20% jitter`

Заголовок `Retry-After` от сервера уважается (cap 30 с).

### http-to-https.js

```
viewer/app/code/modules/http-to-https.js
```

Подключается первым скриптом на всех страницах вьювера, agreement, staff tools.

```js
if (location.protocol === "http:" && hostname !== "localhost") {
    // Исключение: ?force-unsafe-http=true (для локальной разработки без HTTPS)
    location.protocol = "https:";
}
```

---

## 9. Works — демо-проекты

Все демо располагаются в `viewer/works/`. Каждый — самодостаточный сайт (HTML + CSS + JS).

**Критически важно:** каждый work открывается только в iframe вьювера. SW инжектирует guard-скрипт, блокирующий прямой доступ (подробнее — в разделе [6. Service Worker](#sandbox-guard-для-viewerworks)).

### Текущие проекты

| ID  | Папка                   | Описание                 | Особенности                                                                                                             |
| --- | ----------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | `example-lawyer`        | Сайт юриста Владимира    | Строгий корпоративный дизайн                                                                                            |
| 2   | `example-astra`         | ЧОО «Астра»              | Кастомный курсор-прицел, красная тема, охранная тематика                                                                |
| 3   | `example-jstd`          | JSTD AI — JS-анализатор  | Мультиязычность (RU/EN), страница `/en/`, `/ru/`, `/download/` (с `meta[http-equiv=refresh]` на .zip), Canvas starfield |
| 4   | `example-florist`       | Флорист Анастасия        | Атмосферный флористический стиль                                                                                        |
| 5   | `example-designer`      | Дизайнер Евгений Демидов | Портфолио, Photoshop, брендинг, motion                                                                                  |
| 6   | `example-vpn`           | ArcVPN                   | Инлайн-CSS (всё в одном файле), синяя VPN-тематика                                                                      |
| 7   | `example-cakes`         | Кондитер Юлия            | Авторские торты, пастельная тема                                                                                        |
| 8   | `example-minipcbuilder` | PCraft                   | Светлая тема, конструктор ПК, раздельные CSS-файлы: `base.css`, `landing.css`, `layout.css`, `responsive.css`           |
| —   | `example-pcbuilder`     | PCraft (расширенный)     | Другая версия конструктора ПК                                                                                           |

### Рекомендации по разработке works

-   Не подключать `http-to-https.js` — SW уже обрабатывает HTTPS на уровне хоста
-   Не использовать абсолютные пути к ресурсам — сайт открывается с пути `/viewer/works/example-*/`
-   Шрифты — через Google Fonts (как на основном сайте)
-   Не добавлять robots-разрешения — works индексации не подлежат (SW guard блокирует прямой доступ, нет canonical)

---

## 10. Договор — /agreement/

Полноценная страница публичной оферты с юридически значимой цифровой подписью клиента.

**Публичный URL:** `https://tandem-sites.ru/agreement/`

### CRC32-валидация ссылок

Страница договора принимает URL-параметры:

-   `?agrid=XXXX` — уникальный идентификатор договора (генерируется в Staff Tools)
-   `?c=YYYYYYYY` — CRC32-контрольная сумма для валидации

```js
CRC_SALT = "~0_UNIQUE|";
expectedC = crc32(CRC_SALT + agrid);

if (!agrid || cParam !== expectedC) {
    // Скрыть секцию подписания — пользователь открыл страницу без корректной ссылки
    signArea.style.display = "none";
}
```

Это защищает от случайной/"холодной" подписи страницы без конкретного agrid. Ссылки для клиентов генерируются только через [Staff Tools](#12-staff-tools--stafftools).

### Процесс подписания

1. Пользователь открывает страницу по ссылке `?agrid=XXX&c=YYY`
2. `localStorage` проверяется на уже подписанный статус (ключ `agr_signed_v2_{agrid}`)
3. Если не подписано — показывается кнопка «Подписать»
4. При нажатии:
    - Опционально: WebAuthn (passkey) — `navigator.credentials.create()` для привязки к устройству
    - `TandemSign.buildSignData(agrid, {credId, cdHash})` — строит цепочку хешей
    - Результат шифруется (`lsSave`) и сохраняется в `localStorage`
5. Показывается блок с хешами и кнопкой скачивания `.tandemsign` файла
6. При повторном открытии — `lsLoad` расшифровывает и показывает `showSigned(data)`

### AES-GCM шифрование localStorage

Данные подписи хранятся **зашифрованными** в localStorage:

```
Ключ шифрования = PBKDF2(
    пароль = agrid + '\x00' + hostname,
    соль   = 'tandem-agr-v2',
    итерации = 120 000,
    алгоритм = SHA-256 → AES-GCM 256-bit
)
```

Формат хранения (v2):

```json
{
    "v": 2,
    "iv": "<base64 случайный 12-байтный IV>",
    "ct": "<base64 зашифрованный JSON>"
}
```

**Обратная совместимость:** записи v1 (незашифрованный JSON с полем `fullString`) читаются без расшифровки.

### Файл подписи (.tandemsign)

Клиент может скачать текстовый файл `tandem-{agrid}.tandemsign`. Формат определяется в `TandemSign.serialize()`. Файл содержит всю цепочку хешей для офлайн-верификации.

---

## 11. TandemSign — /security/libs/tandemsign.js

Криптографическая библиотека. Работает в браузере и в Node.js (UMD). Используется в `agreement/scripts.js` и `staff/tools/open/scripts.js`.

### Цепочка верификации

```
1. docHash  = SHA-256("Я СОГЛАСЕН С УСЛОВИЯМИ ДОГОВОРА | " + agrid)
2. envHash  = SHA-256(userAgent|platform|language|tz|resolution|colorDepth|cores|ram)
              (поля разделены null-байтом, порядок фиксирован — не менять!)
3. csInput  = agrid + "|" + docHash
              [+ "|" + credId    если есть WebAuthn]
              [+ "|" + cdHash    если есть WebAuthn]
              + "|" + envHash
4. checksum = SHA-256(csInput)
5. fullData = csInput + "|" + checksum
6. token    = SHA-256(fullData)   ← итоговый неизменяемый токен договора
```

**Env-hash** фиксирует параметры устройства: `navigator.userAgent`, `platform`, `language`, timezone, `screen.width × height`, `colorDepth`, `hardwareConcurrency`, `deviceMemory`. Это не криптографическая гарантия (клиентский JS), но создаёт доказательную цепочку.

**Обратная совместимость:** если старый файл подписи не содержит `envHash` — он пропускается при верификации.

### Публичное API TandemSign

```js
TandemSign.sha256hex(str)              → Promise<string>  — SHA-256 строки → hex
TandemSign.sha256buf(ab)               → Promise<string>  — SHA-256 ArrayBuffer → hex
TandemSign.hexToBytes(hex)             → Uint8Array
TandemSign.buildSignData(agrid, opts)  → Promise<object>  — строит полный объект signData
TandemSign.verify(signData)            → Promise<object>  — верифицирует объект
TandemSign.serialize(signData)         → string           — текстовый .tandemsign формат
TandemSign.parse(text)                 → object           — парсинг .tandemsign файла
```

---

## 12. Staff Tools — /staff/tools/

**Доступ только для сотрудников студии. `noindex, nofollow`.**

### Защита

```
/staff/tools/index.html  ←  проверяет sessionStorage.getItem("redir")
                             Если пусто → ошибка INVALID_SESSION
                             Если есть → window.location.href = redir
```

`_how_to_open.txt` в папке содержит инструкцию для сотрудников (как правильно открыть инструменты через sessionStorage).

### /staff/tools/open/ — основной инструмент

Три вкладки (tab-роли, `aria-selected`):

#### Вкладка «Генератор ссылок»

Генерирует уникальные ссылки на договор для конкретного клиента.

```
Вход:   произвольный идентификатор (имя клиента или номер заказа)
Выход:  agrid  = CRC32("~0_UNIQUE|" + input.trim())
        c      = CRC32("~0_UNIQUE|" + agrid)
        URL    = https://tandem-sites.ru/agreement/?agrid={agrid}&c={c}
```

История генераций сохраняется в `localStorage` (ключ `ts_gen_history`, max 12 записей).

#### Вкладка «Валидатор подписи»

Принимает `.tandemsign` файл или строку → вызывает `TandemSign.verify()` → показывает результат верификации.

#### Вкладка «Окружение»

Показывает текущий `envHash` браузера + кол-во сохранённых подписей в `localStorage`.

---

## 13. Admin — /admin/

```html
<!-- /admin/index.html -->
<script>
    window.location.href = "https://dosx.su/xxx";
</script>
```

Простой редирект на внешнюю панель управления на домене `dosx.su`. При изменении адреса панели — обновить этот редирект.

---

## 14. Публичные утилиты

### AdBlock-детектор

```
/public-tests/adblock-checker/
```

Утилита **UADBDetector** — публичная страница для тестирования методов обнаружения AdBlock. Не является частью воронки продаж.

**Принцип работы:**

1. При загрузке страницы тег `<script src="/ads/bait.js">` загружается в DOM
2. `/ads/bait.js` — намеренно размещён по URL-паттерну из фильтр-листов EasyList и uBlock Origin
3. Если файл успешно загружен → `window.__adbd_bait === true` → AdBlock **не** активен
4. Если загрузка заблокирована → `window.__adbd_bait === undefined` → AdBlock активен

**Файл `/ads/bait.js`:**

```js
/* Не удалять и не переименовывать без обновления opts.baitUrl в detect() */
window.__adbd_bait = true;
```

---

## 15. Специальные системные страницы

| URL                             | Файл         | Назначение                                                     |
| ------------------------------- | ------------ | -------------------------------------------------------------- |
| `/viewer/sandbox-escape-error/` | `index.html` | Показывается при прямом открытии works-проекта (вместо iframe) |
| `/viewer/p/`                    | `index.html` | Шорт-линки на проекты по query-параметрам                      |
| `/viewer/home/`                 | `index.html` | Домашний экран вьювера (нулевой проект, приветствие)           |
| `/404.htm`                      | `404.htm`    | Кастомная 404-страница GitHub Pages                            |
| Офлайн                          | встроен в SW | HTML-заглушка при отсутствии сети (хранится в `sw.js`)         |

---

## 16. CSS-переменные и дизайн-система

Все фирменные константы определены в `viewer/app/styles/default.app-base.css`:

```css
:root {
    /* Панель вьювера */
    --panel-h: 64px;
    --panel-bg: rgba(10, 10, 18, 0.82);

    /* Акцент — фирменный фиолетовый */
    --accent: #7c6ef5;
    --accent2: #5b4fd4;
    --accent-dim: rgba(124, 110, 245, 0.12);
    --accent-bdr: rgba(124, 110, 245, 0.22);

    /* Фоны (от тёмного к светлее) */
    --bg: #0b0b14;
    --bg2: #0f0f1a;
    --surface: #13131e;
    --surface2: #1a1a28;
    --surface3: #20202f;

    /* Границы */
    --border: rgba(255, 255, 255, 0.06);
    --border2: rgba(255, 255, 255, 0.1);
    --border3: rgba(255, 255, 255, 0.15);

    /* Текст */
    --text: rgba(255, 255, 255, 0.88);
    --muted: rgba(255, 255, 255, 0.42);
    --muted2: rgba(255, 255, 255, 0.22);

    /* Семантика */
    --ok: #34d399; /* зелёный — успех */
    --ok-bg: rgba(52, 211, 153, 0.07);

    /* Переходы */
    --transition: 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    --radius: 10px;
}
```

**Шрифты:**

-   **Syne** (400–800) — заголовки, акцентные элементы
-   **Inter** (300–700) — основной текст UI
-   **Raleway** (200–300) — декоративные тонкие надписи
-   **Exo 2** (700–800) — большие заголовки главной
-   **JetBrains Mono** — только в Staff Tools (технические данные)
-   **Space Grotesk / Space Mono** — только в example-jstd

---

## 17. Советы по разработке

Из `viewer/advices.md` — актуальные замечания по кроссбраузерным проблемам:

### CSS

**Горизонтальный скролл на iOS Safari** — всегда дублировать на `html` и `body`:

```css
html,
body {
    overflow-x: hidden;
}
```

**`100vh` на мобиле** — включает адресную строку браузера. Использовать:

```css
height: 100dvh; /* Chrome 108+, Safari 15.4+ */
/* fallback: */
height: 100vh;
```

В `index.app.js` это решено через: `const slideUnit = CSS.supports('height', '100dvh') ? 'dvh' : 'vh';`

**`gap` в Flexbox** — не работает в iOS < 14.5. Использовать `margin` как фоллбэк в проектах с широкой аудиторией.

**`position: fixed` на iOS** — прыгает при скролле в формах. Предпочитать `sticky` или избегать fixed в областях бокового скролла.

### JS

**Порядок подключения скриптов** — если скрипты используют глобальные объекты друг друга, порядок `<script>` критичен. В вьювере порядок документирован комментарием `<!-- ENGINE (порядок важен!) -->`.

**ResizeObserver vs resize event** — `ResizeObserver` стреляет уже после layout, `resize` + `rAF` могут не успевать. В трейл-канвасе главной используется RO.

**`will-change: transform`** — применяется только на время анимирующейся пары слайдов, после снимается. Это высвобождает GPU-слой.

**`window._fpSliding`** — флаг для координации между независимыми RAF-циклами на главной. Пока слайдер анимируется — Canvas-эффекты других слайдов делают паузу.

### Viewport meta

```html
<!-- Интерактивные "приложения" (viewer, agreement): -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

<!-- Обычные лендинги (не ломать доступность): -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

---

## 18. Как добавить новый проект в портфолио

1. Создать папку `viewer/works/example-{name}/`
2. Разместить в ней готовый сайт (index.html + ресурсы)
    - Убедиться, что все пути к ресурсам **относительные**
    - Не подключать `http-to-https.js` и другие модули студии
3. Добавить запись в `viewer/projects.db.json`:
    ```json
    {
        "id": 9,
        "title": "Название проекта",
        "description": "Краткое описание для тулбара",
        "path": "works/example-{name}"
    }
    ```
    `id` должен быть уникальным и последовательным (следующий по порядку после последнего).
4. Готово — после пуша в `main` новый проект появится в дропдауне вьювера.

> **Проверить:** открыть вьювер → найти новый проект → убедиться, что прямой URL `tandem-sites.ru/viewer/works/example-{name}/` редиректит на `/viewer/sandbox-escape-error/` (SW guard работает).

---

## 19. Как сгенерировать ссылку на договор

1. Открыть `/staff/tools/` правильным способом (см. `_how_to_open.txt`)
2. В Staff Tools выбрать вкладку **«Генератор ссылок»**
3. Ввести имя клиента или номер заказа
4. Нажать «Сгенерировать» → скопировать ссылку
5. Отправить ссылку клиенту (например, в Telegram)
6. Клиент открывает ссылку → читает договор → нажимает «Подписать»
7. После подписания клиент скачивает файл `tandem-{agrid}.tandemsign`
8. Для верификации: вкладка **«Валидатор подписи»** → загрузить `.tandemsign` файл

---

_Документация составлена на основании анализа исходного кода. При изменении архитектуры — обновлять соответствующие разделы._
