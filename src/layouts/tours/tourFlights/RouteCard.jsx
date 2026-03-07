/* eslint-disable react/prop-types */
/**
 * RouteCard — displays a single TourRoute with its flights and actions.
 */

const DIRECTION_CONFIG = {
  OUTBOUND: { label: "Ida", emoji: "🛫", badge: "bg-blue-50 text-blue-700 border-blue-100", bar: "bg-blue-500" },
  INBOUND:  { label: "Vuelta", emoji: "🛬", badge: "bg-violet-50 text-violet-700 border-violet-100", bar: "bg-violet-500" },
};

const FLIGHT_DIR = {
  OUTBOUND:   { emoji: "🛫", className: "bg-blue-50 text-blue-700" },
  INBOUND:    { emoji: "🛬", className: "bg-violet-50 text-violet-700" },
  CONNECTING: { emoji: "🔄", className: "bg-amber-50 text-amber-700" },
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function RouteCard({
  route,
  onEdit,
  onDelete,
  onAssignFlights,
  onAssignPassengers,
  onUnassignFlight,
}) {
  const dir = DIRECTION_CONFIG[route.direction] || DIRECTION_CONFIG.OUTBOUND;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Top accent bar */}
      <div className={`h-1 ${dir.bar}`} />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${dir.badge}`}>
            {dir.emoji} {dir.label}
          </span>
          <h3 className="text-sm font-bold text-gray-900 truncate">{route.name}</h3>
          {(route.origin || route.destination) && (
            <span className="text-xs text-gray-400 font-medium">
              {route.origin && route.destination
                ? `${route.origin} → ${route.destination}`
                : route.origin || route.destination}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(route)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
            title="Editar ruta"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(route)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
            title="Eliminar ruta"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notes */}
      {route.notes && (
        <p className="px-5 pb-2 text-xs text-gray-500 italic">{route.notes}</p>
      )}

      {/* Stats row */}
      <div className="px-5 pb-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <strong className="text-gray-700">{route.flights?.length || 0}</strong> vuelo{(route.flights?.length || 0) !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <strong className="text-emerald-700">{route.passengerCount || 0}</strong> pasajero{(route.passengerCount || 0) !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Flights list */}
      {route.flights && route.flights.length > 0 && (
        <div className="px-5 pb-3 space-y-1.5">
          {route.flights.map((flight) => {
            const fd = FLIGHT_DIR[flight.direction] || FLIGHT_DIR.OUTBOUND;
            return (
              <div
                key={flight.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 text-xs"
              >
                <span className={`px-1.5 py-0.5 rounded-full font-semibold text-[10px] ${fd.className}`}>
                  {fd.emoji}
                </span>
                <span className="font-bold text-gray-900">{flight.airline} {flight.flightNumber}</span>
                <span className="text-gray-500">{flight.origin}→{flight.destination}</span>
                <span className="text-gray-400 ml-auto">{formatDate(flight.departureAt)}</span>
                <button
                  onClick={() => onUnassignFlight(route.id, flight.id)}
                  className="ml-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Quitar vuelo de esta ruta"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty flights state */}
      {(!route.flights || route.flights.length === 0) && (
        <div className="px-5 pb-3">
          <div className="px-3 py-2.5 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
            <p className="text-xs text-gray-400">Sin vuelos asignados</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={() => onAssignFlights(route)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Vuelos
        </button>
        <button
          onClick={() => onAssignPassengers(route)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Pasajeros
        </button>
      </div>
    </div>
  );
}
