/**
 * constants.js - Document capture configuration
 */

export const SCANNER_CONFIG = {
  targetFps:         8,
  stabilityMs:       800,
  warmupMs:          1500,
};

export const QUALITY_THRESHOLDS = {
  focusMin:       0.25,
  brightnessMin:  70,
  brightnessMax:  225,
  glareMax:       5,
};

// ISO/IEC 7810 aspect ratios (width / height)
export const DOCUMENT_ASPECT_RATIOS = {
  PASSPORT:       1.42,  // ID-3
  VISA:           1.42,  // Same carrier as passport page
  PERMISO_SALIDA: 0.77,  // Letter portrait (roughly)
  OTHER:          1.42,  // Default
};

// Frame size as % of viewport width
export const FRAME_WIDTH_PCT = 0.85;

export const DOC_LABELS = {
  PASSPORT:       'Pasaporte',
  VISA:           'Visa americana',
  PERMISO_SALIDA: 'Permiso de salida',
  OTHER:          'Otro documento',
};

export const DOC_ICONS = {
  PASSPORT:       '🛂',
  VISA:           '🇺🇸',
  PERMISO_SALIDA: '📄',
  OTHER:          '📎',
};

// Document types that go through camera scanner
export const CAMERA_TYPES = ['PASSPORT', 'VISA'];
// Document types that go through file upload
export const UPLOAD_TYPES = ['PERMISO_SALIDA', 'OTHER'];

// Document types that get OCR'd on the server
export const OCR_TYPES = ['PASSPORT', 'VISA', 'PERMISO_SALIDA'];

export const STATUS_LABELS = {
  UPLOADED:         'Subido',
  DATA_CAPTURED:    'Datos capturados',
  CAPTURE_ACCEPTED: 'Captura aceptada',
  OCR_PENDING:      'Procesando…',
  OCR_PROCESSING:   'Analizando…',
  OCR_SUCCESS:      'Procesado',
  OCR_FAILED:       'Error en lectura',
  VERIFIED:         'Verificado',
  REJECTED:         'Rechazado',
};

export const STATUS_COLORS = {
  UPLOADED:         'gray',
  DATA_CAPTURED:    'blue',
  CAPTURE_ACCEPTED: 'blue',
  OCR_PENDING:      'yellow',
  OCR_PROCESSING:   'yellow',
  OCR_SUCCESS:      'green',
  OCR_FAILED:       'red',
  VERIFIED:         'green',
  REJECTED:         'red',
};

export const OCR_POLLING_STATUSES = new Set(['CAPTURE_ACCEPTED', 'OCR_PENDING', 'OCR_PROCESSING']);

// Arrays for filters / selectors
export const DOCUMENT_TYPES = [
  {
    id: 'PASSPORT',
    value: 'PASSPORT',
    label: 'Pasaporte',
    icon: '🛂',
    description: 'Pasaporte costarricense o de cualquier nacionalidad',
    requiresMRZ: true,
  },
  {
    id: 'VISA',
    value: 'VISA',
    label: 'Visa americana',
    icon: '🇺🇸',
    description: 'Visa de Estados Unidos (B1/B2 u otra categoría)',
    requiresMRZ: true,
  },
  {
    id: 'PERMISO_SALIDA',
    value: 'PERMISO_SALIDA',
    label: 'Permiso de salida',
    icon: '📄',
    description: 'Permiso notarial para viaje de menores',
    requiresMRZ: false,
  },
  {
    id: 'OTHER',
    value: 'OTHER',
    label: 'Otro documento',
    icon: '📎',
    description: 'Cualquier otro documento de viaje o identificación',
    requiresMRZ: false,
  },
];

export const DOCUMENT_STATUSES = [
  { value: 'UPLOADED',         label: 'Subido' },
  { value: 'CAPTURE_ACCEPTED', label: 'Captura aceptada' },
  { value: 'OCR_PENDING',      label: 'Procesando…' },
  { value: 'OCR_PROCESSING',   label: 'Analizando…' },
  { value: 'OCR_SUCCESS',      label: 'Procesado' },
  { value: 'OCR_FAILED',       label: 'Error en lectura' },
  { value: 'VERIFIED',         label: 'Verificado' },
  { value: 'REJECTED',         label: 'Rechazado' },
];

// Helper functions
export function getDocumentTypeInfo(type) {
  return {
    label: DOC_LABELS[type] || type,
    icon:  DOC_ICONS[type]  || '📄',
  };
}

export function getStatusInfo(status) {
  return {
    label: STATUS_LABELS[status] || status,
    color: STATUS_COLORS[status] || 'gray',
  };
}

export function getExpirationStatus(dateStr) {
  if (!dateStr) return { label: 'Sin fecha', color: 'gray', urgent: false };
  const now  = new Date();
  const exp  = new Date(dateStr);
  const days = Math.floor((exp - now) / (1000 * 60 * 60 * 24));
  if (days < 0)   return { label: 'Vencido',            color: 'red',    urgent: true,  days };
  if (days <= 30) return { label: `Vence en ${days}d`,  color: 'red',    urgent: true,  days };
  if (days <= 90) return { label: `Vence en ${days}d`,  color: 'amber',  urgent: false, days };
  return              { label: 'Vigente',              color: 'green',  urgent: false, days };
}
