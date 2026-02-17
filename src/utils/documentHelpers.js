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
    CAPTURE_ACCEPTED: "sky",
    OCR_PENDING: "yellow",
    OCR_PROCESSING: "amber",
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
    CAPTURE_ACCEPTED: "Captura Aceptada",
    OCR_PENDING: "OCR Pendiente",
    OCR_PROCESSING: "Procesando OCR",
    OCR_SUCCESS: "OCR Exitoso",
    OCR_FAILED: "OCR Fallido",
    VERIFIED: "Verificado",
    REJECTED: "Rechazado",
  };

  return labels[status] || status;
}

const TYPE_LABELS = {
  PASSPORT: "Pasaporte",
  VISA: "Visa",
  PERMISO_SALIDA: "Permiso de Salida",
  OTHER: "Otro Documento",
};

const TYPE_ICONS = {
  PASSPORT: "\u{1F6C2}",
  VISA: "\u2708\uFE0F",
  PERMISO_SALIDA: "\u{1F4C4}",
  OTHER: "\u{1F4CE}",
};

/**
 * Retorna tipo legible
 */
export function getDocumentTypeLabel(type) {
  return TYPE_LABELS[type] || type;
}

/**
 * Retorna icono del tipo de documento
 */
export function getDocumentTypeIcon(type) {
  return TYPE_ICONS[type] || "\u{1F4C4}";
}

/**
 * Statuses that indicate OCR is still in progress
 */
export const OCR_POLLING_STATUSES = new Set([
  "CAPTURE_ACCEPTED",
  "OCR_PENDING",
  "OCR_PROCESSING",
]);

/**
 * Terminal statuses where polling should stop
 */
export const OCR_TERMINAL_STATUSES = new Set([
  "OCR_SUCCESS",
  "OCR_FAILED",
  "VERIFIED",
  "REJECTED",
]);
