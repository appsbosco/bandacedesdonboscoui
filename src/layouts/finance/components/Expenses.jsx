/**
 * Expenses.jsx — /finance/expenses
 *
 * FIXES v2:
 * - ❌ recordCommitteeExpense llamado con { committeeId, expenseId } planos
 * - ✅ Ahora llamado con { input: { committeeId, businessDate, amount, concept, expenseId } }
 *   que coincide con RecordCommitteeExpenseInput del backend
 * - budgets accesado correctamente desde allCommitteeBudgets.committees
 * - CommitteePicker recibe budgets en formato correcto
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
  GET_COMMITTEES,
  GET_ALL_COMMITTEE_BUDGETS,
} from "graphql/queries/finance";
import { RECORD_EXPENSE, VOID_EXPENSE, RECORD_COMMITTEE_EXPENSE } from "graphql/mutations/finance";
import { useNotice } from "hooks/useFinance";
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
  StatusPill,
  VoidReasonModal,
  ScopeBadge,
  ExternalToggle,
  CommitteePicker,
} from "./FinanceAtoms";
import { FinancePageHeader } from "./FinancePageHeader";

// ─── Helper ───────────────────────────────────────────────────────────────────

const scopeOf = (m) => m.scope || (m.cashSessionId ? "SESSION" : "EXTERNAL");

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

  const activeExpenses = expenses.filter((e) => e.status === "ACTIVE");
  const activeTotal = activeExpenses.reduce((a, e) => a + e.amount, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Hoy ({activeExpenses.length})
        </p>
        <p className="text-sm font-extrabold text-red-600">-{formatCRC(activeTotal)}</p>
      </div>

      {expenses.slice(0, 15).map((e) => {
        const pmCfg = PAYMENT_LABELS[e.paymentMethod] || {};
        const inferredScope = scopeOf(e);

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
                  <ScopeBadge scope={inferredScope} />
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
                <StatusPill status={e.status} />
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

RecentExpensesPanel.propTypes = {
  expenses: PropTypes.array,
  loading: PropTypes.bool,
  onVoid: PropTypes.func,
};

// ─── ExpensesPage ─────────────────────────────────────────────────────────────

const ExpensesPage = () => {
  const navigate = useNavigate();
  const today = todayStr();

  const [isExternal, setIsExternal] = useState(false);
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [detail, setDetail] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [activityId, setActivityId] = useState(null);
  const [committeeId, setCommitteeId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isAsset, setIsAsset] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [vendor, setVendor] = useState("");
  const [voidTarget, setVoidTarget] = useState(null);
  const [notice, showNotice] = useNotice();

  const amountRef = useRef(null);
  const userTouchedRef = useRef(false);

  const { data: categoriesData, loading: catLoading } = useQuery(GET_CATEGORIES, {
    variables: { onlyActive: true },
  });

  const { data: activitiesData, loading: actLoading } = useQuery(GET_ACTIVITIES, {
    variables: { onlyActive: true },
  });

  const { data: sessionData } = useQuery(GET_CASH_SESSION_DETAIL, {
    variables: { businessDate: today },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: expensesData,
    loading: expensesLoading,
    refetch,
  } = useQuery(GET_EXPENSES_BY_DATE, {
    variables: { businessDate: today },
    fetchPolicy: "cache-and-network",
  });

  const { data: committeesData, loading: committeesLoading } = useQuery(GET_COMMITTEES, {
    variables: { onlyActive: true },
  });

  // ✅ FIX: acceso correcto a allCommitteeBudgets.committees
  const { data: budgetsData } = useQuery(GET_ALL_COMMITTEE_BUDGETS);

  const committees = (committeesData?.committees || []).filter((c) => c.isActive !== false);
  // allCommitteeBudgets devuelve { committees: [CommitteeBudgetSummary], ... }
  const budgetSummaries = budgetsData?.allCommitteeBudgets?.committees || [];

  const session = sessionData?.cashSessionDetail || null;
  const canUseSession = session?.status === "OPEN";
  const categories = categoriesData?.categories || [];
  const activities = activitiesData?.activities || [];
  const expenses = expensesData?.expensesByDate || [];

  const [recordExpense, { loading }] = useMutation(RECORD_EXPENSE);

  // ✅ FIX: onError con mensaje mejorado para no perder el ID del gasto ya registrado
  const [recordCommitteeExpense] = useMutation(RECORD_COMMITTEE_EXPENSE, {
    onError: (e) =>
      showNotice(
        "error",
        `⚠️ El gasto se registró pero no se pudo vincular al comité: ${e.message}. Podés vincularlo manualmente.`
      ),
  });

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

  useEffect(() => {
    if (sessionData === undefined) return;
    if (!userTouchedRef.current) {
      setIsExternal(!canUseSession);
      return;
    }
    if (!canUseSession) setIsExternal(true);
  }, [sessionData, canUseSession]);

  const handleExternalChange = useCallback((val) => {
    userTouchedRef.current = true;
    setIsExternal(val);
  }, []);

  const handleSubmit = useCallback(async () => {
    const total = parseCRC(amount);
    if (total <= 0) return showNotice("error", "El monto debe ser mayor a ₡0.");
    if (!concept.trim()) return showNotice("error", "Ingresá un concepto.");

    const scope = isExternal ? "EXTERNAL" : "SESSION";
    if (scope === "SESSION" && !canUseSession) {
      return showNotice("error", "No hay caja abierta. Usá modo externo.");
    }

    try {
      const result = await recordExpense({
        variables: {
          input: {
            businessDate: today,
            paymentMethod,
            scope,
            concept: concept.trim(),
            amount: total,
            categoryId: categoryId || undefined,
            activityId: activityId || undefined,
            cashSessionId: scope === "SESSION" ? session?.id : undefined,
            detail: detail.trim() || undefined,
            vendor: vendor.trim() || undefined,
            isAssetPurchase: isAsset,
            purpose: isAsset ? purpose.trim() || undefined : undefined,
          },
        },
      });

      // ✅ FIX: TODOS los campos requeridos de RecordCommitteeExpenseInput
      const newExpenseId = result?.data?.recordExpense?.id;
      if (committeeId && newExpenseId) {
        await recordCommitteeExpense({
          variables: {
            input: {
              committeeId,
              businessDate: today, // ← REQUERIDO
              amount: total, // ← REQUERIDO
              concept: concept.trim(), // ← REQUERIDO
              expenseId: newExpenseId, // ← Flujo A: vincular Expense existente
              activityId: activityId || undefined,
            },
          },
        });
      }

      const committeeMsg = committeeId ? " · vinculado al presupuesto del comité" : "";
      showNotice("success", `Gasto de ${formatCRC(total)} registrado ✓${committeeMsg}`);

      // Reset form
      setAmount("");
      setConcept("");
      setDetail("");
      setPurpose("");
      setVendor("");
      setCommitteeId(null);
      setCategoryId(null);
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
    committeeId,
    paymentMethod,
    isAsset,
    purpose,
    vendor,
    session,
    today,
    recordExpense,
    recordCommitteeExpense,
    refetch,
    showNotice,
    isExternal,
    canUseSession,
  ]);

  const amountVal = parseCRC(amount);

  // Buscar saldo del comité seleccionado para el aviso
  const selectedCommitteeBudget = budgetSummaries.find((b) => b.committee?.id === committeeId);

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
          {/* ── Formulario ── */}
          <div className="space-y-4">
            {/* Step 1: Categoría */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  1. Categoría
                </p>
                {categoryId && (
                  <button
                    onClick={() => setCategoryId(null)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600"
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

            {/* Step 2: Monto y detalles */}
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

              {/* Activo toggle */}
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

              {/* Actividad */}
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

              {/* Comité — solo visible si hay comités activos */}
              {committees.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Comité afectado{" "}
                    <span className="text-slate-400 font-normal normal-case">(opcional)</span>
                  </p>
                  <CommitteePicker
                    committees={committees}
                    selected={committeeId}
                    onSelect={setCommitteeId}
                    loading={committeesLoading}
                    budgets={budgetSummaries}
                  />

                  {/* Info del comité seleccionado */}
                  {committeeId && (
                    <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-200">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-violet-800">
                          Este gasto descontará del presupuesto del comité.
                        </span>
                        {selectedCommitteeBudget && amountVal > 0 && (
                          <p className="text-xs text-violet-700 mt-0.5">
                            Saldo disponible:{" "}
                            <strong>
                              {formatCRC(selectedCommitteeBudget.currentBalance || 0)}
                            </strong>
                            {amountVal > (selectedCommitteeBudget.currentBalance || 0) && (
                              <span className="text-amber-700 ml-1">
                                ⚠️ El gasto excede el saldo del comité.
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCommitteeId(null)}
                        className="text-xs text-violet-500 hover:text-violet-700 font-bold shrink-0"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              )}

              <ExternalToggle
                isExternal={isExternal}
                onChange={handleExternalChange}
                canUseSession={canUseSession}
              />

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

          {/* ── Gastos recientes ── */}
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
