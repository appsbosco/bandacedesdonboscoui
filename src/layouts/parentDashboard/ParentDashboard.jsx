import { useQuery } from "@apollo/client";
import PropTypes from "prop-types";
import { useState, useMemo } from "react";
import { GET_PARENT_DASHBOARD } from "graphql/queries/parents";
import ChildSelector from "./components/ChildSelector";
import MetricsCards from "./components/MetricsCards";
import PendingPaymentsTable from "./components/PendingPaymentsTable";
import RecentActivity from "./components/RecentActivity";

const DateRangeSelector = ({ selectedPreset, onPresetChange }) => {
  const presets = [
    { value: "LAST_30_DAYS", label: "Últimos 30 días" },
    { value: "LAST_90_DAYS", label: "Últimos 90 días" },
    { value: "LAST_180_DAYS", label: "Últimos 6 meses" },
    { value: "CURRENT_YEAR", label: "Año actual" },
  ];

  return (
    <div className="mb-4">
      <select
        value={selectedPreset}
        onChange={(e) => onPresetChange(e.target.value)}
        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {presets.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.label}
          </option>
        ))}
      </select>
    </div>
  );
};

DateRangeSelector.propTypes = {
  selectedPreset: PropTypes.string.isRequired,
  onPresetChange: PropTypes.func.isRequired,
};

const ParentDashboard = () => {
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [datePreset, setDatePreset] = useState("LAST_90_DAYS");

  const { loading, error, data, refetch } = useQuery(GET_PARENT_DASHBOARD, {
    variables: {
      dateRange: { preset: datePreset },
      childId: selectedChildId,
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const dashboard = data?.getParentDashboard;

  const childrenToDisplay = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.children;
  }, [dashboard]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border border-red-200">
          <div className="text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-lg font-semibold text-red-800 mb-2">Error al cargar datos</p>
            <p className="text-sm text-gray-600 mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
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
          <p className="text-gray-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-600">No se pudo cargar la información</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-500 mt-1">
              {dashboard.parent.name} {dashboard.parent.firstSurName}
            </p>
          </div>
          {loading && (
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
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
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-20">
        <DateRangeSelector selectedPreset={datePreset} onPresetChange={setDatePreset} />

        <ChildSelector
          childrenData={dashboard.children}
          selectedChildId={selectedChildId}
          onSelectChild={setSelectedChildId}
        />

        {childrenToDisplay.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-600">No hay datos para mostrar</p>
          </div>
        ) : (
          <>
            {childrenToDisplay.map((childData) => (
              <div key={childData.child.id} className="mb-8">
                {!selectedChildId && (
                  <div className="mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {childData.child.name[0]}
                      {childData.child.firstSurName[0]}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {childData.child.name} {childData.child.firstSurName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {childData.child.instrument || "Sin instrumento"}
                      </p>
                    </div>
                  </div>
                )}

                <MetricsCards childData={childData} />

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">
                    Pagos Pendientes
                  </h3>
                  <PendingPaymentsTable payments={childData.pendingPayments} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">
                    Actividad Reciente
                  </h3>
                  <RecentActivity
                    rehearsalAttendance={childData.recentRehearsalAttendance}
                    classAttendance={childData.recentClassAttendance}
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
