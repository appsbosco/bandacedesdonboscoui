import { useQuery } from "@apollo/client";
import { GET_ALL_ATTENDANCE } from "graphql/queries";
import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { GET_USERS_BY_ID } from "graphql/queries";

// ============================================================================
// CONSTANTS & UTILS
// ============================================================================

const ATTENDANCE_STATUS_CONFIG = {
  present: { label: "Presente", color: "bg-emerald-500", textColor: "text-emerald-700" },
  absent: { label: "Ausente", color: "bg-red-500", textColor: "text-red-700" },
  justified_absence: {
    label: "Ausencia Justificada",
    color: "bg-amber-500",
    textColor: "text-amber-700",
  },
  unjustified_absence: {
    label: "Ausencia Injustificada",
    color: "bg-orange-600",
    textColor: "text-orange-700",
  },
  justified_withdrawal: {
    label: "Retiro Justificado",
    color: "bg-blue-500",
    textColor: "text-blue-700",
  },
  unjustified_withdrawal: {
    label: "Retiro Injustificado",
    color: "bg-purple-600",
    textColor: "text-purple-700",
  },
};

const formatDateString = (dateString) => {
  const date = new Date(parseInt(dateString));
  return date.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getAttendanceConfig = (attendance) => {
  return ATTENDANCE_STATUS_CONFIG[attendance] || { label: "", color: "bg-gray-500" };
};

const calculateAttendancePercentages = (attendanceData, totalRehearsals = 50) => {
  const userAttendanceGroups = {};

  attendanceData.forEach((attendance) => {
    const userId = attendance.user?.id;
    if (!userId) return;

    const userName = `${attendance?.user?.name} ${attendance?.user?.firstSurName} ${attendance?.user?.secondSurName}`;

    if (!userAttendanceGroups[userId]) {
      userAttendanceGroups[userId] = {
        userName,
        present: 0,
        total: 0,
      };
    }

    if (attendance.attended === "present") {
      userAttendanceGroups[userId].present += 1;
    }
    userAttendanceGroups[userId].total += 1;
  });

  const userAttendancePercentages = {};
  for (const userId in userAttendanceGroups) {
    const { userName, present } = userAttendanceGroups[userId];
    const percentage = (present / totalRehearsals) * 100;
    userAttendancePercentages[userName] = percentage;
  }

  return userAttendancePercentages;
};

const getMoodConfig = (percentage) => {
  if (percentage >= 80) {
    return {
      icon: "😊",
      color: "text-green-600",
      bgColor: "bg-green-50",
      label: "Excelente",
    };
  } else if (percentage >= 60) {
    return {
      icon: "😐",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      label: "Regular",
    };
  } else {
    return {
      icon: "😞",
      color: "text-red-600",
      bgColor: "bg-red-50",
      label: "Necesita mejorar",
    };
  }
};

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

const AttendanceRow = ({ record, searchTerm }) => {
  const userName = `${record.user?.name} ${record.user?.firstSurName} ${record.user?.secondSurName}`;
  const attendanceConfig = getAttendanceConfig(record.attended);
  const moodConfig = getMoodConfig(record.percentage);

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
            {record.user?.name[0]}
            {record.user?.firstSurName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold text-gray-900 truncate"
              dangerouslySetInnerHTML={{ __html: highlightText(userName) }}
            />
            <p className="text-xs text-gray-500">{record.user?.instrument}</p>
          </div>
          <div className="flex-shrink-0">
            <span className="text-xs text-gray-500">{formatDateString(record.date)}</span>
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
              <p className="text-xs font-semibold text-gray-700">{record.percentage.toFixed(1)}%</p>
              <p className={`text-xs ${moodConfig.color}`}>{moodConfig.label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className=" lg:grid lg:grid-cols-12 gap-4 px-4 py-3 items-center">
        {/* Student Info - 4 cols */}
        <div className="col-span-4 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {record.user?.name[0]}
            {record.user?.firstSurName[0]}
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
          <p className="text-sm text-gray-700">{formatDateString(record.date)}</p>
        </div>

        {/* Attendance Status - 3 cols */}
        <div className="col-span-3">
          <span
            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${attendanceConfig.color} text-white`}
          >
            {attendanceConfig.label}
          </span>
        </div>

        {/* Percentage & Mood - 3 cols */}
        <div className="col-span-3 flex items-center justify-between">
          <div className="text-right flex-1">
            <p className="text-sm font-bold text-gray-900">{record.percentage.toFixed(1)}%</p>
            <p className={`text-xs ${moodConfig.color} font-medium`}>{moodConfig.label}</p>
          </div>
          <span className={`text-3xl ml-3 ${moodConfig.color}`}>{moodConfig.icon}</span>
        </div>
      </div>
    </div>
  );
};

const AttendanceHeader = ({ stats, filters, onFilterChange }) => {
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filters.status}
          onChange={(e) => onFilterChange("status", e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los estados</option>
          <option value="present">Presente</option>
          <option value="absent">Ausente</option>
          <option value="justified_absence">Ausencia Justificada</option>
          <option value="unjustified_absence">Ausencia Injustificada</option>
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
      </div>

      {/* Desktop Column Headers */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 uppercase tracking-wide">
        <div className="col-span-4">Estudiante</div>
        <div className="col-span-2">Fecha</div>
        <div className="col-span-3">Estado</div>
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
      No hay registros de asistencia
    </h3>
    <p className="text-xs sm:text-sm text-gray-500">
      Los registros aparecerán aquí una vez que se tomen asistencias
    </p>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AttendanceHistoryTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    instrument: "all",
    instruments: [],
  });

  const { loading, error, data } = useQuery(GET_ALL_ATTENDANCE, {
    notifyOnNetworkStatusChange: true,
  });
  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const isAdmin = userData?.getUser?.role === "Admin";
  const userInstrument = userData?.getUser?.instrument;

  // Process data
  const validAttendances = data?.getAllAttendance?.filter((a) => a.user?.id) || [];
  const userAttendancePercentages = calculateAttendancePercentages(validAttendances);

  // Get unique instruments
  useEffect(() => {
    if (validAttendances.length > 0) {
      const uniqueInstruments = [
        ...new Set(validAttendances.map((a) => a.user?.instrument).filter(Boolean)),
      ];
      setFilters((prev) => ({ ...prev, instruments: uniqueInstruments.sort() }));
    }
  }, [data]);

  // Transform data with percentages
  const processedRecords = validAttendances
    .slice()
    .reverse()
    .map((attendance) => {
      const userName = `${attendance.user?.name} ${attendance.user?.firstSurName} ${attendance.user?.secondSurName}`;
      const percentage = userAttendancePercentages[userName] || 0;
      return {
        ...attendance,
        userName,
        percentage,
      };
    })
    .filter((record) => {
      // Si es Admin, muestra todos los registros
      if (isAdmin) return true;
      // Si no es Admin, solo muestra su instrumento
      return record.user?.instrument === userInstrument;
    });

  // Apply filters
  const filteredRecords = processedRecords.filter((record) => {
    // Search filter
    const searchMatch =
      !searchTerm ||
      record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user?.instrument?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const statusMatch = filters.status === "all" || record.attended === filters.status;

    // Instrument filter
    const instrumentMatch =
      filters.instrument === "all" || record.user?.instrument === filters.instrument;

    return searchMatch && statusMatch && instrumentMatch;
  });

  // Calculate stats
  const stats = {
    total: filteredRecords.length,
    present: filteredRecords.filter((r) => r.attended === "present").length,
    absent: filteredRecords.filter((r) => r.attended !== "present").length,
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
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
          <p className="text-gray-600 font-medium text-sm sm:text-base">Cargando historial...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-16 px-4 text-center">
        <p className="text-red-600 font-medium">Error al cargar el historial: {error.message}</p>
      </div>
    );
  }

  // Empty state
  if (validAttendances.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AttendanceHeader stats={stats} filters={filters} onFilterChange={handleFilterChange} />

      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalResults={filteredRecords.length}
      />

      <div className="px-0 sm:px-4 py-4 sm:py-6">
        <div className="bg-white rounded-none sm:rounded-lg shadow-sm border-0 sm:border border-gray-200 overflow-hidden">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No se encontraron resultados
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredRecords.map((record) => (
                <AttendanceRow key={record.id} record={record} searchTerm={searchTerm} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        mark {
          background-color: #fef08a;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default AttendanceHistoryTable;

// =========================
// PROPTYPES
// =========================

AttendanceRow.propTypes = {
  record: PropTypes.shape({
    id: PropTypes.string.isRequired,
    user: PropTypes.shape({
      name: PropTypes.string,
      firstSurName: PropTypes.string,
      secondSurName: PropTypes.string,
      instrument: PropTypes.string,
    }),
    date: PropTypes.string,
    attended: PropTypes.string,
    percentage: PropTypes.number,
  }).isRequired,
  searchTerm: PropTypes.string,
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
    instruments: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

SearchAndFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  totalResults: PropTypes.number.isRequired,
};
