/* eslint-disable react/prop-types */
/**
 * RoomPlanner — Workspace de planificación de habitaciones.
 * Layout: Settings bar | Left: Unassigned + Groups | Right: Room list
 * Drag & drop: native HTML5 — no new libraries.
 */
import { useCallback, useMemo } from "react";
import UnassignedParticipantsPanel from "./UnassignedParticipantsPanel";
import SuggestedGroupsPanel from "./SuggestedGroupsPanel";
import RoomListPanel from "./RoomListPanel";
import RoomFormModal from "./RoomFormModal";
import RoomDeleteModal from "./RoomDeleteModal";
import { Toast } from "../TourHelpers";

const ROOM_TYPE_WIDGETS = [
  { type: "SINGLE", label: "Individual", emoji: "🛏️", color: "text-gray-700", tone: "bg-gray-50 border-gray-200" },
  { type: "DOUBLE", label: "Doble", emoji: "🛏️🛏️", color: "text-blue-700", tone: "bg-blue-50 border-blue-100" },
  { type: "TRIPLE", label: "Triple", emoji: "🛏️🛏️🛏️", color: "text-violet-700", tone: "bg-violet-50 border-violet-100" },
  { type: "QUAD", label: "Cuadruple", emoji: "🏨", color: "text-amber-700", tone: "bg-amber-50 border-amber-100" },
  { type: "SUITE", label: "Suite", emoji: "⭐", color: "text-emerald-700", tone: "bg-emerald-50 border-emerald-100" },
];

export default function RoomPlanner({
  tourId,
  tourName,
  // Data
  rooms,
  unassignedParticipants,
  participantRoomAssignments,
  // Planner state
  sexOverrides,
  handleSetSex,
  handleSetResponsible,
  handleSyncRoomTypes,
  plannerCapacity,
  setPlannerCapacity,
  plannerHotel,
  setPlannerHotel,
  bulkCreating,
  movingId,
  // Actions
  handleMove,
  handleCreateRoomsFromGroup,
  handleAssignOccupant,
  handleRemoveOccupant,
  handleCapacityChange,
  // Room CRUD
  formModal,
  deleteModal,
  openCreateModal,
  openEditModal,
  closeFormModal,
  openDeleteModal,
  closeDeleteModal,
  handleSubmit,
  handleDelete,
  creating,
  updating,
  deleting,
  syncingRoomTypes,
  // Toast
  toast,
  setToast,
}) {
  // ── Drag handlers ─────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e, participantId, fromRoomId) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("participantId", participantId);
    e.dataTransfer.setData("fromRoomId", fromRoomId || "");
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e, toRoomId) => {
      e.preventDefault();
      const participantId = e.dataTransfer.getData("participantId");
      const fromRoomId = e.dataTransfer.getData("fromRoomId") || null;
      if (!participantId) return;
      // toRoomId === null means unassign
      if (fromRoomId === toRoomId) return;
      handleMove(participantId, fromRoomId, toRoomId);
    },
    [handleMove]
  );

  // Summary stats
  const totalCapacity = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  const totalAssigned = rooms.reduce((acc, r) => acc + (r.occupantCount || 0), 0);
  const totalUnassigned = unassignedParticipants.length;
  const roomTypeCounts = useMemo(() => {
    const counts = rooms.reduce((acc, room) => {
      const type = room.roomType || "SINGLE";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return ROOM_TYPE_WIDGETS.map((item) => ({
      ...item,
      value: counts[item.type] || 0,
    }));
  }, [rooms]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">Planificador de habitaciones</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Agrupación automática por sexo y edad ·{" "}
            <span className="font-semibold">{tourName}</span>
          </p>
        </div>
        {rooms.length > 0 && (
          <button
            onClick={handleSyncRoomTypes}
            disabled={syncingRoomTypes}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m14.836 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-14.838-2m14.838 2H15"
              />
            </svg>
            {syncingRoomTypes ? "Sincronizando..." : "Sincronizar denominaciones"}
          </button>
        )}
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-3">
        <SumStat value={rooms.length} label="Habitaciones" />
        <SumStat value={totalCapacity} label="Capacidad total" color="text-blue-600" />
        <SumStat value={totalAssigned} label="Asignados" color="text-emerald-600" />
        <SumStat
          value={totalUnassigned}
          label="Sin asignar"
          color={totalUnassigned > 0 ? "text-amber-600" : "text-gray-400"}
        />
      </div>

      {rooms.length > 0 && (
        <section className="space-y-2">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Denominacion de habitaciones
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Conteo actual por tipo</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2">
            {roomTypeCounts.map((item) => (
              <RoomTypeWidget key={item.type} {...item} />
            ))}
          </div>
        </section>
      )}

      {/* Settings bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex flex-wrap items-end gap-5">
        <div>
          <p className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
            Capacidad (habitación manual)
          </p>
          <input
            type="number"
            min={1}
            max={10}
            value={plannerCapacity}
            onChange={(e) => setPlannerCapacity(Math.max(1, Number(e.target.value)))}
            className="w-20 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-center font-semibold"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <p className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
            Hotel (para habitaciones nuevas)
          </p>
          <input
            type="text"
            value={plannerHotel}
            onChange={(e) => setPlannerHotel(e.target.value)}
            placeholder="Nombre del hotel…"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <div className="text-[10px] text-gray-400 self-center">
          <p>🔗 Arrastrá participantes entre habitaciones</p>
          <p>🏷️ Clic en badge de sexo para cambiar M/F/O/?</p>
          <p>🤖 Grupos sugeridos usan tamaños óptimos (5→4→3)</p>
        </div>
      </div>

      {/* Main split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 items-start">
        {/* Left: Unassigned + Suggested groups */}
        <div className="space-y-4">
          <UnassignedParticipantsPanel
            participants={unassignedParticipants}
            sexOverrides={sexOverrides}
            onSetSex={handleSetSex}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
          <SuggestedGroupsPanel
            unassignedParticipants={unassignedParticipants}
            sexOverrides={sexOverrides}
            onCreateRooms={handleCreateRoomsFromGroup}
            bulkCreating={bulkCreating}
          />
        </div>

        {/* Right: Room list with drag targets */}
        <div>
          <RoomListPanel
            rooms={rooms}
            sexOverrides={sexOverrides}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onMove={handleMove}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            onAddRoom={openCreateModal}
            onCapacityChange={handleCapacityChange}
            onSetResponsible={handleSetResponsible}
            movingId={movingId}
          />
        </div>
      </div>

      {/* Modals */}
      <RoomFormModal
        isOpen={formModal.open}
        mode={formModal.mode}
        room={formModal.room}
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        loading={creating || updating}
      />

      <RoomDeleteModal
        room={deleteModal.room}
        onConfirm={handleDelete}
        onCancel={closeDeleteModal}
        loading={deleting}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function SumStat({ value, label, color = "text-gray-900" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function RoomTypeWidget({ value, label, emoji, color, tone }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">{emoji}</span>
        <span className={`text-lg font-bold ${color}`}>{value}</span>
      </div>
      <p className="text-[11px] font-semibold text-gray-700 mt-2 leading-tight">{label}</p>
      <p className="text-[10px] text-gray-500 leading-tight">habitaciones</p>
    </div>
  );
}
