/**
 * roomGrouping.js
 * Frontend-only grouping engine for tour room planning.
 * Groups participants by sex + age bucket, suggests room splits.
 *
 * Sex is persisted on TourParticipant (participant.sex).
 * sexOverrides Map is derived from participant data and passed as a convenience.
 */

// ── Age buckets ───────────────────────────────────────────────────────────────

export const DEFAULT_AGE_BUCKETS = [
  { label: "0–11", min: 0, max: 11 },
  { label: "12–14", min: 12, max: 14 },
  { label: "15–17", min: 15, max: 17 },
  { label: "18+", min: 18, max: Infinity },
];

export const SEX_CONFIG = {
  M: { label: "Hombres", short: "M", color: "bg-blue-100 text-blue-700 border-blue-200" },
  F: { label: "Mujeres", short: "F", color: "bg-pink-100 text-pink-700 border-pink-200" },
  // OTHER: { label: "Otro", short: "O", color: "bg-violet-100 text-violet-700 border-violet-200" },
  UNKNOWN: { label: "Sin sexo", short: "?", color: "bg-gray-100 text-gray-500 border-gray-200" },
};

// Cycle sex values on click: UNKNOWN → M → F → OTHER → UNKNOWN
export const SEX_CYCLE = ["UNKNOWN", "M", "F"];
export function nextSex(current) {
  const idx = SEX_CYCLE.indexOf(current || "UNKNOWN");
  return SEX_CYCLE[(idx + 1) % SEX_CYCLE.length];
}

// ── Age helpers ───────────────────────────────────────────────────────────────

export function calcAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age < 0 ? 0 : age;
}

export function getAgeBucket(age, buckets = DEFAULT_AGE_BUCKETS) {
  if (age === null || age === undefined) return null;
  return buckets.find((b) => age >= b.min && age <= b.max) || null;
}

// ── Main grouping ─────────────────────────────────────────────────────────────

/**
 * Groups an array of participants by (sex, ageBucket).
 *
 * @param {Array}  participants  - TourParticipant objects with birthDate
 * @param {object} options
 * @param {Array}  options.ageBuckets    - age bucket definitions
 * @param {Map}    options.sexOverrides  - Map<participantId, 'M'|'F'|'OTHER'|null>
 * @returns {Array<GroupBucket>}
 *   GroupBucket: { key, sex, sexLabel, ageBucketLabel, participants, label }
 */
export function computeGroups(
  participants,
  { ageBuckets = DEFAULT_AGE_BUCKETS, sexOverrides = new Map() } = {}
) {
  const map = new Map();

  for (const p of participants) {
    // Prefer persisted sex on the participant object, fall back to override Map
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

  // Sort participants within each bucket: surname then first name
  for (const bucket of map.values()) {
    bucket.participants.sort((a, b) => {
      const nameA = `${a.firstSurname} ${a.firstName}`.toLowerCase();
      const nameB = `${b.firstSurname} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  // Sort buckets: known sex first (M, F, OTHER), then UNKNOWN; within same sex by age
  const sexOrder = { M: 0, F: 1, OTHER: 2, UNKNOWN: 3 };
  return Array.from(map.values()).sort((a, b) => {
    const sexDiff = (sexOrder[a.sex] ?? 9) - (sexOrder[b.sex] ?? 9);
    if (sexDiff !== 0) return sexDiff;
    return a.ageBucketLabel.localeCompare(b.ageBucketLabel);
  });
}

/**
 * Split participants in a group into room suggestions of size <= capacity.
 *
 * @param {Array}  participants
 * @param {number} capacity
 * @returns {Array<{ index, participants }>}
 */
export function suggestRoomsFromGroup(participants, capacity) {
  const rooms = [];
  let i = 0;
  let idx = 1;
  while (i < participants.length) {
    rooms.push({ index: idx++, participants: participants.slice(i, i + capacity) });
    i += capacity;
  }
  return rooms;
}

/**
 * Generate a room prefix code from a group.
 * e.g. sex=M age=15-17 → "M-15-17"
 */
export function groupRoomPrefix(group) {
  const sexShort = SEX_CONFIG[group.sex]?.short || "X";
  const ageShort = group.ageBucketLabel
    .replace(/[^0-9+]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${sexShort}-${ageShort}`;
}

/**
 * Infer roomType from capacity.
 */
export function capacityToRoomType(n) {
  if (n <= 1) return "SINGLE";
  if (n === 2) return "DOUBLE";
  if (n === 3) return "TRIPLE";
  if (n === 4) return "QUAD";
  return "SUITE";
}

/**
 * Warn about room composition issues.
 * Returns array of { type: 'mixed_sex'|'mixed_age'|'unknown_sex', label }
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
      // Prefer persisted sex on the participant, fall back to override Map
      return p.sex || sexOverrides.get(p.id) || "UNKNOWN";
    })
  );
  const ages = new Set(
    occupants.map((o) => {
      const p = o.participant || o;
      const age = calcAge(p.birthDate);
      const bucket = getAgeBucket(age, ageBuckets);
      return bucket ? bucket.label : "Sin edad";
    })
  );

  if (sexes.has("UNKNOWN")) warnings.push({ type: "unknown_sex", label: "Sexo desconocido" });
  const knownSexes = [...sexes].filter((s) => s !== "UNKNOWN");
  if (knownSexes.length > 1) warnings.push({ type: "mixed_sex", label: "Sexo mixto" });
  if (ages.size > 1) warnings.push({ type: "mixed_age", label: "Edades mixtas" });

  return warnings;
}
