/**
 * tourParticipantsExport.js
 * Exports the tour's participants, grouped by itinerary, to a branded .xlsx file.
 * Visual pattern mirrors layouts/ensembles/ensembleExport.js.
 */

const NAVYhex = "293964";
const GOLDhex = "E08B03";
const LIGHThex = "F8F9FC";
const RULEhex = "DAE0EB";
const TEXThex = "1D2949";

const AVIANCA_HEADERS = [
  "Reservation Number",
  "Last Name",
  "First Name and Middle Name",
  "Title",
  "PTC",
  "Gender",
  "Date of Birth",
  "Passport Last Name",
  "Passport First Name",
  "Passport Number",
  "Passport Nationality",
  "Passport Issue Country",
  "Passport Expiry Date",
  "Visa Number",
  "Visa Type",
  "Visa Issue Date",
  "Place of Birth",
  "Visa Place of Issue",
  "Visa Country of Application",
  "Address Type",
  "Address Country",
  "Address Details",
  "Address City",
  "Address State",
  "Address Zip Code",
];

function slugify(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function itineraryAirline(itinerary = {}) {
  return (itinerary.flights || []).find((flight) => flight.airline)?.airline || "Aerolinea";
}

function itineraryRoute(itinerary = {}) {
  return (itinerary.flights || [])
    .filter((flight) => flight.origin && flight.destination)
    .map((flight) => `${flight.origin}-${flight.destination}`)
    .join("_");
}

function exportFileName(tourName, itineraries) {
  const included = itineraries.filter((itinerary) => (itinerary.participants || []).length > 0);
  if (included.length === 1) {
    const itinerary = included[0];
    const parts = [
      "Nombres",
      itineraryAirline(itinerary),
      itinerary.reservationNumber || "Sin reserva",
      itineraryRoute(itinerary) || itinerary.name,
    ];
    return `${slugify(parts.join("_"))}.xlsx`;
  }

  const aviancaItineraries = included.filter(isAviancaItinerary);
  if (aviancaItineraries.length > 0) {
    const reservations = aviancaItineraries
      .map((itinerary) => itinerary.reservationNumber)
      .filter(Boolean)
      .join("_");
    const routes = aviancaItineraries.map(itineraryRoute).filter(Boolean).join("__");
    const baseName = slugify(
      ["Nombres", "Avianca", reservations || "Sin reservas", routes || "Varias rutas"].join("_")
    );
    return `${baseName.slice(0, 180)}.xlsx`;
  }

  return `${slugify(`${tourName}_nombres_por_itinerario`)}.xlsx`;
}

function participantFullName(p = {}) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

function airlineText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function aviancaText(value = "") {
  return airlineText(value).trim().replace(/\s+/g, " ");
}

function isAviancaItinerary(itinerary = {}) {
  return (itinerary.flights || []).some((flight) =>
    airlineText(flight.airline).includes("AVIANCA")
  );
}

function formatAviancaDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${day}${month[date.getUTCMonth()]}${date.getUTCFullYear()}`;
}

function aviancaGender(value) {
  if (value === "M" || value === "F") return value;
  return "";
}

function passengerTypeCode(birthDate, departureAt) {
  if (!birthDate || !departureAt) return "";
  const birth = new Date(birthDate);
  const departure = new Date(departureAt);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(departure.getTime())) return "";

  let age = departure.getUTCFullYear() - birth.getUTCFullYear();
  const birthdayHasPassed =
    departure.getUTCMonth() > birth.getUTCMonth() ||
    (departure.getUTCMonth() === birth.getUTCMonth() &&
      departure.getUTCDate() >= birth.getUTCDate());
  if (!birthdayHasPassed) age--;
  if (age < 2) return "INF";
  if (age < 12) return "CHD";
  return "ADT";
}

function aviancaRow(p = {}, departureAt, reservationNumber) {
  const passport = p.__aviancaDocuments?.passport || {};
  const visa = p.__aviancaDocuments?.visa || {};
  const passengerLastName =
    passport.surname || [p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
  const passengerGivenNames = passport.givenNames || p.firstName;

  return [
    String(reservationNumber || "").trim(),
    aviancaText(passengerLastName),
    aviancaText(passengerGivenNames),
    "",
    passengerTypeCode(passport.dateOfBirth || p.birthDate, departureAt),
    aviancaGender(passport.sex || p.sex),
    formatAviancaDate(passport.dateOfBirth || p.birthDate),
    aviancaText(passport.surname),
    aviancaText(passport.givenNames),
    String(passport.passportNumber || passport.documentNumber || p.passportNumber || "").trim(),
    aviancaText(passport.nationality),
    aviancaText(passport.issuingCountry),
    formatAviancaDate(passport.expirationDate || p.passportExpiry),
    String(visa.visaControlNumber || visa.documentNumber || "").trim(),
    aviancaText(visa.visaType),
    formatAviancaDate(visa.issueDate),
    "",
    aviancaText(visa.issuingCountry),
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];
}

function uniqueSheetName(baseName, usedNames) {
  const sanitized = String(baseName || "Avianca")
    .replace(/[\\/?*\[\]:]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Avianca";
  let candidate = sanitized.slice(0, 31);
  let suffix = 2;
  while (usedNames.has(candidate)) {
    const ending = ` ${suffix}`;
    candidate = `${sanitized.slice(0, 31 - ending.length)}${ending}`;
    suffix++;
  }
  usedNames.add(candidate);
  return candidate;
}

function appendAviancaSheets(XLSX, workbook, itineraries) {
  const aviancaItineraries = itineraries.filter(isAviancaItinerary);
  const usedNames = new Set(workbook.SheetNames);

  aviancaItineraries.forEach((itinerary, index) => {
    const firstDepartureAt = (itinerary.flights || [])
      .map((flight) => flight.departureAt)
      .filter(Boolean)
      .sort((a, b) => new Date(a) - new Date(b))[0];
    const members = [...(itinerary.participants || [])].sort((a, b) => {
      const surnameA = [a.firstSurname, a.secondSurname].filter(Boolean).join(" ");
      const surnameB = [b.firstSurname, b.secondSurname].filter(Boolean).join(" ");
      return (
        surnameA.localeCompare(surnameB, "es") ||
        String(a.firstName || "").localeCompare(String(b.firstName || ""), "es")
      );
    });
    const ws = XLSX.utils.aoa_to_sheet([
      AVIANCA_HEADERS,
      ...members.map((participant) =>
        aviancaRow(participant, firstDepartureAt, itinerary.reservationNumber)
      ),
    ]);

    ws["!cols"] = AVIANCA_HEADERS.map((header) => ({
      wch: Math.max(12, Math.min(30, header.length + 2)),
    }));
    ws["!autofilter"] = {
      ref: `A1:${XLSX.utils.encode_col(AVIANCA_HEADERS.length - 1)}${Math.max(
        1,
        members.length + 1
      )}`,
    };
    ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" };

    AVIANCA_HEADERS.forEach((_, colIdx) => {
      const ref = `${XLSX.utils.encode_col(colIdx)}1`;
      if (ws[ref]) {
        ws[ref].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "C8102E" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            top: { style: "thin", color: { rgb: RULEhex } },
            bottom: { style: "thin", color: { rgb: RULEhex } },
            left: { style: "thin", color: { rgb: RULEhex } },
            right: { style: "thin", color: { rgb: RULEhex } },
          },
        };
      }
    });

    const reservation = itinerary.reservationNumber
      ? `AV ${itinerary.reservationNumber}`
      : `Avianca ${index + 1}`;
    XLSX.utils.book_append_sheet(
      workbook,
      ws,
      uniqueSheetName(reservation, usedNames)
    );
  });
}

function givenNames(p = {}) {
  const names = String(p.firstName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return {
    first: names[0] || "—",
    second: names.slice(1).join(" ") || "—",
  };
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function sexLabel(value) {
  if (value === "M") return "Masculino";
  if (value === "F") return "Femenino";
  if (value === "OTHER") return "Otro";
  return "—";
}

function visaLabel(p = {}) {
  if (p.visaStatus === "DENIED") return "Negada";
  if (p.visaStatus === "APPROVED") return "Aprobada";
  if (p.visaStatus) return p.visaStatus;
  return "—";
}

function isLeaderOrStaff(p, leaderIds) {
  return leaderIds.has(p.id) || p.role === "STAFF";
}

function roleLabel(p, isLeader, fallback = "Pasajero") {
  if (isLeader) return "Líder";
  if (p.role === "STAFF") return "Staff";
  return fallback;
}

function sortMembers(members) {
  return [...members].sort((a, b) => {
    if (a.__priority !== b.__priority) return a.__priority - b.__priority;
    if (a.__priority === 0) {
      return participantFullName(a).localeCompare(participantFullName(b), "es");
    }
    const sectionA = (a.instrument || "").trim();
    const sectionB = (b.instrument || "").trim();
    const bySection = sectionA.localeCompare(sectionB, "es");
    if (bySection !== 0) return bySection;
    return participantFullName(a).localeCompare(participantFullName(b), "es");
  });
}

function buildGroups(itineraries = [], unassignedParticipants = []) {
  const groups = itineraries.map((it) => {
    const leaderIds = new Set((it.leaders || []).map((l) => l.id));
    const members = sortMembers(
      (it.participants || []).map((p) => ({
        ...p,
        __itinerary: it.name,
        __reservationNumber: it.reservationNumber || "—",
        __role: roleLabel(p, leaderIds.has(p.id)),
        __priority: isLeaderOrStaff(p, leaderIds) ? 0 : 1,
      }))
    );
    return { name: it.name, members };
  });

  if (unassignedParticipants.length > 0) {
    const noLeaders = new Set();
    groups.push({
      name: "Sin itinerario",
      members: sortMembers(
        unassignedParticipants.map((p) => ({
          ...p,
          __itinerary: "Sin itinerario",
          __reservationNumber: "—",
          __role: roleLabel(p, false, "—"),
          __priority: isLeaderOrStaff(p, noLeaders) ? 0 : 1,
        }))
      ),
    });
  }

  return groups;
}

export async function exportTourParticipantsXLSX({
  tourName = "Gira",
  itineraries = [],
  unassignedParticipants = [],
}) {
  const XLSX = await import("xlsx-js-style");

  const dateStr = new Date().toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const groups = buildGroups(itineraries, unassignedParticipants);
  const totalParticipants = groups.reduce((sum, g) => sum + g.members.length, 0);

  const wb = XLSX.utils.book_new();

  const headerCols = [
    "Número de reserva",
    "Primer apellido",
    "Segundo apellido",
    "Primer nombre",
    "Segundo nombre",
    "Nacimiento",
    "Pasaporte",
    "Vence",
    "Identificación",
    "Sexo",
    "Instrumento",
    "Itinerario",
    "Rol",
    "Visa",
  ];
  const lastColIdx = headerCols.length - 1;
  const aoa = [];
  aoa.push([tourName]);
  aoa.push([
    `Participantes por itinerario · ${totalParticipants} participante${
      totalParticipants !== 1 ? "s" : ""
    }`,
  ]);
  aoa.push([`Generado: ${dateStr}`]);
  aoa.push([]);
  aoa.push(headerCols);

  const groupHeaderRowIdxs = new Set();
  let currentRow = 5;

  for (const group of groups) {
    groupHeaderRowIdxs.add(currentRow);
    const reservationNumber = group.members[0]?.__reservationNumber;
    const reservationLabel =
      reservationNumber && reservationNumber !== "—" ? `   ·   Reserva ${reservationNumber}` : "";
    aoa.push([
      `${group.name}${reservationLabel}   ·   ${group.members.length} participante${
        group.members.length !== 1 ? "s" : ""
      }`,
    ]);
    currentRow++;

    for (const p of group.members) {
      const names = givenNames(p);
      aoa.push([
        p.__reservationNumber,
        p.firstSurname || "—",
        p.secondSurname || "—",
        names.first,
        names.second,
        formatDate(p.birthDate),
        p.passportNumber || "—",
        formatDate(p.passportExpiry),
        p.identification || "—",
        sexLabel(p.sex),
        p.instrument || "—",
        p.__itinerary,
        p.__role,
        visaLabel(p),
      ]);
      currentRow++;
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws["!cols"] = [
    { wch: 19 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 22 },
    { wch: 13 },
    { wch: 16 },
    { wch: 13 },
    { wch: 17 },
    { wch: 12 },
    { wch: 18 },
    { wch: 24 },
    { wch: 12 },
    { wch: 12 },
  ];

  ws["!autofilter"] = { ref: `A5:${XLSX.utils.encode_col(lastColIdx)}5` };
  ws["!freeze"] = { xSplit: 0, ySplit: 5, topLeftCell: "A6", activePane: "bottomLeft" };

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIdx } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIdx } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastColIdx } },
    ...[...groupHeaderRowIdxs].map((ri) => ({
      s: { r: ri, c: 0 },
      e: { r: ri, c: lastColIdx },
    })),
  ];

  function S(ref, style) {
    if (ws[ref]) ws[ref].s = style;
  }

  S("A1", {
    font: { bold: true, sz: 18, color: { rgb: NAVYhex } },
    alignment: { horizontal: "left", vertical: "center" },
  });
  S("A2", {
    font: { sz: 10, italic: true, color: { rgb: "475569" } },
    alignment: { horizontal: "left", vertical: "center" },
  });
  S("A3", {
    font: { sz: 10, italic: true, color: { rgb: "94A3B8" } },
    alignment: { horizontal: "left", vertical: "center" },
  });

  headerCols.forEach((_, colIdx) => {
    const ref = `${XLSX.utils.encode_col(colIdx)}5`;
    S(ref, {
      font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: NAVYhex } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: RULEhex } },
        bottom: { style: "medium", color: { rgb: GOLDhex } },
        left: { style: "thin", color: { rgb: RULEhex } },
        right: { style: "thin", color: { rgb: RULEhex } },
      },
    });
  });

  for (const ri of groupHeaderRowIdxs) {
    const excelRow = ri + 1;
    S(`A${excelRow}`, {
      font: { bold: true, sz: 10, color: { rgb: NAVYhex } },
      fill: { fgColor: { rgb: "EDF1F9" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: RULEhex } },
        bottom: { style: "thin", color: { rgb: RULEhex } },
        left: { style: "thin", color: { rgb: RULEhex } },
        right: { style: "thin", color: { rgb: RULEhex } },
      },
    });
  }

  for (let r = 6; r <= aoa.length; r++) {
    if (groupHeaderRowIdxs.has(r - 1)) continue;
    headerCols.forEach((_, colIdx) => {
      const ref = `${XLSX.utils.encode_col(colIdx)}${r}`;
      S(ref, {
        font: { sz: 10, color: { rgb: TEXThex } },
        alignment: { vertical: "center", horizontal: "left" },
        fill: { fgColor: { rgb: r % 2 === 0 ? LIGHThex : "FFFFFF" } },
        border: {
          top: { style: "thin", color: { rgb: RULEhex } },
          bottom: { style: "thin", color: { rgb: RULEhex } },
          left: { style: "thin", color: { rgb: RULEhex } },
          right: { style: "thin", color: { rgb: RULEhex } },
        },
      });
    });
  }

  const summAoa = [[`RESUMEN — ${tourName}`], [], ["Itinerario", "Participantes"]];
  for (const g of groups) summAoa.push([g.name, g.members.length]);
  summAoa.push(["Total", totalParticipants]);

  const wsSumm = XLSX.utils.aoa_to_sheet(summAoa);
  wsSumm["!cols"] = [{ wch: 32 }, { wch: 16 }];
  wsSumm["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

  function SS(ref, style) {
    if (wsSumm[ref]) wsSumm[ref].s = style;
  }
  SS("A1", {
    font: { bold: true, sz: 16, color: { rgb: NAVYhex } },
    alignment: { horizontal: "left", vertical: "center" },
  });
  ["A3", "B3"].forEach((ref) => {
    SS(ref, {
      font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: NAVYhex } },
      alignment: { horizontal: "left", vertical: "center" },
      border: { bottom: { style: "medium", color: { rgb: GOLDhex } } },
    });
  });

  XLSX.utils.book_append_sheet(wb, ws, "Participantes");
  XLSX.utils.book_append_sheet(wb, wsSumm, "Resumen");
  appendAviancaSheets(XLSX, wb, itineraries);

  XLSX.writeFile(wb, exportFileName(tourName, itineraries));
}
