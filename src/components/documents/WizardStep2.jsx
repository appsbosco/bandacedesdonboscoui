import React, { useState } from "react";
import PropTypes from "prop-types";
import CameraAutoScanner from "./CameraAutoScanner";
import FileUploader from "./FileUploader";
import { CAMERA_TYPES, DOC_LABELS } from "../../utils/constants";

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

  // Camera path
  if (useCamera) {
    if (scanning) {
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

    return (
      <div className="flex flex-col items-center p-6 gap-5">
        <h3 className="text-lg font-semibold text-gray-800">Escanear {docLabel}</h3>
        <p className="text-sm text-gray-500 text-center">
          Coloque el documento dentro del marco y el sistema lo capturará automáticamente.
        </p>
        <div className="w-full max-w-xs bg-gray-100 rounded-2xl overflow-hidden aspect-[1.42/1] flex items-center justify-center">
          <svg
            className="w-16 h-16 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={onBack}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600"
          >
            Atrás
          </button>
          <button
            onClick={() => setScanning(true)}
            className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-medium"
          >
            Abrir cámara
          </button>
        </div>
      </div>
    );
  }

  // File upload path (PERMISO_SALIDA, OTHER)
  function handleFileReady(f) {
    setFile(f);
  }

  return (
    <div className="flex flex-col items-center p-6 gap-5">
      <h3 className="text-lg font-semibold text-gray-800">Adjuntar {docLabel}</h3>
      <p className="text-sm text-gray-500 text-center">
        Seleccione o fotografíe el documento desde su dispositivo.
      </p>
      <FileUploader onFileReady={handleFileReady} />
      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600"
        >
          Atrás
        </button>
        <button
          disabled={!file}
          onClick={() => file && onCaptured(file, null)}
          className={`flex-1 py-3 rounded-xl text-sm font-medium
            ${file ? "bg-black text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
        >
          Continuar
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
