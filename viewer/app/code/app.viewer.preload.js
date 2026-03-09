/* ────────────────────────────────────────────────
   Tandem Sites — Viewer
   app/code/app.viewer.preload.js
   — Smart Preload: тихая фоновая загрузка следующего сайта.

   Принцип:
     Пока основной фрейм показывает сайт N, скрытый #preload-frame
     уже тянет сайт N+1 (HTML + все его CSS/JS/картинки).
     Когда пользователь нажимает «Далее», браузер отдаёт все
     ресурсы из кеша — переход ощущается как мгновенный.

   Важно:
     — preload стартует ПОСЛЕ реальной загрузки основного фрейма
       (чтобы не конкурировать по сети и не замедлить текущий сайт)
     — при навигации до срабатывания таймера — таймер отменяется
       (пользователь уже перешёл, старый preload не нужен)
     — если preload уже выполнился — повторно не загружаем
       (ресурсы в кеше, второй iframe.src только лишний запрос)
   ──────────────────────────────────────────────── */

const SmartPreload = (() => {
    /** Задержка (мс) после loading-события основного фрейма */
    const DELAY_MS = 900;

    let _frame      = null;  // ссылка на #preload-frame (ленивая инициализация)
    let _loadedPath = null;  // path, уже установленный в preload-frame
    let _timer      = null;  // id pending setTimeout

    function _getFrame() {
        if (!_frame) _frame = document.getElementById('preload-frame');
        return _frame;
    }

    /**
     * Устанавливает src скрытого iframe.
     * Браузер выполняет полноценную загрузку страницы (кешируя все субресурсы),
     * но iframe невидим — пользователь ничего не замечает.
     */
    function _doLoad(path) {
        const f = _getFrame();
        if (!f) return;
        if (_loadedPath === path) return; // уже загружен/грузится — пропускаем
        _loadedPath = path;
        f.src = path; // браузер резолвит относительно viewer/ — так же, как основной фрейм
    }

    /**
     * Планирует preload сайта с индексом currentIndex + 1.
     * Вызывается из app.viewer.loader.js после завершения реальной загрузки фрейма.
     *
     * @param {number} currentIndex — App.state.currentIndex в момент вызова
     */
    function scheduleNext(currentIndex) {
        clearTimeout(_timer);
        if (typeof TANDEM_SITES === 'undefined') return;

        const nextIdx = currentIndex + 1;
        if (nextIdx >= TANDEM_SITES.length) return; // последний сайт — некуда прелоадить

        const next = TANDEM_SITES[nextIdx];
        if (!next || !next.path) return;

        // Выжидаем DELAY_MS — основной фрейм уже готов, сеть свободна
        _timer = setTimeout(() => _doLoad(next.path), DELAY_MS);
    }

    /**
     * Отменяет pending таймер (если не сработал).
     * Вызывается в начале loadSite() — пользователь уже перешёл,
     * preload «старого следующего» потерял актуальность.
     * Если _doLoad уже выполнился — не трогаем: кеш в браузере остаётся.
     */
    function cancel() {
        clearTimeout(_timer);
        _timer = null;
    }

    return { scheduleNext, cancel };
})();
