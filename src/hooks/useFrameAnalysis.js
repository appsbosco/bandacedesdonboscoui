import { useState, useCallback, useRef, useEffect } from "react";
import { analyzeFrame, getScaledImageData } from "../utils/imageAnalysis";
import {
  detectDocument,
  calculateScores,
  getEdgeAlignments,
} from "../utils/documentDetection";
import { SCANNER_CONFIG } from "../utils/constants";

// ── Debug logger ───────────────────────────────────────
function scannerLog(category, data) {
  try {
    if (
      typeof localStorage !== "undefined" &&
      localStorage.getItem("scannerDebug") === "1"
    ) {
      // eslint-disable-next-line no-console
      console.log("[scanner] " + category, data);
    }
  } catch {
    /* noop */
  }
}

// ── Initial state factories ────────────────────────────
function createEmptyScores() {
  return {
    insideScore: 0,
    rotationScore: 0,
    perspectiveScore: 0,
    stabilityScore: 0,
    totalScore: 0,
    captureEnabled: false,
    autoCaptureReady: false,
    hint: "Coloca el documento dentro del recuadro",
  };
}

function createInitialAnalysis() {
  return {
    focus: { score: 0, ok: false, label: "Analizando..." },
    brightness: { score: 0, ok: false, label: "Analizando..." },
    glare: { score: 0, ok: false, label: "Analizando..." },
    alignment: { score: 0, ok: false, label: "Analizando..." },
    documentDetected: false,
    overallOk: false,
    overallScore: 0,
    corners: null,
    normalizedCorners: null,
    scores: createEmptyScores(),
    edgeAlignments: { top: 0, right: 0, bottom: 0, left: 0 },
    captureEnabled: false,
    autoCaptureReady: false,
    hint: "",
  };
}

function getQualityHint(result) {
  if (!result.focus.ok) return "Enfoca mejor la cámara";
  if (!result.brightness.ok) {
    return result.brightness.raw < 80 ? "Necesitas más luz" : "Hay demasiada luz";
  }
  if (!result.glare.ok) return "Evita los reflejos";
  if (!result.alignment.ok) return "Alinea el documento";
  return "";
}

// ── Hook ───────────────────────────────────────────────
/**
 * Production-grade frame analysis hook.
 *
 * Guarantees:
 * - Zero freezes: busy guard prevents stacked analyses
 * - Adaptive degradation: auto-lowers resolution/fps when slow
 * - Throttled React state: UI updates at ~4fps max
 * - Pauses when tab hidden
 * - Stable refs: rAF loop never restarts due to parent re-renders
 * - Clean teardown: cancelAnimationFrame on unmount/deactivation
 */
export function useFrameAnalysis(options = {}) {
  const {
    videoRef,
    isActive = false,
    fps = SCANNER_CONFIG.analysisFPS || 8,
    onConditionMet,
    stabilityTime = SCANNER_CONFIG.stabilityTime || 800,
    scanArea = SCANNER_CONFIG.scanArea,
    streakFrames = SCANNER_CONFIG.streakFrames || 10,
  } = options;

  // ─ React state (pushed at throttled rate) ─
  const [analysis, setAnalysis] = useState(createInitialAnalysis);
  const [captureReady, setCaptureReady] = useState(false);

  // ─ Refs ─
  const rafRef = useRef(null);
  const busyRef = useRef(false);
  const lastAnalysisTimeRef = useRef(0);
  const lastStateUpdateRef = useRef(0);
  const lastDebugLogRef = useRef(0);
  const prevCornersRef = useRef(null);

  // Auto-capture tracking
  const okStartTimeRef = useRef(null);
  const consecutiveOkRef = useRef(0);
  const autoCaptureStreakRef = useRef(0);
  const hasNotifiedRef = useRef(false);
  const captureReadyRef = useRef(false);

  // Adaptive interval + resolution
  const intervalRef = useRef(1000 / fps);
  const analysisResRef = useRef(SCANNER_CONFIG.analysisResolution || 400);

  // Stable callback refs — prevents loop restart on parent re-render
  const onConditionMetRef = useRef(onConditionMet);
  useEffect(() => {
    onConditionMetRef.current = onConditionMet;
  }, [onConditionMet]);

  // Reset target interval when fps prop changes
  useEffect(() => {
    intervalRef.current = 1000 / fps;
  }, [fps]);

  // ─ Single-frame analyzer (pure computation, no setState) ─
  const analyzeCurrentFrame = useCallback(() => {
    const video = videoRef?.current;
    if (!video || video.readyState < video.HAVE_CURRENT_DATA) return null;

    try {
      const resolution = analysisResRef.current;
      const imageData = getScaledImageData(video, resolution);

      // Layer 1: quality metrics (blur, brightness, glare, alignment)
      const quality = analyzeFrame(imageData, scanArea);

      // Layer 2: document detection + scoring
      const detection = detectDocument(imageData, scanArea);
      let scores = createEmptyScores();
      let edgeAlignments = { top: 0, right: 0, bottom: 0, left: 0 };

      if (detection.detected) {
        scores = calculateScores(detection, scanArea, prevCornersRef.current);
        edgeAlignments = getEdgeAlignments(detection, scanArea);
        prevCornersRef.current = detection.normalized;
      } else {
        prevCornersRef.current = null;
      }

      // Combine results
      const documentDetected = detection.detected && quality.documentDetected;
      const captureEnabled = scores.captureEnabled && quality.overallOk;
      const autoCaptureReady = scores.autoCaptureReady && quality.overallOk;

      // Determine primary hint
      let hint = scores.hint;
      if (!hint && !quality.overallOk) hint = getQualityHint(quality);
      if (!detection.detected) hint = "Coloca el documento dentro del recuadro";

      return {
        ...quality,
        corners: detection.corners,
        normalizedCorners: detection.normalized,
        documentDetected,
        scores,
        edgeAlignments,
        captureEnabled,
        autoCaptureReady,
        hint,
        overallOk:
          quality.overallOk && detection.detected && scores.totalScore >= 0.85,
        overallScore: detection.detected
          ? (quality.overallScore + scores.totalScore) / 2
          : quality.overallScore * 0.5,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[scanner] frame analysis error:", err);
      return null;
    }
  }, [videoRef, scanArea]);

  // Keep a ref so the rAF loop always calls the latest version
  const analyzeRef = useRef(analyzeCurrentFrame);
  analyzeRef.current = analyzeCurrentFrame;

  // ─ Main rAF loop ─
  //
  // Dependencies are intentionally minimal — callbacks and the analyze
  // function are accessed through refs so the loop is NOT torn down on
  // every parent re-render.
  useEffect(() => {
    if (!isActive || !videoRef?.current) {
      // Reset counters when inactive
      autoCaptureStreakRef.current = 0;
      consecutiveOkRef.current = 0;
      okStartTimeRef.current = null;
      hasNotifiedRef.current = false;
      prevCornersRef.current = null;
      return;
    }

    // Minimum interval between React state pushes (~4 fps)
    const STATE_UPDATE_INTERVAL = 250;
    const targetFps = fps;
    const maxRes = SCANNER_CONFIG.analysisResolution || 400;

    const loop = (timestamp) => {
      // Pause analysis when tab is hidden
      if (document.hidden) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const currentInterval = intervalRef.current;

      // Busy guard: skip if previous analysis hasn't finished
      if (
        timestamp - lastAnalysisTimeRef.current >= currentInterval &&
        !busyRef.current
      ) {
        lastAnalysisTimeRef.current = timestamp;
        busyRef.current = true;

        // Measure analysis cost for adaptive throttle
        const t0 = performance.now();
        const result = analyzeRef.current();
        const elapsed = performance.now() - t0;

        busyRef.current = false;

        // ── Adaptive throttle ──
        if (elapsed > 60) {
          // Slow: widen interval
          intervalRef.current = Math.min(intervalRef.current * 1.3, 400);
          // Very slow: also lower resolution
          if (elapsed > 100 && analysisResRef.current > 200) {
            analysisResRef.current = Math.max(
              200,
              analysisResRef.current - 50
            );
            scannerLog("adaptive", {
              action: "lower_res",
              res: analysisResRef.current,
              elapsed: Math.round(elapsed),
            });
          }
        } else if (elapsed < 25 && intervalRef.current > 1000 / targetFps) {
          // Fast: recover toward target fps
          intervalRef.current = Math.max(
            intervalRef.current * 0.9,
            1000 / targetFps
          );
          // Also recover resolution
          if (analysisResRef.current < maxRes) {
            analysisResRef.current = Math.min(
              maxRes,
              analysisResRef.current + 10
            );
          }
        }

        if (result) {
          // Throttled debug log (~1/sec)
          const now = Date.now();
          if (now - lastDebugLogRef.current >= 1000) {
            lastDebugLogRef.current = now;
            scannerLog("frame", {
              detected: result.documentDetected,
              qualityOk: result.overallOk,
              total: result.scores?.totalScore?.toFixed(2),
              captureEnabled: result.captureEnabled,
              autoCaptureReady: result.autoCaptureReady,
              hint: result.hint || "(none)",
              elapsed: Math.round(elapsed),
              interval: Math.round(intervalRef.current),
              res: analysisResRef.current,
            });
          }

          // ── Throttled UI update (~4 fps) ──
          if (timestamp - lastStateUpdateRef.current >= STATE_UPDATE_INTERVAL) {
            lastStateUpdateRef.current = timestamp;
            setAnalysis(result);
          }

          // ── Auto-capture condition tracking (runs at analysis rate) ──
          const isFrameOk =
            result.overallOk &&
            result.documentDetected &&
            result.captureEnabled &&
            result.focus.ok &&
            result.glare.ok;

          if (isFrameOk) {
            consecutiveOkRef.current++;

            if (!okStartTimeRef.current) {
              okStartTimeRef.current = timestamp;
            }

            // Track auto-capture streak
            if (result.autoCaptureReady) {
              autoCaptureStreakRef.current++;
            } else {
              autoCaptureStreakRef.current = 0;
            }

            const timeElapsed = timestamp - okStartTimeRef.current;
            const hasEnoughFrames =
              consecutiveOkRef.current >=
              (SCANNER_CONFIG.minConsecutiveFrames || 5);
            const hasStableTime = timeElapsed >= stabilityTime;
            const hasStreak = autoCaptureStreakRef.current >= streakFrames;

            if (
              hasEnoughFrames &&
              hasStableTime &&
              hasStreak &&
              !hasNotifiedRef.current
            ) {
              // Only call setCaptureReady if it actually changes
              if (!captureReadyRef.current) {
                captureReadyRef.current = true;
                setCaptureReady(true);
              }
              hasNotifiedRef.current = true;
              // Force UI update so overlay reflects capture-ready state
              setAnalysis(result);
              if (onConditionMetRef.current) {
                onConditionMetRef.current(result);
              }
            }
          } else {
            consecutiveOkRef.current = 0;
            okStartTimeRef.current = null;
            hasNotifiedRef.current = false;
            autoCaptureStreakRef.current = 0;
            // Only call setCaptureReady if it was previously true
            if (captureReadyRef.current) {
              captureReadyRef.current = false;
              setCaptureReady(false);
            }
          }
        }
      }

      // Always schedule next frame; cleanup cancels when effect re-runs
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // onConditionMet and analyzeCurrentFrame accessed via refs — NOT in deps
  }, [isActive, fps, stabilityTime, streakFrames, videoRef]);

  // ─ Reset ─
  const reset = useCallback(() => {
    okStartTimeRef.current = null;
    consecutiveOkRef.current = 0;
    hasNotifiedRef.current = false;
    autoCaptureStreakRef.current = 0;
    prevCornersRef.current = null;
    captureReadyRef.current = false;
    analysisResRef.current = SCANNER_CONFIG.analysisResolution || 400;
    intervalRef.current = 1000 / fps;
    setCaptureReady(false);
    setAnalysis(createInitialAnalysis());
  }, [fps]);

  return { analysis, captureReady, reset, analyzeCurrentFrame };
}

export default useFrameAnalysis;
