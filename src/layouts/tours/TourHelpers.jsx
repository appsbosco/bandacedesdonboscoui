/* eslint-disable react/prop-types */

/**
 * tours/components/TourHelpers.jsx
 * Pequeños helpers visuales compartidos en el módulo de giras.
 */

export const TOUR_STATUS_CONFIG = {
  DRAFT: {
    label: "Borrador",
    className: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
  ACTIVE: {
    label: "Activa",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  CLOSED: {
    label: "Cerrada",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-400",
  },
  CANCELLED: {
    label: "Cancelada",
    className: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-400",
  },
};

export function TourStatusBadge({ status }) {
  const cfg = TOUR_STATUS_CONFIG[status] || TOUR_STATUS_CONFIG.DRAFT;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function formatTourDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getTourDuration(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return days > 0 ? `${days} día${days !== 1 ? "s" : ""}` : null;
}

export function formatTourDateRange(startDate, endDate) {
  if (!startDate) return "Sin fecha";

  console.log("Start date", startDate);
  const start = formatTourDate(startDate);
  const end = endDate ? formatTourDate(endDate) : null;
  return end ? `${start} — ${end}` : start;
}

/** Toast genérico reutilizable */
export function Toast({ message, type, onClose }) {
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-medium max-w-xs animate-fade-in ${
        type === "success" ? "bg-gray-900" : "bg-red-600"
      }`}
    >
      {type === "success" ? (
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      )}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 text-lg leading-none">
        ×
      </button>
    </div>
  );
}

/** Modal de confirmación de borrado */
export function DeleteConfirmModal({ tour, onConfirm, onCancel, loading }) {
  if (!tour) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Eliminar gira</h3>
          <p className="text-xs text-slate-500 mt-0.5">Esta acción no se puede deshacer</p>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            ¿Estás seguro de que quieres eliminar la gira
            <span className="font-semibold">{tour.name}</span>?
          </p>
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
