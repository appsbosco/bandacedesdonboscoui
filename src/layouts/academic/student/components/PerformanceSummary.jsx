/* eslint-disable react/prop-types */
import React from "react";

const RISK_CONFIG = {
  GREEN: {
    label: "Buen rendimiento",
    sublabel: "Estás al día y sin materias en riesgo",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    icon: (
      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  YELLOW: {
    label: "Rendimiento regular",
    sublabel: "Hay materias que requieren atención",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    icon: (
      <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  RED: {
    label: "Rendimiento en riesgo",
    sublabel: "Requiere atención inmediata en varias materias",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
    icon: (
      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const TREND_CONFIG = {
  UP: {
    icon: (
      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    color: "text-emerald-600",
    label: "Mejorando",
  },
  DOWN: {
    icon: (
      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17H5m0 0V9m0 8l8-8 4 4 6-6" />
      </svg>
    ),
    color: "text-red-600",
    label: "Bajando",
  },
  STABLE: {
    icon: (
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    ),
    color: "text-gray-500",
    label: "Estable",
  },
};

export function PerformanceSummary({ performance, loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-100 rounded-xl h-16 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-20 animate-pulse" />
          ))}
        </div>
        <div className="bg-gray-100 rounded-xl h-40 animate-pulse" />
      </div>
    );
  }

  if (!performance) return null;

  const risk = RISK_CONFIG[performance.riskLevel] || RISK_CONFIG.GREEN;
  const trend = TREND_CONFIG[performance.trendDirection] || TREND_CONFIG.STABLE;

  return (
    <div className="space-y-5">
      {/* Risk status banner */}
      <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${risk.bg}`}>
        <div className="shrink-0">{risk.icon}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${risk.color}`}>{risk.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{risk.sublabel}</p>
        </div>
        {performance.riskSubjects?.length > 0 && (
          <div className="shrink-0">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200`}>
              {performance.riskSubjects.length} en riesgo
            </span>
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1.5">Promedio general</p>
          <p className="text-2xl font-bold text-gray-900">
            {performance.averageGeneral?.toFixed(1)}
            <span className="text-sm text-gray-400 font-normal ml-0.5">/100</span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1.5">Tendencia</p>
          <div className="flex items-center gap-1.5">
            {trend.icon}
            <span className={`text-base font-bold ${trend.color}`}>
              {performance.trendDelta > 0 ? "+" : ""}{performance.trendDelta?.toFixed(1)}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{trend.label}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1.5">Aprobadas</p>
          <p className="text-2xl font-bold text-emerald-600">{performance.approvedCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">evaluaciones</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1.5">Pendientes</p>
          <p className="text-2xl font-bold text-amber-600">{performance.pendingCount}</p>
          {performance.rejectedCount > 0 && (
            <p className="text-xs text-red-500 mt-0.5">{performance.rejectedCount} rechazadas</p>
          )}
        </div>
      </div>

      {/* Subject performance */}
      {performance.averagesBySubject?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Rendimiento por materia
          </h3>
          <div className="space-y-3">
            {performance.averagesBySubject.map((s) => {
              const isRisk = performance.riskSubjects?.some((r) => r.subjectId === s.subjectId);
              const pct = Math.min(s.average, 100);
              const barColor = s.average >= 80 ? "bg-emerald-500" : s.average >= 70 ? "bg-amber-500" : "bg-red-500";
              const textColor = s.average >= 80 ? "text-emerald-600" : s.average >= 70 ? "text-amber-600" : "text-red-600";
              return (
                <div key={s.subjectId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isRisk && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      )}
                      <span className="text-sm text-gray-700 truncate">{s.subjectName}</span>
                      <span className="text-xs text-gray-400 shrink-0">({s.evaluationCount})</span>
                    </div>
                    <span className={`text-sm font-bold ${textColor} shrink-0 ml-2`}>
                      {s.average.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Risk subjects summary */}
          {performance.riskSubjects?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-red-600 mb-2">Materias en riesgo</p>
              <div className="flex flex-wrap gap-1.5">
                {performance.riskSubjects.map((rs) => (
                  <span
                    key={rs.subjectId}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 rounded-full"
                  >
                    {rs.subjectName}
                    <span className="font-bold">{rs.average.toFixed(1)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Best and weakest */}
      {(performance.strongestSubjects?.length > 0 || performance.weakestSubjects?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {performance.strongestSubjects?.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                Mejores materias
              </p>
              <div className="space-y-1">
                {performance.strongestSubjects.slice(0, 3).map((s) => (
                  <div key={s.subjectId} className="flex items-center justify-between">
                    <span className="text-xs text-emerald-800 truncate">{s.subjectName}</span>
                    <span className="text-xs font-bold text-emerald-700 ml-2 shrink-0">{s.average.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {performance.weakestSubjects?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
                Materias a mejorar
              </p>
              <div className="space-y-1">
                {performance.weakestSubjects.slice(0, 3).map((s) => (
                  <div key={s.subjectId} className="flex items-center justify-between">
                    <span className="text-xs text-red-800 truncate">{s.subjectName}</span>
                    <span className="text-xs font-bold text-red-700 ml-2 shrink-0">{s.average.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PerformanceSummary;
