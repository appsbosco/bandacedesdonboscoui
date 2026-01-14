// src/components/wizard/WizardStep3.js
import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { OCRExtractor } from "../../components/documents/OCRExtractor";
import { getDocumentTypeInfo } from "../../utils/constants";
import { DOCUMENT_TYPES } from "../../utils/constants";

function toDateTimeISO(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00.000Z`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function isBlank(v) {
  return v == null || String(v).trim() === "";
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

  const handleOCRComplete = useCallback(
    (result) => {
      const docTypeInfo = DOCUMENT_TYPES[documentType] || {};
      const hasMRZ = docTypeInfo.hasMRZ;

      // Si el documento requiere MRZ y no se detectó o confianza < 80%, pedir reintento
      if (hasMRZ && (!result.mrz || (result.confidence && result.confidence < 80))) {
        setPhase("mrz_failed");
        setOcrResult(result);
        return;
      }

      setOcrResult(result);
      const extracted = result.extracted || {};
      setEditedData({
        fullName: extracted.fullName || "",
        givenNames: extracted.givenNames || "",
        surname: extracted.surname || "",
        passportNumber: extracted.passportNumber || extracted.documentNumber || "",
        nationality: extracted.nationality || "",
        issuingCountry: extracted.issuingCountry || "",
        dateOfBirth: extracted.dateOfBirth || "",
        sex: extracted.sex || "",
        issueDate: extracted.issueDate || "",
        expirationDate: extracted.expirationDate || "",
      });
      setPhase("confirming");
    },
    [documentType]
  );
  // const handleOCRComplete = useCallback((result) => {
  //   setOcrResult(result);
  //   const extracted = result.extracted || {};
  //   setEditedData({
  //     fullName: extracted.fullName || "",
  //     givenNames: extracted.givenNames || "",
  //     surname: extracted.surname || "",
  //     passportNumber: extracted.passportNumber || extracted.documentNumber || "",
  //     nationality: extracted.nationality || "",
  //     issuingCountry: extracted.issuingCountry || "",
  //     dateOfBirth: extracted.dateOfBirth || "",
  //     sex: extracted.sex || "",
  //     issueDate: extracted.issueDate || "",
  //     expirationDate: extracted.expirationDate || "",
  //   });
  //   setPhase("confirming");
  // }, []);

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
    if (isBlank(editedData.issueDate)) nextErrors.issueDate = "Requerido";
    if (isBlank(editedData.expirationDate)) nextErrors.expirationDate = "Requerido";

    const dobISO = toDateTimeISO(editedData.dateOfBirth);
    const issueISO = toDateTimeISO(editedData.issueDate);
    const expISO = toDateTimeISO(editedData.expirationDate);

    if (!dobISO && !nextErrors.dateOfBirth) nextErrors.dateOfBirth = "Fecha inválida";
    if (!issueISO && !nextErrors.issueDate) nextErrors.issueDate = "Fecha inválida";
    if (!expISO && !nextErrors.expirationDate) nextErrors.expirationDate = "Fecha inválida";

    const computedFullName = !isBlank(editedData.fullName)
      ? editedData.fullName.trim()
      : `${editedData.givenNames} ${editedData.surname}`.trim();

    if (isBlank(computedFullName)) nextErrors.fullName = "Requerido";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

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
      ocrText: ocrResult?.text || null,
      ocrConfidence: ocrResult?.confidence ?? null,
    });
  }, [editedData, ocrResult, onConfirm]);

  const updateField = useCallback((field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  const mrzDetected = !!ocrResult?.mrz;

  if (phase === "mrz_failed") {
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
            <span className="text-sm text-slate-500">Paso 3 de 3</span>
            <div className="w-10" />
          </div>

          <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
            <div className="px-5 py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-amber-600"
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
              <h2 className="text-xl font-semibold text-slate-900 mb-2">MRZ no detectado</h2>
              <p className="text-slate-500 text-sm mb-6">
                No pudimos leer la zona MRZ del documento. Asegúrate de que:
              </p>
              <ul className="text-left text-slate-600 text-sm space-y-2 mb-6 px-4">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  El documento esté bien iluminado
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  La zona MRZ (líneas inferiores) sea visible
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  La imagen no esté borrosa ni cortada
                </li>
              </ul>

              <div className="space-y-3">
                <button
                  onClick={onRetry}
                  className="w-full py-4 rounded-2xl font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-lg transition-all"
                >
                  Escanear de nuevo
                </button>
                <button
                  onClick={() => {
                    const extracted = ocrResult?.extracted || {};
                    setEditedData({
                      fullName: extracted.fullName || "",
                      givenNames: extracted.givenNames || "",
                      surname: extracted.surname || "",
                      passportNumber: extracted.passportNumber || extracted.documentNumber || "",
                      nationality: extracted.nationality || "",
                      issuingCountry: extracted.issuingCountry || "",
                      dateOfBirth: extracted.dateOfBirth || "",
                      sex: extracted.sex || "",
                      issueDate: extracted.issueDate || "",
                      expirationDate: extracted.expirationDate || "",
                    });
                    setPhase("confirming");
                  }}
                  className="w-full py-3.5 rounded-2xl font-semibold bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Continuar sin MRZ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <span className="text-sm text-slate-500">Paso 3 de 3</span>
            <div className="w-10" />
          </div>

          <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 ring-1 ring-sky-100 flex items-center justify-center">
                  <span className="text-xl">{docTypeInfo?.icon || "📄"}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Extrayendo datos</p>
                  <p className="text-xs text-slate-500">
                    {docTypeInfo?.label || "Documento"} • OCR + MRZ
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
          <span className="text-sm text-slate-500">Paso 3 de 3</span>
          <div className="w-10" />
        </div>

        <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden mb-4">
          <div className="px-5 py-5">
            <div className="text-center">
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  mrzDetected
                    ? "bg-emerald-50 ring-1 ring-emerald-200"
                    : "bg-amber-50 ring-1 ring-amber-200"
                }`}
              >
                {mrzDetected ? (
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                )}
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                {mrzDetected ? "Datos detectados" : "Verificar datos"}
              </h2>
              <p className="text-slate-500 text-sm">
                {mrzDetected
                  ? `MRZ detectado • Confianza: ${Math.round(ocrResult?.confidence || 0)}%`
                  : "Completa o verifica los datos antes de guardar"}
              </p>
            </div>

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

        {mrzDetected && !showAllFields && (
          <div className="rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mb-4">
            <div className="space-y-3">
              <DataRow
                label="Nombre"
                value={
                  editedData.fullName || `${editedData.givenNames} ${editedData.surname}`.trim()
                }
              />
              <DataRow label="Documento" value={editedData.passportNumber} />
              <DataRow label="Nacionalidad" value={editedData.nationality} />
              <DataRow label="Nacimiento" value={formatDate(editedData.dateOfBirth)} />
              <DataRow label="Expiración" value={formatDate(editedData.expirationDate)} />
            </div>
            <button
              onClick={() => setShowAllFields(true)}
              className="mt-4 w-full py-2.5 rounded-2xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Editar datos
            </button>
          </div>
        )}

        {(!mrzDetected || showAllFields) && (
          <div className="rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mb-4 space-y-4">
            <FormField
              label="Nombres"
              value={editedData.givenNames}
              onChange={(v) => updateField("givenNames", v)}
              error={fieldErrors.givenNames}
              placeholder="Ej: Josué David"
            />
            <FormField
              label="Apellidos"
              value={editedData.surname}
              onChange={(v) => updateField("surname", v)}
              error={fieldErrors.surname}
              placeholder="Ej: Chinchilla Salazar"
            />
            <FormField
              label="Número de documento"
              value={editedData.passportNumber}
              onChange={(v) => updateField("passportNumber", v)}
              error={fieldErrors.passportNumber}
              placeholder="Ej: AB1234567"
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Nacionalidad"
                value={editedData.nationality}
                onChange={(v) => updateField("nationality", v)}
                error={fieldErrors.nationality}
                placeholder="Costarricense"
              />
              <FormField
                label="País emisor"
                value={editedData.issuingCountry}
                onChange={(v) => updateField("issuingCountry", v)}
                error={fieldErrors.issuingCountry}
                placeholder="Costa Rica"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Fecha de nacimiento"
                value={editedData.dateOfBirth}
                onChange={(v) => updateField("dateOfBirth", v)}
                error={fieldErrors.dateOfBirth}
                type="date"
              />
              <FormField
                label="Fecha de emisión"
                value={editedData.issueDate}
                onChange={(v) => updateField("issueDate", v)}
                error={fieldErrors.issueDate}
                type="date"
              />
            </div>

            <FormField
              label="Expiración"
              value={editedData.expirationDate}
              onChange={(v) => updateField("expirationDate", v)}
              error={fieldErrors.expirationDate}
              type="date"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sexo</label>
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

        {mrzDetected && (
          <div className="rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-xs font-semibold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                MRZ detectado
              </span>
            </div>
            <pre className="text-xs text-slate-700 bg-slate-50 ring-1 ring-slate-200 rounded-2xl p-3 font-mono overflow-x-auto whitespace-pre-wrap">
              {ocrResult?.mrz?.raw}
            </pre>
          </div>
        )}

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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Guardando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
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

WizardStep3.propTypes = {
  documentType: PropTypes.string,
  capturedCanvas: PropTypes.oneOfType([CanvasPropType, PropTypes.object]),
  onConfirm: PropTypes.func,
  onRetry: PropTypes.func,
  onCancel: PropTypes.func,
  isSaving: PropTypes.bool,
};

function DataRow({ label, value }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-slate-600 text-sm">{label}</span>
      <span className="text-slate-900 font-semibold text-sm text-right truncate">
        {value || "—"}
      </span>
    </div>
  );
}

DataRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

function FormField({ label, value, onChange, placeholder, type = "text", error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
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
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-CR", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default WizardStep3;
// import React, { useState, useCallback } from "react";
// import PropTypes from "prop-types";
// import { OCRExtractor } from "../../components/documents/OCRExtractor";
// import { getDocumentTypeInfo } from "../../utils/constants";

// function toDateTimeISO(value) {
//   if (!value) return null;

//   // input type="date" => YYYY-MM-DD
//   if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
//     return `${value}T00:00:00.000Z`;
//   }

//   const d = new Date(value);
//   if (Number.isNaN(d.getTime())) return null;
//   return d.toISOString();
// }

// function isBlank(v) {
//   return v == null || String(v).trim() === "";
// }

// function cleanInput(obj) {
//   const out = {};
//   for (const [k, v] of Object.entries(obj)) {
//     if (v === "" || v === null || v === undefined) continue;
//     out[k] = v;
//   }
//   return out;
// }

// /**
//  * WizardStep3 - Extracción OCR y confirmación de datos (LIGHT UI)
//  */

// // ✅ Safe canvas prop type (no revienta en SSR)
// const CanvasPropType =
//   typeof HTMLCanvasElement !== "undefined"
//     ? PropTypes.instanceOf(HTMLCanvasElement)
//     : PropTypes.any;

// export function WizardStep3({
//   documentId,
//   documentType,
//   capturedCanvas,
//   cloudinaryResult,
//   onConfirm,
//   onRetry,
//   onCancel,
//   isSaving,
// }) {
//   const [phase, setPhase] = useState("extracting");
//   const [ocrResult, setOcrResult] = useState(null);
//   const [editedData, setEditedData] = useState({});
//   const [showAllFields, setShowAllFields] = useState(false);
//   const [fieldErrors, setFieldErrors] = useState({});

//   const docTypeInfo = getDocumentTypeInfo(documentType);

//   const handleOCRComplete = useCallback((result) => {
//     setOcrResult(result);
//     const extracted = result.extracted || {};
//     setEditedData({
//       fullName: extracted.fullName || "",
//       givenNames: extracted.givenNames || "",
//       surname: extracted.surname || "",
//       passportNumber: extracted.passportNumber || extracted.documentNumber || "",
//       nationality: extracted.nationality || "",
//       issuingCountry: extracted.issuingCountry || "",
//       dateOfBirth: extracted.dateOfBirth || "",
//       sex: extracted.sex || "",
//       issueDate: extracted.issueDate || "",
//       expirationDate: extracted.expirationDate || "",
//     });
//     setPhase("confirming");
//   }, []);

//   const handleOCRError = useCallback((error) => {
//     console.error("OCR Error:", error);
//     setPhase("confirming");
//     setEditedData({});
//   }, []);

//   const handleConfirm = useCallback(() => {
//     if (!onConfirm) return;

//     const nextErrors = {};

//     if (isBlank(editedData.givenNames)) nextErrors.givenNames = "Requerido";
//     if (isBlank(editedData.surname)) nextErrors.surname = "Requerido";
//     if (isBlank(editedData.passportNumber)) nextErrors.passportNumber = "Requerido";
//     if (isBlank(editedData.nationality)) nextErrors.nationality = "Requerido";
//     if (isBlank(editedData.issuingCountry)) nextErrors.issuingCountry = "Requerido";
//     if (isBlank(editedData.sex)) nextErrors.sex = "Requerido";

//     if (isBlank(editedData.dateOfBirth)) nextErrors.dateOfBirth = "Requerido";
//     if (isBlank(editedData.issueDate)) nextErrors.issueDate = "Requerido";
//     if (isBlank(editedData.expirationDate)) nextErrors.expirationDate = "Requerido";

//     // validar que las fechas se puedan convertir a DateTime ISO
//     const dobISO = toDateTimeISO(editedData.dateOfBirth);
//     const issueISO = toDateTimeISO(editedData.issueDate);
//     const expISO = toDateTimeISO(editedData.expirationDate);

//     if (!dobISO) nextErrors.dateOfBirth = "Fecha inválida";
//     if (!issueISO) nextErrors.issueDate = "Fecha inválida";
//     if (!expISO) nextErrors.expirationDate = "Fecha inválida";

//     // fullName obligatorio: podés exigirlo o derivarlo automáticamente
//     const computedFullName = !isBlank(editedData.fullName)
//       ? editedData.fullName.trim()
//       : `${editedData.givenNames} ${editedData.surname}`.trim();

//     if (isBlank(computedFullName)) nextErrors.fullName = "Requerido";

//     // Si hay errores, NO guardar
//     if (Object.keys(nextErrors).length > 0) {
//       setFieldErrors(nextErrors);
//       return;
//     }

//     setFieldErrors({});

//     const payload = {
//       fullName: computedFullName,
//       givenNames: editedData.givenNames.trim(),
//       surname: editedData.surname.trim(),
//       passportNumber: editedData.passportNumber.trim(),
//       nationality: editedData.nationality.trim(),
//       issuingCountry: editedData.issuingCountry.trim(),

//       // enum válido siempre (MALE/FEMALE)
//       sex: editedData.sex,

//       // DateTime válido siempre
//       dateOfBirth: dobISO,
//       issueDate: issueISO,
//       expirationDate: expISO,

//       mrzRaw: ocrResult?.mrz?.raw || null,
//       ocrText: ocrResult?.text || null,
//       ocrConfidence: ocrResult?.confidence ?? null,
//     };

//     console.log("WizardStep3 payload >>>", payload);
//     onConfirm(payload);
//   }, [editedData, ocrResult, onConfirm]);

//   const updateField = useCallback((field, value) => {
//     setEditedData((prev) => ({ ...prev, [field]: value }));
//   }, []);

//   const missingFields = [];
//   if (!editedData.fullName && !editedData.givenNames && !editedData.surname)
//     missingFields.push("nombre");
//   if (!editedData.passportNumber) missingFields.push("número de documento");

//   const mrzDetected = !!ocrResult?.mrz;
//   const headerTone = mrzDetected
//     ? { bg: "bg-emerald-50", ring: "ring-emerald-200", icon: "text-emerald-700" }
//     : { bg: "bg-amber-50", ring: "ring-amber-200", icon: "text-amber-700" };

//   // ========= PHASE: extracting =========
//   if (phase === "extracting") {
//     return (
//       <div className="min-h-screen bg-slate-50 p-4 pb-10">
//         <div className="max-w-md mx-auto">
//           {/* Top bar */}
//           <div className="flex items-center justify-between mb-5">
//             <button
//               onClick={onCancel}
//               className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
//               aria-label="Cancelar"
//               title="Cancelar"
//             >
//               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M6 18L18 6M6 6l12 12"
//                 />
//               </svg>
//             </button>

//             <span className="text-sm text-slate-500">Paso 3 de 3</span>
//             <div className="w-10" />
//           </div>

//           {/* Card */}
//           <div className="rounded-3xl bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 overflow-hidden">
//             {/* Header */}
//             <div className="px-5 pt-5 pb-4 border-b border-slate-100">
//               <div className="flex items-center gap-3">
//                 <div className="w-11 h-11 rounded-2xl bg-primary-50 ring-1 ring-primary-100 flex items-center justify-center">
//                   <span className="text-xl">{docTypeInfo?.icon || "📄"}</span>
//                 </div>
//                 <div className="min-w-0">
//                   <p className="text-sm font-semibold text-slate-900">Extrayendo datos</p>
//                   <p className="text-xs text-slate-500 truncate">
//                     {docTypeInfo?.label || "Documento"} • OCR + MRZ
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Preview */}
//             {capturedCanvas && (
//               <div className="px-5 pt-5">
//                 <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-slate-100">
//                   <canvas
//                     ref={(el) => {
//                       if (el && capturedCanvas) {
//                         const ctx = el.getContext("2d");
//                         const maxW = el.parentElement?.clientWidth || 320;
//                         const scale = Math.min(maxW / capturedCanvas.width, 1);
//                         el.width = Math.round(capturedCanvas.width * scale);
//                         el.height = Math.round(capturedCanvas.height * scale);
//                         ctx.drawImage(capturedCanvas, 0, 0, el.width, el.height);
//                       }
//                     }}
//                     className="w-full block"
//                   />
//                 </div>
//               </div>
//             )}

//             {/* OCR box */}
//             <div className="px-5 py-5">
//               <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-3">
//                 <OCRExtractor
//                   imageCanvas={capturedCanvas}
//                   documentType={documentType}
//                   onComplete={handleOCRComplete}
//                   onError={handleOCRError}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // ========= PHASE: confirming =========
//   return (
//     <div className="min-h-screen bg-slate-50 p-4 pb-10">
//       <div className="max-w-md mx-auto">
//         {/* Top bar */}
//         <div className="flex items-center justify-between mb-5">
//           <button
//             onClick={onCancel}
//             className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
//             aria-label="Cancelar"
//             title="Cancelar"
//           >
//             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M6 18L18 6M6 6l12 12"
//               />
//             </svg>
//           </button>

//           <span className="text-sm text-slate-500">Paso 3 de 3</span>
//           <div className="w-10" />
//         </div>

//         {/* Header card */}
//         <div className="rounded-3xl bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 overflow-hidden mb-4">
//           <div className="px-5 py-5">
//             <div className="text-center">
//               <div
//                 className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${headerTone.bg} ring-1 ${headerTone.ring} flex items-center justify-center`}
//               >
//                 {mrzDetected ? (
//                   <svg
//                     className={`w-8 h-8 ${headerTone.icon}`}
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//                     />
//                   </svg>
//                 ) : (
//                   <svg
//                     className={`w-8 h-8 ${headerTone.icon}`}
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
//                     />
//                   </svg>
//                 )}
//               </div>

//               <h2 className="text-xl font-semibold text-slate-900 mb-2">
//                 {mrzDetected ? "Datos detectados" : "Verificar datos"}
//               </h2>

//               <p className="text-slate-600 text-sm">
//                 {mrzDetected
//                   ? `MRZ detectado • Confianza: ${Math.round(ocrResult?.confidence || 0)}%`
//                   : "Completa o verifica los datos antes de guardar"}
//               </p>
//             </div>

//             {/* Small preview */}
//             {capturedCanvas && (
//               <div className="mt-5 rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-slate-100 h-32">
//                 <canvas
//                   ref={(el) => {
//                     if (el && capturedCanvas) {
//                       const ctx = el.getContext("2d");
//                       el.width = Math.max(1, el.clientWidth * 2);
//                       el.height = Math.max(1, el.clientHeight * 2);
//                       ctx.drawImage(capturedCanvas, 0, 0, el.width, el.height);
//                     }
//                   }}
//                   className="w-full h-full object-cover block"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* MRZ quick summary */}
//         {mrzDetected && !showAllFields && (
//           <div className="rounded-3xl bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 p-5 mb-4">
//             <div className="space-y-3">
//               <DataRow
//                 label="Nombre"
//                 value={
//                   editedData.fullName || `${editedData.givenNames} ${editedData.surname}`.trim()
//                 }
//               />
//               <DataRow label="Documento" value={editedData.passportNumber} />
//               <DataRow label="Nacionalidad" value={editedData.nationality} />
//               <DataRow label="Nacimiento" value={formatDate(editedData.dateOfBirth)} />
//               <DataRow label="Expiración" value={formatDate(editedData.expirationDate)} />
//             </div>

//             <button
//               onClick={() => setShowAllFields(true)}
//               className="
//                 mt-4 w-full py-2.5 rounded-2xl
//                 text-sm font-semibold
//                 bg-slate-900 text-white hover:bg-slate-800
//                 transition-colors
//                 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
//               "
//             >
//               Editar datos
//             </button>
//           </div>
//         )}

//         {/* Edit form */}
//         {(!mrzDetected || showAllFields) && (
//           <div className="rounded-3xl bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 p-5 mb-4 space-y-4">
//             {missingFields.length > 0 && !showAllFields && (
//               <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
//                 <p className="text-amber-900 text-sm">
//                   Por favor completa:{" "}
//                   <span className="font-semibold">{missingFields.join(", ")}</span>
//                 </p>
//               </div>
//             )}

//             <FormField
//               label="Nombres"
//               value={editedData.givenNames}
//               onChange={(v) => updateField("givenNames", v)}
//               placeholder="Ej: Josué David"
//             />

//             <FormField
//               label="Apellidos"
//               value={editedData.surname}
//               onChange={(v) => updateField("surname", v)}
//               placeholder="Ej: Chinchilla Salazar"
//             />

//             <FormField
//               label="Número de documento"
//               value={editedData.passportNumber}
//               onChange={(v) => updateField("passportNumber", v)}
//               placeholder="Ej: AB1234567"
//             />

//             <div className="grid grid-cols-2 gap-3">
//               <FormField
//                 label="Nacionalidad"
//                 value={editedData.nationality}
//                 onChange={(v) => updateField("nationality", v)}
//                 placeholder="Costarricense"
//               />
//               <FormField
//                 label="País emisor"
//                 value={editedData.issuingCountry}
//                 onChange={(v) => updateField("issuingCountry", v)}
//                 placeholder="Costa Rica"
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               <FormField
//                 label="Fecha de nacimiento"
//                 value={editedData.dateOfBirth}
//                 onChange={(v) => updateField("dateOfBirth", v)}
//                 type="date"
//               />

//               <FormField
//                 label="Fecha de emisión"
//                 value={editedData.issueDate}
//                 onChange={(v) => updateField("issueDate", v)}
//                 type="date"
//                 error={fieldErrors.issueDate}
//               />

//               <FormField
//                 label="Expiración"
//                 value={editedData.expirationDate}
//                 onChange={(v) => updateField("expirationDate", v)}
//                 type="date"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sexo</label>
//               <select
//                 value={editedData.sex}
//                 onChange={(e) => updateField("sex", e.target.value)}
//                 className="
//                   w-full px-3 py-2.5 rounded-2xl
//                   bg-white border border-slate-300 text-slate-900 text-sm
//                   focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400
//                   transition-colors
//                 "
//               >
//                 <option value="">Seleccionar</option>
//                 <option value="M">Masculino</option>
//                 <option value="F">Femenino</option>
//               </select>
//             </div>
//           </div>
//         )}

//         {/* MRZ raw */}
//         {mrzDetected && (
//           <div className="rounded-3xl bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 p-5 mb-6">
//             <div className="flex items-center gap-2 mb-2">
//               <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 text-xs font-semibold">
//                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//                   />
//                 </svg>
//                 MRZ detectado
//               </span>
//             </div>
//             <pre className="text-xs text-slate-700 bg-slate-50 ring-1 ring-slate-200 rounded-2xl p-3 font-mono overflow-x-auto whitespace-pre-wrap">
//               {ocrResult?.mrz?.raw}
//             </pre>
//           </div>
//         )}

//         {/* Actions */}
//         <div className="space-y-3">
//           <button
//             onClick={handleConfirm}
//             disabled={isSaving}
//             className={`
//               w-full py-4 rounded-2xl font-semibold
//               transition-all duration-200
//               shadow-md
//               focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2
//               ${
//                 isSaving
//                   ? "bg-slate-200 text-slate-500 cursor-wait"
//                   : "bg-primary-600 hover:bg-primary-500 text-white shadow-primary-200/60"
//               }
//             `}
//           >
//             {isSaving ? (
//               <span className="flex items-center justify-center gap-2">
//                 <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                   />
//                 </svg>
//                 Guardando...
//               </span>
//             ) : (
//               <span className="flex items-center justify-center gap-2">
//                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M5 13l4 4L19 7"
//                   />
//                 </svg>
//                 Confirmar y guardar
//               </span>
//             )}
//           </button>

//           <button
//             onClick={onRetry}
//             disabled={isSaving}
//             className="
//               w-full py-3.5 rounded-2xl font-semibold
//               bg-white text-slate-900
//               ring-1 ring-slate-200 hover:ring-slate-300 hover:bg-slate-50
//               transition-colors
//               focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2
//               disabled:opacity-60 disabled:cursor-not-allowed
//             "
//           >
//             Escanear de nuevo
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// WizardStep3.propTypes = {
//   documentId: PropTypes.string,
//   documentType: PropTypes.string,
//   capturedCanvas: PropTypes.oneOfType([
//     CanvasPropType,
//     PropTypes.shape({
//       width: PropTypes.number,
//       height: PropTypes.number,
//       getContext: PropTypes.func,
//     }),
//   ]),
//   cloudinaryResult: PropTypes.object,
//   onConfirm: PropTypes.func,
//   onRetry: PropTypes.func,
//   onCancel: PropTypes.func,
//   isSaving: PropTypes.bool,
// };

// WizardStep3.defaultProps = {
//   documentId: null,
//   documentType: "",
//   capturedCanvas: null,
//   cloudinaryResult: null,
//   onConfirm: null,
//   onRetry: null,
//   onCancel: null,
//   isSaving: false,
// };

// function DataRow({ label, value }) {
//   return (
//     <div className="flex justify-between items-center gap-4">
//       <span className="text-slate-600 text-sm">{label}</span>
//       <span className="text-slate-900 font-semibold text-sm text-right truncate">
//         {value || "—"}
//       </span>
//     </div>
//   );
// }

// DataRow.propTypes = {
//   label: PropTypes.string.isRequired,
//   value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
// };

// DataRow.defaultProps = {
//   value: "",
// };

// function FormField({ label, value, onChange, placeholder, type = "text" }) {
//   return (
//     <div>
//       <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
//       <input
//         type={type}
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         placeholder={placeholder}
//         className="
//           w-full px-3 py-2.5 rounded-2xl
//           bg-white border border-slate-300
//           text-slate-900 text-sm placeholder-slate-400
//           focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400
//           transition-colors
//         "
//       />
//     </div>
//   );
// }

// FormField.propTypes = {
//   label: PropTypes.string.isRequired,
//   value: PropTypes.string,
//   onChange: PropTypes.func.isRequired,
//   placeholder: PropTypes.string,
//   type: PropTypes.string,
// };

// FormField.defaultProps = {
//   value: "",
//   placeholder: "",
//   type: "text",
// };

// function formatDate(dateStr) {
//   if (!dateStr) return null;
//   try {
//     const date = new Date(dateStr);
//     return date.toLocaleDateString("es-CR", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });
//   } catch {
//     return dateStr;
//   }
// }

// export default WizardStep3;
