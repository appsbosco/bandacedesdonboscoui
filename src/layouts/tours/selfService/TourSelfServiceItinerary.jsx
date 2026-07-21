/* eslint-disable react/prop-types */
import ItineraryCard from "../tourFlights/ItineraryCard";
import WhatsAppIcon from "../tourFlights/WhatsAppIcon";

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
      <ItineraryCard
        itinerary={itinerary}
        readOnly
        headerAction={
          itinerary.whatsappGroupUrl ? (
            <a
              href={itinerary.whatsappGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-200 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              aria-label="Unirme al grupo de WhatsApp"
              title="Unirme al grupo de WhatsApp"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          ) : null
        }
      />
    </div>
  );
}
