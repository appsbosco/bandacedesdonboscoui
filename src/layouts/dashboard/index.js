/**
 * Dashboard.jsx — DEFINITIVO v3
 *
 * FIXES:
 * - openEditForm limpia campos prohibidos antes de pasar al modal
 * - resolveTabKey usa category del evento correctamente
 * - Tabs limpios estilo segmented control, no pills
 * - Stats elegantes
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
import { buildSortKey } from "utils/eventHelpers";
import { normalizeTimeTo12h } from "utils/dateHelpers";
import PropTypes from "prop-types";
import { NextEventBanner } from "./components/EventHighlights";
import { MonthTimeline } from "./components/EventHighlights";
import ContextualBanner from "./components/ContextualBanner";

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

const ADMIN_ROLES = new Set(["Admin", "Director", "Subdirector"]);

const BAND_COLORS = {
  "Banda de concierto avanzada": {
    bg: "bg-blue-600",
    text: "text-blue-700",
    light: "bg-blue-50",
    dot: "#2563EB",
  },
  "Banda de concierto elemental": {
    bg: "bg-emerald-600",
    text: "text-emerald-700",
    light: "bg-emerald-50",
    dot: "#059669",
  },
  "Banda de concierto inicial": {
    bg: "bg-violet-600",
    text: "text-violet-700",
    light: "bg-violet-50",
    dot: "#7C3AED",
  },
  "Banda de concierto intermedia": {
    bg: "bg-amber-600",
    text: "text-amber-700",
    light: "bg-amber-50",
    dot: "#D97706",
  },
  "Banda de marcha": { bg: "bg-red-600", text: "text-red-700", light: "bg-red-50", dot: "#DC2626" },
  "Big Band A": { bg: "bg-cyan-600", text: "text-cyan-700", light: "bg-cyan-50", dot: "#0891B2" },
  "Big Band B": { bg: "bg-pink-600", text: "text-pink-700", light: "bg-pink-50", dot: "#DB2777" },
};

const TABS = [
  { key: "presentation", label: "Presentaciones", emoji: "🎵" },
  { key: "rehearsal", label: "Ensayos", emoji: "🎼" },
  { key: "activity", label: "Actividades", emoji: "🎉" },
  { key: "other", label: "Otros", emoji: "📌" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDaysUntil(dateMs) {
  return Math.ceil((new Date(Number(dateMs)) - new Date()) / (1000 * 60 * 60 * 24));
}

function getUrgencyLabel(days) {
  if (days < 0) return { label: "Pasado", color: "text-slate-500 bg-slate-100" };
  if (days === 0) return { label: "¡Hoy!", color: "text-white bg-red-500" };
  if (days === 1) return { label: "Mañana", color: "text-white bg-orange-500" };
  if (days <= 7) return { label: `${days}d`, color: "text-white bg-amber-500" };
  if (days <= 30) return { label: `${days} días`, color: "text-slate-700 bg-slate-100" };
  return { label: `${days} días`, color: "text-slate-400 bg-slate-50" };
}

const FORBIDDEN_FIELDS = new Set([
  "__typename",
  "_id",
  "createdAt",
  "updatedAt",
  "notificationLog",
  "createdBy",
  "updatedBy",
  "priority",
  "visibility",
  "__v",
]);

function resolveTabKey(event) {
  const cat = (event.category ?? "").toLowerCase();
  if (["presentation"].includes(cat)) return "presentation";
  if (["rehearsal"].includes(cat)) return "rehearsal";
  if (["activity"].includes(cat)) return "activity";
  // meeting y logistics van a "other" también
  return "other";
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

  const [drawer, setDrawer] = useState({ open: false, event: null });
  const [formModal, setFormModal] = useState({ open: false, mode: null, event: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, event: null });
  const [activeTab, setActiveTab] = useState("presentation");
  const [bandFilter, setBandFilter] = useState("all");

  const currentUser = userData?.getUser ?? null;
  const userId = currentUser?.id ?? null;
  const isAdmin = ADMIN_ROLES.has(String(currentUser?.role ?? ""));

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await generateToken();
        if (!token || cancelled) return;
        await updateNotificationToken({ variables: { userId, token } });
      } catch (err) {
        console.error("[Dashboard] Token:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, updateNotificationToken]);

  useEffect(() => {
    if (!messaging) return;
    try {
      const unsub = onMessage(messaging, () => {});
      return () => {
        if (typeof unsub === "function") unsub();
      };
    } catch {
      return undefined;
    }
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────────
  const allEvents = useMemo(
    () => (Array.isArray(eventData?.getEvents) ? eventData.getEvents : []),
    [eventData?.getEvents]
  );

  const upcomingEvents = useMemo(
    () =>
      allEvents
        .filter((e) => getDaysUntil(e.date) >= 0)
        .sort((a, b) => buildSortKey(a) - buildSortKey(b)),
    [allEvents]
  );

  const eventsByTab = useMemo(() => {
    const groups = { presentation: [], rehearsal: [], activity: [], other: [] };
    upcomingEvents.forEach((e) => {
      const key = resolveTabKey(e);
      groups[key].push(e);
    });
    return groups;
  }, [upcomingEvents]);

  const tabEvents = eventsByTab[activeTab] ?? [];

  const availableBands = useMemo(
    () => [...new Set(eventsByTab.presentation.map((e) => e.type).filter(Boolean))],
    [eventsByTab.presentation]
  );

  const filteredEvents = useMemo(() => {
    if (activeTab !== "presentation" || bandFilter === "all") return tabEvents;
    return tabEvents.filter((e) => e.type === bandFilter);
  }, [tabEvents, activeTab, bandFilter]);

  const heroEvent = filteredEvents[0] ?? null;
  const gridEvents = filteredEvents.slice(1);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openDrawer = useCallback((event) => setDrawer({ open: true, event }), []);
  const closeDrawer = useCallback(() => setDrawer({ open: false, event: null }), []);
  const openAddForm = useCallback(() => setFormModal({ open: true, mode: "add", event: null }), []);
  const closeFormModal = useCallback(
    () => setFormModal({ open: false, mode: null, event: null }),
    []
  );
  const openDeleteModal = useCallback((event) => setDeleteModal({ open: true, event }), []);
  const closeDeleteModal = useCallback(() => setDeleteModal({ open: false, event: null }), []);

  const openEditForm = useCallback((event) => {
    const clean = Object.fromEntries(
      Object.entries(event).filter(([k]) => !FORBIDDEN_FIELDS.has(k))
    );
    setFormModal({
      open: true,
      mode: "edit",
      event: {
        ...clean,
        time: normalizeTimeTo12h(event.time),
        departure: normalizeTimeTo12h(event.departure),
        arrival: normalizeTimeTo12h(event.arrival),
      },
    });
  }, []);

  const handleAddEvent = useCallback(
    async (input) => {
      try {
        await addEvent({ variables: { input } });
        closeFormModal();
      } catch (err) {
        console.error("[Dashboard] Add:", err);
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
        console.error("[Dashboard] Update:", err);
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
      console.error("[Dashboard] Delete:", err);
    }
  }, [deleteModal.event?.id, deleteEvent, closeDeleteModal, drawer.event?.id, closeDrawer]);

  if (userLoading || usersLoading || eventLoading)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <Skeleton />
        <Footer />
      </DashboardLayout>
    );

  if (eventError)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ErrorState msg={eventError.message} />
        <Footer />
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 48 }}>
        <WelcomeHeader user={currentUser} isAdmin={isAdmin} onAddEvent={openAddForm} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* <StatsRow events={upcomingEvents} presentations={eventsByTab.presentation} /> */}
          <NextEventBanner event={upcomingEvents[0]} />
          {/* <MonthTimeline events={upcomingEvents} /> */}

          {/* <ContextualBanner upcomingEvents={upcomingEvents} rehearsals={eventsByTab.rehearsal} /> */}

          {/* ── Tabs ─────────────────────────────────────────────────────── */}
          <div style={{ marginTop: 32 }}>
            {/* Tab bar */}
            <div
              style={{
                display: "flex",
                background: "#f1f5f9",
                borderRadius: 14,
                padding: 4,
                gap: 2,
                overflowX: "auto",
              }}
            >
              {TABS.map((tab) => {
                const count = eventsByTab[tab.key]?.length ?? 0;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setBandFilter("all");
                    }}
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "9px 14px",
                      borderRadius: 11,
                      border: "none",
                      background: active ? "#ffffff" : "transparent",
                      color: active ? "#0f172a" : "#64748b",
                      fontSize: 12,
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s",
                      boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{tab.emoji}</span>
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span
                        style={{
                          minWidth: 18,
                          height: 18,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 99,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "0 5px",
                          background: active ? "#0f172a" : "#e2e8f0",
                          color: active ? "#ffffff" : "#64748b",
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Filtro de banda */}
            {activeTab === "presentation" && availableBands.length > 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                <BandPill
                  label="Todas"
                  active={bandFilter === "all"}
                  onClick={() => setBandFilter("all")}
                />
                {availableBands.map((band) => (
                  <BandPill
                    key={band}
                    label={band}
                    active={bandFilter === band}
                    dot={BAND_COLORS[band]?.dot}
                    onClick={() => setBandFilter(band === bandFilter ? "all" : band)}
                  />
                ))}
              </div>
            )}

            {/* Conteo */}
            <p style={{ margin: "14px 0 16px", fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
              {filteredEvents.length === 0
                ? "Sin eventos próximos en esta categoría"
                : `${filteredEvents.length} evento${
                    filteredEvents.length !== 1 ? "s" : ""
                  } próximo${filteredEvents.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* ── Contenido ─────────────────────────────────────────────────── */}
          {filteredEvents.length === 0 ? (
            <EmptyState isAdmin={isAdmin} onAddEvent={openAddForm} />
          ) : (
            <>
              {heroEvent && (
                <div style={{ marginBottom: 20 }}>
                  <PresentationHero
                    event={heroEvent}
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
              {gridEvents.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gridEvents.map((event) => (
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
            </>
          )}
        </div>
      </div>

      <EventDrawer
        open={drawer.open}
        event={drawer.event}
        isAdmin={isAdmin}
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

// ─── WelcomeHeader ────────────────────────────────────────────────────────────
export function WelcomeHeader({ user, isAdmin, onAddEvent }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const firstName = user?.name ?? "músico";
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
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #f0f0f0",
        marginBottom: 0,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "28px 24px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Left: greeting block */}
        <div>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#a1a1a1",
            }}
          >
            Banda CEDES Don Bosco &nbsp;·&nbsp; {weekday.charAt(0).toUpperCase() + weekday.slice(1)}
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(22px, 3.5vw, 34px)",
              fontWeight: 700,
              color: "#111111",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
            }}
          >
            {greeting}, <span style={{ color: "#111111" }}>{firstName}</span>
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              fontSize: 12,
              color: "#b0b0b0",
              letterSpacing: "0.01em",
            }}
          >
            {datePart.charAt(0).toUpperCase() + datePart.slice(1)}
          </p>
        </div>

        {/* Right: action button */}
        {isAdmin && (
          <button
            onClick={onAddEvent}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 18px",
              borderRadius: 12,
              border: "1.5px solid #e5e5e5",
              background: "#ffffff",
              color: "#111111",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "-0.01em",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "background 0.12s, border-color 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f7f7f7";
              e.currentTarget.style.borderColor = "#d0d0d0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e5e5";
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 6,
                background: "#111111",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="9"
                height="9"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="3"
                stroke="#ffffff"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </span>
            Nuevo evento
          </button>
        )}
      </div>
    </div>
  );
}
WelcomeHeader.propTypes = {
  user: PropTypes.shape({ name: PropTypes.string }),
  isAdmin: PropTypes.bool,
  onAddEvent: PropTypes.func.isRequired,
};

// ─── StatsRow ─────────────────────────────────────────────────────────────────
export function StatsRow({ events, presentations }) {
  const today = new Date();
  const thisMonth = presentations.filter((e) => {
    const d = new Date(Number(e.date));
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;
  const next = presentations[0];
  const daysToNext = next ? Math.max(0, getDaysUntil(next.date)) : null;
  const bands = new Set(presentations.map((e) => e.type).filter(Boolean)).size;

  const isUrgent = daysToNext !== null && daysToNext <= 7;

  const stats = [
    {
      n: presentations.length,
      label: "Presentaciones",
      sub: "próximas",
      accentColor: "#2563eb",
      accentBg: "#eff6ff",
      icon: (
        <svg
          width="15"
          height="15"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      ),
    },
    {
      n: thisMonth,
      label: "Este mes",
      sub: "presentaciones",
      accentColor: "#7c3aed",
      accentBg: "#f5f3ff",
      icon: (
        <svg
          width="15"
          height="15"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
      ),
    },
    {
      n: daysToNext !== null ? daysToNext : "—",
      label:
        daysToNext === 0
          ? "¡Hoy!"
          : daysToNext === 1
          ? "Mañana"
          : daysToNext !== null
          ? `${daysToNext} días`
          : "Sin fecha",
      sub: "próxima presentación",
      accentColor: isUrgent ? "#dc2626" : "#d97706",
      accentBg: isUrgent ? "#fef2f2" : "#fffbeb",
      icon: (
        <svg
          width="15"
          height="15"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      n: bands,
      label: "Agrupaciones",
      sub: "participando",
      accentColor: "#059669",
      accentBg: "#ecfdf5",
      icon: (
        <svg
          width="15"
          height="15"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 8,
        marginTop: 20,
      }}
      className="lg:grid-cols-4"
    >
      {stats.map((s, i) => (
        <div
          key={i}
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "16px 18px",
            border: "1px solid #f0f0f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: s.accentBg,
              color: s.accentColor,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              flexShrink: 0,
            }}
          >
            {s.icon}
          </div>

          {/* Number */}
          <p
            style={{
              margin: 0,
              fontSize: "clamp(24px, 2.8vw, 32px)",
              fontWeight: 700,
              color: "#111111",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
            }}
          >
            {s.n}
          </p>

          {/* Label */}
          <p
            style={{
              margin: "6px 0 2px",
              fontSize: 12,
              fontWeight: 600,
              color: "#333333",
              letterSpacing: "-0.01em",
            }}
          >
            {s.label}
          </p>

          {/* Sub */}
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: "#b0b0b0",
              fontWeight: 400,
            }}
          >
            {s.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
StatsRow.propTypes = {
  events: PropTypes.array.isRequired,
  presentations: PropTypes.array.isRequired,
};

// ─── BandPill ─────────────────────────────────────────────────────────────────
function BandPill({ label, active, dot, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        padding: "5px 12px",
        borderRadius: 99,
        border: `1.5px solid ${active ? "#0f172a" : "#e2e8f0"}`,
        background: active ? "#0f172a" : "#fff",
        color: active ? "#fff" : "#475569",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {active && dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: dot,
            display: "inline-block",
          }}
        />
      )}
      {label}
    </button>
  );
}
BandPill.propTypes = {
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  dot: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ isAdmin, onAddEvent }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        border: "2px dashed #e2e8f0",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>🎵</div>
      <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
        Sin eventos próximos
      </h3>
      <p
        style={{
          margin: "0 0 20px",
          fontSize: 13,
          color: "#94a3b8",
          maxWidth: 280,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        No hay eventos programados en esta categoría.
      </p>
      {isAdmin && (
        <button
          onClick={onAddEvent}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            padding: "10px 20px",
            borderRadius: 12,
            border: "none",
            background: "#0f172a",
            color: "#fff",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Crear evento
        </button>
      )}
    </div>
  );
}
EmptyState.propTypes = { isAdmin: PropTypes.bool, onAddEvent: PropTypes.func.isRequired };

function Skeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }} className="animate-pulse">
      <div style={{ height: 140, background: "#e2e8f0" }} />
      <div
        className="max-w-7xl mx-auto px-4 py-8"
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 90, background: "#e2e8f0", borderRadius: 16 }} />
          ))}
        </div>
        <div style={{ height: 48, background: "#e2e8f0", borderRadius: 14 }} />
        <div style={{ height: 180, background: "#e2e8f0", borderRadius: 20 }} />
      </div>
    </div>
  );
}

function ErrorState({ msg }) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 32,
          textAlign: "center",
          maxWidth: 360,
          border: "1px solid #fecaca",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
          Error cargando datos
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{msg}</p>
      </div>
    </div>
  );
}
ErrorState.propTypes = { msg: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired };
