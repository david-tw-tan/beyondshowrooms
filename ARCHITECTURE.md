# Beyond Showrooms — Architecture Notes

Frontend-only MVP. This doc focuses on the **showrooms viz tool** (`showrooms/index.html`, `showrooms/waterfall.js`, `showrooms/waterfall.css`, `showrooms/furniture_database.json`, `showrooms/img_db_final/`). Thumbnails use relative `img_db_final/` paths (`THUMBNAIL_BASE_URL` in `waterfall.js`). Bookmarks in `localStorage`.

## Site map

| Public URL | File | Purpose | Key assets |
|------------|------|---------|------------|
| `/` | `index.html` | Founder homepage (default) | `founder_showroom.css`, `founder_showroom.js`, `founder_image_captions.js`, `images/` |
| `/future_hp/` | `future_hp/index.html` | Archived marketing landing page (for later dual-homepage) | `landing_page.css`, `landing_page.js`, `landing_copy_designer.js`, …, `images_lp/` |
| `/showrooms/` | `showrooms/index.html` | Room styling / collection browse tool | `showrooms/waterfall.css`, `showrooms/waterfall.js`, `showrooms/furniture_database.json`, `showrooms/img_db_final/`, room-picker JPGs in `showrooms/` |

Deploy founder homepage assets at repo root (`index.html`, `founder_*`, `images/`). Deploy `future_hp/` and `showrooms/` as self-contained folders. Episode bridge pages (`ep1/`, `ep2/`, `ep3/`) link to `/`.

---

## Browse surfaces — what appears

- **Tiles:** `anchor_item === "yes"` only, and only **hero** images (`*_A.jpg` via `isHeroImage()`). In practice: all staged **`collection`** heroes plus manually tagged **anchor** `loose_item` heroes (accessory loose shots stay `anchor_item: ""` and are excluded).
- **`collection_item` rows never appear** in default browse (exception: **keyword search** shows all matching rows, including `collection_item` and variant photos).
- **SET badge:** Shown on `collection` heroes only when that `collection_id` has at least one `collection_item` in the DB (`collectionIdsWithItems`).

### Layout by surface

| Surface | Layout | Notes |
|---------|--------|--------|
| **Collections tab** | Editorial CSS grid — 1 col (&lt;768px), 2 col desktop | `createCollectionBrowseCard`, 4:3 cover, title below image; `#collectionGroupSticky` fixed bar updates section + card index on scroll, e.g. `Featured collections (2 / 12)` (`updateCollectionGroupStickyLabel`) |
| **Accessories tab** | Flex-column masonry | 2 / 2 / 3 / 4 columns by viewport |
| **Keyword search** | Flex-column masonry | Same column breakpoints as accessories |
| **Bookmarks** | Flex-column masonry | 2 / 3 columns |

Masonry uses `mountMasonryColumns` / `distributeMasonryCards` (not CSS `column-count`). Column entrance uses shuffled stagger delays (`GALLERY_COLUMN_STAGGER_MS`).

---

## Feed weighting & ordering

All mix ratios target the **share of visible tiles**, not the raw pool size (`mixWeighted()`).

### Collection vs loose

| Constant | Default | Used in |
|----------|---------|---------|
| `DESIGN_COLL_RATIO` | 0.70 | Keyword-search masonry browse |

`mixWeighted()` picks how many collection vs loose heroes to show, then **interleaves** loose items evenly between collection tiles so loose doesn’t cluster at the end.

### Design a Room (main path)

- Home → pick room → gallery (all styles on by default).
- **Collections tab:** grouped browse (`renderDesignCollectionsBrowse`) — Featured (brand-tagged) then More; editorial grid (1 col mobile, 2 col desktop) with titled cards (`createCollectionBrowseCard`). Images use 4:3 cover crop (no extreme-landscape thumb logic).
- Filtered by selected room, styles, price, optional product search.
- Keyword-search results use single-pass masonry via `buildBrowseFeed()` (70/30 collection vs anchor loose).

Home also offers **Style guide** modal (placeholder tutorial) — not a gallery browse path.

### Accessories tab (design room only)

- **Tab** next to Collections: e.g. “Living room accessories” (`#designBrowseTabs`).
- **`loose_item`** hero `_A` shots for the current `room_type`. Style and price filters apply (`buildAccessoriesBrowseList`).
- Masonry layout (Pinterest-style density). Same star bookmarks as collections; starring happens in lightbox.
- Tap thumbnail → lightbox **overview** of all variants (`A`/`B`/`C`…) when multiple photos exist, else detail.

---

## Scroll to top (gallery waterfalls)

Fixed **↑** control appears after ~520px scroll on **Design** gallery and **Accessories** (not bookmark manager, lightbox, or search modal). Scrolls the active surface (`window` or `#accessoriesView`) smoothly to top.

---

## Thumbnail aspect — landscape crop (masonry + bookmarks)

**Scope:** Accessories tab, keyword-search masonry, and bookmark waterfall thumbs only. **Collections tab** uses fixed 4:3 cover on `.collection-card__media` (no `createThumbMedia`). **Lightbox:** full natural aspect (`object-fit: contain`).

**No crop** unless natural `width ÷ height ≥ EXTREME_LANDSCAPE_THRESHOLD` (currently **1.55** — moderate landscape included).

When cropped (`createThumbMedia` → `pickExtremeLandscapeDisplayRatio`):

| Case | Display frame (center crop, `object-fit: cover`) |
|------|--------------------------------------------------|
| **~45%** of cropped wides (hash per `thumbnail_url`) | **Texture zoom:** `1`, `5/6`, or `4/5` |
| **~55%** (remainder) | Interpolate **1.38 → 1.68** as source gets wider; cap at **1.68** when ratio ≥ `EXTREME_LANDSCAPE_FULL` (**2.15**) |

**Tunables** (top of `waterfall.js`): `EXTREME_LANDSCAPE_THRESHOLD`, `EXTREME_LANDSCAPE_FULL`, `THUMB_FRAME_5_4`, `THUMB_FRAME_3_2`, `EXTREME_LANDSCAPE_TEXTURE_RATE`, `EXTREME_LANDSCAPE_TEXTURE_ASPECTS`.

---

## Lightbox navigation (gallery path)

```
Layer 1 — Browse grid (collections card or masonry tile)
    click tile
Overview (middle layer) — only if multiple variants and/or collection items
    Single scrollable page; 1-column mobile, 2-column ≥640px
    Section labels: per-piece names, "Photos", or collection hero title (see branded titles below)
    All collection_item heroes + all A/B/C variants (no 16-item cap)
    tap any image
Detail (end layer) — single enlarged image + star (no variant carousel; pick photo in overview)
    Optional title above image for branded collection heroes (see below)
    Back / Escape / backdrop (from detail) → overview when applicable
    Otherwise close to waterfall
```

**Skip overview:** Single image only (`needsLightboxOverview()` false) → open detail directly.

- **Variants:** `getItemImageGroup()` — all rows sharing the same base filename (`*_A`, `*_B`, `*_C`…).
- **Overview anchor** stored in `lightboxOverviewAnchor` for back navigation from detail.
- **Overview cells** use `object-fit: contain` (full image, not gallery thumb crop).

### Branded collection titles (overview + detail)

For **`img_category === 'collection'`** heroes only (not `collection_item` or `loose_item`), when **`orig_brand_tag`** is non-empty:

- **Browse cards (collections tab):** `getCollectionBrowseTitle()` — branded title, else `[Style] Collection`, else “Curated Collection”.
- **Overview (layer 2):** the collection hero section heading shows **`[Brand] Inspired Collection`** (from `orig_brand_tag`) instead of the generic **"Collection"**.
- **Detail (layer 3):** the same title appears above the enlarged image when the opened row is a **collection** hero variant (`_A` / `_B` / `_C`…).

If `orig_brand_tag` is empty, the overview hero section stays **"Collection"** and detail shows **no** collection title. Nested `collection_item` sections keep their product-type labels (e.g. sidetable, sofa); detail for those items has no branded collection title.

---

## Bookmarks — how it differs

**Storage:** `localStorage` key `furniture_bookmarks_v1`; Map keyed by hero `thumbnail_url`. Always bookmark **hero** (`toHeroItem()`).

**Board UI (`renderBookmarkView`):**

- Grouped by **room**, in order: **multi-piece collections** (per `COLLECTION:` header, SET anchor + nested `collection_item` cards) → **single-piece collection sets** (one shared “Collection sets” masonry; anchor card captions show `collection_id`) → **Standalone Pieces** (loose heroes).
- Nested pieces from a starred SET appear under the collection even if not individually starred (`linked: true`). Individually starred nested pieces also exist in data but are **deduped** from the loose list when the parent collection is starred.
- Same masonry column layout; same extreme-landscape thumb rules as gallery.

**Bookmark lightbox (`openLightbox(..., { fromBookmark: true })`):**

- **Skips overview** — card click opens **detail** only (hero enlarged + star).
- Board thumbnails always use **`toHeroItem()`** (`*_A.jpg`); starring a variant in the gallery still stores the hero key (no duplicate rows for B/C).
- Renders **on top of** bookmark view (`lightbox-over-bookmarks`, higher z-index) — bookmark page stays visible underneath.
- **Close (✕)** always available; **Back** appears on detail when opened from overview.
- **Unstar on close:** If user opened a starred item and unstarred inside lightbox, confirm before removing from board on close.
- **Cannot unstar a SET** while any nested `collection_item` from that set is still starred (`canUnstarBookmarkItem()`).

**Gallery lightbox** uses backdrop/escape: overview → close; detail with overview anchor → back to overview; otherwise close. **Bookmark** uses `closeLightbox()` when dismissing from overview or detail without an overview parent.

---

## Data model reminders

| `img_category` | Role |
|----------------|------|
| `collection` | Room/set hero (`_A` in waterfall) |
| `loose_item` | Standalone hero |
| `collection_item` | Piece inside a set; Layer 3 grid + 3b lightbox only |

Images: `filename_raw` → `img_db_final/{file}` (see `THUMBNAIL_BASE_URL`). Deploy `showrooms/img_db_final/` alongside `showrooms/index.html`, `showrooms/waterfall.js`, and `showrooms/waterfall.css`.

---

## Modes

| Mode | Entry | Filters |
|------|-------|---------|
| **Design a Room** | Start → room → collections gallery | Room, multi-style, premium/luxury, optional keyword search (see below). |
| **Style guide** | Start → “Take the style guide” → modal | Read-only; no gallery filters |

### Keyword search (Design mode only)

**Where:** Design gallery only (🔍 icon).

**Match rules** (both must pass style + price filters first):

| Field | Rule | Example |
|-------|------|---------|
| `img_product_type` | Case-insensitive **substring** | `dining` → `diningtable`, `diningchair` |
| `img_category` | **Exact** match on full value | `loose_item` only if user types that whole string |

**What usually appears in results**

- **`loose_item`** rows with a populated `img_product_type`.
- **`collection_item`** rows (individual pieces inside a set) with a populated `img_product_type`.
- All photo variants for a match (`_A`, `_B`, `_C`…), not just hero `_A`.

**What does *not* appear (main gap users notice)**

- **`collection` set heroes** — room/set overview images tagged `img_category: collection` with **empty or blank `img_product_type`**. These are what carry the SET badge in the browse waterfall but they do not match typical keywords (`bed`, `dining`, `sofa`, etc.). Search is oriented toward **piece-level** types, not whole-set hero shots.
- Exception: typing the literal category name `collection` would match `img_category === 'collection'` (unusual).

**Filters while search is active**

| Filter | Behavior |
|--------|----------|
| Selected **room** | **Ignored** — search runs across all rooms. Mode line shows `All rooms`. |
| **Style** pills | Still applied |
| **Premium / Luxury** | Still applied |

**UI copy:** Caption under the active search tag (and note in the search modal) states that room filter is ignored, style/price still apply, and **collection sets are not included** in search results.

**After clear search:** Room filter returns; **Collections tab** editorial grid resumes (or accessories masonry if on that tab). Search masonry uses single-pass `buildBrowseFeed()` (70/30 collection vs anchor loose); no `collection_item` in that feed.

**Implementation:** `render()` in `waterfall.js` — search block inside `currentMode === 'design'`; `productSearch` variable; `updateActiveSearchTag()` for caption.

---

## Files to edit for common tasks

| Task | Where |
|------|--------|
| Feed mix | `waterfall.js` CONFIG + `buildBrowseFeed`, `buildDesignBrowseFeed`, `mixWeighted` |
| Thumb crop / texture rate | `waterfall.js` CONFIG + `pickExtremeLandscapeDisplayRatio` |
| Lightbox | `openLightbox`, `openLightboxOverview`, `openLightboxDetail`, `closeLightbox`, `handleEscape` |
| Bookmarks | `buildBookmarkGroups`, `toggleBookmark`, `renderBookmarkView` |
| Collections grid / cards | `createCollectionBrowseCard`, `createGalleryCollectionGroup`, `getCollectionsGridColumnCount`, `waterfall.css` |
| Masonry / accessory cards | `mountMasonryColumns`, `createGalleryCard`, `waterfall.css` |
