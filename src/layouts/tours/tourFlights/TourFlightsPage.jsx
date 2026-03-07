/* eslint-disable react/prop-types */
/**
 * TourFlightsPage — gestión de vuelos de una gira.
 * Vista principal: vuelos agrupados por routeGroup con asignación masiva por ruta.
 * Vista secundaria: agrupación por dirección (vuelos de ida/vuelta/conexión).
 */
import { useState } from "react";
import { useTourFlights } from "./useTourFlights";
import FlightCard from "./FlightCard";
import FlightFormModal from "./FlightFormModal";
import FlightDeleteModal from "./FlightDeleteModal";
import FlightPassengersModal from "./FlightPassengersModal";
import RoutePassengersModal from "./RoutePassengersModal";
import { Toast } from "../TourHelpers";

const DIRECTION_SECTIONS = [
  { key: "outbound", label: "Vuelos de ida", emoji: "🛫", flightsKey: "outbound" },
  { key: "inbound", label: "Vuelos de vuelta", emoji: "🛬", flightsKey: "inbound" },
  { key: "connecting", label: "Conexiones", emoji: "🔄", flightsKey: "connecting" },
];

const VIEWS = [
  { id: "routes", label: "Por ruta", emoji: "🔗" },
  { id: "direction", label: "Por dirección", emoji: "🛫" },
];

export default function TourFlightsPage({ tourId, tourName }) {
  const [view, setView] = useState("routes");

  const {
    flights,
    outbound,
    inbound,
    connecting,
    totalPassengers,
    routeGroups,
    flightsByRouteGroup,
    participantAssignments,
    loading,
    error,
    formModal,
    deleteModal,
    passengersModal,
    routeModal,
    routeResult,
    openCreateModal,
    openEditModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
    openPassengersModal,
    closePassengersModal,
    openRouteModal,
    closeRouteModal,
    handleSubmit,
    handleDelete,
    handleAssignPassenger,
    handleAssignPassengers,
    handleRemovePassenger,
    handleAssignRoutePassengers,
    creating,
    updating,
    deleting,
    assigning,
    assigningBulk,
    removing,
    routeAssigning,
    toast,
    setToast,
    setRouteResult,
    ROUTE_NONE_KEY,
  } = useTourFlights(tourId);

  const flightsBySection = { outbound, inbound, connecting };

  return (
    <div className="space-y-5">
      {/* Sub-header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">Vuelos de la gira</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Gestioná el itinerario aéreo de{" "}
            <span className="font-semibold">{tourName}</span>
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

      {/* View switcher */}
      {flights.length > 0 && (
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === v.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{v.emoji}</span>
              <span>{v.label}</span>
            </button>
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
      ) : view === "routes" ? (
        <RouteView
          flightsByRouteGroup={flightsByRouteGroup}
          routeGroups={routeGroups}
          ROUTE_NONE_KEY={ROUTE_NONE_KEY}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onManagePassengers={openPassengersModal}
          onAssignRoute={openRouteModal}
        />
      ) : (
        <DirectionView
          flightsBySection={flightsBySection}
          DIRECTION_SECTIONS={DIRECTION_SECTIONS}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onManagePassengers={openPassengersModal}
        />
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

      <RoutePassengersModal
        isOpen={routeModal.open}
        routeGroup={routeModal.routeGroup}
        flights={routeModal.flights}
        tourId={tourId}
        participantAssignments={participantAssignments}
        onClose={closeRouteModal}
        onApply={handleAssignRoutePassengers}
        applying={routeAssigning}
        result={routeResult}
        onClearResult={() => setRouteResult(null)}
      />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ── Route view ─────────────────────────────────────────────────────────────── */

function RouteView({
  flightsByRouteGroup,
  routeGroups,
  ROUTE_NONE_KEY,
  onEdit,
  onDelete,
  onManagePassengers,
  onAssignRoute,
}) {
  // Show named routes first, then "Sin ruta"
  const namedRoutes = routeGroups;
  const hasNoRoute = flightsByRouteGroup.has(ROUTE_NONE_KEY);

  const renderRouteSection = (key, label, isNamed) => {
    const sectionFlights = flightsByRouteGroup.get(key) || [];
    if (sectionFlights.length === 0) return null;

    const totalPassengersInRoute = sectionFlights.reduce(
      (acc, f) => acc + (f.passengerCount || 0),
      0
    );

    return (
      <section key={key} className="space-y-3">
        {/* Route header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {isNamed ? "🔗" : "—"}
            </span>
            <h3 className="text-sm font-bold text-gray-900">{label}</h3>
            <span className="text-xs text-gray-400">
              · {sectionFlights.length} vuelo{sectionFlights.length !== 1 ? "s" : ""}
            </span>
            {totalPassengersInRoute > 0 && (
              <span className="text-xs text-emerald-600 font-semibold">
                · {totalPassengersInRoute} asignación{totalPassengersInRoute !== 1 ? "es" : ""}
              </span>
            )}
          </div>
          {isNamed && (
            <button
              onClick={() => onAssignRoute(key, sectionFlights)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Asignar pasajeros a ruta
            </button>
          )}
        </div>

        {/* Flights in this route */}
        <div className="space-y-3 pl-0">
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
  };

  return (
    <div className="space-y-8">
      {namedRoutes.map((rg) => renderRouteSection(rg, rg, true))}
      {hasNoRoute && renderRouteSection(ROUTE_NONE_KEY, "Sin ruta", false)}
    </div>
  );
}

/* ── Direction view (legacy) ─────────────────────────────────────────────────── */

function DirectionView({ flightsBySection, DIRECTION_SECTIONS, onEdit, onDelete, onManagePassengers }) {
  return (
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

/* ── Utility components ────────────────────────────────────────────────────────── */

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
        Todavía no hay vuelos para{" "}
        <span className="font-semibold">{tourName}</span>.
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
