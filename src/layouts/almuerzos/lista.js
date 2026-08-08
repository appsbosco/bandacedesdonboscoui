/* eslint-disable react/prop-types */

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useMutation, useQuery, useLazyQuery } from "@apollo/client";
import PropTypes from "prop-types";

// ─────────────────────────────────────────────
// GraphQL
// ─────────────────────────────────────────────
import {
  GET_ORDERS,
  REPORT_DAY_BREAKDOWN,
  REPORT_PRODUCT_RANGE,
  REPORT_DAILY_SUMMARY,
  REPORT_PAYMENT_SUMMARY,
} from "graphql/queries/orders";
import { COMPLETE_ORDER_MUTATION, RECORD_PICKUP_MUTATION } from "graphql/mutations/orders";

// ─────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────

const crcNumberFormatter = new Intl.NumberFormat("es-CR");
const costaRicaDateInputFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Costa_Rica",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const formatCRC = (v) => `₡${crcNumberFormatter.format(Number.isFinite(v) ? v : 0)}`;

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n) && value.trim() !== "") {
      const d = new Date(n);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && value.$date) return toDate(value.$date);
  return null;
}

const fmtDate = (v, opts) => {
  const d = toDate(v);
  if (!d) return "—";
  return d.toLocaleString("es-CR", opts || { day: "2-digit", month: "short", year: "numeric" });
};

const fmtDateTime = (v) =>
  fmtDate(v, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getFullName = (u) =>
  [u?.name, u?.firstSurName, u?.secondSurName].filter(Boolean).join(" ").trim() || "Sin nombre";

const calcTotal = (order) =>
  (order?.products || []).reduce((a, p) => {
    const price = Number(p?.productId?.price ?? 0);
    const qty = Number(p?.quantity ?? 0);
    return a + price * qty;
  }, 0);

const calcItems = (order) =>
  (order?.products || []).reduce((a, p) => a + Number(p?.quantity ?? 0), 0);

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const productDay = (item) => item?.productId?.availableForDays?.trim() || "Sin día asignado";

const WEEKDAY_INDEX = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

const serviceDateLabelFormatter = new Intl.DateTimeFormat("es-CR", {
  timeZone: "America/Costa_Rica",
  weekday: "long",
  day: "numeric",
  month: "short",
});

const serviceDateForItem = (item, order) => {
  const savedDate = toDate(item?.fulfillmentDate);
  if (savedDate) return costaRicaDateInputFormatter.format(savedDate);

  const orderDate = toDate(order?.orderDate);
  const targetDay = WEEKDAY_INDEX[normalizeText(productDay(item))];
  if (!orderDate || targetDay === undefined) return null;

  const localOrderDate = costaRicaDateInputFormatter.format(orderDate);
  const inferredDate = new Date(`${localOrderDate}T12:00:00.000-06:00`);
  inferredDate.setDate(inferredDate.getDate() + ((targetDay - inferredDate.getDay() + 7) % 7));
  return costaRicaDateInputFormatter.format(inferredDate);
};

const weekRange = (referenceDate) => {
  const base = new Date(`${referenceDate}T12:00:00.000-06:00`);
  const daysSinceMonday = (base.getDay() + 6) % 7;
  const start = new Date(base);
  start.setDate(base.getDate() - daysSinceMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: costaRicaDateInputFormatter.format(start),
    end: costaRicaDateInputFormatter.format(end),
  };
};

const formatServiceDate = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(`${value}T12:00:00.000-06:00`);
  const label = serviceDateLabelFormatter.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const isLunchProduct = (product) => {
  const category = normalizeText(product?.productId?.category);
  const name = normalizeText(product?.productId?.name);
  return category === "almuerzo" || (!category && name.includes("almuerzo"));
};

const summarizeProducts = (orders, dayFilter = null) => {
  const products = new Map();

  orders.forEach((order) => {
    (order.products || []).forEach((item) => {
      if (dayFilter && productDay(item) !== dayFilter) return;
      const product = item?.productId;
      const key = product?.id || product?.name || item?.id;
      if (!key) return;
      const current = products.get(key) || {
        id: key,
        name: product?.name || "Producto",
        category: product?.category || "Otros",
        quantity: 0,
        pickedUp: 0,
        isLunch: isLunchProduct(item),
      };
      current.quantity += Number(item?.quantity ?? 0);
      current.pickedUp += Number(item?.quantityPickedUp ?? 0);
      products.set(key, current);
    });
  });

  const list = [...products.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  return {
    lunches: list.filter((product) => product.isLunch),
    extras: list.filter((product) => !product.isLunch),
  };
};

function today() {
  return costaRicaDateInputFormatter.format(new Date());
}

// ─────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────

function useDebounced(value, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function useNotice() {
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2800);
    return () => clearTimeout(t);
  }, [notice]);
  const show = useCallback((type, message) => setNotice({ type, message }), []);
  return [notice, show];
}

// ─────────────────────────────────────────────
// UI Atoms
// ─────────────────────────────────────────────

const ITEM_STATUS = {
  completed: {
    label: "Retirado",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  partial: { label: "Parcial", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  pending: { label: "Pendiente", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

const ItemStatusPill = ({ status }) => {
  const s = ITEM_STATUS[status] || ITEM_STATUS.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const OrderStatusPill = ({ status }) => {
  const itemStatus = ITEM_STATUS[status] || ITEM_STATUS.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${itemStatus.bg} ${itemStatus.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${itemStatus.dot}`} />
      {itemStatus.label}
    </span>
  );
};

const FilterPill = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap ${
      active
        ? "bg-rose-700 border-rose-700 text-white shadow-sm"
        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
    }`}
  >
    {children}
  </button>
);

const ProgressBar = ({ value, max, color = "bg-rose-600" }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const Skeleton = () => (
  <div className="border border-slate-200 rounded-2xl p-5 animate-pulse space-y-3">
    <div className="h-4 bg-slate-200 rounded w-1/3" />
    <div className="h-3 bg-slate-200 rounded w-1/2" />
    <div className="h-3 bg-slate-200 rounded w-2/3" />
  </div>
);

const Notice = ({ notice }) => {
  if (!notice) return null;
  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm font-semibold border transition-all ${
        notice.type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-red-50 border-red-200 text-red-700"
      }`}
    >
      {notice.message}
    </div>
  );
};

const PAYMENT_METHODS = [
  { id: "sinpe", label: "SINPE", detail: "Transferencia móvil", icon: "📱" },
  { id: "cash", label: "Efectivo", detail: "Pago en el momento", icon: "💵" },
];

const getOrderDayStatus = (order) => {
  const total = calcItems(order);
  const pickedUp = (order?.products || []).reduce(
    (sum, item) => sum + Number(item?.quantityPickedUp || 0),
    0
  );
  if (total > 0 && pickedUp >= total) return "completed";
  if (pickedUp > 0) return "partial";
  return "pending";
};

const summarizeOrderPayments = (order) =>
  (order?.products || []).reduce(
    (summary, item) => {
      (item?.pickupRecords || []).forEach((record) => {
        const method = record?.paymentMethod;
        if (method !== "sinpe" && method !== "cash") return;
        const unitPrice = Number(record?.unitPrice ?? item?.productId?.price ?? 0);
        summary[method] += Number(record?.quantity || 0) * unitPrice;
      });
      return summary;
    },
    { sinpe: 0, cash: 0 }
  );

const PaymentSummaryBadges = ({ payments }) => {
  const entries = [
    { id: "sinpe", label: "SINPE", icon: "📱", amount: payments.sinpe },
    { id: "cash", label: "Efectivo", icon: "💵", amount: payments.cash },
  ].filter((entry) => entry.amount > 0);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Pagos registrados">
      {entries.map((entry) => (
        <span
          key={entry.id}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700"
        >
          <span aria-hidden="true">{entry.icon}</span>
          {entry.label} {formatCRC(entry.amount)}
        </span>
      ))}
    </div>
  );
};

const PaymentMethodPicker = ({ value, onChange, disabled = false }) => (
  <div>
    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
      ¿Cómo hizo el pago?
    </p>
    <div className="grid grid-cols-2 gap-2">
      {PAYMENT_METHODS.map((method) => {
        const selected = value === method.id;
        return (
          <button
            key={method.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(method.id)}
            aria-pressed={selected}
            className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all disabled:opacity-50 ${
              selected
                ? "border-rose-600 bg-rose-50 ring-2 ring-rose-100"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className="text-xl" aria-hidden="true">
              {method.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-900">{method.label}</span>
              <span className="block truncate text-[11px] text-slate-500">{method.detail}</span>
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

const CompleteDayModal = ({ order, lunchDay, displayDay, loading, onClose, onConfirm }) => {
  const [paymentMethod, setPaymentMethod] = useState(null);

  const handlePayment = (method) => {
    setPaymentMethod(method);
    onConfirm(method);
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-day-title"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 pb-4 pt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-rose-700">{displayDay}</p>
          <h3 id="complete-day-title" className="mt-1 text-lg font-bold text-slate-900">
            Completar retiro del día
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {getFullName(order?.userId)} · Solo se completarán los productos de {displayDay}.
          </p>
        </div>
        <div className="space-y-5 p-6">
          <PaymentMethodPicker value={paymentMethod} onChange={handlePayment} disabled={loading} />
          <p className="text-center text-xs text-slate-400">
            {loading ? "Guardando el retiro…" : "Al elegir el método, se guarda de inmediato."}
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// PickupModal
// ─────────────────────────────────────────────

const PickupModal = ({ order, lunchDay, displayDay, onClose, onSuccess }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [notice, showNotice] = useNotice();

  const [recordPickup, { loading }] = useMutation(RECORD_PICKUP_MUTATION, {
    update(cache, { data: { recordPickup: updated } }) {
      cache.modify({
        id: cache.identify({ __typename: "Order", id: updated.id }),
        fields: {
          isCompleted: () => updated.isCompleted,
          products: () => updated.products,
        },
      });
    },
  });

  const pendingItems = (order?.products || []).filter((p) => p.status !== "completed");

  const item = selectedItem ? order.products.find((p) => p.id === selectedItem) : null;

  const maxQty = item ? item.quantity - item.quantityPickedUp : 1;

  const handleSubmit = async () => {
    if (!item) return showNotice("error", "Seleccioná un producto.");
    if (qty < 1 || qty > maxQty)
      return showNotice("error", `Cantidad debe ser entre 1 y ${maxQty}.`);
    if (!paymentMethod) return showNotice("error", "Seleccioná SINPE o efectivo.");

    try {
      await recordPickup({
        variables: {
          orderId: order.id,
          itemId: item.id,
          quantityPickedUp: Number(qty),
          pickedUpAt: new Date().toISOString(),
          lunchDay,
          paymentMethod,
        },
      });
      showNotice("success", "Retiro registrado.");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 900);
    } catch (e) {
      showNotice("error", e.message || "Error al registrar retiro.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pickup-modal-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h3 id="pickup-modal-title" className="text-base font-bold text-slate-900">
              Registrar retiro
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {getFullName(order.userId)} · {displayDay}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar registro de retiro"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          <Notice notice={notice} />

          {/* Item list */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Productos pendientes
            </p>
            {pendingItems.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Todos los items ya fueron retirados.</p>
            ) : (
              <div className="space-y-2">
                {pendingItems.map((p) => {
                  const pending = p.quantity - p.quantityPickedUp;
                  const isSelected = selectedItem === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedItem(p.id);
                        setQty(pending);
                      }}
                      className={`w-full text-left rounded-2xl border p-3.5 transition-all ${
                        isSelected
                          ? "border-rose-500 bg-rose-50/60 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {p.productId?.name || "Producto"}
                        </p>
                        <ItemStatusPill status={p.status} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span>
                          Retirado: <strong className="text-slate-700">{p.quantityPickedUp}</strong>{" "}
                          / {p.quantity}
                        </span>
                        <span className="font-semibold text-rose-600">
                          {pending} pendiente{pending !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <ProgressBar value={p.quantityPickedUp} max={p.quantity} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quantity */}
          {selectedItem && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Cantidad a retirar ahora
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Disminuir cantidad"
                  onClick={() => setQty((v) => Math.max(1, v - 1))}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
                >
                  −
                </button>
                <input
                  aria-label="Cantidad a retirar"
                  type="number"
                  min={1}
                  max={maxQty}
                  value={qty}
                  onChange={(e) => setQty(Math.min(maxQty, Math.max(1, Number(e.target.value))))}
                  className="w-16 text-center border border-slate-200 rounded-xl py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                <button
                  type="button"
                  aria-label="Aumentar cantidad"
                  onClick={() => setQty((v) => Math.min(maxQty, v + 1))}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
                >
                  +
                </button>
                <span className="text-xs text-slate-400">máx. {maxQty}</span>
              </div>
            </div>
          )}

          {selectedItem && (
            <PaymentMethodPicker
              value={paymentMethod}
              onChange={setPaymentMethod}
              disabled={loading}
            />
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !selectedItem || !paymentMethod || pendingItems.length === 0}
            className="w-full py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-rose-700 hover:bg-rose-800 active:scale-[0.98] text-white shadow-sm"
          >
            {loading ? "Registrando…" : "Confirmar retiro"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ProductsDetail (dentro de una orden)
// ─────────────────────────────────────────────

const ProductsDetail = ({ order }) => {
  const products = order?.products || [];
  if (products.length === 0) return <p className="text-sm text-slate-400">Sin productos</p>;

  return (
    <div className="space-y-3">
      {products.map((p, idx) => {
        const name = p?.productId?.name || "Producto";
        const qty = Number(p?.quantity ?? 0);
        const qpu = Number(p?.quantityPickedUp ?? 0);
        const price = Number(p?.productId?.price ?? 0);
        const itemPayments = summarizeOrderPayments({ products: [p] });
        return (
          <div key={p?.id || idx} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
              <ItemStatusPill status={p?.status || "pending"} />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
              <span>
                Pedido: <strong className="text-slate-700">{qty}</strong>
              </span>
              <span>
                Retirado: <strong className="text-slate-700">{qpu}</strong>
              </span>
              <span>
                Pendiente: <strong className="text-rose-600">{qty - qpu}</strong>
              </span>
              <span className="ml-auto font-bold text-slate-700">{formatCRC(qty * price)}</span>
            </div>
            <ProgressBar value={qpu} max={qty} />
            {p?.pickedUpAt && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span>Último retiro: {fmtDateTime(p.pickedUpAt)}</span>
                <PaymentSummaryBadges payments={itemPayments} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const DayPreparationSummary = ({ group }) => {
  const lunchUnits = group.summary.lunches.reduce((total, product) => total + product.quantity, 0);
  const extraUnits = group.summary.extras.reduce((total, product) => total + product.quantity, 0);

  return (
    <div className="mx-4 mb-3 rounded-2xl bg-slate-50 px-3 py-3 sm:mx-5 sm:mb-4 sm:border sm:border-slate-200 sm:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="grid grid-cols-3 divide-x divide-slate-200 shrink-0">
          {[
            ["Pedidos", group.orders.length],
            ["Almuerzos", lunchUnits],
            ["Extras", extraUnits],
          ].map(([name, value]) => (
            <div key={name} className="px-2 text-center sm:px-5 sm:first:pl-0">
              <p className="text-base font-extrabold text-slate-900 sm:text-lg">{value}</p>
              <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">{name}</p>
            </div>
          ))}
        </div>
        <div className="hidden lg:block h-10 w-px bg-slate-200" />
        <div className="hide-scrollbar flex min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none] lg:flex-wrap lg:overflow-visible">
          {[...group.summary.lunches, ...group.summary.extras].map((product) => (
            <div
              key={product.id}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5"
            >
              <span className="text-sm font-semibold text-slate-700">{product.name}</span>
              <span className="text-sm font-extrabold text-slate-900">{product.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Reports Panel
// ─────────────────────────────────────────────

const ReportsPanel = () => {
  const [tab, setTab] = useState("payments");
  const [startDate, setStartDate] = useState(() => today());
  const [endDate, setEndDate] = useState(() => today());
  const [rangeError, setRangeError] = useState(null);

  const vars = { startDate, endDate };

  const [fetchDaily, { data: dailyData, loading: loadDaily, error: dailyError }] = useLazyQuery(
    REPORT_DAILY_SUMMARY,
    { fetchPolicy: "network-only" }
  );
  const [fetchProduct, { data: productData, loading: loadProduct, error: productError }] =
    useLazyQuery(REPORT_PRODUCT_RANGE, { fetchPolicy: "network-only" });
  const [fetchBreakdown, { data: breakdownData, loading: loadBreakdown, error: breakdownError }] =
    useLazyQuery(REPORT_DAY_BREAKDOWN, { fetchPolicy: "network-only" });
  const [fetchPayments, { data: paymentData, loading: loadPayments, error: paymentError }] =
    useLazyQuery(REPORT_PAYMENT_SUMMARY, { fetchPolicy: "network-only" });

  const validate = () => {
    if (!startDate || !endDate) return "Ingresá ambas fechas.";
    if (new Date(startDate) > new Date(endDate)) return "Inicio no puede ser mayor al fin.";
    return null;
  };

  const run = () => {
    const err = validate();
    if (err) {
      setRangeError(err);
      return;
    }
    setRangeError(null);
    if (tab === "payments") fetchPayments({ variables: vars });
    if (tab === "daily") fetchDaily({ variables: vars });
    if (tab === "product") fetchProduct({ variables: vars });
    if (tab === "breakdown") fetchBreakdown({ variables: vars });
  };

  const daily = dailyData?.reportDailySummary || [];
  const products = productData?.reportProductRange || [];
  const breakdown = breakdownData?.reportDayBreakdown || [];
  const paymentReport = paymentData?.reportPaymentSummary;

  const isLoading = loadDaily || loadProduct || loadBreakdown || loadPayments;
  const reportError = paymentError || dailyError || productError || breakdownError;

  return (
    <div className="border border-slate-200 rounded-3xl bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Reportes de almuerzos</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cierre de ingresos y control de preparación
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex gap-2 flex-1 flex-wrap">
            <div className="flex flex-col gap-1">
              <label htmlFor="report-start-date" className="text-xs font-semibold text-slate-500">
                Desde
              </label>
              <input
                id="report-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="report-end-date" className="text-xs font-semibold text-slate-500">
                Hasta
              </label>
              <input
                id="report-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const currentDay = today();
                setStartDate(currentDay);
                setEndDate(currentDay);
              }}
              className="self-end rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Hoy
            </button>
          </div>
          <button
            type="button"
            onClick={run}
            disabled={isLoading}
            className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-sm font-bold transition-all disabled:opacity-50 active:scale-95"
          >
            {isLoading ? "Cargando…" : "Generar"}
          </button>
        </div>
        {rangeError && <p className="text-xs text-red-600 mt-2 font-semibold">{rangeError}</p>}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        {[
          { id: "payments", label: "Ingresos" },
          { id: "daily", label: "Por día" },
          { id: "product", label: "Por producto" },
          { id: "breakdown", label: "Desglose" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? "border-rose-600 text-rose-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton />
            <Skeleton />
          </div>
        )}

        {!isLoading && reportError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-bold text-red-700">No se pudo generar el reporte</p>
            <p className="mt-1 text-xs text-red-600">{reportError.message}</p>
          </div>
        )}

        {/* Payment Summary */}
        {!isLoading &&
          !reportError &&
          tab === "payments" &&
          (!paymentReport ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Elegí el día o rango y generá el cierre de ingresos.
            </p>
          ) : paymentReport.totalAmount === 0 ? (
            <div className="py-10 text-center">
              <p className="text-base font-bold text-slate-700">No hay pagos registrados</p>
              <p className="mt-1 text-sm text-slate-400">
                No se encontraron retiros cobrados en este período.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Total ingresado",
                    value: paymentReport.totalAmount,
                    detail: `${paymentReport.totalUnits} unidades cobradas`,
                    tone: "bg-slate-900 text-white",
                  },
                  {
                    label: "SINPE",
                    value: paymentReport.sinpeAmount,
                    detail: "Transferencias recibidas",
                    tone: "border border-blue-200 bg-blue-50 text-blue-950",
                  },
                  {
                    label: "Efectivo",
                    value: paymentReport.cashAmount,
                    detail: "Dinero en caja",
                    tone: "border border-emerald-200 bg-emerald-50 text-emerald-950",
                  },
                ].map((summary) => (
                  <div key={summary.label} className={`rounded-2xl p-4 ${summary.tone}`}>
                    <p className="text-xs font-bold uppercase tracking-wide opacity-70">
                      {summary.label}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight">
                      {formatCRC(summary.value)}
                    </p>
                    <p className="mt-1 text-xs opacity-65">{summary.detail}</p>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Ingresos por producto</h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Unidades retiradas y forma de pago
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {paymentReport.byProduct.length} productos
                  </span>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        {["Producto", "Unidades", "SINPE", "Efectivo", "Total"].map((header) => (
                          <th
                            key={header}
                            className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {paymentReport.byProduct.map((product) => (
                        <tr key={product.productId} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-bold text-slate-800">
                            {product.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{product.units}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-blue-700">
                            {formatCRC(product.sinpeAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-emerald-700">
                            {formatCRC(product.cashAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm font-extrabold text-slate-900">
                            {formatCRC(product.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {paymentReport.byDay.length > 1 && (
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-900">Cierre por día</h3>
                  <div className="space-y-2">
                    {paymentReport.byDay.map((day) => (
                      <div
                        key={day.date}
                        className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 px-4 py-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-6"
                      >
                        <p className="col-span-2 text-sm font-bold text-slate-800 sm:col-span-1">
                          {day.date}
                        </p>
                        <p className="text-xs text-slate-500">
                          SINPE{" "}
                          <strong className="block text-sm text-blue-700">
                            {formatCRC(day.sinpeAmount)}
                          </strong>
                        </p>
                        <p className="text-xs text-slate-500">
                          Efectivo{" "}
                          <strong className="block text-sm text-emerald-700">
                            {formatCRC(day.cashAmount)}
                          </strong>
                        </p>
                        <p className="col-span-2 text-right text-sm font-extrabold text-slate-900 sm:col-span-1">
                          {formatCRC(day.totalAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

        {/* Daily Summary */}
        {!isLoading &&
          !reportError &&
          tab === "daily" &&
          (daily.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Generá el reporte para ver datos.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Fecha",
                      "Órdenes",
                      "Items",
                      "Unidades totales",
                      "Retiradas",
                      "Pendientes",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {daily.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{row.date}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.totalOrders}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.totalItems}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.totalUnits}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-emerald-700">
                          {row.pickedUpUnits}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-bold ${
                            row.pendingUnits > 0 ? "text-rose-600" : "text-slate-400"
                          }`}
                        >
                          {row.pendingUnits}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {/* Product Range */}
        {!isLoading &&
          !reportError &&
          tab === "product" &&
          (products.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Generá el reporte para ver datos.
            </p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.productId} className="border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-900">{p.name}</p>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        p.totalPending > 0
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {p.totalPending > 0 ? `${p.totalPending} pendientes` : "Todo retirado"}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500 mb-2">
                    <span>
                      Pedido: <strong className="text-slate-700">{p.totalOrdered}</strong>
                    </span>
                    <span>
                      Retirado: <strong className="text-emerald-700">{p.totalPickedUp}</strong>
                    </span>
                    <span>
                      Pendiente: <strong className="text-rose-600">{p.totalPending}</strong>
                    </span>
                  </div>
                  <ProgressBar
                    value={p.totalPickedUp}
                    max={p.totalOrdered}
                    color="bg-emerald-500"
                  />
                </div>
              ))}
            </div>
          ))}

        {/* Day Breakdown */}
        {!isLoading &&
          !reportError &&
          tab === "breakdown" &&
          (breakdown.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Generá el reporte para ver datos.
            </p>
          ) : (
            <div className="space-y-6">
              {breakdown.map((day) => (
                <div key={day.date}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {day.date}
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-xs text-slate-400">
                      {day.products.length} producto{day.products.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {day.products.map((p) => (
                      <div
                        key={p.productId}
                        className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-slate-800 mb-1">{p.name}</p>
                        <div className="flex gap-3 text-xs text-slate-500">
                          <span>
                            Total: <strong className="text-slate-700">{p.totalOrdered}</strong>
                          </span>
                          <span>
                            ✓ <strong className="text-emerald-700">{p.totalPickedUp}</strong>
                          </span>
                          <span>
                            ⏳ <strong className="text-rose-600">{p.totalPending}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
};

const OrderMobileCard = ({ order, isOpen, isBusy, onToggle, onPickup, onComplete }) => {
  const pickedUp = (order.products || []).reduce(
    (sum, item) => sum + Number(item.quantityPickedUp || 0),
    0
  );
  const status = getOrderDayStatus(order);
  const hasPending = status !== "completed";
  const payments = summarizeOrderPayments(order);

  return (
    <article
      className={`mx-4 overflow-hidden rounded-2xl border bg-white shadow-sm ${
        status === "completed" ? "border-emerald-200" : "border-slate-200"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-extrabold text-slate-900">{order.__name}</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              #{String(order.id).slice(0, 8)} · {fmtDateTime(order.orderDate)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <OrderStatusPill status={status} />
            <p className="mt-2 text-lg font-extrabold text-slate-950">{formatCRC(order.__total)}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(order.products || []).map((item) => (
            <span
              key={item.id}
              className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
            >
              {item.quantity}× {item.productId?.name || "Producto"}
            </span>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">
              {status === "completed"
                ? "Retiro completo"
                : `${pickedUp} de ${order.__items} retiradas`}
            </span>
            {status !== "completed" && (
              <span className="font-bold text-rose-700">{order.__items - pickedUp} pendientes</span>
            )}
          </div>
          <ProgressBar
            value={pickedUp}
            max={order.__items}
            color={status === "completed" ? "bg-emerald-500" : "bg-rose-600"}
          />
        </div>

        {(payments.sinpe > 0 || payments.cash > 0) && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Pago registrado
            </span>
            <PaymentSummaryBadges payments={payments} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/70 p-3">
        <button
          type="button"
          onClick={onToggle}
          className={`min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 ${
            !hasPending ? "col-span-2" : ""
          }`}
        >
          {isOpen ? "Ocultar detalle" : "Ver detalle"}
        </button>
        {hasPending && (
          <button
            type="button"
            onClick={onPickup}
            className="min-h-[44px] rounded-xl bg-slate-800 px-3 text-sm font-bold text-white transition-colors hover:bg-slate-900"
          >
            Retiro parcial
          </button>
        )}
        {hasPending && (
          <button
            type="button"
            onClick={onComplete}
            disabled={isBusy}
            className="col-span-2 min-h-[46px] rounded-xl bg-rose-700 px-4 text-sm font-extrabold text-white transition-colors hover:bg-rose-800 disabled:opacity-50"
          >
            {isBusy ? "Guardando…" : `Completar las ${order.__items - pickedUp} pendientes`}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="border-t border-slate-100 bg-white p-4">
          <ProductsDetail order={order} />
        </div>
      )}
    </article>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

const ListaAlmuerzos = () => {
  const { loading, error, data } = useQuery(GET_ORDERS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const [expandedId, setExpandedId] = useState(null);
  const [pickupOrderId, setPickupOrderId] = useState(null);
  const [completeOrderId, setCompleteOrderId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("orders"); // orders | reports
  const [selectedLunchDay, setSelectedLunchDay] = useState("");
  const [weekReferenceDate, setWeekReferenceDate] = useState(() => today());
  const debouncedSearch = useDebounced(search, 180);
  const [notice, showNotice] = useNotice();
  const [completingId, setCompletingId] = useState(null);

  const [completeOrder] = useMutation(COMPLETE_ORDER_MUTATION, {
    update(cache, { data: { completeOrder: completed } }) {
      cache.modify({
        id: cache.identify({ __typename: "Order", id: completed.id }),
        fields: {
          isCompleted: () => completed.isCompleted,
          products: () => completed.products,
        },
      });
    },
  });

  const ordersRaw = useMemo(() => data?.orders || [], [data?.orders]);

  const enriched = useMemo(
    () =>
      ordersRaw.map((o) => ({
        ...o,
        __total: calcTotal(o),
        __items: calcItems(o),
        __name: getFullName(o?.userId),
        __dateMs: toDate(o?.orderDate)?.getTime() || 0,
      })),
    [ordersRaw]
  );

  const orders = useMemo(() => {
    let list = enriched;

    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          String(o?.id || "")
            .toLowerCase()
            .includes(q) || o.__name.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === "newest") return b.__dateMs - a.__dateMs;
      if (sortBy === "oldest") return a.__dateMs - b.__dateMs;
      if (sortBy === "total_desc") return b.__total - a.__total;
      if (sortBy === "total_asc") return a.__total - b.__total;
      return 0;
    });
  }, [enriched, sortBy, debouncedSearch]);

  const preparationGroups = useMemo(() => {
    const groups = new Map();
    const range = weekRange(weekReferenceDate);
    orders.forEach((order) => {
      (order.products || []).forEach((item) => {
        const serviceDate = serviceDateForItem(item, order);
        if (!serviceDate || serviceDate < range.start || serviceDate > range.end) return;
        if (!groups.has(serviceDate)) groups.set(serviceDate, new Map());
        const dayOrders = groups.get(serviceDate);
        const groupedOrder = dayOrders.get(order.id) || { ...order, products: [] };
        groupedOrder.products.push(item);
        dayOrders.set(order.id, groupedOrder);
      });
    });

    return [...groups.entries()]
      .map(([key, groupedOrders]) => {
        const dayOrders = [...groupedOrders.values()];
        return {
          key,
          orders: dayOrders,
          summary: summarizeProducts(dayOrders),
        };
      })
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [orders, weekReferenceDate]);

  const activeLunchDay =
    preparationGroups.some((group) => group.key === selectedLunchDay) && selectedLunchDay
      ? selectedLunchDay
      : preparationGroups[0]?.key || "";
  const selectedPreparationGroup = preparationGroups.find((group) => group.key === activeLunchDay);
  const activeLunchDayName = selectedPreparationGroup?.orders?.[0]?.products?.[0]
    ? productDay(selectedPreparationGroup.orders[0].products[0])
    : "";
  const activeLunchDayLabel = activeLunchDay ? formatServiceDate(activeLunchDay) : "esta semana";
  const lunchDayOrders = (selectedPreparationGroup?.orders || []).map((order) => {
    const dayOrder = order;
    return {
      ...dayOrder,
      isCompleted:
        dayOrder.products.length > 0 &&
        dayOrder.products.every((item) => item.status === "completed"),
      __items: calcItems(dayOrder),
      __total: calcTotal(dayOrder),
    };
  });
  const visibleLunchDayOrders = lunchDayOrders.filter((order) => {
    if (filterStatus === "all") return true;
    return getOrderDayStatus(order) === filterStatus;
  });

  const stats = useMemo(() => {
    const weekOrderMap = new Map();
    preparationGroups.forEach((group) => {
      group.orders.forEach((order) => {
        const current = weekOrderMap.get(order.id) || { ...order, products: [] };
        current.products.push(...order.products);
        weekOrderMap.set(order.id, current);
      });
    });
    const weekOrders = [...weekOrderMap.values()];
    const total = weekOrders.length;
    const completed = weekOrders.filter(
      (order) =>
        order.products.length > 0 && order.products.every((item) => item.status === "completed")
    ).length;
    const partial = weekOrders.filter((order) => getOrderDayStatus(order) === "partial").length;
    const pending = total - completed;
    const amount = weekOrders.reduce((sum, order) => sum + calcTotal(order), 0);
    return { total, completed, partial, pending, amount };
  }, [preparationGroups]);

  const toggleExpand = useCallback((id) => {
    setExpandedId((p) => (p === id ? null : id));
  }, []);

  const onComplete = useCallback(
    async (orderId, paymentMethod) => {
      try {
        setCompletingId(orderId);
        await completeOrder({
          variables: { orderId, lunchDay: activeLunchDayName, paymentMethod },
        });
        setCompleteOrderId(null);
        showNotice("success", `Retiro de ${activeLunchDayLabel} completado.`);
      } catch (e) {
        console.error(e);
        showNotice("error", "No se pudo completar la orden.");
      } finally {
        setCompletingId(null);
      }
    },
    [activeLunchDayLabel, activeLunchDayName, completeOrder, showNotice]
  );

  const pickupOrder = pickupOrderId
    ? lunchDayOrders.find((order) => order.id === pickupOrderId)
    : null;
  const completionOrder = completeOrderId
    ? lunchDayOrders.find((order) => order.id === completeOrderId)
    : null;

  return (
    <DashboardLayout>
      <DashboardNavbar />

      {/* Pickup Modal */}
      {pickupOrder && (
        <PickupModal
          order={pickupOrder}
          lunchDay={activeLunchDayName}
          displayDay={activeLunchDayLabel}
          onClose={() => setPickupOrderId(null)}
          onSuccess={() => showNotice("success", "Retiro registrado correctamente.")}
        />
      )}

      {completionOrder && (
        <CompleteDayModal
          order={completionOrder}
          lunchDay={activeLunchDayName}
          displayDay={activeLunchDayLabel}
          loading={completingId === completionOrder.id}
          onClose={() => setCompleteOrderId(null)}
          onConfirm={(paymentMethod) => onComplete(completionOrder.id, paymentMethod)}
        />
      )}

      <div className="page-content space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-3 pt-2 sm:items-end">
          <div className="px-1 py-2 sm:mt-1 sm:p-4">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pedidos</h1>
            <p className="mt-1 hidden text-sm text-slate-500 sm:block">
              Gestioná retiros parciales y consultá reportes de preparación.
            </p>
          </div>
          {/* Tab switcher */}
          <div className="flex shrink-0 items-center gap-1 self-start rounded-full bg-slate-100 p-1 sm:self-auto sm:rounded-2xl">
            {[
              { id: "orders", label: "Historial" },
              { id: "reports", label: "Reportes" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition-[background-color,color,box-shadow] sm:rounded-xl sm:px-4 sm:text-sm ${
                  activeTab === t.id
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        {activeTab === "orders" && (
          <>
            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white md:hidden">
              {[
                { label: "Pedidos", value: stats.total },
                { label: "Pendientes", value: stats.pending },
                { label: "Total", value: formatCRC(stats.amount) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-0 border-r border-slate-100 px-2 py-3 text-center last:border-r-0"
                >
                  <p className="truncate text-base font-extrabold text-slate-950">{stat.value}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="hidden grid-cols-2 gap-4 md:grid lg:grid-cols-4">
            {[
              { label: "Total pedidos", value: stats.total, sub: "Todos los estados" },
              { label: "Monto total", value: formatCRC(stats.amount), sub: "Suma de órdenes" },
              {
                label: "Completadas",
                value: stats.completed,
                sub: `${
                  stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
                }% del total`,
              },
              {
                label: "Retiro parcial",
                value: stats.partial,
                sub: "En progreso",
              },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-xs font-semibold text-slate-500 mb-1">{s.label}</p>
                <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
              </div>
            ))}
            </div>
          </>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && <ReportsPanel />}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="overflow-hidden border-y border-slate-200 bg-white sm:rounded-3xl sm:border">
            {/* Sticky controls */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100">
              <div className="space-y-3 px-4 py-3 sm:px-5 sm:py-4">
                <Notice notice={notice} />

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    <span className="font-bold text-slate-900">
                      {visibleLunchDayOrders.length}
                    </span>{" "}
                    pedidos
                  </p>
                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                      Orden:
                    </span>
                    <select
                      aria-label="Ordenar pedidos"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="border border-slate-200 rounded-full px-4 py-2 text-sm bg-white focus:outline-none"
                    >
                      <option value="newest">Más recientes</option>
                      <option value="oldest">Más antiguos</option>
                      <option value="total_desc">Total: mayor → menor</option>
                      <option value="total_asc">Total: menor → mayor</option>
                    </select>
                  </div>
                  <details className="relative sm:hidden">
                    <summary className="cursor-pointer list-none rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                      Ordenar
                    </summary>
                    <div className="absolute right-0 top-11 z-30 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                      <select
                        aria-label="Ordenar pedidos"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm focus:outline-none"
                      >
                        <option value="newest">Más recientes</option>
                        <option value="oldest">Más antiguos</option>
                        <option value="total_desc">Mayor total</option>
                        <option value="total_asc">Menor total</option>
                      </select>
                    </div>
                  </details>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                  {[
                    { id: "all", label: "Todos" },
                    { id: "pending", label: "Pendientes" },
                    { id: "partial", label: "Parciales" },
                    { id: "completed", label: "Completadas" },
                  ].map((f) => (
                    <FilterPill
                      key={f.id}
                      active={filterStatus === f.id}
                      onClick={() => setFilterStatus(f.id)}
                    >
                      {f.label}
                    </FilterPill>
                  ))}
                  {(filterStatus !== "all" || search) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterStatus("all");
                        setSearch("");
                        setSortBy("newest");
                      }}
                      className="ml-auto px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 border border-slate-200 hover:bg-slate-200 whitespace-nowrap"
                    >
                      Resetear
                    </button>
                  )}
                </div>

              </div>
            </div>

            {!loading && !error && orders.length > 0 && (
              <div className="border-b border-slate-200 bg-white">
                <div
                  className="grid grid-cols-2 items-end gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(220px,1fr)_minmax(200px,0.8fr)_minmax(220px,0.9fr)] lg:gap-4"
                >
                  <div className="hidden min-w-0 lg:block">
                    <p className="text-base font-bold text-slate-900 whitespace-nowrap">
                      Resumen para preparar
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Elegí el día del almuerzo para filtrar el listado.
                    </p>
                  </div>
                  <div className="min-w-0">
                    <label
                      htmlFor="lunch-week-filter"
                      className="mb-1.5 block truncate text-[11px] font-bold text-slate-600 sm:text-xs"
                    >
                      Semana
                    </label>
                    <input
                      id="lunch-week-filter"
                      type="date"
                      value={weekReferenceDate}
                      onChange={(event) => {
                        setWeekReferenceDate(event.target.value);
                        setSelectedLunchDay("");
                      }}
                      className="block h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                  </div>
                  <div className="min-w-0">
                    <label
                      htmlFor="lunch-day-filter"
                      className="mb-1.5 block truncate text-[11px] font-bold text-slate-600 sm:text-xs"
                    >
                      Entrega
                    </label>
                    <div className="relative">
                      <select
                        id="lunch-day-filter"
                        value={activeLunchDay}
                        onChange={(event) => setSelectedLunchDay(event.target.value)}
                        aria-label="Filtrar pedidos por día del almuerzo"
                        className="block w-full text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        style={{
                          appearance: "none",
                          WebkitAppearance: "none",
                          width: "100%",
                          height: "44px",
                          padding: "0 44px 0 14px",
                          border: "1px solid rgb(203 213 225)",
                          borderRadius: "12px",
                          backgroundColor: "rgb(248 250 252)",
                          cursor: "pointer",
                        }}
                      >
                        {preparationGroups.map((group) => (
                          <option key={group.key} value={group.key}>
                            {formatServiceDate(group.key)}
                          </option>
                        ))}
                      </select>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                        style={{ fontSize: "14px" }}
                      >
                        ▼
                      </span>
                    </div>
                  </div>
                </div>

                {selectedPreparationGroup && (
                  <DayPreparationSummary group={selectedPreparationGroup} />
                )}

                <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
                  <label
                    htmlFor="order-person-search"
                    className="mb-1.5 block text-xs font-bold text-slate-600"
                  >
                    Buscar persona
                  </label>
                  <div className="relative">
                    <input
                      id="order-person-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Nombre, apellido o ID…"
                      className="block h-11 w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-20 text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      ⌕
                    </span>
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="p-5 space-y-3">
                <Skeleton />
                <Skeleton />
                <Skeleton />
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="m-5 border border-red-200 bg-red-50 rounded-2xl p-5">
                <p className="font-semibold text-red-700">Error al cargar pedidos</p>
                <p className="text-sm text-red-500 mt-1">{error.message}</p>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && visibleLunchDayOrders.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-base font-semibold text-slate-600">Sin resultados</p>
                <p className="text-sm text-slate-400 mt-1">
                  No hay pedidos de {activeLunchDayLabel || "esta semana"} con estos filtros.
                </p>
              </div>
            )}

            {/* MOBILE CARDS */}
            {!loading && !error && visibleLunchDayOrders.length > 0 && (
              <div className="md:hidden py-4 space-y-3">
                {visibleLunchDayOrders.map((order) => {
                  const isOpen = expandedId === order.id;
                  const isBusy = completingId === order.id;

                  return (
                    <OrderMobileCard
                      key={order.id}
                      order={order}
                      isOpen={isOpen}
                      isBusy={isBusy}
                      onToggle={() => toggleExpand(order.id)}
                      onPickup={() => setPickupOrderId(order.id)}
                      onComplete={() => setCompleteOrderId(order.id)}
                    />
                  );
                })}
              </div>
            )}

            {/* DESKTOP TABLE */}
            {!loading && !error && visibleLunchDayOrders.length > 0 && (
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Estado", "Cliente", "Fecha", "Progreso retiro", "Total", "Acciones"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {visibleLunchDayOrders.map((order) => {
                      const isOpen = expandedId === order.id;
                      const isBusy = completingId === order.id;
                      const pickedUp =
                        order.products?.reduce((a, p) => a + (p.quantityPickedUp || 0), 0) || 0;
                      const hasPending = order.products?.some((p) => p.status !== "completed");
                      const status = getOrderDayStatus(order);
                      const payments = summarizeOrderPayments(order);

                      return (
                        <React.Fragment key={order.id}>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <OrderStatusPill status={status} />
                                <button
                                  onClick={() => toggleExpand(order.id)}
                                  className="text-xs font-semibold text-rose-700 hover:text-rose-800 hover:underline"
                                >
                                  {isOpen ? "Ocultar" : "Detalles"}
                                </button>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm font-semibold text-slate-800">{order.__name}</p>
                              <p className="text-xs text-slate-400">
                                #{String(order.id).slice(0, 8)}
                              </p>
                            </td>

                            <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">
                              {fmtDateTime(order.orderDate)}
                            </td>

                            <td className="px-5 py-4 min-w-[160px]">
                              <div className="space-y-1">
                                <ProgressBar value={pickedUp} max={order.__items} />
                                <p className="text-xs text-slate-400">
                                  {pickedUp} / {order.__items} unidades
                                </p>
                                <PaymentSummaryBadges payments={payments} />
                              </div>
                            </td>

                            <td className="px-5 py-4 whitespace-nowrap text-sm font-extrabold text-slate-900">
                              {formatCRC(order.__total)}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 justify-end">
                                {hasPending && (
                                  <button
                                    onClick={() => setPickupOrderId(order.id)}
                                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors"
                                  >
                                    Registrar retiro
                                  </button>
                                )}
                                {!order.isCompleted ? (
                                  <button
                                    onClick={() => setCompleteOrderId(order.id)}
                                    disabled={isBusy}
                                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50 transition-colors active:scale-95"
                                  >
                                    {isBusy ? "…" : "Completar todo"}
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-300">—</span>
                                )}
                              </div>
                            </td>
                          </tr>

                          {isOpen && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={6} className="px-5 pb-5">
                                <div className="mt-2 border border-slate-100 rounded-2xl bg-white p-5">
                                  <div className="flex items-center justify-between mb-4">
                                    <div>
                                      <p className="text-sm font-bold text-slate-900">
                                        Pedido #{String(order.id).slice(0, 8)}
                                      </p>
                                      {order.fulfillmentDate && (
                                        <p className="text-xs text-slate-400 mt-0.5">
                                          Retiro planificado: {fmtDate(order.fulfillmentDate)}
                                        </p>
                                      )}
                                    </div>
                                    <p className="text-sm font-extrabold text-slate-900">
                                      {formatCRC(order.__total)}
                                    </p>
                                  </div>
                                  <ProductsDetail order={order} />
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </DashboardLayout>
  );
};

export default ListaAlmuerzos;

// ─────────────────────────────────────────────
// PropTypes
// ─────────────────────────────────────────────

ItemStatusPill.propTypes = { status: PropTypes.string };
OrderStatusPill.propTypes = { status: PropTypes.string };
PaymentSummaryBadges.propTypes = {
  payments: PropTypes.shape({ sinpe: PropTypes.number, cash: PropTypes.number }).isRequired,
};
ProgressBar.propTypes = { value: PropTypes.number, max: PropTypes.number, color: PropTypes.string };
FilterPill.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
Notice.propTypes = {
  notice: PropTypes.shape({ type: PropTypes.string, message: PropTypes.string }),
};

const ProductShape = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string,
  price: PropTypes.number,
  category: PropTypes.string,
  availableForDays: PropTypes.string,
});

const ProductSummaryShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  category: PropTypes.string,
  quantity: PropTypes.number.isRequired,
  pickedUp: PropTypes.number.isRequired,
  isLunch: PropTypes.bool.isRequired,
});

const OrderItemShape = PropTypes.shape({
  id: PropTypes.string,
  quantity: PropTypes.number,
  quantityPickedUp: PropTypes.number,
  status: PropTypes.string,
  pickedUpAt: PropTypes.string,
  fulfillmentDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
  pickupRecords: PropTypes.arrayOf(
    PropTypes.shape({
      quantity: PropTypes.number,
      paymentMethod: PropTypes.string,
      unitPrice: PropTypes.number,
      pickedUpAt: PropTypes.string,
    })
  ),
  productId: ProductShape,
});

const UserShape = PropTypes.shape({
  name: PropTypes.string,
  firstSurName: PropTypes.string,
  secondSurName: PropTypes.string,
});

const OrderShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  isCompleted: PropTypes.bool,
  orderDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
  fulfillmentDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
  userId: UserShape,
  products: PropTypes.arrayOf(OrderItemShape),
});

ProductsDetail.propTypes = { order: OrderShape.isRequired };
DayPreparationSummary.propTypes = {
  group: PropTypes.shape({
    key: PropTypes.string.isRequired,
    orders: PropTypes.arrayOf(OrderShape).isRequired,
    summary: PropTypes.shape({
      lunches: PropTypes.arrayOf(ProductSummaryShape).isRequired,
      extras: PropTypes.arrayOf(ProductSummaryShape).isRequired,
    }).isRequired,
  }).isRequired,
};
PickupModal.propTypes = {
  order: OrderShape.isRequired,
  lunchDay: PropTypes.string.isRequired,
  displayDay: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};
OrderMobileCard.propTypes = {
  order: OrderShape.isRequired,
  isOpen: PropTypes.bool.isRequired,
  isBusy: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onPickup: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
};
