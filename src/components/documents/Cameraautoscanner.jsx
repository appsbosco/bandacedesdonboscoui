// src/components/scanner/CameraAutoScanner.js
import React, { useState, useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useCamera } from "../../hooks/useCamera";
import { useFrameAnalysis } from "../../hooks/useFrameAnalysis";
import { processScannedDocument } from "../../utils/imageProcessing";
import { SCANNER_CONFIG, SCANNER_MESSAGES } from "../../utils/constants";
import ScannerOverlay from "./ScannerOverlay";
import QualityIndicators from "./QualityIndicators";

export function CameraAutoScanner({ onCapture, onCancel, documentType = "PASSPORT" }) {
  const [phase, setPhase] = useState("initializing");
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);

  const cameraStartTimeRef = useRef(0);

  const {
    videoRef,
    isReady: cameraReady,
    error: cameraError,
    startCamera,
    stopCamera,
  } = useCamera({
    facingMode: "environment",
    idealWidth: 1920,
    idealHeight: 1080,
  });

  const { analysis, reset: resetAnalysis } = useFrameAnalysis({
    videoRef,
    isActive: phase === "scanning" && cameraReady,
    scanArea: SCANNER_CONFIG.scanArea,
  });

  useEffect(() => {
    cameraStartTimeRef.current = Date.now();
    startCamera()
      .then(() => {
        setTimeout(() => setPhase("scanning"), 500);
      })
      .catch((err) => {
        setError(cameraError || err.message);
      });

    return () => stopCamera();
  }, []);

  const handleManualCapture = useCallback(() => {
    if (phase !== "scanning" || !videoRef.current) return;

    if (!analysis.documentDetected) {
      return;
    }

    if (Date.now() - cameraStartTimeRef.current < SCANNER_CONFIG.warmupTime) {
      return;
    }

    setPhase("capturing");

    setTimeout(() => {
      try {
        const processedCanvas = processScannedDocument(videoRef.current, SCANNER_CONFIG.scanArea, {
          enhance: false,
        });
        setCapturedImage(processedCanvas);
        setPhase("captured");
        if (onCapture) onCapture(processedCanvas);
      } catch (err) {
        console.error("Capture error:", err);
        setError("Error al capturar la imagen");
        setPhase("scanning");
      }
    }, 200);
  }, [phase, videoRef, analysis.documentDetected, onCapture]);

  const handleRetry = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    setPhase("scanning");
    cameraStartTimeRef.current = Date.now();
    resetAnalysis();
  }, [resetAnalysis]);

  if (error || cameraError) {
    return (
      <div className="camera-fullscreen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Error de Cámara</h2>
        <p className="text-slate-300 mb-6 max-w-sm">{error || cameraError}</p>
        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={() => {
              setError(null);
              startCamera();
            }}
            className="w-full py-3 px-6 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-2xl transition-colors"
          >
            Reintentar
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-fullscreen bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${
          phase === "captured" ? "hidden" : ""
        }`}
      />

      {phase === "captured" && capturedImage && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <canvas
            ref={(el) => {
              if (el && capturedImage) {
                const ctx = el.getContext("2d");
                el.width = capturedImage.width;
                el.height = capturedImage.height;
                ctx.drawImage(capturedImage, 0, 0);
              }
            }}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {phase === "scanning" && (
        <ScannerOverlay
          scanArea={SCANNER_CONFIG.scanArea}
          isReady={analysis.overallOk}
          isCapturing={false}
        />
      )}

      {phase === "scanning" && <QualityIndicators analysis={analysis} />}

      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20">
        <button
          onClick={onCancel}
          className="p-3 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div
          className={`px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium ${
            phase === "initializing"
              ? "bg-sky-500/30 text-sky-100"
              : phase === "scanning"
              ? "bg-white/20 text-white"
              : phase === "capturing"
              ? "bg-emerald-500/30 text-emerald-100"
              : "bg-emerald-500/30 text-emerald-100"
          }`}
        >
          {phase === "initializing" && SCANNER_MESSAGES.initializing}
          {phase === "scanning" &&
            (analysis.overallOk ? SCANNER_MESSAGES.focusing : SCANNER_MESSAGES.ready)}
          {phase === "capturing" && SCANNER_MESSAGES.capturing}
          {phase === "captured" && SCANNER_MESSAGES.success}
        </div>
      </div>

      {phase === "scanning" && (
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center z-20">
          <p className="text-white/80 text-sm mb-4 text-center">
            {analysis.documentDetected
              ? "Presiona el botón para capturar"
              : "Coloca el documento horizontal dentro del marco"}
          </p>

          <button
            onClick={handleManualCapture}
            disabled={!analysis.documentDetected}
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
              analysis.overallOk
                ? "border-emerald-400 bg-emerald-400/20 scale-110"
                : analysis.documentDetected
                ? "border-white bg-white/20 hover:bg-white/30"
                : "border-white/30 bg-white/5 opacity-50 cursor-not-allowed"
            }`}
          >
            <div
              className={`w-14 h-14 rounded-full transition-all duration-300 ${
                analysis.overallOk ? "bg-emerald-400" : "bg-white"
              }`}
            />
          </button>

          <p className="text-white/50 text-xs mt-3">Toca para capturar</p>
        </div>
      )}

      {phase === "capturing" && (
        <div className="absolute inset-0 bg-white/30 z-30 animate-fade-in flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 mx-auto animate-pulse">
              <svg
                className="w-8 h-8 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-white font-medium text-lg">{SCANNER_MESSAGES.capturing}</p>
          </div>
        </div>
      )}
    </div>
  );
}

CameraAutoScanner.propTypes = {
  onCapture: PropTypes.func,
  onCancel: PropTypes.func,
  documentType: PropTypes.string,
};

export default CameraAutoScanner;

// import React, { useState, useCallback, useEffect, useRef } from "react";
// import { useCamera } from "../../hooks/useCamera";
// import { useFrameAnalysis } from "../../hooks/useFrameAnalysis";
// import { processScannedDocument } from "../../utils/imageProcessing";
// import { SCANNER_CONFIG, SCANNER_MESSAGES } from "../../utils/constants";
// import ScannerOverlay from "./ScannerOverlay";
// import QualityIndicators from "./QualityIndicators.jsx";
// import PropTypes from "prop-types";

// /**
//  * CameraAutoScanner - Componente principal del escáner con captura automática
//  */
// export function CameraAutoScanner({ onCapture, onCancel, documentType = "PASSPORT" }) {
//   const [phase, setPhase] = useState("initializing");
//   const [capturedImage, setCapturedImage] = useState(null);
//   const [error, setError] = useState(null);

//   const captureTimeoutRef = useRef(null);
//   const hasTriggeredCaptureRef = useRef(false);
//   const analysisRef = useRef(null);
//   const cameraStartTimeRef = useRef(0);

//   // Hook de cámara
//   const {
//     videoRef,
//     isInitializing,
//     isReady: cameraReady,
//     error: cameraError,
//     startCamera,
//     stopCamera,
//   } = useCamera({
//     facingMode: "environment",
//     idealWidth: 1920,
//     idealHeight: 1080,
//   });

//   // Hook de análisis de frames
//   const {
//     analysis,
//     captureReady,
//     reset: resetAnalysis,
//   } = useFrameAnalysis({
//     videoRef,
//     isActive: phase === "scanning" && cameraReady,
//     onConditionMet: () => {
//       const a = analysisRef.current;

//       // ✅ WARMUP PERIOD: Evitar captura en los primeros 2 segundos
//       const WARMUP_TIME = 2000;
//       if (Date.now() - cameraStartTimeRef.current < WARMUP_TIME) {
//         console.log("⏳ Warmup period, skipping capture");
//         return;
//       }

//       // ✅ VALIDACIONES ESTRICTAS pero no extremas
//       if (!a?.documentDetected) {
//         console.log("❌ No document detected");
//         return;
//       }

//       if (!a?.overallOk) {
//         console.log("❌ Overall not OK");
//         return;
//       }

//       if (typeof a?.overallScore === "number" && a.overallScore < 0.75) {
//         console.log("❌ Score too low:", a.overallScore);
//         return;
//       }

//       // ✅ Solo disparar una vez
//       if (!hasTriggeredCaptureRef.current) {
//         console.log("✅ ALL CONDITIONS MET - Triggering capture");
//         hasTriggeredCaptureRef.current = true;
//         handleAutoCapture();
//       }
//     },
//   });

//   useEffect(() => {
//     analysisRef.current = analysis;
//   }, [analysis]);

//   // Iniciar cámara al montar
//   useEffect(() => {
//     cameraStartTimeRef.current = Date.now();

//     startCamera()
//       .then(() => {
//         // ✅ Esperar un momento adicional antes de comenzar análisis
//         setTimeout(() => {
//           setPhase("scanning");
//         }, 500);
//       })
//       .catch((err) => {
//         setError(cameraError || err.message);
//       });

//     return () => {
//       stopCamera();
//       if (captureTimeoutRef.current) {
//         clearTimeout(captureTimeoutRef.current);
//       }
//     };
//   }, []);

//   // Manejar captura automática
//   const handleAutoCapture = useCallback(() => {
//     if (phase !== "scanning" || !videoRef.current) return;

//     setPhase("capturing");

//     // Pequeño delay visual para feedback
//     captureTimeoutRef.current = setTimeout(() => {
//       try {
//         // Procesar imagen con recorte y mejoras LIGERAS
//         const processedCanvas = processScannedDocument(videoRef.current, SCANNER_CONFIG.scanArea, {
//           enhance: true,
//           targetWidth: 1600,
//           targetHeight: 1200,
//         });

//         setCapturedImage(processedCanvas);
//         setPhase("captured");

//         // Notificar al padre
//         if (onCapture) {
//           onCapture(processedCanvas);
//         }
//       } catch (err) {
//         console.error("Capture error:", err);
//         setError("Error al capturar la imagen");
//         setPhase("scanning");
//         hasTriggeredCaptureRef.current = false;
//       }
//     }, 300);
//   }, [phase, videoRef, onCapture]);

//   // Reintentar
//   const handleRetry = useCallback(() => {
//     setCapturedImage(null);
//     setError(null);
//     setPhase("scanning");
//     hasTriggeredCaptureRef.current = false;
//     cameraStartTimeRef.current = Date.now();
//     resetAnalysis();
//   }, [resetAnalysis]);

//   // Captura manual (fallback)
//   const handleManualCapture = useCallback(() => {
//     if (phase !== "scanning") return;

//     // ✅ Validar que el documento esté detectado antes de captura manual
//     if (!analysis.documentDetected) {
//       console.log("⚠️ Manual capture blocked: No document detected");
//       return;
//     }

//     hasTriggeredCaptureRef.current = true;
//     handleAutoCapture();
//   }, [phase, analysis.documentDetected, handleAutoCapture]);

//   // Render de error de cámara
//   if (error || cameraError) {
//     return (
//       <div className="camera-fullscreen bg-scanner-bg flex flex-col items-center justify-center p-6 text-center">
//         <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
//           <svg
//             className="w-10 h-10 text-red-400"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
//             />
//           </svg>
//         </div>

//         <h2 className="text-xl font-semibold text-white mb-2">Error de Cámara</h2>

//         <p className="text-slate-400 mb-6 max-w-sm">{error || cameraError}</p>

//         <div className="space-y-3 w-full max-w-xs">
//           <button
//             onClick={() => {
//               setError(null);
//               startCamera();
//             }}
//             className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-colors touch-target"
//           >
//             Reintentar
//           </button>

//           <button
//             onClick={onCancel}
//             className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors touch-target"
//           >
//             Cancelar
//           </button>
//         </div>

//         <p className="text-xs text-slate-500 mt-6 max-w-sm">
//           Si el problema persiste, verifica los permisos de cámara en la configuración de tu
//           navegador.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="camera-fullscreen bg-scanner-bg">
//       {/* Video de cámara */}
//       <video
//         ref={videoRef}
//         autoPlay
//         playsInline
//         muted
//         className={`
//           absolute inset-0 w-full h-full object-cover
//           ${phase === "captured" ? "hidden" : ""}
//         `}
//       />

//       {/* Imagen capturada (preview congelado) */}
//       {phase === "captured" && capturedImage && (
//         <div className="absolute inset-0 flex items-center justify-center bg-scanner-bg">
//           <canvas
//             ref={(el) => {
//               if (el && capturedImage) {
//                 const ctx = el.getContext("2d");
//                 el.width = capturedImage.width;
//                 el.height = capturedImage.height;
//                 ctx.drawImage(capturedImage, 0, 0);
//               }
//             }}
//             className="max-w-full max-h-full object-contain"
//           />
//         </div>
//       )}

//       {/* Overlay de escaneo */}
//       {phase === "scanning" && (
//         <ScannerOverlay
//           scanArea={SCANNER_CONFIG.scanArea}
//           isReady={analysis.overallOk}
//           isCapturing={captureReady}
//         />
//       )}

//       {/* Indicadores de calidad */}
//       {phase === "scanning" && <QualityIndicators analysis={analysis} />}

//       {/* Header con botón de cancelar */}
//       <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20">
//         <button
//           onClick={onCancel}
//           className="p-3 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors touch-target"
//         >
//           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M6 18L18 6M6 6l12 12"
//             />
//           </svg>
//         </button>

//         {/* Status badge */}
//         <div
//           className={`
//           px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium
//           ${phase === "initializing" ? "bg-blue-500/30 text-blue-300" : ""}
//           ${phase === "scanning" ? "bg-slate-800/80 text-slate-300" : ""}
//           ${phase === "capturing" ? "bg-green-500/30 text-green-300" : ""}
//           ${phase === "captured" ? "bg-green-500/30 text-green-300" : ""}
//         `}
//         >
//           {phase === "initializing" && SCANNER_MESSAGES.initializing}
//           {phase === "scanning" &&
//             (analysis.overallOk ? SCANNER_MESSAGES.focusing : SCANNER_MESSAGES.ready)}
//           {phase === "capturing" && SCANNER_MESSAGES.capturing}
//           {phase === "captured" && SCANNER_MESSAGES.success}
//         </div>
//       </div>

//       {/* Footer con botón de captura manual */}
//       {phase === "scanning" && (
//         <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center z-20">
//           {/* Instrucción */}
//           <p className="text-slate-400 text-sm mb-4 text-center">
//             {analysis.documentDetected
//               ? "Mantén firme para captura automática"
//               : "Coloca el documento dentro del marco"}
//           </p>

//           {/* Botón de captura manual */}
//           <button
//             onClick={handleManualCapture}
//             disabled={!analysis.documentDetected}
//             className={`
//               w-20 h-20 rounded-full border-4
//               flex items-center justify-center
//               transition-all duration-300
//               touch-target
//               ${
//                 analysis.overallOk
//                   ? "border-green-400 bg-green-400/20 scale-110"
//                   : analysis.documentDetected
//                   ? "border-white/50 bg-white/10 hover:bg-white/20"
//                   : "border-white/20 bg-white/5 opacity-50 cursor-not-allowed"
//               }
//             `}
//           >
//             <div
//               className={`
//               w-14 h-14 rounded-full
//               transition-all duration-300
//               ${analysis.overallOk ? "bg-green-400" : "bg-white/80"}
//             `}
//             />
//           </button>

//           <p className="text-slate-500 text-xs mt-3">Toca para capturar manualmente</p>
//         </div>
//       )}

//       {/* Overlay de capturando */}
//       {phase === "capturing" && (
//         <div className="absolute inset-0 bg-white/30 z-30 animate-fade-in flex items-center justify-center">
//           <div className="text-center">
//             <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 mx-auto animate-pulse">
//               <svg
//                 className="w-8 h-8 text-green-600"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M5 13l4 4L19 7"
//                 />
//               </svg>
//             </div>
//             <p className="text-white font-medium text-lg">{SCANNER_MESSAGES.capturing}</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default CameraAutoScanner;

// CameraAutoScanner.propTypes = {
//   onCapture: PropTypes.func,
//   onCancel: PropTypes.func,
//   documentType: PropTypes.string,
// };

// CameraAutoScanner.defaultProps = {
//   documentType: "PASSPORT",
// };

// // import React, { useState, useCallback, useEffect, useRef } from "react";
// // import { useCamera } from "../../hooks/useCamera";
// // import { useFrameAnalysis } from "../../hooks/useFrameAnalysis";
// // import { processScannedDocument } from "../../utils/imageProcessing";
// // import { SCANNER_CONFIG, SCANNER_MESSAGES } from "../../utils/constants";
// // import ScannerOverlay from "./ScannerOverlay";
// // import QualityIndicators from "./QualityIndicators.jsx";
// // import PropTypes from "prop-types";

// // /**
// //  * CameraAutoScanner - Componente principal del escáner con captura automática
// //  */
// // export function CameraAutoScanner({ onCapture, onCancel, documentType = "PASSPORT" }) {
// //   const [phase, setPhase] = useState("initializing"); // initializing, scanning, capturing, captured
// //   const [capturedImage, setCapturedImage] = useState(null);
// //   const [error, setError] = useState(null);

// //   const captureTimeoutRef = useRef(null);
// //   const hasTriggeredCaptureRef = useRef(false);
// //   const analysisRef = useRef(null);
// //   const scanningStartedAtRef = useRef(0);

// //   // Hook de cámara
// //   const {
// //     videoRef,
// //     isInitializing,
// //     isReady: cameraReady,
// //     error: cameraError,
// //     startCamera,
// //     stopCamera,
// //   } = useCamera({
// //     facingMode: "environment",
// //     idealWidth: 1920,
// //     idealHeight: 1080,
// //   });

// //   // Hook de análisis de frames
// //   const {
// //     analysis,
// //     captureReady,
// //     reset: resetAnalysis,
// //   } = useFrameAnalysis({
// //     videoRef,
// //     isActive: phase === "scanning" && cameraReady,
// //     onConditionMet: () => {
// //       const a = analysisRef.current;

// //       // 1) warmup (evita captura inmediata al arrancar cámara)
// //       const warmupMs = 900;
// //       if (Date.now() - scanningStartedAtRef.current < warmupMs) return;

// //       // 2) gates duros (sin documento NO hay auto-capture)
// //       if (!a?.documentDetected) return;
// //       if (!a?.overallOk) return;

// //       // 3) opcional: score mínimo
// //       if (typeof a?.overallScore === "number" && a.overallScore < 0.85) return;

// //       // Solo disparar una vez
// //       if (!hasTriggeredCaptureRef.current) {
// //         hasTriggeredCaptureRef.current = true;
// //         handleAutoCapture();
// //       }
// //     },
// //   });

// //   useEffect(() => {
// //     analysisRef.current = analysis;
// //   }, [analysis]);

// //   useEffect(() => {
// //     if (phase === "scanning") {
// //       scanningStartedAtRef.current = Date.now();
// //     }
// //   }, [phase]);

// //   // Iniciar cámara al montar
// //   useEffect(() => {
// //     startCamera()
// //       .then(() => {
// //         setPhase("scanning");
// //       })
// //       .catch((err) => {
// //         setError(cameraError || err.message);
// //       });

// //     return () => {
// //       stopCamera();
// //       if (captureTimeoutRef.current) {
// //         clearTimeout(captureTimeoutRef.current);
// //       }
// //     };
// //   }, []);

// //   // Manejar captura automática
// //   const handleAutoCapture = useCallback(() => {
// //     if (phase !== "scanning" || !videoRef.current) return;

// //     setPhase("capturing");

// //     // Pequeño delay visual para feedback
// //     captureTimeoutRef.current = setTimeout(() => {
// //       try {
// //         // Procesar imagen con recorte y mejoras
// //         const processedCanvas = processScannedDocument(videoRef.current, SCANNER_CONFIG.scanArea, {
// //           enhance: true,
// //           targetWidth: 1600,
// //           targetHeight: 1200,
// //         });

// //         setCapturedImage(processedCanvas);
// //         setPhase("captured");

// //         // Notificar al padre
// //         if (onCapture) {
// //           onCapture(processedCanvas);
// //         }
// //       } catch (err) {
// //         console.error("Capture error:", err);
// //         setError("Error al capturar la imagen");
// //         setPhase("scanning");
// //         hasTriggeredCaptureRef.current = false;
// //       }
// //     }, 300);
// //   }, [phase, videoRef, onCapture]);

// //   // Reintentar
// //   const handleRetry = useCallback(() => {
// //     setCapturedImage(null);
// //     setError(null);
// //     setPhase("scanning");
// //     hasTriggeredCaptureRef.current = false;
// //     resetAnalysis();
// //   }, [resetAnalysis]);

// //   // Captura manual (fallback)
// //   const handleManualCapture = useCallback(() => {
// //     if (phase !== "scanning") return;
// //     hasTriggeredCaptureRef.current = true;
// //     handleAutoCapture();
// //   }, [phase, handleAutoCapture]);

// //   // Render de error de cámara
// //   if (error || cameraError) {
// //     return (
// //       <div className="camera-fullscreen bg-scanner-bg flex flex-col items-center justify-center p-6 text-center">
// //         <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
// //           <svg
// //             className="w-10 h-10 text-red-400"
// //             fill="none"
// //             viewBox="0 0 24 24"
// //             stroke="currentColor"
// //           >
// //             <path
// //               strokeLinecap="round"
// //               strokeLinejoin="round"
// //               strokeWidth={2}
// //               d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
// //             />
// //           </svg>
// //         </div>

// //         <h2 className="text-xl font-semibold text-white mb-2">Error de Cámara</h2>

// //         <p className="text-slate-400 mb-6 max-w-sm">{error || cameraError}</p>

// //         <div className="space-y-3 w-full max-w-xs">
// //           <button
// //             onClick={() => {
// //               setError(null);
// //               startCamera();
// //             }}
// //             className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-colors touch-target"
// //           >
// //             Reintentar
// //           </button>

// //           <button
// //             onClick={onCancel}
// //             className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors touch-target"
// //           >
// //             Cancelar
// //           </button>
// //         </div>

// //         <p className="text-xs text-slate-500 mt-6 max-w-sm">
// //           Si el problema persiste, verifica los permisos de cámara en la configuración de tu
// //           navegador.
// //         </p>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="camera-fullscreen bg-scanner-bg">
// //       {/* Video de cámara */}
// //       <video
// //         ref={videoRef}
// //         autoPlay
// //         playsInline
// //         muted
// //         className={`
// //           absolute inset-0 w-full h-full object-cover
// //           ${phase === "captured" ? "hidden" : ""}
// //         `}
// //       />

// //       {/* Imagen capturada (preview congelado) */}
// //       {phase === "captured" && capturedImage && (
// //         <div className="absolute inset-0 flex items-center justify-center bg-scanner-bg">
// //           <canvas
// //             ref={(el) => {
// //               if (el && capturedImage) {
// //                 const ctx = el.getContext("2d");
// //                 el.width = capturedImage.width;
// //                 el.height = capturedImage.height;
// //                 ctx.drawImage(capturedImage, 0, 0);
// //               }
// //             }}
// //             className="max-w-full max-h-full object-contain"
// //           />
// //         </div>
// //       )}

// //       {/* Overlay de escaneo */}
// //       {phase === "scanning" && (
// //         <ScannerOverlay
// //           scanArea={SCANNER_CONFIG.scanArea}
// //           isReady={analysis.overallOk}
// //           isCapturing={captureReady}
// //         />
// //       )}

// //       {/* Indicadores de calidad */}
// //       {phase === "scanning" && <QualityIndicators analysis={analysis} />}

// //       {/* Header con botón de cancelar */}
// //       <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20">
// //         <button
// //           onClick={onCancel}
// //           className="p-3 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors touch-target"
// //         >
// //           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //             <path
// //               strokeLinecap="round"
// //               strokeLinejoin="round"
// //               strokeWidth={2}
// //               d="M6 18L18 6M6 6l12 12"
// //             />
// //           </svg>
// //         </button>

// //         {/* Status badge */}
// //         <div
// //           className={`
// //           px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium
// //           ${phase === "initializing" ? "bg-blue-500/30 text-blue-300" : ""}
// //           ${phase === "scanning" ? "bg-slate-800/80 text-slate-300" : ""}
// //           ${phase === "capturing" ? "bg-green-500/30 text-green-300" : ""}
// //           ${phase === "captured" ? "bg-green-500/30 text-green-300" : ""}
// //         `}
// //         >
// //           {phase === "initializing" && SCANNER_MESSAGES.initializing}
// //           {phase === "scanning" &&
// //             (analysis.overallOk ? SCANNER_MESSAGES.focusing : SCANNER_MESSAGES.ready)}
// //           {phase === "capturing" && SCANNER_MESSAGES.capturing}
// //           {phase === "captured" && SCANNER_MESSAGES.success}
// //         </div>
// //       </div>

// //       {/* Footer con botón de captura manual */}
// //       {phase === "scanning" && (
// //         <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center z-20">
// //           {/* Instrucción */}
// //           <p className="text-slate-400 text-sm mb-4 text-center">
// //             {analysis.documentDetected
// //               ? "Mantén firme para captura automática"
// //               : "Coloca el documento dentro del marco"}
// //           </p>

// //           {/* Botón de captura manual */}
// //           <button
// //             onClick={handleManualCapture}
// //             disabled={!analysis.documentDetected}
// //             className={`
// //               w-20 h-20 rounded-full border-4
// //               flex items-center justify-center
// //               transition-all duration-300
// //               touch-target
// //               ${
// //                 analysis.overallOk
// //                   ? "border-green-400 bg-green-400/20 scale-110"
// //                   : analysis.documentDetected
// //                   ? "border-white/50 bg-white/10 hover:bg-white/20"
// //                   : "border-white/20 bg-white/5 opacity-50 cursor-not-allowed"
// //               }
// //             `}
// //           >
// //             <div
// //               className={`
// //               w-14 h-14 rounded-full
// //               transition-all duration-300
// //               ${analysis.overallOk ? "bg-green-400" : "bg-white/80"}
// //             `}
// //             />
// //           </button>

// //           <p className="text-slate-500 text-xs mt-3">Toca para capturar manualmente</p>
// //         </div>
// //       )}

// //       {/* Overlay de capturando */}
// //       {phase === "capturing" && (
// //         <div className="absolute inset-0 bg-white/30 z-30 animate-fade-in flex items-center justify-center">
// //           <div className="text-center">
// //             <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 mx-auto animate-pulse">
// //               <svg
// //                 className="w-8 h-8 text-green-600"
// //                 fill="none"
// //                 viewBox="0 0 24 24"
// //                 stroke="currentColor"
// //               >
// //                 <path
// //                   strokeLinecap="round"
// //                   strokeLinejoin="round"
// //                   strokeWidth={2}
// //                   d="M5 13l4 4L19 7"
// //                 />
// //               </svg>
// //             </div>
// //             <p className="text-white font-medium text-lg">{SCANNER_MESSAGES.capturing}</p>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // export default CameraAutoScanner;

// // CameraAutoScanner.propTypes = {
// //   onCapture: PropTypes.func,
// //   onCancel: PropTypes.func,
// //   documentType: PropTypes.string,
// // };

// // CameraAutoScanner.defaultProps = {
// //   documentType: "PASSPORT",
// // };
