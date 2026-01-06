import React, { useRef, useState, useEffect, useCallback } from "react";
import { loadOpenCV } from "../../utils/loadOpenCV";
import { mapCanvasToVideo } from "../../utils/coverMapping";
import { orderQuadPoints } from "../../utils/orderQuadPoints";
import { calculateQualityScore } from "../../utils/qualityScore";
import DocumentPreview from "./DocumentPreview";
import PropTypes from "prop-types";

const AUTO_CAPTURE_THRESHOLD = 30; // frames consecutivos con OK
const DETECTION_INTERVAL = 100; // ms entre detecciones

export default function PassportVisaScanner({ documentId, documentType, onComplete, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const cvLoadedRef = useRef(false);
  const detectionIntervalRef = useRef(null);
  const okFramesRef = useRef(0);

  const [status, setStatus] = useState("INITIALIZING"); // INITIALIZING, READY, DETECTING, CAPTURING, CAPTURED
  const [message, setMessage] = useState("Iniciando cámara...");
  const [alignmentScore, setAlignmentScore] = useState(null); // null, BAD, FAIR, GOOD, OK
  const [alignmentProgress, setAlignmentProgress] = useState(0); // 0-100
  const [debugMode, setDebugMode] = useState(true);
  const [debugMetrics, setDebugMetrics] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cvReady, setCvReady] = useState(false);

  // Cargar OpenCV
  useEffect(() => {
    loadOpenCV()
      .then(() => {
        cvLoadedRef.current = true;
        setCvReady(true);
        console.log("✅ OpenCV loaded");
      })
      .catch((err) => {
        console.error("❌ Failed to load OpenCV:", err);
        setMessage("Error cargando sistema de detección");
      });
  }, []);

  // Iniciar cámara
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    // Si ya hay cámara lista (videoWidth > 0) y cv listo, arrancamos detección.
    const video = videoRef.current;
    if (!cvReady || !video) return;

    const id = setInterval(() => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        startDetection();
        clearInterval(id);
      }
    }, 100);

    return () => clearInterval(id);
  }, [cvReady]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: { facingMode: { ideal: "environment" } }, // más compatible
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;

      // esperar a que el video tenga dimensiones reales
      await new Promise((resolve) => {
        const onReady = () => {
          video.removeEventListener("loadedmetadata", onReady);
          resolve();
        };
        video.addEventListener("loadedmetadata", onReady);
      });

      await video.play();

      // Torch (sin romper en browsers que no soportan)
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.();
      if (capabilities?.torch) setTorchSupported(true);

      setStatus("READY");
      setMessage("Posiciona tu documento en el marco");
      // ⚠️ OJO: NO llames startDetection aquí si OpenCV no ha cargado aún (ver B)
    } catch (error) {
      console.error("Camera error:", error);
      if (error.name === "NotAllowedError") {
        setPermissionDenied(true);
        setMessage("Permiso de cámara denegado");
      } else {
        setMessage("No se pudo acceder a la cámara (usa HTTPS o revisa permisos)");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled }],
      });
      setTorchEnabled(!torchEnabled);
    } catch (error) {
      console.error("Torch error:", error);
    }
  };

  const startDetection = () => {
    if (detectionIntervalRef.current) return;

    detectionIntervalRef.current = setInterval(() => {
      detectDocument();
    }, DETECTION_INTERVAL);
  };

  const detectDocument = useCallback(() => {
    if (
      !cvLoadedRef.current ||
      !videoRef.current ||
      !canvasRef.current ||
      status === "CAPTURING" ||
      status === "CAPTURED"
    ) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const container = canvas.parentElement; // El div contenedor

    // ⚠️ CRÍTICO: Canvas debe ser del tamaño del CONTENEDOR
    if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      const cv = window.cv;

      // ⚠️ CREAR Mat del tamaño del VIDEO REAL (no del canvas)
      const src = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);

      // Dibujar video en un canvas temporal del tamaño correcto
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.drawImage(video, 0, 0);
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      src.data.set(imageData.data);

      // ... resto del código de detección igual ...
      // Convert to grayscale
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Gaussian blur
      const blurred = new cv.Mat();
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      // Canny edge detection - AJUSTADO
      const edges = new cv.Mat();
      const brightness = cv.mean(gray)[0];
      const cannyLow = Math.max(30, brightness * 0.33);
      const cannyHigh = Math.min(200, brightness * 0.66);
      cv.Canny(blurred, edges, cannyLow, cannyHigh);

      // Morph close
      const morphed = new cv.Mat();
      const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
      cv.morphologyEx(edges, morphed, cv.MORPH_CLOSE, kernel);
      kernel.delete();

      // Find contours
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(morphed, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let bestContour = null;
      let maxArea = 0;
      const minArea = video.videoWidth * video.videoHeight * 0.06; // 6% del video

      // Find largest rectangular contour
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);

        if (area > minArea && area > maxArea) {
          const peri = cv.arcLength(contour, true);
          const approx = new cv.Mat();
          cv.approxPolyDP(contour, approx, 0.02 * peri, true);

          if (approx.rows === 4) {
            if (bestContour) bestContour.delete();
            bestContour = approx;
            maxArea = area;
          } else {
            approx.delete();
          }
        }
        contour.delete();
      }

      if (bestContour) {
        // Extract quad points (en coordenadas del video)
        const points = [];
        for (let i = 0; i < 4; i++) {
          points.push({
            x: bestContour.data32S[i * 2],
            y: bestContour.data32S[i * 2 + 1],
          });
        }

        const orderedPoints = orderQuadPoints(points);

        // Map to display coordinates (canvas overlay)
        const displayPoints = orderedPoints.map((p) => mapCanvasToVideo(p, video, tempCanvas));

        // Calculate quality score
        const quality = calculateQualityScore(
          src,
          orderedPoints,
          video.videoWidth,
          video.videoHeight
        );

        // Determine alignment score - UMBRALES RELAJADOS
        let score = "BAD";
        let progress = 0;
        let msg = "Acércate más al documento";

        if (quality.perspective > 0.5 && quality.brightness > 0.5) {
          if (quality.sharpness > 0.6 && quality.motion < 0.2) {
            score = "OK";
            progress = 100;
            msg = "¡Perfecto! Capturando...";
          } else if (quality.sharpness > 0.45) {
            score = "GOOD";
            progress = 75;
            msg = "Mantén estable";
          } else if (quality.sharpness > 0.3) {
            score = "FAIR";
            progress = 50;
            msg = "Mejora el enfoque";
          }
        } else if (quality.brightness < 0.35) {
          msg = "Necesitas más luz";
          progress = 25;
        } else if (quality.perspective < 0.4) {
          msg = "Alinea el documento de frente";
          progress = 30;
        }

        setAlignmentScore(score);
        setAlignmentProgress(progress);
        setMessage(msg);

        if (debugMode) {
          setDebugMetrics({
            sharpness: (quality.sharpness * 100).toFixed(0),
            brightness: (quality.brightness * 100).toFixed(0),
            perspective: (quality.perspective * 100).toFixed(0),
            motion: (quality.motion * 100).toFixed(0),
            area: Math.round(maxArea),
          });
        }

        // Draw contour overlay en el canvas de display
        drawOverlay(ctx, displayPoints, score);

        // Auto-capture logic
        if (score === "OK") {
          okFramesRef.current += 1;
          if (okFramesRef.current >= AUTO_CAPTURE_THRESHOLD) {
            captureFrame();
          }
        } else {
          okFramesRef.current = 0;
        }

        bestContour.delete();
      } else {
        // No document detected
        setAlignmentScore(null);
        setAlignmentProgress(0);
        setMessage("Busca un documento en el marco");
        okFramesRef.current = 0;
        setDebugMetrics(null);
      }

      // Cleanup
      src.delete();
      gray.delete();
      blurred.delete();
      edges.delete();
      morphed.delete();
      contours.delete();
      hierarchy.delete();
    } catch (error) {
      console.error("Detection error:", error);
    }
  }, [status, debugMode, documentType]);

  const drawOverlay = (ctx, points, score) => {
    const colors = {
      BAD: "#ef4444",
      FAIR: "#f59e0b",
      GOOD: "#3b82f6",
      OK: "#10b981",
    };

    const color = colors[score] || "#ef4444";

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // Draw quad
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.lineTo(points[3].x, points[3].y);
    ctx.closePath();
    ctx.stroke();

    // Draw corner markers
    const markerSize = 20;
    points.forEach((p) => {
      ctx.fillStyle = color;
      ctx.fillRect(p.x - markerSize / 2, p.y - markerSize / 2, markerSize, markerSize);
    });

    ctx.shadowBlur = 0;
  };

  const captureFrame = useCallback(() => {
    if (status === "CAPTURING" || status === "CAPTURED") return;

    setStatus("CAPTURING");
    setMessage("Capturando...");
    okFramesRef.current = 0;

    // Stop detection
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    // Capture high-quality frame
    const video = videoRef.current;
    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    const captureCtx = captureCanvas.getContext("2d");
    captureCtx.drawImage(video, 0, 0);

    captureCanvas.toBlob(
      (blob) => {
        const file = new File([blob], `${documentType}_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
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
    setMessage("Posiciona tu documento en el marco");
    okFramesRef.current = 0;
    startCamera();
  };

  const handleUsePhoto = () => {
    // Preview component will handle upload
  };

  if (permissionDenied) {
    return (
      <div className="h-full flex items-center justify-center bg-black text-white p-8">
        <div className="text-center max-w-md">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-red-500"
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
          <h3 className="text-xl font-bold mb-2">Permiso de cámara requerido</h3>
          <p className="text-gray-300 mb-6">
            Por favor permite el acceso a tu cámara para escanear documentos.
          </p>
          <button
            onClick={onCancel}
            className="bg-white text-black px-6 py-3 rounded-lg font-semibold"
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

  return (
    <div className="relative h-full w-full bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ objectFit: "fill" }} // CRÍTICO: fill, no cover
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gradient-to-b from-black/70 to-transparent p-4 pt-16">
          <div className="max-w-md mx-auto">
            {/* Status Message */}
            <div className="text-center mb-4">
              <p className="text-white text-lg font-semibold drop-shadow-lg">{message}</p>
            </div>

            {/* Progress Bar */}
            {alignmentScore && (
              <div className="bg-black/50 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    alignmentScore === "OK"
                      ? "bg-green-500"
                      : alignmentScore === "GOOD"
                      ? "bg-blue-500"
                      : alignmentScore === "FAIR"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${alignmentProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Center - Guide Frame */}
        {/* Center - Guide Frame */}
        <div className="flex-1 flex items-center justify-center p-8 bg-red-500/20">
          <div className="relative w-full max-w-md h-[260px] sm:h-[340px] border-4 border-white/60 rounded-2xl">
            {/* Corner markers */}
            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="bg-gradient-to-t from-black/70 to-transparent p-6 pb-8">
          <div className="max-w-md mx-auto flex items-center justify-between">
            {/* Torch */}
            {torchSupported && (
              <button
                onClick={toggleTorch}
                className={`p-4 rounded-full transition-colors ${
                  torchEnabled ? "bg-yellow-500 text-black" : "bg-white/20 text-white"
                }`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Manual Capture (emergency) */}
            {alignmentScore === "GOOD" && (
              <button onClick={captureFrame} className="p-4 bg-white rounded-full shadow-lg">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            )}

            {/* Debug Toggle */}
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="p-4 bg-white/20 rounded-full text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </button>
          </div>

          {/* Debug Metrics */}
          {debugMode && debugMetrics && (
            <div className="mt-4 bg-black/70 rounded-lg p-4 text-white text-xs font-mono max-w-md mx-auto">
              <div className="grid grid-cols-2 gap-2">
                <div>Sharpness: {debugMetrics.sharpness}%</div>
                <div>Brightness: {debugMetrics.brightness}%</div>
                <div>Perspective: {debugMetrics.perspective}%</div>
                <div>Motion: {debugMetrics.motion}%</div>
                <div className="col-span-2">Area: {debugMetrics.area}px</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

PassportVisaScanner.propTypes = {
  documentId: PropTypes.string.isRequired,
  documentType: PropTypes.oneOf(["PASSPORT", "VISA"]).isRequired,
  onComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
