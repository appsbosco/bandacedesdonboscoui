/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { Modal } from "components/ui/Modal";
import { PermissionStatusBadge } from "./PermissionStatusBadge";
import { JustificationBadge } from "./JustificationBadge";
import { formatPermissionDate } from "../dateUtils";
import { getPermissionTypeLabel } from "../permissionTypes";
import {
  REVIEW_ABSENCE_PERMISSION_REQUEST,
  CANCEL_ABSENCE_PERMISSION_REQUEST,
  REOPEN_ABSENCE_PERMISSION_REQUEST,
} from "../absencePermissions.gql";

const fmtDate = formatPermissionDate;
const EMPTY_REFETCH_QUERIES = [];

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800">{value ?? "—"}</span>
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    key: "approve-justify",
    label: "Aprobar y justificar",
    description: "La solicitud queda aprobada y justificada.",
    requestStatus: "APPROVED",
    justificationStatus: "JUSTIFIED",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    selectedClass: "border-emerald-500 ring-2 ring-emerald-300 bg-emerald-50",
  },
  {
    key: "approve-no-justify",
    label: "Aprobar sin justificar",
    description: "Se aprueba la solicitud pero no queda justificada.",
    requestStatus: "APPROVED",
    justificationStatus: "NOT_JUSTIFIED",
    className: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
    selectedClass: "border-amber-500 ring-2 ring-amber-300 bg-amber-50",
  },
  {
    key: "reject",
    label: "Rechazar solicitud",
    description: "La solicitud es rechazada y no quedará justificada.",
    requestStatus: "REJECTED",
    justificationStatus: "NOT_JUSTIFIED",
    className: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
    selectedClass: "border-red-500 ring-2 ring-red-300 bg-red-50",
  },
];

export function PermissionReviewModal({ permission, isOpen, onClose, refetchQueries = EMPTY_REFETCH_QUERIES, isReadOnly = false }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [adminNotes, setAdminNotes] = useState(permission?.adminNotes ?? "");
  const [error, setError] = useState(null);

  const [reviewPermission, { loading: reviewing }] = useMutation(
    REVIEW_ABSENCE_PERMISSION_REQUEST,
    {
      refetchQueries,
      onCompleted: () => {
        setSelectedAction(null);
        setError(null);
        onClose?.();
      },
      onError: (err) => setError(err.message),
    }
  );

  const [cancelPermission, { loading: cancelling }] = useMutation(
    CANCEL_ABSENCE_PERMISSION_REQUEST,
    {
      refetchQueries,
      onCompleted: () => onClose?.(),
      onError: (err) => setError(err.message),
    }
  );

  const [reopenPermission, { loading: reopening }] = useMutation(
    REOPEN_ABSENCE_PERMISSION_REQUEST,
    {
      refetchQueries,
      onCompleted: () => onClose?.(),
      onError: (err) => setError(err.message),
    }
  );

  if (!permission) return null;

  const student = permission.student;
  const studentName = student
    ? `${student.name} ${student.firstSurName} ${student.secondSurName ?? ""}`.trim()
    : "—";

  const targetLabel =
    permission.targetType === "REHEARSAL"
      ? `Ensayo · ${permission.event?.title ?? permission.rehearsalSession?.section ?? "Ensayo"} · ${fmtDate(permission.event?.date ?? permission.rehearsalSession?.dateNormalized ?? permission.absenceDate)}`
      : `Presentación · ${permission.event?.title ?? "—"} · ${fmtDate(permission.event?.date ?? permission.absenceDate)}`;

  const requesterName =
    permission.requesterType === "PARENT"
      ? permission.requestedByParent
        ? `${permission.requestedByParent.name} ${permission.requestedByParent.firstSurName}`
        : "Padre/Madre"
      : permission.requestedByUser
      ? `${permission.requestedByUser.name} ${permission.requestedByUser.firstSurName}`
      : "Integrante";

  async function handleReview() {
    if (!selectedAction) {
      setError("Seleccioná una acción antes de confirmar.");
      return;
    }
    setError(null);
    await reviewPermission({
      variables: {
        id: permission.id,
        input: {
          requestStatus: selectedAction.requestStatus,
          justificationStatus: selectedAction.justificationStatus,
          adminNotes: adminNotes.trim() || null,
        },
      },
    });
  }

  const isLoading = reviewing || cancelling || reopening;
  const alreadyReviewed = permission.requestStatus !== "PENDING";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Solicitud de permiso"
      size="lg"
      panelClassName="overflow-y-auto max-h-[90vh]"
    >
      <div className="space-y-5">
        {/* Student info */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          {student?.avatar ? (
            <img src={student.avatar} alt={studentName} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-lg font-bold text-blue-600">{student?.name?.[0] ?? "?"}</span>
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{studentName}</p>
            {student?.instrument && (
              <p className="text-sm text-gray-500">{student.instrument}</p>
            )}
          </div>
          <div className="ml-auto flex flex-col items-end gap-1">
            <PermissionStatusBadge status={permission.requestStatus} />
            {permission.justificationStatus !== "PENDING_REVIEW" && (
              <JustificationBadge status={permission.justificationStatus} size="xs" />
            )}
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Actividad" value={targetLabel} />
          <DetailRow label="Tipo de permiso" value={getPermissionTypeLabel(permission.permissionType)} />
          <DetailRow label="Fecha de actividad" value={fmtDate(permission.absenceDate)} />
          <DetailRow label="Solicitado por" value={`${requesterName} (${permission.requesterType === "PARENT" ? "Padre/Madre" : "Integrante"})`} />
          <DetailRow label="Fecha de solicitud" value={fmtDate(permission.createdAt)} />
        </div>

        {/* Reason */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Motivo</p>
          <p className="text-sm text-gray-800 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
            {permission.reason}
          </p>
        </div>

        {permission.attachments?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Evidencia adjunta
            </p>
            <a
              href={permission.attachments[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              Abrir evidencia
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        )}

        {/* Admin notes from previous review */}
        {alreadyReviewed && permission.adminNotes && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              Observaciones administrativas
            </p>
            <p className="text-sm text-gray-600 italic bg-gray-50 rounded-xl px-4 py-3">
              {permission.adminNotes}
            </p>
          </div>
        )}

        {/* History */}
        {permission.statusHistory?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Historial
            </p>
            <div className="space-y-2">
              {[...permission.statusHistory].reverse().map((entry) => (
                <div key={`${entry.changedAt}-${entry.requestStatus}-${entry.justificationStatus}`} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="text-gray-300">{fmtDate(entry.changedAt)}</span>
                  <PermissionStatusBadge status={entry.requestStatus} showDot={false} size="xs" />
                  {entry.notes && <span className="italic">· {entry.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review form — only if not read-only and request is PENDING */}
        {!isReadOnly && !alreadyReviewed && (
          <>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Decisión</p>
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action) => {
                  const isSelected = selectedAction?.key === action.key;
                  return (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => setSelectedAction(action)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        isSelected ? action.selectedClass : action.className
                      }`}
                    >
                      <p className="font-medium text-sm">{action.label}</p>
                      <p className="text-xs opacity-75 mt-0.5">{action.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="permission-admin-notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                Observaciones administrativas{" "}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                id="permission-admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Ej: Comprobante médico revisado. Aprobado por Director."
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-400"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReview}
                disabled={!selectedAction || isLoading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {reviewing ? "Guardando…" : "Confirmar decisión"}
              </button>
            </div>
          </>
        )}

        {/* Admin actions on reviewed request */}
        {!isReadOnly && alreadyReviewed && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => reopenPermission({ variables: { id: permission.id } })}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {reopening ? "Reabriendo…" : "Reabrir para revisión"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Read-only close */}
        {isReadOnly && (
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        )}

        {/* Cancel request button (admin) */}
        {!isReadOnly && permission.requestStatus === "PENDING" && (
          <button
            type="button"
            onClick={() => cancelPermission({ variables: { id: permission.id } })}
            disabled={isLoading}
            className="w-full text-center text-xs text-gray-400 hover:text-red-500 transition-colors mt-1"
          >
            {cancelling ? "Cancelando…" : "Cancelar esta solicitud"}
          </button>
        )}
      </div>
    </Modal>
  );
}
