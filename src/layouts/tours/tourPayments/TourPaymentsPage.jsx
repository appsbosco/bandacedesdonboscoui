/* eslint-disable react/prop-types */
/**
 * TourPaymentsPage — sistema financiero completo por participante.
 * Vistas: Tabla financiera | Cuentas | Resumen | Configuración
 */
import { memo, useCallback, useEffect, useMemo, useState } from "react";
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

const EMPTY_REGISTER_MODAL = { open: false, participant: null };
const EMPTY_DELETE_PAYMENT_MODAL = { open: false, payment: null };
const EMPTY_DELETE_PARTICIPANT_MODAL = { open: false, participant: null };
const EMPTY_CREATE_PARTICIPANT_MODAL = { open: false };
const EMPTY_ACCOUNT_MODAL = { open: false, participantId: null, row: null };
const EMPTY_PLAN_MODAL = { open: false, plan: null, mode: "create" };
const EMPTY_SETUP_MODAL = { open: false };
const EMPTY_DETAIL_DRAWER = {
  open: false,
  participantId: null,
  tourId: null,
  participant: null,
};
const INSTALLMENT_TEXT_CLASS = {
  PENDING: "text-gray-400",
  PARTIAL: "text-amber-600 font-bold",
  PAID: "text-emerald-600 font-bold",
  LATE: "text-red-600 font-bold",
  WAIVED: "text-gray-300",
};

function getParticipantInitials(fullName = "") {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((name) => name[0] ?? "")
    .join("")
    .toUpperCase();
}

function getBalanceClassName(balance) {
  if (balance > 0) return "text-amber-600";
  if (balance < 0) return "text-violet-600";
  return "text-gray-400";
}

function formatLinkedUserLabel(row) {
  if (!row.linkedUserName) return "Sin usuario vinculado";
  return row.linkedUserEmail
    ? `${row.linkedUserName} · ${row.linkedUserEmail}`
    : row.linkedUserName;
}

function getVisaDeniedLabel(count) {
  if (!count) return null;
  if (count === 1) return "1ra negativa";
  if (count === 2) return "2da negativa";
  return `${count} negativas`;
}

function isKeyboardActivationKey(event) {
  return event.key === "Enter" || event.key === " ";
}

function toDateTimeValue(dateString) {
  if (!dateString) return undefined;
  return `${dateString}T12:00:00.000Z`;
}

export default function TourPaymentsPage({ tourId, tourName }) {
  const state = useTourPayments(tourId);

  const {
    financialTable,
    tableRows,
    tableColumns,
    installmentsByRow,
    footerTotals,
    summary,
    plans,
    paymentFlow,
    activeView,
    setActiveView,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    toast,
    users,
    usersLoading,
    openDetailDrawer,
    openAccountModal,
    setToast,
    registerModal,
    setRegisterModal,
    deletePayModal,
    setDeletePayModal,
    deleteParticipantModal,
    setDeleteParticipantModal,
    createParticipantModal,
    setCreateParticipantModal,
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
    handleCreateParticipant,
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
    creatingParticipant,
    updatingAccount,
    creatingPlan,
    updatingPlan,
    creatingAccounts,
    assigningPlan,
  } = state;

  const hasPlans = plans.length > 0;
  const openRegisterModal = useCallback(() => {
    setRegisterModal({ open: true, participant: null });
  }, [setRegisterModal]);
  const openCreateParticipantModal = useCallback(() => {
    setCreateParticipantModal({ open: true });
  }, [setCreateParticipantModal]);
  const openSetupModal = useCallback(() => {
    setSetupModal({ open: true });
  }, [setSetupModal]);
  const handleOpenSetupView = useCallback(() => {
    setActiveView("setup");
    openSetupModal();
  }, [openSetupModal, setActiveView]);
  const handleSearchChange = useCallback(
    (event) => {
      setSearch(event.target.value);
    },
    [setSearch]
  );
  const handleStatusChange = useCallback(
    (value) => {
      setStatusFilter(value);
    },
    [setStatusFilter]
  );
  const handleOpenRegisterForRow = useCallback(
    (row) => {
      setRegisterModal({
        open: true,
        participant: { id: row.participantId, fullName: row.fullName },
      });
    },
    [setRegisterModal]
  );
  const handleDeleteParticipantRequest = useCallback(
    (row) => {
      setDeleteParticipantModal({ open: true, participant: row });
    },
    [setDeleteParticipantModal]
  );
  const handleCreatePlanRequest = useCallback(() => {
    setPlanModal({ open: true, plan: null, mode: "create" });
  }, [setPlanModal]);
  const handleEditPlanRequest = useCallback(
    (plan) => {
      setPlanModal({ open: true, plan, mode: "edit" });
    },
    [setPlanModal]
  );
  const handleCloseRegisterModal = useCallback(() => {
    setRegisterModal(EMPTY_REGISTER_MODAL);
  }, [setRegisterModal]);
  const handleCloseDeletePaymentModal = useCallback(() => {
    setDeletePayModal(EMPTY_DELETE_PAYMENT_MODAL);
  }, [setDeletePayModal]);
  const handleCloseDeleteParticipantModal = useCallback(() => {
    setDeleteParticipantModal(EMPTY_DELETE_PARTICIPANT_MODAL);
  }, [setDeleteParticipantModal]);
  const handleCloseCreateParticipantModal = useCallback(() => {
    setCreateParticipantModal(EMPTY_CREATE_PARTICIPANT_MODAL);
  }, [setCreateParticipantModal]);
  const handleCloseAccountModal = useCallback(() => {
    setAccountModal(EMPTY_ACCOUNT_MODAL);
  }, [setAccountModal]);
  const handleClosePlanModal = useCallback(() => {
    setPlanModal(EMPTY_PLAN_MODAL);
  }, [setPlanModal]);
  const handleCloseSetupModal = useCallback(() => {
    setSetupModal(EMPTY_SETUP_MODAL);
  }, [setSetupModal]);
  const handleCloseDetailDrawer = useCallback(() => {
    setDetailDrawer(EMPTY_DETAIL_DRAWER);
  }, [setDetailDrawer]);
  const handleDrawerRegisterPayment = useCallback(
    (participant) => {
      setDetailDrawer(EMPTY_DETAIL_DRAWER);
      setRegisterModal({ open: true, participant });
    },
    [setDetailDrawer, setRegisterModal]
  );
  const handleDrawerDeletePayment = useCallback(
    (payment) => {
      setDetailDrawer(EMPTY_DETAIL_DRAWER);
      setDeletePayModal({ open: true, payment });
    },
    [setDetailDrawer, setDeletePayModal]
  );
  const handlePlanSubmit = useCallback(
    (input) => {
      if (planModal.mode === "create") {
        return handleCreatePlan(input);
      }

      return handleUpdatePlan(planModal.plan.id, input);
    },
    [handleCreatePlan, handleUpdatePlan, planModal.mode, planModal.plan]
  );

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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openCreateParticipantModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-800 text-sm font-bold rounded-2xl active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Gestionar participante
          </button>
          <button
            onClick={openRegisterModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-2xl active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Registrar pago
          </button>
        </div>
      </div>

      {/* ── Sin configuración warning ─────────────────────────────────────── */}
      {!loading && !financialTable?.rows?.length && !hasPlans && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">Módulo financiero sin configurar</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Primero creá el plan de pagos y las cuentas financieras de los participantes.
            </p>
          </div>
          <button
            onClick={handleOpenSetupView}
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
          columns={tableColumns}
          installmentsByRow={installmentsByRow}
          footerTotals={footerTotals}
          loading={tableLoading}
          error={tableError}
          search={search}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          onRegisterPayment={handleOpenRegisterForRow}
          onOpenDetail={openDetailDrawer}
          onAdjustAccount={openAccountModal}
          onDeleteParticipant={handleDeleteParticipantRequest}
        />
      )}

      {activeView === "summary" && <SummaryView summary={summary} paymentFlow={paymentFlow} />}

      {activeView === "setup" && (
        <SetupView
          plans={plans}
          onCreatePlan={handleCreatePlanRequest}
          onEditPlan={handleEditPlanRequest}
          onDeletePlan={handleDeletePlan}
          onSetupAll={openSetupModal}
        />
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <RegisterPaymentModal
        isOpen={registerModal.open}
        tourId={tourId}
        prefillParticipant={registerModal.participant}
        onClose={handleCloseRegisterModal}
        onSubmit={handleRegisterPayment}
        loading={registering}
      />

      <DeletePaymentModal
        payment={deletePayModal.payment}
        onConfirm={handleDeletePayment}
        onCancel={handleCloseDeletePaymentModal}
        loading={deletingPay}
      />

      <DeleteParticipantModal
        participant={deleteParticipantModal.participant}
        onConfirm={handleDeleteParticipant}
        onCancel={handleCloseDeleteParticipantModal}
        loading={deletingParticipant}
      />

      <CreateParticipantModal
        isOpen={createParticipantModal.open}
        users={users}
        usersLoading={usersLoading}
        onClose={handleCloseCreateParticipantModal}
        onSubmit={handleCreateParticipant}
        loading={creatingParticipant}
      />

      <AccountAdjustModal
        isOpen={accountModal.open}
        participantId={accountModal.participantId}
        row={accountModal.row}
        tourId={tourId}
        plans={plans}
        defaultPlan={state.defaultPlan}
        onClose={handleCloseAccountModal}
        onSubmit={handleUpdateAccount}
        loading={updatingAccount}
      />

      <PaymentPlanModal
        isOpen={planModal.open}
        mode={planModal.mode}
        plan={planModal.plan}
        onClose={handleClosePlanModal}
        onSubmit={handlePlanSubmit}
        loading={creatingPlan || updatingPlan}
      />

      <SetupFinanceModal
        isOpen={setupModal.open}
        tourId={tourId}
        plans={plans}
        onClose={handleCloseSetupModal}
        onSubmit={handleSetupAll}
        loading={creatingAccounts || assigningPlan}
      />

      <ParticipantDetailDrawer
        isOpen={detailDrawer.open}
        participantId={detailDrawer.participantId}
        tourId={detailDrawer.tourId}
        participant={detailDrawer.participant}
        onClose={handleCloseDetailDrawer}
        onRegisterPayment={handleDrawerRegisterPayment}
        onDeletePayment={handleDrawerDeletePayment}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY CARDS
// ═══════════════════════════════════════════════════════════════════════════════

const SummaryCards = memo(function SummaryCards({ summary }) {
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
});

const StatCard = memo(function StatCard({ label, value, color = "text-gray-900", small = false }) {
  return (
    <div>
      <p className={`${small ? "text-xl" : "text-xl"} font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCIAL TABLE VIEW — tabla tipo Excel
// ═══════════════════════════════════════════════════════════════════════════════

const FinancialTableView = memo(function FinancialTableView({
  financialTable,
  tableRows,
  columns,
  installmentsByRow,
  footerTotals,
  loading,
  error,
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onRegisterPayment,
  onOpenDetail,
  onAdjustAccount,
  onDeleteParticipant,
}) {
  if (loading) return <TableSkeleton />;
  if (error) return <ErrorState message={error.message} />;
  if (!financialTable) return <EmptyTableState />;

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <input
            type="text"
            placeholder="Buscar participante..."
            value={search}
            onChange={onSearchChange}
            className="w-full pl-12 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onStatusChange(f.value)}
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
              {tableRows.map((row) => (
                <FinancialTableRow
                  key={row.participantId}
                  row={row}
                  columns={columns}
                  installmentsMap={installmentsByRow.get(row.participantId)}
                  onRegisterPayment={onRegisterPayment}
                  onOpenDetail={onOpenDetail}
                  onAdjustAccount={onAdjustAccount}
                  onDeleteParticipant={onDeleteParticipant}
                />
              ))}
            </tbody>

            <FinancialTableFooter
              columns={columns}
              footerTotals={footerTotals}
              rowCount={tableRows.length}
            />
          </table>
        </div>
      )}
    </div>
  );
});

const FinancialTableRow = memo(function FinancialTableRow({
  row,
  columns,
  installmentsMap,
  onRegisterPayment,
  onOpenDetail,
  onAdjustAccount,
  onDeleteParticipant,
}) {
  const statusConfig =
    FINANCIAL_STATUS_CONFIG[row.financialStatus] || FINANCIAL_STATUS_CONFIG.PENDING;
  const initials = getParticipantInitials(row.fullName);
  const balanceClassName = getBalanceClassName(row.balance);
  const visaDenied = row.visaStatus === "DENIED";
  const visaDeniedLabel = getVisaDeniedLabel(row.visaDeniedCount);
  const handleOpenDetail = useCallback(() => {
    onOpenDetail(row);
  }, [onOpenDetail, row]);
  const handleRegisterPayment = useCallback(() => {
    onRegisterPayment(row);
  }, [onRegisterPayment, row]);
  const handleAdjustAccount = useCallback(() => {
    onAdjustAccount(row);
  }, [onAdjustAccount, row]);
  const handleDeleteParticipant = useCallback(() => {
    onDeleteParticipant(row);
  }, [onDeleteParticipant, row]);
  const stopPropagation = useCallback((event) => {
    event.stopPropagation();
  }, []);

  return (
    <tr
      className={`transition-colors cursor-pointer ${
        row.isRemoved
          ? "bg-red-50/70 hover:bg-red-50"
          : visaDenied
          ? "bg-rose-50/80 hover:bg-rose-50"
          : "hover:bg-gray-50"
      }`}
      onClick={handleOpenDetail}
    >
      <td
        className={`px-4 py-3 sticky left-0 transition-colors ${
          row.isRemoved
            ? "bg-red-50/90 hover:bg-red-50"
            : visaDenied
            ? "bg-rose-50/90 hover:bg-rose-50"
            : "bg-white hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              row.isRemoved
                ? "bg-red-100 text-red-700"
                : visaDenied
                ? "bg-rose-100 text-rose-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p
                className={`font-semibold truncate max-w-[180px] ${
                  row.isRemoved ? "text-red-900" : "text-gray-900"
                }`}
              >
                {row.fullName}
              </p>
              {visaDenied && !row.isRemoved && (
                <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                  Visa negada
                </span>
              )}
              {row.isRemoved && (
                <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                  Retirado
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  row.isRemoved ? "bg-red-500" : visaDenied ? "bg-rose-500" : statusConfig.dot
                }`}
              />
              <span
                className={`truncate ${
                  row.isRemoved ? "text-red-600" : visaDenied ? "text-rose-600" : "text-gray-400"
                }`}
              >
                {row.instrument} • {row.identification}
              </span>
            </div>
            <div
              className={`mt-0.5 truncate text-[11px] ${
                row.isRemoved ? "text-red-500" : visaDenied ? "text-rose-500" : "text-gray-400"
              }`}
            >
              {formatLinkedUserLabel(row)}
              {row.isRemoved && row.removedByName && ` · eliminado por ${row.removedByName}`}
              {row.isRemoved && row.removedAt && ` · ${fmtDate(row.removedAt)}`}
            </div>
            {!row.hasFinancialAccount && (
              <div className="mt-1 text-[11px] font-semibold text-amber-700">
                Sin cuenta financiera configurada
              </div>
            )}
            {visaDenied && (
              <div className="mt-1 text-[11px] font-semibold text-rose-700">
                Visa negada{visaDeniedLabel ? ` · ${visaDeniedLabel}` : ""}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-3 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
        {fmtAmount(row.finalAmount)}
      </td>
      <td className="px-3 py-3 text-right font-semibold text-emerald-600 whitespace-nowrap">
        {fmtAmount(row.totalPaid)}
      </td>
      <td className={`px-3 py-3 text-right font-bold whitespace-nowrap ${balanceClassName}`}>
        {row.balance < 0 ? `+${fmtAmount(Math.abs(row.balance))}` : fmtAmount(row.balance)}
      </td>

      {columns.map((col) => {
        const cell = installmentsMap?.get(col.order);
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

      <td className="px-3 py-3 text-center" onClick={stopPropagation}>
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={handleRegisterPayment}
            title="Registrar pago"
            disabled={row.isRemoved || !row.hasFinancialAccount}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <button
            onClick={handleAdjustAccount}
            title="Ajustar cuenta"
            disabled={!row.hasFinancialAccount}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </button>
          <button
            onClick={handleDeleteParticipant}
            title="Eliminar participante"
            disabled={row.isRemoved}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
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
      </td>
    </tr>
  );
});

const FinancialTableFooter = memo(function FinancialTableFooter({
  columns,
  footerTotals,
  rowCount,
}) {
  if (!footerTotals) return null;

  return (
    <tfoot>
      <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold">
        <td className="px-4 py-3 text-xs text-gray-500 sticky left-0 bg-gray-50">
          {rowCount} participantes
        </td>
        <td className="px-3 py-3 text-right text-xs text-gray-700">
          {fmtAmount(footerTotals.finalAmount)}
        </td>
        <td className="px-3 py-3 text-right text-xs text-emerald-600">
          {fmtAmount(footerTotals.totalPaid)}
        </td>
        <td className="px-3 py-3 text-right text-xs text-amber-600">
          {fmtAmount(footerTotals.balance)}
        </td>
        {columns.map((col) => (
          <td key={col.order} className="px-3 py-3 text-center text-xs text-gray-400">
            {fmtAmount(footerTotals.byColumn.get(col.order) ?? 0)}
          </td>
        ))}
        <td />
      </tr>
    </tfoot>
  );
});

const InstallmentCell = memo(function InstallmentCell({ cell }) {
  const colorClass = INSTALLMENT_TEXT_CLASS[cell.status] || INSTALLMENT_TEXT_CLASS.PENDING;

  if (cell.status === "WAIVED") return <span className="text-gray-300 text-xs">exon.</span>;

  return (
    <span className={`text-xs ${colorClass} whitespace-nowrap`}>
      {fmtAmount(cell.paidAmount)}
      <span className="text-gray-300 font-normal">/{fmtAmount(cell.amount)}</span>
    </span>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY VIEW
// ═══════════════════════════════════════════════════════════════════════════════

const SummaryView = memo(function SummaryView({ summary, paymentFlow }) {
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
});

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP VIEW
// ═══════════════════════════════════════════════════════════════════════════════

const SetupView = memo(function SetupView({
  plans,
  onCreatePlan,
  onEditPlan,
  onDeletePlan,
  onSetupAll,
}) {
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
});

const PlanCard = memo(function PlanCard({ plan, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const sortedInstallments = useMemo(
    () => [...plan.installments].sort((a, b) => a.order - b.order),
    [plan.installments]
  );
  const toggleExpanded = useCallback(() => {
    setExpanded((value) => !value);
  }, []);
  const handleToggleKeyDown = useCallback(
    (event) => {
      if (!isKeyboardActivationKey(event)) return;
      event.preventDefault();
      toggleExpanded();
    },
    [toggleExpanded]
  );
  const stopPropagation = useCallback((event) => {
    event.stopPropagation();
  }, []);
  const handleEdit = useCallback(() => {
    onEdit(plan);
  }, [onEdit, plan]);
  const handleDelete = useCallback(() => {
    onDelete(plan.id);
  }, [onDelete, plan.id]);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleExpanded}
        onKeyDown={handleToggleKeyDown}
        role="button"
        tabIndex={0}
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
        <div className="flex items-center gap-1">
          <button
            onClick={(event) => {
              stopPropagation(event);
              handleEdit();
            }}
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
            onClick={(event) => {
              stopPropagation(event);
              handleDelete();
            }}
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
            {sortedInstallments.map((inst) => (
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
});

// ═══════════════════════════════════════════════════════════════════════════════
// STATES
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE PARTICIPANT MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function DeleteParticipantModal({ participant, onConfirm, onCancel, loading }) {
  const handleBackdropClick = useCallback(
    (event) => {
      if (event.target === event.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );
  const handleBackdropKeyDown = useCallback(
    (event) => {
      if (event.target !== event.currentTarget) return;
      if (!isKeyboardActivationKey(event) && event.key !== "Escape") return;
      event.preventDefault();
      onCancel();
    },
    [onCancel]
  );
  if (!participant) return null;

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Eliminar participante</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {participant?.totalPaid > 0
              ? "Se retirará de la gira, pero el historial financiero quedará guardado."
              : "Esta acción no se puede deshacer."}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
            <p className="text-sm font-bold text-gray-900">{participant.fullName}</p>
            <p className="text-xs text-gray-500">{participant.identification}</p>
            {participant.linkedUserName && (
              <p className="text-xs text-gray-400">{participant.linkedUserName}</p>
            )}
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1">
            <p className="font-bold">
              {participant?.totalPaid > 0 ? "Se removerá de:" : "Se eliminarán también:"}
            </p>
            <p>• Asignaciones de vuelos e itinerarios</p>
            <p>• Asignaciones de habitaciones</p>
            {participant?.totalPaid > 0 ? (
              <>
                <p>• Se conservarán pagos, cuotas y cuenta financiera</p>
                <p>• La fila quedará marcada en rojo para auditoría</p>
              </>
            ) : (
              <>
                <p>• Historial de pagos y cuotas</p>
                <p>• Cuenta financiera</p>
              </>
            )}
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
              {loading ? "Procesando…" : participant?.totalPaid > 0 ? "Retirar" : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateParticipantModal({ isOpen, users, usersLoading, onClose, onSubmit, loading }) {
  const EMPTY_FORM = {
    linkedUserId: "",
    firstName: "",
    firstSurname: "",
    secondSurname: "",
    identification: "",
    email: "",
    phone: "",
    birthDate: "",
    instrument: "",
    grade: "",
    role: "MUSICIAN",
    notes: "",
  };

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setErrors({});
    setSearch("");
  }, [isOpen]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const text = [
        user.name,
        user.firstSurName,
        user.secondSurName,
        user.email,
        user.carnet,
        user.instrument,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [search, users]);

  if (!isOpen) return null;

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSelectUser = (user) => {
    setForm((prev) => ({
      ...prev,
      linkedUserId: user.id,
      firstName: user.name || prev.firstName,
      firstSurname: user.firstSurName || prev.firstSurname,
      secondSurname: user.secondSurName || prev.secondSurname,
      identification: prev.identification || user.carnet || "",
      email: user.email || prev.email,
      phone: user.phone || prev.phone,
      birthDate: user.birthday ? String(user.birthday).slice(0, 10) : prev.birthDate,
      instrument: user.instrument || prev.instrument,
      grade: user.grade || prev.grade,
    }));
    setErrors((prev) => ({ ...prev, linkedUserId: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = "Nombre requerido";
    if (!form.firstSurname.trim()) next.firstSurname = "Primer apellido requerido";
    if (!form.identification.trim()) next.identification = "Identificación requerida";
    return next;
  };

  const handleSubmit = () => {
    const next = validate();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    onSubmit({
      linkedUserId: form.linkedUserId || undefined,
      firstName: form.firstName.trim(),
      firstSurname: form.firstSurname.trim(),
      secondSurname: form.secondSurname.trim() || undefined,
      identification: form.identification.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      birthDate: toDateTimeValue(form.birthDate),
      instrument: form.instrument.trim() || undefined,
      grade: form.grade.trim() || undefined,
      role: form.role,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Agregar participante</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Vincular un usuario es opcional. También podés crear el participante manualmente.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-gray-100 p-6 lg:border-b-0 lg:border-r">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                Vincular usuario
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Opcional. Si no seleccionás uno, se guarda igual como participante manual.
              </p>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, correo, carnet o instrumento"
                className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {usersLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3, 4].map((row) => (
                    <div key={row} className="h-16 rounded-2xl bg-gray-100" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                  No hay usuarios que coincidan.
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const fullName = [user.name, user.firstSurName, user.secondSurName]
                    .filter(Boolean)
                    .join(" ");
                  const isSelected = form.linkedUserId === user.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                        isSelected
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">{fullName}</p>
                          <p className="truncate text-xs text-gray-500">
                            {user.email || "Sin correo"} {user.carnet ? `· ${user.carnet}` : ""}
                          </p>
                          <p className="truncate text-xs text-gray-400">
                            {user.instrument || "Sin instrumento"}{" "}
                            {user.grade ? `· ${user.grade}` : ""}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Vinculado
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
              Datos del participante
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Nombre" error={errors.firstName}>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(event) => set("firstName", event.target.value)}
                  className={inputClass(errors.firstName)}
                />
              </Field>
              <Field label="Primer apellido" error={errors.firstSurname}>
                <input
                  type="text"
                  value={form.firstSurname}
                  onChange={(event) => set("firstSurname", event.target.value)}
                  className={inputClass(errors.firstSurname)}
                />
              </Field>
              <Field label="Segundo apellido">
                <input
                  type="text"
                  value={form.secondSurname}
                  onChange={(event) => set("secondSurname", event.target.value)}
                  className={inputClass()}
                />
              </Field>
              <Field label="Identificación / carnet" error={errors.identification}>
                <input
                  type="text"
                  value={form.identification}
                  onChange={(event) => set("identification", event.target.value)}
                  className={inputClass(errors.identification)}
                />
              </Field>
              <Field label="Correo">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => set("email", event.target.value)}
                  className={inputClass()}
                />
              </Field>
              <Field label="Teléfono">
                <input
                  type="text"
                  value={form.phone}
                  onChange={(event) => set("phone", event.target.value)}
                  className={inputClass()}
                />
              </Field>
              <Field label="Nacimiento">
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(event) => set("birthDate", event.target.value)}
                  className={inputClass()}
                />
              </Field>
              <Field label="Instrumento">
                <input
                  type="text"
                  value={form.instrument}
                  onChange={(event) => set("instrument", event.target.value)}
                  className={inputClass()}
                />
              </Field>
              <Field label="Grado">
                <input
                  type="text"
                  value={form.grade}
                  onChange={(event) => set("grade", event.target.value)}
                  className={inputClass()}
                />
              </Field>
              <Field label="Rol">
                <select
                  value={form.role}
                  onChange={(event) => set("role", event.target.value)}
                  className={inputClass()}
                >
                  <option value="MUSICIAN">Músico</option>
                  <option value="STAFF">Staff</option>
                  <option value="DIRECTOR">Director</option>
                  <option value="GUEST">Invitado</option>
                </select>
              </Field>
              <Field label="Estado">
                <select
                  value={form.status}
                  onChange={(event) => set("status", event.target.value)}
                  className={inputClass()}
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </Field>
            </div>

            <Field label="Notas" className="mt-3">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) => set("notes", event.target.value)}
                className={inputClass()}
              />
            </Field>

            <div className="mt-5 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-2xl bg-gray-900 py-2.5 text-sm font-bold text-white transition-all hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? "Guardando…" : "Agregar participante"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputClass(hasError = false) {
  return `w-full rounded-2xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
    hasError ? "border-red-400 bg-red-50" : "border-gray-200"
  }`;
}

function TableSkeleton() {
  const skeletonRows = ["header", "row-1", "row-2", "row-3", "row-4", "row-5"];

  return (
    <div className="space-y-2 animate-pulse">
      {skeletonRows.map((rowId, index) => (
        <div
          key={rowId}
          className={index === 0 ? "h-10 bg-gray-100 rounded-xl" : "h-12 bg-gray-100 rounded-xl"}
        />
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
