// src/utils/constants.js
export const DOCUMENT_TYPES = {
  PASSPORT: {
    id: "PASSPORT",
    label: "Pasaporte",
    icon: "🛂",
    description: "Pasaporte nacional o internacional",
    hasMRZ: true,
    aspectRatio: 1.42,
  },
  // NATIONAL_ID: {
  //   id: "NATIONAL_ID",
  //   label: "Cédula de Identidad",
  //   icon: "🪪",
  //   description: "Documento de identidad nacional",
  //   hasMRZ: true,
  //   aspectRatio: 1.58,
  // },
  VISA: {
    id: "VISA",
    label: "Visa",
    icon: "✈️",
    description: "Visa de viaje o trabajo",
    hasMRZ: true,
    aspectRatio: 1.42,
  },
  // DRIVERS_LICENSE: {
  //   id: "DRIVERS_LICENSE",
  //   label: "Licencia de Conducir",
  //   icon: "🚗",
  //   description: "Licencia de conducción",
  //   hasMRZ: false,
  //   aspectRatio: 1.58,
  // },
  TRAVEL_PERMIT: {
    id: "TRAVEL_PERMIT",
    label: "Permiso de Viaje",
    icon: "📋",
    description: "Permiso o autorización de viaje",
    hasMRZ: false,
    aspectRatio: 1.42,
  },
  // RESIDENCE_PERMIT: {
  //   id: "RESIDENCE_PERMIT",
  //   label: "Permiso de Residencia",
  //   icon: "🏠",
  //   description: "Tarjeta o permiso de residencia",
  //   hasMRZ: true,
  //   aspectRatio: 1.58,
  // },
  // OTHER: {
  //   id: "OTHER",
  //   label: "Otro Documento",
  //   icon: "📄",
  //   description: "Otro tipo de documento",
  //   hasMRZ: false,
  //   aspectRatio: 1.42,
  // },
};

export const DOCUMENT_STATUSES = {
  UPLOADED: {
    id: "UPLOADED",
    label: "Subido",
    color: "bg-blue-100 text-blue-700",
    icon: "📤",
  },
  DATA_CAPTURED: {
    id: "DATA_CAPTURED",
    label: "Datos Capturados",
    color: "bg-amber-100 text-amber-700",
    icon: "📝",
  },
  VERIFIED: {
    id: "VERIFIED",
    label: "Verificado",
    color: "bg-green-100 text-green-700",
    icon: "✅",
  },
  REJECTED: {
    id: "REJECTED",
    label: "Rechazado",
    color: "bg-red-100 text-red-700",
    icon: "❌",
  },
  EXPIRED: {
    id: "EXPIRED",
    label: "Expirado",
    color: "bg-gray-100 text-gray-700",
    icon: "⏰",
  },
};

export const DOCUMENT_SOURCES = {
  MANUAL: "Manual",
  SCAN: "Escaneado",
  IMPORT: "Importado",
};

export const SCANNER_CONFIG = {
  scanArea: {
    x: 0.08,
    y: 0.15,
    width: 0.84,
    height: 0.7,
  },
  thresholds: {
    focus: 0.25,
    brightness: { min: 70, max: 210 },
    glare: 0.04,
    alignment: 0.5,
    documentFill: 0.35,
  },
  stabilityTime: 600,
  analysisResolution: 400,
  captureResolution: {
    width: 1920,
    height: 1080,
  },
  analysisFPS: 15,
  warmupTime: 1200,
  minConsecutiveFrames: 4,
};

export const SCANNER_MESSAGES = {
  initializing: "Iniciando cámara...",
  ready: "Coloca el documento dentro del marco",
  focusing: "Mantén firme...",
  capturing: "¡Capturando!",
  processing: "Procesando imagen...",
  success: "¡Documento capturado!",
  errors: {
    camera: "No se pudo acceder a la cámara",
    permission: "Permiso de cámara denegado",
    unsupported: "Tu navegador no soporta acceso a cámara",
  },
};

export function getDocumentTypeInfo(type) {
  return DOCUMENT_TYPES[type] || DOCUMENT_TYPES.OTHER;
}

export function getStatusInfo(status) {
  return DOCUMENT_STATUSES[status] || DOCUMENT_STATUSES.UPLOADED;
}

export function getExpirationStatus(daysUntilExpiration) {
  if (daysUntilExpiration === null || daysUntilExpiration === undefined) {
    return { label: "Sin fecha", color: "text-slate-500", urgent: false };
  }
  if (daysUntilExpiration < 0) {
    return { label: "Expirado", color: "text-red-600", urgent: true };
  }
  if (daysUntilExpiration <= 30) {
    return { label: `${daysUntilExpiration} días`, color: "text-red-600", urgent: true };
  }
  if (daysUntilExpiration <= 90) {
    return { label: `${daysUntilExpiration} días`, color: "text-amber-600", urgent: false };
  }
  return { label: `${daysUntilExpiration} días`, color: "text-green-600", urgent: false };
}
