/**
 * ensembleExport.js
 *
 */

import logoBCDB from "../../assets/images/LOGO BCDB.png";

// ─── Paleta ───────────────────────────────────────────────────────────────────
const NAVY = [41, 57, 100];      // #293964
const GOLD = [224, 139, 3];      // #E08B03
const WHITE = [255, 255, 255];
const LIGHT = [248, 249, 252];
const RULE = [218, 224, 235];
const SLATE = [96, 112, 138];
const TEXT = [29, 41, 73];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_LABEL = {
  MARCHING: "Marcha",
  BIG_BAND: "Big Band",
  CONCERT: "Concierto",
  OTHER: "Otro",
};

function categoryLabel(cat) {
  return CATEGORY_LABEL[cat] || cat || "";
}

function userFullName(u = {}) {
  return [u.name, u.firstSurName, u.secondSurName].filter(Boolean).join(" ");
}

function slugify(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

const INSTRUMENT_SECTION_ORDER = [
  "Flauta",
  "Clarinete",
  "Saxofon",
  "Eufonios",
  "Corno francés",
  "Trompetas",
  "Trombones",
  "Tubas",
  "Mallets",
  "Percusión",
];

function normalizeText(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const INSTRUMENT_ALIASES = {
  flauta: "Flauta",

  clarinete: "Clarinete",
  clarinetes: "Clarinete",

  saxofon: "Saxofon",
  saxofones: "Saxofon",
  saxo: "Saxofon",
  "saxofon alto": "Saxofon",
  "saxofon tenor": "Saxofon",
  "saxofon baritono": "Saxofon",
  "saxofon soprano": "Saxofon",

  eufonio: "Eufonios",
  eufonios: "Eufonios",
  bombardino: "Eufonios",
  bombardinos: "Eufonios",

  "corno frances": "Corno francés",
  corno: "Corno francés",
  cornos: "Corno francés",

  trompeta: "Trompetas",
  trompetas: "Trompetas",

  trombon: "Trombones",
  trombones: "Trombones",

  tuba: "Tubas",
  tubas: "Tubas",

  mallet: "Mallets",
  mallets: "Mallets",

  percusion: "Percusión",
  percusiones: "Percusión",
};

const INSTRUMENT_ORDER_INDEX = new Map(
  INSTRUMENT_SECTION_ORDER.map((name, index) => [normalizeText(name), index])
);

function canonicalInstrumentName(instrument = "") {
  const normalized = normalizeText(instrument);
  return INSTRUMENT_ALIASES[normalized] || instrument || "Sin instrumento";
}

function groupByInstrument(members = []) {
  const map = new Map();

  for (const u of members) {
    const key = canonicalInstrumentName(u?.instrument);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(u);
  }

  return [...map.entries()]
    .sort(([a], [b]) => {
      const aIndex = INSTRUMENT_ORDER_INDEX.has(normalizeText(a))
        ? INSTRUMENT_ORDER_INDEX.get(normalizeText(a))
        : Number.MAX_SAFE_INTEGER;

      const bIndex = INSTRUMENT_ORDER_INDEX.has(normalizeText(b))
        ? INSTRUMENT_ORDER_INDEX.get(normalizeText(b))
        : Number.MAX_SAFE_INTEGER;

      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.localeCompare(b, "es");
    })
    .map(([instrument, users]) => ({
      instrument,
      members: users.sort((a, b) =>
        userFullName(a).localeCompare(userFullName(b), "es")
      ),
    }));
}

async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo cargar la imagen");
    const blob = await res.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function fitContain(boxW, boxH, imgW, imgH) {
  if (!imgW || !imgH) {
    return { w: boxW, h: boxH, x: 0, y: 0 };
  }

  const scale = Math.min(boxW / imgW, boxH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;

  return {
    w,
    h,
    x: (boxW - w) / 2,
    y: (boxH - h) / 2,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function exportEnsemblePDF({
  ensemble,
  members = [],
  tabLabel = "Miembros",
}) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();

  const ensembleName = ensemble?.name || ensemble?.key || "Agrupación";
  const category = categoryLabel(ensemble?.category);
  const groups = groupByInstrument(members);

  const now = new Date();
  const dateStr = now.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let logoData = null;
  if (ensemble?.logoUrl) logoData = await fetchImageAsBase64(ensemble.logoUrl);
  if (!logoData) logoData = await fetchImageAsBase64(logoBCDB);

  const MARGIN = 16;
  const FIRST_HEADER_H = 34;
  const NORMAL_TOP = 14;
  const LAST_FOOTER_H = 10;

  function drawPageBase() {
    doc.setFillColor(...LIGHT);
    doc.rect(0, 0, PW, PH, "F");
  }

  function drawFirstPageHeader() {
    const cardX = MARGIN;
    const cardY = 8;
    const cardW = PW - MARGIN * 2;
    const cardH = 24;

    doc.setFillColor(...WHITE);
    doc.roundedRect(cardX, cardY, cardW, cardH, 3, 3, "F");
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.35);
    doc.roundedRect(cardX, cardY, cardW, cardH, 3, 3, "S");

    doc.setFillColor(...NAVY);
    doc.roundedRect(cardX, cardY, cardW, 5.8, 3, 3, "F");
    doc.setFillColor(...GOLD);
    doc.rect(cardX, cardY + 5.3, cardW, 0.8, "F");

    const logoBoxX = cardX + 6;
    const logoBoxY = cardY + 8.2;
    const logoBoxW = 28;
    const logoBoxH = 12;

    doc.setFillColor(252, 253, 255);
    doc.roundedRect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, 2, 2, "F");
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.25);
    doc.roundedRect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, 2, 2, "S");

    if (logoData) {
      try {
        const props = doc.getImageProperties(logoData);
        const fit = fitContain(
          logoBoxW - 2.8,
          logoBoxH - 2.8,
          props.width,
          props.height
        );

        doc.addImage(
          logoData,
          "PNG",
          logoBoxX + 1.4 + fit.x,
          logoBoxY + 1.4 + fit.y,
          fit.w,
          fit.h,
          undefined,
          "FAST"
        );
      } catch {
        const initials = ensembleName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...NAVY);
        doc.text(initials, logoBoxX + logoBoxW / 2, logoBoxY + logoBoxH / 2 + 3, {
          align: "center",
        });
      }
    }

    const textX = logoBoxX + logoBoxW + 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...NAVY);
    doc.text(ensembleName, textX, cardY + 11.5);

    if (category) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...GOLD);
      doc.text(category.toUpperCase(), textX, cardY + 17.2);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text(
      `${members.length} integrante${members.length !== 1 ? "s" : ""} · ${groups.length} instrumento${groups.length !== 1 ? "s" : ""} · ${tabLabel}`,
      textX,
      cardY + 21.2
    );

    const rightX = cardX + cardW - 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    doc.text(dateStr, rightX, cardY + 11.2, { align: "right" });

    doc.setFontSize(7);
    doc.text(timeStr, rightX, cardY + 16.5, { align: "right" });
  }

  function drawLastPageFooter(pageCount) {
    const footX = MARGIN;
    const footY = PH - LAST_FOOTER_H - 4;
    const footW = PW - MARGIN * 2;
    const footH = LAST_FOOTER_H;

    doc.setFillColor(...NAVY);
    doc.roundedRect(footX, footY, footW, footH, 2.2, 2.2, "F");

    doc.setFillColor(...GOLD);
    doc.rect(footX, footY, 4, footH, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...WHITE);
    doc.text(
      `${ensembleName} · ${tabLabel} · Exportado el ${dateStr} a las ${timeStr}`,
      footX + 8,
      footY + 6.3
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.text(`Página ${pageCount}`, footX + footW - 8, footY + 6.3, {
      align: "right",
    });
  }

  const bodyRows = [];
  const groupHeaderIdxs = new Set();
  const groupLastIdxs = new Set();

  let rowIndex = 0;

  for (const group of groups) {
    groupHeaderIdxs.add(rowIndex);
    bodyRows.push([
      `${group.instrument} · ${group.members.length} integrante${group.members.length !== 1 ? "s" : ""}`,
    ]);
    rowIndex++;

    for (let i = 0; i < group.members.length; i++) {
      const u = group.members[i];

      if (i === group.members.length - 1) {
        groupLastIdxs.add(rowIndex);
      }

      bodyRows.push([
        userFullName(u) || "—",
      ]);

      rowIndex++;
    }
  }

  autoTable(doc, {
    startY: FIRST_HEADER_H + 8,
    head: [["Nombre completo"]],
    body: bodyRows,
    margin: {
      left: MARGIN,
      right: MARGIN,
      top: NORMAL_TOP,
      bottom: LAST_FOOTER_H + 8,
    },

    styles: {
      font: "helvetica",
      fontSize: 10,
      textColor: TEXT,
      lineColor: RULE,
      lineWidth: 0.2,
      minCellHeight: 10,
      cellPadding: { top: 4.2, right: 6, bottom: 4.2, left: 8 },
      valign: "middle",
    },

    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 9,
      lineColor: [198, 207, 224],
      lineWidth: 0.2,
      cellPadding: { top: 4.8, right: 6, bottom: 4.8, left: 8 },
    },

    alternateRowStyles: {
      fillColor: [244, 246, 251],
    },

    columnStyles: {
      0: { cellWidth: "auto" },
    },

    willDrawPage() {
      drawPageBase();
    },

    didParseCell(data) {
      if (data.section !== "body") return;

      if (groupHeaderIdxs.has(data.row.index)) {
        data.cell.styles.fillColor = [237, 241, 249];
        data.cell.styles.textColor = NAVY;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 9.5;
        data.cell.styles.cellPadding = { top: 4, right: 6, bottom: 4, left: 8 };
        data.cell.styles.lineColor = RULE;
        data.cell.styles.lineWidth = 0.2;
      }
    },

    didDrawCell(data) {
      if (data.section !== "body") return;
      const ri = data.row.index;

      if (!groupHeaderIdxs.has(ri) && data.column.index === 0) {
        doc.setFillColor(...GOLD);
        doc.rect(data.cell.x, data.cell.y, 1.8, data.cell.height, "F");
      }

      if (groupLastIdxs.has(ri) && data.column.index === 0) {
        const y = data.cell.y + data.cell.height;
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, y, PW - MARGIN, y);
        doc.setDrawColor(...RULE);
        doc.setLineWidth(0.2);
      }
    },
  });

  const pageCount = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    if (page === 1) {
      drawFirstPageHeader();
    }

    if (page === pageCount) {
      drawLastPageFooter(pageCount);
    }
  }

  doc.save(`${slugify(ensembleName)}_${slugify(tabLabel)}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function exportEnsembleXLSX({
  ensemble,
  members = [],
  tabLabel = "Miembros",
}) {
  const XLSX = await import("xlsx-js-style");

  const ensembleName = ensemble?.name || ensemble?.key || "Agrupacion";
  const category = categoryLabel(ensemble?.category);
  const dateStr = new Date().toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const groups = groupByInstrument(members);
  const wb = XLSX.utils.book_new();

  const aoa = [];
  aoa.push([ensembleName]);
  aoa.push([
    `Categoría: ${category || "—"}   ·   Lista: ${tabLabel}   ·   ${members.length} integrante${members.length !== 1 ? "s" : ""}`,
  ]);
  aoa.push([`Generado: ${dateStr}`]);
  aoa.push([]);
  aoa.push(["Nombre completo"]);

  const groupHeaderRowIdxs = new Set();
  let currentRow = 5;

  for (const group of groups) {
    groupHeaderRowIdxs.add(currentRow);
    aoa.push([
      `${group.instrument}   ·   ${group.members.length} integrante${group.members.length !== 1 ? "s" : ""}`,
    ]);
    currentRow++;

    for (const u of group.members) {
      aoa.push([userFullName(u) || ""]);
      currentRow++;
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws["!cols"] = [
    { wch: 58 },
  ];

  ws["!rows"] = [
    { hpt: 28 },
    { hpt: 16 },
    { hpt: 16 },
    { hpt: 6 },
    { hpt: 22 },
  ];

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 0 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 0 } },
  ];

  function S(ref, style) {
    if (ws[ref]) ws[ref].s = style;
  }

  const NAVYhex = "293964";
  const GOLDhex = "E08B03";
  const LIGHThex = "F8F9FC";
  const RULEhex = "DAE0EB";
  const TEXThex = "1D2949";

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

  S("A5", {
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

  for (const ri of groupHeaderRowIdxs) {
    const excelRow = ri + 1;

    S(`A${excelRow}`, {
      font: {
        bold: true,
        sz: 10,
        color: { rgb: "293964" },
      },
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

    S(`A${r}`, {
      font: {
        sz: 10,
        color: { rgb: TEXThex },
      },
      alignment: {
        vertical: "center",
        horizontal: "left",
      },
      fill: {
        fgColor: { rgb: r % 2 === 0 ? LIGHThex : "FFFFFF" },
      },
      border: {
        top: { style: "thin", color: { rgb: RULEhex } },
        bottom: { style: "thin", color: { rgb: RULEhex } },
        left: { style: "thin", color: { rgb: RULEhex } },
        right: { style: "thin", color: { rgb: RULEhex } },
      },
    });
  }

  const summAoa = [];
  summAoa.push([`RESUMEN — ${ensembleName}`]);
  summAoa.push([]);
  summAoa.push(["Instrumento", "Integrantes"]);

  for (const g of groups) {
    summAoa.push([g.instrument, g.members.length]);
  }

  const wsSumm = XLSX.utils.aoa_to_sheet(summAoa);
  wsSumm["!cols"] = [{ wch: 32 }, { wch: 14 }];
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
      border: {
        bottom: { style: "medium", color: { rgb: GOLDhex } },
      },
    });
  });

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    slugify(tabLabel).slice(0, 28) || "Miembros"
  );
  XLSX.utils.book_append_sheet(wb, wsSumm, "Resumen");

  XLSX.writeFile(wb, `${slugify(ensembleName)}_${slugify(tabLabel)}.xlsx`);
}