/* eslint-disable react/prop-types */
/**
 * ItineraryFormModal — create or edit a TourItinerary (roundtrip package).
 * No direction selection — the itinerary covers ALL legs (outbound + inbound).
 */
import { useState, useEffect } from "react";

const EMPTY = { name: "", notes: "", maxPassengers: "60" };

export default function ItineraryFormModal({ isOpen, mode, itinerary, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setForm(
      mode === "edit" && itinerary
        ? {
            name: itinerary.name || "",
            notes: itinerary.notes || "",
            maxPassengers: String(itinerary.maxPassengers ?? 60),
          }
        : EMPTY
    );
    setErrors({});
  }, [isOpen, mode, itinerary]);

  if (!isOpen) return null;

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Requerido";

    const maxP = parseInt(form.maxPassengers, 10);
    if (!form.maxPassengers || isNaN(maxP) || maxP < 1) {
      newErrors.maxPassengers = "Debe ser un número entero >= 1";
    }

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    onSubmit({
      name: form.name.trim(),
      notes: form.notes.trim() || undefined,
      maxPassengers: maxP,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {mode === "create" ? "Nuevo itinerario" : "Editar itinerario"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Un itinerario agrupa todos los vuelos de una cotización (ida + vuelta).
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Nombre del itinerario *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej: United Cotización 1"
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all ${
                errors.name ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Max passengers */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Cupo máximo *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.maxPassengers}
              onChange={(e) => set("maxPassengers", e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all ${
                errors.maxPassengers ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            />
            {errors.maxPassengers && (
              <p className="text-xs text-red-500 mt-1">{errors.maxPassengers}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Número máximo de pasajeros para este itinerario. No podrá asignarse más pasajeros
              que este límite.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Notas <span className="normal-case font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Información adicional del itinerario..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm disabled:opacity-50 transition-all"
          >
            {loading ? "Guardando…" : mode === "create" ? "Crear itinerario" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
