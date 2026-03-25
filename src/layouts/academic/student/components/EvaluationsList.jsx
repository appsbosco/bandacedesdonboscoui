/* eslint-disable react/prop-types */
import React from "react";

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  approved: { label: "Aprobada", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  rejected: { label: "Rechazada", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
}

function EvidenceLink({ evaluation }) {
  if (!evaluation?.evidenceUrl) return <span className="text-gray-300">—</span>;
  const isPdf =
    evaluation.evidenceResourceType === "raw" || evaluation.evidenceOriginalName?.endsWith(".pdf");
  if (isPdf) {
    return (
      <a
        href={evaluation.evidenceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-xs text-blue-700 hover:bg-blue-100 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
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
        className="w-9 h-9 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
      />
    </a>
  );
}

export function EvaluationsList({ evaluations, loading, onEdit, onDelete, readOnly = false }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl animate-pulse h-14" />
        ))}
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 bg-gray-50 rounded-xl border border-gray-200">
        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium text-gray-500">No hay evaluaciones registradas</p>
        {!readOnly && (
          <p className="text-xs text-gray-400 mt-1">Registra tu primera evaluación con el botón de arriba</p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Materia</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Período</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Nota</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Normalizada</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Estado</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Evidencia</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Subida</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Revisada</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap min-w-[140px]">Comentario</th>
            {!readOnly && (
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap text-right">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {evaluations.map((ev) => {
            const st = STATUS_CONFIG[ev.status] || STATUS_CONFIG.pending;
            const canEdit = !readOnly && ev.status !== "approved";
            const score100 = ev.scoreNormalized100;
            const scoreColor = score100 >= 80 ? "text-emerald-600" : score100 >= 70 ? "text-amber-600" : "text-red-600";
            return (
              <tr key={ev.id} className="bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 whitespace-nowrap">{ev.subject?.name}</p>
                  {ev.subject?.code && (
                    <p className="text-xs text-gray-400">{ev.subject.code}</p>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-gray-700">{ev.period?.name}</p>
                  <p className="text-xs text-gray-400">{ev.period?.year}</p>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span className="font-medium text-gray-900">{ev.scoreRaw}</span>
                  <span className="text-xs text-gray-400">/{ev.scaleMax}</span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span className={`text-base font-bold ${scoreColor}`}>{score100?.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">/100</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${st.bg} ${st.color}`}>
                    {st.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <EvidenceLink evaluation={ev} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {fmtDate(ev.submittedByStudentAt)}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {fmtDate(ev.reviewedAt)}
                </td>
                <td className="px-4 py-3 max-w-[180px]">
                  {ev.reviewComment ? (
                    <p className="text-xs text-gray-600 truncate" title={ev.reviewComment}>
                      {ev.reviewComment}
                    </p>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                {!readOnly && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {canEdit ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onEdit(ev)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(ev)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default EvaluationsList;
