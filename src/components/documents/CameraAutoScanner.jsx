import React, { useCallback, useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useCamera } from "../../hooks/useCamera";
import { useFrameAnalysis } from "../../hooks/useFrameAnalysis";
import { captureFrameBlob } from "../../utils/imageProcessing";
import { DOCUMENT_ASPECT_RATIOS, FRAME_WIDTH_PCT, SCANNER_CONFIG } from "../../utils/constants";
import ScannerOverlay from "./ScannerOverlay";
import QualityIndicators from "./QualityIndicators";

/**
 * Full-screen camera scanner with guided capture.
 * Supported document types: PASSPORT, VISA
 * onCapture(blob, captureMeta) is called after auto or manual capture.
 */
function CameraAutoScanner({ documentType, onCapture, onCancel }) {
  const { videoRef, isReady, error: camError, startCamera, stopCamera } = useCamera();
  const [phase, setPhase] = useState("initializing"); // initializing | scanning | captured
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const autoCapturedRef = useRef(false);
  const warmupDoneRef = useRef(false);
  const warmupTimer = useRef(null);

  // Compute scan area based on doc type and screen size
  const [scanArea, setScanArea] = useState(null);
  const containerRef = useRef(null);

  const updateScanArea = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { width: cw, height: ch } = container.getBoundingClientRect();
    const ratio = DOCUMENT_ASPECT_RATIOS[documentType] || 1.42;
    const frameW = cw * FRAME_WIDTH_PCT;
    const frameH = frameW / ratio;
    const x = (cw - frameW) / 2;
    const y = (ch - frameH) / 2;
    setScanArea({ x, y, width: frameW, height: frameH });
  }, [documentType]);

  useEffect(() => {
    updateScanArea();
    const obs = new ResizeObserver(updateScanArea);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [updateScanArea]);

  // Frame analysis
  const { quality, reset: resetQuality } = useFrameAnalysis(videoRef, scanArea, {
    thresholds: { focusMin: 0.25, brightnessMin: 70, brightnessMax: 225, glareMax: 5 },
  });

  // Camera startup
  useEffect(() => {
    startCamera();
    warmupTimer.current = setTimeout(() => {
      warmupDoneRef.current = true;
    }, SCANNER_CONFIG.warmupMs);
    return () => {
      stopCamera();
      clearTimeout(warmupTimer.current);
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (isReady && phase === "initializing") setPhase("scanning");
  }, [isReady, phase]);

  // Auto-capture
  useEffect(() => {
    if (phase !== "scanning") return;
    if (!warmupDoneRef.current) return;
    if (autoCapturedRef.current) return;
    if (!quality.captureReady) return;

    autoCapturedRef.current = true;
    doCapture();
  }, [quality.captureReady, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const doCapture = useCallback(async () => {
    if (!videoRef.current || !scanArea) return;
    try {
      const blob = await captureFrameBlob(videoRef.current, scanArea, "image/jpeg", 0.93);
      const meta = {
        device: navigator.userAgent.slice(0, 120),
        browser: navigator.userAgent.slice(0, 120),
        w: Math.round(scanArea.width),
        h: Math.round(scanArea.height),
        blurVar: quality.focus,
        glarePct: quality.glare,
        attempt: attemptCount + 1,
        ts: new Date().toISOString(),
      };
      setCapturedBlob(blob);
      setPhase("captured");
      stopCamera();
    } catch (err) {
      console.error("[CameraAutoScanner] capture failed:", err);
      autoCapturedRef.current = false;
    }
  }, [videoRef, scanArea, quality, attemptCount, stopCamera]);

  const handleManualCapture = useCallback(() => {
    autoCapturedRef.current = true;
    doCapture();
  }, [doCapture]);

  const handleRetake = useCallback(() => {
    setCapturedBlob(null);
    setAttemptCount((n) => n + 1);
    autoCapturedRef.current = false;
    resetQuality();
    setPhase("initializing");
    startCamera();
    warmupTimer.current = setTimeout(() => {
      warmupDoneRef.current = true;
    }, SCANNER_CONFIG.warmupMs);
    setTimeout(() => setPhase("scanning"), 500);
  }, [startCamera, resetQuality]);

  const handleConfirm = useCallback(() => {
    if (!capturedBlob || !videoRef.current) return;
    const meta = {
      device: navigator.userAgent.slice(0, 120),
      w: Math.round(scanArea?.width || 0),
      h: Math.round(scanArea?.height || 0),
      blurVar: quality.focus,
      glarePct: quality.glare,
      attempt: attemptCount + 1,
      ts: new Date().toISOString(),
    };
    onCapture(capturedBlob, meta);
  }, [capturedBlob, scanArea, quality, attemptCount, onCapture]);

  // ── Render ──

  if (camError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <p className="text-red-500 font-medium">No se pudo acceder a la cámara</p>
        <p className="text-sm text-gray-500">{camError}</p>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">
          Cancelar
        </button>
      </div>
    );
  }

  if (phase === "captured" && capturedBlob) {
    const previewUrl = URL.createObjectURL(capturedBlob);
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4 bg-gray-950">
        <p className="text-white font-semibold">¿La imagen es legible?</p>
        <img
          src={previewUrl}
          alt="Captura"
          className="rounded-xl max-h-72 object-contain border border-white/20"
        />
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={handleRetake}
            className="flex-1 py-3 bg-white/10 text-white rounded-xl text-sm font-medium"
          >
            Retomar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-medium"
          >
            Usar esta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">
      {/* Live camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Guide overlay */}
      {scanArea && (
        <ScannerOverlay scanArea={scanArea} quality={quality} documentType={documentType} />
      )}

      {/* Quality indicators */}
      {phase === "scanning" && scanArea && (
        <div className="absolute bottom-32 left-0 right-0 px-4">
          <QualityIndicators quality={quality} />
        </div>
      )}

      {/* Manual capture button */}
      {phase === "scanning" && (
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2">
          <button
            onClick={handleManualCapture}
            className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-all
              ${quality.allGood ? "bg-white/30" : "bg-white/10"}`}
          >
            <div
              className={`w-12 h-12 rounded-full ${quality.allGood ? "bg-white" : "bg-white/40"}`}
            />
          </button>
          <p className="text-white/60 text-xs">Captura manual</p>
        </div>
      )}

      {/* Cancel */}
      <button
        onClick={() => {
          stopCamera();
          onCancel();
        }}
        className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Initializing overlay */}
      {phase === "initializing" && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}

CameraAutoScanner.propTypes = {
  documentType: PropTypes.oneOf(["PASSPORT", "VISA"]).isRequired,
  onCapture: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CameraAutoScanner;
