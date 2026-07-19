export const EXPIRY_WARNING_DAYS = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_RE.test(String(email || "").trim());
}

export function isDocumentCurrent(expiryDate, warningDays = EXPIRY_WARNING_DAYS) {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return false;
  const daysUntil = Math.floor((expiry.getTime() - Date.now()) / 86400000);
  return daysUntil > warningDays;
}

export function requiresVisaForNationality(nationality) {
  const normalized = String(nationality || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
  if (!normalized) return true;
  return ["CRI", "CR", "COSTA RICA", "COSTARRICENSE"].includes(normalized);
}

export function computeVerificationCriteria(participant = {}, nationality) {
  const visaRequired = requiresVisaForNationality(nationality);
  const criteria = {
    firstName: Boolean(String(participant.firstName || "").trim()),
    firstSurname: Boolean(String(participant.firstSurname || "").trim()),
    identification: Boolean(String(participant.identification || "").trim()),
    email: isValidEmail(participant.email),
    passport: Boolean(participant.passportNumber) && isDocumentCurrent(participant.passportExpiry),
    visa:
      !visaRequired ||
      (participant.hasVisa === true && isDocumentCurrent(participant.visaExpiry)),
  };
  return { criteria, passed: Object.values(criteria).every(Boolean), visaRequired };
}
