// FILE: src/hooks/useDocumentDetection.js
// Hook para detección de documento en tiempo real

import { useState, useCallback, useRef, useEffect } from "react";
import { detectDocumentContour, calculateAlignmentScores } from "../utils/documentDetection";
import { getScaledImageData } from "../utils/imageAnalysis";
import { SCANNER_CONFIG } from "../utils/constants";

export function useDocumentDetection(options = {}) {
  const {
    videoRef,
    isActive = false,
    fps = 12,
    guideRect = SCANNER_CONFIG.scanArea,
    onReadyToCapture,
    streakFrames = 10,
  } = options;

  const [detection, setDetection] = useState({
    corners: null,
    scores: null,
    hint: "Coloca el documento dentro del marco",
    readyToCapture: false,
    autoCapture: false,
  });

  const animationFrameRef = useRef(null);
  const lastAnalysisRef = useRef(0);
  const consecutiveOkFramesRef = useRef(0);
  const prevCornersRef = useRef(null);

  const analyzeFrame = useCallback(() => {
    const video = videoRef?.current;
    if (!video || video.readyState < video.HAVE_CURRENT_DATA) return null;

    try {
      const imageData = getScaledImageData(video, 400);
      const corners = detectDocumentContour(imageData);

      if (!corners) {
        return {
          corners: null,
          scores: {
            insideScore: 0,
            rotationScore: 0,
            perspectiveScore: 0,
            sideScores: { top: 0, right: 0, bottom: 0, left: 0 },
            totalScore: 0,
            hint: "Coloca el documento dentro del marco",
          },
        };
      }

      // Escalar esquinas al tamaño real del video
      const scaleX = video.videoWidth / imageData.width;
      const scaleY = video.videoHeight / imageData.height;
      const scaledCorners = corners.map((c) => ({
        x: c.x * scaleX,
        y: c.y * scaleY,
      }));

      // Calcular scores
      const scores = calculateAlignmentScores(
        scaledCorners,
        guideRect,
        video.videoWidth,
        video.videoHeight
      );

      // Calcular estabilidad comparando con frame anterior
      let stabilityScore = 0;
      if (prevCornersRef.current) {
        const diffs = scaledCorners.map((c, i) => {
          const prev = prevCornersRef.current[i];
          return Math.sqrt((c.x - prev.x) ** 2 + (c.y - prev.y) ** 2);
        });
        const avgDiff = diffs.reduce((a, b) => a + b, 0) / 4;
        stabilityScore = Math.max(0, 1 - avgDiff / 30);
      }
      prevCornersRef.current = scaledCorners;

      // Ajustar score total con estabilidad
      const adjustedTotal =
        0.4 * scores.insideScore +
        0.25 * scores.rotationScore +
        0.25 * scores.perspectiveScore +
        0.1 * stabilityScore;

      return {
        corners: scaledCorners,
        scores: { ...scores, stabilityScore, totalScore: adjustedTotal },
      };
    } catch (error) {
      console.error("Document detection error:", error);
      return null;
    }
  }, [videoRef, guideRect]);

  useEffect(() => {
    if (!isActive || !videoRef?.current) {
      consecutiveOkFramesRef.current = 0;
      return;
    }

    const interval = 1000 / fps;

    const loop = (timestamp) => {
      if (timestamp - lastAnalysisRef.current >= interval) {
        lastAnalysisRef.current = timestamp;
        const result = analyzeFrame();

        if (result) {
          const readyToCapture = result.scores.totalScore >= 0.85;

          if (readyToCapture) {
            consecutiveOkFramesRef.current++;
          } else {
            consecutiveOkFramesRef.current = 0;
          }

          const autoCapture = consecutiveOkFramesRef.current >= streakFrames;

          setDetection({
            corners: result.corners,
            scores: result.scores,
            hint: result.scores.hint,
            readyToCapture,
            autoCapture,
          });

          if (autoCapture && onReadyToCapture) {
            onReadyToCapture(result.corners);
          }
        }
      }

      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, fps, analyzeFrame, streakFrames, onReadyToCapture, videoRef]);

  const reset = useCallback(() => {
    consecutiveOkFramesRef.current = 0;
    prevCornersRef.current = null;
    setDetection({
      corners: null,
      scores: null,
      hint: "Coloca el documento dentro del marco",
      readyToCapture: false,
      autoCapture: false,
    });
  }, []);

  return {
    ...detection,
    reset,
  };
}

export default useDocumentDetection;
