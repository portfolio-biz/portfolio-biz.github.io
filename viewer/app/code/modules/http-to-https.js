/**
 * Automatically redirects HTTP protocol to HTTPS.
 * Checks the current window location protocol and redirects to HTTPS if it's HTTP.
 */
(function httpToHttps() {
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        try {
            if (new URLSearchParams(window.location.search).get('force-unsafe-http') === 'true') {
                return;
            }
        } catch (e) { }

        window.location.protocol = 'https:';
    }
})();