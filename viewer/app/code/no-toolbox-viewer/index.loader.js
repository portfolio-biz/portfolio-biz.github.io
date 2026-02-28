/* ────────────────────────────────────────────────
   Tandem Sites — Viewer
   app/code/no-toolbox-viewer/index.loader.js
   — Показ ошибки, подстановка iframe, загрузка БД
   ──────────────────────────────────────────────── */

/** Показать экран ошибки и убрать iframe */
function showError() {
    document.getElementById('error-screen').classList.add('visible');
    document.getElementById('project-frame')?.remove();
}

/** Подставить src в iframe */
function loadFrame(src) {
    const frame = document.getElementById('project-frame');
    if (!frame) return;
    frame.src = src;
    frame.addEventListener('error', showError, { once: true });
}

/** Загрузить проект по числовому id */
function loadById(id) {
    if (isNaN(id) || id <= 0) { showError(); return; }

    xfetch.json('../projects.db.json')
        .then(function(sites) {
            const site = sites.find(function(s) { return s.id === id; }) ?? null;
            if (!site) { showError(); return; }
            loadFrame('../' + site.path);
        })
        .catch(showError);
}
