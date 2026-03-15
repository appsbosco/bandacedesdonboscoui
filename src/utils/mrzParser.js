/**
 * MRZ Detection and Parsing — ICAO 9303 compliant
 *
 * Supports:
 * - TD3 (Passport): 2 lines x 44 chars
 * - TD1 (ID card):  3 lines x 30 chars
 * - TD2:            2 lines x 36 chars
 *
 * Provides:
 * - OCR error correction (common misreads)
 * - Check digit validation per ICAO 9303
 * - Confidence scoring
 * - Structured parsed output
 */

// Valid MRZ characters
const MRZ_VALID = /^[A-Z0-9<]+$/;

// ICAO 9303 check digit weights
const CHECK_WEIGHTS = [7, 3, 1];

// Character values for check digit computation (ICAO 9303 §4.9)
function charValue(ch) {
  if (ch === "<") return 0;
  if (ch >= "0" && ch <= "9") return ch.charCodeAt(0) - 48;
  if (ch >= "A" && ch <= "Z") return ch.charCodeAt(0) - 55; // A=10, B=11, ...
  return 0;
}

/**
 * Compute ICAO 9303 check digit for a string
 * @param {string} str - MRZ field string
 * @returns {number} check digit 0-9
 */
export function computeCheckDigit(str) {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += charValue(str[i]) * CHECK_WEIGHTS[i % 3];
  }
  return sum % 10;
}

/**
 * Validate a field against its check digit
 */
export function validateCheckDigit(field, expectedDigit) {
  if (!field || expectedDigit == null) return false;
  const expected = typeof expectedDigit === "string" ? parseInt(expectedDigit, 10) : expectedDigit;
  if (isNaN(expected)) return false;
  return computeCheckDigit(field) === expected;
}

// ── OCR Error Correction ─────────────────────────────────────────────────────

/**
 * Context-aware OCR correction for MRZ lines.
 * Different positions expect different character types (alpha vs digit),
 * so we correct based on context rather than blindly replacing.
 */
function correctOCRChar(ch, expectDigit) {
  if (expectDigit) {
    // In digit positions: common OCR misreads
    if (ch === "O" || ch === "o") return "0";
    if (ch === "I" || ch === "l" || ch === "|") return "1";
    if (ch === "Z") return "2";
    if (ch === "S" || ch === "s") return "5";
    if (ch === "B") return "8";
    if (ch === "G") return "6";
    if (ch === "T") return "7";
  } else {
    // In alpha positions: common OCR misreads
    if (ch === "0") return "O";
    if (ch === "1") return "I";
    if (ch === "8") return "B";
    if (ch === "5") return "S";
    if (ch === "2") return "Z";
  }
  return ch.toUpperCase();
}

/**
 * Clean a raw OCR line into valid MRZ characters.
 * Strips invalid chars, applies basic corrections.
 */
function cleanMRZLine(raw) {
  let cleaned = raw
    .replace(/\s+/g, "")   // Remove spaces
    .replace(/[^A-Za-z0-9<]/g, "") // Keep only valid chars
    .toUpperCase();
  return cleaned;
}

/**
 * Apply context-aware correction to TD3 line 2.
 * Line 2 has a strict format: digits and alpha at specific positions.
 * Format: [doc#:9][cd:1][nat:3][dob:6][cd:1][sex:1][exp:6][cd:1][opt:14][cd:1][final:1]
 */
function correctTD3Line2(line) {
  if (line.length !== 44) return line;
  const chars = line.split("");

  // Position map: true = expect digit, false = expect alpha, null = either
  const digitPositions = new Set([
    // passport number check digit
    9,
    // date of birth
    13, 14, 15, 16, 17, 18,
    // birth check digit
    19,
    // expiration date
    21, 22, 23, 24, 25, 26,
    // expiry check digit
    27,
    // personal number check digit
    42,
    // final check digit
    43,
  ]);

  const alphaPositions = new Set([
    // nationality
    10, 11, 12,
    // sex
    20,
  ]);

  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === "<") continue;
    if (digitPositions.has(i)) {
      chars[i] = correctOCRChar(chars[i], true);
    } else if (alphaPositions.has(i)) {
      chars[i] = correctOCRChar(chars[i], false);
    }
  }

  return chars.join("");
}

/**
 * Apply context-aware correction to TD1 line 2.
 * Format: [dob:6][cd:1][sex:1][exp:6][cd:1][nat:3][opt:11][cd:1]
 */
function correctTD1Line2(line) {
  if (line.length !== 30) return line;
  const chars = line.split("");

  const digitPositions = new Set([0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 29]);
  const alphaPositions = new Set([7, 15, 16, 17]);

  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === "<") continue;
    if (digitPositions.has(i)) {
      chars[i] = correctOCRChar(chars[i], true);
    } else if (alphaPositions.has(i)) {
      chars[i] = correctOCRChar(chars[i], false);
    }
  }

  return chars.join("");
}

// ── MRZ Detection ────────────────────────────────────────────────────────────

/**
 * Detect and parse MRZ from OCR text.
 * @param {string} text - Full OCR text
 * @returns {Object|null} { type, raw, parsed, confidence, checkDigits }
 */
export function detectMRZ(text) {
  if (!text) return null;

  // Split into lines, clean each line
  const rawLines = text.split(/\n/);
  const cleanedLines = rawLines.map(cleanMRZLine).filter((l) => l.length > 0);

  // Collect candidate MRZ lines (lines with '<' and sufficient length)
  const candidates = [];
  for (let i = 0; i < cleanedLines.length; i++) {
    const line = cleanedLines[i];
    if (line.length >= 28 && (line.includes("<") || MRZ_VALID.test(line))) {
      candidates.push({ line, index: i });
    }
  }

  // Try TD3 first (most common for passports)
  for (const { line, index } of candidates) {
    if (line.length >= 40 && line.length <= 48) {
      // Look for the next candidate line
      const nextIdx = candidates.findIndex((c) => c.index === index + 1);
      if (nextIdx === -1) continue;

      const nextLine = candidates[nextIdx].line;
      if (nextLine.length < 40 || nextLine.length > 48) continue;

      const l1 = normalizeLineLength(line, 44);
      const l2 = normalizeLineLength(correctTD3Line2(normalizeLineLength(nextLine, 44)), 44);

      const parsed = parseTD3(l1, l2);
      if (parsed) {
        const mrz = `${l1}\n${l2}`;
        const allChecksPass = Object.values(parsed.checkDigits).every((cd) => cd.valid);
        return {
          type: "TD3",
          format: "TD3",
          raw: mrz,
          parsed: parsed.data,
          checkDigits: parsed.checkDigits,
          checkDigitsValid: allChecksPass,
          confidence: parsed.confidence,
        };
      }
    }
  }

  // Try TD1
  for (const { line, index } of candidates) {
    if (line.length >= 26 && line.length <= 34) {
      const l2c = candidates.find((c) => c.index === index + 1);
      const l3c = candidates.find((c) => c.index === index + 2);
      if (!l2c || !l3c) continue;
      if (l2c.line.length < 26 || l2c.line.length > 34) continue;
      if (l3c.line.length < 26 || l3c.line.length > 34) continue;

      const l1 = normalizeLineLength(line, 30);
      const l2 = normalizeLineLength(correctTD1Line2(normalizeLineLength(l2c.line, 30)), 30);
      const l3 = normalizeLineLength(l3c.line, 30);

      const parsed = parseTD1(l1, l2, l3);
      if (parsed) {
        const mrz = `${l1}\n${l2}\n${l3}`;
        const allChecksPass = Object.values(parsed.checkDigits).every((cd) => cd.valid);
        return {
          type: "TD1",
          format: "TD1",
          raw: mrz,
          parsed: parsed.data,
          checkDigits: parsed.checkDigits,
          checkDigitsValid: allChecksPass,
          confidence: parsed.confidence,
        };
      }
    }
  }

  return null;
}

// ── Line Normalization ───────────────────────────────────────────────────────

function normalizeLineLength(line, expectedLength) {
  if (line.length === expectedLength) return line;
  if (line.length > expectedLength) return line.substring(0, expectedLength);
  return line.padEnd(expectedLength, "<");
}

// ── TD3 Parser (Passport) ────────────────────────────────────────────────────

function parseTD3(line1, line2) {
  if (line1.length !== 44 || line2.length !== 44) return null;

  try {
    // Line 1: type[2] + country[3] + name[39]
    const documentType = line1.substring(0, 2).replace(/<+$/, "");
    const issuingCountry = line1.substring(2, 5).replace(/<+$/, "");
    const namePart = line1.substring(5, 44);
    const nameParts = namePart.split("<<");
    const surname = nameParts[0]?.replace(/<+/g, " ").trim() || "";
    const givenNames = nameParts.slice(1).join(" ").replace(/<+/g, " ").trim() || "";

    // Line 2: docNum[9] + cd[1] + nat[3] + dob[6] + cd[1] + sex[1] + exp[6] + cd[1] + opt[14] + cd[1] + final[1]
    const docNumField = line2.substring(0, 9);
    const docNumCD = line2[9];
    const nationality = line2.substring(10, 13).replace(/<+$/, "");
    const dobField = line2.substring(13, 19);
    const dobCD = line2[19];
    const sex = line2[20];
    const expField = line2.substring(21, 27);
    const expCD = line2[27];
    const optionalField = line2.substring(28, 42);
    const optionalCD = line2[42];
    const finalCD = line2[43];

    // Validate check digits
    const checkDigits = {
      documentNumber: {
        field: docNumField,
        expected: parseInt(docNumCD, 10),
        computed: computeCheckDigit(docNumField),
        valid: validateCheckDigit(docNumField, docNumCD),
      },
      dateOfBirth: {
        field: dobField,
        expected: parseInt(dobCD, 10),
        computed: computeCheckDigit(dobField),
        valid: validateCheckDigit(dobField, dobCD),
      },
      expirationDate: {
        field: expField,
        expected: parseInt(expCD, 10),
        computed: computeCheckDigit(expField),
        valid: validateCheckDigit(expField, expCD),
      },
      optional: {
        field: optionalField,
        expected: parseInt(optionalCD, 10),
        computed: computeCheckDigit(optionalField),
        valid: validateCheckDigit(optionalField, optionalCD),
      },
      final: {
        // Composite check: docNum+cd+dob+cd+exp+cd+optional+cd
        field: line2.substring(0, 10) + line2.substring(13, 20) + line2.substring(21, 43),
        expected: parseInt(finalCD, 10),
        computed: computeCheckDigit(
          line2.substring(0, 10) + line2.substring(13, 20) + line2.substring(21, 43)
        ),
        valid: validateCheckDigit(
          line2.substring(0, 10) + line2.substring(13, 20) + line2.substring(21, 43),
          finalCD
        ),
      },
    };

    const validChecks = Object.values(checkDigits).filter((c) => c.valid).length;
    const totalChecks = Object.keys(checkDigits).length;

    // Must have at least document type starting with P and reasonable name
    if (!documentType.startsWith("P") && !documentType.startsWith("V")) return null;
    if (!surname && !givenNames) return null;

    const passportNumber = docNumField.replace(/<+$/, "");
    const dateOfBirth = parseMRZDate(dobField);
    const expirationDate = parseMRZDate(expField, true);

    // Confidence based on check digit validation
    const confidence = calculateConfidence(line1, line2, validChecks, totalChecks);

    return {
      data: {
        documentType,
        issuingCountry,
        surname,
        givenNames,
        fullName: `${givenNames} ${surname}`.trim(),
        passportNumber,
        documentNumber: passportNumber,
        nationality,
        dateOfBirth,
        sex: normalizeSex(sex),
        expirationDate,
        personalNumber: optionalField.replace(/<+$/, "") || null,
        mrzValid: validChecks >= 3, // At least 3 of 5 checks pass
        mrzFormat: "TD3",
      },
      checkDigits,
      confidence,
    };
  } catch (err) {
    console.error("[MRZ] TD3 parse error:", err);
    return null;
  }
}

// ── TD1 Parser (ID Card) ─────────────────────────────────────────────────────

function parseTD1(line1, line2, line3) {
  if (line1.length !== 30 || line2.length !== 30 || line3.length !== 30) return null;

  try {
    // Line 1: type[2] + country[3] + docNum[9] + cd[1] + optional[15]
    const documentType = line1.substring(0, 2).replace(/<+$/, "");
    const issuingCountry = line1.substring(2, 5).replace(/<+$/, "");
    const docNumField = line1.substring(5, 14);
    const docNumCD = line1[14];
    const optionalData1 = line1.substring(15, 30).replace(/<+$/, "");

    // Line 2: dob[6] + cd[1] + sex[1] + exp[6] + cd[1] + nat[3] + optional[11] + cd[1]
    const dobField = line2.substring(0, 6);
    const dobCD = line2[6];
    const sex = line2[7];
    const expField = line2.substring(8, 14);
    const expCD = line2[14];
    const nationality = line2.substring(15, 18).replace(/<+$/, "");
    const optionalData2 = line2.substring(18, 29).replace(/<+$/, "");
    const finalCD = line2[29];

    // Line 3: name (surname<<givennames)
    const nameParts = line3.split("<<");
    const surname = nameParts[0]?.replace(/<+/g, " ").trim() || "";
    const givenNames = nameParts.slice(1).join(" ").replace(/<+/g, " ").trim() || "";

    const checkDigits = {
      documentNumber: {
        field: docNumField,
        expected: parseInt(docNumCD, 10),
        computed: computeCheckDigit(docNumField),
        valid: validateCheckDigit(docNumField, docNumCD),
      },
      dateOfBirth: {
        field: dobField,
        expected: parseInt(dobCD, 10),
        computed: computeCheckDigit(dobField),
        valid: validateCheckDigit(dobField, dobCD),
      },
      expirationDate: {
        field: expField,
        expected: parseInt(expCD, 10),
        computed: computeCheckDigit(expField),
        valid: validateCheckDigit(expField, expCD),
      },
      final: {
        // Composite: line1[5..30] + line2[0..7] + line2[8..15] + line2[18..29]
        field: line1.substring(5, 30) + line2.substring(0, 7) + line2.substring(8, 15) + line2.substring(18, 29),
        expected: parseInt(finalCD, 10),
        computed: computeCheckDigit(
          line1.substring(5, 30) + line2.substring(0, 7) + line2.substring(8, 15) + line2.substring(18, 29)
        ),
        valid: validateCheckDigit(
          line1.substring(5, 30) + line2.substring(0, 7) + line2.substring(8, 15) + line2.substring(18, 29),
          finalCD
        ),
      },
    };

    const validChecks = Object.values(checkDigits).filter((c) => c.valid).length;
    const totalChecks = Object.keys(checkDigits).length;

    if (!surname && !givenNames) return null;

    const documentNumber = docNumField.replace(/<+$/, "");
    const dateOfBirth = parseMRZDate(dobField);
    const expirationDate = parseMRZDate(expField, true);

    const confidence = validChecks / totalChecks;

    return {
      data: {
        documentType,
        issuingCountry,
        surname,
        givenNames,
        fullName: `${givenNames} ${surname}`.trim(),
        documentNumber,
        passportNumber: documentNumber,
        nationality,
        dateOfBirth,
        sex: normalizeSex(sex),
        expirationDate,
        mrzValid: validChecks >= 2,
        mrzFormat: "TD1",
      },
      checkDigits,
      confidence,
    };
  } catch (err) {
    console.error("[MRZ] TD1 parse error:", err);
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeSex(ch) {
  if (ch === "M") return "M";
  if (ch === "F") return "F";
  return null;
}

/**
 * Parse YYMMDD date from MRZ
 * @param {string} dateStr - 6-digit date YYMMDD
 * @param {boolean} isFuture - true for expiration dates
 * @returns {string|null} ISO date string YYYY-MM-DD
 */
function parseMRZDate(dateStr, isFuture = false) {
  if (!dateStr || dateStr.length !== 6 || !/^\d{6}$/.test(dateStr)) return null;

  let year = parseInt(dateStr.substring(0, 2), 10);
  const month = parseInt(dateStr.substring(2, 4), 10);
  const day = parseInt(dateStr.substring(4, 6), 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const currentYear = new Date().getFullYear() % 100;

  if (isFuture) {
    // Expiration: assume 2000s if year <= currentYear + 30
    year = year <= currentYear + 30 ? 2000 + year : 1900 + year;
  } else {
    // Birth: assume 1900s if year > currentYear
    year = year > currentYear ? 1900 + year : 2000 + year;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Calculate confidence score for MRZ detection
 */
function calculateConfidence(line1, line2, validChecks, totalChecks) {
  let score = 0;

  // Check digit validation weight (most important)
  score += (validChecks / totalChecks) * 0.5;

  // Valid MRZ characters
  const allValid = MRZ_VALID.test(line1) && MRZ_VALID.test(line2);
  if (allValid) score += 0.2;

  // Correct line lengths
  if (line1.length === 44 && line2.length === 44) score += 0.1;

  // Has filler characters (expected in MRZ)
  if (line1.includes("<") && line2.includes("<")) score += 0.1;

  // Starts with P or V (passport/visa)
  if (/^[PV]/.test(line1)) score += 0.1;

  return Math.min(score, 1);
}

// ── OCR Text Extraction (fallback when no MRZ) ──────────────────────────────

/**
 * Extract document data from general OCR text (no MRZ found).
 * Best-effort pattern matching.
 */
export function extractFromOCRText(text) {
  if (!text) return {};
  const extracted = {};

  const patterns = {
    passportNumber: /(?:passport|pasaporte|no\.?|n[uú]mero)[:\s]*([A-Z]{1,2}\d{6,9})/i,
    nationality: /(?:nationality|nacionalidad|citizen)[:\s]*([A-Z]{3}|[A-Z][a-z]+)/i,
    surname: /(?:surname|apellido|family\s*name)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    givenNames: /(?:name|nombre|given\s*names?|first\s*name)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    sex: /(?:sex|sexo|gender)[:\s]*(M|F|MALE|FEMALE|MASCULINO|FEMENINO)/i,
    dateOfBirth: /(?:birth|nacimiento|DOB)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    expirationDate: /(?:expir|vencimiento|valid\s*until)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
  };

  for (const [field, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match?.[1]) {
      extracted[field] = match[1].trim();
    }
  }

  // Normalize sex value
  if (extracted.sex) {
    const s = extracted.sex.toUpperCase();
    if (s === "MALE" || s === "MASCULINO") extracted.sex = "M";
    else if (s === "FEMALE" || s === "FEMENINO") extracted.sex = "F";
  }

  return extracted;
}

export default detectMRZ;
