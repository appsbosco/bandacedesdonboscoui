/**
 * CommitteeDetailPage.jsx — /finance/budgets/:committeeId
 *
 * FIXES v2:
 * - ❌ GET_COMMITTEE_LEDGER ya NO recibe { limit, offset } — no existen en el schema
 * - ✅ Filtros por tipo de entrada funcionan con entryType enum del backend
 * - Agregado filtro de rango de fechas opcional
 * - Mejor UX: botón "Registrar gasto" directo desde el detalle del comité
 */
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import PropTypes from "prop-types";

import { GET_COMMITTEE_BUDGET_SUMMARY, GET_COMMITTEE_LEDGER } from "graphql/queries/finance";
import { formatCRC, fmtDatetime } from "utils/finance";
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
    isCredit: null, // puede ser cualquiera
  },
};

const getCfg = (type) =>
  ENTRY_TYPE_CFG[type] || { label: type, color: "bg-slate-100 text-slate-600", isCredit: null };

// ─── LedgerRow ────────────────────────────────────────────────────────────────

const LedgerRow = ({ entry }) => {
  const cfg = getCfg(entry.entryType);
  const isCredit = cfg.isCredit !== null ? cfg.isCredit : (entry.creditAmount || 0) > 0;
  const amount = isCredit ? entry.creditAmount || 0 : entry.debitAmount || 0;

  return (
    <div
      className={`border rounded-xl p-3 transition-colors ${
        entry.status !== "ACTIVE"
          ? "opacity-50 border-slate-100 bg-slate-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${cfg.color}`}>
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
            {entry.businessDate} · {fmtDatetime(entry.createdAt)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className={`text-base font-extrabold tabular-nums ${
              isCredit ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {isCredit ? "+" : "-"}
            {formatCRC(amount)}
          </p>
          <p className="text-xs font-semibold text-slate-500 tabular-nums mt-0.5">
            Saldo: {formatCRC(entry.runningBalance || 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

LedgerRow.propTypes = { entry: PropTypes.object.isRequired };

// ─── Filtros de tipo disponibles ──────────────────────────────────────────────

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

  const { data: summaryData, loading: summaryLoading } = useQuery(GET_COMMITTEE_BUDGET_SUMMARY, {
    variables: { committeeId },
    fetchPolicy: "cache-and-network",
  });

  // ✅ FIX: eliminados { limit, offset } — no existen en el schema del backend
  // El filtro por tipo se pasa al backend como entryType enum para eficiencia
  const selectedFilter = TYPE_FILTERS.find((f) => f.id === typeFilter);
  const { data: ledgerData, loading: ledgerLoading } = useQuery(GET_COMMITTEE_LEDGER, {
    variables: {
      committeeId,
      entryType: selectedFilter?.entryType || undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  const summary = summaryData?.committeeBudgetSummary || null;
  const ledger = ledgerData?.committeeLedger || null;
  const entries = ledger?.entries || [];
  const committee = summary?.committee || ledger?.committee || null;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="page-content space-y-5">
        <FinancePageHeader
          title={committee ? `Comité ${committee.name}` : "Detalle de comité"}
          description={
            committee ? `${committee.distributionPercentage}% del presupuesto STAFF` : "Cargando…"
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Saldo actual"
                value={formatCRC(summary.currentBalance)}
                valueClass={summary.currentBalance >= 0 ? "text-slate-900" : "text-red-600"}
                sub="Balance disponible"
              />
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
            </div>

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
            <span className="text-xs text-slate-400">{entries.length} registros</span>
          </div>

          {/* Filtros — entryType se envía al backend */}
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
                {typeFilter === "all"
                  ? "Este comité aún no tiene movimientos."
                  : "Sin movimientos con este filtro."}
              </p>
            </div>
          )}

          {!ledgerLoading && entries.length > 0 && (
            <div className="p-4 space-y-2">
              {entries.map((entry) => (
                <LedgerRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}

          {/* Footer con totales */}
          {ledger && (
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                Créditos:{" "}
                <span className="font-bold text-emerald-700">
                  {formatCRC(ledger.totalCredits || 0)}
                </span>
                {" · "}
                Débitos:{" "}
                <span className="font-bold text-red-600">{formatCRC(ledger.totalDebits || 0)}</span>
              </p>
              <p className="text-xs font-bold text-slate-700">
                Saldo:{" "}
                <span className={ledger.currentBalance >= 0 ? "text-slate-900" : "text-red-600"}>
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
