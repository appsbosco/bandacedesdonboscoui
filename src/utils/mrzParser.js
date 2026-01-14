/**
 * MRZ Detection and Parsing Utilities
 * Detecta y parsea Machine Readable Zone de documentos
 */

// Caracteres válidos en MRZ
const MRZ_CHARS = /^[A-Z0-9<]+$/;

// Patrones de MRZ por tipo de documento
const MRZ_PATTERNS = {
  // TD3 (Pasaporte): 2 líneas de 44 caracteres
  TD3: {
    lines: 2,
    lineLength: 44,
    regex:
      /^[A-Z<]{2}[A-Z<]{3}[A-Z<]{39}\n[A-Z0-9<]{9}[0-9][A-Z<]{3}[0-9]{6}[0-9][MF<][0-9]{6}[0-9][A-Z0-9<]{14}[0-9][0-9]$/,
  },
  // TD1 (ID Card): 3 líneas de 30 caracteres
  TD1: {
    lines: 3,
    lineLength: 30,
    regex:
      /^[A-Z<]{2}[A-Z<]{3}[A-Z0-9<]{25}\n[0-9]{6}[0-9][MF<][0-9]{6}[0-9][A-Z<]{3}[A-Z0-9<]{11}[0-9]\n[A-Z<]{30}$/,
  },
  // TD2: 2 líneas de 36 caracteres
  TD2: {
    lines: 2,
    lineLength: 36,
    regex:
      /^[A-Z<]{2}[A-Z<]{3}[A-Z<]{31}\n[A-Z0-9<]{9}[0-9][A-Z<]{3}[0-9]{6}[0-9][MF<][0-9]{6}[0-9][A-Z0-9<]{7}[0-9]$/,
  },
};

/**
 * Detecta líneas MRZ en texto OCR
 * @param {string} text - Texto completo del OCR
 * @returns {Object|null} - MRZ detectado o null
 */
export function detectMRZ(text) {
  if (!text) return null;

  // Normalizar texto
  const normalized = text
    .toUpperCase()
    .replace(/[^A-Z0-9<\n]/g, "") // Solo caracteres válidos
    .replace(/0/g, "O") // Corrección común OCR
    .replace(/O(?=[0-9])/g, "0") // Pero O antes de números probablemente es 0
    .replace(/\n+/g, "\n")
    .trim();

  const lines = normalized.split("\n");

  // Buscar secuencias de líneas que parezcan MRZ
  const mrzCandidates = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Línea con muchos '<' es candidata a MRZ
    if (line.includes("<") && line.length >= 28) {
      mrzCandidates.push({ line, index: i });
    }
  }

  // Intentar armar MRZ desde candidatos
  for (const { line, index } of mrzCandidates) {
    // TD3 (Pasaporte): buscar 2 líneas de ~44 chars
    if (line.length >= 40 && line.length <= 48) {
      const nextLine = lines[index + 1];

      if (nextLine && nextLine.length >= 40 && nextLine.length <= 48) {
        const mrz = [normalizeLineLength(line, 44), normalizeLineLength(nextLine, 44)].join("\n");

        const parsed = parseTD3(mrz);
        if (parsed) {
          return {
            type: "TD3",
            raw: mrz,
            parsed,
            confidence: calculateMRZConfidence(mrz, "TD3"),
          };
        }
      }
    }

    // TD1 (ID): buscar 3 líneas de ~30 chars
    if (line.length >= 26 && line.length <= 34) {
      const line2 = lines[index + 1];
      const line3 = lines[index + 2];

      if (
        line2 &&
        line3 &&
        line2.length >= 26 &&
        line2.length <= 34 &&
        line3.length >= 26 &&
        line3.length <= 34
      ) {
        const mrz = [
          normalizeLineLength(line, 30),
          normalizeLineLength(line2, 30),
          normalizeLineLength(line3, 30),
        ].join("\n");

        const parsed = parseTD1(mrz);
        if (parsed) {
          return {
            type: "TD1",
            raw: mrz,
            parsed,
            confidence: calculateMRZConfidence(mrz, "TD1"),
          };
        }
      }
    }
  }

  return null;
}

/**
 * Normaliza una línea al largo esperado
 */
function normalizeLineLength(line, expectedLength) {
  if (line.length === expectedLength) return line;
  if (line.length > expectedLength) return line.substring(0, expectedLength);
  return line.padEnd(expectedLength, "<");
}

/**
 * Parsea MRZ tipo TD3 (Pasaporte)
 * Línea 1: P<PAISNOMBRE<<APELLIDO<<<<<<<<<<<<<<<<<<<<<<
 * Línea 2: PASAPORTE#CDIGESTOPAISYYNACIMCDIGMFYYEXPIRAC#CDIGDATOSADIC#CDIG
 */
function parseTD3(mrz) {
  const lines = mrz.split("\n");
  if (lines.length !== 2) return null;

  const line1 = lines[0];
  const line2 = lines[1];

  try {
    // Línea 1
    const documentType = line1.substring(0, 2).replace(/<+$/, "");
    const issuingCountry = line1.substring(2, 5).replace(/<+$/, "");
    const namePart = line1.substring(5, 44);
    const nameParts = namePart.split("<<");
    const surname = nameParts[0]?.replace(/<+/g, " ").trim() || "";
    const givenNames = nameParts[1]?.replace(/<+/g, " ").trim() || "";

    // Línea 2
    const passportNumber = line2.substring(0, 9).replace(/<+$/, "");
    const passportCheckDigit = line2[9];
    const nationality = line2.substring(10, 13).replace(/<+$/, "");
    const birthDateRaw = line2.substring(13, 19);
    const birthCheckDigit = line2[19];
    const sex = line2[20];
    const expiryDateRaw = line2.substring(21, 27);
    const expiryCheckDigit = line2[27];
    const personalNumber = line2.substring(28, 42).replace(/<+$/, "");
    const personalCheckDigit = line2[42];
    const finalCheckDigit = line2[43];

    // Parsear fechas
    const dateOfBirth = parseDate(birthDateRaw);
    const expirationDate = parseDate(expiryDateRaw, true);

    return {
      documentType,
      issuingCountry,
      surname,
      givenNames,
      fullName: `${givenNames} ${surname}`.trim(),
      passportNumber,
      nationality,
      dateOfBirth,
      sex: sex === "M" ? "MALE" : sex === "F" ? "FEMALE" : null,
      expirationDate,
      personalNumber: personalNumber || null,
      checkDigits: {
        passport: passportCheckDigit,
        birth: birthCheckDigit,
        expiry: expiryCheckDigit,
        personal: personalCheckDigit,
        final: finalCheckDigit,
      },
    };
  } catch (error) {
    console.error("Error parsing TD3 MRZ:", error);
    return null;
  }
}

/**
 * Parsea MRZ tipo TD1 (ID Card)
 */
function parseTD1(mrz) {
  const lines = mrz.split("\n");
  if (lines.length !== 3) return null;

  const line1 = lines[0];
  const line2 = lines[1];
  const line3 = lines[2];

  try {
    // Línea 1
    const documentType = line1.substring(0, 2).replace(/<+$/, "");
    const issuingCountry = line1.substring(2, 5).replace(/<+$/, "");
    const documentNumber = line1.substring(5, 14).replace(/<+$/, "");
    const documentCheckDigit = line1[14];
    const optionalData1 = line1.substring(15, 30).replace(/<+$/, "");

    // Línea 2
    const birthDateRaw = line2.substring(0, 6);
    const birthCheckDigit = line2[6];
    const sex = line2[7];
    const expiryDateRaw = line2.substring(8, 14);
    const expiryCheckDigit = line2[14];
    const nationality = line2.substring(15, 18).replace(/<+$/, "");
    const optionalData2 = line2.substring(18, 29).replace(/<+$/, "");
    const finalCheckDigit = line2[29];

    // Línea 3: Nombre
    const namePart = line3;
    const nameParts = namePart.split("<<");
    const surname = nameParts[0]?.replace(/<+/g, " ").trim() || "";
    const givenNames = nameParts[1]?.replace(/<+/g, " ").trim() || "";

    const dateOfBirth = parseDate(birthDateRaw);
    const expirationDate = parseDate(expiryDateRaw, true);

    return {
      documentType,
      issuingCountry,
      surname,
      givenNames,
      fullName: `${givenNames} ${surname}`.trim(),
      documentNumber,
      nationality,
      dateOfBirth,
      sex: sex === "M" ? "MALE" : sex === "F" ? "FEMALE" : null,
      expirationDate,
      checkDigits: {
        document: documentCheckDigit,
        birth: birthCheckDigit,
        expiry: expiryCheckDigit,
        final: finalCheckDigit,
      },
    };
  } catch (error) {
    console.error("Error parsing TD1 MRZ:", error);
    return null;
  }
}

/**
 * Parsea fecha de MRZ (YYMMDD)
 * @param {string} dateStr - Fecha en formato YYMMDD
 * @param {boolean} isFuture - Si es fecha de expiración (posiblemente futura)
 * @returns {string|null} - Fecha en formato ISO
 */
function parseDate(dateStr, isFuture = false) {
  if (!dateStr || dateStr.length !== 6 || !/^\d{6}$/.test(dateStr)) {
    return null;
  }

  let year = parseInt(dateStr.substring(0, 2), 10);
  const month = parseInt(dateStr.substring(2, 4), 10);
  const day = parseInt(dateStr.substring(4, 6), 10);

  // Determinar siglo
  const currentYear = new Date().getFullYear() % 100;

  if (isFuture) {
    // Para fechas de expiración, asumir 2000s si el año es menor que el actual + 20
    year = year <= currentYear + 20 ? 2000 + year : 1900 + year;
  } else {
    // Para fechas de nacimiento, asumir 1900s si el año es mayor que el actual
    year = year > currentYear ? 1900 + year : 2000 + year;
  }

  // Validar fecha
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Calcula confianza del MRZ detectado
 */
function calculateMRZConfidence(mrz, type) {
  const pattern = MRZ_PATTERNS[type];
  if (!pattern) return 0;

  const lines = mrz.split("\n");
  let score = 0;

  // Verificar número de líneas
  if (lines.length === pattern.lines) score += 0.3;

  // Verificar largo de líneas
  const correctLengths = lines.every((l) => Math.abs(l.length - pattern.lineLength) <= 2);
  if (correctLengths) score += 0.3;

  // Verificar caracteres válidos
  const validChars = lines.every((l) => MRZ_CHARS.test(l));
  if (validChars) score += 0.2;

  // Verificar presencia de '<' (separadores)
  const hasFillers = lines.some((l) => l.includes("<"));
  if (hasFillers) score += 0.2;

  return Math.min(score, 1);
}

/**
 * Extrae datos relevantes de texto OCR general (sin MRZ)
 * Busca patrones comunes en documentos
 */
export function extractFromOCRText(text) {
  const extracted = {};

  // Patrones comunes
  const patterns = {
    // Número de pasaporte (varios formatos)
    passportNumber: /(?:passport|pasaporte|no\.?|n[uú]mero)[:\s]*([A-Z]{1,2}[0-9]{6,9})/i,

    // Fechas en varios formatos
    datePattern: /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{2,4}[-/]\d{1,2}[-/]\d{1,2})/g,

    // Nacionalidad
    nationality: /(?:nationality|nacionalidad)[:\s]*([A-Z]{3}|[A-Z][a-z]+)/i,

    // Nombres (después de ciertas palabras clave)
    name: /(?:name|nombre|given\s*names?)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    surname: /(?:surname|apellido|family\s*name)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,

    // Sexo
    sex: /(?:sex|sexo|gender)[:\s]*(M|F|MALE|FEMALE|MASCULINO|FEMENINO)/i,
  };

  // Intentar extraer cada campo
  for (const [field, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match && match[1]) {
      extracted[field] = match[1].trim();
    }
  }

  return extracted;
}

export default detectMRZ;
