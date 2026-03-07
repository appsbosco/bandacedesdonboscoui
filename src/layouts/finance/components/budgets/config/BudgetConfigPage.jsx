/**
 * budgets/config/BudgetConfigPage.jsx — /finance/budgets/config
 * Ajuste de porcentajes de distribución. Tailwind only.
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import {
  GET_COMMITTEE_DISTRIBUTION_CONFIG,
  GET_ALL_COMMITTEE_BUDGETS,
} from "graphql/queries/finance";
import { UPDATE_COMMITTEE_DISTRIBUTION_CONFIG } from "graphql/mutations/finance";
import { Skeleton, Notice } from "../../FinanceAtoms";
import { FinancePageHeader } from "../../FinancePageHeader";
import { useNotice } from "hooks/useFinance";

const COMMITTEE_COLORS_TEXT = [
  "text-emerald-600",
  "text-blue-600",
  "text-amber-600",
  "text-rose-600",
  "text-violet-600",
  "text-teal-600",
];
const COMMITTEE_COLORS_BG = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-teal-500",
];

const BudgetConfigPage = () => {
  const navigate = useNavigate();
  const [localPcts, setLocalPcts] = useState({});
  const [notice, showNotice] = useNotice();

  const { data, loading } = useQuery(GET_COMMITTEE_DISTRIBUTION_CONFIG, {
    fetchPolicy: "cache-and-network",
  });

  const [update, { loading: saving }] = useMutation(UPDATE_COMMITTEE_DISTRIBUTION_CONFIG, {
    refetchQueries: [
      { query: GET_COMMITTEE_DISTRIBUTION_CONFIG },
      { query: GET_ALL_COMMITTEE_BUDGETS },
    ],
    onCompleted: () => showNotice("success", "Porcentajes actualizados ✓"),
    onError: (e) => showNotice("error", e.message),
  });

  const committees = data?.committeeDistributionConfig?.committees || [];

  useEffect(() => {
    if (committees.length > 0 && Object.keys(localPcts).length === 0) {
      const init = {};
      committees.forEach((c) => {
        init[c.id] = c.distributionPercentage;
      });
      setLocalPcts(init);
    }
  }, [committees]);

  const total = Object.values(localPcts).reduce((a, v) => a + (Number(v) || 0), 0);
  const isValid = Math.abs(total - 100) < 0.01;
  const hasChanges = committees.some((c) => localPcts[c.id] !== c.distributionPercentage);
  const over = total > 100;
  const under = total < 100 && total > 0;

  const handleChange = (id, val) => {
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    setLocalPcts((p) => ({ ...p, [id]: num }));
  };

  const handleReset = () => {
    const init = {};
    committees.forEach((c) => {
      init[c.id] = c.distributionPercentage;
    });
    setLocalPcts(init);
  };

  const handleSave = () => {
    if (!isValid)
      return showNotice(
        "error",
        `Los porcentajes suman ${total.toFixed(1)}%, deben sumar exactamente 100%.`
      );
    update({
      variables: {
        updates: committees.map((c) => ({
          committeeId: c.id,
          percentage: localPcts[c.id] ?? c.distributionPercentage,
        })),
      },
    });
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="page-content space-y-5">
        <FinancePageHeader
          title="Configurar distribución"
          description="Ajustá los porcentajes de cada comité. Deben sumar exactamente 100%."
          backTo="/finance/budgets"
          backLabel="Presupuestos"
        />

        {loading ? (
          <Skeleton lines={6} />
        ) : (
          <div className="space-y-4">
            <Notice notice={notice} />

            {/* Barra visual */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
                  Vista previa
                </p>
                <span
                  className={`text-sm font-extrabold tabular-nums ${
                    isValid ? "text-emerald-700" : over ? "text-red-600" : "text-amber-600"
                  }`}
                >
                  {total.toFixed(1)}% {isValid ? "✓" : over ? "▲ excede" : "▼ falta"}
                </span>
              </div>

              {/* Barra segmentada */}
              <div className="flex h-5 rounded-lg overflow-hidden gap-0.5">
                {committees.map((c, i) => {
                  const pct = localPcts[c.id] ?? c.distributionPercentage;
                  return (
                    <div
                      key={c.id}
                      className={`${
                        COMMITTEE_COLORS_BG[i % COMMITTEE_COLORS_BG.length]
                      } transition-all duration-300 flex items-center justify-center overflow-hidden`}
                      style={{ flex: Math.max(0.01, pct) }}
                      title={`${c.name}: ${pct}%`}
                    >
                      {pct >= 12 && (
                        <span className="text-white text-xs font-extrabold">{pct}%</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progreso total */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isValid ? "bg-emerald-500" : over ? "bg-red-500" : "bg-amber-400"
                  }`}
                  style={{ width: `${Math.min(100, total)}%` }}
                />
              </div>

              {/* Leyenda */}
              <div className="flex flex-wrap gap-3">
                {committees.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-sm ${
                        COMMITTEE_COLORS_BG[i % COMMITTEE_COLORS_BG.length]
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-600">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso si no suma 100 */}
            {!isValid && total > 0 && (
              <div
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border ${
                  over
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                }`}
              >
                {over
                  ? `▲ Reducí ${(total - 100).toFixed(1)}% en total.`
                  : `▼ Sumá ${(100 - total).toFixed(1)}% más.`}
              </div>
            )}

            {/* Aviso de impacto */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-sm shrink-0">⚠️</span>
              <p className="text-xs font-semibold text-amber-800">
                Los cambios afectan distribuciones <strong>futuras</strong>. Las ya realizadas
                conservan el porcentaje original.
              </p>
            </div>

            {/* Filas por comité */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
                  Porcentajes por comité
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {committees.map((c, i) => {
                  const val = localPcts[c.id] ?? c.distributionPercentage;
                  return (
                    <div key={c.id} className="px-5 py-4 flex items-center gap-4">
                      <div
                        className={`w-2 h-2 rounded-sm shrink-0 ${
                          COMMITTEE_COLORS_BG[i % COMMITTEE_COLORS_BG.length]
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-400">DB: {c.distributionPercentage}%</p>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={val}
                        onChange={(e) => handleChange(c.id, e.target.value)}
                        className="flex-1 max-w-[120px] accent-slate-900"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={val}
                          onChange={(e) => handleChange(c.id, e.target.value)}
                          className={`w-16 border border-slate-200 rounded-xl px-2 py-1.5 text-sm font-extrabold text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                            COMMITTEE_COLORS_TEXT[i % COMMITTEE_COLORS_TEXT.length]
                          }`}
                        />
                        <span className="text-sm font-bold text-slate-400">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 justify-end">
              {hasChanges && (
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Descartar
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!isValid || !hasChanges || saving}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-extrabold disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                {saving ? "Guardando…" : "Guardar porcentajes"}
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </DashboardLayout>
  );
};

export default BudgetConfigPage;
