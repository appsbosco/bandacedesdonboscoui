/**
 * formationEngine.js — Pure computation, no React, no side effects.
 *
 * Layout model:
 *   - 5 zones in vertical depth order:
 *       FRENTE_ESPECIAL → BLOQUE_FRENTE → PERCUSION → BLOQUE_ATRAS → FINAL
 *   - SINGLE:  FRENTE_ESPECIAL + BLOQUE_FRENTE + PERCUSION + FINAL
 *   - DOUBLE:  all 5 zones — members of BLOQUE_FRENTE/ATRAS are split per
 *              section: ceil(n/2) to FRENTE, floor(n/2) to ATRAS
 *   - One global `columns` value for every zone.
 *   - Within each zone, sections flow continuously left→right, top→bottom.
 *     If a section doesn't fill a row, the next section continues from the
 *     same row — no mini-grids per section.
 *   - Last row of every zone is padded with empty filler slots.
 *   - Slot key = zone|row|col (section is metadata for color-coding only).
 *   - Section order per zone is fully configurable — not hardcoded.
 */

// ── Zone catalog ──────────────────────────────────────────────────────────────

export const ZONES = ["FRENTE_ESPECIAL", "BLOQUE_FRENTE", "PERCUSION", "BLOQUE_ATRAS", "FINAL"];

export const ZONE_LABEL = {
  FRENTE_ESPECIAL: "Frente",
  BLOQUE_FRENTE: "Bloque del Frente",
  PERCUSION: "Percusión",
  BLOQUE_ATRAS: "Bloque de Atrás",
  FINAL: "Final",
};

/**
 * Which sections can belong to each zone (default pool).
 * The actual per-formation order is stored in zoneOrders and is fully
 * configurable by the user.
 */
export const ZONE_POOL_SECTIONS = {
  FRENTE_ESPECIAL: ["DANZA", "DRUM_MAJOR"],
  BLOQUE_FRENTE: [
    "TROMBONES",
    "FLAUTAS",
    "CLARINETES",
    "SAXOFONES_ALTO",
    "SAXOFON_TENOR",
    "MELOFONOS",
    "SAXOFON_BARITONO",
    "EUFONIOS",
    "TROMPETAS",
    "TUBAS",
  ],
  PERCUSION: ["MALLETS", "PERCUSION"],
  BLOQUE_ATRAS: [
    "TROMBONES",
    "FLAUTAS",
    "CLARINETES",
    "SAXOFONES_ALTO",
    "SAXOFON_TENOR",
    "MELOFONOS",
    "SAXOFON_BARITONO",
    "EUFONIOS",
    "TROMPETAS",
    "TUBAS",
  ],
  FINAL: ["COLOR_GUARD"],
};

/**
 * Default section order for each zone — used when creating a new formation.
 * Users can freely reorder sections within any zone/block.
 */
export const DEFAULT_ZONE_ORDERS = {
  FRENTE_ESPECIAL: ["DANZA", "DRUM_MAJOR"],
  BLOQUE_FRENTE: [
    "TROMBONES",
    "FLAUTAS",
    "CLARINETES",
    "SAXOFONES_ALTO",
    "SAXOFON_TENOR",
    "MELOFONOS",
    "SAXOFON_BARITONO",
    "EUFONIOS",
    "TROMPETAS",
    "TUBAS",
  ],
  PERCUSION: ["MALLETS", "PERCUSION"],
  BLOQUE_ATRAS: [
    "TROMBONES",
    "FLAUTAS",
    "CLARINETES",
    "SAXOFONES_ALTO",
    "SAXOFON_TENOR",
    "MELOFONOS",
    "SAXOFON_BARITONO",
    "EUFONIOS",
    "TROMPETAS",
    "TUBAS",
  ],
  FINAL: ["COLOR_GUARD"],
};

const FRONT_SECTION_HINTS = ["DANZA", "DANCE", "DRUM_MAJOR", "MAJOR"];
const PERCUSSION_SECTION_HINTS = ["PERCUSION", "PERCUSSION", "DRUMLINE", "BATTERY", "MALLETS"];
const FINAL_SECTION_HINTS = ["COLOR_GUARD", "COLORS", "COLOR", "GUARD", "FLAGS", "BANDERA"];

/**
 * Zones that use their own independent column count instead of the global wind columns.
 * FRENTE_ESPECIAL = Danza, PERCUSION = Percusión + Mallets, FINAL = Color Guard.
 */
export const INDEPENDENT_COLUMN_ZONES = ["FRENTE_ESPECIAL", "PERCUSION", "FINAL"];

/**
 * Default column counts for the independent zones.
 * Wind blocks (BLOQUE_FRENTE, BLOQUE_ATRAS) always use the global `columns`.
 */
export const DEFAULT_ZONE_COLUMNS = {
  FRENTE_ESPECIAL: 4,
  PERCUSION:       6,
  FINAL:           4,
};

/**
 * Default row counts for the independent zones.
 * null = auto (rows are calculated from member count).
 */
export const DEFAULT_ZONE_ROWS = {
  FRENTE_ESPECIAL: null,
  PERCUSION:       null,
  FINAL:           null,
};

// ── Section catalog ───────────────────────────────────────────────────────────

export const SECTION_LABEL = {
  DRUM_MAJOR: "Drum Major",
  DANZA: "Danza",
  TROMBONES: "Trombones",
  FLAUTAS: "Flautas",
  CLARINETES: "Clarinetes",
  SAXOFONES_ALTO: "Saxofón Alto",
  SAXOFON_TENOR: "Saxofón Tenor",
  MELOFONOS: "Melófonos",
  SAXOFON_BARITONO: "Saxofón Barítono",
  EUFONIOS: "Eufonios",
  TROMPETAS: "Trompetas",
  TUBAS: "Tubas",
  MALLETS: "Mallets",
  PERCUSION: "Percusión",
  COLOR_GUARD: "Color Guard",
};

function prettifySectionToken(section) {
  return String(section || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeSectionToken(section) {
  return String(section || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function includesSectionHint(section, hints) {
  const normalized = normalizeSectionToken(section);
  return hints.some((hint) => normalized.includes(hint));
}

export function getSectionLabel(section) {
  return SECTION_LABEL[section] || prettifySectionToken(section) || "Sección";
}

export function inferZonesForSection(section, type = "SINGLE") {
  if (includesSectionHint(section, FRONT_SECTION_HINTS)) return ["FRENTE_ESPECIAL"];
  if (includesSectionHint(section, PERCUSSION_SECTION_HINTS)) return ["PERCUSION"];
  if (includesSectionHint(section, FINAL_SECTION_HINTS)) return ["FINAL"];
  return type === "DOUBLE" ? ["BLOQUE_FRENTE", "BLOQUE_ATRAS"] : ["BLOQUE_FRENTE"];
}

export function buildDynamicZonePools({ sections = [], zoneOrders = {}, type = "SINGLE" }) {
  const knownSections = new Set();

  sections.forEach((group) => {
    if (group?.section) knownSections.add(group.section);
  });

  Object.values(zoneOrders || {}).forEach((order) => {
    (order || []).forEach((section) => {
      if (section) knownSections.add(section);
    });
  });

  Object.values(DEFAULT_ZONE_ORDERS).forEach((order) => {
    (order || []).forEach((section) => {
      if (section) knownSections.add(section);
    });
  });

  const pools = {
    FRENTE_ESPECIAL: [],
    BLOQUE_FRENTE: [],
    PERCUSION: [],
    BLOQUE_ATRAS: [],
    FINAL: [],
  };

  [...knownSections].forEach((section) => {
    inferZonesForSection(section, type).forEach((zone) => {
      if (!pools[zone].includes(section)) pools[zone].push(section);
    });
  });

  Object.entries(DEFAULT_ZONE_ORDERS).forEach(([zone, defaults]) => {
    defaults.forEach((section) => {
      if (!pools[zone].includes(section)) pools[zone].push(section);
    });
  });

  return pools;
}

export function mergeZoneOrdersWithPools(zoneOrders = {}, zonePools = {}) {
  const next = {};

  Object.keys({ ...DEFAULT_ZONE_ORDERS, ...zonePools, ...zoneOrders }).forEach((zone) => {
    const current = zoneOrders[zone] || [];
    const pool = zonePools[zone] || [];
    const merged = [...current];

    pool.forEach((section) => {
      if (section && !current.includes(section)) merged.push(section);
    });

    next[zone] = merged;
  });

  return next;
}

function splitMembersEvenly(members, occurrences) {
  if (occurrences <= 1) return [members];

  const result = [];
  let start = 0;
  const baseSize = Math.floor(members.length / occurrences);
  const remainder = members.length % occurrences;

  for (let index = 0; index < occurrences; index++) {
    const extra = index < remainder ? 1 : 0;
    const end = start + baseSize + extra;
    result.push(members.slice(start, end));
    start = end;
  }

  return result;
}

/**
 * Rich color tokens per section.
 *   cell  — Tailwind classes for the grid cell background + border
 *   text  — Tailwind class for the name text inside the cell
 *   badge — Tailwind classes for the section legend badge
 *   dark  — true when the cell bg is dark (text must be light)
 *
 * Palette spans the full color wheel so every section is clearly distinct.
 */
export const SECTION_COLORS = {
  DRUM_MAJOR: {
    cell: "bg-indigo-800   border-indigo-900",
    text: "text-white",
    badge: "bg-indigo-100   border-indigo-400   text-indigo-900",
    dark: true,
  },
  DANZA: {
    cell: "bg-fuchsia-100  border-fuchsia-400",
    text: "text-fuchsia-900",
    badge: "bg-fuchsia-50   border-fuchsia-300  text-fuchsia-800",
    dark: false,
  },
  TROMBONES: {
    cell: "bg-purple-100   border-purple-400",
    text: "text-purple-900",
    badge: "bg-purple-50    border-purple-300   text-purple-800",
    dark: false,
  },
  FLAUTAS: {
    cell: "bg-blue-100     border-blue-400",
    text: "text-blue-900",
    badge: "bg-blue-50      border-blue-300     text-blue-800",
    dark: false,
  },
  CLARINETES: {
    cell: "bg-teal-100     border-teal-400",
    text: "text-teal-900",
    badge: "bg-teal-50      border-teal-300     text-teal-800",
    dark: false,
  },
  SAXOFONES_ALTO: {
    cell: "bg-orange-100   border-orange-400",
    text: "text-orange-900",
    badge: "bg-orange-50    border-orange-300   text-orange-800",
    dark: false,
  },
  SAXOFON_TENOR: {
    cell: "bg-yellow-100   border-yellow-400",
    text: "text-yellow-900",
    badge: "bg-yellow-50    border-yellow-300   text-yellow-800",
    dark: false,
  },
  MELOFONOS: {
    cell: "bg-lime-100     border-lime-500",
    text: "text-lime-900",
    badge: "bg-lime-50      border-lime-400     text-lime-900",
    dark: false,
  },
  SAXOFON_BARITONO: {
    cell: "bg-green-100    border-green-400",
    text: "text-green-900",
    badge: "bg-green-50     border-green-300    text-green-800",
    dark: false,
  },
  EUFONIOS: {
    cell: "bg-cyan-100     border-cyan-400",
    text: "text-cyan-900",
    badge: "bg-cyan-50      border-cyan-300     text-cyan-800",
    dark: false,
  },
  TROMPETAS: {
    cell: "bg-red-100      border-red-400",
    text: "text-red-900",
    badge: "bg-red-50       border-red-300      text-red-800",
    dark: false,
  },
  TUBAS: {
    cell: "bg-sky-100      border-sky-400",
    text: "text-sky-900",
    badge: "bg-sky-50       border-sky-300      text-sky-800",
    dark: false,
  },
  MALLETS: {
    cell: "bg-violet-100   border-violet-400",
    text: "text-violet-900",
    badge: "bg-violet-50    border-violet-300   text-violet-800",
    dark: false,
  },
  PERCUSION: {
    cell: "bg-stone-200    border-stone-400",
    text: "text-stone-800",
    badge: "bg-stone-100    border-stone-300    text-stone-700",
    dark: false,
  },
  COLOR_GUARD: {
    cell: "bg-rose-100     border-rose-400",
    text: "text-rose-900",
    badge: "bg-rose-50      border-rose-300     text-rose-800",
    dark: false,
  },
};

/** Legacy flat map (bg+border only) kept for any external consumers. */
export const SECTION_COLOR_CLASS = Object.fromEntries(
  Object.entries(SECTION_COLORS).map(([k, v]) => [k, v.cell])
);

// ── Core helpers ──────────────────────────────────────────────────────────────

/** Unique key for a slot position. */
export function slotKey(slot) {
  return `${slot.zone}|${slot.row}|${slot.col}`;
}

// ── Grid fill algorithm ───────────────────────────────────────────────────────

/**
 * Fill a grid of `columns` columns with `members` (in order),
 * padding the last row with empty filler slots.
 * If `explicitRows` is provided, the grid has exactly that many rows regardless
 * of member count (members that exceed the grid are silently dropped; extra
 * cells beyond member count are empty fillers).
 * Returns a flat slot array for this zone.
 */
function fillGrid(zone, members, columns, explicitRows = null) {
  const slots = [];
  if (!members.length && !explicitRows) return slots;

  const autoRows = members.length ? Math.ceil(members.length / columns) : 1;
  const rows = explicitRows != null ? Math.max(1, explicitRows) : autoRows;
  const totalCells = rows * columns; // may exceed memberCount (last-row padding)

  for (let pos = 0; pos < totalCells; pos++) {
    const row = Math.floor(pos / columns);
    const col = pos % columns;

    if (pos < members.length) {
      const m = members[pos];
      slots.push({
        zone,
        row,
        col,
        section: m.section || null,
        userId: m.userId || null,
        displayName: m.name || null,
        avatar: m.avatar || null,
        locked: false,
      });
    } else {
      // Empty filler — completes the last row
      slots.push({
        zone,
        row,
        col,
        section: null,
        userId: null,
        displayName: null,
        avatar: null,
        locked: false,
      });
    }
  }

  return slots;
}

// ── buildZones ────────────────────────────────────────────────────────────────

/**
 * Build the ordered zone data array from React state — ready for computeFormation.
 *
 * For DOUBLE type, members of BLOQUE_FRENTE and BLOQUE_ATRAS are split per
 * section: ceil(n/2) go to FRENTE, floor(n/2) go to ATRAS.
 *
 * @param {Object} params
 * @param {Object} params.zoneOrders    { [zone]: string[] } — section order per zone
 * @param {Array}  params.sectionGroups [{ section, members: [{userId,name,instrument}] }]
 * @param {Set}    params.excludedIds   Set of user IDs to exclude client-side
 * @param {String} params.type          "SINGLE" | "DOUBLE"
 * @returns {Array} [{ zone, members }] in display order
 */
export function buildZones({ zoneOrders, sectionGroups, excludedIds, type }) {
  const activeZones =
    type === "DOUBLE"
      ? ["FRENTE_ESPECIAL", "BLOQUE_FRENTE", "PERCUSION", "BLOQUE_ATRAS", "FINAL"]
      : ["FRENTE_ESPECIAL", "BLOQUE_FRENTE", "PERCUSION", "FINAL"];

  const result = [];

  for (const zone of activeZones) {
    const sectionOrder = zoneOrders[zone] || [];
    const sectionOccurrences = sectionOrder.reduce((acc, sec) => {
      acc[sec] = (acc[sec] || 0) + 1;
      return acc;
    }, {});
    const sectionChunks = {};
    const sectionChunkIndex = {};

    const members = sectionOrder.flatMap((sec) => {
      const grp = sectionGroups.find((g) => g.section === sec);
      let eligible = (grp?.members || [])
        .filter((m) => !excludedIds.has(m.userId))
        .map((m) => ({ ...m, section: sec }));

      // Split members between front and back blocks for DOUBLE
      if (type === "DOUBLE" && (zone === "BLOQUE_FRENTE" || zone === "BLOQUE_ATRAS")) {
        const half = Math.ceil(eligible.length / 2);
        eligible = zone === "BLOQUE_FRENTE" ? eligible.slice(0, half) : eligible.slice(half);
      }

      if (!sectionChunks[sec]) {
        sectionChunks[sec] = splitMembersEvenly(eligible, sectionOccurrences[sec] || 1);
        sectionChunkIndex[sec] = 0;
      }

      const chunk = sectionChunks[sec][sectionChunkIndex[sec]] || [];
      sectionChunkIndex[sec] += 1;
      return chunk;
    });

    if (members.length > 0) result.push({ zone, members });
  }

  return result;
}

// ── computeFormation ──────────────────────────────────────────────────────────

/**
 * Compute the full flat slot list for a formation.
 *
 * @param {Object} params
 * @param {Array}  params.zoneData      [{zone, members:[{userId,name,section}]}]
 *   Zones in display order, pre-built by buildZones.
 * @param {Number} params.columns       Global column count.
 * @param {Array}  params.existingSlots Previously saved slots (for lock preservation).
 *
 * @returns {Array} Flat slot list.
 */
export function computeFormation({ zoneData, columns, zoneColumns = {}, zoneRows = {}, existingSlots = [] }) {
  // Build lookup of locked positions from existing slots
  const lockedByKey = {};
  const lockedUserIds = new Set();
  for (const s of existingSlots) {
    if (s.locked) {
      lockedByKey[slotKey(s)] = s;
      if (s.userId) lockedUserIds.add(String(s.userId));
    }
  }

  const result = [];
  for (const { zone, members } of zoneData) {
    const effectiveCols = (zoneColumns[zone] != null) ? zoneColumns[zone] : columns;
    const effectiveRows = (zoneRows[zone] != null) ? zoneRows[zone] : null;
    const grid = fillGrid(zone, members, effectiveCols, effectiveRows);
    result.push(...applyLocks(grid, lockedByKey, lockedUserIds));
  }

  return result;
}

/**
 * Merge locked positions from the previous save into freshly computed slots.
 */
function applyLocks(newSlots, lockedByKey, lockedUserIds) {
  // Members that were NOT locked — they fill the free positions
  const floating = newSlots
    .filter((s) => {
      const key = slotKey(s);
      return !lockedByKey[key] && s.userId && !lockedUserIds.has(String(s.userId));
    })
    .map((s) => ({
      userId: s.userId,
      name: s.displayName,
      avatar: s.avatar || null,
      section: s.section,
    }));

  let floatIdx = 0;
  return newSlots.map((slot) => {
    const key = slotKey(slot);
    const locked = lockedByKey[key];

    if (locked) {
      return { ...locked };
    } else if (slot.userId !== null) {
      const member = floating[floatIdx++];
      return {
        ...slot,
        section: member?.section || null,
        userId: member?.userId || null,
        displayName: member?.name || null,
        avatar: member?.avatar || null,
        locked: false,
      };
    } else {
      return { ...slot }; // empty filler
    }
  });
}

// ── Manual editing helpers ────────────────────────────────────────────────────

/**
 * Swap the user assignments of two slots (by their keys).
 * Returns new slots array (immutable). Locked slots cannot be moved.
 */
export function swapSlots(slots, keyA, keyB) {
  const idxA = slots.findIndex((s) => slotKey(s) === keyA);
  const idxB = slots.findIndex((s) => slotKey(s) === keyB);
  if (idxA === -1 || idxB === -1) return slots;

  const slotA = slots[idxA];
  const slotB = slots[idxB];
  if (slotA.locked || slotB.locked) return slots;

  const next = slots.slice();
  next[idxA] = {
    ...slotA,
    section: slotB.section,
    userId: slotB.userId,
    displayName: slotB.displayName,
    avatar: slotB.avatar || null,
  };
  next[idxB] = {
    ...slotB,
    section: slotA.section,
    userId: slotA.userId,
    displayName: slotA.displayName,
    avatar: slotA.avatar || null,
  };
  return next;
}

/**
 * Toggle the locked state of a single slot.
 * Returns new slots array (immutable).
 */
export function toggleLock(slots, key) {
  return slots.map((s) => (slotKey(s) === key ? { ...s, locked: !s.locked } : s));
}
