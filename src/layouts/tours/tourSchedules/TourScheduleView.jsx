/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plane,
  PlaneTakeoff,
  UsersRound,
} from "lucide-react";

const SHORT_DATE_FORMAT = new Intl.DateTimeFormat("es-CR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const FULL_DATE_FORMAT = new Intl.DateTimeFormat("es-CR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const WEEKDAY_FORMAT = new Intl.DateTimeFormat("es-CR", {
  weekday: "short",
  timeZone: "UTC",
});
const MONTH_FORMAT = new Intl.DateTimeFormat("es-CR", {
  month: "short",
  timeZone: "UTC",
});

function dateKey(value) {
  return String(value || "").slice(0, 10);
}

function utcDate(value) {
  return new Date(`${dateKey(value)}T12:00:00.000Z`);
}

function cleanDateLabel(value, formatter = SHORT_DATE_FORMAT) {
  const label = formatter.format(utcDate(value)).replaceAll(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function todayInTimeZone(timeZone) {
  const formattedParts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(new Date());
  const parts = {};
  formattedParts.forEach((part) => {
    parts[part.type] = part.value;
  });
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatClock(value) {
  if (!value) return null;
  const match = String(value).match(/(?:T|^)(\d{2}):(\d{2})/);
  if (!match) return value;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "p. m." : "a. m.";
  return `${hours % 12 || 12}:${match[2]} ${suffix}`;
}

function formatFlightMoment(value) {
  if (!value) return "Por confirmar";
  return `${cleanDateLabel(value)}, ${formatClock(value)}`;
}

export function splitFlightJourney(flights) {
  const returnStart = flights.findIndex((flight) => flight.direction === "INBOUND");

  if (returnStart < 0) {
    return {
      outbound: flights.filter((flight) => flight.direction !== "INBOUND"),
      returning: [],
    };
  }

  return {
    outbound: flights.slice(0, returnStart),
    returning: flights.slice(returnStart),
  };
}

function daySelectionKey(day, index) {
  return String(day.id || day.clientId || `${dateKey(day.date)}-${index}`);
}

function personalizeTravelDays(scheduleDays, flightJourney) {
  const lastDayIndex = scheduleDays.length - 1;
  const finalOutboundFlight = flightJourney.outbound[flightJourney.outbound.length - 1];
  const firstReturnFlight = flightJourney.returning[0];

  return scheduleDays.map((day, index) => {
    const isOutboundDay = index === 0;
    const isReturnDay = index === lastDayIndex;
    let displayDate = day.date;
    let assignedFlights = [];
    let journeyDirection = null;

    if (isOutboundDay) {
      assignedFlights = flightJourney.outbound;
      journeyDirection = "outbound";
      displayDate = finalOutboundFlight?.arrivalLocal || finalOutboundFlight?.arrivalAt || day.date;
    } else if (isReturnDay) {
      assignedFlights = flightJourney.returning;
      journeyDirection = "returning";
      displayDate = firstReturnFlight?.departureLocal || firstReturnFlight?.departureAt || day.date;
    }

    return {
      ...day,
      displayDate,
      assignedFlights,
      journeyDirection,
      selectionKey: daySelectionKey(day, index),
    };
  });
}

function FlightPanel({ flights, loading, direction, destination }) {
  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-slate-100" />;

  if (!flights.length) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-slate-600">
        <PlaneTakeoff className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="text-xs">El vuelo asignado aparecerá cuando coordinación lo publique.</p>
      </div>
    );
  }

  const isReturning = direction === "returning";
  const endpointFlight = isReturning ? flights[0] : flights[flights.length - 1];
  const endpointMoment = isReturning
    ? endpointFlight.departureLocal || endpointFlight.departureAt
    : endpointFlight.arrivalLocal || endpointFlight.arrivalAt;
  const endpointAirport = isReturning ? endpointFlight.origin : endpointFlight.destination;

  return (
    <div className="overflow-hidden rounded-xl border border-blue-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/70 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
            <PlaneTakeoff
              className={`h-4 w-4 ${isReturning ? "-scale-x-100" : ""}`}
              aria-hidden="true"
            />
          </span>
          <div>
            <p className="text-xs font-bold text-slate-900">
              Tu itinerario de {isReturning ? "regreso" : "ida"}
            </p>
            <p className="text-[11px] text-slate-500">
              {flights.length} {flights.length === 1 ? "vuelo" : "vuelos"} asignados
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">
            {isReturning ? `Salida de ${endpointAirport}` : `Llegada a ${destination}`}
          </p>
          <p className="mt-0.5 text-xs font-bold text-slate-900">
            {formatFlightMoment(endpointMoment)}
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {flights.map((flight, index) => (
          <div key={flight.id} className="px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Tramo {index + 1}
                </p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">
                  {flight.airline} {flight.flightNumber}
                </p>
              </div>
              <div className="flex items-center gap-3 text-base font-bold text-slate-900">
                <span>{flight.origin}</span>
                <span className="flex items-center gap-1 text-blue-500" aria-hidden="true">
                  <span className="h-px w-5 bg-blue-200" />
                  <Plane className="h-4 w-4" />
                  <span className="h-px w-5 bg-blue-200" />
                </span>
                <span>{flight.destination}</span>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 sm:gap-6">
              <p>
                Salida local
                <strong className="ml-2 font-semibold text-slate-800">
                  {formatFlightMoment(flight.departureLocal || flight.departureAt)}
                </strong>
              </p>
              <p>
                Llegada local
                <strong className="ml-2 font-semibold text-slate-800">
                  {formatFlightMoment(flight.arrivalLocal || flight.arrivalAt)}
                </strong>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityList({ events }) {
  const hasScheduledTimes = events.some((event) => event.startTime);

  return (
    <div>
      {!hasScheduledTimes && events.length > 0 && (
        <p className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          Horarios por confirmar
        </p>
      )}
      <ol className="divide-y divide-slate-100 border-y border-slate-100">
        {events.map((event, index) => (
          <li
            key={event.id || event.clientId || `${event.order}-${event.title}`}
            className={`group grid gap-2 py-4 transition-colors hover:bg-slate-50/80 sm:gap-5 sm:px-2 ${
              hasScheduledTimes ? "sm:grid-cols-[7rem_1fr]" : "sm:grid-cols-[2rem_1fr]"
            }`}
          >
            {hasScheduledTimes ? (
              <p className="pt-0.5 text-xs font-semibold tabular-nums text-slate-500">
                {event.startTime ? formatClock(event.startTime) : ""}
                {event.endTime ? (
                  <span className="mt-0.5 block font-normal text-slate-400">
                    hasta {formatClock(event.endTime)}
                  </span>
                ) : null}
              </p>
            ) : (
              <span className="hidden pt-0.5 text-xs font-medium tabular-nums text-slate-300 sm:block">
                {String(index + 1).padStart(2, "0")}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium leading-6 text-slate-800">{event.title}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                {event.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {event.location}
                  </span>
                )}
                {event.audience === "DIRECTORS" && (
                  <span className="inline-flex items-center gap-1">
                    <UsersRound className="h-3 w-3" aria-hidden="true" />
                    Solo Dirección y Drum Majors
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DaySection({
  day,
  dayIndex,
  totalDays,
  flightsLoading,
  showFlights,
  compact,
  destination,
}) {
  const isTravelDay = dayIndex === 0 || dayIndex === totalDays - 1;

  return (
    <section aria-labelledby={`schedule-day-${day.id || dayIndex}`}>
      <header className="mb-5 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-slate-500">
            {cleanDateLabel(day.displayDate, FULL_DATE_FORMAT)}
          </p>
          {compact && <span className="text-[11px] text-slate-400">Día {dayIndex + 1}</span>}
        </div>
        <h3
          id={`schedule-day-${day.id || dayIndex}`}
          className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl"
        >
          {day.title}
        </h3>
      </header>

      <div className="space-y-5">
        {showFlights && isTravelDay && (
          <FlightPanel
            flights={day.assignedFlights}
            loading={flightsLoading}
            direction={day.journeyDirection}
            destination={destination}
          />
        )}
        <ActivityList events={day.events} />
      </div>
    </section>
  );
}

function DayPicker({ days, selectedDay, today, onSelect }) {
  return (
    <nav
      className="sticky top-0 z-20 -mx-1 overflow-x-auto bg-slate-50/95 px-1 py-2 backdrop-blur-sm"
      aria-label="Filtrar itinerario por día"
    >
      <div className="flex min-w-max items-stretch gap-2">
        <button
          type="button"
          onClick={() => onSelect("all")}
          aria-pressed={selectedDay === "all"}
          className={`min-w-16 rounded-xl border px-3 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            selectedDay === "all"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          Todos
        </button>
        {days.map((day, index) => {
          const key = day.selectionKey;
          const active = selectedDay === key;
          const isToday = dateKey(day.displayDate) === today;
          return (
            <button
              type="button"
              key={day.id || key}
              onClick={() => onSelect(key)}
              aria-pressed={active}
              aria-label={`Ver día ${index + 1}, ${cleanDateLabel(
                day.displayDate,
                FULL_DATE_FORMAT
              )}`}
              className={`relative min-w-[4.25rem] rounded-xl border px-3 py-2 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                active
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
              }`}
            >
              {isToday && (
                <span
                  className={`absolute right-2 top-2 h-1.5 w-1.5 rounded-full ${
                    active ? "bg-white" : "bg-blue-600"
                  }`}
                  aria-label="Hoy"
                />
              )}
              <span
                className={`block text-[10px] font-medium uppercase ${
                  active ? "text-blue-100" : "text-slate-400"
                }`}
              >
                {WEEKDAY_FORMAT.format(utcDate(day.displayDate)).replaceAll(".", "")}
              </span>
              <span className="mt-0.5 block text-lg font-bold leading-none">
                {utcDate(day.displayDate).getUTCDate()}
              </span>
              <span
                className={`mt-0.5 block text-[10px] ${
                  active ? "text-blue-100" : "text-slate-400"
                }`}
              >
                {MONTH_FORMAT.format(utcDate(day.displayDate)).replaceAll(".", "")}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function TourScheduleView({
  schedule,
  flights = [],
  loading,
  flightsLoading = false,
  showFlights = true,
  preview = false,
  tourName = "Gira BCDB",
  destination = "Los Ángeles",
}) {
  const flightJourney = useMemo(() => splitFlightJourney(flights), [flights]);
  const days = useMemo(
    () => personalizeTravelDays(schedule?.days || [], flightJourney),
    [flightJourney, schedule?.days]
  );
  const today = useMemo(
    () => todayInTimeZone(schedule?.timeZone || "America/Los_Angeles"),
    [schedule?.timeZone]
  );
  const defaultDay = useMemo(() => {
    if (!days.length) return "all";
    return (
      days.find((day) => dateKey(day.displayDate) === today)?.selectionKey || days[0].selectionKey
    );
  }, [days, today]);
  const [selectedDay, setSelectedDay] = useState(defaultDay);

  useEffect(() => setSelectedDay(defaultDay), [defaultDay]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-24 rounded-2xl bg-slate-100" />
        <div className="h-16 rounded-2xl bg-slate-100" />
        <div className="h-72 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!schedule || !days.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <span className="text-3xl" aria-hidden="true">
          🗓️
        </span>
        <p className="mt-3 text-sm font-bold text-slate-800">Itinerario por publicar</p>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
          La agenda aparecerá aquí cuando coordinación termine de prepararla.
        </p>
      </div>
    );
  }

  const selectedIndex = days.findIndex((day) => day.selectionKey === selectedDay);
  const visibleDays =
    selectedDay === "all" ? days : selectedIndex >= 0 ? [days[selectedIndex]] : [];
  const firstDate = days[0].displayDate;
  const lastDate = days[days.length - 1].displayDate;

  const goToDay = (index) => {
    if (index < 0 || index >= days.length) return;
    setSelectedDay(days[index].selectionKey);
  };

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{tourName}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {cleanDateLabel(firstDate)} al {cleanDateLabel(lastDate)} · {destination}
        </p>
      </header>

      {schedule.notice && (
        <details className="group rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">
            <span>Posible cambio entre el 28 y 30 de diciembre</span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="mt-2 max-w-2xl border-t border-slate-100 pt-2 text-xs leading-5 text-slate-500">
            {schedule.notice}
          </p>
        </details>
      )}

      <DayPicker days={days} selectedDay={selectedDay} today={today} onSelect={setSelectedDay} />

      <div
        key={selectedDay}
        className="animate-fade-in space-y-12 rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm motion-reduce:animate-none sm:px-7 sm:py-7"
      >
        {visibleDays.map((day) => {
          const dayIndex = days.indexOf(day);
          return (
            <DaySection
              key={day.selectionKey}
              day={day}
              dayIndex={dayIndex}
              totalDays={days.length}
              flightsLoading={flightsLoading}
              showFlights={showFlights}
              compact={selectedDay === "all"}
              destination={destination}
            />
          );
        })}
      </div>

      {selectedDay !== "all" && selectedIndex >= 0 && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => goToDay(selectedIndex - 1)}
            disabled={selectedIndex === 0}
            className="inline-flex h-11 items-center justify-start gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {selectedIndex > 0 ? cleanDateLabel(days[selectedIndex - 1].displayDate) : "Anterior"}
          </button>
          <button
            type="button"
            onClick={() => goToDay(selectedIndex + 1)}
            disabled={selectedIndex === days.length - 1}
            className="inline-flex h-11 items-center justify-end gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {selectedIndex < days.length - 1
              ? cleanDateLabel(days[selectedIndex + 1].displayDate)
              : "Siguiente"}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {schedule.updatedAt && !preview && (
        <p className="text-center text-[11px] text-slate-400">
          Última actualización:{" "}
          {new Date(schedule.updatedAt).toLocaleDateString("es-CR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}
