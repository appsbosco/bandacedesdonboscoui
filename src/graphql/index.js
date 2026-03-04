/**
 * EventsCalendar.jsx — Banda CEDES Don Bosco
 * Rediseño completo del calendario.
 * - Tailwind only (eliminado react-big-calendar / MUI)
 * - Vista: mes, semana, día, lista
 * - Filtros por categoría y agrupación
 * - Sin ninguna lógica de email
 */

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { GET_EVENTS } from "graphql/queries";
import { ADD_EVENT, UPDATE_EVENT, DELETE_EVENT } from "graphql/mutations";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import EventFormModal from "components/events/EventFormModal";
import DeleteConfirmModal from "components/events/DeleteConfirmModal";
import EventDrawer from "components/events/EventDrawer";
import { formatDateEs, normalizeTimeTo12h } from "utils/dateHelpers";
import { buildSortKey } from "utils/eventHelpers";

// ─── Constants ────────────────────────────────────────────────────────────────
const ADMIN_ROLES = new Set(["Admin", "Director", "Subdirector"]);

const CATEGORY_META = {
  presentation: {
    label: "Presentación",
    color: "bg-blue-500",
    dot: "#3B82F6",
    light: "bg-blue-50 text-blue-700 border-blue-100",
  },
  rehearsal: {
    label: "Ensayo",
    color: "bg-violet-500",
    dot: "#8B5CF6",
    light: "bg-violet-50 text-violet-700 border-violet-100",
  },
  meeting: {
    label: "Reunión",
    color: "bg-amber-500",
    dot: "#F59E0B",
    light: "bg-amber-50 text-amber-700 border-amber-100",
  },
  activity: {
    label: "Actividad",
    color: "bg-emerald-500",
    dot: "#10B981",
    light: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  logistics: {
    label: "Logística",
    color: "bg-orange-500",
    dot: "#F97316",
    light: "bg-orange-50 text-orange-700 border-orange-100",
  },
  other: {
    label: "Otro",
    color: "bg-slate-400",
    dot: "#94A3B8",
    light: "bg-slate-50 text-slate-600 border-slate-200",
  },
};

const VIEWS = ["month", "week", "day", "agenda"];
const VIEW_LABELS = { month: "Mes", week: "Semana", day: "Día", agenda: "Agenda" };

const BANDS = [
  "Todas las agrupaciones",
  "Banda de concierto avanzada",
  "Banda de concierto elemental",
  "Banda de concierto inicial",
  "Banda de concierto intermedia",
  "Banda de marcha",
  "Big Band A",
  "Big Band B",
  "Staff",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun

  const days = [];
  // leading empty cells
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, -startDow + i + 1);
    days.push({ date: d, current: false });
  }
  // current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), current: true });
  }
  // trailing cells
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    days.push({ date: next, current: false });
  }
  return days;
}

function getWeekDays(anchor) {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function eventDate(event) {
  return new Date(Number(event.date));
}

function getCategoryMeta(category) {
  return CATEGORY_META[category] ?? CATEGORY_META.other;
}

const MONTH_NAMES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const DAY_NAMES_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// ─── Component ────────────────────────────────────────────────────────────────
export default function EventsCalendar({ currentUser }) {
  const userRole = currentUser?.role ?? null;
  const isAdmin = ADMIN_ROLES.has(String(userRole ?? ""));

  const { data: eventData, loading, error } = useQuery(GET_EVENTS);
  const [addEvent] = useMutation(ADD_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
    awaitRefetchQueries: true,
  });
  const [updateEvent] = useMutation(UPDATE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
    awaitRefetchQueries: true,
  });
  const [deleteEvent] = useMutation(DELETE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
    awaitRefetchQueries: true,
  });

  // View state
  const today = new Date();
  const [anchor, setAnchor] = useState(today);
  const [view, setView] = useState("month");
  const [catFilter, setCatFilter] = useState("all");
  const [bandFilter, setBandFilter] = useState("all");

  // Modal/drawer state
  const [drawer, setDrawer] = useState({ open: false, event: null });
  const [formModal, setFormModal] = useState({
    open: false,
    mode: null,
    event: null,
    defaultDate: null,
  });
  const [deleteModal, setDeleteModal] = useState({ open: false, event: null });

  // ── Derived events ─────────────────────────────────────────────────────────
  const allEvents = useMemo(
    () => (Array.isArray(eventData?.getEvents) ? eventData.getEvents : []),
    [eventData?.getEvents]
  );

  const filteredEvents = useMemo(() => {
    let evs = allEvents;
    if (catFilter !== "all") evs = evs.filter((e) => e.category === catFilter);
    if (bandFilter !== "all") evs = evs.filter((e) => e.type === bandFilter);
    return evs;
  }, [allEvents, catFilter, bandFilter]);

  function eventsForDay(date) {
    return filteredEvents.filter((e) => sameDay(eventDate(e), date));
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigate = (dir) => {
    // dir: -1 | 1
    const d = new Date(anchor);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setAnchor(d);
  };

  const goToToday = () => setAnchor(today);

  // ── Title ──────────────────────────────────────────────────────────────────
  const viewTitle = useMemo(() => {
    if (view === "month") return `${MONTH_NAMES_ES[anchor.getMonth()]} ${anchor.getFullYear()}`;
    if (view === "week") {
      const days = getWeekDays(anchor);
      const first = days[0],
        last = days[6];
      if (first.getMonth() === last.getMonth())
        return `${first.getDate()} – ${last.getDate()} de ${
          MONTH_NAMES_ES[first.getMonth()]
        } ${first.getFullYear()}`;
      return `${first.getDate()} ${MONTH_NAMES_ES[first.getMonth()]} – ${last.getDate()} ${
        MONTH_NAMES_ES[last.getMonth()]
      } ${last.getFullYear()}`;
    }
    if (view === "day")
      return anchor.toLocaleDateString("es-CR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    return `Agenda — ${MONTH_NAMES_ES[anchor.getMonth()]} ${anchor.getFullYear()}`;
  }, [view, anchor]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openDrawer = useCallback((event) => setDrawer({ open: true, event }), []);
  const closeDrawer = useCallback(() => setDrawer({ open: false, event: null }), []);

  const openAddForm = useCallback(
    (defaultDate = null) => setFormModal({ open: true, mode: "add", event: null, defaultDate }),
    []
  );

  const openEditForm = useCallback(
    (event) =>
      setFormModal({
        open: true,
        mode: "edit",
        event: {
          ...event,
          time: normalizeTimeTo12h(event.time),
          departure: normalizeTimeTo12h(event.departure),
          arrival: normalizeTimeTo12h(event.arrival),
        },
        defaultDate: null,
      }),
    []
  );

  const closeFormModal = useCallback(
    () => setFormModal({ open: false, mode: null, event: null, defaultDate: null }),
    []
  );

  const handleAddEvent = useCallback(
    async (input) => {
      await addEvent({ variables: { input } });
      closeFormModal();
    },
    [addEvent, closeFormModal]
  );

  const handleUpdateEvent = useCallback(
    async (input) => {
      if (!formModal.event?.id) return;
      await updateEvent({ variables: { id: formModal.event.id, input } });
      closeFormModal();
    },
    [formModal.event?.id, updateEvent, closeFormModal]
  );

  const handleDeleteEvent = useCallback(async () => {
    if (!deleteModal.event?.id) return;
    await deleteEvent({ variables: { id: deleteModal.event.id } });
    setDeleteModal({ open: false, event: null });
    if (drawer.event?.id === deleteModal.event.id) closeDrawer();
  }, [deleteModal.event?.id, deleteEvent, drawer.event?.id, closeDrawer]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="min-h-screen bg-slate-50 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* ── Toolbar ──────────────────────────────────────────────────── */}
          <CalendarToolbar
            view={view}
            viewTitle={viewTitle}
            isAdmin={isAdmin}
            onViewChange={setView}
            onNavigate={navigate}
            onToday={goToToday}
            onAddEvent={() => openAddForm(view === "day" ? anchor : null)}
            catFilter={catFilter}
            bandFilter={bandFilter}
            onCatFilterChange={setCatFilter}
            onBandFilterChange={setBandFilter}
          />

          {/* ── Legend ───────────────────────────────────────────────────── */}
          <CategoryLegend />

          {/* ── Calendar Views ────────────────────────────────────────────── */}
          {loading ? (
            <CalendarSkeleton />
          ) : error ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-red-100">
              <p className="text-sm text-red-600">Error cargando eventos: {error.message}</p>
            </div>
          ) : (
            <>
              {view === "month" && (
                <MonthView
                  anchor={anchor}
                  today={today}
                  eventsForDay={eventsForDay}
                  onDayClick={(date) => {
                    setAnchor(date);
                    setView("day");
                  }}
                  onEventClick={openDrawer}
                  onDayAddClick={isAdmin ? (date) => openAddForm(date) : null}
                />
              )}
              {view === "week" && (
                <WeekView
                  anchor={anchor}
                  today={today}
                  eventsForDay={eventsForDay}
                  onEventClick={openDrawer}
                  onSlotClick={isAdmin ? (date) => openAddForm(date) : null}
                />
              )}
              {view === "day" && (
                <DayView
                  anchor={anchor}
                  today={today}
                  eventsForDay={eventsForDay}
                  isAdmin={isAdmin}
                  onEventClick={openDrawer}
                  onAddClick={() => openAddForm(anchor)}
                />
              )}
              {view === "agenda" && (
                <AgendaView
                  anchor={anchor}
                  filteredEvents={filteredEvents}
                  today={today}
                  onEventClick={openDrawer}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Drawer & Modals ──────────────────────────────────────────────────── */}
      <EventDrawer
        open={drawer.open}
        event={drawer.event}
        isAdmin={isAdmin}
        bandColors={{}}
        onClose={closeDrawer}
        onEdit={(e) => {
          closeDrawer();
          openEditForm(e);
        }}
        onDelete={(e) => {
          closeDrawer();
          setDeleteModal({ open: true, event: e });
        }}
      />

      {formModal.open && (
        <EventFormModal
          open={formModal.open}
          mode={formModal.mode}
          initialValues={
            formModal.mode === "add" && formModal.defaultDate
              ? { date: String(formModal.defaultDate.getTime()) }
              : formModal.event
          }
          onClose={closeFormModal}
          onSubmit={formModal.mode === "add" ? handleAddEvent : handleUpdateEvent}
        />
      )}

      {deleteModal.open && (
        <DeleteConfirmModal
          open={deleteModal.open}
          event={deleteModal.event}
          onClose={() => setDeleteModal({ open: false, event: null })}
          onConfirm={handleDeleteEvent}
        />
      )}

      <Footer />
    </DashboardLayout>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function CalendarToolbar({
  view,
  viewTitle,
  isAdmin,
  onViewChange,
  onNavigate,
  onToday,
  onAddEvent,
  catFilter,
  bandFilter,
  onCatFilterChange,
  onBandFilterChange,
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="mb-4 space-y-3">
      {/* Top row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: nav + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToday}
            className="text-xs font-semibold px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Hoy
          </button>

          <div className="flex items-center gap-1">
            <NavBtn onClick={() => onNavigate(-1)} label="Anterior">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </NavBtn>
            <NavBtn onClick={() => onNavigate(1)} label="Siguiente">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </NavBtn>
          </div>

          <h2 className="text-lg font-bold text-slate-900 capitalize">{viewTitle}</h2>
        </div>

        {/* Right: view toggle + add + filter */}
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => onViewChange(v)}
                className={`text-xs font-semibold px-3 py-2 transition-colors ${
                  view === v ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters((f) => !f)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border rounded-xl transition-colors ${
              catFilter !== "all" || bandFilter !== "all"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <FilterIcon className="w-3.5 h-3.5" />
            Filtros
            {(catFilter !== "all" || bandFilter !== "all") && (
              <span className="bg-white/30 text-white text-xs px-1 rounded-full">!</span>
            )}
          </button>

          {isAdmin && (
            <button
              onClick={onAddEvent}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors active:scale-95"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nuevo evento
            </button>
          )}
        </div>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              Categoría
            </label>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="Todas"
                active={catFilter === "all"}
                onClick={() => onCatFilterChange("all")}
              />
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <FilterChip
                  key={key}
                  label={meta.label}
                  active={catFilter === key}
                  dot={meta.dot}
                  onClick={() => onCatFilterChange(catFilter === key ? "all" : key)}
                />
              ))}
            </div>
          </div>
          <div className="sm:w-56">
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              Agrupación
            </label>
            <select
              value={bandFilter}
              onChange={(e) => onBandFilterChange(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="all">Todas las agrupaciones</option>
              {BANDS.slice(1).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────
function MonthView({ anchor, today, eventsForDay, onDayClick, onEventClick, onDayAddClick }) {
  const days = useMemo(() => getMonthDays(anchor.getFullYear(), anchor.getMonth()), [anchor]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {DAY_NAMES_SHORT.map((d) => (
          <div
            key={d}
            className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-widest"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {days.map(({ date, current }, idx) => {
          const isToday = sameDay(date, today);
          const events = eventsForDay(date);

          return (
            <div
              key={idx}
              className={`min-h-[90px] sm:min-h-[110px] p-1.5 relative group transition-colors cursor-pointer ${
                current ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-100/50"
              }`}
              onClick={() => current && onDayClick(date)}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? "bg-blue-600 text-white"
                      : current
                      ? "text-slate-700"
                      : "text-slate-300"
                  }`}
                >
                  {date.getDate()}
                </span>

                {/* Add button on hover */}
                {current && onDayAddClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayAddClick(date);
                    }}
                    className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-xs hidden group-hover:flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    +
                  </button>
                )}
              </div>

              {/* Events (max 3) */}
              <div className="space-y-0.5">
                {events.slice(0, 3).map((event) => {
                  const meta = getCategoryMeta(event.category);
                  return (
                    <button
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={`w-full text-left text-xs font-medium px-1.5 py-0.5 rounded truncate flex items-center gap-1 hover:opacity-80 transition-opacity ${meta.light}`}
                    >
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: meta.dot }}
                      />
                      <span className="truncate">{event.title}</span>
                    </button>
                  );
                })}
                {events.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayClick(date);
                    }}
                    className="text-xs text-slate-400 font-medium hover:text-slate-600 pl-1.5"
                  >
                    +{events.length - 3} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────
function WeekView({ anchor, today, eventsForDay, onEventClick, onSlotClick }) {
  const weekDays = useMemo(() => getWeekDays(anchor), [anchor]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 divide-x divide-slate-100">
        {weekDays.map((date, i) => {
          const isToday = sameDay(date, today);
          const events = eventsForDay(date);
          return (
            <div
              key={i}
              className="min-h-[260px] cursor-pointer group"
              onClick={() => onSlotClick?.(date)}
            >
              {/* Header */}
              <div
                className={`py-3 text-center border-b border-slate-100 ${
                  isToday ? "bg-blue-50" : ""
                }`}
              >
                <p className="text-xs font-medium text-slate-500">
                  {DAY_NAMES_SHORT[date.getDay()]}
                </p>
                <span
                  className={`text-lg font-bold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
                    isToday ? "bg-blue-600 text-white" : "text-slate-800"
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="p-1.5 space-y-1">
                {events.map((event) => {
                  const meta = getCategoryMeta(event.category);
                  return (
                    <button
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={`w-full text-left text-xs font-medium px-2 py-1.5 rounded-lg border ${meta.light} hover:opacity-80 transition-opacity`}
                    >
                      {event.time && <p className="font-bold">{normalizeTimeTo12h(event.time)}</p>}
                      <p className="truncate mt-0.5">{event.title}</p>
                    </button>
                  );
                })}
                {events.length === 0 && (
                  <p className="text-xs text-slate-200 text-center mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    + agregar
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────
function DayView({ anchor, today, eventsForDay, isAdmin, onEventClick, onAddClick }) {
  const events = eventsForDay(anchor);
  const isToday = sameDay(anchor, today);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${
          isToday ? "bg-blue-50" : ""
        }`}
      >
        <div>
          <p className="text-sm font-medium text-slate-500 capitalize">
            {anchor.toLocaleDateString("es-CR", { weekday: "long" })}
          </p>
          <p className={`text-3xl font-bold ${isToday ? "text-blue-600" : "text-slate-900"}`}>
            {anchor.getDate()}{" "}
            <span className="text-xl font-medium text-slate-400">
              {MONTH_NAMES_ES[anchor.getMonth()]}
            </span>
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            + Agregar evento
          </button>
        )}
      </div>

      {/* Events list */}
      <div className="p-6">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25"
                />
              </svg>
            </div>
            <p className="text-sm text-slate-400 font-medium">Sin eventos este día</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...events]
              .sort((a, b) => buildSortKey(a) - buildSortKey(b))
              .map((event) => {
                const meta = getCategoryMeta(event.category);
                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="w-full flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-left group"
                  >
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <span
                        className="w-2 h-2 rounded-full mt-1.5"
                        style={{ backgroundColor: meta.dot }}
                      />
                      <div className="w-px flex-1 bg-slate-100 mt-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${meta.light}`}
                        >
                          {meta.label}
                        </span>
                        {event.time && (
                          <span className="text-xs text-slate-400 font-medium">
                            {normalizeTimeTo12h(event.time)}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-0.5">{event.title}</h4>
                      {event.place && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <PinIcon />
                          {event.place}
                        </p>
                      )}
                      {event.type && <p className="text-xs text-slate-400 mt-0.5">{event.type}</p>}
                    </div>
                    <svg
                      className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 mt-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Agenda View ──────────────────────────────────────────────────────────────
function AgendaView({ anchor, filteredEvents, today, onEventClick }) {
  // Show 30 days from anchor
  const rangeStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const rangeEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);

  const grouped = useMemo(() => {
    const evs = filteredEvents
      .filter((e) => {
        const d = eventDate(e);
        return d >= rangeStart && d <= rangeEnd;
      })
      .sort((a, b) => buildSortKey(a) - buildSortKey(b));

    // Group by date string
    const map = new Map();
    for (const ev of evs) {
      const key = eventDate(ev).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    return [...map.entries()];
  }, [filteredEvents, anchor]);

  if (grouped.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
        <p className="text-sm text-slate-400 font-medium">No hay eventos este mes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([dateKey, events]) => {
        const date = new Date(dateKey + "T12:00:00");
        const isToday = sameDay(date, today);
        return (
          <div
            key={dateKey}
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
          >
            {/* Date header */}
            <div
              className={`px-5 py-3 flex items-center gap-3 border-b border-slate-100 ${
                isToday ? "bg-blue-50" : "bg-slate-50"
              }`}
            >
              <span
                className={`text-2xl font-bold ${isToday ? "text-blue-600" : "text-slate-800"}`}
              >
                {date.getDate()}
              </span>
              <div>
                <p
                  className={`text-sm font-semibold capitalize ${
                    isToday ? "text-blue-700" : "text-slate-700"
                  }`}
                >
                  {date.toLocaleDateString("es-CR", { weekday: "long" })}
                  {isToday && (
                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                      Hoy
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {MONTH_NAMES_ES[date.getMonth()]} {date.getFullYear()}
                </p>
              </div>
            </div>

            {/* Events */}
            <div className="divide-y divide-slate-50">
              {events.map((event) => {
                const meta = getCategoryMeta(event.category);
                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex-shrink-0">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${meta.light}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{event.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {[event.time && normalizeTimeTo12h(event.time), event.place]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    {event.type && (
                      <span className="flex-shrink-0 text-xs text-slate-400 hidden sm:block truncate max-w-[140px]">
                        {event.type}
                      </span>
                    )}
                    <svg
                      className="w-4 h-4 text-slate-300 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Category Legend ──────────────────────────────────────────────────────────
function CategoryLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 px-1">
      {Object.entries(CATEGORY_META).map(([key, meta]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: meta.dot }}
          />
          <span className="text-xs text-slate-500 font-medium">{meta.label}</span>
        </div>
      ))}
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm animate-pulse">
      <div className="grid grid-cols-7 border-b border-slate-100">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-50" />
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {[...Array(35)].map((_, i) => (
          <div key={i} className="h-28 bg-white" />
        ))}
      </div>
    </div>
  );
}

// ─── Micro components ─────────────────────────────────────────────────────────
function NavBtn({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
    >
      {children}
    </button>
  );
}

function FilterChip({ label, active, dot, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
      }`}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: active ? "white" : dot }}
        />
      )}
      {label}
    </button>
  );
}

const FilterIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591L15.75 12.5v8.5l-7.5-3.5v-5L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
    />
  </svg>
);
const PinIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
    />
  </svg>
);
