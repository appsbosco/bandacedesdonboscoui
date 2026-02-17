// src/components/scanner/ScannerOverlay.js
import React, { useMemo } from "react";
import PropTypes from "prop-types";

/**
 * Scanner Overlay Component
 *
 * Renders:
 * - Guide rectangle (scanArea)
 * - Detected document polygon
 * - Edge alignment progress (red → yellow → green)
 * - Score indicator
 * - Hint text
 */
export function ScannerOverlay({
  scanArea,
  isReady,
  isCapturing,
  corners,
  edgeAlignments,
  hint,
  totalScore,
}) {
  const overlayStyle = {
    "--scan-left": `${scanArea.x * 100}%`,
    "--scan-top": `${scanArea.y * 100}%`,
    "--scan-width": `${scanArea.width * 100}%`,
    "--scan-height": `${scanArea.height * 100}%`,
  };

  /**
   * Get color for edge based on alignment score
   * 0-0.3: red, 0.3-0.7: yellow, 0.7-1.0: green
   */
  const getEdgeColor = (alignment) => {
    if (isCapturing) return "rgba(52, 211, 153, 0.95)"; // emerald
    if (alignment >= 0.7) return "rgba(52, 211, 153, 0.85)"; // green
    if (alignment >= 0.3) return "rgba(251, 191, 36, 0.8)"; // yellow/amber
    return "rgba(239, 68, 68, 0.7)"; // red
  };

  /**
   * Get corner color based on state
   */
  const cornerColor = isCapturing
    ? "text-emerald-500"
    : isReady
    ? "text-emerald-500"
    : "text-sky-400";

  /**
   * Calculate polygon SVG points from normalized corners
   */
  const polygonPoints = useMemo(() => {
    if (!corners || corners.length !== 4) return null;
    // corners are in pixel coords from detection, need to normalize
    return corners;
  }, [corners]);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none" style={overlayStyle}>
      {/* Dark overlay outside scan area */}
      <div className="absolute inset-0">
        {/* Top */}
        <div
          className="absolute left-0 right-0 top-0 bg-black/60"
          style={{ height: "var(--scan-top)" }}
        />
        {/* Bottom */}
        <div
          className="absolute left-0 right-0 bottom-0 bg-black/60"
          style={{ height: `calc(100% - var(--scan-top) - var(--scan-height))` }}
        />
        {/* Left */}
        <div
          className="absolute left-0 bg-black/60"
          style={{
            top: "var(--scan-top)",
            width: "var(--scan-left)",
            height: "var(--scan-height)",
          }}
        />
        {/* Right */}
        <div
          className="absolute right-0 bg-black/60"
          style={{
            top: "var(--scan-top)",
            width: `calc(100% - var(--scan-left) - var(--scan-width))`,
            height: "var(--scan-height)",
          }}
        />
      </div>

      {/* Guide rectangle frame */}
      <div
        className="absolute"
        style={{
          left: "var(--scan-left)",
          top: "var(--scan-top)",
          width: "var(--scan-width)",
          height: "var(--scan-height)",
        }}
      >
        {/* Animated corner brackets */}
        <div
          className={`scanner-corner scanner-corner-tl ${cornerColor} transition-colors duration-300`}
        />
        <div
          className={`scanner-corner scanner-corner-tr ${cornerColor} transition-colors duration-300`}
        />
        <div
          className={`scanner-corner scanner-corner-bl ${cornerColor} transition-colors duration-300`}
        />
        <div
          className={`scanner-corner scanner-corner-br ${cornerColor} transition-colors duration-300`}
        />

        {/* Edge alignment progress bars */}
        {edgeAlignments && (
          <>
            {/* Top edge */}
            <div className="absolute top-0 left-8 right-8 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${edgeAlignments.top * 100}%`,
                  backgroundColor: getEdgeColor(edgeAlignments.top),
                }}
              />
            </div>
            {/* Bottom edge */}
            <div className="absolute bottom-0 left-8 right-8 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${edgeAlignments.bottom * 100}%`,
                  backgroundColor: getEdgeColor(edgeAlignments.bottom),
                }}
              />
            </div>
            {/* Left edge */}
            <div className="absolute left-0 top-8 bottom-8 w-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="w-full rounded-full transition-all duration-300"
                style={{
                  height: `${edgeAlignments.left * 100}%`,
                  backgroundColor: getEdgeColor(edgeAlignments.left),
                }}
              />
            </div>
            {/* Right edge */}
            <div className="absolute right-0 top-8 bottom-8 w-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="w-full rounded-full transition-all duration-300"
                style={{
                  height: `${edgeAlignments.right * 100}%`,
                  backgroundColor: getEdgeColor(edgeAlignments.right),
                }}
              />
            </div>
          </>
        )}

        {/* Main border */}
        <div
          className={`absolute inset-0 border-2 rounded-lg transition-colors duration-300 ${
            isCapturing
              ? "border-emerald-400/70"
              : isReady
              ? "border-emerald-400/50"
              : "border-white/30"
          }`}
        />

        {/* Scan line animation when ready */}
        {isReady && !isCapturing && (
          <div className="absolute inset-x-0 overflow-hidden h-full rounded-lg">
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line" />
          </div>
        )}

        {/* Capture pulse animation */}
        {isCapturing && (
          <div className="absolute inset-0 rounded-lg border-4 border-emerald-400 animate-pulse" />
        )}

        {/* Document type label */}
        <div className="absolute inset-x-0 -bottom-9 text-center">
          <span className="text-white/70 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
            Documento horizontal
          </span>
        </div>
      </div>

      {/* Detected document polygon overlay (SVG) */}
      {polygonPoints && polygonPoints.length === 4 && (
        <svg className="absolute inset-0 w-full h-full overflow-visible">
          <defs>
            <linearGradient id="docGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isReady ? "#34d399" : "#38bdf8"} stopOpacity="0.6" />
              <stop offset="100%" stopColor={isReady ? "#10b981" : "#0ea5e9"} stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Document outline polygon */}
          <polygon
            points={polygonPoints
              .map((c) => {
                // Convert from analysis coords to screen coords
                // corners are normalized 0-1, need to map to viewport
                const x = c.x;
                const y = c.y;
                return `${x * 100}%,${y * 100}%`;
              })
              .join(" ")}
            fill="none"
            stroke={isReady ? "rgba(52, 211, 153, 0.7)" : "rgba(56, 189, 248, 0.6)"}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeDasharray={isReady ? "0" : "12,6"}
            className="transition-all duration-300"
            style={{
              vectorEffect: "non-scaling-stroke",
            }}
          />

          {/* Corner markers */}
          {polygonPoints.map((c, i) => (
            <g key={i}>
              <circle
                cx={`${c.x * 100}%`}
                cy={`${c.y * 100}%`}
                r="8"
                fill={isReady ? "rgba(52, 211, 153, 0.9)" : "rgba(56, 189, 248, 0.8)"}
                className="transition-all duration-300"
              />
              <circle
                cx={`${c.x * 100}%`}
                cy={`${c.y * 100}%`}
                r="4"
                fill="white"
                className="transition-all duration-300"
              />
            </g>
          ))}
        </svg>
      )}

      {/* Hint display */}
      {hint && (
        <div className="absolute bottom-28 left-0 right-0 flex justify-center px-4">
          <div className="bg-black/70 backdrop-blur-sm text-white text-sm font-medium px-5 py-2.5 rounded-full max-w-xs text-center">
            {hint}
          </div>
        </div>
      )}

      {/* Score indicator badge */}
      {typeof totalScore === "number" && totalScore > 0 && (
        <div className="absolute top-4 right-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-300 ${
              totalScore >= 0.9
                ? "bg-emerald-500 text-white"
                : totalScore >= 0.7
                ? "bg-amber-500 text-white"
                : totalScore >= 0.4
                ? "bg-orange-500 text-white"
                : "bg-red-500/80 text-white"
            }`}
          >
            {Math.round(totalScore * 100)}
          </div>
        </div>
      )}
    </div>
  );
}

ScannerOverlay.propTypes = {
  scanArea: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
  }).isRequired,
  isReady: PropTypes.bool,
  isCapturing: PropTypes.bool,
  corners: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
    })
  ),
  edgeAlignments: PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number,
  }),
  hint: PropTypes.string,
  totalScore: PropTypes.number,
};

ScannerOverlay.defaultProps = {
  isReady: false,
  isCapturing: false,
  corners: null,
  edgeAlignments: null,
  hint: "",
  totalScore: 0,
};

export default ScannerOverlay;
