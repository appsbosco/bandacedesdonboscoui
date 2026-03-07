/* eslint-disable react/prop-types */
/**
 * FlightPassengersModal — gestión de pasajeros de un vuelo.
 * - Selección múltiple para asignación masiva
 * - Muestra en qué ruta/vuelo está cada participante ya asignado
 * - Reporta conflictos tras intento de asignación masiva
 */
import { useState, useEffect, useCallback } from "react";
import { useQuery, gql } from "@apollo/client";

const GET_TOUR_PARTICIPANTS_LIGHT = gql`
  query GetTourParticipantsLight($tourId: ID!) {
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

function participantInitials(p) {
  return [p.firstName, p.firstSurname]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function FlightPassengersModal({
  isOpen,
  flight,
  tourId,
  participantAssignments, // Map: participantId → { flightLabel, routeGroup, flightId }
  onClose,
  onAssign, // individual
  onAssignBulk, // masiva → retorna { assigned, skipped, conflicts }
  onRemove,
  assigning,
  assigningBulk,
  removing,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkResult, setBulkResult] = useState(null); // resultado de la última asignación masiva

  const { data, loading } = useQuery(GET_TOUR_PARTICIPANTS_LIGHT, {
    variables: { tourId },
    skip: !isOpen || !tourId,
    fetchPolicy: "cache-and-network",
  });

  // Limpiar selección y resultado al abrir/cambiar vuelo
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setBulkResult(null);
    }
  }, [isOpen, flight?.id]);

  if (!isOpen || !flight) return null;

  const allParticipants = data?.getTourParticipants || [];
  const assignedIds = new Set(flight.passengers?.map((p) => p.participant.id) || []);

  const assigned = flight.passengers || [];
  const unassigned = allParticipants.filter((p) => !assignedIds.has(p.id));

  // Separar no asignados en: libres vs asignados a otra ruta
  const free = unassigned.filter((p) => !participantAssignments?.has(p.id));
  const inOtherRoute = unassigned.filter((p) => participantAssignments?.has(p.id));

  // Selección
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

  const handleBulkAssign = async () => {
    if (selectedIds.size === 0) return;
    setBulkResult(null);
    const result = await onAssignBulk(flight.id, Array.from(selectedIds));
    if (result) {
      setBulkResult(result);
      setSelectedIds(new Set());
    }
  };

  const isWorking = assigning || assigningBulk || removing;

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[88vh] min-h-0">
        {" "}
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pasajeros del vuelo</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-700">
                  {flight.airline} {flight.flightNumber}
                </span>
                {" · "}
                {flight.origin} → {flight.destination}
                {flight.routeGroup && (
                  <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md font-medium">
                    {flight.routeGroup}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3">
            <Pill
              color="emerald"
              label={`${assigned.length} asignado${assigned.length !== 1 ? "s" : ""}`}
            />
            <Pill color="gray" label={`${free.length} disponible${free.length !== 1 ? "s" : ""}`} />
            {inOtherRoute.length > 0 && (
              <Pill color="amber" label={`${inOtherRoute.length} en otra ruta`} />
            )}
          </div>
        </div>
        {/* Bulk result banner */}
        {bulkResult && (
          <div
            className={`mx-6 mt-4 p-3 rounded-2xl border text-xs flex-shrink-0 ${
              bulkResult.conflicts.length > 0
                ? "bg-amber-50 border-amber-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <p className="font-bold text-gray-800 mb-1">Resultado de asignación masiva</p>
            <p className="text-gray-600">
              ✓ {bulkResult.assigned} asignado{bulkResult.assigned !== 1 ? "s" : ""}
              {bulkResult.conflicts.length > 0 && (
                <span className="text-amber-700 ml-2">
                  · {bulkResult.conflicts.length} con conflicto de ruta
                </span>
              )}
            </p>
            {bulkResult.conflicts.length > 0 && (
              <div className="mt-2 space-y-1">
                {bulkResult.conflicts.map((c) => (
                  <p key={c.participantId} className="text-amber-700">
                    ⚠ <strong>{c.participantName}</strong> — ya está en {c.conflictingFlight} (ruta:{" "}
                    {c.conflictingRoute})
                  </p>
                ))}
              </div>
            )}
            <button
              onClick={() => setBulkResult(null)}
              className="mt-2 text-gray-400 hover:text-gray-600 underline"
            >
              Cerrar aviso
            </button>
          </div>
        )}
        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">
          {" "}
          {/* Assigned */}
          {assigned.length > 0 && (
            <section>
              <SectionHeader label="En este vuelo" count={assigned.length} />
              <div className="space-y-2">
                {assigned.map(({ participant, confirmedAt }) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl"
                  >
                    <Avatar participant={participant} color="emerald" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {participantName(participant)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {participant.identification}
                        {confirmedAt && <span className="ml-2 text-emerald-600">✓ Confirmado</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemove(flight.id, participant.id)}
                      disabled={isWorking}
                      className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
          {/* Loading */}
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              {free.length > 0 && (
                <section className="h-72">
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
                  <div className="space-y-2">
                    {free.map((participant) => {
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
                          {/* Checkbox visual */}
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
                          <Avatar participant={participant} color="gray" />
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
                  </div>

                  {/* Bulk assign button */}
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleBulkAssign}
                      disabled={isWorking}
                      className="mt-3 w-full py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {assigningBulk ? (
                        "Asignando…"
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Asignar {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
                        </>
                      )}
                    </button>
                  )}
                </section>
              )}

              {/* Participants in other routes — bloqueados */}
              {inOtherRoute.length > 0 && (
                <section className="h-72">
                  <SectionHeader
                    label="Asignados a otra ruta"
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

              {/* Empty state */}
              {free.length === 0 && inOtherRoute.length === 0 && assigned.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">👥</p>
                  <p className="text-sm text-gray-500">
                    No hay participantes en esta gira todavía.
                  </p>
                </div>
              )}

              {free.length === 0 && assigned.length > 0 && inOtherRoute.length === 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                  <p className="text-xs text-blue-700 font-medium">
                    ✓ Todos los participantes disponibles están en este vuelo.
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

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ participant, color }) {
  const colors = {
    emerald: "bg-emerald-200 text-emerald-800",
    gray: "bg-gray-200 text-gray-600",
    amber: "bg-amber-200 text-amber-800",
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
    emerald: "bg-emerald-100 text-emerald-700",
    gray: "bg-gray-100 text-gray-600",
    amber: "bg-amber-100 text-amber-700",
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
