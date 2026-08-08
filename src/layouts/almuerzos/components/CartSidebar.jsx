// ===========================
// CART SIDEBAR COMPONENT (Responsive + UberEats-like open button)
// ===========================

import React from "react";
import PropTypes from "prop-types";
import { Drawer, IconButton, useMediaQuery } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

import QuantityStepper from "./QuantityStepper";

// ---------------------------
// Utils
// ---------------------------
const currencyFormatter = new Intl.NumberFormat("es-CR");
const formatCurrencyCRC = (value) =>
  `₡${currencyFormatter.format(Number.isFinite(value) ? value : 0)}`;

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
        fixed bottom-4 left-4 right-4 z-[1200]
        flex min-h-[56px] items-center justify-between gap-3
        rounded-xl bg-slate-950 px-4 py-3 text-white
        shadow-[0_12px_30px_rgba(15,23,42,0.28)]
        hover:bg-slate-800
        active:scale-95
        transition-[background-color,transform]
        xl:bottom-8 xl:left-auto xl:right-8 xl:min-w-[250px] xl:rounded-full
      "
      style={{
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
      }}
    >
      <span className="flex items-center gap-2 text-left">
        <ShoppingCartIcon style={{ fontSize: 21 }} />
        <span className="text-sm font-extrabold">
          Ver carrito{count > 0 ? ` · ${count}` : ""}
        </span>
      </span>
      <span className="text-sm font-extrabold">{formatCurrencyCRC(safeTotal)}</span>
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
    <div className="grid grid-cols-[80px_minmax(0,1fr)_36px] gap-3 border-b border-slate-100 py-4 first:pt-0">
      {/* Product Image */}
      <div className="h-20 w-20 overflow-hidden rounded-xl bg-slate-100">
        {product?.photo ? (
          <img
            src={product.photo}
            alt={product.name || "Producto"}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            Sin foto
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="min-w-0">
        <h4 className="line-clamp-2 text-sm font-extrabold leading-tight text-slate-950">
          {product?.name || "Producto"}
        </h4>

        <p className="mb-2 mt-1 text-xs text-slate-500">{formatCurrencyCRC(price)} c/u</p>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <QuantityStepper
            value={quantity}
            onChange={(newQty) => onUpdateQuantity(product.id, newQty)}
            size="small"
          />

          <p className="whitespace-nowrap text-sm font-extrabold text-slate-950">
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
          alignSelf: "start",
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
      <div
        className={`relative border-b border-slate-100 px-5 pb-5 sm:px-6 ${
          onClose ? "pt-20" : "pt-6"
        }`}
      >
        {onClose && (
          <IconButton
            onClick={onClose}
            aria-label="Cerrar carrito"
            sx={{
              position: "absolute",
              left: 12,
              top: 18,
              color: "#0f172a",
              width: 44,
              height: 44,
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
            Tu pedido
          </h2>
          {!isEmpty && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
              {cartArray.length} producto{cartArray.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
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
          <div>
            <div>
              {cartArray.map((it) => (
                <CartItem
                  key={it.product.id}
                  item={it}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemove}
                />
              ))}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="ml-auto mt-4 flex min-h-[44px] items-center gap-2 rounded-full bg-slate-100 px-5 text-sm font-extrabold text-slate-900 transition-colors hover:bg-slate-200"
              >
                <span className="text-xl" aria-hidden="true">
                  +
                </span>
                Agregar productos
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isEmpty && (
        <div
          className="shrink-0 border-t border-slate-100 bg-white px-5 pt-4 sm:px-6"
          style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-base font-bold text-slate-700">Subtotal</span>
            <span className="whitespace-nowrap text-2xl font-black text-slate-950">
              {formatCurrencyCRC(safeNumber(totalPrice))}
            </span>
          </div>
          <button
            onClick={onCheckout}
            disabled={isCheckingOut}
            aria-label="Confirmar pedido"
            className={`min-h-[54px] w-full rounded-xl text-base font-extrabold transition-[background-color,transform] ${
              isCheckingOut
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : "bg-slate-950 text-white hover:bg-slate-800 active:scale-[0.98]"
            }`}
          >
            {isCheckingOut ? "Procesando…" : "Confirmar pedido"}
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            Revisá cantidades y productos antes de confirmar.
          </p>
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
  onCheckoutSuccess,
  isCheckingOut,
}) => {
  const isDrawerMode = useMediaQuery("(max-width: 1279px)");

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const openMobileDrawer = React.useCallback(() => setMobileOpen(true), []);
  const closeMobileDrawer = React.useCallback(() => setMobileOpen(false), []);

  const cartCount = Array.isArray(cartArray)
    ? cartArray.reduce((total, item) => total + safeNumber(item.quantity), 0)
    : 0;

  const submitOrder = React.useCallback(async () => {
    const created = await onCheckout();
    if (!created) return;

    if (isDrawerMode) {
      closeMobileDrawer();
      window.setTimeout(onCheckoutSuccess, 240);
      return;
    }

    onCheckoutSuccess();
  }, [closeMobileDrawer, isDrawerMode, onCheckout, onCheckoutSuccess]);

  // ---------------------------
  // Mobile / Tablet: Drawer
  // ---------------------------
  if (isDrawerMode) {
    return (
      <>
        {!mobileOpen && (
          <CartOpenButton
            onClick={openMobileDrawer}
            count={cartCount}
            totalPrice={totalPrice}
            ariaLabel="Abrir carrito"
          />
        )}

        <Drawer
          anchor="bottom"
          open={mobileOpen}
          onClose={closeMobileDrawer}
          sx={{
            zIndex: 1400,
            width: "100vw",
            "& .MuiDrawer-paper": {
              margin: 0,
              width: "100vw",
              backdropFilter: "none",
            },
          }}
          ModalProps={{ keepMounted: false }}
          PaperProps={{
            sx: {
              width: "100%",
              maxWidth: "100vw",
              height: "100dvh",
              maxHeight: "100dvh",
              margin: 0,
              borderRadius: 0,
              backgroundColor: "#fff",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 -16px 50px rgba(15,23,42,0.18)",
            },
          }}
        >
          <CartContent
            cartArray={cartArray}
            totalPrice={totalPrice}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            onCheckout={submitOrder}
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
    <div className="sticky top-4 h-[calc(100vh-2rem)] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CartContent
        cartArray={cartArray}
        totalPrice={totalPrice}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
        onCheckout={submitOrder}
        isCheckingOut={isCheckingOut}
      />
    </div>
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
  onCheckoutSuccess: PropTypes.func.isRequired,
  isCheckingOut: PropTypes.bool,
};

CartSidebar.defaultProps = {
  isCheckingOut: false,
};
