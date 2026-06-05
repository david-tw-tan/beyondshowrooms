/**
 * Beyond Showrooms — Landing Page
 * Update contact URLs before going live.
 */
const LANDING_CONFIG = {
    discoveryCallUrl: '#book-call',
    whatsAppUrl: 'https://wa.me/',
    emailUrl: 'mailto:hello@beyondshowrooms.com',
    visualizerUrl: 'index.html'
};

const header = document.querySelector('.lp-header');
const revealEls = document.querySelectorAll('.lp-reveal');
const hero = document.querySelector('.lp-hero');
const contactModal = document.getElementById('contactModal');
const openContactBtns = document.querySelectorAll('[data-open-contact]');
const closeContactEls = document.querySelectorAll('[data-close-contact]');

function applyContactLinks() {
    const discovery = document.querySelector('[data-contact="discovery"]');
    const whatsapp = document.querySelector('[data-contact="whatsapp"]');
    const email = document.querySelector('[data-contact="email"]');

    if (discovery) discovery.setAttribute('href', LANDING_CONFIG.discoveryCallUrl);
    if (whatsapp) {
        whatsapp.setAttribute('href', LANDING_CONFIG.whatsAppUrl);
        whatsapp.setAttribute('target', '_blank');
        whatsapp.setAttribute('rel', 'noopener noreferrer');
    }
    if (email) email.setAttribute('href', LANDING_CONFIG.emailUrl);

    const toolLink = document.getElementById('styleToolLink');
    if (toolLink) toolLink.setAttribute('href', LANDING_CONFIG.visualizerUrl);
}

function updateHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 48);
}

function openContactModal() {
    if (!contactModal) return;
    contactModal.hidden = false;
    document.body.classList.add('lp-modal-open');
    const closeBtn = contactModal.querySelector('.lp-modal__close');
    if (closeBtn) closeBtn.focus();
}

function closeContactModal() {
    if (!contactModal) return;
    contactModal.hidden = true;
    document.body.classList.remove('lp-modal-open');
}

function initContactModal() {
    openContactBtns.forEach((btn) => {
        btn.addEventListener('click', openContactModal);
    });

    closeContactEls.forEach((el) => {
        el.addEventListener('click', closeContactModal);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && contactModal && !contactModal.hidden) {
            closeContactModal();
        }
    });

    contactModal?.querySelectorAll('[data-contact]').forEach((link) => {
        link.addEventListener('click', () => closeContactModal());
    });
}

function initReveal() {
    if (!revealEls.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        revealEls.forEach((el) => el.classList.add('is-visible'));
        if (hero) hero.classList.add('is-visible');
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );

    revealEls.forEach((el) => observer.observe(el));
    if (hero) {
        requestAnimationFrame(() => hero.classList.add('is-visible'));
    }
}

function initNavHighlight() {
    const sections = [...document.querySelectorAll('[data-section]')];
    const navLinks = [...document.querySelectorAll('.lp-nav a[data-nav]')];
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const id = entry.target.dataset.section;
                navLinks.forEach((link) => {
                    link.classList.toggle('is-active', link.dataset.nav === id);
                });
            });
        },
        { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
}

applyContactLinks();
initContactModal();
updateHeader();
initReveal();
initNavHighlight();

window.addEventListener('scroll', updateHeader, { passive: true });
