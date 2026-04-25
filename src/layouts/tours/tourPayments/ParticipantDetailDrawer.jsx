/* eslint-disable react/prop-types */
/**
 * Modals del módulo financiero:
 *  - ParticipantDetailDrawer  → historial de pagos + cuotas del participante
 *  - PaymentPlanModal         → crear/editar plan de cuotas
 *  - AccountAdjustModal       → ajustar monto/descuento/beca/ajuste de cuenta
 *  - SetupFinanceModal        → configuración masiva post-importación
 *  - DeletePaymentModal       → confirmar borrado de pago
 */
import { useState, useEffect } from "react";
import {
  useParticipantDetail,
  FINANCIAL_STATUS_CONFIG,
  INSTALLMENT_STATUS_CONFIG,
  METHOD_LABELS,
  fmtAmount,
  fmtDate,
  participantName,
} from "./useTourPayments";

// ═══════════════════════════════════════════════════════════════════════════════
// ParticipantDetailDrawer
// ═══════════════════════════════════════════════════════════════════════════════

export function ParticipantDetailDrawer({
  isOpen,
  participantId,
  tourId,
  participant,
  onClose,
  onRegisterPayment,
  onDeletePayment,
}) {
  const [tab, setTab] = useState("installments");
  const { payments, installments, loading } = useParticipantDetail(participantId, tourId);

  useEffect(() => {
    if (isOpen) setTab("installments");
  }, [isOpen]);
  if (!isOpen || !participant) return null;

  const cfg =
    FINANCIAL_STATUS_CONFIG[participant.financialStatus] || FINANCIAL_STATUS_CONFIG.PENDING;
  const pct =
    participant.finalAmount > 0
      ? Math.min(100, (participant.totalPaid / participant.finalAmount) * 100)
      : 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[1290] bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div
        className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
        style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Drawer */}
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          {" "}
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {participant.fullName}
                  </h3>
                  {participant.isRemoved && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-red-50 text-red-700 border-red-200">
                      Retirado de la gira
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{participant.identification}</p>
                {participant.linkedUserName && (
                  <p className="text-xs text-gray-400 mt-0.5">{participant.linkedUserName}</p>
                )}
                {participant.isRemoved && participant.removedAt && (
                  <p className="text-xs text-red-500 mt-1">
                    Retirado el {fmtDate(participant.removedAt)}
                    {participant.removedByName ? ` · por ${participant.removedByName}` : ""}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-all flex-shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            {/* Progress */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Progreso</span>
                <span className="font-bold text-gray-700">{Math.round(pct)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Total" value={fmtAmount(participant.finalAmount)} />
                <MiniStat
                  label="Pagado"
                  value={fmtAmount(participant.totalPaid)}
                  color="text-emerald-600"
                />
                <MiniStat
                  label={participant.balance < 0 ? "Excedente" : "Debe"}
                  value={fmtAmount(Math.abs(participant.balance))}
                  color={
                    participant.balance < 0
                      ? "text-violet-600"
                      : participant.balance > 0
                      ? "text-amber-600"
                      : "text-gray-400"
                  }
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 p-1 bg-gray-100 rounded-xl">
              {["installments", "payments"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                >
                  {t === "installments"
                    ? `Cuotas (${installments.length})`
                    : `Pagos (${payments.length})`}
                </button>
              ))}
            </div>
          </div>
          {/* Body */}
          <div className="overflow-y-auto flex-1 px-5 py-4">
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-xl" />
                ))}
              </div>
            ) : tab === "installments" ? (
              <InstallmentsList installments={installments} />
            ) : (
              <PaymentsList payments={payments} onDelete={onDeletePayment} />
            )}
          </div>
          {/* Footer */}
          <div className="px-5 pb-6 pt-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-all"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                onClose();
                onRegisterPayment(participant);
              }}
              disabled={participant.isRemoved}
              className="flex-1 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-all"
            >
              {participant.isRemoved ? "Participante retirado" : "+ Registrar pago"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function InstallmentsList({ installments }) {
  if (installments.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-2xl mb-2">📋</p>
        <p className="text-sm text-gray-500">Sin cuotas asignadas.</p>
        <p className="text-xs text-gray-400 mt-1">Asigná un plan de pago desde Configuración.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[...installments]
        .sort((a, b) => a.order - b.order)
        .map((inst) => {
          const cfg = INSTALLMENT_STATUS_CONFIG[inst.status] || INSTALLMENT_STATUS_CONFIG.PENDING;
          const pct = inst.amount > 0 ? Math.min(100, (inst.paidAmount / inst.amount) * 100) : 0;

          return (
            <div key={inst.id} className="border border-gray-100 rounded-2xl p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {inst.order}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{inst.concept}</p>
                    <p className="text-xs text-gray-400">Vence: {fmtDate(inst.dueDate)}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.className}`}
                >
                  {cfg.label}
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-600 font-semibold">
                    {fmtAmount(inst.paidAmount)}
                  </span>
                  <span className="text-gray-400">de {fmtAmount(inst.amount)}</span>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

function PaymentsList({ payments, onDelete }) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-2xl mb-2">💳</p>
        <p className="text-sm text-gray-500">Sin pagos registrados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[...payments]
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
        .map((pay) => (
          <div
            key={pay.id}
            className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-100 rounded-2xl"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-gray-900">{fmtAmount(pay.amount)}</p>
                <span className="text-xs text-gray-400 px-2 py-0.5 rounded-full border border-gray-200 bg-white">
                  {METHOD_LABELS[pay.method] || pay.method}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{fmtDate(pay.paymentDate)}</p>
              {pay.reference && (
                <p className="text-xs text-gray-400 mt-0.5">Ref: {pay.reference}</p>
              )}
              {pay.appliedTo?.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {pay.appliedTo.map((a, idx) => (
                    <p key={idx} className="text-xs text-gray-400">
                      → {fmtAmount(a.amountApplied)} aplicado a Cuota {a.installment?.order} (
                      {a.installment?.concept})
                    </p>
                  ))}
                  {pay.unappliedAmount > 0 && (
                    <p className="text-xs text-violet-500">
                      → {fmtAmount(pay.unappliedAmount)} excedente
                    </p>
                  )}
                </div>
              )}
              {pay.registeredBy && (
                <p className="text-xs text-gray-400 mt-1">Por {pay.registeredBy.name}</p>
              )}
            </div>
            <button
              onClick={() => onDelete(pay)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        ))}
    </div>
  );
}

function MiniStat({ label, value, color = "text-gray-900" }) {
  return (
    <div>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PaymentPlanModal — crear / editar plan
// ═══════════════════════════════════════════════════════════════════════════════

export function PaymentPlanModal({ isOpen, mode, plan, onClose, onSubmit, loading }) {
  const EMPTY_PLAN = { name: "Plan general", currency: "USD", isDefault: true, installments: [] };
  const [form, setForm] = useState(EMPTY_PLAN);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && plan) {
      setForm({
        name: plan.name,
        currency: plan.currency,
        isDefault: plan.isDefault,
        installments: plan.installments.map((i) => ({
          order: i.order,
          dueDate: i.dueDate?.slice(0, 10) || "",
          amount: String(i.amount),
          concept: i.concept,
        })),
      });
    } else {
      setForm(EMPTY_PLAN);
    }
  }, [isOpen, mode, plan]);

  if (!isOpen) return null;

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const addInstallment = () =>
    setForm((prev) => ({
      ...prev,
      installments: [
        ...prev.installments,
        {
          order: prev.installments.length + 1,
          dueDate: "",
          amount: "",
          concept: `Cuota ${prev.installments.length + 1}`,
        },
      ],
    }));

  const updateInstallment = (idx, field, value) =>
    setForm((prev) => ({
      ...prev,
      installments: prev.installments.map((inst, i) =>
        i === idx ? { ...inst, [field]: value } : inst
      ),
    }));

  const removeInstallment = (idx) =>
    setForm((prev) => ({
      ...prev,
      installments: prev.installments
        .filter((_, i) => i !== idx)
        .map((inst, i) => ({ ...inst, order: i + 1 })),
    }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (form.installments.length === 0) return;

    const installments = form.installments.map((inst, idx) => ({
      order: idx + 1,
      dueDate: new Date(inst.dueDate).toISOString(),
      amount: Number(inst.amount),
      concept: inst.concept,
    }));

    onSubmit({ name: form.name, currency: form.currency, isDefault: form.isDefault, installments });
  };

  const total = form.installments.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {" "}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {mode === "create" ? "Crear plan de pagos" : "Editar plan de pagos"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Definí el cronograma de cuotas</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-all"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
          {/* Nombre + moneda */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Nombre del plan
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Plan general"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Moneda
              </label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => set("currency", e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="USD"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          {/* Default toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => set("isDefault", !form.isDefault)}
              className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                form.isDefault ? "bg-gray-900" : "bg-gray-200"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  form.isDefault ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
            <span className="text-xs text-gray-600 font-medium">Plan por defecto de la gira</span>
          </label>

          {/* Cuotas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Cuotas{" "}
                {total > 0 && (
                  <span className="font-bold text-gray-700 ml-1">· Total: {fmtAmount(total)}</span>
                )}
              </label>
              <button
                onClick={addInstallment}
                className="text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                + Agregar cuota
              </button>
            </div>

            {form.installments.length === 0 ? (
              <div
                onClick={addInstallment}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-gray-300 transition-colors"
              >
                <p className="text-sm text-gray-400">Hacé clic para agregar la primera cuota</p>
              </div>
            ) : (
              <div className="space-y-2">
                {form.installments.map((inst, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="col-span-1 text-center">
                      <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mx-auto">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs text-gray-400 mb-1">Concepto</label>
                      <input
                        type="text"
                        value={inst.concept}
                        onChange={(e) => updateInstallment(idx, "concept", e.target.value)}
                        placeholder={`Cuota ${idx + 1}`}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs text-gray-400 mb-1">Fecha</label>
                      <input
                        type="date"
                        value={inst.dueDate}
                        onChange={(e) => updateInstallment(idx, "dueDate", e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs text-gray-400 mb-1">Monto</label>
                      <input
                        type="number"
                        value={inst.amount}
                        onChange={(e) => updateInstallment(idx, "amount", e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => removeInstallment(idx)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="px-5 pb-6 pt-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name.trim() || form.installments.length === 0}
            className="flex-1 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm disabled:opacity-50 transition-all"
          >
            {loading ? "Guardando…" : mode === "create" ? "Crear plan" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AccountAdjustModal — ajustar cuenta financiera de un participante
// ═══════════════════════════════════════════════════════════════════════════════

export function AccountAdjustModal({
  isOpen,
  participantId,
  row,
  tourId,
  plans = [],
  defaultPlan = null,
  onClose,
  onSubmit,
  loading,
}) {
  const [form, setForm] = useState({
    baseAmount: "",
    discount: "",
    scholarship: "",
    paymentPlanId: "",
    adjustmentConcept: "",
    adjustmentAmount: "",
  });
  const [mode, setMode] = useState("amounts"); // "amounts" | "adjustment"
  const hasFinancialAccount = Boolean(row?.hasFinancialAccount);

  useEffect(() => {
    if (!isOpen || !row) return;
    setForm({
      baseAmount: String(row.finalAmount || ""),
      discount: "0",
      scholarship: "0",
      paymentPlanId: defaultPlan?.id || "",
      adjustmentConcept: "",
      adjustmentAmount: "",
    });
    setMode("amounts");
  }, [defaultPlan?.id, isOpen, row]);

  if (!isOpen || !row) return null;

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (mode === "amounts") {
      onSubmit(row, {
        baseAmount: Number(form.baseAmount) || 0,
        discount: Number(form.discount) || 0,
        scholarship: Number(form.scholarship) || 0,
        paymentPlanId: form.paymentPlanId || undefined,
        currency: "USD",
      });
    } else {
      if (!form.adjustmentConcept.trim() || !form.adjustmentAmount) return;
      onSubmit(row, {
        adjustment: {
          concept: form.adjustmentConcept.trim(),
          amount: Number(form.adjustmentAmount),
        },
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {hasFinancialAccount ? "Ajustar cuenta" : "Crear cuenta financiera"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{row.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
          {/* Modo */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {["amounts", ...(hasFinancialAccount ? ["adjustment"] : [])].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                {m === "amounts" ? "Montos base" : "Ajuste puntual"}
              </button>
            ))}
          </div>

          {/* Resumen actual */}
          <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-400">Total actual</p>
              <p className="text-sm font-bold text-gray-900">{fmtAmount(row.finalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Pagado</p>
              <p className="text-sm font-bold text-emerald-600">{fmtAmount(row.totalPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Saldo</p>
              <p
                className={`text-sm font-bold ${
                  row.balance > 0 ? "text-amber-600" : "text-gray-400"
                }`}
              >
                {fmtAmount(row.balance)}
              </p>
            </div>
          </div>

          {mode === "amounts" ? (
            <>
              {!hasFinancialAccount && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                  Esta cuenta todavía no existe. Podés crearla aquí mismo para este participante.
                </div>
              )}
              <PlanField
                label="Monto base (USD)"
                value={form.baseAmount}
                onChange={(v) => set("baseAmount", v)}
              />
              <PlanField
                label="Descuento (USD)"
                value={form.discount}
                onChange={(v) => set("discount", v)}
                hint="Se resta del monto base"
              />
              <PlanField
                label="Beca (USD)"
                value={form.scholarship}
                onChange={(v) => set("scholarship", v)}
                hint="Se resta del monto base"
              />
              {plans.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Plan de pagos
                  </label>
                  <select
                    value={form.paymentPlanId}
                    onChange={(e) => set("paymentPlanId", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                  >
                    <option value="">Sin plan asignado</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} · {fmtAmount(plan.totalAmount)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
                <span className="font-semibold">Total final = </span>
                {fmtAmount(
                  (Number(form.baseAmount) || 0) -
                    (Number(form.discount) || 0) -
                    (Number(form.scholarship) || 0)
                )}
              </div>
            </>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                💡 Un ajuste positivo aumenta la deuda. Un ajuste negativo la reduce. Se acumula
                sobre los montos actuales.
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Concepto
                </label>
                <input
                  type="text"
                  value={form.adjustmentConcept}
                  onChange={(e) => set("adjustmentConcept", e.target.value)}
                  placeholder="Ej: Equipaje extra, Descuento especial…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <PlanField
                label="Monto del ajuste (positivo = cargo, negativo = crédito)"
                value={form.adjustmentAmount}
                onChange={(v) => set("adjustmentAmount", v)}
                placeholder="+50 o -30"
              />
            </>
          )}
        </div>

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
            {loading
              ? "Guardando…"
              : hasFinancialAccount
              ? "Aplicar cambio"
              : "Crear cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanField({ label, value, onChange, hint, placeholder = "0" }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SetupFinanceModal — configuración masiva
// ═══════════════════════════════════════════════════════════════════════════════

export function SetupFinanceModal({ isOpen, tourId, plans, onClose, onSubmit, loading }) {
  const [baseAmount, setBaseAmount] = useState("");
  const [planId, setPlanId] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const def = plans.find((p) => p.isDefault) || plans[0];
    if (def) {
      setPlanId(def.id);
      setBaseAmount(String(def.totalAmount));
    }
  }, [isOpen, plans]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!baseAmount || isNaN(Number(baseAmount)) || Number(baseAmount) <= 0) return;
    onSubmit(Number(baseAmount), planId || null);
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Configuración masiva</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inicializar el módulo financiero para todos los participantes
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
            <p className="font-bold">¿Qué hace esto?</p>
            <p>1. Crea cuentas financieras para todos los participantes activos sin cuenta.</p>
            <p>2. Asigna el plan de pagos seleccionado, generando las cuotas individuales.</p>
            <p>Participantes que ya tienen cuenta o cuotas no serán afectados.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Monto base (USD)
            </label>
            <input
              type="number"
              value={baseAmount}
              onChange={(e) => setBaseAmount(e.target.value)}
              placeholder="Ej: 1430"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {plans.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Plan de pagos
              </label>
              <select
                value={planId}
                onChange={(e) => {
                  setPlanId(e.target.value);
                  const plan = plans.find((p) => p.id === e.target.value);
                  if (plan) setBaseAmount(String(plan.totalAmount));
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">Sin plan (solo crear cuentas)</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {fmtAmount(p.totalAmount)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="px-5 pb-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !baseAmount}
            className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-50 transition-all"
          >
            {loading ? "Inicializando…" : "Inicializar módulo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DeletePaymentModal
// ═══════════════════════════════════════════════════════════════════════════════

export default function DeletePaymentModal({ payment, onConfirm, onCancel, loading }) {
  if (!payment) return null;
  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Eliminar pago</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Las cuotas afectadas se revertirán automáticamente
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
            <p className="text-sm font-bold text-gray-900">{fmtAmount(payment.amount)}</p>
            <p className="text-xs text-gray-500">
              {fmtDate(payment.paymentDate)} · {METHOD_LABELS[payment.method] || payment.method}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            ⚠️ Esta acción revertirá los pagos de cuotas asociados y actualizará el estado
            financiero del participante.
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-50 transition-all"
            >
              {loading ? "Eliminando…" : "Eliminar pago"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
