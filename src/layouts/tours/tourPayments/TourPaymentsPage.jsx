/* eslint-disable react/prop-types */
/**
 * TourPaymentsPage — sistema financiero completo por participante.
 * Vistas: Tabla financiera | Cuentas | Resumen | Configuración
 */
import { useState } from "react";
import {
  useTourPayments,
  FINANCIAL_STATUS_CONFIG,
  fmtAmount,
  fmtDate,
  fmtMonthYear,
} from "./useTourPayments";
import RegisterPaymentModal from "./RegisterPaymentModal";
import {
  ParticipantDetailDrawer,
  PaymentPlanModal,
  AccountAdjustModal,
  SetupFinanceModal,
} from "./ParticipantDetailDrawer";
import DeletePaymentModal from "./ParticipantDetailDrawer";
import { Toast } from "../TourHelpers";

// ─── Status filter tabs ───────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "LATE", label: "Atrasados" },
  { value: "PARTIAL", label: "Parciales" },
  { value: "PENDING", label: "Sin pago" },
  { value: "UP_TO_DATE", label: "Al día" },
  { value: "PAID", label: "Pagados" },
];

// ─── View tabs ────────────────────────────────────────────────────────────────
const VIEWS = [
  { id: "table", label: "Tabla financiera", icon: "⬛" },
  { id: "summary", label: "Resumen", icon: "📊" },
  { id: "setup", label: "Configuración", icon: "⚙️" },
];

export default function TourPaymentsPage({ tourId, tourName }) {
  const state = useTourPayments(tourId);

  const {
    financialTable,
    tableRows,
    summary,
    plans,
    defaultPlan,
    paymentFlow,
    activeView,
    setActiveView,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    toast,
     openDetailDrawer,  
  openAccountModal,
    setToast,
    registerModal,
    setRegisterModal,
    deletePayModal,
    setDeletePayModal,
    deleteParticipantModal,
    setDeleteParticipantModal,
    accountModal,
    setAccountModal,
    planModal,
    setPlanModal,
    setupModal,
    setSetupModal,
    detailDrawer,
    setDetailDrawer,
    handleRegisterPayment,
    handleDeletePayment,
    handleDeleteParticipant,
    handleUpdateAccount,
    handleCreatePlan,
    handleUpdatePlan,
    handleDeletePlan,
    handleSetupAll,
    loading,
    tableLoading,
    tableError,
    registering,
    deletingPay,
    deletingParticipant,
    updatingAccount,
    creatingPlan,
    updatingPlan,
    creatingAccounts,
    assigningPlan,
  } = state;

  const hasData = (financialTable?.rows?.length ?? 0) > 0;
  const hasPlans = plans.length > 0;

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">Control financiero</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Deudas y pagos de <span className="font-semibold">{tourName}</span>
          </p>
        </div>
        <button
          onClick={() => setRegisterModal({ open: true, participant: null })}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-2xl active:scale-[0.98] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Registrar pago
        </button>
      </div>

      {/* ── Sin configuración warning ─────────────────────────────────────── */}
      {!loading && !hasData && !hasPlans && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">Módulo financiero sin configurar</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Primero creá el plan de pagos y las cuentas financieras de los participantes.
            </p>
          </div>
          <button
            onClick={() => {
              setActiveView("setup");
              setSetupModal({ open: true });
            }}
            className="flex-shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all"
          >
            Configurar ahora
          </button>
        </div>
      )}

      {/* ── Summary cards (siempre visibles) ─────────────────────────────── */}
      {summary && <SummaryCards summary={summary} />}

      {/* ── View tabs ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              activeView === v.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{v.icon}</span>
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>

      {/* ── View Content ─────────────────────────────────────────────────── */}
      {activeView === "table" && (
        <FinancialTableView
          financialTable={financialTable}
          tableRows={tableRows}
          loading={tableLoading}
          error={tableError}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onRegisterPayment={(row) =>
            setRegisterModal({
              open: true,
              participant: { id: row.participantId, fullName: row.fullName },
            })
          }
        onOpenDetail={openDetailDrawer}
onAdjustAccount={openAccountModal}
          onDeleteParticipant={(row) =>
            setDeleteParticipantModal({ open: true, participant: row })
          }
        />
      )}

      {activeView === "summary" && <SummaryView summary={summary} paymentFlow={paymentFlow} />}

      {activeView === "setup" && (
        <SetupView
          tourId={tourId}
          plans={plans}
          onCreatePlan={() => setPlanModal({ open: true, plan: null, mode: "create" })}
          onEditPlan={(plan) => setPlanModal({ open: true, plan, mode: "edit" })}
          onDeletePlan={handleDeletePlan}
          onSetupAll={() => setSetupModal({ open: true })}
          hasData={hasData}
          deletingPlan={updatingPlan}
        />
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <RegisterPaymentModal
        isOpen={registerModal.open}
        tourId={tourId}
        prefillParticipant={registerModal.participant}
        onClose={() => setRegisterModal({ open: false, participant: null })}
        onSubmit={handleRegisterPayment}
        loading={registering}
      />

      <DeletePaymentModal
        payment={deletePayModal.payment}
        onConfirm={handleDeletePayment}
        onCancel={() => setDeletePayModal({ open: false, payment: null })}
        loading={deletingPay}
      />

      <DeleteParticipantModal
        participant={deleteParticipantModal.participant}
        onConfirm={handleDeleteParticipant}
        onCancel={() => setDeleteParticipantModal({ open: false, participant: null })}
        loading={deletingParticipant}
      />

      <AccountAdjustModal
        isOpen={accountModal.open}
        participantId={accountModal.participantId}
        row={accountModal.row}
        tourId={tourId}
        onClose={() => setAccountModal({ open: false, account: null })}
        onSubmit={handleUpdateAccount}
        loading={updatingAccount}
      />

      <PaymentPlanModal
        isOpen={planModal.open}
        mode={planModal.mode}
        plan={planModal.plan}
        onClose={() => setPlanModal({ open: false, plan: null, mode: "create" })}
        onSubmit={
          planModal.mode === "create"
            ? handleCreatePlan
            : (input) => handleUpdatePlan(planModal.plan.id, input)
        }
        loading={creatingPlan || updatingPlan}
      />

      <SetupFinanceModal
        isOpen={setupModal.open}
        tourId={tourId}
        plans={plans}
        onClose={() => setSetupModal({ open: false })}
        onSubmit={handleSetupAll}
        loading={creatingAccounts || assigningPlan}
      />

      <ParticipantDetailDrawer
        isOpen={detailDrawer.open}
        participantId={detailDrawer.participantId}
        tourId={detailDrawer.tourId}
        participant={detailDrawer.participant}
        onClose={() => setDetailDrawer({ open: false, participantId: null, tourId: null })}
        onRegisterPayment={(p) => {
          setDetailDrawer({ open: false });
          setRegisterModal({ open: true, participant: p });
        }}
        onDeletePayment={(payment) => {
          setDetailDrawer({ open: false });
          setDeletePayModal({ open: true, payment });
        }}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY CARDS
// ═══════════════════════════════════════════════════════════════════════════════

function SummaryCards({ summary }) {
  const pct =
    summary.totalAssigned > 0
      ? Math.min(100, (summary.totalCollected / summary.totalAssigned) * 100)
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total asignado" value={fmtAmount(summary.totalAssigned)} />
        <StatCard
          label="Total cobrado"
          value={fmtAmount(summary.totalCollected)}
          color="text-emerald-600"
        />
        <StatCard
          label="Por cobrar"
          value={fmtAmount(summary.totalBalance)}
          color={summary.totalBalance > 0 ? "text-amber-600" : "text-gray-400"}
        />
        <StatCard label="Participantes" value={summary.totalParticipants} small />
      </div>

      {summary.totalAssigned > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progreso de cobro</span>
            <span className="font-semibold">{Math.round(pct)}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* By status mini-chips */}
      <div className="flex flex-wrap gap-2 pt-1">
        {Object.entries(summary.byStatus).map(([status, count]) => {
          if (!count) return null;
          const cfg = FINANCIAL_STATUS_CONFIG[status];
          if (!cfg) return null;
          return (
            <span
              key={status}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {count} {cfg.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "text-gray-900", small = false }) {
  return (
    <div>
      <p className={`${small ? "text-xl" : "text-xl"} font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCIAL TABLE VIEW — tabla tipo Excel
// ═══════════════════════════════════════════════════════════════════════════════

function FinancialTableView({
  financialTable,
  tableRows,
  loading,
  error,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onRegisterPayment,
  onOpenDetail,
  onAdjustAccount,
  onDeleteParticipant,
}) {
  if (loading) return <TableSkeleton />;
  if (error) return <ErrorState message={error.message} />;
  if (!financialTable) return <EmptyTableState />;

  const columns = financialTable.columns || [];

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <input
            type="text"
            placeholder="Buscar participante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                statusFilter === f.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table — scroll horizontal */}
      {tableRows.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">
          Sin resultados para ese filtro.
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-500 sticky left-0 bg-gray-50 min-w-[180px]">
                  Participante
                </th>
                <th className="text-right px-3 py-3 font-semibold text-gray-500 whitespace-nowrap">
                  Total
                </th>
                <th className="text-right px-3 py-3 font-semibold text-gray-500 whitespace-nowrap">
                  Pagado
                </th>
                <th className="text-right px-3 py-3 font-semibold text-gray-500 whitespace-nowrap">
                  Debe
                </th>
                {columns.map((col) => (
                  <th
                    key={col.order}
                    className="text-center px-3 py-3 font-semibold text-gray-500 whitespace-nowrap min-w-[90px]"
                  >
                    {fmtMonthYear(col.dueDate)}
                  </th>
                ))}
                <th className="text-center px-3 py-3 font-semibold text-gray-500 whitespace-nowrap">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableRows.map((row) => {
                const cfg =
                  FINANCIAL_STATUS_CONFIG[row.financialStatus] || FINANCIAL_STATUS_CONFIG.PENDING;

                return (
                  <tr
                    key={row.participantId}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onOpenDetail(row)}
                  >
                    {/* Nombre */}
                    <td className="px-4 py-3 sticky left-0 bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                          {row.fullName
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate max-w-[130px]">
                            {row.fullName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                            <span className="text-gray-400 truncate">
                              {row.instrument} • {cfg.label}
                            </span>{" "}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Totales */}
                    <td className="px-3 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                      {fmtAmount(row.finalAmount)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-600 whitespace-nowrap">
                      {fmtAmount(row.totalPaid)}
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-bold whitespace-nowrap ${
                        row.balance > 0
                          ? "text-amber-600"
                          : row.balance < 0
                          ? "text-violet-600"
                          : "text-gray-400"
                      }`}
                    >
                      {row.balance < 0
                        ? `+${fmtAmount(Math.abs(row.balance))}`
                        : fmtAmount(row.balance)}
                    </td>

                    {/* Cuotas */}
                    {columns.map((col) => {
                      const cell = row.installments?.find((i) => i.order === col.order);
                      if (!cell) {
                        return (
                          <td key={col.order} className="px-3 py-3 text-center text-gray-300">
                            —
                          </td>
                        );
                      }
                      return (
                        <td key={col.order} className="px-3 py-3 text-center">
                          <InstallmentCell cell={cell} />
                        </td>
                      );
                    })}

                    {/* Acciones */}
                    <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onRegisterPayment(row)}
                          title="Registrar pago"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
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
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => onAdjustAccount(row)}
                          title="Ajustar cuenta"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
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
                              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteParticipant(row)}
                          title="Eliminar participante"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Footer totales */}
            {tableRows.length > 1 && (
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                  <td className="px-4 py-3 text-xs text-gray-500 sticky left-0 bg-gray-50">
                    {tableRows.length} participantes
                  </td>
                  <td className="px-3 py-3 text-right text-xs text-gray-700">
                    {fmtAmount(tableRows.reduce((s, r) => s + r.finalAmount, 0))}
                  </td>
                  <td className="px-3 py-3 text-right text-xs text-emerald-600">
                    {fmtAmount(tableRows.reduce((s, r) => s + r.totalPaid, 0))}
                  </td>
                  <td className="px-3 py-3 text-right text-xs text-amber-600">
                    {fmtAmount(tableRows.reduce((s, r) => s + Math.max(0, r.balance), 0))}
                  </td>
                  {columns.map((col) => (
                    <td key={col.order} className="px-3 py-3 text-center text-xs text-gray-400">
                      {fmtAmount(
                        tableRows.reduce((s, r) => {
                          const cell = r.installments?.find((i) => i.order === col.order);
                          return s + (cell?.paidAmount ?? 0);
                        }, 0)
                      )}
                    </td>
                  ))}
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

function InstallmentCell({ cell }) {
  const cfg = {
    PENDING: "text-gray-400",
    PARTIAL: "text-amber-600 font-bold",
    PAID: "text-emerald-600 font-bold",
    LATE: "text-red-600 font-bold",
    WAIVED: "text-gray-300",
  };
  const colorClass = cfg[cell.status] || "text-gray-400";

  if (cell.status === "WAIVED") return <span className="text-gray-300 text-xs">exon.</span>;

  return (
    <span className={`text-xs ${colorClass} whitespace-nowrap`}>
      {fmtAmount(cell.paidAmount)}
      <span className="text-gray-300 font-normal">/{fmtAmount(cell.amount)}</span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function SummaryView({ summary, paymentFlow }) {
  if (!summary)
    return <div className="text-center py-10 text-sm text-gray-400">Cargando resumen…</div>;

  const maxCumulative = paymentFlow.length > 0 ? paymentFlow[paymentFlow.length - 1].cumulative : 0;

  return (
    <div className="space-y-4">
      {/* Estado financiero por categoría */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Estado por participante
        </h3>
        <div className="space-y-2.5">
          {Object.entries(summary.byStatus).map(([status, count]) => {
            const cfg = FINANCIAL_STATUS_CONFIG[status];
            if (!cfg) return null;

            const pct =
              summary.totalParticipants > 0 ? (count / summary.totalParticipants) * 100 : 0;
            return (
              <div key={status} className="flex items-center gap-3">
                <div className="w-24 flex-shrink-0 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <span className="text-xs text-gray-600 font-medium">{cfg.label}</span>
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-xs font-bold text-gray-700">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flujo de pagos */}
      {paymentFlow.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Flujo de pagos
          </h3>
          <div className="space-y-2">
            {paymentFlow.map((entry) => (
              <div key={entry.date} className="flex items-center gap-3">
                <span className="w-20 text-xs text-gray-500 flex-shrink-0">
                  {fmtDate(entry.date)}
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${maxCumulative > 0 ? (entry.cumulative / maxCumulative) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-24 text-right text-xs font-bold text-gray-700">
                  {fmtAmount(entry.totalAmount)}
                </span>
                <span className="w-10 text-right text-xs text-gray-400">{entry.count}p</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs">
            <span className="text-gray-500">Total cobrado</span>
            <span className="font-bold text-emerald-600">{fmtAmount(maxCumulative)}</span>
          </div>
        </div>
      )}

      {/* Proyección pendiente */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">Total asignado</p>
          <p className="text-xl font-bold text-gray-900">{fmtAmount(summary.totalAssigned)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">Por cobrar</p>
          <p
            className={`text-xl font-bold ${
              summary.totalBalance > 0 ? "text-amber-600" : "text-gray-400"
            }`}
          >
            {fmtAmount(summary.totalBalance)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function SetupView({ plans, onCreatePlan, onEditPlan, onDeletePlan, onSetupAll, hasData }) {
  return (
    <div className="space-y-4">
      {/* Planes de pago */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Planes de pago</h3>
            <p className="text-xs text-gray-500 mt-0.5">Cronograma de cuotas de la gira</p>
          </div>
          <button
            onClick={onCreatePlan}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-all"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Crear plan
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm text-gray-500">Sin planes creados todavía.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onEdit={onEditPlan} onDelete={onDeletePlan} />
            ))}
          </div>
        )}
      </div>

      {/* Configuración masiva */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Configuración masiva</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Creá las cuentas financieras para todos los participantes importados y asigná el plan
              de pagos de una sola vez.
            </p>
          </div>
          <button
            onClick={onSetupAll}
            disabled={plans.length === 0}
            className="flex-shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-bold rounded-2xl transition-all"
          >
            Inicializar
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          {plan.isDefault && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Por defecto
            </span>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{plan.name}</p>
            <p className="text-xs text-gray-500">
              {plan.installments.length} cuotas · {fmtAmount(plan.totalAmount)} {plan.currency}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(plan)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.829 1.172H7v-2a4 4 0 011.172-2.829z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(plan.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
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
          <svg
            className={`w-4 h-4 text-gray-300 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-3 space-y-1.5">
            {[...plan.installments]
              .sort((a, b) => a.order - b.order)
              .map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                      {inst.order}
                    </span>
                    <span className="text-gray-700">{inst.concept}</span>
                    <span className="text-gray-400">· {fmtDate(inst.dueDate)}</span>
                  </div>
                  <span className="font-bold text-gray-900">{fmtAmount(inst.amount)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATES
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE PARTICIPANT MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function DeleteParticipantModal({ participant, onConfirm, onCancel, loading }) {
  if (!participant) return null;
  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Eliminar participante</h3>
          <p className="text-xs text-slate-500 mt-0.5">Esta acción no se puede deshacer</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
            <p className="text-sm font-bold text-gray-900">{participant.fullName}</p>
            <p className="text-xs text-gray-500">{participant.identification}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1">
            <p className="font-bold">Se eliminarán también:</p>
            <p>• Asignaciones de vuelos e itinerarios</p>
            <p>• Asignaciones de habitaciones</p>
            <p>• Historial de pagos y cuotas</p>
            <p>• Cuenta financiera</p>
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
              {loading ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-10 bg-gray-100 rounded-xl" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
      <p className="text-2xl mb-2">⚠️</p>
      <p className="text-sm font-bold text-red-700">Error al cargar datos financieros</p>
      <p className="text-xs text-red-500 mt-1">{message}</p>
    </div>
  );
}

function EmptyTableState() {
  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
      <p className="text-4xl mb-3">📊</p>
      <h3 className="text-sm font-bold text-gray-900 mb-1">Sin datos financieros</h3>
      <p className="text-xs text-gray-500">Iniciá la configuración del módulo financiero.</p>
    </div>
  );
}
