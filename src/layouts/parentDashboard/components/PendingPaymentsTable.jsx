import PropTypes from "prop-types";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const PendingPaymentsTable = ({ payments }) => {
  if (payments.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-sm font-semibold text-emerald-800">¡Todo al día!</p>
        <p className="text-xs text-emerald-600 mt-1">No hay pagos pendientes</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <p className="text-sm font-semibold text-red-800">Pagos Pendientes ({payments.length})</p>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className={`p-4 hover:bg-gray-50 transition-colors ${
              payment.daysOverdue > 30 ? "bg-red-50" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  Clase del {formatDate(payment.date)}
                </p>
                <p className="text-xs text-gray-600 mt-1">Instructor: {payment.instructorName}</p>
              </div>
              <span
                className={`shrink-0 px-3 py-1 text-xs font-bold rounded-full ${
                  payment.daysOverdue > 30
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {payment.daysOverdue} día{payment.daysOverdue !== 1 ? "s" : ""}
              </span>
            </div>

            {payment.daysOverdue > 30 && (
              <div className="flex items-center gap-2 mt-2 text-xs text-red-700">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Pago atrasado</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

PendingPaymentsTable.propTypes = {
  payments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      instructorName: PropTypes.string,
      daysOverdue: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default PendingPaymentsTable;
