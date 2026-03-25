/* eslint-disable react/prop-types */

import React, { useState, useMemo } from "react";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Avatar from "../components/Avatar";
import { useAcademicDashboard } from "../hooks/useAcademicDashboard";
import ReviewModal from "./components/ReviewModal";
import SubjectPeriodManager from "./components/SubjectPeriodManager";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const RISK_CONFIG = {
  GREEN: {
    label: "Verde",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
  },
  YELLOW: {
    label: "Amarillo",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
  },
  RED: {
    label: "Rojo",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700",
  },
};

const TREND_LABEL = { UP: "↑ Mejorando", STABLE: "→ Estable", DOWN: "↓ Bajando" };

const STATUS_COLORS = {
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  approved: "text-emerald-700 bg-emerald-50 border-emerald-200",
  rejected: "text-red-700 bg-red-50 border-red-200",
};
const STATUS_LABELS = { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada" };

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Toast({ toast }) {
  if (!toast) return null;
  const colors = {
    success: "bg-emerald-50 border-emerald-300 text-emerald-800",
    error: "bg-red-50 border-red-300 text-red-800",
    info: "bg-blue-50 border-blue-300 text-blue-800",
  };
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${
        colors[toast.type] || colors.info
      }`}
    >
      {toast.message}
    </div>
  );
}

// ─── Evidence link ─────────────────────────────────────────────────────────────

function EvidenceLink({ ev }) {
  if (!ev?.evidenceUrl) return <span className="text-gray-300 text-xs">—</span>;
  const isPdf = ev.evidenceResourceType === "raw" || ev.evidenceOriginalName?.endsWith(".pdf");
  if (isPdf) {
    return (
      <a
        href={ev.evidenceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-xs text-blue-700 hover:bg-blue-100"
      >
        PDF
      </a>
    );
  }
  return (
    <a href={ev.evidenceUrl} target="_blank" rel="noopener noreferrer">
      <img
        src={ev.evidenceUrl}
        alt="Evidencia"
        className="w-9 h-9 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
      />
    </a>
  );
}

// ─── Pending evaluations tab ───────────────────────────────────────────────────

function PendingEvaluationsTab({ evaluations, loading, onReview, reviewing }) {
  const [reviewingEval, setReviewingEval] = useState(null);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border border-gray-200">
        <svg
          className="w-12 h-12 text-gray-300 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-sm font-medium text-gray-600">No hay evaluaciones pendientes</p>
        <p className="text-xs text-gray-400 mt-1">Todas las evaluaciones han sido revisadas</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Estudiante
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Materia
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Período
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Nota
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Evidencia
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Enviada
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {evaluations.map((ev) => (
              <tr key={ev.id} className="bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={`${ev.student?.name} ${ev.student?.firstSurName}`} size="sm" />
                    <div>
                      <p className="font-medium text-gray-900 whitespace-nowrap">
                        {ev.student?.name} {ev.student?.firstSurName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {ev.student?.grade && <span className="mr-1">{ev.student.grade}</span>}
                        {ev.student?.instrument && <span>{ev.student.instrument}</span>}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{ev.subject?.name}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-gray-700">{ev.period?.name}</p>
                  <p className="text-xs text-gray-400">{ev.period?.year}</p>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span
                    className={`text-base font-bold ${
                      ev.scoreNormalized100 >= 80
                        ? "text-emerald-600"
                        : ev.scoreNormalized100 >= 70
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {ev.scoreNormalized100?.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">/100</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <EvidenceLink ev={ev} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {fmtDate(ev.submittedByStudentAt)}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => setReviewingEval(ev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Revisar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

// ─── Students table tab ────────────────────────────────────────────────────────

function StudentsTab({ allUsers, riskRanking, pendingEvaluations, onOpenDrawer, loading, filter }) {
  const [search, setSearch] = useState("");

  // Students = users with a grade set (proxy for "student" role)
  const students = useMemo(() => allUsers.filter((u) => u.grade), [allUsers]);

  // Build perf map from riskRanking (keyed by studentId)
  const perfMap = useMemo(() => {
    const m = {};
    riskRanking.forEach((p) => {
      m[p.studentId] = p;
    });
    return m;
  }, [riskRanking]);

  // Build pending count map
  const pendingMap = useMemo(() => {
    const m = {};
    pendingEvaluations.forEach((ev) => {
      const sid = ev.student?.id;
      if (sid) m[sid] = (m[sid] || 0) + 1;
    });
    return m;
  }, [pendingEvaluations]);

  const filtered = useMemo(() => {
    let list = students;
    // Apply global grade filter
    if (filter?.grade) list = list.filter((u) => u.grade === filter.grade);
    // Apply global instrument filter
    if (filter?.instrument) {
      const q = filter.instrument.toLowerCase();
      list = list.filter((u) => (u.instrument || "").toLowerCase().includes(q));
    }
    // Apply local text search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) => {
        const name = `${u.name} ${u.firstSurName}`.toLowerCase();
        return (
          name.includes(q) ||
          (u.grade || "").toLowerCase().includes(q) ||
          (u.instrument || "").toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [students, search, filter]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-14 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, nivel o instrumento..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Summary counts */}
      <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
        <span>
          {filtered.length} estudiante{filtered.length !== 1 ? "s" : ""}
        </span>
        <span>·</span>
        <span className="text-emerald-600 font-medium">
          {riskRanking.filter((p) => p.riskLevel === "GREEN").length} en verde
        </span>
        <span className="text-amber-600 font-medium">
          {riskRanking.filter((p) => p.riskLevel === "YELLOW").length} en amarillo
        </span>
        <span className="text-red-600 font-medium">
          {riskRanking.filter((p) => p.riskLevel === "RED").length} en rojo
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">No se encontraron estudiantes</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Estudiante
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Nivel
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Instrumento
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Promedio
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Riesgo
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Aprobadas
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Pendientes
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => {
                const perf = perfMap[u.id];
                const pending = pendingMap[u.id] || 0;
                const risk = perf ? RISK_CONFIG[perf.riskLevel] || RISK_CONFIG.GREEN : null;
                const fullName = `${u.name} ${u.firstSurName}`;
                return (
                  <tr key={u.id} className="bg-white hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={u.avatar} name={fullName} size="sm" zoomable />
                        <div>
                          <p className="font-medium text-gray-900 whitespace-nowrap">{fullName}</p>
                          {u.secondSurName && (
                            <p className="text-xs text-gray-400">{u.secondSurName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {u.grade || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {u.instrument || "—"}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {perf ? (
                        <span
                          className={`font-bold ${
                            perf.averageGeneral >= 80
                              ? "text-emerald-600"
                              : perf.averageGeneral >= 70
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {perf.averageGeneral?.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">Sin datos</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {risk ? (
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${risk.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                          {risk.label}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap text-emerald-600 font-medium">
                      {perf ? perf.approvedCount : "—"}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {pending > 0 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">
                          {pending}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onOpenDrawer(u.id, fullName)}
                        className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard tab ─────────────────────────────────────────────────────────────

function DashboardTab({ dashboard, loading, pendingCount, onSwitchToPending, onOpenDrawer }) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-20 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      {pendingCount > 0 && (
        <button
          onClick={onSwitchToPending}
          className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-left hover:bg-amber-100 transition-colors"
        >
          <svg
            className="w-5 h-5 text-amber-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              {pendingCount} evaluación{pendingCount !== 1 ? "es" : ""} pendiente
              {pendingCount !== 1 ? "s" : ""} de revisión
            </p>
            <p className="text-xs text-amber-600">
              El dashboard muestra solo evaluaciones aprobadas. Aprueba las evaluaciones para verlas
              aquí.
            </p>
          </div>
          <svg
            className="w-4 h-4 text-amber-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Estudiantes con datos",
            value: dashboard.totalStudentsWithData,
            color: "text-gray-900",
          },
          {
            label: "Buen rendimiento",
            value: dashboard.studentsInGreen,
            color: "text-emerald-600",
          },
          {
            label: "Rendimiento regular",
            value: dashboard.studentsInYellow,
            color: "text-amber-600",
          },
          { label: "En riesgo", value: dashboard.studentsInRed, color: "text-red-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Performers grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <PerformerCard
          title="Peor rendimiento"
          items={dashboard.worstPerformers?.slice(0, 5)}
          onOpenDrawer={onOpenDrawer}
        />
        <PerformerCard
          title="Más mejoraron"
          items={dashboard.mostImproved?.slice(0, 5)}
          onOpenDrawer={onOpenDrawer}
          showTrend
        />
        <PerformerCard
          title="Más bajaron"
          items={dashboard.mostDeclined?.slice(0, 5)}
          onOpenDrawer={onOpenDrawer}
          showTrend
        />
      </div>

      {/* Subject performance */}
      {dashboard.subjectPerformanceSummary?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Rendimiento por materia
          </h3>
          <div className="space-y-3">
            {dashboard.subjectPerformanceSummary.map((s) => {
              const barColor =
                s.overallAverage >= 80
                  ? "bg-emerald-500"
                  : s.overallAverage >= 70
                  ? "bg-amber-500"
                  : "bg-red-500";
              const textColor =
                s.overallAverage >= 80
                  ? "text-emerald-600"
                  : s.overallAverage >= 70
                  ? "text-amber-600"
                  : "text-red-600";
              return (
                <div key={s.subjectId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-gray-700 truncate">{s.subjectName}</span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {s.studentsCount} alumnos
                      </span>
                      {s.atRiskCount > 0 && (
                        <span className="text-xs text-red-600 shrink-0">
                          {s.atRiskCount} en riesgo
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-bold ${textColor} shrink-0 ml-2`}>
                      {s.overallAverage?.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`${barColor} h-2 rounded-full`}
                      style={{ width: `${Math.min(s.overallAverage, 100)}%` }}
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
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Comparación por período
          </h3>
          <div className="space-y-2">
            {dashboard.periodComparisonSummary.map((p) => (
              <div key={p.periodId} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm text-gray-700">
                      {p.periodName} {p.year}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {p.overallAverage?.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-400 h-1.5 rounded-full"
                      style={{ width: `${Math.min(p.overallAverage, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{p.studentsCount} alumnos</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PerformerCard({ title, items = [], onOpenDrawer, showTrend = false }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>
      ) : (
        <div className="space-y-0.5">
          {items.map((p, i) => {
            const risk = RISK_CONFIG[p.riskLevel] || RISK_CONFIG.GREEN;
            return (
              <div
                key={p.studentId}
                onClick={() => onOpenDrawer(p.studentId, p.studentName)}
                className="flex items-center gap-2 py-2.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <span className="text-xs text-gray-400 w-4 text-right shrink-0">{i + 1}</span>
                <div className={`w-2 h-2 rounded-full shrink-0 ${risk.dot}`} />
                <p className="text-sm text-gray-800 flex-1 truncate group-hover:text-blue-600 transition-colors">
                  {p.studentName}
                </p>
                <span
                  className={`text-sm font-bold shrink-0 ${
                    p.averageGeneral >= 80
                      ? "text-emerald-600"
                      : p.averageGeneral >= 70
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {showTrend ? (
                    <span className={p.trendDelta > 0 ? "text-emerald-600" : "text-red-600"}>
                      {p.trendDelta > 0 ? "+" : ""}
                      {p.trendDelta?.toFixed(1)}
                    </span>
                  ) : (
                    p.averageGeneral?.toFixed(1)
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Risk ranking tab ──────────────────────────────────────────────────────────

function RankingTab({ riskRanking, loading, onOpenDrawer }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  if (riskRanking.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-sm text-gray-500">No hay datos de riesgo disponibles</p>
        <p className="text-xs text-gray-400 mt-1">Aprueba evaluaciones para ver el ranking</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-10">
              #
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Estudiante
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Promedio
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Riesgo
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Tendencia
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Materias riesgo
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {riskRanking.map((p, i) => {
            const risk = RISK_CONFIG[p.riskLevel] || RISK_CONFIG.GREEN;
            return (
              <tr key={p.studentId} className="bg-white hover:bg-gray-50 transition-colors group">
                <td className="px-3 py-3 text-center text-xs text-gray-400 font-medium">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={p.studentName} size="sm" />
                    <span className="font-medium text-gray-900">{p.studentName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span
                    className={`font-bold ${
                      p.averageGeneral >= 80
                        ? "text-emerald-600"
                        : p.averageGeneral >= 70
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {p.averageGeneral?.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${risk.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                    {risk.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-500">
                  {TREND_LABEL[p.trendDirection]}
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  {p.riskSubjects?.length > 0 ? (
                    <span className="font-medium text-red-600">{p.riskSubjects.length}</span>
                  ) : (
                    <span className="text-gray-300">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onOpenDrawer(p.studentId, p.studentName)}
                    className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Student detail drawer ─────────────────────────────────────────────────────

function StudentDetailDrawer({
  drawer,
  evaluations,
  performance,
  loadingEvals,
  loadingPerf,
  allUsers,
  onClose,
  onReview,
  reviewing,
}) {
  const [drawerTab, setDrawerTab] = useState("resumen");
  const [reviewingEval, setReviewingEval] = useState(null);

  if (!drawer.open) return null;

  // Find user data for avatar
  const userRecord = allUsers.find((u) => u.id === drawer.studentId);
  const fullName =
    drawer.studentName || (userRecord ? `${userRecord.name} ${userRecord.firstSurName}` : "");
  const avatarSrc = userRecord?.avatar;
  const risk = performance ? RISK_CONFIG[performance.riskLevel] || RISK_CONFIG.GREEN : null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-white border-l border-gray-200 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-4 px-6 py-5 border-b border-gray-200 bg-gray-50">
          <Avatar src={avatarSrc} name={fullName} size="lg" zoomable />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">{fullName}</h2>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {userRecord?.grade && (
                    <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                      {userRecord.grade}
                    </span>
                  )}
                  {userRecord?.instrument && (
                    <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                      {userRecord.instrument}
                    </span>
                  )}
                  {risk && (
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${risk.bg} ${risk.color}`}
                    >
                      {risk.label}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
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

            {/* Quick KPIs */}
            {performance && !loadingPerf && (
              <div className="flex flex-wrap gap-4 mt-3">
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {performance.averageGeneral?.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400">Promedio</p>
                </div>
                <div className="w-px bg-gray-200" />
                <div>
                  <p className="text-lg font-bold text-emerald-600">{performance.approvedCount}</p>
                  <p className="text-xs text-gray-400">Aprobadas</p>
                </div>
                <div className="w-px bg-gray-200" />
                <div>
                  <p className="text-lg font-bold text-amber-600">{performance.pendingCount}</p>
                  <p className="text-xs text-gray-400">Pendientes</p>
                </div>
                {performance.rejectedCount > 0 && (
                  <>
                    <div className="w-px bg-gray-200" />
                    <div>
                      <p className="text-lg font-bold text-red-600">{performance.rejectedCount}</p>
                      <p className="text-xs text-gray-400">Rechazadas</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Drawer tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { id: "resumen", label: "Resumen" },
            { id: "calificaciones", label: "Calificaciones" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setDrawerTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                drawerTab === t.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {t.id === "calificaciones" && evaluations.length > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {evaluations.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto">
          {/* Resumen tab */}
          {drawerTab === "resumen" && (
            <div className="p-6 space-y-5">
              {loadingPerf && (
                <div className="space-y-3">
                  <div className="bg-gray-100 rounded-xl h-14 animate-pulse" />
                  <div className="bg-gray-100 rounded-xl h-32 animate-pulse" />
                </div>
              )}
              {!loadingPerf && !performance && (
                <div className="flex flex-col items-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-500">Sin evaluaciones aprobadas aún</p>
                </div>
              )}
              {!loadingPerf && performance && (
                <>
                  {/* Subject averages */}
                  {performance.averagesBySubject?.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Rendimiento por materia
                      </p>
                      <div className="space-y-3">
                        {performance.averagesBySubject.map((s) => {
                          const isRisk = performance.riskSubjects?.some(
                            (r) => r.subjectId === s.subjectId
                          );
                          const pct = Math.min(s.average, 100);
                          const barColor =
                            s.average >= 80
                              ? "bg-emerald-500"
                              : s.average >= 70
                              ? "bg-amber-500"
                              : "bg-red-500";
                          const textColor =
                            s.average >= 80
                              ? "text-emerald-600"
                              : s.average >= 70
                              ? "text-amber-600"
                              : "text-red-600";
                          return (
                            <div key={s.subjectId}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isRisk && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                  )}
                                  <span className="text-sm text-gray-700 truncate">
                                    {s.subjectName}
                                  </span>
                                  <span className="text-xs text-gray-400 shrink-0">
                                    ({s.evaluationCount})
                                  </span>
                                </div>
                                <span className={`text-sm font-bold ${textColor} shrink-0 ml-2`}>
                                  {s.average.toFixed(1)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                  className={`${barColor} h-2 rounded-full`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Risk subjects */}
                  {performance.riskSubjects?.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
                        Materias en riesgo
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {performance.riskSubjects.map((rs) => (
                          <span
                            key={rs.subjectId}
                            className="text-xs px-2.5 py-1 bg-red-100 border border-red-200 text-red-700 rounded-full"
                          >
                            {rs.subjectName} · {rs.average.toFixed(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Calificaciones tab */}
          {drawerTab === "calificaciones" && (
            <div className="p-6">
              {loadingEvals ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-xl h-14 animate-pulse" />
                  ))}
                </div>
              ) : evaluations.length === 0 ? (
                <div className="flex flex-col items-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-500">Sin evaluaciones registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Materia
                        </th>
                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Período
                        </th>
                        <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Nota
                        </th>
                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Estado
                        </th>
                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Evidencia
                        </th>
                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Fecha
                        </th>
                        <th className="px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {evaluations.map((ev) => {
                        const st = STATUS_COLORS[ev.status] || STATUS_COLORS.pending;
                        return (
                          <tr key={ev.id} className="bg-white hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-3">
                              <p className="font-medium text-gray-900 text-xs whitespace-nowrap">
                                {ev.subject?.name}
                              </p>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <p className="text-xs text-gray-600">{ev.period?.name}</p>
                              <p className="text-xs text-gray-400">{ev.period?.year}</p>
                            </td>
                            <td className="px-3 py-3 text-right whitespace-nowrap">
                              <span
                                className={`text-sm font-bold ${
                                  ev.scoreNormalized100 >= 80
                                    ? "text-emerald-600"
                                    : ev.scoreNormalized100 >= 70
                                    ? "text-amber-600"
                                    : "text-red-600"
                                }`}
                              >
                                {ev.scoreNormalized100?.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-400">/100</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${st}`}
                              >
                                {STATUS_LABELS[ev.status] || ev.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <EvidenceLink ev={ev} />
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                              {fmtDate(ev.submittedByStudentAt)}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {ev.status === "pending" && (
                                <button
                                  onClick={() => setReviewingEval(ev)}
                                  className="text-xs text-blue-600 hover:text-blue-500 font-medium underline transition-colors"
                                >
                                  Revisar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
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

// ─── Main page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "pending", label: "Pendientes" },
  { id: "students", label: "Estudiantes" },
  { id: "dashboard", label: "Dashboard" },
  { id: "ranking", label: "Ranking de riesgo" },
  { id: "catalog", label: "Materias y períodos" },
];

const ALL_GRADES = [
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
];

export default function AdminAcademicPage() {
  const [activeTab, setActiveTab] = useState("pending");

  const {
    allUsers,
    subjects,
    periods,
    dashboard,
    riskRanking,
    pendingEvaluations,
    studentEvaluations,
    studentPerformance,
    loadingUsers,
    loadingDashboard,
    loadingRiskRanking,
    loadingPendingEvals,
    loadingStudentEvals,
    loadingStudentPerf,
    reviewing,
    creatingSubject,
    updatingSubject,
    creatingPeriod,
    updatingPeriod,
    filter,
    setFilter,
    studentDrawer,
    subjectModal,
    periodModal,
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

  // Unique sorted instrument list derived from all users
  const instrumentOptions = useMemo(() => {
    const set = new Set();
    allUsers.forEach((u) => {
      if (u.instrument) set.add(u.instrument);
    });
    return [...set].sort();
  }, [allUsers]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Gestión académica</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Administra evaluaciones, rendimiento y seguimiento académico de los estudiantes
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <select
                value={filter.periodId || ""}
                onChange={(e) => setFilter((f) => ({ ...f, periodId: e.target.value || null }))}
                className="flex-1 min-w-[130px] bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Todos los períodos</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.year}
                  </option>
                ))}
              </select>
              {/* <select
                value={filter.year || ""}
                onChange={(e) => setFilter((f) => ({ ...f, year: e.target.value ? parseInt(e.target.value) : null }))}
                className="flex-1 min-w-[100px] bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Todos los años</option>
                {[2023, 2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select> */}
              <select
                value={filter.grade || ""}
                onChange={(e) => setFilter((f) => ({ ...f, grade: e.target.value || null }))}
                className="flex-1 min-w-[130px] bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Todos los niveles</option>
                {ALL_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <select
                value={filter.instrument || ""}
                onChange={(e) => setFilter((f) => ({ ...f, instrument: e.target.value || null }))}
                className="flex-1 min-w-[130px] bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Todos los instrumentos</option>
                {instrumentOptions.map((ins) => (
                  <option key={ins} value={ins}>
                    {ins}
                  </option>
                ))}
              </select>
            </div>

            {/* Tabs */}
            <div className="flex gap-0.5 overflow-x-auto mb-6 border-b border-gray-200">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {tab.id === "pending" && pendingEvaluations.length > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold bg-red-500 text-white rounded-full">
                      {pendingEvaluations.length > 99 ? "99+" : pendingEvaluations.length}
                    </span>
                  )}
                  {tab.id === "students" && allUsers.filter((u) => u.grade).length > 0 && (
                    <span className="text-xs text-gray-400 font-normal">
                      ({allUsers.filter((u) => u.grade).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "pending" && (
              <PendingEvaluationsTab
                evaluations={pendingEvaluations}
                loading={loadingPendingEvals}
                onReview={handleReview}
                reviewing={reviewing}
              />
            )}

            {activeTab === "students" && (
              <StudentsTab
                allUsers={allUsers}
                riskRanking={riskRanking}
                pendingEvaluations={pendingEvaluations}
                onOpenDrawer={openStudentDrawer}
                loading={loadingUsers}
                filter={filter}
              />
            )}

            {activeTab === "dashboard" && (
              <DashboardTab
                dashboard={dashboard}
                loading={loadingDashboard}
                pendingCount={pendingEvaluations.length}
                onSwitchToPending={() => setActiveTab("pending")}
                onOpenDrawer={openStudentDrawer}
              />
            )}

            {activeTab === "ranking" && (
              <RankingTab
                riskRanking={riskRanking}
                loading={loadingRiskRanking}
                onOpenDrawer={openStudentDrawer}
              />
            )}

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
          </SoftBox>
        </Card>
      </SoftBox>

      {/* Student detail drawer */}
      <StudentDetailDrawer
        drawer={studentDrawer}
        evaluations={studentEvaluations}
        performance={studentPerformance}
        loadingEvals={loadingStudentEvals}
        loadingPerf={loadingStudentPerf}
        allUsers={allUsers}
        onClose={closeStudentDrawer}
        onReview={handleReview}
        reviewing={reviewing}
      />

      <Toast toast={toast} />
      <Footer />
    </DashboardLayout>
  );
}
