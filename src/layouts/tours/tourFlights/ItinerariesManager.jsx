/* eslint-disable react/prop-types */
/**
 * ItinerariesManager — primary itinerary management screen.
 * Lists all TourItineraries (roundtrip packages) with capacity + leaders.
 * Provides create/edit/delete/assign-flights/assign-passengers/manage-leaders actions.
 */
import { useState } from "react";
import ItineraryCard from "./ItineraryCard";
import ItineraryFormModal from "./ItineraryFormModal";
import AssignFlightsToItineraryModal from "./AssignFlightsToItineraryModal";
import ItineraryLeadersModal from "./ItineraryLeadersModal";
import { Toast } from "../TourHelpers";
import TourSelfServiceItinerary from "../selfService/TourSelfServiceItinerary";

export default function ItinerariesManager({
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
  openAssignPassengersModal,
  // Leaders
  leadersModal,
  openLeadersModal,
  closeLeadersModal,
  handleSetLeaders,
  settingLeaders,
  lockModal,
  openLockModal,
  closeLockModal,
  handleToggleLock,
  changingLock,
  // Unassign flight
  handleUnassignFlight,
  // Toast
  toast,
  setToast,
}) {
  const [previewItinerary, setPreviewItinerary] = useState(null);

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
          type="button"
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
            type="button"
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
              onToggleLock={openLockModal}
              onPreview={setPreviewItinerary}
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

      {leadersModal.open && leadersModal.itinerary && (
        <ItineraryLeadersModal
          isOpen={leadersModal.open}
          itinerary={leadersModal.itinerary}
          onClose={closeLeadersModal}
          onSave={handleSetLeaders}
          saving={settingLeaders}
        />
      )}

      <ItineraryLockModal
        itinerary={lockModal.itinerary}
        onConfirm={handleToggleLock}
        onCancel={closeLockModal}
        loading={changingLock}
      />

      <ItineraryMemberPreviewModal
        itinerary={previewItinerary}
        onClose={() => setPreviewItinerary(null)}
      />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function ItineraryMemberPreviewModal({ itinerary, onClose }) {
  if (!itinerary) return null;

  return (
    <dialog
      open
      className="fixed inset-0 z-[1400] m-0 flex h-full max-h-none w-full max-w-none items-center justify-center overflow-y-auto border-0 bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      aria-modal="true"
      aria-labelledby="member-preview-title"
    >
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
              Previsualización administrativa
            </p>
            <h3 id="member-preview-title" className="truncate text-base font-bold text-slate-900">
              Así lo verá el integrante
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar previsualización"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-6">
          <TourSelfServiceItinerary itinerary={itinerary} loading={false} />
        </div>
        <div className="border-t border-slate-200 bg-white px-5 py-3 text-center text-[11px] text-slate-500">
          Esta vista no requiere que tu usuario administrador esté asignado al itinerario.
        </div>
      </div>
    </dialog>
  );
}

function ItineraryLockModal({ itinerary, onConfirm, onCancel, loading }) {
  if (!itinerary) return null;
  const unlocking = itinerary.isLocked;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="itinerary-lock-title">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className={`h-1.5 ${unlocking ? "bg-red-500" : "bg-amber-400"}`} />
        <div className="p-6">
          <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${unlocking ? "bg-red-50" : "bg-amber-50"}`}>
            <span className="text-xl">{unlocking ? "🔓" : "🔒"}</span>
          </div>
          <h3 id="itinerary-lock-title" className="text-lg font-black text-gray-900">
            {unlocking ? "¿Desbloquear este itinerario?" : "¿La lista ya fue entregada?"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {unlocking
              ? "Al desbloquearlo se podrán modificar nuevamente el itinerario, sus vuelos, líderes y pasajeros. Verificá si cualquier cambio debe notificarse a la aerolínea."
              : "Se protegerán el itinerario, sus vuelos asignados, líderes y lista de pasajeros contra cambios accidentales."}
          </p>
          <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800">
            {itinerary.name} · {itinerary.passengerCount || 0} pasajeros
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onCancel} disabled={loading} className="rounded-xl px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={onConfirm} disabled={loading} className={`rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${unlocking ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-gray-700"}`}>
              {loading ? "Guardando…" : unlocking ? "Sí, desbloquear" : "Bloquear itinerario"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
