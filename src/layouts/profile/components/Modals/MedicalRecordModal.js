/* eslint-disable react/prop-types */

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

// ─── Reusable field components ────────────────────────────────────────────────

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
    {children}
    {required && <span className="text-red-400 ml-0.5">*</span>}
  </label>
);

const TextInput = ({ label, required, hint, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <FieldLabel required={required}>{label}</FieldLabel>}
    {hint && <p className="text-xs text-slate-400 -mt-0.5 mb-1">{hint}</p>}
    <input
      {...props}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-300
        focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
        hover:border-slate-300 transition-all duration-150"
    />
  </div>
);

const SelectInput = ({ label, required, options, placeholder, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <FieldLabel required={required}>{label}</FieldLabel>}
    <select
      {...props}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900
        focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
        hover:border-slate-300 transition-all duration-150 appearance-none cursor-pointer"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        backgroundSize: "16px",
        paddingRight: "2.5rem",
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

const TextAreaInput = ({ label, required, hint, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <FieldLabel required={required}>{label}</FieldLabel>}
    {hint && <p className="text-xs text-slate-400 -mt-0.5 mb-1">{hint}</p>}
    <textarea
      {...props}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-300
        focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
        hover:border-slate-300 transition-all duration-150 resize-none"
    />
  </div>
);

// ─── Step indicator ───────────────────────────────────────────────────────────

const steps = [
  { id: 1, label: "Personal", icon: "👤" },
  { id: 2, label: "Salud", icon: "🩺" },
  { id: 3, label: "Emergencia", icon: "📞" },
];

const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-center gap-0 mb-6">
    {steps.map((step, i) => (
      <React.Fragment key={step.id}>
        <div className="flex flex-col items-center gap-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
              ${
                current === step.id
                  ? "bg-slate-900 text-white shadow-md scale-110"
                  : current > step.id
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
          >
            {current > step.id ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              step.id
            )}
          </div>
          <span
            className={`text-[10px] font-medium transition-colors duration-200
            ${
              current === step.id
                ? "text-slate-900"
                : current > step.id
                ? "text-emerald-600"
                : "text-slate-400"
            }`}
          >
            {step.label}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div
            className={`w-12 sm:w-20 h-0.5 mb-4 mx-1 transition-all duration-300
            ${current > step.id ? "bg-emerald-400" : "bg-slate-200"}`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((v) => ({
  value: v,
  label: v,
}));
const SEX_TYPES = [
  { value: "Masculino", label: "Masculino" },
  { value: "Femenino", label: "Femenino" },
];
const RELATIONSHIP_TYPES = [
  "Padre",
  "Madre",
  "Hijo/Hija",
  "Hermano/Hermana",
  "Abuelo/Abuela",
  "Nieto/Nieta",
  "Bisabuelo/Bisabuela",
  "Tío/Tía",
  "Sobrino/Sobrina",
  "Primo/Prima",
  "Esposo/Esposa",
  "Cuñado/Cuñada",
  "Suegro/Suegra",
  "Yerno/Nuera",
  "Hermanastro/Hermanastra",
  "Padrino/Madrina",
].map((v) => ({ value: v, label: v }));

// ─── Main component ───────────────────────────────────────────────────────────

const MedicalRecordModal = ({ open, onClose, onSubmit, initialValues }) => {
  const iv = initialValues || {};
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    identification: iv.identification || "",
    sex: iv.sex || "",
    bloodType: iv.bloodType || "",
    address: iv.address || "",
    illness: iv.illness || "",
    medicine: iv.medicine || "",
    medicineOnTour: iv.medicineOnTour || "",
    allergies: iv.allergies || "",
    familyMemberName: iv.familyMemberName || "",
    familyMemberNumber: iv.familyMemberNumber || "",
    familyMemberNumberId: iv.familyMemberNumberId || "",
    familyMemberRelationship: iv.familyMemberRelationship || "",
    familyMemberOccupation: iv.familyMemberOccupation || "",
  });

  // Reset step on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setErrors({});
    }
  }, [open]);

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep = () => {
    const errs = {};
    if (step === 1) {
      if (!form.identification.trim()) errs.identification = "Requerido";
      if (!form.sex) errs.sex = "Requerido";
      if (!form.bloodType) errs.bloodType = "Requerido";
      if (!form.address.trim()) errs.address = "Requerido";
    }
    if (step === 3) {
      if (!form.familyMemberName.trim()) errs.familyMemberName = "Requerido";
      if (!form.familyMemberNumber.trim()) errs.familyMemberNumber = "Requerido";
      if (!form.familyMemberRelationship) errs.familyMemberRelationship = "Requerido";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (e) {
      console.error("Error submitting medical record:", e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div
        className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden"
        style={{ borderRadius: "20px 20px 0 0" }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-4 sm:pt-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900 leading-tight">
              {initialValues?.identification ? "Editar ficha médica" : "Nueva ficha médica"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {step === 1 && "Datos personales básicos"}
              {step === 2 && "Condiciones de salud"}
              {step === 3 && "Contacto de emergencia"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 pt-5">
          <StepIndicator current={step} />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* ── Step 1: Personal ── */}
          {step === 1 && (
            <div className="space-y-4">
              <TextInput
                label="Número de cédula / identificación"
                required
                placeholder="Ej. 1-2345-6789"
                value={form.identification}
                onChange={set("identification")}
              />
              {errors.identification && (
                <p className="text-xs text-red-500 -mt-2">{errors.identification}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <SelectInput
                    label="Sexo"
                    required
                    value={form.sex}
                    onChange={set("sex")}
                    options={SEX_TYPES}
                    placeholder="Seleccionar"
                  />
                  {errors.sex && <p className="text-xs text-red-500 mt-1">{errors.sex}</p>}
                </div>
                <div>
                  <SelectInput
                    label="Tipo de sangre"
                    required
                    value={form.bloodType}
                    onChange={set("bloodType")}
                    options={BLOOD_TYPES}
                    placeholder="Seleccionar"
                  />
                  {errors.bloodType && (
                    <p className="text-xs text-red-500 mt-1">{errors.bloodType}</p>
                  )}
                </div>
              </div>

              <div>
                <TextAreaInput
                  label="Dirección exacta de residencia"
                  required
                  placeholder="Provincia, cantón, distrito, señas adicionales…"
                  rows={4}
                  value={form.address}
                  onChange={set("address")}
                />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
              </div>
            </div>
          )}

          {/* ── Step 2: Salud ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-2">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dejá en blanco los campos que no apliquen. Esta información es confidencial y solo
                  se usa en emergencias.
                </p>
              </div>

              <TextInput
                label="Enfermedades diagnosticadas"
                placeholder="Ej. Diabetes tipo 1, asma…"
                value={form.illness}
                onChange={set("illness")}
              />

              <TextInput
                label="Medicamentos que debe tomar"
                placeholder="Ej. Metformina 500mg, ventolín…"
                value={form.medicine}
                onChange={set("medicine")}
              />

              <TextInput
                label="Medicamentos en giras de la BCDB"
                hint="¿Necesita llevar algún medicamento durante las giras o actividades de la banda?"
                placeholder="Ej. Inhalador, pastillas…"
                value={form.medicineOnTour}
                onChange={set("medicineOnTour")}
              />

              <TextInput
                label="Alergias a alimentos y/o medicamentos"
                placeholder="Ej. Penicilina, mariscos, nueces…"
                value={form.allergies}
                onChange={set("allergies")}
              />
            </div>
          )}

          {/* ── Step 3: Emergencia ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-2 flex gap-2.5 items-start">
                <svg
                  className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Esta persona será contactada en caso de emergencia durante actividades de la
                  banda.
                </p>
              </div>

              <TextInput
                label="Nombre completo"
                required
                placeholder="Nombre y apellidos"
                value={form.familyMemberName}
                onChange={set("familyMemberName")}
              />
              {errors.familyMemberName && (
                <p className="text-xs text-red-500 -mt-2">{errors.familyMemberName}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <TextInput
                    label="Número de contacto"
                    required
                    placeholder="8888-8888"
                    type="tel"
                    value={form.familyMemberNumber}
                    onChange={set("familyMemberNumber")}
                  />
                  {errors.familyMemberNumber && (
                    <p className="text-xs text-red-500 mt-1">{errors.familyMemberNumber}</p>
                  )}
                </div>
                <TextInput
                  label="Cédula de identidad"
                  placeholder="1-2345-6789"
                  value={form.familyMemberNumberId}
                  onChange={set("familyMemberNumberId")}
                />
              </div>

              <div>
                <SelectInput
                  label="Parentesco"
                  required
                  value={form.familyMemberRelationship}
                  onChange={set("familyMemberRelationship")}
                  options={RELATIONSHIP_TYPES}
                  placeholder="Seleccionar parentesco"
                />
                {errors.familyMemberRelationship && (
                  <p className="text-xs text-red-500 mt-1">{errors.familyMemberRelationship}</p>
                )}
              </div>

              <TextInput
                label="Ocupación"
                placeholder="Ej. Docente, ingeniero…"
                value={form.familyMemberOccupation}
                onChange={set("familyMemberOccupation")}
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-slate-100 bg-white flex items-center gap-3">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors duration-150 active:scale-95"
            >
              Atrás
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors duration-150 active:scale-95"
            >
              Cancelar
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-700 transition-colors duration-150 active:scale-95 flex items-center justify-center gap-2"
            >
              Continuar
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 active:scale-95 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Guardando…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Guardar ficha
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

MedicalRecordModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialValues: PropTypes.shape({
    identification: PropTypes.string,
    sex: PropTypes.string,
    bloodType: PropTypes.string,
    address: PropTypes.string,
    familyMemberName: PropTypes.string,
    familyMemberNumber: PropTypes.string,
    familyMemberNumberId: PropTypes.string,
    familyMemberRelationship: PropTypes.string,
    familyMemberOccupation: PropTypes.string,
    illness: PropTypes.string,
    medicine: PropTypes.string,
    medicineOnTour: PropTypes.string,
    allergies: PropTypes.string,
  }),
};

MedicalRecordModal.defaultProps = {
  initialValues: null,
};

export default MedicalRecordModal;
