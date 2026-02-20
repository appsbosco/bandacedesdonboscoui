/**
 * ExpensesPage — /finance/expenses
 * Registro de gastos ultra-rápido. Categoría sticky para múltiples registros.
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import PropTypes from "prop-types";

import {
  GET_CATEGORIES,
  GET_ACTIVITIES,
  GET_CASH_SESSION_DETAIL,
  GET_EXPENSES_BY_DATE,
} from "graphql/queries/finance";
import { RECORD_EXPENSE, VOID_EXPENSE } from "graphql/mutations/finance";
import { useNotice } from "../../../hooks/useFinance";
import {
  formatCRC,
  todayStr,
  fmtDatetime,
  parseCRC,
  AMOUNT_PRESETS,
  PAYMENT_LABELS,
} from "utils/finance";
import {
  Notice,
  Skeleton,
  PaymentMethodPills,
  MoneyInput,
  AmountPresets,
  CategoryPicker,
  ActivityPills,
  SaleStatusPill,
  VoidReasonModal,
} from "../components/FinanceAtoms";
import { FinancePageHeader } from "./FinancePageHeader";

// ─── RecentExpensesPanel ──────────────────────────────────────────────────────

const RecentExpensesPanel = ({ expenses, loading, onVoid }) => {
  if (loading)
    return (
      <div className="space-y-2">
        <Skeleton />
        <Skeleton />
      </div>
    );

  if (!expenses?.length)
    return (
      <div className="py-8 text-center">
        <p className="text-2xl mb-1">💸</p>
        <p className="text-xs text-slate-400">Sin gastos hoy todavía.</p>
      </div>
    );

  const activeTotal = expenses
    .filter((e) => e.status === "ACTIVE")
    .reduce((a, e) => a + e.amount, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Hoy ({expenses.filter((e) => e.status === "ACTIVE").length})
        </p>
        <p className="text-sm font-extrabold text-red-600">-{formatCRC(activeTotal)}</p>
      </div>

      {expenses.slice(0, 15).map((e) => {
        const pmCfg = PAYMENT_LABELS[e.paymentMethod] || {};
        const isExternal = e.scope === "EXTERNAL";

        return (
          <div
            key={e.id}
            className={`border rounded-xl p-3 ${
              e.status !== "ACTIVE" ? "opacity-50 border-slate-100" : "border-slate-200"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  {e.categorySnapshot && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {e.categorySnapshot}
                    </span>
                  )}

                  {e.isAssetPurchase && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      Activo
                    </span>
                  )}

                  {isExternal && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      Externo
                    </span>
                  )}

                  <span className="text-xs text-slate-400">
                    {pmCfg.emoji} {pmCfg.label}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-800 truncate">{e.concept}</p>
                {e.detail && <p className="text-xs text-slate-400 truncate">{e.detail}</p>}
                <p className="text-xs text-slate-400">{fmtDatetime(e.createdAt)}</p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <p className="text-base font-extrabold text-red-600">-{formatCRC(e.amount)}</p>
                <SaleStatusPill status={e.status} />
              </div>
            </div>

            {e.voidReason && (
              <p className="text-xs text-red-500 mt-1 italic">Motivo: {e.voidReason}</p>
            )}

            {e.status === "ACTIVE" && (
              <button
                onClick={() => onVoid(e)}
                className="mt-1.5 text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors"
              >
                Anular
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const ExpensesPage = () => {
  const navigate = useNavigate();
  const today = todayStr();

  // ✅ Un solo selector: Externo = true/false
  // OFF = SESSION (afecta caja) / ON = EXTERNAL (no afecta caja)
  const [isExternal, setIsExternal] = useState(false);

  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [detail, setDetail] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [activityId, setActivityId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isAsset, setIsAsset] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [vendor, setVendor] = useState("");
  const [voidTarget, setVoidTarget] = useState(null);
  const [notice, showNotice] = useNotice();

  const amountRef = useRef(null);
  const scopeInitRef = useRef(false);

  const { data: categoriesData, loading: catLoading } = useQuery(GET_CATEGORIES, {
    variables: { onlyActive: true },
  });

  const { data: activitiesData, loading: actLoading } = useQuery(GET_ACTIVITIES, {
    variables: { onlyActive: true },
  });

  const {
    data: sessionData,
    loading: sessionLoading,
    refetch: refetchSession,
  } = useQuery(GET_CASH_SESSION_DETAIL, {
    variables: { businessDate: today },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const {
    data: expensesData,
    loading: expensesLoading,
    refetch,
  } = useQuery(GET_EXPENSES_BY_DATE, {
    variables: { businessDate: today },
    fetchPolicy: "cache-and-network",
  });

  const session = sessionData?.cashSessionDetail || null;
  const canUseSession = session?.status === "OPEN";

  const categories = categoriesData?.categories || [];
  const activities = activitiesData?.activities || [];
  const expenses = expensesData?.expensesByDate || [];

  const [recordExpense, { loading }] = useMutation(RECORD_EXPENSE);
  const [voidExpense, { loading: voidLoading }] = useMutation(VOID_EXPENSE, {
    onCompleted: () => {
      showNotice("success", "Gasto anulado.");
      refetch();
      setVoidTarget(null);
    },
    onError: (e) => showNotice("error", e.message),
  });

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  // ✅ Inicializar “Externo” automáticamente según estado de caja
  // - si NO hay caja abierta → Externo = true
  // - si hay caja abierta → Externo = false (solo la primera vez; luego respeta lo que el usuario elija)
  useEffect(() => {
    // esperar a que el query responda al menos una vez
    if (sessionData === undefined) return;

    if (!scopeInitRef.current) {
      setIsExternal(!canUseSession);
      scopeInitRef.current = true;
      return;
    }

    // si la caja se cierra/desaparece, forzar Externo = true (no se puede registrar SESSION sin caja)
    if (!canUseSession) setIsExternal(true);
  }, [sessionData, canUseSession]);

  const handleSubmit = useCallback(async () => {
    const total = parseCRC(amount);
    if (total <= 0) return showNotice("error", "El monto debe ser mayor a ₡0.");
    if (!concept.trim()) return showNotice("error", "Ingresá un concepto.");

    const scope = isExternal ? "EXTERNAL" : "SESSION";

    // ✅ Si intenta SESSION sin caja abierta → error UX inmediato
    if (scope === "SESSION" && !canUseSession) {
      return showNotice("error", "No hay caja abierta para registrar este gasto como de caja.");
    }

    try {
      await recordExpense({
        variables: {
          input: {
            businessDate: today,
            paymentMethod,
            scope, // ✅ NUEVO

            concept: concept.trim(),
            amount: total,
            categoryId: categoryId || undefined,
            activityId: activityId || undefined,

            cashSessionId: scope === "SESSION" ? session?.id || undefined : undefined,

            detail: detail.trim() || undefined,
            vendor: vendor.trim() || undefined,
            isAssetPurchase: isAsset,
            purpose: isAsset ? purpose.trim() || undefined : undefined,
          },
        },
      });

      showNotice("success", `Gasto de ${formatCRC(total)} registrado ✓`);
      // Mantener categoría, método y activityId; limpiar solo monto y concepto
      setAmount("");
      setConcept("");
      setDetail("");
      setPurpose("");
      setVendor("");
      refetch();
      setTimeout(() => amountRef.current?.focus(), 100);
    } catch (e) {
      showNotice("error", e.message || "Error al registrar gasto");
    }
  }, [
    amount,
    concept,
    detail,
    categoryId,
    activityId,
    paymentMethod,
    isAsset,
    purpose,
    vendor,
    session,
    today,
    recordExpense,
    refetch,
    showNotice,
    isExternal,
    canUseSession,
  ]);

  const amountVal = parseCRC(amount);

  return (
    <DashboardLayout>
      <DashboardNavbar />

      {voidTarget && (
        <VoidReasonModal
          title="Anular gasto"
          onConfirm={(reason) => voidExpense({ variables: { expenseId: voidTarget.id, reason } })}
          onCancel={() => setVoidTarget(null)}
          loading={voidLoading}
        />
      )}

      <div className="page-content space-y-5">
        {/* Header */}
        <FinancePageHeader
          title="Registrar gasto"
          backTo="/finance"
          right={
            canUseSession ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Caja abierta
              </span>
            ) : null
          }
        />

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Form */}
          <div className="space-y-4">
            {/* Step 1: Category (sticky) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  1. Categoría
                </p>
                {categoryId && (
                  <button
                    onClick={() => setCategoryId(null)}
                    className="text-xs bg-slate-600 text-slate-400 hover:text-slate-600"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <CategoryPicker
                categories={categories}
                selected={categoryId}
                onSelect={setCategoryId}
                loading={catLoading}
              />

              {!categoryId && !catLoading && categories.length === 0 && (
                <button
                  onClick={() => navigate("/finance/catalogs")}
                  className="text-xs text-rose-600 hover:underline mt-2"
                >
                  + Crear categorías en catálogos
                </button>
              )}
            </div>

            {/* Step 2: Amount + details */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
              <Notice notice={notice} />

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  2. Monto
                </p>
                <MoneyInput ref={amountRef} value={amount} onChange={setAmount} />
                <div className="mt-2">
                  <AmountPresets presets={AMOUNT_PRESETS} onSelect={setAmount} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  Concepto *
                </label>
                <input
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Ej: Ingredientes, transporte, impresión…"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  Detalle (opcional)
                </label>
                <input
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Información adicional…"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  Proveedor (opcional)
                </label>
                <input
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Nombre del proveedor o tienda…"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>

              {/* Asset toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsAsset(!isAsset)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all w-full ${
                    isAsset
                      ? "bg-purple-50 border-purple-200 text-purple-700"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center text-xs font-bold ${
                      isAsset ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isAsset ? "✓" : ""}
                  </span>
                  Compra de instrumento / equipo (activo) 🎺
                </button>

                {isAsset && (
                  <input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Propósito / descripción del activo…"
                    className="w-full border border-purple-200 bg-purple-50 rounded-xl px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                )}
              </div>

              {/* Activity */}
              {activities.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Actividad (opcional)
                  </p>
                  <ActivityPills
                    activities={activities}
                    selected={activityId}
                    onSelect={setActivityId}
                    loading={actLoading}
                  />
                </div>
              )}

              {/* ✅ External toggle (single selector) */}
              <div className="border border-slate-200 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Externo
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      No afecta la caja (aunque esté abierta)
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isExternal
                        ? "Se registrará como EXTERNAL (sin cashSessionId)."
                        : "Se registrará como SESSION (con cashSessionId) y entra en el cierre."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      // si no hay caja abierta, no se puede pasar a SESSION
                      if (!canUseSession && isExternal) return;
                      // si quiere apagar Externo → requiere caja abierta
                      if (isExternal && !canUseSession) return;
                      setIsExternal((v) => !v);
                    }}
                    disabled={!canUseSession && isExternal} // si no hay caja, Externo queda fijo en true
                    className={`shrink-0 px-3 py-2 rounded-xl border text-sm font-bold transition-all ${
                      isExternal
                        ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    } ${!canUseSession && isExternal ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={
                      !canUseSession && isExternal
                        ? "No hay caja abierta. Solo se permiten movimientos externos."
                        : ""
                    }
                  >
                    {isExternal ? "ON" : "OFF"}
                  </button>
                </div>

                {!canUseSession && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3">
                    ⚠️ No hay caja abierta: los gastos se registran como <b>EXTERNOS</b>.
                  </p>
                )}
              </div>

              {/* Payment */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Método de pago
                </p>
                <PaymentMethodPills value={paymentMethod} onChange={setPaymentMethod} />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || amountVal <= 0 || !concept.trim()}
                className="w-full py-4 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-base disabled:opacity-40 active:scale-[0.98] transition-all shadow-sm"
              >
                {loading
                  ? "Guardando…"
                  : `Guardar gasto${amountVal > 0 ? ` · ${formatCRC(amountVal)}` : ""}`}
              </button>
            </div>
          </div>

          {/* Recent expenses */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-4">Gastos de hoy</h2>
            <RecentExpensesPanel
              expenses={expenses}
              loading={expensesLoading}
              onVoid={setVoidTarget}
            />
          </div>
        </div>
      </div>

      <Footer />
    </DashboardLayout>
  );
};

export default ExpensesPage;

RecentExpensesPanel.propTypes = {
  expenses: PropTypes.array,
  loading: PropTypes.bool,
  onVoid: PropTypes.func,
};
