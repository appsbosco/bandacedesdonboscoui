/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useLazyQuery } from "@apollo/client";
import { Modal } from "components/ui/Modal";
import { cloudinaryOptimized } from "hooks/useImageUpload";
import { GET_EVALUATION_DETAIL } from "../../academic.gql";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending: {
    label: "Pendiente",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/80",
  },
  approved: {
    label: "Aprobada",
    dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/80",
  },
  rejected: {
    label: "Rechazada",
    dot: "bg-rose-400",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/80",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const isPdfFile = resourceType === "raw" || originalName?.toLowerCase().endsWith(".pdf");
  if (isPdfFile) return url;
  return cloudinaryOptimized(url, { width: 640, height: 420 });
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${cfg.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── MobileSectionHeader ──────────────────────────────────────────────────────

function MobileSectionHeader({ label }) {
  return (
    <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
      {label}
    </p>
  );
}

// ─── ScoreDelta ───────────────────────────────────────────────────────────────

function ScoreDelta({ original, originalScale, current, currentScale }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-3.5 py-2.5 text-xs ring-1 ring-amber-200">
      <svg
        className="h-3.5 w-3.5 shrink-0 text-amber-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 4v8m0 0l4-4m-4 4l-4-4"
        />
      </svg>
      <span className="text-amber-700">
        Nota cambiará:{" "}
        <strong>
          {original}/{originalScale}
        </strong>{" "}
        →{" "}
        <strong>
          {current || "–"}/{currentScale || "–"}
        </strong>
      </span>
    </div>
  );
}

// ─── StudentSummaryCard ───────────────────────────────────────────────────────

function StudentSummaryCard({ evaluation }) {
  const studentName = formatStudentName(evaluation.student);
  const submittedDate = formatDate(
    evaluation.submittedByStudentAt || evaluation.createdAt || evaluation.updatedAt
  );

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-neutral-500">Enviada {submittedDate}</span>
          </div>
          <h3 className="truncate text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
            {studentName}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            {evaluation.subject?.name || "Materia"}
            <span className="mx-1.5 text-neutral-300">·</span>
            {evaluation.period?.name || "Período"}
            {evaluation.period?.year ? ` ${evaluation.period.year}` : ""}
          </p>
        </div>
        {evaluation.student?.grade && (
          <div className="shrink-0 rounded-2xl border border-neutral-200 bg-white/80 px-3 py-2 text-center shadow-sm">
            <p className="text-xs font-bold text-neutral-500">Grado</p>
            <p className="mt-0.5 text-sm font-bold text-neutral-800">{evaluation.student.grade}</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex items-baseline gap-1 rounded-2xl border border-neutral-200 bg-white/80 px-3 py-1.5 shadow-sm">
          <span className="text-xs font-semibold text-neutral-500">
            Nota
          </span>
          <span className="ml-1 text-base font-bold text-neutral-800 tabular-nums">
            {evaluation.scoreRaw}
          </span>
          <span className="text-xs text-neutral-400">/ {evaluation.scaleMax}</span>
        </div>
        <div className="flex items-baseline gap-1 rounded-2xl border border-neutral-200 bg-white/80 px-3 py-1.5 shadow-sm">
          <span className="text-xs font-semibold text-neutral-500">
            Normal.
          </span>
          <span
            className={`ml-1 text-base font-bold tabular-nums ${scoreTone(evaluation.scoreNormalized100)}`}
          >
            {evaluation.scoreNormalized100?.toFixed(1) ?? "–"}
          </span>
          <span className="text-xs text-neutral-400">/100</span>
        </div>
      </div>
    </div>
  );
}

// ─── EvidencePreviewCard ──────────────────────────────────────────────────────

function EvidencePreviewCard({
  evaluation,
  detail,
  detailLoading,
  detailError,
  isPdf,
  previewUrl,
  large = false,
}) {
  const evidenceUrl = detail?.evidenceUrl ?? evaluation?.evidenceUrl;
  const hasEvidence = !!(evidenceUrl || evaluation?.evidencePublicId);
  const imgSrc = previewUrl || evidenceUrl;
  const fileName = detail?.evidenceOriginalName ?? evaluation?.evidenceOriginalName;

  if (detailLoading || (!detail && hasEvidence && !detailError)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-neutral-100 bg-neutral-50 py-16">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-600" />
        <p className="text-xs text-neutral-400">Cargando evidencia…</p>
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-center">
        <p className="text-sm font-semibold text-rose-700">No se pudo cargar la evidencia.</p>
        <p className="mt-1 text-xs text-rose-600">Cierra el panel e intenta abrirlo de nuevo.</p>
      </div>
    );
  }

  if (!hasEvidence) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 py-12">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-200">
          <svg
            className="h-5 w-5 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <p className="text-sm text-neutral-400">Sin evidencia adjunta</p>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="rounded-3xl border border-neutral-100 bg-neutral-50 p-4">
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
            <svg
              className="h-7 w-7 text-rose-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9l-6-6H7a2 2 0 00-2 2v14a2 2 0 002 2zm3-9h4m-4 4h4"
              />
            </svg>
          </div>
          <p className="line-clamp-2 text-sm font-semibold text-neutral-800">
            {fileName || "Documento PDF"}
          </p>
          <p className="mt-1 text-xs text-neutral-400">Abre el archivo para revisarlo completo</p>
        </div>
        {evidenceUrl && (
          <a
            href={evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir evidencia en PDF"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Abrir evidencia completa
          </a>
        )}
      </div>
    );
  }

  return (
    <a
      href={evidenceUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir imagen de evidencia completa"
      className="group block rounded-3xl border border-neutral-100 bg-neutral-50 p-3 transition hover:border-neutral-200 hover:shadow-md active:scale-[0.99]"
    >
      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
        <img
          src={imgSrc}
          alt="Evidencia de evaluación"
          loading="eager"
          decoding="async"
          className={`block w-full object-contain transition duration-300 group-hover:scale-[1.02] ${
            large ? "h-48 sm:h-56 lg:h-[min(62dvh,40rem)]" : "h-48 sm:h-56"
          }`}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between px-1">
        <p className="text-xs font-bold text-neutral-500">Evidencia</p>
        <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-600 shadow-sm transition group-hover:bg-neutral-50">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Ampliar
        </span>
      </div>
    </a>
  );
}

// ─── ScoreEditorCard ──────────────────────────────────────────────────────────

function ScoreEditorCard({
  scoreRaw,
  scaleMin,
  scaleMax,
  normalizedPreview,
  disabled,
  error,
  onChange,
}) {
  const previewTone = scoreTone(normalizedPreview);
  const fields = [
    { key: "scoreRaw", label: "Nota", value: scoreRaw },
    { key: "scaleMin", label: "Mínima", value: scaleMin },
    { key: "scaleMax", label: "Máxima", value: scaleMax },
  ];

  return (
    <div className="rounded-3xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-neutral-500">
            Calificación
          </p>
          <h4 className="mt-0.5 text-sm font-semibold text-neutral-800">Ajuste rápido</h4>
        </div>
        <div className="flex items-baseline gap-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-1.5">
          <span className="text-xs font-semibold text-neutral-500">
            Previa
          </span>
          <span className={`ml-1 text-base font-bold tabular-nums ${previewTone}`}>
            {normalizedPreview?.toFixed(1) ?? "–"}
          </span>
          <span className="text-xs text-neutral-400">/100</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {fields.map(({ key, label, value }) => (
          <label key={key} className="block">
            <span className="mb-1.5 block text-xs font-semibold text-neutral-600">
              {label}
            </span>
            <input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => onChange(key, e.target.value)}
              disabled={disabled}
              aria-invalid={Boolean(error)}
              className={`h-12 w-full rounded-2xl border bg-neutral-50 px-3 text-sm font-semibold text-neutral-900 outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                error
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-neutral-200 focus:border-neutral-400 focus:ring-neutral-100"
              }`}
            />
          </label>
        ))}
      </div>
      {error && <p className="mt-3 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

// ─── CommentCard ──────────────────────────────────────────────────────────────

function CommentCard({ comment, onChange, disabled, requireComment, rejectMode, textareaRef }) {
  return (
    <div
      className={`rounded-3xl border p-4 shadow-sm transition sm:p-5 ${
        requireComment
          ? "border-rose-200 bg-rose-50/30"
          : "border-neutral-100 bg-white"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-neutral-500">
            Comentario
          </p>
          <h4 className="mt-0.5 text-sm font-semibold text-neutral-800">
            {rejectMode ? "Motivo de rechazo" : "Para el estudiante"}
          </h4>
        </div>
        {requireComment && (
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
            Requerido
          </span>
        )}
      </div>

      {rejectMode && (
        <div className="mb-3 flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-xs ring-1 ring-amber-200">
          <svg
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-amber-700">
            El estudiante recibirá este comentario para saber qué debe corregir.
          </span>
        </div>
      )}

      <textarea
        ref={textareaRef}
        aria-label={rejectMode ? "Motivo de rechazo" : "Comentario para el estudiante"}
        value={comment}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          rejectMode
            ? "Indica por qué se rechaza esta evaluación…"
            : "Deja una observación concreta (opcional)"
        }
        rows={rejectMode ? 4 : 3}
        disabled={disabled}
        className={`w-full resize-none rounded-2xl border bg-neutral-50 px-3.5 py-3 text-sm leading-relaxed text-neutral-900 outline-none transition placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60 ${
          requireComment
            ? "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
            : "border-neutral-200 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
        }`}
      />
    </div>
  );
}

// ─── DecisionSummary ──────────────────────────────────────────────────────────

function DecisionSummary({
  hasScoreChanges,
  scoreRaw,
  scaleMax,
  originalScoreRaw,
  originalScaleMax,
  reviewComment,
  previousComment,
}) {
  return (
    <div className="rounded-3xl border border-neutral-100 bg-neutral-50 p-4 sm:p-5">
      <p className="mb-3 text-xs font-bold text-neutral-500">
        Resumen de decisión
      </p>

      <div className="space-y-2.5">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-neutral-200">
            <div
              className={`h-2 w-2 rounded-full ${hasScoreChanges ? "bg-amber-500" : "bg-emerald-500"}`}
            />
          </div>
          <p className="text-xs leading-relaxed text-neutral-600">
            {hasScoreChanges
              ? `Nota se actualizará: ${originalScoreRaw}/${originalScaleMax} → ${scoreRaw || "–"}/${scaleMax || "–"}`
              : "La nota se conserva sin cambios."}
          </p>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-neutral-200">
            <div
              className={`h-2 w-2 rounded-full ${reviewComment?.trim() ? "bg-emerald-500" : "bg-neutral-400"}`}
            />
          </div>
          <p className="text-xs leading-relaxed text-neutral-600">
            {reviewComment?.trim() ? "Comentario incluido." : "Sin comentario adjunto."}
          </p>
        </div>
      </div>

      {previousComment && (
        <div className="mt-3 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5">
          <p className="mb-1 text-xs font-bold text-neutral-500">
            Comentario anterior
          </p>
          <p className="line-clamp-3 text-xs leading-relaxed text-neutral-600">{previousComment}</p>
        </div>
      )}
      <p className="mt-3 border-t border-neutral-200 pt-3 text-xs leading-relaxed text-neutral-500">
        Aprobar publica la nota. Rechazar solicita una corrección. Guardar conserva el estado actual.
      </p>
    </div>
  );
}

// ─── StickyReviewActions ──────────────────────────────────────────────────────

function LoadingSpinner({ dark = false }) {
  return (
    <div
      className={`h-4 w-4 animate-spin rounded-full border-2 ${
        dark ? "border-neutral-300 border-t-neutral-700" : "border-white/30 border-t-white"
      }`}
    />
  );
}

function StickyReviewActions({
  activeAction,
  isSubmitting,
  rejectMode,
  onApprove,
  onReject,
  onSave,
  onCancel,
  onConfirmReject,
  onCancelReject,
}) {
  if (rejectMode) {
    return (
      <div className="border-t border-neutral-100 bg-white/95 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.07)] backdrop-blur-sm">
        <div className="mb-2.5 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          <p className="text-xs font-semibold text-rose-600">Confirmar rechazo</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onCancelReject}
            disabled={isSubmitting}
            className="h-12 rounded-2xl border border-neutral-200 bg-neutral-100 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-60"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirmReject}
            disabled={isSubmitting}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-rose-600 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(225,29,72,0.28)] transition hover:bg-rose-500 active:scale-[0.98] disabled:opacity-60"
          >
            {activeAction === "rejected" ? (
              <>
                <LoadingSpinner /> Rechazando…
              </>
            ) : (
              "Confirmar rechazo"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-neutral-100 bg-white/95 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.07)] backdrop-blur-sm">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2.5 sm:grid-cols-[1fr_1fr_auto_auto]">
        {/* Aprobar - acción principal */}
        <button
          type="button"
          onClick={onApprove}
          disabled={isSubmitting}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-60"
        >
          {activeAction === "approved" ? (
            <>
              <LoadingSpinner /> Aprobando…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Aprobar
            </>
          )}
        </button>

        {/* Rechazar — texto en desktop, icono en mobile */}
        <button
          type="button"
          onClick={onReject}
          disabled={isSubmitting}
          aria-label="Rechazar evaluación"
          className="hidden h-12 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 active:scale-[0.98] disabled:opacity-60 sm:flex"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Rechazar
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={isSubmitting}
          aria-label="Rechazar evaluación"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98] disabled:opacity-60 sm:hidden"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Guardar */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSubmitting}
          aria-label="Guardar cambios sin cambiar estado"
          title="Guardar cambios"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-600 transition hover:bg-neutral-100 active:scale-[0.98] disabled:opacity-60"
        >
          {activeAction === "save" ? (
            <LoadingSpinner dark />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
          )}
        </button>

        {/* Cancelar */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Cancelar y cerrar"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-400 transition hover:bg-neutral-50 hover:text-neutral-700 active:scale-[0.98] disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── ReviewSheet ──────────────────────────────────────────────────────────────

function ReviewFields({
  scoreProps,
  scoreDeltaProps,
  commentProps,
  decisionProps,
  formError,
  hasScoreChanges,
}) {
  return (
    <>
      <ScoreEditorCard {...scoreProps} />
      {hasScoreChanges && Number.isFinite(Number(scoreProps.scoreRaw)) && (
        <ScoreDelta {...scoreDeltaProps} />
      )}
      <div ref={commentProps.sectionRef}>
        <CommentCard {...commentProps} />
      </div>
      <DecisionSummary {...decisionProps} />
      {formError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
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
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {formError}
        </div>
      )}
    </>
  );
}

function ReviewSheet({
  evaluation,
  evidenceProps,
  scoreProps,
  scoreDeltaProps,
  commentProps,
  decisionProps,
  actionProps,
  formError,
  hasScoreChanges,
}) {
  const reviewFieldsProps = {
    scoreProps,
    scoreDeltaProps,
    commentProps,
    decisionProps,
    formError,
    hasScoreChanges,
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex justify-center pb-0 pt-2 lg:hidden">
        <div className="h-1 w-10 rounded-full bg-neutral-200" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(23rem,0.65fr)] lg:overflow-hidden">
        <div className="p-4 pb-0 sm:p-5 sm:pb-0 lg:hidden">
          <StudentSummaryCard evaluation={evaluation} />
        </div>

        <section className="p-4 sm:p-5 lg:min-h-0 lg:overflow-y-auto lg:bg-neutral-100 lg:p-6">
          <MobileSectionHeader label="Evidencia" />
          <EvidencePreviewCard {...evidenceProps} large />
        </section>
        <aside className="flex min-h-0 flex-col bg-neutral-50 lg:border-l lg:border-neutral-200">
          <div className="min-h-0 flex-1 p-4 pt-0 sm:p-5 sm:pt-0 lg:overflow-y-auto lg:p-5">
            <div className="grid content-start gap-4">
              <div className="hidden lg:block">
                <StudentSummaryCard evaluation={evaluation} />
              </div>
              <ReviewFields {...reviewFieldsProps} />
            </div>
          </div>
          <div className="hidden lg:block">
            <StickyReviewActions {...actionProps} />
          </div>
        </aside>
      </div>

      <div className="lg:hidden">
        <StickyReviewActions {...actionProps} />
      </div>
    </div>
  );
}

// ─── ReviewModal ──────────────────────────────────────────────────────────────

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

  const [fetchDetail, { data: detailData, loading: detailLoading, error: detailError }] = useLazyQuery(
    GET_EVALUATION_DETAIL,
    { fetchPolicy: "cache-first" }
  );

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

  // Desplaza y enfoca el comentario cuando entra en modo rechazo
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
      Math.round(
        ((parsedScoreRaw - parsedScaleMin) / (parsedScaleMax - parsedScaleMin)) * 10000
      ) / 100
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

  const evaluationStatus = evaluation.status || "pending";

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

  function handleRejectClick() {
    setRejectMode(true);
  }

  function handleConfirmReject() {
    if (!reviewComment.trim()) {
      commentRef.current?.focus();
      return;
    }
    submitReview("rejected", "rejected");
  }

  function handleModalClose() {
    if (!isSubmitting) onClose();
  }

  function handleScoreChange(key, value) {
    if (key === "scoreRaw") setScoreRaw(value);
    if (key === "scaleMin") setScaleMin(value);
    if (key === "scaleMax") setScaleMax(value);
    setFormError(null);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-neutral-900">
              Revisar evaluación
            </h2>
            <StatusBadge status={evaluationStatus} />
          </div>
          <p className="mt-0.5 text-xs text-neutral-400">
            Evidencia → nota → decisión. En segundos.
          </p>
        </div>
      }
      size="full"
      containerClassName="!z-[10020] items-end overflow-hidden p-0 sm:items-center sm:p-4"
      containerStyle={{ zIndex: 10020 }}
      overlayClassName="bg-neutral-950/60 backdrop-blur-md"
      panelClassName="flex min-h-[100dvh] w-full flex-col overflow-hidden rounded-none border border-white/60 bg-white shadow-[0_32px_80px_rgba(0,0,0,0.18)] sm:h-[min(92dvh,52rem)] sm:min-h-0 sm:w-[min(96vw,72rem)] sm:max-w-[72rem] sm:rounded-[28px]"
      headerClassName="!px-5 !py-4 border-b border-neutral-100 bg-white"
      closeButtonClassName="rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
      contentClassName="!p-0 min-h-0 flex-1 overflow-hidden bg-neutral-50"
    >
      <ReviewSheet
        evaluation={evaluation}
        evidenceProps={{
          evaluation,
          detail,
          detailLoading,
          detailError,
          isPdf,
          previewUrl: evidencePreviewUrl,
        }}
        scoreProps={{
          scoreRaw,
          scaleMin,
          scaleMax,
          normalizedPreview,
          disabled: isSubmitting,
          error: scaleError,
          onChange: handleScoreChange,
        }}
        scoreDeltaProps={{
          original: evaluation.scoreRaw,
          originalScale: evaluation.scaleMax,
          current: scoreRaw,
          currentScale: scaleMax,
        }}
        commentProps={{
          comment: reviewComment,
          onChange: setReviewComment,
          disabled: isSubmitting,
          requireComment: rejectMode && !reviewComment.trim(),
          rejectMode,
          textareaRef: commentRef,
          sectionRef: commentSectionRef,
        }}
        decisionProps={{
          hasScoreChanges,
          scoreRaw,
          scaleMax,
          originalScoreRaw: evaluation.scoreRaw,
          originalScaleMax: evaluation.scaleMax,
          reviewComment,
          previousComment: evaluation.reviewComment,
        }}
        actionProps={{
          activeAction,
          isSubmitting,
          rejectMode,
          onApprove: () => submitReview("approved", "approved"),
          onReject: handleRejectClick,
          onSave: () => submitReview(null, "save"),
          onCancel: handleModalClose,
          onConfirmReject: handleConfirmReject,
          onCancelReject: () => setRejectMode(false),
        }}
        formError={formError}
        hasScoreChanges={hasScoreChanges}
      />
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
