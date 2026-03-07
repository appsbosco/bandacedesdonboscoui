/* eslint-disable react/prop-types */

/**
 * TourFormModal — modal para crear o editar una gira.
 */ import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import { useState, useEffect } from "react";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Borrador" },
  { value: "ACTIVE", label: "Activa" },
  { value: "CLOSED", label: "Cerrada" },
  { value: "CANCELLED", label: "Cancelada" },
];

const EMPTY_FORM = {
  name: "",
  destination: "",
  country: "",
  startDate: "",
  endDate: "",
  status: "DRAFT",
  description: "",
};

function toInputDate(dateVal) {
  if (!dateVal) return "";
  const d = new Date(Number(dateVal) || dateVal);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export default function TourFormModal({ isOpen, mode, tour, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && tour) {
        setForm({
          name: tour.name || "",
          destination: tour.destination || "",
          country: tour.country || "",
          startDate: toInputDate(tour.startDate),
          endDate: toInputDate(tour.endDate),
          status: tour.status || "DRAFT",
          description: tour.description || "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [isOpen, mode, tour]);

  // Bloquear scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Nombre requerido";
    if (!form.destination.trim()) errs.destination = "Destino requerido";
    if (!form.country.trim()) errs.country = "País requerido";
    if (!form.startDate) errs.startDate = "Fecha de inicio requerida";
    if (!form.endDate) errs.endDate = "Fecha de fin requerida";
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errs.endDate = "Debe ser posterior a la fecha de inicio";
    }
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({
      name: form.name.trim(),
      destination: form.destination.trim(),
      country: form.country.trim(),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      status: form.status,
      description: form.description.trim() || undefined,
    });
  };

  const inputClass = (field) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-gray-50 transition-all ${
      errors[field]
        ? "border-red-300 focus:ring-red-100"
        : "border-gray-200 focus:ring-blue-100 focus:border-blue-300"
    }`;

  const labelClass = "text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5";

  return (
    <DashboardLayout>
      <div
        className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
        style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
        onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
      >
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {mode === "create" ? "Nueva gira" : "Editar gira"}
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-30"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {/* Nombre */}
            <div>
              <label className={labelClass}>Nombre de la gira</label>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="Ej: Gira Europa 2025"
                className={inputClass("name")}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Destino + País */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Destino</label>
                <input
                  type="text"
                  value={form.destination}
                  onChange={set("destination")}
                  placeholder="Ej: Roma"
                  className={inputClass("destination")}
                />
                {errors.destination && (
                  <p className="text-xs text-red-500 mt-1">{errors.destination}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>País</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={set("country")}
                  placeholder="Ej: Italia"
                  className={inputClass("country")}
                />
                {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Fecha inicio</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={set("startDate")}
                  className={inputClass("startDate")}
                />
                {errors.startDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Fecha fin</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={set("endDate")}
                  className={inputClass("endDate")}
                />
                {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className={labelClass}>Estado</label>
              <select value={form.status} onChange={set("status")} className={inputClass("status")}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className={labelClass}>Descripción (opcional)</label>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={3}
                placeholder="Detalles adicionales sobre la gira…"
                className={`${inputClass("description")} resize-none`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2 flex gap-3 flex-shrink-0 border-t border-gray-100">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 disabled:opacity-40 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm disabled:opacity-40 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
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
                  {mode === "create" ? "Creando…" : "Guardando…"}
                </>
              ) : mode === "create" ? (
                "Crear gira"
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
