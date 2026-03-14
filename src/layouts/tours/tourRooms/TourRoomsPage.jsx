/* eslint-disable react/prop-types */
/**
 * TourRoomsPage — gestión de habitaciones de una gira.
 * Dos modos: Lista (view) · Planificador (planner)
 */
import { useState } from "react";
import { useTourRooms } from "./useTourRooms";
import RoomCard from "./RoomCard";
import RoomFormModal from "./RoomFormModal";
import RoomDeleteModal from "./RoomDeleteModal";
import RoomOccupantsModal from "./RoomOccupantsModal";
import RoomPlanner from "./RoomPlanner";
import RoomingListExportModal from "./RoomingListExportModal";
import { Toast } from "../TourHelpers";

const VIEWS = [
  { id: "list", label: "Lista", emoji: "📋" },
  { id: "planner", label: "Planificador", emoji: "🗺️" },
];

export default function TourRoomsPage({ tourId, tourName }) {
  const [mode, setMode] = useState("list");
  const [search, setSearch] = useState("");
  const [hotelFilter, setHotelFilter] = useState("ALL");
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const state = useTourRooms(tourId);
  const {
    rooms,
    allParticipants,
    unassignedParticipants,
    totalOccupants,
    fullRooms,
    hotels,
    participantRoomAssignments,
    loading,
    error,
    formModal,
    deleteModal,
    occupantsModal,
    openCreateModal,
    openEditModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
    openOccupantsModal,
    closeOccupantsModal,
    handleSubmit,
    handleDelete,
    handleAssignOccupant,
    handleRemoveOccupant,
    creating,
    updating,
    deleting,
    assigning,
    removing,
    // planner
    sexOverrides,
    handleSetSex,
    handleSetResponsible,
    handleCapacityChange,
    plannerCapacity,
    setPlannerCapacity,
    plannerHotel,
    setPlannerHotel,
    handleMove,
    handleCreateRoomsFromGroup,
    bulkCreating,
    movingId,
    toast,
    setToast,
  } = state;

  const filtered = rooms.filter((r) => {
    const matchHotel = hotelFilter === "ALL" || r.hotelName === hotelFilter;
    const matchSearch =
      !search ||
      r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.hotelName.toLowerCase().includes(search.toLowerCase());
    return matchHotel && matchSearch;
  });

  const byHotel = filtered.reduce((acc, r) => {
    const k = r.hotelName;
    if (!acc[k]) acc[k] = [];
    acc[k].push(r);
    return acc;
  }, {});

  if (mode === "planner") {
    return (
      <>
        {/* Mode switcher strip */}
        <ViewSwitcher mode={mode} onSwitch={setMode} />
        <div className="mt-4">
          <RoomPlanner
            tourId={tourId}
            tourName={tourName}
            rooms={rooms}
            unassignedParticipants={unassignedParticipants}
            participantRoomAssignments={participantRoomAssignments}
            sexOverrides={sexOverrides}
            handleSetSex={handleSetSex}
            handleSetResponsible={handleSetResponsible}
            plannerCapacity={plannerCapacity}
            setPlannerCapacity={setPlannerCapacity}
            plannerHotel={plannerHotel}
            setPlannerHotel={setPlannerHotel}
            bulkCreating={bulkCreating}
            movingId={movingId}
            handleMove={handleMove}
            handleCreateRoomsFromGroup={handleCreateRoomsFromGroup}
            handleAssignOccupant={handleAssignOccupant}
            handleRemoveOccupant={handleRemoveOccupant}
            handleCapacityChange={handleCapacityChange}
            formModal={formModal}
            deleteModal={deleteModal}
            openCreateModal={openCreateModal}
            openEditModal={openEditModal}
            closeFormModal={closeFormModal}
            openDeleteModal={openDeleteModal}
            closeDeleteModal={closeDeleteModal}
            handleSubmit={handleSubmit}
            handleDelete={handleDelete}
            creating={creating}
            updating={updating}
            deleting={deleting}
            toast={toast}
            setToast={setToast}
          />
        </div>
      </>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Sub-header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">Habitaciones de la gira</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Gestioná el alojamiento de <span className="font-semibold">{tourName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ViewSwitcher mode={mode} onSwitch={setMode} />
          {rooms.length > 0 && (
            <button
              onClick={() => setExportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-2xl active:scale-[0.98] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Exportar
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-2xl active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nueva habitación
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard value={rooms.length} label="Total" />
        <StatCard value={hotels.length} label="Hoteles" color="text-blue-600" />
        <StatCard value={fullRooms} label="Completas" color="text-emerald-600" />
        <StatCard value={totalOccupants} label="Asignados" color="text-violet-600" />
      </div>

      {/* Unassigned alert */}
      {!loading && unassignedParticipants.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-xs text-amber-700 font-medium">
            ⚠️ {unassignedParticipants.length} participante
            {unassignedParticipants.length !== 1 ? "s" : ""} sin habitación
          </p>
          <button
            onClick={() => setMode("planner")}
            className="text-xs font-bold text-amber-700 underline hover:text-amber-900"
          >
            Abrir planificador →
          </button>
        </div>
      )}

      {/* Filters */}
      {rooms.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por habitación o hotel…"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          {hotels.length > 1 && (
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
              <FilterTab
                label="Todos"
                active={hotelFilter === "ALL"}
                onClick={() => setHotelFilter("ALL")}
              />
              {hotels.map((h) => (
                <FilterTab
                  key={h}
                  label={h}
                  active={hotelFilter === h}
                  onClick={() => setHotelFilter(h)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : rooms.length === 0 ? (
        <EmptyState
          onAdd={openCreateModal}
          onPlanner={() => setMode("planner")}
          tourName={tourName}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">
          Sin habitaciones que coincidan con la búsqueda.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byHotel).map(([hotelName, hotelRooms]) => (
            <section key={hotelName}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span>🏨</span>
                <span>{hotelName}</span>
                <span className="text-gray-300 font-normal">({hotelRooms.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hotelRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                    onManageOccupants={openOccupantsModal}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

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

      <RoomOccupantsModal
        isOpen={occupantsModal.open}
        room={occupantsModal.room}
        tourId={tourId}
        participantRoomAssignments={participantRoomAssignments}
        onClose={closeOccupantsModal}
        onAssign={handleAssignOccupant}
        onRemove={handleRemoveOccupant}
        assigning={assigning}
        removing={removing}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <RoomingListExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        rooms={rooms}
        allParticipants={allParticipants}
        sexOverrides={sexOverrides}
        tourName={tourName}
      />
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function ViewSwitcher({ mode, onSwitch }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          onClick={() => onSwitch(v.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            mode === v.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>{v.emoji}</span>
          <span>{v.label}</span>
        </button>
      ))}
    </div>
  );
}

function StatCard({ value, label, color = "text-gray-900" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function FilterTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
        active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-40 bg-gray-100 rounded-2xl" />
      ))}
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
      <p className="text-2xl mb-2">⚠️</p>
      <p className="text-sm font-bold text-red-700">Error al cargar habitaciones</p>
      <p className="text-xs text-red-500 mt-1">{message}</p>
    </div>
  );
}

function EmptyState({ onAdd, onPlanner, tourName }) {
  return (
    <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-12 text-center">
      <p className="text-4xl mb-3">🏨</p>
      <h3 className="text-sm font-bold text-gray-900 mb-1">Sin habitaciones registradas</h3>
      <p className="text-xs text-gray-500 mb-5">
        Todavía no hay habitaciones para <span className="font-semibold">{tourName}</span>.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-2xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar habitación
        </button>
        <button
          onClick={onPlanner}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-100 transition-all"
        >
          🗺️ Usar planificador
        </button>
      </div>
    </div>
  );
}
