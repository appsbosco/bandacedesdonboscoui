/* eslint-disable react/prop-types */
const formatDate = (value) => value ? new Date(value).toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" }) : "—";
export default function TourSelfServiceItinerary({ itinerary, loading }) {
  if (loading) return <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />;
  if (!itinerary) return <div className="bg-gray-50 border rounded-2xl p-8 text-center"><p className="text-2xl">🗺️</p><p className="text-sm font-semibold">Aún no tienes itinerario asignado</p></div>;
  const dates = (itinerary.flights || []).flatMap((flight) => [flight.departureAt, flight.arrivalAt]).filter(Boolean).map((date) => new Date(date));
  return <div className="bg-white border rounded-2xl p-5 space-y-4"><div><p className="text-xs text-gray-400 uppercase">Itinerario</p><h3 className="text-lg font-bold">{itinerary.name}</h3></div><div className="grid sm:grid-cols-2 gap-4"><div><p className="text-xs text-gray-500">Número de reserva</p><p className="text-sm font-semibold">{itinerary.reservationNumber || "—"}</p></div>{dates.length > 0 && <div><p className="text-xs text-gray-500">Fechas</p><p className="text-sm font-semibold">{formatDate(new Date(Math.min(...dates)))} — {formatDate(new Date(Math.max(...dates)))}</p></div>}</div>{itinerary.notes && <p className="bg-gray-50 rounded-xl p-3 text-sm">{itinerary.notes}</p>}</div>;
}
