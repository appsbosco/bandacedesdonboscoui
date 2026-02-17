// src/components/scanner/QualityIndicators.js
import React from "react";
import PropTypes from "prop-types";

export function QualityIndicators({ analysis }) {
  const indicators = [
    { key: "focus", label: analysis.focus.label, ok: analysis.focus.ok },
    { key: "brightness", label: analysis.brightness.label, ok: analysis.brightness.ok },
    { key: "glare", label: analysis.glare.label, ok: analysis.glare.ok },
    { key: "alignment", label: analysis.alignment.label, ok: analysis.alignment.ok },
  ];

  // Get score indicators if available
  const scores = analysis.scores || {};
  const scoreIndicators = [
    {
      key: "inside",
      label: "Encuadre",
      score: scores.insideScore || 0,
      ok: (scores.insideScore || 0) >= 0.7,
    },
    {
      key: "rotation",
      label: "Rotación",
      score: scores.rotationScore || 0,
      ok: (scores.rotationScore || 0) >= 0.7,
    },
    {
      key: "perspective",
      label: "Perspectiva",
      score: scores.perspectiveScore || 0,
      ok: (scores.perspectiveScore || 0) >= 0.7,
    },
    {
      key: "stability",
      label: "Estabilidad",
      score: scores.stabilityScore || 0,
      ok: (scores.stabilityScore || 0) >= 0.7,
    },
  ];

  return (
    <div className="absolute top-20 left-0 right-0 z-20 px-4">
      {/* Quality indicators */}
      <div className="flex flex-wrap justify-center gap-2">
        {indicators.map(({ key, label, ok }) => (
          <div
            key={key}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all duration-300 ${
              ok
                ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/40"
                : "bg-white/10 text-white/70 border border-white/20"
            }`}
          >
            <span>{label}</span>
            {ok && (
              <svg
                className="w-3 h-3 text-emerald-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Document detection status */}
      <div className="flex justify-center mt-3">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm transition-all duration-300 ${
            analysis.documentDetected
              ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/40"
              : "bg-amber-500/20 text-amber-100 border border-amber-400/40"
          }`}
        >
          {analysis.documentDetected ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Documento detectado</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 animate-pulse"
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
              <span>Buscando documento...</span>
            </>
          )}
        </div>
      </div>

      {/* Score indicators (shown when document detected) */}
      {analysis.documentDetected && (
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {scoreIndicators.map(({ key, label, score, ok }) => (
            <div
              key={key}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm transition-all duration-300 ${
                ok
                  ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30"
                  : "bg-white/5 text-white/50 border border-white/10"
              }`}
            >
              <span>{label}</span>
              <span className={`font-mono ${ok ? "text-emerald-300" : "text-white/40"}`}>
                {Math.round(score * 100)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Overall quality progress bar */}
      {analysis.documentDetected && (
        <div className="mt-4 max-w-xs mx-auto">
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                analysis.captureEnabled
                  ? "bg-emerald-400"
                  : analysis.overallScore >= 0.7
                  ? "bg-amber-400"
                  : "bg-sky-400"
              }`}
              style={{ width: `${Math.min(analysis.overallScore * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-white/60">
              Calidad: {Math.round(analysis.overallScore * 100)}%
            </p>
            {analysis.captureEnabled && (
              <span className="text-xs text-emerald-400 font-medium">✓ Listo para capturar</span>
            )}
          </div>
        </div>
      )}

      {/* Capture status */}
      {analysis.autoCaptureReady && (
        <div className="flex justify-center mt-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/50 animate-pulse">
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-sm font-medium">Captura automática en progreso...</span>
          </div>
        </div>
      )}
    </div>
  );
}

QualityIndicators.propTypes = {
  analysis: PropTypes.shape({
    focus: PropTypes.object,
    brightness: PropTypes.object,
    glare: PropTypes.object,
    alignment: PropTypes.object,
    documentDetected: PropTypes.bool,
    overallOk: PropTypes.bool,
    overallScore: PropTypes.number,
    scores: PropTypes.object,
    captureEnabled: PropTypes.bool,
    autoCaptureReady: PropTypes.bool,
  }).isRequired,
};

export default QualityIndicators;
