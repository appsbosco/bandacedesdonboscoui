// src/components/wizard/WizardStep2.js
import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { CameraAutoScanner } from "./CameraAutoScanner";
import { DOCUMENT_TYPES } from "../../utils/constants";

/**
 * WizardStep2 - Document scanning + preview (capture only, no OCR)
 *
 * Flow: scanning -> preview -> confirm (calls onCapture to parent)
 */
export function WizardStep2({ documentType, onCapture, onCancel }) {
  const [phase, setPhase] = useState("scanning"); // scanning | preview
  const [capturedCanvas, setCapturedCanvas] = useState(null);
  const [captureMetadata, setCaptureMetadata] = useState(null);

  const docConfig = DOCUMENT_TYPES[documentType?.toUpperCase()] || DOCUMENT_TYPES.OTHER;

  const handleCapture = useCallback((canvas, metadata) => {
    setCapturedCanvas(canvas);
    setCaptureMetadata(metadata);
    setPhase("preview");
  }, []);

  const handleRetry = useCallback(() => {
    setCapturedCanvas(null);
    setCaptureMetadata(null);
    setPhase("scanning");
  }, []);

  const handleConfirm = useCallback(() => {
    if (capturedCanvas && onCapture) {
      onCapture(capturedCanvas, {
        ...captureMetadata,
        documentType,
      });
    }
  }, [capturedCanvas, captureMetadata, onCapture, documentType]);

  if (phase === "scanning") {
    return (
      <CameraAutoScanner
        documentType={documentType}
        onCapture={handleCapture}
        onCancel={onCancel}
      />
    );
  }

  // Preview phase
  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-10">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors"
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
          <span className="text-sm text-slate-500">Paso 2 de 3</span>
          <div className="w-10" />
        </div>

        {/* Preview card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-center mb-5">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-emerald-600"
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
            <h2 className="text-xl font-semibold text-slate-900 mb-1">Imagen Capturada</h2>
            <p className="text-slate-500 text-sm">Verifica que el documento se vea claramente</p>
          </div>

          {/* Image preview */}
          <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-slate-100 mb-4">
            <canvas
              ref={(el) => {
                if (el && capturedCanvas) {
                  const ctx = el.getContext("2d");
                  const maxW = el.parentElement?.clientWidth || 320;
                  const scale = Math.min(maxW / capturedCanvas.width, 1);
                  el.width = Math.round(capturedCanvas.width * scale);
                  el.height = Math.round(capturedCanvas.height * scale);
                  ctx.drawImage(capturedCanvas, 0, 0, el.width, el.height);
                }
              }}
              className="w-full block"
            />
          </div>

          {/* Capture quality info */}
          {captureMetadata?.scores && (
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 mb-5">
              <span>Calidad: {Math.round((captureMetadata.scores.totalScore || 0) * 100)}%</span>
              {captureMetadata.hadPerspectiveCorrection && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Perspectiva corregida
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              className="w-full bg-black text-white rounded-full px-5 py-3 font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                Confirmar
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
            </button>

            <button
              onClick={handleRetry}
              className="w-full border border-slate-200 rounded-full px-5 py-3 font-semibold hover:bg-slate-50 transition-colors"
            >
              Escanear de nuevo
            </button>
          </div>
        </div>

        {/* Document type indicator */}
        <div className="mt-4 text-center">
          <span className="text-xs text-slate-400">Tipo: {docConfig.label}</span>
        </div>
      </div>
    </div>
  );
}

WizardStep2.propTypes = {
  documentType: PropTypes.string.isRequired,
  onCapture: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default WizardStep2;
