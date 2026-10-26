(function () {
    var contactModal = document.getElementById('contactModal');
    var contactFocus = null;

    function syncContactScrollLock() {
        if (typeof window.syncFounderModalBodyLock === 'function') {
            window.syncFounderModalBodyLock();
            return;
        }
        if (contactModal) {
            document.body.style.overflow = contactModal.hidden ? '' : 'hidden';
        }
    }

    function closeFounderContactModal() {
        if (!contactModal || contactModal.hidden) return;
        contactModal.hidden = true;
        syncContactScrollLock();
        if (contactFocus && typeof contactFocus.focus === 'function') {
            contactFocus.focus({ preventScroll: true });
        }
        contactFocus = null;
    }

    function openFounderContactModal() {
        if (!contactModal) return;
        contactFocus = document.activeElement;
        contactModal.hidden = false;
        syncContactScrollLock();
        var closeBtn = contactModal.querySelector('.modal__close');
        if (closeBtn) closeBtn.focus({ preventScroll: true });
    }

    window.openFounderContact = function () {
        openFounderContactModal();
    };

    document.querySelectorAll('[data-open-contact]').forEach(function (el) {
        el.addEventListener('click', function (event) {
            event.preventDefault();
            openFounderContactModal();
        });
    });

    document.querySelectorAll('[data-close-contact]').forEach(function (el) {
        el.addEventListener('click', closeFounderContactModal);
    });

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        if (contactModal && !contactModal.hidden) {
            event.preventDefault();
            closeFounderContactModal();
        }
    });

    requestAnimationFrame(function () {
        document.querySelectorAll('.reveal').forEach(function (el) {
            el.classList.add('is-visible');
        });
    });

    var lightbox = document.getElementById('showroomCarouselLightbox');
    var lightboxImg = lightbox && lightbox.querySelector('.carousel-lightbox__img');
    var lightboxCaption = lightbox && lightbox.querySelector('.carousel-lightbox__caption');
    var lightboxTitle = lightbox && lightbox.querySelector('.carousel-lightbox__title');
    var lightboxSubtitle = lightbox && lightbox.querySelector('.carousel-lightbox__subtitle');
    var lightboxCta = lightbox && lightbox.querySelector('.carousel-lightbox__cta');
    var lightboxNote = lightbox && lightbox.querySelector('.carousel-lightbox__note');
    var lightboxPanel = lightbox && lightbox.querySelector('.carousel-lightbox__panel');
    var lightboxPrev = lightbox && lightbox.querySelector('[data-carousel-lightbox-prev]');
    var lightboxNext = lightbox && lightbox.querySelector('[data-carousel-lightbox-next]');
    var lightboxFocus = null;
    var scrollLockY = 0;
    var activeCarousel = null;
    var activeKind = null;

    var CAROUSEL_LIGHTBOX = {
        showroom: {
            root: '[data-showroom-carousel]',
            slide: '[data-showroom-slide]',
            prev: '[data-showroom-prev]',
            next: '[data-showroom-next]',
            dialogLabel: 'Enlarged showroom photo',
            prevLabel: 'Previous collection',
            nextLabel: 'Next collection',
            showCta: true,
            showNote: true
        },
        case: {
            root: '[data-case-carousel]',
            slide: '[data-case-slide]',
            prev: '[data-case-prev]',
            next: '[data-case-next]',
            dialogLabel: 'Enlarged project photo',
            prevLabel: 'Previous home',
            nextLabel: 'Next home',
            showCta: false,
            showNote: false
        }
    };

    function lockScroll() {
        scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
        document.body.dataset.carouselLightboxLock = '1';
        document.body.classList.add('is-carousel-lightbox-open');
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = '-' + scrollLockY + 'px';
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
    }

    function unlockScroll() {
        if (document.body.dataset.carouselLightboxLock !== '1') return;
        document.body.removeAttribute('data-carousel-lightbox-lock');
        document.body.classList.remove('is-carousel-lightbox-open');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollLockY);
    }

    function getActiveSlide(carousel, slideSel) {
        return carousel.querySelector(slideSel + '[aria-hidden="false"]')
            || carousel.querySelector(slideSel);
    }

    function getCaptionParts(carousel, kind) {
        if (kind === 'showroom') {
            var showroomCap = carousel.querySelector('.lp-showroom-caption-overlay .lp-case-carousel__caption:not([hidden])');
            if (!showroomCap) return { title: '', subtitle: '' };

            var label = showroomCap.querySelector('.lp-case-carousel__label');
            var note = showroomCap.querySelector('.lp-showroom-caption__note');

            return {
                title: label && label.textContent.trim() ? label.textContent.trim() : '',
                subtitle: note && note.textContent.trim() ? note.textContent.trim() : ''
            };
        }

        var caseCap = carousel.querySelector('[data-case-caption]:not([hidden])');
        var titleEl = caseCap && caseCap.querySelector('.lp-case-carousel__title');
        var descEl = caseCap && caseCap.querySelector('.lp-case-carousel__desc');
        return {
            title: titleEl ? titleEl.textContent.trim() : '',
            subtitle: descEl ? descEl.textContent.trim() : ''
        };
    }

    function setLightboxCaption(title, subtitle) {
        if (!lightboxCaption) return;

        if (lightboxTitle) {
            lightboxTitle.textContent = title || '';
            lightboxTitle.hidden = !title;
        }
        if (lightboxSubtitle) {
            lightboxSubtitle.textContent = subtitle || '';
            lightboxSubtitle.hidden = !subtitle;
        }

        lightboxCaption.classList.toggle('is-stacked', Boolean(title && subtitle));

        if (title || subtitle) {
            lightboxCaption.hidden = false;
        } else {
            lightboxCaption.hidden = true;
        }
    }

    function syncLightboxFromCarousel(carousel, kind) {
        if (!lightbox || !lightboxImg || !carousel) return;

        var config = CAROUSEL_LIGHTBOX[kind];
        if (!config) return;

        var slide = getActiveSlide(carousel, config.slide);
        var img = slide && slide.querySelector('.lp-case-carousel__img');
        if (!img || !img.src) return;

        lightboxImg.src = img.currentSrc || img.src;
        lightboxImg.alt = img.alt || '';

        var parts = getCaptionParts(carousel, kind);
        setLightboxCaption(parts.title, parts.subtitle);
    }

    function stepActiveCarousel(direction) {
        var config = CAROUSEL_LIGHTBOX[activeKind];
        if (!activeCarousel || !config) return;

        var control = activeCarousel.querySelector(direction < 0 ? config.prev : config.next);
        if (!control) return;
        control.click();
        syncLightboxFromCarousel(activeCarousel, activeKind);
    }

    function applyLightboxChrome(kind) {
        var config = CAROUSEL_LIGHTBOX[kind];
        if (!config) return;

        if (lightboxPanel) {
            lightboxPanel.setAttribute('aria-label', config.dialogLabel);
        }
        if (lightboxPrev) {
            lightboxPrev.setAttribute('aria-label', config.prevLabel);
        }
        if (lightboxNext) {
            lightboxNext.setAttribute('aria-label', config.nextLabel);
        }
        if (lightboxCta) {
            lightboxCta.hidden = !config.showCta;
        }
        if (lightboxNote) {
            lightboxNote.hidden = !config.showNote;
        }
    }

    function openCarouselLightbox(carousel, kind, trigger) {
        if (!lightbox || !lightboxImg) return;

        var config = CAROUSEL_LIGHTBOX[kind];
        if (!config) return;

        var slide = getActiveSlide(carousel, config.slide);
        var img = slide && slide.querySelector('.lp-case-carousel__img');
        if (!img || !img.src) return;

        activeCarousel = carousel;
        activeKind = kind;
        lightboxFocus = trigger || img;
        applyLightboxChrome(kind);
        syncLightboxFromCarousel(carousel, kind);

        lightbox.hidden = false;
        lockScroll();
        lightbox.querySelector('.carousel-lightbox__close')?.focus({ preventScroll: true });
    }

    function closeCarouselLightbox() {
        if (!lightbox || lightbox.hidden) return;

        lightbox.hidden = true;
        lightboxImg.src = '';
        lightboxImg.alt = '';
        activeCarousel = null;
        activeKind = null;
        setLightboxCaption('', '');
        if (lightboxCta) {
            lightboxCta.hidden = false;
        }
        if (lightboxNote) {
            lightboxNote.hidden = true;
        }
        unlockScroll();

        if (lightboxFocus && typeof lightboxFocus.focus === 'function') {
            lightboxFocus.focus({ preventScroll: true });
        }
        lightboxFocus = null;
    }

    function bindCarouselLightbox(kind) {
        var config = CAROUSEL_LIGHTBOX[kind];
        var carousel = config && document.querySelector(config.root);
        if (!carousel) return;

        var media = carousel.querySelector('.lp-case-carousel__media');
        if (!media) return;

        media.addEventListener('click', function (event) {
            if (event.target.closest('.lp-case-carousel__nav')) return;
            if (!event.target.closest('.lp-case-carousel__figure')) return;
            openCarouselLightbox(carousel, kind, event.target.closest('.lp-case-carousel__figure'));
        });

        media.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            if (!event.target.closest('.lp-case-carousel__figure')) return;
            event.preventDefault();
            openCarouselLightbox(carousel, kind, event.target.closest('.lp-case-carousel__figure'));
        });

        carousel.querySelectorAll('.lp-case-carousel__figure').forEach(function (figure) {
            figure.setAttribute('tabindex', '0');
            figure.setAttribute('role', 'button');
            figure.setAttribute('aria-label', 'View larger photo');
        });
    }

    function initCarouselLightbox() {
        if (!lightbox) return;

        bindCarouselLightbox('showroom');
        bindCarouselLightbox('case');

        lightbox.querySelectorAll('[data-close-carousel-lightbox]').forEach(function (el) {
            el.addEventListener('click', closeCarouselLightbox);
        });

        lightboxPrev?.addEventListener('click', function (event) {
            event.stopPropagation();
            stepActiveCarousel(-1);
        });

        lightboxNext?.addEventListener('click', function (event) {
            event.stopPropagation();
            stepActiveCarousel(1);
        });

        document.addEventListener('keydown', function (event) {
            if (!lightbox || lightbox.hidden) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                closeCarouselLightbox();
                return;
            }

            if (!activeCarousel) return;

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                stepActiveCarousel(-1);
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                stepActiveCarousel(1);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCarouselLightbox);
    } else {
        initCarouselLightbox();
    }
}());
