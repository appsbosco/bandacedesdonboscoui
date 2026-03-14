/**
 * roomGrouping.js
 * Frontend-only grouping engine for tour room planning.
 * Groups participants by sex + age bucket, suggests room splits.
 *
 * Sex is persisted on TourParticipant (participant.sex).
 * sexOverrides Map is derived from participant data and passed as a convenience.
 *
 * Assignment rules:
 *  - Men with men, women with women — except staff, who may share mixed rooms.
 *  - Sorted by age first, then alphabetically within each age group.
 *  - Room sizes: fill 5-person rooms first, then 4-person, then 3-person.
 *  - Avoid mixing adults (18+) with minors, EXCEPT when the age difference is
 *    minimal (e.g. a 17-year-old with 18-year-olds). The "soft border" window
 *    is controlled by ADULT_MINOR_SOFT_BORDER_YEARS (default 1 year).
 *
 * ⚠️  All ages are calculated relative to TOUR_REFERENCE_DATE, not today.
 *     This ensures assignments reflect how old participants will be on the tour.
 */

// ── Tour reference date ───────────────────────────────────────────────────────

/**
 * The date used as "today" for all age calculations.
 * Ages are computed as of this date so that room assignments reflect
 * participants' ages at the time of the tour, not at planning time.
 */
export const TOUR_REFERENCE_DATE = new Date("2027-01-04");

// ── Age buckets ───────────────────────────────────────────────────────────────

export const DEFAULT_AGE_BUCKETS = [
  { label: "0–11",  min: 0,  max: 11 },
  { label: "12–14", min: 12, max: 14 },
  { label: "15–17", min: 15, max: 17 },
  { label: "18+",   min: 18, max: Infinity },
];

export const SEX_CONFIG = {
  M:       { label: "Hombres",  short: "M", color: "bg-blue-100 text-blue-700 border-blue-200" },
  F:       { label: "Mujeres",  short: "F", color: "bg-pink-100 text-pink-700 border-pink-200" },
  UNKNOWN: { label: "Sin sexo", short: "?", color: "bg-gray-100 text-gray-500 border-gray-200" },
};

// Cycle sex values on click: UNKNOWN → M → F → UNKNOWN
export const SEX_CYCLE = ["UNKNOWN", "M", "F"];
export function nextSex(current) {
  const idx = SEX_CYCLE.indexOf(current || "UNKNOWN");
  return SEX_CYCLE[(idx + 1) % SEX_CYCLE.length];
}

// How many years of age difference are tolerated when mixing minors / adults.
// A 17-year-old and an 18-year-old differ by 1 year → allowed with default value.
export const ADULT_MINOR_SOFT_BORDER_YEARS = 1;

// ── Age helpers ───────────────────────────────────────────────────────────────

/**
 * Calculate age as of TOUR_REFERENCE_DATE (not today).
 * Pass a custom `asOf` date to override (useful for tests).
 */
export function calcAge(birthDate, asOf = TOUR_REFERENCE_DATE) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  let age = asOf.getFullYear() - birth.getFullYear();
  const m = asOf.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < birth.getDate())) age--;
  return age < 0 ? 0 : age;
}

export function getAgeBucket(age, buckets = DEFAULT_AGE_BUCKETS) {
  if (age === null || age === undefined) return null;
  return buckets.find((b) => age >= b.min && age <= b.max) || null;
}

/** Returns true if the two ages are on different sides of the adult threshold
 *  (18) but within ADULT_MINOR_SOFT_BORDER_YEARS of each other. */
export function isSoftAdultBorder(ageA, ageB) {
  if (ageA === null || ageB === null) return false;
  const THRESHOLD = 18;
  const straddled =
    (ageA < THRESHOLD && ageB >= THRESHOLD) ||
    (ageB < THRESHOLD && ageA >= THRESHOLD);
  return straddled && Math.abs(ageA - ageB) <= ADULT_MINOR_SOFT_BORDER_YEARS;
}

// ── Max room capacity ──────────────────────────────────────────────────────────

/**
 * Maximum occupants in a single room before overflow cascade triggers.
 * Matches the largest size used by optimalRoomSizes (5-person rooms).
 */
export const MAX_ROOM_CAPACITY = 5;

// ── Sorting helpers ───────────────────────────────────────────────────────────

/** Compare two participants: age ascending, then alphabetical (surname + name). */
export function participantComparator(a, b) {
  const ageA = calcAge(a.birthDate) ?? Infinity;
  const ageB = calcAge(b.birthDate) ?? Infinity;
  if (ageA !== ageB) return ageA - ageB;
  const nameA = `${a.firstSurname ?? ""} ${a.firstName ?? ""}`.trim().toLowerCase();
  const nameB = `${b.firstSurname ?? ""} ${b.firstName ?? ""}`.trim().toLowerCase();
  return nameA.localeCompare(nameB);
}

// ── Main grouping ─────────────────────────────────────────────────────────────

/**
 * Groups an array of participants by (sex, ageBucket).
 *
 * @param {Array}  participants  - TourParticipant objects with birthDate
 * @param {object} options
 * @param {Array}  options.ageBuckets    - age bucket definitions
 * @param {Map}    options.sexOverrides  - Map<participantId, 'M'|'F'|'UNKNOWN'>
 * @returns {Array<GroupBucket>}
 *   GroupBucket: { key, sex, sexLabel, ageBucketLabel, participants, label }
 */
export function computeGroups(
  participants,
  { ageBuckets = DEFAULT_AGE_BUCKETS, sexOverrides = new Map() } = {}
) {
  const map = new Map();

  for (const p of participants) {
    const sex = p.sex || sexOverrides.get(p.id) || "UNKNOWN";
    const age = calcAge(p.birthDate);
    const bucket = getAgeBucket(age, ageBuckets);
    const ageLabel = bucket ? bucket.label : "Sin edad";
    const key = `${sex}||${ageLabel}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        sex,
        sexLabel: SEX_CONFIG[sex]?.label || "Sin sexo",
        ageBucketLabel: ageLabel,
        participants: [],
        label: `${SEX_CONFIG[sex]?.label || "Sin sexo"} · ${ageLabel}`,
      });
    }
    map.get(key).participants.push(p);
  }

  // Sort participants within each bucket: age ascending, then alphabetical
  for (const bucket of map.values()) {
    bucket.participants.sort(participantComparator);
  }

  // Sort buckets: M → F → OTHER → UNKNOWN; within same sex by age bucket label
  const sexOrder = { M: 0, F: 1, OTHER: 2, UNKNOWN: 3 };
  return Array.from(map.values()).sort((a, b) => {
    const sexDiff = (sexOrder[a.sex] ?? 9) - (sexOrder[b.sex] ?? 9);
    if (sexDiff !== 0) return sexDiff;
    return a.ageBucketLabel.localeCompare(b.ageBucketLabel);
  });
}

// ── Room-size assignment ──────────────────────────────────────────────────────

/**
 * Given a count of people, calculate the optimal mix of rooms of sizes 5, 4 and 3
 * that uses the fewest rooms while accommodating everyone.
 * Strategy: fill as many 5-person rooms as possible, then 4-person, then 3-person.
 *
 * Returns an ordered array of capacities, e.g. [5, 5, 4] for 14 people.
 */
export function optimalRoomSizes(count) {
  if (count <= 0) return [];

  const maxFives = Math.ceil(count / 5);
  for (let fives = maxFives; fives >= 0; fives--) {
    const remaining = count - fives * 5;
    if (remaining < 0) continue;

    const maxFours = Math.ceil(remaining / 4);
    for (let fours = maxFours; fours >= 0; fours--) {
      const leftover = remaining - fours * 4;
      if (leftover < 0) continue;
      if (leftover === 0) {
        return [
          ...Array(fives).fill(5),
          ...Array(fours).fill(4),
        ];
      }
      if (leftover % 3 === 0) {
        const threes = leftover / 3;
        return [
          ...Array(fives).fill(5),
          ...Array(fours).fill(4),
          ...Array(threes).fill(3),
        ];
      }
    }
  }

  // Fallback
  const rooms = [];
  let left = count;
  while (left > 0) {
    const size = Math.min(left, 3);
    rooms.push(size);
    left -= size;
  }
  return rooms;
}

/**
 * Split participants into room suggestions following the 5→4→3 capacity rule.
 * Participants are expected to already be sorted (age asc, then alpha).
 *
 * @param {Array}  participants  - already-sorted list
 * @param {object} options
 * @param {string} options.prefix  - room name prefix, e.g. "M-15-17"
 * @returns {Array<RoomSuggestion>}
 *   RoomSuggestion: { index, name, capacity, participants }
 */
export function suggestRoomsFromGroup(participants, { prefix = "" } = {}) {
  if (!participants || participants.length === 0) return [];

  const sizes = optimalRoomSizes(participants.length);
  const rooms = [];
  let offset = 0;

  sizes.forEach((size, i) => {
    rooms.push({
      index: i + 1,
      name: prefix ? `${prefix}-${i + 1}` : `${i + 1}`,
      capacity: size,
      participants: participants.slice(offset, offset + size),
    });
    offset += size;
  });

  return rooms;
}

// ── Staff mixed-room assignment ───────────────────────────────────────────────

/**
 * Assign staff members to rooms. Staff may be mixed-sex.
 * Follows the same 5→4→3 size rule, sorted by age then alpha.
 */
export function suggestStaffRooms(staffParticipants) {
  if (!staffParticipants || staffParticipants.length === 0) return [];
  const sorted = [...staffParticipants].sort(participantComparator);
  return suggestRoomsFromGroup(sorted, { prefix: "STAFF" });
}

// ── Full assignment pipeline ──────────────────────────────────────────────────

/**
 * Top-level function: given all participants, produce a full room assignment.
 *
 * Rules enforced:
 *  1. Staff are grouped together regardless of sex (mixed allowed).
 *  2. Non-staff are split by sex first (M / F / UNKNOWN).
 *  3. Within each sex group, participants are sorted by age then alphabetically.
 *  4. Adults (18+) are NOT mixed with minors, UNLESS the age gap is within
 *     ADULT_MINOR_SOFT_BORDER_YEARS (e.g. a 17-year-old may room with 18-year-olds).
 *  5. Rooms are filled 5→4→3 persons.
 *  6. All ages computed as of TOUR_REFERENCE_DATE.
 */
export function assignRooms(
  participants,
  { sexOverrides = new Map(), ageBuckets = DEFAULT_AGE_BUCKETS } = {}
) {
  const staff  = participants.filter((p) => p.isStaff);
  const guests = participants.filter((p) => !p.isStaff);

  // ── Staff ──
  const staffRooms = suggestStaffRooms(staff);

  // ── Guests: split by sex, then by age-compatibility ──
  const bySex = new Map();
  for (const p of guests) {
    const sex = p.sex || sexOverrides.get(p.id) || "UNKNOWN";
    if (!bySex.has(sex)) bySex.set(sex, []);
    bySex.get(sex).push(p);
  }

  const guestRooms = new Map();

  for (const [sex, group] of bySex) {
    const sorted = [...group].sort(participantComparator);

    // Partition into age-compatible sub-groups.
    // The ONLY hard cut is the adult/minor threshold (18 years).
    // Differences within minors (e.g. age 10 vs 14) are fine — they stay together.
    const subGroups = [];
    let current = [];

    for (const p of sorted) {
      const age = calcAge(p.birthDate);

      if (current.length === 0) {
        current.push(p);
        continue;
      }

      const oldestAge = calcAge(current[current.length - 1].birthDate);

      const hardConflict =
        age !== null &&
        oldestAge !== null &&
        (age >= 18) !== (oldestAge >= 18) &&
        !isSoftAdultBorder(age, oldestAge);

      if (hardConflict) {
        subGroups.push(current);
        current = [p];
      } else {
        current.push(p);
      }
    }
    if (current.length > 0) subGroups.push(current);

    const sexShort = SEX_CONFIG[sex]?.short || "X";
    const allRooms = [];
    let roomCounter = 1;

    for (const sg of subGroups) {
      const ageTag = (() => {
        const ages = sg.map((p) => calcAge(p.birthDate)).filter((a) => a !== null);
        if (ages.length === 0) return "X";
        const min = Math.min(...ages);
        const max = Math.max(...ages);
        return min === max ? `${min}` : `${min}-${max}`;
      })();

      const prefix = `${sexShort}-${ageTag}`;
      const rooms  = suggestRoomsFromGroup(sg, { prefix });

      rooms.forEach((r) => {
        r.index = roomCounter++;
        r.name  = `${prefix}-${r.index}`;
        allRooms.push(r);
      });
    }

    guestRooms.set(sex, allRooms);
  }

  // ── Warnings ──
  const warnings = [];
  for (const [, rooms] of guestRooms) {
    for (const room of rooms) {
      const w = roomWarnings(room.participants, sexOverrides, ageBuckets);
      if (w.length) warnings.push({ room: room.name, issues: w });
    }
  }

  return { staffRooms, guestRooms, warnings };
}

// ── Utility ───────────────────────────────────────────────────────────────────

/** Generate a room prefix code from a group. e.g. sex=M age=15-17 → "M-15-17" */
export function groupRoomPrefix(group) {
  const sexShort = SEX_CONFIG[group.sex]?.short || "X";
  const ageShort = group.ageBucketLabel
    .replace(/[^0-9+]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${sexShort}-${ageShort}`;
}

/** Infer roomType from capacity. */
export function capacityToRoomType(n) {
  if (n <= 1) return "SINGLE";
  if (n === 2) return "DOUBLE";
  if (n === 3) return "TRIPLE";
  if (n === 4) return "QUAD";
  return "SUITE";
}

// ── Rebalancing engine ────────────────────────────────────────────────────────

/**
 * Compute the minimal set of backend operations needed to:
 *   1. Move participantId from fromRoomId → toRoomId (primary move).
 *   2. Cascade overflow if the destination room now exceeds maxCapacity.
 *   3. Update capacity fields on all affected rooms so capacity = occupantCount.
 *
 * Returns an array of ops:
 *   { type: 'remove'|'assign'|'updateCapacity', roomId, participantId?, capacity? }
 *
 * Cascade rules:
 *  - When room R overflows, the "last" occupant (oldest → alphabetical) is pushed
 *    to the next compatible room in sorted order (youngest-first sort).
 *  - "Compatible" means same dominant sex (or empty / UNKNOWN room).
 *  - Staff participants are compatible with any room.
 *  - Cascade stops when the receiving room does not overflow, or no compatible
 *    next room exists (capacity will simply expand past maxCapacity).
 *
 * @param {object} params
 * @param {Array}  params.rooms           - rooms from backend (with occupants)
 * @param {string} params.participantId   - participant being moved
 * @param {string|null} params.fromRoomId - source room (null = currently unassigned)
 * @param {string|null} params.toRoomId   - destination room (null = unassign)
 * @param {Map}    params.sexOverrides    - Map<id, 'M'|'F'|'UNKNOWN'>
 * @param {Array}  params.allParticipants - full participant list (for isStaff, sex)
 * @param {number} [params.maxCapacity]   - overflow threshold (default MAX_ROOM_CAPACITY)
 */
export function computeRebalanceOps({
  rooms,
  participantId,
  fromRoomId,
  toRoomId,
  sexOverrides = new Map(),
  allParticipants = [],
  maxCapacity = MAX_ROOM_CAPACITY,
}) {
  const ops = [];

  // ── Clone rooms into mutable local structures ───────────────────────────────
  const roomMap = new Map(
    rooms.map((r) => [
      r.id,
      {
        id: r.id,
        capacity: r.capacity,
        occupants: [...(r.occupants || [])],
      },
    ])
  );

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getSex = (p) =>
    p?.sex || sexOverrides.get(p?.id) || "UNKNOWN";

  const isStaff = (pId) =>
    allParticipants.find((x) => x.id === pId)?.isStaff === true;

  /** Dominant sex of a room's current (simulated) occupants. null = empty. */
  const getRoomDominantSex = (roomId) => {
    const room = roomMap.get(roomId);
    if (!room || room.occupants.length === 0) return null;
    const sexes = [
      ...new Set(
        room.occupants
          .map((o) => getSex(o.participant || o))
          .filter((s) => s !== "UNKNOWN")
      ),
    ];
    if (sexes.length === 0) return "UNKNOWN";
    if (sexes.length === 1) return sexes[0];
    return "MIXED";
  };

  /** Returns true if pId can be placed in roomId (sex compatibility). */
  const canGoToRoom = (pId, roomId) => {
    if (isStaff(pId)) return true; // staff always ok
    const p = allParticipants.find((x) => x.id === pId);
    const pSex = getSex(p || { id: pId });
    if (pSex === "UNKNOWN") return true;
    const roomSex = getRoomDominantSex(roomId);
    if (!roomSex || roomSex === "UNKNOWN") return true;
    return pSex === roomSex;
  };

  /** Sort roomMap values by youngest occupant age (mirrors UI display order). */
  const getSortedRoomList = () =>
    [...roomMap.values()].sort((a, b) => {
      const minAge = (r) => {
        if (r.occupants.length === 0) return Infinity;
        const ages = r.occupants
          .map((o) => calcAge((o.participant || o).birthDate))
          .filter((a) => a !== null);
        return ages.length > 0 ? Math.min(...ages) : Infinity;
      };
      return minAge(a) - minAge(b);
    });

  // ── Primary move ────────────────────────────────────────────────────────────
  if (fromRoomId && roomMap.has(fromRoomId)) {
    const fromRoom = roomMap.get(fromRoomId);
    fromRoom.occupants = fromRoom.occupants.filter(
      (o) => (o.participant || o).id !== participantId
    );
    ops.push({ type: "remove", roomId: fromRoomId, participantId });
  }

  if (toRoomId && roomMap.has(toRoomId)) {
    const toRoom = roomMap.get(toRoomId);
    const pObj = allParticipants.find((p) => p.id === participantId);
    toRoom.occupants.push({ participant: pObj || { id: participantId } });
    ops.push({ type: "assign", roomId: toRoomId, participantId });

    // ── Cascade overflow ────────────────────────────────────────────────────
    let currentRoomId = toRoomId;
    let safetyLimit = 30;

    while (safetyLimit-- > 0) {
      const currentRoom = roomMap.get(currentRoomId);
      if (!currentRoom || currentRoom.occupants.length <= maxCapacity) break;

      // Last occupant = oldest / alphabetically last (push them forward)
      const sorted = [...currentRoom.occupants].sort((a, b) =>
        participantComparator(a.participant || a, b.participant || b)
      );
      const overflowEntry = sorted[sorted.length - 1];
      const overflowPId = (overflowEntry.participant || overflowEntry).id;

      // Find next compatible room in sorted order
      const sortedRooms = getSortedRoomList();
      const currentIdx = sortedRooms.findIndex((r) => r.id === currentRoomId);
      let nextRoom = null;
      for (let i = currentIdx + 1; i < sortedRooms.length; i++) {
        if (canGoToRoom(overflowPId, sortedRooms[i].id)) {
          nextRoom = roomMap.get(sortedRooms[i].id);
          break;
        }
      }

      if (!nextRoom) break; // no compatible room — capacity will expand

      // Simulate move of overflow participant
      currentRoom.occupants = currentRoom.occupants.filter(
        (o) => (o.participant || o).id !== overflowPId
      );
      nextRoom.occupants.push(overflowEntry);
      ops.push({ type: "remove", roomId: currentRoomId, participantId: overflowPId });
      ops.push({ type: "assign", roomId: nextRoom.id, participantId: overflowPId });

      currentRoomId = nextRoom.id;
    }
  }

  // ── Capacity sync for all affected rooms ────────────────────────────────────
  const affectedRoomIds = new Set(ops.map((op) => op.roomId));
  for (const roomId of affectedRoomIds) {
    const room = roomMap.get(roomId);
    if (room) {
      const newCap = Math.max(1, room.occupants.length);
      if (newCap !== room.capacity) {
        ops.push({ type: "updateCapacity", roomId, capacity: newCap });
      }
    }
  }

  return ops;
}

// ── Rooming list export ───────────────────────────────────────────────────────

/**
 * Build a structured rooming-list dataset suitable for export to the hotel.
 *
 * Returns rooms sorted by hotel name then room number, each with:
 *   { id, hotelName, roomNumber, roomType, capacity, floor, notes,
 *     occupants: [{ id, name, firstName, firstSurname, secondSurname,
 *                   age, birthDate, sex, isStaff, instrument, role }],
 *     warnings: roomWarnings() result }
 *
 * Age rules enforced in `warnings`:
 *  - mixed_sex: men and women in same room (except staff rooms)
 *  - mixed_age: adult (18+) with minor without soft border
 *  - unknown_sex: participant with unknown sex
 */
export function generateRoomingListData(rooms, allParticipants = [], sexOverrides = new Map()) {
  const participantMap = new Map((allParticipants || []).map((p) => [p.id, p]));

  const data = rooms.map((room) => {
    const occupants = (room.occupants || []).map((o) => {
      const p = o.participant || o;
      const full = participantMap.get(p.id) || p;
      const age = calcAge(p.birthDate);
      const sex = p.sex || sexOverrides.get(p.id) || "UNKNOWN";
      return {
        id: p.id,
        name: [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" "),
        firstName: p.firstName,
        firstSurname: p.firstSurname,
        secondSurname: p.secondSurname,
        age,
        birthDate: p.birthDate,
        sex,
        isStaff: full.isStaff || false,
        instrument: full.instrument || p.instrument || null,
        role: full.role || p.role || null,
      };
    });

    const warnings = roomWarnings(room.occupants, sexOverrides);

    return {
      id: room.id,
      hotelName: room.hotelName || "Sin hotel",
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      capacity: room.capacity,
      floor: room.floor,
      notes: room.notes,
      occupants,
      warnings,
    };
  });

  // Sort: hotel alphabetically, then room number
  return data.sort((a, b) => {
    const h = (a.hotelName || "").localeCompare(b.hotelName || "");
    if (h !== 0) return h;
    return (a.roomNumber || "").localeCompare(b.roomNumber || "");
  });
}

/**
 * Warn about room composition issues.
 * Returns array of { type: 'mixed_sex'|'mixed_age'|'mixed_age_soft'|'unknown_sex', label }
 */
export function roomWarnings(
  occupants,
  sexOverrides = new Map(),
  ageBuckets = DEFAULT_AGE_BUCKETS
) {
  const warnings = [];
  if (!occupants || occupants.length < 2) return warnings;

  const sexes = new Set(
    occupants.map((o) => {
      const p = o.participant || o;
      return p.sex || sexOverrides.get(p.id) || "UNKNOWN";
    })
  );
  const ages = occupants.map((o) => {
    const p = o.participant || o;
    return calcAge(p.birthDate);
  });
  const ageBucketLabels = new Set(
    ages.map((age) => {
      const bucket = getAgeBucket(age, ageBuckets);
      return bucket ? bucket.label : "Sin edad";
    })
  );

  if (sexes.has("UNKNOWN"))
    warnings.push({ type: "unknown_sex", label: "Sexo desconocido" });

  const knownSexes = [...sexes].filter((s) => s !== "UNKNOWN");
  if (knownSexes.length > 1)
    warnings.push({ type: "mixed_sex", label: "Sexo mixto" });

  if (ageBucketLabels.size > 1) {
    const knownAges = ages.filter((a) => a !== null);
    const hasHardConflict = knownAges.some((ageA) =>
      knownAges.some(
        (ageB) =>
          ageA !== ageB &&
          (ageA >= 18) !== (ageB >= 18) &&
          !isSoftAdultBorder(ageA, ageB)
      )
    );
    if (hasHardConflict)
      warnings.push({ type: "mixed_age", label: "Adultos con menores (conflicto)" });
    else
      warnings.push({ type: "mixed_age_soft", label: "Edades mixtas (frontera suave)" });
  }

  return warnings;
}