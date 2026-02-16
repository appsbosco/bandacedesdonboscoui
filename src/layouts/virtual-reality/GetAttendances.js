// AttendanceHistoryTable.jsx
import { useQuery } from "@apollo/client";
import { GET_ALL_ATTENDANCES_REHEARSAL, GET_USERS_BY_ID } from "graphql/queries";
import { useState, useRef, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// ============================================================================
// CONSTANTS & UTILS
// ============================================================================

const ATTENDANCE_STATUS_CONFIG = {
  PRESENT: { label: "Presente", color: "bg-emerald-500", textColor: "text-emerald-700" },
  ABSENT_UNJUSTIFIED: {
    label: "Ausencia Injustificada",
    color: "bg-red-500",
    textColor: "text-red-700",
  },
  ABSENT_JUSTIFIED: {
    label: "Ausencia Justificada",
    color: "bg-amber-500",
    textColor: "text-amber-700",
  },
  LATE: { label: "Tarde", color: "bg-orange-500", textColor: "text-orange-700" },
  UNJUSTIFIED_WITHDRAWAL: {
    label: "Retiro Injustificado",
    color: "bg-purple-700",
    textColor: "text-purple-800",
  },
  JUSTIFIED_WITHDRAWAL: {
    label: "Retiro Justificado",
    color: "bg-blue-600",
    textColor: "text-blue-800",
  },
};

const RECORDS_PER_PAGE = 50;

const STATUS_KEYS = [
  "PRESENT",
  "LATE",
  "ABSENT_UNJUSTIFIED",
  "ABSENT_JUSTIFIED",
  "JUSTIFIED_WITHDRAWAL",
  "UNJUSTIFIED_WITHDRAWAL",
];

const parseToDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      const d = new Date(parseInt(trimmed, 10));
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
};

const formatDateString = (dateValue) => {
  const date = parseToDate(dateValue);
  if (!date) return "";
  return date.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const getAttendanceConfig = (status) => {
  return (
    ATTENDANCE_STATUS_CONFIG[status] || {
      label: status || "—",
      color: "bg-gray-500",
      textColor: "text-gray-700",
    }
  );
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getMoodConfig = (percentage) => {
  if (percentage >= 80)
    return { icon: "😊", color: "text-green-600", bgColor: "bg-green-50", label: "Excelente" };
  if (percentage >= 60)
    return { icon: "😐", color: "text-orange-600", bgColor: "bg-orange-50", label: "Regular" };
  return { icon: "😞", color: "text-red-600", bgColor: "bg-red-50", label: "Necesita mejorar" };
};

const getDisplayDateFromRecord = (attendance) => {
  const rawDate =
    attendance?.session?.date || attendance?.legacyDate || attendance?.createdAt || null;
  return rawDate ? formatDateString(rawDate) : "";
};

const getSortDateValue = (attendance) => {
  const rawDate =
    attendance?.session?.date || attendance?.legacyDate || attendance?.createdAt || null;
  const d = parseToDate(rawDate);
  return d ? d.getTime() : 0;
};

const buildUserStatsMap = (records) => {
  const map = new Map();

  for (const r of records) {
    const userId = r?.user?.id ? String(r.user.id) : null;
    if (!userId) continue;

    const user = r.user;
    const entry = map.get(userId) || {
      userId,
      user,
      total: 0,
      counts: STATUS_KEYS.reduce((acc, k) => ((acc[k] = 0), acc), {}),
      records: [],
    };

    const st = r?.status || null;
    if (st && entry.counts[st] !== undefined) entry.counts[st] += 1;
    entry.total += 1;
    entry.records.push(r);

    map.set(userId, entry);
  }

  // Orden descendente por fecha en cada usuario + calcula porcentajes
  const out = {};
  map.forEach((entry, userId) => {
    entry.records.sort((a, b) => getSortDateValue(b) - getSortDateValue(a));

    const presentLike = (entry.counts.PRESENT || 0) + (entry.counts.LATE || 0);
    const percentage = entry.total > 0 ? (presentLike / entry.total) * 100 : 0;

    out[userId] = {
      ...entry,
      presentLike,
      percentage,
      mood: getMoodConfig(percentage),
    };
  });

  return out;
};

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

const AttendanceDetailModal = ({ isOpen, onClose, userStats }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const onMouseDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen, onClose]);

  if (!isOpen || !userStats) return null;

  const { user, total, counts, percentage, presentLike, mood, records } = userStats;

  const fullName = `${user?.name || ""} ${user?.firstSurName || ""} ${
    user?.secondSurName || ""
  }`.trim();

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        ref={panelRef}
        className="w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {fullName || "Detalle"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {user?.instrument ? `Instrumento: ${user.instrument}` : "—"}
              </p>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              aria-label="Cerrar"
            >
              Cerrar
            </button>
          </div>

          {/* Summary pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <span className="text-xs font-medium text-gray-600">Registros:</span>
              <span className="text-sm font-bold text-gray-900">{total}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-xs font-medium text-emerald-700">Efectivos:</span>
              <span className="text-sm font-bold text-emerald-900">{presentLike}</span>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${mood.bgColor}`}>
              <span className={`text-xl ${mood.color}`}>{mood.icon}</span>
              <div className="leading-tight">
                <p className="text-sm font-bold text-gray-900">{percentage.toFixed(1)}%</p>
                <p className={`text-xs font-medium ${mood.color}`}>{mood.label}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-4 max-h-[70vh] sm:max-h-[75vh] overflow-auto bg-gray-50">
          {/* Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Desglose por estado
              </p>
            </div>

            <div className="px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STATUS_KEYS.map((k) => {
                const cfg = getAttendanceConfig(k);
                const v = counts?.[k] || 0;
                return (
                  <div key={k} className="border border-gray-100 rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${cfg.color} text-white`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{v}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {total > 0 ? ((v / total) * 100).toFixed(1) : "0.0"}%
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent records */}
          <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Últimos registros
              </p>
              <p className="text-xs text-gray-500">{records?.length || 0}</p>
            </div>

            <div className="divide-y divide-gray-100">
              {(records || []).slice(0, 50).map((r) => {
                const cfg = getAttendanceConfig(r.status);
                const date = getDisplayDateFromRecord(r);
                return (
                  <div key={r.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 font-medium">
                        {date || "—"}{" "}
                        <span className="text-xs text-gray-500">
                          {r?.session?.section ? `• ${r.session.section}` : ""}
                        </span>
                      </p>

                      {r?.notes ? (
                        <p className="text-xs text-gray-600 mt-1 italic break-words">{r.notes}</p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">Sin notas</p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 inline-flex px-3 py-1 text-xs font-medium rounded-full ${cfg.color} text-white`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {(records || []).length > 50 && (
              <div className="px-4 py-3 text-xs text-gray-500 bg-white border-t">
                Mostrando 50 más recientes.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AttendanceRow = ({ record, searchTerm, onOpenDetails }) => {
  const userName =
    record.userName ||
    `${record.user?.name || ""} ${record.user?.firstSurName || ""} ${
      record.user?.secondSurName || ""
    }`.trim();

  const attendanceConfig = getAttendanceConfig(record.status);
  const percentageValue = typeof record.percentage === "number" ? record.percentage : 0;
  const moodConfig = getMoodConfig(percentageValue);

  const highlightText = (text) => {
    if (!searchTerm) return String(text || "");
    const safe = escapeRegex(searchTerm);
    const regex = new RegExp(`(${safe})`, "gi");
    return String(text || "").replace(regex, '<mark class="bg-yellow-200 font-semibold">$1</mark>');
  };

  const displayDate = record.displayDate || getDisplayDateFromRecord(record);

  const open = () => onOpenDetails?.(record.user?.id);

  return (
    <div
      className="group border-b border-gray-100 hover:bg-gray-50 transition-colors"
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      aria-label={`Ver estadísticas de ${userName}`}
    >
      {/* Mobile Layout */}
      <div className="block min-[1024px]:hidden px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {record.user?.name?.[0]}
            {record.user?.firstSurName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold text-gray-900 truncate"
              dangerouslySetInnerHTML={{ __html: highlightText(userName) }}
            />
            <p className="text-xs text-gray-500">{record.user?.instrument}</p>
          </div>
          <div className="flex-shrink-0">
            <span className="text-xs text-gray-500">{displayDate}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${attendanceConfig.color} text-white`}
          >
            {attendanceConfig.label}
          </span>

          <div className="flex items-center gap-2">
            <span className={`text-2xl ${moodConfig.color}`}>{moodConfig.icon}</span>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-700">{percentageValue.toFixed(1)}%</p>
              <p className={`text-xs ${moodConfig.color}`}>{moodConfig.label}</p>
            </div>
          </div>
        </div>

        {record.notes && (
          <div className="text-xs text-gray-600 italic bg-gray-50 px-2 py-1 rounded">
            {record.notes}
          </div>
        )}

        <p className="text-[11px] text-gray-400">Toque para ver estadísticas completas</p>
      </div>

      {/* Desktop Layout */}
      <div className="hidden min-[1024px]:grid min-[1024px]:grid-cols-12 gap-4 px-4 py-3 items-center">
        {/* Student Info - 3 cols */}
        <div className="col-span-3 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {record.user?.name?.[0]}
            {record.user?.firstSurName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold text-gray-900 truncate"
              dangerouslySetInnerHTML={{ __html: highlightText(userName) }}
            />
            <p className="text-xs text-gray-500">{record.user?.instrument}</p>
          </div>
        </div>

        {/* Date - 2 cols */}
        <div className="col-span-2">
          <p className="text-sm text-gray-700">{displayDate}</p>
        </div>

        {/* Section - 2 cols */}
        <div className="col-span-2">
          <p className="text-sm text-gray-600">{record.session?.section}</p>
        </div>

        {/* Attendance Status - 2 cols */}
        <div className="col-span-2">
          <span
            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${attendanceConfig.color} text-white`}
          >
            {attendanceConfig.label}
          </span>
        </div>

        {/* Percentage & Mood - 3 cols */}
        <div className="col-span-3 flex items-center justify-between">
          <div className="text-right flex-1">
            <p className="text-sm font-bold text-gray-900">{percentageValue.toFixed(1)}%</p>
            <p className={`text-xs ${moodConfig.color} font-medium`}>{moodConfig.label}</p>
          </div>
          <span className={`text-3xl ml-3 ${moodConfig.color}`}>{moodConfig.icon}</span>
        </div>
      </div>
    </div>
  );
};

const AttendanceHeader = ({ stats, filters, selectedDate, onDateChange, onFilterChange }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Historial de Asistencia</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Registro completo de todas las asistencias
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-medium text-gray-600">Total Registros:</span>
          <span className="text-base sm:text-lg font-bold text-gray-900">{stats.total}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-50 rounded-lg">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-xs font-medium text-emerald-700">Presentes:</span>
          <span className="text-base sm:text-lg font-bold text-emerald-900">{stats.present}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50 rounded-lg">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-xs font-medium text-red-700">Ausencias:</span>
          <span className="text-base sm:text-lg font-bold text-red-900">{stats.absent}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500">
          <span className="text-gray-600 text-sm">Fecha:</span>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => onDateChange(date)}
            dateFormat="dd/MM/yyyy"
            isClearable
            placeholderText="Todas"
            className="outline-none border-0 p-0 text-sm w-[140px] bg-transparent cursor-pointer"
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => onDateChange(null)}
              className="ml-1 text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
              title="Limpiar fecha"
            >
              Limpiar
            </button>
          )}
        </div>

        <select
          value={filters.status}
          onChange={(e) => onFilterChange("status", e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los estados</option>
          <option value="PRESENT">Presente</option>
          <option value="ABSENT_UNJUSTIFIED">Ausencia Injustificada</option>
          <option value="ABSENT_JUSTIFIED">Ausencia Justificada</option>
          <option value="LATE">Tarde</option>
          <option value="JUSTIFIED_WITHDRAWAL">Retiro Justificado</option>
          <option value="UNJUSTIFIED_WITHDRAWAL">Retiro Injustificado</option>
        </select>

        <select
          value={filters.instrument}
          onChange={(e) => onFilterChange("instrument", e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los instrumentos</option>
          {filters.instruments.map((inst) => (
            <option key={inst} value={inst}>
              {inst}
            </option>
          ))}
        </select>

        <select
          value={filters.section}
          onChange={(e) => onFilterChange("section", e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas las secciones</option>
          {filters.sections.map((sect) => (
            <option key={sect} value={sect}>
              {sect}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 uppercase tracking-wide">
        <div className="col-span-3">Estudiante</div>
        <div className="col-span-2">Fecha</div>
        <div className="col-span-2">Sección</div>
        <div className="col-span-2">Estado</div>
        <div className="col-span-3">Asistencia</div>
      </div>
    </div>
  );
};

const SearchAndFilters = ({ searchTerm, onSearchChange, totalResults }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre, instrumento..."
          className="block w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
          aria-label="Buscar"
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
        </p>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AttendanceHistoryTable = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    instrument: "all",
    section: "all",
    instruments: [],
    sections: [],
  });

  // Modal state
  const [detailUserId, setDetailUserId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const currentUser = userData?.getUser || null;

  const isAdmin = String(currentUser?.role || "").toUpperCase() === "ADMIN";
  const userInstrument = currentUser?.instrument;

  const dateFilter = useMemo(() => {
    if (!selectedDate) return {};
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    return { startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString() };
  }, [selectedDate]);

  const { loading, error, data } = useQuery(GET_ALL_ATTENDANCES_REHEARSAL, {
    variables: { limit: 1000, offset: 0, filter: dateFilter },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const validAttendances = useMemo(() => {
    const arr = data?.getAllAttendancesRehearsal || [];
    return arr.filter((a) => a?.user?.id);
  }, [data]);

  useEffect(() => {
    if (validAttendances.length > 0) {
      const uniqueInstruments = [
        ...new Set(validAttendances.map((a) => a.user?.instrument).filter(Boolean)),
      ];
      const uniqueSections = [
        ...new Set(validAttendances.map((a) => a.session?.section).filter(Boolean)),
      ];
      setFilters((prev) => ({
        ...prev,
        instruments: uniqueInstruments.sort(),
        sections: uniqueSections.sort(),
      }));
    }
  }, [validAttendances]);

  // Base accesible (por permisos)
  const accessibleRecords = useMemo(() => {
    return validAttendances
      .filter((r) => {
        if (!currentUser) return true;
        if (isAdmin) return true;
        return r.user?.instrument === userInstrument;
      })
      .sort((a, b) => getSortDateValue(b) - getSortDateValue(a));
  }, [validAttendances, currentUser, isAdmin, userInstrument]);

  // Stats base: respeta filtros de sección/instrumento (pero NO status, para poder ver desglose completo)
  const statsBaseRecords = useMemo(() => {
    return accessibleRecords.filter((r) => {
      const instrumentMatch =
        filters.instrument === "all" || r.user?.instrument === filters.instrument;
      const sectionMatch = filters.section === "all" || r.session?.section === filters.section;
      return instrumentMatch && sectionMatch;
    });
  }, [accessibleRecords, filters.instrument, filters.section]);

  const statsByUserId = useMemo(() => buildUserStatsMap(statsBaseRecords), [statsBaseRecords]);

  const processedRecords = useMemo(() => {
    const records = accessibleRecords.map((attendance) => {
      const userName = `${attendance.user?.name || ""} ${attendance.user?.firstSurName || ""} ${
        attendance.user?.secondSurName || ""
      }`.trim();

      const userId = attendance.user?.id ? String(attendance.user.id) : "";
      const percentage = userId && statsByUserId[userId] ? statsByUserId[userId].percentage : 0;
      const displayDate = getDisplayDateFromRecord(attendance);

      return { ...attendance, userName, percentage, displayDate };
    });

    return records;
  }, [accessibleRecords, statsByUserId]);

  const filteredRecords = useMemo(() => {
    const term = searchTerm ? searchTerm.toLowerCase() : "";
    return processedRecords.filter((record) => {
      const searchMatch =
        !searchTerm ||
        record.userName.toLowerCase().includes(term) ||
        String(record.user?.instrument || "")
          .toLowerCase()
          .includes(term);

      const statusMatch = filters.status === "all" || record.status === filters.status;
      const instrumentMatch =
        filters.instrument === "all" || record.user?.instrument === filters.instrument;
      const sectionMatch = filters.section === "all" || record.session?.section === filters.section;

      return searchMatch && statusMatch && instrumentMatch && sectionMatch;
    });
  }, [processedRecords, searchTerm, filters.status, filters.instrument, filters.section]);

  const stats = useMemo(() => {
    return {
      total: filteredRecords.length,
      present: filteredRecords.filter((r) => r.status === "PRESENT" || r.status === "LATE").length,
      absent: filteredRecords.filter((r) => r.status !== "PRESENT" && r.status !== "LATE").length,
    };
  }, [filteredRecords]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / RECORDS_PER_PAGE));
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (filteredRecords.length === 0) setCurrentPage(1);
  }, [currentPage, totalPages, filteredRecords.length]);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  const openDetails = (userId) => {
    if (!userId) return;
    setDetailUserId(String(userId));
    setIsDetailOpen(true);
  };

  const closeDetails = () => {
    setIsDetailOpen(false);
    setDetailUserId(null);
  };

  const selectedUserStats = detailUserId ? statsByUserId[detailUserId] : null;

  if (error) {
    return (
      <div className="py-16 px-4 text-center">
        <p className="text-red-600 font-medium">Error al cargar el historial: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AttendanceHeader
        stats={stats}
        filters={filters}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onFilterChange={handleFilterChange}
      />

      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        totalResults={filteredRecords.length}
      />

      <div className="px-0 sm:px-4 py-4 sm:py-6">
        <div className="bg-white rounded-none sm:rounded-lg shadow-sm border-0 sm:border border-gray-200 overflow-hidden">
          {loading && validAttendances.length === 0 ? (
            <div className="flex items-center justify-center py-16 bg-white">
              <div className="text-center">
                <svg
                  className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4"
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
                <p className="text-gray-600 font-medium text-sm sm:text-base">
                  Cargando historial...
                </p>
              </div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-gray-600 text-sm px-6">
              <p className="font-medium text-gray-700">No se encontraron registros</p>
              {selectedDate ? (
                <p className="mt-2 text-gray-500">
                  No hay registros para la fecha seleccionada. Probá otra fecha o limpiá el filtro.
                </p>
              ) : (
                <p className="mt-2 text-gray-500">Probá ajustar los filtros o la búsqueda.</p>
              )}

              {selectedDate && (
                <button
                  type="button"
                  onClick={() => handleDateChange(null)}
                  className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  Limpiar fecha
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {paginatedRecords.map((record) => (
                  <AttendanceRow
                    key={record.id}
                    record={record}
                    searchTerm={searchTerm}
                    onOpenDetails={openDetails}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t bg-gray-50">
                  <p className="text-sm text-gray-700">
                    Mostrando {startIndex + 1} - {Math.min(endIndex, filteredRecords.length)} de{" "}
                    {filteredRecords.length} registros
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Anterior
                    </button>

                    <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="px-4 py-3 text-sm text-gray-500 bg-white border-t flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
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
                  Actualizando...
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AttendanceDetailModal
        isOpen={isDetailOpen}
        onClose={closeDetails}
        userStats={selectedUserStats}
      />

      <style>{`
        mark { background-color: #fef08a; font-weight: 600; }
        .react-datepicker-wrapper { display: inline-block; }
        .react-datepicker__input-container input { outline: none; }
      `}</style>
    </div>
  );
};

export default AttendanceHistoryTable;

// =========================
// PROPTYPES
// =========================

AttendanceDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userStats: PropTypes.shape({
    userId: PropTypes.string,
    user: PropTypes.object,
    total: PropTypes.number,
    presentLike: PropTypes.number,
    percentage: PropTypes.number,
    mood: PropTypes.shape({
      icon: PropTypes.string,
      color: PropTypes.string,
      bgColor: PropTypes.string,
      label: PropTypes.string,
    }),
    counts: PropTypes.object,
    records: PropTypes.array,
  }),
};

AttendanceRow.propTypes = {
  record: PropTypes.shape({
    id: PropTypes.string.isRequired,
    user: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      firstSurName: PropTypes.string,
      secondSurName: PropTypes.string,
      instrument: PropTypes.string,
    }),
    session: PropTypes.shape({
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      section: PropTypes.string,
    }),
    legacyDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
    createdAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
    status: PropTypes.string,
    notes: PropTypes.string,
    percentage: PropTypes.number,
    displayDate: PropTypes.string,
    userName: PropTypes.string,
  }).isRequired,
  searchTerm: PropTypes.string,
  onOpenDetails: PropTypes.func.isRequired,
};

AttendanceHeader.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    present: PropTypes.number.isRequired,
    absent: PropTypes.number.isRequired,
  }).isRequired,
  filters: PropTypes.shape({
    status: PropTypes.string.isRequired,
    instrument: PropTypes.string.isRequired,
    section: PropTypes.string.isRequired,
    instruments: PropTypes.arrayOf(PropTypes.string).isRequired,
    sections: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  onDateChange: PropTypes.func.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

SearchAndFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  totalResults: PropTypes.number.isRequired,
};
