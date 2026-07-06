/**
 * Landing page image captions & alt text — single source of truth.
 * Key = filename under images/ (e.g. collection_living_1.jpg).
 * Update caption / alt here; showroom modal, spotlight, and future sections read from this file.
 */
const LANDING_IMAGE_CAPTIONS = {
    /* ─── Showroom modal: living room collections ─── */
    'collection_living_1.jpg': {
        caption: 'Fendi Casa–inspired living — tufted modular seating, mustard and white, architectural backdrop.',
        alt: 'Fendi Casa–inspired living room with tufted modular seating in a partner factory showroom'
    },
    'collection_living_2.jpg': {
        caption: 'Minotti-inspired living — black leather modulars, marble coffee table, monochrome palette.',
        alt: 'Minotti-inspired living room with black leather modular seating in a partner factory showroom'
    },
    'collection_living_3.jpg': {
        caption: 'Versace Home–inspired living — quilted leather seating, honeycomb texture, warm cognac tones.',
        alt: 'Versace Home–inspired living room with quilted leather seating in a partner factory showroom'
    },
    'collection_living_4.jpg': {
        caption: 'Bentley Home–inspired living — gloss-wood frames, marble cluster tables, soft neutral palette.',
        alt: 'Bentley Home–inspired living room with gloss-wood frame seating in a partner factory showroom'
    },
    'collection_living_5.jpg': {
        caption: 'Edra-inspired living — pebble modular seating, organic silhouettes, sculptural art wall.',
        alt: 'Edra-inspired living room with pebble modular seating in a partner factory showroom'
    },
    'collection_living_6.jpg': {
        caption: 'Roche Bobois–inspired living — bubble seating, rounded forms, bold cobalt blue.',
        alt: 'Roche Bobois–inspired living room with bubble seating in a partner factory showroom'
    },
    'collection_living_7.jpg': {
        caption: 'Ligne Roset–inspired living — Togo seating, graphic rug, gallery-calm layout.',
        alt: 'Ligne Roset–inspired living room with Togo seating in a partner factory showroom'
    },
    'collection_living_8.jpg': {
        caption: 'Minotti-inspired living — navy modular sofa, mustard ottoman, white marble table.',
        alt: 'Minotti-inspired living room with navy modular sofa in a partner factory showroom'
    },

    /* ─── Showroom modal: bedroom collections ─── */
    'collection_bed_1.jpg': {
        caption: 'Tailored luxury bedroom collection',
        alt: 'Tailored luxury bedroom collection in a partner factory showroom'
    },
    'collection_bed_2.jpg': {
        caption: 'Contemporary bedroom suite with upholstered headboard',
        alt: 'Contemporary bedroom suite in a partner factory showroom'
    },
    'collection_bed_3.jpg': {
        caption: 'Refined bedroom collection — layered textiles and custom finishes',
        alt: 'Refined bedroom collection in a partner factory showroom'
    },
    'collection_bed_4.jpg': {
        caption: 'Fendi Casa–inspired bedroom collection',
        alt: 'Fendi Casa–inspired bedroom collection in a partner factory showroom'
    },
    'collection_bed_5.jpg': {
        caption: 'Fendi Casa–inspired bedroom collection',
        alt: 'Fendi Casa–inspired bedroom collection in a partner factory showroom'
    },
    'collection_bed_6.jpg': {
        caption: 'Fendi Casa–inspired bedroom collection',
        alt: 'Fendi Casa–inspired bedroom collection in a partner factory showroom'
    },

    /* ─── Showroom modal: dining room collections ─── */
    'collection_dining_1.jpg': {
        caption: 'Fendi Casa–inspired dining collection',
        alt: 'Fendi Casa–inspired dining collection in a partner factory showroom'
    },
    'collection_dining_2.jpg': {
        caption: 'Sculptural dining collection — lacquer table and statement seating',
        alt: 'Sculptural luxury dining collection in a partner factory showroom'
    },
    'collection_dining_3.jpg': {
        caption: 'Modern luxury dining suite',
        alt: 'Modern luxury dining suite in a partner factory showroom'
    },
    'collection_dining_4.jpg': {
        caption: 'Refined dining room collection',
        alt: 'Refined dining room collection in a partner factory showroom'
    },
    'collection_dining_5.jpg': {
        caption: 'Contemporary dining collection — tailored to your space',
        alt: 'Contemporary dining collection in a partner factory showroom'
    },
    'collection_dining_6.jpg': {
        caption: 'Elegant dining suite with mixed materials',
        alt: 'Elegant dining suite in a partner factory showroom'
    },

    /* ─── Showroom modal: accessories collage (alt only; no captions in grid) ─── */
    'accessory_1.jpg': {
        caption: '',
        alt: 'Fendi Casa–inspired sculptural chest of drawers in a partner factory showroom'
    },
    'accessory_2.jpg': {
        caption: '',
        alt: 'Modular wood and lacquer sideboard in a partner factory showroom'
    },
    'accessory_3.jpg': {
        caption: '',
        alt: 'Dark wood console cabinet in a partner factory showroom'
    },
    'accessory_4.jpg': {
        caption: '',
        alt: 'Sculptural yellow accent stool in a partner factory showroom'
    },
    'accessory_5.jpg': {
        caption: '',
        alt: 'LC4-style chaise longue with cowhide upholstery in a partner factory showroom'
    },
    'accessory_6.jpg': {
        caption: '',
        alt: 'Blue upholstered accent chair in a partner factory showroom'
    },
    'accessory_7.jpg': {
        caption: '',
        alt: 'White sculptural accent chair in a partner factory showroom'
    },
    'accessory_8.jpg': {
        caption: '',
        alt: 'Cylindrical marble side table in a partner factory showroom'
    },
    'accessory_9.jpg': {
        caption: '',
        alt: 'Black modern lounge chair in a partner factory showroom'
    },
    'accessory_10.jpg': {
        caption: '',
        alt: 'Gaetano Pesce La Mamma inspired accent chair in a partner factory showroom'
    },
    'accessory_11.jpg': {
        caption: '',
        alt: 'Round white sculptural side table in a partner factory showroom'
    },
    'accessory_12.jpg': {
        caption: '',
        alt: 'Layered marble and lacquer coffee table in a partner factory showroom'
    },
    'accessory_13.jpg': {
        caption: '',
        alt: 'Pair of modern accent chairs in a partner factory showroom'
    },
    'accessory_14.jpg': {
        caption: '',
        alt: 'Orange sculptural accent chair in a partner factory showroom'
    },
    'accessory_15.jpg': {
        caption: '',
        alt: 'Black-and-white woven accent chair in a partner factory showroom'
    },

    /* ─── Approach carousel ─── */
    'interior_1.jpg': {
        caption: 'Minotti-inspired living — modular sectional, bouclé upholstery, stone accents.',
        alt: 'Minotti-inspired modular living room collection in a partner factory showroom'
    },
    'interior_2.jpg': {
        caption: 'Fendi Casa–inspired living — sectional seating, marble tables, coordinated palette.',
        alt: 'Fendi Casa–inspired living room collection in a partner factory showroom'
    },
    'interior_3.jpg': {
        caption: 'Modern dining — orange lacquer table, matching chairs.',
        alt: 'Modern dining collection with orange lacquer table in a partner factory showroom'
    },
    'interior_4.jpg': {
        caption: 'Fendi Casa–inspired bedroom — chevron headboard, layered textiles, tailored to your room.',
        alt: 'Fendi Casa–inspired bedroom collection in a partner factory showroom'
    },
    'interior_5.jpg': {
        caption: 'Refined dining — marble table, statement chandelier.',
        alt: 'Refined dining collection with marble table and chandelier in a partner factory showroom'
    },
    'style_img.jpg': {
        caption: 'Gaetano Pesce "La Mamma" inspired accent chair — available in custom colors.',
        alt: 'Gaetano Pesce La Mamma inspired accent chair in a showroom setting'
    },
    /* ─── Why Us factory hero ─── */
    'factory_3.jpg': {
        caption: "Curated network of Foshan's leading premium furniture factories.",
        alt: 'Modern partner manufacturing campus in Foshan'
    },

    /* ─── Inline page images (optional alt / captions) ─── */
    'img_journal.jpg': {
        caption: '',
        alt: 'Showroom floor during a visit in Foshan'
    }
};

function landingImageKey(path) {
    if (!path) return '';
    return path.split('/').pop();
}

function getLandingImageMeta(path) {
    const key = landingImageKey(path);
    const entry = LANDING_IMAGE_CAPTIONS[key];
    if (!entry) {
        return { caption: '', alt: '', kicker: '' };
    }
    return {
        caption: entry.caption || '',
        alt: entry.alt || entry.caption || '',
        kicker: entry.kicker || ''
    };
}

function buildShowroomItem(imagePath) {
    const meta = getLandingImageMeta(imagePath);
    return {
        image: imagePath,
        alt: meta.alt || 'Curated whole-room collection',
        caption: meta.caption || ''
    };
}
