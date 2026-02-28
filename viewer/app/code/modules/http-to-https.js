/* ────────────────────────────────────────────────
   Tandem Sites — Viewer
   app/code/modules/http-to-https.js
   — Редирект с HTTP на HTTPS при необходимости
   ──────────────────────────────────────────────── */
(function httpToHttps() {
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        try {
            if (new URLSearchParams(window.location.search).get('force-unsafe-http') === 'true') {
                return;
            }
        } catch (e) { }

        window.location.protocol = 'https:';
    }
})();