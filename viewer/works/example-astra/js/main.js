
// в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ CURSOR в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
// ──────────────── CURSOR ────────────────
if (window.matchMedia('(pointer: fine)').matches) {
    const cursor = document.getElementById('cursor');

    document.addEventListener('mousemove', e => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        document.body.classList.remove('cursor-hidden');
    });

    // Скрываем при уходе мыши с окна
    document.addEventListener('mouseleave', () => document.body.classList.add('cursor-hidden'));
    document.addEventListener('mouseenter', () => document.body.classList.remove('cursor-hidden'));

    // Hover-состояние на всех интерактивных элементах
    const hoverTargets = 'a, button, input, select, textarea, label, [role="button"], .price-card, .adv-row, .serv-card, .uc-card';
    document.querySelectorAll(hoverTargets).forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    document.addEventListener('mousedown', () => document.body.classList.add('cursor-click'));
    document.addEventListener('mouseup', () => document.body.classList.remove('cursor-click'));
}

// в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ NAVBAR SCROLL в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ BURGER в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    burger.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger.classList.remove('open');
}));

// в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ COUNTER ANIMATION в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function animateCounter(el, target, duration) {
    let start = 0;
    const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(ease * target);
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

const counters = document.querySelectorAll('.num[data-count]');
let countersStarted = false;

function maybeStartCounters() {
    if (countersStarted) return;
    const bar = document.querySelector('.hero-stats-bar');
    if (!bar) return;
    const heroRect = bar.getBoundingClientRect();
    if (heroRect.top < window.innerHeight) {
        countersStarted = true;
        counters.forEach(el => animateCounter(el, +el.dataset.count, 1600));
    }
}
window.addEventListener('scroll', maybeStartCounters);
maybeStartCounters();

// в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ SCROLL REVEAL в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const reveals = document.querySelectorAll('.reveal, .reveal-l, .reveal-r');
const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
reveals.forEach(el => io.observe(el));

// в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ FORM SUBMIT в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function handleSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('.form-submit');
    btn.textContent = 'вњ“ Р—Р°СЏРІРєР° РѕС‚РїСЂР°РІР»РµРЅР° вЂ” РјС‹ СЃРІСЏР¶РµРјСЃСЏ РІ С‚РµС‡РµРЅРёРµ 30 РјРёРЅСѓС‚';
    btn.style.background = '#1a6b1a';
    btn.disabled = true;
    setTimeout(() => {
        btn.textContent = 'РћС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ вЂ” РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕ';
        btn.style.background = '';
        btn.disabled = false;
        e.target.reset();
    }, 5000);
}

// в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ ACTIVE LINK HIGHLIGHT в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const sections = document.querySelectorAll('section[id]');
const allLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    allLinks.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + current ? 'var(--red)' : '';
    });
});

// ──────────────── PARALLAX HERO GRID ────────────────
window.addEventListener('mousemove', e => {
    const grid = document.querySelector('.hero-grid');
    if (!grid) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 12;
    const y = (e.clientY / window.innerHeight - 0.5) * 12;
    grid.style.transform = `translate(${x}px, ${y}px)`;
});

// ──────────────── UNDERCOVER CARDS FLIP SHUFFLE ────────────────
(function initShuffle() {
    const container = document.getElementById('ucShuffle');
    if (!container) return;

    let shuffleInterval = null;

    function flipShuffle() {
        const cards = Array.from(container.children);
        if (cards.length < 2) return;

        // 1. FIRST — сохраняем текущие rect каждой карточки
        const rectMap = new Map(cards.map(c => [c, c.getBoundingClientRect()]));

        // 2. Fisher-Yates shuffle → переставляем в DOM
        const order = [...cards];
        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
        }
        order.forEach(c => container.appendChild(c)); // reorder DOM

        // 3. LAST — новые rect после reorder
        // 4. Инвертируем сдвиг: ставим карточки визуально туда, где были
        order.forEach(c => {
            const oldRect = rectMap.get(c);
            const newRect = c.getBoundingClientRect();
            const dx = oldRect.left - newRect.left;
            const dy = oldRect.top - newRect.top;
            c.style.transition = 'none';
            c.style.transform = `translate(${dx}px, ${dy}px)`;
        });

        // 5. Force reflow — браузер перерисует с примёнёнными transform
        container.offsetHeight; // eslint-disable-line no-unused-expressions

        // 6. Убираем transform → CSS transition плавно въезжает на 0
        requestAnimationFrame(() => {
            order.forEach(c => {
                c.style.transition = '';
                c.style.transform = '';
            });
        });
    }

    // Запускаем только когда секция видима
    const sectionObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                if (!shuffleInterval) {
                    setTimeout(flipShuffle, 800); // первый запуск с задержкой
                    shuffleInterval = setInterval(flipShuffle, 2800);
                }
            } else {
                clearInterval(shuffleInterval);
                shuffleInterval = null;
            }
        });
    }, { threshold: 0.3 });

    sectionObs.observe(container.closest('section') || container);
})();

// ─── Custom Select ─────────────────────────────────────────────
(function initCustomSelects() {
    document.querySelectorAll('select').forEach(sel => {
        const wrap = document.createElement('div');
        wrap.className = 'custom-select-wrap';
        sel.parentNode.insertBefore(wrap, sel);
        wrap.appendChild(sel);
        sel.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:0;height:0;';
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        trigger.innerHTML = `<span>${sel.options[0]?.text || ''}</span><svg class="cs-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        wrap.appendChild(trigger);
        const panel = document.createElement('div');
        panel.className = 'custom-select-panel';
        Array.from(sel.options).forEach((opt, i) => {
            const item = document.createElement('div');
            item.className = 'custom-select-option' + (i === 0 ? ' placeholder' : '');
            item.textContent = opt.text;
            item.dataset.value = opt.value;
            item.addEventListener('click', () => {
                sel.value = opt.value;
                trigger.querySelector('span').textContent = opt.text;
                trigger.classList.toggle('has-value', opt.value !== '');
                panel.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('active'));
                item.classList.add('active');
                panel.classList.remove('open'); trigger.classList.remove('open');
            });
            panel.appendChild(item);
        });
        wrap.appendChild(panel);
        trigger.addEventListener('click', e => {
            e.stopPropagation();
            const wasOpen = panel.classList.contains('open');
            document.querySelectorAll('.custom-select-panel.open').forEach(p => {
                p.classList.remove('open'); p.previousElementSibling.classList.remove('open');
            });
            if (!wasOpen) { panel.classList.add('open'); trigger.classList.add('open'); }
        });
    });
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-panel.open').forEach(p => {
            p.classList.remove('open'); p.previousElementSibling.classList.remove('open');
        });
    });
})();
