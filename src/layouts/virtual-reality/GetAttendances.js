// AttendanceHistoryTable.jsx
import { useQuery, useLazyQuery, useMutation } from "@apollo/client";
import {
  GET_ATTENDANCES_REHEARSAL_CONNECTION,
  GET_USERS_BY_ID,
  GET_USER_ATTENDANCE_STATS,
} from "graphql/queries";
import { UPDATE_SINGLE_ATTENDANCE } from "graphql/mutations";
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

const ATTENDANCE_FETCH_PAGE_SIZE = 50;

const STATUS_KEYS = [
  "PRESENT",
  "LATE",
  "ABSENT_UNJUSTIFIED",
  "ABSENT_JUSTIFIED",
  "JUSTIFIED_WITHDRAWAL",
  "UNJUSTIFIED_WITHDRAWAL",
];

const WEIGHTS = {
  ATTENDANCE: {
    PRESENT: 1,
    LATE: 1,
    ABSENT_JUSTIFIED: 0.5,
    JUSTIFIED_WITHDRAWAL: 0.75,
  },
  EQUIVALENT_ABSENCE: {
    ABSENT_UNJUSTIFIED: 1,
    UNJUSTIFIED_WITHDRAWAL: 1,
    ABSENT_JUSTIFIED: 0.5,
    JUSTIFIED_WITHDRAWAL: 0.25,
  },
};

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
  return date.toLocaleDateString("es-CR", {
    timeZone: "America/Costa_Rica",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const CR_TIMEZONE = "America/Costa_Rica";

const getYmdInCR = (dateValue) => {
  const date = parseToDate(dateValue);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!year || !month || !day) return null;
  return `${year}-${month}-${day}`;
};

const getRecordRawDate = (attendance) =>
  attendance?.attendanceDate ||
  attendance?.legacyDate ||
  attendance?.session?.dateNormalized ||
  attendance?.session?.date ||
  attendance?.createdAt ||
  null;

const getPickerYmd = (pickerDate) => {
  if (!(pickerDate instanceof Date)) return null;
  const y = pickerDate.getFullYear();
  const m = String(pickerDate.getMonth() + 1).padStart(2, "0");
  const d = String(pickerDate.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getDateRangeFromPicker = (pickerDate) => {
  if (!pickerDate) return { startDate: null, endDate: null };
  const ymd = getPickerYmd(pickerDate);
  return { startDate: ymd, endDate: ymd };
};

const getAttendanceConfig = (status) =>
  ATTENDANCE_STATUS_CONFIG[status] || {
    label: status || "—",
    color: "bg-gray-500",
    textColor: "text-gray-700",
  };

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getMoodConfig = (percentage) => {
  if (percentage >= 80) {
    return { icon: "😊", color: "text-green-600", bgColor: "bg-green-50", label: "Excelente" };
  }
  if (percentage >= 60) {
    return { icon: "😐", color: "text-orange-600", bgColor: "bg-orange-50", label: "Regular" };
  }
  return { icon: "😞", color: "text-red-600", bgColor: "bg-red-50", label: "Necesita mejorar" };
};

const getDisplayDateFromRecord = (attendance) => {
  const rawDate = getRecordRawDate(attendance);
  return rawDate ? formatDateString(rawDate) : "";
};

const getSortDateValue = (attendance) => {
  const rawDate = getRecordRawDate(attendance);
  const d = parseToDate(rawDate);
  return d ? d.getTime() : 0;
};

const getUserFullName = (user) =>
  [user?.name, user?.firstSurName, user?.secondSurName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");

const getDisplayUserName = (user) => getUserFullName(user) || "Usuario no encontrado";

const getEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value.id) return getEntityId(value.id);
  if (value._id) return getEntityId(value._id);
  const asString = String(value);
  return asString === "[object Object]" ? "" : asString;
};

// ── Helpers de riesgo ────────────────────────────────────────────────────────

const getRiskBadges = ({ hasThreeUnjustified, exceedsLimit } = {}) => {
  const badges = [];
  if (hasThreeUnjustified) {
    badges.push({
      label: "⚠ 3+ injustificadas",
      className: "bg-red-100 text-red-700 border border-red-300",
    });
  }
  if (exceedsLimit) {
    badges.push({
      label: "🚨 Excede límite",
      className: "bg-red-200 text-red-800 border border-red-400 font-bold",
    });
  }
  return badges;
};

// ── buildUserStatsMap (solo para cálculo local / porcentaje en filas) ────────
const buildUserStatsMap = (records) => {
  const map = new Map();

  for (const r of records) {
    const userId = getEntityId(r?.user);
    if (!userId) continue;

    const user = r.user;
    const entry = map.get(userId) || {
      userId,
      user,
      total: 0,
      counts: STATUS_KEYS.reduce((acc, k) => {
        acc[k] = 0;
        return acc;
      }, {}),
      records: [],
    };

    const st = r?.status || null;
    if (st && entry.counts[st] !== undefined) entry.counts[st] += 1;

    entry.total += 1;
    entry.records.push(r);
    map.set(userId, entry);
  }

  const out = {};
  map.forEach((entry, userId) => {
    entry.records.sort((a, b) => getSortDateValue(b) - getSortDateValue(a));

    const presentLike = (entry.counts.PRESENT || 0) + (entry.counts.LATE || 0);
    const unjustifiedCountLocal =
      (entry.counts.ABSENT_UNJUSTIFIED || 0) + (entry.counts.UNJUSTIFIED_WITHDRAWAL || 0);

    const attendanceCreditsLocal =
      (entry.counts.PRESENT || 0) * WEIGHTS.ATTENDANCE.PRESENT +
      (entry.counts.LATE || 0) * WEIGHTS.ATTENDANCE.LATE +
      (entry.counts.ABSENT_JUSTIFIED || 0) * WEIGHTS.ATTENDANCE.ABSENT_JUSTIFIED +
      (entry.counts.JUSTIFIED_WITHDRAWAL || 0) * WEIGHTS.ATTENDANCE.JUSTIFIED_WITHDRAWAL;

    const equivalentAbsencesLocal =
      (entry.counts.ABSENT_UNJUSTIFIED || 0) * WEIGHTS.EQUIVALENT_ABSENCE.ABSENT_UNJUSTIFIED +
      (entry.counts.UNJUSTIFIED_WITHDRAWAL || 0) *
        WEIGHTS.EQUIVALENT_ABSENCE.UNJUSTIFIED_WITHDRAWAL +
      (entry.counts.ABSENT_JUSTIFIED || 0) * WEIGHTS.EQUIVALENT_ABSENCE.ABSENT_JUSTIFIED +
      (entry.counts.JUSTIFIED_WITHDRAWAL || 0) * WEIGHTS.EQUIVALENT_ABSENCE.JUSTIFIED_WITHDRAWAL;

    const percentage = entry.total > 0 ? (attendanceCreditsLocal / entry.total) * 100 : 0;
    const hasThreeUnjustifiedLocal = unjustifiedCountLocal >= 3;
    const exceedsLimitLocal = equivalentAbsencesLocal > 6;

    out[userId] = {
      ...entry,
      presentLike,
      attendanceCreditsLocal,
      equivalentAbsencesLocal,
      unjustifiedCountLocal,
      hasThreeUnjustifiedLocal,
      exceedsLimitLocal,
      percentage,
      mood: getMoodConfig(percentage),
    };
  });

  return out;
};

// ============================================================================
// CUSTOM HOOK: useUserAttendanceStats
// ============================================================================

const useUserAttendanceStats = (userId, pickerDate, refreshKey = 0) => {
  const { startDate, endDate } = getDateRangeFromPicker(pickerDate);

  const [fetchStats, { data, loading, error }] = useLazyQuery(GET_USER_ATTENDANCE_STATS, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (!userId) return;
    fetchStats({
      variables: {
        userId,
        ...(startDate ? { startDate, endDate } : {}),
      },
    });
  }, [userId, startDate, endDate, refreshKey, fetchStats]);

  return {
    stats: data?.getUserAttendanceStats ?? null,
    loading,
    error,
  };
};

const useDebouncedValue = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
};

const useUserAttendanceRecords = (userId, pickerDate, refreshKey = 0) => {
  const { startDate, endDate } = getDateRangeFromPicker(pickerDate);

  const { data, loading, error, refetch } = useQuery(GET_ATTENDANCES_REHEARSAL_CONNECTION, {
    variables: {
      limit: 100,
      filter: {
        userId,
        ...(startDate ? { startDate, endDate } : {}),
      },
    },
    skip: !userId,
    fetchPolicy: "no-cache",
  });

  useEffect(() => {
    if (userId) refetch?.();
  }, [refreshKey, userId, refetch]);

  return {
    records: (data?.getAttendancesRehearsalConnection?.nodes || []).filter(
      (record) => getEntityId(record?.user) === getEntityId(userId)
    ),
    loading,
    error,
  };
};

// ============================================================================
// SUBCOMPONENT: WorstAttendancePanel
// ============================================================================

const WorstAttendancePanel = ({ users = [], topN = 8 }) => {
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => {
    return [...users].slice(0, topN);
  }, [users, topN]);

  if (sorted.length === 0) return null;

  return (
    <div className="mx-4 sm:mx-0 mb-4 bg-white rounded-lg border border-red-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between bg-red-50 hover:bg-red-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-bold text-sm">⚠ Peor asistencia</span>
          <span className="text-xs text-red-500">Top {topN}</span>
        </div>
        <span className="text-xs text-gray-500">{expanded ? "▲ Ocultar" : "▼ Ver"}</span>
      </button>

      {expanded && (
        <div className="divide-y divide-gray-100">
          {sorted.map(
            ({
              userId,
              user,
              attendancePercentage,
              unjustifiedCount,
              equivalentAbsences,
              hasThreeUnjustified,
            }) => {
              const fullName = getDisplayUserName(user);
              const percentage = Number(attendancePercentage || 0);
              const mood = getMoodConfig(percentage);

              return (
                <div key={userId} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold text-gray-900 text-left break-words"
                      dir="ltr"
                      style={{ unicodeBidi: "isolate" }}
                    >
                      {fullName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.instrument || "—"}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${mood.bgColor} ${mood.color}`}
                    >
                      <span>{mood.icon}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>

                    <div className="text-xs text-gray-500 text-right leading-tight">
                      <p>
                        Inj:{" "}
                        <span className="font-semibold text-red-600">{unjustifiedCount || 0}</span>
                      </p>
                      <p>
                        Equiv:{" "}
                        <span className="font-semibold text-orange-600">
                          {Number(equivalentAbsences || 0).toFixed(1)}
                        </span>
                      </p>
                    </div>

                    {hasThreeUnjustified && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300 whitespace-nowrap">
                        ⚠ 3+ inj.
                      </span>
                    )}
                  </div>
                </div>
              );
            }
          )}

          <p className="px-4 py-2 text-[11px] text-gray-400 bg-gray-50">
            Calculado por el backend con los filtros activos.
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUBCOMPONENT: AttendanceDetailModal
// ============================================================================

const AttendanceDetailModal = ({
  isOpen,
  onClose,
  userStats,
  selectedDate,
  canEdit,
  onUpdateAttendance,
  statsRefreshKey,
}) => {
  const panelRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ status: "", notes: "" });
  const [savingId, setSavingId] = useState(null);
  const [saveError, setSaveError] = useState("");

  const { stats: rawBackendStats, loading: statsLoading } = useUserAttendanceStats(
    isOpen ? userStats?.userId : null,
    selectedDate,
    statsRefreshKey
  );
  const { records: backendRecords } = useUserAttendanceRecords(
    isOpen ? userStats?.userId : null,
    selectedDate,
    statsRefreshKey
  );

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setDraft({ status: "", notes: "" });
      setSaveError("");
    }
  }, [isOpen]);

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

  const selectedUserId = getEntityId(userStats.userId);
  const backendStats =
    rawBackendStats && getEntityId(rawBackendStats.userId) === selectedUserId
      ? rawBackendStats
      : null;

  const {
    user,
    total,
    counts,
    percentage,
    attendanceCreditsLocal,
    hasThreeUnjustifiedLocal,
    exceedsLimitLocal,
  } = userStats;
  const localRecords = (userStats.records || []).filter(
    (record) => getEntityId(record?.user) === selectedUserId
  );
  const records = backendRecords.length > 0 ? backendRecords : localRecords;

  const displayUser = backendStats?.user || user;
  const fullName = getDisplayUserName(displayUser);

  const displayPercentage = backendStats?.attendancePercentage ?? percentage;
  const displayMood = getMoodConfig(displayPercentage);
  const riskBadges = getRiskBadges(
    backendStats ?? {
      hasThreeUnjustified: hasThreeUnjustifiedLocal,
      exceedsLimit: exceedsLimitLocal,
    }
  );

  const displayCredits = backendStats?.attendanceCredits ?? attendanceCreditsLocal ?? 0;

  const startEdit = (record) => {
    setEditingId(record.id);
    setDraft({ status: record.status || "PRESENT", notes: record.notes || "" });
    setSaveError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ status: "", notes: "" });
    setSaveError("");
  };

  const saveEdit = async () => {
    if (!editingId || !draft.status || !onUpdateAttendance) return;
    setSavingId(editingId);
    setSaveError("");
    try {
      await onUpdateAttendance({
        id: editingId,
        status: draft.status,
        notes: draft.notes,
      });
      cancelEdit();
    } catch (err) {
      setSaveError(err?.message || "No se pudo actualizar la asistencia.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[1300] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        ref={panelRef}
        className="w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        <div className="px-4 sm:px-6 py-4 border-b bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                className="text-lg sm:text-xl font-bold text-gray-900 text-left break-words"
                dir="ltr"
                style={{ unicodeBidi: "isolate" }}
              >
                {fullName || "Detalle"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {displayUser?.instrument ? `Instrumento: ${displayUser.instrument}` : "—"}
              </p>

              {riskBadges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {riskBadges.map((b) => (
                    <span
                      key={b.label}
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${b.className}`}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              aria-label="Cerrar"
            >
              Cerrar
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <span className="text-xs font-medium text-gray-600">Registros:</span>
              <span className="text-sm font-bold text-gray-900">{total}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-xs font-medium text-emerald-700">Créditos:</span>
              <span className="text-sm font-bold text-emerald-900">
                {Number(displayCredits).toFixed(2)}
              </span>
            </div>

            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${displayMood.bgColor}`}
            >
              <span className={`text-xl ${displayMood.color}`}>{displayMood.icon}</span>
              <div className="leading-tight">
                <p className="text-sm font-bold text-gray-900">{displayPercentage.toFixed(1)}%</p>
                <p className={`text-xs font-medium ${displayMood.color}`}>{displayMood.label}</p>
                {backendStats && <p className="text-[10px] text-gray-400">ponderado (backend)</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 max-h-[70vh] sm:max-h-[75vh] overflow-auto bg-gray-50">
          {/* <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Métricas reales
              </p>
              {statsLoading && (
                <span className="text-xs text-blue-500 flex items-center gap-1">
                  <svg
                    className="animate-spin h-3 w-3"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Cargando...
                </span>
              )}
            </div>

            {backendStats ? (
              <div className="px-4 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MetricCard
                  label="Sesiones totales"
                  value={backendStats.totalSessions}
                  sub="en el período"
                />
                <MetricCard
                  label="% Ponderado"
                  value={`${backendStats.attendancePercentage.toFixed(1)}%`}
                  sub="Pres/Late=1 • Aus.just.=0.5 • Ret.just.=0.75"
                  highlight={
                    backendStats.attendancePercentage < 60
                      ? "red"
                      : backendStats.attendancePercentage < 80
                      ? "orange"
                      : "green"
                  }
                />
                <MetricCard
                  label="% Estricto"
                  value={`${backendStats.strictAttendancePercentage.toFixed(1)}%`}
                  sub="solo Present + Late"
                />
                <MetricCard
                  label="Injustificadas"
                  value={backendStats.unjustifiedCount}
                  sub={`+ ${backendStats.missingAsUnjustified} sin registro`}
                  highlight={backendStats.unjustifiedCount >= 3 ? "red" : undefined}
                />
                <MetricCard
                  label="Justificadas"
                  value={backendStats.justifiedCount}
                  sub="ausencias + retiros"
                />
                <MetricCard
                  label="Faltas equiv."
                  value={backendStats.equivalentAbsences.toFixed(1)}
                  sub="inj. + aus.just.*0.5 + ret.just.*0.25"
                  highlight={
                    backendStats.exceedsLimit
                      ? "red"
                      : backendStats.equivalentAbsences >= 4
                      ? "orange"
                      : undefined
                  }
                />
              </div>
            ) : (
              !statsLoading && (
                <p className="px-4 py-3 text-xs text-gray-400">
                  No se pudieron cargar las métricas del backend.
                </p>
              )
            )}
          </div> */}

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

          <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Historial del estudiante
              </p>
              <p className="text-xs text-gray-500">{records?.length || 0}</p>
            </div>

            <div className="divide-y divide-gray-100">
              {(records || []).map((r) => {
                const cfg = getAttendanceConfig(r.status);
                const date = getDisplayDateFromRecord(r);
                const isEditing = editingId === r.id;
                const isSaving = savingId === r.id;

                return (
                  <div key={r.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
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
                      <div className="shrink-0 flex items-center gap-2">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${cfg.color} text-white`}
                        >
                          {cfg.label}
                        </span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => startEdit(r)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <label className="text-xs font-semibold text-gray-600 sm:col-span-1">
                            Estado
                            <select
                              value={draft.status}
                              onChange={(e) =>
                                setDraft((prev) => ({ ...prev, status: e.target.value }))
                              }
                              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={isSaving}
                            >
                              {STATUS_KEYS.map((status) => (
                                <option key={status} value={status}>
                                  {getAttendanceConfig(status).label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="text-xs font-semibold text-gray-600 sm:col-span-2">
                            Notas
                            <textarea
                              value={draft.notes}
                              onChange={(e) =>
                                setDraft((prev) => ({ ...prev, notes: e.target.value }))
                              }
                              className="mt-1 w-full min-h-[72px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              maxLength={500}
                              disabled={isSaving}
                              placeholder="Sin notas"
                            />
                          </label>
                        </div>

                        {saveError && (
                          <p className="mt-2 text-xs font-medium text-red-600">{saveError}</p>
                        )}

                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={isSaving}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={isSaving || !draft.status}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isSaving ? "Guardando..." : "Guardar"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {(records || []).length === 0 && (
              <div className="px-4 py-5 text-sm text-gray-500 bg-white">
                No hay registros para este estudiante en el período seleccionado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SUBCOMPONENT: MetricCard
// ============================================================================

const MetricCard = ({ label, value, sub, highlight }) => {
  const colorMap = {
    red: "text-red-700 bg-red-50 border-red-200",
    orange: "text-orange-700 bg-orange-50 border-orange-200",
    green: "text-green-700 bg-green-50 border-green-200",
  };

  const cls = highlight ? colorMap[highlight] : "text-gray-900 bg-white border-gray-100";

  return (
    <div className={`border rounded-lg p-3 ${cls}`}>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
};

// ============================================================================
// SUBCOMPONENT: AttendanceRow
// ============================================================================

const AttendanceRow = ({ record, searchTerm, onOpenDetails }) => {
  const userName = record.userName || getDisplayUserName(record.user);

  const attendanceConfig = getAttendanceConfig(record.status);
  const percentageValue = typeof record.percentage === "number" ? record.percentage : 0;
  const moodConfig = getMoodConfig(percentageValue);

  const localUnjustified =
    (record._localCounts?.ABSENT_UNJUSTIFIED || 0) +
    (record._localCounts?.UNJUSTIFIED_WITHDRAWAL || 0);
  const showUnjustifiedBadge = localUnjustified >= 3;

  const highlightText = (text) => {
    if (!searchTerm) return String(text || "");
    const safe = escapeRegex(searchTerm);
    const regex = new RegExp(`(${safe})`, "gi");
    return String(text || "").replace(regex, '<mark class="bg-yellow-200 font-semibold">$1</mark>');
  };

  const displayDate = record.displayDate || getDisplayDateFromRecord(record);
  const open = () => onOpenDetails?.(getEntityId(record.user));

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
      <div className="block min-[1024px]:hidden px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {record.user?.name?.[0] || "?"}
            {record.user?.firstSurName?.[0] || ""}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className="text-sm font-semibold text-gray-900 text-left break-words"
                dir="ltr"
                style={{ unicodeBidi: "isolate" }}
                dangerouslySetInnerHTML={{ __html: highlightText(userName) }}
              />
              {showUnjustifiedBadge && (
                <span className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-300 whitespace-nowrap">
                  ⚠ 3+ inj.
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{record.user?.instrument || "Sin instrumento"}</p>
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

      <div className="hidden min-[1024px]:grid min-[1024px]:grid-cols-12 gap-4 px-4 py-3 items-center">
        <div className="col-span-3 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {record.user?.name?.[0] || "?"}
            {record.user?.firstSurName?.[0] || ""}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className="text-sm font-semibold text-gray-900 text-left break-words"
                dir="ltr"
                style={{ unicodeBidi: "isolate" }}
                dangerouslySetInnerHTML={{ __html: highlightText(userName) }}
              />
              {showUnjustifiedBadge && (
                <span className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-300 whitespace-nowrap">
                  ⚠ 3+ inj.
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{record.user?.instrument || "Sin instrumento"}</p>
          </div>
        </div>

        <div className="col-span-2">
          <p className="text-sm text-gray-700">{displayDate}</p>
        </div>

        <div className="col-span-2">
          <p className="text-sm text-gray-600">{record.session?.section}</p>
        </div>

        <div className="col-span-2">
          <span
            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${attendanceConfig.color} text-white`}
          >
            {attendanceConfig.label}
          </span>
        </div>

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

// ============================================================================
// SUBCOMPONENT: AttendanceHeader
// ============================================================================

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
          {filters.sections.map((section) => (
            <option key={section} value={section}>
              {section}
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

// ============================================================================
// SUBCOMPONENT: SearchAndFilters
// ============================================================================

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    instrument: "all",
    section: "all",
    instruments: [],
    sections: [],
  });

  const [detailUserId, setDetailUserId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [paginationError, setPaginationError] = useState("");
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const currentUser = userData?.getUser || null;
  const isAdmin = String(currentUser?.role || "").toUpperCase() === "ADMIN";

  const attendanceFilter = useMemo(() => {
    const { startDate, endDate } = getDateRangeFromPicker(selectedDate);
    return {
      ...(filters.status !== "all" ? { status: filters.status } : {}),
      ...(filters.instrument !== "all" ? { instrument: filters.instrument } : {}),
      ...(filters.section !== "all" ? { section: filters.section } : {}),
      ...(startDate ? { startDate, endDate } : {}),
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    };
  }, [debouncedSearch, filters.instrument, filters.section, filters.status, selectedDate]);

  const { loading, error, data, fetchMore, refetch } = useQuery(
    GET_ATTENDANCES_REHEARSAL_CONNECTION,
    {
      variables: { limit: ATTENDANCE_FETCH_PAGE_SIZE, filter: attendanceFilter },
      fetchPolicy: "no-cache",
      notifyOnNetworkStatusChange: true,
    }
  );

  const connection = data?.getAttendancesRehearsalConnection;
  const pageInfo = connection?.pageInfo || {};
  const validAttendances = connection?.nodes || [];
  const availableFilters = connection?.availableFilters || { instruments: [], sections: [] };
  const summary = connection?.summary || { total: 0, present: 0, absent: 0 };
  const worstUsers = connection?.worstUsers || [];

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      instruments: availableFilters.instruments || [],
      sections: availableFilters.sections || [],
    }));
  }, [availableFilters.instruments, availableFilters.sections]);

  const [updateSingleAttendance] = useMutation(UPDATE_SINGLE_ATTENDANCE, {
    onCompleted: () => {
      refetch?.();
      setStatsRefreshKey((value) => value + 1);
    },
  });

  const processedRecords = useMemo(() => {
    return validAttendances.map((attendance) => {
      const userName = getDisplayUserName(attendance.user);
      const displayDate = getDisplayDateFromRecord(attendance);

      return {
        ...attendance,
        userName,
        percentage: Number(attendance.userAttendancePercentage || 0),
        displayDate,
        _localCounts: {
          ABSENT_UNJUSTIFIED: Number(attendance.userUnjustifiedCount || 0),
          UNJUSTIFIED_WITHDRAWAL: 0,
        },
      };
    });
  }, [validAttendances]);

  const stats = useMemo(
    () => ({
      total: summary.total || 0,
      present: (summary.present || 0) + (summary.late || 0),
      absent: summary.absent || 0,
    }),
    [summary]
  );

  const paginatedRecords = processedRecords;
  const isInitialLoading = loading && validAttendances.length === 0;
  const hasNextPage = Boolean(pageInfo.hasNextPage);
  const isLoadingMore = loading && validAttendances.length > 0;

  const handleLoadMore = async () => {
    if (!hasNextPage || !pageInfo.endCursor) return;
    setPaginationError("");
    try {
      await fetchMore({
        variables: {
          limit: ATTENDANCE_FETCH_PAGE_SIZE,
          filter: { ...attendanceFilter, cursor: pageInfo.endCursor },
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const previous = previousResult?.getAttendancesRehearsalConnection;
          const next = fetchMoreResult?.getAttendancesRehearsalConnection;
          if (!previous || !next) return previousResult;

          return {
            getAttendancesRehearsalConnection: {
              ...next,
              nodes: [...previous.nodes, ...next.nodes],
            },
          };
        },
      });
    } catch (err) {
      setPaginationError(err?.message || "No se pudo cargar la siguiente página.");
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const openDetails = (userId) => {
    const normalizedUserId = getEntityId(userId);
    if (!normalizedUserId) return;
    setDetailUserId(normalizedUserId);
    setIsDetailOpen(true);
  };

  const closeDetails = () => {
    setIsDetailOpen(false);
    setDetailUserId(null);
  };

  const handleUpdateAttendance = async ({ id, status, notes }) => {
    if (!isAdmin) throw new Error("No tenés permisos para editar asistencias.");

    await updateSingleAttendance({
      variables: {
        id,
        status,
        notes: notes ?? "",
      },
    });
  };

  const selectedUserStats = useMemo(() => {
    if (!detailUserId) return null;

    const loadedRecords = validAttendances.filter(
      (record) => getEntityId(record?.user) === detailUserId
    );
    const fromPage = buildUserStatsMap(loadedRecords)[detailUserId];
    if (fromPage) return fromPage;

    const record = validAttendances.find((item) => getEntityId(item?.user) === detailUserId);
    return {
      userId: detailUserId,
      user: record?.user || null,
      total: 0,
      counts: STATUS_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
      percentage: 0,
      attendanceCreditsLocal: 0,
      hasThreeUnjustifiedLocal: false,
      exceedsLimitLocal: false,
      records: [],
    };
  }, [detailUserId, validAttendances]);

  if (error) {
    return (
      <div className="py-16 px-4 text-center">
        <p className="text-red-600 font-medium">Error al cargar el historial: {error.message}</p>
      </div>
    );
  }

  if (paginationError && validAttendances.length === 0) {
    return (
      <div className="py-16 px-4 text-center">
        <p className="text-red-600 font-medium">
          Error al cargar todo el historial: {paginationError}
        </p>
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
        }}
        totalResults={connection?.totalCount || 0}
      />

      <div className="px-0 sm:px-4 pt-4">
        <WorstAttendancePanel users={worstUsers} topN={5} />
      </div>

      <div className="px-0 sm:px-4 py-4 sm:py-2">
        <div className="bg-white rounded-none sm:rounded-lg shadow-sm border-0 sm:border border-gray-200 overflow-hidden">
          {paginationError && validAttendances.length > 0 && (
            <div className="px-4 py-3 text-sm text-amber-700 bg-amber-50 border-b border-amber-100">
              Se cargó parte del historial, pero faltan páginas por recuperar: {paginationError}
            </div>
          )}

          {isInitialLoading ? (
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
          ) : processedRecords.length === 0 ? (
            <div className="py-12 text-center text-gray-600 text-sm px-6">
              <p className="font-medium text-gray-700">No se encontraron registros</p>
              {selectedDate ? (
                <p className="mt-2 text-gray-500">No hay registros para la fecha seleccionada.</p>
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

              {(hasNextPage || processedRecords.length > 0) && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t bg-gray-50">
                  <p className="text-sm text-gray-700">
                    Mostrando {processedRecords.length} de {connection?.totalCount || 0} registros
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLoadMore}
                      disabled={!hasNextPage || isLoadingMore}
                      className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {isLoadingMore ? "Cargando..." : "Cargar más"}
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
        selectedDate={selectedDate}
        canEdit={isAdmin}
        onUpdateAttendance={handleUpdateAttendance}
        statsRefreshKey={statsRefreshKey}
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

// ============================================================================
// PROPTYPES
// ============================================================================

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sub: PropTypes.string,
  highlight: PropTypes.oneOf(["red", "orange", "green"]),
};

WorstAttendancePanel.propTypes = {
  users: PropTypes.array,
  topN: PropTypes.number,
};

AttendanceDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  canEdit: PropTypes.bool,
  onUpdateAttendance: PropTypes.func,
  statsRefreshKey: PropTypes.number,
  userStats: PropTypes.shape({
    userId: PropTypes.string,
    user: PropTypes.object,
    total: PropTypes.number,
    presentLike: PropTypes.number,
    attendanceCreditsLocal: PropTypes.number,
    equivalentAbsencesLocal: PropTypes.number,
    unjustifiedCountLocal: PropTypes.number,
    hasThreeUnjustifiedLocal: PropTypes.bool,
    exceedsLimitLocal: PropTypes.bool,
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
    _localCounts: PropTypes.object,
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
