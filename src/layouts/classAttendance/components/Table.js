import { useMutation, useQuery } from "@apollo/client";
import { MARK_ATTENDANCE_AND_PAYMENT } from "graphql/mutations";
import { GET_INSTRUCTOR_STUDENTS_ATTENDANCE } from "graphql/queries";
import { useEffect, useState, useRef, useCallback } from "react";
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
const StatusChip = ({ option, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={isActive}
    title={option.label}
    className={[
      "px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-150 whitespace-nowrap",
      "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400",
      isActive
        ? `${option.activeCls} shadow-sm scale-105`
        : "bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700",
    ].join(" ")}
  >
    {option.label}
  </button>
);

// ─────────────────────────────────────────────
// AvatarCircle — outside StudentRow to avoid remount on every render
// ─────────────────────────────────────────────
const AvatarCircle = ({ student, size = 36 }) => {
  const avatarStyle = getAvatarStyle(getFullName(student));
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs"
      style={{ width: size, height: size, background: avatarStyle.bg, color: avatarStyle.color }}
    >
      {getInitials(student)}
    </div>
  );
};

// ─────────────────────────────────────────────
// SavedBadge — outside StudentRow to avoid remount on every render
// ─────────────────────────────────────────────
const SavedBadge = ({ isSaved }) => (
  <span
    className={`inline-flex items-center gap-1 text-xs font-medium ${
      isSaved ? "text-emerald-600" : "text-amber-600"
    }`}
  >
    {isSaved ? (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ) : (
      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse inline-block" />
    )}
    {isSaved ? "Guardado" : "Sin guardar"}
  </span>
);

// ─────────────────────────────────────────────
// JustInput — outside StudentRow to avoid remount on every render
// ─────────────────────────────────────────────
const JustInput = ({ studentId, value, onChange, hasError, placeholder = "Justificación..." }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(studentId, "justification", e.target.value)}
    placeholder={placeholder}
    className={[
      "w-full px-3 py-2 text-sm border rounded-xl outline-none transition-all",
      "focus:ring-2 focus:ring-gray-800/10",
      hasError
        ? "border-red-300 bg-red-50 focus:border-red-400"
        : "border-gray-200 focus:border-gray-400",
    ].join(" ")}
  />
);

// ─────────────────────────────────────────────
// StudentRow
// ─────────────────────────────────────────────
const StudentRow = ({ student, attendance, onAttendanceChange, searchTerm }) => {
  if (!student) return null;

  const name = getFullName(student);
  const curAttendance = attendance?.attendanceStatus || "Presente";
  const curPayment = attendance?.paymentStatus || "Pendiente";
  const curJust = attendance?.justification || "";
  const isSaved = attendance?.isSaved !== false;
  const needsJust = curAttendance === "Ausencia Justificada";

  const highlight = (str) => {
    if (!searchTerm) return str;
    const rx = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return str.split(rx).map((p, i) =>
      rx.test(p) ? (
        <mark key={i} className="bg-yellow-200 font-bold rounded-sm px-0.5">
          {p}
        </mark>
      ) : (
        p
      )
    );
  };

  return (
    <div
      className={`relative border-b border-gray-100 last:border-b-0 transition-colors ${
        !isSaved ? "bg-amber-50" : "hover:bg-gray-50"
      }`}
    >
      {!isSaved && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-400 rounded-r" />}

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
            />
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
            />
          ))}
        </div>
      </div>
    </div>
  );
};

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
        style={{ animation: "toastIn 0.25s ease-out" }}
        className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-medium max-w-xs ${
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
        <button onClick={onClose} className="opacity-60 hover:opacity-100 text-lg leading-none">
          ×
        </button>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────
// Main Table Component
// ─────────────────────────────────────────────
const InstructorAttendanceTable = ({ students }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const searchRef = useRef(null);

  const { loading, error, data, refetch } = useQuery(GET_INSTRUCTOR_STUDENTS_ATTENDANCE, {
    variables: { date: selectedDate.toISOString() },
    fetchPolicy: "network-only",
  });

  const [markAttendanceAndPayment] = useMutation(MARK_ATTENDANCE_AND_PAYMENT);

  useEffect(() => {
    if (!students?.length) return;
    const init = {};
    students.forEach((s) => {
      init[s.id] = {
        attendanceStatus: "Presente",
        paymentStatus: "Pendiente",
        justification: "",
        isSaved: true,
      };
    });
    if (data?.getInstructorStudentsAttendance) {
      data.getInstructorStudentsAttendance.forEach((rec) => {
        init[rec.student.id] = {
          attendanceStatus: rec.attendanceStatus,
          paymentStatus: rec.paymentStatus,
          justification: rec.justification || "",
          isSaved: true,
        };
      });
    }
    setAttendanceData(init);
  }, [data, students]);

  useEffect(() => {
    if (selectedDate) refetch({ date: selectedDate.toISOString() });
  }, [selectedDate, refetch]);

  const filteredStudents = students.filter(
    (s) => !searchTerm || getFullName(s).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: students.length,
    present: Object.values(attendanceData).filter((r) => r?.attendanceStatus === "Presente").length,
    absent: Object.values(attendanceData).filter((r) => r?.attendanceStatus?.includes("Ausencia"))
      .length,
    paid: Object.values(attendanceData).filter((r) => r?.paymentStatus === "Pagado").length,
  };
  const unsavedCount = Object.values(attendanceData).filter((r) => !r?.isSaved).length;

  const handleChange = useCallback((studentId, field, value) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {
          attendanceStatus: "Presente",
          paymentStatus: "Pendiente",
          justification: "",
        }),
        [field]: value,
        isSaved: false,
      },
    }));
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    let ok = 0,
      fail = 0;
    const unsaved = Object.entries(attendanceData).filter(([, d]) => !d?.isSaved);
    for (const [studentId, d] of unsaved) {
      try {
        await markAttendanceAndPayment({
          variables: {
            input: {
              studentId,
              attendanceStatus: d.attendanceStatus || "Presente",
              paymentStatus: d.paymentStatus || "Pendiente",
              justification: d.justification || "",
              date: selectedDate.toISOString(),
            },
          },
        });
        setAttendanceData((prev) => ({
          ...prev,
          [studentId]: { ...prev[studentId], isSaved: true },
        }));
        ok++;
      } catch (e) {
        console.error(e);
        fail++;
      }
    }
    setIsSaving(false);
    if (fail === 0) {
      setToast({
        message: `${ok} registro${ok !== 1 ? "s" : ""} guardado${ok !== 1 ? "s" : ""} ✓`,
        type: "success",
      });
      await refetch();
    } else {
      setToast({ message: `${ok} guardados, ${fail} con error`, type: "error" });
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
            onChange={setSelectedDate}
            dateFormat="dd/MM/yyyy"
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none cursor-pointer font-medium text-gray-700 bg-white"
          />
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="flex flex-wrap items-center gap-2 px-5 sm:px-6 py-3 bg-gray-50 border-b border-gray-100">
        {[
          { label: "Total", value: stats.total, color: "text-gray-700" },
          { label: "Presentes", value: stats.present, color: "text-emerald-600" },
          { label: "Ausentes", value: stats.absent, color: "text-amber-600" },
          { label: "Pagados", value: stats.paid, color: "text-blue-600" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200"
          >
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
          className="flex-1 text-sm outline-none placeholder-gray-400 text-gray-700 bg-transparent"
        />
        {searchTerm && (
          <>
            <button
              onClick={() => setSearchTerm("")}
              className="text-gray-400 hover:text-gray-600 text-base w-5 h-5 flex items-center justify-center"
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
              onClick={() => refetch()}
              className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
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
              attendance={
                attendanceData[student.id] || {
                  attendanceStatus: "Presente",
                  paymentStatus: "Pendiente",
                  justification: "",
                  isSaved: true,
                }
              }
              onAttendanceChange={handleChange}
              searchTerm={searchTerm}
            />
          ))
        )}
      </div>

      {/* ── Save bar ── */}
      {unsavedCount > 0 && (
        <div className="sticky bottom-0 flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            {unsavedCount} estudiante{unsavedCount !== 1 ? "s" : ""} sin guardar
          </div>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default InstructorAttendanceTable;

// ─── PropTypes ───────────────────────────────
InstructorAttendanceTable.propTypes = {
  students: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      firstSurName: PropTypes.string.isRequired,
    })
  ).isRequired,
};
StudentRow.propTypes = {
  student: PropTypes.object.isRequired,
  attendance: PropTypes.object,
  onAttendanceChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
};
AvatarCircle.propTypes = {
  student: PropTypes.object.isRequired,
  size: PropTypes.number,
};
SavedBadge.propTypes = {
  isSaved: PropTypes.bool.isRequired,
};
JustInput.propTypes = {
  studentId: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  hasError: PropTypes.bool,
  placeholder: PropTypes.string,
};
StatusChip.propTypes = {
  option: PropTypes.object.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};
Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
