export const TICKET_MATCH_STATUS = Object.freeze({
  EXACT_MATCH: "EXACT_MATCH",
  PROBABLE_MATCH: "PROBABLE_MATCH",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  NO_MATCH: "NO_MATCH",
  AMBIGUOUS_PARTICIPANT: "AMBIGUOUS_PARTICIPANT",
});

const MONTHS = "JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC";
const DATE_TOKEN = new RegExp(`^\\d{1,2}(?:${MONTHS})(?:\\d{2,4})?$`, "i");
const TIME_TOKEN = /^(?:[01]?\d|2[0-3])[:.]?[0-5]\d$/;
const IATA_TOKEN = /^[A-Z]{3}$/;
const MIN_PROBABLE_SCORE = 0.78;
const CLEAR_MARGIN = 0.09;

export function normalizePersonName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanStem(fileName) {
  return String(fileName || "")
    .trim()
    .replace(/\.pdf$/i, "")
    .trim();
}

function findMetadataStart(tokens) {
  return tokens.findIndex((token) => DATE_TOKEN.test(token) || TIME_TOKEN.test(token));
}

export function parseTicketFilename(fileName) {
  const originalFileName = String(fileName || "");
  const extensionMatch = originalFileName.trim().match(/\.([^.]+)$/);
  const extension = extensionMatch?.[1]?.toLowerCase() || "";
  const isPdf = extension === "pdf";
  const stem = cleanStem(originalFileName).replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  const commaIndex = stem.indexOf(",");
  const warnings = [];
  let passengerPart = commaIndex >= 0 ? stem.slice(0, commaIndex) : stem;
  let metadataPart = commaIndex >= 0 ? stem.slice(commaIndex + 1) : "";

  if (commaIndex < 0) {
    const tokens = stem.split(" ").filter(Boolean);
    const metadataStart = findMetadataStart(tokens);
    if (metadataStart >= 0) {
      passengerPart = tokens.slice(0, metadataStart).join(" ");
      metadataPart = tokens.slice(metadataStart).join(" ");
    }
    warnings.push("El archivo no contiene coma; se separó usando los datos de vuelo detectados.");
  }

  const metadataTokens = metadataPart.replace(/[,;]+/g, " ").split(/\s+/).filter(Boolean);
  const dateIndex = metadataTokens.findIndex((token) => DATE_TOKEN.test(token));
  const timeIndex = metadataTokens.findIndex((token) => TIME_TOKEN.test(token));
  const flightDateRaw = dateIndex >= 0 ? metadataTokens[dateIndex].toUpperCase() : null;
  const flightTimeRaw = timeIndex >= 0 ? metadataTokens[timeIndex].replace(/[.:]/g, "") : null;
  const consumed = new Set([dateIndex, timeIndex].filter((index) => index >= 0));
  const originTokens = metadataTokens.filter((_, index) => !consumed.has(index));
  const originRaw = originTokens.length ? originTokens.join(" ") : null;
  const passengerNameRaw = passengerPart
    .replace(/[-_]+/g, " ")
    .replace(/[.,;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const passengerNameNormalized = normalizePersonName(passengerNameRaw);

  if (!isPdf) warnings.push("El archivo no es PDF.");
  if (!passengerNameNormalized) warnings.push("No se pudo identificar el nombre del pasajero.");
  if (!flightDateRaw) warnings.push("No se detectó fecha de vuelo.");
  if (!flightTimeRaw) warnings.push("No se detectó hora de vuelo.");
  if (!originRaw) warnings.push("No se detectó origen.");
  if (originRaw && originRaw.split(" ").length === 1 && IATA_TOKEN.test(originRaw)) {
    warnings.push(`Se detectó el código de aeropuerto ${originRaw.toUpperCase()}.`);
  }

  return {
    originalFileName,
    passengerNameRaw,
    passengerNameNormalized,
    flightDateRaw,
    flightTimeRaw,
    originRaw,
    extension,
    isPdf,
    isValidPattern: isPdf && passengerNameNormalized.split(" ").length >= 2,
    warnings,
  };
}

export function participantFullName(participant) {
  return [participant.firstName, participant.firstSurname, participant.secondSurname]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildParticipantNameVariants(participant) {
  const names = normalizePersonName(participant.firstName).split(" ").filter(Boolean);
  const firstSurname = normalizePersonName(participant.firstSurname);
  const secondSurname = normalizePersonName(participant.secondSurname);
  const values = [
    [...names, firstSurname, secondSurname],
    [...names, firstSurname],
    [names[0], firstSurname, secondSurname],
    [names[0], firstSurname],
  ].map((parts) => parts.filter(Boolean).join(" "));
  return [...new Set(values.filter((value) => value.split(" ").length >= 2))];
}

function orderedOverlapScore(ticketName, participant) {
  const actual = ticketName.split(" ").filter(Boolean);
  const expected = normalizePersonName(participantFullName(participant)).split(" ").filter(Boolean);
  const shared = actual.filter((token) => expected.includes(token));
  if (shared.length < 2 || !actual.includes(normalizePersonName(participant.firstSurname)))
    return 0;
  const coverage = shared.length / Math.max(actual.length, expected.length);
  const surnameBonus =
    participant.secondSurname && actual.includes(normalizePersonName(participant.secondSurname))
      ? 0.08
      : 0;
  const ordered = shared.join(" ") === expected.filter((token) => actual.includes(token)).join(" ");
  return Math.min(0.99, coverage * 0.9 + surnameBonus + (ordered ? 0.06 : 0));
}

function result(participant, status, confidence, matchedVariant, reasons, alternatives = []) {
  return {
    participantId: participant?.id || null,
    participantName: participant ? participantFullName(participant) : null,
    participant: participant || null,
    status,
    confidence,
    matchedVariant,
    reasons,
    alternatives,
  };
}

export function matchTicketToParticipant(parsedTicket, participants = []) {
  const target = parsedTicket?.passengerNameNormalized || "";
  if (target.split(" ").length < 2) {
    return result(null, TICKET_MATCH_STATUS.NO_MATCH, 0, null, [
      "El nombre es demasiado corto para asociarlo con seguridad",
    ]);
  }
  const active = participants.filter((participant) => !participant.isRemoved);
  const exact = active.filter(
    (participant) => normalizePersonName(participantFullName(participant)) === target
  );
  if (exact.length === 1)
    return result(exact[0], TICKET_MATCH_STATUS.EXACT_MATCH, 1, target, [
      "Nombre completo normalizado idéntico",
    ]);
  if (exact.length > 1)
    return result(
      null,
      TICKET_MATCH_STATUS.AMBIGUOUS_PARTICIPANT,
      1,
      target,
      ["Hay varios participantes con el mismo nombre"],
      exact.map((p) => ({
        participantId: p.id,
        participantName: participantFullName(p),
        confidence: 1,
      }))
    );

  const variantMatches = active.filter((participant) =>
    buildParticipantNameVariants(participant).slice(1).includes(target)
  );
  if (variantMatches.length === 1)
    return result(variantMatches[0], TICKET_MATCH_STATUS.PROBABLE_MATCH, 0.92, target, [
      "Coincidencia por una variante segura del nombre; puede faltar un nombre o apellido",
    ]);
  if (variantMatches.length > 1)
    return result(
      null,
      TICKET_MATCH_STATUS.AMBIGUOUS_PARTICIPANT,
      0.92,
      target,
      ["La variante coincide con más de un participante"],
      variantMatches.map((p) => ({
        participantId: p.id,
        participantName: participantFullName(p),
        confidence: 0.92,
      }))
    );

  const ranked = active
    .map((participant) => ({ participant, score: orderedOverlapScore(target, participant) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const second = ranked[1];
  const alternatives = ranked
    .slice(1, 4)
    .map(({ participant, score }) => ({
      participantId: participant.id,
      participantName: participantFullName(participant),
      confidence: Number(score.toFixed(2)),
    }));
  if (best?.score >= MIN_PROBABLE_SCORE && (!second || best.score - second.score >= CLEAR_MARGIN))
    return result(
      best.participant,
      TICKET_MATCH_STATUS.PROBABLE_MATCH,
      Number(best.score.toFixed(2)),
      null,
      ["Coincidencia conservadora por tokens completos y apellidos"],
      alternatives
    );
  if (best?.score >= MIN_PROBABLE_SCORE - 0.08)
    return result(
      null,
      TICKET_MATCH_STATUS.REVIEW_REQUIRED,
      Number(best.score.toFixed(2)),
      null,
      ["Hay candidatos cercanos; se requiere confirmar el participante"],
      ranked
        .slice(0, 3)
        .map(({ participant, score }) => ({
          participantId: participant.id,
          participantName: participantFullName(participant),
          confidence: Number(score.toFixed(2)),
        }))
    );
  return result(
    null,
    TICKET_MATCH_STATUS.NO_MATCH,
    best ? Number(best.score.toFixed(2)) : 0,
    null,
    ["Ningún participante alcanza el umbral seguro"],
    alternatives
  );
}

export function detectTicketDuplicates(rows) {
  const countBy = (keyFor) =>
    rows.reduce((counts, row) => {
      const key = keyFor(row);
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
      return counts;
    }, new Map());
  const fileKeyFor = (row) =>
    `${row.file.name.toLowerCase()}|${row.file.size}|${row.file.lastModified}`;
  const assignmentKeyFor = (row) =>
    row.match.participantId ? `${row.itineraryId}|${row.match.participantId}` : null;
  const fileCounts = countBy(fileKeyFor);
  const assignmentCounts = countBy(assignmentKeyFor);
  return rows.map((row) => ({
    ...row,
    duplicateFile: fileCounts.get(fileKeyFor(row)) > 1,
    duplicateAssignment: (assignmentCounts.get(assignmentKeyFor(row)) || 0) > 1,
  }));
}
