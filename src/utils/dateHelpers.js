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
 * Formats a date ms timestamp to a readable Spanish string
 * @param {string|number} dateMs - timestamp as string or number
 * @param {"long"|"short"|"numeric"} style
 */
export function formatDateEs(dateMs, style = "long") {
  const n = Number(dateMs);
  if (!Number.isFinite(n)) return "";

  if (style === "long") {
    return new Date(n).toLocaleDateString("es-CR", {
      timeZone: "UTC",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (style === "short") {
    return new Date(n).toLocaleDateString("es-CR", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
    });
  }

  return new Date(n).toLocaleDateString("es-CR", { timeZone: "UTC" });
}

/**
 * Converts a date value (ms string, ISO string) to YYYY-MM-DD for <input type="date">
 */
export function toInputDate(dateVal) {
  if (!dateVal) return "";
  const n = Number(dateVal);
  if (Number.isFinite(n)) {
    const d = new Date(n);
    return d.toISOString().slice(0, 10);
  }
  if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
  return "";
}
