/* ═══════════════════════════════════════════════════════════════════════
   NEURAL NETWORK BACKGROUND
   – Количество точек: динамически по площади экрана
   – Resize: дебаунс + масштабирование позиций + пересчёт точек
═══════════════════════════════════════════════════════════════════════ */
(function () {
    const canvas = document.getElementById('neural-bg');
    const ctx = canvas.getContext('2d');

    const CONNECT_DIST = 160;
    const SPEED_MUL = 2.2;
    const NODE_RADIUS = 2.0;
    const NODE_OPACITY = 0.20;
    const LINE_OPACITY = 0.20;

    let W, H, nodes;
    let resizeTimer = null;

    /* Целевое количество узлов: ~1 на 14 000 px², от 24 до 110
       — гарантирует ~4-5 связей на узел на любом экране              */
    function targetCount() {
        return Math.max(24, Math.min(110, Math.floor((W * H) / 14000)));
    }

    function resize() {
        /* offsetWidth/Height читают реальный CSS-размер — точнее window.innerWidth
           при наличии полосы прокрутки или нестандартном viewport             */
        W = canvas.width = canvas.offsetWidth || window.innerWidth;
        H = canvas.height = canvas.offsetHeight || window.innerHeight;
    }

    function mkNode() {
        const angle = Math.random() * Math.PI * 2;
        const spd = (0.4 + Math.random() * 0.8) * SPEED_MUL;
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            r: NODE_RADIUS * (0.7 + Math.random() * 0.6),
        };
    }

    function init() {
        resize();
        nodes = Array.from({ length: targetCount() }, mkNode);
    }

    function tick() {
        ctx.clearRect(0, 0, W, H);

        /* move */
        for (const n of nodes) {
            n.x += n.vx;
            n.y += n.vy;
            if (n.x < 0) { n.x = 0; n.vx *= -1; }
            if (n.x > W) { n.x = W; n.vx *= -1; }
            if (n.y < 0) { n.y = 0; n.vy *= -1; }
            if (n.y > H) { n.y = H; n.vy *= -1; }
        }

        /* edges */
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < CONNECT_DIST) {
                    const alpha = LINE_OPACITY * (1 - d / CONNECT_DIST);
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = `rgba(0,0,0,${alpha.toFixed(3)})`;
                    ctx.lineWidth = 0.7;
                    ctx.stroke();
                }
            }
        }

        /* nodes */
        for (const n of nodes) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,0,0,${NODE_OPACITY})`;
            ctx.fill();
        }

        requestAnimationFrame(tick);
    }

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const prevW = W, prevH = H;
            resize();
            /* масштабируем позиции существующих точек */
            const sx = W / prevW, sy = H / prevH;
            nodes.forEach(n => {
                n.x = Math.min(n.x * sx, W);
                n.y = Math.min(n.y * sy, H);
            });
            /* добавляем / убираем точки под новый размер */
            const target = targetCount();
            while (nodes.length < target) nodes.push(mkNode());
            if (nodes.length > target) nodes.length = target;
        }, 150);
    });

    init();
    tick();
})();

/* ═══════════════════════════════════════════════════════════════════════
   DATE
═══════════════════════════════════════════════════════════════════════ */
(function () {
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const d = new Date('2026-03-04');
    document.getElementById('agr-date-text').textContent =
        d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ' г.';
})();

/* ═══════════════════════════════════════════════════════════════════════
   AGRID + WEBAUTHN SIGN  |  localStorage persistence
═══════════════════════════════════════════════════════════════════════ */
(async function () {
    /* ─── CRC32 для валидации параметра ?c= ──────────────────────────────
       Соль: "~0_UNIQUE|"  +  agrid.
       Ссылки генерируются в /staff/generator/ .                           */
    function crc32(str) {
        var table = crc32._t;
        if (!table) {
            table = new Uint32Array(256);
            for (var i = 0; i < 256; i++) {
                var c = i;
                for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                table[i] = c;
            }
            crc32._t = table;
        }
        var crc = 0xFFFFFFFF;
        for (var j = 0; j < str.length; j++) {
            var code = str.charCodeAt(j);
            /* UTF-16 → UTF-8 байты */
            if (code < 0x80) {
                crc = (crc >>> 8) ^ table[(crc ^ code) & 0xFF];
            } else if (code < 0x800) {
                crc = (crc >>> 8) ^ table[(crc ^ (0xC0 | (code >> 6))) & 0xFF];
                crc = (crc >>> 8) ^ table[(crc ^ (0x80 | (code & 0x3F))) & 0xFF];
            } else {
                crc = (crc >>> 8) ^ table[(crc ^ (0xE0 | (code >> 12))) & 0xFF];
                crc = (crc >>> 8) ^ table[(crc ^ (0x80 | ((code >> 6) & 0x3F))) & 0xFF];
                crc = (crc >>> 8) ^ table[(crc ^ (0x80 | (code & 0x3F))) & 0xFF];
            }
        }
        return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
    }

    const CRC_SALT = '~0_UNIQUE|';

    const params = new URLSearchParams(window.location.search);
    const agrid = (params.get('agrid') || '').trim();
    const cParam = (params.get('c') || '').trim().toLowerCase();

    /* Если agrid пустой или контрольная сумма ?c= неверна — скрываем кнопку */
    const expectedC = agrid ? crc32(CRC_SALT + agrid) : '';
    if (!agrid || cParam !== expectedC) {
        const signArea = document.getElementById('sign-area');
        if (signArea) signArea.style.display = 'none';
        return;
    }

    const LS_KEY = 'agr_signed_v2_' + agrid;
    const enc = new TextEncoder();

    /* Криптографические примитивы — делегируем в TandemSign */
    const sha256hex  = TandemSign.sha256hex;
    const sha256buf  = TandemSign.sha256buf;
    const hexToBytes = TandemSign.hexToBytes;

    /* ─── AES-GCM шифрование localStorage ───
       Ключ = PBKDF2(agrid | hostname, 120 000 итераций) —
       уникален для каждого пользователя + домена.         */
    async function deriveCryptoKey() {
        const raw = await crypto.subtle.importKey(
            'raw',
            enc.encode(agrid + '\x00' + window.location.hostname),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: enc.encode('tandem-agr-v2'), iterations: 120000, hash: 'SHA-256' },
            raw,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async function lsSave(key, data, ck) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            ck,
            enc.encode(JSON.stringify(data))
        );
        localStorage.setItem(key, JSON.stringify({
            v:  2,
            iv: btoa(String.fromCharCode(...iv)),
            ct: btoa(String.fromCharCode(...new Uint8Array(ct)))
        }));
    }

    async function lsLoad(key, ck) {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const p = JSON.parse(raw);
        /* Обратная совместимость: если запись старого формата (v1, незашифрована) */
        if (p.fullString) return p;
        if (p.v !== 2 || !p.iv || !p.ct) return null;
        try {
            const iv = Uint8Array.from(atob(p.iv), c => c.charCodeAt(0));
            const ct = Uint8Array.from(atob(p.ct), c => c.charCodeAt(0));
            const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, ck, ct);
            return JSON.parse(new TextDecoder().decode(pt));
        } catch (_) { return null; }
    }

    /* Текущее время */
    function fmtNow() {
        const now = new Date();
        const p = n => String(n).padStart(2, '0');
        return p(now.getDate()) + '.' + p(now.getMonth() + 1) + '.' + now.getFullYear() +
            ' в ' + p(now.getHours()) + ':' + p(now.getMinutes()) + ':' + p(now.getSeconds());
    }

    /* ─── Генерация .tandemsign файла ─── */
    function downloadSign(data) {
        /* data.agrid есть в новых записях; для старых берём из замыкания */
        var fullData = Object.assign({ agrid: agrid }, data);
        var content  = TandemSign.serialize(fullData);
        var blob     = new Blob([content], { type: 'text/plain;charset=utf-8' });
        var url      = URL.createObjectURL(blob);
        var a        = document.createElement('a');
        a.href       = url;
        a.download   = 'tandem-' + (data.agrid || agrid) + '.tandemsign';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    }

    /* ─── Показать подписанное состояние ─── */
    function showSigned(data) {
        const { docHash, credId, cdHash, checksum, fullString, finalHash, algoName, timestamp } = data;

        document.getElementById('sign-area').style.display = 'none';

        const result = document.getElementById('sign-result');
        result.classList.add('visible');

        document.getElementById('sign-hash-value').textContent      = docHash;
        document.getElementById('sign-checksum-value').textContent   = checksum;
        /* Показываем единый токен — SHA-256 от полной строки */
        document.getElementById('sign-full-value').textContent       = finalHash || fullString;
        document.getElementById('sign-timestamp').textContent        = 'Подписано: ' + timestamp;
        document.getElementById('sign-algo-label').textContent       = algoName;

        if (credId) {
            var credEl = document.getElementById('sign-cred-value');
            credEl.dataset.value = credId;
            credEl.textContent   = '●'.repeat(credId.length);
            document.getElementById('sdr-credid').style.display = '';
        }
        if (cdHash) {
            document.getElementById('sign-cd-value').textContent = cdHash;
            document.getElementById('sdr-cdh').style.display     = '';
        }

        var dlBtn = document.getElementById('sign-download-btn');
        if (dlBtn) {
            dlBtn.addEventListener('click', function () { downloadSign(data); });
        }
    }

    /* ─── Кнопка «глаз»: анимация «расшифровки» через рандомные символы ─── */
    function initEyeToggles() {
        var RAND = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=$@#%&';

        function rndChar() {
            return RAND[Math.floor(Math.random() * RAND.length)];
        }

        /* Анимация раскрытия: каждый символ проходит несколько рандомных итераций,
           затем фиксируется. Символы открываются волной слева направо.         */
        function animateReveal(el) {
            var real = el.dataset.value;
            if (!real) return;

            /* Отменяем предыдущую анимацию если есть */
            if (el._sdrTimer) { clearInterval(el._sdrTimer); el._sdrTimer = null; }

            var len     = real.length;
            var CYCLES  = 6;           /* сколько рандомных итераций на символ */
            var FRAME   = 22;          /* мс на фрейм */
            /* stagger: чем больше строка — тем быстрее наполнение,
               но не быстрее 0.5 фрейма и не медленнее 2 */
            var stagger = Math.min(2, Math.max(0.5, 20 / len));

            var frame = 0;
            var arr   = new Array(len).fill('');

            el._sdrTimer = setInterval(function () {
                frame++;
                var done = true;

                for (var i = 0; i < len; i++) {
                    var local = frame - Math.floor(i * stagger);
                    if (local < 0) {
                        arr[i] = '●';
                        done = false;
                    } else if (local < CYCLES) {
                        arr[i] = rndChar();
                        done = false;
                    } else {
                        arr[i] = real[i];
                    }
                }

                el.textContent = arr.join('');

                if (done) {
                    clearInterval(el._sdrTimer);
                    el._sdrTimer = null;
                    el.textContent = real; /* гарантируем итог */
                }
            }, FRAME);
        }

        /* Скрыть обратно — реверсная волна справа налево */
        function animateHide(el) {
            if (el._sdrTimer) { clearInterval(el._sdrTimer); el._sdrTimer = null; }
            var real = el.dataset.value;
            if (!real) { el.textContent = ''; return; }

            var len     = real.length;
            var CYCLES  = 4;
            var FRAME   = 18;
            var stagger = Math.min(2, Math.max(0.5, 20 / len));
            var frame   = 0;
            var arr     = real.split('');

            el._sdrTimer = setInterval(function () {
                frame++;
                var done = true;

                for (var i = len - 1; i >= 0; i--) {
                    /* волна справа налево */
                    var local = frame - Math.floor((len - 1 - i) * stagger);
                    if (local < 0) {
                        arr[i] = real[i];
                        done = false;
                    } else if (local < CYCLES) {
                        arr[i] = rndChar();
                        done = false;
                    } else {
                        arr[i] = '●';
                    }
                }

                el.textContent = arr.join('');

                if (done) {
                    clearInterval(el._sdrTimer);
                    el._sdrTimer = null;
                    el.textContent = '●'.repeat(len);
                }
            }, FRAME);
        }

        document.querySelectorAll('.sdr-eye-btn').forEach(function (btn) {
            var target = document.getElementById(btn.dataset.for);
            if (!target) return;

            btn.addEventListener('click', function () {
                var revealing = !btn.classList.contains('is-revealed');
                btn.classList.toggle('is-revealed', revealing);
                btn.title = revealing ? 'Скрыть' : 'Показать';

                if (revealing) {
                    target.classList.add('sdr-revealed');
                    animateReveal(target);
                } else {
                    target.classList.remove('sdr-revealed');
                    animateHide(target);
                }
            });
        });
    }

    /* ─── Копирование: одна функция на все кнопки ─── */
    function initCopyBtns() {
        document.querySelectorAll('.sdr-copy-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var el   = document.getElementById(btn.dataset.target);
                /* Если есть data-value (секретное поле) — копируем реальное значение, не точки */
                var text = el ? (el.dataset.value || el.textContent) : '';
                if (!text) return;

                navigator.clipboard.writeText(text).then(function () {
                    btn.classList.add('copied');
                    setTimeout(function () { btn.classList.remove('copied'); }, 2000);
                }).catch(function () {
                    /* fallback: выделить текст */
                    if (el) {
                        var range = document.createRange();
                        range.selectNodeContents(el);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                });
            });
        });
    }

    /* ─── Проверяем localStorage ─── */
    const cryptoKey = await deriveCryptoKey();
    try {
        const saved = await lsLoad(LS_KEY, cryptoKey);
        if (saved && saved.fullString && saved.timestamp) {
            /* Совместимость: у старых записей нет finalHash — вычисляем */
            if (!saved.finalHash) {
                saved.finalHash = await sha256hex(saved.fullString);
            }
            showSigned(saved);
            initCopyBtns();
            initEyeToggles();
            return;
        }
    } catch (_) { /* localStorage недоступен — продолжаем */ }

    /* ─── Проверка окружения браузера ───
       Запрещаем подписание из:
         • WebView-оболочек мессенджеров (Телеграм, Telegram, Instagram, VK ...)
         • Системных WebView (приложения Android/iOS)
         • Автоматизированных оболочек (Electron, headless)
         • Режима инкогнито / приватный режим браузера         */
    async function detectUnsafeBrowser() {
        var ua = navigator.userAgent;

        /* 1. Telegram WebView */
        if (window.TelegramWebview || window.__telegram__ || window.Telegram) {
            return { reason: 'telegram', msg: 'Подписание недоступно во встроенном браузере Telegram. Скопируйте ссылку и откройте в Safari, Chrome или Firefox.' };
        }
        /* 2. React Native WebView */
        if (window.ReactNativeWebView) {
            return { reason: 'webview', msg: 'Подписание недоступно в встроенном браузере приложения. Откройте страницу в обычном браузере.' };
        }
        /* 3. Android system WebView (наличие признака "wv" в UA) */
        if (/\bwv\b/.test(ua) && /Android/.test(ua)) {
            return { reason: 'webview', msg: 'Подписание недоступно в встроенном браузере приложения. Откройте страницу в Chrome для Android.' };
        }
        /* 4. iOS WKWebView (есть AppleWebKit, но нет Safari/ в UA и нет CriOS/FxiOS) */
        if (/iPhone|iPad|iPod/.test(ua) && /AppleWebKit/.test(ua) && !/Safari\//.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua)) {
            return { reason: 'webview', msg: 'Подписание недоступно в встроенном браузере приложения. Откройте страницу в Safari.' };
        }
        /* 5. Facebook in-app browser */
        if (/FBAN|FBAV|FBDSP/.test(ua)) {
            return { reason: 'inapp', msg: 'Подписание недоступно во встроенном браузере Facebook. Откройте ссылку в обычном браузере.' };
        }
        /* 6. Instagram, TikTok, Twitter/X, Snapchat in-app */
        if (/Instagram|musical_ly|TikTok|Twitter\/|Snapchat/.test(ua)) {
            return { reason: 'inapp', msg: 'Подписание недоступно во встроенном браузере приложения. Скопируйте ссылку и откройте в Safari, Chrome или Firefox.' };
        }
        /* 7. WeChat, LINE, KakaoTalk, VK in-app */
        if (/MicroMessenger|Line\/|KAKAOTALK|VK\/|VKApp/.test(ua)) {
            return { reason: 'inapp', msg: 'Подписание недоступно во встроенном браузере приложения. Скопируйте ссылку и откройте в Safari, Chrome или Firefox.' };
        }
        /* 8. Electron / NW.js десктопное WebView */
        if (window.process && window.process.type) {
            return { reason: 'webview', msg: 'Подписание недоступно в автоматизированном окружении. Используйте обычный браузер.' };
        }
        /* 9. navigator.webdriver — headless-автоматизация */
        if (navigator.webdriver) {
            return { reason: 'automation', msg: 'Подписание недоступно в автоматизированном окружении.' };
        }

        /* 10. Режим инкогнито / приватный режим
             Chrome/Edge incognito: Storage API возвращает квоту ~120 MB
             Firefox private: Cache API блокирует открытие раздела
             Safari private: localStorage.setItem бросает QuotaExceededError       */
        try {
            if (navigator.storage && navigator.storage.estimate) {
                var est = await navigator.storage.estimate();
                /* Нормальный браузер получает от нескольких ГБ.
                   Chrome incognito ограничен примерно 120 MB.               */
                if (typeof est.quota === 'number' && est.quota > 0 && est.quota < 150 * 1024 * 1024) {
                    return { reason: 'incognito', msg: 'Подписание недоступно в режиме инкогнито. Пожалуйста, откройте страницу в обычном окне браузера.' };
                }
            }
        } catch (_) {}
        /* Firefox private mode: caches.open() бросает SecurityError */
        try {
            await caches.open('__ts_probe__');
            await caches.delete('__ts_probe__');
        } catch (e) {
            if (e.name === 'SecurityError') {
                return { reason: 'incognito', msg: 'Подписание недоступно в приватном режиме Firefox. Пожалуйста, откройте страницу в обычном окне браузера.' };
            }
        }
        /* Safari private mode: localStorage.setItem бросает QuotaExceededError */
        try {
            var _k = '__ts_priv__';
            localStorage.setItem(_k, '1');
            localStorage.removeItem(_k);
        } catch (_) {
            return { reason: 'incognito', msg: 'Подписание недоступно в приватном режиме Safari. Пожалуйста, откройте страницу в обычном окне браузера.' };
        }

        return null; /* всё ок */
    }

    /* Показываем предупреждение вместо кнопки подписания */
    function showBrowserWarn(msg) {
        var area = document.getElementById('sign-area');
        if (!area) return;
        var el = document.createElement('div');
        el.id = 'sign-browser-warn';
        var style = [
            'display:flex', 'align-items:flex-start', 'gap:12px',
            'padding:14px 18px', 'border-radius:14px',
            'border:1px solid rgba(210,50,50,.30)',
            'background:rgba(210,50,50,.07)',
            'color:#b83535',
            'font-size:13.5px', 'line-height:1.6', 'font-weight:500',
        ].join(';');
        el.style.cssText = style;
        el.innerHTML =
            '<svg style="flex-shrink:0;margin-top:1px" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'
            + '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>'
            + '<line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
            + '</svg>'
            + '<span>' + msg + '</span>';
        /* Скрываем кнопку и пояснительный текст, вставляем предупреждение */
        area.innerHTML = '';
        area.appendChild(el);
    }

    /* Информационная плашка (не блокирует) — янтарного цвета, кнопка остаётся */
    function showBrowserNotice(msg) {
        var area = document.getElementById('sign-area');
        if (!area) return;
        var el = document.createElement('div');
        el.id = 'sign-browser-notice';
        var style = [
            'display:flex', 'align-items:flex-start', 'gap:12px',
            'padding:12px 16px', 'border-radius:12px',
            'border:1px solid rgba(180,130,0,.30)',
            'background:rgba(200,150,0,.07)',
            'color:#8a6400',
            'font-size:13px', 'line-height:1.55', 'font-weight:500',
            'margin-bottom:14px',
        ].join(';');
        el.style.cssText = style;
        el.innerHTML =
            '<svg style="flex-shrink:0;margin-top:1px" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'
            + '<circle cx="12" cy="12" r="10"/>'
            + '<line x1="12" y1="8" x2="12" y2="12"/>'
            + '<line x1="12" y1="16" x2="12.01" y2="16"/>'
            + '</svg>'
            + '<span>' + msg + '</span>';
        /* Вставляем перед первым элементом знаковой зоны */
        area.insertBefore(el, area.firstChild);
    }

    /* ─── Проверка фактической поддержки нужных технологий ──────────────────
       В отличие от detectUnsafeBrowser() (окружение), здесь проверяем именно
       возможности конкретного браузера/платформы:
         • SubtleCrypto API — ядро всей цепочки подписи   (fatal)
         • Secure Context (HTTPS / localhost)              (fatal)
         • WebAuthn + платформенный аутентификатор         (non-fatal: warn)

       Кейс: Adblock Browser (Android), некоторые кастомные браузеры —
       WebAuthn API присутствует, но ОС или сам браузер блокирует вызов.
       isUserVerifyingPlatformAuthenticatorAvailable() возвращает false.     */
    async function checkBrowserCapabilities() {
        /* 1. Без HTTPS/localhost SubtleCrypto полностью недоступен */
        if (!window.isSecureContext) {
            return {
                fatal: true,
                msg: 'Страница открыта без защищённого соединения (HTTPS). Подписание договора невозможно. Убедитесь, что адрес начинается с https://.',
            };
        }
        /* 2. SubtleCrypto — всё SHA-256, PBKDF2, AES-GCM */
        if (!window.crypto || !window.crypto.subtle) {
            return {
                fatal: true,
                msg: 'Ваш браузер не поддерживает необходимые криптографические функции. Обновите браузер или используйте актуальную версию Chrome, Safari или Firefox.',
            };
        }
        /* 3. WebAuthn: API есть, но поддерживает ли платформа биометрию?
              Вызываем isUserVerifyingPlatformAuthenticatorAvailable() —
              это единственный надёжный способ узнать это без реального вызова. */
        if (window.PublicKeyCredential && navigator.credentials) {
            try {
                var avail = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                if (!avail) {
                    return {
                        fatal: true,
                        msg: 'Ваше устройство или браузер не поддерживает биометрическое подтверждение (Touch ID, Face ID, PIN). Для подписания договора используйте Chrome, Edge или Safari на устройстве с настроенной разблокировкой экрана.',
                    };
                }
            } catch (_) {
                /* API есть, но вызов упал — тоже считаем недоступным */
                return {
                    fatal: true,
                    msg: 'Не удалось проверить поддержку WebAuthn на этом устройстве. Откройте страницу в Chrome, Edge или Safari.',
                };
            }
        } else {
            /* WebAuthn API отсутствует полностью */
            return {
                fatal: true,
                msg: 'Ваш браузер не поддерживает WebAuthn. Для подписания договора используйте актуальную версию Chrome, Edge или Safari.',
            };
        }
        return null; /* всё в порядке */
    }

    /* ─── Кнопка подписания ─── */
    const btn = document.getElementById('sign-btn');
    if (!btn) return;

    /* Проверяем браузер: если небезопасное окружение (WebView, инкогнито и т.п.) */
    var _browserWarn = await detectUnsafeBrowser();
    if (_browserWarn) {
        showBrowserWarn(_browserWarn.msg);
        return;
    }

    /* Проверяем фактическую поддержку технологий (SubtleCrypto, WebAuthn-платформа) */
    var _capResult = await checkBrowserCapabilities();
    if (_capResult) {
        /* Любой результат теперь фатальный — блокируем */
        showBrowserWarn(_capResult.msg);
        return;
    }

    /* WebAuthn гарантированно доступен — checkBrowserCapabilities вернул null */
    const webAuthnOk =
        window.PublicKeyCredential !== undefined &&
        window.isSecureContext &&
        typeof navigator.credentials !== 'undefined';

    /* ─── Кастомный курсор: прячем на время диалога подписания ───
       Не трогаем has-custom-cursor класс (это ненадёжно в Edge/Chrome —
       браузер не успевает применить cursor:auto ко всем дочерним элементам
       до открытия нативного диалога). Вместо этого инжектируем отдельный
       <style> тег с cursor:auto!important — он перекрывает cursor:none
       мгновенно и синхронно для всего дерева.                               */
    var _cursorPauseEl = null;
    function pauseCursor() {
        /* Активен ли кастомный курсор? */
        if (!document.getElementById('custom-cursor')) return;
        /* Скрываем изображение курсора */
        document.getElementById('custom-cursor').style.opacity = '0';
        /* Инжектируем override: системный курсор появляется немедленно */
        if (!_cursorPauseEl) {
            _cursorPauseEl = document.createElement('style');
            _cursorPauseEl.id = '__ts-cursor-pause';
            document.head.appendChild(_cursorPauseEl);
        }
        _cursorPauseEl.textContent =
            /* Специфичность должна быть не ниже чем у правила cursor:none:
               html.has-custom-cursor * { (0,1,1) } vs html.has-custom-cursor * { (0,1,1) }
               При одинаковой специфичности побеждает последнее по порядку в <head>. */
            'html.has-custom-cursor,html.has-custom-cursor *{cursor:auto!important}';
        /* Синхронный layout flush — Edge применяет стиль до открытия диалога */
        void document.documentElement.offsetHeight;
    }
    function resumeCursor() {
        /* Снимаем override — cursor:none из CSS-файла вступает в силу снова */
        if (_cursorPauseEl) _cursorPauseEl.textContent = '';
        var cur = document.getElementById('custom-cursor');
        /* Явно восстанавливаем видимость: mousemove-обработчик IIFE ставит
           opacity=1 только при inside===false, но после диалога inside
           может остаться true (Firefox, Edge) */
        if (cur) cur.style.opacity = '1';
    }

    btn.addEventListener('click', async function () {
        btn.disabled = true;
        btn.classList.add('signing');
        pauseCursor();
        /* 150 мс без заморозки потока — даём браузеру гарантированно
           отрисовать системный курсор до открытия WebAuthn-диалога.
           rAF здесь недостаточно: Edge/Chrome показывает диалог быстрее,
           чем завершается paint.                                             */
        await new Promise(function (resolve) { setTimeout(resolve, 150); });

        try {
            /* 1. Хеш документа — он же challenge для WebAuthn */
            const docHash = await sha256hex(
                'Я СОГЛАСЕН С УСЛОВИЯМИ ДОГОВОРА | ' + agrid
            );

            let credId   = null;
            let cdHash   = null;
            let algoName = 'SHA-256';

            /* 2. Попытка WebAuthn */
            if (webAuthnOk) {
                try {
                    const challengeBytes = hexToBytes(docHash);

                    /* user.id — первые 16 байт хеша agrid */
                    const userIdBytes = hexToBytes(await sha256hex(agrid)).slice(0, 16);

                    const credential = await navigator.credentials.create({
                        publicKey: {
                            challenge: challengeBytes,
                            rp: {
                                name: 'Tandem Sites',
                                id: window.location.hostname
                            },
                            user: {
                                id: userIdBytes,
                                name: 'agr_' + agrid,
                                displayName: 'Договор ' + agrid
                            },
                            pubKeyCredParams: [
                                { type: 'public-key', alg: -7   }, /* ES256 – ECDSA P-256 */
                                { type: 'public-key', alg: -257 }, /* RS256 – RSA-PKCS    */
                            ],
                            authenticatorSelection: {
                                userVerification: 'required',
                                residentKey:      'discouraged',
                            },
                            attestation: 'none',
                            timeout: 60000,
                        }
                    });

                    credId = credential.id; /* base64url */

                    /* SHA-256 clientDataJSON — привязка к origin + challenge */
                    cdHash = await sha256buf(credential.response.clientDataJSON);

                    /* Название алгоритма */
                    if (credential.response.getPublicKeyAlgorithm) {
                        const alg = credential.response.getPublicKeyAlgorithm();
                        if      (alg === -7)   algoName = 'ES256 · ECDSA P-256';
                        else if (alg === -257) algoName = 'RS256 · RSA-PKCS';
                        else                  algoName  = 'WebAuthn alg ' + alg;
                    } else {
                        algoName = 'WebAuthn · ES256';
                    }

                } catch (waErr) {
                    if (waErr.name === 'NotAllowedError') {
                        /* Пользователь отменил диалог — прерываем */
                        btn.disabled = false;
                        btn.classList.remove('signing');
                        resumeCursor();
                        return;
                    }
                    /* Другая ошибка — деградируем до SHA-256 */
                    console.warn('WebAuthn недоступен, используем SHA-256:', waErr);
                }
            }

            const timestamp = fmtNow();

            /* 3-5. Строим полную цепочку подписи через библиотеку TandemSign.
               Внутри вычисляются:
                 envHash  = SHA-256(userAgent + платформа + язык + tz + экран)
                 csInput  = agrid|docHash[|credId][|cdHash]|envHash
                 checksum = SHA-256(csInput)
                 fullString = csInput|checksum
                 finalHash  = SHA-256(fullString)                                */
            const signData = await TandemSign.buildSignData(agrid, {
                credId, cdHash, algoName, timestamp,
            });

            /* 5. Сохраняем (AES-GCM) */
            try { await lsSave(LS_KEY, signData, cryptoKey); } catch (_) { }

            showSigned(signData);
            initCopyBtns();
            initEyeToggles();
            resumeCursor();

        } catch (e) {
            btn.disabled = false;
            btn.classList.remove('signing');
            resumeCursor();
            console.error('Ошибка при подписании:', e);
        }
    });
})();

/* ═══════════════════════════════════════════════════════════════════════
   PAGE REVEAL  —  keyframes, без мигания
═══════════════════════════════════════════════════════════════════════ */
(function () {

    function prep(el, cls, delay) {
        el.classList.add(cls);
        if (delay > 0) el.style.setProperty('--rv-d', delay + 'ms');
    }
    function go(el) { el && el.classList.add('rv-go'); }
    function inVP(el) {
        var r = el.getBoundingClientRect();
        return r.top < window.innerHeight * 0.98 && r.bottom > 0;
    }

    /* ─ ХЕДЕР ─── */
    var hdrMap = [
        ['agr-logo', 'rv-p-logo', 0],
        ['agr-doc-label', 'rv-p-lbl', 120],
        ['agr-title', 'rv-p', 230],
        ['agr-subtitle', 'rv-p', 340],
    ];
    hdrMap.forEach(function (h) {
        var el = document.getElementById(h[0]);
        if (el) prep(el, h[1], h[2]);
    });
    requestAnimationFrame(function () {
        hdrMap.forEach(function (h) { go(document.getElementById(h[0])); });
    });

    if (!window.IntersectionObserver) {
        document.querySelectorAll('.rv-p,.rv-p-logo,.rv-p-lbl')
            .forEach(function (e) {
                e.classList.remove('rv-p', 'rv-p-logo', 'rv-p-lbl');
            });
        return;
    }

    /* ─ PREP секций ─── */
    var groups = [];

    var partiesTitle = document.querySelector('#page-wrap > .agr-section-title');
    if (partiesTitle) {
        var cards = Array.from(document.querySelectorAll('.agr-parties .agr-party-card'));
        prep(partiesTitle, 'rv-p', 0);
        cards.forEach(function (c, i) { prep(c, 'rv-p', i * 100); });
        groups.push({ trigger: partiesTitle, els: [partiesTitle].concat(cards) });
    }

    document.querySelectorAll('.agr-section').forEach(function (sec) {
        var els = [];
        var st = sec.querySelector(':scope > .agr-section-title');
        if (st) { prep(st, 'rv-p', 0); els.push(st); }
        sec.querySelectorAll(':scope .agr-clause, :scope .agr-warning').forEach(function (c, i) {
            prep(c, 'rv-p', 60 + i * 55);
            els.push(c);
        });
        if (els.length) groups.push({ trigger: sec, els: els });
    });

    ['.agr-pre-sign', '.agr-studio-quote', '#agr-footer'].forEach(function (sel) {
        var el = document.querySelector(sel);
        if (el) { prep(el, 'rv-p', 0); groups.push({ trigger: el, els: [el] }); }
    });

    /* ─ IO ─── */
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            io.unobserve(e.target);
            for (var i = 0; i < groups.length; i++) {
                if (groups[i].trigger === e.target) {
                    groups[i].els.forEach(go);
                    break;
                }
            }
        });
    }, { threshold: 0.04 });

    var cascade = 500;
    var STEP = 60;

    groups.forEach(function (g) {
        if (inVP(g.trigger)) {
            (function (grp, d) {
                setTimeout(function () { grp.els.forEach(go); }, d);
            }(g, cascade));
            cascade += STEP;
        } else {
            io.observe(g.trigger);
        }
    });

    /* ─ bfcache: при возврате кнопкой «назад» JS не перезапускается,
       но pageshow с persisted=true стреляет — сбрасываем и переигрываем */

    window.addEventListener('pageshow', function (e) {
        if (!e.persisted) return;

        /* элементы, которые пользователь уже видел — у них есть .rv-go */
        var seenEls = Array.from(document.querySelectorAll('.rv-go'));

        /* элементы ниже фолда, до которых не доскроллили — просто делаем видимыми */
        document.querySelectorAll('.rv-p:not(.rv-go),.rv-p-logo:not(.rv-go),.rv-p-lbl:not(.rv-go)')
            .forEach(function (el) { el.classList.remove('rv-p', 'rv-p-logo', 'rv-p-lbl'); });

        /* убираем .rv-go, форсируем reflow, добавляем обратно — анимация перезапускается */
        seenEls.forEach(function (el) { el.classList.remove('rv-go'); });
        document.body.offsetHeight; /* reflow */
        requestAnimationFrame(function () {
            seenEls.forEach(function (el) { el.classList.add('rv-go'); });
        });
    });

})();

/* ═══════════════════════════════════════════════════════════════════════
   CUSTOM CURSOR  —  только для мыши, нулевой лаг через transform + rAF
═══════════════════════════════════════════════════════════════════════ */
(function () {
    /* только для устройств с точным указателем (мышь/тачпад) */
    if (!window.matchMedia('(pointer: fine)').matches) return;

    /* создаём элемент курсора */
    var cur = document.createElement('img');
    cur.id          = 'custom-cursor';
    cur.src         = '/agreement/cursor.png';
    cur.alt         = '';
    cur.draggable   = false;
    cur.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cur);

    /* скрываем системный курсор */
    document.documentElement.classList.add('has-custom-cursor');

    var cx = -300, cy = -300;
    var rafId = null;
    var inside = false;

    /* render — выполняется один раз за кадр */
    function render() {
        rafId = null;
        cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
    }

    function schedule() {
        if (!rafId) rafId = requestAnimationFrame(render);
    }

    /* mousemove — passive для максимальной скорости */
    document.addEventListener('mousemove', function (e) {
        cx = e.clientX;
        cy = e.clientY;
        if (!inside) {
            inside = true;
            cur.style.opacity = '1';
        }
        schedule();
    }, { passive: true });

    /* курсор покинул окно — прячем */
    document.addEventListener('mouseleave', function () {
        inside = false;
        cur.style.opacity = '0';
    });

})();
