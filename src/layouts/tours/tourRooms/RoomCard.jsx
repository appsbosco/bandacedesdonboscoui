/* eslint-disable react/prop-types */
/**
 * RoomCard — tarjeta individual de una habitación.
 */

const ROOM_TYPE_CONFIG = {
  SINGLE: { label: "Individual", emoji: "🛏️", className: "bg-gray-50 text-gray-600 border-gray-100" },
  DOUBLE: { label: "Doble", emoji: "🛏️🛏️", className: "bg-blue-50 text-blue-700 border-blue-100" },
  TRIPLE: { label: "Triple", emoji: "🛏️🛏️🛏️", className: "bg-violet-50 text-violet-700 border-violet-100" },
  QUAD: { label: "Cuádruple", emoji: "🏨", className: "bg-amber-50 text-amber-700 border-amber-100" },
  SUITE: { label: "Suite", emoji: "⭐", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
};

function participantName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

export default function RoomCard({ room, onEdit, onDelete, onManageOccupants }) {
  const cfg = ROOM_TYPE_CONFIG[room.roomType] || ROOM_TYPE_CONFIG.SINGLE;
  const occupancyPct = room.capacity > 0 ? (room.occupantCount / room.capacity) * 100 : 0;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
        room.isFull ? "border-emerald-200" : "border-gray-200"
      }`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.className}`}
          >
            <span>{cfg.emoji}</span>
            <span>{cfg.label}</span>
          </span>
          <span className="text-sm font-bold text-gray-900">Hab. {room.roomNumber}</span>
          {room.floor && (
            <span className="text-xs text-gray-400">· Piso {room.floor}</span>
          )}
          {room.isFull && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Completa
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(room)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
            title="Editar habitación"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(room)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
            title="Eliminar habitación"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Hotel */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs text-gray-400">Hotel</p>
        <p className="text-sm font-semibold text-gray-800">{room.hotelName}</p>
        {room.responsible && (
          <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-0.5">
            <span>👑</span>
            <span>{participantName(room.responsible)}</span>
          </p>
        )}
      </div>

      {/* Occupancy bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Ocupación</span>
          <span className="text-xs font-semibold text-gray-700">
            {room.occupantCount}/{room.capacity}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              room.isFull ? "bg-emerald-500" : occupancyPct > 50 ? "bg-blue-400" : "bg-gray-300"
            }`}
            style={{ width: `${Math.min(occupancyPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Occupants preview */}
      {room.occupants?.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1">
            {room.occupants.slice(0, 3).map(({ participant }) => (
              <span
                key={participant.id}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full truncate max-w-[140px]"
              >
                {participantName(participant)}
              </span>
            ))}
            {room.occupants.length > 3 && (
              <span className="text-xs text-gray-400 px-2 py-0.5">
                +{room.occupants.length - 3} más
              </span>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {room.notes && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 italic line-clamp-1">{room.notes}</p>
        </div>
      )}

      {/* Footer: manage occupants */}
      <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-gray-50">
        <button
          onClick={() => onManageOccupants(room)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 transition-all group"
        >
          <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-800">
            Gestionar ocupantes
          </span>
        </button>
        {room.updatedBy && (
          <p className="text-xs text-gray-400">Editado por {room.updatedBy.name}</p>
        )}
      </div>
    </div>
  );
}
