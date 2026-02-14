import { useMutation, useQuery } from "@apollo/client";
import { NEW_PERFORMANCE_ATTENDANCE, UPDATE_PERFORMANCE_ATTENDANCE } from "graphql/mutations";
import {
  GET_PERFORMANCE_ATTENDANCE,
  GET_HOTELS,
  GET_USERS_BY_ID,
  GET_USERS,
  GET_EVENTS,
} from "graphql/queries";
import { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";

// ============================================================================
// CONSTANTS & UTILS
// ============================================================================

const ATTENDANCE_STATUS = {
  PRESENT: { value: "Presente", label: "Presente", shortLabel: "P", color: "bg-emerald-500" },
  ABSENT: { value: "Ausente", label: "Ausente", shortLabel: "A", color: "bg-red-500" },
};

const ATTENDANCE_OPTIONS = Object.values(ATTENDANCE_STATUS);

const BUS_OPTIONS = [
  { value: 1, label: "Bus 1" },
  { value: 2, label: "Bus 2" },
  { value: 3, label: "Bus 3" },
  { value: 4, label: "Bus 4" },
  { value: 5, label: "Bus 5" },
];

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

const StatusButton = ({ status, isActive, onClick, compact = false }) => {
  const statusConfig = ATTENDANCE_OPTIONS.find((s) => s.value === status);

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

const StudentRow = ({ user, attendance, onAttendanceChange, searchTerm, hotels, isAdmin }) => {
  const fullName = `${user.name} ${user.firstSurName} ${user.secondSurName}`;

  const currentAttendance = attendance?.attended || "Presente";
  const currentBus = attendance?.busNumber || "";
  const currentHotel = attendance?.hotel || "";
  const isSaved = attendance?.isSaved !== false;

  const isAbsent = currentAttendance === "Ausente";

  const highlightText = (text) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(regex, '<mark class="bg-yellow-200 font-semibold">$1</mark>');
  };

  return (
    <div className="group border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Mobile Layout */}
      <div className="lg:hidden px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {user.name[0]}
            {user.firstSurName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold text-gray-900 truncate"
              dangerouslySetInnerHTML={{ __html: highlightText(fullName) }}
            />
            <p className="text-xs text-gray-500 mt-0.5">{user.instrument}</p>
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

        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Asistencia</p>
          <div className="flex gap-2">
            {ATTENDANCE_OPTIONS.map((status) => (
              <StatusButton
                key={status.value}
                status={status.value}
                isActive={currentAttendance === status.value}
                onClick={() => onAttendanceChange(user.id, "attended", status.value)}
                compact
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">Bus</p>
          <select
            value={currentBus}
            onChange={(e) => onAttendanceChange(user.id, "busNumber", parseInt(e.target.value))}
            disabled={isAbsent}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isAbsent ? "bg-gray-100 cursor-not-allowed" : "border-gray-300"
            }`}
          >
            <option value="">Seleccione un bus</option>
            {BUS_OPTIONS.map((bus) => (
              <option key={bus.value} value={bus.value}>
                {bus.label}
              </option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Hotel</p>
            <select
              value={currentHotel}
              onChange={(e) => onAttendanceChange(user.id, "hotel", e.target.value)}
              disabled={isAbsent}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isAbsent ? "bg-gray-100 cursor-not-allowed" : "border-gray-300"
              }`}
            >
              <option value="">Seleccione un hotel</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 items-center">
        {/* Student Info - 3 cols */}
        <div className="col-span-3 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {user.name[0]}
            {user.firstSurName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold text-gray-900 truncate"
              dangerouslySetInnerHTML={{ __html: highlightText(fullName) }}
            />
            <p className="text-xs text-gray-500">{user.instrument}</p>
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

        {/* Attendance - 2 cols */}
        <div className="col-span-2 flex gap-2">
          {ATTENDANCE_OPTIONS.map((status) => (
            <StatusButton
              key={status.value}
              status={status.value}
              isActive={currentAttendance === status.value}
              onClick={() => onAttendanceChange(user.id, "attended", status.value)}
            />
          ))}
        </div>

        {/* Bus - 2 cols */}
        <div className="col-span-2">
          <select
            value={currentBus}
            onChange={(e) => onAttendanceChange(user.id, "busNumber", parseInt(e.target.value))}
            disabled={isAbsent}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isAbsent ? "bg-gray-100 cursor-not-allowed" : "border-gray-300"
            }`}
          >
            <option value="">Seleccione un bus</option>
            {BUS_OPTIONS.map((bus) => (
              <option key={bus.value} value={bus.value}>
                {bus.label}
              </option>
            ))}
          </select>
        </div>

        {/* Hotel - 5 cols (only if admin) */}
        {isAdmin && (
          <div className="col-span-5">
            <select
              value={currentHotel}
              onChange={(e) => onAttendanceChange(user.id, "hotel", e.target.value)}
              disabled={isAbsent}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isAbsent ? "bg-gray-100 cursor-not-allowed" : "border-gray-300"
              }`}
            >
              <option value="">Seleccione un hotel</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

const AttendanceHeader = ({ stats, selectedEvent, events, onEventChange, hasUnsavedChanges }) => {
  const selectedEventDetails = events.find((e) => e.id === selectedEvent);

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Asistencia a presentaciones
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {selectedEventDetails ? selectedEventDetails.title : "Selecciona un evento"}
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
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Evento:</label>
          <select
            value={selectedEvent}
            onChange={(e) => onEventChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione un evento</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
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

        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50 rounded-lg">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-xs font-medium text-red-700">Ausentes:</span>
          <span className="text-base sm:text-lg font-bold text-red-900">{stats.absent}</span>
        </div>
      </div>

      {/* Desktop Column Headers */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 uppercase tracking-wide">
        <div className="col-span-3">Estudiante</div>
        <div className="col-span-2">Asistencia</div>
        <div className="col-span-2">Bus</div>
        <div className="col-span-5">Hotel</div>
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
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
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
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Selecciona un evento</h3>
    <p className="text-xs sm:text-sm text-gray-500">
      Elige un evento del menú desplegable para registrar asistencia
    </p>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PerformanceAttendancePage = () => {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [attendanceData, setAttendanceData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // GraphQL
  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const { data: usersData } = useQuery(GET_USERS);
  const { data: eventsData } = useQuery(GET_EVENTS);
  const { data: hotelsData } = useQuery(GET_HOTELS);
  const { data: performanceData, refetch } = useQuery(GET_PERFORMANCE_ATTENDANCE, {
    variables: { event: selectedEvent },
    skip: !selectedEvent,
  });

  const [newPerformanceAttendance] = useMutation(NEW_PERFORMANCE_ATTENDANCE, {
    onError: (error) => {
      console.error("Error al guardar:", error);
      setToast({ message: "Error al guardar asistencia", type: "error" });
    },
  });

  const userRole = userData?.getUser?.role;
  const userInstrument = userData?.getUser?.instrument;
  const isAdmin = userRole === "Admin";

  const allowedRoles = [
    "Principal de sección",
    "Líder de sección",
    "Asistente de sección",
    "Staff",
    "Dirección Logística",
    "Admin",
    "Director",
  ];

  // Filter users based on role
  const users = usersData?.getUsers || [];
  const filteredUsers = allowedRoles.includes(userRole)
    ? users.filter((user) => user.instrument === userInstrument)
    : users;

  const events = eventsData?.getEvents || [];
  const hotels = hotelsData?.getHotels || [];

  // Initialize attendance data
  useEffect(() => {
    if (filteredUsers && filteredUsers.length > 0 && selectedEvent) {
      const initialData = {};

      // Initialize all users with defaults
      filteredUsers.forEach((user) => {
        initialData[user.id] = {
          attended: "Presente",
          busNumber: "",
          hotel: "",
          isSaved: true,
        };
      });

      // Override with existing data if available
      if (performanceData?.getPerformanceAttendanceByEvent) {
        performanceData.getPerformanceAttendanceByEvent.forEach((record) => {
          if (initialData[record.user.id]) {
            initialData[record.user.id] = {
              attended: record.attended,
              busNumber: record.busNumber || "",
              hotel: record.hotel?.id || "",
              isSaved: true,
            };
          }
        });
      }

      setAttendanceData(initialData);
    }
  }, [performanceData, filteredUsers, selectedEvent]);

  // Filter students by search
  const filteredSearchStudents = filteredUsers.filter((user) => {
    if (!searchTerm) return true;
    const fullName = `${user.name} ${user.firstSurName} ${user.secondSurName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search);
  });

  // Calculate stats
  const stats = {
    total: filteredUsers.length,
    present: Object.values(attendanceData).filter((r) => r?.attended === "Presente").length || 0,
    absent: Object.values(attendanceData).filter((r) => r?.attended === "Ausente").length || 0,
  };

  const unsavedCount = Object.values(attendanceData).filter((r) => r?.isSaved === false).length;
  const hasUnsavedChanges = unsavedCount > 0;

  // Handlers
  const handleAttendanceChange = (userId, field, value) => {
    setAttendanceData((prev) => {
      const current = prev[userId] || {
        attended: "Presente",
        busNumber: "",
        hotel: "",
      };

      // If changing to absent, clear bus and hotel
      const updates = { [field]: value };
      if (field === "attended" && value === "Ausente") {
        updates.busNumber = "";
        updates.hotel = "";
      }

      return {
        ...prev,
        [userId]: {
          ...current,
          ...updates,
          isSaved: false,
        },
      };
    });
  };

  const handleSaveAll = async () => {
    if (!selectedEvent) {
      setToast({ message: "Por favor selecciona un evento", type: "error" });
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    const unsavedStudents = Object.entries(attendanceData).filter(
      ([_, data]) => data?.isSaved === false
    );

    for (const [userId, studentData] of unsavedStudents) {
      const attended = studentData.attended || "Presente";
      const busNumber = attended === "Ausente" ? null : parseInt(studentData.busNumber) || null;
      const hotel = attended === "Ausente" || !studentData.hotel ? null : studentData.hotel;

      try {
        await newPerformanceAttendance({
          variables: {
            input: {
              user: userId,
              event: selectedEvent,
              attended,
              busNumber,
              hotel,
            },
          },
        });

        setAttendanceData((prev) => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            isSaved: true,
          },
        }));

        successCount++;
      } catch (error) {
        console.error(`Error al guardar estudiante ${userId}:`, error);
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

  // Empty state - no event selected
  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 sm:pb-24">
        <AttendanceHeader
          stats={{ total: 0, present: 0, absent: 0 }}
          selectedEvent={selectedEvent}
          events={events}
          onEventChange={setSelectedEvent}
          hasUnsavedChanges={false}
        />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-24">
      <AttendanceHeader
        stats={stats}
        selectedEvent={selectedEvent}
        events={events}
        onEventChange={setSelectedEvent}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalResults={filteredSearchStudents.length}
      />

      <div className="px-0 sm:px-4 py-4 sm:py-6">
        <div className="bg-white rounded-none sm:rounded-lg shadow-sm border-0 sm:border border-gray-200 overflow-hidden">
          {filteredSearchStudents.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No se encontraron resultados para &quot;{searchTerm}&quot;
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredSearchStudents.map((user) => {
                const attendance = attendanceData[user.id] || {
                  attended: "Presente",
                  busNumber: "",
                  hotel: "",
                  isSaved: true,
                };
                return (
                  <StudentRow
                    key={user.id}
                    user={user}
                    attendance={attendance}
                    onAttendanceChange={handleAttendanceChange}
                    searchTerm={searchTerm}
                    hotels={hotels}
                    isAdmin={isAdmin}
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

export default PerformanceAttendancePage;

// =========================
// PROPTYPES
// =========================

StatusButton.propTypes = {
  status: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};

StudentRow.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    firstSurName: PropTypes.string.isRequired,
    secondSurName: PropTypes.string.isRequired,
    instrument: PropTypes.string,
  }).isRequired,
  attendance: PropTypes.shape({
    attended: PropTypes.string,
    busNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    hotel: PropTypes.string,
    isSaved: PropTypes.bool,
  }),
  onAttendanceChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  hotels: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  isAdmin: PropTypes.bool.isRequired,
};

AttendanceHeader.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    present: PropTypes.number.isRequired,
    absent: PropTypes.number.isRequired,
  }).isRequired,
  selectedEvent: PropTypes.string.isRequired,
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    })
  ).isRequired,
  onEventChange: PropTypes.func.isRequired,
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
