/* eslint-disable react/prop-types */

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

// ─── Field components ─────────────────────────────────────────────────────────

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

// ─── Condition picker ─────────────────────────────────────────────────────────

const CONDITIONS = [
  {
    value: "Institucional",
    label: "Institucional",
    desc: "Pertenece a la banda",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    value: "Propio",
    label: "Propio",
    desc: "Pertenece al integrante",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

const ConditionPicker = ({ value, onChange }) => (
  <div>
    <FieldLabel required>Condición del instrumento</FieldLabel>
    <div className="grid grid-cols-2 gap-2">
      {CONDITIONS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150 active:scale-95
            ${
              value === c.value
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
        >
          <span className={value === c.value ? "text-white" : "text-slate-400"}>{c.icon}</span>
          <div>
            <p className="text-xs font-semibold leading-tight">{c.label}</p>
            <p
              className={`text-[10px] mt-0.5 ${
                value === c.value ? "text-slate-300" : "text-slate-400"
              }`}
            >
              {c.desc}
            </p>
          </div>
        </button>
      ))}
    </div>
  </div>
);

// ─── Main modal ───────────────────────────────────────────────────────────────

const InventoryModal = ({ open, onClose, onSubmit, initialValues }) => {
  const iv = initialValues || {};
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    brand: iv.brand || "",
    model: iv.model || "",
    numberId: iv.numberId || "",
    serie: iv.serie || "",
    condition: iv.condition || "",
    mainteinance: iv.mainteinance || "",
    details: iv.details || "",
    ownership: iv.ownership || "",
  });

  useEffect(() => {
    if (open) setErrors({});
  }, [open]);

  const set = (field) => (e) => {
    const val = typeof e === "string" ? e : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.brand.trim()) errs.brand = "Requerido";
    if (!form.model.trim()) errs.model = "Requerido";
    if (!form.condition) errs.condition = "Seleccioná una condición";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        brand: form.brand,
        model: form.model,
        numberId: form.numberId,
        serie: form.serie,
        condition: form.condition,
        mainteinance: form.mainteinance,
        details: form.details,
      });
    } catch (e) {
      console.error("Error saving inventory:", e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const isEditing = !!iv.brand;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-md bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[88vh] overflow-hidden"
        style={{ borderRadius: "20px 20px 0 0" }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 leading-tight">
                {isEditing ? "Editar instrumento" : "Añadir instrumento"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Información de inventario</p>
            </div>
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Marca y modelo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <TextInput
                label="Marca"
                required
                placeholder="Ej. Yamaha, Jupiter…"
                value={form.brand}
                onChange={set("brand")}
              />
              {errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand}</p>}
            </div>
            <div>
              <TextInput
                label="Modelo"
                required
                placeholder="Ej. YAS-280"
                value={form.model}
                onChange={set("model")}
              />
              {errors.model && <p className="text-xs text-red-500 mt-1">{errors.model}</p>}
            </div>
          </div>

          {/* Números de identificación */}
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="N° de placa"
              placeholder="Ej. BCDB-001"
              value={form.numberId}
              onChange={set("numberId")}
            />
            <TextInput
              label="N° de serie"
              placeholder="Ej. J02345678"
              value={form.serie}
              onChange={set("serie")}
            />
          </div>

          {/* Separador */}
          <div className="w-full h-px bg-slate-100" />

          {/* Condición */}
          <div>
            <ConditionPicker
              value={form.condition}
              onChange={(v) => {
                setForm((p) => ({ ...p, condition: v }));
                setErrors((p) => ({ ...p, condition: undefined }));
              }}
            />
            {errors.condition && <p className="text-xs text-red-500 mt-2">{errors.condition}</p>}
          </div>

          {/* Separador */}
          <div className="w-full h-px bg-slate-100" />

          {/* Mantenimiento */}
          <TextInput
            label="Último mantenimiento"
            hint="Fecha o descripción del último servicio realizado"
            placeholder="Ej. Enero 2025 — limpieza general"
            value={form.mainteinance}
            onChange={set("mainteinance")}
          />

          {/* Detalles adicionales */}
          <TextAreaInput
            label="Detalles adicionales"
            hint="Observaciones, daños visibles, accesorios incluidos, etc."
            placeholder="Ej. Incluye estuche original, falta un tornillo en la llave de agua…"
            rows={3}
            value={form.details}
            onChange={set("details")}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-white flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors duration-150 active:scale-95"
          >
            Cancelar
          </button>
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
                {isEditing ? "Guardar cambios" : "Añadir instrumento"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

InventoryModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialValues: PropTypes.shape({
    brand: PropTypes.string,
    model: PropTypes.string,
    numberId: PropTypes.string,
    serie: PropTypes.string,
    condition: PropTypes.string,
    mainteinance: PropTypes.string,
    details: PropTypes.string,
  }),
};

InventoryModal.defaultProps = {
  initialValues: null,
};

export default InventoryModal;
