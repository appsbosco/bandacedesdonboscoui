// ===========================
// CART REDUCER + HOOK
// ===========================

import { useReducer, useMemo, useCallback } from "react";

// ====== ACTIONS ======
const ACTIONS = {
  ADD_ITEM: "ADD_ITEM",
  UPDATE_QUANTITY: "UPDATE_QUANTITY",
  REMOVE_ITEM: "REMOVE_ITEM",
  CLEAR_CART: "CLEAR_CART",
};

// ====== INITIAL STATE ======
const initialState = {
  items: {}, // { [productId]: { product, quantity } }
};

// ====== REDUCER ======
function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_ITEM: {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items[product.id];

      return {
        ...state,
        items: {
          ...state.items,
          [product.id]: {
            product,
            quantity: existing ? existing.quantity + quantity : quantity,
          },
        },
      };
    }

    case ACTIONS.UPDATE_QUANTITY: {
      const { productId, quantity } = action.payload;

      if (quantity <= 0) {
        const { [productId]: removed, ...rest } = state.items;
        return { ...state, items: rest };
      }

      return {
        ...state,
        items: {
          ...state.items,
          [productId]: {
            ...state.items[productId],
            quantity,
          },
        },
      };
    }

    case ACTIONS.REMOVE_ITEM: {
      const { productId } = action.payload;
      const { [productId]: removed, ...rest } = state.items;
      return { ...state, items: rest };
    }

    case ACTIONS.CLEAR_CART:
      return initialState;

    default:
      return state;
  }
}

// ====== CUSTOM HOOK ======
export function useCart() {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Actions
  const addItem = useCallback((product, quantity = 1) => {
    dispatch({ type: ACTIONS.ADD_ITEM, payload: { product, quantity } });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    dispatch({ type: ACTIONS.UPDATE_QUANTITY, payload: { productId, quantity } });
  }, []);

  const removeItem = useCallback((productId) => {
    dispatch({ type: ACTIONS.REMOVE_ITEM, payload: { productId } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_CART });
  }, []);

  // Memoized selectors
  const cartArray = useMemo(() => Object.values(state.items), [state.items]);

  const totalItems = useMemo(
    () => cartArray.reduce((sum, item) => sum + item.quantity, 0),
    [cartArray]
  );

  const totalPrice = useMemo(
    () => cartArray.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartArray]
  );

  const isEmpty = cartArray.length === 0;

  return {
    items: state.items,
    cartArray,
    totalItems,
    totalPrice,
    isEmpty,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };
}
