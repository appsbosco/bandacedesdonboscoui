/**
 * CommitteeDetailPage.jsx — /finance/budgets/:committeeId
 *
 * Mejoras v3:
 * - Filtro de rango de fechas en la UI (el backend soporta dateFrom/dateTo)
 * - Muestra manualCredits, manualDebits del CommitteeBudgetSummary
 * - LedgerRow expandible para ver activityId, expenseId, budgetInitializationId, etc.
 * - Footer con entryCount del ledger
 * - Estado vacío mejorado con contexto según filtro activo
 */
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import PropTypes from "prop-types";

import { GET_COMMITTEE_BUDGET_SUMMARY, GET_COMMITTEE_LEDGER } from "graphql/queries/finance";
import { formatCRC, fmtDatetime, fmtBusinessDate } from "utils/finance";
import { Skeleton, StatCard, FilterPill } from "./FinanceAtoms";
import { FinancePageHeader } from "./FinancePageHeader";

// ─── Configuración visual de tipos de entrada ─────────────────────────────────

const ENTRY_TYPE_CFG = {
  INITIAL_ALLOCATION: {
    label: "Asignación inicial",
    color: "bg-violet-100 text-violet-700",
    isCredit: true,
  },
  UTILITY_DISTRIBUTION: {
    label: "Utilidad distribuida",
    color: "bg-emerald-100 text-emerald-700",
    isCredit: true,
  },
  EXPENSE_DEBIT: {
    label: "Gasto",
    color: "bg-red-100 text-red-700",
    isCredit: false,
  },
  MANUAL_CREDIT: {
    label: "Crédito manual",
    color: "bg-blue-100 text-blue-700",
    isCredit: true,
  },
  MANUAL_DEBIT: {
    label: "Débito manual",
    color: "bg-orange-100 text-orange-700",
    isCredit: false,
  },
  ADJUSTMENT: {
    label: "Ajuste",
    color: "bg-slate-100 text-slate-600",
    isCredit: null,
  },
};

const getCfg = (type) =>
  ENTRY_TYPE_CFG[type] || { label: type, color: "bg-slate-100 text-slate-600", isCredit: null };

// ─── LedgerRow ────────────────────────────────────────────────────────────────
// Expandible para mostrar metadata adicional del ledger

const LedgerRow = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = getCfg(entry.entryType);
  const isCredit = cfg.isCredit !== null ? cfg.isCredit : (entry.creditAmount || 0) > 0;
  const amount = isCredit ? entry.creditAmount || 0 : entry.debitAmount || 0;
  const hasMetadata =
    entry.activityId ||
    entry.expenseId ||
    entry.activitySettlementId ||
    entry.budgetInitializationId;

  return (
    <div
      className={`border rounded-xl transition-colors ${
        entry.status !== "ACTIVE"
          ? "opacity-50 border-slate-100 bg-slate-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${cfg.color}`}
              >
                {cfg.label}
              </span>
              {entry.status === "VOIDED" && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
                  Anulado
                </span>
              )}
            </div>
            {entry.description && (
              <p className="text-sm font-semibold text-slate-800 truncate">{entry.description}</p>
            )}
            {entry.notes && <p className="text-xs text-slate-400 truncate italic">{entry.notes}</p>}
            <p className="text-xs text-slate-400 mt-0.5">
              {fmtBusinessDate(entry.businessDate)} · {fmtDatetime(entry.createdAt)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p
              className={`text-base font-extrabold tabular-nums ${
                isCredit ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {isCredit ? "+" : "−"}
              {formatCRC(amount)}
            </p>
            <p className="text-xs font-semibold text-slate-500 tabular-nums mt-0.5">
              Saldo: {formatCRC(entry.runningBalance || 0)}
            </p>
            {hasMetadata && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 mt-1 transition-colors"
              >
                {expanded ? "▲ ocultar" : "▼ más info"}
              </button>
            )}
          </div>
        </div>

        {/* Metadata expandible */}
        {expanded && hasMetadata && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1">
            {entry.activityId && (
              <p className="text-xs text-slate-500">
                <span className="font-bold">Actividad:</span>{" "}
                <span className="font-mono text-[10px]">{entry.activityId}</span>
              </p>
            )}
            {entry.expenseId && (
              <p className="text-xs text-slate-500">
                <span className="font-bold">Gasto:</span>{" "}
                <span className="font-mono text-[10px]">{entry.expenseId}</span>
              </p>
            )}
            {entry.activitySettlementId && (
              <p className="text-xs text-slate-500">
                <span className="font-bold">Liquidación:</span>{" "}
                <span className="font-mono text-[10px]">{entry.activitySettlementId}</span>
              </p>
            )}
            {entry.budgetInitializationId && (
              <p className="text-xs text-slate-500">
                <span className="font-bold">Inicialización:</span>{" "}
                <span className="font-mono text-[10px]">{entry.budgetInitializationId}</span>
              </p>
            )}
            {entry.percentageSnapshot != null && (
              <p className="text-xs text-slate-500">
                <span className="font-bold">% snapshot:</span> {entry.percentageSnapshot}%
              </p>
            )}
            {entry.voidReason && (
              <p className="text-xs text-red-500 italic w-full">Motivo: {entry.voidReason}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

LedgerRow.propTypes = { entry: PropTypes.object.isRequired };

// ─── Filtros de tipo ──────────────────────────────────────────────────────────

const TYPE_FILTERS = [
  { id: "all", label: "Todos", entryType: undefined },
  { id: "INITIAL_ALLOCATION", label: "Inicial", entryType: "INITIAL_ALLOCATION" },
  { id: "UTILITY_DISTRIBUTION", label: "Utilidades", entryType: "UTILITY_DISTRIBUTION" },
  { id: "EXPENSE_DEBIT", label: "Gastos", entryType: "EXPENSE_DEBIT" },
  { id: "MANUAL_CREDIT", label: "Créditos", entryType: "MANUAL_CREDIT" },
  { id: "MANUAL_DEBIT", label: "Débitos", entryType: "MANUAL_DEBIT" },
];

// ─── CommitteeDetailPage ──────────────────────────────────────────────────────

const CommitteeDetailPage = () => {
  const { committeeId } = useParams();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  const { data: summaryData, loading: summaryLoading } = useQuery(GET_COMMITTEE_BUDGET_SUMMARY, {
    variables: { committeeId },
    fetchPolicy: "cache-and-network",
  });

  const selectedFilter = TYPE_FILTERS.find((f) => f.id === typeFilter);
  const { data: ledgerData, loading: ledgerLoading } = useQuery(GET_COMMITTEE_LEDGER, {
    variables: {
      committeeId,
      entryType: selectedFilter?.entryType || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  const summary = summaryData?.committeeBudgetSummary || null;
  const ledger = ledgerData?.committeeLedger || null;
  const entries = ledger?.entries || [];
  const committee = summary?.committee || ledger?.committee || null;

  const hasDateFilter = dateFrom || dateTo;

  const clearDateFilter = () => {
    setDateFrom("");
    setDateTo("");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="page-content space-y-5">
        <FinancePageHeader
          title={committee ? `Comité ${committee.name}` : "Detalle de comité"}
          description={
            committee
              ? `${committee.distributionPercentage}% del presupuesto STAFF${
                  committee.description ? ` · ${committee.description}` : ""
                }`
              : "Cargando…"
          }
          backTo="/finance/budgets"
          backLabel="Presupuestos"
          right={
            <button
              onClick={() => navigate("/finance/expenses")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-all active:scale-95"
            >
              + Registrar gasto
            </button>
          }
        />

        {/* Stats del comité */}
        {summaryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} lines={2} />
            ))}
          </div>
        ) : summary ? (
          <>
            {/* Saldo actual — prominente */}
            <div
              className={`rounded-2xl border p-5 flex items-center justify-between gap-4 ${
                summary.currentBalance < 0
                  ? "bg-red-50 border-red-200"
                  : "bg-emerald-50 border-emerald-200"
              }`}
            >
              <div>
                <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1">
                  Saldo disponible
                </p>
                <p
                  className={`text-3xl font-extrabold tabular-nums ${
                    summary.currentBalance < 0 ? "text-red-700" : "text-emerald-800"
                  }`}
                >
                  {formatCRC(summary.currentBalance)}
                </p>
              </div>
              {summary.currentBalance < 0 && (
                <div className="shrink-0 px-3 py-2 rounded-xl bg-red-100 border border-red-200 text-center">
                  <p className="text-xs font-bold text-red-700">Saldo</p>
                  <p className="text-xs font-bold text-red-700">negativo</p>
                </div>
              )}
            </div>

            {/* Stats grid — todos los campos del schema */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Asignación inicial"
                value={formatCRC(summary.initialAllocation || 0)}
                valueClass="text-violet-700"
              />
              <StatCard
                label="Utilidades recibidas"
                value={formatCRC(summary.utilityDistributions || 0)}
                valueClass="text-emerald-700"
              />
              <StatCard
                label="Gastos aplicados"
                value={formatCRC(summary.expenseDebits || 0)}
                valueClass="text-red-600"
              />
              <StatCard
                label="Movimientos"
                value={summary.entryCount || 0}
                valueClass="text-slate-900"
                sub={`${
                  summary.totalCredits != null ? formatCRC(summary.totalCredits) : "—"
                } créditos`}
              />
            </div>

            {/* Créditos/Débitos manuales si los hay */}
            {((summary.manualCredits || 0) > 0 || (summary.manualDebits || 0) > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {(summary.manualCredits || 0) > 0 && (
                  <StatCard
                    label="Créditos manuales"
                    value={formatCRC(summary.manualCredits || 0)}
                    valueClass="text-blue-700"
                  />
                )}
                {(summary.manualDebits || 0) > 0 && (
                  <StatCard
                    label="Débitos manuales"
                    value={formatCRC(summary.manualDebits || 0)}
                    valueClass="text-orange-600"
                  />
                )}
              </div>
            )}

            {/* Barra de progreso de gasto */}
            {(() => {
              const totalIn =
                (summary.initialAllocation || 0) + (summary.utilityDistributions || 0);
              const pct =
                totalIn > 0 ? Math.min(100, ((summary.expenseDebits || 0) / totalIn) * 100) : 0;
              const isHigh = pct > 80;
              return (
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Uso del presupuesto
                    </p>
                    <span
                      className={`text-xs font-bold ${
                        isHigh ? "text-amber-700" : "text-emerald-700"
                      }`}
                    >
                      {pct.toFixed(1)}% utilizado
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isHigh ? "bg-amber-400" : "bg-emerald-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {isHigh && (
                    <p className="text-xs text-amber-700 font-semibold mt-2">
                      ⚠️ Este comité ha usado más del 80% de su presupuesto total recibido.
                    </p>
                  )}
                </div>
              );
            })()}
          </>
        ) : null}

        {/* Historial de movimientos */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Historial de movimientos</h2>
            <div className="flex items-center gap-2">
              {hasDateFilter && (
                <button
                  onClick={clearDateFilter}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700"
                >
                  ✕ Limpiar fechas
                </button>
              )}
              <button
                onClick={() => setShowDateFilter((v) => !v)}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                  showDateFilter || hasDateFilter
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                📅 Fecha
              </button>
              <span className="text-xs text-slate-400">{entries.length} registros</span>
            </div>
          </div>

          {/* Filtro de fechas */}
          {showDateFilter && (
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex gap-3 items-end flex-wrap">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Desde</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Hasta</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                  />
                </div>
                {hasDateFilter && (
                  <button
                    onClick={clearDateFilter}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-white transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              {hasDateFilter && (
                <p className="text-xs text-slate-500 mt-2">
                  Mostrando movimientos
                  {dateFrom && ` desde ${fmtBusinessDate(dateFrom)}`}
                  {dateTo && ` hasta ${fmtBusinessDate(dateTo)}`}
                </p>
              )}
            </div>
          )}

          {/* Filtros de tipo */}
          <div className="px-5 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto">
            {TYPE_FILTERS.map(({ id, label }) => (
              <FilterPill key={id} active={typeFilter === id} onClick={() => setTypeFilter(id)}>
                {label}
              </FilterPill>
            ))}
          </div>

          {ledgerLoading && (
            <div className="p-5 space-y-3">
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          )}

          {!ledgerLoading && entries.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm font-semibold text-slate-600">Sin movimientos</p>
              <p className="text-xs text-slate-400 mt-1">
                {typeFilter !== "all"
                  ? `Sin movimientos de tipo "${
                      TYPE_FILTERS.find((f) => f.id === typeFilter)?.label
                    }".`
                  : hasDateFilter
                  ? "Sin movimientos en el rango de fechas seleccionado."
                  : "Este comité aún no tiene movimientos registrados."}
              </p>
              {(typeFilter !== "all" || hasDateFilter) && (
                <button
                  onClick={() => {
                    setTypeFilter("all");
                    clearDateFilter();
                  }}
                  className="mt-3 text-xs font-bold text-rose-600 hover:underline"
                >
                  Ver todos los movimientos
                </button>
              )}
            </div>
          )}

          {!ledgerLoading && entries.length > 0 && (
            <div className="p-4 space-y-2">
              {entries.map((entry) => (
                <LedgerRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}

          {/* Footer con totales del ledger */}
          {ledger && (
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-4 text-xs text-slate-500">
                <span>
                  Créditos:{" "}
                  <span className="font-bold text-emerald-700">
                    {formatCRC(ledger.totalCredits || 0)}
                  </span>
                </span>
                <span>
                  Débitos:{" "}
                  <span className="font-bold text-red-600">
                    {formatCRC(ledger.totalDebits || 0)}
                  </span>
                </span>
                {ledger.entryCount != null && (
                  <span>
                    Registros: <span className="font-bold text-slate-700">{ledger.entryCount}</span>
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-700">
                Saldo:{" "}
                <span
                  className={
                    (ledger.currentBalance || 0) >= 0 ? "text-emerald-700" : "text-red-600"
                  }
                >
                  {formatCRC(ledger.currentBalance || 0)}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
};

export default CommitteeDetailPage;
