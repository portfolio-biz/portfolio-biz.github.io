/**
 * TandemSign v1.0
 * Криптографическая библиотека для подписи и верификации договоров.
 *
 * Цепочка верификации:
 *   docHash  = SHA-256("Я СОГЛАСЕН С УСЛОВИЯМИ ДОГОВОРА | " + agrid)
 *   envHash  = SHA-256(navigator.userAgent|platform|language|tz|resolution|colorDepth|cores|ram)
 *   csInput  = agrid|docHash[|credId][|cdHash]|envHash
 *   checksum = SHA-256(csInput)
 *   fullData = csInput|checksum
 *   token    = SHA-256(fullData)
 *
 * Совместимость: если файл подписи не содержит Env-Hash (старый формат),
 * верификатор автоматически пропускает это поле в цепочке.
 *
 * @version      1.0
 * @author       Tandem Sites
 * @license      Proprietary
 */
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.TandemSign = factory();
    }
})(typeof window !== 'undefined' ? window : this, function () {
    'use strict';

    var VERSION = '1.0';
    var AGREEMENT_PREFIX = 'Я СОГЛАСЕН С УСЛОВИЯМИ ДОГОВОРА | ';
    var ENC = new TextEncoder();

    /* ═══════════════════════════════════════════════════════════
       ПРИМИТИВЫ
    ═══════════════════════════════════════════════════════════ */

    /**
     * SHA-256 произвольной UTF-8 строки → строка hex.
     * @param   {string}          str
     * @returns {Promise<string>}
     */
    function sha256hex(str) {
        return crypto.subtle.digest('SHA-256', ENC.encode(str))
            .then(function (buf) {
                return Array.from(new Uint8Array(buf))
                    .map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
            });
    }

    /**
     * SHA-256 ArrayBuffer → строка hex.
     * @param   {ArrayBuffer}     ab
     * @returns {Promise<string>}
     */
    function sha256buf(ab) {
        return crypto.subtle.digest('SHA-256', ab)
            .then(function (buf) {
                return Array.from(new Uint8Array(buf))
                    .map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
            });
    }

    /**
     * hex-строка → Uint8Array.
     * @param   {string}     hex
     * @returns {Uint8Array}
     */
    function hexToBytes(hex) {
        var arr = new Uint8Array(hex.length >> 1);
        for (var i = 0; i < arr.length; i++)
            arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        return arr;
    }

    /* ═══════════════════════════════════════════════════════════
       ОТПЕЧАТОК ОКРУЖЕНИЯ (Env-Hash)

       Фиксирует параметры устройства и браузера на момент
       подписания. Не является криптографической гарантией в
       полном смысле (клиентский JS может быть изменён), однако:
         • Записывает конкретный User-Agent / ОС / экран в файл.
         • Затрудняет воспроизведение подписи на другом устройстве.
         • Является дополнительным свидетелем в пользу того, что
           именно этот пользователь с именно этого браузера
           подписал договор.
         • В связке с WebAuthn (passkey привязан к устройству)
           создаёт убедительную доказательную цепочку.
    ═══════════════════════════════════════════════════════════ */

    /**
     * Вычисляет SHA-256 отпечаток окружения подписанта.
     * @returns {Promise<string>}  hex
     */
    function envFingerprint() {
        var tz = '';
        try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) { }

        /* Порядок полей фиксирован — не менять без смены версии протокола */
        var parts = [
            navigator.userAgent || '',
            navigator.platform || '',
            navigator.language || '',
            tz,
            (window.screen.width || 0) + 'x' + (window.screen.height || 0),
            String(window.screen.colorDepth || 0),
            navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : '',
            navigator.deviceMemory ? String(navigator.deviceMemory) : '',
        ];

        return sha256hex(parts.join('\x00'));
    }

    /* ═══════════════════════════════════════════════════════════
       ПОСТРОЕНИЕ ЦЕПОЧКИ ПОДПИСИ
    ═══════════════════════════════════════════════════════════ */

    /**
     * Вычисляет полный объект signData с заполненной цепочкой хешей.
     *
     * @param   {string}  agrid                  Идентификатор договора
     * @param   {object}  [opts]
     * @param   {string}  [opts.credId=null]     WebAuthn Credential ID (base64url)
     * @param   {string}  [opts.cdHash=null]     SHA-256 clientDataJSON (hex)
     * @param   {string}  [opts.algoName='SHA-256']
     * @param   {string}  [opts.timestamp=null]  Отформатированная метка времени для UI
     * @returns {Promise<object>}
     */
    async function buildSignData(agrid, opts) {
        var credId = (opts && opts.credId) || null;
        var cdHash = (opts && opts.cdHash) || null;
        var algoName = (opts && opts.algoName) || 'SHA-256';
        var timestamp = (opts && opts.timestamp) || null;

        /* 1. Хеш документа */
        var docHash = await sha256hex(AGREEMENT_PREFIX + agrid);

        /* 2. Отпечаток окружения подписанта */
        var envHash = await envFingerprint();

        /* 3. Входная строка контрольной суммы:
              agrid|docHash[|credId][|cdHash]|envHash                        */
        var csInput = agrid + '|' + docHash
            + (credId ? '|' + credId : '')
            + (cdHash ? '|' + cdHash : '')
            + '|' + envHash;

        /* 4. Контрольная сумма */
        var checksum = await sha256hex(csInput);

        /* 5. Полная строка верификации (csInput + checksum) */
        var fullString = csInput + '|' + checksum;

        /* 6. Единый верификационный токен */
        var finalHash = await sha256hex(fullString);

        return {
            agrid: agrid,
            docHash: docHash,
            credId: credId,
            cdHash: cdHash,
            envHash: envHash,
            checksum: checksum,
            fullString: fullString,
            finalHash: finalHash,
            algoName: algoName,
            timestamp: timestamp,
        };
    }

    /* ═══════════════════════════════════════════════════════════
       СЕРИАЛИЗАЦИЯ В .tandemsign
    ═══════════════════════════════════════════════════════════ */

    /**
     * Сериализует signData в текстовый формат .tandemsign (PGP-style).
     * @param   {object}  data  Объект, возвращённый buildSignData()
     * @returns {string}
     */
    function serialize(data) {
        var isoTs = new Date().toISOString();

        /* Строка шага 2 (для воспроизводимости) */
        /* Совместимость: старые записи могут не иметь envHash */
        var hasEnv = !!data.envHash;
        var csInput = data.agrid + '|' + data.docHash
            + (data.credId ? '|' + data.credId : '')
            + (data.cdHash ? '|' + data.cdHash : '')
            + (hasEnv ? '|' + data.envHash : '');

        var fieldOrder = 'Agreement-ID|Doc-Hash'
            + (data.credId ? '|Cred-ID' : '')
            + (data.cdHash ? '|CD-Hash' : '')
            + (hasEnv ? '|Env-Hash' : '')
            + '|Checksum';

        var lines = [
            '-----BEGIN TANDEM SIGNATURE-----',
            'Version: TandemSign/1.0',
            'Issuer: tandem-sites.ru',
            'Agreement-ID: ' + data.agrid,
            'Signed-At: ' + isoTs,
            'Algorithm: ' + data.algoName,
            '',
            'Doc-Hash: ' + data.docHash,
        ];

        if (data.credId) lines.push('Cred-ID: ' + data.credId);
        if (data.cdHash) lines.push('CD-Hash: ' + data.cdHash);
        if (hasEnv) lines.push('Env-Hash: ' + data.envHash);

        lines = lines.concat([
            'Checksum: ' + data.checksum,
            'Token: ' + data.finalHash,
            '',
            'Full-Data: ' + data.fullString,
            '',
            '; --- VERIFICATION ---',
            '; Для ручной воспроизводимости все шаги выполняются',
            '; стандартным SHA-256 (hex-вывод, нижний регистр).',
            ';',
            '; Step 1 — Verify Doc-Hash:',
            ';   input  : ' + JSON.stringify(AGREEMENT_PREFIX + data.agrid),
            ';   expect : Doc-Hash value above',
            ';',
            '; Step 2 — Verify Checksum:',
            ';   input  : ' + JSON.stringify(csInput),
            ';   expect : Checksum value above',
            ';',
            '; Step 3 — Verify Token:',
            ';   input  : Full-Data value above (as literal string)',
            ';   expect : Token value above',
            ';',
            '; Field order in chain: ' + fieldOrder,
            '-----END TANDEM SIGNATURE-----',
            '',
        ]);

        return lines.join('\r\n');
    }

    /* ═══════════════════════════════════════════════════════════
       ПАРСЕР .tandemsign → объект
    ═══════════════════════════════════════════════════════════ */

    /**
     * Парсит текст .tandemsign файла в объект полей.
     * @param   {string}       text
     * @returns {object|null}  null — если файл не распознан
     */
    function parse(text) {
        if (!text || !text.includes('-----BEGIN TANDEM SIGNATURE-----')) return null;

        var fields = {};
        var lines = text.split(/\r?\n/);
        var inside = false;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line === '-----BEGIN TANDEM SIGNATURE-----') { inside = true; continue; }
            if (line === '-----END TANDEM SIGNATURE-----') { break; }
            if (!inside || !line || line.charAt(0) === ';') continue;

            var colon = line.indexOf(': ');
            if (colon < 0) continue;
            var key = line.slice(0, colon).trim().toLowerCase().replace(/-/g, '_');
            var val = line.slice(colon + 2).trim();
            fields[key] = val;
        }

        /* Обязательные поля для любого формата */
        if (!fields.doc_hash || !fields.checksum || !fields.token || !fields.full_data) return null;

        return {
            version: fields.version || '',
            issuer: fields.issuer || '',
            agreementId: fields.agreement_id || '',
            signedAt: fields.signed_at || '',
            algorithm: fields.algorithm || '',
            docHash: fields.doc_hash,
            credId: fields.cred_id || null,
            cdHash: fields.cd_hash || null,
            envHash: fields.env_hash || null,   /* null для старых файлов */
            checksum: fields.checksum,
            token: fields.token,
            fullData: fields.full_data,
        };
    }

    /* ═══════════════════════════════════════════════════════════
       ВАЛИДАЦИЯ ФОРМАТА ПОЛЕЙ (regex)
    ═══════════════════════════════════════════════════════════ */

    var RE = {
        sha256: /^[0-9a-f]{64}$/i,
        base64url: /^[A-Za-z0-9+/\-_]+=*$/,
        isoTs: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/,
        agrid: /^[A-Za-z0-9_\-]{1,64}$/,
        version: /^TandemSign\/1\.0$/,
    };

    /**
     * Проверяет корректность всех полей файла по регулярным выражениям.
     * @param   {object}    sig  Результат parse()
     * @returns {string[]}       Список найденных нарушений (пустой → всё ОК)
     */
    function validateFormat(sig) {
        var issues = [];

        if (!RE.version.test(sig.version))
            issues.push('Version: неизвестный формат — ожидается TandemSign/1.0');
        if (!RE.agrid.test(sig.agreementId))
            issues.push('Agreement-ID: недопустимые символы (разрешены A-Z 0-9 - _)');
        if (!RE.isoTs.test(sig.signedAt))
            issues.push('Signed-At: формат не соответствует ISO-8601 UTC (ожидается: 2026-03-05T12:00:00.000Z)');
        if (!RE.sha256.test(sig.docHash))
            issues.push('Doc-Hash: ожидается SHA-256 hex (64 символа)');
        if (sig.credId && !RE.base64url.test(sig.credId))
            issues.push('Cred-ID: невалидный base64url');
        if (sig.cdHash && !RE.sha256.test(sig.cdHash))
            issues.push('CD-Hash: ожидается SHA-256 hex (64 символа)');
        if (sig.envHash && !RE.sha256.test(sig.envHash))
            issues.push('Env-Hash: ожидается SHA-256 hex (64 символа)');
        if (!RE.sha256.test(sig.checksum))
            issues.push('Checksum: ожидается SHA-256 hex (64 символа)');
        if (!RE.sha256.test(sig.token))
            issues.push('Token: ожидается SHA-256 hex (64 символа)');

        /* Структурная проверка Full-Data: min 3, max 6 сегментов */
        var parts = sig.fullData.split('|');
        var min = 3, max = 6;
        if (parts.length < min || parts.length > max) {
            issues.push('Full-Data: неверное число сегментов (ожидается 3–6, получено ' + parts.length + ')');
        } else {
            if (!RE.agrid.test(parts[0]))
                issues.push('Full-Data[0]: недопустимый Agreement-ID');
            if (!RE.sha256.test(parts[1]))
                issues.push('Full-Data[1]: ожидается SHA-256 (Doc-Hash)');
            if (!RE.sha256.test(parts[parts.length - 1]))
                issues.push('Full-Data[последний]: ожидается SHA-256 (Checksum)');
        }

        return issues;
    }

    /* ═══════════════════════════════════════════════════════════
       ВЕРИФИКАЦИЯ ЦЕПОЧКИ
    ═══════════════════════════════════════════════════════════ */

    /**
     * Внутренняя: строит строку csInput из полей sig.
     * Обратная совместимость: если envHash отсутствует — пропускаем.
     */
    function _buildChecksumInput(sig) {
        return sig.agreementId + '|' + sig.docHash
            + (sig.credId ? '|' + sig.credId : '')
            + (sig.cdHash ? '|' + sig.cdHash : '')
            + (sig.envHash ? '|' + sig.envHash : '');
    }

    /**
     * Выполняет три криптографических проверки файла.
     * @param   {object}           sig  Результат parse()
     * @returns {Promise<object[]>}     Массив из 3 check-объектов
     */
    async function verify(sig) {
        var results = [];

        /* Шаг 1 — хеш документа */
        var expectedDoc = await sha256hex(AGREEMENT_PREFIX + sig.agreementId);
        results.push({
            ok: expectedDoc === sig.docHash,
            label: 'Хеш документа (SHA-256)',
            desc: 'SHA-256 от строки согласия с ID договора должен совпадать с Doc-Hash в файле.',
            expected: sig.docHash,
            computed: expectedDoc,
        });

        /* Шаг 2 — контрольная сумма */
        var csInput = _buildChecksumInput(sig);
        var csFields = 'Agreement-ID|Doc-Hash'
            + (sig.credId ? '|Cred-ID' : '')
            + (sig.cdHash ? '|CD-Hash' : '')
            + (sig.envHash ? '|Env-Hash' : '');
        var expectedCs = await sha256hex(csInput);
        results.push({
            ok: expectedCs === sig.checksum,
            label: 'Контрольная сумма (Checksum)',
            desc: 'SHA-256 от конкатенации полей (' + csFields + ') должен совпадать с Checksum.',
            expected: sig.checksum,
            computed: expectedCs,
        });

        /* Шаг 3 — верификационный токен */
        var expectedToken = await sha256hex(sig.fullData);
        results.push({
            ok: expectedToken === sig.token,
            label: 'Верификационный токен (Token)',
            desc: 'SHA-256 от Full-Data (полной строки верификации) должен совпадать с Token.',
            expected: sig.token,
            computed: expectedToken,
        });

        return results;
    }

    /* ═══════════════════════════════════════════════════════════
       ПУБЛИЧНЫЙ API
    ═══════════════════════════════════════════════════════════ */

    return {
        /** Версия протокола */
        VERSION: VERSION,
        /** Фиксированный префикс строки согласия */
        AGREEMENT_PREFIX: AGREEMENT_PREFIX,

        /* Примитивы */
        sha256hex: sha256hex,
        sha256buf: sha256buf,
        hexToBytes: hexToBytes,

        /* Окружение */
        envFingerprint: envFingerprint,

        /* Ядро */
        buildSignData: buildSignData,

        /* Формат файла */
        serialize: serialize,
        parse: parse,
        validateFormat: validateFormat,

        /* Верификация */
        verify: verify,
    };
});
