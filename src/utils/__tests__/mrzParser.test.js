import { computeCheckDigit, validateCheckDigit, detectMRZ, extractFromOCRText } from "../mrzParser";

// ─── Check digit computation ──────────────────────────────────────────
describe("computeCheckDigit", () => {
  test("empty string → 0", () => {
    expect(computeCheckDigit("")).toBe(0);
  });

  test("all fillers → 0", () => {
    expect(computeCheckDigit("<<<")).toBe(0);
  });

  // ICAO 9303 example: passport number "AB1234567" → check digit
  test("known passport number AB1234567", () => {
    // A=10, B=11, 1,2,3,4,5,6,7
    // weights: 7,3,1,7,3,1,7,3,1
    // 10*7 + 11*3 + 1*1 + 2*7 + 3*3 + 4*1 + 5*7 + 6*3 + 7*1
    // = 70 + 33 + 1 + 14 + 9 + 4 + 35 + 18 + 7 = 191
    // 191 % 10 = 1
    expect(computeCheckDigit("AB1234567")).toBe(1);
  });

  test("numeric only: 880101 (DOB)", () => {
    // 8*7 + 8*3 + 0*1 + 1*7 + 0*3 + 1*1
    // = 56 + 24 + 0 + 7 + 0 + 1 = 88
    // 88 % 10 = 8
    expect(computeCheckDigit("880101")).toBe(8);
  });
});

describe("validateCheckDigit", () => {
  test("valid check digit passes", () => {
    expect(validateCheckDigit("AB1234567", 1)).toBe(true);
  });

  test("invalid check digit fails", () => {
    expect(validateCheckDigit("AB1234567", 5)).toBe(false);
  });

  test("string digit works", () => {
    expect(validateCheckDigit("AB1234567", "1")).toBe(true);
  });

  test("null field returns false", () => {
    expect(validateCheckDigit(null, 0)).toBe(false);
  });

  test("null digit returns false", () => {
    expect(validateCheckDigit("AB1234567", null)).toBe(false);
  });
});

// ─── TD3 MRZ Detection ──────────────────────────────────────────────
describe("detectMRZ - TD3", () => {
  const SAMPLE_TD3 = [
    "P<CRIPERES<<JOSUE<DAVID<<<<<<<<<<<<<<<<<<<<<<",
    "AB12345671CRI8801015M2512311<<<<<<<<<<<<<<<<<08",
  ].join("\n");

  test("detects TD3 format", () => {
    const result = detectMRZ(SAMPLE_TD3);
    expect(result).not.toBeNull();
    expect(result.type).toBe("TD3");
    expect(result.format).toBe("TD3");
  });

  test("returns checkDigitsValid flag", () => {
    const result = detectMRZ(SAMPLE_TD3);
    expect(result).not.toBeNull();
    expect(typeof result.checkDigitsValid).toBe("boolean");
  });

  test("extracts surname and given names", () => {
    const result = detectMRZ(SAMPLE_TD3);
    expect(result).not.toBeNull();
    expect(result.parsed.surname).toBe("PERES");
    expect(result.parsed.givenNames).toBe("JOSUE DAVID");
  });

  test("extracts issuing country", () => {
    const result = detectMRZ(SAMPLE_TD3);
    expect(result).not.toBeNull();
    expect(result.parsed.issuingCountry).toBe("CRI");
  });

  test("extracts nationality", () => {
    const result = detectMRZ(SAMPLE_TD3);
    expect(result).not.toBeNull();
    expect(result.parsed.nationality).toBe("CRI");
  });

  test("extracts sex", () => {
    const result = detectMRZ(SAMPLE_TD3);
    expect(result).not.toBeNull();
    expect(result.parsed.sex).toBe("M");
  });

  test("returns null for garbage input", () => {
    expect(detectMRZ("hello world this is not a passport")).toBeNull();
    expect(detectMRZ("")).toBeNull();
    expect(detectMRZ(null)).toBeNull();
  });

  test("confidence is a number between 0 and 1", () => {
    const result = detectMRZ(SAMPLE_TD3);
    expect(result).not.toBeNull();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

// ─── OCR text extraction fallback ────────────────────────────────────
describe("extractFromOCRText", () => {
  test("returns empty object for null", () => {
    expect(extractFromOCRText(null)).toEqual({});
  });

  test("returns empty object for empty string", () => {
    expect(extractFromOCRText("")).toEqual({});
  });

  test("extracts passport number pattern", () => {
    const result = extractFromOCRText("Passport No: AB1234567\nName: John Doe");
    expect(result.passportNumber).toBe("AB1234567");
  });

  test("extracts nationality", () => {
    const result = extractFromOCRText("Nationality: CRI\nDate of birth: 01/01/1988");
    expect(result.nationality).toBe("CRI");
  });
});
