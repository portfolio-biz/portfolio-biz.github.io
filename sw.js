/* ─────────────────────────────────────────────────────────────────
   Tandem Sites — Service Worker
   Стратегия:
     • статика (CSS/JS/шрифты/изображения) — Cache First
     • HTML-навигация                       — Network First + offline fallback
     • внешние ресурсы (fonts.googleapis)   — Stale While Revalidate
   ───────────────────────────────────────────────────────────────── */

const CACHE_NAME = 'tandem-v2';
const CACHE_STATIC = 'tandem-static-v2';
const CACHE_PAGES  = 'tandem-pages-v2';

/* файлы, которые кешируются при установке (app shell) */
const PRECACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/manifest.json',
    '/logo.png',
    '/404.html',
];

/* ── Install: прекешируем app shell ─────────────────────────────── */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_STATIC).then(cache => cache.addAll(PRECACHE))
    );
    self.skipWaiting();
});

/* ── Activate: чистим устаревшие кеши ──────────────────────────── */
self.addEventListener('activate', event => {
    const allowed = new Set([CACHE_STATIC, CACHE_PAGES]);
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => !allowed.has(k)).map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

/* ── Fetch ──────────────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    /* пропускаем не-GET и chrome-extension */
    if (request.method !== 'GET' || url.protocol.startsWith('chrome')) return;

    /* внешние шрифты — Stale While Revalidate */
    if (url.hostname.includes('fonts.g')) {
        event.respondWith(staleWhileRevalidate(request, CACHE_STATIC));
        return;
    }

    /* статические ресурсы — Cache First */
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request, CACHE_STATIC));
        return;
    }

    /* HTML-страницы — Network First с offline fallback */
    if (request.mode === 'navigate' || request.headers.get('Accept')?.includes('text/html')) {
        event.respondWith(networkFirstHTML(request));
        return;
    }

    /* всё остальное — Network First */
    event.respondWith(networkFirst(request, CACHE_PAGES));
});

/* ── Helpers ────────────────────────────────────────────────────── */
function isStaticAsset(url) {
    return /\.(css|js|woff2?|ttf|otf|png|jpg|jpeg|gif|svg|webp|avif|ico)(\?.*)?$/.test(url.pathname);
}

/* Cache First: кеш → сеть → сохранить в кеш */
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('Offline', { status: 503 });
    }
}

/* Network First: сеть → кеш → offline fallback */
async function networkFirst(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached ?? new Response('Offline', { status: 503 });
    }
}

/* Network First для HTML: при ошибке отдаём кеш или /index.html */
async function networkFirstHTML(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_PAGES);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        /* SPA fallback — возвращаем главную страницу из кеша */
        return (await caches.match('/')) ?? offline404();
    }
}

/* Stale While Revalidate: кеш сразу + обновление в фоне */
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
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
