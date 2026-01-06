/**
 * Formatea fecha a formato legible
 */
export function formatDate(date) {
  if (!date) return "N/A";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";

  return d.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formatea fecha completa con hora
 */
export function formatDateTime(date) {
  if (!date) return "N/A";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";

  return d.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Calcula si está expirado
 */
export function isExpired(expirationDate) {
  if (!expirationDate) return false;
  return new Date(expirationDate) < new Date();
}

/**
 * Retorna color para badge de expiración
 */
export function getExpirationColor(daysUntilExpiration, isExpired) {
  if (isExpired) return "red";
  if (daysUntilExpiration <= 30) return "orange";
  if (daysUntilExpiration <= 90) return "yellow";
  return "green";
}

/**
 * Retorna texto descriptivo de expiración
 */
export function getExpirationText(daysUntilExpiration, isExpired) {
  if (isExpired) return "Expirado";
  if (daysUntilExpiration === 0) return "Expira hoy";
  if (daysUntilExpiration === 1) return "Expira mañana";
  if (daysUntilExpiration <= 7) return `Expira en ${daysUntilExpiration} días`;
  if (daysUntilExpiration <= 30) return `Expira en ${daysUntilExpiration} días`;
  if (daysUntilExpiration <= 90) return `Expira en ${Math.round(daysUntilExpiration / 30)} meses`;
  return "Válido";
}
