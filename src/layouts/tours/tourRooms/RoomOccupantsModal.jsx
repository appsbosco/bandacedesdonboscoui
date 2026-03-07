/* eslint-disable react/prop-types */
/**
 * RoomOccupantsModal — gestión de ocupantes de una habitación.
 * - Muestra ocupantes actuales con opción de remover
 * - Muestra disponibles para asignar
 * - Bloquea los que ya están en otra habitación
 */
import { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";

const GET_TOUR_PARTICIPANTS_LIGHT = gql`
  query GetTourParticipantsForRooms($tourId: ID!) {
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

export default function RoomOccupantsModal({
  isOpen,
  room,
  tourId,
  participantRoomAssignments, // Map: participantId → { roomNumber, hotelName, roomId }
  onClose,
  onAssign,
  onRemove,
  assigning,
  removing,
}) {
  const [search, setSearch] = useState("");

  const { data, loading } = useQuery(GET_TOUR_PARTICIPANTS_LIGHT, {
    variables: { tourId },
    skip: !isOpen || !tourId,
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (isOpen) setSearch("");
  }, [isOpen, room?.id]);

  if (!isOpen || !room) return null;

  const allParticipants = data?.getTourParticipants || [];
  const occupantIds = new Set(room.occupants?.map((o) => o.participant.id) || []);

  const occupied = room.occupants || [];
  const unassigned = allParticipants.filter((p) => !occupantIds.has(p.id));

  // Free: not in any room. InOtherRoom: in a different room
  const free = unassigned.filter((p) => !participantRoomAssignments?.has(p.id));
  const inOtherRoom = unassigned.filter((p) => participantRoomAssignments?.has(p.id));

  const isFull = room.occupantCount >= room.capacity;
  const isWorking = assigning || removing;

  const filteredFree = search
    ? free.filter((p) => participantName(p).toLowerCase().includes(search.toLowerCase()))
    : free;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[88vh] min-h-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Ocupantes de la habitación</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-700">{room.hotelName}</span>
                {" · "}Hab. {room.roomNumber}
                {room.floor && <span> · Piso {room.floor}</span>}
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
              color={isFull ? "emerald" : "gray"}
              label={`${room.occupantCount}/${room.capacity} ocupado${room.occupantCount !== 1 ? "s" : ""}`}
            />
            <Pill color="gray" label={`${free.length} disponible${free.length !== 1 ? "s" : ""}`} />
            {inOtherRoom.length > 0 && (
              <Pill color="amber" label={`${inOtherRoom.length} en otra hab.`} />
            )}
          </div>

          {isFull && (
            <div className="mt-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-medium">
              ✓ Habitación completa
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">
          {/* Current occupants */}
          {occupied.length > 0 && (
            <section>
              <SectionHeader label="En esta habitación" count={occupied.length} />
              <div className="space-y-2">
                {occupied.map(({ participant, confirmedAt }) => (
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
                        {confirmedAt && (
                          <span className="ml-2 text-emerald-600">✓ Confirmado</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemove(room.id, participant.id)}
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

          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Available participants */}
              {free.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <SectionHeader label="Disponibles" count={free.length} />
                  </div>
                  {/* Search */}
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
                    {filteredFree.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-2xl"
                      >
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
                        <button
                          onClick={() => onAssign(room.id, participant.id)}
                          disabled={isWorking || isFull}
                          className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-200 border border-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {assigning ? "…" : "Asignar"}
                        </button>
                      </div>
                    ))}
                    {filteredFree.length === 0 && search && (
                      <p className="text-xs text-gray-400 text-center py-4">
                        Sin resultados para &ldquo;{search}&rdquo;
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* In other rooms */}
              {inOtherRoom.length > 0 && (
                <section>
                  <SectionHeader
                    label="En otra habitación"
                    count={inOtherRoom.length}
                    subtitle="Para asignarlos aquí, removelos de su habitación actual"
                  />
                  <div className="space-y-2">
                    {inOtherRoom.map((participant) => {
                      const info = participantRoomAssignments.get(participant.id);
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
                              {info?.hotelName} · Hab. {info?.roomNumber}
                            </p>
                          </div>
                          <span className="flex-shrink-0 text-xs text-amber-600 font-semibold px-2 py-1 bg-amber-100 rounded-lg">
                            Asignado
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Empty state */}
              {free.length === 0 && inOtherRoom.length === 0 && occupied.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">👥</p>
                  <p className="text-sm text-gray-500">
                    No hay participantes en esta gira todavía.
                  </p>
                </div>
              )}

              {free.length === 0 && occupied.length > 0 && inOtherRoom.length === 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                  <p className="text-xs text-blue-700 font-medium">
                    ✓ Todos los participantes disponibles están asignados.
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
