/**
 * tourAgeRules.js
 * Domain helpers for age/document rules in Tours.
 * All functions are pure (no side effects, no React).
 */

export const EXPIRY_WARNING_DAYS = 60;

/**
 * Returns the reference date for adulthood computation.
 * Priority: tour.startDate → tour.departureDate → earliest flight departure → null
 */
export function getTourReferenceDate(tour, flights = []) {
  if (tour?.startDate) return new Date(tour.startDate);
  if (tour?.departureDate) return new Date(tour.departureDate);

  const flightDates = flights
    .map((f) => f.departureAt && new Date(f.departureAt))
    .filter(Boolean)
    .sort((a, b) => a - b);

  if (flightDates.length > 0) return flightDates[0];
  return null;
}

/**
 * Computes exact integer age at a given reference date.
 * Returns null if birthDate or refDate is missing/invalid.
 */
export function getAgeAtDate(birthDate, refDate) {
  if (!birthDate || !refDate) return null;
  const birth = new Date(birthDate);
  const ref = new Date(refDate);
  if (isNaN(birth.getTime()) || isNaN(ref.getTime())) return null;

  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age < 0 ? 0 : age;
}

/**
 * Returns true if participant is 18+ at refDate.
 * Defaults to false (conservative: treat as minor) if either date is null.
 */
export function isAdultAtTour(birthDate, refDate) {
  const age = getAgeAtDate(birthDate, refDate);
  if (age === null) return false;
  return age >= 18;
}

/**
 * Returns true if "Permiso de Salida" is required for this participant.
 * Adults (18+ at refDate) do NOT require it.
 * If refDate is null, defaults to required (conservative).
 */
export function isExitPermitRequired(birthDate, refDate) {
  if (!refDate) return true;
  return !isAdultAtTour(birthDate, refDate);
}

/**
 * Returns expiry status for a document date.
 * @param {string|Date|null} expirationDate
 * @param {number} warningDays
 * @returns {'expired'|'warning'|'ok'|'missing'}
 */
export function getExpiryStatus(expirationDate, warningDays = EXPIRY_WARNING_DAYS) {
  if (!expirationDate) return "missing";
  const expiry = new Date(expirationDate);
  if (isNaN(expiry.getTime())) return "missing";

  const now = new Date();
  const daysUntil = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return "expired";
  if (daysUntil <= warningDays) return "warning";
  return "ok";
}

/**
 * Days until expiry. Negative = already expired. null = no date.
 */
export function getDaysUntilExpiry(expirationDate) {
  if (!expirationDate) return null;
  const expiry = new Date(expirationDate);
  if (isNaN(expiry.getTime())) return null;
  return Math.floor((expiry - new Date()) / (1000 * 60 * 60 * 24));
}

/**
 * Computes overall document compliance status for a single participant.
 * @param {object} p - TourParticipant with doc fields
 * @param {Date|null} refDate - tour start date
 * @returns {'COMPLETE'|'INCOMPLETE'|'EXPIRED'|'EXPIRING'}
 */
export function computeParticipantDocStatus(p, refDate) {
  const passportExpiry = getExpiryStatus(p.passportExpiry);
  // Visa: si hasVisa=false → "missing" (no se puede contar como ok)
  const visaExpiry = p.hasVisa ? getExpiryStatus(p.visaExpiry) : "missing";
  const exitRequired = isExitPermitRequired(p.birthDate, refDate);

  const hasExpired = passportExpiry === "expired" || visaExpiry === "expired";
  const hasWarning = passportExpiry === "warning" || visaExpiry === "warning";
  // hasVisa=false → isMissing=true; pasaporte ausente → isMissing=true
  const isMissing =
    !p.passportNumber ||
    !p.hasVisa ||
    (exitRequired && !p.hasExitPermit);

  if (hasExpired) return "EXPIRED";
  if (isMissing) return "INCOMPLETE";
  if (hasWarning) return "EXPIRING";
  return "COMPLETE";
}
