/* eslint-disable react/prop-types */
/**
 * TourDetailPage — detalle de gira con tabs.
 * Toma el tourId de useParams() → /tours/:tourId
 *
 * Comportamiento por rol:
 *   - Admin/Director/Subdirector: vista administrativa completa (todos los tabs)
 *   - Resto: vista self-service (solo tabs habilitados en tour.selfServiceAccess)
 */
import { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useTour } from "./useTour";
import TourImportsPage from "./tourImports/TourImportsPage";
import TourFlightsPage from "./tourFlights/TourFlightsPage";
import { TourStatusBadge, formatTourDateRange, getTourDuration } from "./TourHelpers";
import TourPaymentsPage from "./tourPayments/TourPaymentsPage";
import TourRoomsPage from "./tourRooms/TourRoomsPage";
import TourDocumentsPage from "./tourDocuments/TourDocumentsPage";
import { useTourSelfService } from "./selfService/useTourSelfService";
import TourSelfServiceDocuments from "./selfService/TourSelfServiceDocuments";
import TourSelfServicePayments from "./selfService/TourSelfServicePayments";
import TourSelfServiceConfig from "./TourSelfServiceConfig";
import TourParentView from "./selfService/TourParentView";

// Roles con acceso administrativo completo a giras
const ADMIN_ROLES = new Set(["Admin", "Director", "Subdirector"]);
const TOUR_FINANCE_ROLES = new Set(["CEDES Financiero"]);

// Query mínima para saber si el actor actual es un User o un Parent.
// getUser devuelve null para Parents → userData === null solo cuando ha terminado de cargar.
const CHECK_ACTOR = gql`
  query CheckTourActor {
    getUser { id role }
  }
`;

function isAdminRole(role) {
  return ADMIN_ROLES.has(role);
}

function isTourFinanceRole(role) {
  return TOUR_FINANCE_ROLES.has(role);
}

// Todos los tabs disponibles en vista admin
const ADMIN_TABS = [
  { id: "documents", label: "Documentos", emoji: "📄" },
  { id: "payments",  label: "Pagos",       emoji: "💰" },
  { id: "flights",   label: "Vuelos",      emoji: "✈️" },
  { id: "rooms",     label: "Habitaciones",emoji: "🏨" },
  { id: "imports",   label: "Importación", emoji: "📋" },
];

const FINANCIAL_TABS = [
  { id: "documents", label: "Documentos", emoji: "📄" },
  { id: "payments", label: "Control financiero", emoji: "💰" },
];

// Tabs disponibles en self-service (solo documentos y pagos por ahora)
const SELF_SERVICE_TABS = [
  { id: "documents", label: "Mis documentos", emoji: "📄", moduleKey: "documents" },
  { id: "payments",  label: "Mis pagos",      emoji: "💰", moduleKey: "payments"  },
];

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function TourInfoCard({ tour }) {
  const duration = getTourDuration(tour.startDate, tour.endDate);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-lg font-bold text-gray-900">{tour.name}</h2>
            <TourStatusBadge status={tour.status} />
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="text-sm text-gray-600">{tour.destination}, {tour.country}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 font-medium">Período</p>
            <p className="text-sm font-semibold text-gray-700">
              {formatTourDateRange(tour.startDate, tour.endDate)}
            </p>
          </div>
          {duration && (
            <div className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-400">Duración</p>
              <p className="text-sm font-bold text-gray-900">{duration}</p>
            </div>
          )}
        </div>
      </div>
      {tour.description && (
        <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">{tour.description}</p>
      )}
    </div>
  );
}

// Vista admin: renderiza el sub-módulo completo por tab
function AdminTabContent({ activeTab, tour, onTourRefetch }) {
  switch (activeTab) {
    case "imports":
      return (
        <div className="space-y-5">
          {/* Config self-service — siempre visible en tab Imports para el admin */}
          <TourSelfServiceConfig tour={tour} onSaved={onTourRefetch} />
          <TourImportsPage tourId={tour.id} tourName={tour.name} />
        </div>
      );
    case "flights":   return <TourFlightsPage  tourId={tour.id} tourName={tour.name} />;
    case "rooms":     return <TourRoomsPage    tourId={tour.id} tourName={tour.name} />;
    case "payments":  return <TourPaymentsPage tourId={tour.id} tourName={tour.name} />;
    case "documents": return <TourDocumentsPage tourId={tour.id} tourName={tour.name} tour={tour} />;
    default:          return null;
  }
}

// ─── Vista self-service ───────────────────────────────────────────────────────

function SelfServiceView({ tour }) {
  const { selfServiceAccess } = tour;

  const { participant, paymentAccount, loading, isLinked, isNotLinkedError, participantError } =
    useTourSelfService({ tourId: tour.id, selfServiceAccess });

    console.log("particpant", participant)
    console.log("payment account;", paymentAccount)

  // Calcular tabs visibles para este usuario
  const visibleTabs = SELF_SERVICE_TABS.filter(
    (t) => selfServiceAccess?.enabled && selfServiceAccess?.[t.moduleKey] !== false
  );

  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id ?? "documents");

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-gray-100 rounded-2xl" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  // Auto-service no habilitado
  if (!selfServiceAccess?.enabled) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <p className="text-2xl mb-2">🔒</p>
        <p className="text-sm font-bold text-amber-800">Acceso self-service no disponible</p>
        <p className="text-xs text-amber-700 mt-1">
          El administrador aún no ha habilitado el acceso para participantes en esta gira.
        </p>
      </div>
    );
  }

  // Usuario no vinculado
  if (!isLinked || isNotLinkedError) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
        <p className="text-2xl mb-2">👤</p>
        <p className="text-sm font-bold text-blue-800">Perfil no vinculado</p>
        <p className="text-xs text-blue-700 mt-1">
          {participantError?.message ||
            "Tu perfil aún no ha sido vinculado como participante de esta gira. " +
            "Contacta al administrador."}
        </p>
      </div>
    );
  }

  if (visibleTabs.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
        <p className="text-2xl mb-2">📭</p>
        <p className="text-sm font-bold text-gray-700">Sin módulos disponibles</p>
        <p className="text-xs text-gray-500 mt-1">
          No hay módulos habilitados para tu acceso en esta gira.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Info del participante */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
          {participant.firstName?.[0]}{participant.firstSurname?.[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {participant.firstName} {participant.firstSurname} {participant.secondSurname}
          </p>
          <p className="text-xs text-gray-500 truncate">{participant.role} · {participant.status}</p>
        </div>
      </div>

      {/* Tabs self-service */}
      {visibleTabs.length > 1 && (
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Contenido del tab activo */}
      {activeTab === "documents" && <TourSelfServiceDocuments participant={participant} />}
      {activeTab === "payments"  && <TourSelfServicePayments  paymentAccount={paymentAccount} />}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TourDetailPage() {
  const navigate = useNavigate();
  const { tour, loading, error, refetch } = useTour();
  const [activeTab, setActiveTab] = useState("documents");

  // Use query result directly — UserContext.userData relies on useState with deps (bug)
  // so it may never be set. Apollo cache makes this query free after the first load.
  // actorData?.getUser:
  //   undefined → still loading
  //   null      → Parent entity (getUser returns null for parents)
  //   {...}     → User entity with role
  const { data: actorData, loading: actorLoading } = useQuery(CHECK_ACTOR);
  const currentUser = actorData?.getUser; // undefined | null | { id, role }

  const isAdmin = !actorLoading && isAdminRole(currentUser?.role);
  const isTourFinance = !actorLoading && isTourFinanceRole(currentUser?.role);
  const isParent = !actorLoading && currentUser === null;

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <div className="p-4 mt-1 space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-gray-100 rounded-xl" />
          <div className="h-28 bg-gray-100 rounded-2xl" />
          <div className="h-12 bg-gray-100 rounded-2xl" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
        <Footer />
      </DashboardLayout>
    );
  }

  if (error || !tour) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <div className="p-4 mt-1">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center">
            <p className="text-3xl mb-3">⚠️</p>
            <p className="text-base font-bold text-red-700">Gira no encontrada</p>
            <p className="text-sm text-red-500 mt-1">
              {error?.message || "El ID no corresponde a ninguna gira."}
            </p>
            <button
              onClick={() => navigate("/tours")}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-2xl transition-all"
            >
              ← Volver a giras
            </button>
          </div>
        </div>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="space-y-5 pb-16">
        {/* Breadcrumb */}
        <div className="px-4 mt-1 flex items-center gap-2">
          <button
            onClick={() => navigate("/tours")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Giras
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900 truncate">{tour.name}</span>
        </div>

        {/* Info card */}
        <div className="px-4">
          <TourInfoCard tour={tour} />
        </div>

        {/* Vista padre: hijos vinculados a la gira */}
        {isParent ? (
          <div className="px-4">
            <TourParentView tour={tour} />
          </div>
        ) : isAdmin ? (
          <>
            <div className="px-4">
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto">
                {ADMIN_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                      activeTab === tab.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span>{tab.emoji}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4">
              <AdminTabContent activeTab={activeTab} tour={tour} onTourRefetch={refetch} />
            </div>
          </>
        ) : isTourFinance ? (
          <>
            <div className="px-4">
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto">
                {FINANCIAL_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                      activeTab === tab.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span>{tab.emoji}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4">
              <AdminTabContent activeTab={activeTab} tour={tour} onTourRefetch={refetch} />
            </div>
          </>
        ) : (
          /* Vista self-service: solo lo que está habilitado */
          <div className="px-4">
            <SelfServiceView tour={tour} />
          </div>
        )}
      </div>
      <Footer />
    </DashboardLayout>
  );
}
