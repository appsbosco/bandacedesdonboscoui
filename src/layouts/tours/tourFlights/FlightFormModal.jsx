/* eslint-disable react/prop-types */
/**
 * FlightFormModal — crear / editar un vuelo de gira.
 * Incluye campo routeGroup para agrupar vuelos en una ruta completa.
 */
import { useState, useEffect } from "react";

const DIRECTIONS = [
  { value: "OUTBOUND", label: "Ida", emoji: "🛫" },
  { value: "INBOUND", label: "Vuelta", emoji: "🛬" },
  { value: "CONNECTING", label: "Conexión", emoji: "🔄" },
];

function toInputDatetime(isoString) {
  if (!isoString) return "";
  return isoString.slice(0, 16);
}

const EMPTY = {
  airline: "",
  flightNumber: "",
  origin: "",
  destination: "",
  departureAt: "",
  arrivalAt: "",
  direction: "OUTBOUND",
  notes: "",
};

export default function FlightFormModal({
  isOpen,
  mode,
  flight,
  onClose,
  onSubmit,
  loading,
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && flight) {
      setForm({
        airline:     flight.airline || "",
        flightNumber: flight.flightNumber || "",
        origin:      flight.origin || "",
        destination: flight.destination || "",
        departureAt: toInputDatetime(flight.departureAt),
        arrivalAt:   toInputDatetime(flight.arrivalAt),
        direction:   flight.direction || "OUTBOUND",
        notes:       flight.notes || "",
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [isOpen, mode, flight]);

  if (!isOpen) return null;

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.airline.trim()) e.airline = "Requerido";
    if (!form.flightNumber.trim()) e.flightNumber = "Requerido";
    if (!form.origin.trim()) e.origin = "Requerido";
    if (!form.destination.trim()) e.destination = "Requerido";
    if (!form.departureAt) e.departureAt = "Requerido";
    if (!form.arrivalAt) e.arrivalAt = "Requerido";
    if (form.departureAt && form.arrivalAt && form.arrivalAt <= form.departureAt) {
      e.arrivalAt = "Debe ser posterior a la salida";
    }
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) return setErrors(e);
    onSubmit({
      airline:      form.airline.trim(),
      flightNumber: form.flightNumber.trim(),
      origin:       form.origin.trim().toUpperCase(),
      destination:  form.destination.trim().toUpperCase(),
      departureAt:  new Date(form.departureAt).toISOString(),
      arrivalAt:    new Date(form.arrivalAt).toISOString(),
      direction:    form.direction,
      notes:        form.notes.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {mode === "create" ? "Nuevo vuelo" : "Editar vuelo"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === "create" ? "Registrá los datos del vuelo" : "Modificá los datos del vuelo"}
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
          {/* Direction tabs */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Dirección
            </label>
            <div className="flex gap-2">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => set("direction", d.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    form.direction === d.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <span>{d.emoji}</span>
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Route info (read-only legacy field — route assignment is done in the Routes tab) */}
          {mode === "edit" && flight?.route && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
              <span className="text-blue-500 text-sm">🔗</span>
              <p className="text-xs text-blue-700">
                Ruta: <strong>{flight.route.name}</strong>
                {" — "}la asignación de ruta se gestiona desde la pestaña <strong>Rutas</strong>.
              </p>
            </div>
          )}

          {/* Airline + Flight Number */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Aerolínea"
              placeholder="Ej: Copa Airlines"
              value={form.airline}
              error={errors.airline}
              onChange={(v) => set("airline", v)}
            />
            <Field
              label="N° de vuelo"
              placeholder="Ej: CM401"
              value={form.flightNumber}
              error={errors.flightNumber}
              onChange={(v) => set("flightNumber", v)}
            />
          </div>

          {/* Origin + Destination */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Origen"
              placeholder="Ej: SJO"
              value={form.origin}
              error={errors.origin}
              onChange={(v) => set("origin", v)}
            />
            <Field
              label="Destino"
              placeholder="Ej: LAX"
              value={form.destination}
              error={errors.destination}
              onChange={(v) => set("destination", v)}
            />
          </div>

          {/* Departure + Arrival */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Salida"
              type="datetime-local"
              value={form.departureAt}
              error={errors.departureAt}
              onChange={(v) => set("departureAt", v)}
            />
            <Field
              label="Llegada"
              type="datetime-local"
              value={form.arrivalAt}
              error={errors.arrivalAt}
              onChange={(v) => set("arrivalAt", v)}
            />
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
              placeholder="Información adicional del vuelo..."
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
            {loading ? "Guardando…" : mode === "create" ? "Crear vuelo" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, error, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all ${
          error ? "border-red-400 bg-red-50" : "border-gray-200"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
