(function () {
    'use strict';

    // ── Setup (after Umami signup) ───────────────────────────────────────────
    // 1. Sign up at https://cloud.umami.is → Hobby plan ($0, no card)
    // 2. Add website → copy Website ID → paste below
    // 3. On your devices, visit once: https://www.beyondshowrooms.com/?noanalytics=1
    var WEBSITE_ID = '9070ab5c-784f-469f-b0df-e73f0f32084e';
    var SCRIPT_SRC = 'https://cloud.umami.is/script.js';

    if (new URLSearchParams(window.location.search).has('noanalytics')) {
        try {
            localStorage.setItem('bs_analytics_off', '1');
        } catch (e) {}
    }

    try {
        if (localStorage.getItem('bs_analytics_off') === '1') {
            return;
        }
    } catch (e) {}

    if (!WEBSITE_ID || WEBSITE_ID === 'REPLACE_WITH_YOUR_WEBSITE_ID') {
        return;
    }

    var script = document.createElement('script');
    script.defer = true;
    script.src = SCRIPT_SRC;
    script.dataset.websiteId = WEBSITE_ID;
    document.head.appendChild(script);

    var CTA_RULES = [
        { selector: '[data-open-contact]', event: 'contact_cta' },
        { selector: '[data-open-showroom]', event: 'showroom_cta' },
        { selector: '[data-open-partners]', event: 'partners_cta' },
        { selector: '[data-doc-video-play]', event: 'video_play' },
        { selector: '#bridge-cta, .bridge-cta__link', event: 'bridge_cta' },
        { selector: '[data-contact="whatsapp"]', event: 'contact_whatsapp' },
        { selector: '[data-contact="email"]', event: 'contact_email' }
    ];

    function ctaLocation(el) {
        var section = el.closest('section');
        if (section) {
            if (section.id) {
                return section.id;
            }
            var labelledBy = section.getAttribute('aria-labelledby');
            if (labelledBy) {
                return labelledBy;
            }
            var heading = section.querySelector('h1, h2, h3');
            if (heading && heading.textContent) {
                return heading.textContent.trim().slice(0, 48);
            }
        }
        return window.location.pathname || '/';
    }

    function trackEvent(name, data) {
        if (window.umami && typeof window.umami.track === 'function') {
            window.umami.track(name, data);
        }
    }

    document.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
            return;
        }

        for (var i = 0; i < CTA_RULES.length; i += 1) {
            var rule = CTA_RULES[i];
            var el = target.closest(rule.selector);
            if (!el) {
                continue;
            }

            trackEvent(rule.event, {
                location: ctaLocation(el),
                page: window.location.pathname || '/'
            });
            return;
        }
    });
})();
