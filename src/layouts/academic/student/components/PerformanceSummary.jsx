import React from "react";
import PropTypes from "prop-types";

const riskConfig = {
  GREEN: {
    label: "Buen rendimiento",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    icon: "✓",
  },
  YELLOW: {
    label: "Rendimiento regular",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    icon: "!",
  },
  RED: {
    label: "Rendimiento en riesgo",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
    icon: "✗",
  },
};

const trendIcon = {
  UP: (
    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
    </svg>
  ),
  DOWN: (
    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
    </svg>
  ),
  STABLE: (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
    </svg>
  ),
};

export function PerformanceSummary({ performance, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-7 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!performance) return null;

  const risk = riskConfig[performance.riskLevel] || riskConfig.GREEN;

  return (
    <div className="space-y-4">
      {/* Risk badge */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${risk.bg}`}>
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${risk.dot} text-white shrink-0`}
        >
          {risk.icon}
        </span>
        <div>
          <p className={`text-sm font-semibold ${risk.color}`}>{risk.label}</p>
          {performance.riskSubjects?.length > 0 && (
            <p className="text-xs text-gray-500">
              {performance.riskSubjects.length} materia(s) en riesgo:{" "}
              {performance.riskSubjects.map((r) => r.subjectName).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Promedio general</p>
          <p className="text-2xl font-bold text-gray-900">
            {performance.averageGeneral?.toFixed(1)}
            <span className="text-sm text-gray-400 font-normal">/100</span>
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Tendencia</p>
          <div className="flex items-center gap-2">
            {trendIcon[performance.trendDirection]}
            <span className="text-base font-semibold text-gray-900">
              {performance.trendDelta > 0 ? "+" : ""}
              {performance.trendDelta?.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Aprobadas</p>
          <p className="text-2xl font-bold text-emerald-600">{performance.approvedCount}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-amber-600">{performance.pendingCount}</p>
        </div>
      </div>

      {/* Subject averages */}
      {performance.averagesBySubject?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Promedio por materia
          </p>
          <div className="space-y-2">
            {performance.averagesBySubject.map((s) => {
              const isRisk = performance.riskSubjects?.some((r) => r.subjectId === s.subjectId);
              const pct = Math.min(s.average, 100);
              const barColor =
                s.average >= 80 ? "bg-emerald-500" : s.average >= 70 ? "bg-amber-500" : "bg-red-500";
              return (
                <div key={s.subjectId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700 flex items-center gap-1">
                      {isRisk && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                      {s.subjectName}
                    </span>
                    <span className="text-xs font-medium text-gray-900">{s.average.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`${barColor} h-1.5 rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

PerformanceSummary.propTypes = {
  performance: PropTypes.object,
  loading: PropTypes.bool,
};

export default PerformanceSummary;
