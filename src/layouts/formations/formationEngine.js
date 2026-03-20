/**
 * formationEngine.js — Pure computation, no React, no side effects.
 *
 * FIXES vs previous versions:
 *
 *  1. buildZones — sección en una sola zona no pierde miembros (bug TUBAS):
 *     El algoritmo anterior forzaba un split 50/50 frente/atrás para CUALQUIER
 *     sección que detectara como "de bloque", aunque solo estuviera configurada
 *     en UNA de las dos zonas. La mitad trasera quedaba en un chunk que nunca
 *     se consumía → músicos perdidos silenciosamente.
 *
 *     Ahora:
 *       - Se cuenta cuántas veces aparece la sección en BLOQUE_FRENTE (fc) y en
 *         BLOQUE_ATRAS (bc) según el zoneOrder real del usuario.
 *       - Si fc=1, bc=0 → todos van al frente, nadie al back.
 *       - Si fc=1, bc=1 → split 50/50.
 *       - Si fc=2, bc=1 → 2/3 al frente (en 2 chunks), 1/3 atrás.
 *       - Cualquier combinación funciona, incluyendo la misma sección 3 veces
 *         en la misma zona (3 filas).
 *
 *  2. applyLocks — ya no descarta músicos:
 *     La versión anterior filtraba `floating` excluyendo userIds que estuvieran
 *     en `lockedUserIds`, pero ese set se construía desde los nuevos slots —
 *     no los viejos — causando que músicos después del N-ésimo lock se perdieran.
 *     Ahora: floating = todos los miembros no bloqueados en orden; se asignan
 *     posición a posición sin filtros extra.
 *
 *  3. excludedIds — type safety:
 *     Todos los userId se normalizan a String antes de cualquier comparación de
 *     Set, para evitar que IDs numéricos del API escapen el filtro de exclusión.
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

export const INDEPENDENT_COLUMN_ZONES = ["FRENTE_ESPECIAL", "PERCUSION", "FINAL"];

export const DEFAULT_ZONE_COLUMNS = {
  FRENTE_ESPECIAL: 4,
  PERCUSION: 6,
  FINAL: 4,
};

export const DEFAULT_ZONE_ROWS = {
  FRENTE_ESPECIAL: null,
  PERCUSION: null,
  FINAL: null,
};

// ── Section catalog ───────────────────────────────────────────────────────────

export const SECTION_LABEL = {
  DRUM_MAJOR: "Drum Major",
  DANZA: "Danza",
  TROMBONES: "Trombones",
  FLAUTAS: "Flautas",
  CLARINETES: "Clarinetes",
  SAXOFONES_ALTO: "Saxofón",
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
    .map((p) => p.charAt(0) + p.slice(1).toLowerCase())
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
  const n = normalizeSectionToken(section);
  return hints.some((h) => n.includes(h));
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

export function canSectionOccupyZone(section, zone, type = "DOUBLE") {
  if (!section || !zone) return true;
  return inferZonesForSection(section, type).includes(zone);
}

export function canSwapSlotContents(slotA, slotB, type = "DOUBLE") {
  if (!slotA || !slotB) return false;
  const aFitsInB = !slotA.userId || canSectionOccupyZone(slotA.section, slotB.zone, type);
  const bFitsInA = !slotB.userId || canSectionOccupyZone(slotB.section, slotA.zone, type);
  return aFitsInB && bFitsInA;
}

export function buildDynamicZonePools({ sections = [], zoneOrders = {}, type = "SINGLE" }) {
  const known = new Set();
  sections.forEach((g) => g?.section && known.add(g.section));
  Object.values(zoneOrders || {}).forEach((o) => (o || []).forEach((s) => s && known.add(s)));
  Object.values(DEFAULT_ZONE_ORDERS).forEach((o) => o.forEach((s) => known.add(s)));

  const pools = {
    FRENTE_ESPECIAL: [],
    BLOQUE_FRENTE: [],
    PERCUSION: [],
    BLOQUE_ATRAS: [],
    FINAL: [],
  };
  [...known].forEach((sec) => {
    inferZonesForSection(sec, type).forEach((zone) => {
      if (!pools[zone].includes(sec)) pools[zone].push(sec);
    });
  });
  Object.entries(DEFAULT_ZONE_ORDERS).forEach(([zone, defs]) => {
    defs.forEach((sec) => {
      if (!pools[zone].includes(sec)) pools[zone].push(sec);
    });
  });
  return pools;
}

export function mergeZoneOrdersWithPools(zoneOrders = {}, zonePools = {}) {
  const next = {};
  Object.keys({ ...DEFAULT_ZONE_ORDERS, ...zonePools, ...zoneOrders }).forEach((zone) => {
    const current = zoneOrders[zone] || [];
    const merged = [...current];
    (zonePools[zone] || []).forEach((s) => {
      if (s && !current.includes(s)) merged.push(s);
    });
    next[zone] = merged;
  });
  return next;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Coerce userId to string — prevents numeric vs string Set mismatches. */
function uid(id) {
  return id == null ? null : String(id);
}

/**
 * Split `members` into `occurrences` even chunks.
 * First `remainder` chunks get ceil size, the rest get floor.
 */
function splitMembersEvenly(members, occurrences) {
  if (occurrences <= 1) return [members];
  const result = [];
  const base = Math.floor(members.length / occurrences);
  const rem = members.length % occurrences;
  let start = 0;
  for (let i = 0; i < occurrences; i++) {
    const end = start + base + (i < rem ? 1 : 0);
    result.push(members.slice(start, end));
    start = end;
  }
  return result;
}

// ── Grid fill ─────────────────────────────────────────────────────────────────

function fillGrid(zone, members, columns, explicitRows = null) {
  if (!members.length && !explicitRows) return [];
  const autoRows = members.length ? Math.ceil(members.length / columns) : 1;
  const rows = explicitRows != null ? Math.max(1, explicitRows) : autoRows;
  const totalCells = rows * columns;
  const slots = [];

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
        userId: uid(m.userId) || null,
        displayName: m.name || null,
        avatar: m.avatar || null,
        locked: false,
      });
    } else {
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
 * Build the ordered zone data array from React state.
 *
 * Member distribution for DOUBLE type:
 *   For each section, count how many times it appears in BLOQUE_FRENTE (fc)
 *   and BLOQUE_ATRAS (bc) in the user's actual zoneOrders.
 *
 *   Members are distributed proportionally:
 *     frontTotal = round(totalMembers * fc / (fc + bc))
 *     backTotal  = totalMembers - frontTotal
 *
 *   Then frontTotal is split into fc equal chunks (one per BLOQUE_FRENTE occurrence),
 *   and backTotal into bc chunks (one per BLOQUE_ATRAS occurrence).
 *
 *   Examples:
 *     TUBAS: fc=1, bc=0  → all 10 go to front in 1 chunk. Back gets nothing.
 *     TUBAS: fc=1, bc=1  → 5 front, 5 back.
 *     TUBAS: fc=2, bc=1  → 7 front (in 2 chunks of 4/3), 3 back (1 chunk).
 *     TUBAS: fc=2, bc=0  → all 10 go to front in 2 chunks of 5 each.
 */
export function buildZones({ zoneOrders, sectionGroups, excludedIds, type }) {
  const activeZones =
    type === "DOUBLE"
      ? ["FRENTE_ESPECIAL", "BLOQUE_FRENTE", "PERCUSION", "BLOQUE_ATRAS", "FINAL"]
      : ["FRENTE_ESPECIAL", "BLOQUE_FRENTE", "PERCUSION", "FINAL"];

  // Normalise to string Set — handles numeric IDs from GraphQL
  const excludedSet = new Set([...(excludedIds || [])].map(uid));

  // All sections referenced in this formation's zone orders
  const seenSections = new Set(Object.values(zoneOrders).flat().filter(Boolean));

  // ── Pre-build member chunks per section ────────────────────────────────────
  // Key format:
  //   Block sections (DOUBLE):  "SEC__BLOQUE_FRENTE" / "SEC__BLOQUE_ATRAS"
  //   Everything else:          "SEC"
  const sectionChunks = {};
  const sectionChunkIndex = {};

  for (const sec of seenSections) {
    const grp = sectionGroups.find((g) => g.section === sec);
    const eligible = (grp?.members || [])
      .filter((m) => !excludedSet.has(uid(m.userId)))
      .map((m) => ({ ...m, userId: uid(m.userId), section: sec }));

    if (type === "DOUBLE") {
      const fc = (zoneOrders["BLOQUE_FRENTE"] || []).filter((s) => s === sec).length;
      const bc = (zoneOrders["BLOQUE_ATRAS"] || []).filter((s) => s === sec).length;

      if (fc + bc > 0) {
        // Distribute proportionally to actual occurrence ratio
        const total = eligible.length;
        const frontTotal = fc > 0 ? Math.round((total * fc) / (fc + bc)) : 0;
        const backTotal = total - frontTotal;

        if (fc > 0) {
          sectionChunks[`${sec}__BLOQUE_FRENTE`] = splitMembersEvenly(
            eligible.slice(0, frontTotal),
            fc
          );
          sectionChunkIndex[`${sec}__BLOQUE_FRENTE`] = 0;
        }
        if (bc > 0) {
          sectionChunks[`${sec}__BLOQUE_ATRAS`] = splitMembersEvenly(
            eligible.slice(frontTotal),
            bc
          );
          sectionChunkIndex[`${sec}__BLOQUE_ATRAS`] = 0;
        }
        continue; // handled as block section
      }
    }

    // Non-block section or SINGLE type:
    // chunk by total occurrences across ALL zones so repeated entries work
    const totalOcc =
      Object.values(zoneOrders)
        .flat()
        .filter((s) => s === sec).length || 1;
    sectionChunks[sec] = splitMembersEvenly(eligible, totalOcc);
    sectionChunkIndex[sec] = 0;
  }

  // ── Assemble per-zone member arrays ────────────────────────────────────────
  const result = [];
  for (const zone of activeZones) {
    const isBlock = zone === "BLOQUE_FRENTE" || zone === "BLOQUE_ATRAS";

    const members = (zoneOrders[zone] || []).flatMap((sec) => {
      const blockKey = `${sec}__${zone}`;
      const key = type === "DOUBLE" && isBlock && sectionChunks[blockKey] ? blockKey : sec;

      const chunks = sectionChunks[key];
      if (!chunks) return [];

      const idx = sectionChunkIndex[key] ?? 0;
      const chunk = chunks[idx] || [];
      sectionChunkIndex[key] = idx + 1;
      return chunk;
    });

    if (members.length > 0) result.push({ zone, members });
  }

  return result;
}

// ── computeFormation ──────────────────────────────────────────────────────────

export function computeFormation({
  zoneData,
  columns,
  zoneColumns = {},
  zoneRows = {},
  existingSlots = [],
}) {
  const lockedByKey = {};
  for (const s of existingSlots) {
    if (s.locked) lockedByKey[slotKey(s)] = s;
  }

  const result = [];
  for (const { zone, members } of zoneData) {
    const effectiveCols = zoneColumns[zone] != null ? zoneColumns[zone] : columns;
    const effectiveRows = zoneRows[zone] != null ? zoneRows[zone] : null;
    const grid = fillGrid(zone, members, effectiveCols, effectiveRows);
    result.push(...applyLocks(grid, lockedByKey));
  }
  return result;
}

/**
 * Merge locked positions from existing save into freshly computed slots.
 *
 * Algorithm:
 *  1. Walk newSlots in order; collect all non-locked members into `floating[]`.
 *  2. Walk newSlots again:
 *     - Locked key  → restore exact old locked slot.
 *     - Member slot → assign next floating member.
 *     - Empty slot  → leave empty.
 */
function applyLocks(newSlots, lockedByKey) {
  const floating = newSlots
    .filter((s) => !lockedByKey[slotKey(s)] && s.userId !== null)
    .map((s) => ({
      userId: s.userId,
      name: s.displayName,
      avatar: s.avatar || null,
      section: s.section,
    }));

  let fi = 0;
  return newSlots.map((slot) => {
    const key = slotKey(slot);
    const locked = lockedByKey[key];

    if (locked) return { ...locked };

    if (slot.userId !== null) {
      const m = floating[fi++];
      if (!m)
        return {
          ...slot,
          section: null,
          userId: null,
          displayName: null,
          avatar: null,
          locked: false,
        };
      return {
        ...slot,
        section: m.section || null,
        userId: m.userId || null,
        displayName: m.name || null,
        avatar: m.avatar || null,
        locked: false,
      };
    }

    return { ...slot }; // empty filler
  });
}

// ── Slot key ──────────────────────────────────────────────────────────────────

export function slotKey(slot) {
  return `${slot.zone}|${slot.row}|${slot.col}`;
}

// ── Manual editing helpers ────────────────────────────────────────────────────

export function swapSlots(slots, keyA, keyB) {
  const idxA = slots.findIndex((s) => slotKey(s) === keyA);
  const idxB = slots.findIndex((s) => slotKey(s) === keyB);
  if (idxA === -1 || idxB === -1) return slots;
  const a = slots[idxA],
    b = slots[idxB];
  if (a.locked || b.locked) return slots;
  const next = slots.slice();
  next[idxA] = {
    ...a,
    section: b.section,
    userId: b.userId,
    displayName: b.displayName,
    avatar: b.avatar || null,
  };
  next[idxB] = {
    ...b,
    section: a.section,
    userId: a.userId,
    displayName: a.displayName,
    avatar: a.avatar || null,
  };
  return next;
}

export function toggleLock(slots, key) {
  return slots.map((s) => (slotKey(s) === key ? { ...s, locked: !s.locked } : s));
}

// ── Section colors ────────────────────────────────────────────────────────────

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

export const SECTION_COLOR_CLASS = Object.fromEntries(
  Object.entries(SECTION_COLORS).map(([k, v]) => [k, v.cell])
);
