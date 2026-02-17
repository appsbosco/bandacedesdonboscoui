// ===========================
// PRODUCT GRID COMPONENT
// ===========================

import React from "react";
import { Skeleton } from "@mui/material";
import ProductCard from "./ProductCard";
import PropTypes from "prop-types";

// Empty State Component
const EmptyState = ({ message, icon = "🍽️" }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-20">
    <div className="text-6xl mb-4">{icon}</div>
    <p className="text-xl text-gray-500 font-medium">{message}</p>
  </div>
);

// Loading Skeleton
const ProductSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
    <Skeleton variant="rectangular" height={192} />
    <div className="p-4 space-y-3">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="70%" />
      <Skeleton variant="rectangular" height={40} className="rounded-full" />
    </div>
  </div>
);

const ProductGrid = React.memo(({ products, loading, onAddToCart, onDeleteProduct, userRole }) => {
  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!products || products.length === 0) {
    return <EmptyState message="No hay productos disponibles en esta categoría" icon="🔍" />;
  }

  // Products grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onDelete={onDeleteProduct}
          userRole={userRole}
        />
      ))}
    </div>
  );
});

ProductGrid.displayName = "ProductGrid";

export default ProductGrid;

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

EmptyState.propTypes = {
  message: PropTypes.string.isRequired,
  icon: PropTypes.string,
};

EmptyState.defaultProps = {
  icon: "🍽️",
};

ProductGrid.propTypes = {
  products: PropTypes.arrayOf(ProductPropType),
  loading: PropTypes.bool,
  onAddToCart: PropTypes.func.isRequired,
  onDeleteProduct: PropTypes.func.isRequired,
  userRole: PropTypes.string,
};

ProductGrid.defaultProps = {
  products: [],
  loading: false,
  userRole: "",
};
