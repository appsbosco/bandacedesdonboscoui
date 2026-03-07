/* eslint-disable react/prop-types */
/**
 * RoutePassengersModal — asignación masiva de pasajeros a una RUTA completa.
 * Permite elegir participantes una vez y aplicar a todos los vuelos del routeGroup.
 * Muestra el resultado agregado (assigned/skipped/conflicts) por vuelo.
 */
import { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";

const GET_TOUR_PARTICIPANTS_FOR_ROUTE = gql`
  query GetTourParticipantsForRoute($tourId: ID!) {
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

export default function RoutePassengersModal({
  isOpen,
  routeGroup,       // string | null
  flights,          // TourFlight[] — all flights in this routeGroup
  tourId,
  participantAssignments, // Map: participantId → { flightLabel, routeGroup, flightId }
  onClose,
  onApply,          // async (participantIds) → { assigned, skipped, conflicts[] }
  applying,
  result,           // last aggregated result { assigned, skipped, conflicts[], perFlight[] }
  onClearResult,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState("");

  const { data, loading } = useQuery(GET_TOUR_PARTICIPANTS_FOR_ROUTE, {
    variables: { tourId },
    skip: !isOpen || !tourId,
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setSearch("");
    }
  }, [isOpen, routeGroup]);

  if (!isOpen || !flights) return null;

  const allParticipants = data?.getTourParticipants || [];

  // Participants already in THIS route (any flight of this group)
  const inThisRouteIds = new Set(
    flights.flatMap((f) => (f.passengers || []).map((p) => p.participant.id))
  );

  // Participants in a DIFFERENT route
  const inOtherRouteIds = new Set(
    [...participantAssignments.entries()]
      .filter(([, info]) => info.routeGroup !== routeGroup)
      .map(([pid]) => pid)
  );

  const free = allParticipants.filter(
    (p) => !inThisRouteIds.has(p.id) && !inOtherRouteIds.has(p.id)
  );
  const inOtherRoute = allParticipants.filter((p) => inOtherRouteIds.has(p.id));

  const filteredFree = search
    ? free.filter((p) => participantName(p).toLowerCase().includes(search.toLowerCase()))
    : free;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(free.map((p) => p.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleApply = async () => {
    if (selectedIds.size === 0) return;
    await onApply(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const routeLabel = routeGroup || "Sin ruta";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] min-h-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Asignar pasajeros a ruta</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-700">🔗 {routeLabel}</span>
                {" · "}
                {flights.length} vuelo{flights.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Flights in route */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {flights.map((f) => (
              <span
                key={f.id}
                className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium"
              >
                {f.airline} {f.flightNumber} · {f.origin}→{f.destination}
              </span>
            ))}
          </div>

          {/* Stat pills */}
          <div className="flex items-center gap-3 mt-3">
            <Pill
              color="blue"
              label={`${free.length} disponible${free.length !== 1 ? "s" : ""}`}
            />
            {inThisRouteIds.size > 0 && (
              <Pill color="emerald" label={`${inThisRouteIds.size} ya en ruta`} />
            )}
            {inOtherRoute.length > 0 && (
              <Pill color="amber" label={`${inOtherRoute.length} en otra ruta`} />
            )}
          </div>
        </div>

        {/* Aggregated result banner */}
        {result && (
          <div
            className={`mx-6 mt-4 p-4 rounded-2xl border text-xs flex-shrink-0 ${
              result.conflicts.length > 0
                ? "bg-amber-50 border-amber-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <p className="font-bold text-gray-800 mb-1">Resultado de asignación a ruta</p>
            <p className="text-gray-600">
              ✓ {result.assigned} asignado{result.assigned !== 1 ? "s" : ""} en{" "}
              {flights.length} vuelo{flights.length !== 1 ? "s" : ""}
              {result.skipped > 0 && (
                <span className="text-gray-400 ml-2">· {result.skipped} omitido{result.skipped !== 1 ? "s" : ""}</span>
              )}
              {result.conflicts.length > 0 && (
                <span className="text-amber-700 ml-2">
                  · {result.conflicts.length} con conflicto
                </span>
              )}
            </p>
            {result.conflicts.length > 0 && (
              <div className="mt-2 space-y-1">
                {result.conflicts.map((c, idx) => (
                  <p key={`${c.participantId}-${idx}`} className="text-amber-700">
                    ⚠ <strong>{c.participantName}</strong>{" "}
                    {c.conflictingFlight && (
                      <span>
                        — ya está en {c.conflictingFlight}
                        {c.conflictingRoute && ` (ruta: ${c.conflictingRoute})`}
                      </span>
                    )}
                  </p>
                ))}
              </div>
            )}
            {result.perFlight && result.perFlight.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-gray-200 pt-2">
                <p className="text-xs font-semibold text-gray-600 mb-1">Por vuelo:</p>
                {result.perFlight.map((pf) => (
                  <p key={pf.flightId} className="text-gray-500">
                    {pf.label}: {pf.assigned} asignado{pf.assigned !== 1 ? "s" : ""}
                    {pf.conflicts > 0 && (
                      <span className="text-amber-600 ml-1">· {pf.conflicts} conflicto{pf.conflicts !== 1 ? "s" : ""}</span>
                    )}
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
              {free.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <SectionHeader label="Disponibles" count={free.length} />
                    <div className="flex items-center gap-2">
                      {selectedIds.size > 0 && (
                        <button
                          onClick={clearSelection}
                          className="text-xs text-gray-400 hover:text-gray-600 underline"
                        >
                          Deseleccionar
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

                  <div className="mb-3">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar participante…"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    {filteredFree.map((participant) => {
                      const isSelected = selectedIds.has(participant.id);
                      return (
                        <div
                          key={participant.id}
                          onClick={() => toggleSelect(participant.id)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-300"
                              : "bg-gray-50 border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                              isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <Avatar participant={participant} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {participantName(participant)}
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
                    })}
                    {filteredFree.length === 0 && search && (
                      <p className="text-xs text-gray-400 text-center py-4">
                        Sin resultados para &ldquo;{search}&rdquo;
                      </p>
                    )}
                  </div>

                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="mt-3 w-full py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {applying ? (
                        "Asignando a todos los vuelos…"
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Asignar {selectedIds.size} a {flights.length} vuelo
                          {flights.length !== 1 ? "s" : ""} de la ruta
                        </>
                      )}
                    </button>
                  )}
                </section>
              )}

              {/* In other route */}
              {inOtherRoute.length > 0 && (
                <section>
                  <SectionHeader
                    label="En otra ruta"
                    count={inOtherRoute.length}
                    subtitle="Debés removerlos de su ruta actual para asignarlos aquí"
                  />
                  <div className="space-y-2">
                    {inOtherRoute.map((participant) => {
                      const info = participantAssignments.get(participant.id);
                      return (
                        <div
                          key={participant.id}
                          className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-2xl opacity-75"
                        >
                          <Avatar participant={participant} color="amber" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {participantName(participant)}
                            </p>
                            <p className="text-xs text-amber-700">
                              {info?.flightLabel}
                              {info?.routeGroup && (
                                <span className="ml-1 font-medium">· {info.routeGroup}</span>
                              )}
                            </p>
                          </div>
                          <span className="flex-shrink-0 text-xs text-amber-600 font-semibold px-2 py-1 bg-amber-100 rounded-lg">
                            Bloqueado
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {free.length === 0 && inOtherRoute.length === 0 && inThisRouteIds.size === 0 && (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">👥</p>
                  <p className="text-sm text-gray-500">No hay participantes en esta gira.</p>
                </div>
              )}

              {free.length === 0 && inThisRouteIds.size > 0 && inOtherRoute.length === 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                  <p className="text-xs text-blue-700 font-medium">
                    ✓ Todos los participantes disponibles ya están en esta ruta.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex-shrink-0 border-t border-gray-100 pt-4">
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

function Avatar({ participant, color = "gray" }) {
  const colors = {
    gray: "bg-gray-200 text-gray-600",
    amber: "bg-amber-200 text-amber-800",
    blue: "bg-blue-200 text-blue-800",
  };
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        colors[color] || colors.gray
      }`}
    >
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
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[color]}`}>
      {label}
    </span>
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
