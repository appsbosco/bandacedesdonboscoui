/* eslint-disable react/prop-types */
/**
 * AssignFlightsToItineraryModal — multi-select unassigned flights to add to an itinerary.
 * Selected flights are previewed grouped by direction (Ida / Conexión / Vuelta)
 * but all go into the SAME roundtrip itinerary.
 */
import { useState, useEffect } from "react";

const DIR = {
  OUTBOUND:   { label: "Ida",       emoji: "🛫", badge: "bg-blue-50 text-blue-700 border-blue-100" },
  CONNECTING: { label: "Conexión",  emoji: "🔄", badge: "bg-amber-50 text-amber-700 border-amber-100" },
  INBOUND:    { label: "Vuelta",    emoji: "🛬", badge: "bg-violet-50 text-violet-700 border-violet-100" },
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", { day: "2-digit", month: "short" });
}

function DirectionPreview({ label, emoji, flights }) {
  if (flights.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        {emoji} {label} ({flights.length})
      </p>
      <div className="space-y-1">
        {flights.map((f) => (
          <div key={f.id} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-2 py-1">
            <span className="font-semibold text-gray-900">{f.airline} {f.flightNumber}</span>
            <span className="text-gray-400">{f.origin}→{f.destination}</span>
            <span className="ml-auto text-gray-400 flex-shrink-0">{formatDate(f.departureAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AssignFlightsToItineraryModal({
  isOpen,
  itinerary,
  unassignedFlights = [],
  onClose,
  onAssign,
  loading,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    if (isOpen) setSelectedIds(new Set());
  }, [isOpen, itinerary?.id]);

  if (!isOpen || !itinerary) return null;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(unassignedFlights.map((f) => f.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleApply = async () => {
    if (selectedIds.size === 0) return;
    await onAssign(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  // Preview of selected flights grouped by direction
  const selected = unassignedFlights.filter((f) => selectedIds.has(f.id));
  const previewOutbound   = selected.filter((f) => f.direction === "OUTBOUND");
  const previewConnecting = selected.filter((f) => f.direction === "CONNECTING");
  const previewInbound    = selected.filter((f) => f.direction === "INBOUND");
  const hasPreview = selected.length > 0;

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] min-h-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Asignar vuelos al itinerario</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-700">🗓️ {itinerary.name}</span>
                {" · "}Seleccioná ida <strong>y</strong> vuelta
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Flights already in this itinerary */}
          {(itinerary.flights || []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {itinerary.flights.map((f) => {
                const dir = DIR[f.direction] || DIR.OUTBOUND;
                return (
                  <span
                    key={f.id}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${dir.badge}`}
                  >
                    {dir.emoji} {f.airline} {f.flightNumber} · {f.origin}→{f.destination}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">
          {/* Available unassigned flights */}
          {unassignedFlights.length > 0 ? (
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Sin asignar ({unassignedFlights.length})
                </p>
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <button
                      onClick={clearSelection}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      Limpiar
                    </button>
                  )}
                  <button
                    onClick={selectAll}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Seleccionar todos
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {unassignedFlights.map((flight) => {
                  const isSelected = selectedIds.has(flight.id);
                  const dir = DIR[flight.direction] || DIR.OUTBOUND;
                  return (
                    <div
                      key={flight.id}
                      onClick={() => toggleSelect(flight.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50 border-blue-300"
                          : "bg-gray-50 border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                          isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${dir.badge}`}>
                        {dir.emoji} {dir.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                          {flight.airline} {flight.flightNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {flight.origin}→{flight.destination} · {formatDate(flight.departureAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <p className="text-2xl mb-1">✅</p>
              <p className="text-sm text-gray-500">No hay vuelos sin asignar.</p>
            </div>
          )}

          {/* Preview of selected flights grouped by direction */}
          {hasPreview && (
            <section className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Vista previa ({selected.length} vuelo{selected.length !== 1 ? "s" : ""})
              </p>
              <DirectionPreview label="Ida" emoji="🛫" flights={previewOutbound} />
              <DirectionPreview label="Conexión" emoji="🔄" flights={previewConnecting} />
              <DirectionPreview label="Vuelta" emoji="🛬" flights={previewInbound} />
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t border-gray-100 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={selectedIds.size === 0 || loading}
            className="flex-1 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm disabled:opacity-40 transition-all"
          >
            {loading
              ? "Asignando…"
              : selectedIds.size > 0
              ? `Asignar ${selectedIds.size} vuelo${selectedIds.size !== 1 ? "s" : ""}`
              : "Seleccioná vuelos"}
          </button>
        </div>
      </div>
    </div>
  );
}
