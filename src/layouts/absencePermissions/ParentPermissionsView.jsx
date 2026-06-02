/* eslint-disable react/prop-types */
import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Modal } from "components/ui/Modal";
import { PermissionRequestDialog } from "./components/PermissionRequestDialog";
import { PermissionRequestCard } from "./components/PermissionRequestCard";
import {
  GET_MY_ABSENCE_PERMISSIONS,
  GET_ABSENCE_PERMISSIONS_FOR_CHILD,
  CANCEL_ABSENCE_PERMISSION_REQUEST,
} from "./absencePermissions.gql";
import { GET_PARENT_DASHBOARD } from "graphql/queries/parents";

// ─── Filter pill ──────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "APPROVED", label: "Aprobados" },
  { value: "REJECTED", label: "Rechazados" },
];
const EMPTY_PERMISSIONS = [];

// ─── Child selector ───────────────────────────────────────────────────────────

function ChildCard({ child, isSelected, onSelect }) {
  const name = `${child.name} ${child.firstSurName}`.trim();
  const isActive = ["Estudiante Activo", "Activo"].includes(child.state);

  return (
    <button
      type="button"
      onClick={() => isActive && onSelect(child)}
      disabled={!isActive}
      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left w-full ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : isActive
          ? "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
          : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
      }`}
    >
      {child.avatar ? (
        <img
          src={child.avatar}
          alt={name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-blue-600">{child.name?.[0] ?? "?"}</span>
        </div>
      )}
      <div className="min-w-0">
        <p
          className={`font-semibold text-sm truncate ${
            isSelected ? "text-blue-700" : "text-gray-900"
          }`}
        >
          {name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {child.instrument ?? "—"}
          {!isActive && " · No activo"}
        </p>
      </div>
      {isSelected && (
        <div className="ml-auto flex-shrink-0">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      )}
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ childSelected }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <p className="font-semibold text-gray-700 mb-1">
        {childSelected ? "Sin permisos enviados" : "Seleccioná un integrante"}
      </p>
      <p className="text-sm text-gray-400 max-w-xs">
        {childSelected
          ? "Reportá una ausencia, una llegada tardía o un retiro anticipado usando el botón de arriba."
          : "Elegí el hijo o hija para el que querés ver o solicitar permisos."}
      </p>
    </div>
  );
}

// ─── Main parent view ─────────────────────────────────────────────────────────

export function ParentPermissionsView() {
  const [selectedChild, setSelectedChild] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  // Load parent dashboard to get children list
  const { data: dashboardData, loading: dashboardLoading } = useQuery(GET_PARENT_DASHBOARD, {
    variables: { dateRange: { preset: "LAST_30_DAYS" } },
    fetchPolicy: "cache-and-network",
  });

  const children = useMemo(() => {
    return (dashboardData?.getParentDashboard?.children ?? []).map((c) => c.child);
  }, [dashboardData]);

  // Load permissions for selected child
  const {
    data: permissionsData,
    loading: permissionsLoading,
    refetch,
  } = useQuery(GET_ABSENCE_PERMISSIONS_FOR_CHILD, {
    variables: { childId: selectedChild?.id, limit: 50 },
    skip: !selectedChild?.id,
    fetchPolicy: "cache-and-network",
  });

  const [cancelPermission, { loading: cancelling }] = useMutation(
    CANCEL_ABSENCE_PERMISSION_REQUEST,
    {
      onCompleted: () => {
        setCancelTarget(null);
        refetch();
      },
    }
  );

  const allPermissions = permissionsData?.getAbsencePermissionsForChild?.items ?? EMPTY_PERMISSIONS;

  const filteredPermissions = useMemo(() => {
    if (!statusFilter) return allPermissions;
    return allPermissions.filter((p) => p.requestStatus === statusFilter);
  }, [allPermissions, statusFilter]);

  if (dashboardLoading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Permisos de asistencia</h1>
        <p className="text-sm text-gray-500 mt-1">
          Solicitá y revisá permisos para tus hijos integrantes de la Banda.
        </p>
      </div>

      {/* Child selector */}
      {children.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
          Tu cuenta no tiene integrantes asignados. Contactá a un administrador.
        </div>
      ) : (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Seleccioná el integrante
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {children.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                isSelected={selectedChild?.id === child.id}
                onSelect={setSelectedChild}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action + filter row */}
      {selectedChild && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                type="button"
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

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Solicitar permiso
          </button>
        </div>
      )}

      {/* Permission list */}
      {selectedChild && (
        <>
          {permissionsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-36 bg-gray-100 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filteredPermissions.length === 0 ? (
            <EmptyState childSelected={Boolean(selectedChild)} />
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                {filteredPermissions.length} solicitud{filteredPermissions.length !== 1 ? "es" : ""}
              </p>
              {filteredPermissions.map((p) => (
                <PermissionRequestCard
                  key={p.id}
                  permission={p}
                  onCancel={(perm) => setCancelTarget(perm)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!selectedChild && children.length > 0 && <EmptyState childSelected={false} />}

      {/* New request modal */}
      <PermissionRequestDialog
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={`Solicitar permiso — ${
          selectedChild ? `${selectedChild.name} ${selectedChild.firstSurName}` : ""
        }`}
        studentId={selectedChild?.id}
        onSuccess={() => {
          setShowForm(false);
          refetch();
        }}
        refetchQueries={[
          {
            query: GET_ABSENCE_PERMISSIONS_FOR_CHILD,
            variables: { childId: selectedChild?.id, limit: 50 },
          },
        ]}
      />

      {/* Cancel confirm modal */}
      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="¿Cancelar solicitud?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Esta acción cancelará la solicitud de permiso. ¿Querés continuar?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCancelTarget(null)}
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              No, volver
            </button>
            <button
              type="button"
              onClick={() => cancelPermission({ variables: { id: cancelTarget?.id } })}
              disabled={cancelling}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {cancelling ? "Cancelando…" : "Sí, cancelar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
