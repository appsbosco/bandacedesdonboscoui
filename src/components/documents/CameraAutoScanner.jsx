import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import { useCamera } from "../../hooks/useCamera";
import { useFrameAnalysis } from "../../hooks/useFrameAnalysis";
import { processScannedDocument } from "../../utils/imageProcessing";
import { rectifyDocument } from "../../utils/perspectiveTransform";
import { SCANNER_CONFIG, SCANNER_MESSAGES, getDocumentTypeInfo, computeScanArea } from "../../utils/constants";
import ScannerOverlay from "./ScannerOverlay";
import QualityIndicators from "./QualityIndicators";

/**
 * CameraAutoScanner — mobile-first document capture component.
 *
 * Key design decisions:
 * - Scan area computed dynamically from document aspect ratio + screen size
 * - Video fills viewport via object-cover; overlay compensates for crop offset
 * - Perspective correction when 4 corners detected
 * - Auto-capture with manual fallback
 * - captureMeta contract matches backend schema
 */
export function CameraAutoScanner({ onCapture, onCancel, documentType = "PASSPORT" }) {
  const [phase, setPhase] = useState("initializing");
  const [error, setError] = useState(null);
  const [viewportSize, setViewportSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const cameraStartTimeRef = useRef(0);
  const hasTriggeredCaptureRef = useRef(false);
  const lastAnalysisRef = useRef(null);
  const isMountedRef = useRef(true);
  const timeoutIdsRef = useRef([]);

  const docInfo = getDocumentTypeInfo(documentType);

  // Compute scan area based on document type and screen dimensions
  const scanArea = useMemo(() => {
    const ratio = SCANNER_CONFIG.aspectRatios?.[String(documentType).toUpperCase()] || docInfo?.aspectRatio || 1.42;
    return computeScanArea(ratio, viewportSize.w, viewportSize.h);
  }, [documentType, docInfo, viewportSize]);

  // Track viewport size for responsive scan area
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const safeTimeout = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      if (!isMountedRef.current) return;
      fn();
    }, ms);
    timeoutIdsRef.current.push(id);
    return id;
  }, []);

  const {
    videoRef,
    isReady: cameraReady,
    error: cameraError,
    startCamera,
    stopCamera,
  } = useCamera({
    facingMode: "environment",
    // Request higher resolution for better OCR/MRZ quality
    idealWidth: 1920,
    idealHeight: 1080,
  });

  const processCapture = useCallback(
    (analysisData) => {
      if (!videoRef.current) return null;

      try {
        if (analysisData?.normalizedCorners?.length === 4) {
          const ratio =
            SCANNER_CONFIG.aspectRatios?.[String(documentType).toUpperCase()] ||
            docInfo?.aspectRatio ||
            1.42;

          return rectifyDocument(videoRef.current, analysisData.normalizedCorners, {
            aspectRatio: ratio,
            padding: 10,
          });
        }

        return processScannedDocument(videoRef.current, scanArea, {
          enhance: false,
          viewportW: viewportSize.w,
          viewportH: viewportSize.h,
        });
      } catch (err) {
        console.error("[scanner] capture processing error:", err);
        return processScannedDocument(videoRef.current, scanArea, {
          enhance: false,
          viewportW: viewportSize.w,
          viewportH: viewportSize.h,
        });
      }
    },
    [videoRef, documentType, docInfo, scanArea, viewportSize]
  );

  const buildCaptureMeta = useCallback(
    (analysisData) => {
      const video = videoRef.current;
      return {
        device: navigator.userAgent,
        browser: navigator.userAgent,
        w: video?.videoWidth || 0,
        h: video?.videoHeight || 0,
        blurVar: analysisData?.focus?.score ?? null,
        glarePct: analysisData?.glare?.percent ?? null,
        capturedAt: new Date().toISOString(),
      };
    },
    [videoRef]
  );

  const handleAutoCapture = useCallback(() => {
    if (phase !== "scanning" || !videoRef.current || hasTriggeredCaptureRef.current) return;
    if (Date.now() - cameraStartTimeRef.current < SCANNER_CONFIG.warmupTime) return;

    hasTriggeredCaptureRef.current = true;
    setPhase("capturing");

    safeTimeout(() => {
      try {
        const processedCanvas = processCapture(lastAnalysisRef.current);
        if (!processedCanvas) throw new Error("Failed to process capture");

        setPhase("captured");

        if (onCapture) {
          onCapture(processedCanvas, {
            requiresMRZ: !!docInfo?.requiresMRZ,
            documentType,
            hadPerspectiveCorrection: lastAnalysisRef.current?.normalizedCorners?.length === 4,
            scores: lastAnalysisRef.current?.scores,
            captureMeta: buildCaptureMeta(lastAnalysisRef.current),
          });
        }
      } catch (err) {
        console.error("[scanner] capture error:", err);
        setError("Error al capturar la imagen");
        setPhase("scanning");
        hasTriggeredCaptureRef.current = false;
      }
    }, 150);
  }, [phase, videoRef, onCapture, processCapture, buildCaptureMeta, docInfo, documentType, safeTimeout]);

  const { analysis } = useFrameAnalysis({
    videoRef,
    isActive: phase === "scanning" && cameraReady,
    scanArea,
    onConditionMet: (result) => {
      lastAnalysisRef.current = result;
      handleAutoCapture();
    },
  });

  useEffect(() => {
    if (analysis) lastAnalysisRef.current = analysis;
  }, [analysis]);

  useEffect(() => {
    isMountedRef.current = true;
    cameraStartTimeRef.current = Date.now();

    startCamera()
      .then(() => {
        if (isMountedRef.current) {
          safeTimeout(() => setPhase("scanning"), 400);
        }
      })
      .catch((err) => {
        if (isMountedRef.current) {
          setError(cameraError || err.message);
        }
      });

    return () => {
      isMountedRef.current = false;
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualCapture = useCallback(() => {
    if (phase !== "scanning" || !videoRef.current || hasTriggeredCaptureRef.current) return;
    if (!analysis?.documentDetected || !analysis?.captureEnabled) return;
    if (Date.now() - cameraStartTimeRef.current < SCANNER_CONFIG.warmupTime) return;

    hasTriggeredCaptureRef.current = true;
    setPhase("capturing");

    safeTimeout(() => {
      try {
        const processedCanvas = processCapture(analysis);
        if (!processedCanvas) throw new Error("Failed to process capture");

        setPhase("captured");

        if (onCapture) {
          onCapture(processedCanvas, {
            requiresMRZ: !!docInfo?.requiresMRZ,
            documentType,
            hadPerspectiveCorrection: analysis?.normalizedCorners?.length === 4,
            scores: analysis?.scores,
            captureMeta: buildCaptureMeta(analysis),
          });
        }
      } catch (err) {
        console.error("[scanner] manual capture error:", err);
        setError("Error al capturar la imagen");
        setPhase("scanning");
        hasTriggeredCaptureRef.current = false;
      }
    }, 150);
  }, [phase, videoRef, analysis, onCapture, processCapture, buildCaptureMeta, docInfo, documentType, safeTimeout]);

  const getStatusMessage = () => {
    if (phase === "initializing") return SCANNER_MESSAGES.initializing;
    if (phase === "capturing") return SCANNER_MESSAGES.capturing;
    if (phase === "captured") return SCANNER_MESSAGES.success;

    if (phase === "scanning") {
      if (analysis.autoCaptureReady) return "Capturando...";
      if (analysis.captureEnabled) return "Mantene firme...";
      if (analysis.documentDetected) return "Ajusta la posicion";
      return SCANNER_MESSAGES.ready;
    }

    return "";
  };

  if (error || cameraError) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6 text-center safe-area-inset">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Error de Camara</h2>
        <p className="text-slate-300 mb-6 max-w-sm" role="alert" aria-live="assertive">
          {error || cameraError}
        </p>
        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={() => {
              setError(null);
              hasTriggeredCaptureRef.current = false;
              setPhase("initializing");
              cameraStartTimeRef.current = Date.now();
              startCamera()
                .then(() => {
                  if (isMountedRef.current) safeTimeout(() => setPhase("scanning"), 400);
                })
                .catch((retryErr) => {
                  if (isMountedRef.current) setError(retryErr.message);
                });
            }}
            className="w-full py-3 px-6 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-2xl transition-colors min-h-[44px]"
          >
            Reintentar
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-colors min-h-[44px]"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video: fill viewport */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${phase === "captured" ? "hidden" : ""}`}
      />

      {phase === "scanning" && (
        <ScannerOverlay
          scanArea={scanArea}
          isReady={analysis.captureEnabled}
          isCapturing={analysis.autoCaptureReady}
          corners={analysis.normalizedCorners}
          edgeAlignments={analysis.edgeAlignments}
          hint={analysis.hint}
          totalScore={analysis.scores?.totalScore}
        />
      )}

      {phase === "scanning" && <QualityIndicators analysis={analysis} />}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20" style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 16px)" }}>
        <button
          onClick={onCancel}
          className="p-3 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors min-w-[44px] min-h-[44px]"
          aria-label="Cancelar escaneo"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div
          className={`px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium transition-all duration-300 ${
            phase === "initializing"
              ? "bg-sky-500/30 text-sky-100"
              : analysis.autoCaptureReady
              ? "bg-emerald-500/30 text-emerald-100 animate-pulse"
              : analysis.captureEnabled
              ? "bg-emerald-500/30 text-emerald-100"
              : analysis.documentDetected
              ? "bg-amber-500/30 text-amber-100"
              : "bg-white/20 text-white"
          }`}
          role="status"
          aria-live="polite"
        >
          {getStatusMessage()}
        </div>
      </div>

      {/* Bottom bar */}
      {phase === "scanning" && (
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center z-20" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 24px)" }}>
          <p className="text-white/80 text-sm mb-4 text-center">
            {analysis.autoCaptureReady
              ? "Mantene firme, captura automatica..."
              : analysis.captureEnabled
              ? "Listo para capturar!"
              : analysis.documentDetected
              ? "Ajusta posicion para captura automatica"
              : "Coloca el documento dentro del marco"}
          </p>

          <button
            onClick={handleManualCapture}
            disabled={!analysis.captureEnabled}
            aria-label={analysis.captureEnabled ? "Capturar documento" : "Esperando alineacion"}
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
              analysis.autoCaptureReady
                ? "border-emerald-400 bg-emerald-400/30 scale-110 animate-pulse"
                : analysis.captureEnabled
                ? "border-emerald-400 bg-emerald-400/20 hover:bg-emerald-400/30"
                : analysis.documentDetected
                ? "border-white/50 bg-white/10"
                : "border-white/30 bg-white/5 opacity-50 cursor-not-allowed"
            }`}
          >
            <div
              className={`w-14 h-14 rounded-full transition-all duration-300 ${
                analysis.autoCaptureReady
                  ? "bg-emerald-400"
                  : analysis.captureEnabled
                  ? "bg-emerald-400/80"
                  : "bg-white/60"
              }`}
            />
          </button>

          <p className="text-white/50 text-xs mt-3">
            {analysis.autoCaptureReady
              ? "Captura automatica activa"
              : analysis.captureEnabled
              ? "Toca para capturar"
              : "Esperando alineacion..."}
          </p>
        </div>
      )}

      {/* Capture flash */}
      {phase === "capturing" && (
        <div className="absolute inset-0 bg-white/40 z-30 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 mx-auto animate-pulse">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-medium text-lg drop-shadow-lg">
              {SCANNER_MESSAGES.capturing}
            </p>
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

CameraAutoScanner.defaultProps = {
  onCapture: null,
  onCancel: null,
  documentType: "PASSPORT",
};

export default CameraAutoScanner;
