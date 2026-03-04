/* ════════════════════════════════════════════════════════════
   ICONS (SVG inline, stroke-based)
════════════════════════════════════════════════════════════ */
const ICONS = {
    cpu: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="6" y="6" width="12" height="12"/><path d="M9 6V3M12 6V3M15 6V3M9 21v-3M12 21v-3M15 21v-3M3 9h3M3 12h3M3 15h3M21 9h-3M21 12h-3M21 15h-3"/><rect x="9" y="9" width="6" height="6"/></svg>`,
    gpu: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="2" y="7" width="20" height="10"/><path d="M7 7V4M10 7V4M14 7V4M17 7V4"/><circle cx="8" cy="12" r="1.5"/><circle cx="13" cy="12" r="1.5"/></svg>`,
    mb: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="2" y="2" width="20" height="20"/><rect x="5" y="5" width="5" height="5"/><rect x="5" y="13" width="4" height="4"/><path d="M14 5h5M14 9h5M14 14h5M14 17h5"/><path d="M10 17v2M13 17v2"/></svg>`,
    ram: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="4" y="3" width="5" height="18"/><rect x="12" y="3" width="5" height="18"/><path d="M4 8h5M4 12h5M4 16h5M12 8h5M12 12h5M12 16h5"/></svg>`,
    storage: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="3" y="7" width="18" height="10"/><path d="M7 12h2M13 12h4"/><circle cx="17" cy="12" r=".5" fill="currentColor"/></svg>`,
    cooling: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
    psu: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="3" y="4" width="18" height="16"/><path d="M9 10v4M12 8v8M15 11v2"/></svg>`,
    case: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="4" y="2" width="12" height="20"/><path d="M4 8h12M4 14h12M16 5h4v14h-4"/><circle cx="10" cy="11" r="1.5"/></svg>`,
    check: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><polyline points="20 6 9 17 4 12"/></svg>`,
    warn: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`,
    err: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    x: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
};

const CATEGORY_KEYS = ['cpu', 'gpu', 'mb', 'ram', 'storage', 'cooling', 'psu', 'case'];

/* ════════════════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════════════════ */
const state = {
    selected: {},
    activeTab: 'cpu',
    filter: null,
    scrollPos: {}
};

