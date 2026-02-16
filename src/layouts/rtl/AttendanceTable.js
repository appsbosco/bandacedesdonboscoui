import { useMutation, useQuery } from "@apollo/client";
import { TAKE_ATTENDANCE_REHEARSAL, CLOSE_SESSION } from "graphql/mutations";
import { GET_USERS, GET_ACTIVE_SESSION, GET_USERS_BY_ID } from "graphql/queries";
import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { mapInstrumentToSection } from "utils/sectionMapper";

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

const DEFAULT_STATUS = "PRESENT";

const normalizeFullName = (u) =>
  `${u?.name || ""} ${u?.firstSurName || ""} ${u?.secondSurName || ""}`.trim();

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
        ${compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"}
        font-medium rounded-lg transition-all duration-200
        ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
            : isActive
            ? `${statusConfig.color} text-white shadow-md scale-105`
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
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

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white rounded-lg shadow-2xl border border-gray-200 py-3 px-4 min-w-[280px]"
      style={{ top: position.top, left: position.left }}
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
};

const StudentRow = ({ student, attendance, onStatusChange, onEditNotes, searchTerm, canEdit }) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [moreOptionsPosition, setMoreOptionsPosition] = useState({ top: 0, left: 0 });
  const moreButtonRef = useRef(null);

  const currentStatus = attendance?.status || DEFAULT_STATUS;
  const fullName = normalizeFullName(student);

  const highlightText = (text) => {
    if (!searchTerm) return text;
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return String(text).replace(regex, '<mark class="bg-yellow-200 font-semibold">$1</mark>');
  };

  const handleMoreClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const top = rect.bottom + 8;
    const anchorX = rect.left + rect.width / 2;
    setMoreOptionsPosition({ top, left: anchorX });
    setShowMoreOptions(true);
  };

  const initials = `${(student?.name || " ")[0] || ""}${(student?.firstSurName || " ")[0] || ""}`;

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors gap-3">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold text-gray-900 truncate"
            dangerouslySetInnerHTML={{ __html: highlightText(fullName) }}
          />
          <p className="text-xs text-gray-500 mt-0.5">{student.instrument}</p>
        </div>
      </div>

      {/* Desktop: Full segmented control */}
      <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
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
      <div className="flex lg:hidden items-center gap-2 flex-wrap">
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
            px-3 py-1.5 text-xs font-medium rounded-lg transition-all
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
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Toma de Asistencia</h1>
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

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-medium text-gray-600">Total:</span>
          <span className="text-base sm:text-lg font-bold text-gray-900">{stats.total}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-50 rounded-lg">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-xs font-medium text-emerald-700">Presentes:</span>
          <span className="text-base sm:text-lg font-bold text-emerald-900">{stats.present}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50 rounded-lg">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-xs font-medium text-red-700">Ausentes:</span>
          <span className="text-base sm:text-lg font-bold text-red-900">{stats.absent}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onMarkAllPresent}
          disabled={!canEdit}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Marcar todos presentes
        </button>

        <button
          onClick={onReset}
          disabled={!canEdit}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Resetear
        </button>

        {canCloseSession && (
          <button
            onClick={onCloseSession}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cerrar sesión
          </button>
        )}
      </div>
    </div>
  );
};

const SearchAndFilters = ({ searchTerm, onSearchChange, totalResults, onQuickMark }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm && totalResults > 0) {
      e.preventDefault();
      onQuickMark();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar estudiante... (presiona Enter para marcar presente)"
          className="block w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
          aria-label="Buscar estudiante"
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

const ActionBar = ({ onSave, onCancel, isSaving, hasUnsavedChanges, canEdit }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 shadow-lg z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-end gap-2 sm:gap-3">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>

        <button
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges || !canEdit}
          className="px-5 sm:px-8 py-2 sm:py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          ) : (
            "Guardar asistencia"
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
      className={`fixed top-4 right-4 ${bgColor} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg z-50 animate-slide-in-right flex items-center gap-3 max-w-sm`}
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
      <button onClick={onClose} className="ml-auto hover:opacity-75">
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
  const isAdmin = currentUser?.role === "ADMIN";

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
  const students = useMemo(() => {
    if (!userSection || userSection === "NO_APLICA") return [];
    return users.filter((user) => {
      const studentSection = mapInstrumentToSection(user.instrument);
      return (
        studentSection === userSection &&
        user.role !== "Instructor de instrumento" &&
        user.role !== "ADMIN"
      );
    });
  }, [users, userSection]);

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

    return { total, present, absent };
  }, [attendanceRecords]);

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

    if (window.confirm("¿Marcar todos los estudiantes como presentes?")) {
      setAttendanceRecords((prev) => prev.map((record) => ({ ...record, status: "PRESENT" })));
      setHasUnsavedChanges(true);
      setToast({ message: "Todos marcados como presentes", type: "success" });
    }
  };

  const handleReset = () => {
    if (!guardEdit()) return;

    if (window.confirm('¿Resetear toda la asistencia a "Presente"?')) {
      setAttendanceRecords((prev) => prev.map((record) => ({ ...record, status: "PRESENT" })));
      setHasUnsavedChanges(false);
      setToast({ message: "Asistencia reseteada", type: "info" });
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

    setIsSaving(true);

    try {
      const attendancesInput = attendanceRecords.map((record) => ({
        userId: record.userId,
        status: record.status,
        notes: record.notes || "",
      }));

      await takeAttendance({
        variables: {
          date: queryDate, // importantísimo: misma fecha que la sesión consultada
          section: userSection,
          attendances: attendancesInput,
        },
      });

      await refetchSession?.();

      setToast({ message: "¡Asistencia guardada correctamente!", type: "success" });
      setHasUnsavedChanges(false);

      setTimeout(() => navigate("/attendance-history"), 1200);
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
          stats={{ total: 0, present: 0, absent: 0 }}
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
          stats={{ total: 0, present: 0, absent: 0 }}
          sessionInfo={sessionInfo}
          hasUnsavedChanges={hasUnsavedChanges}
          onMarkAllPresent={handleMarkAllPresent}
          onReset={handleReset}
          canEdit={canEdit}
          canCloseSession={canCloseSession}
          onCloseSession={handleCloseSession}
        />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-24">
      <AttendanceHeader
        stats={stats}
        onMarkAllPresent={handleMarkAllPresent}
        onReset={handleReset}
        hasUnsavedChanges={hasUnsavedChanges}
        sessionInfo={sessionInfo}
        canEdit={canEdit}
        canCloseSession={canCloseSession}
        onCloseSession={handleCloseSession}
      />

      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalResults={filteredStudents.length}
        onQuickMark={handleQuickMark}
      />

      <div className="sm:py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
