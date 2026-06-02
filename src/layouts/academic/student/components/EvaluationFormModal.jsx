/* eslint-disable react/prop-types */

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal } from "components/ui/Modal";
import EvidenceUploader from "./EvidenceUploader";

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL = {
  subjectId: "",
  periodId: "",
  scoreRaw: "",
  scaleMin: "0",
  scaleMax: "100",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreTone(score) {
  if (score == null || isNaN(score)) return "text-neutral-400";
  if (score >= 80) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-rose-600";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ htmlFor, children, required }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400"
    >
      {children}
      {required && <span className="ml-1 text-rose-400">*</span>}
    </label>
  );
}

function SelectField({ id, name, value, onChange, disabled, placeholder, children }) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full appearance-none rounded-2xl border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-sm font-medium text-neutral-900 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}

function NormalizedScorePreview({ normalized }) {
  const tone = scoreTone(normalized);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
        <svg
          className="h-4 w-4 text-neutral-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          Nota normalizada
        </p>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className={`text-xl font-bold tabular-nums ${tone}`}>{normalized.toFixed(1)}</span>
          <span className="text-xs text-neutral-400">/100</span>
        </div>
      </div>
    </div>
  );
}

function RejectedWarning({ reviewComment }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200">
        <svg
          className="h-3 w-3 text-amber-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 9v2m0 4h.01"
          />
        </svg>
      </div>
      <div>
        <p className="text-xs font-semibold text-amber-800">Evaluación rechazada</p>
        <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
          Corrige la nota, reemplaza la evidencia o realiza ambos cambios antes de reenviarla.
        </p>
        {reviewComment && (
          <div className="mt-2 rounded-xl border border-amber-200 bg-white/70 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
              Motivo del rechazo
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">{reviewComment}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FormErrorAlert({ message }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
      <svg
        className="h-4 w-4 shrink-0 text-rose-500"
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
      <p className="text-sm text-rose-700">{message}</p>
    </div>
  );
}

// ─── EvaluationFormModal ──────────────────────────────────────────────────────

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
  const [evidenceChanged, setEvidenceChanged] = useState(false);
  const [evidenceError, setEvidenceError] = useState(null);
  const [formError, setFormError] = useState(null);

  const isEdit = mode === "edit";
  const isRejected = isEdit && evaluation?.status === "rejected";

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && evaluation) {
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
    setEvidenceChanged(false);
    setFormError(null);
    setEvidenceError(null);
  }, [isOpen, mode, evaluation, initialSelection]);

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
    setEvidenceChanged(true);
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
      setFormError(
        isRejected
          ? "Debes conservar o reemplazar la evidencia antes de reenviar"
          : "Debes subir evidencia de la nota"
      );
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
        const updateInput = {
          scoreRaw: input.scoreRaw,
          scaleMin: input.scaleMin,
          scaleMax: input.scaleMax,
        };
        if (evidenceChanged) {
          Object.assign(updateInput, {
            evidenceUrl: input.evidenceUrl,
            evidencePublicId: input.evidencePublicId,
            evidenceResourceType: input.evidenceResourceType,
            evidenceOriginalName: input.evidenceOriginalName,
          });
        }
        await onUpdate(evaluation.id, updateInput);
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
      title={
        <div>
          <h2 className="text-base font-bold tracking-tight text-neutral-900">
            {isEdit ? "Editar evaluación" : "Registrar evaluación"}
          </h2>
          <p className="mt-0.5 text-xs text-neutral-400">
            {isEdit
              ? "Actualiza nota o reemplaza la evidencia."
              : "Completa los datos y adjunta evidencia."}
          </p>
        </div>
      }
      size="lg"
      containerClassName="items-end p-0 sm:items-center sm:p-4"
      overlayClassName="bg-neutral-950/60 backdrop-blur-md"
      panelClassName="flex h-[95dvh] max-h-[95dvh] w-full flex-col overflow-hidden rounded-t-[32px] rounded-b-none border border-white/60 bg-white shadow-[0_32px_80px_rgba(0,0,0,0.18)] sm:h-[90vh] sm:max-h-[90vh] sm:max-w-lg sm:rounded-[28px]"
      headerClassName="!px-5 !py-4 border-b border-neutral-100 bg-white"
      contentClassName="!p-0 flex min-h-0 flex-1 overflow-hidden bg-neutral-50"
      closeButtonClassName="rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
    >
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        {/* Scroll area */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-3 sm:px-6 sm:pt-5">
          {/* Drag handle — mobile */}
          <div className="mb-4 flex justify-center sm:hidden">
            <div className="h-1 w-10 rounded-full bg-neutral-200" />
          </div>

          <div className="flex flex-col gap-4">
            {/* Alerta evaluación rechazada */}
            {isRejected && <RejectedWarning reviewComment={evaluation.reviewComment} />}

            {/* Materia */}
            <div>
              <FieldLabel htmlFor="eval-subject" required>
                Materia
              </FieldLabel>
              <SelectField
                id="eval-subject"
                name="subjectId"
                value={form.subjectId}
                onChange={handleChange}
                disabled={isEdit}
                placeholder="Selecciona una materia"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </SelectField>
            </div>

            {/* Período */}
            <div>
              <FieldLabel htmlFor="eval-period" required>
                Período
              </FieldLabel>
              <SelectField
                id="eval-period"
                name="periodId"
                value={form.periodId}
                onChange={handleChange}
                disabled={isEdit}
                placeholder="Selecciona un período"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.year}
                  </option>
                ))}
              </SelectField>
            </div>

            {/* Nota */}
            <div>
              <FieldLabel htmlFor="eval-score" required>
                Tu nota
              </FieldLabel>
              <input
                id="eval-score"
                type="number"
                name="scoreRaw"
                value={form.scoreRaw}
                onChange={handleChange}
                step="0.01"
                placeholder="85"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-100"
              />
            </div>

            {/* Nota normalizada — preview */}
            {normalized !== null && <NormalizedScorePreview normalized={normalized} />}

            {/* Evidencia */}
            <div>
              <FieldLabel htmlFor="eval-evidence" required>
                Evidencia{" "}
                <span className="normal-case font-medium tracking-normal text-neutral-400">
                  (imagen o PDF)
                </span>
              </FieldLabel>

              <EvidenceUploader
                inputId="eval-evidence"
                onUpload={handleEvidenceUpload}
                onError={(msg) => setEvidenceError(msg)}
                disabled={loading}
              />

              {evidenceError && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{evidenceError}</p>
              )}
              {isEdit && evidence && !evidenceError && (
                <p className="mt-1.5 text-xs text-neutral-400">
                  {evidenceChanged
                    ? "Nueva evidencia cargada."
                    : "Puedes conservar la evidencia actual o reemplazarla subiendo un nuevo archivo."}
                </p>
              )}
            </div>

            {/* Error global */}
            {formError && <FormErrorAlert message={formError} />}
          </div>
        </div>

        {/* Action bar sticky */}
        <div className="flex flex-col gap-2.5 border-t border-neutral-100 bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.07)] sm:flex-row sm:px-6 sm:pb-4">
          {evidence && (
            <p
              role="status"
              aria-live="polite"
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 sm:hidden"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {isRejected
                ? "Corrección lista para reenviar."
                : "Comprobante listo. Registra tu evaluación."}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-2xl text-sm font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 active:scale-[0.98] sm:h-12 sm:border sm:border-neutral-200 sm:bg-neutral-100 sm:text-neutral-700 sm:hover:bg-neutral-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !evidence}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-[0_8px_24px_rgba(37,99,235,0.28)] transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-white disabled:shadow-none"
          >
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white bg-black" />
            )}
            {isRejected
              ? "Reenviar corrección"
              : isEdit
              ? "Guardar cambios"
              : "Registrar evaluación"}
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
