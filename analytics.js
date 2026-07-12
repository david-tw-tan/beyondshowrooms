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
    script.onload = function () {
        whenUmamiReady(initYoutubeReferralTracking);
    };
    document.head.appendChild(script);

    var CTA_RULES = [
        { selector: '[data-open-contact]', event: 'contact_cta' },
        { selector: '[data-open-showroom]', event: 'showroom_cta' },
        { selector: '[data-open-partners]', event: 'partners_cta' },
        { selector: '[data-doc-video-play]', event: 'video_play' },
        { selector: 'a[href="https://www.youtube.com/@beyondshowrooms"]', event: 'docuseries_link' },
        { selector: '[data-contact="whatsapp"]', event: 'contact_whatsapp' },
        { selector: '[data-contact="email"]', event: 'contact_email' }
    ];

    function pagePath() {
        return window.location.pathname || '/';
    }

    function youtubeEpisodeFromUrl() {
        var params = new URLSearchParams(window.location.search);
        if (params.get('utm_source') !== 'youtube') {
            return null;
        }

        var campaign = params.get('utm_campaign');
        return /^ep[123]$/.test(campaign) ? campaign : null;
    }

    function withYoutubeEpisode(data) {
        var episode = youtubeEpisodeFromUrl();
        if (episode) {
            data.youtube_episode = episode;
        }
        return data;
    }

    function whenUmamiReady(fn) {
        if (window.umami && typeof window.umami.track === 'function') {
            fn();
            return;
        }

        var attempts = 0;
        var timer = setInterval(function () {
            attempts += 1;
            if (window.umami && typeof window.umami.track === 'function') {
                clearInterval(timer);
                fn();
            } else if (attempts >= 40) {
                clearInterval(timer);
            }
        }, 50);
    }

    function initYoutubeReferralTracking() {
        var params = new URLSearchParams(window.location.search);
        var episode = youtubeEpisodeFromUrl();
        if (!episode) {
            return;
        }

        trackEvent('youtube_' + episode, {
            redirect: '/' + episode,
            medium: params.get('utm_medium') || '',
            page: pagePath()
        });
    }

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
        return pagePath();
    }

    function trackEvent(name, data) {
        if (window.umami && typeof window.umami.track === 'function') {
            window.umami.track(name, data);
        }
    }

    function onReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function isScrollable(root) {
        var height = root ? root.scrollHeight : document.documentElement.scrollHeight;
        var viewport = root ? root.clientHeight : window.innerHeight;
        return height > viewport + 24;
    }

    function observeSectionOnce(sentinel, sectionName) {
        if (!sentinel || typeof IntersectionObserver === 'undefined') {
            return;
        }

        var fired = false;
        var observer = new IntersectionObserver(function (entries) {
            if (fired) {
                return;
            }

            for (var i = 0; i < entries.length; i += 1) {
                if (entries[i].isIntersecting) {
                    fired = true;
                    trackEvent('scroll_section', {
                        section: sectionName,
                        page: pagePath()
                    });
                    observer.disconnect();
                    return;
                }
            }
        }, {
            threshold: 0.4
        });

        observer.observe(sentinel);
    }

    function observeScrollBottom(options) {
        var root = options.root || null;
        var sentinel = options.sentinel;
        var eventName = options.eventName;
        var eventData = options.eventData || {};

        if (!sentinel || typeof IntersectionObserver === 'undefined') {
            return null;
        }

        if (!isScrollable(root)) {
            return null;
        }

        var fired = false;
        var hasScrolled = false;
        var scrollTarget = root || window;

        function markScrolled() {
            hasScrolled = true;
        }

        scrollTarget.addEventListener('scroll', markScrolled, { passive: true });

        var observer = new IntersectionObserver(function (entries) {
            if (fired) {
                return;
            }

            for (var i = 0; i < entries.length; i += 1) {
                if (entries[i].isIntersecting && hasScrolled) {
                    fired = true;
                    trackEvent(eventName, eventData);
                    observer.disconnect();
                    scrollTarget.removeEventListener('scroll', markScrolled);
                    return;
                }
            }
        }, {
            root: root,
            threshold: 0.75
        });

        observer.observe(sentinel);
        return observer;
    }

    function watchModalScrollBottom(modalId, scrollRootSelector, sentinelSelector, modalName) {
        var modal = document.getElementById(modalId);
        if (!modal) {
            return;
        }

        var activeObserver = null;

        function teardown() {
            if (activeObserver) {
                activeObserver.disconnect();
                activeObserver = null;
            }
        }

        function attach() {
            teardown();

            var root = modal.querySelector(scrollRootSelector);
            var sentinel = modal.querySelector(sentinelSelector);
            if (!root || !sentinel) {
                return;
            }

            activeObserver = observeScrollBottom({
                root: root,
                sentinel: sentinel,
                eventName: 'scroll_modal_bottom',
                eventData: {
                    modal: modalName,
                    page: pagePath()
                }
            });
        }

        function attachWhenReady(getRoot) {
            var root = getRoot();
            if (root && root.children.length > 0) {
                attach();
                return;
            }

            if (!root) {
                return;
            }

            var listObserver = new MutationObserver(function () {
                if (root.children.length > 0) {
                    listObserver.disconnect();
                    attach();
                }
            });
            listObserver.observe(root, { childList: true });
        }

        var modalObserver = new MutationObserver(function () {
            if (modal.hidden) {
                teardown();
                return;
            }

            if (modalId === 'partnersModal') {
                attachWhenReady(function () {
                    return document.getElementById('partnersList');
                });
            } else {
                requestAnimationFrame(attach);
            }
        });

        modalObserver.observe(modal, { attributes: true, attributeFilter: ['hidden'] });
    }

    function initSuccessStoriesCarouselTracking() {
        var carousel = document.querySelector('[data-case-carousel]');
        if (!carousel) {
            return;
        }

        var slides = carousel.querySelectorAll('[data-case-slide]');
        var totalSlides = slides.length;
        if (totalSlides === 0) {
            return;
        }

        var trackingEnabled = false;
        var viewed = Object.create(null);
        var viewedCount = 0;
        var summarySent = false;

        function recordSlide(index) {
            if (!trackingEnabled || viewed[index]) {
                return;
            }

            viewed[index] = true;
            viewedCount += 1;
        }

        function sendSummary() {
            if (!trackingEnabled || summarySent || viewedCount === 0) {
                return;
            }

            summarySent = true;
            trackEvent('success_stories_depth', {
                slides_viewed: viewedCount,
                total_slides: totalSlides,
                page: pagePath()
            });
        }

        function enableTracking() {
            if (trackingEnabled) {
                return;
            }

            trackingEnabled = true;

            for (var i = 0; i < slides.length; i += 1) {
                if (slides[i].getAttribute('aria-hidden') !== 'true') {
                    recordSlide(i);
                }
            }
        }

        var sectionHeading = document.getElementById('homes-title');
        if (sectionHeading && typeof IntersectionObserver !== 'undefined') {
            var sectionObserver = new IntersectionObserver(function (entries) {
                for (var i = 0; i < entries.length; i += 1) {
                    if (entries[i].isIntersecting) {
                        enableTracking();
                        sectionObserver.disconnect();
                        return;
                    }
                }
            }, { threshold: 0.35 });
            sectionObserver.observe(sectionHeading);
        }

        for (var s = 0; s < slides.length; s += 1) {
            (function (index) {
                var slideObserver = new MutationObserver(function () {
                    if (slides[index].getAttribute('aria-hidden') === 'false') {
                        recordSlide(index);
                    }
                });
                slideObserver.observe(slides[index], {
                    attributes: true,
                    attributeFilter: ['aria-hidden']
                });
            }(s));
        }

        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') {
                sendSummary();
            }
        });
        window.addEventListener('pagehide', sendSummary);
    }

    onReady(function () {
        observeSectionOnce(document.getElementById('collections-title'), 'collections');
        observeSectionOnce(document.getElementById('trust-title'), 'factories');
        observeSectionOnce(document.getElementById('homes-title'), 'success_stories');
        observeSectionOnce(document.querySelector('.founder-credit'), 'bottom');

        watchModalScrollBottom('showroomModal', '.lp-showroom-scroll', '.lp-showroom-cta', 'showroom');
        watchModalScrollBottom('partnersModal', '.lp-partners-list', '.lp-partner-card:last-child', 'partners');

        initSuccessStoriesCarouselTracking();
    });

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

            trackEvent(rule.event, withYoutubeEpisode({
                location: ctaLocation(el),
                page: pagePath()
            }));
            return;
        }
    });
})();
