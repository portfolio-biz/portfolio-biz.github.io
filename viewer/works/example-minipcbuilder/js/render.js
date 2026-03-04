/* ════════════════════════════════════════════════════════════
   RENDER
════════════════════════════════════════════════════════════ */
function renderSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.innerHTML = '';

    const label = document.createElement('div');
    label.className = 'sidebar__label';
    label.textContent = 'Компоненты';
    sidebar.appendChild(label);

    CATEGORY_KEYS.forEach((key, idx) => {
        const cat = DB[key];
        const isActive = state.activeTab === key;
        const sel = state.selected[key];
        const status = getTabStatus(key);

        const tab = document.createElement('div');
        tab.className = `tab${isActive ? ' is-active' : ''}${sel ? ' has-selection' : ''}`;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', isActive);
        tab.setAttribute('aria-label', cat.label);
        tab.dataset.key = key;

        // Badge
        let badgeClass = '', badgeIcon = '';
        if (status === 'ok') { badgeClass = 'tab__badge--ok show'; badgeIcon = ICONS.check; }
        if (status === 'warn') { badgeClass = 'tab__badge--warn show'; badgeIcon = ICONS.warn; }

        tab.innerHTML = `
      <div class="tab__icon">${ICONS[key]}</div>
      <div class="tab__info">
<div class="tab__name">${cat.short}</div>
<div class="tab__chosen">${sel ? sel.name : 'Не выбрано'}</div>
      </div>
      <div class="tab__badge ${badgeClass}">${badgeIcon}</div>
    `;

        tab.addEventListener('click', () => {
            const cont = document.getElementById('cards-container');
            if (cont) state.scrollPos[state.activeTab] = cont.scrollTop;
            state.activeTab = key;
            state.filter = null;
            renderSidebar();
            renderContent();
        });

        sidebar.appendChild(tab);

        if (idx < CATEGORY_KEYS.length - 1) {
            const sep = document.createElement('div');
            sep.className = 'sidebar__sep';
            sidebar.appendChild(sep);
        }
    });
}

function renderContent() {
    const key = state.activeTab;
    const cat = DB[key];
    const items = cat.items;

    document.getElementById('cat-name').textContent = cat.label;

    // Filter bar — show unique brands
    const brands = [...new Set(items.map(i => i.brand))];
    const filterBar = document.getElementById('filter-bar');
    filterBar.innerHTML = '';
    if (brands.length > 1) {
        const all = document.createElement('button');
        all.className = `filter-btn${!state.filter ? ' is-active' : ''}`;
        all.textContent = 'Все';
        all.addEventListener('click', () => { state.filter = null; renderContent(); });
        filterBar.appendChild(all);

        brands.forEach(b => {
            const btn = document.createElement('button');
            btn.className = `filter-btn${state.filter === b ? ' is-active' : ''}`;
            btn.textContent = b;
            btn.addEventListener('click', () => { state.filter = b; renderContent(); });
            filterBar.appendChild(btn);
        });
    }

    const baseFiltered = state.filter ? items.filter(i => i.brand === state.filter) : items;
    // Несовместимые всегда в конец списка
    const filtered = [
        ...baseFiltered.filter(i => getCompatInfo(key, i).length === 0),
        ...baseFiltered.filter(i => getCompatInfo(key, i).length > 0)
    ];
    document.getElementById('cat-count').textContent = `${filtered.length} позиц${filtered.length === 1 ? 'ия' : filtered.length < 5 ? 'ии' : 'ий'}`;

    const grid = document.getElementById('cards-grid');
    // Отменяем пендящую rAF-анимацию предыдущего рендера, чтобы карточки не зависали невидимыми
    if (window._cardsRafId) { cancelAnimationFrame(window._cardsRafId); window._cardsRafId = null; }
    grid.innerHTML = '';

    filtered.forEach(item => {
        const compatReasons = getCompatInfo(key, item);
        const isIncompat = compatReasons.length > 0;
        const isSel = state.selected[key]?.id === item.id;

        const card = document.createElement('div');
        card.className = `card${isSel ? ' is-selected' : ''}${isIncompat ? ' is-incompatible is-disabled' : ''}`;
        card.setAttribute('role', isIncompat ? 'presentation' : 'button');
        card.setAttribute('tabindex', isIncompat ? '-1' : '0');
        card.setAttribute('aria-pressed', isSel);
        card.setAttribute('aria-label', item.name);
        card.dataset.id = item.id;

        const specsHtml = Object.entries(item.specs).slice(0, 4).map(([k, v]) =>
            `<div class="card__spec"><span class="card__spec-key">${k}</span><span class="card__spec-val">${v}</span></div>`
        ).join('');

        card.innerHTML = `
      <div class="card__check">${ICONS.check}</div>
      <div class="card__header">
<div class="card__cat-icon">${ICONS[key]}</div>
<div class="card__header-text">
  <div class="card__brand">${item.brand}</div>
  <div class="card__name">${item.name}</div>
</div>
      </div>
      ${item.badge ? `<div class="card__badge">${item.badge}</div>` : ''}
      <div class="card__specs">${specsHtml}</div>
      ${isIncompat ? `<div class="card__incompat-hint">⚠ ${compatReasons[0]}</div>` : ''}
      <div class="card__footer">
<div class="card__price">${item.price.toLocaleString('ru')} <span class="card__price-unit">₽</span></div>
<button class="card__action" tabindex="-1">${isSel ? 'Выбрано' : 'Выбрать'}</button>
      </div>
    `;

        const doSelect = () => {
            const currentIsSel = state.selected[key]?.id === item.id;
            if (currentIsSel) {
                delete state.selected[key];
            } else {
                state.selected[key] = item;
                if (isIncompat) showBanner('warn', compatReasons[0]);
            }
            // Обновляем только классы карточек без анимации перестройки
            updateCardStates(key);
            renderSidebar();
            renderSummary();
        };

        if (!isIncompat) {
            card.addEventListener('click', doSelect);
            card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSelect(); } });
        }

        grid.appendChild(card);
    });

    // Восстанавливаем позицию скролла для таба (0 при первом посещении)
    const container = document.getElementById('cards-container');
    container.scrollTop = state.scrollPos[key] ?? 0;

    // Анимация появления карточек
    const cards = Array.from(grid.querySelectorAll('.card'));
    cards.forEach(c => { c.style.opacity = '0'; c.style.transform = 'translateY(8px)'; });
    window._cardsRafId = requestAnimationFrame(() => {
        cards.forEach((c, i) => {
            c.style.transition = `opacity 200ms ${i * 18}ms cubic-bezier(.25,.46,.45,.94), transform 200ms ${i * 18}ms cubic-bezier(.25,.46,.45,.94)`;
            c.style.opacity = '1';
            c.style.transform = 'translateY(0)';
        });
        window._cardsRafId = null;
    });
}

/* ════════════════════════════════════════════════════════════
   UPDATE CARD STATES (без перестройки DOM)
════════════════════════════════════════════════════════════ */
function updateCardStates(key) {
    const grid = document.getElementById('cards-grid');
    const items = DB[key].items;

    grid.querySelectorAll('.card').forEach(card => {
        const id = card.dataset.id;
        const item = items.find(it => it.id === id);
        if (!item) return;

        const compatReasons = getCompatInfo(key, item);
        const isIncompat = compatReasons.length > 0;
        const isSel = state.selected[key]?.id === id;

        card.classList.toggle('is-selected', isSel);
        card.classList.toggle('is-incompatible', isIncompat);
        card.setAttribute('aria-pressed', isSel);

        const actionBtn = card.querySelector('.card__action');
        if (actionBtn) actionBtn.textContent = isSel ? 'Выбрано' : 'Выбрать';

        let hint = card.querySelector('.card__incompat-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.className = 'card__incompat-hint';
            const footer = card.querySelector('.card__footer');
            if (footer) card.insertBefore(hint, footer);
        }
        hint.style.display = isIncompat ? 'block' : 'none';
        hint.textContent = isIncompat ? `⚠ ${compatReasons[0]}` : '';
    });
}

function renderSummary() {
    const panelList = document.getElementById('panel-list');
    const panelEmpty = document.getElementById('panel-empty');
    const panelFoot = document.getElementById('panel-foot');
    const panelTotal = document.getElementById('panel-total');
    const panelCount = document.getElementById('panel-count');
    const exportBtn = document.getElementById('btn-export');

    const selections = Object.entries(state.selected);
    const hasAny = selections.length > 0;

    // Clear old items
    panelList.querySelectorAll('.build-panel__item').forEach(el => el.remove());

    panelEmpty.style.display = hasAny ? 'none' : '';
    panelFoot.style.display = hasAny ? '' : 'none';
    panelCount.textContent = `${selections.length} / ${CATEGORY_KEYS.length}`;

    let total = 0;
    selections.forEach(([key, item]) => {
        total += item.price;
        const row = document.createElement('div');
        row.className = 'build-panel__item';
        row.innerHTML = `
      <div class="build-panel__icon">${ICONS[key]}</div>
      <div class="build-panel__info">
<div class="build-panel__cat">${DB[key].short}</div>
<div class="build-panel__name" title="${item.name}">${item.name}</div>
      </div>
      <span class="build-panel__price">${item.price.toLocaleString('ru')} ₽</span>
      <button class="build-panel__del" title="Удалить" aria-label="Удалить ${item.name}">
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
        row.querySelector('.build-panel__del').addEventListener('click', e => {
            e.stopPropagation();
            delete state.selected[key];
            updateCardStates(state.activeTab);
            renderSidebar();
            renderSummary();
        });
        panelList.appendChild(row);
    });

    if (panelTotal) panelTotal.textContent = total.toLocaleString('ru') + ' ₽';
    if (exportBtn) exportBtn.disabled = !hasAny;

    // wattage
    let watt = 0;
    CATEGORY_KEYS.forEach(k => { const it = state.selected[k]; if (it?.tdp) watt += it.tdp; });
    const wattEl = document.getElementById('summary-watt-val');
    const wattGroup = document.getElementById('summary-watt-group');
    if (wattEl && wattGroup) {
        if (watt > 0) {
            wattEl.textContent = watt + ' Вт';
            wattEl.classList.toggle('is-high', watt > 700);
            wattGroup.style.display = 'flex';
        } else {
            wattGroup.style.display = 'none';
        }
    }

    // progress bar
    const filled = CATEGORY_KEYS.filter(k => state.selected[k]).length;
    const pct = Math.round(filled / CATEGORY_KEYS.length * 100);
    const bar = document.getElementById('nav-progress-fill');
    if (bar) bar.style.width = pct + '%';

    // nav progress
    const count = selections.length;
    const total_cats = CATEGORY_KEYS.length;
    document.getElementById('nav-progress').textContent =
        count === 0 ? 'Выберите компоненты' :
            count === total_cats ? 'Конфигурация готова!' :
                `Выбрано ${count} из ${total_cats} компонентов`;
}

function renderAll() {
    renderSidebar();
    renderContent();
    renderSummary();
}

/* ════════════════════════════════════════════════════════════
   BANNER
════════════════════════════════════════════════════════════ */
