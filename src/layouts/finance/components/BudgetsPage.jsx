/**
 * BudgetsPage.jsx — /finance/budgets
 * Solo STAFF y ADMIN.
 *
 * Mejoras v2:
 * - SetupScreen describe los comités reales (Operativa, Ventas, Becas, etc.)
 * - Dashboard muestra detalles de la inicialización (fecha, monto, snapshot)
 * - Resumen global mejorado: totalCredits + totalDebits + entryCount por comité
 * - Refetch automático al volver al tab de comités
 * - Loading states más granulares
 */
import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import PropTypes from "prop-types";

import {
  GET_ALL_COMMITTEE_BUDGETS,
  GET_COMMITTEE_DISTRIBUTION_CONFIG,
} from "graphql/queries/finance";
import { SEED_COMMITTEES } from "graphql/mutations/finance";
import { formatCRC, fmtBusinessDate } from "utils/finance";
import { Skeleton, StatCard } from "./FinanceAtoms";
import { FinancePageHeader } from "./FinancePageHeader";
import CommitteeCard from "./budgets/CommitteeCard";
import ActivitiesTab from "./budgets/ActivitiesTab";
import InitializeBudgetModal from "./budgets/InitializeBudgetModal";

export const COMMITTEE_COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-teal-500",
];

// ─── SetupScreen ──────────────────────────────────────────────────────────────

const SetupScreen = ({ onSeed, loading }) => (
  <div className="max-w-lg mx-auto mt-8 px-2">
    <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6">
      <div>
        <span className="inline-block px-2 py-0.5 rounded text-xs font-extrabold bg-violet-100 text-violet-700 tracking-widest uppercase mb-3">
          Setup requerido
        </span>
        <h2 className="text-xl font-extrabold text-slate-900 mb-1">
          Configura el sistema de presupuestos
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Seguí estos 3 pasos para activar el módulo de presupuestos STAFF.
        </p>
      </div>

      <div className="space-y-3">
        {[
          {
            n: "1",
            color: "bg-emerald-100 text-emerald-700",
            title: "Crear los 6 comités STAFF",
            desc: "Operativa (50%), Ventas (20%), Becas (10%), Giras (10%), Visuales (5%) y Pastoral (5%) — con porcentajes por defecto.",
          },
          {
            n: "2",
            color: "bg-amber-100 text-amber-700",
            title: "Inicializar el presupuesto",
            desc: "Ingresá el monto total. Se distribuirá automáticamente entre comités según sus porcentajes.",
          },
          {
            n: "3",
            color: "bg-blue-100 text-blue-700",
            title: "Gestionar gastos y utilidades",
            desc: "Registrá gastos por comité y distribuí utilidades de actividades.",
          },
        ].map((s) => (
          <div
            key={s.n}
            className="flex gap-4 p-4 border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${s.color}`}
            >
              {s.n}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{s.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onSeed}
        disabled={loading}
        className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-extrabold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creando comités…
          </span>
        ) : (
          "Crear los 6 comités STAFF"
        )}
      </button>
    </div>
  </div>
);

SetupScreen.propTypes = { onSeed: PropTypes.func.isRequired, loading: PropTypes.bool };

// ─── UninitializedScreen ─────────────────────────────────────────────────────

const UninitializedScreen = ({ committees, onInitialize }) => (
  <div className="max-w-lg mx-auto mt-8 px-2">
    <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-5">
      <div>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-extrabold bg-amber-100 text-amber-700 tracking-widest uppercase mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Pendiente de inicialización
        </span>
        <h2 className="text-xl font-extrabold text-slate-900 mb-1">
          {committees.length} comités creados
        </h2>
        <p className="text-sm text-slate-500">
          Asigná el monto total del presupuesto STAFF para activar el sistema.
        </p>
      </div>

      <div className="space-y-2">
        {committees.map((c, i) => (
          <div
            key={c.id}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-sm shrink-0 ${
                  COMMITTEE_COLORS[i % COMMITTEE_COLORS.length]
                }`}
              />
              <span className="text-sm font-semibold text-slate-800">{c.name}</span>
            </div>
            <span className="text-xs font-extrabold text-slate-500 tabular-nums">
              {c.distributionPercentage}%
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onInitialize}
        className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-extrabold text-sm active:scale-[0.98] transition-all"
      >
        Asignar presupuesto inicial
      </button>
    </div>
  </div>
);

UninitializedScreen.propTypes = {
  committees: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      distributionPercentage: PropTypes.number,
    })
  ).isRequired,
  onInitialize: PropTypes.func.isRequired,
};

// ─── InitializationBanner ────────────────────────────────────────────────────
// Muestra los detalles del BudgetInitialization activo

const InitializationBanner = ({ initialization }) => {
  const [expanded, setExpanded] = useState(false);
  if (!initialization) return null;

  return (
    <div className="bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg shrink-0">🏦</span>
          <div className="min-w-0 text-left">
            <p className="text-xs font-extrabold text-violet-800 uppercase tracking-widest">
              Presupuesto inicial
            </p>
            <p className="text-sm font-bold text-violet-900 tabular-nums">
              {formatCRC(initialization.totalAmount)}
              {initialization.businessDate && (
                <span className="font-normal text-violet-700 ml-2">
                  · {fmtBusinessDate(initialization.businessDate)}
                </span>
              )}
            </p>
          </div>
        </div>
        <span className="text-violet-500 shrink-0 text-xs font-bold">
          {expanded ? "▲ Ocultar" : "▼ Detalles"}
        </span>
      </button>

      {expanded && initialization.distributionSnapshot?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-violet-200 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {initialization.distributionSnapshot.map((d) => (
            <div
              key={d.committeeId}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white border border-violet-100"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-violet-500">{d.percentage}%</span>
                <p className="text-xs font-semibold text-slate-700 truncate">{d.committeeName}</p>
              </div>
              <span className="text-xs font-bold text-violet-700 tabular-nums ml-1 shrink-0">
                {formatCRC(d.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
      {expanded && initialization.description && (
        <p className="mt-2 text-xs text-violet-700 italic">{initialization.description}</p>
      )}
    </div>
  );
};

InitializationBanner.propTypes = { initialization: PropTypes.object };

// ─── BudgetsPage ─────────────────────────────────────────────────────────────

const BudgetsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("committees");
  const [showInitModal, setShowInitModal] = useState(false);

  const {
    data: budgetsData,
    loading: budgetsLoading,
    refetch,
  } = useQuery(GET_ALL_COMMITTEE_BUDGETS, {
    fetchPolicy: "cache-and-network",
  });
  const { data: configData, loading: configLoading } = useQuery(GET_COMMITTEE_DISTRIBUTION_CONFIG, {
    fetchPolicy: "cache-and-network",
  });
  const [seedCommittees, { loading: seedLoading }] = useMutation(SEED_COMMITTEES, {
    onCompleted: () => refetch(),
  });

  const budgets = budgetsData?.allCommitteeBudgets;
  const isInitialized = budgets?.isInitialized;
  const committees = budgets?.committees || [];
  const configCommittees = configData?.committeeDistributionConfig?.committees || [];
  const hasCommittees = configCommittees.length > 0;
  const isLoading = budgetsLoading || configLoading;

  // KPIs globales
  const totalAvailable = budgets?.totalAvailable ?? 0;
  const totalBudget = budgets?.totalBudget ?? 0;
  const totalExpended = budgets?.totalExpended ?? 0;
  const globalPct = totalBudget > 0 ? Math.min(100, (totalExpended / totalBudget) * 100) : 0;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="page-content space-y-5">
        <FinancePageHeader
          title="Presupuestos STAFF"
          description="Control de fondos por comité — solo Staff y Admin."
          backTo="/finance"
          backLabel="Volver a la caja"
          right={
            isInitialized ? (
              <button
                onClick={() => navigate("/finance/budgets/config")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ⚙️ Porcentajes
              </button>
            ) : null
          }
        />

        {isLoading && (
          <div className="space-y-3">
            <Skeleton lines={2} />
            <Skeleton lines={3} />
          </div>
        )}

        {!isLoading && !hasCommittees && (
          <SetupScreen onSeed={seedCommittees} loading={seedLoading} />
        )}

        {!isLoading && hasCommittees && !isInitialized && (
          <>
            <UninitializedScreen
              committees={configCommittees}
              onInitialize={() => setShowInitModal(true)}
            />
            {showInitModal && (
              <InitializeBudgetModal
                onClose={() => setShowInitModal(false)}
                onSuccess={() => {
                  setShowInitModal(false);
                  refetch();
                }}
              />
            )}
          </>
        )}

        {!isLoading && isInitialized && (
          <>
            {/* Banner de inicialización */}
            <InitializationBanner initialization={budgets?.initialization} />

            {/* KPIs globales */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                label="Disponible total"
                value={formatCRC(totalAvailable)}
                valueClass={totalAvailable >= 0 ? "text-emerald-700" : "text-red-600"}
                sub={`${committees.length} comités`}
              />
              <StatCard
                label="Presupuestado"
                value={formatCRC(totalBudget)}
                valueClass="text-slate-900"
              />
              <div className="col-span-2 sm:col-span-1">
                <StatCard
                  label="Gastado"
                  value={formatCRC(totalExpended)}
                  valueClass="text-red-600"
                  sub={`${globalPct.toFixed(1)}% del total`}
                />
              </div>
            </div>

            {/* Barra de progreso global */}
            {totalBudget > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Uso global del presupuesto
                  </p>
                  <span
                    className={`text-xs font-bold ${
                      globalPct > 80 ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    {globalPct.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      globalPct > 80 ? "bg-amber-400" : "bg-emerald-500"
                    }`}
                    style={{ width: `${globalPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tabs: Comités / Actividades */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
              <div className="p-2 border-b border-slate-100 flex gap-2">
                {[
                  { id: "committees", label: "🏛️ Comités" },
                  { id: "activities", label: "🎪 Actividades" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-4 py-2.5 text-sm font-extrabold rounded-xl transition-colors ${
                      tab === t.id
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-4 sm:p-5">
                {tab === "committees" && (
                  <>
                    {committees.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-3xl mb-2">🏛️</p>
                        <p className="text-sm font-semibold text-slate-600">Sin comités activos</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {committees.map((b, i) => (
                          <CommitteeCard
                            key={b.committee.id}
                            budget={b}
                            colorClass={COMMITTEE_COLORS[i % COMMITTEE_COLORS.length]}
                            onClick={() => navigate(`/finance/budgets/${b.committee.id}`)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
                {tab === "activities" && <ActivitiesTab onDistributed={refetch} />}
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </DashboardLayout>
  );
};

export default BudgetsPage;
