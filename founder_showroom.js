/**
 * Founder homepage — collection carousel & preview modal
 */
const SHOWROOM_SECTIONS = [
    {
        title: 'Living room',
        items: [1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
            buildShowroomItem(`images/collection_living_${n}.jpg`)
        )
    },
    {
        title: 'Bedroom',
        items: [1, 2, 4, 5].map((n) =>
            buildShowroomItem(`images/collection_bed_${n}.jpg`)
        )
    },
    {
        title: 'Dining room',
        items: [1, 2, 3, 4].map((n) =>
            buildShowroomItem(`images/collection_dining_${n}.jpg`)
        )
    },
    {
        title: 'Accessories',
        subtitle: 'Statement pieces to complete your room.',
        layout: 'collage',
        items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) =>
            buildShowroomItem(`images/accessory_${n}.jpg`)
        )
    }
];

const showroomModal = document.getElementById('showroomModal');
const showroomGallery = document.getElementById('showroomGallery');
const showroomScroll = document.getElementById('showroomScroll');
const openShowroomEls = document.querySelectorAll('[data-open-showroom]');
const closeShowroomEls = document.querySelectorAll('[data-close-showroom]');

let showroomIsOpen = false;
let lastShowroomLayoutColumns = null;
let showroomResizeTimer = null;
let showroomCloseTimer = null;
const showroomAspectCache = new Map();
const SHOWROOM_MODAL_ANIM_MS = 500;

function getShowroomImageKey(item) {
    return item.image || '';
}

function resolveShowroomImageUrl(item) {
    if (!item.image) return '';
    return new URL(item.image, window.location.href).href;
}

function getShowroomColumnCount() {
    const w = showroomGallery?.clientWidth || window.innerWidth;
    return w < 768 ? 1 : 2;
}

function createShowroomMasonryColumns(parent, columnCount) {
    const columns = [];

    for (let i = 0; i < columnCount; i++) {
        const col = document.createElement('div');
        col.className = 'masonry-column';
        parent.appendChild(col);
        columns.push(col);
    }

    return columns;
}

function createShowroomGalleryItem(item, eager = false) {
    const figure = document.createElement('figure');
    figure.className = 'lp-showroom-gallery__item';

    const img = document.createElement('img');
    img.alt = item.alt || 'Curated whole-room collection';
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.src = resolveShowroomImageUrl(item);

    figure.appendChild(img);

    if (item.caption) {
        const caption = document.createElement('figcaption');
        caption.className = 'lp-showroom-gallery__caption';
        caption.textContent = item.caption;
        figure.appendChild(caption);
    }

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
    return columnCount >= 2 ? 14 : 10;
}

function getShowroomColumnWidth(columnCount, gridEl) {
    const columnGap = getShowroomColumnGap(columnCount);
    const galleryWidth = gridEl?.clientWidth || showroomGallery?.clientWidth || window.innerWidth;
    return Math.max(120, (galleryWidth - columnGap * (columnCount - 1)) / columnCount);
}

function loadShowroomImageAspect(item) {
    const key = getShowroomImageKey(item);
    if (showroomAspectCache.has(key)) {
        return Promise.resolve(showroomAspectCache.get(key));
    }

    const probeUrl = resolveShowroomImageUrl(item);

    return new Promise((resolve) => {
        if (!probeUrl) {
            showroomAspectCache.set(key, 1.2);
            resolve(1.2);
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

function distributeShowroomImages(columns, images, columnCount, aspects, gridEl) {
    const heights = new Array(columnCount).fill(0);
    const columnGap = getShowroomColumnGap(columnCount);
    const columnWidth = getShowroomColumnWidth(columnCount, gridEl);
    const eagerCount = columnCount * 2;

    images.forEach((item, i) => {
        const target = pickShortestShowroomColumn(columns, heights);
        const figure = createShowroomGalleryItem(item, i < eagerCount);
        columns[target].appendChild(figure);
        heights[target] += columnWidth * aspects[i] + columnGap;
    });
}

function mountShowroomSection(section) {
    const sectionEl = document.createElement('section');
    sectionEl.className = 'lp-showroom-section';

    const title = document.createElement('h3');
    title.className = 'lp-showroom-section-title';
    title.textContent = section.title;
    sectionEl.appendChild(title);

    if (section.subtitle) {
        const subtitle = document.createElement('p');
        subtitle.className = 'lp-showroom-section-subtitle';
        subtitle.textContent = section.subtitle;
        sectionEl.appendChild(subtitle);
    }

    const grid = document.createElement('div');
    grid.className = 'lp-showroom-section-grid masonry-layout';
    sectionEl.appendChild(grid);

    return { sectionEl, grid };
}

function createShowroomCollageItem(item, eager = false) {
    const figure = document.createElement('figure');
    figure.className = 'lp-showroom-accessories__item';

    const img = document.createElement('img');
    img.alt = item.alt || 'Showroom accessory piece';
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.src = resolveShowroomImageUrl(item);

    figure.appendChild(img);
    return figure;
}

function mountShowroomCollageSection(section) {
    const sectionEl = document.createElement('section');
    sectionEl.className = 'lp-showroom-section lp-showroom-section--accessories';

    const title = document.createElement('h3');
    title.className = 'lp-showroom-section-title';
    title.textContent = section.title;
    sectionEl.appendChild(title);

    if (section.subtitle) {
        const subtitle = document.createElement('p');
        subtitle.className = 'lp-showroom-section-subtitle';
        subtitle.textContent = section.subtitle;
        sectionEl.appendChild(subtitle);
    }

    const grid = document.createElement('div');
    grid.className = 'lp-showroom-section-grid lp-showroom-section-grid--accessories';
    section.items.forEach((item, index) => {
        grid.appendChild(createShowroomCollageItem(item, index < 6));
    });
    sectionEl.appendChild(grid);

    return sectionEl;
}

async function renderShowroomGallery(sections = SHOWROOM_SECTIONS) {
    if (!showroomGallery || !sections.length) return;

    const hasItems = sections.some((section) => section.items?.length);
    if (!hasItems) return;

    setShowroomLoading('Loading collections…');

    const columnCount = getShowroomColumnCount();
    lastShowroomLayoutColumns = columnCount;

    const aspectGroups = await Promise.all(
        sections.map((section) =>
            section.layout === 'collage'
                ? Promise.resolve(null)
                : getShowroomImageAspects(section.items)
        )
    );

    showroomGallery.innerHTML = '';
    showroomGallery.classList.remove('is-loading');
    showroomGallery.classList.add('lp-showroom-sections');
    showroomScroll?.classList.remove('is-gallery-loading');

    sections.forEach((section, index) => {
        if (section.layout === 'collage') {
            showroomGallery.appendChild(mountShowroomCollageSection(section));
            return;
        }

        const { sectionEl, grid } = mountShowroomSection(section);
        const columns = createShowroomMasonryColumns(grid, columnCount);
        distributeShowroomImages(
            columns,
            section.items,
            columnCount,
            aspectGroups[index],
            grid
        );
        showroomGallery.appendChild(sectionEl);
    });
}

async function refreshShowroomLayoutIfColumnsChanged() {
    if (!showroomIsOpen) return;
    const cols = getShowroomColumnCount();
    if (cols === lastShowroomLayoutColumns) return;
    await renderShowroomGallery(SHOWROOM_SECTIONS);
}

function setShowroomLoading(message) {
    if (!showroomGallery) return;

    showroomScroll?.classList.add('is-gallery-loading');
    showroomGallery.classList.add('is-loading');
    showroomGallery.classList.remove('lp-showroom-sections');
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

function syncShowroomModalBodyLock() {
    const contactModal = document.getElementById('contactModal');
    const anyOpen =
        (showroomModal && !showroomModal.hidden) ||
        (contactModal && !contactModal.hidden);

    document.body.style.overflow = anyOpen ? 'hidden' : '';
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
    syncShowroomModalBodyLock();

    if (showroomScroll) showroomScroll.scrollTop = 0;

    try {
        await renderShowroomGallery(SHOWROOM_SECTIONS);
    } catch (error) {
        console.error('[showroom]', error);
        setShowroomLoading('Unable to load collections. Please try again.');
    }
}

async function closeShowroomModal() {
    if (!showroomModal || showroomModal.hidden) return;

    showroomIsOpen = false;
    await hideShowroomModalShell();
    syncShowroomModalBodyLock();
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
        if (typeof window.openFounderContact === 'function') {
            window.openFounderContact();
        }
    });
}

function initSlideCarousel(carousel, config) {
    const track = carousel.querySelector(config.track);
    const slides = [...carousel.querySelectorAll(config.slide)];
    const captions = [...carousel.querySelectorAll(config.caption)];
    const prevBtn = carousel.querySelector(config.prev);
    const nextBtn = carousel.querySelector(config.next);
    const dotsContainer = carousel.querySelector(config.dots);
    const viewport = carousel.querySelector(config.viewport);

    if (!track || slides.length === 0) return;

    let index = 0;
    let touchStartX = 0;
    const dotLabel = config.dotLabel || 'Slide';

    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = config.dotClass;
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `${dotLabel} ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsContainer?.appendChild(dot);
    });

    const dots = [...dotsContainer?.querySelectorAll(`.${config.dotClass}`) ?? []];

    function goTo(nextIndex) {
        index = (nextIndex + slides.length) % slides.length;

        track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;

        slides.forEach((slide, i) => {
            slide.setAttribute('aria-hidden', i !== index ? 'true' : 'false');
        });

        captions.forEach((caption, i) => {
            caption.hidden = i !== index;
        });

        dots.forEach((dot, i) => {
            const isActive = i === index;
            dot.classList.toggle('is-active', isActive);
            dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    }

    prevBtn?.addEventListener('click', () => goTo(index - 1));
    nextBtn?.addEventListener('click', () => goTo(index + 1));

    carousel.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            goTo(index - 1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            goTo(index + 1);
        }
    });

    viewport?.addEventListener(
        'touchstart',
        (event) => {
            touchStartX = event.changedTouches[0]?.screenX ?? 0;
        },
        { passive: true }
    );

    viewport?.addEventListener(
        'touchend',
        (event) => {
            const touchEndX = event.changedTouches[0]?.screenX ?? 0;
            const delta = touchEndX - touchStartX;

            if (Math.abs(delta) < 40) return;

            if (delta < 0) goTo(index + 1);
            else goTo(index - 1);
        },
        { passive: true }
    );

    goTo(0);
}

function initCaseStudyCarousel() {
    const carousel = document.querySelector('[data-case-carousel]');
    if (!carousel) return;

    initSlideCarousel(carousel, {
        track: '[data-case-track]',
        slide: '[data-case-slide]',
        caption: '[data-case-caption]',
        prev: '[data-case-prev]',
        next: '[data-case-next]',
        dots: '[data-case-dots]',
        viewport: '.lp-case-carousel__viewport',
        dotClass: 'lp-case-carousel__dot',
        dotLabel: 'Home'
    });
}

function initShowroomCarousel() {
    const carousel = document.querySelector('[data-showroom-carousel]');
    if (!carousel) return;

    initSlideCarousel(carousel, {
        track: '[data-showroom-track]',
        slide: '[data-showroom-slide]',
        caption: '[data-showroom-caption]',
        prev: '[data-showroom-prev]',
        next: '[data-showroom-next]',
        dots: '[data-showroom-dots]',
        viewport: '.lp-case-carousel__viewport',
        dotClass: 'lp-case-carousel__dot',
        dotLabel: 'Collection'
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && showroomModal && !showroomModal.hidden) {
        closeShowroomModal();
    }
});

document.addEventListener('DOMContentLoaded', function () {
    initShowroomCarousel();
    initCaseStudyCarousel();
    initShowroomModal();
});

window.addEventListener('resize', () => {
    clearTimeout(showroomResizeTimer);
    showroomResizeTimer = setTimeout(refreshShowroomLayoutIfColumnsChanged, 200);
});
