// src/hooks/useFrameAnalysis.js
import { useState, useCallback, useRef, useEffect } from "react";
import { analyzeFrame, getScaledImageData } from "../utils/imageAnalysis";
import { SCANNER_CONFIG } from "../utils/constants";

export function useFrameAnalysis(options = {}) {
  const {
    videoRef,
    isActive = false,
    fps = SCANNER_CONFIG.analysisFPS,
    onConditionMet,
    stabilityTime = SCANNER_CONFIG.stabilityTime,
    scanArea = SCANNER_CONFIG.scanArea,
  } = options;

  const [analysis, setAnalysis] = useState({
    focus: { score: 0, ok: false, label: "Analizando..." },
    brightness: { score: 0, ok: false, label: "Analizando..." },
    glare: { score: 0, ok: false, label: "Analizando..." },
    alignment: { score: 0, ok: false, label: "Analizando..." },
    documentDetected: false,
    overallOk: false,
    overallScore: 0,
  });

  const [captureReady, setCaptureReady] = useState(false);

  const animationFrameRef = useRef(null);
  const lastAnalysisRef = useRef(0);
  const okStartTimeRef = useRef(null);
  const consecutiveOkFramesRef = useRef(0);
  const hasNotifiedRef = useRef(false);

  const analyzeCurrentFrame = useCallback(() => {
    const video = videoRef?.current;
    if (!video || video.readyState < video.HAVE_CURRENT_DATA) return null;

    try {
      const imageData = getScaledImageData(video, SCANNER_CONFIG.analysisResolution);
      return analyzeFrame(imageData, scanArea);
    } catch (error) {
      console.error("Frame analysis error:", error);
      return null;
    }
  }, [videoRef, scanArea]);

  useEffect(() => {
    if (!isActive || !videoRef?.current) return;

    const interval = 1000 / fps;

    const loop = (timestamp) => {
      if (timestamp - lastAnalysisRef.current >= interval) {
        lastAnalysisRef.current = timestamp;
        const result = analyzeCurrentFrame();

        if (result) {
          setAnalysis(result);

          const isFrameOk =
            result.overallOk &&
            result.documentDetected &&
            result.overallScore >= 0.75 &&
            result.focus.ok &&
            result.glare.ok;

          if (isFrameOk) {
            consecutiveOkFramesRef.current++;
            if (!okStartTimeRef.current) {
              okStartTimeRef.current = timestamp;
            }

            const timeElapsed = timestamp - okStartTimeRef.current;
            const hasEnoughFrames =
              consecutiveOkFramesRef.current >= SCANNER_CONFIG.minConsecutiveFrames;
            const hasStableTime = timeElapsed >= stabilityTime;

            if (hasEnoughFrames && hasStableTime && !hasNotifiedRef.current) {
              setCaptureReady(true);
              hasNotifiedRef.current = true;
              if (onConditionMet) onConditionMet(result);
            }
          } else {
            consecutiveOkFramesRef.current = 0;
            okStartTimeRef.current = null;
            hasNotifiedRef.current = false;
            setCaptureReady(false);
          }
        }
      }

      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isActive, fps, stabilityTime, analyzeCurrentFrame, onConditionMet, videoRef]);

  const reset = useCallback(() => {
    okStartTimeRef.current = null;
    consecutiveOkFramesRef.current = 0;
    hasNotifiedRef.current = false;
    setCaptureReady(false);
    setAnalysis({
      focus: { score: 0, ok: false, label: "Analizando..." },
      brightness: { score: 0, ok: false, label: "Analizando..." },
      glare: { score: 0, ok: false, label: "Analizando..." },
      alignment: { score: 0, ok: false, label: "Analizando..." },
      documentDetected: false,
      overallOk: false,
      overallScore: 0,
    });
  }, []);

  return { analysis, captureReady, reset, analyzeCurrentFrame };
}

export default useFrameAnalysis;

// // import { useState, useCallback, useRef, useEffect } from "react";
// import { useState, useCallback, useRef, useEffect } from "react";
// import { analyzeFrame, getScaledImageData } from "../utils/imageAnalysis";
// import { SCANNER_CONFIG } from "../utils/constants";

// /**
//  * Hook para analizar frames en tiempo real y detectar condiciones de captura
//  */
// export function useFrameAnalysis(options = {}) {
//   const {
//     videoRef,
//     isActive = false,
//     fps = SCANNER_CONFIG.analysisFPS,
//     onConditionMet,
//     stabilityTime = SCANNER_CONFIG.stabilityTime,
//   } = options;

//   const [analysis, setAnalysis] = useState({
//     focus: { score: 0, ok: false, label: "Analizando..." },
//     brightness: { score: 0, ok: false, label: "Analizando..." },
//     glare: { score: 0, ok: false, label: "Analizando..." },
//     alignment: { score: 0, ok: false, label: "Analizando..." },
//     documentDetected: false,
//     overallOk: false,
//     overallScore: 0,
//   });

//   const [captureReady, setCaptureReady] = useState(false);

//   const animationFrameRef = useRef(null);
//   const lastAnalysisRef = useRef(0);
//   const okStartTimeRef = useRef(null);
//   const canvasRef = useRef(null);
//   const consecutiveOkFramesRef = useRef(0);
//   const hasNotifiedRef = useRef(false);

//   // Inicializar canvas para análisis
//   useEffect(() => {
//     if (!canvasRef.current) {
//       canvasRef.current = document.createElement("canvas");
//     }
//   }, []);

//   // Analizar un frame
//   const analyzeCurrentFrame = useCallback(() => {
//     const video = videoRef?.current;

//     if (!video || video.readyState < video.HAVE_CURRENT_DATA) {
//       return null;
//     }

//     try {
//       // Obtener ImageData escalado para mejor performance
//       const imageData = getScaledImageData(video, SCANNER_CONFIG.analysisResolution);

//       // Analizar
//       const result = analyzeFrame(imageData);

//       return result;
//     } catch (error) {
//       console.error("Frame analysis error:", error);
//       return null;
//     }
//   }, [videoRef]);

//   // Loop de análisis
//   useEffect(() => {
//     if (!isActive || !videoRef?.current) {
//       return;
//     }

//     const interval = 1000 / fps;

//     const loop = (timestamp) => {
//       // Throttle según FPS configurado
//       if (timestamp - lastAnalysisRef.current >= interval) {
//         lastAnalysisRef.current = timestamp;

//         const result = analyzeCurrentFrame();

//         if (result) {
//           setAnalysis(result);

//           // ✅ CAMBIO CLAVE: Verificar condiciones más estrictas
//           const isFrameOk =
//             result.overallOk && result.documentDetected && result.overallScore >= 0.85;

//           if (isFrameOk) {
//             // Incrementar contador de frames consecutivos OK
//             consecutiveOkFramesRef.current++;

//             // Iniciar timer si es el primer frame OK
//             if (!okStartTimeRef.current) {
//               okStartTimeRef.current = timestamp;
//             }

//             // ✅ NUEVAS CONDICIONES: Requiere múltiples frames consecutivos OK
//             const timeElapsed = timestamp - okStartTimeRef.current;
//             const hasEnoughConsecutiveFrames = consecutiveOkFramesRef.current >= 3;
//             const hasStableTime = timeElapsed >= stabilityTime;

//             if (hasEnoughConsecutiveFrames && hasStableTime && !hasNotifiedRef.current) {
//               // Condición OK mantenida por el tiempo requerido Y suficientes frames
//               setCaptureReady(true);
//               hasNotifiedRef.current = true;

//               if (onConditionMet) {
//                 onConditionMet(result);
//               }
//             }
//           } else {
//             // ✅ Reset inmediato si las condiciones no se cumplen
//             consecutiveOkFramesRef.current = 0;
//             okStartTimeRef.current = null;
//             hasNotifiedRef.current = false;
//             setCaptureReady(false);
//           }
//         }
//       }

//       if (isActive) {
//         animationFrameRef.current = requestAnimationFrame(loop);
//       }
//     };

//     animationFrameRef.current = requestAnimationFrame(loop);

//     return () => {
//       if (animationFrameRef.current) {
//         cancelAnimationFrame(animationFrameRef.current);
//       }
//     };
//   }, [isActive, fps, stabilityTime, analyzeCurrentFrame, onConditionMet, videoRef]);

//   // Reset estado
//   const reset = useCallback(() => {
//     okStartTimeRef.current = null;
//     consecutiveOkFramesRef.current = 0;
//     hasNotifiedRef.current = false;
//     setCaptureReady(false);
//     setAnalysis({
//       focus: { score: 0, ok: false, label: "Analizando..." },
//       brightness: { score: 0, ok: false, label: "Analizando..." },
//       glare: { score: 0, ok: false, label: "Analizando..." },
//       alignment: { score: 0, ok: false, label: "Analizando..." },
//       documentDetected: false,
//       overallOk: false,
//       overallScore: 0,
//     });
//   }, []);

//   // Calcular progreso de estabilidad (0-1)
//   const stabilityProgress = useCallback(() => {
//     if (!okStartTimeRef.current) return 0;
//     const elapsed = performance.now() - okStartTimeRef.current;
//     return Math.min(elapsed / stabilityTime, 1);
//   }, [stabilityTime]);

//   return {
//     analysis,
//     captureReady,
//     reset,
//     stabilityProgress,
//     analyzeCurrentFrame,
//   };
// }

// export default useFrameAnalysis;

// // import { useState, useCallback, useRef, useEffect } from "react";
// // import { analyzeFrame, getScaledImageData } from "../utils/imageAnalysis";
// // import { SCANNER_CONFIG } from "../utils/constants";

// // /**
// //  * Hook para analizar frames en tiempo real y detectar condiciones de captura
// //  */
// // export function useFrameAnalysis(options = {}) {
// //   const {
// //     videoRef,
// //     isActive = false,
// //     fps = SCANNER_CONFIG.analysisFPS,
// //     onConditionMet,
// //     stabilityTime = SCANNER_CONFIG.stabilityTime,
// //   } = options;

// //   const [analysis, setAnalysis] = useState({
// //     focus: { score: 0, ok: false, label: "Analizando..." },
// //     brightness: { score: 0, ok: false, label: "Analizando..." },
// //     glare: { score: 0, ok: false, label: "Analizando..." },
// //     alignment: { score: 0, ok: false, label: "Analizando..." },
// //     documentDetected: false,
// //     overallOk: false,
// //     overallScore: 0,
// //   });

// //   const [captureReady, setCaptureReady] = useState(false);

// //   const animationFrameRef = useRef(null);
// //   const lastAnalysisRef = useRef(0);
// //   const okStartTimeRef = useRef(null);
// //   const canvasRef = useRef(null);

// //   // Inicializar canvas para análisis
// //   useEffect(() => {
// //     if (!canvasRef.current) {
// //       canvasRef.current = document.createElement("canvas");
// //     }
// //   }, []);

// //   // Analizar un frame
// //   const analyzeCurrentFrame = useCallback(() => {
// //     const video = videoRef?.current;

// //     if (!video || video.readyState < video.HAVE_CURRENT_DATA) {
// //       return null;
// //     }

// //     try {
// //       // Obtener ImageData escalado para mejor performance
// //       const imageData = getScaledImageData(video, SCANNER_CONFIG.analysisResolution);

// //       // Analizar
// //       const result = analyzeFrame(imageData);

// //       return result;
// //     } catch (error) {
// //       console.error("Frame analysis error:", error);
// //       return null;
// //     }
// //   }, [videoRef]);

// //   // Loop de análisis
// //   useEffect(() => {
// //     if (!isActive || !videoRef?.current) {
// //       return;
// //     }

// //     const interval = 1000 / fps;

// //     const loop = (timestamp) => {
// //       // Throttle según FPS configurado
// //       if (timestamp - lastAnalysisRef.current >= interval) {
// //         lastAnalysisRef.current = timestamp;

// //         const result = analyzeCurrentFrame();

// //         if (result) {
// //           setAnalysis(result);

// //           // Verificar estabilidad para auto-capture
// //           if (result.overallOk) {
// //             if (!okStartTimeRef.current) {
// //               okStartTimeRef.current = timestamp;
// //             } else if (timestamp - okStartTimeRef.current >= stabilityTime) {
// //               // Condición OK mantenida por el tiempo requerido
// //               setCaptureReady(true);
// //               if (onConditionMet) {
// //                 onConditionMet(result);
// //               }
// //             }
// //           } else {
// //             // Reset timer si las condiciones no se cumplen
// //             okStartTimeRef.current = null;
// //             setCaptureReady(false);
// //           }
// //         }
// //       }

// //       if (isActive) {
// //         animationFrameRef.current = requestAnimationFrame(loop);
// //       }
// //     };

// //     animationFrameRef.current = requestAnimationFrame(loop);

// //     return () => {
// //       if (animationFrameRef.current) {
// //         cancelAnimationFrame(animationFrameRef.current);
// //       }
// //     };
// //   }, [isActive, fps, stabilityTime, analyzeCurrentFrame, onConditionMet, videoRef]);

// //   // Reset estado
// //   const reset = useCallback(() => {
// //     okStartTimeRef.current = null;
// //     setCaptureReady(false);
// //     setAnalysis({
// //       focus: { score: 0, ok: false, label: "Analizando..." },
// //       brightness: { score: 0, ok: false, label: "Analizando..." },
// //       glare: { score: 0, ok: false, label: "Analizando..." },
// //       alignment: { score: 0, ok: false, label: "Analizando..." },
// //       documentDetected: false,
// //       overallOk: false,
// //       overallScore: 0,
// //     });
// //   }, []);

// //   // Calcular progreso de estabilidad (0-1)
// //   const stabilityProgress = useCallback(() => {
// //     if (!okStartTimeRef.current) return 0;
// //     const elapsed = performance.now() - okStartTimeRef.current;
// //     return Math.min(elapsed / stabilityTime, 1);
// //   }, [stabilityTime]);

// //   return {
// //     analysis,
// //     captureReady,
// //     reset,
// //     stabilityProgress,
// //     analyzeCurrentFrame,
// //   };
// // }

// // export default useFrameAnalysis;
