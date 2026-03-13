/*!
 * TandemDocs.js v1.0.0
 * ─────────────────────────────────────────────
 * MD → красивая документация, стиль VS Code Dark
 * https://tandem-sites.ru/sdk/docs-gen/tandemdocs.js
 *
 * Использование — создай пустой HTML и подключи скрипт:
 *
 *   <!DOCTYPE html>
 *   <html lang="ru">
 *   <head>
 *     <meta charset="UTF-8">
 *     <meta name="viewport" content="width=device-width, initial-scale=1.0">
 *     <script src="https://tandem-sites.ru/sdk/docs-gen/tandemdocs.js"></script>
 *   </head>
 *   <body>
 *
 *     <script type="tandemdocs/config">
 *     {
 *       "title":   "Документация",
 *       "project": "MyProject",
 *       "version": "v2.0",
 *       "favicon": "/favicon.ico"
 *     }
 *     </script>
 *
 *     <script type="tandemdocs/content">
 *     # Заголовок
 *     Ваш **Markdown** здесь…
 *     </script>
 *
 *   </body>
 *   </html>
 *
 * Поддерживаемые поля конфига:
 *   title    — название документации (строка в хедере, слева)
 *   project  — название проекта       (строка в хедере, после "·")
 *   version  — версия                 (бейдж в хедере)
 *   favicon  — URL favicon            (опционально)
 */
(function (root) {
  'use strict';

  /* ============================================================
     CONSTANTS
  ============================================================ */
  var _BASE       = 'https://tandem-sites.ru';
  var _MARKED_URL = _BASE + '/docs-engine/marked.min.js';
  var _HLJS_URL   = _BASE + '/docs-engine/highlight.min.js';
  var _HLJS_CSS   = _BASE + '/docs-engine/vs2015.min.css';

  /* ============================================================
     LANGUAGE → DISPLAY NAME MAP
  ============================================================ */
  var LANG_NAMES = {
    // ── Web ──────────────────────────────────────────────────
    js:           'JavaScript',
    javascript:   'JavaScript',
    mjs:          'JavaScript',
    cjs:          'JavaScript',
    ts:           'TypeScript',
    typescript:   'TypeScript',
    html:         'HTML',
    htm:          'HTML',
    xhtml:        'HTML',
    css:          'CSS',
    scss:         'SCSS',
    sass:         'SCSS',
    less:         'LESS',
    styl:         'Stylus',
    stylus:       'Stylus',
    jsx:          'JSX',
    tsx:          'TSX',
    vue:          'Vue',
    svelte:       'Svelte',
    astro:        'Astro',
    wasm:         'WebAssembly',
    wat:          'WebAssembly',
    // ── Scripting ────────────────────────────────────────────
    py:           'Python',
    python:       'Python',
    rb:           'Ruby',
    ruby:         'Ruby',
    php:          'PHP',
    php3:         'PHP',
    php4:         'PHP',
    php5:         'PHP',
    lua:          'Lua',
    pl:           'Perl',
    perl:         'Perl',
    pm:           'Perl',
    r:            'R',
    rscript:      'R',
    groovy:       'Groovy',
    // ── Systems / Compiled ───────────────────────────────────
    c:            'C',
    h:            'C',
    cpp:          'C++',
    'c++':        'C++',
    cc:           'C++',
    cxx:          'C++',
    hpp:          'C++',
    cs:           'C#',
    csharp:       'C#',
    java:         'Java',
    kt:           'Kotlin',
    kts:          'Kotlin',
    kotlin:       'Kotlin',
    swift:        'Swift',
    go:           'Go',
    golang:       'Go',
    rust:         'Rust',
    rs:           'Rust',
    zig:          'Zig',
    nim:          'Nim',
    d:            'D',
    dart:         'Dart',
    scala:        'Scala',
    sc:           'Scala',
    ex:           'Elixir',
    exs:          'Elixir',
    elixir:       'Elixir',
    erl:          'Erlang',
    erlang:       'Erlang',
    hrl:          'Erlang',
    clj:          'Clojure',
    cljs:         'ClojureScript',
    clojure:      'Clojure',
    hs:           'Haskell',
    haskell:      'Haskell',
    ml:           'OCaml',
    mli:          'OCaml',
    ocaml:        'OCaml',
    fs:           'F#',
    fsx:          'F#',
    fsharp:       'F#',
    v:            'V',
    vlang:        'V',
    odin:         'Odin',
    // ── Shell / CLI ──────────────────────────────────────────
    sh:           'Shell',
    bash:         'Bash',
    zsh:          'Zsh',
    fish:         'Fish',
    shell:        'Shell',
    ksh:          'Shell',
    ps1:          'PowerShell',
    psm1:         'PowerShell',
    psd1:         'PowerShell',
    powershell:   'PowerShell',
    cmd:          'CMD',
    bat:          'Batch',
    // ── Data / Config ────────────────────────────────────────
    json:         'JSON',
    json5:        'JSON5',
    jsonc:        'JSONC',
    yaml:         'YAML',
    yml:          'YAML',
    toml:         'TOML',
    xml:          'XML',
    svg:          'SVG',
    html5:        'HTML',
    ini:          'INI',
    cfg:          'INI',
    conf:         'Config',
    env:          '.env',
    properties:   'Properties',
    plist:        'Plist',
    csv:          'CSV',
    tsv:          'TSV',
    ron:          'RON',
    // ── Database ─────────────────────────────────────────────
    sql:          'SQL',
    mysql:        'SQL',
    pgsql:        'PostgreSQL',
    psql:         'PostgreSQL',
    plpgsql:      'PL/pgSQL',
    sqlite:       'SQLite',
    redis:        'Redis',
    // ── DevOps / Infra ───────────────────────────────────────
    dockerfile:   'Dockerfile',
    docker:       'Dockerfile',
    makefile:     'Makefile',
    make:         'Makefile',
    mk:           'Makefile',
    cmake:        'CMake',
    gradle:       'Gradle',
    groovydsl:    'Gradle',
    terraform:    'Terraform',
    tf:           'Terraform',
    tfvars:       'Terraform',
    hcl:          'HCL',
    ansible:      'Ansible',
    nix:          'Nix',
    helm:         'Helm',
    bicep:        'Bicep',
    // ── Markup / Docs ────────────────────────────────────────
    md:           'Markdown',
    markdown:     'Markdown',
    mdx:          'MDX',
    rst:          'reStructuredText',
    rest:         'reStructuredText',
    tex:          'LaTeX',
    latex:        'LaTeX',
    asciidoc:     'AsciiDoc',
    adoc:         'AsciiDoc',
    // ── Query / Schema ───────────────────────────────────────
    graphql:      'GraphQL',
    gql:          'GraphQL',
    prisma:       'Prisma',
    proto:        'Protobuf',
    protobuf:     'Protobuf',
    thrift:       'Thrift',
    avro:         'Avro',
    // ── Mobile ───────────────────────────────────────────────
    objc:         'Objective-C',
    m:            'Objective-C',
    mm:           'Objective-C++',
    // ── Notebook / Math ──────────────────────────────────────
    matlab:       'MATLAB',
    octave:       'Octave',
    julia:        'Julia',
    jl:           'Julia',
    // ── Other ────────────────────────────────────────────────
    diff:         'Diff',
    patch:        'Diff',
    regex:        'RegExp',
    re:           'RegExp',
    log:          'Log',
    http:         'HTTP',
    graphviz:     'Graphviz',
    dot:          'Graphviz',
    glsl:         'GLSL',
    hlsl:         'HLSL',
    // ── Plain (no highlight) ─────────────────────────────────
    text:         '',
    plain:        '',
    plaintext:    '',
    txt:          '',
  };

  /* ============================================================
     INLINE SVG ICONS
  ============================================================ */
  var SVG = {
    menu:  '<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><rect x="1" y="3" width="16" height="1.8"/><rect x="1" y="8.1" width="16" height="1.8"/><rect x="1" y="13.2" width="16" height="1.8"/></svg>',
    doc:   '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="1" width="14" height="18" stroke="#007acc" stroke-width="1.6" fill="none"/><line x1="6" y1="6" x2="14" y2="6" stroke="#007acc" stroke-width="1.4"/><line x1="6" y1="9.5" x2="14" y2="9.5" stroke="#3e3e42" stroke-width="1.2"/><line x1="6" y1="13" x2="11" y2="13" stroke="#3e3e42" stroke-width="1.2"/></svg>',
    search:'<svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="6" cy="6" r="4.2" stroke="currentColor" stroke-width="1.5"/><line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/></svg>',
    close: '<svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true"><line x1="1" y1="1" x2="10" y2="10"/><line x1="10" y1="1" x2="1" y2="10"/></svg>',
    copy:  '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" aria-hidden="true"><rect x="5" y="1" width="9" height="11"/><path d="M3 5H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-1" stroke-linejoin="miter"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><polyline points="2,8 6,13 14,4"/></svg>',
    up:    '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d="M7 2 L13 10 H1 Z"/></svg>',
  };

  /* ============================================================
     STYLES  (встроены прямо в JS — никаких внешних CSS кроме hljs)
  ============================================================ */
  var CSS = [
    /* ── Reset ── */
    '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}',
    'html{scroll-behavior:smooth;font-size:15px}',
    'body{font-family:"Segoe UI",system-ui,-apple-system,BlinkMacSystemFont,sans-serif;',
    '  background:#1e1e1e;color:#d4d4d4;line-height:1.7;overflow-x:hidden}',

    /* ── Scrollbar ── */
    '::-webkit-scrollbar{width:7px;height:7px}',
    '::-webkit-scrollbar-track{background:#252526}',
    '::-webkit-scrollbar-thumb{background:#4a4a4e}',
    '::-webkit-scrollbar-thumb:hover{background:#6b6b70}',
    '::-webkit-scrollbar-corner{background:#252526}',
    '*{scrollbar-width:thin;scrollbar-color:#4a4a4e #252526}',

    /* ── Selection ── */
    '::selection{background:rgba(38,79,120,.75);color:#fff}',
    '::-moz-selection{background:rgba(38,79,120,.75);color:#fff}',

    /* ── Header ── */
    '#td-hdr{position:fixed;top:0;left:0;right:0;height:48px;background:#252526;',
    '  border-bottom:1px solid #3e3e42;display:flex;align-items:center;',
    '  padding:0 18px;z-index:300;gap:12px}',
    '#td-menu{display:none;background:none;border:none;color:#9d9d9d;cursor:pointer;',
    '  padding:5px;line-height:0;transition:color .15s;flex-shrink:0}',
    '#td-menu:hover{color:#d4d4d4}',
    '#td-logo{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:600;',
    '  color:#d4d4d4;letter-spacing:.02em;white-space:nowrap;text-decoration:none;',
    '  user-select:none}',
    '#td-logo .td-dot{color:#007acc;font-size:18px;line-height:0;margin-top:1px}',
    '#td-logo .td-proj{color:#9d9d9d;font-weight:400}',
    '#td-badge{font-size:11px;font-family:"Cascadia Code","Fira Code",Consolas,monospace;',
    '  color:#6e6e6e;background:#1e1e1e;border:1px solid #3e3e42;',
    '  padding:2px 8px;letter-spacing:.03em;line-height:1;align-self:center;flex-shrink:0}',
    '#td-hdr-space{flex:1}',

    /* ── Overlay ── */
    '#td-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200}',
    '#td-overlay.on{display:block}',

    /* ── Layout ── */
    '#td-wrap{display:flex;padding-top:48px;min-height:100vh}',

    /* ── Sidebar ── */
    '#td-sidebar{position:fixed;top:48px;left:0;bottom:0;width:272px;',
    '  background:#252526;border-right:1px solid #3e3e42;',
    '  overflow-y:auto;overflow-x:hidden;z-index:250;',
    '  display:flex;flex-direction:column;transition:transform .22s ease}',

    /* Sidebar search */
    '#td-sb-search{position:relative;display:flex;align-items:center;',
    '  padding:10px 12px;border-bottom:1px solid #2e2e32;flex-shrink:0}',
    '#td-sb-search .td-ss-icon{position:absolute;left:21px;color:#6e6e6e;',
    '  pointer-events:none;line-height:0}',
    '#td-search-inp{flex:1;background:#1e1e1e;border:1px solid #3e3e42;',
    '  color:#d4d4d4;font-family:inherit;font-size:12.5px;',
    '  padding:5px 26px 5px 28px;outline:none;width:100%;transition:border-color .2s}',
    '#td-search-inp::placeholder{color:#6e6e6e}',
    '#td-search-inp:focus{border-color:#007acc}',
    '#td-search-clear{position:absolute;right:21px;background:none;border:none;',
    '  color:#6e6e6e;cursor:pointer;line-height:0;padding:2px;',
    '  display:none;align-items:center;justify-content:center;transition:color .14s}',
    '#td-search-clear:hover{color:#d4d4d4}',
    '#td-search-clear.visible{display:flex}',

    /* Sidebar label */
    '#td-sb-lbl{padding:15px 18px 9px;font-size:10.5px;text-transform:uppercase;',
    '  letter-spacing:.1em;color:#6e6e6e;font-weight:700;',
    '  border-bottom:1px solid #2e2e32;flex-shrink:0}',

    /* TOC */
    '#td-toc{list-style:none;padding:5px 0 40px;flex:1}',
    '#td-toc li{display:block}',
    '#td-toc a{display:block;padding:4px 18px;color:#9d9d9d;text-decoration:none;',
    '  font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
    '  border-left:2px solid transparent;',
    '  transition:color .14s,background .14s,border-color .14s}',
    '#td-toc a:hover{color:#d4d4d4;background:#2a2d2e}',
    '#td-toc a.active{color:#007acc;border-left-color:#007acc;background:rgba(0,122,204,.12)}',
    '#td-toc a.h1{font-weight:600;color:#d4d4d4;font-size:13px;padding-left:18px}',
    '#td-toc a.h2{padding-left:26px}',
    '#td-toc a.h3{padding-left:40px;font-size:12px;color:#6e6e6e}',
    '#td-toc a.h4{padding-left:52px;font-size:11.5px;color:#6e6e6e}',
    '#td-toc li.td-hidden{display:none}',

    /* ── Main area ── */
    '#td-main{margin-left:272px;flex:1;min-width:0;padding:52px 64px 96px;',
    '  max-width:calc(272px + 860px)}',
    '#td-content{max-width:800px}',

    /* ── Typography ── */
    '#td-content h1,#td-content h2,#td-content h3,',
    '#td-content h4,#td-content h5,#td-content h6{',
    '  color:#e8e8e8;font-weight:600;line-height:1.3;',
    '  scroll-margin-top:72px}',
    '#td-content h1{font-size:2em;margin:0 0 22px;',
    '  padding-bottom:10px;border-bottom:1px solid #3e3e42}',
    '#td-content h2{font-size:1.45em;margin:44px 0 16px;',
    '  padding-bottom:6px;border-bottom:1px solid #2e2e32}',
    '#td-content h3{font-size:1.2em;margin:30px 0 12px}',
    '#td-content h4{font-size:1.05em;margin:22px 0 10px}',
    '#td-content h5{font-size:1em;margin:16px 0 8px;color:#d4d4d4}',
    '#td-content h6{font-size:.95em;margin:14px 0 8px;color:#9d9d9d}',

    /* Anchor # on hover */
    '.td-h-anc{opacity:0;margin-left:8px;color:#007acc;text-decoration:none;',
    '  font-size:.75em;font-weight:400;transition:opacity .15s;user-select:none}',
    '#td-content h1:hover .td-h-anc,#td-content h2:hover .td-h-anc,',
    '#td-content h3:hover .td-h-anc,#td-content h4:hover .td-h-anc{opacity:1}',

    /* Paragraphs, lists */
    '#td-content p{margin:0 0 14px}',
    '#td-content ul,#td-content ol{margin:0 0 14px 22px}',
    '#td-content li{margin-bottom:4px}',
    '#td-content ul li::marker{color:#007acc}',
    '#td-content ol li::marker{color:#007acc}',
    '#td-content ul ul,#td-content ol ol,',
    '#td-content ul ol,#td-content ol ul{margin:4px 0 4px 20px}',

    /* Links, text styles */
    '#td-content a{color:#4ec9b0;text-decoration:none;',
    '  border-bottom:1px solid transparent;transition:border-color .15s}',
    '#td-content a:hover{border-bottom-color:#4ec9b0}',
    '#td-content strong{color:#e8e8e8;font-weight:600}',
    '#td-content em{color:#d7ba7d;font-style:italic}',
    '#td-content del{color:#6e6e6e}',

    /* Inline code */
    '#td-content :not(pre)>code{background:#2d2d2d;color:#ce9178;',
    '  padding:1px 6px;font-family:"Cascadia Code","Fira Code",Consolas,monospace;',
    '  font-size:.875em;border:1px solid #3e3e42}',

    /* ── Code blocks ── */
    '.td-cb{margin:20px 0;border:1px solid #3e3e42}',
    '.td-cb-head{display:flex;align-items:center;justify-content:space-between;',
    '  background:#1a1a1a;border-bottom:1px solid #2e2e32;padding:6px 14px}',
    '.td-cb-lang{font-size:11.5px;font-family:"Cascadia Code","Fira Code",Consolas,monospace;',
    '  color:#6e6e6e;letter-spacing:.05em}',
    '.td-cb-copy{background:none;border:none;color:#6e6e6e;cursor:pointer;',
    '  padding:3px;line-height:0;display:flex;align-items:center;',
    '  justify-content:center;transition:color .14s}',
    '.td-cb-copy:hover{color:#d4d4d4}',
    '.td-cb-copy.ok{color:#4ec9b0}',
    '.td-cb pre{margin:0!important;background:#141414!important;overflow-x:auto}',
    '.td-cb pre code.hljs{padding:18px 20px!important;font-size:13.5px!important;',
    '  line-height:1.65!important;',
    '  font-family:"Cascadia Code","Fira Code",Consolas,monospace!important;',
    '  background:transparent!important;border:none!important;display:block}',

    /* ── Blockquote ── */
    '#td-content blockquote{margin:20px 0;padding:14px 20px;',
    '  border-left:3px solid #007acc;background:rgba(0,122,204,.12);color:#9d9d9d}',
    '#td-content blockquote p:last-child{margin-bottom:0}',

    /* ── Tables ── */
    '.td-tbl{overflow-x:auto;margin:20px 0;border:1px solid #3e3e42}',
    '#td-content table{width:100%;border-collapse:collapse;font-size:13.5px}',
    '#td-content thead{background:#2d2d2d}',
    '#td-content th{padding:9px 16px;text-align:left;color:#e8e8e8;font-weight:600;',
    '  border-bottom:1px solid #3e3e42;white-space:nowrap}',
    '#td-content td{padding:8px 16px;border-bottom:1px solid #2e2e32;vertical-align:top}',
    '#td-content tr:last-child td{border-bottom:none}',
    '#td-content tbody tr:nth-child(even){background:rgba(255,255,255,.02)}',
    '#td-content tbody tr:hover{background:#2a2d2e}',

    /* ── HR, IMG ── */
    '#td-content hr{border:none;border-top:1px solid #3e3e42;margin:40px 0}',
    '#td-content img{max-width:100%;display:block;border:1px solid #3e3e42;margin:20px 0}',

    /* ── Back to top ── */
    '#td-totop{position:fixed;bottom:28px;right:28px;width:36px;height:36px;',
    '  background:#252526;border:1px solid #3e3e42;color:#9d9d9d;cursor:pointer;',
    '  display:flex;align-items:center;justify-content:center;',
    '  opacity:0;pointer-events:none;',
    '  transition:opacity .2s,color .15s,border-color .15s;z-index:400}',
    '#td-totop.on{opacity:1;pointer-events:auto}',
    '#td-totop:hover{color:#d4d4d4;border-color:#007acc}',

    /* ── Loading spinner ── */
    '#td-loading{position:fixed;inset:0;background:#1e1e1e;',
    '  display:flex;align-items:center;justify-content:center;',
    '  z-index:999;flex-direction:column;gap:14px}',
    '#td-loading .td-spin{width:28px;height:28px;border:2px solid #3e3e42;',
    '  border-top-color:#007acc;border-radius:50%;',
    '  animation:td-spin .7s linear infinite}',
    '#td-loading .td-spin-lbl{font-size:12px;color:#6e6e6e;',
    '  font-family:"Cascadia Code","Fira Code",Consolas,monospace}',
    '@keyframes td-spin{to{transform:rotate(360deg)}}',

    /* ── Responsive ── */
    '@media(max-width:960px){#td-main{padding:40px 36px 72px}}',
    '@media(max-width:768px){',
    '  #td-sidebar{transform:translateX(-100%)}',
    '  #td-sidebar.open{transform:translateX(0)}',
    '  #td-main{margin-left:0;padding:28px 20px 60px}',
    '  #td-menu{display:flex}',
    '  #td-content h1{font-size:1.65em}',
    '  #td-content h2{font-size:1.3em}',
    '  .td-cb pre code.hljs{font-size:12px!important}',
    '}',
    '@media(max-width:480px){',
    '  #td-main{padding:20px 14px 50px}',
    '  #td-content h1{font-size:1.45em}',
    '}',
  ].join('\n');

  /* ============================================================
     HELPERS
  ============================================================ */
  function _loadScript(src) {
    return new Promise(function (res, rej) {
      if (document.querySelector('script[src="' + src + '"]')) { res(); return; }
      var s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = function () { rej(new Error('[TandemDocs] Не удалось загрузить: ' + src)); };
      document.head.appendChild(s);
    });
  }

  function _loadStyle(href) {
    return new Promise(function (res, rej) {
      if (document.querySelector('link[href="' + href + '"]')) { res(); return; }
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href;
      l.onload = res;
      l.onerror = function () { rej(new Error('[TandemDocs] Не удалось загрузить: ' + href)); };
      document.head.appendChild(l);
    });
  }

  function _slugify(text) {
    return text.toLowerCase()
      .replace(/[^\wа-яёА-ЯЁ\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  function _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ============================================================
     READ CONFIG  (<script type="tandemdocs/config">)
  ============================================================ */
  function _getConfig() {
    var el = document.querySelector('script[type="tandemdocs/config"]');
    if (!el) return {};
    try {
      return JSON.parse(el.textContent.trim());
    } catch (e) {
      console.warn('[TandemDocs] Ошибка парсинга конфига:', e);
      return {};
    }
  }

  /* ============================================================
     READ MARKDOWN  (<script type="tandemdocs/content">)
  ============================================================ */
  function _getMarkdown() {
    var el = document.querySelector('script[type="tandemdocs/content"]');
    if (!el) {
      console.warn('[TandemDocs] Не найден <script type="tandemdocs/content">');
      return '';
    }
    var raw = el.textContent.replace(/^\n/, '');
    // Dedent — убираем общий отступ если MD написан с отступом внутри <script>
    var m = raw.match(/^(\s+)/);
    var indent = m ? m[1] : '';
    if (indent) {
      raw = raw.split('\n').map(function (l) {
        return l.startsWith(indent) ? l.slice(indent.length) : l;
      }).join('\n');
    }
    return raw.trim();
  }

  /* ============================================================
     INJECT CSS
  ============================================================ */
  function _injectCSS() {
    if (document.getElementById('tandemdocs-css')) return;
    var style = document.createElement('style');
    style.id = 'tandemdocs-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /* ============================================================
     INJECT VIEWPORT META (если нет)
  ============================================================ */
  function _ensureViewport() {
    if (!document.querySelector('meta[name="viewport"]')) {
      var m = document.createElement('meta');
      m.name = 'viewport';
      m.content = 'width=device-width, initial-scale=1.0';
      document.head.appendChild(m);
    }
  }

  /* ============================================================
     BUILD PAGE SKELETON
  ============================================================ */
  function _buildSkeleton(cfg) {
    var title   = cfg.title   || 'Документация';
    var project = cfg.project || '';
    var version = cfg.version || '';

    // <title>
    document.title = project ? title + ' \u2014 ' + project : title;

    // Favicon
    if (cfg.favicon && !document.querySelector('link[rel="icon"]')) {
      var fi = document.createElement('link');
      fi.rel = 'icon'; fi.href = cfg.favicon;
      document.head.appendChild(fi);
    }

    // Loading screen
    var loading = document.createElement('div');
    loading.id = 'td-loading';
    loading.innerHTML = '<div class="td-spin"></div><span class="td-spin-lbl">TandemDocs</span>';

    // Header
    var hdr = document.createElement('header');
    hdr.id = 'td-hdr';
    hdr.innerHTML =
      '<button id="td-menu" aria-label="\u041c\u0435\u043d\u044e">' + SVG.menu + '</button>' +
      '<a id="td-logo" href="#">' +
        SVG.doc +
        '<span>' + _esc(title) + '</span>' +
        (project
          ? '<span class="td-dot">\u00B7</span><span class="td-proj">' + _esc(project) + '</span>'
          : '') +
      '</a>' +
      (version ? '<div id="td-badge">' + _esc(version) + '</div>' : '') +
      '<div id="td-hdr-space"></div>';

    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'td-overlay';

    // Sidebar
    var sidebar = document.createElement('aside');
    sidebar.id = 'td-sidebar';
    sidebar.innerHTML =
      '<div id="td-sb-search">' +
        '<span class="td-ss-icon">' + SVG.search + '</span>' +
        '<input id="td-search-inp" type="text"' +
          ' placeholder="\u041f\u043e\u0438\u0441\u043a \u043f\u043e \u0440\u0430\u0437\u0434\u0435\u043b\u0430\u043c\u2026"' +
          ' autocomplete="off" spellcheck="false">' +
        '<button id="td-search-clear" title="\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c">' + SVG.close + '</button>' +
      '</div>' +
      '<div id="td-sb-lbl">\u0421\u043e\u0434\u0435\u0440\u0436\u0430\u043d\u0438\u0435</div>' +
      '<ul id="td-toc"></ul>';

    // Main
    var main = document.createElement('main');
    main.id = 'td-main';
    var article = document.createElement('article');
    article.id = 'td-content';
    main.appendChild(article);

    // Wrap
    var wrap = document.createElement('div');
    wrap.id = 'td-wrap';
    wrap.appendChild(sidebar);
    wrap.appendChild(main);

    // Back to top
    var totop = document.createElement('button');
    totop.id = 'td-totop';
    totop.title = '\u041d\u0430\u0432\u0435\u0440\u0445';
    totop.innerHTML = SVG.up;

    // Assemble
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.appendChild(loading);
    document.body.appendChild(hdr);
    document.body.appendChild(overlay);
    document.body.appendChild(wrap);
    document.body.appendChild(totop);
  }

  /* ============================================================
     PROCESS HEADINGS  — id, slug, anchor #
  ============================================================ */
  function _processHeadings(content) {
    var usedIds = {};
    content.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(function (h) {
      var id = _slugify(h.textContent);
      if (usedIds[id] != null) { usedIds[id]++; id += '-' + usedIds[id]; }
      else { usedIds[id] = 0; }
      h.id = id;

      var anc = document.createElement('a');
      anc.href = '#' + id;
      anc.className = 'td-h-anc';
      anc.textContent = '#';
      anc.addEventListener('click', function (e) {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth' });
        history.pushState(null, '', '#' + id);
      });
      h.appendChild(anc);
    });
  }

  /* ============================================================
     PROCESS CODE BLOCKS  — highlight + copy button
  ============================================================ */
  function _processCode(content) {
    content.querySelectorAll('pre > code').forEach(function (block) {
      var langClass = Array.from(block.classList).find(function (c) {
        return c.startsWith('language-');
      });
      var lang    = langClass ? langClass.replace('language-', '').toLowerCase() : '';
      var isPlain = lang === 'text' || lang === 'plain' || lang === 'plaintext' || lang === '';

      if (!isPlain && root.hljs) {
        root.hljs.highlightElement(block);
      } else {
        block.classList.add('hljs');
      }

      var displayLang = Object.prototype.hasOwnProperty.call(LANG_NAMES, lang)
        ? LANG_NAMES[lang]
        : lang.toUpperCase();

      var pre  = block.parentElement;
      var wrap = document.createElement('div');
      wrap.className = 'td-cb';

      var head = document.createElement('div');
      head.className = 'td-cb-head';

      var langSpan = document.createElement('span');
      langSpan.className = 'td-cb-lang';
      langSpan.textContent = displayLang;

      var btn = document.createElement('button');
      btn.className = 'td-cb-copy';
      btn.title = '\u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c';
      btn.innerHTML = SVG.copy;
      btn.addEventListener('click', function () {
        navigator.clipboard.writeText(block.textContent.replace(/\n$/, '')).then(function () {
          btn.innerHTML = SVG.check;
          btn.classList.add('ok');
          setTimeout(function () {
            btn.innerHTML = SVG.copy;
            btn.classList.remove('ok');
          }, 1800);
        });
      });

      head.appendChild(langSpan);
      head.appendChild(btn);
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(head);
      wrap.appendChild(pre);
    });
  }

  /* ============================================================
     PROCESS TABLES  — scroll wrapper
  ============================================================ */
  function _processTables(content) {
    content.querySelectorAll('table').forEach(function (tbl) {
      if (tbl.parentElement.classList.contains('td-tbl')) return;
      var wrap = document.createElement('div');
      wrap.className = 'td-tbl';
      tbl.parentNode.insertBefore(wrap, tbl);
      wrap.appendChild(tbl);
    });
  }

  /* ============================================================
     BUILD TOC
  ============================================================ */
  function _buildTOC(content) {
    var toc = document.getElementById('td-toc');
    if (!toc) return;
    toc.innerHTML = '';

    content.querySelectorAll('h1,h2,h3,h4').forEach(function (h) {
      var level = parseInt(h.tagName[1]);
      var li    = document.createElement('li');
      var a     = document.createElement('a');

      a.href = '#' + h.id;
      a.textContent = Array.from(h.childNodes)
        .filter(function (n) {
          return !(n.nodeType === 1 && n.classList.contains('td-h-anc'));
        })
        .map(function (n) { return n.textContent; })
        .join('').trim();
      a.className  = 'h' + level;
      a.dataset.id = h.id;

      a.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(a.dataset.id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          history.pushState(null, '', '#' + a.dataset.id);
        }
        if (window.innerWidth <= 768) _toggleSidebar(false);
      });

      li.appendChild(a);
      toc.appendChild(li);
    });
  }

  /* ============================================================
     SCROLL SPY
  ============================================================ */
  function _initScrollSpy() {
    var headings = document.querySelectorAll(
      '#td-content h1,#td-content h2,#td-content h3,#td-content h4'
    );
    if (!headings.length || !root.IntersectionObserver) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        document.querySelectorAll('#td-toc a').forEach(function (a) {
          a.classList.remove('active');
        });
        var link = document.querySelector(
          '#td-toc a[data-id="' + entry.target.id + '"]'
        );
        if (link) {
          link.classList.add('active');
          link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          history.replaceState(null, '', '#' + entry.target.id);
        }
      });
    }, { rootMargin: '-56px 0px -55% 0px' });

    headings.forEach(function (h) { obs.observe(h); });
  }

  /* ============================================================
     SEARCH
  ============================================================ */
  function _initSearch() {
    var inp   = document.getElementById('td-search-inp');
    var clear = document.getElementById('td-search-clear');
    if (!inp) return;

    inp.addEventListener('input', function () {
      var q = inp.value.trim().toLowerCase();
      document.querySelectorAll('#td-toc li').forEach(function (li) {
        var a = li.querySelector('a');
        li.classList.toggle('td-hidden',
          !!q && !a.textContent.toLowerCase().includes(q)
        );
      });
      if (clear) clear.classList.toggle('visible', inp.value.length > 0);
    });

    if (clear) {
      clear.addEventListener('click', function () {
        inp.value = '';
        inp.dispatchEvent(new Event('input'));
        inp.focus();
      });
    }
  }

  /* ============================================================
     SIDEBAR TOGGLE
  ============================================================ */
  function _toggleSidebar(state) {
    var sb = document.getElementById('td-sidebar');
    var ov = document.getElementById('td-overlay');
    if (!sb || !ov) return;
    var open = (state !== undefined) ? state : !sb.classList.contains('open');
    sb.classList.toggle('open', open);
    ov.classList.toggle('on',   open);
  }

  /* ============================================================
     BACK TO TOP
  ============================================================ */
  function _initBackToTop() {
    var btn = document.getElementById('td-totop');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('on', window.scrollY > 320);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     BIND MENU + OVERLAY
  ============================================================ */
  function _bindUI() {
    var menuBtn = document.getElementById('td-menu');
    var overlay = document.getElementById('td-overlay');
    if (menuBtn) menuBtn.addEventListener('click', function () { _toggleSidebar(); });
    if (overlay) overlay.addEventListener('click', function () { _toggleSidebar(false); });
  }

  /* ============================================================
     MAIN RENDER
  ============================================================ */
  function render() {
    var cfg = _getConfig();
    var md  = _getMarkdown();

    _ensureViewport();
    _injectCSS();
    _buildSkeleton(cfg);
    _bindUI();
    _initBackToTop();

    // Загружаем marked + hljs параллельно
    Promise.all([
      _loadScript(_MARKED_URL),
      _loadScript(_HLJS_URL),
      _loadStyle(_HLJS_CSS),
    ]).then(function () {
      var html = root.marked.parse(md, { gfm: true, breaks: true });
      var content = document.getElementById('td-content');
      if (!content) return;
      content.innerHTML = html;

      _processHeadings(content);
      _processCode(content);
      _processTables(content);
      _buildTOC(content);
      _initScrollSpy();
      _initSearch();

      // Убираем loading-экран
      var loading = document.getElementById('td-loading');
      if (loading) loading.parentNode.removeChild(loading);

      // Скролл к якорю из URL (после перезагрузки)
      if (location.hash) {
        var hashId = decodeURIComponent(location.hash.slice(1));
        setTimeout(function () {
          var target = document.getElementById(hashId)
            || document.querySelector('[id="' + hashId.replace(/"/g, '') + '"]');
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
    }).catch(function (err) {
      console.error('[TandemDocs]', err);
      var loading = document.getElementById('td-loading');
      if (loading) {
        loading.querySelector('.td-spin-lbl').textContent = 'Ошибка загрузки';
        loading.querySelector('.td-spin').style.borderTopColor = '#f48771';
      }
    });
  }

  /* ============================================================
     PUBLIC API
  ============================================================ */
  root.TandemDocs = {
    render: render,
    version: '1.0.0',
  };

  /* ============================================================
     AUTO-INIT
  ============================================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

}(window));
