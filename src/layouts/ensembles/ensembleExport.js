/**
 * ensembleExport.js
 *
 * Utility functions to export ensemble member lists as PDF or Excel (.xlsx).
 * Uses:
 *   - jsPDF + jsPDF-AutoTable  → PDF
 *   - SheetJS (xlsx)            → Excel
 *
 * Install (if not already in project):
 *   npm install jspdf jspdf-autotable xlsx
 *
 * Usage (inside EnsembleControlPage or any component):
 *   import { exportEnsemblePDF, exportEnsembleXLSX } from "./ensembleExport";
 *
 *   exportEnsemblePDF({ ensemble, members });
 *   exportEnsembleXLSX({ ensemble, members });
 */

// ─── Label maps (keep in sync with EnsembleControlPage) ──────────────────────
const CATEGORY_LABEL = {
  MARCHING: "Marcha",
  BIG_BAND: "Big Band",
  CONCERT: "Concierto",
  OTHER: "Otro",
};

function categoryLabel(cat) {
  return CATEGORY_LABEL[cat] || cat || "";
}

function userFullName(u) {
  return [u.firstSurName, u.secondSurName, u.name].filter(Boolean).join(" ");
}

function bandsLabel(bands = []) {
  return Array.isArray(bands) ? bands.join(", ") : "";
}

// ─── Shared: build rows ───────────────────────────────────────────────────────
function buildRows(members) {
  return members.map((u, i) => ({
    "#": i + 1,
    Nombre: userFullName(u),
    "Correo electrónico": u.email || "—",
    Rol: u.role || "—",
    Instrumento: u.instrument || "—",
    Estado: u.state || "—",
    // Agrupaciones: bandsLabel(u.bands) || "—",
  }));
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
/**
 * exportEnsemblePDF
 * @param {{ ensemble: object, members: object[], tabLabel?: string }} opts
 *   ensemble  – the ensemble object ({ name, category, key })
 *   members   – array of user objects from the active hook
 *   tabLabel  – optional: "Miembros" | "Disponibles" (defaults to "Miembros")
 */
export async function exportEnsemblePDF({ ensemble, members, tabLabel = "Miembros" }) {
  // Dynamic import so the PDF library is only loaded on demand
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const BRAND_COLOR = [30, 30, 30]; // near-black
  const ACCENT_COLOR = [59, 130, 246]; // blue-500
  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const MARGIN = 14;

  const ensembleName = ensemble?.name || ensemble?.key || "Agrupación";
  const category = categoryLabel(ensemble?.category);
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ── Header block ──────────────────────────────────────────────────────────
  // Top colored bar
  doc.setFillColor(...ACCENT_COLOR);
  doc.rect(0, 0, PAGE_W, 18, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(ensembleName, MARGIN, 11);

  // Category badge (right side of bar)
  if (category) {
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(category, PAGE_W - MARGIN, 11, { align: "right" });
  }

  // Sub-header row
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 18, PAGE_W, 10, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_COLOR);
  doc.text(
    `Lista: ${tabLabel}   ·   Total: ${members.length} integrante${
      members.length !== 1 ? "s" : ""
    }`,
    MARGIN,
    24.5
  );
  doc.text(`Generado: ${dateStr}`, PAGE_W - MARGIN, 24.5, { align: "right" });

  // ── Table ─────────────────────────────────────────────────────────────────
  const rows = buildRows(members);
  const columns = Object.keys(
    rows[0] || {
      "#": "",
      Nombre: "",
      "Correo electrónico": "",
      Rol: "",
      Instrumento: "",
      Estado: "",
      //   Agrupaciones: "",
    }
  );

  autoTable(doc, {
    startY: 30,
    head: [columns],
    body: rows.map((r) => columns.map((c) => r[c])),
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 3,
      textColor: BRAND_COLOR,
    },
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" }, // #
      1: { cellWidth: 48 }, // Nombre
      2: { cellWidth: 52 }, // Email
      3: { cellWidth: 22 }, // Rol
      4: { cellWidth: 28 }, // Instrumento
      5: { cellWidth: 20 }, // Estado
      //   6: { cellWidth: "auto" }, // Agrupaciones
    },
    didDrawPage: (data) => {
      // Footer on every page
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `${ensembleName} — ${tabLabel} · Página ${data.pageNumber} de ${pageCount}`,
        PAGE_W / 2,
        PAGE_H - 6,
        { align: "center" }
      );
    },
  });

  const fileName = `${slugify(ensembleName)}_${slugify(tabLabel)}.pdf`;
  doc.save(fileName);
}

// ─── Excel Export ─────────────────────────────────────────────────────────────
/**
 * exportEnsembleXLSX
 * @param {{ ensemble: object, members: object[], tabLabel?: string }} opts
 */
export async function exportEnsembleXLSX({ ensemble, members, tabLabel = "Miembros" }) {
  const XLSX = await import("xlsx");

  const ensembleName = ensemble?.name || ensemble?.key || "Agrupacion";
  const category = categoryLabel(ensemble?.category);
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const wb = XLSX.utils.book_new();
  const ws_data = [];

  // ── Title rows ─────────────────────────────────────────────────────────────
  ws_data.push([ensembleName]);
  ws_data.push([`Categoría: ${category || "—"}`]);
  ws_data.push([`Lista: ${tabLabel}`]);
  ws_data.push([`Total: ${members.length} integrante${members.length !== 1 ? "s" : ""}`]);
  ws_data.push([`Generado: ${dateStr}`]);
  ws_data.push([]); // blank separator

  // ── Header row ─────────────────────────────────────────────────────────────
  const headers = [
    "#",
    "Nombre completo",
    "Correo electrónico",
    "Rol",
    "Instrumento",
    "Estado",
    // "Agrupaciones",
  ];
  ws_data.push(headers);

  // ── Data rows ──────────────────────────────────────────────────────────────
  members.forEach((u, i) => {
    ws_data.push([
      i + 1,
      userFullName(u),
      u.email || "",
      u.role || "",
      u.instrument || "",
      u.state || "",
      bandsLabel(u.bands),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // ── Column widths ──────────────────────────────────────────────────────────
  ws["!cols"] = [
    { wch: 5 }, // #
    { wch: 32 }, // Nombre
    { wch: 34 }, // Email
    { wch: 16 }, // Rol
    { wch: 20 }, // Instrumento
    { wch: 12 }, // Estado
    // { wch: 30 }, // Agrupaciones
  ];

  // ── Merge title cell across columns ───────────────────────────────────────
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // ensembleName spans all cols
  ];

  const sheetName = slugify(tabLabel).slice(0, 31); // max 31 chars for sheet name
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const fileName = `${slugify(ensembleName)}_${slugify(tabLabel)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function slugify(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
