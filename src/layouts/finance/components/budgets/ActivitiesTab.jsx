/**
 * budgets/ActivitiesTab.jsx
 * Tab de actividades pendientes de liquidación + historial de liquidadas.
 *
 * FIXES v2:
 * - SettlementRow usa settlement.activityNameSnapshot (no activityName)
 * - Importa DistributeActivityModal (el unificado correcto)
 * - Botón de distribución también disponible cuando netProfit === 0 con nota
 */
import React, { useState } from "react";
import PropTypes from "prop-types";
import { useQuery } from "@apollo/client";

import {
  GET_ACTIVITIES_PENDING_SETTLEMENT,
  GET_ALL_ACTIVITY_SETTLEMENTS,
} from "graphql/queries/finance";
import { formatCRC, fmtDatetime } from "utils/finance";
import { Skeleton, FilterPill } from "../FinanceAtoms";
import DistributeActivityModal from "./DistributeActivityModal";

// ─── PendingActivityRow ───────────────────────────────────────────────────────

const PendingActivityRow = ({ activity, onDistribute }) => {
  const hasProfit = (activity.netProfit || 0) > 0;

  return (
    <div className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 truncate">
            {activity.activityName || activity.activityId}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-500">
            <span>
              Ingresos:{" "}
              <span className="font-semibold text-emerald-700">
                {formatCRC(activity.totalSales || 0)}
              </span>
            </span>
            <span>
              Gastos:{" "}
              <span className="font-semibold text-red-600">
                {formatCRC(activity.totalExpenses || 0)}
              </span>
            </span>
            {(activity.inventoryCostConsumed || 0) > 0 && (
              <span>
                Inventario:{" "}
                <span className="font-semibold text-amber-700">
                  {formatCRC(activity.inventoryCostConsumed)}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p
            className={`text-base font-extrabold tabular-nums ${
              (activity.netProfit || 0) >= 0 ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {(activity.netProfit || 0) >= 0 ? "+" : ""}
            {formatCRC(activity.netProfit || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">utilidad neta</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        {activity.isAlreadySettled ? (
          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            ✓ Liquidada
          </span>
        ) : (
          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
            Pendiente
          </span>
        )}

        {!activity.isAlreadySettled && (
          <button
            onClick={() => onDistribute(activity)}
            className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95 ${
              hasProfit ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-500 hover:bg-slate-600"
            }`}
          >
            {hasProfit ? "Distribuir utilidad" : "Registrar (₡0)"}
          </button>
        )}
      </div>
    </div>
  );
};

PendingActivityRow.propTypes = {
  activity: PropTypes.object.isRequired,
  onDistribute: PropTypes.func.isRequired,
};

// ─── SettlementRow ────────────────────────────────────────────────────────────

const SettlementRow = ({ settlement }) => (
  <div className="border border-slate-200 rounded-2xl p-4 bg-white">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        {/* ✅ FIX: era settlement.activityName, el campo correcto es activityNameSnapshot */}
        <p className="text-sm font-bold text-slate-900 truncate">
          {settlement.activityNameSnapshot || settlement.activityId}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          Liquidada: {settlement.businessDate || fmtDatetime(settlement.createdAt)}
        </p>
        {settlement.calculatedFromDate && (
          <p className="text-xs text-slate-400">
            Rango: {settlement.calculatedFromDate} → {settlement.calculatedToDate}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-base font-extrabold text-emerald-700 tabular-nums">
          +{formatCRC(settlement.netProfit || 0)}
        </p>
        <span
          className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
            settlement.status === "ACTIVE"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {settlement.status === "ACTIVE" ? "Activa" : "Anulada"}
        </span>
      </div>
    </div>

    {/* Desglose por comité */}
    {settlement.distributionSnapshot?.length > 0 && (
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {settlement.distributionSnapshot.map((d) => (
          <div
            key={d.committeeId}
            className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-100"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-violet-600">{d.percentage}%</span>
              <p className="text-xs font-semibold text-slate-600 truncate">{d.committeeName}</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 tabular-nums ml-1 shrink-0">
              +{formatCRC(d.amount)}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

SettlementRow.propTypes = { settlement: PropTypes.object.isRequired };

// ─── ActivitiesTab ────────────────────────────────────────────────────────────

export const ActivitiesTab = ({ onDistributed }) => {
  const [tab, setTab] = useState("pending");
  const [distributeTarget, setDistributeTarget] = useState(null);

  const {
    data: pendingData,
    loading: pendingLoading,
    refetch: refetchPending,
  } = useQuery(GET_ACTIVITIES_PENDING_SETTLEMENT, { fetchPolicy: "cache-and-network" });

  const {
    data: settlementsData,
    loading: settlementsLoading,
    refetch: refetchSettlements,
  } = useQuery(GET_ALL_ACTIVITY_SETTLEMENTS, { fetchPolicy: "cache-and-network" });

  const pending = pendingData?.activitiesPendingSettlement || [];
  const settlements = settlementsData?.allActivitySettlements || [];

  const pendingCount = pending.filter((a) => !a.isAlreadySettled).length;

  const handleDistributed = (result) => {
    setDistributeTarget(null);
    refetchPending();
    refetchSettlements();
    onDistributed?.();
    // Cambiar a tab de liquidadas para ver el resultado
    setTab("settled");
  };

  return (
    <>
      {distributeTarget && (
        <DistributeActivityModal
          activity={distributeTarget}
          onClose={() => setDistributeTarget(null)}
          onSuccess={handleDistributed}
        />
      )}

      <div className="space-y-4">
        {/* Sub-tabs */}
        <div className="flex gap-2 flex-wrap">
          <FilterPill active={tab === "pending"} onClick={() => setTab("pending")}>
            Pendientes
            {pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">
                {pendingCount}
              </span>
            )}
          </FilterPill>
          <FilterPill active={tab === "settled"} onClick={() => setTab("settled")}>
            Liquidadas ({settlements.length})
          </FilterPill>
        </div>

        {/* Pendientes */}
        {tab === "pending" && (
          <>
            {pendingLoading && <Skeleton />}
            {!pendingLoading && pending.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-4xl mb-2">✅</p>
                <p className="text-sm font-semibold text-slate-600">
                  Todas las actividades están liquidadas
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  No hay utilidades pendientes de distribución.
                </p>
              </div>
            )}
            {!pendingLoading && pending.length > 0 && (
              <div className="space-y-3">
                {pending.map((activity) => (
                  <PendingActivityRow
                    key={activity.activityId}
                    activity={activity}
                    onDistribute={setDistributeTarget}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Liquidadas */}
        {tab === "settled" && (
          <>
            {settlementsLoading && <Skeleton />}
            {!settlementsLoading && settlements.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-sm font-semibold text-slate-600">Sin liquidaciones aún</p>
                <p className="text-xs text-slate-400 mt-1">
                  Aquí aparecerán las distribuciones de utilidades realizadas.
                </p>
              </div>
            )}
            {!settlementsLoading && settlements.length > 0 && (
              <div className="space-y-3">
                {settlements.map((s) => (
                  <SettlementRow key={s.id} settlement={s} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

ActivitiesTab.propTypes = { onDistributed: PropTypes.func };

export default ActivitiesTab;
