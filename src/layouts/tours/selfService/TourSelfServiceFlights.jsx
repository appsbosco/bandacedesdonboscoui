/* eslint-disable react/prop-types */
import { Clock3, PlaneLanding, PlaneTakeoff } from "lucide-react";

const DIRECTION_LABELS = {
  OUTBOUND: "Ida",
  INBOUND: "Regreso",
  CONNECTING: "Conexión",
};

function formatLocal(value) {
  if (!value) return "Por confirmar";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) {
    return new Date(value).toLocaleString("es-CR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
  const [, year, month, day, hours, minutes] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  const dateLabel = date.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const hour = Number(hours) % 12 || 12;
  const suffix = Number(hours) >= 12 ? "p. m." : "a. m.";
  return `${dateLabel}, ${hour}:${minutes} ${suffix}`;
}

export default function TourSelfServiceFlights({ flights = [], loading }) {
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />;

  if (!flights.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <PlaneTakeoff className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
        <p className="mt-3 text-sm font-bold text-slate-800">Vuelo por publicar</p>
        <p className="mt-1 text-xs text-slate-500">
          Coordinación todavía no ha publicado tus vuelos asignados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
          Plan aéreo personal
        </p>
        <h2 className="mt-1 text-lg font-black text-slate-950">Mis vuelos</h2>
      </div>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {flights.map((flight) => {
          const returning = flight.direction === "INBOUND";
          const Icon = returning ? PlaneLanding : PlaneTakeoff;
          return (
            <article key={flight.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900">
                      {flight.airline} {flight.flightNumber}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {flight.origin} <span className="px-1 text-blue-400">→</span>{" "}
                      {flight.destination}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  {DIRECTION_LABELS[flight.direction] || flight.direction}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-2">
                <div>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Salida local
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {formatLocal(flight.departureLocal || flight.departureAt)}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Llegada local
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {formatLocal(flight.arrivalLocal || flight.arrivalAt)}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
