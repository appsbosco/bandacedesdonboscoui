/**
 * Enmascara número de documento para mostrar solo últimos 4 dígitos
 */
export function maskDocumentNumber(number) {
  if (!number) return "N/A";

  const str = String(number);
  if (str.length <= 4) return str;

  return "****" + str.slice(-4);
}

/**
 * Retorna badge color según status
 */
export function getStatusColor(status) {
  const colors = {
    UPLOADED: "blue",
    DATA_CAPTURED: "indigo",
    OCR_PENDING: "yellow",
    OCR_SUCCESS: "green",
    OCR_FAILED: "red",
    VERIFIED: "green",
    REJECTED: "red",
  };

  return colors[status] || "gray";
}

/**
 * Retorna label legible del status
 */
export function getStatusLabel(status) {
  const labels = {
    UPLOADED: "Subido",
    DATA_CAPTURED: "Datos Capturados",
    OCR_PENDING: "OCR Pendiente",
    OCR_SUCCESS: "OCR Exitoso",
    OCR_FAILED: "OCR Fallido",
    VERIFIED: "Verificado",
    REJECTED: "Rechazado",
  };

  return labels[status] || status;
}

/**
 * Retorna tipo legible
 */
export function getDocumentTypeLabel(type) {
  return type === "PASSPORT" ? "Pasaporte" : "Visa";
}

/**
 * Retorna icono del tipo de documento
 */
export function getDocumentTypeIcon(type) {
  return type === "PASSPORT" ? "🛂" : "✈️";
}
