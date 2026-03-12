// src/layouts/dashboard/index.js  (Dashboard.jsx principal)
// Todos los imports de constantes vienen de ./constants para evitar
// imports circulares con los sub-componentes.

import { useCallback, useMemo, useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";

import { ADD_EVENT, UPDATE_EVENT, DELETE_EVENT } from "graphql/mutations";
import { GET_EVENTS } from "graphql/queries";

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
import { useFirebaseMessaging } from "hooks/useFirebaseMessaging";

import { BAND_COLORS } from "./constants"; // ← constantes centralizadas

import { NextEventBanner } from "./components/EventHighlights";
import { WelcomeHeader } from "./components/WelcomeHeader";
import { DashboardTabs } from "./components/DashboardTabs";
import { EmptyState } from "./components/EmptyState";
import { Skeleton } from "./components/Skeleton";
import { ErrorState } from "./components/ErrorState";
// StatsRow disponible si querés descomentarla:
// import { StatsRow } from "./components/StatsRow";

/* =========================
   Constants
========================= */

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

/* =========================
   Pure helpers (module-level — never re-created on render)
========================= */

export function getDaysUntil(dateMs) {
  return Math.ceil((new Date(Number(dateMs)) - new Date()) / (1000 * 60 * 60 * 24));
}

export function getUrgencyLabel(days) {
  if (days < 0) return { label: "Pasado", color: "text-slate-500 bg-slate-100" };
  if (days === 0) return { label: "¡Hoy!", color: "text-white bg-red-500" };
  if (days === 1) return { label: "Mañana", color: "text-white bg-orange-500" };
  if (days <= 7) return { label: `${days}d`, color: "text-white bg-amber-500" };
  if (days <= 30) return { label: `${days} días`, color: "text-slate-700 bg-slate-100" };
  return { label: `${days} días`, color: "text-slate-400 bg-slate-50" };
}

function resolveTabKey(event) {
  const cat = (event.category ?? "").toLowerCase();
  if (cat === "presentation") return "presentation";
  if (cat === "rehearsal") return "rehearsal";
  if (cat === "activity") return "activity";
  return "other";
}

/* =========================
   Component
========================= */

export default function Dashboard() {
  const { data: userData, loading: userLoading } = useQuery(GET_CURRENT_USER);
  const { data: eventData, loading: eventLoading, error: eventError } = useQuery(GET_EVENTS);

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

  useFirebaseMessaging(userId);

  // ── Derived data ─────────────────────────────────────────────────────────
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
      groups[resolveTabKey(e)].push(e);
    });
    return groups;
  }, [upcomingEvents]);

  const availableBands = useMemo(
    () => [...new Set(eventsByTab.presentation.map((e) => e.type).filter(Boolean))],
    [eventsByTab.presentation]
  );

  const filteredEvents = useMemo(() => {
    const tabEvents = eventsByTab[activeTab] ?? [];
    if (activeTab !== "presentation" || bandFilter === "all") return tabEvents;
    return tabEvents.filter((e) => e.type === bandFilter);
  }, [eventsByTab, activeTab, bandFilter]);

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

  // ── Render guards ─────────────────────────────────────────────────────────
  if (userLoading || eventLoading)
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
          <NextEventBanner event={upcomingEvents[0]} />

          {/* StatsRow disponible — descomentar si se necesita:
          <StatsRow presentations={eventsByTab.presentation} />
          */}

          <DashboardTabs
            activeTab={activeTab}
            eventsByTab={eventsByTab}
            availableBands={availableBands}
            bandFilter={bandFilter}
            filteredEvents={filteredEvents}
            onTabChange={(key) => {
              setActiveTab(key);
              setBandFilter("all");
            }}
            onBandFilterChange={setBandFilter}
          />

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
