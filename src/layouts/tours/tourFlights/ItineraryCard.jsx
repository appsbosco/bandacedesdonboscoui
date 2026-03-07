/* eslint-disable react/prop-types */
/**
 * ItineraryCard — displays a roundtrip TourItinerary.
 * Flights are grouped by direction (Ida / Conexión / Vuelta) for readability,
 * but they all belong to the same itinerary package.
 * Shows capacity bar and leader chips.
 */

const FLIGHT_DIR = {
  OUTBOUND:   { label: "Ida",       emoji: "🛫", badge: "bg-blue-50 text-blue-700 border-blue-100" },
  INBOUND:    { label: "Vuelta",    emoji: "🛬", badge: "bg-violet-50 text-violet-700 border-violet-100" },
  CONNECTING: { label: "Conexión",  emoji: "🔄", badge: "bg-amber-50 text-amber-700 border-amber-100" },
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit", month: "short",
  });
}

function participantInitials(p) {
  return [p.firstName, p.firstSurname]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function participantFullName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

function FlightRow({ flight, onUnassign }) {
  const dir = FLIGHT_DIR[flight.direction] || FLIGHT_DIR.OUTBOUND;
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 text-xs">
      <span className={`px-1.5 py-0.5 rounded-full font-semibold text-[10px] border ${dir.badge} flex-shrink-0`}>
        {dir.emoji} {dir.label}
      </span>
      <span className="font-bold text-gray-900">{flight.airline} {flight.flightNumber}</span>
      <span className="text-gray-500 min-w-0 truncate">{flight.origin}→{flight.destination}</span>
      <span className="text-gray-400 ml-auto flex-shrink-0">{formatDate(flight.departureAt)}</span>
      <button
        onClick={() => onUnassign(flight.id)}
        className="ml-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
        title="Quitar vuelo de este itinerario"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function CapacityBar({ current, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const remaining = Math.max(0, max - current);
  const isFull = remaining === 0;
  const isAlmostFull = !isFull && pct >= 80;

  const barColor = isFull
    ? "bg-red-500"
    : isAlmostFull
    ? "bg-amber-500"
    : "bg-emerald-500";

  const textColor = isFull
    ? "text-red-600"
    : isAlmostFull
    ? "text-amber-600"
    : "text-emerald-600";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          <strong className="text-gray-800">{current}</strong> / {max} pasajeros
        </span>
        <span className={`font-semibold ${textColor}`}>
          {isFull ? "Sin cupos" : `${remaining} cupo${remaining !== 1 ? "s" : ""} disponible${remaining !== 1 ? "s" : ""}`}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ItineraryCard({
  itinerary,
  onEdit,
  onDelete,
  onAssignFlights,
  onAssignPassengers,
  onManageLeaders,
  onUnassignFlight,
}) {
  const flights = itinerary.flights || [];
  const leaders = itinerary.leaders || [];

  // Group flights by direction for visual clarity
  const outbound   = flights.filter((f) => f.direction === "OUTBOUND");
  const connecting = flights.filter((f) => f.direction === "CONNECTING");
  const inbound    = flights.filter((f) => f.direction === "INBOUND");

  const passengerCount = itinerary.passengerCount || 0;
  const maxPassengers  = itinerary.maxPassengers ?? 60;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-amber-400 to-violet-500" />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">🗓️</span>
            <h3 className="text-sm font-bold text-gray-900 truncate">{itinerary.name}</h3>
          </div>
          {itinerary.notes && (
            <p className="text-xs text-gray-400 italic mt-0.5 line-clamp-1">{itinerary.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(itinerary)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
            title="Editar itinerario"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(itinerary)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
            title="Eliminar itinerario"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Capacity bar */}
      <div className="px-5 pb-3">
        <CapacityBar current={passengerCount} max={maxPassengers} />
      </div>

      {/* Leaders chips */}
      {leaders.length > 0 && (
        <div className="px-5 pb-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mr-0.5">
            Líderes:
          </span>
          {leaders.slice(0, 5).map((l) => (
            <span
              key={l.id}
              title={participantFullName(l)}
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-[9px] font-bold"
            >
              {participantInitials(l)}
            </span>
          ))}
          <span className="text-xs text-blue-700 font-medium">
            {leaders.map((l) => participantFullName(l)).join(", ")}
          </span>
        </div>
      )}
      {leaders.length === 0 && (
        <div className="px-5 pb-2">
          <span className="text-[10px] text-amber-600 font-medium">Sin líderes asignados</span>
        </div>
      )}

      {/* Flight direction stats */}
      <div className="px-5 pb-3 flex items-center gap-5 text-xs text-gray-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          {outbound.length > 0 && (
            <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
              🛫 {outbound.length} ida
            </span>
          )}
          {connecting.length > 0 && (
            <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-medium">
              🔄 {connecting.length} conexión
            </span>
          )}
          {inbound.length > 0 && (
            <span className="bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full font-medium">
              🛬 {inbound.length} vuelta
            </span>
          )}
          {flights.length === 0 && (
            <span className="text-gray-400">Sin vuelos</span>
          )}
        </div>
      </div>

      {/* Flights list */}
      {flights.length > 0 && (
        <div className="px-5 pb-3 space-y-1.5">
          {[...outbound, ...connecting, ...inbound].map((flight) => (
            <FlightRow
              key={flight.id}
              flight={flight}
              onUnassign={(fid) => onUnassignFlight(itinerary.id, fid)}
            />
          ))}
        </div>
      )}

      {flights.length === 0 && (
        <div className="px-5 pb-3">
          <div className="px-3 py-2.5 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
            <p className="text-xs text-gray-400">Sin vuelos asignados</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-5 pb-5 flex gap-2 flex-wrap">
        <button
          onClick={() => onAssignFlights(itinerary)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Vuelos
        </button>
        <button
          onClick={() => onManageLeaders(itinerary)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-blue-700 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Líderes
        </button>
        <button
          onClick={() => onAssignPassengers(itinerary)}
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
