import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { useOCR } from "../../hooks/useOCR";
import { extractMRZRegion } from "../../utils/imageProcessing";
import { reconcileData } from "../../utils/dataReconciliation";

/**
 * OCRExtractor — dual-pass OCR component.
 *
 * Pass 1: Full-image OCR for general text extraction
 * Pass 2: MRZ-region OCR for focused MRZ reading (PASSPORT/VISA only)
 *
 * Results are reconciled: MRZ fields win when check digits pass,
 * OCR fills gaps for fields MRZ doesn't carry (issueDate, visaType).
 */
export function OCRExtractor({ imageCanvas, onComplete, onError, documentType = "PASSPORT" }) {
  const [phase, setPhase] = useState("initializing");
  const [passLabel, setPassLabel] = useState("");
  const hasRunRef = useRef(false);

  const {
    isInitializing,
    isProcessing,
    progress,
    error: ocrError,
    initialize,
    recognize,
  } = useOCR({ language: "eng" });

  const needsMRZ = ["PASSPORT", "VISA"].includes(documentType?.toUpperCase());

  useEffect(() => {
    if (!imageCanvas || hasRunRef.current) return;
    hasRunRef.current = true;

    const runDualPassOCR = async () => {
      setPhase("processing");

      try {
        await initialize();

        // Pass 1: full image OCR
        setPassLabel("Analizando imagen completa...");
        const fullResult = await recognize(imageCanvas);

        let mrzResult = null;

        // Pass 2: MRZ region OCR (only for passport/visa)
        if (needsMRZ) {
          try {
            setPassLabel("Leyendo zona MRZ...");
            const mrzCanvas = extractMRZRegion(imageCanvas, documentType);
            mrzResult = await recognize(mrzCanvas);
          } catch (err) {
            console.warn("[OCRExtractor] MRZ region pass failed:", err);
            // Non-fatal — continue with full image results
          }
        }

        // Pick the better MRZ result between both passes
        const bestMRZ = pickBetterMRZ(fullResult, mrzResult);

        // Reconcile data from both sources
        const mrzParsed = bestMRZ?.mrz?.parsed || null;
        const ocrExtracted = fullResult?.extracted || {};
        const mrzCheckDigitsValid = bestMRZ?.mrz?.checkDigitsValid ?? false;
        const mrzConfidence = bestMRZ?.mrz?.confidence ?? 0;

        const reconciled = reconcileData(mrzParsed, ocrExtracted, {
          mrzCheckDigitsValid,
          mrzConfidence,
          ocrConfidence: fullResult?.confidence ?? 0,
        });

        const enrichedResult = {
          text: fullResult?.text || "",
          confidence: fullResult?.confidence ?? 0,
          mrz: bestMRZ?.mrz || null,
          extracted: reconciled.fields,
          reconciled,
          words: fullResult?.words || [],
          lines: fullResult?.lines || [],
        };

        setPhase("complete");

        if (onComplete) {
          onComplete(enrichedResult);
        }
      } catch (err) {
        console.error("[OCRExtractor] error:", err);
        setPhase("error");
        if (onError) {
          onError(err.message || "Error al procesar el documento");
        }
      }
    };

    runDualPassOCR();
  }, [imageCanvas, initialize, recognize, onComplete, onError, needsMRZ, documentType]);

  const handleRetry = useCallback(async () => {
    if (!imageCanvas) return;
    hasRunRef.current = false;
    setPhase("processing");
    setPassLabel("Reintentando...");

    try {
      const result = await recognize(imageCanvas);
      setPhase("complete");
      if (onComplete) onComplete(result);
    } catch (err) {
      setPhase("error");
      if (onError) onError(err.message);
    }
  }, [imageCanvas, recognize, onComplete, onError]);

  return (
    <div className="p-5 text-center">
      {/* Initializing */}
      {(phase === "initializing" || isInitializing) && (
        <div className="space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-sky-50 ring-1 ring-sky-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-sky-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">Inicializando reconocimiento...</p>
        </div>
      )}

      {/* Processing */}
      {phase === "processing" && isProcessing && (
        <div className="space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-sky-50 ring-1 ring-sky-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <div>
            <p className="text-slate-900 font-medium text-sm">Extrayendo datos...</p>
            <p className="text-slate-500 text-xs mt-1">{passLabel || `${progress}% completado`}</p>
          </div>

          <div className="max-w-xs mx-auto">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-200">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {(phase === "error" || ocrError) && (
        <div className="space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 ring-1 ring-red-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div>
            <p className="text-slate-900 font-medium text-sm">Error al procesar</p>
            <p className="text-slate-500 text-xs">{ocrError || "Error durante el reconocimiento"}</p>
          </div>

          <button
            onClick={handleRetry}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Complete */}
      {phase === "complete" && (
        <div className="space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <p className="text-slate-900 font-medium text-sm">Datos extraidos</p>
            <p className="text-slate-500 text-xs">Procesamiento completado</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Pick the better MRZ result between two OCR passes.
 * Prefers the pass with valid check digits, or higher confidence.
 */
function pickBetterMRZ(fullResult, mrzRegionResult) {
  const fullMRZ = fullResult?.mrz;
  const regionMRZ = mrzRegionResult?.mrz;

  if (!fullMRZ && !regionMRZ) return null;
  if (!fullMRZ) return mrzRegionResult;
  if (!regionMRZ) return fullResult;

  // Prefer the one with valid check digits
  if (regionMRZ.checkDigitsValid && !fullMRZ.checkDigitsValid) return mrzRegionResult;
  if (fullMRZ.checkDigitsValid && !regionMRZ.checkDigitsValid) return fullResult;

  // Both valid or both invalid — prefer higher confidence
  const regionConf = regionMRZ.confidence ?? 0;
  const fullConf = fullMRZ.confidence ?? 0;
  return regionConf >= fullConf ? mrzRegionResult : fullResult;
}

export default OCRExtractor;

OCRExtractor.propTypes = {
  imageCanvas: PropTypes.oneOfType([
    typeof HTMLCanvasElement !== "undefined"
      ? PropTypes.instanceOf(HTMLCanvasElement)
      : PropTypes.any,
    PropTypes.instanceOf(HTMLImageElement),
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
