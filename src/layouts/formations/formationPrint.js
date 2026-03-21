/**
 * formationPrint.js
 *
 * Opens a new browser window with a self-contained, print-optimized HTML
 * representation of the formation. No Tailwind dependency — uses inline styles.
 *
 * Page-break strategy:
 *   - Slots are grouped by row inside each zone.
 *   - Each row renders as a flex row with `break-inside: avoid` so the browser
 *     never cuts a row in half across pages.
 *   - Zone headers have `break-after: avoid` so they stay attached to the first
 *     row of their zone and are never left as orphan labels at the bottom of a page.
 *
 * Usage:
 *   openFormationPrint({ slots, columns, zoneColumns, formName, formType })
 */

import { getSectionLabel } from "./formationEngine.js";

// ── Color tokens (raw CSS values, mirroring SECTION_COLORS in formationEngine) ─

const PRINT_COLORS = {
  DRUM_MAJOR:       { bg: "#312e81", border: "#1e1b4b", text: "#ffffff" },
  DANZA:            { bg: "#fdf4ff", border: "#d946ef", text: "#4a044e" },
  TROMBONES:        { bg: "#f5f3ff", border: "#a78bfa", text: "#2e1065" },
  FLAUTAS:          { bg: "#eff6ff", border: "#60a5fa", text: "#1e3a8a" },
  CLARINETES:       { bg: "#f0fdfa", border: "#2dd4bf", text: "#134e4a" },
  SAXOFONES_ALTO:   { bg: "#fff7ed", border: "#fb923c", text: "#7c2d12" },
  SAXOFON_TENOR:    { bg: "#fefce8", border: "#facc15", text: "#713f12" },
  MELOFONOS:        { bg: "#f7fee7", border: "#84cc16", text: "#365314" },
  SAXOFON_BARITONO: { bg: "#f0fdf4", border: "#4ade80", text: "#14532d" },
  EUFONIOS:         { bg: "#ecfeff", border: "#22d3ee", text: "#164e63" },
  TROMPETAS:        { bg: "#fef2f2", border: "#f87171", text: "#7f1d1d" },
  TUBAS:            { bg: "#f0f9ff", border: "#38bdf8", text: "#0c4a6e" },
  MALLETS:          { bg: "#f5f3ff", border: "#8b5cf6", text: "#2e1065" },
  PERCUSION:        { bg: "#f5f5f4", border: "#a8a29e", text: "#1c1917" },
  COLOR_GUARD:      { bg: "#fff1f2", border: "#fb7185", text: "#881337" },
};

const PRINT_ZONE_LABELS = {
  FRENTE_ESPECIAL: "Frente",
  BLOQUE_FRENTE:   "Bloque del Frente",
  PERCUSION:       "Percusión",
  BLOQUE_ATRAS:    "Bloque de Atrás",
  FINAL:           "Final",
};

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getInitials(fullName) {
  return String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

// ── Shared cell HTML ───────────────────────────────────────────────────────────

/**
 * Render a single slot cell as HTML.
 * Width is controlled externally by the parent flex row container.
 */
function buildCellHTML(slot) {
  let style, nameColor;

  if (!slot.userId) {
    style = "background:#f8fafc;border:1px dashed #e2e8f0;opacity:0.55;";
    nameColor = "#94a3b8";
  } else {
    const c = PRINT_COLORS[slot.section] || { bg: "#f1f5f9", border: "#94a3b8", text: "#1e293b" };
    style = `background:${c.bg};border-color:${c.border};`;
    nameColor = c.text;
  }

  const parts = (slot.displayName || "").trim().split(/\s+/);
  const line1 = parts[0] || "·";
  const line2 = parts.length > 1 ? parts.slice(1).join(" ") : null;
  const avatarHTML = !slot.userId
    ? ""
    : slot.avatar
    ? `<img
  src="${escapeHTML(slot.avatar)}"
  alt="${escapeHTML(slot.displayName || "Miembro")}"
  style="width:26px;height:26px;border-radius:999px;object-fit:cover;border:1.5px solid rgba(255,255,255,0.85);box-shadow:0 1px 2px rgba(15,23,42,0.12);"
/>`
    : `<div style="width:26px;height:26px;border-radius:999px;display:flex;align-items:center;justify-content:center;
  font-size:8px;font-weight:800;letter-spacing:0.04em;background:rgba(255,255,255,0.55);
  color:${nameColor};border:1.5px solid rgba(255,255,255,0.75);">
  ${escapeHTML(getInitials(slot.displayName) || "?")}
</div>`;

  return `<div style="position:relative;flex:1 1 0;min-width:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center;border:1px solid;border-radius:6px;
  min-height:50px;padding:4px 3px;break-inside:avoid;page-break-inside:avoid;${style}">
  ${avatarHTML ? `<div style="margin-bottom:4px;display:flex;align-items:center;justify-content:center;">${avatarHTML}</div>` : ""}
  <span style="font-size:9px;font-weight:700;line-height:1.3;color:${nameColor};
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${escapeHTML(line1)}</span>
  ${line2
    ? `<span style="font-size:8px;font-weight:500;line-height:1.3;color:${nameColor};
    opacity:0.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${escapeHTML(line2)}</span>`
    : ""}
</div>`;
}

// ── Row-aware grid HTML ────────────────────────────────────────────────────────

/**
 * Group slots by their `row` property and render each row as a flex container
 * with `break-inside: avoid`. This prevents the browser from splitting a row
 * of cells across a page boundary.
 *
 * @param {Array} sortedSlots  Slots pre-sorted by row then col.
 * @returns {string}           HTML string of stacked flex rows.
 */
function buildRowsHTML(sortedSlots) {
  // Group by row
  const rowMap = new Map();
  for (const slot of sortedSlots) {
    if (!rowMap.has(slot.row)) rowMap.set(slot.row, []);
    rowMap.get(slot.row).push(slot);
  }

  return [...rowMap.values()]
    .map(
      (rowSlots) =>
        `<div style="display:flex;gap:3px;margin-bottom:3px;break-inside:avoid;page-break-inside:avoid;">
  ${rowSlots.map(buildCellHTML).join("")}
</div>`
    )
    .join("");
}

// ── Zone grid HTML (regular zones) ────────────────────────────────────────────

function buildZoneHTML(zone, slots, columns) {
  const zoneSlots = slots
    .filter((s) => s.zone === zone)
    .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col));

  if (!zoneSlots.length) return "";

  // If slot data has no meaningful row/col (legacy), fall back to chunking by columns
  const hasRowData = zoneSlots.some((s) => s.row != null);
  if (!hasRowData) {
    // Assign virtual rows based on position in sorted array
    zoneSlots.forEach((s, i) => {
      s._vrow = Math.floor(i / columns);
    });
    zoneSlots.forEach((s) => { s.row = s._vrow; });
  }

  return buildRowsHTML(zoneSlots);
}

// ── Section legend HTML ────────────────────────────────────────────────────────

function buildSectionLegendHTML(slots) {
  const seen = new Set();
  const sections = [];
  for (const s of slots) {
    if (s.section && !seen.has(s.section)) {
      seen.add(s.section);
      sections.push(s.section);
    }
  }

  return sections
    .map((sec) => {
      const c = PRINT_COLORS[sec] || { bg: "#f1f5f9", border: "#94a3b8", text: "#1e293b" };
      const label = getSectionLabel(sec);
      return `<span style="font-size:8px;font-weight:600;padding:2px 8px;border-radius:99px;
      border:1px solid ${c.border};background:${c.bg};color:${c.text};white-space:nowrap;">${label}</span>`;
    })
    .join("");
}

// ── Percussion zone HTML (sub-grouped by section) ─────────────────────────────

function buildPercussionZoneHTML(slots, defaultColumns, zoneColumns) {
  const zoneSlots = slots
    .filter((s) => s.zone === "PERCUSION")
    .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col));

  if (!zoneSlots.length) return "";

  // Infer section order from first appearance
  const seenOrder = [];
  const seenSet = new Set();
  for (const slot of zoneSlots) {
    if (slot.section && !seenSet.has(slot.section)) {
      seenSet.add(slot.section);
      seenOrder.push(slot.section);
    }
  }

  // Group by section; fillers → last section
  const grouped = {};
  for (const sec of seenOrder) grouped[sec] = [];
  const fillers = [];
  for (const slot of zoneSlots) {
    if (slot.section && grouped[slot.section] !== undefined) {
      grouped[slot.section].push(slot);
    } else if (!slot.section) {
      fillers.push(slot);
    }
  }
  if (seenOrder.length > 0 && fillers.length > 0) {
    const last = seenOrder[seenOrder.length - 1];
    grouped[last].push(...fillers);
    grouped[last].sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col));
  }

  return seenOrder
    .map((sec, idx) => {
      const secSlots = grouped[sec];
      if (!secSlots.length) return "";

      const c = PRINT_COLORS[sec] || { bg: "#f1f5f9", border: "#94a3b8", text: "#1e293b" };
      const label = getSectionLabel(sec);

      // Use per-section columns from zoneColumns (key: PERCUSION__MALLETS, etc.)
      const sectionKey = `PERCUSION__${sec}`;
      const secCols = zoneColumns[sectionKey] ?? defaultColumns;

      // Normalize rows within this sub-group relative to the sub-section's own
      // row origin.  Slots already carry correct row/col from the grid engine,
      // but they are absolute within the PERCUSION zone.  We need dense local
      // rows (0,1,2…) so buildRowsHTML groups them correctly.
      const rowSet = [...new Set(secSlots.map((s) => s.row))].sort((a, b) => a - b);
      const rowRemap = new Map(rowSet.map((r, i) => [r, i]));
      const reIndexed = secSlots.map((slot) => ({
        ...slot,
        row: rowRemap.get(slot.row) ?? 0,
        col: slot.col < secCols ? slot.col : slot.col % secCols,
      }));

      const subLabel = `<div style="display:flex;align-items:center;gap:8px;margin:${
        idx > 0 ? "10px" : "0"
      } 0 5px;break-after:avoid;page-break-after:avoid;">
  ${idx > 0 ? `<div style="flex:1;height:1px;background:#f1f5f9;"></div>` : ""}
  <span style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;
    padding:2px 8px;border-radius:99px;border:1px solid ${c.border};
    background:${c.bg};color:${c.text};white-space:nowrap;">${label}</span>
  <div style="flex:1;height:1px;background:#f1f5f9;"></div>
</div>`;

      return subLabel + buildRowsHTML(reIndexed);
    })
    .join("");
}

// ── Main export ───────────────────────────────────────────────────────────────

export function openFormationPrint({ slots, columns, zoneColumns = {}, formName, formType }) {
  const getZoneCols = (zone) => (zoneColumns[zone] != null ? zoneColumns[zone] : columns);
  const ZONES_ORDER = ["FRENTE_ESPECIAL", "BLOQUE_FRENTE", "PERCUSION", "BLOQUE_ATRAS", "FINAL"];
  const presentZones = ZONES_ORDER.filter((z) => slots.some((s) => s.zone === z));
  const totalMembers = slots.filter((s) => s.userId).length;
  const typeLabel = formType === "DOUBLE" ? "Bloque doble hacia atrás" : "Bloque único";

  const zonesHTML = presentZones
    .map((zone, idx) => {
      const gridHTML =
        zone === "PERCUSION"
          ? buildPercussionZoneHTML(slots, getZoneCols("PERCUSION"), zoneColumns)
          : buildZoneHTML(zone, slots, getZoneCols(zone));
      const zoneLabel = PRINT_ZONE_LABELS[zone] || zone;

      // Zone header — break-after:avoid keeps the label with the first row below it
      const header =
        idx === 0
          ? `<div style="text-align:center;margin-bottom:8px;break-after:avoid;page-break-after:avoid;">
           <span style="font-size:9px;font-weight:700;text-transform:uppercase;
             letter-spacing:0.12em;color:#64748b;">${zoneLabel}</span>
         </div>`
          : `<div style="display:flex;align-items:center;gap:10px;margin:16px 0 8px;
             break-after:avoid;page-break-after:avoid;">
           <div style="flex:1;height:1px;background:#e2e8f0;"></div>
           <span style="font-size:9px;font-weight:700;text-transform:uppercase;
             letter-spacing:0.12em;color:#64748b;white-space:nowrap;">${zoneLabel}</span>
           <div style="flex:1;height:1px;background:#e2e8f0;"></div>
         </div>`;

      return header + gridHTML;
    })
    .join("");

  const legendHTML = buildSectionLegendHTML(slots);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formName || "Formación"} — Banda CEDES Don Bosco</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif;
      background: #ffffff;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { max-width: 960px; margin: 0 auto; padding: 28px 24px; }
    .no-print { display: flex; }
    @media print {
      .no-print { display: none !important; }
      .page { padding: 0; }
      @page { margin: 10mm 12mm; size: landscape; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div style="border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:14px;
    break-inside:avoid;page-break-inside:avoid;">
    <div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;
      color:#64748b;margin-bottom:5px;">Banda CEDES Don Bosco · Formación de Desfile</div>
    <h1 style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;
      margin-bottom:6px;">${formName || "Formación"}</h1>
    <div style="display:flex;flex-wrap:wrap;gap:16px;">
      <span style="font-size:11px;color:#475569;">📐 ${typeLabel}</span>
      <span style="font-size:11px;color:#475569;">🎵 ${totalMembers} músicos · ${columns} columnas</span>
    </div>
  </div>

  <!-- Section legend -->
  <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:16px;
    break-inside:avoid;page-break-inside:avoid;">
    ${legendHTML}
  </div>

  <!-- Formation layout -->
  ${zonesHTML}

  <!-- Footer -->
  <div style="margin-top:20px;padding-top:8px;border-top:1px solid #e2e8f0;
    display:flex;justify-content:space-between;align-items:center;">
    <span style="font-size:8px;color:#94a3b8;">Banda CEDES Don Bosco</span>
  </div>

</div>

<!-- Controls (hidden on print) -->
<div class="no-print" style="position:fixed;bottom:20px;right:20px;gap:8px;z-index:999;">
  <button onclick="window.print()"
    style="padding:10px 22px;background:#4f46e5;color:#fff;border:none;
    border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;
    box-shadow:0 4px 12px rgba(79,70,229,0.35);">
    Imprimir / PDF
  </button>
  <button onclick="window.close()"
    style="padding:10px 16px;background:#f8fafc;color:#64748b;
    border:1px solid #e2e8f0;border-radius:10px;font-size:13px;cursor:pointer;">
    Cerrar
  </button>
</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=1100,height=820,scrollbars=yes");
  if (!win) return; // blocked by popup blocker
  win.document.write(html);
  win.document.close();
  win.focus();
}
