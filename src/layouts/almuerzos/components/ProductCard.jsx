// ===========================
// PRODUCT CARD COMPONENT
// ===========================

import React, { useState, useCallback } from "react";
import { IconButton, Chip, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import QuantityStepper from "./QuantityStepper";
import { isProductAvailable, getClosingMessage } from "../../../utils/date";
import PropTypes from "prop-types";

const ProductCard = React.memo(({ product, onAddToCart, onDelete, userRole }) => {
  const [localQuantity, setLocalQuantity] = useState(1);

  const isAvailable = isProductAvailable(product.closingDate);
  const closingMessage = getClosingMessage(product.closingDate);

  const isAdmin = userRole === "Admin" || userRole === "Staff";

  const handleAddToCart = useCallback(() => {
    if (isAvailable) {
      onAddToCart(product, localQuantity);
      setLocalQuantity(1); // Reset after adding
    }
  }, [product, localQuantity, isAvailable, onAddToCart]);

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation();
      if (window.confirm(`¿Eliminar "${product.name}"?`)) {
        onDelete(product.id);
      }
    },
    [product, onDelete]
  );

  return (
    <div className="group relative bg-white border border-gray-200 rounded-2xl overflow-visible pr-12 hover:shadow-2xl hover:border-blue-500 transition-all duration-300">
      {/* Product Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={product.photo}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />

        <div className="absolute top-3 left-0 right-0 mx-2 z-20 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Chip
              label={closingMessage}
              size="small"
              className={`font-semibold ${
                isAvailable ? "bg-white text-black" : "bg-red-500 text-white"
              }`}
              sx={{
                maxWidth: "100%",
                "& .MuiChip-label": {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                },
              }}
            />
          </div>

          {isAdmin && (
            <Tooltip title="Eliminar producto">
              <IconButton
                size="small"
                onClick={handleDelete}
                className="bg-white shadow-lg hover:bg-red-50 shrink-0"
                aria-label={`Eliminar ${product.name}`}
              >
                <DeleteIcon className="text-red-600" fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category & Name */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {product.category}
          </p>
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{product.name}</h3>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">{product.description}</p>

        {/* Available Days (if present) */}
        {product.availableForDays && (
          <p className="text-xs text-blue-600 font-medium">📅 {product.availableForDays}</p>
        )}

        {/* Price & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 min-w-0">
          <div className="text-2xl font-bold text-gray-900">₡{product.price.toLocaleString()}</div>

          <div className="shrink-0">
            <QuantityStepper
              value={localQuantity}
              onChange={setLocalQuantity}
              disabled={!isAvailable}
              size="small"
            />
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!isAvailable}
          aria-label={`Añadir ${product.name} al carrito`}
          className={`
            w-full py-3 rounded-full font-semibold text-sm transition-all duration-200
            ${
              isAvailable
                ? "bg-black text-white hover:bg-gray-800 active:scale-95"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          {isAvailable ? "+ Añadir al carrito" : "No disponible"}
        </button>
      </div>
    </div>
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
