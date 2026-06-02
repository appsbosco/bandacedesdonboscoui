/* eslint-disable react/prop-types */
import React, { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { PermissionRequestCard } from "./components/PermissionRequestCard";
import { PermissionReviewModal } from "./components/PermissionReviewModal";
import { GET_ABSENCE_PERMISSIONS_FOR_SECTION } from "./absencePermissions.gql";
import { GET_USERS_BY_ID } from "graphql/queries";

const SECTION_LABELS = {
  FLAUTAS: "Flautas",
  CLARINETES: "Clarinetes",
  SAXOFONES: "Saxofones",
  TROMPETAS: "Trompetas",
  TROMBONES: "Trombones",
  TUBAS: "Tubas",
  EUFONIOS: "Eufonios",
  CORNOS: "Cornos",
  MALLETS: "Mallets",
  PERCUSION: "Percusión",
  COLOR_GUARD: "Color Guard",
  DANZA: "Danza",
  NO_APLICA: "General",
};

const INSTRUMENT_TO_SECTION = {
  Flauta: "FLAUTAS",
  Clarinete: "CLARINETES",
  Saxofón: "SAXOFONES",
  Saxofon: "SAXOFONES",
  Trompeta: "TROMPETAS",
  Trombón: "TROMBONES",
  Trombones: "TROMBONES",
  Tuba: "TUBAS",
  Eufonio: "EUFONIOS",
  Corno: "CORNOS",
  Mallets: "MALLETS",
  Percusión: "PERCUSION",
  "Color Guard": "COLOR_GUARD",
  Danza: "DANZA",
};

function inferSection(instrument) {
  if (!instrument) return null;
  const lower = instrument.toLowerCase();
  for (const [key, val] of Object.entries(INSTRUMENT_TO_SECTION)) {
    if (lower.includes(key.toLowerCase())) return val;
  }
  return null;
}

function getDateRange() {
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const end = new Date();
  end.setDate(end.getDate() + 30);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export function SectionPermissionsView() {
  const [detailPermission, setDetailPermission] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const currentUser = userData?.getUser;

  const userSection = useMemo(() => {
    return currentUser?.section ?? inferSection(currentUser?.instrument) ?? null;
  }, [currentUser]);

  const { startDate, endDate } = getDateRange();

  const { data, loading, refetch } = useQuery(GET_ABSENCE_PERMISSIONS_FOR_SECTION, {
    variables: { section: userSection, startDate, endDate, limit: 100 },
    skip: !userSection,
    fetchPolicy: "cache-and-network",
  });

  const allPermissions = data?.getAbsencePermissionsForSection?.items ?? [];

  const filteredPermissions = useMemo(() => {
    if (!statusFilter) return allPermissions;
    return allPermissions.filter((p) => p.requestStatus === statusFilter);
  }, [allPermissions, statusFilter]);

  const pendingCount = allPermissions.filter((p) => p.requestStatus === "PENDING").length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permisos de mi sección</h1>
          <p className="text-sm text-gray-500 mt-1">
            {userSection
              ? `${SECTION_LABELS[userSection] ?? userSection} · próximos 30 días`
              : "Consultá los permisos de tu sección antes de pasar lista."}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex-shrink-0"
        >
          Actualizar
        </button>
      </div>

      {/* Alert: pending permissions */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="text-amber-500 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-amber-800">
            <strong>{pendingCount}</strong> permiso{pendingCount !== 1 ? "s" : ""} pendiente{pendingCount !== 1 ? "s" : ""} de revisión en tu sección.
          </p>
        </div>
      )}

      {!userSection && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-6 text-center">
          <p className="text-sm text-gray-500">
            Tu usuario no tiene sección asignada. Contactá a un administrador para configurarlo.
          </p>
        </div>
      )}

      {/* Filters */}
      {userSection && (
        <div className="flex gap-1.5 flex-wrap">
          {[
            { value: "", label: "Todos" },
            { value: "PENDING", label: "Pendientes" },
            { value: "APPROVED", label: "Aprobados" },
            { value: "REJECTED", label: "Rechazados" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {userSection && (
        <>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-gray-700">Todo al día</p>
              <p className="text-sm text-gray-400 mt-1">
                No hay permisos pendientes o activos para tu sección en este período.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                {filteredPermissions.length} permiso{filteredPermissions.length !== 1 ? "s" : ""}
              </p>
              {filteredPermissions.map((p) => (
                <PermissionRequestCard
                  key={p.id}
                  permission={p}
                  showStudent
                  onViewDetail={setDetailPermission}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Read-only detail modal */}
      <PermissionReviewModal
        permission={detailPermission}
        isOpen={Boolean(detailPermission)}
        onClose={() => setDetailPermission(null)}
        isReadOnly
      />
    </div>
  );
}
