/* eslint-disable react/prop-types */
/**
 * ItineraryPassengersModal — assign / remove participants from a TourItinerary.
 *
 * Business rules:
 *   - One itinerary per participant per TOUR (exclusivity).
 *   - Capacity hard limit: cannot select more than seatsRemaining.
 *   - Blocked participants (in another itinerary) shown with their itinerary name.
 *   - Result banner differentiates ALREADY_ASSIGNED vs CAPACITY_EXCEEDED conflicts.
 */
import { useState, useEffect, useMemo } from "react";
import { useQuery, gql } from "@apollo/client";

const GET_TOUR_PARTICIPANTS_MODAL = gql`
  query GetTourParticipantsItineraryModal($tourId: ID!) {
    getTourParticipants(tourId: $tourId) {
      id
      firstName
      firstSurname
      secondSurname
      identification
      instrument
    }
  }
`;

function participantName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

export default function ItineraryPassengersModal({
  isOpen,
  itinerary,
  allItineraries = [],
  tourId,
  onClose,
  onAssign,
  onRemove,
  applying,
  result,
  onClearResult,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [instrumentFilter, setInstrumentFilter] = useState("all");
  const [tab, setTab] = useState("add"); // "add" | "remove"

  const { data, loading } = useQuery(GET_TOUR_PARTICIPANTS_MODAL, {
    variables: { tourId },
    skip: !isOpen || !tourId,
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setSearch("");
      setInstrumentFilter("all");
      setTab("add");
    }
  }, [isOpen, itinerary?.id]);

  if (!isOpen || !itinerary) return null;

  const allParticipants = data?.getTourParticipants || [];

  // Capacity
  const maxPassengers  = itinerary.maxPassengers ?? 60;
  const passengerCount = itinerary.passengerCount || 0;
  const seatsRemaining = Math.max(0, maxPassengers - passengerCount);
  const isFull = seatsRemaining === 0;

  // Participants already in THIS itinerary
  const inThisItineraryIds = new Set((itinerary.participants || []).map((p) => p.id));

  // Participants in a DIFFERENT itinerary in this tour (blocked)
  const otherItineraries = allItineraries.filter((it) => it.id !== itinerary.id);
  const inOtherItineraryMap = new Map();
  for (const it of otherItineraries) {
    for (const p of it.participants || []) {
      if (!inOtherItineraryMap.has(p.id)) {
        inOtherItineraryMap.set(p.id, it.name);
      }
    }
  }

  const available = allParticipants.filter(
    (p) => !inThisItineraryIds.has(p.id) && !inOtherItineraryMap.has(p.id)
  );
  const inOtherItinerary = allParticipants.filter((p) => inOtherItineraryMap.has(p.id));
  const assigned = itinerary.participants || [];

  // Collect unique instruments from the relevant list per tab
  const instrumentsInScope = tab === "add" ? available : assigned;
  const uniqueInstruments = useMemo(() => {
    const set = new Set(
      instrumentsInScope
        .map((p) => p.instrument)
        .filter(Boolean)
    );
    return Array.from(set).sort();
  }, [instrumentsInScope]);

  // Filtering helper: applies both search and instrument filter
  const applyFilters = (list) =>
    list.filter((p) => {
      const matchesSearch =
        !search || participantName(p).toLowerCase().includes(search.toLowerCase());
      const matchesInstrument =
        instrumentFilter === "all" || p.instrument === instrumentFilter;
      return matchesSearch && matchesInstrument;
    });

  const filteredAvailable = applyFilters(available);
  const filteredAssigned  = applyFilters(assigned);

  const toggleSelect = (id) => {
    if (tab === "add") {
      // Enforce capacity limit when adding
      if (!selectedIds.has(id) && selectedIds.size >= seatsRemaining) return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (tab === "add") {
      // Only select up to seatsRemaining from the currently filtered list
      const slice = filteredAvailable.slice(0, seatsRemaining);
      setSelectedIds(new Set(slice.map((p) => p.id)));
    } else {
      setSelectedIds(new Set(filteredAssigned.map((p) => p.id)));
    }
  };
  const clearSelection = () => setSelectedIds(new Set());

  const handleApply = async () => {
    if (selectedIds.size === 0) return;
    if (tab === "add") {
      await onAssign(Array.from(selectedIds));
    } else {
      await onRemove(itinerary.id, Array.from(selectedIds));
    }
    setSelectedIds(new Set());
  };

  // Conflicts breakdown for result banner
  const capacityConflicts = (result?.conflicts || []).filter((c) => c.reason === "CAPACITY_EXCEEDED");
  const assignConflicts   = (result?.conflicts || []).filter((c) => c.reason === "ALREADY_ASSIGNED");

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
              <h3 className="text-base font-bold text-slate-900">Pasajeros del itinerario</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-700">🗓️ {itinerary.name}</span>
                {" · "}Ida + Vuelta
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Capacity indicator */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">
                <strong>{passengerCount}</strong> / {maxPassengers} pasajeros asignados
              </span>
              <span className={`font-bold ${isFull ? "text-red-600" : "text-emerald-600"}`}>
                {isFull ? "Sin cupos" : `${seatsRemaining} cupo${seatsRemaining !== 1 ? "s" : ""} disponible${seatsRemaining !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isFull ? "bg-red-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, Math.round((passengerCount / maxPassengers) * 100))}%` }}
              />
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Pill color="blue" label={`${available.length} disponible${available.length !== 1 ? "s" : ""}`} />
            {inThisItineraryIds.size > 0 && (
              <Pill color="emerald" label={`${inThisItineraryIds.size} asignado${inThisItineraryIds.size !== 1 ? "s" : ""}`} />
            )}
            {inOtherItinerary.length > 0 && (
              <Pill color="amber" label={`${inOtherItinerary.length} en otro itinerario`} />
            )}
          </div>

          {/* Live selection counter (add tab only) */}
          {tab === "add" && selectedIds.size > 0 && (
            <div className="mt-2 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg px-3 py-1.5">
              {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              {" · "}
              {seatsRemaining - selectedIds.size} cupo{(seatsRemaining - selectedIds.size) !== 1 ? "s" : ""} restante{(seatsRemaining - selectedIds.size) !== 1 ? "s" : ""}
            </div>
          )}

          {/* Full capacity warning */}
          {tab === "add" && isFull && (
            <div className="mt-2 text-xs font-semibold text-red-700 bg-red-50 rounded-lg px-3 py-1.5">
              Este itinerario está completo. No se pueden asignar más pasajeros.
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit mt-3">
            {[
              { id: "add",    label: "Agregar" },
              { id: "remove", label: "Remover" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSelectedIds(new Set()); setInstrumentFilter("all"); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === t.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Result banner */}
        {result && (
          <div
            className={`mx-6 mt-4 p-4 rounded-2xl border text-xs flex-shrink-0 ${
              (result.conflicts || []).length > 0
                ? "bg-amber-50 border-amber-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <p className="font-bold text-gray-800 mb-1">Resultado</p>
            {result.assigned > 0 && (
              <p className="text-gray-600">✓ {result.assigned} asignado{result.assigned !== 1 ? "s" : ""}</p>
            )}
            {result.removed > 0 && (
              <p className="text-gray-600">✓ {result.removed} removido{result.removed !== 1 ? "s" : ""}</p>
            )}
            {result.seatsRemaining !== undefined && (
              <p className="text-gray-500 mt-1">
                Cupos disponibles: <strong>{result.seatsRemaining}</strong> / {result.maxPassengers}
              </p>
            )}
            {capacityConflicts.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-red-700 font-semibold">Sin cupo ({capacityConflicts.length}):</p>
                {capacityConflicts.map((c, i) => (
                  <p key={`cap-${c.participantId}-${i}`} className="text-red-600">
                    ✗ {c.participantName}
                  </p>
                ))}
              </div>
            )}
            {assignConflicts.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-amber-700 font-semibold">En otro itinerario ({assignConflicts.length}):</p>
                {assignConflicts.map((c, i) => (
                  <p key={`asgn-${c.participantId}-${i}`} className="text-amber-700">
                    ⚠ <strong>{c.participantName}</strong> — &ldquo;{c.conflictingItinerary}&rdquo;
                  </p>
                ))}
              </div>
            )}
            <button
              onClick={onClearResult}
              className="mt-2 text-gray-400 hover:text-gray-600 underline"
            >
              Cerrar aviso
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Search + Instrument filter */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar participante…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />

                {uniqueInstruments.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setInstrumentFilter("all")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        instrumentFilter === "all"
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
                      }`}
                    >
                      Todos
                    </button>
                    {uniqueInstruments.map((inst) => (
                      <button
                        key={inst}
                        onClick={() => setInstrumentFilter(inst === instrumentFilter ? "all" : inst)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                          instrumentFilter === inst
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
                        }`}
                      >
                        🎵 {inst}
                      </button>
                    ))}
                  </div>
                )}

                {/* Active filter summary */}
                {(search || instrumentFilter !== "all") && (
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {tab === "add" ? filteredAvailable.length : filteredAssigned.length} resultado{(tab === "add" ? filteredAvailable.length : filteredAssigned.length) !== 1 ? "s" : ""}
                      {instrumentFilter !== "all" && <span className="ml-1 text-gray-500 font-medium">· {instrumentFilter}</span>}
                    </span>
                    <button
                      onClick={() => { setSearch(""); setInstrumentFilter("all"); }}
                      className="text-gray-400 hover:text-gray-600 underline"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>

              {/* ADD tab */}
              {tab === "add" && (
                <>
                  {filteredAvailable.length > 0 && !isFull ? (
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <SectionHeader label="Disponibles" count={filteredAvailable.length} />
                        <div className="flex items-center gap-2">
                          {selectedIds.size > 0 && (
                            <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600 underline">
                              Deseleccionar
                            </button>
                          )}
                          {seatsRemaining > 0 && (
                            <button onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                              Todos (hasta {seatsRemaining})
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {filteredAvailable.map((p) => {
                          const isSelected = selectedIds.has(p.id);
                          const isDisabled = !isSelected && selectedIds.size >= seatsRemaining;
                          return (
                            <ParticipantRow
                              key={p.id}
                              participant={p}
                              selected={isSelected}
                              disabled={isDisabled}
                              onToggle={() => toggleSelect(p.id)}
                            />
                          );
                        })}
                      </div>
                    </section>
                  ) : (
                    <div className={`border rounded-2xl p-4 text-center ${isFull ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"}`}>
                      <p className={`text-xs font-medium ${isFull ? "text-red-700" : "text-blue-700"}`}>
                        {isFull
                          ? "Itinerario completo. Sin cupos disponibles."
                          : search || instrumentFilter !== "all"
                          ? "No hay resultados para los filtros aplicados."
                          : inThisItineraryIds.size > 0
                          ? "✓ Todos los participantes disponibles ya están en este itinerario."
                          : "No hay participantes disponibles."}
                      </p>
                    </div>
                  )}

                  {/* Blocked by another itinerary */}
                  {inOtherItinerary.length > 0 && (
                    <section>
                      <SectionHeader
                        label="Ya en otro itinerario"
                        count={inOtherItinerary.length}
                        subtitle="Están asignados a otro itinerario de esta gira"
                      />
                      <div className="space-y-2">
                        {inOtherItinerary.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-2xl opacity-80">
                            <Avatar participant={p} color="amber" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{participantName(p)}</p>
                              <p className="text-xs text-amber-700">{inOtherItineraryMap.get(p.id)}</p>
                            </div>
                            <span className="text-xs text-amber-600 font-semibold px-2 py-1 bg-amber-100 rounded-lg flex-shrink-0">
                              Bloqueado
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}

              {/* REMOVE tab */}
              {tab === "remove" && (
                <>
                  {filteredAssigned.length > 0 ? (
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <SectionHeader label="Asignados" count={filteredAssigned.length} />
                        {selectedIds.size > 0 && (
                          <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600 underline">
                            Deseleccionar
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {filteredAssigned.map((p) => (
                          <ParticipantRow
                            key={p.id}
                            participant={p}
                            selected={selectedIds.has(p.id)}
                            onToggle={() => toggleSelect(p.id)}
                            removeMode
                          />
                        ))}
                      </div>
                    </section>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-xs text-gray-400">
                        {search || instrumentFilter !== "all"
                          ? "No hay resultados para los filtros aplicados."
                          : "Este itinerario no tiene pasajeros asignados."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex-shrink-0 border-t border-gray-100 pt-4 space-y-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleApply}
              disabled={applying}
              className={`w-full py-2.5 rounded-2xl font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 ${
                tab === "add"
                  ? "bg-gray-900 hover:bg-gray-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {applying
                ? "Procesando…"
                : tab === "add"
                ? `Asignar ${selectedIds.size} a este itinerario`
                : `Remover ${selectedIds.size} de este itinerario`}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Internal components ───────────────────────────────────────────────────────

function ParticipantRow({ participant, selected, onToggle, removeMode = false, disabled = false }) {
  return (
    <div
      onClick={disabled ? undefined : onToggle}
      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
        disabled
          ? "bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed"
          : selected
          ? removeMode
            ? "bg-red-50 border-red-300 cursor-pointer"
            : "bg-blue-50 border-blue-300 cursor-pointer"
          : "bg-gray-50 border-gray-100 hover:border-gray-200 cursor-pointer"
      }`}
    >
      <div
        className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all ${
          selected
            ? removeMode
              ? "bg-red-600 border-red-600"
              : "bg-blue-600 border-blue-600"
            : "border-gray-300"
        }`}
      >
        {selected && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <Avatar participant={participant} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {[participant.firstName, participant.firstSurname, participant.secondSurname]
            .filter(Boolean)
            .join(" ")}
        </p>
        <p className="text-xs text-gray-500">
          {participant.identification}
          {participant.instrument && (
            <span className="ml-2 text-gray-400">{participant.instrument}</span>
          )}
        </p>
      </div>
    </div>
  );
}

function Avatar({ participant, color = "gray" }) {
  const colors = {
    gray:  "bg-gray-200 text-gray-600",
    amber: "bg-amber-200 text-amber-800",
    blue:  "bg-blue-200 text-blue-800",
  };
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colors[color] || colors.gray}`}>
      {[participant.firstName, participant.firstSurname]
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()}
    </div>
  );
}

function Pill({ color, label }) {
  const styles = {
    blue:    "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber:   "bg-amber-100 text-amber-700",
    gray:    "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[color]}`}>{label}</span>
  );
}

function SectionHeader({ label, count, subtitle }) {
  return (
    <div className="mb-2">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
        {label}
        {count !== undefined && <span className="text-gray-300 font-normal">({count})</span>}
      </h4>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}