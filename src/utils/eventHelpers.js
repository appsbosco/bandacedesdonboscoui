// ─────────────────────────────────────────────────────────────────────────────
// utils/eventHelpers.js  (export from same file for convenience)
// ─────────────────────────────────────────────────────────────────────────────
import fallbackCover from "assets/images/about.webp";
import bandaAvanzadaImg from "assets/images/Banda Avanzada.webp";
import bandaInicialImg from "assets/images/Banda Inicial.webp";
import bandaIntermediaImg from "assets/images/BandaIntermedia.webp";
import bigBandAImg from "assets/images/BigBandA.webp";
import bigBandBImg from "assets/images/BigBandB.webp";

const IMAGE_MAP = {
  "Big Band B": bigBandBImg,
  "Big Band A": bigBandAImg,
  "Banda de concierto intermedia": bandaIntermediaImg,
  "Banda de concierto inicial": bandaInicialImg,
  "Banda de concierto avanzada": bandaAvanzadaImg,
};

/**
 * Returns the image asset for a given band/type string
 */
export function getEventImage(type) {
  const t = String(type ?? "");
  for (const [key, img] of Object.entries(IMAGE_MAP)) {
    if (t.includes(key)) return img;
  }
  return fallbackCover;
}

/**
 * Converts a time string of various formats to 12h format
 * Accepts: "14:30", "2:00pm", "2:00 PM", etc.
 */
export function normalizeTimeTo12h(time) {
  const raw = String(time ?? "").trim();
  if (!raw) return "";

  // Already 12h format?
  if (/^\d{1,2}:\d{2}\s?(am|pm)$/i.test(raw)) return raw.toLowerCase();

  // 24h format
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return raw;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const suffix = hours >= 12 ? "pm" : "am";
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes}${suffix}`;
}

/**
 * Returns a sortable ms key for an event, combining date + time
 */
export function toSortableMs(dateMs, timeStr) {
  const n = Number(dateMs);
  if (!Number.isFinite(n)) return Number.POSITIVE_INFINITY;

  const base = new Date(n);
  base.setUTCHours(0, 0, 0, 0);

  const raw = String(timeStr ?? "").trim();
  if (!raw) return base.getTime();

  const norm = normalizeTimeTo12h(raw);
  const match = norm.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!match) return base.getTime();

  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const suffix = match[3].toLowerCase();

  if (suffix === "pm" && hours !== 12) hours += 12;
  if (suffix === "am" && hours === 12) hours = 0;

  return base.getTime() + hours * 3600000 + mins * 60000;
}

/**
 * Returns a sortable numeric key for an event
 */
export function buildSortKey(event) {
  return toSortableMs(event?.date, event?.time);
}

/**
 * Filters an event array to only presentations
 */
export function filterPresentations(events) {
  return events.filter((e) => e.category === "presentation" || !e.category);
}

/**
 * Sorts events ascending by date+time
 */
export function sortEventsByDate(events) {
  return [...events].sort((a, b) => buildSortKey(a) - buildSortKey(b));
}
