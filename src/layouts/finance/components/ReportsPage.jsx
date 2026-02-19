/**
 * ReportsPage — /finance/reports
 */
import React, { useState } from "react";
import PropTypes from "prop-types";

import { useLazyQuery } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { GET_DAILY_SUMMARY, GET_RANGE_SUMMARY, GET_MONTHLY_DATASET } from "graphql/queries/finance";
import {
  formatCRC,
  todayStr,
  weekAgoStr,
  fmtBusinessDate,
  paymentLabel,
  monthName,
  downloadMonthlyPDF,
} from "utils/finance";
import { Skeleton, StatCard } from "./FinanceAtoms";
import { FinancePageHeader } from "./FinancePageHeader";
/**
 * UI helpers
 */
const SectionCard = ({ title, children }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
    {title ? (
      <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">
        {title}
      </p>
    ) : null}
    {children}
  </div>
);

SectionCard.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
};

const RowItem = ({ left, right, subLeft }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 hover:border-slate-300 transition-colors">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-800 truncate">{left}</p>
      {subLeft ? <p className="text-xs text-slate-500 mt-0.5 truncate">{subLeft}</p> : null}
    </div>
    <div className="text-right shrink-0">{right}</div>
  </div>
);

RowItem.propTypes = {
  left: PropTypes.string.isRequired,
  right: PropTypes.node.isRequired,
  subLeft: PropTypes.string,
};

const MethodBreakdown = ({ items, label }) => {
  if (!items?.length) return null;

  return (
    <SectionCard title={label}>
      <div className="space-y-2">
        {items.map((m) => (
          <RowItem
            key={m.method}
            left={paymentLabel(m.method)}
            right={
              <div className="leading-tight">
                <p className="text-sm font-extrabold text-slate-900 tabular-nums">
                  {formatCRC(m.total)}
                </p>
                <p className="text-xs font-semibold text-slate-500 tabular-nums mt-0.5">
                  {m.count} mov.
                </p>
              </div>
            }
          />
        ))}
      </div>
    </SectionCard>
  );
};

const CategoryBreakdown = ({ items }) => {
  if (!items?.length) return null;

  return (
    <SectionCard title="Egresos por categoría">
      <div className="space-y-2">
        {items.map((c) => (
          <RowItem
            key={c.categorySnapshot}
            left={c.categorySnapshot}
            right={
              <div className="leading-tight">
                <p className="text-sm font-extrabold text-red-600 tabular-nums">
                  {formatCRC(c.totalAmount)}
                </p>
                <p className="text-xs font-semibold text-slate-500 tabular-nums mt-0.5">
                  {c.count} mov.
                </p>
              </div>
            }
          />
        ))}
      </div>
    </SectionCard>
  );
};

const ProductBreakdown = ({ items }) => {
  if (!items?.length) return null;

  return (
    <SectionCard title="Ventas por producto">
      <div className="space-y-2">
        {items.map((p) => (
          <RowItem
            key={p.name}
            left={p.name}
            subLeft={`${p.totalUnits} unidades`}
            right={
              <p className="text-sm font-extrabold text-emerald-700 tabular-nums">
                {formatCRC(p.totalRevenue)}
              </p>
            }
          />
        ))}
      </div>
    </SectionCard>
  );
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const DailySummaryTab = () => {
  const [date, setDate] = useState(todayStr());
  const [fetch, { data, loading, error, called }] = useLazyQuery(GET_DAILY_SUMMARY, {
    fetchPolicy: "network-only",
  });
  const summary = data?.dailySummary;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <SectionCard title="Filtro">
        <div className="grid grid-cols-1 sm:grid-cols-[260px_auto] gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900"
            />

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDate(todayStr())}
                className="px-3 py-1.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setDate(d.toISOString().slice(0, 10));
                }}
                className="px-3 py-1.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Ayer
              </button>
            </div>
          </div>

          <button
            onClick={() => fetch({ variables: { businessDate: date } })}
            disabled={loading}
            className="w-full sm:w-auto inline-flex justify-center items-center px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-extrabold disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? "Cargando…" : "Ver resumen"}
          </button>
        </div>
      </SectionCard>

      {/* States */}
      {loading && (
        <div className="space-y-3">
          <Skeleton />
          <Skeleton />
        </div>
      )}
      {error && (
        <SectionCard title="Error">
          <p className="text-sm text-red-600">{error.message}</p>
        </SectionCard>
      )}
      {!loading && !called && (
        <SectionCard>
          <div className="py-8 text-center">
            <p className="text-4xl mb-2">📊</p>
            <p className="text-sm font-semibold text-slate-800">Seleccioná una fecha</p>
            <p className="text-sm text-slate-500 mt-1">Luego pulsá “Ver resumen”.</p>
          </div>
        </SectionCard>
      )}

      {/* Results */}
      {!loading && summary && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              label="Ingresos"
              value={formatCRC(summary.totalSales)}
              valueClass="text-emerald-700"
              sub={fmtBusinessDate(summary.businessDate)}
            />
            <StatCard
              label="Egresos"
              value={formatCRC(summary.totalExpenses)}
              valueClass="text-red-600"
            />
            <StatCard
              label="Neto"
              value={formatCRC(summary.net)}
              valueClass={summary.net >= 0 ? "text-slate-900" : "text-red-600"}
            />
          </div>

          {/* Caja */}
          {summary.session && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                    Sesión de caja
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {fmtBusinessDate(summary.businessDate)}
                  </p>
                </div>

                {summary.session.difference != null && (
                  <span
                    className={
                      Math.abs(summary.session.difference) < 1
                        ? "inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white"
                        : "inline-flex items-center rounded-full bg-red-600 px-3 py-1 text-xs font-extrabold text-white"
                    }
                  >
                    {Math.abs(summary.session.difference) < 1
                      ? "✓ Cuadra"
                      : `Diferencia ${formatCRC(summary.session.difference)}`}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Apertura
                  </p>
                  <p className="mt-1 text-base font-extrabold text-slate-900 tabular-nums">
                    {formatCRC(summary.session.openingCash)}
                  </p>
                </div>

                {summary.session.countedCash != null && (
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Contado
                    </p>
                    <p className="mt-1 text-base font-extrabold text-slate-900 tabular-nums">
                      {formatCRC(summary.session.countedCash)}
                    </p>
                  </div>
                )}

                {summary.session.difference != null && (
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Diferencia
                    </p>
                    <p
                      className={
                        "mt-1 text-base font-extrabold tabular-nums " +
                        (Math.abs(summary.session.difference) < 1
                          ? "text-emerald-700"
                          : "text-red-600")
                      }
                    >
                      {formatCRC(summary.session.difference)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Desgloses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <MethodBreakdown items={summary.salesByMethod} label="Ingresos por método" />
            <MethodBreakdown items={summary.expensesByMethod} label="Egresos por método" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CategoryBreakdown items={summary.expensesByCategory} />
            <ProductBreakdown items={summary.productSales} />
          </div>
        </div>
      )}
    </div>
  );
};

const RangeSummaryTab = () => {
  const [dateFrom, setDateFrom] = useState(weekAgoStr());
  const [dateTo, setDateTo] = useState(todayStr());
  const [rangeError, setRangeError] = useState(null);
  const [fetch, { data, loading, error, called }] = useLazyQuery(GET_RANGE_SUMMARY, {
    fetchPolicy: "network-only",
  });
  const summary = data?.rangeSummary;

  const run = () => {
    if (dateFrom > dateTo) {
      setRangeError("Fecha inicial no puede ser mayor que la final.");
      return;
    }
    setRangeError(null);
    fetch({ variables: { dateFrom, dateTo } });
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <SectionCard title="Filtro">
        <div className="grid grid-cols-1 sm:grid-cols-[260px_260px_auto] gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900"
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDateFrom(weekAgoStr());
                  setDateTo(todayStr());
                  setRangeError(null);
                }}
                className="px-3 py-1.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Últimos 7 días
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const first = new Date(now.getFullYear(), now.getMonth(), 1)
                    .toISOString()
                    .slice(0, 10);
                  setDateFrom(first);
                  setDateTo(todayStr());
                  setRangeError(null);
                }}
                className="px-3 py-1.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Mes actual
              </button>
            </div>
          </div>

          <button
            onClick={run}
            disabled={loading}
            className="w-full sm:w-auto inline-flex justify-center items-center px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-extrabold disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? "Cargando…" : "Generar reporte"}
          </button>
        </div>

        {rangeError && <p className="text-xs text-red-600 font-semibold mt-3">{rangeError}</p>}
      </SectionCard>

      {/* States */}
      {loading && (
        <div className="space-y-3">
          <Skeleton />
          <Skeleton />
        </div>
      )}
      {error && (
        <SectionCard title="Error">
          <p className="text-sm text-red-600">{error.message}</p>
        </SectionCard>
      )}
      {!loading && !called && (
        <SectionCard>
          <div className="py-8 text-center">
            <p className="text-4xl mb-2">📈</p>
            <p className="text-sm font-semibold text-slate-800">Seleccioná un rango</p>
            <p className="text-sm text-slate-500 mt-1">Luego pulsá “Generar reporte”.</p>
          </div>
        </SectionCard>
      )}

      {/* Results */}
      {!loading && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              label="Ingresos"
              value={formatCRC(summary.totalSales)}
              valueClass="text-emerald-700"
              sub={`${fmtBusinessDate(summary.dateFrom)} → ${fmtBusinessDate(summary.dateTo)}`}
            />
            <StatCard
              label="Egresos"
              value={formatCRC(summary.totalExpenses)}
              valueClass="text-red-600"
            />
            <StatCard
              label="Neto"
              value={formatCRC(summary.net)}
              valueClass={summary.net >= 0 ? "text-slate-900" : "text-red-600"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <MethodBreakdown items={summary.salesByMethod} label="Ingresos por método" />
            <MethodBreakdown items={summary.expensesByMethod} label="Egresos por método" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CategoryBreakdown items={summary.expensesByCategory} />
            <ProductBreakdown items={summary.productSales} />
          </div>

          {summary.activitiesSummary?.length > 0 && (
            <SectionCard title="Por actividad">
              <div className="space-y-2">
                {summary.activitiesSummary.map((a) => (
                  <div
                    key={a.activityId}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800 min-w-0 truncate">
                        {a.name || "Sin nombre"}
                      </p>
                      <p
                        className={`text-sm font-extrabold tabular-nums shrink-0 ${
                          a.net >= 0 ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {formatCRC(a.net)}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-col sm:flex-row sm:gap-6 gap-1 text-xs font-semibold text-slate-500">
                      <span className="tabular-nums">Ingresos: {formatCRC(a.totalSales)}</span>
                      <span className="tabular-nums">Egresos: {formatCRC(a.totalExpenses)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
};

const MonthlyPDFTab = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [pdfLoading, setPdfLoading] = useState(false);
  const [fetch, { data, loading, error, called }] = useLazyQuery(GET_MONTHLY_DATASET, {
    fetchPolicy: "network-only",
  });
  const dataset = data?.monthlyReportDataset;
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const handleDownload = () => {
    if (!dataset) return;
    setPdfLoading(true);
    downloadMonthlyPDF(dataset);
    setTimeout(() => setPdfLoading(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <SectionCard title="Filtro">
        <div className="grid grid-cols-1 sm:grid-cols-[260px_200px_auto] gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Mes</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {monthName(i + 1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Año</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetch({ variables: { month: Number(month), year: Number(year) } })}
            disabled={loading}
            className="w-full sm:w-auto inline-flex justify-center items-center px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-extrabold disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? "Cargando…" : "Preparar informe"}
          </button>
        </div>
      </SectionCard>

      {loading && (
        <div className="space-y-3">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      )}
      {error && (
        <SectionCard title="Error">
          <p className="text-sm text-red-600">{error.message}</p>
        </SectionCard>
      )}
      {!loading && !called && (
        <SectionCard>
          <div className="py-10 text-center">
            <p className="text-5xl mb-3">📄</p>
            <p className="text-base font-semibold text-slate-800">Informe mensual</p>
            <p className="text-sm text-slate-500 mt-1">
              Elegí mes y año, luego pulsá <strong>Preparar informe</strong> para descargar el PDF.
            </p>
          </div>
        </SectionCard>
      )}

      {!loading && dataset && (
        <div className="space-y-6">
          {/* Download CTA — premium solid */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white text-center space-y-3 shadow-lg">
            <p className="text-lg font-extrabold">
              Informe {monthName(dataset.month)} {dataset.year} 📥
            </p>
            <p className="text-sm text-slate-200">Banda CEDES Don Bosco · Listo para descargar</p>
            <button
              onClick={handleDownload}
              disabled={pdfLoading}
              className="inline-flex justify-center items-center gap-2 px-8 py-3 rounded-2xl bg-white text-slate-900 font-extrabold text-sm hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-60 shadow-md"
            >
              {pdfLoading ? "Preparando…" : "⬇ Descargar PDF"}
            </button>
          </div>

          {/* Preview KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              label="Ingresos"
              value={formatCRC(dataset.summary.totalSales)}
              valueClass="text-emerald-700"
            />
            <StatCard
              label="Egresos"
              value={formatCRC(dataset.summary.totalExpenses)}
              valueClass="text-red-600"
            />
            <StatCard
              label="Neto"
              value={formatCRC(dataset.summary.net)}
              valueClass={dataset.summary.net >= 0 ? "text-slate-900" : "text-red-600"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <MethodBreakdown items={dataset.summary.salesByMethod} label="Ingresos por método" />
            <CategoryBreakdown items={dataset.summary.expensesByCategory} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ProductBreakdown items={dataset.summary.productSales} />
            {/* espacio por si luego agregás otra tarjeta */}
            <div className="hidden lg:block" />
          </div>

          {dataset.dailyBreakdown?.length > 0 && (
            <SectionCard title="Desglose diario">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-100">
                    <tr>
                      {["Fecha", "Ingresos", "Egresos", "Neto"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[11px] font-extrabold text-slate-600 uppercase tracking-widest"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {dataset.dailyBreakdown.map((d) => (
                      <tr key={d.businessDate} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
                          {fmtBusinessDate(d.businessDate)}
                        </td>
                        <td className="px-4 py-3 text-sm font-extrabold text-emerald-700 tabular-nums whitespace-nowrap">
                          {formatCRC(d.totalSales)}
                        </td>
                        <td className="px-4 py-3 text-sm font-extrabold text-red-600 tabular-nums whitespace-nowrap">
                          {formatCRC(d.totalExpenses)}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-extrabold tabular-nums whitespace-nowrap ${
                            d.net >= 0 ? "text-slate-900" : "text-red-600"
                          }`}
                        >
                          {formatCRC(d.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {dataset.assetPurchases?.length > 0 && (
            <SectionCard title="Activos del mes">
              <div className="space-y-2">
                {dataset.assetPurchases.map((a) => (
                  <div
                    key={a.id}
                    className="border border-purple-200 bg-purple-50 rounded-xl px-3 py-2.5 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{a.concept}</p>
                      {a.purpose ? (
                        <p className="text-xs text-slate-700 mt-0.5 truncate">{a.purpose}</p>
                      ) : null}
                      <p className="text-xs font-semibold text-slate-600 mt-1 truncate">
                        {fmtBusinessDate(a.businessDate)}
                        {a.vendor ? ` · ${a.vendor}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-extrabold text-purple-700 tabular-nums shrink-0">
                      {formatCRC(a.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const ReportsPage = () => {
  const [tab, setTab] = useState("daily");
  const TABS = [
    { id: "daily", label: "📅 Diario" },
    { id: "range", label: "📈 Rango" },
    { id: "monthly", label: "📄 Mensual" },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="page-content space-y-5">
        <FinancePageHeader
          title="Informes"
          description="Revisá el desempeño de tu negocio con nuestros informes detallados. Analizá ventas, gastos y más para tomar decisiones informadas."
          backTo="/finance"
          backLabel="Volver a la caja"
        />

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
          {/* Tabs — premium pills + scroll on mobile */}
          <div className="p-2 border-b border-slate-200">
            <div className="flex gap-2 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={
                    "flex-none whitespace-nowrap px-4 py-2.5 text-sm font-extrabold rounded-xl transition-colors " +
                    (tab === t.id
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {tab === "daily" && <DailySummaryTab />}
            {tab === "range" && <RangeSummaryTab />}
            {tab === "monthly" && <MonthlyPDFTab />}
          </div>
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
};

export default ReportsPage;

MethodBreakdown.propTypes = {
  label: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      method: PropTypes.string.isRequired,
      total: PropTypes.number.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
};

CategoryBreakdown.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      categorySnapshot: PropTypes.string.isRequired,
      totalAmount: PropTypes.number.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
};

ProductBreakdown.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      totalUnits: PropTypes.number.isRequired,
      totalRevenue: PropTypes.number.isRequired,
    })
  ),
};
