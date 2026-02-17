import PropTypes from "prop-types";
import { useState } from "react";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
};

const STATUS_CONFIG = {
  PRESENT: { label: "Presente", color: "bg-emerald-500", textColor: "text-emerald-700" },
  LATE: { label: "Tarde", color: "bg-orange-500", textColor: "text-orange-700" },
  ABSENT_JUSTIFIED: {
    label: "Ausencia Justificada",
    color: "bg-amber-500",
    textColor: "text-amber-700",
  },
  ABSENT_UNJUSTIFIED: {
    label: "Ausencia Injustificada",
    color: "bg-red-500",
    textColor: "text-red-700",
  },
  JUSTIFIED_WITHDRAWAL: {
    label: "Retiro Justificado",
    color: "bg-blue-600",
    textColor: "text-blue-800",
  },
  UNJUSTIFIED_WITHDRAWAL: {
    label: "Retiro Injustificado",
    color: "bg-purple-700",
    textColor: "text-purple-800",
  },
};

const ATTENDANCE_CLASS_CONFIG = {
  Presente: { label: "Presente", color: "bg-emerald-500", textColor: "text-emerald-700" },
  "Ausencia Justificada": {
    label: "Ausencia Justificada",
    color: "bg-amber-500",
    textColor: "text-amber-700",
  },
  "Ausencia No Justificada": {
    label: "Ausencia Injustificada",
    color: "bg-red-500",
    textColor: "text-red-700",
  },
};

const RecentActivity = ({ rehearsalAttendance, classAttendance }) => {
  const [activeTab, setActiveTab] = useState("rehearsals");

  const hasRehearsals = rehearsalAttendance.length > 0;
  const hasClasses = classAttendance.length > 0;

  if (!hasRehearsals && !hasClasses) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-600">No hay actividad reciente</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("rehearsals")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "rehearsals"
              ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
              : "text-gray-600 hover:bg-gray-50"
          }`}
          disabled={!hasRehearsals}
        >
          Ensayos ({rehearsalAttendance.length})
        </button>
        <button
          onClick={() => setActiveTab("classes")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "classes"
              ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
              : "text-gray-600 hover:bg-gray-50"
          }`}
          disabled={!hasClasses}
        >
          Clases ({classAttendance.length})
        </button>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-100">
        {activeTab === "rehearsals" && hasRehearsals && (
          <>
            {rehearsalAttendance.slice(0, 10).map((record) => {
              const config = STATUS_CONFIG[record.status] || STATUS_CONFIG.ABSENT_UNJUSTIFIED;
              return (
                <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(record.date)}
                      </p>
                      {record.recordedBy && (
                        <p className="text-xs text-gray-600 mt-1">Por: {record.recordedBy}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 inline-flex px-3 py-1 text-xs font-medium rounded-full ${config.color} text-white`}
                    >
                      {config.label}
                    </span>
                  </div>
                  {record.notes && (
                    <p className="text-xs text-gray-600 italic bg-gray-50 px-2 py-1 rounded mt-2">
                      {record.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </>
        )}

        {activeTab === "classes" && hasClasses && (
          <>
            {classAttendance.slice(0, 10).map((record) => {
              const config =
                ATTENDANCE_CLASS_CONFIG[record.attendanceStatus] ||
                ATTENDANCE_CLASS_CONFIG["Ausencia No Justificada"];
              const paymentColor =
                record.paymentStatus === "Pendiente"
                  ? "bg-red-100 text-red-800"
                  : record.paymentStatus === "Pagado"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-blue-100 text-blue-800";

              return (
                <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(record.date)}
                      </p>
                      {record.instructorName && (
                        <p className="text-xs text-gray-600 mt-1">
                          Instructor: {record.instructorName}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span
                        className={`shrink-0 inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color} text-white`}
                      >
                        {config.label}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${paymentColor}`}>
                        {record.paymentStatus}
                      </span>
                    </div>
                  </div>
                  {record.justification && (
                    <p className="text-xs text-gray-600 italic bg-gray-50 px-2 py-1 rounded mt-2">
                      Justificación: {record.justification}
                    </p>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

RecentActivity.propTypes = {
  rehearsalAttendance: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      notes: PropTypes.string,
      recordedBy: PropTypes.string,
    })
  ).isRequired,
  classAttendance: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      attendanceStatus: PropTypes.string.isRequired,
      paymentStatus: PropTypes.string.isRequired,
      justification: PropTypes.string,
      instructorName: PropTypes.string,
    })
  ).isRequired,
};

export default RecentActivity;
