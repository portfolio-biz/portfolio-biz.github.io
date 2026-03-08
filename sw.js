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
    return new Response(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Офлайн — Tandem Sites</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
*:focus{outline:none}
::selection{background:rgba(124,110,245,.28)}
html,body{height:100%;overflow:hidden;background:#08080f;color:#e8e8f0;font-family:"Inter",system-ui,sans-serif;-webkit-font-smoothing:antialiased;user-select:none;-webkit-user-select:none}
body{
    display:flex;align-items:center;justify-content:center;padding:2rem;
    background-color:#08080f;
    background-image:
        radial-gradient(ellipse 55% 50% at 15% 60%, rgba(100,60,255,.18) 0%, transparent 70%),
        radial-gradient(ellipse 45% 40% at 85% 30%, rgba(40,80,200,.16) 0%, transparent 65%),
        radial-gradient(ellipse 60% 60% at 50% 50%, rgba(60,40,120,.14) 0%, transparent 70%),
        repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,.018) 39px, rgba(255,255,255,.018) 40px),
        repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,.018) 39px, rgba(255,255,255,.018) 40px);
}
main{display:flex;flex-direction:column;align-items:center;gap:1.25rem;text-align:center;max-width:420px;width:100%}
.err-icon{width:100px;height:100px;opacity:.55;margin-bottom:.25rem}
h1{font-size:clamp(1.1rem,3.5vw,1.5rem);font-weight:700;letter-spacing:-.02em;color:#e8e8f0}
p{font-size:clamp(.8rem,2vw,.95rem);color:#6b6b85;line-height:1.6;max-width:380px}
.err-divider{width:40px;height:1px;background:rgba(255,255,255,.08)}
.err-badge{display:inline-flex;align-items:center;gap:.4rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:8px;padding:.55rem 1rem;font-size:.8rem;color:#6b6b85}
.err-badge code{font-family:"Inter",monospace;color:#a78bfa;background:rgba(167,139,250,.1);padding:.15rem .45rem;border-radius:4px;font-size:.78rem}
.err-btn{display:inline-flex;align-items:center;gap:.5rem;padding:.65rem 1.5rem;background:rgba(124,110,245,.12);border:1px solid rgba(124,110,245,.28);color:#a78bfa;border-radius:10px;font-size:.88rem;font-weight:500;font-family:inherit;text-decoration:none;transition:background .2s,border-color .2s,transform .15s}
.err-btn:hover{background:rgba(124,110,245,.22);border-color:rgba(124,110,245,.5);transform:translateY(-1px)}
.err-footer{font-size:.72rem;color:#3d3d52;margin-top:.25rem}
</style>
</head>
<body>
<main>
    <svg class="err-icon" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="48" cy="48" r="44" stroke="rgba(124,110,245,0.2)" stroke-width="1.5"/>
        <path d="M18 38C28 26 68 26 78 38" stroke="#7c6ef5" stroke-width="3" stroke-linecap="round" opacity="0.3"/>
        <path d="M27 48C34 39 62 39 69 48" stroke="#7c6ef5" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
        <path d="M36 57C40 52 56 52 60 57" stroke="#7c6ef5" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
        <circle cx="48" cy="68" r="3.5" fill="#7c6ef5" opacity="0.9"/>
        <line x1="20" y1="76" x2="76" y2="20" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" opacity="0.65"/>
    </svg>
    <h1>Нет подключения к сети</h1>
    <p>Проверьте соединение с интернетом и попробуйте обновить страницу.</p>
    <div class="err-divider"></div>
    <div class="err-badge">Статус:&nbsp;<code>NETWORK_OFFLINE</code></div>
    <a href="/" class="err-btn">↩&nbsp;Попробовать снова</a>
    <span class="err-footer">Tandem Sites</span>
</main>
</body>
</html>`, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
