/**
 * FinanceDashboard — /finance
 * Dashboard de caja del día.
 */
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import PropTypes from "prop-types";

import {
  GET_CASH_SESSION_DETAIL,
  GET_SALES_BY_DATE,
  GET_EXPENSES_BY_DATE,
} from "graphql/queries/finance";
import {
  OPEN_CASH_SESSION,
  CLOSE_CASH_SESSION,
  VOID_SALE,
  VOID_EXPENSE,
} from "graphql/mutations/finance";
import { useNotice } from "../../hooks/useFinance";
import {
  formatCRC,
  todayStr,
  fmtDatetime,
  fmtBusinessDate,
  parseCRC,
  AMOUNT_PRESETS,
  PAYMENT_LABELS,
} from "utils/finance";
import {
  Notice,
  Skeleton,
  VoidReasonModal,
  FilterPill,
  SaleStatusPill,
  StatCard,
  MoneyInput,
  AmountPresets,
} from "./components/FinanceAtoms";

// ─── OpenSessionModal ────────────────────────────────────────────────────────

const OpenSessionModal = ({ onClose, onSuccess }) => {
  const [openingCash, setOpeningCash] = useState("");
  const [notes, setNotes] = useState("");
  const [notice, showNotice] = useNotice();
  const today = todayStr();

  const [openSession, { loading }] = useMutation(OPEN_CASH_SESSION, {
    refetchQueries: [{ query: GET_CASH_SESSION_DETAIL, variables: { businessDate: today } }],
  });

  const handleSubmit = async () => {
    try {
      await openSession({
        variables: {
          businessDate: today,
          openingCash: parseCRC(openingCash),
          notes: notes || undefined,
        },
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      showNotice("error", e.message || "Error al abrir caja");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Abrir caja</h3>
            <p className="text-xs text-slate-500 mt-0.5">{fmtBusinessDate(today)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Notice notice={notice} />
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Efectivo inicial (opcional)
            </label>
            <MoneyInput value={openingCash} onChange={setOpeningCash} />
            <div className="mt-2">
              <AmountPresets presets={AMOUNT_PRESETS.slice(0, 5)} onSelect={setOpeningCash} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Notas (opcional)
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Día de festival..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {loading ? "Abriendo…" : "Abrir caja del día"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── CloseSessionModal ────────────────────────────────────────────────────────

const CloseSessionModal = ({ session, onClose, onSuccess }) => {
  const [countedCash, setCountedCash] = useState("");
  const [notes, setNotes] = useState("");
  const [notice, showNotice] = useNotice();

  const [closeSession, { loading }] = useMutation(CLOSE_CASH_SESSION, {
    refetchQueries: [{ query: GET_CASH_SESSION_DETAIL, variables: { businessDate: todayStr() } }],
  });

  const handleSubmit = async () => {
    try {
      await closeSession({
        variables: {
          input: {
            cashSessionId: session.id,
            countedCash: parseCRC(countedCash),
            notes: notes || undefined,
          },
        },
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      showNotice("error", e.message || "Error al cerrar caja");
    }
  };

  const expected = session?.expectedTotalsByMethod?.cash || 0;
  const counted = parseCRC(countedCash);
  const diff = countedCash ? counted - expected : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Cerrar caja</h3>
            <p className="text-xs text-slate-500">Efectivo esperado: {formatCRC(expected)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Notice notice={notice} />
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Efectivo contado
            </label>
            <MoneyInput value={countedCash} onChange={setCountedCash} />
            <div className="mt-2">
              <AmountPresets presets={AMOUNT_PRESETS.slice(0, 5)} onSelect={setCountedCash} />
            </div>
          </div>
          {diff !== null && (
            <div
              className={`rounded-xl p-3 text-sm font-bold text-center border ${
                diff === 0
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : diff > 0
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {diff === 0
                ? "✓ Cuadra perfecto"
                : diff > 0
                ? `Sobrante: ${formatCRC(diff)}`
                : `Faltante: ${formatCRC(Math.abs(diff))}`}
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Notas de cierre
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !countedCash}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {loading ? "Cerrando…" : "Confirmar cierre de caja"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MovementItem ─────────────────────────────────────────────────────────────

const MovementItem = ({ item, type, onVoid }) => {
  const isExpense = type === "expense";
  const isActive = item.status === "ACTIVE";
  const pmCfg = PAYMENT_LABELS[item.paymentMethod] || {};

  return (
    <div
      className={`border rounded-2xl p-4 transition-all ${
        isActive ? "border-slate-200" : "border-slate-100 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isExpense ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {isExpense ? "Gasto" : "Venta"}
            </span>
            {isExpense && item.categorySnapshot && (
              <span className="text-xs text-slate-500">{item.categorySnapshot}</span>
            )}
            <span className="text-xs text-slate-400">
              {pmCfg.emoji} {pmCfg.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate">
            {isExpense
              ? item.concept
              : item.lineItems?.length
              ? item.lineItems.map((l) => l.nameSnapshot).join(", ")
              : "Venta rápida"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{fmtDatetime(item.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <p
            className={`text-base font-extrabold ${
              isExpense ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {isExpense ? "-" : "+"}
            {formatCRC(isExpense ? item.amount : item.total)}
          </p>
          <SaleStatusPill status={item.status} />
        </div>
      </div>
      {item.voidReason && (
        <p className="text-xs text-red-500 mt-1.5 italic">Motivo: {item.voidReason}</p>
      )}
      {isActive && (
        <button
          onClick={() => onVoid(item)}
          className="mt-2 text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors"
        >
          Anular
        </button>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const today = todayStr();

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [voidTarget, setVoidTarget] = useState(null);
  const [movFilter, setMovFilter] = useState("all");
  const [notice, showNotice] = useNotice();

  const {
    data: sessionData,
    loading: sessionLoading,
    refetch: refetchSession,
  } = useQuery(GET_CASH_SESSION_DETAIL, {
    variables: { businessDate: today },
    fetchPolicy: "cache-and-network",
  });
  const {
    data: salesData,
    loading: salesLoading,
    refetch: refetchSales,
  } = useQuery(GET_SALES_BY_DATE, {
    variables: { businessDate: today },
    fetchPolicy: "cache-and-network",
  });
  const {
    data: expensesData,
    loading: expensesLoading,
    refetch: refetchExpenses,
  } = useQuery(GET_EXPENSES_BY_DATE, {
    variables: { businessDate: today },
    fetchPolicy: "cache-and-network",
  });

  const [voidSale, { loading: vsL }] = useMutation(VOID_SALE, {
    onCompleted: () => {
      showNotice("success", "Venta anulada.");
      refetchSales();
      setVoidTarget(null);
    },
    onError: (e) => showNotice("error", e.message),
  });
  const [voidExpense, { loading: veL }] = useMutation(VOID_EXPENSE, {
    onCompleted: () => {
      showNotice("success", "Gasto anulado.");
      refetchExpenses();
      setVoidTarget(null);
    },
    onError: (e) => showNotice("error", e.message),
  });

  const session = sessionData?.cashSessionDetail;
  const sales = salesData?.salesByDate || [];
  const expenses = expensesData?.expensesByDate || [];

  const totalSales = sales.filter((s) => s.status === "ACTIVE").reduce((a, s) => a + s.total, 0);
  const totalExpenses = expenses
    .filter((e) => e.status === "ACTIVE")
    .reduce((a, e) => a + e.amount, 0);
  const net = totalSales - totalExpenses;

  const allMovements = [
    ...sales.map((s) => ({ ...s, _type: "sale" })),
    ...expenses.map((e) => ({ ...e, _type: "expense" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filtered = allMovements.filter((m) => {
    if (movFilter === "sales") return m._type === "sale";
    if (movFilter === "expenses") return m._type === "expense";
    return true;
  });

  const handleVoidConfirm = useCallback(
    async (reason) => {
      if (!voidTarget) return;
      if (voidTarget._type === "sale")
        await voidSale({ variables: { saleId: voidTarget.id, reason } });
      else await voidExpense({ variables: { expenseId: voidTarget.id, reason } });
    },
    [voidTarget, voidSale, voidExpense]
  );

  const QUICK_ACTIONS = [
    {
      label: "Registrar venta",
      emoji: "💰",
      path: "/finance/sales",
      color: "bg-emerald-600 hover:bg-emerald-700",
    },
    {
      label: "Registrar gasto",
      emoji: "🧾",
      path: "/finance/expenses",
      color: "bg-rose-700 hover:bg-rose-800",
    },
    {
      label: "Reportes",
      emoji: "📊",
      path: "/finance/reports",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      label: "Catálogos",
      emoji: "🗂️",
      path: "/finance/catalogs",
      color: "bg-slate-700 hover:bg-slate-800",
    },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      {showOpenModal && (
        <OpenSessionModal
          onClose={() => setShowOpenModal(false)}
          onSuccess={() => {
            showNotice("success", "Caja abierta.");
            refetchSession();
          }}
        />
      )}
      {showCloseModal && session && (
        <CloseSessionModal
          session={session}
          onClose={() => setShowCloseModal(false)}
          onSuccess={() => {
            showNotice("success", "Caja cerrada.");
            refetchSession();
          }}
        />
      )}
      {voidTarget && (
        <VoidReasonModal
          title={`Anular ${voidTarget._type === "sale" ? "venta" : "gasto"}`}
          onConfirm={handleVoidConfirm}
          onCancel={() => setVoidTarget(null)}
          loading={vsL || veL}
        />
      )}

      <div className="page-content space-y-6">
        <div className="p-4 mt-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Caja del día</h1>
          <p className="text-sm text-slate-500 mt-1">{fmtBusinessDate(today)}</p>
        </div>

        <Notice notice={notice} />

        {/* Session card */}
        {sessionLoading ? (
          <Skeleton lines={4} />
        ) : !session ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-4">
            <div className="text-5xl">🏪</div>
            <div>
              <p className="text-lg font-bold text-slate-900">Caja no abierta</p>
              <p className="text-sm text-slate-500 mt-1">
                Abrí la caja para registrar movimientos del día.
              </p>
            </div>
            <button
              onClick={() => setShowOpenModal(true)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-base active:scale-[0.98] transition-all shadow-md"
            >
              🔓 Abrir caja
            </button>
          </div>
        ) : (
          <div
            className={`bg-white border rounded-3xl p-5 space-y-4 ${
              session.status === "OPEN" ? "border-emerald-200" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    session.status === "OPEN"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      session.status === "OPEN" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                    }`}
                  />
                  {session.status === "OPEN" ? "Caja abierta" : "Caja cerrada"}
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  Abrió: {fmtDatetime(session.openedAt)}
                </p>
              </div>
              {session.status === "OPEN" && (
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold active:scale-95 transition-all"
                >
                  Cerrar caja
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                label="Ingresos"
                value={formatCRC(totalSales)}
                valueClass="text-emerald-700"
              />
              <StatCard
                label="Egresos"
                value={formatCRC(totalExpenses)}
                valueClass="text-red-600"
              />

              <div className="col-span-2 sm:col-span-1">
                <StatCard
                  label="Neto"
                  value={formatCRC(net)}
                  valueClass={net >= 0 ? "text-slate-900" : "text-red-600"}
                />
              </div>
            </div>
            {session.status === "CLOSED" && session.difference !== null && (
              <div
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-center ${
                  Math.abs(session.difference) < 1
                    ? "bg-emerald-50 text-emerald-700"
                    : session.difference > 0
                    ? "bg-blue-50 text-blue-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {Math.abs(session.difference) < 1
                  ? "Cierre cuadrado ✓"
                  : session.difference > 0
                  ? `Sobrante: ${formatCRC(session.difference)}`
                  : `Faltante: ${formatCRC(Math.abs(session.difference))}`}
              </div>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className={`flex flex-col items-center justify-center gap-2 py-5 rounded-2xl text-white font-bold transition-all active:scale-95 shadow-sm ${a.color}`}
            >
              <span className="text-3xl">{a.emoji}</span>
              <span className="text-sm">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Movements */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Movimientos de hoy</h2>
            <span className="text-xs text-slate-400">{filtered.length} registros</span>
          </div>
          <div className="px-5 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto">
            {[
              ["all", "Todos"],
              ["sales", "Ventas"],
              ["expenses", "Gastos"],
            ].map(([id, label]) => (
              <FilterPill key={id} active={movFilter === id} onClick={() => setMovFilter(id)}>
                {label}
              </FilterPill>
            ))}
          </div>
          {(salesLoading || expensesLoading) && (
            <div className="p-5 space-y-3">
              <Skeleton />
              <Skeleton />
            </div>
          )}
          {!salesLoading && !expensesLoading && filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm font-semibold text-slate-600">Sin movimientos</p>
              <p className="text-xs text-slate-400 mt-1">Registrá una venta o gasto.</p>
            </div>
          )}
          {!salesLoading && !expensesLoading && filtered.length > 0 && (
            <div className="p-4 space-y-3">
              {filtered.map((item) => (
                <MovementItem key={item.id} item={item} type={item._type} onVoid={setVoidTarget} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
};

export default FinanceDashboard;
OpenSessionModal.propTypes = { onClose: PropTypes.func, onSuccess: PropTypes.func };
CloseSessionModal.propTypes = {
  session: PropTypes.object,
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
};
MovementItem.propTypes = { item: PropTypes.object, type: PropTypes.string, onVoid: PropTypes.func };
