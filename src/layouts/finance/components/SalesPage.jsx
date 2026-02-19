/**
 * SalesPage — /finance/sales
 * Registro de ventas ultra-rápido. Dos modos: Venta rápida / Por productos.
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
      <div className="py-8 text-center">
        <p className="text-2xl mb-1">🧾</p>
        <p className="text-xs text-slate-400">Sin ventas hoy todavía.</p>
      </div>
    );

  const activeSales = sales.filter((s) => s.status === "ACTIVE");
  const totalToday = activeSales.reduce((a, s) => a + s.total, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Hoy ({activeSales.length})
        </p>
        <p className="text-sm font-extrabold text-emerald-700">{formatCRC(totalToday)}</p>
      </div>
      {sales.slice(0, 10).map((s) => {
        const pmCfg = PAYMENT_LABELS[s.paymentMethod] || {};
        return (
          <div
            key={s.id}
            className={`border rounded-xl p-3 flex items-center justify-between gap-2 ${
              s.status !== "ACTIVE" ? "opacity-50 border-slate-100" : "border-slate-200"
            }`}
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {s.lineItems?.length
                  ? s.lineItems.map((l) => `${l.nameSnapshot} ×${l.quantity}`).join(", ")
                  : "Venta rápida"}
              </p>
              <p className="text-xs text-slate-400">
                {pmCfg.emoji} {pmCfg.label} · {fmtDatetime(s.createdAt)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-extrabold text-emerald-700">{formatCRC(s.total)}</p>
              <SaleStatusPill status={s.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
    <div className="space-y-2">
      {lines.map((line, i) => (
        <div key={i} className="border border-slate-200 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">Producto {i + 1}</p>
            {lines.length > 1 && (
              <button
                type="button"
                onClick={() => removeLine(i)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Quitar
              </button>
            )}
          </div>
          <input
            value={line.nameSnapshot}
            onChange={(e) => updateLine(i, "nameSnapshot", e.target.value)}
            placeholder="Nombre del producto"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Precio unitario</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
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
                  className="w-full border border-slate-200 rounded-xl pl-5 pr-2 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Cantidad</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateLine(i, "quantity", Math.max(1, line.quantity - 1))}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-bold text-slate-900">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateLine(i, "quantity", line.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          {line.nameSnapshot && line.unitPriceSnapshot && (
            <p className="text-xs text-slate-400 text-right">
              Subtotal:{" "}
              <strong className="text-slate-700">
                {formatCRC(parseCRC(line.unitPriceSnapshot) * line.quantity)}
              </strong>
            </p>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addLine}
        className="w-full py-2.5 border border-dashed border-slate-300 rounded-2xl text-sm font-semibold text-slate-500 hover:border-rose-300 hover:text-rose-600 transition-colors"
      >
        + Agregar producto
      </button>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const SalesPage = () => {
  const navigate = useNavigate();
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

  // Auto-focus on mount
  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="page-content space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate("/finance")}
              className="text-xs text-slate-400 hover:text-slate-600 mb-1 flex items-center gap-1"
            >
              ← Caja
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Registrar venta</h1>
          </div>
          {session?.status === "OPEN" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Caja abierta
            </span>
          )}
        </div>

        {/* Mode switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl self-start">
          {[
            ["quick", "⚡ Venta rápida"],
            ["itemized", "📋 Por productos"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                mode === id
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Form */}
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-5">
              <Notice notice={notice} />

              {/* Activity (optional) */}
              {activities.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
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
              {mode === "quick" ? (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Monto
                  </p>
                  <MoneyInput ref={amountRef} value={amount} onChange={setAmount} />
                  <div className="mt-3">
                    <AmountPresets presets={AMOUNT_PRESETS} onSelect={setAmount} />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Productos
                  </p>
                  <ItemizedLineEditor lines={lines} onChange={setLines} />
                  {computedTotal > 0 && (
                    <p className="text-right text-sm font-extrabold text-slate-900 mt-3">
                      Total: {formatCRC(computedTotal)}
                    </p>
                  )}
                </div>
              )}

              {/* Payment method */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Método de pago
                </p>
                <PaymentMethodPills value={paymentMethod} onChange={setPaymentMethod} />
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || computedTotal <= 0}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base disabled:opacity-40 active:scale-[0.98] transition-all shadow-sm"
              >
                {loading
                  ? "Guardando…"
                  : `Guardar venta ${computedTotal > 0 ? `· ${formatCRC(computedTotal)}` : ""}`}
              </button>
            </div>
          </div>

          {/* Recent sales */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-4">Ventas de hoy</h2>
            <RecentSalesPanel sales={sales} loading={salesLoading} />
          </div>
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
};

export default SalesPage;
RecentSalesPanel.propTypes = { sales: PropTypes.array, loading: PropTypes.bool };
ItemizedLineEditor.propTypes = { lines: PropTypes.array, onChange: PropTypes.func };
