/* eslint-disable react/prop-types */
import React, { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_ABSENCE_PERMISSION_REQUEST,
  GET_EVENTS_FOR_PERMISSION_FORM,
} from "../absencePermissions.gql";
import { parsePermissionDate } from "../dateUtils";
import {
  getPermissionReasonLabel,
  PERMISSION_TYPE_OPTIONS,
} from "../permissionTypes";
import { PermissionEvidenceUploader } from "./PermissionEvidenceUploader";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_EVENTS = [];
const EMPTY_REFETCH_QUERIES = [];

function fmtDateLong(value) {
  const date = parsePermissionDate(value);
  if (!date) return "";
  return date.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isRecentOrUpcoming(isoDate) {
  const d = parsePermissionDate(isoDate);
  if (!d) return false;
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const sixMonthsAhead = new Date();
  sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6);
  return d >= threeMonthsAgo && d <= sixMonthsAhead;
}

function isPast(isoDate) {
  const date = parsePermissionDate(isoDate);
  return date ? date < new Date() : false;
}

// ─── Event option card ────────────────────────────────────────────────────────

function EventOptionCard({ event, isSelected, onSelect }) {
  const eventDate = parsePermissionDate(event.date);
  const past = isPast(event.date);
  return (
    <button
      type="button"
      onClick={() => onSelect(event.id)}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {/* Date block */}
      <div
        className={`flex-shrink-0 w-12 rounded-lg text-center py-1.5 ${
          isSelected ? "bg-blue-100" : "bg-gray-100"
        }`}
      >
        <p className={`text-xs font-medium uppercase ${isSelected ? "text-blue-500" : "text-gray-400"}`}>
          {eventDate?.toLocaleDateString("es-CR", { month: "short" })}
        </p>
        <p className={`text-lg font-bold leading-none ${isSelected ? "text-blue-700" : "text-gray-700"}`}>
          {eventDate?.getDate()}
        </p>
        <p className={`text-xs ${isSelected ? "text-blue-500" : "text-gray-400"}`}>
          {eventDate?.getFullYear()}
        </p>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className={`font-semibold text-sm leading-snug ${isSelected ? "text-blue-800" : "text-gray-900"}`}>
          {event.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {fmtDateLong(event.date)}
        </p>
        {event.place && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {event.place}</p>
        )}
        {past && (
          <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            Pasado
          </span>
        )}
      </div>

      {/* Checkmark */}
      {isSelected && (
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function PermissionRequestForm({
  studentId,
  onSuccess,
  onCancel,
  refetchQueries = EMPTY_REFETCH_QUERIES,
  formId,
  hideActions = false,
  onSubmitStateChange,
}) {
  const [permissionType, setPermissionType] = useState("ABSENCE");
  const [targetType, setTargetType] = useState("REHEARSAL");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [error, setError] = useState(null);

  // Load all events once — filter client-side by category
  const { data: eventsData, loading: eventsLoading } = useQuery(
    GET_EVENTS_FOR_PERMISSION_FORM,
    { fetchPolicy: "cache-and-network" }
  );

  const allEvents = eventsData?.getEvents ?? EMPTY_EVENTS;

  const rehearsalEvents = useMemo(
    () =>
      allEvents
        .filter((e) => e.category === "rehearsal" && isRecentOrUpcoming(e.date))
        .sort((a, b) => parsePermissionDate(b.date) - parsePermissionDate(a.date)), // más reciente primero
    [allEvents]
  );

  const presentationEvents = useMemo(
    () =>
      allEvents
        .filter((e) => e.category === "presentation" && isRecentOrUpcoming(e.date))
        .sort((a, b) => parsePermissionDate(a.date) - parsePermissionDate(b.date)), // próxima primero
    [allEvents]
  );

  const visibleEvents = targetType === "REHEARSAL" ? rehearsalEvents : presentationEvents;

  const selectedEvent = useMemo(
    () => allEvents.find((e) => e.id === selectedEventId) ?? null,
    [allEvents, selectedEventId]
  );

  const [createPermission, { loading: submitting }] = useMutation(
    CREATE_ABSENCE_PERMISSION_REQUEST,
    {
      refetchQueries,
      onCompleted: () => onSuccess?.(),
      onError: (err) => setError(err.message),
    }
  );
  const submitDisabled = submitting || uploadingEvidence || !selectedEventId;
  const submitLabel = submitting
    ? "Enviando…"
    : uploadingEvidence
    ? "Subiendo evidencia…"
    : "Enviar solicitud";

  useEffect(() => {
    onSubmitStateChange?.({ disabled: submitDisabled, label: submitLabel });
  }, [onSubmitStateChange, submitDisabled, submitLabel]);

  function handleTypeChange(type) {
    setTargetType(type);
    setSelectedEventId("");
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!studentId) {
      setError("Debes seleccionar un integrante.");
      return;
    }
    if (!selectedEventId) {
      setError(
        targetType === "REHEARSAL"
          ? "Seleccioná el ensayo para el que necesitás el permiso."
          : "Seleccioná la presentación para la que necesitás el permiso."
      );
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setError("El motivo debe tener al menos 5 caracteres.");
      return;
    }
    if (uploadingEvidence) {
      setError("Esperá a que termine de subir la evidencia.");
      return;
    }

    await createPermission({
      variables: {
        input: {
          studentId,
          permissionType,
          targetType,
          eventId: selectedEventId,
          reason: reason.trim(),
          attachments: attachment ? [attachment.url] : [],
        },
      },
    });
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5">

      {/* Attendance exception selector */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">
          ¿Qué necesitás reportar?
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {PERMISSION_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPermissionType(option.value)}
              className={`rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                permissionType === option.value
                  ? "border-blue-500 bg-blue-50 text-blue-800"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="mt-0.5 block text-xs opacity-75">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity selector */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">
          ¿Para qué actividad es el permiso?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "REHEARSAL", label: "Ensayo", icon: "🎵" },
            { value: "PERFORMANCE", label: "Presentación", icon: "🎭" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleTypeChange(opt.value)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                targetType === opt.value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event list */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">
          {targetType === "REHEARSAL" ? "Seleccioná el ensayo" : "Seleccioná la presentación"}
        </p>

        {eventsLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-5 text-center">
            <p className="text-sm text-gray-500">
              No hay {targetType === "REHEARSAL" ? "ensayos" : "presentaciones"} registrados en el calendario.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Contactá a un administrador para agregar el evento.
            </p>
          </div>
        ) : (
          <div
            className="space-y-2 overflow-y-auto pr-1"
            style={{ maxHeight: "18rem", overscrollBehavior: "contain" }}
          >
            {visibleEvents.map((ev) => (
              <EventOptionCard
                key={ev.id}
                event={ev}
                isSelected={selectedEventId === ev.id}
                onSelect={setSelectedEventId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected event summary */}
      {selectedEvent && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="text-blue-500 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-800 truncate">{selectedEvent.title}</p>
            <p className="text-xs text-blue-600">{fmtDateLong(selectedEvent.date)}</p>
          </div>
        </div>
      )}

      {/* Reason */}
      <div>
        <label htmlFor={`${formId ?? "permission-request"}-reason`} className="block text-sm font-medium text-gray-700 mb-1.5">
          {getPermissionReasonLabel(permissionType)}
        </label>
        <textarea
          id={`${formId ?? "permission-request"}-reason`}
          aria-label={getPermissionReasonLabel(permissionType)}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Ej: Cita médica urgente, viaje familiar, compromiso académico…"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-400"
        />
        <p className="text-right text-xs text-gray-400 mt-1">{reason.length}/500</p>
      </div>

      {/* Optional evidence */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-1.5">
          Evidencia <span className="font-normal text-gray-400">(opcional)</span>
        </p>
        <PermissionEvidenceUploader
          attachment={attachment}
          onChange={setAttachment}
          onUploadingChange={setUploadingEvidence}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      {!hideActions && <div className="flex gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitDisabled}
          className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitLabel}
        </button>
      </div>}
    </form>
  );
}
