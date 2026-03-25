/* eslint-disable react/prop-types */

import React, { useState } from "react";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useQuery } from "@apollo/client";
import { GET_USERS_BY_ID } from "graphql/queries";
import { Modal } from "components/ui/Modal";
import Avatar from "../components/Avatar";
import PerformanceSummary from "./components/PerformanceSummary";
import EvaluationsList from "./components/EvaluationsList";
import EvaluationFormModal from "./components/EvaluationFormModal";
import { useAcademicEvaluations } from "../hooks/useAcademicEvaluations";

const RISK_BADGE = {
  GREEN: { label: "Buen rendimiento", cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  YELLOW: { label: "Rendimiento regular", cls: "bg-amber-50 border-amber-200 text-amber-700" },
  RED: { label: "Atención requerida", cls: "bg-red-50 border-red-200 text-red-700" },
};

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
];

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "calificaciones", label: "Historial de calificaciones" },
];

function Toast({ toast }) {
  if (!toast) return null;
  const colors = {
    success: "bg-emerald-50 border-emerald-300 text-emerald-800",
    error: "bg-red-50 border-red-300 text-red-800",
    info: "bg-blue-50 border-blue-300 text-blue-800",
  };
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${colors[toast.type] || colors.info}`}>
      {toast.message}
    </div>
  );
}

export default function StudentAcademicPage() {
  const [activeTab, setActiveTab] = useState("resumen");
  const { data: userData, loading: loadingUser } = useQuery(GET_USERS_BY_ID);
  const user = userData?.getUser || null;
  const currentGrade = user?.grade || null;
  const fullName = user ? `${user.name} ${user.firstSurName}` : "";

  const {
    subjects,
    periods,
    evaluations,
    performance,
    loadingEvaluations,
    loadingPerformance,
    submitting,
    updating,
    deleting,
    filter,
    setFilter,
    formModal,
    deleteModal,
    openFormModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
    handleSubmit,
    handleUpdate,
    handleDelete,
    toast,
  } = useAcademicEvaluations({ grade: currentGrade });

  const riskBadge = performance ? (RISK_BADGE[performance.riskLevel] || RISK_BADGE.GREEN) : null;

  // Compute missing evaluations (subjects without any evaluation in active periods)
  const activePeriods = periods.filter((p) => p.isActive);
  const missingCombos = [];
  if (subjects.length > 0 && activePeriods.length > 0) {
    for (const subject of subjects) {
      for (const period of activePeriods) {
        const hasEval = evaluations.some(
          (e) => e.subject?.id === subject.id && e.period?.id === period.id
        );
        if (!hasEval) {
          missingCombos.push({ subject, period });
        }
      }
    }
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            {/* ── Student Header ── */}
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
              {loadingUser ? (
                <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse shrink-0" />
              ) : (
                <Avatar src={user?.avatar} name={fullName} size="xl" zoomable />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {loadingUser ? (
                      <div className="h-6 w-40 bg-gray-100 animate-pulse rounded mb-2" />
                    ) : (
                      <h1 className="text-xl font-bold text-gray-900">{fullName || "Mi perfil"}</h1>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {currentGrade && (
                        <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">{currentGrade}</span>
                      )}
                      {user?.instrument && (
                        <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">{user.instrument}</span>
                      )}
                    </div>
                  </div>
                  {riskBadge && (
                    <span className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border ${riskBadge.cls}`}>
                      {riskBadge.label}
                    </span>
                  )}
                </div>

                {/* Quick KPIs */}
                {performance && (
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{performance.averageGeneral?.toFixed(1)}</p>
                      <p className="text-xs text-gray-400">Promedio</p>
                    </div>
                    <div className="w-px bg-gray-200" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">{performance.approvedCount}</p>
                      <p className="text-xs text-gray-400">Aprobadas</p>
                    </div>
                    <div className="w-px bg-gray-200" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-600">{performance.pendingCount}</p>
                      <p className="text-xs text-gray-400">Pendientes</p>
                    </div>
                    {performance.rejectedCount > 0 && (
                      <>
                        <div className="w-px bg-gray-200" />
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-600">{performance.rejectedCount}</p>
                          <p className="text-xs text-gray-400">Rechazadas</p>
                        </div>
                      </>
                    )}
                    {missingCombos.length > 0 && (
                      <>
                        <div className="w-px bg-gray-200" />
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-500">{missingCombos.length}</p>
                          <p className="text-xs text-gray-400">Faltantes</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Alert: rejected evaluations ── */}
            {performance?.rejectedCount > 0 && (
              <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">
                  Tienes <span className="font-semibold">{performance.rejectedCount}</span> evaluación(es) rechazada(s). Puedes editarlas y volver a enviarlas.
                </p>
              </div>
            )}

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {tab.id === "calificaciones" && evaluations.length > 0 && (
                    <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {evaluations.length}
                    </span>
                  )}
                </button>
              ))}

              {/* spacer + new evaluation button */}
              <div className="flex-1" />
              <button
                onClick={() => openFormModal("create")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors mb-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Nueva evaluación</span>
              </button>
            </div>

            {/* ── Tab: Resumen ── */}
            {activeTab === "resumen" && (
              <div className="space-y-6">
                <PerformanceSummary performance={performance} loading={loadingPerformance} />

                {/* Missing evaluations panel */}
                {missingCombos.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Evaluaciones faltantes ({missingCombos.length})
                      </h3>
                      <button
                        onClick={() => openFormModal("create")}
                        className="text-xs text-blue-600 hover:text-blue-500 font-medium"
                      >
                        Registrar evaluación
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {missingCombos.map((combo) => (
                        <div
                          key={`${combo.subject.id}-${combo.period.id}`}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 px-3 bg-gray-50 rounded-lg"
                        >
                          <div className="min-w-0">
                            <span className="text-sm text-gray-700 font-medium">{combo.subject.name}</span>
                            <span className="text-xs text-gray-400 ml-2">{combo.period.name} {combo.period.year}</span>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2">
                            <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                              Sin registrar
                            </span>
                            <button
                              onClick={() =>
                                openFormModal("create", null, {
                                  subjectId: combo.subject.id,
                                  periodId: combo.period.id,
                                })
                              }
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                              Registrar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!loadingPerformance && !performance && (
                  <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                    <svg className="w-14 h-14 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-600">Sin datos de rendimiento aún</p>
                    <p className="text-xs text-gray-400 mt-1">Registra evaluaciones y espera a que sean aprobadas</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Calificaciones ── */}
            {activeTab === "calificaciones" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <select
                    value={filter.periodId || ""}
                    onChange={(e) => setFilter((f) => ({ ...f, periodId: e.target.value || null }))}
                    className="flex-1 min-w-[140px] bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los períodos</option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {p.year}</option>
                    ))}
                  </select>
                  <select
                    value={filter.subjectId || ""}
                    onChange={(e) => setFilter((f) => ({ ...f, subjectId: e.target.value || null }))}
                    className="flex-1 min-w-[140px] bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las materias</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <select
                    value={filter.status || ""}
                    onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value || null }))}
                    className="flex-1 min-w-[120px] bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <EvaluationsList
                  evaluations={evaluations}
                  loading={loadingEvaluations}
                  onEdit={(ev) => openFormModal("edit", ev)}
                  onDelete={openDeleteModal}
                />
              </div>
            )}
          </SoftBox>
        </Card>
      </SoftBox>

      {/* Form Modal */}
      <EvaluationFormModal
        isOpen={formModal.open}
        onClose={closeFormModal}
        mode={formModal.mode}
        evaluation={formModal.evaluation}
        initialSelection={formModal.initialSelection}
        subjects={subjects}
        periods={periods}
        onSubmit={handleSubmit}
        onUpdate={handleUpdate}
        loading={submitting || updating}
      />

      {/* Delete Modal */}
      <Modal isOpen={deleteModal.open} onClose={closeDeleteModal} title="Eliminar evaluación" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Seguro que deseas eliminar la evaluación de{" "}
            <span className="font-semibold text-gray-900">{deleteModal.evaluation?.subject?.name}</span>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={closeDeleteModal}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => deleteModal.evaluation && handleDelete(deleteModal.evaluation.id)}
              disabled={deleting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} />
      <Footer />
    </DashboardLayout>
  );
}
