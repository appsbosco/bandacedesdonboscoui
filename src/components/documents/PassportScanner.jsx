import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/Button";
import PropTypes from "prop-types";
import { mapVideoToOverlay } from "../../utils/coverMapping";
import { orderQuadPoints } from "../../utils/orderQuadPoints";
import { calculateSharpness, calculateBrightness, detectMotion } from "../../utils/captureQuality";

const DEBUG_MODE = false;

const STATES = {
  LOADING: "loading",
  SEARCHING: "searching",
  ALIGNING: "aligning",
  READY: "ready",
  CAPTURING: "capturing",
  REVIEW: "review",
  ERROR: "error",
};

export function PassportScanner({ onCapture, onCancel, documentType }) {
  const [state, setState] = useState(STATES.LOADING);
  const [alignmentScore, setAlignmentScore] = useState(0);
  const [readyFrames, setReadyFrames] = useState(0);
  const [capturedImage, setCapturedImage] = useState(null);
  const [statusText, setStatusText] = useState("Inicializando cámara...");
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const debugCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const cvRef = useRef(null);
  const rafRef = useRef(null);
  const lastFrameRef = useRef(null);
  const processingRef = useRef(false);
  const captureLockedRef = useRef(false);

  // Cargar OpenCV
  useEffect(() => {
    const loadOpenCV = () => {
      if (window.cv && window.cv.Mat) {
        cvRef.current = window.cv;
        initCamera();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://docs.opencv.org/4.5.0/opencv.js";
      script.async = true;
      script.onload = () => {
        const interval = setInterval(() => {
          if (window.cv && window.cv.Mat) {
            clearInterval(interval);
            cvRef.current = window.cv;
            initCamera();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(interval);
          if (!cvRef.current) {
            setState(STATES.ERROR);
            setStatusText("Error cargando OpenCV");
          }
        }, 10000);
      };
      script.onerror = () => {
        setState(STATES.ERROR);
        setStatusText("Error cargando OpenCV");
      };
      document.body.appendChild(script);
    };

    loadOpenCV();

    return () => {
      stopCamera();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities();
      setHasFlash(caps.torch === true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setState(STATES.SEARCHING);
        setStatusText("Posiciona tu documento en el marco");
        startProcessing();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setState(STATES.ERROR);
      setStatusText(`Error: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !flashEnabled }] });
      setFlashEnabled(!flashEnabled);
    } catch (err) {
      console.error("Flash error:", err);
    }
  };

  const startProcessing = () => {
    const process = () => {
      if (
        !videoRef.current ||
        processingRef.current ||
        state === STATES.REVIEW ||
        captureLockedRef.current
      ) {
        rafRef.current = requestAnimationFrame(process);
        return;
      }

      processingRef.current = true;
      try {
        detectAndAnalyze();
      } catch (err) {
        console.error("Processing error:", err);
      }
      processingRef.current = false;

      setTimeout(() => {
        rafRef.current = requestAnimationFrame(process);
      }, 100);
    };
    process();
  };

  const detectAndAnalyze = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const cv = cvRef.current;

    if (!video || !canvas || !overlay || !cv || video.readyState !== 4) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    canvas.width = vw;
    canvas.height = vh;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, vw, vh);

    const overlayRect = overlay.getBoundingClientRect();
    overlay.width = overlayRect.width;
    overlay.height = overlayRect.height;
    const octx = overlay.getContext("2d");
    octx.clearRect(0, 0, overlay.width, overlay.height);

    // Resize para análisis
    const analyzeW = 640;
    const scale = analyzeW / vw;
    const analyzeH = Math.floor(vh * scale);

    let src = cv.imread(canvas);
    let resized = new cv.Mat();
    let gray = new cv.Mat();
    let blurred = new cv.Mat();
    let edges = new cv.Mat();
    let morphed = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    try {
      cv.resize(src, resized, new cv.Size(analyzeW, analyzeH), 0, 0, cv.INTER_AREA);
      cv.cvtColor(resized, gray, cv.COLOR_RGBA2GRAY);
      cv.bilateralFilter(gray, blurred, 9, 75, 75);

      const brightness = calculateBrightness(gray);
      const cannyLow = Math.max(30, brightness * 0.33);
      const cannyHigh = Math.min(200, brightness * 0.66);

      cv.Canny(blurred, edges, cannyLow, cannyHigh);

      const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
      cv.morphologyEx(edges, morphed, cv.MORPH_CLOSE, kernel);
      kernel.delete();

      if (DEBUG_MODE && debugCanvasRef.current) {
        cv.imshow(debugCanvasRef.current, morphed);
      }

      cv.findContours(morphed, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let bestContour = null;
      let maxArea = 0;
      const minArea = analyzeW * analyzeH * 0.05;

      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const area = cv.contourArea(cnt);
        if (area < minArea) continue;

        const peri = cv.arcLength(cnt, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

        if (approx.rows === 4 && area > maxArea) {
          if (bestContour) bestContour.delete();
          bestContour = approx;
          maxArea = area;
        } else {
          approx.delete();
        }
      }

      if (bestContour) {
        const points = [];
        for (let i = 0; i < 4; i++) {
          points.push({
            x: bestContour.data32S[i * 2] / scale,
            y: bestContour.data32S[i * 2 + 1] / scale,
          });
        }

        const ordered = orderQuadPoints(points);
        const quality = assessQuality(src, gray, ordered, vw, vh, brightness);

        if (DEBUG_MODE) {
          setDebugInfo({
            contourFound: true,
            ...quality,
            numContours: contours.size(),
          });
        }

        const overlayPoints = ordered.map((p) => mapVideoToOverlay(p, vw, vh, video, overlay));

        drawContour(octx, overlayPoints, quality.score);
        updateState(quality, ordered);

        bestContour.delete();
      } else {
        setState(STATES.SEARCHING);
        setStatusText("Busca el documento en el marco");
        setAlignmentScore(0);
        setReadyFrames(0);
        drawGuide(octx, overlay.width, overlay.height);

        if (DEBUG_MODE) {
          setDebugInfo({
            contourFound: false,
            numContours: contours.size(),
            minArea,
          });
        }
      }
    } finally {
      src.delete();
      resized.delete();
      gray.delete();
      blurred.delete();
      edges.delete();
      morphed.delete();
      contours.delete();
      hierarchy.delete();
    }

    lastFrameRef.current = ctx.getImageData(0, 0, vw, vh);
  };

  const assessQuality = (src, gray, points, vw, vh, brightness) => {
    const margin = 0.08;
    const withinGuide = points.every(
      (p) =>
        p.x > vw * margin && p.x < vw * (1 - margin) && p.y > vh * margin && p.y < vh * (1 - margin)
    );

    const [tl, tr, br, bl] = points;
    const topW = Math.hypot(tr.x - tl.x, tr.y - tl.y);
    const botW = Math.hypot(br.x - bl.x, br.y - bl.y);
    const leftH = Math.hypot(bl.x - tl.x, bl.y - tl.y);
    const rightH = Math.hypot(br.x - tr.x, br.y - tr.y);

    const wRatio = Math.max(topW, botW) / Math.min(topW, botW);
    const hRatio = Math.max(leftH, rightH) / Math.min(leftH, rightH);
    const perspectiveOk = wRatio < 1.6 && hRatio < 1.6;

    const area = calculatePolygonArea(points);
    const areaRatio = area / (vw * vh);
    const areaOk = areaRatio > 0.08 && areaRatio < 0.9;

    const sharpness = calculateSharpness(gray);
    const sharpnessThreshold = brightness < 100 ? 50 : 100;
    const sharpnessOk = sharpness > sharpnessThreshold;

    const motion = lastFrameRef.current
      ? detectMotion(
          lastFrameRef.current,
          canvasRef.current.getContext("2d").getImageData(0, 0, vw, vh)
        )
      : 0;
    const motionOk = motion < 20;

    const brightnessOk = brightness > 70 && brightness < 200;

    const score =
      (withinGuide ? 0.2 : 0) +
      (perspectiveOk ? 0.2 : 0) +
      (areaOk ? 0.2 : 0) +
      (sharpnessOk ? 0.2 : 0) +
      (motionOk ? 0.1 : 0) +
      (brightnessOk ? 0.1 : 0);

    return {
      score,
      withinGuide,
      perspectiveOk,
      areaOk,
      sharpnessOk,
      motionOk,
      brightnessOk,
      brightness,
      sharpness,
      motion,
      areaRatio,
    };
  };

  const calculatePolygonArea = (pts) => {
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    return Math.abs(a / 2);
  };

  const drawContour = (ctx, pts, score) => {
    const color = score >= 1.0 ? "#10b981" : score >= 0.7 ? "#fbbf24" : "#ef4444";
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach((p, i) => i > 0 && ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.stroke();

    pts.forEach((p) => {
      ctx.fillStyle = color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.shadowBlur = 0;
  };

  const drawGuide = (ctx, w, h) => {
    const margin = w * 0.08;
    const frameW = w - 2 * margin;
    const frameH = frameW / 1.4;
    const frameY = (h - frameH) / 2;

    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 10]);
    ctx.shadowColor = "#6366f1";
    ctx.shadowBlur = 10;
    ctx.strokeRect(margin, frameY, frameW, frameH);
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    const corner = 30;
    ctx.lineWidth = 4;

    // TL
    ctx.beginPath();
    ctx.moveTo(margin, frameY + corner);
    ctx.lineTo(margin, frameY);
    ctx.lineTo(margin + corner, frameY);
    ctx.stroke();

    // TR
    ctx.beginPath();
    ctx.moveTo(margin + frameW - corner, frameY);
    ctx.lineTo(margin + frameW, frameY);
    ctx.lineTo(margin + frameW, frameY + corner);
    ctx.stroke();

    // BR
    ctx.beginPath();
    ctx.moveTo(margin + frameW, frameY + frameH - corner);
    ctx.lineTo(margin + frameW, frameY + frameH);
    ctx.lineTo(margin + frameW - corner, frameY + frameH);
    ctx.stroke();

    // BL
    ctx.beginPath();
    ctx.moveTo(margin + corner, frameY + frameH);
    ctx.lineTo(margin, frameY + frameH);
    ctx.lineTo(margin, frameY + frameH - corner);
    ctx.stroke();
  };

  const updateState = (quality, points) => {
    setAlignmentScore(quality.score);

    if (quality.score < 0.5) {
      setState(STATES.SEARCHING);
      if (!quality.withinGuide) setStatusText("Centra el documento");
      else if (!quality.areaOk)
        setStatusText(quality.areaRatio < 0.08 ? "Acércate más" : "Aléjate un poco");
      else setStatusText("Posiciona mejor el documento");
      setReadyFrames(0);
      return;
    }

    if (quality.score < 1.0) {
      setState(STATES.ALIGNING);
      if (!quality.perspectiveOk) setStatusText("Alinea el documento (menos ángulo)");
      else if (!quality.brightnessOk)
        setStatusText(quality.brightness < 70 ? "Más luz necesaria" : "Demasiada luz");
      else if (!quality.sharpnessOk) setStatusText("Mantén estable");
      else if (!quality.motionOk) setStatusText("Evita movimientos");
      else setStatusText("Casi listo...");
      setReadyFrames(0);
      return;
    }

    if (quality.score >= 1.0 && !captureLockedRef.current) {
      const newReady = readyFrames + 1;
      setReadyFrames(newReady);

      if (newReady >= 10) {
        setState(STATES.CAPTURING);
        setStatusText("✓ Capturando...");
        captureLockedRef.current = true;

        if (navigator.vibrate) navigator.vibrate(200);

        setTimeout(() => {
          captureDocument(points);
        }, 300);
      } else {
        setState(STATES.READY);
        setStatusText(`Mantén la posición... (${newReady}/10)`);
      }
    }
  };

  const captureDocument = (points) => {
    const canvas = canvasRef.current;
    if (!canvas || !points) return;

    const cv = cvRef.current;
    let src = cv.imread(canvas);
    let dst = new cv.Mat();

    try {
      const [tl, tr, br, bl] = points;
      const widthTop = Math.hypot(tr.x - tl.x, tr.y - tl.y);
      const widthBot = Math.hypot(br.x - bl.x, br.y - bl.y);
      const heightLeft = Math.hypot(bl.x - tl.x, bl.y - tl.y);
      const heightRight = Math.hypot(br.x - tr.x, br.y - tr.y);

      const maxWidth = Math.max(widthTop, widthBot);
      const maxHeight = Math.max(heightLeft, heightRight);

      const outputW = 1400;
      const outputH = 1000;

      const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
        tl.x,
        tl.y,
        tr.x,
        tr.y,
        br.x,
        br.y,
        bl.x,
        bl.y,
      ]);
      const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0,
        0,
        outputW,
        0,
        outputW,
        outputH,
        0,
        outputH,
      ]);

      const M = cv.getPerspectiveTransform(srcPts, dstPts);
      cv.warpPerspective(src, dst, M, new cv.Size(outputW, outputH));

      // Mejorar contraste
      let gray = new cv.Mat();
      cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY);
      let clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
      let enhanced = new cv.Mat();
      clahe.apply(gray, enhanced);
      cv.cvtColor(enhanced, dst, cv.COLOR_GRAY2RGBA);

      const outCanvas = document.createElement("canvas");
      cv.imshow(outCanvas, dst);

      outCanvas.toBlob(
        (blob) => {
          const url = URL.createObjectURL(blob);
          setCapturedImage({ url, blob });
          setState(STATES.REVIEW);
          stopCamera();
        },
        "image/jpeg",
        0.95
      );

      srcPts.delete();
      dstPts.delete();
      M.delete();
      gray.delete();
      enhanced.delete();
    } finally {
      src.delete();
      dst.delete();
    }
  };

  const handleRetry = () => {
    if (capturedImage?.url) URL.revokeObjectURL(capturedImage.url);
    setCapturedImage(null);
    setReadyFrames(0);
    setAlignmentScore(0);
    captureLockedRef.current = false;
    setState(STATES.LOADING);
    initCamera();
  };

  const handleConfirm = () => {
    onCapture(capturedImage);
  };

  // REVIEW
  if (state === STATES.REVIEW && capturedImage) {
    return (
      <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 shadow-lg">
          <h3 className="text-white text-xl font-semibold text-center">Vista Previa</h3>
        </div>

        <div className="flex-1 bg-gray-900 flex items-center justify-center p-6">
          <img
            src={capturedImage.url}
            alt="Captura"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          />
        </div>

        <div className="p-6 bg-gray-900 border-t border-gray-800 space-y-3">
          <Button
            variant="primary"
            onClick={handleConfirm}
            className="w-full py-4 text-lg font-semibold"
          >
            ✓ Usar esta foto
          </Button>
          <Button variant="secondary" onClick={handleRetry} className="w-full py-4 text-lg">
            🔄 Tomar otra
          </Button>
        </div>
      </div>
    );
  }

  // SCANNER
  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Overlay oscuro */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full">
            <defs>
              <mask id="mask">
                <rect width="100%" height="100%" fill="white" />
                <rect x="8%" y="calc(50% - 28%)" width="84%" height="56%" rx="16" fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#mask)" />
          </svg>
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 safe-area-top">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-semibold drop-shadow-lg">
              Escanear {documentType === "PASSPORT" ? "Pasaporte" : "Visa"}
            </h2>
            <button
              onClick={onCancel}
              className="text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition"
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
          </div>

          <div
            className={`backdrop-blur-md rounded-xl px-4 py-3 text-center transition-colors ${
              state === STATES.READY || state === STATES.CAPTURING
                ? "bg-green-600/90"
                : state === STATES.ALIGNING
                ? "bg-yellow-600/90"
                : "bg-indigo-600/90"
            }`}
          >
            <p className="text-white font-semibold">{statusText}</p>
          </div>
        </div>

        {/* Progress bar */}
        {alignmentScore > 0 && (
          <div className="absolute top-32 left-4 right-4 safe-area-top">
            <div className="bg-white/20 backdrop-blur-sm rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  alignmentScore >= 1.0
                    ? "bg-green-400"
                    : alignmentScore >= 0.7
                    ? "bg-yellow-400"
                    : "bg-red-400"
                }`}
                style={{ width: `${alignmentScore * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Debug */}
        {DEBUG_MODE && (
          <>
            <canvas
              ref={debugCanvasRef}
              className="absolute bottom-24 right-4 border-2 border-white rounded"
              width="200"
              height="150"
            />
            <div className="absolute top-40 left-4 bg-black/80 text-white p-3 rounded text-xs font-mono max-w-xs">
              <div>Found: {debugInfo.contourFound ? "✓" : "✗"}</div>
              <div>Area: {debugInfo.areaRatio?.toFixed(3)}</div>
              <div>Bright: {debugInfo.brightness?.toFixed(0)}</div>
              <div>Sharp: {debugInfo.sharpness?.toFixed(0)}</div>
              <div>Motion: {debugInfo.motion?.toFixed(1)}</div>
              <div>Score: {debugInfo.score?.toFixed(2)}</div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent safe-area-bottom">
          <div className="flex items-center justify-center gap-4">
            {hasFlash && (
              <button
                onClick={toggleFlash}
                className={`${
                  flashEnabled ? "bg-yellow-500 text-black" : "bg-white/20 text-white"
                } backdrop-blur-sm px-6 py-3 rounded-full font-semibold transition`}
              >
                {flashEnabled ? "⚡ Flash" : "💡 Flash"}
              </button>
            )}
          </div>

          {state === STATES.READY && readyFrames > 0 && (
            <div className="mt-4 text-center">
              <p className="text-white text-sm font-medium mb-2">
                Capturando en {10 - readyFrames}...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

PassportScanner.propTypes = {
  onCapture: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  documentType: PropTypes.oneOf(["PASSPORT", "VISA"]).isRequired,
};
