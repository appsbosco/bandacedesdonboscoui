// src/utils/constants.js

/**
 * Compute the scan guide rectangle for a given document aspect ratio
 * and screen dimensions. The guide fills ~85% of the narrowest screen
 * axis, centered, always landscape-oriented.
 */
export function computeScanArea(docAspectRatio = 1.42, screenW = 1, screenH = 1) {
  const screenRatio = screenW / screenH;
  // Target: guide is 85% of the width on portrait screens
  const guideWidthPct = screenRatio < 1 ? 0.88 : 0.75;
  const guideWidth = guideWidthPct;
  const guideHeight = guideWidth / docAspectRatio / (screenRatio || 1);

  // Clamp height to max 55% of screen
  const clampedHeight = Math.min(guideHeight, 0.55);
  const clampedWidth = clampedHeight > guideHeight ? guideWidth : guideWidth * (clampedHeight / guideHeight);

  return {
    x: (1 - clampedWidth) / 2,
    y: (1 - clampedHeight) / 2,
    width: clampedWidth,
    height: clampedHeight,
  };
}

export const SCANNER_CONFIG = {
  // Default scan area; overridden at runtime by computeScanArea()
  scanArea: { x: 0.05, y: 0.25, width: 0.9, height: 0.5 },
  analysisFPS: 8,
  analysisResolution: 400,
  warmupTime: 2000,
  stabilityTime: 800,
  minConsecutiveFrames: 5,
  streakFrames: 10,
  captureThreshold: 0.85,
  autoCaptureThreshold: 0.9,
  mrzMinConfidence: 0.8,
  aspectRatios: { PASSPORT: 1.42, VISA: 1.42, ID_CARD: 1.58, TRAVEL_PERMIT: 1.41, OTHER: 1.5 },
};

export const SCANNER_MESSAGES = {
  initializing: "Iniciando cámara...",
  ready: "Coloca el documento en el marco",
  focusing: "Enfocando...",
  capturing: "Capturando...",
  success: "¡Captura exitosa!",
  error: "Error al capturar",
  processing: "Procesando documento...",
  mrzFailed: "No se pudo leer el documento. Intenta de nuevo.",
  mrzLowConfidence: "La lectura del documento tiene baja confianza. Escanea de nuevo.",
};

export const DOCUMENT_TYPES = {
  // PASSPORT: {
  //   id: "PASSPORT",
  //   label: "Pasaporte",
  //   description: "Documento de viaje internacional con MRZ",
  //   icon: "\u{1F6C2}",
  //   requiresMRZ: true,
  //   aspectRatio: 1.42,
  //   mrzLines: 2,
  //   color: "blue",
  // },
  // VISA: {
  //   id: "VISA",
  //   label: "Visa",
  //   description: "Visa de viaje o permiso de entrada",
  //   icon: "\u2708\uFE0F",
  //   requiresMRZ: true,
  //   aspectRatio: 1.42,
  //   mrzLines: 2,
  //   color: "purple",
  // },
  // PERMISO_SALIDA: {
  //   id: "PERMISO_SALIDA",
  //   label: "Permiso de Salida",
  //   description: "Permiso de viaje para menores",
  //   icon: "\u{1F4C4}",
  //   requiresMRZ: false,
  //   aspectRatio: 1.41,
  //   mrzLines: 0,
  //   color: "orange",
  // },
  OTHER: {
    id: "OTHER",
    label: "Otro documento",
    description: "Otro tipo de documento",
    icon: "\u{1F4CE}",
    requiresMRZ: false,
    aspectRatio: 1.5,
    mrzLines: 0,
    color: "gray",
  },
};

export const DOCUMENT_STATUSES = {
  PENDING: { label: "Pendiente", color: "yellow", icon: "clock" },
  APPROVED: { label: "Aprobado", color: "green", icon: "check" },
  REJECTED: { label: "Rechazado", color: "red", icon: "x" },
  EXPIRED: { label: "Expirado", color: "gray", icon: "alert" },
  EXPIRING_SOON: { label: "Por vencer", color: "orange", icon: "alert" },
};

export const QUALITY_THRESHOLDS = {
  focus: { min: 0.3, good: 0.5 },
  brightness: { min: 80, max: 200, optimal: 140 },
  glare: { maxPercent: 0.03 },
  alignment: { min: 0.6 },
};

export const SCORING_WEIGHTS = {
  insideScore: 0.4,
  rotationScore: 0.25,
  perspectiveScore: 0.25,
  stabilityScore: 0.1,
};

export const HINT_MESSAGES = {
  tooFar: "Acércate al documento",
  tooClose: "Aléjate del documento",
  outsideFrame: "Coloca el documento dentro del recuadro",
  rotated: "Endereza el documento",
  perspective: "Alinea de frente el documento",
  unstable: "Mantén la cámara quieta",
  noDocument: "Coloca el documento dentro del recuadro",
};

export function getDocumentTypeInfo(type) {
  return DOCUMENT_TYPES[type?.toUpperCase()] || DOCUMENT_TYPES.OTHER;
}

export function getStatusInfo(status) {
  return DOCUMENT_STATUSES[status?.toUpperCase()] || DOCUMENT_STATUSES.PENDING;
}

export function getExpirationStatus(expirationDate) {
  if (!expirationDate) return null;
  const now = new Date();
  const expDate = new Date(expirationDate);
  const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)
    return { status: "EXPIRED", label: "Expirado", color: "red", daysUntil: diffDays };
  if (diffDays <= 30)
    return {
      status: "EXPIRING_SOON",
      label: `Vence en ${diffDays} días`,
      color: "orange",
      daysUntil: diffDays,
    };
  if (diffDays <= 90)
    return {
      status: "EXPIRING",
      label: `Vence en ${diffDays} días`,
      color: "yellow",
      daysUntil: diffDays,
    };
  return { status: "VALID", label: "Vigente", color: "green", daysUntil: diffDays };
}

export default {
  SCANNER_CONFIG,
  SCANNER_MESSAGES,
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  QUALITY_THRESHOLDS,
  SCORING_WEIGHTS,
  HINT_MESSAGES,
  getDocumentTypeInfo,
  getStatusInfo,
  getExpirationStatus,
};
