import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  uploadEvidenceToCloudinary,
  validateEvidenceFile,
} from "utils/uploadEvidenceToCloudinary";

/**
 * EvidenceUploader — sube imagen o PDF a Cloudinary
 * Llama a onUpload({ url, publicId, resourceType, originalName }) cuando termina
 */
export function EvidenceUploader({ onUpload, onError, disabled, inputId }) {
  const fileInputRef = useRef(null);
  const [state, setState] = useState("idle"); // idle | uploading | success | error
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  async function processFile(file) {
    try {
      validateEvidenceFile(file, 10);
    } catch (e) {
      onError?.(e.message);
      return;
    }

    setFileName(file.name);
    setState("uploading");
    setProgress(0);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    try {
      const result = await uploadEvidenceToCloudinary(
        file,
        { folder: "academic_evidence", tags: ["academic", "evidence"] },
        (pct) => setProgress(pct)
      );
      setState("success");
      onUpload(result);
    } catch (e) {
      setState("error");
      onError?.(e.message);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleReset() {
    setState("idle");
    setProgress(0);
    setPreview(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="w-full">
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || state === "uploading"}
      />

      {state === "idle" && (
        <div
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
            ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-gray-50"}
          `}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-700 font-medium">
              Arrastra aquí o <span className="text-blue-600 underline">selecciona archivo</span>
            </p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP o PDF · Máx. 10 MB</p>
          </div>
        </div>
      )}

      {state === "uploading" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-700 truncate">{fileName}</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{progress}%</p>
        </div>
      )}

      {state === "success" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          {preview ? (
            <img src={preview} alt="Evidencia" className="w-full max-h-40 object-contain rounded-lg mb-2" />
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-emerald-700 truncate">{fileName}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs text-emerald-700">Subida exitosa</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
            >
              Cambiar
            </button>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-xs text-red-600">Error al subir archivo</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}

EvidenceUploader.propTypes = {
  onUpload: PropTypes.func.isRequired,
  onError: PropTypes.func,
  disabled: PropTypes.bool,
  inputId: PropTypes.string,
};

export default EvidenceUploader;
