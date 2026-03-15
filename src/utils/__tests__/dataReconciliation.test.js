import { reconcileData, formatForBackend } from "../dataReconciliation";

describe("reconcileData", () => {
  test("returns NO_DATA_SOURCES when both null", () => {
    const result = reconcileData(null, null);
    expect(result.reasonCodes).toContain("NO_DATA_SOURCES");
    expect(result.confidence).toBe(0);
    expect(result.mrzValid).toBe(false);
  });

  test("MRZ_NOT_DETECTED when only OCR present", () => {
    const result = reconcileData(null, { fullName: "John Doe", nationality: "USA" });
    expect(result.reasonCodes).toContain("MRZ_NOT_DETECTED");
    expect(result.fields.fullName).toBe("John Doe");
    expect(result.fields.nationality).toBe("USA");
    expect(result.mrzValid).toBe(false);
  });

  test("MRZ wins for authoritative fields when check digits valid", () => {
    const mrz = {
      surname: "PERES",
      givenNames: "JOSUE DAVID",
      nationality: "CRI",
      passportNumber: "AB1234567",
      dateOfBirth: "1988-01-01",
      expirationDate: "2025-12-31",
      sex: "M",
    };
    const ocr = {
      fullName: "Josue David Peres",
      nationality: "Costa Rica",
      passportNumber: "AB1234S67",  // OCR misread
    };

    const result = reconcileData(mrz, ocr, { mrzCheckDigitsValid: true, mrzConfidence: 0.95 });
    expect(result.fields.surname).toBe("PERES");
    expect(result.fields.nationality).toBe("CRI");
    expect(result.fields.passportNumber).toBe("AB1234567");
    expect(result.mrzValid).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  test("records CONFLICT reason codes when MRZ and OCR disagree", () => {
    const mrz = { nationality: "CRI" };
    const ocr = { nationality: "USA" };

    const result = reconcileData(mrz, ocr, { mrzCheckDigitsValid: true });
    expect(result.reasonCodes).toContain("CONFLICT_NATIONALITY_MRZ_WINS");
  });

  test("OCR fills in OCR-only fields (issueDate, visaType)", () => {
    const mrz = { surname: "DOE", givenNames: "JOHN" };
    const ocr = { issueDate: "2020-01-01", visaType: "B1/B2" };

    const result = reconcileData(mrz, ocr, { mrzCheckDigitsValid: true });
    expect(result.fields.issueDate).toBe("2020-01-01");
    expect(result.fields.visaType).toBe("B1/B2");
    expect(result.sources.issueDate).toBe("OCR");
  });

  test("fullName computed from parts when not present", () => {
    const mrz = { surname: "DOE", givenNames: "JOHN" };
    const result = reconcileData(mrz, null, { mrzCheckDigitsValid: true });
    expect(result.fields.fullName).toBe("JOHN DOE");
    expect(result.sources.fullName).toBe("MERGED");
  });

  test("documentNumber mapped to passportNumber", () => {
    const mrz = { documentNumber: "XY9876543" };
    const result = reconcileData(mrz, null, { mrzCheckDigitsValid: true });
    expect(result.fields.passportNumber).toBe("XY9876543");
  });

  test("MRZ with failed check digits still preferred but flagged", () => {
    const mrz = { nationality: "CRI" };
    const result = reconcileData(mrz, null, { mrzCheckDigitsValid: false, mrzConfidence: 0.6 });
    expect(result.fields.nationality).toBe("CRI");
    expect(result.reasonCodes).toContain("MRZ_CHECKDIGIT_FAIL_NATIONALITY");
    expect(result.mrzValid).toBe(false);
  });
});

describe("formatForBackend", () => {
  test("maps reconciled data to backend schema", () => {
    const reconciled = {
      fields: {
        fullName: "JOHN DOE",
        givenNames: "JOHN",
        surname: "DOE",
        nationality: "USA",
        passportNumber: "AB1234567",
        dateOfBirth: "1988-01-01",
        expirationDate: "2025-12-31",
        sex: "M",
      },
      reasonCodes: ["CONFLICT_NATIONALITY_MRZ_WINS"],
      mrzValid: true,
    };

    const ocrResult = {
      text: "some ocr text",
      confidence: 85,
      mrz: { raw: "P<USADOE<<JOHN...", format: "TD3" },
    };

    const backend = formatForBackend(reconciled, ocrResult);
    expect(backend.fullName).toBe("JOHN DOE");
    expect(backend.mrzRaw).toBe("P<USADOE<<JOHN...");
    expect(backend.mrzValid).toBe(true);
    expect(backend.mrzFormat).toBe("TD3");
    expect(backend.reasonCodes).toContain("CONFLICT_NATIONALITY_MRZ_WINS");
    expect(backend.ocrConfidence).toBeCloseTo(0.85);
  });

  test("handles null OCR result gracefully", () => {
    const reconciled = {
      fields: { fullName: "Test" },
      reasonCodes: [],
      mrzValid: false,
    };

    const backend = formatForBackend(reconciled, null);
    expect(backend.fullName).toBe("Test");
    expect(backend.mrzRaw).toBeNull();
    expect(backend.ocrConfidence).toBeNull();
  });

  test("converts dates to ISO format", () => {
    const reconciled = {
      fields: {
        dateOfBirth: "1988-01-01",
        expirationDate: "2025-12-31",
      },
      reasonCodes: [],
      mrzValid: false,
    };

    const backend = formatForBackend(reconciled);
    expect(backend.dateOfBirth).toBe("1988-01-01T00:00:00.000Z");
    expect(backend.expirationDate).toBe("2025-12-31T00:00:00.000Z");
  });
});
