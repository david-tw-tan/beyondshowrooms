const catalog = window.CATALOG || {};

const state = {
  factoryName: catalog.factoryName || "Factory Catalog",
  sortMode: catalog.sortMode || "price",
  displayCurrency: catalog.displayCurrency || "CNY",
  cardZoom: catalog.cardZoom ?? 0,
  sectionOrder: catalog.sectionOrder || [],
  sectionLabels: catalog.sectionLabels || {},
  videoLabels: catalog.videoLabels || {},
  fx: catalog.fx || { usdRmb: 6.7, third: { code: "", rmbPerUnit: null } },
  items: catalog.items || [],
};

const els = {
  factoryName: document.getElementById("factoryName"),
  currencyPills: document.getElementById("currencyPills"),
  roomNav: document.getElementById("roomNav"),
  main: document.getElementById("main"),
  totals: document.getElementById("totals"),
  empty: document.getElementById("empty"),
  usdRate: document.getElementById("usdRate"),
  thirdCode: document.getElementById("thirdCode"),
  thirdRate: document.getElementById("thirdRate"),
  lightbox: document.getElementById("lightbox"),
  lightboxImage: document.getElementById("lightboxImage"),
  lightboxLabel: document.getElementById("lightboxLabel"),
  lightboxPrice: document.getElementById("lightboxPrice"),
  lightboxComment: document.getElementById("lightboxComment"),
  lightboxClose: document.getElementById("lightboxClose"),
  zoomOut: document.getElementById("zoomOut"),
  zoomIn: document.getElementById("zoomIn"),
};

const ZOOM_COLS = [4, 5, 6, 7, 8];
const MOBILE_MAX_COLS = 2;
const mobileGridQuery = window.matchMedia("(max-width: 720px)");

function mediaSrc(file) {
  return `images/${encodeURIComponent(file || "")}`;
}

function columnCountForViewport(zoomIndex) {
  let cols = ZOOM_COLS[zoomIndex];
  if (mobileGridQuery.matches) {
    cols = Math.min(cols, MOBILE_MAX_COLS);
  }
  return cols;
}

function applyCardZoom() {
  const zoom = Math.max(0, Math.min(ZOOM_COLS.length - 1, Number(state.cardZoom) || 0));
  state.cardZoom = zoom;
  const cols = columnCountForViewport(zoom);
  document.querySelectorAll(".grid").forEach((grid) => {
    grid.style.width = "100%";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  });
  if (els.zoomIn) els.zoomIn.disabled = zoom === 0;
  if (els.zoomOut) els.zoomOut.disabled = zoom === ZOOM_COLS.length - 1;
}

if (typeof mobileGridQuery.addEventListener === "function") {
  mobileGridQuery.addEventListener("change", () => applyCardZoom());
} else if (typeof mobileGridQuery.addListener === "function") {
  mobileGridQuery.addListener(() => applyCardZoom());
}

function thirdReady() {
  return Boolean(state.fx?.third?.code && state.fx.third.rmbPerUnit > 0);
}

function fromRmb(rmb) {
  if (rmb == null || Number.isNaN(Number(rmb))) return null;
  if (state.displayCurrency === "USD") return Math.round(rmb / state.fx.usdRmb);
  if (state.displayCurrency === "THIRD" && thirdReady()) {
    return Math.round(rmb / state.fx.third.rmbPerUnit);
  }
  return Math.round(rmb);
}

function itemComment(item) {
  return String(item?.comment || "").trim();
}

function itemVideoLabel(item) {
  return String(state.videoLabels[item?.file] || item?.label || "").trim();
}

function formatMoney(rmb) {
  const n = fromRmb(rmb);
  if (n == null) return "—";
  const formatted = n.toLocaleString("en-US");
  if (state.displayCurrency === "USD") return `$${formatted}`;
  if (state.displayCurrency === "THIRD" && thirdReady()) {
    return `${state.fx.third.code} ${formatted}`;
  }
  return `¥${formatted}`;
}

function itemsInSection(key) {
  const items = state.items.filter((item) => item.section === key);
  if (state.sortMode === "manual") {
    return items.sort((a, b) => a.manualIndex - b.manualIndex);
  }
  return items.sort((a, b) => {
    if (a.price == null && b.price == null) return a.manualIndex - b.manualIndex;
    if (a.price == null) return 1;
    if (b.price == null) return -1;
    return b.price - a.price;
  });
}

function sectionTotal(key) {
  return itemsInSection(key).reduce((sum, item) => sum + (item.price || 0), 0);
}

function labelFor(key) {
  return state.sectionLabels[key] || titleCase(key);
}

function titleCase(key) {
  if (!key || key === "uncategorized") return "Uncategorized";
  return key.split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function cssId(key) {
  return key.replace(/\s+/g, "-");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function render() {
  applyCardZoom();
  const empty = state.items.length === 0;
  document.body.classList.toggle("empty-mode", empty);
  els.empty.hidden = !empty;
  els.factoryName.textContent = state.factoryName;
  document.title = state.factoryName || "Factory Catalog";
  els.usdRate.value = String(state.fx.usdRmb ?? 6.7);
  els.thirdCode.value = state.fx.third?.code || "";
  els.thirdRate.value = state.fx.third?.rmbPerUnit ? String(state.fx.third.rmbPerUnit) : "";

  document.querySelectorAll("[data-sort]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.sort === state.sortMode);
  });

  els.currencyPills.innerHTML = "";
  const currencies = [
    { id: "CNY", label: "RMB" },
    { id: "USD", label: "USD" },
  ];
  if (thirdReady()) {
    currencies.push({ id: "THIRD", label: state.fx.third.code });
  }
  for (const currency of currencies) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = currency.label;
    btn.classList.toggle("active", state.displayCurrency === currency.id);
    btn.addEventListener("click", () => {
      state.displayCurrency = currency.id;
      render();
    });
    els.currencyPills.appendChild(btn);
  }

  els.roomNav.innerHTML = "";
  for (const key of state.sectionOrder) {
    const a = document.createElement("a");
    a.href = `#room-${cssId(key)}`;
    a.innerHTML = escapeHtml(labelFor(key));
    els.roomNav.appendChild(a);
  }

  els.main.innerHTML = "";
  for (const key of state.sectionOrder) {
    const items = itemsInSection(key);
    if (!items.length) continue;
    const section = document.createElement("section");
    section.className = "section";
    section.id = `room-${cssId(key)}`;
    const total = sectionTotal(key);
    section.innerHTML = `
      <div class="section-head">
        <div class="section-title">${escapeHtml(labelFor(key))}</div>
        <div class="section-sum">Subtotal: ${escapeHtml(formatMoney(total))}</div>
      </div>
      <div class="grid" data-section="${escapeAttr(key)}"></div>
    `;
    const grid = section.querySelector(".grid");
    for (const item of items) {
      grid.appendChild(renderCard(item));
    }
    els.main.appendChild(section);
  }
  applyCardZoom();

  const house = state.items.reduce((sum, item) => sum + (item.price || 0), 0);
  const rows = state.sectionOrder
    .map((key) => {
      if (!itemsInSection(key).length) return "";
      return `<div class="row"><span class="label">${escapeHtml(labelFor(key))}</span><span class="amt">${escapeHtml(formatMoney(sectionTotal(key)))}</span></div>`;
    })
    .join("");
  els.totals.innerHTML = `
    ${rows}
    <div class="row grand"><span class="label">Entire House</span><span class="amt">${escapeHtml(formatMoney(house))}</span></div>
  `;
}

function renderCard(item) {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <div class="photo"><img src="${mediaSrc(item.file)}" alt="" draggable="false" /></div>
    <div class="price-row">
      ${itemComment(item) ? `<button type="button" class="comment-mark" aria-label="Show notes">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 6h14M5 12h14M5 18h9" />
        </svg>
      </button>` : `<span class="comment-spacer"></span>`}
      <div class="price">${escapeHtml(formatMoney(item.price))}</div>
      <span class="comment-spacer"></span>
    </div>
  `;
  card.querySelector(".photo").addEventListener("click", () => openLightbox(item));
  const noteBtn = card.querySelector(".comment-mark");
  if (noteBtn) {
    noteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openLightbox(item);
    });
  }
  return card;
}

function openLightbox(item) {
  els.lightboxImage.src = mediaSrc(item.file);
  els.lightboxImage.alt = itemVideoLabel(item) || "Furniture piece";
  const label = itemVideoLabel(item);
  if (label) {
    els.lightboxLabel.hidden = false;
    els.lightboxLabel.textContent = label;
  } else {
    els.lightboxLabel.hidden = true;
    els.lightboxLabel.textContent = "";
  }
  els.lightboxPrice.textContent = formatMoney(item.price);
  const note = itemComment(item);
  if (note) {
    els.lightboxComment.hidden = false;
    els.lightboxComment.textContent = note;
  } else {
    els.lightboxComment.hidden = true;
    els.lightboxComment.textContent = "";
  }
  els.lightbox.hidden = false;
}

function closeLightbox() {
  els.lightbox.hidden = true;
  els.lightboxImage.src = "";
  els.lightboxImage.alt = "";
  els.lightboxLabel.hidden = true;
  els.lightboxLabel.textContent = "";
  els.lightboxPrice.textContent = "";
  els.lightboxComment.hidden = true;
  els.lightboxComment.textContent = "";
}

document.querySelectorAll("[data-sort]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.sortMode = btn.dataset.sort;
    render();
  });
});

els.zoomOut.addEventListener("click", () => {
  state.cardZoom = Math.min(ZOOM_COLS.length - 1, state.cardZoom + 1);
  applyCardZoom();
});
els.zoomIn.addEventListener("click", () => {
  state.cardZoom = Math.max(0, state.cardZoom - 1);
  applyCardZoom();
});

els.usdRate.addEventListener("change", () => {
  const value = Number(String(els.usdRate.value).replace(/,/g, ""));
  if (!value || value <= 0) {
    render();
    return;
  }
  state.fx.usdRmb = value;
  render();
});

function saveThird() {
  const code = els.thirdCode.value.trim();
  const rateRaw = els.thirdRate.value.trim();
  const rmbPerUnit = rateRaw === "" ? null : Number(rateRaw.replace(/,/g, ""));
  if (rateRaw && (!rmbPerUnit || rmbPerUnit <= 0)) {
    render();
    return;
  }
  state.fx.third = { code, rmbPerUnit };
  if (state.displayCurrency === "THIRD" && !thirdReady()) {
    state.displayCurrency = "CNY";
  }
  render();
}
els.thirdCode.addEventListener("change", saveThird);
els.thirdRate.addEventListener("change", saveThird);

els.lightbox.addEventListener("click", (event) => {
  if (event.target === els.lightbox || event.target === els.lightboxClose) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLightbox();
});

if (state.displayCurrency === "THIRD" && !thirdReady()) {
  state.displayCurrency = "CNY";
}

render();
