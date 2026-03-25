import React, { useState } from "react";
import PropTypes from "prop-types";
import { Modal } from "components/ui/Modal";
import { useChildAcademicPerformance } from "../hooks/useChildAcademicPerformance";

const RISK_CONFIG = {
  GREEN: { label: "Buen rendimiento", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  YELLOW: { label: "Rendimiento regular", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  RED: { label: "Atención requerida", color: "text-red-600", bg: "bg-red-50 border-red-200", dot: "bg-red-500" },
};

const STATUS_LABELS = { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada" };
const STATUS_COLORS = {
  pending: "text-amber-700 bg-amber-100 border-amber-300",
  approved: "text-emerald-700 bg-emerald-100 border-emerald-300",
  rejected: "text-red-700 bg-red-100 border-red-300",
};

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
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Comentario (opcional)
          </label>
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

AcknowledgeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  childName: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

function ChildAcademicCard({ childData, onAcknowledge }) {
  const { performance, pendingAcknowledgements, childName, childGrade } = childData;
  const [showAll, setShowAll] = useState(false);

  const risk = RISK_CONFIG[performance?.riskLevel] || RISK_CONFIG.GREEN;
  const hasUnreviewed = pendingAcknowledgements?.length > 0;

  const recentEvals = performance?.recentEvaluations || [];
  const displayed = showAll ? recentEvals : recentEvals.slice(0, 3);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Card header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${risk.bg} border-b-gray-200`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${risk.dot}`} />
          <p className={`text-sm font-semibold ${risk.color}`}>{risk.label}</p>
        </div>
        {hasUnreviewed && (
          <button
            onClick={onAcknowledge}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Marcar revisado ({pendingAcknowledgements.length})
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center bg-gray-50 rounded-lg py-2">
            <p className="text-xl font-bold text-gray-900">
              {performance?.averageGeneral?.toFixed(1) ?? "—"}
            </p>
            <p className="text-xs text-gray-500">Promedio</p>
          </div>
          <div className="text-center bg-gray-50 rounded-lg py-2">
            <p className="text-xl font-bold text-emerald-600">{performance?.approvedCount ?? 0}</p>
            <p className="text-xs text-gray-500">Aprobadas</p>
          </div>
          <div className="text-center bg-gray-50 rounded-lg py-2">
            <p className="text-xl font-bold text-amber-600">{performance?.pendingCount ?? 0}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </div>
        </div>

        {/* Risk subjects */}
        {performance?.riskSubjects?.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-xs font-semibold text-red-700 mb-1">Materias en riesgo</p>
            <div className="flex flex-wrap gap-1">
              {performance.riskSubjects.map((rs) => (
                <span
                  key={rs.subjectId}
                  className="text-xs px-2 py-0.5 bg-red-100 border border-red-300 text-red-700 rounded-full"
                >
                  {rs.subjectName} ({rs.average.toFixed(1)})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Subject averages */}
        {performance?.averagesBySubject?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Por materia
            </p>
            <div className="space-y-1.5">
              {performance.averagesBySubject.map((s) => {
                const isRisk = performance.riskSubjects?.some((r) => r.subjectId === s.subjectId);
                const pct = Math.min(s.average, 100);
                const barColor = s.average >= 80 ? "bg-emerald-500" : s.average >= 70 ? "bg-amber-500" : "bg-red-500";
                return (
                  <div key={s.subjectId}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        {isRisk && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                        {s.subjectName}
                      </span>
                      <span className="text-xs font-medium text-gray-900">{s.average.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-0.5">
                      <div className={`${barColor} h-1 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent evaluations */}
        {recentEvals.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Evaluaciones recientes
            </p>
            <div className="space-y-1.5">
              {displayed.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm text-gray-800">{ev.subject?.name}</p>
                    <p className="text-xs text-gray-500">{ev.period?.name} · {ev.period?.year}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${
                      ev.scoreNormalized100 >= 80 ? "text-emerald-600" :
                      ev.scoreNormalized100 >= 70 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {ev.scoreNormalized100?.toFixed(1)}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[ev.status] || STATUS_COLORS.pending}`}>
                      {STATUS_LABELS[ev.status] || ev.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {recentEvals.length > 3 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
              >
                {showAll ? "Ver menos" : `Ver todas (${recentEvals.length})`}
              </button>
            )}
          </div>
        )}

        {recentEvals.length === 0 && !performance?.approvedCount && (
          <p className="text-sm text-gray-500 text-center py-4">
            No hay evaluaciones aprobadas aún
          </p>
        )}
      </div>
    </div>
  );
}

ChildAcademicCard.propTypes = {
  childData: PropTypes.object.isRequired,
  onAcknowledge: PropTypes.func.isRequired,
};

// ─── Main section ─────────────────────────────────────────────────────────────

export function ParentAcademicSection() {
  const {
    periods,
    childrenOverview,
    loadingOverview,
    acknowledging,
    errorOverview,
    selectedPeriodId,
    setSelectedPeriodId,
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
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
    };
    return (
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${colors[toast.type] || colors.info}`}>
        {toast.message}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-gray-700">Rendimiento académico</h3>
        {loadingOverview && (
          <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {/* Period filter */}
      <div className="mb-4">
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
      </div>

      {errorOverview && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          Error al cargar datos académicos.{" "}
          <button onClick={() => refetch()} className="underline">Reintentar</button>
        </div>
      )}

      {!loadingOverview && childrenOverview.length === 0 && !errorOverview && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-500">No hay datos académicos disponibles para el período seleccionado</p>
        </div>
      )}

      <div className="space-y-4">
        {childrenOverview.map((childData) => (
          <div key={childData.childId}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {childData.childName?.[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{childData.childName}</p>
                {childData.childGrade && (
                  <p className="text-xs text-gray-500">{childData.childGrade}</p>
                )}
              </div>
            </div>
            <ChildAcademicCard
              childData={childData}
              onAcknowledge={() => openAcknowledgeModal(childData.childId, childData.childName)}
            />
          </div>
        ))}
      </div>

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

ParentAcademicSection.propTypes = {};

export default ParentAcademicSection;
