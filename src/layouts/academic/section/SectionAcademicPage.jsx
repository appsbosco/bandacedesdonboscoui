/* eslint-disable react/prop-types */

import React, { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { GET_USERS_BY_ID } from "graphql/queries";
import BottomSheetDialog from "components/ui/BottomSheetDialog";
import Avatar from "../components/Avatar";
import ReviewModal from "../admin/components/ReviewModal";
import { useSectionAcademicOverview } from "../hooks/useSectionAcademicOverview";

const RISK_CONFIG = {
  GREEN: {
    label: "Buen rendimiento",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  YELLOW: {
    label: "Rendimiento regular",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  RED: {
    label: "Atención requerida",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
};

const STATUS_COLORS = {
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  approved: "text-emerald-700 bg-emerald-50 border-emerald-200",
  rejected: "text-red-700 bg-red-50 border-red-200",
};

const STATUS_LABELS = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function EvidenceLink({ evaluation }) {
  if (!evaluation?.evidenceUrl) return <span className="text-gray-300 text-xs">—</span>;

  const isPdf =
    evaluation.evidenceResourceType === "raw" || evaluation.evidenceOriginalName?.endsWith(".pdf");

  if (isPdf) {
    return (
      <a
        href={evaluation.evidenceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-xs text-blue-700 hover:bg-blue-100"
      >
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

function MemberDetail({ member, evaluations, loadingEvaluations, onOpenReview }) {
  const [activeTab, setActiveTab] = useState("resumen");
  const performance = member?.performance || null;
  const risk = RISK_CONFIG[performance?.riskLevel] || RISK_CONFIG.GREEN;

  if (!member) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <Avatar src={member.memberAvatar} name={member.memberName} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">{member.memberName}</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {member.memberGrade && (
                  <span className="inline-block text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                    {member.memberGrade}
                  </span>
                )}
                {member.memberInstrument && (
                  <span className="inline-block text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                    {member.memberInstrument}
                  </span>
                )}
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${risk.bg}`}>
              <span className={`w-2 h-2 rounded-full ${risk.dot}`} />
              <p className={`text-xs font-semibold ${risk.color}`}>{risk.label}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-3">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">
                {performance?.averageGeneral?.toFixed?.(1) ?? "0.0"}
              </p>
              <p className="text-xs text-gray-400">Promedio</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">
                {member.submittedEvaluationsCount}
              </p>
              <p className="text-xs text-gray-400">Subidas</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{member.expectedEvaluationsCount}</p>
              <p className="text-xs text-gray-400">Esperadas</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p
                className={`text-lg font-bold ${
                  member.missingEvaluationsCount > 0 ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {member.missingEvaluationsCount}
              </p>
              <p className="text-xs text-gray-400">Faltantes</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
          member.allEvaluationsSubmitted
            ? "bg-emerald-50 border-emerald-200"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        <div>
          <p
            className={`text-sm font-semibold ${
              member.allEvaluationsSubmitted ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {member.allEvaluationsSubmitted
              ? "Completó todas las calificaciones esperadas"
              : "Aún tiene calificaciones pendientes por subir"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {member.submittedEvaluationsCount} de {member.expectedEvaluationsCount} registradas
          </p>
        </div>
        <span
          className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
            member.allEvaluationsSubmitted
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {member.allEvaluationsSubmitted ? "Completo" : "Incompleto"}
        </span>
      </div>

      <div className="flex border-b border-gray-200">
        {[
          { id: "resumen", label: "Resumen" },
          { id: "historial", label: "Historial" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "resumen" && (
        <div className="space-y-4">
          {performance?.averagesBySubject?.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Rendimiento por materia
              </p>
              <div className="space-y-3">
                {performance.averagesBySubject.map((subject) => {
                  const pct = Math.min(subject.average, 100);
                  const barColor =
                    subject.average >= 80
                      ? "bg-emerald-500"
                      : subject.average >= 70
                      ? "bg-amber-500"
                      : "bg-red-500";

                  return (
                    <div key={subject.subjectId}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 truncate">
                          {subject.subjectName}
                        </span>
                        <span className="text-sm font-bold text-gray-900 ml-2">
                          {subject.average.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`${barColor} h-2 rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Sin rendimiento aprobado aún</p>
              <p className="text-xs text-gray-400 mt-1">
                El resumen aparecerá cuando haya evaluaciones aprobadas
              </p>
            </div>
          )}

          {performance?.riskSubjects?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-700 mb-2">Materias en riesgo</p>
              <div className="flex flex-wrap gap-1.5">
                {performance.riskSubjects.map((riskSubject) => (
                  <span
                    key={riskSubject.subjectId}
                    className="text-xs px-2.5 py-1 bg-red-100 border border-red-200 text-red-700 rounded-full"
                  >
                    {riskSubject.subjectName} · {riskSubject.average.toFixed(1)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "historial" && (
        <div>
          {loadingEvaluations ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="bg-gray-100 rounded-xl h-14 animate-pulse" />
              ))}
            </div>
          ) : evaluations.length === 0 ? (
            <div className="flex flex-col items-center py-10 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">No hay evaluaciones registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Materia
                    </th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Período
                    </th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Nota
                    </th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Evidencia
                    </th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Subida
                    </th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {evaluations.map((evaluation) => {
                    const statusClass = STATUS_COLORS[evaluation.status] || STATUS_COLORS.pending;
                    const scoreColor =
                      evaluation.scoreNormalized100 >= 80
                        ? "text-emerald-600"
                        : evaluation.scoreNormalized100 >= 70
                        ? "text-amber-600"
                        : "text-red-600";

                    return (
                      <tr
                        key={evaluation.id}
                        className="bg-white hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-3">
                          <p className="font-medium text-gray-900 text-xs whitespace-nowrap">
                            {evaluation.subject?.name}
                          </p>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <p className="text-xs text-gray-600">{evaluation.period?.name}</p>
                          <p className="text-xs text-gray-400">{evaluation.period?.year}</p>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <span className={`text-sm font-bold ${scoreColor}`}>
                            {evaluation.scoreNormalized100?.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-400">/100</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}
                          >
                            {STATUS_LABELS[evaluation.status] || evaluation.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <EvidenceLink evaluation={evaluation} />
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {fmtDate(evaluation.submittedByStudentAt)}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          {evaluation.status === "pending" ? (
                            <button
                              type="button"
                              onClick={() => onOpenReview(evaluation)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              Revisar
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MemberRow({ member, isSelected, onOpen }) {
  const risk = RISK_CONFIG[member.performance?.riskLevel] || RISK_CONFIG.GREEN;
  const average = member.performance?.averageGeneral;

  return (
    <tr
      onClick={onOpen}
      className={`cursor-pointer transition-colors ${
        isSelected ? "bg-blue-50" : "bg-white hover:bg-gray-50"
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-[220px]">
          <Avatar src={member.memberAvatar} name={member.memberName} size="xs" />
          <div>
            <p className="font-medium text-gray-900">{member.memberName}</p>
            <p className="text-xs text-gray-400">
              {member.allEvaluationsSubmitted ? "Completo" : "Requiere seguimiento"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{member.memberGrade || "—"}</td>
      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
        {member.memberInstrument || "—"}
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs font-semibold ${
            member.missingEvaluationsCount > 0
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {member.missingEvaluationsCount}
        </span>
      </td>
      <td className="px-4 py-3 text-center text-gray-600 whitespace-nowrap">
        {member.submittedEvaluationsCount}/{member.expectedEvaluationsCount}
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${risk.bg} ${risk.color}`}
        >
          <span className={`w-2 h-2 rounded-full ${risk.dot}`} />
          {risk.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-3">
          <span className="text-sm font-bold text-gray-900">
            {average?.toFixed?.(1) ?? "0.0"}
          </span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </td>
    </tr>
  );
}

function MemberCard({ member, onOpen }) {
  const risk = RISK_CONFIG[member.performance?.riskLevel] || RISK_CONFIG.GREEN;
  const average = member.performance?.averageGeneral;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        <Avatar src={member.memberAvatar} name={member.memberName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{member.memberName}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {member.memberGrade ? (
                  <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {member.memberGrade}
                  </span>
                ) : null}
                {member.memberInstrument ? (
                  <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {member.memberInstrument}
                  </span>
                ) : null}
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${risk.bg} ${risk.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
              {risk.label}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-[11px] text-gray-400">Promedio</p>
              <p className="text-sm font-bold text-gray-900">{average?.toFixed?.(1) ?? "0.0"}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-[11px] text-gray-400">Subidas</p>
              <p className="text-sm font-bold text-gray-900">
                {member.submittedEvaluationsCount}/{member.expectedEvaluationsCount}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-[11px] text-gray-400">Pendientes</p>
              <p
                className={`text-sm font-bold ${
                  member.missingEvaluationsCount > 0 ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {member.missingEvaluationsCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function SectionAcademicPage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewingEvaluation, setReviewingEvaluation] = useState(null);
  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const currentUser = userData?.getUser || null;

  const {
    periods,
    membersOverview,
    selectedMember,
    selectedMemberId,
    memberEvaluations,
    loadingOverview,
    loadingMemberEvaluations,
    reviewing,
    errorOverview,
    selectedPeriodId,
    setSelectedPeriodId,
    setSelectedMemberId,
    handleReview,
    toast,
    refetch,
  } = useSectionAcademicOverview();

  const completionStats = useMemo(() => {
    const complete = membersOverview.filter((member) => member.allEvaluationsSubmitted).length;
    return {
      total: membersOverview.length,
      complete,
      incomplete: Math.max(membersOverview.length - complete, 0),
    };
  }, [membersOverview]);

  function handleOpenMember(memberId) {
    setSelectedMemberId(memberId);
    setDetailOpen(true);
  }

  function handleOpenReview(evaluation) {
    setReviewingEvaluation(evaluation);
  }

  function ToastBar() {
    if (!toast) return null;
    const colors = {
      success: "bg-emerald-50 border-emerald-300 text-emerald-800",
      error: "bg-red-50 border-red-300 text-red-800",
      info: "bg-blue-50 border-blue-300 text-blue-800",
    };
    return (
      <div
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${
          colors[toast.type] || colors.info
        }`}
      >
        {toast.message}
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Seguimiento académico de sección
                </h1>

                {currentUser?.instrument && (
                  <span className="inline-flex mt-3 text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                    Sección: {currentUser.instrument}
                  </span>
                )}
              </div>
              {loadingOverview && (
                <svg
                  className="animate-spin h-5 w-5 text-blue-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Integrantes visibles</p>
                <p className="text-2xl font-bold text-gray-900">{completionStats.total}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Calificaciones completas</p>
                <p className="text-2xl font-bold text-emerald-600">{completionStats.complete}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Pendientes por completar</p>
                <p className="text-2xl font-bold text-amber-600">{completionStats.incomplete}</p>
              </div>
            </div>

            <div className="mb-4">
              <select
                value={selectedPeriodId || ""}
                onChange={(event) => setSelectedPeriodId(event.target.value || null)}
                className="w-full sm:w-auto min-w-[240px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todos los períodos activos</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name} — {period.year}
                  </option>
                ))}
              </select>
            </div>

            {errorOverview && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700 flex-1">
                  No fue posible cargar el seguimiento académico de la sección.
                </p>
                <button
                  onClick={() => refetch()}
                  className="text-xs text-red-700 font-medium underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!loadingOverview && membersOverview.length === 0 && !errorOverview && (
              <div className="flex flex-col items-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-500">
                  No hay integrantes activos con datos académicos
                </p>
              </div>
            )}

            {membersOverview.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {membersOverview.map((member) => (
                    <MemberCard
                      key={member.memberId}
                      member={member}
                      onOpen={() => handleOpenMember(member.memberId)}
                    />
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Integrante
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Nivel
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Instrumento
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Pendientes
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Subidas
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Rendimiento
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Promedio
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {membersOverview.map((member) => (
                        <MemberRow
                          key={member.memberId}
                          member={member}
                          isSelected={member.memberId === selectedMemberId}
                          onOpen={() => handleOpenMember(member.memberId)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </SoftBox>
        </Card>
      </SoftBox>

      <BottomSheetDialog
        isOpen={detailOpen && Boolean(selectedMember)}
        onClose={() => setDetailOpen(false)}
        title={selectedMember?.memberName || "Detalle académico"}
        subtitle={
          selectedMember
            ? `${selectedMember.memberInstrument || "Sin instrumento"} · ${
                selectedMember.memberGrade || "Sin nivel"
              }`
            : null
        }
        icon="🎓"
        maxWidth="820px"
        footer={
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setDetailOpen(false)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        }
      >
        <div className="p-4 sm:p-6">
          <MemberDetail
            member={selectedMember}
            evaluations={memberEvaluations}
            loadingEvaluations={loadingMemberEvaluations}
            onOpenReview={handleOpenReview}
          />
        </div>
      </BottomSheetDialog>

      <ReviewModal
        isOpen={Boolean(reviewingEvaluation)}
        onClose={() => setReviewingEvaluation(null)}
        evaluation={reviewingEvaluation}
        onReview={async (id, status, comment) => {
          await handleReview(id, status, comment);
          setReviewingEvaluation(null);
        }}
        loading={reviewing}
      />

      <ToastBar />

      <Footer />
    </DashboardLayout>
  );
}
