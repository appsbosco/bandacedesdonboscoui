import { useState, useEffect, useRef, useCallback } from 'react';
import { analyzeFrame } from '../utils/imageAnalysis';
import { cropToScanArea } from '../utils/imageProcessing';

const TARGET_FPS     = 8;
const FRAME_MS       = 1000 / TARGET_FPS;
const STABILITY_MS   = 500;
const MIN_STREAK     = Math.ceil(TARGET_FPS * (STABILITY_MS / 1000)); // = 4 frames ≈ 0.5s

const DEFAULT_THRESHOLDS = {
  focusMin:       0.20,   // Relaxed for iPhone cameras (was 0.25)
  brightnessMin:  60,     // Slightly more tolerant in dim light (was 70)
  brightnessMax:  230,    // Slightly more tolerant in bright light (was 225)
  glareMax:       6,      // Slightly more tolerant for reflections (was 5)
};

/**
 * Analyzes video frames for quality (focus, brightness, glare).
 * Triggers auto-capture after MIN_STREAK consecutive good frames.
 */
export function useFrameAnalysis(videoRef, scanArea, options = {}) {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };

  const [quality, setQuality] = useState({
    focus: 0, brightness: 0, glare: 0,
    focusOk: false, brightnessOk: false, glareOk: false,
    allGood: false,
    hint: 'Posicione el documento dentro del marco',
    captureReady: false,
  });

  const streakRef   = useRef(0);
  const busyRef     = useRef(false);
  const lastRunRef  = useRef(0);
  const rafRef      = useRef(null);
  const canvasRef   = useRef(null);

  const getCanvas = useCallback(() => {
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
    return canvasRef.current;
  }, []);

  const analyze = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || busyRef.current) return;

    const now = performance.now();
    if (now - lastRunRef.current < FRAME_MS) return;
    lastRunRef.current = now;
    busyRef.current = true;

    try {
      const canvas = getCanvas();
      const cropped = cropToScanArea(video, scanArea, canvas);
      if (!cropped) { busyRef.current = false; return; }

      const ctx = cropped.getContext('2d');
      const imageData = ctx.getImageData(0, 0, cropped.width, cropped.height);
      const metrics = analyzeFrame(imageData);

      // analyzeFrame returns objects {score, ok, label, ...}; extract numeric scalars.
      const focusScore    = typeof metrics.focus      === 'object' ? metrics.focus.score      : metrics.focus;
      const brightnessRaw = typeof metrics.brightness === 'object' ? metrics.brightness.raw   : metrics.brightness;
      const glarePercent  = typeof metrics.glare      === 'object' ? metrics.glare.percent    : metrics.glare;
      // glareMax threshold is expressed as a percentage integer (e.g. 6 = 6%); glarePercent is 0-1.
      const glareAsPct    = glarePercent * 100;

      const focusOk      = focusScore    >= thresholds.focusMin;
      const brightnessOk = brightnessRaw >= thresholds.brightnessMin
                        && brightnessRaw <= thresholds.brightnessMax;
      const glareOk      = glareAsPct    <= thresholds.glareMax;
      // Also consider document detection from analyzeFrame for higher confidence
      const docDetected  = metrics.documentDetected !== false;
      const allGood      = focusOk && brightnessOk && glareOk && docDetected;

      if (allGood) { streakRef.current += 1; } else { streakRef.current = 0; }
      const captureReady = streakRef.current >= MIN_STREAK;

      let hint = 'Posicione el documento dentro del marco';
      if (!focusOk)      hint = 'Acerque o estabilice el dispositivo';
      else if (!brightnessOk) hint = brightnessRaw < thresholds.brightnessMin ? 'Necesita más luz' : 'Demasiada luz, busque sombra';
      else if (!glareOk) hint = 'Evite reflejos sobre el documento';
      else if (!captureReady) hint = 'Mantenga firme…';
      else hint = '¡Capturando!';

      setQuality({ ...metrics, focusOk, brightnessOk, glareOk, allGood, hint, captureReady });
    } finally {
      busyRef.current = false;
    }
  }, [videoRef, scanArea, getCanvas, thresholds]);

  const reset = useCallback(() => { streakRef.current = 0; }, []);

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      analyze();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [analyze]);

  return { quality, reset };
}
