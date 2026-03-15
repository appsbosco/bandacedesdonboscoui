/* eslint-disable react/prop-types */
/**
 * TourSelfServicePayments
 * Vista de solo lectura para que el usuario (integrante o padre) vea su estado de pagos.
 * Estilo consistente con ParticipantDetailDrawer.
 */
import { useState } from "react";
import {
  FINANCIAL_STATUS_CONFIG,
  INSTALLMENT_STATUS_CONFIG,
  fmtAmount,
  fmtDate,
} from "../tourPayments/useTourPayments";

// ─── MiniStat (igual que en ParticipantDetailDrawer) ─────────────────────────

function MiniStat({ label, value, color = "text-gray-800" }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}

// ─── Lista de cuotas ──────────────────────────────────────────────────────────

function InstallmentsList({ installments, currency }) {
  if (!installments?.length) {
    return (
      <div className="text-center py-10">
        <p className="text-2xl mb-2">📋</p>
        <p className="text-sm text-gray-500">Sin cuotas asignadas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[...installments]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((inst, idx) => {
          const cfg =
            INSTALLMENT_STATUS_CONFIG[inst.status] || INSTALLMENT_STATUS_CONFIG.PENDING;
          const paid = inst.paidAmount ?? 0;
          const total = inst.amount ?? 0;
          const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

          return (
            <div key={inst.id ?? idx} className="border border-gray-100 rounded-2xl p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {inst.order ?? idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{inst.concept}</p>
                    <p className="text-xs text-gray-400">Vence: {fmtDate(inst.dueDate)}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.className}`}>
                  {cfg.label}
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-600 font-semibold">
                    {fmtAmount(paid, currency)}
                  </span>
                  <span className="text-gray-400">de {fmtAmount(total, currency)}</span>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TourSelfServicePayments({ paymentAccount }) {
  const [tab, setTab] = useState("installments");

  if (!paymentAccount) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
        <p className="text-2xl mb-2">💳</p>
        <p className="text-sm font-semibold text-gray-700">Sin cuenta financiera</p>
        <p className="text-xs text-gray-500 mt-1">
          Aún no se ha configurado una cuenta de pagos para tu participación en esta gira.
          Contacta al administrador.
        </p>
      </div>
    );
  }

  const {
    currency = "CRC",
    finalAmount = 0,
    totalPaid = 0,
    balance = 0,
    financialStatus,
    paymentPlan,
  } = paymentAccount;

  const cfg = FINANCIAL_STATUS_CONFIG[financialStatus] || FINANCIAL_STATUS_CONFIG.PENDING;
  const pct = finalAmount > 0 ? Math.min(100, (totalPaid / finalAmount) * 100) : 0;
  const installments = paymentPlan?.installments ?? [];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header: estado + progreso + mini stats */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Resumen financiero</h3>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-1.5 mb-3">
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
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Total" value={fmtAmount(finalAmount, currency)} />
          <MiniStat
            label="Pagado"
            value={fmtAmount(totalPaid, currency)}
            color="text-emerald-600"
          />
          <MiniStat
            label={balance < 0 ? "Excedente" : "Debe"}
            value={fmtAmount(Math.abs(balance), currency)}
            color={
              balance < 0
                ? "text-violet-600"
                : balance > 0
                ? "text-amber-600"
                : "text-gray-400"
            }
          />
        </div>

        {/* Tabs (solo si hay plan de pagos) */}
        {paymentPlan && (
          <div className="flex gap-1 mt-4 p-1 bg-gray-100 rounded-xl">
            {["installments"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                {`Cuotas (${installments.length})`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body: cuotas */}
      <div className="px-5 py-4">
        {paymentPlan ? (
          <>
            {paymentPlan.name && (
              <p className="text-xs text-gray-400 font-medium mb-3">
                Plan: <span className="text-gray-600 font-semibold">{paymentPlan.name}</span>
              </p>
            )}
            <InstallmentsList installments={installments} currency={currency} />
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm text-gray-500">Sin plan de pagos asignado.</p>
            <p className="text-xs text-gray-400 mt-1">Contacta al administrador.</p>
          </div>
        )}
      </div>
    </div>
  );
}
