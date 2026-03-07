/* eslint-disable react/prop-types */
/**
 * RegisterPaymentModal — registra un pago real que se distribuirá
 * automáticamente entre las cuotas pendientes del participante.
 */
import { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { fmtAmount, participantName } from "./useTourPayments";

const GET_PARTICIPANTS_LIGHT = gql`
  query GetParticipantsForPayment($tourId: ID!) {
    getTourParticipants(tourId: $tourId) {
      id
      firstName
      firstSurname
      secondSurname
      identification
    }
  }
`;

const METHODS = [
  { value: "CASH", label: "Efectivo" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "CARD", label: "Tarjeta" },
  { value: "CHECK", label: "Cheque" },
  { value: "OTHER", label: "Otro" },
];

const EMPTY = {
  participantId: "",
  amount: "",
  paymentDate: new Date().toISOString().slice(0, 10),
  method: "TRANSFER",
  reference: "",
  notes: "",
};

export default function RegisterPaymentModal({
  isOpen,
  tourId,
  prefillParticipant,
  onClose,
  onSubmit,
  loading,
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const { data } = useQuery(GET_PARTICIPANTS_LIGHT, {
    variables: { tourId },
    skip: !isOpen || !tourId || !!prefillParticipant,
    fetchPolicy: "cache-and-network",
  });

  const participants = data?.getTourParticipants || [];

  useEffect(() => {
    if (!isOpen) return;

    setForm({
      ...EMPTY,
      paymentDate: new Date().toISOString().slice(0, 10),
      participantId: prefillParticipant?.participantId || prefillParticipant?.id || "",
    });

    setErrors({});
  }, [isOpen, prefillParticipant]);

  if (!isOpen) return null;

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.participantId) e.participantId = "Seleccioná un participante";
    if (!form.amount || isNaN(Number(form.amount))) e.amount = "Monto inválido";
    if (Number(form.amount) <= 0) e.amount = "El monto debe ser mayor a 0";
    return e;
  };

  const handleSubmit = () => {
    console.log("SUBMIT START", form);

    const e = validate();

    console.log("VALIDATION RESULT", e);

    if (Object.keys(e).length > 0) {
      console.log("VALIDATION FAILED");
      return setErrors(e);
    }

    const payload = {
      tourId,
      participantId: form.participantId,
      amount: Number(form.amount),
      paymentDate: form.paymentDate ? new Date(form.paymentDate).toISOString() : undefined,
      method: form.method,
      reference: form.reference.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    console.log("SENDING PAYMENT", payload);

    onSubmit(payload);
  };

  const displayName = prefillParticipant
    ? prefillParticipant.fullName || participantName(prefillParticipant)
    : null;

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">Registrar pago</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {displayName
                ? `Para ${displayName}`
                : "El sistema distribuirá el monto automáticamente"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            💡 El pago se distribuirá automáticamente entre las cuotas pendientes, de la más antigua
            a la más reciente.
          </div>

          {/* Participante */}
          {!prefillParticipant && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Participante
              </label>
              <select
                value={form.participantId}
                onChange={(e) => set("participantId", e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white ${
                  errors.participantId ? "border-red-400" : "border-gray-200"
                }`}
              >
                <option value="">Seleccioná un participante…</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {participantName(p)} · {p.identification}
                  </option>
                ))}
              </select>
              {errors.participantId && (
                <p className="text-xs text-red-500 mt-1">{errors.participantId}</p>
              )}
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Monto (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="0.00"
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                errors.amount ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          {/* Fecha + Método */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Fecha de pago
              </label>
              <input
                type="date"
                value={form.paymentDate}
                onChange={(e) => set("paymentDate", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Método
              </label>
              <select
                value={form.method}
                onChange={(e) => set("method", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Referencia */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Referencia{" "}
              <span className="normal-case font-normal text-gray-400">
                (Nº transferencia, cheque…)
              </span>
            </label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => set("reference", e.target.value)}
              placeholder="Ej: TRF-00123"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Notas <span className="normal-case font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Observaciones…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm disabled:opacity-50 transition-all"
          >
            {loading ? "Registrando…" : "Registrar pago"}
          </button>
        </div>
      </div>
    </div>
  );
}
