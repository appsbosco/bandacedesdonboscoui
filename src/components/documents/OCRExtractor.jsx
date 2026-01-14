import React, { useState, useEffect, useCallback } from "react";
import { useOCR } from "../../hooks/useOCR";
import PropTypes from "prop-types";

/**
 * OCRExtractor - Procesa imagen con OCR y detecta MRZ
 */
export function OCRExtractor({ imageCanvas, onComplete, onError, documentType = "PASSPORT" }) {
  const [phase, setPhase] = useState("initializing"); // initializing, processing, complete, error
  const [result, setResult] = useState(null);

  const {
    isInitializing,
    isProcessing,
    progress,
    error: ocrError,
    initialize,
    recognize,
  } = useOCR({
    language: "eng",
  });

  // Ejecutar OCR automáticamente al montar
  useEffect(() => {
    if (!imageCanvas) return;

    const runOCR = async () => {
      setPhase("processing");

      try {
        // Inicializar worker
        await initialize();

        // Ejecutar reconocimiento
        const ocrResult = await recognize(imageCanvas);

        setResult(ocrResult);
        setPhase("complete");

        if (onComplete) {
          onComplete(ocrResult);
        }
      } catch (err) {
        console.error("OCR Error:", err);
        setPhase("error");

        if (onError) {
          onError(err.message || "Error al procesar el documento");
        }
      }
    };

    runOCR();
  }, [imageCanvas, initialize, recognize, onComplete, onError]);

  // Reintentar
  const handleRetry = useCallback(async () => {
    if (!imageCanvas) return;

    setPhase("processing");
    setResult(null);

    try {
      const ocrResult = await recognize(imageCanvas);
      setResult(ocrResult);
      setPhase("complete");

      if (onComplete) {
        onComplete(ocrResult);
      }
    } catch (err) {
      setPhase("error");
      if (onError) {
        onError(err.message);
      }
    }
  }, [imageCanvas, recognize, onComplete, onError]);

  return (
    <div className="p-6 text-center">
      {/* Inicializando */}
      {(phase === "initializing" || isInitializing) && (
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-slate-400">Inicializando reconocimiento de texto...</p>
        </div>
      )}

      {/* Procesando */}
      {phase === "processing" && isProcessing && (
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary-500/20 flex items-center justify-center relative">
            <svg
              className="w-8 h-8 text-primary-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>

            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-700"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                className="text-primary-400 transition-all duration-300"
              />
            </svg>
          </div>

          <div>
            <p className="text-white font-medium">Extrayendo datos...</p>
            <p className="text-slate-400 text-sm">{progress}% completado</p>
          </div>

          {/* Progress bar */}
          <div className="max-w-xs mx-auto">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {(phase === "error" || ocrError) && (
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
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

          <div>
            <p className="text-white font-medium">Error al procesar</p>
            <p className="text-slate-400 text-sm">
              {ocrError || "Ocurrió un error durante el reconocimiento"}
            </p>
          </div>

          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Completo */}
      {phase === "complete" && result && (
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-400"
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

          <div>
            <p className="text-white font-medium">¡Datos extraídos!</p>
            <p className="text-slate-400 text-sm">
              Confianza: {Math.round(result.confidence)}%{result.mrz && " • MRZ detectado"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default OCRExtractor;

OCRExtractor.propTypes = {
  imageCanvas: PropTypes.oneOfType([
    PropTypes.instanceOf(HTMLCanvasElement),
    PropTypes.instanceOf(HTMLImageElement),
    PropTypes.instanceOf(ImageBitmap),
  ]),
  onComplete: PropTypes.func,
  onError: PropTypes.func,
  documentType: PropTypes.string,
};

OCRExtractor.defaultProps = {
  documentType: "PASSPORT",
  imageCanvas: null,
  onComplete: undefined,
  onError: undefined,
};
