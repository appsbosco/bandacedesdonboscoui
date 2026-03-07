/* eslint-disable react/prop-types */
/**
 * RoomDeleteModal — confirmar eliminación de una habitación.
 */

export default function RoomDeleteModal({ room, onConfirm, onCancel, loading }) {
  if (!room) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Eliminar habitación</h3>
          <p className="text-xs text-slate-500 mt-0.5">Esta acción no se puede deshacer</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
            <p className="text-sm font-bold text-gray-900">
              {room.hotelName} · Hab. {room.roomNumber}
            </p>
            <p className="text-xs text-gray-500">
              {room.roomType} · Capacidad {room.capacity}
            </p>
            {room.occupantCount > 0 && (
              <p className="text-xs text-amber-600 font-medium mt-1.5">
                ⚠️ Esta habitación tiene {room.occupantCount} ocupante
                {room.occupantCount !== 1 ? "s" : ""} asignado
                {room.occupantCount !== 1 ? "s" : ""}.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-50 transition-all"
            >
              {loading ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
