/* eslint-disable react/prop-types */
import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Modal } from "components/ui/Modal";
import { PermissionRequestDialog } from "./components/PermissionRequestDialog";
import { PermissionRequestCard } from "./components/PermissionRequestCard";
import {
  GET_MY_USER_ABSENCE_PERMISSIONS,
  CANCEL_ABSENCE_PERMISSION_REQUEST,
} from "./absencePermissions.gql";
import { GET_USERS_BY_ID } from "graphql/queries";

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "APPROVED", label: "Aprobados" },
  { value: "REJECTED", label: "Rechazados" },
];

function EmptyPermissions() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="font-semibold text-gray-700 mb-1">Sin permisos enviados</p>
      <p className="text-sm text-gray-400 max-w-xs">
        Cuando necesités justificar una ausencia a un ensayo o presentación, podés hacerlo desde aquí.
      </p>
    </div>
  );
}

export function MemberPermissionsView() {
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const currentUser = userData?.getUser;

  const { data, loading, refetch } = useQuery(GET_MY_USER_ABSENCE_PERMISSIONS, {
    variables: { limit: 50 },
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

  const allPermissions = data?.getMyUserAbsencePermissions?.items ?? [];

  const filteredPermissions = useMemo(() => {
    if (!statusFilter) return allPermissions;
    return allPermissions.filter((p) => p.requestStatus === statusFilter);
  }, [allPermissions, statusFilter]);

  const isExalumno = currentUser?.state === "Exalumno";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis permisos</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isExalumno
            ? "Solicitá permiso para ausentarte de un ensayo o presentación."
            : "Revisá el estado de tus permisos de ausencia."}
        </p>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
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

        {isExalumno && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Solicitar permiso
          </button>
        )}
      </div>

      {/* Permission list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredPermissions.length === 0 ? (
        <EmptyPermissions />
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

      {/* New request modal */}
      <PermissionRequestDialog
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Solicitar permiso de ausencia"
        studentId={currentUser?.id}
        onSuccess={() => {
          setShowForm(false);
          refetch();
        }}
        refetchQueries={[{ query: GET_MY_USER_ABSENCE_PERMISSIONS, variables: { limit: 50 } }]}
      />

      {/* Cancel confirm */}
      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="¿Cancelar solicitud?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Vas a cancelar esta solicitud de permiso. ¿Querés continuar?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setCancelTarget(null)}
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              No, volver
            </button>
            <button
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
