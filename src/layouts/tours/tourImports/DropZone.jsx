/* eslint-disable react/prop-types */

import { useState, useRef } from "react";

export default function DropZone({ onFileSelect, disabled }) {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const accept = ".xlsx,.xls";

  const processFile = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls"].includes(ext)) {
      alert("Solo se aceptan archivos .xlsx o .xls");
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    processFile(e.dataTransfer.files[0]);
  };

  const onInputChange = (e) => {
    processFile(e.target.files[0]);
    e.target.value = "";
  };

  const clear = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    onFileSelect(null);
  };

  if (selectedFile) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-800 truncate">{selectedFile.name}</p>
          <p className="text-xs text-emerald-600">
            {(selectedFile.size / 1024).toFixed(1)} KB • listo para procesar
          </p>
        </div>
        {!disabled && (
          <button
            onClick={clear}
            className="text-emerald-500 hover:text-emerald-700 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer
        ${
          disabled
            ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
            : dragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        }`}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
        ${dragging ? "bg-blue-100" : "bg-white border border-gray-200"}`}
      >
        <svg
          className={`w-6 h-6 ${dragging ? "text-blue-500" : "text-gray-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">
          {dragging ? "Suelta el archivo aquí" : "Arrastrá o hacé click para subir"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Archivos .xlsx o .xls</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
