import { useMutation, useQuery } from "@apollo/client";
import { MARK_ATTENDANCE_AND_PAYMENT } from "graphql/mutations";
import { GET_INSTRUCTOR_STUDENTS_ATTENDANCE } from "graphql/queries";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const ATTENDANCE_OPTIONS = [
  {
    value: "Presente",
    label: "Presente",
    short: "P",
    activeCls: "bg-emerald-500 border-emerald-500 text-white",
  },
  {
    value: "Ausencia Justificada",
    label: "Aus. Justificada",
    short: "AJ",
    activeCls: "bg-amber-500 border-amber-500 text-white",
  },
  {
    value: "Ausencia No Justificada",
    label: "Aus. No Justificada",
    short: "ANJ",
    activeCls: "bg-red-500 border-red-500 text-white",
  },
];

const PAYMENT_OPTIONS = [
  {
    value: "Pendiente",
    label: "Pendiente",
    short: "Pend",
    activeCls: "bg-slate-500 border-slate-500 text-white",
  },
  {
    value: "Pagado",
    label: "Pagado",
    short: "Pag",
    activeCls: "bg-blue-500 border-blue-500 text-white",
  },
  {
    value: "Becado",
    label: "Becado",
    short: "Bec",
    activeCls: "bg-violet-500 border-violet-500 text-white",
  },
];

// ─────────────────────────────────────────────
// Avatar colors — use inline style to avoid Tailwind purge
// ─────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: "#1e293b", color: "#fca5a5" },
  { bg: "#1e3a5f", color: "#93c5fd" },
  { bg: "#312e81", color: "#c4b5fd" },
  { bg: "#064e3b", color: "#6ee7b7" },
  { bg: "#4c0519", color: "#fda4af" },
  { bg: "#2e1065", color: "#fde047" },
  { bg: "#451a03", color: "#fcd34d" },
];
const getAvatarStyle = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const safeStr = (v) => (typeof v === "string" ? v : "");
const getFullName = (u) =>
  [safeStr(u?.name), safeStr(u?.firstSurName), safeStr(u?.secondSurName)]
    .filter(Boolean)
    .join(" ")
    .trim() || "Sin nombre";
const getInitials = (u) =>
  (safeStr(u?.name).charAt(0) + safeStr(u?.firstSurName).charAt(0)).toUpperCase() || "?";

// ─────────────────────────────────────────────
// StatusChip — no dynamic class construction
// ─────────────────────────────────────────────
const StatusChip = ({ option, isActive, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={isActive}
    disabled={disabled}
    title={option.label}
    className={[
      "min-h-11 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors duration-150 whitespace-nowrap",
      "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 disabled:cursor-wait disabled:opacity-60",
      isActive
        ? `${option.activeCls} shadow-sm`
        : "bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700",
    ].join(" ")}
  >
    {option.label}
  </button>
);

const EMPTY_ATTENDANCE = Object.freeze({
  attendanceStatus: "",
  paymentStatus: "",
  justification: "",
  isSaved: null,
});

// ─────────────────────────────────────────────
// AvatarCircle — outside StudentRow to avoid remount on every render
// ─────────────────────────────────────────────
const AvatarCircle = memo(({ student, size = 36 }) => {
  const avatarStyle = getAvatarStyle(getFullName(student));
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs"
      style={{ width: size, height: size, background: avatarStyle.bg, color: avatarStyle.color }}
    >
      {getInitials(student)}
    </div>
  );
});

// ─────────────────────────────────────────────
// SavedBadge — outside StudentRow to avoid remount on every render
// ─────────────────────────────────────────────
const SavedBadge = memo(({ isSaved }) => (
  <span
    className={`inline-flex items-center gap-1 text-xs font-medium ${
      isSaved === true ? "text-emerald-700" : isSaved === false ? "text-amber-700" : "text-gray-500"
    }`}
  >
    {isSaved === true ? (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ) : isSaved === false ? (
      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse inline-block" />
    ) : (
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />
    )}
    {isSaved === true ? "Guardado" : isSaved === false ? "Sin guardar" : "Sin registro"}
  </span>
));

// ─────────────────────────────────────────────
// JustInput — outside StudentRow to avoid remount on every render
// ─────────────────────────────────────────────
const JustInput = memo(
  ({ studentId, value, onChange, hasError, disabled, placeholder = "Justificación..." }) => (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(studentId, "justification", e.target.value)}
      placeholder={placeholder}
      aria-label="Justificación de la ausencia"
      aria-invalid={hasError}
      aria-describedby={hasError ? `justification-error-${studentId}` : undefined}
      disabled={disabled}
      className={[
        "w-full px-3 py-2 text-sm border rounded-xl outline-none transition-all",
        "focus:ring-2 focus:ring-gray-800/10",
        hasError
          ? "border-red-300 bg-red-50 focus:border-red-400"
          : "border-gray-200 focus:border-gray-400",
      ].join(" ")}
    />
  )
);

// ─────────────────────────────────────────────
// StudentRow
// ─────────────────────────────────────────────
const StudentRow = memo(({ student, attendance, onAttendanceChange, searchTerm, disabled }) => {
  if (!student) return null;

  const name = getFullName(student);
  const curAttendance = attendance?.attendanceStatus || "";
  const curPayment = attendance?.paymentStatus || "";
  const curJust = attendance?.justification || "";
  const isSaved = attendance?.isSaved;
  const needsJust = curAttendance === "Ausencia Justificada";

  const highlight = (str) => {
    if (!searchTerm) return str;
    const rx = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = [];
    let match = rx.exec(str);
    while (match) {
      matches.push(match);
      match = rx.exec(str);
    }
    if (!matches.length) return str;
    const parts = [];
    let cursor = 0;
    matches.forEach((match) => {
      if (match.index > cursor) parts.push(str.slice(cursor, match.index));
      parts.push(
        <mark key={match.index} className="bg-yellow-200 font-bold rounded-sm px-0.5">
          {match[0]}
        </mark>
      );
      cursor = match.index + match[0].length;
    });
    if (cursor < str.length) parts.push(str.slice(cursor));
    return parts;
  };

  return (
    <div
      className={`relative border-b border-gray-100 last:border-b-0 transition-colors ${
        isSaved === false ? "bg-amber-50" : "hover:bg-gray-50"
      }`}
    >
      {/* ─── MOBILE (< 768px) ─── */}
      <div className="md:hidden px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <AvatarCircle student={student} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{highlight(name)}</p>
            {student.instrument && <p className="text-xs text-gray-400">{student.instrument}</p>}
          </div>
          <SavedBadge isSaved={isSaved} />
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
            Asistencia
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ATTENDANCE_OPTIONS.map((opt) => (
              <StatusChip
                key={opt.value}
                option={opt}
                isActive={curAttendance === opt.value}
                onClick={() => onAttendanceChange(student.id, "attendanceStatus", opt.value)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>

        {needsJust && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              Justificación
            </p>
            <JustInput
              studentId={student.id}
              value={curJust}
              onChange={onAttendanceChange}
              hasError={needsJust && !curJust}
              placeholder="Describe el motivo..."
              disabled={disabled}
            />
            {needsJust && !curJust.trim() && (
              <p id={`justification-error-${student.id}`} className="mt-1 text-xs text-red-600">
                Escribe una justificación antes de guardar.
              </p>
            )}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
            Estado de Pago
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PAYMENT_OPTIONS.map((opt) => (
              <StatusChip
                key={opt.value}
                option={opt}
                isActive={curPayment === opt.value}
                onClick={() => onAttendanceChange(student.id, "paymentStatus", opt.value)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── TABLET / DESKTOP (>= 768px) ─── */}
      <div className="hidden md:flex md:flex-row md:items-center md:gap-4 px-5 py-3">
        {/* Student — fixed width */}
        <div className="flex items-center gap-2.5 min-w-0" style={{ width: 200, flexShrink: 0 }}>
          <AvatarCircle student={student} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800 truncate">{highlight(name)}</p>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              {student.instrument && (
                <span className="text-xs text-gray-400">{student.instrument}</span>
              )}
              <SavedBadge isSaved={isSaved} />
            </div>
          </div>
        </div>

        {/* Attendance — flex grow */}
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {ATTENDANCE_OPTIONS.map((opt) => (
            <StatusChip
              key={opt.value}
              option={opt}
              isActive={curAttendance === opt.value}
              onClick={() => onAttendanceChange(student.id, "attendanceStatus", opt.value)}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Justification — fixed width */}
        <div style={{ width: 180, flexShrink: 0 }}>
          {needsJust && (
            <JustInput
              studentId={student.id}
              value={curJust}
              onChange={onAttendanceChange}
              hasError={needsJust && !curJust}
              disabled={disabled}
            />
          )}
        </div>

        {/* Payment — flex grow */}
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {PAYMENT_OPTIONS.map((opt) => (
            <StatusChip
              key={opt.value}
              option={opt}
              isActive={curPayment === opt.value}
              onClick={() => onAttendanceChange(student.id, "paymentStatus", opt.value)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <>
      <style>{`@keyframes toastIn{from{transform:translateX(16px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <div
        role={type === "error" ? "alert" : "status"}
        aria-live={type === "error" ? "assertive" : "polite"}
        aria-atomic="true"
        style={{ animation: "toastIn 0.25s ease-out" }}
        className={`fixed top-5 right-5 z-[1350] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-medium max-w-xs ${
          type === "success" ? "bg-gray-900" : "bg-red-600"
        }`}
      >
        {type === "success" ? (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
          </svg>
        )}
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificación"
          className="min-h-11 min-w-11 opacity-80 hover:opacity-100 text-lg leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          ×
        </button>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────
// Main Table Component
// ─────────────────────────────────────────────
const InstructorAttendanceTable = ({ students, onDirtyChange }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const searchRef = useRef(null);
  const validDate =
    selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime()) ? selectedDate : null;
  const selectedDateIso = validDate?.toISOString();

  const { loading, error, data, refetch } = useQuery(GET_INSTRUCTOR_STUDENTS_ATTENDANCE, {
    variables: { date: selectedDateIso },
    skip: !selectedDateIso,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const [markAttendanceAndPayment] = useMutation(MARK_ATTENDANCE_AND_PAYMENT);

  useEffect(() => {
    if (!students?.length || loading || !data) return;
    const records = Array.isArray(data?.getInstructorStudentsAttendance)
      ? data.getInstructorStudentsAttendance.filter((record) => record?.student?.id)
      : [];
    const recordsByStudent = new Map(records.map((record) => [String(record.student.id), record]));

    setAttendanceData((previous) => {
      const next = {};
      students.forEach((student) => {
        if (!student?.id) return;
        const id = String(student.id);
        const draft = previous[id];
        const record = recordsByStudent.get(id);

        if (draft?.isSaved === false) {
          next[id] = draft;
        } else if (record) {
          next[id] = {
            attendanceStatus: record.attendanceStatus || "Presente",
            paymentStatus: record.paymentStatus || "Pendiente",
            justification: record.justification || "",
            isSaved: true,
            recordExists: true,
          };
        } else {
          next[id] = {
            attendanceStatus: "",
            paymentStatus: "",
            justification: "",
            isSaved: null,
            recordExists: false,
          };
        }
      });
      return next;
    });
  }, [data, loading, students]);

  useEffect(() => {
    const preventAccidentalExit = (event) => {
      if (!Object.values(attendanceData).some((record) => record?.isSaved === false)) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventAccidentalExit);
    return () => window.removeEventListener("beforeunload", preventAccidentalExit);
  }, [attendanceData]);

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          student?.id &&
          (!searchTerm ||
            getFullName(student)
              .toLocaleLowerCase("es")
              .includes(searchTerm.trim().toLocaleLowerCase("es")))
      ),
    [searchTerm, students]
  );

  const stats = useMemo(() => {
    const records = Object.values(attendanceData);
    return {
      total: students.length,
      present: records.filter((record) => record?.attendanceStatus === "Presente").length,
      absent: records.filter((record) => record?.attendanceStatus?.includes("Ausencia")).length,
      paid: records.filter((record) => record?.paymentStatus === "Pagado").length,
    };
  }, [attendanceData, students.length]);
  const unsavedCount = useMemo(
    () => Object.values(attendanceData).filter((record) => record?.isSaved === false).length,
    [attendanceData]
  );

  const closeToast = useCallback(() => setToast(null), []);

  const handleDateChange = useCallback(
    (nextDate) => {
      if (isSaving) return;
      if (!(nextDate instanceof Date) || Number.isNaN(nextDate.getTime())) {
        setToast({ message: "Selecciona una fecha válida.", type: "error" });
        return;
      }
      if (
        unsavedCount > 0 &&
        !window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos y cambiar de fecha?")
      ) {
        return;
      }
      setAttendanceData({});
      onDirtyChange(false);
      setSelectedDate(nextDate);
    },
    [isSaving, onDirtyChange, unsavedCount]
  );

  const handleChange = useCallback(
    (studentId, field, value) => {
      onDirtyChange(true);
      setAttendanceData((prev) => {
        const current = prev[studentId] || {};
        return {
          ...prev,
          [studentId]: {
            ...current,
            attendanceStatus: current.attendanceStatus || "Presente",
            paymentStatus: current.paymentStatus || "Pendiente",
            justification: current.justification || "",
            [field]: value,
            isSaved: false,
          },
        };
      });
    },
    [onDirtyChange]
  );

  const handleSaveAll = async () => {
    if (!selectedDateIso || isSaving) return;
    const unsaved = Object.entries(attendanceData).filter(
      ([, record]) => record?.isSaved === false
    );
    const invalid = unsaved.filter(
      ([, record]) =>
        record.attendanceStatus === "Ausencia Justificada" && !record.justification?.trim()
    );
    if (invalid.length) {
      setToast({
        message: `Falta justificar ${invalid.length} ausencia${invalid.length === 1 ? "" : "s"}.`,
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      const results = await Promise.allSettled(
        unsaved.map(([studentId, record]) =>
          markAttendanceAndPayment({
            variables: {
              input: {
                studentId,
                attendanceStatus: record.attendanceStatus || "Presente",
                paymentStatus: record.paymentStatus || "Pendiente",
                justification: record.justification?.trim() || "",
                date: selectedDateIso,
              },
            },
          })
        )
      );
      const savedIds = unsaved.reduce((ids, [studentId], index) => {
        if (results[index].status === "fulfilled") ids.push(studentId);
        return ids;
      }, []);
      const failed = results.length - savedIds.length;

      setAttendanceData((previous) => {
        const next = { ...previous };
        savedIds.forEach((studentId) => {
          if (next[studentId])
            next[studentId] = { ...next[studentId], isSaved: true, recordExists: true };
        });
        return next;
      });

      setToast({
        message: failed
          ? `${savedIds.length} guardados; ${failed} requieren reintento.`
          : `${savedIds.length} registro${savedIds.length === 1 ? "" : "s"} guardado${
              savedIds.length === 1 ? "" : "s"
            } correctamente.`,
        type: failed ? "error" : "success",
      });
      onDirtyChange(failed > 0);
      if (!failed) await refetch();
    } finally {
      setIsSaving(false);
    }
  };

  if (!students?.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-gray-400 px-4">
        <svg
          width="52"
          height="52"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          className="opacity-30"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <p className="text-sm font-semibold text-gray-500">Sin estudiantes asignados</p>
        <span className="text-xs">Asígnalos desde el panel superior</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 sm:px-6 py-5 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">
            Registro de asistencia
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Marca asistencia y estado de pago por fecha
          </p>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="dd/MM/yyyy"
            aria-label="Fecha de asistencia"
            calendarStartDay={1}
            disabled={isSaving}
            className="min-h-11 w-32 px-3 py-2 border border-gray-300 rounded-lg text-base sm:text-sm outline-none cursor-pointer font-medium text-gray-700 bg-white focus:ring-2 focus:ring-gray-700 focus:ring-offset-1"
          />
        </div>
      </div>

      {/* ── Stats ── */}
      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 sm:px-6 py-3 bg-gray-50 border-b border-gray-100"
        aria-label="Resumen de asistencia"
      >
        {[
          { label: "Total", value: stats.total, color: "text-gray-700" },
          { label: "Presentes", value: stats.present, color: "text-emerald-600" },
          { label: "Ausentes", value: stats.absent, color: "text-amber-600" },
          { label: "Pagados", value: stats.paid, color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="flex items-baseline gap-1.5">
            <span className={`text-base font-bold ${s.color}`}>{s.value}</span>
            <span className="text-xs text-gray-400 font-medium">{s.label}</span>
          </div>
        ))}
        {unsavedCount > 0 && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-amber-700">{unsavedCount} sin guardar</span>
          </div>
        )}
      </div>

      {/* ── Search ── */}
      <div className="flex items-center gap-2.5 px-5 sm:px-6 py-3 border-b border-gray-100 bg-white">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-400 flex-shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={searchRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar estudiante..."
          aria-label="Buscar en estudiantes asignados"
          className="min-h-11 flex-1 text-base sm:text-sm outline-none placeholder-gray-500 text-gray-700 bg-transparent"
        />
        {searchTerm && (
          <>
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Limpiar búsqueda"
              className="text-gray-500 hover:text-gray-700 text-xl min-w-11 min-h-11 flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-600"
            >
              ×
            </button>
            <span className="text-xs text-gray-400">
              {filteredStudents.length} resultado{filteredStudents.length !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>

      {/* ── Column headers — tablet/desktop only ── */}
      <div className="hidden md:flex md:flex-row md:gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
        <div style={{ width: 200, flexShrink: 0 }}>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Estudiante
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Asistencia
          </span>
        </div>
        <div style={{ width: 180, flexShrink: 0 }}>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Justificación
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Estado de Pago
          </span>
        </div>
      </div>

      {/* ── Rows ── */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-14">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Cargando registros...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-14 px-4 text-center">
            <p className="text-sm text-red-500">{error.message}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="min-h-11 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-600"
            >
              Reintentar
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Sin resultados para &ldquo;{searchTerm}&rdquo;
          </div>
        ) : (
          filteredStudents.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              attendance={attendanceData[student.id] || EMPTY_ATTENDANCE}
              onAttendanceChange={handleChange}
              searchTerm={searchTerm}
              disabled={isSaving}
            />
          ))
        )}
      </div>

      {/* ── Save bar ── */}
      {unsavedCount > 0 && (
        <div className="sticky bottom-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] bg-white border-t border-gray-200 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            {unsavedCount} estudiante{unsavedCount !== 1 ? "s" : ""} sin guardar
          </div>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="min-h-11 w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Guardar cambios
              </>
            )}
          </button>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>
  );
};

export default InstructorAttendanceTable;

// ─── PropTypes ───────────────────────────────
InstructorAttendanceTable.propTypes = {
  students: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      firstSurName: PropTypes.string.isRequired,
    })
  ).isRequired,
  onDirtyChange: PropTypes.func,
};
InstructorAttendanceTable.defaultProps = { onDirtyChange: () => {} };
StudentRow.propTypes = {
  student: PropTypes.object.isRequired,
  attendance: PropTypes.object,
  onAttendanceChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  disabled: PropTypes.bool,
};
AvatarCircle.propTypes = {
  student: PropTypes.object.isRequired,
  size: PropTypes.number,
};
SavedBadge.propTypes = {
  isSaved: PropTypes.bool,
};
JustInput.propTypes = {
  studentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  hasError: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
};
StatusChip.propTypes = {
  option: PropTypes.object.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
