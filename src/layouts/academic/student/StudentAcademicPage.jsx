/* eslint-disable react/prop-types */

import React from "react";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useQuery } from "@apollo/client";
import { GET_USERS_BY_ID } from "graphql/queries";
import { Modal } from "components/ui/Modal";
import PerformanceSummary from "./components/PerformanceSummary";
import EvaluationsList from "./components/EvaluationsList";
import EvaluationFormModal from "./components/EvaluationFormModal";
import { useAcademicEvaluations } from "../hooks/useAcademicEvaluations";

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
];

function Toast({ toast }) {
  if (!toast) return null;
  const colors = {
    success: "bg-emerald-50 border-emerald-300 text-emerald-800",
    error: "bg-red-50 border-red-300 text-red-800",
    info: "bg-blue-50 border-blue-300 text-blue-800",
  };
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium animate-slide-up ${
        colors[toast.type] || colors.info
      }`}
    >
      {toast.message}
    </div>
  );
}

export default function StudentAcademicPage() {
  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const currentGrade = userData?.getUser?.grade || null;

  const {
    subjects,
    periods,
    evaluations,
    performance,
    loadingEvaluations,
    loadingPerformance,
    submitting,
    updating,
    deleting,
    filter,
    setFilter,
    formModal,
    deleteModal,
    openFormModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
    handleSubmit,
    handleUpdate,
    handleDelete,
    toast,
  } = useAcademicEvaluations({ grade: currentGrade });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Mi rendimiento académico</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Registra y da seguimiento a tus evaluaciones
                </p>
              </div>
              <button
                onClick={() => openFormModal("create")}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden sm:inline">Nueva evaluación</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Performance summary */}
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Resumen de rendimiento
                </h2>
                <PerformanceSummary performance={performance} loading={loadingPerformance} />
              </section>

              {/* Filters */}
              <section>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={filter.periodId || ""}
                    onChange={(e) =>
                      setFilter((f) => ({ ...f, periodId: e.target.value || null }))
                    }
                    className="flex-1 min-w-[140px] bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los períodos</option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.year}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filter.subjectId || ""}
                    onChange={(e) =>
                      setFilter((f) => ({ ...f, subjectId: e.target.value || null }))
                    }
                    className="flex-1 min-w-[140px] bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las materias</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filter.status || ""}
                    onChange={(e) =>
                      setFilter((f) => ({ ...f, status: e.target.value || null }))
                    }
                    className="flex-1 min-w-[120px] bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              {/* Evaluations list */}
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Mis evaluaciones ({evaluations.length})
                </h2>
                <EvaluationsList
                  evaluations={evaluations}
                  loading={loadingEvaluations}
                  onEdit={(ev) => openFormModal("edit", ev)}
                  onDelete={openDeleteModal}
                />
              </section>
            </div>
          </SoftBox>
        </Card>
      </SoftBox>

      {/* Form Modal */}
      <EvaluationFormModal
        isOpen={formModal.open}
        onClose={closeFormModal}
        mode={formModal.mode}
        evaluation={formModal.evaluation}
        subjects={subjects}
        periods={periods}
        onSubmit={handleSubmit}
        onUpdate={handleUpdate}
        loading={submitting || updating}
      />

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={closeDeleteModal}
        title="Eliminar evaluación"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Seguro que deseas eliminar la evaluación de{" "}
            <span className="font-semibold text-gray-900">
              {deleteModal.evaluation?.subject?.name}
            </span>
            ? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={closeDeleteModal}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => deleteModal.evaluation && handleDelete(deleteModal.evaluation.id)}
              disabled={deleting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} />
      <Footer />
    </DashboardLayout>
  );
}
