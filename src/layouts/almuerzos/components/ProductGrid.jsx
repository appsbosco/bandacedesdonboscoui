// ===========================
// PRODUCT GRID COMPONENT
// ===========================

import React from "react";
import { Skeleton } from "@mui/material";
import ProductCard from "./ProductCard";
import PropTypes from "prop-types";

// Empty State Component
const EmptyState = ({ message, icon = "🍽️" }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
      {icon}
    </div>
    <p className="text-base font-bold text-slate-700">{message}</p>
    <p className="mt-1 text-sm text-slate-400">Probá con otra categoría.</p>
  </div>
);

// Loading Skeleton
const ProductSkeleton = () => (
  <div className="w-[82%] max-w-[340px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:min-w-0 sm:overflow-hidden sm:rounded-2xl">
    <Skeleton variant="rectangular" className="aspect-[16/10] rounded-2xl" />
    <div className="space-y-2 px-1 py-3 sm:p-3">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="70%" />
    </div>
  </div>
);

const ProductGrid = React.memo(({ products, loading, onAddToCart, onDeleteProduct, userRole }) => {
  // Loading state
  if (loading) {
    return (
      <div className="hide-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 pr-16 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-3">
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
    <div className="hide-scrollbar -mx-4 flex snap-x snap-mandatory scroll-smooth scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 pr-16 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-3">
      {products.map((product) => (
        <div
          key={product.id}
          className="w-[82%] max-w-[340px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:min-w-0"
        >
          <ProductCard
            product={product}
            onAddToCart={onAddToCart}
            onDelete={onDeleteProduct}
            userRole={userRole}
          />
        </div>
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
