/* eslint-disable react/prop-types */

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal } from "components/ui/Modal";

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

export function ReviewModal({ isOpen, onClose, evaluation, onReview, loading }) {
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    if (isOpen) setReviewComment("");
  }, [isOpen]);

  if (!evaluation) return null;

  const isPdf =
    evaluation.evidenceResourceType === "raw" || evaluation.evidenceOriginalName?.endsWith(".pdf");

  const st = STATUS_CONFIG[evaluation.status] || STATUS_CONFIG.pending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Revisar evaluación" size="lg">
      <div className="space-y-4">
        {/* Student + Subject info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-0.5">Estudiante</p>
            <p className="font-medium text-gray-900">
              {evaluation.student?.name} {evaluation.student?.firstSurName}
            </p>
            {evaluation.student?.grade && (
              <p className="text-xs text-gray-500">{evaluation.student.grade}</p>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-0.5">Materia · Período</p>
            <p className="font-medium text-gray-900">{evaluation.subject?.name}</p>
            <p className="text-xs text-gray-500">
              {evaluation.period?.name} — {evaluation.period?.year}
            </p>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Nota</p>
            <p className="text-2xl font-bold text-gray-900">
              {evaluation.scoreRaw}
              <span className="text-sm text-gray-400 font-normal">/{evaluation.scaleMax}</span>
            </p>
          </div>
          <div className="w-px h-10 bg-gray-300" />
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Normalizado</p>
            <p
              className={`text-2xl font-bold ${
                evaluation.scoreNormalized100 >= 80
                  ? "text-emerald-600"
                  : evaluation.scoreNormalized100 >= 70
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {evaluation.scoreNormalized100?.toFixed(1)}
              <span className="text-sm text-gray-400 font-normal">/100</span>
            </p>
          </div>
          <div className="ml-auto">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium border ${st.bg} ${st.color}`}
            >
              {st.label}
            </span>
          </div>
        </div>

        {/* Evidence */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Evidencia</p>
          {isPdf ? (
            <a
              href={evaluation.evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-blue-600 hover:text-blue-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {evaluation.evidenceOriginalName || "Ver PDF"}
            </a>
          ) : (
            <a href={evaluation.evidenceUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={evaluation.evidenceUrl}
                alt="Evidencia"
                className="w-full max-h-52 object-contain rounded-xl border border-gray-200 hover:opacity-90 transition-opacity"
              />
            </a>
          )}
        </div>

        {/* Previous review comment if exists */}
        {evaluation.reviewComment && (
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
            <p className="text-xs text-gray-500 mb-0.5">Comentario previo</p>
            <p className="text-sm text-gray-700 italic">{evaluation.reviewComment}</p>
          </div>
        )}

        {/* New comment */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Comentario (opcional)
          </label>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Escribe un comentario para el estudiante..."
            rows={2}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onReview(evaluation.id, "rejected", reviewComment)}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Rechazar"}
          </button>
          <button
            onClick={() => onReview(evaluation.id, "approved", reviewComment)}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Aprobar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

ReviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  evaluation: PropTypes.object,
  onReview: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default ReviewModal;
