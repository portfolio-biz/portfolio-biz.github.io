(function () {
    'use strict';

    /* ══════════════════════════════════════════════════════
       CRC32  (UTF-8, та же реализация что в scripts.js)
    ══════════════════════════════════════════════════════ */
    function crc32(str) {
        var t = crc32._t;
        if (!t) {
            t = new Uint32Array(256);
            for (var i = 0; i < 256; i++) {
                var c = i;
                for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                t[i] = c;
            }
            crc32._t = t;
        }
        var crc = 0xFFFFFFFF;
        for (var j = 0; j < str.length; j++) {
            var n = str.charCodeAt(j);
            if (n < 0x80) {
                crc = (crc >>> 8) ^ t[(crc ^ n) & 0xFF];
            } else if (n < 0x800) {
                crc = (crc >>> 8) ^ t[(crc ^ (0xC0 | (n >> 6))) & 0xFF];
                crc = (crc >>> 8) ^ t[(crc ^ (0x80 | (n & 0x3F))) & 0xFF];
            } else {
                crc = (crc >>> 8) ^ t[(crc ^ (0xE0 | (n >> 12))) & 0xFF];
                crc = (crc >>> 8) ^ t[(crc ^ (0x80 | ((n >> 6) & 0x3F))) & 0xFF];
                crc = (crc >>> 8) ^ t[(crc ^ (0x80 | (n & 0x3F))) & 0xFF];
            }
        }
        return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
    }

    var CRC_SALT = '~0_UNIQUE|';
    var BASE_URL = window.location.origin + '/agreement/';
    var HIST_KEY = 'ts_gen_history';
    var MAX_HIST = 12;

    /* ══════════════════════════════════════════════════════
       TAB SWITCHING
    ══════════════════════════════════════════════════════ */
    var tabGen = document.getElementById('tab-gen');
    var tabChk = document.getElementById('tab-chk');
    var tabEnv = document.getElementById('tab-env');
    var panelGen = document.getElementById('panel-gen');
    var panelChk = document.getElementById('panel-chk');
    var panelEnv = document.getElementById('panel-env');

    var TABS = [
        { btn: tabGen, panel: panelGen },
        { btn: tabChk, panel: panelChk },
        { btn: tabEnv, panel: panelEnv },
    ];

    function switchTab(active) {
        TABS.forEach(function (t) {
            var on = t.btn === active.btn;
            t.btn.classList.toggle('active', on);
            t.btn.setAttribute('aria-selected', on ? 'true' : 'false');
            t.panel.classList.toggle('active', on);
        });
        if (active.btn === tabEnv) refreshEnvCounts();
    }

    tabGen.addEventListener('click', function () { switchTab(TABS[0]); });
    tabChk.addEventListener('click', function () { switchTab(TABS[1]); });
    tabEnv.addEventListener('click', function () { switchTab(TABS[2]); });

    /* ══════════════════════════════════════════════════════
       GENERATOR
    ══════════════════════════════════════════════════════ */
    var genInput = document.getElementById('gen-input');
    var genBtn = document.getElementById('gen-btn');
    var genResultSec = document.getElementById('gen-result-section');
    var outAgrid = document.getElementById('out-agrid');
    var outCrc = document.getElementById('out-crc');
    var urlText = document.getElementById('url-text');
    var copyBtn = document.getElementById('copy-btn');
    var copyIcon = document.getElementById('copy-icon');
    var copyLabel = document.getElementById('copy-label');
    var histListEl = document.getElementById('hist-list');

    function buildUrl(agrid) {
        return BASE_URL + '?agrid=' + encodeURIComponent(agrid) + '&c=' + crc32(CRC_SALT + agrid);
    }

    function generate() {
        var agrid = genInput.value.trim();
        if (!agrid) { genInput.focus(); return; }
        var c = crc32(CRC_SALT + agrid);
        var url = BASE_URL + '?agrid=' + encodeURIComponent(agrid) + '&c=' + c;
        outAgrid.textContent = agrid;
        outCrc.textContent = c;
        urlText.value = url;
        genResultSec.style.display = '';
        setCopyIdle();
        saveHistory(agrid, c);
        renderHistory();
    }

    /* copy */
    var _copyTimer = null;
    function setCopyIdle() {
        clearTimeout(_copyTimer);
        copyIcon.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>';
        copyLabel.textContent = 'Копировать';
        copyBtn.classList.remove('done');
    }
    function setCopyDone() {
        copyIcon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
        copyLabel.textContent = 'Скопировано';
        copyBtn.classList.add('done');
        _copyTimer = setTimeout(setCopyIdle, 2400);
    }

    copyBtn.addEventListener('click', function () {
        var url = urlText.value; if (!url) return;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(setCopyDone).catch(function () { _legacyCopy(); });
        } else { _legacyCopy(); }
    });
    function _legacyCopy() {
        urlText.select();
        try { document.execCommand('copy'); setCopyDone(); } catch (_) { }
    }

    genBtn.addEventListener('click', generate);
    genInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') generate(); });
    genInput.addEventListener('input', function () { genResultSec.style.display = 'none'; });

    /* ── history ── */
    function loadHistory() {
        try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (_) { return []; }
    }
    function saveHistory(agrid, c) {
        var h = loadHistory().filter(function (x) { return x.agrid !== agrid; });
        h.unshift({ agrid: agrid, c: c, ts: Date.now() });
        if (h.length > MAX_HIST) h.length = MAX_HIST;
        try { localStorage.setItem(HIST_KEY, JSON.stringify(h)); } catch (_) { }
    }
    function deleteHistoryItem(agrid) {
        var h = loadHistory().filter(function (x) { return x.agrid !== agrid; });
        try { localStorage.setItem(HIST_KEY, JSON.stringify(h)); } catch (_) { }
        renderHistory();
    }
    function clearHistory() {
        try { localStorage.removeItem(HIST_KEY); } catch (_) { }
        renderHistory();
    }
    function fmtDate(ts) {
        if (!ts) return '';
        var d = new Date(ts);
        var pad = function (n) { return n < 10 ? '0' + n : n; };
        return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear()
            + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function renderHistory() {
        var hist = loadHistory();
        var clearBtn = document.getElementById('hist-clear-btn');
        if (!hist.length) {
            histListEl.innerHTML = '<div class="hist-empty">История пуста</div>';
            if (clearBtn) clearBtn.style.visibility = 'hidden';
            return;
        }
        if (clearBtn) clearBtn.style.visibility = '';
        histListEl.innerHTML = '';
        hist.forEach(function (h) {
            var url = buildUrl(h.agrid);
            var item = document.createElement('div');
            item.className = 'hist-item';

            /* Основная кликабельная область */
            var main = document.createElement('div');
            main.className = 'hist-main';
            main.title = 'Загрузить в форму';
            main.innerHTML =
                '<div class="hist-agrid">' + esc(h.agrid) + '</div>' +
                '<div class="hist-date">' + (h.ts ? fmtDate(h.ts) : 'дата неизвестна') + '</div>';
            main.addEventListener('click', function () {
                genInput.value = h.agrid;
                generate();
                genResultSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });

            /* Кнопки действий */
            var actions = document.createElement('div');
            actions.className = 'hist-actions';

            /* Копировать ссылку */
            var copyAct = document.createElement('button');
            copyAct.className = 'hist-act';
            copyAct.title = 'Скопировать ссылку';
            copyAct.type = 'button';
            copyAct.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
            copyAct.addEventListener('click', function (e) {
                e.stopPropagation();
                var done = function () {
                    copyAct.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
                    copyAct.style.color = 'var(--ok)';
                    setTimeout(function () {
                        copyAct.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
                        copyAct.style.color = '';
                    }, 2000);
                };
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(url).then(done).catch(function () {
                        var t = document.createElement('textarea');
                        t.value = url; document.body.appendChild(t); t.select();
                        try { document.execCommand('copy'); done(); } catch (_) { }
                        document.body.removeChild(t);
                    });
                }
            });

            /* Удалить */
            var delAct = document.createElement('button');
            delAct.className = 'hist-act del';
            delAct.title = 'Удалить из истории';
            delAct.type = 'button';
            delAct.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>';
            delAct.addEventListener('click', function (e) {
                e.stopPropagation();
                deleteHistoryItem(h.agrid);
            });

            actions.appendChild(copyAct);
            actions.appendChild(delAct);
            item.appendChild(main);
            item.appendChild(actions);
            histListEl.appendChild(item);
        });
    }

    document.getElementById('hist-clear-btn').addEventListener('click', function () {
        if (confirm('Очистить всю историю?')) clearHistory();
    });

    renderHistory();

    /* ══════════════════════════════════════════════════════
       CHECKER
    ══════════════════════════════════════════════════════ */
    var ICO_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    var ICO_FAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    var ICO_PEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>';

    function escVal(s) { return esc(s || ''); }

    function renderMeta(sig) {
        var items = [
            ['Agreement ID', sig.agreementId],
            ['Signed At', sig.signedAt],
            ['Algorithm', sig.algorithm],
            ['Issuer', sig.issuer],
            ['Format', sig.version],
        ];
        if (sig.envHash) items.push(['Env-Hash', sig.envHash.slice(0, 16) + '…']);
        return items.map(function (item) {
            return '<div class="rc-meta-item">'
                + '<div class="rc-meta-key">' + item[0] + '</div>'
                + '<div class="rc-meta-val selectable">' + escVal(item[1]) + '</div>'
                + '</div>';
        }).join('');
    }

    function chkRow(state, label, desc, expected, computed) {
        var ico = state === 'ok' ? ICO_OK : state === 'fail' ? ICO_FAIL : ICO_PEND;
        var hashes = computed !== undefined ? (
            '<div class="chk-hash-row">'
            + '<div class="chk-hash"><span class="chk-hash-key">Ожидается</span><span class="chk-hash-val selectable">' + escVal(expected) + '</span></div>'
            + '<div class="chk-hash"><span class="chk-hash-key">Получено</span><span class="chk-hash-val computed selectable">' + escVal(computed) + '</span></div>'
            + '</div>'
        ) : '';
        return '<div class="chk ' + state + '">'
            + '<div class="chk-indicator">' + ico + '</div>'
            + '<div class="chk-body">'
            + '<div class="chk-label">' + label + '</div>'
            + '<div class="chk-desc">' + desc + '</div>'
            + hashes
            + '</div></div>';
    }

    async function renderResult(sig) {
        var result = document.getElementById('chk-result');
        var rcHead = document.getElementById('rc-head');
        var rcIcon = document.getElementById('rc-icon');
        var rcTitle = document.getElementById('rc-title');
        var rcSub = document.getElementById('rc-sub');
        var rcMeta = document.getElementById('rc-meta');
        var rcChecks = document.getElementById('rc-checks');
        var resetBtn = document.getElementById('reset-btn');

        rcMeta.innerHTML = renderMeta(sig);

        /* placeholder пока считаем */
        rcHead.className = 'rc-head';
        rcIcon.innerHTML = ICO_PEND;
        rcTitle.textContent = 'Верификация…';
        rcSub.textContent = 'Вычисляем хеши, подождите';
        rcChecks.innerHTML =
            chkRow('pending', 'Формат полей', 'Проверяем…')
            + chkRow('pending', 'Хеш документа', 'Проверяем…')
            + chkRow('pending', 'Контрольная сумма', 'Проверяем…')
            + chkRow('pending', 'Верификационный токен', 'Проверяем…');
        result.classList.add('visible');
        resetBtn.style.display = 'flex';

        var checks = await TandemSign.verify(sig);
        var fmtIssues = TandemSign.validateFormat(sig);
        var fmtOk = fmtIssues.length === 0;
        var allOk = checks.every(function (c) { return c.ok; }) && fmtOk;

        rcHead.className = 'rc-head ' + (allOk ? 'ok' : 'fail');
        rcIcon.innerHTML = allOk ? ICO_OK : ICO_FAIL;
        rcTitle.textContent = allOk ? 'Подпись действительна' : 'Подпись недействительна';
        rcSub.textContent = allOk
            ? 'Все четыре проверки прошли успешно. Документ не был изменён после подписания.'
            : 'Одна или несколько проверок не прошли. Файл мог быть подделан или повреждён.';

        var fmtDesc = fmtOk
            ? 'Все поля (версия, ID, таймстамп, хеши, структура Full-Data) соответствуют спецификации TandemSign/1.0.'
            : 'Нарушения: ' + fmtIssues.join(' • ');

        rcChecks.innerHTML = chkRow(fmtOk ? 'ok' : 'fail', 'Формат полей', fmtDesc)
            + checks.map(function (c) {
                return chkRow(
                    c.ok ? 'ok' : 'fail',
                    c.label,
                    c.desc,
                    c.expected,
                    c.ok ? undefined : c.computed
                );
            }).join('');
    }

    async function handleFile(file) {
        var errEl = document.getElementById('parse-error');
        errEl.classList.remove('visible');
        document.getElementById('chk-result').classList.remove('visible');
        document.getElementById('reset-btn').style.display = 'none';
        if (!file) return;
        var text;
        try { text = await file.text(); }
        catch (e) { errEl.textContent = 'Не удалось прочитать файл: ' + e.message; errEl.classList.add('visible'); return; }
        var sig = TandemSign.parse(text);
        if (!sig) {
            errEl.textContent = 'Файл не распознан. Убедитесь, что это корректный файл .tandemsign формата TandemSign/1.0.';
            errEl.classList.add('visible');
            return;
        }
        await renderResult(sig);
    }

    var zone = document.getElementById('drop-zone');
    var fileInput = document.getElementById('file-input');

    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('drag-over'); });
    zone.addEventListener('drop', function (e) {
        e.preventDefault(); zone.classList.remove('drag-over');
        var f = e.dataTransfer.files[0]; if (f) handleFile(f);
    });
    fileInput.addEventListener('change', function () { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

    document.getElementById('reset-btn').addEventListener('click', function () {
        document.getElementById('chk-result').classList.remove('visible');
        document.getElementById('parse-error').classList.remove('visible');
        document.getElementById('reset-btn').style.display = 'none';
        fileInput.value = '';
    });

    /* ══════════════════════════════════════════════════════
       ENV PANEL
    ══════════════════════════════════════════════════════ */
    function fmtBytes(b) {
        if (b === 0) return '0 Б';
        if (b < 1024) return b + ' Б';
        if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' КБ';
        return (b / (1024 * 1024)).toFixed(2) + ' МБ';
    }

    function storageBytes(storage) {
        var total = 0;
        try {
            for (var i = 0; i < storage.length; i++) {
                var k = storage.key(i);
                total += (k.length + (storage.getItem(k) || '').length) * 2;
            }
        } catch (_) { }
        return total;
    }

    async function refreshEnvCounts() {
        /* localStorage */
        var lsCount = 0, lsSize = 0;
        try { lsCount = localStorage.length; lsSize = storageBytes(localStorage); } catch (_) { }
        document.getElementById('env-ls-count').textContent = lsCount;
        document.getElementById('env-ls-size').textContent = fmtBytes(lsSize);

        /* sessionStorage */
        var ssCount = 0, ssSize = 0;
        try { ssCount = sessionStorage.length; ssSize = storageBytes(sessionStorage); } catch (_) { }
        document.getElementById('env-ss-count').textContent = ssCount;
        document.getElementById('env-ss-size').textContent = fmtBytes(ssSize);

        /* cookies */
        var ckCount = 0, ckSize = 0;
        try {
            var c = document.cookie.trim();
            var parts = c ? c.split(';').filter(function (s) { return s.trim(); }) : [];
            ckCount = parts.length;
            ckSize = new Blob([document.cookie]).size;
        } catch (_) { }
        document.getElementById('env-ck-count').textContent = ckCount;
        document.getElementById('env-ck-size').textContent = fmtBytes(ckSize);

        /* Cache API */
        var cacheCount = 0, cacheSize = 0;
        try {
            var names = await caches.keys();
            for (var n of names) {
                var cache = await caches.open(n);
                var reqs = await cache.keys();
                cacheCount += reqs.length;
                for (var req of reqs) {
                    var resp = await cache.match(req);
                    if (resp) { var blob = await resp.clone().blob(); cacheSize += blob.size; }
                }
            }
        } catch (_) { }
        document.getElementById('env-cache-count').textContent = cacheCount;
        document.getElementById('env-cache-size').textContent = fmtBytes(cacheSize);
    }

    async function doLocalReset() {
        /* localStorage */
        try { localStorage.clear(); } catch (_) { }
        /* sessionStorage */
        try { sessionStorage.clear(); } catch (_) { }
        /* cookies */
        try {
            document.cookie.split(';').forEach(function (c) {
                var name = c.split('=')[0].trim();
                if (!name) return;
                var base = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                document.cookie = base;
                document.cookie = base + '; domain=' + window.location.hostname;
                document.cookie = base + '; domain=.' + window.location.hostname;
            });
        } catch (_) { }
        /* Cache API */
        try {
            var cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(function (n) { return caches.delete(n); }));
        } catch (_) { }

        var logEl = document.getElementById('reset-log');
        logEl.textContent = '✓ Локальные данные Tandem Sites успешно очищены.';
        logEl.classList.add('visible');
        await refreshEnvCounts();
    }

    /* ─ Swipe-to-confirm ─ */
    (function initSwipe() {
        var track = document.getElementById('swipe-confirm');
        var handle = document.getElementById('swipe-handle');
        var fill = document.getElementById('swipe-fill');
        var label = document.getElementById('swipe-label');
        if (!track || !handle) return;

        var dragging = false, startX = 0, currentX = 0, completed = false;

        function getMax() {
            return track.offsetWidth - handle.offsetWidth - 10; /* 10 = 5px*2 offset */
        }

        function setPos(x) {
            var max = getMax();
            var clamped = Math.max(0, Math.min(x, max));
            handle.style.transform = 'translateX(' + clamped + 'px)';
            fill.style.width = (handle.offsetWidth + clamped + 5) + 'px';
            var pct = clamped / max;
            label.style.opacity = 1 - pct * 1.5;
            return clamped;
        }

        function onStart(e) {
            if (completed) return;
            dragging = true;
            var clientX = e.touches ? e.touches[0].clientX : e.clientX;
            startX = clientX - currentX;
            handle.style.transition = 'none';
            fill.style.transition = 'none';
            e.preventDefault();
        }
        function onMove(e) {
            if (!dragging) return;
            var clientX = e.touches ? e.touches[0].clientX : e.clientX;
            currentX = setPos(clientX - startX);
            e.preventDefault();
        }
        function onEnd() {
            if (!dragging) return;
            dragging = false;
            var max = getMax();
            handle.style.transition = 'transform .35s cubic-bezier(.4,0,.2,1), box-shadow .2s';
            fill.style.transition = 'width .35s cubic-bezier(.4,0,.2,1)';
            if (currentX >= max * 0.88) {
                /* CONFIRM */
                completed = true;
                setPos(max);
                track.classList.add('completed');
                label.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Сброс выполнен';
                label.style.opacity = '1';
                setTimeout(function () {
                    doLocalReset().then(function () {
                        /* анимированно возвращаем свайп в исходное состояние */
                        setTimeout(function () {
                            handle.style.transition = 'transform .55s cubic-bezier(.4,0,.2,1), box-shadow .2s';
                            fill.style.transition = 'width .55s cubic-bezier(.4,0,.2,1)';
                            setPos(0);
                            track.classList.remove('completed');
                            label.innerHTML = 'Потяните вправо для подтверждения';
                            label.style.opacity = '1';
                            currentX = 0;
                            completed = false;
                        }, 2200);
                    });
                }, 300);
            } else {
                /* spring back */
                currentX = 0;
                setPos(0);
            }
        }

        handle.addEventListener('mousedown', onStart, { passive: false });
        handle.addEventListener('touchstart', onStart, { passive: false });
        document.addEventListener('mousemove', onMove, { passive: false });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
    })();

})(); /* end IIFE */