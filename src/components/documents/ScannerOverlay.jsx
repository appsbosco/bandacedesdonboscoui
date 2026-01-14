// src/components/scanner/ScannerOverlay.js
import React from "react";
import PropTypes from "prop-types";

export function ScannerOverlay({ scanArea, isReady, isCapturing }) {
  const overlayStyle = {
    "--scan-left": `${scanArea.x * 100}%`,
    "--scan-top": `${scanArea.y * 100}%`,
    "--scan-width": `${scanArea.width * 100}%`,
    "--scan-height": `${scanArea.height * 100}%`,
  };

  const cornerColor = isCapturing
    ? "text-emerald-500"
    : isReady
    ? "text-emerald-500"
    : "text-sky-400";

  return (
    <div className="absolute inset-0 z-10 pointer-events-none" style={overlayStyle}>
      <div className="absolute inset-0">
        <div
          className="absolute left-0 right-0 top-0 bg-black/60"
          style={{ height: "var(--scan-top)" }}
        />
        <div
          className="absolute left-0 right-0 bottom-0 bg-black/60"
          style={{ height: `calc(100% - var(--scan-top) - var(--scan-height))` }}
        />
        <div
          className="absolute left-0 bg-black/60"
          style={{
            top: "var(--scan-top)",
            width: "var(--scan-left)",
            height: "var(--scan-height)",
          }}
        />
        <div
          className="absolute right-0 bg-black/60"
          style={{
            top: "var(--scan-top)",
            width: `calc(100% - var(--scan-left) - var(--scan-width))`,
            height: "var(--scan-height)",
          }}
        />
      </div>

      <div
        className="absolute"
        style={{
          left: "var(--scan-left)",
          top: "var(--scan-top)",
          width: "var(--scan-width)",
          height: "var(--scan-height)",
        }}
      >
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

        <div
          className={`absolute inset-0 border-2 rounded-lg transition-colors duration-300 ${
            isCapturing
              ? "border-emerald-400/60"
              : isReady
              ? "border-emerald-400/40"
              : "border-white/30"
          }`}
        />

        {isReady && !isCapturing && (
          <div className="absolute inset-x-0 overflow-hidden h-full rounded-lg">
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line" />
          </div>
        )}

        {isCapturing && (
          <div className="absolute inset-0 rounded-lg border-4 border-emerald-400 animate-pulse" />
        )}

        <div className="absolute inset-x-0 -bottom-8 text-center">
          <span className="text-white/80 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
            Documento horizontal
          </span>
        </div>
      </div>
    </div>
  );
}

ScannerOverlay.propTypes = {
  scanArea: PropTypes.object.isRequired,
  isReady: PropTypes.bool,
  isCapturing: PropTypes.bool,
};

export default ScannerOverlay;

// import React from "react";

// /**
//  * ScannerOverlay - Marco visual para alinear el documento
//  */
// export function ScannerOverlay({ scanArea, isReady, isCapturing }) {
//   // Convertir área de escaneo a porcentajes CSS
//   const overlayStyle = {
//     "--scan-left": `${scanArea.x * 100}%`,
//     "--scan-top": `${scanArea.y * 100}%`,
//     "--scan-width": `${scanArea.width * 100}%`,
//     "--scan-height": `${scanArea.height * 100}%`,
//   };

//   const cornerColor = isCapturing
//     ? "text-green-400"
//     : isReady
//     ? "text-green-400"
//     : "text-scanner-guide";

//   return (
//     <div className="absolute inset-0 z-10 pointer-events-none" style={overlayStyle}>
//       {/* Oscurecer áreas fuera del marco */}
//       <div className="absolute inset-0">
//         {/* Top */}
//         <div
//           className="absolute left-0 right-0 top-0 bg-scanner-overlay"
//           style={{ height: "var(--scan-top)" }}
//         />
//         {/* Bottom */}
//         <div
//           className="absolute left-0 right-0 bottom-0 bg-scanner-overlay"
//           style={{ height: `calc(100% - var(--scan-top) - var(--scan-height))` }}
//         />
//         {/* Left */}
//         <div
//           className="absolute left-0 bg-scanner-overlay"
//           style={{
//             top: "var(--scan-top)",
//             width: "var(--scan-left)",
//             height: "var(--scan-height)",
//           }}
//         />
//         {/* Right */}
//         <div
//           className="absolute right-0 bg-scanner-overlay"
//           style={{
//             top: "var(--scan-top)",
//             width: `calc(100% - var(--scan-left) - var(--scan-width))`,
//             height: "var(--scan-height)",
//           }}
//         />
//       </div>

//       {/* Marco de escaneo */}
//       <div
//         className="absolute"
//         style={{
//           left: "var(--scan-left)",
//           top: "var(--scan-top)",
//           width: "var(--scan-width)",
//           height: "var(--scan-height)",
//         }}
//       >
//         {/* Esquinas animadas */}
//         <div
//           className={`scanner-corner scanner-corner-tl ${cornerColor} transition-colors duration-300`}
//         />
//         <div
//           className={`scanner-corner scanner-corner-tr ${cornerColor} transition-colors duration-300`}
//         />
//         <div
//           className={`scanner-corner scanner-corner-bl ${cornerColor} transition-colors duration-300`}
//         />
//         <div
//           className={`scanner-corner scanner-corner-br ${cornerColor} transition-colors duration-300`}
//         />

//         {/* Borde sutil */}
//         <div
//           className={`
//           absolute inset-0 border-2 rounded-lg
//           transition-colors duration-300
//           ${
//             isCapturing
//               ? "border-green-400/50"
//               : isReady
//               ? "border-green-400/30"
//               : "border-white/20"
//           }
//         `}
//         />

//         {/* Línea de escaneo animada (solo cuando está listo) */}
//         {isReady && !isCapturing && (
//           <div className="absolute inset-x-0 overflow-hidden h-full rounded-lg">
//             <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan-line" />
//           </div>
//         )}

//         {/* Indicador de captura */}
//         {isCapturing && (
//           <div className="absolute inset-0 rounded-lg border-4 border-green-400 animate-pulse" />
//         )}
//       </div>

//       {/* Guías de alineación sutiles */}
//       <div
//         className="absolute opacity-30"
//         style={{
//           left: "var(--scan-left)",
//           top: "var(--scan-top)",
//           width: "var(--scan-width)",
//           height: "var(--scan-height)",
//         }}
//       >
//         {/* Línea central horizontal */}
//         <div className="absolute left-0 right-0 top-1/2 h-px bg-white/30" />
//         {/* Línea central vertical */}
//         <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/30" />
//       </div>
//     </div>
//   );
// }

// export default ScannerOverlay;
