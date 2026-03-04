/* ─────────────────────────────────────────────────────────────────
   Tandem Sites — Service Worker
   Стратегия: Network First для всего.
     • Сеть всегда запрашивается первой — изменения видны сразу.
     • Кеш используется ТОЛЬКО как offline-fallback.
     • Шрифты Google — исключение (Stale While Revalidate,
       т.к. они не меняются и CDN не всегда доступен офлайн).
   ───────────────────────────────────────────────────────────────── */

const CACHE = 'tandem-v3';

/* ── Install: ничего не прекешируем, сразу активируемся ─────────── */
self.addEventListener('install', () => self.skipWaiting());

/* ── Activate: сносим все старые кеши ──────────────────────────── */
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

/* ── Fetch ──────────────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    /* пропускаем не-GET и служебные протоколы */
    if (request.method !== 'GET' || url.protocol.startsWith('chrome')) return;

    /* шрифты Google — Stale While Revalidate (CDN, не меняются) */
    if (url.hostname.includes('fonts.g')) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    /* всё остальное — Network First */
    event.respondWith(networkFirst(request));
});

/* ── Helpers ────────────────────────────────────────────────────── */

/* Network First: сеть → сохранить в кеш → при ошибке отдать кеш */
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        /* HTML offline fallback */
        if (request.mode === 'navigate') return offline404();
        return new Response('Offline', { status: 503 });
    }
}

/* Stale While Revalidate: кеш сразу + обновление в фоне */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    const networkFetch = fetch(request).then(response => {
        if (response.ok) cache.put(request, response.clone());
        return response;
    }).catch(() => cached);
    return cached ?? networkFetch;
}

function offline404() {
    return new Response(
        `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Offline — Tandem Sites</title>
        <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0b0b0b;color:#fff;flex-direction:column;gap:16px;text-align:center;padding:24px}
        h1{font-size:2rem;margin:0}p{color:rgba(255,255,255,.5);margin:0}a{color:#7c6ef5;text-decoration:none}</style></head>
        <body><h1>Офлайн</h1><p>Нет подключения к интернету.<br>Проверьте соединение и&nbsp;<a href="/">попробуйте снова</a>.</p></body></html>`,
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
}
