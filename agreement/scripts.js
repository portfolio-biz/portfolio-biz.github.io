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
    const params = new URLSearchParams(window.location.search);
    const agrid = (params.get('agrid') || '').trim();

    /* Если agrid пустой — кнопку подписания не показываем */
    if (!agrid) {
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

    /* ─── Кнопка подписания ─── */
    const btn = document.getElementById('sign-btn');
    if (!btn) return;

    /* Поддержка WebAuthn: нужен HTTPS или localhost */
    const webAuthnOk =
        window.PublicKeyCredential !== undefined &&
        window.isSecureContext &&
        typeof navigator.credentials !== 'undefined';

    btn.addEventListener('click', async function () {
        btn.disabled = true;
        btn.classList.add('signing');

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

        } catch (e) {
            btn.disabled = false;
            btn.classList.remove('signing');
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
