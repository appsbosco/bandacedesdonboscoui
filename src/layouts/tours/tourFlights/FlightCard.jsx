/* eslint-disable react/prop-types */
/**
 * FlightCard — tarjeta individual de un vuelo.
 */

const DIRECTION_CONFIG = {
  OUTBOUND: { label: "Ida", emoji: "🛫", className: "bg-blue-50 text-blue-700 border-blue-100" },
  INBOUND: { label: "Vuelta", emoji: "🛬", className: "bg-violet-50 text-violet-700 border-violet-100" },
  CONNECTING: { label: "Conexión", emoji: "🔄", className: "bg-amber-50 text-amber-700 border-amber-100" },
};

function formatDatetime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function flightDuration(dep, arr) {
  if (!dep || !arr) return null;
  const mins = Math.round((new Date(arr) - new Date(dep)) / 60000);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
}

export default function FlightCard({ flight, onEdit, onDelete, onManagePassengers }) {
  const dir = DIRECTION_CONFIG[flight.direction] || DIRECTION_CONFIG.OUTBOUND;
  const duration = flightDuration(flight.departureAt, flight.arrivalAt);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${dir.className}`}
          >
            <span>{dir.emoji}</span>
            <span>{dir.label}</span>
          </span>
          <span className="text-sm font-bold text-gray-900">
            {flight.airline}
          </span>
          <span className="text-sm text-gray-400 font-mono">
            {flight.flightNumber}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(flight)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
            title="Editar vuelo"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(flight)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
            title="Eliminar vuelo"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Route visualization */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-2xl font-black text-gray-900 tracking-tight">{flight.origin}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatTime(flight.departureAt)}</p>
            <p className="text-xs text-gray-400">{formatDate(flight.departureAt)}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0 px-2">
            {duration && (
              <span className="text-xs text-gray-400 font-medium">{duration}</span>
            )}
            <div className="w-full flex items-center gap-1">
              <div className="w-2 h-2 rounded-full border-2 border-gray-300 flex-shrink-0" />
              <div className="flex-1 h-px bg-gray-200" />
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-gray-900 tracking-tight">{flight.destination}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatTime(flight.arrivalAt)}</p>
            <p className="text-xs text-gray-400">{formatDate(flight.arrivalAt)}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {flight.notes && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-500 italic line-clamp-2">{flight.notes}</p>
        </div>
      )}

      {/* Footer: passengers */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <button
          onClick={() => onManagePassengers(flight)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 transition-all group"
        >
          <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-800">
            {flight.passengerCount || 0} pasajero{(flight.passengerCount || 0) !== 1 ? "s" : ""}
          </span>
          <svg className="w-3 h-3 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {flight.updatedBy && (
          <p className="text-xs text-gray-400">
            Editado por {flight.updatedBy.name}
          </p>
        )}
      </div>
    </div>
  );
}
