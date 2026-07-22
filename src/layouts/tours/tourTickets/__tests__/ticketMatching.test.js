import {
  buildParticipantNameVariants,
  detectTicketDuplicates,
  matchTicketToParticipant,
  normalizePersonName,
  parseTicketFilename,
} from "../ticketMatching";

const participants = [
  { id: "1", firstName: "Sofía Elena", firstSurname: "Mora", secondSurname: "Vega" },
  { id: "2", firstName: "Mateo", firstSurname: "Solís", secondSurname: "Rojas" },
  { id: "3", firstName: "Mateo", firstSurname: "Solís", secondSurname: "Castro" },
  { id: "4", firstName: "Emma Lucía", firstSurname: "Del Valle", secondSurname: "Núñez" },
];

describe("parseTicketFilename", () => {
  test.each([
    [
      "SOFIA ELENA MORA VEGA, 26DEC 0500 SAN JOSE.pdf",
      "SOFIA ELENA MORA VEGA",
      "26DEC",
      "0500",
      "SAN JOSE",
      true,
    ],
    ["SOFÍA_MORA_VEGA, 26DEC 0500 SJO.PDF", "SOFÍA MORA VEGA", "26DEC", "0500", "SJO", true],
    [
      "EMMA-LUCIA-DEL-VALLE-NUNEZ 26DEC 0500 SAN JOSE.pdf",
      "EMMA LUCIA DEL VALLE NUNEZ",
      "26DEC",
      "0500",
      "SAN JOSE",
      true,
    ],
    ["MATEO SOLIS ROJAS, SAN JOSE.pdf", "MATEO SOLIS ROJAS", null, null, "SAN JOSE", true],
    ["MATEO SOLIS, 26DEC SAN JOSE.pdf", "MATEO SOLIS", "26DEC", null, "SAN JOSE", true],
    ["MATEO SOLIS, 0500.pdf", "MATEO SOLIS", null, "0500", null, true],
    ["notas.txt", "notas txt", null, null, null, false],
    ["", "", null, null, null, false],
  ])("analiza %s", (name, passenger, date, time, origin, isPdf) => {
    const parsed = parseTicketFilename(name);
    expect(parsed.passengerNameRaw).toBe(passenger);
    expect(parsed.flightDateRaw).toBe(date);
    expect(parsed.flightTimeRaw).toBe(time);
    expect(parsed.originRaw).toBe(origin);
    expect(parsed.isPdf).toBe(isPdf);
  });
  test("normaliza tildes, puntuación y espacios", () =>
    expect(normalizePersonName("  Sofía--Mora,  Vega ")).toBe("sofia mora vega"));
});

describe("matching determinista", () => {
  const match = (name, list = participants) =>
    matchTicketToParticipant(parseTicketFilename(`${name}.pdf`), list);
  test("encuentra coincidencia exacta única con tildes distintas", () =>
    expect(match("SOFIA ELENA MORA VEGA").status).toBe("EXACT_MATCH"));
  test("acepta variante segura sin segundo apellido", () =>
    expect(match("SOFIA ELENA MORA").status).toBe("PROBABLE_MATCH"));
  test("no elige entre candidatos ambiguos", () =>
    expect(match("MATEO SOLIS").status).toBe("AMBIGUOUS_PARTICIPANT"));
  test("rechaza nombre corto", () => expect(match("MATEO").status).toBe("NO_MATCH"));
  test("retorna sin coincidencia", () =>
    expect(match("VALERIA CAMPOS DURAN").status).toBe("NO_MATCH"));
  test("detecta nombres completos idénticos", () =>
    expect(
      match("SOFIA ELENA MORA VEGA", [...participants, { ...participants[0], id: "5" }]).status
    ).toBe("AMBIGUOUS_PARTICIPANT"));
  test("crea variantes controladas para apellidos compuestos", () =>
    expect(buildParticipantNameVariants(participants[3])).toContain("emma lucia del valle"));
});

describe("duplicados", () => {
  const file = { name: "SOFIA.pdf", size: 10, lastModified: 1 };
  const base = { file, itineraryId: "i1", match: { participantId: "1" } };
  test("marca ambos archivos repetidos", () =>
    expect(detectTicketDuplicates([base, { ...base }]).every((row) => row.duplicateFile)).toBe(
      true
    ));
  test("marca dos archivos distintos para la misma asignación", () =>
    expect(
      detectTicketDuplicates([base, { ...base, file: { ...file, name: "SOFIA 2.pdf" } }]).every(
        (row) => row.duplicateAssignment
      )
    ).toBe(true));
});
