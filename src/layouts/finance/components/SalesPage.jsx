/**
 * SalesPage — /finance/sales
 * Registro de ventas ultra-rápido. Dos modos: Venta rápida / Por productos.
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import PropTypes from "prop-types";

import {
  GET_ACTIVITIES,
  GET_CASH_SESSION_DETAIL,
  GET_SALES_BY_DATE,
} from "graphql/queries/finance";
import { RECORD_SALE } from "graphql/mutations/finance";
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
  ActivityPills,
  SaleStatusPill,
} from "../components/FinanceAtoms";
import { FinancePageHeader } from "./FinancePageHeader";
/**
 * UI helpers (ligeros, para estructura y consistencia visual)
 */
const Card = ({ title, children, right }) => (
  <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5">
    {(title || right) && (
      <div className="flex items-start justify-between gap-3 mb-4">
        {title ? (
          <div>
            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
              {title}
            </p>
          </div>
        ) : (
          <div />
        )}
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    )}
    {children}
  </div>
);

Card.propTypes = {
  title: PropTypes.string,
  right: PropTypes.node,
  children: PropTypes.node.isRequired,
};

// ─── RecentSalesPanel ─────────────────────────────────────────────────────────

const RecentSalesPanel = ({ sales, loading }) => {
  if (loading)
    return (
      <div className="space-y-2">
        <Skeleton />
        <Skeleton />
      </div>
    );

  if (!sales?.length)
    return (
      <div className="py-10 text-center">
        <p className="text-3xl mb-2">🧾</p>
        <p className="text-sm font-semibold text-slate-800">Aún no hay ventas hoy</p>
        <p className="text-xs text-slate-500 mt-1">Cuando registres una, aparecerá aquí.</p>
      </div>
    );

  const activeSales = sales.filter((s) => s.status === "ACTIVE");
  const totalToday = activeSales.reduce((a, s) => a + s.total, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
          Hoy ({activeSales.length})
        </p>
        <p className="text-sm font-extrabold text-emerald-700 tabular-nums">
          {formatCRC(totalToday)}
        </p>
      </div>

      {sales.slice(0, 10).map((s) => {
        const pmCfg = PAYMENT_LABELS[s.paymentMethod] || {};
        const isActive = s.status === "ACTIVE";

        return (
          <div
            key={s.id}
            className={[
              "rounded-2xl border px-3 py-3 flex items-center justify-between gap-3 transition-colors",
              isActive ? "border-slate-200 hover:border-slate-300" : "border-slate-100 opacity-60",
            ].join(" ")}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {s.lineItems?.length
                  ? s.lineItems.map((l) => `${l.nameSnapshot} ×${l.quantity}`).join(", ")
                  : "Venta rápida"}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {pmCfg.emoji} {pmCfg.label} · {fmtDatetime(s.createdAt)}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-extrabold text-emerald-700 tabular-nums">
                {formatCRC(s.total)}
              </p>
              <div className="mt-1 flex justify-end">
                <SaleStatusPill status={s.status} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

RecentSalesPanel.propTypes = { sales: PropTypes.array, loading: PropTypes.bool };

// ─── ItemizedLineEditor ───────────────────────────────────────────────────────

const ItemizedLineEditor = ({ lines, onChange }) => {
  const addLine = () =>
    onChange([...lines, { nameSnapshot: "", unitPriceSnapshot: "", quantity: 1 }]);
  const removeLine = (i) => onChange(lines.filter((_, idx) => idx !== i));
  const updateLine = (i, field, value) => {
    const next = lines.map((l, idx) => (idx === i ? { ...l, [field]: value } : l));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {lines.map((line, i) => (
        <div key={i} className="border border-slate-200 rounded-2xl p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
              Producto {i + 1}
            </p>
            {lines.length > 1 && (
              <button
                type="button"
                onClick={() => removeLine(i)}
                className="text-xs font-bold text-red-600 hover:text-red-700"
              >
                Quitar
              </button>
            )}
          </div>

          <input
            value={line.nameSnapshot}
            onChange={(e) => updateLine(i, "nameSnapshot", e.target.value)}
            placeholder="Nombre del producto"
            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Precio unitario
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  ₡
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={line.unitPriceSnapshot}
                  onChange={(e) =>
                    updateLine(i, "unitPriceSnapshot", e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="0"
                  className="w-full border border-slate-300 rounded-xl pl-7 pr-3 py-2.5 text-sm font-extrabold tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Cantidad</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateLine(i, "quantity", Math.max(1, line.quantity - 1))}
                  className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-extrabold flex items-center justify-center active:scale-95 transition-all"
                >
                  −
                </button>

                <span className="min-w-10 text-center text-sm font-extrabold text-slate-900 tabular-nums">
                  {line.quantity}
                </span>

                <button
                  type="button"
                  onClick={() => updateLine(i, "quantity", line.quantity + 1)}
                  className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-extrabold flex items-center justify-center active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {line.nameSnapshot && line.unitPriceSnapshot && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs font-semibold text-slate-500">Subtotal</p>
              <p className="text-sm font-extrabold text-slate-900 tabular-nums">
                {formatCRC(parseCRC(line.unitPriceSnapshot) * line.quantity)}
              </p>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addLine}
        className="w-full py-3 border border-dashed border-slate-300 rounded-2xl text-sm font-extrabold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors"
      >
        + Agregar producto
      </button>
    </div>
  );
};

ItemizedLineEditor.propTypes = { lines: PropTypes.array, onChange: PropTypes.func };

// ─── Main ─────────────────────────────────────────────────────────────────────

const SalesPage = () => {
  const today = todayStr();

  const [mode, setMode] = useState("quick"); // quick | itemized
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [activityId, setActivityId] = useState(null);
  const [lines, setLines] = useState([{ nameSnapshot: "", unitPriceSnapshot: "", quantity: 1 }]);
  const [notice, showNotice] = useNotice();

  const amountRef = useRef(null);

  const { data: activitiesData, loading: activitiesLoading } = useQuery(GET_ACTIVITIES, {
    variables: { onlyActive: true },
  });
  const { data: sessionData } = useQuery(GET_CASH_SESSION_DETAIL, {
    variables: { businessDate: today },
  });
  const {
    data: salesData,
    loading: salesLoading,
    refetch,
  } = useQuery(GET_SALES_BY_DATE, {
    variables: { businessDate: today },
    fetchPolicy: "cache-and-network",
  });

  const session = sessionData?.cashSessionDetail;
  const activities = activitiesData?.activities || [];
  const sales = salesData?.salesByDate || [];

  const [recordSale, { loading }] = useMutation(RECORD_SALE);

  const computedTotal =
    mode === "itemized"
      ? lines.reduce((a, l) => a + parseCRC(l.unitPriceSnapshot) * (l.quantity || 1), 0)
      : parseCRC(amount);

  const handleSubmit = useCallback(async () => {
    if (computedTotal <= 0) return showNotice("error", "El monto debe ser mayor a ₡0.");
    if (!paymentMethod) return showNotice("error", "Seleccioná un método de pago.");

    const input = {
      businessDate: today,
      paymentMethod,
      activityId: activityId || undefined,
      cashSessionId: session?.id || undefined,
      total: computedTotal,
    };

    if (mode === "itemized") {
      const validLines = lines.filter((l) => l.nameSnapshot && parseCRC(l.unitPriceSnapshot) > 0);
      if (validLines.length === 0)
        return showNotice("error", "Agregá al menos un producto con nombre y precio.");
      input.lineItems = validLines.map((l) => ({
        nameSnapshot: l.nameSnapshot,
        unitPriceSnapshot: parseCRC(l.unitPriceSnapshot),
        quantity: l.quantity,
      }));
    }

    try {
      await recordSale({ variables: { input } });
      showNotice("success", `Venta de ${formatCRC(computedTotal)} registrada ✓`);
      setAmount("");
      setLines([{ nameSnapshot: "", unitPriceSnapshot: "", quantity: 1 }]);
      refetch();
      setTimeout(() => amountRef.current?.focus(), 100);
    } catch (e) {
      showNotice("error", e.message || "Error al registrar venta");
    }
  }, [
    computedTotal,
    paymentMethod,
    activityId,
    mode,
    lines,
    session,
    today,
    recordSale,
    refetch,
    showNotice,
  ]);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="page-content space-y-5">
        {/* Header */}
        <FinancePageHeader
          title="Registrar venta"
          backTo="/finance"
          right={
            session?.status === "OPEN" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Caja abierta
              </span>
            ) : null
          }
        />

        {/* Mode switcher — responsive */}
        <div className="w-full sm:w-auto">
          <div className="grid grid-cols-2 gap-2 p-2 bg-slate-100 rounded-2xl">
            {[
              ["quick", "⚡ Venta rápida"],
              ["itemized", "📋 Por productos"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={[
                  "px-3 py-2.5 rounded-xl text-sm font-extrabold transition-all",
                  mode === id
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Form */}
          <div className="space-y-5">
            <Card title="Registro">
              <Notice notice={notice} />

              {/* Activity (optional) */}
              {activities.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">
                    Actividad (opcional)
                  </p>
                  <ActivityPills
                    activities={activities}
                    selected={activityId}
                    onSelect={setActivityId}
                    loading={activitiesLoading}
                  />
                </div>
              )}

              {/* Amount or line items */}
              <div className="mt-5">
                {mode === "quick" ? (
                  <div>
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">
                      Monto
                    </p>
                    <MoneyInput ref={amountRef} value={amount} onChange={setAmount} />
                    <div className="mt-3">
                      <AmountPresets presets={AMOUNT_PRESETS} onSelect={setAmount} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">
                      Productos
                    </p>
                    <ItemizedLineEditor lines={lines} onChange={setLines} />
                    {computedTotal > 0 && (
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500">Total</p>
                        <p className="text-lg font-extrabold text-slate-900 tabular-nums">
                          {formatCRC(computedTotal)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment method */}
              <div className="mt-6">
                <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">
                  Método de pago
                </p>
                <PaymentMethodPills value={paymentMethod} onChange={setPaymentMethod} />
              </div>

              {/* CTA — premium solid */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || computedTotal <= 0}
                className="mt-6 w-full py-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-extrabold text-base disabled:opacity-40 active:scale-[0.98] transition-all shadow-sm"
              >
                {loading
                  ? "Guardando…"
                  : `Guardar venta${computedTotal > 0 ? ` · ${formatCRC(computedTotal)}` : ""}`}
              </button>
            </Card>
          </div>

          {/* Recent sales */}
          <Card title="Ventas de hoy">
            <RecentSalesPanel sales={sales} loading={salesLoading} />
          </Card>
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
};

export default SalesPage;
