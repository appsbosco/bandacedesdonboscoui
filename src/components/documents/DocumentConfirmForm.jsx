import React, { useState } from "react";

import PropTypes from "prop-types";

export default function DocumentConfirmForm({
  documentId,
  documentType,
  initialData,
  imageUrl,
  onConfirm,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    passportNumber: initialData?.passportNumber || "",
    documentNumber: initialData?.documentNumber || "",
    visaType: initialData?.visaType || "",
    surname: initialData?.surname || "",
    givenNames: initialData?.givenNames || "",
    fullName: initialData?.fullName || "",
    nationality: initialData?.nationality || "",
    issuingCountry: initialData?.issuingCountry || "",
    dateOfBirth: initialData?.dateOfBirth ? formatDateForInput(initialData.dateOfBirth) : "",
    sex: initialData?.sex || "",
    expirationDate: initialData?.expirationDate
      ? formatDateForInput(initialData.expirationDate)
      : "",
    issueDate: initialData?.issueDate ? formatDateForInput(initialData.issueDate) : "",
    mrzRaw: initialData?.mrzRaw || "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (documentType === "PASSPORT") {
      if (!formData.passportNumber) newErrors.passportNumber = "Número de pasaporte requerido";
      if (!formData.surname) newErrors.surname = "Apellido requerido";
      if (!formData.givenNames) newErrors.givenNames = "Nombres requeridos";
      if (!formData.expirationDate) newErrors.expirationDate = "Fecha de expiración requerida";
    } else {
      // VISA
      if (!formData.documentNumber && !formData.visaType) {
        newErrors.documentNumber = "Número de documento o tipo de visa requerido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Build submission data
    const submitData = {
      ...formData,
      dateOfBirth: formData.dateOfBirth || null,
      expirationDate: formData.expirationDate || null,
      issueDate: formData.issueDate || null,
      mrzValid: initialData?.mrzValid || null,
      ocrConfidence: initialData?.ocrConfidence || null,
    };

    onConfirm(submitData);
  };

  // Check expiration warnings
  const expirationWarning = formData.expirationDate
    ? getExpirationWarning(formData.expirationDate)
    : null;

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 pb-32">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirma la información</h2>
          <p className="text-gray-600">
            Revisa y corrige los datos extraídos de tu{" "}
            {documentType === "PASSPORT" ? "pasaporte" : "visa"}
          </p>

          {/* Thumbnail */}
          {imageUrl && (
            <div className="mt-4">
              <img
                src={imageUrl}
                alt="Document"
                className="w-full max-w-xs rounded-lg shadow-md mx-auto"
              />
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Passport Fields */}
          {documentType === "PASSPORT" && (
            <>
              <FormInput
                label="Número de Pasaporte"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleChange}
                error={errors.passportNumber}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Apellido(s)"
                  name="surname"
                  value={formData.surname}
                  onChange={handleChange}
                  error={errors.surname}
                  required
                />
                <FormInput
                  label="Nombre(s)"
                  name="givenNames"
                  value={formData.givenNames}
                  onChange={handleChange}
                  error={errors.givenNames}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Nacionalidad"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                />
                <FormInput
                  label="País Emisor"
                  name="issuingCountry"
                  value={formData.issuingCountry}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Fecha de Nacimiento"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
                <FormSelect
                  label="Sexo"
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  options={[
                    { value: "", label: "Seleccionar" },
                    { value: "M", label: "Masculino" },
                    { value: "F", label: "Femenino" },
                    { value: "X", label: "No especificado" },
                  ]}
                />
              </div>
            </>
          )}

          {/* Visa Fields */}
          {documentType === "VISA" && (
            <>
              <FormInput
                label="Número de Documento"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleChange}
                error={errors.documentNumber}
              />
              <FormInput
                label="Tipo de Visa"
                name="visaType"
                value={formData.visaType}
                onChange={handleChange}
                placeholder="ej: Tourist, Work, Student"
              />
            </>
          )}

          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Fecha de Emisión"
              name="issueDate"
              type="date"
              value={formData.issueDate}
              onChange={handleChange}
            />
            <FormInput
              label="Fecha de Expiración"
              name="expirationDate"
              type="date"
              value={formData.expirationDate}
              onChange={handleChange}
              error={errors.expirationDate}
              required={documentType === "PASSPORT"}
            />
          </div>

          {/* Expiration Warning */}
          {expirationWarning && (
            <div
              className={`p-4 rounded-lg ${
                expirationWarning.type === "expired"
                  ? "bg-red-50 border border-red-200"
                  : expirationWarning.type === "soon"
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-blue-50 border border-blue-200"
              }`}
            >
              <div className="flex items-start">
                <svg
                  className={`w-5 h-5 mr-3 mt-0.5 ${
                    expirationWarning.type === "expired"
                      ? "text-red-600"
                      : expirationWarning.type === "soon"
                      ? "text-yellow-600"
                      : "text-blue-600"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-900">{expirationWarning.message}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg"
            >
              Confirmar y Guardar
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-4 px-6 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper Components
function FormInput({ label, error, required, ...props }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        {...props}
        className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
          error ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function FormSelect({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <select
        {...props}
        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Helper Functions
function formatDateForInput(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}

function getExpirationWarning(expirationDate) {
  if (!expirationDate) return null;

  const expDate = new Date(expirationDate);
  const today = new Date();
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      type: "expired",
      message: "⚠️ Este documento está vencido",
    };
  } else if (diffDays <= 30) {
    return {
      type: "soon",
      message: `⚠️ Este documento expira en ${diffDays} días`,
    };
  } else if (diffDays <= 90) {
    return {
      type: "warning",
      message: `ℹ️ Este documento expira en ${diffDays} días`,
    };
  }

  return null;
}

DocumentConfirmForm.propTypes = {
  documentId: PropTypes.string,
  documentType: PropTypes.oneOf(["PASSPORT", "VISA"]).isRequired,
  initialData: PropTypes.shape({
    passportNumber: PropTypes.string,
    documentNumber: PropTypes.string,
    visaType: PropTypes.string,
    surname: PropTypes.string,
    givenNames: PropTypes.string,
    fullName: PropTypes.string,
    nationality: PropTypes.string,
    issuingCountry: PropTypes.string,
    dateOfBirth: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    sex: PropTypes.string,
    expirationDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    issueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    mrzRaw: PropTypes.string,
    mrzValid: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf([null])]),
    ocrConfidence: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
  }),
  imageUrl: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

DocumentConfirmForm.defaultProps = {
  documentId: null,
  initialData: null,
  imageUrl: null,
};

FormInput.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
};

FormInput.defaultProps = {
  error: null,
  required: false,
};

FormSelect.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

FormSelect.defaultProps = {};
