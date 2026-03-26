/* eslint-disable react/prop-types */

import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useOcrPolling } from "../../hooks/useOcrPolling";
import { OCR_TYPES } from "../../utils/constants";

const FIELDS_BY_TYPE = {
  PASSPORT: [
    { key: "givenNames", label: "Nombres", type: "text", required: true },
    { key: "surname", label: "Apellidos", type: "text", required: true },
    { key: "passportNumber", label: "N° Pasaporte", type: "text", required: true },
    { key: "nationality", label: "Nacionalidad", type: "text", required: true },
    { key: "dateOfBirth", label: "Fecha de nacimiento", type: "date", required: true },
    { key: "sex", label: "Sexo", type: "select", options: ["M", "F", "X"], required: true },
    { key: "expirationDate", label: "Vencimiento", type: "date", required: true },
  ],
  VISA: [
    { key: "givenNames", label: "Nombres", type: "text", required: true },
    { key: "surname", label: "Apellidos", type: "text", required: true },
    { key: "passportNumber", label: "N° Pasaporte", type: "text", required: true },
    { key: "nationality", label: "Nacionalidad", type: "text", required: true },
    { key: "dateOfBirth", label: "Fecha de nacimiento", type: "date", required: true },
    { key: "sex", label: "Sexo", type: "select", options: ["M", "F", "X"], required: true },
    { key: "expirationDate", label: "Vencimiento", type: "date", required: true },
    { key: "visaType", label: "Tipo de visa", type: "text", required: true },
    { key: "visaControlNumber", label: "N° Control", type: "text", required: true },
    { key: "issueDate", label: "Fecha de emisión", type: "date", required: true },
  ],
  PERMISO_SALIDA: [
    { key: "fullName", label: "Nombre del menor", type: "text", required: true },
    { key: "documentNumber", label: "N° Documento", type: "text", required: true },
    { key: "expirationDate", label: "Vencimiento", type: "date", required: true },
    { key: "destination", label: "Destino", type: "text", required: true },
    { key: "authorizerName", label: "Autoriza", type: "text", required: true },
  ],
  OTHER: [
    { key: "fullName", label: "Nombre", type: "text", required: true },
    { key: "documentNumber", label: "N° Documento", type: "text", required: true },
    { key: "expirationDate", label: "Vencimiento", type: "date", required: true },
    { key: "notes", label: "Notas", type: "textarea" },
  ],
};

function toDateInput(val) {
  if (!val) return "";
  try {
    return new Date(val).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// ─── Shared input style ───────────────────────────────────────────────────────
const inputBase =
  "w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent";

// ─── Data form ────────────────────────────────────────────────────────────────
function getEmptyRequiredKeys(fields, values) {
  return fields
    .filter((field) => field.required)
    .filter((field) => {
      const value = values[field.key];
      return typeof value === "string" ? value.trim() === "" : !value;
    })
    .map((field) => field.key);
}

function DataForm({ fields, values, onChange, missingKeys = [] }) {
  return (
    <div className="space-y-4 w-full">
      {fields.map(({ key, label, type, options, required }) => (
        <div key={key}>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
          {type === "select" ? (
            <select
              value={values[key] || ""}
              onChange={(e) => onChange(key, e.target.value)}
              className={`${inputBase} ${
                missingKeys.includes(key) ? "border-red-300 ring-1 ring-red-100" : ""
              }`}
            >
              <option value="">—</option>
              {options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : type === "textarea" ? (
            <textarea
              value={values[key] || ""}
              onChange={(e) => onChange(key, e.target.value)}
              rows={3}
              className={`${inputBase} resize-none ${
                missingKeys.includes(key) ? "border-red-300 ring-1 ring-red-100" : ""
              }`}
            />
          ) : (
            <input
              type={type}
              value={values[key] || ""}
              onChange={(e) => onChange(key, e.target.value)}
              className={`${inputBase} ${
                missingKeys.includes(key) ? "border-red-300 ring-1 ring-red-100" : ""
              }`}
            />
          )}
          {missingKeys.includes(key) && (
            <p className="mt-1.5 text-xs font-medium text-red-600">Este campo es obligatorio.</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Shared CTA footer ────────────────────────────────────────────────────────
function ActionFooter({
  onBack,
  onConfirm,
  confirmLabel = "Confirmar",
  confirmDisabled = false,
}) {
  return (
    <div className="pt-4 space-y-3">
      <button
        onClick={onConfirm}
        disabled={confirmDisabled}
        className={`w-full py-4 rounded-2xl font-semibold text-sm shadow-sm transition-all duration-200 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          confirmDisabled
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "bg-slate-900 text-white focus:ring-slate-900"
        }`}
      >
        {confirmLabel}
      </button>
      <button
        onClick={onBack}
        className="w-full py-4 rounded-2xl border border-slate-200 text-slate-600 text-sm font-medium transition-all duration-200 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
      >
        Atrás
      </button>
    </div>
  );
}

/**
 * Step 3: OCR data review/confirmation.
 * - If preloadedDocument is provided (sync OCR succeeded), skip polling entirely.
 * - Otherwise falls back to polling for the worker to finish.
 * - For OTHER types: shows manual form directly.
 */
function WizardStep3({ documentId, documentType, preloadedDocument, onConfirm, onBack }) {
  const { status: pollStatus, document: polledDoc, startPolling, progressPct } = useOcrPolling();
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);

  const fields = FIELDS_BY_TYPE[documentType] || FIELDS_BY_TYPE.OTHER;
  const needsOcr = OCR_TYPES.includes(documentType);
  const missingRequiredKeys = getEmptyRequiredKeys(fields, form);
  const hasMissingRequiredFields = missingRequiredKeys.length > 0;
  const missingRequiredLabels = fields
    .filter((field) => missingRequiredKeys.includes(field.key))
    .map((field) => field.label);

  const hasPreloaded = preloadedDocument?.extracted != null;
  const ocrDoc = hasPreloaded ? preloadedDocument : polledDoc;

  const status = hasPreloaded
    ? preloadedDocument.status === "OCR_FAILED" || preloadedDocument.status === "REJECTED"
      ? "failed"
      : "success"
    : pollStatus;

  useEffect(() => {
    if (documentId && needsOcr && !hasPreloaded) startPolling(documentId);
  }, [documentId, needsOcr, hasPreloaded, startPolling]);

  const extractedJson = JSON.stringify(ocrDoc?.extracted || null);
  useEffect(() => {
    if (!ocrDoc?.extracted) return;
    const e = ocrDoc.extracted;
    setForm({
      givenNames: e.givenNames || "",
      surname: e.surname || "",
      fullName: e.fullName || "",
      passportNumber: e.passportNumber || "",
      documentNumber: e.documentNumber || "",
      nationality: e.nationality || "",
      dateOfBirth: toDateInput(e.dateOfBirth),
      sex: e.sex || "",
      expirationDate: toDateInput(e.expirationDate),
      issueDate: toDateInput(e.issueDate),
      visaType: e.visaType || "",
      visaControlNumber: e.visaControlNumber || "",
      destination: e.destination || "",
      authorizerName: e.authorizerName || "",
      notes: "",
    });
  }, [extractedJson]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(form);
  }, [form, onConfirm]);

  // ─── No OCR needed (OTHER) ───────────────────────────────────────────────
  if (!needsOcr) {
    return (
      <div className="flex flex-col px-5 py-6 gap-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">Datos del documento</h2>
          <p className="text-sm text-slate-500">Completa todos los campos obligatorios</p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3.5">
          <svg
            className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-slate-600">
            Si falta información, debes completarla antes de guardar el documento.
          </p>
        </div>

        <DataForm
          fields={fields}
          values={form}
          onChange={handleChange}
          missingKeys={missingRequiredKeys}
        />
        <ActionFooter
          onBack={onBack}
          onConfirm={handleConfirm}
          confirmLabel="Guardar"
          confirmDisabled={hasMissingRequiredFields}
        />
      </div>
    );
  }

  // ─── OCR Polling / Idle ──────────────────────────────────────────────────
  if (status === "idle" || status === "polling") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 gap-8">
        {/* Animated document icon */}
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-slate-100 border-t-slate-800 animate-spin" />
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <h3 className="text-lg font-semibold text-slate-900">Leyendo el documento…</h3>
          <p className="text-sm text-slate-500">Extrayendo información automáticamente</p>
        </div>

        <div className="w-full max-w-[200px] space-y-2">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="bg-slate-900 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(progressPct, 4)}%` }}
            />
          </div>
          <p className="text-xs text-center text-slate-400">Esto solo tomará un momento</p>
        </div>
      </div>
    );
  }

  // ─── OCR Success ─────────────────────────────────────────────────────────
  if (status === "success") {
    const mrzValid = ocrDoc?.extracted?.mrzValid;
    const confidence = ocrDoc?.extracted?.ocrConfidence || 0;
    const codes = ocrDoc?.extracted?.reasonCodes || [];

    const hasWarnings = codes.length > 0;
    const filledFields = fields.filter(({ key }) => form[key]);

    return (
      <div className="flex flex-col px-5 py-6 gap-5">
        {/* Warnings banner */}
        {hasWarnings && (
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-4">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="text-sm text-amber-800 space-y-0.5">
              {codes.some(
                (c) => c === "MRZ_CHECKDIGIT_FAIL" || c.startsWith("MRZ_CHECKDIGIT_FAIL_")
              ) && <p>Verificación de MRZ parcial.</p>}
              {(codes.includes("NO_MRZ_FOUND") || codes.includes("MRZ_NOT_DETECTED")) && (
                <p>No se detectó zona MRZ.</p>
              )}
              {codes.includes("NAME_NOT_FOUND") && <p>Nombre no detectado.</p>}
              {codes.includes("DATE_NOT_FOUND") && <p>Fecha de vencimiento no detectada.</p>}
              <p className="font-semibold mt-1">Revisa y corrige los campos antes de confirmar.</p>
            </div>
          </div>
        )}

        {hasMissingRequiredFields && (
          <div className="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 px-4 py-4">
            <svg
              className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
            <div className="text-sm text-red-700 space-y-1">
              <p className="font-semibold">Faltan campos obligatorios.</p>
              <p>Debes completar lo siguiente antes de confirmar:</p>
              <p>{missingRequiredLabels.join(", ")}</p>
            </div>
          </div>
        )}

        {/* Data card */}
        {!mrzValid || editMode ? (
          // Edit mode
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Revisa los datos</h3>
              {editMode && (
                <button
                  onClick={() => setEditMode(false)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-100"
                >
                  Vista resumen
                </button>
              )}
            </div>
            <p className="text-sm text-slate-500">Corrige cualquier campo si es necesario.</p>
            <DataForm
              fields={fields}
              values={form}
              onChange={handleChange}
              missingKeys={missingRequiredKeys}
            />
          </div>
        ) : (
          // Read-only summary card
          <div className="rounded-3xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold ring-1 ring-emerald-200">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  MRZ verificado
                </span>
                <span className="text-xs text-slate-400">
                  {Math.round(confidence * 100)}% confianza
                </span>
              </div>
              <button
                onClick={() => setEditMode(true)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Editar
              </button>
            </div>

            {/* Field rows */}
            <div className="divide-y divide-slate-50">
              {filledFields.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-xs font-medium text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-900 text-right max-w-[58%]">
                    {key === "passportNumber" || key === "documentNumber"
                      ? "••••" + form[key].slice(-4)
                      : form[key]}
                  </span>
                </div>
              ))}
              {filledFields.length === 0 && (
                <p className="px-5 py-4 text-sm text-slate-400 text-center">
                  No se extrajeron datos. Usa Editar para completar manualmente.
                </p>
              )}
            </div>
          </div>
        )}

        <ActionFooter
          onBack={onBack}
          onConfirm={handleConfirm}
          confirmLabel="Confirmar"
          confirmDisabled={hasMissingRequiredFields}
        />
      </div>
    );
  }

  // ─── OCR Failed / Timeout ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col px-5 py-6 gap-5">
      {/* Error card */}
      <div className="rounded-3xl bg-white ring-1 ring-red-100 shadow-sm overflow-hidden">
        <div className="px-5 py-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-red-50 flex-shrink-0 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-500"
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
            <p className="text-sm font-semibold text-slate-900">
              {status === "timeout"
                ? "El análisis tardó demasiado"
                : "No se pudo leer el documento"}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              Completa los campos manualmente para continuar.
            </p>
          </div>
        </div>
      </div>

      <DataForm
        fields={fields}
        values={form}
        onChange={handleChange}
        missingKeys={missingRequiredKeys}
      />
      <ActionFooter
        onBack={onBack}
        onConfirm={handleConfirm}
        confirmLabel="Guardar"
        confirmDisabled={hasMissingRequiredFields}
      />
    </div>
  );
}

WizardStep3.propTypes = {
  documentId: PropTypes.string,
  documentType: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onBack: PropTypes.func,
};

export default WizardStep3;
