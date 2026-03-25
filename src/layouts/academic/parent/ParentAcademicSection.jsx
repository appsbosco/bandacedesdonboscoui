/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { Modal } from "components/ui/Modal";
import Avatar from "../components/Avatar";
import { useChildAcademicPerformance } from "../hooks/useChildAcademicPerformance";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const RISK_CONFIG = {
  GREEN: {
    label: "Buen rendimiento",
    sublabel: "Sin materias en riesgo",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    icon: (
      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  YELLOW: {
    label: "Rendimiento regular",
    sublabel: "Hay materias que requieren atención",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    icon: (
      <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  RED: {
    label: "Atención requerida",
    sublabel: "El rendimiento está en riesgo",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
    icon: (
      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const STATUS_COLORS = {
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  approved: "text-emerald-700 bg-emerald-50 border-emerald-200",
  rejected: "text-red-700 bg-red-50 border-red-200",
};
const STATUS_LABELS = { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada" };

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Acknowledge modal ────────────────────────────────────────────────────────

function AcknowledgeModal({ isOpen, onClose, childName, onConfirm, loading }) {
  const [comment, setComment] = useState("");
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Marcar como revisado" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Vas a confirmar que revisaste las evaluaciones académicas de{" "}
          <span className="font-semibold text-gray-900">{childName}</span>.
        </p>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Comentario (opcional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Ej: Revisado junto con mi hijo/a"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(comment)}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Guardando..." : "Confirmar revisión"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Evidence link ─────────────────────────────────────────────────────────────

function EvidenceLink({ ev }) {
  if (!ev?.evidenceUrl) return <span className="text-gray-300 text-xs">—</span>;
  const isPdf = ev.evidenceResourceType === "raw" || ev.evidenceOriginalName?.endsWith(".pdf");
  if (isPdf) {
    return (
      <a href={ev.evidenceUrl} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-xs text-blue-700 hover:bg-blue-100">
        PDF
      </a>
    );
  }
  return (
    <a href={ev.evidenceUrl} target="_blank" rel="noopener noreferrer">
      <img src={ev.evidenceUrl} alt="Evidencia"
        className="w-9 h-9 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
    </a>
  );
}

// ─── Child detail view ────────────────────────────────────────────────────────

function ChildDetailView({ childData, childEvaluations, loadingEvals, onAcknowledge }) {
  const [activeTab, setActiveTab] = useState("resumen");
  const { performance, pendingAcknowledgements, childName, childGrade } = childData;
  const risk = RISK_CONFIG[performance?.riskLevel] || RISK_CONFIG.GREEN;
  const hasUnreviewed = pendingAcknowledgements?.length > 0;

  return (
    <div className="space-y-4">
      {/* Child header */}
      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <Avatar name={childName} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">{childName}</h3>
              {childGrade && (
                <span className="inline-block mt-1 text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                  {childGrade}
                </span>
              )}
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${risk.bg}`}>
              {risk.icon}
              <p className={`text-xs font-semibold ${risk.color}`}>{risk.label}</p>
            </div>
          </div>

          {/* KPIs */}
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
            </div>
          )}
        </div>
      </div>

      {/* Acknowledge banner */}
      {hasUnreviewed && (
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-blue-800 font-medium">
              {pendingAcknowledgements.length} evaluación{pendingAcknowledgements.length !== 1 ? "es" : ""} aprobada{pendingAcknowledgements.length !== 1 ? "s" : ""} sin revisar
            </p>
            <p className="text-xs text-blue-600 mt-0.5">Confirma que has revisado el resultado junto con tu hijo/a</p>
          </div>
          <button
            onClick={onAcknowledge}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Marcar revisado
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: "resumen", label: "Resumen" },
          { id: "historial", label: "Historial de calificaciones" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {t.id === "historial" && childEvaluations.length > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {childEvaluations.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Resumen tab */}
      {activeTab === "resumen" && (
        <div className="space-y-4">
          {!performance ? (
            <div className="flex flex-col items-center py-10 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Sin datos académicos disponibles</p>
              <p className="text-xs text-gray-400 mt-1">El resumen aparecerá cuando haya evaluaciones registradas</p>
            </div>
          ) : (
            <>
              {/* Risk banner */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${risk.bg}`}>
                <div className="shrink-0">{risk.icon}</div>
                <div>
                  <p className={`text-sm font-semibold ${risk.color}`}>{risk.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{risk.sublabel}</p>
                </div>
              </div>

              {/* Subject averages */}
              {performance.averagesBySubject?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Rendimiento por materia
                  </p>
                  <div className="space-y-3">
                    {performance.averagesBySubject.map((s) => {
                      const isRisk = performance.riskSubjects?.some((r) => r.subjectId === s.subjectId);
                      const pct = Math.min(s.average, 100);
                      const barColor = s.average >= 80 ? "bg-emerald-500" : s.average >= 70 ? "bg-amber-500" : "bg-red-500";
                      const textColor = s.average >= 80 ? "text-emerald-600" : s.average >= 70 ? "text-amber-600" : "text-red-600";
                      return (
                        <div key={s.subjectId}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isRisk && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                              <span className="text-sm text-gray-700 truncate">{s.subjectName}</span>
                            </div>
                            <span className={`text-sm font-bold ${textColor} shrink-0 ml-2`}>{s.average.toFixed(1)}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className={`${barColor} h-2 rounded-full`} style={{ width: `${pct}%` }} />
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
                  <p className="text-xs font-semibold text-red-700 mb-2">Materias en riesgo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {performance.riskSubjects.map((rs) => (
                      <span key={rs.subjectId} className="text-xs px-2.5 py-1 bg-red-100 border border-red-200 text-red-700 rounded-full">
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

      {/* Historial tab */}
      {activeTab === "historial" && (
        <div>
          {loadingEvals ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-14 animate-pulse" />
              ))}
            </div>
          ) : childEvaluations.length === 0 ? (
            <div className="flex flex-col items-center py-10 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">No hay evaluaciones registradas</p>
            </div>
          ) : (
            <>
              {/* Read-only note */}
              <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Solo lectura — {childEvaluations.length} evaluación{childEvaluations.length !== 1 ? "es" : ""}
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Materia</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Período</th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nota</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Evidencia</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subida</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[120px]">Comentario admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {childEvaluations.map((ev) => {
                      const st = STATUS_COLORS[ev.status] || STATUS_COLORS.pending;
                      const score100 = ev.scoreNormalized100;
                      const scoreColor = score100 >= 80 ? "text-emerald-600" : score100 >= 70 ? "text-amber-600" : "text-red-600";
                      return (
                        <tr key={ev.id} className="bg-white hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-3">
                            <p className="font-medium text-gray-900 text-xs whitespace-nowrap">{ev.subject?.name}</p>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <p className="text-xs text-gray-600">{ev.period?.name}</p>
                            <p className="text-xs text-gray-400">{ev.period?.year}</p>
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            <span className={`text-sm font-bold ${scoreColor}`}>{score100?.toFixed(1)}</span>
                            <span className="text-xs text-gray-400">/100</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${st}`}>
                              {STATUS_LABELS[ev.status] || ev.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <EvidenceLink ev={ev} />
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {fmtDate(ev.submittedByStudentAt)}
                          </td>
                          <td className="px-3 py-3 max-w-[160px]">
                            {ev.reviewComment ? (
                              <p className="text-xs text-gray-600 truncate" title={ev.reviewComment}>{ev.reviewComment}</p>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function ParentAcademicSection() {
  const {
    periods,
    childrenOverview,
    selectedChild,
    selectedChildId,
    childEvaluations,
    loadingOverview,
    loadingChildEvals,
    acknowledging,
    errorOverview,
    selectedPeriodId,
    setSelectedPeriodId,
    setSelectedChildId,
    acknowledgeModal,
    openAcknowledgeModal,
    closeAcknowledgeModal,
    handleAcknowledge,
    toast,
    refetch,
  } = useChildAcademicPerformance();

  function ToastBar() {
    if (!toast) return null;
    const colors = {
      success: "bg-emerald-50 border-emerald-300 text-emerald-800",
      error: "bg-red-50 border-red-300 text-red-800",
      info: "bg-blue-50 border-blue-300 text-blue-800",
    };
    return (
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${colors[toast.type] || colors.info}`}>
        {toast.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">Rendimiento académico</h3>
        {loadingOverview && (
          <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {/* Period filter */}
      <select
        value={selectedPeriodId || ""}
        onChange={(e) => setSelectedPeriodId(e.target.value || null)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Todos los períodos</option>
        {periods.map((p) => (
          <option key={p.id} value={p.id}>{p.name} — {p.year}</option>
        ))}
      </select>

      {/* Error state */}
      {errorOverview && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700 flex-1">Error al cargar datos académicos.</p>
          <button onClick={() => refetch()} className="text-xs text-red-700 font-medium underline">Reintentar</button>
        </div>
      )}

      {/* Empty state */}
      {!loadingOverview && childrenOverview.length === 0 && !errorOverview && (
        <div className="flex flex-col items-center py-10 bg-gray-50 rounded-xl border border-gray-200">
          <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-sm text-gray-500">No hay datos académicos disponibles</p>
        </div>
      )}

      {/* Child selector (if multiple children) */}
      {childrenOverview.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {childrenOverview.map((c) => {
            const risk = RISK_CONFIG[c.performance?.riskLevel] || RISK_CONFIG.GREEN;
            const isSelected = c.childId === selectedChildId;
            return (
              <button
                key={c.childId}
                onClick={() => setSelectedChildId(c.childId)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Avatar name={c.childName} size="xs" />
                <span>{c.childName}</span>
                <span className={`w-2 h-2 rounded-full ${risk.dot}`} />
              </button>
            );
          })}
        </div>
      )}

      {/* Child detail — selected child OR fallback to first while auto-selection settles */}
      {(selectedChild || childrenOverview[0]) && (() => {
        const child = selectedChild || childrenOverview[0];
        return (
          <ChildDetailView
            key={child.childId}
            childData={child}
            childEvaluations={childEvaluations}
            loadingEvals={loadingChildEvals}
            onAcknowledge={() => openAcknowledgeModal(child.childId, child.childName)}
          />
        );
      })()}

      <AcknowledgeModal
        isOpen={acknowledgeModal.open}
        onClose={closeAcknowledgeModal}
        childName={acknowledgeModal.childName}
        onConfirm={(comment) => handleAcknowledge(acknowledgeModal.childId, comment)}
        loading={acknowledging}
      />

      <ToastBar />
    </div>
  );
}

export default ParentAcademicSection;
