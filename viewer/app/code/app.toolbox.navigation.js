/* ────────────────────────────────────────────────
   Tandem Sites — Viewer
   app/code/app.toolbox.navigation.js
   — Загрузка сайтов, навигация, дропдаун
   ──────────────────────────────────────────────── */

// первый вызов syncUrl использует replaceState (чтобы не дублировать запись при загрузке)
let _isInitialLoad = true;

function loadSite(index, skipSync = false) {
    if (index < 0 || index >= TANDEM_SITES.length) return;

    App.state.currentIndex = index;
    const site = TANDEM_SITES[index];
    const isHome = site.id === 0;

    if (!skipSync) syncUrl(site.id);

    // Прогресс
    App.UI.loader.classList.remove('hidden');
    startProgress();

    // Анимация смены заголовка
    triggerInfoAnimation(() => {
        App.UI.titleEl.textContent = site.title;
        App.UI.descEl.textContent = site.description;
        const nonHomePos = TANDEM_SITES.filter((s, i) => s.id !== 0 && i <= index).length;
        const nonHomeTotal = TANDEM_SITES.filter(s => s.id !== 0).length;
        App.UI.counterEl.textContent = `${nonHomePos} / ${nonHomeTotal}`;
    });

    // Кнопки навигации
    App.UI.btnPrev.disabled = (index === 0);
    App.UI.btnNext.disabled = (index === TANDEM_SITES.length - 1);

    // Кнопки действий — недоступны на главной
    App.UI.openBtn.classList.toggle('disabled', isHome);
    App.UI.copyBtn.classList.toggle('disabled', isHome);
    App.UI.phoneToggle.classList.toggle('disabled', isHome);
    App.UI.counterEl.style.display = isHome ? 'none' : '';

    if (/^https?:\/\//i.test(site.path)) {
        App.UI.openBtn.href = site.path;
    } else if (site.id !== undefined && site.id > 0) {
        App.UI.openBtn.href = 'no-toolbox-viewer/?render-mode=fullscreen&project-id=' + site.id;
    } else {
        const m = site.path.match(/works\/([^\/]+)\//);
        App.UI.openBtn.href = m ? 'no-toolbox-viewer/?render-mode=fullscreen&project-name=' + m[1] : site.path;
    }

    // Синхронизация мобильного модала
    App.UI.amOpenBtn.href = App.UI.openBtn.href;
    App.UI.amOpenBtn.classList.toggle('am-action--disabled', isHome);
    App.UI.amCopyBtn.classList.toggle('am-action--disabled', isHome);
    App.UI.amSiteName.textContent = site.title;

    // Phone-режим: отключаем на главной, восстанавливаем при уходе с неё
    if (isHome) {
        App.state.phonePrevWasActive = document.body.classList.contains('phone-preview');
        if (App.state.phonePrevWasActive) {
            document.body.classList.remove('phone-preview');
            App.UI.phoneToggle.classList.remove('active');
            clearFramePhoneStyles();
        }
    } else if (App.state.phonePrevWasActive) {
        document.body.classList.add('phone-preview');
        App.UI.phoneToggle.classList.add('active');
        App.state.phonePrevWasActive = false;
        applyPhoneFormat();
    }

    updateDropdownState(index);
    reloadFrame(site.path);
}

function navigate(direction) {
    const next = App.state.currentIndex + direction;
    if (next >= 0 && next < TANDEM_SITES.length) loadSite(next);
}

function selectSite(idx) {
    loadSite(parseInt(idx, 10));
}

function syncUrl(siteId) {
    const url = new URL(location.href);
    siteId === 0
        ? url.searchParams.delete('project-id')
        : url.searchParams.set('project-id', siteId);
    // первый запуск — replaceState (заменяем текущую URL без добавления записи)
    // последующие — pushState, чтобы кнопка "Назад" работала корректно
    if (_isInitialLoad) {
        history.replaceState({ projectId: siteId }, '', url);
        _isInitialLoad = false;
    } else {
        history.pushState({ projectId: siteId }, '', url);
    }
}

// popstate: обрабатываем кнопку "Назад"/"Вперёд" браузера
window.addEventListener('popstate', () => {
    if (typeof TANDEM_SITES === 'undefined') return;
    const urlId = new URLSearchParams(location.search).get('project-id');
    const targetId = urlId !== null ? parseInt(urlId, 10) : 0;
    const idx = TANDEM_SITES.findIndex(s => s.id === targetId);
    // skipSync=true — URL уже актуален, повторно не пишем
    if (idx !== -1 && idx !== App.state.currentIndex) loadSite(idx, true);
});

function triggerInfoAnimation(cb) {
    App.UI.infoBlock.classList.remove('info-animate');
    cb();
    void App.UI.infoBlock.offsetWidth;
    App.UI.infoBlock.classList.add('info-animate');
}

/* ─── Дропдаун ─── */
function toggleDropdown() {
    const trigger = document.getElementById('select-trigger');
    App.UI.dropdownEl.classList.toggle('open');
    trigger.classList.toggle('active');
}

function closeDropdown() {
    const trigger = document.getElementById('select-trigger');
    App.UI.dropdownEl.classList.remove('open');
    trigger.classList.remove('active');
}

function updateDropdownState(index) {
    App.UI.selectLabel.textContent = TANDEM_SITES[index].title;
    document.querySelectorAll('.dropdown-item').forEach((el, i) =>
        el.classList.toggle('active', i === index));
}
