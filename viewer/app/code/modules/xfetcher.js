/* ────────────────────────────────────────────────
   Tandem Sites — Viewer
   app/code/modules/xfetcher.js
   — Умная обёртка над fetch: retry, backoff, jitter
   ──────────────────────────────────────────────── */

(function (global) {
    'use strict';

    /* ── Классификация HTTP-статусов ─────────────────
     *
     *  PERMANENT  — повторять бессмысленно (клиентская ошибка)
     *  RETRYABLE  — временная проблема, стоит попробовать ещё раз
     *
     * ──────────────────────────────────────────────── */
    const PERMANENT_HTTP = new Set([400, 401, 403, 404, 405, 406, 410, 422, 451]);
    const RETRYABLE_HTTP = new Set([408, 429, 500, 502, 503, 504]);

    /* ── Классификация сетевых ошибок ────────────────
     *
     *  AbortError   — намеренная отмена, никогда не retry
     *  TypeError    — "Failed to fetch" / нет сети → retry
     *  остальное    → retry (на всякий случай)
     *
     * ──────────────────────────────────────────────── */
    function isRetryableError(err) {
        if (err && err.name === 'AbortError') return false;
        return true;
    }

    /* ── Задержка с экспоненциальным backoff + jitter ─
     *
     *  attempt : 1-based номер следующей попытки
     *  base    : базовый интервал мс (default 300)
     *  cap     : максимальная задержка мс (default 8 000)
     *
     *  Формула: min(cap, base * 2^(attempt-1)) ± 20% jitter
     *
     * ──────────────────────────────────────────────── */
    function backoffDelay(attempt, base, cap) {
        const exp = base * Math.pow(2, attempt - 1);
        const capped = Math.min(cap, exp);
        const jitter = capped * 0.2 * (Math.random() * 2 - 1); // ±20%
        return Math.max(0, Math.round(capped + jitter));
    }

    /* ── Читаем Retry-After (секунды или HTTP-дата) ──── */
    function retryAfterMs(response) {
        const header = response.headers && response.headers.get('Retry-After');
        if (!header) return null;

        const seconds = Number(header);
        if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;

        const date = Date.parse(header);
        if (!isNaN(date)) return Math.max(0, date - Date.now());

        return null;
    }

    /* ── Пауза ───────────────────────────────────────── */
    function sleep(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    /* ═══════════════════════════════════════════════════
     *  xfetch.request(url, options?)
     *
     *  Расширенные опции (поверх стандартных fetch):
     *    retries  {number}      — кол-во повторных попыток (default 3)
     *    baseMs   {number}      — базовая задержка мс (default 300)
     *    capMs    {number}      — максимальная задержка мс (default 8000)
     *    signal   {AbortSignal} — пробрасывается в fetch
     *
     *  Возвращает Promise<Response>.
     *  Режет retry при AbortError и перманентных HTTP-ошибках.
     * ═══════════════════════════════════════════════════ */
    async function request(url, options) {
        const retries = (options && options.retries != null) ? options.retries : 3;
        const baseMs = (options && options.baseMs != null) ? options.baseMs : 300;
        const capMs = (options && options.capMs != null) ? options.capMs : 8000;

        // Строим чистые опции для fetch (без наших кастомных ключей)
        const fetchOptions = Object.assign({}, options);
        delete fetchOptions.retries;
        delete fetchOptions.baseMs;
        delete fetchOptions.capMs;

        const maxAttempts = retries + 1;
        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await fetch(url, fetchOptions);

                if (response.ok) return response;

                // HTTP-ошибка с телом — превращаем в объект Error
                const httpErr = new Error('HTTP ' + response.status);
                httpErr.response = response;
                httpErr.status = response.status;

                // Перманентная ошибка — повторять незачем
                if (PERMANENT_HTTP.has(response.status)) throw httpErr;

                // Retry-After от сервера → уважаем, но не бесконечно (cap 30 с)
                if (attempt < maxAttempts && RETRYABLE_HTTP.has(response.status)) {
                    const wait = Math.min(
                        retryAfterMs(response) ?? backoffDelay(attempt, baseMs, capMs),
                        30_000
                    );
                    console.warn(
                        '[xfetcher] ' + response.status + ' ' + url +
                        ' — retry ' + attempt + '/' + retries + ' in ' + wait + 'ms'
                    );
                    await sleep(wait);
                    lastError = httpErr;
                    continue;
                }

                throw httpErr;

            } catch (err) {
                // AbortError — бросаем сразу, без retry
                if (err && err.name === 'AbortError') throw err;

                // Перманентная HTTP-ошибка (brошена выше) — бросаем сразу
                if (err.status && PERMANENT_HTTP.has(err.status)) throw err;

                lastError = err;

                if (attempt < maxAttempts && isRetryableError(err)) {
                    const wait = backoffDelay(attempt, baseMs, capMs);
                    console.warn(
                        '[xfetcher] network error "' + (err.message || err) + '" ' + url +
                        ' — retry ' + attempt + '/' + retries + ' in ' + wait + 'ms'
                    );
                    await sleep(wait);
                } else {
                    throw lastError;
                }
            }
        }

        throw lastError;
    }

    /* ═══════════════════════════════════════════════════
     *  xfetch.json(url, options?)
     *
     *  Shorthand: request() → response.json()
     *  Возвращает Promise<any>.
     * ═══════════════════════════════════════════════════ */
    async function json(url, options) {
        const response = await request(url, options);
        return response.json();
    }

    /* ── Публичный API ────────────────────────────────── */
    global.xfetch = { request: request, json: json };

}(window));
