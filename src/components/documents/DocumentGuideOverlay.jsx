// FILE: src/components/scanner/DocumentGuideOverlay.jsx
// Overlay con guía visual y detección

import React from "react";
import PropTypes from "prop-types";

export function DocumentGuideOverlay({
  guideRect,
  detectedCorners,
  sideScores,
  totalScore,
  hint,
  readyToCapture,
}) {
  const guideStyle = {
    left: `${guideRect.x * 100}%`,
    top: `${guideRect.y * 100}%`,
    width: `${guideRect.width * 100}%`,
    height: `${guideRect.height * 100}%`,
  };

  const getSideColor = (score) => {
    if (score >= 0.8) return "rgba(34, 197, 94, 0.9)"; // green
    if (score >= 0.5) return "rgba(234, 179, 8, 0.9)"; // yellow
    return "rgba(255, 255, 255, 0.4)"; // white/gray
  };

  const borderWidth = 4;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* Oscurecer fuera del guideRect */}
      <div className="absolute inset-0">
        <div
          className="absolute left-0 right-0 top-0 bg-black/60"
          style={{ height: guideStyle.top }}
        />
        <div
          className="absolute left-0 right-0 bottom-0 bg-black/60"
          style={{ height: `calc(100% - ${guideStyle.top} - ${guideStyle.height})` }}
        />
        <div
          className="absolute left-0 bg-black/60"
          style={{
            top: guideStyle.top,
            width: guideStyle.left,
            height: guideStyle.height,
          }}
        />
        <div
          className="absolute right-0 bg-black/60"
          style={{
            top: guideStyle.top,
            width: `calc(100% - ${guideStyle.left} - ${guideStyle.width})`,
            height: guideStyle.height,
          }}
        />
      </div>

      {/* Marco guía con bordes coloreados por score */}
      <div className="absolute" style={guideStyle}>
        {/* Top border */}
        <div
          className="absolute top-0 left-0 right-0 transition-colors duration-300"
          style={{
            height: borderWidth,
            backgroundColor: getSideColor(sideScores?.top || 0),
            boxShadow: sideScores?.top >= 0.8 ? "0 0 10px rgba(34, 197, 94, 0.5)" : "none",
          }}
        />
        {/* Right border */}
        <div
          className="absolute top-0 right-0 bottom-0 transition-colors duration-300"
          style={{
            width: borderWidth,
            backgroundColor: getSideColor(sideScores?.right || 0),
            boxShadow: sideScores?.right >= 0.8 ? "0 0 10px rgba(34, 197, 94, 0.5)" : "none",
          }}
        />
        {/* Bottom border */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-colors duration-300"
          style={{
            height: borderWidth,
            backgroundColor: getSideColor(sideScores?.bottom || 0),
            boxShadow: sideScores?.bottom >= 0.8 ? "0 0 10px rgba(34, 197, 94, 0.5)" : "none",
          }}
        />
        {/* Left border */}
        <div
          className="absolute top-0 left-0 bottom-0 transition-colors duration-300"
          style={{
            width: borderWidth,
            backgroundColor: getSideColor(sideScores?.left || 0),
            boxShadow: sideScores?.left >= 0.8 ? "0 0 10px rgba(34, 197, 94, 0.5)" : "none",
          }}
        />

        {/* Esquinas decorativas */}
        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />

        {/* Línea de escaneo cuando está listo */}
        {readyToCapture && (
          <div className="absolute inset-x-0 overflow-hidden h-full">
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line" />
          </div>
        )}
      </div>

      {/* Contorno detectado del documento */}
      {detectedCorners && detectedCorners.length === 4 && (
        <svg className="absolute inset-0 w-full h-full">
          <polygon
            points={detectedCorners
              .map(
                (c) => `${(c.x / window.innerWidth) * 100}%,${(c.y / window.innerHeight) * 100}%`
              )
              .join(" ")}
            fill="none"
            stroke={readyToCapture ? "rgba(34, 197, 94, 0.8)" : "rgba(59, 130, 246, 0.6)"}
            strokeWidth="2"
            strokeDasharray={readyToCapture ? "none" : "8,4"}
          />
          {detectedCorners.map((corner, idx) => (
            <circle
              key={idx}
              cx={`${(corner.x / window.innerWidth) * 100}%`}
              cy={`${(corner.y / window.innerHeight) * 100}%`}
              r="6"
              fill={readyToCapture ? "rgba(34, 197, 94, 0.9)" : "rgba(59, 130, 246, 0.8)"}
            />
          ))}
        </svg>
      )}

      {/* Score y Hint */}
      <div className="absolute bottom-32 left-0 right-0 flex flex-col items-center gap-2">
        {/* Progress bar */}
        <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              readyToCapture ? "bg-emerald-400" : "bg-sky-400"
            }`}
            style={{ width: `${(totalScore || 0) * 100}%` }}
          />
        </div>

        {/* Hint text */}
        <div
          className={`px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium ${
            readyToCapture ? "bg-emerald-500/30 text-emerald-100" : "bg-white/20 text-white"
          }`}
        >
          {hint}
        </div>
      </div>

      {/* Indicador de documento horizontal */}
      <div
        className="absolute text-center"
        style={{
          left: guideStyle.left,
          width: guideStyle.width,
          top: `calc(${guideStyle.top} + ${guideStyle.height} + 8px)`,
        }}
      >
        <span className="text-white/70 text-xs bg-black/40 px-3 py-1 rounded-full">
          Documento horizontal
        </span>
      </div>
    </div>
  );
}

DocumentGuideOverlay.propTypes = {
  guideRect: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
  }).isRequired,
  detectedCorners: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
    })
  ),
  sideScores: PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number,
  }),
  totalScore: PropTypes.number,
  hint: PropTypes.string,
  readyToCapture: PropTypes.bool,
};

export default DocumentGuideOverlay;
