import React, { useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { CameraAutoScanner } from "./CameraAutoScanner";
import { DOCUMENT_TYPES } from "../../utils/constants";

export function WizardStep2({ documentType, onCapture, onFileUpload, onCancel }) {
  const [phase, setPhase] = useState("scanning");
  const [capturedCanvas, setCapturedCanvas] = useState(null);
  const [captureMetadata, setCaptureMetadata] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const isOther = documentType?.toUpperCase() === "OTHER";
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
      onCapture(capturedCanvas, { ...captureMetadata, documentType });
    }
  }, [capturedCanvas, captureMetadata, onCapture, documentType]);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setSelectedFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setPhase("preview");
    },
    [previewUrl]
  );

  const handleFileConfirm = useCallback(() => {
    if (selectedFile && onFileUpload) {
      onFileUpload(selectedFile);
    }
  }, [selectedFile, onFileUpload]);

  const handleFileRetry = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhase("scanning");
  }, [previewUrl]);

  // --- Modo OTHER: file picker ---
  if (isOther) {
    if (phase === "scanning") {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={onCancel}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
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

            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sky-50 ring-1 ring-sky-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-sky-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Adjuntar documento</h2>
              <p className="text-sm text-slate-500">
                Seleccioná una imagen o PDF desde tu dispositivo
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-sky-400 hover:bg-sky-50 transition-all"
            >
              <svg
                className="w-8 h-8 mx-auto mb-2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-sm font-medium text-slate-600">Elegir archivo</span>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, PDF — hasta 10 MB</p>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={onCancel}
              className="w-full mt-4 text-sm text-slate-500 hover:text-slate-700 py-2 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      );
    }

    // Preview del archivo seleccionado
    return (
      <div className="min-h-screen bg-slate-50 p-4 pb-10">
        <div className="max-w-md mx-auto">
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

          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-center mb-5">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Archivo seleccionado</h2>
              <p className="text-sm text-slate-500 truncate">{selectedFile?.name}</p>
            </div>

            {previewUrl && selectedFile?.type?.startsWith("image/") && (
              <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-slate-100 mb-4">
                <img src={previewUrl} alt="Preview" className="w-full block" />
              </div>
            )}

            {selectedFile?.type === "application/pdf" && (
              <div className="rounded-2xl bg-slate-100 ring-1 ring-slate-200 p-6 mb-4 text-center">
                <svg
                  className="w-10 h-10 mx-auto text-red-400 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm text-slate-500">PDF adjunto</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleFileConfirm}
                className="w-full bg-black text-white rounded-full px-5 py-3 font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all"
              >
                Confirmar y subir
              </button>
              <button
                onClick={handleFileRetry}
                className="w-full border border-slate-200 rounded-full px-5 py-3 font-semibold hover:bg-slate-50 transition-colors"
              >
                Elegir otro archivo
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-slate-400">Tipo: {docConfig.label}</span>
          </div>
        </div>
      </div>
    );
  }

  // --- Modo normal: cámara ---
  if (phase === "scanning") {
    return (
      <CameraAutoScanner
        documentType={documentType}
        onCapture={handleCapture}
        onCancel={onCancel}
      />
    );
  }

  // Preview cámara (código original tuyo, sin cambios)
  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-10">
      <div className="max-w-md mx-auto">
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
  onFileUpload: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default WizardStep2;
