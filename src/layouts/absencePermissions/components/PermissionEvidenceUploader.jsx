/* eslint-disable react/prop-types */
import React, { useRef, useState } from "react";
import {
  optimizeEvidenceFile,
  uploadEvidenceToCloudinary,
  validateEvidenceFile,
} from "utils/uploadEvidenceToCloudinary";

export function PermissionEvidenceUploader({ attachment, onChange, onUploadingChange }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function processFile(file) {
    try {
      validateEvidenceFile(file, 10);
      setError(null);
      setProgress(0);
      setUploading(true);
      onUploadingChange?.(true);

      const optimized = await optimizeEvidenceFile(file);
      const result = await uploadEvidenceToCloudinary(
        optimized,
        { folder: "absence_permission_evidence", tags: ["absence-permission", "evidence"] },
        setProgress
      );
      onChange({ url: result.url, name: file.name });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleChange(event) {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  }

  if (attachment) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-emerald-800">{attachment.name}</p>
          <p className="text-xs text-emerald-600">Evidencia adjunta</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs font-medium text-emerald-700 hover:text-red-600"
        >
          Quitar
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-wait"
      >
        <div className="flex items-center gap-3">
          <svg className="h-6 w-6 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-700">
              {uploading ? "Subiendo evidencia..." : "Adjuntar imagen o PDF"}
            </p>
            <p className="text-xs text-gray-400">Opcional · Máximo 10 MB · imágenes optimizadas</p>
          </div>
          {uploading && <span className="text-xs font-medium text-blue-600">{progress}%</span>}
        </div>
        {uploading && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </button>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
