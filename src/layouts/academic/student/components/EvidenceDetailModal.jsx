/* eslint-disable react/prop-types */
import React from "react";

const STATUS_LABELS = {
  pending: { label: "Pendiente", color: "text-amber-700 bg-amber-50 border-amber-200" },
  approved: { label: "Aprobada", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  rejected: { label: "Rechazada", color: "text-red-700 bg-red-50 border-red-200" },
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Modal de detalle de evaluación.
 * Muestra evidencePreviewUrl (800w optimizado) o evidenceUrl como fallback.
 * Se monta SOLO cuando el usuario hace clic en "Ver evidencia" — nunca durante la lista.
 */
export function EvidenceDetailModal({ open, data, loading, onClose }) {
  if (!open) return null;

  const isPdf =
    data?.evidenceResourceType === "raw" || data?.evidenceOriginalName?.endsWith(".pdf");

  // Usa preview optimizado; si no existe (datos legacy), usa evidenceUrl original
  const previewSrc = data?.evidencePreviewUrl || data?.evidenceUrl || null;
  const originalSrc = data?.evidenceUrl || null;

  const st = STATUS_LABELS[data?.status] || STATUS_LABELS.pending;
  const score100 = data?.scoreNormalized100;
  const scoreColor =
    score100 >= 80 ? "text-emerald-600" : score100 >= 70 ? "text-amber-600" : "text-red-600";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {data?.subject?.name || "Evaluación"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {data?.period?.name} {data?.period?.year}
              {data?.student && ` · ${data.student.name} ${data.student.firstSurName}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data?.status && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${st.color}`}>
                {st.label}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          )}

          {!loading && data && (
            <div className="p-6 space-y-5">
              {/* Score row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Nota</p>
                  <p className="text-xl font-bold text-gray-900">
                    {data.scoreRaw}
                    <span className="text-sm font-normal text-gray-400">/{data.scaleMax}</span>
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Normalizada</p>
                  <p className={`text-xl font-bold ${scoreColor}`}>
                    {score100?.toFixed(1)}
                    <span className="text-sm font-normal text-gray-400">/100</span>
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Subida</p>
                  <p className="text-xs font-medium text-gray-700">{fmtDate(data.submittedByStudentAt)}</p>
                </div>
              </div>

              {/* Review info */}
              {data.reviewedByAdmin && (
                <div className="bg-blue-50 rounded-xl p-3 text-sm">
                  <p className="text-xs font-semibold text-blue-700 mb-1">
                    Revisada por {data.reviewedByAdmin.name} {data.reviewedByAdmin.firstSurName}
                  </p>
                  <p className="text-xs text-blue-600">{fmtDate(data.reviewedAt)}</p>
                  {data.reviewComment && (
                    <p className="text-xs text-blue-800 mt-1 italic">"{data.reviewComment}"</p>
                  )}
                </div>
              )}

              {/* Evidence */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Evidencia
                </p>
                {isPdf ? (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <svg className="w-8 h-8 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {data.evidenceOriginalName || "Documento PDF"}
                      </p>
                      <p className="text-xs text-gray-500">PDF</p>
                    </div>
                    {originalSrc && (
                      <a
                        href={originalSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shrink-0"
                      >
                        Abrir PDF
                      </a>
                    )}
                  </div>
                ) : previewSrc ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    {/* evidencePreviewUrl = 800w optimizado. Si es legacy, usa evidenceUrl. */}
                    <img
                      src={previewSrc}
                      alt={data.evidenceOriginalName || "Evidencia"}
                      className="w-full max-h-80 object-contain"
                      loading="lazy"
                    />
                    {originalSrc && (
                      <div className="absolute bottom-2 right-2">
                        <a
                          href={originalSrc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Original
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
                    <p className="text-sm text-gray-400">No hay evidencia disponible</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EvidenceDetailModal;
