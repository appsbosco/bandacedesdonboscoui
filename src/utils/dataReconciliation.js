/**
 * Data reconciliation: merges MRZ-parsed data with OCR-extracted data.
 *
 * Priority rules:
 * 1. MRZ fields take priority when check digits pass (machine-readable, structured)
 * 2. OCR fields fill gaps where MRZ has no data (issueDate, visaType, etc.)
 * 3. When both sources exist but disagree, MRZ wins if valid; OCR is flagged as alternative
 * 4. Reason codes track every decision for downstream review
 */

const FIELD_PRIORITY = {
  // Fields where MRZ is authoritative (structured, check-digit protected)
  MRZ_AUTHORITATIVE: new Set([
    "surname",
    "givenNames",
    "documentNumber",
    "passportNumber",
    "nationality",
    "issuingCountry",
    "dateOfBirth",
    "sex",
    "expirationDate",
  ]),
  // Fields only available from OCR / manual
  OCR_ONLY: new Set(["issueDate", "visaType", "fullName"]),
};

/**
 * Normalize a value for comparison (trim, uppercase, collapse whitespace).
 */
function norm(v) {
  if (v == null) return "";
  return String(v).trim().toUpperCase().replace(/\s+/g, " ");
}

/**
 * Check if two field values are semantically equivalent.
 * Handles date strings, whitespace differences, etc.
 */
function fieldsMatch(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  // Date comparison: try parsing both as dates
  const da = new Date(a);
  const db = new Date(b);
  if (!isNaN(da.getTime()) && !isNaN(db.getTime())) {
    return da.toISOString().slice(0, 10) === db.toISOString().slice(0, 10);
  }

  return false;
}

/**
 * Reconcile MRZ-parsed data with OCR-extracted data.
 *
 * @param {Object|null} mrzData — parsed MRZ fields (from detectMRZ().parsed)
 * @param {Object|null} ocrData — fields extracted via OCR text patterns (from extractFromOCRText())
 * @param {Object} options
 * @param {boolean} options.mrzCheckDigitsValid — whether MRZ check digits all passed
 * @param {number}  options.mrzConfidence — 0-1 confidence from MRZ parser
 * @param {number}  options.ocrConfidence — 0-100 confidence from Tesseract
 * @returns {{ fields, sources, reasonCodes, confidence, mrzValid }}
 */
export function reconcileData(mrzData, ocrData, options = {}) {
  const {
    mrzCheckDigitsValid = false,
    mrzConfidence = 0,
    ocrConfidence = 0,
  } = options;

  const fields = {};
  const sources = {};  // field → "MRZ" | "OCR" | "MERGED"
  const reasonCodes = [];

  const mrz = mrzData || {};
  const ocr = ocrData || {};
  const hasMRZ = Object.keys(mrz).length > 0;
  const hasOCR = Object.keys(ocr).length > 0;

  if (!hasMRZ && !hasOCR) {
    reasonCodes.push("NO_DATA_SOURCES");
    return { fields, sources, reasonCodes, confidence: 0, mrzValid: false };
  }

  if (!hasMRZ) {
    reasonCodes.push("MRZ_NOT_DETECTED");
  }

  // Reconcile each field
  const allFields = new Set([
    ...Object.keys(mrz),
    ...Object.keys(ocr),
    "fullName",
  ]);

  for (const field of allFields) {
    const mrzVal = mrz[field];
    const ocrVal = ocr[field];
    const hasMrzVal = mrzVal != null && String(mrzVal).trim() !== "";
    const hasOcrVal = ocrVal != null && String(ocrVal).trim() !== "";

    // Skip internal/metadata fields
    if (["checkDigits", "format", "raw", "confidence"].includes(field)) continue;

    if (FIELD_PRIORITY.MRZ_AUTHORITATIVE.has(field)) {
      if (hasMrzVal && mrzCheckDigitsValid) {
        // MRZ is authoritative and valid — use it
        fields[field] = mrzVal;
        sources[field] = "MRZ";

        if (hasOcrVal && !fieldsMatch(mrzVal, ocrVal)) {
          reasonCodes.push(`CONFLICT_${field.toUpperCase()}_MRZ_WINS`);
        }
      } else if (hasMrzVal && !mrzCheckDigitsValid) {
        // MRZ present but check digits failed — still prefer MRZ but flag it
        fields[field] = mrzVal;
        sources[field] = "MRZ";
        reasonCodes.push(`MRZ_CHECKDIGIT_FAIL_${field.toUpperCase()}`);
      } else if (hasOcrVal) {
        // No MRZ value — fall back to OCR
        fields[field] = ocrVal;
        sources[field] = "OCR";
        if (hasMRZ) {
          reasonCodes.push(`MRZ_MISSING_${field.toUpperCase()}_OCR_FALLBACK`);
        }
      }
    } else if (FIELD_PRIORITY.OCR_ONLY.has(field)) {
      // OCR-only fields
      if (hasOcrVal) {
        fields[field] = ocrVal;
        sources[field] = "OCR";
      } else if (hasMrzVal) {
        fields[field] = mrzVal;
        sources[field] = "MRZ";
      }
    } else {
      // Unknown field — take whichever is available, prefer MRZ
      if (hasMrzVal) {
        fields[field] = mrzVal;
        sources[field] = "MRZ";
      } else if (hasOcrVal) {
        fields[field] = ocrVal;
        sources[field] = "OCR";
      }
    }
  }

  // Compute fullName if not set
  if (!fields.fullName && (fields.givenNames || fields.surname)) {
    fields.fullName = [fields.givenNames, fields.surname].filter(Boolean).join(" ").trim();
    sources.fullName = "MERGED";
  }

  // Map documentNumber → passportNumber for passport types
  if (fields.documentNumber && !fields.passportNumber) {
    fields.passportNumber = fields.documentNumber;
    sources.passportNumber = sources.documentNumber;
  }

  // Compute overall confidence
  let confidence;
  if (hasMRZ && mrzCheckDigitsValid) {
    confidence = Math.max(mrzConfidence, 0.85);
  } else if (hasMRZ) {
    confidence = mrzConfidence * 0.7;
  } else {
    confidence = (ocrConfidence / 100) * 0.5;
  }

  return {
    fields,
    sources,
    reasonCodes,
    confidence,
    mrzValid: hasMRZ && mrzCheckDigitsValid,
  };
}

/**
 * Format reconciled data for the backend UpsertDocumentExtractedDataInput.
 *
 * @param {Object} reconciled — output of reconcileData()
 * @param {Object} ocrResult — raw OCR result from useOCR
 * @returns {Object} — ready for GraphQL mutation
 */
export function formatForBackend(reconciled, ocrResult = {}) {
  const { fields, reasonCodes, mrzValid } = reconciled;

  return {
    fullName: fields.fullName || null,
    givenNames: fields.givenNames || null,
    surname: fields.surname || null,
    nationality: fields.nationality || null,
    issuingCountry: fields.issuingCountry || null,
    documentNumber: fields.documentNumber || null,
    passportNumber: fields.passportNumber || null,
    visaType: fields.visaType || null,
    dateOfBirth: toISO(fields.dateOfBirth),
    sex: fields.sex || null,
    expirationDate: toISO(fields.expirationDate),
    issueDate: toISO(fields.issueDate),
    mrzRaw: ocrResult?.mrz?.raw || null,
    mrzValid,
    mrzFormat: ocrResult?.mrz?.format || null,
    reasonCodes: reasonCodes.length > 0 ? reasonCodes : null,
    ocrText: ocrResult?.text || null,
    ocrConfidence: ocrResult?.confidence != null ? ocrResult.confidence / 100 : null,
  };
}

function toISO(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00.000Z`;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
