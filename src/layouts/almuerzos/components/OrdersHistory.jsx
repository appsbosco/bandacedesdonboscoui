// ===========================
// ORDERS HISTORY COMPONENT
// ===========================

import React from "react";
import { useQuery } from "@apollo/client";
import { Accordion, AccordionSummary, AccordionDetails, Chip, Skeleton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { GET_ORDERS_BY_USER_OPTIMIZED } from "../../../graphql/queries/orders";
import { formatOrderDate } from "../../../utils/date";
import PropTypes from "prop-types";

const OrderSkeleton = () => (
  <div className="border border-gray-200 rounded-lg p-4 mb-3">
    <Skeleton variant="text" width="60%" height={30} />
    <Skeleton variant="text" width="40%" className="mt-2" />
  </div>
);

const formatCurrencyCRC = (value) =>
  new Intl.NumberFormat("es-CR").format(Number.isFinite(value) ? value : 0);

const getOrderStatus = (order) => (order?.isCompleted ? "completed" : "pending");

const OrderItem = ({ order }) => {
  const status = getOrderStatus(order);

  const statusColor =
    {
      pending: "warning",
      completed: "success",
      cancelled: "error",
    }[status] || "default";

  const statusLabel =
    {
      pending: "Pendiente",
      completed: "Completado",
      cancelled: "Cancelado",
    }[status] || "N/A";

  const total = Array.isArray(order?.products)
    ? order.products.reduce((sum, item) => {
        const price = Number(item?.productId?.price ?? 0);
        const qty = Number(item?.quantity ?? 0);
        return sum + price * qty;
      }, 0)
    : 0;

  return (
    <Accordion className="border border-gray-200 rounded-lg mb-3 shadow-sm">
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`order-${order.id}-content`}
        id={`order-${order.id}-header`}
        className="hover:bg-gray-50"
      >
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <ReceiptIcon className="text-gray-500" />
            <div>
              <p className="font-semibold text-gray-900">Pedido #{String(order.id).slice(0, 8)}</p>
              <p className="text-xs text-gray-500">{formatOrderDate(order.orderDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Chip label={statusLabel} color={statusColor} size="small" className="font-medium" />
            <span className="font-bold text-gray-900">₡{formatCurrencyCRC(total)}</span>
          </div>
        </div>
      </AccordionSummary>

      <AccordionDetails className="bg-gray-50">
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700 text-sm mb-3">Productos:</h4>

          {order?.products?.map((item, idx) => {
            const p = item?.productId;
            const name = p?.name || "Producto eliminado";
            const price = Number(p?.price ?? 0);
            const qty = Number(item?.quantity ?? 0);
            const lineTotal = price * qty;

            return (
              <div
                key={`${p?.id ?? "no-product"}-${idx}`}
                className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{name}</p>
                  <p className="text-xs text-gray-500">Cantidad: {qty}</p>
                </div>

                <p className="font-semibold text-gray-900">₡{formatCurrencyCRC(lineTotal)}</p>
              </div>
            );
          })}
        </div>
      </AccordionDetails>
    </Accordion>
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
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">Mis Pedidos ({orders.length})</h3>
      <div className="space-y-0">
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
  name: PropTypes.string.isRequired,
  quantity: PropTypes.number.isRequired,
  price: PropTypes.number.isRequired,
});

const OrderPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)])
    .isRequired,
  total: PropTypes.number,
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
