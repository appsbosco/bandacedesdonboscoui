// ===========================
// ALMUERZOS PAGE (REFACTORED)
// Uber Eats Style + Performance Optimized
// ===========================

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Tabs, Tab, Box, Fab, Tooltip } from "@mui/material";
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

// Assets
import HeroBg from "../../assets/images/almuerzo/bg.jpg";

// ===========================
// MAIN COMPONENT
// ===========================

const Almuerzos = () => {
  // ====== State ======
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentTab, setCurrentTab] = useState(0); // 0: Catálogo, 1: Mis Pedidos
  const [modalOpen, setModalOpen] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
    key: 0,
  });

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
    onCompleted: () => {
      clearCart();
      showToast("¡Pedido creado exitosamente! 🎉", "success");
      setCurrentTab(1); // Switch to "Mis Pedidos" tab
    },
    onError: (error) => {
      showToast(`Error al crear pedido: ${error.message}`, "error");
    },
  });

  const [deleteProduct] = useMutation(DELETE_PRODUCT_OPTIMIZED, {
    update: updateCacheAfterDeleteProduct,
    onCompleted: () => {
      showToast("Producto eliminado exitosamente", "success");
    },
    onError: () => {
      showToast("Error al eliminar producto", "error");
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
      showToast(`${product.name} añadido al carrito`, "success");
    },
    [addItem, showToast]
  );

  const handleCheckout = useCallback(async () => {
    if (!userId || isCartEmpty) return;

    const products = cartArray.map(({ product, quantity }) => ({
      productId: product.id,
      quantity,
    }));

    try {
      await createOrder({ variables: { userId, products } });
    } catch (error) {
      console.error("Error creating order:", error);
    }
  }, [userId, cartArray, isCartEmpty, createOrder]);

  const handleDeleteProduct = useCallback(
    async (productId) => {
      try {
        await deleteProduct({ variables: { deleteProductId: productId } });
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    },
    [deleteProduct]
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
    return productsData.products.filter(
      (p) => selectedCategory === "" || p.category === selectedCategory
    );
  }, [productsData, selectedCategory]);

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
      <div className="overflow-x-hidden">
        <DashboardNavbar />

        {/* HERO (ultra clean) */}
        <div className="mb-6 mt-3">
          <div className="relative overflow-hidden rounded-2xl border border-default-200 bg-white">
            {/* Imagen sutil */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-10"
              style={{ backgroundImage: `url(${HeroBg})` }}
              aria-hidden="true"
            />
            {/* Overlay blanco para mantenerlo limpio */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/70" />

            <div className="relative p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-default-950 leading-tight">
                    Almuerzos
                  </h1>
                  <p className="text-sm text-default-600 mt-1">
                    {currentTab === 0
                      ? "Elegí tus productos y confirmá."
                      : "Tus pedidos recientes aparecerán aquí."}
                  </p>
                </div>

                {isAdmin && (
                  <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border border-default-200 bg-default-50 text-default-700">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Catálogo / Mis Pedidos */}
        <Box className="mb-6">
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            aria-label="Navegación principal"
            className="border-b border-gray-200"
          >
            <Tab label="🍽️ Catálogo" />
            <Tab label="📋 Mis Pedidos" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <div className="grid xl:grid-cols-3 gap-6 mb-8 min-w-0">
          {/* Left Column: Catalog or Orders */}
          <div className="xl:col-span-2 min-w-0">
            {currentTab === 0 ? (
              <div>
                {/* Category Bar */}
                <CategoryBar
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />

                {/* Products Section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
                    {isAdmin && (
                      <Tooltip title="Agregar producto">
                        <Fab
                          color="primary"
                          size="small"
                          onClick={() => setModalOpen(true)}
                          aria-label="Agregar producto"
                        >
                          <AddIcon />
                        </Fab>
                      </Tooltip>
                    )}
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
          {currentTab === 0 && (
            <div className="xl:col-span-1 min-w-0">
              <CartSidebar
                cartArray={cartArray}
                totalPrice={totalPrice}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
                onCheckout={handleCheckout}
                isCheckingOut={orderLoading}
              />
            </div>
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

        <Footer />
      </div>
    </DashboardLayout>
  );
};

export default Almuerzos;
