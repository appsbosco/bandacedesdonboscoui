/* eslint-disable react/prop-types */
/**
 * RoomListPanel
 * Right-side panel: rooms with occupant chips as drag targets.
 * Supports: drop to assign, quick "Move" popover, warnings badge,
 *           inline capacity editing, edit/delete room actions.
 *
 * Rooms are displayed sorted by the age of their youngest occupant (ascending).
 * Ages are computed as of TOUR_REFERENCE_DATE (see roomGrouping.js).
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { roomWarnings, SEX_CONFIG, calcAge, getAgeBucket, DEFAULT_AGE_BUCKETS, TOUR_REFERENCE_DATE, MAX_ROOM_CAPACITY } from "./roomGrouping";

function participantFullName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

/** Youngest occupant age in a room (null if no occupants with known birthDate). */
function roomMinAge(room) {
  if (!room.occupants || room.occupants.length === 0) return Infinity;
  const ages = room.occupants
    .map((o) => calcAge((o.participant || o).birthDate))
    .filter((a) => a !== null);
  return ages.length > 0 ? Math.min(...ages) : Infinity;
}

// ── Warning badges ─────────────────────────────────────────────────────────────
function WarningBadge({ type, label }) {
  const styles = {
    mixed_sex:      "bg-orange-50 text-orange-600 border-orange-100",
    mixed_age:      "bg-amber-50 text-amber-600 border-amber-100",
    mixed_age_soft: "bg-yellow-50 text-yellow-600 border-yellow-100",
    unknown_sex:    "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border ${styles[type] || styles.unknown_sex}`}>
      ⚠ {label}
    </span>
  );
}

// ── Inline capacity editor ─────────────────────────────────────────────────────
function CapacityEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const inputRef              = useRef(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, value]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n >= 1 && n !== value) onSave(n);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={1}
        max={10}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter")  commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-8 text-center text-[11px] font-bold border border-blue-400 rounded focus:outline-none bg-white"
        style={{ MozAppearance: "textfield" }}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Editar capacidad"
      className="text-[11px] font-bold text-gray-400 hover:text-blue-600 hover:underline transition-colors tabular-nums"
    >
      cap.{value}
    </button>
  );
}

// ── Move popover ───────────────────────────────────────────────────────────────
function MovePopover({ rooms, fromRoomId, onMove, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-6 z-30 bg-white border border-gray-200 rounded-2xl shadow-2xl w-52 py-2 overflow-hidden"
    >
      <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 mb-1">
        Mover a…
      </p>
      <div className="max-h-48 overflow-y-auto">
        {rooms
          .filter((r) => r.id !== fromRoomId)
          .map((r) => {
            // "full" only at absolute max — capacity auto-adjusts, so we gate on MAX_ROOM_CAPACITY
            const atMax = r.occupantCount >= MAX_ROOM_CAPACITY;
            return (
              <button
                key={r.id}
                onClick={() => { onMove(r.id); onClose(); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between gap-2"
              >
                <span className="font-semibold text-gray-800 truncate">
                  {r.hotelName} · {r.roomNumber}
                </span>
                <span className={`flex-shrink-0 text-[10px] font-bold ${atMax ? "text-amber-500" : "text-gray-400"}`}>
                  {r.occupantCount}/{r.capacity}
                  {atMax && " ↑"}
                </span>
              </button>
            );
          })}
      </div>
      <div className="border-t border-gray-100 mt-1 pt-1">
        <button
          onClick={() => { onMove(null); onClose(); }}
          className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 font-semibold"
        >
          ✕ Quitar de habitación
        </button>
      </div>
    </div>
  );
}

// ── Occupant chip (draggable) ──────────────────────────────────────────────────
function OccupantChip({ occupant, roomId, rooms, sexOverrides, onDragStart, onMove, movingId }) {
  const [showMovePopover, setShowMovePopover] = useState(false);
  const p        = occupant.participant;
  const sexKey   = p.sex || sexOverrides.get(p.id) || "UNKNOWN";
  const sexCfg   = SEX_CONFIG[sexKey];
  const isMoving = movingId === p.id;
  const age      = calcAge(p.birthDate);

  return (
    <div
      draggable={!isMoving}
      onDragStart={(e) => onDragStart(e, p.id, roomId)}
      className={`relative flex items-center gap-1.5 px-2 py-1.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none group ${
        isMoving
          ? "opacity-40 cursor-wait"
          : "bg-gray-50 border-gray-100 hover:border-gray-200 hover:bg-white"
      }`}
    >
      <span className={`flex-shrink-0 w-4 h-4 rounded-full border text-[9px] font-bold flex items-center justify-center ${sexCfg.color}`}>
        {sexCfg.short}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{participantFullName(p)}</p>
        {age !== null && (
          <p className="text-[10px] text-gray-400">{age} años</p>
        )}
      </div>

      {/* Move button */}
      <button
        onClick={() => setShowMovePopover((v) => !v)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-200"
        title="Mover"
      >
        <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </button>

      {showMovePopover && (
        <MovePopover
          rooms={rooms}
          fromRoomId={roomId}
          onMove={(toRoomId) => onMove(p.id, roomId, toRoomId)}
          onClose={() => setShowMovePopover(false)}
        />
      )}
    </div>
  );
}

// ── Room planner card ──────────────────────────────────────────────────────────
function RoomPlannerCard({
  room,
  rooms,
  sexOverrides,
  onDragStart,
  onDragOver,
  onDrop,
  onMove,
  onEdit,
  onDelete,
  onCapacityChange,
  movingId,
  dragOverRoomId,
}) {
  const pct          = room.capacity > 0 ? (room.occupantCount / room.capacity) * 100 : 0;
  const warnings     = roomWarnings(room.occupants, sexOverrides);
  const isDragTarget = dragOverRoomId === room.id;
  const isFull       = room.occupantCount >= room.capacity;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver(room.id); }}
      onDrop={(e) => onDrop(e, room.id)}
      className={`bg-white rounded-2xl border shadow-sm transition-all ${
        isDragTarget
          ? "border-blue-400 shadow-blue-100 bg-blue-50"
          : isFull
          ? "border-emerald-200"
          : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs font-bold text-gray-900 truncate">
              {room.hotelName} · {room.roomNumber}
            </p>
            {isFull && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                Completa
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {warnings.map((w) => (
              <WarningBadge key={w.type} type={w.type} label={w.label} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <CapacityEditor value={room.capacity} onSave={(n) => onCapacityChange(room, n)} />
          <span className={`text-xs font-bold ${isFull ? "text-emerald-600" : "text-gray-600"}`}>
            {room.occupantCount}/{room.capacity}
          </span>
          <button
            onClick={() => onEdit(room)}
            className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition-all"
            title="Editar habitación"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(room)}
            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
            title="Eliminar habitación"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Capacity bar */}
      <div className="px-3 pt-2 pb-1">
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isFull ? "bg-emerald-500" : pct > 60 ? "bg-blue-400" : "bg-gray-300"
            }`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      {/* Occupant chips */}
      <div className="px-3 pb-3 space-y-1.5 mt-1">
        {room.occupants.length === 0 && (
          <div className={`py-4 text-center rounded-xl border border-dashed transition-all ${
            isDragTarget ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50"
          }`}>
            <p className="text-[10px] text-gray-400">
              {isDragTarget ? "Suelta aquí ↓" : "Arrastrá participantes aquí"}
            </p>
          </div>
        )}
        {room.occupants.map((occupant) => (
          <OccupantChip
            key={occupant.participant.id}
            occupant={occupant}
            roomId={room.id}
            rooms={rooms}
            sexOverrides={sexOverrides}
            onDragStart={onDragStart}
            onMove={onMove}
            movingId={movingId}
          />
        ))}
        {room.occupants.length > 0 && isDragTarget && (
          <div className="py-1.5 text-center rounded-xl border border-dashed border-blue-300 bg-blue-50">
            <p className="text-[10px] text-blue-500 font-semibold">Suelta aquí ↓</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export default function RoomListPanel({
  rooms,
  sexOverrides,
  onDragStart,
  onDrop,
  onMove,
  onEdit,
  onDelete,
  onAddRoom,
  onCapacityChange,
  movingId,
}) {
  const [dragOverRoomId, setDragOverRoomId] = useState(null);

  const handleDragOver = (roomId) => setDragOverRoomId(roomId);
  const handleDrop     = (e, roomId) => { setDragOverRoomId(null); onDrop(e, roomId); };
  const handleDragEnd  = () => setDragOverRoomId(null);

  // Sort rooms by youngest occupant age ascending; empty rooms go last.
  const sortedRooms = useMemo(
    () => [...rooms].sort((a, b) => roomMinAge(a) - roomMinAge(b)),
    [rooms]
  );

  const totalOccupants = rooms.reduce((s, r) => s + r.occupantCount, 0);
  const totalCapacity  = rooms.reduce((s, r) => s + r.capacity, 0);
  const fullCount      = rooms.filter((r) => r.occupantCount >= r.capacity).length;

  const refYear = TOUR_REFERENCE_DATE.getFullYear();
  const refMonth = TOUR_REFERENCE_DATE.toLocaleString("es", { month: "long" });

  return (
    <div className="flex flex-col gap-4" onDragLeave={() => setDragOverRoomId(null)} onDragEnd={handleDragEnd}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Habitaciones</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {rooms.length} hab · {totalOccupants}/{totalCapacity} ocupados · {fullCount} completas
          </p>
          <p className="text-[10px] text-gray-300 mt-0.5">
            Edades al {refMonth} {refYear} · ordenadas de menor a mayor edad
          </p>
        </div>
        <button
          onClick={onAddRoom}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-all"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva
        </button>
      </div>

      {rooms.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-3xl mb-2">🏨</p>
          <p className="text-xs text-gray-400">Sin habitaciones. Creá una o generá desde grupos.</p>
        </div>
      )}

      {/* Compact grid — auto-fill so columns adapt to available width */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        {sortedRooms.map((room) => (
          <RoomPlannerCard
            key={room.id}
            room={room}
            rooms={rooms}
            sexOverrides={sexOverrides}
            onDragStart={onDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMove={onMove}
            onEdit={onEdit}
            onDelete={onDelete}
            onCapacityChange={onCapacityChange}
            movingId={movingId}
            dragOverRoomId={dragOverRoomId}
          />
        ))}
      </div>
    </div>
  );
}