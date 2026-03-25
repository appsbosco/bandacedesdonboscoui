/* eslint-disable react/prop-types */

import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useOcrPolling } from "../../hooks/useOcrPolling";
import { OCR_TYPES } from "../../utils/constants";

const FIELDS_BY_TYPE = {
  PASSPORT: [
    { key: "givenNames", label: "Nombres", type: "text" },
    { key: "surname", label: "Apellidos", type: "text" },
    { key: "passportNumber", label: "N° Pasaporte", type: "text" },
    { key: "nationality", label: "Nacionalidad", type: "text" },
    { key: "dateOfBirth", label: "Fecha de nacimiento", type: "date" },
    { key: "sex", label: "Sexo", type: "select", options: ["M", "F", "X"] },
    { key: "expirationDate", label: "Vencimiento", type: "date" },
  ],
  VISA: [
    { key: "givenNames", label: "Nombres", type: "text" },
    { key: "surname", label: "Apellidos", type: "text" },
    { key: "passportNumber", label: "N° Pasaporte", type: "text" },
    { key: "nationality", label: "Nacionalidad", type: "text" },
    { key: "dateOfBirth", label: "Fecha de nacimiento", type: "date" },
    { key: "sex", label: "Sexo", type: "select", options: ["M", "F", "X"] },
    { key: "expirationDate", label: "Vencimiento", type: "date" },
    { key: "visaType", label: "Tipo de visa", type: "text" },
    { key: "issueDate", label: "Fecha de emisión", type: "date" },
  ],
  PERMISO_SALIDA: [
    { key: "fullName", label: "Nombre del menor", type: "text" },
    { key: "documentNumber", label: "N° Documento", type: "text" },
    { key: "expirationDate", label: "Vencimiento", type: "date" },
    { key: "destination", label: "Destino", type: "text" },
    { key: "authorizerName", label: "Autoriza", type: "text" },
  ],
  OTHER: [
    { key: "fullName", label: "Nombre", type: "text" },
    { key: "documentNumber", label: "N° Documento", type: "text" },
    { key: "expirationDate", label: "Vencimiento", type: "date" },
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

function DataForm({ fields, values, onChange }) {
  return (
    <div className="space-y-3 w-full">
      {fields.map(({ key, label, type, options }) => {
        if (type === "select") {
          return (
            <div key={key}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <select
                value={values[key] || ""}
                onChange={(e) => onChange(key, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value="">—</option>
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (type === "textarea") {
          return (
            <div key={key}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <textarea
                value={values[key] || ""}
                onChange={(e) => onChange(key, e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          );
        }
        return (
          <div key={key}>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <input
              type={type}
              value={values[key] || ""}
              onChange={(e) => onChange(key, e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Step 3: OCR polling + data review/confirmation.
 * - For OCR_TYPES: polls server until extraction completes, shows results, allows editing.
 * - For OTHER: shows manual form directly.
 */
function WizardStep3({ documentId, documentType, onConfirm, onBack }) {
  const { status, document: ocrDoc, startPolling, progressPct } = useOcrPolling();
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);

  const fields = FIELDS_BY_TYPE[documentType] || FIELDS_BY_TYPE.OTHER;
  const needsOcr = OCR_TYPES.includes(documentType);

  // Start polling if document needs OCR
  useEffect(() => {
    if (documentId && needsOcr) startPolling(documentId);
  }, [documentId, needsOcr, startPolling]);

  // Populate form when OCR data arrives
  useEffect(() => {
    if (ocrDoc?.extracted) {
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
        destination: e.destination || "",
        authorizerName: e.authorizerName || "",
        notes: "",
      });
    }
  }, [ocrDoc]);

  const handleChange = useCallback((key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(form);
  }, [form, onConfirm]);

  // ─── No OCR needed (OTHER) ───────────────────────────────────────────────
  if (!needsOcr) {
    return (
      <div className="flex flex-col p-5 gap-4">
        <h3 className="text-base font-semibold text-gray-800">Datos del documento</h3>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
          <p className="text-sm font-semibold text-sky-900">Todo este bloque es opcional</p>
          <p className="text-sm text-sky-700">
            Puede guardar el documento sin llenar ningún campo adicional.
          </p>
        </div>
        <DataForm fields={fields} values={form} onChange={handleChange} />
        <div className="flex gap-3 pt-2">
          <button
            onClick={onBack}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600"
          >
            Atrás
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-medium"
          >
            Guardar
          </button>
        </div>
      </div>
    );
  }

  // ─── OCR Polling ─────────────────────────────────────────────────────────
  if (status === "idle" || status === "polling") {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4 min-h-[320px]">
        <div className="animate-spin w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full" />
        <h3 className="text-base font-semibold text-gray-800">Analizando documento…</h3>
        <p className="text-sm text-gray-400">Extrayendo información automáticamente</p>
        <div className="w-full max-w-xs bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-black h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(progressPct, 4)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">Puede tomar hasta 30 segundos</p>
      </div>
    );
  }

  // ─── OCR Success ─────────────────────────────────────────────────────────
  if (status === "success") {
    const mrzValid = ocrDoc?.extracted?.mrzValid;
    const confidence = ocrDoc?.extracted?.ocrConfidence || 0;
    const codes = ocrDoc?.extracted?.reasonCodes || [];

    return (
      <div className="flex flex-col p-5 gap-4">
        {/* Status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {mrzValid ? (
            <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              ✓ MRZ verificado
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
              ⚠ Requiere revisión
            </span>
          )}
          <span className="text-xs text-gray-400">Confianza {Math.round(confidence * 100)}%</span>
        </div>

        {/* Warnings */}
        {codes.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
            {codes.includes("MRZ_CHECKDIGIT_FAIL") && <p>Verificación de MRZ parcial.</p>}
            {codes.includes("NO_MRZ_FOUND") && <p>No se detectó zona MRZ.</p>}
            {codes.includes("NAME_NOT_FOUND") && <p>Nombre no detectado.</p>}
            {codes.includes("DATE_NOT_FOUND") && <p>Fecha de vencimiento no detectada.</p>}
            <p className="mt-1 font-medium">Revise y corrija los campos antes de confirmar.</p>
          </div>
        )}

        {/* Data form (pre-filled + editable) */}
        {!mrzValid || editMode ? (
          <>
            <p className="text-xs text-gray-500">Corrija cualquier campo si es necesario.</p>
            <DataForm fields={fields} values={form} onChange={handleChange} />
          </>
        ) : (
          <>
            {/* Compact read-only view */}
            <div className="divide-y divide-gray-100">
              {fields.map(({ key, label }) =>
                form[key] ? (
                  <div key={key} className="flex justify-between py-2">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-xs font-medium text-gray-800 text-right max-w-[60%]">
                      {key === "passportNumber" || key === "documentNumber"
                        ? "••••" + form[key].slice(-4)
                        : form[key]}
                    </span>
                  </div>
                ) : null
              )}
            </div>
            <button
              onClick={() => setEditMode(true)}
              className="text-xs text-indigo-500 self-start"
            >
              Editar datos
            </button>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onBack}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600"
          >
            Atrás
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-medium"
          >
            Confirmar
          </button>
        </div>
      </div>
    );
  }

  // ─── OCR Failed / Timeout ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col p-5 gap-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-red-700">
          {status === "timeout"
            ? "El análisis tardó demasiado"
            : "No se pudieron extraer los datos"}
        </p>
        <p className="text-sm text-red-600 mt-1">Complete los campos manualmente.</p>
      </div>
      <DataForm fields={fields} values={form} onChange={handleChange} />
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600"
        >
          Atrás
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-medium"
        >
          Guardar
        </button>
      </div>
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
