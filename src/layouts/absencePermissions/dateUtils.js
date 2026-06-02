export function parsePermissionDate(value) {
  if (!value) return null;
  const date = /^\d+$/.test(String(value))
    ? new Date(Number(value))
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatPermissionDate(value, options = {}) {
  const date = parsePermissionDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
}
