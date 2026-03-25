/* eslint-disable react/prop-types */

import React from "react";
import PropTypes from "prop-types";

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  approved: {
    label: "Aprobada",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  rejected: { label: "Rechazada", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

function EvidenceThumb({ evaluation }) {
  const isPdf =
    evaluation.evidenceResourceType === "raw" || evaluation.evidenceOriginalName?.endsWith(".pdf");
  if (isPdf) {
    return (
      <a
        href={evaluation.evidenceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500 underline"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        PDF
      </a>
    );
  }
  return (
    <a href={evaluation.evidenceUrl} target="_blank" rel="noopener noreferrer">
      <img
        src={evaluation.evidenceUrl}
        alt="Evidencia"
        className="w-10 h-10 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
      />
    </a>
  );
}

EvidenceThumb.propTypes = { evaluation: PropTypes.object.isRequired };

export function EvaluationsList({ evaluations, loading, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse h-16" />
        ))}
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-gray-200">
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
        <p className="text-sm text-gray-500">No hay evaluaciones registradas</p>
        <p className="text-xs text-gray-400 mt-1">
          Registra tu primera evaluación con el botón de arriba
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {evaluations.map((ev) => {
        const st = STATUS_CONFIG[ev.status] || STATUS_CONFIG.pending;
        const canEdit = ev.status !== "approved";

        return (
          <div
            key={ev.id}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3 shadow-sm"
          >
            {/* Evidence thumb */}
            <div className="shrink-0 mt-0.5">
              <EvidenceThumb evaluation={ev} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">{ev.subject?.name}</p>
                  <p className="text-xs text-gray-500">
                    {ev.period?.name} · {ev.period?.year}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-lg font-bold ${
                      ev.scoreNormalized100 >= 80
                        ? "text-emerald-600"
                        : ev.scoreNormalized100 >= 70
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {ev.scoreNormalized100?.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${st.bg} ${st.color}`}
                >
                  {st.label}
                </span>

                {ev.reviewComment && (
                  <p
                    className="text-xs text-gray-500 truncate max-w-[160px]"
                    title={ev.reviewComment}
                  >
                    {ev.reviewComment}
                  </p>
                )}

                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(ev)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(ev)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

EvaluationsList.propTypes = {
  evaluations: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default EvaluationsList;
