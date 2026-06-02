/* eslint-disable react/prop-types */
import React from "react";
import { useQuery } from "@apollo/client";
import { PermissionStatusBadge } from "./PermissionStatusBadge";
import { JustificationBadge } from "./JustificationBadge";
import { GET_PERMISSIONS_FOR_SESSION, GET_PERMISSIONS_FOR_EVENT } from "../absencePermissions.gql";

// ─── Per-student indicator (receives pre-fetched data) ─────────────────────────

export function StudentPermissionBadge({ permission, onViewDetail }) {
  if (!permission) return null;

  return (
    <div className="flex flex-col gap-1 mt-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <PermissionStatusBadge status={permission.requestStatus} size="xs" />
        {permission.justificationStatus !== "PENDING_REVIEW" && (
          <JustificationBadge status={permission.justificationStatus} size="xs" />
        )}
      </div>
      {permission.reason && (
        <p className="text-xs text-gray-500 italic line-clamp-1">{permission.reason}</p>
      )}
      {onViewDetail && (
        <button
          onClick={() => onViewDetail(permission)}
          className="self-start text-xs text-blue-600 hover:text-blue-700 hover:underline"
        >
          Ver permiso →
        </button>
      )}
    </div>
  );
}

// ─── Session-level indicator: fetches all permissions for a session ─────────────

export function SessionPermissionsIndicator({ sessionId, onViewPermission }) {
  const { data, loading } = useQuery(GET_PERMISSIONS_FOR_SESSION, {
    variables: { sessionId },
    skip: !sessionId,
    fetchPolicy: "cache-and-network",
  });

  const permissions = data?.getPermissionsForSession ?? [];
  if (loading) return null;
  if (permissions.length === 0) return null;

  const pendingCount = permissions.filter((p) => p.requestStatus === "PENDING").length;
  const approvedCount = permissions.filter((p) => p.requestStatus === "APPROVED").length;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 mb-4">
      <div className="text-amber-500 mt-0.5 flex-shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-800">
          Hay {permissions.length} permiso{permissions.length !== 1 ? "s" : ""} para este ensayo
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          {pendingCount > 0 && `${pendingCount} pendiente${pendingCount !== 1 ? "s" : ""}`}
          {pendingCount > 0 && approvedCount > 0 && " · "}
          {approvedCount > 0 && `${approvedCount} aprobado${approvedCount !== 1 ? "s" : ""}`}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {permissions.map((p) => (
            <button
              key={p.id}
              onClick={() => onViewPermission?.(p)}
              className="text-xs bg-white border border-amber-200 text-amber-700 rounded-full px-2.5 py-0.5 hover:bg-amber-100 transition-colors"
            >
              Ver permiso
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Event-level indicator: fetches all permissions for a presentation ──────────

export function EventPermissionsIndicator({ eventId, onViewPermission }) {
  const { data, loading } = useQuery(GET_PERMISSIONS_FOR_EVENT, {
    variables: { eventId },
    skip: !eventId,
    fetchPolicy: "cache-and-network",
  });

  const permissions = data?.getPermissionsForEvent ?? [];
  if (loading || permissions.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
      <div className="text-blue-500 mt-0.5 flex-shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-blue-800">
          {permissions.length} permiso{permissions.length !== 1 ? "s" : ""} para esta presentación
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {permissions.map((p) => (
            <button
              key={p.id}
              onClick={() => onViewPermission?.(p)}
              className="text-xs bg-white border border-blue-200 text-blue-700 rounded-full px-2.5 py-0.5 hover:bg-blue-100 transition-colors"
            >
              Ver permiso
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
