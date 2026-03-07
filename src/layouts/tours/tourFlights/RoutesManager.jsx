/* eslint-disable react/prop-types */
/**
 * RoutesManager — primary route management screen.
 * Lists all TourRoutes with their flights and passenger counts.
 * Provides create/edit/delete/assign-flights/assign-passengers actions.
 */
import RouteCard from "./RouteCard";
import RouteFormModal from "./RouteFormModal";
import AssignFlightsToRouteModal from "./AssignFlightsToRouteModal";
import RoutePassengersModal from "./RoutePassengersModal";
import { Toast } from "../TourHelpers";

export default function RoutesManager({
  tourId,
  routes,
  allRoutes,
  unassignedFlights,
  allFlights,
  routesLoading,
  // Route form modal
  formModal,
  openCreateModal,
  openEditModal,
  closeFormModal,
  handleSubmit,
  creating,
  updating,
  // Delete
  handleDelete,
  // Assign flights
  assignFlightsModal,
  openAssignFlightsModal,
  closeAssignFlightsModal,
  handleAssignFlights,
  assigningFlights,
  // Assign passengers
  assignPassengersModal,
  openAssignPassengersModal,
  closeAssignPassengersModal,
  handleAssignPassengers,
  assigningPassengers,
  assignResult,
  setAssignResult,
  // Unassign flight
  handleUnassignFlight,
  // Toast
  toast,
  setToast,
}) {
  const outbound = routes.filter((r) => r.direction === "OUTBOUND");
  const inbound  = routes.filter((r) => r.direction === "INBOUND");

  if (routesLoading && routes.length === 0) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map((i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">
            {routes.length === 0
              ? "Crea una ruta para comenzar a asignar vuelos y pasajeros."
              : `${routes.length} ruta${routes.length !== 1 ? "s" : ""} · ${unassignedFlights.length} vuelo${unassignedFlights.length !== 1 ? "s" : ""} sin asignar`}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-2xl active:scale-[0.98] transition-all flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva ruta
        </button>
      </div>

      {/* Empty state */}
      {routes.length === 0 && (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-3xl mb-3">🔗</p>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Sin rutas definidas</h3>
          <p className="text-xs text-gray-500 mb-4">
            Una ruta agrupa todos los tramos de un mismo itinerario (ida o vuelta).
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-2xl transition-all"
          >
            Crear primera ruta
          </button>
        </div>
      )}

      {/* Outbound routes */}
      {outbound.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            🛫 <span>Rutas de ida</span>
            <span className="text-gray-300 font-normal">({outbound.length})</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {outbound.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onAssignFlights={openAssignFlightsModal}
                onAssignPassengers={openAssignPassengersModal}
                onUnassignFlight={handleUnassignFlight}
              />
            ))}
          </div>
        </section>
      )}

      {/* Inbound routes */}
      {inbound.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            🛬 <span>Rutas de vuelta</span>
            <span className="text-gray-300 font-normal">({inbound.length})</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {inbound.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onAssignFlights={openAssignFlightsModal}
                onAssignPassengers={openAssignPassengersModal}
                onUnassignFlight={handleUnassignFlight}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      <RouteFormModal
        isOpen={formModal.open}
        mode={formModal.mode}
        route={formModal.route}
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        loading={creating || updating}
      />

      <AssignFlightsToRouteModal
        isOpen={assignFlightsModal.open}
        route={assignFlightsModal.route}
        unassignedFlights={unassignedFlights}
        allFlights={allFlights}
        onClose={closeAssignFlightsModal}
        onAssign={handleAssignFlights}
        loading={assigningFlights}
      />

      {assignPassengersModal.open && assignPassengersModal.route && (
        <RoutePassengersModal
          isOpen={assignPassengersModal.open}
          route={assignPassengersModal.route}
          allRoutes={allRoutes}
          tourId={tourId}
          onClose={closeAssignPassengersModal}
          onAssign={handleAssignPassengers}
          onRemove={() => {}}
          applying={assigningPassengers}
          result={assignResult}
          onClearResult={() => setAssignResult(null)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
