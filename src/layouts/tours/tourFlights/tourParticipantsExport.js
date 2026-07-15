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

function slugify(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function participantFullName(p = {}) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
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

  XLSX.writeFile(wb, `${slugify(tourName)}_participantes_itinerario.xlsx`);
}
