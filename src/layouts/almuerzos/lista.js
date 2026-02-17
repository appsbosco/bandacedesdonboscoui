import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useMutation, useQuery } from "@apollo/client";
import { GET_ORDERS } from "graphql/queries";
import { COMPLETE_ORDER_MUTATION } from "graphql/mutations";
import PropTypes from "prop-types";

// ---------------------------
// Utils (fecha / moneda / total)
// ---------------------------
const formatCurrencyCRC = (value) =>
  `₡${new Intl.NumberFormat("es-CR").format(Number.isFinite(value) ? value : 0)}`;

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber) && value.trim() !== "") {
      const d = new Date(asNumber);
      if (!Number.isNaN(d.getTime())) return d;
    }

    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "object" && value.$date) return toDate(value.$date);

  return null;
}

const formatDate = (value) => {
  const d = toDate(value);
  if (!d) return "Fecha inválida";
  return d.toLocaleString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getFullName = (u) =>
  [u?.name, u?.firstSurName, u?.secondSurName].filter(Boolean).join(" ").trim() || "Sin nombre";

const calcOrderTotal = (order) =>
  (order?.products || []).reduce((acc, p) => {
    const price = Number(p?.productId?.price ?? 0);
    const qty = Number(p?.quantity ?? 0);
    return acc + price * qty;
  }, 0);

const calcItemsCount = (order) =>
  (order?.products || []).reduce((acc, p) => acc + Number(p?.quantity ?? 0), 0);

// ---------------------------
// Small hooks
// ---------------------------
function useDebouncedValue(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

// ---------------------------
// Small UI pieces
// ---------------------------
const StatusPill = ({ isCompleted }) => {
  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
        Completada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
      Pendiente
    </span>
  );
};

const FilterPill = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border
      ${
        active
          ? "bg-primary/10 border-primary/20 text-primary"
          : "bg-white border-default-200 text-default-700 hover:bg-default-50"
      }`}
  >
    {children}
  </button>
);

const SkeletonRow = () => (
  <div className="border border-default-200 rounded-2xl p-4 animate-pulse">
    <div className="h-4 bg-default-200 rounded w-1/3 mb-3" />
    <div className="h-3 bg-default-200 rounded w-1/2 mb-2" />
    <div className="h-3 bg-default-200 rounded w-2/3" />
  </div>
);

const ProductsDetail = ({ order }) => {
  const products = order?.products || [];
  if (products.length === 0) {
    return <p className="text-sm text-default-500">Sin productos</p>;
  }

  return (
    <div className="space-y-2">
      {products.map((p, idx) => {
        const name = p?.productId?.name || "Producto";
        const qty = Number(p?.quantity ?? 0);
        const price = Number(p?.productId?.price ?? 0);
        const lineTotal = qty * price;

        return (
          <div
            key={`${p?.productId?.id ?? "p"}-${idx}`}
            className="flex items-center justify-between gap-3 border-b border-default-200 pb-2 last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-default-900 truncate">{name}</p>
              <p className="text-xs text-default-500">
                Cantidad: <span className="font-medium">{qty}</span> · Precio:{" "}
                <span className="font-medium">{formatCurrencyCRC(price)}</span>
              </p>
            </div>
            <p className="text-sm font-bold text-default-900 whitespace-nowrap">
              {formatCurrencyCRC(lineTotal)}
            </p>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------
// Main Component
// ---------------------------
const ListaAlmuerzos = () => {
  const { loading, error, data } = useQuery(GET_ORDERS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const [expandedId, setExpandedId] = useState(null);

  // UX: filtro por píldoras + orden compacto
  const [filterStatus, setFilterStatus] = useState("all"); // all | pending | completed
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | total_desc | total_asc

  // UX: búsqueda más rápida + debounce
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 180);
  const searchRef = useRef(null);

  // micro-feedback sin libs
  const [notice, setNotice] = useState(null); // { type: 'success'|'error', message }
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  const [completingId, setCompletingId] = useState(null);

  const [completeOrder] = useMutation(COMPLETE_ORDER_MUTATION, {
    update(cache, { data: { completeOrder: completed } }) {
      // ✅ actualiza cache inmediatamente (aunque tu mutation no devuelva todo)
      cache.modify({
        id: cache.identify({ __typename: "Order", id: completed.id }),
        fields: {
          isCompleted() {
            return true;
          },
        },
      });
    },
  });

  const ordersRaw = data?.orders || [];

  const orders = useMemo(() => {
    const enriched = ordersRaw.map((o) => {
      const total = calcOrderTotal(o);
      const itemsCount = calcItemsCount(o);
      const name = getFullName(o?.userId);
      const dateObj = toDate(o?.orderDate);
      const dateMs = dateObj ? dateObj.getTime() : 0;

      return { ...o, __total: total, __itemsCount: itemsCount, __fullName: name, __dateMs: dateMs };
    });

    const byStatus =
      filterStatus === "all"
        ? enriched
        : enriched.filter((o) => (filterStatus === "completed" ? o.isCompleted : !o.isCompleted));

    const q = debouncedSearch.trim().toLowerCase();
    const bySearch =
      q.length === 0
        ? byStatus
        : byStatus.filter((o) => {
            const id = String(o?.id || "").toLowerCase();
            const n = String(o?.__fullName || "").toLowerCase();
            return id.includes(q) || n.includes(q);
          });

    const sorted = [...bySearch].sort((a, b) => {
      if (sortBy === "newest") return (b.__dateMs || 0) - (a.__dateMs || 0);
      if (sortBy === "oldest") return (a.__dateMs || 0) - (b.__dateMs || 0);
      if (sortBy === "total_desc") return (b.__total || 0) - (a.__total || 0);
      if (sortBy === "total_asc") return (a.__total || 0) - (b.__total || 0);
      return 0;
    });

    return sorted;
  }, [ordersRaw, filterStatus, sortBy, debouncedSearch]);

  const stats = useMemo(() => {
    const totalOrders = ordersRaw.length;
    const completedOrders = ordersRaw.filter((o) => o.isCompleted).length;
    const completedPercentage =
      totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
    const totalAmount = ordersRaw.reduce((acc, o) => acc + calcOrderTotal(o), 0);

    return { totalOrders, completedOrders, completedPercentage, totalAmount };
  }, [ordersRaw]);

  const toggleExpand = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // ✅ inmediato (sin confirm) + optimistic UI
  const onComplete = useCallback(
    async (orderId) => {
      try {
        setCompletingId(orderId);

        await completeOrder({
          variables: { orderId },
          optimisticResponse: {
            completeOrder: {
              __typename: "Order",
              id: orderId,
              isCompleted: true,
            },
          },
        });

        setNotice({ type: "success", message: "Orden marcada como completada." });
      } catch (e) {
        console.error(e);
        setNotice({ type: "error", message: "No se pudo completar la orden." });
      } finally {
        setCompletingId(null);
      }
    },
    [completeOrder]
  );

  const clearSearch = () => setSearch("");

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className=" page-content">
        {/* Title (simple) */}
        <div className="flex items-end justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h4 className="text-2xl font-semibold text-default-950">Lista de pedidos</h4>
            <p className="text-sm text-default-500 mt-1">
              Todo lo importante está en el Historial: buscar, filtrar y completar.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid lg:grid-cols-3 sm:grid-cols-2 gap-6 mb-6">
          <div className="border rounded-2xl p-6 overflow-hidden border-default-200 bg-white">
            <p className="text-sm text-default-500 font-medium mb-2">Total de pedidos</p>
            <h4 className="text-3xl text-default-950 font-extrabold">{stats.totalOrders}</h4>
            <p className="text-xs text-default-400 mt-2">Incluye completados y pendientes</p>
          </div>

          <div className="border rounded-2xl p-6 overflow-hidden border-default-200 bg-white">
            <p className="text-sm text-default-500 font-medium mb-2">Monto recaudado</p>
            <h4 className="text-3xl text-default-950 font-extrabold">
              {formatCurrencyCRC(stats.totalAmount)}
            </h4>
            <p className="text-xs text-default-400 mt-2">Suma de todas las órdenes</p>
          </div>

          <div className="border rounded-2xl p-6 overflow-hidden border-default-200 bg-white">
            <p className="text-sm text-default-500 font-medium mb-2">Completadas</p>
            <h4 className="text-3xl text-default-950 font-extrabold">
              {stats.completedPercentage}%
            </h4>
            <p className="text-xs text-default-400 mt-2">
              {stats.completedOrders} completadas de {stats.totalOrders}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="border rounded-2xl border-default-200 bg-white overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-default-200">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-default-900">Historial</h2>
              <p className="text-sm text-default-500">
                Mostrando <span className="font-semibold text-default-900">{orders.length}</span>{" "}
                resultados
              </p>
            </div>
          </div>

          {/* ✅ CONTROLS BAR (STICKY y CERCA) */}
          <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-default-200">
            <div className="p-4 md:p-5 flex flex-col gap-3">
              {/* Notice */}
              {notice && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold border ${
                    notice.type === "success"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {notice.message}
                </div>
              )}

              {/* Search row */}
              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="relative w-full md:w-[420px]">
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o ID…"
                    className="w-full border border-default-200 rounded-full pl-4 pr-24 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {search && (
                      <button
                        onClick={clearSearch}
                        className="px-3 py-1 text-xs rounded-full bg-default-200 hover:bg-default-300"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>

                {/* Sort compact */}
                <div className="flex items-center gap-2 justify-between md:justify-end">
                  <span className="text-xs text-default-500 font-semibold">Orden:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-default-200 rounded-full px-4 py-2 text-sm bg-white"
                  >
                    <option value="newest">Más recientes</option>
                    <option value="oldest">Más antiguos</option>
                    <option value="total_desc">Total: mayor → menor</option>
                    <option value="total_asc">Total: menor → mayor</option>
                  </select>
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs text-default-500 font-semibold mr-1 whitespace-nowrap">
                  Filtro:
                </span>
                <FilterPill active={filterStatus === "all"} onClick={() => setFilterStatus("all")}>
                  Todos
                </FilterPill>
                <FilterPill
                  active={filterStatus === "pending"}
                  onClick={() => setFilterStatus("pending")}
                >
                  Pendientes
                </FilterPill>
                <FilterPill
                  active={filterStatus === "completed"}
                  onClick={() => setFilterStatus("completed")}
                >
                  Completadas
                </FilterPill>

                {(filterStatus !== "all" || search) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStatus("all");
                      setSortBy("newest");
                      setSearch("");
                    }}
                    className="ml-auto px-3 py-1.5 rounded-full text-xs font-bold bg-default-100 border border-default-200 hover:bg-default-200 whitespace-nowrap"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Loading / Error / Empty */}
          {loading && (
            <div className="p-6 grid gap-4">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          )}

          {!loading && error && (
            <div className="p-6">
              <div className="border border-red-200 bg-red-50 rounded-2xl p-5">
                <p className="font-semibold text-red-700">Error al cargar pedidos</p>
                <p className="text-sm text-red-600 mt-1">{error.message}</p>
              </div>
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold text-default-700">No hay pedidos</p>
              <p className="text-sm text-default-500 mt-2">
                Probá cambiar el filtro o la búsqueda.
              </p>
            </div>
          )}

          {/* MOBILE: cards */}
          {!loading && !error && orders.length > 0 && (
            <div className="md:hidden p-4 space-y-4">
              {orders.map((order) => {
                const isOpen = expandedId === order.id;
                const isPending = !order.isCompleted;
                const isBusy = completingId === order.id;

                return (
                  <div
                    key={order.id}
                    className="border border-default-200 rounded-2xl p-4 hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-default-900">{order.__fullName}</p>
                        <p className="text-xs text-default-500 mt-1">
                          {" "}
                          Pedido #{String(order.id).slice(0, 8)}
                        </p>
                        <p className="text-xs text-default-500">{formatDate(order.orderDate)}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <StatusPill isCompleted={order.isCompleted} />
                        <p className="text-sm font-extrabold text-default-900">
                          {formatCurrencyCRC(order.__total)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {isOpen ? "Ocultar detalles" : "Ver detalles"} ·{" "}
                        <span className="text-default-500">{order.__itemsCount} items</span>
                      </button>

                      {isPending ? (
                        <button
                          onClick={() => onComplete(order.id)}
                          disabled={isBusy}
                          className={`px-4 py-2 rounded-full text-sm font-bold transition ${
                            isBusy
                              ? "bg-default-200 text-default-500 cursor-not-allowed"
                              : "bg-red-700 text-white hover:bg-red-800 active:scale-95"
                          }`}
                        >
                          {isBusy ? "..." : "Completar"}
                        </button>
                      ) : null}
                    </div>

                    {isOpen && (
                      <div className="mt-4 bg-default-50 border border-default-200 rounded-2xl p-4">
                        <ProductsDetail order={order} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* DESKTOP: table + expandable details */}
          {!loading && !error && orders.length > 0 && (
            <div className="hidden md:block">
              <div className="relative overflow-x-auto">
                <table className="min-w-full divide-y divide-default-200">
                  <thead className="bg-default-100 sticky top-[132px] z-10">
                    <tr className="text-start">
                      <th className="px-6 py-3 text-sm font-semibold text-default-800 min-w-[10rem]">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-default-800">
                        Nombre completo
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-default-800">Fecha</th>
                      <th className="px-6 py-3 text-sm font-semibold text-default-800">Items</th>
                      <th className="px-6 py-3 text-sm font-semibold text-default-800">Total</th>
                      <th className="px-6 py-3 text-sm font-semibold text-default-800 text-right">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-default-200">
                    {orders.map((order) => {
                      const isOpen = expandedId === order.id;
                      const isPending = !order.isCompleted;
                      const isBusy = completingId === order.id;

                      return (
                        <React.Fragment key={order.id}>
                          <tr className="hover:bg-default-50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <StatusPill isCompleted={order.isCompleted} />
                                <button
                                  onClick={() => toggleExpand(order.id)}
                                  className="text-xs font-semibold text-primary hover:underline"
                                >
                                  {isOpen ? "Ocultar" : "Detalles"}
                                </button>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-default-800">
                              {order.__fullName}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-default-600">
                              {formatDate(order.orderDate)}
                            </td>

                            <td className="px-6 py-4 text-sm text-default-700">
                              <span className="font-semibold text-default-900">
                                {order.__itemsCount}
                              </span>{" "}
                              items
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-default-900">
                              {formatCurrencyCRC(order.__total)}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {isPending ? (
                                <button
                                  onClick={() => onComplete(order.id)}
                                  disabled={isBusy}
                                  className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-bold transition active:scale-95 ${
                                    isBusy
                                      ? "bg-default-200 text-default-500 cursor-not-allowed"
                                      : "bg-red-700 text-white hover:bg-red-800"
                                  }`}
                                >
                                  {isBusy ? "..." : "Completar"}
                                </button>
                              ) : (
                                <span className="text-xs text-default-400">—</span>
                              )}
                            </td>
                          </tr>

                          {isOpen && (
                            <tr className="bg-default-50">
                              <td colSpan={6} className="px-6 pb-6">
                                <div className="mt-3 border border-default-200 rounded-2xl bg-white p-5">
                                  <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm font-bold text-default-900">
                                      Pedido #{String(order.id).slice(0, 8)}
                                    </p>
                                    <p className="text-sm font-extrabold text-default-900">
                                      {formatCurrencyCRC(order.__total)}
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
            </div>
          )}
        </div>
      </div>

      <Footer />
    </DashboardLayout>
  );
};

export default ListaAlmuerzos;

// ---------------------------
// PropTypes (para evitar warnings ESLint)
// ---------------------------
const ProductType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string,
  price: PropTypes.number,
});

const OrderProductType = PropTypes.shape({
  quantity: PropTypes.number,
  productId: ProductType,
});

const UserType = PropTypes.shape({
  name: PropTypes.string,
  firstSurName: PropTypes.string,
  secondSurName: PropTypes.string,
});

const OrderType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isCompleted: PropTypes.bool,
  orderDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
    PropTypes.object,
  ]),
  userId: UserType,
  products: PropTypes.arrayOf(OrderProductType),
});

StatusPill.propTypes = { isCompleted: PropTypes.bool };
StatusPill.defaultProps = { isCompleted: false };

FilterPill.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
FilterPill.defaultProps = { active: false };

ProductsDetail.propTypes = { order: OrderType.isRequired };
