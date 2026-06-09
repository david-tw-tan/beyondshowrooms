/**
 * Beyond Showrooms — Landing Page
 * Update contact URLs before going live.
 */
const LANDING_CONFIG = {
    discoveryCallUrl: '#book-call',
    whatsAppUrl: 'https://wa.me/',
    emailUrl: 'mailto:hello@beyondshowrooms.com',
    databaseUrl: 'furniture_database.json'
};

const SHOWROOM_IMAGE_BASE = 'img_db_final/';

const SHOWROOM_CONFIG = {
    minImages: 36,
    maxImages: 80,
    avgThumbHeight: 200,
    footerOverhead: 480,
    // Counter DB skew (53% ultra) — bias toward refined + minimalist for landing preview.
    styleWeights: {
        'ultra luxury': 0.23,
        'refined luxury': 0.33,
        'minimalist luxury': 0.29,
        'playful luxury': 0.15
    },
    poolWeights: [
        { key: 'collectionAnchor', share: 0.45 },
        { key: 'loose', share: 0.33 },
        { key: 'item', share: 0.22 }
    ]
};

const SPOTLIGHT_ITEMS = {
    bedroom: {
        full: 'html_images/img_bedroom_full.jpg',
        alt: 'Curated bedroom collection in a Foshan showroom',
        caption: 'Curated bedroom collection — tufted headboard suite and tailored bedding, customized for your home.'
    },
    dining: {
        full: 'html_images/img_dining_full.jpg',
        alt: 'Fendi Casa–inspired dining collection in a Foshan showroom',
        caption: 'Curated dining collection — Fendi Casa–inspired lacquer table and seating, tailored to your space and finish.'
    },
    accent: {
        full: 'html_images/style_img.jpg',
        alt: 'Gaetano Pesce La Mamma inspired accent chair in a showroom setting',
        caption: 'Gaetano Pesce "La Mamma" inspired accent chair — available in custom colors.'
    },
    living: {
        full: 'html_images/img_trusted.jpg',
        alt: 'Minotti-inspired living room collection in a Foshan showroom',
        caption: 'Curated living room collection — Minotti-inspired modular seating, tailored to your space and finish.'
    }
};

const header = document.querySelector('.lp-header');
const revealEls = document.querySelectorAll('.lp-reveal, .lp-reveal-group');
const hero = document.querySelector('.lp-hero');
const contactModal = document.getElementById('contactModal');
const spotlightModal = document.getElementById('spotlightModal');
const spotlightImage = document.getElementById('spotlightImage');
const spotlightCaption = document.getElementById('spotlightCaption');
const showroomModal = document.getElementById('showroomModal');
const showroomGallery = document.getElementById('showroomGallery');
const showroomScroll = document.getElementById('showroomScroll');
const openContactBtns = document.querySelectorAll('[data-open-contact]');
const closeContactEls = document.querySelectorAll('[data-close-contact]');
const spotlightTriggers = document.querySelectorAll('[data-spotlight]');
const closeSpotlightEls = document.querySelectorAll('[data-close-spotlight]');
const openShowroomEls = document.querySelectorAll('[data-open-showroom]');
const closeShowroomEls = document.querySelectorAll('[data-close-showroom]');

let furnitureCache = null;
let currentShowroomImages = null;
let showroomIsOpen = false;
let showroomLoadPromise = null;
let lastShowroomLayoutColumns = null;
let showroomResizeTimer = null;
let showroomCloseTimer = null;
const showroomAspectCache = new Map();
const SHOWROOM_MODAL_ANIM_MS = 500;

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
}

function updateHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 48);
}

function syncModalBodyLock() {
    const anyOpen =
        (contactModal && !contactModal.hidden) ||
        (spotlightModal && !spotlightModal.hidden) ||
        (showroomModal && !showroomModal.hidden);

    document.body.classList.toggle('lp-modal-open', Boolean(anyOpen));
}

function openContactModal() {
    if (!contactModal) return;
    contactModal.hidden = false;
    syncModalBodyLock();
}

function closeContactModal() {
    if (!contactModal) return;
    contactModal.hidden = true;
    syncModalBodyLock();
}

function openSpotlightModal(key) {
    const item = SPOTLIGHT_ITEMS[key];
    if (!spotlightModal || !spotlightImage || !spotlightCaption || !item) return;

    spotlightImage.src = item.full;
    spotlightImage.alt = item.alt;
    spotlightCaption.textContent = item.caption;
    spotlightModal.hidden = false;
    syncModalBodyLock();
    spotlightModal.querySelector('.lp-modal__close')?.focus();
}

function closeSpotlightModal() {
    if (!spotlightModal || spotlightModal.hidden) return;

    spotlightModal.hidden = true;
    syncModalBodyLock();
}

function initSpotlightModal() {
    spotlightTriggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
            openSpotlightModal(trigger.dataset.spotlight);
        });
    });

    closeSpotlightEls.forEach((el) => {
        el.addEventListener('click', closeSpotlightModal);
    });

    spotlightModal?.querySelector('[data-spotlight-explore]')?.addEventListener('click', async () => {
        closeSpotlightModal();
        await openShowroomModal();
    });
}

function initContactModal() {
    openContactBtns.forEach((btn) => {
        btn.addEventListener('click', openContactModal);
    });

    closeContactEls.forEach((el) => {
        el.addEventListener('click', closeContactModal);
    });

    contactModal?.querySelectorAll('[data-contact]').forEach((link) => {
        link.addEventListener('click', () => closeContactModal());
    });
}

function shuffleArray(items) {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function pickStyleBalanced(items, count, usedKeys) {
    if (!items.length || count <= 0) return [];

    const byStyle = new Map();
    items.forEach((item) => {
        const style = item.style_cat || 'unknown';
        if (!byStyle.has(style)) byStyle.set(style, []);
        byStyle.get(style).push(item);
    });

    const picked = [];

    shuffleArray(Object.entries(SHOWROOM_CONFIG.styleWeights)).forEach(([style, share]) => {
        const stylePool = byStyle.get(style) || [];
        if (!stylePool.length) return;

        const styleQuota = Math.max(1, Math.round(count * share));
        let styleAdded = 0;

        for (const item of shuffleArray(stylePool)) {
            if (styleAdded >= styleQuota || picked.length >= count) break;

            const key = getShowroomImageKey(item);
            if (!key || usedKeys.has(key)) continue;

            usedKeys.add(key);
            picked.push(item);
            styleAdded += 1;
        }
    });

    if (picked.length < count) {
        for (const item of shuffleArray(items)) {
            if (picked.length >= count) break;

            const key = getShowroomImageKey(item);
            if (!key || usedKeys.has(key)) continue;

            usedKeys.add(key);
            picked.push(item);
        }
    }

    return picked;
}

function splitShowroomPools(items) {
    return {
        collectionAnchor: items.filter((item) => item.img_category === 'collection'),
        loose: items.filter((item) => item.img_category === 'loose_item'),
        item: items.filter((item) => item.img_category === 'collection_item')
    };
}

function getDatabaseUrl() {
    return new URL(LANDING_CONFIG.databaseUrl, window.location.href).href;
}

function getShowroomImageKey(item) {
    return item.filename_raw || item.thumbnail_url || '';
}

function resolveShowroomImageUrl(item) {
    const file =
        item.filename_raw ||
        (item.thumbnail_url && item.thumbnail_url.split('/').pop());

    if (file) {
        return new URL(`${SHOWROOM_IMAGE_BASE}${file}`, window.location.href).href;
    }

    return item.thumbnail_url || '';
}

function getShowroomTargetCount() {
    const columnCount = getShowroomColumnCount();
    const scrollHeight =
        showroomScroll?.clientHeight || Math.round(window.innerHeight * 0.72);
    const rowsNeeded =
        Math.ceil(
            (scrollHeight + SHOWROOM_CONFIG.footerOverhead) /
                SHOWROOM_CONFIG.avgThumbHeight
        ) + 4;
    const dynamicTarget = rowsNeeded * columnCount;

    return Math.min(
        SHOWROOM_CONFIG.maxImages,
        Math.max(SHOWROOM_CONFIG.minImages, dynamicTarget)
    );
}

function buildShowroomSelection(items, targetCount = getShowroomTargetCount()) {
    const validItems = items.filter((item) => getShowroomImageKey(item));
    const pools = splitShowroomPools(validItems);
    const selected = [];
    const usedKeys = new Set();

    SHOWROOM_CONFIG.poolWeights.forEach(({ key, share }) => {
        const pool = pools[key] || [];
        if (!pool.length) return;

        const quota = Math.max(1, Math.round(targetCount * share));
        const picks = pickStyleBalanced(pool, quota, usedKeys);
        selected.push(...picks);
    });

    if (selected.length < targetCount) {
        const remainder = validItems.filter((item) => !usedKeys.has(getShowroomImageKey(item)));
        const picks = pickStyleBalanced(remainder, targetCount - selected.length, usedKeys);
        selected.push(...picks);
    }

    return shuffleArray(selected.slice(0, targetCount));
}

async function loadFurnitureDatabase() {
    if (furnitureCache) return furnitureCache;

    if (window.location.protocol === 'file:') {
        throw new Error(
            'Showroom gallery requires a local server. Open landing_page.html via http://localhost, not file://.'
        );
    }

    if (!showroomLoadPromise) {
        showroomLoadPromise = (async () => {
            const response = await fetch(getDatabaseUrl());

            if (!response.ok) {
                throw new Error(`Failed to load furniture database (${response.status})`);
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error('Furniture database is not a valid image list.');
            }

            furnitureCache = data;
            return furnitureCache;
        })().catch((error) => {
            showroomLoadPromise = null;
            throw error;
        });
    }

    return showroomLoadPromise;
}

function getShowroomColumnCount() {
    const w = showroomGallery?.clientWidth || window.innerWidth;
    if (w < 768) return 2;
    if (w < 900) return 3;
    if (w < 1100) return 4;
    return 5;
}

function createShowroomMasonryColumns(columnCount) {
    const columns = [];

    for (let i = 0; i < columnCount; i++) {
        const col = document.createElement('div');
        col.className = 'masonry-column';
        showroomGallery.appendChild(col);
        columns.push(col);
    }

    return columns;
}

function createShowroomGalleryItem(item, eager = false) {
    const figure = document.createElement('figure');
    figure.className = 'lp-showroom-gallery__item';

    const img = document.createElement('img');
    img.alt = '';
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.src = resolveShowroomImageUrl(item);

    if (item.thumbnail_url) {
        img.addEventListener('error', () => {
            if (img.dataset.fallbackApplied === 'true') return;
            img.dataset.fallbackApplied = 'true';
            img.src = item.thumbnail_url;
        }, { once: true });
    }

    figure.appendChild(img);
    return figure;
}

function pickShortestShowroomColumn(columns, heights) {
    let target = 0;

    for (let c = 1; c < columns.length; c++) {
        if (heights[c] < heights[target]) {
            target = c;
        } else if (
            heights[c] === heights[target] &&
            columns[c].children.length < columns[target].children.length
        ) {
            target = c;
        }
    }

    return target;
}

function getShowroomColumnGap(columnCount) {
    if (columnCount >= 4) return 16;
    if (columnCount >= 2) return 14;
    return 10;
}

function getShowroomColumnWidth(columnCount) {
    const columnGap = getShowroomColumnGap(columnCount);
    const galleryWidth = showroomGallery?.clientWidth || window.innerWidth;
    return Math.max(120, (galleryWidth - columnGap * (columnCount - 1)) / columnCount);
}

function loadShowroomImageAspect(item) {
    const key = getShowroomImageKey(item);
    if (showroomAspectCache.has(key)) {
        return Promise.resolve(showroomAspectCache.get(key));
    }

    const probeUrl = item.thumbnail_url || resolveShowroomImageUrl(item);

    return new Promise((resolve) => {
        if (!probeUrl) {
            const fallback = 1.2;
            showroomAspectCache.set(key, fallback);
            resolve(fallback);
            return;
        }

        const img = new Image();
        img.decoding = 'async';

        img.onload = () => {
            const ratio =
                img.naturalWidth > 0 && img.naturalHeight > 0
                    ? img.naturalHeight / img.naturalWidth
                    : 1.2;
            showroomAspectCache.set(key, ratio);
            resolve(ratio);
        };

        img.onerror = () => {
            showroomAspectCache.set(key, 1.2);
            resolve(1.2);
        };

        img.src = probeUrl;
    });
}

async function getShowroomImageAspects(images) {
    return Promise.all(images.map((item) => loadShowroomImageAspect(item)));
}

function distributeShowroomImages(columns, images, columnCount, aspects) {
    const heights = new Array(columnCount).fill(0);
    const columnGap = getShowroomColumnGap(columnCount);
    const columnWidth = getShowroomColumnWidth(columnCount);
    const eagerCount = columnCount * 4;

    images.forEach((item, i) => {
        const target = pickShortestShowroomColumn(columns, heights);
        const figure = createShowroomGalleryItem(item, i < eagerCount);
        columns[target].appendChild(figure);
        heights[target] += columnWidth * aspects[i] + columnGap;
    });
}

async function renderShowroomGallery(images) {
    if (!showroomGallery || !images.length) return;

    setShowroomLoading('Curating sample pieces…');

    const columnCount = getShowroomColumnCount();
    lastShowroomLayoutColumns = columnCount;
    const aspects = await getShowroomImageAspects(images);

    showroomGallery.innerHTML = '';
    showroomGallery.classList.remove('is-loading');
    showroomGallery.classList.add('masonry-layout');
    showroomScroll?.classList.remove('is-gallery-loading');

    const columns = createShowroomMasonryColumns(columnCount);
    distributeShowroomImages(columns, images, columnCount, aspects);
}

async function refreshShowroomLayoutIfColumnsChanged() {
    if (!showroomIsOpen || !furnitureCache) return;
    const cols = getShowroomColumnCount();
    if (cols === lastShowroomLayoutColumns) return;
    currentShowroomImages = buildShowroomSelection(furnitureCache);
    await renderShowroomGallery(currentShowroomImages);
}

function setShowroomLoading(message) {
    if (!showroomGallery) return;

    showroomScroll?.classList.add('is-gallery-loading');
    showroomGallery.classList.add('is-loading');
    showroomGallery.classList.remove('masonry-layout');
    lastShowroomLayoutColumns = null;
    showroomGallery.innerHTML = `
        <div class="lp-showroom-loading" role="status" aria-live="polite">
            <div class="lp-showroom-loading__spinner" aria-hidden="true"></div>
            <p class="lp-showroom-loading__text">${message}</p>
        </div>
    `;
}

function showroomMotionEnabled() {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function revealShowroomModal() {
    if (!showroomModal) return;

    if (showroomCloseTimer) {
        clearTimeout(showroomCloseTimer);
        showroomCloseTimer = null;
    }

    showroomModal.hidden = false;
    showroomModal.classList.remove('is-open');

    if (!showroomMotionEnabled()) {
        showroomModal.classList.add('is-open');
        return;
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            showroomModal.classList.add('is-open');
        });
    });
}

function hideShowroomModalShell() {
    return new Promise((resolve) => {
        if (!showroomModal || showroomModal.hidden) {
            resolve();
            return;
        }

        const finish = () => {
            showroomModal.hidden = true;
            showroomModal.classList.remove('is-open');
            showroomCloseTimer = null;
            resolve();
        };

        if (!showroomMotionEnabled() || !showroomModal.classList.contains('is-open')) {
            finish();
            return;
        }

        showroomModal.classList.remove('is-open');
        showroomCloseTimer = window.setTimeout(finish, SHOWROOM_MODAL_ANIM_MS);
    });
}

async function openShowroomModal(event) {
    if (event) event.preventDefault();
    if (!showroomModal || showroomIsOpen) return;

    showroomIsOpen = true;
    revealShowroomModal();
    syncModalBodyLock();

    if (showroomScroll) showroomScroll.scrollTop = 0;

    try {
        const database = await loadFurnitureDatabase();
        currentShowroomImages = buildShowroomSelection(database);

        if (!currentShowroomImages.length) {
            throw new Error('No showroom images available.');
        }

        await renderShowroomGallery(currentShowroomImages);
    } catch (error) {
        console.error('[showroom]', error);
        const hint =
            window.location.protocol === 'file:'
                ? 'Open this page through a local server (for example: python3 -m http.server).'
                : 'Unable to load showroom pieces. Please try again.';
        setShowroomLoading(hint);
        currentShowroomImages = null;
    }
}

async function closeShowroomModal() {
    if (!showroomModal || showroomModal.hidden) return;

    showroomIsOpen = false;
    await hideShowroomModalShell();
    currentShowroomImages = null;

    syncModalBodyLock();
}

function initShowroomModal() {
    openShowroomEls.forEach((el) => {
        el.addEventListener('click', openShowroomModal);
    });

    closeShowroomEls.forEach((el) => {
        el.addEventListener('click', closeShowroomModal);
    });

    showroomModal?.querySelector('[data-showroom-book]')?.addEventListener('click', async () => {
        await closeShowroomModal();
        openContactModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;

        if (showroomModal && !showroomModal.hidden) {
            closeShowroomModal();
            return;
        }

        if (spotlightModal && !spotlightModal.hidden) {
            closeSpotlightModal();
            return;
        }

        if (contactModal && !contactModal.hidden) {
            closeContactModal();
        }
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
initSpotlightModal();
initShowroomModal();
updateHeader();
initReveal();
initNavHighlight();

loadFurnitureDatabase().catch((error) => {
    console.warn('[showroom] Preload skipped:', error.message);
});

window.addEventListener('scroll', updateHeader, { passive: true });

window.addEventListener('resize', () => {
    clearTimeout(showroomResizeTimer);
    showroomResizeTimer = setTimeout(refreshShowroomLayoutIfColumnsChanged, 200);
});
