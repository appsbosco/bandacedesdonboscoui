/* eslint-disable react/prop-types */
/**
 * TourFlightsPage — gestión de vuelos de una gira.
 * Recibe tourId y tourName como props desde TourDetailPage.
 */
import { useTourFlights } from "./useTourFlights";
import FlightCard from "./FlightCard";
import FlightFormModal from "./FlightFormModal";
import FlightDeleteModal from "./FlightDeleteModal";
import FlightPassengersModal from "./FlightPassengersModal";
import { Toast } from "../TourHelpers";

const DIRECTION_SECTIONS = [
  { key: "outbound", label: "Vuelos de ida", emoji: "🛫", flightsKey: "outbound" },
  { key: "inbound", label: "Vuelos de vuelta", emoji: "🛬", flightsKey: "inbound" },
  { key: "connecting", label: "Conexiones", emoji: "🔄", flightsKey: "connecting" },
];

export default function TourFlightsPage({ tourId, tourName }) {
  const {
    flights,
    outbound,
    inbound,
    connecting,
    totalPassengers,
    routeGroups,
    participantAssignments,
    loading,
    error,
    formModal,
    deleteModal,
    passengersModal,
    openCreateModal,
    openEditModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
    openPassengersModal,
    closePassengersModal,
    handleSubmit,
    handleDelete,
    handleAssignPassenger,
    handleAssignPassengers,
    handleRemovePassenger,
    creating,
    updating,
    deleting,
    assigning,
    assigningBulk,
    removing,
    toast,
    setToast,
  } = useTourFlights(tourId);

  const flightsBySection = { outbound, inbound, connecting };

  return (
    <div className="space-y-5">
      {/* Sub-header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">Vuelos de la gira</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Gestioná el itinerario aéreo de <span className="font-semibold">{tourName}</span>
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-2xl active:scale-[0.98] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo vuelo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard value={flights.length} label="Total vuelos" />
        <StatCard value={outbound.length} label="Ida" color="text-blue-600" />
        <StatCard value={inbound.length} label="Vuelta" color="text-violet-600" />
        <StatCard value={totalPassengers} label="Asignaciones" color="text-emerald-600" />
      </div>

      {/* Route groups summary */}
      {routeGroups.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium">Rutas:</span>
          {routeGroups.map((g) => (
            <span
              key={g}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-semibold"
            >
              🔗 {g}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : flights.length === 0 ? (
        <EmptyState onAdd={openCreateModal} tourName={tourName} />
      ) : (
        <div className="space-y-6">
          {DIRECTION_SECTIONS.map(({ key, label, emoji, flightsKey }) => {
            const sectionFlights = flightsBySection[flightsKey];
            if (sectionFlights.length === 0) return null;
            return (
              <section key={key}>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span>{emoji}</span>
                  <span>{label}</span>
                  <span className="ml-1 text-gray-300">({sectionFlights.length})</span>
                </h3>
                <div className="space-y-3">
                  {sectionFlights.map((flight) => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      onEdit={openEditModal}
                      onDelete={openDeleteModal}
                      onManagePassengers={openPassengersModal}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <FlightFormModal
        isOpen={formModal.open}
        mode={formModal.mode}
        flight={formModal.flight}
        routeGroups={routeGroups}
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        loading={creating || updating}
      />

      <FlightDeleteModal
        flight={deleteModal.flight}
        onConfirm={handleDelete}
        onCancel={closeDeleteModal}
        loading={deleting}
      />

      <FlightPassengersModal
        isOpen={passengersModal.open}
        flight={passengersModal.flight}
        tourId={tourId}
        participantAssignments={participantAssignments}
        onClose={closePassengersModal}
        onAssign={handleAssignPassenger}
        onAssignBulk={handleAssignPassengers}
        onRemove={handleRemovePassenger}
        assigning={assigning}
        assigningBulk={assigningBulk}
        removing={removing}
      />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function StatCard({ value, label, color = "text-gray-900" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-gray-100 rounded-2xl" />
      ))}
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
      <p className="text-2xl mb-2">⚠️</p>
      <p className="text-sm font-bold text-red-700">Error al cargar vuelos</p>
      <p className="text-xs text-red-500 mt-1">{message}</p>
    </div>
  );
}

function EmptyState({ onAdd, tourName }) {
  return (
    <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-12 text-center">
      <p className="text-4xl mb-3">✈️</p>
      <h3 className="text-sm font-bold text-gray-900 mb-1">Sin vuelos registrados</h3>
      <p className="text-xs text-gray-500 mb-5">
        Todavía no hay vuelos para <span className="font-semibold">{tourName}</span>.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-2xl transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Agregar primer vuelo
      </button>
    </div>
  );
}
