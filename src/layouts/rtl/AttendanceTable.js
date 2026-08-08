/* eslint-disable react/prop-types */

import { useMutation, useQuery } from "@apollo/client";
import { TAKE_ATTENDANCE_REHEARSAL, CLOSE_SESSION } from "graphql/mutations";
import { GET_USERS, GET_ACTIVE_SESSION, GET_USERS_BY_ID } from "graphql/queries";
import { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { mapInstrumentToSection } from "utils/sectionMapper";
import { GET_PERMISSIONS_FOR_REHEARSAL_DATE } from "layouts/absencePermissions/absencePermissions.gql";
import { StudentPermissionBadge } from "layouts/absencePermissions/components/AttendancePermissionIndicator";

// ============================================================================
// CONSTANTS & UTILS
// ============================================================================

const ATTENDANCE_STATUS = {
  PRESENT: {
    value: "PRESENT",
    label: "Presente",
    shortLabel: "P",
    color: "bg-emerald-500",
  },
  ABSENT_UNJUSTIFIED: {
    value: "ABSENT_UNJUSTIFIED",
    label: "A. Injustificada",
    shortLabel: "AI",
    color: "bg-red-500",
  },
  ABSENT_JUSTIFIED: {
    value: "ABSENT_JUSTIFIED",
    label: "A. Justificada",
    shortLabel: "AJ",
    color: "bg-amber-500",
  },
  LATE: {
    value: "LATE",
    label: "Tarde",
    shortLabel: "T",
    color: "bg-orange-500",
  },
  UNJUSTIFIED_WITHDRAWAL: {
    value: "UNJUSTIFIED_WITHDRAWAL",
    label: "Retiro Injustificado",
    shortLabel: "RI",
    color: "bg-purple-700",
  },
  JUSTIFIED_WITHDRAWAL: {
    value: "JUSTIFIED_WITHDRAWAL",
    label: "Retiro Justificado",
    shortLabel: "RJ",
    color: "bg-blue-600",
  },
};

const STATUS_OPTIONS = Object.values(ATTENDANCE_STATUS);

const PRIMARY_STATUSES = ["PRESENT", "ABSENT_UNJUSTIFIED", "ABSENT_JUSTIFIED"];
const SECONDARY_STATUSES = ["LATE", "JUSTIFIED_WITHDRAWAL", "UNJUSTIFIED_WITHDRAWAL"];

// Estado exclusivamente local. Nunca se envía al API.
const DEFAULT_STATUS = "UNMARKED";

// Posicionamiento del menú móvil (portal + fixed)
const MOBILE_SELECTOR_WIDTH = 280; // coincide con min-w-[280px]
const MOBILE_SELECTOR_GAP = 8;
const MOBILE_SELECTOR_ESTIMATED_HEIGHT = 260;

const getMobileSelectorPosition = (buttonEl) => {
  if (!buttonEl) {
    return { top: 0, left: 0, placement: "bottom" };
  }

  const rect = buttonEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Centrado horizontal y limitado dentro del viewport
  const half = MOBILE_SELECTOR_WIDTH / 2;
  let left = rect.left + rect.width / 2;
  left = Math.max(half + 8, Math.min(vw - half - 8, left));

  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;

  const shouldOpenUp =
    spaceBelow < MOBILE_SELECTOR_ESTIMATED_HEIGHT && spaceAbove > MOBILE_SELECTOR_ESTIMATED_HEIGHT;

  if (shouldOpenUp) {
    return {
      top: rect.top - MOBILE_SELECTOR_GAP,
      left,
      placement: "top",
    };
  }

  return {
    top: rect.bottom + MOBILE_SELECTOR_GAP,
    left,
    placement: "bottom",
  };
};

const normalizeFullName = (u) =>
  [u?.name, u?.firstSurName, u?.secondSurName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");

const buildRecordsFromSession = (students, session) => {
  const byUserId = new Map(
    (session?.attendances || []).filter((a) => a?.user?.id).map((a) => [String(a.user.id), a])
  );

  return students.map((student) => {
    const existing = byUserId.get(String(student.id));
    return {
      userId: String(student.id),
      status: existing?.status || DEFAULT_STATUS,
      notes: existing?.notes || "",
      attendanceId: existing?.id || null,
    };
  });
};

const buildDefaultRecords = (students) =>
  students.map((s) => ({
    userId: String(s.id),
    status: DEFAULT_STATUS,
    notes: "",
    attendanceId: null,
  }));

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

const StatusButton = ({ status, isActive, onClick, compact = false, disabled = false }) => {
  const statusConfig = STATUS_OPTIONS.find((s) => s.value === status);

  // guard para que nunca explote si llega un status inesperado
  if (!statusConfig) return null;

  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={`Marcar como ${statusConfig.label}`}
      disabled={disabled}
      className={`
        ${compact ? "min-w-12 px-3.5 py-2.5 text-xs" : "px-3 py-2 text-sm"}
        min-h-10 font-semibold rounded-xl transition-all duration-200
        ${
          disabled
            ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
            : isActive
            ? `${statusConfig.color} text-white shadow-md scale-105`
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }
        focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1
      `}
    >
      {compact ? statusConfig.shortLabel : statusConfig.label}
    </button>
  );
};

const MobileStatusSelector = ({
  currentStatus,
  onStatusChange,
  onClose,
  position,
  onEditNotes,
  canEdit,
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const menu = (
    <div
      ref={ref}
      className="fixed z-[80] min-w-[280px] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xl"
      style={{
        top: position.top,
        left: position.left,
        transform: position.placement === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      }}
    >
      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase">Más opciones</p>

      <div className="mb-3">
        <button
          onClick={() => {
            if (!canEdit) return;
            onEditNotes?.();
            onClose();
          }}
          disabled={!canEdit}
          className={`
            w-full px-4 py-2.5 text-left rounded-lg transition-all
            ${
              canEdit
                ? "bg-gray-50 text-gray-700 hover:bg-gray-100"
                : "bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500
          `}
        >
          <span className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="text-sm font-medium">Editar nota</span>
          </span>
        </button>
      </div>

      <div className="space-y-2">
        {SECONDARY_STATUSES.map((status) => {
          const statusConfig = STATUS_OPTIONS.find((s) => s.value === status);
          if (!statusConfig) return null;

          return (
            <button
              key={status}
              onClick={() => {
                if (!canEdit) return;
                onStatusChange(status);
                onClose();
              }}
              disabled={!canEdit}
              className={`
                w-full px-4 py-2.5 text-left rounded-lg transition-all
                ${
                  !canEdit
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                    : currentStatus === status
                    ? `${statusConfig.color} text-white`
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `}
            >
              <span className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusConfig.color}`} />
                <span className="text-sm font-medium">{statusConfig.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return createPortal(menu, document.body);
};

const StudentRow = ({
  student,
  attendance,
  permission,
  onStatusChange,
  onEditNotes,
  searchTerm,
  canEdit,
}) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [moreOptionsPosition, setMoreOptionsPosition] = useState({
    top: 0,
    left: 0,
    placement: "bottom",
  });
  const moreButtonRef = useRef(null);

  const currentStatus = attendance?.status || DEFAULT_STATUS;
  const fullName = normalizeFullName(student);

  const highlightText = (text) => {
    if (!searchTerm) return text;
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return String(text).replace(regex, '<mark class="bg-yellow-200 font-semibold">$1</mark>');
  };

  const handleMoreClick = () => {
    setMoreOptionsPosition(getMobileSelectorPosition(moreButtonRef.current));
    setShowMoreOptions(true);
  };

  useEffect(() => {
    if (!showMoreOptions) return;

    const updatePosition = () => {
      setMoreOptionsPosition(getMobileSelectorPosition(moreButtonRef.current));
    };

    updatePosition();

    // true para capturar scroll en contenedores internos
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [showMoreOptions]);

  const initials = `${(student?.name || " ")[0] || ""}${(student?.firstSurName || " ")[0] || ""}`;

  return (
    <div
      className={`group mx-3 mb-2 flex flex-col gap-3 rounded-2xl border bg-white px-4 py-3 transition-colors sm:mx-0 sm:mb-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-none sm:border-x-0 sm:border-t-0 ${
        currentStatus === DEFAULT_STATUS
          ? "border-amber-200 sm:bg-amber-50/40"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="break-words text-left text-sm font-semibold text-slate-950"
            dir="ltr"
            style={{ unicodeBidi: "isolate" }}
            dangerouslySetInnerHTML={{ __html: highlightText(fullName) }}
          />
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <p className="text-xs text-slate-500">{student.instrument}</p>
            {currentStatus === DEFAULT_STATUS && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                Sin marcar
              </span>
            )}
          </div>
          <StudentPermissionBadge permission={permission} />
          {canEdit && permission?.suggestedAttendanceStatus && (
            <button
              type="button"
              onClick={() => onStatusChange(permission.suggestedAttendanceStatus)}
              className="mt-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Aplicar permiso aprobado
            </button>
          )}
        </div>
      </div>

      {/* Desktop: Full segmented control */}
      <div className="hidden lg:flex items-center gap-2.5 flex-shrink-0">
        {STATUS_OPTIONS.map((status) => (
          <StatusButton
            key={status.value}
            status={status.value}
            isActive={currentStatus === status.value}
            onClick={() => onStatusChange(status.value)}
            disabled={!canEdit}
          />
        ))}

        <button
          onClick={onEditNotes}
          disabled={!canEdit}
          className={`
            px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
            ${
              !canEdit
                ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          `}
          aria-label="Editar nota"
        >
          Nota
        </button>
      </div>

      {/* Mobile/Tablet: Primary buttons + More */}
      <div className="flex lg:hidden items-center gap-3 flex-wrap">
        {PRIMARY_STATUSES.map((status) => (
          <StatusButton
            key={status}
            status={status}
            isActive={currentStatus === status}
            onClick={() => onStatusChange(status)}
            compact
            disabled={!canEdit}
          />
        ))}

        <button
          ref={moreButtonRef}
          onClick={handleMoreClick}
          disabled={!canEdit}
          className={`
            min-h-10 px-4 py-2.5 text-xs font-medium rounded-xl transition-colors
            ${
              !canEdit
                ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                : SECONDARY_STATUSES.includes(currentStatus)
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          `}
          aria-label="Más opciones de asistencia"
        >
          Más
          <svg
            className="inline ml-1 w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMoreOptions && (
          <MobileStatusSelector
            currentStatus={currentStatus}
            onStatusChange={onStatusChange}
            onEditNotes={onEditNotes}
            onClose={() => setShowMoreOptions(false)}
            position={moreOptionsPosition}
            canEdit={canEdit}
          />
        )}
      </div>
    </div>
  );
};

const AttendanceHeader = ({
  stats,
  onMarkAllPresent,
  onReset,
  hasUnsavedChanges,
  sessionInfo,
  canEdit,
  canCloseSession,
  onCloseSession,
  visibleCount,
}) => {
  const reviewed = stats.total - stats.pending;
  const progress = stats.total ? Math.round((reviewed / stats.total) * 100) : 0;

  return (
    <section className="bg-white px-4 pb-4 sm:rounded-t-3xl sm:border sm:border-slate-200 sm:px-6 sm:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Ensayo de hoy
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Toma de asistencia
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString("es-CR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {sessionInfo?.section && (
            <p className="text-xs text-gray-600 mt-1">Sección: {sessionInfo.section}</p>
          )}

          {sessionInfo?.isClosed && (
            <p className="text-xs text-red-600 mt-1 font-medium">Sesión cerrada</p>
          )}
        </div>

        {sessionInfo?.alreadyTaken && (
          <div className="flex items-center gap-2 text-amber-600 text-sm font-medium px-3 py-2 bg-amber-50 rounded-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Lista pasada por {sessionInfo.takenByName}
          </div>
        )}

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Cambios sin guardar
          </div>
        )}
      </div>

      <div className="mb-3 grid grid-cols-4 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-3">
        <div className="text-center">
          <span className="block text-xl font-bold text-slate-950">{stats.total}</span>
          <span className="text-xs font-semibold text-slate-500">Personas</span>
        </div>
        <div className="text-center">
          <span className="block text-xl font-bold text-emerald-700">{stats.present}</span>
          <span className="text-xs font-semibold text-slate-500">Presentes</span>
        </div>
        <div className="text-center">
          <span className="block text-xl font-bold text-rose-700">{stats.absent}</span>
          <span className="text-xs font-semibold text-slate-500">Ausentes</span>
        </div>
        <div className="text-center">
          <span className="block text-xl font-bold text-amber-700">{stats.pending}</span>
          <span className="text-xs font-semibold text-slate-500">Pendientes</span>
        </div>
      </div>

      <div className="mb-4" aria-label={`${reviewed} de ${stats.total} personas revisadas`}>
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>
            {reviewed} de {stats.total} revisados
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-600 transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={onMarkAllPresent}
          disabled={!canEdit}
          className="min-h-11 shrink-0 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Marcar {visibleCount} visible{visibleCount !== 1 ? "s" : ""} presente
          {visibleCount !== 1 ? "s" : ""}
        </button>

        <button
          onClick={onReset}
          disabled={!canEdit}
          className="min-h-11 shrink-0 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Descartar cambios
        </button>

        {canCloseSession && (
          <button
            onClick={onCloseSession}
            className="min-h-11 shrink-0 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Cerrar sesión
          </button>
        )}
      </div>
    </section>
  );
};

const SearchAndFilters = ({ searchTerm, onSearchChange, totalResults, onQuickMark }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.nativeEvent?.isComposing) return;
    if (e.key === "Enter" && searchTerm && totalResults > 0) {
      e.preventDefault();
      onQuickMark();
    }
  };

  return (
    <div className="sticky top-0 z-20 bg-white px-4 py-3 sm:border-x sm:border-slate-200 sm:px-6">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar integrante..."
          className="block min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 pr-10 text-sm leading-5 text-slate-950 placeholder-slate-500 transition-colors focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/10"
          aria-label="Buscar integrante"
        />
        {searchTerm && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={() => onSearchChange("")}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Limpiar búsqueda"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {searchTerm && (
        <p className="mt-2 text-xs sm:text-sm text-gray-600">
          {totalResults} resultado{totalResults !== 1 ? "s" : ""} encontrado
          {totalResults !== 1 ? "s" : ""}
          {totalResults > 0 && " • Presiona Enter para marcar presente"}
        </p>
      )}
    </div>
  );
};

const ActionBar = ({
  onSave,
  onCancel,
  isSaving,
  hasUnsavedChanges,
  canEdit,
  unsavedCount,
  pendingCount,
}) => {
  return (
    <div className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_35px_rgba(15,23,42,0.08)] backdrop-blur sm:mx-4 sm:rounded-b-2xl sm:border-x sm:px-6 sm:py-4">
      <div className="mx-auto flex max-w-7xl items-center gap-2 sm:justify-end sm:gap-3">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="min-h-12 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50 sm:px-6"
        >
          Cancelar
        </button>

        <button
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges || !canEdit}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-8"
        >
          {isSaving ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="hidden sm:inline">Guardando...</span>
            </>
          ) : pendingCount > 0 ? (
            `${pendingCount} pendiente${pendingCount !== 1 ? "s" : ""}`
          ) : (
            `Guardar ${unsavedCount} cambio${unsavedCount !== 1 ? "s" : ""}`
          )}
        </button>
      </div>
    </div>
  );
};

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success" ? "bg-emerald-500" : type === "error" ? "bg-red-500" : "bg-blue-500";

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg z-[1350] animate-slide-in-right flex items-center gap-3 max-w-sm`}
    >
      {type === "success" && (
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span className="font-medium text-sm sm:text-base">{message}</span>
      <button onClick={onClose} aria-label="Cerrar notificación" className="ml-auto hover:opacity-75">
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <svg
      className="w-20 h-20 sm:w-24 sm:h-24 text-gray-300 mb-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No hay estudiantes</h3>
    <p className="text-xs sm:text-sm text-gray-500">
      No se encontraron estudiantes para esta sección
    </p>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <svg
      className="w-20 h-20 sm:w-24 sm:h-24 text-red-300 mb-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
    <p className="text-xs sm:text-sm text-gray-500 mb-4">{message}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Reintentar
    </button>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AttendancePage = () => {
  const navigate = useNavigate();

  // GraphQL
  const { data: userData, loading: userLoading } = useQuery(GET_USERS_BY_ID);
  const { loading: usersLoading, error, data, refetch } = useQuery(GET_USERS);

  const currentUser = userData?.getUser || null;
  const userSection = mapInstrumentToSection(currentUser?.instrument);
  const isAdmin = String(currentUser?.role || "").toUpperCase() === "ADMIN";

  // Congelar fecha para consulta/guardar (evita mismatch por medianoche)
  const [queryDate] = useState(() => new Date().toISOString());

  // Sesión activa
  const {
    data: sessionData,
    loading: sessionLoading,
    refetch: refetchSession,
  } = useQuery(GET_ACTIVE_SESSION, {
    variables: {
      date: queryDate,
      section: userSection,
    },
    skip: !userSection || userSection === "NO_APLICA",
    fetchPolicy: "cache-first",
  });
  const { data: permissionsData } = useQuery(GET_PERMISSIONS_FOR_REHEARSAL_DATE, {
    variables: { date: queryDate },
    fetchPolicy: "cache-and-network",
  });

  const [takeAttendance] = useMutation(TAKE_ATTENDANCE_REHEARSAL);
  const [closeSessionMutation] = useMutation(CLOSE_SESSION);

  // State
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const users = data?.getUsers || [];
  const activeSession = sessionData?.getActiveSession || null;
  const permissionsByStudentId = useMemo(
    () =>
      new Map(
        (permissionsData?.getPermissionsForRehearsalDate ?? []).map((permission) => [
          String(permission.studentId),
          permission,
        ])
      ),
    [permissionsData]
  );

  // Permisos (admin / owner / closed)
  const takenById = activeSession?.takenBy?.id ? String(activeSession.takenBy.id) : null;
  const currentUserId = currentUser?.id ? String(currentUser.id) : null;

  const isOwner = Boolean(takenById && currentUserId && takenById === currentUserId);
  const isClosed = activeSession?.status === "CLOSED";

  // puede editar si:
  // - admin
  // - o no cerrada y (no la ha pasado nadie, o la pasé yo)
  const canEdit = Boolean(isAdmin || (!isClosed && (!takenById || isOwner)));

  const canCloseSession = Boolean(activeSession?.id && !isClosed && (isAdmin || isOwner));

  // Filtrar estudiantes de la sección
  const normalizeInstrument = (value) =>
    String(value || "")
      .trim()
      .toUpperCase();

  const students = useMemo(() => {
    if (!userSection || userSection === "NO_APLICA") return [];

    const authInstrument = normalizeInstrument(currentUser?.instrument);
    const isTrombonesUser = authInstrument === "TROMBÓN";

    return users.filter((user) => {
      const studentSection = mapInstrumentToSection(user.instrument);
      const studentInstrument = normalizeInstrument(user.instrument);

      const sameSection = studentSection === userSection;
      const includeEuphoniums = isTrombonesUser && studentInstrument === "EUFONIO";

      return (
        (sameSection || includeEuphoniums) &&
        user.role !== "Instructor de instrumento" &&
        user.role !== "ADMIN"
      );
    }).sort((a, b) =>
      normalizeFullName(a).localeCompare(normalizeFullName(b), "es", { sensitivity: "base" })
    );
  }, [users, userSection, currentUser?.instrument]);

  // Inicializar/precargar registros según sesión (sin pisar cambios del usuario)
  const initializedSessionRef = useRef(null);

  useEffect(() => {
    if (!students.length) return;

    const sessionId = activeSession?.id ? String(activeSession.id) : "__no_session__";

    // Si ya inicializaste esta sesión y ya hay cambios, no pises
    if (initializedSessionRef.current === sessionId && hasUnsavedChanges) return;

    const nextRecords = activeSession
      ? buildRecordsFromSession(students, activeSession)
      : buildDefaultRecords(students);

    setAttendanceRecords(nextRecords);
    setHasUnsavedChanges(false);
    initializedSessionRef.current = sessionId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, activeSession?.id]); // intencional: no depende de hasUnsavedChanges

  // Filtrar estudiantes por búsqueda
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;

    const search = searchTerm.toLowerCase();
    return students.filter((student) => {
      const fullName = normalizeFullName(student).toLowerCase();
      const instrument = String(student.instrument || "").toLowerCase();
      return fullName.includes(search) || instrument.includes(search);
    });
  }, [students, searchTerm]);

  // Estadísticas (incluye withdrawals como ausencias)
  const stats = useMemo(() => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(
      (r) => r.status === "PRESENT" || r.status === "LATE"
    ).length;
    const absent = attendanceRecords.filter((r) =>
      [
        "ABSENT_UNJUSTIFIED",
        "ABSENT_JUSTIFIED",
        "JUSTIFIED_WITHDRAWAL",
        "UNJUSTIFIED_WITHDRAWAL",
      ].includes(r.status)
    ).length;

    const pending = attendanceRecords.filter((r) => r.status === DEFAULT_STATUS).length;

    return { total, present, absent, pending };
  }, [attendanceRecords]);

  const baselineRecords = useMemo(
    () =>
      activeSession
        ? buildRecordsFromSession(students, activeSession)
        : buildDefaultRecords(students),
    [activeSession, students]
  );
  const unsavedCount = useMemo(() => {
    const baseline = new Map(baselineRecords.map((record) => [String(record.userId), record]));
    return attendanceRecords.filter((record) => {
      const previous = baseline.get(String(record.userId));
      return previous?.status !== record.status || (previous?.notes || "") !== (record.notes || "");
    }).length;
  }, [attendanceRecords, baselineRecords]);

  // Info de sesión
  const sessionInfo = {
    section: userSection,
    alreadyTaken: Boolean(takenById),
    takenByName: activeSession?.takenBy
      ? `${activeSession.takenBy.name} ${activeSession.takenBy.firstSurName}`
      : null,
    isNotAdmin: !isAdmin,
    isClosed,
    isOwner,
  };

  // Handlers
  const guardEdit = () => {
    if (canEdit) return true;

    setToast({
      message: isClosed
        ? "Esta sesión está cerrada. Solo un administrador puede modificarla."
        : "Solo administradores o el encargado que pasó lista pueden editar esta sesión.",
      type: "error",
    });
    return false;
  };

  const handleStatusChange = (userId, newStatus) => {
    if (!guardEdit()) return;

    setAttendanceRecords((prev) =>
      prev.map((record) =>
        String(record.userId) === String(userId) ? { ...record, status: newStatus } : record
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleEditNotes = (userId) => {
    if (!guardEdit()) return;

    const current = attendanceRecords.find((r) => String(r.userId) === String(userId));
    const currentNotes = current?.notes || "";
    const next = window.prompt("Nota para este estudiante:", currentNotes);

    // cancel => null
    if (next === null) return;

    setAttendanceRecords((prev) =>
      prev.map((r) => (String(r.userId) === String(userId) ? { ...r, notes: next } : r))
    );
    setHasUnsavedChanges(true);
  };

  const handleQuickMark = () => {
    if (filteredStudents.length > 0) {
      handleStatusChange(filteredStudents[0].id, "PRESENT");
      setToast({ message: `${filteredStudents[0].name} marcado como presente`, type: "success" });
      setSearchTerm("");
    }
  };

  const handleMarkAllPresent = () => {
    if (!guardEdit()) return;

    const visibleIds = new Set(filteredStudents.map((student) => String(student.id)));
    if (window.confirm(`¿Marcar como presentes las ${visibleIds.size} personas visibles?`)) {
      setAttendanceRecords((prev) =>
        prev.map((record) =>
          visibleIds.has(String(record.userId)) ? { ...record, status: "PRESENT" } : record
        )
      );
      setHasUnsavedChanges(true);
      setToast({ message: "Todos marcados como presentes", type: "success" });
    }
  };

  const handleReset = () => {
    if (!guardEdit()) return;

    if (window.confirm("¿Descartar todos los cambios sin guardar?")) {
      setAttendanceRecords(baselineRecords);
      setHasUnsavedChanges(false);
      setToast({ message: "Cambios descartados", type: "info" });
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession?.id) return;

    if (!canCloseSession) {
      setToast({
        message: "Solo administradores o el encargado pueden cerrar la sesión.",
        type: "error",
      });
      return;
    }

    if (stats.pending > 0 || hasUnsavedChanges) {
      setToast({
        message:
          stats.pending > 0
            ? `Revisa las ${stats.pending} personas pendientes antes de cerrar.`
            : "Guarda o descarta los cambios antes de cerrar la sesión.",
        type: "error",
      });
      return;
    }

    if (!window.confirm("¿Cerrar esta sesión? Luego no se podrá editar.")) return;

    try {
      await closeSessionMutation({ variables: { id: activeSession.id } });
      await refetchSession?.();
      setToast({ message: "Sesión cerrada correctamente.", type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Error al cerrar sesión", type: "error" });
    }
  };

  const handleSave = async () => {
    if (!guardEdit()) return;

    const pendingCount = attendanceRecords.filter(
      (record) => record.status === DEFAULT_STATUS
    ).length;
    if (pendingCount > 0) {
      setToast({
        message: `Falta revisar ${pendingCount} persona${pendingCount !== 1 ? "s" : ""}.`,
        type: "error",
      });
      return;
    }

    setIsSaving(true);

    try {
      const attendancesInput = attendanceRecords.map((record) => ({
        userId: record.userId,
        status: record.status,
        notes: record.notes || "",
      }));

      await takeAttendance({
        variables: {
          date: queryDate,
          section: userSection,
          attendances: attendancesInput,
        },
      });

      await refetchSession?.();

      setToast({ message: "¡Asistencia guardada correctamente!", type: "success" });
      setHasUnsavedChanges(false);
    } catch (err) {
      setToast({ message: err.message || "Error al guardar asistencia", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm("Tienes cambios sin guardar. ¿Seguro que quieres salir?")) {
        navigate("/attendance-history");
      }
    } else {
      navigate("/attendance-history");
    }
  };

  // Loading state
  if (userLoading || usersLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-600 font-medium text-sm sm:text-base">Cargando estudiantes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorState message={error.message} onRetry={refetch} />
      </div>
    );
  }

  // Sin sección válida
  if (!userSection || userSection === "NO_APLICA") {
    return (
      <div className="min-h-screen bg-gray-50">
        <AttendanceHeader
          stats={{ total: 0, present: 0, absent: 0, pending: 0 }}
          sessionInfo={{
            section: userSection || "NO_APLICA",
            alreadyTaken: false,
            isClosed: false,
          }}
          hasUnsavedChanges={false}
          onMarkAllPresent={() => {}}
          onReset={() => {}}
          canEdit={false}
          canCloseSession={false}
          onCloseSession={() => {}}
          visibleCount={0}
        />
        <div className="py-12 text-center text-gray-500 text-sm">
          Tu instrumento no está asociado a una sección válida.
        </div>
      </div>
    );
  }

  // Empty state
  if (students.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AttendanceHeader
          stats={{ total: 0, present: 0, absent: 0, pending: 0 }}
          sessionInfo={sessionInfo}
          hasUnsavedChanges={hasUnsavedChanges}
          onMarkAllPresent={handleMarkAllPresent}
          onReset={handleReset}
          canEdit={canEdit}
          canCloseSession={canCloseSession}
          onCloseSession={handleCloseSession}
          visibleCount={0}
        />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-4 sm:rounded-3xl sm:bg-slate-50 sm:pb-6">
      <AttendanceHeader
        stats={stats}
        onMarkAllPresent={handleMarkAllPresent}
        onReset={handleReset}
        hasUnsavedChanges={hasUnsavedChanges}
        sessionInfo={sessionInfo}
        canEdit={canEdit}
        canCloseSession={canCloseSession}
        onCloseSession={handleCloseSession}
        visibleCount={filteredStudents.length}
      />

      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalResults={filteredStudents.length}
        onQuickMark={handleQuickMark}
      />

      <div className="pb-3 sm:px-4 sm:pb-6">
        <div className="overflow-hidden bg-white sm:rounded-2xl sm:border sm:border-slate-200">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No se encontraron resultados para &quot;{searchTerm}&quot;
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredStudents.map((student) => {
                const attendance = attendanceRecords.find(
                  (r) => String(r.userId) === String(student.id)
                );
                return (
                  <StudentRow
                    key={student.id}
                    student={student}
                    attendance={attendance}
                    permission={permissionsByStudentId.get(String(student.id))}
                    onStatusChange={(status) => handleStatusChange(student.id, status)}
                    onEditNotes={() => handleEditNotes(student.id)}
                    searchTerm={searchTerm}
                    canEdit={canEdit}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ActionBar
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        canEdit={canEdit}
        unsavedCount={unsavedCount}
        pendingCount={stats.pending}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        mark { background-color: #fef08a; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default AttendancePage;

// ============================================================================
// PropTypes
// ============================================================================

StatusButton.propTypes = {
  status: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  compact: PropTypes.bool,
  disabled: PropTypes.bool,
};

MobileStatusSelector.propTypes = {
  currentStatus: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
    placement: PropTypes.oneOf(["top", "bottom"]).isRequired,
  }).isRequired,
  onEditNotes: PropTypes.func,
  canEdit: PropTypes.bool.isRequired,
};

StudentRow.propTypes = {
  student: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    firstSurName: PropTypes.string,
    secondSurName: PropTypes.string,
    instrument: PropTypes.string,
  }).isRequired,
  attendance: PropTypes.shape({
    userId: PropTypes.string,
    status: PropTypes.string.isRequired,
    notes: PropTypes.string,
    attendanceId: PropTypes.string,
  }),
  permission: PropTypes.object,
  onStatusChange: PropTypes.func.isRequired,
  onEditNotes: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  canEdit: PropTypes.bool.isRequired,
};

AttendanceHeader.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    present: PropTypes.number.isRequired,
    absent: PropTypes.number.isRequired,
    pending: PropTypes.number.isRequired,
  }).isRequired,
  onMarkAllPresent: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  hasUnsavedChanges: PropTypes.bool.isRequired,
  sessionInfo: PropTypes.shape({
    section: PropTypes.string,
    alreadyTaken: PropTypes.bool,
    takenByName: PropTypes.string,
    isNotAdmin: PropTypes.bool,
    isClosed: PropTypes.bool,
    isOwner: PropTypes.bool,
  }),
  canEdit: PropTypes.bool.isRequired,
  canCloseSession: PropTypes.bool.isRequired,
  onCloseSession: PropTypes.func.isRequired,
  visibleCount: PropTypes.number.isRequired,
};

SearchAndFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  totalResults: PropTypes.number.isRequired,
  onQuickMark: PropTypes.func.isRequired,
};

ActionBar.propTypes = {
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSaving: PropTypes.bool.isRequired,
  hasUnsavedChanges: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  unsavedCount: PropTypes.number.isRequired,
  pendingCount: PropTypes.number.isRequired,
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error", "info"]),
  onClose: PropTypes.func.isRequired,
};

ErrorState.propTypes = {
  message: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired,
};
