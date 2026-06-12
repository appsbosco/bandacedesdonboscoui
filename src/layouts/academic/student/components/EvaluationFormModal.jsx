/* eslint-disable react/prop-types */

import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { AlertTriangle, BookOpen, CalendarDays, CheckCircle2, Search } from "lucide-react";
import { Modal } from "components/ui/Modal";
import EvidenceUploader from "./EvidenceUploader";

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL = {
  subjectId: "",
  periodId: "",
  assessmentSlotId: "",
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

function requirementKey(requirement) {
  if (!requirement) return "";
  return `${requirement.subjectId}:${requirement.assessmentSlotId}`;
}

function semesterLabel(semester) {
  return Number(semester) === 2 ? "II Semestre" : "I Semestre";
}

function requirementSort(a, b) {
  const yearDelta = Number(a.academicYear || 0) - Number(b.academicYear || 0);
  if (yearDelta !== 0) return yearDelta;
  const semesterDelta = Number(a.semester || 0) - Number(b.semester || 0);
  if (semesterDelta !== 0) return semesterDelta;
  const subjectDelta = Number(a.subject?.order || 0) - Number(b.subject?.order || 0);
  if (subjectDelta !== 0) return subjectDelta;
  const slotDelta = Number(a.assessmentSlot?.order || 0) - Number(b.assessmentSlot?.order || 0);
  if (slotDelta !== 0) return slotDelta;
  return String(a.subjectName || "").localeCompare(String(b.subjectName || ""));
}

function requirementMatchesQuery(requirement, query) {
  if (!query) return true;
  const needle = String(query).trim().toLowerCase();
  if (!needle) return true;
  return [requirement.subjectName, requirement.slotLabel, requirement.evaluationType]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

function requirementMatchesSemester(requirement, semesterFilter) {
  if (semesterFilter === "all") return true;
  return String(requirement?.semester || "") === String(semesterFilter);
}

function requirementTypeLabel(type) {
  return type === "FINAL_GRADE" ? "Nota final" : "Examen";
}

function requirementSubjectTypeLabel(type) {
  return type === "SEMESTER_FINAL_ONLY" ? "Solo nota final" : "Con exámenes";
}

function inferPeriodSemester(period) {
  const semester = Number(period?.semester);
  return [1, 2].includes(semester) ? semester : null;
}

function findPeriodForRequirement(periods, requirement) {
  if (!requirement) return null;
  return (
    periods.find(
      (period) =>
        Number(period.academicYear || period.year) === Number(requirement.academicYear) &&
        inferPeriodSemester(period) === Number(requirement.semester)
    ) || null
  );
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
  periods,
  requirements = [],
  onSubmit,
  onUpdate,
  loading,
}) {
  const [form, setForm] = useState(INITIAL);
  const [evidence, setEvidence] = useState(null);
  const [evidenceChanged, setEvidenceChanged] = useState(false);
  const [evidenceError, setEvidenceError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequirementKey, setSelectedRequirementKey] = useState("");

  const isEdit = mode === "edit";
  const isRejected = isEdit && evaluation?.status === "rejected";
  const hasLockedRequirement = !isEdit && Boolean(initialSelection?.requirement);
  const sortedRequirements = useMemo(
    () => [...(requirements || [])].sort(requirementSort),
    [requirements]
  );
  const visibleRequirements = useMemo(
    () =>
      sortedRequirements.filter(
        (requirement) =>
          requirementMatchesSemester(requirement, semesterFilter) &&
          requirementMatchesQuery(requirement, searchQuery)
      ),
    [sortedRequirements, semesterFilter, searchQuery]
  );
  const selectedRequirement = useMemo(
    () =>
      hasLockedRequirement
        ? initialSelection?.requirement || null
        : isEdit
        ? initialSelection?.requirement || null
        : sortedRequirements.find((req) => requirementKey(req) === selectedRequirementKey) || null,
    [hasLockedRequirement, initialSelection, isEdit, selectedRequirementKey, sortedRequirements]
  );
  const selectedRequirementPeriod = selectedRequirement
    ? findPeriodForRequirement(periods, selectedRequirement)
    : null;
  const selectedRequirementSemester =
    selectedRequirement?.semester || selectedRequirementPeriod?.semester || 1;

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && evaluation) {
      setForm({
        subjectId: evaluation.subject?.id || "",
        periodId: evaluation.period?.id || "",
        assessmentSlotId: evaluation.assessmentSlot?.id || "",
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
      setSemesterFilter("all");
      setSearchQuery("");
      setSelectedRequirementKey("");
    } else {
      const requirement = initialSelection?.requirement || sortedRequirements[0] || null;
      const period = requirement ? findPeriodForRequirement(periods, requirement) : null;
      setForm({
        ...INITIAL,
        subjectId: requirement?.subjectId || "",
        periodId: period?.id || "",
        assessmentSlotId: requirement?.assessmentSlotId || "",
      });
      setEvidence(null);
      setSelectedRequirementKey(requirement ? requirementKey(requirement) : "");
      if (hasLockedRequirement && requirement) {
        setSemesterFilter(String(requirement.semester || "all"));
      } else {
        setSemesterFilter("all");
      }
    }
    setEvidenceChanged(false);
    setFormError(null);
    setEvidenceError(null);
  }, [
    isOpen,
    mode,
    evaluation,
    initialSelection,
    isEdit,
    periods,
    sortedRequirements,
    hasLockedRequirement,
  ]);

  useEffect(() => {
    if (hasLockedRequirement) return;
    if (!isOpen || isEdit) return;
    const requirement =
      sortedRequirements.find((req) => requirementKey(req) === selectedRequirementKey) || null;
    const period = requirement ? findPeriodForRequirement(periods, requirement) : null;
    setForm((prev) => ({
      ...prev,
      subjectId: requirement?.subjectId || "",
      periodId: period?.id || "",
      assessmentSlotId: requirement?.assessmentSlotId || "",
    }));
  }, [hasLockedRequirement, isOpen, isEdit, periods, selectedRequirementKey, sortedRequirements]);

  useEffect(() => {
    if (hasLockedRequirement) return;
    if (!isOpen || isEdit) return;
    if (selectedRequirementKey) {
      const exists = sortedRequirements.some(
        (req) => requirementKey(req) === selectedRequirementKey
      );
      if (exists) return;
    }
    const fallback = visibleRequirements[0] || sortedRequirements[0] || null;
    setSelectedRequirementKey(fallback ? requirementKey(fallback) : "");
  }, [
    hasLockedRequirement,
    isOpen,
    isEdit,
    selectedRequirementKey,
    sortedRequirements,
    visibleRequirements,
  ]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError(null);
  }

  function selectRequirement(requirement) {
    const nextKey = requirementKey(requirement);
    setSelectedRequirementKey(nextKey);
    const period = findPeriodForRequirement(periods, requirement);
    setForm((prev) => ({
      ...prev,
      subjectId: requirement?.subjectId || "",
      periodId: period?.id || "",
      assessmentSlotId: requirement?.assessmentSlotId || "",
    }));
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

    const targetRequirement = isEdit
      ? selectedRequirement
      : sortedRequirements.find((req) => requirementKey(req) === selectedRequirementKey) || null;

    if (!isEdit && !targetRequirement) {
      setFormError("Selecciona el pendiente exacto antes de continuar");
      return;
    }
    if (!form.subjectId || !form.periodId || !form.assessmentSlotId) {
      setFormError("No se pudo resolver la obligación académica seleccionada");
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
      assessmentSlotId: form.assessmentSlotId,
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
      panelClassName="flex h-[95dvh] max-h-[95dvh] w-full flex-col overflow-hidden rounded-t-[32px] rounded-b-none border border-white/60 bg-white shadow-[0_32px_80px_rgba(0,0,0,0.18)] sm:h-[90vh] sm:max-h-[90vh] sm:max-w-3xl sm:rounded-[28px]"
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

            {!isEdit && hasLockedRequirement && selectedRequirement && (
              <section className="sm:hidden rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-600">
                      Pendiente seleccionado
                    </p>
                    <h4 className="mt-1 truncate text-sm font-bold text-neutral-900">
                      {selectedRequirement.subjectName}
                    </h4>
                    <p className="mt-0.5 truncate text-xs text-neutral-600">
                      {selectedRequirement.slotLabel}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        {semesterLabel(selectedRequirementSemester)}{" "}
                        {selectedRequirement.academicYear}
                      </span>
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        {requirementTypeLabel(selectedRequirement.evaluationType)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {!isEdit && !hasLockedRequirement && (
              <section className="rounded-[28px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-400">
                      Paso 1
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-neutral-900">
                      Elige el pendiente exacto
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                      Selecciona una y sigue con la nota.
                    </p>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                    {visibleRequirements.length} opciones
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "Todos" },
                    { value: "1", label: "I Semestre" },
                    { value: "2", label: "II Semestre" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSemesterFilter(item.value)}
                      className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                        semesterFilter === item.value
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="relative mt-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar materia o evaluación"
                    className="h-11 w-full rounded-2xl border border-neutral-200 bg-neutral-50 pl-10 pr-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-100"
                  />
                </div>

                <div className="mt-4 max-h-[32vh] overflow-y-auto pr-1">
                  {visibleRequirements.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center">
                      <AlertTriangle className="mx-auto h-5 w-5 text-neutral-400" />
                      <p className="mt-2 text-sm font-semibold text-neutral-900">
                        No hay pendientes con ese filtro
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                        Cambia el semestre o limpia la búsqueda para ver más opciones.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {visibleRequirements.map((req) => {
                        const key = requirementKey(req);
                        const isSelected = key === selectedRequirementKey;
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => selectRequirement(req)}
                            className={`group flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                              isSelected
                                ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                                : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-neutral-100 text-neutral-500"
                              }`}
                            >
                              <BookOpen className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-semibold text-neutral-900">
                                  {req.subjectName}
                                </p>
                                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                                  {requirementTypeLabel(req.evaluationType)}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                                {req.slotLabel}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  {semesterLabel(req.semester)} {req.academicYear}
                                </span>
                                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">
                                  {requirementSubjectTypeLabel(req.subjectType)}
                                </span>
                              </div>
                            </div>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-neutral-300 transition group-hover:text-neutral-500">
                              {isSelected ? (
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                              ) : (
                                <div className="h-2 w-2 rounded-full bg-current" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}

            {!isEdit && selectedRequirement && !hasLockedRequirement && (
              <section className="rounded-[28px] border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm sm:p-5 mt-7">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-600">
                      Pendiente seleccionado
                    </p>
                    <h4 className="mt-1 truncate text-base font-bold text-neutral-900">
                      {selectedRequirement.subjectName}
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                      {selectedRequirement.slotLabel}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                        {semesterLabel(selectedRequirementSemester)}{" "}
                        {selectedRequirement.academicYear}
                      </span>
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                        {requirementTypeLabel(selectedRequirement.evaluationType)}
                      </span>
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                        {requirementSubjectTypeLabel(selectedRequirement.subjectType)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {isEdit && evaluation && (
              <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-400">
                      Evaluación actual
                    </p>
                    <h4 className="mt-1 truncate text-base font-bold text-neutral-900">
                      {evaluation.subject?.name || "Materia"}
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                      {evaluation.assessmentSlot?.label ||
                        evaluation.slotLabel ||
                        evaluation.period?.name ||
                        "Pendiente"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {evaluation.period?.name && (
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">
                          {evaluation.period.name}
                        </span>
                      )}
                      {evaluation.assessmentSlot?.semester && (
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">
                          {semesterLabel(evaluation.assessmentSlot.semester)}
                        </span>
                      )}
                      {evaluation.assessmentSlot?.evaluationType && (
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">
                          {requirementTypeLabel(evaluation.assessmentSlot.evaluationType)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

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
        <div className="flex flex-row gap-2.5 border-t border-neutral-100 bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.07)] sm:px-6 sm:pb-4">
          {evidence && (
            <p
              role="status"
              aria-live="polite"
              className="hidden items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 sm:hidden"
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
            className="h-12 flex-1 rounded-2xl border border-neutral-200 bg-neutral-100 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-200 hover:text-neutral-800 active:scale-[0.98]"
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
    assessmentSlotId: PropTypes.string,
    requirement: PropTypes.object,
  }),
  periods: PropTypes.array.isRequired,
  requirements: PropTypes.array,
  onSubmit: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default EvaluationFormModal;
