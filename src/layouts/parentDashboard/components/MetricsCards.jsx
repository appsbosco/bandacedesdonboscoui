import PropTypes from "prop-types";

const MetricCard = ({ title, value, subtitle, trend, icon, color = "blue" }) => {
  const colorClasses = {
    blue: "from-blue-400 to-blue-600",
    emerald: "from-emerald-400 to-emerald-600",
    amber: "from-amber-400 to-amber-600",
    red: "from-red-400 to-red-600",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div
            className={`w-12 h-12 rounded-lg bg-gradient-to-br  flex items-center justify-center text-white text-xl flex-shrink-0 ml-3`}
            //${colorClasses[color]}
          >
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs">
          {trend.direction === "up" ? (
            <svg
              className="w-4 h-4 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              />
            </svg>
          )}
          <span className={trend.direction === "up" ? "text-emerald-600" : "text-red-600"}>
            {trend.text}
          </span>
        </div>
      )}
    </div>
  );
};

MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  trend: PropTypes.shape({
    direction: PropTypes.oneOf(["up", "down"]),
    text: PropTypes.string,
  }),
  icon: PropTypes.string,
  color: PropTypes.oneOf(["blue", "emerald", "amber", "red"]),
};

const MetricsCards = ({ childData }) => {
  const { attendanceMetrics, classMetrics } = childData;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Asistencia Ensayos"
        value={`${attendanceMetrics.attendanceRate.toFixed(1)}%`}
        subtitle={`${attendanceMetrics.present} de ${attendanceMetrics.totalSessions} sesiones`}
        icon="🎵"
        color={attendanceMetrics.attendanceRate >= 80 ? "emerald" : "amber"}
      />

      <MetricCard
        title="Asistencia Clases"
        value={`${classMetrics.attendanceRate.toFixed(1)}%`}
        subtitle={`${classMetrics.present} de ${classMetrics.totalClasses} clases`}
        icon="📚"
        color={classMetrics.attendanceRate >= 80 ? "emerald" : "amber"}
      />

      <MetricCard
        title="Pagos Pendientes"
        value={classMetrics.paymentSummary.totalPending}
        subtitle={
          classMetrics.paymentSummary.totalPending > 0 ? "Requiere atención" : "Todo al día"
        }
        icon="💰"
        color={classMetrics.paymentSummary.totalPending > 0 ? "red" : "emerald"}
      />

      <MetricCard
        title="Clases Pagadas"
        value={classMetrics.paymentSummary.totalPaid}
        subtitle={`${classMetrics.paymentSummary.totalScholarship} becadas`}
        icon="✅"
        color="blue"
      />
    </div>
  );
};

MetricsCards.propTypes = {
  childData: PropTypes.shape({
    attendanceMetrics: PropTypes.shape({
      totalSessions: PropTypes.number.isRequired,
      present: PropTypes.number.isRequired,
      attendanceRate: PropTypes.number.isRequired,
    }).isRequired,
    classMetrics: PropTypes.shape({
      totalClasses: PropTypes.number.isRequired,
      present: PropTypes.number.isRequired,
      attendanceRate: PropTypes.number.isRequired,
      paymentSummary: PropTypes.shape({
        totalPending: PropTypes.number.isRequired,
        totalPaid: PropTypes.number.isRequired,
        totalScholarship: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

export default MetricsCards;
