/* eslint-disable react/prop-types */
/**
 * ItineraryLeadersModal — manage group leaders for a TourItinerary.
 *
 * Rules:
 *   - Only participants ASSIGNED to this itinerary can be leaders.
 *   - Saves via setItineraryLeaders (full replace).
 */
import { useState, useEffect } from "react";

function participantName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

function participantInitials(p) {
  return [p.firstName, p.firstSurname]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function ItineraryLeadersModal({
  isOpen,
  itinerary,
  onClose,
  onSave,
  saving,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen && itinerary) {
      setSelectedIds(new Set((itinerary.leaders || []).map((l) => l.id)));
      setSearch("");
    }
  }, [isOpen, itinerary?.id]);

  if (!isOpen || !itinerary) return null;

  const passengers = itinerary.participants || [];

  const filtered = search
    ? passengers.filter((p) => participantName(p).toLowerCase().includes(search.toLowerCase()))
    : passengers;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    await onSave(itinerary.id, Array.from(selectedIds));
  };

  const hasChanges = () => {
    const current = new Set((itinerary.leaders || []).map((l) => l.id));
    if (current.size !== selectedIds.size) return true;
    for (const id of selectedIds) if (!current.has(id)) return true;
    return false;
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] min-h-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Líderes del itinerario</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-700">🗓️ {itinerary.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Current leaders preview */}
          {selectedIds.size > 0 ? (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mr-0.5">Seleccionados:</span>
              {passengers
                .filter((p) => selectedIds.has(p.id))
                .map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-semibold"
                  >
                    {participantInitials(p)} {p.firstSurname}
                    <button
                      onClick={() => toggleSelect(p.id)}
                      className="ml-0.5 hover:text-blue-200 transition-colors"
                    >
                      ✕
                    </button>
                  </span>
                ))}
            </div>
          ) : (
            <p className="text-xs text-amber-600 mt-2 font-medium">
              Sin líderes seleccionados. Elegí al menos uno.
            </p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
          {passengers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-sm font-bold text-gray-900 mb-1">Sin pasajeros asignados</p>
              <p className="text-xs text-gray-500">
                Asigná pasajeros al itinerario para poder designar líderes.
              </p>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar pasajero…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />

              <div className="space-y-2">
                {filtered.map((p) => {
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
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
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSelected ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                        {participantInitials(p)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{participantName(p)}</p>
                        <p className="text-xs text-gray-500">
                          {p.identification}
                          {p.instrument && <span className="ml-2 text-gray-400">{p.instrument}</span>}
                        </p>
                      </div>
                      {isSelected && (
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
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
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-40 transition-all"
          >
            {saving
              ? "Guardando…"
              : `Guardar ${selectedIds.size} líder${selectedIds.size !== 1 ? "es" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
