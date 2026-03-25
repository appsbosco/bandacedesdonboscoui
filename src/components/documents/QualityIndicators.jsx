/* eslint-disable react/prop-types */

import React from "react";
import PropTypes from "prop-types";

function Badge({ label, ok, value }) {
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
      ${ok ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-green-400" : "bg-gray-400"}`} />
      <span>{label}</span>
      {value !== undefined && <span className="opacity-60">{value}</span>}
    </div>
  );
}

/**
 * Displays real-time quality indicators: focus, brightness, glare.
 */
function QualityIndicators({ quality }) {
  const { focusOk, brightnessOk, glareOk, captureReady } = quality;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2 flex-wrap justify-center">
        <Badge label="Enfoque" ok={focusOk} />
        <Badge label="Iluminación" ok={brightnessOk} />
        <Badge label="Sin reflejos" ok={glareOk} />
      </div>
      {captureReady && (
        <p className="text-green-400 text-xs font-semibold animate-pulse">✓ Listo para capturar</p>
      )}
    </div>
  );
}

QualityIndicators.propTypes = {
  quality: PropTypes.shape({
    focusOk: PropTypes.bool,
    brightnessOk: PropTypes.bool,
    glareOk: PropTypes.bool,
    captureReady: PropTypes.bool,
    hint: PropTypes.string,
  }).isRequired,
};

export default QualityIndicators;
