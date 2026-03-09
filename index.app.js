(function () {
    const TOTAL = 5;
    const DARK = new Set([3]); // slides with dark bg (0-indexed)

    let cur = 0, busy = false, transitioning = false, tyY = 0, tyX = 0;

    const wrap = document.getElementById('fp-wrap');
    const bar = document.getElementById('progress');
    const counter = document.getElementById('slide-counter');
    const dotEls = document.querySelectorAll('.dot');
    const inners = document.querySelectorAll('.slide-inner');
    // bg layers move at 0.6x — real parallax
    // ВАЖНО: элементы с filter:blur НЕ входят в массив —
    // transform-transition на blur-элементах = CPU repaint каждый кадр в Firefox
    const bgLayers = [
        document.querySelector('#s1 .hero-blob-wrap'),
        document.querySelector('#s2 .s2-grid-bg'),
        document.querySelector('#s3 .s3-lines'),
        null, // .s4-glow — filter:blur(70px)
        null  // .s5-blob — filter:blur(80px)
    ];
    const s4Grid = document.querySelector('#s4 .s4-grid');
    let gridX = 0, gridY = 0, gridStr = 0; // интерполированная позиция и сила линзы для канваса S4
    let s4Canvas = null, s4Ctx = null, s4Dpr = 1, _s4DrawX = -9999, _s4DrawY = -9999;
    let s4VignGrad = null, _s4VignW = -1, _s4VignH = -1; // кэш виньетки — пересоздаётся лишь при resize
    if (s4Grid) {
        s4Canvas = document.createElement('canvas');
        s4Canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
        s4Grid.appendChild(s4Canvas);
        s4Ctx = s4Canvas.getContext('2d');
    }

    // dvh корректно учитывает browser UI на мобильных (Chrome 108+), vh — fallback
    const slideUnit = CSS.supports('height', '100dvh') ? 'dvh' : 'vh';
    // fallback: ensure correct initial positions
    document.querySelectorAll('.slide').forEach((el, i) => { el.style.top = (i * 100) + slideUnit; });

    function goTo(idx) {
        if (busy || idx === cur || idx < 0 || idx >= TOTAL) return;
        busy = true; transitioning = true;
        const prev = cur;
        cur = idx;
        const dir = cur > prev ? 1 : -1;

        // флаг для других RAF-циклов (star IIFE) — они должны сделать паузу
        window._fpSliding = true;
        tHead = 0; tSize = 0;
        if (trailCtx) trailCtx.clearRect(0, 0, trailW, trailH);
        // GPU-promotion для анимируемой пары слайдов — особенно важно на мобайле
        if (inners[prev]) inners[prev].style.willChange = 'transform, opacity';
        if (inners[cur])  inners[cur].style.willChange  = 'transform, opacity';

        // Скрываем scroll-hint при уходе с главной
        if (prev === 0) {
            const hint = document.getElementById('scroll-hint');
            if (hint) {
                hint.style.opacity = '1';        // фиксируем 1 ДО снятия анимации
                hint.style.animation = 'none';   // снимаем forwards-fill
                void hint.offsetHeight;          // reflow
                hint.style.transition = 'opacity 0.3s ease';
                hint.style.opacity = '0';
                setTimeout(() => hint.remove(), 350);
            }
        }

        // Плавная подсветка "любой" на слайде #s2 — только при первом посещении
        if (cur === 1 && !document.body.classList.contains('anim-s2')) {
            requestAnimationFrame(() => document.body.classList.add('anim-s2'));
        }

        // Котик пробегает по слайду #s3 — только один раз
        if (cur === 2) {
            const cat = document.querySelector('.s3-cat');
            if (cat && !cat.classList.contains('cat-run')) {
                requestAnimationFrame(() => cat.classList.add('cat-run'));
            }
        }

        // OUT: outgoing content
        if (inners[prev]) {
            inners[prev].style.transform = `translateY(${dir * -60}px)`;
            inners[prev].style.opacity = '0';
        }

        // outgoing bg: opposite direction at 0.6x
        const bgEl = bgLayers[prev];
        if (bgEl) {
            bgEl.style.transition = `transform var(--dur) var(--ease)`;
            bgEl.style.transform = `translateY(${dir * -36}px)`;
        }

        // incoming bg: starts offset, then settles
        const bgIn = bgLayers[cur];
        if (bgIn) {
            bgIn.style.transition = 'none';
            bgIn.style.transform = `translateY(${dir * 36}px)`;
        }

        // IN: incoming content
        if (inners[cur]) {
            inners[cur].style.transition = 'none';
            inners[cur].style.transform = `translateY(${dir * 60}px)`;
            inners[cur].style.opacity = '0';
            requestAnimationFrame(() => requestAnimationFrame(() => {
                if (bgIn) {
                    bgIn.style.transition = `transform var(--dur) var(--ease)`;
                    bgIn.style.transform = 'translateY(0)';
                }
                inners[cur].style.transition = '';
                inners[cur].style.transform = 'translateY(0)';
                inners[cur].style.opacity = '1';
                // defer body-class style-recalc на 2 кадра — не засоряет первый commit
                document.body.classList.toggle('s4', DARK.has(cur));
                document.body.classList.toggle('on-home', cur === 0);
            }));
        }

        wrap.style.transform = `translateY(${-cur * 100}${slideUnit})`;
        bar.style.transform = `scaleX(${cur / (TOTAL - 1)})`;
        counter.textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(TOTAL).padStart(2, '0');

        for (let i = 0; i < dotEls.length; i++) dotEls[i].classList.toggle('active', i === cur);

        setTimeout(() => {
            if (inners[prev]) {
                // transition:none — не даём запуститься обратной 0.75s анимации на невидимом слайде
                inners[prev].style.transition = 'none';
                inners[prev].style.transform = 'translateY(0)';
                inners[prev].style.opacity = '1';
                inners[prev].style.willChange = ''; // высвобождаем GPU-слой у ушедшего слайда
                requestAnimationFrame(() => { inners[prev].style.transition = ''; });
            }
            if (bgEl) {
                bgEl.style.transition = 'none';
                bgEl.style.transform = 'translateY(0)';
            }
            window._fpSliding = false;
            // если пришли на слайд 4 — снапаем gridX/Y к текущей позиции курсора
            // lerp (коэфф 0.03) будет интерполировать уже от точной точки — нет "проплыва
            if (cur === 3 && isPointerFine) { gridX = mx; gridY = my; gridStr = 0; _s4DrawX = -9999; }
            transitioning = false; busy = false;
        }, 820);
    }

    window.goTo = goTo;
    bar.style.transform = 'scaleX(0)';

    // hide non-first slides before first animation
    inners.forEach((el, i) => {
        if (i > 0) {
            el.style.transition = 'none';
            el.style.opacity = '0';
            el.style.transform = 'translateY(60px)';
        }
    });
    // delay on-home so CSS transition fires
    setTimeout(() => document.body.classList.add('on-home'), 50);


    /* ── Wheel ── */
    let wA = 0, wT = null;
    window.addEventListener('wheel', e => {
        e.preventDefault();
        wA += e.deltaY;
        clearTimeout(wT);
        wT = setTimeout(() => { wA = 0; }, 130);
        if (Math.abs(wA) >= 55) { wA = 0; goTo(cur + (e.deltaY > 0 ? 1 : -1)); }
    }, { passive: false });

    /* ── Keyboard ── */
    window.addEventListener('keydown', e => {
        if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); goTo(cur + 1); }
        else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goTo(cur - 1); }
        else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
        else if (e.key === 'End') { e.preventDefault(); goTo(TOTAL - 1); }
    });

    /* ── Touch (slide navigation) ── */
    window.addEventListener('touchstart', e => {
        tyY = e.touches[0].clientY;
        tyX = e.touches[0].clientX;
    }, { passive: true });
    window.addEventListener('touchend', e => {
        const dy = tyY - e.changedTouches[0].clientY;
        const dx = tyX - e.changedTouches[0].clientX;
        // внутри карусели горизонтальные свайпы — её дело; вертикальные — переключают слайд
        if (e.target.closest('.svc-carousel-wrap') && Math.abs(dx) >= Math.abs(dy)) return;
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 42) goTo(cur + (dy > 0 ? 1 : -1));
    }, { passive: true });

    /* ── Custom cursor — pointer devices only ── */
    const dot = document.getElementById('cursor-dot');
    let mx = -200, my = -200;
    let hovering = false, clicking = false, blobPx = 0, blobPy = 0;
    let sd = 1;
    const blobs = document.querySelectorAll('.hero-blob');
    const isPointerFine = window.matchMedia('(pointer: fine)').matches;

    // skip trail until mouse moves — prevents corner-shoot on load
    let trailActive = false;
    let _lastMoveTime = 0, _lastMoveX = 0, _lastMoveY = 0; // проверка телепорта

    document.addEventListener('mousemove', e => {
        trailActive = true;
        const now = performance.now();
        const dx = e.clientX - _lastMoveX, dy = e.clientY - _lastMoveY;
        // если пауза >50мс и прыжок >100px (выход из окна или из devtools) — сбрасываем хвост
        if (now - _lastMoveTime > 50 && dx * dx + dy * dy > 10000) {
            tHead = 0; tSize = 0;
            if (trailCtx) trailCtx.clearRect(0, 0, trailW, trailH);
        }
        _lastMoveTime = now; _lastMoveX = e.clientX; _lastMoveY = e.clientY;
        mx = e.clientX; my = e.clientY;
        // восстанавливаем видимость, если курсор был скрыт (выход из devtools и т.п.)
        if (dot.style.opacity === '0') {
            dot.style.opacity = '1';
            if (trailCanvas) trailCanvas.style.opacity = '1';
        }
        if (cur === 0) {
            blobPx = (e.clientX / window.innerWidth - .5) * 2;
            blobPy = (e.clientY / window.innerHeight - .5) * 2;
        }
    }, { passive: true });

    /* ── Particles (S1 only) ── */
    const particleCanvas = document.getElementById('neural-canvas');
    let pCtx = null, particles = [], pW = 0, pH = 0;

    if (particleCanvas) {
        pCtx = particleCanvas.getContext('2d');

        function initParticles() {
            pW = particleCanvas.offsetWidth;
            pH = particleCanvas.offsetHeight;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            particleCanvas.width = Math.round(pW * dpr);
            particleCanvas.height = Math.round(pH * dpr);
            pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // Кол-во узлов пропорционально площади относительно эталона 1440×900 —
            // на маленьком экране визуальная плотность остаётся той же
            const REF = 1440 * 900;
            const finalCount = Math.max(Math.min(Math.round((pW * pH / REF) * 200), 320), 30);
            // Jittered grid: делим canvas на ячейки, одна частица на ячейку → нет проплешин
            const cols = Math.round(Math.sqrt(finalCount * (pW / pH)));
            const rows = Math.ceil(finalCount / cols);
            const cellW = pW / cols, cellH = pH / rows;
            particles = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (particles.length >= finalCount) break;
                    const ox = (c + 0.1 + Math.random() * 0.8) * cellW;
                    const oy = (r + 0.1 + Math.random() * 0.8) * cellH;
                    const depth = 0.3 + Math.random() * 0.7;
                    particles.push({ x: ox, y: oy, ox, oy, vx: 0, vy: 0, r: 0.7 + depth * 1.4, depth, phase: Math.random() * 6.2832 });
                }
            }
        }

        initParticles();
        window.addEventListener('resize', initParticles, { passive: true });
        setTimeout(() => document.getElementById('s1').classList.add('neural-ready'), 600);
    }

    // Параметры constellation
    const CONN_D2 = 95 * 95;         // дистанция соединения² — кучнее, меньше «длинных» линий
    const GRAV_R = 200, GRAV_R2 = 200 * 200;
    const TORCH_R = 220;

    function drawParticles(t) {
        if (!pCtx || !particles.length) return;
        pCtx.clearRect(0, 0, pW, pH);

        // ── Физика: медленный органический дрейф + гравитация курсора + toroidal wrap
        for (const p of particles) {
            p.vx += Math.sin(t * 0.11 * p.depth + p.phase) * 0.014; // медленнее ×0.44
            p.vy += Math.cos(t * 0.085 * p.depth + p.phase * 1.37) * 0.012;
            p.vx += Math.cos(t * 0.045 + p.phase * 2.1) * 0.006;
            p.vy += Math.sin(t * 0.065 + p.phase * 0.73) * 0.006;
            if (isPointerFine && trailActive) {
                const gdx = mx - p.x, gdy = my - p.y, gd2 = gdx * gdx + gdy * gdy;
                if (gd2 < GRAV_R2 && gd2 > 1) {
                    const gd = Math.sqrt(gd2);
                    const gf = 0.007 * p.depth * (1 - gd / GRAV_R);
                    p.vx += gdx / gd * gf; p.vy += gdy / gd * gf;
                }
            }
            const spd2 = p.vx * p.vx + p.vy * p.vy;
            if (spd2 > 0.8 * 0.8) { const s = 0.8 / Math.sqrt(spd2); p.vx *= s; p.vy *= s; } // предел скорости ×0.44
            p.vx *= 0.988; p.vy *= 0.988;
            p.x += p.vx; p.y += p.vy;
            if (p.x < -10) p.x = pW + 10;
            else if (p.x > pW + 10) p.x = -10;
            if (p.y < -10) p.y = pH + 10;
            else if (p.y > pH + 10) p.y = -10;
        }

        if (!isPointerFine || !trailActive) return;

        // ── Линии: светлый оттенок + низкий alpha = мягкое акварельное свечение
        pCtx.strokeStyle = 'rgb(168,158,255)';
        pCtx.lineWidth = 0.7;
        pCtx.globalAlpha = 0.38;
        pCtx.beginPath();
        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];
            for (let j = i + 1; j < particles.length; j++) {
                const b = particles[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                if (dx * dx + dy * dy < CONN_D2) { pCtx.moveTo(a.x, a.y); pCtx.lineTo(b.x, b.y); }
            }
        }
        pCtx.stroke();

        // ── Точки: тот же светлый тон
        pCtx.fillStyle = 'rgb(168,158,255)';
        for (const p of particles) {
            pCtx.globalAlpha = 0.45 + p.depth * 0.30;
            pCtx.beginPath();
            pCtx.arc(p.x, p.y, p.r * 0.75, 0, 6.2832);
            pCtx.fill();
        }

        // ── Маска «факел»
        const torch = pCtx.createRadialGradient(mx, my, 0, mx, my, TORCH_R);
        torch.addColorStop(0.0, 'rgba(0,0,0,1)');
        torch.addColorStop(0.62, 'rgba(0,0,0,0.88)');
        torch.addColorStop(1.0, 'rgba(0,0,0,0)');
        pCtx.globalCompositeOperation = 'destination-in';
        pCtx.fillStyle = torch;
        pCtx.fillRect(0, 0, pW, pH);
        pCtx.globalCompositeOperation = 'source-over';
        pCtx.globalAlpha = 1;
    }
    const TRAIL_LEN = 22;          // размер кольцевого буфера
    const TRAIL_LIFE = 200;        // время жизни точки, мс
    const INV_TRAIL_LIFE = 1 / TRAIL_LIFE; // кэш обратной величины для делений в trail hot loop
    // circular buffer без GC: не создаём новых объектов 60 раз/с, переиспользуем существующие
    const TBUF = Array.from({ length: TRAIL_LEN }, () => ({ x: 0, y: 0, t: 0 }));
    let tHead = 0, tSize = 0; // голова и заполненность буфера
    let clickScale = 1;          // пунч точки при клике — затухает обратно через lerp
    const clickRipples = [];     // [{x, y, t}] — кольца-всплески на trailCanvas
    let trailCanvas = null, trailCtx = null; // null на мобиле (no pointer:fine)
    let trailW = 0, trailH = 0; // логические CSS-пиксели, используются в clearRect

    if (isPointerFine) {
        trailCanvas = document.createElement('canvas');
        // CSS: 100vw/100vh — canvas всегда физически покрывает весь viewport без JS.
        // ResizeObserver стреляет УЖЕ после layout — bitmap и CSS-размер всегда синхронны,
        // никакого race condition нет (resize event + RAF не успевали — RO успевает).
        trailCanvas.style.cssText =
            'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:100001;';
        document.body.appendChild(trailCanvas);
        trailCtx = trailCanvas.getContext('2d');

        const syncTrailBitmap = (w, h) => {
            const dpr = window.devicePixelRatio || 1;
            trailW = w;
            trailH = h;
            trailCanvas.width = Math.round(w * dpr);
            trailCanvas.height = Math.round(h * dpr);
            trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // canvas.width/height сбрасывают все состояние — восстанавливаем постоянные свойства
            trailCtx.lineCap = 'round';
            trailCtx.lineJoin = 'round';
            tHead = 0; tSize = 0; // старые точки устарели — чистим буфер
        };

        // первоначальная установка bitmap по фактическому размеру viewport
        syncTrailBitmap(window.innerWidth, window.innerHeight);

        // ResizeObserver — единственно надёжный способ:
        // стреляет после layout, передаёт реальный CSS-размер элемента.
        if (window.ResizeObserver) {
            new ResizeObserver(entries => {
                const r = entries[0].contentRect;
                syncTrailBitmap(r.width, r.height);
            }).observe(trailCanvas);
        } else {
            // fallback для старых браузеров
            window.addEventListener('resize', () => {
                syncTrailBitmap(window.innerWidth, window.innerHeight);
            }, { passive: true });
        }
    }

    /* ── Dot proximity — cache positions so scale doesn't shift center ── */
    let dotCache = [];
    function cacheDots() {
        // reset transforms before measuring
        dotEls.forEach(d => { d.style.transform = ''; d.style.background = ''; });
        // defer so browser applies reset first
        requestAnimationFrame(() => {
            dotCache = Array.from(dotEls).map(d => {
                const r = d.getBoundingClientRect();
                return { el: d, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
            });
        });
    }
    cacheDots();
    window.addEventListener('resize', cacheDots, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', cacheDots, { passive: true });
    }

    function updateDotMag() {
        const PROX = 60, PROX2 = 3600, invPROX = 1 / 60;
        for (let i = 0; i < dotCache.length; i++) {
            const { el, cx, cy } = dotCache[i];
            if (el.classList.contains('active')) { el.style.background = ''; continue; }
            const dx = mx - cx, dy = my - cy, dist2 = dx * dx + dy * dy;
            if (dist2 < PROX2) {
                const t = 1 - Math.sqrt(dist2) * invPROX;
                el.style.background = `rgba(124,110,245,${(t * 0.65).toFixed(2)})`;
            } else {
                el.style.background = '';
            }
        }
    }

    // позиция мыши на момент последнего вызова updateDotMag — пропускаем если не изменилась
    let _dotMx = -9999, _dotMy = -9999;

    /* ── s4 grid: canvas fish-eye ── */
    function initS4Canvas() {
        if (!s4Canvas || !s4Grid) return;
        s4Dpr = Math.min(window.devicePixelRatio || 1, 2);
        s4Canvas.width = Math.round(s4Grid.offsetWidth * s4Dpr);
        s4Canvas.height = Math.round(s4Grid.offsetHeight * s4Dpr);
        s4Ctx.setTransform(s4Dpr, 0, 0, s4Dpr, 0, 0);
        _s4DrawX = -9999;
        // рисуем статичный центральный кадр сразу — сетка видна ещё до перехода на слайд 4;
        // на десктопе динамика подхватит плавно (через lerp gridX/gridY) как только придём на слайд
        const CW = s4Canvas.width / s4Dpr, CH = s4Canvas.height / s4Dpr;
        drawS4Grid(CW / 2, CH / 2, 0);
    }
    requestAnimationFrame(initS4Canvas);
    window.addEventListener('resize', initS4Canvas, { passive: true });

    function drawS4Grid(lx, ly, str) {
        if (!s4Canvas || !s4Ctx || s4Canvas.width === 0) return;
        const CW = s4Canvas.width / s4Dpr, CH = s4Canvas.height / s4Dpr;
        s4Ctx.clearRect(0, 0, CW, CH);
        const R = 450, R2 = R * R, invR = 1 / R, CELL = 54, STEP = 10;
        s4Ctx.strokeStyle = 'rgba(124,110,245,0.12)';
        s4Ctx.lineWidth = 1;
        // вертикальные линии
        for (let x = CELL; x < CW; x += CELL) {
            s4Ctx.beginPath();
            for (let y = 0; y <= CH; y += STEP) {
                const dx = x - lx, dy = y - ly, d2 = dx * dx + dy * dy;
                let nx = x, ny = y;
                if (str > 0 && d2 < R2 && d2 > 0.01) { const t = 1 - Math.sqrt(d2) * invR; const f = 1 + str * t * t; nx = lx + dx * f; ny = ly + dy * f; }
                y === 0 ? s4Ctx.moveTo(nx, ny) : s4Ctx.lineTo(nx, ny);
            }
            s4Ctx.stroke();
        }
        // горизонтальные линии
        for (let y = CELL; y < CH; y += CELL) {
            s4Ctx.beginPath();
            for (let x = 0; x <= CW; x += STEP) {
                const dx = x - lx, dy = y - ly, d2 = dx * dx + dy * dy;
                let nx = x, ny = y;
                if (str > 0 && d2 < R2 && d2 > 0.01) { const t = 1 - Math.sqrt(d2) * invR; const f = 1 + str * t * t; nx = lx + dx * f; ny = ly + dy * f; }
                x === 0 ? s4Ctx.moveTo(nx, ny) : s4Ctx.lineTo(nx, ny);
            }
            s4Ctx.stroke();
        }
        // виньетка — градиент кэшируется, пересоздаётся только при изменении размера canvas
        if (s4VignGrad === null || _s4VignW !== CW || _s4VignH !== CH) {
            _s4VignW = CW; _s4VignH = CH;
            const gx = CW / 2, gy = CH / 2, gr = Math.sqrt(gx * gx + gy * gy) * 0.96;
            s4VignGrad = s4Ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
            s4VignGrad.addColorStop(0, 'rgba(0,0,0,1)');
            s4VignGrad.addColorStop(0.65, 'rgba(0,0,0,0.4)');
            s4VignGrad.addColorStop(1, 'rgba(0,0,0,0)');
        }
        s4Ctx.globalCompositeOperation = 'destination-in';
        s4Ctx.fillStyle = s4VignGrad;
        s4Ctx.fillRect(0, 0, CW, CH);
        s4Ctx.globalCompositeOperation = 'source-over';
    }

    /* single RAF loop */
    let rafId;
    let _prevMx = -9999, _prevMy = -9999, _prevSd = -9999;
    function tick() {
        const now = performance.now();

        if (isPointerFine && dot) {
            const tsd = hovering ? 0.5 : 1;
            sd += (tsd - sd) * 0.18;
            if (clickScale > 1.002) clickScale += (1 - clickScale) * 0.14; else clickScale = 1;
            // пишем в DOM только при реальном изменении — избегаем лишних layout/paint
            if (mx !== _prevMx || my !== _prevMy || Math.abs(sd * clickScale - _prevSd) > 0.0005) {
                dot.style.transform = `translate(${mx}px,${my}px) scale(${sd * clickScale})`;
                _prevMx = mx; _prevMy = my; _prevSd = sd * clickScale;
            }
        }

        if (cur === 0) {
            const t = now * 0.001;
            const b1x = Math.sin(t * 0.2856) * 20, b1y = Math.cos(t * 0.2856) * 14;
            const b1s = 1 + Math.sin(t * 0.5712) * 0.04;
            const b2x = Math.sin(t * 0.2244 + 1.2) * 19, b2y = Math.cos(t * 0.2244 + 0.7) * 14;
            const b2s = 1 + Math.sin(t * 0.1122) * 0.065;
            const b3x = Math.sin(t * 0.3491 + 2.1) * 16, b3y = Math.cos(t * 0.3491 + 0.5) * 19;
            // пишем в DOM только если блоб реально сдвинулся (> 0.15пк) — избегаем лишних style при неподвижной мыши
            const nx0 = blobPx * 20 + b1x, ny0 = blobPy * 13 + b1y;
            const nx1 = blobPx * -13 + b2x, ny1 = blobPy * 9 + b2y;
            const nx2 = blobPx * 9 + b3x, ny2 = blobPy * -16 + b3y;
            if (blobs[0]) blobs[0].style.transform = `translate(${nx0}px,${ny0}px) scale(${b1s})`;
            if (blobs[1]) blobs[1].style.transform = `translate(${nx1}px,${ny1}px) scale(${b2s})`;
            if (blobs[2]) blobs[2].style.transform = `translate(${nx2}px,${ny2}px)`;
            if (!transitioning) drawParticles(t); // пропускаем O(n²) physics во время перехода слайдов
        }

        /* ── Trail ── */
        // trail рендерится всегда: position:fixed, собственный GPU-слой —
        // не мешает переходу слайдов; буфер сброшен в goTo(), хвост отрастает плавно
        if (trailCtx && trailActive) {
            // запись в circular buffer — нет аллокации объектов, нет shift() O(n)
            TBUF[tHead].x = mx; TBUF[tHead].y = my; TBUF[tHead].t = now;
            tHead = (tHead + 1) % TRAIL_LEN;
            if (tSize < TRAIL_LEN) tSize++;

            trailCtx.clearRect(0, 0, trailW, trailH);

            // ── Click ripples ──
            const RIPPLE_DUR = 520;
            for (let i = clickRipples.length - 1; i >= 0; i--) {
                const rp = clickRipples[i];
                const age = now - rp.t;
                if (age < 0) continue; // delayed echo ещё не настал
                if (age > RIPPLE_DUR) { clickRipples.splice(i, 1); continue; }
                const prog = age / RIPPLE_DUR;
                const eased = 1 - Math.pow(1 - prog, 3); // ease-out cubic
                const radius = 3 + eased * (rp.echo ? 28 : 46);
                const alpha = (1 - prog) * (rp.echo ? 0.38 : 0.62);
                // кольцо
                trailCtx.beginPath();
                trailCtx.arc(rp.x, rp.y, radius, 0, 6.2832);
                trailCtx.strokeStyle = `rgba(180,148,255,${alpha.toFixed(3)})`;
                trailCtx.lineWidth = rp.echo ? 0.8 : 1.4;
                trailCtx.stroke();
                // внутренняя вспышка (flash) — только у главного
                if (!rp.echo && prog < 0.4) {
                    const flashA = (1 - prog / 0.4) * 0.16;
                    const grad = trailCtx.createRadialGradient(rp.x, rp.y, 0, rp.x, rp.y, 3 + eased * 22);
                    grad.addColorStop(0, `rgba(220,200,255,${flashA.toFixed(3)})`);
                    grad.addColorStop(1, 'rgba(167,139,250,0)');
                    trailCtx.fillStyle = grad;
                    trailCtx.beginPath();
                    trailCtx.arc(rp.x, rp.y, 3 + eased * 22, 0, 6.2832);
                    trailCtx.fill();
                }
            }

            const len = tSize;

            if (len > 1) {
                const lastIdx = len - 1;
                const tBase = (tHead - len + TRAIL_LEN) % TRAIL_LEN; // индекс старейшей точки
                const invLastIdx = 1 / lastIdx; // кэш деления — i/lastIdx → i*invLastIdx в hot loop

                // pass 1 — wide soft glow
                for (let i = 1; i < len; i++) {
                    const pb = TBUF[(tBase + i) % TRAIL_LEN];
                    const a = Math.max(0, 1 - (now - pb.t) * INV_TRAIL_LIFE);
                    if (a <= 0) continue;
                    const pa = TBUF[(tBase + i - 1) % TRAIL_LEN];
                    const prog = i * invLastIdx;
                    trailCtx.beginPath();
                    trailCtx.moveTo(pa.x, pa.y);
                    trailCtx.lineTo(pb.x, pb.y);
                    trailCtx.strokeStyle = `rgba(104,60,240,${a * prog * 0.28})`;
                    trailCtx.lineWidth = 2 + prog * 16;
                    trailCtx.stroke();
                }

                // pass 2 — bright core spine
                for (let i = 1; i < len; i++) {
                    const pb = TBUF[(tBase + i) % TRAIL_LEN];
                    const a = Math.max(0, 1 - (now - pb.t) * INV_TRAIL_LIFE);
                    if (a <= 0) continue;
                    const pa = TBUF[(tBase + i - 1) % TRAIL_LEN];
                    const prog = i * invLastIdx;
                    trailCtx.beginPath();
                    trailCtx.moveTo(pa.x, pa.y);
                    trailCtx.lineTo(pb.x, pb.y);
                    trailCtx.strokeStyle = `rgba(200,170,255,${a * prog * 0.75})`;
                    trailCtx.lineWidth = 0.8 + prog * 2.5;
                    trailCtx.stroke();
                }
            }
        }

        /* dot proximity magnetism — пауза во время перехода (экономим DOM-writes) */
        if (isPointerFine && !busy && (mx !== _dotMx || my !== _dotMy)) {
            _dotMx = mx; _dotMy = my;
            updateDotMag();
        }

        /* s4 grid fish-eye: gridStr lerp-ится к 0.07 на слайде 4 (плавный fade-in)
           и к 0 при уходе (плавный fade-out).  drawS4Grid вызывается только
           пока есть изменения (cursor / gridStr) — не нагружает Firefox паразитными repaint'ami */
        if (s4Canvas && isPointerFine) {
            const onS4 = cur === 3 && !transitioning;
            const prevStr = gridStr;
            gridStr += ((onS4 ? 0.07 : 0) - gridStr) * 0.05;
            if (onS4) {
                gridX += (mx - gridX) * 0.03;
                gridY += (my - gridY) * 0.03;
            }
            const strChanged = Math.abs(gridStr - prevStr) > 0.0003;
            const posChanged = Math.abs(gridX - _s4DrawX) > 0.2 || Math.abs(gridY - _s4DrawY) > 0.2;
            if ((strChanged || posChanged) && gridStr > 0.0005) {
                _s4DrawX = gridX; _s4DrawY = gridY;
                drawS4Grid(gridX + 30, gridY + 30, gridStr);
            } else if (strChanged && gridStr <= 0.0005 && prevStr > 0.0005) {
                // полное затухание — рисуем чистый статичный кадр
                _s4DrawX = -9999;
                drawS4Grid(s4Canvas.width / s4Dpr / 2, s4Canvas.height / s4Dpr / 2, 0);
            }
        }

        rafId = requestAnimationFrame(tick);
    }
    tick();

    /* ── RAF lifecycle helpers ── */
    function stopLoop() {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    function restartLoop() {
        tHead = 0; tSize = 0; // сбрасываем буфер, чтобы не было «призрака»
        trailActive = false;
        tick();
    }

    /* пауза RAF при скрытой вкладке; надёжный перезапуск при показе */
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopLoop();
        else if (!rafId) restartLoop();
    });

    // bfcache-восстановление (кнопки «назад/вперёд» браузера)
    window.addEventListener('pageshow', e => {
        if (e.persisted) { stopLoop(); restartLoop(); }
    });

    document.addEventListener('mousedown', () => {
        clicking = true;
        if (isPointerFine) {
            clickScale = 2.8; // пунч точки — плавно затухает через lerp в tick()
            const t = performance.now();
            clickRipples.push({ x: mx, y: my, t });           // главное кольцо
            clickRipples.push({ x: mx, y: my, t: t + 120, echo: true }); // эхо
        }
    }, { passive: true });
    document.addEventListener('mouseup', () => { clicking = false; }, { passive: true });
    document.addEventListener('mouseleave', () => {
        // Firefox ложно стреляет mouseleave во время CSS-transition на fp-wrap:
        // hit-test перестраивается пока контент движется → курсор пропадает на весь переход
        if (busy) return;
        dot.style.opacity = '0';
        if (trailCanvas) trailCanvas.style.opacity = '0';
        // сбрасываем буфер и флаг — при возврате курсора в другом месте
        // не будет мгновенной черты через весь экран
        tHead = 0; tSize = 0;
        trailActive = false;
    }, { passive: true });
    document.addEventListener('mouseenter', () => {
        dot.style.opacity = '1';
        if (trailCanvas) trailCanvas.style.opacity = '1';
    }, { passive: true });

    /* ── Scroll hint ── */
    const hint = document.getElementById('scroll-hint');
    if (hint) {
        const hideHint = () => {
            hint.style.opacity = '1';        // фиксируем 1 ДО снятия анимации
            hint.style.animation = 'none';   // снимаем forwards-fill
            void hint.offsetHeight;          // reflow
            hint.style.transition = 'opacity 0.4s ease';
            hint.style.opacity = '0';
            setTimeout(() => hint.remove(), 450);
        };
        setTimeout(() => {
            window.addEventListener('wheel', hideHint, { once: true });
            window.addEventListener('keydown', hideHint, { once: true });
            window.addEventListener('touchend', hideHint, { once: true });
        }, 2400);
    }

    /* ── Carousel ── */
    const svcTrack = document.getElementById('svc-track');
    const svcWrap = svcTrack ? svcTrack.closest('.svc-carousel-wrap') : null;
    const svcPips = document.querySelectorAll('.svc-pip');
    let svcIdx = 1; // CSS starts at translateX(-100%) = card 1

    const svcCardCount = svcTrack ? svcTrack.querySelectorAll('.svc-card').length : 0;
    function svcGoTo(idx) {
        if (idx < 0 || idx >= svcCardCount) return;
        svcIdx = idx;
        svcTrack.style.transform = `translateX(${-svcIdx * 100}%)`;
        for (let i = 0; i < svcPips.length; i++) svcPips[i].classList.toggle('svc-pip-active', i === svcIdx);
    }

    // click works instantly on mobile when touch-action:manipulation is set in CSS
    const svcPrevEl = document.getElementById('svc-prev');
    const svcNextEl = document.getElementById('svc-next');
    if (svcPrevEl) svcPrevEl.addEventListener('click', () => svcGoTo(svcIdx - 1));
    if (svcNextEl) svcNextEl.addEventListener('click', () => svcGoTo(svcIdx + 1));

    // swipe — global window handler already ignores .svc-carousel-wrap touches
    if (svcWrap) {
        let cTX = 0, cTY = 0;
        svcWrap.addEventListener('touchstart', e => {
            cTX = e.touches[0].clientX;
            cTY = e.touches[0].clientY;
        }, { passive: true });
        svcWrap.addEventListener('touchend', e => {
            const dx = cTX - e.changedTouches[0].clientX;
            const dy = cTY - e.changedTouches[0].clientY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30)
                svcGoTo(svcIdx + (dx > 0 ? 1 : -1));
        }, { passive: true });
    }

})();


/* ══════════════════════════════════════════════════════════════════════ */


(function () {
    var loader = document.getElementById('page-loader');
    if (!loader) return;

    var fill = loader.querySelector('.pl-bar-fill');
    var progress = 0;
    var startTime = Date.now();
    var fontsReady = false;

    // Имитация прогресса: первый тик +20% через 900мс,
    // каждый следующий тик в 1.6× медленнее и добавляет в 1.6× меньше.
    // Естественно «зависает» около 88% — резкий рывок до 100% при готовности шрифтов.
    function step(amount, delay) {
        setTimeout(function () {
            if (fontsReady) return;
            progress = Math.min(progress + amount, 88);
            if (fill) fill.style.width = progress + '%';
            step(amount / 1.6, delay * 1.6);
        }, delay);
    }
    step(20, 900);

    function complete() {
        if (fontsReady) return;
        fontsReady = true;
        var wait = Math.max(0, 300 - (Date.now() - startTime)); // минимум 300мс показа
        setTimeout(function () {
            if (fill) fill.style.width = '100%';   // резкий финальный рывок
            setTimeout(hideLoader, 400);            // ждём transition (0.65s), потом fade
        }, wait);
    }

    function hideLoader() {
        loader.classList.add('is-hidden');
        // 520мс > длительность CSS opacity transition (500мс) — лоадер уже полностью невидим
        setTimeout(function () {
            if (loader.parentNode) loader.remove();
            document.body.classList.add('hero-ready'); // запускает fade-up анимации героя
        }, 520);
    }

    var t = setTimeout(complete, 3500); // fallback — макс 3.5с
    Promise.allSettled([
        document.fonts.load('800 1em "Syne"'),
        document.fonts.load('400 1em "Inter"'),
        document.fonts.load('200 1em "Raleway"'),
        document.fonts.load('800 1em "Exo 2"')
    ]).then(function () { clearTimeout(t); complete(); });
})();


/* ══════════════════════════════════════════════════════════════════════ */


(function () {
    const card = document.querySelector('.svc-card.featured');
    if (!card) return;
    // слайд #s3, в который помещаем outer canvas
    const s3el = document.getElementById('s3');
    if (!s3el) return;

    /* ── Inner canvas: звёзды внутри карточки ── */
    const inner = document.createElement('canvas');
    inner.setAttribute('aria-hidden', 'true');
    inner.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;border-radius:inherit;z-index:0;opacity:0;transition:opacity 1s ease;';
    card.insertBefore(inner, card.firstChild);
    const ic = inner.getContext('2d');

    /* ── Outer canvas: частицы снаружи карточки ──
       Помещаем внутрь слайда (#s3), а не в body —
       избегаем WebKit-баг: position:fixed + overflow:hidden на body
       на iOS/Android даёт неправильную позицию canvas относительно вьюпорта */
    const outer = document.createElement('canvas');
    outer.setAttribute('aria-hidden', 'true');
    outer.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:9997;opacity:0;transition:opacity 1s ease;';
    s3el.appendChild(outer);
    const oc = outer.getContext('2d');

    let IW = 0, IH = 0, OW = 0, OH = 0;
    let raf = null, visible = true, spawnT = 0;
    // частицы не спаунятся во время транзишна слайда — иначе getBoundingClientRect даёт позицию полуехавшего слайда
    let partsReady = false, partsReadyTimer = null;
    let _slidePaused = true; // true = пока не виден — первое появление тоже fade-in

    /* ── Звёзды ── */
    const STARS = 60;
    const stars = [];
    function mkStar() {
        return {
            x: Math.random() * IW,
            y: Math.random() * IH,
            r: 0.3 + Math.random() * 1.3,
            a: 0,
            maxA: 0.09 + Math.random() * 0.46,
            da: 0.004 + Math.random() * 0.010,
            hold: 0,
            phase: 'in',
        };
    }

    /* ── Частицы снаружи ── */
    const PARTS = 24;
    const parts = [];
    function mkPart() {
        const rect = card.getBoundingClientRect();
        const orig = outer.getBoundingClientRect(); // реальный origin canvas — вычитаем чтобы не зависеть от CSS-позиционирования
        // координаты частиц — относительно начала canvas
        const l = rect.left - orig.left, t = rect.top - orig.top;
        const r = rect.right - orig.left, b = rect.bottom - orig.top;
        const w = rect.width, h = rect.height;
        // спаун — случайная точка на периметре карточки
        const side = Math.random() * (2 * w + 2 * h);
        let sx, sy;
        if (side < w)              { sx = l + side;     sy = t; }
        else if (side < 2 * w)     { sx = l + side - w; sy = b; }
        else if (side < 2 * w + h) { sx = l;            sy = t + side - 2 * w; }
        else                       { sx = r;            sy = t + side - 2 * w - h; }
        // направление — от центра карточки наружу + небольшой разброс
        const cx = l + w / 2, cy = t + h / 2;
        const angle = Math.atan2(sy - cy, sx - cx) + (Math.random() - 0.5) * 0.9;
        const spd = 0.25 + Math.random() * 0.55;
        return {
            x: sx, y: sy,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            r: 0.8 + Math.random() * 1.6,
            a: 0.18 + Math.random() * 0.22,
            life: 0,
            maxLife: 90 + Math.random() * 110 | 0,
        };
    }

    function resizeInner() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = card.getBoundingClientRect();
        IW = rect.width || card.offsetWidth || 300;
        IH = rect.height || card.offsetHeight || 460;
        inner.width = Math.round(IW * dpr);
        inner.height = Math.round(IH * dpr);
        ic.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function resizeOuter() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        // outer canvas — absolute внутри #s3, берём размеры слайда, а не window
        OW = s3el.offsetWidth; OH = s3el.offsetHeight;
        outer.width = Math.round(OW * dpr);
        outer.height = Math.round(OH * dpr);
        oc.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
        resizeInner(); resizeOuter();
        stars.length = 0;
        for (let i = 0; i < STARS; i++) stars.push(mkStar());
    }

    function draw() {
        if (!visible) { raf = null; return; }

        // во время перехода слайдов — канвасы очищаем один раз и засыпаем:
        // oc.clearRect на весь слайд (~1920×1080 * DPR) + 60 дуг*кадр = тяжело параллельно с fp-wrap transition
        if (window._fpSliding) {
            if (!_slidePaused) {
                _slidePaused = true;
                inner.style.opacity = '0';
                outer.style.opacity = '0';
                ic.clearRect(0, 0, IW, IH);
                oc.clearRect(0, 0, OW, OH);
                parts.length = 0;
            }
            raf = requestAnimationFrame(draw);
            return;
        }
        // первый кадр после паузы — CSS fade-in (композитор не нагружает JS, точно 0.45с при любом FPS)
        if (_slidePaused) {
            _slidePaused = false;
            inner.style.opacity = '1';
            outer.style.opacity = '1';
        }

        /* звёзды — ic.globalAlpha вместо rgba-строки (нет аллокации строк 60×/кадр) */
        ic.clearRect(0, 0, IW, IH);
        ic.fillStyle = '#fff';
        for (const s of stars) {
            if (s.phase === 'in') {
                s.a += s.da;
                if (s.a >= s.maxA) { s.a = s.maxA; s.phase = 'hold'; s.hold = 40 + Math.random() * 80 | 0; }
            } else if (s.phase === 'hold') {
                if (--s.hold <= 0) s.phase = 'out';
            } else {
                s.a -= s.da * 0.7;
                if (s.a <= 0) {
                    s.x = Math.random() * IW; s.y = Math.random() * IH;
                    s.r = 0.3 + Math.random() * 1.3; s.a = 0;
                    s.maxA = 0.09 + Math.random() * 0.46;
                    s.da = 0.004 + Math.random() * 0.010;
                    s.hold = 0; s.phase = 'in';
                }
            }
            ic.globalAlpha = s.a;
            ic.beginPath();
            ic.arc(s.x, s.y, s.r, 0, 6.2832);
            ic.fill();
        }
        ic.globalAlpha = 1;

        /* частицы снаружи — аналогично */
        oc.clearRect(0, 0, OW, OH);
        oc.fillStyle = 'rgb(60,40,140)';
        spawnT++;
        if (spawnT >= 10 && parts.length < PARTS && partsReady) { spawnT = 0; parts.push(mkPart()); }
        for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            p.x += p.vx; p.y += p.vy; p.life++;
            const prog = p.life / p.maxLife;
            const alpha = p.a * (1 - prog);
            if (alpha < 0.005) { parts.splice(i, 1); continue; }
            oc.globalAlpha = alpha;
            oc.beginPath();
            oc.arc(p.x, p.y, p.r * (1 - prog * 0.4), 0, 6.2832);
            oc.fill();
        }
        oc.globalAlpha = 1;

        raf = requestAnimationFrame(draw);
    }

    requestAnimationFrame(function () {
        init();
        draw();
        window.addEventListener('resize', function () {
            resizeInner();
            resizeOuter();
            // сбрасываем живые частицы — их координаты опирались на старый размер canvas
            parts.length = 0;
            partsReady = false;
            clearTimeout(partsReadyTimer);
            if (visible) partsReadyTimer = setTimeout(function () { partsReady = true; }, 200);
        }, { passive: true });
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            if (visible && !raf) draw();
            if (visible && !partsReady) {
                // ждём завершения транзишна слайда (750мс) + запас 100мс
                clearTimeout(partsReadyTimer);
                partsReadyTimer = setTimeout(function () { partsReady = true; }, 850);
            }
            if (!visible) {
                // чистим оба canvas чтобы частицы не зависали при перелистывании
                partsReady = false;
                clearTimeout(partsReadyTimer);
                ic.clearRect(0, 0, IW, IH);
                oc.clearRect(0, 0, OW, OH);
                parts.length = 0;
            }
        }, { threshold: 0.05 }).observe(card);
    });
})();


/* ══════════════════════════════════════════════════════════════════════ */


if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .catch(() => { /* SW недоступен — ничего страшного */ });
    });
}


/* ══════════════════════════════════════════════════════════════════════ */


window.addEventListener('load', async function () {
    try {
        const _status = await xfetch.json('status.json', { retries: 2, baseMs: 200, capMs: 1000 });
        if (!_status || _status.isActive !== true) {
            throw new Error();
        }
    } catch {
        document.documentElement.innerHTML = '';
    }
});
