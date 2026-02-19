/**
 * ReportsPage — /finance/reports
 */
import React, { useState } from "react";
import PropTypes from "prop-types";

import { useNavigate } from "react-router-dom";
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

const MethodBreakdown = ({ items, label }) => {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <div className="space-y-1.5">
        {items.map((m) => (
          <div
            key={m.method}
            className="flex items-center justify-between border border-slate-100 rounded-xl px-3 py-2"
          >
            <span className="text-sm font-semibold text-slate-700">{paymentLabel(m.method)}</span>
            <div className="text-right">
              <span className="text-sm font-extrabold text-slate-900">{formatCRC(m.total)}</span>
              <span className="text-xs text-slate-400 ml-2">({m.count})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CategoryBreakdown = ({ items }) => {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
        Egresos por categoría
      </p>
      <div className="space-y-1.5">
        {items.map((c) => (
          <div
            key={c.categorySnapshot}
            className="flex items-center justify-between border border-slate-100 rounded-xl px-3 py-2"
          >
            <span className="text-sm font-semibold text-slate-700">{c.categorySnapshot}</span>
            <div className="text-right">
              <span className="text-sm font-extrabold text-red-600">
                {formatCRC(c.totalAmount)}
              </span>
              <span className="text-xs text-slate-400 ml-2">({c.count})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductBreakdown = ({ items }) => {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
        Ventas por producto
      </p>
      <div className="space-y-1.5">
        {items.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between border border-slate-100 rounded-xl px-3 py-2"
          >
            <div>
              <p className="text-sm font-semibold text-slate-700">{p.name}</p>
              <p className="text-xs text-slate-400">{p.totalUnits} unidades</p>
            </div>
            <span className="text-sm font-extrabold text-emerald-700">
              {formatCRC(p.totalRevenue)}
            </span>
          </div>
        ))}
      </div>
    </div>
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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>
        <button
          onClick={() => fetch({ variables: { businessDate: date } })}
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
        >
          {loading ? "Cargando…" : "Ver resumen"}
        </button>
      </div>
      {loading && (
        <div className="space-y-3">
          <Skeleton />
          <Skeleton />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      {!loading && !called && (
        <div className="py-12 text-center text-slate-400">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm">Seleccioná una fecha y pulsá Ver resumen.</p>
        </div>
      )}
      {!loading && summary && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
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
          {summary.session && (
            <div className="border rounded-2xl p-4 border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Sesión de caja
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span>
                  Apertura: <strong>{formatCRC(summary.session.openingCash)}</strong>
                </span>
                {summary.session.countedCash != null && (
                  <span>
                    Contado: <strong>{formatCRC(summary.session.countedCash)}</strong>
                  </span>
                )}
                {summary.session.difference != null && (
                  <span
                    className={
                      Math.abs(summary.session.difference) < 1
                        ? "text-emerald-700 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {Math.abs(summary.session.difference) < 1
                      ? "✓ Cuadra"
                      : `Diferencia: ${formatCRC(summary.session.difference)}`}
                  </span>
                )}
              </div>
            </div>
          )}
          <MethodBreakdown items={summary.salesByMethod} label="Ingresos por método" />
          <MethodBreakdown items={summary.expensesByMethod} label="Egresos por método" />
          <CategoryBreakdown items={summary.expensesByCategory} />
          <ProductBreakdown items={summary.productSales} />
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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end flex-wrap">
        {[
          ["Desde", dateFrom, setDateFrom],
          ["Hasta", dateTo, setDateTo],
        ].map(([label, val, setter]) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">{label}</label>
            <input
              type="date"
              value={val}
              onChange={(e) => setter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>
        ))}
        <button
          onClick={run}
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
        >
          {loading ? "Cargando…" : "Generar"}
        </button>
      </div>
      {rangeError && <p className="text-xs text-red-600 font-semibold">{rangeError}</p>}
      {loading && (
        <div className="space-y-3">
          <Skeleton />
          <Skeleton />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      {!loading && !called && (
        <div className="py-12 text-center text-slate-400">
          <p className="text-3xl mb-2">📈</p>
          <p className="text-sm">Seleccioná un rango y generá el reporte.</p>
        </div>
      )}
      {!loading && summary && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
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
          <MethodBreakdown items={summary.salesByMethod} label="Ingresos por método" />
          <MethodBreakdown items={summary.expensesByMethod} label="Egresos por método" />
          <CategoryBreakdown items={summary.expensesByCategory} />
          <ProductBreakdown items={summary.productSales} />
          {summary.activitiesSummary?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Por actividad
              </p>
              <div className="space-y-1.5">
                {summary.activitiesSummary.map((a) => (
                  <div key={a.activityId} className="border border-slate-100 rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        {a.name || "Sin nombre"}
                      </p>
                      <p
                        className={`text-sm font-extrabold ${
                          a.net >= 0 ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {formatCRC(a.net)}
                      </p>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400 mt-0.5">
                      <span>Ingresos: {formatCRC(a.totalSales)}</span>
                      <span>Egresos: {formatCRC(a.totalExpenses)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">Mes</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {monthName(i + 1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">Año</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
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
          className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
        >
          {loading ? "Cargando…" : "Generar dataset"}
        </button>
      </div>
      {loading && (
        <div className="space-y-3">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      {!loading && !called && (
        <div className="py-16 text-center">
          <p className="text-5xl mb-3">📄</p>
          <p className="text-base font-semibold text-slate-700">Informe mensual</p>
          <p className="text-sm text-slate-400 mt-1">
            Generá el dataset y descargalo como PDF con el logo de la Banda.
          </p>
        </div>
      )}
      {!loading && dataset && (
        <div className="space-y-5">
          {/* Download CTA — prominent */}
          <div className="bg-gradient-to-br from-rose-700 to-rose-900 rounded-3xl p-6 text-white text-center space-y-3 shadow-lg">
            <p className="text-lg font-extrabold">
              📥 Informe {monthName(dataset.month)} {dataset.year}
            </p>
            <p className="text-sm text-rose-200">Banda CEDES Don Bosco · Listo para descargar</p>
            <button
              onClick={handleDownload}
              disabled={pdfLoading}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-white text-rose-800 font-bold text-sm hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-60 shadow-md"
            >
              {pdfLoading ? "Preparando…" : "⬇ Descargar PDF"}
            </button>
          </div>
          {/* Preview */}
          <div className="grid grid-cols-3 gap-3">
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
          <MethodBreakdown items={dataset.summary.salesByMethod} label="Ingresos por método" />
          <CategoryBreakdown items={dataset.summary.expensesByCategory} />
          <ProductBreakdown items={dataset.summary.productSales} />
          {dataset.dailyBreakdown?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                Desglose diario
              </p>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Fecha", "Ingresos", "Egresos", "Neto"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dataset.dailyBreakdown.map((d) => (
                      <tr key={d.businessDate} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                          {fmtBusinessDate(d.businessDate)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-emerald-700">
                          {formatCRC(d.totalSales)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-red-600">
                          {formatCRC(d.totalExpenses)}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-extrabold ${
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
            </div>
          )}
          {dataset.assetPurchases?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Activos del mes
              </p>
              <div className="space-y-1.5">
                {dataset.assetPurchases.map((a) => (
                  <div
                    key={a.id}
                    className="border border-purple-100 bg-purple-50/50 rounded-xl px-3 py-2 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{a.concept}</p>
                      {a.purpose && <p className="text-xs text-slate-500">{a.purpose}</p>}
                      <p className="text-xs text-slate-400">
                        {fmtBusinessDate(a.businessDate)}
                        {a.vendor ? ` · ${a.vendor}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-extrabold text-purple-700">{formatCRC(a.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const ReportsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("daily");
  const TABS = [
    { id: "daily", label: "📅 Diario" },
    { id: "range", label: "📈 Rango" },
    { id: "monthly", label: "📄 Mensual PDF" },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="page-content space-y-5">
        <div>
          <button
            onClick={() => navigate("/finance")}
            className="text-xs text-slate-400 hover:text-slate-600 mb-1 flex items-center gap-1"
          >
            ← Caja
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
          <div className="flex border-b border-slate-100">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-rose-600 text-rose-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-5">
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
