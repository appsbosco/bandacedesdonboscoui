// ===========================
// CART SIDEBAR COMPONENT (Responsive + UberEats-like open button)
// ===========================

import React from "react";
import PropTypes from "prop-types";
import { Drawer, IconButton, useMediaQuery, Chip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

import QuantityStepper from "./QuantityStepper";

// ---------------------------
// Utils
// ---------------------------
const formatCurrencyCRC = (value) =>
  `₡${new Intl.NumberFormat("es-CR").format(Number.isFinite(value) ? value : 0)}`;

const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// ---------------------------
// UberEats-like Floating Button (Clean pill)
// ---------------------------
const CartOpenButton = React.memo(({ onClick, count, totalPrice, ariaLabel }) => {
  const safeTotal = safeNumber(totalPrice);

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="
        fixed bottom-6 right-6 z-50
        flex items-center gap-3
        bg-black text-white
        rounded-full
        pl-4 pr-3 py-3
        shadow-2xl
        hover:bg-gray-900
        active:scale-95
        transition-all
        ring-1 ring-black/10
      "
      style={{
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
      }}
    >
      {/* Icon bubble */}
      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
        <ShoppingCartIcon style={{ fontSize: 22 }} />
      </span>

      {/* Text */}
      <span className="flex flex-col leading-tight text-left">
        <span className="text-sm font-semibold">Carrito</span>
        {/* total (subtle, very Uber-like) */}
        <span className="text-xs text-white/80 font-medium">{formatCurrencyCRC(safeTotal)}</span>
      </span>

      {/* Count badge */}
      {count > 0 && (
        <span
          className="
            ml-1
            bg-white text-black
            text-xs font-extrabold
            rounded-full
            min-w-[22px] h-[22px]
            px-1
            flex items-center justify-center
          "
          aria-label={`Productos en carrito: ${count}`}
        >
          {count}
        </span>
      )}
    </button>
  );
});

CartOpenButton.displayName = "CartOpenButton";

// ---------------------------
// Cart Item
// ---------------------------
const CartItem = React.memo(({ item, onUpdateQuantity, onRemove }) => {
  const product = item?.product || {};
  const quantity = safeNumber(item?.quantity);
  const price = safeNumber(product?.price);
  const subtotal = price * quantity;

  return (
    <div className="flex gap-3 pb-4 mb-4 border-b border-gray-200">
      {/* Product Image */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        {product?.photo ? (
          <img
            src={product.photo}
            alt={product.name || "Producto"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            Sin foto
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">
          {product?.name || "Producto"}
        </h4>

        <p className="text-xs text-gray-500 mb-2">{formatCurrencyCRC(price)}</p>

        <div className="flex items-center justify-between gap-3">
          <QuantityStepper
            value={quantity}
            onChange={(newQty) => onUpdateQuantity(product.id, newQty)}
            size="small"
          />

          <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
            {formatCurrencyCRC(subtotal)}
          </p>
        </div>
      </div>

      {/* Remove Button */}
      <IconButton
        size="small"
        onClick={() => onRemove(product.id)}
        aria-label={`Eliminar ${product?.name || "producto"}`}
        sx={{
          alignSelf: "flex-start",
          mt: 0.25,
          color: "rgba(107,114,128,1)",
          "&:hover": { color: "#DC2626" },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </div>
  );
});

CartItem.displayName = "CartItem";

// ---------------------------
// Main Cart Content
// ---------------------------
const CartContent = ({
  cartArray,
  totalPrice,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  isCheckingOut,
  onClose,
}) => {
  const isEmpty = !Array.isArray(cartArray) || cartArray.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="relative px-4 py-4 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-center gap-2">
          <ShoppingCartIcon className="text-gray-700" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Tu Orden</h2>
        </div>

        {onClose && (
          <IconButton
            onClick={onClose}
            aria-label="Cerrar carrito"
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(17,24,39,1)",
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <ShoppingCartIcon className="text-gray-400" style={{ fontSize: 34 }} />
            </div>
            <p className="text-base sm:text-lg text-gray-600 font-semibold">
              Tu carrito está vacío
            </p>
            <p className="text-sm text-gray-400 mt-2">Añade productos para comenzar</p>
          </div>
        ) : (
          <div className="space-y-0">
            {cartArray.map((it, idx) => (
              <CartItem
                key={it?.product?.id ?? it?.product?.name ?? idx}
                item={it}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isEmpty && (
        <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-white">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm sm:text-base font-semibold text-gray-700">Total</span>
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 whitespace-nowrap">
                {formatCurrencyCRC(safeNumber(totalPrice))}
              </span>
            </div>

            {/* Checkout */}
            <button
              onClick={onCheckout}
              disabled={isCheckingOut}
              aria-label="Confirmar pedido"
              className={`
                w-full py-3 sm:py-4 rounded-full font-bold text-base transition-all duration-200
                ${
                  isCheckingOut
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800 active:scale-95 shadow-lg"
                }
              `}
            >
              {isCheckingOut ? "Procesando..." : "Confirmar pedido"}
            </button>

            <div className="flex justify-center">
              <Chip
                label="Revisa tu orden antes de confirmar"
                size="small"
                sx={{
                  bgcolor: "rgba(243,244,246,1)",
                  color: "rgba(75,85,99,1)",
                  fontWeight: 600,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------
// Main CartSidebar
// ---------------------------
const CartSidebar = ({
  cartArray,
  totalPrice,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  isCheckingOut,
}) => {
  // Tailwind lg breakpoint: 1024px (drawer on <=1023px)
  const isDrawerMode = useMediaQuery("(max-width: 1023px)");

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopOpen, setDesktopOpen] = React.useState(true);

  const openMobileDrawer = () => setMobileOpen(true);
  const closeMobileDrawer = () => setMobileOpen(false);

  const openDesktop = () => setDesktopOpen(true);
  const closeDesktop = () => setDesktopOpen(false);

  const cartCount = Array.isArray(cartArray) ? cartArray.length : 0;

  // ---------------------------
  // Mobile / Tablet: Drawer
  // ---------------------------
  if (isDrawerMode) {
    return (
      <>
        {/* UberEats-like open button */}
        <CartOpenButton
          onClick={openMobileDrawer}
          count={cartCount}
          totalPrice={totalPrice}
          ariaLabel="Abrir carrito"
        />

        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={closeMobileDrawer}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              width: { xs: "92vw", sm: 420 },
              maxWidth: "100vw",
              height: { xs: "calc(100% - 24px)", sm: "100%" },
              m: { xs: "12px", sm: 0 },
              borderRadius: { xs: 3, sm: 0 },
              overflow: "hidden",
              paddingBottom: "env(safe-area-inset-bottom)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0px 20px 60px rgba(0,0,0,0.18), 0px 2px 10px rgba(0,0,0,0.08)",
            },
          }}
        >
          <CartContent
            cartArray={cartArray}
            totalPrice={totalPrice}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            onCheckout={onCheckout}
            isCheckingOut={isCheckingOut}
            onClose={closeMobileDrawer}
          />
        </Drawer>
      </>
    );
  }

  // ---------------------------
  // Desktop: Sticky sidebar (collapsible)
  // ---------------------------
  return (
    <>
      {!desktopOpen && (
        <CartOpenButton
          onClick={openDesktop}
          count={cartCount}
          totalPrice={totalPrice}
          ariaLabel="Abrir carrito"
        />
      )}

      {desktopOpen && (
        <div className="sticky top-4 h-[calc(100vh-2rem)] bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden w-full lg:w-[360px] xl:w-[420px]">
          <CartContent
            cartArray={cartArray}
            totalPrice={totalPrice}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            onCheckout={onCheckout}
            isCheckingOut={isCheckingOut}
            onClose={closeDesktop}
          />
        </div>
      )}
    </>
  );
};

export default CartSidebar;

// ---------------------------
// PropTypes
// ---------------------------
const ProductPropType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  photo: PropTypes.string,
});

const CartItemPropType = PropTypes.shape({
  product: ProductPropType.isRequired,
  quantity: PropTypes.number.isRequired,
});

CartOpenButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  count: PropTypes.number,
  totalPrice: PropTypes.number,
  ariaLabel: PropTypes.string,
};

CartOpenButton.defaultProps = {
  count: 0,
  totalPrice: 0,
  ariaLabel: "Abrir carrito",
};

CartItem.propTypes = {
  item: CartItemPropType.isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

CartContent.propTypes = {
  cartArray: PropTypes.arrayOf(CartItemPropType).isRequired,
  totalPrice: PropTypes.number.isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onCheckout: PropTypes.func.isRequired,
  isCheckingOut: PropTypes.bool,
  onClose: PropTypes.func,
};

CartContent.defaultProps = {
  isCheckingOut: false,
  onClose: undefined,
};

CartSidebar.propTypes = {
  cartArray: PropTypes.arrayOf(CartItemPropType).isRequired,
  totalPrice: PropTypes.number.isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onCheckout: PropTypes.func.isRequired,
  isCheckingOut: PropTypes.bool,
};

CartSidebar.defaultProps = {
  isCheckingOut: false,
};
