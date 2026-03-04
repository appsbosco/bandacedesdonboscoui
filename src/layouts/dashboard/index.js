/**
 * Dashboard.jsx — Banda CEDES Don Bosco
 * Rediseño completo: enfocado 100% en presentaciones
 * Stack: React + Apollo + Tailwind (sin MUI, sin email)
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { generateToken, messaging } from "config/firebase";
import { onMessage } from "firebase/messaging";
import {
  ADD_EVENT,
  UPDATE_EVENT,
  DELETE_EVENT,
  UPDATE_NOTIFICATION_TOKEN,
} from "graphql/mutations";
import { GET_EVENTS, GET_USERS_AND_BANDS } from "graphql/queries";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import EventDrawer from "components/events/EventDrawer";
import EventFormModal from "components/events/EventFormModal";
import DeleteConfirmModal from "components/events/DeleteConfirmModal";
import PresentationCard from "components/events/PresentationCard";
import PresentationHero from "components/events/PresentationHero";
import { filterPresentations, sortEventsByDate, buildSortKey } from "utils/eventHelpers";
import { formatDateEs, normalizeTimeTo12h } from "utils/dateHelpers";
import PropTypes from "prop-types";

// ─── GraphQL ──────────────────────────────────────────────────────────────────
const GET_CURRENT_USER = gql`
  query getUser {
    getUser {
      id
      name
      firstSurName
      secondSurName
      email
      role
      instrument
      avatar
    }
  }
`;

// ─── Constants ───────────────────────────────────────────────────────────────
const ADMIN_ROLES = new Set(["Admin", "Director", "Subdirector"]);

const BAND_COLORS = {
  "Banda de concierto avanzada": {
    bg: "bg-blue-600",
    text: "text-blue-600",
    light: "bg-blue-50",
    dot: "#2563EB",
  },
  "Banda de concierto elemental": {
    bg: "bg-emerald-600",
    text: "text-emerald-600",
    light: "bg-emerald-50",
    dot: "#059669",
  },
  "Banda de concierto inicial": {
    bg: "bg-violet-600",
    text: "text-violet-600",
    light: "bg-violet-50",
    dot: "#7C3AED",
  },
  "Banda de concierto intermedia": {
    bg: "bg-amber-600",
    text: "text-amber-600",
    light: "bg-amber-50",
    dot: "#D97706",
  },
  "Banda de marcha": { bg: "bg-red-600", text: "text-red-600", light: "bg-red-50", dot: "#DC2626" },
  "Big Band A": { bg: "bg-cyan-600", text: "text-cyan-600", light: "bg-cyan-50", dot: "#0891B2" },
  "Big Band B": { bg: "bg-pink-600", text: "text-pink-600", light: "bg-pink-50", dot: "#DB2777" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDaysUntil(dateMs) {
  const now = new Date();
  const target = new Date(Number(dateMs));
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function getUrgencyLabel(days) {
  if (days < 0) return { label: "Pasado", color: "text-slate-400 bg-slate-100" };
  if (days === 0) return { label: "Hoy", color: "text-white bg-red-500" };
  if (days === 1) return { label: "Mañana", color: "text-white bg-orange-500" };
  if (days <= 7) return { label: `En ${days} días`, color: "text-white bg-amber-500" };
  if (days <= 30) return { label: `En ${days} días`, color: "text-slate-700 bg-slate-100" };
  return { label: formatDateEs(dateMs, "short"), color: "text-slate-600 bg-slate-100" };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: userData, loading: userLoading } = useQuery(GET_CURRENT_USER);
  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS_AND_BANDS);
  const { data: eventData, loading: eventLoading, error: eventError } = useQuery(GET_EVENTS);

  const [updateNotificationToken] = useMutation(UPDATE_NOTIFICATION_TOKEN);
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

  // UI State
  const [drawer, setDrawer] = useState({ open: false, event: null });
  const [formModal, setFormModal] = useState({ open: false, mode: null, event: null }); // mode: "add"|"edit"
  const [deleteModal, setDeleteModal] = useState({ open: false, event: null });
  const [activeFilter, setActiveFilter] = useState("all");

  const currentUser = userData?.getUser ?? null;
  const userId = currentUser?.id ?? null;
  const userRole = currentUser?.role ?? null;
  const isAdmin = ADMIN_ROLES.has(String(userRole ?? ""));

  // ── Push token registration ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await generateToken();
        if (!token || cancelled) return;
        await updateNotificationToken({ variables: { userId, token } });
      } catch (err) {
        console.error("[Dashboard] Token registration error:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, updateNotificationToken]);

  // ── Foreground message listener ──────────────────────────────────────────
  useEffect(() => {
    if (!messaging) return;
    try {
      const unsub = onMessage(messaging, (_payload) => {
        // TODO: show toast notification
      });
      return () => {
        if (typeof unsub === "function") unsub();
      };
    } catch {
      return undefined;
    }
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────
  const allEvents = useMemo(() => {
    return Array.isArray(eventData?.getEvents) ? eventData.getEvents : [];
  }, [eventData?.getEvents]);

  // Dashboard shows ONLY presentations (category === "presentation" or type is a band name)
  const presentations = useMemo(() => {
    const pres = allEvents.filter((e) => e.category === "presentation" || BAND_COLORS[e.type]);
    return [...pres].sort((a, b) => buildSortKey(a) - buildSortKey(b));
  }, [allEvents]);

  const upcomingPresentations = useMemo(
    () => presentations.filter((e) => getDaysUntil(e.date) >= 0),
    [presentations]
  );

  const filteredPresentations = useMemo(() => {
    if (activeFilter === "all") return upcomingPresentations;
    return upcomingPresentations.filter((e) => e.type === activeFilter);
  }, [upcomingPresentations, activeFilter]);

  const availableBands = useMemo(() => {
    const bands = new Set(upcomingPresentations.map((e) => e.type).filter(Boolean));
    return [...bands];
  }, [upcomingPresentations]);

  const nextPresentation = filteredPresentations[0] ?? null;
  const otherPresentations = filteredPresentations.slice(1);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openDrawer = useCallback((event) => setDrawer({ open: true, event }), []);
  const closeDrawer = useCallback(() => setDrawer({ open: false, event: null }), []);

  const openAddForm = useCallback(() => setFormModal({ open: true, mode: "add", event: null }), []);

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
      }),
    []
  );

  const closeFormModal = useCallback(
    () => setFormModal({ open: false, mode: null, event: null }),
    []
  );

  const openDeleteModal = useCallback((event) => setDeleteModal({ open: true, event }), []);

  const closeDeleteModal = useCallback(() => setDeleteModal({ open: false, event: null }), []);

  const handleAddEvent = useCallback(
    async (input) => {
      try {
        await addEvent({ variables: { input } });
        closeFormModal();
      } catch (err) {
        console.error("[Dashboard] Add event error:", err);
      }
    },
    [addEvent, closeFormModal]
  );

  const handleUpdateEvent = useCallback(
    async (input) => {
      if (!formModal.event?.id) return;
      try {
        await updateEvent({ variables: { id: formModal.event.id, input } });
        closeFormModal();
      } catch (err) {
        console.error("[Dashboard] Update event error:", err);
      }
    },
    [formModal.event?.id, updateEvent, closeFormModal]
  );

  const handleDeleteEvent = useCallback(async () => {
    if (!deleteModal.event?.id) return;
    try {
      await deleteEvent({ variables: { id: deleteModal.event.id } });
      closeDeleteModal();
      if (drawer.event?.id === deleteModal.event.id) closeDrawer();
    } catch (err) {
      console.error("[Dashboard] Delete event error:", err);
    }
  }, [deleteModal.event?.id, deleteEvent, closeDeleteModal, drawer.event?.id, closeDrawer]);

  // ── Loading / Error ───────────────────────────────────────────────────────
  const isLoading = userLoading || usersLoading || eventLoading;

  if (isLoading)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <DashboardSkeleton />
        <Footer />
      </DashboardLayout>
    );

  if (eventError)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ErrorState message={eventError.message} />
        <Footer />
      </DashboardLayout>
    );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="min-h-screen bg-slate-50 pb-12">
        {/* ── Welcome Header ─────────────────────────────────────────────── */}
        <WelcomeHeader user={currentUser} isAdmin={isAdmin} onAddEvent={openAddForm} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Stats Row ──────────────────────────────────────────────────── */}
          <StatsRow presentations={upcomingPresentations} />

          {/* ── Section header + filters ───────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Próximas Presentaciones
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {upcomingPresentations.length === 0
                  ? "No hay presentaciones programadas"
                  : `${upcomingPresentations.length} presentación${
                      upcomingPresentations.length !== 1 ? "es" : ""
                    } programada${upcomingPresentations.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Band filter pills */}
            {availableBands.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <FilterPill
                  label="Todas"
                  active={activeFilter === "all"}
                  onClick={() => setActiveFilter("all")}
                />
                {availableBands.map((band) => (
                  <FilterPill
                    key={band}
                    label={band}
                    active={activeFilter === band}
                    color={BAND_COLORS[band]}
                    onClick={() => setActiveFilter(band === activeFilter ? "all" : band)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Empty State ────────────────────────────────────────────────── */}
          {filteredPresentations.length === 0 && (
            <EmptyState isAdmin={isAdmin} onAddEvent={openAddForm} />
          )}

          {/* ── Hero Card (next presentation) ─────────────────────────────── */}
          {nextPresentation && (
            <div className="mb-6">
              <PresentationHero
                event={nextPresentation}
                isAdmin={isAdmin}
                bandColors={BAND_COLORS}
                getDaysUntil={getDaysUntil}
                getUrgencyLabel={getUrgencyLabel}
                onViewDetails={openDrawer}
                onEdit={openEditForm}
                onDelete={openDeleteModal}
              />
            </div>
          )}

          {/* ── Other presentations grid ───────────────────────────────────── */}
          {otherPresentations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherPresentations.map((event) => (
                <PresentationCard
                  key={event.id}
                  event={event}
                  isAdmin={isAdmin}
                  bandColors={BAND_COLORS}
                  getDaysUntil={getDaysUntil}
                  getUrgencyLabel={getUrgencyLabel}
                  onViewDetails={openDrawer}
                  onEdit={openEditForm}
                  onDelete={openDeleteModal}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Drawers & Modals ────────────────────────────────────────────────── */}
      <EventDrawer
        open={drawer.open}
        event={drawer.event}
        isAdmin={isAdmin}
        bandColors={BAND_COLORS}
        onClose={closeDrawer}
        onEdit={(e) => {
          closeDrawer();
          openEditForm(e);
        }}
        onDelete={(e) => {
          closeDrawer();
          openDeleteModal(e);
        }}
      />

      {formModal.open && (
        <EventFormModal
          open={formModal.open}
          mode={formModal.mode}
          initialValues={formModal.event}
          onClose={closeFormModal}
          onSubmit={formModal.mode === "add" ? handleAddEvent : handleUpdateEvent}
        />
      )}

      {deleteModal.open && (
        <DeleteConfirmModal
          open={deleteModal.open}
          event={deleteModal.event}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteEvent}
        />
      )}

      <Footer />
    </DashboardLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * WelcomeHeader — rediseño sin gradientes
 * Estilo limpio, institucional, tipo Airbnb/Linear
 */
export function WelcomeHeader({ user, isAdmin, onAddEvent }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const firstName = user?.name ?? "músico";

  // Día de la semana + fecha larga en español
  const today = new Date().toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const [weekday, ...rest] = today.split(", ");
  const datePart = rest.join(", ");

  return (
    <div
      className="relative bg-white border-b border-slate-100 overflow-hidden mb-6"
      style={{ minHeight: 140 }}
    >
      {/* ── Pentagrama decorativo — SVG inline como textura ─────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          opacity: 0.045,
        }}
      >
        {/* 5 líneas horizontales del pentagrama, repetidas */}
        {[18, 30, 42, 54, 66, 86, 98, 110, 122, 134].map((y) => (
          <div
            key={y}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: y,
              height: 1,
              background: "#0f172a",
            }}
          />
        ))}
        {/* Clave de sol estilizada — solo el símbolo utf-8 */}
        <span
          style={{
            position: "absolute",
            right: 40,
            top: -10,
            fontSize: 220,
            lineHeight: 1,
            color: "#0f172a",
            fontFamily: "Georgia, serif",
            userSelect: "none",
          }}
        >
          𝄞
        </span>
      </div>

      {/* ── Contenido ────────────────────────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          {/* Left block */}
          <div>
            {/* Label superior — muy pequeño, uppercase, tracking ancho */}
            <p
              style={{
                margin: 0,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#94a3b8",
              }}
            >
              Banda CEDES Don Bosco &nbsp;·&nbsp;{" "}
              <span style={{ color: "#cbd5e1" }}>
                {weekday.charAt(0).toUpperCase() + weekday.slice(1)}
              </span>
            </p>

            {/* Saludo + nombre — escala de tipografía muy contrastada */}
            <div style={{ marginTop: 6, lineHeight: 1 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: "#64748b",
                  fontStyle: "italic",
                  letterSpacing: "0.01em",
                }}
              >
                {greeting},
              </span>
              {/* Nombre en display enorme */}
              <h1
                style={{
                  margin: "2px 0 0",
                  fontSize: "clamp(28px, 5vw, 44px)",
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                  fontFamily: "Georgia, 'Times New Roman', serif",
                }}
              >
                {firstName}
              </h1>
            </div>

            {/* Fecha — discreta pero legible */}
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 12,
                color: "#94a3b8",
                fontWeight: 500,
                letterSpacing: "0.01em",
              }}
            >
              {datePart.charAt(0).toUpperCase() + datePart.slice(1)}
            </p>
          </div>

          {/* Right: CTA admin */}
          {isAdmin && (
            <div style={{ flexShrink: 0 }}>
              <button
                onClick={onAddEvent}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
              >
                <PlusIcon />
                Nueva Presentación
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── StatsRow ─────────────────────────────────────────────────────────────────
/**
 * Stats interesantes para una banda:
 * - No solo contadores aburridos
 * - Cada stat tiene una "lectura secundaria" que da contexto musical
 * - El número es protagonista absoluto
 * - Acento de color diferente por stat
 */
export function StatsRow({ presentations }) {
  const today = new Date();
  const thisMonth = presentations.filter((e) => {
    const d = new Date(Number(e.date));
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;

  const next7 = presentations.filter((e) => {
    const diff = Math.ceil((new Date(Number(e.date)) - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
  }).length;

  const nextEvent = presentations[0];
  const daysToNext = nextEvent
    ? Math.max(0, Math.ceil((new Date(Number(nextEvent.date)) - today) / (1000 * 60 * 60 * 24)))
    : null;

  const bands = new Set(presentations.map((e) => e.type).filter(Boolean)).size;

  const stats = [
    {
      value: presentations.length,
      unit: presentations.length === 1 ? "presentación" : "presentaciones",
      context: "programadas en total",
      accent: "#3b82f6",
      accentBg: "#eff6ff",
      icon: <NoteIcon />,
    },
    {
      value: thisMonth,
      unit: thisMonth === 1 ? "presentación" : "presentaciones",
      context: "este mes",
      accent: "#8b5cf6",
      accentBg: "#f5f3ff",
      icon: <CalIcon />,
    },
    {
      value: daysToNext !== null ? daysToNext : "—",
      unit: daysToNext === 0 ? "¡es hoy!" : daysToNext === 1 ? "día" : "días",
      context:
        daysToNext !== null
          ? daysToNext === 0
            ? "para la próxima presentación"
            : "para la próxima presentación"
          : "sin presentaciones próximas",
      accent: daysToNext !== null && daysToNext <= 7 ? "#ef4444" : "#f59e0b",
      accentBg: daysToNext !== null && daysToNext <= 7 ? "#fef2f2" : "#fffbeb",
      icon: <ClockIcon />,
    },
    {
      value: bands,
      unit: bands === 1 ? "agrupación" : "agrupaciones",
      context: "participando",
      accent: "#10b981",
      accentBg: "#ecfdf5",
      icon: <GroupIcon />,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 12,
        marginTop: 8,
      }}
      className="lg:grid-cols-4"
    >
      {stats.map((s, i) => (
        <StatCard key={i} {...s} />
      ))}
    </div>
  );
}

StatsRow.propTypes = {
  presentations: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      type: PropTypes.string,
    })
  ).isRequired,
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ value, unit, context, accent, accentBg, icon }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        border: "1px solid #f1f5f9",
        padding: "18px 20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent bar izquierda */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 16,
          bottom: 16,
          width: 3,
          borderRadius: "0 3px 3px 0",
          background: accent,
        }}
      />

      {/* Icon badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 10,
          background: accentBg,
          color: accent,
          marginBottom: 12,
        }}
      >
        {icon}
      </div>

      {/* Número protagonista */}
      <div style={{ lineHeight: 1 }}>
        <span
          style={{
            fontSize: "clamp(30px, 4vw, 40px)",
            fontWeight: 900,
            color: "#0f172a",
            letterSpacing: "-0.04em",
            fontFamily: "Georgia, 'Times New Roman', serif",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
      </div>

      {/* Unidad — small, colored */}
      <p
        style={{
          margin: "4px 0 0",
          fontSize: 12,
          fontWeight: 700,
          color: accent,
          letterSpacing: "0.01em",
          lineHeight: 1.3,
        }}
      >
        {unit}
      </p>

      {/* Contexto — muy discreto */}
      <p
        style={{
          margin: "2px 0 0",
          fontSize: 11,
          color: "#94a3b8",
          lineHeight: 1.4,
        }}
      >
        {context}
      </p>
    </div>
  );
}

function FilterPill({ label, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150 active:scale-95 ${
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
      }`}
    >
      {active && color && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
          style={{ backgroundColor: color?.dot }}
        />
      )}
      {label}
    </button>
  );
}

function EmptyState({ isAdmin, onAddEvent }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">
        No hay presentaciones próximas
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
        No hay presentaciones programadas en este momento.
      </p>
      {isAdmin && (
        <button
          onClick={onAddEvent}
          className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Crear primera presentación
        </button>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      <div className="h-48 bg-slate-200" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-52 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl border border-red-100 p-8 text-center max-w-sm">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">Error cargando datos</h3>
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}

// ─── Icon components ──────────────────────────────────────────────────────────
const CalendarIcon = ({ className }) => (
  <svg
    className={className}
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
);
const MonthIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);
const AlertIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
    />
  </svg>
);
const PlusIcon = () => (
  <svg
    width="15"
    height="15"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2.5"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const NoteIcon = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.8"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z"
    />
  </svg>
);

const CalIcon = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.8"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.8"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const GroupIcon = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.8"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
    />
  </svg>
);
const bandColorShape = PropTypes.shape({
  bg: PropTypes.string,
  text: PropTypes.string,
  light: PropTypes.string,
  dot: PropTypes.string,
});

const presentationShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)])
    .isRequired,
  type: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  time: PropTypes.string,
  place: PropTypes.string,
  departure: PropTypes.string,
  arrival: PropTypes.string,
});

WelcomeHeader.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
  }),
  isAdmin: PropTypes.bool,
  onAddEvent: PropTypes.func.isRequired,
};

StatsRow.propTypes = {
  presentations: PropTypes.arrayOf(presentationShape).isRequired,
};

FilterPill.propTypes = {
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  color: bandColorShape,
  onClick: PropTypes.func.isRequired,
};

EmptyState.propTypes = {
  isAdmin: PropTypes.bool,
  onAddEvent: PropTypes.func.isRequired,
};

ErrorState.propTypes = {
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
};

CalendarIcon.propTypes = {
  className: PropTypes.string,
};

MonthIcon.propTypes = {
  className: PropTypes.string,
};

AlertIcon.propTypes = {
  className: PropTypes.string,
};

GroupIcon.propTypes = {
  className: PropTypes.string,
};

StatCard.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  unit: PropTypes.string.isRequired,
  context: PropTypes.string.isRequired,
  accent: PropTypes.string.isRequired,
  accentBg: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
};
