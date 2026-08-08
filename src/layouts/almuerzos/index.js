// ===========================
// ALMUERZOS PAGE (REFACTORED)
// Uber Eats Style + Performance Optimized
// ===========================

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Fab, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

// Layout Components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/CartsNavBar";
import Footer from "examples/Footer";

// Custom Components
import CategoryBar from "./components/CategoryBar";
import ProductGrid from "./components/ProductGrid";
import CartSidebar from "./components/CartSidebar";
import OrdersHistory from "./components/OrdersHistory";
import AddLunchModal from "components/AddLunchModal";
import Toast from "components/Toast";

// Hooks & Utils
import { useCart } from "../../hooks/useCart";
import { GET_PRODUCTS_OPTIMIZED } from "../../graphql/queries/orders";
import {
  CREATE_ORDER_OPTIMIZED,
  DELETE_PRODUCT_OPTIMIZED,
  updateCacheAfterCreateOrder,
  updateCacheAfterDeleteProduct,
} from "../../graphql/mutations/orders";
import { isProductAvailable } from "../../utils/date";
import { CREATE_PRODUCT } from "graphql/mutations";
import { GET_USERS_BY_ID } from "graphql/queries";

// ===========================
// MAIN COMPONENT
// ===========================

const Almuerzos = () => {
  // ====== State ======
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [currentTab, setCurrentTab] = useState(0); // 0: Catálogo, 1: Mis Pedidos
  const [modalOpen, setModalOpen] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
    key: 0,
  });

  useEffect(() => {
    const ignoreResizeObserverNotice = (event) => {
      const message = event?.message || event?.error?.message || "";
      if (message.includes("ResizeObserver loop")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("error", ignoreResizeObserverNotice, true);
    return () => window.removeEventListener("error", ignoreResizeObserverNotice, true);
  }, []);

  // ====== Cart Hook ======
  const {
    cartArray,
    totalPrice,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    isEmpty: isCartEmpty,
  } = useCart();

  // ====== Queries ======
  const { data: userData, loading: userLoading } = useQuery(GET_USERS_BY_ID);
  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
  } = useQuery(GET_PRODUCTS_OPTIMIZED, { fetchPolicy: "cache-first" });

  const userId = userData?.getUser?.id;
  const userRole = userData?.getUser?.role;
  const isAdmin = userRole === "Admin" || userRole === "Staff";

  // ====== Toast helper ======
  const showToast = useCallback((message, severity = "info") => {
    setToast({
      open: true,
      message,
      severity,
      key: Date.now(), // importante para re-disparar
    });
  }, []);

  const closeToast = useCallback(() => {
    setToast((t) => ({ ...t, open: false }));
  }, []);

  // ====== Mutations ======
  const [createOrder, { loading: orderLoading }] = useMutation(CREATE_ORDER_OPTIMIZED, {
    update: (cache, result) => updateCacheAfterCreateOrder(cache, result, userId),
  });

  const [deleteProduct] = useMutation(DELETE_PRODUCT_OPTIMIZED, {
    optimisticResponse: (vars) => ({
      deleteProduct: {
        __typename: "Product",
        id: vars.deleteProductId,
      },
    }),

    update(cache, { data }) {
      const deletedId = data?.deleteProduct?.id;
      if (!deletedId) return;

      cache.modify({
        fields: {
          products(existingRefs = [], { readField }) {
            return existingRefs.filter((ref) => readField("id", ref) !== deletedId);
          },
        },
      });
    },

    onCompleted: () => {
      showToast("Producto ocultado. Los pedidos anteriores se conservan.", "success");
    },
    onError: () => {
      showToast("Error al ocultar producto", "error");
    },
  });

  const [addProduct] = useMutation(CREATE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS_OPTIMIZED }],
    onCompleted: () => {
      setModalOpen(false);
      showToast("Producto agregado exitosamente", "success");
    },
    onError: () => {
      showToast("Error al agregar producto", "error");
    },
  });

  // ====== Handlers ======
  const handleAddToCart = useCallback(
    (product, quantity = 1) => {
      if (!isProductAvailable(product.closingDate)) {
        showToast("Este producto ya no está disponible", "warning");
        return;
      }
      addItem(product, quantity);
      // showToast(`${product.name} añadido al carrito`, "success");
    },
    [addItem, showToast]
  );

  const handleCheckout = useCallback(async () => {
    if (!userId || isCartEmpty) return false;

    const products = cartArray.map(({ product, quantity }) => ({
      productId: product.id,
      quantity,
    }));

    try {
      await createOrder({ variables: { userId, products } });
      return true;
    } catch (error) {
      console.error("Error creating order:", error);
      showToast(`Error al crear pedido: ${error.message}`, "error");
      return false;
    }
  }, [userId, cartArray, isCartEmpty, createOrder, showToast]);

  const handleCheckoutSuccess = useCallback(() => {
    clearCart();
    showToast("¡Pedido creado exitosamente! 🎉", "success");
    setCurrentTab(1);
  }, [clearCart, showToast]);

  const handleDeleteProduct = useCallback(
    async (productId) => {
      try {
        await deleteProduct({
          variables: { deleteProductId: productId },
        });

        removeItem(productId);
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    },
    [deleteProduct, removeItem]
  );

  const handleAddProduct = useCallback(
    async (productData) => {
      try {
        await addProduct({
          variables: {
            name: productData.name,
            description: productData.description,
            price: parseFloat(productData.price),
            availableForDays: productData.availableForDays,
            photo: productData.photo,
            closingDate: productData.closingDate,
            category: productData.category,
          },
        });
      } catch (error) {
        console.error("Error adding product:", error);
      }
    },
    [addProduct]
  );

  // ====== Filtered Products ======
  const filteredProducts = useMemo(() => {
    if (!productsData?.products) return [];
    const searchTerm = productSearch.trim().toLocaleLowerCase("es");
    return productsData.products.filter((product) => {
      const matchesCategory = selectedCategory === "" || product.category === selectedCategory;
      const matchesDay = selectedDay === "" || product.availableForDays === selectedDay;
      const matchesSearch =
        !searchTerm ||
        [product.name, product.description, product.category].some((value) =>
          String(value || "")
            .toLocaleLowerCase("es")
            .includes(searchTerm)
        );
      return matchesCategory && matchesDay && matchesSearch;
    });
  }, [productsData, selectedCategory, selectedDay, productSearch]);

  // ====== Loading State ======
  if (userLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-xl text-gray-500">Cargando...</p>
        </div>
      </DashboardLayout>
    );
  }

  // ====== Render ======
  return (
    <DashboardLayout>
      <div className="min-h-screen overflow-x-hidden bg-white text-slate-950">
        <DashboardNavbar />

        <main className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 sm:px-6 sm:pt-8 lg:px-8">
          <header className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Almuerzos
              </h1>
              <p className="mt-1 text-sm text-slate-500 sm:text-base">
                {currentTab === 0
                  ? "Elegí lo que querés y armá tu pedido."
                  : "Consultá el estado de tus pedidos."}
              </p>
            </div>
            {isAdmin && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                Administración
              </span>
            )}
          </header>

          <div
            className="mb-6 grid grid-cols-2 rounded-full bg-slate-100 p-1"
            role="tablist"
            aria-label="Navegación de almuerzos"
          >
            {[
              { id: 0, label: "Catálogo" },
              { id: 1, label: "Mis pedidos" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={currentTab === tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`min-h-[44px] rounded-full px-4 text-sm font-extrabold transition-[background-color,color,box-shadow] ${
                  currentTab === tab.id
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div
            className={`grid min-w-0 gap-8 ${
              currentTab === 0 && !isCartEmpty
                ? "xl:grid-cols-[minmax(0,1fr)_380px]"
                : "grid-cols-1"
            }`}
          >
            {/* Left Column: Catalog or Orders */}
            <div className="min-w-0">
              {currentTab === 0 ? (
                <div>
                  {/* Category Bar */}
                  <CategoryBar
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                  />

                  <div className="hide-scrollbar flex gap-2 overflow-x-auto border-b border-slate-100 py-4 [scrollbar-width:none]">
                    {[
                      { id: "", label: "Esta semana" },
                      { id: "Sábado", label: "Sábado" },
                      { id: "Domingo", label: "Domingo" },
                    ].map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => setSelectedDay(day.id)}
                        aria-pressed={selectedDay === day.id}
                        className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
                          selectedDay === day.id
                            ? "bg-slate-950 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>

                  {/* Products Section */}
                  <div className="mt-6">
                    <div className="mb-3 flex items-end justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-950">
                          {productSearch
                            ? `Resultados para “${productSearch}”`
                            : selectedCategory || "Para esta semana"}
                        </h2>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {filteredProducts.length} opción
                          {filteredProducts.length !== 1 ? "es" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 sm:hidden">
                          {filteredProducts.length !== 1 ? " Deslizá →" : ""}
                        </span>
                        {isAdmin && (
                          <Tooltip title="Agregar producto">
                            <Fab
                              size="small"
                              onClick={() => setModalOpen(true)}
                              aria-label="Agregar producto"
                              sx={{
                                bgcolor: "#ffffff",
                                color: "black",
                                "&:hover": { bgcolor: "#1e293b" },
                              }}
                            >
                              <AddIcon />
                            </Fab>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    <ProductGrid
                      products={filteredProducts}
                      loading={productsLoading}
                      onAddToCart={handleAddToCart}
                      onDeleteProduct={handleDeleteProduct}
                      userRole={userRole}
                    />

                    {productsError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mt-6">
                        <p className="text-red-600 font-medium">Error al cargar productos</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <OrdersHistory userId={userId} />
              )}
            </div>

            {/* Right Column: Cart Sidebar (Only on Catalog Tab) */}
            {currentTab === 0 && !isCartEmpty && (
              <aside className="min-w-0">
                <CartSidebar
                  cartArray={cartArray}
                  totalPrice={totalPrice}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  onCheckout={handleCheckout}
                  onCheckoutSuccess={handleCheckoutSuccess}
                  isCheckingOut={orderLoading}
                />
              </aside>
            )}
          </div>

          {/* Add Product Modal */}
          {isAdmin && (
            <AddLunchModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Agregar Producto"
              onSubmit={handleAddProduct}
            />
          )}

          <Toast
            open={toast.open}
            message={toast.message}
            severity={toast.severity}
            toastKey={toast.key}
            duration={toast.severity === "success" ? 2800 : 3600}
            onClose={closeToast}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          />

          <div className="mt-16 pb-4 sm:mt-20">
            <Footer links={[]} />
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default Almuerzos;
