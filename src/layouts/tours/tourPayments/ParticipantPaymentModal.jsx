/* eslint-disable react/prop-types */
/**
 * ParticipantPaymentModal — historial de pagos de un participante específico.
 */
import { useQuery } from "@apollo/client";
import { GET_TOUR_PAYMENTS_BY_PARTICIPANT } from "./tourPayments.gql";

const STATUS_CONFIG = {
  PENDING:  { label: "Pendiente",   className: "bg-amber-50 text-amber-700 border-amber-200" },
  PARTIAL:  { label: "Parcial",     className: "bg-blue-50 text-blue-700 border-blue-200" },
  PAID:     { label: "Pagado",      className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  WAIVED:   { label: "Exonerado",   className: "bg-gray-50 text-gray-500 border-gray-200" },
};

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtAmount(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);
}

function participantName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

export default function ParticipantPaymentModal({
  isOpen,
  participantEntry, // { participant, payments, totalCharged, totalPaid, totalPending, overallStatus }
  onClose,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
}) {
  if (!isOpen || !participantEntry) return null;

  const { participant, payments, totalCharged, totalPaid, totalPending, overallStatus } = participantEntry;
  const cfg = STATUS_CONFIG[overallStatus] || STATUS_CONFIG.PENDING;
  const paidPct = totalCharged > 0 ? Math.min(100, (totalPaid / totalCharged) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:w-[480px] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {participantName(participant)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{participant.identification}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.className}`}>
                {cfg.label}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Progreso de pago</span>
              <span className="font-semibold text-gray-700">{Math.round(paidPct)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${paidPct}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <MiniStat label="Cobrado" value={fmtAmount(totalCharged)} />
              <MiniStat label="Pagado" value={fmtAmount(totalPaid)} color="text-emerald-600" />
              <MiniStat label="Pendiente" value={fmtAmount(totalPending)} color={totalPending > 0 ? "text-amber-600" : "text-gray-400"} />
            </div>
          </div>
        </div>

        {/* Body — historial */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Historial ({payments.length})
            </h4>
            <button
              onClick={() => onAddPayment(participant)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar pago
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">💳</p>
              <p className="text-sm text-gray-500">Sin pagos registrados todavía.</p>
            </div>
          ) : (
            payments.map((payment) => {
              const pcfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.PENDING;
              return (
                <div
                  key={payment.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-100 rounded-2xl"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{payment.concept}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${pcfg.className}`}>
                        {pcfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <p className="text-sm font-bold text-gray-800">{fmtAmount(payment.amount)}</p>
                      {payment.paidAt && (
                        <p className="text-xs text-gray-400">Pagado: {fmt(payment.paidAt)}</p>
                      )}
                      {payment.registeredBy && (
                        <p className="text-xs text-gray-400">
                          Por {payment.registeredBy.name}
                        </p>
                      )}
                    </div>
                    {payment.notes && (
                      <p className="text-xs text-gray-400 mt-1 italic">{payment.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onEditPayment(payment)}
                      className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeletePayment(payment)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color = "text-gray-900" }) {
  return (
    <div className="text-center">
      <p className={`text-sm font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
