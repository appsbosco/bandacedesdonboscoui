/* eslint-disable react/prop-types */
import ItineraryCard from "../tourFlights/ItineraryCard";

export default function TourSelfServiceItinerary({ itinerary, loading }) {
  if (loading) return <div className="h-72 bg-gray-100 rounded-2xl animate-pulse" />;
  if (!itinerary) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">Plan de viaje</p>
          <h2 className="text-lg font-bold text-slate-900">Tu itinerario asignado</h2>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">Publicado</span>
      </div>
      <ItineraryCard itinerary={itinerary} readOnly />
    </div>
  );
}
