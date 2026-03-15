/* eslint-disable react/prop-types */
/**
 * TourSelfServiceConfig
 * Panel de configuración de acceso self-service por gira.
 * Solo visible y usable por Admin.
 *
 * Props:
 *   - tour: { id, selfServiceAccess }
 *   - onSaved: () => void  (callback para refetch)
 */
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_TOUR_SELF_SERVICE_ACCESS } from "./tours.gql";

const MODULE_LABELS = {
  documents: { label: "Documentos",    emoji: "📄", description: "Visas, pasaportes, permiso de salida" },
  payments:  { label: "Pagos",         emoji: "💰", description: "Estado de cuenta y cuotas" },
  rooms:     { label: "Habitaciones",  emoji: "🏨", description: "Habitación asignada" },
  itinerary: { label: "Itinerario",    emoji: "🗺️", description: "Itinerario de la gira" },
  flights:   { label: "Vuelos",        emoji: "✈️", description: "Vuelos asignados" },
};

export default function TourSelfServiceConfig({ tour, onSaved }) {
  const ssa = tour?.selfServiceAccess ?? {
    enabled: false, documents: true, payments: true,
    rooms: false, itinerary: false, flights: false,
  };

  const [form, setForm] = useState({ ...ssa });
  const [saved, setSaved] = useState(false);

  const [updateSelfService, { loading }] = useMutation(UPDATE_TOUR_SELF_SERVICE_ACCESS, {
    onCompleted: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved?.();
    },
    onError: (e) => alert(e.message || "Error al guardar configuración"),
  });

  const toggle = (key) => setForm((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => {
    // Eliminar __typename que Apollo agrega al cache — input types no lo aceptan
    const { __typename, ...cleanInput } = form;
    updateSelfService({ variables: { tourId: tour.id, input: cleanInput } });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Acceso self-service</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Configura qué módulos pueden ver los participantes vinculados.
          </p>
        </div>

        {/* Master switch */}
        <button
          onClick={() => toggle("enabled")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
            form.enabled
              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
              : "bg-gray-50 border-gray-200 text-gray-600"
          }`}
        >
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            form.enabled ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
          }`}>
            {form.enabled && <span className="w-2 h-2 bg-white rounded-full" />}
          </span>
          {form.enabled ? "Habilitado" : "Deshabilitado"}
        </button>
      </div>

      {/* Módulos individuales */}
      <div className={`space-y-2 transition-opacity ${form.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        {Object.entries(MODULE_LABELS).map(([key, { label, emoji, description }]) => (
          <div
            key={key}
            onClick={() => toggle(key)}
            className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
              form[key]
                ? "bg-blue-50 border-blue-200"
                : "bg-gray-50 border-gray-100 hover:border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-500 truncate">{description}</p>
              </div>
            </div>
            <div
              className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${
                form[key] ? "bg-blue-500 justify-end" : "bg-gray-300 justify-start"
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        ))}
      </div>

      {/* Guardar */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-5 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60"
        >
          {loading ? "Guardando…" : "Guardar configuración"}
        </button>
        {saved && (
          <span className="text-xs text-emerald-600 font-semibold">✓ Guardado</span>
        )}
      </div>
    </div>
  );
}
