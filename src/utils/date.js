export function convertDateEsToIso(str) {
  if (!str || typeof str !== "string") return null;

  const months = {
    enero: "01",
    febrero: "02",
    marzo: "03",
    abril: "04",
    mayo: "05",
    junio: "06",
    julio: "07",
    agosto: "08",
    septiembre: "09",
    octubre: "10",
    noviembre: "11",
    diciembre: "12",
  };

  const parts = str.split(" ");
  if (parts.length < 5) return null;

  const day = String(parts[0] || "").padStart(2, "0");
  const monthKey = parts[2];
  const year = parts[4];

  const month = months[monthKey];
  if (!month || !year) return null;

  return `${year}-${month}-${day}`;
}

export function calculateAgeFromBirthdayEs(birthdayStr) {
  const iso = convertDateEsToIso(birthdayStr);
  if (!iso) return "N/A";

  const birthday = new Date(iso);
  if (Number.isNaN(birthday.getTime())) return "N/A";

  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDifference = today.getMonth() - birthday.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }

  if (age < 0 || age > 120) return "N/A";
  return age;
}

// ===========================
// DATE UTILITIES
// ===========================

/**
 * Check if product is available based on closingDate
 */
export function isProductAvailable(closingDate) {
  const closing = toDate(closingDate);
  if (!closing) return true;
  return closing.getTime() > Date.now();
}

/**
 * Get time remaining until closing
 * Returns: { hours, minutes, isPastClosing }
 */
export function getTimeUntilClosing(closingDate) {
  const closing = toDate(closingDate);
  if (!closing) return null;

  const diff = closing.getTime() - Date.now();

  if (diff <= 0) return { hours: 0, minutes: 0, isPastClosing: true };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, isPastClosing: false };
}

/**
 * Format closing time message
 */
export function getClosingMessage(closingDate) {
  if (!closingDate) return "Disponible";

  const timeInfo = getTimeUntilClosing(closingDate);

  if (!timeInfo) return "Disponible";

  if (timeInfo.isPastClosing) {
    return "Cerrado";
  }

  if (timeInfo.hours === 0 && timeInfo.minutes < 60) {
    return `Cierra en ${timeInfo.minutes}min`;
  }

  if (timeInfo.hours < 24) {
    return `Cierra en ${timeInfo.hours}h`;
  }

  return "Disponible";
}

/**
 * Format date for display
 */
export function formatOrderDate(dateValue) {
  const date = toDate(dateValue);
  if (!date) return "Fecha inválida";

  return date.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDate(value) {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    const s = value.trim();

    if (/^\d+$/.test(s)) {
      const n = Number(s);
      const ms = s.length === 10 ? n * 1000 : n;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // ISO u otros formatos parseables
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Mongo Extended JSON
  if (typeof value === "object") {
    if ("$date" in value) return toDate(value.$date);
    if ("$numberLong" in value) return toDate(value.$numberLong);
  }

  return null;
}
