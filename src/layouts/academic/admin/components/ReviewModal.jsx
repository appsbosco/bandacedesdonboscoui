/* eslint-disable react/prop-types */

import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Modal } from "components/ui/Modal";
import { cloudinaryOptimized } from "hooks/useImageUpload";

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
    accentClassName: "from-amber-100 via-white to-white",
  },
  approved: {
    label: "Aprobada",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
    accentClassName: "from-emerald-100 via-white to-white",
  },
  rejected: {
    label: "Rechazada",
    badgeClassName: "border-red-200 bg-red-50 text-red-800",
    accentClassName: "from-red-100 via-white to-white",
  },
};

function getScoreTone(score) {
  if (score == null || Number.isNaN(score)) return "text-slate-400";
  if (score >= 80) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-rose-600";
}

function formatStudentName(student) {
  return [student?.name, student?.firstSurName].filter(Boolean).join(" ") || "Estudiante";
}

function formatSubmittedDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getOptimizedEvidenceUrl(evaluation) {
  if (!evaluation?.evidenceUrl) return null;
  const isPdf =
    evaluation.evidenceResourceType === "raw" ||
    evaluation.evidenceOriginalName?.toLowerCase().endsWith(".pdf");
  if (isPdf) return evaluation.evidenceUrl;
  return cloudinaryOptimized(evaluation.evidenceUrl, { width: 640, height: 420 });
}

function MetaPill({ label, value, valueClassName = "text-slate-900" }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] shadow-sm">
      <span className="font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      <span className={`font-semibold ${valueClassName}`}>{value}</span>
    </div>
  );
}

MetaPill.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  valueClassName: PropTypes.string,
};

function SectionLabel({ eyebrow, title, trailing }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {eyebrow}
        </p>
        <h3 className="mt-0.5 text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {trailing}
    </div>
  );
}

SectionLabel.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  trailing: PropTypes.node,
};

function EvidenceCard({ evaluation, isPdf, previewUrl, compact = false }) {
  if (!evaluation?.evidenceUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
        No hay evidencia adjunta.
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M7 21h10a2 2 0 002-2V9l-6-6H7a2 2 0 00-2 2v14a2 2 0 002 2zm3-9h4m-4 4h4"
              />
            </svg>
          </div>
          <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900">
            {evaluation.evidenceOriginalName || "Documento PDF"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Abre el archivo para revisar el contenido completo.
          </p>
        </div>

        <a
          href={evaluation.evidenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Abrir evidencia
        </a>
      </div>
    );
  }

  return (
    <a
      href={evaluation.evidenceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl border border-slate-200 bg-slate-50 p-2.5"
      title="Abrir imagen completa"
    >
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Evidencia
        </span>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition group-hover:border-slate-300 group-hover:bg-slate-100">
          Ampliar
        </span>
      </div>

      <div
        className={`overflow-hidden rounded-[18px] border border-slate-200 bg-white ${
          compact ? "p-2" : "p-3"
        }`}
      >
        <img
          src={previewUrl}
          alt="Evidencia de la evaluacion"
          loading="eager"
          decoding="async"
          className={`block w-full object-contain ${compact ? "h-28 sm:h-32" : "h-44 xl:h-52"}`}
        />
      </div>
    </a>
  );
}

EvidenceCard.propTypes = {
  evaluation: PropTypes.object,
  isPdf: PropTypes.bool.isRequired,
  previewUrl: PropTypes.string,
  compact: PropTypes.bool,
};

export function ReviewModal({ isOpen, onClose, evaluation, onReview, loading }) {
  const [reviewComment, setReviewComment] = useState("");
  const [scoreRaw, setScoreRaw] = useState("");
  const [scaleMin, setScaleMin] = useState("0");
  const [scaleMax, setScaleMax] = useState("100");
  const [formError, setFormError] = useState(null);
  const [activeAction, setActiveAction] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setReviewComment(evaluation?.reviewComment || "");
    setScoreRaw(String(evaluation?.scoreRaw ?? ""));
    setScaleMin(String(evaluation?.scaleMin ?? "0"));
    setScaleMax(String(evaluation?.scaleMax ?? "100"));
    setFormError(null);
    setActiveAction(null);
  }, [isOpen, evaluation]);

  const parsedScaleMin = useMemo(() => parseFloat(scaleMin) || 0, [scaleMin]);
  const parsedScaleMax = useMemo(() => parseFloat(scaleMax) || 100, [scaleMax]);
  const parsedScoreRaw = useMemo(() => parseFloat(scoreRaw), [scoreRaw]);

  const normalizedPreview = useMemo(() => {
    if (Number.isNaN(parsedScoreRaw) || parsedScaleMax <= parsedScaleMin) {
      return null;
    }

    return (
      Math.round(((parsedScoreRaw - parsedScaleMin) / (parsedScaleMax - parsedScaleMin)) * 10000) /
      100
    );
  }, [parsedScaleMax, parsedScaleMin, parsedScoreRaw]);

  const hasScoreChanges =
    parsedScoreRaw !== Number(evaluation?.scoreRaw) ||
    parsedScaleMin !== Number(evaluation?.scaleMin) ||
    parsedScaleMax !== Number(evaluation?.scaleMax);

  const modalStatus = STATUS_CONFIG[evaluation?.status] || STATUS_CONFIG.pending;
  const isPdf =
    evaluation?.evidenceResourceType === "raw" ||
    evaluation?.evidenceOriginalName?.toLowerCase().endsWith(".pdf");
  const evidencePreviewUrl = useMemo(() => getOptimizedEvidenceUrl(evaluation), [evaluation]);
  const isSubmitting = loading || activeAction !== null;

  if (!evaluation) return null;

  const studentName = formatStudentName(evaluation.student);
  const currentScoreTone = getScoreTone(evaluation.scoreNormalized100);
  const previewScoreTone = getScoreTone(normalizedPreview);

  async function submitReview(status, actionKey) {
    setFormError(null);

    if (scoreRaw === "" || Number.isNaN(parsedScoreRaw)) {
      setFormError("Ingresa una nota valida antes de continuar.");
      return;
    }

    if (parsedScaleMax <= parsedScaleMin) {
      setFormError("La escala maxima debe ser mayor que la minima.");
      return;
    }

    setActiveAction(actionKey);

    try {
      await onReview(
        evaluation.id,
        status,
        reviewComment.trim(),
        hasScoreChanges
          ? {
              scoreRaw: parsedScoreRaw,
              scaleMin: parsedScaleMin,
              scaleMax: parsedScaleMax,
            }
          : null
      );

      if (status) {
        onClose();
      }
    } catch (error) {
      setFormError(error?.message || "No se pudo completar la revision.");
    } finally {
      setActiveAction(null);
    }
  }

  function handleModalClose() {
    if (!isSubmitting) onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={
        <div className="pr-3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Revisar evaluacion</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Ajusta la nota, valida evidencia y resuelve sin salir del flujo.
          </p>
        </div>
      }
      size="full"
      containerClassName="!z-[10020] items-start overflow-y-auto py-2 sm:py-4"
      containerStyle={{ zIndex: 10020 }}
      overlayClassName="bg-slate-950/55 backdrop-blur-md"
      panelClassName="my-auto flex h-auto min-h-0 w-[min(96vw,68rem)] max-h-[calc(100vh-1rem)] max-w-[68rem] flex-col overflow-hidden border border-white/70 bg-white shadow-[0_32px_100px_rgba(15,23,42,0.2)] sm:max-h-[calc(100vh-2rem)]"
      headerClassName="!px-4 !py-3 border-b border-slate-200 bg-gradient-to-r from-stone-50 via-white to-rose-50/70 sm:!px-5"
      closeButtonClassName="text-slate-500 hover:bg-white hover:text-slate-900"
      contentClassName="!p-0 min-h-0 flex-1 overflow-hidden bg-[linear-gradient(180deg,#fff_0%,#fcfcfb_100%)]"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid min-h-0 gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <div className="grid min-h-0 gap-3">
              <section
                className={`rounded-[20px] border border-slate-200 bg-gradient-to-br ${modalStatus.accentClassName} px-3.5 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.05)] sm:px-4`}
              >
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${modalStatus.badgeClassName}`}
                      >
                        {modalStatus.label}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                        {formatSubmittedDate(
                          evaluation.createdAt || evaluation.updatedAt || evaluation.submittedAt
                        )}
                      </span>
                    </div>

                    <h3 className="mt-2.5 truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                      {studentName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {evaluation.subject?.name || "Materia sin nombre"} ·{" "}
                      {evaluation.period?.name || "Sin periodo"}
                      {evaluation.period?.year ? ` ${evaluation.period.year}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <MetaPill label="Grado" value={evaluation.student?.grade || "No definido"} />
                    <MetaPill
                      label="Actual"
                      value={`${evaluation.scoreRaw}/${evaluation.scaleMax}`}
                    />
                    <MetaPill
                      label="Norm."
                      value={
                        <>
                          {evaluation.scoreNormalized100?.toFixed(1) || "0.0"}
                          <span className="ml-1 text-[10px] font-medium text-slate-400">/100</span>
                        </>
                      }
                      valueClassName={currentScoreTone}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-[0_12px_34px_rgba(15,23,42,0.05)] sm:p-4">
                <div className="grid gap-3">
                  <SectionLabel
                    eyebrow="Calificacion"
                    title="Ajuste rapido"
                    trailing={
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
                        <span className="font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Vista previa
                        </span>
                        <span className={`font-semibold ${previewScoreTone}`}>
                          {normalizedPreview?.toFixed(1) ?? "--"}
                        </span>
                        <span className="text-[11px] text-slate-400">/100</span>
                      </div>
                    }
                  />

                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="block">
                      <span className="mb-1 block text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-slate-500">
                        Nota
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={scoreRaw}
                        onChange={(e) => setScoreRaw(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-slate-500">
                        Escala min.
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={scaleMin}
                        onChange={(e) => setScaleMin(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-slate-500">
                        Escala max.
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={scaleMax}
                        onChange={(e) => setScaleMax(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
                    <div className="min-w-0">
                      <label className="mb-1 block text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-slate-500">
                        Comentario para el estudiante
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Resume la decision o deja una observacion concreta."
                        rows={3}
                        disabled={isSubmitting}
                        className="min-h-[4.75rem] w-full resize-none rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </div>

                    <div className="grid gap-2">
                      <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-slate-500">
                          Resumen
                        </p>
                        <p className="mt-1.5 text-sm leading-5 text-slate-600">
                          {hasScoreChanges
                            ? "La nota actual se actualizara junto con la decision."
                            : "La nota actual se conserva."}
                        </p>
                        <div className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {evaluation.scoreRaw}/{evaluation.scaleMax} a {scoreRaw || "--"}/
                          {scaleMax || "--"}
                        </div>
                      </div>

                      {evaluation.reviewComment && (
                        <div className="rounded-[16px] border border-slate-200 bg-white px-3 py-2.5">
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-slate-500">
                            Comentario previo
                          </p>
                          <p className="mt-1.5 line-clamp-4 text-sm leading-5 text-slate-700">
                            {evaluation.reviewComment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {formError && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                      {formError}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-[0_12px_34px_rgba(15,23,42,0.05)] lg:hidden">
                <SectionLabel eyebrow="Evidencia" title="Revision visual" />
                <div className="mt-3">
                  <EvidenceCard
                    evaluation={evaluation}
                    isPdf={isPdf}
                    previewUrl={evidencePreviewUrl}
                    compact
                  />
                </div>
              </section>
            </div>

            <aside className="hidden min-h-0 lg:grid lg:content-start lg:gap-3">
              <section className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
                <SectionLabel eyebrow="Evidencia" title="Revision visual" />
                <div className="mt-3">
                  <EvidenceCard evaluation={evaluation} isPdf={isPdf} previewUrl={evidencePreviewUrl} />
                </div>
              </section>

              <section className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
                <SectionLabel eyebrow="Decision" title="Checklist rapido" />
                <div className="mt-3 grid gap-2">
                  <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Revisa antes de enviar
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                      <li>Confirma que la evidencia coincida con la nota.</li>
                      <li>Usa comentario corto y accionable.</li>
                      <li>Aprueba, rechaza o guarda sin salir.</li>
                    </ul>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">
            <button
              onClick={() => submitReview("approved", "approved")}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {activeAction === "approved" ? "Aprobando..." : "Aprobar"}
            </button>

            <button
              onClick={() => submitReview("rejected", "rejected")}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(225,29,72,0.18)] transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {activeAction === "rejected" ? "Rechazando..." : "Rechazar"}
            </button>

            <button
              onClick={() => submitReview(null, "save")}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {activeAction === "save" ? "Guardando..." : "Guardar"}
            </button>

            <button
              onClick={handleModalClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
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
