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
} from "graphql/queries/orders";
import { COMPLETE_ORDER_MUTATION, RECORD_PICKUP_MUTATION } from "graphql/mutations/orders";

// ─────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────

const formatCRC = (v) => `₡${new Intl.NumberFormat("es-CR").format(Number.isFinite(v) ? v : 0)}`;

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

function today() {
  return new Date().toISOString().slice(0, 10);
}

function weekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
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

const OrderStatusPill = ({ isCompleted }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
      isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "bg-emerald-500" : "bg-amber-500"}`}
    />
    {isCompleted ? "Completada" : "Pendiente"}
  </span>
);

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

// ─────────────────────────────────────────────
// PickupModal
// ─────────────────────────────────────────────

const PickupModal = ({ order, onClose, onSuccess }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [qty, setQty] = useState(1);
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

    try {
      await recordPickup({
        variables: {
          orderId: order.id,
          itemId: item.id,
          quantityPickedUp: Number(qty),
          pickedUpAt: new Date().toISOString(),
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Registrar retiro</h3>
            <p className="text-xs text-slate-500 mt-0.5">{getFullName(order.userId)}</p>
          </div>
          <button
            onClick={onClose}
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
                  onClick={() => setQty((v) => Math.max(1, v - 1))}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxQty}
                  value={qty}
                  onChange={(e) => setQty(Math.min(maxQty, Math.max(1, Number(e.target.value))))}
                  className="w-16 text-center border border-slate-200 rounded-xl py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                <button
                  type="button"
                  onClick={() => setQty((v) => Math.min(maxQty, v + 1))}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
                >
                  +
                </button>
                <span className="text-xs text-slate-400">máx. {maxQty}</span>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !selectedItem || pendingItems.length === 0}
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
              <p className="text-xs text-slate-400 mt-1.5">
                Último retiro: {fmtDateTime(p.pickedUpAt)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// Reports Panel
// ─────────────────────────────────────────────

const ReportsPanel = () => {
  const [tab, setTab] = useState("daily");
  const [startDate, setStartDate] = useState(weekAgo());
  const [endDate, setEndDate] = useState(today());
  const [rangeError, setRangeError] = useState(null);

  const vars = { startDate, endDate };

  const [fetchDaily, { data: dailyData, loading: loadDaily }] = useLazyQuery(REPORT_DAILY_SUMMARY, {
    fetchPolicy: "network-only",
  });
  const [fetchProduct, { data: productData, loading: loadProduct }] = useLazyQuery(
    REPORT_PRODUCT_RANGE,
    { fetchPolicy: "network-only" }
  );
  const [fetchBreakdown, { data: breakdownData, loading: loadBreakdown }] = useLazyQuery(
    REPORT_DAY_BREAKDOWN,
    { fetchPolicy: "network-only" }
  );

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
    if (tab === "daily") fetchDaily({ variables: vars });
    if (tab === "product") fetchProduct({ variables: vars });
    if (tab === "breakdown") fetchBreakdown({ variables: vars });
  };

  const daily = dailyData?.reportDailySummary || [];
  const products = productData?.reportProductRange || [];
  const breakdown = breakdownData?.reportDayBreakdown || [];

  const isLoading = loadDaily || loadProduct || loadBreakdown;

  return (
    <div className="border border-slate-200 rounded-3xl bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Reportes de preparación</h2>
          <p className="text-xs text-slate-400 mt-0.5">Cuánto preparar por día y por producto</p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex gap-2 flex-1 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Desde</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Hasta</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
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

        {/* Daily Summary */}
        {!isLoading &&
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
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("orders"); // orders | reports
  const debouncedSearch = useDebounced(search, 180);
  const [notice, showNotice] = useNotice();
  const [completingId, setCompletingId] = useState(null);

  const [completeOrder] = useMutation(COMPLETE_ORDER_MUTATION, {
    update(cache, { data: { completeOrder: completed } }) {
      cache.modify({
        id: cache.identify({ __typename: "Order", id: completed.id }),
        fields: {
          isCompleted: () => true,
          products: () => completed.products,
        },
      });
    },
  });

  const ordersRaw = data?.orders || [];

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
    if (filterStatus === "completed") list = list.filter((o) => o.isCompleted);
    if (filterStatus === "pending") list = list.filter((o) => !o.isCompleted);
    if (filterStatus === "partial")
      list = list.filter((o) => !o.isCompleted && o.products?.some((p) => p.status === "partial"));

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
  }, [enriched, filterStatus, sortBy, debouncedSearch]);

  const stats = useMemo(() => {
    const total = ordersRaw.length;
    const completed = ordersRaw.filter((o) => o.isCompleted).length;
    const partial = ordersRaw.filter(
      (o) => !o.isCompleted && o.products?.some((p) => p.status === "partial")
    ).length;
    const pending = total - completed;
    const amount = ordersRaw.reduce((a, o) => a + calcTotal(o), 0);
    return { total, completed, partial, pending, amount };
  }, [ordersRaw]);

  const toggleExpand = useCallback((id) => {
    setExpandedId((p) => (p === id ? null : id));
  }, []);

  const onComplete = useCallback(
    async (orderId) => {
      try {
        setCompletingId(orderId);
        await completeOrder({
          variables: { orderId },
          optimisticResponse: {
            completeOrder: { __typename: "Order", id: orderId, isCompleted: true, products: [] },
          },
        });
        showNotice("success", "Orden marcada como completada.");
      } catch (e) {
        console.error(e);
        showNotice("error", "No se pudo completar la orden.");
      } finally {
        setCompletingId(null);
      }
    },
    [completeOrder, showNotice]
  );

  const pickupOrder = pickupOrderId ? ordersRaw.find((o) => o.id === pickupOrderId) : null;

  return (
    <DashboardLayout>
      <DashboardNavbar />

      {/* Pickup Modal */}
      {pickupOrder && (
        <PickupModal
          order={pickupOrder}
          onClose={() => setPickupOrderId(null)}
          onSuccess={() => showNotice("success", "Retiro registrado correctamente.")}
        />
      )}

      <div className="page-content space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pedidos</h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestioná retiros parciales y consultá reportes de preparación.
            </p>
          </div>
          {/* Tab switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto">
            {[
              { id: "orders", label: "Historial" },
              { id: "reports", label: "Reportes" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && <ReportsPanel />}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
            {/* Sticky controls */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100">
              <div className="px-5 py-4 space-y-3">
                <Notice notice={notice} />

                <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                  <div className="relative w-full md:w-96">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por nombre o ID…"
                      className="w-full border border-slate-200 rounded-full pl-4 pr-24 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded-full hover:bg-slate-100"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                      Orden:
                    </span>
                    <select
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
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                  <span className="text-xs text-slate-500 font-semibold mr-1 whitespace-nowrap">
                    Filtro:
                  </span>
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

                <div className="flex items-center justify-between pt-0.5">
                  <p className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-700">{orders.length}</span> resultados
                  </p>
                </div>
              </div>
            </div>

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
            {!loading && !error && orders.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-base font-semibold text-slate-600">Sin resultados</p>
                <p className="text-sm text-slate-400 mt-1">Cambiá el filtro o la búsqueda.</p>
              </div>
            )}

            {/* MOBILE CARDS */}
            {!loading && !error && orders.length > 0 && (
              <div className="md:hidden p-4 space-y-3">
                {orders.map((order) => {
                  const isOpen = expandedId === order.id;
                  const isBusy = completingId === order.id;
                  const hasPending = order.products?.some((p) => p.status !== "completed");

                  return (
                    <div
                      key={order.id}
                      className="border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">{order.__name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            #{String(order.id).slice(0, 8)}
                          </p>
                          <p className="text-xs text-slate-400">{fmtDateTime(order.orderDate)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <OrderStatusPill isCompleted={order.isCompleted} />
                          <p className="text-sm font-extrabold text-slate-900">
                            {formatCRC(order.__total)}
                          </p>
                        </div>
                      </div>

                      {/* Progress summary */}
                      {!order.isCompleted && (
                        <div className="mb-3">
                          <ProgressBar
                            value={order.products?.reduce((a, p) => a + p.quantityPickedUp, 0) || 0}
                            max={order.__items}
                          />
                          <p className="text-xs text-slate-400 mt-1">
                            {order.products?.reduce((a, p) => a + p.quantityPickedUp, 0) || 0} de{" "}
                            {order.__items} unidades retiradas
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => toggleExpand(order.id)}
                          className="text-sm font-semibold text-rose-700 hover:text-rose-800"
                        >
                          {isOpen ? "Ocultar" : "Ver detalle"} · {order.__items} items
                        </button>

                        <div className="flex items-center gap-2">
                          {hasPending && (
                            <button
                              onClick={() => setPickupOrderId(order.id)}
                              className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors"
                            >
                              Retirar
                            </button>
                          )}
                          {!order.isCompleted && (
                            <button
                              onClick={() => onComplete(order.id)}
                              disabled={isBusy}
                              className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50 transition-colors"
                            >
                              {isBusy ? "…" : "Completar todo"}
                            </button>
                          )}
                        </div>
                      </div>

                      {isOpen && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <ProductsDetail order={order} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* DESKTOP TABLE */}
            {!loading && !error && orders.length > 0 && (
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
                    {orders.map((order) => {
                      const isOpen = expandedId === order.id;
                      const isBusy = completingId === order.id;
                      const pickedUp =
                        order.products?.reduce((a, p) => a + (p.quantityPickedUp || 0), 0) || 0;
                      const hasPending = order.products?.some((p) => p.status !== "completed");

                      return (
                        <React.Fragment key={order.id}>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <OrderStatusPill isCompleted={order.isCompleted} />
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
                                    onClick={() => onComplete(order.id)}
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
OrderStatusPill.propTypes = { isCompleted: PropTypes.bool };
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
});

const OrderItemShape = PropTypes.shape({
  id: PropTypes.string,
  quantity: PropTypes.number,
  quantityPickedUp: PropTypes.number,
  status: PropTypes.string,
  pickedUpAt: PropTypes.string,
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
PickupModal.propTypes = {
  order: OrderShape.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};
