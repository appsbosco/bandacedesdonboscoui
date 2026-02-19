// ─── Currency ────────────────────────────────────────────────────────────────

export const formatCRC = (v) =>
  `₡${new Intl.NumberFormat("es-CR").format(Number.isFinite(Number(v)) ? Number(v) : 0)}`;

/** Parse a raw string input (may have commas, spaces) to integer colones */
export function parseCRC(str) {
  if (!str && str !== 0) return 0;
  const cleaned = String(str).replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
}

// ─── Dates ───────────────────────────────────────────────────────────────────

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function monthAgoStr() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export function weekAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export function fmtBusinessDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

export function fmtDatetime(v) {
  if (!v) return "—";
  const d = new Date(typeof v === "string" && /^\d+$/.test(v) ? parseInt(v) : v);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function monthName(month) {
  return (
    [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ][month - 1] || ""
  );
}

// ─── Payment methods ──────────────────────────────────────────────────────────

export const PAYMENT_LABELS = {
  CASH: { label: "Efectivo", emoji: "💵", color: "bg-emerald-100 text-emerald-700" },
  SINPE: { label: "SINPE", emoji: "📱", color: "bg-blue-100 text-blue-700" },
  // CARD: { label: "Tarjeta", emoji: "💳", color: "bg-purple-100 text-purple-700" },
  // OTHER: { label: "Otro", emoji: "🔁", color: "bg-slate-100 text-slate-600" },
};

export function paymentLabel(method) {
  return PAYMENT_LABELS[method]?.label || method;
}

// ─── Amount presets ───────────────────────────────────────────────────────────

export const AMOUNT_PRESETS = [500, 1000, 2000, 2500, 3000, 5000, 10000, 20000];

// ─── PDF Download ─────────────────────────────────────────────────────────────
/**
 * Generates and downloads a PDF from the monthly dataset.
 * Uses the browser's print API with a styled iframe to avoid adding jsPDF.
 * The band logo is expected at /logo.png (adjust path as needed).
 */
export function downloadMonthlyPDF(dataset) {
  const { month, year, summary, dailyBreakdown, assetPurchases, generatedAt } = dataset;

  const MONTH_NAME = monthName(month);
  const fmtN = (v) => `₡${new Intl.NumberFormat("es-CR").format(Number(v) || 0)}`;
  const netColor = (n) => (n >= 0 ? "#059669" : "#dc2626");

  const methodRows = (arr) =>
    (arr || [])
      .map(
        (m) =>
          `<tr><td>${paymentLabel(m.method)}</td><td>${fmtN(m.total)}</td><td>${m.count}</td></tr>`
      )
      .join("");

  const categoryRows = (arr) =>
    (arr || [])
      .map(
        (c) =>
          `<tr><td>${c.categorySnapshot}</td><td>${fmtN(c.totalAmount)}</td><td>${
            c.count
          }</td></tr>`
      )
      .join("");

  const productRows = (arr) =>
    (arr || [])
      .map(
        (p) => `<tr><td>${p.name}</td><td>${p.totalUnits}</td><td>${fmtN(p.totalRevenue)}</td></tr>`
      )
      .join("");

  const dailyRows = (dailyBreakdown || [])
    .map(
      (d) => `<tr>
      <td>${d.businessDate}</td>
      <td>${fmtN(d.totalSales)}</td>
      <td>${fmtN(d.totalExpenses)}</td>
      <td style="color:${netColor(d.net)};font-weight:700">${fmtN(d.net)}</td>
    </tr>`
    )
    .join("");

  const assetRows = (assetPurchases || [])
    .map(
      (a) => `<tr>
      <td>${a.businessDate}</td>
      <td>${a.concept}</td>
      <td>${a.purpose || "—"}</td>
      <td>${a.vendor || "—"}</td>
      <td>${fmtN(a.amount)}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Informe Financiero ${MONTH_NAME} ${year}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; font-size: 11px; color: #1e293b; background: #fff; padding: 32px; }
  .header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #be123c; padding-bottom: 16px; margin-bottom: 24px; }
  .logo { width: 60px; height: 60px; object-fit: contain; }
  .header-text h1 { font-size: 18px; font-weight: 800; color: #0f172a; }
  .header-text p { font-size: 11px; color: #64748b; margin-top: 2px; }
  .generated { font-size: 9px; color: #94a3b8; margin-top: 2px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 13px; font-weight: 700; color: #be123c; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; margin-bottom: 12px; }
  .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
  .stat-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .stat-label { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.05em; }
  .stat-value { font-size: 16px; font-weight: 800; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #f8fafc; text-align: left; padding: 6px 8px; font-weight: 700; font-size: 9px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
  td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }
  .net-positive { color: #059669; font-weight: 700; }
  .net-negative { color: #dc2626; font-weight: 700; }
  @media print { body { padding: 16px; } .no-print { display: none; } }
</style>
</head>
<body>
<div class="header">
  <img src="/logo.png" alt="Logo Banda" class="logo" onerror="this.style.display='none'" />
  <div class="header-text">
    <h1>Banda CEDES Don Bosco</h1>
    <p>Informe Financiero — ${MONTH_NAME} ${year}</p>
    <p class="generated">Generado: ${new Date(generatedAt).toLocaleString("es-CR")}</p>
  </div>
</div>

<div class="section">
  <div class="section-title">Resumen del mes</div>
  <div class="summary-grid">
    <div class="stat-card">
      <div class="stat-label">Ingresos</div>
      <div class="stat-value" style="color:#059669">${fmtN(summary.totalSales)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Egresos</div>
      <div class="stat-value" style="color:#dc2626">${fmtN(summary.totalExpenses)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Neto</div>
      <div class="stat-value" style="color:${netColor(summary.net)}">${fmtN(summary.net)}</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Ingresos por método de pago</div>
  <table><thead><tr><th>Método</th><th>Total</th><th>Transacciones</th></tr></thead>
  <tbody>${methodRows(summary.salesByMethod)}</tbody></table>
</div>

<div class="section">
  <div class="section-title">Egresos por categoría</div>
  <table><thead><tr><th>Categoría</th><th>Total</th><th>Registros</th></tr></thead>
  <tbody>${categoryRows(summary.expensesByCategory)}</tbody></table>
</div>

${
  summary.productSales?.length
    ? `
<div class="section">
  <div class="section-title">Ventas por producto</div>
  <table><thead><tr><th>Producto</th><th>Unidades</th><th>Ingreso</th></tr></thead>
  <tbody>${productRows(summary.productSales)}</tbody></table>
</div>`
    : ""
}

<div class="section">
  <div class="section-title">Desglose diario</div>
  <table><thead><tr><th>Fecha</th><th>Ingresos</th><th>Egresos</th><th>Neto</th></tr></thead>
  <tbody>${dailyRows}</tbody></table>
</div>

${
  assetPurchases?.length
    ? `
<div class="section">
  <div class="section-title">Compras de activos (instrumentos/equipo)</div>
  <table><thead><tr><th>Fecha</th><th>Concepto</th><th>Propósito</th><th>Proveedor</th><th>Monto</th></tr></thead>
  <tbody>${assetRows}</tbody></table>
</div>`
    : ""
}

<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;text-align:center;">
  Banda CEDES Don Bosco · Informe generado automáticamente
</div>
</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;";
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1500);
  }, 500);
}
