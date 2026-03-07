/* eslint-disable react/prop-types */
/**
 * DocumentEditModal — editar campos de documentos de un participante.
 * Edita: passportNumber, passportExpiry, hasVisa, visaExpiry, hasExitPermit, notes.
 * Persiste via updateTourParticipant mutation.
 */
import { useState, useEffect } from "react";
import { getAgeAtDate } from "../utils/tourAgeRules";

function toDateInput(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toISOString().slice(0, 10);
}

function participantFullName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

export default function DocumentEditModal({ participant, refDate, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    passportNumber: "",
    passportExpiry: "",
    hasVisa: false,
    visaExpiry: "",
    hasExitPermit: false,
    notes: "",
  });

  useEffect(() => {
    if (!participant) return;
    setForm({
      passportNumber: participant.passportNumber || "",
      passportExpiry: toDateInput(participant.passportExpiry),
      hasVisa: participant.hasVisa || false,
      visaExpiry: toDateInput(participant.visaExpiry),
      hasExitPermit: participant.hasExitPermit || false,
      notes: participant.notes || "",
    });
  }, [participant]);

  if (!participant) return null;

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const isAdult = (() => {
    if (!refDate || !participant.birthDate) return null;
    const age = getAgeAtDate(participant.birthDate, refDate);
    return age !== null ? age >= 18 : null;
  })();

  const ageAtTour = refDate && participant.birthDate
    ? getAgeAtDate(participant.birthDate, refDate)
    : null;

  const handleSubmit = () => {
    const input = {
      passportNumber: form.passportNumber.trim() || null,
      passportExpiry: form.passportExpiry ? new Date(form.passportExpiry).toISOString() : null,
      hasVisa: form.hasVisa,
      visaExpiry: form.hasVisa && form.visaExpiry
        ? new Date(form.visaExpiry).toISOString()
        : null,
      hasExitPermit: form.hasExitPermit,
      notes: form.notes.trim() || null,
    };
    onSave(participant.id, input);
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Editar documentos</h3>
            <p className="text-xs text-gray-500 mt-0.5 font-semibold">
              {participantFullName(participant)}
            </p>
            {ageAtTour !== null && refDate && (
              <p className="text-xs text-gray-400 mt-0.5">
                {ageAtTour} años al inicio de la gira ·{" "}
                <span className={isAdult ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                  {isAdult ? "Adulto" : "Menor de edad"}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Passport */}
          <fieldset className="border border-gray-100 rounded-2xl p-4 space-y-3">
            <legend className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1">
              Pasaporte
            </legend>
            <Field
              label="Número de pasaporte"
              placeholder="Ej: A1234567"
              value={form.passportNumber}
              onChange={(v) => set("passportNumber", v)}
            />
            <Field
              label="Fecha de vencimiento"
              type="date"
              value={form.passportExpiry}
              onChange={(v) => set("passportExpiry", v)}
            />
          </fieldset>

          {/* Visa */}
          <fieldset className="border border-gray-100 rounded-2xl p-4 space-y-3">
            <legend className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1">
              Visa
            </legend>
            <Toggle
              label="Tiene visa"
              checked={form.hasVisa}
              onChange={(v) => set("hasVisa", v)}
            />
            {form.hasVisa && (
              <Field
                label="Vencimiento de visa"
                type="date"
                value={form.visaExpiry}
                onChange={(v) => set("visaExpiry", v)}
              />
            )}
          </fieldset>

          {/* Permiso de salida */}
          <fieldset className="border border-gray-100 rounded-2xl p-4 space-y-2">
            <legend className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1">
              Permiso de salida de menores
            </legend>
            {isAdult === true ? (
              <div className="flex items-center gap-2 py-1">
                <span className="text-emerald-500 text-sm">✓</span>
                <p className="text-xs text-gray-500">
                  No requerido — participante es adulto al inicio de la gira.
                </p>
              </div>
            ) : (
              <>
                <Toggle
                  label="Tiene permiso de salida"
                  checked={form.hasExitPermit}
                  onChange={(v) => set("hasExitPermit", v)}
                />
                {isAdult === false && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Requerido — participante es menor de edad al inicio de la gira.
                  </p>
                )}
                {isAdult === null && (
                  <p className="text-xs text-gray-400">
                    Sin fecha de nacimiento registrada. Verificar si aplica.
                  </p>
                )}
              </>
            )}
          </fieldset>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Notas <span className="normal-case font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Observaciones documentales..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm disabled:opacity-50 transition-all"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
          checked ? "bg-gray-900" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
      <span className="text-sm text-gray-700 font-medium">{label}</span>
    </label>
  );
}
