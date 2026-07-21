/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";

const EMPTY_LIST = [];

function participantName(participant) {
  return [participant.firstName, participant.firstSurname, participant.secondSurname]
    .filter(Boolean)
    .join(" ");
}

function shouldIncludeParticipant(participant, leaderIds, includeAll) {
  return (
    includeAll ||
    participant.role === "STAFF" ||
    participant.role === "GUEST" ||
    leaderIds.has(participant.id)
  );
}

function participantPriority(participant) {
  if (participant.__isLeader) return 0;
  if (participant.role === "STAFF") return 1;
  if (participant.role === "GUEST") return 2;
  return 3;
}

function unassignedReason(participant, tourEndDate) {
  if (participant.visaStatus === "DENIED") {
    return { label: "Visa denegada", className: "bg-rose-100 text-rose-700" };
  }
  if (!participant.hasVisa) {
    return { label: "Sin visa vigente", className: "bg-rose-100 text-rose-700" };
  }
  if (!participant.visaExpiry) {
    return { label: "Visa sin vencimiento", className: "bg-amber-100 text-amber-800" };
  }
  if (tourEndDate && new Date(participant.visaExpiry) < new Date(tourEndDate)) {
    return { label: "Visa vence antes de la gira", className: "bg-rose-100 text-rose-700" };
  }
  if (participant.visaStatus !== "APPROVED") {
    return {
      label: `Visa ${participant.visaStatus?.toLowerCase() || "sin revisar"}`,
      className: "bg-amber-100 text-amber-800",
    };
  }
  return {
    label: "Visa válida, pendiente de asignación",
    className: "bg-emerald-100 text-emerald-800",
  };
}

function compareParticipants(a, b) {
  const priorityDifference = participantPriority(a) - participantPriority(b);
  if (priorityDifference !== 0) return priorityDifference;

  if (participantPriority(a) === 3) {
    const sectionA = (a.instrument || "Sin sección").trim();
    const sectionB = (b.instrument || "Sin sección").trim();
    const sectionDifference = sectionA.localeCompare(sectionB, "es", {
      sensitivity: "base",
    });
    if (sectionDifference !== 0) return sectionDifference;
  }

  return participantName(a).localeCompare(participantName(b), "es", {
    sensitivity: "base",
  });
}

function buildColumns(itineraries, unassignedParticipants, includeAll) {
  const columns = itineraries.map((itinerary) => {
    const leaderIds = new Set((itinerary.leaders || []).map((leader) => leader.id));
    return {
      id: itinerary.id,
      name: itinerary.name,
      itinerary,
      staff: (itinerary.participants || [])
        .filter((participant) => shouldIncludeParticipant(participant, leaderIds, includeAll))
        .map((participant) => ({
          ...participant,
          __isLeader: leaderIds.has(participant.id),
        }))
        .sort(compareParticipants),
    };
  });

  const unassignedStaff = unassignedParticipants
    .filter(
      (participant) => includeAll || participant.role === "STAFF" || participant.role === "GUEST"
    )
    .map((participant) => ({ ...participant, __isLeader: false }))
    .sort(compareParticipants);

  if (unassignedStaff.length > 0) {
    columns.unshift({
      id: "unassigned",
      name: "Sin itinerario",
      itinerary: null,
      staff: unassignedStaff,
    });
  }

  return columns;
}

export default function StaffItineraryBoard({
  itineraries = EMPTY_LIST,
  unassignedParticipants = EMPTY_LIST,
  onAssign,
  onReassign,
  loading = false,
  moving = false,
  includeAll = false,
  tourEndDate,
}) {
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const columns = useMemo(
    () => buildColumns(itineraries, unassignedParticipants, includeAll),
    [itineraries, unassignedParticipants, includeAll]
  );
  const totalStaff = columns.reduce((total, column) => total + column.staff.length, 0);

  const moveParticipant = async (participant, sourceId, targetId) => {
    if (!participant || !targetId || sourceId === targetId || moving) return;
    const target = itineraries.find((itinerary) => itinerary.id === targetId);
    const source = itineraries.find((itinerary) => itinerary.id === sourceId);
    if (!target || target.isLocked || source?.isLocked || (target.seatsRemaining ?? 0) <= 0) return;

    if (sourceId === "unassigned") {
      await onAssign(targetId, participant.id);
    } else {
      await onReassign(sourceId, targetId, participant.id);
    }
    setSelected(null);
  };

  if (loading && totalStaff === 0) {
    return (
      <div className="grid gap-3 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (totalStaff === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <p className="text-sm font-bold text-slate-800">
          {includeAll
            ? "No hay integrantes en esta gira"
            : "No hay Staff, invitados ni líderes en esta gira"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Las personas con estos roles aparecerán aquí cuando se agreguen a la gira.
        </p>
      </div>
    );
  }

  return (
    <section
      className="space-y-4"
      aria-label={
        includeAll
          ? "Distribución de integrantes por itinerario"
          : "Distribución de Staff, invitados y líderes por itinerario"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {includeAll ? "Todos los integrantes" : "Staff, invitados y líderes"}
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
            Arrastrá una persona a otro itinerario, o seleccionala y usá el botón del destino.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          {totalStaff} persona{totalStaff !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid items-start gap-3 overflow-x-auto pb-2 md:grid-flow-col md:auto-cols-[minmax(280px,1fr)]">
        {columns.map((column) => {
          const isUnassigned = column.id === "unassigned";
          const isFull = !isUnassigned && (column.itinerary?.seatsRemaining ?? 0) <= 0;
          const isLocked = Boolean(column.itinerary?.isLocked);
          const selectedSourceLocked = itineraries.find(
            (itinerary) => itinerary.id === selected?.sourceId
          )?.isLocked;
          const canReceive =
            selected &&
            selected.sourceId !== column.id &&
            !isFull &&
            !isLocked &&
            !selectedSourceLocked;
          const isDropTarget =
            dropTargetId === column.id && dragging?.sourceId !== column.id && !isFull && !isLocked;

          return (
            <div
              key={column.id}
              onDragOver={(event) => {
                if (isUnassigned || isFull || isLocked || dragging?.sourceId === column.id) return;
                event.preventDefault();
                setDropTargetId(column.id);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setDropTargetId(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDropTargetId(null);
                if (!isUnassigned && !isLocked && dragging) {
                  moveParticipant(dragging.participant, dragging.sourceId, column.id);
                }
                setDragging(null);
              }}
              className={`min-w-[280px] overflow-hidden rounded-2xl border bg-slate-50 transition-colors duration-200 ${
                isDropTarget
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : isUnassigned
                  ? "border-amber-200"
                  : isLocked
                  ? "border-amber-300 bg-amber-50/40"
                  : "border-slate-200"
              }`}
            >
              <header className="border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{column.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {column.staff.length} persona{column.staff.length !== 1 ? "s" : ""}
                      {!isUnassigned && ` · ${column.itinerary.seatsRemaining ?? 0} cupos`}
                    </p>
                  </div>
                  {isUnassigned ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">
                      Pendiente
                    </span>
                  ) : isLocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">
                      🔒
                    </span>
                  ) : isFull ? (
                    <span className="rounded-full bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-700">
                      Lleno
                    </span>
                  ) : null}
                </div>
                {!isUnassigned && (
                  <p
                    className="mt-2 truncate text-[11px] text-slate-400"
                    title={(column.itinerary.flights || [])
                      .map((flight) => `${flight.origin}–${flight.destination}`)
                      .join(" · ")}
                  >
                    {(column.itinerary.flights || []).length > 0
                      ? (column.itinerary.flights || [])
                          .map((flight) => `${flight.origin} → ${flight.destination}`)
                          .join(" · ")
                      : "Sin vuelos vinculados"}
                  </p>
                )}
              </header>

              <div className="space-y-2 p-3">
                {canReceive && (
                  <button
                    type="button"
                    onClick={() =>
                      moveParticipant(selected.participant, selected.sourceId, column.id)
                    }
                    disabled={moving}
                    className="flex min-h-[40px] w-full items-center justify-center rounded-xl border border-blue-300 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {moving ? "Moviendo…" : `Mover aquí a ${selected.participant.firstName}`}
                  </button>
                )}

                {column.staff.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-400">
                    {isDropTarget ? "Soltá para reasignar" : "Sin personas de este grupo"}
                  </div>
                ) : (
                  column.staff.map((participant) => {
                    const isSelected = selected?.participant.id === participant.id;
                    const reason = isUnassigned ? unassignedReason(participant, tourEndDate) : null;
                    return (
                      <button
                        key={participant.id}
                        type="button"
                        draggable={!moving && !isLocked}
                        onDragStart={(event) => {
                          if (isLocked) return;
                          event.dataTransfer.effectAllowed = "move";
                          setDragging({ participant, sourceId: column.id });
                          setSelected({ participant, sourceId: column.id });
                        }}
                        onDragEnd={() => {
                          setDragging(null);
                          setDropTargetId(null);
                        }}
                        onClick={() =>
                          !isLocked &&
                          setSelected(isSelected ? null : { participant, sourceId: column.id })
                        }
                        disabled={moving || isLocked}
                        aria-pressed={isSelected}
                        className={`flex min-h-[56px] w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          {[participant.firstName, participant.firstSurname]
                            .filter(Boolean)
                            .map((name) => name[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {participantName(participant)}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-1">
                            {participant.__isLeader && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                Líder
                              </span>
                            )}
                            {participant.role === "STAFF" && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                Staff
                              </span>
                            )}
                            {participant.role === "GUEST" && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                Invitado
                              </span>
                            )}
                            {!participant.__isLeader &&
                              participant.role !== "STAFF" &&
                              participant.role !== "GUEST" && (
                                <span className="truncate text-xs text-slate-500">
                                  {participant.instrument ||
                                    participant.identification ||
                                    "Participante"}
                                </span>
                              )}
                            {reason && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${reason.className}`}
                              >
                                {reason.label}
                              </span>
                            )}
                          </span>
                        </span>
                        <span aria-hidden="true" className="flex-shrink-0 text-slate-300">
                          ⠿
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-800"
          role="status"
        >
          <span>
            Seleccionaste a <strong>{participantName(selected.participant)}</strong>. Elegí “Mover
            aquí” en el destino.
          </span>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="font-bold hover:text-blue-950"
          >
            Cancelar
          </button>
        </div>
      )}
    </section>
  );
}
