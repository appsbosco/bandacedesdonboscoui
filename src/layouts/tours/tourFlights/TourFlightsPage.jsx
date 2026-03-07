/* eslint-disable react/prop-types */
/**
 * TourFlightsPage — 3-tab interface for tour flights management.
 *
 * Tabs:
 *   1. Itinerarios  — create/manage roundtrip itineraries, assign flights + passengers
 *   2. Vuelos       — all flights with itinerary info (edit/delete per flight)
 *   3. Sin asignar  — flights not yet in any itinerary, with CTA to assign
 */
import { useState } from "react";
import { useTourFlights } from "./useTourFlights";
import { useTourItineraries } from "./useTourItineraries";
import FlightCard from "./FlightCard";
import FlightFormModal from "./FlightFormModal";
import FlightDeleteModal from "./FlightDeleteModal";
import FlightPassengersModal from "./FlightPassengersModal";
import ItinerariesManager from "./ItinerariesManager";
import { Toast } from "../TourHelpers";

const TABS = [
  { id: "itineraries", label: "Itinerarios", emoji: "🗓️" },
  { id: "flights",     label: "Vuelos",       emoji: "✈️" },
  { id: "unassigned",  label: "Sin asignar",  emoji: "⚠️" },
];

export default function TourFlightsPage({ tourId, tourName }) {
  const [tab, setTab] = useState("itineraries");

  // ── Flights hook (individual CRUD + per-flight passenger management) ──────
  const {
    flights,
    outbound,
    inbound,
    connecting,
    loading: flightsLoading,
    error: flightsError,
    formModal,
    deleteModal,
    passengersModal,
    participantAssignments,
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
    toast: flightToast,
    setToast: setFlightToast,
  } = useTourFlights(tourId);

  // ── Itineraries hook (itinerary CRUD + assign flights + assign passengers) ─
  const itinerariesHook = useTourItineraries(tourId);
  const { unassignedFlights } = itinerariesHook;

  // Active toast: prefer itineraries toast over flights toast
  const activeToast = itinerariesHook.toast || flightToast;
  const clearToast = itinerariesHook.toast
    ? () => itinerariesHook.setToast(null)
    : () => setFlightToast(null);

  const totalItineraryPassengers = itinerariesHook.itineraries.reduce(
    (acc, it) => acc + (it.passengerCount || 0),
    0
  );

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
      <div className="grid grid-cols-2 gap-3">
        <StatCard value={flights.length} label="Total vuelos" />
        <StatCard value={itinerariesHook.itineraries.length} label="Itinerarios" color="text-blue-600" />
        <StatCard
          value={unassignedFlights.length}
          label="Sin asignar"
          color={unassignedFlights.length > 0 ? "text-amber-600" : "text-gray-400"}
        />
        <StatCard
          value={totalItineraryPassengers}
          label="Pasajeros asignados"
          color="text-emerald-600"
        />
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === t.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
            {t.id === "unassigned" && unassignedFlights.length > 0 && (
              <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {unassignedFlights.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {flightsLoading && flights.length === 0 ? (
        <LoadingSkeleton />
      ) : flightsError ? (
        <ErrorState message={flightsError.message} />
      ) : (
        <>
          {/* ── ITINERARIES TAB ── */}
          {tab === "itineraries" && (
            <ItinerariesManager
              tourId={tourId}
              itineraries={itinerariesHook.itineraries}
              unassignedFlights={unassignedFlights}
              itinerariesLoading={itinerariesHook.itinerariesLoading}
              formModal={itinerariesHook.formModal}
              openCreateModal={itinerariesHook.openCreateModal}
              openEditModal={itinerariesHook.openEditModal}
              closeFormModal={itinerariesHook.closeFormModal}
              handleSubmit={itinerariesHook.handleSubmit}
              creating={itinerariesHook.creating}
              updating={itinerariesHook.updating}
              handleDelete={itinerariesHook.handleDelete}
              assignFlightsModal={itinerariesHook.assignFlightsModal}
              openAssignFlightsModal={itinerariesHook.openAssignFlightsModal}
              closeAssignFlightsModal={itinerariesHook.closeAssignFlightsModal}
              handleAssignFlights={itinerariesHook.handleAssignFlights}
              assigningFlights={itinerariesHook.assigningFlights}
              assignPassengersModal={itinerariesHook.assignPassengersModal}
              openAssignPassengersModal={itinerariesHook.openAssignPassengersModal}
              closeAssignPassengersModal={itinerariesHook.closeAssignPassengersModal}
              handleAssignPassengers={itinerariesHook.handleAssignPassengers}
              handleRemovePassengers={itinerariesHook.handleRemovePassengers}
              assigningPassengers={itinerariesHook.assigningPassengers}
              removingPassengers={itinerariesHook.removingPassengers}
              assignResult={itinerariesHook.assignResult}
              setAssignResult={itinerariesHook.setAssignResult}
              leadersModal={itinerariesHook.leadersModal}
              openLeadersModal={itinerariesHook.openLeadersModal}
              closeLeadersModal={itinerariesHook.closeLeadersModal}
              handleSetLeaders={itinerariesHook.handleSetLeaders}
              settingLeaders={itinerariesHook.settingLeaders}
              handleUnassignFlight={itinerariesHook.handleUnassignFlight}
              toast={itinerariesHook.toast}
              setToast={itinerariesHook.setToast}
            />
          )}

          {/* ── FLIGHTS TAB ── */}
          {tab === "flights" && (
            <FlightsView
              flights={flights}
              outbound={outbound}
              inbound={inbound}
              connecting={connecting}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              onManagePassengers={openPassengersModal}
            />
          )}

          {/* ── UNASSIGNED TAB ── */}
          {tab === "unassigned" && (
            <UnassignedView
              flights={unassignedFlights}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              onGoToItineraries={() => setTab("itineraries")}
            />
          )}
        </>
      )}

      {/* ── Flight-level modals ── */}
      <FlightFormModal
        isOpen={formModal.open}
        mode={formModal.mode}
        flight={formModal.flight}
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
      {activeToast && (
        <Toast message={activeToast.message} type={activeToast.type} onClose={clearToast} />
      )}
    </div>
  );
}

/* ── Flights view ────────────────────────────────────────────────────────────── */

const FLIGHT_SECTIONS = [
  { key: "outbound",   label: "Vuelos de ida",   emoji: "🛫" },
  { key: "inbound",    label: "Vuelos de vuelta", emoji: "🛬" },
  { key: "connecting", label: "Conexiones",       emoji: "🔄" },
];

function FlightsView({ flights, outbound, inbound, connecting, onEdit, onDelete, onManagePassengers }) {
  const bySection = { outbound, inbound, connecting };

  if (flights.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-10 text-center">
        <p className="text-3xl mb-2">✈️</p>
        <p className="text-sm font-bold text-gray-900">Sin vuelos registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {FLIGHT_SECTIONS.map(({ key, label, emoji }) => {
        const sectionFlights = bySection[key];
        if (!sectionFlights || sectionFlights.length === 0) return null;
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
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onManagePassengers={onManagePassengers}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ── Unassigned view ─────────────────────────────────────────────────────────── */

function UnassignedView({ flights, onEdit, onDelete, onGoToItineraries }) {
  if (flights.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
        <p className="text-3xl mb-2">✅</p>
        <h3 className="text-sm font-bold text-emerald-800 mb-1">Todos los vuelos tienen itinerario</h3>
        <p className="text-xs text-emerald-600">
          Todos los vuelos están asignados a un itinerario de gira.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-xs text-amber-800">
          <strong>
            {flights.length} vuelo{flights.length !== 1 ? "s" : ""}
          </strong>{" "}
          sin itinerario. Usá la pestaña <strong>Itinerarios</strong> para crear uno y asignar vuelos.
        </p>
        <button
          onClick={onGoToItineraries}
          className="flex-shrink-0 text-xs font-bold text-amber-800 underline hover:no-underline"
        >
          Ir a Itinerarios →
        </button>
      </div>
      <div className="space-y-3">
        {flights.map((flight) => (
          <FlightCard
            key={flight.id}
            flight={flight}
            onEdit={onEdit}
            onDelete={onDelete}
            onManagePassengers={() => {}}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Utility components ───────────────────────────────────────────────────────── */

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
