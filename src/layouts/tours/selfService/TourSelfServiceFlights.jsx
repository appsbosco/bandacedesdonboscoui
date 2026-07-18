/* eslint-disable react/prop-types */
const formatLocal = (value) => value ? new Date(value).toLocaleString("es-CR", { dateStyle: "medium", timeStyle: "short" }) : "—";
export default function TourSelfServiceFlights({ flights = [], loading }) {
  if (loading) return <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />;
  if (!flights.length) return <div className="bg-gray-50 border rounded-2xl p-8 text-center"><p className="text-2xl">✈️</p><p className="text-sm font-semibold">Aún no tienes vuelos asignados</p></div>;
  return <div className="space-y-3">{flights.map((flight) => <div key={flight.id} className="bg-white border rounded-2xl p-4"><div className="flex justify-between"><span className="text-sm font-bold">{flight.airline} {flight.flightNumber}</span><span className="text-xs text-gray-500">{flight.direction === "OUTBOUND" ? "Ida" : flight.direction === "RETURN" ? "Regreso" : flight.direction}</span></div><p className="text-sm font-semibold my-2">{flight.origin} → {flight.destination}</p><div className="grid grid-cols-2 gap-3 text-xs"><div><p className="text-gray-400">Salida</p><p>{formatLocal(flight.departureLocal || flight.departureAt)}</p></div><div><p className="text-gray-400">Llegada</p><p>{formatLocal(flight.arrivalLocal || flight.arrivalAt)}</p></div></div></div>)}</div>;
}
