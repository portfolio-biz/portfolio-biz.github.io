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
   AGRID + SHA-256 SIGN  |  localStorage persistence
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

    const LS_KEY = 'agr_signed_' + agrid;

    const enc = new TextEncoder();

    /* Вычисляет SHA-256 строки, возвращает hex */
    async function sha256hex(str) {
        const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
        return Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /* Формат итоговой строки подписи */
    function buildSignValue(agrid, hash) {
        return agrid + '|' + hash;
    }

    /* ─── Показать блок подписанного состояния ─── */
    function showSigned(signValue, timestamp) {
        document.getElementById('sign-area').style.display = 'none';
        const result = document.getElementById('sign-result');
        result.classList.add('visible');
        document.getElementById('sign-hash-value').textContent = signValue;
        document.getElementById('sign-timestamp').textContent =
            'Подписано: ' + timestamp;
    }

    /* ─── Форматировать timestamp ─── */
    function fmtNow() {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        return pad(now.getDate()) + '.' + pad(now.getMonth() + 1) + '.' + now.getFullYear() +
            ' в ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    }

    /* ─── Проверяем localStorage — может, уже подписано ─── */
    try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
            const { signValue, timestamp } = JSON.parse(saved);
            if (signValue && timestamp) {
                showSigned(signValue, timestamp);
                initCopyBtn(signValue);
                return;
            }
        }
    } catch (_) { /* localStorage недоступен — продолжаем */ }

    /* ─── Инициализация кнопки копирования ─── */
    function initCopyBtn(signValue) {
        const copyBtn = document.getElementById('sign-copy-btn');
        const copyIcon = document.getElementById('copy-icon');
        const checkIcon = document.getElementById('check-icon');
        if (!copyBtn) return;

        copyBtn.addEventListener('click', function () {
            navigator.clipboard.writeText(signValue).then(function () {
                copyIcon.style.display = 'none';
                checkIcon.style.display = '';
                copyBtn.classList.add('copied');
                setTimeout(function () {
                    copyIcon.style.display = '';
                    checkIcon.style.display = 'none';
                    copyBtn.classList.remove('copied');
                }, 2000);
            }).catch(function () {
                /* fallback: выделить текст */
                const el = document.getElementById('sign-hash-value');
                const range = document.createRange();
                range.selectNodeContents(el);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            });
        });
    }

    /* ─── Кнопка подписания ─── */
    const btn = document.getElementById('sign-btn');
    if (!btn) return;

    btn.addEventListener('click', async function () {
        btn.disabled = true;
        btn.style.opacity = '0.55';

        try {
            /* sha256("Я СОГЛАСЕН С УСЛОВИЯМИ ДОГОВОРА | " + agrid) */
            const hash = await sha256hex('Я СОГЛАСЕН С УСЛОВИЯМИ ДОГОВОРА | ' + agrid);
            const signValue = buildSignValue(agrid, hash);
            const timestamp = fmtNow();

            /* Сохраняем в localStorage */
            try {
                localStorage.setItem(LS_KEY, JSON.stringify({ signValue, timestamp }));
            } catch (_) { /* игнорируем если недоступен */ }

            showSigned(signValue, timestamp);
            initCopyBtn(signValue);

        } catch (e) {
            btn.disabled = false;
            btn.style.opacity = '1';
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
