/* eslint-disable react/prop-types */
/**
 * ItinerariesManager — primary itinerary management screen.
 * Lists all TourItineraries (roundtrip packages) with capacity + leaders.
 * Provides create/edit/delete/assign-flights/assign-passengers/manage-leaders actions.
 */
import ItineraryCard from "./ItineraryCard";
import ItineraryFormModal from "./ItineraryFormModal";
import AssignFlightsToItineraryModal from "./AssignFlightsToItineraryModal";
import ItineraryPassengersModal from "./ItineraryPassengersModal";
import ItineraryLeadersModal from "./ItineraryLeadersModal";
import { Toast } from "../TourHelpers";

export default function ItinerariesManager({
  tourId,
  itineraries,
  unassignedFlights,
  itinerariesLoading,
  // Form modal
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
  handleRemovePassengers,
  assigningPassengers,
  removingPassengers,
  assignResult,
  setAssignResult,
  // Leaders
  leadersModal,
  openLeadersModal,
  closeLeadersModal,
  handleSetLeaders,
  settingLeaders,
  // Unassign flight
  handleUnassignFlight,
  // Toast
  toast,
  setToast,
}) {
  if (itinerariesLoading && itineraries.length === 0) {
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
            {itineraries.length === 0
              ? "Crea un itinerario para agrupar vuelos de ida y vuelta."
              : `${itineraries.length} itinerario${itineraries.length !== 1 ? "s" : ""} · ${unassignedFlights.length} vuelo${unassignedFlights.length !== 1 ? "s" : ""} sin asignar`}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-2xl active:scale-[0.98] transition-all flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo itinerario
        </button>
      </div>

      {/* Empty state */}
      {itineraries.length === 0 && (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-3xl mb-3">🗓️</p>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Sin itinerarios definidos</h3>
          <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
            Un itinerario agrupa todos los vuelos de una cotización (ida + vuelta)
            y los pasajeros que viajan juntos.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-2xl transition-all"
          >
            Crear primer itinerario
          </button>
        </div>
      )}

      {/* Itinerary cards grid */}
      {itineraries.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {itineraries.map((itinerary) => (
            <ItineraryCard
              key={itinerary.id}
              itinerary={itinerary}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onAssignFlights={openAssignFlightsModal}
              onAssignPassengers={openAssignPassengersModal}
              onManageLeaders={openLeadersModal}
              onUnassignFlight={handleUnassignFlight}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ItineraryFormModal
        isOpen={formModal.open}
        mode={formModal.mode}
        itinerary={formModal.itinerary}
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        loading={creating || updating}
      />

      <AssignFlightsToItineraryModal
        isOpen={assignFlightsModal.open}
        itinerary={assignFlightsModal.itinerary}
        unassignedFlights={unassignedFlights}
        onClose={closeAssignFlightsModal}
        onAssign={handleAssignFlights}
        loading={assigningFlights}
      />

      {assignPassengersModal.open && assignPassengersModal.itinerary && (
        <ItineraryPassengersModal
          isOpen={assignPassengersModal.open}
          itinerary={assignPassengersModal.itinerary}
          allItineraries={itineraries}
          tourId={tourId}
          onClose={closeAssignPassengersModal}
          onAssign={handleAssignPassengers}
          onRemove={handleRemovePassengers}
          applying={assigningPassengers || removingPassengers}
          result={assignResult}
          onClearResult={() => setAssignResult(null)}
        />
      )}

      {leadersModal.open && leadersModal.itinerary && (
        <ItineraryLeadersModal
          isOpen={leadersModal.open}
          itinerary={leadersModal.itinerary}
          onClose={closeLeadersModal}
          onSave={handleSetLeaders}
          saving={settingLeaders}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
