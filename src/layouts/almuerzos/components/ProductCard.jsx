// ===========================
// PRODUCT CARD COMPONENT
// ===========================

import React, { useCallback } from "react";
import { IconButton, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { isProductAvailable, getClosingMessage } from "../../../utils/date";
import PropTypes from "prop-types";

const ProductCard = React.memo(({ product, onAddToCart, onDelete, userRole }) => {
  const isAvailable = isProductAvailable(product.closingDate);
  const closingMessage = getClosingMessage(product.closingDate);

  const isAdmin = userRole === "Admin" || userRole === "Staff";

  const handleAddToCart = useCallback(() => {
    if (isAvailable) {
      onAddToCart(product, 1);
    }
  }, [product, isAvailable, onAddToCart]);

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation();
    if (window.confirm(`¿Ocultar "${product.name}" del catálogo? Los pedidos anteriores se conservarán.`)) {
        onDelete(product.id);
      }
    },
    [product, onDelete]
  );

  return (
    <article className="group overflow-hidden bg-white transition-shadow sm:rounded-2xl sm:hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 sm:aspect-[16/10]">
        {product.photo && (
          <img
            src={product.photo}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-xl"
          />
        )}
        {product.photo ? (
          <img
            src={product.photo}
            alt={product.name}
            className="relative h-full w-full object-contain p-2"
            loading="lazy"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
            Sin fotografía
          </div>
        )}
        <span
          className={`absolute left-2 top-2 max-w-[calc(100%-3.5rem)] truncate rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${
            isAvailable ? "bg-white text-slate-800" : "bg-slate-900 text-white"
          }`}
        >
          {closingMessage}
        </span>
        <div className="absolute right-2 top-2 z-10">
          {isAdmin && (
            <Tooltip title="Ocultar producto">
              <IconButton
                size="small"
                onClick={handleDelete}
                className="bg-white shadow-lg hover:bg-red-50 shrink-0"
                aria-label={`Ocultar ${product.name}`}
              >
                <DeleteIcon className="text-red-600" fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isAvailable}
          aria-label={`Añadir ${product.name} al carrito`}
          className={`absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform active:scale-90 ${
            isAvailable
              ? "bg-slate-950 text-white hover:scale-105"
              : "cursor-not-allowed bg-slate-200 text-slate-400"
          }`}
        >
          <AddIcon fontSize="small" />
        </button>
      </div>

      <div className="flex min-w-0 flex-col px-1 pb-2 pt-3 sm:p-3 sm:pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {product.category}
        </p>
        <h3 className="mt-1 line-clamp-2 text-base font-extrabold leading-tight text-slate-950 sm:text-lg">
          {product.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-slate-500">
          {product.description}
        </p>
        {product.availableForDays && (
          <p className="mt-2 text-xs font-bold text-slate-600">📅 {product.availableForDays}</p>
        )}
        <p className="mt-auto pt-3 text-lg font-extrabold text-slate-950">
          ₡{product.price.toLocaleString("es-CR")}
        </p>
      </div>
    </article>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;

const ProductPropType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  category: PropTypes.string,
  photo: PropTypes.string,
  price: PropTypes.number.isRequired,
  closingDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)])
    .isRequired,
  availableForDays: PropTypes.string,
});

ProductCard.propTypes = {
  product: ProductPropType.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  userRole: PropTypes.string,
};

ProductCard.defaultProps = {
  userRole: "",
};
