/* eslint-disable react/prop-types */
/**
 * RouteFormModal — create or edit a TourRoute.
 */
import { useState, useEffect } from "react";

const DIRECTIONS = [
  { value: "OUTBOUND", label: "Ida", emoji: "🛫", desc: "Vuelos de salida" },
  { value: "INBOUND",  label: "Vuelta", emoji: "🛬", desc: "Vuelos de regreso" },
];

const EMPTY = { name: "", direction: "OUTBOUND", origin: "", destination: "", notes: "" };

export default function RouteFormModal({ isOpen, mode, route, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && route) {
      setForm({
        name:        route.name || "",
        direction:   route.direction || "OUTBOUND",
        origin:      route.origin || "",
        destination: route.destination || "",
        notes:       route.notes || "",
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [isOpen, mode, route]);

  if (!isOpen) return null;

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Requerido";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) return setErrors(e);
    onSubmit({
      name:        form.name.trim(),
      direction:   form.direction,
      origin:      form.origin.trim().toUpperCase() || undefined,
      destination: form.destination.trim().toUpperCase() || undefined,
      notes:       form.notes.trim() || undefined,
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
              {mode === "create" ? "Nueva ruta" : "Editar ruta"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === "create"
                ? "Define un itinerario completo (ida o vuelta)"
                : "Modificá los datos de la ruta"}
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
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Direction */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Dirección
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => set("direction", d.value)}
                  className={`flex flex-col items-center py-3 px-2 rounded-2xl border-2 transition-all text-sm font-semibold ${
                    form.direction === d.value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg mb-0.5">{d.emoji}</span>
                  <span>{d.label}</span>
                  <span className={`text-xs font-normal mt-0.5 ${form.direction === d.value ? "text-gray-300" : "text-gray-400"}`}>
                    {d.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Nombre de la ruta *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej: United Cotización 1 — Ida"
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all ${
                errors.name ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Origin + Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Origen <span className="normal-case font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.origin}
                onChange={(e) => set("origin", e.target.value)}
                placeholder="Ej: SJO"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Destino <span className="normal-case font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => set("destination", e.target.value)}
                placeholder="Ej: LAX"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
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
              placeholder="Información adicional de la ruta..."
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
            {loading ? "Guardando…" : mode === "create" ? "Crear ruta" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
