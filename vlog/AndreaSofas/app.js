const catalog = window.CATALOG || {};

const state = {
  factoryName: catalog.factoryName || "Factory Catalog",
  displayCurrency: catalog.displayCurrency || "USD",
  cardZoom: catalog.cardZoom ?? 0,
  sectionOrder: catalog.sectionOrder || [],
  sectionLabels: catalog.sectionLabels || {},
  fx: catalog.fx || { usdRmb: 6.7, third: { code: "", perUsd: null } },
  items: catalog.items || [],
};

const els = {
  factoryName: document.getElementById("factoryName"),
  currencyPills: document.getElementById("currencyPills"),
  main: document.getElementById("main"),
  empty: document.getElementById("empty"),
  currencyAddBtn: document.getElementById("currencyAddBtn"),
  currencyAddPanel: document.getElementById("currencyAddPanel"),
  thirdCode: document.getElementById("thirdCode"),
  thirdPerUsd: document.getElementById("thirdPerUsd"),
  fxApply: document.getElementById("fxApply"),
  fxRemove: document.getElementById("fxRemove"),
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

const FX_KEY = "andreasofas.currency";

function thirdReady() {
  return Boolean(state.fx?.third?.code && state.fx.third.perUsd > 0);
}

function loadSavedCurrency() {
  try {
    const saved = JSON.parse(localStorage.getItem(FX_KEY) || "null");
    if (!saved?.code || !(saved.perUsd > 0)) return;
    state.fx.third = { code: String(saved.code), perUsd: Number(saved.perUsd) };
  } catch (e) {}
}

function saveCurrency() {
  try {
    if (!thirdReady()) {
      localStorage.removeItem(FX_KEY);
      return;
    }
    localStorage.setItem(FX_KEY, JSON.stringify(state.fx.third));
  } catch (e) {}
}

function parseRate(raw) {
  let value = String(raw || "").trim().replace(/\s/g, "");
  if (!value) return null;
  if (value.includes(",") && value.includes(".")) value = value.replace(/,/g, "");
  else value = value.replace(",", ".");
  const n = Number(value);
  return n > 0 ? n : null;
}

function cleanCode(raw) {
  return String(raw || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
}

function toRmb(amount, currency) {
  const n = Number(amount);
  if (currency === "USD") return n * state.fx.usdRmb;
  return n;
}

function moneyParts(item) {
  const amount = item?.price;
  if (amount == null || Number.isNaN(Number(amount))) return null;
  const source = item.currency === "USD" ? "USD" : "CNY";
  const rmb = toRmb(amount, source);
  if (state.displayCurrency === "USD") {
    return { n: Math.round(rmb / state.fx.usdRmb), currency: "USD" };
  }
  if (state.displayCurrency === "THIRD" && thirdReady()) {
    return { n: Math.round((rmb / state.fx.usdRmb) * state.fx.third.perUsd), currency: "THIRD" };
  }
  return { n: Math.round(rmb), currency: "CNY" };
}

function formatMoney(item) {
  const parts = moneyParts(item);
  if (!parts) return "—";
  const formatted = parts.n.toLocaleString("en-US");
  if (parts.currency === "USD") return `$${formatted}`;
  if (parts.currency === "THIRD" && thirdReady()) {
    return `${state.fx.third.code} ${formatted}`;
  }
  return `¥${formatted}`;
}

function itemsInSection(key) {
  return state.items
    .filter((item) => item.section === key)
    .sort((a, b) => a.manualIndex - b.manualIndex);
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

  els.currencyPills.innerHTML = "";
  const currencies = [
    { id: "USD", label: "USD" },
    { id: "CNY", label: "RMB" },
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
      setCurrencyPanel(false);
      render();
    });
    els.currencyPills.appendChild(btn);
  }

  els.main.innerHTML = "";
  for (const key of state.sectionOrder) {
    const items = itemsInSection(key);
    if (!items.length) continue;
    const section = document.createElement("section");
    section.className = "section";
    section.id = `room-${cssId(key)}`;
    section.innerHTML = `
      <div class="section-head">
        <div class="section-title">${escapeHtml(labelFor(key))}</div>
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
}

function renderCard(item) {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <div class="photo"><img src="${mediaSrc(item.file)}" alt="${escapeAttr(item.line || "")}" draggable="false" /></div>
    <p class="card-desc">${escapeHtml(item.line || "")}</p>
    <div class="price-row">
      <span class="comment-spacer"></span>
      <div class="price">${escapeHtml(formatMoney(item))}</div>
      <span class="comment-spacer"></span>
    </div>
  `;
  card.addEventListener("click", () => openLightbox(item));
  return card;
}

function openLightbox(item) {
  els.lightboxImage.src = mediaSrc(item.file);
  els.lightboxImage.alt = item.line || "Furniture piece";
  const label = String(item.line || "").trim();
  if (label) {
    els.lightboxLabel.hidden = false;
    els.lightboxLabel.textContent = label;
  } else {
    els.lightboxLabel.hidden = true;
    els.lightboxLabel.textContent = "";
  }
  els.lightboxPrice.textContent = formatMoney(item);
  const note = String(item.detail || "").trim();
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

function setCurrencyPanel(open) {
  els.currencyAddPanel.hidden = !open;
  els.currencyAddBtn.setAttribute("aria-expanded", open ? "true" : "false");
  if (!open) return;
  els.thirdCode.value = state.fx.third?.code || "";
  els.thirdPerUsd.value = state.fx.third?.perUsd ? String(state.fx.third.perUsd) : "";
  els.fxApply.textContent = thirdReady() ? "Update" : "Add";
  els.fxRemove.hidden = !thirdReady();
  els.thirdCode.focus();
}

els.currencyAddBtn.addEventListener("click", () => {
  setCurrencyPanel(els.currencyAddPanel.hidden);
});

els.currencyAddPanel.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = cleanCode(els.thirdCode.value);
  const perUsd = parseRate(els.thirdPerUsd.value);
  if (!code || !perUsd) {
    els.currencyAddPanel.classList.add("fx-invalid");
    return;
  }
  els.currencyAddPanel.classList.remove("fx-invalid");
  state.fx.third = { code, perUsd };
  state.displayCurrency = "THIRD";
  saveCurrency();
  setCurrencyPanel(false);
  render();
});

els.fxRemove.addEventListener("click", () => {
  state.fx.third = { code: "", perUsd: null };
  if (state.displayCurrency === "THIRD") state.displayCurrency = "USD";
  saveCurrency();
  setCurrencyPanel(false);
  render();
});

document.addEventListener("click", (event) => {
  if (els.currencyAddPanel.hidden) return;
  if (event.target.closest("#currencyAdd")) return;
  setCurrencyPanel(false);
});

els.zoomOut.addEventListener("click", () => {
  state.cardZoom = Math.min(ZOOM_COLS.length - 1, state.cardZoom + 1);
  applyCardZoom();
});
els.zoomIn.addEventListener("click", () => {
  state.cardZoom = Math.max(0, state.cardZoom - 1);
  applyCardZoom();
});

els.lightbox.addEventListener("click", (event) => {
  if (event.target === els.lightbox || event.target === els.lightboxClose) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!els.currencyAddPanel.hidden) {
    setCurrencyPanel(false);
    return;
  }
  closeLightbox();
});

loadSavedCurrency();
if (state.displayCurrency === "THIRD" && !thirdReady()) {
  state.displayCurrency = "USD";
}

render();
