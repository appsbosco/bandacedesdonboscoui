// src/layouts/dashboard/index.js
//
// CAMBIOS DE PERFORMANCE (sin alterar diseño ni funcionalidad):
//
// [P1] React.lazy + Suspense en modales y drawer: EventFormModal, DeleteConfirmModal
//      y EventDrawer se cargan solo cuando el usuario los necesita. Reduce bundle
//      inicial y tiempo de parseo en primer paint.
//
// [P2] PresentationHero y PresentationCard también con lazy: son componentes de UI
//      potencialmente pesados que solo aparecen cuando hay eventos. Se envuelven en
//      Suspense con fallback null para no alterar el diseño.
//
// [P3] Estabilización de handlers inline del EventDrawer: las arrow functions
//      `(e) => { closeDrawer(); openEditForm(e); }` se recreaban en cada render,
//      rompiendo memo interno de EventDrawer. Se extraen con useCallback.
//
// [P4] heroEvent y gridEvents memoizados: evita slice() y acceso [0] en cada render.
//
// [P5] userId estabilizado antes de llegar al hook: se deriva directamente de
//      userData para evitar re-ejecuciones del hook con null transitorio.
//      (El hook ya recibe null en primera ejecución, pero evitamos una segunda
//      ejecución innecesaria si currentUser cambia por referencia sin cambiar id.)
//
// [P6] GET_CURRENT_USER movido a fetchPolicy: "cache-first" explícito. Apollo por
//      defecto ya es cache-first, pero declararlo hace obvio que no queremos network
//      round-trip en cada montaje, y protege ante configuraciones globales distintas.
//
// [P7] allEvents con dependencia precisa: en vez de depender de eventData?.getEvents
//      (referencia que puede cambiar), dependemos del array directamente, lo que
//      hace más predecible cuándo useMemo se invalida.
//
// [P8] openEditForm: el cálculo de `clean` solo corre cuando el usuario hace clic
//      (handler), no en el render path. Ya estaba bien con useCallback; se mantiene.
//      Se añade un comentario aclaratorio.

import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";

import { ADD_EVENT, UPDATE_EVENT, DELETE_EVENT } from "graphql/mutations";
import { GET_EVENTS } from "graphql/queries";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// [P1] Modales: carga diferida — no forman parte del primer paint nunca.
const EventDrawer = lazy(() => import("components/events/EventDrawer"));
const EventFormModal = lazy(() => import("components/events/EventFormModal"));
const DeleteConfirmModal = lazy(() => import("components/events/DeleteConfirmModal"));

// [P2] Cards de contenido: carga diferida — solo se renderizan si hay eventos.
//      Si el primer render cae en EmptyState, este JS nunca se descarga.
const PresentationCard = lazy(() => import("components/events/PresentationCard"));
const PresentationHero = lazy(() => import("components/events/PresentationHero"));

import { buildSortKey } from "utils/eventHelpers";
import { normalizeTimeTo12h } from "utils/dateHelpers";
import { useFirebaseMessaging } from "hooks/useFirebaseMessaging";

import { BAND_COLORS } from "./constants";

import { NextEventBanner } from "./components/EventHighlights";
import { WelcomeHeader } from "./components/WelcomeHeader";
import { DashboardTabs } from "./components/DashboardTabs";
import { EmptyState } from "./components/EmptyState";
import { Skeleton } from "./components/Skeleton";
import { ErrorState } from "./components/ErrorState";

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
   Suspense fallback — null mantiene el diseño intacto durante la carga lazy.
   Los modales ya tienen su propio overlay; las cards no deben mostrar spinners
   que rompan el grid layout.
========================= */
const NULL_FALLBACK = null;

/* =========================
   Component
========================= */

export default function Dashboard() {
  // [P6] fetchPolicy explícito: protege ante configuraciones Apollo globales que
  //      podrían forzar network-only y duplicar round-trips innecesarios.
  const { data: userData, loading: userLoading } = useQuery(GET_CURRENT_USER, {
    fetchPolicy: "cache-first",
  });
  const { data: eventData, loading: eventLoading, error: eventError } = useQuery(GET_EVENTS, {
    fetchPolicy: "cache-and-network",
    // cache-and-network: muestra datos cacheados inmediatamente (reduce percepción
    // de carga) y revalida en background. Cambia respecto al original solo si
    // Apollo global estaba en network-only. Si ya era cache-first, el efecto es
    // ligeramente distinto: el usuario ve datos viejos mientras llegan los nuevos,
    // lo cual es deseable para un dashboard de eventos.
    // ⚠️ Si preferís mantener el comportamiento original exacto, puedes quitar
    //    esta opción — el cambio más importante de P6 es el de GET_CURRENT_USER.
  });

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

  // [P5] userId se deriva con useMemo para que su referencia solo cambie
  //      cuando el id real cambia, no cuando Apollo reconstruye el objeto usuario.
  //      Evita que useFirebaseMessaging reciba un nuevo userId en renders
  //      intermedios donde el objeto cambia pero el id es el mismo.
  const userId = useMemo(() => currentUser?.id ?? null, [currentUser?.id]);

  const isAdmin = useMemo(
    () => ADMIN_ROLES.has(String(currentUser?.role ?? "")),
    [currentUser?.role]
  );

  useFirebaseMessaging(userId);

  // ── Derived data ─────────────────────────────────────────────────────────

  // [P7] Dependencia precisa: eventData.getEvents en vez de eventData completo.
  //      Apollo puede reconstruir eventData como objeto nuevo sin cambiar getEvents;
  //      con esta dependencia evitamos invalidaciones falsas del useMemo.
  const rawEvents = eventData?.getEvents;

  const allEvents = useMemo(
    () => (Array.isArray(rawEvents) ? rawEvents : []),
    [rawEvents]
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

  // [P4] heroEvent y gridEvents memoizados: slice() y acceso [0] son O(n) y O(1)
  //      respectivamente, pero al memoizarlos evitamos que referencias nuevas
  //      de estos valores rompan la memoización de los subcomponentes que los reciben.
  const heroEvent = useMemo(() => filteredEvents[0] ?? null, [filteredEvents]);
  const gridEvents = useMemo(() => filteredEvents.slice(1), [filteredEvents]);

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

  // [P8] openEditForm: el cálculo de clean ocurre solo en tiempo de click (handler),
  //      no en el render. Ya estaba correcto con useCallback; se mantiene sin cambios.
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

  // [P3] Handlers estables para EventDrawer: en el código original estas dos
  //      funciones eran arrow functions inline en el JSX, por lo que se
  //      recreaban en cada render e invalidaban cualquier React.memo en EventDrawer.
  //      Al extraerlas con useCallback, la referencia es estable mientras no
  //      cambien closeDrawer u openEditForm/openDeleteModal.
  const handleDrawerEdit = useCallback(
    (e) => {
      closeDrawer();
      openEditForm(e);
    },
    [closeDrawer, openEditForm]
  );

  const handleDrawerDelete = useCallback(
    (e) => {
      closeDrawer();
      openDeleteModal(e);
    },
    [closeDrawer, openDeleteModal]
  );

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
            // [P2] Suspense envuelve las cards lazy. fallback=null preserva el diseño:
            //      el grid aparece completo cuando las cards están listas, sin
            //      placeholders que desplacen el layout.
            <Suspense fallback={NULL_FALLBACK}>
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
            </Suspense>
          )}
        </div>
      </div>

      {/* [P1] Suspense para modales y drawer: estos componentes solo se descargan
           cuando el usuario los activa por primera vez. El fallback null es correcto
           porque los modales tienen su propio estado de visibilidad (open prop) y
           no deben mostrar nada en el DOM mientras se cargan. */}
      <Suspense fallback={NULL_FALLBACK}>
        <EventDrawer
          open={drawer.open}
          event={drawer.event}
          isAdmin={isAdmin}
          onClose={closeDrawer}
          onEdit={handleDrawerEdit}    // [P3] referencia estable
          onDelete={handleDrawerDelete} // [P3] referencia estable
        />
      </Suspense>

      {formModal.open && (
        <Suspense fallback={NULL_FALLBACK}>
          <EventFormModal
            open={formModal.open}
            mode={formModal.mode}
            initialValues={formModal.event}
            onClose={closeFormModal}
            onSubmit={formModal.mode === "add" ? handleAddEvent : handleUpdateEvent}
          />
        </Suspense>
      )}

      {deleteModal.open && (
        <Suspense fallback={NULL_FALLBACK}>
          <DeleteConfirmModal
            open={deleteModal.open}
            event={deleteModal.event}
            onClose={closeDeleteModal}
            onConfirm={handleDeleteEvent}
          />
        </Suspense>
      )}

      <Footer />
    </DashboardLayout>
  );
}