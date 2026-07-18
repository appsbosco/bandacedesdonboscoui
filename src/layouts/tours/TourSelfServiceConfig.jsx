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
import { useMutation, useQuery } from "@apollo/client";
import { UPDATE_TOUR_SELF_SERVICE_ACCESS } from "./tours.gql";
import { GET_TOUR_ITINERARIES } from "./tourFlights/tourItineraries.gql";

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
    rooms: false, itinerary: false, itineraryIds: [], flights: false,
  };

  const [form, setForm] = useState({ ...ssa });
  const [saved, setSaved] = useState(false);
  const { data: itinerariesData, loading: itinerariesLoading } = useQuery(GET_TOUR_ITINERARIES, {
    variables: { tourId: tour?.id },
    skip: !tour?.id,
    fetchPolicy: "cache-and-network",
  });
  const itineraries = itinerariesData?.getTourItineraries || [];
  const selectedItineraryIds = new Set(form.itineraryIds || []);

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
    if (form.enabled && form.itinerary && !(form.itineraryIds || []).length) {
      alert("Selecciona al menos un itinerario para habilitar el acceso.");
      return;
    }
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
          type="button"
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
          <button
            type="button"
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
          </button>
        ))}
      </div>

      {form.enabled && form.itinerary && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Itinerarios publicados</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Solo los pasajeros asignados a los itinerarios seleccionados verán la pestaña.
              </p>
            </div>
            <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">
              {(form.itineraryIds || []).length} seleccionados
            </span>
          </div>
          {itinerariesLoading ? (
            <div className="h-20 rounded-xl bg-white/70 animate-pulse" />
          ) : itineraries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-blue-200 bg-white p-4 text-center text-xs text-slate-500">
              Todavía no hay itinerarios creados para esta gira.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {itineraries.map((itinerary) => {
                const selected = selectedItineraryIds.has(itinerary.id);
                return (
                  <label key={itinerary.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${selected ? "border-blue-400 bg-white shadow-sm" : "border-blue-100 bg-white/60 hover:border-blue-300"}`}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => setForm((current) => ({
                        ...current,
                        itineraryIds: selected
                          ? (current.itineraryIds || []).filter((id) => id !== itinerary.id)
                          : [...(current.itineraryIds || []), itinerary.id],
                      }))}
                      className="mt-0.5 h-4 w-4 accent-blue-600"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-800">{itinerary.name}</span>
                      <span className="block text-[11px] text-slate-500">
                        {itinerary.passengerCount} pasajeros · {itinerary.flightCount} vuelos
                        {itinerary.reservationNumber ? ` · Reserva ${itinerary.reservationNumber}` : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Guardar */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
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
