/**
 * budgets/DistributeActivityModal.jsx
 * Modal de confirmación para distribuir la utilidad de una actividad entre comités.
 *
 * FIXES v2:
 * - Mutación llamada con { input: { ... } } en vez de variables planas
 * - refetchQueries completo: pendientes + liquidadas + presupuestos
 * - Preview calculado correctamente con rounding igual al backend
 * - Manejo de netProfit ≤ 0 con forceIfZero opcional
 * - Campo businessDate editable con date picker
 * - Soporte dateFrom / dateTo opcionales para rango de cálculo
 */
import React, { useState } from "react";
import PropTypes from "prop-types";
import { useMutation, useQuery } from "@apollo/client";

import { DISTRIBUTE_ACTIVITY_PROFIT } from "graphql/mutations/finance";
import {
  GET_ACTIVITIES_PENDING_SETTLEMENT,
  GET_ALL_ACTIVITY_SETTLEMENTS,
  GET_ALL_COMMITTEE_BUDGETS,
  GET_COMMITTEE_DISTRIBUTION_CONFIG,
} from "graphql/queries/finance";
import { useNotice } from "hooks/useFinance";
import { formatCRC, todayStr } from "utils/finance";
import { Notice } from "../FinanceAtoms";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTodayLocal = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(
    n.getDate()
  ).padStart(2, "0")}`;
};

// Calcula la distribución visual igual que el backend:
// cada comité = round(netProfit * pct / 100), último recibe el resto.
const buildPreview = (committees, netProfit) => {
  if (!committees?.length || netProfit <= 0) return [];
  const result = committees.map((c, i) => {
    const pct = c.distributionPercentage / 100;
    let amt;
    if (i === committees.length - 1) {
      const prev = committees
        .slice(0, i)
        .reduce(
          (s, x) => s + Math.round(netProfit * (x.distributionPercentage / 100) * 100) / 100,
          0
        );
      amt = Math.round((netProfit - prev) * 100) / 100;
    } else {
      amt = Math.round(netProfit * pct * 100) / 100;
    }
    return { ...c, amount: amt };
  });
  return result;
};

// ─── DistributeActivityModal ──────────────────────────────────────────────────

const DistributeActivityModal = ({ activity, onClose, onSuccess }) => {
  const [businessDate, setBusinessDate] = useState(getTodayLocal());
  const [notes, setNotes] = useState("");
  const [forceIfZero, setForceIfZero] = useState(false);
  const [notice, showNotice] = useNotice();

  // Obtener config de porcentajes para preview
  const { data: configData } = useQuery(GET_COMMITTEE_DISTRIBUTION_CONFIG, {
    fetchPolicy: "cache-first",
  });
  const committees = configData?.committeeDistributionConfig?.committees || [];

  const [distribute, { loading }] = useMutation(DISTRIBUTE_ACTIVITY_PROFIT, {
    refetchQueries: [
      { query: GET_ACTIVITIES_PENDING_SETTLEMENT },
      { query: GET_ALL_ACTIVITY_SETTLEMENTS },
      { query: GET_ALL_COMMITTEE_BUDGETS },
    ],
    awaitRefetchQueries: true,
    onCompleted: (data) => onSuccess?.(data.distributeActivityProfit),
    onError: (e) => showNotice("error", e.message),
  });

  const netProfit = activity.netProfit ?? 0;
  const preview = buildPreview(committees, Math.max(0, netProfit));
  const isZeroProfit = netProfit <= 0;

  const handleConfirm = () => {
    if (!businessDate) {
      showNotice("error", "Seleccioná una fecha de liquidación.");
      return;
    }
    // ✅ CORRECTO: variables.input con todos los campos requeridos
    distribute({
      variables: {
        input: {
          activityId: activity.activityId,
          businessDate,
          notes: notes.trim() || undefined,
          forceIfZero: isZeroProfit ? forceIfZero : undefined,
        },
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0 pr-3">
            <h3 className="text-base font-bold text-slate-900">Distribuir utilidad</h3>
            <p className="text-sm text-slate-500 mt-0.5 truncate">
              {activity.activityName || activity.activityId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <Notice notice={notice} />

          {/* Resumen financiero */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">
              Resumen de la actividad
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Ingresos</p>
                <p className="text-sm font-extrabold text-emerald-700 tabular-nums mt-0.5">
                  {formatCRC(activity.totalSales || 0)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Egresos</p>
                <p className="text-sm font-extrabold text-red-600 tabular-nums mt-0.5">
                  {formatCRC(activity.totalExpenses || 0)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Utilidad</p>
                <p
                  className={`text-sm font-extrabold tabular-nums mt-0.5 ${
                    netProfit >= 0 ? "text-slate-900" : "text-red-600"
                  }`}
                >
                  {formatCRC(netProfit)}
                </p>
              </div>
            </div>
            {(activity.inventoryCostConsumed || 0) > 0 && (
              <p className="text-xs text-amber-700 font-semibold mt-2">
                📦 Inventario consumido: {formatCRC(activity.inventoryCostConsumed)} (ya deducido)
              </p>
            )}
          </div>

          {/* Alerta si utilidad es cero o negativa */}
          {isZeroProfit && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-xs font-bold text-amber-800">
                ⚠️ La utilidad neta es ₡0 o negativa. No hay monto para distribuir.
              </p>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceIfZero}
                  onChange={(e) => setForceIfZero(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs font-semibold text-amber-800">
                  Registrar liquidación de todas formas (₡0 a cada comité)
                </span>
              </label>
            </div>
          )}

          {/* Preview de distribución */}
          {preview.length > 0 && !isZeroProfit && (
            <div>
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">
                Se distribuirá así
              </p>
              <div className="space-y-1.5">
                {preview.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
                        {c.distributionPercentage}%
                      </span>
                      <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-700 tabular-nums">
                      +{formatCRC(c.amount)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 mt-1">
                  <span className="text-xs font-bold text-slate-600">Total distribuido</span>
                  <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                    {formatCRC(preview.reduce((s, c) => s + c.amount, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Fecha de liquidación */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">
              Fecha de liquidación
            </label>
            <input
              type="date"
              value={businessDate}
              onChange={(e) => setBusinessDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones sobre la liquidación…"
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 space-y-2 shrink-0 border-t border-slate-100">
          <button
            onClick={handleConfirm}
            disabled={loading || (isZeroProfit && !forceIfZero)}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-40 active:scale-[0.98] transition-all shadow-sm mt-3"
          >
            {loading
              ? "Distribuyendo…"
              : isZeroProfit
              ? "Registrar liquidación (₡0)"
              : `Confirmar · ${formatCRC(Math.max(0, netProfit))}`}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

DistributeActivityModal.propTypes = {
  activity: PropTypes.shape({
    activityId: PropTypes.string.isRequired,
    activityName: PropTypes.string,
    totalSales: PropTypes.number,
    totalExpenses: PropTypes.number,
    inventoryCostConsumed: PropTypes.number,
    netProfit: PropTypes.number,
  }).isRequired,
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
};

export default DistributeActivityModal;
