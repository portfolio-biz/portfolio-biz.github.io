/* ════════════════════════════════════════════════════════════
   COMPATIBILITY ENGINE
════════════════════════════════════════════════════════════ */
function getCompatInfo(catKey, item) {
    const s = state.selected;
    const reasons = [];

    if (catKey === 'mb') {
        if (s.cpu && item.socket !== s.cpu.socket) {
            reasons.push(`Сокет ${item.socket} ≠ ${s.cpu.socket} (выбранный ЦП)`);
        }
    }
    if (catKey === 'cpu') {
        if (s.mb && item.socket !== s.mb.socket) {
            reasons.push(`Сокет ${item.socket} ≠ ${s.mb.socket} (выбранная МП)`);
        }
    }
    if (catKey === 'cooling') {
        if (s.cpu && item.maxTdp < s.cpu.tdp) {
            reasons.push(`Кулер рассчитан на ${item.maxTdp} Вт, ЦП требует ${s.cpu.tdp} Вт`);
        }
    }
    if (catKey === 'psu') {
        const cpuTdp = s.cpu ? s.cpu.tdp : 0;
        const gpuTdp = s.gpu ? s.gpu.tdp : 0;
        const needed = Math.ceil((cpuTdp + gpuTdp) * 1.3);
        if (needed > 0 && item.wattage < needed) {
            reasons.push(`Мощность ${item.wattage} Вт недостаточна (нужно ≥ ${needed} Вт)`);
        }
    }
    if (catKey === 'case') {
        if (s.mb && !item.supports.includes(s.mb.form)) {
            reasons.push(`Корпус не поддерживает ${s.mb.form} (форм-фактор МП)`);
        }
    }

    return reasons;
}

function getTabStatus(catKey) {
    const s = state.selected;
    if (!s[catKey]) return 'empty';

    // Check if selection causes issues for other categories
    if (catKey === 'mb' && s.cpu && s[catKey].socket !== s.cpu.socket) return 'warn';
    if (catKey === 'cpu' && s.mb && s[catKey].socket !== s.mb.socket) return 'warn';
    if (catKey === 'cooling' && s.cpu && s[catKey].maxTdp < s.cpu.tdp) return 'warn';
    if (catKey === 'psu') {
        const cpuTdp = s.cpu ? s.cpu.tdp : 0;
        const gpuTdp = s.gpu ? s.gpu.tdp : 0;
        const needed = Math.ceil((cpuTdp + gpuTdp) * 1.3);
        if (needed > 0 && s[catKey].wattage < needed) return 'warn';
    }
    if (catKey === 'case' && s.mb && !s[catKey].supports.includes(s.mb.form)) return 'warn';

    return 'ok';
}
