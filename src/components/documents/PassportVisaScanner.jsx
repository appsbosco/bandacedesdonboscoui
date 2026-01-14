import React, { useRef, useState, useEffect, useCallback } from "react";
import { loadOpenCV } from "../../utils/loadOpenCV";
import DocumentPreview from "./DocumentPreview";
import HelpSheet from "./HelpSheet";
import PropTypes from "prop-types";

const QUALITY_THRESHOLD = {
  brightness: 0.35,
  sharpness: 0.4,
  stability: 0.7,
};

const AUTO_CAPTURE_DELAY = 1200;
const FALLBACK_BUTTON_DELAY = 15000;

export default function PassportVisaScanner({ documentId, documentType, onComplete, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const lastFrameRef = useRef(null);
  const captureTimeoutRef = useRef(null);
  const fallbackTimeoutRef = useRef(null);

  const [status, setStatus] = useState("INITIALIZING");
  const [message, setMessage] = useState("Iniciando cámara...");
  const [qualityScore, setQualityScore] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showManualCapture, setShowManualCapture] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugTaps, setDebugTaps] = useState(0);
  const [debugMetrics, setDebugMetrics] = useState(null);

  useEffect(() => {
    loadOpenCV()
      .then(() => console.log("✅ OpenCV ready"))
      .catch((err) => console.warn("⚠️ OpenCV not available:", err));
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (status !== "READY") return;
    const interval = setInterval(analyzeQuality, 100);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status === "READY") {
      fallbackTimeoutRef.current = setTimeout(() => {
        setShowManualCapture(true);
      }, FALLBACK_BUTTON_DELAY);
    }
    return () => {
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    };
  }, [status]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.();
      if (capabilities?.torch) setTorchSupported(true);

      setStatus("READY");
      setMessage("Coloca el documento dentro del marco");
    } catch (error) {
      console.error("Camera error:", error);
      if (error.name === "NotAllowedError") {
        setPermissionDenied(true);
        setMessage("Permiso de cámara denegado");
      } else {
        setMessage("No se pudo acceder a la cámara");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchEnabled }] });
      setTorchEnabled(!torchEnabled);
    } catch (error) {
      console.error("Torch error:", error);
    }
  };

  const analyzeQuality = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || status !== "READY") return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Brightness
    let sumBrightness = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      sumBrightness += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    }
    const avgBrightness = sumBrightness / (pixels.length / 4) / 255;

    // Sharpness
    const grayData = [];
    for (let i = 0; i < pixels.length; i += 4) {
      grayData.push((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
    }

    const width = canvas.width;
    let laplacianSum = 0;
    let count = 0;
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const laplacian = Math.abs(
          4 * grayData[idx] -
            grayData[idx - 1] -
            grayData[idx + 1] -
            grayData[idx - width] -
            grayData[idx + width]
        );
        laplacianSum += laplacian;
        count++;
      }
    }
    const sharpness = count > 0 ? Math.min(laplacianSum / count / 100, 1) : 0;

    // Stability
    let stability = 1;
    if (lastFrameRef.current) {
      let diff = 0;
      const lastPixels = lastFrameRef.current.data;
      for (let i = 0; i < pixels.length; i += 4) {
        diff += Math.abs(pixels[i] - lastPixels[i]);
      }
      const avgDiff = diff / (pixels.length / 4) / 255;
      stability = Math.max(0, 1 - avgDiff * 5);
    }
    lastFrameRef.current = imageData;

    const brightnessPassed = avgBrightness >= QUALITY_THRESHOLD.brightness;
    const sharpnessPassed = sharpness >= QUALITY_THRESHOLD.sharpness;
    const stabilityPassed = stability >= QUALITY_THRESHOLD.stability;

    const score = Math.round(
      (brightnessPassed ? 33 : (avgBrightness * 33) / QUALITY_THRESHOLD.brightness) +
        (sharpnessPassed ? 33 : (sharpness * 33) / QUALITY_THRESHOLD.sharpness) +
        (stabilityPassed ? 34 : (stability * 34) / QUALITY_THRESHOLD.stability)
    );

    setQualityScore(score);

    if (!brightnessPassed) {
      setMessage("Necesitas más luz");
    } else if (!stabilityPassed) {
      setMessage("Mantén el dispositivo estable");
    } else if (!sharpnessPassed) {
      setMessage("Acércate un poco más");
    } else {
      setMessage("¡Perfecto! Preparando captura...");
    }

    if (debugMode) {
      setDebugMetrics({
        brightness: (avgBrightness * 100).toFixed(0),
        sharpness: (sharpness * 100).toFixed(0),
        stability: (stability * 100).toFixed(0),
        score,
      });
    }

    if (brightnessPassed && sharpnessPassed && stabilityPassed) {
      if (!captureTimeoutRef.current) {
        captureTimeoutRef.current = setTimeout(() => {
          setCountdown(3);
          setTimeout(() => setCountdown(2), 300);
          setTimeout(() => setCountdown(1), 600);
          setTimeout(() => {
            setCountdown(null);
            captureFrame();
          }, 900);
        }, AUTO_CAPTURE_DELAY - 900);
      }
    } else {
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
        captureTimeoutRef.current = null;
      }
      setCountdown(null);
    }
  }, [status, debugMode]);

  const captureFrame = useCallback(() => {
    if (status !== "READY") return;

    setStatus("CAPTURING");
    setMessage("Capturando...");

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        const file = new File([blob], `${documentType}_${Date.now()}.jpg`, { type: "image/jpeg" });
        setCapturedImage(file);
        setStatus("CAPTURED");
        stopCamera();
      },
      "image/jpeg",
      0.95
    );
  }, [status, documentType]);

  const handleRetake = () => {
    setCapturedImage(null);
    setStatus("READY");
    setMessage("Coloca el documento dentro del marco");
    setQualityScore(0);
    setCountdown(null);
    setShowManualCapture(false);
    startCamera();
  };

  const handleDebugTap = () => {
    setDebugTaps((prev) => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setDebugMode((dm) => !dm);
        return 0;
      }
      setTimeout(() => setDebugTaps(0), 2000);
      return newCount;
    });
  };

  if (permissionDenied) {
    return (
      <div className="h-full flex items-center justify-center bg-black text-white p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-3">Permiso de cámara requerido</h3>
          <p className="text-gray-300 mb-8">
            Necesitamos acceso a tu cámara para escanear documentos.
          </p>
          <button
            onClick={onCancel}
            className="bg-white text-black font-semibold px-8 py-3 rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (status === "CAPTURED" && capturedImage) {
    return (
      <DocumentPreview
        image={capturedImage}
        documentId={documentId}
        documentType={documentType}
        onRetake={handleRetake}
        onComplete={onComplete}
      />
    );
  }

  const frameColor =
    qualityScore >= 80
      ? "border-green-500 shadow-green-500/50"
      : qualityScore >= 50
      ? "border-yellow-500 shadow-yellow-500/50"
      : "border-gray-400 shadow-gray-400/30";

  return (
    <div className="fixed inset-0 bg-black">
      {/* Video Layer - FONDO */}
      <div className="absolute inset-0">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* UI Layer - ENCIMA */}
      <div
        className="absolute inset-0 flex flex-col pointer-events-none"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Top Bar */}
        <div className="relative px-6 py-4 pointer-events-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <button
              onClick={() => setShowHelp(true)}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>

          <div className="text-center">
            <h2
              onClick={handleDebugTap}
              className="text-white text-xl font-bold mb-1 drop-shadow-lg"
            >
              {message}
            </h2>
            <p className="text-white/80 text-sm drop-shadow">
              {documentType === "PASSPORT"
                ? "Alinea la zona MRZ en la banda inferior"
                : "Centra el documento en el marco"}
            </p>
          </div>

          <div className="mt-4 h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                qualityScore >= 80
                  ? "bg-green-500"
                  : qualityScore >= 50
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${qualityScore}%` }}
            />
          </div>
        </div>

        {/* Center Frame */}
        <div className="flex-1 flex items-center justify-center px-8 pointer-events-none">
          <div className="relative w-full max-w-md">
            <div
              className={`relative w-full aspect-[3/2] border-4 rounded-2xl transition-all duration-300 ${frameColor}`}
              style={{ boxShadow: `0 0 40px var(--tw-shadow-color)` }}
            >
              <div className="absolute -top-3 -left-3 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-xl" />
              <div className="absolute -top-3 -right-3 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-xl" />
              <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-xl" />
              <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-xl" />

              {documentType === "PASSPORT" && (
                <div className="absolute bottom-0 left-0 right-0 h-1/4 border-t-2 border-white/30 bg-blue-500/10 backdrop-blur-sm rounded-b-2xl flex items-center justify-center">
                  <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                    Zona MRZ
                  </span>
                </div>
              )}

              {countdown && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center animate-ping-slow">
                    <span className="text-5xl font-bold text-blue-600">{countdown}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="relative px-6 py-6 pointer-events-auto">
          <div className="flex items-center justify-center gap-4">
            {torchSupported && (
              <button
                onClick={toggleTorch}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  torchEnabled
                    ? "bg-yellow-500 text-black"
                    : "bg-white/20 text-white backdrop-blur-sm"
                }`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
              </button>
            )}

            {showManualCapture && (
              <button
                onClick={captureFrame}
                className="flex-1 max-w-xs bg-white text-black font-semibold py-4 px-6 rounded-xl shadow-2xl"
              >
                Capturar manualmente
              </button>
            )}
          </div>
        </div>

        {debugMode && debugMetrics && (
          <div className="absolute bottom-32 left-4 right-4 bg-black/90 backdrop-blur-md rounded-lg p-4 text-white text-xs font-mono pointer-events-none">
            <div className="grid grid-cols-2 gap-2">
              <div>Brightness: {debugMetrics.brightness}%</div>
              <div>Sharpness: {debugMetrics.sharpness}%</div>
              <div>Stability: {debugMetrics.stability}%</div>
              <div>Score: {debugMetrics.score}%</div>
            </div>
          </div>
        )}
      </div>

      {showHelp && <HelpSheet onClose={() => setShowHelp(false)} documentType={documentType} />}
    </div>
  );
}

PassportVisaScanner.propTypes = {
  documentId: PropTypes.string.isRequired,
  documentType: PropTypes.oneOf(["PASSPORT", "VISA"]).isRequired,
  onComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
