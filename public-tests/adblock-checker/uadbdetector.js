/**
 * UADBDetector v2.0
 * Детектор рекламных блокировщиков для браузерного окружения.
 *
 * Методы детекции:
 *   css-bait      — CSS-приманка: блокировщик скрывает элементы с «рекламными» классами
 *                   через косметические фильтры EasyList / uBlock Origin / Adguard.
 *   probe-google  — Сетевой зонд: fetch no-cors к pagead2.googlesyndication.com.
 *                   Блокировщик разрывает соединение → TypeError. Bait-файл не нужен.
 *   probe-dcm     — Сетевой зонд: fetch no-cors к securepubads.g.doubleclick.net.
 *                   Независимый второй зонд (Google Ad Manager). Снижает false-positive.
 *
 * Публичный API:
 *   UADBDetector.detect([opts]) → Promise<{ blocked, confidence, signals }>
 *
 *   blocked    {boolean}  — итоговый вердикт (confidence >= minConfidence)
 *   confidence {number}   — 0..100 — взвешенная уверенность в наличии блокировки
 *   signals    {object[]} — результат каждой техники
 *
 * @version  2.0
 * @author   Tandem Sites
 * @license  Proprietary
 */
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.UADBDetector = factory();
    }
})(typeof window !== 'undefined' ? window : this, function () {
    'use strict';

    var VERSION = '2.0';

    /**
     * Веса каждой техники в итоговом confidence (0–100).
     * CSS-приманка — наиболее стабильна; сетевые зонды используют третьесторонние ad-домены.
     */
    var WEIGHTS = {
        'css-bait': 50,
        'probe-google': 30,
        'probe-dcm': 20
    };

    /* ═══════════════════════════════════════════════════════════
       ТЕХНИКА 1 — CSS-ПРИМАНКА

       Создаёт несколько div с классами, которые EasyList / uBlock Origin /
       Adguard / Brave Shields скрывают через косметические CSS-фильтры.

       Блокировщик инжектирует:  .adsbox { display: none !important }
       Inline-стиль  (0,1,0)  побеждает обычные правила, но !important — нет.
       → offsetHeight и offsetWidth элементов становятся 0.

       Вердикт: blocked=true, если ≥ 2 из 5 бейт-элементов скрыты.
    ═══════════════════════════════════════════════════════════ */
    function probeCssBait() {
        return new Promise(function (resolve) {
            if (typeof document === 'undefined') {
                resolve({ technique: 'css-bait', blocked: false, skipped: true, reason: 'нет DOM' });
                return;
            }

            /* Классы-приманки из публичных фильтр-листов EasyList / uBlock Origin / ABP */
            var BAIT_CLASSES = [
                'adsbox',
                'adsbygoogle',
                'ad-placement',
                'ad-unit',
                'doubleclick',
                "banner"
            ];

            /* Контейнер вынесен за пределы viewport — не влияет на layout */
            var wrap = document.createElement('div');
            wrap.setAttribute('aria-hidden', 'true');
            wrap.style.cssText =
                'position:absolute;top:-9999px;left:-9999px;' +
                /* visibility:visible — гарантирует, что parent не скрывает детей */
                'visibility:visible;pointer-events:none;';

            var baits = BAIT_CLASSES.map(function (cls) {
                var el = document.createElement('div');
                el.className = cls;
                /* Inline-стиль даёт 1px — baseline для сравнения */
                el.style.cssText = 'display:block;width:1px;height:1px;';
                wrap.appendChild(el);
                return el;
            });

            document.body.appendChild(wrap);

            /* 300 мс — запас для применения косметических правил.
               ABP и Brave Shields могут требовать 150-250 мс.           */
            setTimeout(function () {
                var hidden = 0;
                var details = [];

                baits.forEach(function (el) {
                    var cs = window.getComputedStyle(el);
                    var isHidden =
                        el.offsetHeight === 0 ||
                        el.offsetWidth === 0 ||
                        cs.display === 'none' ||
                        cs.visibility === 'hidden' ||
                        cs.opacity === '0';
                    details.push(el.className.replace(' ', '.') + ':' + (isHidden ? 'скрыт' : 'виден'));
                    if (isHidden) hidden++;
                });

                if (wrap.parentNode) wrap.parentNode.removeChild(wrap);

                resolve({
                    technique: 'css-bait',
                    blocked: hidden >= 2,
                    detail: hidden + '/' + BAIT_CLASSES.length + ' скрыто — ' + details.join(', '),
                });
            }, 300);
        });
    }

    /* ═══════════════════════════════════════════════════════════
       ТЕХНИКА 2 — СЕТЕВОЙ ЗОНД: Google Ads (fetch no-cors)

       fetch() к pagead2.googlesyndication.com с mode:'no-cors':
       • AdBlock блокирует запрос на сетевом уровне → TypeError.
       • Без блокировки → «непрозрачный» (opaque) ответ, Promise
         разрешается (тело / статус недоступны — это нормально).

       Режим no-cors исключает CORS-ошибку: браузер не требует
       заголовок Access-Control-Allow-Origin, поэтому нормальный
       запрос всегда resolve-ится, заблокированный — reject-ится.
    ═══════════════════════════════════════════════════════════ */
    function probeGoogleAds(timeout) {
        return new Promise(function (resolve) {
            if (typeof fetch === 'undefined') {
                resolve({ technique: 'probe-google', blocked: false, skipped: true, reason: 'fetch недоступен' });
                return;
            }

            var settled = false;

            var timer = setTimeout(function () {
                if (settled) return;
                settled = true;
                resolve({ technique: 'probe-google', blocked: false, skipped: true, reason: 'таймаут ' + timeout + ' мс' });
            }, timeout);

            fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store',
            })
                .then(function () {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    resolve({
                        technique: 'probe-google', blocked: false,
                        detail: 'запрос к googlesyndication.com прошёл (opaque response)',
                    });
                })
                .catch(function (err) {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    resolve({
                        technique: 'probe-google', blocked: true,
                        detail: err.message || 'TypeError — запрос к googlesyndication.com заблокирован',
                    });
                });
        });
    }

    /* ═══════════════════════════════════════════════════════════
       ТЕХНИКА 3 — СЕТЕВОЙ ЗОНД: DoubleClick / GAM (fetch no-cors)

       Аналогично технике 2, но к домену securepubads.g.doubleclick.net —
       Google Ad Manager (GAM). Заблокирован EasyList, uBlock Origin,
       EasyPrivacy, Adguard и всеми ведущими списками фильтров.

       Два независимых зонда к разным доменам повышают надёжность:
       если один домен случайно недоступен без AdBlock — второй
       не даст ложный positive verdict.
    ═══════════════════════════════════════════════════════════ */
    function probeDCM(timeout) {
        return new Promise(function (resolve) {
            if (typeof fetch === 'undefined') {
                resolve({ technique: 'probe-dcm', blocked: false, skipped: true, reason: 'fetch недоступен' });
                return;
            }

            var settled = false;

            var timer = setTimeout(function () {
                if (settled) return;
                settled = true;
                resolve({ technique: 'probe-dcm', blocked: false, skipped: true, reason: 'таймаут ' + timeout + ' мс' });
            }, timeout);

            fetch('https://securepubads.g.doubleclick.net/tag/js/gpt.js', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store',
            })
                .then(function () {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    resolve({
                        technique: 'probe-dcm', blocked: false,
                        detail: 'запрос к doubleclick.net прошёл (opaque response)',
                    });
                })
                .catch(function (err) {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    resolve({
                        technique: 'probe-dcm', blocked: true,
                        detail: err.message || 'TypeError — запрос к doubleclick.net заблокирован',
                    });
                });
        });
    }

    /* ═══════════════════════════════════════════════════════════
       ПУБЛИЧНЫЙ МЕТОД: detect()
    ═══════════════════════════════════════════════════════════ */

    /**
     * Запускает все зонды параллельно и возвращает итоговый вердикт.
     *
     * @param  {object}  [opts]
     * @param  {number}  [opts.timeout=3500]       Таймаут каждого сетевого зонда, мс.
     * @param  {number}  [opts.minConfidence=50]   Порог confidence для blocked=true.
     * @returns {Promise<{ blocked: boolean, confidence: number, signals: object[] }>}
     */
    async function detect(opts) {
        opts = Object.assign({
            timeout: 3500,
            minConfidence: 50,
        }, opts || {});

        /* Все три зонда запускаются параллельно */
        var signals = await Promise.all([
            probeCssBait(),
            probeGoogleAds(opts.timeout),
            probeDCM(opts.timeout),
        ]);

        /* Взвешенное агрегирование только по не-пропущенным техникам */
        var totalWeight = 0;
        var positiveWeight = 0;

        signals.forEach(function (s) {
            if (!s.skipped) {
                var w = WEIGHTS[s.technique] || 10;
                totalWeight += w;
                if (s.blocked) positiveWeight += w;
            }
        });

        var confidence = totalWeight > 0
            ? Math.round((positiveWeight / totalWeight) * 100)
            : 0;

        return {
            blocked: confidence >= opts.minConfidence,
            confidence: confidence,
            signals: signals,
        };
    }

    /* ── Публичный API ── */
    return {
        VERSION: VERSION,
        detect: detect,
    };
});
