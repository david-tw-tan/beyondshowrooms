let MASTER = [];
let ACTIVE = new Set();
let BOOKMARKS = new Map();

/* ---------------------------
   BOOT LOGS
----------------------------*/
console.log("[BOOT] waterfall.js loaded");
console.log("[BOOT] JS START");

/* ---------------------------
   DOM ELEMENTS
----------------------------*/
const gallery = document.getElementById("gallery");
const emptyState = document.getElementById("emptyState");
const bookmarkBtn = document.getElementById("bookmarkBtn");
const bookmarkView = document.getElementById("bookmarkView");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const starBtn = document.getElementById("starBtn");

/* ---------------------------
   LOAD JSON DATA
----------------------------*/
async function loadData() {
    console.log("[DATA] Loading JSON...");

    const res = await fetch("furniture_database.json");
    console.log("[DATA] Response status:", res.status);

    const data = await res.json();

    MASTER = data;

    console.log("[DATA] JSON loaded");
    console.log("[DATA] rows:", MASTER.length);
    console.log("[DATA] MASTER assigned");

    render();
}

/* ---------------------------
   RENDER GRID (FIXED)
----------------------------*/
function render() {
    console.log("[RENDER] called");
    console.log("[RENDER] ACTIVE size:", ACTIVE.size);

    gallery.innerHTML = "";

    let list = MASTER;

    // only filter IF active filters exist
    if (ACTIVE.size > 0) {
        list = MASTER.filter(x => ACTIVE.has(x.style_cat));
    }

    console.log("[RENDER] results:", list.length);

    emptyState.style.display = list.length === 0 ? "flex" : "none";
    gallery.style.display = "block";

    const shuffled = shuffle(list);

    shuffled.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";

        card.dataset.src = item.thumbnail_url;

        const img = document.createElement("img");
        img.src = item.thumbnail_url;
        img.loading = "lazy";

        const star = document.createElement("div");
        star.className = "star-thumb";
        star.textContent = "★";

        if (BOOKMARKS.has(item.thumbnail_url)) {
            star.style.display = "block";
        }

        card.onclick = () => openLightbox(item);

        // IMPORTANT: ensure visible (no animation dependency bugs)
        card.style.opacity = "1";
        card.style.transform = "none";

        card.appendChild(img);
        card.appendChild(star);

        gallery.appendChild(card);
    });
}

/* ---------------------------
   SHUFFLE
----------------------------*/
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/* ---------------------------
   FILTERS
----------------------------*/
document.querySelectorAll(".filter-btn").forEach(btn => {
    console.log("[INIT] binding filter:", btn.dataset.cat);

    btn.onclick = () => {
        const cat = btn.dataset.cat;

        console.log("[FILTER] clicked:", cat);

        btn.classList.toggle("active");

        if (ACTIVE.has(cat)) ACTIVE.delete(cat);
        else ACTIVE.add(cat);

        console.log("[FILTER] ACTIVE set:", [...ACTIVE]);

        render();
    };
});

/* ---------------------------
   LIGHTBOX
----------------------------*/
let current = null;

function openLightbox(item) {
    current = item;

    lightboxImg.src = item.thumbnail_url;

    updateStar();
    lightbox.style.display = "flex";
}

function updateStar() {
    if (!current) return;

    if (BOOKMARKS.has(current.thumbnail_url)) {
        starBtn.textContent = "★";
        starBtn.style.color = "gold";
    } else {
        starBtn.textContent = "☆";
        starBtn.style.color = "white";
    }
}

starBtn.onclick = () => {
    if (!current) return;

    if (BOOKMARKS.has(current.thumbnail_url)) {
        BOOKMARKS.delete(current.thumbnail_url);
    } else {
        BOOKMARKS.set(current.thumbnail_url, current);
    }

    updateStar();
    updateBookmarkUI();
};

/* ---------------------------
   BOOKMARKS
----------------------------*/
function updateBookmarkUI() {
    document.getElementById("bookmarkCount").textContent = BOOKMARKS.size;
}

bookmarkBtn.onclick = () => {
    bookmarkView.innerHTML = "";

    const header = document.createElement("div");
    header.className = "bookmark-header";
    header.innerHTML = `
        <h2>Bookmarked Items</h2>
        <p>${BOOKMARKS.size} saved items</p>
    `;

    const grid = document.createElement("div");
    grid.className = "bookmark-grid";

    BOOKMARKS.forEach(item => {
        const el = document.createElement("div");
        el.className = "bookmark-item";

        el.innerHTML = `
            <img src="${item.thumbnail_url}" />
            <div class="caption">
                ${item.style_cat}<br/>
                ${item.filename_raw}
            </div>
        `;

        el.onclick = () => openLightbox(item);

        grid.appendChild(el);
    });

    bookmarkView.appendChild(header);
    bookmarkView.appendChild(grid);
    bookmarkView.style.display = "block";
};

bookmarkView.onclick = (e) => {
    if (e.target.id === "bookmarkView") {
        bookmarkView.style.display = "none";
    }
};

/* ---------------------------
   INIT
----------------------------*/
updateBookmarkUI();
loadData();
