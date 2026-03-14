/* eslint-disable react/prop-types */
/**
 * TourDetailPage — detalle de gira con tabs.
 * Toma el tourId de useParams() → /tours/:tourId
 */
import { useState } from "react";
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

const TABS = [
  { id: "documents", label: "Documentos", emoji: "📄" },
  { id: "payments", label: "Pagos", emoji: "💰" },
  { id: "flights", label: "Vuelos", emoji: "✈️" },
  { id: "rooms", label: "Habitaciones", emoji: "🏨" },
  { id: "imports", label: "Importación", emoji: "📋" },
];

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
            <svg
              className="w-3.5 h-3.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
            </svg>
            <span className="text-sm text-gray-600">
              {tour.destination}, {tour.country}
            </span>
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
        <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
          {tour.description}
        </p>
      )}
    </div>
  );
}

function TabContent({ activeTab, tour }) {
  switch (activeTab) {
    case "imports":
      return <TourImportsPage tourId={tour.id} tourName={tour.name} />;
    case "flights":
      return <TourFlightsPage tourId={tour.id} tourName={tour.name} />;
    case "rooms":
      return <TourRoomsPage tourId={tour.id} tourName={tour.name} />;
    case "payments":
      return <TourPaymentsPage tourId={tour.id} tourName={tour.name} />;
    case "documents":
      return <TourDocumentsPage tourId={tour.id} tourName={tour.name} tour={tour} />;
    default:
      return null;
  }
}

export default function TourDetailPage() {
  const navigate = useNavigate();
  const { tour, loading, error } = useTour();
  const [activeTab, setActiveTab] = useState("imports");

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
        <div className="px-4 mt-1 flex items-center gap-2">
          <button
            onClick={() => navigate("/tours")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Giras
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900 truncate">{tour.name}</span>
        </div>

        <div className="px-4">
          <TourInfoCard tour={tour} />
        </div>

        <div className="px-4">
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto">
            {TABS.map((tab) => (
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
          <TabContent activeTab={activeTab} tour={tour} />
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
}
