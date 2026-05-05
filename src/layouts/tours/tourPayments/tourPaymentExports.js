import { fmtAmount } from "./useTourPayments";

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function instrumentLabel(row) {
  const value = String(row?.instrument || "").trim();
  return value || "Sin instrumento";
}

function participantLabel(row) {
  const id = row?.identification ? ` · ${row.identification}` : "";
  const removed = row?.isRemoved ? " · Retirado" : "";
  return `${row?.fullName || "Sin nombre"}${id}${removed}`;
}

function sortRows(a, b) {
  const byInstrument = instrumentLabel(a).localeCompare(instrumentLabel(b), "es");
  if (byInstrument) return byInstrument;
  return String(a?.fullName || "").localeCompare(String(b?.fullName || ""), "es");
}

function groupByInstrument(rows) {
  const groups = new Map();

  [...rows].sort(sortRows).forEach((row) => {
    const label = instrumentLabel(row);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(row);
  });

  return [...groups.entries()].map(([instrument, members]) => ({
    instrument,
    members,
    totalPaid: members.reduce((sum, row) => sum + (row.totalPaid || 0), 0),
    totalBalance: members.reduce((sum, row) => sum + Math.max(0, row.balance || 0), 0),
  }));
}

function getReportData(rows = []) {
  const activeRows = rows.filter((row) => !row.isRemoved);
  const sourceRows = activeRows.length ? activeRows : rows;
  const unpaidRows = sourceRows.filter((row) => (row.totalPaid || 0) <= 0);
  const paidRows = sourceRows.filter((row) => (row.totalPaid || 0) > 0);

  return {
    totalParticipants: sourceRows.length,
    unpaidRows,
    paidRows,
    unpaidGroups: groupByInstrument(unpaidRows),
    paidGroups: groupByInstrument(paidRows),
    totalPaid: paidRows.reduce((sum, row) => sum + (row.totalPaid || 0), 0),
    totalPending: sourceRows.reduce((sum, row) => sum + Math.max(0, row.balance || 0), 0),
  };
}

function buildPaidAmountText(row) {
  const paid = fmtAmount(row.totalPaid);
  const pending = Math.max(0, row.balance || 0);
  const pendingText = pending > 0 ? ` · Debe ${fmtAmount(pending)}` : " · Al día";
  return `${paid}${pendingText}`;
}

function buildWhatsappSection(title, groups, rowFormatter) {
  if (!groups.length) return `${title}\nSin registros.`;

  return [
    title,
    ...groups.map((group) => {
      const lines = group.members.map((row, index) => `${index + 1}. ${rowFormatter(row)}`);
      return [`\n*${group.instrument}* (${group.members.length})`, ...lines].join("\n");
    }),
  ].join("\n");
}

export function buildTourPaymentsWhatsappText({ rows = [], tourName = "Gira" }) {
  const data = getReportData(rows);

  return [
    `*Control financiero · ${tourName}*`,
    `${data.totalParticipants} participantes activos`,
    `Sin pago: ${data.unpaidRows.length}`,
    `Con pago: ${data.paidRows.length}`,
    `Cobrado: ${fmtAmount(data.totalPaid)}`,
    "",
    buildWhatsappSection(
      "*SIN NINGUN PAGO*",
      data.unpaidGroups,
      (row) => `${participantLabel(row)} · Debe ${fmtAmount(Math.max(0, row.balance || row.finalAmount || 0))}`
    ),
    "",
    buildWhatsappSection(
      "*CON PAGOS REGISTRADOS*",
      data.paidGroups,
      (row) => `${participantLabel(row)} · Pagado ${buildPaidAmountText(row)}`
    ),
  ].join("\n");
}

function buildPrintGroupHTML(groups, { paid }) {
  if (!groups.length) {
    return `<div class="empty">Sin registros.</div>`;
  }

  return groups
    .map(
      (group) => `<section class="instrument">
  <div class="instrument-head">
    <h3>${escapeHTML(group.instrument)}</h3>
    <span>${group.members.length} participante${group.members.length !== 1 ? "s" : ""}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Participante</th>
        <th>Cedula</th>
        <th class="num">Total</th>
        <th class="num">Pagado</th>
        <th class="num">Debe</th>
      </tr>
    </thead>
    <tbody>
      ${group.members
        .map(
          (row) => `<tr>
        <td>
          <strong>${escapeHTML(row.fullName || "Sin nombre")}</strong>
          ${row.isRemoved ? `<span class="tag">Retirado</span>` : ""}
        </td>
        <td>${escapeHTML(row.identification || "-")}</td>
        <td class="num">${escapeHTML(fmtAmount(row.finalAmount || 0))}</td>
        <td class="num ${paid ? "paid" : ""}">${escapeHTML(fmtAmount(row.totalPaid || 0))}</td>
        <td class="num debt">${escapeHTML(fmtAmount(Math.max(0, row.balance || 0)))}</td>
      </tr>`
        )
        .join("")}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3">${group.members.length} participante${group.members.length !== 1 ? "s" : ""}</td>
        <td class="num paid">${escapeHTML(fmtAmount(group.totalPaid))}</td>
        <td class="num debt">${escapeHTML(fmtAmount(group.totalBalance))}</td>
      </tr>
    </tfoot>
  </table>
</section>`
    )
    .join("");
}

export function openTourPaymentsPrint({ rows = [], tourName = "Gira" }) {
  const data = getReportData(rows);
  const generatedAt = new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Control financiero - ${escapeHTML(tourName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
      color: #111827;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { max-width: 980px; margin: 0 auto; padding: 28px 24px 40px; }
    header { border-bottom: 2px solid #111827; padding-bottom: 14px; margin-bottom: 18px; }
    .eyebrow { font-size: 9px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #6b7280; }
    h1 { margin: 5px 0 8px; font-size: 24px; line-height: 1.1; }
    .meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 11px; color: #4b5563; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 14px 0 22px; }
    .stat { border: 1px solid #e5e7eb; border-radius: 8px; padding: 9px 10px; break-inside: avoid; }
    .stat strong { display: block; font-size: 15px; color: #111827; }
    .stat span { display: block; margin-top: 2px; font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; }
    .section-title { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 22px 0 10px; break-after: avoid; }
    .section-title h2 { margin: 0; font-size: 15px; text-transform: uppercase; letter-spacing: .08em; }
    .section-title span { font-size: 11px; color: #6b7280; }
    .instrument { margin: 0 0 14px; break-inside: avoid; page-break-inside: avoid; }
    .instrument-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 7px 9px; background: #f3f4f6; border: 1px solid #e5e7eb; border-bottom: 0;
      border-radius: 8px 8px 0 0; break-after: avoid;
    }
    .instrument-head h3 { margin: 0; font-size: 12px; }
    .instrument-head span { font-size: 10px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid #e5e7eb; padding: 6px 7px; vertical-align: top; }
    th { background: #f9fafb; color: #6b7280; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .08em; }
    tfoot td { background: #f9fafb; font-weight: 800; }
    .num { text-align: right; white-space: nowrap; }
    .paid { color: #047857; font-weight: 800; }
    .debt { color: #b45309; font-weight: 800; }
    .tag { display: inline-block; margin-left: 6px; padding: 1px 5px; border-radius: 99px; background: #fee2e2; color: #b91c1c; font-size: 8px; font-weight: 800; text-transform: uppercase; }
    .empty { padding: 14px; border: 1px dashed #d1d5db; border-radius: 8px; color: #6b7280; font-size: 11px; }
    footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; }
    .no-print { display: flex; }
    @media print {
      .no-print { display: none !important; }
      .page { padding: 0; }
      @page { margin: 11mm 12mm; size: portrait; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header>
      <div class="eyebrow">Banda CEDES Don Bosco · Control financiero</div>
      <h1>${escapeHTML(tourName)}</h1>
      <div class="meta">
        <span>Generado: ${escapeHTML(generatedAt)}</span>
        <span>Participantes activos: ${data.totalParticipants}</span>
      </div>
    </header>

    <div class="stats">
      <div class="stat"><strong>${data.unpaidRows.length}</strong><span>Sin ningun pago</span></div>
      <div class="stat"><strong>${data.paidRows.length}</strong><span>Con pagos</span></div>
      <div class="stat"><strong>${escapeHTML(fmtAmount(data.totalPaid))}</strong><span>Total pagado</span></div>
      <div class="stat"><strong>${escapeHTML(fmtAmount(data.totalPending))}</strong><span>Por cobrar</span></div>
    </div>

    <div class="section-title">
      <h2>Sin ningun pago</h2>
      <span>Agrupado por instrumento</span>
    </div>
    ${buildPrintGroupHTML(data.unpaidGroups, { paid: false })}

    <div class="section-title">
      <h2>Con pagos registrados</h2>
      <span>Incluye pagado y saldo pendiente</span>
    </div>
    ${buildPrintGroupHTML(data.paidGroups, { paid: true })}

    <footer>Banda CEDES Don Bosco</footer>
  </main>

  <div class="no-print" style="position:fixed;right:20px;bottom:20px;gap:8px;z-index:999;">
    <button onclick="window.print()" style="padding:10px 18px;background:#111827;color:#fff;border:0;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">Imprimir / PDF</button>
    <button onclick="window.close()" style="padding:10px 14px;background:#fff;color:#4b5563;border:1px solid #d1d5db;border-radius:10px;font-size:13px;cursor:pointer;">Cerrar</button>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=1100,height=820,scrollbars=yes");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  return true;
}
