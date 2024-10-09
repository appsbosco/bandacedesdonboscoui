import PropTypes from "prop-types";
import React from "react";

const SemicircleTuner = ({ detune }) => {
  // Define los colores según el rango de afinación
  const getColor = (detuneValue) => {
    if (detuneValue < -20) return "#ff0000"; // Muy bajo - rojo
    if (detuneValue >= -20 && detuneValue < -5) return "#ffcc00"; // Levemente bajo - amarillo
    if (detuneValue >= -5 && detuneValue <= 5) return "#00ff00"; // Afinado - verde
    if (detuneValue > 5 && detuneValue <= 20) return "#ffcc00"; // Levemente alto - amarillo
    return "#ff0000"; // Muy alto - rojo
  };

  return (
    <svg id="Objects" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2200 1466">
      {/* Nivel 1 - Muy bajo */}
      <path
        className="cls-1"
        d="M544.37,1188.1H112.44c.8-103.52,17.53-205.34,49.77-302.76,31.15-94.13,76.29-182.82,134.21-263.71l349.47,253.91c-64.99,91.91-99.99,199.65-101.53,312.56Z"
        fill={detune < -20 ? getColor(detune) : "#ddd"}
      />
      {/* Nivel 2 - Levemente bajo */}
      <path
        className="cls-1"
        d="M772.66,746.78c-44.83,32.74-84.38,71.81-117.62,116.2l-265.71-193.05-83.76-60.86c59.85-80.9,131.37-151.98,212.69-211.35,82.34-60.12,172.84-106.84,269.11-138.93l82.29,253.26,51.22,157.64c-52.98,18.03-102.8,43.95-148.21,77.1Z"
        fill={detune >= -20 && detune < -5 ? getColor(detune) : "#ddd"}
      />
      {/* Nivel 3 - Afinado */}
      <path
        className="cls-1"
        d="M935.64,664.89l-113.2-348.41-20.3-62.49c96-30.34,196.18-45.72,297.87-45.72s201.85,15.38,297.87,45.71l-133.51,410.9c-53.05-16.4-108.29-24.71-164.35-24.71s-111.32,8.31-164.36,24.71Z"
        fill={detune >= -5 && detune <= 5 ? getColor(detune) : "#ddd"}
      />
      {/* Nivel 4 - Levemente alto */}
      <path
        className="cls-1"
        d="M1427.34,746.77c-45.41-33.16-95.23-59.07-148.21-77.09l116.99-360.06,16.52-50.84c96.28,32.1,186.77,78.82,269.11,138.94,81.32,59.37,152.84,130.45,212.69,211.35l-239.13,173.75-110.34,80.16c-33.25-44.39-72.79-83.46-117.63-116.2Z"
        fill={detune > 5 && detune <= 20 ? getColor(detune) : "#ddd"}
      />
      {/* Nivel 5 - Muy alto */}
      <path
        className="cls-1"
        d="M1655.63,1188.1c-1.54-112.91-36.53-220.66-101.53-312.56l349.47-253.91c57.92,80.9,103.06,169.58,134.21,263.71,32.24,97.42,48.97,199.24,49.77,302.76h-431.93Z"
        fill={detune > 20 ? getColor(detune) : "#ddd"}
      />
    </svg>
  );
};

SemicircleTuner.propTypes = {
  detune: PropTypes.number.isRequired,
};

export default SemicircleTuner;
