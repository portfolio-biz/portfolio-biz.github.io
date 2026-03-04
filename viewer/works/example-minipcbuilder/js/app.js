let bannerTimer = null;
function showBanner(type, msg) {
    const el = document.getElementById('compat-banner');
    el.className = `compat-banner ${type}`;
    el.innerHTML = `${type === 'warn' ? ICONS.warn : ICONS.err} ${msg}`;
    el.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

/* ════════════════════════════════════════════════════════════
   ACTIONS
════════════════════════════════════════════════════════════ */
document.getElementById('btn-reset').addEventListener('click', () => {
    if (Object.keys(state.selected).length === 0) return;
    state.selected = {};
    state.filter = null;
    renderAll();
});

document.getElementById('btn-copy').addEventListener('click', () => {
    const lines = ['PCraft — Конфигурация ПК', '═'.repeat(40)];
    let total = 0;
    CATEGORY_KEYS.forEach(key => {
        const item = state.selected[key];
        if (item) {
            lines.push(`${DB[key].short}: ${item.name} — ${item.price.toLocaleString('ru')} ₽`);
            total += item.price;
        }
    });
    if (lines.length === 2) { lines.push('Ничего не выбрано'); }
    else { lines.push('─'.repeat(40)); lines.push(`Итого: ${total.toLocaleString('ru')} ₽`); }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
        const btn = document.getElementById('btn-copy');
        const orig = btn.innerHTML;
        btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"><polyline points="20 6 9 17 4 12"/></svg><span>Скопировано!</span>`;
        setTimeout(() => { btn.innerHTML = orig; }, 2000);
    });
});

document.getElementById('btn-export').addEventListener('click', () => {
    const date = new Date().toLocaleDateString('ru-RU');
    let total = 0;
    let cpuTdp = 0, gpuTdp = 0, psuW = 0;

    CATEGORY_KEYS.forEach(key => {
        const item = state.selected[key];
        if (!item) return;
        total += item.price;
        if (key === 'cpu' && item.tdp) cpuTdp = item.tdp;
        if (key === 'gpu' && item.tdp) gpuTdp = item.tdp;
        if (key === 'psu' && item.wattage) psuW = item.wattage;
    });

    const recPsu = cpuTdp + gpuTdp > 0 ? Math.ceil((cpuTdp + gpuTdp) * 1.3) : null;
    const pad = (str, n) => String(str).padEnd(n, ' ');

    const lines = [
        '╔══════════════════════════════════════════════════════╗',
        '║              PCraft — КОНФИГУРАЦИЯ ПК                ║',
        '╚══════════════════════════════════════════════════════╝',
        `  Дата сборки:       ${date}`,
        `  Актуальность цен:  Март 2026`,
        '',
        '── КОМПОНЕНТЫ ───────────────────────────────────────────',
        ...CATEGORY_KEYS.map(key => {
            const item = state.selected[key];
            const label = pad(DB[key].label, 24);
            if (item) {
                const price = `${item.price.toLocaleString('ru')} ₽`;
                return `  ${label}  ${pad(item.name, 34)} ${price}`;
            } else {
                return `  ${label}  — не выбрано`;
            }
        }),
        '',
        '── ПОТРЕБЛЕНИЕ ──────────────────────────────────────────',
        `  CPU TDP:           ${cpuTdp > 0 ? cpuTdp + ' Вт' : '—'}`,
        `  GPU TDP:           ${gpuTdp > 0 ? gpuTdp + ' Вт' : '—'}`,
        `  Пиковая нагрузка:  ${cpuTdp + gpuTdp > 0 ? (cpuTdp + gpuTdp) + ' Вт' : '—'}`,
        `  Рекомендуемый БП:  ${recPsu ? '≥ ' + recPsu + ' Вт (+30% запаса)' : '—'}`,
        `  Выбранный БП:      ${psuW > 0 ? psuW + ' Вт' + (recPsu && psuW >= recPsu ? '  ✓ достаточно' : recPsu ? '  ⚠ мало' : '') : '—'}`,
        '',
        '── ИТОГ ─────────────────────────────────────────────────',
        `  Итоговая стоимость: ${total.toLocaleString('ru')} ₽`,
        `  Выбрано позиций:   ${CATEGORY_KEYS.filter(k => state.selected[k]).length} из ${CATEGORY_KEYS.length}`,
        '',
        '── PCraft ───────────────────────────────────────────────',
        '  Файл создан автоматически сервисом PCraft',
        '  Конструктор ПК 2026 · pccraft.tandem-sites.ru',
        `  Сгенерировано: ${date}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PCraft_Build_${date.replace(/\./g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Фидбек
    const btn = document.getElementById('btn-export');
    const origHTML = btn.innerHTML;
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"><polyline points="20 6 9 17 4 12"/></svg> Сохранено!`;
    setTimeout(() => { btn.innerHTML = origHTML; }, 2200);
});

/* ════════════════════════════════════════════════════════════
   LANDING OPEN
════════════════════════════════════════════════════════════ */
function openBuilder() {
    const landing = document.getElementById('landing');
    const app = document.getElementById('app');

    // 1. Лендинг уходит
    landing.classList.add('is-leaving');

    // 2. После анимации лендинга — показываем app
    setTimeout(() => {
        landing.style.display = 'none';
        app.classList.add('is-visible');
        // Запускаем build-in анимацию
        app.classList.add('is-building');
    }, 480);
}

document.getElementById('btn-open').addEventListener('click', openBuilder);

/* ════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════ */
renderAll();
