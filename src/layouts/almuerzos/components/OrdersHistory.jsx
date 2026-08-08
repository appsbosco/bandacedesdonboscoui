// ===========================
// ORDERS HISTORY COMPONENT
// ===========================

import React from "react";
import { useQuery } from "@apollo/client";
import { Skeleton } from "@mui/material";
import ReceiptIcon from "@mui/icons-material/Receipt";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { GET_ORDERS_BY_USER_OPTIMIZED } from "../../../graphql/queries/orders";
import { formatOrderDate, toDate } from "../../../utils/date";
import PropTypes from "prop-types";

const OrderSkeleton = () => (
  <div className="border border-gray-200 rounded-lg p-4 mb-3">
    <Skeleton variant="text" width="60%" height={30} />
    <Skeleton variant="text" width="40%" className="mt-2" />
  </div>
);

const currencyFormatter = new Intl.NumberFormat("es-CR");
const formatCurrencyCRC = (value) =>
  currencyFormatter.format(Number.isFinite(value) ? value : 0);

const deliveryDateFormatter = new Intl.DateTimeFormat("es-CR", {
  weekday: "long",
  day: "numeric",
  month: "short",
});

const getOrderStatus = (order) => {
  if (order?.isCompleted) return "completed";
  const hasPickup = order?.products?.some((item) => Number(item?.quantityPickedUp ?? 0) > 0);
  return hasPickup ? "partial" : "pending";
};

const getDeliveryLabel = (order) => {
  const firstItem = order?.products?.[0];
  const deliveryDate = toDate(firstItem?.fulfillmentDate);
  if (deliveryDate) {
    const label = deliveryDateFormatter.format(deliveryDate);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return firstItem?.productId?.availableForDays || "Fecha por confirmar";
};

const OrderItem = ({ order }) => {
  const status = getOrderStatus(order);

  const statusMeta =
    {
      pending: { label: "Pendiente", className: "bg-amber-100 text-amber-800" },
      partial: { label: "Retiro parcial", className: "bg-blue-100 text-blue-800" },
      completed: { label: "Retirado", className: "bg-emerald-100 text-emerald-700" },
    }[status] || { label: "Pendiente", className: "bg-slate-100 text-slate-700" };

  const total = Array.isArray(order?.products)
    ? order.products.reduce((sum, item) => {
        const price = Number(item?.productId?.price ?? 0);
        const qty = Number(item?.quantity ?? 0);
        return sum + price * qty;
      }, 0)
    : 0;

  const totalUnits = order?.products?.reduce(
    (sum, item) => sum + Number(item?.quantity ?? 0),
    0
  );
  const primaryProduct = order?.products?.[0]?.productId;
  const productNames = order?.products
    ?.map((item) => item?.productId?.name || "Producto")
    .join(", ");

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex gap-4 p-4 sm:p-5">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-28">
          {primaryProduct?.photo ? (
            <>
              <img
                src={primaryProduct.photo}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-lg"
              />
              <img
                src={primaryProduct.photo}
                alt={primaryProduct.name}
                className="relative h-full w-full object-contain p-1.5"
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-3xl" aria-hidden="true">
              🍽️
            </div>
          )}
          {order.products.length > 1 && (
            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-white">
              +{order.products.length - 1}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-500">Entrega</p>
              <h3 className="mt-0.5 text-base font-extrabold text-slate-950 sm:text-lg">
                {getDeliveryLabel(order)}
              </h3>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-slate-700">
            {productNames}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>
              {totalUnits} producto{totalUnits !== 1 ? "s" : ""}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatOrderDate(order.orderDate)}</span>
          </div>
          <p className="mt-2 text-lg font-black text-slate-950">₡{formatCurrencyCRC(total)}</p>
        </div>
      </div>

      <details className="group border-t border-slate-100">
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between px-4 text-sm font-bold text-slate-800 marker:hidden sm:px-5">
          Ver detalle del pedido
          <KeyboardArrowDownRoundedIcon className="text-slate-500 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
        <div className="space-y-2">
          {order?.products?.map((item) => {
            const p = item?.productId;
            const name = p?.name || "Producto eliminado";
            const price = Number(p?.price ?? 0);
            const qty = Number(item?.quantity ?? 0);
            const lineTotal = price * qty;

            return (
              <div
                key={item?.id ?? p?.id ?? name}
                className="flex items-center justify-between gap-3 border-b border-slate-200 py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{name}</p>
                  <p className="text-xs text-slate-500">Cantidad: {qty}</p>
                </div>

                <p className="font-extrabold text-slate-900">₡{formatCurrencyCRC(lineTotal)}</p>
              </div>
            );
          })}
        </div>
        </div>
      </details>
    </article>
  );
};
const OrdersHistory = ({ userId }) => {
  const { data, loading, error } = useQuery(GET_ORDERS_BY_USER_OPTIMIZED, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <OrderSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-medium">Error al cargar pedidos</p>
        <p className="text-sm text-red-500 mt-1">{error.message}</p>
      </div>
    );
  }

  const orders = data?.orderByUserId || [];

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ReceiptIcon className="text-gray-300 mb-4" style={{ fontSize: 60 }} />
        <p className="text-lg text-gray-500 font-medium">No tienes pedidos aún</p>
        <p className="text-sm text-gray-400 mt-2">Tus pedidos aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="pb-2">
      <div className="mb-4">
        <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Mis pedidos</h2>
        <p className="mt-1 text-sm text-slate-500">
          {orders.length} pedido{orders.length !== 1 ? "s" : ""} registrado
          {orders.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="space-y-3">
        {orders.map((order) => (
          <OrderItem key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
};

export default OrdersHistory;

const OrderProductPropType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  quantity: PropTypes.number.isRequired,
  quantityPickedUp: PropTypes.number,
  status: PropTypes.string,
  fulfillmentDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
    PropTypes.object,
  ]),
  productId: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    price: PropTypes.number,
    category: PropTypes.string,
    photo: PropTypes.string,
    availableForDays: PropTypes.string,
  }),
});

const OrderPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  isCompleted: PropTypes.bool,
  products: PropTypes.arrayOf(OrderProductPropType),
  orderDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
    PropTypes.object,
  ]),
});

OrderItem.propTypes = {
  order: OrderPropType.isRequired,
};

OrdersHistory.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
