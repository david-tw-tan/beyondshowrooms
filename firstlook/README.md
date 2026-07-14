# First Look — Client Proposal Template

Private, unlisted “light proposals” for Beyond Showrooms clients. Each page introduces starting furniture directions before a first call.

**Public URL pattern:** `https://www.beyondshowrooms.com/firstlook/{clientId}/`  
Example: `https://www.beyondshowrooms.com/firstlook/matt_12sQ/`

---

## Folder structure

```
firstlook/
├── README.md          ← this file
├── style.css          ← shared styles (all clients)
├── lightbox.js        ← shared masonry, lightbox, sticky nav, collapse
└── matt_12sQ/         ← one folder per client
    ├── index.html     ← client-specific content only
    └── *.jpg          ← all images for that client (keep in this folder)
```

`style.css` and `lightbox.js` are shared. Never copy CSS/JS into a client folder.

---

## Create a new client First Look

1. Duplicate `matt_12sQ/` and rename to `{firstname}_{4charSuffix}`  
   Example: `sarah_7xKp` (random suffix keeps the URL non-guessable).
2. Open the new `index.html` and edit only:
   - Greeting name in the intro paragraph (e.g. `Hi Sarah —`)
   - `<title>` / meta description
   - **`FIRST_LOOK_CONFIG`** — rooms, image paths, captions
     (piece-count subheaders are auto-generated from each room’s image list)
3. Replace image files in the folder (see naming below).
4. Deploy. Send the client: `www.beyondshowrooms.com/firstlook/{folder}/`

Do **not** change `style.css` or `lightbox.js` for a single client.

---

## Image naming

```
{roomtype}{roomnumber}_{piecenumber}.jpg
```

| Piece | Example |
|-------|---------|
| Living room 1, piece 1 | `livingroom1_01.jpg` |
| Living room 1, piece 2 | `livingroom1_02.jpg` |
| Dining room 1, piece 1 | `diningroom1_01.jpg` |
| Bedroom 2, piece 1 | `bedroom2_01.jpg` |

Rules:

- Lowercase only  
- Zero-pad piece numbers (`01`, `02`…) so files sort cleanly  
- Room number = physical room (second bedroom → `bedroom2_…`)  
- Captions live in the config, not in filenames  
- All image files sit in the **client folder** next to `index.html`

---

## Config block (`// SWAP IMAGES HERE`)

In each client `index.html`:

```js
window.FIRST_LOOK_CONFIG = {
  rooms: [
    {
      id: 'living-room',       // anchor + sticky nav
      title: 'Living Room',
      images: [
        {
          src: 'livingroom1_01.jpg',
          caption: 'Material — one distinguishing detail.',
          alt: 'Short accessible description'
        }
      ]
    }
  ]
};
```

Room subheaders show **`N preview pieces.`** automatically from `images.length` — no `note` field needed.

Caption format: **`[Material] — [one distinguishing detail]`**  
Factual and restrained. No “stunning”, “luxurious”, etc.  
**Never use the word “replica”.** Say “designer-inspired” if needed.

Any number of images per room is fine — masonry handles volume.

---

## Page behavior (shared)

| Feature | Behavior |
|---------|----------|
| Sticky nav | Room jump links; horizontal swipe/scroll when rooms overflow the viewport; tracks active section on scroll |
| Collapsible rooms | Title toggles section; **open by default** |
| Masonry | 1 col &lt;768px · 2 cols 768–1279 · 3 cols ≥1280 (homepage collections pattern) |
| Lightbox | Click image → full-screen; Esc / × / backdrop to close |
| Privacy | `noindex, nofollow` in `<head>` |

---

## Locked copy & content decisions

Keep these unless intentionally revising the template for all clients:

- Page title: **First Look**  
- Subtitle: **A Starting Point for Your Foshan Journey** (brass accent)  
- No client name in the hero — personalization lives in the intro greeting only  
- Intro, What Happens Next steps, sourcing note, About, footer — as in the Matt template  
- Furniture only (no floor plan on the page)  
- No site nav, cookies, pop-ups, or social share buttons  
- Sticky room jump bar with a small menu icon + full-width warm gradient wash  
- Contact block offers WhatsApp + Email (same details as the homepage contact modal)  
- Style brief for the factory (e.g. “Hermès-like”) stays **off-page**

---

## Placeholder images (Matt v1)

`matt_12sQ/` currently uses copies of the homepage whole-room collection photos as stand-ins. Replace with factory shortlist photos before sending to the client; update captions in `FIRST_LOOK_CONFIG` at the same time.

---

## Checklist before sending to a client

- [ ] Client name in intro greeting (+ title / meta)  
- [ ] Real photos in the client folder (naming convention above)  
- [ ] Captions updated in `FIRST_LOOK_CONFIG`  
- [ ] Room titles match the project  
- [ ] Spot-check WhatsApp + Email contact links  
- [ ] Spot-check mobile + desktop masonry + lightbox  
- [ ] Confirm `noindex, nofollow` still present  
