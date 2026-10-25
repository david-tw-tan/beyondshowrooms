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
    var lightboxFocus = null;
    var scrollLockY = 0;
    var activeShowroomCarousel = null;

    function lockScroll() {
        scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
        document.body.dataset.carouselLightboxLock = '1';
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
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollLockY);
    }

    function getActiveShowroomSlide(carousel) {
        return carousel.querySelector('[data-showroom-slide][aria-hidden="false"]')
            || carousel.querySelector('[data-showroom-slide]');
    }

    function getShowroomCaptionText(carousel) {
        var cap = carousel.querySelector('.lp-showroom-caption-overlay .lp-case-carousel__caption:not([hidden])');
        if (!cap) return '';

        var label = cap.querySelector('.lp-case-carousel__label');
        var note = cap.querySelector('.lp-showroom-caption__note');
        var parts = [];

        if (label && label.textContent.trim()) {
            parts.push(label.textContent.trim());
        }
        if (note && note.textContent.trim()) {
            parts.push(note.textContent.trim());
        }

        return parts.join(' — ');
    }

    function syncLightboxFromCarousel(carousel) {
        if (!lightbox || !lightboxImg || !carousel) return;

        var slide = getActiveShowroomSlide(carousel);
        var img = slide && slide.querySelector('.lp-case-carousel__img');
        if (!img || !img.src) return;

        lightboxImg.src = img.currentSrc || img.src;
        lightboxImg.alt = img.alt || '';

        var captionText = getShowroomCaptionText(carousel);
        if (lightboxCaption) {
            if (captionText) {
                lightboxCaption.textContent = captionText;
                lightboxCaption.hidden = false;
            } else {
                lightboxCaption.textContent = '';
                lightboxCaption.hidden = true;
            }
        }
    }

    function stepShowroomCarousel(carousel, direction) {
        var control = carousel.querySelector(direction < 0 ? '[data-showroom-prev]' : '[data-showroom-next]');
        if (!control) return;
        control.click();
        syncLightboxFromCarousel(carousel);
    }

    function openShowroomCarouselLightbox(carousel, trigger) {
        if (!lightbox || !lightboxImg) return;

        var slide = getActiveShowroomSlide(carousel);
        var img = slide && slide.querySelector('.lp-case-carousel__img');
        if (!img || !img.src) return;

        activeShowroomCarousel = carousel;
        lightboxFocus = trigger || img;
        syncLightboxFromCarousel(carousel);

        lightbox.hidden = false;
        lockScroll();
        lightbox.querySelector('.carousel-lightbox__close')?.focus({ preventScroll: true });
    }

    function closeShowroomCarouselLightbox() {
        if (!lightbox || lightbox.hidden) return;

        lightbox.hidden = true;
        lightboxImg.src = '';
        lightboxImg.alt = '';
        activeShowroomCarousel = null;
        if (lightboxCaption) {
            lightboxCaption.textContent = '';
            lightboxCaption.hidden = true;
        }
        unlockScroll();

        if (lightboxFocus && typeof lightboxFocus.focus === 'function') {
            lightboxFocus.focus({ preventScroll: true });
        }
        lightboxFocus = null;
    }

    function initShowroomCarouselLightbox() {
        var carousel = document.querySelector('[data-showroom-carousel]');
        if (!carousel || !lightbox) return;

        var media = carousel.querySelector('.lp-case-carousel__media');
        if (!media) return;

        media.addEventListener('click', function (event) {
            if (event.target.closest('.lp-case-carousel__nav')) return;
            if (!event.target.closest('.lp-case-carousel__figure')) return;
            openShowroomCarouselLightbox(carousel, event.target.closest('.lp-case-carousel__figure'));
        });

        media.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            if (!event.target.closest('.lp-case-carousel__figure')) return;
            event.preventDefault();
            openShowroomCarouselLightbox(carousel, event.target.closest('.lp-case-carousel__figure'));
        });

        carousel.querySelectorAll('.lp-case-carousel__figure').forEach(function (figure) {
            figure.setAttribute('tabindex', '0');
            figure.setAttribute('role', 'button');
            figure.setAttribute('aria-label', 'View larger photo');
        });

        lightbox.querySelectorAll('[data-close-carousel-lightbox]').forEach(function (el) {
            el.addEventListener('click', closeShowroomCarouselLightbox);
        });

        lightbox.querySelector('[data-carousel-lightbox-prev]')?.addEventListener('click', function (event) {
            event.stopPropagation();
            if (activeShowroomCarousel) {
                stepShowroomCarousel(activeShowroomCarousel, -1);
            }
        });

        lightbox.querySelector('[data-carousel-lightbox-next]')?.addEventListener('click', function (event) {
            event.stopPropagation();
            if (activeShowroomCarousel) {
                stepShowroomCarousel(activeShowroomCarousel, 1);
            }
        });

        document.addEventListener('keydown', function (event) {
            if (!lightbox || lightbox.hidden) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                closeShowroomCarouselLightbox();
                return;
            }

            if (!activeShowroomCarousel) return;

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                stepShowroomCarousel(activeShowroomCarousel, -1);
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                stepShowroomCarousel(activeShowroomCarousel, 1);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initShowroomCarouselLightbox);
    } else {
        initShowroomCarouselLightbox();
    }
}());
