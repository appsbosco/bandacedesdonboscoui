// ===========================
// CATEGORY BAR COMPONENT
// ===========================
import PropTypes from "prop-types";

import React from "react";

const CATEGORIES = [
  { id: "", name: "Todos", icon: "🍽️" },
  { id: "Almuerzo", name: "Almuerzo", icon: "🍱" },
  { id: "Bebidas", name: "Bebidas", icon: "🥤" },
  { id: "Postres", name: "Postres", icon: "🍰" },
];

const CategoryBar = React.memo(({ selectedCategory, onCategoryChange }) => {
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Categorías</h3>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                aria-label={`Filtrar por ${category.name}`}
                aria-pressed={isActive}
                className={`
                  flex flex-col items-center justify-center min-w-[100px] p-4 rounded-xl
                  transition-all duration-200 border-2
                  ${
                    isActive
                      ? "bg-black text-white border-black shadow-lg scale-105"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:shadow-md"
                  }
                `}
              >
                <span className="text-3xl mb-2">{category.icon}</span>
                <span className="text-sm font-semibold whitespace-nowrap">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

CategoryBar.displayName = "CategoryBar";

export default CategoryBar;

// ===========================
// CATEGORY IMAGES (Constants)
// ===========================

export const CATEGORY_IMAGES = {
  Almuerzo: "/assets/images/almuerzo/almuerzo.webp",
  Bebidas: "/assets/images/almuerzo/bebida.webp",
  Postres: "/assets/images/almuerzo/postre.webp",
};

CategoryBar.propTypes = {
  selectedCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
};
