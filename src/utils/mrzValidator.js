/**
 * Validador MRZ mejorado para pasaportes internacionales
 */

const MRZ_WEIGHTS = [7, 3, 1];

function mrzCharValue(char) {
  if (char >= "0" && char <= "9") return parseInt(char, 10);
  if (char >= "A" && char <= "Z") return char.charCodeAt(0) - "A".charCodeAt(0) + 10;
  return 0; // '<' or invalid
}

function calculateCheckDigit(str) {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += mrzCharValue(str[i]) * MRZ_WEIGHTS[i % 3];
  }
  return sum % 10;
}

function validateCheckDigit(data, checkDigit) {
  if (!data || checkDigit === undefined) return false;
  const expected = calculateCheckDigit(data);
  const actual = parseInt(checkDigit, 10);
  return expected === actual;
}

function parseMRZDate(mrzDate) {
  if (!mrzDate || mrzDate.length !== 6) return null;

  const year = parseInt(mrzDate.substring(0, 2), 10);
  const month = parseInt(mrzDate.substring(2, 4), 10);
  const day = parseInt(mrzDate.substring(4, 6), 10);

  const fullYear = year > 50 ? 1900 + year : 2000 + year;
  return new Date(fullYear, month - 1, day);
}

export function validateMRZ(mrzText) {
  if (!mrzText) return { valid: false, error: "MRZ text required" };

  const lines = mrzText
    .toUpperCase()
    .replace(/\s/g, "")
    .split("\n")
    .filter((line) => line.length > 0);

  if (lines.length !== 2) {
    return { valid: false, error: "MRZ must have exactly 2 lines" };
  }

  const line1 = lines[0];
  const line2 = lines[1];

  // Validar longitud (44 caracteres para TD3 - pasaportes)
  if (line1.length !== 44 || line2.length !== 44) {
    return { valid: false, error: "Each MRZ line must be 44 characters" };
  }

  try {
    // Línea 1
    const documentType = line1.substring(0, 2);
    const issuingCountry = line1.substring(2, 5).replace(/</g, "");
    const nameSection = line1.substring(5, 44);
    const nameParts = nameSection.split("<<");
    const surname = nameParts[0]?.replace(/</g, " ").trim();
    const givenNames = nameParts[1]?.replace(/</g, " ").trim();

    // Línea 2
    const passportNumber = line2.substring(0, 9).replace(/</g, "");
    const passportCheckDigit = line2[9];
    const nationality = line2.substring(10, 13).replace(/</g, "");
    const dateOfBirth = line2.substring(13, 19);
    const dobCheckDigit = line2[19];
    const sex = line2[20];
    const expirationDate = line2.substring(21, 27);
    const expCheckDigit = line2[27];
    const personalNumber = line2.substring(28, 42).replace(/</g, "");
    const personalCheckDigit = line2[42];
    const finalCheckDigit = line2[43];

    // Validar check digits
    const passportValid = validateCheckDigit(line2.substring(0, 9), passportCheckDigit);
    const dobValid = validateCheckDigit(dateOfBirth, dobCheckDigit);
    const expValid = validateCheckDigit(expirationDate, expCheckDigit);
    const personalValid =
      personalNumber.length > 0
        ? validateCheckDigit(line2.substring(28, 42), personalCheckDigit)
        : true;

    const compositeData =
      line2.substring(0, 10) + line2.substring(13, 20) + line2.substring(21, 43);
    const finalValid = validateCheckDigit(compositeData, finalCheckDigit);

    const allValid = passportValid && dobValid && expValid && personalValid && finalValid;

    return {
      valid: allValid,
      documentType,
      issuingCountry,
      surname,
      givenNames,
      fullName: `${givenNames} ${surname}`.trim(),
      passportNumber,
      nationality,
      dateOfBirth: parseMRZDate(dateOfBirth),
      sex: sex !== "<" ? sex : null,
      expirationDate: parseMRZDate(expirationDate),
      personalNumber: personalNumber || null,
      mrzRaw: mrzText,
      checksValid: {
        passport: passportValid,
        dateOfBirth: dobValid,
        expiration: expValid,
        personalNumber: personalValid,
        final: finalValid,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: `Parse error: ${error.message}`,
    };
  }
}
