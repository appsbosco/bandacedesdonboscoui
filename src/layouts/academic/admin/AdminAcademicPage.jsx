/* eslint-disable react/prop-types */

import React, { useState } from "react";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAcademicDashboard } from "../hooks/useAcademicDashboard";
import ReviewModal from "./components/ReviewModal";
import SubjectPeriodManager from "./components/SubjectPeriodManager";

// ─── Risk level helpers ───────────────────────────────────────────────────────

const RISK_CONFIG = {
  GREEN: {
    label: "Verde",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  YELLOW: {
    label: "Amarillo",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  RED: {
    label: "Rojo",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
};

const TREND_LABEL = { UP: "↑ Mejorando", STABLE: "→ Estable", DOWN: "↓ Bajando" };

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, color = "text-gray-900", sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function StudentRankRow({ perf, rank, onOpenDrawer }) {
  const risk = RISK_CONFIG[perf.riskLevel] || RISK_CONFIG.GREEN;
  return (
    <div
      className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors"
      onClick={() => onOpenDrawer(perf.studentId, perf.studentName)}
    >
      <span className="text-xs text-gray-400 w-5 text-right shrink-0">{rank}</span>
      <div className={`w-2 h-2 rounded-full shrink-0 ${risk.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{perf.studentName}</p>
        <p className="text-xs text-gray-500">
          {TREND_LABEL[perf.trendDirection]} · {perf.riskSubjects?.length || 0} materias en riesgo
        </p>
      </div>
      <div className="text-right shrink-0">
        <p
          className={`text-base font-bold ${
            perf.averageGeneral >= 80
              ? "text-emerald-600"
              : perf.averageGeneral >= 70
              ? "text-amber-600"
              : "text-red-600"
          }`}
        >
          {perf.averageGeneral?.toFixed(1)}
        </p>
        <p className="text-xs text-gray-400">/100</p>
      </div>
    </div>
  );
}

function StudentDrawer({ drawer, evaluations, loading, onClose, onReview, reviewing }) {
  const [reviewingEval, setReviewingEval] = useState(null);

  if (!drawer.open) return null;

  const STATUS_COLORS = {
    pending: "text-amber-700 bg-amber-50 border-amber-200",
    approved: "text-emerald-700 bg-emerald-50 border-emerald-200",
    rejected: "text-red-700 bg-red-50 border-red-200",
  };
  const STATUS_LABELS = { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada" };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-gray-200 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 truncate pr-2">
            {drawer.studentName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse h-16" />
              ))}
            </div>
          )}
          {!loading && evaluations.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">Sin evaluaciones registradas</p>
          )}
          {!loading &&
            evaluations.map((ev) => (
              <div
                key={ev.id}
                className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ev.subject?.name}</p>
                    <p className="text-xs text-gray-500">
                      {ev.period?.name} · {ev.period?.year}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-lg font-bold ${
                        ev.scoreNormalized100 >= 80
                          ? "text-emerald-600"
                          : ev.scoreNormalized100 >= 70
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {ev.scoreNormalized100?.toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      STATUS_COLORS[ev.status] || STATUS_COLORS.pending
                    }`}
                  >
                    {STATUS_LABELS[ev.status] || ev.status}
                  </span>
                  {ev.status === "pending" && (
                    <button
                      onClick={() => setReviewingEval(ev)}
                      className="text-xs text-blue-600 hover:text-blue-500 underline transition-colors"
                    >
                      Revisar
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      <ReviewModal
        isOpen={!!reviewingEval}
        onClose={() => setReviewingEval(null)}
        evaluation={reviewingEval}
        onReview={async (id, status, comment) => {
          await onReview(id, status, comment);
          setReviewingEval(null);
        }}
        loading={reviewing}
      />
    </>
  );
}

// ─── Pending Evaluations Tab ──────────────────────────────────────────────────

function PendingEvaluationsTab({ evaluations, loading, onReview, reviewing }) {
  const [reviewingEval, setReviewingEval] = useState(null);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border border-gray-200">
        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium text-gray-600">No hay evaluaciones pendientes</p>
        <p className="text-xs text-gray-400 mt-1">Todas las evaluaciones han sido revisadas</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">{evaluations.length} evaluación(es) esperando revisión</p>
      </div>
      <div className="space-y-2">
        {evaluations.map((ev) => {
          const isPdf =
            ev.evidenceResourceType === "raw" || ev.evidenceOriginalName?.endsWith(".pdf");
          return (
            <div
              key={ev.id}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start gap-4"
            >
              {/* Evidence preview */}
              <div className="shrink-0">
                {isPdf ? (
                  <a
                    href={ev.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center w-14 h-14 bg-gray-50 border border-gray-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs mt-0.5">PDF</span>
                  </a>
                ) : (
                  <a href={ev.evidenceUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={ev.evidenceUrl}
                      alt="Evidencia"
                      className="w-14 h-14 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                    />
                  </a>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {ev.student?.name} {ev.student?.firstSurName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ev.student?.grade && <span className="mr-2">{ev.student.grade}</span>}
                      {ev.subject?.name} · {ev.period?.name} {ev.period?.year}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-xl font-bold ${
                        ev.scoreNormalized100 >= 80
                          ? "text-emerald-600"
                          : ev.scoreNormalized100 >= 70
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {ev.scoreNormalized100?.toFixed(1)}
                      <span className="text-xs text-gray-400 font-normal">/100</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {ev.scoreRaw}/{ev.scaleMax}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setReviewingEval(ev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Revisar
                  </button>
                  {ev.submittedByStudentAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(ev.submittedByStudentAt).toLocaleDateString("es-CR")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ReviewModal
        isOpen={!!reviewingEval}
        onClose={() => setReviewingEval(null)}
        evaluation={reviewingEval}
        onReview={async (id, status, comment) => {
          await onReview(id, status, comment);
          setReviewingEval(null);
        }}
        loading={reviewing}
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "pending", label: "Pendientes" },
  { id: "dashboard", label: "Dashboard" },
  { id: "ranking", label: "Ranking de riesgo" },
  { id: "catalog", label: "Materias y períodos" },
];

function Toast({ toast }) {
  if (!toast) return null;
  const colors = {
    success: "bg-emerald-50 border-emerald-300 text-emerald-800",
    error: "bg-red-50 border-red-300 text-red-800",
    info: "bg-blue-50 border-blue-300 text-blue-800",
  };
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium animate-slide-up ${
        colors[toast.type] || colors.info
      }`}
    >
      {toast.message}
    </div>
  );
}

export default function AdminAcademicPage() {
  const [activeTab, setActiveTab] = useState("pending");

  const {
    subjects,
    periods,
    dashboard,
    riskRanking,
    pendingEvaluations,
    studentEvaluations,
    loadingDashboard,
    loadingRiskRanking,
    loadingPendingEvals,
    loadingStudentEvals,
    reviewing,
    creatingSubject,
    updatingSubject,
    creatingPeriod,
    updatingPeriod,
    filter,
    setFilter,
    reviewModal,
    studentDrawer,
    subjectModal,
    periodModal,
    closeReviewModal,
    openStudentDrawer,
    closeStudentDrawer,
    openSubjectModal,
    closeSubjectModal,
    openPeriodModal,
    closePeriodModal,
    handleCreateSubject,
    handleUpdateSubject,
    handleCreatePeriod,
    handleUpdatePeriod,
    handleReview,
    toast,
  } = useAcademicDashboard();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-lg font-bold text-gray-900">Dashboard académico</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Rendimiento y evaluaciones de estudiantes
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <select
                value={filter.periodId || ""}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, periodId: e.target.value || null }))
                }
                className="flex-1 min-w-[130px] bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Todos los períodos</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.year}
                  </option>
                ))}
              </select>
              <select
                value={filter.year || ""}
                onChange={(e) =>
                  setFilter((f) => ({
                    ...f,
                    year: e.target.value ? parseInt(e.target.value) : null,
                  }))
                }
                className="flex-1 min-w-[100px] bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Todos los años</option>
                {[2023, 2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={filter.grade || ""}
                onChange={(e) => setFilter((f) => ({ ...f, grade: e.target.value || null }))}
                className="flex-1 min-w-[120px] bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Todos los niveles</option>
                {[
                  "Tercero Primaria",
                  "Cuarto Primaria",
                  "Quinto Primaria",
                  "Sexto Primaria",
                  "Septimo",
                  "Octavo",
                  "Noveno",
                  "Décimo",
                  "Undécimo",
                  "Duodécimo",
                ].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto mb-6 border-b border-gray-200 pb-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {tab.id === "pending" && pendingEvaluations.length > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold bg-red-500 text-white rounded-full">
                      {pendingEvaluations.length > 9 ? "9+" : pendingEvaluations.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {/* ── PENDING TAB ── */}
              {activeTab === "pending" && (
                <PendingEvaluationsTab
                  evaluations={pendingEvaluations}
                  loading={loadingPendingEvals}
                  onReview={handleReview}
                  reviewing={reviewing}
                />
              )}

              {/* ── DASHBOARD TAB ── */}
              {activeTab === "dashboard" && (
                <>
                  {loadingDashboard && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse h-20" />
                      ))}
                    </div>
                  )}

                  {dashboard && (
                    <>
                      {/* KPIs */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <KpiCard
                          label="Estudiantes con datos"
                          value={dashboard.totalStudentsWithData}
                        />
                        <KpiCard
                          label="En verde"
                          value={dashboard.studentsInGreen}
                          color="text-emerald-600"
                          sub="Buen rendimiento"
                        />
                        <KpiCard
                          label="En amarillo"
                          value={dashboard.studentsInYellow}
                          color="text-amber-600"
                          sub="Rendimiento regular"
                        />
                        <KpiCard
                          label="En rojo"
                          value={dashboard.studentsInRed}
                          color="text-red-600"
                          sub="En riesgo"
                        />
                      </div>

                      {/* Peores / Mejorados / Empeorados */}
                      <div className="grid gap-4 md:grid-cols-3">
                        {/* Peor rendimiento */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Peor rendimiento
                          </h3>
                          {dashboard.worstPerformers?.slice(0, 5).map((p, i) => (
                            <StudentRankRow
                              key={p.studentId}
                              perf={p}
                              rank={i + 1}
                              onOpenDrawer={openStudentDrawer}
                            />
                          ))}
                          {dashboard.worstPerformers?.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-3">Sin datos</p>
                          )}
                        </div>

                        {/* Más mejoraron */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Más mejoraron
                          </h3>
                          {dashboard.mostImproved?.slice(0, 5).map((p, i) => (
                            <div
                              key={p.studentId}
                              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs text-gray-400 w-5 text-right shrink-0">
                                  {i + 1}
                                </span>
                                <p className="text-sm text-gray-900 truncate">{p.studentName}</p>
                              </div>
                              <span className="text-sm font-semibold text-emerald-600 shrink-0">
                                +{p.trendDelta?.toFixed(1)}
                              </span>
                            </div>
                          ))}
                          {dashboard.mostImproved?.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-3">
                              Sin datos de tendencia
                            </p>
                          )}
                        </div>

                        {/* Más empeoraron */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Más empeoraron
                          </h3>
                          {dashboard.mostDeclined?.slice(0, 5).map((p, i) => (
                            <div
                              key={p.studentId}
                              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs text-gray-400 w-5 text-right shrink-0">
                                  {i + 1}
                                </span>
                                <p className="text-sm text-gray-900 truncate">{p.studentName}</p>
                              </div>
                              <span className="text-sm font-semibold text-red-600 shrink-0">
                                {p.trendDelta?.toFixed(1)}
                              </span>
                            </div>
                          ))}
                          {dashboard.mostDeclined?.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-3">
                              Sin datos de tendencia
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Subject summary */}
                      {dashboard.subjectPerformanceSummary?.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Rendimiento por materia
                          </h3>
                          <div className="space-y-2">
                            {dashboard.subjectPerformanceSummary.map((s) => {
                              const pct = Math.min(s.overallAverage, 100);
                              const barColor =
                                s.overallAverage >= 80
                                  ? "bg-emerald-500"
                                  : s.overallAverage >= 70
                                  ? "bg-amber-500"
                                  : "bg-red-500";
                              return (
                                <div key={s.subjectId}>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-700">{s.subjectName}</span>
                                      {s.atRiskCount > 0 && (
                                        <span className="text-xs text-red-600">
                                          {s.atRiskCount} en riesgo
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs font-medium text-gray-900">
                                      {s.overallAverage?.toFixed(1)}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className={`${barColor} h-1.5 rounded-full transition-all`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Period comparison */}
                      {dashboard.periodComparisonSummary?.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Comparación por período
                          </h3>
                          <div className="flex gap-3 overflow-x-auto pb-1">
                            {dashboard.periodComparisonSummary.map((p) => (
                              <div
                                key={p.periodId}
                                className="flex-1 min-w-[80px] bg-gray-50 rounded-xl p-3 text-center border border-gray-200"
                              >
                                <p className="text-xs text-gray-500 mb-1">{p.periodName}</p>
                                <p
                                  className={`text-xl font-bold ${
                                    p.overallAverage >= 80
                                      ? "text-emerald-600"
                                      : p.overallAverage >= 70
                                      ? "text-amber-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {p.overallAverage?.toFixed(1)}
                                </p>
                                <p className="text-xs text-gray-400">{p.studentsCount} est.</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── RANKING TAB ── */}
              {activeTab === "ranking" && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Ranking de riesgo ({riskRanking.length} estudiantes)
                    </h3>
                  </div>
                  {loadingRiskRanking ? (
                    <div className="space-y-2 p-4">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-gray-100 rounded-xl p-4 animate-pulse h-14"
                        />
                      ))}
                    </div>
                  ) : riskRanking.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-12">
                      Sin datos para los filtros seleccionados
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {riskRanking.map((perf, i) => {
                        const risk = RISK_CONFIG[perf.riskLevel] || RISK_CONFIG.GREEN;
                        return (
                          <div
                            key={perf.studentId}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => openStudentDrawer(perf.studentId, perf.studentName)}
                          >
                            <span className="text-xs text-gray-400 w-6 text-right shrink-0">
                              {i + 1}
                            </span>
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${risk.dot}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {perf.studentName}
                              </p>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                <span className="text-xs text-gray-500">
                                  {perf.riskSubjects?.length || 0} mat. en riesgo
                                </span>
                                <span
                                  className={`text-xs ${
                                    perf.trendDelta < 0 ? "text-red-600" : "text-emerald-600"
                                  }`}
                                >
                                  {perf.trendDelta > 0 ? "↑" : perf.trendDelta < 0 ? "↓" : "→"}{" "}
                                  {Math.abs(perf.trendDelta)?.toFixed(1)} pts
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p
                                className={`text-lg font-bold ${
                                  perf.averageGeneral >= 80
                                    ? "text-emerald-600"
                                    : perf.averageGeneral >= 70
                                    ? "text-amber-600"
                                    : "text-red-600"
                                }`}
                              >
                                {perf.averageGeneral?.toFixed(1)}
                              </p>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border ${risk.bg} ${risk.color}`}
                              >
                                {risk.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── CATALOG TAB ── */}
              {activeTab === "catalog" && (
                <SubjectPeriodManager
                  subjects={subjects}
                  periods={periods}
                  subjectModal={subjectModal}
                  periodModal={periodModal}
                  openSubjectModal={openSubjectModal}
                  closeSubjectModal={closeSubjectModal}
                  openPeriodModal={openPeriodModal}
                  closePeriodModal={closePeriodModal}
                  onCreateSubject={handleCreateSubject}
                  onUpdateSubject={handleUpdateSubject}
                  onCreatePeriod={handleCreatePeriod}
                  onUpdatePeriod={handleUpdatePeriod}
                  creatingSubject={creatingSubject}
                  updatingSubject={updatingSubject}
                  creatingPeriod={creatingPeriod}
                  updatingPeriod={updatingPeriod}
                />
              )}
            </div>
          </SoftBox>
        </Card>
      </SoftBox>

      {/* Student drawer */}
      <StudentDrawer
        drawer={studentDrawer}
        evaluations={studentEvaluations}
        loading={loadingStudentEvals}
        onClose={closeStudentDrawer}
        onReview={handleReview}
        reviewing={reviewing}
      />

      {/* Global review modal */}
      <ReviewModal
        isOpen={reviewModal.open}
        onClose={closeReviewModal}
        evaluation={reviewModal.evaluation}
        onReview={handleReview}
        loading={reviewing}
      />

      <Toast toast={toast} />
      <Footer />
    </DashboardLayout>
  );
}
