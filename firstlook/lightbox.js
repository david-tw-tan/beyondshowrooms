/**
 * Beyond Showrooms — First Look (shared)
 * Masonry grid + lightbox + sticky room nav + collapsible rooms.
 *
 * Expects window.FIRST_LOOK_CONFIG (defined in the client index.html):
 * {
 *   rooms: [
 *     {
 *       id: 'living-room',          // used for anchors + sticky nav
 *       title: 'Living Room',
 *       images: [
 *         { src: 'livingroom1_01.jpg', caption: 'Material — detail.', alt: '…' }
 *       ]
 *     }
 *   ]
 * }
 */

(function () {
    'use strict';

    const config = window.FIRST_LOOK_CONFIG;
    if (!config || !Array.isArray(config.rooms)) {
        console.error('FIRST_LOOK_CONFIG.rooms is required.');
        return;
    }

    const roomsRoot = document.getElementById('fl-rooms');
    const navRoot = document.getElementById('fl-room-nav');
    if (!roomsRoot) return;

    const aspectCache = new Map();
    const masonryState = new WeakMap();
    let resizeTimer = null;

    /* ─── Column count (mobile 1 / tablet 2 / desktop 3) ─── */

    /* Column count uses gallery width (page is capped ~68rem, so viewport≥1280 never applied before). */
    function getColumnCount(width) {
        if (width < 640) return 1;
        if (width < 960) return 2;
        return 3;
    }

    function getColumnGap(columnCount) {
        if (columnCount >= 3) return 16;
        if (columnCount >= 2) return 14;
        return 10;
    }

    /* ─── Masonry helpers (adapted from homepage showroom modal) ─── */

    function createColumns(parent, columnCount) {
        const columns = [];
        for (let i = 0; i < columnCount; i++) {
            const col = document.createElement('div');
            col.className = 'masonry-column';
            parent.appendChild(col);
            columns.push(col);
        }
        return columns;
    }

    function pickShortestColumn(columns, heights) {
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

    function getColumnWidth(columnCount, gridEl) {
        const columnGap = getColumnGap(columnCount);
        const galleryWidth = gridEl.clientWidth || window.innerWidth;
        return Math.max(120, (galleryWidth - columnGap * (columnCount - 1)) / columnCount);
    }

    function loadAspect(src) {
        if (aspectCache.has(src)) {
            return Promise.resolve(aspectCache.get(src));
        }

        return new Promise((resolve) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => {
                const ratio =
                    img.naturalWidth > 0 && img.naturalHeight > 0
                        ? img.naturalHeight / img.naturalWidth
                        : 1.2;
                aspectCache.set(src, ratio);
                resolve(ratio);
            };
            img.onerror = () => {
                aspectCache.set(src, 1.2);
                resolve(1.2);
            };
            img.src = src;
        });
    }

    const EAGER_IMAGE_COUNT = 6; // first N images on the page load immediately (above the fold)

    function createGalleryItem(item, globalIndex) {
        const figure = document.createElement('figure');
        figure.className = 'fl-gallery__item';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', 'View larger: ' + (item.alt || item.caption || 'Furniture piece'));
        btn.dataset.lightboxIndex = String(globalIndex);

        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt || item.caption || '';
        // Top of page: eager. Below fold: browser lazy-loads as user scrolls.
        const eager = globalIndex < EAGER_IMAGE_COUNT;
        img.loading = eager ? 'eager' : 'lazy';
        img.decoding = 'async';
        if (globalIndex < 2) {
            img.fetchPriority = 'high';
        }

        btn.appendChild(img);
        figure.appendChild(btn);

        if (item.caption) {
            const caption = document.createElement('figcaption');
            caption.className = 'fl-gallery__caption';
            caption.textContent = item.caption;
            figure.appendChild(caption);
        }

        return figure;
    }

    function distributeImages(columns, images, columnCount, aspects, gridEl, indexOffset) {
        const heights = new Array(columnCount).fill(0);
        const columnGap = getColumnGap(columnCount);
        const columnWidth = getColumnWidth(columnCount, gridEl);

        images.forEach((item, i) => {
            const target = pickShortestColumn(columns, heights);
            const figure = createGalleryItem(item, indexOffset + i);
            columns[target].appendChild(figure);
            heights[target] += columnWidth * aspects[i] + columnGap;
        });
    }

    async function renderMasonry(gridEl, images, indexOffset) {
        if (!images.length) {
            gridEl.innerHTML = '';
            return;
        }

        const columnCount = getColumnCount(gridEl.clientWidth || window.innerWidth);
        const aspects = await Promise.all(images.map((item) => loadAspect(item.src)));

        gridEl.innerHTML = '';
        gridEl.classList.add('masonry-layout');
        const columns = createColumns(gridEl, columnCount);
        distributeImages(columns, images, columnCount, aspects, gridEl, indexOffset);

        masonryState.set(gridEl, { images, indexOffset, columnCount });
    }

    async function rerenderAllMasonry() {
        const grids = roomsRoot.querySelectorAll('.fl-masonry');
        for (const grid of grids) {
            const state = masonryState.get(grid);
            if (!state) continue;
            const nextCount = getColumnCount(grid.clientWidth || window.innerWidth);
            if (nextCount === state.columnCount) continue;
            await renderMasonry(grid, state.images, state.indexOffset);
        }
    }

    /* ─── Sticky nav ─── */

    function buildStickyNav(rooms) {
        if (!navRoot) return;

        const list = document.createElement('ul');
        list.className = 'fl-room-nav__list';
        list.setAttribute('role', 'list');

        rooms.forEach((room) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'fl-room-nav__link';
            a.href = '#' + room.id;
            a.textContent = room.title;
            a.dataset.roomTarget = room.id;
            li.appendChild(a);
            list.appendChild(li);
        });

        navRoot.innerHTML = '';
        navRoot.appendChild(list);
        navRoot.hidden = false;
    }

    function setupActiveNav() {
        const links = navRoot ? Array.from(navRoot.querySelectorAll('.fl-room-nav__link')) : [];
        if (!links.length) return;

        const sections = config.rooms
            .map((room) => document.getElementById(room.id))
            .filter(Boolean);

        const setActive = (id) => {
            links.forEach((link) => {
                link.classList.toggle('is-active', link.dataset.roomTarget === id);
            });
        };

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(
                (entries) => {
                    const visible = entries
                        .filter((e) => e.isIntersecting)
                        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                    if (visible[0]) setActive(visible[0].target.id);
                },
                {
                    rootMargin: '-20% 0px -55% 0px',
                    threshold: [0.1, 0.25, 0.5]
                }
            );
            sections.forEach((section) => observer.observe(section));
        }

        if (config.rooms[0]) setActive(config.rooms[0].id);
    }

    /* ─── Collapsible rooms ─── */

    function setupCollapse(sectionEl, toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const collapsed = sectionEl.classList.toggle('is-collapsed');
            toggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        });
    }

    /* ─── Lightbox ─── */

    let lightboxEl = null;
    let lightboxImg = null;
    let lightboxCaption = null;
    let allImages = [];

    function ensureLightbox() {
        lightboxEl = document.createElement('div');
        lightboxEl.className = 'fl-lightbox';
        lightboxEl.setAttribute('role', 'dialog');
        lightboxEl.setAttribute('aria-modal', 'true');
        lightboxEl.setAttribute('aria-label', 'Image preview');
        lightboxEl.hidden = true;

        lightboxEl.innerHTML =
            '<button type="button" class="fl-lightbox__close" aria-label="Close">&times;</button>' +
            '<figure class="fl-lightbox__figure">' +
            '<img class="fl-lightbox__img" alt="">' +
            '<figcaption class="fl-lightbox__caption"></figcaption>' +
            '</figure>';

        document.body.appendChild(lightboxEl);
        lightboxImg = lightboxEl.querySelector('.fl-lightbox__img');
        lightboxCaption = lightboxEl.querySelector('.fl-lightbox__caption');

        lightboxEl.querySelector('.fl-lightbox__close').addEventListener('click', closeLightbox);
        lightboxEl.addEventListener('click', (e) => {
            if (e.target === lightboxEl) closeLightbox();
        });
    }

    function openLightbox(index) {
        const item = allImages[index];
        if (!item || !lightboxEl) return;

        lightboxImg.src = item.src;
        lightboxImg.alt = item.alt || item.caption || '';
        lightboxCaption.textContent = item.caption || '';
        lightboxCaption.hidden = !item.caption;

        lightboxEl.hidden = false;
        // Force reflow so the opacity transition runs from closed → open
        void lightboxEl.offsetWidth;
        lightboxEl.classList.add('is-open');
        document.body.classList.add('fl-lightbox-open');
    }

    function closeLightbox() {
        if (!lightboxEl) return;
        lightboxEl.classList.remove('is-open');
        document.body.classList.remove('fl-lightbox-open');
        window.setTimeout(() => {
            if (!lightboxEl.classList.contains('is-open')) {
                lightboxEl.hidden = true;
                lightboxImg.removeAttribute('src');
            }
        }, 250);
    }

    function setupLightboxClicks() {
        roomsRoot.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-lightbox-index]');
            if (!btn) return;
            const index = Number(btn.dataset.lightboxIndex);
            if (!Number.isNaN(index)) openLightbox(index);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightboxEl && lightboxEl.classList.contains('is-open')) {
                closeLightbox();
            }
        });
    }

    /* ─── Build page ─── */

    async function build() {
        allImages = [];
        buildStickyNav(config.rooms);
        roomsRoot.innerHTML = '';

        let indexOffset = 0;

        for (const room of config.rooms) {
            const section = document.createElement('section');
            section.className = 'fl-room';
            section.id = room.id;

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'fl-room__toggle';
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-controls', room.id + '-body');

            const title = document.createElement('h2');
            title.className = 'fl-room__title';
            title.textContent = room.title;

            const chevron = document.createElement('span');
            chevron.className = 'fl-room__chevron';
            chevron.setAttribute('aria-hidden', 'true');
            chevron.textContent = '▾';

            toggle.appendChild(title);
            toggle.appendChild(chevron);
            section.appendChild(toggle);

            const images = Array.isArray(room.images) ? room.images : [];

            const body = document.createElement('div');
            body.className = 'fl-room__body';
            body.id = room.id + '-body';

            const grid = document.createElement('div');
            grid.className = 'fl-masonry masonry-layout';
            body.appendChild(grid);
            section.appendChild(body);

            roomsRoot.appendChild(section);
            setupCollapse(section, toggle);

            allImages.push(...images);
            await renderMasonry(grid, images, indexOffset);
            indexOffset += images.length;
        }

        ensureLightbox();
        setupLightboxClicks();
        setupActiveNav();

        window.addEventListener('resize', () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => {
                rerenderAllMasonry();
            }, 180);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();
