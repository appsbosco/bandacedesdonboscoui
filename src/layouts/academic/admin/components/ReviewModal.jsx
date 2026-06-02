/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useLazyQuery } from "@apollo/client";
import BottomSheetDialog from "components/ui/BottomSheetDialog";
import { cloudinaryOptimized } from "hooks/useImageUpload";
import { GET_EVALUATION_DETAIL } from "../../academic.gql";

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    dot: "bg-amber-400",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
  },
  approved: {
    label: "Aprobada",
    dot: "bg-emerald-400",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  rejected: {
    label: "Rechazada",
    dot: "bg-rose-400",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

function scoreTone(score) {
  if (score == null || Number.isNaN(score)) return "text-neutral-400";
  if (score >= 80) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-rose-600";
}

function formatStudentName(student) {
  return [student?.name, student?.firstSurName].filter(Boolean).join(" ") || "Estudiante";
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseNumber(value) {
  if (value === "") return Number.NaN;
  return Number(value);
}

function getOptimizedUrl(url, resourceType, originalName) {
  if (!url) return null;
  const isPdf = resourceType === "raw" || originalName?.toLowerCase().endsWith(".pdf");
  if (isPdf) return url;
  return cloudinaryOptimized(url, { width: 640, height: 420 });
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${config.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function LoadingSpinner({ dark = false }) {
  return (
    <span
      className={`h-4 w-4 animate-spin rounded-full border-2 ${
        dark ? "border-neutral-300 border-t-neutral-700" : "border-white border-t-transparent"
      }`}
    />
  );
}

function SectionTitle({ children }) {
  return <h3 className="mb-3 text-sm font-semibold text-neutral-700">{children}</h3>;
}

function StudentCard({ evaluation }) {
  const submittedAt =
    evaluation.submittedByStudentAt || evaluation.createdAt || evaluation.updatedAt;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-neutral-500">Enviada {formatDate(submittedAt)}</p>
          <h3 className="mt-2 truncate text-xl font-bold text-neutral-900">
            {formatStudentName(evaluation.student)}
          </h3>
          <p className="mt-1 text-sm text-neutral-600">
            {evaluation.subject?.name || "Materia"}
            <span className="mx-1 text-neutral-300">·</span>
            {evaluation.period?.name || "Período"}
            {evaluation.period?.year ? ` ${evaluation.period.year}` : ""}
          </p>
        </div>
        {evaluation.student?.grade && (
          <div className="shrink-0 rounded-xl bg-neutral-100 px-3 py-2 text-center">
            <p className="text-xs text-neutral-500">Grado</p>
            <p className="text-sm font-bold text-neutral-800">{evaluation.student.grade}</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
          Nota{" "}
          <strong className="text-neutral-900">
            {evaluation.scoreRaw}/{evaluation.scaleMax}
          </strong>
        </div>
        <div className="rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
          Normalizada{" "}
          <strong className={scoreTone(evaluation.scoreNormalized100)}>
            {evaluation.scoreNormalized100?.toFixed(1) ?? "–"}/100
          </strong>
        </div>
      </div>
    </section>
  );
}

function EvidenceCard({ evaluation, detail, detailLoading, detailError, isPdf, previewUrl }) {
  const evidenceUrl = detail?.evidenceUrl ?? evaluation?.evidenceUrl;
  const fileName = detail?.evidenceOriginalName ?? evaluation?.evidenceOriginalName;
  const hasEvidence = Boolean(evidenceUrl || evaluation?.evidencePublicId);
  const imageUrl = previewUrl || evidenceUrl;

  if (detailLoading || (!detail && hasEvidence && !detailError)) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <LoadingSpinner dark />
          Cargando evidencia
        </div>
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        No se pudo cargar la evidencia. Cierra el modal e intenta abrirlo de nuevo.
      </div>
    );
  }

  if (!hasEvidence) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
        Sin evidencia adjunta
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex min-h-48 flex-col items-center justify-center rounded-xl bg-neutral-50 p-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M7 21h10a2 2 0 002-2V9l-6-6H7a2 2 0 00-2 2v14a2 2 0 002 2zm3-9h4m-4 4h4"
              />
            </svg>
          </div>
          <p className="mt-3 text-sm font-semibold text-neutral-800">
            {fileName || "Documento PDF"}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Revisa el archivo completo antes de decidir.
          </p>
        </div>
        {evidenceUrl && <EvidenceLink href={evidenceUrl} />}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="flex justify-center overflow-hidden rounded-xl bg-neutral-50">
        <img
          src={imageUrl}
          alt="Evidencia de evaluación"
          loading="eager"
          decoding="async"
          className="max-h-72 w-full object-contain lg:max-h-96"
        />
      </div>
      {evidenceUrl && <EvidenceLink href={evidenceUrl} />}
    </div>
  );
}

function EvidenceLink({ href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
      Abrir evidencia
    </a>
  );
}

function ScoreCard({ scoreRaw, scaleMin, scaleMax, normalizedPreview, disabled, error, onChange }) {
  const fields = [
    { key: "scoreRaw", label: "Nota", value: scoreRaw },
    { key: "scaleMin", label: "Mínima", value: scaleMin },
    { key: "scaleMax", label: "Máxima", value: scaleMax },
  ];

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionTitle>Calificación</SectionTitle>
        <div className="rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
          Previa{" "}
          <strong className={scoreTone(normalizedPreview)}>
            {normalizedPreview?.toFixed(1) ?? "–"}/100
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {fields.map(({ key, label, value }) => (
          <label key={key} className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-600">{label}</span>
            <input
              type="number"
              step="0.01"
              value={value}
              onChange={(event) => onChange(key, event.target.value)}
              disabled={disabled}
              aria-invalid={Boolean(error)}
              className={`h-12 w-full rounded-xl border bg-neutral-50 px-3 text-sm font-semibold text-neutral-900 outline-none transition focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                error
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-neutral-200 focus:border-neutral-400 focus:ring-neutral-100"
              }`}
            />
          </label>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
    </section>
  );
}

function CommentCard({ comment, onChange, disabled, rejectMode, textareaRef, sectionRef }) {
  return (
    <section
      ref={sectionRef}
      className={`rounded-2xl border p-4 shadow-sm ${
        rejectMode ? "border-rose-200 bg-rose-50" : "border-neutral-200 bg-white"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <SectionTitle>{rejectMode ? "Motivo de rechazo" : "Comentario"}</SectionTitle>
        {rejectMode && (
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
            Requerido
          </span>
        )}
      </div>
      {rejectMode && (
        <p className="mb-3 text-sm text-rose-700">
          Explica qué debe corregir el estudiante antes de volver a enviar.
        </p>
      )}
      <textarea
        ref={textareaRef}
        value={comment}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          rejectMode
            ? "Indica el motivo del rechazo"
            : "Agrega una observación para el estudiante (opcional)"
        }
        rows={rejectMode ? 4 : 3}
        disabled={disabled}
        aria-label={rejectMode ? "Motivo de rechazo" : "Comentario para el estudiante"}
        required={rejectMode}
        className="w-full resize-none rounded-xl border border-neutral-200 bg-white p-3 text-sm leading-relaxed text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </section>
  );
}

function SummaryCard({
  hasScoreChanges,
  scoreRaw,
  scaleMax,
  originalScoreRaw,
  originalScaleMax,
  reviewComment,
  previousComment,
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <SectionTitle>Resumen</SectionTitle>
      <p className="text-sm leading-relaxed text-neutral-600">
        {hasScoreChanges
          ? `La nota cambiará de ${originalScoreRaw}/${originalScaleMax} a ${scoreRaw || "–"}/${
              scaleMax || "–"
            }.`
          : "La nota se conserva sin cambios."}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        {reviewComment.trim()
          ? "Se enviará un comentario al estudiante."
          : "Sin comentario adjunto."}
      </p>
      {previousComment && (
        <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3">
          <p className="text-sm font-semibold text-neutral-700">Comentario anterior</p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">{previousComment}</p>
        </div>
      )}
    </section>
  );
}

function ActionBar({
  activeAction,
  isSubmitting,
  rejectMode,
  onApprove,
  onReject,
  onConfirmReject,
  onCancelReject,
}) {
  if (rejectMode) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCancelReject}
          disabled={isSubmitting}
          className="h-12 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
        >
          Cancelar rechazo
        </button>
        <button
          type="button"
          onClick={onConfirmReject}
          disabled={isSubmitting}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
        >
          {activeAction === "rejected" && <LoadingSpinner />}
          {activeAction === "rejected" ? "Rechazando" : "Confirmar rechazo"}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
      <button
        type="button"
        onClick={onApprove}
        disabled={isSubmitting}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {activeAction === "approved" && <LoadingSpinner />}
        {activeAction === "approved" ? "Aprobando" : "Aprobar evaluación"}
      </button>
      <button
        type="button"
        onClick={onReject}
        disabled={isSubmitting}
        className="h-12 rounded-xl border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
      >
        Rechazar
      </button>
    </div>
  );
}

export function ReviewModal({ isOpen, onClose, evaluation, onReview, loading }) {
  const [reviewComment, setReviewComment] = useState("");
  const [scoreRaw, setScoreRaw] = useState("");
  const [scaleMin, setScaleMin] = useState("0");
  const [scaleMax, setScaleMax] = useState("100");
  const [formError, setFormError] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [rejectMode, setRejectMode] = useState(false);
  const commentRef = useRef(null);
  const commentSectionRef = useRef(null);

  const [fetchDetail, { data: detailData, loading: detailLoading, error: detailError }] =
    useLazyQuery(GET_EVALUATION_DETAIL, { fetchPolicy: "cache-first" });

  useEffect(() => {
    if (!isOpen) return;
    setReviewComment(evaluation?.reviewComment || "");
    setScoreRaw(String(evaluation?.scoreRaw ?? ""));
    setScaleMin(String(evaluation?.scaleMin ?? "0"));
    setScaleMax(String(evaluation?.scaleMax ?? "100"));
    setFormError(null);
    setActiveAction(null);
    setRejectMode(false);
    if (evaluation?.id) fetchDetail({ variables: { id: evaluation.id } });
  }, [isOpen, evaluation, fetchDetail]);

  useEffect(() => {
    if (!rejectMode) return undefined;
    const focusTimer = window.setTimeout(() => {
      commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      commentRef.current?.focus();
    }, 80);
    return () => window.clearTimeout(focusTimer);
  }, [rejectMode]);

  const loadedDetail = detailData?.evaluationDetail;
  const detail = loadedDetail && loadedDetail.id === evaluation?.id ? loadedDetail : null;
  const parsedScaleMin = useMemo(() => parseNumber(scaleMin), [scaleMin]);
  const parsedScaleMax = useMemo(() => parseNumber(scaleMax), [scaleMax]);
  const parsedScoreRaw = useMemo(() => parseNumber(scoreRaw), [scoreRaw]);

  const normalizedPreview = useMemo(() => {
    if (
      !Number.isFinite(parsedScoreRaw) ||
      !Number.isFinite(parsedScaleMin) ||
      !Number.isFinite(parsedScaleMax) ||
      parsedScaleMax <= parsedScaleMin
    ) {
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

  const isPdf =
    (detail?.evidenceResourceType ?? evaluation?.evidenceResourceType) === "raw" ||
    (detail?.evidenceOriginalName ?? evaluation?.evidenceOriginalName)
      ?.toLowerCase()
      .endsWith(".pdf");

  const evidencePreviewUrl = useMemo(
    () =>
      getOptimizedUrl(
        detail?.evidencePreviewUrl || detail?.evidenceUrl,
        detail?.evidenceResourceType,
        detail?.evidenceOriginalName
      ),
    [detail]
  );

  const isSubmitting = loading || activeAction !== null;
  const scaleError = useMemo(() => {
    if (!scaleMin || !scaleMax) return "Completa la escala mínima y máxima.";
    if (!Number.isFinite(parsedScaleMin) || !Number.isFinite(parsedScaleMax)) {
      return "Ingresa valores válidos para la escala.";
    }
    if (parsedScaleMax <= parsedScaleMin) {
      return "La escala máxima debe ser mayor que la mínima.";
    }
    return null;
  }, [parsedScaleMax, parsedScaleMin, scaleMax, scaleMin]);

  if (!evaluation) return null;

  function validate() {
    if (scoreRaw === "" || !Number.isFinite(parsedScoreRaw)) {
      setFormError("Ingresa una nota válida antes de continuar.");
      return false;
    }
    if (scaleError) {
      setFormError(scaleError);
      return false;
    }
    if (parsedScoreRaw < parsedScaleMin || parsedScoreRaw > parsedScaleMax) {
      setFormError("La nota debe estar dentro de la escala indicada.");
      return false;
    }
    setFormError(null);
    return true;
  }

  async function submitReview(status, actionKey) {
    if (!validate()) return;
    setActiveAction(actionKey);
    try {
      await onReview(
        evaluation.id,
        status,
        reviewComment.trim(),
        hasScoreChanges
          ? { scoreRaw: parsedScoreRaw, scaleMin: parsedScaleMin, scaleMax: parsedScaleMax }
          : null
      );
      if (status) onClose();
    } catch (error) {
      setFormError(error?.message || "No se pudo completar la revisión.");
    } finally {
      setActiveAction(null);
    }
  }

  function handleConfirmReject() {
    if (!reviewComment.trim()) {
      setFormError("Escribe el motivo del rechazo antes de continuar.");
      commentRef.current?.focus();
      return;
    }
    submitReview("rejected", "rejected");
  }

  function handleScoreChange(key, value) {
    if (key === "scoreRaw") setScoreRaw(value);
    if (key === "scaleMin") setScaleMin(value);
    if (key === "scaleMax") setScaleMax(value);
    setFormError(null);
  }

  function handleModalClose() {
    if (!isSubmitting) onClose();
  }

  function handleCancelReject() {
    setRejectMode(false);
    setFormError(null);
  }

  return (
    <BottomSheetDialog
      isOpen={isOpen}
      onClose={handleModalClose}
      title={
        <div className="flex flex-wrap items-center gap-2">
          <span>Revisar evaluación</span>
          <StatusBadge status={evaluation.status || "pending"} />
        </div>
      }
      subtitle="Verifica la evidencia y registra tu decisión"
      icon="📝"
      maxWidth="1040px"
      fillHeight
      zIndex={10020}
      footer={
        <ActionBar
          activeAction={activeAction}
          isSubmitting={isSubmitting}
          rejectMode={rejectMode}
          onApprove={() => submitReview("approved", "approved")}
          onReject={() => {
            setRejectMode(true);
            setFormError(null);
          }}
          onConfirmReject={handleConfirmReject}
          onCancelReject={handleCancelReject}
        />
      }
    >
      <main className="grid grid-cols-1 gap-4 bg-neutral-50 p-4 lg:grid-cols-2 lg:p-6">
        <div className="space-y-4">
          <section>
            <SectionTitle>Evidencia</SectionTitle>
            <EvidenceCard
              evaluation={evaluation}
              detail={detail}
              detailLoading={detailLoading}
              detailError={detailError}
              isPdf={isPdf}
              previewUrl={evidencePreviewUrl}
            />
          </section>
        </div>

        <div className="space-y-4">
          <StudentCard evaluation={evaluation} />
          <ScoreCard
            scoreRaw={scoreRaw}
            scaleMin={scaleMin}
            scaleMax={scaleMax}
            normalizedPreview={normalizedPreview}
            disabled={isSubmitting}
            error={scaleError}
            onChange={handleScoreChange}
          />
          <CommentCard
            comment={reviewComment}
            onChange={(value) => {
              setReviewComment(value);
              setFormError(null);
            }}
            disabled={isSubmitting}
            rejectMode={rejectMode}
            textareaRef={commentRef}
            sectionRef={commentSectionRef}
          />
          {/* <SummaryCard
            hasScoreChanges={hasScoreChanges}
            scoreRaw={scoreRaw}
            scaleMax={scaleMax}
            originalScoreRaw={evaluation.scoreRaw}
            originalScaleMax={evaluation.scaleMax}
            reviewComment={reviewComment}
            previousComment={evaluation.reviewComment}
          /> */}
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            >
              {formError}
            </div>
          )}
        </div>
      </main>
    </BottomSheetDialog>
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
