import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { OCRExtractor } from "./OCRExtractor";
import { getDocumentTypeInfo } from "../../utils/constants";
import { formatForBackend } from "../../utils/dataReconciliation";

function isBlank(v) {
  return v == null || String(v).trim() === "";
}

function toDateInput(value) {
  if (!value) return "";
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

function toDateTimeISO(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00.000Z`;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

const CanvasPropType =
  typeof HTMLCanvasElement !== "undefined"
    ? PropTypes.instanceOf(HTMLCanvasElement)
    : PropTypes.any;

export function WizardStep3({
  documentType,
  capturedCanvas,
  onConfirm,
  onRetry,
  onCancel,
  isSaving,
}) {
  const [phase, setPhase] = useState("extracting");
  const [ocrResult, setOcrResult] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [showAllFields, setShowAllFields] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const docTypeInfo = getDocumentTypeInfo(documentType);

  const handleOCRComplete = useCallback((result) => {
    setOcrResult(result);
    const fields = result.reconciled?.fields || result.extracted || {};
    setEditedData({
      fullName: fields.fullName || "",
      givenNames: fields.givenNames || "",
      surname: fields.surname || "",
      passportNumber: fields.passportNumber || fields.documentNumber || "",
      nationality: fields.nationality || "",
      issuingCountry: fields.issuingCountry || "",
      dateOfBirth: toDateInput(fields.dateOfBirth) || "",
      sex: fields.sex || "",
      issueDate: toDateInput(fields.issueDate) || "",
      expirationDate: toDateInput(fields.expirationDate) || "",
    });
    setPhase("confirming");
  }, []);

  const handleOCRError = useCallback(() => {
    setPhase("confirming");
    setEditedData({});
  }, []);

  const handleConfirm = useCallback(() => {
    if (!onConfirm) return;

    const nextErrors = {};
    if (isBlank(editedData.givenNames)) nextErrors.givenNames = "Requerido";
    if (isBlank(editedData.surname)) nextErrors.surname = "Requerido";
    if (isBlank(editedData.passportNumber)) nextErrors.passportNumber = "Requerido";
    if (isBlank(editedData.nationality)) nextErrors.nationality = "Requerido";
    if (isBlank(editedData.issuingCountry)) nextErrors.issuingCountry = "Requerido";
    if (isBlank(editedData.sex)) nextErrors.sex = "Requerido";
    if (isBlank(editedData.dateOfBirth)) nextErrors.dateOfBirth = "Requerido";
    if (isBlank(editedData.expirationDate)) nextErrors.expirationDate = "Requerido";

    const dobISO = toDateTimeISO(editedData.dateOfBirth);
    const issueISO = toDateTimeISO(editedData.issueDate);
    const expISO = toDateTimeISO(editedData.expirationDate);

    if (!dobISO && !nextErrors.dateOfBirth) nextErrors.dateOfBirth = "Fecha invalida";
    if (editedData.issueDate && !issueISO && !nextErrors.issueDate) nextErrors.issueDate = "Fecha invalida";
    if (!expISO && !nextErrors.expirationDate) nextErrors.expirationDate = "Fecha invalida";

    const computedFullName = !isBlank(editedData.fullName)
      ? editedData.fullName.trim()
      : `${editedData.givenNames} ${editedData.surname}`.trim();

    if (isBlank(computedFullName)) nextErrors.fullName = "Requerido";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    // Build backend-ready payload
    const reconciled = ocrResult?.reconciled;
    if (reconciled) {
      // Update reconciled fields with user edits
      reconciled.fields = {
        ...reconciled.fields,
        fullName: computedFullName,
        givenNames: editedData.givenNames.trim(),
        surname: editedData.surname.trim(),
        passportNumber: editedData.passportNumber.trim(),
        nationality: editedData.nationality.trim(),
        issuingCountry: editedData.issuingCountry.trim(),
        sex: editedData.sex,
        dateOfBirth: editedData.dateOfBirth,
        expirationDate: editedData.expirationDate,
        issueDate: editedData.issueDate || null,
      };

      const payload = formatForBackend(reconciled, ocrResult);
      onConfirm(payload);
    } else {
      // No reconciliation data — build manually
      onConfirm({
        fullName: computedFullName,
        givenNames: editedData.givenNames.trim(),
        surname: editedData.surname.trim(),
        passportNumber: editedData.passportNumber.trim(),
        nationality: editedData.nationality.trim(),
        issuingCountry: editedData.issuingCountry.trim(),
        sex: editedData.sex,
        dateOfBirth: dobISO,
        issueDate: issueISO,
        expirationDate: expISO,
        mrzRaw: ocrResult?.mrz?.raw || null,
        mrzValid: ocrResult?.mrz?.checkDigitsValid ?? null,
        mrzFormat: ocrResult?.mrz?.format || null,
        reasonCodes: null,
        ocrText: ocrResult?.text || null,
        ocrConfidence: ocrResult?.confidence != null ? ocrResult.confidence / 100 : null,
      });
    }
  }, [editedData, ocrResult, onConfirm]);

  const updateField = useCallback((field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  const mrzDetected = !!ocrResult?.mrz;
  const reconciled = ocrResult?.reconciled;
  const mrzValid = reconciled?.mrzValid ?? ocrResult?.mrz?.checkDigitsValid ?? false;
  const reasonCodes = reconciled?.reasonCodes || [];
  const sources = reconciled?.sources || {};

  if (phase === "extracting") {
    return (
      <div className="min-h-screen bg-slate-50 p-4 pb-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={onCancel}
              className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="text-sm text-slate-500">Paso 3 de 4</span>
            <div className="w-10" />
          </div>

          <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 ring-1 ring-sky-100 flex items-center justify-center">
                  <span className="text-xl">{docTypeInfo?.icon || "\uD83D\uDCC4"}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Extrayendo datos</p>
                  <p className="text-xs text-slate-500">
                    {docTypeInfo?.label || "Documento"} &bull; OCR + MRZ
                  </p>
                </div>
              </div>
            </div>

            {capturedCanvas && (
              <div className="px-5 pt-5">
                <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-slate-100">
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
              </div>
            )}

            <div className="px-5 py-5">
              <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-3">
                <OCRExtractor
                  imageCanvas={capturedCanvas}
                  documentType={documentType}
                  onComplete={handleOCRComplete}
                  onError={handleOCRError}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Confirming phase ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-10">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="text-sm text-slate-500">Paso 3 de 4</span>
          <div className="w-10" />
        </div>

        {/* Header card */}
        <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden mb-4">
          <div className="px-5 py-5">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                mrzDetected && mrzValid
                  ? "bg-emerald-50 ring-1 ring-emerald-200"
                  : mrzDetected
                  ? "bg-amber-50 ring-1 ring-amber-200"
                  : "bg-slate-100 ring-1 ring-slate-200"
              }`}>
                {mrzDetected && mrzValid ? (
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : mrzDetected ? (
                  <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                )}
              </div>

              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                {mrzDetected && mrzValid
                  ? "Datos verificados"
                  : mrzDetected
                  ? "Datos detectados (revisar)"
                  : "Verificar datos"}
              </h2>
              <p className="text-slate-500 text-sm">
                {mrzDetected && mrzValid
                  ? "MRZ leido y validado correctamente"
                  : mrzDetected
                  ? "MRZ detectado pero requiere verificacion"
                  : "Completa o verifica los datos antes de guardar"}
              </p>
            </div>

            {/* Validation badges */}
            {mrzDetected && (
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
                  mrzValid
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-amber-200"
                }`}>
                  {mrzValid ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                    </svg>
                  )}
                  {mrzValid ? "Check digits OK" : "Check digits con errores"}
                </span>

                {ocrResult?.confidence != null && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200 text-xs font-semibold">
                    OCR: {Math.round(ocrResult.confidence)}%
                  </span>
                )}
              </div>
            )}

            {/* Reason codes (if any conflicts) */}
            {reasonCodes.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 ring-1 ring-amber-200">
                <p className="text-xs font-semibold text-amber-800 mb-1.5">Notas de validacion:</p>
                <ul className="text-xs text-amber-700 space-y-1">
                  {reasonCodes.slice(0, 5).map((code) => (
                    <li key={code} className="flex items-start gap-1.5">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      {humanizeReasonCode(code)}
                    </li>
                  ))}
                  {reasonCodes.length > 5 && (
                    <li className="text-amber-600">+{reasonCodes.length - 5} mas</li>
                  )}
                </ul>
              </div>
            )}

            {capturedCanvas && (
              <div className="mt-5 rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-slate-100 h-32">
                <canvas
                  ref={(el) => {
                    if (el && capturedCanvas) {
                      const ctx = el.getContext("2d");
                      el.width = Math.max(1, el.clientWidth * 2);
                      el.height = Math.max(1, el.clientHeight * 2);
                      ctx.drawImage(capturedCanvas, 0, 0, el.width, el.height);
                    }
                  }}
                  className="w-full h-full object-cover block"
                />
              </div>
            )}
          </div>
        </div>

        {/* Compact view when MRZ is valid */}
        {mrzDetected && mrzValid && !showAllFields && (
          <div className="rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mb-4">
            <div className="space-y-3">
              <DataRow label="Nombre" value={editedData.fullName || `${editedData.givenNames} ${editedData.surname}`.trim()} source={sources.fullName} />
              <DataRow label="Documento" value={editedData.passportNumber} source={sources.passportNumber} />
              <DataRow label="Nacionalidad" value={editedData.nationality} source={sources.nationality} />
              <DataRow label="Nacimiento" value={formatDate(editedData.dateOfBirth)} source={sources.dateOfBirth} />
              <DataRow label="Expiracion" value={formatDate(editedData.expirationDate)} source={sources.expirationDate} />
              <DataRow label="Sexo" value={editedData.sex === "M" ? "Masculino" : editedData.sex === "F" ? "Femenino" : editedData.sex} source={sources.sex} />
            </div>
            <button
              onClick={() => setShowAllFields(true)}
              className="mt-4 w-full py-2.5 rounded-2xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Editar datos
            </button>
          </div>
        )}

        {/* Full form when no MRZ, invalid MRZ, or user clicked edit */}
        {(!mrzDetected || !mrzValid || showAllFields) && (
          <div className="rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mb-4 space-y-4">
            <FormField label="Nombres" value={editedData.givenNames} onChange={(v) => updateField("givenNames", v)} error={fieldErrors.givenNames} placeholder="Ej: Josue David" source={sources.givenNames} />
            <FormField label="Apellidos" value={editedData.surname} onChange={(v) => updateField("surname", v)} error={fieldErrors.surname} placeholder="Ej: Chinchilla Salazar" source={sources.surname} />
            <FormField label="Numero de documento" value={editedData.passportNumber} onChange={(v) => updateField("passportNumber", v)} error={fieldErrors.passportNumber} placeholder="Ej: AB1234567" source={sources.passportNumber} />

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nacionalidad" value={editedData.nationality} onChange={(v) => updateField("nationality", v)} error={fieldErrors.nationality} placeholder="CRI" source={sources.nationality} />
              <FormField label="Pais emisor" value={editedData.issuingCountry} onChange={(v) => updateField("issuingCountry", v)} error={fieldErrors.issuingCountry} placeholder="CRI" source={sources.issuingCountry} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Fecha de nacimiento" value={editedData.dateOfBirth} onChange={(v) => updateField("dateOfBirth", v)} error={fieldErrors.dateOfBirth} type="date" source={sources.dateOfBirth} />
              <FormField label="Fecha de emision" value={editedData.issueDate} onChange={(v) => updateField("issueDate", v)} error={fieldErrors.issueDate} type="date" source={sources.issueDate} />
            </div>

            <FormField label="Expiracion" value={editedData.expirationDate} onChange={(v) => updateField("expirationDate", v)} error={fieldErrors.expirationDate} type="date" source={sources.expirationDate} />

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Sexo</label>
                {sources.sex && <SourceBadge source={sources.sex} />}
              </div>
              <select
                value={editedData.sex}
                onChange={(e) => updateField("sex", e.target.value)}
                className={`w-full px-3 py-2.5 rounded-2xl bg-white border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 transition-colors ${
                  fieldErrors.sex ? "border-red-400" : "border-slate-300"
                }`}
              >
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
              {fieldErrors.sex && <p className="text-xs text-red-500 mt-1">{fieldErrors.sex}</p>}
            </div>
          </div>
        )}

        {/* MRZ raw display */}
        {mrzDetected && ocrResult?.mrz?.raw && (
          <div className="rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ring-1 ${
                mrzValid
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200"
              }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {mrzValid ? "MRZ valido" : "MRZ con errores"}
              </span>
              {ocrResult?.mrz?.format && (
                <span className="text-xs text-slate-400">{ocrResult.mrz.format}</span>
              )}
            </div>
            <pre className="text-xs text-slate-700 bg-slate-50 ring-1 ring-slate-200 rounded-2xl p-3 font-mono overflow-x-auto whitespace-pre-wrap">
              {ocrResult.mrz.raw}
            </pre>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            disabled={isSaving}
            className={`w-full py-4 rounded-2xl font-semibold transition-all duration-200 shadow-md ${
              isSaving
                ? "bg-slate-200 text-slate-500 cursor-wait"
                : "bg-sky-600 hover:bg-sky-500 text-white"
            }`}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar documento
              </span>
            )}
          </button>

          <button
            onClick={onRetry}
            disabled={isSaving}
            className="w-full py-3.5 rounded-2xl font-semibold bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            Escanear de nuevo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function SourceBadge({ source }) {
  if (!source) return null;
  const colors = {
    MRZ: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    OCR: "bg-sky-50 text-sky-700 ring-sky-200",
    MERGED: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ring-1 ${colors[source] || colors.MERGED}`}>
      {source}
    </span>
  );
}

SourceBadge.propTypes = { source: PropTypes.string };

function DataRow({ label, value, source }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <div className="flex items-center gap-1.5">
        <span className="text-slate-600 text-sm">{label}</span>
        {source && <SourceBadge source={source} />}
      </div>
      <span className="text-slate-900 font-semibold text-sm text-right truncate">{value || "\u2014"}</span>
    </div>
  );
}

DataRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  source: PropTypes.string,
};

function FormField({ label, value, onChange, placeholder, type = "text", error, source }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="block text-xs font-semibold text-slate-700">{label}</label>
        {source && <SourceBadge source={source} />}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-2xl bg-white border text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 transition-colors ${
          error ? "border-red-400" : "border-slate-300"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  error: PropTypes.string,
  source: PropTypes.string,
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("es-CR", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function humanizeReasonCode(code) {
  const map = {
    NO_DATA_SOURCES: "No se encontraron datos",
    MRZ_NOT_DETECTED: "MRZ no detectado en la imagen",
  };
  if (map[code]) return map[code];

  if (code.startsWith("CONFLICT_")) {
    const field = code.replace("CONFLICT_", "").replace("_MRZ_WINS", "").toLowerCase();
    return `Campo "${field}" difiere entre MRZ y OCR (se usa MRZ)`;
  }
  if (code.startsWith("MRZ_CHECKDIGIT_FAIL_")) {
    const field = code.replace("MRZ_CHECKDIGIT_FAIL_", "").toLowerCase();
    return `Check digit MRZ fallido para "${field}"`;
  }
  if (code.includes("OCR_FALLBACK")) {
    const field = code.replace("MRZ_MISSING_", "").replace("_OCR_FALLBACK", "").toLowerCase();
    return `Campo "${field}" tomado de OCR (no presente en MRZ)`;
  }

  return code.replace(/_/g, " ").toLowerCase();
}

WizardStep3.propTypes = {
  documentType: PropTypes.string,
  capturedCanvas: PropTypes.oneOfType([CanvasPropType, PropTypes.object]),
  onConfirm: PropTypes.func,
  onRetry: PropTypes.func,
  onCancel: PropTypes.func,
  isSaving: PropTypes.bool,
};

export default WizardStep3;
