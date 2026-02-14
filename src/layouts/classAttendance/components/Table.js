import { useMutation, useQuery } from "@apollo/client";
import { MARK_ATTENDANCE_AND_PAYMENT } from "graphql/mutations";
import { GET_INSTRUCTOR_STUDENTS_ATTENDANCE } from "graphql/queries";
import { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// ============================================================================
// CONSTANTS & UTILS
// ============================================================================

const ATTENDANCE_STATUS = {
  PRESENT: { value: "Presente", label: "Presente", shortLabel: "P", color: "bg-emerald-500" },
  JUSTIFIED_ABSENCE: {
    value: "Ausencia Justificada",
    label: "Ausencia Justificada",
    shortLabel: "AJ",
    color: "bg-amber-500",
  },
  UNJUSTIFIED_ABSENCE: {
    value: "Ausencia No Justificada",
    label: "Ausencia No Justificada",
    shortLabel: "AI",
    color: "bg-orange-600",
  },
};

const PAYMENT_STATUS = {
  PENDING: { value: "Pendiente", label: "Pendiente", shortLabel: "Pend", color: "bg-gray-400" },
  PAID: { value: "Pagado", label: "Pagado", shortLabel: "Pag", color: "bg-green-500" },
  SCHOLARSHIP: { value: "Becado", label: "Becado", shortLabel: "Bec", color: "bg-blue-500" },
};

const ATTENDANCE_OPTIONS = Object.values(ATTENDANCE_STATUS);
const PAYMENT_OPTIONS = Object.values(PAYMENT_STATUS);

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

const StatusButton = ({
  status,
  isActive,
  onClick,
  compact = false,
  statusType = "attendance",
}) => {
  const statusList = statusType === "attendance" ? ATTENDANCE_OPTIONS : PAYMENT_OPTIONS;
  const statusConfig = statusList.find((s) => s.value === status);

  if (!statusConfig) return null;

  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={`Marcar como ${statusConfig.label}`}
      className={`
        ${compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"}
        font-medium rounded-lg transition-all duration-200 whitespace-nowrap
        ${
          isActive
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

const safeStr = (v) => (typeof v === "string" ? v : "");
const initial = (v) => safeStr(v).trim().charAt(0).toUpperCase() || "?";

const StudentRow = ({ student, attendance, onAttendanceChange, searchTerm }) => {
  if (!student) return null;

  // const studentId = student.id ?? student._id;
  const name = safeStr(student.name);
  const first = safeStr(student.firstSurName);
  const second = safeStr(student.secondSurName);

  const fullName = [name, first, second].filter(Boolean).join(" ").trim() || "Sin nombre";

  const currentAttendance = attendance?.attendanceStatus || "Presente";
  const currentPayment = attendance?.paymentStatus || "Pendiente";
  const currentJustification = attendance?.justification || "";
  const isSaved = attendance?.isSaved !== false; // Default true si no existe

  const needsJustification = currentAttendance === "Ausencia Justificada";

  const highlightText = (text) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(regex, '<mark class="bg-yellow-200 font-semibold">$1</mark>');
  };

  return (
    <div className="group border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Mobile Layout */}

      <div className="block lg:hidden px-4 py-4 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {initial(name)}
            {initial(first)}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold text-gray-900 truncate"
              dangerouslySetInnerHTML={{ __html: highlightText(fullName) }}
            />
            {isSaved ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-0.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Guardado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Sin guardar
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Asistencia</p>
          <div className="grid grid-cols-3 gap-2">
            {ATTENDANCE_OPTIONS.map((status) => (
              <StatusButton
                key={status.value}
                status={status.value}
                isActive={currentAttendance === status.value}
                onClick={() => onAttendanceChange(student.id, "attendanceStatus", status.value)}
                compact
                statusType="attendance"
              />
            ))}
          </div>
        </div>

        {needsJustification && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Justificación</label>
            <input
              type="text"
              value={currentJustification}
              onChange={(e) => onAttendanceChange(student.id, "justification", e.target.value)}
              placeholder="Escribe la justificación..."
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                needsJustification && !currentJustification
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
            />
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Estado de Pago</p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_OPTIONS.map((status) => (
              <StatusButton
                key={status.value}
                status={status.value}
                isActive={currentPayment === status.value}
                onClick={() => onAttendanceChange(student.id, "paymentStatus", status.value)}
                compact
                statusType="payment"
              />
            ))}
          </div>
        </div>
      </div>
      {/* Desktop Layout */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 items-center">
        {" "}
        {/* Student Info - 3 cols */}
        <div className="col-span-3 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {initial(name)}
            {initial(first)}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold text-gray-900 truncate"
              dangerouslySetInnerHTML={{ __html: highlightText(fullName) }}
            />
            {isSaved ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Guardado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Sin guardar
              </span>
            )}
          </div>
        </div>
        {/* Attendance - 4 cols */}
        <div className="col-span-4 flex gap-2">
          {ATTENDANCE_OPTIONS.map((status) => (
            <StatusButton
              key={status.value}
              status={status.value}
              isActive={currentAttendance === status.value}
              onClick={() => onAttendanceChange(student.id, "attendanceStatus", status.value)}
              statusType="attendance"
            />
          ))}
        </div>
        {/* Justification - 2 cols */}
        <div className="col-span-2">
          {needsJustification && (
            <input
              type="text"
              value={currentJustification}
              onChange={(e) => onAttendanceChange(student.id, "justification", e.target.value)}
              placeholder="Justificación..."
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                needsJustification && !currentJustification
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
            />
          )}
        </div>
        {/* Payment - 3 cols */}
        <div className="col-span-3 flex gap-2">
          {PAYMENT_OPTIONS.map((status) => (
            <StatusButton
              key={status.value}
              status={status.value}
              isActive={currentPayment === status.value}
              onClick={() => onAttendanceChange(student.id, "paymentStatus", status.value)}
              statusType="payment"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const AttendanceHeader = ({ stats, selectedDate, onDateChange, hasUnsavedChanges }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Asistencia de mis estudiantes
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Registra la asistencia y estado de pago por fecha
          </p>
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Cambios sin guardar
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Fecha:</label>
          <DatePicker
            selected={selectedDate}
            onChange={onDateChange}
            dateFormat="dd/MM/yyyy"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-medium text-gray-600">Total:</span>
          <span className="text-base sm:text-lg font-bold text-gray-900">{stats.total}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-50 rounded-lg">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-xs font-medium text-emerald-700">Presentes:</span>
          <span className="text-base sm:text-lg font-bold text-emerald-900">{stats.present}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-50 rounded-lg">
          <div className="w-2 h-2 bg-amber-500 rounded-full" />
          <span className="text-xs font-medium text-amber-700">Ausencias:</span>
          <span className="text-base sm:text-lg font-bold text-amber-900">{stats.absent}</span>
        </div>
      </div>

      {/* Desktop Column Headers */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 uppercase tracking-wide">
        <div className="col-span-3">Estudiante</div>
        <div className="col-span-4">Asistencia</div>
        <div className="col-span-2">Justificación</div>
        <div className="col-span-3">Estado de Pago</div>
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
          placeholder="Buscar estudiante..."
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
        </p>
      )}
    </div>
  );
};

const ActionBar = ({ onSaveAll, isSaving, hasUnsavedChanges, unsavedCount }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 shadow-lg z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        <div className="text-sm text-gray-600">
          {hasUnsavedChanges && (
            <span className="font-medium text-amber-600">
              {unsavedCount} estudiante{unsavedCount !== 1 ? "s" : ""} sin guardar
            </span>
          )}
        </div>

        <button
          onClick={onSaveAll}
          disabled={isSaving || !hasUnsavedChanges}
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="hidden sm:inline">Guardando...</span>
            </>
          ) : (
            "Guardar todos los cambios"
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
    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
      No tienes estudiantes asignados
    </h3>
    <p className="text-xs sm:text-sm text-gray-500">Asigna estudiantes desde la página principal</p>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const InstructorAttendanceTable = ({ students }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // GraphQL
  const { loading, error, data, refetch } = useQuery(GET_INSTRUCTOR_STUDENTS_ATTENDANCE, {
    variables: { date: selectedDate.toISOString() },
  });

  const [markAttendanceAndPayment] = useMutation(MARK_ATTENDANCE_AND_PAYMENT, {
    onError: (error) => {
      console.error("Error al guardar:", error);
      setToast({ message: "Error al guardar asistencia", type: "error" });
    },
  });

  // Initialize attendance data - CRITICAL FIX: Initialize for ALL students
  useEffect(() => {
    if (students && students.length > 0) {
      const initialData = {};

      // First, initialize all students with defaults
      students.forEach((student) => {
        initialData[student.id] = {
          attendanceStatus: "Presente",
          paymentStatus: "Pendiente",
          justification: "",
          isSaved: true,
        };
      });

      // Then, override with actual data if it exists
      if (data?.getInstructorStudentsAttendance) {
        data.getInstructorStudentsAttendance.forEach((record) => {
          initialData[record.student.id] = {
            attendanceStatus: record.attendanceStatus,
            paymentStatus: record.paymentStatus,
            justification: record.justification || "",
            isSaved: true,
          };
        });
      }

      setAttendanceData(initialData);
    }
  }, [data, students]);

  // Refetch when date changes
  useEffect(() => {
    if (selectedDate) {
      refetch({ date: selectedDate.toISOString() });
    }
  }, [selectedDate, refetch]);

  // Filter students by search
  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true;
    const fullName =
      `${student.name} ${student.firstSurName} ${student.secondSurName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search);
  });

  // Calculate stats - FIXED: Check students array directly
  const stats = {
    total: students.length,
    present:
      Object.values(attendanceData).filter((r) => r?.attendanceStatus === "Presente").length || 0,
    absent:
      Object.values(attendanceData).filter((r) => r?.attendanceStatus?.includes("Ausencia"))
        .length || 0,
  };

  const unsavedCount = Object.values(attendanceData).filter((r) => r?.isSaved === false).length;
  const hasUnsavedChanges = unsavedCount > 0;

  // Handlers
  const handleAttendanceChange = (studentId, field, value) => {
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
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    const unsavedStudents = Object.entries(attendanceData).filter(
      ([_, data]) => data?.isSaved === false
    );

    for (const [studentId, studentData] of unsavedStudents) {
      const attendanceStatus = studentData.attendanceStatus || "Presente";
      const paymentStatus = studentData.paymentStatus || "Pendiente";
      const justification = studentData.justification || "";

      try {
        await markAttendanceAndPayment({
          variables: {
            input: {
              studentId,
              attendanceStatus,
              justification,
              paymentStatus,
              date: selectedDate.toISOString(),
            },
          },
        });

        setAttendanceData((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            isSaved: true,
          },
        }));

        successCount++;
      } catch (error) {
        console.error(`Error al guardar estudiante ${studentId}:`, error);
        errorCount++;
      }
    }

    setIsSaving(false);

    if (errorCount === 0) {
      setToast({ message: `¡${successCount} registros guardados correctamente!`, type: "success" });
      await refetch();
    } else {
      setToast({
        message: `${successCount} guardados, ${errorCount} errores`,
        type: "error",
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 bg-gray-50">
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600 font-medium text-sm sm:text-base">Cargando asistencia...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-16 px-4 text-center">
        <p className="text-red-600 font-medium">Error al cargar la asistencia: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Empty state
  if (!students || students.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-24">
      <AttendanceHeader
        stats={stats}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalResults={filteredStudents.length}
      />

      <div className="px-0 sm:px-4 py-4 sm:py-6">
        <div className="bg-white rounded-none sm:rounded-lg shadow-sm border-0 sm:border border-gray-200 overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No se encontraron resultados para &quot;{searchTerm}&quot;
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredStudents.map((student) => {
                const attendance = attendanceData[student.id] || {
                  attendanceStatus: "Presente",
                  paymentStatus: "Pendiente",
                  justification: "",
                  isSaved: true,
                };
                return (
                  <StudentRow
                    key={student.id}
                    student={student}
                    attendance={attendance}
                    onAttendanceChange={handleAttendanceChange}
                    searchTerm={searchTerm}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ActionBar
        onSaveAll={handleSaveAll}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        unsavedCount={unsavedCount}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        mark {
          background-color: #fef08a;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default InstructorAttendanceTable;

// =========================
// PROPTYPES
// =========================

StatusButton.propTypes = {
  status: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  compact: PropTypes.bool,
  statusType: PropTypes.oneOf(["attendance", "payment"]),
};

StudentRow.propTypes = {
  student: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    firstSurName: PropTypes.string.isRequired,
    secondSurName: PropTypes.string.isRequired,
  }).isRequired,
  attendance: PropTypes.shape({
    attendanceStatus: PropTypes.string,
    paymentStatus: PropTypes.string,
    justification: PropTypes.string,
    isSaved: PropTypes.bool,
  }),
  onAttendanceChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
};

AttendanceHeader.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    present: PropTypes.number.isRequired,
    absent: PropTypes.number.isRequired,
  }).isRequired,
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  onDateChange: PropTypes.func.isRequired,
  hasUnsavedChanges: PropTypes.bool.isRequired,
};

SearchAndFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  totalResults: PropTypes.number.isRequired,
};

ActionBar.propTypes = {
  onSaveAll: PropTypes.func.isRequired,
  isSaving: PropTypes.bool.isRequired,
  hasUnsavedChanges: PropTypes.bool.isRequired,
  unsavedCount: PropTypes.number.isRequired,
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error", "info"]),
  onClose: PropTypes.func.isRequired,
};

InstructorAttendanceTable.propTypes = {
  students: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      firstSurName: PropTypes.string.isRequired,
      secondSurName: PropTypes.string.isRequired,
    })
  ).isRequired,
};
