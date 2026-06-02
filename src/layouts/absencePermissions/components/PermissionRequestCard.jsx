/* eslint-disable react/prop-types */
import React from "react";
import { PermissionStatusBadge } from "./PermissionStatusBadge";
import { JustificationBadge } from "./JustificationBadge";
import { formatPermissionDate } from "../dateUtils";
import { PermissionTypeBadge } from "./PermissionTypeBadge";

const fmtDate = formatPermissionDate;

function TargetLabel({ permission }) {
  if (permission.targetType === "REHEARSAL") {
    const session = permission.rehearsalSession;
    const event = permission.event;
    const name = event?.title ?? session?.section ?? "Ensayo";
    const date = fmtDate(event?.date ?? session?.dateNormalized ?? permission.absenceDate);
    return (
      <span className="text-sm text-gray-600">
        Ensayo · {name} · {date}
      </span>
    );
  }
  if (permission.targetType === "PERFORMANCE") {
    const ev = permission.event;
    return (
      <span className="text-sm text-gray-600">
        Presentación · {ev?.title ?? "—"} · {fmtDate(ev?.date ?? permission.absenceDate)}
      </span>
    );
  }
  return null;
}

function RequesterLabel({ permission }) {
  if (permission.requesterType === "PARENT") {
    const p = permission.requestedByParent;
    const name = p ? `${p.name} ${p.firstSurName}` : "Padre/Madre";
    return <span className="text-xs text-gray-400">Solicitado por {name}</span>;
  }
  const u = permission.requestedByUser;
  const name = u ? `${u.name} ${u.firstSurName}` : "Integrante";
  return <span className="text-xs text-gray-400">Solicitado por {name}</span>;
}

export function PermissionRequestCard({ permission, onViewDetail, onCancel, showStudent = false }) {
  const student = permission.student;
  const studentName = student
    ? `${student.name} ${student.firstSurName} ${student.secondSurName ?? ""}`.trim()
    : "—";

  const canCancel =
    permission.requestStatus === "PENDING" && onCancel;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {showStudent && (
            <div className="flex items-center gap-2 mb-1">
              {student?.avatar ? (
                <img
                  src={student.avatar}
                  alt={studentName}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-blue-600">
                    {student?.name?.[0] ?? "?"}
                  </span>
                </div>
              )}
              <span className="font-semibold text-gray-900 text-sm truncate">{studentName}</span>
              {student?.instrument && (
                <span className="text-xs text-gray-400 flex-shrink-0">· {student.instrument}</span>
              )}
            </div>
          )}
          <TargetLabel permission={permission} />
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <PermissionStatusBadge status={permission.requestStatus} />
        </div>
      </div>

      {/* Justification badge (only when there's a concrete status) */}
      <div className="flex flex-wrap gap-1.5">
        <PermissionTypeBadge type={permission.permissionType} size="xs" />
        {permission.justificationStatus !== "PENDING_REVIEW" && (
          <JustificationBadge status={permission.justificationStatus} size="xs" />
        )}
      </div>

      {/* Reason */}
      <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{permission.reason}</p>

      {/* Admin notes */}
      {permission.adminNotes && (
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 italic">
          {permission.adminNotes}
        </div>
      )}

      {permission.attachments?.length > 0 && (
        <a
          href={permission.attachments[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Ver evidencia adjunta
        </a>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <div className="flex flex-col gap-0.5">
          <RequesterLabel permission={permission} />
          <span className="text-xs text-gray-300">{fmtDate(permission.createdAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(permission)}
              className="text-xs text-red-600 hover:text-red-700 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
            >
              Cancelar
            </button>
          )}
          {onViewDetail && (
            <button
              type="button"
              onClick={() => onViewDetail(permission)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Ver detalle →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
