import React, { useState } from "react";
import PropTypes from "prop-types";
import CameraAutoScanner from "./CameraAutoScanner";
import FileUploader from "./FileUploader";
import { CAMERA_TYPES, DOC_LABELS } from "../../utils/constants";

const SCAN_TIPS = [
  { icon: "💡", text: "Buena iluminación, sin sombras directas" },
  { icon: "📄", text: "Documento plano y sin arrugas" },
  { icon: "🔍", text: "Texto visible y bien enfocado" },
];

/**
 * Step 2: Capture or upload the document.
 * - PASSPORT / VISA → CameraAutoScanner
 * - PERMISO_SALIDA / OTHER → FileUploader
 */
function WizardStep2({ documentType, onCaptured, onBack }) {
  const [scanning, setScanning] = useState(false);
  const [file, setFile] = useState(null);

  const useCamera = CAMERA_TYPES.includes(documentType);
  const docLabel = DOC_LABELS[documentType] || documentType;

  // ── Camera path: live scanner fullscreen ────────────────────────────────────
  if (useCamera && scanning) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <CameraAutoScanner
          documentType={documentType}
          onCapture={(b, m) => {
            onCaptured(b, m);
            setScanning(false);
          }}
          onCancel={() => setScanning(false)}
        />
      </div>
    );
  }

  // ── Camera path: pre-scan guidance screen ───────────────────────────────────
  if (useCamera) {
    return (
      <div className="flex flex-col min-h-full">
        {/* Content */}
        <div className="flex-1 flex flex-col items-center px-5 py-8 gap-7">
          {/* Heading */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">Escanear {docLabel}</h2>
            <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
              Apunta la cámara al documento y el sistema lo capturará solo
            </p>
          </div>

          {/* Document frame placeholder */}
          <div className="relative w-full max-w-[300px]">
            <div className="aspect-[1.42/1] rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden">
              <div className="flex flex-col items-center gap-3 text-center px-6 my-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  La cámara detecta y captura automáticamente
                </p>
              </div>
            </div>
            {/* Scanning frame corners */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-slate-400 rounded-tl" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-slate-400 rounded-tr" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-slate-400 rounded-bl" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-slate-400 rounded-br" />
          </div>

          {/* Tips */}
          <div className="w-full max-w-[300px] space-y-2.5 mt-10">
            {SCAN_TIPS.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-base leading-none">{icon}</span>
                <span className="text-sm text-slate-500">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky CTA footer */}
        <div className="px-5 pb-8 pt-4 border-t border-slate-100 space-y-3 bg-slate-50">
          <button
            onClick={() => setScanning(true)}
            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-semibold text-sm shadow-sm transition-all duration-200 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              Abrir cámara
            </span>
          </button>
          <button
            onClick={onBack}
            className="w-full py-4 rounded-2xl border border-slate-200 text-slate-600 text-sm font-medium transition-all duration-200 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          >
            Atrás
          </button>
        </div>
      </div>
    );
  }

  // ── File upload path ─────────────────────────────────────────────────────────
  function handleFileReady(f) {
    setFile(f);
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Content */}
      <div className="flex-1 flex flex-col px-5 py-8 gap-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Adjuntar {docLabel}</h2>
          <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
            Selecciona o fotografía el documento desde tu dispositivo
          </p>
        </div>
        <FileUploader onFileReady={handleFileReady} />
      </div>

      {/* Sticky CTA footer */}
      <div className="px-5 pb-8 pt-4 border-t border-slate-100 space-y-3 bg-slate-50">
        <button
          disabled={!file}
          onClick={() => file && onCaptured(file, null)}
          className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2
            ${
              file
                ? "bg-slate-900 text-white shadow-sm focus:ring-slate-900"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
        >
          Continuar
        </button>
        <button
          onClick={onBack}
          className="w-full py-4 rounded-2xl border border-slate-200 text-slate-600 text-sm font-medium transition-all duration-200 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
        >
          Atrás
        </button>
      </div>
    </div>
  );
}

WizardStep2.propTypes = {
  documentType: PropTypes.string.isRequired,
  onCaptured: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default WizardStep2;
