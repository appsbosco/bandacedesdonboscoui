/* eslint-disable react/prop-types */
/**
 * TourParentView
 * Vista self-service para padres de familia.
 * Muestra los hijos vinculados como participantes en la gira
 * con selector de hijo y las mismas pestañas de documentos y pagos.
 */
import { useState } from "react";
import { useTourParentAccess } from "./useTourParentAccess";
import TourSelfServiceDocuments from "./TourSelfServiceDocuments";
import TourSelfServicePayments from "./TourSelfServicePayments";

const TABS = [
  { id: "documents", label: "Documentos", emoji: "📄", moduleKey: "documents" },
  { id: "payments",  label: "Pagos",      emoji: "💰", moduleKey: "payments"  },
];

export default function TourParentView({ tour }) {
  const { selfServiceAccess } = tour;
  const [activeTab, setActiveTab] = useState("documents");

  const {
    children,
    selectedChild,
    selectedChildUserId,
    setSelectedChildUserId,
    paymentAccount,
    loading,
    paymentLoading,
    childrenError,
  } = useTourParentAccess({ tourId: tour.id, selfServiceAccess });

  // Self-service no habilitado
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

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-gray-100 rounded-2xl" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (childrenError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <p className="text-2xl mb-2">⚠️</p>
        <p className="text-sm font-bold text-red-700">Error al cargar información</p>
        <p className="text-xs text-red-500 mt-1">{childrenError.message}</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
        <p className="text-2xl mb-2">👤</p>
        <p className="text-sm font-bold text-blue-800">Sin hijos vinculados</p>
        <p className="text-xs text-blue-700 mt-1">
          Ninguno de tus hijos ha sido vinculado como participante de esta gira.
          Contacta al administrador.
        </p>
      </div>
    );
  }

  // Tabs visibles según selfServiceAccess
  const visibleTabs = TABS.filter(
    (t) => selfServiceAccess?.[t.moduleKey] !== false
  );

  return (
    <div className="space-y-5">
      {/* Selector de hijo (solo si hay más de uno) */}
      {children.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium mb-2">Seleccionar hijo</p>
          <div className="flex flex-wrap gap-2">
            {children.map((child) => {
              const cId = child.linkedUser?.id;
              const isSelected = cId === selectedChildUserId;
              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildUserId(cId)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                    isSelected
                      ? "bg-blue-50 border-blue-300 text-blue-800"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                    {child.firstName?.[0]}{child.firstSurname?.[0]}
                  </span>
                  {child.firstName} {child.firstSurname}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Info del hijo seleccionado */}
      {selectedChild && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
            {selectedChild.firstName?.[0]}{selectedChild.firstSurname?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {selectedChild.firstName} {selectedChild.firstSurname} {selectedChild.secondSurname}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {selectedChild.role} · {selectedChild.status}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
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

      {/* Contenido */}
      {selectedChild ? (
        <>
          {activeTab === "documents" && visibleTabs.some((t) => t.id === "documents") && (
            <TourSelfServiceDocuments participant={selectedChild} />
          )}
          {activeTab === "payments" && visibleTabs.some((t) => t.id === "payments") && (
            paymentLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-32 bg-gray-100 rounded-2xl" />
              </div>
            ) : (
              <TourSelfServicePayments paymentAccount={paymentAccount} />
            )
          )}
        </>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-sm text-gray-500">Selecciona un hijo para ver su información.</p>
        </div>
      )}
    </div>
  );
}
