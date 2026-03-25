/* eslint-disable react/prop-types */

/* eslint-disable react/prop-types */

/**
 * TourListPage — lista de todas las giras.
 * Navega a /tours/:tourId al hacer click en una tarjeta.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useTours } from "./useTours";
import { GET_USERS_BY_ID } from "graphql/queries";
import TourFormModal from "./TourFormModal";
import {
  TourStatusBadge,
  formatTourDateRange,
  getTourDuration,
  Toast,
  DeleteConfirmModal,
} from "./TourHelpers";

// ── TourCard ──────────────────────────────────────────────────────────────────

function TourCard({ tour, onEdit, onDelete, onClick, canManageTours }) {
  const duration = getTourDuration(tour.startDate, tour.endDate);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group overflow-hidden"
    >
      {/* Top accent bar by status */}
      <div
        className={`h-1 w-full ${
          tour.status === "ACTIVE"
            ? "bg-emerald-400"
            : tour.status === "CLOSED"
            ? "bg-blue-400"
            : tour.status === "CANCELLED"
            ? "bg-red-400"
            : "bg-gray-200"
        }`}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
              {tour.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <svg
                className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-xs text-gray-500 truncate">
                {tour.destination}, {tour.country}
              </span>
            </div>
          </div>
          <TourStatusBadge status={tour.status} />
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 mb-3">
          <svg
            className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs text-gray-600">
            {formatTourDateRange(tour.startDate, tour.endDate)}
          </span>
          {duration && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
              {duration}
            </span>
          )}
        </div>

        {/* Description */}
        {tour.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{tour.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {tour.createdBy ? `${tour.createdBy.name} ${tour.createdBy.firstSurName}` : "—"}
          </span>

          {/* Actions — stop propagation so card click doesn't fire */}
          {canManageTours && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(tour);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Editar"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(tour);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Eliminar"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ onCreate, canManageTours }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
      <div className="text-5xl mb-4">✈️</div>
      <h3 className="text-base font-bold text-gray-900 mb-1">Sin giras registradas</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
        Crea tu primera gira para comenzar a gestionar participantes, vuelos y habitaciones.
      </p>
      {canManageTours && (
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-2xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Crear primera gira
        </button>
      )}
    </div>
  );
}

// ── Status filter pills ────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { id: "all", label: "Todas" },
  { id: "ACTIVE", label: "Activas" },
  { id: "DRAFT", label: "Borrador" },
  { id: "CLOSED", label: "Cerradas" },
  { id: "CANCELLED", label: "Canceladas" },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TourListPage() {
  const navigate = useNavigate();
  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const {
    tours,
    loading,
    error,
    formModal,
    deleteModal,
    openCreateModal,
    openEditModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
    handleSubmit,
    handleDelete,
    creating,
    updating,
    deleting,
    toast,
    setToast,
  } = useTours();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const canManageTours = userData?.getUser?.role !== "CEDES Financiero";

  const filtered = tours.filter((t) => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const term = search.toLowerCase();
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(term) ||
      t.destination.toLowerCase().includes(term) ||
      t.country.toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap p-4 mt-1">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Giras</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {tours.length} gira{tours.length !== 1 ? "s" : ""} registrada
              {tours.length !== 1 ? "s" : ""}
            </p>
          </div>
          {canManageTours && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-2xl active:scale-[0.98] transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nueva gira
            </button>
          )}
        </div>

        {/* Filters */}
        {tours.length > 0 && (
          <div className="px-4 space-y-3">
            {/* Status pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === f.id
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
              {/* <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg> */}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, destino, país…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-48" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-sm font-semibold text-red-700">Error al cargar las giras</p>
              <p className="text-xs text-red-500 mt-1">{error.message}</p>
            </div>
          ) : filtered.length === 0 ? (
            tours.length === 0 ? (
              <EmptyState onCreate={openCreateModal} canManageTours={canManageTours} />
            ) : (
              <div className="py-12 text-center text-gray-500">
                <p className="text-2xl mb-2">🔍</p>
                <p className="text-sm font-semibold">Sin resultados</p>
                <p className="text-xs mt-1">Prueba con otros filtros o términos de búsqueda.</p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((tour) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                  onClick={() => navigate(`/tours/${tour.id}`)}
                  canManageTours={canManageTours}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TourFormModal
        isOpen={formModal.open}
        mode={formModal.mode}
        tour={formModal.tour}
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        loading={creating || updating}
      />

      {deleteModal.open && (
        <DeleteConfirmModal
          tour={deleteModal.tour}
          onConfirm={handleDelete}
          onCancel={closeDeleteModal}
          loading={deleting}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Footer />
    </DashboardLayout>
  );
}
