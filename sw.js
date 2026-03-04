/* ─────────────────────────────────────────────────────────────────
   Tandem Sites — Service Worker
   Стратегия: NO-CACHE passthrough.
     • Никакого кеширования — все запросы всегда идут в сеть.
     • При офлайне отдаём встроенную страницу-заглушку.
     • Activate сносит ВСЕ старые кеши (v1/v2/v3).
   ───────────────────────────────────────────────────────────────── */

/* ── Install: сразу активируемся ───────────────────────────────── */
self.addEventListener('install', () => self.skipWaiting());

/* ── Activate: сносим абсолютно все кеши ───────────────────────── */
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    );
    self.clients.claim();
});

/* ── Fetch: чистый passthrough, никакого кеша ──────────────────── */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET' || url.protocol.startsWith('chrome')) return;

    event.respondWith(
        fetch(request).catch(function () {
            if (request.mode === 'navigate') return offline404();
            return new Response('Offline', { status: 503 });
        })
    );
});

function offline404() {
    return new Response(
        `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Offline — Tandem Sites</title>
        <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0b0b0b;color:#fff;flex-direction:column;gap:16px;text-align:center;padding:24px}
        h1{font-size:2rem;margin:0}p{color:rgba(255,255,255,.5);margin:0}a{color:#7c6ef5;text-decoration:none}</style></head>
        <body><h1>Офлайн</h1><p>Нет подключения к интернету.<br>Проверьте соединение и&nbsp;<a href="/">попробуйте снова</a>.</p></body></html>`,
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
}
