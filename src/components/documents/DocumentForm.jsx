import React, { useState, useEffect } from "react";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import PropTypes from "prop-types";

export function DocumentForm({
  documentType,
  initialData = {},
  onSubmit,
  submitLabel = "Guardar",
}) {
  const [formData, setFormData] = useState({
    fullName: "",
    givenNames: "",
    surname: "",
    nationality: "",
    issuingCountry: "",
    documentNumber: "",
    passportNumber: "",
    visaType: "",
    dateOfBirth: "",
    sex: "",
    issueDate: "",
    expirationDate: "",
    mrzRaw: "",
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});

  useEffect(() => {
    // Validar expiración
    if (formData.expirationDate) {
      const expDate = new Date(formData.expirationDate);
      const today = new Date();
      const daysUntil = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

      if (expDate < today) {
        setWarnings((prev) => ({
          ...prev,
          expirationDate: "Este documento está expirado",
        }));
      } else if (daysUntil <= 90) {
        setWarnings((prev) => ({
          ...prev,
          expirationDate: `Este documento expira en ${daysUntil} días`,
        }));
      } else {
        setWarnings((prev) => {
          const { expirationDate, ...rest } = prev;
          return rest;
        });
      }
    }
  }, [formData.expirationDate]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (documentType === "PASSPORT") {
      if (!formData.passportNumber && !formData.documentNumber) {
        newErrors.passportNumber = "Número de pasaporte es requerido";
      }
      if (!formData.fullName && !formData.surname) {
        newErrors.fullName = "Nombre completo o apellido es requerido";
      }
    }

    if (documentType === "VISA") {
      if (!formData.visaType) {
        newErrors.visaType = "Tipo de visa es requerido";
      }
    }

    // Validar fechas
    if (formData.issueDate && formData.expirationDate) {
      if (new Date(formData.issueDate) > new Date(formData.expirationDate)) {
        newErrors.expirationDate =
          "La fecha de expiración debe ser posterior a la fecha de emisión";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Limpiar campos vacíos
    const cleanedData = {};
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== "" && formData[key] !== null) {
        cleanedData[key] = formData[key];
      }
    });

    onSubmit(cleanedData);
  };

  const commonFields = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre Completo"
          value={formData.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          error={errors.fullName}
          placeholder="Ej: Juan José Pérez González"
        />

        <Input
          label="Apellido(s)"
          value={formData.surname}
          onChange={(e) => handleChange("surname", e.target.value)}
          placeholder="Ej: Pérez González"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre(s) de Pila"
          value={formData.givenNames}
          onChange={(e) => handleChange("givenNames", e.target.value)}
          placeholder="Ej: Juan José"
        />

        <Input
          label="Nacionalidad"
          value={formData.nationality}
          onChange={(e) => handleChange("nationality", e.target.value)}
          placeholder="Ej: CRC, USA, ESP"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="País Emisor"
          value={formData.issuingCountry}
          onChange={(e) => handleChange("issuingCountry", e.target.value)}
          placeholder="Ej: Costa Rica"
        />

        <Select
          label="Sexo"
          value={formData.sex}
          onChange={(e) => handleChange("sex", e.target.value)}
          options={[
            { label: "Masculino", value: "M" },
            { label: "Femenino", value: "F" },
            { label: "Otro", value: "X" },
          ]}
          placeholder="Seleccionar"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Fecha de Nacimiento"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => handleChange("dateOfBirth", e.target.value)}
        />

        <Input
          label="Fecha de Emisión"
          type="date"
          value={formData.issueDate}
          onChange={(e) => handleChange("issueDate", e.target.value)}
        />

        <Input
          label="Fecha de Expiración"
          type="date"
          value={formData.expirationDate}
          onChange={(e) => handleChange("expirationDate", e.target.value)}
          error={errors.expirationDate}
          required
        />
      </div>

      {warnings.expirationDate && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800 flex items-center gap-2">
            <span>⚠️</span>
            {warnings.expirationDate}
          </p>
        </div>
      )}
    </>
  );

  const passportFields = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Número de Pasaporte"
          value={formData.passportNumber}
          onChange={(e) => handleChange("passportNumber", e.target.value)}
          error={errors.passportNumber}
          placeholder="Ej: AB1234567"
          required
        />

        <Input
          label="Número de Documento"
          value={formData.documentNumber}
          onChange={(e) => handleChange("documentNumber", e.target.value)}
          placeholder="Opcional si tiene número de pasaporte"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          MRZ (Zona de Lectura Mecánica)
        </label>
        <textarea
          value={formData.mrzRaw}
          onChange={(e) => handleChange("mrzRaw", e.target.value)}
          rows={3}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-xs"
          placeholder="P<CRCPEREZ<<JUAN<JOSE<<<<<<<<<<<<<<<<<<&#10;AB12345671CRC8001011M3001012<<<<<<<<<<<<<<<0"
        />
        <p className="mt-1 text-sm text-gray-500">
          Opcional: Copia las 2 líneas del MRZ tal como aparecen en el pasaporte
        </p>
      </div>
    </>
  );

  const visaFields = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Tipo de Visa"
          value={formData.visaType}
          onChange={(e) => handleChange("visaType", e.target.value)}
          error={errors.visaType}
          placeholder="Ej: B1/B2, Tourist, Student"
          required
        />

        <Input
          label="Número de Pasaporte Asociado"
          value={formData.passportNumber}
          onChange={(e) => handleChange("passportNumber", e.target.value)}
          placeholder="Ej: AB1234567"
        />
      </div>

      <div>
        <Input
          label="Número de Documento"
          value={formData.documentNumber}
          onChange={(e) => handleChange("documentNumber", e.target.value)}
          placeholder="Número de la visa"
        />
      </div>
    </>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {commonFields}

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {documentType === "PASSPORT" ? "Datos del Pasaporte" : "Datos de la Visa"}
        </h3>
        {documentType === "PASSPORT" ? passportFields : visaFields}
      </div>

      <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
        <Button type="submit" variant="primary" size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
DocumentForm.propTypes = {
  documentType: PropTypes.oneOf(["PASSPORT", "VISA"]).isRequired,
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string,
};
