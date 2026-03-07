/* eslint-disable react/prop-types */

import { useState, useEffect } from "react";
import DropZone from "./DropZone";
import ImportStats from "./ImportStats";
import ImportPreviewTable from "./ImportPreviewTable";

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ current }) {
  const steps = ["Subir archivo", "Vista previa", "Listo"];
  const stepIndex =
    current === "idle" || current === "uploading"
      ? 0
      : current === "preview" || current === "confirming"
      ? 1
      : 2;

  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5`}>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < stepIndex
                  ? "bg-emerald-500 text-white"
                  : i === stepIndex
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < stepIndex ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                i === stepIndex ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-6 h-0.5 transition-all ${
                i < stepIndex ? "bg-emerald-400" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Upload ─────────────────────────────────────────────────────────────

function UploadStep({ onPreview, loading }) {
  const [file, setFile] = useState(null);
  const [sheetName, setSheetName] = useState("");

  return (
    <div className="space-y-4">
      <DropZone onFileSelect={setFile} disabled={loading} />

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
          Nombre de hoja (opcional)
        </label>
        <input
          type="text"
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          disabled={loading}
          placeholder="Ej: Participantes"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
      </div>

      {/* Columns reference */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-blue-700 mb-2">Columnas reconocidas</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            "firstName",
            "secondName",
            "firstSurname",
            "secondSurname",
            "identification",
            "email",
            "phone",
            "role",
            "instrument",
            "passportNumber",
            "passportExpiry",
            "visaNumber",
            "visaExpiry",
          ].map((col) => (
            <span
              key={col}
              className="px-2 py-0.5 bg-white border border-blue-200 rounded-lg text-[10px] font-mono text-blue-700"
            >
              {col}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={() => onPreview(file, sheetName)}
        disabled={!file || loading}
        className="w-full py-3 rounded-2xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm disabled:opacity-40 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Procesando…
          </>
        ) : (
          "Procesar archivo"
        )}
      </button>
    </div>
  );
}

// ── Step 2: Preview ────────────────────────────────────────────────────────────

function PreviewStep({ previewData, onConfirm, onBack, loading }) {
  const { validRows, invalidRows, duplicateRows, totalRows, rows } = previewData;
  const noValidRows = validRows === 0;

  return (
    <div className="space-y-4">
      <ImportStats
        stats={{
          total: totalRows,
          valid: validRows,
          invalid: invalidRows,
          duplicates: duplicateRows,
        }}
      />

      {noValidRows && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
          <svg
            className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <p className="text-xs text-amber-700 font-medium">
            No hay filas válidas para importar. Corregí los errores en el archivo y volvé a
            intentarlo.
          </p>
        </div>
      )}

      <ImportPreviewTable rows={rows} />

      <div className="flex gap-3 pt-1">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 disabled:opacity-40 transition-all"
        >
          ← Volver
        </button>
        <button
          onClick={onConfirm}
          disabled={noValidRows || loading}
          className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-40 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Importando…
            </>
          ) : (
            `Confirmar importación (${validRows})`
          )}
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Done ───────────────────────────────────────────────────────────────

function DoneStep({ result, onNew, onClose }) {
  return (
    <div className="text-center space-y-5 py-4">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
        <svg
          className="w-8 h-8 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h4 className="text-lg font-bold text-gray-900">¡Importación completada!</h4>
        <p className="text-sm text-gray-500 mt-1">
          Los participantes han sido agregados a la gira.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-2xl p-3">
          <p className="text-xl font-bold text-emerald-700">{result?.imported ?? 0}</p>
          <p className="text-xs text-gray-500">Importados</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-3">
          <p className="text-xl font-bold text-amber-700">{result?.duplicates ?? 0}</p>
          <p className="text-xs text-gray-500">Duplicados</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-3">
          <p className="text-xl font-bold text-red-600">{result?.errors ?? 0}</p>
          <p className="text-xs text-gray-500">Errores</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onNew}
          className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
        >
          Nueva importación
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-2xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm transition-all"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

// ── Error step ─────────────────────────────────────────────────────────────────

function ErrorStep({ message, onRetry }) {
  return (
    <div className="text-center space-y-5 py-4">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <div>
        <h4 className="text-base font-bold text-gray-900">Ocurrió un error</h4>
        <p className="text-sm text-red-600 mt-1">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="w-full py-3 rounded-2xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm transition-all"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────

export default function ImportWizardModal({
  isOpen,
  step,
  previewData,
  confirmResult,
  errorMsg,
  onClose,
  onPreview,
  onConfirm,
  onRetry,
}) {
  // Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && step !== "uploading" && step !== "confirming") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, step, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isLoading = step === "uploading" || step === "confirming";
  const canClose = !isLoading;

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && canClose && onClose()}
    >
      <div className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">Importar participantes</h3>
            <p className="text-xs text-gray-400 mt-0.5">Importación desde Excel</p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-30"
          >
            ✕
          </button>
        </div>

        {/* Stepper */}
        {step !== "error" && (
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <Stepper current={step} />
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {(step === "idle" || step === "uploading") && (
            <UploadStep onPreview={onPreview} loading={step === "uploading"} />
          )}
          {(step === "preview" || step === "confirming") && previewData && (
            <PreviewStep
              previewData={previewData}
              onConfirm={onConfirm}
              onBack={onRetry}
              loading={step === "confirming"}
            />
          )}
          {step === "done" && <DoneStep result={confirmResult} onNew={onRetry} onClose={onClose} />}
          {step === "error" && <ErrorStep message={errorMsg} onRetry={onRetry} />}
        </div>
      </div>
    </div>
  );
}
