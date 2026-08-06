/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FilePenLine,
  MapPin,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import TourScheduleView from "./TourScheduleView";
import { applyDateVariant, buildRoseParadeSchedule } from "./roseParadeSchedule";
import { useTourSchedule } from "./useTourSchedule";

const VARIANTS = [
  { value: "PENDING", label: "Pendiente de confirmación" },
  { value: "HOLLYWOOD_28", label: "Hollywood 28 · Disneyland 30" },
  { value: "HOLLYWOOD_30", label: "Disneyland 28 · Hollywood 30" },
];
const ADMIN_DAY_FORMAT = new Intl.DateTimeFormat("es-CR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function makeClientId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function hydrateSchedule(schedule) {
  if (!schedule) return null;
  return {
    ...schedule,
    days: (schedule.days || []).map((day) => ({
      ...day,
      clientId: day.id || makeClientId("day"),
      events: (day.events || []).map((event) => ({
        ...event,
        clientId: event.id || makeClientId("event"),
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        location: event.location || "",
      })),
    })),
  };
}

function formatDay(date) {
  return ADMIN_DAY_FORMAT.format(new Date(`${String(date).slice(0, 10)}T12:00:00.000Z`)).replaceAll(
    ".",
    ""
  );
}

function EventEditor({ event, onChange, onRemove }) {
  return (
    <div className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 lg:grid-cols-[9rem_minmax(0,1fr)_12rem_2.5rem] lg:items-start">
      <div className="grid grid-cols-2 gap-2">
        <label className="min-w-0">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Inicio
          </span>
          <input
            type="time"
            value={event.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="min-w-0">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Fin
          </span>
          <input
            type="time"
            value={event.endTime}
            onChange={(e) => onChange({ endTime: e.target.value })}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="space-y-2">
        <label>
          <span className="sr-only">Actividad</span>
          <input
            type="text"
            value={event.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Nombre de la actividad"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="relative block">
          {/* <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /> */}
          <span className="sr-only">Lugar opcional</span>
          <input
            type="text"
            value={event.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="Lugar, opcional"
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <label>
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Visible para
        </span>
        <select
          value={event.audience || "ALL"}
          onChange={(e) => onChange({ audience: e.target.value })}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="ALL">Todos</option>
          <option value="DIRECTORS">Dirección</option>
        </select>
      </label>

      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 lg:mt-4"
        aria-label={`Eliminar ${event.title || "actividad"}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function TourScheduleWorkspace({
  tour,
  savedSchedule,
  saving,
  published,
  message,
  onSave,
  onClearMessage,
}) {
  const [draft, setDraft] = useState(() => hydrateSchedule(savedSchedule));
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [mode, setMode] = useState("edit");
  const [dirty, setDirty] = useState(false);

  const selectedDay = draft?.days?.[selectedDayIndex] || null;
  const eventCount = useMemo(
    () => draft?.days?.reduce((total, day) => total + day.events.length, 0) || 0,
    [draft?.days]
  );

  const updateDraft = (updater) => {
    setDraft((current) => (typeof updater === "function" ? updater(current) : updater));
    setDirty(true);
    onClearMessage();
  };

  const loadTemplate = () => {
    updateDraft(buildRoseParadeSchedule(tour));
    setSelectedDayIndex(0);
  };

  const updateSelectedDay = (changes) => {
    updateDraft((current) => ({
      ...current,
      days: current.days.map((day, index) =>
        index === selectedDayIndex ? { ...day, ...changes } : day
      ),
    }));
  };

  const updateEvent = (eventIndex, changes) => {
    updateSelectedDay({
      events: selectedDay.events.map((event, index) =>
        index === eventIndex ? { ...event, ...changes } : event
      ),
    });
  };

  const removeEvent = (eventIndex) => {
    updateSelectedDay({ events: selectedDay.events.filter((_, index) => index !== eventIndex) });
  };

  const addEvent = () => {
    updateSelectedDay({
      events: [
        ...selectedDay.events,
        {
          clientId: makeClientId("event"),
          order: selectedDay.events.length,
          startTime: "",
          endTime: "",
          title: "",
          location: "",
          audience: "ALL",
        },
      ],
    });
  };

  const changeVariant = (value) => updateDraft((current) => applyDateVariant(current, value));

  const handleSave = async (status) => {
    await onSave(draft, status);
  };

  if (!draft) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <CalendarDays className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-black text-slate-950">Prepara el itinerario de la gira</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Carga la agenda base de Rose Parade, completa los horarios pendientes y publícala para
          integrantes, staff y padres de familia.
        </p>
        <button
          type="button"
          onClick={loadTemplate}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Cargar itinerario Rose Parade
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black tracking-tight text-slate-950">
              Itinerario de la gira
            </h2>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                published
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
              }`}
            >
              {published ? "Publicado" : "Borrador"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {draft.days.length} días · {eventCount} actividades
            {dirty ? " · Cambios sin guardar" : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-10 items-center rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold ${
                mode === "edit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              <FilePenLine className="h-3.5 w-3.5" aria-hidden="true" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold ${
                mode === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Vista previa
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={() => handleSave("PUBLISHED")}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {saving ? "Guardando…" : "Publicar"}
          </button>
        </div>
      </div>

      {message && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-xs font-semibold ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {published && tour.selfServiceAccess?.schedule !== true && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          <strong>Publicado, pero todavía no visible:</strong> habilita “Itinerario” en Importación
          → Acceso self-service para mostrar su icono a integrantes, staff y padres.
        </div>
      )}

      {mode === "preview" ? (
        <div className="mx-auto max-w-4xl rounded-3xl bg-slate-50 p-3 sm:p-5">
          <TourScheduleView
            schedule={{ ...draft, updatedAt: savedSchedule?.updatedAt }}
            showFlights={false}
            preview
            tourName={tour.name}
            destination={tour.destination}
          />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              {draft.days.map((day, index) => (
                <button
                  type="button"
                  key={day.id || day.clientId}
                  onClick={() => setSelectedDayIndex(index)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    selectedDayIndex === index
                      ? "bg-blue-50 text-blue-800"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                      selectedDayIndex === index
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wide opacity-70">
                      {formatDay(day.date)}
                    </span>
                    <span className="block truncate text-xs font-bold">{day.title}</span>
                  </span>
                </button>
              ))}
            </div>

            <label className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Ajuste 28 / 30 diciembre
              </span>
              <select
                value={draft.dateVariant}
                onChange={(e) => changeVariant(e.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {VARIANTS.map((variant) => (
                  <option key={variant.value} value={variant.value}>
                    {variant.label}
                  </option>
                ))}
              </select>
            </label>
          </aside>

          {selectedDay && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Día {selectedDayIndex + 1} · {formatDay(selectedDay.date)}
                </div>
                <label className="mt-3 block">
                  <span className="sr-only">Título del día</span>
                  <input
                    type="text"
                    value={selectedDay.title}
                    onChange={(e) => updateSelectedDay({ title: e.target.value })}
                    className="h-11 w-full border-0 bg-transparent p-0 text-xl font-black tracking-tight text-slate-950 focus:outline-none focus:ring-0"
                  />
                </label>
              </div>

              <div>
                {selectedDay.events.map((event, index) => (
                  <EventEditor
                    key={event.id || event.clientId}
                    event={event}
                    onChange={(changes) => updateEvent(index, changes)}
                    onRemove={() => removeEvent(index)}
                  />
                ))}
              </div>

              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                <button
                  type="button"
                  onClick={addEvent}
                  className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Agregar actividad
                </button>
                <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Las horas vacías se mostrarán como “Por confirmar”.
                </span>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function TourSchedulePage({ tour }) {
  const { schedule: savedSchedule, loading, error, saving, save } = useTourSchedule(tour.id);
  const [message, setMessage] = useState(null);

  if (loading && !savedSchedule) {
    return <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
        {error.message}
      </div>
    );
  }

  const handleSave = async (draft, status) => {
    try {
      await save(draft, status);
      setMessage({
        type: "success",
        text: status === "PUBLISHED" ? "Itinerario publicado" : "Borrador guardado",
      });
    } catch (saveError) {
      setMessage({ type: "error", text: saveError.message });
    }
  };

  return (
    <TourScheduleWorkspace
      key={savedSchedule?.updatedAt || "new-schedule"}
      tour={tour}
      savedSchedule={savedSchedule}
      saving={saving}
      published={savedSchedule?.status === "PUBLISHED"}
      message={message}
      onSave={handleSave}
      onClearMessage={() => setMessage(null)}
    />
  );
}
