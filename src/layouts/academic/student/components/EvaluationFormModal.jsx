import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal } from "components/ui/Modal";
import EvidenceUploader from "./EvidenceUploader";

const INITIAL = {
  subjectId: "",
  periodId: "",
  scoreRaw: "",
  scaleMin: "0",
  scaleMax: "100",
};

export function EvaluationFormModal({
  isOpen,
  onClose,
  mode,
  evaluation,
  initialSelection,
  subjects,
  periods,
  onSubmit,
  onUpdate,
  loading,
}) {
  const [form, setForm] = useState(INITIAL);
  const [evidence, setEvidence] = useState(null);
  const [evidenceError, setEvidenceError] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && evaluation) {
        setForm({
          subjectId: evaluation.subject?.id || "",
          periodId: evaluation.period?.id || "",
          scoreRaw: String(evaluation.scoreRaw ?? ""),
          scaleMin: String(evaluation.scaleMin ?? "0"),
          scaleMax: String(evaluation.scaleMax ?? "100"),
        });
        setEvidence({
          url: evaluation.evidenceUrl,
          publicId: evaluation.evidencePublicId,
          resourceType: evaluation.evidenceResourceType || "image",
          originalName: evaluation.evidenceOriginalName || "evidencia",
        });
      } else {
        setForm({
          ...INITIAL,
          subjectId: initialSelection?.subjectId || "",
          periodId: initialSelection?.periodId || "",
        });
        setEvidence(null);
      }
      setFormError(null);
      setEvidenceError(null);
    }
  }, [isOpen, mode, evaluation, initialSelection]);

  const isEdit = mode === "edit";

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError(null);
  }

  function handleEvidenceUpload(result) {
    setEvidence({
      url: result.url,
      publicId: result.publicId,
      resourceType: result.resourceType,
      originalName: result.originalName,
    });
    setEvidenceError(null);
  }

  const scaleMin = parseFloat(form.scaleMin) || 0;
  const scaleMax = parseFloat(form.scaleMax) || 100;
  const scoreRaw = parseFloat(form.scoreRaw);
  const normalized =
    !isNaN(scoreRaw) && scaleMax > scaleMin
      ? Math.round(((scoreRaw - scaleMin) / (scaleMax - scaleMin)) * 10000) / 100
      : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.subjectId) {
      setFormError("Selecciona una materia");
      return;
    }
    if (!form.periodId) {
      setFormError("Selecciona un período");
      return;
    }
    if (!form.scoreRaw) {
      setFormError("Ingresa la nota");
      return;
    }
    if (!evidence) {
      setFormError("Debes subir evidencia de la nota");
      return;
    }

    const input = {
      subjectId: form.subjectId,
      periodId: form.periodId,
      scoreRaw: parseFloat(form.scoreRaw),
      scaleMin: parseFloat(form.scaleMin) || 0,
      scaleMax: parseFloat(form.scaleMax) || 100,
      evidenceUrl: evidence.url,
      evidencePublicId: evidence.publicId,
      evidenceResourceType: evidence.resourceType || "image",
      evidenceOriginalName: evidence.originalName || null,
    };

    try {
      if (isEdit && evaluation) {
        await onUpdate(evaluation.id, {
          scoreRaw: input.scoreRaw,
          scaleMin: input.scaleMin,
          scaleMax: input.scaleMax,
          evidenceUrl: input.evidenceUrl,
          evidencePublicId: input.evidencePublicId,
          evidenceResourceType: input.evidenceResourceType,
          evidenceOriginalName: input.evidenceOriginalName,
        });
      } else {
        await onSubmit(input);
      }
    } catch (err) {
      setFormError(err.message || "Error al guardar");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar evaluación" : "Registrar evaluación"}
      size="lg"
      containerClassName="items-end sm:items-center p-0 sm:p-4"
      overlayClassName="bg-black/40"
      panelClassName="h-[95dvh] max-h-[95dvh] sm:h-[90vh] sm:max-h-[90vh] overflow-hidden rounded-t-[20px] rounded-b-none sm:rounded-2xl flex flex-col"
      headerClassName="border-b border-slate-200 px-5 py-4 sm:px-6"
      contentClassName="p-0 flex flex-1 min-h-0 overflow-hidden"
      closeButtonClassName="hover:bg-slate-100"
    >
      <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-4 pt-2 sm:px-6 sm:pt-5">
          <div className="flex justify-center mb-4 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-slate-200" />
          </div>

          <div className="flex flex-col gap-4">
            {/* Materia */}
            <div>
              <label
                htmlFor="evaluation-subject"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Materia *
              </label>
              <select
                id="evaluation-subject"
                name="subjectId"
                value={form.subjectId}
                onChange={handleChange}
                disabled={isEdit}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
              >
                <option value="">Selecciona una materia</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Período */}
            <div>
              <label
                htmlFor="evaluation-period"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Período *
              </label>
              <select
                id="evaluation-period"
                name="periodId"
                value={form.periodId}
                onChange={handleChange}
                disabled={isEdit}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
              >
                <option value="">Selecciona un período</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.year}
                  </option>
                ))}
              </select>
            </div>

            {/* Escala + Nota */}
            <div className="grid grid-cols-3 gap-3">
              {/* <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nota mínima</label>
            <input
              type="number"
              name="scaleMin"
              value={form.scaleMin}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nota máxima</label>
            <input
              type="number"
              name="scaleMax"
              value={form.scaleMax}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div> */}
              <div>
                <label
                  htmlFor="evaluation-score"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Tu nota *
                </label>
                <input
                  id="evaluation-score"
                  type="number"
                  name="scoreRaw"
                  value={form.scoreRaw}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="85"
                />
              </div>
            </div>

            {/* Preview normalizado */}
            {normalized !== null && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <svg
                  className="w-4 h-4 text-blue-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs text-blue-700">
                  Equivale a <span className="font-semibold">{normalized}/100</span> en escala
                  normalizada
                </p>
              </div>
            )}

            {/* Evidencia */}
            <div>
              <label
                htmlFor="evaluation-evidence"
                className="block text-xs font-medium text-gray-600 mb-2"
              >
                Evidencia (imagen o PDF) *
              </label>
              <EvidenceUploader
                inputId="evaluation-evidence"
                onUpload={handleEvidenceUpload}
                onError={(msg) => setEvidenceError(msg)}
                disabled={loading}
              />
              {evidenceError && <p className="text-xs text-red-600 mt-1">{evidenceError}</p>}
              {isEdit && evidence && !evidenceError && (
                <p className="text-xs text-gray-400 mt-1">
                  Evidencia cargada. Puedes reemplazarla subiendo un nuevo archivo.
                </p>
              )}
            </div>

            {/* Error */}
            {formError && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <svg
                  className="w-4 h-4 text-red-500 shrink-0"
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
                <p className="text-xs text-red-600">{formError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-slate-200 bg-white px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_24px_rgba(15,23,42,0.06)] sm:px-6 sm:pb-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !evidence}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {isEdit ? "Guardar cambios" : "Registrar evaluación"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

EvaluationFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["create", "edit"]),
  evaluation: PropTypes.object,
  initialSelection: PropTypes.shape({
    subjectId: PropTypes.string,
    periodId: PropTypes.string,
  }),
  subjects: PropTypes.array.isRequired,
  periods: PropTypes.array.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default EvaluationFormModal;
