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
  const phone = row?.phone ? ` · Tel. ${row.phone}` : "";
  const removed = row?.isRemoved ? " · Retirado" : "";
  return `${row?.fullName || "Sin nombre"}${phone}${removed}`;
}

const reportDateFormatter = new Intl.DateTimeFormat("es-CR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatReportDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "fecha no disponible" : reportDateFormatter.format(date);
}

function installmentLabel(installment) {
  return installment.concept || `Cuota ${installment.order}`;
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

function isDelinquent(row, now = new Date()) {
  return (row.installments || []).some((installment) => {
    if (installment.status === "WAIVED" || (installment.remainingAmount || 0) <= 0) {
      return false;
    }

    const dueDate = new Date(installment.dueDate);
    return !Number.isNaN(dueDate.getTime()) && dueDate < now;
  });
}

function pendingOverdueInstallments(row, now = new Date()) {
  return (row.installments || []).filter((installment) => {
    if (installment.status === "WAIVED" || (installment.remainingAmount || 0) <= 0) {
      return false;
    }

    const dueDate = new Date(installment.dueDate);
    return !Number.isNaN(dueDate.getTime()) && dueDate < now;
  });
}

function buildPaymentSituation(row, now = new Date()) {
  const installments = [...(row.installments || [])].sort((a, b) => a.order - b.order);
  const overdue = pendingOverdueInstallments(row, now);

  if (overdue.length) {
    const details = overdue.map(
      (installment) =>
        `${installmentLabel(installment)} (venció ${formatReportDate(
          installment.dueDate
        )}; debe ${fmtAmount(installment.remainingAmount || 0)})`
    );
    return `MOROSO EN: ${details.join("; ")}`;
  }

  if ((row.balance || 0) <= 0) {
    const lastInstallment = [...installments].reverse().find((item) => item.status !== "WAIVED");
    return lastInstallment
      ? `100% al día · Plan cancelado hasta ${installmentLabel(
          lastInstallment
        )} (${formatReportDate(lastInstallment.dueDate)})`
      : "100% al día · Sin saldo pendiente";
  }

  const coveredToDate = [...installments]
    .reverse()
    .find((item) => new Date(item.dueDate) <= now && ["PAID", "WAIVED"].includes(item.status));
  const nextInstallment = installments.find(
    (item) =>
      item.status !== "WAIVED" && (item.remainingAmount || 0) > 0 && new Date(item.dueDate) >= now
  );

  const coveredText = coveredToDate
    ? `Al día hasta ${installmentLabel(coveredToDate)} (${formatReportDate(coveredToDate.dueDate)})`
    : `Al día al ${formatReportDate(now)}`;
  const nextText = nextInstallment
    ? ` · Próxima: ${installmentLabel(nextInstallment)} vence ${formatReportDate(
        nextInstallment.dueDate
      )}`
    : "";

  return `${coveredText}${nextText}`;
}

function getReportData(rows = []) {
  const activeRows = rows.filter((row) => !row.isRemoved);
  const sourceRows = activeRows.length ? activeRows : rows;
  const hasPendingBalance = (row) => (row.balance || 0) > 0;
  const unpaidRows = sourceRows.filter(
    (row) => (row.totalPaid || 0) <= 0 && hasPendingBalance(row)
  );
  const partialRows = sourceRows.filter(
    (row) => (row.totalPaid || 0) > 0 && hasPendingBalance(row)
  );
  const currentRows = sourceRows.filter(
    (row) => (row.finalAmount || 0) > 0 && !hasPendingBalance(row)
  );
  const delinquentRows = sourceRows.filter((row) => hasPendingBalance(row) && isDelinquent(row));

  return {
    totalParticipants: sourceRows.length,
    unpaidRows,
    partialRows,
    currentRows,
    delinquentRows,
    unpaidGroups: groupByInstrument(unpaidRows),
    partialGroups: groupByInstrument(partialRows),
    currentGroups: groupByInstrument(currentRows),
    totalPaid: sourceRows.reduce((sum, row) => sum + (row.totalPaid || 0), 0),
    totalPending: sourceRows.reduce((sum, row) => sum + Math.max(0, row.balance || 0), 0),
  };
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
    `Pago parcial: ${data.partialRows.length}`,
    `Morosos: ${data.delinquentRows.length}`,
    `100% al día: ${data.currentRows.length}`,
    `Cobrado: ${fmtAmount(data.totalPaid)}`,
    `Pendiente por cobrar: ${fmtAmount(data.totalPending)}`,
    "",
    buildWhatsappSection(
      "*SIN NINGUN PAGO*",
      data.unpaidGroups,
      (row) =>
        `${participantLabel(row)} · Debe ${fmtAmount(
          Math.max(0, row.balance || row.finalAmount || 0)
        )}\n   ${isDelinquent(row) ? "🔴 " : "✅ "}${buildPaymentSituation(row)}`
    ),
    "",
    buildWhatsappSection(
      "*PAGO PARCIAL · SALDO PENDIENTE*",
      data.partialGroups,
      (row) =>
        `${participantLabel(row)} · Pagado ${fmtAmount(row.totalPaid || 0)} · Le falta ${fmtAmount(
          Math.max(0, row.balance || 0)
        )}\n   ${isDelinquent(row) ? "🔴 " : "✅ "}${buildPaymentSituation(row)}`
    ),
    "",
    buildWhatsappSection(
      "*✅ 100% AL DIA*",
      data.currentGroups,
      (row) =>
        `${participantLabel(row)} · Pagado ${fmtAmount(row.totalPaid || 0)} · Saldo ${fmtAmount(
          0
        )}\n   ✅ ${buildPaymentSituation(row)}`
    ),
  ].join("\n");
}

function buildPrintGroupHTML(groups, { paid, showStatus = false }) {
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
        <th>Teléfono</th>
        <th>Situación de cuotas</th>
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
          ${showStatus && isDelinquent(row) ? `<span class="tag late">Moroso</span>` : ""}
        </td>
        <td>${escapeHTML(row.phone || "Sin teléfono")}</td>
        <td class="situation">${escapeHTML(buildPaymentSituation(row))}</td>
        <td class="num">${escapeHTML(fmtAmount(row.finalAmount || 0))}</td>
        <td class="num ${paid ? "paid" : ""}">${escapeHTML(fmtAmount(row.totalPaid || 0))}</td>
        <td class="num debt">${escapeHTML(fmtAmount(Math.max(0, row.balance || 0)))}</td>
      </tr>`
        )
        .join("")}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4">${group.members.length} participante${
        group.members.length !== 1 ? "s" : ""
      }</td>
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
    .situation { min-width: 190px; color: #374151; line-height: 1.35; }
    .paid { color: #047857; font-weight: 800; }
    .debt { color: #b45309; font-weight: 800; }
    .tag { display: inline-block; margin-left: 6px; padding: 1px 5px; border-radius: 99px; background: #fee2e2; color: #b91c1c; font-size: 8px; font-weight: 800; text-transform: uppercase; }
    .tag.late { background: #dc2626; color: #ffffff; }
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

    <div class="stats" style="grid-template-columns:repeat(5,1fr)">
      <div class="stat"><strong>${data.unpaidRows.length}</strong><span>Sin ningun pago</span></div>
      <div class="stat"><strong>${data.partialRows.length}</strong><span>Pago parcial</span></div>
      <div class="stat"><strong>${data.delinquentRows.length}</strong><span>Morosos</span></div>
      <div class="stat"><strong>${data.currentRows.length}</strong><span>100% al dia</span></div>
      <div class="stat"><strong>${escapeHTML(
        fmtAmount(data.totalPaid)
      )}</strong><span>Total pagado</span></div>
    </div>

    <div class="section-title">
      <h2>Sin ningun pago</h2>
      <span>Agrupado por instrumento</span>
    </div>
    ${buildPrintGroupHTML(data.unpaidGroups, { paid: false, showStatus: true })}

    <div class="section-title">
      <h2>Pago parcial · saldo pendiente</h2>
      <span>Pagado y monto que le falta a cada participante</span>
    </div>
    ${buildPrintGroupHTML(data.partialGroups, { paid: true, showStatus: true })}

    <div class="section-title">
      <h2>100% al dia</h2>
      <span>Sin saldo pendiente</span>
    </div>
    ${buildPrintGroupHTML(data.currentGroups, { paid: true })}

    <div class="stats" style="grid-template-columns:repeat(2,1fr);margin-top:22px">
      <div class="stat"><strong>${escapeHTML(
        fmtAmount(data.totalPending)
      )}</strong><span>Total por cobrar</span></div>
      <div class="stat"><strong>${
        data.delinquentRows.length
      }</strong><span>Participantes morosos marcados en rojo</span></div>
    </div>

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
