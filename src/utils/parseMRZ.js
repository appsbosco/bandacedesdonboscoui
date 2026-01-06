/**
 * Parse MRZ lines (TD3 format - passports)
 * Format:
 * Line 1: P<ISOCOUNTRY<<SURNAME<<GIVENNAMES<<<<<<<<<<<<<<<<
 * Line 2: PASSPORTNUMBER<NATIONALITY<BIRTHDATE<SEX<EXPDATE<PERSONAL<<CHECKDIGITS
 */
export function parseMRZ(mrzText) {
  if (!mrzText) return null;

  const lines = mrzText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return null;

  try {
    const line1 = lines[0];
    const line2 = lines[1];

    // Line 1: Names
    const namePart = line1.substring(5).replace(/</g, " ").trim();
    const nameParts = namePart.split("  ").filter(Boolean);
    const surname = nameParts[0] || "";
    const givenNames = nameParts.slice(1).join(" ") || "";

    // Line 2: Details
    const passportNumber = line2.substring(0, 9).replace(/</g, "");
    const nationality = line2.substring(10, 13);
    const birthDate = line2.substring(13, 19);
    const sex = line2.substring(20, 21);
    const expDate = line2.substring(21, 27);
    const issuingCountry = line1.substring(2, 5);

    return {
      passportNumber,
      surname,
      givenNames,
      fullName: `${givenNames} ${surname}`.trim(),
      nationality,
      issuingCountry,
      dateOfBirth: parseDate(birthDate),
      sex: sex === "<" ? null : sex,
      expirationDate: parseDate(expDate),
      mrzRaw: mrzText,
      mrzValid: true,
    };
  } catch (error) {
    console.error("MRZ parse error:", error);
    return {
      mrzRaw: mrzText,
      mrzValid: false,
    };
  }
}

function parseDate(mrzDate) {
  if (!mrzDate || mrzDate.length !== 6) return null;

  const year = parseInt(mrzDate.substring(0, 2), 10);
  const month = parseInt(mrzDate.substring(2, 4), 10);
  const day = parseInt(mrzDate.substring(4, 6), 10);

  // Y2K logic: 00-30 = 2000s, 31-99 = 1900s
  const fullYear = year <= 30 ? 2000 + year : 1900 + year;

  return new Date(fullYear, month - 1, day).toISOString();
}
